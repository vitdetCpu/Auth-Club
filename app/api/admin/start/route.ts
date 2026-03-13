import { NextRequest, NextResponse } from "next/server";
import { startGame } from "@/lib/game-engine";
import { resetGame } from "@/lib/game-state";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, rounds } = body;

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  resetGame(rounds ?? 5);
  startGame(rounds ?? 5);

  return NextResponse.json({ status: "started", rounds: rounds ?? 5 });
}
