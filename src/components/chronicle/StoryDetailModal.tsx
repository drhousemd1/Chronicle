
import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Bookmark, Play, Pencil, Edit, Loader2, Eye, X, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fetchScenarioCharacters, ScenarioCharacter, fetchScenarioReviews, fetchUserReview, type ScenarioReview } from '@/services/gallery-data';
import { StarRating } from './StarRating';
import { SpiceRating } from './SpiceRating';
import { ReviewModal } from './ReviewModal';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

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
  avgRating?: number;
  reviewCount?: number;
  
  // Publisher info
  publisher?: {
    username: string | null;
    avatar_url: string | null;
    display_name?: string | null;
  };
  publisherId?: string;
  publishedScenarioId?: string;  // The published_scenarios.id (for reviews)
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
  canUnpublish?: boolean; // Show "Remove from Gallery" without switching to owned-mode UI
  
  // Display mode
  isOwned?: boolean; // Shows Edit button instead of Like/Save
  isPublished?: boolean; // Shows unpublish button for owned scenarios
  isDraft?: boolean; // Hides Play button for draft stories
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
  avgRating = 0,
  reviewCount = 0,
  publisher,
  publisherId,
  publishedScenarioId,
  publishedAt,
  isLiked = false,
  isSaved = false,
  allowRemix = false,
  onLike,
  onSave,
  onPlay,
  onEdit,
  onUnpublish,
  canUnpublish,
  isOwned = false,
  isPublished = false,
  isDraft = false
}) => {
  const [characters, setCharacters] = useState<ScenarioCharacter[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [reviews, setReviews] = useState<ScenarioReview[]>([]);
  const [userReview, setUserReview] = useState<ScenarioReview | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const REVIEWS_PAGE_SIZE = 5;

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

  // Fetch reviews when modal opens
  const loadReviews = useCallback(() => {
    if (!publishedScenarioId) return;
    fetchScenarioReviews(publishedScenarioId, REVIEWS_PAGE_SIZE, 0).then(batch => {
      setReviews(batch);
      setHasMoreReviews(batch.length === REVIEWS_PAGE_SIZE);
    }).catch(console.error);
    if (user?.id) {
      fetchUserReview(publishedScenarioId, user.id).then(setUserReview).catch(console.error);
    }
  }, [publishedScenarioId, user?.id]);

  const loadMoreReviews = async () => {
    if (!publishedScenarioId || loadingMoreReviews) return;
    setLoadingMoreReviews(true);
    try {
      const batch = await fetchScenarioReviews(publishedScenarioId, REVIEWS_PAGE_SIZE, reviews.length);
      setReviews(prev => [...prev, ...batch]);
      setHasMoreReviews(batch.length === REVIEWS_PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  useEffect(() => {
    if (open && publishedScenarioId) {
      loadReviews();
    }
  }, [open, publishedScenarioId, loadReviews]);


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

  const canShowUnpublish = isPublished && !!onUnpublish && (canUnpublish ?? isOwned);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
          <div 
            className="relative w-full max-w-[900px] max-h-[700px] bg-[#2a2a2f] rounded-[32px] overflow-hidden flex flex-col md:flex-row"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-20 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left Column - Cover Image + Actions */}
            <div className="w-[340px] flex-shrink-0 p-6 flex flex-col" style={{ background: '#1c1c1f' }}>
              {/* Cover Image */}
              <div
                className="relative w-full overflow-hidden rounded-2xl flex items-center justify-center"
                style={{
                  aspectRatio: '3/4',
                  background: 'linear-gradient(135deg, #2a2a2f, #1a1a1f)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                }}
              >
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={title}
                    style={{ objectPosition: `${coverImagePosition.x}% ${coverImagePosition.y}%` }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0" style={{ background: '#5a7292' }} />
                    <span className="relative text-[72px] font-black text-white/15">
                      {title?.charAt(0) || '?'}
                    </span>
                  </>
                )}

                {/* SFW/NSFW Badge */}
                {contentThemes?.storyType && (
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-bold bg-[#2a2a2f]",
                      contentThemes.storyType === 'NSFW' ? "text-red-500" : "text-blue-500"
                    )}>
                      {contentThemes.storyType}
                    </span>
                  </div>
                )}

                {/* Edit icon badge */}
                {allowRemix && (
                  <div className="absolute top-3 left-3">
                    <span className="p-2 bg-[#2a2a2f] rounded-lg shadow-lg flex items-center justify-center">
                      <Pencil className="w-4 h-4 text-purple-400" />
                    </span>
                  </div>
                )}

                {/* Bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
              </div>

              {/* Action buttons — HTML spec: #2f3137 surface with inset highlights */}
              <div className="flex gap-2 mt-4">
                {isOwned ? (
                  <>
                    {onEdit && (
                      <button
                        onClick={handleEdit}
                        className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        style={{
                          background: '#2f3137',
                          color: '#eaedf1',
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                    {!isDraft && (
                      <button
                        onClick={handlePlay}
                        className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        style={{
                          background: '#3b82f6',
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play
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
                          "flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase cursor-pointer transition-all",
                          isLiked && "!bg-rose-500 !text-white"
                        )}
                        style={{
                          background: isLiked ? undefined : '#2f3137',
                          color: isLiked ? undefined : '#eaedf1',
                          border: 'none',
                          boxShadow: isLiked
                            ? '0 8px 24px rgba(0,0,0,0.45)'
                            : '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                        {isLiked ? 'Liked' : 'Like'}
                      </button>
                    )}
                    {onSave && (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                          "flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase cursor-pointer transition-all",
                          isSaved && "!bg-amber-500 !text-white"
                        )}
                        style={{
                          background: isSaved ? undefined : '#2f3137',
                          color: isSaved ? undefined : '#eaedf1',
                          border: 'none',
                          boxShadow: isSaved
                            ? '0 8px 24px rgba(0,0,0,0.45)'
                            : '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    )}
                    <button
                      onClick={handlePlay}
                      className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-white text-xs font-bold uppercase cursor-pointer transition-colors"
                      style={{
                        background: '#3b82f6',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play
                    </button>
                  </>
                )}
              </div>

              {/* Remove from Gallery */}
              {canShowUnpublish && (
                <button
                  onClick={handleUnpublish}
                  disabled={isUnpublishing}
                  className="w-full h-10 mt-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase cursor-pointer transition-colors disabled:opacity-50"
                  style={{
                    background: '#2f3137',
                    color: '#eaedf1',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isUnpublishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  Remove from Gallery
                </button>
              )}
            </div>

            {/* Right Column */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header banner — gradient from HTML */}
              <div
                className="relative flex-shrink-0 overflow-hidden"
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%)',
                  borderTop: '1px solid rgba(255,255,255,0.20)',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.3)',
                }}
              >
                {/* Gloss sheen overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.00) 30%)' }}
                />
                <h1 className="relative m-0 text-4xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>
                  {title || "Untitled Story"}
                </h1>
              </div>

              {/* Scrollable content */}
              <ScrollArea className="flex-1" thumbClassName="bg-black">
                <div style={{ padding: '24px 48px 32px 32px' }}>
                  {/* Ratings + Stats */}
                  <div style={{ paddingRight: '32px' }}>
                    {/* Star + Spice ratings */}
                    {!isOwned && reviewCount > 0 && (
                      <div className="flex items-center gap-4" style={{ marginTop: '6px' }}>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Story</span>
                          <StarRating rating={Math.round(avgRating * 2) / 2} size={16} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Spice</span>
                          <SpiceRating rating={Math.round((reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.spice_level, 0) / reviews.length : 0) * 2) / 2} size={16} />
                        </div>
                      </div>
                    )}

                    {/* Stats row */}
                    {!isOwned && (
                      <div className="flex items-center gap-4" style={{ marginTop: '6px' }}>
                        <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                          <Eye className="w-3.5 h-3.5" />
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatCount(viewCount)}</span>
                        </div>
                        <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                          <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-rose-400 text-rose-400")} />
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatCount(likeCount)}</span>
                        </div>
                        <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                          <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-amber-400 text-amber-400")} />
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatCount(saveCount)}</span>
                        </div>
                        <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                          <Play className="w-3.5 h-3.5" />
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatCount(playCount)}</span>
                        </div>
                      </div>
                    )}

                    {/* Creator — inset surface card from HTML */}
                    {publisher && !isOwned && (
                      <button
                        onClick={() => {
                          if (publisherId) {
                            onOpenChange(false);
                            navigate(`/creator/${publisherId}`);
                          }
                        }}
                        className="flex items-center gap-2.5 group"
                        style={{
                          marginTop: '16px',
                          background: '#2f3137',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:ring-2 group-hover:ring-[#4a5f7f] transition-all" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                          {publisher.avatar_url ? (
                            <img
                              src={publisher.avatar_url}
                              alt={publisher.display_name || publisher.username || 'Creator'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', fontWeight: 700 }}>
                              {(publisher.display_name || publisher.username)?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <p className="m-0" style={{ fontSize: '13px', color: 'rgba(248,250,252,0.8)' }}>
                          Created by: <strong style={{ fontWeight: 600 }}>{publisher.display_name || publisher.username || 'Anonymous'}</strong>
                        </p>
                      </button>
                    )}

                    {/* Status badges row */}
                    {(isPublished || allowRemix) && (
                      <div className="flex items-center gap-2 mt-1">
                        {isOwned && isPublished && (
                          <span className="inline-flex w-fit px-2.5 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">
                            PUBLISHED
                          </span>
                        )}
                        {allowRemix && (
                          <span className="inline-flex w-fit px-2.5 py-1 bg-purple-500/20 rounded-lg text-xs font-bold text-purple-400">
                            EDITABLE
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Synopsis */}
                  <div style={{ marginTop: '24px' }}>
                    <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Synopsis</p>
                    <p className="m-0 whitespace-pre-wrap" style={{ fontSize: '13px', color: 'rgba(248,250,252,0.8)', lineHeight: 1.6 }}>
                      {description || "No description provided."}
                    </p>
                  </div>

                  {/* Content themes grid */}
                  {hasContentThemes && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '32px' }}>
                        {contentThemes.genres.length > 0 && (
                          <div>
                            <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Genre</p>
                            <p className="m-0" style={{ fontSize: '13px', color: 'rgba(248,250,252,0.8)' }}>{contentThemes.genres.join(', ')}</p>
                          </div>
                        )}
                        {contentThemes.characterTypes.length > 0 && (
                          <div>
                            <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Character Types</p>
                            <p className="m-0" style={{ fontSize: '13px', color: 'rgba(248,250,252,0.8)' }}>{contentThemes.characterTypes.join(', ')}</p>
                          </div>
                        )}
                        {contentThemes.origin.length > 0 && (
                          <div>
                            <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Story Origin</p>
                            <p className="m-0" style={{ fontSize: '13px', color: 'rgba(248,250,252,0.8)' }}>{contentThemes.origin.join(', ')}</p>
                          </div>
                        )}
                      </div>

                      {/* Trigger Warnings */}
                      {contentThemes.triggerWarnings.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                          <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Trigger Warnings</p>
                          <p className="m-0" style={{ fontSize: '13px', color: 'rgba(248,250,252,0.8)' }}>{contentThemes.triggerWarnings.join(', ')}</p>
                        </div>
                      )}

                      {/* Custom Tags */}
                      {contentThemes.customTags.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                          <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Custom Tags</p>
                          <p className="m-0" style={{ fontSize: '13px', color: 'rgba(248,250,252,0.8)' }}>{contentThemes.customTags.join(', ')}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Characters */}
                  <div style={{ marginTop: '32px' }}>
                    <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Characters</p>
                    {isLoadingCharacters ? (
                      <div className="flex gap-4" style={{ padding: '4px 0' }}>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="w-14 h-14 rounded-full bg-[#2a2a2f]" />
                            <Skeleton className="w-12 h-3 rounded bg-[#2a2a2f]" />
                          </div>
                        ))}
                      </div>
                    ) : characters.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'rgba(248,250,252,0.3)', fontStyle: 'italic' }}>No characters yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-4" style={{ padding: '4px 0' }}>
                        {characters.slice(0, 8).map((char) => (
                          <div key={char.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div
                              className="group-hover:border-[#3b82f6] transition-all"
                              style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(248,250,252,0.3)', padding: '2px' }}
                            >
                              {char.avatarUrl ? (
                                <img
                                  src={char.avatarUrl}
                                  alt={char.name}
                                  style={{ objectPosition: `${char.avatarPosition.x}% ${char.avatarPosition.y}%` }}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full rounded-full flex items-center justify-center"
                                  style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', color: 'rgba(255,255,255,0.5)', fontSize: '18px', fontWeight: 700 }}
                                >
                                  {char.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="group-hover:text-white transition-colors text-center max-w-[4rem] truncate" style={{ fontSize: '12px', color: 'rgba(248,250,252,0.8)' }}>
                              {char.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reviews */}
                  {!isOwned && publishedScenarioId && (
                    <div style={{ marginTop: '32px' }}>
                      {/* Gradient divider */}
                      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #4a5f7f, transparent)', marginBottom: '24px' }} />

                      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                        <p className="m-0" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reviews ({reviewCount})</p>
                        {user && (
                          <button
                            onClick={() => setIsReviewModalOpen(true)}
                            style={{
                              padding: '6px 12px',
                              background: '#4a5f7f',
                              border: 'none',
                              borderRadius: '999px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {userReview ? 'Edit Review' : 'Leave a Review'}
                          </button>
                        )}
                      </div>

                      {reviews.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No reviews yet. Be the first!</p>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div
                              key={review.id}
                              style={{
                                padding: '12px',
                                borderRadius: '12px',
                                background: '#1c1f26',
                                border: '1px solid #4a5f7f',
                              }}
                            >
                              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex items-center justify-center overflow-hidden flex-shrink-0"
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
                                  >
                                    {review.reviewer?.avatar_url ? (
                                      <img src={review.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                                        {(review.reviewer?.display_name || review.reviewer?.username)?.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{review.reviewer?.display_name || review.reviewer?.username || 'Anonymous'}</span>
                                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Story</span>
                                    <StarRating rating={Math.round(review.raw_weighted_score * 2) / 2} size={16} />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Spice</span>
                                    <SpiceRating rating={review.spice_level} size={16} />
                                  </div>
                                </div>
                              </div>
                              {review.comment && (
                                <p className="m-0" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{review.comment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {hasMoreReviews && (
                        <div className="flex justify-center mt-4">
                          <button
                            onClick={loadMoreReviews}
                            disabled={loadingMoreReviews}
                            className="px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ color: 'rgba(248,250,252,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            {loadingMoreReviews ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'See more reviews'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogPortal>

      {/* Review Modal */}
      {publishedScenarioId && user && (
        <ReviewModal
          open={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          publishedScenarioId={publishedScenarioId}
          userId={user.id}
          existingReview={userReview}
          onReviewSubmitted={loadReviews}
        />
      )}
    </Dialog>
  );
};
