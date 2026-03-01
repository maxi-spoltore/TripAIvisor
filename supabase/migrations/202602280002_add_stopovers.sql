-- Task 4: stopovers + departure travel metadata

alter table destinations
  add column if not exists is_stopover boolean not null default false;

alter table destinations
  drop constraint if exists destinations_duration_check;

alter table destinations
  add constraint destinations_duration_check
  check ((is_stopover = true and duration >= 0) or (is_stopover = false and duration >= 1));

alter table transports
  add column if not exists arrival_time time;

alter table transports
  add column if not exists travel_days integer not null default 0;
