import React, { useRef } from "react";
import { UserBackground } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Check, Image } from "lucide-react";

interface BackgroundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  selectedBackgroundId,
  backgrounds,
  onSelectBackground,
  onUpload,
  onDelete,
  isUploading,
}: BackgroundPickerModalProps) {
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">Page Background</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {/* Upload Button */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Background Image"}
            </Button>
          </div>

          {/* Background Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Default Tile */}
            <button
              type="button"
              onClick={() => onSelectBackground(null)}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                selectedBackgroundId === null
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Default pattern preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(148, 163, 184, 0.1) 10px,
                    rgba(148, 163, 184, 0.1) 20px
                  )`
                }} />
              </div>
              
              {/* Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Image className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-600">Default</span>
              </div>

              {/* Selected Indicator */}
              {selectedBackgroundId === null && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>

            {/* Uploaded Backgrounds */}
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  selectedBackgroundId === bg.id
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => onSelectBackground(bg.id)}
              >
                {/* Background Image */}
                <img
                  src={bg.imageUrl}
                  alt="Background option"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                {/* Selected Indicator */}
                {selectedBackgroundId === bg.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(bg.id, bg.imageUrl);
                  }}
                  className="absolute top-2 left-2 p-1.5 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {backgrounds.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-4">
              No custom backgrounds yet. Upload an image to get started.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
