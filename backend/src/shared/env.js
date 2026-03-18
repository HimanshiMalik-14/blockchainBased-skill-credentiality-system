import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("*"),

  MONGODB_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 14),

  // Blockchain (relayer mode)
  CHAIN_RPC_URL: z.string().url().optional(),
  CHAIN_ID: z.coerce.number().int().positive().optional(),
  CONTRACT_ADDRESS: z.string().optional(),
  RELAYER_PRIVATE_KEY: z.string().optional()
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  const flat = parsed.error.flatten().fieldErrors;
  console.error("Invalid environment variables:");
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) console.error(`- ${key}: ${msgs.join(", ")}`);
  }
  throw new Error(`Invalid environment variables: ${Object.keys(flat).join(", ")}`);
}

export const env = parsed.data;

