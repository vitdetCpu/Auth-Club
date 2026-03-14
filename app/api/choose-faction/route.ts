import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { Faction } from "@/lib/types";
import { ensureTeams } from "@/lib/team-assignment";
import { gameState, addMember } from "@/lib/game-state";
import { broadcast } from "@/lib/sse";

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((user.serverMetadata as any)?.faction) {
    return NextResponse.json({ error: "Already in a faction" }, { status: 409 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const faction = body.faction as Faction;
  if (!["red", "blue", "judge"].includes(faction)) {
    return NextResponse.json({ error: "Invalid faction" }, { status: 400 });
  }

  if (faction !== "judge") {
    await ensureTeams();
    const teamId = gameState.teams[faction].id;
    const team = await stackServerApp.getTeam(teamId);
    if (team) {
      try {
        await team.addUser(user.id);
      } catch {
        // User might already be in the team
      }
    }
  }

  addMember(faction, user.id);

  await user.update({
    serverMetadata: { ...(user.serverMetadata as any), faction },
  });

  broadcast("member-joined", {
    members: {
      red: gameState.teams.red.members.length,
      blue: gameState.teams.blue.members.length,
      judges: gameState.judges.length,
    },
  });

  return NextResponse.json({ ok: true, faction });
}
