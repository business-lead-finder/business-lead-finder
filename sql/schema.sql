-- Run this in the Supabase SQL editor

create table businesses (
  id uuid default gen_random_uuid() primary key,
  place_id text unique,
  name text,
  address text,
  zip text,
  category text,
  phone text,
  website text,
  rating numeric,
  rating_count integer,
  created_at timestamp default now()
);

create table contacts (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references businesses(id) on delete cascade,
  name text,
  email text,
  phone text,
  source_url text,
  confidence text, -- 'high' | 'medium' | 'low'
  created_at timestamp default now()
);

-- The anon key is exposed in the browser, so RLS must be on.
alter table businesses enable row level security;
alter table contacts enable row level security;

-- Permissive policy for a single-user/internal tool.
-- Tighten this (e.g. scope by user_id) before opening this up to other users.
create policy "Allow all for now" on businesses for all using (true) with check (true);
create policy "Allow all for now" on contacts for all using (true) with check (true);
