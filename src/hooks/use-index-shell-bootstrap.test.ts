import { describe, expect, it } from "vitest";

import { resolveShellQueryTarget } from "@/hooks/use-index-shell-bootstrap";

describe("resolveShellQueryTarget", () => {
  it("does not allow a non-admin query string to resolve the admin shell", () => {
    expect(resolveShellQueryTarget("admin", "research_development", { isAdmin: false })).toEqual({
      adminTool: null,
      requiresAdmin: true,
      tab: "gallery",
    });
  });

  it("preserves admin tool deep links for confirmed admins", () => {
    expect(resolveShellQueryTarget("admin", "research_development", { isAdmin: true })).toEqual({
      adminTool: "research_development",
      requiresAdmin: true,
      tab: "admin",
    });
  });

  it("keeps normal non-admin tab deep links unchanged", () => {
    expect(resolveShellQueryTarget("story_builder", null, { isAdmin: false })).toEqual({
      adminTool: null,
      requiresAdmin: false,
      tab: "world",
    });
  });
});
