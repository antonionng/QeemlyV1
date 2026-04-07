import { NextResponse } from "next/server";
import {
  createClientError,
  toClientErrorBody,
  toClientSafeError,
  type ClientError,
  type ClientErrorFields,
  type ClientErrorRow,
} from "./client-safe";

type FieldHint = {
  key: string;
  label: string;
  example?: string;
};

type ErrorResponseOptions = {
  status?: number;
  defaultMessage: string;
  code?: string;
  action?: string;
  field?: FieldHint;
  fields?: ClientErrorFields;
  rows?: ClientErrorRow[];
  logLabel?: string;
};

type ValidationErrorOptions = {
  status?: number;
  code?: string;
  message: string;
  action?: string;
  fields?: ClientErrorFields;
  rows?: ClientErrorRow[];
};

function logClientError(label: string | undefined, error: unknown) {
  if (!label) return;
  console.error(label, error);
}

export function jsonClientError(problem: ClientError, status = 400) {
  return NextResponse.json(toClientErrorBody(problem), { status });
}

// Callers should log the original server-side error with a stable label so
// support can correlate the safe client payload with the raw backend failure.
export function jsonValidationError(options: ValidationErrorOptions) {
  return jsonClientError(
    createClientError({
      code: options.code ?? "validation_error",
      message: options.message,
      action: options.action ?? "Update the highlighted fields and try again.",
      fields: options.fields,
      rows: options.rows,
    }),
    options.status ?? 400,
  );
}

// Use `logLabel` when you want the raw backend error recorded on the server
// while the client receives only safe, human-readable copy.
export function jsonServerError(error: unknown, options: ErrorResponseOptions) {
  logClientError(options.logLabel, error);
  const problem = toClientSafeError(error, {
    defaultMessage: options.defaultMessage,
    code: options.code,
    action: options.action,
    field: options.field,
    fields: options.fields,
    rows: options.rows,
  });

  return jsonClientError(problem, options.status ?? 500);
}

// Server actions should return this serialized shape instead of exposing
// provider messages directly to client components.
export function serverActionError(error: unknown, options: ErrorResponseOptions) {
  logClientError(options.logLabel, error);
  return toClientErrorBody(
    toClientSafeError(error, {
      defaultMessage: options.defaultMessage,
      code: options.code,
      action: options.action,
      field: options.field,
      fields: options.fields,
      rows: options.rows,
    }),
  );
}
