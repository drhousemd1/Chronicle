
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/components/ui/dialog';

import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { StarRating } from './StarRating';
import { SpiceRating } from './SpiceRating';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { REVIEW_CATEGORIES, computeOverallRating, CreatorReviewRatings } from '@/services/review-ratings';
import { submitReview, deleteReview, type ScenarioReview } from '@/services/gallery-data';


interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishedScenarioId: string;
  userId: string;
  existingReview?: ScenarioReview | null;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  onOpenChange,
  publishedScenarioId,
  userId,
  existingReview,
  onReviewSubmitted,
}) => {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pre-fill from existing review
  useEffect(() => {
    if (existingReview) {
      const existingRatings: Record<string, number> = {};
      REVIEW_CATEGORIES.forEach(cat => {
        const val = (existingReview as any)[cat.dbColumn];
        if (val) existingRatings[cat.key] = val;
      });
      setRatings(existingRatings);
      setSpiceLevel(existingReview.spice_level || 0);
      setComment(existingReview.comment || '');
    } else {
      setRatings({});
      setSpiceLevel(0);
      setComment('');
    }
  }, [existingReview, open]);

  const allRated = REVIEW_CATEGORIES.every(cat => ratings[cat.key] >= 1) && spiceLevel >= 1;

  const overallScore = computeOverallRating(ratings as Partial<CreatorReviewRatings>);

  const handleSubmit = async () => {
    if (!allRated || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitReview(publishedScenarioId, userId, ratings as any, spiceLevel, comment, overallScore!.raw);
      
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-xl max-h-[90vh] bg-[#121214] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Rate This Scenario</h2>
                <button onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-5 space-y-4">
                  {/* Rating categories */}
                  {REVIEW_CATEGORIES.map((cat) => (
                    <div key={cat.key} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{cat.label}</p>
                        <p className="text-sm text-white/40 leading-tight">{cat.description}</p>
                      </div>
                      <StarRating
                        rating={ratings[cat.key] || 0}
                        interactive
                        onChange={(val) => setRatings(prev => ({ ...prev, [cat.key]: val }))}
                        size={22}
                      />
                    </div>
                  ))}

                  {/* Spice Level */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Spice Level</p>
                        <p className="text-sm text-white/40">How spicy/erotic is this story?</p>
                      </div>
                      <SpiceRating
                        rating={spiceLevel}
                        interactive
                        onChange={setSpiceLevel}
                        size={22}
                      />
                    </div>
                  </div>

                  {/* Overall Score Preview */}
                  {overallScore && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/40 font-bold uppercase tracking-wider">Overall</span>
                        <StarRating rating={overallScore.display} size={16} />
                        <span className="text-sm text-white/60">{overallScore.display.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  <div className="pt-2">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts... (optional)"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] resize-none"
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10 flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!allRated || isSubmitting}
                  className="flex-1 h-11 bg-[#4a5f7f] hover:bg-[#3d5170] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {existingReview ? 'Update Review' : 'Submit Review'}
                </button>
                {existingReview && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="flex-1 h-11 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
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
        message="Your ratings and comment will be permanently removed."
      />
    </>
  );
};
