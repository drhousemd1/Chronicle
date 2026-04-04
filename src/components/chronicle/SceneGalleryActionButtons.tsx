import React, { useState } from "react";
import { Sparkles, Upload, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageLibraryPickerModal } from "./ImageLibraryPickerModal";

interface SceneGalleryActionButtonsProps {
  onUploadFromDevice: () => void;
  onSelectFromLibrary: (imageUrl: string) => void;
  onGenerateClick: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isUploading?: boolean;
}

export function SceneGalleryActionButtons({
  onUploadFromDevice,
  onSelectFromLibrary,
  onGenerateClick,
  disabled = false,
  isGenerating = false,
  isUploading = false,
}: SceneGalleryActionButtonsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isDisabled = disabled || isUploading;

  return (
    <>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              className="flex h-10 w-full items-center justify-center gap-2 px-4 sm:w-auto
                rounded-xl border-0
                bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]
                text-[#eaedf1] text-xs font-bold leading-none
                hover:bg-[#44464f] active:bg-[#44464f] disabled:opacity-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
                transition-colors"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{isUploading ? "Uploading..." : "Upload Image"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
          >
            <DropdownMenuItem
              onClick={onUploadFromDevice}
              className="cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 mr-2" />
              From Device
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsPickerOpen(true)}
              className="cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 mr-2" />
              From Library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={onGenerateClick}
          disabled={isDisabled || isGenerating}
           className="group relative flex h-10 w-full items-center justify-center px-4 rounded-xl overflow-hidden sm:w-auto
            text-white text-xs font-bold leading-none
            shadow-[0_12px_40px_rgba(0,0,0,0.45)]
            hover:brightness-125 transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45
            disabled:opacity-50"
        >
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

          <span
            aria-hidden
            className="absolute inset-[2px] rounded-[10px]"
            style={{ background: "#2B2D33" }}
          />

          <span
            aria-hidden
            className="absolute inset-[2px] rounded-[10px]"
            style={{
              background:
                "linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33",
            }}
          />

          <span
            aria-hidden
            className="absolute inset-[2px] rounded-[10px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))",
            }}
          />

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

          <span
            aria-hidden
            className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)",
            }}
          />

          <span
            aria-hidden
            className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)",
            }}
          />

          <span
            aria-hidden
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          />

          <span className="relative z-10 flex items-center justify-center gap-2">
            <Sparkles
              className="w-3.5 h-3.5 shrink-0 text-cyan-200"
              style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }}
            />
            <span className="whitespace-nowrap drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
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
