-- Phase 2.4: Row level security policies

alter table trips enable row level security;
alter table destinations enable row level security;
alter table transports enable row level security;
alter table accommodations enable row level security;
alter table trip_shares enable row level security;

alter table trips force row level security;
alter table destinations force row level security;
alter table transports force row level security;
alter table accommodations force row level security;
alter table trip_shares force row level security;

create or replace function current_user_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select u.user_id
  from public.users as u
  where u.email = (auth.jwt() ->> 'email')
  limit 1
$$;

grant execute on function current_user_id() to authenticated;

drop policy if exists "Users manage own trips" on trips;
create policy "Users manage own trips"
  on trips
  for all
  to authenticated
  using (user_id = (select current_user_id()))
  with check (user_id = (select current_user_id()));

drop policy if exists "Users manage own destinations" on destinations;
create policy "Users manage own destinations"
  on destinations
  for all
  to authenticated
  using (
    exists (
      select 1
      from trips as t
      where t.trip_id = destinations.trip_id
        and t.user_id = (select current_user_id())
    )
  )
  with check (
    exists (
      select 1
      from trips as t
      where t.trip_id = destinations.trip_id
        and t.user_id = (select current_user_id())
    )
  );

drop policy if exists "Users manage own transports" on transports;
create policy "Users manage own transports"
  on transports
  for all
  to authenticated
  using (
    (
      destination_id is not null
      and exists (
        select 1
        from destinations as d
        join trips as t on t.trip_id = d.trip_id
        where d.destination_id = transports.destination_id
          and t.user_id = (select current_user_id())
      )
    )
    or
    (
      trip_id is not null
      and exists (
        select 1
        from trips as t
        where t.trip_id = transports.trip_id
          and t.user_id = (select current_user_id())
      )
    )
  )
  with check (
    (
      destination_id is not null
      and exists (
        select 1
        from destinations as d
        join trips as t on t.trip_id = d.trip_id
        where d.destination_id = transports.destination_id
          and t.user_id = (select current_user_id())
      )
    )
    or
    (
      trip_id is not null
      and exists (
        select 1
        from trips as t
        where t.trip_id = transports.trip_id
          and t.user_id = (select current_user_id())
      )
    )
  );

drop policy if exists "Users manage own accommodations" on accommodations;
create policy "Users manage own accommodations"
  on accommodations
  for all
  to authenticated
  using (
    exists (
      select 1
      from destinations as d
      join trips as t on t.trip_id = d.trip_id
      where d.destination_id = accommodations.destination_id
        and t.user_id = (select current_user_id())
    )
  )
  with check (
    exists (
      select 1
      from destinations as d
      join trips as t on t.trip_id = d.trip_id
      where d.destination_id = accommodations.destination_id
        and t.user_id = (select current_user_id())
    )
  );

drop policy if exists "Owners manage shares" on trip_shares;
create policy "Owners manage shares"
  on trip_shares
  for all
  to authenticated
  using (
    exists (
      select 1
      from trips as t
      where t.trip_id = trip_shares.trip_id
        and t.user_id = (select current_user_id())
    )
  )
  with check (
    exists (
      select 1
      from trips as t
      where t.trip_id = trip_shares.trip_id
        and t.user_id = (select current_user_id())
    )
  );

drop policy if exists "Public reads active shares" on trip_shares;
create policy "Public reads active shares"
  on trip_shares
  for select
  to anon, authenticated
  using (
    is_active = true
    and (expires_at is null or expires_at > now())
  );
