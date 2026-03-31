import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <nav className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-md shadow-primary/25">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">SlotMatch</span>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-all shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/15 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-primary/20">
            <span className="w-1.5 h-1.5 bg-primary rounded-full glow-dot" />
            Single-admin scheduling platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
            Collect candidate availability{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              effortlessly
            </span>
          </h1>

          <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            A private admin tool that automates candidate interview scheduling.
            Add candidates, send automated availability requests, track
            submissions, and query schedules via API.
          </p>

          {/* Single CTA */}
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign in to Dashboard
          </Link>

          {/* How it works */}
          <div className="mt-20 mb-8">
            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-8">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                {
                  step: "1",
                  title: "Add Candidates",
                  desc: "Enter email and phone. An availability request is sent immediately.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  ),
                },
                {
                  step: "2",
                  title: "Candidates Submit",
                  desc: "They click a secure link and pick their available time slots.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  ),
                },
                {
                  step: "3",
                  title: "Auto Reminders",
                  desc: "Cron jobs send follow-ups until availability is submitted.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  ),
                },
                {
                  step: "4",
                  title: "Query via API",
                  desc: "Fetch availability data in real-time for your tools or AI agents.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  ),
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative bg-card rounded-2xl border border-border/60 dark:border-white/[0.06] p-6 text-left shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.04] card-hover"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">Step {item.step}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5 text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature grid */}
          <div className="mt-16">
            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-8">Key Features</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  title: "2-Week Rolling Window",
                  desc: "Automatic calendar periods that rotate weekly. New windows are created and old ones expire seamlessly.",
                  color: "#10b981",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ),
                },
                {
                  title: "Configurable Cron Scheduler",
                  desc: "Set exactly when availability requests and reminders go out. Pick days, hours, and reminder intervals.",
                  color: "#f59e0b",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ),
                },
                {
                  title: "Secure API Access",
                  desc: "Generate scoped API keys to query candidate availability from external tools, AI agents, or integrations.",
                  color: "var(--primary)",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  ),
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="stat-accent bg-card rounded-2xl border border-border/60 dark:border-white/[0.06] p-6 text-left shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.04] card-hover"
                  style={{ "--stat-accent-color": feature.color } as React.CSSProperties}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface dark:bg-white/[0.04] flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-border/40">
            <p className="text-xs text-muted/60">
              SlotMatch — Private admin tool for candidate availability scheduling
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
