import {useState} from 'react';
import {Star} from 'lucide-react';
import {Dialog,DialogContentBare,DialogTitle,DialogDescription,DialogTrigger} from '@/components/ui/dialog';
import {StarRating} from '@/components/chronicle/StarRating';

// Reference-only arrangements. No profile query, rating publication, follow or persistence.
const panel='rounded-2xl border border-ghost-white bg-[#1e1e22] p-6';
const label='text-xs font-bold uppercase tracking-wider text-white/40';
const focus='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40';
const textAction='text-[#7ba3d4] hover:underline '+focus;
const followShape='inline-flex items-center justify-center gap-2 rounded-xl bg-[#4a5f7f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a6f8f] '+focus;
function Portrait({avatarUrl}:{avatarUrl:string}){return <div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-zinc-600 bg-zinc-800"><img src={avatarUrl} alt="Avery" className="h-full w-full object-cover" style={{objectPosition:'50% 50%'}}/></div>;}
function CreatorDetails(){return <dl className="grid min-w-0 gap-x-2 gap-y-4 sm:grid-cols-[112px_minmax(0,1fr)]"><dt className={label}>Creator</dt><dd className="text-sm font-semibold text-white">Avery</dd><dt className={label}>About Me</dt><dd className="text-sm leading-relaxed text-white">I write atmospheric mysteries and stories about unlikely companions.</dd><dt className={label}>Preferred Genres</dt><dd className="flex flex-wrap gap-2">{['Mystery','Fantasy'].map(genre=><span key={genre} className="rounded-lg bg-[#4a5f7f]/20 px-3 py-1 text-xs font-bold text-[#7ba3d4]">{genre}</span>)}</dd></dl>;}

export function CreatorSnapshotExample({initiallyOpen=false,avatarUrl}:{initiallyOpen?:boolean;avatarUrl:string}){
 const [open,setOpen]=useState(initiallyOpen);
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button type="button" className={followShape}>View creator snapshot</button></DialogTrigger><DialogContentBare className={panel+' w-[calc(100vw-32px)] max-w-3xl max-h-[calc(100vh-32px)] overflow-y-auto text-white'}><DialogTitle className="text-sm font-black uppercase leading-5 tracking-wider text-white">Creator Snapshot</DialogTitle><DialogDescription className="sr-only">A local sample of the creator's introduction, genres and aggregate rating.</DialogDescription><div className="my-6 flex flex-col items-start gap-6 md:flex-row"><Portrait avatarUrl={avatarUrl}/><div className="min-w-0 flex-1"><CreatorDetails/><div className="mt-4 flex flex-wrap items-center gap-1.5"><span aria-hidden><StarRating rating={4.5} size={16} color="slate"/></span><span className="text-sm text-ghost-white">4.5 (18 reviews)</span></div></div></div><div className="flex justify-end"><button type="button" className={textAction} onClick={()=>setOpen(false)}>Close</button></div></DialogContentBare></Dialog>;
}

export function RatingPreviewExample({avatarUrl}:{avatarUrl:string}){
 const [rating,setRating]=useState(0);const [hover,setHover]=useState<number|null>(null);const shown=hover??rating;
 return <section aria-label="Local creator rating preview" className={'mx-auto max-w-5xl text-white '+panel}><h2 className="text-sm font-black uppercase tracking-wider">Rating Preview</h2><div className="mt-5 flex flex-col items-start gap-6 sm:flex-row"><Portrait avatarUrl={avatarUrl}/><div className="min-w-0 flex-1 space-y-4"><p className="text-sm font-semibold">Avery</p><p className="text-sm leading-relaxed">Try a rating for this local preview. Nothing is published.</p><div role="group" aria-label="Choose a rating" className="flex items-center gap-0.5">{[1,2,3,4,5].map(value=><button key={value} type="button" aria-label={`Rate ${value} out of 5`} aria-pressed={rating===value} onClick={()=>setRating(value)} onMouseEnter={()=>setHover(value)} onMouseLeave={()=>setHover(null)} className={'m-0 cursor-pointer border-0 bg-transparent p-0 transition-transform hover:scale-110 '+focus}><Star style={{width:16,height:16}} className={shown>=value?'text-[hsl(215,25%,40%)] fill-[hsl(215,25%,40%)]':'text-ghost-white'}/></button>)}</div><p role="status" className="text-sm text-ghost-white">{rating?`Selected locally: ${rating} out of 5`:'No rating selected'}</p><button type="button" className={textAction} onClick={()=>{setRating(0);setHover(null);}}>Reset</button></div></div></section>;
}
