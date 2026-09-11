import React, { useState } from 'react';
import { NotebookPen, SlidersHorizontal, X } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContentBare, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChronicleSurfaceButton } from '@/components/chronicle/ChronicleDarkUi';
import { CHRONICLE_DARK } from '@/components/chronicle/chronicle-dark-ui';
import { AutoResizeTextarea } from '@/components/chronicle/AutoResizeTextarea';
import { EnhanceModeModal } from '@/components/chronicle/EnhanceModeModal';
import { DeleteConfirmDialog } from '@/components/chronicle/DeleteConfirmDialog';

// Reference-only compositions. These are new examples, not Chronicle features.
// Shared behavior and tokens are imported; consumer styling is adapted from
// StoryCardSection, ChooserModal, and the shared dropdown menu.
export const referenceFieldClass = 'w-full px-3 py-2 text-sm font-normal bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg border border-black/35 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
const labelClass = 'mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-400';
const closeClass = 'shrink-0 rounded-lg p-1.5 text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300';

export function AuthoringNoteExample() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Lantern district');
  const [note, setNote] = useState('Keep the streets quiet and the windows warm. Leave room for the reader to imagine what waits around the corner.');
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><ChronicleSurfaceButton className="gap-2 px-5"><NotebookPen className="h-3.5 w-3.5" />Add authoring note</ChronicleSurfaceButton></DialogTrigger>
    <p role="status" className="mt-4 text-sm text-slate-600">{saved ? 'Example note applied in this preview.' : 'A new form composed from the reference patterns.'}</p>
    <DialogContentBare className="flex max-h-[90dvh] w-[min(94vw,620px)] flex-col overflow-hidden rounded-[24px] border-0 bg-[#2a2a2f] p-0 text-white" style={{ boxShadow: CHRONICLE_DARK.shellShadow }}>
      <div className="relative flex shrink-0 items-center gap-3 overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
        <div className="pointer-events-none absolute inset-0 h-[60%] bg-gradient-to-tr from-white/10 to-transparent opacity-40" />
        <NotebookPen className="relative h-[18px] w-[18px] shrink-0" />
        <DialogTitle className="relative flex-1 text-xl font-bold tracking-[-0.015em]">Authoring note</DialogTitle>
        <DialogClose className={`relative ${closeClass}`} aria-label="Close authoring note"><X className="h-4 w-4" /></DialogClose>
      </div>
      <form className="min-h-0 overflow-y-auto p-4 sm:p-5" onSubmit={event => { event.preventDefault(); if (!name.trim()) { setError(true); return; } setError(false); setSaved(true); setOpen(false); }}>
        <div className="rounded-2xl bg-[#2e2e33] p-5 pb-6" style={{ boxShadow: CHRONICLE_DARK.trayShadow }}>
          <DialogDescription className="mb-5 text-sm leading-relaxed text-zinc-300">Keep a short writing cue beside your story. Give it a name, then describe the atmosphere you want to preserve.</DialogDescription>
          <div className="space-y-4">
            <div>
              <label htmlFor="reference-note-name" className={labelClass}>Note name</label>
              <input id="reference-note-name" value={name} onChange={event => { setName(event.target.value); setError(false); }} aria-invalid={error || undefined} aria-describedby={error ? 'reference-note-error' : undefined} className={`${referenceFieldClass} ${error ? 'border-red-500 ring-2 ring-red-500' : ''}`} />
              {error && <p id="reference-note-error" role="alert" className="mt-1 text-sm font-medium text-red-500">Enter a note name.</p>}
            </div>
            <label className="block"><span className={labelClass}>Writing cue</span><AutoResizeTextarea value={note} onChange={setNote} rows={3} className={referenceFieldClass} /></label>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <DialogClose asChild><ChronicleSurfaceButton className="px-5">Cancel</ChronicleSurfaceButton></DialogClose>
            <ChronicleSurfaceButton type="submit" className="px-5">Apply note</ChronicleSurfaceButton>
          </div>
        </div>
      </form>
    </DialogContentBare>
  </Dialog>;
}

export function PreviewOptionsExample() {
  const [open, setOpen] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [names, setNames] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><ChronicleSurfaceButton className="gap-2 px-5"><SlidersHorizontal className="h-3.5 w-3.5" />Preview options</ChronicleSurfaceButton></PopoverTrigger>
    <PopoverContent align="start" sideOffset={8} collisionPadding={16} aria-labelledby="reference-options-title" className="w-[min(320px,calc(100vw-32px))] rounded-[14px] border border-black/20 bg-[#3c3e47] p-4 text-[#eaedf1]" style={{ boxShadow: CHRONICLE_DARK.buttonShadow }}>
      <div className="mb-2 flex items-center gap-3"><h2 id="reference-options-title" className="flex-1 text-sm font-bold">Preview options</h2><button type="button" className={closeClass} aria-label="Close preview options" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button></div>
      <p className="mb-4 text-xs leading-relaxed text-zinc-300">Adjust the information shown with an image.</p>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={captions} onCheckedChange={value => setCaptions(value === true)} className="border-zinc-500 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500" />Show captions</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={names} onCheckedChange={value => setNames(value === true)} className="border-zinc-500 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500" />Show character names</label>
      </div>
    </PopoverContent>
  </Popover>;
}

export function ReferenceCompositionPage({ view }: { view: string }) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return <main className="min-h-screen bg-white p-6 sm:p-10">
    <p className="mb-6 text-sm text-slate-500">Story Builder UI Reference · local examples</p>
    {view === 'compose-modal' && <AuthoringNoteExample />}
    {view === 'compose-popover' && <PreviewOptionsExample />}
    {view === 'chooser' && <><ChronicleSurfaceButton className="px-5" onClick={() => setChooserOpen(true)}>Choose enhancement style</ChronicleSurfaceButton><EnhanceModeModal open={chooserOpen} onClose={() => setChooserOpen(false)} onSelect={() => {}} /></>}
    {view === 'confirmation' && <><ChronicleSurfaceButton className="px-5" onClick={() => setDeleteOpen(true)}>Show deletion example</ChronicleSurfaceButton><DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete this cover image?" message="The cover will be removed from this example. You can choose another image afterward." onConfirm={() => {}} /></>}
  </main>;
}
