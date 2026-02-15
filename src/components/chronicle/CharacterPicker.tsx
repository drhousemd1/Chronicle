
import React, { useState, useEffect } from 'react';
import { Character } from '@/types';
import { CharacterSummary, fetchCharacterLibrarySummaries, fetchCharacterById } from '@/services/supabase-data';
import { Button, Input } from './UI';
import { Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-6">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-full border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Global Character Library</h2>
            <p className="text-sm text-slate-500">Select a character to import into this scenario.</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="!text-slate-400 hover:!text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <Input 
            value={search} 
            onChange={setSearch} 
            placeholder="Search by name or tags..." 
            className="!bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleSelect(c)}
                className={`group cursor-pointer rounded-2xl bg-white border border-slate-200 p-4 transition-all hover:shadow-xl hover:border-blue-200 flex items-center gap-4 ${loadingId === c.id ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="w-16 h-16 shrink-0 rounded-xl bg-slate-100 overflow-hidden border border-slate-100">
                   {c.avatarUrl ? (
                     <img src={c.avatarUrl} className="w-full h-full object-cover" alt={c.name} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-xl">
                       {c.name.charAt(0)}
                     </div>
                   )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{c.name}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.tags || "No tags"}</p>
                  {loadingId === c.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Loading...</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Import →</p>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400">
                <p>No matching characters found in library.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper that refreshes library on mount using lightweight summaries
interface CharacterPickerWithRefreshProps {
  library: Character[];
  refreshLibrary: () => Promise<Character[]>;
  onSelect: (character: Character) => void;
  onClose: () => void;
}

export function CharacterPickerWithRefresh({ library: _initialLibrary, refreshLibrary: _refreshLibrary, onSelect, onClose }: CharacterPickerWithRefreshProps) {
  const [summaries, setSummaries] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacterLibrarySummaries()
      .then(data => {
        setSummaries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading && summaries.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">Loading library...</p>
        </div>
      </div>
    );
  }

  return <CharacterPicker summaries={summaries} onSelect={onSelect} onClose={onClose} />;
}
