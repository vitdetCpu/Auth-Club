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

  if (user.serverMetadata?.hasVotedPrompt === gameState.currentRound) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  const body = await request.json();
  const { index } = body;

  const voted = voteForPrompt(faction, index, user.id);
  if (!voted) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  await user.update({
    serverMetadata: { ...user.serverMetadata, hasVotedPrompt: gameState.currentRound },
  });

  const round = getCurrentRound()!;
  broadcast("prompt-votes-update", {
    faction,
    prompts: round.submissions[faction].map(s => ({ text: s.text, votes: s.votes })),
  });

  return NextResponse.json({ ok: true });
}
