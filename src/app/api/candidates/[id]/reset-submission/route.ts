import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { sendAvailabilityRequest } from "@/lib/notifications/service";

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

  if (currentWindow.status === "OPEN") {
    return NextResponse.json(
      { success: false, error: "Window is already open — no submission to reset" },
      { status: 400 }
    );
  }

  // Delete all time slots for this window
  await prisma.timeSlot.deleteMany({ where: { windowId: currentWindow.id } });

  // Reopen the window
  await prisma.availabilityWindow.update({
    where: { id: currentWindow.id },
    data: { status: "OPEN", submittedAt: null },
  });

  // Send a new availability request notification
  const { searchParams } = request.nextUrl;
  const sendNotification = searchParams.get("notify") !== "false";

  if (sendNotification) {
    await sendAvailabilityRequest(candidate.id, currentWindow.token);
  }

  return NextResponse.json({
    success: true,
    data: { message: "Submission reset and window reopened" },
  });
}
