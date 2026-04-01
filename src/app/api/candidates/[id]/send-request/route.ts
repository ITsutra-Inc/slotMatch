import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ensureAvailabilityWindow } from "@/lib/windows";
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

  // Ensure availability window exists
  const window = await ensureAvailabilityWindow(candidate.id);

  if (window.status === "SUBMITTED") {
    return NextResponse.json(
      { success: false, error: "Candidate has already submitted their availability for this window" },
      { status: 400 }
    );
  }

  // Send the availability request (email + SMS)
  await sendAvailabilityRequest(candidate.id, window.token);

  return NextResponse.json({
    success: true,
    data: { message: "Availability request sent" },
  });
}
