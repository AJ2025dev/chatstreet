import { DEFAULT_CAMPAIGN, campaignFromRow, cleanString, getCampaign, json } from "../../../lib/chatstreet";
import { hasSupabase, supabaseRest } from "../../../lib/supabase";

export function OPTIONS() {
  return json({});
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || DEFAULT_CAMPAIGN.id;
  return json({ campaign: await getCampaign(id) });
}

export async function POST(request: Request) {
  const adminToken = process.env.CHATSTREET_ADMIN_TOKEN;
  if (!adminToken || request.headers.get("authorization") !== `Bearer ${adminToken}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabase(true)) {
    return json({ error: "Supabase admin configuration is unavailable" }, { status: 503 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanString(body.id, 80) || DEFAULT_CAMPAIGN.id;
  const current = await getCampaign(id);
  const stringArray = (value: unknown, fallback: string) => {
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed.slice(0, 12).map(String) : JSON.parse(fallback);
    } catch {
      return JSON.parse(fallback);
    }
  };
  const payload = {
    id,
    name: cleanString(body.name, 160) || current.name,
    status: body.status === "paused" || body.status === "draft" ? body.status : "active",
    advertiser: cleanString(body.advertiser, 120) || current.advertiser,
    assistant_name: cleanString(body.assistantName, 80) || current.assistantName,
    welcome_message: cleanString(body.welcomeMessage, 600) || current.welcomeMessage,
    context: cleanString(body.context, 5000) || current.context,
    sponsor_brief: cleanString(body.sponsorBrief, 3000) || current.sponsorBrief,
    sponsor_label: cleanString(body.sponsorLabel, 80) || current.sponsorLabel,
    cta_label: cleanString(body.ctaLabel, 80) || current.ctaLabel,
    cta_url: cleanString(body.ctaUrl, 800) || current.ctaUrl,
    accent: cleanString(body.accent, 20) || current.accent,
    surface: cleanString(body.surface, 20) || current.surface,
    starter_prompts: stringArray(body.starterPrompts, current.starterPrompts),
    intent_rules: stringArray(body.intentRules, current.intentRules),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data } = await supabaseRest<any[]>("campaigns?on_conflict=id&select=*", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    }, { admin: true });
    return json({ campaign: data[0] ? campaignFromRow(data[0]) : null });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to save campaign" }, { status: 500 });
  }
}
