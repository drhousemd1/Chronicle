
import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Play, Sparkles, Edit, Loader2, Eye, X, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fetchScenarioCharacters, ScenarioCharacter } from '@/services/gallery-data';

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

// Helper function for count formatting
const formatCount = (count: number): string => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
};

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
            className="relative w-full max-w-6xl max-h-[90vh] bg-[#121214] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-20 p-2 text-white/20 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left Column - Cover Image + Actions */}
            <div className="md:w-[420px] flex-shrink-0 p-6 flex flex-col">
              {/* Cover Image with Badge Overlay */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#2a2a2f]">
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
                
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* SFW/NSFW Badge Overlay */}
                {contentThemes?.storyType && (
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg",
                      contentThemes.storyType === 'NSFW'
                        ? "bg-red-500/90 text-white"
                        : "bg-blue-500/90 text-white"
                    )}>
                      {contentThemes.storyType}
                    </span>
                  </div>
                )}
                
                {/* Remixable Badge */}
                {allowRemix && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 bg-purple-500/90 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      REMIXABLE
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Horizontal Row */}
              <div className="flex gap-2 mt-4">
                {isOwned ? (
                  <>
                    {onEdit && (
                      <button
                        onClick={handleEdit}
                        className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                        <span className="text-sm font-semibold">Edit</span>
                      </button>
                    )}
                    <button
                      onClick={handlePlay}
                      className="flex-1 h-12 bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl flex items-center justify-center gap-2 text-white shadow-md transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span className="text-sm font-semibold">Play</span>
                    </button>
                  </>
                ) : (
                  <>
                    {onLike && (
                      <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={cn(
                          "flex-1 h-12 border rounded-xl flex items-center justify-center gap-2 transition-all",
                          isLiked 
                            ? "bg-rose-500/20 border-rose-500/50 text-rose-400" 
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        )}
                      >
                        <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                        <span className="text-sm font-semibold">Like</span>
                      </button>
                    )}
                    {onSave && (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                          "flex-1 h-12 border rounded-xl flex items-center justify-center gap-2 transition-all",
                          isSaved 
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-400" 
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        )}
                      >
                        <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                        <span className="text-sm font-semibold">Bookmark</span>
                      </button>
                    )}
                    <button
                      onClick={handlePlay}
                      className="flex-1 h-12 bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl flex items-center justify-center gap-2 text-white shadow-md transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span className="text-sm font-semibold">Play</span>
                    </button>
                  </>
                )}
              </div>

              {/* Unpublish button for owned published scenarios */}
              {isOwned && isPublished && onUnpublish && (
                <button
                  onClick={handleUnpublish}
                  disabled={isUnpublishing}
                  className="w-full mt-2 h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUnpublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Remove from Gallery
                </button>
              )}
            </div>

            {/* Right Column - Content */}
            <ScrollArea className="flex-1 md:border-l border-white/5">
              <div className="p-6 md:p-8 md:pr-12 flex flex-col min-h-full">
                {/* Header: Title + Stats */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col gap-1 flex-1 pr-8">
                    {/* Title with inline stats */}
                    <div className="flex items-center flex-wrap gap-4">
                      <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                        {title || "Untitled Story"}
                      </h1>
                      
                      {/* Inline Stats - Gallery mode only */}
                      {!isOwned && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-[#94a3b8]">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-bold">{formatCount(viewCount)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#94a3b8]">
                            <Heart className={cn("w-4 h-4", isLiked && "fill-rose-400 text-rose-400")} />
                            <span className="text-xs font-bold">{formatCount(likeCount)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#94a3b8]">
                            <Bookmark className={cn("w-4 h-4", isSaved && "fill-amber-400 text-amber-400")} />
                            <span className="text-xs font-bold">{formatCount(saveCount)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#94a3b8]">
                            <Play className="w-4 h-4" />
                            <span className="text-xs font-bold">{formatCount(playCount)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Publisher "by" line */}
                    {publisher && !isOwned && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden flex-shrink-0">
                          {publisher.avatar_url ? (
                            <img 
                              src={publisher.avatar_url} 
                              alt={publisher.username || 'Creator'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/80 text-[10px] font-bold">
                              {publisher.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-[#94a3b8]">
                          by <span className="text-white font-medium">{publisher.username || 'Anonymous'}</span>
                        </p>
                      </div>
                    )}

                    {/* Published badge for owned scenarios */}
                    {isOwned && isPublished && (
                      <span className="inline-flex w-fit px-2.5 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 mt-1">
                        PUBLISHED
                      </span>
                    )}
                  </div>
                </div>

                {/* Synopsis Section */}
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Synopsis</h3>
                  <p className="text-[#e2e8f0] leading-relaxed max-w-2xl whitespace-pre-wrap">
                    {description || "No description provided."}
                  </p>
                </div>

                {/* Content Themes Grid */}
                {hasContentThemes && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
                      {contentThemes.genres.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Genre</h4>
                          <p className="text-sm text-white">{contentThemes.genres.join(', ')}</p>
                        </div>
                      )}
                      {contentThemes.characterTypes.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Character Types</h4>
                          <p className="text-sm text-white">{contentThemes.characterTypes.join(', ')}</p>
                        </div>
                      )}
                      {contentThemes.origin.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Story Origin</h4>
                          <p className="text-sm text-white">{contentThemes.origin.join(', ')}</p>
                        </div>
                      )}
                    </div>

                    {/* Trigger Warnings - Separate Row */}
                    {contentThemes.triggerWarnings.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Trigger Warnings</h4>
                        <p className="text-sm text-red-400 leading-relaxed font-medium">
                          {contentThemes.triggerWarnings.join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Custom Tags */}
                    {contentThemes.customTags.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Custom Tags</h4>
                        <p className="text-sm text-white">{contentThemes.customTags.join(', ')}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Characters Section */}
                <div className="mt-auto pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Characters</h3>
                    {characters.length > 4 && (
                      <button className="text-[10px] font-bold text-[#3b82f6] hover:underline uppercase">
                        View All
                      </button>
                    )}
                  </div>
                  
                  {isLoadingCharacters ? (
                    <div className="flex gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <Skeleton className="w-14 h-14 rounded-full bg-[#2a2a2f]" />
                          <Skeleton className="w-12 h-3 rounded bg-[#2a2a2f]" />
                        </div>
                      ))}
                    </div>
                  ) : characters.length === 0 ? (
                    <p className="text-sm text-white/50 italic">No characters yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {characters.slice(0, 8).map((char) => (
                        <div key={char.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                          <div className="w-14 h-14 rounded-full border-2 border-white/10 p-0.5 group-hover:border-[#3b82f6] transition-all">
                            {char.avatarUrl ? (
                              <img
                                src={char.avatarUrl}
                                alt={char.name}
                                style={{ objectPosition: `${char.avatarPosition.x}% ${char.avatarPosition.y}%` }}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-[#2a2a2f] flex items-center justify-center text-white/30 text-lg font-bold">
                                {char.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-white/60 group-hover:text-white text-center max-w-[4rem] truncate transition-colors">
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
