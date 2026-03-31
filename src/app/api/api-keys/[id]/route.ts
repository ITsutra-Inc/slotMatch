import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, adminId: admin.id },
  });

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API key not found" },
      { status: 404 }
    );
  }

  const { searchParams } = request.nextUrl;
  const permanent = searchParams.get("permanent") === "true";

  if (permanent) {
    await prisma.apiKey.delete({ where: { id } });
  } else {
    await prisma.apiKey.update({
      where: { id },
      data: { revoked: true },
    });
  }

  return NextResponse.json({ success: true });
}
