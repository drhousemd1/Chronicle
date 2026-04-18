import type { RefObject } from 'react';
import { Move, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoResizeTextarea } from '@/components/chronicle/AutoResizeTextarea';
import { CoverImageActionButtons } from '@/components/chronicle/CoverImageActionButtons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StoryBuilderMediaController } from '@/features/story-builder/hooks/use-story-builder-media';
import { StoryBuilderFieldLabel } from './StoryBuilderFieldLabel';

type StoryCardSectionProps = {
  scenarioName: string;
  briefDescription: string;
  enhancingField: string | null;
  storyNameError?: boolean;
  storyTitleError?: string;
  briefDescriptionError?: string;
  coverImage: string;
  coverImagePosition: { x: number; y: number };
  media: StoryBuilderMediaController;
  onScenarioNameChange: (value: string) => void;
  onBriefDescriptionChange: (value: string) => void;
  onEnhanceScenarioName: () => void;
  onEnhanceBriefDescription: () => void;
};

export function StoryCardSection({
  scenarioName,
  briefDescription,
  enhancingField,
  storyNameError,
  storyTitleError,
  briefDescriptionError,
  coverImage,
  coverImagePosition,
  media,
  onScenarioNameChange,
  onBriefDescriptionChange,
  onEnhanceScenarioName,
  onEnhanceBriefDescription,
}: StoryCardSectionProps) {
  const hasStoryTitleError = Boolean((storyNameError && !scenarioName.trim()) || storyTitleError);

  return (
    <section>
      <div className="w-full overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
        <div className="relative flex items-center gap-3 overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
          <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-[1] text-white"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <h2 className="relative z-[1] text-xl font-bold tracking-[-0.015em] text-white">Story Card</h2>
        </div>

        <div className="p-5">
          <div className="rounded-2xl bg-[#2e2e33] p-5 pb-6 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-8 md:flex-row">
              <div data-publish-error={storyTitleError ? true : undefined}>
                <div
                  ref={media.coverContainerRef as RefObject<HTMLDivElement>}
                  onMouseDown={media.handleCoverMouseDown}
                  onMouseMove={media.handleCoverMouseMove}
                  onMouseUp={media.handleCoverMouseUp}
                  onMouseLeave={media.handleCoverMouseUp}
                  onTouchStart={media.handleCoverTouchStart}
                  onTouchMove={media.handleCoverTouchMove}
                  onTouchEnd={media.handleCoverTouchEnd}
                  style={media.isRepositioningCover ? { touchAction: 'none' } : undefined}
                  className={cn(
                    'relative aspect-[2/3] w-full overflow-hidden rounded-2xl transition-all duration-200 md:w-48',
                    media.isRepositioningCover
                      ? 'cursor-move ring-4 ring-blue-500 shadow-xl shadow-blue-500/20'
                      : storyTitleError
                        ? 'border-2 border-red-500 ring-2 ring-red-500'
                        : coverImage
                          ? 'border-2 border-zinc-500 shadow-lg'
                          : 'shadow-lg'
                  )}
                >
                  {coverImage ? (
                    <>
                      <img
                        src={coverImage}
                        alt="Cover"
                        style={{ objectPosition: `${coverImagePosition.x}% ${coverImagePosition.y}%` }}
                        className="pointer-events-none h-full w-full select-none object-cover"
                        draggable={false}
                      />
                      {media.isRepositioningCover ? (
                        <div className="pointer-events-auto absolute inset-0 z-[18] cursor-move touch-none">
                          <button
                            type="button"
                            className="pointer-events-auto absolute left-2 top-2 z-20 rounded-md border border-white/20 bg-black/55 px-2 py-1 text-[9px] font-bold text-white hover:bg-black/70"
                            onMouseDown={(event) => event.stopPropagation()}
                            onTouchStart={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              media.finishCoverRepositioning();
                            }}
                          >
                            Done
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-[#1c1c1f] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No Cover</span>
                    </div>
                  )}

                  {coverImage ? (
                    <div className="absolute right-2 top-2 z-30">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="rounded-lg bg-black/30 p-1.5 text-white/70 transition-colors hover:bg-black/50 hover:text-white"
                            aria-label="Cover image options"
                            title="Cover image options"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={media.beginCoverRepositioning}>
                            <Move className="mr-2 h-4 w-4" />
                            Reposition image
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={media.requestDeleteCover} className="text-red-400 focus:text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete image
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : null}
                </div>
                {storyTitleError ? (
                  <p className="mt-2 text-sm font-medium text-red-500">{storyTitleError}</p>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <CoverImageActionButtons
                  onUploadFromDevice={() => media.coverFileInputRef.current?.click()}
                  onSelectFromLibrary={media.handleCoverSelectedFromLibrary}
                  onGenerateClick={media.openCoverGenerator}
                  disabled={media.isUploadingCover}
                  isUploading={media.isUploadingCover}
                  isGenerating={false}
                />

                <div data-publish-error={hasStoryTitleError || undefined}>
                  <StoryBuilderFieldLabel
                    label="Story Name"
                    onEnhance={onEnhanceScenarioName}
                    isLoading={enhancingField === 'scenarioName'}
                    isDisabled={enhancingField !== null && enhancingField !== 'scenarioName'}
                  />
                  <AutoResizeTextarea
                    value={scenarioName}
                    onChange={onScenarioNameChange}
                    placeholder="e.g. Chronicles of Eldoria"
                    className={`px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${hasStoryTitleError ? 'border border-red-500 ring-2 ring-red-500' : 'border border-black/35'}`}
                  />
                  {hasStoryTitleError ? (
                    <p className="mt-1 text-sm text-red-500">{storyTitleError || 'Story name is required'}</p>
                  ) : null}
                </div>

                <div data-publish-error={briefDescriptionError ? true : undefined}>
                  <StoryBuilderFieldLabel
                    label="Brief Description"
                    onEnhance={onEnhanceBriefDescription}
                    isLoading={enhancingField === 'briefDescription'}
                    isDisabled={enhancingField !== null && enhancingField !== 'briefDescription'}
                  />
                  <AutoResizeTextarea
                    value={briefDescription}
                    onChange={onBriefDescriptionChange}
                    rows={2}
                    placeholder="A short summary that appears on your story card (1-2 sentences)..."
                    className={`px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${briefDescriptionError ? 'border border-red-500 ring-2 ring-red-500' : 'border border-black/35'}`}
                  />
                  {briefDescriptionError ? (
                    <p className="mt-1 text-sm font-medium text-red-500">{briefDescriptionError}</p>
                  ) : null}
                </div>

                <input
                  type="file"
                  ref={media.coverFileInputRef as RefObject<HTMLInputElement>}
                  className="hidden"
                  accept="image/*"
                  onChange={(event) => {
                    void media.handleCoverUpload(event);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
