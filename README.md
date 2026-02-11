# TripAIvisor

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start local Supabase and run migrations

Prerequisites: Docker + Supabase CLI.

```bash
supabase start
supabase db reset
```

`supabase db reset` applies all files in `supabase/migrations/` to your local database.

### 3) Run the app

```bash
npm run dev
```

The app runs on `http://localhost:5127`.

