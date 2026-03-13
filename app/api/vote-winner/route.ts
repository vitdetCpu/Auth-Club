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

  if (votedFor === faction) {
    return NextResponse.json({ error: "Cannot vote for own team" }, { status: 403 });
  }

  if (!["red", "blue"].includes(votedFor)) {
    return NextResponse.json({ error: "Invalid faction" }, { status: 400 });
  }

  if (user.serverMetadata?.hasVotedWinner === gameState.currentRound) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  voteForWinner(votedFor, user.id);

  await user.update({
    serverMetadata: { ...user.serverMetadata, hasVotedWinner: gameState.currentRound },
  });

  const round = getCurrentRound()!;
  broadcast("winner-votes-update", {
    red: round.votes.red,
    blue: round.votes.blue,
  });

  return NextResponse.json({ ok: true });
}
