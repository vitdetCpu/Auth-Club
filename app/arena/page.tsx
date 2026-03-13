"use client";

import { useState, useCallback } from "react";
import { Faction, Phase, GameStatus } from "@/lib/types";
import { useSSE } from "@/lib/hooks/useSSE";
import RoundHeader from "@/components/arena/RoundHeader";
import Timer from "@/components/arena/Timer";
import SplitBattle from "@/components/arena/SplitBattle";
import VoteCounter from "@/components/arena/VoteCounter";
import Leaderboard from "@/components/arena/Leaderboard";
import WinnerReveal from "@/components/arena/WinnerReveal";

interface ArenaState {
  status: GameStatus;
  phase: Phase;
  phaseEndsAt: number;
  round: number;
  category: string;
  redPrompt: string;
  bluePrompt: string;
  redResponse: string;
  blueResponse: string;
  redStreaming: boolean;
  blueStreaming: boolean;
  winnerVotes: { red: number; blue: number };
  roundWinner: Faction | null;
  scores: { red: number; blue: number };
  memberCounts: { red: number; blue: number };
  gameWinner: Faction | null;
  finalScores: { red: number; blue: number } | null;
}

export default function ArenaPage() {
  const [state, setState] = useState<ArenaState>({
    status: "waiting",
    phase: "prompting",
    phaseEndsAt: 0,
    round: 0,
    category: "",
    redPrompt: "",
    bluePrompt: "",
    redResponse: "",
    blueResponse: "",
    redStreaming: false,
    blueStreaming: false,
    winnerVotes: { red: 0, blue: 0 },
    roundWinner: null,
    scores: { red: 0, blue: 0 },
    memberCounts: { red: 0, blue: 0 },
    gameWinner: null,
    finalScores: null,
  });

  const handleSSE = useCallback((event: string, data: any) => {
    setState((prev) => {
      switch (event) {
        case "phase-change":
          return {
            ...prev,
            status: data.status ?? "active",
            phase: data.phase,
            phaseEndsAt: data.phaseEndsAt,
            round: data.round,
            category: data.category,
            scores: data.scores ?? prev.scores,
            memberCounts: data.members ?? prev.memberCounts,
            ...(data.phase === "prompting" ? {
              redPrompt: "",
              bluePrompt: "",
              redResponse: "",
              blueResponse: "",
              redStreaming: false,
              blueStreaming: false,
              winnerVotes: { red: 0, blue: 0 },
              roundWinner: null,
            } : {}),
          };

        case "winning-prompts":
          return { ...prev, redPrompt: data.red, bluePrompt: data.blue };

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
          return { ...prev, status: "finished", gameWinner: data.winner, finalScores: data.finalScores };

        default:
          return prev;
      }
    });
  }, []);

  useSSE(handleSSE);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 flex flex-col h-full">
        {state.status === "waiting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <h1
              className="text-8xl font-bold tracking-wider"
              style={{
                fontFamily: "var(--font-display)",
                textShadow: "0 0 30px rgba(124,58,237,0.5), 0 0 60px rgba(124,58,237,0.3)",
              }}
            >
              AGENT ARENA
            </h1>
            <p className="text-2xl text-[var(--text-muted)] tracking-widest uppercase">
              Scan the QR code to join
            </p>
            <div className="w-4 h-4 rounded-full bg-[var(--accent-gold)] animate-pulse mt-8" />
          </div>
        )}

        {state.status === "finished" && state.finalScores && (
          <div className="flex-1 flex items-center justify-center">
            <WinnerReveal winner={state.gameWinner!} scores={state.finalScores} />
          </div>
        )}

        {state.status === "active" && (
          <>
            <header className="flex items-center justify-between px-8 py-4">
              <RoundHeader round={state.round} category={state.category} />
              <Timer phaseEndsAt={state.phaseEndsAt} />
            </header>

            <main className="flex-1 px-8 pb-4 min-h-0">
              {(state.phase === "prompting" || state.phase === "voting-prompt") && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <p className="text-4xl text-[var(--text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                      {state.phase === "prompting"
                        ? "Players are submitting prompts..."
                        : "Players are voting on prompts..."}
                    </p>
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full bg-[var(--accent-gold)] animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {state.phase === "battling" && (
                <SplitBattle
                  redPrompt={state.redPrompt}
                  bluePrompt={state.bluePrompt}
                  redResponse={state.redResponse}
                  blueResponse={state.blueResponse}
                  redStreaming={state.redStreaming}
                  blueStreaming={state.blueStreaming}
                />
              )}

              {state.phase === "voting-winner" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 min-h-0">
                    <SplitBattle
                      redPrompt={state.redPrompt}
                      bluePrompt={state.bluePrompt}
                      redResponse={state.redResponse}
                      blueResponse={state.blueResponse}
                      redStreaming={false}
                      blueStreaming={false}
                    />
                  </div>
                  <div className="mt-4">
                    <VoteCounter redVotes={state.winnerVotes.red} blueVotes={state.winnerVotes.blue} />
                  </div>
                </div>
              )}

              {state.phase === "results" && state.roundWinner && (
                <div className="flex items-center justify-center h-full">
                  <WinnerReveal winner={state.roundWinner} scores={state.scores} />
                </div>
              )}
            </main>

            <Leaderboard
              scores={state.scores}
              redMembers={state.memberCounts.red}
              blueMembers={state.memberCounts.blue}
              phase={state.phase}
            />
          </>
        )}
      </div>
    </div>
  );
}
