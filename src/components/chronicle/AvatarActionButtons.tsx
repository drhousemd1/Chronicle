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
      <div className="flex flex-col gap-2 w-full">
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
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
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

        {/* AI Generate Button - Full width */}
        <button
          type="button"
          onClick={onGenerateClick}
          disabled={isDisabled || isGenerating}
          className="relative flex w-full min-w-0 h-10 items-center justify-center gap-2 px-4
            rounded-xl border border-[hsl(var(--ui-border))] overflow-hidden
            text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none disabled:opacity-50
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
          {/* Content */}
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="min-w-0 truncate">{isGenerating ? "Generating..." : "AI Generate"}</span>
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
