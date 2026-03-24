import { NextResponse } from "next/server";

type AdminErrorResponseOptions = {
  status?: number;
  detail?: string | null;
};

type AdminErrorBody = {
  error: string;
  detail?: string | null;
  [key: string]: unknown;
};

export class AdminApiError extends Error {
  status: number;
  detail: string | null;
  payload: AdminErrorBody | null;

  constructor(message: string, status: number, detail: string | null = null, payload: AdminErrorBody | null = null) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.detail = detail;
    this.payload = payload;
  }
}

export type NormalizedAdminApiError = {
  title: string;
  detail: string | null;
  status: number | null;
};

export function adminErrorResponse(message: string, options: AdminErrorResponseOptions = {}) {
  const body: AdminErrorBody = { error: message };
  if (options.detail !== undefined) {
    body.detail = options.detail;
  }

  return NextResponse.json(body, { status: options.status ?? 500 });
}

export function adminRouteErrorResponse(error: unknown) {
  console.error("Admin route error:", error);
  if (
    error instanceof Error &&
    error.message.includes("SUPABASE_SERVICE_ROLE_KEY is required for service client usage.")
  ) {
    return adminErrorResponse("Admin configuration error", {
      status: 500,
      detail: "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
    });
  }

  return adminErrorResponse("Admin request failed", {
    status: 500,
    detail: error instanceof Error ? error.message : "Unknown admin error",
  });
}

export function throwIfAdminQueryError(
  error: { message: string } | null | undefined,
  context: string
) {
  if (!error) return;
  throw new Error(`${context}: ${error.message}`);
}

export async function fetchAdminJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as AdminErrorBody | null;
    throw new AdminApiError(
      payload?.error ?? `Admin request failed with status ${response.status}`,
      response.status,
      payload?.detail ?? null,
      payload,
    );
  }

  const text = (await response.text().catch(() => "")) || `Admin request failed with status ${response.status}`;
  throw new AdminApiError(text, response.status, null);
}

export function normalizeAdminApiError(error: unknown): NormalizedAdminApiError {
  if (error instanceof AdminApiError) {
    return {
      title: error.message,
      detail: error.detail,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      title: "Admin request failed",
      detail: error.message,
      status: null,
    };
  }

  return {
    title: "Admin request failed",
    detail: null,
    status: null,
  };
}
