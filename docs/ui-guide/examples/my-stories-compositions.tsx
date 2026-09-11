// Reference-only compositions. Product routes do not import this module.
import React, {useState} from 'react';
import {Content as DialogContentPrimitive} from '@radix-ui/react-dialog';
import {Play, Settings, X} from 'lucide-react';
import {Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover';
import * as SliderPrimitive from '@radix-ui/react-slider';
import {ChronicleSurfaceButton} from '@/components/chronicle/ChronicleDarkUi';
import {CHRONICLE_DARK} from '@/components/chronicle/chronicle-dark-ui';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300';
const detailAction = `flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-0 text-xs font-bold uppercase tracking-[0.05em] transition-colors ${focus}`;
const label = 'mb-1.5 text-xs leading-normal font-black uppercase tracking-[0.1em] text-[#a1a1aa]';

// Media, banner, typography and local action values come from StoryDetailModal.
// Proper dialog content, responsive dimensions and the chapter arrangement are derived.
export function ChapterPreviewExample({image, initiallyOpen=false, onBegin=()=>{}}:{image:string;initiallyOpen?:boolean;onBegin?:()=>void}) {
  const [open,setOpen]=useState(initiallyOpen);
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><ChronicleSurfaceButton className="px-4">Preview next chapter</ChronicleSurfaceButton></DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
        <DialogContentPrimitive className="fixed left-1/2 top-1/2 z-50 w-[min(900px,calc(100vw-32px))] max-h-[calc(100vh-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[32px] bg-[#2a2a2f] md:flex" style={{boxShadow:'0 20px 50px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)'}}>
          <button type="button" aria-label="Close chapter preview" onClick={()=>setOpen(false)} className={`absolute right-4 top-4 z-20 rounded-lg p-2 text-white/60 hover:text-white transition-colors ${focus}`}><X size={24} /></button>
          <div className="w-full shrink-0 bg-[#1c1c1f] p-6 md:w-[340px]">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[292px] overflow-hidden rounded-2xl" style={{background:'linear-gradient(135deg,#2a2a2f,#1a1a1f)',boxShadow:'0 8px 24px rgba(0,0,0,0.45)'}}><img src={image} alt="The room where this chapter opens" className="absolute inset-0 h-full w-full object-cover" /><div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" /></div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={()=>setOpen(false)} className={detailAction} style={{background:'#2f3137',color:'#eaedf1',boxShadow:CHRONICLE_DARK.buttonShadow}}>Close</button>
              <button type="button" onClick={()=>{onBegin();setOpen(false);}} className={`${detailAction} text-white`} style={{background:'#3b82f6',boxShadow:'0 8px 24px rgba(0,0,0,0.45)'}}><Play size={14} className="fill-current" />Begin</button>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <header className="relative overflow-hidden border-t border-white/20 px-8 py-3.5" style={{background:'linear-gradient(180deg,#5a7292,#4a5f7f)',boxShadow:'0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.3)'}}>
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{background:'linear-gradient(180deg,rgba(255,255,255,0.07),transparent 30%)'}} />
              <DialogTitle className="relative text-4xl font-extrabold leading-10 tracking-[-0.02em] text-white">An Invitation After Dark</DialogTitle>
            </header>
            <div className="px-8 pb-8 pt-6 text-[13px] text-[rgba(248,250,252,0.8)] md:pr-12">
              <p className={label}>Synopsis</p><DialogDescription className="text-[13px] leading-[1.6] text-[rgba(248,250,252,0.8)]">A sealed invitation brings you to Rosehaven. Before the evening begins, choose whom to trust with the reason for your visit.</DialogDescription>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">{[['Location','Rosehaven'],['Suggested cast','Two characters'],['Tone','Quiet intrigue']].map(([name,value])=><div key={name}><p className={label}>{name}</p><p>{value}</p></div>)}</div>
            </div>
          </div>
        </DialogContentPrimitive>
      </DialogPortal>
    </Dialog>;
}

// Swatches come from BackgroundPickerModal. Slider markup matches ui/slider.tsx;
// a named Thumb is explicit because the shared wrapper forwards ARIA to Root only.
// Anchored form and Reset are derived.
export function BackgroundAppearanceExample({image,initiallyOpen=false}:{image:string;initiallyOpen?:boolean}) {
  const [color,setColor]=useState<'black'|'white'>('black');
  const [opacity,setOpacity]=useState(30);
  return <div className="flex flex-col items-start gap-5 md:flex-row">
    <div className="relative aspect-video w-[360px] max-w-full overflow-hidden rounded-xl border border-white/12"><img src={image} alt="Background appearance preview" className="h-full w-full object-cover" /><div aria-hidden className="absolute inset-0 pointer-events-none" style={{backgroundColor:color,opacity:opacity/100}} /></div>
    <Popover defaultOpen={initiallyOpen}>
      <PopoverTrigger asChild><ChronicleSurfaceButton className="w-10 px-0" aria-label="Background appearance"><Settings size={20} /></ChronicleSurfaceButton></PopoverTrigger>
      <PopoverContent aria-label="Background appearance" align="start" className="w-72 max-w-[calc(100vw-32px)] rounded-[14px] border border-black/20 bg-[#3c3e47] p-4 text-[#eaedf1]" style={{boxShadow:CHRONICLE_DARK.buttonShadow}}>
        <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-[#a1a1aa]">Overlay Settings</h3>
        <div className="mb-4 flex items-center gap-2"><span className="text-xs font-bold text-[#d7d8df]">Color:</span><div role="group" aria-label="Overlay color" className="flex gap-1.5">{(['black','white'] as const).map(value=><button key={value} type="button" aria-label={value==='black'?'Black overlay':'White overlay'} aria-pressed={color===value} onClick={()=>setColor(value)} className={`h-8 w-8 rounded-lg border-2 transition-all ${focus} ${color===value?'border-[#4f7fdc] ring-2 ring-[#4f7fdc]/35':'border-white/15 hover:border-white/25'} ${value==='black'?'bg-black':'bg-white'}`} />)}</div></div>
        <div className="mb-4 flex items-center gap-3"><span className="text-xs font-bold text-[#d7d8df]">Opacity:</span><SliderPrimitive.Root value={[opacity]} onValueChange={([value])=>setOpacity(value)} min={0} max={80} step={5} className="relative flex w-full flex-1 touch-none select-none items-center"><SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"><SliderPrimitive.Range className="absolute h-full bg-primary" /></SliderPrimitive.Track><SliderPrimitive.Thumb aria-label="Background overlay opacity" className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" /></SliderPrimitive.Root><span className="w-8 text-right text-xs font-bold text-[#a1a1aa]">{opacity}%</span></div>
        <ChronicleSurfaceButton className="px-4" onClick={()=>{setColor('black');setOpacity(30);}}>Reset</ChronicleSurfaceButton>
      </PopoverContent>
    </Popover>
  </div>;
}
