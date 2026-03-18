import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { ethers } from "ethers";

import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { HttpError } from "../../shared/httpError.js";
import { User } from "../users/user.model.js";
import { Institution } from "../institutions/institution.model.js";
import { Certificate } from "./certificate.model.js";
import { BlockchainTransaction } from "../blockchainTransactions/blockchainTransaction.model.js";
import { canonicalJSONStringify } from "../../shared/canonicalJson.js";
import { getCredentialContract } from "../blockchain/credentialContract.js";
import { env } from "../../shared/env.js";
import { guessNetworkName } from "../../shared/chainNetwork.js";

export const certificateRouter = Router();

// Institution issues a certificate (single).
certificateRouter.post(
  "/issue",
  requireAuth,
  requireRole(["INSTITUTION", "ADMIN"]),
  async (req, res, next) => {
    try {
      const schema = z.object({
        institutionId: z.string().min(1).optional(),
        learnerId: z.string().min(1),
        courseName: z.string().min(1),
        issueDate: z.coerce.date().optional(),
        templateId: z.string().optional(),
        templateVersion: z.string().optional(),
        metadataUri: z.string().optional(),
        pdfUri: z.string().optional()
      });
      const body = schema.parse(req.body);

      const issuerInstitutionId = req.auth.role === "ADMIN" ? null : req.auth.institutionId;
      const institutionId = issuerInstitutionId ?? body.institutionId;
      if (!institutionId) throw new HttpError(400, "institutionId missing for issuer");

      const inst = await Institution.findOne({ institutionId }).lean();
      if (!inst) throw new HttpError(404, "Institution not found");
      if (inst.accreditationStatus !== "APPROVED") throw new HttpError(403, "Institution is not approved");

      const learner = await User.findOne({ userId: body.learnerId, role: "LEARNER" }).lean();
      if (!learner) throw new HttpError(404, "Learner not found");

      const issueDate = body.issueDate ?? new Date();

      // Build canonical certificate payload for hashing.
      const payload = {
        certificateId: null, // excluded from hash to allow server-generated IDs? keep null for deterministic content hash
        learnerId: learner.userId,
        institutionId: inst.institutionId,
        courseName: body.courseName,
        issueDate: issueDate.toISOString(),
        templateId: body.templateId ?? null,
        templateVersion: body.templateVersion ?? null,
        metadataUri: body.metadataUri ?? null,
        pdfUri: body.pdfUri ?? null
      };

      const canonical = canonicalJSONStringify(payload);
      const certificateHash = ethers.keccak256(ethers.toUtf8Bytes(canonical));

      const existing = await Certificate.findOne({ certificateHash }).lean();
      if (existing) throw new HttpError(409, "Duplicate certificate", { certificateId: existing.certificateId });

      const certificateId = `cert_${nanoid(14)}`;
      await Certificate.create({
        certificateId,
        learnerId: learner.userId,
        institutionId: inst.institutionId,
        courseName: body.courseName,
        issueDate,
        templateId: body.templateId,
        templateVersion: body.templateVersion,
        metadataUri: body.metadataUri,
        pdfUri: body.pdfUri,
        certificateHash,
        status: "PENDING_CHAIN"
      });

      // On-chain issuance (relayer mode)
      const contract = getCredentialContract();
      const learnerAddress = learner.walletAddress ?? ethers.ZeroAddress;
      const uri = body.metadataUri ?? "";

      let tx;
      try {
        tx = await contract.issueCertificate(certificateHash, learnerAddress, uri);
      } catch (e) {
        await Certificate.updateOne({ certificateId }, { $set: { status: "DRAFT" } });
        throw new HttpError(502, "Blockchain issuance failed", String(e?.shortMessage ?? e?.message ?? e));
      }

      await BlockchainTransaction.create({
        txHash: tx.hash,
        certificateId,
        network: env.CHAIN_ID ? guessNetworkName(env.CHAIN_ID) : undefined,
        chainId: env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined,
        from: tx.from?.toLowerCase?.() ?? undefined,
        to: tx.to?.toLowerCase?.() ?? undefined,
        contractAddress: tx.to?.toLowerCase?.(),
        status: "SUBMITTED"
      });

      // Best-effort: wait for confirmation once (keeps API simple). In production, move to queue/worker.
      const receipt = await tx.wait(1);

      await BlockchainTransaction.updateOne(
        { txHash: tx.hash },
        {
          $set: {
            status: receipt?.status === 1 ? "CONFIRMED" : "FAILED",
            blockNumber: receipt?.blockNumber ?? null,
            timestamp: new Date(),
            gasUsed: receipt?.gasUsed?.toString?.()
          }
        }
      );

      if (receipt?.status !== 1) {
        await Certificate.updateOne({ certificateId }, { $set: { status: "DRAFT" } });
        throw new HttpError(502, "Blockchain transaction failed");
      }

      await Certificate.updateOne(
        { certificateId },
        {
          $set: {
            status: "ISSUED",
            blockchain: {
              network: env.CHAIN_ID ? guessNetworkName(env.CHAIN_ID) : undefined,
              chainId: env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined,
              contractAddress: contract.target?.toString?.()?.toLowerCase?.(),
              txHash: tx.hash,
              blockNumber: receipt.blockNumber,
              issuedAt: new Date()
            }
          }
        }
      );

      const issued = await Certificate.findOne({ certificateId }).lean();
      res.status(201).json({ certificate: issued });
    } catch (err) {
      next(err);
    }
  }
);

// List certificates (institution: own only; admin: all)
certificateRouter.get("/", requireAuth, requireRole(["INSTITUTION", "ADMIN"]), async (req, res, next) => {
  try {
    const filter = req.auth.role === "ADMIN" ? {} : { institutionId: req.auth.institutionId };
    const list = await Certificate.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ certificates: list });
  } catch (err) {
    next(err);
  }
});

// Batch issuance (array of { learnerId, courseName, templateId?, metadataUri?, pdfUri? })
certificateRouter.post(
  "/issue/batch",
  requireAuth,
  requireRole(["INSTITUTION", "ADMIN"]),
  async (req, res, next) => {
    try {
      const schema = z.object({
        institutionId: z.string().min(1).optional(),
        items: z.array(
          z.object({
            learnerId: z.string().min(1),
            courseName: z.string().min(1),
            templateId: z.string().optional(),
            templateVersion: z.string().optional(),
            metadataUri: z.string().optional(),
            pdfUri: z.string().optional()
          })
        )
      });
      const { institutionId: bodyInstId, items } = schema.parse(req.body);
      const institutionId = req.auth.role === "ADMIN" ? bodyInstId : req.auth.institutionId;
      if (!institutionId) throw new HttpError(400, "institutionId required");

      const inst = await Institution.findOne({ institutionId }).lean();
      if (!inst) throw new HttpError(404, "Institution not found");
      if (inst.accreditationStatus !== "APPROVED") throw new HttpError(403, "Institution not approved");

      const results = [];
      for (const item of items) {
        try {
          const learner = await User.findOne({ userId: item.learnerId, role: "LEARNER" }).lean();
          if (!learner) {
            results.push({ learnerId: item.learnerId, success: false, error: "Learner not found" });
            continue;
          }
          const issueDate = new Date();
          const payload = {
            certificateId: null,
            learnerId: learner.userId,
            institutionId: inst.institutionId,
            courseName: item.courseName,
            issueDate: issueDate.toISOString(),
            templateId: item.templateId ?? null,
            templateVersion: item.templateVersion ?? null,
            metadataUri: item.metadataUri ?? null,
            pdfUri: item.pdfUri ?? null
          };
          const canonical = canonicalJSONStringify(payload);
          const certificateHash = ethers.keccak256(ethers.toUtf8Bytes(canonical));
          const existing = await Certificate.findOne({ certificateHash }).lean();
          if (existing) {
            results.push({ learnerId: item.learnerId, success: false, error: "Duplicate certificate" });
            continue;
          }
          const certificateId = `cert_${nanoid(14)}`;
          await Certificate.create({
            certificateId,
            learnerId: learner.userId,
            institutionId: inst.institutionId,
            courseName: item.courseName,
            issueDate,
            templateId: item.templateId,
            templateVersion: item.templateVersion,
            metadataUri: item.metadataUri,
            pdfUri: item.pdfUri,
            certificateHash,
            status: "PENDING_CHAIN"
          });
          const contract = getCredentialContract();
          const learnerAddress = learner.walletAddress ?? ethers.ZeroAddress;
          const uri = item.metadataUri ?? "";
          const tx = await contract.issueCertificate(certificateHash, learnerAddress, uri);
          await BlockchainTransaction.create({
            txHash: tx.hash,
            certificateId,
            network: env.CHAIN_ID ? guessNetworkName(env.CHAIN_ID) : undefined,
            chainId: env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined,
            from: tx.from?.toLowerCase?.() ?? undefined,
            to: tx.to?.toLowerCase?.() ?? undefined,
            contractAddress: tx.to?.toLowerCase?.(),
            status: "SUBMITTED"
          });
          const receipt = await tx.wait(1);
          await BlockchainTransaction.updateOne(
            { txHash: tx.hash },
            {
              $set: {
                status: receipt?.status === 1 ? "CONFIRMED" : "FAILED",
                blockNumber: receipt?.blockNumber ?? null,
                timestamp: new Date(),
                gasUsed: receipt?.gasUsed?.toString?.()
              }
            }
          );
          if (receipt?.status !== 1) {
            await Certificate.updateOne({ certificateId }, { $set: { status: "DRAFT" } });
            results.push({ learnerId: item.learnerId, success: false, error: "Blockchain tx failed" });
            continue;
          }
          await Certificate.updateOne(
            { certificateId },
            {
              $set: {
                status: "ISSUED",
                blockchain: {
                  network: env.CHAIN_ID ? guessNetworkName(env.CHAIN_ID) : undefined,
                  chainId: env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined,
                  contractAddress: contract.target?.toString?.()?.toLowerCase?.(),
                  txHash: tx.hash,
                  blockNumber: receipt.blockNumber,
                  issuedAt: new Date()
                }
              }
            }
          );
          const issued = await Certificate.findOne({ certificateId }).lean();
          results.push({ learnerId: item.learnerId, success: true, certificate: issued });
        } catch (e) {
          results.push({
            learnerId: item.learnerId,
            success: false,
            error: String(e?.shortMessage ?? e?.message ?? e)
          });
        }
      }
      res.status(201).json({ results });
    } catch (err) {
      next(err);
    }
  }
);

// Learner / institution / admin can fetch certificate details (basic gate).
certificateRouter.get("/:certificateId", requireAuth, async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).lean();
    if (!cert) throw new HttpError(404, "Certificate not found");

    if (req.auth.role === "LEARNER" && cert.learnerId !== req.auth.userId) throw new HttpError(403, "Forbidden");
    if (req.auth.role === "INSTITUTION" && cert.institutionId !== req.auth.institutionId)
      throw new HttpError(403, "Forbidden");

    res.json({ certificate: cert });
  } catch (err) {
    next(err);
  }
});

