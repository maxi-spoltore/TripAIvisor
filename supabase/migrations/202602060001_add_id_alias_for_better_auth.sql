-- Better Auth's Kysely adapter expects 'id' in RETURNING results.
-- Add generated 'id' columns that mirror the primary keys.

-- Users table
alter table users
  add column if not exists id bigint generated always as (user_id) stored;

-- Sessions table
alter table sessions
  add column if not exists id bigint generated always as (session_id) stored;

-- Accounts table
alter table accounts
  add column if not exists id bigint generated always as (account_id) stored;

-- Verification table already has 'id' as primary key, no change needed.
