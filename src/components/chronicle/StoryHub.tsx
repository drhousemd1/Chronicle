
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ScenarioMetadata, ContentThemes } from "@/types";
import { Eye, Heart, Bookmark, Play, Pencil, Loader2 } from "lucide-react";
import { Button } from "./UI";
import { ScenarioDetailModal } from "./StoryDetailModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchContentThemes } from "@/services/supabase-data";
import { getPublishedScenario, unpublishScenario, PublishedScenario } from "@/services/gallery-data";

import { cn } from "@/lib/utils";

interface ScenarioCardProps {
  scen: ScenarioMetadata;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
  isPublished?: boolean;
  contentThemes?: ContentThemes;
  publishedData?: PublishedScenario;
  displayAuthor?: string;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scen, onPlay, onEdit, onDelete, onViewDetails, isPublished, contentThemes, publishedData, displayAuthor }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(scen.id);
  };

  const coverPosition = scen.coverImagePosition || { x: 50, y: 50 };

  return (
    <div className="group relative cursor-pointer transition-all duration-300 group-hover:-translate-y-3" onClick={() => onViewDetails(scen.id)}>
      <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-shadow duration-300 group-hover:shadow-2xl border border-[#4a5f7f] relative">
        
        {/* Top-left badge container - flows horizontally */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          {!scen.isBookmarked && isPublished && (
            <div className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-emerald-400 uppercase tracking-wide">
              Published
            </div>
          )}
          
          {/* Edit icon badge - shows for stories with allow_remix enabled */}
          {publishedData?.allow_remix && (
            <div className="p-1.5 backdrop-blur-sm rounded-lg shadow-lg bg-[#2a2a2f]">
              <Pencil className="w-4 h-4 text-purple-400" />
            </div>
          )}
        </div>
        
        {/* SFW/NSFW Badge - Top Right */}
        {contentThemes?.storyType && (
          <div className={cn(
            "absolute top-4 right-4 px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] z-10 uppercase tracking-wide",
            contentThemes.storyType === 'NSFW' ? "text-red-500" : "text-blue-500"
          )}>
            {contentThemes.storyType}
          </div>
        )}
        
        {scen.coverImage ? (
          <img
            src={scen.coverImage}
            alt={scen.title}
            style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 p-10 text-center">
             <div className="font-black text-ghost-white text-6xl uppercase tracking-tighter italic break-words p-4 text-center">
               {scen.title.charAt(0) || '?'}
             </div>
          </div>
        )}
        
        {/* Flat dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        
        {/* Hover Actions - Edit, Delete, Play */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(scen.id); }}
            className="h-8 px-3 rounded-xl bg-white text-[hsl(var(--ui-surface-2))] hover:bg-ghost-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={handleDeleteClick}
            className="h-8 px-3 rounded-xl bg-[hsl(var(--destructive))] text-white hover:brightness-110 text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl transition-colors"
          >
            Delete
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onPlay(scen.id); }}
            className="h-8 px-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl transition-colors"
          >
            Play
          </button>
        </div>
        
        {/* Bottom Info */}
        <div className="absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none flex flex-col" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}>>
          <h3 className="text-lg font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate">
            {scen.title || "Unnamed Story"}
          </h3>
          <p className="text-xs text-[rgba(248,250,252,0.7)] line-clamp-2 leading-relaxed italic min-h-[2.5rem]">
            {scen.description || "No summary provided."}
          </p>
          {/* Stats row: show all 4 for published, only Play for unpublished */}
          <div className="flex items-center gap-3 text-[10px] text-[rgba(248,250,252,0.7)] mt-1">
            {publishedData ? (
              <>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {publishedData.view_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {publishedData.like_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="w-3 h-3" />
                  {publishedData.save_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  {publishedData.play_count ?? 0}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                0
              </span>
            )}
          </div>
          <span className="text-[11px] text-[rgba(248,250,252,0.7)] font-medium mt-1">
            Created by: {displayAuthor || 'Anonymous'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ScenarioHubProps {
  registry: ScenarioMetadata[];
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  publishedScenarioIds?: Set<string>;
  contentThemesMap?: Map<string, ContentThemes>;
  publishedScenariosData?: Map<string, PublishedScenario>;
  ownerUsername?: string;
  bookmarkedCreatorNames?: Map<string, string>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function ScenarioHub({
  registry,
  onPlay,
  onEdit,
  onDelete,
  onCreate,
  publishedScenarioIds,
  contentThemesMap,
  publishedScenariosData,
  ownerUsername,
  bookmarkedCreatorNames,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: ScenarioHubProps) {
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioMetadata | null>(null);
  const [selectedContentThemes, setSelectedContentThemes] = useState<ContentThemes | null>(null);
  const [publicationStatus, setPublicationStatus] = useState<PublishedScenario | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  const handleViewDetails = async (id: string) => {
    const scenario = registry.find(s => s.id === id);
    if (scenario) {
      setSelectedScenario(scenario);
      setDetailModalOpen(true);
      setIsLoadingDetails(true);
      
      // Fetch content themes and publication status in parallel
      try {
        const [themes, published] = await Promise.all([
          fetchContentThemes(id).catch(() => null),
          getPublishedScenario(id).catch(() => null)
        ]);
        
        setSelectedContentThemes(themes);
        setPublicationStatus(published);
      } catch (e) {
        console.error('Failed to fetch scenario details:', e);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  const handleUnpublish = async () => {
    if (!selectedScenario) return;
    try {
      await unpublishScenario(selectedScenario.id);
      setPublicationStatus(null);
    } catch (e) {
      console.error('Failed to unpublish:', e);
    }
  };

  const getDisplayAuthor = useCallback((scen: ScenarioMetadata) => {
    if (scen.isBookmarked && bookmarkedCreatorNames?.has(scen.id)) {
      return bookmarkedCreatorNames.get(scen.id);
    }
    return ownerUsername;
  }, [ownerUsername, bookmarkedCreatorNames]);

  return (
    <div className="w-full h-full p-4 lg:p-10 flex flex-col overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8 w-full">
        {registry.map((scen) => (
          <ScenarioCard 
            key={scen.id} 
            scen={scen} 
            onPlay={onPlay} 
            onEdit={onEdit} 
            onDelete={onDelete}
            onViewDetails={handleViewDetails}
            isPublished={publishedScenarioIds?.has(scen.id)}
            contentThemes={contentThemesMap?.get(scen.id)}
            publishedData={publishedScenariosData?.get(scen.id)}
            displayAuthor={getDisplayAuthor(scen)}
          />
        ))}
        {/* New Story card - always shown */}
        <button 
          onClick={onCreate}
          className="aspect-[2/3] w-full rounded-[2rem] border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-4 group hover:border-blue-500 transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center text-3xl text-zinc-500 group-hover:bg-blue-900/30 group-hover:text-blue-500 transition-colors">
             +
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-500">New Story</span>
        </button>
      </div>

      {/* Infinite scroll sentinel + loading indicator */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoadingMore && (
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedScenario && (
        <TooltipProvider>
          <ScenarioDetailModal
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            scenarioId={selectedScenario.id}
            title={selectedScenario.title}
            description={selectedScenario.description || ""}
            coverImage={selectedScenario.coverImage || ""}
            coverImagePosition={selectedScenario.coverImagePosition || { x: 50, y: 50 }}
            tags={selectedScenario.tags || []}
            contentThemes={selectedContentThemes || undefined}
            isOwned={!selectedScenario.isBookmarked}
            isPublished={!!publicationStatus?.is_published}
          allowRemix={publicationStatus?.allow_remix}
            onPlay={() => {
              onPlay(selectedScenario.id);
              setDetailModalOpen(false);
            }}
            onEdit={() => {
              onEdit(selectedScenario.id);
              setDetailModalOpen(false);
            }}
            onUnpublish={handleUnpublish}
          />
        </TooltipProvider>
      )}
    </div>
  );
}
