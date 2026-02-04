
import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Play, Sparkles, Edit, Loader2, Users, Eye, Calendar, X, UserPlus, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fetchScenarioCharacters, ScenarioCharacter } from '@/services/gallery-data';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface ScenarioDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Core scenario data
  scenarioId: string;
  title: string;
  description: string;
  coverImage: string;
  coverImagePosition: { x: number; y: number };
  tags: string[];
  
  // Content themes
  contentThemes?: {
    characterTypes: string[];
    storyType: 'SFW' | 'NSFW' | null;
    genres: string[];
    origin: string[];
    triggerWarnings: string[];
    customTags: string[];
  };
  
  // Stats (for published scenarios)
  likeCount?: number;
  saveCount?: number;
  playCount?: number;
  viewCount?: number;
  
  // Publisher info
  publisher?: {
    username: string | null;
    avatar_url: string | null;
  };
  publishedAt?: string;
  
  // Interaction state
  isLiked?: boolean;
  isSaved?: boolean;
  allowRemix?: boolean;
  
  // Actions
  onLike?: () => void;
  onSave?: () => void;
  onPlay: () => void;
  onEdit?: () => void;
  onUnpublish?: () => void;
  
  // Display mode
  isOwned?: boolean; // Shows Edit button instead of Like/Save
  isPublished?: boolean; // Shows unpublish button for owned scenarios
}

export const ScenarioDetailModal: React.FC<ScenarioDetailModalProps> = ({
  open,
  onOpenChange,
  scenarioId,
  title,
  description,
  coverImage,
  coverImagePosition,
  tags,
  contentThemes,
  likeCount = 0,
  saveCount = 0,
  playCount = 0,
  viewCount = 0,
  publisher,
  publishedAt,
  isLiked = false,
  isSaved = false,
  allowRemix = false,
  onLike,
  onSave,
  onPlay,
  onEdit,
  onUnpublish,
  isOwned = false,
  isPublished = false
}) => {
  const [characters, setCharacters] = useState<ScenarioCharacter[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Fetch characters when modal opens
  useEffect(() => {
    if (open && scenarioId) {
      setIsLoadingCharacters(true);
      fetchScenarioCharacters(scenarioId)
        .then(setCharacters)
        .catch(console.error)
        .finally(() => setIsLoadingCharacters(false));
    }
  }, [open, scenarioId]);

  const handleLike = async () => {
    if (!onLike || isLiking) return;
    setIsLiking(true);
    try {
      await onLike();
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!onSave || isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlay = () => {
    onPlay();
    onOpenChange(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
      onOpenChange(false);
    }
  };

  const handleUnpublish = async () => {
    if (!onUnpublish || isUnpublishing) return;
    setIsUnpublishing(true);
    try {
      await onUnpublish();
    } finally {
      setIsUnpublishing(false);
    }
  };

  const formattedDate = publishedAt 
    ? new Date(publishedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : null;

  // Check if content themes has any data
  const hasContentThemes = contentThemes && (
    contentThemes.genres.length > 0 ||
    contentThemes.characterTypes.length > 0 ||
    contentThemes.origin.length > 0 ||
    contentThemes.triggerWarnings.length > 0 ||
    contentThemes.customTags.length > 0 ||
    contentThemes.storyType
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1a1f] rounded-3xl shadow-2xl ring-1 ring-white/10 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <ScrollArea className="flex-1">
              <div className="p-6 md:p-8">
                {/* Header: Image + Info */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  {/* Cover Image */}
                  <div className="w-full md:w-64 flex-shrink-0">
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#2a2a2f] ring-1 ring-white/10 shadow-xl">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={title}
                          style={{ objectPosition: `${coverImagePosition.x}% ${coverImagePosition.y}%` }}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a2a2f] to-[#1a1a1f]">
                          <span className="font-black text-white/20 text-7xl uppercase">
                            {title?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* SFW/NSFW Badge */}
                      {contentThemes?.storyType && (
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold",
                          contentThemes.storyType === 'NSFW'
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        )}>
                          {contentThemes.storyType}
                        </span>
                      )}
                      {allowRemix && (
                        <span className="px-2.5 py-1 bg-purple-500/80 rounded-lg text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          REMIXABLE
                        </span>
                      )}
                      {isOwned && isPublished && (
                        <span className="px-2.5 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">
                          PUBLISHED
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight mb-3">
                      {title || "Untitled Story"}
                    </h2>

                    {/* Stats Row */}
                    {!isOwned && (
                      <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          {viewCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Heart className={cn("w-4 h-4", isLiked && "fill-rose-400 text-rose-400")} />
                          {likeCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Bookmark className={cn("w-4 h-4", isSaved && "fill-amber-400 text-amber-400")} />
                          {saveCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Play className="w-4 h-4" />
                          {playCount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Publisher Info */}
                    {publisher && !isOwned && (
                      <div className="flex items-center gap-3 p-3 bg-[#2a2a2f] rounded-xl mb-4 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-[#3a3a3f] overflow-hidden ring-2 ring-white/10 flex-shrink-0">
                          {publisher.avatar_url ? (
                            <img 
                              src={publisher.avatar_url} 
                              alt={publisher.username || 'Creator'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold">
                              {publisher.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {publisher.username || 'Anonymous'}
                          </div>
                          {formattedDate && (
                            <div className="text-xs text-white/50 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Published {formattedDate}
                            </div>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-not-allowed opacity-60"
                              disabled
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Follow feature coming soon</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                        {description || "No description provided."}
                      </p>
                    </div>

                    {/* Content Themes Display - Show for both owned and gallery scenarios */}
                    {hasContentThemes && (
                      <div className="space-y-3 mb-4 p-4 bg-[#2a2a2f] rounded-xl border border-white/10">
                        {contentThemes.genres.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">Genre</span>
                            <p className="text-sm text-white/80">{contentThemes.genres.join(', ')}</p>
                          </div>
                        )}
                        {contentThemes.characterTypes.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">Character Types</span>
                            <p className="text-sm text-white/80">{contentThemes.characterTypes.join(', ')}</p>
                          </div>
                        )}
                        {contentThemes.origin.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">Story Origin</span>
                            <p className="text-sm text-white/80">{contentThemes.origin.join(', ')}</p>
                          </div>
                        )}
                        {contentThemes.triggerWarnings.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-rose-400/70 uppercase tracking-wider block mb-1">Trigger Warnings</span>
                            <p className="text-sm text-rose-300/80">{contentThemes.triggerWarnings.join(', ')}</p>
                          </div>
                        )}
                        {contentThemes.customTags.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">Custom Tags</span>
                            <p className="text-sm text-white/80">{contentThemes.customTags.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {isOwned ? (
                        <>
                          {onEdit && (
                            <button
                              onClick={handleEdit}
                              className="px-6 py-3 bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-white rounded-xl font-bold text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Story
                            </button>
                          )}
                          <button
                            onClick={handlePlay}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            Play Story
                          </button>
                          {isPublished && onUnpublish && (
                            <button
                              onClick={handleUnpublish}
                              disabled={isUnpublishing}
                              className="px-6 py-3 bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-white/70 rounded-xl font-bold text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                            {isUnpublishing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Globe className="w-4 h-4" />
                              )}
                              Remove from Gallery
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {onLike && (
                            <button
                              onClick={handleLike}
                              disabled={isLiking}
                              className={cn(
                                "px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2",
                                isLiked 
                                  ? "bg-rose-500 text-white hover:bg-rose-600" 
                                  : "bg-white/10 text-white/80 hover:bg-white/20"
                              )}
                            >
                              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                              {isLiked ? 'Liked' : 'Like'}
                            </button>
                          )}
                          {onSave && (
                            <button
                              onClick={handleSave}
                              disabled={isSaving}
                              className={cn(
                                "px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2",
                                isSaved 
                                  ? "bg-amber-500 text-white hover:bg-amber-600" 
                                  : "bg-white/10 text-white/80 hover:bg-white/20"
                              )}
                            >
                              <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
                          )}
                          <button
                            onClick={handlePlay}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            Play Story
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Characters Section */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-bold text-white">Characters</h3>
                  </div>
                  
                  {isLoadingCharacters ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                          <Skeleton className="w-16 h-16 rounded-full bg-[#2a2a2f]" />
                          <Skeleton className="w-14 h-3 rounded bg-[#2a2a2f]" />
                        </div>
                      ))}
                    </div>
                  ) : characters.length === 0 ? (
                    <p className="text-sm text-white/50 italic">No characters yet</p>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {characters.map((char) => (
                        <div key={char.id} className="flex-shrink-0 flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-full bg-[#2a2a2f] overflow-hidden ring-2 ring-white/10 shadow-lg">
                            {char.avatarUrl ? (
                              <img
                                src={char.avatarUrl}
                                alt={char.name}
                                style={{ objectPosition: `${char.avatarPosition.x}% ${char.avatarPosition.y}%` }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30 text-lg font-bold">
                                {char.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-white/70 font-medium text-center max-w-[4rem] truncate">
                            {char.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
};
