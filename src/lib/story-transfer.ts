import {
  Character,
  CharacterBackground,
  CharacterControl,
  CharacterExtraRow,
  CharacterGoal,
  CharacterRole,
  CharacterTraitItem,
  CharacterTraitSection,
  CharacterTraitSectionType,
  CurrentlyWearing,
  GoalFlexibility,
  OpeningDialog,
  PersonalityTrait,
  PreferredClothing,
  ScenarioData,
  TimeOfDay,
  WorldCustomItem,
  WorldCustomSection,
  defaultCharacterBackground,
  defaultCharacterFears,
  defaultCharacterKeyLifeEvents,
  defaultCharacterRelationships,
  defaultCharacterSecrets,
  defaultCharacterTone,
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
} from '@/types';
import { now, uid, uuid } from '@/utils';
import TurndownService from 'turndown';

const MACHINE_START = '--- BEGIN CHRONICLE MACHINE DATA v1 ---';
const MACHINE_END = '--- END CHRONICLE MACHINE DATA ---';

type TransferRow = {
  label: string;
  value: string;
};

type TransferCustomSection = {
  title: string;
  type: CharacterTraitSectionType;
  items: TransferRow[];
  freeformValue?: string;
};

type TransferGoal = {
  title: string;
  desiredOutcome?: string;
  flexibility?: GoalFlexibility;
  steps: Array<{ description: string; completed: boolean }>;
};

type TransferPersonality = {
  splitMode: boolean;
  traits: TransferRow[];
  outwardTraits: TransferRow[];
  inwardTraits: TransferRow[];
};

type TransferCharacter = {
  name?: string;
  nicknames?: string;
  age?: string;
  sexType?: string;
  sexualOrientation?: string;
  location?: string;
  currentMood?: string;
  controlledBy?: CharacterControl;
  characterRole?: CharacterRole;
  roleDescription?: string;
  physicalAppearance?: Partial<Character['physicalAppearance']>;
  physicalAppearanceExtras?: TransferRow[];
  currentlyWearing?: Partial<CurrentlyWearing>;
  currentlyWearingExtras?: TransferRow[];
  preferredClothing?: Partial<PreferredClothing>;
  preferredClothingExtras?: TransferRow[];
  personality?: TransferPersonality;
  toneRows?: TransferRow[];
  background?: Partial<CharacterBackground>;
  backgroundExtras?: TransferRow[];
  keyLifeEventRows?: TransferRow[];
  relationshipRows?: TransferRow[];
  secretRows?: TransferRow[];
  fearRows?: TransferRow[];
  goals?: TransferGoal[];
  customSections?: TransferCustomSection[];
};

type TransferPayloadV1 = {
  version: 1;
  storyBuilder: {
    storyCard: {
      scenarioName?: string;
      briefDescription?: string;
    };
    worldCore: {
      storyPremise?: string;
      factions?: string;
      locations?: string;
      historyTimeline?: string;
      toneThemes?: string;
      plotHooks?: string;
      dialogFormatting?: string;
      customSections?: TransferCustomSection[];
    };
    openingDialog: {
      enabled?: boolean;
      text?: string;
      startingDay?: number;
      startingTimeOfDay?: TimeOfDay;
    };
  };
  characters: TransferCharacter[];
};

export type StoryTransferSummary = {
  updatedStoryFields: number;
  updatedCharacters: number;
  createdCharacters: number;
  createdCharacterCustomSections: number;
  createdWorldCustomSections: number;
  skippedLines: number;
};

export type StoryTransferResult = {
  data: ScenarioData;
  summary: StoryTransferSummary;
  warnings: string[];
};

export type StoryImportMode = 'merge' | 'rewrite';

const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
const hasText = (value: string | undefined | null) => typeof value === 'string' && value.trim().length > 0;
const clean = (value: string | undefined | null) => (typeof value === 'string' ? value.trim() : '');

const safeTitle = (value: string, fallback: string) => {
  const trimmed = clean(value);
  return trimmed || fallback;
};

const mergeText = (current: string, incoming: string | undefined, mode: StoryImportMode): string => {
  if (!hasText(incoming)) return current;
  const next = incoming!.trim();
  if (!hasText(current)) return next;
  if (current.trim() === next) return current;
  if (mode === 'rewrite') return next;
  return `${current.trim()}\n\n${next}`;
};

const mergeScalarText = (current: string, incoming: string | undefined, mode: StoryImportMode): string => {
  if (!hasText(incoming)) return current;
  const next = incoming!.trim();
  if (!hasText(current)) return next;
  if (current.trim() === next) return current;
  if (mode === 'rewrite') return next;
  return current;
};

const pushField = (lines: string[], label: string, value?: string, indentLevel = 0) => {
  if (!hasText(value)) return;
  const indent = '  '.repeat(indentLevel);
  const text = value!.replace(/\r/g, '');
  if (!text.includes('\n')) {
    lines.push(`${indent}- ${label}: ${text}`);
    return;
  }
  lines.push(`${indent}- ${label}: """`);
  text.split('\n').forEach((line) => lines.push(`${indent}  ${line}`));
  lines.push(`${indent}  """`);
};

const pushHeading = (lines: string[], title: string, indentLevel = 0) => {
  const indent = '  '.repeat(indentLevel);
  lines.push(`${indent}- ${title}`);
};

const rowsFromExtras = (rows?: CharacterExtraRow[]): TransferRow[] =>
  (rows || [])
    .filter((row) => hasText(row.label) || hasText(row.value))
    .map((row) => ({ label: row.label || 'Field', value: row.value || '' }));

const rowsToExtras = (rows: TransferRow[]): CharacterExtraRow[] =>
  rows
    .filter((row) => hasText(row.label) || hasText(row.value))
    .map((row) => ({
      id: uid('extra'),
      label: clean(row.label),
      value: clean(row.value),
    }));

const rowsToItems = (rows: TransferRow[]): CharacterTraitItem[] =>
  rows
    .filter((row) => hasText(row.label) || hasText(row.value))
    .map((row) => ({
      id: uid('item'),
      label: clean(row.label),
      value: clean(row.value),
      createdAt: now(),
      updatedAt: now(),
    }));

const worldRowsToItems = (rows: TransferRow[]): WorldCustomItem[] =>
  rows
    .filter((row) => hasText(row.label) || hasText(row.value))
    .map((row) => ({
      id: uid('wci'),
      label: clean(row.label),
      value: clean(row.value),
    }));

const createEmptyTransferCharacter = (name?: string): TransferCharacter => ({
  name: clean(name),
  goals: [],
  customSections: [],
  physicalAppearanceExtras: [],
  currentlyWearingExtras: [],
  preferredClothingExtras: [],
  backgroundExtras: [],
  toneRows: [],
  keyLifeEventRows: [],
  relationshipRows: [],
  secretRows: [],
  fearRows: [],
});

const createBlankCharacter = (name?: string): Character => {
  const t = now();
  return {
    id: uuid(),
    name: clean(name) || 'New Character',
    nicknames: '',
    age: '',
    sexType: '',
    sexualOrientation: '',
    location: '',
    currentMood: '',
    controlledBy: 'AI',
    characterRole: 'Main',
    roleDescription: '',
    tags: '',
    avatarDataUrl: '',
    physicalAppearance: { ...defaultPhysicalAppearance },
    currentlyWearing: { ...defaultCurrentlyWearing },
    preferredClothing: { ...defaultPreferredClothing },
    background: { ...defaultCharacterBackground },
    tone: { ...defaultCharacterTone },
    keyLifeEvents: { ...defaultCharacterKeyLifeEvents },
    relationships: { ...defaultCharacterRelationships },
    secrets: { ...defaultCharacterSecrets },
    fears: { ...defaultCharacterFears },
    sections: [],
    goals: [],
    createdAt: t,
    updatedAt: t,
  };
};

const toTransferPayload = (data: ScenarioData): TransferPayloadV1 => ({
  version: 1,
  storyBuilder: {
    storyCard: {
      scenarioName: data.world.core.scenarioName || '',
      briefDescription: data.world.core.briefDescription || '',
    },
    worldCore: {
      storyPremise: data.world.core.storyPremise || '',
      factions: data.world.core.factions || '',
      locations: data.world.core.locations || '',
      historyTimeline: data.world.core.historyTimeline || '',
      toneThemes: data.world.core.toneThemes || '',
      plotHooks: data.world.core.plotHooks || '',
      dialogFormatting: data.world.core.dialogFormatting || '',
      customSections: (data.world.core.customWorldSections || []).map((section) => ({
        title: section.title || 'Custom Content',
        type: section.type || 'structured',
        items: (section.items || []).map((item) => ({ label: item.label || '', value: item.value || '' })),
        freeformValue: section.freeformValue || '',
      })),
    },
    openingDialog: {
      enabled: data.story.openingDialog.enabled,
      text: data.story.openingDialog.text || '',
      startingDay: data.story.openingDialog.startingDay,
      startingTimeOfDay: data.story.openingDialog.startingTimeOfDay,
    },
  },
  characters: (data.characters || []).map((character) => ({
    name: character.name || '',
    nicknames: character.nicknames || '',
    age: character.age || '',
    sexType: character.sexType || '',
    sexualOrientation: character.sexualOrientation || '',
    location: character.location || '',
    currentMood: character.currentMood || '',
    controlledBy: character.controlledBy,
    characterRole: character.characterRole,
    roleDescription: character.roleDescription || '',
    physicalAppearance: { ...character.physicalAppearance },
    physicalAppearanceExtras: rowsFromExtras(character.physicalAppearance?._extras),
    currentlyWearing: { ...character.currentlyWearing },
    currentlyWearingExtras: rowsFromExtras(character.currentlyWearing?._extras),
    preferredClothing: { ...character.preferredClothing },
    preferredClothingExtras: rowsFromExtras(character.preferredClothing?._extras),
    personality: character.personality
      ? {
          splitMode: character.personality.splitMode,
          traits: (character.personality.traits || []).map((trait) => ({ label: trait.label || '', value: trait.value || '' })),
          outwardTraits: (character.personality.outwardTraits || []).map((trait) => ({ label: trait.label || '', value: trait.value || '' })),
          inwardTraits: (character.personality.inwardTraits || []).map((trait) => ({ label: trait.label || '', value: trait.value || '' })),
        }
      : undefined,
    toneRows: rowsFromExtras(character.tone?._extras),
    background: character.background ? { ...character.background } : undefined,
    backgroundExtras: rowsFromExtras(character.background?._extras),
    keyLifeEventRows: rowsFromExtras(character.keyLifeEvents?._extras),
    relationshipRows: rowsFromExtras(character.relationships?._extras),
    secretRows: rowsFromExtras(character.secrets?._extras),
    fearRows: rowsFromExtras(character.fears?._extras),
    goals: (character.goals || []).map((goal) => ({
      title: goal.title || '',
      desiredOutcome: goal.desiredOutcome || '',
      flexibility: goal.flexibility || 'normal',
      steps: (goal.steps || []).map((step) => ({ description: step.description || '', completed: !!step.completed })),
    })),
    customSections: (character.sections || []).map((section) => ({
      title: section.title || 'Custom Content',
      type: section.type || 'structured',
      items: (section.items || []).map((item) => ({ label: item.label || '', value: item.value || '' })),
      freeformValue: section.freeformValue || '',
    })),
  })),
});

const buildHumanReadable = (payload: TransferPayloadV1): string => {
  const lines: string[] = [];
  lines.push('# Chronicle Story Builder Export');
  lines.push('');
  lines.push('# Story Builder');
  pushHeading(lines, 'Story Card', 0);
  pushField(lines, 'Story Name', payload.storyBuilder.storyCard.scenarioName, 1);
  pushField(lines, 'Brief Description', payload.storyBuilder.storyCard.briefDescription, 1);
  lines.push('');
  pushHeading(lines, 'World Core', 0);
  pushField(lines, 'Story Premise', payload.storyBuilder.worldCore.storyPremise, 1);
  pushField(lines, 'Factions', payload.storyBuilder.worldCore.factions, 1);
  pushField(lines, 'Locations', payload.storyBuilder.worldCore.locations, 1);
  pushField(lines, 'History Timeline', payload.storyBuilder.worldCore.historyTimeline, 1);
  pushField(lines, 'Tone Themes', payload.storyBuilder.worldCore.toneThemes, 1);
  pushField(lines, 'Plot Hooks', payload.storyBuilder.worldCore.plotHooks, 1);
  pushField(lines, 'Dialog Formatting', payload.storyBuilder.worldCore.dialogFormatting, 1);
  (payload.storyBuilder.worldCore.customSections || []).forEach((section) => {
    pushHeading(lines, safeTitle(section.title, 'Custom Content'), 1);
    if (section.type === 'freeform') {
      if (hasText(section.freeformValue)) pushField(lines, 'Content', section.freeformValue, 2);
      return;
    }
    section.items.forEach((item) => pushField(lines, item.label || 'Field', item.value, 2));
  });
  lines.push('');
  pushHeading(lines, 'Opening Dialog', 0);
  if (typeof payload.storyBuilder.openingDialog.enabled === 'boolean') {
    lines.push(`  - Enabled: ${payload.storyBuilder.openingDialog.enabled ? 'true' : 'false'}`);
  }
  pushField(lines, 'Text', payload.storyBuilder.openingDialog.text, 1);
  if (typeof payload.storyBuilder.openingDialog.startingDay === 'number') {
    lines.push(`  - Starting Day: ${payload.storyBuilder.openingDialog.startingDay}`);
  }
  if (payload.storyBuilder.openingDialog.startingTimeOfDay) {
    lines.push(`  - Starting Time Of Day: ${payload.storyBuilder.openingDialog.startingTimeOfDay}`);
  }
  lines.push('\n# Characters');
  payload.characters.forEach((character) => {
    lines.push('');
    lines.push(`# Character: ${character.name || 'Unnamed Character'}`);
    pushHeading(lines, 'Basics', 0);
    pushField(lines, 'Name', character.name, 1);
    pushField(lines, 'Nicknames', character.nicknames, 1);
    pushField(lines, 'Age', character.age, 1);
    pushField(lines, 'Sex / Identity', character.sexType, 1);
    pushField(lines, 'Sexual Orientation', character.sexualOrientation, 1);
    pushField(lines, 'Location', character.location, 1);
    pushField(lines, 'Current Mood', character.currentMood, 1);
    if (character.controlledBy) lines.push(`  - Controlled By: ${character.controlledBy}`);
    if (character.characterRole) lines.push(`  - Character Role: ${character.characterRole}`);
    pushField(lines, 'Role Description', character.roleDescription, 1);

    const writeSection = (title: string, rows: TransferRow[]) => {
      pushHeading(lines, title, 0);
      rows.forEach((row) => pushField(lines, row.label || 'Field', row.value, 1));
    };

    writeSection('Physical Appearance', [
      { label: 'Hair Color', value: character.physicalAppearance?.hairColor || '' },
      { label: 'Eye Color', value: character.physicalAppearance?.eyeColor || '' },
      { label: 'Build', value: character.physicalAppearance?.build || '' },
      { label: 'Body Hair', value: character.physicalAppearance?.bodyHair || '' },
      { label: 'Height', value: character.physicalAppearance?.height || '' },
      { label: 'Breast Size', value: character.physicalAppearance?.breastSize || '' },
      { label: 'Genitalia', value: character.physicalAppearance?.genitalia || '' },
      { label: 'Skin Tone', value: character.physicalAppearance?.skinTone || '' },
      { label: 'Makeup', value: character.physicalAppearance?.makeup || '' },
      { label: 'Body Markings', value: character.physicalAppearance?.bodyMarkings || '' },
      { label: 'Temporary Conditions', value: character.physicalAppearance?.temporaryConditions || '' },
      ...(character.physicalAppearanceExtras || []),
    ]);
    writeSection('Currently Wearing', [
      { label: 'Top', value: character.currentlyWearing?.top || '' },
      { label: 'Bottom', value: character.currentlyWearing?.bottom || '' },
      { label: 'Undergarments', value: character.currentlyWearing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.currentlyWearing?.miscellaneous || '' },
      ...(character.currentlyWearingExtras || []),
    ]);
    writeSection('Preferred Clothing', [
      { label: 'Casual', value: character.preferredClothing?.casual || '' },
      { label: 'Work', value: character.preferredClothing?.work || '' },
      { label: 'Sleep', value: character.preferredClothing?.sleep || '' },
      { label: 'Undergarments', value: character.preferredClothing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.preferredClothing?.miscellaneous || '' },
      ...(character.preferredClothingExtras || []),
    ]);

    pushHeading(lines, 'Personality', 0);
    if (character.personality) {
      lines.push(`  - Split Mode: ${character.personality.splitMode ? 'true' : 'false'}`);
      character.personality.traits.forEach((row) => pushField(lines, row.label || 'Trait', row.value, 1));
      character.personality.outwardTraits.forEach((row) => pushField(lines, `Outward ${row.label || 'Trait'}`, row.value, 1));
      character.personality.inwardTraits.forEach((row) => pushField(lines, `Inward ${row.label || 'Trait'}`, row.value, 1));
    }

    writeSection('Tone', character.toneRows || []);
    writeSection('Background', [
      { label: 'Job Occupation', value: character.background?.jobOccupation || '' },
      { label: 'Education Level', value: character.background?.educationLevel || '' },
      { label: 'Residence', value: character.background?.residence || '' },
      { label: 'Hobbies', value: character.background?.hobbies || '' },
      { label: 'Financial Status', value: character.background?.financialStatus || '' },
      { label: 'Motivation', value: character.background?.motivation || '' },
      ...(character.backgroundExtras || []),
    ]);
    writeSection('Key Life Events', character.keyLifeEventRows || []);
    writeSection('Relationships', character.relationshipRows || []);
    writeSection('Secrets', character.secretRows || []);
    writeSection('Fears', character.fearRows || []);

    pushHeading(lines, 'Character Goals', 0);
    (character.goals || []).forEach((goal) => {
      pushField(lines, 'Goal', goal.title, 1);
      pushField(lines, 'Desired Outcome', goal.desiredOutcome || '', 1);
      if (goal.flexibility) lines.push(`  - Flexibility: ${goal.flexibility}`);
      goal.steps.forEach((step) => lines.push(`  - Step: [${step.completed ? 'x' : ' '}] ${step.description}`));
    });

    (character.customSections || []).forEach((section) => {
      pushHeading(lines, safeTitle(section.title, 'Custom Content'), 0);
      if (section.type === 'freeform') {
        pushField(lines, 'Content', section.freeformValue || '', 1);
      } else {
        section.items.forEach((row) => pushField(lines, row.label || 'Field', row.value, 1));
      }
    });
  });

  return lines.join('\n');
};

export const exportScenarioToText = (data: ScenarioData): string => {
  const payload = toTransferPayload(data);
  const humanReadable = buildHumanReadable(payload);
  return `${humanReadable}\n`;
};

export const exportScenarioToJson = (data: ScenarioData): string => {
  return `${JSON.stringify(toTransferPayload(data), null, 2)}\n`;
};

const escapeRtf = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\line ');

const rtfHeading = (text: string, level: 1 | 2 = 1): string => {
  const size = level === 1 ? 36 : 28;
  return `\\pard\\sa180\\sb200\\b\\fs${size} ${escapeRtf(text)}\\b0\\fs24\\par`;
};

const rtfBullet = (text: string, indent = 720): string => {
  return `\\pard\\sa100\\li${indent}\\fi-240\\tx${indent}\\fs24 \\u8226?\\tab ${escapeRtf(text)}\\par`;
};

const pushRtfField = (lines: string[], label: string, value?: string, indent = 1080) => {
  if (!hasText(value)) return;
  lines.push(rtfBullet(`${label}: ${value}`, indent));
};

const buildWordRtf = (payload: TransferPayloadV1): string => {
  const lines: string[] = [];
  lines.push(rtfHeading('Chronicle Story Builder Export', 1));

  lines.push(rtfHeading('Story Builder', 1));
  lines.push(rtfHeading('Story Card', 2));
  pushRtfField(lines, 'Story Name', payload.storyBuilder.storyCard.scenarioName);
  pushRtfField(lines, 'Brief Description', payload.storyBuilder.storyCard.briefDescription);

  lines.push(rtfHeading('World Core', 2));
  pushRtfField(lines, 'Story Premise', payload.storyBuilder.worldCore.storyPremise);
  pushRtfField(lines, 'Factions', payload.storyBuilder.worldCore.factions);
  pushRtfField(lines, 'Locations', payload.storyBuilder.worldCore.locations);
  pushRtfField(lines, 'History Timeline', payload.storyBuilder.worldCore.historyTimeline);
  pushRtfField(lines, 'Tone Themes', payload.storyBuilder.worldCore.toneThemes);
  pushRtfField(lines, 'Plot Hooks', payload.storyBuilder.worldCore.plotHooks);
  pushRtfField(lines, 'Dialog Formatting', payload.storyBuilder.worldCore.dialogFormatting);
  (payload.storyBuilder.worldCore.customSections || []).forEach((section) => {
    lines.push(rtfHeading(safeTitle(section.title, 'Custom Content'), 2));
    if (section.type === 'freeform') {
      pushRtfField(lines, 'Content', section.freeformValue || '');
    } else {
      section.items.forEach((item) => pushRtfField(lines, item.label || 'Field', item.value));
    }
  });

  lines.push(rtfHeading('Opening Dialog', 2));
  if (typeof payload.storyBuilder.openingDialog.enabled === 'boolean') {
    lines.push(rtfBullet(`Enabled: ${payload.storyBuilder.openingDialog.enabled ? 'true' : 'false'}`, 1080));
  }
  pushRtfField(lines, 'Text', payload.storyBuilder.openingDialog.text);
  if (typeof payload.storyBuilder.openingDialog.startingDay === 'number') {
    lines.push(rtfBullet(`Starting Day: ${payload.storyBuilder.openingDialog.startingDay}`, 1080));
  }
  if (payload.storyBuilder.openingDialog.startingTimeOfDay) {
    lines.push(rtfBullet(`Starting Time Of Day: ${payload.storyBuilder.openingDialog.startingTimeOfDay}`, 1080));
  }

  lines.push(rtfHeading('Characters', 1));
  payload.characters.forEach((character) => {
    lines.push(rtfHeading(`Character: ${character.name || 'Unnamed Character'}`, 1));
    lines.push(rtfHeading('Basics', 2));
    pushRtfField(lines, 'Name', character.name);
    pushRtfField(lines, 'Nicknames', character.nicknames);
    pushRtfField(lines, 'Age', character.age);
    pushRtfField(lines, 'Sex / Identity', character.sexType);
    pushRtfField(lines, 'Sexual Orientation', character.sexualOrientation);
    pushRtfField(lines, 'Location', character.location);
    pushRtfField(lines, 'Current Mood', character.currentMood);
    if (character.controlledBy) lines.push(rtfBullet(`Controlled By: ${character.controlledBy}`, 1080));
    if (character.characterRole) lines.push(rtfBullet(`Character Role: ${character.characterRole}`, 1080));
    pushRtfField(lines, 'Role Description', character.roleDescription);

    const writeSection = (title: string, rows: TransferRow[]) => {
      lines.push(rtfHeading(title, 2));
      rows.forEach((row) => pushRtfField(lines, row.label || 'Field', row.value));
    };

    writeSection('Physical Appearance', [
      { label: 'Hair Color', value: character.physicalAppearance?.hairColor || '' },
      { label: 'Eye Color', value: character.physicalAppearance?.eyeColor || '' },
      { label: 'Build', value: character.physicalAppearance?.build || '' },
      { label: 'Body Hair', value: character.physicalAppearance?.bodyHair || '' },
      { label: 'Height', value: character.physicalAppearance?.height || '' },
      { label: 'Breast Size', value: character.physicalAppearance?.breastSize || '' },
      { label: 'Genitalia', value: character.physicalAppearance?.genitalia || '' },
      { label: 'Skin Tone', value: character.physicalAppearance?.skinTone || '' },
      { label: 'Makeup', value: character.physicalAppearance?.makeup || '' },
      { label: 'Body Markings', value: character.physicalAppearance?.bodyMarkings || '' },
      { label: 'Temporary Conditions', value: character.physicalAppearance?.temporaryConditions || '' },
      ...(character.physicalAppearanceExtras || []),
    ]);
    writeSection('Currently Wearing', [
      { label: 'Top', value: character.currentlyWearing?.top || '' },
      { label: 'Bottom', value: character.currentlyWearing?.bottom || '' },
      { label: 'Undergarments', value: character.currentlyWearing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.currentlyWearing?.miscellaneous || '' },
      ...(character.currentlyWearingExtras || []),
    ]);
    writeSection('Preferred Clothing', [
      { label: 'Casual', value: character.preferredClothing?.casual || '' },
      { label: 'Work', value: character.preferredClothing?.work || '' },
      { label: 'Sleep', value: character.preferredClothing?.sleep || '' },
      { label: 'Undergarments', value: character.preferredClothing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.preferredClothing?.miscellaneous || '' },
      ...(character.preferredClothingExtras || []),
    ]);
    lines.push(rtfHeading('Personality', 2));
    if (character.personality) {
      lines.push(rtfBullet(`Split Mode: ${character.personality.splitMode ? 'true' : 'false'}`, 1080));
      character.personality.traits.forEach((row) => pushRtfField(lines, row.label || 'Trait', row.value));
      character.personality.outwardTraits.forEach((row) => pushRtfField(lines, `Outward ${row.label || 'Trait'}`, row.value));
      character.personality.inwardTraits.forEach((row) => pushRtfField(lines, `Inward ${row.label || 'Trait'}`, row.value));
    }

    writeSection('Tone', character.toneRows || []);
    writeSection('Background', [
      { label: 'Job Occupation', value: character.background?.jobOccupation || '' },
      { label: 'Education Level', value: character.background?.educationLevel || '' },
      { label: 'Residence', value: character.background?.residence || '' },
      { label: 'Hobbies', value: character.background?.hobbies || '' },
      { label: 'Financial Status', value: character.background?.financialStatus || '' },
      { label: 'Motivation', value: character.background?.motivation || '' },
      ...(character.backgroundExtras || []),
    ]);
    writeSection('Key Life Events', character.keyLifeEventRows || []);
    writeSection('Relationships', character.relationshipRows || []);
    writeSection('Secrets', character.secretRows || []);
    writeSection('Fears', character.fearRows || []);
    lines.push(rtfHeading('Character Goals', 2));
    (character.goals || []).forEach((goal) => {
      pushRtfField(lines, 'Goal', goal.title);
      pushRtfField(lines, 'Desired Outcome', goal.desiredOutcome || '');
      if (goal.flexibility) lines.push(rtfBullet(`Flexibility: ${goal.flexibility}`, 1080));
      goal.steps.forEach((step) => lines.push(rtfBullet(`Step: [${step.completed ? 'x' : ' '}] ${step.description}`, 1080)));
    });

    (character.customSections || []).forEach((section) => {
      lines.push(rtfHeading(safeTitle(section.title, 'Custom Content'), 2));
      if (section.type === 'freeform') {
        pushRtfField(lines, 'Content', section.freeformValue || '');
      } else {
        section.items.forEach((row) => pushRtfField(lines, row.label || 'Field', row.value));
      }
    });
  });

  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\viewkind4\\uc1 ${lines.join('')}}`;
};

export const exportScenarioToWordDocument = (data: ScenarioData): string => {
  return buildWordRtf(toTransferPayload(data));
};

const getHeadingText = (line: string): string | null => {
  const markdownMatch = line.match(/^#{1,6}\s+(.+)$/);
  if (markdownMatch) return markdownMatch[1].trim();
  const bracketMatch = line.match(/^\[(.+)\]$/);
  if (bracketMatch) return bracketMatch[1].trim();
  const bulletMatch = line.match(/^[-*•●▪◦]+\s+(.+)$/);
  if (bulletMatch) {
    const candidate = bulletMatch[1].trim();
    if (!candidate) return null;
    if (!candidate.includes(':')) return candidate;
    if (/^character\s*[:-]/i.test(candidate)) return candidate;
  }
  const colonHeadingMatch = line.match(/^([^:]{2,140})\s*:\s*$/);
  if (colonHeadingMatch) return colonHeadingMatch[1].trim();
  return null;
};

const extractMachinePayload = (text: string): TransferPayloadV1 | null => {
  const start = text.indexOf(MACHINE_START);
  const end = text.indexOf(MACHINE_END);
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonBlock = text.slice(start + MACHINE_START.length, end).trim();
  try {
    const parsed = JSON.parse(jsonBlock) as TransferPayloadV1;
    if (parsed && parsed.version === 1 && parsed.storyBuilder && Array.isArray(parsed.characters)) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = normalize(value);
  if (normalized === 'true' || normalized === 'yes' || normalized === '1') return true;
  if (normalized === 'false' || normalized === 'no' || normalized === '0') return false;
  return undefined;
};

const parseTimeOfDay = (value: string): TimeOfDay | undefined => {
  const normalized = normalize(value);
  if (normalized === 'sunrise' || normalized === 'day' || normalized === 'sunset' || normalized === 'night') {
    return normalized as TimeOfDay;
  }
  return undefined;
};

const mapCharacterSectionHeading = (heading: string): { key: string; customTitle?: string } => {
  const normalized = normalize(heading.replace(/:\s*$/, ''));
  if (normalized === 'basics' || normalized === 'profile' || normalized === 'avatar') return { key: 'basics' };
  if (normalized === 'appearance') return { key: 'physicalAppearance' };
  if (normalized === 'physicalappearance') return { key: 'physicalAppearance' };
  if (normalized === 'currentlywearing') return { key: 'currentlyWearing' };
  if (normalized === 'clothingpreference') return { key: 'preferredClothing' };
  if (normalized === 'preferredclothing') return { key: 'preferredClothing' };
  if (normalized === 'personality') return { key: 'personality' };
  if (normalized === 'tone') return { key: 'tone' };
  if (normalized === 'background') return { key: 'background' };
  if (normalized === 'keylifeevents') return { key: 'keyLifeEvents' };
  if (normalized === 'relationships') return { key: 'relationships' };
  if (normalized === 'secrets') return { key: 'secrets' };
  if (normalized === 'fears') return { key: 'fears' };
  if (normalized === 'charactergoals' || normalized === 'goals' || normalized === 'goalsanddesires') return { key: 'characterGoals' };
  if (normalized === 'kinks' || normalized === 'fantasies') {
    return { key: 'custom', customTitle: heading.replace(/:\s*$/, '').trim() };
  }
  return { key: 'custom', customTitle: heading.replace(/:\s*$/, '').trim() };
};

const parseNamedCharacterSectionHeading = (
  heading: string
): { name: string; key: string; customTitle?: string } | null => {
  const cleanedHeading = heading.replace(/:\s*$/, '').trim();
  const plainMatch = cleanedHeading.match(/^(.*?)\s+(basics|background|appearance|physical appearance|personality|tone|currently wearing|preferred clothing|clothing preference|fears|relationships|secrets|key life events|character goals|goals|kinks|fantasies)$/i);
  if (plainMatch) {
    const section = mapCharacterSectionHeading(plainMatch[2]);
    return { name: clean(plainMatch[1]), key: section.key, customTitle: section.customTitle };
  }
  const directMatch = cleanedHeading.match(/^(.*?)\s*[:-]\s*(basics|background|appearance|physical appearance|personality|tone|currently wearing|preferred clothing|clothing preference|fears|relationships|secrets|key life events|character goals|goals|kinks|fantasies)$/i);
  if (directMatch) {
    const section = mapCharacterSectionHeading(directMatch[2]);
    return { name: clean(directMatch[1]), key: section.key, customTitle: section.customTitle };
  }

  const possessiveMatch = cleanedHeading.match(/^(.*?)\s*(?:'s|s)\s+(basics|background|appearance|physical appearance|personality|tone|currently wearing|preferred clothing|clothing preference|fears|relationships|secrets|key life events|character goals|goals|kinks|fantasies)$/i);
  if (!possessiveMatch) return null;
  const section = mapCharacterSectionHeading(possessiveMatch[2]);
  return { name: clean(possessiveMatch[1]), key: section.key, customTitle: section.customTitle };
};

const upsertTransferRow = (rows: TransferRow[], label: string, value: string) => {
  const cleanLabel = clean(label) || 'Field';
  const cleanValue = clean(value);
  const match = rows.find((row) => normalize(row.label) === normalize(cleanLabel));
  if (match) {
    if (hasText(cleanValue)) match.value = cleanValue;
    return;
  }
  rows.push({ label: cleanLabel, value: cleanValue });
};

const parseTextToPayload = (text: string, warnings: string[]): { payload: TransferPayloadV1; skippedLines: number } => {
  const payload: TransferPayloadV1 = {
    version: 1,
    storyBuilder: {
      storyCard: {},
      worldCore: { customSections: [] },
      openingDialog: {},
    },
    characters: [],
  };

  let skippedLines = 0;
  let mode: 'story' | 'characters' = 'story';
  let storySection: 'storyCard' | 'worldCore' | 'openingDialog' | 'worldCustom' = 'worldCore';
  let currentWorldCustom: TransferCustomSection | null = null;
  let currentCharacter: TransferCharacter | null = null;
  let currentCharacterSection = 'basics';
  let currentCharacterCustom: TransferCustomSection | null = null;
  let currentGoal: TransferGoal | null = null;

  const lines = text.replace(/\r/g, '').split('\n');

  const ensureCharacter = (nameHint?: string) => {
    if (!currentCharacter) currentCharacter = createEmptyTransferCharacter(nameHint);
    if (!currentCharacter.customSections) currentCharacter.customSections = [];
    if (!currentCharacter.goals) currentCharacter.goals = [];
    return currentCharacter;
  };

  const flushCharacter = () => {
    if (!currentCharacter) return;
    const hasAnyContent =
      hasText(currentCharacter.name) ||
      hasText(currentCharacter.roleDescription) ||
      (currentCharacter.customSections || []).length > 0 ||
      (currentCharacter.goals || []).length > 0;
    if (hasAnyContent) payload.characters.push(currentCharacter);
    currentCharacter = null;
    currentCharacterCustom = null;
    currentCharacterSection = 'basics';
    currentGoal = null;
  };

  const getWorldCustom = (title: string) => {
    const safe = safeTitle(title, 'Imported World Content');
    const existing = (payload.storyBuilder.worldCore.customSections || []).find(
      (section) => normalize(section.title) === normalize(safe)
    );
    if (existing) return existing;
    const section: TransferCustomSection = { title: safe, type: 'structured', items: [] };
    payload.storyBuilder.worldCore.customSections = [...(payload.storyBuilder.worldCore.customSections || []), section];
    return section;
  };

  const getCharacterCustom = (title: string) => {
    const character = ensureCharacter();
    const safe = safeTitle(title, 'Imported Custom Content');
    const existing = (character.customSections || []).find((section) => normalize(section.title) === normalize(safe));
    if (existing) return existing;
    const section: TransferCustomSection = { title: safe, type: 'structured', items: [] };
    character.customSections = [...(character.customSections || []), section];
    return section;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    if (line === MACHINE_START || line === MACHINE_END) continue;

    const heading = getHeadingText(line);
    if (heading) {
      const headingValue = heading.replace(/:\s*$/, '').trim();
      const normalized = normalize(headingValue);

      const namedCharacterSection = parseNamedCharacterSectionHeading(headingValue);
      if (namedCharacterSection?.name) {
        const characterName = namedCharacterSection.name;
        if (!currentCharacter || normalize(currentCharacter.name || '') !== normalize(characterName)) {
          flushCharacter();
          currentCharacter = createEmptyTransferCharacter(characterName);
        } else if (!hasText(currentCharacter.name)) {
          currentCharacter.name = characterName;
        }
        mode = 'characters';
        currentCharacterSection = namedCharacterSection.key;
        currentGoal = null;
        if (namedCharacterSection.key === 'custom') {
          currentCharacterCustom = getCharacterCustom(namedCharacterSection.customTitle || headingValue);
        } else {
          currentCharacterCustom = null;
        }
        continue;
      }

      const characterHeading = headingValue.match(/^character\s*[:-]\s*(.+)$/i) || headingValue.match(/^character\s+(.+)$/i);
      if (characterHeading) {
        flushCharacter();
        mode = 'characters';
        currentCharacter = createEmptyTransferCharacter(characterHeading[1]);
        currentCharacterSection = 'basics';
        currentCharacterCustom = null;
        currentGoal = null;
        continue;
      }

      if (normalized === 'characters') {
        flushCharacter();
        mode = 'characters';
        continue;
      }

      if (mode === 'story') {
        if (normalized === 'storybuilder' || normalized === 'chroniclestorybuilderexport') continue;
        if (normalized === 'storycard') {
          storySection = 'storyCard';
          currentWorldCustom = null;
          continue;
        }
        if (normalized === 'worldcore') {
          storySection = 'worldCore';
          currentWorldCustom = null;
          continue;
        }
        if (normalized === 'openingdialog') {
          storySection = 'openingDialog';
          currentWorldCustom = null;
          continue;
        }
        if (normalized === 'scenario') {
          storySection = 'worldCore';
          currentWorldCustom = null;
          continue;
        }
        if (normalized === 'aiinstructions') {
          storySection = 'worldCustom';
          currentWorldCustom = getWorldCustom('AI Instructions');
          continue;
        }
        storySection = 'worldCustom';
        currentWorldCustom = getWorldCustom(headingValue);
        continue;
      }

      const section = mapCharacterSectionHeading(headingValue);
      currentCharacterSection = section.key;
      currentGoal = null;
      if (section.key === 'custom') {
        currentCharacterCustom = getCharacterCustom(section.customTitle || headingValue);
      } else {
        currentCharacterCustom = null;
      }
      continue;
    }

    const keyValueMatch = line.match(/^[-*•●▪◦]?\s*([^:]{1,120})\s*:\s*(.*)$/);
    if (!keyValueMatch) {
      if (mode === 'characters' && currentCharacterSection === 'custom' && currentCharacterCustom) {
        currentCharacterCustom.type = 'freeform';
        currentCharacterCustom.freeformValue = `${currentCharacterCustom.freeformValue ? `${currentCharacterCustom.freeformValue}\n` : ''}${raw}`;
      } else if (mode === 'story' && storySection === 'worldCustom' && currentWorldCustom) {
        currentWorldCustom.type = 'freeform';
        currentWorldCustom.freeformValue = `${currentWorldCustom.freeformValue ? `${currentWorldCustom.freeformValue}\n` : ''}${raw}`;
      } else if (mode === 'characters' && currentCharacterSection === 'characterGoals') {
        const stepMatch = line.match(/^[-*•●▪◦]?\s*\[(x| )\]\s*(.+)$/i);
        if (stepMatch) {
          const character = ensureCharacter();
          if (!currentGoal) {
            currentGoal = { title: 'Imported Goal', steps: [] };
            character.goals = [...(character.goals || []), currentGoal];
          }
          currentGoal.steps.push({ description: clean(stepMatch[2]), completed: stepMatch[1].toLowerCase() === 'x' });
        } else {
          skippedLines += 1;
        }
      } else {
        skippedLines += 1;
      }
      continue;
    }

    const key = keyValueMatch[1].trim();
    let value = keyValueMatch[2] ?? '';

    if (value === '"""') {
      const block: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        if (lines[j].trim() === '"""') break;
        block.push(lines[j].replace(/^\s*/, ''));
      }
      value = block.join('\n');
      i = j;
    }

    const normalizedKey = normalize(key);

    if (mode === 'story') {
      if (storySection === 'storyCard') {
        if (normalizedKey === 'storyname' || normalizedKey === 'scenarioname') payload.storyBuilder.storyCard.scenarioName = value;
        else if (normalizedKey === 'briefdescription') payload.storyBuilder.storyCard.briefDescription = value;
        else {
          currentWorldCustom = getWorldCustom('Imported Story Card');
          upsertTransferRow(currentWorldCustom.items, key, value);
        }
        continue;
      }

      if (storySection === 'openingDialog') {
        if (normalizedKey === 'enabled') {
          const parsed = parseBoolean(value);
          if (typeof parsed === 'boolean') payload.storyBuilder.openingDialog.enabled = parsed;
        } else if (normalizedKey === 'text') {
          payload.storyBuilder.openingDialog.text = value;
        } else if (normalizedKey === 'startingday') {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) payload.storyBuilder.openingDialog.startingDay = parsed;
        } else if (normalizedKey === 'startingtimeofday') {
          const parsed = parseTimeOfDay(value);
          if (parsed) payload.storyBuilder.openingDialog.startingTimeOfDay = parsed;
        } else {
          currentWorldCustom = getWorldCustom('Imported Opening Dialog');
          upsertTransferRow(currentWorldCustom.items, key, value);
        }
        continue;
      }

      if (storySection === 'worldCore') {
        if (normalizedKey === 'storypremise' || normalizedKey === 'scenario') payload.storyBuilder.worldCore.storyPremise = value;
        else if (normalizedKey === 'factions') payload.storyBuilder.worldCore.factions = value;
        else if (normalizedKey === 'locations') payload.storyBuilder.worldCore.locations = value;
        else if (normalizedKey === 'historytimeline') payload.storyBuilder.worldCore.historyTimeline = value;
        else if (normalizedKey === 'tonethemes' || normalizedKey === 'tone') payload.storyBuilder.worldCore.toneThemes = value;
        else if (normalizedKey === 'plothooks') payload.storyBuilder.worldCore.plotHooks = value;
        else if (normalizedKey === 'dialogformatting') payload.storyBuilder.worldCore.dialogFormatting = value;
        else {
          currentWorldCustom = getWorldCustom('Imported World Core');
          upsertTransferRow(currentWorldCustom.items, key, value);
        }
        continue;
      }

      currentWorldCustom = currentWorldCustom || getWorldCustom('Imported World Content');
      upsertTransferRow(currentWorldCustom.items, key, value);
      continue;
    }

    const character = ensureCharacter();

    if (currentCharacterSection === 'basics') {
      if (normalizedKey === 'name') character.name = value;
      else if (normalizedKey === 'nicknames') character.nicknames = value;
      else if (normalizedKey === 'age') character.age = value;
      else if (normalizedKey === 'sexidentity' || normalizedKey === 'sextype') character.sexType = value;
      else if (normalizedKey === 'sexualorientation') character.sexualOrientation = value;
      else if (normalizedKey === 'location') character.location = value;
      else if (normalizedKey === 'currentmood') character.currentMood = value;
      else if (normalizedKey === 'controlledby') {
        const control = normalize(value);
        if (control === 'user') character.controlledBy = 'User';
        if (control === 'ai') character.controlledBy = 'AI';
      } else if (normalizedKey === 'characterrole' || normalizedKey === 'role') {
        const role = normalize(value);
        if (role === 'main') character.characterRole = 'Main';
        if (role === 'side') character.characterRole = 'Side';
      } else if (normalizedKey === 'roledescription') character.roleDescription = value;
      else {
        currentCharacterCustom = getCharacterCustom('Imported Basics');
        upsertTransferRow(currentCharacterCustom.items, key, value);
      }
      continue;
    }

    const applyKnownWithExtras = (
      target: Record<string, any> | undefined,
      extras: TransferRow[] | undefined,
      mapping: Record<string, string>
    ) => {
      const keyName = mapping[normalizedKey];
      if (keyName) {
        const obj = target || {};
        obj[keyName] = value;
        return { target: obj, extras: extras || [] };
      }
      const rows = extras || [];
      upsertTransferRow(rows, key, value);
      return { target: target || {}, extras: rows };
    };

    if (currentCharacterSection === 'physicalAppearance') {
      const mapped = applyKnownWithExtras(
        character.physicalAppearance,
        character.physicalAppearanceExtras,
        {
          haircolor: 'hairColor',
          eyecolor: 'eyeColor',
          build: 'build',
          bodyhair: 'bodyHair',
          height: 'height',
          breastsize: 'breastSize',
          breasts: 'breastSize',
          genitalia: 'genitalia',
          skintone: 'skinTone',
          makeup: 'makeup',
          bodymarkings: 'bodyMarkings',
          temporaryconditions: 'temporaryConditions',
        }
      );
      character.physicalAppearance = mapped.target;
      character.physicalAppearanceExtras = mapped.extras;
      continue;
    }

    if (currentCharacterSection === 'currentlyWearing') {
      const mapped = applyKnownWithExtras(
        character.currentlyWearing,
        character.currentlyWearingExtras,
        {
          top: 'top',
          shirttop: 'top',
          bottom: 'bottom',
          pantsbottoms: 'bottom',
          undergarments: 'undergarments',
          miscellaneous: 'miscellaneous',
        }
      );
      character.currentlyWearing = mapped.target;
      character.currentlyWearingExtras = mapped.extras;
      continue;
    }

    if (currentCharacterSection === 'preferredClothing') {
      const mapped = applyKnownWithExtras(
        character.preferredClothing,
        character.preferredClothingExtras,
        {
          casual: 'casual',
          work: 'work',
          sleep: 'sleep',
          undergarments: 'undergarments',
          miscellaneous: 'miscellaneous',
        }
      );
      character.preferredClothing = mapped.target;
      character.preferredClothingExtras = mapped.extras;
      continue;
    }

    if (currentCharacterSection === 'personality') {
      const personality = character.personality || {
        splitMode: false,
        traits: [],
        outwardTraits: [],
        inwardTraits: [],
      };
      if (normalizedKey === 'splitmode') {
        const parsed = parseBoolean(value);
        if (typeof parsed === 'boolean') personality.splitMode = parsed;
      } else if (normalizedKey.startsWith('outward')) {
        upsertTransferRow(personality.outwardTraits, key.replace(/^Outward\s*/i, ''), value);
      } else if (normalizedKey.startsWith('inward')) {
        upsertTransferRow(personality.inwardTraits, key.replace(/^Inward\s*/i, ''), value);
      } else {
        upsertTransferRow(personality.traits, key, value);
      }
      character.personality = personality;
      continue;
    }

    if (currentCharacterSection === 'tone') {
      const rows = character.toneRows || [];
      upsertTransferRow(rows, key, value);
      character.toneRows = rows;
      continue;
    }

    if (currentCharacterSection === 'background') {
      const mapped = applyKnownWithExtras(
        character.background,
        character.backgroundExtras,
        {
          joboccupation: 'jobOccupation',
          educationlevel: 'educationLevel',
          residence: 'residence',
          hobbies: 'hobbies',
          financialstatus: 'financialStatus',
          motivation: 'motivation',
        }
      );
      character.background = mapped.target;
      character.backgroundExtras = mapped.extras;
      continue;
    }

    if (currentCharacterSection === 'keyLifeEvents') {
      const rows = character.keyLifeEventRows || [];
      upsertTransferRow(rows, key, value);
      character.keyLifeEventRows = rows;
      continue;
    }

    if (currentCharacterSection === 'relationships') {
      const rows = character.relationshipRows || [];
      upsertTransferRow(rows, key, value);
      character.relationshipRows = rows;
      continue;
    }

    if (currentCharacterSection === 'secrets') {
      const rows = character.secretRows || [];
      upsertTransferRow(rows, key, value);
      character.secretRows = rows;
      continue;
    }

    if (currentCharacterSection === 'fears') {
      const rows = character.fearRows || [];
      upsertTransferRow(rows, key, value);
      character.fearRows = rows;
      continue;
    }

    if (currentCharacterSection === 'characterGoals') {
      if (!character.goals) character.goals = [];
      if (normalizedKey === 'goal') {
        currentGoal = {
          title: clean(value) || 'Imported Goal',
          desiredOutcome: '',
          flexibility: 'normal',
          steps: [],
        };
        character.goals.push(currentGoal);
      } else if (normalizedKey === 'desiredoutcome') {
        if (!currentGoal) {
          currentGoal = { title: 'Imported Goal', desiredOutcome: '', flexibility: 'normal', steps: [] };
          character.goals.push(currentGoal);
        }
        currentGoal.desiredOutcome = value;
      } else if (normalizedKey === 'flexibility') {
        const flex = normalize(value);
        if (!currentGoal) {
          currentGoal = { title: 'Imported Goal', desiredOutcome: '', flexibility: 'normal', steps: [] };
          character.goals.push(currentGoal);
        }
        if (flex === 'rigid' || flex === 'normal' || flex === 'flexible') {
          currentGoal.flexibility = flex;
        }
      } else if (normalizedKey === 'step') {
        const stepMatch = value.match(/^\[(x| )\]\s*(.+)$/i);
        if (!currentGoal) {
          currentGoal = { title: 'Imported Goal', desiredOutcome: '', flexibility: 'normal', steps: [] };
          character.goals.push(currentGoal);
        }
        currentGoal.steps.push({
          description: clean(stepMatch ? stepMatch[2] : value),
          completed: !!stepMatch && stepMatch[1].toLowerCase() === 'x',
        });
      } else {
        currentCharacterCustom = getCharacterCustom('Imported Goals Notes');
        upsertTransferRow(currentCharacterCustom.items, key, value);
      }
      continue;
    }

    currentCharacterCustom = currentCharacterCustom || getCharacterCustom('Imported Custom Content');
    upsertTransferRow(currentCharacterCustom.items, key, value);
  }

  flushCharacter();

  if (skippedLines > 0) warnings.push(`${skippedLines} line(s) were skipped because they were not clearly mappable.`);
  return { payload, skippedLines };
};

const mergeRows = (existing: TransferRow[], incoming: TransferRow[], mode: StoryImportMode): TransferRow[] => {
  const next = [...existing];
  incoming.forEach((row) => {
    if (!hasText(row.label) && !hasText(row.value)) return;
    const idx = next.findIndex((item) => normalize(item.label) === normalize(row.label));
    if (idx === -1) {
      next.push({ label: clean(row.label) || 'Field', value: clean(row.value) });
      return;
    }
    if (hasText(row.value)) {
      next[idx] = {
        ...next[idx],
        value: mergeText(next[idx].value || '', clean(row.value), mode),
      };
    }
  });
  return next;
};

const mergeExtras = (
  existing: CharacterExtraRow[] | undefined,
  incoming: TransferRow[],
  mode: StoryImportMode
): CharacterExtraRow[] => {
  const merged = mergeRows(
    (existing || []).map((row) => ({ label: row.label, value: row.value })),
    incoming,
    mode
  );
  return rowsToExtras(merged);
};

const mergeCharacterCustomSections = (
  existing: CharacterTraitSection[],
  incoming: TransferCustomSection[],
  summary: StoryTransferSummary,
  mode: StoryImportMode
): CharacterTraitSection[] => {
  const next = [...existing];
  incoming.forEach((section) => {
    const title = safeTitle(section.title, 'Custom Content');
    const idx = next.findIndex((item) => normalize(item.title) === normalize(title));
    if (idx === -1) {
      const nowTs = now();
      next.push({
        id: uid('sec'),
        title,
        type: section.type || 'structured',
        items: section.type === 'freeform' ? [] : rowsToItems(section.items || []),
        freeformValue: section.type === 'freeform' ? clean(section.freeformValue || '') : undefined,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
      summary.createdCharacterCustomSections += 1;
      return;
    }
    const current = next[idx];
    if ((section.type || 'structured') === 'freeform') {
      if (hasText(section.freeformValue)) {
        const incomingValue = clean(section.freeformValue);
        const merged = mergeText(current.freeformValue || '', incomingValue, mode);
        next[idx] = { ...current, type: 'freeform', freeformValue: merged, updatedAt: now() };
      }
      return;
    }

    const currentRows = (current.items || []).map((item) => ({ label: item.label, value: item.value }));
    const mergedRows = mergeRows(currentRows, section.items || [], mode);
    next[idx] = {
      ...current,
      type: 'structured',
      items: rowsToItems(mergedRows),
      updatedAt: now(),
    };
  });
  return next;
};

const mergeWorldCustomSections = (
  existing: WorldCustomSection[] | undefined,
  incoming: TransferCustomSection[] | undefined,
  summary: StoryTransferSummary,
  mode: StoryImportMode
): WorldCustomSection[] | undefined => {
  const base = [...(existing || [])];
  (incoming || []).forEach((section) => {
    const title = safeTitle(section.title, 'Custom Content');
    const idx = base.findIndex((item) => normalize(item.title) === normalize(title));
    if (idx === -1) {
      base.push({
        id: uid('wcs'),
        title,
        type: section.type || 'structured',
        items: section.type === 'freeform' ? [] : worldRowsToItems(section.items || []),
        freeformValue: section.type === 'freeform' ? clean(section.freeformValue || '') : undefined,
      });
      summary.createdWorldCustomSections += 1;
      return;
    }
    const current = base[idx];
    if ((section.type || 'structured') === 'freeform') {
      if (hasText(section.freeformValue)) {
        const incomingValue = clean(section.freeformValue);
        base[idx] = {
          ...current,
          type: 'freeform',
          freeformValue: mergeText(current.freeformValue || '', incomingValue, mode),
        };
      }
      return;
    }
    const merged = mergeRows(
      (current.items || []).map((item) => ({ label: item.label, value: item.value })),
      section.items || [],
      mode
    );
    base[idx] = { ...current, type: 'structured', items: worldRowsToItems(merged) };
  });
  return base.length > 0 ? base : undefined;
};

const applyPersonality = (character: Character, incoming: TransferPersonality | undefined, mode: StoryImportMode) => {
  if (!incoming) return character.personality;
  const toTraits = (rows: TransferRow[]): PersonalityTrait[] =>
    rows
      .filter((row) => hasText(row.label) || hasText(row.value))
      .map((row) => ({
        id: uid('ptrait'),
        label: clean(row.label),
        value: clean(row.value),
        flexibility: 'normal' as const,
      }));

  const base = character.personality || {
    splitMode: incoming.splitMode,
    traits: [],
    outwardTraits: [],
    inwardTraits: [],
  };

  const mergeTraitList = (existing: PersonalityTrait[], rows: TransferRow[]) => {
    const merged = mergeRows(existing.map((trait) => ({ label: trait.label, value: trait.value })), rows, mode);
    return merged.map((row, idx) => ({
      id: existing[idx]?.id || uid('ptrait'),
      label: row.label,
      value: row.value,
      flexibility: existing[idx]?.flexibility || ('normal' as const),
    }));
  };

  return {
    splitMode: incoming.splitMode,
    traits: mergeTraitList(base.traits || [], incoming.traits || []),
    outwardTraits: mergeTraitList(base.outwardTraits || [], incoming.outwardTraits || []),
    inwardTraits: mergeTraitList(base.inwardTraits || [], incoming.inwardTraits || []),
  };
};

const applyGoals = (
  character: Character,
  incomingGoals: TransferGoal[] | undefined,
  mode: StoryImportMode
) => {
  if (!incomingGoals || incomingGoals.length === 0) return character.goals || [];
  const base = [...(character.goals || [])];
  incomingGoals.forEach((goal) => {
    if (!hasText(goal.title) && !hasText(goal.desiredOutcome) && (goal.steps || []).length === 0) return;
    const title = clean(goal.title) || 'Imported Goal';
    const idx = base.findIndex((item) => normalize(item.title) === normalize(title));
    if (idx === -1) {
      base.push({
        id: uid('goal'),
        title,
        desiredOutcome: clean(goal.desiredOutcome || ''),
        currentStatus: '',
        progress: 0,
        flexibility: goal.flexibility || 'normal',
        steps: (goal.steps || []).map((step) => ({
          id: uid('step'),
          description: clean(step.description),
          completed: !!step.completed,
        })),
        createdAt: now(),
        updatedAt: now(),
      });
      return;
    }
    const current = base[idx];
    const stepRows = mergeRows(
      (current.steps || []).map((step) => ({ label: step.description, value: step.completed ? 'x' : '' })),
      (goal.steps || []).map((step) => ({ label: step.description, value: step.completed ? 'x' : '' })),
      mode
    );
    base[idx] = {
      ...current,
      desiredOutcome: mergeText(current.desiredOutcome, goal.desiredOutcome, mode),
      flexibility: goal.flexibility || current.flexibility,
      steps: stepRows.map((step, stepIdx) => ({
        id: current.steps?.[stepIdx]?.id || uid('step'),
        description: clean(step.label),
        completed: normalize(step.value) === 'x',
      })),
      updatedAt: now(),
    };
  });
  return base;
};

const mergePayloadIntoScenario = (
  base: ScenarioData,
  payload: TransferPayloadV1,
  skippedLines: number,
  warnings: string[],
  mode: StoryImportMode
): StoryTransferResult => {
  const next: ScenarioData = JSON.parse(JSON.stringify(base));
  const summary: StoryTransferSummary = {
    updatedStoryFields: 0,
    updatedCharacters: 0,
    createdCharacters: 0,
    createdCharacterCustomSections: 0,
    createdWorldCustomSections: 0,
    skippedLines,
  };

  const updateStoryField = (current: string, incoming: string | undefined, style: 'scalar' | 'narrative' = 'scalar'): string => {
    const nextValue =
      style === 'narrative'
        ? mergeText(current, incoming, mode)
        : mergeScalarText(current, incoming, mode);
    if (nextValue !== current) summary.updatedStoryFields += 1;
    return nextValue;
  };

  next.world.core.scenarioName = updateStoryField(next.world.core.scenarioName, payload.storyBuilder.storyCard.scenarioName, 'scalar');
  next.world.core.briefDescription = updateStoryField(next.world.core.briefDescription, payload.storyBuilder.storyCard.briefDescription, 'narrative');
  next.world.core.storyPremise = updateStoryField(next.world.core.storyPremise, payload.storyBuilder.worldCore.storyPremise, 'narrative');
  next.world.core.factions = updateStoryField(next.world.core.factions, payload.storyBuilder.worldCore.factions, 'narrative');
  next.world.core.locations = updateStoryField(next.world.core.locations, payload.storyBuilder.worldCore.locations, 'narrative');
  next.world.core.historyTimeline = updateStoryField(next.world.core.historyTimeline, payload.storyBuilder.worldCore.historyTimeline, 'narrative');
  next.world.core.toneThemes = updateStoryField(next.world.core.toneThemes, payload.storyBuilder.worldCore.toneThemes, 'narrative');
  next.world.core.plotHooks = updateStoryField(next.world.core.plotHooks, payload.storyBuilder.worldCore.plotHooks, 'narrative');
  next.world.core.dialogFormatting = updateStoryField(next.world.core.dialogFormatting, payload.storyBuilder.worldCore.dialogFormatting, 'narrative');

  next.world.core.customWorldSections = mergeWorldCustomSections(
    next.world.core.customWorldSections,
    payload.storyBuilder.worldCore.customSections,
    summary,
    mode
  );

  const opening: OpeningDialog = next.story.openingDialog;
  if (typeof payload.storyBuilder.openingDialog.enabled === 'boolean') opening.enabled = payload.storyBuilder.openingDialog.enabled;
  opening.text = mergeText(opening.text, payload.storyBuilder.openingDialog.text, mode);
  if (typeof payload.storyBuilder.openingDialog.startingDay === 'number') opening.startingDay = payload.storyBuilder.openingDialog.startingDay;
  if (payload.storyBuilder.openingDialog.startingTimeOfDay) opening.startingTimeOfDay = payload.storyBuilder.openingDialog.startingTimeOfDay;
  next.story.openingDialog = opening;

  payload.characters.forEach((incoming) => {
    const incomingName = clean(incoming.name);
    if (!hasText(incomingName)) {
      warnings.push('Skipped one character block because it had no clear name.');
      return;
    }
    let character = next.characters.find((item) => normalize(item.name) === normalize(incomingName));
    if (!character) {
      character = createBlankCharacter(incomingName);
      next.characters = [character, ...next.characters];
      summary.createdCharacters += 1;
    } else {
      summary.updatedCharacters += 1;
    }

    character.name = mergeScalarText(character.name, incoming.name, mode);
    character.nicknames = mergeScalarText(character.nicknames, incoming.nicknames, mode);
    character.age = mergeScalarText(character.age, incoming.age, mode);
    character.sexType = mergeScalarText(character.sexType, incoming.sexType, mode);
    character.sexualOrientation = mergeScalarText(character.sexualOrientation, incoming.sexualOrientation, mode);
    character.location = mergeText(character.location, incoming.location, mode);
    character.currentMood = mergeText(character.currentMood, incoming.currentMood, mode);
    character.roleDescription = mergeText(character.roleDescription, incoming.roleDescription, mode);
    if (incoming.controlledBy === 'AI' || incoming.controlledBy === 'User') character.controlledBy = incoming.controlledBy;
    if (incoming.characterRole === 'Main' || incoming.characterRole === 'Side') character.characterRole = incoming.characterRole;

    if (incoming.physicalAppearance) {
      character.physicalAppearance = {
        ...character.physicalAppearance,
        ...Object.fromEntries(
          Object.entries(incoming.physicalAppearance).filter(([, value]) => hasText(value as string))
        ),
      };
    }
    character.physicalAppearance._extras = mergeExtras(character.physicalAppearance._extras, incoming.physicalAppearanceExtras || [], mode);

    if (incoming.currentlyWearing) {
      character.currentlyWearing = {
        ...character.currentlyWearing,
        ...Object.fromEntries(
          Object.entries(incoming.currentlyWearing).filter(([, value]) => hasText(value as string))
        ),
      };
    }
    character.currentlyWearing._extras = mergeExtras(character.currentlyWearing._extras, incoming.currentlyWearingExtras || [], mode);

    if (incoming.preferredClothing) {
      character.preferredClothing = {
        ...character.preferredClothing,
        ...Object.fromEntries(
          Object.entries(incoming.preferredClothing).filter(([, value]) => hasText(value as string))
        ),
      };
    }
    character.preferredClothing._extras = mergeExtras(character.preferredClothing._extras, incoming.preferredClothingExtras || [], mode);

    character.personality = applyPersonality(character, incoming.personality, mode);

    character.background = {
      ...(character.background || { ...defaultCharacterBackground }),
      ...Object.fromEntries(
        Object.entries(incoming.background || {}).filter(([, value]) => hasText(value as string))
      ),
    };
    character.background._extras = mergeExtras(character.background._extras, incoming.backgroundExtras || [], mode);

    character.tone = character.tone || { _extras: [] };
    character.tone._extras = mergeExtras(character.tone._extras, incoming.toneRows || [], mode);
    character.keyLifeEvents = character.keyLifeEvents || { _extras: [] };
    character.keyLifeEvents._extras = mergeExtras(character.keyLifeEvents._extras, incoming.keyLifeEventRows || [], mode);
    character.relationships = character.relationships || { _extras: [] };
    character.relationships._extras = mergeExtras(character.relationships._extras, incoming.relationshipRows || [], mode);
    character.secrets = character.secrets || { _extras: [] };
    character.secrets._extras = mergeExtras(character.secrets._extras, incoming.secretRows || [], mode);
    character.fears = character.fears || { _extras: [] };
    character.fears._extras = mergeExtras(character.fears._extras, incoming.fearRows || [], mode);

    character.goals = applyGoals(character, incoming.goals, mode);
    character.sections = mergeCharacterCustomSections(character.sections || [], incoming.customSections || [], summary, mode);
    character.updatedAt = now();
  });

  return { data: next, summary, warnings };
};

export const importScenarioFromText = (
  text: string,
  base: ScenarioData,
  mode: StoryImportMode = 'merge'
): StoryTransferResult => {
  const warnings: string[] = [];
  const machinePayload = extractMachinePayload(text);
  if (machinePayload) {
    return mergePayloadIntoScenario(base, machinePayload, 0, warnings, mode);
  }

  const heuristic = parseTextToPayload(text, warnings);
  return mergePayloadIntoScenario(base, heuristic.payload, heuristic.skippedLines, warnings, mode);
};

const looksLikeTransferPayload = (value: unknown): value is TransferPayloadV1 => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as TransferPayloadV1;
  return (
    candidate.version === 1 &&
    !!candidate.storyBuilder &&
    typeof candidate.storyBuilder === 'object' &&
    Array.isArray(candidate.characters)
  );
};

const looksLikeScenarioData = (value: unknown): value is ScenarioData => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as ScenarioData;
  return (
    Array.isArray(candidate.characters) &&
    !!candidate.world &&
    !!candidate.story &&
    typeof candidate.world === 'object' &&
    typeof candidate.story === 'object'
  );
};

const normalizeImportText = (text: string): string => {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/^\s*[•●▪◦]\s+/gm, '- ');
};

const htmlToMarkdown = (html: string): string => {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });
  return turndown.turndown(html);
};

const rtfToText = (rtf: string): string => {
  return rtf
    .replace(/\\r\\n?/g, '\n')
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\line/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\\u8226\?/g, '- ')
    .replace(/\\'[0-9a-fA-F]{2}/g, ' ')
    .replace(/\\[a-z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\\\/g, '\\')
    .replace(/\n{3,}/g, '\n\n');
};

export const importScenarioFromAny = (
  input: { text: string; fileName?: string; mimeType?: string },
  base: ScenarioData,
  mode: StoryImportMode = 'merge'
): StoryTransferResult => {
  const warnings: string[] = [];
  const rawText = input.text || '';
  const fileName = clean(input.fileName || '').toLowerCase();
  const mimeType = clean(input.mimeType || '').toLowerCase();
  const trimmed = rawText.trim();

  const isLikelyJson =
    fileName.endsWith('.json') ||
    mimeType.includes('json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  if (isLikelyJson) {
    try {
      const parsed = JSON.parse(trimmed);
      if (looksLikeTransferPayload(parsed)) {
        return mergePayloadIntoScenario(base, parsed, 0, warnings, mode);
      }
      if (looksLikeScenarioData(parsed)) {
        return mergePayloadIntoScenario(base, toTransferPayload(parsed), 0, warnings, mode);
      }
      warnings.push('JSON file format was not recognized; falling back to text import.');
    } catch (error) {
      warnings.push('JSON parse failed; falling back to text import.');
    }
  }

  const looksLikeHtml =
    /<\s*html|<\s*body|<\s*h[1-6]\b|<\s*p\b|<\s*li\b|<\s*ul\b/i.test(rawText) ||
    fileName.endsWith('.html') ||
    fileName.endsWith('.htm') ||
    fileName.endsWith('.doc') ||
    mimeType.includes('html') ||
    mimeType.includes('msword');

  const looksLikeRtf =
    fileName.endsWith('.rtf') ||
    mimeType.includes('rtf') ||
    rawText.trimStart().startsWith('{\\rtf');

  let textForParsing = rawText;
  if (looksLikeRtf) {
    textForParsing = rtfToText(rawText);
  } else if (looksLikeHtml) {
    try {
      textForParsing = htmlToMarkdown(rawText);
    } catch (error) {
      warnings.push('Document formatting conversion was partial; attempting plain text import.');
    }
  }

  if (fileName.endsWith('.docx')) {
    warnings.push('DOCX parsing can be imperfect in browser import mode. If mapping looks off, export to Markdown or JSON and retry.');
  }

  const normalizedText = normalizeImportText(textForParsing);
  const result = importScenarioFromText(normalizedText, base, mode);
  return {
    ...result,
    warnings: [...warnings, ...result.warnings],
  };
};
