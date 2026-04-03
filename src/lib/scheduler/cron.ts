import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "../prisma";
import {
  sendAvailabilityRequest,
  sendReminder,
} from "../notifications/service";
import { getCurrentWindowBounds, ensureAvailabilityWindowForPeriod, expireOldWindows } from "../windows";
import { format, startOfWeek, endOfWeek, addWeeks, addDays } from "date-fns";

let availabilityTask: ScheduledTask | null = null;
let reminderTask: ScheduledTask | null = null;
let rotationTask: ScheduledTask | null = null;

interface ScheduleConfig {
  enabled: boolean;
  requestDays: number[];
  requestHour: number;
  requestMinute: number;
  reminderIntervalHours: number;
  reminderStartHour: number;
  reminderEndHour: number;
}

const DEFAULT_CONFIG: ScheduleConfig = {
  enabled: true,
  requestDays: [0], // Sunday
  requestHour: 8,
  requestMinute: 0,
  reminderIntervalHours: 3,
  reminderStartHour: 11,
  reminderEndHour: 23,
};

async function getScheduleConfig(): Promise<ScheduleConfig> {
  try {
    const schedule = await prisma.notificationSchedule.findFirst();
    if (!schedule) return DEFAULT_CONFIG;
    return {
      enabled: schedule.enabled,
      requestDays: schedule.requestDays,
      requestHour: schedule.requestHour,
      requestMinute: schedule.requestMinute,
      reminderIntervalHours: schedule.reminderIntervalHours,
      reminderStartHour: schedule.reminderStartHour,
      reminderEndHour: schedule.reminderEndHour,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function buildReminderHours(start: number, end: number, interval: number): number[] {
  const hours: number[] = [];
  for (let h = start; h <= end; h += interval) {
    hours.push(h);
  }
  return hours;
}

export async function initializeScheduler() {
  if (process.env.CRON_ENABLED !== "true") {
    console.log("[CRON] Scheduler disabled");
    return;
  }

  console.log("[CRON] Initializing scheduler...");

  const config = await getScheduleConfig();

  // Stop existing tasks
  availabilityTask?.stop();
  reminderTask?.stop();

  if (config.enabled) {
    // Availability request cron
    const days = config.requestDays.join(",");
    const availabilityCron = `${config.requestMinute} ${config.requestHour} * * ${days}`;
    console.log(`[CRON] Availability request: ${availabilityCron}`);

    availabilityTask = cron.schedule(availabilityCron, async () => {
      console.log("[CRON] Running availability request...");
      await handleWeeklyAvailabilityRequest();
    });

    // Reminder cron
    const reminderHours = buildReminderHours(
      config.reminderStartHour,
      config.reminderEndHour,
      config.reminderIntervalHours
    );
    const reminderCron = `0 ${reminderHours.join(",")} * * ${days}`;
    console.log(`[CRON] Reminders: ${reminderCron}`);

    reminderTask = cron.schedule(reminderCron, async () => {
      console.log("[CRON] Running reminder check...");
      await handleReminderCheck();
    });
  } else {
    console.log("[CRON] Notifications disabled by admin");
  }

  // Window rotation — always active (Monday midnight)
  if (!rotationTask) {
    rotationTask = cron.schedule("0 0 * * 1", async () => {
      console.log("[CRON] Running weekly window rotation...");
      await handleWindowRotation();
    });
  }

  console.log("[CRON] Scheduler initialized");
}

export async function restartScheduler() {
  console.log("[CRON] Restarting scheduler...");
  await initializeScheduler();
}

export async function handleWeeklyAvailabilityRequest(): Promise<number> {
  try {
    await expireOldWindows();

    const now = new Date();

    const activeCandidates = await prisma.candidate.findMany({
      where: { status: "ACTIVE" },
      include: {
        availabilityWindows: {
          orderBy: { weekStart: "desc" },
          take: 1,
        },
      },
    });

    let sent = 0;
    for (const candidate of activeCandidates) {
      const latestWindow = candidate.availabilityWindows[0];

      // If latest window is OPEN, candidate already has a pending request — skip
      if (latestWindow?.status === "OPEN") {
        console.log(`[CRON] Skipping ${candidate.email} — window is still OPEN`);
        continue;
      }

      // Determine the next window start date
      let nextStart: Date;
      if (!latestWindow) {
        // No window ever created — use current week
        nextStart = getCurrentWindowBounds().weekStart;
      } else {
        // Roll forward: next window starts the Monday after the latest window ended
        nextStart = startOfWeek(addDays(latestWindow.weekEnd, 1), { weekStartsOn: 1 });
        nextStart.setHours(0, 0, 0, 0);
      }

      // Only create if the next window's start date has arrived
      if (nextStart > now) {
        console.log(`[CRON] Skipping ${candidate.email} — next window starts ${nextStart.toISOString()}, not yet`);
        continue;
      }

      // Compute next window end for overlap check
      const nextEnd = endOfWeek(addWeeks(nextStart, 1), { weekStartsOn: 1 });
      nextEnd.setHours(23, 59, 59, 999);

      // Check no overlapping window exists
      const overlapping = await prisma.availabilityWindow.findFirst({
        where: {
          candidateId: candidate.id,
          weekStart: { lt: nextEnd },
          weekEnd: { gt: nextStart },
        },
      });
      if (overlapping) {
        console.log(`[CRON] Skipping ${candidate.email} — overlapping window exists`);
        continue;
      }

      // Skip if request already sent for this period
      const alreadySent = await prisma.notificationLog.findFirst({
        where: {
          candidateId: candidate.id,
          type: "AVAILABILITY_REQUEST",
          status: "SENT",
          createdAt: { gte: nextStart },
        },
      });
      if (alreadySent) continue;

      // Create the next window and send request
      const window = await ensureAvailabilityWindowForPeriod(candidate.id, nextStart);
      if (window.status !== "OPEN") continue;

      const note = `Window: ${format(window.weekStart, "MMM d")} – ${format(window.weekEnd, "MMM d, yyyy")}`;
      await sendAvailabilityRequest(candidate.id, window.token, note);
      sent++;
    }

    console.log(
      `[CRON] Sent availability requests to ${sent}/${activeCandidates.length} candidates`
    );
    return sent;
  } catch (error) {
    console.error("[CRON] Weekly availability request failed:", error);
    return 0;
  }
}

export async function handleReminderCheck(): Promise<number> {
  try {
    const now = new Date();

    // Only remind for OPEN windows that have already started
    const openWindows = await prisma.availabilityWindow.findMany({
      where: {
        status: "OPEN",
        weekStart: { lte: now },
      },
      include: {
        candidate: true,
      },
    });

    let count = 0;
    for (const window of openWindows) {
      if (window.candidate.status !== "ACTIVE") continue;

      // Skip if a reminder was already sent in the last 12 hours for this window
      const recentReminder = await prisma.notificationLog.findFirst({
        where: {
          candidateId: window.candidateId,
          type: "REMINDER",
          status: "SENT",
          createdAt: {
            gte: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        },
      });
      if (recentReminder) continue;

      await sendReminder(window.candidateId, window.token);
      count++;
    }

    console.log(`[CRON] Sent reminders to ${count} candidates`);
    return count;
  } catch (error) {
    console.error("[CRON] Reminder check failed:", error);
    return 0;
  }
}

async function handleWindowRotation() {
  try {
    await expireOldWindows();
    console.log("[CRON] Window rotation complete");
  } catch (error) {
    console.error("[CRON] Window rotation failed:", error);
  }
}
