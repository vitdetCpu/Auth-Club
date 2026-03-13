"use client";

interface StreamingTextProps {
  text: string;
  className?: string;
}

export default function StreamingText({ text, className = "" }: StreamingTextProps) {
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {text}
      <span className="inline-block w-2 h-5 bg-[var(--text-primary)] ml-0.5 animate-pulse" />
    </div>
  );
}
