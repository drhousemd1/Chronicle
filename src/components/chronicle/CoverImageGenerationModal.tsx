import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useArtStyles } from "@/contexts/ArtStylesContext";
import { trackAiUsageEvent } from "@/services/usage-tracking";
import { buildRequiredPresence, trackApiValidationSnapshot } from "@/services/api-usage-validation";

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
  const { styles: AVATAR_STYLES, defaultStyleId, getStyleById } = useArtStyles();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState(defaultStyleId);
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
      void trackApiValidationSnapshot({
        eventKey: "validation.single.cover_image",
        eventSource: "cover-image-modal",
        apiCallGroup: "single_call",
        parentRowId: "summary.single.cover_image",
        detailPresence: buildRequiredPresence([
          ["single.cover_image.prompt", prompt.trim()],
          ["single.cover_image.style_prompt", selectedStyle.backendPrompt],
        ]),
        diagnostics: {
          hasNegativePrompt: Boolean(negativePrompt.trim()),
          scenarioTitle: scenarioTitle || null,
        },
      });

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
        void trackAiUsageEvent({
          eventType: "cover_image_generated",
          eventSource: "cover-image-modal",
          metadata: {
            scenarioTitle: scenarioTitle || null,
          },
        });

        onGenerated(data.imageUrl);
        setPrompt("");
        setNegativePrompt("");
        setSelectedStyleId(defaultStyleId);
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
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#2a2a2f] rounded-3xl border-none p-0 [&>button:last-child]:hidden"
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.55), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)' }}
      >
        {/* Gradient Header */}
        <DialogHeader
          className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.20)', boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)' }}
          />
          <DialogTitle className="relative z-[1] flex items-center gap-2 text-white text-[13px] font-black">
            <Wand2 className="w-4 h-4" />
            Generate Cover Image
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="p-3.5">
          <div
            className="bg-[#2e2e33] rounded-2xl p-4 space-y-4"
            style={{ boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)' }}
          >
            {/* Prompt Section */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                Prompt
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your cover image..."
                className="min-h-[100px] resize-none bg-[#1c1c1f] border border-black/35 rounded-lg text-[#eaedf1] placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.40)' }}
              />
              <p className="text-xs text-zinc-500">
                Tip: Cover images work best with a 2:3 portrait aspect ratio. Include setting, mood, and key visual elements.
              </p>
            </div>

            {/* Negative Prompt (Collapsible) */}
            <Collapsible open={showNegativePrompt} onOpenChange={setShowNegativePrompt}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors w-full">
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    showNegativePrompt && "rotate-180"
                  )}
                />
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                  Negative Prompt (optional)
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <Textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Describe what you want to avoid..."
                  className="min-h-[80px] resize-none bg-[#1c1c1f] border border-black/35 rounded-lg text-[#eaedf1] placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.40)' }}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Styles Section */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyleId(style.id)}
                    className={cn(
                      "relative rounded-[10px] p-[5px] transition-all duration-200 cursor-pointer bg-[#1c1c1f]",
                      selectedStyleId === style.id
                        ? "border-2 border-blue-500"
                        : "border-2 border-transparent hover:border-zinc-600",
                      "focus-visible:outline-none"
                    )}
                    style={selectedStyleId === style.id ? { boxShadow: '0 2px 8px rgba(59,130,246,0.35)' } : undefined}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                      <img
                        src={style.thumbnailUrl}
                        alt={style.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold text-center mt-1.5",
                      selectedStyleId === style.id ? "text-[#eaedf1]" : "text-[#a1a1aa]"
                    )}>
                      {style.displayName}
                    </p>
                    {selectedStyleId === style.id && (
                      <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="h-9 px-5 rounded-[10px] bg-[#3c3e47] text-[#eaedf1] text-[11px] font-black transition-all active:scale-95 disabled:opacity-50"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="h-9 px-5 rounded-[10px] bg-[#3b5ca8] text-white text-[11px] font-black transition-all active:scale-95 disabled:opacity-50 min-w-[140px]"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.20)' }}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate Cover
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
