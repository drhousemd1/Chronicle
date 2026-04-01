import React, { useEffect, useState } from 'react';
/* eslint-disable react-refresh/only-export-components */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { ChooserModal } from '@/components/chronicle/ChooserModal';
import { supabase } from '@/integrations/supabase/client';

/* ═══════════════════════ TYPES ═══════════════════════ */
export interface SwatchOption {
  color: string;
  name: string;
}

export interface EditEntry {
  id: string;
  cardType: string;
  cardName: string;
  details: Record<string, string>;
  comment: string;
  savedAt: number;
  pageSpecificChange?: boolean;
  appWideChange?: boolean;
  changeTo?: string;
}

/* ═══════════════════════ SUPABASE HELPERS ═══════════════════════ */

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();
    if (error || !data) return fallback;
    return data.setting_value as T;
  } catch {
    return fallback;
  }
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  try {
    await supabase
      .from('app_settings')
      .update({ setting_value: value as any, updated_at: new Date().toISOString() })
      .eq('setting_key', key);
  } catch (e) {
    console.error(`Failed to write setting ${key}:`, e);
  }
}

/* ═══════════════════════ PUBLIC ASYNC API ═══════════════════════ */

export async function getEditsRegistry(): Promise<EditEntry[]> {
  const val = await readSetting<EditEntry[]>('styleguide_edits', []);
  return Array.isArray(val) ? val : [];
}

export async function upsertEdit(entry: EditEntry): Promise<void> {
  const registry = await getEditsRegistry();
  const idx = registry.findIndex(d => d.id === entry.id);
  if (idx >= 0) {
    registry[idx] = entry;
  } else {
    registry.unshift(entry);
  }
  await writeSetting('styleguide_edits', registry);
}

export async function removeEdit(id: string): Promise<void> {
  const registry = (await getEditsRegistry()).filter(d => d.id !== id);
  await writeSetting('styleguide_edits', registry);
}

export async function getKeeps(): Promise<Set<string>> {
  const val = await readSetting<string[]>('styleguide_keeps', []);
  return new Set(Array.isArray(val) ? val : []);
}

export async function addKeep(cardName: string): Promise<void> {
  const keeps = await getKeeps();
  keeps.add(cardName);
  await writeSetting('styleguide_keeps', [...keeps]);
}

export async function removeKeep(cardName: string): Promise<void> {
  const keeps = await getKeeps();
  keeps.delete(cardName);
  await writeSetting('styleguide_keeps', [...keeps]);
}

export async function getEditsCount(): Promise<number> {
  return (await getEditsRegistry()).length;
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
  const options: import('@/components/chronicle/ChooserModal').ChooserOption[] = [
    {
      key: 'keep',
      icon: <Check className="w-5 h-5 text-white" />,
      label: 'Keep As-Is',
      description: 'Mark this element as verified and correct',
      hoverColor: 'blue-500',
    },
    {
      key: 'edit',
      icon: <Pencil className="w-5 h-5 text-white" />,
      label: 'Flag for Edit',
      description: 'Add notes on what needs to change',
      hoverColor: 'blue-500',
    },
  ];

  const handleSelect = (key: string) => {
    if (key === 'keep') onKeep();
    else onEdit();
    onOpenChange(false);
  };

  return (
    <ChooserModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={cardName}
      options={options}
      onSelect={handleSelect}
    />
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
  existingPageSpecificChange?: boolean;
  existingAppWideChange?: boolean;
  existingChangeTo?: string;
  onSave: (entry: EditEntry) => void;
  allSwatches?: SwatchOption[];
}

export const EditDetailModal: React.FC<EditDetailModalProps> = ({
  open, onOpenChange, cardName, cardType, details, existingComment, existingId,
  existingPageSpecificChange, existingAppWideChange, existingChangeTo,
  onSave, allSwatches,
}) => {
  const [comment, setComment] = useState(existingComment || '');
  const [pageSpecificChange, setPageSpecificChange] = useState(existingPageSpecificChange || false);
  const [appWideChange, setAppWideChange] = useState(existingAppWideChange || false);
  const [changeTo, setChangeTo] = useState(existingChangeTo || '');
  const [changeToDropdownOpen, setChangeToDropdownOpen] = useState(false);

  const isSwatch = cardType.toLowerCase() === 'swatch';

  useEffect(() => {
    if (open) {
      setComment(existingComment || '');
      setPageSpecificChange(existingPageSpecificChange || false);
      setAppWideChange(existingAppWideChange || false);
      setChangeTo(existingChangeTo || '');
      setChangeToDropdownOpen(false);
    }
  }, [open, existingComment, existingPageSpecificChange, existingAppWideChange, existingChangeTo]);

  const handleSave = () => {
    const entry: EditEntry = {
      id: existingId || `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      cardType,
      cardName,
      details,
      comment,
      savedAt: Date.now(),
      ...(isSwatch ? { pageSpecificChange, appWideChange, changeTo: changeTo || undefined } : {}),
    };
    onSave(entry);
    onOpenChange(false);
  };

  const detailEntries = Object.entries(details).filter(([, v]) => v && v.trim());

  // Deduplicate swatches by name for dropdown
  const uniqueSwatches = allSwatches
    ? Array.from(new Map(allSwatches.map(s => [s.name, s])).values())
    : [];

  const selectedSwatch = uniqueSwatches.find(s => s.name === changeTo);

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

          {/* Swatch-specific: Scope checkboxes */}
          {isSwatch && (
            <div className="mb-4">
              <div className="text-[hsl(var(--ui-text-muted))] text-[10px] font-bold uppercase tracking-wider mb-2">Change Scope</div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setPageSpecificChange(!pageSpecificChange)}
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${pageSpecificChange ? 'bg-[hsl(var(--ui-accent))] border-[hsl(var(--ui-accent))]' : 'border-[hsl(var(--ui-border-hover))] bg-transparent'}`}
                  >
                    {pageSpecificChange && <Check className="w-3 h-3 text-[hsl(var(--ui-text))]" />}
                  </div>
                  <span className="text-[hsl(var(--ui-text))] text-xs">Page specific change</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setAppWideChange(!appWideChange)}
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${appWideChange ? 'bg-[hsl(var(--ui-accent))] border-[hsl(var(--ui-accent))]' : 'border-[hsl(var(--ui-border-hover))] bg-transparent'}`}
                  >
                    {appWideChange && <Check className="w-3 h-3 text-[hsl(var(--ui-text))]" />}
                  </div>
                  <span className="text-[hsl(var(--ui-text))] text-xs">App wide change</span>
                </label>
              </div>
            </div>
          )}

          {/* Swatch-specific: Change To dropdown */}
          {isSwatch && uniqueSwatches.length > 0 && (
            <div className="mb-4">
              <div className="text-[hsl(var(--ui-text-muted))] text-[10px] font-bold uppercase tracking-wider mb-2">Change To</div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setChangeToDropdownOpen(!changeToDropdownOpen)}
                  className="w-full flex items-center gap-2.5 rounded-xl bg-[hsl(var(--ui-surface))] border border-[hsl(var(--ui-border))] text-sm px-3 py-2.5 text-left hover:border-[hsl(var(--ui-border-hover))] transition-colors"
                >
                  {selectedSwatch ? (
                    <>
                      <div className="w-4 h-4 rounded-full shrink-0 border border-[hsl(0_0%_100%_/_0.15)]" style={{ backgroundColor: selectedSwatch.color }} />
                      <span className="text-[hsl(var(--ui-text))]">{selectedSwatch.name}</span>
                    </>
                  ) : (
                    <span className="text-[hsl(var(--ui-text-muted))]">Select a color…</span>
                  )}
                  <svg className={`ml-auto w-4 h-4 text-[hsl(var(--ui-text-muted))] transition-transform ${changeToDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {changeToDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-[hsl(240_6%_14%)] border border-[hsl(var(--ui-border))] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)] py-1">
                    {/* Clear option */}
                    <button
                      type="button"
                      onClick={() => { setChangeTo(''); setChangeToDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[hsl(var(--ui-text-muted))] hover:bg-[hsl(var(--ui-border))] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Clear selection
                    </button>
                    {uniqueSwatches.map((sw) => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => { setChangeTo(sw.name); setChangeToDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-[hsl(var(--ui-border))] transition-colors ${changeTo === sw.name ? 'bg-[hsl(var(--ui-border))]' : ''}`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-[hsl(0_0%_100%_/_0.15)]" style={{ backgroundColor: sw.color }} />
                        <span className="text-[hsl(var(--ui-text))]">{sw.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
            className="w-full h-10 rounded-xl bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)] hover:brightness-125 active:brightness-150 transition-all disabled:opacity-40 disabled:pointer-events-none"
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
  allSwatches?: SwatchOption[];
}

export const EditsListModal: React.FC<EditsListModalProps> = ({ open, onOpenChange, onCountChange, allSwatches }) => {
  const [edits, setEdits] = useState<EditEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<EditEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getEditsRegistry().then(r => { setEdits(r); setLoading(false); });
    }
  }, [open]);

  const handleDelete = async (id: string) => {
    await removeEdit(id);
    const updated = await getEditsRegistry();
    setEdits(updated);
    onCountChange?.();
  };

  const handleUpdateEntry = async (entry: EditEntry) => {
    await upsertEdit(entry);
    const updated = await getEditsRegistry();
    setEdits(updated);
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
        <DialogContent className="rounded-xl bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)] max-w-md p-0 gap-0 max-h-[70vh] flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-[hsl(var(--ui-text))] text-base font-bold">Style Guide Edits</DialogTitle>
          </DialogHeader>

          <div className="px-5 pb-5 overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <p className="text-[hsl(var(--ui-text-muted))] text-sm text-center py-8">Loading…</p>
            ) : edits.length === 0 ? (
              <p className="text-[hsl(var(--ui-text-muted))] text-sm text-center py-8">No edits flagged yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {edits.map((edit) => (
                  <div
                    key={edit.id}
                    className="flex items-start gap-3 rounded-xl bg-[hsl(var(--ui-surface))] border border-[hsl(var(--ui-border))] px-4 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[hsl(var(--ui-text))] text-sm font-semibold truncate">
                        {edit.cardName}
                      </div>
                      <div className="text-[hsl(var(--ui-text-muted))] text-[10px] font-bold uppercase tracking-wider mt-0.5">
                        {edit.cardType}
                      </div>
                      <div className="text-[hsl(var(--ui-text-muted))] text-xs mt-1 line-clamp-2">
                        {edit.comment}
                      </div>
                      <div className="text-[hsl(var(--ui-text-muted))] opacity-60 text-[10px] mt-1">
                        {formatDate(edit.savedAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingEntry(edit)}
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-[hsl(var(--ui-text-muted))] hover:text-[hsl(var(--ui-text))] hover:bg-[hsl(var(--ui-border))] transition-colors shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(edit.id)}
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-[hsl(var(--ui-text-muted))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--ui-border))] transition-colors shrink-0"
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
          existingPageSpecificChange={editingEntry.pageSpecificChange}
          existingAppWideChange={editingEntry.appWideChange}
          existingChangeTo={editingEntry.changeTo}
          onSave={handleUpdateEntry}
          allSwatches={allSwatches}
        />
      )}
    </>
  );
};
