import {useState} from 'react';
import {Star, X} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {AspectRatioIcon, getClosestRatio} from '@/components/chronicle/AspectRatioUtils';

const focus='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14151a]';
const compactAction='rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity '+focus;
const detailAction='inline-flex items-center justify-center h-10 px-5 rounded-xl border-0 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[#eaedf1] text-xs font-bold leading-none hover:bg-[#44464f] active:bg-[#44464f] transition-colors '+focus;
const detailField='w-full h-11 px-3.5 bg-[#1c1c1f] border border-black/35 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';
const tray='bg-[#2e2e33] rounded-2xl p-4 sm:p-5 space-y-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]';

// Reference only: the compact folder-editor family gains a poster preview.
// Create/Cancel use local working state and never create a remote record.
export function InspirationCollectionExample({coverUrl,initiallyOpen=false}:{coverUrl:string;initiallyOpen?:boolean}){
 const [open,setOpen]=useState(initiallyOpen);const [name,setName]=useState('');const [description,setDescription]=useState('');const [receipt,setReceipt]=useState('');
 function changeOpen(value:boolean){if(value){setName('');setDescription('');}setOpen(value);}
 return <><Dialog open={open} onOpenChange={changeOpen}>
  <DialogTrigger asChild><button type="button" className={compactAction}>New inspiration collection</button></DialogTrigger>
  <DialogContent className="w-[calc(100vw-32px)] max-w-[640px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-lg bg-zinc-900 border-[#4a5f7f] text-white [&>button]:hidden">
   <DialogHeader><DialogTitle className="text-lg font-bold text-white">New Inspiration Collection</DialogTitle><DialogDescription className="sr-only">Name a collection and preview its cover. Create keeps it locally; Cancel discards it.</DialogDescription></DialogHeader>
   <div className="grid gap-6 py-4 sm:grid-cols-[128px_minmax(0,1fr)]">
    <div className="mx-auto aspect-[2/3] w-32 overflow-hidden rounded-[2rem] border border-[#4a5f7f] bg-slate-900 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]"><img src={coverUrl} alt="Proposed collection cover" className="h-full w-full object-cover"/></div>
    <div className="space-y-4"><div className="space-y-2"><Label htmlFor="collection-name" className="text-xs font-bold uppercase text-slate-500">Collection name</Label><Input id="collection-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Name this collection" className="h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"/></div><div className="space-y-2"><Label htmlFor="collection-description" className="text-xs font-bold uppercase text-slate-500">Description (optional)</Label><Textarea id="collection-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What belongs here?" rows={3} className="resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"/></div></div>
   </div>
   <div className="flex flex-wrap justify-end gap-3"><button type="button" className={compactAction} onClick={()=>changeOpen(false)}>Cancel</button><button type="button" className={compactAction} onClick={()=>{setReceipt(`Created locally: ${name.trim()||'Untitled Collection'}${description.trim()?' — '+description.trim():''}`);setOpen(false);}}>Create</button></div>
  </DialogContent>
 </Dialog><p role="status" className="mt-3 text-sm text-slate-400">{receipt||'No collection created.'}</p></>;
}

export type ReviewImage={id:string;url:string;title:string;tags:string[];width:number;height:number};

// Reference only: Image Details is arranged inline beside alternatives.
// Metadata is staged until Apply; the cover choice updates immediately.
export function ReferenceReviewExample({initialImages}:{initialImages:ReviewImage[]}){
 const [images,setImages]=useState(initialImages);const [activeId,setActiveId]=useState(initialImages[0].id);const [coverId,setCoverId]=useState(initialImages[0].id);
 const active=images.find(i=>i.id===activeId)!;
 const [draft,setDraft]=useState({title:active.title,tags:active.tags});const [entry,setEntry]=useState('');const [status,setStatus]=useState('');
 function choose(image:ReviewImage){setActiveId(image.id);setDraft({title:image.title,tags:image.tags});setEntry('');setStatus('Preview changed; uncommitted metadata was discarded.');}
 function reset(){setDraft({title:active.title,tags:active.tags});setEntry('');setStatus('Metadata changes discarded.');}
 return <section aria-label="Reference image review" className="mx-auto max-w-6xl">
  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
   <div className="overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
    <header className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 shadow-lg"><div aria-hidden className="absolute inset-0 h-[60%] bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none"/><h3 className="relative text-xl font-bold tracking-[-0.015em] text-white">Reference Review</h3></header>
    <div className="p-4 sm:p-5"><div className={tray}>
     <div className="w-full rounded-2xl border border-black/35 bg-[#1c1c1f] overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)]"><img src={active.url} alt={active.title} className="w-full max-h-[40vh] object-contain"/></div>
     <div className="space-y-2"><label htmlFor="reference-title" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Title</label><input id="reference-title" value={draft.title} onChange={e=>setDraft(x=>({...x,title:e.target.value}))} className={detailField}/></div>
     <div className="space-y-2"><label htmlFor="reference-tag" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Tags</label><div className="flex flex-wrap gap-1.5">{draft.tags.map(tag=><span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-500/30 bg-blue-500/20 text-blue-300">{tag}<button type="button" aria-label={`Remove tag ${tag}`} className={'rounded-full p-0.5 transition-colors hover:bg-blue-500/30 '+focus} onClick={()=>setDraft(x=>({...x,tags:x.tags.filter(t=>t!==tag)}))}><X className="h-3 w-3"/></button></span>)}</div><input id="reference-tag" value={entry} onChange={e=>setEntry(e.target.value)} placeholder="Add tag and press Enter..." className={detailField} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const tag=entry.trim().toLowerCase();if(tag&&!draft.tags.includes(tag)&&draft.tags.length<10)setDraft(x=>({...x,tags:[...x.tags,tag]}));setEntry('');}}}/><p className="text-[10px] text-zinc-500">{draft.tags.length}/10 tags • Press Enter to add</p></div>
     <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-white/10"><button type="button" className={detailAction} onClick={reset}>Cancel</button><button type="button" className={detailAction} onClick={()=>{setImages(xs=>xs.map(i=>i.id===activeId?{...i,...draft}:i));setStatus('Metadata applied locally.');}}>Apply</button></div>
    </div></div>
   </div>
   <aside aria-label="Nearby image alternatives" className="order-first space-y-4 lg:order-last"><p className="text-sm text-slate-400">Blue selects the preview. The amber star marks the collection cover.</p><div className="grid grid-cols-2 gap-6 lg:grid-cols-1">{images.map(image=>{const current=image.id===activeId,cover=image.id===coverId,ratio=getClosestRatio(image.width,image.height);return <div key={image.id} className="relative"><button type="button" aria-label={`Preview ${image.title}`} aria-pressed={current} onClick={()=>choose(image)} className={'w-full overflow-hidden rounded-xl border text-left shadow-sm hover:shadow-lg transition-shadow '+focus+' '+(current?'border-blue-500 ring-2 ring-blue-500/30':'border-[#4a5f7f]')}><div className="aspect-square overflow-hidden bg-slate-100"><img src={image.url} alt="" className="h-full w-full object-cover"/></div><div className="bg-zinc-700 px-3 py-2"><p className="truncate text-xs font-medium text-white">{image.title}</p><div className="mt-1 flex items-center gap-1.5"><AspectRatioIcon orientation={ratio.orientation}/><span className="text-[10px] text-zinc-400">{ratio.label}</span></div></div></button><button type="button" aria-label={`Use ${image.title} as collection cover`} aria-pressed={cover} onClick={()=>{setCoverId(image.id);setStatus(`Collection cover: ${image.title}`);}} className={'absolute top-2 left-2 p-2 rounded-lg transition-all '+focus+' '+(cover?'bg-amber-500 text-white':'bg-white/80 text-slate-600 hover:bg-amber-500 hover:text-white')}><Star className="h-4 w-4" fill={cover?'currentColor':'none'}/></button></div>;})}</div></aside>
  </div><p role="status" className="mt-3 text-sm text-slate-400">{status||'Metadata changes wait for Apply. Cover choices update immediately.'}</p>
 </section>;
}
