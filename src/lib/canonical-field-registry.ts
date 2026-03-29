import {
  Character,
  GoalStep,
  StoryGoal,
  WorldCore,
  WorldCustomSection,
} from "@/types";

export const CANONICAL_WORLD_CORE_FIELDS = [
  "scenarioName",
  "briefDescription",
  "storyPremise",
  "structuredLocations",
  "dialogFormatting",
  "customWorldSections",
  "storyGoals",
] as const;

export type CanonicalWorldCoreField = (typeof CANONICAL_WORLD_CORE_FIELDS)[number];

export const CANONICAL_CHARACTER_CORE_FIELDS = [
  "name",
  "nicknames",
  "age",
  "sexType",
  "sexualOrientation",
  "location",
  "currentMood",
  "controlledBy",
  "characterRole",
  "roleDescription",
] as const;

export const CANONICAL_CHARACTER_SECTION_KEYS = [
  "physicalAppearance",
  "currentlyWearing",
  "preferredClothing",
  "personality",
  "tone",
  "background",
  "keyLifeEvents",
  "relationships",
  "secrets",
  "fears",
  "goals",
  "sections",
] as const;

const DEFAULT_DIALOG_FORMATTING =
  'Enclose all outspoken dialogue in " "\nEnclose all physical actions or descriptions in * *\nEnclose all internal thoughts in ( )';

function normalizeText(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function normalizeStoryGoalSteps(steps: unknown): GoalStep[] {
  if (!Array.isArray(steps)) return [];
  return (steps
    .map((step: any, idx: number) => {
      const description = normalizeText((step as any)?.description);
      if (!description) return null;
      return {
        id: normalizeText((step as any)?.id) || `step_${idx + 1}`,
        description,
        completed: Boolean((step as any)?.completed),
        completedAt:
          typeof (step as any)?.completedAt === "number" && Number.isFinite((step as any).completedAt)
            ? (step as any).completedAt
            : undefined,
      };
    })
    .filter((step: any): step is GoalStep => Boolean(step))) as GoalStep[];
}

function normalizeStoryGoals(goals: unknown): StoryGoal[] {
  if (!Array.isArray(goals)) return [];
  return (goals
    .map((goal: any, idx: number) => {
      const title = normalizeText((goal as any)?.title);
      if (!title) return null;
      const flexibilityRaw = normalizeText((goal as any)?.flexibility).toLowerCase();
      const flexibility = flexibilityRaw === "rigid" || flexibilityRaw === "flexible" ? flexibilityRaw : "normal";
      return {
        id: normalizeText((goal as any)?.id) || `goal_${idx + 1}`,
        title,
        desiredOutcome: normalizeText((goal as any)?.desiredOutcome),
        currentStatus: normalizeText((goal as any)?.currentStatus) || undefined,
        steps: normalizeStoryGoalSteps((goal as any)?.steps),
        flexibility,
        createdAt:
          typeof (goal as any)?.createdAt === "number" && Number.isFinite((goal as any).createdAt)
            ? (goal as any).createdAt
            : Date.now(),
        updatedAt:
          typeof (goal as any)?.updatedAt === "number" && Number.isFinite((goal as any).updatedAt)
            ? (goal as any).updatedAt
            : Date.now(),
      };
    })
    .filter((goal: any): goal is StoryGoal => Boolean(goal))) as StoryGoal[];
}

function normalizeStructuredLocations(value: unknown): WorldCore["structuredLocations"] {
  if (!Array.isArray(value)) return undefined;
  const mapped = value
    .map((entry, idx) => {
      const label = normalizeText((entry as any)?.label);
      const description = normalizeText((entry as any)?.description);
      if (!label && !description) return null;
      return {
        id: normalizeText((entry as any)?.id) || `loc_${idx + 1}`,
        label,
        description,
      };
    })
    .filter((entry): entry is NonNullable<WorldCore["structuredLocations"]>[number] => Boolean(entry));
  return mapped.length > 0 ? mapped : undefined;
}

function normalizeCustomSections(value: unknown): WorldCustomSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section, idx) => {
      const title = normalizeText((section as any)?.title);
      const itemsRaw = Array.isArray((section as any)?.items) ? (section as any).items : [];
      const items = itemsRaw
        .map((item: any, itemIdx: number) => ({
          id: normalizeText(item?.id) || `section_${idx + 1}_item_${itemIdx + 1}`,
          label: normalizeText(item?.label),
          value: normalizeText(item?.value),
        }))
        .filter((item) => item.label || item.value);
      const freeformValue = normalizeText((section as any)?.freeformValue);
      if (!title && !items.length && !freeformValue) return null;
      const sectionTypeRaw = normalizeText((section as any)?.type).toLowerCase();
      const type = sectionTypeRaw === "freeform" ? "freeform" : sectionTypeRaw === "structured" ? "structured" : undefined;
      return {
        id: normalizeText((section as any)?.id) || `section_${idx + 1}`,
        title: title || `Custom Section ${idx + 1}`,
        items,
        type,
        freeformValue: freeformValue || undefined,
      } as WorldCustomSection;
    })
    .filter((section): section is WorldCustomSection => Boolean(section));
}

export function migrateWorldCoreToCanonical(core: Partial<WorldCore>): WorldCore {
  const customWorldSections = normalizeCustomSections(core.customWorldSections);
  const structuredLocations = normalizeStructuredLocations(core.structuredLocations) || [];

  return {
    scenarioName: normalizeText(core.scenarioName),
    briefDescription: normalizeText(core.briefDescription),
    storyPremise: normalizeText(core.storyPremise),
    structuredLocations: structuredLocations.length > 0 ? structuredLocations : undefined,
    dialogFormatting: normalizeText(core.dialogFormatting) || DEFAULT_DIALOG_FORMATTING,
    customWorldSections: customWorldSections.length > 0 ? customWorldSections : undefined,
    storyGoals: (() => {
      const goals = normalizeStoryGoals(core.storyGoals);
      return goals.length > 0 ? goals : undefined;
    })(),
  };
}

export function migrateScenarioDataToCanonical<T extends { world: { core: Partial<WorldCore> } }>(scenario: T): T {
  return {
    ...scenario,
    world: {
      ...scenario.world,
      core: migrateWorldCoreToCanonical(scenario.world.core),
    },
  };
}

function stableStringify(value: unknown): string {
  if (!value || typeof value !== "object") return JSON.stringify(value);
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

export function needsWorldCoreBackfill(rawCore: Partial<WorldCore>): { canonical: WorldCore; shouldBackfill: boolean } {
  const canonical = migrateWorldCoreToCanonical(rawCore);
  const shouldBackfill = stableStringify(rawCore) !== stableStringify(canonical);
  return { canonical, shouldBackfill };
}

export function toCharacterCanonicalPromptSections(character: Character): Array<{
  section: string;
  rows: Array<{ label: string; value: string }>;
}> {
  const output: Array<{ section: string; rows: Array<{ label: string; value: string }> }> = [];

  const addSection = (section: string, rows: Array<{ label: string; value: string }>) => {
    const filtered = rows.filter((row) => row.label.trim() && row.value.trim());
    if (filtered.length > 0) {
      output.push({ section, rows: filtered });
    }
  };

  addSection("Basics", [
    { label: "Name", value: character.name || "" },
    { label: "Nicknames", value: character.nicknames || "" },
    { label: "Age", value: character.age || "" },
    { label: "Sex / Identity", value: character.sexType || "" },
    { label: "Sexual Orientation", value: character.sexualOrientation || "" },
    { label: "Location", value: character.location || "" },
    { label: "Current Mood", value: character.currentMood || "" },
    { label: "Controlled By", value: character.controlledBy || "" },
    { label: "Character Role", value: character.characterRole || "" },
    { label: "Role Description", value: character.roleDescription || "" },
  ]);

  const makeRows = (source: Record<string, unknown> | undefined): Array<{ label: string; value: string }> => {
    if (!source) return [];
    const base = Object.entries(source)
      .filter(([key]) => key !== "_extras")
      .map(([key, value]) => ({ label: key.replace(/([a-z])([A-Z])/g, "$1 $2"), value: normalizeText(value) }))
      .filter((row) => row.value);
    const extras = Array.isArray((source as any)._extras)
      ? (source as any)._extras
          .map((item: any) => ({
            label: normalizeText(item?.label) || "Detail",
            value: normalizeText(item?.value),
          }))
          .filter((row: { label: string; value: string }) => row.value)
      : [];
    return [...base, ...extras];
  };

  addSection("Physical Appearance", makeRows(character.physicalAppearance as unknown as Record<string, unknown>));
  addSection("Currently Wearing", makeRows(character.currentlyWearing as unknown as Record<string, unknown>));
  addSection("Preferred Clothing", makeRows(character.preferredClothing as unknown as Record<string, unknown>));
  addSection("Background", makeRows(character.background as unknown as Record<string, unknown>));
  addSection("Tone", makeRows(character.tone as unknown as Record<string, unknown>));
  addSection("Key Life Events", makeRows(character.keyLifeEvents as unknown as Record<string, unknown>));
  addSection("Relationships", makeRows(character.relationships as unknown as Record<string, unknown>));
  addSection("Secrets", makeRows(character.secrets as unknown as Record<string, unknown>));
  addSection("Fears", makeRows(character.fears as unknown as Record<string, unknown>));

  if (Array.isArray(character.sections)) {
    for (const section of character.sections) {
      const rows = (section.items || [])
        .map((item) => ({
          label: normalizeText(item?.label) || "Detail",
          value: normalizeText(item?.value),
        }))
        .filter((row) => row.value);
      if (normalizeText(section.freeformValue)) {
        rows.push({ label: "Notes", value: normalizeText(section.freeformValue) });
      }
      addSection(section.title || "Custom Section", rows);
    }
  }

  if (Array.isArray(character.goals) && character.goals.length > 0) {
    const rows = character.goals.map((goal) => {
      const steps = (goal.steps || []).map((step) => `${step.completed ? "[x]" : "[ ]"} ${step.description}`).join(" | ");
      return {
        label: goal.title,
        value: [
          goal.desiredOutcome ? `Outcome: ${goal.desiredOutcome}` : "",
          `Flexibility: ${(goal.flexibility || "normal").toUpperCase()}`,
          steps ? `Steps: ${steps}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      };
    });
    addSection("Character Goals", rows);
  }

  return output;
}
