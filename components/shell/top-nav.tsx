import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { SearchBox } from "./search-box";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Logo />
        <div className="hidden flex-1 sm:block">
          <SearchBox />
        </div>
        <div className="ml-auto">
          <NavLinks />
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
