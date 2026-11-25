import { createHash } from "node:crypto";

import { getServerEnv } from "@/lib/env";

const buckets = new Map<string, number[]>();

export function hashIp(ip: string): string {
  try {
    const salt = getServerEnv().RATE_LIMIT_SALT;
    return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
  } catch {
    return createHash("sha256").update(ip).digest("hex");
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return { allowed: false, remaining: 0 };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, remaining: limit - recent.length };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}