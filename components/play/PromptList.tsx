"use client";

import { ChevronUp } from "lucide-react";

interface Prompt {
  text: string;
  votes: number;
}

interface PromptListProps {
  prompts: Prompt[];
  onVote?: (index: number) => void;
  votingEnabled?: boolean;
  hasVoted?: boolean;
}

export default function PromptList({ prompts, onVote, votingEnabled, hasVoted }: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <p className="text-center text-[var(--text-muted)] py-8">
        No prompts yet. Be the first!
      </p>
    );
  }

  const sorted = [...prompts]
    .map((p, i) => ({ ...p, originalIndex: i }))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
      {sorted.map((prompt) => (
        <div
          key={prompt.originalIndex}
          className="flex items-start gap-3 bg-[var(--bg-card)] rounded-lg p-3 border border-white/5"
        >
          {votingEnabled && (
            <button
              onClick={() => onVote?.(prompt.originalIndex)}
              disabled={hasVoted}
              aria-label={`Upvote prompt: ${prompt.text.slice(0, 30)}`}
              className="flex flex-col items-center min-w-[40px] cursor-pointer disabled:opacity-30 focus:ring-2 focus:ring-[var(--accent-gold)] rounded outline-none"
            >
              <ChevronUp className="w-5 h-5" />
              <span className="text-sm font-bold tabular-nums">{prompt.votes}</span>
            </button>
          )}
          {!votingEnabled && (
            <span className="text-sm font-bold tabular-nums min-w-[30px] text-center text-[var(--text-muted)]">
              {prompt.votes}
            </span>
          )}
          <p className="text-sm flex-1">{prompt.text}</p>
        </div>
      ))}
    </div>
  );
}
