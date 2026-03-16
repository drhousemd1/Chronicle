import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
      <DialogContent
        className="sm:max-w-[500px] overflow-hidden flex flex-col bg-[#2a2a2f] rounded-3xl border-none p-0 [&>button:last-child]:hidden"
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
            <Sparkles className="w-4 h-4 text-cyan-200" />
            {title}
          </DialogTitle>
          <DialogDescription className="relative z-[1] text-white/70 text-xs mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="p-3.5">
          <div
            className="bg-[#2e2e33] rounded-2xl p-4 space-y-4"
            style={{ boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)' }}
          >
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                Character Description (Optional)
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the character you want to create. For example: A mysterious elven mage with a dark past, secretive and distrustful of strangers..."
                className="min-h-[120px] resize-none bg-[#1c1c1f] border-t border-black/35 border-b-0 border-x-0 rounded-lg text-[#eaedf1] placeholder:text-zinc-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.40)' }}
              />
              <p className="text-xs text-zinc-500">
                Leave empty to let AI generate based on existing details and world context.
              </p>
            </div>

            {/* Use Existing Details Checkbox */}
            <div
              className="flex items-start gap-3 p-3 bg-[#1c1c1f] rounded-lg"
              style={{ boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.30)' }}
            >
              <Checkbox
                id="useExistingDetails"
                checked={useExistingDetails}
                onCheckedChange={(checked) => setUseExistingDetails(checked === true)}
                className="mt-0.5 border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <div className="space-y-1">
                <label
                  htmlFor="useExistingDetails"
                  className="text-sm font-medium text-[#eaedf1] cursor-pointer"
                >
                  Use all details currently in character card
                </label>
                <p className="text-xs text-zinc-500">
                  When checked, the AI will heavily consider existing character information for consistency. When unchecked, the AI will focus primarily on your prompt.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="h-9 px-5 rounded-[10px] bg-[#3c3e47] text-[#eaedf1] text-[11px] font-black transition-all active:scale-95 disabled:opacity-50"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)' }}
              >
                Cancel
              </button>

              {/* Submit Button - Iridescent style preserved */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing}
                className="group relative flex h-9 px-5 rounded-[10px] overflow-hidden text-white text-[11px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 disabled:opacity-50"
                style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}
              >
                {/* Layer 1: Iridescent outer border ring */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[10px]"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)',
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.10)) drop-shadow(0 0 18px rgba(109,94,247,0.10)) drop-shadow(0 0 18px rgba(34,184,200,0.10))',
                  }}
                />
                <span aria-hidden className="absolute inset-[2px] rounded-[8px]" style={{ background: '#2B2D33' }} />
                <span aria-hidden className="absolute inset-[2px] rounded-[8px]" style={{ background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33' }} />
                <span aria-hidden className="absolute inset-[2px] rounded-[8px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))' }} />
                <span aria-hidden className="absolute inset-0 rounded-[10px] pointer-events-none" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.22)', background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.00) 55%)', mixBlendMode: 'screen' }} />
                <span aria-hidden className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)' }} />
                <span aria-hidden className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)' }} />
                <span aria-hidden className="absolute inset-0 rounded-[10px] pointer-events-none" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)' }} />

                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-200" style={{ filter: 'drop-shadow(0 0 10px rgba(34,184,200,0.35))' }} />
                  <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
                    {isProcessing ? "Processing..." : mode === 'fill' ? "Fill Empty Fields" : "Generate Character"}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
