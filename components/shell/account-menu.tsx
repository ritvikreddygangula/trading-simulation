import Link from "next/link";
import type { Profile } from "@/lib/types";

/** Name button that opens a small menu. Native <details> keeps it keyboard-friendly. */
export function AccountMenu({ profile }: { profile: Profile }) {
  const name = profile.display_name || profile.email;
  const initial = name.charAt(0).toUpperCase();

  return (
    <details className="group relative">
      <summary
        aria-label="Account"
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-line text-sm font-medium transition-colors hover:border-brass [&::-webkit-details-marker]:hidden"
      >
        {initial}
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-surface-raised p-1.5 shadow-2xl shadow-black/40">
        <div className="px-3 py-2">
          <p className="truncate text-sm">{name}</p>
          <p className="truncate text-xs text-muted">{profile.email}</p>
        </div>
        {profile.role === "admin" && (
          <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text">
            Admin
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface hover:text-text"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
