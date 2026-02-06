-- Profiles table for language partner matching
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interests text[] not null default '{}',
  level text not null check (level in ('beginner','intermediate','advanced')),
  target_language text not null,
  native_language text not null,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS and restrict access to the owner
alter table profiles enable row level security;

create policy if not exists "Users can select own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete own profile"
  on profiles for delete
  using (auth.uid() = user_id);
