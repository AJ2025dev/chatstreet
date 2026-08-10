import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  advertiser: text("advertiser").notNull(),
  assistantName: text("assistant_name").notNull().default("Ask this page"),
  welcomeMessage: text("welcome_message").notNull(),
  context: text("context").notNull(),
  sponsorBrief: text("sponsor_brief").notNull(),
  sponsorLabel: text("sponsor_label").notNull().default("Sponsored match"),
  ctaLabel: text("cta_label").notNull(),
  ctaUrl: text("cta_url").notNull(),
  accent: text("accent").notNull().default("#d9ff63"),
  surface: text("surface").notNull().default("#173f32"),
  starterPrompts: text("starter_prompts").notNull(),
  intentRules: text("intent_rules").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  publisher: text("publisher").notNull().default("unknown"),
  pageUrl: text("page_url").notNull().default(""),
  pageTitle: text("page_title").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  campaignId: text("campaign_id").notNull(),
  type: text("type").notNull(),
  intent: text("intent"),
  value: real("value"),
  metadata: text("metadata").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  campaignId: text("campaign_id").notNull(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  city: text("city").notNull().default(""),
  intent: text("intent").notNull().default(""),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
