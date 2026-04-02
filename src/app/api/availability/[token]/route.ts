import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCandidateToken } from "@/lib/tokens";
import { submitAvailabilitySchema } from "@/lib/validations";
import {
  parseISO,
  differenceInMinutes,
  format,
  eachDayOfInterval,
} from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@/lib/timezone";

// GET — fetch current window and existing slots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const payload = verifyCandidateToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired link" },
      { status: 401 }
    );
  }

  const window = await prisma.availabilityWindow.findUnique({
    where: { token },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      timeSlots: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!window) {
    return NextResponse.json(
      { success: false, error: "Window not found" },
      { status: 404 }
    );
  }

  // Build the list of weekdays only (Mon–Fri) in the window
  const days = eachDayOfInterval({
    start: window.weekStart,
    end: window.weekEnd,
  })
    .filter((date) => {
      const day = date.getDay();
      return day >= 1 && day <= 5; // Monday=1 through Friday=5
    })
    .map((date) => ({
      date: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE"),
      isLocked: window.status !== "OPEN",
    }));

  return NextResponse.json({
    success: true,
    data: {
      window: {
        id: window.id,
        weekStart: format(window.weekStart, "yyyy-MM-dd"),
        weekEnd: format(window.weekEnd, "yyyy-MM-dd"),
        status: window.status,
        submittedAt: window.submittedAt?.toISOString() || null,
      },
      candidate: window.candidate,
      days,
      timeSlots: window.timeSlots.map((slot) => ({
        id: slot.id,
        date: format(slot.date, "yyyy-MM-dd"),
        startTime: format(slot.startTime, "HH:mm"),
        endTime: format(slot.endTime, "HH:mm"),
      })),
    },
  });
}

// POST — save availability slots
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const payload = verifyCandidateToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired link" },
      { status: 401 }
    );
  }

  const window = await prisma.availabilityWindow.findUnique({
    where: { token },
  });

  if (!window) {
    return NextResponse.json(
      { success: false, error: "Window not found" },
      { status: 404 }
    );
  }

  if (window.status !== "OPEN") {
    return NextResponse.json(
      { success: false, error: "This window is no longer accepting submissions" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = submitAvailabilitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { slots } = parsed.data;

  // Validate each slot against the window's own bounds
  const weekStart = window.weekStart;
  const weekEnd = window.weekEnd;

  // Group slots by date
  const slotsByDate = new Map<string, { start: string; end: string }[]>();

  for (const slot of slots) {
    const slotDate = parseISO(slot.date);

    // Check date is within window
    if (slotDate < weekStart || slotDate > weekEnd) {
      return NextResponse.json(
        {
          success: false,
          error: `Date ${slot.date} is outside the current 2-week window`,
        },
        { status: 400 }
      );
    }

    // Check start < end
    const startMinutes =
      parseInt(slot.startTime.split(":")[0]) * 60 +
      parseInt(slot.startTime.split(":")[1]);
    const endMinutes =
      parseInt(slot.endTime.split(":")[0]) * 60 +
      parseInt(slot.endTime.split(":")[1]);

    if (startMinutes >= endMinutes) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid time range on ${slot.date}: start must be before end`,
        },
        { status: 400 }
      );
    }

    const existing = slotsByDate.get(slot.date) || [];
    existing.push({ start: slot.startTime, end: slot.endTime });
    slotsByDate.set(slot.date, existing);
  }

  // Validate 20-hour minimum per week
  const windowDays = eachDayOfInterval({
    start: window.weekStart,
    end: window.weekEnd,
  }).filter((d) => {
    const day = d.getDay();
    return day >= 1 && day <= 5; // Mon–Fri only
  });

  const week1Dates = new Set(windowDays.slice(0, 5).map((d) => format(d, "yyyy-MM-dd")));
  const week2Dates = new Set(windowDays.slice(5, 10).map((d) => format(d, "yyyy-MM-dd")));

  function totalMinutesForWeek(dates: Set<string>): number {
    let total = 0;
    for (const [date, daySlots] of slotsByDate) {
      if (!dates.has(date)) continue;
      for (const s of daySlots) {
        const startMin = parseInt(s.start.split(":")[0]) * 60 + parseInt(s.start.split(":")[1]);
        const endMin = parseInt(s.end.split(":")[0]) * 60 + parseInt(s.end.split(":")[1]);
        total += endMin - startMin;
      }
    }
    return total;
  }

  const MIN_WEEKLY_MINUTES = 1200; // 20 hours
  const week1Minutes = totalMinutesForWeek(week1Dates);
  const week2Minutes = totalMinutesForWeek(week2Dates);

  if (week1Minutes < MIN_WEEKLY_MINUTES) {
    return NextResponse.json(
      {
        success: false,
        error: `Week 1 has only ${Math.floor(week1Minutes / 60)}h ${week1Minutes % 60}m of availability. Minimum 20 hours required.`,
      },
      { status: 400 }
    );
  }

  if (week2Dates.size > 0 && week2Minutes < MIN_WEEKLY_MINUTES) {
    return NextResponse.json(
      {
        success: false,
        error: `Week 2 has only ${Math.floor(week2Minutes / 60)}h ${week2Minutes % 60}m of availability. Minimum 20 hours required.`,
      },
      { status: 400 }
    );
  }

  // Delete existing slots and save new ones
  await prisma.timeSlot.deleteMany({ where: { windowId: window.id } });

  const slotData = slots.map((slot) => {
    const dateObj = parseISO(slot.date);

    // Treat submitted times as CST — fromZonedTime converts CST wall-clock to UTC
    const startTime = fromZonedTime(
      `${slot.date}T${slot.startTime}:00`,
      APP_TIMEZONE
    );
    const endTime = fromZonedTime(
      `${slot.date}T${slot.endTime}:00`,
      APP_TIMEZONE
    );

    return {
      date: dateObj,
      startTime,
      endTime,
      windowId: window.id,
    };
  });

  await prisma.timeSlot.createMany({ data: slotData });

  return NextResponse.json({
    success: true,
    data: { slotsCreated: slotData.length },
  });
}

// PUT — confirm/submit availability (locks it)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const payload = verifyCandidateToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired link" },
      { status: 401 }
    );
  }

  const window = await prisma.availabilityWindow.findUnique({
    where: { token },
    include: { timeSlots: true },
  });

  if (!window) {
    return NextResponse.json(
      { success: false, error: "Window not found" },
      { status: 404 }
    );
  }

  if (window.status !== "OPEN") {
    return NextResponse.json(
      { success: false, error: "Already submitted" },
      { status: 400 }
    );
  }

  if (window.timeSlots.length === 0) {
    return NextResponse.json(
      { success: false, error: "No time slots to submit. Please add availability first." },
      { status: 400 }
    );
  }

  // Validate 20-hour minimum per week
  const submitWindowDays = eachDayOfInterval({
    start: window.weekStart,
    end: window.weekEnd,
  }).filter((d) => {
    const day = d.getDay();
    return day >= 1 && day <= 5;
  });

  const submitWeek1Dates = new Set(submitWindowDays.slice(0, 5).map((d) => format(d, "yyyy-MM-dd")));
  const submitWeek2Dates = new Set(submitWindowDays.slice(5, 10).map((d) => format(d, "yyyy-MM-dd")));

  // Use toISOString to get UTC date string — @db.Date fields are stored at
  // UTC midnight, and date-fns format() would shift them back a day in
  // negative-UTC-offset timezones.
  function submitTotalMinutes(dates: Set<string>): number {
    let total = 0;
    for (const slot of window!.timeSlots) {
      const dateStr = slot.date.toISOString().split("T")[0];
      if (!dates.has(dateStr)) continue;
      total += differenceInMinutes(slot.endTime, slot.startTime);
    }
    return total;
  }

  const SUBMIT_MIN_WEEKLY_MINUTES = 1200; // 20 hours
  const submitWeek1Min = submitTotalMinutes(submitWeek1Dates);
  const submitWeek2Min = submitTotalMinutes(submitWeek2Dates);

  if (submitWeek1Min < SUBMIT_MIN_WEEKLY_MINUTES) {
    return NextResponse.json(
      { success: false, error: `Week 1 has only ${Math.floor(submitWeek1Min / 60)}h of availability. Minimum 20 hours required.` },
      { status: 400 }
    );
  }

  if (submitWeek2Dates.size > 0 && submitWeek2Min < SUBMIT_MIN_WEEKLY_MINUTES) {
    return NextResponse.json(
      { success: false, error: `Week 2 has only ${Math.floor(submitWeek2Min / 60)}h of availability. Minimum 20 hours required.` },
      { status: 400 }
    );
  }

  await prisma.availabilityWindow.update({
    where: { id: window.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    data: { message: "Availability submitted successfully" },
  });
}
