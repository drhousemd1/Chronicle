import React, { useRef, useState } from "react";
import { UserBackground } from "@/types";
import {
  Dialog,
  DialogDescription,
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
import { Slider } from "@/components/ui/slider";

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
  onOverlayChange?: (id: string, color: string, opacity: number) => void;
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
  onOverlayChange,
}: BackgroundPickerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const selectedBg = selectedBackgroundId ? backgrounds.find(bg => bg.id === selectedBackgroundId) : null;
  const overlayColor = selectedBg?.overlayColor || 'black';
  const overlayOpacity = selectedBg?.overlayOpacity ?? 10;

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
      <DialogContent className="w-[min(96vw,1280px)] max-w-none p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Select and manage background images for this page.
        </DialogDescription>
        <div className="bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
          <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),transparent)] bg-[length:100%_30%] bg-no-repeat pointer-events-none" />
            <div className="relative flex items-center gap-2.5 px-5 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span className="text-base font-black text-white uppercase tracking-widest">
                {title}
              </span>
            </div>
          </div>

          <div className="p-5">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />

            <div className="bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Background Library</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isUploading}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border-0 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[#eaedf1] text-xs font-bold leading-none hover:bg-[#44464f] active:bg-[#44464f] transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? "Uploading..." : "+ Upload Background"}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" /> From Device
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsPickerOpen(true)} className="cursor-pointer">
                      <Image className="w-4 h-4 mr-2" /> From Library
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {selectedBackgroundId && onOverlayChange && (
                <div className="mb-5 p-4 rounded-xl border border-black/30 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#a1a1aa] mb-3">Overlay Settings</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#d7d8df]">Color:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOverlayChange(selectedBackgroundId, "black", overlayOpacity)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            overlayColor === "black"
                              ? "border-[#4f7fdc] ring-2 ring-[#4f7fdc]/35"
                              : "border-white/15 hover:border-white/25"
                          } bg-black`}
                        />
                        <button
                          type="button"
                          onClick={() => onOverlayChange(selectedBackgroundId, "white", overlayOpacity)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            overlayColor === "white"
                              ? "border-[#4f7fdc] ring-2 ring-[#4f7fdc]/35"
                              : "border-white/15 hover:border-white/25"
                          } bg-white`}
                        />
                      </div>
                    </div>

                    <div className="min-w-[220px] flex-1 flex items-center gap-3">
                      <span className="text-xs font-bold text-[#d7d8df] whitespace-nowrap">Opacity:</span>
                      <Slider
                        value={[overlayOpacity]}
                        onValueChange={([val]) => onOverlayChange(selectedBackgroundId, overlayColor, val)}
                        min={0}
                        max={80}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-xs font-bold text-[#a1a1aa] w-8 text-right">{overlayOpacity}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => onSelectBackground(null)}
                  className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer transition-all ${
                    selectedBackgroundId === null
                      ? "border-2 border-blue-500"
                      : "border border-white/12 hover:border-white/25"
                  }`}
                >
                  <div className="absolute inset-0 bg-[#1c1c1f] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30)]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Image className="w-8 h-8 text-[#7d8498]" />
                    <span className="text-xs font-bold text-[#aeb6cc] uppercase tracking-widest">Default</span>
                  </div>
                  {selectedBackgroundId === null && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#4f7fdc] rounded-lg flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                {backgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectBackground(bg.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectBackground(bg.id);
                      }
                    }}
                    className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer transition-all ${
                      selectedBackgroundId === bg.id
                        ? "border-2 border-blue-500"
                        : "border border-white/12 hover:border-white/25"
                    }`}
                  >
                    <img src={bg.imageUrl} alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent h-16 opacity-0 group-hover:opacity-100 transition-opacity" />

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
                      <div className="absolute top-2 left-2 w-6 h-6 bg-[#4f7fdc] rounded-lg flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {backgrounds.length === 0 && (
                <div className="col-span-full mt-5 py-12 text-center rounded-2xl bg-[#1c1c1f] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">No backgrounds uploaded</p>
                  <p className="text-sm mt-1 text-zinc-500">Upload images to customize your page background.</p>
                </div>
              )}
            </div>
          </div>

          <ImageLibraryPickerModal
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onSelect={(url) => {
              onSelectBackground(url as any);
              setIsPickerOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
