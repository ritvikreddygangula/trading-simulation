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
