import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { runEmployeeAdvisoryChat } from "@/lib/ai/chat/employee";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

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
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: {
        ...(!employeeId ? { employeeId: "Choose an employee before asking a question." } : {}),
        ...(!rawQuestion ? { question: "Enter a question to continue." } : {}),
      },
    });
  }

  const question = sanitizeQuestion(rawQuestion);
  if (!question) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: {
        question: "Enter a question to continue.",
      },
    });
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
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return jsonServerError(error, {
      defaultMessage: "We could not answer that employee question right now.",
      logLabel: "Employee advisory chat failed",
    });
  }
}
