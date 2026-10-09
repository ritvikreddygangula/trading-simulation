import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { Links, NavLinks } from "./nav-links";
import { SearchBox } from "./search-box";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Logo />
        <div className="hidden flex-1 sm:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Suspense fallback={<Links pathname={null} />}>
            <NavLinks />
          </Suspense>
          <Suspense fallback={<div className="size-9 rounded-full border border-line" />}>
            <Account />
          </Suspense>
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <SearchBox />
      </div>
    </header>
  );
}

async function Account() {
  const profile = await requireProfile();
  return <AccountMenu profile={profile} />;
}
