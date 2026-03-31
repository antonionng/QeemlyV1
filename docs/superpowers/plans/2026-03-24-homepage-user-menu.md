# Homepage User Menu Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the signed-in homepage `Dashboard` CTA with the shared authenticated avatar/name menu used by the dashboard, while keeping anonymous and mobile behavior correct.

**Architecture:** Extract the authenticated account menu into a shared component that owns session, profile, gating, and sign-out behavior. Reuse that shared source for the dashboard compact trigger, homepage marketing trigger, and homepage mobile account links so the menu stays consistent across surfaces.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Supabase client auth, `lucide-react`, Vitest

---

## Chunk 1: Lock The Behavior With Tests

### Task 1: Add failing `SiteNav` coverage for loading, signed-in desktop, and signed-in mobile states

**Files:**
- Modify: `web/tests/unit/layout/site-nav.test.ts`
- Test: `web/tests/unit/layout/site-nav.test.ts`

- [ ] **Step 1: Write the failing tests**

Add tests that assert:
- loading state shows `Loading account` and does not show `Early access`, `Log in`, or `Dashboard`
- authenticated desktop state no longer shows `Dashboard` and does show the account trigger text
- authenticated mobile state exposes account destinations in the expanded panel instead of a primary `Dashboard` button

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/layout/site-nav.test.ts`

Expected: FAIL because `SiteNav` still renders the `Dashboard` CTA and has no loading placeholder or shared account menu behavior.

- [ ] **Step 3: Write minimal implementation**

Implement only enough shared-account-menu support in production code to satisfy the new `SiteNav` tests.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/layout/site-nav.test.ts`

Expected: PASS

### Task 2: Add failing dashboard regression coverage for the shared menu extraction

**Files:**
- Modify: `web/tests/unit/dashboard/topbar.test.ts`
- Test: `web/tests/unit/dashboard/topbar.test.ts`

- [ ] **Step 1: Write the failing test**

Add a regression test that asserts the dashboard top bar still renders the compact account trigger plus shared menu labels, including conditional `Billing`.

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/dashboard/topbar.test.ts`

Expected: FAIL once the test references the extracted shared menu that does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Extract the shared authenticated account menu and update dashboard usage with the smallest change needed for parity.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/dashboard/topbar.test.ts`

Expected: PASS

## Chunk 2: Extract And Integrate The Shared Menu

### Task 3: Create the shared authenticated account menu component

**Files:**
- Create: `web/components/auth/authenticated-user-menu.tsx`
- Modify: `web/components/dashboard/topbar.tsx`
- Test: `web/tests/unit/dashboard/topbar.test.ts`

- [ ] **Step 1: Write the failing extraction-driven test**

Use the dashboard regression test from Task 2 as the failing contract.

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/dashboard/topbar.test.ts`

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

The shared component should:
- read the current user via Supabase
- load the profile row when signed in
- compute avatar, display name, and fallback initial
- fetch admin access state
- apply the existing billing gate
- expose a `compact` trigger variant for dashboard and a `marketing` variant for homepage
- export shared mobile menu item rendering from the same menu definition source

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/dashboard/topbar.test.ts`

Expected: PASS

### Task 4: Replace the homepage signed-in CTA with the shared marketing trigger

**Files:**
- Modify: `web/components/layout/site-nav.tsx`
- Modify: `web/tests/unit/layout/site-nav.test.ts`
- Test: `web/tests/unit/layout/site-nav.test.ts`

- [ ] **Step 1: Write the failing `SiteNav` assertions first**

Extend or refine the `SiteNav` tests so they pin:
- loading placeholder copy
- authenticated marketing trigger copy
- absence of desktop `Dashboard`
- fallback to signed-out actions when auth resolves to no session or errors

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/layout/site-nav.test.ts`

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Update `SiteNav` to:
- keep the current nav links and logo
- show a fixed-width loading placeholder while auth is unresolved
- render the shared `marketing` trigger for signed-in desktop
- preserve anonymous desktop actions

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/layout/site-nav.test.ts`

Expected: PASS

### Task 5: Replace the homepage mobile signed-in CTA with shared account links

**Files:**
- Modify: `web/components/layout/site-nav.tsx`
- Modify: `web/tests/unit/layout/site-nav.test.ts`
- Test: `web/tests/unit/layout/site-nav.test.ts`

- [ ] **Step 1: Write the failing mobile test**

Assert the expanded mobile panel shows the same account destinations, in order, and no standalone `Dashboard` button when signed in.

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/layout/site-nav.test.ts -t "mobile"`

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Render signed-in mobile account links from the same shared menu definition used by the dropdown. Keep anonymous mobile actions unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/layout/site-nav.test.ts -t "mobile"`

Expected: PASS

## Chunk 3: Verify And Polish

### Task 6: Run focused verification and diagnostics

**Files:**
- Verify: `web/components/auth/authenticated-user-menu.tsx`
- Verify: `web/components/dashboard/topbar.tsx`
- Verify: `web/components/layout/site-nav.tsx`
- Verify: `web/tests/unit/dashboard/topbar.test.ts`
- Verify: `web/tests/unit/layout/site-nav.test.ts`

- [ ] **Step 1: Run the focused test suite**

Run from `web/`: `npx vitest run tests/unit/layout/site-nav.test.ts tests/unit/dashboard/topbar.test.ts`

Expected: PASS

- [ ] **Step 2: Check diagnostics for edited files**

Use Cursor lints on the edited component and test files. Fix any newly introduced errors.

- [ ] **Step 3: Run a quick manual homepage check**

Confirm in the running app that:
- signed-in homepage shows avatar/name dropdown in the top-right
- anonymous homepage still shows `Early access` and `Log in`
- mobile signed-in menu shows account destinations instead of `Dashboard`

