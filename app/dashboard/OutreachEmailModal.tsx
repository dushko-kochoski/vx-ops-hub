"use client";

import { useMemo, useState } from "react";

type Lead = {
  id: string;
  first_name?: string | null;
  company?: string | null;
  email?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
};

export default function OutreachEmailModal({ open, onClose, lead }: Props) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const leadLabel = useMemo(() => {
    if (!lead) return "";
    const name = lead.first_name ? lead.first_name : "Lead";
    const company = lead.company ? ` • ${lead.company}` : "";
    return `${name}${company}`;
  }, [lead]);

  async function generate() {
    if (!lead) return;

    setLoading(true);
    setError(null);
    setSubject("");
    setBody("");

    try {
      const res = await fetch("/api/ai/outreach-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, tone: "neutral", goal: "book_call" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to generate email.");
        return;
      }

      setSubject(data.subject);
      setBody(data.body);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    const text = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">AI Outreach Email</h2>
            <p className="text-sm text-gray-600">{leadLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate"}
          </button>

          <button
            onClick={copyAll}
            disabled={!subject || !body}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            Copy
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Generated subject..."
              className="mt-1 w-full rounded-md border p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Generated email body..."
              rows={10}
              className="mt-1 w-full rounded-md border p-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tip: edit lightly for accuracy. Avoid adding claims you can’t verify.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
