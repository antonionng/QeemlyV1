# Homepage User Menu Design

**Scope:** Replace the signed-in `Dashboard` call-to-action in the public site header with the same authenticated avatar/name dropdown experience used in the dashboard, while keeping the homepage header styling appropriate for the dark hero.

## Goal

Make the signed-in homepage feel consistent with the product shell by showing the user avatar, name, and the full account dropdown in the top-right corner instead of a single `Dashboard` button.

## Intended Result

- Signed-in users on `web/app/(home)/home/page.tsx` see an avatar-based account menu in the header.
- The trigger shows the user's avatar when available, otherwise the same initial fallback currently used in the dashboard.
- The trigger also shows the user's display name when available. If no display name exists, it falls back to the same user initial plus a neutral label such as `Account` so the control still reads as an account menu, not just an icon button.
- Opening the menu exposes the same options and labels as the extracted shared authenticated-menu module. At extraction time, the intended canonical order is: `Profile`, `Account Settings`, conditional `Billing`, `Team`, `Help`, conditional `Super Admin`, and `Sign Out`.
- Signed-out users still see the existing `Early access` and `Log in` actions.
- While auth state is unresolved, the header should avoid flashing signed-out CTAs for a signed-in user. Use a neutral placeholder state in the action area until auth resolves.
- If auth resolution completes with no session, or the session lookup fails, fall back to the signed-out actions after the loading state ends. Do not leave the placeholder on screen indefinitely.
- Mobile navigation gives signed-in users the same account destinations as the desktop dropdown, in the same order, as tappable items inside the expanded mobile menu.

## Constraints

- Keep the header entry point in `web/components/layout/site-nav.tsx`.
- Avoid duplicating dashboard menu item definitions or sign-out logic.
- Preserve the existing anonymous homepage header behavior and styling.
- Keep the dark homepage hero variant visually polished and readable.
- Limit scope to the shared user menu, homepage navigation, and related tests.
- Keep the implementation test-backed.

## Design Decisions

### Shared Authenticated Menu

Extract the authenticated dropdown into a shared component that both the dashboard top bar and the public site nav can consume.

- Treat the extracted authenticated menu module as the single source of truth for menu item definitions, ordering, conditional visibility, and sign-out behavior across desktop and mobile presentations.
- The shared component owns:
  - reading the current user and profile
  - computing the fallback initial
  - fetching admin access state
  - sign-out behavior
  - the dropdown content and item ordering
- Conditional items such as `Billing` and `Super Admin` use the same gating rules and data sources as the dashboard menu.
- The component accepts a variant or styling props so the dashboard can keep its compact circular trigger while the homepage can render a wider avatar-plus-name trigger.

This keeps the authenticated menu logic in one place and prevents future drift between dashboard and homepage behavior.

### Trigger Variants

Support two trigger presentations for the same menu behavior:

- `compact`: current dashboard-style avatar circle
- `marketing`: homepage-style trigger that shows avatar, name, and a small dropdown affordance

The homepage trigger should:

- fit the existing dark header treatment
- maintain good contrast on the hero background
- truncate long names safely
- use the existing app pattern for user-facing strings. For this slice, `Account` can remain an English literal unless the surrounding header already routes comparable strings through localization helpers
- remain keyboard accessible through the existing dropdown button wrapper

### Homepage Header Integration

Update `web/components/layout/site-nav.tsx` so:

- authenticated desktop users see the shared `marketing` user-menu trigger instead of the `Dashboard` button
- anonymous desktop users keep `Early access` and `Log in`
- while auth is unresolved, the action area renders a fixed-width neutral placeholder instead of signed-out CTAs so the layout stays stable and authenticated users do not briefly see `Early access` and `Log in`. The placeholder should expose a minimal accessible loading signal, such as `aria-busy="true"` on the actions region plus screen-reader text like `Loading account`
- when auth resolution completes without a valid session, or if the auth lookup errors, the header exits the loading state and renders the normal signed-out actions
- authenticated mobile users see the same account destinations as the desktop dropdown rendered directly in the expanded mobile panel, including `Sign Out`, rather than a standalone `Dashboard` primary button
- authenticated mobile and desktop presentations both consume the same shared menu item definitions, not duplicated hard-coded lists
- anonymous mobile users keep the current `Early access` and `Log in` actions

The nav link set and logo behavior remain unchanged.

### Testing

Add coverage around the homepage signed-in state and preserve existing anonymous coverage.

- Update `web/tests/unit/layout/site-nav.test.ts` to assert:
  - anonymous users still see `Early access` and `Log in`
  - authenticated users no longer see `Dashboard`
  - authenticated users render the shared account trigger content, including the name or fallback initial
- Assert that loading resolves to signed-out actions when no session is returned or the auth lookup fails.
- Add signed-in mobile coverage that asserts the expanded menu exposes the same account destinations and does not reintroduce a primary `Dashboard` button.
- Add required coverage for the unresolved-auth placeholder state so the no-flash requirement is verified in automated tests.
- Add required regression coverage for `web/components/dashboard/topbar.tsx` so the dashboard still renders the authenticated dropdown trigger and shared menu items after the extraction.
- Add focused assertions for conditional menu items so homepage and dashboard coverage both verify that `Billing` and `Super Admin` appear only when the shared gating rules allow them.
- Add focused coverage for the shared authenticated menu if extracting it introduces standalone behavior worth testing.
- Keep the change narrow and avoid brittle class-only assertions where semantic text or element presence is enough.

## Acceptance Criteria

- Signed-in homepage users no longer see the `Dashboard` button in the top-right header area.
- Signed-in homepage users see their avatar fallback and display name in the header, or the approved `Account` fallback label when no display name exists.
- Opening the homepage account trigger exposes the same dropdown destinations and sign-out action as the dashboard.
- Signed-out homepage users still see the current public actions.
- Signed-in mobile homepage users see the same account destinations in the expanded menu without a standalone primary `Dashboard` CTA.
- The unresolved-auth state does not flash signed-out CTAs before the user session finishes loading.
- When auth resolution finishes without a valid session, the homepage header returns to the normal signed-out actions.
- The dashboard continues using the same authenticated dropdown behavior after the extraction.
- Relevant unit tests cover the signed-in, signed-out, and mobile authenticated header states.
