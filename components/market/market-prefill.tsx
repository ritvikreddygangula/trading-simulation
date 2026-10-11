"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * Seeds the client cache with data the server already fetched, so prices
 * render with the page instead of after a loading skeleton. Polling then
 * takes over as usual.
 */
export function MarketPrefill({ data, children }: { data: Record<string, unknown>; children: ReactNode }) {
  return <SWRConfig value={{ fallback: data }}>{children}</SWRConfig>;
}
