# Home Services Showcase Design

**Scope:** Upgrade the `See how Qeemly works` section on the home page so each service row behaves like a polished accordion, swaps the right-side preview image, and offers a real modal with a richer workflow view.

## Goal

Turn the static services showcase into an interactive marketing section that feels like a product preview: one section open at a time, the preview panel synced to the active section, and each section offering a high-quality modal for deeper exploration.

## Intended Result

- The first item remains open on initial render.
- Clicking a different service closes the previously open one and expands the new one.
- The expanded area for every service uses the same visual format as the current benchmark item: prominent title, short explanation, and a compact supporting detail block.
- The right column changes to a different real product screenshot or mockup for the active service.
- Each expanded section includes a clear modal trigger such as `See full workflow`.
- The modal opens as a proper overlay using the site’s existing modal pattern and presents a larger visual plus richer explanatory content.
- On small and medium screens, the section stacks vertically as `[accordion list]` followed by `[active preview panel]`, and the preview still tracks the active item.

## Constraints

- Keep the section entry point in `web/components/marketing/home/services-showcase.tsx`.
- Reuse the existing `SectionModal` pattern from `web/components/ui/section-modal.tsx` instead of inventing a new modal system.
- Prefer existing marketing assets in `web/public/images/marketing/home/` where they can credibly represent each service.
- Keep the section responsive and preserve the current two-column large-screen layout intent.
- Limit the scope to the home services section and its related tests unless a small supporting shared component is required.
- Keep the implementation test-backed.

## Design Decisions

### Interaction Model

Use a controlled accordion model with a single active item id.

- Default the active item to a stable id such as `benchmarking`, not a title string.
- Treat the full row header as the click target for better discoverability.
- Rotate or recolor the arrow affordance for the active item so the open state is obvious.
- Only one item may be expanded at a time.
- Implement the row toggle as a real button with `aria-expanded`, `aria-controls`, and a labeled content region so the accordion remains keyboard- and screen-reader-friendly.

This matches the approved interaction choice and keeps the section clean rather than stacking multiple open panels.

### Content Structure

Reshape the service item data so each entry carries all content needed for the inline panel and modal:

- `id`
- `title`
- `body`
- `detailPoints` or equivalent short proof points
- `previewImage`
- `previewAlt`
- `modalTitle`
- `modalSubtitle`
- `modalVisualVariant`
- `modalSteps`

The inline expanded area should stay concise and scannable. The modal can carry the deeper narrative and larger visual treatment.

### Preview Panel

Replace the static `TableVisual` usage with an active-preview renderer that switches based on the selected service item.

- Keep the current benchmark composite image for the real-time benchmarking item.
- Use existing home assets such as `bento-frameworks.png` and `bento-pay-gaps.png` as the basis for the other preview states if they fit the intended story.
- Wrap each preview in a consistent card/frame so the panel feels cohesive even when the inner image changes.
- Animate preview swaps lightly with opacity and translate transitions, while respecting reduced-motion preferences.
- The preview column remains visible on all breakpoints and always reflects the currently active service.

### Modal Experience

Each expanded service item should expose a modal trigger within the open panel.

- Reuse `SectionModal` for accessibility, scroll locking, overlay handling, and keyboard close behavior.
- Provide a service-specific modal title and subtitle.
- Render a larger visual inside the modal, using either existing marketing visuals or the reusable visual components in `web/components/marketing/modal-hero-visuals.tsx` if they match the story.
- Keep modal content bounded to: title, subtitle, one primary visual, and 3 to 5 workflow steps or proof points.
- Return focus to the modal trigger on close. If `SectionModal` does not currently guarantee this, include the minimal shared enhancement needed.
- Use an explicit service-to-visual mapping so implementation does not guess:
  - `benchmarking` → preview uses the current `services-table.png` + `services-chart.png` composition, modal visual can use the benchmark-oriented marketing visual
  - `salary-reviews` → preview uses `bento-frameworks.png`, modal visual should use the confidence/review-oriented variant or a new lightweight service-specific layout if needed
  - `compliance-equity` → preview uses `bento-pay-gaps.png`, modal visual should use the Gulf localization or safeguards variant, whichever best matches the section copy

### Component Boundaries

- Keep `HomeServicesShowcase` as the public section component used by `web/app/(home)/home/page.tsx`.
- Make the interactive section a client component. This can be done by adding `"use client"` to `web/components/marketing/home/services-showcase.tsx` or by keeping that file as the stable entry point and moving the interactive logic into a colocated client child component.
- If `services-showcase.tsx` starts getting too large, split out focused helpers such as:
  - `ServiceAccordionItem`
  - `ServicePreviewPanel`
  - `ServiceModalContent`
- Keep static content colocated with the section unless a helper file materially improves readability.

### Testing

Update the existing home page coverage and add focused interaction tests for the section.

- Keep `web/tests/unit/marketing/home-page.test.ts` covering the section’s presence on the page.
- Add a dedicated client interaction test for `HomeServicesShowcase` that verifies:
  - the first item is open by default
  - clicking another item collapses the first and expands the new one
  - the active preview image/alt text changes with the selected item
  - the new modal trigger is rendered for the active section
- Prefer stable selectors, visible labels, or semantic roles for the new section rather than brittle class-string assertions.
- Use the project’s client component testing approach for interaction coverage, not just `renderToStaticMarkup`.
- If modal rendering is covered at the section level, assert the trigger, open state, and key modal labels rather than over-testing implementation details.

## Acceptance Criteria

- The services section is no longer static.
- Exactly one service is expanded at any time.
- The right-side preview visibly changes when the active service changes.
- Every service has richer inline detail content in the same general format as the current real-time item.
- Every service exposes a real modal entry point with polished content.
- The stacked mobile layout keeps the active preview visible below the accordion list.
- Accordion controls are keyboard accessible and expose correct expanded-state semantics.
- Closing a modal returns focus to its trigger.
- The home page marketing tests remain green, with new focused coverage for the interaction behavior.
