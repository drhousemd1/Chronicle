import { supabase } from '@/integrations/supabase/client';
import type { 
  Character, 
  ScenarioData, 
  ScenarioMetadata, 
  Conversation, 
  ConversationMetadata,
  WorldCore,
  CodexEntry,
  Scene,
  OpeningDialog,
  PhysicalAppearance,
  CurrentlyWearing,
  PreferredClothing,
  CharacterSessionState,
  UserBackground,
  SideCharacter,
  SideCharacterBackground,
  SideCharacterPersonality,
  Memory,
  MemorySource,
  TimeOfDay
} from '@/types';
import { 
  defaultPhysicalAppearance, 
  defaultCurrentlyWearing, 
  defaultPreferredClothing,
  defaultSideCharacterBackground,
  defaultSideCharacterPersonality
} from '@/types';
import { LLM_MODELS } from '@/constants';

// =============================================
// TYPE CONVERTERS
// =============================================

function dbPhysicalAppearanceToApp(db: any): PhysicalAppearance {
  return {
    hairColor: db?.hair_color || '',
    eyeColor: db?.eye_color || '',
    build: db?.build || '',
    bodyHair: db?.body_hair || '',
    height: db?.height || '',
    breastSize: db?.breast_size || '',
    genitalia: db?.genitalia || '',
    skinTone: db?.skin_tone || '',
    makeup: db?.makeup || '',
    bodyMarkings: db?.body_markings || '',
    temporaryConditions: db?.temporary_conditions || ''
  };
}

function appPhysicalAppearanceToDb(app: PhysicalAppearance) {
  return {
    hair_color: app.hairColor,
    eye_color: app.eyeColor,
    build: app.build,
    body_hair: app.bodyHair,
    height: app.height,
    breast_size: app.breastSize,
    genitalia: app.genitalia,
    skin_tone: app.skinTone,
    makeup: app.makeup,
    body_markings: app.bodyMarkings,
    temporary_conditions: app.temporaryConditions
  };
}

function dbCurrentlyWearingToApp(db: any): CurrentlyWearing {
  return {
    top: db?.top || '',
    bottom: db?.bottom || '',
    undergarments: db?.undergarments || '',
    miscellaneous: db?.miscellaneous || ''
  };
}

function appCurrentlyWearingToDb(app: CurrentlyWearing) {
  return {
    top: app.top,
    bottom: app.bottom,
    undergarments: app.undergarments,
    miscellaneous: app.miscellaneous
  };
}

function dbPreferredClothingToApp(db: any): PreferredClothing {
  return {
    casual: db?.casual || '',
    work: db?.work || '',
    sleep: db?.sleep || '',
    undergarments: db?.underwear || db?.undergarments || '',  // Support both old and new field names
    miscellaneous: db?.miscellaneous || ''
  };
}

function appPreferredClothingToDb(app: PreferredClothing) {
  return {
    casual: app.casual,
    work: app.work,
    sleep: app.sleep,
    underwear: app.undergarments,  // Store as 'underwear' in DB for backward compatibility
    miscellaneous: app.miscellaneous
  };
}

function dbToCharacter(row: any): Character {
  return {
    id: row.id,
    name: row.name || '',
    age: row.age || '',
    sexType: row.sex_type || '',
    location: row.location || '',
    currentMood: row.current_mood || '',
    controlledBy: row.controlled_by || 'AI',
    characterRole: row.character_role || 'Main',
    roleDescription: row.role_description || '',
    tags: row.tags || '',
    avatarDataUrl: row.avatar_url || '',
    avatarPosition: row.avatar_position || { x: 50, y: 50 },
    physicalAppearance: dbPhysicalAppearanceToApp(row.physical_appearance),
    currentlyWearing: dbCurrentlyWearingToApp(row.currently_wearing),
    preferredClothing: dbPreferredClothingToApp(row.preferred_clothing),
    sections: row.sections || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

function characterToDb(char: Character, userId: string, scenarioId?: string, isLibrary = false) {
  return {
    id: char.id,
    user_id: userId,
    scenario_id: scenarioId || null,
    name: char.name,
    age: char.age || '',
    sex_type: char.sexType,
    location: char.location || '',
    current_mood: char.currentMood || '',
    controlled_by: char.controlledBy,
    character_role: char.characterRole,
    role_description: char.roleDescription || '',
    tags: char.tags,
    avatar_url: char.avatarDataUrl,
    avatar_position: char.avatarPosition || { x: 50, y: 50 },
    physical_appearance: appPhysicalAppearanceToDb(char.physicalAppearance || defaultPhysicalAppearance),
    currently_wearing: appCurrentlyWearingToDb(char.currentlyWearing || defaultCurrentlyWearing),
    preferred_clothing: appPreferredClothingToDb(char.preferredClothing || defaultPreferredClothing),
    sections: char.sections,
    is_library: isLibrary
  };
}

function dbToScenarioMetadata(row: any): ScenarioMetadata {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    coverImage: row.cover_image_url || '',
    coverImagePosition: row.cover_image_position || { x: 50, y: 50 },
    tags: row.tags || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

function dbToCodexEntry(row: any): CodexEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body || '',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

function dbToScene(row: any): Scene {
  return {
    id: row.id,
    url: row.image_url,
    tag: row.tag || '',
    isStartingScene: row.is_starting_scene || false,
    createdAt: new Date(row.created_at).getTime()
  };
}

function dbToConversation(row: any, messages: any[]): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      text: m.content,
      day: m.day || undefined,
      timeOfDay: m.time_of_day || undefined,
      createdAt: new Date(m.created_at).getTime()
    })),
    currentDay: row.current_day || 1,
    currentTimeOfDay: row.current_time_of_day || 'day',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

// =============================================
// SCENARIOS
// =============================================

export async function fetchScenarios(): Promise<ScenarioMetadata[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('id, title, description, cover_image_url, cover_image_position, tags, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToScenarioMetadata);
}

export async function fetchScenarioById(id: string): Promise<{
  data: ScenarioData;
  coverImage: string;
  coverImagePosition: { x: number; y: number };
} | null> {
  // Parallel fetch of scenario + all related data
  const [scenarioResult, charactersResult, codexResult, scenesResult, conversationsResult] = await Promise.all([
    supabase.from('scenarios').select('*').eq('id', id).maybeSingle(),
    supabase.from('characters').select('*').eq('scenario_id', id),
    supabase.from('codex_entries').select('*').eq('scenario_id', id),
    supabase.from('scenes').select('*').eq('scenario_id', id),
    supabase.from('conversations').select('*').eq('scenario_id', id)
  ]);

  if (scenarioResult.error) throw scenarioResult.error;
  if (!scenarioResult.data) return null;

  const scenario = scenarioResult.data;
  const conversations = conversationsResult.data || [];

  // OPTIMIZATION: Batch fetch ALL messages for ALL conversations in a single query
  // instead of N+1 sequential queries
  let conversationsWithMessages: Conversation[] = [];
  if (conversations.length > 0) {
    const conversationIds = conversations.map(c => c.id);
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true });

    // Group messages by conversation_id in memory
    const messagesByConv = new Map<string, any[]>();
    for (const msg of allMessages || []) {
      if (!messagesByConv.has(msg.conversation_id)) {
        messagesByConv.set(msg.conversation_id, []);
      }
      messagesByConv.get(msg.conversation_id)!.push(msg);
    }

    // Build conversations with their messages
    conversationsWithMessages = conversations.map(conv => 
      dbToConversation(conv, messagesByConv.get(conv.id) || [])
    );
  }

  const worldCore: WorldCore = (scenario.world_core as WorldCore) || {
    scenarioName: '',
    briefDescription: '',
    settingOverview: '',
    rulesOfMagicTech: '',
    factions: '',
    locations: '',
    historyTimeline: '',
    toneThemes: '',
    plotHooks: '',
    narrativeStyle: '',
    dialogFormatting: ''
  };

  const rawOpeningDialog = scenario.opening_dialog as Partial<OpeningDialog> | undefined;
  const openingDialog: OpeningDialog = { 
    enabled: rawOpeningDialog?.enabled ?? true, 
    text: rawOpeningDialog?.text ?? '',
    startingDay: rawOpeningDialog?.startingDay ?? 1,
    startingTimeOfDay: rawOpeningDialog?.startingTimeOfDay ?? 'day'
  };
  
  const uiSettings = (scenario.ui_settings as { showBackgrounds: boolean; transparentBubbles: boolean; darkMode: boolean }) || { 
    showBackgrounds: true, 
    transparentBubbles: false, 
    darkMode: false 
  };

  return {
    data: {
      version: scenario.version || 3,
      characters: (charactersResult.data || []).map(dbToCharacter),
      sideCharacters: [],  // Side characters are loaded per-conversation, not per-scenario
      world: {
        core: worldCore,
        entries: (codexResult.data || []).map(dbToCodexEntry)
      },
      story: {
        openingDialog
      },
      scenes: (scenesResult.data || []).map(dbToScene),
      uiSettings,
      conversations: conversationsWithMessages,
      selectedModel: scenario.selected_model || LLM_MODELS[0].id,
      selectedArtStyle: scenario.selected_art_style || 'cinematic-2-5d'
    },
    coverImage: scenario.cover_image_url || '',
    coverImagePosition: scenario.cover_image_position as { x: number; y: number } || { x: 50, y: 50 }
  };
}

/**
 * Optimized scenario fetch for PLAY mode - doesn't load all existing conversations.
 * Creates a new conversation, so we don't need the old message history.
 * This eliminates the N+1 query problem for the play flow.
 */
export async function fetchScenarioForPlay(id: string): Promise<{
  data: ScenarioData;
  coverImage: string;
  coverImagePosition: { x: number; y: number };
  conversationCount: number;
} | null> {
  // Parallel fetch of scenario + related data (but NOT conversation messages)
  const [scenarioResult, charactersResult, codexResult, scenesResult, convCountResult] = await Promise.all([
    supabase.from('scenarios').select('*').eq('id', id).maybeSingle(),
    supabase.from('characters').select('*').eq('scenario_id', id),
    supabase.from('codex_entries').select('*').eq('scenario_id', id),
    supabase.from('scenes').select('*').eq('scenario_id', id),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('scenario_id', id)
  ]);

  if (scenarioResult.error) throw scenarioResult.error;
  if (!scenarioResult.data) return null;

  const scenario = scenarioResult.data;

  const worldCore: WorldCore = (scenario.world_core as WorldCore) || {
    scenarioName: '',
    briefDescription: '',
    settingOverview: '',
    rulesOfMagicTech: '',
    factions: '',
    locations: '',
    historyTimeline: '',
    toneThemes: '',
    plotHooks: '',
    narrativeStyle: '',
    dialogFormatting: ''
  };

  const rawOpeningDialog = scenario.opening_dialog as Partial<OpeningDialog> | undefined;
  const openingDialog: OpeningDialog = { 
    enabled: rawOpeningDialog?.enabled ?? true, 
    text: rawOpeningDialog?.text ?? '',
    startingDay: rawOpeningDialog?.startingDay ?? 1,
    startingTimeOfDay: rawOpeningDialog?.startingTimeOfDay ?? 'day'
  };
  
  const uiSettings = (scenario.ui_settings as { showBackgrounds: boolean; transparentBubbles: boolean; darkMode: boolean }) || { 
    showBackgrounds: true, 
    transparentBubbles: false, 
    darkMode: false 
  };

  return {
    data: {
      version: scenario.version || 3,
      characters: (charactersResult.data || []).map(dbToCharacter),
      sideCharacters: [],
      world: {
        core: worldCore,
        entries: (codexResult.data || []).map(dbToCodexEntry)
      },
      story: {
        openingDialog
      },
      scenes: (scenesResult.data || []).map(dbToScene),
      uiSettings,
      conversations: [],  // Empty - we'll add the new conversation
      selectedModel: scenario.selected_model || LLM_MODELS[0].id,
      selectedArtStyle: scenario.selected_art_style || 'cinematic-2-5d'
    },
    coverImage: scenario.cover_image_url || '',
    coverImagePosition: scenario.cover_image_position as { x: number; y: number } || { x: 50, y: 50 },
    conversationCount: convCountResult.count || 0
  };
}

export async function saveScenario(
  id: string,
  data: ScenarioData,
  metadata: { title: string; description: string; coverImage: string; coverImagePosition?: { x: number; y: number }; tags: string[] },
  userId: string
): Promise<void> {
  // Upsert scenario
  const { error: scenarioError } = await supabase
    .from('scenarios')
    .upsert({
      id,
      user_id: userId,
      title: metadata.title,
      description: metadata.description,
      cover_image_url: metadata.coverImage,
      cover_image_position: metadata.coverImagePosition || { x: 50, y: 50 },
      tags: metadata.tags,
      world_core: data.world.core,
      ui_settings: data.uiSettings,
      opening_dialog: data.story.openingDialog,
      selected_model: data.selectedModel,
      selected_art_style: data.selectedArtStyle || 'cinematic-2-5d',
      version: data.version
    });

  if (scenarioError) throw scenarioError;

  // Get current character IDs for this scenario
  const { data: existingChars } = await supabase
    .from('characters')
    .select('id')
    .eq('scenario_id', id);

  const existingCharIds = new Set((existingChars || []).map(c => c.id));
  const currentCharIds = new Set(data.characters.map(c => c.id));

  // Delete characters that were removed from the scenario
  const charsToDelete = [...existingCharIds].filter(cid => !currentCharIds.has(cid));
  if (charsToDelete.length > 0) {
    await supabase
      .from('characters')
      .delete()
      .in('id', charsToDelete);
  }

  // Upsert all current characters (handles both new and existing)
  if (data.characters.length > 0) {
    const { error: charError } = await supabase
      .from('characters')
      .upsert(
        data.characters.map(c => characterToDb(c, userId, id, false)),
        { onConflict: 'id' }
      );
    if (charError) throw charError;
  }

  // Get current codex entry IDs for this scenario
  const { data: existingCodex } = await supabase
    .from('codex_entries')
    .select('id')
    .eq('scenario_id', id);

  const existingCodexIds = new Set((existingCodex || []).map(e => e.id));
  const currentCodexIds = new Set(data.world.entries.map(e => e.id));

  // Delete codex entries that were removed
  const codexToDelete = [...existingCodexIds].filter(eid => !currentCodexIds.has(eid));
  if (codexToDelete.length > 0) {
    await supabase
      .from('codex_entries')
      .delete()
      .in('id', codexToDelete);
  }

  // Upsert all current codex entries
  if (data.world.entries.length > 0) {
    const { error: codexError } = await supabase
      .from('codex_entries')
      .upsert(
        data.world.entries.map(e => ({
          id: e.id,
          scenario_id: id,
          title: e.title,
          body: e.body
        })),
        { onConflict: 'id' }
      );
    if (codexError) throw codexError;
  }

  // Get current scene IDs for this scenario
  const { data: existingScenes } = await supabase
    .from('scenes')
    .select('id')
    .eq('scenario_id', id);

  const existingSceneIds = new Set((existingScenes || []).map(s => s.id));
  const currentSceneIds = new Set(data.scenes.map(s => s.id));

  // Delete scenes that were removed
  const scenesToDelete = [...existingSceneIds].filter(sid => !currentSceneIds.has(sid));
  if (scenesToDelete.length > 0) {
    await supabase
      .from('scenes')
      .delete()
      .in('id', scenesToDelete);
  }

  // Upsert all current scenes
  if (data.scenes.length > 0) {
    const { error: scenesError } = await supabase
      .from('scenes')
      .upsert(
        data.scenes.map(s => ({
          id: s.id,
          scenario_id: id,
          image_url: s.url,
          tag: s.tag,
          is_starting_scene: s.isStartingScene || false
        })),
        { onConflict: 'id' }
      );
    if (scenesError) throw scenesError;
  }

  // NOTE: Conversations are saved individually via saveConversation() 
  // when they are modified (e.g., in ChatInterfaceTab). We do NOT bulk-save 
  // all conversations here because it updates their timestamps simultaneously,
  // which breaks the Chat History chronological sorting.
}

export async function deleteScenario(id: string): Promise<void> {
  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// CHARACTER LIBRARY
// =============================================

export async function fetchCharacterLibrary(): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_library', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToCharacter);
}

export async function saveCharacterToLibrary(char: Character, userId: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert(characterToDb(char, userId, undefined, true));

  if (error) throw error;
}

export async function deleteCharacterFromLibrary(id: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)
    .eq('is_library', true);

  if (error) throw error;
}

// =============================================
// CONVERSATIONS
// =============================================

/**
 * Fetch a specific conversation with all its messages.
 * Used for resume to ensure we get the exact thread.
 */
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

export async function fetchConversationRegistry(): Promise<ConversationMetadata[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      scenario_id,
      title,
      created_at,
      updated_at,
      scenarios!inner(title, cover_image_url)
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const result: ConversationMetadata[] = [];

  for (const conv of data || []) {
    // Get message count
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id);

    // Get last message preview - fetch all messages in order and take the last one
    // (created_at can be the same for batch-inserted messages, so we get all and take the last)
    const { data: allMessages } = await supabase
      .from('messages')
      .select('content')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    
    const lastMessage = allMessages && allMessages.length > 0 
      ? allMessages[allMessages.length - 1].content 
      : '';

    result.push({
      conversationId: conv.id,
      scenarioId: conv.scenario_id,
      scenarioTitle: (conv.scenarios as any)?.title || 'Unknown',
      scenarioImageUrl: (conv.scenarios as any)?.cover_image_url || null,
      conversationTitle: conv.title,
      lastMessage: lastMessage,
      messageCount: count || 0,
      createdAt: new Date(conv.created_at).getTime(),
      updatedAt: new Date(conv.updated_at).getTime()
    });
  }

  return result;
}

export async function saveConversation(
  conversation: Conversation,
  scenarioId: string,
  userId: string
): Promise<void> {
  // Upsert conversation with day/time
  const { error: convError } = await supabase
    .from('conversations')
    .upsert({
      id: conversation.id,
      user_id: userId,
      scenario_id: scenarioId,
      title: conversation.title,
      current_day: conversation.currentDay || 1,
      current_time_of_day: conversation.currentTimeOfDay || 'day'
    });

  if (convError) throw convError;

  // Delete existing messages and re-insert
  await supabase.from('messages').delete().eq('conversation_id', conversation.id);

  if (conversation.messages.length > 0) {
    const { error: msgError } = await supabase
      .from('messages')
      .insert(conversation.messages.map(m => ({
        id: m.id,
        conversation_id: conversation.id,
        role: m.role,
        content: m.text,
        day: m.day || null,
        time_of_day: m.timeOfDay || null
      })));
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

// =============================================
// IMAGE UPLOADS
// =============================================

export async function uploadAvatar(userId: string, file: Blob, filename: string): Promise<string> {
  const path = `${userId}/${filename}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadSceneImage(userId: string, file: Blob, filename: string): Promise<string> {
  const path = `${userId}/${filename}`;
  
  const { error: uploadError } = await supabase.storage
    .from('scenes')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('scenes')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadCoverImage(userId: string, file: Blob, filename: string): Promise<string> {
  const path = `${userId}/${filename}`;
  
  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('covers')
    .getPublicUrl(path);

  return data.publicUrl;
}

// =============================================
// DATA URL TO BLOB HELPER
// =============================================

export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

// =============================================
// CHARACTER SESSION STATES
// =============================================

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
    // Extended fields for session-scoped character editing
    name: row.name || undefined,
    age: row.age || undefined,
    sexType: row.sex_type || undefined,
    roleDescription: row.role_description || undefined,
    location: row.location || '',
    currentMood: row.current_mood || '',
    physicalAppearance: dbPhysicalAppearanceToApp(row.physical_appearance),
    currentlyWearing: dbCurrentlyWearingToApp(row.currently_wearing),
    preferredClothing: row.preferred_clothing ? dbPreferredClothingToApp(row.preferred_clothing) : undefined,
    customSections: row.custom_sections || undefined,
    // Avatar fields for session-scoped updates
    avatarUrl: row.avatar_url || undefined,
    avatarPosition: row.avatar_position || undefined,
    // Control and role overrides
    controlledBy: row.controlled_by || undefined,
    characterRole: row.character_role || undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  }));
}

export async function createSessionState(
  character: Character,
  conversationId: string,
  userId: string
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
      currently_wearing: appCurrentlyWearingToDb(character.currentlyWearing || defaultCurrentlyWearing)
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
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  };
}

export async function updateSessionState(
  id: string,
  patch: Partial<{
    name: string;
    age: string;
    sexType: string;
    roleDescription: string;
    location: string;
    currentMood: string;
    physicalAppearance: Partial<PhysicalAppearance>;
    currentlyWearing: CurrentlyWearing;
    preferredClothing: Partial<PreferredClothing>;
    customSections: any[];
    avatarUrl: string;
    avatarPosition: { x: number; y: number };
    controlledBy: string;
    characterRole: string;
  }>
): Promise<void> {
  const updateData: any = {};
  
  // Extended fields for session-scoped character editing
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.age !== undefined) updateData.age = patch.age;
  if (patch.sexType !== undefined) updateData.sex_type = patch.sexType;
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
  // Avatar fields for session-scoped updates
  if (patch.avatarUrl !== undefined) updateData.avatar_url = patch.avatarUrl;
  if (patch.avatarPosition !== undefined) updateData.avatar_position = patch.avatarPosition;
  // Control and role overrides
  if (patch.controlledBy !== undefined) updateData.controlled_by = patch.controlledBy;
  if (patch.characterRole !== undefined) updateData.character_role = patch.characterRole;

  const { error } = await supabase
    .from('character_session_states')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function initializeSessionStates(
  characters: Character[],
  conversationId: string,
  userId: string
): Promise<CharacterSessionState[]> {
  // Check if session states already exist for this conversation
  const existing = await fetchSessionStates(conversationId);
  if (existing.length > 0) {
    return existing;
  }

  // Create session states for all characters
  const states: CharacterSessionState[] = [];
  for (const char of characters) {
    const state = await createSessionState(char, conversationId, userId);
    states.push(state);
  }
  return states;
}

// =============================================
// USER BACKGROUNDS (Hub Page)
// =============================================

export async function fetchUserBackgrounds(userId: string): Promise<UserBackground[]> {
  const { data, error } = await supabase
    .from('user_backgrounds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    isSelected: row.is_selected || false,
    createdAt: new Date(row.created_at).getTime()
  }));
}

export async function uploadBackgroundImage(userId: string, file: Blob, filename: string): Promise<string> {
  const path = `${userId}/${filename}`;
  
  const { error: uploadError } = await supabase.storage
    .from('backgrounds')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('backgrounds')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function createUserBackground(userId: string, imageUrl: string): Promise<UserBackground> {
  const { data, error } = await supabase
    .from('user_backgrounds')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      is_selected: false
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    imageUrl: data.image_url,
    isSelected: data.is_selected || false,
    createdAt: new Date(data.created_at).getTime()
  };
}

export async function setSelectedBackground(userId: string, backgroundId: string | null): Promise<void> {
  // First, unselect all backgrounds for this user
  const { error: unselectError } = await supabase
    .from('user_backgrounds')
    .update({ is_selected: false })
    .eq('user_id', userId);

  if (unselectError) throw unselectError;

  // If a specific background is selected, mark it as selected
  if (backgroundId) {
    const { error: selectError } = await supabase
      .from('user_backgrounds')
      .update({ is_selected: true })
      .eq('id', backgroundId)
      .eq('user_id', userId);

    if (selectError) throw selectError;
  }
}

export async function deleteUserBackground(userId: string, backgroundId: string, imageUrl: string): Promise<void> {
  // Extract the storage path from the URL
  const urlParts = imageUrl.split('/backgrounds/');
  if (urlParts.length > 1) {
    const storagePath = urlParts[1];
    await supabase.storage
      .from('backgrounds')
      .remove([storagePath]);
  }

  // Delete the database record
  const { error } = await supabase
    .from('user_backgrounds')
    .delete()
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (error) throw error;
}

// =============================================
// SIDEBAR BACKGROUNDS (Chat Interface Theme)
// =============================================

export async function fetchSidebarBackgrounds(userId: string): Promise<UserBackground[]> {
  const { data, error } = await supabase
    .from('sidebar_backgrounds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    isSelected: row.is_selected || false,
    createdAt: new Date(row.created_at).getTime()
  }));
}

export async function uploadSidebarBackgroundImage(userId: string, file: Blob, filename: string): Promise<string> {
  // Reuse the backgrounds bucket with a sidebar subfolder
  const path = `${userId}/sidebar/${filename}`;
  
  const { error: uploadError } = await supabase.storage
    .from('backgrounds')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('backgrounds')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function createSidebarBackground(userId: string, imageUrl: string): Promise<UserBackground> {
  const { data, error } = await supabase
    .from('sidebar_backgrounds')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      is_selected: false
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    imageUrl: data.image_url,
    isSelected: data.is_selected || false,
    createdAt: new Date(data.created_at).getTime()
  };
}

export async function setSelectedSidebarBackground(userId: string, backgroundId: string | null): Promise<void> {
  // First, unselect all sidebar backgrounds for this user
  const { error: unselectError } = await supabase
    .from('sidebar_backgrounds')
    .update({ is_selected: false })
    .eq('user_id', userId);

  if (unselectError) throw unselectError;

  // If a specific background is selected, mark it as selected
  if (backgroundId) {
    const { error: selectError } = await supabase
      .from('sidebar_backgrounds')
      .update({ is_selected: true })
      .eq('id', backgroundId)
      .eq('user_id', userId);

    if (selectError) throw selectError;
  }
}

export async function deleteSidebarBackground(userId: string, backgroundId: string, imageUrl: string): Promise<void> {
  // Extract the storage path from the URL
  const urlParts = imageUrl.split('/backgrounds/');
  if (urlParts.length > 1) {
    const storagePath = urlParts[1];
    await supabase.storage
      .from('backgrounds')
      .remove([storagePath]);
  }

  // Delete the database record
  const { error } = await supabase
    .from('sidebar_backgrounds')
    .delete()
    .eq('id', backgroundId)
    .eq('user_id', userId);

  if (error) throw error;
}

// =============================================
// SIDE CHARACTERS (AI-Generated per conversation)
// =============================================

function dbToSideCharacter(row: any): SideCharacter {
  return {
    id: row.id,
    name: row.name || '',
    age: row.age || '',
    sexType: row.sex_type || '',
    location: row.location || '',
    currentMood: row.current_mood || '',
    controlledBy: row.controlled_by || 'AI',
    characterRole: row.character_role || 'Side',
    roleDescription: row.role_description || '',
    physicalAppearance: dbPhysicalAppearanceToApp(row.physical_appearance),
    currentlyWearing: dbCurrentlyWearingToApp(row.currently_wearing),
    preferredClothing: dbPreferredClothingToApp(row.preferred_clothing),
    background: row.background || defaultSideCharacterBackground,
    personality: row.personality || defaultSideCharacterPersonality,
    avatarDataUrl: row.avatar_url || '',
    avatarPosition: row.avatar_position || { x: 50, y: 50 },
    firstMentionedIn: row.first_mentioned_in || '',
    extractedTraits: row.extracted_traits || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

export async function fetchSideCharacters(conversationId: string): Promise<SideCharacter[]> {
  const { data, error } = await supabase
    .from('side_characters')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(dbToSideCharacter);
}

export async function saveSideCharacter(
  sideChar: SideCharacter,
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('side_characters')
    .upsert({
      id: sideChar.id,
      conversation_id: conversationId,
      user_id: userId,
      name: sideChar.name,
      age: sideChar.age,
      sex_type: sideChar.sexType,
      location: sideChar.location,
      current_mood: sideChar.currentMood,
      role_description: sideChar.roleDescription,
      physical_appearance: appPhysicalAppearanceToDb(sideChar.physicalAppearance),
      currently_wearing: appCurrentlyWearingToDb(sideChar.currentlyWearing),
      preferred_clothing: appPreferredClothingToDb(sideChar.preferredClothing),
      background: sideChar.background,
      personality: sideChar.personality,
      avatar_url: sideChar.avatarDataUrl,
      avatar_position: sideChar.avatarPosition,
      first_mentioned_in: sideChar.firstMentionedIn,
      extracted_traits: sideChar.extractedTraits
    });

  if (error) throw error;
}

export async function updateSideCharacter(
  id: string,
  patch: Partial<SideCharacter>
): Promise<void> {
  const updateData: any = {};
  
  if (patch.age !== undefined) updateData.age = patch.age;
  if (patch.sexType !== undefined) updateData.sex_type = patch.sexType;
  if (patch.location !== undefined) updateData.location = patch.location;
  if (patch.currentMood !== undefined) updateData.current_mood = patch.currentMood;
  if (patch.roleDescription !== undefined) updateData.role_description = patch.roleDescription;
  if (patch.physicalAppearance !== undefined) {
    updateData.physical_appearance = appPhysicalAppearanceToDb(patch.physicalAppearance);
  }
  if (patch.currentlyWearing !== undefined) {
    updateData.currently_wearing = appCurrentlyWearingToDb(patch.currentlyWearing);
  }
  if (patch.preferredClothing !== undefined) {
    updateData.preferred_clothing = appPreferredClothingToDb(patch.preferredClothing);
  }
  if (patch.background !== undefined) updateData.background = patch.background;
  if (patch.personality !== undefined) updateData.personality = patch.personality;
  if (patch.avatarDataUrl !== undefined) updateData.avatar_url = patch.avatarDataUrl;
  if (patch.avatarPosition !== undefined) updateData.avatar_position = patch.avatarPosition;
  if (patch.extractedTraits !== undefined) updateData.extracted_traits = patch.extractedTraits;
  if (patch.controlledBy !== undefined) updateData.controlled_by = patch.controlledBy;
  if (patch.characterRole !== undefined) updateData.character_role = patch.characterRole;
  if (patch.name !== undefined) updateData.name = patch.name;

  const { error } = await supabase
    .from('side_characters')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSideCharacter(id: string): Promise<void> {
  const { error } = await supabase
    .from('side_characters')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// MEMORIES FUNCTIONS
// =============================================

function dbToMemory(row: any): Memory {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    day: row.day,
    timeOfDay: row.time_of_day,
    source: row.source || 'user',
    sourceMessageId: row.source_message_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

export async function fetchMemories(conversationId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('day', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(dbToMemory);
}

export async function createMemory(
  conversationId: string,
  userId: string,
  content: string,
  day?: number | null,
  timeOfDay?: TimeOfDay | null,
  source: MemorySource = 'user',
  sourceMessageId?: string
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
      source_message_id: sourceMessageId ?? null
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
