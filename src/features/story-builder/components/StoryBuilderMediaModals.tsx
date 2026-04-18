import { CoverImageGenerationModal } from '@/components/chronicle/CoverImageGenerationModal';
import { DeleteConfirmDialog } from '@/components/chronicle/DeleteConfirmDialog';
import { SceneImageGenerationModal } from '@/components/chronicle/SceneImageGenerationModal';
import { SceneTagEditorModal } from '@/components/chronicle/SceneTagEditorModal';
import type { StoryBuilderMediaController } from '@/features/story-builder/hooks/use-story-builder-media';

type StoryBuilderMediaModalsProps = {
  media: StoryBuilderMediaController;
  scenarioTitle?: string;
  selectedArtStyle: string;
};

export function StoryBuilderMediaModals({
  media,
  scenarioTitle,
  selectedArtStyle,
}: StoryBuilderMediaModalsProps) {
  return (
    <>
      <SceneTagEditorModal
        isOpen={!!media.editingScene}
        onClose={media.closeSceneEditor}
        scene={media.editingScene}
        onSave={media.handleSaveScene}
      />

      <CoverImageGenerationModal
        isOpen={media.showCoverGenModal}
        onClose={media.closeCoverGenerator}
        onGenerated={media.handleCoverGenerated}
        scenarioTitle={scenarioTitle}
      />

      <SceneImageGenerationModal
        isOpen={media.showSceneGenModal}
        onClose={media.closeSceneGenerator}
        onGenerate={media.handleSceneGenerate}
        isGenerating={media.isGeneratingScene}
        selectedArtStyle={selectedArtStyle}
      />

      <DeleteConfirmDialog
        open={media.pendingDeleteCover}
        onOpenChange={media.setPendingDeleteCover}
        onConfirm={media.confirmDeleteCover}
        title="Remove cover image?"
        message="This will remove the cover image from your scenario."
      />

      <DeleteConfirmDialog
        open={!!media.pendingDeleteSceneId}
        onOpenChange={(open) => {
          if (!open) media.setPendingDeleteSceneId(null);
        }}
        onConfirm={media.confirmDeleteScene}
        title="Remove scene image?"
        message="This will remove the scene image from your gallery."
      />
    </>
  );
}
