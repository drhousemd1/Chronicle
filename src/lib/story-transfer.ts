import {
  Character,
  CharacterBackground,
  CharacterControl,
  ContentThemes,
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
  Scene,
  ScenarioData,
  TimeOfDay,
  WorldCustomItem,
  WorldCustomSection,
  defaultContentThemes,
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
import { getTagInjection } from '@/constants/tag-injection-registry';
import { now, uid, uuid } from '@/utils';
import TurndownService from 'turndown';

const MACHINE_START = '--- BEGIN CHRONICLE MACHINE DATA v1 ---';
const MACHINE_END = '--- END CHRONICLE MACHINE DATA ---';

export type StoryTransferEditorState = {
  coverImage?: string;
  coverImagePosition?: { x: number; y: number };
  contentThemes?: ContentThemes;
};

export type StoryTransferExportOptions = StoryTransferEditorState;

type StoryTransferPackageV2 = {
  packageType: 'chronicle-story-transfer';
  packageVersion: 2;
  exportedAt: string;
  scenario: ScenarioData;
  editorState?: StoryTransferEditorState;
};

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
  currentStatus?: string;
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
  scenePosition?: string;
  currentMood?: string;
  controlledBy?: CharacterControl;
  characterRole?: CharacterRole;
  roleDescription?: string;
  tags?: string;
  avatarDataUrl?: string;
  avatarPosition?: { x: number; y: number };
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
      structuredLocations?: TransferRow[];
      storyGoals?: TransferGoal[];
      dialogFormatting?: string;
      codexEntries?: Array<{ title: string; body: string }>;
      customSections?: TransferCustomSection[];
    };
    contentThemes?: ContentThemes;
    builderAssets?: {
      coverImage?: string;
      coverImagePosition?: { x: number; y: number };
      selectedArtStyle?: string;
      scenes?: Array<{
        title?: string;
        url?: string;
        tags?: string[];
        isStartingScene?: boolean;
      }>;
    };
    uiSettings?: ScenarioData['uiSettings'];
    openingDialog: {
      enabled?: boolean;
      text?: string;
      startingDay?: number;
      startingTimeOfDay?: TimeOfDay;
      timeProgressionMode?: 'manual' | 'automatic';
      timeProgressionInterval?: number;
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
  editorState?: StoryTransferEditorState;
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

const pushRowField = (lines: string[], label: string, value?: string, indentLevel = 0, fallbackLabel = 'Field') => {
  const resolvedLabel = clean(label) || fallbackLabel;
  const resolvedValue = typeof value === 'string' ? value.replace(/\r/g, '') : '';
  if (!hasText(resolvedLabel) && !hasText(resolvedValue)) return;

  const indent = '  '.repeat(indentLevel);
  if (!hasText(resolvedValue)) {
    lines.push(`${indent}- ${resolvedLabel}:`);
    return;
  }

  if (!resolvedValue.includes('\n')) {
    lines.push(`${indent}- ${resolvedLabel}: ${resolvedValue}`);
    return;
  }

  lines.push(`${indent}- ${resolvedLabel}: """`);
  resolvedValue.split('\n').forEach((line) => lines.push(`${indent}  ${line}`));
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

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const cloneContentThemes = (themes?: ContentThemes): ContentThemes | undefined => {
  if (!themes) return undefined;
  return {
    characterTypes: [...(themes.characterTypes || [])],
    storyType: themes.storyType ?? null,
    genres: [...(themes.genres || [])],
    origin: [...(themes.origin || [])],
    triggerWarnings: [...(themes.triggerWarnings || [])],
    customTags: [...(themes.customTags || [])],
  };
};

const buildScenarioForTransfer = (
  data: ScenarioData,
  options?: StoryTransferExportOptions
): ScenarioData => {
  const scenario = clone(data);
  const themes = cloneContentThemes(options?.contentThemes ?? data.contentThemes);
  if (themes) scenario.contentThemes = themes;
  return scenario;
};

const buildTransferPackage = (
  data: ScenarioData,
  options?: StoryTransferExportOptions
): StoryTransferPackageV2 => {
  const scenario = buildScenarioForTransfer(data, options);
  const editorState: StoryTransferEditorState = {};

  if (typeof options?.coverImage === 'string') editorState.coverImage = options.coverImage;
  if (options?.coverImagePosition) editorState.coverImagePosition = { ...options.coverImagePosition };
  if (scenario.contentThemes) editorState.contentThemes = cloneContentThemes(scenario.contentThemes);

  return {
    packageType: 'chronicle-story-transfer',
    packageVersion: 2,
    exportedAt: new Date().toISOString(),
    scenario,
    editorState: Object.keys(editorState).length > 0 ? editorState : undefined,
  };
};

const buildMachinePayloadBlock = (packagePayload: StoryTransferPackageV2): string => {
  return `${MACHINE_START}\n${JSON.stringify(packagePayload, null, 2)}\n${MACHINE_END}`;
};

const appendMachinePayloadToText = (humanReadable: string, packagePayload: StoryTransferPackageV2): string => {
  return `${humanReadable.trimEnd()}\n\n${buildMachinePayloadBlock(packagePayload)}\n`;
};

const appendMachinePayloadToRtf = (rtfDocument: string, packagePayload: StoryTransferPackageV2): string => {
  const hiddenPayload = buildMachinePayloadBlock(packagePayload)
    .split('\n')
    .map((line) => `\\pard\\v\\fs1 ${escapeRtf(line)}\\v0\\par`)
    .join('');

  return rtfDocument.endsWith('}')
    ? `${rtfDocument.slice(0, -1)}${hiddenPayload}}`
    : `${rtfDocument}${hiddenPayload}`;
};

const stringifyPosition = (position?: { x: number; y: number }): string => {
  if (!position) return '';
  return `${position.x}% x, ${position.y}% y`;
};

const splitCommaSeparated = (value: string | undefined | null): string[] => {
  return (value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const mergeUniqueStrings = (current: string[], incoming: string[]): string[] => {
  const merged = [...current];
  incoming.forEach((item) => {
    if (!merged.some((existing) => normalize(existing) === normalize(item))) {
      merged.push(item);
    }
  });
  return merged;
};

const mergeTagString = (current: string, incoming: string | undefined, mode: StoryImportMode): string => {
  if (!hasText(incoming)) return current;
  const incomingTags = splitCommaSeparated(incoming);
  if (incomingTags.length === 0) return current;
  if (mode === 'rewrite' || !hasText(current)) return incomingTags.join(', ');
  return mergeUniqueStrings(splitCommaSeparated(current), incomingTags).join(', ');
};

const mergeContentThemes = (
  current: ContentThemes | undefined,
  incoming: ContentThemes | undefined,
  mode: StoryImportMode
): ContentThemes | undefined => {
  if (!incoming) return current;
  if (mode === 'rewrite' || !current) return cloneContentThemes(incoming);

  return {
    characterTypes: mergeUniqueStrings(current.characterTypes || [], incoming.characterTypes || []),
    storyType: current.storyType ?? incoming.storyType ?? null,
    genres: mergeUniqueStrings(current.genres || [], incoming.genres || []),
    origin: mergeUniqueStrings(current.origin || [], incoming.origin || []),
    triggerWarnings: mergeUniqueStrings(current.triggerWarnings || [], incoming.triggerWarnings || []),
    customTags: mergeUniqueStrings(current.customTags || [], incoming.customTags || []),
  };
};

const mergeCodexEntries = (
  existing: ScenarioData['world']['entries'],
  incoming: ScenarioData['world']['entries'],
  mode: StoryImportMode
): ScenarioData['world']['entries'] => {
  if (!incoming || incoming.length === 0) return existing;
  if (mode === 'rewrite') return clone(incoming);

  const merged = [...(existing || [])];
  incoming.forEach((entry) => {
    const title = clean(entry.title);
    if (!hasText(title) && !hasText(entry.body)) return;
    const idx = merged.findIndex((item) => normalize(item.title) === normalize(title));
    if (idx === -1) {
      merged.push({
        id: entry.id || uuid(),
        title: title || 'Imported Entry',
        body: clean(entry.body),
        createdAt: entry.createdAt || now(),
        updatedAt: entry.updatedAt || now(),
      });
      return;
    }
    merged[idx] = {
      ...merged[idx],
      body: mergeText(merged[idx].body || '', entry.body || '', mode),
      updatedAt: now(),
    };
  });
  return merged;
};

const mergeSceneTags = (current: string[] = [], incoming: string[] = []): string[] => {
  return mergeUniqueStrings(current, incoming);
};

const mergeScenes = (
  existing: ScenarioData['scenes'],
  incoming: ScenarioData['scenes'],
  mode: StoryImportMode
): ScenarioData['scenes'] => {
  if (!incoming || incoming.length === 0) return existing;
  if (mode === 'rewrite') return clone(incoming);

  const merged = [...(existing || [])];
  incoming.forEach((scene) => {
    if (!hasText(scene.url) && !hasText(scene.title)) return;
    const idx = merged.findIndex(
      (item) =>
        (hasText(scene.url) && normalize(item.url) === normalize(scene.url)) ||
        (hasText(scene.title) && normalize(item.title || '') === normalize(scene.title || ''))
    );
    if (idx === -1) {
      merged.push({
        id: scene.id || uuid(),
        url: clean(scene.url),
        title: clean(scene.title || ''),
        tags: [...(scene.tags || [])],
        isStartingScene: !!scene.isStartingScene,
        createdAt: scene.createdAt || now(),
      });
      return;
    }
    merged[idx] = {
      ...merged[idx],
      title: mergeScalarText(merged[idx].title || '', scene.title || '', mode),
      url: merged[idx].url || clean(scene.url),
      tags: mergeSceneTags(merged[idx].tags || [], scene.tags || []),
      isStartingScene: merged[idx].isStartingScene || scene.isStartingScene,
    };
  });
  return merged;
};

const getContentThemeDirectiveRows = (themes?: ContentThemes): TransferRow[] => {
  if (!themes) return [];

  const selectedTags: string[] = [
    ...(themes.storyType ? [themes.storyType] : []),
    ...(themes.characterTypes || []),
    ...(themes.genres || []),
    ...(themes.origin || []),
    ...(themes.triggerWarnings || []),
    ...(themes.customTags || []),
  ];

  return selectedTags
    .map((tag) => {
      const entry = getTagInjection(tag);
      if (entry) {
        return { label: entry.tag, value: entry.injection };
      }
      return {
        label: tag,
        value: 'Treat this as a welcomed story element when it fits naturally in the scene.',
      };
    })
    .filter((row) => hasText(row.label) || hasText(row.value));
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
      structuredLocations: (data.world.core.structuredLocations || []).map((entry) => ({
        label: entry.label || '',
        value: entry.description || '',
      })),
      storyGoals: (data.world.core.storyGoals || []).map((goal) => ({
        title: goal.title || '',
        desiredOutcome: goal.desiredOutcome || '',
        currentStatus: goal.currentStatus || '',
        flexibility: goal.flexibility || 'normal',
        steps: (goal.steps || []).map((step) => ({
          description: step.description || '',
          completed: !!step.completed,
        })),
      })),
      dialogFormatting: data.world.core.dialogFormatting || '',
      codexEntries: (data.world.entries || []).map((entry) => ({
        title: entry.title || '',
        body: entry.body || '',
      })),
      customSections: (data.world.core.customWorldSections || []).map((section) => ({
        title: section.title || 'Custom Content',
        type: section.type || 'structured',
        items: (section.items || []).map((item) => ({ label: item.label || '', value: item.value || '' })),
        freeformValue: section.freeformValue || '',
      })),
    },
    contentThemes: cloneContentThemes(data.contentThemes),
    builderAssets: {
      selectedArtStyle: data.selectedArtStyle || '',
      scenes: (data.scenes || []).map((scene) => ({
        title: scene.title || '',
        url: scene.url || '',
        tags: [...(scene.tags || [])],
        isStartingScene: !!scene.isStartingScene,
      })),
    },
    uiSettings: data.uiSettings ? clone(data.uiSettings) : undefined,
    openingDialog: {
      enabled: data.story.openingDialog.enabled,
      text: data.story.openingDialog.text || '',
      startingDay: data.story.openingDialog.startingDay,
      startingTimeOfDay: data.story.openingDialog.startingTimeOfDay,
      timeProgressionMode: data.story.openingDialog.timeProgressionMode,
      timeProgressionInterval: data.story.openingDialog.timeProgressionInterval,
    },
  },
  characters: (data.characters || []).map((character) => ({
    name: character.name || '',
    nicknames: character.nicknames || '',
    age: character.age || '',
    sexType: character.sexType || '',
    sexualOrientation: character.sexualOrientation || '',
    location: character.location || '',
    scenePosition: character.scenePosition || '',
    currentMood: character.currentMood || '',
    controlledBy: character.controlledBy,
    characterRole: character.characterRole,
    roleDescription: character.roleDescription || '',
    tags: character.tags || '',
    avatarDataUrl: character.avatarDataUrl || '',
    avatarPosition: character.avatarPosition ? { ...character.avatarPosition } : undefined,
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
      currentStatus: goal.currentStatus || '',
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
  pushField(lines, 'Dialog Formatting', payload.storyBuilder.worldCore.dialogFormatting, 1);
  if ((payload.storyBuilder.worldCore.structuredLocations || []).length > 0) {
    pushHeading(lines, 'Structured Locations', 1);
    (payload.storyBuilder.worldCore.structuredLocations || []).forEach((row) => pushRowField(lines, row.label || 'Location', row.value, 2, 'Location'));
  }
  if ((payload.storyBuilder.worldCore.storyGoals || []).length > 0) {
    pushHeading(lines, 'Story Goals', 1);
    (payload.storyBuilder.worldCore.storyGoals || []).forEach((goal) => {
      pushField(lines, 'Goal', goal.title, 2);
      pushField(lines, 'Desired Outcome', goal.desiredOutcome || '', 2);
      pushField(lines, 'Current Status', goal.currentStatus || '', 2);
      if (goal.flexibility) lines.push(`    - Flexibility: ${goal.flexibility}`);
      goal.steps.forEach((step) => lines.push(`    - Step: [${step.completed ? 'x' : ' '}] ${step.description}`));
    });
  }
  if ((payload.storyBuilder.worldCore.codexEntries || []).length > 0) {
    pushHeading(lines, 'World Codex', 1);
    (payload.storyBuilder.worldCore.codexEntries || []).forEach((entry) => {
      pushField(lines, 'Entry', entry.title, 2);
      pushField(lines, 'Details', entry.body, 2);
    });
  }
  (payload.storyBuilder.worldCore.customSections || []).forEach((section) => {
    pushHeading(lines, safeTitle(section.title, 'Custom Content'), 1);
    if (section.type === 'freeform') {
      if (hasText(section.freeformValue)) pushField(lines, 'Content', section.freeformValue, 2);
      return;
    }
    section.items.forEach((item) => pushRowField(lines, item.label || 'Field', item.value, 2));
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
  if (payload.storyBuilder.openingDialog.timeProgressionMode) {
    lines.push(`  - Time Progression Mode: ${payload.storyBuilder.openingDialog.timeProgressionMode}`);
  }
  if (typeof payload.storyBuilder.openingDialog.timeProgressionInterval === 'number') {
    lines.push(`  - Time Progression Interval: ${payload.storyBuilder.openingDialog.timeProgressionInterval}`);
  }
  if (payload.storyBuilder.builderAssets?.selectedArtStyle || hasText(payload.storyBuilder.builderAssets?.coverImage)) {
    lines.push('');
    pushHeading(lines, 'Builder Assets', 0);
    pushField(lines, 'Selected Art Style', payload.storyBuilder.builderAssets?.selectedArtStyle, 1);
    pushField(lines, 'Cover Image', payload.storyBuilder.builderAssets?.coverImage, 1);
    pushField(lines, 'Cover Image Position', stringifyPosition(payload.storyBuilder.builderAssets?.coverImagePosition), 1);
  }
  if ((payload.storyBuilder.builderAssets?.scenes || []).length > 0) {
    pushHeading(lines, 'Scene Gallery', 0);
    (payload.storyBuilder.builderAssets?.scenes || []).forEach((scene) => {
      pushField(lines, 'Scene Title', scene.title || '', 1);
      pushField(lines, 'Scene URL', scene.url || '', 1);
      pushField(lines, 'Scene Tags', (scene.tags || []).join(', '), 1);
      if (scene.isStartingScene) lines.push('  - Starting Scene: true');
    });
  }
  if (payload.storyBuilder.contentThemes) {
    const themes = payload.storyBuilder.contentThemes;
    lines.push('');
    pushHeading(lines, 'Content Themes', 0);
    pushField(lines, 'Story Type', themes.storyType || '', 1);
    pushField(lines, 'Character Types', (themes.characterTypes || []).join(', '), 1);
    pushField(lines, 'Genres', (themes.genres || []).join(', '), 1);
    pushField(lines, 'Origin', (themes.origin || []).join(', '), 1);
    pushField(lines, 'Trigger Warnings', (themes.triggerWarnings || []).join(', '), 1);
    pushField(lines, 'Custom Tags', (themes.customTags || []).join(', '), 1);

    const directiveRows = getContentThemeDirectiveRows(themes);
    if (directiveRows.length > 0) {
      pushHeading(lines, 'Injected Tag Guidance', 1);
      directiveRows.forEach((row) => pushRowField(lines, row.label, row.value, 2));
    }
  }
  if (payload.storyBuilder.uiSettings) {
    lines.push('');
    pushHeading(lines, 'UI Settings', 0);
    Object.entries(payload.storyBuilder.uiSettings).forEach(([key, value]) => {
      if (typeof value === 'undefined') return;
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase());
      if (typeof value === 'boolean') {
        lines.push(`  - ${label}: ${value ? 'true' : 'false'}`);
      } else {
        pushField(lines, label, String(value), 1);
      }
    });
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
    pushField(lines, 'Scene Position', character.scenePosition, 1);
    pushField(lines, 'Current Mood', character.currentMood, 1);
    if (character.controlledBy) lines.push(`  - Controlled By: ${character.controlledBy}`);
    if (character.characterRole) lines.push(`  - Character Role: ${character.characterRole}`);
    pushField(lines, 'Role Description', character.roleDescription, 1);
    pushField(lines, 'Tags', character.tags, 1);
    pushField(lines, 'Avatar Image', character.avatarDataUrl, 1);
    pushField(lines, 'Avatar Position', stringifyPosition(character.avatarPosition), 1);

    const writeSection = (title: string, rows: TransferRow[], preserveLabelOnly = false) => {
      pushHeading(lines, title, 0);
      rows.forEach((row) => {
        if (preserveLabelOnly) pushRowField(lines, row.label || 'Field', row.value, 1);
        else pushField(lines, row.label || 'Field', row.value, 1);
      });
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
    ]);
    (character.physicalAppearanceExtras || []).forEach((row) => pushRowField(lines, row.label || 'Field', row.value, 1));
    writeSection('Currently Wearing', [
      { label: 'Top', value: character.currentlyWearing?.top || '' },
      { label: 'Bottom', value: character.currentlyWearing?.bottom || '' },
      { label: 'Undergarments', value: character.currentlyWearing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.currentlyWearing?.miscellaneous || '' },
    ]);
    (character.currentlyWearingExtras || []).forEach((row) => pushRowField(lines, row.label || 'Field', row.value, 1));
    writeSection('Preferred Clothing', [
      { label: 'Casual', value: character.preferredClothing?.casual || '' },
      { label: 'Work', value: character.preferredClothing?.work || '' },
      { label: 'Sleep', value: character.preferredClothing?.sleep || '' },
      { label: 'Undergarments', value: character.preferredClothing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.preferredClothing?.miscellaneous || '' },
    ]);
    (character.preferredClothingExtras || []).forEach((row) => pushRowField(lines, row.label || 'Field', row.value, 1));

    pushHeading(lines, 'Personality', 0);
    if (character.personality) {
      lines.push(`  - Split Mode: ${character.personality.splitMode ? 'true' : 'false'}`);
      character.personality.traits.forEach((row) => pushRowField(lines, row.label || 'Trait', row.value, 1, 'Trait'));
      character.personality.outwardTraits.forEach((row) => pushRowField(lines, `Outward ${row.label || 'Trait'}`, row.value, 1, 'Outward Trait'));
      character.personality.inwardTraits.forEach((row) => pushRowField(lines, `Inward ${row.label || 'Trait'}`, row.value, 1, 'Inward Trait'));
    }

    writeSection('Tone', character.toneRows || [], true);
    writeSection('Background', [
      { label: 'Job Occupation', value: character.background?.jobOccupation || '' },
      { label: 'Education Level', value: character.background?.educationLevel || '' },
      { label: 'Residence', value: character.background?.residence || '' },
      { label: 'Hobbies', value: character.background?.hobbies || '' },
      { label: 'Financial Status', value: character.background?.financialStatus || '' },
      { label: 'Motivation', value: character.background?.motivation || '' },
    ]);
    (character.backgroundExtras || []).forEach((row) => pushRowField(lines, row.label || 'Field', row.value, 1));
    writeSection('Key Life Events', character.keyLifeEventRows || [], true);
    writeSection('Relationships', character.relationshipRows || [], true);
    writeSection('Secrets', character.secretRows || [], true);
    writeSection('Fears', character.fearRows || [], true);

    pushHeading(lines, 'Character Goals', 0);
    (character.goals || []).forEach((goal) => {
      pushField(lines, 'Goal', goal.title, 1);
      pushField(lines, 'Desired Outcome', goal.desiredOutcome || '', 1);
      pushField(lines, 'Current Status', goal.currentStatus || '', 1);
      if (goal.flexibility) lines.push(`  - Flexibility: ${goal.flexibility}`);
      goal.steps.forEach((step) => lines.push(`  - Step: [${step.completed ? 'x' : ' '}] ${step.description}`));
    });

    (character.customSections || []).forEach((section) => {
      pushHeading(lines, safeTitle(section.title, 'Custom Content'), 0);
      if (section.type === 'freeform') {
        pushField(lines, 'Content', section.freeformValue || '', 1);
      } else {
        section.items.forEach((row) => pushRowField(lines, row.label || 'Field', row.value, 1));
      }
    });
  });

  return lines.join('\n');
};

export const exportScenarioToText = (
  data: ScenarioData,
  options?: StoryTransferExportOptions
): string => {
  const packagePayload = buildTransferPackage(data, options);
  const payload = toTransferPayload(packagePayload.scenario);
  payload.storyBuilder.builderAssets = {
    ...(payload.storyBuilder.builderAssets || {}),
    coverImage: packagePayload.editorState?.coverImage,
    coverImagePosition: packagePayload.editorState?.coverImagePosition,
  };
  const humanReadable = buildHumanReadable(payload);
  return appendMachinePayloadToText(humanReadable, packagePayload);
};

export const exportScenarioToJson = (
  data: ScenarioData,
  options?: StoryTransferExportOptions
): string => {
  return `${JSON.stringify(buildTransferPackage(data, options), null, 2)}\n`;
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

const pushRtfRowField = (lines: string[], label: string, value?: string, indent = 1080, fallbackLabel = 'Field') => {
  const resolvedLabel = clean(label) || fallbackLabel;
  const resolvedValue = clean(value);
  if (!hasText(resolvedLabel) && !hasText(resolvedValue)) return;
  if (!hasText(resolvedValue)) {
    lines.push(rtfBullet(`${resolvedLabel}:`, indent));
    return;
  }
  lines.push(rtfBullet(`${resolvedLabel}: ${resolvedValue}`, indent));
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
  pushRtfField(lines, 'Dialog Formatting', payload.storyBuilder.worldCore.dialogFormatting);
  if ((payload.storyBuilder.worldCore.structuredLocations || []).length > 0) {
    lines.push(rtfHeading('Structured Locations', 2));
    (payload.storyBuilder.worldCore.structuredLocations || []).forEach((row) => pushRtfRowField(lines, row.label || 'Location', row.value, 1080, 'Location'));
  }
  if ((payload.storyBuilder.worldCore.storyGoals || []).length > 0) {
    lines.push(rtfHeading('Story Goals', 2));
    (payload.storyBuilder.worldCore.storyGoals || []).forEach((goal) => {
      pushRtfField(lines, 'Goal', goal.title);
      pushRtfField(lines, 'Desired Outcome', goal.desiredOutcome || '');
      pushRtfField(lines, 'Current Status', goal.currentStatus || '');
      if (goal.flexibility) lines.push(rtfBullet(`Flexibility: ${goal.flexibility}`, 1080));
      goal.steps.forEach((step) => lines.push(rtfBullet(`Step: [${step.completed ? 'x' : ' '}] ${step.description}`, 1080)));
    });
  }
  if ((payload.storyBuilder.worldCore.codexEntries || []).length > 0) {
    lines.push(rtfHeading('World Codex', 2));
    (payload.storyBuilder.worldCore.codexEntries || []).forEach((entry) => {
      pushRtfField(lines, 'Entry', entry.title);
      pushRtfField(lines, 'Details', entry.body);
    });
  }
  (payload.storyBuilder.worldCore.customSections || []).forEach((section) => {
    lines.push(rtfHeading(safeTitle(section.title, 'Custom Content'), 2));
    if (section.type === 'freeform') {
      pushRtfField(lines, 'Content', section.freeformValue || '');
    } else {
      section.items.forEach((item) => pushRtfRowField(lines, item.label || 'Field', item.value));
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
  if (payload.storyBuilder.openingDialog.timeProgressionMode) {
    lines.push(rtfBullet(`Time Progression Mode: ${payload.storyBuilder.openingDialog.timeProgressionMode}`, 1080));
  }
  if (typeof payload.storyBuilder.openingDialog.timeProgressionInterval === 'number') {
    lines.push(rtfBullet(`Time Progression Interval: ${payload.storyBuilder.openingDialog.timeProgressionInterval}`, 1080));
  }
  if (payload.storyBuilder.builderAssets?.selectedArtStyle || hasText(payload.storyBuilder.builderAssets?.coverImage)) {
    lines.push(rtfHeading('Builder Assets', 2));
    pushRtfField(lines, 'Selected Art Style', payload.storyBuilder.builderAssets?.selectedArtStyle);
    pushRtfField(lines, 'Cover Image', payload.storyBuilder.builderAssets?.coverImage);
    pushRtfField(lines, 'Cover Image Position', stringifyPosition(payload.storyBuilder.builderAssets?.coverImagePosition));
  }
  if ((payload.storyBuilder.builderAssets?.scenes || []).length > 0) {
    lines.push(rtfHeading('Scene Gallery', 2));
    (payload.storyBuilder.builderAssets?.scenes || []).forEach((scene) => {
      pushRtfField(lines, 'Scene Title', scene.title || '');
      pushRtfField(lines, 'Scene URL', scene.url || '');
      pushRtfField(lines, 'Scene Tags', (scene.tags || []).join(', '));
      if (scene.isStartingScene) lines.push(rtfBullet('Starting Scene: true', 1080));
    });
  }
  if (payload.storyBuilder.contentThemes) {
    const themes = payload.storyBuilder.contentThemes;
    lines.push(rtfHeading('Content Themes', 2));
    pushRtfField(lines, 'Story Type', themes.storyType || '');
    pushRtfField(lines, 'Character Types', (themes.characterTypes || []).join(', '));
    pushRtfField(lines, 'Genres', (themes.genres || []).join(', '));
    pushRtfField(lines, 'Origin', (themes.origin || []).join(', '));
    pushRtfField(lines, 'Trigger Warnings', (themes.triggerWarnings || []).join(', '));
    pushRtfField(lines, 'Custom Tags', (themes.customTags || []).join(', '));

    const directiveRows = getContentThemeDirectiveRows(themes);
    if (directiveRows.length > 0) {
      lines.push(rtfHeading('Injected Tag Guidance', 2));
      directiveRows.forEach((row) => pushRtfRowField(lines, row.label, row.value));
    }
  }
  if (payload.storyBuilder.uiSettings) {
    lines.push(rtfHeading('UI Settings', 2));
    Object.entries(payload.storyBuilder.uiSettings).forEach(([key, value]) => {
      if (typeof value === 'undefined') return;
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase());
      if (typeof value === 'boolean') {
        lines.push(rtfBullet(`${label}: ${value ? 'true' : 'false'}`, 1080));
      } else {
        pushRtfField(lines, label, String(value));
      }
    });
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
    pushRtfField(lines, 'Scene Position', character.scenePosition);
    pushRtfField(lines, 'Current Mood', character.currentMood);
    if (character.controlledBy) lines.push(rtfBullet(`Controlled By: ${character.controlledBy}`, 1080));
    if (character.characterRole) lines.push(rtfBullet(`Character Role: ${character.characterRole}`, 1080));
    pushRtfField(lines, 'Role Description', character.roleDescription);
    pushRtfField(lines, 'Tags', character.tags);
    pushRtfField(lines, 'Avatar Image', character.avatarDataUrl);
    pushRtfField(lines, 'Avatar Position', stringifyPosition(character.avatarPosition));

    const writeSection = (title: string, rows: TransferRow[], preserveLabelOnly = false) => {
      lines.push(rtfHeading(title, 2));
      rows.forEach((row) => {
        if (preserveLabelOnly) pushRtfRowField(lines, row.label || 'Field', row.value);
        else pushRtfField(lines, row.label || 'Field', row.value);
      });
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
    ]);
    (character.physicalAppearanceExtras || []).forEach((row) => pushRtfRowField(lines, row.label || 'Field', row.value));
    writeSection('Currently Wearing', [
      { label: 'Top', value: character.currentlyWearing?.top || '' },
      { label: 'Bottom', value: character.currentlyWearing?.bottom || '' },
      { label: 'Undergarments', value: character.currentlyWearing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.currentlyWearing?.miscellaneous || '' },
    ]);
    (character.currentlyWearingExtras || []).forEach((row) => pushRtfRowField(lines, row.label || 'Field', row.value));
    writeSection('Preferred Clothing', [
      { label: 'Casual', value: character.preferredClothing?.casual || '' },
      { label: 'Work', value: character.preferredClothing?.work || '' },
      { label: 'Sleep', value: character.preferredClothing?.sleep || '' },
      { label: 'Undergarments', value: character.preferredClothing?.undergarments || '' },
      { label: 'Miscellaneous', value: character.preferredClothing?.miscellaneous || '' },
    ]);
    (character.preferredClothingExtras || []).forEach((row) => pushRtfRowField(lines, row.label || 'Field', row.value));
    lines.push(rtfHeading('Personality', 2));
    if (character.personality) {
      lines.push(rtfBullet(`Split Mode: ${character.personality.splitMode ? 'true' : 'false'}`, 1080));
      character.personality.traits.forEach((row) => pushRtfRowField(lines, row.label || 'Trait', row.value, 1080, 'Trait'));
      character.personality.outwardTraits.forEach((row) => pushRtfRowField(lines, `Outward ${row.label || 'Trait'}`, row.value, 1080, 'Outward Trait'));
      character.personality.inwardTraits.forEach((row) => pushRtfRowField(lines, `Inward ${row.label || 'Trait'}`, row.value, 1080, 'Inward Trait'));
    }

    writeSection('Tone', character.toneRows || [], true);
    writeSection('Background', [
      { label: 'Job Occupation', value: character.background?.jobOccupation || '' },
      { label: 'Education Level', value: character.background?.educationLevel || '' },
      { label: 'Residence', value: character.background?.residence || '' },
      { label: 'Hobbies', value: character.background?.hobbies || '' },
      { label: 'Financial Status', value: character.background?.financialStatus || '' },
      { label: 'Motivation', value: character.background?.motivation || '' },
    ]);
    (character.backgroundExtras || []).forEach((row) => pushRtfRowField(lines, row.label || 'Field', row.value));
    writeSection('Key Life Events', character.keyLifeEventRows || [], true);
    writeSection('Relationships', character.relationshipRows || [], true);
    writeSection('Secrets', character.secretRows || [], true);
    writeSection('Fears', character.fearRows || [], true);
    lines.push(rtfHeading('Character Goals', 2));
    (character.goals || []).forEach((goal) => {
      pushRtfField(lines, 'Goal', goal.title);
      pushRtfField(lines, 'Desired Outcome', goal.desiredOutcome || '');
      pushRtfField(lines, 'Current Status', goal.currentStatus || '');
      if (goal.flexibility) lines.push(rtfBullet(`Flexibility: ${goal.flexibility}`, 1080));
      goal.steps.forEach((step) => lines.push(rtfBullet(`Step: [${step.completed ? 'x' : ' '}] ${step.description}`, 1080)));
    });

    (character.customSections || []).forEach((section) => {
      lines.push(rtfHeading(safeTitle(section.title, 'Custom Content'), 2));
      if (section.type === 'freeform') {
        pushRtfField(lines, 'Content', section.freeformValue || '');
      } else {
        section.items.forEach((row) => pushRtfRowField(lines, row.label || 'Field', row.value));
      }
    });
  });

  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\viewkind4\\uc1 ${lines.join('')}}`;
};

export const exportScenarioToWordDocument = (
  data: ScenarioData,
  options?: StoryTransferExportOptions
): string => {
  const packagePayload = buildTransferPackage(data, options);
  const payload = toTransferPayload(packagePayload.scenario);
  payload.storyBuilder.builderAssets = {
    ...(payload.storyBuilder.builderAssets || {}),
    coverImage: packagePayload.editorState?.coverImage,
    coverImagePosition: packagePayload.editorState?.coverImagePosition,
  };
  return appendMachinePayloadToRtf(buildWordRtf(payload), packagePayload);
};

const getHeadingText = (line: string): string | null => {
  const markdownMatch = line.match(/^\s*#{1,6}\s+(.+)$/);
  if (markdownMatch) return markdownMatch[1].trim();
  const bracketMatch = line.match(/^\s*\[(.+)\]$/);
  if (bracketMatch) return bracketMatch[1].trim();
  const bulletMatch = line.match(/^\s*[-*•●▪◦]+\s+(.+)$/);
  if (bulletMatch) {
    const candidate = bulletMatch[1].trim();
    if (!candidate) return null;
    if (!candidate.includes(':')) return candidate;
    if (/^character\s*[:-]/i.test(candidate)) return candidate;
  }
  const colonHeadingMatch = line.match(/^(?!\s*[-*•●▪◦]\s)\s*([^:]{2,140})\s*:\s*$/);
  if (colonHeadingMatch) return colonHeadingMatch[1].trim();
  return null;
};

const looksLikeTransferPackage = (value: unknown): value is StoryTransferPackageV2 => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as StoryTransferPackageV2;
  return (
    candidate.packageType === 'chronicle-story-transfer' &&
    candidate.packageVersion === 2 &&
    !!candidate.scenario &&
    typeof candidate.scenario === 'object'
  );
};

const extractMachinePayload = (
  text: string
): { packagePayload?: StoryTransferPackageV2; legacyPayload?: TransferPayloadV1 } | null => {
  const start = text.indexOf(MACHINE_START);
  const end = text.indexOf(MACHINE_END);
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonBlock = text.slice(start + MACHINE_START.length, end).trim();
  try {
    const parsed = JSON.parse(jsonBlock);
    if (looksLikeTransferPackage(parsed)) {
      return { packagePayload: parsed };
    }
    if (looksLikeTransferPayload(parsed)) {
      return { legacyPayload: parsed };
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
      worldCore: { customSections: [], structuredLocations: [], storyGoals: [] },
      openingDialog: {},
    },
    characters: [],
  };

  let skippedLines = 0;
  let mode: 'story' | 'characters' = 'story';
  let storySection: 'storyCard' | 'worldCore' | 'worldLocations' | 'storyGoals' | 'openingDialog' | 'worldCustom' = 'worldCore';
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
          currentGoal = null;
          continue;
        }
        if (normalized === 'structuredlocations' || normalized === 'locations' || normalized === 'primarylocations') {
          storySection = 'worldLocations';
          currentWorldCustom = null;
          currentGoal = null;
          continue;
        }
        if (normalized === 'storygoals') {
          storySection = 'storyGoals';
          currentWorldCustom = null;
          currentGoal = null;
          continue;
        }
        if (normalized === 'openingdialog') {
          storySection = 'openingDialog';
          currentWorldCustom = null;
          currentGoal = null;
          continue;
        }
        if (normalized === 'scenario') {
          storySection = 'worldCore';
          currentWorldCustom = null;
          currentGoal = null;
          continue;
        }
        if (normalized === 'aiinstructions') {
          storySection = 'worldCustom';
          currentWorldCustom = getWorldCustom('AI Instructions');
          currentGoal = null;
          continue;
        }
        storySection = 'worldCustom';
        currentWorldCustom = getWorldCustom(headingValue);
        currentGoal = null;
        continue;
      }

      const isStandaloneCharacterSectionHeading = /^(basics|background|appearance|physical appearance|personality|tone|currently wearing|preferred clothing|clothing preference|fears|relationships|secrets|key life events|character goals|goals|goals and desires|kinks|fantasies)$/i.test(headingValue);

      const namedCharacterSection =
        isStandaloneCharacterSectionHeading
          ? null
          : parseNamedCharacterSectionHeading(headingValue);
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

      const characterHeading = isStandaloneCharacterSectionHeading
        ? null
        : headingValue.match(/^character\s*[:-]\s*(.+)$/i) || headingValue.match(/^character\s+(.+)$/i);
      if (characterHeading) {
        flushCharacter();
        mode = 'characters';
        currentCharacter = createEmptyTransferCharacter(characterHeading[1]);
        currentCharacterSection = 'basics';
        currentCharacterCustom = null;
        currentGoal = null;
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
      } else if (mode === 'story' && storySection === 'storyGoals') {
        skippedLines += 1;
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
        } else if (normalizedKey === 'timeprogressionmode') {
          const parsed = normalize(value);
          if (parsed === 'manual' || parsed === 'automatic') {
            payload.storyBuilder.openingDialog.timeProgressionMode = parsed;
          }
        } else if (normalizedKey === 'timeprogressioninterval') {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) payload.storyBuilder.openingDialog.timeProgressionInterval = parsed;
        } else {
          currentWorldCustom = getWorldCustom('Imported Opening Dialog');
          upsertTransferRow(currentWorldCustom.items, key, value);
        }
        continue;
      }

      if (storySection === 'worldLocations') {
        const rows = payload.storyBuilder.worldCore.structuredLocations || [];
        upsertTransferRow(rows, key, value);
        payload.storyBuilder.worldCore.structuredLocations = rows;
        continue;
      }

      if (storySection === 'storyGoals') {
        if (!payload.storyBuilder.worldCore.storyGoals) payload.storyBuilder.worldCore.storyGoals = [];
        if (normalizedKey === 'goal') {
          currentGoal = {
            title: clean(value) || 'Imported Story Goal',
            desiredOutcome: '',
            currentStatus: '',
            flexibility: 'normal',
            steps: [],
          };
          payload.storyBuilder.worldCore.storyGoals.push(currentGoal);
        } else if (normalizedKey === 'desiredoutcome') {
          if (!currentGoal) {
            currentGoal = { title: 'Imported Story Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
            payload.storyBuilder.worldCore.storyGoals.push(currentGoal);
          }
          currentGoal.desiredOutcome = value;
        } else if (normalizedKey === 'currentstatus') {
          if (!currentGoal) {
            currentGoal = { title: 'Imported Story Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
            payload.storyBuilder.worldCore.storyGoals.push(currentGoal);
          }
          currentGoal.currentStatus = value;
        } else if (normalizedKey === 'flexibility') {
          const flex = normalize(value);
          if (!currentGoal) {
            currentGoal = { title: 'Imported Story Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
            payload.storyBuilder.worldCore.storyGoals.push(currentGoal);
          }
          if (flex === 'rigid' || flex === 'normal' || flex === 'flexible') currentGoal.flexibility = flex;
        } else if (normalizedKey === 'step') {
          const stepMatch = value.match(/^\[(x| )\]\s*(.+)$/i);
          if (!currentGoal) {
            currentGoal = { title: 'Imported Story Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
            payload.storyBuilder.worldCore.storyGoals.push(currentGoal);
          }
          currentGoal.steps.push({
            description: clean(stepMatch ? stepMatch[2] : value),
            completed: !!stepMatch && stepMatch[1].toLowerCase() === 'x',
          });
        } else {
          currentWorldCustom = getWorldCustom('Imported Story Goals');
          upsertTransferRow(currentWorldCustom.items, key, value);
        }
        continue;
      }

      if (storySection === 'worldCore') {
        if (normalizedKey === 'storypremise' || normalizedKey === 'scenario') payload.storyBuilder.worldCore.storyPremise = value;
        else if (normalizedKey === 'locations' || normalizedKey === 'primarylocations' || normalizedKey === 'location') {
          const parsed = value
            .split(/\r?\n|;/)
            .map((row) => row.trim())
            .filter(Boolean)
            .map((row, idx) => {
              const pairMatch = row.match(/^([^:|-]+?)\s*[:|-]\s*(.+)$/);
              if (pairMatch) return { label: clean(pairMatch[1]), value: clean(pairMatch[2]) };
              return { label: `Location ${idx + 1}`, value: row };
            });
          payload.storyBuilder.worldCore.structuredLocations = mergeRows(
            payload.storyBuilder.worldCore.structuredLocations || [],
            parsed,
            mode === 'story' ? 'merge' : 'merge'
          );
        }
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
          currentGoal = { title: 'Imported Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
          character.goals.push(currentGoal);
        }
        currentGoal.desiredOutcome = value;
      } else if (normalizedKey === 'currentstatus') {
        if (!currentGoal) {
          currentGoal = { title: 'Imported Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
          character.goals.push(currentGoal);
        }
        currentGoal.currentStatus = value;
      } else if (normalizedKey === 'flexibility') {
        const flex = normalize(value);
        if (!currentGoal) {
          currentGoal = { title: 'Imported Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
          character.goals.push(currentGoal);
        }
        if (flex === 'rigid' || flex === 'normal' || flex === 'flexible') {
          currentGoal.flexibility = flex;
        }
      } else if (normalizedKey === 'step') {
        const stepMatch = value.match(/^\[(x| )\]\s*(.+)$/i);
        if (!currentGoal) {
          currentGoal = { title: 'Imported Goal', desiredOutcome: '', currentStatus: '', flexibility: 'normal', steps: [] };
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
    if (!hasText(goal.title) && !hasText(goal.desiredOutcome) && !hasText(goal.currentStatus) && (goal.steps || []).length === 0) return;
    const title = clean(goal.title) || 'Imported Goal';
    const idx = base.findIndex((item) => normalize(item.title) === normalize(title));
    if (idx === -1) {
      base.push({
        id: uid('goal'),
        title,
        desiredOutcome: clean(goal.desiredOutcome || ''),
        currentStatus: clean(goal.currentStatus || ''),
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
      currentStatus: mergeText(current.currentStatus || '', goal.currentStatus, mode),
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

const applyStoryGoals = (
  existingGoals: ScenarioData['world']['core']['storyGoals'],
  incomingGoals: TransferGoal[] | undefined,
  mode: StoryImportMode
): ScenarioData['world']['core']['storyGoals'] => {
  if (!incomingGoals || incomingGoals.length === 0) return existingGoals;
  const base = [...(existingGoals || [])];
  incomingGoals.forEach((goal) => {
    if (!hasText(goal.title) && !hasText(goal.desiredOutcome) && !hasText(goal.currentStatus) && (goal.steps || []).length === 0) return;
    const title = clean(goal.title) || 'Imported Story Goal';
    const idx = base.findIndex((item) => normalize(item.title) === normalize(title));
    if (idx === -1) {
      base.push({
        id: uid('sgoal'),
        title,
        desiredOutcome: clean(goal.desiredOutcome || ''),
        currentStatus: clean(goal.currentStatus || ''),
        flexibility: goal.flexibility || 'normal',
        steps: (goal.steps || []).map((step) => ({
          id: uid('sgoal_step'),
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
      currentStatus: mergeText(current.currentStatus || '', goal.currentStatus, mode),
      flexibility: goal.flexibility || current.flexibility,
      steps: stepRows.map((step, stepIdx) => ({
        id: current.steps?.[stepIdx]?.id || uid('sgoal_step'),
        description: clean(step.label),
        completed: normalize(step.value) === 'x',
      })),
      updatedAt: now(),
    };
  });
  return base.length > 0 ? base : undefined;
};

const mergeStructuredLocations = (
  existing: ScenarioData['world']['core']['structuredLocations'],
  incoming: TransferRow[] | undefined,
  mode: StoryImportMode
): ScenarioData['world']['core']['structuredLocations'] => {
  if (!incoming || incoming.length === 0) return existing;
  const base = [...(existing || [])];
  incoming
    .filter((row) => hasText(row.label) || hasText(row.value))
    .forEach((row) => {
      const label = clean(row.label) || 'Location';
      const description = clean(row.value);
      const idx = base.findIndex((entry) => normalize(entry.label) === normalize(label));
      if (idx === -1) {
        base.push({
          id: uid('loc'),
          label,
          description,
        });
        return;
      }
      base[idx] = {
        ...base[idx],
        description: mergeText(base[idx].description || '', description, mode),
      };
    });
  return base.length > 0 ? base : undefined;
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
  next.world.core.dialogFormatting = updateStoryField(next.world.core.dialogFormatting, payload.storyBuilder.worldCore.dialogFormatting, 'narrative');
  next.world.entries = mergeCodexEntries(
    next.world.entries || [],
    (payload.storyBuilder.worldCore.codexEntries || []).map((entry) => ({
      id: uuid(),
      title: clean(entry.title),
      body: clean(entry.body),
      createdAt: now(),
      updatedAt: now(),
    })),
    mode
  );
  next.contentThemes = mergeContentThemes(next.contentThemes, payload.storyBuilder.contentThemes, mode);
  if (payload.storyBuilder.builderAssets?.selectedArtStyle) {
    next.selectedArtStyle = mergeScalarText(next.selectedArtStyle || '', payload.storyBuilder.builderAssets.selectedArtStyle, mode);
  }
  if (payload.storyBuilder.builderAssets?.scenes) {
    next.scenes = mergeScenes(
      next.scenes || [],
      (payload.storyBuilder.builderAssets.scenes || []).map((scene) => ({
        id: uuid(),
        title: clean(scene.title || ''),
        url: clean(scene.url || ''),
        tags: [...(scene.tags || [])],
        isStartingScene: !!scene.isStartingScene,
        createdAt: now(),
      })),
      mode
    );
  }
  if (payload.storyBuilder.uiSettings) {
    next.uiSettings =
      mode === 'rewrite' || !next.uiSettings
        ? clone(payload.storyBuilder.uiSettings)
        : {
            ...clone(payload.storyBuilder.uiSettings),
            ...next.uiSettings,
          };
  }

  const beforeLocations = JSON.stringify(next.world.core.structuredLocations || []);
  next.world.core.structuredLocations = mergeStructuredLocations(
    next.world.core.structuredLocations,
    payload.storyBuilder.worldCore.structuredLocations,
    mode
  );
  if (JSON.stringify(next.world.core.structuredLocations || []) !== beforeLocations) {
    summary.updatedStoryFields += 1;
  }

  next.world.core.customWorldSections = mergeWorldCustomSections(
    next.world.core.customWorldSections,
    payload.storyBuilder.worldCore.customSections || [],
    summary,
    mode
  );

  const beforeStoryGoals = JSON.stringify(next.world.core.storyGoals || []);
  next.world.core.storyGoals = applyStoryGoals(next.world.core.storyGoals, payload.storyBuilder.worldCore.storyGoals, mode);
  if (JSON.stringify(next.world.core.storyGoals || []) !== beforeStoryGoals) {
    summary.updatedStoryFields += 1;
  }

  const opening: OpeningDialog = next.story.openingDialog;
  if (typeof payload.storyBuilder.openingDialog.enabled === 'boolean') opening.enabled = payload.storyBuilder.openingDialog.enabled;
  opening.text = mergeText(opening.text, payload.storyBuilder.openingDialog.text, mode);
  if (typeof payload.storyBuilder.openingDialog.startingDay === 'number') opening.startingDay = payload.storyBuilder.openingDialog.startingDay;
  if (payload.storyBuilder.openingDialog.startingTimeOfDay) opening.startingTimeOfDay = payload.storyBuilder.openingDialog.startingTimeOfDay;
  if (payload.storyBuilder.openingDialog.timeProgressionMode) opening.timeProgressionMode = payload.storyBuilder.openingDialog.timeProgressionMode;
  if (typeof payload.storyBuilder.openingDialog.timeProgressionInterval === 'number') opening.timeProgressionInterval = payload.storyBuilder.openingDialog.timeProgressionInterval;
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
    character.scenePosition = mergeScalarText(character.scenePosition || '', incoming.scenePosition || '', mode);
    character.currentMood = mergeText(character.currentMood, incoming.currentMood, mode);
    character.roleDescription = mergeText(character.roleDescription, incoming.roleDescription, mode);
    character.tags = mergeTagString(character.tags || '', incoming.tags, mode);
    character.avatarDataUrl = mergeScalarText(character.avatarDataUrl || '', incoming.avatarDataUrl || '', mode);
    if (incoming.avatarPosition) {
      character.avatarPosition =
        mode === 'rewrite' || !character.avatarPosition
          ? { ...incoming.avatarPosition }
          : character.avatarPosition;
    }
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

const mergeSideCharacters = (
  existing: ScenarioData['sideCharacters'],
  incoming: ScenarioData['sideCharacters'],
  mode: StoryImportMode
): ScenarioData['sideCharacters'] => {
  if (!incoming || incoming.length === 0) return existing;
  if (mode === 'rewrite') return clone(incoming);

  const merged = [...(existing || [])];
  incoming.forEach((character) => {
    const idx = merged.findIndex(
      (item) =>
        item.id === character.id ||
        (hasText(item.name) && hasText(character.name) && normalize(item.name) === normalize(character.name))
    );
    if (idx === -1) {
      merged.push(clone(character));
    }
  });
  return merged;
};

const mergeConversations = (
  existing: ScenarioData['conversations'],
  incoming: ScenarioData['conversations'],
  mode: StoryImportMode
): ScenarioData['conversations'] => {
  if (!incoming || incoming.length === 0) return existing;
  if (mode === 'rewrite') return clone(incoming);

  const merged = [...(existing || [])];
  incoming.forEach((conversation) => {
    if (merged.some((item) => item.id === conversation.id)) return;
    merged.push(clone(conversation));
  });
  return merged;
};

const buildTransferPackageFromScenario = (scenario: ScenarioData): StoryTransferPackageV2 => {
  const normalizedScenario = buildScenarioForTransfer(scenario, {
    contentThemes: scenario.contentThemes,
  });

  return {
    packageType: 'chronicle-story-transfer',
    packageVersion: 2,
    exportedAt: new Date().toISOString(),
    scenario: normalizedScenario,
    editorState: normalizedScenario.contentThemes
      ? { contentThemes: cloneContentThemes(normalizedScenario.contentThemes) }
      : undefined,
  };
};

const applyTransferPackageToScenario = (
  base: ScenarioData,
  packagePayload: StoryTransferPackageV2,
  warnings: string[],
  mode: StoryImportMode
): StoryTransferResult => {
  const importedScenario = buildScenarioForTransfer(packagePayload.scenario, {
    contentThemes: packagePayload.editorState?.contentThemes ?? packagePayload.scenario.contentThemes,
  });
  const editorState = packagePayload.editorState ? clone(packagePayload.editorState) : undefined;
  const transferWarnings: string[] = [];
  const mergedResult = mergePayloadIntoScenario(base, toTransferPayload(importedScenario), 0, transferWarnings, mode);

  if (mode === 'rewrite') {
    return {
      data: importedScenario,
      editorState,
      summary: mergedResult.summary,
      warnings: [...warnings, ...transferWarnings],
    };
  }

  const next = mergedResult.data;
  if (importedScenario.selectedModel && !hasText(next.selectedModel || '')) {
    next.selectedModel = importedScenario.selectedModel;
  }
  next.sideCharacters = mergeSideCharacters(next.sideCharacters || [], importedScenario.sideCharacters || [], mode);
  next.conversations = mergeConversations(next.conversations || [], importedScenario.conversations || [], mode);
  next.contentThemes = mergeContentThemes(
    next.contentThemes,
    importedScenario.contentThemes || editorState?.contentThemes || defaultContentThemes,
    mode
  );

  return {
    ...mergedResult,
    data: next,
    editorState,
    warnings: [...warnings, ...transferWarnings],
  };
};

export const importScenarioFromText = (
  text: string,
  base: ScenarioData,
  mode: StoryImportMode = 'merge'
): StoryTransferResult => {
  const warnings: string[] = [];
  const machinePayload = extractMachinePayload(text);
  if (machinePayload) {
    if (machinePayload.packagePayload) {
      return applyTransferPackageToScenario(base, machinePayload.packagePayload, warnings, mode);
    }
    if (machinePayload.legacyPayload) {
      return mergePayloadIntoScenario(base, machinePayload.legacyPayload, 0, warnings, mode);
    }
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
      if (looksLikeTransferPackage(parsed)) {
        return applyTransferPackageToScenario(base, parsed, warnings, mode);
      }
      if (looksLikeTransferPayload(parsed)) {
        return mergePayloadIntoScenario(base, parsed, 0, warnings, mode);
      }
      if (looksLikeScenarioData(parsed)) {
        return applyTransferPackageToScenario(base, buildTransferPackageFromScenario(parsed), warnings, mode);
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
