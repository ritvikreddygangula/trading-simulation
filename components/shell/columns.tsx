import type { ReactNode } from "react";

/** Robinhood-style split: wide content column plus a sticky right rail. */
export function Columns({ main, rail }: { main: ReactNode; rail: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1080px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
      <div className="min-w-0">{main}</div>
      <aside className="lg:sticky lg:top-24 lg:self-start">{rail}</aside>
    </div>
  );
}
