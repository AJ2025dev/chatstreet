import { hasSupabase, supabaseRest } from "./supabase";

export const DEFAULT_CAMPAIGN = {
  id: "aera-x-2026",
  name: "Aera X · Contextual consideration",
  status: "active",
  advertiser: "Aera X",
  assistantName: "Ask this page",
  welcomeMessage:
    "I’ve read this page. Ask me anything about cleaner city travel, EV ownership, charging, or costs.",
  context:
    "This publisher article explains how urban drivers should evaluate electric vehicles using real daily distance, home charging access, intercity travel and five-year ownership cost.",
  sponsorBrief:
    "Aera X is a premium electric SUV with 410 km certified range, an 8-year battery warranty, home charger assessment and personalised five-year cost comparison. Only recommend it when the user's declared intent is genuinely relevant. Never invent prices or availability.",
  sponsorLabel: "Sponsored match",
  ctaLabel: "Book a test drive",
  ctaUrl: "https://example.com/aera-x",
  accent: "#d9ff63",
  surface: "#173f32",
  starterPrompts: JSON.stringify([
    "Is an EV practical for my daily commute?",
    "How much range do I actually need?",
    "Compare running costs with petrol",
  ]),
  intentRules: JSON.stringify([
    "daily commute",
    "EV range",
    "charging",
    "running cost",
    "finance",
    "test drive",
  ]),
};

export type Campaign = typeof DEFAULT_CAMPAIGN;

type CampaignRow = {
  id: string; name: string; status: string; advertiser: string;
  assistant_name: string; welcome_message: string; context: string;
  sponsor_brief: string; sponsor_label: string; cta_label: string;
  cta_url: string; accent: string; surface: string;
  starter_prompts: unknown; intent_rules: unknown;
  created_at: string; updated_at: string;
};

export function campaignFromRow(row: CampaignRow): Campaign {
  return {
    id: row.id, name: row.name, status: row.status, advertiser: row.advertiser,
    assistantName: row.assistant_name, welcomeMessage: row.welcome_message,
    context: row.context, sponsorBrief: row.sponsor_brief, sponsorLabel: row.sponsor_label,
    ctaLabel: row.cta_label, ctaUrl: row.cta_url, accent: row.accent, surface: row.surface,
    starterPrompts: JSON.stringify(row.starter_prompts || []),
    intentRules: JSON.stringify(row.intent_rules || []),
  };
}

export async function getCampaign(id = DEFAULT_CAMPAIGN.id): Promise<Campaign> {
  if (!hasSupabase()) return DEFAULT_CAMPAIGN;
  try {
    const { data } = await supabaseRest<CampaignRow[]>(`campaigns?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    return data[0] ? campaignFromRow(data[0]) : DEFAULT_CAMPAIGN;
  } catch {
    return DEFAULT_CAMPAIGN;
  }
}

export function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || (
    globalThis as unknown as {
      __CHATSTREET_ENV__?: Record<string, string | undefined>;
    }
  ).__CHATSTREET_ENV__?.OPENAI_API_KEY;
}

export function getModel() {
  return process.env.OPENAI_MODEL || (
    globalThis as unknown as {
      __CHATSTREET_ENV__?: Record<string, string | undefined>;
    }
  ).__CHATSTREET_ENV__?.OPENAI_MODEL || "gpt-5.6-terra";
}

export function cors(headers: HeadersInit = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    ...headers,
  };
}

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: cors(init.headers),
  });
}

export function cleanString(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
