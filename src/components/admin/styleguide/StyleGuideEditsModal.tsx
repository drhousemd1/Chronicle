import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Pencil, Check, X } from 'lucide-react';

/* ═══════════════════════ TYPES ═══════════════════════ */
export interface EditEntry {
  id: string;
  cardType: string;
  cardName: string;
  details: Record<string, string>;
  comment: string;
  savedAt: number;
}

/* ═══════════════════════ LOCAL STORAGE HELPERS ═══════════════════════ */
const EDITS_KEY = 'styleguide_edits_registry';
const KEEPS_KEY = 'styleguide_keeps';

export function getEditsRegistry(): EditEntry[] {
  try {
    const raw = localStorage.getItem(EDITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertEdit(entry: EditEntry) {
  const registry = getEditsRegistry();
  const idx = registry.findIndex(d => d.id === entry.id);
  if (idx >= 0) {
    registry[idx] = entry;
  } else {
    registry.unshift(entry);
  }
  localStorage.setItem(EDITS_KEY, JSON.stringify(registry));
}

export function removeEdit(id: string) {
  const registry = getEditsRegistry().filter(d => d.id !== id);
  localStorage.setItem(EDITS_KEY, JSON.stringify(registry));
}

export function getKeeps(): Set<string> {
  try {
    const raw = localStorage.getItem(KEEPS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function addKeep(cardName: string) {
  const keeps = getKeeps();
  keeps.add(cardName);
  localStorage.setItem(KEEPS_KEY, JSON.stringify([...keeps]));
}

export function removeKeep(cardName: string) {
  const keeps = getKeeps();
  keeps.delete(cardName);
  localStorage.setItem(KEEPS_KEY, JSON.stringify([...keeps]));
}

export function getEditsCount(): number {
  return getEditsRegistry().length;
}

/* ═══════════════════════ KEEP OR EDIT MODAL ═══════════════════════ */
interface KeepOrEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  cardType: string;
  details: Record<string, string>;
  onKeep: () => void;
  onEdit: () => void;
}

export const KeepOrEditModal: React.FC<KeepOrEditModalProps> = ({
  open, onOpenChange, cardName, onKeep, onEdit,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_[0_10px_30px_hsl(0_0%_0%_/_0.5)] max-w-sm p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <D[hsl(var(--ui-text))]Title className="text-white text-base font-bold truncate">{cardName}</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 flex gap-3">
          <button
            type="button"
            onClick={() => { onKeep(); onOpenChange(false); }}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)] hover:brightness-125 active:brightness-150 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Keep
          </button>
          <button
            type="button"
            onClick={() => { onEdit(); onOpenChange(false); }}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)] hover:brightness-125 active:brightness-150 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════ EDIT DETAIL MODAL ═══════════════════════ */
interface EditDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  cardType: string;
  details: Record<string, string>;
  existingComment?: string;
  existingId?: string;
  onSave: (entry: EditEntry) => void;
}

export const EditDetailModal: React.FC<EditDetailModalProps> = ({
  open, onOpenChange, cardName, cardType, details, existingComment, existingId, onSave,
}) => {
  const [comment, setComment] = useState(existingComment || '');

  useEffect(() => {
    if (open) setComment(existingComment || '');
  }, [open, existingComment]);

  const handleSave = () => {
    const entry: EditEntry = {
      id: existingId || `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      cardType,
      cardName,
      details,
      comment,
      savedAt: Date.now(),
    };
    onSave(entry);
    onOpenChange(false);
  };

  const detailEntries = Object.entries(details).filter(([, v]) => v && v.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)] max-w-lg p-0 gap-0 max-h-[80vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="text-[hsl(var(--ui-text))] text-base font-bold">Edit: {cardName}</DialogTitle>
          <p className="text-[hsl(var(--ui-text-muted))] text-xs mt-1 uppercase tracking-wider font-bold">{cardType}</p>
        </DialogHeader>

        <div className="px-5 pb-3 overflow-y-auto flex-1 min-h-0">
          {/* Current details - read-only */}
          <div className="mb-4">
            <div className="text-[hsl(var(--ui-text-muted))] text-[10px] font-bold uppercase tracking-wider mb-2">Current Details</div>
            <div className="flex flex-col gap-1.5 rounded-xl bg-[hsl(var(--ui-surface))] border border-[hsl(var(--ui-border))] p-3">
              {detailEntries.map(([key, val]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <span className="text-[hsl(var(--ui-text-muted))] font-semibold shrink-0 min-w-[80px]">{key}:</span>
                  <span className="text-[hsl(var(--ui-text))] break-all">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="text-[hsl(var(--ui-text-muted))] text-[10px] font-bold uppercase tracking-wider mb-2">What needs to change?</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe what needs to be changed…"
              rows={4}
              spellCheck={true}
              className="w-full rounded-xl bg-[hsl(var(--ui-surface))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] text-sm px-3 py-2.5 placeholder:text-[hsl(var(--ui-text-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ui-border-hover))] resize-none"
            />
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!comment.trim()}
            className="w-full h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider hover:brightness-125 active:brightness-150 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Save Edit
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════ EDITS LIST MODAL ═══════════════════════ */
interface EditsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange?: () => void;
}

export const EditsListModal: React.FC<EditsListModalProps> = ({ open, onOpenChange, onCountChange }) => {
  const [edits, setEdits] = useState<EditEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<EditEntry | null>(null);

  useEffect(() => {
    if (open) setEdits(getEditsRegistry());
  }, [open]);

  const handleDelete = (id: string) => {
    removeEdit(id);
    setEdits(getEditsRegistry());
    onCountChange?.();
  };

  const handleUpdateEntry = (entry: EditEntry) => {
    upsertEdit(entry);
    setEdits(getEditsRegistry());
    setEditingEntry(null);
    onCountChange?.();
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Dialog open={open && !editingEntry} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-xl bg-zinc-900 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-md p-0 gap-0 max-h-[70vh] flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-white text-base font-bold">Style Guide Edits</DialogTitle>
          </DialogHeader>

          <div className="px-5 pb-5 overflow-y-auto flex-1 min-h-0">
            {edits.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No edits flagged yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {edits.map((edit) => (
                  <div
                    key={edit.id}
                    className="flex items-start gap-3 rounded-xl bg-zinc-800/60 border border-white/5 px-4 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold truncate">
                        {edit.cardName}
                      </div>
                      <div className="text-amber-400/70 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                        {edit.cardType}
                      </div>
                      <div className="text-zinc-400 text-xs mt-1 line-clamp-2">
                        {edit.comment}
                      </div>
                      <div className="text-zinc-600 text-[10px] mt-1">
                        {formatDate(edit.savedAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingEntry(edit)}
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-white/5 transition-colors shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(edit.id)}
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors shrink-0"
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

      {editingEntry && (
        <EditDetailModal
          open={!!editingEntry}
          onOpenChange={(o) => { if (!o) setEditingEntry(null); }}
          cardName={editingEntry.cardName}
          cardType={editingEntry.cardType}
          details={editingEntry.details}
          existingComment={editingEntry.comment}
          existingId={editingEntry.id}
          onSave={handleUpdateEntry}
        />
      )}
    </>
  );
};
