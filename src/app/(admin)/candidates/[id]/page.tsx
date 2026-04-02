"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Card, { CardTitle } from "@/components/ui/card";
import { format, startOfWeek, addWeeks, endOfWeek } from "date-fns";
import { formatDateTz, formatTimestampTz, formatTz } from "@/lib/timezone";

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

  const [actionWindowId, setActionWindowId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"reset" | "delete" | "deleteWindow" | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [sendRequestMsg, setSendRequestMsg] = useState("");
  const [copyingLink, setCopyingLink] = useState(false);
  const [copyLinkMsg, setCopyLinkMsg] = useState("");
  const [windowLinkDate, setWindowLinkDate] = useState(() => {
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(mon, "yyyy-MM-dd");
  });
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generateLinkMsg, setGenerateLinkMsg] = useState("");
  const [sendingPeriodRequest, setSendingPeriodRequest] = useState(false);
  const [sendPeriodRequestMsg, setSendPeriodRequestMsg] = useState("");

  async function handleSendRequest() {
    setSendingRequest(true);
    setSendRequestMsg("");
    try {
      const res = await fetch(`/api/candidates/${id}/send-request`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setSendRequestMsg("Request sent!");
        // Reload to refresh notification history
        const reload = await fetch(`/api/candidates/${id}`);
        const data = await reload.json();
        if (data.success) setCandidate(data.data);
      } else {
        setSendRequestMsg(json.error || "Failed to send");
      }
    } catch {
      setSendRequestMsg("Failed to send request");
    } finally {
      setSendingRequest(false);
      setTimeout(() => setSendRequestMsg(""), 3000);
    }
  }

  async function handleCopyLink() {
    setCopyingLink(true);
    setCopyLinkMsg("");
    try {
      const res = await fetch(`/api/candidates/${id}/copy-link`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await navigator.clipboard.writeText(json.data.schedulingLink);
        setCopyLinkMsg("Link copied!");
        // Reload to refresh notification history
        const reload = await fetch(`/api/candidates/${id}`);
        const data = await reload.json();
        if (data.success) setCandidate(data.data);
      } else {
        setCopyLinkMsg(json.error || "Failed to get link");
      }
    } catch {
      setCopyLinkMsg("Failed to copy link");
    } finally {
      setCopyingLink(false);
      setTimeout(() => setCopyLinkMsg(""), 3000);
    }
  }

  async function handleGenerateWindowLink() {
    setGeneratingLink(true);
    setGenerateLinkMsg("");
    try {
      const res = await fetch(`/api/candidates/${id}/generate-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: windowLinkDate }),
      });
      const json = await res.json();
      if (json.success) {
        await navigator.clipboard.writeText(json.data.schedulingLink);
        setGenerateLinkMsg(`Copied! (${formatTimestampTz(json.data.weekStart, "MMM d")} – ${formatTimestampTz(json.data.weekEnd, "MMM d")})`);
        // Reload to refresh notification history + windows
        const reload = await fetch(`/api/candidates/${id}`);
        const data = await reload.json();
        if (data.success) setCandidate(data.data);
      } else {
        setGenerateLinkMsg(json.error || "Failed");
      }
    } catch {
      setGenerateLinkMsg("Failed to generate link");
    } finally {
      setGeneratingLink(false);
      setTimeout(() => setGenerateLinkMsg(""), 4000);
    }
  }

  async function handleSendPeriodRequest() {
    setSendingPeriodRequest(true);
    setSendPeriodRequestMsg("");
    try {
      const res = await fetch(`/api/candidates/${id}/send-request-for-period`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: windowLinkDate }),
      });
      const json = await res.json();
      if (json.success) {
        setSendPeriodRequestMsg(`Request sent! (${formatTimestampTz(json.data.weekStart, "MMM d")} – ${formatTimestampTz(json.data.weekEnd, "MMM d")})`);
        const reload = await fetch(`/api/candidates/${id}`);
        const data = await reload.json();
        if (data.success) setCandidate(data.data);
      } else {
        setSendPeriodRequestMsg(json.error || "Failed to send");
      }
    } catch {
      setSendPeriodRequestMsg("Failed to send request");
    } finally {
      setSendingPeriodRequest(false);
      setTimeout(() => setSendPeriodRequestMsg(""), 4000);
    }
  }

  async function handleClearSlots(windowId: string) {
    if (!confirm("Delete submitted availability for this window? Time slots will be cleared and the window reopened.")) return;
    setActionWindowId(windowId);
    setActionType("delete");
    try {
      const res = await fetch(`/api/candidates/${id}/clear-availability`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const reload = await fetch(`/api/candidates/${id}`);
        const data = await reload.json();
        if (data.success) setCandidate(data.data);
      }
    } catch (error) {
      console.error("Failed to delete availability:", error);
    } finally {
      setActionWindowId(null);
      setActionType(null);
    }
  }

  async function handleDeleteWindow(windowId: string) {
    if (!confirm("Permanently delete this entire availability window and all its data? This cannot be undone.")) return;
    setActionWindowId(windowId);
    setActionType("deleteWindow");
    try {
      const res = await fetch(`/api/candidates/${id}/windows/${windowId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        const reload = await fetch(`/api/candidates/${id}`);
        const data = await reload.json();
        if (data.success) setCandidate(data.data);
      }
    } catch (error) {
      console.error("Failed to delete window:", error);
    } finally {
      setActionWindowId(null);
      setActionType(null);
    }
  }

  async function handleResetWindow(windowId: string) {
    if (!confirm("Reset this submission? Time slots will be deleted and a new request sent.")) return;
    setActionWindowId(windowId);
    setActionType("reset");
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
      setActionWindowId(null);
      setActionType(null);
    }
  }

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

  const windows = candidate.availabilityWindows;

  function groupSlotsByDate(timeSlots: typeof windows[0]["timeSlots"]) {
    const map = new Map<string, typeof timeSlots>();
    for (const slot of timeSlots) {
      const dateKey = slot.date.split("T")[0];
      const existing = map.get(dateKey) || [];
      existing.push(slot);
      map.set(dateKey, existing);
    }
    return map;
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
        <div className="flex flex-col items-end gap-2">
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
          <div className="flex items-center gap-2">
            {candidate.status === "ACTIVE" && (
              <Button
                size="sm"
                onClick={handleSendRequest}
                loading={sendingRequest}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Request
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              loading={copyingLink}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Link
            </Button>
            {(sendRequestMsg || copyLinkMsg) && (
              <span className={`text-xs font-medium ${
                (sendRequestMsg || copyLinkMsg)?.includes("Failed") || (sendRequestMsg || copyLinkMsg)?.includes("must be") || (sendRequestMsg || copyLinkMsg)?.includes("already")
                  ? "text-danger"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {sendRequestMsg || copyLinkMsg}
              </span>
            )}
          </div>
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
            {formatTimestampTz(candidate.createdAt, "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Generate window-specific link */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <CardTitle>Generate Scheduling Link</CardTitle>
        </div>
        <p className="text-sm text-muted mb-4">
          Pick a 2-week window start date and generate a scheduling link scoped to that period.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="window-start" className="block text-xs font-medium text-muted mb-1">
              Window start (Monday)
            </label>
            <input
              id="window-start"
              type="date"
              value={windowLinkDate}
              onChange={(e) => setWindowLinkDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="text-sm text-muted py-2">
            {(() => {
              const d = new Date(windowLinkDate + "T12:00:00");
              if (isNaN(d.getTime())) return null;
              const ws = startOfWeek(d, { weekStartsOn: 1 });
              const we = endOfWeek(addWeeks(ws, 1), { weekStartsOn: 1 });
              return `${formatTz(ws, "MMM d")} – ${formatTz(we, "MMM d, yyyy")}`;
            })()}
          </div>
          <Button
            size="sm"
            onClick={handleGenerateWindowLink}
            loading={generatingLink}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Generate &amp; Copy Link
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSendPeriodRequest}
            loading={sendingPeriodRequest}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Request
          </Button>
          {generateLinkMsg && (
            <span className={`text-xs font-medium ${
              generateLinkMsg.includes("Failed") ? "text-danger" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {generateLinkMsg}
            </span>
          )}
          {sendPeriodRequestMsg && (
            <span className={`text-xs font-medium ${
              sendPeriodRequestMsg.includes("Failed") ? "text-danger" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {sendPeriodRequestMsg}
            </span>
          )}
        </div>
      </Card>

      {/* Availability Windows */}
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-lg font-semibold text-foreground">Availability Windows</h2>
        <span className="text-xs text-muted">({windows.length})</span>
        <span className="text-xs text-muted ml-1">· All times in CST</span>
      </div>

      {windows.length > 0 ? (
        <div className="space-y-4">
          {windows.map((win, idx) => {
            const slotsByDate = groupSlotsByDate(win.timeSlots);
            const isLoading = actionWindowId === win.id;

            return (
              <Card key={win.id}>
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border/40">
                  <p className="text-sm font-medium text-foreground">
                    {formatTimestampTz(win.weekStart, "MMM d")} –{" "}
                    {formatTimestampTz(win.weekEnd, "MMM d, yyyy")}
                  </p>
                  <Badge
                    dot
                    variant={
                      win.status === "SUBMITTED"
                        ? "success"
                        : win.status === "OPEN"
                          ? "warning"
                          : "default"
                    }
                  >
                    {win.status}
                  </Badge>
                  {idx === 0 && (
                    <Badge variant="info">Latest</Badge>
                  )}
                  {win.submittedAt && (
                    <p className="text-xs text-muted">
                      Submitted{" "}
                      {formatTimestampTz(win.submittedAt, "MMM d 'at' h:mm a")}
                    </p>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {idx === 0 && (win.status === "SUBMITTED" || win.status === "EXPIRED") && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResetWindow(win.id)}
                        loading={isLoading && actionType === "reset"}
                      >
                        Reset &amp; Resend
                      </Button>
                    )}
                    {win.timeSlots.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleClearSlots(win.id)}
                        loading={isLoading && actionType === "delete"}
                      >
                        Clear Slots
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteWindow(win.id)}
                      loading={isLoading && actionType === "deleteWindow"}
                    >
                      Delete Window
                    </Button>
                  </div>
                </div>

                {win.timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from(slotsByDate.entries()).map(([date, slots]) => (
                      <div
                        key={date}
                        className="bg-surface dark:bg-white/[0.03] rounded-xl p-4 border border-border/60 dark:border-white/[0.06]"
                      >
                        <p className="text-sm font-semibold text-foreground mb-2.5">
                          {formatDateTz(date, "EEEE, MMM d")}
                        </p>
                        <div className="space-y-1.5">
                          {slots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-primary" />
                              <p className="text-xs text-muted">
                                {formatTimestampTz(slot.startTime, "h:mm a")} –{" "}
                                {formatTimestampTz(slot.endTime, "h:mm a")} CST
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
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-6">
            <svg className="w-8 h-8 text-muted/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-muted">No availability windows created yet.</p>
          </div>
        </Card>
      )}

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
                  <Badge variant={log.channel === "EMAIL" ? "info" : log.channel === "SYSTEM" ? "warning" : "default"}>
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
                    {formatTimestampTz(log.createdAt, "MMM d, yyyy h:mm a")}
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
