
import { supabase } from '@/integrations/supabase/client';

// Types for gallery data
export interface PublishedScenario {
  id: string;
  scenario_id: string;
  publisher_id: string;
  allow_remix: boolean;
  tags: string[];
  like_count: number;
  save_count: number;
  play_count: number;
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
  };
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

// Fetch all published scenarios with optional tag filter
export type SortOption = 'all' | 'recent' | 'liked' | 'saved' | 'played';

export async function fetchPublishedScenarios(
  searchTags?: string[],
  sortBy: SortOption = 'all',
  limit = 50,
  offset = 0
): Promise<PublishedScenario[]> {
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
  if (error) throw error;
  
  if (!data || data.length === 0) return [];
  
  // Fetch publisher profiles separately
  const publisherIds = [...new Set(data.map((item: any) => item.publisher_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', publisherIds);
  
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  
  // Transform the data to match our interface
  return data.map((item: any) => ({
    id: item.id,
    scenario_id: item.scenario_id,
    publisher_id: item.publisher_id,
    allow_remix: item.allow_remix,
    tags: item.tags,
    like_count: item.like_count,
    save_count: item.save_count,
    play_count: item.play_count,
    is_published: item.is_published,
    created_at: item.created_at,
    updated_at: item.updated_at,
    scenario: item.scenarios,
    publisher: profileMap.get(item.publisher_id) || null
  }));
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
    .select('id, username, avatar_url')
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
