interface RoundHeaderProps {
  round: number;
  category: string;
}

export default function RoundHeader({ round, category }: RoundHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <p className="text-lg text-[var(--text-muted)] uppercase tracking-[0.3em]">
        Round {round}
      </p>
      <h1
        className="text-4xl font-bold uppercase tracking-wider"
        style={{
          fontFamily: "var(--font-display)",
          textShadow: "0 0 20px rgba(255,215,0,0.3)",
          color: "var(--accent-gold)",
        }}
      >
        {category}
      </h1>
    </div>
  );
}
