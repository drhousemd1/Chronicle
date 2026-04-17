import type { ContentThemes } from '@/types';
import { defaultContentThemes } from '@/types';
import { supabase } from './shared';

export async function fetchContentThemes(scenarioId: string): Promise<ContentThemes> {
  const { data, error } = await supabase
    .from('content_themes')
    .select('*')
    .eq('scenario_id', scenarioId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return { ...defaultContentThemes };

  return {
    characterTypes: data.character_types || [],
    storyType: data.story_type as 'SFW' | 'NSFW' | null,
    genres: data.genres || [],
    origin: data.origin || [],
    triggerWarnings: data.trigger_warnings || [],
    customTags: data.custom_tags || [],
  };
}

export async function fetchContentThemesForScenarios(
  scenarioIds: string[],
): Promise<Map<string, ContentThemes>> {
  if (scenarioIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('content_themes')
    .select('*')
    .in('scenario_id', scenarioIds);

  if (error) throw error;

  const map = new Map<string, ContentThemes>();
  for (const row of data || []) {
    map.set(row.scenario_id, {
      characterTypes: row.character_types || [],
      storyType: row.story_type as 'SFW' | 'NSFW' | null,
      genres: row.genres || [],
      origin: row.origin || [],
      triggerWarnings: row.trigger_warnings || [],
      customTags: row.custom_tags || [],
    });
  }
  return map;
}

export async function saveContentThemes(scenarioId: string, themes: ContentThemes): Promise<void> {
  const { error } = await supabase
    .from('content_themes')
    .upsert(
      {
        scenario_id: scenarioId,
        character_types: themes.characterTypes,
        story_type: themes.storyType,
        genres: themes.genres,
        origin: themes.origin,
        trigger_warnings: themes.triggerWarnings,
        custom_tags: themes.customTags,
      },
      { onConflict: 'scenario_id' },
    );

  if (error) throw error;
}
