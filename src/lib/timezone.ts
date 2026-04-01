import { formatInTimeZone } from "date-fns-tz";

export const APP_TIMEZONE =
  process.env.NEXT_PUBLIC_TIMEZONE || "America/Chicago";

/**
 * Format a date in the app's configured timezone (CST/CDT).
 * Drop-in replacement for date-fns `format()`.
 */
export function formatTz(date: Date | string, fmt: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, APP_TIMEZONE, fmt);
}

/**
 * Format a date-only string (yyyy-MM-dd or ISO) in the app timezone,
 * pinning to noon to avoid day-boundary shifts.
 */
export function formatDateTz(dateStr: string, fmt: string): string {
  const normalized = dateStr.includes("T") ? dateStr : dateStr + "T12:00:00";
  return formatInTimeZone(new Date(normalized), APP_TIMEZONE, fmt);
}

/**
 * Format a timestamp for display (e.g. notification logs, "submitted at").
 */
export function formatTimestampTz(iso: string, fmt: string): string {
  return formatInTimeZone(new Date(iso), APP_TIMEZONE, fmt);
}
