import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type Payload = {
  leadId?: string;
  eventId?: string;
  stage?: string;
};

export async function POST(req: Request) {
  // 1) Parse body safely
  let body: Payload = {};
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { leadId, eventId, stage } = body;

  if (!leadId || !eventId) {
    return NextResponse.json(
      { error: "leadId and eventId are required" },
      { status: 400 }
    );
  }

  if (stage && stage !== "Qualified") {
    return NextResponse.json(
      { error: 'stage must be "Qualified" (or omit it)' },
      { status: 400 }
    );
  }

  // 2) Create Supabase server client (uses cookies for auth session)
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from a context that cannot set cookies
          }
        },
      },
    }
  );

  // 3) Require authenticated user
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = authData.user.id;

  // 4) Fetch lead and verify ownership
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, user_id, stage, qualified_event_id")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // If your column is named "owner" instead of "user_id", change this check accordingly.
  if (lead.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5) Idempotency: if already qualified (event id exists), don't enqueue again
  // Note: your client update sets qualified_event_id. This prevents duplicates.
  if (lead.qualified_event_id && lead.qualified_event_id !== eventId) {
    return NextResponse.json({
      ok: true,
      status: "already_handled",
      qualified_event_id: lead.qualified_event_id,
    });
  }

  // 6) Enqueue job (this is our "robust automation" layer)
  const { error: jobErr } = await supabase.from("automation_jobs").insert({
    user_id: userId,
    lead_id: leadId,
    type: "LEAD_QUALIFIED_AI_INSIGHTS",
    status: "pending",
  });

  if (jobErr) {
    // Still log the attempt
    console.error("❌ Failed to enqueue job:", jobErr);
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  // 7) Audit log (nice for UI + interviews)
  const { error: eventErr } = await supabase.from("automation_events").insert({
    user_id: userId,
    lead_id: leadId,
    event_type: "LEAD_QUALIFIED_ENQUEUED",
    payload: { eventId },
  });

  if (eventErr) {
    // Not fatal (job is already queued), just log it
    console.warn("⚠️ Failed to insert automation event:", eventErr);
  }

  console.log("✅ Lead qualified: job queued", { leadId, eventId, userId });

  return NextResponse.json({ ok: true, status: "queued", eventId });
}
