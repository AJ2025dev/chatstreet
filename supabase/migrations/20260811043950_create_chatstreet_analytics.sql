create extension if not exists pgcrypto;

create table public.campaigns (
  id text primary key check (char_length(id) between 1 and 80),
  name text not null check (char_length(name) <= 160),
  status text not null default 'active' check (status in ('active','paused','draft')),
  advertiser text not null check (char_length(advertiser) <= 120),
  assistant_name text not null default 'Ask this page' check (char_length(assistant_name) <= 80),
  welcome_message text not null check (char_length(welcome_message) <= 600),
  context text not null check (char_length(context) <= 5000),
  sponsor_brief text not null check (char_length(sponsor_brief) <= 3000),
  sponsor_label text not null default 'Sponsored match' check (char_length(sponsor_label) <= 80),
  cta_label text not null check (char_length(cta_label) <= 80),
  cta_url text not null check (char_length(cta_url) <= 800),
  accent text not null default '#d9ff63' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  surface text not null default '#173f32' check (surface ~ '^#[0-9A-Fa-f]{6}$'),
  starter_prompts jsonb not null default '[]'::jsonb check (jsonb_typeof(starter_prompts) = 'array'),
  intent_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(intent_rules) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.campaigns(id) on update cascade on delete restrict,
  publisher text not null default 'unknown' check (char_length(publisher) <= 160),
  placement_id text check (placement_id is null or char_length(placement_id) <= 160),
  creative_id text check (creative_id is null or char_length(creative_id) <= 160),
  line_item_id text check (line_item_id is null or char_length(line_item_id) <= 160),
  demand_platform text check (demand_platform is null or char_length(demand_platform) <= 40),
  page_url text not null default '' check (char_length(page_url) <= 1200),
  page_title text not null default '' check (char_length(page_title) <= 300),
  consent_status text not null default 'unknown' check (consent_status in ('unknown','granted','denied','not_required')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  campaign_id text not null references public.campaigns(id) on update cascade on delete restrict,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  intent text check (intent is null or char_length(intent) <= 120),
  sponsored boolean not null default false,
  model text check (model is null or char_length(model) <= 80),
  latency_ms integer check (latency_ms is null or latency_ms between 0 and 300000),
  created_at timestamptz not null default now()
);

create table public.events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  campaign_id text not null references public.campaigns(id) on update cascade on delete restrict,
  type text not null check (char_length(type) between 1 and 80),
  intent text check (intent is null or char_length(intent) <= 120),
  value double precision,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 16384),
  occurred_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete restrict,
  campaign_id text not null references public.campaigns(id) on update cascade on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  contact text not null check (char_length(contact) between 1 and 180),
  city text not null default '' check (char_length(city) <= 120),
  intent text not null default '' check (char_length(intent) <= 240),
  consent boolean not null check (consent = true),
  created_at timestamptz not null default now()
);

create index sessions_campaign_created_idx on public.sessions (campaign_id, created_at desc);
create index sessions_publisher_created_idx on public.sessions (publisher, created_at desc);
create index events_campaign_occurred_idx on public.events (campaign_id, occurred_at desc);
create index events_session_occurred_idx on public.events (session_id, occurred_at);
create index events_campaign_type_occurred_idx on public.events (campaign_id, type, occurred_at desc);
create index messages_session_created_idx on public.messages (session_id, created_at);
create index messages_campaign_created_idx on public.messages (campaign_id, created_at desc);
create index leads_campaign_created_idx on public.leads (campaign_id, created_at desc);

alter table public.campaigns enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;
alter table public.leads enable row level security;

revoke all on table public.campaigns, public.sessions, public.messages, public.events, public.leads from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on table public.campaigns to anon, authenticated;
grant insert on table public.sessions, public.messages, public.events, public.leads to anon, authenticated;
grant usage, select on sequence public.messages_id_seq, public.events_id_seq to anon, authenticated;
grant all on table public.campaigns, public.sessions, public.messages, public.events, public.leads to service_role;
grant usage, select on sequence public.messages_id_seq, public.events_id_seq to service_role;

create policy campaigns_public_active_read on public.campaigns for select to anon, authenticated using (status = 'active');
create policy sessions_public_insert on public.sessions for insert to anon, authenticated with check (campaign_id <> '' and publisher <> '');
create policy messages_public_insert on public.messages for insert to anon, authenticated with check (campaign_id <> '' and content <> '');
create policy events_public_insert on public.events for insert to anon, authenticated with check (campaign_id <> '' and type <> '');
create policy leads_public_insert on public.leads for insert to anon, authenticated with check (campaign_id <> '' and consent = true);

insert into public.campaigns (
  id, name, status, advertiser, assistant_name, welcome_message, context,
  sponsor_brief, sponsor_label, cta_label, cta_url, accent, surface, starter_prompts, intent_rules
) values (
  'aera-x-2026', 'Aera X · Contextual consideration', 'active', 'Aera X', 'Ask this page',
  'I’ve read this page. Ask me anything about cleaner city travel, EV ownership, charging, or costs.',
  'This publisher article explains how urban drivers should evaluate electric vehicles using real daily distance, home charging access, intercity travel and five-year ownership cost.',
  'Aera X is a premium electric SUV with 410 km certified range, an 8-year battery warranty, home charger assessment and personalised five-year cost comparison. Only recommend it when the user''s declared intent is genuinely relevant. Never invent prices or availability.',
  'Sponsored match', 'Book a test drive', 'https://example.com/aera-x', '#d9ff63', '#173f32',
  '["Is an EV practical for my daily commute?","How much range do I actually need?","Compare running costs with petrol"]'::jsonb,
  '["daily commute","EV range","charging","running cost","finance","test drive"]'::jsonb
);

create or replace function public.touch_campaign_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_campaign_updated_at() from public, anon, authenticated;
grant execute on function public.touch_campaign_updated_at() to service_role;
create trigger campaigns_touch_updated_at before update on public.campaigns
for each row execute function public.touch_campaign_updated_at();
