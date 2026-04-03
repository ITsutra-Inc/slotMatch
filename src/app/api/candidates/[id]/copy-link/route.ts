import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ensureAvailabilityWindow } from "@/lib/windows";
import { format } from "date-fns";

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

  const candidate = await prisma.candidate.findFirst({
    where: { id, adminId: admin.id },
  });

  if (!candidate) {
    return NextResponse.json(
      { success: false, error: "Candidate not found" },
      { status: 404 }
    );
  }

  // Ensure availability window exists
  const window = await ensureAvailabilityWindow(candidate.id);

  const schedulingLink = `${APP_URL}/schedule/${window.token}`;

  // Log the link share action
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
    data: { schedulingLink, windowStatus: window.status },
  });
}
