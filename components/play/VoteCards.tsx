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
  const isJudge = userFaction === "judge";
  const canVoteFor = (faction: Faction) => {
    if (hasVoted) return false;
    if (isJudge) return faction === "red" || faction === "blue";
    return faction !== userFaction;
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-[var(--text-muted)] text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {isJudge ? "JUDGE: PICK THE BEST RESPONSE" : "VOTE FOR THE BEST RESPONSE"}
      </p>
      <div className="space-y-3">
        {(["red", "blue"] as Faction[]).map((faction) => (
          <GlowBorder key={faction} faction={faction} intensity={canVoteFor(faction) ? "medium" : "low"}>
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: faction === "red" ? "var(--red-faction)" : "var(--blue-faction)" }}
              >
                {faction} faction
              </p>
              <p className="text-sm whitespace-pre-wrap mb-3">{faction === "red" ? redText : blueText}</p>
              <button
                onClick={() => canVoteFor(faction) && onVote(faction)}
                disabled={!canVoteFor(faction)}
                aria-label={`Vote for ${faction} faction`}
                className={`w-full py-4 rounded-xl text-lg font-bold uppercase tracking-wider outline-none transition-all duration-200 ${
                  canVoteFor(faction)
                    ? "cursor-pointer focus:ring-2 focus:ring-white"
                    : "opacity-30 cursor-not-allowed"
                }`}
                style={{
                  fontFamily: "var(--font-display)",
                  background: faction === "red"
                    ? "rgba(255,70,85,0.2)"
                    : "rgba(0,212,255,0.2)",
                  color: faction === "red" ? "var(--red-faction)" : "var(--blue-faction)",
                  border: `2px solid ${faction === "red" ? "var(--red-faction)" : "var(--blue-faction)"}`,
                }}
              >
                VOTE {faction.toUpperCase()}
              </button>
            </div>
          </GlowBorder>
        ))}
      </div>
      {hasVoted && (
        <p className="text-center text-[var(--accent-gold)] text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          VOTE RECORDED!
        </p>
      )}
    </div>
  );
}
