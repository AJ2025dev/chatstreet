import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { campaigns } from "../../../db/schema";
import { DEFAULT_CAMPAIGN, cleanString, getCampaign, json } from "../../../lib/chatstreet";

export function OPTIONS() {
  return json({});
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || DEFAULT_CAMPAIGN.id;
  return json({ campaign: await getCampaign(id) });
}

export async function POST(request: Request) {
  const adminToken = process.env.CHATSTREET_ADMIN_TOKEN;
  const authorization = request.headers.get("authorization");
  if (!adminToken || authorization !== `Bearer ${adminToken}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanString(body.id, 80) || DEFAULT_CAMPAIGN.id;
  const current = await getCampaign(id);
  const update = {
    name: cleanString(body.name, 160) || current.name,
    status: body.status === "paused" ? "paused" : "active",
    advertiser: cleanString(body.advertiser, 120) || current.advertiser,
    assistantName: cleanString(body.assistantName, 80) || current.assistantName,
    welcomeMessage: cleanString(body.welcomeMessage, 600) || current.welcomeMessage,
    context: cleanString(body.context, 5000) || current.context,
    sponsorBrief: cleanString(body.sponsorBrief, 3000) || current.sponsorBrief,
    sponsorLabel: cleanString(body.sponsorLabel, 80) || current.sponsorLabel,
    ctaLabel: cleanString(body.ctaLabel, 80) || current.ctaLabel,
    ctaUrl: cleanString(body.ctaUrl, 800) || current.ctaUrl,
    accent: cleanString(body.accent, 20) || current.accent,
    surface: cleanString(body.surface, 20) || current.surface,
    starterPrompts:
      typeof body.starterPrompts === "string" ? body.starterPrompts : current.starterPrompts,
    intentRules: typeof body.intentRules === "string" ? body.intentRules : current.intentRules,
    updatedAt: new Date().toISOString(),
  };
  try {
    const db = getDb();
    await db
      .insert(campaigns)
      .values({ ...DEFAULT_CAMPAIGN, ...update, id })
      .onConflictDoUpdate({ target: campaigns.id, set: update });
    const [saved] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return json({ campaign: saved });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to save campaign" }, { status: 500 });
  }
}
