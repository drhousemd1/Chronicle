
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Globe, LayoutGrid, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GalleryScenarioCard } from './GalleryStoryCard';
import { ScenarioDetailModal } from './StoryDetailModal';
import { GalleryCategorySidebar, CategoryFilters } from './GalleryCategorySidebar';
import { 
  PublishedScenario, 
  getUserInteractions,
  toggleLike,
  saveScenarioToCollection,
  unsaveScenario,
  unpublishScenario,
  incrementPlayCount,
  recordView,
  fetchGalleryScenarios,
  SortOption,
  FetchGalleryParams
} from '@/services/gallery-data';
import { useAuth } from '@/hooks/use-auth';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

interface GalleryHubProps {
  onPlay: (scenarioId: string, publishedScenarioId: string) => void;
  onSaveChange?: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onAuthRequired?: () => void;
  showNsfw?: boolean;
  onRequestShowNsfw?: (onApproved?: () => void) => void;
}

const PAGE_SIZE = 20;

const defaultFilters: CategoryFilters = {
  storyTypes: [],
  genres: [],
  origins: [],
  triggerWarnings: [],
  customTags: [],
};

export const GalleryHub = React.forwardRef<HTMLDivElement, GalleryHubProps>(({
  onPlay,
  onSaveChange,
  sortBy,
  onSortChange,
  onAuthRequired,
  showNsfw = false,
  onRequestShowNsfw,
}, ref) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>(defaultFilters);
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPublished, setSelectedPublished] = useState<PublishedScenario | null>(null);

  // Infinite scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch followed creator IDs (for Following tab)
  const { data: followedCreatorIds } = useQuery({
    queryKey: ['followed-creators', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('creator_follows')
        .select('creator_id')
        .eq('follower_id', user.id);
      return (data || []).map(f => f.creator_id);
    },
    enabled: !!user && sortBy === 'following',
    staleTime: 60_000,
  });

  useEffect(() => {
    if (showNsfw || !categoryFilters.storyTypes.includes('NSFW')) return;

    setCategoryFilters((prev) => ({
      ...prev,
      storyTypes: prev.storyTypes.filter((type) => type !== 'NSFW'),
    }));
  }, [showNsfw, categoryFilters.storyTypes]);

  const effectiveStoryTypes = useMemo(() => {
    const storyTypes = showNsfw
      ? categoryFilters.storyTypes
      : categoryFilters.storyTypes.filter((type) => type !== 'NSFW');

    return storyTypes.length > 0 ? storyTypes : undefined;
  }, [showNsfw, categoryFilters.storyTypes]);

  // Build query params
  const queryParams = useMemo((): Omit<FetchGalleryParams, 'limit' | 'offset'> => ({
    searchText: searchText || undefined,
    searchTags: searchTags.length > 0 ? searchTags : undefined,
    sortBy,
    storyTypes: effectiveStoryTypes,
    genres: categoryFilters.genres.length > 0 ? categoryFilters.genres : undefined,
    origins: categoryFilters.origins.length > 0 ? categoryFilters.origins : undefined,
    triggerWarnings: categoryFilters.triggerWarnings.length > 0 ? categoryFilters.triggerWarnings : undefined,
    customTags: categoryFilters.customTags.length > 0 ? categoryFilters.customTags : undefined,
    publisherIds: sortBy === 'following' ? (followedCreatorIds || []) : undefined,
  }), [searchText, searchTags, sortBy, effectiveStoryTypes, categoryFilters.genres, categoryFilters.origins, categoryFilters.triggerWarnings, categoryFilters.customTags, followedCreatorIds]);

  // Main infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['gallery-scenarios', queryParams],
    queryFn: async ({ pageParam = 0 }) => {
      const results = await fetchGalleryScenarios({
        ...queryParams,
        limit: PAGE_SIZE,
        offset: pageParam,
      });
      return results;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
    initialPageParam: 0,
    staleTime: 30_000,
    enabled: sortBy !== 'following' || (followedCreatorIds !== undefined),
  });

  // Flatten pages into single array
  const scenarios = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const visibleScenarios = useMemo(() => {
    // Keep NSFW stories in the gallery flow even when hidden so the grid density
    // stays stable; the card itself is responsible for masking explicit cover art.
    return scenarios;
  }, [scenarios]);

  // Fetch user interactions (likes/saves) for visible scenarios
  const scenarioIds = useMemo(() => visibleScenarios.map(s => s.id), [visibleScenarios]);
  
  const { data: interactions } = useQuery({
    queryKey: ['gallery-interactions', user?.id, scenarioIds],
    queryFn: async () => {
      if (!user || scenarioIds.length === 0) return { likes: new Set<string>(), saves: new Set<string>() };
      return getUserInteractions(scenarioIds, user.id);
    },
    enabled: !!user && scenarioIds.length > 0,
    staleTime: 30_000,
  });

  const likes = interactions?.likes || new Set<string>();
  const saves = interactions?.saves || new Set<string>();

  // Infinite scroll: IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Realtime subscription for published_scenarios
  useEffect(() => {
    const channel = supabase
      .channel('gallery-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'published_scenarios' },
        () => {
          // New story published - invalidate to refetch
          queryClient.invalidateQueries({ queryKey: ['gallery-scenarios'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'published_scenarios' },
        (payload) => {
          const updated = payload.new as any;
          // If unpublished or hidden, remove from cache
          if (!updated.is_published || updated.is_hidden) {
            queryClient.setQueryData(['gallery-scenarios', queryParams], (old: any) => {
              if (!old?.pages) return old;
              return {
                ...old,
                pages: old.pages.map((page: PublishedScenario[]) =>
                  page.filter(s => s.id !== updated.id)
                ),
              };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'published_scenarios' },
        (payload) => {
          const deleted = payload.old as any;
          queryClient.setQueryData(['gallery-scenarios', queryParams], (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: PublishedScenario[]) =>
                page.filter(s => s.id !== deleted.id)
              ),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryParams]);

  const applySearchQuery = useCallback((value: string) => {
    // Extract hashtags as tags, rest as search text
    const parts = value.split(/\s+/);
    const tags: string[] = [];
    const textParts: string[] = [];
    
    for (const part of parts) {
      if (part.startsWith('#') && part.length > 1) {
        tags.push(part.slice(1).toLowerCase());
      } else if (part.trim()) {
        textParts.push(part);
      }
    }
    
    setSearchTags(tags);
    setSearchText(textParts.join(' '));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      applySearchQuery(searchQuery);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [applySearchQuery, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySearchQuery(searchQuery);
    }
  };

  // Helper to update scenario data in the React Query cache
  const updateScenarioInCache = useCallback((id: string, updater: (s: PublishedScenario) => PublishedScenario) => {
    queryClient.setQueryData(['gallery-scenarios', queryParams], (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: PublishedScenario[]) =>
          page.map(s => s.id === id ? updater(s) : s)
        ),
      };
    });
  }, [queryClient, queryParams]);

  const handleLike = async (published: PublishedScenario) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    try {
      const nowLiked = await toggleLike(published.id, user.id);
      // Invalidate interactions to refresh likes/saves
      queryClient.invalidateQueries({ queryKey: ['gallery-interactions'] });
      // Update local count optimistically
      updateScenarioInCache(published.id, s => ({
        ...s,
        like_count: s.like_count + (nowLiked ? 1 : -1),
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSave = async (published: PublishedScenario) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    const isSaved = saves.has(published.id);

    try {
      if (isSaved) {
        await unsaveScenario(published.id, user.id);
        updateScenarioInCache(published.id, s => ({
          ...s,
          save_count: Math.max(0, s.save_count - 1),
        }));
      } else {
        await saveScenarioToCollection(published.id, published.scenario_id, user.id);
        updateScenarioInCache(published.id, s => ({
          ...s,
          save_count: s.save_count + 1,
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: ['gallery-interactions'] });
      onSaveChange?.();
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const playScenario = useCallback((published: PublishedScenario) => {
    incrementPlayCount(published.id).catch(console.error);
    onPlay(published.scenario_id, published.id);
  }, [onPlay]);

  const openScenarioDetails = useCallback((published: PublishedScenario) => {
    setSelectedPublished(published);
    setDetailModalOpen(true);
    // Record view with 24-hour deduplication
    if (user) {
      recordView(published.id).catch(console.error);
      updateScenarioInCache(published.id, s => ({
        ...s,
        view_count: s.view_count + 1,
      }));
    }
  }, [user, updateScenarioInCache]);

  const handlePlay = async (published: PublishedScenario) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (!showNsfw && published.contentThemes?.storyType === 'NSFW') {
      onRequestShowNsfw?.(() => {
        playScenario(published);
      });
      return;
    }

    playScenario(published);
  };

  const handleViewDetails = (published: PublishedScenario) => {
    if (!showNsfw && published.contentThemes?.storyType === 'NSFW') {
      onRequestShowNsfw?.(() => {
        openScenarioDetails(published);
      });
      return;
    }

    openScenarioDetails(published);
  };

  const handleUnpublish = async () => {
    if (!selectedPublished || !user) return;
    try {
      await unpublishScenario(selectedPublished.scenario_id);
      queryClient.invalidateQueries({ queryKey: ['gallery-scenarios'] });
      setDetailModalOpen(false);
    } catch (e) {
      console.error('Failed to unpublish:', e);
    }
  };

  // Count active filters
  const activeFilterCount = 
    categoryFilters.storyTypes.length +
    categoryFilters.genres.length +
    categoryFilters.origins.length +
    categoryFilters.triggerWarnings.length +
    categoryFilters.customTags.length;

  // Get live data for detail modal
  const liveSelectedData = useMemo(() => {
    if (!selectedPublished) return null;
    return scenarios.find(s => s.id === selectedPublished.id) || selectedPublished;
  }, [selectedPublished, scenarios]);

  return (
    <div ref={ref} className="w-full h-full flex flex-col bg-[#121214]">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarOpen && (
          <aside
            id="gallery-category-panel"
            className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-white/[0.08] bg-[#2a2a2f] shadow-[0_18px_42px_-24px_rgba(0,0,0,0.68),inset_1px_0_0_rgba(255,255,255,0.04),inset_-1px_0_0_rgba(0,0,0,0.26)]"
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-expanded={sidebarOpen}
              aria-controls="gallery-category-panel"
              className="relative flex h-[73px] w-full items-center gap-3 border-b border-white/[0.08] bg-[#3c3e47] px-6 text-left text-sm font-bold leading-none text-white shadow-[0_10px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(0,0,0,0.18)] transition-colors hover:bg-[#44464f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/60"
            >
              <LayoutGrid className="relative z-[1] h-4 w-4 flex-shrink-0" />
              <span className="relative z-[1] flex-1">Browse Categories</span>
              {activeFilterCount > 0 && (
                <span className="relative z-[1] inline-flex min-w-6 items-center justify-center rounded-full bg-black/20 px-2 py-1 text-[10px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="relative z-[1] h-4 w-4 flex-shrink-0 rotate-180" />
            </button>

            <GalleryCategorySidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              showNsfw={showNsfw}
              selectedFilters={categoryFilters}
              onFilterChange={setCategoryFilters}
            />
          </aside>
        )}

        <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
          <header
            className="sticky top-0 z-50 px-6 py-4"
            style={{
              backgroundColor: 'rgba(18, 18, 20, 0.8)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-start gap-4">
              {!sidebarOpen && (
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-expanded={sidebarOpen}
                    aria-controls="gallery-category-panel"
                    className="relative flex h-14 items-center gap-3 overflow-hidden rounded-[20px] border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-4 pr-5 text-left text-sm font-bold leading-none text-white shadow-[0_10px_24px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.22)] transition-all hover:brightness-105 active:scale-[0.99] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/60"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent" />
                    <LayoutGrid className="relative z-[1] h-4 w-4 flex-shrink-0" />
                    <span className="relative z-[1] flex-1">Browse Categories</span>
                    {activeFilterCount > 0 && (
                      <span className="relative z-[1] inline-flex min-w-6 items-center justify-center rounded-full bg-black/20 px-2 py-1 text-[10px] font-black text-white">
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown className="relative z-[1] h-4 w-4 flex-shrink-0" />
                  </button>
                </div>
              )}

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 z-[1] h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                <input
                  id="gallery-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search titles, descriptions, or #tags"
                  className="h-12 w-full rounded-full border border-black/40 bg-[#1c1c1f] pl-12 pr-14 text-sm font-medium text-white placeholder:font-medium placeholder:text-zinc-500 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45),0_10px_24px_rgba(0,0,0,0.18)] focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchText('');
                      setSearchTags([]);
                    }}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 z-[1] inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#3c3e47] text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div
              className="mt-4 h-px opacity-60"
              style={{
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(110,137,173,0.55) 18%, rgba(110,137,173,0.8) 50%, rgba(110,137,173,0.55) 82%, transparent 100%)',
              }}
            />
          </header>

          {/* Main content area */}
          <main className="min-h-0 flex-1 overflow-y-auto">
          {/* Active Filters */}
          <div className={cn("pb-4 pt-4", sidebarOpen ? "px-6" : "px-6")}>
            {(searchTags.length > 0 || searchText || activeFilterCount > 0) && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm text-white/70">Filtering by:</span>
                {searchText && (
                  <span className="px-2 py-1 bg-ghost-white text-white rounded-full text-xs font-medium flex items-center gap-1">
                    "{searchText}"
                    <button
                      onClick={() => { setSearchText(''); setSearchQuery(searchTags.map(t => `#${t}`).join(' ')); }}
                      className="hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchTags.map(tag => (
                  <span
                    key={`search-${tag}`}
                    className="px-2 py-1 bg-ghost-white text-white rounded-full text-xs font-medium flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => setSearchTags(prev => prev.filter(t => t !== tag))}
                      className="hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {categoryFilters.storyTypes.map(item => (
                  <span key={`type-${item}`} className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded-full text-xs font-medium flex items-center gap-1">
                    {item}
                    <button onClick={() => setCategoryFilters(prev => ({ ...prev, storyTypes: prev.storyTypes.filter(t => t !== item) }))} className="hover:text-red-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {categoryFilters.genres.map(item => (
                  <span key={`genre-${item}`} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center gap-1">
                    {item}
                    <button onClick={() => setCategoryFilters(prev => ({ ...prev, genres: prev.genres.filter(t => t !== item) }))} className="hover:text-red-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {categoryFilters.origins.map(item => (
                  <span key={`origin-${item}`} className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                    {item}
                    <button onClick={() => setCategoryFilters(prev => ({ ...prev, origins: prev.origins.filter(t => t !== item) }))} className="hover:text-red-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {categoryFilters.triggerWarnings.map(item => (
                  <span key={`warning-${item}`} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium flex items-center gap-1">
                    {item}
                    <button onClick={() => setCategoryFilters(prev => ({ ...prev, triggerWarnings: prev.triggerWarnings.filter(t => t !== item) }))} className="hover:text-red-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => { 
                    setSearchTags([]); 
                    setSearchText('');
                    setSearchQuery(''); 
                    setCategoryFilters(defaultFilters);
                  }}
                  className="text-sm text-white/70 hover:text-white underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Gallery Grid */}
          <div className="px-6 pb-10">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={`gallery-skeleton-${i}`}
                    className="h-[430px] rounded-[28px] border border-[rgba(86,118,164,0.85)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(24,25,33,0.95)_100%)]"
                  />
                ))}
              </div>
            ) : visibleScenarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 bg-ghost-white rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {sortBy === 'following' ? 'No stories from followed creators' : 'No stories found'}
                </h3>
                <p className="text-[rgba(248,250,252,0.7)] max-w-md">
                  {sortBy === 'following'
                    ? "Follow creators to see their stories here."
                    : searchTags.length > 0 || searchText || activeFilterCount > 0
                    ? "Try different filters or clear your search to see all stories."
                    : "Be the first to publish a story to the gallery!"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
                  {visibleScenarios.map((published) => (
                    <GalleryScenarioCard
                      key={published.id}
                      published={published}
                      maskNsfwCover={!showNsfw && published.contentThemes?.storyType === 'NSFW'}
                      isLiked={likes.has(published.id)}
                      isSaved={saves.has(published.id)}
                      onLike={() => handleLike(published)}
                      onSave={() => handleSave(published)}
                      onPlay={() => handlePlay(published)}
                      onViewDetails={() => handleViewDetails(published)}
                    />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="flex items-center justify-center py-8">
                  {isFetchingNextPage && (
                    <p className="text-white/50 text-sm">Loading more stories…</p>
                  )}
                  {!hasNextPage && visibleScenarios.length > 0 && (
                    <p className="text-white/30 text-sm">You've reached the end</p>
                  )}
                </div>
              </>
            )}
          </div>
          </main>
        </div>
      </div>

      {/* Detail Modal */}
      {liveSelectedData && (
        <TooltipProvider>
          <ScenarioDetailModal
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            scenarioId={liveSelectedData.scenario_id}
            title={liveSelectedData.scenario?.title || "Untitled"}
            description={liveSelectedData.scenario?.description || ""}
            coverImage={liveSelectedData.scenario?.cover_image_url || ""}
            coverImagePosition={liveSelectedData.scenario?.cover_image_position || { x: 50, y: 50 }}
            tags={liveSelectedData.tags}
            contentThemes={liveSelectedData.contentThemes}
            likeCount={liveSelectedData.like_count}
            saveCount={liveSelectedData.save_count}
            playCount={liveSelectedData.play_count}
            viewCount={liveSelectedData.view_count}
            avgRating={liveSelectedData.avg_rating}
            reviewCount={liveSelectedData.review_count}
            publisher={liveSelectedData.publisher}
            publisherId={liveSelectedData.publisher_id}
            publishedScenarioId={liveSelectedData.id}
            publishedAt={liveSelectedData.created_at}
            isLiked={likes.has(liveSelectedData.id)}
            isSaved={saves.has(liveSelectedData.id)}
            allowRemix={liveSelectedData.allow_remix}
            onLike={() => handleLike(liveSelectedData)}
            onSave={() => handleSave(liveSelectedData)}
            onPlay={() => handlePlay(liveSelectedData)}
            isPublished={true}
            canUnpublish={user?.id === liveSelectedData.publisher_id}
            onUnpublish={user?.id === liveSelectedData.publisher_id ? handleUnpublish : undefined}
          />
        </TooltipProvider>
      )}
    </div>
  );
});

GalleryHub.displayName = "GalleryHub";
