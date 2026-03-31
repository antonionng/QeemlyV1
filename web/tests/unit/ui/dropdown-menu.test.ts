/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

describe("DropdownMenu", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  });

  it("opens upward when there is not enough space below the trigger", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function mockRect() {
      if (this.getAttribute("role") === "menu") {
        return {
          x: 0,
          y: 0,
          width: 220,
          height: 240,
          top: 0,
          right: 220,
          bottom: 240,
          left: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }

      if (this.className === "relative") {
        return {
          x: 0,
          y: 560,
          width: 220,
          height: 40,
          top: 560,
          right: 220,
          bottom: 600,
          left: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }

      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 640,
    });

    act(() => {
      root.render(
        React.createElement(
          DropdownMenu,
          { trigger: React.createElement("span", null, "Open menu") },
          React.createElement("div", null, "Menu content"),
        ),
      );
    });

    const button = container.querySelector("button");
    expect(button).not.toBeNull();

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const menu = container.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();
    expect(menu?.className).toContain("bottom-full");
  });
});
