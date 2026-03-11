import { invalidateMarketBenchmarkCache } from "./platform-market";
import { refreshPlatformMarketPool } from "./platform-market-pool";

export async function refreshPlatformMarketPoolBestEffort(): Promise<void> {
  try {
    await refreshPlatformMarketPool();
    invalidateMarketBenchmarkCache();
  } catch {
    // Keep caller mutations successful even if the shared market refresh fails.
  }
}
