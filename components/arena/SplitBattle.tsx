"use client";

import { useRef, useEffect } from "react";
import GlowBorder from "@/components/shared/GlowBorder";
import StreamingText from "@/components/shared/StreamingText";

interface SplitBattleProps {
  redPrompt: string;
  bluePrompt: string;
  redResponse: string;
  blueResponse: string;
  redStreaming: boolean;
  blueStreaming: boolean;
}

function AutoScrollPanel({ children, streaming }: { children: React.ReactNode; streaming: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (streaming && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  });
  return (
    <div ref={ref} className="flex-1 overflow-y-auto min-h-0">
      {children}
    </div>
  );
}

export default function SplitBattle({
  redPrompt,
  bluePrompt,
  redResponse,
  blueResponse,
  redStreaming,
  blueStreaming,
}: SplitBattleProps) {
  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      <GlowBorder faction="red" className="flex flex-col p-6 bg-[var(--bg-card)] min-h-0" intensity="high">
        <h2
          className="text-2xl font-bold uppercase tracking-wider mb-4 shrink-0"
          style={{ fontFamily: "var(--font-display)", color: "var(--red-faction)" }}
        >
          Red Faction
        </h2>
        {redPrompt && (
          <blockquote className="text-sm text-[var(--text-muted)] border-l-2 border-[var(--red-faction)] pl-3 mb-4 italic shrink-0">
            &ldquo;{redPrompt}&rdquo;
          </blockquote>
        )}
        <AutoScrollPanel streaming={redStreaming}>
          {redStreaming ? (
            <StreamingText text={redResponse} className="text-lg leading-relaxed" />
          ) : (
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {redResponse || "Waiting..."}
            </p>
          )}
        </AutoScrollPanel>
      </GlowBorder>

      <GlowBorder faction="blue" className="flex flex-col p-6 bg-[var(--bg-card)] min-h-0" intensity="high">
        <h2
          className="text-2xl font-bold uppercase tracking-wider mb-4 shrink-0"
          style={{ fontFamily: "var(--font-display)", color: "var(--blue-faction)" }}
        >
          Blue Faction
        </h2>
        {bluePrompt && (
          <blockquote className="text-sm text-[var(--text-muted)] border-l-2 border-[var(--blue-faction)] pl-3 mb-4 italic shrink-0">
            &ldquo;{bluePrompt}&rdquo;
          </blockquote>
        )}
        <AutoScrollPanel streaming={blueStreaming}>
          {blueStreaming ? (
            <StreamingText text={blueResponse} className="text-lg leading-relaxed" />
          ) : (
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {blueResponse || "Waiting..."}
            </p>
          )}
        </AutoScrollPanel>
      </GlowBorder>
    </div>
  );
}
