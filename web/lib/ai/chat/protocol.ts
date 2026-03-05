export type ChatMode = "general" | "employee";

export type ChatRequest =
  | {
      mode: "general";
      message: string;
      threadId: string;
    }
  | {
      mode: "employee";
      message: string;
      employeeId: string;
      threadId: string;
    };

export type ChatFinalPayload = {
  mode: ChatMode;
  answer: string;
  confidence?: number;
  reasons?: string[];
  missing_data?: string[];
};

export type ChatStreamEvent =
  | { type: "start"; mode: ChatMode }
  | { type: "delta"; text: string }
  | ({ type: "final" } & ChatFinalPayload)
  | { type: "error"; error: string };

export type ChatRequestValidationResult =
  | { ok: true; value: ChatRequest }
  | { ok: false; status: number; error: string };

const MAX_MESSAGE_LENGTH = 1200;

export function sanitizeChatMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_LENGTH);
}

export function sanitizeEmployeeId(value: string): string {
  return value.trim();
}

export function sanitizeThreadId(value: string): string {
  return value.trim();
}

export function validateChatRequest(body: unknown): ChatRequestValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "Invalid request body" };
  }

  const mode = (body as { mode?: unknown }).mode;
  const message = (body as { message?: unknown }).message;
  const threadId = (body as { threadId?: unknown }).threadId;

  if (mode !== "general" && mode !== "employee") {
    return { ok: false, status: 400, error: "mode must be one of: general, employee" };
  }

  if (typeof message !== "string") {
    return { ok: false, status: 400, error: "message is required" };
  }

  const sanitizedMessage = sanitizeChatMessage(message);
  if (!sanitizedMessage) {
    return { ok: false, status: 400, error: "message cannot be empty" };
  }

  if (typeof threadId !== "string" || !sanitizeThreadId(threadId)) {
    return { ok: false, status: 400, error: "threadId is required" };
  }

  if (mode === "general") {
    return {
      ok: true,
      value: {
        mode,
        message: sanitizedMessage,
        threadId: sanitizeThreadId(threadId),
      },
    };
  }

  const employeeId = (body as { employeeId?: unknown }).employeeId;
  if (typeof employeeId !== "string" || !sanitizeEmployeeId(employeeId)) {
    return { ok: false, status: 400, error: "employeeId is required for employee mode" };
  }

  return {
    ok: true,
    value: {
      mode,
      message: sanitizedMessage,
      employeeId: sanitizeEmployeeId(employeeId),
      threadId: sanitizeThreadId(threadId),
    },
  };
}

export type EmployeeStructuredAnswer = {
  answer: string;
  confidence: number;
  reasons: string[];
  missing_data: string[];
};

function coerceConfidence(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  return 60;
}

function extractFirstBalancedJsonObject(input: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
      continue;
    }

    if (ch === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return input.slice(start, i + 1);
      }
    }
  }

  return null;
}

function normalizeModelJsonText(rawText: string): string {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const unfenced = fencedMatch?.[1]?.trim() || trimmed;
  return unfenced.replace(/^[`]+|[`]+$/g, "").trim();
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function parseEmployeeStructuredAnswer(rawText: string): EmployeeStructuredAnswer {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      answer: "I could not generate an advisory response right now.",
      confidence: 0,
      reasons: [],
      missing_data: ["Model returned empty output"],
    };
  }

  try {
    const normalized = normalizeModelJsonText(trimmed);
    const candidate = extractFirstBalancedJsonObject(normalized) || normalized;
    const parsed = JSON.parse(candidate) as Partial<EmployeeStructuredAnswer>;
    const answer =
      typeof parsed.answer === "string" && parsed.answer.trim()
        ? parsed.answer.trim()
        : "I could not generate an advisory response right now.";
    return {
      answer,
      confidence: coerceConfidence(parsed.confidence),
      reasons: asStringList(parsed.reasons),
      missing_data: asStringList(parsed.missing_data),
    };
  } catch {
    const normalized = normalizeModelJsonText(trimmed);
    const answer =
      normalized.startsWith("{") || normalized.includes("\"answer\"")
        ? "I could not format the advisory output cleanly, but the response indicates missing benchmark context."
        : normalized;
    return {
      answer,
      confidence: 60,
      reasons: [],
      missing_data: [],
    };
  }
}
