"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface PromptInputProps {
  category: string;
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

export default function PromptInput({ category, onSubmit, disabled }: PromptInputProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting || disabled) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2
        className="text-2xl font-bold text-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {category}
      </h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={280}
          placeholder="Enter your prompt..."
          aria-label="Enter your prompt"
          disabled={disabled || submitting}
          className="flex-1 bg-[var(--bg-card)] border border-white/10 rounded-xl px-4 py-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] outline-none transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting || disabled}
          aria-label="Submit prompt"
          className="bg-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/80 text-black font-bold disabled:opacity-30 rounded-xl px-6 py-4 transition-colors cursor-pointer focus:ring-2 focus:ring-white outline-none flex items-center gap-2 text-base"
        >
          <Send className="w-5 h-5" />
          <span>SEND</span>
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)] text-right">{text.length}/280</p>
    </div>
  );
}
