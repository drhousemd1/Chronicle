export type RoleplayFixtureCharacter = Readonly<{
  id: string;
  name: string;
  control: 'user' | 'ai';
  role: 'main' | 'side';
  origin: 'main' | 'prebuilt_side' | 'dynamic_side';
  creationOrder: number;
  location?: string;
  scenePosition?: string;
}>;

export type RoleplayFixtureGoal = Readonly<{
  id: string;
  title: string;
  currentOpenStep: string;
  status: 'open' | 'completed' | 'dropped';
}>;

export type RoleplayFixtureCharacterCard = Readonly<{
  characterId: string;
  source: 'main_character' | 'side_character';
  facts: readonly Readonly<{
    field: string;
    value: string;
    modelFacing: boolean;
  }>[];
}>;

export type RoleplayFixtureGenerationChain = Readonly<{
  kind: 'retry' | 'continue';
  parentUserMessageId: string;
  sourceAssistantMessageId: string;
  sourceGenerationId: string;
  resultAssistantMessageId: string;
  resultGenerationId: string;
}>;

export type RoleplayFixtureMessage = Readonly<{
  id: string;
  role: 'user' | 'assistant';
  text: string;
  generationId?: string;
  accepted: boolean;
  deleted?: boolean;
  superseded?: boolean;
  day: number;
  createdAt: number;
}>;

export type RoleplayFixtureMemory = Readonly<{
  id: string;
  text: string;
  sourceMessageId: string;
  sourceGenerationId?: string;
  durable: boolean;
}>;

export type RoleplayFixtureSnapshot = Readonly<{
  id: string;
  characterId: string;
  sourceMessageId: string;
  sourceGenerationId?: string;
  location?: string;
  scenePosition?: string;
  accepted: boolean;
}>;

export type RoleplayFixtureSupportResult = Readonly<{
  id: string;
  worker: 'memory' | 'character_state' | 'goal_alignment' | 'day_compression';
  sourceMessageId: string;
  sourceGenerationId?: string;
  disposition: 'accepted' | 'rejected' | 'stale' | 'malformed' | 'persistence_failed';
}>;

export type RoleplayFixtureScenario = Readonly<{
  id: string;
  conversationId: string;
  currentDay: number;
  visiblePlayerText: string;
  privatePlayerText: string;
  characters: readonly RoleplayFixtureCharacter[];
  characterCards: readonly RoleplayFixtureCharacterCard[];
  goals: readonly RoleplayFixtureGoal[];
  messages: readonly RoleplayFixtureMessage[];
  generationChains: readonly RoleplayFixtureGenerationChain[];
  memories: readonly RoleplayFixtureMemory[];
  snapshots: readonly RoleplayFixtureSnapshot[];
  supportResults: readonly RoleplayFixtureSupportResult[];
  dayTransitions: readonly Readonly<{ fromDay: number; toDay: number; sourceMemoryIds: readonly string[]; }>[];
}>;

export type CreateRoleplayFixtureScenarioOptions = Readonly<{
  id?: string;
  sideCharacterCount?: number;
  currentDay?: number;
}>;

export function createRoleplayFixtureScenario(
  options: CreateRoleplayFixtureScenarioOptions = {},
): RoleplayFixtureScenario {
  const id = options.id ?? 'roleplay-realistic-fixture';
  const sideCharacterCount = Math.max(2, Math.trunc(options.sideCharacterCount ?? 12));
  const currentDay = Math.max(2, Math.trunc(options.currentDay ?? 2));
  const characters: RoleplayFixtureCharacter[] = [
    {
      id: 'character-player',
      name: 'Player',
      control: 'user',
      role: 'main',
      origin: 'main',
      creationOrder: 0,
      location: 'Shared workspace',
      scenePosition: 'Near the central table',
    },
    {
      id: 'character-companion',
      name: 'Primary Companion',
      control: 'ai',
      role: 'main',
      origin: 'main',
      creationOrder: 1,
      location: 'Shared workspace',
      scenePosition: 'Across from the player',
    },
  ];

  for (let index = 0; index < sideCharacterCount; index += 1) {
    const number = String(index + 1).padStart(2, '0');
    const dynamic = index === sideCharacterCount - 1;
    characters.push({
      id: `side-character-${number}`,
      name: `Side Character ${number}`,
      control: 'ai',
      role: 'side',
      origin: dynamic ? 'dynamic_side' : 'prebuilt_side',
      creationOrder: index + 2,
      location: index % 3 === 0 ? undefined : index % 2 === 0 ? 'Adjacent room' : 'Shared workspace',
      scenePosition: index % 4 === 0 ? undefined : `Position ${number}`,
    });
  }

  const visiblePlayerText = 'I cross the room and say, "Stay close while we review the next step."';
  const privatePlayerText = 'I do not want anyone else to know that I am worried.';
  const characterCards: RoleplayFixtureCharacterCard[] = characters.map((character) => ({
    characterId: character.id,
    source: character.role === 'main' ? 'main_character' : 'side_character',
    facts: [
      { field: 'name', value: character.name, modelFacing: true },
      { field: 'control', value: character.control, modelFacing: true },
      { field: 'role', value: character.role, modelFacing: true },
      { field: 'appearance', value: `${character.name} has a visually distinct presentation.`, modelFacing: true },
      { field: 'personality', value: `${character.name} responds with a consistent interpersonal style.`, modelFacing: true },
      { field: 'speech', value: `${character.name} has an identifiable dialogue pattern.`, modelFacing: true },
      { field: 'background', value: `${character.name} has established history relevant to the scenario.`, modelFacing: true },
      { field: 'relationships', value: `${character.name} has an established relationship to the group.`, modelFacing: true },
      { field: 'boundaries', value: `${character.name} has explicit behavioral boundaries.`, modelFacing: true },
      { field: 'private_notes', value: `${character.name} has private author notes that must remain debug-only.`, modelFacing: false },
    ],
  }));

  return {
    id,
    conversationId: `${id}-conversation`,
    currentDay,
    visiblePlayerText,
    privatePlayerText,
    characters,
    characterCards,
    goals: [
      {
        id: 'goal-current',
        title: 'Review the next step together',
        currentOpenStep: 'Ask the companion to examine the immediate decision',
        status: 'open',
      },
      {
        id: 'goal-shared-words-only',
        title: 'Stay connected through future changes',
        currentOpenStep: 'Discuss a distant relationship concern',
        status: 'open',
      },
      {
        id: 'goal-completed',
        title: 'Introduce the group',
        currentOpenStep: 'Record that introductions are complete',
        status: 'completed',
      },
    ],
    messages: [
      {
        id: 'message-user-previous',
        role: 'user',
        text: 'I ask the group to gather around the table.',
        accepted: true,
        day: currentDay - 1,
        createdAt: 10,
      },
      {
        id: 'message-assistant-old',
        role: 'assistant',
        text: 'The companion gathers the documents and waits for a decision.',
        generationId: 'generation-assistant-old',
        accepted: true,
        day: currentDay - 1,
        createdAt: 11,
      },
      {
        id: 'message-user-latest',
        role: 'user',
        text: `${visiblePlayerText} (${privatePlayerText})`,
        accepted: true,
        day: currentDay,
        createdAt: 20,
      },
      {
        id: 'message-assistant-rejected',
        role: 'assistant',
        text: 'The companion repeats the same reassurance and asks the same closing question.',
        generationId: 'generation-assistant-rejected',
        accepted: false,
        superseded: true,
        day: currentDay,
        createdAt: 21,
      },
      {
        id: 'message-assistant-current',
        role: 'assistant',
        text: 'The companion turns the documents toward the player and identifies a concrete choice.',
        generationId: 'generation-assistant-current',
        accepted: true,
        day: currentDay,
        createdAt: 22,
      },
      {
        id: 'message-assistant-continued',
        role: 'assistant',
        text: 'A second page slips free, and the companion identifies a new consequence of the choice.',
        generationId: 'generation-assistant-continued',
        accepted: true,
        day: currentDay,
        createdAt: 23,
      },
    ],
    generationChains: [
      {
        kind: 'retry',
        parentUserMessageId: 'message-user-latest',
        sourceAssistantMessageId: 'message-assistant-rejected',
        sourceGenerationId: 'generation-assistant-rejected',
        resultAssistantMessageId: 'message-assistant-current',
        resultGenerationId: 'generation-assistant-current',
      },
      {
        kind: 'continue',
        parentUserMessageId: 'message-user-latest',
        sourceAssistantMessageId: 'message-assistant-current',
        sourceGenerationId: 'generation-assistant-current',
        resultAssistantMessageId: 'message-assistant-continued',
        resultGenerationId: 'generation-assistant-continued',
      },
    ],
    memories: [
      {
        id: 'memory-durable',
        text: 'The player and companion agreed to make decisions together.',
        sourceMessageId: 'message-assistant-old',
        sourceGenerationId: 'generation-assistant-old',
        durable: true,
      },
      {
        id: 'memory-transient',
        text: 'A document was briefly placed on the table.',
        sourceMessageId: 'message-assistant-rejected',
        sourceGenerationId: 'generation-assistant-rejected',
        durable: false,
      },
    ],
    snapshots: [
      {
        id: 'snapshot-valid-old',
        characterId: 'character-companion',
        sourceMessageId: 'message-assistant-old',
        sourceGenerationId: 'generation-assistant-old',
        location: 'Shared workspace',
        scenePosition: 'Across from the player',
        accepted: true,
      },
      {
        id: 'snapshot-rejected',
        characterId: 'character-companion',
        sourceMessageId: 'message-assistant-rejected',
        sourceGenerationId: 'generation-assistant-rejected',
        location: 'Incorrect stale location',
        accepted: false,
      },
    ],
    supportResults: [
      {
        id: 'support-memory-accepted',
        worker: 'memory',
        sourceMessageId: 'message-assistant-current',
        sourceGenerationId: 'generation-assistant-current',
        disposition: 'accepted',
      },
      {
        id: 'support-state-stale',
        worker: 'character_state',
        sourceMessageId: 'message-assistant-rejected',
        sourceGenerationId: 'generation-assistant-rejected',
        disposition: 'stale',
      },
      {
        id: 'support-goal-rejected',
        worker: 'goal_alignment',
        sourceMessageId: 'message-assistant-current',
        sourceGenerationId: 'generation-assistant-current',
        disposition: 'rejected',
      },
      {
        id: 'support-compression-failed',
        worker: 'day_compression',
        sourceMessageId: 'message-assistant-old',
        sourceGenerationId: 'generation-assistant-old',
        disposition: 'persistence_failed',
      },
    ],
    dayTransitions: [
      {
        fromDay: currentDay - 1,
        toDay: currentDay,
        sourceMemoryIds: ['memory-durable', 'memory-transient'],
      },
    ],
  };
}
