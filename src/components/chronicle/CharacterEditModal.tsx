// Character Edit Modal - Full-featured modal dialog for editing character details
// Session-scoped: edits persist only within the active playthrough

import React, { useState, useEffect, useRef } from 'react';
import { Character, SideCharacter, PhysicalAppearance, CurrentlyWearing, PreferredClothing, CharacterTraitSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; 
import * as supabaseData from '@/services/supabase-data'; 
import { toast } from 'sonner';
import { AvatarActionButtons } from './AvatarActionButtons';
import { ChangeNameModal } from './ChangeNameModal';

// Unified draft type for both Character and SideCharacter
export interface CharacterEditDraft {
  name?: string;
  nicknames?: string;
  previousNames?: string[];  // Hidden field - stores old names for lookup, never shown in UI
  age?: string;
  sexType?: string;
  roleDescription?: string;
  location?: string;
  currentMood?: string;
  controlledBy?: 'AI' | 'User';
  characterRole?: 'Main' | 'Side';
  physicalAppearance?: Partial<PhysicalAppearance>;
  currentlyWearing?: Partial<CurrentlyWearing>;
  preferredClothing?: Partial<PreferredClothing>;
  sections?: CharacterTraitSection[];
  // Avatar fields for session-scoped updates
  avatarDataUrl?: string;
  avatarPosition?: { x: number; y: number };
  // Side character specific
  background?: {
    relationshipStatus?: string;
    residence?: string;
    educationLevel?: string;
  };
  personality?: {
    traits?: string[];
    desires?: string;
    fears?: string;
    secrets?: string;
    miscellaneous?: string;
  };
}

interface CharacterEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character | SideCharacter | null;
  onSave: (draft: CharacterEditDraft) => void;
  isSaving?: boolean;
  modelId?: string; // For AI avatar regeneration
  viewOnly?: boolean; // When true, opens in view mode with edit toggle
}

// Auto-resizing textarea that wraps text and grows with content
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, className = '', rows = 1 }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={true}
      className={`w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words ${className}`}
    />
  );
};

// Reusable input field component
const FieldInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</Label>
    <AutoResizeTextarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-3 py-2 rounded-lg text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
    />
  </div>
);

// Reusable textarea field component
const FieldTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</Label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="text-sm resize-none bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-blue-500/20 focus:border-blue-500 whitespace-pre-wrap break-words"
    />
  </div>
);

// Collapsible section component matching Scenario Builder style
const CollapsibleSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedContent?: React.ReactNode;  // Summary to show when collapsed
}> = ({ title, isExpanded, onToggle, children, collapsedContent }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Slate blue header with collapse arrow */}
    <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
      <h2 className="text-white text-xl font-bold tracking-tight">{title}</h2>
      <button 
        type="button"
        onClick={onToggle} 
        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </div>
    {/* Content - always rendered, shows either expanded or collapsed view */}
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
        {isExpanded ? (
          <div className="space-y-4">
            {children}
          </div>
        ) : (
          <div className="w-full min-w-0">
            {collapsedContent || <p className="text-zinc-500 text-sm italic">No data</p>}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Helper to display field summaries when sections are collapsed
const CollapsedFieldSummary: React.FC<{ 
  fields: { label: string; value: string | undefined }[] 
}> = ({ fields }) => {
  const filledFields = fields.filter(f => f.value);
  if (filledFields.length === 0) {
    return <p className="text-zinc-500 text-sm italic">No data</p>;
  }
  return (
    <div className="space-y-4 w-full min-w-0">
      {filledFields.map((field, idx) => (
        <div key={idx} className="space-y-1 w-full min-w-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block break-words">
            {field.label}
          </span>
          <p className="text-sm text-zinc-400 break-words whitespace-pre-wrap">
            {field.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export const CharacterEditModal: React.FC<CharacterEditModalProps> = ({
  open,
  onOpenChange,
  character,
  onSave,
  isSaving = false,
  modelId,
  viewOnly = false
}) => {
  const [draft, setDraft] = useState<CharacterEditDraft>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRegeneratingAvatar, setIsRegeneratingAvatar] = useState(false);
  const [isChangeNameModalOpen, setIsChangeNameModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Expanded state for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    avatar: true,
    control: true,
    physicalAppearance: true,
    currentlyWearing: true,
    preferredClothing: true,
    background: true,
    personality: true,
    customCategories: true
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Custom category expansion state (per-section)
  const [expandedCustomSections, setExpandedCustomSections] = useState<Record<string, boolean>>({});

  const toggleCustomSection = (sectionId: string) => {
    setExpandedCustomSections(prev => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? true)
    }));
  };

  // Determine if this is a side character (has background property)
  const isSideCharacter = character && 'background' in character;

  // Initialize draft from character when modal opens
  useEffect(() => {
    if (character && open) {
      const baseDraft: CharacterEditDraft = {
        name: character.name,
        nicknames: character.nicknames || '',
        age: character.age || '',
        sexType: character.sexType || '',
        roleDescription: character.roleDescription || '',
        location: character.location || '',
        currentMood: character.currentMood || '',
        physicalAppearance: { ...character.physicalAppearance },
        currentlyWearing: { ...character.currentlyWearing },
        preferredClothing: { ...character.preferredClothing },
        // Initialize avatar from character
        avatarDataUrl: character.avatarDataUrl,
        avatarPosition: character.avatarPosition || { x: 50, y: 50 },
      };

      // Add Character-specific fields
      if ('sections' in character) {
        baseDraft.sections = character.sections?.map(s => ({ ...s, items: [...s.items] })) || [];
        baseDraft.controlledBy = (character as Character).controlledBy;
        baseDraft.characterRole = (character as Character).characterRole;
      }

      // Add SideCharacter-specific fields
      if ('background' in character) {
        const sc = character as SideCharacter;
        baseDraft.background = { ...sc.background };
        baseDraft.personality = { 
          ...sc.personality,
          traits: sc.personality?.traits ? [...sc.personality.traits] : []
        };
        baseDraft.controlledBy = sc.controlledBy;
        baseDraft.characterRole = sc.characterRole;
      }

      setDraft(baseDraft);
    }
  }, [character, open]);

  // Helper to resize image to 512x512
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        // Draw image centered and cropped to square
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 512, 512);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const resizedBlob = await resizeImage(file);
      const filename = `session-avatar-${Date.now()}.jpg`;
      const publicUrl = await supabaseData.uploadAvatar(user.id, resizedBlob, filename);
      
      setDraft(prev => ({
        ...prev,
        avatarDataUrl: publicUrl,
        avatarPosition: { x: 50, y: 50 }
      }));
      toast.success('Avatar uploaded');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Build avatar prompt from appearance fields
  const buildAvatarPrompt = (): string => {
    const appearance = draft.physicalAppearance || character?.physicalAppearance;
    const name = draft.name || character?.name || 'Character';
    const parts: string[] = [name];
    
    if (appearance?.hairColor) parts.push(`${appearance.hairColor} hair`);
    if (appearance?.eyeColor) parts.push(`${appearance.eyeColor} eyes`);
    if (appearance?.build) parts.push(`${appearance.build} build`);
    if (appearance?.skinTone) parts.push(`${appearance.skinTone} skin`);
    if (appearance?.height) parts.push(`${appearance.height} tall`);
    if (draft.sexType || character?.sexType) parts.push(draft.sexType || character?.sexType || '');
    if (draft.age || character?.age) parts.push(`${draft.age || character?.age} years old`);
    
    return parts.filter(Boolean).join(', ');
  };

  // Handle avatar regeneration via AI
  const handleRegenerateAvatar = async () => {
    if (!character) return;
    
    setIsRegeneratingAvatar(true);
    try {
      const avatarPrompt = buildAvatarPrompt();
      
      const { data, error } = await supabase.functions.invoke('generate-side-character-avatar', {
        body: {
          avatarPrompt,
          characterName: draft.name || character.name,
          modelId: modelId || 'gemini-3-flash-preview'
        }
      });
      
      if (error) throw error;
      
      if (data?.imageUrl) {
        setDraft(prev => ({
          ...prev,
          avatarDataUrl: data.imageUrl,
          avatarPosition: { x: 50, y: 50 }
        }));
        toast.success('Portrait generated');
      }
    } catch (err) {
      console.error('Avatar regeneration failed:', err);
      toast.error('Failed to generate portrait');
    } finally {
      setIsRegeneratingAvatar(false);
    }
  };

  const updateField = <K extends keyof CharacterEditDraft>(field: K, value: CharacterEditDraft[K]) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const updatePhysicalAppearance = (field: keyof PhysicalAppearance, value: string) => {
    setDraft(prev => ({
      ...prev,
      physicalAppearance: { ...prev.physicalAppearance, [field]: value }
    }));
  };

  const updateCurrentlyWearing = (field: keyof CurrentlyWearing, value: string) => {
    setDraft(prev => ({
      ...prev,
      currentlyWearing: { ...prev.currentlyWearing, [field]: value }
    }));
  };

  const updatePreferredClothing = (field: keyof PreferredClothing, value: string) => {
    setDraft(prev => ({
      ...prev,
      preferredClothing: { ...prev.preferredClothing, [field]: value }
    }));
  };

  const updateBackground = (field: string, value: string) => {
    setDraft(prev => ({
      ...prev,
      background: { ...prev.background, [field]: value }
    }));
  };

  const updatePersonality = (field: string, value: string | string[]) => {
    setDraft(prev => ({
      ...prev,
      personality: { ...prev.personality, [field]: value }
    }));
  };

  const updateSectionItem = (sectionId: string, itemId: string, field: 'label' | 'value', value: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: s.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
          )
        };
      })
    }));
  };

  // Add a new empty row to an existing section
  const addItemToSection = (sectionId: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: [...s.items, {
            id: `item-${Date.now()}`,
            label: '',
            value: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }]
        };
      })
    }));
  };

  // Remove an item from a section
  const removeItemFromSection = (sectionId: string, itemId: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, items: s.items.filter(item => item.id !== itemId) };
      })
    }));
  };

  // Add a new custom category/section
  const addNewSection = () => {
    const newSection: CharacterTraitSection = {
      id: `section-${Date.now()}`,
      title: 'New Category',
      items: [{ id: `item-${Date.now()}`, label: '', value: '', createdAt: Date.now(), updatedAt: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDraft(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  // Update section title
  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.map(s => 
        s.id === sectionId ? { ...s, title: newTitle } : s
      )
    }));
  };

  // Delete a section
  const deleteSection = (sectionId: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.filter(s => s.id !== sectionId)
    }));
  };

  const handleSave = () => {
    onSave(draft);
  };

  if (!character) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-[#2a2a2f] border-white/10">
        <DialogHeader className="px-6 py-4 border-b border-white/20 bg-black">
          <DialogTitle className="text-lg font-bold text-white">
            Edit Character
          </DialogTitle>
          <p className="text-xs text-white/70 mt-1">
            Changes apply only to this playthrough
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-160px)] bg-[#2a2a2f]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Avatar & Basic Info */}
              <div className="space-y-6">
                {/* Avatar Section */}
                <CollapsibleSection
                  title="Avatar"
                  isExpanded={expandedSections.avatar}
                  onToggle={() => toggleSection('avatar')}
                  collapsedContent={
                    <CollapsedFieldSummary fields={[
                      { label: 'Name', value: draft.name || character?.name },
                      { label: 'Nicknames', value: draft.nicknames },
                      { label: 'Age', value: draft.age },
                      { label: 'Sex / Identity', value: draft.sexType },
                      { label: 'Location', value: draft.location },
                      { label: 'Current Mood', value: draft.currentMood },
                      { label: 'Role Description', value: draft.roleDescription },
                      { label: 'Controlled By', value: draft.controlledBy },
                      { label: 'Character Type', value: draft.characterRole },
                    ]} />
                  }
                >
                  {/* Avatar Display */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-white/10 shadow-sm relative">
                      {(isUploadingAvatar || isRegeneratingAvatar) ? (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                        </div>
                      ) : (draft.avatarDataUrl || character.avatarDataUrl) ? (
                        <img 
                          src={draft.avatarDataUrl || character.avatarDataUrl} 
                          alt={draft.name || character.name} 
                          className="w-full h-full object-cover"
                          style={{ 
                            objectPosition: `${(draft.avatarPosition?.x ?? character.avatarPosition?.x ?? 50)}% ${(draft.avatarPosition?.y ?? character.avatarPosition?.y ?? 50)}%` 
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-zinc-500 text-4xl italic uppercase">
                          {(draft.name || character.name)?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    
                    {/* Premium Avatar Action Buttons */}
                    <AvatarActionButtons
                      onUploadFromDevice={() => fileInputRef.current?.click()}
                      onSelectFromLibrary={(imageUrl) => {
                        setDraft(prev => ({
                          ...prev,
                          avatarDataUrl: imageUrl,
                          avatarPosition: { x: 50, y: 50 }
                        }));
                        toast.success('Avatar selected from library');
                      }}
                      onGenerateClick={handleRegenerateAvatar}
                      disabled={isUploadingAvatar}
                      isGenerating={isRegeneratingAvatar}
                      isUploading={isUploadingAvatar}
                    />
                  </div>
                  
                  {/* Basic Info Fields - Stacked */}
                  <div className="space-y-4 mt-6">
                    {/* Name field - read-only with Change Name button */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Name</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-zinc-900/50 rounded-md text-sm text-white font-medium border border-white/10">
                          {draft.name || character?.name || 'Unnamed'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsChangeNameModalOpen(true)}
                          className="flex h-10 px-4 items-center justify-center gap-2
                            rounded-xl border border-[hsl(var(--ui-border))] 
                            bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                            text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
                            hover:bg-white/5 active:bg-white/10
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                            transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Change
                        </button>
                      </div>
                    </div>
                    <FieldInput
                      label="Nicknames"
                      value={draft.nicknames || ''}
                      onChange={(v) => updateField('nicknames', v)}
                      placeholder="e.g., Mom, Mother (comma-separated)"
                    />
                    <FieldInput
                      label="Age"
                      value={draft.age || ''}
                      onChange={(v) => updateField('age', v)}
                      placeholder="e.g., 25"
                    />
                    <FieldInput
                      label="Sex / Identity"
                      value={draft.sexType || ''}
                      onChange={(v) => updateField('sexType', v)}
                      placeholder="e.g., Female"
                    />
                    <FieldInput
                      label="Location"
                      value={draft.location || ''}
                      onChange={(v) => updateField('location', v)}
                      placeholder="Current location"
                    />
                    <FieldInput
                      label="Current Mood"
                      value={draft.currentMood || ''}
                      onChange={(v) => updateField('currentMood', v)}
                      placeholder="e.g., Happy"
                    />
                    <FieldTextarea
                      label="Role Description"
                      value={draft.roleDescription || ''}
                      onChange={(v) => updateField('roleDescription', v)}
                      placeholder="Character's role in the story..."
                      rows={3}
                    />

                    {/* Control toggles - inside Avatar section */}
                    <div className="space-y-3 pt-2 border-t border-white/10 mt-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Controlled By</Label>
                        <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-white/10">
                          <button 
                            type="button"
                            onClick={() => updateField('controlledBy', 'AI')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                              draft.controlledBy === 'AI' 
                                ? 'bg-zinc-700 text-blue-400 shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            AI
                          </button>
                          <button 
                            type="button"
                            onClick={() => updateField('controlledBy', 'User')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                              draft.controlledBy === 'User' 
                                ? 'bg-zinc-700 text-amber-400 shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            User
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Character Type</Label>
                        <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-white/10">
                          <button 
                            type="button"
                            onClick={() => updateField('characterRole', 'Main')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                              draft.characterRole === 'Main' 
                                ? 'bg-zinc-700 text-purple-400 shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            Main
                          </button>
                          <button 
                            type="button"
                            onClick={() => updateField('characterRole', 'Side')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                              draft.characterRole === 'Side' 
                                ? 'bg-zinc-700 text-green-400 shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            Side
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>

              {/* Right Column - Trait Sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Physical Appearance */}
                <CollapsibleSection
                  title="Physical Appearance"
                  isExpanded={expandedSections.physicalAppearance}
                  onToggle={() => toggleSection('physicalAppearance')}
                  collapsedContent={
                    <CollapsedFieldSummary fields={[
                      { label: 'Hair Color', value: draft.physicalAppearance?.hairColor },
                      { label: 'Eye Color', value: draft.physicalAppearance?.eyeColor },
                      { label: 'Build', value: draft.physicalAppearance?.build },
                      { label: 'Body Hair', value: draft.physicalAppearance?.bodyHair },
                      { label: 'Height', value: draft.physicalAppearance?.height },
                      { label: 'Breast Size', value: draft.physicalAppearance?.breastSize },
                      { label: 'Genitalia', value: draft.physicalAppearance?.genitalia },
                      { label: 'Skin Tone', value: draft.physicalAppearance?.skinTone },
                      { label: 'Makeup', value: draft.physicalAppearance?.makeup },
                      { label: 'Body Markings', value: draft.physicalAppearance?.bodyMarkings },
                      { label: 'Temporary Conditions', value: draft.physicalAppearance?.temporaryConditions },
                    ]} />
                  }
                >
                  <FieldInput
                    label="Hair Color"
                    value={draft.physicalAppearance?.hairColor || ''}
                    onChange={(v) => updatePhysicalAppearance('hairColor', v)}
                    placeholder="e.g., Brown"
                  />
                  <FieldInput
                    label="Eye Color"
                    value={draft.physicalAppearance?.eyeColor || ''}
                    onChange={(v) => updatePhysicalAppearance('eyeColor', v)}
                    placeholder="e.g., Blue"
                  />
                  <FieldInput
                    label="Build"
                    value={draft.physicalAppearance?.build || ''}
                    onChange={(v) => updatePhysicalAppearance('build', v)}
                    placeholder="e.g., Athletic"
                  />
                  <FieldInput
                    label="Body Hair"
                    value={draft.physicalAppearance?.bodyHair || ''}
                    onChange={(v) => updatePhysicalAppearance('bodyHair', v)}
                    placeholder="e.g., Light"
                  />
                  <FieldInput
                    label="Height"
                    value={draft.physicalAppearance?.height || ''}
                    onChange={(v) => updatePhysicalAppearance('height', v)}
                    placeholder="e.g., 5ft 8in"
                  />
                  <FieldInput
                    label="Breast Size"
                    value={draft.physicalAppearance?.breastSize || ''}
                    onChange={(v) => updatePhysicalAppearance('breastSize', v)}
                    placeholder="e.g., Medium"
                  />
                  <FieldInput
                    label="Genitalia"
                    value={draft.physicalAppearance?.genitalia || ''}
                    onChange={(v) => updatePhysicalAppearance('genitalia', v)}
                    placeholder="Description"
                  />
                  <FieldInput
                    label="Skin Tone"
                    value={draft.physicalAppearance?.skinTone || ''}
                    onChange={(v) => updatePhysicalAppearance('skinTone', v)}
                    placeholder="e.g., Fair"
                  />
                  <FieldInput
                    label="Makeup"
                    value={draft.physicalAppearance?.makeup || ''}
                    onChange={(v) => updatePhysicalAppearance('makeup', v)}
                    placeholder="e.g., Natural"
                  />
                  <FieldInput
                    label="Body Markings"
                    value={draft.physicalAppearance?.bodyMarkings || ''}
                    onChange={(v) => updatePhysicalAppearance('bodyMarkings', v)}
                    placeholder="Tattoos, scars..."
                  />
                  <FieldInput
                    label="Temporary Conditions"
                    value={draft.physicalAppearance?.temporaryConditions || ''}
                    onChange={(v) => updatePhysicalAppearance('temporaryConditions', v)}
                    placeholder="Injuries, etc."
                  />
                </CollapsibleSection>

                {/* Currently Wearing */}
                <CollapsibleSection
                  title="Currently Wearing"
                  isExpanded={expandedSections.currentlyWearing}
                  onToggle={() => toggleSection('currentlyWearing')}
                  collapsedContent={
                    <CollapsedFieldSummary fields={[
                      { label: 'Shirt / Top', value: draft.currentlyWearing?.top },
                      { label: 'Pants / Bottoms', value: draft.currentlyWearing?.bottom },
                      { label: 'Undergarments', value: draft.currentlyWearing?.undergarments },
                      { label: 'Miscellaneous', value: draft.currentlyWearing?.miscellaneous },
                    ]} />
                  }
                >
                  <FieldInput
                    label="Shirt / Top"
                    value={draft.currentlyWearing?.top || ''}
                    onChange={(v) => updateCurrentlyWearing('top', v)}
                    placeholder="e.g., White blouse"
                  />
                  <FieldInput
                    label="Pants / Bottoms"
                    value={draft.currentlyWearing?.bottom || ''}
                    onChange={(v) => updateCurrentlyWearing('bottom', v)}
                    placeholder="e.g., Blue jeans"
                  />
                  <FieldInput
                    label="Undergarments"
                    value={draft.currentlyWearing?.undergarments || ''}
                    onChange={(v) => updateCurrentlyWearing('undergarments', v)}
                    placeholder="Description"
                  />
                  <FieldInput
                    label="Miscellaneous"
                    value={draft.currentlyWearing?.miscellaneous || ''}
                    onChange={(v) => updateCurrentlyWearing('miscellaneous', v)}
                    placeholder="Accessories, etc."
                  />
                </CollapsibleSection>

                {/* Preferred Clothing */}
                <CollapsibleSection
                  title="Preferred Clothing"
                  isExpanded={expandedSections.preferredClothing}
                  onToggle={() => toggleSection('preferredClothing')}
                  collapsedContent={
                    <CollapsedFieldSummary fields={[
                      { label: 'Casual', value: draft.preferredClothing?.casual },
                      { label: 'Work', value: draft.preferredClothing?.work },
                      { label: 'Sleep', value: draft.preferredClothing?.sleep },
                      { label: 'Undergarments', value: draft.preferredClothing?.undergarments },
                      { label: 'Miscellaneous', value: draft.preferredClothing?.miscellaneous },
                    ]} />
                  }
                >
                  <FieldInput
                    label="Casual"
                    value={draft.preferredClothing?.casual || ''}
                    onChange={(v) => updatePreferredClothing('casual', v)}
                    placeholder="Casual wear"
                  />
                  <FieldInput
                    label="Work"
                    value={draft.preferredClothing?.work || ''}
                    onChange={(v) => updatePreferredClothing('work', v)}
                    placeholder="Work attire"
                  />
                  <FieldInput
                    label="Sleep"
                    value={draft.preferredClothing?.sleep || ''}
                    onChange={(v) => updatePreferredClothing('sleep', v)}
                    placeholder="Sleepwear"
                  />
                  <FieldInput
                    label="Undergarments"
                    value={draft.preferredClothing?.undergarments || ''}
                    onChange={(v) => updatePreferredClothing('undergarments', v)}
                    placeholder="Preferred underwear"
                  />
                  <FieldInput
                    label="Miscellaneous"
                    value={draft.preferredClothing?.miscellaneous || ''}
                    onChange={(v) => updatePreferredClothing('miscellaneous', v)}
                    placeholder="Other preferences"
                  />
                </CollapsibleSection>

                {/* Side Character Specific: Background */}
                {isSideCharacter && (
                  <CollapsibleSection
                    title="Background"
                    isExpanded={expandedSections.background}
                    onToggle={() => toggleSection('background')}
                    collapsedContent={
                      <CollapsedFieldSummary fields={[
                        { label: 'Relationship Status', value: draft.background?.relationshipStatus },
                        { label: 'Residence', value: draft.background?.residence },
                        { label: 'Education Level', value: draft.background?.educationLevel },
                      ]} />
                    }
                  >
                    <FieldInput
                      label="Relationship Status"
                      value={draft.background?.relationshipStatus || ''}
                      onChange={(v) => updateBackground('relationshipStatus', v)}
                      placeholder="e.g., Single"
                    />
                    <FieldInput
                      label="Residence"
                      value={draft.background?.residence || ''}
                      onChange={(v) => updateBackground('residence', v)}
                      placeholder="Where they live"
                    />
                    <FieldInput
                      label="Education Level"
                      value={draft.background?.educationLevel || ''}
                      onChange={(v) => updateBackground('educationLevel', v)}
                      placeholder="e.g., College"
                    />
                  </CollapsibleSection>
                )}

                {/* Side Character Specific: Personality */}
                {isSideCharacter && (
                  <CollapsibleSection
                    title="Personality"
                    isExpanded={expandedSections.personality}
                    onToggle={() => toggleSection('personality')}
                    collapsedContent={
                      <CollapsedFieldSummary fields={[
                        { label: 'Traits', value: draft.personality?.traits?.join(', ') },
                        { label: 'Desires', value: draft.personality?.desires },
                        { label: 'Fears', value: draft.personality?.fears },
                        { label: 'Secrets', value: draft.personality?.secrets },
                        { label: 'Miscellaneous', value: draft.personality?.miscellaneous },
                      ]} />
                    }
                  >
                    <FieldInput
                      label="Traits"
                      value={draft.personality?.traits?.join(', ') || ''}
                      onChange={(v) => updatePersonality('traits', v.split(',').map(t => t.trim()).filter(Boolean))}
                      placeholder="e.g., Friendly, Curious, Brave"
                    />
                    <FieldInput
                      label="Desires"
                      value={draft.personality?.desires || ''}
                      onChange={(v) => updatePersonality('desires', v)}
                      placeholder="What they want"
                    />
                    <FieldInput
                      label="Fears"
                      value={draft.personality?.fears || ''}
                      onChange={(v) => updatePersonality('fears', v)}
                      placeholder="What they fear"
                    />
                    <FieldTextarea
                      label="Secrets"
                      value={draft.personality?.secrets || ''}
                      onChange={(v) => updatePersonality('secrets', v)}
                      placeholder="Hidden information about this character..."
                      rows={2}
                    />
                    <FieldTextarea
                      label="Miscellaneous"
                      value={draft.personality?.miscellaneous || ''}
                      onChange={(v) => updatePersonality('miscellaneous', v)}
                      placeholder="Other personality notes..."
                      rows={2}
                    />
                  </CollapsibleSection>
                )}

                {/* Custom Sections (Main characters only) - Each as its own container */}
                {!isSideCharacter && draft.sections?.map((section) => (
                  <div key={section.id} className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
                    {/* Dark blue header with editable title */}
                    <div className="bg-blue-900/40 border-b border-blue-500/20 px-5 py-3 flex items-center justify-between">
                      <AutoResizeTextarea
                        value={section.title}
                        onChange={(v) => updateSectionTitle(section.id, v)}
                        placeholder="Category name"
                        className="bg-transparent border-none text-white text-xl font-bold tracking-tight placeholder:text-white/50 focus:outline-none flex-1 mr-2"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          type="button"
                          onClick={() => toggleCustomSection(section.id)} 
                          className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                        >
                          {(expandedCustomSections[section.id] ?? true) ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => deleteSection(section.id)} 
                          className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-5">
                      <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                        {(expandedCustomSections[section.id] ?? true) ? (
                          <div className="space-y-4">
                            {section.items.map((item) => (
                              <div key={item.id}>
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 flex gap-2 min-w-0">
                                    <div className="w-1/3 min-w-0">
                                      <AutoResizeTextarea
                                        value={item.label}
                                        onChange={(v) => updateSectionItem(section.id, item.id, 'label', v)}
                                        placeholder="Label"
                                        className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <AutoResizeTextarea
                                      value={item.value}
                                      onChange={(v) => updateSectionItem(section.id, item.id, 'value', v)}
                                      placeholder="Description"
                                      className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeItemFromSection(section.id, item.id)}
                                    className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-900/30 mt-1"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addItemToSection(section.id)}
                              className="text-blue-400 hover:text-blue-300 w-full border border-dashed border-blue-500/30 hover:border-blue-400"
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add Row
                            </Button>
                          </div>
                        ) : (
                          // Collapsed view - show label/value summary
                          (() => {
                            const hasAnyValue = section.items.some(item => item.label || item.value);
                            if (!hasAnyValue) {
                              return <p className="text-zinc-500 text-sm italic">No items</p>;
                            }
                            return (
                              <div className="space-y-4 w-full min-w-0">
                                {section.items.filter(item => item.label || item.value).map((item) => (
                                  <div key={item.id} className="space-y-1 w-full min-w-0">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block break-words">
                                      {item.label || 'Untitled'}
                                    </span>
                                    <p className="text-sm text-zinc-400 break-words whitespace-pre-wrap">{item.value || '—'}</p>
                                  </div>
                                ))}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Category button outside containers */}
                {!isSideCharacter && (
                  <button
                    type="button"
                    onClick={addNewSection}
                    className="w-full flex h-10 px-6 items-center justify-center gap-2
                      rounded-xl border border-[hsl(var(--ui-border))] 
                      bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                      text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
                      hover:bg-white/5 active:bg-white/10 disabled:opacity-50
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                      transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Category
                  </button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-5 border-t border-white/10 bg-[#2a2a2f] gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="flex h-10 px-6 items-center justify-center gap-2
              rounded-xl border border-[hsl(var(--ui-border))] 
              bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
              hover:bg-white/5 active:bg-white/10 disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
              transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-10 px-6 items-center justify-center gap-2
              rounded-xl border border-[#5a6f8f] 
              bg-[#4a5f7f] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              text-white text-[10px] font-bold leading-none uppercase tracking-wider
              hover:bg-[#5a6f8f] active:bg-[#6a7f9f] disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a6f8f]/40
              transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogFooter>
      </DialogContent>

      {/* Change Name Modal */}
      <ChangeNameModal
        open={isChangeNameModalOpen}
        onOpenChange={setIsChangeNameModalOpen}
        currentName={draft.name || character?.name || ''}
        onSave={(newName) => {
          const oldName = draft.name || character?.name || '';
          
          // Add old name to hidden previousNames array (if different and non-empty)
          let updatedPreviousNames = [...(draft.previousNames || [])];
          if (oldName && oldName !== newName && !updatedPreviousNames.includes(oldName)) {
            updatedPreviousNames.push(oldName);
          }
          
          setDraft(prev => ({
            ...prev,
            name: newName,
            previousNames: updatedPreviousNames,
          }));
          toast.success(`Name changed to ${newName}`);
        }}
      />
    </Dialog>
  );
};

export default CharacterEditModal;
