# TripAIvisor: Production Migration Plan

## Overview

Migrate the 1350-line travel-planner.tsx prototype to a production-ready Next.js 14 application.

**Target Stack:** Next.js 14 (App Router) + TypeScript + TailwindCSS + Shadcn UI + Supabase + Better Auth + next-intl

---

## Pre-requisites: External Service Setup

### 1. Supabase Project Setup

1. Go to https://supabase.com and sign in/create account
2. Click "New Project" and configure:
   - Project name: `tripaivisor`
   - Database password: (save securely)
   - Region: closest to your users
3. Wait for provisioning (~2 min)
4. Go to **Project Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Project Settings > Database** and copy:
   - Connection string (URI) → `DATABASE_URL`

### 2. Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create/select project
3. Navigate to **APIs & Services > Credentials**
4. Configure OAuth consent screen (if prompted):
   - User Type: External
   - App name: TripAIvisor
   - Scopes: email, profile, openid
5. Create OAuth 2.0 Client ID:
   - Type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
6. Copy credentials:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

### 3. Better Auth Setup

Better Auth is a library (not an external service) that runs within your Next.js app. It uses your Supabase/Postgres database to store users, sessions, and OAuth accounts.

**What you need to configure:**

1. **BETTER_AUTH_SECRET** - A random 32-byte secret for signing session tokens
   ```bash
   # Generate in terminal:
   openssl rand -base64 32
   ```
   Copy the output to your `.env.local`

2. **BETTER_AUTH_URL** - The base URL where your app runs
   - Development: `http://localhost:3000`
   - Production: Your Vercel URL (e.g., `https://tripaivisor.vercel.app`)

3. **DATABASE_URL** - Already configured from Supabase (Step 1.5)
   - Better Auth uses this to create/manage user tables

**How it works:**
- Better Auth creates tables (`users`, `sessions`, `accounts`) in your Supabase database
- Google OAuth tokens are stored in the `accounts` table
- Sessions are managed via HTTP-only cookies
- The schema in Phase 2 includes all required Better Auth tables

**No external dashboard or API keys needed** - just the secret you generate locally and the Google OAuth credentials from Step 2.

### 4. Environment Variables Needed

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=  # Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Phase 1: Project Initialization

### 1.1 Create Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 1.2 Install Dependencies

```bash
# UI
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label dialog select textarea dropdown-menu

# Database & Auth
pnpm add @supabase/supabase-js @supabase/ssr better-auth

# i18n & Utilities
pnpm add next-intl zod nanoid date-fns lucide-react
```

### 1.3 Target Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard/trip list
│   │   ├── (auth)/login/page.tsx
│   │   ├── trips/
│   │   │   ├── new/page.tsx
│   │   │   └── [tripId]/page.tsx    # Trip editor
│   │   └── share/[shareId]/page.tsx # Public view-only
│   └── api/
│       ├── auth/[...all]/route.ts
│       └── trips/[tripId]/share/route.ts
├── components/
│   ├── ui/                          # Shadcn
│   ├── trips/
│   │   ├── trip-header.tsx
│   │   ├── destination-card.tsx
│   │   ├── destination-list.tsx
│   │   ├── destination-modal.tsx
│   │   ├── departure-card.tsx
│   │   └── return-card.tsx
│   └── layout/
│       ├── header.tsx
│       └── locale-switcher.tsx
├── lib/
│   ├── auth.ts                      # Better Auth config
│   ├── auth-client.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── db/queries/
│   │   ├── trips.ts
│   │   ├── destinations.ts
│   │   ├── transports.ts
│   │   ├── accommodations.ts
│   │   └── shares.ts
│   └── utils/dates.ts               # Port date calculations
├── i18n/
│   ├── request.ts
│   └── routing.ts
├── messages/
│   ├── es.json
│   └── en.json
├── types/
│   └── database.ts
└── middleware.ts
```

### 1.4 Implementation Summary (Completed on February 3, 2026)

Phase 1 has been implemented in this repository with a pragmatic offline-first approach (manual scaffolding instead of `create-next-app`/`pnpm` commands due blocked npm registry access in the current environment).

**What was completed:**

- **Next.js + TypeScript + Tailwind base scaffold**
  - Added project config and runtime entrypoints:
    - `package.json`
    - `.gitignore`
    - `next.config.mjs`
    - `tsconfig.json`
    - `next-env.d.ts`
    - `postcss.config.mjs`
    - `tailwind.config.ts`
    - `.eslintrc.json`
  - Added app shell:
    - `src/app/layout.tsx`
    - `src/app/page.tsx` (redirects to `/es`)
    - `src/app/globals.css`

- **Dependency declarations for Phase 1 stack**
  - Added dependencies in `package.json` for:
    - Next.js/React/TypeScript runtime
    - Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
    - Better Auth (`better-auth`)
    - i18n/utilities (`next-intl`, `zod`, `nanoid`, `date-fns`, `lucide-react`)
  - Added required dev tooling dependencies for linting + Tailwind + TypeScript.

- **Shadcn initialization equivalent**
  - Added `components.json` with aliases and Tailwind integration.
  - Created `src/components/ui/` primitives matching requested Phase 1 component set:
    - `button.tsx`
    - `card.tsx`
    - `input.tsx`
    - `label.tsx`
    - `dialog.tsx`
    - `select.tsx`
    - `textarea.tsx`
    - `dropdown-menu.tsx`
  - Added shared utility `src/lib/utils.ts`.

- **Target folder structure created (with placeholders where implementation belongs to later phases)**
  - App routes:
    - `src/app/[locale]/layout.tsx`
    - `src/app/[locale]/page.tsx`
    - `src/app/[locale]/(auth)/login/page.tsx`
    - `src/app/[locale]/trips/new/page.tsx`
    - `src/app/[locale]/trips/[tripId]/page.tsx`
    - `src/app/[locale]/share/[shareId]/page.tsx`
  - API routes:
    - `src/app/api/auth/[...all]/route.ts`
    - `src/app/api/trips/[tripId]/share/route.ts`
  - Layout components:
    - `src/components/layout/header.tsx`
    - `src/components/layout/locale-switcher.tsx`
  - Trip components:
    - `src/components/trips/trip-header.tsx`
    - `src/components/trips/destination-card.tsx`
    - `src/components/trips/destination-list.tsx`
    - `src/components/trips/destination-modal.tsx`
    - `src/components/trips/departure-card.tsx`
    - `src/components/trips/return-card.tsx`
  - Library placeholders:
    - `src/lib/auth.ts`
    - `src/lib/auth-client.ts`
    - `src/lib/supabase/client.ts`
    - `src/lib/supabase/server.ts`
    - `src/lib/supabase/admin.ts`
    - `src/lib/db/queries/trips.ts`
    - `src/lib/db/queries/destinations.ts`
    - `src/lib/db/queries/transports.ts`
    - `src/lib/db/queries/accommodations.ts`
    - `src/lib/db/queries/shares.ts`
    - `src/lib/utils/dates.ts`
  - i18n/messages/types/middleware placeholders:
    - `src/i18n/routing.ts`
    - `src/i18n/request.ts`
    - `src/messages/es.json`
    - `src/messages/en.json`
    - `src/types/database.ts`
    - `src/middleware.ts`

**Important note for next phase execution:**
- Package installation commands were not executable in this environment because npm registry access is unavailable. Dependency entries are committed in `package.json`, but lockfile generation and install must be run in a network-enabled environment before running/building tests.

---

## Phase 2: Database Schema

### 2.1 Supabase CLI Setup (Pre-requisite)

Install and configure Supabase CLI to manage migrations:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase
# Or: npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project (run from project root)
supabase init

# Link to your remote project (get project-ref from Supabase dashboard URL)
supabase link --project-ref <your-project-ref>

# Create your first migration
supabase migration new create_schema
```

This creates `supabase/migrations/[timestamp]_create_schema.sql`. Edit this file with the schema below.

### 2.2 Apply Migrations

```bash
# Push migrations to remote database
supabase db push

# Or for local development first:
supabase start          # Start local Supabase
supabase db reset       # Apply migrations locally
```

### 2.3 Database Schema

Add this SQL to your migration file (`supabase/migrations/[timestamp]_create_schema.sql`):

```sql
-- Create dedicated schema
create schema if not exists tripaivisor;

-- Transport type enum
create type tripaivisor.transport_type as enum ('plane', 'train', 'bus');

-- Users (Better Auth managed)
create table tripaivisor.users (
  user_id serial primary key,
  email text unique not null,
  name text,
  image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Better Auth sessions
create table tripaivisor.sessions (
  session_id serial primary key,
  user_id integer references tripaivisor.users(user_id) on delete cascade,
  expires_at timestamptz not null,
  token text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Better Auth accounts (OAuth providers)
create table tripaivisor.accounts (
  account_id serial primary key,
  user_id integer references tripaivisor.users(user_id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(provider, provider_account_id)
);

-- Trips
create table tripaivisor.trips (
  trip_id serial primary key,
  user_id integer references tripaivisor.users(user_id) on delete cascade not null,
  title text not null default 'Mi Viaje',
  start_date date,
  departure_city text default 'Buenos Aires',
  return_city text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_trips_user_id on tripaivisor.trips(user_id);

-- Destinations
create table tripaivisor.destinations (
  destination_id serial primary key,
  trip_id integer references tripaivisor.trips(trip_id) on delete cascade not null,
  city text not null,
  duration integer not null default 2,
  position integer not null,
  notes text,
  budget numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_destinations_trip_position on tripaivisor.destinations(trip_id, position);

-- Transports (linked to destination OR trip for departure/return)
create table tripaivisor.transports (
  transport_id serial primary key,
  -- Link to either destination or trip (mutually exclusive)
  destination_id integer references tripaivisor.destinations(destination_id) on delete cascade,
  trip_id integer references tripaivisor.trips(trip_id) on delete cascade,
  transport_role text check (transport_role in ('destination', 'departure', 'return')) not null,
  -- Transport fields
  transport_type tripaivisor.transport_type default 'plane',
  leave_accommodation_time time,
  terminal text,
  company text,
  booking_number text,
  booking_code text,
  departure_time time,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Ensure exactly one parent is set
  constraint transport_single_parent check (
    (destination_id is not null and trip_id is null and transport_role = 'destination') or
    (destination_id is null and trip_id is not null and transport_role in ('departure', 'return'))
  )
);

create index idx_transports_destination on tripaivisor.transports(destination_id) where destination_id is not null;
create index idx_transports_trip on tripaivisor.transports(trip_id) where trip_id is not null;

-- Accommodations (linked to destinations only)
create table tripaivisor.accommodations (
  accommodation_id serial primary key,
  destination_id integer references tripaivisor.destinations(destination_id) on delete cascade not null,
  name text,
  check_in time,
  check_out time,
  booking_link text,
  booking_code text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_accommodations_destination on tripaivisor.accommodations(destination_id);

-- Share links
create table tripaivisor.trip_shares (
  share_id serial primary key,
  trip_id integer references tripaivisor.trips(trip_id) on delete cascade not null,
  share_token text unique not null,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create index idx_trip_shares_token on tripaivisor.trip_shares(share_token) where is_active = true;

-- Updated at trigger function
create or replace function tripaivisor.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
create trigger users_updated_at before update on tripaivisor.users
  for each row execute function tripaivisor.update_updated_at();

create trigger trips_updated_at before update on tripaivisor.trips
  for each row execute function tripaivisor.update_updated_at();

create trigger destinations_updated_at before update on tripaivisor.destinations
  for each row execute function tripaivisor.update_updated_at();

create trigger transports_updated_at before update on tripaivisor.transports
  for each row execute function tripaivisor.update_updated_at();

create trigger accommodations_updated_at before update on tripaivisor.accommodations
  for each row execute function tripaivisor.update_updated_at();
```

### 2.4 Row Level Security

Create a second migration for RLS:

```bash
supabase migration new add_rls_policies
```

Add this SQL:

```sql
-- Enable RLS on all tables
alter table tripaivisor.trips enable row level security;
alter table tripaivisor.destinations enable row level security;
alter table tripaivisor.transports enable row level security;
alter table tripaivisor.accommodations enable row level security;
alter table tripaivisor.trip_shares enable row level security;

-- Helper function to get current user ID from auth context
create or replace function tripaivisor.current_user_id()
returns integer as $$
  select user_id from tripaivisor.users where email = auth.jwt()->>'email'
$$ language sql security definer;

-- Trips: users manage their own
create policy "Users manage own trips" on tripaivisor.trips
  for all using (user_id = tripaivisor.current_user_id());

-- Destinations: follow trip ownership
create policy "Users manage own destinations" on tripaivisor.destinations
  for all using (
    trip_id in (select trip_id from tripaivisor.trips where user_id = tripaivisor.current_user_id())
  );

-- Transports: follow trip/destination ownership
create policy "Users manage own transports" on tripaivisor.transports
  for all using (
    (destination_id in (
      select destination_id from tripaivisor.destinations d
      join tripaivisor.trips t on d.trip_id = t.trip_id
      where t.user_id = tripaivisor.current_user_id()
    ))
    or
    (trip_id in (select trip_id from tripaivisor.trips where user_id = tripaivisor.current_user_id()))
  );

-- Accommodations: follow destination ownership
create policy "Users manage own accommodations" on tripaivisor.accommodations
  for all using (
    destination_id in (
      select destination_id from tripaivisor.destinations d
      join tripaivisor.trips t on d.trip_id = t.trip_id
      where t.user_id = tripaivisor.current_user_id()
    )
  );

-- Shares: owners manage, anyone reads active
create policy "Owners manage shares" on tripaivisor.trip_shares
  for all using (
    trip_id in (select trip_id from tripaivisor.trips where user_id = tripaivisor.current_user_id())
  );

create policy "Public reads active shares" on tripaivisor.trip_shares
  for select using (is_active = true);
```

### 2.5 Entity Relationship Diagram

```
users (1) ──< sessions (N)
users (1) ──< accounts (N)
users (1) ──< trips (N)

trips (1) ──< destinations (N)
trips (1) ──< transports (0..2)  [departure, return]
trips (1) ──< trip_shares (N)

destinations (1) ──< transports (0..1)
destinations (1) ──< accommodations (0..1)
```

### 2.6 TypeScript Types

Create `src/types/database.ts`:

```typescript
// Enums
export type TransportType = 'plane' | 'train' | 'bus';
export type TransportRole = 'destination' | 'departure' | 'return';

// Base entities
export interface User {
  user_id: number;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  trip_id: number;
  user_id: number;
  title: string;
  start_date: string | null;
  departure_city: string;
  return_city: string | null;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  destination_id: number;
  trip_id: number;
  city: string;
  duration: number;
  position: number;
  notes: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface Transport {
  transport_id: number;
  destination_id: number | null;
  trip_id: number | null;
  transport_role: TransportRole;
  transport_type: TransportType;
  leave_accommodation_time: string | null;
  terminal: string | null;
  company: string | null;
  booking_number: string | null;
  booking_code: string | null;
  departure_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  accommodation_id: number;
  destination_id: number;
  name: string | null;
  check_in: string | null;
  check_out: string | null;
  booking_link: string | null;
  booking_code: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripShare {
  share_id: number;
  trip_id: number;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// Composite types for queries
export interface DestinationWithRelations extends Destination {
  transport: Transport | null;
  accommodation: Accommodation | null;
}

export interface TripWithRelations extends Trip {
  destinations: DestinationWithRelations[];
  departure_transport: Transport | null;
  return_transport: Transport | null;
}
```

### 2.7 Implementation Summary (Completed on February 3, 2026)

Phase 2 has been implemented with production-focused SQL constraints and RLS hardening.

**What was completed:**

- **Supabase migrations created for schema + security**
  - Added `supabase/migrations/202602030001_create_schema.sql`
  - Added `supabase/migrations/202602030002_add_rls_policies.sql`

- **Core database schema implemented (`tripaivisor` schema)**
  - Created all Phase 2 entities:
    - `users`
    - `sessions`
    - `accounts`
    - `trips`
    - `destinations`
    - `transports`
    - `accommodations`
    - `trip_shares`
  - Added enum types:
    - `tripaivisor.transport_type` (`plane`, `train`, `bus`)
    - `tripaivisor.transport_role` (`destination`, `departure`, `return`)
  - Added `created_at`/`updated_at` timestamps and shared update trigger function.

- **Schema-level integrity and indexing improvements**
  - Upgraded primary keys to `bigint generated by default as identity`.
  - Added missing FK-supporting indexes for performant joins/cascades.
  - Enforced one-to-one relationships where required:
    - Unique transport per destination
    - Unique accommodation per destination
    - Unique `(trip_id, transport_role)` for departure/return transports
  - Preserved active-share lookup optimization with partial index.

- **RLS implemented and hardened**
  - Enabled + forced RLS for:
    - `trips`
    - `destinations`
    - `transports`
    - `accommodations`
    - `trip_shares`
  - Added `tripaivisor.current_user_id()` helper as `security definer` with locked `search_path`.
  - Added ownership policies for authenticated users (with both `USING` and `WITH CHECK`).
  - Added public read policy for active, non-expired share links.

- **Privileges configured for Supabase roles**
  - Granted schema usage and table/sequence privileges needed by `authenticated`, `anon`, and `service_role`.
  - Added default privileges for future tables/sequences in `tripaivisor`.

- **TypeScript database contracts expanded**
  - Replaced placeholder `src/types/database.ts` with Phase 2 model coverage:
    - Core entities (`User`, `Session`, `Account`, `Trip`, `Destination`, `Transport`, `Accommodation`, `TripShare`)
    - Enums (`TransportType`, `TransportRole`)
    - Composite query types (`DestinationWithRelations`, `TripWithRelations`)

**Notes:**
- Supabase CLI actions (`supabase init`, `supabase link`, `supabase db push`) were not executed in this environment; SQL migration files are ready to apply.

---

## Phase 3: Supabase Client Setup

**Scope:** Configure Supabase clients for browser, server, and admin contexts.

**Libraries:**
- `@supabase/supabase-js` - Core Supabase client
- `@supabase/ssr` - Server-side rendering utilities for Next.js

**Documentation:**
- https://supabase.com/docs/guides/auth/server-side/nextjs

### Files to Create

**`src/lib/supabase/client.ts`** - Browser client (client components)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** - Server client (server components, API routes)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**`src/lib/supabase/admin.ts`** - Service role client (bypasses RLS for share access)
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

### Tests

**`src/lib/supabase/__tests__/client.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { createClient } from '../client'

describe('Supabase Browser Client', () => {
  it('creates a client with correct URL', () => {
    const client = createClient()
    expect(client).toBeDefined()
  })
})
```

### Verification
- [ ] Browser client connects successfully
- [ ] Server client can read cookies
- [ ] Admin client bypasses RLS

### 3.1 Implementation Summary (Completed on February 3, 2026)

Phase 3 has been implemented with environment-safe Supabase client factories for browser, server, and admin contexts.

**What was completed:**

- **Browser client implemented**
  - Replaced placeholder `src/lib/supabase/client.ts` with a real `@supabase/ssr` browser client factory.
  - Added explicit environment validation for:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Server client implemented**
  - Replaced placeholder `src/lib/supabase/server.ts` with a server client factory using:
    - `createServerClient` from `@supabase/ssr`
    - `cookies()` from `next/headers`
  - Wired cookie read/write adapters (`getAll`, `setAll`) required for Supabase SSR auth token handling.
  - Added a defensive `try/catch` around cookie writes to avoid runtime breaks in contexts where setting cookies is disallowed.

- **Admin client implemented**
  - Replaced placeholder `src/lib/supabase/admin.ts` with a service-role client using `@supabase/supabase-js`.
  - Added explicit environment validation for:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
  - Disabled session persistence/refresh for admin usage.

- **Phase 3 tests added**
  - Added `src/lib/supabase/__tests__/client.test.ts`.
  - Tests cover:
    - Browser client initialization with public env vars
    - Server client cookie adapter wiring
    - Admin client initialization with service role key and non-persistent auth config

**Notes:**
- Verification commands were not executed in this environment because dependencies are declared but not installed yet.

---

## Phase 4: Authentication Setup

**Scope:** Configure Better Auth with Google OAuth provider.

**Libraries:**
- `better-auth` - Authentication framework
- `better-auth/react` - React hooks and components

**Documentation:**
- https://www.better-auth.com/docs/installation
- https://www.better-auth.com/docs/authentication/google

### Files to Create

**`src/lib/auth.ts`** - Server-side Better Auth instance
```typescript
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ['email', 'profile'],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Update daily
  },
  // Use tripaivisor schema tables
  advanced: {
    database: {
      tablePrefix: 'tripaivisor.',
    },
  },
})
```

**`src/lib/auth-client.ts`** - Client-side auth utilities
```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signOut, useSession } = authClient
```

**`src/app/api/auth/[...all]/route.ts`** - API route handler
```typescript
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { POST, GET } = toNextJsHandler(auth)
```

**`src/app/[locale]/(auth)/login/page.tsx`** - Login page
```typescript
'use client'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const handleGoogleLogin = () => {
    signIn.social({ provider: 'google' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={handleGoogleLogin}>
        Continuar con Google
      </Button>
    </div>
  )
}
```

### Tests

**`src/lib/__tests__/auth.test.ts`**
```typescript
import { describe, it, expect } from 'vitest'
import { auth } from '../auth'

describe('Better Auth Configuration', () => {
  it('has google provider configured', () => {
    expect(auth.options.socialProviders?.google).toBeDefined()
  })

  it('has correct session expiry', () => {
    expect(auth.options.session?.expiresIn).toBe(604800) // 7 days in seconds
  })
})
```

**`src/app/[locale]/(auth)/__tests__/login.test.tsx`**
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../login/page'

describe('Login Page', () => {
  it('renders Google login button', () => {
    render(<LoginPage />)
    expect(screen.getByText(/continuar con google/i)).toBeInTheDocument()
  })
})
```

### Verification
- [ ] Login page renders
- [ ] Google OAuth redirects correctly
- [ ] Session cookie is set after login
- [ ] User data stored in `tripaivisor.users` table

### 4.1 Implementation Summary (Completed on February 3, 2026)

Phase 4 has been implemented with Better Auth + Google OAuth wiring for Next.js App Router, including table/field mapping aligned with the existing `tripaivisor` auth tables.

**What was completed:**

- **Better Auth server configuration implemented**
  - Replaced placeholder `src/lib/auth.ts` with a real Better Auth instance.
  - Added explicit environment validation for:
    - `DATABASE_URL`
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
  - Added PostgreSQL connection via `pg.Pool`.
  - Configured `search_path=tripaivisor,public` so Better Auth queries run against the project schema.
  - Configured:
    - Google social provider (`email`, `profile` scope)
    - Session policy (`expiresIn=7 days`, `updateAge=1 day`)
    - Better Auth model/field mappings for existing snake_case tables:
      - `users`
      - `sessions`
      - `accounts`

- **Better Auth client utilities implemented**
  - Replaced placeholder `src/lib/auth-client.ts`.
  - Added `createAuthClient` setup with `NEXT_PUBLIC_APP_URL` when available.
  - Exported real `signIn`, `signOut`, and `useSession` helpers.

- **Auth API route wired to Better Auth**
  - Replaced placeholder handler in `src/app/api/auth/[...all]/route.ts`.
  - Connected Next.js route exports to `toNextJsHandler(auth)` for both `GET` and `POST`.

- **Login page connected to Google OAuth**
  - Updated `src/app/[locale]/(auth)/login/page.tsx` from static UI to working client page.
  - Added `signIn.social({ provider: 'google' })` click handler.
  - Updated UI copy to Spanish CTA (`Continuar con Google`).

- **Phase 4 tests added**
  - Added `src/lib/__tests__/auth.test.ts`:
    - Validates Google provider wiring and session expiry/update settings.
    - Uses module mocks for `better-auth` and `pg` to keep tests isolated.
  - Added `src/app/[locale]/(auth)/__tests__/login.test.tsx`:
    - Verifies login page renders Google login button.

- **Dependencies updated for auth implementation**
  - Updated `package.json`:
    - Added runtime dependency: `pg`
    - Added TypeScript types: `@types/pg`

**Verification notes:**
- Attempted to run `npm run lint`, but local dependencies are not installed in this environment (`next: command not found`).
- Attempted `npm install` to unblock verification, but install timed out in this environment.

---

## Phase 5: Middleware (Auth + i18n)

**Scope:** Protect routes and handle locale routing.

**Libraries:**
- `next-intl` - Internationalization for Next.js

**Documentation:**
- https://next-intl-docs.vercel.app/docs/routing/middleware

### Files to Create

**`src/i18n/routing.ts`** - Locale configuration
```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
})
```

**`src/i18n/request.ts`** - Request config for next-intl
```typescript
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

**`src/middleware.ts`** - Combined auth + i18n middleware
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const publicPaths = ['/login', '/share', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for public paths
  const isPublicPath = publicPaths.some(p => pathname.includes(p))

  if (!isPublicPath) {
    const sessionCookie = request.cookies.get('better-auth.session_token')
    if (!sessionCookie) {
      const locale = pathname.split('/')[1] || 'es'
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

### Tests

**`src/__tests__/middleware.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest'
// Test middleware behavior with mocked requests

describe('Middleware', () => {
  it('redirects unauthenticated users to login', async () => {
    // Mock NextRequest without session cookie
    // Assert redirect to /es/login
  })

  it('allows access to public paths without auth', async () => {
    // Mock request to /share/abc
    // Assert no redirect
  })

  it('applies locale prefix', async () => {
    // Mock request to /trips
    // Assert redirect to /es/trips
  })
})
```

### Verification
- [ ] Unauthenticated users redirect to login
- [ ] `/share/*` routes accessible without auth
- [ ] Locale prefix applied to all routes
- [ ] Default locale is Spanish

### 5.1 Implementation Summary (Completed on February 3, 2026)

Phase 5 has been implemented with a production-safe `next-intl` routing setup and authentication gating for protected pages.

**What was completed:**

- **Locale routing defined with `next-intl` primitives**
  - Replaced the plain routing object in `src/i18n/routing.ts` with `defineRouting(...)`.
  - Kept locales aligned to plan (`es`, `en`) and default locale as Spanish (`es`).
  - Added `AppLocale` type export to keep locale handling type-safe across middleware/request config.

- **Request-time i18n configuration implemented**
  - Replaced placeholder logic in `src/i18n/request.ts` with `getRequestConfig(...)`.
  - Implemented locale validation/fallback to default locale when missing or unsupported.
  - Added dynamic message loading from `src/messages/{locale}.json`.

- **Combined auth + i18n middleware implemented**
  - Replaced pass-through middleware in `src/middleware.ts` with:
    - `next-intl` middleware execution for locale routing.
    - Route protection for non-public pages.
    - Public route exemptions for `/login` and `/share` (with locale-aware matching).
    - Better Auth cookie checks for both:
      - `better-auth.session_token`
      - `__Secure-better-auth.session_token`
    - Unauthenticated redirect to localized login URL with `redirectTo` preservation.
  - Updated matcher to avoid running i18n/auth middleware on non-page routes (`api`, `_next`, `_vercel`, static assets), reducing accidental interference with API endpoints.

- **Phase 5 middleware tests added**
  - Added `src/__tests__/middleware.test.ts`.
  - Added coverage for:
    - unauthenticated redirect on protected route
    - public share route access without auth
    - default-locale login redirect when route has no locale prefix

- **Verification executed**
  - Ran `npm run lint` successfully (no ESLint warnings/errors).
  - Ran `npm run build` successfully (production build + type checks pass).

---

## Phase 6: Internationalization (i18n)

**Scope:** Set up translation files and locale switcher component.

**Libraries:**
- `next-intl` - Internationalization

**Documentation:**
- https://next-intl-docs.vercel.app/docs/getting-started/app-router

### Files to Create

**`src/messages/es.json`** - Spanish translations (default)
Port UI strings from prototype (all Spanish in original):
- Lines 5, 33: "Mi Viaje" → `trips.defaultTitle`
- Lines 89, 403: "Selecciona una fecha" → `common.selectDate`
- Lines 371: "Configurar fecha de inicio" → `trips.setStartDate`
- Lines 379: "Agregar Destino" → `destinations.add`
- Lines 684: "Confirmar eliminación" → `common.confirmDelete`
- Lines 1071: "Editar Destino" → `destinations.edit`

```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "confirm": "Confirmar",
    "selectDate": "Selecciona una fecha",
    "confirmDelete": "¿Estás seguro de que deseas eliminar?"
  },
  "auth": {
    "signIn": "Iniciar sesión",
    "signOut": "Cerrar sesión",
    "continueWithGoogle": "Continuar con Google"
  },
  "trips": {
    "title": "Mis Viajes",
    "defaultTitle": "Mi Viaje",
    "newTrip": "Nuevo Viaje",
    "setStartDate": "Configurar fecha de inicio",
    "startDate": "Fecha de Salida",
    "endDate": "Fecha de Regreso",
    "days": "{count} días",
    "departureFrom": "Salida desde {city}",
    "returnTo": "Regreso a {city}"
  },
  "destinations": {
    "add": "Agregar Destino",
    "edit": "Editar Destino",
    "city": "Ciudad",
    "duration": "Duración (días)",
    "newCity": "Nueva Ciudad"
  },
  "transport": {
    "title": "Transporte",
    "type": "Tipo de transporte",
    "plane": "Avión",
    "train": "Tren",
    "bus": "Bus",
    "leaveTime": "Hora salida del alojamiento",
    "terminal": "Terminal de origen",
    "company": "Empresa",
    "bookingNumber": "Número de boleto",
    "bookingCode": "Código de reserva",
    "departureTime": "Hora de salida"
  },
  "accommodation": {
    "title": "Hospedaje",
    "name": "Nombre del alojamiento",
    "checkIn": "Check-in",
    "checkOut": "Check-out",
    "bookingLink": "Link de reserva",
    "bookingCode": "Código de reserva",
    "address": "Dirección"
  },
  "share": {
    "title": "Compartir Viaje",
    "copyLink": "Copiar enlace",
    "copied": "¡Copiado!",
    "viewOnly": "Vista de solo lectura"
  }
}
```

**`src/messages/en.json`** - English translations
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm",
    "selectDate": "Select a date",
    "confirmDelete": "Are you sure you want to delete?"
  },
  "auth": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "continueWithGoogle": "Continue with Google"
  },
  "trips": {
    "title": "My Trips",
    "defaultTitle": "My Trip",
    "newTrip": "New Trip",
    "setStartDate": "Set start date",
    "startDate": "Start Date",
    "endDate": "End Date",
    "days": "{count} days",
    "departureFrom": "Departure from {city}",
    "returnTo": "Return to {city}"
  },
  "destinations": {
    "add": "Add Destination",
    "edit": "Edit Destination",
    "city": "City",
    "duration": "Duration (days)",
    "newCity": "New City"
  },
  "transport": {
    "title": "Transport",
    "type": "Transport type",
    "plane": "Plane",
    "train": "Train",
    "bus": "Bus",
    "leaveTime": "Leave accommodation time",
    "terminal": "Departure terminal",
    "company": "Company",
    "bookingNumber": "Ticket number",
    "bookingCode": "Booking code",
    "departureTime": "Departure time"
  },
  "accommodation": {
    "title": "Accommodation",
    "name": "Accommodation name",
    "checkIn": "Check-in",
    "checkOut": "Check-out",
    "bookingLink": "Booking link",
    "bookingCode": "Booking code",
    "address": "Address"
  },
  "share": {
    "title": "Share Trip",
    "copyLink": "Copy link",
    "copied": "Copied!",
    "viewOnly": "View only"
  }
}
```

**`src/components/layout/locale-switcher.tsx`**
```typescript
'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <Select value={locale} onValueChange={switchLocale}>
      <SelectTrigger className="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### Tests

**`src/components/layout/__tests__/locale-switcher.test.tsx`**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocaleSwitcher } from '../locale-switcher'

// Mock next-intl and next/navigation
vi.mock('next-intl', () => ({ useLocale: () => 'es' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/es/trips',
}))

describe('LocaleSwitcher', () => {
  it('displays current locale', () => {
    render(<LocaleSwitcher />)
    expect(screen.getByText('Español')).toBeInTheDocument()
  })
})
```

### Verification
- [ ] Spanish displays as default
- [ ] English translations load correctly
- [ ] Locale switcher changes URL and content
- [ ] All prototype UI strings are translated

### 6.1 Implementation Summary (Completed on February 3, 2026)

Phase 6 has been implemented end-to-end with `next-intl` integration, production message catalogs, and a working locale switch flow wired into the app shell.

**What was completed:**

- **`next-intl` App Router plugin wiring completed**
  - Updated `next.config.mjs` to use `createNextIntlPlugin('./src/i18n/request.ts')`.
  - Kept the existing Next.js config (`reactStrictMode`) and wrapped it with the plugin so request config is picked up correctly.

- **Spanish and English message catalogs fully populated**
  - Replaced placeholders in:
    - `src/messages/es.json`
    - `src/messages/en.json`
  - Added complete Phase 6 namespaces/keys:
    - `common`
    - `auth`
    - `trips`
    - `destinations`
    - `transport`
    - `accommodation`
    - `share`
  - Included all prototype-referenced strings called out by the plan (`Mi Viaje`, `Selecciona una fecha`, `Configurar fecha de inicio`, `Agregar Destino`, deletion confirmation, `Editar Destino`) in the correct keys.

- **Locale-aware layout/provider integration implemented**
  - Updated `src/app/[locale]/layout.tsx` to:
    - Validate locale via `hasLocale(...)` against `routing.locales`
    - `notFound()` invalid locales
    - Call `setRequestLocale(locale)`
    - Load messages with `getMessages({ locale })`
    - Wrap subtree in `NextIntlClientProvider`
  - Mounted shared app header (with locale switcher) in the locale layout so language switching is available across locale routes.

- **Locale switcher implemented with URL rewrite behavior**
  - Updated `src/components/layout/locale-switcher.tsx` to:
    - Use `useLocale()` as the source of current locale
    - Preserve current path while replacing locale segment (`/es/...` → `/en/...`)
    - Handle non-prefixed/empty path edge cases by prefixing selected locale
    - Display human-readable labels (`Español`, `English`)

- **UI now reads translations from catalogs**
  - Updated `src/app/[locale]/page.tsx` to use server translations (`getTranslations('trips')`) for dashboard copy.
  - Updated `src/app/[locale]/(auth)/login/page.tsx` to use client translations (`useTranslations('auth')`) for sign-in heading and Google CTA.

- **Phase 6 tests added/updated**
  - Added `src/components/layout/__tests__/locale-switcher.test.tsx`:
    - Verifies current locale label rendering.
    - Verifies route push to localized path on locale change (`/es/trips` → `/en/trips`).
  - Updated `src/app/[locale]/(auth)/__tests__/login.test.tsx`:
    - Added `next-intl` mock for `useTranslations` to keep test isolated from provider setup.

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Phase 7: Trip CRUD Operations

**Scope:** Database queries and UI for creating, reading, updating, deleting trips.

**Prototype Reference:**
- Lines 45-54: Save to localStorage (replace with database)
- Lines 276-317: Export/Import (data structure reference)

### Files to Create

**`src/lib/db/queries/trips.ts`** - Trip database operations
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Trip, TripWithRelations } from '@/types/database'

export async function getUserTrips(userId: number): Promise<Trip[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tripaivisor.trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTripById(tripId: number): Promise<TripWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tripaivisor.trips')
    .select(`
      *,
      destinations:tripaivisor.destinations(
        *,
        transport:tripaivisor.transports(*),
        accommodation:tripaivisor.accommodations(*)
      ),
      departure_transport:tripaivisor.transports!trip_id(*)
    `)
    .eq('trip_id', tripId)
    .single()

  if (error) return null
  return data
}

export async function createTrip(userId: number, title: string): Promise<Trip> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tripaivisor.trips')
    .insert({ user_id: userId, title })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTrip(
  tripId: number,
  updates: Partial<Pick<Trip, 'title' | 'start_date' | 'departure_city' | 'return_city'>>
): Promise<Trip> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tripaivisor.trips')
    .update(updates)
    .eq('trip_id', tripId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrip(tripId: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tripaivisor.trips')
    .delete()
    .eq('trip_id', tripId)

  if (error) throw error
}
```

**`src/app/[locale]/page.tsx`** - Trip list dashboard
```typescript
import { getUserTrips } from '@/lib/db/queries/trips'
import { auth } from '@/lib/auth'
import { TripCard } from '@/components/trips/trip-card'
import { CreateTripButton } from '@/components/trips/create-trip-button'

export default async function DashboardPage() {
  const session = await auth.api.getSession()
  const trips = await getUserTrips(session.user.id)

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Viajes</h1>
        <CreateTripButton />
      </div>

      {trips.length === 0 ? (
        <p>No tienes viajes todavía</p>
      ) : (
        <div className="grid gap-4">
          {trips.map(trip => (
            <TripCard key={trip.trip_id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**`src/components/trips/trip-header.tsx`** - Editable header
Port from prototype lines 332-397 (header section with title, dates, buttons)
```typescript
'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateTrip } from '@/lib/db/queries/trips'

// Port formatDate from prototype line 63-67
function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

interface TripHeaderProps {
  tripId: number
  title: string
  startDate: string | null
  totalDays: number
}

export function TripHeader({ tripId, title, startDate, totalDays }: TripHeaderProps) {
  const t = useTranslations()
  const [editingTitle, setEditingTitle] = useState(title)

  // Port date logic from prototype lines 56-85
  const calculateEndDate = (start: string, days: number): string => {
    const date = new Date(start)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const handleTitleChange = async () => {
    if (editingTitle !== title) {
      await updateTrip(tripId, { title: editingTitle })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <Input
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        onBlur={handleTitleChange}
        className="text-3xl font-bold mb-4 border-none"
        placeholder={t('trips.defaultTitle')}
      />

      {startDate && (
        <div className="text-gray-600 mb-4">
          {formatDate(startDate)}
          {totalDays > 0 && (
            <> - {formatDate(calculateEndDate(startDate, totalDays))} ({t('trips.days', { count: totalDays })})</>
          )}
        </div>
      )}
    </div>
  )
}
```

### Tests

**`src/lib/db/queries/__tests__/trips.test.ts`**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTrip, getUserTrips, updateTrip, deleteTrip } from '../trips'

describe('Trip Queries', () => {
  let testTripId: number

  beforeEach(async () => {
    // Create test trip
    const trip = await createTrip(1, 'Test Trip')
    testTripId = trip.trip_id
  })

  afterEach(async () => {
    // Clean up
    await deleteTrip(testTripId)
  })

  it('creates a trip with correct title', async () => {
    const trip = await createTrip(1, 'New Trip')
    expect(trip.title).toBe('New Trip')
    await deleteTrip(trip.trip_id)
  })

  it('retrieves user trips', async () => {
    const trips = await getUserTrips(1)
    expect(trips.length).toBeGreaterThan(0)
  })

  it('updates trip title', async () => {
    const updated = await updateTrip(testTripId, { title: 'Updated Title' })
    expect(updated.title).toBe('Updated Title')
  })

  it('deletes trip', async () => {
    await deleteTrip(testTripId)
    const trips = await getUserTrips(1)
    expect(trips.find(t => t.trip_id === testTripId)).toBeUndefined()
  })
})
```

### Verification
- [ ] Trip list shows all user trips
- [ ] Create new trip works
- [ ] Edit trip title saves to database
- [ ] Delete trip with confirmation
- [ ] Date calculations match prototype behavior

### 7.1 Implementation Summary (Completed on February 3, 2026)

Phase 7 has been implemented with production-safe trip CRUD wiring across database queries, server actions, and locale-aware UI pages.

**What was completed:**

- **Trip query layer implemented**
  - Replaced placeholder `src/lib/db/queries/trips.ts` with full CRUD functions:
    - `getUserTrips(userId)`
    - `getTripById(tripId)`
    - `createTrip(userId, title)`
    - `updateTrip(tripId, updates)`
    - `deleteTrip(tripId)`
  - Implemented `getTripById` as explicit multi-query composition to avoid brittle nested joins:
    - Loads trip row
    - Loads destinations ordered by `position`
    - Loads destination transports/accommodations
    - Loads trip-level departure/return transports
    - Returns `TripWithRelations` shape aligned with `src/types/database.ts`
  - Added graceful not-found handling for `.single()` lookups (Supabase `PGRST116`).

- **Server actions added for authenticated trip mutations**
  - Added `src/app/actions/trips.ts` with:
    - `createTripForLocaleAction`
    - `createTripAndRedirectAction`
    - `deleteTripForLocaleAction`
    - `updateTripTitleAction`
  - Actions validate the logged-in user via `auth.api.getSession({ headers })`, trigger localized redirects when unauthenticated, and revalidate affected paths after mutations.

- **Dashboard migrated from placeholder to real CRUD UI**
  - Replaced placeholder `src/app/[locale]/page.tsx` with a working trip dashboard:
    - Reads authenticated user session
    - Lists user trips from database
    - Uses dedicated `CreateTripButton` and `TripCard` components for clearer composition
    - Navigates to trip editor
    - Deletes trips via server action form
  - Added `src/components/trips/delete-trip-button.tsx` (client component) to enforce delete confirmation before submitting.
  - Added:
    - `src/components/trips/create-trip-button.tsx`
    - `src/components/trips/trip-card.tsx`

- **Create-trip route implemented**
  - Replaced placeholder `src/app/[locale]/trips/new/page.tsx` with a real create form:
    - Uses server action (`createTripAndRedirectAction`)
    - Creates new trip and redirects to `/${locale}/trips/{tripId}`
    - Includes localized save/cancel controls

- **Trip editor route wired to database + ownership checks**
  - Replaced placeholder `src/app/[locale]/trips/[tripId]/page.tsx`:
    - Validates route `tripId`
    - Loads authenticated user session
    - Loads trip with relations from DB
    - Blocks cross-user access with `notFound()` when ownership does not match
    - Renders trip summary and header with real data

- **Editable trip header implemented safely**
  - Replaced placeholder `src/components/trips/trip-header.tsx` with client-side editable header:
    - Inline title editing with save on blur/Enter
    - Date range display derived from `startDate + totalDays`
    - Locale-aware date formatting (`es-ES`/`en-US`)
    - Persists title changes through `updateTripTitleAction` (server action), avoiding direct DB imports in client code.

- **Phase 7 test coverage added**
  - Added `src/lib/db/queries/__tests__/trips.test.ts` with mocked Supabase client flow.
  - Covers list/create/update/delete query behavior and query shape expectations without requiring a live database.

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Phase 8: Date Utilities

**Scope:** Port date calculation logic from prototype.

**Prototype Reference:**
- Lines 56-85: Date calculation functions
- Lines 115-178: End date adjustment logic

### Files to Create

**`src/lib/utils/dates.ts`**
```typescript
/**
 * Calculate a date by adding days to a base date.
 * Port of prototype lines 56-61.
 */
export function calculateDate(baseDate: string | null, daysToAdd: number): string | null {
  if (!baseDate) return null
  const date = new Date(baseDate)
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split('T')[0]
}

/**
 * Format a date string for display.
 * Port of prototype lines 63-67.
 */
export function formatDate(dateStr: string | null, locale: string = 'es-ES'): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

/**
 * Calculate total trip duration from destinations.
 * Port of prototype lines 69-71.
 */
export function getTotalDays(destinations: Array<{ duration: number }>): number {
  return destinations.reduce((sum, dest) => sum + (dest.duration || 0), 0)
}

/**
 * Calculate start and end dates for a specific destination.
 * Port of prototype lines 73-85.
 */
export function getDestinationDates(
  startDate: string | null,
  destinations: Array<{ duration: number }>,
  index: number
): { start: string | null; end: string | null } {
  if (!startDate) return { start: null, end: null }

  let dayOffset = 0
  for (let i = 0; i < index; i++) {
    dayOffset += destinations[i].duration || 0
  }

  const start = calculateDate(startDate, dayOffset)
  const end = calculateDate(startDate, dayOffset + (destinations[index].duration || 0))

  return { start, end }
}

/**
 * Validate end date against existing destinations.
 * Port of prototype lines 447-485 (validation logic).
 */
export function validateEndDate(
  startDate: string,
  newEndDate: string,
  currentTotalDays: number
): { valid: boolean; error?: string; difference?: number } {
  const start = new Date(startDate)
  const end = new Date(newEndDate)

  // End date before start date
  if (end < start) {
    return { valid: false, error: 'endDateBeforeStart' }
  }

  const newTotalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const difference = newTotalDays - currentTotalDays

  // End date before last destination
  if (difference < 0) {
    return { valid: false, error: 'endDateCollision', difference }
  }

  return { valid: true, difference }
}
```

### Tests

**`src/lib/utils/__tests__/dates.test.ts`**
```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateDate,
  formatDate,
  getTotalDays,
  getDestinationDates,
  validateEndDate,
} from '../dates'

describe('Date Utilities', () => {
  describe('calculateDate', () => {
    it('adds days to base date', () => {
      expect(calculateDate('2024-01-15', 5)).toBe('2024-01-20')
    })

    it('handles month overflow', () => {
      expect(calculateDate('2024-01-30', 5)).toBe('2024-02-04')
    })

    it('returns null for null input', () => {
      expect(calculateDate(null, 5)).toBeNull()
    })
  })

  describe('formatDate', () => {
    it('formats date in Spanish', () => {
      const result = formatDate('2024-01-15', 'es-ES')
      expect(result).toMatch(/15.*ene/i)
    })

    it('returns empty string for null', () => {
      expect(formatDate(null)).toBe('')
    })
  })

  describe('getTotalDays', () => {
    it('sums destination durations', () => {
      const destinations = [{ duration: 3 }, { duration: 5 }, { duration: 2 }]
      expect(getTotalDays(destinations)).toBe(10)
    })

    it('handles empty array', () => {
      expect(getTotalDays([])).toBe(0)
    })
  })

  describe('getDestinationDates', () => {
    const destinations = [{ duration: 3 }, { duration: 5 }, { duration: 2 }]

    it('calculates first destination dates', () => {
      const result = getDestinationDates('2024-01-15', destinations, 0)
      expect(result.start).toBe('2024-01-15')
      expect(result.end).toBe('2024-01-18')
    })

    it('calculates middle destination dates', () => {
      const result = getDestinationDates('2024-01-15', destinations, 1)
      expect(result.start).toBe('2024-01-18')
      expect(result.end).toBe('2024-01-23')
    })
  })

  describe('validateEndDate', () => {
    it('rejects end date before start date', () => {
      const result = validateEndDate('2024-01-15', '2024-01-10', 5)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('endDateBeforeStart')
    })

    it('rejects end date before current destinations', () => {
      const result = validateEndDate('2024-01-15', '2024-01-18', 5)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('endDateCollision')
    })

    it('accepts valid end date', () => {
      const result = validateEndDate('2024-01-15', '2024-01-25', 5)
      expect(result.valid).toBe(true)
      expect(result.difference).toBe(5)
    })
  })
})
```

### Verification
- [ ] All date calculations match prototype behavior
- [ ] Edge cases handled (month overflow, year change)
- [ ] Locale formatting works for both es/en

### 8.1 Implementation Summary (Completed on February 3, 2026)

Phase 8 has been implemented with production-ready date helpers ported from the prototype and validated with focused unit coverage.

**What was completed:**

- **Date utilities fully implemented**
  - Replaced the placeholder in `src/lib/utils/dates.ts` with the full Phase 8 utility set:
    - `calculateDate(baseDate, daysToAdd)`
    - `formatDate(dateStr, locale?)`
    - `getTotalDays(destinations)`
    - `getDestinationDates(startDate, destinations, index)`
    - `validateEndDate(startDate, newEndDate, currentTotalDays)`
  - Kept behavior aligned with prototype date math and end-date collision rules.
  - Added explicit `EndDateValidationError` typing (`endDateBeforeStart`, `endDateCollision`) for safer downstream usage.

- **Phase 8 test coverage added**
  - Added `src/lib/utils/__tests__/dates.test.ts` with coverage for:
    - day addition logic
    - month and year overflow
    - Spanish (default) and English locale formatting
    - destination duration totals
    - destination range calculations
    - end-date validation for invalid, collision, and valid cases

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Phase 9: Destinations CRUD

**Scope:** Database operations and UI for destinations.

**Prototype Reference:**
- Lines 180-197: Add destination
- Lines 199-227: Save destination
- Lines 234-247: Delete destination
- Lines 253-274: Drag-drop reorder

### Files to Create

**`src/lib/db/queries/destinations.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Destination } from '@/types/database'

export async function getDestinationsByTrip(tripId: number): Promise<Destination[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tripaivisor.destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('position', { ascending: true })

  if (error) throw error
  return data
}

export async function createDestination(
  tripId: number,
  city: string,
  duration: number,
  position: number
): Promise<Destination> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tripaivisor.destinations')
    .insert({ trip_id: tripId, city, duration, position })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDestination(
  destinationId: number,
  updates: Partial<Pick<Destination, 'city' | 'duration' | 'position' | 'notes' | 'budget'>>
): Promise<Destination> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tripaivisor.destinations')
    .update(updates)
    .eq('destination_id', destinationId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDestination(destinationId: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tripaivisor.destinations')
    .delete()
    .eq('destination_id', destinationId)

  if (error) throw error
}

/**
 * Reorder destinations after drag-drop.
 * Port of prototype lines 263-274.
 */
export async function reorderDestinations(
  tripId: number,
  orderedIds: number[]
): Promise<void> {
  const supabase = await createClient()

  // Update positions in a transaction-like manner
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('tripaivisor.destinations')
      .update({ position: index })
      .eq('destination_id', id)
      .eq('trip_id', tripId)
  )

  await Promise.all(updates)
}
```

**`src/components/trips/destination-list.tsx`** - With drag-drop
Port from prototype lines 609-636 (destination mapping with drag events)
```typescript
'use client'
import { useState } from 'react'
import { DestinationCard } from './destination-card'
import { reorderDestinations } from '@/lib/db/queries/destinations'
import type { DestinationWithRelations } from '@/types/database'

interface DestinationListProps {
  tripId: number
  destinations: DestinationWithRelations[]
  startDate: string | null
}

export function DestinationList({ tripId, destinations, startDate }: DestinationListProps) {
  const [items, setItems] = useState(destinations)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Port from prototype lines 253-256
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Port from prototype lines 258-261
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Port from prototype lines 263-274
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newItems = [...items]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(dropIndex, 0, draggedItem)

    setItems(newItems)
    setDraggedIndex(null)

    // Persist to database
    await reorderDestinations(tripId, newItems.map(d => d.destination_id))
  }

  return (
    <div className="space-y-4">
      {items.map((dest, index) => (
        <div
          key={dest.destination_id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <DestinationCard
            destination={dest}
            startDate={startDate}
            destinations={items}
            index={index}
            isDragging={draggedIndex === index}
          />
        </div>
      ))}
    </div>
  )
}
```

### Tests

**`src/lib/db/queries/__tests__/destinations.test.ts`**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDestination, getDestinationsByTrip, updateDestination, deleteDestination, reorderDestinations } from '../destinations'

describe('Destination Queries', () => {
  const testTripId = 1 // Assume test trip exists
  let testDestId: number

  beforeEach(async () => {
    const dest = await createDestination(testTripId, 'Test City', 3, 0)
    testDestId = dest.destination_id
  })

  afterEach(async () => {
    try { await deleteDestination(testDestId) } catch {}
  })

  it('creates destination with correct data', async () => {
    const dest = await createDestination(testTripId, 'Madrid', 5, 1)
    expect(dest.city).toBe('Madrid')
    expect(dest.duration).toBe(5)
    await deleteDestination(dest.destination_id)
  })

  it('retrieves destinations ordered by position', async () => {
    await createDestination(testTripId, 'First', 2, 0)
    await createDestination(testTripId, 'Second', 3, 1)

    const destinations = await getDestinationsByTrip(testTripId)
    expect(destinations[0].city).toBe('First')
    expect(destinations[1].city).toBe('Second')
  })

  it('updates destination fields', async () => {
    const updated = await updateDestination(testDestId, { city: 'Barcelona', duration: 4 })
    expect(updated.city).toBe('Barcelona')
    expect(updated.duration).toBe(4)
  })

  it('reorders destinations correctly', async () => {
    const d1 = await createDestination(testTripId, 'A', 1, 0)
    const d2 = await createDestination(testTripId, 'B', 1, 1)

    await reorderDestinations(testTripId, [d2.destination_id, d1.destination_id])

    const reordered = await getDestinationsByTrip(testTripId)
    expect(reordered[0].city).toBe('B')
    expect(reordered[1].city).toBe('A')
  })
})
```

### Verification
- [ ] Add destination inserts with correct position
- [ ] Edit destination updates all fields
- [ ] Delete destination removes from database
- [ ] Drag-drop reorder persists correctly
- [ ] Position order maintained on reload

### 9.1 Implementation Summary (Completed on February 3, 2026)

Phase 9 has been implemented with destination CRUD queries, authenticated server actions, and a drag-drop editor UI integrated into the trip page.

**What was completed:**

- **Destination query layer implemented**
  - Replaced placeholder `src/lib/db/queries/destinations.ts` with full destination operations:
    - `getDestinationsByTrip(tripId)`
    - `createDestination(tripId, city, duration, position?)`
    - `updateDestination(destinationId, updates, tripId?)`
    - `deleteDestination(destinationId, tripId?)`
    - `reorderDestinations(tripId, orderedIds)`
  - Added data normalization/validation for city, duration, position, and budget.
  - Implemented automatic position assignment when creating new destinations without an explicit position.
  - Hardened reorder flow with duplicate-id validation and deterministic per-row updates.

- **Authenticated destination server actions added**
  - Added `src/app/actions/destinations.ts` with:
    - `createDestinationAction`
    - `updateDestinationAction`
    - `deleteDestinationAction`
    - `reorderDestinationsAction`
  - Actions validate session presence through Better Auth, enforce payload sanity checks, and revalidate both dashboard and trip-editor paths after mutations.

- **Destination UI implemented with drag-drop + CRUD controls**
  - Replaced placeholder `src/components/trips/destination-list.tsx` with a client destination manager that supports:
    - adding destinations
    - inline editing (city, duration, notes, budget)
    - deleting destinations with confirmation
    - drag-drop reordering with optimistic UI + rollback on failure
  - Replaced placeholder `src/components/trips/destination-card.tsx` with a real presentational card showing:
    - position/city
    - duration
    - computed date range from trip start date
    - notes and budget preview

- **Trip editor integration completed**
  - Updated `src/app/[locale]/trips/[tripId]/page.tsx` to render `DestinationList` with current trip destinations so Phase 9 flows are accessible in the existing editor route.

- **Phase 9 tests added**
  - Added `src/lib/db/queries/__tests__/destinations.test.ts` with mocked Supabase client coverage for:
    - list ordering
    - destination creation
    - destination updates
    - destination deletion
    - reorder position updates

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Phase 10: Transports & Accommodations CRUD

**Scope:** Database operations for transport and accommodation data.

**Prototype Reference:**
- Lines 1131-1200: Transport form fields
- Lines 1219-1280: Accommodation form fields

### Files to Create

**`src/lib/db/queries/transports.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Transport, TransportType, TransportRole } from '@/types/database'

export async function getTransportByDestination(destinationId: number): Promise<Transport | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tripaivisor.transports')
    .select('*')
    .eq('destination_id', destinationId)
    .single()
  return data
}

export async function getTripTransports(tripId: number): Promise<{ departure: Transport | null; return: Transport | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tripaivisor.transports')
    .select('*')
    .eq('trip_id', tripId)

  return {
    departure: data?.find(t => t.transport_role === 'departure') || null,
    return: data?.find(t => t.transport_role === 'return') || null,
  }
}

export async function upsertTransport(transport: {
  destination_id?: number
  trip_id?: number
  transport_role: TransportRole
  transport_type?: TransportType
  leave_accommodation_time?: string
  terminal?: string
  company?: string
  booking_number?: string
  booking_code?: string
  departure_time?: string
}): Promise<Transport> {
  const supabase = await createClient()

  // Check if transport exists
  const query = transport.destination_id
    ? supabase.from('tripaivisor.transports').select('*').eq('destination_id', transport.destination_id)
    : supabase.from('tripaivisor.transports').select('*').eq('trip_id', transport.trip_id).eq('transport_role', transport.transport_role)

  const { data: existing } = await query.single()

  if (existing) {
    const { data, error } = await supabase
      .from('tripaivisor.transports')
      .update(transport)
      .eq('transport_id', existing.transport_id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('tripaivisor.transports')
      .insert(transport)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
```

**`src/lib/db/queries/accommodations.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Accommodation } from '@/types/database'

export async function getAccommodationByDestination(destinationId: number): Promise<Accommodation | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tripaivisor.accommodations')
    .select('*')
    .eq('destination_id', destinationId)
    .single()
  return data
}

export async function upsertAccommodation(accommodation: {
  destination_id: number
  name?: string
  check_in?: string
  check_out?: string
  booking_link?: string
  booking_code?: string
  address?: string
}): Promise<Accommodation> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('tripaivisor.accommodations')
    .select('*')
    .eq('destination_id', accommodation.destination_id)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('tripaivisor.accommodations')
      .update(accommodation)
      .eq('accommodation_id', existing.accommodation_id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('tripaivisor.accommodations')
      .insert(accommodation)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
```

### Tests

**`src/lib/db/queries/__tests__/transports.test.ts`**
```typescript
import { describe, it, expect } from 'vitest'
import { upsertTransport, getTransportByDestination, getTripTransports } from '../transports'

describe('Transport Queries', () => {
  it('creates transport for destination', async () => {
    const transport = await upsertTransport({
      destination_id: 1,
      transport_role: 'destination',
      transport_type: 'plane',
      company: 'Iberia',
    })
    expect(transport.company).toBe('Iberia')
  })

  it('updates existing transport', async () => {
    await upsertTransport({
      destination_id: 1,
      transport_role: 'destination',
      transport_type: 'plane',
    })

    const updated = await upsertTransport({
      destination_id: 1,
      transport_role: 'destination',
      company: 'Ryanair',
    })

    expect(updated.company).toBe('Ryanair')
  })

  it('creates departure transport for trip', async () => {
    const transport = await upsertTransport({
      trip_id: 1,
      transport_role: 'departure',
      transport_type: 'plane',
    })
    expect(transport.transport_role).toBe('departure')
  })
})
```

### Verification
- [ ] Transport saves for destinations
- [ ] Departure/return transports save to trip
- [ ] Accommodation saves for destinations
- [ ] Upsert logic works (create or update)

### 10.1 Implementation Summary (Completed on February 3, 2026)

Phase 10 has been implemented with production-safe transport/accommodation query layers, parent-context validation, and focused unit coverage.

**What was completed:**

- **Transport query layer implemented**
  - Replaced placeholder `src/lib/db/queries/transports.ts` with:
    - `getTransportByDestination(destinationId)`
    - `getTripTransports(tripId)`
    - `upsertTransport(input)`
  - Added strict parent-context validation so a transport must target exactly one parent (`destination_id` XOR `trip_id`) and role combinations remain valid (`destination` vs `departure/return`).
  - Added normalization for optional text/time fields (`trim`, empty-string-to-`null`) and default `transport_type='plane'` on inserts when omitted.
  - Implemented safe not-found handling for `.single()` reads using Supabase `PGRST116` semantics (returns `null` instead of throwing for missing rows).

- **Accommodation query layer implemented**
  - Replaced placeholder `src/lib/db/queries/accommodations.ts` with:
    - `getAccommodationByDestination(destinationId)`
    - `upsertAccommodation(input)`
  - Added positive-id validation, optional field normalization, and not-found handling aligned with transport query behavior.
  - Implemented create-or-update behavior keyed by unique `destination_id`, updating only provided fields and preserving existing values when no update payload is supplied.

- **Phase 10 test coverage added**
  - Added `src/lib/db/queries/__tests__/transports.test.ts` with mocked Supabase client coverage for:
    - destination transport retrieval
    - trip departure/return retrieval
    - insert path when no existing transport exists
    - update path when transport already exists
  - Added `src/lib/db/queries/__tests__/accommodations.test.ts` with mocked coverage for:
    - destination accommodation retrieval
    - not-found return path
    - insert path
    - update path

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Phase 11: Destination Card & Modal Components

**Scope:** UI components for viewing and editing destinations.

**Prototype Reference:**
- Lines 748-1016: TripCard component
- Lines 1018-1343: EditModal component

### Files to Create

**`src/components/trips/destination-card.tsx`**
Port TripCard from prototype lines 748-1016:
- Icon rendering (lines 749-755)
- Field previews (lines 767-809)
- Expanded view (lines 944-1011)
- Action menu (lines 857-896)

**`src/components/trips/destination-modal.tsx`**
Port EditModal from prototype lines 1018-1343:
- Form state (lines 1019-1023)
- Transport fields (lines 1131-1200)
- Accommodation fields (lines 1219-1280)
- Additional fields (lines 1298-1320)
- Validation (lines 1053-1062)

### Tests

**`src/components/trips/__tests__/destination-card.test.tsx`**
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DestinationCard } from '../destination-card'

describe('DestinationCard', () => {
  const mockDestination = {
    destination_id: 1,
    trip_id: 1,
    city: 'Madrid',
    duration: 5,
    position: 0,
    notes: null,
    budget: null,
    transport: { transport_type: 'plane', company: 'Iberia' },
    accommodation: { name: 'Hotel Example' },
  }

  it('displays city name', () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(screen.getByText('Madrid')).toBeInTheDocument()
  })

  it('displays duration', () => {
    render(<DestinationCard destination={mockDestination} />)
    expect(screen.getByText(/5 días/)).toBeInTheDocument()
  })

  it('shows transport icon when transport exists', () => {
    render(<DestinationCard destination={mockDestination} />)
    // Assert plane icon is rendered
  })
})
```

### Verification
- [ ] Card displays all destination info
- [ ] Expand/collapse works
- [ ] Edit opens modal with correct data
- [ ] Delete shows confirmation
- [ ] Modal form saves all fields

### 11.1 Implementation Summary (Completed on February 3, 2026)

Phase 11 has been implemented with a production-ready destination card + modal workflow, including end-to-end persistence for destination, transport, and accommodation fields.

**What was completed:**

- **Destination card rebuilt from prototype behavior**
  - Replaced `src/components/trips/destination-card.tsx` with a richer UI that now includes:
    - transport/accommodation icon rendering
    - compact field previews in collapsed mode
    - expandable detailed view for transport, accommodation, notes, and budget
    - card drag affordance styling
    - per-card action menu (`Editar`/`Eliminar`) aligned with prototype interactions
  - Added deterministic content checks so transport/accommodation blocks render only when meaningful values exist.

- **Destination modal fully implemented**
  - Replaced placeholder `src/components/trips/destination-modal.tsx` with a complete edit modal that ports the requested prototype sections:
    - base destination fields (`city`, `duration`)
    - transport section (type, times, terminal, company, booking fields)
    - accommodation section (check-in/out, name, link, code, address)
    - additional section (notes, budget)
  - Added client-side validation for required city, minimum duration, and numeric budget parsing.
  - Added locale-aware ES/EN labels and CTA copy across modal controls.

- **Destination list migrated from inline edit to card+modal flow**
  - Updated `src/components/trips/destination-list.tsx` to:
    - keep drag-drop reorder behavior from Phase 9
    - open destination edits in the new modal instead of inline form fields
    - support per-card expand/collapse state
    - support action-menu open/close behavior with outside-click close
    - keep add/delete destination flows and delete confirmation
  - Wired modal save + cancel lifecycle to the list with optimistic UI updates and error feedback.

- **Server action added for full modal persistence**
  - Updated `src/app/actions/destinations.ts` with `saveDestinationDetailsAction(...)`.
  - New action now persists:
    - destination core fields via `updateDestination(...)`
    - destination transport via `upsertTransport(...)`
    - destination accommodation via `upsertAccommodation(...)`
  - Added conditional persistence checks to avoid creating empty transport/accommodation rows when no values exist, while still updating existing rows when needed.

- **Phase 11 test coverage added**
  - Added `src/components/trips/__tests__/destination-card.test.tsx` with coverage for:
    - city rendering
    - duration rendering
    - transport icon rendering when transport data exists

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Phase 12: Sharing Functionality

**Scope:** Generate and access view-only trip links.

**Prototype Reference:**
- Sharing is a new feature, not in prototype

**Libraries:**
- `nanoid` - URL-safe unique ID generation

### Files to Create

**`src/lib/db/queries/shares.ts`**
```typescript
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TripShare, TripWithRelations } from '@/types/database'

export async function createShareLink(tripId: number): Promise<{ shareUrl: string; shareToken: string }> {
  const supabase = await createClient()
  const shareToken = nanoid(12) // URL-safe, 12 chars

  const { error } = await supabase
    .from('tripaivisor.trip_shares')
    .insert({ trip_id: tripId, share_token: shareToken })

  if (error) throw error

  return {
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareToken}`,
    shareToken,
  }
}

export async function getSharedTrip(shareToken: string): Promise<TripWithRelations | null> {
  const supabase = createAdminClient() // Bypass RLS

  // Get share record
  const { data: share } = await supabase
    .from('tripaivisor.trip_shares')
    .select('trip_id, is_active, expires_at')
    .eq('share_token', shareToken)
    .single()

  if (!share || !share.is_active) return null

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) return null

  // Get full trip data
  const { data: trip } = await supabase
    .from('tripaivisor.trips')
    .select(`
      *,
      destinations:tripaivisor.destinations(
        *,
        transport:tripaivisor.transports(*),
        accommodation:tripaivisor.accommodations(*)
      )
    `)
    .eq('trip_id', share.trip_id)
    .single()

  return trip
}

export async function deactivateShareLink(shareId: number): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('tripaivisor.trip_shares')
    .update({ is_active: false })
    .eq('share_id', shareId)
}
```

**`src/app/[locale]/share/[shareId]/page.tsx`**
```typescript
import { getSharedTrip } from '@/lib/db/queries/shares'
import { TripViewOnly } from '@/components/trips/trip-view-only'
import { notFound } from 'next/navigation'

export default async function SharedTripPage({
  params,
}: {
  params: { shareId: string }
}) {
  const trip = await getSharedTrip(params.shareId)

  if (!trip) {
    notFound()
  }

  return <TripViewOnly trip={trip} />
}
```

**`src/components/trips/share-modal.tsx`**
```typescript
'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createShareLink } from '@/lib/db/queries/shares'

export function ShareModal({ tripId, open, onClose }: { tripId: number; open: boolean; onClose: () => void }) {
  const t = useTranslations('share')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    const { shareUrl } = await createShareLink(tripId)
    setShareUrl(shareUrl)
    setLoading(false)
  }

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {!shareUrl ? (
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? '...' : t('generateLink')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly />
            <Button onClick={handleCopy} variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{t('viewOnly')}</p>
      </DialogContent>
    </Dialog>
  )
}
```

### Tests

**`src/lib/db/queries/__tests__/shares.test.ts`**
```typescript
import { describe, it, expect } from 'vitest'
import { createShareLink, getSharedTrip, deactivateShareLink } from '../shares'

describe('Share Queries', () => {
  it('creates share link with unique token', async () => {
    const { shareToken, shareUrl } = await createShareLink(1)
    expect(shareToken).toHaveLength(12)
    expect(shareUrl).toContain(shareToken)
  })

  it('retrieves trip by share token', async () => {
    const { shareToken } = await createShareLink(1)
    const trip = await getSharedTrip(shareToken)
    expect(trip).not.toBeNull()
    expect(trip?.trip_id).toBe(1)
  })

  it('returns null for invalid token', async () => {
    const trip = await getSharedTrip('invalid-token')
    expect(trip).toBeNull()
  })

  it('returns null for deactivated share', async () => {
    const { shareToken } = await createShareLink(1)
    // Deactivate
    // ...
    const trip = await getSharedTrip(shareToken)
    expect(trip).toBeNull()
  })
})
```

### Verification
- [ ] Share link generates unique token
- [ ] Shared trip accessible without auth
- [ ] Shared view is read-only (no edit buttons)
- [ ] Invalid tokens show 404
- [ ] Expired shares show 404

### 12.1 Implementation Summary (Completed on February 3, 2026)

Phase 12 has been implemented with end-to-end share link generation, public read-only rendering, and ownership-aware server-side controls.

**What was completed:**

- **Share query layer implemented**
  - Replaced placeholder `src/lib/db/queries/shares.ts` with production query logic:
    - `createShareLink(tripId, locale?)`
    - `getSharedTrip(shareToken)`
    - `deactivateShareLink(shareId)`
  - Added 12-character token generation via `nanoid`.
  - Added unique-token retry handling for collision safety.
  - Added environment-safe share URL generation via `NEXT_PUBLIC_APP_URL` (fallback to `BETTER_AUTH_URL`).
  - Implemented share token validation, active-state checks, and expiration checks.
  - Implemented admin-client trip hydration (trip + destinations + destination transport/accommodation + departure/return transport) for public shared views.

- **Server action layer added for secure share generation**
  - Added `src/app/actions/shares.ts` with:
    - `createShareLinkAction(...)`
    - `deactivateShareLinkAction(...)`
  - Actions enforce authenticated access through Better Auth session checks and locale-safe redirects.

- **Share API route implemented**
  - Replaced placeholder `src/app/api/trips/[tripId]/share/route.ts` with a working `POST` endpoint.
  - Added auth guard, trip-id validation, optional locale handling, and JSON response payload for generated links.

- **Trip editor UI integrated with sharing**
  - Added `src/components/trips/share-modal.tsx`:
    - generate share link action
    - copy-to-clipboard interaction
    - loading/success/error states
    - view-only message for recipients
  - Updated `src/components/trips/trip-header.tsx` to include a localized Share button and modal wiring.

- **Public read-only shared page implemented**
  - Replaced placeholder `src/app/[locale]/share/[shareId]/page.tsx`:
    - fetches shared trip by token
    - returns `notFound()` for invalid/inactive/expired tokens
    - renders read-only trip content
  - Added `src/components/trips/trip-view-only.tsx` to display itinerary data without edit controls.

- **i18n + test coverage added**
  - Updated `src/messages/es.json` and `src/messages/en.json` with share UI keys:
    - `share.open`
    - `share.generateLink`
  - Added `src/lib/db/queries/__tests__/shares.test.ts` with coverage for:
    - share link generation output
    - invalid token handling
    - active shared-trip retrieval
    - deactivation updates

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Phase 13: Import/Export

**Scope:** JSON import/export for data portability.

**Prototype Reference:**
- Lines 276-297: Export function
- Lines 299-317: Import function

### Files to Create

**`src/lib/utils/import-export.ts`**
```typescript
import type { TripWithRelations } from '@/types/database'

/**
 * Export format matches prototype for backwards compatibility.
 * See prototype lines 276-287.
 */
export interface ExportedTrip {
  title: string
  startDate: string | null
  departure: {
    type: 'departure'
    city: string
    date: string | null
    transport: Record<string, any>
  } | null
  destinations: Array<{
    id: string
    city: string
    duration: number
    transport: Record<string, any>
    accommodation: Record<string, any>
    notes: string
    budget: number | null
  }>
  return: {
    type: 'return'
    city: string
    transport: Record<string, any>
  } | null
}

export function exportTrip(trip: TripWithRelations): ExportedTrip {
  return {
    title: trip.title,
    startDate: trip.start_date,
    departure: trip.departure_transport ? {
      type: 'departure',
      city: trip.departure_city,
      date: trip.start_date,
      transport: {
        type: trip.departure_transport.transport_type,
        leaveAccommodationTime: trip.departure_transport.leave_accommodation_time,
        terminal: trip.departure_transport.terminal,
        company: trip.departure_transport.company,
        bookingNumber: trip.departure_transport.booking_number,
        bookingCode: trip.departure_transport.booking_code,
        departureTime: trip.departure_transport.departure_time,
      },
    } : null,
    destinations: trip.destinations.map(d => ({
      id: String(d.destination_id),
      city: d.city,
      duration: d.duration,
      transport: d.transport ? {
        type: d.transport.transport_type,
        leaveAccommodationTime: d.transport.leave_accommodation_time,
        terminal: d.transport.terminal,
        company: d.transport.company,
        bookingNumber: d.transport.booking_number,
        bookingCode: d.transport.booking_code,
        departureTime: d.transport.departure_time,
      } : {},
      accommodation: d.accommodation ? {
        checkIn: d.accommodation.check_in,
        checkOut: d.accommodation.check_out,
        name: d.accommodation.name,
        bookingLink: d.accommodation.booking_link,
        bookingCode: d.accommodation.booking_code,
        address: d.accommodation.address,
      } : {},
      notes: d.notes || '',
      budget: d.budget,
    })),
    return: trip.return_transport ? {
      type: 'return',
      city: trip.return_city || trip.departure_city,
      transport: {
        type: trip.return_transport.transport_type,
        // ... same fields
      },
    } : null,
  }
}

export function validateImportData(data: unknown): data is ExportedTrip {
  if (!data || typeof data !== 'object') return false
  const d = data as any
  return typeof d.title === 'string' && Array.isArray(d.destinations)
}
```

### Tests

**`src/lib/utils/__tests__/import-export.test.ts`**
```typescript
import { describe, it, expect } from 'vitest'
import { exportTrip, validateImportData } from '../import-export'

describe('Import/Export', () => {
  describe('exportTrip', () => {
    it('exports trip in prototype-compatible format', () => {
      const trip = {
        trip_id: 1,
        title: 'Test Trip',
        start_date: '2024-01-15',
        departure_city: 'Buenos Aires',
        destinations: [
          { destination_id: 1, city: 'Madrid', duration: 5, transport: null, accommodation: null }
        ],
        departure_transport: null,
        return_transport: null,
      }

      const exported = exportTrip(trip as any)
      expect(exported.title).toBe('Test Trip')
      expect(exported.startDate).toBe('2024-01-15')
      expect(exported.destinations[0].city).toBe('Madrid')
    })
  })

  describe('validateImportData', () => {
    it('validates correct data', () => {
      const data = { title: 'Trip', startDate: null, destinations: [] }
      expect(validateImportData(data)).toBe(true)
    })

    it('rejects invalid data', () => {
      expect(validateImportData(null)).toBe(false)
      expect(validateImportData({ title: 123 })).toBe(false)
    })
  })
})
```

### Verification
- [ ] Export produces valid JSON
- [ ] Exported format matches prototype
- [ ] Import validates data structure
- [ ] Import creates trip with all nested data
- [ ] Can import prototype localStorage data

### 13.1 Implementation Summary (Completed on February 3, 2026)

Phase 13 has been implemented with production-ready JSON import/export utilities, secure server-side import orchestration, and UI entrypoints for both export and import flows.

**What was completed:**

- **Import/export utility implemented**
  - Added `src/lib/utils/import-export.ts` with:
    - strict `ExportedTrip` family interfaces (`ExportedTransport`, `ExportedAccommodation`, destination/departure/return contracts)
    - `exportTrip(trip)` mapper that converts DB snake_case fields to the prototype-compatible JSON shape
    - `validateImportData(data)` runtime validator for import payload safety
  - Validation now checks nested structures (destinations, transport/accommodation maps, departure/return objects), not just top-level keys.

- **Server action import pipeline implemented**
  - Extended `src/app/actions/trips.ts` with `importTripFromDataAction({ locale, data })`.
  - Flow now:
    - authenticates user via existing Better Auth guard
    - validates payload with `validateImportData`
    - creates a new trip
    - imports trip metadata (`title`, `start_date`, `departure_city`, `return_city`)
    - imports destination rows in order
    - imports destination notes/budget
    - imports destination transport/accommodation records
    - imports departure/return transport records
  - Added pragmatic normalization/guardrails (string trimming, duration normalization, max destination cap, safe defaults).

- **UI integration completed**
  - Added `src/components/trips/import-trip-button.tsx`:
    - client-side JSON file selection
    - JSON parse + shape validation before submit
    - server action call to import into DB
    - redirect to imported trip editor on success
    - localized error handling for invalid JSON/format/import failures
  - Updated `src/app/[locale]/page.tsx` to show **Import JSON** next to **New Trip**.
  - Updated `src/components/trips/trip-header.tsx` to add **Export JSON** action that downloads prototype-compatible JSON.
  - Updated `src/app/[locale]/trips/[tripId]/page.tsx` to provide exported payload from server trip data for the export button.

- **i18n and test coverage updated**
  - Added translation keys in:
    - `src/messages/es.json`
    - `src/messages/en.json`
    - keys: `trips.import`, `trips.importing`, `trips.export`
  - Added `src/lib/utils/__tests__/import-export.test.ts` with coverage for:
    - export format mapping
    - prototype localStorage-style payload validation
    - invalid payload rejection

- **Verification executed**
  - `npm run lint` ✅ (no ESLint warnings/errors)
  - `npm run build` ✅ (production build + type checks passed)

---

## Key Logic to Port from Prototype

| Feature | Prototype Lines | Target Phase | Target File |
|---------|----------------|--------------|-------------|
| Date calculations | 56-85 | Phase 8 | `src/lib/utils/dates.ts` |
| Destination dates | 73-85 | Phase 8 | `src/lib/utils/dates.ts` |
| End date validation | 115-178, 447-485 | Phase 8 | `src/lib/utils/dates.ts` |
| Drag-drop handlers | 253-274 | Phase 9 | `destination-list.tsx` |
| Export data | 276-287 | Phase 13 | `src/lib/utils/import-export.ts` |
| Import data | 299-317 | Phase 13 | `src/lib/utils/import-export.ts` |
| TripCard component | 748-1016 | Phase 11 | `destination-card.tsx` |
| EditModal form | 1018-1343 | Phase 11 | `destination-modal.tsx` |
| Transport form fields | 1131-1200 | Phase 11 | `destination-modal.tsx` |
| Accommodation form fields | 1219-1280 | Phase 11 | `destination-modal.tsx` |
| UI strings (Spanish) | Throughout | Phase 6 | `src/messages/es.json` |

---

## Testing Strategy

### Test Configuration

**`vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**`src/test/setup.ts`**
```typescript
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
```

### Install Test Dependencies
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

### Run Tests
```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage
```

---

## Phase Verification Summary

| Phase | Scope | Key Tests | Verification |
|-------|-------|-----------|--------------|
| 3 | Supabase Clients | Client creation | Clients connect successfully |
| 4 | Authentication | Config, login render | Google OAuth flow works |
| 5 | Middleware | Route protection | Auth + locale routing |
| 6 | i18n | Locale switcher | All strings translated |
| 7 | Trip CRUD | Create, read, update, delete | Data persists correctly |
| 8 | Date Utils | All date functions | Matches prototype behavior |
| 9 | Destinations | CRUD + reorder | Position order maintained |
| 10 | Transport/Accommodation | Upsert logic | Data saves correctly |
| 11 | Card + Modal | Render, edit flow | UI matches prototype |
| 12 | Sharing | Token gen, access | View-only, no auth required |
| 13 | Import/Export | Format validation | Backwards compatible |

---

## Final Verification Checklist

### Phase 3: Supabase
- [ ] Browser client creates successfully
- [ ] Server client reads cookies
- [ ] Admin client bypasses RLS

### Phase 4: Authentication
- [ ] Login page renders
- [ ] Google OAuth redirects work
- [ ] Session cookie set after login
- [ ] User stored in `tripaivisor.users`

### Phase 5: Middleware
- [ ] Unauthenticated → redirect to login
- [ ] `/share/*` accessible without auth
- [ ] Locale prefix applied

### Phase 6: i18n
- [ ] Spanish (default) displays
- [ ] English displays
- [ ] Locale switcher changes content

### Phase 7: Trip CRUD
- [ ] Create trip
- [ ] List user trips
- [ ] Edit title/dates
- [ ] Delete trip

### Phase 8: Date Utils
- [ ] calculateDate matches prototype
- [ ] formatDate works for es/en
- [ ] getDestinationDates correct
- [ ] validateEndDate correct

### Phase 9: Destinations
- [ ] Add destination
- [ ] Edit destination
- [ ] Delete destination
- [ ] Drag-drop reorder persists

### Phase 10: Transport/Accommodation
- [ ] Create transport
- [ ] Update transport
- [ ] Create accommodation
- [ ] Update accommodation

### Phase 11: Card + Modal
- [ ] Card shows all info
- [ ] Expand/collapse works
- [ ] Modal opens with data
- [ ] Modal saves changes

### Phase 12: Sharing
- [ ] Generate share link
- [ ] Access shared trip
- [ ] View-only (no edit)
- [ ] Invalid token → 404

### Phase 13: Import/Export
- [ ] Export valid JSON
- [ ] Format matches prototype
- [ ] Import validates data
- [ ] Import creates complete trip

---

## Files to Delete After Migration

- `travel-planner.tsx` (prototype - keep as reference initially)
