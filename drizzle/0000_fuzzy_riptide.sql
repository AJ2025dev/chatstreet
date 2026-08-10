CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`advertiser` text NOT NULL,
	`assistant_name` text DEFAULT 'Ask this page' NOT NULL,
	`welcome_message` text NOT NULL,
	`context` text NOT NULL,
	`sponsor_brief` text NOT NULL,
	`sponsor_label` text DEFAULT 'Sponsored match' NOT NULL,
	`cta_label` text NOT NULL,
	`cta_url` text NOT NULL,
	`accent` text DEFAULT '#d9ff63' NOT NULL,
	`surface` text DEFAULT '#173f32' NOT NULL,
	`starter_prompts` text NOT NULL,
	`intent_rules` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`type` text NOT NULL,
	`intent` text,
	`value` real,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`intent` text DEFAULT '' NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`publisher` text DEFAULT 'unknown' NOT NULL,
	`page_url` text DEFAULT '' NOT NULL,
	`page_title` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
