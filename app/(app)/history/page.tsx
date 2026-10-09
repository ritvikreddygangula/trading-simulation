import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { formatShares, formatUsd } from "@/lib/format";
import { loadActivity, type Activity } from "@/lib/portfolio/activity";

export const metadata: Metadata = { title: "History" };

const when = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-price">History</h1>
      <p className="mt-3 text-muted">Every order you&apos;ve placed and every deposit to your account.</p>
      <Suspense fallback={<div aria-hidden className="mt-10 h-64 animate-pulse rounded-2xl bg-surface" />}>
        <ActivityList />
      </Suspense>
    </div>
  );
}

async function ActivityList() {
  const profile = await requireProfile();
  const items = await loadActivity(profile.id);

  if (items.length === 0) {
    return (
      <p className="mt-10 border-t border-line pt-6 text-sm text-muted">
        Nothing here yet. Your orders appear here once you{" "}
        <Link href="/" className="text-brass hover:text-brass-hover">
          buy your first stock
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="mt-10 border-t border-line">
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function ActivityRow({ item }: { item: Activity }) {
  const time = when.format(new Date(item.time));

  if (item.kind === "deposit") {
    return (
      <li className="flex items-start justify-between gap-4 border-b border-line py-4">
        <div>
          <p>Deposit</p>
          <p className="mt-0.5 text-sm text-muted">{item.note ? `${item.note}, ${time}` : time}</p>
        </div>
        <p className="tabular-nums text-gain">+{formatUsd(item.amount)}</p>
      </li>
    );
  }

  const bought = item.side === "buy";
  return (
    <li className="border-b border-line">
      <Link
        href={`/stocks/${item.symbol}`}
        className="-mx-3 flex items-start justify-between gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-surface"
      >
        <div>
          <p>
            {bought ? "Bought" : "Sold"} {item.symbol}
          </p>
          <p className="mt-0.5 text-sm text-muted">{time}</p>
        </div>
        <div className="text-right">
          <p className="tabular-nums">
            {bought ? "-" : "+"}
            {formatUsd(item.notional)}
          </p>
          <p className="mt-0.5 text-sm tabular-nums text-muted">
            {formatShares(item.quantity)} {item.quantity === 1 ? "share" : "shares"} at {formatUsd(item.price)}
          </p>
        </div>
      </Link>
    </li>
  );
}
