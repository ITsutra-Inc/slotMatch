import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { generateApiKey, hashApiKey } from "@/lib/api-auth";
import { createApiKeySchema } from "@/lib/validations";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const keys = await prisma.apiKey.findMany({
    where: { adminId: admin.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      revoked: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: keys });
}

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = createApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, scopes, expiresInDays } = parsed.data;
  const { raw, prefix } = generateApiKey();
  const hash = hashApiKey(raw);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes: scopes || ["read:availability"],
      expiresAt,
      adminId: admin.id,
    },
  });

  // Return raw key only on creation — never again
  return NextResponse.json(
    {
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: raw,
        prefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
      },
    },
    { status: 201 }
  );
}
