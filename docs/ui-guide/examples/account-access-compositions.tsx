import {useState} from 'react';
import {X} from 'lucide-react';
import {Dialog, DialogContentBare, DialogTitle, DialogDescription, DialogTrigger} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {ChronicleSurfaceButton} from '@/components/chronicle/ChronicleDarkUi';

// Reference only: local drafts and preview values; no account or preference service.
const panel='w-full overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]';
const header='relative flex items-center overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg';
const body='rounded-b-[24px] bg-[#2e2e33] p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]';
const field='min-w-0 rounded-xl border border-black/35 bg-[#1c1c1f] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
const fieldLabel='block text-[10px] font-bold uppercase tracking-widest text-zinc-400';
const check='h-4 w-4 rounded-[4px] border border-white/25 bg-[#1c1c1f] text-white data-[state=checked]:border-[#60a5fa] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-white';
const focus='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40';
const add='inline-flex h-10 shrink-0 items-center justify-center rounded-xl border-0 bg-[#3c3e47] px-4 text-xs font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f]';

export function ProfileIntroExample({initiallyOpen=false}:{initiallyOpen?:boolean}) {
 const [open,setOpen]=useState(initiallyOpen);
 const [saved,setSaved]=useState({intro:'',interests:[] as string[]});
 const [draft,setDraft]=useState(saved);const [interest,setInterest]=useState('');
 const [status,setStatus]=useState('No introduction saved.');
 function changeOpen(next:boolean){if(next){setDraft({...saved,interests:[...saved.interests]});setInterest('');}setOpen(next);}
 const trimmed=interest.trim();const canAdd=!!trimmed&&!draft.interests.includes(trimmed);
 function addInterest(){if(canAdd){setDraft(v=>({...v,interests:[...v.interests,trimmed]}));setInterest('');}}
 return <><Dialog open={open} onOpenChange={changeOpen}>
  <DialogTrigger asChild><ChronicleSurfaceButton className="px-6">Edit public introduction</ChronicleSurfaceButton></DialogTrigger>
  <DialogContentBare className="w-[calc(100vw-32px)] max-w-[620px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
   <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent" style={{backgroundSize:'100% 30%',backgroundRepeat:'no-repeat'}}/>
    <div className="relative flex items-center gap-2.5 px-5 py-4"><DialogTitle className="text-[16px] font-black uppercase tracking-[0.08em] text-white">Public Introduction</DialogTitle><button type="button" aria-label="Close public introduction" className={'ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/25 transition-colors hover:bg-black/40 '+focus} onClick={()=>changeOpen(false)}><X className="h-3.5 w-3.5 text-white/70"/></button></div>
   </div>
   <DialogDescription className="sr-only">Draft a public introduction and interests. Save keeps changes locally; dismissing discards the draft.</DialogDescription>
   <div className="p-4"><div className="space-y-4 rounded-2xl bg-[#2e2e33] p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
    <div className="space-y-1.5"><label htmlFor="intro-text" className={fieldLabel}>Introduction</label><textarea id="intro-text" maxLength={500} value={draft.intro} onChange={e=>setDraft(v=>({...v,intro:e.target.value}))} placeholder="Tell others about your interests..." className={field+' h-24 w-full resize-none'}/></div>
    <div className="space-y-1.5"><label htmlFor="intro-interest" className={fieldLabel}>Interests</label><div className="space-y-2">{draft.interests.length>0&&<div className="flex flex-wrap gap-1.5">{draft.interests.map(value=><span key={value} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-blue-400/25 bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-200"><span className="min-w-0 break-words">{value}</span><button type="button" aria-label={'Remove '+value} className={'shrink-0 text-blue-100 transition-colors hover:text-red-300 '+focus} onClick={()=>setDraft(v=>({...v,interests:v.interests.filter(x=>x!==value)}))}>×</button></span>)}</div>}<div className="flex min-w-0 items-center gap-2"><input id="intro-interest" value={interest} onChange={e=>setInterest(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addInterest();}}} placeholder="Add an interest..." className={field+' flex-1'}/><button type="button" disabled={!canAdd} onClick={addInterest} className={add+' disabled:pointer-events-none disabled:opacity-50 '+focus}>Add</button></div></div></div>
    <div className="flex flex-wrap justify-end gap-2"><ChronicleSurfaceButton className="px-5" onClick={()=>changeOpen(false)}>Cancel</ChronicleSurfaceButton><ChronicleSurfaceButton className="px-5" onClick={()=>{setSaved({...draft,interests:[...draft.interests]});setStatus(`Saved locally: ${draft.intro||'No introduction'}; ${draft.interests.length} interests.`);setOpen(false);}}>Save</ChronicleSurfaceButton></div>
   </div></div>
  </DialogContentBare>
 </Dialog><p role="status" className="mt-3 text-sm text-zinc-400">{status}</p></>;
}

function PanelHeading({children}:{children:React.ReactNode}){return <div className={header}><div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{height:'60%'}}/><h2 className="relative z-[1] text-xl font-bold tracking-[-0.015em] text-white">{children}</h2></div>;}
export function PrivacyPreviewExample(){
 const [hideIntro,setHideIntro]=useState(false);const [hideWorks,setHideWorks]=useState(false);
 return <section aria-label="Profile visibility preview" className="mx-auto grid w-full max-w-5xl items-start gap-6 lg:grid-cols-2">
  <div className={panel}><PanelHeading>Preview Visibility</PanelHeading><div className={body+' space-y-4'}><label className="inline-flex items-center gap-2.5"><Checkbox checked={hideIntro} onCheckedChange={v=>setHideIntro(v===true)} className={check}/><span className="text-sm text-zinc-300">Hide introduction</span></label><label className="flex items-center gap-2.5"><Checkbox checked={hideWorks} onCheckedChange={v=>setHideWorks(v===true)} className={check}/><span className="text-sm text-zinc-300">Hide published-work summary</span></label><ChronicleSurfaceButton className="px-5" onClick={()=>{setHideIntro(false);setHideWorks(false);}}>Reset</ChronicleSurfaceButton><p role="status" className="text-xs text-zinc-400">Introduction {hideIntro?'hidden':'visible'}; works {hideWorks?'hidden':'visible'}. Preview only.</p></div></div>
  <div className={panel} aria-label="Public preview"><PanelHeading>Public Preview</PanelHeading><div className={body+' space-y-4'}><p className="text-sm font-semibold text-zinc-300">Avery</p>{!hideIntro&&<p className="text-sm text-zinc-300">I write quiet mysteries and character-focused stories.</p>}{!hideWorks&&<div className="rounded-xl border border-white/[0.08] bg-[#1c1c1f] p-4"><p className="text-sm font-semibold text-zinc-300">Published-work summary</p><p className="mt-2 text-sm italic text-zinc-500">Two sample stories</p></div>}</div></div>
 </section>;
}
