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
          className="flex items-center gap-3 bg-[var(--bg-card)] rounded-xl p-4 border border-white/5"
        >
          {votingEnabled && (
            <button
              onClick={() => onVote?.(prompt.originalIndex)}
              disabled={hasVoted}
              aria-label={`Upvote prompt: ${prompt.text.slice(0, 30)}`}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-xl bg-white/5 hover:bg-[var(--accent-gold)]/20 cursor-pointer disabled:opacity-30 focus:ring-2 focus:ring-[var(--accent-gold)] outline-none transition-colors"
            >
              <ChevronUp className="w-6 h-6" />
              <span className="text-sm font-bold tabular-nums">{prompt.votes}</span>
            </button>
          )}
          {!votingEnabled && (
            <span className="text-base font-bold tabular-nums min-w-[36px] text-center text-[var(--text-muted)]">
              {prompt.votes}
            </span>
          )}
          <p className="text-base flex-1">{prompt.text}</p>
        </div>
      ))}
    </div>
  );
}
