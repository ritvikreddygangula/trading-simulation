import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every page that matters here is rendered per request (auth cookies, live prices),
// so the cache only has to serve build-time output. Static assets do that without
// an R2 bucket. revalidatePath still refreshes the client router; switch to the R2
// cache if time-based or on-demand ISR is ever added.
export default defineCloudflareConfig({
	incrementalCache: staticAssetsIncrementalCache,
	enableCacheInterception: false,
});
