import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ensureAvailabilityWindowForPeriod } from "@/lib/windows";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";

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

  // Check if any existing window overlaps with this 2-week period
  const normalizedStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  normalizedStart.setHours(0, 0, 0, 0);
  const newEnd = endOfWeek(addWeeks(normalizedStart, 1), { weekStartsOn: 1 });
  newEnd.setHours(23, 59, 59, 999);

  const overlapping = await prisma.availabilityWindow.findFirst({
    where: {
      candidateId: candidate.id,
      weekStart: { lt: newEnd },
      weekEnd: { gt: normalizedStart },
    },
  });

  if (overlapping) {
    const ws = format(overlapping.weekStart, "MMM d");
    const we = format(overlapping.weekEnd, "MMM d, yyyy");
    return NextResponse.json(
      { success: false, error: `This period overlaps with an existing window (${ws} – ${we})` },
      { status: 400 }
    );
  }

  // Create the window for this period
  const window = await ensureAvailabilityWindowForPeriod(candidate.id, weekStartDate);

  const schedulingLink = `${APP_URL}/schedule/${window.token}`;

  // Log the link generation
  const note = `Window: ${format(window.weekStart, "MMM d")} – ${format(window.weekEnd, "MMM d, yyyy")}`;
  await prisma.notificationLog.create({
    data: {
      type: "LINK_SHARED",
      channel: "SYSTEM",
      status: "SENT",
      sentAt: new Date(),
      note,
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
