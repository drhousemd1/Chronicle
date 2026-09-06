import { describe, expect, it } from "vitest";

import * as acceptedUpdateRegistry from "./accepted-update-capability-registry";
import {
  ACCEPTED_UPDATE_CAPABILITIES,
  assertAcceptedUpdateOwner,
  getAcceptedUpdateCapability,
  isAcceptedUpdateId,
  parseAcceptedUpdateId,
} from "./accepted-update-capability-registry";

describe("Accepted Update capability registry", () => {
  it("permits the explicit capability mappings", () => {
    expect(ACCEPTED_UPDATE_CAPABILITIES).toEqual([
      {
        id: "community-gallery",
        displayName: "Community Gallery",
        recordPrefix: "CG",
      },
      { id: "my-stories", displayName: "My Stories", recordPrefix: "MS" },
      { id: "character-library", displayName: "Character Library", recordPrefix: "CL" },
      { id: "my-images", displayName: "Image Library", recordPrefix: "MI" },
      { id: "story-builder", displayName: "Story Builder", recordPrefix: "SB" },
      { id: "character-builder", displayName: "Character Builder", recordPrefix: "CB" },
      { id: "chat-interface", displayName: "Chat Interface", recordPrefix: "CI" },
      { id: "roleplay-pipeline", displayName: "Roleplay Pipeline", recordPrefix: "RP" },
      { id: "chat-history", displayName: "Chat History", recordPrefix: "CH" },
      { id: "public-profile", displayName: "Public Profile", recordPrefix: "PP" },
      { id: "account", displayName: "Account & Subscription", recordPrefix: "AC" },
      { id: "admin", displayName: "Admin Panel", recordPrefix: "AD" },
      { id: "shared-systems", displayName: "Shared Application Systems", recordPrefix: "SA" },
    ]);
    expect(getAcceptedUpdateCapability("community-gallery")?.recordPrefix).toBe(
      "CG",
    );
    expect(getAcceptedUpdateCapability("chat-interface")?.recordPrefix).toBe("CI");
    expect(getAcceptedUpdateCapability("roleplay-pipeline")?.recordPrefix).toBe("RP");
  });

  it("validates supplied IDs without exposing an allocator", () => {
    expect(parseAcceptedUpdateId("CG-UPDATE-001")).toMatchObject({
      changeId: "CG-UPDATE-001",
      sequence: "001",
      capability: { id: "community-gallery", recordPrefix: "CG" },
    });
    expect(isAcceptedUpdateId("CG-UPDATE-999")).toBe(true);
    expect(isAcceptedUpdateId("RP-UPDATE-001")).toBe(true);
    expect(isAcceptedUpdateId("KS-UPDATE-001")).toBe(false);
    expect(isAcceptedUpdateId("CG-UPDATE-1")).toBe(false);
    expect(Object.keys(acceptedUpdateRegistry)).not.toContain(
      "allocateAcceptedUpdateId",
    );
  });

  it("rejects an owner that does not match the supplied ID prefix", () => {
    expect(() =>
      assertAcceptedUpdateOwner("CG-UPDATE-001", "chat-interface"),
    ).toThrow("belongs to community-gallery, not chat-interface");
  });
});
