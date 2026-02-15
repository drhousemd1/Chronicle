
import React, { useState } from 'react';
import { Heart, Bookmark, Play, Pencil, Eye } from 'lucide-react';
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
  const publisher = published.publisher;
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

  return (
    <div 
      className="group relative cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-[#4a5f7f] relative">
        
        {/* Cover Image */}
        {scenario?.cover_image_url ? (
          <img
            src={scenario.cover_image_url}
            alt={scenario.title}
            style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-10 text-center">
            <div className="font-black text-white/10 text-6xl uppercase tracking-tighter italic break-words p-4 text-center">
              {scenario?.title?.charAt(0) || '?'}
            </div>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

        {/* SFW/NSFW Badge */}
        {published.contentThemes?.storyType && (
          <div className={cn(
            "absolute top-4 right-4 px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f]",
            published.contentThemes.storyType === 'NSFW'
              ? "text-red-400"
              : "text-blue-400"
          )}>
            {published.contentThemes.storyType}
          </div>
        )}

        {/* Edit icon badge - shows for stories with allow_remix enabled */}
        {published.allow_remix && (
          <div className="absolute top-4 left-4 p-1.5 backdrop-blur-sm rounded-lg shadow-lg bg-[#2a2a2f]">
            <Pencil className="w-4 h-4 text-purple-400" />
          </div>
        )}


        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100 flex-wrap">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "p-2.5 rounded-xl shadow-2xl transition-all",
              isLiked 
                ? "bg-rose-500 text-white" 
                : "bg-white/90 text-slate-700 hover:bg-rose-100 hover:text-rose-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "p-2.5 rounded-xl shadow-2xl transition-all",
              isSaved 
                ? "bg-amber-500 text-white" 
                : "bg-white/90 text-slate-700 hover:bg-amber-100 hover:text-amber-500"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
          </button>
          <button
            onClick={handlePlay}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-2xl hover:bg-blue-500 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 p-6 pointer-events-none flex flex-col justify-start">
          <h3 className="text-xl font-black text-white leading-tight tracking-tight group-hover:text-blue-300 transition-colors truncate flex-shrink-0">
            {scenario?.title || "Untitled Story"}
          </h3>
          <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic mt-1 overflow-hidden">
            {scenario?.description || "No description provided."}
          </p>
          
          {/* Publisher & Stats */}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-white/60 font-medium">
              by {publisher?.username || 'Anonymous'}
            </span>
            <div className="flex items-center gap-3 text-[10px] text-white/50">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {published.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className={cn("w-3 h-3", isLiked && "fill-rose-400 text-rose-400")} />
                {published.like_count}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className={cn("w-3 h-3", isSaved && "fill-amber-400 text-amber-400")} />
                {published.save_count}
              </span>
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {published.play_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
