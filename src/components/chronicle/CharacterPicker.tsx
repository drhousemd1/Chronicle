
import React, { useState } from 'react';
import { Character } from '@/types';
import { Button, Input } from './UI';

interface CharacterPickerProps {
  library: Character[];
  onSelect: (character: Character) => void;
  onClose: () => void;
}

export function CharacterPicker({ library, onSelect, onClose }: CharacterPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = library.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.tags.toLowerCase().includes(search.toLowerCase())
  );

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
                onClick={() => onSelect(c)}
                className="group cursor-pointer rounded-2xl bg-white border border-slate-200 p-4 transition-all hover:shadow-xl hover:border-blue-200 flex items-center gap-4"
              >
                <div className="w-16 h-16 shrink-0 rounded-xl bg-slate-100 overflow-hidden border border-slate-100">
                   {c.avatarDataUrl ? (
                     <img src={c.avatarDataUrl} className="w-full h-full object-cover" alt={c.name} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-xl">
                       {c.name.charAt(0)}
                     </div>
                   )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{c.name}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.tags || "No tags"}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Import →</p>
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
