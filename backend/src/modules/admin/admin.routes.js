import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { User } from "../users/user.model.js";
import { Certificate } from "../certificates/certificate.model.js";
import { Institution } from "../institutions/institution.model.js";
import { VerificationLog } from "../verification/verificationLog.model.js";

export const adminRouter = Router();

adminRouter.get("/users", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/analytics", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const [certCount, verifCount, instCount] = await Promise.all([
      Certificate.countDocuments({ status: "ISSUED" }),
      VerificationLog.countDocuments(),
      Institution.countDocuments({ accreditationStatus: "APPROVED" })
    ]);
    const certsByInstitution = await Certificate.aggregate([
      { $match: { status: "ISSUED" } },
      { $group: { _id: "$institutionId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const verifsByResult = await VerificationLog.aggregate([
      { $group: { _id: "$result", count: { $sum: 1 } } }
    ]);
    res.json({
      certificatesIssued: certCount,
      verificationRequests: verifCount,
      approvedInstitutions: instCount,
      certificatesByInstitution: certsByInstitution,
      verificationsByResult: verifsByResult
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/verification-logs", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const logs = await VerificationLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/credentials", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const certs = await Certificate.find({}).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ certificates: certs });
  } catch (err) {
    next(err);
  }
});
