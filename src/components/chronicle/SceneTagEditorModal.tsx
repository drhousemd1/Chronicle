import React, { useState } from 'react';
import { Scene } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface SceneTagEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onUpdateTags: (sceneId: string, tags: string[]) => void;
}

export const SceneTagEditorModal: React.FC<SceneTagEditorModalProps> = ({
  isOpen,
  onClose,
  scene,
  onUpdateTags,
}) => {
  const [newTag, setNewTag] = useState('');

  if (!scene) return null;

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !scene.tags.includes(trimmed)) {
      onUpdateTags(scene.id, [...scene.tags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(scene.id, scene.tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Edit Scene Tags
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 pt-4">
          {/* Left: Scene Thumbnail */}
          <div className="w-40 flex-shrink-0">
            <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
              <img 
                src={scene.url} 
                alt="Scene preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2 text-center">
              Scene Preview
            </p>
          </div>

          {/* Right: Tag Management */}
          <div className="flex-1 space-y-4">
            {/* Current Tags */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                Current Tags
              </label>
              <div className="min-h-[60px] p-3 bg-slate-50 rounded-xl border border-slate-200">
                {scene.tags.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tags added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {scene.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => handleRemoveTag(tag)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition-all hover:bg-red-100 hover:text-red-600"
                      >
                        <span>{tag}</span>
                        <X 
                          size={14} 
                          className="opacity-0 group-hover:opacity-100 transition-opacity" 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add Tag Input */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                Add New Tag
              </label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter keyword..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  Add Tag
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Tags are keywords that trigger this scene when mentioned in conversation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <Button 
            onClick={onClose}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SceneTagEditorModal;
