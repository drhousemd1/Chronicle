
import React, { useState, useEffect } from 'react';
import { Character } from '@/types';
import { CharacterSummary, fetchCharacterById } from '@/services/supabase-data';
import { Dialog, DialogContentBare } from '@/components/ui/dialog';
import { Loader2, X, Search } from 'lucide-react';

interface CharacterPickerProps {
  summaries: CharacterSummary[];
  onSelect: (character: Character) => void;
  onClose: () => void;
}

export function CharacterPicker({ summaries, onSelect, onClose }: CharacterPickerProps) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = summaries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.tags.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (e: React.MouseEvent, summary: CharacterSummary) => {
    e.stopPropagation();
    if (loadingId) return;
    setLoadingId(summary.id);
    try {
      const full = await fetchCharacterById(summary.id);
      if (full) onSelect(full);
    } catch (err) {
      console.error('Failed to load character:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getObjectPosition = (pos?: { x: number; y: number }) => {
    if (!pos) return '50% 50%';
    return `${pos.x}% ${pos.y}%`;
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

        {/* ── Pill search bar ── */}
        <div className="p-4">
          <div className="bg-[#1c1c1f] rounded-full p-1 border border-black/35 flex items-center gap-2 px-3">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or tags..."
              className="h-7 w-full px-1 py-1 text-xs font-bold rounded-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ── Character tile grid ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(c => {
              const isExpanded = expandedId === c.id;
              const isLoading = loadingId === c.id;
              return (
                <div
                  key={c.id}
                  className={`group relative overflow-hidden rounded-2xl bg-black border border-[#4a5f7f] cursor-pointer transition-[height,object-fit] duration-300 ${isExpanded ? '' : 'h-[140px]'}`}
                  onClick={() => toggleExpand(c.id)}
                >
                  {/* Image or fallback */}
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className={`w-full transition-[height,object-fit] duration-300 ${isExpanded ? 'h-auto object-contain' : 'h-full object-cover'}`}
                      style={{ objectPosition: isExpanded ? undefined : getObjectPosition(c.avatarPosition) }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <span className="font-black text-5xl italic uppercase text-slate-500">
                        {c.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors pointer-events-none" />

                  {/* Import button — top right */}
                  <button
                    type="button"
                    onClick={(e) => handleSelect(e, c)}
                    disabled={isLoading}
                    className="absolute top-2 right-2 z-10 rounded-md bg-black/55 border border-white/20 px-2 py-1 text-[9px] font-bold text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-150 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading
                      </span>
                    ) : (
                      'Import'
                    )}
                  </button>

                  {/* Name — bottom left */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 pointer-events-none">
                    <p className="text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] truncate">
                      {c.name}
                    </p>
                    {c.tags && (
                      <p className="text-[10px] text-zinc-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] truncate mt-0.5">
                        {c.tags}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
  }, [refreshLibrary]);

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
