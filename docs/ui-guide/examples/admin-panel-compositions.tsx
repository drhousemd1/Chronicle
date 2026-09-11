// Reference-only local examples. Product AdminPage never imports this file.
import React, { useId, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Dialog, DialogContentBare, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChronicleSurfaceButton } from '@/components/chronicle/ChronicleDarkUi';

const shell = 'overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]';
const header = 'relative overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg';
const tray = 'rounded-2xl bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] sm:p-5';
const label = 'text-[10px] font-bold uppercase tracking-widest text-zinc-400';
const field = 'w-full rounded-xl border border-black/35 bg-[#1c1c1f] px-4 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bb5d8]/70';
const neutral = 'inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#3c3e47] px-5 text-xs font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] disabled:cursor-not-allowed disabled:opacity-60';
const primary = 'inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#6f8fbd] px-5 text-xs font-bold leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#7c9ccb] disabled:cursor-not-allowed disabled:opacity-60';
const titleClass = 'relative z-[1] text-xl font-bold leading-none tracking-[-0.015em] text-white';
function Sheen() { return <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height:'60%' }} />; }

export function OperatorNoteExample({initiallyOpen=false}:{initiallyOpen?:boolean}) {
  const id=useId();
  const [saved,setSaved]=useState({title:'Image checks',note:'Review the sample thumbnails before changing the tile artwork.'});
  const [draft,setDraft]=useState(saved);
  const [open,setOpen]=useState(initiallyOpen);
  const changeOpen=(value:boolean)=>{if(value)setDraft(saved);setOpen(value);};
  return <div className="space-y-3">
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><ChronicleSurfaceButton className="px-5">Edit working note</ChronicleSurfaceButton></DialogTrigger>
      <DialogContentBare className="w-[min(94vw,620px)] max-w-none max-h-[calc(100vh-32px)] overflow-y-auto border-0 bg-transparent p-0 shadow-none">
        <div className={shell}>
          <div className={header}><Sheen /><DialogTitle className={titleClass+' pr-12'}>Tool Working Note</DialogTitle><DialogDescription className="sr-only">Keep a local note for this tool. Apply keeps the draft; Cancel discards it.</DialogDescription>
            <button type="button" onClick={()=>setOpen(false)} aria-label="Close working note" className={'absolute right-4 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#1c1c1f]/70 text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-[#1c1c1f] hover:text-white '+focus}><X className="h-4 w-4" /></button>
          </div>
          <div className="p-4 sm:p-5"><div className={tray}>
            <div className="space-y-4">
              <div className="space-y-2"><label className={label} htmlFor={id+'-title'}>Note title</label><input id={id+'-title'} className={'h-11 '+field} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="Name this note" /></div>
              <div className="space-y-2"><label className={label} htmlFor={id+'-note'}>Working note</label><textarea id={id+'-note'} className={'min-h-[128px] resize-none py-3 leading-relaxed '+field} rows={5} value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})} placeholder="Describe what to check" /></div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" className={neutral+' '+focus} onClick={()=>setOpen(false)}>Cancel</button><button type="button" className={primary+' '+focus} onClick={()=>{setSaved({title:draft.title.trim()||saved.title,note:draft.note.trim()});setOpen(false);}}>Apply</button></div>
          </div></div>
        </div>
      </DialogContentBare>
    </Dialog>
    <p role="status" className="text-sm text-zinc-400">{saved.title}: {saved.note}</p>
  </div>;
}

const initial={title:'Reference Checks',description:'Review local examples and record what needs attention.'};
export function DisplayPreviewExample() {
  const id=useId();const [value,setValue]=useState(initial);
  return <section className={shell+' max-w-4xl mx-auto'} aria-label="Local admin tile preview">
    <div className={header}><Sheen /><h2 className={titleClass}>Tile Text Preview</h2></div>
    <div className="p-4 sm:p-5"><div className={tray}>
      <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="w-40 max-w-full aspect-[2/3] overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] border border-[#4a5f7f] relative" aria-label="Preview tile">
          <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Sparkles className="w-12 h-12 text-zinc-600" /></div>
          <div className="absolute inset-x-0 bottom-0 p-5"><h3 className="text-white font-bold text-base truncate">{value.title||'Untitled'}</h3><p className="text-slate-300 text-xs mt-1 italic line-clamp-2">{value.description}</p></div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2"><label className={label} htmlFor={id+'-title'}>Preview title</label><input id={id+'-title'} className={'h-11 '+field} value={value.title} onChange={e=>setValue({...value,title:e.target.value})} /></div>
          <div className="space-y-2"><label className={label} htmlFor={id+'-description'}>Preview description</label><textarea id={id+'-description'} className={'min-h-[128px] resize-none py-3 leading-relaxed '+field} rows={5} value={value.description} onChange={e=>setValue({...value,description:e.target.value})} /></div>
          <button type="button" className={neutral+' '+focus} onClick={()=>setValue(initial)}>Reset</button>
          <p className="text-[11px] leading-relaxed text-zinc-500">Changes appear only in this preview. No admin setting is saved.</p>
        </div>
      </div>
    </div></div>
  </section>;
}
