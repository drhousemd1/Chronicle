import { LLM_MODELS } from '@/constants';
import {
  migrateWorldCoreToCanonical,
  needsWorldCoreBackfill,
} from '@/lib/canonical-field-registry';
import type {
  CodexEntry,
  Conversation,
  OpeningDialog,
  ScenarioData,
  ScenarioMetadata,
  Scene,
  WorldCore,
} from '@/types';
import { uuid } from '@/utils';
import { characterToDb, dbToCharacter } from './characters';
import { dbToConversation } from './conversations';
import {
  ensureStorageUrl,
  supabase,
} from './shared';

function dbToScenarioMetadata(row: any): ScenarioMetadata {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    coverImage: row.cover_image_url || '',
    coverImagePosition: row.cover_image_position || { x: 50, y: 50 },
    tags: row.tags || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    isDraft: row.is_draft ?? false,
  };
}

function dbToCodexEntry(row: any): CodexEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body || '',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function dbToScene(row: any): Scene {
  let tags: string[] = [];
  if (row.tags && Array.isArray(row.tags)) {
    tags = row.tags;
  } else if (row.tag && typeof row.tag === 'string' && row.tag.trim() !== '') {
    tags = [row.tag];
  }

  return {
    id: row.id,
    url: row.image_url,
    tags,
    isStartingScene: row.is_starting_scene || false,
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function backfillScenarioWorldCoreById(scenarioId: string, canonicalWorldCore: WorldCore): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ world_core: canonicalWorldCore })
    .eq('id', scenarioId);
  if (error) {
    console.warn(`[supabase-data] Failed to backfill canonical world_core for scenario ${scenarioId}:`, error);
  }
}

export async function backfillCanonicalWorldCoreForUser(userId: string): Promise<{ total: number; updated: number }> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, world_core')
    .eq('user_id', userId);

  if (error) throw error;

  const rows = data || [];
  let updated = 0;

  for (const row of rows) {
    const { canonical, shouldBackfill } = needsWorldCoreBackfill((row as any).world_core || {});
    if (!shouldBackfill) continue;
    const { error: updateError } = await supabase
      .from('stories')
      .update({ world_core: canonical })
      .eq('id', (row as any).id);
    if (!updateError) updated += 1;
  }

  return { total: rows.length, updated };
}

export async function fetchMyScenarios(userId: string): Promise<ScenarioMetadata[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, description, cover_image_url, cover_image_position, tags, created_at, updated_at, is_draft')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToScenarioMetadata);
}

export async function fetchScenarioById(id: string): Promise<{
  data: ScenarioData;
  coverImage: string;
  coverImagePosition: { x: number; y: number };
} | null> {
  const [scenarioResult, charactersResult, codexResult, scenesResult, conversationsResult] = await Promise.all([
    supabase.from('stories').select('*').eq('id', id).maybeSingle(),
    supabase.from('characters').select('*').eq('scenario_id', id),
    supabase.from('codex_entries').select('*').eq('scenario_id', id),
    supabase.from('scenes').select('*').eq('scenario_id', id),
    supabase.from('conversations').select('*').eq('scenario_id', id),
  ]);

  if (scenarioResult.error) throw scenarioResult.error;
  if (!scenarioResult.data) return null;

  const scenario = scenarioResult.data as any;
  const conversations = conversationsResult.data || [];

  let conversationsWithMessages: Conversation[] = [];
  if (conversations.length > 0) {
    const conversationIds = conversations.map((c) => c.id);
    const MESSAGE_BATCH_LIMIT = 5000;
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true })
      .limit(MESSAGE_BATCH_LIMIT);

    if ((allMessages || []).length === MESSAGE_BATCH_LIMIT) {
      console.warn(
        `[fetchScenarioById] Message batch hit ${MESSAGE_BATCH_LIMIT} limit — some messages may be truncated. Scenario has ${conversationIds.length} conversations.`,
      );
    }

    const messagesByConv = new Map<string, any[]>();
    for (const msg of allMessages || []) {
      if (!messagesByConv.has(msg.conversation_id)) {
        messagesByConv.set(msg.conversation_id, []);
      }
      messagesByConv.get(msg.conversation_id)!.push(msg);
    }

    conversationsWithMessages = conversations.map((conv) =>
      dbToConversation(conv, messagesByConv.get(conv.id) || []),
    );
  }

  const worldCoreBackfill = needsWorldCoreBackfill((scenario.world_core as any) || {});
  const worldCore: WorldCore = worldCoreBackfill.canonical;
  if (worldCoreBackfill.shouldBackfill) {
    void backfillScenarioWorldCoreById(scenario.id, worldCore);
  }

  const rawOpeningDialog = scenario.opening_dialog as Partial<OpeningDialog> | undefined;
  const openingDialog: OpeningDialog = {
    enabled: rawOpeningDialog?.enabled ?? true,
    text: rawOpeningDialog?.text ?? '',
    startingDay: rawOpeningDialog?.startingDay ?? 1,
    startingTimeOfDay: rawOpeningDialog?.startingTimeOfDay ?? 'day',
    timeProgressionMode: rawOpeningDialog?.timeProgressionMode ?? 'manual',
    timeProgressionInterval: rawOpeningDialog?.timeProgressionInterval ?? 15,
  };

  const uiSettings =
    (scenario.ui_settings as { showBackgrounds: boolean; transparentBubbles: boolean; darkMode: boolean }) || {
      showBackgrounds: true,
      transparentBubbles: false,
      darkMode: false,
    };

  return {
    data: {
      version: scenario.version || 3,
      characters: (charactersResult.data || []).map(dbToCharacter),
      sideCharacters: [],
      world: {
        core: worldCore,
        entries: (codexResult.data || []).map(dbToCodexEntry),
      },
      story: {
        openingDialog,
      },
      scenes: (scenesResult.data || []).map(dbToScene),
      uiSettings,
      conversations: conversationsWithMessages,
      selectedModel:
        scenario.selected_model && LLM_MODELS.some((m) => m.id === scenario.selected_model)
          ? scenario.selected_model
          : LLM_MODELS[0].id,
      selectedArtStyle: scenario.selected_art_style || 'cinematic-2-5d',
    },
    coverImage: scenario.cover_image_url || '',
    coverImagePosition: (scenario.cover_image_position as { x: number; y: number }) || { x: 50, y: 50 },
  };
}

export async function fetchScenarioForPlay(id: string): Promise<{
  data: ScenarioData;
  coverImage: string;
  coverImagePosition: { x: number; y: number };
  conversationCount: number;
} | null> {
  const [scenarioResult, charactersResult, codexResult, scenesResult, convCountResult] = await Promise.all([
    supabase.from('stories').select('*').eq('id', id).maybeSingle(),
    supabase.from('characters').select('*').eq('scenario_id', id),
    supabase.from('codex_entries').select('*').eq('scenario_id', id),
    supabase.from('scenes').select('*').eq('scenario_id', id),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('scenario_id', id),
  ]);

  if (scenarioResult.error) throw scenarioResult.error;
  if (!scenarioResult.data) return null;

  const scenario = scenarioResult.data as any;

  const worldCoreBackfill = needsWorldCoreBackfill((scenario.world_core as any) || {});
  const worldCore: WorldCore = worldCoreBackfill.canonical;
  if (worldCoreBackfill.shouldBackfill) {
    void backfillScenarioWorldCoreById(scenario.id, worldCore);
  }

  const rawOpeningDialog = scenario.opening_dialog as Partial<OpeningDialog> | undefined;
  const openingDialog: OpeningDialog = {
    enabled: rawOpeningDialog?.enabled ?? true,
    text: rawOpeningDialog?.text ?? '',
    startingDay: rawOpeningDialog?.startingDay ?? 1,
    startingTimeOfDay: rawOpeningDialog?.startingTimeOfDay ?? 'day',
    timeProgressionMode: rawOpeningDialog?.timeProgressionMode ?? 'manual',
    timeProgressionInterval: rawOpeningDialog?.timeProgressionInterval ?? 15,
  };

  const uiSettings =
    (scenario.ui_settings as { showBackgrounds: boolean; transparentBubbles: boolean; darkMode: boolean }) || {
      showBackgrounds: true,
      transparentBubbles: false,
      darkMode: false,
    };

  return {
    data: {
      version: scenario.version || 3,
      characters: (charactersResult.data || []).map(dbToCharacter),
      sideCharacters: [],
      world: {
        core: worldCore,
        entries: (codexResult.data || []).map(dbToCodexEntry),
      },
      story: {
        openingDialog,
      },
      scenes: (scenesResult.data || []).map(dbToScene),
      uiSettings,
      conversations: [],
      selectedModel:
        scenario.selected_model && LLM_MODELS.some((m) => m.id === scenario.selected_model)
          ? scenario.selected_model
          : LLM_MODELS[0].id,
      selectedArtStyle: scenario.selected_art_style || 'cinematic-2-5d',
    },
    coverImage: scenario.cover_image_url || '',
    coverImagePosition: (scenario.cover_image_position as { x: number; y: number }) || { x: 50, y: 50 },
    conversationCount: convCountResult.count || 0,
  };
}

export async function saveScenario(
  id: string,
  data: ScenarioData,
  metadata: { title: string; description: string; coverImage: string; coverImagePosition?: { x: number; y: number }; tags: string[] },
  userId: string,
  options?: { isDraft?: boolean },
): Promise<void> {
  const safeCoverImage = await ensureStorageUrl(metadata.coverImage, 'covers', userId);

  for (const char of data.characters) {
    if (char.avatarDataUrl?.startsWith('data:')) {
      char.avatarDataUrl = await ensureStorageUrl(char.avatarDataUrl, 'avatars', userId);
    }
  }

  const storyPayload = {
    title: metadata.title,
    description: metadata.description,
    cover_image_url: safeCoverImage,
    cover_image_position: metadata.coverImagePosition || { x: 50, y: 50 },
    tags: metadata.tags,
    world_core: migrateWorldCoreToCanonical(data.world.core as any),
    ui_settings: data.uiSettings,
    opening_dialog: data.story.openingDialog,
    selected_model: data.selectedModel,
    selected_art_style: data.selectedArtStyle || 'cinematic-2-5d',
    version: data.version,
    is_draft: options?.isDraft ?? false,
    nav_button_images: {},
  };

  const charactersPayload = data.characters.map((c) => characterToDb(c, userId, id, false));
  const codexPayload = data.world.entries.map((e) => ({
    id: e.id,
    title: e.title,
    body: e.body,
  }));
  const scenesPayload = data.scenes.map((s) => ({
    id: s.id,
    image_url: s.url,
    tags: s.tags ?? [],
    is_starting_scene: s.isStartingScene || false,
  }));

  const { error } = await supabase.rpc('save_scenario_atomic', {
    p_scenario_id: id,
    p_user_id: userId,
    p_story: storyPayload,
    p_characters: charactersPayload,
    p_codex_entries: codexPayload,
    p_scenes: scenesPayload,
  } as any);

  if (error) throw error;
}

async function syncCharacters(scenarioId: string, data: ScenarioData, userId: string): Promise<void> {
  const { data: existingChars } = await supabase
    .from('characters')
    .select('id')
    .eq('scenario_id', scenarioId);

  const existingCharIds = new Set((existingChars || []).map((c) => c.id));
  const currentCharIds = new Set(data.characters.map((c) => c.id));

  const charsToDelete = [...existingCharIds].filter((cid) => !currentCharIds.has(cid));
  if (charsToDelete.length > 0) {
    await supabase.from('characters').delete().in('id', charsToDelete);
  }

  if (data.characters.length > 0) {
    const { error: charError } = await supabase
      .from('characters')
      .upsert(data.characters.map((c) => characterToDb(c, userId, scenarioId, false)), { onConflict: 'id' });
    if (charError) throw charError;
  }
}

async function syncCodexEntries(scenarioId: string, data: ScenarioData): Promise<void> {
  const { data: existingCodex } = await supabase
    .from('codex_entries')
    .select('id')
    .eq('scenario_id', scenarioId);

  const existingCodexIds = new Set((existingCodex || []).map((e) => e.id));
  const currentCodexIds = new Set(data.world.entries.map((e) => e.id));

  const codexToDelete = [...existingCodexIds].filter((eid) => !currentCodexIds.has(eid));
  if (codexToDelete.length > 0) {
    await supabase.from('codex_entries').delete().in('id', codexToDelete);
  }

  if (data.world.entries.length > 0) {
    const { error: codexError } = await supabase
      .from('codex_entries')
      .upsert(
        data.world.entries.map((e) => ({
          id: e.id,
          scenario_id: scenarioId,
          title: e.title,
          body: e.body,
        })),
        { onConflict: 'id' },
      );
    if (codexError) throw codexError;
  }
}

async function syncScenes(scenarioId: string, data: ScenarioData): Promise<void> {
  const { data: existingScenes } = await supabase
    .from('scenes')
    .select('id')
    .eq('scenario_id', scenarioId);

  const existingSceneIds = new Set((existingScenes || []).map((s) => s.id));
  const currentSceneIds = new Set(data.scenes.map((s) => s.id));

  const scenesToDelete = [...existingSceneIds].filter((sid) => !currentSceneIds.has(sid));
  if (scenesToDelete.length > 0) {
    await supabase.from('scenes').delete().in('id', scenesToDelete);
  }

  if (data.scenes.length > 0) {
    const { error: scenesError } = await supabase
      .from('scenes')
      .upsert(
        data.scenes.map((s) => ({
          id: s.id,
          scenario_id: scenarioId,
          image_url: s.url,
          tags: s.tags ?? [],
          is_starting_scene: s.isStartingScene || false,
        })),
        { onConflict: 'id' },
      );
    if (scenesError) throw scenesError;
  }
}

export async function fetchScenarioIntegrity(id: string): Promise<{ characters: number; codex: number; scenes: number }> {
  const [charResult, codexResult, sceneResult] = await Promise.all([
    supabase.from('characters').select('id', { count: 'exact', head: true }).eq('scenario_id', id),
    supabase.from('codex_entries').select('id', { count: 'exact', head: true }).eq('scenario_id', id),
    supabase.from('scenes').select('id', { count: 'exact', head: true }).eq('scenario_id', id),
  ]);
  return {
    characters: charResult.count ?? 0,
    codex: codexResult.count ?? 0,
    scenes: sceneResult.count ?? 0,
  };
}

export async function saveScenarioWithVerification(
  id: string,
  data: ScenarioData,
  metadata: { title: string; description: string; coverImage: string; coverImagePosition?: { x: number; y: number }; tags: string[] },
  userId: string,
  options?: { isDraft?: boolean },
): Promise<boolean> {
  await saveScenario(id, data, metadata, userId, options);

  const integrity = await fetchScenarioIntegrity(id);
  const expectedChars = data.characters.length;
  const expectedCodex = data.world.entries.length;
  const expectedScenes = data.scenes.length;

  const charOk = integrity.characters >= expectedChars;
  const codexOk = integrity.codex >= expectedCodex;
  const sceneOk = integrity.scenes >= expectedScenes;

  if (charOk && codexOk && sceneOk) return true;

  console.warn(
    '[saveScenarioWithVerification] Integrity mismatch, retrying. Expected:',
    { expectedChars, expectedCodex, expectedScenes },
    'Got:',
    integrity,
  );
  await saveScenario(id, data, metadata, userId, options);

  const retry = await fetchScenarioIntegrity(id);
  const retryOk = retry.characters >= expectedChars && retry.codex >= expectedCodex && retry.scenes >= expectedScenes;
  if (!retryOk) {
    console.error('[saveScenarioWithVerification] Retry still failed. Got:', retry);
  }
  return retryOk;
}

export async function deleteScenario(id: string): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getScenarioOwner(scenarioId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', scenarioId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as any).user_id;
}

export async function cloneScenarioForRemix(
  originalScenarioId: string,
  newScenarioId: string,
  userId: string,
  originalData: ScenarioData,
  originalCoverImage: string,
  originalCoverPosition: { x: number; y: number },
): Promise<ScenarioData> {
  const clonedCharacters = originalData.characters.map((char) => ({
    ...char,
    id: uuid(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  const clonedCodexEntries = originalData.world.entries.map((entry) => ({
    ...entry,
    id: uuid(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  const clonedScenes = originalData.scenes.map((scene) => ({
    ...scene,
    id: uuid(),
    createdAt: Date.now(),
  }));

  const clonedData: ScenarioData = {
    ...originalData,
    characters: clonedCharacters,
    world: {
      ...originalData.world,
      entries: clonedCodexEntries,
    },
    scenes: clonedScenes,
    conversations: [],
    sideCharacters: [],
  };

  const metadata = {
    title: originalData.world.core.scenarioName || 'Remixed Scenario',
    description: originalData.world.core.briefDescription || '',
    coverImage: originalCoverImage,
    coverImagePosition: originalCoverPosition,
    tags: ['Remix'],
  };

  await saveScenario(newScenarioId, clonedData, metadata, userId);

  return clonedData;
}

export async function trackRemix(
  originalPublishedId: string,
  remixedScenarioId: string,
  remixerId: string,
): Promise<void> {
  const { error } = await supabase
    .from('remixed_scenarios')
    .insert({
      original_published_id: originalPublishedId,
      remixed_scenario_id: remixedScenarioId,
      remixer_id: remixerId,
    });

  if (error) {
    console.warn('Failed to track remix:', error.message);
  }
}

export async function fetchMyScenariosPaginated(
  userId: string,
  limit: number,
  offset: number,
): Promise<ScenarioMetadata[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, description, cover_image_url, cover_image_position, tags, created_at, updated_at, is_draft')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []).map(dbToScenarioMetadata);
}
