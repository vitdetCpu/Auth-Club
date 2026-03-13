interface VoteCounterProps {
  redVotes: number;
  blueVotes: number;
}

export default function VoteCounter({ redVotes, blueVotes }: VoteCounterProps) {
  const total = redVotes + blueVotes;
  const redPct = total > 0 ? Math.round((redVotes / total) * 100) : 50;
  const bluePct = total > 0 ? Math.round((blueVotes / total) * 100) : 50;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        <span style={{ color: "var(--red-faction)" }}>{redVotes}</span>
        <span className="text-[var(--text-muted)]">VS</span>
        <span style={{ color: "var(--blue-faction)" }}>{blueVotes}</span>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden bg-[var(--bg-card)]">
        <div
          className="transition-all duration-500 ease-out"
          style={{ width: `${redPct}%`, backgroundColor: "var(--red-faction)" }}
        />
        <div
          className="transition-all duration-500 ease-out"
          style={{ width: `${bluePct}%`, backgroundColor: "var(--blue-faction)" }}
        />
      </div>
    </div>
  );
}
