import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(155,109,255,0.14)_0%,transparent_60%),radial-gradient(ellipse_40%_40%_at_90%_80%,rgba(247,201,72,0.10)_0%,transparent_50%)]" />
      </div>

      <header className="border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              🏏
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-tight sm:text-xl">
                IPL Predictor
              </div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-wider">
                Predict matches. Track streaks. Top the leaderboard.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try it out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-14">
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            <span className="font-mono">IPL 2025</span>
            <span className="h-3 w-px bg-border" />
            <span>Demo SaaS UI</span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            A clean way to predict IPL matches and compete with friends
          </h1>

          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Pick winners, earn streak bonuses, and simulate results in demo mode.
            The app is fully responsive with light/dark mode.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try it out
            </Link>
            <Link
              href="/app"
              className="inline-flex h-11 items-center justify-center rounded-md border bg-background px-6 text-sm font-medium hover:bg-accent"
            >
              View app directly
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { title: "League picks", desc: "70 matches with streak multipliers." },
              { title: "Playoff bracket", desc: "Limited changes + bonus points." },
              { title: "Leaderboard", desc: "See your rank and progress." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border bg-card/70 p-4 text-left">
                <div className="font-medium">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
