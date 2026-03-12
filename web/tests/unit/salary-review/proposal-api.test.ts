import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchApprovalQueueSalaryReviewProposals,
  fetchLatestSalaryReviewProposal,
  fetchSalaryReviewProposalDetail,
} from "@/lib/salary-review/proposal-api";

describe("salary review proposal api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches the latest salary review proposal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposal: null,
          items: [],
          approvalSteps: [],
          notes: [],
          auditEvents: [],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchLatestSalaryReviewProposal();

    expect(fetchMock).toHaveBeenCalledWith("/api/salary-review/proposals?latest=1", { cache: "no-store" });
  });

  it("fetches submitted approval-queue proposals only", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposals: [],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchApprovalQueueSalaryReviewProposals();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/salary-review/proposals?approvalQueue=1",
      { cache: "no-store" }
    );
  });

  it("fetches salary review proposal detail by id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposal: null,
          items: [],
          approvalSteps: [],
          notes: [],
          auditEvents: [],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchSalaryReviewProposalDetail("proposal-123");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/salary-review/proposals/proposal-123",
      { cache: "no-store" }
    );
  });
});
