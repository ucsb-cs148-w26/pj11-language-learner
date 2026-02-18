-- ============================================================================
-- Friends + Friend Requests (Tables + RLS)
-- ============================================================================
-- Run this in your Supabase SQL Editor to create friend_requests + friends tables
-- and apply all required RLS policies, constraints, and indexes.
-- ============================================================================

create extension if not exists pgcrypto;
-- ----------------------------------------------------------------------------
-- STEP 1: Create friend_requests table
-- ----------------------------------------------------------------------------
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'denied', 'canceled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz null,
  updated_at timestamptz not null default now(),
  constraint friend_requests_no_self_request check (requester_id <> recipient_id)
);

create index if not exists friend_requests_requester_idx on public.friend_requests (requester_id);
create index if not exists friend_requests_recipient_idx on public.friend_requests (recipient_id);
create index if not exists friend_requests_status_idx on public.friend_requests (status);

-- Allow only one pending request per pair (A->B or B->A)
create unique index if not exists friend_requests_one_pending_per_pair
on public.friend_requests (
  least(requester_id, recipient_id),
  greatest(requester_id, recipient_id)
)
where status = 'pending';


-- ----------------------------------------------------------------------------
-- STEP 2: Create friends table (canonical pair: user_low < user_high)
-- ----------------------------------------------------------------------------
create table if not exists public.friends (
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friends_no_self check (user_low <> user_high),
  constraint friends_pk primary key (user_low, user_high)
);

create index if not exists friends_user_low_idx on public.friends (user_low);
create index if not exists friends_user_high_idx on public.friends (user_high);


-- ----------------------------------------------------------------------------
-- STEP 3: Triggers for timestamps (recommended)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_friend_requests_set_updated_at on public.friend_requests;
create trigger trg_friend_requests_set_updated_at
before update on public.friend_requests
for each row execute function public.set_updated_at();

create or replace function public.set_responded_at_on_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('accepted', 'denied', 'canceled') then
      new.responded_at = coalesce(new.responded_at, now());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_friend_requests_set_responded_at on public.friend_requests;
create trigger trg_friend_requests_set_responded_at
before update on public.friend_requests
for each row execute function public.set_responded_at_on_status_change();


-- ----------------------------------------------------------------------------
-- STEP 4: Enable RLS
-- ----------------------------------------------------------------------------
alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;


-- ----------------------------------------------------------------------------
-- STEP 5: RLS policies for friend_requests
-- ----------------------------------------------------------------------------
drop policy if exists "friend_requests_select_outgoing" on public.friend_requests;
create policy "friend_requests_select_outgoing"
on public.friend_requests
for select
to authenticated
using (requester_id = auth.uid());

drop policy if exists "friend_requests_select_incoming" on public.friend_requests;
create policy "friend_requests_select_incoming"
on public.friend_requests
for select
to authenticated
using (recipient_id = auth.uid());

drop policy if exists "friend_requests_insert_requester_only" on public.friend_requests;
create policy "friend_requests_insert_requester_only"
on public.friend_requests
for insert
to authenticated
with check (
  requester_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "friend_requests_update_recipient_accept_deny" on public.friend_requests;
create policy "friend_requests_update_recipient_accept_deny"
on public.friend_requests
for update
to authenticated
using (recipient_id = auth.uid() and status = 'pending')
with check (
  recipient_id = auth.uid()
  and status in ('accepted', 'denied')
);

drop policy if exists "friend_requests_update_requester_cancel" on public.friend_requests;
create policy "friend_requests_update_requester_cancel"
on public.friend_requests
for update
to authenticated
using (requester_id = auth.uid() and status = 'pending')
with check (
  requester_id = auth.uid()
  and status = 'canceled'
);


-- ----------------------------------------------------------------------------
-- STEP 6: RLS policy for friends (read-only from client)
-- ----------------------------------------------------------------------------
drop policy if exists "friends_select_either_user" on public.friends;
create policy "friends_select_either_user"
on public.friends
for select
to authenticated
using (user_low = auth.uid() or user_high = auth.uid());


-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------
select to_regclass('public.friend_requests') as friend_requests,
       to_regclass('public.friends') as friends;

select relname, relrowsecurity
from pg_class
where relname in ('friend_requests', 'friends');

select schemaname, tablename, policyname
from pg_policies
where tablename in ('friend_requests', 'friends')
order by tablename, policyname;

select indexname
from pg_indexes
where tablename = 'friend_requests'
  and indexname = 'friend_requests_one_pending_per_pair';


-- ============================================================================
-- HOW TO APPLY
-- ============================================================================
-- 1. Open Supabase Dashboard
-- 2. Navigate to Database → SQL Editor
-- 3. Create a new query
-- 4. Paste this entire file
-- 5. Click RUN
--
-- Expected result:
-- - friend_requests table created
-- - friends table created
-- - RLS enabled with policies
-- ===========================================================================