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
          disabled={disabled || submitting}
          className="flex-1 bg-[var(--bg-card)] border border-white/10 rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting || disabled}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg px-4 py-3 transition-colors cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)] text-right">{text.length}/280</p>
    </div>
  );
}
