import type { ChatMode } from "@/lib/ai/chat/protocol";

export type EmployeeContextSnapshot = {
  id: string;
  name: string;
  role?: string;
  department?: string;
};

export type ChatThread = {
  id: string;
  workspace_id: string;
  user_id: string;
  mode: ChatMode;
  employee_id: string | null;
  employee_name: string | null;
  employee_role: string | null;
  employee_department: string | null;
  title: string;
  auto_titled: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  archived_at: string | null;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  confidence: number | null;
  reasons: string[];
  missing_data: string[];
  created_at: string;
};

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function summarizeTitleFromMessage(message: string): string {
  const cleaned = compactWhitespace(message)
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[?!.]+$/g, "");
  if (!cleaned) return "New chat";
  return cleaned.length > 70 ? `${cleaned.slice(0, 67)}...` : cleaned;
}

export function buildThreadTitle(args: {
  mode: ChatMode;
  employeeName?: string | null;
  firstUserMessage: string;
}): string {
  if (args.mode === "employee" && args.employeeName) {
    return `${compactWhitespace(args.employeeName)} compensation review`;
  }
  return summarizeTitleFromMessage(args.firstUserMessage);
}
