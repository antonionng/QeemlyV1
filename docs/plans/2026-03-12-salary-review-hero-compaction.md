# Salary Review Hero Compaction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce the top-of-page height of the salary review workspace while keeping budget editing available through the existing setup controls.

**Architecture:** Keep the existing salary review data flow intact and limit changes to presentation. Add a small regression test that renders the hero to static markup, then refactor the hero into a compact summary strip with an anchor back to the review settings budget controls.

**Tech Stack:** Next.js, React, TypeScript, Vitest, server-side React rendering

---

### Task 1: Add regression coverage for the compact hero contract

**Files:**
- Create: `web/tests/unit/salary-review/review-summary-hero.test.ts`
- Modify: `web/components/dashboard/salary-review/review-summary-hero.tsx`

**Step 1: Write the failing test**

Add a unit test that renders `ReviewSummaryHero` to static markup and expects:
- an `Edit budget` anchor targeting `#review-settings`
- compact summary copy
- absence of the previous oversized headline copy

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/salary-review/review-summary-hero.test.ts`

Expected: FAIL because the hero still renders the old large headline and has no edit-budget anchor.

### Task 2: Refactor the hero into a compact summary strip

**Files:**
- Modify: `web/components/dashboard/salary-review/review-summary-hero.tsx`
- Modify: `web/app/(dashboard)/dashboard/salary-review/page.tsx`

**Step 1: Write minimal implementation**

Update the hero to:
- remove the oversized right-side budget card
- shorten the headline and supporting copy
- keep compact insight tiles
- add a compact budget snapshot row
- add an `Edit budget` anchor that jumps to the existing settings card

Add a stable `id` on the review settings card so the anchor lands in the right place.

**Step 2: Run tests to verify they pass**

Run: `npm run test:unit -- tests/unit/salary-review/review-summary-hero.test.ts`

Expected: PASS

### Task 3: Verify no obvious regressions

**Files:**
- Modify: `web/tests/unit/salary-review/presentation-helpers.test.ts` if needed

**Step 1: Run targeted verification**

Run:
- `npm run test:unit -- tests/unit/salary-review/review-summary-hero.test.ts`
- `npm run lint -- web/components/dashboard/salary-review/review-summary-hero.tsx "web/app/(dashboard)/dashboard/salary-review/page.tsx"`

Expected: tests pass and touched files are lint-clean.
