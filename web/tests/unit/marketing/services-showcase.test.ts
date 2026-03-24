/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: React.ComponentProps<"img"> & { priority?: boolean; unoptimized?: boolean }) => React.createElement("img", props),
}));

import { HomeServicesShowcase } from "@/components/marketing/home/services-showcase";

describe("HomeServicesShowcase", () => {
  const cleanupFns: Array<() => void> = [];

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    cleanupFns.splice(0).forEach((cleanup) => cleanup());
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  function renderShowcase() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(HomeServicesShowcase));
    });

    const cleanup = () => {
      act(() => root.unmount());
      container.remove();
    };

    cleanupFns.push(cleanup);

    return { container, root, cleanup };
  }

  it("opens the first service by default and switches when another service is clicked", async () => {
    const { container } = renderShowcase();
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
  });

  it("updates the active preview and exposes a modal trigger for the selected service", async () => {
    const { container } = renderShowcase();
    const complianceButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/localised compliance & equity/i),
    );

    await act(async () => {
      complianceButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.innerHTML).toContain("Select default jurisdictions");
    const earlyAccessTrigger = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/get early access/i),
    );

    expect(earlyAccessTrigger).toBeTruthy();
    expect(earlyAccessTrigger?.className).toContain("cursor-pointer");
    expect(earlyAccessTrigger?.className).toContain("active:translate-y-px");
  });

  it("opens the active service modal with service-specific content", async () => {
    renderShowcase();
    const reviewsButton = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/automated salary reviews/i),
    );

    await act(async () => {
      reviewsButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/get early access/i),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.body.textContent).toContain("AI Distribution Review");
  });

  it("returns focus to the modal trigger after closing", async () => {
    renderShowcase();
    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/get early access/i),
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
  });
});
