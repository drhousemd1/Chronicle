import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AVATAR_STYLES, DEFAULT_STYLE_ID, getStyleById } from "@/constants/avatar-styles";

interface CoverImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (imageUrl: string) => void;
  scenarioTitle?: string;
}

export const CoverImageGenerationModal: React.FC<CoverImageGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
  scenarioTitle,
}) => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState(DEFAULT_STYLE_ID);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your cover image.");
      return;
    }

    const selectedStyle = getStyleById(selectedStyleId);
    if (!selectedStyle) {
      setError("Please select an art style.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-cover-image",
        {
          body: {
            prompt: prompt.trim(),
            stylePrompt: selectedStyle.backendPrompt,
            negativePrompt: negativePrompt.trim() || undefined,
            scenarioTitle: scenarioTitle || undefined,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || "Failed to generate cover image");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        onGenerated(data.imageUrl);
        // Reset state on success
        setPrompt("");
        setNegativePrompt("");
        setSelectedStyleId(DEFAULT_STYLE_ID);
      } else {
        throw new Error("No image was generated");
      }
    } catch (err) {
      console.error("Cover image generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate cover image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Wand2 className="w-5 h-5" />
            Generate Cover Image
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Prompt Section */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Prompt
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your cover image... (e.g., A mystical forest at twilight with ancient ruins)"
              className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Cover images work best with a 2:3 portrait aspect ratio. Include setting, mood, and key visual elements.
            </p>
          </div>

          {/* Negative Prompt (Collapsible) */}
          <Collapsible open={showNegativePrompt} onOpenChange={setShowNegativePrompt}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  showNegativePrompt && "rotate-180"
                )}
              />
              <span className="text-xs font-medium uppercase tracking-wider">
                Negative Prompt (optional)
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Describe what you want to avoid..."
                className="min-h-[80px] resize-none bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Styles Section */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Style
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyleId(style.id)}
                  className={cn(
                    "relative rounded-xl p-2 transition-all duration-200 cursor-pointer outline-none",
                    "bg-card hover:bg-accent/50",
                    selectedStyleId === style.id
                      ? "ring-2 ring-blue-400 shadow-md"
                      : "ring-1 ring-border hover:ring-slate-300",
                    "focus:ring-2 focus:ring-blue-100 focus:ring-offset-0"
                  )}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={style.thumbnailUrl}
                      alt={style.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-semibold text-center mt-2 text-foreground">
                    {style.displayName}
                  </p>
                  {selectedStyleId === style.id && (
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

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
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
                Generate Cover
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
