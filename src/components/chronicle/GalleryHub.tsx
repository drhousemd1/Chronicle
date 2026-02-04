
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Globe } from 'lucide-react';
import { GalleryScenarioCard } from './GalleryScenarioCard';
import { ScenarioDetailModal } from './ScenarioDetailModal';
import { 
  PublishedScenario, 
  fetchPublishedScenarios, 
  getUserInteractions,
  toggleLike,
  saveScenarioToCollection,
  unsaveScenario,
  incrementPlayCount
} from '@/services/gallery-data';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

interface GalleryHubProps {
  onPlay: (scenarioId: string, publishedScenarioId: string) => void;
  onSaveChange?: () => void;
}

export const GalleryHub: React.FC<GalleryHubProps> = ({ onPlay, onSaveChange }) => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<PublishedScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState<Set<string>>(new Set());
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPublished, setSelectedPublished] = useState<PublishedScenario | null>(null);

  const loadScenarios = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPublishedScenarios(
        searchTags.length > 0 ? searchTags : undefined
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
    }
  }, [user, searchTags]);

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
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by tags: fantasy, romance, mystery..."
              className="w-full pl-12 pr-24 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              Search
            </button>
          </div>
          {searchTags.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-slate-500">Filtering by:</span>
              {searchTags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
              <button
                onClick={() => { setSearchTags([]); setSearchQuery(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 underline ml-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No stories found</h3>
            <p className="text-slate-500 max-w-md">
              {searchTags.length > 0 
                ? "Try different tags or clear your search to see all stories."
                : "Be the first to publish a story to the gallery!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
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
            likeCount={selectedPublished.like_count}
            saveCount={selectedPublished.save_count}
            playCount={selectedPublished.play_count}
            publisher={selectedPublished.publisher}
            publishedAt={selectedPublished.created_at}
            isLiked={likes.has(selectedPublished.id)}
            isSaved={saves.has(selectedPublished.id)}
            allowRemix={selectedPublished.allow_remix}
            onLike={() => handleLike(selectedPublished)}
            onSave={() => handleSave(selectedPublished)}
            onPlay={() => handlePlay(selectedPublished)}
          />
        </TooltipProvider>
      )}
    </div>
  );
};
