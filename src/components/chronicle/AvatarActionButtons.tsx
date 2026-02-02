import React, { useState } from "react";
import { Sparkles, Upload, ChevronDown, Image as ImageIcon } from "lucide-react";
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
      <div className="flex items-stretch gap-2 w-full">
        {/* Upload Split Button */}
        <div className="flex flex-1 min-w-0 h-10 overflow-hidden rounded-2xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            onClick={onUploadFromDevice}
            disabled={isDisabled}
            className="flex flex-1 min-w-0 items-center justify-center gap-2 px-3
              text-[hsl(var(--ui-text))] text-sm font-semibold
              hover:bg-white/5 active:bg-white/10 disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
              transition-colors"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">{isUploading ? "Uploading..." : "Upload"}</span>
          </button>
          <div className="w-px bg-[hsl(var(--ui-border))]" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isDisabled}
                aria-label="Upload options"
                className="flex w-10 items-center justify-center shrink-0
                  text-[hsl(var(--ui-text))] hover:bg-white/5 active:bg-white/10 disabled:opacity-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
                  transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-[hsl(var(--ui-surface))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-lg z-50"
            >
              <DropdownMenuItem
                onClick={onUploadFromDevice}
                className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                From Device
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsPickerOpen(true)}
                className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                From Library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* AI Generate Button */}
        <button
          type="button"
          onClick={onGenerateClick}
          disabled={isDisabled || isGenerating}
          className="relative flex flex-1 min-w-0 h-10 items-center justify-center gap-2 px-3
            rounded-2xl border border-[hsl(var(--ui-border))] overflow-hidden
            text-[hsl(var(--ui-text))] text-sm font-semibold disabled:opacity-50
            shadow-[0_12px_40px_rgba(0,0,0,0.45)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-purple))]/45
            transition-colors"
        >
          {/* Background layers */}
          <span className="absolute inset-0 bg-[hsl(var(--ui-surface-2))]" aria-hidden />
          <span 
            className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--accent-teal)/0.22)] to-[hsl(var(--accent-purple)/0.18)]" 
            aria-hidden 
          />
          {/* Hover glow */}
          <span 
            className="absolute -inset-10 opacity-0 hover:opacity-100 transition-opacity duration-200
              bg-[radial-gradient(circle_at_20%_30%,hsl(var(--accent-teal)/0.25),transparent_55%),radial-gradient(circle_at_80%_60%,hsl(var(--accent-purple)/0.22),transparent_60%)]"
            aria-hidden
          />
          {/* Content */}
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">{isGenerating ? "Generating..." : "AI Generate"}</span>
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
