import React, { useState } from 'react';
import { Heart, Bookmark, Play, Sparkles, MessageCircle } from 'lucide-react';
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
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#2a2a2f] border border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-xl relative">
        
        {/* Cover Image */}
        {scenario?.cover_image_url ? (
          <img
            src={scenario.cover_image_url}
            alt={scenario.title}
            style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <div className="font-black text-white/10 text-6xl uppercase tracking-tighter italic">
              {scenario?.title?.charAt(0) || '?'}
            </div>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Remix Badge */}
        {published.allow_remix && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500/80 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3 h-3" />
            REMIXABLE
          </div>
        )}

        {/* Hover Actions */}
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
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-2xl hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Play
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end pointer-events-none">
          <h4 className="text-xl font-bold text-white leading-tight mb-1 truncate">
            {scenario?.title || "Untitled Story"}
          </h4>
          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-3">
            {scenario?.description || "No description provided."}
          </p>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Heart className={cn("w-3 h-3", isLiked && "fill-red-500 text-red-500")} />
                {published.like_count}
              </span>
              {storyType && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  storyType === 'NSFW'
                    ? "bg-red-500/20 text-red-400"
                    : "bg-blue-500/20 text-blue-400"
                )}>
                  {storyType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
              <MessageCircle className="w-3 h-3" />
              {published.play_count}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
