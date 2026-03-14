import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { gameState, addSubmission, getCurrentRound } from "@/lib/game-state";
import { broadcast } from "@/lib/sse";
import { Faction, BattleFaction } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faction = user.serverMetadata?.faction as Faction | undefined;
  if (!faction) return NextResponse.json({ error: "No faction assigned" }, { status: 400 });
  if (faction === "judge") return NextResponse.json({ error: "Judges cannot submit prompts" }, { status: 403 });

  if (gameState.phase !== "prompting") {
    return NextResponse.json({ error: "Not in prompting phase" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = body.text?.trim();
  if (!text || text.length > 280) {
    return NextResponse.json({ error: "Invalid prompt (1-280 chars)" }, { status: 400 });
  }

  const battleFaction = faction as BattleFaction;
  const added = addSubmission(battleFaction, {
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
    count: round.submissions[battleFaction].length,
  });

  broadcast("prompt-votes-update", {
    faction,
    prompts: round.submissions[battleFaction].map(s => ({ text: s.text, votes: s.votes })),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
