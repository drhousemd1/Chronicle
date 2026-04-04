
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Globe, LayoutGrid, X } from 'lucide-react';
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

  // Build query params
  const queryParams = useMemo((): Omit<FetchGalleryParams, 'limit' | 'offset'> => ({
    searchText: searchText || undefined,
    searchTags: searchTags.length > 0 ? searchTags : undefined,
    sortBy,
    storyTypes: categoryFilters.storyTypes.length > 0 ? categoryFilters.storyTypes : undefined,
    genres: categoryFilters.genres.length > 0 ? categoryFilters.genres : undefined,
    origins: categoryFilters.origins.length > 0 ? categoryFilters.origins : undefined,
    triggerWarnings: categoryFilters.triggerWarnings.length > 0 ? categoryFilters.triggerWarnings : undefined,
    customTags: categoryFilters.customTags.length > 0 ? categoryFilters.customTags : undefined,
    publisherIds: sortBy === 'following' ? (followedCreatorIds || []) : undefined,
  }), [searchText, searchTags, sortBy, categoryFilters, followedCreatorIds]);

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

  // Fetch user interactions (likes/saves) for visible scenarios
  const scenarioIds = useMemo(() => scenarios.map(s => s.id), [scenarios]);
  
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

  const handleSearch = () => {
    // Extract hashtags as tags, rest as search text
    const parts = searchQuery.split(/\s+/);
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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

  const handlePlay = async (published: PublishedScenario) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }
    incrementPlayCount(published.id).catch(console.error);
    onPlay(published.scenario_id, published.id);
  };

  const handleViewDetails = (published: PublishedScenario) => {
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
      {/* Glassmorphic Header */}
      <header 
        className="sticky top-0 z-50 px-6 py-4 flex items-center gap-4"
        style={{
          backgroundColor: 'rgba(18, 18, 20, 0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search titles, descriptions, or #tags..."
            className="w-full pl-12 pr-24 py-3 bg-[#3a3a3f]/50 border border-ghost-white rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#4a5f7f] text-white rounded-lg font-semibold text-sm hover:bg-[#5a6f8f] transition-colors"
          >
            Search
          </button>
        </div>
        
        {/* Browse Categories button */}
         <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex-shrink-0",
            sidebarOpen 
              ? "bg-[#5a6f8f] text-white" 
              : "bg-[#4a5f7f] text-white hover:bg-[#5a6f8f]"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Browse Categories</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-ghost-white rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      {/* Sticky blue gradient divider */}
      <div 
        className="sticky top-[60px] z-40 h-px opacity-50"
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent 0%, rgb(59, 130, 246) 50%, transparent 100%)',
        }}
      />

      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <GalleryCategorySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedFilters={categoryFilters}
          onFilterChange={setCategoryFilters}
        />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {/* Active Filters */}
          <div className="px-8 pt-6 pb-4">
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
          <div className="px-8 pb-10">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={`gallery-skeleton-${i}`}
                    className="h-[430px] rounded-[28px] border border-[rgba(86,118,164,0.85)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(24,25,33,0.95)_100%)]"
                  />
                ))}
              </div>
            ) : scenarios.length === 0 ? (
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
                  {scenarios.map((published) => (
                    <GalleryScenarioCard
                      key={published.id}
                      published={published}
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
                  {!hasNextPage && scenarios.length > 0 && (
                    <p className="text-white/30 text-sm">You've reached the end</p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
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
