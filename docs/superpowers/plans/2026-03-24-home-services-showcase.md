# Home Services Showcase Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home page services section interactive so users can switch between service rows, see a synced preview image, and open a polished modal for the active service.

**Architecture:** Convert the static services section into a client-side accordion driven by a stable active service id. Keep the section entry point stable, reuse the existing `SectionModal` component for overlays, and back the new interaction with focused client tests plus the existing home page smoke coverage.

**Tech Stack:** Next.js App Router, React client components, TypeScript, `next/image`, `lucide-react`, Vitest, React DOM test utilities

---

## Chunk 1: Lock The Interactive Contract With Tests

**Test harness note:**
- Use a unit test file at `web/tests/unit/marketing/services-showcase.test.ts` so it matches the current Vitest include pattern.
- Add `/** @vitest-environment jsdom */` at the top of the file because the showcase behavior uses DOM events, portals, and focus assertions.
- Follow the existing jsdom test style already used elsewhere in this repo, such as dashboard and admin unit tests: `createRoot`, `act`, `React.createElement`, `document.body`, and direct DOM queries instead of assuming Testing Library.
- Add a small `renderShowcase()` helper inside the test file that mounts `HomeServicesShowcase` into a container appended to `document.body`.
- The helper should return `{ container, root, cleanup }`, where `cleanup()` unmounts the root and removes the container from `document.body` after each test.
- Mock `next/image` in the test file the same way other jsdom unit tests in this repo do, so preview images render as plain `img` elements during Vitest runs.
- Register teardown with `afterEach(() => cleanupFns.splice(0).forEach((cleanup) => cleanup()))` or an equivalent `document.body.innerHTML = ""` cleanup so modal portals do not leak across tests.

```ts
function renderShowcase() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(HomeServicesShowcase));
  });

  return {
    container,
    root,
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}
```

### Task 1: Add a failing interaction test for the active accordion state

**Files:**
- Create: `web/tests/unit/marketing/services-showcase.test.ts`
- Modify: none
- Test: `web/tests/unit/marketing/services-showcase.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("opens the first service by default and switches when another service is clicked", async () => {
  const { container, cleanup } = renderShowcase();
  try {
    const buttons = Array.from(container.querySelectorAll("button"));
    const benchmarkButton = buttons.find((button) => button.textContent?.match(/real-time salary benchmarking/i));
    const reviewsButton = buttons.find((button) => button.textContent?.match(/automated salary reviews/i));

    expect(benchmarkButton?.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("Stop guessing market rates");

    await act(async () => {
      reviewsButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(benchmarkButton?.getAttribute("aria-expanded")).toBe("false");
    expect(reviewsButton?.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("Align managers, finance and HR");
  } finally {
    cleanup();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts`

Expected: FAIL because `HomeServicesShowcase` currently renders static `active` flags and does not expose interactive accordion buttons.

- [ ] **Step 3: Write minimal implementation**

Implement only enough stateful accordion behavior in `web/components/marketing/home/services-showcase.tsx` to make one active item switchable by click.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/tests/unit/marketing/services-showcase.test.ts web/components/marketing/home/services-showcase.tsx
git commit -m "feat: add interactive services accordion"
```

### Task 2: Add a failing test for preview image sync and modal trigger presence

**Files:**
- Modify: `web/tests/unit/marketing/services-showcase.test.ts`
- Test: `web/tests/unit/marketing/services-showcase.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("updates the active preview and exposes a modal trigger for the selected service", async () => {
  const { container, cleanup } = renderShowcase();
  try {
    const complianceButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/localised compliance & equity/i),
    );

    await act(async () => {
      complianceButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.innerHTML).toContain("Localised compliance preview");
    expect(Array.from(container.querySelectorAll("button")).some((button) => button.textContent?.match(/see full workflow/i))).toBe(true);
  } finally {
    cleanup();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts`

Expected: FAIL because the section currently has one static visual and no modal trigger.

- [ ] **Step 3: Write minimal implementation**

Add active-preview rendering and the inline modal trigger for the active service item only.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/tests/unit/marketing/services-showcase.test.ts web/components/marketing/home/services-showcase.tsx
git commit -m "feat: sync services preview with active item"
```

## Chunk 2: Build The Interactive Showcase

### Task 3: Extend the accordion with stable service ids and accessible panel wiring

**Files:**
- Modify: `web/components/marketing/home/services-showcase.tsx`
- Modify: `web/tests/unit/marketing/services-showcase.test.ts`
- Test: `web/tests/unit/marketing/services-showcase.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("links each toggle button to its active panel with stable ids", () => {
  const { container, cleanup } = renderShowcase();
  try {
    const benchmarkButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/real-time salary benchmarking/i),
    );
    const panelId = benchmarkButton?.getAttribute("aria-controls");

    expect(panelId).toBe("benchmarking-panel");
    expect(container.querySelector(`#${panelId}`)).toBeTruthy();
  } finally {
    cleanup();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "links each toggle button"`

Expected: FAIL before stable service ids and explicit panel ids exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
"use client";

const services = [
  { id: "benchmarking", title: "...", body: "...", ... },
  { id: "salary-reviews", title: "...", body: "...", ... },
  { id: "compliance-equity", title: "...", body: "...", ... },
];

export function HomeServicesShowcase() {
  const [activeServiceId, setActiveServiceId] = useState("benchmarking");
  const activeService = services.find((service) => service.id === activeServiceId) ?? services[0];

  return (
    <section>
      {services.map((service) => {
        const isActive = service.id === activeServiceId;
        return (
          <article key={service.id}>
            <button
              type="button"
              aria-expanded={isActive}
              aria-controls={`${service.id}-panel`}
              onClick={() => setActiveServiceId(service.id)}
            >
              {service.title}
            </button>
            {isActive ? <div id={`${service.id}-panel`}>{service.body}</div> : null}
          </article>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "links each toggle button"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/marketing/home/services-showcase.tsx web/tests/unit/marketing/services-showcase.test.ts
git commit -m "feat: add accessible ids to services accordion"
```

### Task 4: Add richer inline content for each service

**Files:**
- Modify: `web/components/marketing/home/services-showcase.tsx`
- Test: `web/tests/unit/marketing/services-showcase.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("renders the active service proof points inline", () => {
  const { container, cleanup } = renderShowcase();
  try {
    expect(container.textContent).toContain("Market-backed offer guidance");
    expect(container.textContent).not.toContain("Manager calibration workflows");
  } finally {
    cleanup();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "renders the active service proof points inline"`

Expected: FAIL because only the body copy exists today.

- [ ] **Step 3: Write minimal implementation**

Extend the service content model with 3 short proof points or workflow steps per service and render them only inside the active panel so inactive text does not remain mounted in the DOM.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "renders the active service proof points inline"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/marketing/home/services-showcase.tsx web/tests/unit/marketing/services-showcase.test.ts
git commit -m "feat: add richer inline service details"
```

### Task 5: Replace the static right-side visual with active preview rendering

**Files:**
- Modify: `web/components/marketing/home/services-showcase.tsx`
- Test: `web/tests/unit/marketing/services-showcase.test.ts`

- [ ] **Step 1: Write the failing test**

Use or extend the preview-sync test so it asserts:

```ts
expect(document.body.innerHTML).toContain("Salary benchmarking preview");
await act(async () => {
  reviewsButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
expect(document.body.innerHTML).toContain("Salary reviews preview");
```

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "updates the active preview"`

Expected: FAIL because there is only one static `TableVisual`.

- [ ] **Step 3: Write minimal implementation**

Create a preview renderer keyed off the active service:

```tsx
function ServicePreviewPanel({ service }: { service: ServiceItem }) {
  if (service.id === "benchmarking") return <BenchmarkCompositePreview />;
  if (service.id === "salary-reviews") return <SingleImagePreview src="/images/marketing/home/bento-frameworks.png" alt="Salary reviews preview" />;
  return <SingleImagePreview src="/images/marketing/home/bento-pay-gaps.png" alt="Localised compliance preview" />;
}
```

`BenchmarkCompositePreview` should be the extracted version of the current `TableVisual` pattern, renamed clearly instead of introducing an undefined helper.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "updates the active preview"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/marketing/home/services-showcase.tsx web/tests/unit/marketing/services-showcase.test.ts
git commit -m "feat: add synced service preview panel"
```

## Chunk 3: Add The Modal Experience

### Task 6: Add service-specific modal content and trigger wiring

**Files:**
- Modify: `web/components/marketing/home/services-showcase.tsx`
- Possibly modify: `web/components/marketing/modal-hero-visuals.tsx`
- Test: `web/tests/unit/marketing/services-showcase.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("opens the active service modal with service-specific content", async () => {
  const { cleanup } = renderShowcase();
  try {
    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/see full workflow/i),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(document.body.textContent).toContain("Benchmark workflow");
  } finally {
    cleanup();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "opens the active service modal"`

Expected: FAIL because no modal trigger or dialog content exists.

- [ ] **Step 3: Write minimal implementation**

Use `SectionModal` inside the active panel with service-specific title, subtitle, primary visual, and 3 to 5 workflow steps.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "opens the active service modal"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/marketing/home/services-showcase.tsx web/components/marketing/modal-hero-visuals.tsx web/tests/unit/marketing/services-showcase.test.ts
git commit -m "feat: add service workflow modals"
```

### Task 7: Ensure modal focus returns to the trigger on close

**Files:**
- Modify: `web/components/ui/section-modal.tsx`
- Test: `web/tests/unit/marketing/services-showcase.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("returns focus to the modal trigger after closing", async () => {
  const { cleanup } = renderShowcase();
  try {
    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/see full workflow/i),
    ) as HTMLButtonElement | undefined;

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const closeButton = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "Close",
    );

    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.activeElement).toBe(trigger);
  } finally {
    cleanup();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "returns focus to the modal trigger"`

Expected: FAIL because `SectionModal` currently moves focus into the dialog but does not restore it on close.

- [ ] **Step 3: Write minimal implementation**

Store a ref to the trigger element in `SectionModal` and restore focus in the close path after `open` flips to `false`.

- [ ] **Step 4: Run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts -t "returns focus to the modal trigger"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/ui/section-modal.tsx web/tests/unit/marketing/services-showcase.test.ts
git commit -m "fix: restore focus after closing section modal"
```

## Chunk 4: Protect The Page Contract And Verify

### Task 8: Extend the home page smoke test with new showcase regression markers

**Files:**
- Modify: `web/tests/unit/marketing/home-page.test.ts`
- Test: `web/tests/unit/marketing/home-page.test.ts`

- [ ] **Step 1: Add regression assertions for the new showcase markers**

Add assertions for stable content that should remain present after the refactor, such as:

```ts
expect(html).toContain("See full workflow");
expect(html).toContain("Market-backed offer guidance");
```

- [ ] **Step 2: Run the page smoke test and verify the new markers are covered**

Run from `web/`: `npx vitest run tests/unit/marketing/home-page.test.ts`

Expected: PASS once the feature work in earlier chunks is complete, with the new markers now locked into the page-level regression test.

- [ ] **Step 3: Write minimal implementation if any page-level marker is still missing**

Add any stable modal-trigger copy or section content needed so the page-level test can assert the refactored section without depending on fragile class strings.

- [ ] **Step 4: Re-run test to verify it passes**

Run from `web/`: `npx vitest run tests/unit/marketing/home-page.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/tests/unit/marketing/home-page.test.ts web/components/marketing/home/services-showcase.tsx
git commit -m "test: cover home services showcase page markers"
```

### Task 9: Run final verification and lint checks

**Files:**
- Verify: `web/components/marketing/home/services-showcase.tsx`
- Verify: `web/components/ui/section-modal.tsx`
- Verify: `web/components/marketing/modal-hero-visuals.tsx`
- Verify: `web/tests/unit/marketing/services-showcase.test.ts`
- Verify: `web/tests/unit/marketing/home-page.test.ts`

- [ ] **Step 1: Run focused tests**

Run from `web/`: `npx vitest run tests/unit/marketing/services-showcase.test.ts tests/unit/marketing/home-page.test.ts`

Expected: PASS

- [ ] **Step 2: Run lints for edited files**

Use Cursor diagnostics plus project linting if needed to confirm no new issues were introduced in the edited files.

- [ ] **Step 3: Run a final manual browser check**

Verify in the running local app that:
- only one service opens at a time
- the preview image changes for each service
- each active section shows `See full workflow`
- the modal opens and closes correctly

- [ ] **Step 4: Commit**

```bash
git add web/components/marketing/home/services-showcase.tsx web/components/ui/section-modal.tsx web/components/marketing/modal-hero-visuals.tsx web/tests/unit/marketing/services-showcase.test.ts web/tests/unit/marketing/home-page.test.ts
git commit -m "feat: complete interactive home services showcase"
```
