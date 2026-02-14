"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Signing you in...");

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (!code) {
        setMsg("Missing code. Please request a new magic link.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMsg("Auth error: " + error.message);
        return;
      }

      window.location.href = "/dashboard";
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-xl border p-6 max-w-md w-full">
        <h1 className="text-xl font-semibold">VX Ops Hub</h1>
        <p className="mt-2 text-sm opacity-80">{msg}</p>
      </div>
    </main>
  );
}
