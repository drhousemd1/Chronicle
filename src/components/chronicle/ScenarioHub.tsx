
import React, { useState } from "react";
import { ScenarioMetadata, ContentThemes } from "@/types";
import { Button } from "./UI";
import { ScenarioDetailModal } from "./ScenarioDetailModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchContentThemes } from "@/services/supabase-data";
import { getPublishedScenario, unpublishScenario, PublishedScenario } from "@/services/gallery-data";
import { toast } from "sonner";

interface ScenarioCardProps {
  scen: ScenarioMetadata;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scen, onPlay, onEdit, onDelete, onViewDetails }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(scen.id);
  };

  const coverPosition = scen.coverImagePosition || { x: 50, y: 50 };

  return (
    <div className="group relative cursor-pointer" onClick={() => onViewDetails(scen.id)}>
      <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl ring-1 ring-slate-900/5 relative">
        
        {scen.isBookmarked && (
          <div className="absolute top-4 left-4 px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full z-10 shadow-lg">
            Saved
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
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />
        
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(scen.id); }}
            className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm shadow-2xl hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onPlay(scen.id); }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-2xl hover:bg-blue-500 transition-colors"
          >
            Play
          </button>
        </div>
        
        <div className="absolute inset-x-0 bottom-0 h-28 p-6 pointer-events-none flex flex-col">
          <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate flex-shrink-0">
            {scen.title || "Unnamed Story"}
          </h3>
          <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic mt-1">
            {scen.description || "No summary provided."}
          </p>
        </div>

        <button 
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-4 right-4 p-3 bg-black/40 text-white/50 hover:text-rose-500 hover:bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:rotate-12 z-20 pointer-events-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
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
}

export function ScenarioHub({
  registry,
  onPlay,
  onEdit,
  onDelete,
  onCreate,
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
    <div className="w-full h-full p-10 flex flex-col overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 w-full">
        {registry.map((scen) => (
          <ScenarioCard 
            key={scen.id} 
            scen={scen} 
            onPlay={onPlay} 
            onEdit={onEdit} 
            onDelete={onDelete}
            onViewDetails={handleViewDetails}
          />
        ))}
        {registry.length > 0 && (
          <button 
            onClick={onCreate}
            className="aspect-[2/3] w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 group hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
               +
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-black group-hover:text-blue-600">New Story</span>
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
