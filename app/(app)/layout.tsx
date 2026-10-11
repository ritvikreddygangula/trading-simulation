import { TopNav } from "@/components/shell/top-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-brass px-4 py-2 text-sm font-medium text-brass-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <TopNav />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
