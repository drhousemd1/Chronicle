
import { supabase } from '@/integrations/supabase/client';
import type { ContentThemes } from '@/types';
import { defaultContentThemes } from '@/types';

// Types for gallery data
export interface PublishedScenarioContentThemes {
  characterTypes: string[];
  storyType: 'SFW' | 'NSFW' | null;
  genres: string[];
  origin: string[];
  triggerWarnings: string[];
  customTags: string[];
}

export interface PublishedScenario {
  id: string;
  scenario_id: string;
  publisher_id: string;
  allow_remix: boolean;
  tags: string[];
  like_count: number;
  save_count: number;
  play_count: number;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  scenario?: {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    cover_image_position: { x: number; y: number } | null;
    world_core: any;
  };
  publisher?: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  };
  // Content themes
  contentThemes?: PublishedScenarioContentThemes;
}

export interface SavedScenario {
  id: string;
  user_id: string;
  published_scenario_id: string;
  source_scenario_id: string;
  created_at: string;
  // Joined data
  published_scenario?: PublishedScenario;
}

export interface GalleryScenarioData {
  published: PublishedScenario;
  isLiked: boolean;
  isSaved: boolean;
}

// Content theme filters interface
export interface ContentThemeFilters {
  storyTypes?: string[];
  genres?: string[];
  origins?: string[];
  triggerWarnings?: string[];
  customTags?: string[];
}

// Fetch all published scenarios with optional tag filter
export type SortOption = 'all' | 'recent' | 'liked' | 'saved' | 'played' | 'following';

export async function fetchPublishedScenarios(
  searchTags?: string[],
  sortBy: SortOption = 'all',
  limit = 50,
  offset = 0,
  contentThemeFilters?: ContentThemeFilters,
  publisherIds?: string[]
): Promise<PublishedScenario[]> {
  try {
    let query = supabase
      .from('published_scenarios')
      .select(`
        id,
        scenario_id,
        publisher_id,
        allow_remix,
        tags,
        like_count,
        save_count,
        play_count,
        view_count,
        is_published,
        created_at,
        updated_at,
        scenarios!inner (
          id,
          title,
          description,
          cover_image_url,
          cover_image_position
        )
      `)
      .eq('is_published', true);

    // Filter by publisher IDs if provided (used by "Following" tab)
    if (publisherIds && publisherIds.length > 0) {
      query = query.in('publisher_id', publisherIds);
    }

    // Apply sorting based on sortBy parameter
    switch (sortBy) {
      case 'liked':
        query = query.order('like_count', { ascending: false });
        break;
      case 'saved':
        query = query.order('save_count', { ascending: false });
        break;
      case 'played':
        query = query.order('play_count', { ascending: false });
        break;
      case 'recent':
      case 'all':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    if (searchTags?.length) {
      query = query.overlaps('tags', searchTags);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch published scenarios:', error);
      return [];
    }
    
    if (!data || data.length === 0) return [];
    
    // Fetch publisher profiles and content themes separately
    const uniquePublisherIds = [...new Set(data.map((item: any) => item.publisher_id))];
    const scenarioIds = data.map((item: any) => item.scenario_id);
    
    const [profilesResult, themesResult] = await Promise.all([
      supabase.from('profiles').select('id, username, avatar_url, display_name').in('id', uniquePublisherIds),
      supabase.from('content_themes').select('*').in('scenario_id', scenarioIds)
    ]);
    
    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p]));
    const themesMap = new Map((themesResult.data || []).map(t => [t.scenario_id, {
      characterTypes: t.character_types || [],
      storyType: t.story_type as 'SFW' | 'NSFW' | null,
      genres: t.genres || [],
      origin: t.origin || [],
      triggerWarnings: t.trigger_warnings || [],
      customTags: t.custom_tags || []
    }]));
    
    // Transform the data to match our interface
    let results = data.map((item: any) => ({
      id: item.id,
      scenario_id: item.scenario_id,
      publisher_id: item.publisher_id,
      allow_remix: item.allow_remix,
      tags: item.tags,
      like_count: item.like_count,
      save_count: item.save_count,
      play_count: item.play_count,
      view_count: item.view_count,
      is_published: item.is_published,
      created_at: item.created_at,
      updated_at: item.updated_at,
      scenario: item.scenarios,
      publisher: profileMap.get(item.publisher_id) || null,
      contentThemes: themesMap.get(item.scenario_id) || null
    }));

    // Apply content theme filters if provided
    if (contentThemeFilters) {
      results = results.filter(scenario => {
        const themes = scenario.contentThemes;
        if (!themes) return false;

        if (contentThemeFilters.storyTypes?.length) {
          if (!themes.storyType || !contentThemeFilters.storyTypes.includes(themes.storyType)) {
            return false;
          }
        }

        if (contentThemeFilters.genres?.length) {
          const hasMatchingGenre = themes.genres?.some(g => contentThemeFilters.genres!.includes(g));
          if (!hasMatchingGenre) return false;
        }

        if (contentThemeFilters.origins?.length) {
          const hasMatchingOrigin = themes.origin?.some(o => contentThemeFilters.origins!.includes(o));
          if (!hasMatchingOrigin) return false;
        }

        if (contentThemeFilters.triggerWarnings?.length) {
          const hasMatchingWarning = themes.triggerWarnings?.some(w => contentThemeFilters.triggerWarnings!.includes(w));
          if (!hasMatchingWarning) return false;
        }

        if (contentThemeFilters.customTags?.length) {
          const hasMatchingTag = themes.customTags?.some(t => contentThemeFilters.customTags!.includes(t));
          if (!hasMatchingTag) return false;
        }

        return true;
      });
    }

    return results;
  } catch (err) {
    console.error('Error fetching published scenarios:', err);
    return [];
  }
}

// Check if current user has published a scenario
export async function getPublishedScenario(scenarioId: string): Promise<PublishedScenario | null> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select('*')
    .eq('scenario_id', scenarioId)
    .maybeSingle();
    
  if (error) throw error;
  return data;
}

// Fetch all published scenario IDs for a user (for "Published" tags in hub)
export async function fetchUserPublishedScenarioIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select('scenario_id')
    .eq('publisher_id', userId)
    .eq('is_published', true);
    
  if (error) throw error;
  return new Set((data || []).map(p => p.scenario_id));
}

// Publish or update a scenario
export async function publishScenario(
  scenarioId: string,
  publisherId: string,
  allowRemix: boolean,
  tags: string[]
): Promise<PublishedScenario> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .upsert({
      scenario_id: scenarioId,
      publisher_id: publisherId,
      allow_remix: allowRemix,
      tags,
      is_published: true
    }, { onConflict: 'scenario_id' })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Unpublish a scenario
export async function unpublishScenario(scenarioId: string): Promise<void> {
  const { error } = await supabase
    .from('published_scenarios')
    .update({ is_published: false })
    .eq('scenario_id', scenarioId);
    
  if (error) throw error;
}

// Check if user has liked a scenario
export async function checkUserLike(publishedScenarioId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('scenario_likes')
    .select('id')
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId)
    .maybeSingle();
    
  return !!data;
}

// Toggle like on a scenario
export async function toggleLike(
  publishedScenarioId: string,
  userId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('scenario_likes')
    .select('id')
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('scenario_likes')
      .delete()
      .eq('id', existing.id);
    
    await supabase.rpc('decrement_like_count', { 
      published_id: publishedScenarioId 
    });
    
    return false;
  } else {
    await supabase
      .from('scenario_likes')
      .insert({
        published_scenario_id: publishedScenarioId,
        user_id: userId
      });
    
    await supabase.rpc('increment_like_count', { 
      published_id: publishedScenarioId 
    });
    
    return true;
  }
}

// Check if user has saved a scenario
export async function checkUserSave(publishedScenarioId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('saved_scenarios')
    .select('id')
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId)
    .maybeSingle();
    
  return !!data;
}

// Save a scenario to user's collection
export async function saveScenarioToCollection(
  publishedScenarioId: string,
  sourceScenarioId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_scenarios')
    .insert({
      user_id: userId,
      published_scenario_id: publishedScenarioId,
      source_scenario_id: sourceScenarioId
    });
    
  if (error) throw error;
  
  await supabase.rpc('increment_save_count', { 
    published_id: publishedScenarioId 
  });
}

// Remove saved scenario
export async function unsaveScenario(
  publishedScenarioId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_scenarios')
    .delete()
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId);
    
  if (error) throw error;
  
  await supabase.rpc('decrement_save_count', { 
    published_id: publishedScenarioId 
  });
}

// Get user's saved scenarios
export async function fetchSavedScenarios(userId: string): Promise<SavedScenario[]> {
  const { data, error } = await supabase
    .from('saved_scenarios')
    .select(`
      id,
      user_id,
      published_scenario_id,
      source_scenario_id,
      created_at,
      published_scenarios (
        id,
        scenario_id,
        publisher_id,
        allow_remix,
        tags,
        like_count,
        save_count,
        play_count,
        is_published,
        created_at,
        updated_at,
        scenarios (
          id,
          title,
          description,
          cover_image_url,
          cover_image_position
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  if (!data || data.length === 0) return [];
  
  // Fetch publisher profiles separately
  const publisherIds = [...new Set(
    data
      .filter((item: any) => item.published_scenarios?.publisher_id)
      .map((item: any) => item.published_scenarios.publisher_id)
  )];
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, display_name')
    .in('id', publisherIds);
  
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  
  return data.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    published_scenario_id: item.published_scenario_id,
    source_scenario_id: item.source_scenario_id,
    created_at: item.created_at,
    published_scenario: item.published_scenarios ? {
      ...item.published_scenarios,
      scenario: item.published_scenarios.scenarios,
      publisher: profileMap.get(item.published_scenarios.publisher_id) || null
    } : undefined
  }));
}

// Check multiple likes/saves at once for gallery display
export async function getUserInteractions(
  publishedScenarioIds: string[],
  userId: string
): Promise<{ likes: Set<string>; saves: Set<string> }> {
  const [likesResult, savesResult] = await Promise.all([
    supabase
      .from('scenario_likes')
      .select('published_scenario_id')
      .eq('user_id', userId)
      .in('published_scenario_id', publishedScenarioIds),
    supabase
      .from('saved_scenarios')
      .select('published_scenario_id')
      .eq('user_id', userId)
      .in('published_scenario_id', publishedScenarioIds)
  ]);
  
  const likes = new Set((likesResult.data || []).map(l => l.published_scenario_id));
  const saves = new Set((savesResult.data || []).map(s => s.published_scenario_id));
  
  return { likes, saves };
}

// Increment play count
export async function incrementPlayCount(publishedScenarioId: string): Promise<void> {
  await supabase.rpc('increment_play_count', { 
    published_id: publishedScenarioId 
  });
}

// Increment view count
export async function incrementViewCount(publishedScenarioId: string): Promise<void> {
  await supabase.rpc('increment_view_count', { 
    published_id: publishedScenarioId 
  });
}

// Track a remix
export async function trackRemix(
  originalPublishedId: string,
  remixedScenarioId: string,
  remixerId: string
): Promise<void> {
  const { error } = await supabase
    .from('remixed_scenarios')
    .insert({
      original_published_id: originalPublishedId,
      remixed_scenario_id: remixedScenarioId,
      remixer_id: remixerId
    });
    
  if (error) throw error;
}

// Fetch published scenarios with full data for user's own scenarios
export async function fetchUserPublishedScenarios(
  userId: string
): Promise<Map<string, PublishedScenario>> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select('*')
    .eq('publisher_id', userId)
    .eq('is_published', true);
    
  if (error) throw error;
  
  const map = new Map<string, PublishedScenario>();
  for (const row of data || []) {
    map.set(row.scenario_id, row as unknown as PublishedScenario);
  }
  return map;
}

// Review types
export interface ScenarioReview {
  id: string;
  published_scenario_id: string;
  user_id: string;
  concept_strength: number;
  initial_situation: number;
  role_clarity: number;
  motivation_tension: number;
  tone_promise: number;
  low_friction_start: number;
  worldbuilding_vibe: number;
  replayability: number;
  character_details_complexity: number;
  spice_level: number;
  comment: string | null;
  raw_weighted_score: number;
  created_at: string;
  updated_at: string;
  reviewer?: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  };
}

// Submit or update a review
export async function submitReview(
  publishedScenarioId: string,
  userId: string,
  ratings: Record<string, number>,
  spiceLevel: number,
  comment: string,
  rawWeightedScore: number
): Promise<void> {
  const { error } = await supabase
    .from('scenario_reviews')
    .upsert({
      published_scenario_id: publishedScenarioId,
      user_id: userId,
      concept_strength: ratings.conceptStrength,
      initial_situation: ratings.initialSituation,
      role_clarity: ratings.roleClarity,
      motivation_tension: ratings.motivationTension,
      tone_promise: ratings.tonePromise,
      low_friction_start: ratings.lowFrictionStart,
      worldbuilding_vibe: ratings.worldbuildingVibe,
      replayability: ratings.replayability,
      character_details_complexity: ratings.characterDetailsComplexity,
      spice_level: spiceLevel,
      comment: comment || null,
      raw_weighted_score: rawWeightedScore,
    } as any, { onConflict: 'published_scenario_id,user_id' });

  if (error) throw error;
}

// Fetch reviews for a scenario
export async function fetchScenarioReviews(publishedScenarioId: string): Promise<ScenarioReview[]> {
  const { data, error } = await supabase
    .from('scenario_reviews')
    .select('*')
    .eq('published_scenario_id', publishedScenarioId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((r: any) => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, display_name')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  return data.map((r: any) => ({
    ...r,
    reviewer: profileMap.get(r.user_id) || null,
  }));
}

// Fetch user's own review for a scenario
export async function fetchUserReview(publishedScenarioId: string, userId: string): Promise<ScenarioReview | null> {
  const { data, error } = await supabase
    .from('scenario_reviews')
    .select('*')
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as ScenarioReview | null;
}

// Fetch creator overall rating across all their published scenarios
export async function fetchCreatorOverallRating(publisherId: string): Promise<{ rating: number; totalReviews: number } | null> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select('avg_rating, review_count')
    .eq('publisher_id', publisherId)
    .eq('is_published', true);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const reviewed = data.filter((d: any) => d.review_count > 0);
  if (reviewed.length === 0) return null;

  const totalReviews = reviewed.reduce((sum: number, d: any) => sum + d.review_count, 0);
  const avgRating = reviewed.reduce((sum: number, d: any) => sum + Number(d.avg_rating) * d.review_count, 0) / totalReviews;

  return { rating: Math.round(avgRating * 2) / 2, totalReviews };
}

// Scenario characters type for detail modal
export interface ScenarioCharacter {
  id: string;
  name: string;
  avatarUrl: string;
  avatarPosition: { x: number; y: number };
}

// Fetch characters for a scenario (for detail modal preview)
export async function fetchScenarioCharacters(scenarioId: string): Promise<ScenarioCharacter[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, avatar_url, avatar_position')
    .eq('scenario_id', scenarioId);
    
  if (error) throw error;
  
  return (data || []).map(char => ({
    id: char.id,
    name: char.name,
    avatarUrl: char.avatar_url || '',
    avatarPosition: (char.avatar_position as { x: number; y: number }) || { x: 50, y: 50 }
  }));
}
