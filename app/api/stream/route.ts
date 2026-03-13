import { addClient, removeClient } from "@/lib/sse";
import { gameState } from "@/lib/game-state";

export const dynamic = "force-dynamic";

export async function GET() {
  let clientId: string;

  const stream = new ReadableStream({
    start(controller) {
      clientId = addClient(controller);

      const round = gameState.rounds[gameState.currentRound - 1];
      const initData = {
        phase: gameState.phase,
        phaseEndsAt: gameState.phaseEndsAt,
        round: gameState.currentRound,
        category: round?.category ?? "",
        status: gameState.status,
        totalRounds: gameState.totalRounds,
        scores: { red: gameState.teams.red.score, blue: gameState.teams.blue.score },
        members: { red: gameState.teams.red.members.length, blue: gameState.teams.blue.members.length },
      };
      const message = `event: phase-change\ndata: ${JSON.stringify(initData)}\n\n`;
      controller.enqueue(new TextEncoder().encode(message));
    },
    cancel() {
      removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
