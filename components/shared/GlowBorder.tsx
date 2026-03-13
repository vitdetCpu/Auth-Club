import { Faction } from "@/lib/types";

interface GlowBorderProps {
  faction: Faction;
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export default function GlowBorder({
  faction,
  children,
  className = "",
  intensity = "medium",
}: GlowBorderProps) {
  const color = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";
  const glowSize = { low: "10px", medium: "20px", high: "40px" }[intensity];

  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        boxShadow: `0 0 ${glowSize} color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {children}
    </div>
  );
}
