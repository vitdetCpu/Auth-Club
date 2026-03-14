import { GameState, Faction, BattleFaction, Submission, Round } from "./types";

export const gameState: GameState = {
  status: "waiting",
  currentRound: 0,
  phase: "prompting",
  phaseEndsAt: 0,
  totalRounds: 5,
  teams: {
    red: { id: "", members: [], score: 0 },
    blue: { id: "", members: [], score: 0 },
  },
  judges: [],
  rounds: [],
};

export function resetGame(totalRounds: number = 5) {
  gameState.status = "waiting";
  gameState.currentRound = 0;
  gameState.phase = "prompting";
  gameState.phaseEndsAt = 0;
  gameState.totalRounds = totalRounds;
  gameState.teams.red.score = 0;
  gameState.teams.blue.score = 0;
  // Keep members — players who joined before game start should persist
  gameState.rounds = [];
}

export function addMember(faction: Faction, userId: string) {
  if (faction === "judge") {
    if (!gameState.judges.includes(userId)) {
      gameState.judges.push(userId);
    }
    return;
  }
  const team = gameState.teams[faction];
  if (!team.members.includes(userId)) {
    team.members.push(userId);
  }
}

export function getSmallerFaction(): BattleFaction {
  return gameState.teams.red.members.length <= gameState.teams.blue.members.length
    ? "red"
    : "blue";
}

export function getCurrentRound(): Round | null {
  return gameState.rounds[gameState.currentRound - 1] ?? null;
}

export function addSubmission(faction: BattleFaction, submission: Submission): boolean {
  const round = getCurrentRound();
  if (!round) return false;
  const userCount = round.submissions[faction].filter(s => s.userId === submission.userId).length;
  if (userCount >= 3) return false;
  round.submissions[faction].push(submission);
  return true;
}

export function voteForPrompt(faction: BattleFaction, index: number, userId: string): boolean {
  const round = getCurrentRound();
  if (!round) return false;
  const submissions = round.submissions[faction];
  if (index < 0 || index >= submissions.length) return false;
  if (submissions[index].voters.includes(userId)) return false;
  submissions[index].voters.push(userId);
  submissions[index].votes++;
  return true;
}

export function getWinningPrompt(faction: BattleFaction): string | null {
  const round = getCurrentRound();
  if (!round) return null;
  const submissions = round.submissions[faction];
  if (submissions.length === 0) return null;
  return submissions.reduce((best, s) => (s.votes > best.votes ? s : best), submissions[0]).text;
}

export function voteForWinner(votedFor: BattleFaction, userId: string): boolean {
  const round = getCurrentRound();
  if (!round) return false;
  if (round.winnerVoters.includes(userId)) return false;
  round.winnerVoters.push(userId);
  round.votes[votedFor]++;
  return true;
}

export function determineRoundWinner(): BattleFaction {
  const round = getCurrentRound()!;
  if (round.votes.red === round.votes.blue) {
    return Math.random() < 0.5 ? "red" : "blue";
  }
  return round.votes.red > round.votes.blue ? "red" : "blue";
}
