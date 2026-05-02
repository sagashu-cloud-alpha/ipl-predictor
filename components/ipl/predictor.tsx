"use client";

import * as React from "react";
import { Trophy, UserRound, LogOut, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";

import type { Bracket, BracketResults, FilterId, Match, PlayoffStageId, TeamId } from "@/components/ipl/types";
import { genMatches, NRR_MOCK, TEAMS, teamById } from "@/components/ipl/data";
import { calcLeague, calcPlayoff, currentStreak, getStandings } from "@/components/ipl/logic";
import { TeamLogo } from "@/components/ipl/team-logo";
import { Toast, type ToastTone } from "@/components/ipl/toast";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PO: Array<{
  id: PlayoffStageId;
  label: string;
  desc: string;
  pts: number;
  isFinal?: boolean;
}> = [
  { id: "q1", label: "Qualifier 1", desc: "1st vs 2nd · Winner goes direct to Final", pts: 10 },
  { id: "el", label: "Eliminator", desc: "3rd vs 4th · Loser is eliminated", pts: 10 },
  { id: "q2", label: "Qualifier 2", desc: "Q1 loser vs Eliminator winner", pts: 15 },
  { id: "fn", label: "Final", desc: "Q1 winner vs Q2 winner", pts: 30, isFinal: true },
];

function useToast() {
  const [state, setState] = React.useState<{ msg: string; tone: ToastTone; show: boolean }>({
    msg: "",
    tone: "default",
    show: false,
  });

  const showToast = React.useCallback((msg: string, tone: ToastTone = "default") => {
    setState({ msg, tone, show: true });
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setState((s) => ({ ...s, show: false })), 2600);
  }, []);

  return { toast: state, showToast };
}

function leagueBadgeForMatch(args: {
  m: Match;
  streakAt: Record<number, number>;
}) {
  const { m, streakAt } = args;
  const hasResult = !!m.result;
  if (!hasResult && !m.userPick) return <Badge variant="secondary">open</Badge>;
  if (!hasResult && m.userPick) return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400">pending</Badge>;

  if (hasResult && m.userPick === m.result) {
    const sk = streakAt[m.id] ?? 0;
    const mult = Math.pow(2, sk - 1);
    const pts = 5 * mult;
    return sk > 1 ? (
      <Badge variant="warning">+{pts} 🔥×{mult}</Badge>
    ) : (
      <Badge variant="success">+{pts}</Badge>
    );
  }

  if (hasResult && m.userPick && m.userPick !== m.result) {
    return <Badge variant="danger">✗ {m.result ? teamById(m.result).short : "—"}</Badge>;
  }

  return <Badge variant="danger">—</Badge>;
}

function MatchCard({
  m,
  disabled,
  selected,
  onPick,
  badge,
  streakWin,
}: {
  m: Match;
  disabled: boolean;
  selected: { t1: boolean; t2: boolean };
  onPick: (matchId: number, teamId: TeamId) => void;
  badge: React.ReactNode;
  streakWin: boolean;
}) {
  const t1 = teamById(m.t1);
  const t2 = teamById(m.t2);
  const hasResult = !!m.result;

  const win1 = hasResult && selected.t1 && m.result === m.t1;
  const win2 = hasResult && selected.t2 && m.result === m.t2;
  const loss1 = hasResult && selected.t1 && m.result !== m.t1;
  const loss2 = hasResult && selected.t2 && m.result !== m.t2;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border",
        hasResult && m.userPick === m.result && "border-emerald-500/30 bg-emerald-500/5",
        hasResult && m.userPick && m.userPick !== m.result && "border-red-500/30 bg-red-500/5"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 bg-border",
          hasResult && m.userPick === m.result && "bg-emerald-500",
          hasResult && m.userPick && m.userPick !== m.result && "bg-red-500",
          streakWin && "bg-amber-500"
        )}
      />
      <CardContent className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Mobile: match number + badge on top row */}
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <span className="w-10 text-center text-xs font-mono text-muted-foreground">
              #{m.id}
            </span>
            <div className="flex justify-end">{badge}</div>
          </div>

          {/* Desktop: match number on left */}
          <span className="hidden w-10 text-center text-xs font-mono text-muted-foreground sm:block">
            #{m.id}
          </span>

          <div className="flex flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className={cn(
                "h-auto w-full justify-start gap-2 bg-muted/40 sm:flex-1",
                selected.t1 &&
                  "border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                win1 &&
                  "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                loss1 &&
                  "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300"
              )}
              disabled={disabled}
              onClick={() => onPick(m.id, m.t1)}
            >
              <TeamLogo id={m.t1} size={22} />
              <span className="font-medium">{t1.short}</span>
              <span className="text-xs text-muted-foreground truncate">{t1.name}</span>
            </Button>

            <div className="hidden sm:block px-1 text-xs font-mono text-muted-foreground">
              vs
            </div>
            <div className="sm:hidden text-center text-xs font-mono text-muted-foreground">
              vs
            </div>

            <Button
              variant="outline"
              className={cn(
                "h-auto w-full justify-start gap-2 bg-muted/40 sm:flex-1",
                selected.t2 &&
                  "border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                win2 &&
                  "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                loss2 &&
                  "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300"
              )}
              disabled={disabled}
              onClick={() => onPick(m.id, m.t2)}
            >
              <TeamLogo id={m.t2} size={22} />
              <span className="font-medium">{t2.short}</span>
              <span className="text-xs text-muted-foreground truncate">{t2.name}</span>
            </Button>
          </div>

          {/* Desktop: badge on far right */}
          <div className="hidden min-w-20 justify-end sm:flex">{badge}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressChip({
  icon,
  label,
  value,
  toneClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  toneClass?: string;
}) {
  return (
    <Card className="bg-card/70">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-muted", toneClass)}>
            <span className="text-base">{icon}</span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-none">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreChip({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-2 text-center",
        highlight ? "border-transparent bg-primary text-primary-foreground" : "bg-card/70"
      )}
    >
      <div className={cn("text-3xl leading-none tracking-tight", highlight && "text-primary-foreground")} style={{ fontFamily: "var(--font-mono)" }}>
        {value}
      </div>
      <div className={cn("mt-1 text-[10px] uppercase tracking-wider text-muted-foreground", highlight && "text-primary-foreground/70")}>
        {label}
      </div>
    </div>
  );
}

function HeaderScorePill({
  league,
  playoff,
  total,
  className,
}: {
  league: number;
  playoff: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border bg-card/70 px-3 py-2 shadow-sm",
        className
      )}
    >
      <div className="flex items-baseline gap-2">
        <div className="text-xs font-mono text-muted-foreground">League</div>
        <div className="text-sm font-semibold tabular-nums text-emerald-500">
          {league}
        </div>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-baseline gap-2">
        <div className="text-xs font-mono text-muted-foreground">Playoff</div>
        <div className="text-sm font-semibold tabular-nums text-purple-400">
          {playoff}
        </div>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-baseline gap-2">
        <div className="text-xs font-mono text-muted-foreground">Total</div>
        <div className="text-base font-semibold tabular-nums text-foreground">
          {total}
        </div>
      </div>
    </div>
  );
}

export function IplPredictor() {
  const { toast, showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut, loading } = useAuth();

  // Redirect to login if not authenticated (client-side protection)
  // Only redirect after loading is complete to avoid redirecting during session check
  React.useEffect(() => {
    if (!loading && user === null) {
      // User is definitely not authenticated
      window.location.href = '/login';
    }
  }, [user, loading]);

  const [activeTab, setActiveTab] = React.useState<
    "league" | "standings" | "playoffs" | "leaderboard" | "rules"
  >("league");

  const [matches, setMatches] = React.useState<Match[]>(() => genMatches());
  const [filter, setFilter] = React.useState<FilterId>("all");

  const [playoffChanges, setPlayoffChanges] = React.useState(3);
  const [playoffLocked, setPlayoffLocked] = React.useState(false);

  const [bracket, setBracket] = React.useState<Bracket>({ q1: null, el: null, q2: null, fn: null });
  const [bracketResults, setBracketResults] = React.useState<BracketResults>({
    q1: null,
    el: null,
    q2: null,
    fn: null,
  });

  const [userWinner, setUserWinner] = React.useState<TeamId | null>(null);
  const [actualWinner, setActualWinner] = React.useState<TeamId | null>(null);

  // Keep tab in URL so refresh preserves current view.
  React.useEffect(() => {
    const t = searchParams.get("tab");
    if (
      t === "league" ||
      t === "standings" ||
      t === "playoffs" ||
      t === "leaderboard" ||
      t === "rules"
    ) {
      setActiveTab(t);
    } else {
      setActiveTab("league");
    }
  }, [searchParams]);

  const onTabChange = React.useCallback(
    (t: string) => {
      if (
        t !== "league" &&
        t !== "standings" &&
        t !== "playoffs" &&
        t !== "leaderboard" &&
        t !== "rules"
      ) {
        return;
      }
      setActiveTab(t);
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", t);
      router.replace(`/app?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const standings = React.useMemo(() => getStandings(matches), [matches]);
  const top4 = React.useMemo(() => standings.slice(0, 4).map((r) => r.id), [standings]);

  const leagueScore = React.useMemo(() => calcLeague(matches), [matches]);
  const playoffScore = React.useMemo(
    () => calcPlayoff({ bracket, results: bracketResults, userWinner, actualWinner }),
    [bracket, bracketResults, userWinner, actualWinner]
  );
  const totalScore = leagueScore + playoffScore;

  const picked = React.useMemo(() => matches.filter((m) => m.userPick).length, [matches]);
  const correct = React.useMemo(() => matches.filter((m) => m.result && m.userPick === m.result).length, [matches]);
  const played = React.useMemo(() => matches.filter((m) => m.result).length, [matches]);
  const streak = React.useMemo(() => currentStreak(matches), [matches]);

  const accuracy = React.useMemo(() => {
    if (played <= 0 || picked <= 0) return null;
    return Math.round((correct / Math.min(picked, played)) * 100);
  }, [played, picked, correct]);

  const unpickedCount = React.useMemo(
    () => matches.filter((m) => !m.userPick && !m.result).length,
    [matches]
  );

  const filteredMatches = React.useMemo(() => {
    if (filter === "unpicked") return matches.filter((m) => !m.userPick && !m.result);
    if (filter === "pending") return matches.filter((m) => !m.result);
    if (filter === "correct") return matches.filter((m) => m.result && m.userPick === m.result);
    if (filter === "wrong") return matches.filter((m) => m.result && m.userPick && m.userPick !== m.result);
    return matches;
  }, [matches, filter]);

  const streakAt = React.useMemo(() => {
    const out: Record<number, number> = {};
    let s = 0;
    for (const m of matches) {
      if (m.result && m.userPick) {
        if (m.userPick === m.result) s++;
        else s = 0;
      }
      out[m.id] = s;
    }
    return out;
  }, [matches]);

  const onPick = React.useCallback((matchId: number, teamId: TeamId) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        if (m.locked || m.result) return m;
        const nextPick = m.userPick === teamId ? null : teamId;
        return { ...m, userPick: nextPick };
      })
    );
  }, []);

  const pickPlayoff = React.useCallback(
    (stage: PlayoffStageId, tid: TeamId) => {
      if (playoffLocked) return;
      if (bracketResults[stage]) return;

      setBracket((prev) => {
        const prevPick = prev[stage];
        if (prevPick === tid) {
          return { ...prev, [stage]: null };
        }
        if (prevPick !== null && prevPick !== tid) {
          setPlayoffChanges((c) => {
            if (c <= 0) {
              showToast("No more bracket changes!", "red");
              return c;
            }
            const next = c - 1;
            showToast(`Bracket changed — ${next} change${next !== 1 ? "s" : ""} left`, "orange");
            return next;
          });
        }
        return { ...prev, [stage]: tid };
      });
    },
    [playoffLocked, bracketResults, showToast]
  );

  const pickWinner = React.useCallback(
    (tid: TeamId) => {
      if (actualWinner) return;
      setUserWinner((prev) => {
        const next = prev === tid ? null : tid;
        if (next) showToast(`Champion pick: ${teamById(next).name}`, "orange");
        return next;
      });
    },
    [actualWinner, showToast]
  );

  const simNext = React.useCallback(() => {
    setMatches((prev) => {
      const idx = prev.findIndex((m) => !m.result);
      if (idx === -1) return prev;
      const m = prev[idx]!;
      const winner: TeamId = Math.random() < 0.5 ? m.t1 : m.t2;

      const next = prev.map((x) => (x.id === m.id ? { ...x, result: winner, locked: true } : x));

      // toast uses *new* streak, computed from next
      const s = currentStreak(next);
      const correctPick = m.userPick === winner;
      if (correctPick) {
        const pts = 5 * Math.pow(2, s - 1);
        const mult = Math.pow(2, s - 1);
        showToast(
          s > 1 ? `✓ ${teamById(winner).short} wins! +${pts} pts 🔥×${mult}` : `✓ ${teamById(winner).short} wins! +${pts} pts`,
          "green"
        );
      } else if (m.userPick) {
        showToast(`✗ ${teamById(winner).short} won — streak broken`, "red");
      } else {
        showToast(`${teamById(winner).short} wins match #${m.id}`, "default");
      }
      return next;
    });
  }, [showToast]);

  const simNextPlayoff = React.useCallback(() => {
    const stage = PO.find((s) => !bracketResults[s.id]);
    if (!stage) {
      showToast("All matches simulated!", "default");
      return;
    }
    const q1teams: TeamId[] = [top4[0]!, top4[1]!];
    const elteams: TeamId[] = [top4[2]!, top4[3]!];
    const q1pick = bracket.q1;
    const q1lose = q1pick ? q1teams.find((t) => t !== q1pick)! : null;
    const q2teams = [q1lose, bracket.el].filter(Boolean) as TeamId[];
    const fnteams = [bracket.q1, bracket.q2].filter(Boolean) as TeamId[];

    const teamMap: Record<PlayoffStageId, TeamId[]> = {
      q1: q1teams,
      el: elteams,
      q2: q2teams,
      fn: fnteams,
    };

    const teams = teamMap[stage.id];
    if (teams.length < 2) {
      showToast("Pick playoff teams first!", "red");
      return;
    }

    const winner = teams[Math.floor(Math.random() * 2)]!;
    setBracketResults((prev) => ({ ...prev, [stage.id]: winner }));

    const correctPick = bracket[stage.id] === winner;
    showToast(
      `${teamById(winner).short} wins ${stage.label}! ${correctPick ? "✓ +" + stage.pts + " pts" : "✗ Missed"}`,
      correctPick ? "green" : "red"
    );

    if (stage.id === "fn") {
      setActualWinner(winner);
      setPlayoffLocked(true);
    }
  }, [bracket, bracketResults, showToast, top4]);

  const matchList = React.useMemo(() => {
    let lastDay = -1;
    const out: React.ReactNode[] = [];
    for (const m of filteredMatches) {
      if (m.matchday !== lastDay) {
        lastDay = m.matchday;
        out.push(
          <div key={`md-${m.matchday}`} className="pt-4 pb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Matchday {m.matchday} — {m.venue}
          </div>
        );
      }
      const disabled = !!m.result || m.locked;
      const badge = leagueBadgeForMatch({ m, streakAt });
      const hasResult = !!m.result;
      const streakWin = hasResult && m.userPick === m.result && (streakAt[m.id] ?? 0) > 1;

      out.push(
        <MatchCard
          key={m.id}
          m={m}
          disabled={disabled}
          selected={{ t1: m.userPick === m.t1, t2: m.userPick === m.t2 }}
          onPick={onPick}
          badge={badge}
          streakWin={streakWin}
        />
      );
    }
    return out;
  }, [filteredMatches, onPick, streakAt]);

  const streakBanner = streak >= 2 ? (
    <Card className="border-amber-500/35 bg-amber-500/10">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="text-xl">🔥</div>
          <div className="min-w-0">
            <div className="font-semibold">{streak}-match winning streak!</div>
            <div className="text-sm opacity-80">
              Next correct pick = {5 * Math.pow(2, streak)} pts
            </div>
          </div>
          <div className="ml-auto rounded-md bg-amber-500/15 px-3 py-1 font-mono text-sm">
            ×{Math.pow(2, streak)}
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;

  // derived playoff teams
  const q1teams: TeamId[] = [top4[0]!, top4[1]!];
  const elteams: TeamId[] = [top4[2]!, top4[3]!];
  const q1lose = bracket.q1 ? q1teams.find((t) => t !== bracket.q1)! : null;
  const q2teams = [q1lose, bracket.el];
  const fnteams = [bracket.q1, bracket.q2];
  const playoffTeamsByStage: Record<PlayoffStageId, Array<TeamId | null>> = {
    q1: q1teams,
    el: elteams,
    q2: q2teams,
    fn: fnteams,
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(155,109,255,0.14)_0%,transparent_60%),radial-gradient(ellipse_40%_40%_at_90%_80%,rgba(247,201,72,0.10)_0%,transparent_50%)]" />
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                🏏
              </div>
              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-tight sm:text-xl">IPL Predictor</div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider">
                  2025 SEASON · TATA IPL
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HeaderScorePill
                league={leagueScore}
                playoff={playoffScore}
                total={totalScore}
                className="hidden lg:flex"
              />
              <div className="flex items-center gap-1">
                <ModeToggle />
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs font-medium">{user.email?.split('@')[0]}</span>
                      <span className="text-[10px] text-muted-foreground">{user.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sign out"
                      onClick={async () => {
                        await signOut("/login");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Profile"
                    onClick={() => router.push("/login")}
                  >
                    <UserRound className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-6xl px-4 pb-3">
            <div className="flex items-center gap-2 lg:hidden">
              <HeaderScorePill league={leagueScore} playoff={playoffScore} total={totalScore} className="w-full justify-center" />
            </div>
            <div className="mt-3">
              <TabsList className="flex w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted p-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
                <TabsTrigger className="flex-none sm:flex-1" value="league">
                  🏟 League
                </TabsTrigger>
                <TabsTrigger className="flex-none sm:flex-1" value="standings">
                  📊 Standings
                </TabsTrigger>
                <TabsTrigger className="flex-none sm:flex-1" value="playoffs">
                  ⚔️ Playoffs
                </TabsTrigger>
                <TabsTrigger className="flex-none sm:flex-1" value="leaderboard">
                  🏆 Leaderboard
                </TabsTrigger>
                <TabsTrigger className="flex-none sm:flex-1" value="rules">
                  📋 Rules
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ProgressChip
              icon="🎯"
              label="Matches picked"
              value={
                <span className="text-lg">
                  {picked}
                  <span className="text-xs text-muted-foreground">/70</span>
                </span>
              }
              toneClass="bg-blue-500/15"
            />
            <ProgressChip
              icon="✓"
              label="Correct picks"
              value={<span className="text-lg text-emerald-500">{correct}</span>}
              toneClass="bg-emerald-500/15"
            />
            <ProgressChip
              icon="🔥"
              label="Current streak"
              value={<span className="text-lg text-amber-500">{streak}</span>}
              toneClass="bg-amber-500/15"
            />
            <ProgressChip
              icon="⚡"
              label="Accuracy"
              value={<span className="text-lg text-primary">{accuracy === null ? "—" : `${accuracy}%`}</span>}
              toneClass="bg-primary/15"
            />
          </div>

          <TabsContent value="league" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-semibold tracking-tight">League Stage</div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", `All (70)`],
                    ["unpicked", `Unpicked (${unpickedCount})`],
                    ["pending", "Pending"],
                    ["correct", "✓ Correct"],
                    ["wrong", "✗ Wrong"],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    variant={filter === id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(id)}
                    className={cn(filter === id && "bg-primary text-primary-foreground")}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {streakBanner}

            <div className="space-y-2">
              {filteredMatches.length ? (
                matchList
              ) : (
                <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
                  No matches in this view
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={simNext}>
              ▷ Simulate next result <span className="text-xs opacity-60">(demo mode)</span>
            </Button>
          </TabsContent>

          <TabsContent value="standings" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-semibold tracking-tight">Points Table</div>
              <div className="text-xs font-mono text-muted-foreground">Top 4 qualify for playoffs</div>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[28px_1fr_32px_32px_32px_44px_56px_32px] gap-2 border-b px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      <div>#</div>
                      <div>Team</div>
                      <div className="text-center">P</div>
                      <div className="text-center">W</div>
                      <div className="text-center">L</div>
                      <div className="text-center">Pts</div>
                      <div className="text-center">NRR</div>
                      <div />
                    </div>
                    {standings.map((r, i) => {
                      const t = teamById(r.id);
                      const q = i < 4;
                      const nrr = NRR_MOCK[r.id] ?? 0;
                      return (
                        <div
                          key={r.id}
                          className={cn(
                            "grid grid-cols-[28px_1fr_32px_32px_32px_44px_56px_32px] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0",
                            q && "bg-emerald-500/5"
                          )}
                        >
                          <div className="text-center font-mono text-xs text-muted-foreground">{i + 1}</div>
                          <div className="flex items-center gap-3">
                            <TeamLogo id={r.id} size={26} />
                            <div className="min-w-0">
                              <div className="font-medium">{t.short}</div>
                              <div className="text-xs text-muted-foreground truncate">{t.name}</div>
                            </div>
                          </div>
                          <div className="text-center font-mono text-xs text-muted-foreground">{r.p}</div>
                          <div className="text-center font-mono text-xs text-emerald-500">{r.w}</div>
                          <div className="text-center font-mono text-xs text-red-500">{r.l}</div>
                          <div className="text-center text-lg font-semibold tabular-nums">{r.pts}</div>
                          <div
                            className={cn(
                              "text-center font-mono text-xs",
                              nrr >= 0 ? "text-emerald-500" : "text-red-500"
                            )}
                          >
                            {nrr > 0 ? "+" : ""}
                            {nrr.toFixed(3)}
                          </div>
                          <div className="text-center">{q ? <Badge variant="success">Q</Badge> : null}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="px-1 text-xs font-mono text-muted-foreground">
              * NRR values are simulated for demo. P=Played W=Won L=Lost Pts=Points
            </div>
          </TabsContent>

          <TabsContent value="playoffs" className="mt-6 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono text-muted-foreground">BRACKET CHANGES:</div>
                    <div className={cn("h-3 w-3 rounded-full", playoffChanges >= 1 ? "bg-primary" : "border bg-muted")} />
                    <div className={cn("h-3 w-3 rounded-full", playoffChanges >= 2 ? "bg-primary" : "border bg-muted")} />
                    <div className={cn("h-3 w-3 rounded-full", playoffChanges >= 3 ? "bg-primary" : "border bg-muted")} />
                    <div className="text-xs text-muted-foreground">{playoffChanges} remaining</div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs font-mono">
                    <span className="text-muted-foreground">
                      Q1 <span className="text-emerald-500">+10</span>
                    </span>
                    <span className="text-muted-foreground">
                      EL <span className="text-emerald-500">+10</span>
                    </span>
                    <span className="text-muted-foreground">
                      Q2 <span className="text-emerald-500">+15</span>
                    </span>
                    <span className="text-muted-foreground">
                      Final <span className="text-primary">+30</span>
                    </span>
                    <span className="text-muted-foreground">
                      🏆 <span className="text-primary">+50</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {playoffLocked ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                🔒 Playoffs have begun — bracket is now locked.
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {PO.map((stage) => {
                const teams = playoffTeamsByStage[stage.id];
                const pick = bracket[stage.id];
                const res = bracketResults[stage.id];
                return (
                  <Card key={stage.id} className={cn(stage.isFinal && "md:col-span-2")}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold">{stage.label}</div>
                          <div className="text-xs text-muted-foreground">{stage.desc}</div>
                        </div>
                        <Badge variant={stage.isFinal ? "default" : "success"} className={cn(stage.isFinal && "bg-primary text-primary-foreground")}>
                          +{stage.pts} pts
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        {teams.map((tid, idx) => {
                          if (!tid) {
                            return (
                              <div
                                key={`${stage.id}-${idx}`}
                                className="rounded-lg border bg-muted/40 px-3 py-3 text-center text-sm text-muted-foreground opacity-60"
                              >
                                TBD — waiting for earlier results
                              </div>
                            );
                          }
                          const t = teamById(tid);
                          const selected = pick === tid;
                          const outcome =
                            res && selected ? (pick === res ? "border-emerald-500/60 bg-emerald-500/10" : "border-red-500/60 bg-red-500/10") : "";
                          return (
                            <React.Fragment key={tid}>
                              {idx > 0 ? (
                                <div className="py-1 text-center text-xs font-mono text-muted-foreground">vs</div>
                              ) : null}
                              <Button
                                variant="outline"
                                className={cn("h-auto w-full justify-start gap-3 bg-muted/40", selected && "border-purple-500/60 bg-purple-500/10", outcome)}
                                disabled={playoffLocked || !!res}
                                onClick={() => pickPlayoff(stage.id, tid)}
                              >
                                <TeamLogo id={tid} size={26} />
                                <div className="min-w-0 text-left">
                                  <div className="font-medium">{t.short}</div>
                                  <div className="text-xs text-muted-foreground truncate">{t.name}</div>
                                </div>
                                {selected ? <div className="ml-auto text-lg">←</div> : null}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {res ? (
                        <div className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <TeamLogo id={res} size={18} />
                            <span className="font-semibold text-foreground">{teamById(res).short}</span>
                            <span>won ·</span>
                            {pick === res ? (
                              <span className="text-emerald-500">✓ Correct! +{stage.pts} pts</span>
                            ) : (
                              <span className="text-red-500">✗ Missed</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(247,201,72,0.10),transparent_60%)]" />
              <CardContent className="relative p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Trophy className="h-8 w-8" />
                </div>
                <div className="mt-3 text-xl font-semibold tracking-tight">Pick the IPL 2025 Champion</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Get it right for a massive <span className="font-semibold text-primary">+50 bonus pts</span>
                </div>

                <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
                  {TEAMS.map((t) => {
                    const picked = userWinner === t.id;
                    const correctPick = picked && actualWinner === t.id;
                    const wrongPick = picked && actualWinner && actualWinner !== t.id;
                    return (
                      <Button
                        key={t.id}
                        variant="outline"
                        className={cn(
                          "h-auto flex-col gap-2 py-3 bg-muted/40",
                          picked && "border-primary/60 bg-primary/10",
                          correctPick && "border-emerald-500/60 bg-emerald-500/10",
                          wrongPick && "border-red-500/60 bg-red-500/10"
                        )}
                        disabled={!!actualWinner}
                        onClick={() => pickWinner(t.id)}
                      >
                        <TeamLogo id={t.id} size={36} />
                        <div className={cn("text-xs font-semibold", picked && "text-primary")}>{t.short}</div>
                        <div className="text-[10px] text-muted-foreground">{t.name.split(" ").pop()}</div>
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-4 min-h-5 text-sm">
                  {userWinner ? (
                    actualWinner ? (
                      userWinner === actualWinner ? (
                        <span className="text-emerald-500">🏆 {teamById(userWinner).name} wins! +50 pts</span>
                      ) : (
                        <span className="text-red-500">✗ {teamById(userWinner).name} didn&apos;t win</span>
                      )
                    ) : (
                      <span className="text-primary">Your pick: {teamById(userWinner).name}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">No champion selected yet</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={simNextPlayoff}>
              ▷ Simulate next playoff result <span className="text-xs opacity-60">(demo mode)</span>
            </Button>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-lg font-semibold tracking-tight">Global Leaderboard</div>
              <div className="text-xs text-muted-foreground">Live · Updated after each match</div>
            </div>

            <div className="hidden sm:grid grid-cols-[36px_1fr_110px_60px_60px_70px] gap-2 px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <div>#</div>
              <div>Player</div>
              <div>Progress</div>
              <div className="text-center">League</div>
              <div className="text-center">Playoff</div>
              <div className="text-right">Total</div>
            </div>

            {(() => {
              const MOCK_LB = [
                { name: "Rohit F.", league: 52, playoff: 22, streak: 4 },
                { name: "Ananya S.", league: 48, playoff: 18, streak: 2 },
                { name: "Karan M.", league: 41, playoff: 20, streak: 0 },
                { name: "Priya V.", league: 38, playoff: 15, streak: 3 },
                { name: "Dev R.", league: 33, playoff: 12, streak: 1 },
                { name: "Shreya T.", league: 29, playoff: 10, streak: 0 },
                { name: "Arjun B.", league: 24, playoff: 5, streak: 0 },
              ];
              const me = { name: "You", league: leagueScore, playoff: playoffScore, streak };
              const all = [me, ...MOCK_LB]
                .map((p) => ({ ...p, total: p.league + p.playoff }))
                .sort((a, b) => b.total - a.total);
              const max = all[0]?.total || 1;

              return all.map((p, i) => {
                const isMe = p.name === "You";
                const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1);
                const pct = Math.round((p.total / max) * 100);
                return (
                  <Card key={p.name} className={cn(isMe && "border-blue-500/40 bg-blue-500/5")}>
                    <CardContent className="p-3">
                      {/* Mobile layout */}
                      <div className="space-y-3 sm:hidden">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40 text-lg font-semibold tabular-nums",
                              isMe && "border-blue-500/40 bg-blue-500/10 text-blue-500"
                            )}
                          >
                            {rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={cn("truncate font-medium", isMe && "text-blue-500")}>
                              {p.name} {isMe ? <span className="text-xs opacity-60">(you)</span> : null}
                            </div>
                            <div className="mt-1">
                              {p.streak >= 2 ? <Badge variant="warning">🔥 {p.streak}-streak</Badge> : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                              Total
                            </div>
                            <div className="text-xl font-semibold tabular-nums">{p.total}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2" />
                          <div className="w-10 text-right text-xs font-mono text-muted-foreground">{pct}%</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border bg-muted/30 px-3 py-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                              League
                            </div>
                            <div className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-500">
                              {p.league}
                            </div>
                          </div>
                          <div className="rounded-lg border bg-muted/30 px-3 py-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                              Playoff
                            </div>
                            <div className="mt-0.5 text-lg font-semibold tabular-nums text-purple-400">
                              {p.playoff}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop / tablet layout */}
                      <div className="hidden sm:grid sm:grid-cols-[36px_1fr_110px_60px_60px_70px] sm:items-center sm:gap-2">
                        <div className="text-center text-xl font-semibold tabular-nums">{rank}</div>
                        <div className="min-w-0">
                          <div className={cn("font-medium", isMe && "text-blue-500")}>
                            {p.name} {isMe ? <span className="text-xs opacity-60">(you)</span> : null}
                          </div>
                          <div className="mt-1">
                            {p.streak >= 2 ? <Badge variant="warning">🔥 {p.streak}-streak</Badge> : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1.5" />
                          <div className="w-9 text-right text-xs font-mono text-muted-foreground">{pct}%</div>
                        </div>
                        <div className="text-center font-mono text-sm text-emerald-500">{p.league}</div>
                        <div className="text-center font-mono text-sm text-purple-400">{p.playoff}</div>
                        <div className="text-right text-xl font-semibold tabular-nums">{p.total}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </TabsContent>

          <TabsContent value="rules" className="mt-6 space-y-4">
            <div className="text-lg font-semibold tracking-tight">Scoring Rules</div>

            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <div className="text-base font-semibold">🏟️ League Stage</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Correct match prediction</div>
                      <div className="font-mono text-emerald-500">+5 pts</div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Wrong or no prediction</div>
                      <div className="font-mono text-red-500">0 pts</div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Points lock before match</div>
                      <div className="font-mono text-muted-foreground">Yes</div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Total league matches</div>
                      <div className="font-mono">70</div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-muted-foreground">Max league pts (no streak)</div>
                      <div className="font-mono">350 pts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="text-base font-semibold">🔥 Streak Bonus</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Consecutive correct picks multiply your points. Streak resets on any wrong pick.
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    {[
                      ["⚡", "1 correct", "5 pts (1×)"],
                      ["🔥", "2 in a row", "10 pts (2×)"],
                      ["🔥🔥", "3 in a row", "20 pts (4×)"],
                      ["🔥🔥🔥", "4 in a row", "40 pts (8×)"],
                      ["🔥🔥🔥🔥", "5+ in a row", "80+ pts (16×+)"],
                    ].map(([i, l, r]) => (
                      <React.Fragment key={l}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-base">{i}</span>
                            <span className="text-muted-foreground">{l}</span>
                          </div>
                          <div className="font-mono text-amber-500">{r}</div>
                        </div>
                        <Separator />
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="text-base font-semibold">⚔️ Playoff Bracket</div>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      ["Qualifier 1 (1st vs 2nd)", "+10 pts"],
                      ["Eliminator (3rd vs 4th)", "+10 pts"],
                      ["Qualifier 2 (Q1 loser vs EL winner)", "+15 pts"],
                      ["Final", "+30 pts"],
                      ["Bracket changes allowed", "3 only"],
                    ].map(([l, r], idx) => (
                      <React.Fragment key={l}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-muted-foreground">{l}</div>
                          <div className="font-mono">{r}</div>
                        </div>
                        {idx < 4 ? <Separator /> : null}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="text-base font-semibold">🏆 Champion Pick</div>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      ["Correct winner prediction", "+50 pts"],
                      ["Wrong prediction", "0 pts"],
                      ["Can change prediction", "Until playoffs start"],
                      ["Max possible total score", "450+ pts"],
                    ].map(([l, r], idx) => (
                      <React.Fragment key={l}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-muted-foreground">{l}</div>
                          <div className="font-mono">{r}</div>
                        </div>
                        {idx < 3 ? <Separator /> : null}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </main>
      </Tabs>

      <Toast msg={toast.msg} tone={toast.tone} show={toast.show} />
    </div>
  );
}

