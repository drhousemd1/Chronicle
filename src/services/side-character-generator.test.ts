import { describe, expect, it } from "vitest";
import { parseMessageSegments } from "@/services/side-character-generator";

describe("parseMessageSegments", () => {
  it("strips leaked separator lines before rendering speaker segments", () => {
    const segments = parseMessageSegments(`---\nSarah: Through the storm, she points toward the cabin.\n---`);

    expect(segments).toEqual([
      {
        speakerName: "Sarah",
        content: "Through the storm, she points toward the cabin.",
      },
    ]);
  });

  it("normalizes malformed double-colon speaker tags", () => {
    const segments = parseMessageSegments("Ashley:: She grips James's sleeve and keeps moving.");

    expect(segments).toEqual([
      {
        speakerName: "Ashley",
        content: "She grips James's sleeve and keeps moving.",
      },
    ]);
  });
});
