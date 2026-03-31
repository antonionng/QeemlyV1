import { createServiceClient } from "@/lib/supabase/service";

type MarketSupabaseClient = {
  from: (table: string) => unknown;
};

export type MarketReadDiagnostics = {
  readMode: "service" | "session";
  clientWarning: string | null;
  error: string | null;
};

export async function readMarketDataWithFallback<T>({
  sessionClient,
  diagnostics,
  read,
}: {
  sessionClient: MarketSupabaseClient;
  diagnostics: MarketReadDiagnostics;
  read: (client: MarketSupabaseClient) => Promise<T>;
}): Promise<T> {
  let serviceClient: MarketSupabaseClient | null = null;

  try {
    serviceClient = createServiceClient();
    diagnostics.readMode = "service";
  } catch (error) {
    diagnostics.readMode = "session";
    diagnostics.clientWarning = getErrorMessage(error);
  }

  if (serviceClient) {
    try {
      return await read(serviceClient);
    } catch (error) {
      diagnostics.readMode = "session";
      diagnostics.clientWarning = getErrorMessage(error);
    }
  }

  try {
    const result = await read(sessionClient);
    diagnostics.error = null;
    diagnostics.clientWarning = null;
    return result;
  } catch (error) {
    diagnostics.error = getErrorMessage(error);
    throw error;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
