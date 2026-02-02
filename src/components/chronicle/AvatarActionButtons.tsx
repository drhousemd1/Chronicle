import React, { useState } from "react";
import { Sparkles, Upload, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageLibraryPickerModal } from "./ImageLibraryPickerModal";

interface AvatarActionButtonsProps {
  onUploadFromDevice: () => void;
  onSelectFromLibrary: (imageUrl: string) => void;
  onGenerateClick: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isUploading?: boolean;
}

export function AvatarActionButtons({
  onUploadFromDevice,
  onSelectFromLibrary,
  onGenerateClick,
  disabled = false,
  isGenerating = false,
  isUploading = false,
}: AvatarActionButtonsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isDisabled = disabled || isUploading;

  return (
    <>
      <div className="flex gap-2 w-full">
        {/* Upload Button - Full width dropdown trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              className="flex h-10 w-full min-w-0 items-center justify-center gap-2 px-4
                rounded-xl border border-[hsl(var(--ui-border))] 
                bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none
                hover:bg-white/5 active:bg-white/10 disabled:opacity-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
                transition-colors"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="min-w-0 truncate">{isUploading ? "Uploading..." : "Upload Image"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            className="w-48 bg-[hsl(var(--ui-surface))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-lg z-50"
          >
            <DropdownMenuItem
              onClick={onUploadFromDevice}
              className="cursor-pointer hover:bg-white/10 focus:bg-white/10 text-[10px]"
            >
              <Upload className="w-3.5 h-3.5 mr-2" />
              From Device
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsPickerOpen(true)}
              className="cursor-pointer hover:bg-white/10 focus:bg-white/10 text-[10px]"
            >
              <ImageIcon className="w-3.5 h-3.5 mr-2" />
              From Library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Generate Button - Premium layered design */}
        <button
          type="button"
          onClick={onGenerateClick}
          disabled={isDisabled || isGenerating}
          className="group relative flex w-full min-w-0 h-10 px-4 rounded-xl overflow-hidden
            text-white text-[10px] font-bold leading-none
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
          <span className="relative z-10 flex items-center justify-center gap-2 w-full">
            <Sparkles 
              className="w-3.5 h-3.5 shrink-0 text-cyan-200" 
              style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }}
            />
            <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
              {isGenerating ? "Generating..." : "AI Generate"}
            </span>
          </span>
        </button>
      </div>

      <ImageLibraryPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(imageUrl) => {
          onSelectFromLibrary(imageUrl);
          setIsPickerOpen(false);
        }}
      />
    </>
  );
}
