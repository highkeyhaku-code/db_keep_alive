import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  POSTGRES_URL: z.string().url("POSTGRES_URL must be a valid URL"),
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 characters long"),
});

const processEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  POSTGRES_URL: process.env.POSTGRES_URL,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  // ビルド時や開発初期で環境変数が未設定の場合に詳細なエラーメッセージを提示
  throw new Error(
    "Invalid environment variables. Please check your .env.local file against .env.example."
  );
}

export const env = parsed.data;
