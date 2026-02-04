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
  const coverPosition = scenario?.cover_image_position || { x: 50, y: 50 };
  const storyType = published.contentThemes?.storyType;

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
      {/* Card Container - only transition-transform for lift effect */}
      <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-800 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-transform duration-300 group-hover:-translate-y-3 ring-1 ring-slate-900/5 relative">
        
        {/* Top Left - Remix Badge */}
        {published.allow_remix && (
          <div className="absolute top-4 left-4 px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full z-20 shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Remixable
          </div>
        )}

        {/* Top Right - SFW/NSFW Badge */}
        {storyType && (
          <div className={cn(
            "absolute top-4 right-4 px-2.5 py-1 bg-[#2a2a2f]/90 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-wide rounded-full z-20 shadow-lg",
            storyType === 'NSFW' ? "text-red-400" : "text-blue-400"
          )}>
            {storyType}
          </div>
        )}
        
        {/* Cover Image - absolute positioning ensures proper clipping */}
        {scenario?.cover_image_url ? (
          <img
            src={scenario.cover_image_url}
            alt={scenario.title}
            style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <span className="font-black text-white/10 text-6xl uppercase italic">
              {scenario?.title?.charAt(0) || '?'}
            </span>
          </div>
        )}
        
        {/* Gradient Overlay - NO transitions, static opacity */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

        {/* Hover Actions - Center */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 scale-90 group-hover:scale-100">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "p-3 rounded-xl shadow-2xl transition-colors",
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
              "p-3 rounded-xl shadow-2xl transition-colors",
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

        {/* Title & Description - positioned above bottom bar */}
        <div className="absolute inset-x-0 bottom-12 px-5 pointer-events-none z-10">
          <h3 className="text-lg font-black text-white leading-tight truncate">
            {scenario?.title || "Untitled Story"}
          </h3>
          <p className="text-xs text-white/70 line-clamp-2 mt-1 italic">
            {scenario?.description || "No description provided."}
          </p>
        </div>
        
        {/* Bottom Bar - Publisher left, Stats right */}
        <div className="absolute inset-x-0 bottom-0 h-10 px-4 flex items-center justify-between z-10 pointer-events-none">
          {/* Publisher - Left */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
              {published.publisher?.avatar_url ? (
                <img 
                  src={published.publisher.avatar_url} 
                  alt={published.publisher.username || 'Publisher'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-[10px] font-bold">
                  {published.publisher?.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <span className="text-[10px] text-white/60 font-medium truncate max-w-[80px]">
              {published.publisher?.username || 'Anonymous'}
            </span>
          </div>
          
          {/* Stats - Right */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-[9px] text-white/50">
              <Eye className="w-2.5 h-2.5" />
              {published.view_count}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] text-white/50">
              <Heart className={cn("w-2.5 h-2.5", isLiked && "fill-current text-rose-400")} />
              {published.like_count}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] text-white/50">
              <Bookmark className={cn("w-2.5 h-2.5", isSaved && "fill-current text-amber-400")} />
              {published.save_count}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] text-white/50">
              <Play className="w-2.5 h-2.5" />
              {published.play_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
