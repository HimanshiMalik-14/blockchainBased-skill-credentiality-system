import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { nanoid } from "nanoid";

import { HttpError } from "../../shared/httpError.js";
import { User, USER_ROLES } from "../users/user.model.js";
import { signAccessToken, signRefreshToken } from "./auth.tokens.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES).default("LEARNER"),
  institutionId: z.string().min(1).optional()
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    if (!body.email && !body.phone) throw new HttpError(400, "Email or phone required");

    if (body.role === "ADMIN") {
      throw new HttpError(403, "Admin registration is not allowed via public API");
    }

    if (body.role === "INSTITUTION" && !body.institutionId) {
      throw new HttpError(400, "institutionId is required for INSTITUTION role");
    }

    const existing = await User.findOne({
      $or: [
        ...(body.email ? [{ email: body.email.toLowerCase() }] : []),
        ...(body.phone ? [{ phone: body.phone }] : [])
      ]
    }).lean();
    if (existing) throw new HttpError(409, "User already exists");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      userId: `usr_${nanoid(12)}`,
      role: body.role,
      name: body.name,
      email: body.email?.toLowerCase(),
      phone: body.phone,
      passwordHash,
      institutionId: body.institutionId
    });

    const accessToken = signAccessToken({ userId: user.userId, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.userId });

    res.status(201).json({
      user: { userId: user.userId, role: user.role, name: user.name, email: user.email, phone: user.phone },
      tokens: { accessToken, refreshToken }
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8)
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    if (!body.email && !body.phone) throw new HttpError(400, "Email or phone required");

    const user = await User.findOne({
      ...(body.email ? { email: body.email.toLowerCase() } : {}),
      ...(body.phone ? { phone: body.phone } : {})
    });
    if (!user) throw new HttpError(401, "Invalid credentials");
    if (user.status !== "ACTIVE") throw new HttpError(403, "User is not active");
    if (!user.passwordHash) throw new HttpError(401, "Password login not enabled for this user");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    await User.updateOne({ userId: user.userId }, { $set: { lastLoginAt: new Date() } });

    const accessToken = signAccessToken({ userId: user.userId, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.userId });

    res.json({
      user: { userId: user.userId, role: user.role, name: user.name, email: user.email, phone: user.phone },
      tokens: { accessToken, refreshToken }
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.auth.userId }).lean();
    if (!user) throw new HttpError(404, "User not found");
    res.json({
      user: {
        userId: user.userId,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        institutionId: user.institutionId ?? null,
        walletAddress: user.walletAddress ?? null,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  walletAddress: z.string().optional()
});

authRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const updates = {};
    if (body.name != null) updates.name = body.name;
    if (body.email != null) updates.email = body.email.toLowerCase();
    if (body.phone != null) updates.phone = body.phone;
    if (body.walletAddress != null) updates.walletAddress = body.walletAddress.toLowerCase().trim();
    const user = await User.findOneAndUpdate(
      { userId: req.auth.userId },
      { $set: updates },
      { new: true }
    ).lean();
    if (!user) throw new HttpError(404, "User not found");
    res.json({
      user: {
        userId: user.userId,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        institutionId: user.institutionId ?? null,
        walletAddress: user.walletAddress ?? null,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

