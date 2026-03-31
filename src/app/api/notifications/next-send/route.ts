import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

interface ScheduleConfig {
  enabled: boolean;
  requestDays: number[];
  requestHour: number;
  requestMinute: number;
  reminderIntervalHours: number;
  reminderStartHour: number;
  reminderEndHour: number;
}

const DEFAULT_CONFIG: ScheduleConfig = {
  enabled: true,
  requestDays: [0],
  requestHour: 8,
  requestMinute: 0,
  reminderIntervalHours: 3,
  reminderStartHour: 11,
  reminderEndHour: 23,
};

function getNextOccurrence(days: number[], hour: number, minute: number): Date {
  if (days.length === 0) return new Date(8640000000000000);
  const now = new Date();
  const sorted = [...days].sort((a, b) => a - b);

  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, minute, 0, 0);
    if (sorted.includes(d.getDay()) && d > now) return d;
  }

  const next = new Date(now);
  next.setDate(next.getDate() + 7);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function getNextReminder(
  days: number[],
  startHour: number,
  endHour: number,
  interval: number
): Date {
  if (days.length === 0) return new Date(8640000000000000);
  const now = new Date();
  const sorted = [...days].sort((a, b) => a - b);

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h += interval) hours.push(h);

  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    if (!sorted.includes(d.getDay())) continue;
    for (const h of hours) {
      d.setHours(h, 0, 0, 0);
      if (d > now) return d;
    }
  }

  const next = new Date(now);
  next.setDate(next.getDate() + 7);
  next.setHours(startHour, 0, 0, 0);
  return next;
}

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let config: ScheduleConfig;
  try {
    const schedule = await prisma.notificationSchedule.findFirst();
    config = schedule
      ? {
          enabled: schedule.enabled,
          requestDays: schedule.requestDays,
          requestHour: schedule.requestHour,
          requestMinute: schedule.requestMinute,
          reminderIntervalHours: schedule.reminderIntervalHours,
          reminderStartHour: schedule.reminderStartHour,
          reminderEndHour: schedule.reminderEndHour,
        }
      : DEFAULT_CONFIG;
  } catch {
    config = DEFAULT_CONFIG;
  }

  if (!config.enabled) {
    return NextResponse.json({
      success: true,
      data: { enabled: false, nextRequest: null, nextReminder: null },
    });
  }

  const nextRequest = getNextOccurrence(
    config.requestDays,
    config.requestHour,
    config.requestMinute
  );

  const nextReminder = getNextReminder(
    config.requestDays,
    config.reminderStartHour,
    config.reminderEndHour,
    config.reminderIntervalHours
  );

  return NextResponse.json({
    success: true,
    data: {
      enabled: true,
      nextRequest: nextRequest.toISOString(),
      nextReminder: nextReminder.toISOString(),
    },
  });
}
