import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ensureAvailabilityWindowForPeriod } from "@/lib/windows";
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

  if (candidate.status !== "ACTIVE") {
    return NextResponse.json(
      { success: false, error: "Candidate must be active to send a request" },
      { status: 400 }
    );
  }

  const weekStartDate = new Date(weekStart + "T00:00:00");
  if (isNaN(weekStartDate.getTime())) {
    return NextResponse.json(
      { success: false, error: "Invalid date format" },
      { status: 400 }
    );
  }

  const window = await ensureAvailabilityWindowForPeriod(candidate.id, weekStartDate);

  if (window.status === "SUBMITTED") {
    return NextResponse.json(
      { success: false, error: "Candidate has already submitted availability for this window" },
      { status: 400 }
    );
  }

  await sendAvailabilityRequest(candidate.id, window.token);

  return NextResponse.json({
    success: true,
    data: {
      message: "Availability request sent",
      weekStart: window.weekStart.toISOString(),
      weekEnd: window.weekEnd.toISOString(),
    },
  });
}
