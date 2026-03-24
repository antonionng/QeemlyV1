/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

describe("PilotApplicationModal", () => {
  const cleanupFns: Array<() => void> = [];

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanupFns.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = "";
  });

  function renderModal() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    return import("@/components/marketing/pilot-application-modal").then(({ PilotApplicationModal }) => {
      act(() => {
        root.render(
          React.createElement(PilotApplicationModal, {
            sourceCta: "hero",
            triggerClassName: "pilot-trigger",
          }),
        );
      });

      const cleanup = () => {
        act(() => root.unmount());
        container.remove();
      };

      cleanupFns.push(cleanup);

      return { cleanup };
    });
  }

  it("opens the modal and shows the pilot application fields", async () => {
    await renderModal();

    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/join pilot scheme/i),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Join the Qeemly pilot");
    expect(document.body.textContent).toContain("Name");
    expect(document.body.textContent).toContain("Job role");
    expect(document.body.textContent).toContain("Company");
    expect(document.body.textContent).toContain("Company size");
    expect(document.body.textContent).toContain("Industry");
    expect(document.body.textContent).toContain("Work email");
    expect(document.body.textContent).toContain("Phone / WhatsApp");
  });

  it("associates labels with their controls for screen readers", async () => {
    await renderModal();

    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/join pilot scheme/i),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const nameLabel = Array.from(document.body.querySelectorAll("label")).find((label) => label.textContent === "Name");
    const emailLabel = Array.from(document.body.querySelectorAll("label")).find((label) => label.textContent === "Work email");

    expect(nameLabel?.getAttribute("for")).toBeTruthy();
    expect(emailLabel?.getAttribute("for")).toBeTruthy();
    expect(document.getElementById(nameLabel?.getAttribute("for") ?? "")?.tagName).toBe("INPUT");
    expect(document.getElementById(emailLabel?.getAttribute("for") ?? "")?.tagName).toBe("INPUT");
  });

  it("shows validation errors and blocks personal email domains", async () => {
    await renderModal();

    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/join pilot scheme/i),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const inputs = Array.from(document.body.querySelectorAll("input"));
    const nameInput = inputs.find((input) => input.getAttribute("placeholder") === "Your name") as HTMLInputElement;
    const emailInput = inputs.find((input) => input.getAttribute("placeholder") === "name@company.com") as HTMLInputElement;
    const companyInput = inputs.find((input) => input.getAttribute("placeholder") === "Company name") as HTMLInputElement;
    const roleInput = inputs.find((input) => input.getAttribute("placeholder") === "e.g. Head of People") as HTMLInputElement;
    const industryInput = inputs.find((input) => input.getAttribute("placeholder") === "e.g. Fintech") as HTMLInputElement;
    const companySizeSelect = document.body.querySelector("select") as HTMLSelectElement;
    const submit = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/submit application/i),
    );

    await act(async () => {
      nameInput.value = "Ada Lovelace";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      companyInput.value = "Qeemly";
      companyInput.dispatchEvent(new Event("input", { bubbles: true }));
      roleInput.value = "Head of People";
      roleInput.dispatchEvent(new Event("input", { bubbles: true }));
      industryInput.value = "Software";
      industryInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.value = "ada@gmail.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      companySizeSelect.value = "51-200";
      companySizeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      submit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("Please use your work email.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the application and shows a success message", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await renderModal();

    const trigger = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/join pilot scheme/i),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const inputs = Array.from(document.body.querySelectorAll("input"));
    const nameInput = inputs.find((input) => input.getAttribute("placeholder") === "Your name") as HTMLInputElement;
    const emailInput = inputs.find((input) => input.getAttribute("placeholder") === "name@company.com") as HTMLInputElement;
    const companyInput = inputs.find((input) => input.getAttribute("placeholder") === "Company name") as HTMLInputElement;
    const roleInput = inputs.find((input) => input.getAttribute("placeholder") === "e.g. Head of People") as HTMLInputElement;
    const industryInput = inputs.find((input) => input.getAttribute("placeholder") === "e.g. Fintech") as HTMLInputElement;
    const phoneInput = inputs.find((input) => input.getAttribute("placeholder") === "+971 50 123 4567") as HTMLInputElement;
    const companySizeSelect = document.body.querySelector("select") as HTMLSelectElement;
    const submit = Array.from(document.body.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/submit application/i),
    );

    await act(async () => {
      nameInput.value = "Ada Lovelace";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.value = "ada@qeemly.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      companyInput.value = "Qeemly";
      companyInput.dispatchEvent(new Event("input", { bubbles: true }));
      roleInput.value = "Head of People";
      roleInput.dispatchEvent(new Event("input", { bubbles: true }));
      industryInput.value = "Software";
      industryInput.dispatchEvent(new Event("input", { bubbles: true }));
      phoneInput.value = "+971555555555";
      phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
      companySizeSelect.value = "51-200";
      companySizeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      submit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pilot-applications",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(document.body.textContent).toContain("Application received");
  });
});
