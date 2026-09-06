import type { ChronicleCapabilityId } from "./capability-ids";

/**
 * Approved identities for bounded Accepted Update Changelog records.
 *
 * This registry permits supplied IDs; it never chooses a sequence or allocates
 * an ID. New capabilities must be added deliberately with an approved prefix.
 */
export const ACCEPTED_UPDATE_CAPABILITIES = Object.freeze([
  Object.freeze({
    id: "community-gallery",
    displayName: "Community Gallery",
    recordPrefix: "CG",
  }),
  Object.freeze({ id: "my-stories", displayName: "My Stories", recordPrefix: "MS" }),
  Object.freeze({ id: "character-library", displayName: "Character Library", recordPrefix: "CL" }),
  Object.freeze({ id: "my-images", displayName: "Image Library", recordPrefix: "MI" }),
  Object.freeze({ id: "story-builder", displayName: "Story Builder", recordPrefix: "SB" }),
  Object.freeze({ id: "character-builder", displayName: "Character Builder", recordPrefix: "CB" }),
  Object.freeze({ id: "chat-interface", displayName: "Chat Interface", recordPrefix: "CI" }),
  Object.freeze({ id: "roleplay-pipeline", displayName: "Roleplay Pipeline", recordPrefix: "RP" }),
  Object.freeze({ id: "chat-history", displayName: "Chat History", recordPrefix: "CH" }),
  Object.freeze({ id: "public-profile", displayName: "Public Profile", recordPrefix: "PP" }),
  Object.freeze({ id: "account", displayName: "Account & Subscription", recordPrefix: "AC" }),
  Object.freeze({ id: "admin", displayName: "Admin Panel", recordPrefix: "AD" }),
  Object.freeze({ id: "shared-systems", displayName: "Shared Application Systems", recordPrefix: "SA" }),
] as const satisfies readonly Readonly<{
  id: ChronicleCapabilityId;
  displayName: string;
  recordPrefix: string;
}>[]);

export type AcceptedUpdateCapabilityId =
  (typeof ACCEPTED_UPDATE_CAPABILITIES)[number]["id"];
export type AcceptedUpdateRecordPrefix =
  (typeof ACCEPTED_UPDATE_CAPABILITIES)[number]["recordPrefix"];

const BY_ID = new Map(
  ACCEPTED_UPDATE_CAPABILITIES.map((entry) => [entry.id, entry]),
);
const BY_PREFIX = new Map(
  ACCEPTED_UPDATE_CAPABILITIES.map((entry) => [entry.recordPrefix, entry]),
);
const ACCEPTED_UPDATE_ID = /^([A-Z][A-Z0-9]{1,9})-UPDATE-(\d{3})$/;

export function getAcceptedUpdateCapability(capabilityId: string) {
  return BY_ID.get(capabilityId as AcceptedUpdateCapabilityId) ?? null;
}

export function parseAcceptedUpdateId(changeId: string) {
  const match = changeId.match(ACCEPTED_UPDATE_ID);
  const capability = match
    ? BY_PREFIX.get(match[1] as AcceptedUpdateRecordPrefix)
    : null;
  if (!match || !capability) {
    throw new Error(
      `Unsupported Chronicle Accepted Update ID ${JSON.stringify(changeId)}.`,
    );
  }
  return Object.freeze({ changeId, sequence: match[2], capability });
}

export function isAcceptedUpdateId(changeId: string) {
  try {
    parseAcceptedUpdateId(changeId);
    return true;
  } catch {
    return false;
  }
}

export function assertAcceptedUpdateOwner(
  changeId: string,
  ownerCapability: string,
) {
  const parsed = parseAcceptedUpdateId(changeId);
  if (parsed.capability.id !== ownerCapability) {
    throw new Error(
      `${changeId} belongs to ${parsed.capability.id}, not ${ownerCapability}.`,
    );
  }
  return parsed.capability;
}
