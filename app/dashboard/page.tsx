"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lead = {
  id: string;
  created_at: string;
  company: string;
  contact_name: string | null;
  email: string | null;
  source: string | null;
  stage: string;
  owner: string | null;
};

const STAGES = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");

  const loadLeads = async () => {
    setError(null);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("❌ " + error.message);
      return;
    }
    setLeads((data ?? []) as Lead[]);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email ?? "");
      await loadLeads();
      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const createLead = async () => {
    setError(null);
    if (!company.trim()) {
      setError("❌ Company is required.");
      return;
    }

    const { error } = await supabase.from("leads").insert({
      company: company.trim(),
      contact_name: contactName.trim() || null,
      email: email.trim() || null,
      source: source.trim() || null,
      stage: "New",
    });

    if (error) {
      setError("❌ " + error.message);
      return;
    }

    setCompany("");
    setContactName("");
    setEmail("");
    setSource("");
    await loadLeads();
  };

  const updateStage = async (id: string, stage: string) => {
    setError(null);

    const { error } = await supabase.from("leads").update({ stage }).eq("id", id);

    if (error) {
      setError("❌ " + error.message);
      return;
    }

    // update UI instantly
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">VX Ops Hub</h1>
          <p className="mt-1 text-sm opacity-80">Signed in as: <b>{userEmail}</b></p>
        </div>
        <button className="rounded-lg border px-3 py-2" onClick={signOut}>
          Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Create Lead */}
        <section className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Add Lead</h2>

          <div className="mt-4 grid gap-3">
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Company *"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Source (Website / LinkedIn / Referral)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />

            <button
              className="mt-2 w-full rounded-lg bg-black px-3 py-2 text-white disabled:opacity-60"
              onClick={createLead}
              disabled={!company.trim()}
            >
              Create lead
            </button>
          </div>
        </section>

        {/* Leads List */}
        <section className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Leads</h2>
          <p className="mt-1 text-sm opacity-80">
            Your leads are protected by Supabase RLS (only you can see them).
          </p>

          {error && <p className="mt-3 text-sm">{error}</p>}

          <div className="mt-4 space-y-3">
            {leads.length === 0 ? (
              <p className="text-sm opacity-70">No leads yet. Add your first one.</p>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{lead.company}</div>
                      <div className="text-sm opacity-80">
                        {lead.contact_name ?? "—"} · {lead.email ?? "—"}
                      </div>
                      <div className="mt-1 text-xs opacity-70">
                        Source: {lead.source ?? "—"}
                      </div>
                    </div>

                    <select
                      className="rounded-lg border px-2 py-1"
                      value={lead.stage}
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
