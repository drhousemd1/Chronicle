import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';

interface GalleryNsfwAgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const GalleryNsfwAgeModal: React.FC<GalleryNsfwAgeModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            onOpenChange(false);
          }}
        >
          <div
            className="relative w-full max-w-[640px] overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
              <div
                className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40"
                style={{ height: '60%' }}
              />
              <div className="relative z-[1] flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b9392f] text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]">
                    18+
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.015em] text-white">
                      Confirm Your Age
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close age confirmation"
                  className="rounded-lg p-2 text-white/65 transition-colors hover:bg-black/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="rounded-2xl bg-[#2e2e33] p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                  You may encounter sensitive or adult content when NSFW is enabled. Please confirm that you are 18 years or older to continue.
                </p>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border-0 bg-[#3c3e47] px-5 text-sm font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/70"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="inline-flex h-11 items-center justify-center rounded-xl border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 text-sm font-bold leading-none text-white shadow-[0_10px_24px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.22)] transition-all hover:brightness-105 active:scale-[0.99] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/70"
                  >
                    I&apos;m Over 18
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
};
