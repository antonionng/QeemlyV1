import { describe, expect, it } from "vitest";
import { resolveInvitationId } from "@/app/api/team/invite/route";

describe("team invitation payload compatibility", () => {
  it("accepts camelCase invitationId", () => {
    expect(resolveInvitationId({ invitationId: "abc" })).toBe("abc");
  });

  it("accepts snake_case invitation_id", () => {
    expect(resolveInvitationId({ invitation_id: "xyz" })).toBe("xyz");
  });
});
