// Reference-only compositions. No product route imports this module.
// Card treatment: CharacterBuilderScreen.tsx, unselected library branch.
import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { ChronicleSurfaceButton } from '@/components/chronicle/ChronicleDarkUi';
import { CHRONICLE_DARK } from '@/components/chronicle/chronicle-dark-ui';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export function SavedCollectionExample({ image, onOpen = () => {} }: { image: string; onOpen?: () => void }) {
  return <button type="button" onClick={onOpen} className="group block relative w-full text-left rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14151a]">
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-[#4a5f7f] bg-slate-200 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)]">
      <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ objectPosition: '50% 30%' }} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <span className="inline-block mb-2 bg-blue-500 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">3 characters</span>
        <span className="block text-xl font-black text-white leading-tight mb-1 tracking-tight group-hover:text-blue-300 transition-colors truncate">Harbor cast</span>
        <p className="text-xs text-white line-clamp-3 leading-relaxed italic">Recurring characters for stories around the old harbor.</p>
      </div>
    </div>
  </button>;
}

export function LibraryDisplayExample({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [showRole, setShowRole] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  return <div className="flex flex-col items-start gap-5 sm:flex-row">
    <div className="relative aspect-[2/3] w-[240px] max-w-full overflow-hidden rounded-[2rem] border border-[#4a5f7f] bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)]">
      <div aria-hidden className="absolute inset-0 flex items-center justify-center p-10 font-black text-ghost-white text-6xl uppercase tracking-tighter italic">R</div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        {showRole && <span className="inline-block mb-2 bg-slate-600 text-white/80 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg whitespace-nowrap">Side Character</span>}
        <h3 className="text-xl font-black text-white leading-tight mb-1 tracking-tight truncate">Rowan</h3>
        {showDescription && <p className="text-xs text-white line-clamp-3 leading-relaxed italic">A retired navigator with a story for every tide.</p>}
      </div>
    </div>
    <Popover defaultOpen={initiallyOpen}>
      <PopoverTrigger asChild><ChronicleSurfaceButton className="w-10 px-0" aria-label="Library display settings"><Settings size={20} /></ChronicleSurfaceButton></PopoverTrigger>
      <PopoverContent aria-label="Library display settings" align="start" className="w-72 max-w-[calc(100vw-32px)] rounded-[14px] border border-black/20 bg-[#3c3e47] p-4 text-[#eaedf1]" style={{ boxShadow: CHRONICLE_DARK.buttonShadow }}>
        <h3 className="text-sm font-bold mb-3">Display on cards</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-zinc-200"><Checkbox checked={showRole} onCheckedChange={value => setShowRole(value === true)} className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />Character role</label>
          <label className="flex items-center gap-3 text-sm text-zinc-200"><Checkbox checked={showDescription} onCheckedChange={value => setShowDescription(value === true)} className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />Description</label>
          <ChronicleSurfaceButton className="px-4" onClick={() => { setShowRole(true); setShowDescription(true); }}>Reset</ChronicleSurfaceButton>
        </div>
      </PopoverContent>
    </Popover>
  </div>;
}
