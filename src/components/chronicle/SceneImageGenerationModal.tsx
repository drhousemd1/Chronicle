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
import { Wand2 } from 'lucide-react';
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
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Wand2 className="w-5 h-5" />
            Generate Scene Image
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Prompt Section */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Scene Description
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A cozy medieval tavern with warm candlelight, wooden beams, and patrons gathered around tables..."
              className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Tip: The AI will create a 4:3 landscape image. Include setting, lighting, and atmosphere details.
            </p>
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Style Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Art Style
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  disabled={isGenerating}
                  className={cn(
                    "relative rounded-xl p-2 transition-all duration-200 cursor-pointer outline-none",
                    "bg-card hover:bg-accent/50",
                    selectedStyle === style.id
                      ? "ring-2 ring-blue-400 shadow-md"
                      : "ring-1 ring-border hover:ring-slate-300",
                    "focus:ring-2 focus:ring-blue-100 focus:ring-offset-0"
                  )}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {style.thumbnailUrl && (
                      <img
                        src={style.thumbnailUrl}
                        alt={style.displayName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-center mt-2 text-foreground">
                    {style.displayName}
                  </p>
                  {selectedStyle === style.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border">
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
            className="min-w-[140px]"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Generate Scene
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
