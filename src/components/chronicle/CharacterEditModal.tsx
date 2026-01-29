// Character Edit Modal - Full-featured modal dialog for editing character details
// Session-scoped: edits persist only within the active playthrough

import React, { useState, useEffect, useRef } from 'react';
import { Character, SideCharacter, PhysicalAppearance, CurrentlyWearing, PreferredClothing, CharacterTraitSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as supabaseData from '@/services/supabase-data';
import { toast } from 'sonner';

// Unified draft type for both Character and SideCharacter
export interface CharacterEditDraft {
  name?: string;
  nicknames?: string;
  age?: string;
  sexType?: string;
  roleDescription?: string;
  location?: string;
  currentMood?: string;
  tags?: string;
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
}

// Reusable input field component
const FieldInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 text-sm"
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
    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</Label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="text-sm resize-none"
    />
  </div>
);

// Section wrapper component
const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center gap-2">
      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{title}</h4>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

export const CharacterEditModal: React.FC<CharacterEditModalProps> = ({
  open,
  onOpenChange,
  character,
  onSave,
  isSaving = false,
  modelId
}) => {
  const [draft, setDraft] = useState<CharacterEditDraft>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRegeneratingAvatar, setIsRegeneratingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        baseDraft.tags = (character as Character).tags || '';
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Edit Character
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Changes apply only to this playthrough
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Avatar & Basic Info */}
              <div className="space-y-6">
{/* Avatar Display with Upload/Regenerate */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-sm relative">
                    {(isUploadingAvatar || isRegeneratingAvatar) ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
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
                      <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-3xl italic uppercase">
                        {(draft.name || character.name)?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  {/* Upload/Regenerate Buttons */}
                  <div className="flex flex-col gap-2 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      size="sm"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar || isRegeneratingAvatar}
                    >
                      {isUploadingAvatar ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={handleRegenerateAvatar}
                      disabled={isUploadingAvatar || isRegeneratingAvatar}
                    >
                      {isRegeneratingAvatar ? 'Generating...' : 'AI Generate'}
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 text-center">
                    Changes apply to this session only
                  </p>
                </div>

                {/* Basic Fields */}
                <Section title="Basic Info">
                  <FieldInput
                    label="Name"
                    value={draft.name || ''}
                    onChange={(v) => updateField('name', v)}
                    placeholder="Character name"
                  />
                  <FieldInput
                    label="Nicknames"
                    value={draft.nicknames || ''}
                    onChange={(v) => updateField('nicknames', v)}
                    placeholder="e.g., Mom, Mother (comma-separated)"
                  />
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                  <FieldTextarea
                    label="Role Description"
                    value={draft.roleDescription || ''}
                    onChange={(v) => updateField('roleDescription', v)}
                    placeholder="Character's role in the story..."
                    rows={3}
                  />
                  {!isSideCharacter && (
                    <FieldInput
                      label="Tags"
                      value={draft.tags || ''}
                      onChange={(v) => updateField('tags', v)}
                      placeholder="warrior, hero, protagonist"
                    />
                  )}
                </Section>

                {/* Control toggles - for all characters */}
                <Section title="Control">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Controlled By</Label>
                      <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button 
                          type="button"
                          onClick={() => updateField('controlledBy', 'AI')}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                            draft.controlledBy === 'AI' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          AI
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateField('controlledBy', 'User')}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                            draft.controlledBy === 'User' 
                              ? 'bg-white text-amber-600 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          User
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Character Type</Label>
                      <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button 
                          type="button"
                          onClick={() => updateField('characterRole', 'Main')}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                            draft.characterRole === 'Main' 
                              ? 'bg-white text-purple-600 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Main
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateField('characterRole', 'Side')}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                            draft.characterRole === 'Side' 
                              ? 'bg-white text-green-600 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Side
                        </button>
                      </div>
                    </div>
                  </div>
                </Section>
              </div>

              {/* Right Column - Trait Sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Physical Appearance */}
                <Section title="Physical Appearance" className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  </div>
                </Section>

                {/* Currently Wearing */}
                <Section title="Currently Wearing" className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                </Section>

                {/* Preferred Clothing */}
                <Section title="Preferred Clothing" className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  </div>
                </Section>

                {/* Side Character Specific: Background */}
                {isSideCharacter && (
                  <Section title="Background" className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                    </div>
                  </Section>
                )}

                {/* Side Character Specific: Personality */}
                {isSideCharacter && (
                  <Section title="Personality" className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="space-y-3">
                      <FieldInput
                        label="Traits"
                        value={draft.personality?.traits?.join(', ') || ''}
                        onChange={(v) => updatePersonality('traits', v.split(',').map(t => t.trim()).filter(Boolean))}
                        placeholder="e.g., Friendly, Curious, Brave"
                      />
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
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
                    </div>
                  </Section>
                )}

                {/* Custom Sections (Main characters only) - with add/remove controls */}
                {!isSideCharacter && (
                  <Section title="Custom Categories" className="space-y-4">
                    {draft.sections && draft.sections.map((section) => (
                      <div key={section.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                            placeholder="Category name"
                            className="h-8 text-sm font-bold flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSection(section.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {section.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Input
                                value={item.label}
                                onChange={(e) => updateSectionItem(section.id, item.id, 'label', e.target.value)}
                                placeholder="Label"
                                className="h-8 text-xs w-1/3"
                              />
                              <Input
                                value={item.value}
                                onChange={(e) => updateSectionItem(section.id, item.id, 'value', e.target.value)}
                                placeholder="Value"
                                className="h-8 text-xs flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItemFromSection(section.id, item.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addItemToSection(section.id)}
                            className="text-blue-600 hover:text-blue-800 w-full"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Row
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={addNewSection}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                  </Section>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-5 border-t bg-slate-50 gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 text-white border-0"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterEditModal;
