import { cleanString, json } from "../../../lib/chatstreet";
import { supabaseRest } from "../../../lib/supabase";

export function OPTIONS() {
  return json({});
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const name = cleanString(body.name, 120);
  const contact = cleanString(body.contact, 180);
  if (!name || !contact || body.consent !== true) {
    return json({ error: "Name, contact and consent are required" }, { status: 400 });
  }
  try {
    const { data } = await supabaseRest<Array<{ id: string }>>("leads?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        session_id: cleanString(body.sessionId, 120),
        campaign_id: cleanString(body.campaignId, 80),
        name,
        contact,
        city: cleanString(body.city, 120),
        intent: cleanString(body.intent, 240),
        consent: true,
      }),
    });
    return json({ ok: true, leadId: data[0]?.id }, { status: 201 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Lead not stored" }, { status: 500 });
  }
}
