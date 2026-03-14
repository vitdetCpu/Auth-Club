export type BattleFaction = "red" | "blue";
export type Faction = BattleFaction | "judge";

export type Phase =
  | "prompting"
  | "voting-prompt"
  | "battling"
  | "voting-winner"
  | "results";

export type GameStatus = "waiting" | "active" | "finished";

export interface Submission {
  userId: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface Round {
  id: number;
  category: string;
  prompt: string;
  submissions: {
    red: Submission[];
    blue: Submission[];
  };
  winningPrompts: {
    red: string | null;
    blue: string | null;
  };
  responses: {
    red: { text: string; streaming: boolean };
    blue: { text: string; streaming: boolean };
  };
  votes: { red: number; blue: number };
  winnerVoters: string[];
  winner: Faction | null;
}

export interface TeamState {
  id: string;
  members: string[];
  score: number;
}

export interface GameState {
  status: GameStatus;
  currentRound: number;
  phase: Phase;
  phaseEndsAt: number;
  totalRounds: number;
  teams: {
    red: TeamState;
    blue: TeamState;
  };
  judges: string[];
  rounds: Round[];
}

export type SSEEvent =
  | { type: "phase-change"; data: { phase: Phase; phaseEndsAt: number; round: number; category: string; status: GameStatus; totalRounds: number; scores: { red: number; blue: number }; members: { red: number; blue: number } } }
  | { type: "prompt-submitted"; data: { faction: Faction; count: number } }
  | { type: "prompt-votes-update"; data: { faction: Faction; prompts: { text: string; votes: number }[] } }
  | { type: "winning-prompts"; data: { red: string; blue: string } }
  | { type: "agent-token"; data: { faction: Faction; token: string } }
  | { type: "agent-done"; data: { faction: Faction } }
  | { type: "winner-votes-update"; data: { red: number; blue: number } }
  | { type: "round-result"; data: { winner: Faction; scores: { red: number; blue: number } } }
  | { type: "game-over"; data: { winner: Faction; finalScores: { red: number; blue: number } } }
  | { type: "member-joined"; data: { members: { red: number; blue: number; judges: number } } };
