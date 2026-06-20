
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
  avg_rating: number;
  review_count: number;
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

const ensureIsoDate = (value: string | null | undefined): string => value ?? new Date(0).toISOString();

const normalizePublishedScenario = (row: any): PublishedScenario => ({
  ...row,
  tags: row?.tags || [],
  created_at: ensureIsoDate(row?.created_at),
  updated_at: ensureIsoDate(row?.updated_at),
  publisher: row?.publisher ?? undefined,
  contentThemes: row?.contentThemes ?? undefined,
});

// NOTE: legacy `fetchPublishedScenarios` removed (BF-11). The Gallery surface
// now goes through the sanitized server-side RPC `fetch_gallery_scenarios`.

// Explicit column list excludes moderation/internal fields (BF-11).
// Owner-only callers — RLS restricts the table to publisher+admin.
const PUBLISHED_SCENARIO_PUBLIC_COLUMNS = `
  id,
  scenario_id,
  publisher_id,
  allow_remix,
  tags,
  like_count,
  save_count,
  play_count,
  view_count,
  avg_rating,
  review_count,
  is_published,
  created_at,
  updated_at
`;

// Check if current user has published a scenario (owner-only path).
export async function getPublishedScenario(scenarioId: string): Promise<PublishedScenario | null> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select(PUBLISHED_SCENARIO_PUBLIC_COLUMNS)
    .eq('scenario_id', scenarioId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizePublishedScenario(data) : null;
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

  // Batch D — promote private cover into the public `covers` bucket so gallery
  // cards always have a resolvable public cover URL. Best-effort: a missing
  // private cover is non-fatal (story may have no cover at all).
  try {
    const { error: fnErr } = await supabase.functions.invoke('publish-cover', {
      body: { scenarioId, action: 'publish' },
    });
    if (fnErr) console.warn('[publishScenario] publish-cover invoke failed:', fnErr.message);
  } catch (mirrorErr) {
    console.warn('[publishScenario] publish-cover threw:', mirrorErr);
  }

  return normalizePublishedScenario(data);
}

// Unpublish a scenario
export async function unpublishScenario(scenarioId: string): Promise<void> {
  const { error } = await supabase
    .from('published_scenarios')
    .update({ is_published: false })
    .eq('scenario_id', scenarioId);
    
  if (error) throw error;

  // Batch D — remove the public cover mirror.
  try {
    await supabase.functions.invoke('publish-cover', {
      body: { scenarioId, action: 'unpublish' },
    });
  } catch (mirrorErr) {
    console.warn('[unpublishScenario] publish-cover cleanup failed:', mirrorErr);
  }
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

    // like_count is maintained by the sync_like_count trigger on scenario_likes.
    return false;
  } else {
    await supabase
      .from('scenario_likes')
      .insert({
        published_scenario_id: publishedScenarioId,
        user_id: userId
      });

    // like_count is maintained by the sync_like_count trigger on scenario_likes.
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

  // save_count is maintained by the sync_save_count trigger on saved_scenarios.
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

  // save_count is maintained by the sync_save_count trigger on saved_scenarios.
}

// Get user's saved scenarios via sanitized SECURITY DEFINER RPC (BF-11).
// Direct table reads on published_scenarios for non-owners are blocked by RLS;
// the RPC omits moderation/internal fields (reported_count etc.).
// The `userId` parameter is kept for the existing call sites but the RPC
// internally scopes to auth.uid().
export async function fetchSavedScenarios(_userId: string): Promise<SavedScenario[]> {
  const { data, error } = await supabase.rpc('get_saved_scenarios_for_user');

  if (error) throw error;
  if (!data || (data as any[]).length === 0) return [];

  const rows = data as any[];

  const publisherIds = [...new Set(
    rows
      .filter((r) => r.ps_publisher_id)
      .map((r) => r.ps_publisher_id as string)
  )];

  const { data: profiles } = await supabase
    .rpc('get_public_profiles', { p_user_ids: publisherIds });

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    published_scenario_id: r.published_scenario_id,
    source_scenario_id: r.source_scenario_id,
    created_at: r.created_at,
    published_scenario: r.ps_id
      ? normalizePublishedScenario({
          id: r.ps_id,
          scenario_id: r.ps_scenario_id,
          publisher_id: r.ps_publisher_id,
          allow_remix: r.ps_allow_remix,
          tags: r.ps_tags || [],
          like_count: r.ps_like_count ?? 0,
          save_count: r.ps_save_count ?? 0,
          play_count: r.ps_play_count ?? 0,
          view_count: r.ps_view_count ?? 0,
          avg_rating: r.ps_avg_rating ?? 0,
          review_count: r.ps_review_count ?? 0,
          is_published: r.ps_is_published,
          created_at: r.ps_created_at,
          updated_at: r.ps_updated_at,
          scenario: r.story_id
            ? {
                id: r.story_id,
                title: r.story_title,
                description: r.story_description,
                cover_image_url: r.story_cover_image_url,
                cover_image_position: r.story_cover_image_position,
                world_core: null,
              }
            : undefined,
          publisher: profileMap.get(r.ps_publisher_id) || undefined,
        })
      : undefined,
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

// Record a play (throttled to once per scenario per 5 minutes server-side).
// play_count is maintained by the sync_play_count trigger on scenario_plays.
export async function incrementPlayCount(publishedScenarioId: string): Promise<void> {
  await supabase.rpc('record_scenario_play', {
    p_published_scenario_id: publishedScenarioId
  });
}

// Record view with 24-hour deduplication
export async function recordView(publishedScenarioId: string): Promise<void> {
  await supabase.rpc('record_scenario_view', { 
    p_published_scenario_id: publishedScenarioId 
  });
}

// Legacy incrementViewCount - kept for backward compatibility
export async function incrementViewCount(publishedScenarioId: string): Promise<void> {
  await recordView(publishedScenarioId);
}

// Fetch gallery scenarios via server-side RPC (pagination, filtering, search)
export interface FetchGalleryParams {
  searchText?: string;
  searchTags?: string[];
  sortBy?: SortOption;
  limit?: number;
  offset?: number;
  storyTypes?: string[];
  genres?: string[];
  origins?: string[];
  triggerWarnings?: string[];
  customTags?: string[];
  publisherIds?: string[];
}

export async function fetchGalleryScenarios(params: FetchGalleryParams): Promise<PublishedScenario[]> {
  const sortMapping: Record<string, string> = {
    'all': 'recent',
    'recent': 'recent',
    'liked': 'liked',
    'saved': 'saved',
    'played': 'played',
    'following': 'recent',
  };

  const { data, error } = await supabase.rpc('fetch_gallery_scenarios', {
    p_search_text: params.searchText || undefined,
    p_search_tags: params.searchTags?.length ? params.searchTags : undefined,
    p_sort_by: sortMapping[params.sortBy || 'recent'] || 'recent',
    p_limit: params.limit || 20,
    p_offset: params.offset || 0,
    p_story_types: params.storyTypes?.length ? params.storyTypes : undefined,
    p_genres: params.genres?.length ? params.genres : undefined,
    p_origins: params.origins?.length ? params.origins : undefined,
    p_trigger_warnings: params.triggerWarnings?.length ? params.triggerWarnings : undefined,
    p_custom_tags: params.customTags?.length ? params.customTags : undefined,
    p_publisher_ids: params.publisherIds?.length ? params.publisherIds : undefined,
  });

  if (error) {
    console.error('Failed to fetch gallery scenarios:', error);
    return [];
  }

  // The RPC returns a JSON array directly
  const results = (data as any[]) || [];
  return results;
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

// Fetch published scenarios with full data for user's own scenarios.
// Owner-only; RLS restricts the table to publisher+admin (BF-11).
// Explicit column list excludes moderation/internal fields.
export async function fetchUserPublishedScenarios(
  userId: string
): Promise<Map<string, PublishedScenario>> {
  const { data, error } = await supabase
    .from('published_scenarios')
    .select(PUBLISHED_SCENARIO_PUBLIC_COLUMNS)
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
  concept_strength?: number | null;
  initial_situation?: number | null;
  role_clarity?: number | null;
  motivation_tension?: number | null;
  tone_promise?: number | null;
  low_friction_start?: number | null;
  worldbuilding_vibe?: number | null;
  replayability?: number | null;
  character_details_complexity?: number | null;
  spice_level?: number | null;
  comment: string | null;
  raw_weighted_score?: number | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  };
}

export interface ReviewSubmissionInput {
  storyRating?: number | null;
  spiceLevel?: number | null;
  detailedRatings?: Record<string, number>;
  comment?: string;
}

// Submit or update a review
export async function submitReview(
  publishedScenarioId: string,
  userId: string,
  input: ReviewSubmissionInput,
): Promise<void> {
  const storyRating = typeof input.storyRating === 'number' ? input.storyRating : null;
  const spiceLevel = typeof input.spiceLevel === 'number' ? input.spiceLevel : null;
  const detailedRatings = input.detailedRatings ?? {};

  if (storyRating === null && spiceLevel === null) {
    throw new Error('A story or spice rating is required.');
  }

  const { error } = await supabase
    .from('scenario_reviews')
    .upsert({
      published_scenario_id: publishedScenarioId,
      user_id: userId,
      concept_strength: detailedRatings.conceptStrength ?? null,
      initial_situation: detailedRatings.initialSituation ?? null,
      role_clarity: detailedRatings.roleClarity ?? null,
      motivation_tension: detailedRatings.motivationTension ?? null,
      tone_promise: detailedRatings.tonePromise ?? null,
      low_friction_start: detailedRatings.lowFrictionStart ?? null,
      worldbuilding_vibe: detailedRatings.worldbuildingVibe ?? null,
      replayability: detailedRatings.replayability ?? null,
      character_details_complexity: detailedRatings.characterDetailsComplexity ?? null,
      spice_level: spiceLevel,
      comment: input.comment?.trim() ? input.comment.trim() : null,
      raw_weighted_score: storyRating,
    } as any, { onConflict: 'published_scenario_id,user_id' });

if (error) throw error;
}

// Delete a review
export async function deleteReview(
  publishedScenarioId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('scenario_reviews')
    .delete()
    .eq('published_scenario_id', publishedScenarioId)
    .eq('user_id', userId);
  if (error) throw error;
}

// Fetch reviews for a scenario
export interface PublicScenarioReview {
  id: string;
  raw_weighted_score: number | null;
  spice_level: number | null;
  comment: string | null;
  created_at: string;
  reviewer: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function fetchScenarioReviews(
  publishedScenarioId: string,
  limit: number = 5,
  offset: number = 0
): Promise<PublicScenarioReview[]> {
  const { data, error } = await supabase.rpc('get_public_scenario_reviews', {
    p_published_scenario_id: publishedScenarioId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  if (!data || (data as any[]).length === 0) return [];

  return (data as any[]).map((r: any) => {
    const hasReviewer =
      r.reviewer_username !== null ||
      r.reviewer_display_name !== null ||
      r.reviewer_avatar_url !== null;
    return {
      id: r.id,
      raw_weighted_score: r.raw_weighted_score,
      spice_level: r.spice_level,
      comment: r.comment,
      created_at: r.created_at,
      reviewer: hasReviewer
        ? {
            username: r.reviewer_username ?? null,
            display_name: r.reviewer_display_name ?? null,
            avatar_url: r.reviewer_avatar_url ?? null,
          }
        : null,
    };
  });
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
  const { data, error } = await supabase.rpc('get_creator_overall_rating', {
    p_publisher_id: publisherId,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? (data[0] as any) : (data as any);
  if (!row) return null;

  const totalReviews = Number(row.total_reviews ?? 0);
  if (totalReviews === 0) return null;

  const avgRating = Number(row.rating ?? 0);
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
