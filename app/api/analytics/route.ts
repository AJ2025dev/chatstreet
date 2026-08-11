import { DEFAULT_CAMPAIGN, json } from "../../../lib/chatstreet";
import { hasSupabase, supabaseCount, supabaseRest } from "../../../lib/supabase";

export async function GET(request: Request) {
  const adminToken = process.env.CHATSTREET_ADMIN_TOKEN;
  if (!adminToken || request.headers.get("authorization") !== `Bearer ${adminToken}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabase(true)) {
    return json({ error: "Supabase admin configuration is unavailable" }, { status: 503 });
  }
  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaignId") || DEFAULT_CAMPAIGN.id;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const toExclusive = to && datePattern.test(to) ? new Date(`${to}T00:00:00.000Z`) : null;
  if (toExclusive) toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  try {
    const range = `${from && datePattern.test(from) ? `&created_at=gte.${from}T00:00:00.000Z` : ""}${toExclusive ? `&created_at=lt.${toExclusive.toISOString()}` : ""}`;
    const eventRange = `${from && datePattern.test(from) ? `&occurred_at=gte.${from}T00:00:00.000Z` : ""}${toExclusive ? `&occurred_at=lt.${toExclusive.toISOString()}` : ""}`;
    const filter = `campaign_id=eq.${encodeURIComponent(campaignId)}`;
    const [widgetLoads, trackedImpressions, engagedSessions, conversations, sponsoredMatches, ctaClicks, leads, recentResult, sessionResult, messageResult, deliveryResult] = await Promise.all([
      supabaseCount(`sessions?select=id&${filter}${range}`),
      supabaseCount(`sessions?select=id&${filter}&impression_id=not.is.null${range}`),
      supabaseCount(`events?select=id&${filter}&type=eq.engagement_start${eventRange}`),
      supabaseCount(`events?select=id&${filter}&type=eq.message_sent${eventRange}`),
      supabaseCount(`events?select=id&${filter}&type=eq.sponsored_match${eventRange}`),
      supabaseCount(`events?select=id&${filter}&type=eq.cta_click${eventRange}`),
      supabaseCount(`leads?select=id&${filter}${range}`),
      supabaseRest<unknown[]>(`events?select=id,session_id,type,intent,value,metadata,occurred_at&${filter}${eventRange}&order=occurred_at.desc&limit=20`, {}, { admin: true }),
      supabaseRest<unknown[]>(`sessions?select=id,publisher,placement_id,creative_id,line_item_id,demand_platform,page_url,page_title,impression_id,insertion_order_id,platform_publisher_id,site_id,auction_id,order_id,ad_unit_id,created_at&${filter}${range}&order=created_at.desc&limit=20`, {}, { admin: true }),
      supabaseRest<unknown[]>(`messages?select=id,session_id,role,intent,sponsored,model,latency_ms,created_at&${filter}${range}&order=created_at.desc&limit=20`, {}, { admin: true }),
      supabaseRest<Array<Record<string, unknown>>>(`sessions?select=id,publisher,placement_id,creative_id,line_item_id,demand_platform,impression_id,insertion_order_id,site_id,created_at&${filter}${range}&order=created_at.desc&limit=5000`, {}, { admin: true }),
    ]);
    const delivery = new Map<string, { date: string; platform: string; publisher: string; lineItemId: string; creativeId: string; placementId: string; insertionOrderId: string; siteId: string; widgetLoads: number; matchedImpressions: number }>();
    for (const row of deliveryResult.data) {
      const date = String(row.created_at || "").slice(0, 10);
      const platform = String(row.demand_platform || "direct");
      const publisher = String(row.publisher || "unknown");
      const lineItemId = String(row.line_item_id || "");
      const creativeId = String(row.creative_id || "");
      const placementId = String(row.placement_id || "");
      const insertionOrderId = String(row.insertion_order_id || "");
      const siteId = String(row.site_id || "");
      const key = [date, platform, publisher, lineItemId, creativeId, placementId, insertionOrderId, siteId].join("|");
      const item = delivery.get(key) || { date, platform, publisher, lineItemId, creativeId, placementId, insertionOrderId, siteId, widgetLoads: 0, matchedImpressions: 0 };
      item.widgetLoads += 1;
      if (row.impression_id) item.matchedImpressions += 1;
      delivery.set(key, item);
    }
    const reconciliation = [...delivery.values()];
    if (url.searchParams.get("format") === "csv") {
      const columns = ["date","platform","publisher","lineItemId","creativeId","placementId","insertionOrderId","siteId","widgetLoads","matchedImpressions"] as const;
      const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const csv = [columns.join(","), ...reconciliation.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="chatstreet-${campaignId}-reconciliation.csv"`, "Cache-Control": "no-store" } });
    }
    return json({
      summary: { widgetLoads, trackedImpressions, engagedSessions, conversations, sponsoredMatches, ctaClicks, leads },
      recent: recentResult.data,
      sessions: sessionResult.data,
      messages: messageResult.data,
      reconciliation,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Analytics unavailable" }, { status: 500 });
  }
}
