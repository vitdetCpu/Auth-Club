import { NextRequest, NextResponse } from "next/server";
import { startGame } from "@/lib/game-engine";
import { resetGame } from "@/lib/game-state";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { secret, rounds } = body;

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalRounds = typeof rounds === "number" && rounds > 0 && rounds <= 20 ? rounds : 5;

  resetGame(totalRounds);
  startGame(totalRounds);

  return NextResponse.json({ status: "started", rounds: totalRounds });
}
