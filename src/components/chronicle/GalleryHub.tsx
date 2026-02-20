
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, Globe, LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GalleryScenarioCard } from './GalleryScenarioCard';
import { ScenarioDetailModal } from './ScenarioDetailModal';
import { GalleryCategorySidebar, CategoryFilters } from './GalleryCategorySidebar';
import { 
  PublishedScenario, 
  fetchPublishedScenarios, 
  getUserInteractions,
  toggleLike,
  saveScenarioToCollection,
  unsaveScenario,
  unpublishScenario,
  incrementPlayCount,
  incrementViewCount,
  SortOption,
  ContentThemeFilters
} from '@/services/gallery-data';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

interface GalleryHubProps {
  onPlay: (scenarioId: string, publishedScenarioId: string) => void;
  onSaveChange?: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const defaultFilters: CategoryFilters = {
  storyTypes: [],
  genres: [],
  origins: [],
  triggerWarnings: [],
  customTags: [],
};

export const GalleryHub: React.FC<GalleryHubProps> = ({ onPlay, onSaveChange, sortBy, onSortChange }) => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<PublishedScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState<Set<string>>(new Set());
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>(defaultFilters);
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPublished, setSelectedPublished] = useState<PublishedScenario | null>(null);

  // Convert CategoryFilters to ContentThemeFilters for the service
  const getContentThemeFilters = useCallback((): ContentThemeFilters | undefined => {
    const hasFilters = 
      categoryFilters.storyTypes.length > 0 ||
      categoryFilters.genres.length > 0 ||
      categoryFilters.origins.length > 0 ||
      categoryFilters.triggerWarnings.length > 0 ||
      categoryFilters.customTags.length > 0;

    if (!hasFilters) return undefined;

    return {
      storyTypes: categoryFilters.storyTypes.length > 0 ? categoryFilters.storyTypes : undefined,
      genres: categoryFilters.genres.length > 0 ? categoryFilters.genres : undefined,
      origins: categoryFilters.origins.length > 0 ? categoryFilters.origins : undefined,
      triggerWarnings: categoryFilters.triggerWarnings.length > 0 ? categoryFilters.triggerWarnings : undefined,
      customTags: categoryFilters.customTags.length > 0 ? categoryFilters.customTags : undefined,
    };
  }, [categoryFilters]);

  const fetchInProgress = useRef(false);

  const loadScenarios = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setIsLoading(true);
    try {
      // Handle "following" tab separately
      if (sortBy === 'following') {
        if (!user) {
          setScenarios([]);
          setIsLoading(false);
          return;
        }
        // Get followed creator IDs
        const { data: follows } = await supabase.from('creator_follows').select('creator_id').eq('follower_id', user.id);
        const creatorIds = (follows || []).map(f => f.creator_id);
        if (creatorIds.length === 0) {
          setScenarios([]);
          setIsLoading(false);
          return;
        }
        // Fetch published scenarios from followed creators (server-side filter)
        const contentFilters = getContentThemeFilters();
        const data = await fetchPublishedScenarios(
          searchTags.length > 0 ? searchTags : undefined,
          'recent', 50, 0, contentFilters, creatorIds
        );
        setScenarios(data);
        if (data.length > 0) {
          const ids = data.map(s => s.id);
          const interactions = await getUserInteractions(ids, user.id);
          setLikes(interactions.likes);
          setSaves(interactions.saves);
        }
        setIsLoading(false);
        return;
      }

      const contentFilters = getContentThemeFilters();
      const data = await fetchPublishedScenarios(
        searchTags.length > 0 ? searchTags : undefined,
        sortBy,
        50,
        0,
        contentFilters
      );
      setScenarios(data);

      // Load user interactions
      if (user && data.length > 0) {
        const ids = data.map(s => s.id);
        const interactions = await getUserInteractions(ids, user.id);
        setLikes(interactions.likes);
        setSaves(interactions.saves);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
      toast.error('Failed to load gallery');
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [user?.id, searchTags, sortBy, getContentThemeFilters]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const handleSearch = () => {
    const tags = searchQuery
      .split(/[,;\s]+/)
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(t => t.length > 0);
    setSearchTags(tags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLike = async (published: PublishedScenario) => {
    if (!user) {
      toast.error('Please sign in to like stories');
      return;
    }

    try {
      const nowLiked = await toggleLike(published.id, user.id);
      setLikes(prev => {
        const next = new Set(prev);
        if (nowLiked) {
          next.add(published.id);
        } else {
          next.delete(published.id);
        }
        return next;
      });
      // Update local count
      setScenarios(prev => prev.map(s => 
        s.id === published.id 
          ? { ...s, like_count: s.like_count + (nowLiked ? 1 : -1) }
          : s
      ));
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleSave = async (published: PublishedScenario) => {
    if (!user) {
      toast.error('Please sign in to save stories');
      return;
    }

    const isSaved = saves.has(published.id);

    try {
      if (isSaved) {
        await unsaveScenario(published.id, user.id);
        setSaves(prev => {
          const next = new Set(prev);
          next.delete(published.id);
          return next;
        });
        setScenarios(prev => prev.map(s => 
          s.id === published.id 
            ? { ...s, save_count: Math.max(0, s.save_count - 1) }
            : s
        ));
        toast.success('Removed from your collection');
      } else {
        await saveScenarioToCollection(published.id, published.scenario_id, user.id);
        setSaves(prev => {
          const next = new Set(prev);
          next.add(published.id);
          return next;
        });
        setScenarios(prev => prev.map(s => 
          s.id === published.id 
            ? { ...s, save_count: s.save_count + 1 }
            : s
        ));
        toast.success('Saved to your stories!');
      }
      
      // Notify parent that saves changed
      onSaveChange?.();
    } catch (error) {
      console.error('Failed to toggle save:', error);
      toast.error('Failed to update save');
    }
  };

  const handlePlay = async (published: PublishedScenario) => {
    // Increment play count in background
    incrementPlayCount(published.id).catch(console.error);
    onPlay(published.scenario_id, published.id);
  };

  const handleViewDetails = (published: PublishedScenario) => {
    setSelectedPublished(published);
    setDetailModalOpen(true);
    // Increment view count in background
    incrementViewCount(published.id).catch(console.error);
    // Update local count optimistically
    setScenarios(prev => prev.map(s => 
      s.id === published.id 
        ? { ...s, view_count: s.view_count + 1 }
        : s
    ));
  };

  const handleUnpublish = async () => {
    if (!selectedPublished || !user) return;
    try {
      await unpublishScenario(selectedPublished.scenario_id);
      // Remove from local list
      setScenarios(prev => prev.filter(s => s.id !== selectedPublished.id));
      setDetailModalOpen(false);
      toast.success('Your story has been removed from the Gallery');
    } catch (e) {
      console.error('Failed to unpublish:', e);
      toast.error('Failed to remove from gallery');
    }
  };

  // Count active filters
  const activeFilterCount = 
    categoryFilters.storyTypes.length +
    categoryFilters.genres.length +
    categoryFilters.origins.length +
    categoryFilters.triggerWarnings.length +
    categoryFilters.customTags.length;

  return (
    <div className="w-full h-full flex flex-col bg-[#121214]">
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
            placeholder=""
            className="w-full pl-12 pr-24 py-3 bg-[#3a3a3f]/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent"
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
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
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
            {/* Active filters display */}
            {(searchTags.length > 0 || activeFilterCount > 0) && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm text-white/70">Filtering by:</span>
                {searchTags.map(tag => (
                  <span
                    key={`search-${tag}`}
                    className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      onClick={() => setSearchTags(prev => prev.filter(t => t !== tag))}
                      className="hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {categoryFilters.storyTypes.map(item => (
                  <span key={`type-${item}`} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
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
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : scenarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {sortBy === 'following' ? 'No stories from followed creators' : 'No stories found'}
                </h3>
                <p className="text-white/60 max-w-md">
                  {sortBy === 'following'
                    ? "Follow creators to see their stories here."
                    : searchTags.length > 0 || activeFilterCount > 0
                    ? "Try different filters or clear your search to see all stories."
                    : "Be the first to publish a story to the gallery!"}
                </p>
              </div>
            ) : (
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
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selectedPublished && (() => {
        // Use live data from scenarios state so counts update immediately
        const liveData = scenarios.find(s => s.id === selectedPublished.id) || selectedPublished;
        return (
          <TooltipProvider>
            <ScenarioDetailModal
              open={detailModalOpen}
              onOpenChange={setDetailModalOpen}
              scenarioId={liveData.scenario_id}
              title={liveData.scenario?.title || "Untitled"}
              description={liveData.scenario?.description || ""}
              coverImage={liveData.scenario?.cover_image_url || ""}
              coverImagePosition={liveData.scenario?.cover_image_position || { x: 50, y: 50 }}
              tags={liveData.tags}
              contentThemes={liveData.contentThemes}
              likeCount={liveData.like_count}
              saveCount={liveData.save_count}
              playCount={liveData.play_count}
              viewCount={liveData.view_count}
              publisher={liveData.publisher}
              publisherId={liveData.publisher_id}
              publishedScenarioId={liveData.id}
              publishedAt={liveData.created_at}
              isLiked={likes.has(liveData.id)}
              isSaved={saves.has(liveData.id)}
              allowRemix={liveData.allow_remix}
              onLike={() => handleLike(liveData)}
              onSave={() => handleSave(liveData)}
              onPlay={() => handlePlay(liveData)}
              isPublished={true}
              canUnpublish={user?.id === liveData.publisher_id}
              onUnpublish={user?.id === liveData.publisher_id ? handleUnpublish : undefined}
            />
          </TooltipProvider>
        );
      })()}
    </div>
  );
};
