"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import Card, { CardTitle } from "@/components/ui/card";
import Badge from "@/components/ui/badge";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:00 ${ampm}`;
}

function formatTime(h: number, m: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function buildReminderTimes(start: number, end: number, interval: number): string[] {
  const times: string[] = [];
  for (let h = start; h <= end; h += interval) {
    times.push(formatHour(h));
  }
  return times;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Schedule state
  const [enabled, setEnabled] = useState(true);
  const [requestDays, setRequestDays] = useState<number[]>([0]);
  const [requestHour, setRequestHour] = useState(8);
  const [requestMinute, setRequestMinute] = useState(0);
  const [reminderIntervalHours, setReminderIntervalHours] = useState(3);
  const [reminderStartHour, setReminderStartHour] = useState(11);
  const [reminderEndHour, setReminderEndHour] = useState(23);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications/schedule");
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setEnabled(d.enabled);
          setRequestDays(d.requestDays);
          setRequestHour(d.requestHour);
          setRequestMinute(d.requestMinute);
          setReminderIntervalHours(d.reminderIntervalHours);
          setReminderStartHour(d.reminderStartHour);
          setReminderEndHour(d.reminderEndHour);
        }
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleDay(day: number) {
    setRequestDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/notifications/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          requestDays,
          requestHour,
          requestMinute,
          reminderIntervalHours,
          reminderStartHour,
          reminderEndHour,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Schedule saved and cron jobs updated." });
      } else {
        setMessage({ type: "error", text: json.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNow() {
    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/notifications/send-now", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: `Availability requests sent to ${json.data.candidatesNotified} candidate(s).`,
        });
      } else {
        setMessage({ type: "error", text: json.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to send" });
    } finally {
      setSending(false);
    }
  }

  async function handleSendReminders() {
    setSendingReminders(true);
    setMessage(null);

    try {
      const res = await fetch("/api/notifications/send-reminders", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: `Reminders sent to ${json.data.remindersSent} candidate(s).`,
        });
      } else {
        setMessage({ type: "error", text: json.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to send" });
    } finally {
      setSendingReminders(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const reminderTimes = buildReminderTimes(reminderStartHour, reminderEndHour, reminderIntervalHours);

  const selectClass =
    "w-full rounded-xl border border-border/60 dark:border-white/[0.08] px-3 py-2.5 text-sm bg-card dark:bg-surface text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cron Job Scheduler</h1>
          <p className="text-muted text-sm mt-1">
            Configure when automated emails are sent to candidates
          </p>
        </div>
        <Badge dot variant={enabled ? "success" : "default"}>
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      {/* Toast message */}
      {message && (
        <div
          className={`text-sm px-4 py-3 rounded-xl border flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
              : "bg-red-50 dark:bg-red-500/10 text-danger border-red-100 dark:border-red-500/20"
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {message.type === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          {message.text}
        </div>
      )}

      {/* Enable / Disable toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Automated Notifications</CardTitle>
            <p className="text-sm text-muted mt-1">
              When enabled, emails are sent on the schedule below
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
              enabled ? "bg-primary" : "bg-surface-hover dark:bg-white/[0.1]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Availability request settings */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <CardTitle>Availability Request Schedule</CardTitle>
        </div>
        <p className="text-sm text-muted mb-5">
          Choose when the initial availability request email is sent to all active candidates.
        </p>

        {/* Day picker */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">
            Send on these days
          </label>
          <div className="flex gap-2">
            {DAY_NAMES.map((name, index) => (
              <button
                key={name}
                onClick={() => toggleDay(index)}
                className={`w-11 h-11 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  requestDays.includes(index)
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-surface dark:bg-white/[0.04] text-muted hover:bg-surface-hover dark:hover:bg-white/[0.08] border border-transparent dark:border-white/[0.06]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Time picker */}
        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Hour</label>
            <select
              value={requestHour}
              onChange={(e) => setRequestHour(Number(e.target.value))}
              className={selectClass}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {formatHour(i)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Minute</label>
            <select
              value={requestMinute}
              onChange={(e) => setRequestMinute(Number(e.target.value))}
              className={selectClass}
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  :{m.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 px-3 py-2.5 rounded-lg bg-primary/[0.06] border border-primary/10">
          <p className="text-xs text-muted">
            Requests will be sent at{" "}
            <span className="font-semibold text-foreground">
              {formatTime(requestHour, requestMinute)}
            </span>{" "}
            on{" "}
            <span className="font-semibold text-foreground">
              {requestDays.map((d) => DAY_NAMES[d]).join(", ")}
            </span>
          </p>
        </div>
      </Card>

      {/* Reminder settings */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <CardTitle>Reminder Settings</CardTitle>
        </div>
        <p className="text-sm text-muted mb-5">
          Reminders are sent to candidates who haven&apos;t submitted their availability yet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Remind every
            </label>
            <select
              value={reminderIntervalHours}
              onChange={(e) => setReminderIntervalHours(Number(e.target.value))}
              className={selectClass}
            >
              {[1, 2, 3, 4, 6].map((h) => (
                <option key={h} value={h}>
                  {h} hour{h > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Start at
            </label>
            <select
              value={reminderStartHour}
              onChange={(e) => setReminderStartHour(Number(e.target.value))}
              className={selectClass}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {formatHour(i)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Until
            </label>
            <select
              value={reminderEndHour}
              onChange={(e) => setReminderEndHour(Number(e.target.value))}
              className={selectClass}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {formatHour(i)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-surface dark:bg-white/[0.03] rounded-xl p-4 border border-border/60 dark:border-white/[0.06]">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2.5">Reminder times preview</p>
          <div className="flex flex-wrap gap-2">
            {reminderTimes.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          Save Schedule
        </Button>
      </div>

      {/* Manual triggers */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <CardTitle>Manual Triggers</CardTitle>
        </div>
        <p className="text-sm text-muted mb-4">
          Send notifications immediately to all active candidates, regardless of the schedule above.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={handleSendNow} loading={sending}>
            Send Availability Requests Now
          </Button>
          <Button variant="secondary" onClick={handleSendReminders} loading={sendingReminders}>
            Send Reminders Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
