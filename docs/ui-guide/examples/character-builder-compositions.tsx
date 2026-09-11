// Reference-only compositions. No product route imports this module.
// Layer styling: HardcodedSection.tsx. Fields: HardcodedRow.tsx.
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Dialog, DialogContentBare, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ChronicleDarkShell, ChronicleSurfaceButton } from '@/components/chronicle/ChronicleDarkUi';
import { CHRONICLE_DARK } from '@/components/chronicle/chronicle-dark-ui';
import { cn } from '@/lib/utils';

export const fieldClass = 'w-full min-w-0 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
const labelClass = 'text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block';
const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300';
const headerClass = 'relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg';
const titleClass = 'text-white text-xl font-bold tracking-[-0.015em] relative z-[1]';
const trayClass = 'p-5 pb-6 bg-[#2e2e33] rounded-2xl';

function HeaderSheen() {
  return <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }} />;
}

export function MannerismsExample() {
  const [expanded, setExpanded] = useState(true);
  const [habit, setHabit] = useState('Pauses to study unfamiliar objects before speaking.');
  const [rows, setRows] = useState([{ id: 'one', label: 'When uncertain', value: 'Turns a silver ring between her fingers.' }]);
  return <ChronicleDarkShell>
    <div className={headerClass}><HeaderSheen /><h2 className={titleClass}>Mannerisms</h2><button type="button" aria-label={expanded ? 'Collapse Mannerisms' : 'Expand Mannerisms'} aria-expanded={expanded} aria-controls="mannerisms-body" onClick={() => setExpanded(!expanded)} className={`text-white/70 hover:text-white p-1 rounded-md hover:bg-ghost-white relative z-[1] ${focusClass}`}>{expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</button></div>
    <div className="p-5"><div id="mannerisms-body" className={trayClass} style={{ boxShadow: CHRONICLE_DARK.trayShadow }}>
      {expanded ? <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start"><label htmlFor="habit" className="w-full md:w-2/5 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 rounded-lg uppercase tracking-widest">Usual gesture</label><textarea id="habit" rows={2} value={habit} onChange={e => setHabit(e.target.value)} className={`${fieldClass} md:flex-1 resize-y`} /></div>
        {rows.map(row => <div key={row.id} className="flex flex-col gap-2 md:flex-row md:items-start"><input aria-label="Mannerism label" value={row.label} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, label: e.target.value } : r))} className={cn(fieldClass, 'md:w-2/5 text-xs font-bold uppercase tracking-widest text-zinc-400')} /><textarea aria-label={`${row.label || 'Mannerism'} description`} rows={2} value={row.value} onChange={e => setRows(rows.map(r => r.id === row.id ? { ...r, value: e.target.value } : r))} className={`${fieldClass} md:flex-1 resize-y`} /><button type="button" aria-label={`Remove ${row.label || 'mannerism'}`} onClick={() => setRows(rows.filter(r => r.id !== row.id))} className={`self-end text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30 md:mt-1 ${focusClass}`}><X size={16} /></button></div>)}
        <button type="button" onClick={() => setRows([...rows, { id: String(Date.now()), label: '', value: '' }])} className={`w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl hover:brightness-110 transition-all ${focusClass}`} style={{ boxShadow: CHRONICLE_DARK.buttonShadow }}><Plus className="w-4 h-4 inline mr-1" />Add mannerism</button>
      </div> : <p className="text-sm text-zinc-400">{habit || 'No usual gesture entered.'} {rows.length} additional mannerism{rows.length === 1 ? '' : 's'}.</p>}
    </div></div>
  </ChronicleDarkShell>;
}

export function VoiceNotesExample({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const initial = 'Measured, warm delivery. Leave a brief pause before unfamiliar names.';
  const [open, setOpen] = useState(initiallyOpen);
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  function changeOpen(next: boolean) { setDraft(saved); setOpen(next); }
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><ChronicleSurfaceButton className="px-4">Edit voice notes</ChronicleSurfaceButton></DialogTrigger>
    <DialogContentBare className="max-w-[calc(100vw-32px)] sm:max-w-[580px] max-h-[90dvh] flex flex-col rounded-[24px] overflow-hidden border-0 p-0 bg-[#2a2a2f]" style={{ boxShadow: CHRONICLE_DARK.shellShadow }}>
      <div className={`${headerClass} shrink-0`}><HeaderSheen /><DialogTitle className={titleClass}>Voice notes</DialogTitle><button type="button" aria-label="Cancel voice note edits" onClick={() => changeOpen(false)} className={`relative z-[1] rounded-lg p-1.5 text-white/75 hover:text-white hover:bg-white/10 ${focusClass}`}><X size={16} /></button></div>
      <div className="p-5 min-h-0 overflow-y-auto"><form onSubmit={e => { e.preventDefault(); setSaved(draft); setOpen(false); }} className={trayClass} style={{ boxShadow: CHRONICLE_DARK.trayShadow }}>
        <DialogDescription className="text-sm text-zinc-300 leading-relaxed mb-4">Describe how this character speaks. Apply keeps the note in this example; Cancel discards edits.</DialogDescription>
        <label htmlFor="voice-notes" className={labelClass}>Delivery note</label><textarea id="voice-notes" rows={4} className={`${fieldClass} resize-y`} value={draft} onChange={e => setDraft(e.target.value)} />
        <div className="mt-5 flex justify-end gap-2"><ChronicleSurfaceButton className="px-4" onClick={() => changeOpen(false)}>Cancel</ChronicleSurfaceButton><ChronicleSurfaceButton className="px-4" type="submit">Apply</ChronicleSurfaceButton></div>
      </form></div>
    </DialogContentBare>
  </Dialog>;
}
