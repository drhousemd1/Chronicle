
import React, { useState } from "react";
import { ScenarioMetadata, ContentThemes } from "@/types";
import { Eye, Heart, Bookmark, Play, Pencil } from "lucide-react";
import { Button } from "./UI";
import { ScenarioDetailModal } from "./ScenarioDetailModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchContentThemes } from "@/services/supabase-data";
import { getPublishedScenario, unpublishScenario, PublishedScenario } from "@/services/gallery-data";
import { toast } from "sonner";
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
  ownerUsername?: string;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scen, onPlay, onEdit, onDelete, onViewDetails, isPublished, contentThemes, publishedData, ownerUsername }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(scen.id);
  };

  const coverPosition = scen.coverImagePosition || { x: 50, y: 50 };

  return (
    <div className="group relative cursor-pointer" onClick={() => onViewDetails(scen.id)}>
      <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-[#4a5f7f] relative">
        
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
            contentThemes.storyType === 'NSFW' ? "text-red-400" : "text-blue-400"
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
             <div className="font-black text-white/10 text-6xl uppercase tracking-tighter italic break-words p-4 text-center">
               {scen.title.charAt(0) || '?'}
             </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />
        
        {/* Hover Actions - Edit, Delete, Play */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100 flex-wrap">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(scen.id); }}
            className="px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-2xl hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-2xl hover:bg-rose-500 transition-colors"
          >
            Delete
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onPlay(scen.id); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-2xl hover:bg-blue-500 transition-colors"
          >
            Play
          </button>
        </div>
        
        {/* Bottom Info */}
        <div className="absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none flex flex-col">
          <h3 className="text-lg font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate">
            {scen.title || "Unnamed Story"}
          </h3>
          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed italic min-h-[2.5rem]">
            {scen.description || "No summary provided."}
          </p>
          <div className="flex items-center gap-3 text-[10px] text-white/50 mt-1">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {publishedData?.view_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {publishedData?.like_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              {publishedData?.save_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {publishedData?.play_count ?? 0}
            </span>
          </div>
          <span className="text-[11px] text-white/50 font-medium mt-1">
            Written by: {ownerUsername || 'Anonymous'}
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
}: ScenarioHubProps) {
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioMetadata | null>(null);
  const [selectedContentThemes, setSelectedContentThemes] = useState<ContentThemes | null>(null);
  const [publicationStatus, setPublicationStatus] = useState<PublishedScenario | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
      toast.success('Your story has been removed from the Gallery');
    } catch (e) {
      console.error('Failed to unpublish:', e);
      toast.error('Failed to remove from gallery');
    }
  };

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
            ownerUsername={ownerUsername}
          />
        ))}
        {registry.length > 0 && (
          <button 
            onClick={onCreate}
            className="aspect-[2/3] w-full rounded-[2rem] border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-4 group hover:border-blue-400 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center text-3xl text-zinc-500 group-hover:bg-blue-900/30 group-hover:text-blue-400 transition-colors">
               +
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-400">New Story</span>
          </button>
        )}
      </div>
      
      {registry.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-4xl text-slate-300 shadow-inner">
             ✦
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Start Your First Story</h2>
          <p className="text-lg text-slate-500 mb-8 max-w-md leading-relaxed font-medium">
            Create a scenario to begin your adventure. Define your world, cast your characters, and let the AI guide your narrative.
          </p>
          <Button 
            onClick={onCreate} 
            className="!px-10 !py-4 !bg-slate-900 !text-white shadow-xl hover:!shadow-2xl hover:-translate-y-1 transition-all text-base font-bold !rounded-2xl"
          >
            Create Scenario
          </Button>
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
