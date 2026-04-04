import React, { useState, useEffect } from 'react';
import { Scene } from '@/types';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContentBare,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface SceneTagEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onSave: (sceneId: string, title: string, tags: string[]) => void;
}

export const SceneTagEditorModal: React.FC<SceneTagEditorModalProps> = ({
  isOpen,
  onClose,
  scene,
  onSave,
}) => {
  const [newTag, setNewTag] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [localTags, setLocalTags] = useState<string[]>([]);

  useEffect(() => {
    if (scene) {
      setLocalTitle(scene.title || '');
      setLocalTags([...scene.tags]);
      setNewTag('');
    }
  }, [scene]);

  if (!isOpen || !scene) return null;

  const handleAddTag = () => {
    const trimmed = newTag.trim().replace(/^#/, '');
    if (trimmed && !localTags.includes(trimmed) && localTags.length < 10) {
      setLocalTags([...localTags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalTags(localTags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    onSave(scene.id, localTitle, localTags);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentBare className="w-[min(96vw,820px)] max-w-none p-0 border-0 bg-transparent shadow-none">
        <DialogTitle className="sr-only">Edit Scene Details</DialogTitle>
        <DialogDescription className="sr-only">
          Update the scene title and tags for the selected image.
        </DialogDescription>

        <div className="bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
          <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center shadow-lg">
            <div
              className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none"
              style={{ height: '60%' }}
            />
            <h3 className="relative z-[1] text-white text-xl font-bold tracking-[-0.015em]">Scene Details</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close scene editor"
              className="relative z-[1] ml-auto w-7 h-7 rounded-lg bg-black/25 flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            <div className="bg-[#2e2e33] rounded-2xl p-4 sm:p-5 space-y-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
              <div className="w-full rounded-2xl border border-black/35 bg-[#1c1c1f] overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)]">
                <img
                  src={scene.url}
                  alt={localTitle || 'Scene preview'}
                  className="w-full max-h-[50vh] object-contain"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                  Title
                </label>
                <input
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Untitled scene"
                  className="w-full h-11 px-3.5 bg-[#1c1c1f] border border-black/35 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                  Tags
                </label>
                {localTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {localTags.map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
                      >
                        <span>{tag}</span>
                        <X size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add tag and press Enter..."
                  className="w-full h-11 px-3.5 bg-[#1c1c1f] border border-black/35 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <p className="text-[10px] text-zinc-500">
                  {localTags.length}/10 tags — Press Enter to add
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-xl border-0 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[#eaedf1] text-xs font-bold leading-none hover:bg-[#44464f] active:bg-[#44464f] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-xl border-0 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[#eaedf1] text-xs font-bold leading-none hover:bg-[#44464f] active:bg-[#44464f] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContentBare>
    </Dialog>
  );
};

export default SceneTagEditorModal;
