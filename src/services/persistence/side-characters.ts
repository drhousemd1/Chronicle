import type { SideCharacter, SideCharacterMessageSnapshot } from '@/types';
import { defaultSideCharacterBackground, defaultSideCharacterPersonality } from '@/types';
import {
  appCurrentlyWearingToDb,
  appPhysicalAppearanceToDb,
  appPreferredClothingToDb,
  dbCurrentlyWearingToApp,
  dbPhysicalAppearanceToApp,
  dbPreferredClothingToApp,
  supabase,
} from './shared';
import {
  buildStorageSentinel,
  getSignedMediaUrls,
  isStorageSentinel,
  parseStorageSentinel,
} from './signed-media';

function dbToSideCharacter(row: any): SideCharacter {
  return {
    id: row.id,
    name: row.name || '',
    nicknames: row.nicknames || '',
    age: row.age || '',
    sexType: row.sex_type || '',
    sexualOrientation: row.sexual_orientation || '',
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
    sections: Array.isArray(row.custom_sections) ? row.custom_sections : [],
    avatarDataUrl: row.avatar_url || '',
    avatarPath: row.avatar_path || null,
    avatarPosition: row.avatar_position || { x: 50, y: 50 },
    firstMentionedIn: row.first_mentioned_in || '',
    extractedTraits: row.extracted_traits || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function dbToSideCharacterMessageSnapshot(row: any): SideCharacterMessageSnapshot {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sideCharacterId: row.side_character_id,
    sourceMessageId: row.source_message_id,
    sourceGenerationId: row.source_generation_id,
    statePayload: (row.snapshot || {}) as SideCharacterMessageSnapshot['statePayload'],
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function fetchSideCharacters(conversationId: string): Promise<SideCharacter[]> {
  const { data, error } = await supabase
    .from('side_characters')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return hydrateSideCharacterAvatars((data || []).map(dbToSideCharacter));
}

export async function saveSideCharacter(
  sideChar: SideCharacter,
  conversationId: string,
  userId: string,
): Promise<void> {
  let avatarUrl = sideChar.avatarDataUrl;
  let avatarPath = sideChar.avatarPath || null;
  if (avatarPath) {
    avatarUrl = buildStorageSentinel('character_avatars_private', avatarPath);
  } else {
    const parsed = parseStorageSentinel(sideChar.avatarDataUrl);
    if (parsed) {
      avatarPath = parsed.path;
      avatarUrl = buildStorageSentinel(parsed.bucket, parsed.path);
    }
  }
  const { error } = await supabase
    .from('side_characters')
    .upsert({
      id: sideChar.id,
      conversation_id: conversationId,
      user_id: userId,
      name: sideChar.name,
      nicknames: sideChar.nicknames || '',
      age: sideChar.age,
      sex_type: sideChar.sexType,
      sexual_orientation: sideChar.sexualOrientation || '',
      location: sideChar.location,
      current_mood: sideChar.currentMood,
      role_description: sideChar.roleDescription,
      physical_appearance: appPhysicalAppearanceToDb(sideChar.physicalAppearance),
      currently_wearing: appCurrentlyWearingToDb(sideChar.currentlyWearing),
      preferred_clothing: appPreferredClothingToDb(sideChar.preferredClothing),
      background: sideChar.background,
      personality: sideChar.personality,
      custom_sections: sideChar.sections || [],
      avatar_url: avatarUrl,
      avatar_path: avatarPath,
      avatar_position: sideChar.avatarPosition,
      first_mentioned_in: sideChar.firstMentionedIn,
      extracted_traits: sideChar.extractedTraits,
    });

  if (error) throw error;
}

export async function updateSideCharacter(
  id: string,
  patch: Partial<SideCharacter>,
): Promise<void> {
  const updateData: any = {};

  if (patch.nicknames !== undefined) updateData.nicknames = patch.nicknames;
  if (patch.age !== undefined) updateData.age = patch.age;
  if (patch.sexType !== undefined) updateData.sex_type = patch.sexType;
  if (patch.sexualOrientation !== undefined) updateData.sexual_orientation = patch.sexualOrientation;
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
  if (patch.sections !== undefined) updateData.custom_sections = patch.sections;
  if (patch.avatarDataUrl !== undefined) {
    const parsed = parseStorageSentinel(patch.avatarDataUrl);
    if (parsed) {
      updateData.avatar_url = buildStorageSentinel(parsed.bucket, parsed.path);
      updateData.avatar_path = parsed.path;
    } else {
      updateData.avatar_url = patch.avatarDataUrl;
    }
  }
  if (patch.avatarPath !== undefined) {
    updateData.avatar_path = patch.avatarPath;
    if (patch.avatarPath) {
      updateData.avatar_url = buildStorageSentinel('character_avatars_private', patch.avatarPath);
    }
  }
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

/**
 * Stage B avatar hydration for side characters. Same shape as
 * hydrateCharacterAvatars in characters.ts but kept local to avoid a circular
 * import between persistence modules.
 */
export async function hydrateSideCharacterAvatars<
  T extends { avatarDataUrl: string; avatarPath?: string | null },
>(rows: T[]): Promise<T[]> {
  const tasks: Array<{ row: T; path: string }> = [];
  for (const r of rows) {
    if (r.avatarPath) {
      tasks.push({ row: r, path: r.avatarPath });
    } else if (isStorageSentinel(r.avatarDataUrl)) {
      const parsed = parseStorageSentinel(r.avatarDataUrl);
      if (parsed && parsed.bucket === 'character_avatars_private') {
        tasks.push({ row: r, path: parsed.path });
      }
    }
  }
  if (!tasks.length) return rows;
  const map = await getSignedMediaUrls('character_avatars_private', tasks.map((t) => t.path));
  for (const t of tasks) {
    const signed = map[t.path];
    if (signed) t.row.avatarDataUrl = signed;
  }
  return rows;
}

export async function deleteSideCharacter(id: string): Promise<void> {
  const { error } = await supabase
    .from('side_characters')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchSideCharacterMessageSnapshots(
  conversationId: string,
): Promise<SideCharacterMessageSnapshot[]> {
  const { data, error } = await supabase
    .from('side_character_message_snapshots')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(dbToSideCharacterMessageSnapshot);
}

export async function upsertSideCharacterMessageSnapshot(
  snapshot: Pick<
    SideCharacterMessageSnapshot,
    'conversationId' | 'sideCharacterId' | 'sourceMessageId' | 'sourceGenerationId' | 'statePayload'
  > & { userId: string },
): Promise<SideCharacterMessageSnapshot> {
  const { data, error } = await supabase
    .from('side_character_message_snapshots')
    .upsert(
      {
        conversation_id: snapshot.conversationId,
        side_character_id: snapshot.sideCharacterId,
        user_id: snapshot.userId,
        source_message_id: snapshot.sourceMessageId,
        source_generation_id: snapshot.sourceGenerationId,
        snapshot: snapshot.statePayload,
      },
      { onConflict: 'side_character_id,source_message_id,source_generation_id' },
    )
    .select()
    .single();

  if (error) throw error;

  return dbToSideCharacterMessageSnapshot(data);
}
