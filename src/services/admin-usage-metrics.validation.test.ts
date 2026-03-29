import { describe, expect, it } from "vitest";

import { aggregateValidationStatuses } from "@/services/admin-usage-metrics";

describe("aggregateValidationStatuses", () => {
  it("returns pass/fail/blank from mixed snapshots", () => {
    const rowIds = ["a", "b", "c", "d"];
    const statuses = aggregateValidationStatuses(rowIds, [
      {
        expectedIds: ["a", "b", "c"],
        sentIds: ["a"],
        missingIds: ["b"],
      },
      {
        expectedIds: ["c"],
        sentIds: ["c"],
        missingIds: [],
      },
    ]);

    expect(statuses.a).toBe("pass");
    expect(statuses.b).toBe("fail");
    expect(statuses.c).toBe("pass");
    expect(statuses.d).toBe("blank");
  });

  it("keeps fail precedence over later pass", () => {
    const statuses = aggregateValidationStatuses(["x"], [
      { expectedIds: ["x"], sentIds: [], missingIds: ["x"] },
      { expectedIds: ["x"], sentIds: ["x"], missingIds: [] },
    ]);

    expect(statuses.x).toBe("fail");
  });
});
