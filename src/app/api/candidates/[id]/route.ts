import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET(
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

  const candidate = await prisma.candidate.findFirst({
    where: { id, adminId: admin.id },
    include: {
      availabilityWindows: {
        orderBy: { weekStart: "desc" },
        include: {
          timeSlots: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
        },
      },
      notificationLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: candidate });
}

export async function PATCH(
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
  const body = await request.json();

  const candidate = await prisma.candidate.findFirst({
    where: { id, adminId: admin.id },
  });

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

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

  const candidate = await prisma.candidate.findFirst({
    where: { id, adminId: admin.id },
  });

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 }
    );
  }

  await prisma.candidate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
