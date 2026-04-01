import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
  format,
} from "date-fns";
import { prisma } from "./prisma";
import { generateCandidateToken } from "./tokens";

/**
 * Get the current 2-week window boundaries.
 * Window starts Monday of the current week, ends Sunday of next week.
 */
export function getCurrentWindowBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 }); // Sunday of next week

  // Normalize to start of day
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

/**
 * Check if a date falls within the current 2-week window.
 */
export function isDateInCurrentWindow(date: Date): boolean {
  const { weekStart, weekEnd } = getCurrentWindowBounds();
  return isWithinInterval(date, { start: weekStart, end: weekEnd });
}

/**
 * Create or get the current availability window for a candidate.
 */
export async function ensureAvailabilityWindow(candidateId: string) {
  const { weekStart, weekEnd } = getCurrentWindowBounds();

  // Check if window already exists
  const existing = await prisma.availabilityWindow.findUnique({
    where: {
      candidateId_weekStart: {
        candidateId,
        weekStart,
      },
    },
  });

  if (existing) return existing;

  // Create new window with token
  const token = generateCandidateToken(candidateId, candidateId, 14);
  const tokenExpiresAt = new Date(weekEnd);

  const window = await prisma.availabilityWindow.create({
    data: {
      candidateId,
      weekStart,
      weekEnd,
      token,
      tokenExpiresAt,
    },
  });

  return window;
}

/**
 * Create or get an availability window for a specific 2-week period.
 * weekStartDate should be a Monday; it will be normalized to the Monday of that week.
 */
export async function ensureAvailabilityWindowForPeriod(
  candidateId: string,
  weekStartDate: Date
) {
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = endOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 });
  weekEnd.setHours(23, 59, 59, 999);

  // Check if window already exists
  const existing = await prisma.availabilityWindow.findUnique({
    where: {
      candidateId_weekStart: {
        candidateId,
        weekStart,
      },
    },
  });

  if (existing) return existing;

  // Calculate days until window ends for token expiry
  const now = new Date();
  const msUntilEnd = weekEnd.getTime() - now.getTime();
  const daysUntilEnd = Math.max(1, Math.ceil(msUntilEnd / (1000 * 60 * 60 * 24)));

  const token = generateCandidateToken(candidateId, candidateId, daysUntilEnd);
  const tokenExpiresAt = new Date(weekEnd);

  const window = await prisma.availabilityWindow.create({
    data: {
      candidateId,
      weekStart,
      weekEnd,
      token,
      tokenExpiresAt,
    },
  });

  return window;
}

/**
 * Expire all windows that are past their end date and still OPEN.
 */
export async function expireOldWindows() {
  const now = new Date();

  await prisma.availabilityWindow.updateMany({
    where: {
      status: "OPEN",
      weekEnd: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });
}

/**
 * Format date for display.
 */
export function formatWindowRange(weekStart: Date, weekEnd: Date): string {
  return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
}
