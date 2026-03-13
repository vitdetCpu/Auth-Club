# Agent Arena Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live audience-powered AI agent competition where two factions compete through crowd-sourced prompts, with results streaming on a projector.

**Architecture:** Next.js App Router with in-memory game state, Stack Auth for auth + teams, SSE for real-time broadcasting, and Anthropic Claude SDK for dual-agent streaming. Split display (`/arena` projector) + mobile (`/play` phone) approach.

**Tech Stack:** Next.js 14+ (App Router), Stack Auth, Anthropic Claude TypeScript SDK, Tailwind CSS, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-13-agent-arena-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/types.ts` | All TypeScript interfaces (GameState, Round, Submission, Faction, Phase) |
| `lib/categories.ts` | Pre-defined challenge categories with parameterized value lists |
| `lib/game-state.ts` | Singleton in-memory game state + pure mutation functions |
| `lib/sse.ts` | SSE connection manager: register/remove clients, broadcast events, initial sync |
| `lib/game-engine.ts` | Timer-based phase machine: start game, advance phases, trigger side effects |
| `lib/ai-battle.ts` | Claude API dual-stream: fire two concurrent streams, emit SSE tokens |
| `stack/server.ts` | stackServerApp instance (created by Stack Auth wizard) |
| `stack/client.ts` | stackClientApp instance (created by Stack Auth wizard) |
| `app/layout.tsx` | Root layout: StackProvider, StackTheme, fonts, global CSS vars |
| `app/page.tsx` | Landing page: sign-in form, animated title, grid background |
| `app/play/page.tsx` | Mobile player UI: server component for team assignment + client component for phases |
| `app/arena/page.tsx` | Projector display: SSE-driven side-by-side battle view |
| `app/api/stream/route.ts` | GET SSE endpoint |
| `app/api/submit-prompt/route.ts` | POST submit a prompt |
| `app/api/vote-prompt/route.ts` | POST vote on a team prompt |
| `app/api/vote-winner/route.ts` | POST vote for the other team's response |
| `app/api/admin/start/route.ts` | POST start/reset game (requires ADMIN_SECRET) |
| `components/shared/StreamingText.tsx` | Typewriter text rendering component |
| `components/shared/GlowBorder.tsx` | Neon glow border wrapper |
| `components/play/FactionBadge.tsx` | Red/Blue team badge pill with glow |
| `components/play/PhaseIndicator.tsx` | Current phase name + countdown timer |
| `components/play/PromptInput.tsx` | Text input + submit button |
| `components/play/PromptList.tsx` | Scrollable prompt list with upvote buttons |
| `components/play/VoteCards.tsx` | Two response cards for winner voting |
| `components/arena/RoundHeader.tsx` | Round number + category display |
| `components/arena/Timer.tsx` | Large countdown timer with pulse effect |
| `components/arena/SplitBattle.tsx` | Side-by-side agent response panels |
| `components/arena/VoteCounter.tsx` | Animated vote tally display |
| `components/arena/Leaderboard.tsx` | Score display bottom ticker |
| `components/arena/WinnerReveal.tsx` | Winner animation overlay |
| `middleware.ts` | Stack Auth middleware (created by wizard) |

---

## Chunk 1: Project Scaffold + Core Libraries

### Task 1: Initialize Next.js + Stack Auth + Dependencies

**Files:**
- Create: entire Next.js project scaffold via CLI
- Create: `.env.local`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/t3rni/stack-auth-hackathon
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias "@/*" --turbopack
```

Note: The directory already contains `.git` and `docs/`. The CLI may prompt for confirmation to use a non-empty directory — confirm yes. If it refuses, temporarily move `docs/` out, run the command, then move `docs/` back in. Verify `tsconfig.json` has `"@/*": ["./*"]` in `paths` after scaffolding.

- [ ] **Step 2: Initialize Stack Auth**

```bash
npx @stackframe/init-stack@latest
```

Follow the wizard — select Next.js App Router. This creates `stack/server.ts`, `stack/client.ts`, updates `app/layout.tsx`, creates `app/handler/[...stack]/page.tsx`, and `middleware.ts`.

- [ ] **Step 3: Install additional dependencies**

```bash
npm install @anthropic-ai/sdk lucide-react
```

- [ ] **Step 4: Create `.env.local`**

Create `.env.local` with the required environment variables:

```env
# Stack Auth (values from Stack Auth dashboard)
NEXT_PUBLIC_STACK_PROJECT_ID=<from-dashboard>
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<from-dashboard>
STACK_SECRET_SERVER_KEY=<from-dashboard>

# Anthropic
ANTHROPIC_API_KEY=<your-key>
CLAUDE_MODEL=claude-sonnet-4-5-20250929

# Admin
ADMIN_SECRET=arena-admin-secret-change-me
```

- [ ] **Step 5: Add Google Fonts to layout**

In `app/layout.tsx`, add Russo One + Chakra Petch fonts via `next/font/google` and set CSS custom properties for the design system colors on the `<html>` element.

Fonts config:
```typescript
import { Chakra_Petch } from "next/font/google";
// Note: Russo One may not be in next/font/google — if not, use @import in globals.css
const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});
```

Add to `globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');

:root {
  --bg-deep: #0D0D1A;
  --bg-card: #1A1A2E;
  --red-faction: #FF4655;
  --blue-faction: #00D4FF;
  --text-primary: #E2E8F0;
  --text-muted: #64748B;
  --accent-gold: #FFD700;
  --font-display: 'Russo One', sans-serif;
}
```

Set `<body>` background to `var(--bg-deep)` and text color to `var(--text-primary)`.

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Open `http://localhost:3000` — should see default Next.js page with dark background and correct fonts loading.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js + Stack Auth + Tailwind + fonts + design tokens"
```

---

### Task 2: Types + Categories

**Files:**
- Create: `lib/types.ts`
- Create: `lib/categories.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```typescript
export type Faction = "red" | "blue";

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
  rounds: Round[];
}

// SSE event types
export type SSEEvent =
  | { type: "phase-change"; data: { phase: Phase; phaseEndsAt: number; round: number; category: string; status: GameStatus; totalRounds: number; scores: { red: number; blue: number }; members: { red: number; blue: number } } }
  | { type: "prompt-submitted"; data: { faction: Faction; count: number } }
  | { type: "prompt-votes-update"; data: { faction: Faction; prompts: { text: string; votes: number }[] } }
  | { type: "winning-prompts"; data: { red: string; blue: string } }
  | { type: "agent-token"; data: { faction: Faction; token: string } }
  | { type: "agent-done"; data: { faction: Faction } }
  | { type: "winner-votes-update"; data: { red: number; blue: number } }
  | { type: "round-result"; data: { winner: Faction; scores: { red: number; blue: number } } }
  | { type: "game-over"; data: { winner: Faction; finalScores: { red: number; blue: number } } };
```

- [ ] **Step 2: Create `lib/categories.ts`**

```typescript
export interface Category {
  name: string;
  promptTemplate: string;
  values?: string[];
}

const categories: Category[] = [
  {
    name: "Roast Battle",
    promptTemplate: "Write a creative roast of the opposing faction",
  },
  {
    name: "Sales Pitch",
    promptTemplate: "Pitch why your faction deserves to win the arena",
  },
  {
    name: "Haiku Challenge",
    promptTemplate: "Write a haiku about {topic}",
    values: ["artificial intelligence", "Monday mornings", "pizza", "the internet", "cats"],
  },
  {
    name: "ELI5",
    promptTemplate: "Explain {topic} like I'm 5 years old",
    values: ["quantum computing", "blockchain", "black holes", "DNA", "inflation"],
  },
  {
    name: "Debate Club",
    promptTemplate: "Argue convincingly for: {topic}",
    values: ["tabs are better than spaces", "pineapple belongs on pizza", "AI will replace programmers", "remote work is superior"],
  },
  {
    name: "Code Golf",
    promptTemplate: "Write the shortest solution to: {topic}",
    values: ["FizzBuzz", "reverse a string", "check for palindrome", "fibonacci sequence"],
  },
  {
    name: "Storyteller",
    promptTemplate: "Continue this story in the most unexpected way: {topic}",
    values: [
      "The last human on Earth heard a knock...",
      "The AI said 'I'm sorry, I can't do that' and meant it...",
      "The hackathon had been going for 72 hours when...",
    ],
  },
  {
    name: "Conspiracy Theory",
    promptTemplate: "Invent the most convincing fake conspiracy about {topic}",
    values: ["rubber ducks", "the cloud", "semicolons", "dark mode"],
  },
];

export function getShuffledCategories(): Category[] {
  const shuffled = [...categories];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function resolvePrompt(category: Category): string {
  if (!category.values) return category.promptTemplate;
  const value = category.values[Math.floor(Math.random() * category.values.length)];
  return category.promptTemplate.replace("{topic}", value);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/categories.ts
git commit -m "feat: add TypeScript types and challenge categories"
```

---

### Task 3: In-Memory Game State

**Files:**
- Create: `lib/game-state.ts`

- [ ] **Step 1: Create `lib/game-state.ts`**

```typescript
import { GameState, Faction, Submission, Round } from "./types";

// Singleton in-memory game state
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
  // Note: clearing members means existing players are "ghosts" until they refresh /play.
  // This is acceptable for a hackathon — the game restart flow is:
  // 1. Admin calls /api/admin/start
  // 2. SSE broadcasts phase-change with status "active" to all clients
  // 3. Players' PlayClient receives the event and re-renders
  // 4. On next /play page load (refresh), server component re-registers them in memory
  // For the demo, ask players to refresh after a restart if member counts look wrong.
  gameState.teams.red.members = [];
  gameState.teams.blue.members = [];
  gameState.rounds = [];
}

export function addMember(faction: Faction, userId: string) {
  const team = gameState.teams[faction];
  if (!team.members.includes(userId)) {
    team.members.push(userId);
  }
}

export function getSmallerFaction(): Faction {
  return gameState.teams.red.members.length <= gameState.teams.blue.members.length
    ? "red"
    : "blue";
}

export function getCurrentRound(): Round | null {
  return gameState.rounds[gameState.currentRound - 1] ?? null;
}

export function addSubmission(faction: Faction, submission: Submission): boolean {
  const round = getCurrentRound();
  if (!round) return false;
  // Check max 3 per user per round
  const userCount = round.submissions[faction].filter(s => s.userId === submission.userId).length;
  if (userCount >= 3) return false;
  round.submissions[faction].push(submission);
  return true;
}

export function voteForPrompt(faction: Faction, index: number, userId: string): boolean {
  const round = getCurrentRound();
  if (!round) return false;
  const submissions = round.submissions[faction];
  if (index < 0 || index >= submissions.length) return false;
  if (submissions[index].voters.includes(userId)) return false;
  submissions[index].voters.push(userId);
  submissions[index].votes++;
  return true;
}

export function getWinningPrompt(faction: Faction): string | null {
  const round = getCurrentRound();
  if (!round) return null;
  const submissions = round.submissions[faction];
  if (submissions.length === 0) return null;
  return submissions.reduce((best, s) => (s.votes > best.votes ? s : best), submissions[0]).text;
}

export function voteForWinner(votedFor: Faction, userId: string): boolean {
  const round = getCurrentRound();
  if (!round) return false;
  // We track votes in the round — no per-user tracking here (done via metadata)
  round.votes[votedFor]++;
  return true;
}

export function determineRoundWinner(): Faction {
  const round = getCurrentRound()!;
  // If tie, random
  if (round.votes.red === round.votes.blue) {
    return Math.random() < 0.5 ? "red" : "blue";
  }
  return round.votes.red > round.votes.blue ? "red" : "blue";
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/game-state.ts
git commit -m "feat: add in-memory game state with mutation functions"
```

---

### Task 4: SSE Infrastructure

**Files:**
- Create: `lib/sse.ts`
- Create: `app/api/stream/route.ts`

- [ ] **Step 1: Create `lib/sse.ts`**

```typescript
import { GameState } from "./types";

interface SSEClient {
  controller: ReadableStreamDefaultController;
  id: string;
}

const clients = new Set<SSEClient>();

export function addClient(controller: ReadableStreamDefaultController): string {
  const id = crypto.randomUUID();
  clients.add({ controller, id });
  return id;
}

export function removeClient(id: string) {
  for (const client of clients) {
    if (client.id === id) {
      clients.delete(client);
      break;
    }
  }
}

export function broadcast(event: string, data: object) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  for (const client of clients) {
    try {
      client.controller.enqueue(encoded);
    } catch {
      // Client disconnected, clean up
      clients.delete(client);
    }
  }
}

export function sendToClient(clientId: string, event: string, data: object) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  for (const client of clients) {
    if (client.id === clientId) {
      try {
        client.controller.enqueue(encoded);
      } catch {
        clients.delete(client);
      }
      break;
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
```

- [ ] **Step 2: Create `app/api/stream/route.ts`**

```typescript
import { addClient, removeClient, broadcast } from "@/lib/sse";
import { gameState } from "@/lib/game-state";

export const dynamic = "force-dynamic";

export async function GET() {
  let clientId: string;

  const stream = new ReadableStream({
    start(controller) {
      clientId = addClient(controller);

      // Send initial state sync
      const round = gameState.rounds[gameState.currentRound - 1];
      const initData = {
        phase: gameState.phase,
        phaseEndsAt: gameState.phaseEndsAt,
        round: gameState.currentRound,
        category: round?.category ?? "",
        status: gameState.status,
        totalRounds: gameState.totalRounds,
        scores: { red: gameState.teams.red.score, blue: gameState.teams.blue.score },
        members: { red: gameState.teams.red.members.length, blue: gameState.teams.blue.members.length },
      };
      const message = `event: phase-change\ndata: ${JSON.stringify(initData)}\n\n`;
      controller.enqueue(new TextEncoder().encode(message));
    },
    cancel() {
      removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 3: Verify SSE endpoint works**

Start dev server, then in another terminal:

```bash
curl -N http://localhost:3000/api/stream
```

Expected: should receive an initial `event: phase-change` message with `status: "waiting"`.

- [ ] **Step 4: Commit**

```bash
git add lib/sse.ts app/api/stream/route.ts
git commit -m "feat: add SSE connection manager and stream endpoint"
```

---

## Chunk 2: Game Engine + API Routes

### Task 5: Game Engine (Phase Machine)

**Files:**
- Create: `lib/game-engine.ts`

- [ ] **Step 1: Create `lib/game-engine.ts`**

```typescript
import { gameState, getCurrentRound, getWinningPrompt, determineRoundWinner } from "./game-state";
import { getShuffledCategories, resolvePrompt, Category } from "./categories";
import { broadcast } from "./sse";
import { runBattle, abortBattle } from "./ai-battle";
import { Phase, Round } from "./types";

let phaseTimer: NodeJS.Timeout | null = null;
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
    winner: null,
  };

  gameState.rounds.push(round);
  setPhase("prompting");
}

function setPhase(phase: Phase) {
  if (phaseTimer) clearTimeout(phaseTimer);

  // Abort any running battle streams when leaving battle phase
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

  // Phase-entry side effects
  if (phase === "voting-prompt") {
    // No special action — clients switch to voting UI
  } else if (phase === "battling") {
    onBattleStart();
  } else if (phase === "voting-winner") {
    // No special action — clients switch to voting UI
  } else if (phase === "results") {
    onResultsStart();
  }

  phaseTimer = setTimeout(() => advancePhase(), PHASE_DURATIONS[phase]);
}

function advancePhase() {
  const currentIndex = PHASE_ORDER.indexOf(gameState.phase);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= PHASE_ORDER.length) {
    // End of round, start next
    startNextRound();
  } else {
    setPhase(PHASE_ORDER[nextIndex]);
  }
}

function onBattleStart() {
  const round = getCurrentRound()!;

  // Select winning prompts (top voted, or first, or default)
  const redPrompt = getWinningPrompt("red") ?? round.prompt;
  const bluePrompt = getWinningPrompt("blue") ?? round.prompt;

  round.winningPrompts.red = redPrompt;
  round.winningPrompts.blue = bluePrompt;

  broadcast("winning-prompts", { red: redPrompt, blue: bluePrompt });

  // Fire dual agent streams
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

  // Random tiebreak if scores are equal
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
```

- [ ] **Step 2: Verify compiles** (will have import error for `ai-battle` — that's fine, we create it next)

Create a stub `lib/ai-battle.ts` so it compiles:

```typescript
import { Round } from "./types";

export async function runBattle(round: Round) {
  // Stub — implemented in Task 7
}
```

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/game-engine.ts lib/ai-battle.ts
git commit -m "feat: add game engine with phase machine and timer"
```

---

### Task 6: API Routes (Admin + Submit + Vote)

**Files:**
- Create: `app/api/admin/start/route.ts`
- Create: `app/api/submit-prompt/route.ts`
- Create: `app/api/vote-prompt/route.ts`
- Create: `app/api/vote-winner/route.ts`

- [ ] **Step 1: Create admin start endpoint**

`app/api/admin/start/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { startGame } from "@/lib/game-engine";
import { gameState, resetGame } from "@/lib/game-state";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, rounds } = body;

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  resetGame(rounds ?? 5);
  startGame(rounds ?? 5);

  return NextResponse.json({ status: "started", rounds: gameState.totalRounds });
}
```

- [ ] **Step 2: Create submit-prompt endpoint**

`app/api/submit-prompt/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { gameState, addSubmission, getCurrentRound } from "@/lib/game-state";
import { broadcast } from "@/lib/sse";
import { Faction } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faction = user.serverMetadata?.faction as Faction | undefined;
  if (!faction) return NextResponse.json({ error: "No faction assigned" }, { status: 400 });

  if (gameState.phase !== "prompting") {
    return NextResponse.json({ error: "Not in prompting phase" }, { status: 400 });
  }

  const body = await request.json();
  const text = body.text?.trim();
  if (!text || text.length > 280) {
    return NextResponse.json({ error: "Invalid prompt (1-280 chars)" }, { status: 400 });
  }

  const added = addSubmission(faction, {
    userId: user.id,
    text,
    votes: 0,
    voters: [],
  });

  if (!added) {
    return NextResponse.json({ error: "Max 3 submissions per round" }, { status: 429 });
  }

  const round = getCurrentRound()!;
  broadcast("prompt-submitted", {
    faction,
    count: round.submissions[faction].length,
  });

  // Also broadcast updated prompt list so team members see it in real-time
  broadcast("prompt-votes-update", {
    faction,
    prompts: round.submissions[faction].map(s => ({ text: s.text, votes: s.votes })),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 3: Create vote-prompt endpoint**

`app/api/vote-prompt/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { gameState, voteForPrompt, getCurrentRound } from "@/lib/game-state";
import { broadcast } from "@/lib/sse";
import { Faction } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faction = user.serverMetadata?.faction as Faction | undefined;
  if (!faction) return NextResponse.json({ error: "No faction assigned" }, { status: 400 });

  if (gameState.phase !== "voting-prompt") {
    return NextResponse.json({ error: "Not in voting phase" }, { status: 400 });
  }

  // Check if already voted this round
  if (user.serverMetadata?.hasVotedPrompt === gameState.currentRound) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  const body = await request.json();
  const { index } = body;

  const voted = voteForPrompt(faction, index, user.id);
  if (!voted) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  // Update user metadata
  await user.update({
    serverMetadata: { ...user.serverMetadata, hasVotedPrompt: gameState.currentRound },
  });

  // Broadcast updated prompt votes
  const round = getCurrentRound()!;
  broadcast("prompt-votes-update", {
    faction,
    prompts: round.submissions[faction].map(s => ({ text: s.text, votes: s.votes })),
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Create vote-winner endpoint**

`app/api/vote-winner/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { gameState, voteForWinner, getCurrentRound } from "@/lib/game-state";
import { broadcast } from "@/lib/sse";
import { Faction } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faction = user.serverMetadata?.faction as Faction | undefined;
  if (!faction) return NextResponse.json({ error: "No faction assigned" }, { status: 400 });

  if (gameState.phase !== "voting-winner") {
    return NextResponse.json({ error: "Not in voting phase" }, { status: 400 });
  }

  const body = await request.json();
  const votedFor = body.votedFor as Faction;

  // Must vote for the OTHER team
  if (votedFor === faction) {
    return NextResponse.json({ error: "Cannot vote for own team" }, { status: 403 });
  }

  if (!["red", "blue"].includes(votedFor)) {
    return NextResponse.json({ error: "Invalid faction" }, { status: 400 });
  }

  // Check if already voted this round
  if (user.serverMetadata?.hasVotedWinner === gameState.currentRound) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  voteForWinner(votedFor, user.id);

  // Update user metadata
  await user.update({
    serverMetadata: { ...user.serverMetadata, hasVotedWinner: gameState.currentRound },
  });

  // Broadcast updated winner votes
  const round = getCurrentRound()!;
  broadcast("winner-votes-update", {
    red: round.votes.red,
    blue: round.votes.blue,
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Verify all compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Test admin endpoint**

```bash
curl -X POST http://localhost:3000/api/admin/start \
  -H "Content-Type: application/json" \
  -d '{"secret":"arena-admin-secret-change-me","rounds":3}'
```

Expected: `{"status":"started","rounds":3}`

- [ ] **Step 7: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for admin, submit-prompt, vote-prompt, vote-winner"
```

---

### Task 7: Claude AI Dual Battle Streaming

**Files:**
- Modify: `lib/ai-battle.ts` (replace stub)

- [ ] **Step 1: Implement `lib/ai-battle.ts`**

Replace the stub with the full implementation:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { Round, Faction } from "./types";
import { broadcast } from "./sse";

const anthropic = new Anthropic();

const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";

// AbortController for cancelling streams when phase advances
let currentBattleAbort: AbortController | null = null;

function buildSystemPrompt(faction: Faction, category: string, prompt: string): string {
  return `You are the AI champion for the ${faction.toUpperCase()} Faction in Agent Arena, a live competition.
Category: ${category}
Your faction's audience has chosen this challenge for you: "${prompt}"

Give your best response. Be creative, entertaining, and concise.
Keep your response under 200 words for readability.`;
}

async function streamAgent(faction: Faction, round: Round, signal: AbortSignal) {
  const prompt = round.winningPrompts[faction] ?? round.prompt;

  round.responses[faction].streaming = true;
  round.responses[faction].text = "";

  try {
    const stream = anthropic.messages.stream(
      {
        model: MODEL,
        max_tokens: 512,
        system: buildSystemPrompt(faction, round.category, prompt),
        messages: [{ role: "user", content: prompt }],
      },
      { signal },
    );

    stream.on("text", (text) => {
      round.responses[faction].text += text;
      broadcast("agent-token", { faction, token: text });
    });

    await stream.finalMessage();
  } catch (error) {
    if (signal.aborted) {
      // Phase advanced, stream was cancelled — this is expected
      console.log(`Agent ${faction} stream aborted (phase advanced)`);
    } else {
      console.error(`Agent ${faction} error:`, error);
      if (!round.responses[faction].text) {
        round.responses[faction].text = "[Agent malfunction! The AI champion has fallen...]";
        broadcast("agent-token", {
          faction,
          token: "[Agent malfunction! The AI champion has fallen...]",
        });
      }
    }
  } finally {
    round.responses[faction].streaming = false;
    broadcast("agent-done", { faction });
  }
}

export async function runBattle(round: Round) {
  // Cancel any previous battle
  abortBattle();

  currentBattleAbort = new AbortController();
  const signal = currentBattleAbort.signal;

  // Fire both agents concurrently — don't await, let them stream in background
  Promise.all([
    streamAgent("red", round, signal),
    streamAgent("blue", round, signal),
  ]).catch(() => {}); // Errors handled inside streamAgent
}

export function abortBattle() {
  if (currentBattleAbort) {
    currentBattleAbort.abort();
    currentBattleAbort = null;
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai-battle.ts
git commit -m "feat: implement Claude dual-agent streaming battle"
```

---

## Chunk 3: Landing Page + Team Assignment

### Task 8: Landing Page (`/`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the landing page**

Replace `app/page.tsx` with the sign-in landing page. This is a server component that redirects authenticated users to `/play`.

```tsx
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import SignInForm from "@/components/landing/SignInForm";

export default async function LandingPage() {
  const user = await stackServerApp.getUser();
  if (user) redirect("/play");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-wider text-center"
          style={{
            fontFamily: "var(--font-display)",
            textShadow: "0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.3)",
          }}
        >
          AGENT ARENA
        </h1>
        <p className="text-[var(--text-muted)] text-lg tracking-widest uppercase">
          Scan. Join. Battle.
        </p>

        <div className="w-full max-w-sm">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/landing/SignInForm.tsx`**

This is a client component wrapping Stack Auth's pre-built sign-in UI:

```tsx
"use client";

import { SignIn } from "@stackframe/stack";

export default function SignInForm() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-white/10">
      <SignIn />
    </div>
  );
}
```

The `<SignIn />` component is exported from `@stackframe/stack` and renders magic link + OAuth buttons based on your Stack Auth dashboard configuration. If this import doesn't work in your version, check the auto-generated `app/handler/[...stack]/page.tsx` — it shows the correct component import. As a fallback, you can simply redirect users to `/handler/sign-in` which Stack Auth creates automatically.

- [ ] **Step 3: Verify landing page loads**

Open `http://localhost:3000` — should see "AGENT ARENA" title with sign-in form on dark background.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/landing/SignInForm.tsx
git commit -m "feat: add landing page with Stack Auth sign-in"
```

---

### Task 9: Team Assignment + Play Page (Server Component)

**Files:**
- Create: `app/play/page.tsx`
- Create: `lib/team-assignment.ts`

- [ ] **Step 1: Create `lib/team-assignment.ts`**

Server-side team assignment logic:

```typescript
import { stackServerApp } from "@/stack/server";
import { gameState, addMember, getSmallerFaction } from "./game-state";
import { Faction } from "./types";

// Ensure teams exist in Stack Auth (call on app startup or first assignment)
let teamsInitialized = false;

export async function ensureTeams() {
  if (teamsInitialized && gameState.teams.red.id && gameState.teams.blue.id) return;

  const allTeams = await stackServerApp.listTeams();
  let redTeam = allTeams.find((t: any) => t.displayName === "Red Faction");
  let blueTeam = allTeams.find((t: any) => t.displayName === "Blue Faction");

  if (!redTeam) {
    redTeam = await stackServerApp.createTeam({ displayName: "Red Faction" });
  }
  if (!blueTeam) {
    blueTeam = await stackServerApp.createTeam({ displayName: "Blue Faction" });
  }

  gameState.teams.red.id = redTeam.id;
  gameState.teams.blue.id = blueTeam.id;
  teamsInitialized = true;
}

export async function assignUserToFaction(userId: string): Promise<Faction> {
  await ensureTeams();

  const faction = getSmallerFaction();
  const team = faction === "red"
    ? await stackServerApp.getTeam(gameState.teams.red.id)
    : await stackServerApp.getTeam(gameState.teams.blue.id);

  if (team) {
    await team.addUser(userId);
  }

  addMember(faction, userId);
  return faction;
}
```

- [ ] **Step 2: Create `app/play/page.tsx`**

Server component that handles team assignment, then renders the client component:

```tsx
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { assignUserToFaction } from "@/lib/team-assignment";
import { gameState, addMember } from "@/lib/game-state";
import { Faction } from "@/lib/types";
import PlayClient from "./PlayClient";

export default async function PlayPage() {
  const user = await stackServerApp.getUser({ or: "redirect" });

  let faction = user.serverMetadata?.faction as Faction | undefined;

  if (!faction) {
    // Assign to team
    faction = await assignUserToFaction(user.id);
    await user.update({
      serverMetadata: { ...user.serverMetadata, faction },
    });
  } else {
    // Ensure they're tracked in memory
    addMember(faction, user.id);
  }

  return (
    <PlayClient
      faction={faction}
      userId={user.id}
      displayName={user.displayName ?? "Player"}
    />
  );
}
```

- [ ] **Step 3: Create `app/play/PlayClient.tsx`** (stub for now — full implementation in Chunk 5)

```tsx
"use client";

import { Faction } from "@/lib/types";

interface PlayClientProps {
  faction: Faction;
  userId: string;
  displayName: string;
}

export default function PlayClient({ faction, userId, displayName }: PlayClientProps) {
  const color = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div
        className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
        style={{
          backgroundColor: `${color}20`,
          color: color,
          boxShadow: `0 0 20px ${color}40`,
        }}
      >
        {faction} faction
      </div>
      <p className="mt-4 text-[var(--text-muted)]">
        Welcome, {displayName}! Waiting for game to start...
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verify team assignment works**

1. Open `http://localhost:3000` in a browser
2. Sign in via Stack Auth
3. Should redirect to `/play` and see faction badge
4. Check Stack Auth dashboard — user should be in a team

- [ ] **Step 5: Commit**

```bash
git add lib/team-assignment.ts app/play/
git commit -m "feat: add team auto-assignment and play page scaffold"
```

---

## Chunk 4: Shared Components

### Task 10: Shared UI Components

**Files:**
- Create: `components/shared/StreamingText.tsx`
- Create: `components/shared/GlowBorder.tsx`
- Create: `components/play/FactionBadge.tsx`
- Create: `components/play/PhaseIndicator.tsx`
- Create: `lib/hooks/useSSE.ts`

- [ ] **Step 1: Create SSE client hook**

`lib/hooks/useSSE.ts` — reusable hook for all pages that listen to SSE:

```typescript
"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type SSEHandler = (event: string, data: any) => void;

export function useSSE(onEvent: SSEHandler) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");
    eventSourceRef.current = eventSource;

    const events = [
      "phase-change",
      "prompt-submitted",
      "prompt-votes-update",
      "winning-prompts",
      "agent-token",
      "agent-done",
      "winner-votes-update",
      "round-result",
      "game-over",
    ];

    events.forEach((eventName) => {
      eventSource.addEventListener(eventName, (e) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current(eventName, data);
        } catch {
          console.error("Failed to parse SSE data:", e.data);
        }
      });
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects
      console.warn("SSE connection lost, reconnecting...");
    };

    return () => {
      eventSource.close();
    };
  }, []);
}
```

- [ ] **Step 2: Create `components/shared/StreamingText.tsx`**

```tsx
"use client";

interface StreamingTextProps {
  text: string;
  className?: string;
}

export default function StreamingText({ text, className = "" }: StreamingTextProps) {
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {text}
      <span className="inline-block w-2 h-5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
    </div>
  );
}
```

- [ ] **Step 3: Create `components/shared/GlowBorder.tsx`**

```tsx
import { Faction } from "@/lib/types";

interface GlowBorderProps {
  faction: Faction;
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export default function GlowBorder({
  faction,
  children,
  className = "",
  intensity = "medium",
}: GlowBorderProps) {
  const color = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";
  const glowSize = { low: "10px", medium: "20px", high: "40px" }[intensity];

  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        borderColor: `${color}60`,
        boxShadow: `0 0 ${glowSize} ${color}30`,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create `components/play/FactionBadge.tsx`**

```tsx
import { Faction } from "@/lib/types";

interface FactionBadgeProps {
  faction: Faction;
  className?: string;
}

export default function FactionBadge({ faction, className = "" }: FactionBadgeProps) {
  const color = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        color: color,
        boxShadow: `0 0 15px color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {faction} faction
    </span>
  );
}
```

- [ ] **Step 5: Create `components/play/PhaseIndicator.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Phase } from "@/lib/types";

interface PhaseIndicatorProps {
  phase: Phase;
  phaseEndsAt: number;
}

const PHASE_LABELS: Record<Phase, string> = {
  prompting: "Submit Prompts",
  "voting-prompt": "Vote for Best Prompt",
  battling: "Agents Battling",
  "voting-winner": "Vote for Winner",
  results: "Results",
};

export default function PhaseIndicator({ phase, phaseEndsAt }: PhaseIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
        {PHASE_LABELS[phase]}
      </span>
      <span
        className={`text-lg font-bold tabular-nums ${timeLeft <= 10 ? "text-[var(--red-faction)] animate-pulse" : "text-[var(--text-primary)]"}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {timeLeft}s
      </span>
    </div>
  );
}
```

- [ ] **Step 6: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add components/shared/ components/play/FactionBadge.tsx components/play/PhaseIndicator.tsx lib/hooks/
git commit -m "feat: add shared components (StreamingText, GlowBorder, FactionBadge, PhaseIndicator, useSSE hook)"
```

---

## Chunk 5: Mobile Player UI

### Task 11: Full Play Page Client Component

**Files:**
- Modify: `app/play/PlayClient.tsx` (replace stub)
- Create: `components/play/PromptInput.tsx`
- Create: `components/play/PromptList.tsx`
- Create: `components/play/VoteCards.tsx`

- [ ] **Step 1: Create `components/play/PromptInput.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface PromptInputProps {
  category: string;
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

export default function PromptInput({ category, onSubmit, disabled }: PromptInputProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting || disabled) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2
        className="text-2xl font-bold text-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {category}
      </h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={280}
          placeholder="Enter your prompt..."
          disabled={disabled || submitting}
          className="flex-1 bg-[var(--bg-card)] border border-white/10 rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting || disabled}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg px-4 py-3 transition-colors cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)] text-right">{text.length}/280</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/play/PromptList.tsx`**

```tsx
"use client";

import { ChevronUp } from "lucide-react";

interface Prompt {
  text: string;
  votes: number;
}

interface PromptListProps {
  prompts: Prompt[];
  onVote?: (index: number) => void;
  votingEnabled?: boolean;
  hasVoted?: boolean;
}

export default function PromptList({ prompts, onVote, votingEnabled, hasVoted }: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <p className="text-center text-[var(--text-muted)] py-8">
        No prompts yet. Be the first!
      </p>
    );
  }

  const sorted = [...prompts]
    .map((p, i) => ({ ...p, originalIndex: i }))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
      {sorted.map((prompt) => (
        <div
          key={prompt.originalIndex}
          className="flex items-start gap-3 bg-[var(--bg-card)] rounded-lg p-3 border border-white/5"
        >
          {votingEnabled && (
            <button
              onClick={() => onVote?.(prompt.originalIndex)}
              disabled={hasVoted}
              className="flex flex-col items-center min-w-[40px] cursor-pointer disabled:opacity-30"
            >
              <ChevronUp className="w-5 h-5" />
              <span className="text-sm font-bold tabular-nums">{prompt.votes}</span>
            </button>
          )}
          {!votingEnabled && (
            <span className="text-sm font-bold tabular-nums min-w-[30px] text-center text-[var(--text-muted)]">
              {prompt.votes}
            </span>
          )}
          <p className="text-sm flex-1">{prompt.text}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/play/VoteCards.tsx`**

```tsx
"use client";

import { Faction } from "@/lib/types";
import GlowBorder from "@/components/shared/GlowBorder";

interface VoteCardsProps {
  redText: string;
  blueText: string;
  userFaction: Faction;
  onVote: (votedFor: Faction) => void;
  hasVoted: boolean;
}

export default function VoteCards({ redText, blueText, userFaction, onVote, hasVoted }: VoteCardsProps) {
  const canVoteFor = (faction: Faction) => faction !== userFaction && !hasVoted;

  return (
    <div className="space-y-4">
      <p className="text-center text-[var(--text-muted)] text-sm">
        Vote for the best response (you can only vote for the other team)
      </p>
      <div className="space-y-3">
        {(["red", "blue"] as Faction[]).map((faction) => (
          <GlowBorder key={faction} faction={faction} intensity={canVoteFor(faction) ? "medium" : "low"}>
            <button
              onClick={() => canVoteFor(faction) && onVote(faction)}
              disabled={!canVoteFor(faction)}
              className={`w-full text-left p-4 rounded-xl ${
                canVoteFor(faction)
                  ? "cursor-pointer hover:bg-white/5 transition-colors"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: faction === "red" ? "var(--red-faction)" : "var(--blue-faction)" }}
              >
                {faction} faction
              </p>
              <p className="text-sm whitespace-pre-wrap">{faction === "red" ? redText : blueText}</p>
            </button>
          </GlowBorder>
        ))}
      </div>
      {hasVoted && (
        <p className="text-center text-[var(--accent-gold)] text-sm font-bold">Vote recorded!</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Replace `app/play/PlayClient.tsx` with full implementation**

```tsx
"use client";

import { useState, useCallback } from "react";
import { Faction, Phase, GameStatus } from "@/lib/types";
import { useSSE } from "@/lib/hooks/useSSE";
import FactionBadge from "@/components/play/FactionBadge";
import PhaseIndicator from "@/components/play/PhaseIndicator";
import PromptInput from "@/components/play/PromptInput";
import PromptList from "@/components/play/PromptList";
import VoteCards from "@/components/play/VoteCards";
import StreamingText from "@/components/shared/StreamingText";

interface PlayClientProps {
  faction: Faction;
  userId: string;
  displayName: string;
}

interface GameView {
  status: GameStatus;
  phase: Phase;
  phaseEndsAt: number;
  round: number;
  category: string;
  myPrompts: { text: string; votes: number }[];
  redResponse: string;
  blueResponse: string;
  redStreaming: boolean;
  blueStreaming: boolean;
  winnerVotes: { red: number; blue: number };
  roundWinner: Faction | null;
  scores: { red: number; blue: number };
  hasVotedPrompt: boolean;
  hasVotedWinner: boolean;
  totalRounds: number;
  memberCounts: { red: number; blue: number };
  gameWinner: Faction | null;
  finalScores: { red: number; blue: number } | null;
}

export default function PlayClient({ faction, userId, displayName }: PlayClientProps) {
  const [view, setView] = useState<GameView>({
    status: "waiting",
    phase: "prompting",
    phaseEndsAt: 0,
    round: 0,
    category: "",
    myPrompts: [],
    redResponse: "",
    blueResponse: "",
    redStreaming: false,
    blueStreaming: false,
    winnerVotes: { red: 0, blue: 0 },
    roundWinner: null,
    scores: { red: 0, blue: 0 },
    hasVotedPrompt: false,
    hasVotedWinner: false,
    totalRounds: 5,
    memberCounts: { red: 0, blue: 0 },
    gameWinner: null,
    finalScores: null,
  });

  const handleSSE = useCallback((event: string, data: any) => {
    setView((prev) => {
      switch (event) {
        case "phase-change":
          return {
            ...prev,
            status: data.status ?? "active",
            phase: data.phase,
            phaseEndsAt: data.phaseEndsAt,
            round: data.round,
            category: data.category,
            totalRounds: data.totalRounds ?? prev.totalRounds,
            scores: data.scores ?? prev.scores,
            memberCounts: data.members ?? prev.memberCounts,
            // Reset per-phase state
            ...(data.phase === "prompting" ? {
              myPrompts: [],
              redResponse: "",
              blueResponse: "",
              redStreaming: false,
              blueStreaming: false,
              winnerVotes: { red: 0, blue: 0 },
              roundWinner: null,
              hasVotedPrompt: false,
              hasVotedWinner: false,
            } : {}),
          };

        case "prompt-submitted":
          return prev; // We track our own prompts via API responses

        case "prompt-votes-update":
          if (data.faction === faction) {
            return { ...prev, myPrompts: data.prompts };
          }
          return prev;

        case "winning-prompts":
          return prev;

        case "agent-token":
          if (data.faction === "red") {
            return { ...prev, redResponse: prev.redResponse + data.token, redStreaming: true };
          } else {
            return { ...prev, blueResponse: prev.blueResponse + data.token, blueStreaming: true };
          }

        case "agent-done":
          if (data.faction === "red") {
            return { ...prev, redStreaming: false };
          } else {
            return { ...prev, blueStreaming: false };
          }

        case "winner-votes-update":
          return { ...prev, winnerVotes: data };

        case "round-result":
          return { ...prev, roundWinner: data.winner, scores: data.scores };

        case "game-over":
          return {
            ...prev,
            status: "finished",
            gameWinner: data.winner,
            finalScores: data.finalScores,
          };

        default:
          return prev;
      }
    });
  }, [faction]);

  useSSE(handleSSE);

  // API calls
  const submitPrompt = async (text: string) => {
    const res = await fetch("/api/submit-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
    }
  };

  const votePrompt = async (index: number) => {
    const res = await fetch("/api/vote-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    if (res.ok) {
      setView((prev) => ({ ...prev, hasVotedPrompt: true }));
    }
  };

  const voteWinner = async (votedFor: Faction) => {
    const res = await fetch("/api/vote-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votedFor }),
    });
    if (res.ok) {
      setView((prev) => ({ ...prev, hasVotedWinner: true }));
    }
  };

  const factionColor = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between p-4 border-b border-white/5">
        <FactionBadge faction={faction} />
        {view.status === "active" && (
          <>
            <span className="text-sm text-[var(--text-muted)]">
              Round {view.round}/{view.totalRounds}
            </span>
            <PhaseIndicator phase={view.phase} phaseEndsAt={view.phaseEndsAt} />
          </>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {/* Waiting state */}
        {view.status === "waiting" && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: factionColor, boxShadow: `0 0 20px ${factionColor}` }}
            />
            <p className="text-[var(--text-muted)]">Waiting for the game to begin...</p>
            <p className="text-sm text-[var(--text-muted)]">Welcome, {displayName}</p>
          </div>
        )}

        {/* Game finished */}
        {view.status === "finished" && view.finalScores && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <h2
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: view.gameWinner === "red" ? "var(--red-faction)" : "var(--blue-faction)",
              }}
            >
              {view.gameWinner?.toUpperCase()} WINS!
            </h2>
            <p className="text-[var(--text-muted)]">
              {view.finalScores.red} — {view.finalScores.blue}
            </p>
          </div>
        )}

        {/* Active game phases */}
        {view.status === "active" && (
          <>
            {view.phase === "prompting" && (
              <div className="space-y-4">
                <PromptInput category={view.category} onSubmit={submitPrompt} />
                <PromptList prompts={view.myPrompts} />
              </div>
            )}

            {view.phase === "voting-prompt" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-center">Pick the best prompt for your agent!</h2>
                <PromptList
                  prompts={view.myPrompts}
                  votingEnabled
                  onVote={votePrompt}
                  hasVoted={view.hasVotedPrompt}
                />
              </div>
            )}

            {view.phase === "battling" && (
              <div className="space-y-4">
                <p className="text-center text-[var(--text-muted)] text-sm">
                  Watch the arena screen!
                </p>
                <div className="space-y-3">
                  <div className="bg-[var(--bg-card)] rounded-lg p-3 border-l-4" style={{ borderColor: "var(--red-faction)" }}>
                    <p className="text-xs font-bold uppercase text-[var(--red-faction)] mb-1">Red</p>
                    {view.redStreaming ? (
                      <StreamingText text={view.redResponse} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{view.redResponse || "..."}</p>
                    )}
                  </div>
                  <div className="bg-[var(--bg-card)] rounded-lg p-3 border-l-4" style={{ borderColor: "var(--blue-faction)" }}>
                    <p className="text-xs font-bold uppercase text-[var(--blue-faction)] mb-1">Blue</p>
                    {view.blueStreaming ? (
                      <StreamingText text={view.blueResponse} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{view.blueResponse || "..."}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {view.phase === "voting-winner" && (
              <VoteCards
                redText={view.redResponse}
                blueText={view.blueResponse}
                userFaction={faction}
                onVote={voteWinner}
                hasVoted={view.hasVotedWinner}
              />
            )}

            {view.phase === "results" && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                {view.roundWinner && (
                  <h2
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: view.roundWinner === "red" ? "var(--red-faction)" : "var(--blue-faction)",
                    }}
                  >
                    {view.roundWinner.toUpperCase()} WINS THE ROUND!
                  </h2>
                )}
                <p className="text-[var(--text-muted)]">Next round starting soon...</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom bar */}
      {view.status === "active" && (
        <footer className="flex items-center justify-center gap-6 p-3 border-t border-white/5 text-sm">
          <span style={{ color: "var(--red-faction)" }}>RED: {view.scores.red}</span>
          <span className="text-[var(--text-muted)]">|</span>
          <span style={{ color: "var(--blue-faction)" }}>BLUE: {view.scores.blue}</span>
        </footer>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify compiles and page renders**

```bash
npx tsc --noEmit
```

Open `/play` on mobile viewport — should show faction badge and waiting state.

- [ ] **Step 6: Commit**

```bash
git add app/play/PlayClient.tsx components/play/
git commit -m "feat: implement full mobile player UI with all phase views"
```

---

## Chunk 6: Arena Projector Display

### Task 12: Arena Page + Components

**Files:**
- Create: `app/arena/page.tsx`
- Create: `components/arena/RoundHeader.tsx`
- Create: `components/arena/Timer.tsx`
- Create: `components/arena/SplitBattle.tsx`
- Create: `components/arena/VoteCounter.tsx`
- Create: `components/arena/Leaderboard.tsx`
- Create: `components/arena/WinnerReveal.tsx`

- [ ] **Step 1: Create `components/arena/Timer.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  phaseEndsAt: number;
}

export default function Timer({ phaseEndsAt }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return (
    <span
      className={`text-6xl font-bold tabular-nums ${timeLeft <= 10 ? "text-[var(--red-faction)] animate-pulse" : "text-[var(--text-primary)]"}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {timeLeft}
    </span>
  );
}
```

- [ ] **Step 2: Create `components/arena/RoundHeader.tsx`**

```tsx
interface RoundHeaderProps {
  round: number;
  category: string;
}

export default function RoundHeader({ round, category }: RoundHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <p className="text-lg text-[var(--text-muted)] uppercase tracking-[0.3em]">
        Round {round}
      </p>
      <h1
        className="text-4xl font-bold uppercase tracking-wider"
        style={{
          fontFamily: "var(--font-display)",
          textShadow: "0 0 20px rgba(255,215,0,0.3)",
          color: "var(--accent-gold)",
        }}
      >
        {category}
      </h1>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/arena/SplitBattle.tsx`**

```tsx
"use client";

import GlowBorder from "@/components/shared/GlowBorder";
import StreamingText from "@/components/shared/StreamingText";

interface SplitBattleProps {
  redPrompt: string;
  bluePrompt: string;
  redResponse: string;
  blueResponse: string;
  redStreaming: boolean;
  blueStreaming: boolean;
}

export default function SplitBattle({
  redPrompt,
  bluePrompt,
  redResponse,
  blueResponse,
  redStreaming,
  blueStreaming,
}: SplitBattleProps) {
  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Red Panel */}
      <GlowBorder faction="red" className="flex flex-col p-6 bg-[var(--bg-card)]" intensity="high">
        <h2
          className="text-2xl font-bold uppercase tracking-wider mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--red-faction)" }}
        >
          Red Faction
        </h2>
        {redPrompt && (
          <blockquote className="text-sm text-[var(--text-muted)] border-l-2 border-[var(--red-faction)] pl-3 mb-4 italic">
            &ldquo;{redPrompt}&rdquo;
          </blockquote>
        )}
        <div className="flex-1 overflow-y-auto">
          {redStreaming ? (
            <StreamingText text={redResponse} className="text-lg leading-relaxed" />
          ) : (
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {redResponse || "Waiting..."}
            </p>
          )}
        </div>
      </GlowBorder>

      {/* Blue Panel */}
      <GlowBorder faction="blue" className="flex flex-col p-6 bg-[var(--bg-card)]" intensity="high">
        <h2
          className="text-2xl font-bold uppercase tracking-wider mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--blue-faction)" }}
        >
          Blue Faction
        </h2>
        {bluePrompt && (
          <blockquote className="text-sm text-[var(--text-muted)] border-l-2 border-[var(--blue-faction)] pl-3 mb-4 italic">
            &ldquo;{bluePrompt}&rdquo;
          </blockquote>
        )}
        <div className="flex-1 overflow-y-auto">
          {blueStreaming ? (
            <StreamingText text={blueResponse} className="text-lg leading-relaxed" />
          ) : (
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {blueResponse || "Waiting..."}
            </p>
          )}
        </div>
      </GlowBorder>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/arena/VoteCounter.tsx`**

```tsx
interface VoteCounterProps {
  redVotes: number;
  blueVotes: number;
}

export default function VoteCounter({ redVotes, blueVotes }: VoteCounterProps) {
  const total = redVotes + blueVotes;
  const redPct = total > 0 ? Math.round((redVotes / total) * 100) : 50;
  const bluePct = total > 0 ? Math.round((blueVotes / total) * 100) : 50;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        <span style={{ color: "var(--red-faction)" }}>{redVotes}</span>
        <span className="text-[var(--text-muted)]">VS</span>
        <span style={{ color: "var(--blue-faction)" }}>{blueVotes}</span>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden bg-[var(--bg-card)]">
        <div
          className="transition-all duration-500 ease-out"
          style={{ width: `${redPct}%`, backgroundColor: "var(--red-faction)" }}
        />
        <div
          className="transition-all duration-500 ease-out"
          style={{ width: `${bluePct}%`, backgroundColor: "var(--blue-faction)" }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/arena/Leaderboard.tsx`**

```tsx
interface LeaderboardProps {
  scores: { red: number; blue: number };
  redMembers: number;
  blueMembers: number;
  phase: string;
}

export default function Leaderboard({ scores, redMembers, blueMembers, phase }: LeaderboardProps) {
  return (
    <div className="flex items-center justify-between px-8 py-3 border-t border-white/5 text-sm">
      <div className="flex items-center gap-4">
        <span className="font-bold" style={{ color: "var(--red-faction)", fontFamily: "var(--font-display)" }}>
          RED: {scores.red}
        </span>
        <span className="text-[var(--text-muted)]">{redMembers} players</span>
      </div>
      <span className="text-[var(--text-muted)] uppercase tracking-wider text-xs">
        {phase.replace("-", " ")}
      </span>
      <div className="flex items-center gap-4">
        <span className="text-[var(--text-muted)]">{blueMembers} players</span>
        <span className="font-bold" style={{ color: "var(--blue-faction)", fontFamily: "var(--font-display)" }}>
          BLUE: {scores.blue}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/arena/WinnerReveal.tsx`**

```tsx
import { Faction } from "@/lib/types";

interface WinnerRevealProps {
  winner: Faction;
  scores: { red: number; blue: number };
}

export default function WinnerReveal({ winner, scores }: WinnerRevealProps) {
  const color = winner === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <p className="text-[var(--accent-gold)] uppercase tracking-[0.5em] text-lg">Winner</p>
      <h1
        className="text-8xl font-bold uppercase"
        style={{
          fontFamily: "var(--font-display)",
          color,
          textShadow: `0 0 40px ${color}, 0 0 80px ${color}50`,
        }}
      >
        {winner}
      </h1>
      <div
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span style={{ color: "var(--red-faction)" }}>{scores.red}</span>
        <span className="text-[var(--text-muted)] mx-4">—</span>
        <span style={{ color: "var(--blue-faction)" }}>{scores.blue}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create `app/arena/page.tsx`**

```tsx
"use client";

import { useState, useCallback } from "react";
import { Faction, Phase, GameStatus } from "@/lib/types";
import { useSSE } from "@/lib/hooks/useSSE";
import RoundHeader from "@/components/arena/RoundHeader";
import Timer from "@/components/arena/Timer";
import SplitBattle from "@/components/arena/SplitBattle";
import VoteCounter from "@/components/arena/VoteCounter";
import Leaderboard from "@/components/arena/Leaderboard";
import WinnerReveal from "@/components/arena/WinnerReveal";

interface ArenaState {
  status: GameStatus;
  phase: Phase;
  phaseEndsAt: number;
  round: number;
  category: string;
  redPrompt: string;
  bluePrompt: string;
  redResponse: string;
  blueResponse: string;
  redStreaming: boolean;
  blueStreaming: boolean;
  winnerVotes: { red: number; blue: number };
  roundWinner: Faction | null;
  scores: { red: number; blue: number };
  memberCounts: { red: number; blue: number };
  gameWinner: Faction | null;
  finalScores: { red: number; blue: number } | null;
}

export default function ArenaPage() {
  const [state, setState] = useState<ArenaState>({
    status: "waiting",
    phase: "prompting",
    phaseEndsAt: 0,
    round: 0,
    category: "",
    redPrompt: "",
    bluePrompt: "",
    redResponse: "",
    blueResponse: "",
    redStreaming: false,
    blueStreaming: false,
    winnerVotes: { red: 0, blue: 0 },
    roundWinner: null,
    scores: { red: 0, blue: 0 },
    memberCounts: { red: 0, blue: 0 },
    gameWinner: null,
    finalScores: null,
  });

  const handleSSE = useCallback((event: string, data: any) => {
    setState((prev) => {
      switch (event) {
        case "phase-change":
          return {
            ...prev,
            status: data.status ?? "active",
            phase: data.phase,
            phaseEndsAt: data.phaseEndsAt,
            round: data.round,
            category: data.category,
            scores: data.scores ?? prev.scores,
            memberCounts: data.members ?? prev.memberCounts,
            ...(data.phase === "prompting" ? {
              redPrompt: "",
              bluePrompt: "",
              redResponse: "",
              blueResponse: "",
              redStreaming: false,
              blueStreaming: false,
              winnerVotes: { red: 0, blue: 0 },
              roundWinner: null,
            } : {}),
          };

        case "winning-prompts":
          return { ...prev, redPrompt: data.red, bluePrompt: data.blue };

        case "agent-token":
          if (data.faction === "red") {
            return { ...prev, redResponse: prev.redResponse + data.token, redStreaming: true };
          } else {
            return { ...prev, blueResponse: prev.blueResponse + data.token, blueStreaming: true };
          }

        case "agent-done":
          if (data.faction === "red") {
            return { ...prev, redStreaming: false };
          } else {
            return { ...prev, blueStreaming: false };
          }

        case "winner-votes-update":
          return { ...prev, winnerVotes: data };

        case "round-result":
          return { ...prev, roundWinner: data.winner, scores: data.scores };

        case "game-over":
          return { ...prev, status: "finished", gameWinner: data.winner, finalScores: data.finalScores };

        default:
          return prev;
      }
    });
  }, []);

  useSSE(handleSSE);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Waiting state */}
        {state.status === "waiting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <h1
              className="text-8xl font-bold tracking-wider"
              style={{
                fontFamily: "var(--font-display)",
                textShadow: "0 0 30px rgba(124,58,237,0.5), 0 0 60px rgba(124,58,237,0.3)",
              }}
            >
              AGENT ARENA
            </h1>
            <p className="text-2xl text-[var(--text-muted)] tracking-widest uppercase">
              Scan the QR code to join
            </p>
            <div className="w-4 h-4 rounded-full bg-[var(--accent-gold)] animate-pulse mt-8" />
          </div>
        )}

        {/* Game finished */}
        {state.status === "finished" && state.finalScores && (
          <div className="flex-1 flex items-center justify-center">
            <WinnerReveal winner={state.gameWinner!} scores={state.finalScores} />
          </div>
        )}

        {/* Active game */}
        {state.status === "active" && (
          <>
            {/* Top bar */}
            <header className="flex items-center justify-between px-8 py-4">
              <RoundHeader round={state.round} category={state.category} />
              <Timer phaseEndsAt={state.phaseEndsAt} />
            </header>

            {/* Center content */}
            <main className="flex-1 px-8 pb-4 min-h-0">
              {(state.phase === "prompting" || state.phase === "voting-prompt") && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <p className="text-4xl text-[var(--text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                      {state.phase === "prompting"
                        ? "Players are submitting prompts..."
                        : "Players are voting on prompts..."}
                    </p>
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full bg-[var(--accent-gold)] animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {state.phase === "battling" && (
                <SplitBattle
                  redPrompt={state.redPrompt}
                  bluePrompt={state.bluePrompt}
                  redResponse={state.redResponse}
                  blueResponse={state.blueResponse}
                  redStreaming={state.redStreaming}
                  blueStreaming={state.blueStreaming}
                />
              )}

              {state.phase === "voting-winner" && (
                <div className="flex flex-col h-full">
                  <SplitBattle
                    redPrompt={state.redPrompt}
                    bluePrompt={state.bluePrompt}
                    redResponse={state.redResponse}
                    blueResponse={state.blueResponse}
                    redStreaming={false}
                    blueStreaming={false}
                  />
                  <div className="mt-4">
                    <VoteCounter redVotes={state.winnerVotes.red} blueVotes={state.winnerVotes.blue} />
                  </div>
                </div>
              )}

              {state.phase === "results" && state.roundWinner && (
                <div className="flex items-center justify-center h-full">
                  <WinnerReveal winner={state.roundWinner} scores={state.scores} />
                </div>
              )}
            </main>

            {/* Bottom ticker */}
            <Leaderboard
              scores={state.scores}
              redMembers={state.memberCounts.red}
              blueMembers={state.memberCounts.blue}
              phase={state.phase}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 9: Verify arena page renders**

Open `http://localhost:3000/arena` — should see "AGENT ARENA" waiting screen with animated grid.

- [ ] **Step 10: Commit**

```bash
git add app/arena/ components/arena/
git commit -m "feat: implement arena projector display with all phase views"
```

---

## Chunk 7: Integration Test + Polish

### Task 13: End-to-End Manual Integration Test

**Files:** No new files. This task validates everything works together.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open arena display**

Open `http://localhost:3000/arena` in a desktop browser (simulating projector). Should show waiting state.

- [ ] **Step 3: Sign in as two users**

Open two incognito/private browser tabs on mobile viewport:
- Tab 1: `http://localhost:3000` — sign in → should redirect to `/play` with Red faction
- Tab 2: `http://localhost:3000` — sign in as different user → should redirect to `/play` with Blue faction

- [ ] **Step 4: Start the game**

```bash
curl -X POST http://localhost:3000/api/admin/start \
  -H "Content-Type: application/json" \
  -d '{"secret":"arena-admin-secret-change-me","rounds":2}'
```

Expected: All three tabs should update — arena shows round 1, play pages show prompting phase with timer.

- [ ] **Step 5: Submit prompts**

On both mobile tabs, submit prompts in the text input. Should see them appear in the prompt list.

- [ ] **Step 6: Vote on prompts**

When phase changes to voting-prompt, tap upvote on a prompt. Should show vote count increase.

- [ ] **Step 7: Watch the battle**

When phase changes to battling, both the arena display and mobile pages should show agent responses streaming in real-time, side by side.

- [ ] **Step 8: Vote on winner**

When phase changes to voting-winner, mobile users should see two cards. Each user should only be able to vote for the OTHER team. Arena should show vote counter animating.

- [ ] **Step 9: See results**

Results phase should show winner with glow animation on arena. Scores should update.

- [ ] **Step 10: Verify round 2 starts**

After results, round 2 should auto-start with a new category.

- [ ] **Step 11: Fix any issues found**

Address any bugs discovered during integration testing.

- [ ] **Step 12: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration test fixes and polish"
```

---

### Task 14: Visual Polish + QR Code

**Files:**
- Modify: `app/page.tsx` (add QR code hint)
- Modify: `app/globals.css` (polish animations)

- [ ] **Step 1: Add global animations to `globals.css`**

Add the following animations to `globals.css`:

```css
@keyframes glow-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

- [ ] **Step 2: Add QR code URL hint to arena waiting screen**

In `app/arena/page.tsx`, in the waiting state section, add a visible URL below the title so the presenter can generate a QR code pointing to it:

```tsx
<p className="text-lg text-[var(--text-muted)]">
  Point your QR code to your deployment URL
</p>
```

(For the actual demo, generate a QR code at qr-code-generator.com pointing to the deployed URL and display it on the arena screen, or add `qrcode.react` package.)

- [ ] **Step 3: Install and add QR code to arena (optional but high impact)**

```bash
npm install qrcode.react
```

Add to arena waiting state:

```tsx
import { QRCodeSVG } from "qrcode.react";

// In waiting state JSX:
<QRCodeSVG
  value={typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}
  size={200}
  bgColor="transparent"
  fgColor="#E2E8F0"
/>
```

- [ ] **Step 4: Verify everything looks good**

Check arena page waiting state, play page all phases, and landing page on mobile viewport.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add QR code to arena, visual polish and animations"
```

---

### Task 15: Deploy (if time permits)

**Files:**
- None (Vercel CLI or GitHub push)

- [ ] **Step 1: Deploy to Vercel**

```bash
npx vercel --prod
```

Or push to GitHub and connect to Vercel dashboard.

- [ ] **Step 2: Set environment variables in Vercel**

Add all `.env.local` variables to the Vercel project settings.

- [ ] **Step 3: Test deployed version**

Open the deployed URL on phone and laptop. Run the same integration test flow.

- [ ] **Step 4: Generate QR code**

Generate a QR code pointing to the deployed URL for the demo.
