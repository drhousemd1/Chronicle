import React, { useState, useEffect } from 'react';
import { Scene } from '@/types';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-xl border border-[#4a5f7f] p-3">
        {/* Image */}
        <img 
          src={scene.url} 
          alt={localTitle || 'Scene preview'} 
          className="w-full max-h-[50vh] object-contain rounded-lg mb-3"
        />

        {/* Title */}
        <div className="mb-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">
            Title
          </label>
          <input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Untitled scene"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#4a5f7f] transition-colors"
          />
        </div>

        {/* Tags */}
        <div className="mb-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">
            Tags
          </label>
          {localTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {localTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleRemoveTag(tag)}
                  className="group inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium transition-all hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
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
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#4a5f7f] transition-colors"
          />
          <p className="text-[10px] text-zinc-500 mt-1.5">
            {localTags.length}/10 tags — Press Enter to add
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-ghost-white hover:bg-ghost-white rounded-lg transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SceneTagEditorModal;
