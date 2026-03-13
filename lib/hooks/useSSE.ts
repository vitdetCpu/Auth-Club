"use client";

import { useEffect, useRef } from "react";

type SSEHandler = (event: string, data: any) => void;

export function useSSE(onEvent: SSEHandler) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    const events = [
      "phase-change",
      "prompt-submitted",
      "prompt-votes-update",
      "winning-prompts",
      "agent-token",
      "agent-done",
      "winner-votes-update",
      "round-result",
      "game-over",
    ];

    events.forEach((eventName) => {
      eventSource.addEventListener(eventName, (e) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current(eventName, data);
        } catch {
          console.error("Failed to parse SSE data:", e.data);
        }
      });
    });

    eventSource.onerror = () => {
      console.warn("SSE connection lost, reconnecting...");
    };

    return () => {
      eventSource.close();
    };
  }, []);
}
