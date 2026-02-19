import React, { useState, useEffect } from 'react';
import { useArtStyles } from '@/contexts/ArtStylesContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Upload, Trash2, Save, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyleDraft {
  id: string;
  displayName: string;
  thumbnailUrl: string;
  backendPrompt: string;
  backendPromptMasculine: string;
  backendPromptAndrogynous: string;
  isDirty: boolean;
  isSaving: boolean;
}

interface ImageGenerationToolProps {
  onBack: () => void;
}

export const ImageGenerationTool: React.FC<ImageGenerationToolProps> = ({ onBack }) => {
  const { styles, refreshStyles } = useArtStyles();
  const [drafts, setDrafts] = useState<StyleDraft[]>([]);

  useEffect(() => {
    setDrafts(
      styles.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        thumbnailUrl: s.thumbnailUrl,
        backendPrompt: s.backendPrompt,
        backendPromptMasculine: s.backendPromptMasculine || '',
        backendPromptAndrogynous: s.backendPromptAndrogynous || '',
        isDirty: false,
        isSaving: false,
      }))
    );
  }, [styles]);

  const updateDraft = (id: string, patch: Partial<StyleDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch, isDirty: true } : d))
    );
  };

  const handleSave = async (draft: StyleDraft) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draft.id ? { ...d, isSaving: true } : d))
    );

    try {
      const { error } = await (supabase as any)
        .from('art_styles')
        .update({
          display_name: draft.displayName,
          thumbnail_url: draft.thumbnailUrl,
          backend_prompt: draft.backendPrompt,
          backend_prompt_masculine: draft.backendPromptMasculine || null,
          backend_prompt_androgynous: draft.backendPromptAndrogynous || null,
        })
        .eq('id', draft.id);

      if (error) throw error;

      await refreshStyles();
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draft.id ? { ...d, isDirty: false, isSaving: false } : d
        )
      );
      toast.success(`${draft.displayName} saved`);
    } catch (err: any) {
      console.error('Failed to save style:', err);
      toast.error(`Failed to save: ${err.message}`);
      setDrafts((prev) =>
        prev.map((d) => (d.id === draft.id ? { ...d, isSaving: false } : d))
      );
    }
  };

  const handleThumbnailUpload = async (draftId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const ext = file.name.split('.').pop() || 'png';
        const path = `admin/styles/${draftId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);

        updateDraft(draftId, { thumbnailUrl: urlData.publicUrl });
        toast.success('Thumbnail uploaded');
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message}`);
      }
    };
    input.click();
  };

  const handleDeleteThumbnail = (draftId: string) => {
    updateDraft(draftId, { thumbnailUrl: '' });
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Image Generation Styles</h1>
            <p className="text-sm text-slate-400 mt-1">
              Edit art style names, thumbnails, and injection prompts
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
        <div className="flex gap-5 min-w-max">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="w-[320px] flex-shrink-0 rounded-2xl border border-white/10 bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex flex-col"
            >
              {/* Thumbnail */}
              <div className="p-4 pb-0">
                <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 relative group">
                  {draft.thumbnailUrl ? (
                    <img
                      src={draft.thumbnailUrl}
                      alt={draft.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
                      No thumbnail
                    </div>
                  )}
                  {/* Overlay buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleThumbnailUpload(draft.id)}
                      className="p-2.5 rounded-xl bg-white/20 hover:brightness-125 active:brightness-150 transition-all"
                      title="Upload"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    {draft.thumbnailUrl && (
                      <button
                        onClick={() => handleDeleteThumbnail(draft.id)}
                        className="p-2.5 rounded-xl bg-red-500/30 hover:brightness-125 active:brightness-150 transition-all"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Style Name
                  </label>
                  <Input
                    value={draft.displayName}
                    onChange={(e) =>
                      updateDraft(draft.id, { displayName: e.target.value })
                    }
                    className="bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>

                {/* Main Prompt */}
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Injection Prompt (Default)
                  </label>
                  <Textarea
                    value={draft.backendPrompt}
                    onChange={(e) =>
                      updateDraft(draft.id, { backendPrompt: e.target.value })
                    }
                    className="bg-zinc-900 border-zinc-700 text-white text-xs min-h-[160px] resize-none"
                  />
                </div>

                {/* Gender Variants */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors w-full">
                    <ChevronDown className="w-3.5 h-3.5 transition-transform data-[state=open]:rotate-180" />
                    Gender Variants
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Masculine
                      </label>
                      <Textarea
                        value={draft.backendPromptMasculine}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            backendPromptMasculine: e.target.value,
                          })
                        }
                        placeholder="Leave empty to use default prompt"
                        className="bg-zinc-900 border-zinc-700 text-white text-xs min-h-[100px] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Androgynous
                      </label>
                      <Textarea
                        value={draft.backendPromptAndrogynous}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            backendPromptAndrogynous: e.target.value,
                          })
                        }
                        placeholder="Leave empty to use default prompt"
                        className="bg-zinc-900 border-zinc-700 text-white text-xs min-h-[100px] resize-none"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Save Button */}
                <button
                  onClick={() => handleSave(draft)}
                  disabled={!draft.isDirty || draft.isSaving}
                  className={cn(
                    "w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                    draft.isDirty
                      ? "bg-blue-600 text-white hover:brightness-125 active:brightness-150"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
                    "disabled:pointer-events-none disabled:opacity-50"
                  )}
                >
                  <Save className="w-4 h-4" />
                  {draft.isSaving ? 'Saving...' : draft.isDirty ? 'Save Changes' : 'Saved'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
