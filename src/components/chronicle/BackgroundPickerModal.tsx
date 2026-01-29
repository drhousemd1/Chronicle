import React, { useRef, useState } from "react";
import { UserBackground } from "@/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Card, Button } from "./UI";
import { Icons } from "@/constants";
import { Check, Image, ChevronDown, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageLibraryPickerModal } from "./ImageLibraryPickerModal";

interface BackgroundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  selectedBackgroundId: string | null; // null = default
  backgrounds: UserBackground[];
  onSelectBackground: (id: string | null) => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string, imageUrl: string) => void;
  isUploading: boolean;
}

export function BackgroundPickerModal({
  isOpen,
  onClose,
  title = "Your Backgrounds",
  selectedBackgroundId,
  backgrounds,
  onSelectBackground,
  onUpload,
  onDelete,
  isUploading,
}: BackgroundPickerModalProps) {
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
      <DialogContent className="sm:max-w-2xl p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
          {/* Header - matches Scene Gallery exactly */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              {title}
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-blue-600 font-black text-xs tracking-widest uppercase h-9 gap-1" disabled={isUploading}>
                  {isUploading ? "Uploading..." : "+ Upload Background"} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white z-50">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" /> From Device
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPickerOpen(true)} className="cursor-pointer">
                  <Image className="w-4 h-4 mr-2" /> From Library
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            <ImageLibraryPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={(url) => { onSelectBackground(url as any); setIsPickerOpen(false); }} />
          </div>

          {/* Grid - matches Scene Gallery layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {/* Default Tile - special styling */}
            <button
              type="button"
              onClick={() => onSelectBackground(null)}
              className={`group relative aspect-video rounded-xl overflow-hidden border shadow-sm bg-slate-50 transition-all cursor-pointer ${
                selectedBackgroundId === null 
                  ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-200' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Subtle gradient preview matching actual default bg */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-50" />
              
              {/* Centered label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Image className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Default</span>
              </div>

              {/* Selected indicator - blue check */}
              {selectedBackgroundId === null && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>

            {/* Uploaded backgrounds - same card styling as Scene Gallery */}
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                onClick={() => onSelectBackground(bg.id)}
                className={`group relative aspect-video rounded-xl overflow-hidden border shadow-sm bg-slate-50 cursor-pointer transition-all ${
                  selectedBackgroundId === bg.id 
                    ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-200' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img src={bg.imageUrl} alt="Background" className="w-full h-full object-cover" />
                
                {/* Hover overlay with gradient - like Scene Gallery */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent h-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Delete button - rose-500 like Scene Gallery */}
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

                {/* Selected indicator */}
                {selectedBackgroundId === bg.id && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty state - matches Scene Gallery style */}
          {backgrounds.length === 0 && (
            <div className="mt-6 py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest">No backgrounds uploaded</p>
              <p className="text-[10px] mt-1">Upload images to customize your page background.</p>
            </div>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
