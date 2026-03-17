
import React, { useState, useEffect } from 'react';
import { Character } from '@/types';
import { CharacterSummary, fetchCharacterById } from '@/services/supabase-data';
import { Dialog, DialogContentBare } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';

interface CharacterPickerProps {
  summaries: CharacterSummary[];
  onSelect: (character: Character) => void;
  onClose: () => void;
}

export function CharacterPicker({ summaries, onSelect, onClose }: CharacterPickerProps) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = summaries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.tags.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (summary: CharacterSummary) => {
    if (loadingId) return;
    setLoadingId(summary.id);
    try {
      const full = await fetchCharacterById(summary.id);
      if (full) onSelect(full);
    } catch (e) {
      console.error('Failed to load character:', e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContentBare className="sm:max-w-4xl max-w-[95vw] bg-[#2a2a2f] rounded-[24px] p-0 gap-0 border-0 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* ── Slate-blue header ── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
          <div
            className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none"
            style={{ height: '60%' }}
          />
          <div className="relative z-[1]">
            <h3 className="text-white text-xl font-bold tracking-[-0.015em]">Global Character Library</h3>
            <p className="text-white/60 text-xs mt-0.5">Select a character to import into this scenario.</p>
          </div>
          <button
            onClick={onClose}
            className="relative z-[1] w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or tags..."
            className="w-full bg-[#1c1c1f] border border-black/35 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* ── Character grid ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className={`group text-left cursor-pointer rounded-2xl bg-[#2e2e33] border-2 border-transparent p-4 transition-all hover:border-blue-500/30 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] flex items-center gap-4 ${loadingId === c.id ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="w-14 h-14 shrink-0 rounded-xl bg-[#1c1c1f] border border-black/35 overflow-hidden">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} className="w-full h-full object-cover" alt={c.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 text-lg">
                      {c.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors text-sm">{c.name}</h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{c.tags || "No tags"}</p>
                  {loadingId === c.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Loading...</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">Import →</p>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                <p>No matching characters found in library.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContentBare>
    </Dialog>
  );
}

// Wrapper that refreshes library on mount using lightweight summaries
interface CharacterPickerWithRefreshProps {
  library: Character[];
  refreshLibrary: () => Promise<Character[]>;
  onSelect: (character: Character) => void;
  onClose: () => void;
}

export function CharacterPickerWithRefresh({ library: initialLibrary, refreshLibrary, onSelect, onClose }: CharacterPickerWithRefreshProps) {
  const buildSummaries = (chars: Character[]): CharacterSummary[] =>
    chars.map(c => ({
      id: c.id,
      name: c.name || '',
      tags: c.tags || '',
      avatarUrl: c.avatarDataUrl || '',
      avatarPosition: c.avatarPosition || { x: 50, y: 50 },
    }));

  const [summaries, setSummaries] = useState<CharacterSummary[]>(buildSummaries(initialLibrary));
  const [loading, setLoading] = useState(initialLibrary.length === 0);

  useEffect(() => {
    refreshLibrary()
      .then(updated => {
        setSummaries(buildSummaries(updated));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading && summaries.length === 0) {
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContentBare className="sm:max-w-md max-w-[95vw] bg-[#2a2a2f] rounded-[24px] p-0 gap-0 border-0 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 shadow-lg">
            <div
              className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none"
              style={{ height: '60%' }}
            />
            <h3 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Global Character Library</h3>
          </div>
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">Loading library...</p>
          </div>
        </DialogContentBare>
      </Dialog>
    );
  }

  return <CharacterPicker summaries={summaries} onSelect={onSelect} onClose={onClose} />;
}
