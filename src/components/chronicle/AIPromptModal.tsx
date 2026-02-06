import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, useExistingDetails: boolean) => void;
  mode: 'fill' | 'generate';
  isProcessing: boolean;
}

export function AIPromptModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  isProcessing,
}: AIPromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [useExistingDetails, setUseExistingDetails] = useState(true);

  const handleSubmit = () => {
    onSubmit(prompt, useExistingDetails);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setPrompt("");
      onClose();
    }
  };

  const title = mode === 'fill' ? 'AI Fill Character' : 'AI Generate Character';
  const description = mode === 'fill' 
    ? 'Provide guidance for filling in empty fields. The AI will generate text only for fields that are currently empty.'
    : 'Provide guidance for generating new categories and filling empty fields. The AI will add new trait sections and fill all empty text fields.';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[hsl(var(--ui-surface))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))]">
        <DialogHeader className="bg-[#4a5f7f] -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b border-white/20">
          <DialogTitle className="flex items-center gap-2 text-white text-lg font-bold">
            <Sparkles className="w-5 h-5 text-cyan-200" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Character Description (Optional)
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the character you want to create. For example: A mysterious elven mage with a dark past, secretive and distrustful of strangers..."
              className="min-h-[120px] bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-zinc-500">
              Leave empty to let AI generate based on existing details and world context.
            </p>
          </div>

          {/* Use Existing Details Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-zinc-900/30 rounded-lg border border-white/5">
            <Checkbox
              id="useExistingDetails"
              checked={useExistingDetails}
              onCheckedChange={(checked) => setUseExistingDetails(checked === true)}
              className="mt-0.5 border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <div className="space-y-1">
              <label
                htmlFor="useExistingDetails"
                className="text-sm font-medium text-white cursor-pointer"
              >
                Use all details currently in character card
              </label>
              <p className="text-xs text-zinc-500">
                When checked, the AI will heavily consider existing character information for consistency. When unchecked, the AI will focus primarily on your prompt.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {/* Cancel Button - Standard dark surface style */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="flex h-10 px-6 items-center justify-center gap-2
              rounded-xl border border-[hsl(var(--ui-border))] 
              bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
              hover:bg-white/5 active:bg-white/10 disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
              transition-colors"
          >
            Cancel
          </button>

          {/* Submit Button - Premium iridescent style */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="group relative flex h-10 px-6 rounded-xl overflow-hidden
              text-white text-[10px] font-bold leading-none uppercase tracking-wider
              shadow-[0_12px_40px_rgba(0,0,0,0.45)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45
              disabled:opacity-50"
          >
            {/* Layer 1: Iridescent outer border ring */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)",
                filter:
                  "drop-shadow(0 0 10px rgba(255,255,255,0.10)) drop-shadow(0 0 18px rgba(109,94,247,0.10)) drop-shadow(0 0 18px rgba(34,184,200,0.10))",
              }}
            />

            {/* Layer 2: Mask to create 2px border effect */}
            <span
              aria-hidden
              className="absolute inset-[2px] rounded-[10px]"
              style={{ background: "#2B2D33" }}
            />

            {/* Layer 3: Button surface with gradient */}
            <span
              aria-hidden
              className="absolute inset-[2px] rounded-[10px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33",
              }}
            />

            {/* Layer 4: Soft top sheen */}
            <span
              aria-hidden
              className="absolute inset-[2px] rounded-[10px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))",
              }}
            />

            {/* Layer 5: Border sheen (top-left diagonal) */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.22)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.00) 55%)",
                mixBlendMode: "screen",
              }}
            />

            {/* Layer 6: Teal bloom (top-left) */}
            <span
              aria-hidden
              className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)",
              }}
            />

            {/* Layer 7: Purple bloom (bottom-right) */}
            <span
              aria-hidden
              className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)",
              }}
            />

            {/* Layer 8: Crisp inner edge */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            />

            {/* Content layer */}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles 
                className="w-3.5 h-3.5 shrink-0 text-cyan-200" 
                style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }}
              />
              <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
                {isProcessing ? "Processing..." : mode === 'fill' ? "Fill Empty Fields" : "Generate Character"}
              </span>
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
