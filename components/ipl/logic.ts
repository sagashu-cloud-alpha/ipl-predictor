import type {
  Bracket,
  BracketResults,
  Match,
  PlayoffStageId,
  TeamId,
} from "@/components/ipl/types";
import { NRR_MOCK, TEAMS } from "@/components/ipl/data";

export function calcLeague(matches: Match[]) {
  let score = 0;
  let streak = 0;
  for (const m of matches) {
    if (m.result && m.userPick) {
      if (m.userPick === m.result) {
        streak++;
        score += 5 * Math.pow(2, streak - 1);
      } else {
        streak = 0;
      }
    }
  }
  return score;
}

export function calcPlayoff(args: {
  bracket: Bracket;
  results: BracketResults;
  userWinner: TeamId | null;
  actualWinner: TeamId | null;
}) {
  const pts: Record<PlayoffStageId, number> = { q1: 10, el: 10, q2: 15, fn: 30 };
  let score = 0;
  for (const k of Object.keys(pts) as PlayoffStageId[]) {
    const pick = args.bracket[k];
    const res = args.results[k];
    if (pick && res && pick === res) score += pts[k];
  }
  if (args.userWinner && args.actualWinner && args.userWinner === args.actualWinner)
    score += 50;
  return score;
}

export function currentStreak(matches: Match[]) {
  let s = 0;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]!;
    if (m.result && m.userPick) {
      if (m.userPick === m.result) s++;
      else break;
    }
  }
  return s;
}

export function getStandings(matches: Match[]) {
  const map: Record<TeamId, { id: TeamId; p: number; w: number; l: number; pts: number }> =
    Object.fromEntries(
      TEAMS.map((t) => [t.id, { id: t.id, p: 0, w: 0, l: 0, pts: 0 }])
    ) as any;

  for (const m of matches) {
    if (!m.result) continue;
    map[m.t1].p++;
    map[m.t2].p++;
    if (m.result === m.t1) {
      map[m.t1].w++;
      map[m.t1].pts += 2;
      map[m.t2].l++;
    } else {
      map[m.t2].w++;
      map[m.t2].pts += 2;
      map[m.t1].l++;
    }
  }

  return Object.values(map).sort(
    (a, b) => b.pts - a.pts || (NRR_MOCK[b.id] ?? 0) - (NRR_MOCK[a.id] ?? 0)
  );
}

