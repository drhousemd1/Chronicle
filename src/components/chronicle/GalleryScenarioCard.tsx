import React, { useState } from 'react';
import { Heart, Bookmark, Play, Sparkles, Eye } from 'lucide-react';
import { PublishedScenario } from '@/services/gallery-data';
import { cn } from '@/lib/utils';

interface GalleryScenarioCardProps {
  published: PublishedScenario;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onPlay: () => void;
  onViewDetails: () => void;
}

export const GalleryScenarioCard: React.FC<GalleryScenarioCardProps> = ({
  published,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onPlay,
  onViewDetails
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scenario = published.scenario;
  const coverPosition = published.scenario?.cover_image_position || { x: 50, y: 50 };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike();
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  const storyType = published.contentThemes?.storyType;

  return (
    <div 
      className="group relative cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Card container - matches ScenarioHub exactly */}
      <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl ring-1 ring-slate-900/5 relative">
        
        {/* Remix Badge - top left */}
        {published.allow_remix && (
          <div className="absolute top-4 left-4 px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full z-10 shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Remixable
          </div>
        )}

        {/* SFW/NSFW Badge - top right */}
        {storyType && (
          <div className={cn(
            "absolute top-4 right-4 px-2.5 py-1 bg-[#2a2a2f]/90 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-wide rounded-full z-10 shadow-lg",
            storyType === 'NSFW' ? "text-red-400" : "text-blue-400"
          )}>
            {storyType}
          </div>
        )}
        
        {/* Cover Image - matches ScenarioHub */}
        {scenario?.cover_image_url ? (
          <img
            src={scenario.cover_image_url}
            alt={scenario.title}
            style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 p-10 text-center">
            <div className="font-black text-white/10 text-6xl uppercase tracking-tighter italic break-words p-4 text-center">
              {scenario?.title?.charAt(0) || '?'}
            </div>
          </div>
        )}
        
        {/* Gradient Overlay - matches ScenarioHub */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

        {/* Hover Actions - Gallery specific */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "p-3 rounded-xl shadow-2xl transition-all",
              isLiked 
                ? "bg-rose-500 text-white" 
                : "bg-white/90 text-zinc-700 hover:bg-rose-100 hover:text-rose-500"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "p-3 rounded-xl shadow-2xl transition-all",
              isSaved 
                ? "bg-amber-500 text-white" 
                : "bg-white/90 text-zinc-700 hover:bg-amber-100 hover:text-amber-500"
            )}
          >
            <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
          </button>
          <button
            onClick={handlePlay}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-2xl hover:bg-blue-500 transition-colors"
          >
            Play
          </button>
        </div>

        {/* Bottom Info - fixed height h-32 for alignment with metrics */}
        <div className="absolute inset-x-0 bottom-0 h-32 p-6 pointer-events-none flex flex-col">
          <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate flex-shrink-0">
            {scenario?.title || "Untitled Story"}
          </h3>
          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed italic mt-1 flex-1">
            {scenario?.description || "No description provided."}
          </p>
          
          {/* Stats Row - Views, Likes, Saves, Plays */}
          <div className="flex items-center gap-4 mt-auto pt-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-white/50">
              <Eye className="w-3 h-3" />
              {published.view_count}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-white/50">
              <Heart className={cn("w-3 h-3", isLiked && "fill-red-500 text-red-500")} />
              {published.like_count}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-white/50">
              <Bookmark className={cn("w-3 h-3", isSaved && "fill-amber-500 text-amber-500")} />
              {published.save_count}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-white/50">
              <Play className="w-3 h-3" />
              {published.play_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
