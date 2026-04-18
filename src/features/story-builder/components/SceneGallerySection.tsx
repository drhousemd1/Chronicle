import type { RefObject } from 'react';
import { AspectRatioIcon } from '@/components/chronicle/AspectRatioUtils';
import { Icons } from '@/constants';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SceneGalleryActionButtons } from '@/components/chronicle/SceneGalleryActionButtons';
import type { StoryBuilderMediaController } from '@/features/story-builder/hooks/use-story-builder-media';
import type { Scene } from '@/types';

type SceneGallerySectionProps = {
  scenes: Scene[];
  media: StoryBuilderMediaController;
};

export function SceneGallerySection({ scenes, media }: SceneGallerySectionProps) {
  return (
    <section>
      <div className="w-full overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
        <div className="relative flex items-center gap-3 overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
          <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-[1] text-white"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <h2 className="relative z-[1] text-xl font-bold tracking-[-0.015em] text-white">Scene Gallery</h2>
        </div>
        <div className="p-5">
          <div className="rounded-2xl bg-[#2e2e33] p-5 pb-6 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
            <div className="mb-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scene Gallery Photos</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
                      <ul className="list-outside list-disc space-y-1 pl-4 font-semibold">
                        <li>Upload images to be used for different scenes.</li>
                        <li>Add tags for each image.</li>
                        <li>Background adapts based on tags mentioned in dialog.</li>
                        <li>Recommend: 1280×896, 4:3 landscape.</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="w-full lg:w-auto">
                <SceneGalleryActionButtons
                  onUploadFromDevice={() => media.fileInputRef.current?.click()}
                  onSelectFromLibrary={media.handleSceneSelectedFromLibrary}
                  onGenerateClick={media.openSceneGenerator}
                  disabled={media.isUploading || media.isGeneratingScene}
                  isUploading={media.isUploading}
                  isGenerating={media.isGeneratingScene}
                />
              </div>
            </div>

            <input
              type="file"
              ref={media.fileInputRef as RefObject<HTMLInputElement>}
              className="hidden"
              accept="image/*"
              onChange={(event) => {
                void media.handleAddScene(event);
              }}
            />

            <div className="mt-3 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-zinc-800 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]"
                  onClick={() => media.openSceneEditor(scene)}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={scene.url}
                      alt={scene.title || 'Scene'}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-zinc-700 px-3 py-2">
                    <span className="truncate text-xs font-medium text-white/80">
                      {scene.title || 'Untitled scene'}
                    </span>
                    {media.sceneAspectRatios[scene.id] ? (
                      <span className="ml-2 flex flex-shrink-0 items-center gap-1">
                        <AspectRatioIcon orientation={media.sceneAspectRatios[scene.id].orientation} />
                        <span className="text-[10px] text-zinc-400">{media.sceneAspectRatios[scene.id].label}</span>
                      </span>
                    ) : (
                      <span className="ml-2 flex-shrink-0 text-[10px] text-zinc-400">…</span>
                    )}
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      media.requestDeleteScene(scene.id);
                    }}
                    className="absolute right-2 top-2 rounded-lg bg-rose-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100"
                  >
                    <Icons.Trash />
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      media.toggleStartingScene(scene.id);
                    }}
                    className={`absolute left-2 top-2 rounded-lg p-1.5 transition-all ${
                      scene.isStartingScene
                        ? 'bg-amber-500 text-white opacity-100 shadow-lg shadow-amber-500/30'
                        : 'bg-black/50 text-white/70 opacity-0 hover:bg-black/70 group-hover:opacity-100'
                    }`}
                    title={scene.isStartingScene ? 'Starting scene' : 'Set as starting scene'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={scene.isStartingScene ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>

                  {scene.isStartingScene ? (
                    <div className="absolute left-10 top-2 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg">
                      Start
                    </div>
                  ) : null}
                </div>
              ))}

              {scenes.length === 0 ? (
                <div className="col-span-full rounded-2xl bg-[#1c1c1f] py-12 text-center text-zinc-500 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                  <p className="text-xs font-bold uppercase tracking-widest">No scenes uploaded</p>
                  <p className="mt-1 text-sm text-zinc-500">Upload images to enable dynamic backgrounds in chat.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
