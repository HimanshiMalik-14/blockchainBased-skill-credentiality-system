import { verifyAccessToken } from "./auth.tokens.js";
import { User } from "../users/user.model.js";

export async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return next();
    const token = auth.slice("Bearer ".length);
    const decoded = verifyAccessToken(token);
    const userId = decoded?.sub;
    if (!userId) return next();

    const user = await User.findOne({ userId }).lean();
    if (!user || user.status !== "ACTIVE") return next();

    req.auth = { userId: user.userId, role: user.role, institutionId: user.institutionId ?? null };
    next();
  } catch {
    next();
  }
}

