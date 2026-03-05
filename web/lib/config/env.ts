type EnvLike = Record<string, string | undefined>;

type EnvValidationOptions = {
  requireCronSecret?: boolean;
  requireAI?: boolean;
};

type EnvValidationResult =
  | { ok: true; missing: [] }
  | { ok: false; missing: string[] };

const BASE_REQUIRED_KEYS: string[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export function validateRuntimeEnv(
  env: EnvLike,
  options: EnvValidationOptions = {}
): EnvValidationResult {
  const required = [...BASE_REQUIRED_KEYS];
  if (options.requireCronSecret) {
    required.push("CRON_SECRET");
  }
  if (options.requireAI) {
    required.push("OPENAI_API_KEY");
  }

  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true, missing: [] };
}
