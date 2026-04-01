import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ensureAvailabilityWindowForPeriod } from "@/lib/windows";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
  const body = await request.json();
  const { weekStart } = body;

  if (!weekStart) {
    return NextResponse.json(
      { success: false, error: "weekStart date is required" },
      { status: 400 }
    );
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id, adminId: admin.id },
  });

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 }
    );
  }

  const weekStartDate = new Date(weekStart + "T00:00:00");
  if (isNaN(weekStartDate.getTime())) {
    return NextResponse.json(
      { success: false, error: "Invalid date format" },
      { status: 400 }
    );
  }

  // Create or get the window for this period
  const window = await ensureAvailabilityWindowForPeriod(candidate.id, weekStartDate);

  const schedulingLink = `${APP_URL}/schedule/${window.token}`;

  // Log the link generation
  await prisma.notificationLog.create({
    data: {
      type: "LINK_SHARED",
      channel: "SYSTEM",
      status: "SENT",
      sentAt: new Date(),
      candidateId: candidate.id,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      schedulingLink,
      windowId: window.id,
      weekStart: window.weekStart.toISOString(),
      weekEnd: window.weekEnd.toISOString(),
      windowStatus: window.status,
    },
  });
}
