import Anthropic from "@anthropic-ai/sdk";
import { Round, Faction } from "./types";
import { broadcast } from "./sse";

const anthropic = new Anthropic();

const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";

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
  abortBattle();
  currentBattleAbort = new AbortController();
  const signal = currentBattleAbort.signal;

  Promise.all([
    streamAgent("red", round, signal),
    streamAgent("blue", round, signal),
  ]).catch(() => {});
}

export function abortBattle() {
  if (currentBattleAbort) {
    currentBattleAbort.abort();
    currentBattleAbort = null;
  }
}
