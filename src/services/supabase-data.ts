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
  OpeningDialog
} from '@/types';

// =============================================
// TYPE CONVERTERS
// =============================================

function dbToCharacter(row: any): Character {
  return {
    id: row.id,
    name: row.name || '',
    sexType: row.sex_type || '',
    controlledBy: row.controlled_by || 'AI',
    characterRole: row.character_role || 'Main',
    tags: row.tags || '',
    avatarDataUrl: row.avatar_url || '',
    avatarPosition: row.avatar_position || { x: 50, y: 50 },
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
    sex_type: char.sexType,
    controlled_by: char.controlledBy,
    character_role: char.characterRole,
    tags: char.tags,
    avatar_url: char.avatarDataUrl,
    avatar_position: char.avatarPosition || { x: 50, y: 50 },
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
      createdAt: new Date(m.created_at).getTime()
    })),
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
    .select('id, title, description, cover_image_url, tags, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToScenarioMetadata);
}

export async function fetchScenarioById(id: string): Promise<ScenarioData | null> {
  // Fetch scenario
  const { data: scenario, error: scenarioError } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (scenarioError) throw scenarioError;
  if (!scenario) return null;

  // Fetch characters for this scenario
  const { data: characters, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('scenario_id', id);

  if (charError) throw charError;

  // Fetch codex entries
  const { data: codexEntries, error: codexError } = await supabase
    .from('codex_entries')
    .select('*')
    .eq('scenario_id', id);

  if (codexError) throw codexError;

  // Fetch scenes
  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('*')
    .eq('scenario_id', id);

  if (scenesError) throw scenesError;

  // Fetch conversations with messages
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('scenario_id', id);

  if (convError) throw convError;

  const conversationsWithMessages: Conversation[] = [];
  for (const conv of conversations || []) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    conversationsWithMessages.push(dbToConversation(conv, messages || []));
  }

  const worldCore: WorldCore = (scenario.world_core as WorldCore) || {
    scenarioName: '',
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

  const openingDialog: OpeningDialog = (scenario.opening_dialog as OpeningDialog) || { enabled: true, text: '' };
  
  const uiSettings = (scenario.ui_settings as { showBackgrounds: boolean; transparentBubbles: boolean; darkMode: boolean }) || { 
    showBackgrounds: true, 
    transparentBubbles: false, 
    darkMode: false 
  };

  return {
    version: scenario.version || 3,
    characters: (characters || []).map(dbToCharacter),
    world: {
      core: worldCore,
      entries: (codexEntries || []).map(dbToCodexEntry)
    },
    story: {
      openingDialog
    },
    scenes: (scenes || []).map(dbToScene),
    uiSettings,
    conversations: conversationsWithMessages,
    selectedModel: scenario.selected_model || 'gemini-3-flash-preview'
  };
}

export async function saveScenario(
  id: string,
  data: ScenarioData,
  metadata: { title: string; description: string; coverImage: string; tags: string[] },
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
      tags: metadata.tags,
      world_core: data.world.core,
      ui_settings: data.uiSettings,
      opening_dialog: data.story.openingDialog,
      selected_model: data.selectedModel,
      version: data.version
    });

  if (scenarioError) throw scenarioError;

  // Delete existing characters for this scenario and re-insert
  await supabase.from('characters').delete().eq('scenario_id', id);
  
  if (data.characters.length > 0) {
    const { error: charError } = await supabase
      .from('characters')
      .insert(data.characters.map(c => characterToDb(c, userId, id, false)));
    if (charError) throw charError;
  }

  // Delete and re-insert codex entries
  await supabase.from('codex_entries').delete().eq('scenario_id', id);
  
  if (data.world.entries.length > 0) {
    const { error: codexError } = await supabase
      .from('codex_entries')
      .insert(data.world.entries.map(e => ({
        id: e.id,
        scenario_id: id,
        title: e.title,
        body: e.body
      })));
    if (codexError) throw codexError;
  }

  // Delete and re-insert scenes
  await supabase.from('scenes').delete().eq('scenario_id', id);
  
  if (data.scenes.length > 0) {
    const { error: scenesError } = await supabase
      .from('scenes')
      .insert(data.scenes.map(s => ({
        id: s.id,
        scenario_id: id,
        image_url: s.url,
        tag: s.tag,
        is_starting_scene: s.isStartingScene || false
      })));
    if (scenesError) throw scenesError;
  }
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

export async function fetchConversationRegistry(): Promise<ConversationMetadata[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      scenario_id,
      title,
      created_at,
      updated_at,
      scenarios!inner(title)
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const result: ConversationMetadata[] = [];

  for (const conv of data || []) {
    // Get message count and last message
    const { data: messages } = await supabase
      .from('messages')
      .select('content')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1);

    result.push({
      conversationId: conv.id,
      scenarioId: conv.scenario_id,
      scenarioTitle: (conv.scenarios as any)?.title || 'Unknown',
      conversationTitle: conv.title,
      lastMessage: messages?.[0]?.content || '',
      messageCount: 0, // Will be calculated if needed
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
  // Upsert conversation
  const { error: convError } = await supabase
    .from('conversations')
    .upsert({
      id: conversation.id,
      user_id: userId,
      scenario_id: scenarioId,
      title: conversation.title
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
        content: m.text
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
