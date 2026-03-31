import { createHash } from "crypto";
import { prisma } from "./prisma";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string } {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sm_live_";
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { raw: key, prefix: key.substring(0, 16) };
}

export async function validateApiKey(rawKey: string) {
  const hash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { admin: { select: { id: true, email: true } } },
  });

  if (!apiKey) return null;
  if (apiKey.revoked) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    apiKey,
    admin: apiKey.admin,
    scopes: apiKey.scopes,
  };
}
