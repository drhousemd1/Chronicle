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

  it("does not treat pronoun-led action fragments as speaker tags", () => {
    const segments = parseMessageSegments("Sarah: *She checks the hearth.*\n\nShe scanned corners: wooden bench, small bed, dusty kitchen.");

    expect(segments).toEqual([
      {
        speakerName: "Sarah",
        content: "*She checks the hearth.*",
      },
      {
        speakerName: null,
        content: "She scanned corners: wooden bench, small bed, dusty kitchen.",
      },
    ]);
  });

  it("does not treat dialogue fragments with conjunctions as speaker tags", () => {
    const segments = parseMessageSegments('James: "Fingers and toes: numb, burning, or normal?"');

    expect(segments).toEqual([
      {
        speakerName: "James",
        content: '"Fingers and toes: numb, burning, or normal?"',
      },
    ]);
  });

  it("still allows title-cased multi-word character names", () => {
    const segments = parseMessageSegments("Mary Jane: \"Stay close.\"");

    expect(segments).toEqual([
      {
        speakerName: "Mary Jane",
        content: '"Stay close."',
      },
    ]);
  });
});
