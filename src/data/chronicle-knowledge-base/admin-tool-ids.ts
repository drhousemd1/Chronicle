/** Documentation sections, not new operational-record authorities. */
export const ADMIN_TOOL_SECTION_IDS = [
  "knowledge-base-system",
  "schema-reference",
  "quality-hub",
  "validation-evidence-ledger",
  "finance-dashboard",
  "research-development",
  "image-generation",
  "app-dashboard",
] as const;

export type AdminToolSectionId = (typeof ADMIN_TOOL_SECTION_IDS)[number];

export function isAdminToolSectionId(value: string): value is AdminToolSectionId {
  return ADMIN_TOOL_SECTION_IDS.includes(value as AdminToolSectionId);
}
