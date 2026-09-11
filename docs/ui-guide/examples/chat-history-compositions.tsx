import {useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {ChronicleSurfaceButton} from '@/components/chronicle/ChronicleDarkUi';

// Reference-only compositions. Callbacks record local intent; no conversation resumes.
export type SessionSummary={id:string;title:string;image:string;creator:string;messageCount:number;lastMessage:string;recap:string};
const shellShadow='0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)';
const shellClass='rounded-2xl bg-[#2a2a2f] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]';
const trayShadow='inset 1px 1px 0 rgba(255,255,255,.07), inset -1px -1px 0 rgba(0,0,0,.30), 0 4px 12px rgba(0,0,0,.25)';
// The source thumbnail's slate hover ring becomes an explicit keyboard/choice treatment here.
const focus='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a5f7f] focus-visible:ring-offset-2 focus-visible:ring-offset-black';
function SessionContents({session}:{session:SessionSummary}){
 return <><div className="flex flex-wrap items-start gap-4"><img src={session.image} alt="" className="h-24 w-24 rounded-lg object-cover bg-zinc-800" style={{boxShadow:'0 4px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.07)'}}/><div className="min-w-0 flex-1"><h3 className="font-bold text-white">{session.title}</h3><p className="text-sm text-[rgba(248,250,252,.8)]">💬 {session.messageCount} messages</p><p className="mt-0.5 text-xs text-[rgba(248,250,252,.8)]">Created by: {session.creator}</p></div></div><div className="mt-4 rounded-lg border border-black/35 bg-[#1c1c1f] px-3 py-1.5"><p className="text-sm leading-relaxed text-zinc-500">{session.lastMessage}</p></div></>;
}

export function SessionRecapExample({session,initiallyOpen=false}:{session:SessionSummary;initiallyOpen?:boolean}){
 const [open,setOpen]=useState(initiallyOpen);const [status,setStatus]=useState('No session resumed.');
 return <><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><ChronicleSurfaceButton className="px-6">Inspect session recap</ChronicleSurfaceButton></DialogTrigger>
  <DialogContent className="w-[calc(100vw-32px)] max-w-[720px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl sm:rounded-2xl border-0 bg-[#2a2a2f] p-4 gap-4 text-white [&>button]:hidden" style={{boxShadow:shellShadow}}>
   <DialogTitle className="text-base font-bold leading-6 tracking-normal">Session Recap</DialogTitle><DialogDescription className="sr-only">Review the saved session before continuing. Closing leaves history unchanged.</DialogDescription>
   <div className="rounded-xl bg-[#2e2e33] p-4" style={{boxShadow:trayShadow}}><SessionContents session={session}/><p className="mt-4 text-sm leading-relaxed text-[rgba(248,250,252,.8)]">{session.recap}</p></div>
   <div className="flex flex-wrap justify-end gap-3"><ChronicleSurfaceButton className="px-6" onClick={()=>setOpen(false)}>Close</ChronicleSurfaceButton><ChronicleSurfaceButton className="px-6" onClick={()=>{setStatus(`Continue requested locally: ${session.title}`);setOpen(false);}}>Continue</ChronicleSurfaceButton></div>
  </DialogContent>
 </Dialog><p role="status" className="mt-3 text-sm text-zinc-400">{status}</p></>;
}

export function SessionComparisonExample({sessions}:{sessions:[SessionSummary,SessionSummary]}){
 const [selected,setSelected]=useState<string|null>(null);const [status,setStatus]=useState('Choose a session before continuing.');
 return <section aria-labelledby="session-comparison-title" className="mx-auto max-w-5xl"><h2 id="session-comparison-title" className="mb-4 font-bold text-white">Compare Saved Sessions</h2>
  <div role="group" aria-label="Choose one saved session" className="grid gap-4 md:grid-cols-2">{sessions.map(session=><button key={session.id} type="button" aria-pressed={selected===session.id} aria-label={`Choose ${session.title}`} className={shellClass+' p-4 text-left '+focus+(selected===session.id?' ring-2 ring-[#4a5f7f]':' hover:ring-2 hover:ring-[#4a5f7f]')} onClick={()=>{setSelected(session.id);setStatus(`Selected: ${session.title}`);}}><div className="h-full rounded-xl bg-[#2e2e33] p-4" style={{boxShadow:trayShadow}}><SessionContents session={session}/></div></button>)}</div>
  <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><p role="status" className="text-sm text-zinc-400">{status}</p><ChronicleSurfaceButton disabled={!selected} className="px-6" onClick={()=>setStatus(`Continue requested locally: ${sessions.find(s=>s.id===selected)!.title}`)}>Continue selected session</ChronicleSurfaceButton></div>
 </section>;
}
