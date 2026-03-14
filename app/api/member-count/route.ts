import { NextResponse } from "next/server";
import { gameState } from "@/lib/game-state";

export async function GET() {
  return NextResponse.json({
    red: gameState.teams.red.members.length,
    blue: gameState.teams.blue.members.length,
    judges: gameState.judges.length,
  });
}
