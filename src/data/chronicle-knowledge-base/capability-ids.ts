export const APPROVED_CAPABILITY_IDS = [
  "chronicle-overview",
  "community-gallery",
  "my-stories",
  "character-library",
  "my-images",
  "story-builder",
  "character-builder",
  "chat-interface",
  "chat-history",
  "public-profile",
  "account",
  "admin",
  "shared-systems",
  "ai-api-services",
  "app-architecture-reference",
] as const;

export type ChronicleCapabilityId = (typeof APPROVED_CAPABILITY_IDS)[number];

export function isChronicleCapabilityId(
  value: string,
): value is ChronicleCapabilityId {
  return APPROVED_CAPABILITY_IDS.includes(value as ChronicleCapabilityId);
}
