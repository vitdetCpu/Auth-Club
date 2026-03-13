import { gameState, getCurrentRound, getWinningPrompt, determineRoundWinner } from "./game-state";
import { getShuffledCategories, resolvePrompt, Category } from "./categories";
import { broadcast } from "./sse";
import { runBattle, abortBattle } from "./ai-battle";
import { Phase, Round } from "./types";

let phaseTimer: ReturnType<typeof setTimeout> | null = null;
let shuffledCategories: Category[] = [];

const PHASE_DURATIONS: Record<Phase, number> = {
  prompting: 45_000,
  "voting-prompt": 20_000,
  battling: 60_000,
  "voting-winner": 20_000,
  results: 10_000,
};

const PHASE_ORDER: Phase[] = [
  "prompting",
  "voting-prompt",
  "battling",
  "voting-winner",
  "results",
];

export function startGame(totalRounds: number = 5) {
  gameState.status = "active";
  gameState.totalRounds = totalRounds;
  gameState.currentRound = 0;
  gameState.teams.red.score = 0;
  gameState.teams.blue.score = 0;
  gameState.rounds = [];
  shuffledCategories = getShuffledCategories();
  startNextRound();
}

function startNextRound() {
  gameState.currentRound++;

  if (gameState.currentRound > gameState.totalRounds) {
    endGame();
    return;
  }

  const category = shuffledCategories[(gameState.currentRound - 1) % shuffledCategories.length];
  const prompt = resolvePrompt(category);

  const round: Round = {
    id: gameState.currentRound,
    category: category.name,
    prompt,
    submissions: { red: [], blue: [] },
    winningPrompts: { red: null, blue: null },
    responses: {
      red: { text: "", streaming: false },
      blue: { text: "", streaming: false },
    },
    votes: { red: 0, blue: 0 },
    winnerVoters: [],
    winner: null,
  };

  gameState.rounds.push(round);
  setPhase("prompting");
}

function setPhase(phase: Phase) {
  if (phaseTimer) clearTimeout(phaseTimer);

  if (gameState.phase === "battling" && phase !== "battling") {
    abortBattle();
  }

  gameState.phase = phase;
  gameState.phaseEndsAt = Date.now() + PHASE_DURATIONS[phase];

  const round = getCurrentRound();
  broadcast("phase-change", {
    phase,
    phaseEndsAt: gameState.phaseEndsAt,
    round: gameState.currentRound,
    category: round?.category ?? "",
    status: gameState.status,
    totalRounds: gameState.totalRounds,
    scores: { red: gameState.teams.red.score, blue: gameState.teams.blue.score },
    members: { red: gameState.teams.red.members.length, blue: gameState.teams.blue.members.length },
  });

  if (phase === "battling") {
    onBattleStart();
  } else if (phase === "results") {
    onResultsStart();
  }

  phaseTimer = setTimeout(() => advancePhase(), PHASE_DURATIONS[phase]);
}

function advancePhase() {
  const currentIndex = PHASE_ORDER.indexOf(gameState.phase);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= PHASE_ORDER.length) {
    startNextRound();
  } else {
    setPhase(PHASE_ORDER[nextIndex]);
  }
}

function onBattleStart() {
  const round = getCurrentRound()!;

  const redPrompt = getWinningPrompt("red") ?? round.prompt;
  const bluePrompt = getWinningPrompt("blue") ?? round.prompt;

  round.winningPrompts.red = redPrompt;
  round.winningPrompts.blue = bluePrompt;

  broadcast("winning-prompts", { red: redPrompt, blue: bluePrompt });

  runBattle(round);
}

function onResultsStart() {
  const round = getCurrentRound()!;
  const winner = determineRoundWinner();
  round.winner = winner;
  gameState.teams[winner].score++;

  broadcast("round-result", {
    winner,
    scores: {
      red: gameState.teams.red.score,
      blue: gameState.teams.blue.score,
    },
  });
}

function endGame() {
  if (phaseTimer) clearTimeout(phaseTimer);
  gameState.status = "finished";

  const winner: "red" | "blue" =
    gameState.teams.red.score > gameState.teams.blue.score
      ? "red"
      : gameState.teams.blue.score > gameState.teams.red.score
        ? "blue"
        : Math.random() < 0.5 ? "red" : "blue";

  broadcast("game-over", {
    winner,
    finalScores: {
      red: gameState.teams.red.score,
      blue: gameState.teams.blue.score,
    },
  });
}

export function stopGame() {
  if (phaseTimer) clearTimeout(phaseTimer);
  gameState.status = "finished";
}
