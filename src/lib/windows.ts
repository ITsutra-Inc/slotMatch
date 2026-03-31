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
