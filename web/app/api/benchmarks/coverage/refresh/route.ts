import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshBenchmarkCoverageSnapshot } from "@/lib/benchmarks/coverage-snapshots";

export async function POST() {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  try {
    const snapshot = await refreshBenchmarkCoverageSnapshot(wsContext.context.workspace_id);
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refresh coverage snapshot" },
      { status: 500 },
    );
  }
}
