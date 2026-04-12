import React, { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { StarRating } from './StarRating';
import { SpiceRating } from './SpiceRating';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { REVIEW_CATEGORIES } from '@/services/review-ratings';
import { submitReview, deleteReview, type ScenarioReview } from '@/services/gallery-data';

const OPTIONAL_FEEDBACK_CATEGORY_KEYS = new Set([
  'conceptStrength',
  'motivationTension',
  'worldbuildingVibe',
  'replayability',
  'characterDetailsComplexity',
]);

const OPTIONAL_FEEDBACK_CATEGORIES = REVIEW_CATEGORIES.filter((category) =>
  OPTIONAL_FEEDBACK_CATEGORY_KEYS.has(category.key),
);

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishedScenarioId: string;
  userId: string;
  storyType?: 'SFW' | 'NSFW' | null;
  existingReview?: ScenarioReview | null;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  onOpenChange,
  publishedScenarioId,
  userId,
  storyType = null,
  existingReview,
  onReviewSubmitted,
}) => {
  const [storyRating, setStoryRating] = useState(0);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState<Record<string, number>>({});
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const showSpiceRating = storyType !== 'SFW';
  const canSubmit = storyRating >= 1 || spiceLevel >= 1;

  // Pre-fill from existing review
  useEffect(() => {
    if (existingReview) {
      const existingDetailedRatings: Record<string, number> = {};
      OPTIONAL_FEEDBACK_CATEGORIES.forEach((category) => {
        const value = existingReview[category.dbColumn as keyof ScenarioReview];
        if (typeof value === 'number' && value >= 1) {
          existingDetailedRatings[category.key] = value;
        }
      });
      const existingStoryRating = existingReview.raw_weighted_score || 0;
      const isLegacyMirroredDetailedFeedback =
        existingStoryRating >= 1 &&
        OPTIONAL_FEEDBACK_CATEGORIES.length > 0 &&
        OPTIONAL_FEEDBACK_CATEGORIES.every((category) => existingDetailedRatings[category.key] === existingStoryRating);

      setStoryRating(existingStoryRating);
      setSpiceLevel(existingReview.spice_level || 0);
      setDetailedRatings(isLegacyMirroredDetailedFeedback ? {} : existingDetailedRatings);
      // Keep Additional Feedback collapsed by default. Legacy mirrored category ratings
      // should not surface as if the reviewer intentionally filled them out.
      setShowDetailedFeedback(false);
      setComment(existingReview.comment || '');
    } else {
      setStoryRating(0);
      setSpiceLevel(0);
      setDetailedRatings({});
      setShowDetailedFeedback(false);
      setComment('');
    }
  }, [existingReview, open]);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitReview(publishedScenarioId, userId, {
        storyRating: storyRating >= 1 ? storyRating : null,
        spiceLevel: spiceLevel >= 1 ? spiceLevel : null,
        detailedRatings,
        comment,
      });
      
      onReviewSubmitted();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to submit review:', err);
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteReview(publishedScenarioId, userId);
      
      onReviewSubmitted();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to delete review:', err);
      console.error('Failed to delete review:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
          {/* Outside-click dismissal should only close the top-most review modal and return
              the user to StoryDetailModal. Do not let this bubble into the parent modal. */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(event) => {
              if (event.target !== event.currentTarget) {
                return;
              }
              event.stopPropagation();
              onOpenChange(false);
            }}
          >
            <div
              className="relative flex w-full max-w-[680px] min-h-0 flex-col overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]"
              style={{ height: 'min(760px, calc(100vh - 2rem))' }}
              onClick={(event) => event.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
                <div
                  className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40"
                  style={{ height: '60%' }}
                />
                <div className="relative z-[1] flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.015em] text-white">
                      Rate This Scenario
                    </h2>
                    <p className="mt-1 text-sm text-white/75">
                      Leave a quick rating first, then expand additional feedback if you want to share more detail.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-2 text-white/65 transition-colors hover:bg-black/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
                <div className="space-y-5 p-4 sm:p-5">
                  <div className="rounded-2xl bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1f] p-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)]">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Quick Rating</p>
                        <p className="mt-2 text-base font-bold text-white">How would you rate the story?</p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                          Pick 1 to 5 stars. This is the main story rating.
                        </p>
                        <StarRating
                          rating={storyRating}
                          interactive
                          onChange={setStoryRating}
                          size={24}
                          className="mt-4 gap-1.5"
                        />
                      </div>

                      {showSpiceRating && (
                        <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1f] p-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)]">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Optional Spice</p>
                          <p className="mt-2 text-base font-bold text-white">How spicy is it?</p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                            Flames are optional, so you can skip this for non-spicy stories.
                          </p>
                          <SpiceRating
                            rating={spiceLevel}
                            interactive
                            onChange={setSpiceLevel}
                            size={24}
                            className="mt-4 gap-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] sm:p-5">
                    <Collapsible open={showDetailedFeedback} onOpenChange={setShowDetailedFeedback}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#1c1c1f] px-4 py-3 text-left shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] transition-colors hover:bg-[#202026]">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Additional Feedback</p>
                          <p className="mt-1 text-base font-bold text-white">Optional category ratings</p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                            Expand this if you want to leave more detailed feedback for the creator.
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${showDetailedFeedback ? 'rotate-180' : ''}`}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="space-y-3">
                          {OPTIONAL_FEEDBACK_CATEGORIES.map((category) => (
                            <div
                              key={category.key}
                              className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#1c1c1f] px-4 py-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-white">{category.label}</p>
                                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{category.description}</p>
                              </div>
                              <StarRating
                                rating={detailedRatings[category.key] || 0}
                                interactive
                                onChange={(value) => setDetailedRatings((prev) => ({ ...prev, [category.key]: value }))}
                                size={20}
                                className="gap-1"
                              />
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <div className="rounded-2xl bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] sm:p-5">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Optional Comment</p>
                    <p className="mt-2 text-base font-bold text-white">Leave a note</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      If you want, you can also leave a short comment for the creator here.
                    </p>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What worked well? Anything you'd want more of? This is optional."
                      className="mt-4 min-h-[120px] resize-none rounded-xl border border-black/35 bg-[#1c1c1f] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 border-t border-white/[0.08] p-4 sm:p-5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 text-sm font-bold leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.22)] transition-all hover:brightness-105 active:scale-[0.99] active:brightness-95 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/70"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {existingReview ? 'Update Review' : 'Submit Review'}
                </button>
                {existingReview && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-0 bg-[#3c3e47] px-5 text-sm font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/70"
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Delete Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogPortal>
      </Dialog>

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete your review?"
        message="Your quick rating, additional feedback, and optional comment will be permanently removed."
      />
    </>
  );
};
