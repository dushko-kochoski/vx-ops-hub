"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [status, setStatus] = useState("Checking Supabase connection...");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus("❌ Supabase error: " + error.message);
        return;
      }
      setStatus("✅ Supabase connected. Session: " + (data.session ? "active" : "none"));
    })();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">VX Ops Hub</h1>
      <p className="mt-3 text-lg">{status}</p>
    </main>
  );
}
