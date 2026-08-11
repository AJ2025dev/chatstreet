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
  const campaignId = new URL(request.url).searchParams.get("campaignId") || DEFAULT_CAMPAIGN.id;
  try {
    const filter = `campaign_id=eq.${encodeURIComponent(campaignId)}`;
    const [sessions, conversations, sponsoredMatches, ctaClicks, leads, recentResult, sessionResult, messageResult] = await Promise.all([
      supabaseCount(`sessions?select=id&${filter}`),
      supabaseCount(`events?select=id&${filter}&type=eq.message_sent`),
      supabaseCount(`events?select=id&${filter}&type=eq.sponsored_match`),
      supabaseCount(`events?select=id&${filter}&type=eq.cta_click`),
      supabaseCount(`leads?select=id&${filter}`),
      supabaseRest<unknown[]>(`events?select=id,session_id,type,intent,value,metadata,occurred_at&${filter}&order=occurred_at.desc&limit=20`, {}, { admin: true }),
      supabaseRest<unknown[]>(`sessions?select=id,publisher,placement_id,creative_id,line_item_id,demand_platform,page_url,page_title,created_at&${filter}&order=created_at.desc&limit=20`, {}, { admin: true }),
      supabaseRest<unknown[]>(`messages?select=id,session_id,role,intent,sponsored,model,latency_ms,created_at&${filter}&order=created_at.desc&limit=20`, {}, { admin: true }),
    ]);
    return json({
      summary: { sessions, conversations, sponsoredMatches, ctaClicks, leads },
      recent: recentResult.data,
      sessions: sessionResult.data,
      messages: messageResult.data,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Analytics unavailable" }, { status: 500 });
  }
}
