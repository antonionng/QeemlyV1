# Overview Cards Design

**Scope:** Match the `Compensation Health Score` card and the four adjacent metric cards on the Company Overview page to the approved screenshots stored at:

- `/Users/ant/.cursor/projects/Users-ant-Documents-QeemlyV1/assets/Screenshot_2026-03-16_at_13.07.51-33579c08-b64f-44f2-aaeb-a33d76f4fe21.png`
- `/Users/ant/.cursor/projects/Users-ant-Documents-QeemlyV1/assets/Screenshot_2026-03-16_at_13.08.51-d4a4acd2-60ef-44d3-9c2c-79d8b7dafd5c.png`

The first screenshot is the source of truth for the internal layout of the `Compensation Health Score` card. The second screenshot is the source of truth for the layout balance between the health card and the four adjacent metric cards.

## Goal

Bring the overview hero card section into a near pixel-match with the approved screenshots without changing the underlying data model, APIs, or page information architecture.

## Intended Result

- The `Compensation Health Score` card should match the screenshot in these visible traits:
  - large centered semicircle gauge
  - centered score value and status pill inside the gauge opening
  - balanced top padding above the gauge and larger spacing between gauge and factor rows
  - factor labels on the left, supporting values on the right, and thicker progress tracks beneath each row
- The four metric cards should match the screenshot in these visible traits:
  - compact card height with large bottom-aligned primary metric values
  - sparkline and bar charts positioned in the upper half of the card
  - labels and secondary text aligned with the screenshot hierarchy
  - `In Band` stacked distribution bar and `Risk Flags` bar sized and padded like the screenshot
- The large health card must remain visually dominant, with the four smaller cards forming a balanced two-by-two grid to its right on large screens.

## Constraints

- Reuse the existing `HealthScore` and `StatCards` components.
- Preserve the current metrics and business logic.
- Limit edits to the overview section files and only make shared-style changes if a local component class is insufficient.
- Keep the implementation test-backed.
- Desktop large-screen layout is the primary target for matching because that is what the screenshots show.
- Mobile and tablet behavior must stay responsive, but they do not need pixel-match acceptance against these screenshots.

## Design Decisions

### Approach

Use targeted component polish instead of a full redesign layer:

- Adjust the `HealthScore` component structure, SVG sizing, and spacing where necessary.
- Adjust the `StatCards` component layout, vertical alignment, and chart sizing where necessary.
- Keep shared global styles stable unless a small utility change is needed for this section.

### Layout

- Keep the existing overview metrics grid entry point in `web/app/(dashboard)/dashboard/overview/page.tsx`.
- Keep the large-screen grid relationship where the health card occupies the dominant left column and the metric cards occupy the supporting right columns.
- On smaller screens, preserve the current single-column fallback behavior.

### Testing

- Update `web/tests/unit/dashboard/overview-cards-figma.test.ts` to lock the near-design-match contract for:
  - overview metrics grid class usage
  - health score gauge sizing and score placement markers
  - factor row layout markers
  - metric card structural markers and chart treatments
- Update `web/tests/unit/dashboard/health-score.test.ts` if additional low-level assertions are needed for the health card.
- Run the focused unit tests for the overview card section after implementation.

## Acceptance Criteria

- `HealthScore` remains driven by existing metric values but visually reads like the screenshot at large-screen width.
- `StatCards` still render the same information but their spacing and visual hierarchy align with the screenshot.
- No unrelated overview sections are restyled as part of this task.
- Focused dashboard overview tests pass after the changes.
