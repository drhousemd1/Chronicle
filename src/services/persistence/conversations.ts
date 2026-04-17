import type {
  Character,
  CharacterStateMessageSnapshot,
  CharacterSessionState,
  CharacterTone,
  CharacterKeyLifeEvents,
  CharacterRelationships,
  CharacterSecrets,
  CharacterFears,
  Conversation,
  ConversationMetadata,
  Memory,
  MemorySource,
  Message,
  PreferredClothing,
  PhysicalAppearance,
  StoryGoalStepDerivation,
  TimeOfDay,
} from '@/types';
import {
  asCharacterBackground,
  asCharacterPersonality,
  asExtrasSection,
  appCurrentlyWearingToDb,
  appPhysicalAppearanceToDb,
  appPreferredClothingToDb,
  dbCurrentlyWearingToApp,
  dbPhysicalAppearanceToApp,
  dbPreferredClothingToApp,
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
  supabase,
  toTimestamp,
} from './shared';

export function dbToConversation(row: any, messages: any[]): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: messages.map((m) => ({
      id: m.id,
      generationId: m.generation_id || m.id,
      role: m.role,
      text: m.content,
      day: m.day || undefined,
      timeOfDay: m.time_of_day || undefined,
      createdAt: new Date(m.created_at).getTime(),
    })),
    currentDay: row.current_day || 1,
    currentTimeOfDay: row.current_time_of_day || 'day',
    timeProgressionMode: row.time_progression_mode || 'manual',
    timeProgressionInterval: row.time_progression_interval || 15,
    timeRemaining: row.time_remaining ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function fetchConversationThread(conversationId: string): Promise<Conversation | null> {
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (convError) throw convError;
  if (!conv) return null;

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgError) throw msgError;

  console.log('[fetchConversationThread] conversationId:', conversationId, 'messages:', messages?.length);

  return dbToConversation(conv, messages || []);
}

export async function fetchConversationThreadRecent(
  conversationId: string,
  limit = 10,
): Promise<{ conversation: Conversation; hasMore: boolean } | null> {
  const [convResult, msgResult, countResult] = await Promise.all([
    supabase.from('conversations').select('*').eq('id', conversationId).maybeSingle(),
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', conversationId),
  ]);

  if (convResult.error) throw convResult.error;
  if (!convResult.data) return null;

  const messages = (msgResult.data || []).reverse();
  const totalCount = countResult.count || 0;

  console.log('[fetchConversationThreadRecent] conversationId:', conversationId, 'loaded:', messages.length, 'total:', totalCount);

  return {
    conversation: dbToConversation(convResult.data, messages),
    hasMore: totalCount > limit,
  };
}

export async function fetchOlderMessages(
  conversationId: string,
  beforeCreatedAt: string,
  limit = 20,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .lt('created_at', beforeCreatedAt)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).reverse().map((m) => ({
    id: m.id,
    generationId: m.generation_id || m.id,
    role: m.role as any,
    text: m.content,
    day: m.day || undefined,
    timeOfDay: (m.time_of_day as any) || undefined,
    createdAt: new Date(m.created_at!).getTime(),
  }));
}

export async function saveNewMessages(
  conversationId: string,
  messages: Message[],
): Promise<void> {
  if (messages.length === 0) return;
  const { error } = await supabase.from('messages').upsert(
    messages.map((m) => ({
      id: m.id,
      generation_id: m.generationId || m.id,
      conversation_id: conversationId,
      role: m.role,
      content: m.text,
      day: m.day || null,
      time_of_day: m.timeOfDay || null,
      created_at: new Date(m.createdAt).toISOString(),
    })),
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function deleteConversationMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

export async function updateConversationMeta(
  conversationId: string,
  patch: {
    currentDay?: number;
    currentTimeOfDay?: string;
    title?: string;
    timeProgressionMode?: string;
    timeProgressionInterval?: number;
    timeRemaining?: number;
  },
): Promise<void> {
  const updateObj: Record<string, any> = {};
  if (patch.currentDay !== undefined) updateObj.current_day = patch.currentDay;
  if (patch.currentTimeOfDay !== undefined) updateObj.current_time_of_day = patch.currentTimeOfDay;
  if (patch.title !== undefined) updateObj.title = patch.title;
  if (patch.timeProgressionMode !== undefined) updateObj.time_progression_mode = patch.timeProgressionMode;
  if (patch.timeProgressionInterval !== undefined) updateObj.time_progression_interval = patch.timeProgressionInterval;
  if (patch.timeRemaining !== undefined) updateObj.time_remaining = patch.timeRemaining;

  if (Object.keys(updateObj).length === 0) return;

  const { error } = await supabase.from('conversations').update(updateObj).eq('id', conversationId);
  if (error) throw error;
}

export async function fetchConversationRegistry(): Promise<ConversationMetadata[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      scenario_id,
      title,
      created_at,
      updated_at,
      stories!conversations_scenario_id_fkey(title, cover_image_url, user_id)
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((conv) => ({
    conversationId: conv.id,
    scenarioId: conv.scenario_id,
    scenarioTitle: (conv.stories as any)?.title || 'Unknown',
    scenarioImageUrl: (conv.stories as any)?.cover_image_url || null,
    conversationTitle: conv.title,
    lastMessage: '',
    messageCount: 0,
    createdAt: toTimestamp(conv.created_at),
    updatedAt: toTimestamp(conv.updated_at),
    creatorName: null,
  }));
}

export async function enrichConversationRegistry(registry: ConversationMetadata[]): Promise<ConversationMetadata[]> {
  if (registry.length === 0) return registry;

  const enriched = await Promise.all(
    registry.map(async (entry) => {
      try {
        const [countResult, lastMsgResult] = await Promise.all([
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', entry.conversationId),
          supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', entry.conversationId)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        return {
          ...entry,
          messageCount: countResult.count || 0,
          lastMessage: lastMsgResult.data?.[0]?.content || '',
        };
      } catch {
        return entry;
      }
    }),
  );

  return enriched;
}

export async function saveConversation(
  conversation: Conversation,
  scenarioId: string,
  userId: string,
): Promise<void> {
  const { error: convError } = await supabase
    .from('conversations')
    .upsert({
      id: conversation.id,
      user_id: userId,
      scenario_id: scenarioId,
      title: conversation.title,
      current_day: conversation.currentDay || 1,
      current_time_of_day: conversation.currentTimeOfDay || 'day',
      time_progression_mode: conversation.timeProgressionMode || 'manual',
      time_progression_interval: conversation.timeProgressionInterval || 15,
    });

  if (convError) throw convError;

  await supabase.from('messages').delete().eq('conversation_id', conversation.id);

  if (conversation.messages.length > 0) {
    const { error: msgError } = await supabase
      .from('messages')
      .insert(
        conversation.messages.map((m) => ({
          id: m.id,
          generation_id: m.generationId || m.id,
          conversation_id: conversation.id,
          role: m.role,
          content: m.text,
          day: m.day || null,
          time_of_day: m.timeOfDay || null,
          created_at: new Date(m.createdAt).toISOString(),
        })),
      );
    if (msgError) throw msgError;
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function renameConversation(id: string, newTitle: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title: newTitle })
    .eq('id', id);

  if (error) throw error;
}

export async function fetchSessionStates(conversationId: string): Promise<CharacterSessionState[]> {
  const { data, error } = await supabase
    .from('character_session_states')
    .select('*')
    .eq('conversation_id', conversationId);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    characterId: row.character_id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    name: row.name || undefined,
    nicknames: row.nicknames || undefined,
    previousNames: row.previous_names || [],
    age: row.age || undefined,
    sexType: row.sex_type || undefined,
    sexualOrientation: row.sexual_orientation || undefined,
    roleDescription: row.role_description || undefined,
    location: row.location || '',
    currentMood: row.current_mood || '',
    physicalAppearance: dbPhysicalAppearanceToApp(row.physical_appearance),
    currentlyWearing: dbCurrentlyWearingToApp(row.currently_wearing),
    preferredClothing: row.preferred_clothing ? dbPreferredClothingToApp(row.preferred_clothing) : undefined,
    customSections: row.custom_sections || undefined,
    goals: row.goals || [],
    avatarUrl: row.avatar_url || undefined,
    avatarPosition: row.avatar_position || undefined,
    controlledBy: row.controlled_by || undefined,
    characterRole: row.character_role || undefined,
    personality: asCharacterPersonality(row.personality),
    background: asCharacterBackground(row.background),
    tone: asExtrasSection<CharacterTone>(row.tone),
    keyLifeEvents: asExtrasSection<CharacterKeyLifeEvents>(row.key_life_events),
    relationships: asExtrasSection<CharacterRelationships>(row.relationships),
    secrets: asExtrasSection<CharacterSecrets>(row.secrets),
    fears: asExtrasSection<CharacterFears>(row.fears),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

export async function createSessionState(
  character: Character,
  conversationId: string,
  userId: string,
): Promise<CharacterSessionState> {
  const { data, error } = await supabase
    .from('character_session_states')
    .insert({
      character_id: character.id,
      conversation_id: conversationId,
      user_id: userId,
      location: character.location || '',
      current_mood: character.currentMood || '',
      physical_appearance: appPhysicalAppearanceToDb(character.physicalAppearance || defaultPhysicalAppearance),
      currently_wearing: appCurrentlyWearingToDb(character.currentlyWearing || defaultCurrentlyWearing),
      preferred_clothing: appPreferredClothingToDb(character.preferredClothing || defaultPreferredClothing),
      personality: character.personality || null,
      background: character.background || {},
      tone: character.tone || {},
      key_life_events: character.keyLifeEvents || {},
      relationships: character.relationships || {},
      secrets: character.secrets || {},
      fears: character.fears || {},
      goals: character.goals || [],
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    characterId: data.character_id,
    conversationId: data.conversation_id,
    userId: data.user_id,
    location: data.location || '',
    currentMood: data.current_mood || '',
    physicalAppearance: dbPhysicalAppearanceToApp(data.physical_appearance),
    currentlyWearing: dbCurrentlyWearingToApp(data.currently_wearing),
    preferredClothing: data.preferred_clothing ? dbPreferredClothingToApp(data.preferred_clothing) : undefined,
    personality: asCharacterPersonality(data.personality),
    background: asCharacterBackground(data.background),
    tone: asExtrasSection<CharacterTone>(data.tone),
    keyLifeEvents: asExtrasSection<CharacterKeyLifeEvents>(data.key_life_events),
    relationships: asExtrasSection<CharacterRelationships>(data.relationships),
    secrets: asExtrasSection<CharacterSecrets>(data.secrets),
    fears: asExtrasSection<CharacterFears>(data.fears),
    goals: (data.goals as any[]) || [],
    createdAt: toTimestamp(data.created_at),
    updatedAt: toTimestamp(data.updated_at),
  };
}

export async function updateSessionState(
  id: string,
  patch: Partial<{
    name: string;
    nicknames: string;
    previousNames: string[];
    age: string;
    sexType: string;
    sexualOrientation: string;
    roleDescription: string;
    location: string;
    currentMood: string;
    physicalAppearance: Partial<PhysicalAppearance>;
    currentlyWearing: any;
    preferredClothing: Partial<PreferredClothing>;
    customSections: any[];
    goals: any[];
    avatarUrl: string;
    avatarPosition: { x: number; y: number };
    controlledBy: string;
    characterRole: string;
    personality: any;
    background: any;
    tone: any;
    keyLifeEvents: any;
    relationships: any;
    secrets: any;
    fears: any;
  }>,
): Promise<void> {
  const updateData: any = {};

  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.nicknames !== undefined) updateData.nicknames = patch.nicknames;
  if (patch.previousNames !== undefined) updateData.previous_names = patch.previousNames;
  if (patch.age !== undefined) updateData.age = patch.age;
  if (patch.sexType !== undefined) updateData.sex_type = patch.sexType;
  if (patch.sexualOrientation !== undefined) updateData.sexual_orientation = patch.sexualOrientation;
  if (patch.roleDescription !== undefined) updateData.role_description = patch.roleDescription;
  if (patch.location !== undefined) updateData.location = patch.location;
  if (patch.currentMood !== undefined) updateData.current_mood = patch.currentMood;
  if (patch.physicalAppearance !== undefined) {
    updateData.physical_appearance = appPhysicalAppearanceToDb(patch.physicalAppearance as PhysicalAppearance);
  }
  if (patch.currentlyWearing !== undefined) {
    updateData.currently_wearing = appCurrentlyWearingToDb(patch.currentlyWearing);
  }
  if (patch.preferredClothing !== undefined) {
    updateData.preferred_clothing = appPreferredClothingToDb(patch.preferredClothing as PreferredClothing);
  }
  if (patch.customSections !== undefined) {
    updateData.custom_sections = patch.customSections;
  }
  if (patch.goals !== undefined) {
    updateData.goals = patch.goals;
  }
  if (patch.avatarUrl !== undefined) updateData.avatar_url = patch.avatarUrl;
  if (patch.avatarPosition !== undefined) updateData.avatar_position = patch.avatarPosition;
  if (patch.controlledBy !== undefined) updateData.controlled_by = patch.controlledBy;
  if (patch.characterRole !== undefined) updateData.character_role = patch.characterRole;
  if (patch.personality !== undefined) updateData.personality = patch.personality;
  if (patch.background !== undefined) updateData.background = patch.background;
  if (patch.tone !== undefined) updateData.tone = patch.tone;
  if (patch.keyLifeEvents !== undefined) updateData.key_life_events = patch.keyLifeEvents;
  if (patch.relationships !== undefined) updateData.relationships = patch.relationships;
  if (patch.secrets !== undefined) updateData.secrets = patch.secrets;
  if (patch.fears !== undefined) updateData.fears = patch.fears;

  const { error } = await supabase
    .from('character_session_states')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function initializeSessionStates(
  characters: Character[],
  conversationId: string,
  userId: string,
): Promise<CharacterSessionState[]> {
  const existing = await fetchSessionStates(conversationId);
  if (existing.length > 0) {
    return existing;
  }

  const states: CharacterSessionState[] = [];
  for (const char of characters) {
    const state = await createSessionState(char, conversationId, userId);
    states.push(state);
  }
  return states;
}

function dbToMemory(row: any): Memory {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    day: row.day,
    timeOfDay: row.time_of_day,
    source: row.source || 'user',
    entryType: row.entry_type || 'bullet',
    sourceMessageId: row.source_message_id,
    sourceGenerationId: row.source_generation_id || undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

async function fetchConversationMessageGenerations(
  conversationId: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, generation_id')
    .eq('conversation_id', conversationId);

  if (error) throw error;

  return new Map(
    (data || []).map((row: any) => [row.id, row.generation_id || row.id]),
  );
}

export async function fetchMemories(conversationId: string): Promise<Memory[]> {
  const [memoryResult, messageGenerations] = await Promise.all([
    supabase
      .from('memories')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('day', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true }),
    fetchConversationMessageGenerations(conversationId),
  ]);

  if (memoryResult.error) throw memoryResult.error;

  return (memoryResult.data || [])
    .map(dbToMemory)
    .filter((memory) => {
      if (!memory.sourceMessageId) return true;
      const currentGeneration = messageGenerations.get(memory.sourceMessageId);
      if (!currentGeneration) return false;
      if (!memory.sourceGenerationId) return true;
      return currentGeneration === memory.sourceGenerationId;
    });
}

export async function createMemory(
  conversationId: string,
  userId: string,
  content: string,
  day?: number | null,
  timeOfDay?: TimeOfDay | null,
  source: MemorySource = 'user',
  sourceMessageId?: string,
  sourceGenerationId?: string,
  entryType: import('@/types').MemoryEntryType = 'bullet',
): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      content,
      day: day ?? null,
      time_of_day: timeOfDay ?? null,
      source,
      source_message_id: sourceMessageId ?? null,
      source_generation_id: sourceGenerationId ?? null,
      entry_type: entryType,
    })
    .select()
    .single();

  if (error) throw error;
  return dbToMemory(data);
}

export async function updateMemory(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAllMemories(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('conversation_id', conversationId);

  if (error) throw error;
}

function dbToCharacterStateMessageSnapshot(row: any): CharacterStateMessageSnapshot {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    characterId: row.character_id,
    sourceMessageId: row.source_message_id,
    sourceGenerationId: row.source_generation_id,
    statePayload: (row.snapshot || {}) as CharacterStateMessageSnapshot['statePayload'],
    createdAt: toTimestamp(row.created_at),
  };
}

export async function fetchCharacterStateMessageSnapshots(
  conversationId: string,
): Promise<CharacterStateMessageSnapshot[]> {
  const { data, error } = await supabase
    .from('character_state_message_snapshots')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(dbToCharacterStateMessageSnapshot);
}

export async function upsertCharacterStateMessageSnapshot(
  snapshot: Pick<
    CharacterStateMessageSnapshot,
    'conversationId' | 'characterId' | 'sourceMessageId' | 'sourceGenerationId' | 'statePayload'
  > & { userId: string },
): Promise<CharacterStateMessageSnapshot> {
  const { data, error } = await supabase
    .from('character_state_message_snapshots')
    .upsert(
      {
        conversation_id: snapshot.conversationId,
        character_id: snapshot.characterId,
        user_id: snapshot.userId,
        source_message_id: snapshot.sourceMessageId,
        source_generation_id: snapshot.sourceGenerationId,
        snapshot: snapshot.statePayload,
      },
      { onConflict: 'character_id,source_message_id,source_generation_id' },
    )
    .select()
    .single();

  if (error) throw error;

  return dbToCharacterStateMessageSnapshot(data);
}

function dbToStoryGoalStepDerivation(row: any): StoryGoalStepDerivation {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    goalId: row.goal_id,
    stepId: row.step_id,
    sourceMessageId: row.source_message_id,
    sourceGenerationId: row.source_generation_id,
    completed: row.completed ?? true,
    day: row.day ?? null,
    timeOfDay: row.time_of_day ?? null,
    createdAt: toTimestamp(row.created_at),
  };
}

export async function fetchStoryGoalStepDerivations(
  conversationId: string,
): Promise<StoryGoalStepDerivation[]> {
  const { data, error } = await supabase
    .from('story_goal_step_derivations')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(dbToStoryGoalStepDerivation);
}

export async function upsertStoryGoalStepDerivations(
  input: {
    conversationId: string;
    userId: string;
    sourceMessageId: string;
    sourceGenerationId: string;
    day?: number | null;
    timeOfDay?: TimeOfDay | null;
    completions: Array<{ goalId: string; stepId: string; completed: boolean }>;
  },
): Promise<StoryGoalStepDerivation[]> {
  if (input.completions.length === 0) return [];

  const { data, error } = await supabase
    .from('story_goal_step_derivations')
    .upsert(
      input.completions.map((completion) => ({
        conversation_id: input.conversationId,
        user_id: input.userId,
        goal_id: completion.goalId,
        step_id: completion.stepId,
        source_message_id: input.sourceMessageId,
        source_generation_id: input.sourceGenerationId,
        completed: completion.completed,
        day: input.day ?? null,
        time_of_day: input.timeOfDay ?? null,
      })),
      { onConflict: 'conversation_id,source_message_id,source_generation_id,goal_id,step_id' },
    )
    .select();

  if (error) throw error;

  return (data || []).map(dbToStoryGoalStepDerivation);
}
