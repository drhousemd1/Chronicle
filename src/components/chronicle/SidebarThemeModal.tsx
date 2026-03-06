import React, { useRef, useState } from "react";
import { UserBackground } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/constants";
import { Check, Image, ChevronDown, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageLibraryPickerModal } from "./ImageLibraryPickerModal";

interface SidebarThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBackgroundId: string | null;
  backgrounds: UserBackground[];
  onSelectBackground: (id: string | null) => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string, imageUrl: string) => void;
  isUploading: boolean;
}

export function SidebarThemeModal({
  isOpen,
  onClose,
  selectedBackgroundId,
  backgrounds,
  onSelectBackground,
  onUpload,
  onDelete,
  isUploading,
}: SidebarThemeModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 bg-zinc-900 border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)] [&>button]:hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            Sidebar Theme
          </DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center bg-zinc-700 text-white hover:bg-zinc-600 font-bold text-[10px]0px]0px] tracking-widest uppercase h-9 gap-1 px-3 rounded-lg transition-colors disabled:opacity-50"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "+ Upload Image"} <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-zinc-800 border-white/10 z-50">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-zinc-200 hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white">
                <Upload className="w-4 h-4 mr-2" /> From Device
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsPickerOpen(true)} className="cursor-pointer text-zinc-200 hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white">
                <Image className="w-4 h-4 mr-2" /> From Library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
          <ImageLibraryPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={(url) => { onSelectBackground(url as any); setIsPickerOpen(false); }} />
        </div>

        <div className="px-6 pb-6">
          {/* Recommended dimensions */}
          <p className="text-xs text-zinc-500 mb-6 text-center">
            Recommended: 300px × 1080px (portrait orientation)
          </p>

          {/* Grid */}
          <div className="max-h-[460px] overflow-y-a pt-2uto  pt-2pr-1">
          <div className="grid g5 md:grid-cols-7id-cols-5 gap-3">
            {/* Default Tile */}
            <button
              type="button"
              onClick={() => onSelectBackground(null)}
className={`group relative aspect-[1/3] rounded-xl overflow-hidden border shadow-sm bg-zinc-800/50 transition-all cursor-pointer ${
                selectedBackgroundId === null
                  ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900 border-blue-400/30' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-800/80 to-zinc-800" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Image className="w-8 h-8 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Default</span>
              </div>

              {selectedBackgroundId === null && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>

            {/* Uploaded backgrounds */}
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                onClick={() => onSelectBackground(bg.id)}
className={`group relative aspect-[1/3] rounded-xl overflow-hidden border shadow-sm bg-zinc-800/50 cursor-pointer transition-all ${
                  selectedBackgroundId === bg.id
                    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900 border-blue-400/30' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <img src={bg.imageUrl} alt="Background" className="w-full h-full object-cover" />
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent h-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(bg.id, bg.imageUrl);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                >
                  <Icons.Trash />
                </button>

                {selectedBackgroundId === bg.id && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>

          {/* Empty state */}
          {backgrounds.length === 0 && (
            <div className="mt-6 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-700 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest">No themes uploaded</p>
              <p className="text-[10px] mt-1">Upload images to customize your sidebar background.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
