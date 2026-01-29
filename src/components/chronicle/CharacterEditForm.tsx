// Reusable inline edit form for character cards (Main + Side + Auto-Generated)
// Session-scoped: edits persist only within the active playthrough

import React, { useState, useEffect } from 'react';
import { Character, SideCharacter, PhysicalAppearance, CurrentlyWearing, PreferredClothing, CharacterTraitSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Save } from 'lucide-react';

// Unified draft type for both Character and SideCharacter
export interface CharacterEditDraft {
  name?: string;
  nicknames?: string;
  age?: string;
  sexType?: string;
  roleDescription?: string;
  location?: string;
  currentMood?: string;
  physicalAppearance?: Partial<PhysicalAppearance>;
  currentlyWearing?: Partial<CurrentlyWearing>;
  preferredClothing?: Partial<PreferredClothing>;
  sections?: CharacterTraitSection[];
}

interface CharacterEditFormProps {
  character: Character | SideCharacter;
  onSave: (draft: CharacterEditDraft) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const CharacterEditForm: React.FC<CharacterEditFormProps> = ({
  character,
  onSave,
  onCancel,
  isSaving = false
}) => {
  const [draft, setDraft] = useState<CharacterEditDraft>({});

  // Initialize draft from character when component mounts or character changes
  useEffect(() => {
    setDraft({
      name: character.name,
      nicknames: character.nicknames || '',
      age: character.age,
      sexType: character.sexType,
      roleDescription: character.roleDescription,
      location: character.location,
      currentMood: character.currentMood,
      physicalAppearance: { ...character.physicalAppearance },
      currentlyWearing: { ...character.currentlyWearing },
      preferredClothing: { ...character.preferredClothing },
      sections: 'sections' in character ? [...character.sections] : undefined,
    });
  }, [character]);

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

  const handleSave = () => {
    onSave(draft);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Basics Section */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Basics</h4>
        
        <div className="space-y-2">
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Name</Label>
            <Input
              value={draft.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="h-8 text-xs"
            placeholder="Character name"
            />
          </div>
          
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nicknames</Label>
            <Input
              value={draft.nicknames || ''}
              onChange={(e) => updateField('nicknames', e.target.value)}
              className="h-8 text-xs"
              placeholder="e.g., Mom, Mother (comma-separated)"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Age</Label>
              <Input
                value={draft.age || ''}
                onChange={(e) => updateField('age', e.target.value)}
                className="h-8 text-xs"
                placeholder="Age"
              />
            </div>
            <div>
              <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sex</Label>
              <Input
                value={draft.sexType || ''}
                onChange={(e) => updateField('sexType', e.target.value)}
                className="h-8 text-xs"
                placeholder="Sex/Gender"
              />
            </div>
          </div>

          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Role Description</Label>
            <Textarea
              value={draft.roleDescription || ''}
              onChange={(e) => updateField('roleDescription', e.target.value)}
              className="text-xs min-h-[60px] resize-none"
              placeholder="Character's role in the story"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location</Label>
              <Input
                value={draft.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                className="h-8 text-xs"
                placeholder="Current location"
              />
            </div>
            <div>
              <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mood</Label>
              <Input
                value={draft.currentMood || ''}
                onChange={(e) => updateField('currentMood', e.target.value)}
                className="h-8 text-xs"
                placeholder="Current mood"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Physical Appearance Section */}
      <div className="space-y-3 border-t border-slate-200/60 pt-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Physical Appearance</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hair Color</Label>
            <Input
              value={draft.physicalAppearance?.hairColor || ''}
              onChange={(e) => updatePhysicalAppearance('hairColor', e.target.value)}
              className="h-8 text-xs"
              placeholder="Hair color"
            />
          </div>
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Eye Color</Label>
            <Input
              value={draft.physicalAppearance?.eyeColor || ''}
              onChange={(e) => updatePhysicalAppearance('eyeColor', e.target.value)}
              className="h-8 text-xs"
              placeholder="Eye color"
            />
          </div>
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Build</Label>
            <Input
              value={draft.physicalAppearance?.build || ''}
              onChange={(e) => updatePhysicalAppearance('build', e.target.value)}
              className="h-8 text-xs"
              placeholder="Body build"
            />
          </div>
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Height</Label>
            <Input
              value={draft.physicalAppearance?.height || ''}
              onChange={(e) => updatePhysicalAppearance('height', e.target.value)}
              className="h-8 text-xs"
              placeholder="Height"
            />
          </div>
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Skin Tone</Label>
            <Input
              value={draft.physicalAppearance?.skinTone || ''}
              onChange={(e) => updatePhysicalAppearance('skinTone', e.target.value)}
              className="h-8 text-xs"
              placeholder="Skin tone"
            />
          </div>
        </div>
      </div>

      {/* Currently Wearing Section */}
      <div className="space-y-3 border-t border-slate-200/60 pt-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Currently Wearing</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Top</Label>
            <Input
              value={draft.currentlyWearing?.top || ''}
              onChange={(e) => updateCurrentlyWearing('top', e.target.value)}
              className="h-8 text-xs"
              placeholder="Top wear"
            />
          </div>
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bottom</Label>
            <Input
              value={draft.currentlyWearing?.bottom || ''}
              onChange={(e) => updateCurrentlyWearing('bottom', e.target.value)}
              className="h-8 text-xs"
              placeholder="Bottom wear"
            />
          </div>
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Undergarments</Label>
            <Input
              value={draft.currentlyWearing?.undergarments || ''}
              onChange={(e) => updateCurrentlyWearing('undergarments', e.target.value)}
              className="h-8 text-xs"
              placeholder="Undergarments"
            />
          </div>
          <div>
            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Miscellaneous</Label>
            <Input
              value={draft.currentlyWearing?.miscellaneous || ''}
              onChange={(e) => updateCurrentlyWearing('miscellaneous', e.target.value)}
              className="h-8 text-xs"
              placeholder="Accessories, etc."
            />
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          className="flex-1 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 text-xs bg-blue-500 hover:bg-blue-600"
        >
          <Save className="w-3 h-3 mr-1" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default CharacterEditForm;
