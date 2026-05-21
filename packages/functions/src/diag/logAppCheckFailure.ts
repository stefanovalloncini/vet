import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";

export const appCheckFailureInputSchema = z
  .object({
    stage: z.string().min(1).max(60),
    reason: z.string().min(1).max(200),
    userAgent: z.string().max(400).optional(),
    screenWidth: z.number().int().min(0).max(20_000).optional(),
    screenHeight: z.number().int().min(0).max(20_000).optional(),
    projectStage: z.enum(["prod", "preview", "dev"]).optional(),
  })
  .strict();

export type AppCheckFailureInput = z.infer<typeof appCheckFailureInputSchema>;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const MAX_TRACKED_IPS = 1000;
const calls = new Map<string, number[]>();

export function __resetRateLimitForTests(): void {
  calls.clear();
}

export function shouldRateLimit(ip: string, now: number): boolean {
  if (calls.size > MAX_TRACKED_IPS) {
    const oldest = calls.keys().next().value;
    if (oldest !== undefined) calls.delete(oldest);
  }
  const history = (calls.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (history.length >= MAX_PER_WINDOW) {
    calls.set(ip, history);
    return true;
  }
  history.push(now);
  calls.set(ip, history);
  return false;
}

export function buildLogPayload(input: AppCheckFailureInput, ip: string) {
  return {
    stage: input.stage,
    reason: input.reason,
    userAgent: input.userAgent,
    screenWidth: input.screenWidth,
    screenHeight: input.screenHeight,
    projectStage: input.projectStage,
    ip,
  };
}

export function extractClientIp(headers: Record<string, unknown>): string {
  const xff = headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  if (Array.isArray(xff) && xff.length > 0 && typeof xff[0] === "string") {
    const first = xff[0].split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers["x-real-ip"];
  if (typeof real === "string" && real.length > 0) return real;
  return "unknown";
}

export const logAppCheckFailure = onCall(
  {
    region: "europe-west8",
    cors: true,
    consumeAppCheckToken: false,
  },
  async (request) => {
    const parsed = appCheckFailureInputSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", "");
    }
    const ip = extractClientIp(
      (request.rawRequest?.headers ?? {}) as Record<string, unknown>
    );
    if (shouldRateLimit(ip, Date.now())) {
      return { ok: true as const };
    }
    logger.warn("app-check.failure", buildLogPayload(parsed.data, ip));
    return { ok: true as const };
  }
);
