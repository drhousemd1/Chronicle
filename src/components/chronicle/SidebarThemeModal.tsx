import React, { useRef } from "react";
import { UserBackground } from "@/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Card, Button } from "./UI";
import { Icons } from "@/constants";
import { Check, Image } from "lucide-react";

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
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              Sidebar Theme
            </h2>
            <Button 
              variant="ghost" 
              className="text-blue-600 font-black text-xs tracking-widest uppercase h-9" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "+ Upload Image"}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleFileChange} 
            />
          </div>

          {/* Recommended dimensions */}
          <p className="text-xs text-slate-400 mb-6 text-center">
            Recommended: 300px × 1080px (portrait orientation)
          </p>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {/* Default Tile */}
            <button
              type="button"
              onClick={() => onSelectBackground(null)}
              className={`group relative aspect-video rounded-xl overflow-hidden border shadow-sm bg-slate-50 transition-all cursor-pointer ${
                selectedBackgroundId === null 
                  ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-200' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-50" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Image className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Default</span>
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
                className={`group relative aspect-video rounded-xl overflow-hidden border shadow-sm bg-slate-50 cursor-pointer transition-all ${
                  selectedBackgroundId === bg.id 
                    ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-200' 
                    : 'border-slate-200 hover:border-slate-300'
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

          {/* Empty state */}
          {backgrounds.length === 0 && (
            <div className="mt-6 py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest">No themes uploaded</p>
              <p className="text-[10px] mt-1">Upload images to customize your sidebar background.</p>
            </div>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
