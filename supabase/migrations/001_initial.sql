create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  price_weight int default 5 check (price_weight between 1 and 10),
  quality_weight int default 5 check (quality_weight between 1 and 10),
  ethics_weight int default 3 check (ethics_weight between 1 and 10),
  health_weight int default 5 check (health_weight between 1 and 10),
  speed_weight int default 5 check (speed_weight between 1 and 10),
  dietary text[] default '{}',
  budget text default 'mid' check (budget in ('budget','mid','premium')),
  distance_radius_km float default 8.0,
  avoid_chains boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  image_url text,
  item_name text not null,
  item_category text default 'other',
  score int check (score between 0 and 100),
  verdict text check (verdict in ('Buy','Skip','Go','Pass','Watch')),
  reasoning text,
  local_alternatives jsonb default '[]',
  online_alternatives jsonb default '[]',
  location_lat float,
  location_lng float,
  raw_response jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.scans enable row level security;

create policy "Users own their profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users own their preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

create policy "Users own their scans" on public.scans
  for all using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
