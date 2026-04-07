import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertBenchmarksFreshness } from "@/lib/ingestion/freshness";
import { getWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

export async function POST(request: Request) {
  try {
    const workspaceContext = await getWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }

    const body = await request.json();
    const recordCount = Number(body?.recordCount ?? 0);
    if (!Number.isFinite(recordCount) || recordCount <= 0) {
      return jsonValidationError({
        message: "Please correct the highlighted fields and try again.",
        fields: {
          recordCount: "Enter a positive record count and try again.",
        },
      });
    }

    await upsertBenchmarksFreshness(workspaceContext.context.workspace_id, recordCount, null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not update benchmark freshness right now.",
      logLabel: "Benchmark freshness update failed",
    });
  }
}
