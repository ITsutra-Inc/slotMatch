"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import ThemeToggle from "@/components/ui/theme-toggle";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DayData {
  date: string;
  dayName: string;
  isLocked: boolean;
}

interface SlotData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface ScheduleData {
  window: {
    id: string;
    weekStart: string;
    weekEnd: string;
    status: string;
    submittedAt: string | null;
  };
  candidate: { id: string; name: string | null; email: string };
  days: DayData[];
  timeSlots: SlotData[];
}

interface LocalSlot {
  date: string;
  startTime: string;
  endTime: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const START_HOUR = 9;
const END_HOUR = 17;
const BLOCK_MINUTES = 120;

// Build 2-hour blocks from 9:00 to 15:00 (each block represents its start time)
const TIME_BLOCKS: string[] = [];
for (let h = START_HOUR; h < END_HOUR; h += 2) {
  TIME_BLOCKS.push(
    `${h.toString().padStart(2, "0")}:00`
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function fmtHour(t: string): string {
  const [h] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour} ${ampm}`;
}

function cellKey(date: string, time: string): string {
  return `${date}|${time}`;
}

function parseCellKey(key: string): { date: string; time: string } {
  const [date, time] = key.split("|");
  return { date, time };
}

/** Add two hours to a HH:MM string */
function addBlock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + BLOCK_MINUTES;
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

/** Convert a Set of selected cell keys into merged LocalSlot[] */
function cellsToSlots(cells: Set<string>): LocalSlot[] {
  // Group by date
  const byDate = new Map<string, string[]>();
  for (const key of cells) {
    const { date, time } = parseCellKey(key);
    const arr = byDate.get(date) || [];
    arr.push(time);
    byDate.set(date, arr);
  }

  const slots: LocalSlot[] = [];

  for (const [date, times] of byDate) {
    times.sort();
    // Merge adjacent blocks
    let start = times[0];
    let end = addBlock(times[0]);

    for (let i = 1; i < times.length; i++) {
      if (times[i] === end) {
        // Adjacent — extend
        end = addBlock(times[i]);
      } else {
        // Gap — push current and start new
        slots.push({ date, startTime: start, endTime: end });
        start = times[i];
        end = addBlock(times[i]);
      }
    }
    slots.push({ date, startTime: start, endTime: end });
  }

  return slots;
}

/** Convert LocalSlot[] into cell keys Set */
function slotsToCells(slots: LocalSlot[]): Set<string> {
  const cells = new Set<string>();
  for (const slot of slots) {
    let current = slot.startTime;
    while (current < slot.endTime && current < `${END_HOUR}:00`) {
      cells.add(cellKey(slot.date, current));
      current = addBlock(current);
    }
  }
  return cells;
}

function totalHoursFromCells(cells: Set<string>, date: string): number {
  let count = 0;
  for (const key of cells) {
    if (key.startsWith(date + "|")) count++;
  }
  return (count * BLOCK_MINUTES) / 60;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [data, setData] = useState<ScheduleData | null>(null);
  const [cells, setCells] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"edit" | "review" | "done">("edit");
  const [activeWeek, setActiveWeek] = useState(0); // 0 = week 1, 1 = week 2

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"select" | "deselect">("select");
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ col: number; row: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ─── Data loading ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/availability/${token}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Invalid link");
        setLoading(false);
        return;
      }

      setData(json.data);
      const existingSlots: LocalSlot[] = json.data.timeSlots.map(
        (s: SlotData) => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        })
      );
      setCells(slotsToCells(existingSlots));

      if (json.data.window.status === "SUBMITTED") {
        setStep("done");
      }
    } catch {
      setError("Failed to load. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Week helpers ─────────────────────────────────────────────────────

  // Days are already weekdays-only from the API (Mon–Fri)
  const allWeekdays = data?.days || [];
  const week1Days = allWeekdays.slice(0, 5);
  const week2Days = allWeekdays.slice(5, 10);
  const currentWeekDays = activeWeek === 0 ? week1Days : week2Days;

  // ─── Drag handlers ────────────────────────────────────────────────────

  function getCellFromPos(
    col: number,
    row: number
  ): string | null {
    if (col < 0 || col >= currentWeekDays.length) return null;
    if (row < 0 || row >= TIME_BLOCKS.length) return null;
    return cellKey(currentWeekDays[col].date, TIME_BLOCKS[row]);
  }

  function getDragRect() {
    if (!dragStart || !dragCurrent) return null;
    return {
      minCol: Math.min(dragStart.col, dragCurrent.col),
      maxCol: Math.max(dragStart.col, dragCurrent.col),
      minRow: Math.min(dragStart.row, dragCurrent.row),
      maxRow: Math.max(dragStart.row, dragCurrent.row),
    };
  }

  function handlePointerDown(col: number, row: number) {
    const key = getCellFromPos(col, row);
    if (!key) return;

    const mode = cells.has(key) ? "deselect" : "select";
    setDragMode(mode);
    setIsDragging(true);
    setDragStart({ col, row });
    setDragCurrent({ col, row });
  }

  function handlePointerMove(col: number, row: number) {
    if (!isDragging) return;
    setDragCurrent({ col, row });
  }

  function handlePointerUp() {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      return;
    }

    const rect = getDragRect();
    if (!rect) {
      setIsDragging(false);
      return;
    }

    setCells((prev) => {
      const next = new Set(prev);
      for (let c = rect.minCol; c <= rect.maxCol; c++) {
        for (let r = rect.minRow; r <= rect.maxRow; r++) {
          const key = getCellFromPos(c, r);
          if (!key) continue;
          if (dragMode === "select") {
            next.add(key);
          } else {
            next.delete(key);
          }
        }
      }
      return next;
    });

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
    setError("");
  }

  // Is cell in the current drag rectangle?
  function isInDragRect(col: number, row: number): boolean {
    const rect = getDragRect();
    if (!rect || !isDragging) return false;
    return (
      col >= rect.minCol &&
      col <= rect.maxCol &&
      row >= rect.minRow &&
      row <= rect.maxRow
    );
  }

  // Prevent text selection while dragging
  useEffect(() => {
    function up() {
      handlePointerUp();
    }
    function preventSelect(e: Event) {
      if (isDragging) e.preventDefault();
    }
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    window.addEventListener("selectstart", preventSelect);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
      window.removeEventListener("selectstart", preventSelect);
    };
  });

  // ─── Quick actions ────────────────────────────────────────────────────

  function selectAllWeek() {
    setCells((prev) => {
      const next = new Set(prev);
      for (const day of currentWeekDays) {
        for (const time of TIME_BLOCKS) {
          next.add(cellKey(day.date, time));
        }
      }
      return next;
    });
  }

  function clearWeek() {
    setCells((prev) => {
      const next = new Set(prev);
      for (const day of currentWeekDays) {
        for (const time of TIME_BLOCKS) {
          next.delete(cellKey(day.date, time));
        }
      }
      return next;
    });
  }

  function clearAll() {
    setCells(new Set());
  }

  // ─── Save & submit ───────────────────────────────────────────────────

  const slots = cellsToSlots(cells);

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/availability/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error);
        return;
      }

      setStep("review");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/availability/${token}`, {
        method: "PUT",
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error);
        return;
      }

      setStep("done");
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Link Invalid or Expired</h2>
          <p className="text-sm text-muted">{error}</p>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Availability Submitted!</h2>
          <p className="text-sm text-muted">
            Thank you{data?.candidate.name ? `, ${data.candidate.name}` : ""}. Your availability has been
            recorded. You&apos;ll be notified when the next window opens.
          </p>
        </Card>
      </div>
    );
  }

  // ─── Stats ────────────────────────────────────────────────────────────

  const MIN_WEEKLY_HOURS = 20;
  const daysWithSlots = allWeekdays.filter((d) => totalHoursFromCells(cells, d.date) > 0).length;
  const totalSelectedHours = (cells.size * BLOCK_MINUTES) / 60;
  const week1Hours = week1Days.reduce((sum, d) => sum + totalHoursFromCells(cells, d.date), 0);
  const week2Hours = week2Days.reduce((sum, d) => sum + totalHoursFromCells(cells, d.date), 0);
  const week1Valid = week1Hours >= MIN_WEEKLY_HOURS;
  const week2Valid = week2Days.length === 0 || week2Hours >= MIN_WEEKLY_HOURS;
  const allWeeksComplete = week1Valid && week2Valid && week1Days.length > 0;

  // ─── Main render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-foreground">SlotMatch</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted">
              {data?.candidate.name || data?.candidate.email}
            </p>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">
            {step === "review" ? "Review Your Availability" : "Set Your Availability"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {step === "review"
              ? "Review your time slots below and confirm."
              : "Click and drag on the calendar to mark your available times. Each week requires a minimum of 20 hours. All times are in CST (Central Standard Time)."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-danger text-sm px-4 py-3 rounded-lg border border-red-100 dark:border-red-900 mb-4">
            {error}
          </div>
        )}

        {step === "edit" && (
          <div className="space-y-4">
            {/* Requirement info */}
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Each week requires a minimum of 20 hours of availability
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/70 mt-1">
                    For example, selecting all 4 slots (8h) on Monday, Wednesday, and half on Friday = 20 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Week tabs + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex bg-surface rounded-lg p-1 w-fit">
                {[0, 1].map((weekIdx) => {
                  const days = weekIdx === 0 ? week1Days : week2Days;
                  if (days.length === 0) return null;
                  const first = new Date(days[0].date + "T12:00:00");
                  const last = new Date(days[days.length - 1].date + "T12:00:00");
                  const label = `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                  const weekHrs = weekIdx === 0 ? week1Hours : week2Hours;
                  const weekOk = weekHrs >= MIN_WEEKLY_HOURS;

                  return (
                    <button
                      key={weekIdx}
                      onClick={() => setActiveWeek(weekIdx)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                        activeWeek === weekIdx
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Week {weekIdx + 1}
                      <span className="hidden sm:inline text-xs text-muted ml-1.5">
                        ({label})
                      </span>
                      <span className={`text-xs font-semibold ml-2 ${weekOk ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
                        {weekHrs}/{MIN_WEEKLY_HOURS}h
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={selectAllWeek}
                  className="text-xs text-primary hover:text-primary-hover font-medium cursor-pointer px-2 py-1 rounded hover:bg-primary-light transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={clearWeek}
                  className="text-xs text-muted hover:text-foreground font-medium cursor-pointer px-2 py-1 rounded hover:bg-surface transition-colors"
                >
                  Clear week
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-muted hover:text-danger font-medium cursor-pointer px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div
              ref={gridRef}
              className="bg-card rounded-xl border border-border overflow-hidden select-none"
              onMouseLeave={() => {
                if (isDragging) handlePointerUp();
              }}
            >
              {/* Column headers */}
              <div
                className="grid border-b border-border"
                style={{
                  gridTemplateColumns: `96px repeat(${currentWeekDays.length}, 1fr)`,
                }}
              >
                {/* Corner — timezone label */}
                <div className="p-2 bg-surface flex items-end justify-center">
                  <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">CST</span>
                </div>

                {/* Day headers */}
                {currentWeekDays.map((day) => {
                  const d = new Date(day.date + "T12:00:00");
                  const hours = totalHoursFromCells(cells, day.date);
                  const hasSlots = hours > 0;

                  return (
                    <div
                      key={day.date}
                      className="p-2 text-center bg-surface border-l border-border"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p className="text-xl font-bold text-foreground leading-tight">
                        {d.getDate()}
                      </p>
                      <p className="text-xs text-muted">
                        {d.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      {hasSlots && (
                        <div className="mt-1">
                          <span className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            {hours}h
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time rows */}
              {TIME_BLOCKS.map((time, rowIdx) => (
                  <div
                    key={time}
                    className="grid border-t border-border"
                    style={{
                      gridTemplateColumns: `96px repeat(${currentWeekDays.length}, 1fr)`,
                    }}
                  >
                    {/* Time label — show 2-hour range */}
                    <div className="px-2 py-0 flex items-center justify-end pr-3 bg-surface/50">
                      <span className="text-sm text-muted font-medium leading-tight text-right">
                        {fmtHour(time)}
                        <span className="block text-xs text-muted/60">to {fmtHour(addBlock(time))}</span>
                      </span>
                    </div>

                    {/* Cells */}
                    {currentWeekDays.map((day, colIdx) => {
                      const key = cellKey(day.date, time);
                      const selected = cells.has(key);
                      const inDrag = isInDragRect(colIdx, rowIdx);

                      // Determine visual state
                      let bg = "bg-card";
                      if (isDragging && inDrag) {
                        bg =
                          dragMode === "select"
                            ? "bg-indigo-200 dark:bg-indigo-700"
                            : "bg-red-100 dark:bg-red-900";
                      } else if (selected) {
                        bg = "bg-indigo-100 dark:bg-indigo-800";
                      }

                      return (
                        <div
                          key={key}
                          className={`h-16 border-l border-border cursor-pointer transition-colors duration-75 ${bg} hover:bg-indigo-50 dark:hover:bg-indigo-900`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handlePointerDown(colIdx, rowIdx);
                          }}
                          onMouseEnter={() =>
                            handlePointerMove(colIdx, rowIdx)
                          }
                          onTouchStart={(e) => {
                            e.preventDefault();
                            handlePointerDown(colIdx, rowIdx);
                          }}
                          onTouchMove={(e) => {
                            const touch = e.touches[0];
                            const el = document.elementFromPoint(
                              touch.clientX,
                              touch.clientY
                            );
                            if (el) {
                              const c = el.getAttribute("data-col");
                              const r = el.getAttribute("data-row");
                              if (c !== null && r !== null) {
                                handlePointerMove(parseInt(c), parseInt(r));
                              }
                            }
                          }}
                          data-col={colIdx}
                          data-row={rowIdx}
                        />
                      );
                    })}
                  </div>
              ))}
            </div>

            {/* Legend + stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm text-muted">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-4 rounded bg-indigo-100 dark:bg-indigo-800 border border-indigo-200 dark:border-indigo-600" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-4 rounded bg-card border border-border" />
                  <span>Unavailable</span>
                </div>
                <span className="text-border">|</span>
                <span>Click &amp; drag to select</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted">
                  {totalSelectedHours}h total
                </span>
                <span className="text-border">|</span>
                <span className={week1Valid ? "text-success font-medium" : "text-muted"}>
                  Wk 1: {week1Hours}/{MIN_WEEKLY_HOURS}h
                </span>
                <span className="text-border">|</span>
                <span className={week2Valid ? "text-success font-medium" : "text-muted"}>
                  Wk 2: {week2Hours}/{MIN_WEEKLY_HOURS}h
                </span>
              </div>
            </div>

            {/* Completion status */}
            {cells.size > 0 && !allWeeksComplete && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {!week1Valid && !week2Valid ? "Both weeks" : !week1Valid ? "Week 1" : "Week 2"} still need{!week1Valid !== !week2Valid ? "s" : ""} more availability
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">
                      {!week1Valid && `Week 1: ${week1Hours}h / ${MIN_WEEKLY_HOURS}h minimum`}
                      {!week1Valid && !week2Valid && " · "}
                      {!week2Valid && `Week 2: ${week2Hours}h / ${MIN_WEEKLY_HOURS}h minimum`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                loading={saving}
                size="lg"
                disabled={!allWeeksComplete}
              >
                Save &amp; Review
              </Button>
            </div>
          </div>
        )}

        {/* ── Review step ──────────────────────────────────────────────── */}
        {step === "review" && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-foreground">
                  {daysWithSlots} day{daysWithSlots !== 1 ? "s" : ""} with availability,{" "}
                  {totalSelectedHours} hours total
                </p>
              </div>
              <p className="text-xs text-muted ml-8">
                Review below. All times are in CST. Once you confirm, your availability is locked.
              </p>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {allWeekdays
                .filter((day) =>
                  slots.some((s) => s.date === day.date)
                )
                .map((day) => {
                  const daySlots = slots
                    .filter((s) => s.date === day.date)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                  const hours = totalHoursFromCells(cells, day.date);
                  const d = new Date(day.date + "T12:00:00");

                  return (
                    <div
                      key={day.date}
                      className="bg-card rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">
                          {d.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <Badge variant="success">
                          {hours}h
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {daySlots.map((slot, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span>
                              {fmt12(slot.startTime)} – {fmt12(slot.endTime)} CST
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setStep("edit")}>
                Go Back &amp; Edit
              </Button>
              <Button onClick={handleSubmit} loading={submitting} size="lg">
                Confirm &amp; Submit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
