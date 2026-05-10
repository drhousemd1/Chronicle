import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContentBare,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface ToolMeta {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
}

interface AdminToolEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: ToolMeta | null;
  onSave: (toolId: string, patch: { title?: string; description?: string; thumbnailUrl?: string }) => void | Promise<void>;
}

export const AdminToolEditModal: React.FC<AdminToolEditModalProps> = ({
  isOpen,
  onClose,
  tool,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tool && isOpen) {
      setTitle(tool.title);
      setDescription(tool.description || '');
      setThumbnailUrl(tool.thumbnailUrl || '');
      setErrorMessage('');
      setSaving(false);
    }
  }, [tool, isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tool) return;
    setErrorMessage('');
    setUploading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (authError || !userId) {
        throw authError || new Error('You must be signed in to upload an admin tile image.');
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/admin-tools/${tool.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      setThumbnailUrl(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!tool) return;
    setSaving(true);
    setErrorMessage('');
    try {
      await onSave(tool.id, {
        title: title.trim() || tool.title,
        description: description.trim(),
        thumbnailUrl,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save admin tool metadata:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentBare className="w-[min(94vw,620px)] max-w-none border-0 bg-transparent p-0 shadow-none">
        <div className="overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
          <div className="relative overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
            <div
              className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40"
              style={{ height: '60%' }}
            />
            <DialogTitle className="relative z-[1] pr-12 text-xl font-bold tracking-[-0.015em] text-white">
              Edit Admin Tile
            </DialogTitle>
            <DialogDescription className="sr-only">
              Update the admin tool title, description, and thumbnail image.
            </DialogDescription>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#1c1c1f]/70 text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-[#1c1c1f] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bb5d8]/70"
              aria-label="Close edit tile modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            <div className="rounded-2xl bg-[#2e2e33] p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] sm:p-5">
              <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-[#4a5f7f]/80 bg-[#1c1c1f] shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={`${tool.title} thumbnail preview`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-zinc-500">
                        <Upload className="h-8 w-8" />
                        <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={uploading || saving}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#3c3e47] px-4 text-xs font-bold uppercase tracking-wider text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    {thumbnailUrl && (
                      <button
                        type="button"
                        disabled={uploading || saving}
                        onClick={() => setThumbnailUrl('')}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[#4a4d58] bg-transparent px-4 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Upload changes are previewed here. Press Save to apply them to the admin hub tile.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="tool-name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Tile Name
                    </label>
                    <input
                      id="tool-name"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter tile name"
                      className="h-11 w-full rounded-xl border border-black/35 bg-[#1c1c1f] px-4 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="tool-description" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Description
                    </label>
                    <textarea
                      id="tool-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a description for this tile"
                      rows={5}
                      className="min-h-[128px] w-full resize-none rounded-xl border border-black/35 bg-[#1c1c1f] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                      {errorMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving || uploading}
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#3c3e47] px-5 text-xs font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || uploading}
                  onClick={handleSave}
                  className="inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#6f8fbd] px-5 text-xs font-bold leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#7c9ccb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Tile'}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading || saving}
              />
            </div>
          </div>
        </div>
      </DialogContentBare>
    </Dialog>
  );
};
