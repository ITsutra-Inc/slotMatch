"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Card, { CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

/** Parse an ISO/date string as a local Date to avoid timezone shift.
 *  For date-only strings: pins to noon local time.
 *  For datetime strings: extracts the UTC components and treats them as local. */
function parseLocalDate(s: string): Date {
  if (!s.includes("T")) {
    return new Date(s + "T12:00:00");
  }
  // For full ISO datetime, extract UTC parts and construct local
  const d = new Date(s);
  return new Date(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()
  );
}

interface CandidateDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  availabilityWindows: Array<{
    id: string;
    weekStart: string;
    weekEnd: string;
    status: string;
    submittedAt: string | null;
    timeSlots: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
    }>;
  }>;
  notificationLogs: Array<{
    id: string;
    type: string;
    channel: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
  }>;
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/candidates/${id}`);
        const json = await res.json();
        if (json.success) {
          setCandidate(json.data);
        }
      } catch (error) {
        console.error("Failed to load candidate:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const [resetting, setResetting] = useState(false);

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) {
      setCandidate((prev) => (prev ? { ...prev, status } : prev));
    }
  }

  async function handleResetSubmission() {
    if (!confirm("Reset this candidate's submission? Their time slots will be deleted and a new availability request will be sent.")) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/candidates/${id}/reset-submission`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const reload = await fetch(`/api/candidates/${id}`);
        const data = await reload.json();
        if (data.success) setCandidate(data.data);
      }
    } catch (error) {
      console.error("Failed to reset submission:", error);
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Candidate not found</p>
        <Button variant="ghost" onClick={() => router.push("/candidates")} className="mt-2">
          Back to candidates
        </Button>
      </div>
    );
  }

  const currentWindow = candidate.availabilityWindows[0];

  // Group time slots by date
  const slotsByDate = new Map<string, typeof currentWindow.timeSlots>();
  if (currentWindow) {
    for (const slot of currentWindow.timeSlots) {
      const dateKey = slot.date.split("T")[0];
      const existing = slotsByDate.get(dateKey) || [];
      existing.push(slot);
      slotsByDate.set(dateKey, existing);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/candidates")}
            className="text-sm text-muted hover:text-foreground transition-colors mb-3 inline-flex items-center gap-1.5 cursor-pointer group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to candidates
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-primary text-lg font-bold">
                {(candidate.name || candidate.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {candidate.name || candidate.email}
              </h1>
              <p className="text-muted text-sm">{candidate.email}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {candidate.status === "ACTIVE" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange("PAUSED")}
            >
              Pause
            </Button>
          ) : candidate.status === "PAUSED" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange("ACTIVE")}
            >
              Reactivate
            </Button>
          ) : candidate.status === "ARCHIVED" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange("ACTIVE")}
            >
              Unarchive
            </Button>
          ) : null}
          {candidate.status !== "ARCHIVED" && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleStatusChange("ARCHIVED")}
          >
            Archive
          </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="stat-accent bg-card rounded-xl border border-border/60 dark:shadow-none dark:ring-1 dark:ring-white/[0.04] p-5"
          style={{ "--stat-accent-color": candidate.status === "ACTIVE" ? "#10b981" : candidate.status === "PAUSED" ? "#f59e0b" : "var(--muted)" } as React.CSSProperties}
        >
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Status</p>
          <Badge
            dot
            variant={
              candidate.status === "ACTIVE"
                ? "success"
                : candidate.status === "PAUSED"
                  ? "warning"
                  : "default"
            }
          >
            {candidate.status}
          </Badge>
        </div>
        <div
          className="stat-accent bg-card rounded-xl border border-border/60 dark:shadow-none dark:ring-1 dark:ring-white/[0.04] p-5"
          style={{ "--stat-accent-color": "var(--primary)" } as React.CSSProperties}
        >
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Phone</p>
          <p className="text-sm font-medium text-foreground">{candidate.phone}</p>
        </div>
        <div
          className="stat-accent bg-card rounded-xl border border-border/60 dark:shadow-none dark:ring-1 dark:ring-white/[0.04] p-5"
          style={{ "--stat-accent-color": "var(--muted)" } as React.CSSProperties}
        >
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Added</p>
          <p className="text-sm font-medium text-foreground">
            {new Date(candidate.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Current availability window */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <CardTitle>Current Availability Window</CardTitle>
        </div>

        {currentWindow ? (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border/40">
              <p className="text-sm font-medium text-foreground">
                {format(parseLocalDate(currentWindow.weekStart), "MMM d")} –{" "}
                {format(parseLocalDate(currentWindow.weekEnd), "MMM d, yyyy")}
              </p>
              <Badge
                dot
                variant={
                  currentWindow.status === "SUBMITTED"
                    ? "success"
                    : currentWindow.status === "OPEN"
                      ? "warning"
                      : "default"
                }
              >
                {currentWindow.status}
              </Badge>
              {currentWindow.submittedAt && (
                <p className="text-xs text-muted">
                  Submitted{" "}
                  {format(new Date(currentWindow.submittedAt), "MMM d 'at' h:mm a")}
                </p>
              )}
              {(currentWindow.status === "SUBMITTED" || currentWindow.status === "EXPIRED") && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetSubmission}
                  loading={resetting}
                >
                  Reset &amp; Resend
                </Button>
              )}
            </div>

            {currentWindow.timeSlots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(slotsByDate.entries()).map(([date, slots]) => (
                  <div
                    key={date}
                    className="bg-surface dark:bg-white/[0.03] rounded-xl p-4 border border-border/60 dark:border-white/[0.06]"
                  >
                    <p className="text-sm font-semibold text-foreground mb-2.5">
                      {format(parseLocalDate(date), "EEEE, MMM d")}
                    </p>
                    <div className="space-y-1.5">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          <p className="text-xs text-muted">
                            {format(parseLocalDate(slot.startTime), "h:mm a")} –{" "}
                            {format(parseLocalDate(slot.endTime), "h:mm a")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-8 h-8 text-muted/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-muted">
                  No time slots submitted yet.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <svg className="w-8 h-8 text-muted/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-muted">No availability window created yet.</p>
          </div>
        )}
      </Card>

      {/* Notification log */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center gap-2">
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <CardTitle>Notification History</CardTitle>
        </div>
        {candidate.notificationLogs.length > 0 ? (
          <div className="divide-y divide-border/40">
            {candidate.notificationLogs.map((log) => (
              <div key={log.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-surface/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={log.channel === "EMAIL" ? "info" : "default"}>
                    {log.channel}
                  </Badge>
                  <p className="text-sm text-foreground">{log.type.replace(/_/g, " ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    dot
                    variant={
                      log.status === "SENT"
                        ? "success"
                        : log.status === "FAILED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {log.status}
                  </Badge>
                  <p className="text-xs text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <svg className="w-8 h-8 text-muted/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm text-muted">No notifications sent yet</p>
          </div>
        )}
      </Card>
    </div>
  );
}
