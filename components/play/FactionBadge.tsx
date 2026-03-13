import { Faction } from "@/lib/types";

interface FactionBadgeProps {
  faction: Faction;
  className?: string;
}

export default function FactionBadge({ faction, className = "" }: FactionBadgeProps) {
  const color = faction === "red" ? "var(--red-faction)" : "var(--blue-faction)";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        color: color,
        boxShadow: `0 0 15px color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {faction} faction
    </span>
  );
}
