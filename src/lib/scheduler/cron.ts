import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "../prisma";
import {
  sendAvailabilityRequest,
  sendReminder,
} from "../notifications/service";
import { ensureAvailabilityWindow, expireOldWindows } from "../windows";

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

    const activeCandidates = await prisma.candidate.findMany({
      where: { status: "ACTIVE" },
    });

    for (const candidate of activeCandidates) {
      const window = await ensureAvailabilityWindow(candidate.id);

      if (window.status === "OPEN") {
        await sendAvailabilityRequest(candidate.id, window.token);
      }
    }

    console.log(
      `[CRON] Sent availability requests to ${activeCandidates.length} candidates`
    );
    return activeCandidates.length;
  } catch (error) {
    console.error("[CRON] Weekly availability request failed:", error);
    return 0;
  }
}

export async function handleReminderCheck(): Promise<number> {
  try {
    const openWindows = await prisma.availabilityWindow.findMany({
      where: { status: "OPEN" },
      include: {
        candidate: true,
      },
    });

    let count = 0;
    for (const window of openWindows) {
      if (window.candidate.status !== "ACTIVE") continue;
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
