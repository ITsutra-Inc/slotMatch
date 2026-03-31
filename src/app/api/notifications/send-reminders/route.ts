import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { handleReminderCheck } from "@/lib/scheduler/cron";

export async function POST() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const count = await handleReminderCheck();

  return NextResponse.json({
    success: true,
    data: { remindersSent: count },
  });
}
