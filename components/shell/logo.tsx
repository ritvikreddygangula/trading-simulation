import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Ledger home">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <circle cx="11" cy="11" r="10" fill="none" stroke="var(--brass)" strokeWidth="1.5" />
        <path
          d="M5 14.5 L9 10 L12 12.5 L17 7"
          fill="none"
          stroke="var(--brass)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-2xl leading-none">Ledger</span>
    </Link>
  );
}
