import { DB_NAME } from "@/types";
import { z } from "zod";

const envSchema = z.object({
  VITE_APP_TITLE: z
    .string()
    .min(1)
    .default("穢土浄化奇譚 〜 妖魔祓ひの旅路 〜"),
  VITE_DB_NAME: z.string().min(1).default(DB_NAME),
  VITE_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("warn"),
});

export type AppEnv = z.infer<typeof envSchema>;

/** 環境変数をZodスキーマで検証して取得する */
export const parseAppEnv = (raw: Record<string, unknown>): AppEnv =>
  envSchema.parse(raw);

export const appEnv: AppEnv = parseAppEnv(import.meta.env);
