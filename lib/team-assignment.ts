import { stackServerApp } from "@/stack/server";
import { gameState, addMember, getSmallerFaction } from "./game-state";
import { BattleFaction } from "./types";

let teamsInitialized = false;

export async function ensureTeams() {
  if (teamsInitialized && gameState.teams.red.id && gameState.teams.blue.id) return;

  const allTeams = await stackServerApp.listTeams();
  let redTeam = allTeams.find((t: any) => t.displayName === "Red Faction");
  let blueTeam = allTeams.find((t: any) => t.displayName === "Blue Faction");

  if (!redTeam) {
    redTeam = await stackServerApp.createTeam({ displayName: "Red Faction" });
  }
  if (!blueTeam) {
    blueTeam = await stackServerApp.createTeam({ displayName: "Blue Faction" });
  }

  gameState.teams.red.id = redTeam.id;
  gameState.teams.blue.id = blueTeam.id;
  teamsInitialized = true;
}

export async function assignUserToFaction(userId: string): Promise<BattleFaction> {
  await ensureTeams();

  const faction = getSmallerFaction();
  const teamId = gameState.teams[faction].id;
  const team = await stackServerApp.getTeam(teamId);

  if (team) {
    try {
      await team.addUser(userId);
    } catch (e) {
      // User might already be in the team
      console.log("Could not add user to team (may already be a member):", e);
    }
  }

  addMember(faction, userId);
  return faction;
}
