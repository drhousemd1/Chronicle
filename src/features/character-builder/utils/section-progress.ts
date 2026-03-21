import { Character, CharacterExtraRow } from '@/types';
import { SectionProgress } from '@/features/character-builder/types/character-builder.types';
import { toCanonicalCharacterSectionKey } from '@/features/character-builder/utils/section-keys';

const isFilledText = (value: string | null | undefined) =>
  typeof value === 'string' && value.trim().length > 0;

const toProgress = (completed: number, total: number): SectionProgress => ({
  completed,
  total,
  percent: total > 0 ? Math.round((completed / total) * 100) : 0,
});

const countSimpleFields = (values: Array<string | null | undefined>): { completed: number; total: number } => ({
  completed: values.filter(isFilledText).length,
  total: values.length,
});

const countExtraRows = (rows?: CharacterExtraRow[]): { completed: number; total: number } => {
  const safeRows = rows || [];
  return {
    completed: safeRows.reduce(
      (acc, row) => acc + (isFilledText(row.label) ? 1 : 0) + (isFilledText(row.value) ? 1 : 0),
      0
    ),
    total: safeRows.length * 2,
  };
};

const combineCounts = (...counts: Array<{ completed: number; total: number }>): { completed: number; total: number } => ({
  completed: counts.reduce((acc, count) => acc + count.completed, 0),
  total: counts.reduce((acc, count) => acc + count.total, 0),
});

export const calculateCharacterSectionProgress = (character: Character, sectionKey: string): SectionProgress => {
  if (sectionKey.startsWith('custom:')) {
    const sectionId = sectionKey.replace('custom:', '');
    const section = character.sections.find((s) => s.id === sectionId);
    if (!section) return toProgress(0, 0);
    if (section.type === 'freeform') {
      return toProgress(isFilledText(section.freeformValue) ? 1 : 0, 1);
    }
    const structured = combineCounts(
      ...section.items.map((item) => countSimpleFields([item.label, item.value]))
    );
    return toProgress(structured.completed, structured.total);
  }

  switch (toCanonicalCharacterSectionKey(sectionKey)) {
    case 'basics': {
      const basics = countSimpleFields([
        character.name,
        character.nicknames,
        character.age,
        character.sexType,
        character.sexualOrientation,
        character.location,
        character.currentMood,
        character.roleDescription,
      ]);
      return toProgress(basics.completed, basics.total);
    }
    case 'physicalAppearance': {
      const core = countSimpleFields([
        character.physicalAppearance?.hairColor,
        character.physicalAppearance?.eyeColor,
        character.physicalAppearance?.build,
        character.physicalAppearance?.bodyHair,
        character.physicalAppearance?.height,
        character.physicalAppearance?.breastSize,
        character.physicalAppearance?.genitalia,
        character.physicalAppearance?.skinTone,
        character.physicalAppearance?.makeup,
        character.physicalAppearance?.bodyMarkings,
        character.physicalAppearance?.temporaryConditions,
      ]);
      const extras = countExtraRows(character.physicalAppearance?._extras);
      return toProgress(core.completed + extras.completed, core.total + extras.total);
    }
    case 'currentlyWearing': {
      const core = countSimpleFields([
        character.currentlyWearing?.top,
        character.currentlyWearing?.bottom,
        character.currentlyWearing?.undergarments,
        character.currentlyWearing?.miscellaneous,
      ]);
      const extras = countExtraRows(character.currentlyWearing?._extras);
      return toProgress(core.completed + extras.completed, core.total + extras.total);
    }
    case 'preferredClothing': {
      const core = countSimpleFields([
        character.preferredClothing?.casual,
        character.preferredClothing?.work,
        character.preferredClothing?.sleep,
        character.preferredClothing?.undergarments,
        character.preferredClothing?.miscellaneous,
      ]);
      const extras = countExtraRows(character.preferredClothing?._extras);
      return toProgress(core.completed + extras.completed, core.total + extras.total);
    }
    case 'personality': {
      const personality = character.personality;
      if (!personality) return toProgress(0, 0);
      const traits = personality.splitMode
        ? [...(personality.outwardTraits || []), ...(personality.inwardTraits || [])]
        : personality.traits || [];
      const traitCounts = combineCounts(
        ...traits.map((trait) => countSimpleFields([trait.label, trait.value]))
      );
      return toProgress(traitCounts.completed, traitCounts.total);
    }
    case 'tone': {
      const toneExtras = countExtraRows(character.tone?._extras);
      return toProgress(toneExtras.completed, toneExtras.total);
    }
    case 'background': {
      const core = countSimpleFields([
        character.background?.jobOccupation,
        character.background?.educationLevel,
        character.background?.residence,
        character.background?.hobbies,
        character.background?.financialStatus,
        character.background?.motivation,
      ]);
      const extras = countExtraRows(character.background?._extras);
      return toProgress(core.completed + extras.completed, core.total + extras.total);
    }
    case 'keyLifeEvents': {
      const extras = countExtraRows(character.keyLifeEvents?._extras);
      return toProgress(extras.completed, extras.total);
    }
    case 'relationships': {
      const extras = countExtraRows(character.relationships?._extras);
      return toProgress(extras.completed, extras.total);
    }
    case 'secrets': {
      const extras = countExtraRows(character.secrets?._extras);
      return toProgress(extras.completed, extras.total);
    }
    case 'fears': {
      const extras = countExtraRows(character.fears?._extras);
      return toProgress(extras.completed, extras.total);
    }
    case 'characterGoals': {
      const goals = character.goals || [];
      const goalCounts = combineCounts(
        ...goals.map((goal) => ({
          completed:
            (isFilledText(goal.title) ? 1 : 0) +
            (isFilledText(goal.desiredOutcome) ? 1 : 0) +
            (goal.steps || []).filter((step) => isFilledText(step.description)).length,
          total: 2 + (goal.steps || []).length,
        }))
      );
      return toProgress(goalCounts.completed, goalCounts.total);
    }
    default:
      return toProgress(0, 0);
  }
};

export const emptySectionProgress: SectionProgress = {
  completed: 0,
  total: 0,
  percent: 0,
};

export const makeSectionProgress = (completed: number, total: number): SectionProgress =>
  toProgress(completed, total);
