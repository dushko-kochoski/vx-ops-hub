// app/login/LoginForm.tsx (example)
"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr"; // or your existing client util

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (cooldown > 0) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("rate") || m.includes("too many") || m.includes("limit")) {
        setErr("Email sending is temporarily limited. Try again in a few minutes.");
      } else {
        setErr(error.message);
      }
      return;
    }

    setMsg("Magic link sent. Check your inbox (and spam).");
    setCooldown(60);
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="w-full border p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="you@company.com"
        required
      />

      <button
        className="w-full rounded bg-black text-white p-2 disabled:opacity-50"
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Wait ${cooldown}s` : "Send magic link"}
      </button>

      {msg && <p className="text-sm">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
