export type ClientErrorFields = Record<string, string>;

export type ClientErrorRow = {
  row: number;
  field?: string;
  message: string;
};

export type ClientError = {
  message: string;
  code: string;
  action: string | null;
  fields?: ClientErrorFields;
  rows?: ClientErrorRow[];
};

export type ClientErrorBody = {
  error: string;
  message: string;
  code: string;
  action?: string;
  fields?: ClientErrorFields;
  rows?: ClientErrorRow[];
};

type FieldHint = {
  key: string;
  label: string;
  example?: string;
};

type ClientSafeErrorOptions = {
  defaultMessage: string;
  code?: string;
  action?: string;
  field?: FieldHint;
  fields?: ClientErrorFields;
  rows?: ClientErrorRow[];
};

type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

const DEFAULT_ACTION = "Try again. If the problem continues, contact support.";
const HIGHLIGHTED_FIELDS_ACTION = "Update the highlighted fields and try again.";
const TEMPORARY_UNAVAILABLE_MESSAGE =
  "This feature is temporarily unavailable. Please try again in a moment.";
const TEMPORARY_UNAVAILABLE_ACTION = "Refresh the page or try again in a few minutes.";

function extractError(input: unknown): SupabaseLikeError {
  if (input instanceof Error) {
    return {
      code: null,
      message: input.message,
      details: null,
      hint: null,
    };
  }

  if (input && typeof input === "object") {
    const value = input as SupabaseLikeError;
    return {
      code: typeof value.code === "string" ? value.code : null,
      message: typeof value.message === "string" ? value.message : null,
      details: typeof value.details === "string" ? value.details : null,
      hint: typeof value.hint === "string" ? value.hint : null,
    };
  }

  return {
    code: null,
    message: null,
    details: null,
    hint: null,
  };
}

function humanizeFieldLabel(fieldKey: string) {
  return fieldKey
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (match) => match.toUpperCase());
}

function extractFieldKey(error: SupabaseLikeError, fallbackField?: string) {
  const candidates = [error.details, error.message].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    const keyMatch = candidate.match(/\(([a-zA-Z0-9_]+)\)=/);
    if (keyMatch?.[1]) return keyMatch[1];

    const fieldMatch = candidate.match(/\b(email|salary|base_salary|bonus|equity|role_id|level_id|location_id)\b/i);
    if (fieldMatch?.[1]) return fieldMatch[1];
  }

  return fallbackField;
}

function createFieldMessage(fieldKey: string, fieldHint?: FieldHint) {
  const normalizedFieldKey = fieldHint?.key ?? fieldKey;
  const label = fieldHint?.label ?? humanizeFieldLabel(normalizedFieldKey);
  const lowerLabel = label.toLowerCase();

  if (normalizedFieldKey === "email") {
    return "Email is already in use. Use a different email address.";
  }

  return `${label} is already in use. Use a different ${lowerLabel}.`;
}

function isMissingRelationError(error: SupabaseLikeError) {
  const message = (error.message ?? "").toLowerCase();
  const looksLikeMissingRelation =
    /relation\s+["'][^"']+["']\s+does not exist/.test(message) ||
    /table\s+["'][^"']+["']\s+does not exist/.test(message) ||
    message.includes("schema cache");
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    looksLikeMissingRelation
  );
}

export function createClientError(input: {
  message: string;
  code?: string;
  action?: string | null;
  fields?: ClientErrorFields;
  rows?: ClientErrorRow[];
}): ClientError {
  return {
    message: input.message,
    code: input.code ?? "unknown_error",
    action: input.action ?? null,
    fields: input.fields,
    rows: input.rows,
  };
}

// Convert raw backend failures into copy that is safe for customer-facing APIs.
// Callers should log the original error on the server before returning this
// payload so support can inspect the real backend failure when needed.
export function toClientSafeError(input: unknown, options: ClientSafeErrorOptions): ClientError {
  const error = extractError(input);
  const fieldKey = extractFieldKey(error, options.field?.key);
  const outputFieldKey = options.field?.key ?? fieldKey;

  if (error.code === "23505" && outputFieldKey) {
    return createClientError({
      code: "duplicate_value",
      message: "Please correct the highlighted fields and try again.",
      action: HIGHLIGHTED_FIELDS_ACTION,
      fields: {
        [outputFieldKey]: createFieldMessage(outputFieldKey, options.field),
      },
    });
  }

  if (error.code === "22P02" && options.field) {
    return createClientError({
      code: "invalid_number",
      message: "Please correct the highlighted fields and try again.",
      action: HIGHLIGHTED_FIELDS_ACTION,
      fields: {
        [options.field.key]: `${options.field.label} must be a number. Example: ${options.field.example ?? "50000"}`,
      },
    });
  }

  if (error.code === "23503" && outputFieldKey) {
    const label = (options.field?.label ?? humanizeFieldLabel(outputFieldKey)).toLowerCase();
    return createClientError({
      code: "invalid_reference",
      message: "Please correct the highlighted fields and try again.",
      action: HIGHLIGHTED_FIELDS_ACTION,
      fields: {
        [outputFieldKey]: `Choose a valid ${label} and try again.`,
      },
    });
  }

  if (isMissingRelationError(error)) {
    return createClientError({
      code: "service_unavailable",
      message: TEMPORARY_UNAVAILABLE_MESSAGE,
      action: TEMPORARY_UNAVAILABLE_ACTION,
      fields: options.fields,
      rows: options.rows,
    });
  }

  return createClientError({
    code: options.code ?? "unknown_error",
    message: options.defaultMessage,
    action: options.action ?? DEFAULT_ACTION,
    fields: options.fields,
    rows: options.rows,
  });
}

export function toClientErrorBody(problem: ClientError): ClientErrorBody {
  const body: ClientErrorBody = {
    error: problem.message,
    message: problem.message,
    code: problem.code,
  };

  if (problem.action) {
    body.action = problem.action;
  }
  if (problem.fields) {
    body.fields = problem.fields;
  }
  if (problem.rows) {
    body.rows = problem.rows;
  }

  return body;
}

export function parseClientError(payload: unknown): ClientError {
  if (!payload || typeof payload !== "object") {
    return createClientError({
      message: "Something went wrong. Please try again.",
    });
  }

  const record = payload as Record<string, unknown>;
  const errorValue = typeof record.error === "string" ? record.error : null;
  const messageValue = typeof record.message === "string" ? record.message : null;
  const codeValue = typeof record.code === "string" ? record.code : "unknown_error";
  const actionValue = typeof record.action === "string" ? record.action : null;
  const fieldsValue =
    record.fields && typeof record.fields === "object" && !Array.isArray(record.fields)
      ? Object.fromEntries(
          Object.entries(record.fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        )
      : undefined;
  const rowsValue = Array.isArray(record.rows)
    ? record.rows.flatMap((row) => {
        if (
          !row ||
          typeof row !== "object" ||
          typeof (row as ClientErrorRow).row !== "number" ||
          typeof (row as ClientErrorRow).message !== "string"
        ) {
          return [];
        }

        const entry = row as ClientErrorRow;
        return [
          {
            row: entry.row,
            message: entry.message,
            ...(typeof entry.field === "string" ? { field: entry.field } : {}),
          },
        ];
      })
    : undefined;

  return createClientError({
    message: errorValue ?? messageValue ?? "Something went wrong. Please try again.",
    code: codeValue,
    action: actionValue,
    fields: fieldsValue,
    rows: rowsValue,
  });
}
