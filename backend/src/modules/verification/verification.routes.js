import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ethers } from "ethers";

import { Certificate } from "../certificates/certificate.model.js";
import { VerificationLog } from "./verificationLog.model.js";
import { optionalAuth } from "../auth/auth.optional.js";
import { HttpError } from "../../shared/httpError.js";
import { getCredentialContract, isChainConfigured } from "../blockchain/credentialContract.js";

export const verificationRouter = Router();

// Public-ish verification endpoint (supports logged-in verifier too).
verificationRouter.get("/:certificateId", optionalAuth, async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).lean();

    let result;
    let onChainValid = false;
    let details = {};

    if (!cert) {
      result = "NOT_FOUND";
    } else if (cert.status === "REVOKED") {
      result = "REVOKED";
    } else if (isChainConfigured()) {
      try {
        const contract = getCredentialContract();
        onChainValid = await contract.verifyCertificate(cert.certificateHash);
        result = onChainValid ? "VALID" : "INVALID";
      } catch (e) {
        throw new HttpError(502, "Blockchain verification failed", String(e?.shortMessage ?? e?.message ?? e));
      }
      details = {
        certificateHash: cert.certificateHash,
        txHash: cert.blockchain?.txHash ?? null,
        contractAddress: cert.blockchain?.contractAddress ?? null
      };
    } else {
      result = cert.status === "ISSUED" ? "VALID" : "INVALID";
      details = {
        certificateHash: cert.certificateHash,
        txHash: cert.blockchain?.txHash ?? null,
        contractAddress: cert.blockchain?.contractAddress ?? null
      };
    }

    await VerificationLog.create({
      verificationId: `ver_${nanoid(12)}`,
      certificateId: req.params.certificateId,
      verifierId: req.auth?.userId ?? null,
      method: "ID",
      timestamp: new Date(),
      result,
      details
    });

    res.json({
      result,
      onChainValid,
      certificate: cert
        ? {
            certificateId: cert.certificateId,
            learnerId: cert.learnerId,
            institutionId: cert.institutionId,
            courseName: cert.courseName,
            issueDate: cert.issueDate,
            status: cert.status,
            certificateHash: cert.certificateHash,
            metadataUri: cert.metadataUri ?? null,
            pdfUri: cert.pdfUri ?? null,
            blockchain: cert.blockchain ?? null
          }
        : null
    });
  } catch (err) {
    next(err);
  }
});

// Verify by hash (useful for integrations / QR payloads)
verificationRouter.post("/hash", optionalAuth, async (req, res, next) => {
  try {
    const schema = z.object({ certificateHash: z.string().min(1) });
    const body = schema.parse(req.body);
    const hash = body.certificateHash;
    if (!ethers.isHexString(hash, 32)) throw new HttpError(400, "Invalid certificateHash");

    const cert = await Certificate.findOne({ certificateHash: hash }).lean();
    let onChainValid = false;
    let result;
    if (!cert) result = "NOT_FOUND";
    else if (cert.status === "REVOKED") result = "REVOKED";
    else if (isChainConfigured()) {
      try {
        const contract = getCredentialContract();
        onChainValid = await contract.verifyCertificate(hash);
        result = onChainValid ? "VALID" : "INVALID";
      } catch (e) {
        throw new HttpError(502, "Blockchain verification failed", String(e?.shortMessage ?? e?.message ?? e));
      }
    } else {
      result = cert.status === "ISSUED" ? "VALID" : "INVALID";
    }

    await VerificationLog.create({
      verificationId: `ver_${nanoid(12)}`,
      certificateId: cert?.certificateId ?? "unknown",
      verifierId: req.auth?.userId ?? null,
      method: "API",
      timestamp: new Date(),
      result,
      details: { certificateHash: hash }
    });

    res.json({ result, onChainValid, certificateId: cert?.certificateId ?? null });
  } catch (err) {
    next(err);
  }
});

