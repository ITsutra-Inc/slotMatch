import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; windowId: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id, windowId } = await params;

  // Verify the candidate belongs to this admin
  const candidate = await prisma.candidate.findFirst({
    where: { id, adminId: admin.id },
  });

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 }
    );
  }

  // Verify the window belongs to this candidate
  const window = await prisma.availabilityWindow.findFirst({
    where: { id: windowId, candidateId: id },
  });

  if (!window) {
    return NextResponse.json(
      { success: false, error: "Window not found" },
      { status: 404 }
    );
  }

  // Delete time slots first (cascade should handle this, but be explicit)
  await prisma.timeSlot.deleteMany({ where: { windowId } });

  // Delete the window itself
  await prisma.availabilityWindow.delete({ where: { id: windowId } });

  return NextResponse.json({
    success: true,
    data: { message: "Availability window deleted" },
  });
}
