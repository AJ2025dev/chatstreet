alter table public.sessions
  add column if not exists impression_id text check (impression_id is null or char_length(impression_id) <= 240),
  add column if not exists insertion_order_id text check (insertion_order_id is null or char_length(insertion_order_id) <= 160),
  add column if not exists platform_publisher_id text check (platform_publisher_id is null or char_length(platform_publisher_id) <= 160),
  add column if not exists site_id text check (site_id is null or char_length(site_id) <= 160),
  add column if not exists auction_id text check (auction_id is null or char_length(auction_id) <= 240),
  add column if not exists order_id text check (order_id is null or char_length(order_id) <= 160),
  add column if not exists ad_unit_id text check (ad_unit_id is null or char_length(ad_unit_id) <= 240);

create index if not exists sessions_delivery_dimensions_idx
  on public.sessions (campaign_id, demand_platform, line_item_id, creative_id, created_at desc);
create index if not exists sessions_platform_impression_idx
  on public.sessions (demand_platform, impression_id)
  where impression_id is not null and impression_id <> '';
