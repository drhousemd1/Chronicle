import {useState} from 'react';
import {Settings, Sun, X} from 'lucide-react';
import {Dialog, DialogContentBare, DialogDescription, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {LabeledToggle} from '@/components/ui/labeled-toggle';
import {ChronicleSurfaceButton} from '@/components/chronicle/ChronicleDarkUi';
import {CHRONICLE_CHAT_MESSAGE_BUBBLE_CLASS,CHRONICLE_CHAT_SPEAKER_COLUMN_CLASS,CHRONICLE_CHAT_SPEAKER_AVATAR_CLASS,CHRONICLE_CHAT_SPEAKER_NAME_CLASS,CHRONICLE_CHAT_DAY_TIME_CLASS} from '@/components/chronicle/chronicle-dark-ui';
import {FormattedMessage} from '@/features/chat-runtime/message-formatting';

// Reference only. These components demonstrate new arrangements with local state.
const focus='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40';
const tray='rounded-2xl bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]';
const row='flex flex-wrap items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] px-3.5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]';
const field='block w-full resize-none rounded-xl border border-white/[0.10] bg-[#3c3e47] px-4 py-3 text-sm leading-6 text-[#eaedf1] placeholder:text-[#8f95a3] outline-none transition-all focus:border-[#6e89ad] focus:ring-2 focus:ring-[#4a5f7f]/60';
type Detail='concise'|'balanced'|'detailed';

export function ResponseDirectionExample({initiallyOpen=false}:{initiallyOpen?:boolean}){
 const [open,setOpen]=useState(initiallyOpen);const [saved,setSaved]=useState({note:'',detail:'balanced' as Detail});const [draft,setDraft]=useState(saved);const [status,setStatus]=useState('No direction applied.');
 function changeOpen(value:boolean){if(value)setDraft(saved);setOpen(value);}
 return <><Dialog open={open} onOpenChange={changeOpen}><DialogTrigger asChild><ChronicleSurfaceButton className="px-6">Edit response direction</ChronicleSurfaceButton></DialogTrigger>
  <DialogContentBare className="w-[calc(100vw-32px)] max-w-2xl max-h-[calc(100vh-32px)] overflow-y-auto rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
   <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] shadow-[0_6px_16px_rgba(0,0,0,0.35)]"><div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent" style={{backgroundSize:'100% 30%',backgroundRepeat:'no-repeat'}}/><div className="relative flex items-center gap-2.5 px-5 py-4"><Settings className="h-[18px] w-[18px] text-white/90"/><DialogTitle className="text-[16px] font-black text-white uppercase tracking-[0.08em]">Response Direction</DialogTitle><button type="button" aria-label="Close response direction" onClick={()=>changeOpen(false)} className={'ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-black/25 hover:bg-black/40 '+focus}><X className="h-3.5 w-3.5 text-white/70"/></button></div></div>
   <DialogDescription className="sr-only">Draft a direction note and response detail. Apply keeps changes locally; Cancel discards them.</DialogDescription>
   <div className="p-4"><div className={tray+' space-y-4'}><div className="space-y-2"><label htmlFor="direction-note" className="text-[13px] font-semibold text-[#eaedf1]">Direction note</label><textarea id="direction-note" rows={3} value={draft.note} onChange={e=>setDraft(v=>({...v,note:e.target.value}))} placeholder="What should the next response emphasize?" className={field}/></div><div className={row}><span className="text-[13px] font-semibold text-[#eaedf1]">Response detail</span><div role="group" aria-label="Choose response detail" className="flex flex-wrap gap-1.5">{(['concise','balanced','detailed'] as const).map(level=><button key={level} type="button" aria-pressed={draft.detail===level} onClick={()=>setDraft(v=>({...v,detail:level}))} className={'rounded-lg border-none px-3 py-1.5 text-[12px] font-bold capitalize transition-colors '+focus+' '+(draft.detail===level?'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]':'bg-[#3f3f46] text-[#a1a1aa]')}>{level}</button>)}</div></div><div className="flex flex-wrap justify-end gap-2"><ChronicleSurfaceButton className="px-5" onClick={()=>changeOpen(false)}>Cancel</ChronicleSurfaceButton><ChronicleSurfaceButton className="px-5" onClick={()=>{setSaved(draft);setStatus(`Applied locally: ${draft.detail}${draft.note?' — '+draft.note:''}`);setOpen(false);}}>Apply</ChronicleSurfaceButton></div></div></div>
  </DialogContentBare>
 </Dialog><p role="status" className="mt-3 text-sm text-zinc-400">{status}</p></>;
}

export function TranscriptAidsExample({avatarUrl}:{avatarUrl:string}){
 const [names,setNames]=useState(true);const [timestamps,setTimestamps]=useState(true);
 return <section aria-labelledby="transcript-aids-title" className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
  <div className={tray}><div className="mb-2.5 flex flex-wrap items-center justify-between gap-2"><h2 id="transcript-aids-title" className="text-[12px] font-black uppercase tracking-[0.12em] text-[#a1a1aa]">Transcript Aids</h2><ChronicleSurfaceButton className="px-4" onClick={()=>{setNames(true);setTimestamps(true);}}>Reset</ChronicleSurfaceButton></div><div className="space-y-2"><label className={row}><span className="text-[13px] font-semibold text-[#eaedf1]">Speaker names</span><LabeledToggle checked={names} onCheckedChange={setNames} className={focus}/></label><label className={row}><span className="text-[13px] font-semibold text-[#eaedf1]">Day and time</span><LabeledToggle checked={timestamps} onCheckedChange={setTimestamps} className={focus}/></label></div><p role="status" className="mt-4 text-xs text-[#a1a1aa]">Names {names?'visible':'hidden'}; day/time {timestamps?'visible':'hidden'}. Changes are local.</p></div>
  <div aria-label="Transcript preview" className={CHRONICLE_CHAT_MESSAGE_BUBBLE_CLASS} style={{backgroundColor:'#1a1b20'}}><div className="relative"><div className={CHRONICLE_CHAT_SPEAKER_COLUMN_CLASS}><div className={CHRONICLE_CHAT_SPEAKER_AVATAR_CLASS}><img src={avatarUrl} alt="Avery" className="h-full w-full object-cover"/></div>{names&&<span className={CHRONICLE_CHAT_SPEAKER_NAME_CLASS+' text-slate-500'}>Avery</span>}</div><div className="pt-1 antialiased"><FormattedMessage text={'"We can pause here." *She closes the journal.*'} dynamicText plainTextMode="action"/></div><div className="clear-both"/></div>{timestamps&&<div className={CHRONICLE_CHAT_DAY_TIME_CLASS}><span>Day: 1</span><Sun className="h-5 w-5"/></div>}</div>
 </section>;
}
