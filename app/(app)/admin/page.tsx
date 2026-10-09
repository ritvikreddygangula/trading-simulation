import type { Metadata } from "next";
import { Suspense } from "react";
import { AddFundsDialog } from "@/components/admin/add-funds-dialog";
import { loadAdminOverview } from "@/lib/admin/data";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Admin" };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-price">Admin</h1>
      <Suspense fallback={<div aria-hidden className="mt-10 h-64 animate-pulse rounded-2xl bg-surface" />}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  const { users, ledger } = await loadAdminOverview();
  const totalCash = users.reduce((s, u) => s + u.cash, 0);
  const totalHoldings = users.reduce((s, u) => s + u.holdingsValue, 0);

  return (
    <>
      <p className="mt-3 text-muted">
        {users.length} {users.length === 1 ? "account" : "accounts"} holding {formatUsd(totalCash)} in cash
        and {formatUsd(totalHoldings)} in stocks.
      </p>

      <section aria-labelledby="users-heading" className="mt-12">
        <h2 id="users-heading" className="text-xl font-medium">
          Accounts
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="py-3 pr-4 font-normal">Account</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Cash</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Stocks</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal">Total</th>
                <th scope="col" className="py-3 text-right font-normal">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line">
                  <td className="py-4 pr-4">
                    <p>
                      {u.name}
                      {u.role === "admin" && <span className="ml-2 text-xs text-brass">Admin</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {u.email}, joined {dateFmt.format(new Date(u.joined))}
                    </p>
                  </td>
                  <td className="py-4 pr-4 text-right tabular-nums">{formatUsd(u.cash)}</td>
                  <td className="py-4 pr-4 text-right tabular-nums">
                    {formatUsd(u.holdingsValue)}
                    <span className="block text-xs text-muted">
                      {u.positions} {u.positions === 1 ? "position" : "positions"}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right tabular-nums">{formatUsd(u.cash + u.holdingsValue)}</td>
                  <td className="py-4 text-right">
                    <AddFundsDialog userId={u.id} userName={u.name} cash={u.cash} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="ledger-heading" className="mt-14">
        <h2 id="ledger-heading" className="text-xl font-medium">
          Funding log
        </h2>
        {ledger.length === 0 ? (
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
            No funds added yet. Deposits you make appear here with who made them.
          </p>
        ) : (
          <ul className="mt-4 border-t border-line">
            {ledger.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 border-b border-line py-4 text-sm">
                <div>
                  <p>
                    {e.adminName} added funds for {e.userName}
                  </p>
                  <p className="mt-0.5 text-muted">
                    {e.note ? `${e.note}, ` : ""}
                    {dateTimeFmt.format(new Date(e.time))} ET
                  </p>
                </div>
                <p className="tabular-nums text-gain">+{formatUsd(e.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
