import { stackServerApp } from "@/stack/server";
import { assignUserToFaction } from "@/lib/team-assignment";
import { addMember } from "@/lib/game-state";
import { Faction } from "@/lib/types";
import PlayClient from "./PlayClient";

export default async function PlayPage() {
  const user = await stackServerApp.getUser({ or: "redirect" });

  let faction = (user.serverMetadata as any)?.faction as Faction | undefined;

  if (!faction) {
    faction = await assignUserToFaction(user.id);
    await user.update({
      serverMetadata: { ...(user.serverMetadata as any), faction },
    });
  } else {
    addMember(faction, user.id);
  }

  return (
    <PlayClient
      faction={faction}
      userId={user.id}
      displayName={user.displayName ?? "Player"}
    />
  );
}
