import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { handleWeeklyAvailabilityRequest } from "@/lib/scheduler/cron";

export async function POST() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const count = await handleWeeklyAvailabilityRequest();

  return NextResponse.json({
    success: true,
    data: { candidatesNotified: count },
  });
}
