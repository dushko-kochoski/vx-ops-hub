"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Signing you in...");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) Implicit flow: tokens in hash (recommended for reliability)
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";

        if (hash) {
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

            // Remove tokens from URL
            window.history.replaceState({}, document.title, "/auth/callback");
            window.location.href = "/dashboard";
            return;
          }
        }

        // 2) PKCE flow: code in query
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const m = error.message || "";
            if (m.toLowerCase().includes("pkce code verifier")) {
              setMsg(
                "Auth error: This magic link was opened in a different browser/session. Please request a new magic link and open it in the same browser."
              );
              return;
            }
            setMsg("Auth error: " + error.message);
            return;
          }
          window.location.href = "/dashboard";
          return;
        }

        setMsg("Missing auth params. Please request a new magic link.");
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
