import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2, Globe, LayoutGrid, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GalleryScenarioCard } from './GalleryScenarioCard';
import { ScenarioDetailModal } from './ScenarioDetailModal';
import { GalleryCategorySidebar, CategoryFilter } from './GalleryCategorySidebar';
import { 
  PublishedScenario, 
  fetchPublishedScenarios, 
  getUserInteractions,
  toggleLike,
  saveScenarioToCollection,
  unsaveScenario,
  incrementPlayCount,
  incrementViewCount,
  unpublishScenario,
  SortOption
} from '@/services/gallery-data';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

interface GalleryHubProps {
  onPlay: (scenarioId: string, publishedScenarioId: string) => void;
  onSaveChange?: () => void;
}

const defaultFilters: CategoryFilter = {
  storyType: [],
  genres: [],
  origin: [],
  triggerWarnings: [],
  customTags: []
};

export const GalleryHub: React.FC<GalleryHubProps> = ({ onPlay, onSaveChange }) => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<PublishedScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('all');
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState<Set<string>>(new Set());
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter>(defaultFilters);
  const [popularCustomTags, setPopularCustomTags] = useState<string[]>([]);
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPublished, setSelectedPublished] = useState<PublishedScenario | null>(null);

  const loadScenarios = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPublishedScenarios(
        searchTags.length > 0 ? searchTags : undefined,
        sortBy
      );
      setScenarios(data);
      
      // Extract popular custom tags from fetched data
      const tagCounts = new Map<string, number>();
      data.forEach(s => {
        (s.contentThemes?.customTags || []).forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      const sortedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag]) => tag);
      setPopularCustomTags(sortedTags);

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
    }
  }, [user, searchTags, sortBy]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Client-side filtering based on category filters
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const themes = s.contentThemes;
      
      // Story type filter
      if (categoryFilters.storyType.length > 0) {
        if (!themes?.storyType || !categoryFilters.storyType.includes(themes.storyType)) {
          return false;
        }
      }
      
      // Genres filter
      if (categoryFilters.genres.length > 0) {
        const scenarioGenres = themes?.genres || [];
        if (!categoryFilters.genres.some(g => scenarioGenres.includes(g))) {
          return false;
        }
      }
      
      // Origin filter
      if (categoryFilters.origin.length > 0) {
        const scenarioOrigin = themes?.origin || [];
        if (!categoryFilters.origin.some(o => scenarioOrigin.includes(o))) {
          return false;
        }
      }
      
      // Trigger warnings filter
      if (categoryFilters.triggerWarnings.length > 0) {
        const scenarioTW = themes?.triggerWarnings || [];
        if (!categoryFilters.triggerWarnings.some(tw => scenarioTW.includes(tw))) {
          return false;
        }
      }
      
      // Custom tags filter
      if (categoryFilters.customTags.length > 0) {
        const scenarioTags = themes?.customTags || [];
        if (!categoryFilters.customTags.some(t => scenarioTags.includes(t))) {
          return false;
        }
      }
      
      return true;
    });
  }, [scenarios, categoryFilters]);

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
      
      onSaveChange?.();
    } catch (error) {
      console.error('Failed to toggle save:', error);
      toast.error('Failed to update save');
    }
  };

  const handlePlay = async (published: PublishedScenario) => {
    incrementPlayCount(published.id).catch(console.error);
    onPlay(published.scenario_id, published.id);
  };

  const handleViewDetails = (published: PublishedScenario) => {
    setSelectedPublished(published);
    setDetailModalOpen(true);
    incrementViewCount(published.id).catch(console.error);
    setScenarios(prev => prev.map(s => 
      s.id === published.id 
        ? { ...s, view_count: s.view_count + 1 }
        : s
    ));
  };

  const handleUnpublishSelected = async () => {
    if (!selectedPublished) return;
    try {
      await unpublishScenario(selectedPublished.scenario_id);
      setScenarios(prev => prev.filter(s => s.id !== selectedPublished.id));
      setDetailModalOpen(false);
      setSelectedPublished(null);
      toast.success('Removed from gallery');
    } catch (error) {
      console.error('Failed to unpublish:', error);
      toast.error('Failed to remove from gallery');
    }
  };

  const isOwnedByViewer = selectedPublished && user && selectedPublished.publisher_id === user.id;

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'all', label: 'All Stories' },
    { key: 'recent', label: 'Most Recent' },
    { key: 'liked', label: 'Most Liked' },
    { key: 'saved', label: 'Most Saved' },
    { key: 'played', label: 'Most Played' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#121214]">
      {/* Glass Nav Header */}
      <div className="sticky top-0 z-20 bg-[rgba(18,18,20,0.8)] backdrop-blur-[12px] border-b border-white/5">
        <div className="px-6 py-4 flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search stories..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent transition-all"
            />
          </div>
          
          {/* Browse Categories Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors",
              sidebarOpen 
                ? "bg-[#5a6f8f] text-white" 
                : "bg-[#4a5f7f] text-white hover:bg-[#5a6f8f]"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Browse Categories
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <GalleryCategorySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          filters={categoryFilters}
          onFilterChange={setCategoryFilters}
          popularCustomTags={popularCustomTags}
        />

        {/* Gallery Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Sort Options */}
          <div className="px-8 pt-6">
            <div className="flex items-center justify-center gap-8">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key)}
                  className={cn(
                    "pb-2 text-sm font-medium transition-all border-b-2",
                    sortBy === option.key 
                      ? "text-blue-500 border-blue-500" 
                      : "text-zinc-500 border-transparent hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Blue gradient divider */}
            <div 
              className="h-px mt-4"
              style={{ 
                background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' 
              }}
            />
          </div>
          
          {/* Filter tags display */}
          {searchTags.length > 0 && (
            <div className="px-8 pt-4 flex items-center gap-2">
              <span className="text-sm text-white/70">Filtering by:</span>
              {searchTags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
              <button
                onClick={() => { setSearchTags([]); setSearchQuery(''); }}
                className="text-sm text-white/70 hover:text-white underline ml-2"
              >
                Clear
              </button>
            </div>
          )}

          {/* Gallery Grid */}
          <div className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            ) : filteredScenarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No stories found</h3>
                <p className="text-zinc-500 max-w-md">
                  {searchTags.length > 0 || Object.values(categoryFilters).some(arr => arr.length > 0)
                    ? "Try different filters or clear your search to see all stories."
                    : "Be the first to publish a story to the gallery!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredScenarios.map((published) => (
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
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPublished && (
        <TooltipProvider>
          <ScenarioDetailModal
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            scenarioId={selectedPublished.scenario_id}
            title={selectedPublished.scenario?.title || "Untitled"}
            description={selectedPublished.scenario?.description || ""}
            coverImage={selectedPublished.scenario?.cover_image_url || ""}
            coverImagePosition={selectedPublished.scenario?.cover_image_position || { x: 50, y: 50 }}
            tags={selectedPublished.tags}
            contentThemes={selectedPublished.contentThemes}
            likeCount={selectedPublished.like_count}
            saveCount={selectedPublished.save_count}
            playCount={selectedPublished.play_count}
            viewCount={selectedPublished.view_count}
            publisher={selectedPublished.publisher}
            publishedAt={selectedPublished.created_at}
            isLiked={likes.has(selectedPublished.id)}
            isSaved={saves.has(selectedPublished.id)}
            allowRemix={selectedPublished.allow_remix}
            isOwned={!!isOwnedByViewer}
            isPublished={selectedPublished.is_published}
            onLike={() => handleLike(selectedPublished)}
            onSave={() => handleSave(selectedPublished)}
            onPlay={() => handlePlay(selectedPublished)}
            onUnpublish={handleUnpublishSelected}
          />
        </TooltipProvider>
      )}
    </div>
  );
};
