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

  it("renders a real brand logo for mapped providers", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ProviderLogo, { id: "slack", size: 44 }));
    });

    const image = container.querySelector("img");

    expect(image).not.toBeNull();
    expect(image?.getAttribute("src")).toBe("/images/marketing/home/slack-logo.svg");
    expect(container.textContent?.trim()).not.toContain("S");

    await act(async () => {
      root.unmount();
    });
  });

  it("falls back to initials when no brand logo is mapped", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ProviderLogo, { id: "email_digest", label: "Email Digest", size: 44 }));
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent?.trim()).toContain("ED");

    await act(async () => {
      root.unmount();
    });
  });
});
