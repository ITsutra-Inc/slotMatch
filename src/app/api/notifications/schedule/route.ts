import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { updateScheduleSchema } from "@/lib/validations";
import { restartScheduler } from "@/lib/scheduler/cron";

const DEFAULTS = {
  enabled: true,
  requestDays: [0],
  requestHour: 8,
  requestMinute: 0,
  reminderIntervalHours: 3,
  reminderStartHour: 11,
  reminderEndHour: 23,
};

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const schedule = await prisma.notificationSchedule.findUnique({
    where: { adminId: admin.id },
  });

  return NextResponse.json({
    success: true,
    data: schedule || DEFAULTS,
  });
}

export async function PUT(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = updateScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const schedule = await prisma.notificationSchedule.upsert({
    where: { adminId: admin.id },
    update: data,
    create: { ...data, adminId: admin.id },
  });

  // Restart cron jobs with new schedule
  await restartScheduler();

  return NextResponse.json({ success: true, data: schedule });
}
