# Sidebar Navigation Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the dashboard sidebar to match the approved Figma navigation for expanded and collapsed states while preserving the existing workspace selector component.

**Architecture:** Update the shell-level sidebar dimensions in global CSS, then refactor `DashboardSidebar` around a single shared navigation item renderer so expanded rows, collapsed icon buttons, active states, section headers, and bottom actions stay visually consistent. Keep the current route model and feature gating, preserve the workspace selector component itself, and pin the bottom section while allowing the main navigation stack to scroll.

**Tech Stack:** Next.js, React, Tailwind CSS, Lucide React, Vitest

---

### Task 1: Add sidebar regression coverage

**Files:**
- Create: `web/tests/unit/dashboard/sidebar.test.tsx`
- Modify: `web/components/dashboard/sidebar.tsx`

**Step 1: Write the failing test**

Add a server-rendered unit test that mocks `next/navigation`, `next/link`, Supabase client helpers, company settings, feature gates, and the workspace switcher so the sidebar can be rendered deterministically. Assert the expanded nav includes `Company Overview`, `Benchmarking`, `Salary Review`, `Reports`, `Workforce Compliance`, `CoL Calculator`, `Upload Data`, `Integrations`, `Data Runs`, `Settings`, and the workspace selector marker. Assert the collapsed render hides labels, hides section headers, hides the workspace selector, and keeps tooltips plus icon-only active navigation.

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/dashboard/sidebar.test.tsx`

Expected: FAIL because the current sidebar still uses the old spacing, icon rail sizing, active treatment, and collapsed behavior.

### Task 2: Refactor the sidebar component

**Files:**
- Modify: `web/components/dashboard/sidebar.tsx`

**Step 1: Write minimal implementation**

Refactor the sidebar into:
- a shared `SidebarNavLink` renderer for expanded and collapsed states
- updated Lucide icons that match the approved list
- exact section header, row spacing, typography, hover, and active pill styling
- a scrollable nav stack with a pinned bottom section
- an expanded profile card matching the approved avatar and text treatment
- collapsed behavior that hides labels, headers, and the workspace selector while preserving tooltips

**Step 2: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/dashboard/sidebar.test.tsx`

Expected: PASS

### Task 3: Align shell sizing with the approved spec

**Files:**
- Modify: `web/app/globals.css`

**Step 1: Write the failing assertion if needed**

Extend the sidebar test or add string assertions so the shell width constants reflect `260px`, `72px`, and `200ms ease`.

**Step 2: Write minimal implementation**

Update the dashboard sidebar CSS variables and shell border color so the fixed rail width, collapsed width, and transition match the approved values.

**Step 3: Run targeted verification**

Run: `npm run test:unit -- tests/unit/dashboard/sidebar.test.tsx`

Expected: PASS

### Task 4: Final verification

**Files:**
- Modify: `web/components/dashboard/sidebar.tsx`
- Modify: `web/app/globals.css`
- Create: `web/tests/unit/dashboard/sidebar.test.tsx`

**Step 1: Run focused tests**

Run: `npm run test:unit -- tests/unit/dashboard/sidebar.test.tsx`

Expected: PASS

**Step 2: Run lint checks on edited files**

Run: `npm run lint -- components/dashboard/sidebar.tsx app/globals.css tests/unit/dashboard/sidebar.test.tsx`

Expected: No new lint failures in touched files.

**Step 3: Commit**

Not included unless the user explicitly requests a commit.
