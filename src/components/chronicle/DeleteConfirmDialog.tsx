import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  message?: string;
  title?: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  message,
  title,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[min(94vw,640px)] max-w-none border-0 bg-transparent p-0 shadow-none gap-0">
        <div className="overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
          <div className="relative overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
            <div
              className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40"
              style={{ height: '60%' }}
            />
            <AlertDialogTitle className="relative z-[1] text-xl font-bold tracking-[-0.015em] text-white">
              {title || <>Are you sure you want to <span className="text-[#ffd2cf]">delete</span> this?</>}
            </AlertDialogTitle>
          </div>

          <div className="p-4 sm:p-5">
            <div className="rounded-2xl bg-[#2e2e33] p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
              <AlertDialogHeader className="space-y-0 text-left">
                <AlertDialogDescription className="text-base leading-relaxed text-zinc-300">
                  {message || 'This cannot be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-5 gap-2 sm:gap-2">
                <AlertDialogCancel className="mt-0 inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#3c3e47] px-5 text-xs font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/70 focus-visible:ring-offset-0">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirm}
                  className="inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#d94b45] px-5 text-xs font-bold leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#e2554e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/70 focus-visible:ring-offset-0"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
