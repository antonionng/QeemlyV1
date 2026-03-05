#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const checks = [
  ["npm", ["run", "validate:env"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "test:integration", "--", "tests/integration/team-invite-payload.test.ts"]],
  ["npm", ["run", "test:e2e", "--", "tests/e2e/critical-workflows-smoke.test.ts"]],
];

let failed = false;

for (const [command, args] of checks) {
  process.stdout.write(`\n[pilot-smoke] Running: ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    failed = true;
    process.stdout.write(`[pilot-smoke] FAILED: ${command} ${args.join(" ")}\n`);
    break;
  }
}

if (failed) {
  process.exit(1);
}

process.stdout.write("\n[pilot-smoke] All smoke checks passed.\n");
