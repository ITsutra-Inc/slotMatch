import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-auth";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Missing API key. Use Bearer token." },
      { status: 401 }
    );
  }

  const rawKey = authHeader.replace("Bearer ", "");
  const auth = await validateApiKey(rawKey);

  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Invalid or revoked API key" },
      { status: 401 }
    );
  }

  if (!auth.scopes.includes("read:availability")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const candidateEmail = searchParams.get("email");
  const candidateId = searchParams.get("candidateId");

  // Build query filter
  const candidateWhere = {
    adminId: auth.admin.id,
    ...(candidateEmail ? { email: candidateEmail } : {}),
    ...(candidateId ? { id: candidateId } : {}),
  };

  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
    include: {
      availabilityWindows: {
        where: { status: "SUBMITTED" },
        orderBy: { weekStart: "desc" },
        take: 1,
        include: {
          timeSlots: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
        },
      },
    },
  });

  const results = candidates.map((candidate) => {
    const latestWindow = candidate.availabilityWindows[0];

    return {
      candidateId: candidate.id,
      email: candidate.email,
      name: candidate.name,
      availability: latestWindow
        ? {
            windowStart: latestWindow.weekStart.toISOString(),
            windowEnd: latestWindow.weekEnd.toISOString(),
            submittedAt: latestWindow.submittedAt?.toISOString(),
            slots: latestWindow.timeSlots.map((slot) => ({
              date: format(slot.date, "yyyy-MM-dd"),
              startTime: format(slot.startTime, "HH:mm"),
              endTime: format(slot.endTime, "HH:mm"),
            })),
          }
        : null,
    };
  });

  return NextResponse.json({ success: true, data: results });
}
