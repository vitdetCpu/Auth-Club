"use client";

import { Faction } from "@/lib/types";

interface PlayClientProps {
  faction: Faction;
  userId: string;
  displayName: string;
}

export default function PlayClient({ faction, userId, displayName }: PlayClientProps) {
  const color = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div
        className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
        style={{
          backgroundColor: `${color}20`,
          color: color,
          boxShadow: `0 0 20px ${color}40`,
        }}
      >
        {faction} faction
      </div>
      <p className="mt-4 text-[var(--text-muted)]">
        Welcome, {displayName}! Waiting for game to start...
      </p>
    </div>
  );
}
