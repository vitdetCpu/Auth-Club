"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Faction } from "@/lib/types";

interface FactionPickerProps {
  userId: string;
  displayName: string;
}

export default function FactionPicker({ userId, displayName }: FactionPickerProps) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);

  const chooseFaction = async (faction: Faction) => {
    if (picking) return;
    setPicking(true);
    const res = await fetch("/api/choose-faction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faction }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error);
      setPicking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6">
      <h1
        className="text-4xl font-bold tracking-wider text-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        CHOOSE YOUR SIDE
      </h1>
      <p className="text-lg text-[var(--text-muted)] text-center">
        Welcome, {displayName}
      </p>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={() => chooseFaction("red")}
          disabled={picking}
          className="flex-1 py-12 rounded-2xl font-bold text-3xl tracking-wider uppercase cursor-pointer transition-all duration-200 border-3 border-[var(--red-faction)]/50 hover:border-[var(--red-faction)] hover:shadow-[0_0_40px_rgba(255,70,85,0.5)] disabled:opacity-50 focus:ring-2 focus:ring-[var(--red-faction)] outline-none"
          style={{
            fontFamily: "var(--font-display)",
            background: "rgba(255,70,85,0.15)",
            color: "var(--red-faction)",
          }}
        >
          JOIN RED
        </button>

        <button
          onClick={() => chooseFaction("blue")}
          disabled={picking}
          className="flex-1 py-12 rounded-2xl font-bold text-3xl tracking-wider uppercase cursor-pointer transition-all duration-200 border-3 border-[var(--blue-faction)]/50 hover:border-[var(--blue-faction)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] disabled:opacity-50 focus:ring-2 focus:ring-[var(--blue-faction)] outline-none"
          style={{
            fontFamily: "var(--font-display)",
            background: "rgba(0,212,255,0.15)",
            color: "var(--blue-faction)",
          }}
        >
          JOIN BLUE
        </button>
      </div>

      <button
        onClick={() => chooseFaction("judge")}
        disabled={picking}
        className="w-full max-w-md py-6 rounded-2xl font-bold text-xl tracking-wider uppercase cursor-pointer transition-all duration-200 border-2 border-[var(--accent-gold)]/50 hover:border-[var(--accent-gold)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] disabled:opacity-50 focus:ring-2 focus:ring-[var(--accent-gold)] outline-none"
        style={{
          fontFamily: "var(--font-display)",
          background: "rgba(255,215,0,0.1)",
          color: "var(--accent-gold)",
        }}
      >
        JOIN AS JUDGE
      </button>
    </div>
  );
}
