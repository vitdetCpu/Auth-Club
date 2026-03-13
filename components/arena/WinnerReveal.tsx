import { Faction } from "@/lib/types";

interface WinnerRevealProps {
  winner: Faction;
  scores: { red: number; blue: number };
}

export default function WinnerReveal({ winner, scores }: WinnerRevealProps) {
  const color = winner === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <p className="text-[var(--accent-gold)] uppercase tracking-[0.5em] text-lg">Winner</p>
      <h1
        className="text-8xl font-bold uppercase"
        style={{
          fontFamily: "var(--font-display)",
          color,
          textShadow: `0 0 40px ${color}, 0 0 80px color-mix(in srgb, ${color} 50%, transparent)`,
        }}
      >
        {winner}
      </h1>
      <div
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span style={{ color: "var(--red-faction)" }}>{scores.red}</span>
        <span className="text-[var(--text-muted)] mx-4">—</span>
        <span style={{ color: "var(--blue-faction)" }}>{scores.blue}</span>
      </div>
    </div>
  );
}
