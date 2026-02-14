"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async () => {
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setStatus("❌ " + error.message);
    else setStatus("✅ Check your email for the login link.");

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border p-6">
        <h1 className="text-2xl font-bold">VX Ops Hub — Login</h1>
        <p className="mt-2 text-sm opacity-80">
          Enter your email to receive a magic login link.
        </p>

        <input
          className="mt-4 w-full rounded-lg border px-3 py-2"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="mt-4 w-full rounded-lg bg-black text-white px-3 py-2 disabled:opacity-60"
          disabled={!email || loading}
          onClick={sendMagicLink}
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>

        {status && <p className="mt-4 text-sm">{status}</p>}
      </div>
    </main>
  );
}
