# Ledger

Paper trading with live prices. Real US stocks, real-time quotes and charts. The only fake part is the money: an admin funds each account.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS 4
- Supabase for auth and Postgres
- Alpaca Market Data (free IEX feed) for quotes and price history

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in your Supabase and Alpaca keys
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. Create a project at supabase.com.
2. Copy the Project URL, anon key, and service role key from **Project Settings → API** into `.env.local`.
3. Open **SQL Editor**, paste `supabase/migrations/0001_init.sql`, and run it. Run each new file in `supabase/migrations/` in order as later branches add them.
4. Sign up in the app, then make yourself admin in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
