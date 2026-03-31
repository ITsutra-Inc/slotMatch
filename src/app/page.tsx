import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">SlotMatch</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Interview scheduling made simple
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight leading-tight mb-6">
            Collect candidate availability{" "}
            <span className="text-primary">effortlessly</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            SlotMatch automates the collection of candidate interview
            availability with a rolling 2-week calendar. Send invitations,
            receive submissions, and query availability via API — all in one
            platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-all shadow-md hover:shadow-lg"
            >
              Start for free
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-card text-foreground font-medium rounded-lg border border-border hover:bg-surface transition-colors shadow-sm"
            >
              Sign in to dashboard
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20">
            {[
              {
                title: "2-Week Rolling Window",
                desc: "Automatic calendar periods that rotate biweekly with instant notifications.",
              },
              {
                title: "Smart Reminders",
                desc: "Automated email & SMS reminders every 3 hours until candidates submit.",
              },
              {
                title: "API Access",
                desc: "Query candidate availability in real-time from your AI agents or tools.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl border border-border p-6 text-left shadow-sm"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
