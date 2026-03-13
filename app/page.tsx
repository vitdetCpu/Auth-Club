import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await stackServerApp.getUser();
  if (user) redirect("/play");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-wider text-center animate-glow-pulse"
          style={{
            fontFamily: "var(--font-display)",
            textShadow: "0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.3)",
          }}
        >
          AGENT ARENA
        </h1>
        <p className="text-lg tracking-widest uppercase">
          <span className="text-[var(--red-faction)]">RED</span>
          <span className="text-[var(--text-muted)]"> vs </span>
          <span className="text-[var(--blue-faction)]">BLUE</span>
        </p>

        <a
          href="/handler/sign-in"
          className="py-4 px-12 rounded-lg font-bold text-lg tracking-wider uppercase cursor-pointer transition-all duration-200 border border-[var(--accent-gold)]/30 hover:border-[var(--accent-gold)] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] focus:ring-2 focus:ring-[var(--accent-gold)] outline-none"
          style={{
            fontFamily: "var(--font-display)",
            background: "linear-gradient(135deg, rgba(255,70,85,0.2), rgba(0,212,255,0.2))",
          }}
        >
          Enter the Arena
        </a>
      </div>
    </div>
  );
}
