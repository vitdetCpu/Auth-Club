"use client";

import { useState, useCallback } from "react";
import { Faction, Phase, GameStatus } from "@/lib/types";
import { useSSE } from "@/lib/hooks/useSSE";
import FactionBadge from "@/components/play/FactionBadge";
import PhaseIndicator from "@/components/play/PhaseIndicator";
import PromptInput from "@/components/play/PromptInput";
import PromptList from "@/components/play/PromptList";
import VoteCards from "@/components/play/VoteCards";
import StreamingText from "@/components/shared/StreamingText";

interface PlayClientProps {
  faction: Faction;
  userId: string;
  displayName: string;
}

interface GameView {
  status: GameStatus;
  phase: Phase;
  phaseEndsAt: number;
  round: number;
  category: string;
  totalRounds: number;
  myPrompts: { text: string; votes: number }[];
  redResponse: string;
  blueResponse: string;
  redStreaming: boolean;
  blueStreaming: boolean;
  winnerVotes: { red: number; blue: number };
  roundWinner: Faction | null;
  scores: { red: number; blue: number };
  hasVotedPrompt: boolean;
  hasVotedWinner: boolean;
  memberCounts: { red: number; blue: number };
  gameWinner: Faction | null;
  finalScores: { red: number; blue: number } | null;
}

export default function PlayClient({ faction, userId, displayName }: PlayClientProps) {
  const [view, setView] = useState<GameView>({
    status: "waiting",
    phase: "prompting",
    phaseEndsAt: 0,
    round: 0,
    category: "",
    totalRounds: 5,
    myPrompts: [],
    redResponse: "",
    blueResponse: "",
    redStreaming: false,
    blueStreaming: false,
    winnerVotes: { red: 0, blue: 0 },
    roundWinner: null,
    scores: { red: 0, blue: 0 },
    hasVotedPrompt: false,
    hasVotedWinner: false,
    memberCounts: { red: 0, blue: 0 },
    gameWinner: null,
    finalScores: null,
  });

  const handleSSE = useCallback((event: string, data: any) => {
    setView((prev) => {
      switch (event) {
        case "phase-change":
          return {
            ...prev,
            status: data.status ?? "active",
            phase: data.phase,
            phaseEndsAt: data.phaseEndsAt,
            round: data.round,
            category: data.category,
            totalRounds: data.totalRounds ?? prev.totalRounds,
            scores: data.scores ?? prev.scores,
            memberCounts: data.members ?? prev.memberCounts,
            ...(data.phase === "prompting" ? {
              myPrompts: [],
              redResponse: "",
              blueResponse: "",
              redStreaming: false,
              blueStreaming: false,
              winnerVotes: { red: 0, blue: 0 },
              roundWinner: null,
              hasVotedPrompt: false,
              hasVotedWinner: false,
            } : {}),
          };

        case "prompt-submitted":
          return prev;

        case "prompt-votes-update":
          if (data.faction === faction) {
            return { ...prev, myPrompts: data.prompts };
          }
          return prev;

        case "winning-prompts":
          return prev;

        case "agent-token":
          if (data.faction === "red") {
            return { ...prev, redResponse: prev.redResponse + data.token, redStreaming: true };
          } else {
            return { ...prev, blueResponse: prev.blueResponse + data.token, blueStreaming: true };
          }

        case "agent-done":
          if (data.faction === "red") {
            return { ...prev, redStreaming: false };
          } else {
            return { ...prev, blueStreaming: false };
          }

        case "winner-votes-update":
          return { ...prev, winnerVotes: data };

        case "round-result":
          return { ...prev, roundWinner: data.winner, scores: data.scores };

        case "game-over":
          return {
            ...prev,
            status: "finished",
            gameWinner: data.winner,
            finalScores: data.finalScores,
          };

        case "member-joined":
          return { ...prev, memberCounts: data.members };

        default:
          return prev;
      }
    });
  }, [faction]);

  useSSE(handleSSE);

  const submitPrompt = async (text: string) => {
    const res = await fetch("/api/submit-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
    }
  };

  const votePrompt = async (index: number) => {
    // Optimistically update the vote count
    setView((prev) => ({
      ...prev,
      hasVotedPrompt: true,
      myPrompts: prev.myPrompts.map((p, i) =>
        i === index ? { ...p, votes: p.votes + 1 } : p
      ),
    }));
    const res = await fetch("/api/vote-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Vote failed" }));
      console.error("Vote error:", err.error);
    }
  };

  const voteWinner = async (votedFor: Faction) => {
    const res = await fetch("/api/vote-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votedFor }),
    });
    if (res.ok) {
      setView((prev) => ({ ...prev, hasVotedWinner: true }));
    }
  };

  const factionColor = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-white/5">
        <FactionBadge faction={faction} />
        {view.status === "active" && (
          <>
            <span className="text-sm text-[var(--text-muted)]">
              Round {view.round}/{view.totalRounds}
            </span>
            <PhaseIndicator phase={view.phase} phaseEndsAt={view.phaseEndsAt} />
          </>
        )}
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {view.status === "waiting" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[60vh]">
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: factionColor, boxShadow: `0 0 20px ${factionColor}` }}
            />
            <p className="text-[var(--text-muted)]">Waiting for the game to begin...</p>
            <p className="text-sm text-[var(--text-muted)]">Welcome, {displayName}</p>
          </div>
        )}

        {view.status === "finished" && view.finalScores && (
          <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[60vh]">
            <h2
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: view.gameWinner === "red" ? "var(--red-faction)" : "var(--blue-faction)",
              }}
            >
              {view.gameWinner?.toUpperCase()} WINS!
            </h2>
            <p className="text-[var(--text-muted)]">
              {view.finalScores.red} — {view.finalScores.blue}
            </p>
          </div>
        )}

        {view.status === "active" && (
          <>
            {view.phase === "prompting" && (
              faction === "judge" ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                  <div className="w-4 h-4 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                  <p className="text-[var(--text-muted)]">Players are submitting prompts...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <PromptInput category={view.category} onSubmit={submitPrompt} />
                  <PromptList prompts={view.myPrompts} />
                </div>
              )
            )}

            {view.phase === "voting-prompt" && (
              faction === "judge" ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                  <div className="w-4 h-4 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                  <p className="text-[var(--text-muted)]">Players are voting on prompts...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-center">Pick the best prompt for your agent!</h2>
                  <PromptList
                    prompts={view.myPrompts}
                    votingEnabled
                    onVote={votePrompt}
                    hasVoted={view.hasVotedPrompt}
                  />
                </div>
              )
            )}

            {view.phase === "battling" && (
              <div className="space-y-4">
                <p className="text-center text-[var(--text-muted)] text-sm">
                  Watch the arena screen!
                </p>
                <div className="space-y-3">
                  <div className="bg-[var(--bg-card)] rounded-lg p-3 border-l-4" style={{ borderColor: "var(--red-faction)" }}>
                    <p className="text-xs font-bold uppercase text-[var(--red-faction)] mb-1">Red</p>
                    {view.redStreaming ? (
                      <StreamingText text={view.redResponse} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{view.redResponse || "..."}</p>
                    )}
                  </div>
                  <div className="bg-[var(--bg-card)] rounded-lg p-3 border-l-4" style={{ borderColor: "var(--blue-faction)" }}>
                    <p className="text-xs font-bold uppercase text-[var(--blue-faction)] mb-1">Blue</p>
                    {view.blueStreaming ? (
                      <StreamingText text={view.blueResponse} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{view.blueResponse || "..."}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {view.phase === "voting-winner" && (
              faction === "judge" ? (
                <VoteCards
                  redText={view.redResponse}
                  blueText={view.blueResponse}
                  userFaction={faction}
                  onVote={voteWinner}
                  hasVoted={view.hasVotedWinner}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full bg-[var(--accent-gold)] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-2xl font-bold text-[var(--accent-gold)] tracking-wider"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    VOTING IN PROGRESS...
                  </p>
                  <p className="text-[var(--text-muted)]">Judges are deciding the winner</p>
                </div>
              )
            )}

            {view.phase === "results" && (
              <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[60vh]">
                {view.roundWinner && (
                  <h2
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: view.roundWinner === "red" ? "var(--red-faction)" : "var(--blue-faction)",
                    }}
                  >
                    {view.roundWinner.toUpperCase()} WINS THE ROUND!
                  </h2>
                )}
                <p className="text-[var(--text-muted)]">Next round starting soon...</p>
              </div>
            )}
          </>
        )}
      </main>

      {view.status === "active" && (
        <footer className="flex items-center justify-center gap-6 p-3 border-t border-white/5 text-sm">
          <span style={{ color: "var(--red-faction)" }}>RED: {view.scores.red}</span>
          <span className="text-[var(--text-muted)]">|</span>
          <span style={{ color: "var(--blue-faction)" }}>BLUE: {view.scores.blue}</span>
        </footer>
      )}
    </div>
  );
}
