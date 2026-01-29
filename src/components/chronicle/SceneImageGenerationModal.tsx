// Scene Image Generation Modal - AI-powered scene generation with style selection
// Generates 4:3 landscape images (1024x768) for the scene gallery

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AVATAR_STYLES, DEFAULT_STYLE_ID } from '@/constants/avatar-styles';
import { cn } from '@/lib/utils';

interface SceneImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, styleId: string) => Promise<void>;
  isGenerating: boolean;
  selectedArtStyle?: string;
}

export const SceneImageGenerationModal: React.FC<SceneImageGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  selectedArtStyle
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(selectedArtStyle || DEFAULT_STYLE_ID);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await onGenerate(prompt.trim(), selectedStyle);
    setPrompt('');
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompt('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Generate Scene Image
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Describe the scene you want to generate. The AI will create a 4:3 landscape image.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Scene Description
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A cozy medieval tavern with warm candlelight, wooden beams, and patrons gathered around tables..."
              rows={4}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Art Style
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  disabled={isGenerating}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200",
                    selectedStyle === style.id
                      ? "border-blue-500 ring-2 ring-blue-500/30 scale-105"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  {style.thumbnailUrl && (
                    <img
                      src={style.thumbnailUrl}
                      alt={style.displayName}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <span className="text-[10px] font-bold text-white leading-tight block truncate">
                      {style.displayName}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Scene'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
