import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface ToolMeta {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

interface AdminToolEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: ToolMeta | null;
  onSave: (toolId: string, patch: { title?: string; description?: string; thumbnailUrl?: string }) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tool && isOpen) {
      setTitle(tool.title);
      setDescription(tool.description || '');
      setThumbnailUrl(tool.thumbnailUrl || '');
    }
  }, [tool, isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `admin/tools/${tool?.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      setThumbnailUrl(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!tool) return;
    onSave(tool.id, {
      title: title.trim() || tool.title,
      description: description.trim(),
      thumbnailUrl,
    });
    onClose();
  };

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Tool</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tool-name" className="text-xs font-bold uppercase text-slate-500">
              Tool Name
            </Label>
            <Input
              id="tool-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter tool name"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-description" className="text-xs font-bold uppercase text-slate-500">
              Description
            </Label>
            <Textarea
              id="tool-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this tool"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">
              Thumbnail
            </Label>
            {thumbnailUrl && (
              <div className="w-full aspect-[2/3] max-w-[140px] rounded-xl overflow-hidden border border-slate-200">
                <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
              {thumbnailUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setThumbnailUrl('')}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
