import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { events, leads, sessions } from "../../../db/schema";
import { DEFAULT_CAMPAIGN, json } from "../../../lib/chatstreet";

export async function GET(request: Request) {
  const campaignId = new URL(request.url).searchParams.get("campaignId") || DEFAULT_CAMPAIGN.id;
  try {
    const db = getDb();
    const [summary] = await db
      .select({
        sessions: sql<number>`count(distinct ${sessions.id})`,
        conversations: sql<number>`count(distinct case when ${events.type} = 'message_sent' then ${events.sessionId} end)`,
        sponsoredMatches: sql<number>`sum(case when ${events.type} = 'sponsored_match' then 1 else 0 end)`,
        ctaClicks: sql<number>`sum(case when ${events.type} = 'cta_click' then 1 else 0 end)`,
      })
      .from(sessions)
      .leftJoin(events, sql`${events.sessionId} = ${sessions.id}`)
      .where(sql`${sessions.campaignId} = ${campaignId}`);
    const [leadCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(sql`${leads.campaignId} = ${campaignId}`);
    const recent = await db
      .select()
      .from(events)
      .where(sql`${events.campaignId} = ${campaignId}`)
      .orderBy(sql`${events.createdAt} desc`)
      .limit(20);
    return json({ summary: { ...summary, leads: leadCount.count }, recent });
  } catch {
    return json({
      summary: { sessions: 0, conversations: 0, sponsoredMatches: 0, ctaClicks: 0, leads: 0 },
      recent: [],
    });
  }
}
