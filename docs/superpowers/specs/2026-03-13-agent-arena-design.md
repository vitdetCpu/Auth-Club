# Agent Arena — Design Specification

## Overview

Agent Arena is a live audience-powered AI agent competition for hackathon demos. Audience members scan a QR code, authenticate via Stack Auth, get auto-assigned to a faction (Red or Blue), and collectively steer competing AI agents through category-based challenges. Results stream live on a projector display.

## Goals

- Zero-friction onboarding: QR code scan to playing in under 10 seconds
- Deep Stack Auth integration: Teams, user metadata, server-side auth
- Real-time engagement: SSE-powered live streaming of agent responses and votes
- Demo impact: Judges participate as players — no slides needed

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Auth:** Stack Auth (magic link + Google OAuth, Teams, server metadata)
- **AI:** Anthropic Claude API (TypeScript SDK, streaming)
- **Real-time:** Server-Sent Events (SSE) via Next.js Route Handlers
- **State:** In-memory global JavaScript object (no database)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## Visual Identity

### Style: Cyberpunk Arena

Dark OLED base with faction-colored neon accents.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#0D0D1A` | Page background |
| `--bg-card` | `#1A1A2E` | Cards, panels |
| `--red-faction` | `#FF4655` | Red team color |
| `--blue-faction` | `#00D4FF` | Blue team color (electric cyan) |
| `--text-primary` | `#E2E8F0` | Body text |
| `--text-muted` | `#64748B` | Secondary text |
| `--accent-gold` | `#FFD700` | Scores, highlights, winner glow |
| `--neon-glow` | `0 0 20px` | Glow effect on faction elements |

### Typography

- **Headings:** Russo One (bold, gaming energy)
- **Body:** Chakra Petch (techy, readable)
- Google Fonts import: `Russo+One` + `Chakra+Petch:wght@300;400;500;600;700`

### Effects

- Neon glow borders on faction panels: `box-shadow: 0 0 20px var(--faction-color)`
- Token-by-token streaming text (typewriter effect) for agent responses
- Pulse animation on timer countdown
- Staggered card reveals for vote results
- Subtle animated grid background on arena page

### Icon Set

Lucide React — consistent, lightweight SVG icons. No emojis as UI icons.

## Architecture

### Approach: Split Display + Mobile

Two purpose-built page types optimized for their target device.

### Routes

| Route | Purpose | Device |
|-------|---------|--------|
| `/` | QR code landing + Stack Auth sign-in | Phone |
| `/play` | Mobile player UI — submit prompts, vote | Phone |
| `/arena` | Projector display — side-by-side agent battle | Projector |

### Project Structure

```
app/
  layout.tsx              # StackProvider + StackTheme wrapper, fonts
  page.tsx                # Landing page with sign-in
  play/
    page.tsx              # Mobile player UI
  arena/
    page.tsx              # Projector display
  api/
    stream/
      route.ts            # SSE endpoint for real-time events
    submit-prompt/
      route.ts            # POST — submit a prompt
    vote-prompt/
      route.ts            # POST — vote on a prompt within your team
    vote-winner/
      route.ts            # POST — vote for the other team's response
    admin/
      start/route.ts      # POST — start/reset the game
stack/
  server.ts               # stackServerApp instance
  client.ts               # stackClientApp instance
lib/
  game-state.ts           # In-memory game state + mutation functions
  game-engine.ts          # Timer/phase management, round progression
  ai-battle.ts            # Claude API integration, dual streaming
  sse.ts                  # SSE connection manager + event broadcaster
  categories.ts           # Pre-defined challenge categories
  types.ts                # TypeScript types
components/
  arena/
    SplitBattle.tsx       # Side-by-side agent response panels
    Timer.tsx             # Countdown timer display
    Leaderboard.tsx       # Score display
    RoundHeader.tsx       # Round number + category
    VoteCounter.tsx       # Animated vote tallies
    WinnerReveal.tsx      # Winner animation
  play/
    PromptInput.tsx       # Text input + submit for prompts
    PromptList.tsx        # List of team prompts with upvote
    VoteCards.tsx         # Two response cards for winner voting
    PhaseIndicator.tsx    # Current phase + timer
    FactionBadge.tsx      # Red/Blue team badge with glow
  shared/
    StreamingText.tsx     # Typewriter text component
    GlowBorder.tsx       # Reusable neon glow border wrapper
```

## In-Memory State

```typescript
interface GameState {
  status: 'waiting' | 'active' | 'finished'
  currentRound: number
  phase: 'prompting' | 'voting-prompt' | 'battling' | 'voting-winner' | 'results'
  phaseEndsAt: number // Unix timestamp ms
  teams: {
    red: { id: string; members: Set<string>; score: number }
    blue: { id: string; members: Set<string>; score: number }
  }
  rounds: Round[]
}

interface Round {
  id: number
  category: string
  prompt: string // The category's prompt template
  submissions: {
    red: Submission[]
    blue: Submission[]
  }
  winningPrompts: {
    red: string | null
    blue: string | null
  }
  responses: {
    red: { text: string; streaming: boolean }
    blue: { text: string; streaming: boolean }
  }
  votes: { red: number; blue: number } // Cross-team votes on responses
  winner: 'red' | 'blue' | null
}

interface Submission {
  userId: string
  text: string
  votes: number
  voters: Set<string>
}
```

## Game Loop

### Phase Timing

```
PROMPTING (45s) → VOTE ON PROMPT (20s) → BATTLING (60s) → VOTE ON WINNER (20s) → RESULTS (10s) → next round
```

Total round time: ~2.5 minutes.

### Phase Descriptions

1. **PROMPTING (45s):** Category revealed. Each player submits a prompt for their faction's agent. Players see their team's submissions in real-time.

2. **VOTE ON PROMPT (20s):** Players vote on the best prompt from their own team. One vote per player. Top-voted prompt wins.

3. **BATTLING (60s):** Both agents receive their faction's winning prompt and the category context. Responses stream token-by-token to the arena display side by side. Players can watch on their phones too.

4. **VOTE ON WINNER (20s):** Players vote on which agent did better — but can only vote for the OTHER team's response (prevents self-voting bias). Cross-team voting only.

5. **RESULTS (10s):** Winner revealed with glow animation. Score updates. Brief pause before next round.

### Round Progression

- Categories rotate through a shuffled list
- Game runs for a configurable number of rounds (default: 5)
- After final round: overall winner display with total scores

## Stack Auth Integration

### Sign-In Flow

1. QR code displayed at `/` points to the app URL
2. Landing page shows `<MagicLinkSignIn />` + `<OAuthButton provider="google" />`
3. On successful auth, server-side middleware/handler:
   - Checks if user already has a team assignment via `user.serverMetadata.faction`
   - If not assigned: count members per team, assign to team with fewer members
   - Call `team.addUser(userId)` to add to Stack Auth team
   - Set `user.serverMetadata.faction = 'red' | 'blue'`
4. Redirect to `/play`

### Pre-Seeded Teams

On app startup (or via admin endpoint), create teams if they don't exist:

```typescript
const redTeam = await stackServerApp.createTeam({ displayName: "Red Faction" });
const blueTeam = await stackServerApp.createTeam({ displayName: "Blue Faction" });
```

Store team IDs in game state.

### User Metadata Usage

| Field | Type | Purpose |
|-------|------|---------|
| `serverMetadata.faction` | `'red' \| 'blue'` | Team assignment |
| `serverMetadata.hasVotedPrompt` | `number \| null` | Round ID of last prompt vote (prevents double-vote) |
| `serverMetadata.hasVotedWinner` | `number \| null` | Round ID of last winner vote (prevents double-vote) |

Vote flags are checked server-side on API routes. Reset implicitly by comparing against current round ID.

### Auth on API Routes

All `/api/*` routes verify auth via Stack Auth server SDK:

```typescript
const user = await stackServerApp.getUser();
if (!user) return new Response('Unauthorized', { status: 401 });
const faction = user.serverMetadata?.faction;
```

## SSE (Server-Sent Events) Design

### Endpoint: `GET /api/stream`

Single SSE endpoint. All clients (arena + mobile) connect here.

### Event Types

| Event | Payload | When |
|-------|---------|------|
| `phase-change` | `{ phase, phaseEndsAt, round, category }` | Phase transitions |
| `prompt-submitted` | `{ faction, count }` | New prompt submitted (count only, no content leak) |
| `prompt-votes-update` | `{ faction, prompts: [{text, votes}] }` | Vote tallies update (to own faction only) |
| `winning-prompts` | `{ red: string, blue: string }` | Top prompts selected |
| `agent-token` | `{ faction, token: string }` | Each streamed token from agent |
| `agent-done` | `{ faction }` | Agent finished responding |
| `winner-votes-update` | `{ red: number, blue: number }` | Live vote counts |
| `round-result` | `{ winner, scores: { red, blue } }` | Round outcome |
| `game-over` | `{ winner, finalScores }` | Game complete |

### Connection Manager

```typescript
// In-memory set of active SSE connections
const clients = new Set<ReadableStreamController>();

function broadcast(event: string, data: object) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.enqueue(new TextEncoder().encode(message));
  }
}
```

## Claude API Integration

### Dual Agent Streaming

When battle phase starts:
1. Take winning prompt from each team
2. Fire two concurrent `anthropic.messages.stream()` calls
3. Each stream emits `agent-token` SSE events with the faction identifier
4. Arena page renders tokens into the correct panel

### System Prompt per Agent

```
You are the AI champion for the {faction} Faction in Agent Arena.
Category: {category}
Your faction's audience has chosen this challenge for you: "{prompt}"

Give your best response. Be creative, entertaining, and concise.
Keep your response under 200 words for readability.
```

### Model

Use `claude-sonnet-4-5-20250929` — fast enough for real-time streaming, high quality.

## Page Designs

### `/` — Landing Page (Mobile)

- Full-screen dark background (`#0D0D1A`)
- "AGENT ARENA" title in Russo One with neon glow animation
- Subtitle: "Scan. Join. Battle."
- Stack Auth sign-in form centered:
  - Magic link email input
  - Google OAuth button
- Subtle animated grid lines in background
- After sign-in → auto-redirect to `/play`

### `/play` — Player Mobile UI

**Top bar:**
- Faction badge (colored pill with team name + glow)
- Round indicator: "Round 3/5"
- Team score

**Phase-aware main content (one visible at a time):**

- **Prompting phase:**
  - Category name displayed large
  - Text input for prompt submission
  - Submit button
  - Below: scrollable list of your team's submitted prompts
  - Each prompt shows text + upvote count + upvote button

- **Vote-on-prompt phase:**
  - "Pick the best prompt for your agent!"
  - List of top prompts from your team with vote buttons
  - One vote per player

- **Battling phase:**
  - Compact split view of both agents streaming
  - Players can follow along on their phones
  - "Watch the arena screen!" callout

- **Vote-on-winner phase:**
  - Two cards showing final responses (Red and Blue)
  - "Vote for the best response" — can only tap the OTHER team's card
  - Vote confirmation animation

- **Results phase:**
  - Winner animation (faction color burst)
  - Score update
  - "Next round in X seconds..."

**Bottom persistent bar:**
- Mini leaderboard: `RED: 3 | BLUE: 2`

### `/arena` — Projector Display

**Full-screen dark background with subtle animated grid.**

**Top section:**
- Round indicator: "ROUND 3" (Russo One, large)
- Category name: "ROAST BATTLE" (with accent color)
- Countdown timer (large, centered, pulse animation when < 10s)

**Center section (battle phase):**
- Split screen, 50/50:
  - **Left panel:** Red faction
    - Red glow border
    - "RED FACTION" header
    - Winning prompt in quote style
    - Agent response streaming below (typewriter effect, Chakra Petch)
  - **Right panel:** Blue faction (mirror layout, cyan glow)

**Center section (voting phase):**
- Same split layout but with animated vote counters rising in real-time

**Center section (results):**
- Winner side pulses and glows brighter
- Gold accent "WINNER" badge appears
- Score increment animation

**Bottom ticker:**
- Total scores: `RED: 3 — BLUE: 2`
- Player counts: `12 vs 14 players`
- Current phase name

## Pre-Defined Categories

1. **Roast Battle** — "Write a creative roast of the opposing faction"
2. **Sales Pitch** — "Pitch why your faction deserves to win the arena"
3. **Haiku Challenge** — "Write a haiku about {random_topic}"
4. **ELI5** — "Explain {complex_topic} like I'm 5 years old"
5. **Debate Club** — "Argue convincingly for: {position}"
6. **Code Golf** — "Write the shortest solution to: {problem}"
7. **Storyteller** — "Continue this story in the most unexpected way: {opening}"
8. **Conspiracy Theory** — "Invent the most convincing fake conspiracy about {topic}"

Categories shuffle each game. Random topics/positions are pre-defined per category.

## Error Handling

- **SSE disconnect:** Client auto-reconnects with `EventSource` retry. Server cleans up stale connections.
- **Auth failure:** Redirect to `/` with error toast.
- **Claude API failure:** Show "Agent malfunction!" message in the panel. Other agent still completes. Forfeit that panel's round.
- **Double voting:** Server-side check via user metadata. Return 409 Conflict. Client shows "Already voted."
- **Empty submissions:** If a team submits no prompts, use a default prompt from the category.

## Testing Plan

- Manual testing: open arena on laptop screen, two phone browsers (one per faction)
- Verify: sign-in → team assignment → prompt submission → voting → agent streaming → scoring
- Edge cases: simultaneous submissions, disconnects during battle, uneven teams
