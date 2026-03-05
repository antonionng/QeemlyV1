import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { runEmployeeAdvisoryChat } from "@/lib/ai/chat/employee";

function sanitizeQuestion(question: string): string {
  return question.replace(/\s+/g, " ").trim().slice(0, 1200);
}

export async function POST(request: NextRequest) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id } = wsContext.context;
  const body = await request.json().catch(() => null);
  const employeeId = body?.employeeId as string | undefined;
  const rawQuestion = body?.question as string | undefined;

  if (!employeeId || !rawQuestion) {
    return NextResponse.json({ error: "employeeId and question are required" }, { status: 400 });
  }

  const question = sanitizeQuestion(rawQuestion);
  if (!question) {
    return NextResponse.json({ error: "question cannot be empty" }, { status: 400 });
  }

  try {
    const result = await runEmployeeAdvisoryChat({
      workspaceId: workspace_id,
      employeeId,
      question,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown advisory error";
    if (message === "Employee not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
