import Link from "next/link";

export default function StockNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <h1 className="font-display text-2xl">We couldn&apos;t find that stock.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Only US stocks and ETFs listed on major exchanges can be traded here. Try searching by
        company name.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-brass hover:text-brass-hover">
        Back to portfolio
      </Link>
    </div>
  );
}
