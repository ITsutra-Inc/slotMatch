import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function POST(
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
        take: 1,
      },
    },
  });

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 }
    );
  }

  const currentWindow = candidate.availabilityWindows[0];

  if (!currentWindow) {
    return NextResponse.json(
      { success: false, error: "No availability window found" },
      { status: 404 }
    );
  }

  if (currentWindow.status === "OPEN" && !(await prisma.timeSlot.count({ where: { windowId: currentWindow.id } }))) {
    return NextResponse.json(
      { success: false, error: "No availability to delete" },
      { status: 400 }
    );
  }

  // Delete all time slots for this window
  await prisma.timeSlot.deleteMany({ where: { windowId: currentWindow.id } });

  // Reopen the window so the candidate can resubmit
  await prisma.availabilityWindow.update({
    where: { id: currentWindow.id },
    data: { status: "OPEN", submittedAt: null },
  });

  return NextResponse.json({
    success: true,
    data: { message: "Availability deleted and window reopened" },
  });
}
