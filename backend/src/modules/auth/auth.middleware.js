import { HttpError } from "../../shared/httpError.js";
import { verifyAccessToken } from "./auth.tokens.js";
import { User } from "../users/user.model.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw new HttpError(401, "Missing token");
    const token = auth.slice("Bearer ".length);

    const decoded = verifyAccessToken(token);
    const userId = decoded?.sub;
    if (!userId) throw new HttpError(401, "Invalid token");

    const user = await User.findOne({ userId }).lean();
    if (!user) throw new HttpError(401, "User not found");
    if (user.status !== "ACTIVE") throw new HttpError(403, "User is not active");

    req.auth = { userId: user.userId, role: user.role, institutionId: user.institutionId ?? null };
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, "Unauthorized"));
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.auth) return next(new HttpError(401, "Unauthorized"));
    if (!roles.includes(req.auth.role)) return next(new HttpError(403, "Forbidden"));
    next();
  };
}

