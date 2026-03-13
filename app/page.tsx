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
          className="text-5xl md:text-7xl font-bold tracking-wider text-center"
          style={{
            fontFamily: "var(--font-display)",
            textShadow: "0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.3)",
          }}
        >
          AGENT ARENA
        </h1>
        <p className="text-[var(--text-muted)] text-lg tracking-widest uppercase">
          Scan. Join. Battle.
        </p>

        <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-xl p-6 border border-white/10">
          <a
            href="/handler/sign-in"
            className="block w-full text-center py-3 px-6 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold cursor-pointer"
          >
            Sign In to Join
          </a>
        </div>
      </div>
    </div>
  );
}
