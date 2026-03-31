export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAdminExists } = await import("@/lib/seed-admin");
    await ensureAdminExists();

    const { startScheduler } = await import("@/lib/scheduler/init");
    startScheduler();
  }
}
