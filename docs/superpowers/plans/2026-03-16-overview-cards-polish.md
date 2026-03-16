# Overview Cards Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the overview health-score card and adjacent metric cards into a near-design-match with the approved screenshots while preserving the current data and behavior.

**Architecture:** Keep the current overview page composition and update only the `HealthScore` and `StatCards` presentation layer. Use focused unit tests as the acceptance contract for layout markers, SVG sizing, and chart/card structure.

**Tech Stack:** Next.js, React, Tailwind utility classes, shared dashboard card styles, Vitest server-render tests

---

## Chunk 1: Test Contract

### Task 1: Lock the health-score design contract

**Files:**
- Modify: `web/tests/unit/dashboard/health-score.test.ts`
- Test: `web/tests/unit/dashboard/health-score.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions for the exact design markers needed for the new health card layout, such as updated gauge sizing classes, card max width markers, centered score stack, or factor row wrappers. Keep this test focused on the `HealthScore` component in isolation.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --prefix web -- web/tests/unit/dashboard/health-score.test.ts`
Expected: FAIL because the new DOM markers are not present yet.

- [ ] **Step 3: Write minimal implementation**

Update `web/components/dashboard/overview/health-score.tsx` so the rendered markup satisfies the new large-screen design contract.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --prefix web -- web/tests/unit/dashboard/health-score.test.ts`
Expected: PASS

### Task 2: Lock the overview card-grid design contract

**Files:**
- Modify: `web/tests/unit/dashboard/overview-cards-figma.test.ts`
- Test: `web/tests/unit/dashboard/overview-cards-figma.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions for the near-design-match overview contract, including:

- overview metrics grid class usage
- health score gauge sizing and score placement markers
- factor row layout markers
- metric card structural markers
- chart treatment markers used by the four supporting cards

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --prefix web -- web/tests/unit/dashboard/overview-cards-figma.test.ts`
Expected: FAIL because the new structural markers are not present yet.

- [ ] **Step 3: Write minimal implementation**

Update `web/components/dashboard/overview/stat-cards.tsx` and, if required, `web/components/dashboard/overview/health-score.tsx`, `web/app/(dashboard)/dashboard/overview/page.tsx`, or `web/app/globals.css` so the rendered markup satisfies the new design contract.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --prefix web -- web/tests/unit/dashboard/overview-cards-figma.test.ts`
Expected: PASS

## Chunk 2: Verification

### Task 3: Verify focused overview polish

**Files:**
- Modify: `web/components/dashboard/overview/health-score.tsx`
- Modify: `web/components/dashboard/overview/stat-cards.tsx`
- Modify: `web/tests/unit/dashboard/health-score.test.ts`
- Modify: `web/tests/unit/dashboard/overview-cards-figma.test.ts`

- [ ] **Step 1: Run the focused overview tests**

Run: `npm test --prefix web -- web/tests/unit/dashboard/health-score.test.ts web/tests/unit/dashboard/overview-cards-figma.test.ts`
Expected: PASS

- [ ] **Step 2: Run lint diagnostics on edited files**

Use workspace lint diagnostics to confirm the changed files do not introduce new issues.

- [ ] **Step 3: Verify responsive fallback contract**

Confirm the large-screen grid class still coexists with the current single-column fallback on smaller screens by checking the overview page markup and the focused test assertions.

- [ ] **Step 4: Review diff against scope**

Confirm that only the health score section and the four metric cards were changed for this task.
