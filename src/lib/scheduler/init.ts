import { initializeScheduler } from "./cron";

// This file is imported by the instrumentation hook to start cron jobs
let initialized = false;

export function startScheduler() {
  if (initialized) return;
  initialized = true;
  initializeScheduler();
}
