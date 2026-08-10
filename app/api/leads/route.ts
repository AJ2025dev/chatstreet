import { getDb } from "../../../db";
import { leads } from "../../../db/schema";
import { cleanString, json } from "../../../lib/chatstreet";

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
    const db = getDb();
    const [lead] = await db
      .insert(leads)
      .values({
        sessionId: cleanString(body.sessionId, 120),
        campaignId: cleanString(body.campaignId, 80),
        name,
        contact,
        city: cleanString(body.city, 120),
        intent: cleanString(body.intent, 240),
        consent: true,
      })
      .returning({ id: leads.id });
    return json({ ok: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Lead not stored" }, { status: 500 });
  }
}
