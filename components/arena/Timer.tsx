"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  phaseEndsAt: number;
}

export default function Timer({ phaseEndsAt }: TimerProps) {
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
    <span
      className={`text-6xl font-bold tabular-nums ${timeLeft <= 10 ? "text-[var(--red-faction)] animate-pulse" : "text-[var(--text-primary)]"}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {timeLeft}
    </span>
  );
}
