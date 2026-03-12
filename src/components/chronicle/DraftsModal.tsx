import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Pencil } from 'lucide-react';

export interface DraftEntry {
  id: string;
  title: string;
  savedAt: number;
}

const DRAFT_REGISTRY_KEY = 'draft_registry';

export function getDraftRegistry(): DraftEntry[] {
  try {
    const raw = localStorage.getItem(DRAFT_REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertDraftRegistry(entry: DraftEntry) {
  const registry = getDraftRegistry();
  const idx = registry.findIndex(d => d.id === entry.id);
  if (idx >= 0) {
    registry[idx] = entry;
  } else {
    registry.unshift(entry);
  }
  localStorage.setItem(DRAFT_REGISTRY_KEY, JSON.stringify(registry));
}

export function removeDraftFromRegistry(id: string) {
  const registry = getDraftRegistry().filter(d => d.id !== id);
  localStorage.setItem(DRAFT_REGISTRY_KEY, JSON.stringify(registry));
  try { localStorage.removeItem(`draft_${id}`); } catch (_) { /* ignore */ }
}

interface DraftsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadDraft: (id: string) => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({ open, onOpenChange, onLoadDraft }) => {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  useEffect(() => {
    if (open) {
      setDrafts(getDraftRegistry());
    }
  }, [open]);

  const handleDelete = (id: string) => {
    removeDraftFromRegistry(id);
    setDrafts(getDraftRegistry());
  };

  const handleLoad = (id: string) => {
    onLoadDraft(id);
    onOpenChange(false);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-zinc-900 border border-ghost-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-md p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-white text-base font-bold">Drafts</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 max-h-[50vh] overflow-y-auto">
          {drafts.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No saved drafts yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center gap-3 rounded-xl bg-zinc-800/60 border border-ghost-white px-4 py-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">
                      {draft.title || 'Untitled'}
                    </div>
                    <div className="text-zinc-500 text-xs mt-0.5">
                      {formatDate(draft.savedAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoad(draft.id)}
                    className="flex items-center justify-center h-8 px-3 rounded-lg bg-zinc-700 text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-125 active:brightness-150 transition-all shrink-0"
                  >
                    <Pencil className="w-3 h-3 mr-1.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(draft.id)}
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-ghost-white transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
