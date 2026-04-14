import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { composeAnalytics } from "@/lib/reports/analytics";
import { jsonServerError } from "@/lib/errors/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json(
      { error: wsContext.error },
      { status: wsContext.status },
    );
  }

  try {
    const analytics = await composeAnalytics(wsContext.context.workspace_id);
    return NextResponse.json({ analytics });
  } catch (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load analytics right now.",
      logLabel: "Analytics composition failed",
    });
  }
}
