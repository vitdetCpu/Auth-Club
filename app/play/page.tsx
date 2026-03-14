import { stackServerApp } from "@/stack/server";
import { addMember } from "@/lib/game-state";
import { Faction } from "@/lib/types";
import PlayClient from "./PlayClient";
import FactionPicker from "./FactionPicker";

export default async function PlayPage() {
  const user = await stackServerApp.getUser({ or: "redirect" });

  const faction = (user.serverMetadata as any)?.faction as Faction | undefined;

  if (faction) {
    addMember(faction, user.id);
    return (
      <PlayClient
        faction={faction}
        userId={user.id}
        displayName={user.displayName ?? "Player"}
      />
    );
  }

  return <FactionPicker userId={user.id} displayName={user.displayName ?? "Player"} />;
}
