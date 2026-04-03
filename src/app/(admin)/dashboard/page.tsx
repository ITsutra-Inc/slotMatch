"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Card, { CardTitle } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { formatTimestampTz } from "@/lib/timezone";

interface CandidateRow {
  id: string;
  name: string | null;
  email: string;
  status: string;
  availabilityWindows: Array<{
    status: string;
    weekStart: string;
    weekEnd: string;
  }>;
}

interface ScheduleData {
  enabled: boolean;
  nextRequest: string | null;
  nextReminder: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCountdown(ms: number): { d: number; h: number; m: number; s: number } {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const totalSec = Math.floor(ms / 1000);
  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

function formatDate(iso: string): string {
  return formatTimestampTz(iso, "EEE, MMM d, h:mm a");
}

/** Get the Monday (start of week) for a given date as YYYY-MM-DD. */
function getLocalMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCandidateNextEvent(
  candidate: CandidateRow,
  schedule: ScheduleData
): {
  type: "reminder" | "request" | "disabled" | "inactive" | "submitted";
  iso: string | null;
  description: string;
} {
  if (!schedule.enabled) {
    return { type: "disabled", iso: null, description: "Notifications disabled" };
  }

  if (candidate.status !== "ACTIVE") {
    return {
      type: "inactive",
      iso: null,
      description: candidate.status === "PAUSED" ? "Paused — no notifications" : "Archived — no notifications",
    };
  }

  const window = candidate.availabilityWindows?.[0];
  const now = new Date();

  if (window?.status === "OPEN") {
    // If the window hasn't started yet, no reminders will be sent
    const windowStart = new Date(window.weekStart);
    if (windowStart > now) {
      return {
        type: "inactive",
        iso: null,
        description: `Window opens ${formatTimestampTz(window.weekStart, "MMM d")} — no reminders until then`,
      };
    }
    return {
      type: "reminder",
      iso: schedule.nextReminder,
      description: "Hasn't submitted yet — reminder scheduled",
    };
  }

  if (window?.status === "SUBMITTED") {
    // Check if any existing window overlaps the next cron period
    // The cron will skip this candidate if an overlap exists
    const windowEnd = new Date(window.weekEnd);
    if (windowEnd > now) {
      return {
        type: "submitted",
        iso: null,
        description: "All caught up — availability submitted",
      };
    }

    // Window has ended, next cron will create a new one
    if (schedule.nextRequest) {
      return {
        type: "request",
        iso: schedule.nextRequest,
        description: "Submitted — new window request scheduled",
      };
    }
  }

  // EXPIRED or no window
  return {
    type: "request",
    iso: schedule.nextRequest,
    description: "No active window — availability request scheduled",
  };
}

// ─── Stat Icons (inline SVGs) ───────────────────────────────────────────────

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

// ─── Countdown Unit ─────────────────────────────────────────────────────────

function CountdownUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold tabular-nums ${color}`}>
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [candRes, schedRes] = await Promise.all([
          fetch("/api/candidates?limit=50"),
          fetch("/api/notifications/next-send"),
        ]);
        const candJson = await candRes.json();
        const schedJson = await schedRes.json();
        if (candJson.success) {
          setCandidates(candJson.data);
          setTotal(candJson.total);
        }
        if (schedJson.success) setSchedule(schedJson.data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    load();

    const refresh = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications/next-send");
        const json = await res.json();
        if (json.success) setSchedule(json.data);
      } catch { /* silent */ }
    }, 5 * 60 * 1000);

    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const active = candidates.filter((c) => c.status === "ACTIVE").length;
  const pending = candidates.filter((c) => c.availabilityWindows?.[0]?.status === "OPEN").length;
  const completed = candidates.filter((c) => c.availabilityWindows?.[0]?.status === "SUBMITTED").length;

  const stats = [
    {
      label: "Total Candidates",
      value: total,
      accentColor: "var(--foreground)",
      textColor: "text-foreground",
      bgIcon: "text-foreground/[0.05]",
      Icon: UsersIcon,
    },
    {
      label: "Active",
      value: active,
      accentColor: "#10b981",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgIcon: "text-emerald-500/[0.07]",
      Icon: CheckCircleIcon,
    },
    {
      label: "Pending",
      value: pending,
      accentColor: "#f59e0b",
      textColor: "text-amber-600 dark:text-amber-400",
      bgIcon: "text-amber-500/[0.07]",
      Icon: ClockIcon,
    },
    {
      label: "Completed",
      value: completed,
      accentColor: "var(--primary)",
      textColor: "text-primary",
      bgIcon: "text-primary/[0.07]",
      Icon: SparklesIcon,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Overview of your candidate scheduling</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="stat-accent bg-card rounded-xl border border-border/60 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.04] p-5 relative overflow-hidden"
            style={{ "--stat-accent-color": s.accentColor } as React.CSSProperties}
          >
            <s.Icon className={`absolute right-3 top-3 w-10 h-10 ${s.bgIcon}`} />
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per-candidate cards with individual timers */}
      <div className="flex items-center justify-between">
        <CardTitle>Cron Job Schedule</CardTitle>
        <Link href="/candidates" className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
          View all candidates &rarr;
        </Link>
      </div>

      {schedule && !schedule.enabled && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Automated notifications are disabled</p>
              <p className="text-xs text-muted mt-0.5">
                <Link href="/notifications" className="text-primary hover:text-primary-hover transition-colors">Enable in Cron Scheduler settings</Link>
              </p>
            </div>
          </div>
        </Card>
      )}

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((candidate) => {
            const event = schedule
              ? getCandidateNextEvent(candidate, schedule)
              : null;
            const countdown = event?.iso
              ? new Date(event.iso).getTime() - now
              : 0;
            const time = formatCountdown(countdown);
            const window = candidate.availabilityWindows?.[0];

            const isActive = event?.type === "reminder" || event?.type === "request";

            const timerColor =
              event?.type === "reminder"
                ? "text-amber-500 dark:text-amber-400"
                : event?.type === "request"
                  ? "text-primary"
                  : "text-muted";

            const timerBg =
              event?.type === "reminder"
                ? "bg-amber-500/[0.06] border-amber-500/20"
                : event?.type === "request"
                  ? "bg-primary/[0.06] border-primary/20"
                  : event?.type === "submitted"
                    ? "bg-emerald-500/[0.06] border-emerald-500/20"
                    : "bg-surface/50 border-border/60";

            const dotColor =
              event?.type === "reminder"
                ? "bg-amber-400"
                : event?.type === "request"
                  ? "bg-primary"
                  : "";

            return (
              <Card key={candidate.id} hover className="relative flex flex-col">
                {/* Header: avatar + name + status */}
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/candidates/${candidate.id}`} className="flex items-center gap-3 min-w-0 group">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                      <span className="text-primary text-sm font-bold">
                        {(candidate.name || candidate.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {candidate.name || "—"}
                      </p>
                      <p className="text-xs text-muted truncate">{candidate.email}</p>
                    </div>
                  </Link>
                  <Badge dot variant={candidate.status === "ACTIVE" ? "success" : candidate.status === "PAUSED" ? "warning" : "default"}>
                    {candidate.status}
                  </Badge>
                </div>

                {/* Window status */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Window</span>
                  <Badge variant={window?.status === "SUBMITTED" ? "success" : window?.status === "OPEN" ? "warning" : "default"}>
                    {window?.status || "No window"}
                  </Badge>
                </div>

                {/* Individual countdown timer */}
                <div className={`rounded-xl border ${timerBg} p-3.5 mt-auto`}>
                  {event?.iso ? (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        {isActive && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} glow-dot`} />}
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">
                          {event.type === "reminder" ? "Next Reminder" : "Next Request"}
                        </p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[11px] text-muted leading-relaxed">{event.description}</p>
                          <p className="text-[11px] text-muted/70 mt-0.5">{formatDate(event.iso)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                        {time.d > 0 && <CountdownUnit value={time.d} label="days" color={timerColor} />}
                        <CountdownUnit value={time.h} label="hrs" color={timerColor} />
                        <CountdownUnit value={time.m} label="min" color={timerColor} />
                        <CountdownUnit value={time.s} label="sec" color={timerColor} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      {event?.type === "submitted" ? (
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-muted/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
                        </svg>
                      )}
                      <p className={`text-xs ${event?.type === "submitted" ? "text-emerald-600 dark:text-emerald-400" : "text-muted/80"}`}>{event?.description || "No schedule data"}</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <UsersIcon className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground font-medium text-sm">No candidates yet</p>
            <p className="text-muted text-xs mt-1 mb-3">Add your first candidate to get started</p>
            <Link href="/candidates" className="text-primary text-sm font-medium hover:text-primary-hover transition-colors">
              Add candidate &rarr;
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
