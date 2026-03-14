import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { gameState, voteForPrompt, getCurrentRound } from "@/lib/game-state";
import { broadcast } from "@/lib/sse";
import { Faction, BattleFaction } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faction = user.serverMetadata?.faction as Faction | undefined;
  if (!faction) return NextResponse.json({ error: "No faction assigned" }, { status: 400 });
  if (faction === "judge") return NextResponse.json({ error: "Judges cannot vote on prompts" }, { status: 403 });
  const battleFaction = faction as BattleFaction;

  if (gameState.phase !== "voting-prompt") {
    return NextResponse.json({ error: "Not in voting phase" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { index } = body;

  const voted = voteForPrompt(battleFaction, index, user.id);
  if (!voted) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const round = getCurrentRound()!;
  broadcast("prompt-votes-update", {
    faction: battleFaction,
    prompts: round.submissions[battleFaction].map(s => ({ text: s.text, votes: s.votes })),
  });

  return NextResponse.json({ ok: true });
}
