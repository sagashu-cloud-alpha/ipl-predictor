import type { Match, Team, TeamId } from "@/components/ipl/types";

export const TEAMS: Team[] = [
  { id: "mi", name: "Mumbai Indians", short: "MI", color: "#004C93" },
  { id: "csk", name: "Chennai Super Kings", short: "CSK", color: "#F5A623" },
  {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    short: "RCB",
    color: "#E03A3E",
  },
  { id: "kkr", name: "Kolkata Knight Riders", short: "KKR", color: "#3A225D" },
  { id: "srh", name: "Sunrisers Hyderabad", short: "SRH", color: "#F26522" },
  { id: "dc", name: "Delhi Capitals", short: "DC", color: "#0078BC" },
  { id: "pbks", name: "Punjab Kings", short: "PBKS", color: "#AA4545" },
  { id: "rr", name: "Rajasthan Royals", short: "RR", color: "#2D4DA0" },
  { id: "lsg", name: "Lucknow Super Giants", short: "LSG", color: "#A72B2A" },
  { id: "gt", name: "Gujarat Titans", short: "GT", color: "#1C1C5E" },
];

export const NRR_MOCK: Record<TeamId, number> = {
  mi: 0.812,
  csk: 0.445,
  rcb: 0.231,
  kkr: 0.119,
  srh: -0.102,
  dc: -0.214,
  pbks: -0.889,
  rr: 0.034,
  lsg: -0.455,
  gt: 0.087,
};

export function teamById(id: TeamId): Team {
  const t = TEAMS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown team id: ${id}`);
  return t;
}

export function genMatches(): Match[] {
  const pairs: [TeamId, TeamId][] = [];
  for (let i = 0; i < TEAMS.length; i++) {
    for (let j = i + 1; j < TEAMS.length; j++) {
      pairs.push([TEAMS[i]!.id, TEAMS[j]!.id]);
    }
  }
  const rematches = pairs.slice(0, 25).map(([a, b]) => [b, a] as [TeamId, TeamId]);
  const all = [...pairs, ...rematches];

  const venues = ["Wankhede", "Eden Gardens", "Chinnaswamy", "Chepauk", "Narendra Modi"];
  return all.map(([t1, t2], i) => ({
    id: i + 1,
    t1,
    t2,
    userPick: null,
    result: null,
    locked: false,
    matchday: Math.floor(i / 5) + 1,
    venue: venues[i % venues.length]!,
  }));
}

