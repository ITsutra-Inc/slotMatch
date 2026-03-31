import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCandidateToken } from "@/lib/tokens";
import { submitAvailabilitySchema } from "@/lib/validations";
import { isDateInCurrentWindow, getCurrentWindowBounds } from "@/lib/windows";
import {
  parseISO,
  differenceInMinutes,
  format,
  eachDayOfInterval,
} from "date-fns";

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

  // Validate each slot
  const { weekStart, weekEnd } = getCurrentWindowBounds();

  // Group slots by date to validate 4-hour minimum
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

  // Validate 4-hour minimum per day
  for (const [date, daySlots] of slotsByDate) {
    let totalMinutes = 0;
    for (const s of daySlots) {
      const startMin =
        parseInt(s.start.split(":")[0]) * 60 + parseInt(s.start.split(":")[1]);
      const endMin =
        parseInt(s.end.split(":")[0]) * 60 + parseInt(s.end.split(":")[1]);
      totalMinutes += endMin - startMin;
    }

    if (totalMinutes < 240) {
      return NextResponse.json(
        {
          success: false,
          error: `Day ${date} has only ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m of availability. Minimum 4 hours required.`,
        },
        { status: 400 }
      );
    }
  }

  // Validate all weekdays in the window have slots (min 4h each)
  const windowDays = eachDayOfInterval({
    start: window.weekStart,
    end: window.weekEnd,
  }).filter((d) => {
    const day = d.getDay();
    return day >= 1 && day <= 5; // Mon–Fri only
  });

  const missingDays = windowDays.filter((d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const daySlots = slotsByDate.get(dateStr);
    if (!daySlots) return true;
    let totalMinutes = 0;
    for (const s of daySlots) {
      const startMin = parseInt(s.start.split(":")[0]) * 60 + parseInt(s.start.split(":")[1]);
      const endMin = parseInt(s.end.split(":")[0]) * 60 + parseInt(s.end.split(":")[1]);
      totalMinutes += endMin - startMin;
    }
    return totalMinutes < 240;
  });

  if (missingDays.length > 0) {
    const missing = missingDays.map((d) => format(d, "EEE, MMM d")).join(", ");
    return NextResponse.json(
      {
        success: false,
        error: `All weekdays require at least 4 hours of availability. Missing: ${missing}`,
      },
      { status: 400 }
    );
  }

  // Delete existing slots and save new ones
  await prisma.timeSlot.deleteMany({ where: { windowId: window.id } });

  const slotData = slots.map((slot) => {
    const dateObj = parseISO(slot.date);
    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);

    const startTime = new Date(dateObj);
    startTime.setHours(startH, startM, 0, 0);

    const endTime = new Date(dateObj);
    endTime.setHours(endH, endM, 0, 0);

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

  // Validate all weekdays are covered
  const submitWindowDays = eachDayOfInterval({
    start: window.weekStart,
    end: window.weekEnd,
  }).filter((d) => {
    const day = d.getDay();
    return day >= 1 && day <= 5;
  });

  const coveredDates = new Set(
    window.timeSlots.map((s) => format(s.date, "yyyy-MM-dd"))
  );

  const uncoveredDays = submitWindowDays.filter(
    (d) => !coveredDates.has(format(d, "yyyy-MM-dd"))
  );

  if (uncoveredDays.length > 0) {
    const missing = uncoveredDays.map((d) => format(d, "EEE, MMM d")).join(", ");
    return NextResponse.json(
      { success: false, error: `All weekdays must have availability. Missing: ${missing}` },
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
