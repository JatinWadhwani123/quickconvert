require("dotenv").config({ quiet: true });

const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  SITE_URL: z.string().url().default("https://quickconvert.online"),
  CORS_ORIGINS: z.string().default("https://quickconvert.online,http://localhost:3000,http://localhost:3004,http://localhost:3005"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(25),
  MAX_UPLOAD_FILES: z.coerce.number().int().positive().default(20),
  TEMP_FILE_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  ENABLE_REQUEST_LOGS: z.coerce.boolean().default(true),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map(issue => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

const env = parsed.data;

if (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32) {
  throw new Error("Invalid environment configuration: JWT_SECRET must be at least 32 characters in production");
}

module.exports = {
  ...env,
  isProduction: env.NODE_ENV === "production",
  corsOrigins: env.CORS_ORIGINS.split(",").map(origin => origin.trim()).filter(Boolean),
  maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024
};
