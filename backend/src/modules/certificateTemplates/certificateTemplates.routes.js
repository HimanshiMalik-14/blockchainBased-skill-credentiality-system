import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { HttpError } from "../../shared/httpError.js";
import { CertificateTemplate } from "./certificateTemplate.model.js";

export const certificateTemplatesRouter = Router();

certificateTemplatesRouter.get("/", requireAuth, requireRole(["ADMIN", "INSTITUTION"]), async (req, res, next) => {
  try {
    const list = await CertificateTemplate.find({}).sort({ createdAt: -1 }).lean();
    res.json({ templates: list });
  } catch (err) {
    next(err);
  }
});

certificateTemplatesRouter.post("/", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(1), version: z.string().optional() });
    const body = schema.parse(req.body);
    const tpl = await CertificateTemplate.create({
      templateId: `tpl_${nanoid(10)}`,
      name: body.name,
      version: body.version ?? "1.0",
      status: "DRAFT"
    });
    res.status(201).json({ template: tpl });
  } catch (err) {
    next(err);
  }
});

certificateTemplatesRouter.post("/:templateId/approve", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const tpl = await CertificateTemplate.findOneAndUpdate(
      { templateId: req.params.templateId },
      { $set: { approvedByAdmin: true, status: "APPROVED" } },
      { new: true }
    ).lean();
    if (!tpl) throw new HttpError(404, "Template not found");
    res.json({ template: tpl });
  } catch (err) {
    next(err);
  }
});
