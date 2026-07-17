import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("4000").transform(Number),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  BCRYPT_SALT_ROUNDS: z.string().default("10").transform(Number),
  OTP_EXPIRY_MINUTES: z.string().default("10").transform(Number),

  CORS_ORIGIN: z.string().default("*"),

  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number),
  RATE_LIMIT_MAX: z.string().default("100").transform(Number),
  AUTH_RATE_LIMIT_MAX: z.string().default("10").transform(Number),

  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.string().default("5242880").transform(Number),

  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Runtime booleans (mutated after parse)
interface RuntimeEnv extends Env {
  isProduction: boolean;
  isDevelopment: boolean;
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsed.data as RuntimeEnv;

env.isProduction = env.NODE_ENV === "production";
env.isDevelopment = env.NODE_ENV === "development";

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
