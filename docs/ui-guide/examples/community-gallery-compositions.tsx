// Reference-only compositions. Product routes do not import this module.
import React,{useState} from 'react';
import {Content as DialogContentPrimitive} from '@radix-ui/react-dialog';
import {ChevronDown,LayoutGrid,Star,Sparkles,Heart,X} from 'lucide-react';
import {Dialog,DialogTrigger,DialogPortal,DialogOverlay,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Popover,PopoverTrigger,PopoverContent} from '@/components/ui/popover';
import {Collapsible,CollapsibleTrigger,CollapsibleContent} from '@/components/ui/collapsible';
import {Textarea} from '@/components/ui/textarea';

const focus='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e89ad]/70';
const submit='inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 text-sm font-bold leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.22)] transition-all hover:brightness-105 active:scale-[0.99] active:brightness-95 disabled:pointer-events-none disabled:opacity-40 '+focus;
const neutral='inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-0 bg-[#3c3e47] px-5 text-sm font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] disabled:pointer-events-none disabled:opacity-40 '+focus;
const tray='rounded-2xl bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] sm:p-5';
const field='mt-4 min-h-[120px] resize-none rounded-xl border border-black/35 bg-[#1c1c1f] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500';

// ReviewModal's shell, header, trays and footer styles; named semantic content,
// a private working copy and simple score requirement are proposed behavior.
export function PrivateRatingExample({initiallyOpen=false}:{initiallyOpen?:boolean}){
 const [open,setOpen]=useState(initiallyOpen);
 const [saved,setSaved]=useState({score:0,comment:''});
 const [draft,setDraft]=useState(saved);
 const [hover,setHover]=useState<number|null>(null);
 function changeOpen(value:boolean){if(value){setDraft(saved);setHover(null);}setOpen(value);}
 return <><Dialog open={open} onOpenChange={changeOpen}>
  <DialogTrigger asChild><button type="button" className={neutral}>Private rating</button></DialogTrigger>
  <DialogPortal><DialogOverlay className="bg-black/90 backdrop-blur-sm"/>
   <DialogContentPrimitive className="fixed left-1/2 top-1/2 z-50 flex w-[min(680px,calc(100vw-32px))] max-h-[calc(100vh-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
    <header className="relative overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
     <div aria-hidden className="pointer-events-none absolute inset-0 h-[60%] bg-gradient-to-tr from-white/10 to-transparent opacity-40"/>
     <div className="relative flex items-center justify-between gap-4"><div><DialogTitle className="text-xl font-bold tracking-[-0.015em] text-white">Private Story Rating</DialogTitle><DialogDescription className="mt-1 text-sm text-white/75">Keep a score and a short note for yourself.</DialogDescription></div><button type="button" aria-label="Cancel private rating" onClick={()=>changeOpen(false)} className={'rounded-lg p-2 text-white/65 transition-colors hover:bg-black/10 hover:text-white '+focus}><X className="h-5 w-5"/></button></div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto"><div className="space-y-5 p-4 sm:p-5">
     <div className={tray}><div className="rounded-xl border border-white/[0.08] bg-[#1c1c1f] p-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)]"><p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Your score</p><p className="mt-2 text-base font-bold text-white">How much did you enjoy it?</p><p className="mt-1 text-sm leading-relaxed text-zinc-400">Choose one to five stars to enable Save.</p><div role="group" aria-label="Private story score" className="mt-4 flex items-center gap-1.5">{[1,2,3,4,5].map(value=><button key={value} type="button" aria-label={`Rate ${value} out of 5`} aria-pressed={draft.score===value} onClick={()=>setDraft(x=>({...x,score:value}))} onMouseEnter={()=>setHover(value)} onMouseLeave={()=>setHover(null)} className={'m-0 border-0 bg-transparent p-0 hover:scale-110 transition-transform '+focus}><Star className={'h-6 w-6 '+((hover??draft.score)>=value?'text-amber-400 fill-amber-400':'text-ghost-white')}/></button>)}</div></div></div>
     <div className={tray}><label htmlFor="private-story-note" className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Optional note</label><Textarea id="private-story-note" value={draft.comment} onChange={e=>setDraft(x=>({...x,comment:e.target.value}))} placeholder="What would you like to remember?" maxLength={1000} className={field}/></div>
    </div></div>
    <footer className="flex gap-3 border-t border-white/[0.08] p-4 sm:p-5"><button type="button" className={neutral} onClick={()=>changeOpen(false)}>Cancel</button><button type="button" className={submit} disabled={draft.score<1} onClick={()=>{setSaved(draft);setOpen(false);}}>Save</button></footer>
   </DialogContentPrimitive>
  </DialogPortal>
 </Dialog><p role="status" className="mt-3 text-sm text-zinc-400">{saved.score?`Saved locally: ${saved.score} of 5${saved.comment?` — ${saved.comment}`:''}`:'No private rating saved.'}</p></>;
}

// Sidebar surfaces and category selection carried into an anchored control.
// Both options are independent; local summary updates immediately.
export function DiscoveryFocusExample({initiallyOpen=false}:{initiallyOpen?:boolean}){
 const [selected,setSelected]=useState<string[]>([]);
 const [expanded,setExpanded]=useState(true);
 return <div className="flex flex-col items-start gap-5 md:flex-row"><div className="max-w-sm"><h3 className="text-lg font-black text-white">Discovery preview</h3><p role="status" className="mt-2 text-sm text-zinc-300">{selected.length?`Showing ${selected.join(' and ')} stories.`:'Showing all genres.'}</p></div>
  <Popover defaultOpen={initiallyOpen}><PopoverTrigger asChild><button type="button" className={'relative flex h-14 items-center gap-3 overflow-hidden rounded-[20px] border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-4 pr-5 text-sm font-bold leading-none text-white shadow-[0_10px_24px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.22)] transition-all hover:brightness-105 active:scale-[0.99] active:brightness-95 '+focus}><span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent"/><LayoutGrid className="relative h-4 w-4"/><span className="relative">Discovery focus</span><ChevronDown className="relative h-4 w-4"/></button></PopoverTrigger>
   <PopoverContent aria-label="Discovery focus" align="start" className="w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-white/[0.08] bg-[#2e2e33] p-3 text-white" style={{boxShadow:'inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)'}}>
    <Collapsible open={expanded} onOpenChange={setExpanded}><CollapsibleTrigger className={'flex w-full items-center justify-between rounded-xl border border-black/30 bg-[#3c3e47] px-4 py-3 text-left shadow-[0_8px_20px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.18)] transition-colors hover:bg-[#44464f] '+focus}><span className="text-sm font-bold tracking-[-0.01em] text-white/90">Genres</span><ChevronDown className={'h-4 w-4 text-zinc-400 '+(expanded?'':'-rotate-90')}/></CollapsibleTrigger><CollapsibleContent><div role="group" aria-label="Genres" className="space-y-1.5 px-1 pb-1 pt-3">{['Fantasy','Romance'].map(value=>{const Icon=value==='Fantasy'?Sparkles:Heart;const active=selected.includes(value);return <button key={value} type="button" aria-pressed={active} onClick={()=>setSelected(xs=>active?xs.filter(x=>x!==value):[...xs,value])} className={'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors '+focus+' '+(active?'border-[#6e89ad]/45 bg-[#4a5f7f]/25 text-[#e7eef8] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]':'border-transparent text-zinc-300 hover:bg-white/[0.04] hover:text-white')}><Icon className={'h-4 w-4 shrink-0 '+(active?'text-[#9fb5d4]':'text-[rgba(248,250,252,0.3)]')}/><span>{value}</span></button>;})}</div></CollapsibleContent></Collapsible>
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#6e89ad]/30 bg-transparent px-3 py-2 text-xs text-zinc-300"><span>{selected.length} selected</span><button type="button" className={'font-bold text-[#dbe7f4] transition-colors hover:text-white '+focus} onClick={()=>setSelected([])}>Clear all</button></div>
   </PopoverContent>
  </Popover>
 </div>;
}
