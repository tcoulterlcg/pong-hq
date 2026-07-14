-- Smack talk board table. Run in the Supabase SQL editor (project oqdgskpjinbyktwuzilf).
-- RLS stays ON with no policies: the app reads/writes exclusively through the
-- server-side service role, so nothing is exposed to anon clients.
create table if not exists pong_messages (
  id uuid primary key default gen_random_uuid(),
  author_id text not null,
  author_name text not null,
  target_id text,
  target_name text,
  body text not null check (char_length(body) <= 280),
  created_at timestamptz not null default now()
);
alter table pong_messages enable row level security;
