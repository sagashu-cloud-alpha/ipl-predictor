export type TeamId =
  | "mi"
  | "csk"
  | "rcb"
  | "kkr"
  | "srh"
  | "dc"
  | "pbks"
  | "rr"
  | "lsg"
  | "gt";

export type Team = {
  id: TeamId;
  name: string;
  short: string;
  color: string;
};

export type Match = {
  id: number;
  t1: TeamId;
  t2: TeamId;
  userPick: TeamId | null;
  result: TeamId | null;
  locked: boolean;
  matchday: number;
  venue: string;
};

export type PlayoffStageId = "q1" | "el" | "q2" | "fn";

export type Bracket = Record<PlayoffStageId, TeamId | null>;
export type BracketResults = Record<PlayoffStageId, TeamId | null>;

export type FilterId = "all" | "unpicked" | "pending" | "correct" | "wrong";

