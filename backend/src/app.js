import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./shared/env.js";
import { errorHandler } from "./shared/errorHandler.js";
import { notFound } from "./shared/notFound.js";

import { authRouter } from "./modules/auth/auth.routes.js";
import { institutionRouter } from "./modules/institutions/institutions.routes.js";
import { certificateRouter } from "./modules/certificates/certificates.routes.js";
import { certificateTemplatesRouter } from "./modules/certificateTemplates/certificateTemplates.routes.js";
import { verificationRouter } from "./modules/verification/verification.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/institutions", institutionRouter);
  app.use("/api/certificates", certificateRouter);
  app.use("/api/templates", certificateTemplatesRouter);
  app.use("/api/verify", verificationRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

