import { TopNav } from "@/components/shell/top-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TopNav />
      <main className="flex-1">{children}</main>
    </>
  );
}
