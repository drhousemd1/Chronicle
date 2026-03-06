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
      <AlertDialogContent className="rounded-2xl bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)] max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[hsl(var(--ui-text))] text-base font-bold">
            {title || <>Are you sure you want to <span className="text-[hsl(var(--destructive))]">Delete</span> this?</>}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[hsl(var(--ui-text-muted))] text-sm leading-relaxed">
            {message || 'This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="rounded-xl bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] hover:bg-[hsl(240_6%_22%)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-2xl bg-[hsl(var(--destructive))] hover:brightness-110 text-[hsl(var(--destructive-foreground))] border-0 h-10 px-6 text-[10px] font-bold uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)]"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
