import { cleanString, json } from "../../../lib/chatstreet";
import { SupabaseError, supabaseRest } from "../../../lib/supabase";

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
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return json({ error: "sessionId must be a UUID" }, { status: 400 });
  }
  try {
    const timestamp = new Date().toISOString();
    try {
      await supabaseRest("sessions", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          id: sessionId,
          campaign_id: campaignId,
          publisher: cleanString(body.publisher, 160) || "unknown",
          placement_id: cleanString(body.placementId, 160) || null,
          creative_id: cleanString(body.creativeId, 160) || null,
          line_item_id: cleanString(body.lineItemId, 160) || null,
          impression_id: cleanString(body.impressionId, 240) || null,
          insertion_order_id: cleanString(body.insertionOrderId, 160) || null,
          platform_publisher_id: cleanString(body.publisherId, 160) || null,
          site_id: cleanString(body.siteId, 160) || null,
          auction_id: cleanString(body.auctionId, 240) || null,
          order_id: cleanString(body.orderId, 160) || null,
          ad_unit_id: cleanString(body.adUnitId, 240) || null,
          demand_platform: cleanString(body.demandPlatform, 40) || null,
          page_url: cleanString(body.pageUrl, 1200),
          page_title: cleanString(body.pageTitle, 300),
          created_at: timestamp,
          last_seen_at: timestamp,
        }),
      });
    } catch (error) {
      if (!(error instanceof SupabaseError) || error.code !== "23505") throw error;
    }
    await supabaseRest("events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        session_id: sessionId,
        campaign_id: campaignId,
        type,
        intent: cleanString(body.intent, 120) || null,
        value: typeof body.value === "number" ? body.value : null,
        metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
        occurred_at: timestamp,
      }),
    });
    return json({ ok: true }, { status: 201 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Event not stored" }, { status: 500 });
  }
}
