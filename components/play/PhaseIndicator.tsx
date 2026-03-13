"use client";

import { useState, useEffect } from "react";
import { Phase } from "@/lib/types";

interface PhaseIndicatorProps {
  phase: Phase;
  phaseEndsAt: number;
}

const PHASE_LABELS: Record<Phase, string> = {
  prompting: "Submit Prompts",
  "voting-prompt": "Vote for Best Prompt",
  battling: "Agents Battling",
  "voting-winner": "Vote for Winner",
  results: "Results",
};

export default function PhaseIndicator({ phase, phaseEndsAt }: PhaseIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
        {PHASE_LABELS[phase]}
      </span>
      <span
        className={`text-lg font-bold tabular-nums ${timeLeft <= 10 ? "text-[var(--red-faction)] animate-pulse" : "text-[var(--text-primary)]"}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {timeLeft}s
      </span>
    </div>
  );
}
