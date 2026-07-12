import type {
  Character,
  CharacterBackground,
  CharacterFears,
  CharacterKeyLifeEvents,
  CharacterRelationships,
  CharacterSecrets,
  CharacterTone,
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
} from './shared';
import {
  buildStorageSentinel,
  getSignedMediaUrl,
  getSignedMediaUrls,
  isStorageSentinel,
  parseStorageSentinel,
} from './signed-media';

export function dbToCharacter(row: any): Character {
  return {
    id: row.id,
    name: row.name || '',
    nicknames: row.nicknames || '',
    age: row.age || '',
    sexType: row.sex_type || '',
    sexualOrientation: row.sexual_orientation || '',
    location: row.location || '',
    controlledBy: row.controlled_by || 'AI',
    characterRole: row.character_role || 'Main',
    roleDescription: row.role_description || '',
    tags: row.tags || '',
    avatarDataUrl: row.avatar_url || '',
    avatarPath: row.avatar_path || null,
    avatarPosition: row.avatar_position || { x: 50, y: 50 },
    physicalAppearance: dbPhysicalAppearanceToApp(row.physical_appearance),
    currentlyWearing: dbCurrentlyWearingToApp(row.currently_wearing),
    preferredClothing: dbPreferredClothingToApp(row.preferred_clothing),
    personality: asCharacterPersonality(row.personality),
    goals: row.goals || undefined,
    background: asCharacterBackground(row.background),
    tone: asExtrasSection<CharacterTone>(row.tone),
    keyLifeEvents: asExtrasSection<CharacterKeyLifeEvents>(row.key_life_events),
    relationships: asExtrasSection<CharacterRelationships>(row.relationships),
    secrets: asExtrasSection<CharacterSecrets>(row.secrets),
    fears: asExtrasSection<CharacterFears>(row.fears),
    sections: row.sections || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function characterToDb(char: Character, userId: string, scenarioId?: string, isLibrary = false) {
  // Persist a storage:// sentinel for avatar_url when an avatarPath is present
  // so legacy public URLs aren't reintroduced into stored rows.
  let avatarUrl = char.avatarDataUrl;
  let avatarPath = char.avatarPath || null;
  if (avatarPath) {
    avatarUrl = buildStorageSentinel('character_avatars_private', avatarPath);
  } else {
    const parsed = parseStorageSentinel(char.avatarDataUrl);
    if (parsed) {
      avatarPath = parsed.path;
      avatarUrl = buildStorageSentinel(parsed.bucket, parsed.path);
    }
  }
  return {
    id: char.id,
    user_id: userId,
    scenario_id: scenarioId || null,
    name: char.name,
    nicknames: char.nicknames || '',
    age: char.age || '',
    sex_type: char.sexType,
    sexual_orientation: char.sexualOrientation || '',
    location: char.location || '',
    controlled_by: char.controlledBy,
    character_role: char.characterRole,
    role_description: char.roleDescription || '',
    tags: char.tags,
    avatar_url: avatarUrl,
    avatar_path: avatarPath,
    avatar_position: char.avatarPosition || { x: 50, y: 50 },
    physical_appearance: appPhysicalAppearanceToDb(char.physicalAppearance || defaultPhysicalAppearance),
    currently_wearing: appCurrentlyWearingToDb(char.currentlyWearing || defaultCurrentlyWearing),
    preferred_clothing: appPreferredClothingToDb(char.preferredClothing || defaultPreferredClothing),
    personality: char.personality || null,
    goals: char.goals || [],
    background: char.background || {},
    tone: char.tone || {},
    key_life_events: char.keyLifeEvents || {},
    relationships: char.relationships || {},
    secrets: char.secrets || {},
    fears: char.fears || {},
    sections: char.sections,
    is_library: isLibrary,
  };
}

/**
 * Stage B avatar hydration: replace `avatarDataUrl` with a signed URL when
 * the character has an `avatarPath` or when `avatarDataUrl` is a
 * `storage://character_avatars_private/...` sentinel. Legacy rows that
 * still hold a public URL pass through unchanged.
 */
export async function hydrateCharacterAvatars<
  T extends { avatarDataUrl: string; avatarPath?: string | null },
>(chars: T[]): Promise<T[]> {
  const tasks: Array<{ char: T; bucket: 'character_avatars_private'; path: string }> = [];
  for (const c of chars) {
    if (c.avatarPath) {
      tasks.push({ char: c, bucket: 'character_avatars_private', path: c.avatarPath });
    } else if (isStorageSentinel(c.avatarDataUrl)) {
      const parsed = parseStorageSentinel(c.avatarDataUrl);
      if (parsed && parsed.bucket === 'character_avatars_private') {
        tasks.push({ char: c, bucket: 'character_avatars_private', path: parsed.path });
      }
    }
  }
  if (!tasks.length) return chars;
  const paths = tasks.map((t) => t.path);
  const map = await getSignedMediaUrls('character_avatars_private', paths);
  for (const t of tasks) {
    const signed = map[t.path];
    if (signed) t.char.avatarDataUrl = signed;
  }
  return chars;
}

export async function fetchCharacterLibrary(): Promise<Character[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_library', true)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return hydrateCharacterAvatars((data || []).map(dbToCharacter));
}

export type CharacterSummary = {
  id: string;
  name: string;
  tags: string;
  avatarUrl: string;
  avatarPosition: { x: number; y: number };
};

export async function fetchCharacterLibrarySummaries(): Promise<CharacterSummary[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, tags, avatar_url, avatar_path, avatar_position')
    .eq('is_library', true)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  const summaries = (data || []).map((d: any) => ({
    id: d.id,
    name: d.name || '',
    tags: d.tags || '',
    avatarUrl: d.avatar_url || '',
    avatarPath: (d.avatar_path as string | null) || null,
    avatarPosition: (d.avatar_position as any) || { x: 50, y: 50 },
  }));
  // Hydrate signed URLs in-place using the avatarDataUrl/avatarPath shape.
  const adapted = summaries.map((s) => ({
    ...s,
    avatarDataUrl: s.avatarUrl,
  }));
  await hydrateCharacterAvatars(adapted as any);
  return adapted.map((s, i) => ({
    id: summaries[i].id,
    name: summaries[i].name,
    tags: summaries[i].tags,
    avatarUrl: s.avatarDataUrl,
    avatarPosition: summaries[i].avatarPosition,
  }));
}

export async function fetchCharacterById(id: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const [hydrated] = await hydrateCharacterAvatars([dbToCharacter(data)]);
  return hydrated;
}

export async function saveCharacterToLibrary(char: Character, userId: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert(characterToDb(char, userId, undefined, true));

  if (error) throw error;
}

export async function saveCharacterCopyToLibrary(char: Character, userId: string, newId: string): Promise<void> {
  const dbChar = characterToDb(char, userId, undefined, true);
  dbChar.id = newId;
  dbChar.scenario_id = null;

  const { error } = await supabase
    .from('characters')
    .insert(dbChar);

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
