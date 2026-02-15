import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // ensures Node runtime (safe default for OpenAI SDK)

// ---- Validation ----
const BodySchema = z.object({
  leadId: z.string().uuid(),
  // Optional UI overrides (kept minimal):
  tone: z.enum(["neutral", "friendly", "direct"]).optional(),
  goal: z.enum(["book_call", "get_reply", "qualify"]).optional(),
});

// ---- Prompt Engineering (SDR outreach) ----
function buildSystemPrompt() {
  return [
    "You are an expert SDR at a modern B2B SaaS company.",
    "Write concise, high-quality cold outreach emails that feel human, specific, and credible.",
    "Rules:",
    "- Keep it 90–140 words total.",
    "- No hype, no exaggeration, no fake metrics, no pressure.",
    "- Use plain language. One clear CTA question.",
    "- Include a relevant personalization line ONLY if reliable lead context exists; otherwise omit it.",
    "- Avoid spam phrases (guarantee, free, act now, limited time).",
    "- Output JSON only with keys: subject, body.",
    "- The body must be ready to send (with greeting + sign-off).",
  ].join("\n");
}

function buildUserPrompt(params: {
  lead: any;
  tone: "neutral" | "friendly" | "direct";
  goal: "book_call" | "get_reply" | "qualify";
}) {
  const { lead, tone, goal } = params;

  // Adjust these field names to your actual schema:
  const firstName = lead.first_name ?? lead.firstName ?? "";
  const lastName = lead.last_name ?? lead.lastName ?? "";
  const fullName =
    (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (lead.name ?? "");
  const email = lead.email ?? "";
  const company = lead.company ?? lead.company_name ?? "";
  const title = lead.title ?? lead.role ?? "";
  const website = lead.website ?? "";
  const notes = lead.notes ?? lead.context ?? "";
  const stage = lead.stage ?? lead.status ?? "";

  const goalLine =
    goal === "book_call"
      ? "Goal: book a 15-minute intro call."
      : goal === "qualify"
      ? "Goal: ask 1–2 lightweight questions to qualify interest."
      : "Goal: get a simple reply to confirm relevance.";

  const toneLine =
    tone === "friendly"
      ? "Tone: friendly, confident, not salesy."
      : tone === "direct"
      ? "Tone: direct, crisp, executive-style."
      : "Tone: neutral, professional, calm.";

  return [
    "Write a short outreach email for this lead.",
    goalLine,
    toneLine,
    "",
    "Lead context (may be incomplete):",
    `- Name: ${fullName || "(unknown)"}`,
    `- Email: ${email || "(unknown)"}`,
    `- Company: ${company || "(unknown)"}`,
    `- Title/Role: ${title || "(unknown)"}`,
    `- Website: ${website || "(unknown)"}`,
    `- Stage: ${stage || "(unknown)"}`,
    `- Notes: ${notes || "(none)"}`,
    "",
    "Constraints:",
    "- If name is unknown, use 'Hi there,'. If name is known, use first name only.",
    "- Do NOT invent details about the company or role. If missing, stay generic but still valuable.",
    "- Keep it specific to common B2B SaaS value without naming a product unless notes provide it.",
    "",
    "Return JSON only: {\"subject\":\"...\",\"body\":\"...\"}",
  ].join("\n");
}

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

// ---- Route Handler ----
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return jsonError("Server misconfigured: missing OPENAI_API_KEY", 500);
    }

    // Optional: Basic Origin check (helps prevent cross-site abuse in some setups)
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      // If you use custom domains / preview URLs, you may want a more flexible allowlist.
      return jsonError("Invalid origin.", 403);
    }

    const body = BodySchema.parse(await req.json());
    const tone = body.tone ?? "neutral";
    const goal = body.goal ?? "book_call";

    // Auth (Supabase session from cookies)
    const supabase = createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return jsonError("Unauthorized.", 401);
    }

    // Fetch lead via RLS-protected query (best practice: rely on RLS here)
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", body.leadId)
      .single();

    if (leadError || !lead) {
      // Don’t leak whether the UUID exists if not accessible
      return jsonError("Lead not found.", 404);
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Generate email
    const response = await openai.chat.completions.create({
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: buildUserPrompt({ lead, tone, goal }),
        },
      ],
      response_format: { type: "json_object" }, // OpenAI SDK supports structured JSON output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return jsonError("AI response was empty.", 502);

    let parsed: { subject?: string; body?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonError("AI returned invalid JSON.", 502, { raw: content });
    }

    const subject = (parsed.subject ?? "").trim();
    const emailBody = (parsed.body ?? "").trim();

    if (!subject || !emailBody) {
      return jsonError("AI response missing subject/body.", 502, { parsed });
    }

    return NextResponse.json({
      subject,
      body: emailBody,
      leadId: body.leadId,
      model,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError("Invalid request body.", 400, err.flatten());
    }

    // Avoid leaking internals in production; log server-side
    console.error("AI outreach-email error:", err);
    return jsonError("Unexpected server error.", 500);
  }
}
