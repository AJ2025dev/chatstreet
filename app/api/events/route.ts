import { getDb } from "../../../db";
import { events, sessions } from "../../../db/schema";
import { cleanString, json } from "../../../lib/chatstreet";

export function OPTIONS() {
  return json({});
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const sessionId = cleanString(body.sessionId, 120);
  const campaignId = cleanString(body.campaignId, 80);
  const type = cleanString(body.type, 80);
  if (!sessionId || !campaignId || !type) {
    return json({ error: "sessionId, campaignId and type are required" }, { status: 400 });
  }
  try {
    const db = getDb();
    const timestamp = new Date().toISOString();
    await db
      .insert(sessions)
      .values({
        id: sessionId,
        campaignId,
        publisher: cleanString(body.publisher, 160) || "unknown",
        pageUrl: cleanString(body.pageUrl, 1000),
        pageTitle: cleanString(body.pageTitle, 300),
        createdAt: timestamp,
        lastSeenAt: timestamp,
      })
      .onConflictDoUpdate({ target: sessions.id, set: { lastSeenAt: timestamp } });
    await db.insert(events).values({
      sessionId,
      campaignId,
      type,
      intent: cleanString(body.intent, 120) || null,
      value: typeof body.value === "number" ? body.value : null,
      metadata: JSON.stringify(body.metadata || {}),
    });
    return json({ ok: true }, { status: 201 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Event not stored" }, { status: 500 });
  }
}
