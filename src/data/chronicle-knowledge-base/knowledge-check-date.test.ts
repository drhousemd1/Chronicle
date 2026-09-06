import { describe, expect, it } from "vitest";

import { getKnowledgeCheckDate } from "./knowledge-check-date";

describe("Knowledge structural check date", () => {
  it("derives the displayed validation date from the check time", () => {
    expect(getKnowledgeCheckDate(new Date("2026-08-22T08:15:00.000Z"))).toBe(
      "2026-08-22",
    );
  });
});
