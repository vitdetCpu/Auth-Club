interface LeaderboardProps {
  scores: { red: number; blue: number };
  redMembers: number;
  blueMembers: number;
  judgeCount: number;
  phase: string;
}

export default function Leaderboard({ scores, redMembers, blueMembers, judgeCount, phase }: LeaderboardProps) {
  return (
    <div className="flex items-center justify-between px-8 py-3 border-t border-white/5 text-sm">
      <div className="flex items-center gap-4">
        <span className="font-bold" style={{ color: "var(--red-faction)", fontFamily: "var(--font-display)" }}>
          RED: {scores.red}
        </span>
        <span className="text-[var(--text-muted)]">{redMembers} players</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[var(--text-muted)] uppercase tracking-wider text-xs">
          {phase.replace("-", " ")}
        </span>
        {judgeCount > 0 && (
          <span className="text-[var(--accent-gold)] text-xs">
            {judgeCount} judge{judgeCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[var(--text-muted)]">{blueMembers} players</span>
        <span className="font-bold" style={{ color: "var(--blue-faction)", fontFamily: "var(--font-display)" }}>
          BLUE: {scores.blue}
        </span>
      </div>
    </div>
  );
}
