import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";

import { Institution } from "./institution.model.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { HttpError } from "../../shared/httpError.js";

export const institutionRouter = Router();

// Admin: create institution (approval handled separately)
institutionRouter.post("/", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      location: z.string().optional(),
      adminContact: z
        .object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional()
        })
        .optional(),
      issuerWalletAddress: z.string().optional()
    });

    const body = schema.parse(req.body);
    const inst = await Institution.create({
      institutionId: `inst_${nanoid(10)}`,
      name: body.name,
      location: body.location,
      adminContact: body.adminContact,
      issuerWalletAddress: body.issuerWalletAddress?.toLowerCase(),
      accreditationStatus: "PENDING"
    });
    res.status(201).json({ institution: inst });
  } catch (err) {
    next(err);
  }
});

// Admin: approve/suspend institution
institutionRouter.post("/:institutionId/status", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const schema = z.object({
      accreditationStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"])
    });
    const body = schema.parse(req.body);
    const inst = await Institution.findOneAndUpdate(
      { institutionId: req.params.institutionId },
      { $set: { accreditationStatus: body.accreditationStatus } },
      { new: true }
    ).lean();
    if (!inst) throw new HttpError(404, "Institution not found");
    res.json({ institution: inst });
  } catch (err) {
    next(err);
  }
});

institutionRouter.get("/", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const list = await Institution.find({}).sort({ createdAt: -1 }).lean();
    res.json({ institutions: list });
  } catch (err) {
    next(err);
  }
});

institutionRouter.get("/:institutionId", requireAuth, async (req, res, next) => {
  try {
    const inst = await Institution.findOne({ institutionId: req.params.institutionId }).lean();
    if (!inst) throw new HttpError(404, "Institution not found");

    // Non-admins can only view their own institution (if they are INSTITUTION role)
    if (req.auth.role !== "ADMIN") {
      if (req.auth.institutionId !== inst.institutionId) throw new HttpError(403, "Forbidden");
    }

    res.json({ institution: inst });
  } catch (err) {
    next(err);
  }
});

