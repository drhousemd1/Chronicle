import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './UI';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Share2, Globe, Pencil, Check, Loader2 } from 'lucide-react';
import { getPublishedScenario, publishScenario, unpublishScenario, PublishedScenario } from '@/services/gallery-data';
import { toast } from 'sonner';

interface ShareScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: string;
  scenarioTitle: string;
  userId: string;
}

export const ShareScenarioModal: React.FC<ShareScenarioModalProps> = ({
  isOpen,
  onClose,
  scenarioId,
  scenarioTitle,
  userId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [existingPublication, setExistingPublication] = useState<PublishedScenario | null>(null);
  const [allowRemix, setAllowRemix] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExistingPublication();
    }
  }, [isOpen, scenarioId]);

  const loadExistingPublication = async () => {
    setIsLoading(true);
    try {
      const existing = await getPublishedScenario(scenarioId);
      if (existing) {
        setExistingPublication(existing);
        setAllowRemix(existing.allow_remix);
      } else {
        setExistingPublication(null);
        setAllowRemix(false);
      }
    } catch (error) {
      console.error('Failed to load publication status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishScenario(scenarioId, userId, allowRemix, []);
      toast.success(existingPublication ? 'Publication updated!' : 'Your story is now live in the Gallery!');
      setExistingPublication({
        id: '',
        scenario_id: scenarioId,
        publisher_id: userId,
        allow_remix: allowRemix,
        tags: [],
        like_count: existingPublication?.like_count || 0,
        save_count: existingPublication?.save_count || 0,
        play_count: existingPublication?.play_count || 0,
        view_count: existingPublication?.view_count || 0,
        avg_rating: existingPublication?.avg_rating || 0,
        review_count: existingPublication?.review_count || 0,
        is_published: true,
        created_at: existingPublication?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to publish:', error);
      toast.error(error.message || 'Failed to publish scenario');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsPublishing(true);
    try {
      await unpublishScenario(scenarioId);
      toast.success('Your story has been removed from the Gallery');
      setExistingPublication(null);
    } catch (error: any) {
      console.error('Failed to unpublish:', error);
      toast.error(error.message || 'Failed to unpublish scenario');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2a2a2f] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <Share2 className="w-6 h-6 text-blue-400" />
            Share Your Story
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Story Title */}
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-700">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Publishing</p>
              <p className="text-lg font-bold text-white">{scenarioTitle || 'Untitled Story'}</p>
            </div>

            {/* Remix Permission */}
            <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-xl border border-zinc-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <Label htmlFor="allow-remix" className="text-white font-semibold cursor-pointer">
                  Allow Edits
                  </Label>
                  <p className="text-xs text-zinc-400 mt-0.5">
                  Others can clone and edit their own copy
                  </p>
                </div>
              </div>
              <Switch
                id="allow-remix"
                checked={allowRemix}
                onCheckedChange={setAllowRemix}
              />
            </div>

            {/* What permissions mean */}
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200/80 space-y-1">
                  <p className="font-medium text-blue-300">What others can do:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-200/70">
                    <li>View and play your story</li>
                    <li>Like and save it to their collection</li>
                    {allowRemix && <li className="text-purple-300">Clone and edit their own version</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {existingPublication?.is_published && (
                <Button
                  variant="secondary"
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="flex-1 !bg-rose-500/20 !text-rose-300 !border-rose-500/30 hover:!bg-rose-500/30"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Unpublish
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 !bg-blue-600 hover:!bg-blue-500"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : existingPublication?.is_published ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Globe className="w-4 h-4 mr-2" />
                )}
                {existingPublication?.is_published ? 'Update Publication' : 'Publish to Gallery'}
              </Button>
            </div>

            {existingPublication?.is_published && (
              <div className="flex justify-center gap-6 text-xs text-zinc-500">
                <span>❤️ {existingPublication.like_count} likes</span>
                <span>⭐ {existingPublication.save_count} saves</span>
                <span>▶️ {existingPublication.play_count} plays</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
