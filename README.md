# Agent Arena

A live, audience-powered AI competition platform where participants directly influence how AI agents battle in real time. Built for the Stack Auth hackathon.

## How It Works

1. The host opens the **Arena** screen (`/arena`) on a projector or shared display
2. Audience members scan the QR code on their phones to join at `/play`
3. Players choose a faction: **Red**, **Blue**, or **Judge**
4. The host starts the game via the admin API
5. Each round:
   - **Players** submit and vote on prompts for their faction's AI agent
   - Two **Claude-powered AI agents** battle head-to-head, streaming responses live
   - **Judges** vote on which response wins the round
   - Scores update and the next round begins

## Tech Stack

- **Next.js 16** (App Router)
- **Stack Auth** for authentication and team management
- **Anthropic Claude API** for AI agent responses (streaming)
- **Server-Sent Events (SSE)** for real-time updates across all devices
- **Tailwind CSS** for styling
- **TypeScript** throughout

## Setup

### Prerequisites

- Node.js 18+
- A [Stack Auth](https://stack-auth.com) project
- An [Anthropic API key](https://console.anthropic.com)

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_STACK_PROJECT_ID=your-stack-project-id
STACK_SECRET_SERVER_KEY=your-stack-secret-key
ANTHROPIC_API_KEY=your-anthropic-api-key
CLAUDE_MODEL=claude-sonnet-4-6
ADMIN_SECRET=your-admin-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

`NEXT_PUBLIC_APP_URL` is used for the QR code. For local development with mobile access, use an ngrok tunnel URL.

### Install and Run

```bash
npm install
npm run dev
```

### Stack Auth Configuration

In your Stack Auth dashboard, add your domain (e.g. your ngrok URL) to **Trusted Domains** so sign-in works on mobile devices.

## Usage

### Screens

- **`/`** - Landing page
- **`/arena`** - Projector/host display with QR code, live battle view, and scores
- **`/play`** - Mobile player interface for joining, submitting prompts, and voting

### Starting a Game

```bash
curl -X POST https://your-domain.com/api/admin/start \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-admin-secret","rounds":3}'
```

### Roles

| Role | What they do |
|------|-------------|
| **Red/Blue** | Submit prompts, vote on their faction's best prompt, watch the battle |
| **Judge** | Watch the battle, vote on which AI response wins each round |

## Game Phases

Each round cycles through five phases:

1. **Prompting** (20s) - Red and blue players submit prompt ideas
2. **Voting on Prompts** (20s) - Players upvote the best prompt for their faction
3. **Battle** (30s) - Both AI agents receive their faction's winning prompt and stream responses live
4. **Voting on Winner** (20s) - Judges pick which response was better
5. **Results** (10s) - Round winner revealed, scores updated

## Project Structure

```
app/
  arena/          - Projector/host display
  play/           - Mobile player UI + faction picker
  api/
    admin/start/  - Start game endpoint
    choose-faction/ - Join a faction
    submit-prompt/  - Submit a prompt
    vote-prompt/    - Upvote a prompt
    vote-winner/    - Judge votes on winner
    member-count/   - Player count endpoint
    stream/         - SSE endpoint
components/
  arena/          - Arena display components (SplitBattle, Leaderboard, etc.)
  play/           - Player UI components (PromptInput, VoteCards, etc.)
  shared/         - Shared components (GlowBorder, StreamingText)
lib/
  game-state.ts   - In-memory game state
  game-engine.ts  - Phase management and round logic
  ai-battle.ts    - Claude API streaming for both agents
  sse.ts          - Server-Sent Events broadcast
  types.ts        - TypeScript types
  categories.ts   - Round categories and prompts
```
