/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ProviderLogo } from "@/components/dashboard/integrations/provider-logos";

describe("ProviderLogo", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    container.remove();
  });

  it("renders a neutral provider badge instead of an image logo", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ProviderLogo, { id: "slack", size: 44 }));
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent?.trim()).toContain("S");

    await act(async () => {
      root.unmount();
    });
  });
});
