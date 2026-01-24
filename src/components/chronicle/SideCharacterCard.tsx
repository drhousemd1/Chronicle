// Dedicated component for displaying AI-generated side characters
// Separate from main character card for easier future modifications

import React from 'react';
import { SideCharacter, CharacterTraitSection } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SideCharacterCardProps {
  character: SideCharacter;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStartEdit?: () => void;
  onDelete?: () => void;
  openSections: Record<string, boolean>;
  onToggleSection: (sectionId: string) => void;
  isUpdating?: boolean;
}

export const SideCharacterCard: React.FC<SideCharacterCardProps> = ({
  character,
  isExpanded,
  onToggleExpand,
  onStartEdit,
  onDelete,
  openSections,
  onToggleSection,
  isUpdating = false
}) => {
  // Convert side character data to trait sections for display
  const createBasicsSection = (): CharacterTraitSection => ({
    id: 'sc-basics',
    title: 'Basics',
    items: [
      { id: 'age', label: 'Age', value: character.age || '', createdAt: 0, updatedAt: 0 },
      { id: 'sex', label: 'Sex', value: character.sexType || '', createdAt: 0, updatedAt: 0 },
      { id: 'role', label: 'Role', value: character.roleDescription || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const createPhysicalSection = (): CharacterTraitSection => ({
    id: 'sc-physical',
    title: 'Physical Appearance',
    items: [
      { id: 'hair', label: 'Hair Color', value: character.physicalAppearance?.hairColor || '', createdAt: 0, updatedAt: 0 },
      { id: 'eyes', label: 'Eye Color', value: character.physicalAppearance?.eyeColor || '', createdAt: 0, updatedAt: 0 },
      { id: 'build', label: 'Build', value: character.physicalAppearance?.build || '', createdAt: 0, updatedAt: 0 },
      { id: 'height', label: 'Height', value: character.physicalAppearance?.height || '', createdAt: 0, updatedAt: 0 },
      { id: 'skin', label: 'Skin Tone', value: character.physicalAppearance?.skinTone || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const createBackgroundSection = (): CharacterTraitSection => ({
    id: 'sc-background',
    title: 'Background',
    items: [
      { id: 'relationship', label: 'Relationship Status', value: character.background?.relationshipStatus || '', createdAt: 0, updatedAt: 0 },
      { id: 'residence', label: 'Residence', value: character.background?.residence || '', createdAt: 0, updatedAt: 0 },
      { id: 'education', label: 'Education', value: character.background?.educationLevel || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const createPersonalitySection = (): CharacterTraitSection => ({
    id: 'sc-personality',
    title: 'Personality',
    items: [
      { id: 'traits', label: 'Traits', value: character.personality?.traits?.join(', ') || '', createdAt: 0, updatedAt: 0 },
      { id: 'desires', label: 'Desires', value: character.personality?.desires || '', createdAt: 0, updatedAt: 0 },
      { id: 'fears', label: 'Fears', value: character.personality?.fears || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const renderSection = (section: CharacterTraitSection) => {
    if (section.items.length === 0) return null;
    
    const isOpen = openSections[section.id] !== false;
    return (
      <div key={section.id} className="border-t border-purple-100 first:border-t-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSection(section.id); }}
          className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-purple-50/50 transition-colors group"
        >
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.15em]">{section.title}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12" height="12"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 text-purple-300 group-hover:text-purple-500 ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {isOpen && (
          <div className="pb-4 px-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {section.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">{item.label}</span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">{item.value || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`rounded-2xl transition-all duration-300 border-2 backdrop-blur-sm relative ${
      isExpanded ? 'bg-white border-purple-200 shadow-sm' : 'bg-white/30 border-transparent hover:bg-white'
    } ${isUpdating ? 'ring-2 ring-blue-400/60' : ''}`}>
      {/* Blue vignette overlay - scoped to this card */}
      {isUpdating && (
        <div 
          className="absolute inset-0 z-[1] pointer-events-none rounded-2xl overflow-hidden animate-vignette-pulse"
          style={{
            background: 'radial-gradient(ellipse 120% 100% at center 30%, transparent 25%, rgba(59, 130, 246, 0.25) 50%, rgba(59, 130, 246, 0.5) 80%, rgba(59, 130, 246, 1) 100%)'
          }}
        />
      )}
      
      {/* "Updating..." text overlay - top-left with ethereal glow */}
      {isUpdating && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span 
            className="text-indigo-200/90 text-xs italic font-light tracking-tight animate-in fade-in zoom-in-95 duration-500"
            style={{
              textShadow: '0 0 8px rgba(129, 140, 248, 0.6), 0 0 16px rgba(129, 140, 248, 0.4), 0 0 24px rgba(129, 140, 248, 0.2)'
            }}
          >
            Updating...
          </span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={onToggleExpand}
          className="w-full flex flex-col items-center gap-2 p-3 text-center group"
        >
          <div className="relative">
            <div className={`w-20 h-20 rounded-full border-2 shadow-sm overflow-hidden bg-purple-50 transition-all duration-300 ${
              isExpanded ? 'border-purple-400 scale-105 shadow-purple-100' : 'border-purple-100 group-hover:border-purple-200'
            }`}>
              {character.isAvatarGenerating ? (
                <div className="w-full h-full flex items-center justify-center bg-purple-100">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : character.avatarDataUrl ? (
                <img src={character.avatarDataUrl} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-purple-300 text-xl italic uppercase">
                  {character.name.charAt(0)}
                </div>
              )}
            </div>
            <Badge 
              variant={character.controlledBy === 'User' ? 'default' : 'secondary'}
              className={`absolute -bottom-1 -right-1 text-[8px] px-1.5 py-0.5 shadow-sm border-0 ${
                character.controlledBy === 'User' 
                  ? 'bg-blue-500 hover:bg-blue-500 text-white' 
                  : 'bg-slate-500 hover:bg-slate-500 text-white'
              }`}
            >
              {character.controlledBy}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-sm font-bold tracking-tight transition-colors ${isExpanded ? 'text-purple-600' : 'text-slate-800'}`}>
              {character.name}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14" height="14"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 text-purple-400 ${isExpanded ? 'rotate-180 text-purple-500' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>
        
        {/* Edit dropdown menu - visible when expanded */}
        {isExpanded && onStartEdit && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-400 hover:text-purple-600 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-lg z-50">
                <DropdownMenuItem onClick={onStartEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit character
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete character
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-1 space-y-1 animate-in zoom-in-95 duration-300">
          {/* Quick role description */}
          {character.roleDescription && (
            <p className="text-xs text-purple-500 italic text-center pb-2 border-b border-purple-100 mb-2">
              {character.roleDescription}
            </p>
          )}
          
          {renderSection(createBasicsSection())}
          {renderSection(createPhysicalSection())}
          {renderSection(createBackgroundSection())}
          {renderSection(createPersonalitySection())}
        </div>
      )}
    </div>
  );
};

export default SideCharacterCard;
