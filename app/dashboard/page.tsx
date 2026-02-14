"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      if (!data.user) {
        window.location.href = "/login";
      }
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button className="rounded-lg border px-3 py-2" onClick={signOut}>
          Sign out
        </button>
      </div>

      <p className="mt-4">Signed in as: <b>{email || "..."}</b></p>

      <div className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Next step</h2>
        <p className="mt-2 opacity-80">
          We’ll add lead creation + lead list here.
        </p>
      </div>
    </main>
  );
}
