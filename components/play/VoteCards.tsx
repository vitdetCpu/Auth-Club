"use client";

import { Faction } from "@/lib/types";
import GlowBorder from "@/components/shared/GlowBorder";

interface VoteCardsProps {
  redText: string;
  blueText: string;
  userFaction: Faction;
  onVote: (votedFor: Faction) => void;
  hasVoted: boolean;
}

export default function VoteCards({ redText, blueText, userFaction, onVote, hasVoted }: VoteCardsProps) {
  const canVoteFor = (faction: Faction) => faction !== userFaction && !hasVoted;

  return (
    <div className="space-y-4">
      <p className="text-center text-[var(--text-muted)] text-sm">
        Vote for the best response (you can only vote for the other team)
      </p>
      <div className="space-y-3">
        {(["red", "blue"] as Faction[]).map((faction) => (
          <GlowBorder key={faction} faction={faction} intensity={canVoteFor(faction) ? "medium" : "low"}>
            <button
              onClick={() => canVoteFor(faction) && onVote(faction)}
              disabled={!canVoteFor(faction)}
              className={`w-full text-left p-4 rounded-xl ${
                canVoteFor(faction)
                  ? "cursor-pointer hover:bg-white/5 transition-colors"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: faction === "red" ? "var(--red-faction)" : "var(--blue-faction)" }}
              >
                {faction} faction
              </p>
              <p className="text-sm whitespace-pre-wrap">{faction === "red" ? redText : blueText}</p>
            </button>
          </GlowBorder>
        ))}
      </div>
      {hasVoted && (
        <p className="text-center text-[var(--accent-gold)] text-sm font-bold">Vote recorded!</p>
      )}
    </div>
  );
}
