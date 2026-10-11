# Ledger

Paper trading with live prices. Real US stocks, real-time quotes, real charts. The only fake part is the money: an admin adds funds to each account.

- Buy and sell any listed US stock or ETF, by dollars or by shares, at the live market price
- Robinhood-style charts with hover scrubbing across 1D, 1W, 1M, 3M, 1Y, and 5Y
- A portfolio chart rebuilt from your trade history and real past prices
- Watchlist, order history, and an admin page for funding accounts

## Stack

- Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4
- Supabase for auth and Postgres, with Row Level Security
- Alpaca Market Data, free IEX feed, for quotes, bars, and the ticker list
- TradingView Lightweight Charts

## Setup

You need Node 20+, a Supabase project, and an Alpaca account. Both accounts are free and take a few minutes.

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the Project URL, the anon key, and the service role key.
3. In **Authentication → Sign In / Providers → Email**, turn off **Confirm email** if you want sign-up to work without an email round trip.
4. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000`.
5. In **SQL Editor**, run each file in `supabase/migrations/` in order:
   - `0001_init.sql`: tables, Row Level Security, and the new-user trigger
   - `0002_execute_trade.sql`: the function that settles trades
   - `0003_admin_add_funds.sql`: the function admins use to add cash

### 2. Alpaca

1. Sign up at [alpaca.markets](https://alpaca.markets). No funding is needed.
2. Switch to the **Paper Trading** account and generate API keys. The secret is shown once.

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in the five values: the three Supabase keys and the two Alpaca keys.

### 4. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and create an account. Then make yourself an admin in the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Refresh the app, open **Admin** from the account menu, and add funds to any account, including your own.

If you created an account before running `0001_init.sql`, it has no profile yet. This fixes it:

```sql
insert into public.profiles (id, email, display_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests for order math and portfolio history |

## How it works

**Prices.** The server talks to Alpaca; API keys never reach the browser. Quotes are cached for 3 seconds and identical requests share one upstream call, so many open tabs stay well under Alpaca's 200 requests a minute. Browsers poll every 4 seconds while the market is open and every 30 seconds when it's closed, and stop in background tabs.

**Trades.** The browser only says what you want, like "buy $50 of AAPL". The server fetches a fresh price, works out the exact shares with `lib/trading/order.ts`, and settles the order through the `execute_trade` SQL function. That function locks your account row and moves cash and shares in one transaction, and only the server's service key can call it, so balances can't be edited from the browser.

**Funding.** `admin_add_funds` runs with the admin's own session, checks their role in the database, and writes the balance change and the audit row together.

**Portfolio chart.** Your value over time isn't stored. It's rebuilt by starting from today's cash and holdings, undoing each order and deposit newest first, and pricing what you held at each moment with real historical bars (`lib/portfolio/history.ts`).

## Project layout

```
app/
  (auth)/          sign in, sign up
  (app)/           portfolio home, stock pages, history, admin
  api/             market data, portfolio history, trades
components/        UI, chart, trade panel, portfolio lists
lib/
  market/          Alpaca client, caching, quotes, bars, search
  trading/         order math, trade execution
  portfolio/       holdings, history rebuild, activity
  admin/           admin data and actions
supabase/migrations/   SQL to run in order
```

Market data comes from the IEX exchange feed, which covers a share of total US volume. Prices are real and current; volume figures reflect IEX trades only.
