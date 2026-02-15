"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Signing you in...");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // Server route GET /api/auth/callback handles ?code= for PKCE; failures redirect here with ?error=auth
        const authError = url.searchParams.get("error");
        if (authError === "auth") {
          setMsg(
            "Sign-in failed. The link may have expired or been used. Try requesting a new magic link."
          );
          return;
        }

        // 1) If Supabase returns code in query (PKCE) - fallback client exchange only if server didn't redirect
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg("Auth error: " + error.message);
            return;
          }
          window.location.href = "/dashboard";
          return;
        }

        // 2) If Supabase returns tokens in the hash (implicit flow)
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";

        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            setMsg("Auth error: " + error.message);
            return;
          }

          // Clean the URL (optional but nice)
          window.history.replaceState({}, document.title, "/auth/callback");
          window.location.href = "/dashboard";
          return;
        }

        // 3) Nothing usable found
        setMsg(
          "Missing auth params (no code and no tokens). Please request a new magic link."
        );
      } catch (e: any) {
        setMsg("Callback error: " + (e?.message ?? "Unknown"));
      }
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
