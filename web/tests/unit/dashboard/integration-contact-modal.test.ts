/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  Loader2: () => React.createElement("svg"),
  Sparkles: () => React.createElement("svg"),
  X: () => React.createElement("svg"),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

import { IntegrationContactModal } from "@/components/dashboard/integrations/integration-contact-modal";

describe("IntegrationContactModal", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.restoreAllMocks();
    container.remove();
    document.body.innerHTML = "";
  });

  it("renders provider-aware contact copy with a mailto action", async () => {
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(IntegrationContactModal, {
          providerName: "Slack",
          onClose: vi.fn(),
        }),
      );
    });

    expect(document.body.textContent).toContain("Connect Slack");
    expect(document.body.textContent).toContain("We will help you get this one wired up");

    const contactLink = document.body.querySelector('a[href^="mailto:"]');
    expect(contactLink?.getAttribute("href")).toContain("mailto:hello@qeemly.com");
    expect(contactLink?.getAttribute("href")).toContain("Slack");

    act(() => {
      root.unmount();
    });
  });
});
