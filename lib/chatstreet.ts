import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { campaigns } from "../db/schema";

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

export async function getCampaign(id = DEFAULT_CAMPAIGN.id): Promise<Campaign> {
  try {
    const db = getDb();
    const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (row) return row as Campaign;
    await db.insert(campaigns).values(DEFAULT_CAMPAIGN).onConflictDoNothing();
    return DEFAULT_CAMPAIGN;
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
