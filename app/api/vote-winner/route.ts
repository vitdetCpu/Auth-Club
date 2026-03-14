import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { gameState, voteForWinner, getCurrentRound } from "@/lib/game-state";
import { broadcast } from "@/lib/sse";
import { Faction, BattleFaction } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faction = user.serverMetadata?.faction as Faction | undefined;
  if (!faction) return NextResponse.json({ error: "No faction assigned" }, { status: 400 });

  if (faction !== "judge") {
    return NextResponse.json({ error: "Only judges can vote on the winner" }, { status: 403 });
  }

  if (gameState.phase !== "voting-winner") {
    return NextResponse.json({ error: "Not in voting phase" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const votedFor = body.votedFor as string;

  if (!["red", "blue"].includes(votedFor)) {
    return NextResponse.json({ error: "Invalid faction" }, { status: 400 });
  }

  voteForWinner(votedFor as BattleFaction, user.id);

  const round = getCurrentRound()!;
  broadcast("winner-votes-update", {
    red: round.votes.red,
    blue: round.votes.blue,
  });

  return NextResponse.json({ ok: true });
}
