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
      <AlertDialogContent className="rounded-xl bg-[hsl(var(--ui-surface))] border border-[hsl(var(--ui-border))] shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[hsl(var(--ui-text))] text-base font-bold">
            {title || <>Are you sure you want to <span className="text-red-400">Delete</span> this?</>}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[hsl(var(--ui-text-muted))] text-sm">
            {message || 'This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="rounded-xl bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] hover:bg-[hsl(var(--ui-surface-2))]/80 h-10 px-6 text-[10px] font-bold uppercase tracking-wider shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-0 h-10 px-6 text-[10px] font-bold uppercase tracking-wider shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
