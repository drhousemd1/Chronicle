import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Character } from '@/types';
import { StoryRosterCharacterTile } from '@/features/story-builder/sidebar/StoryRosterCharacterTile';
import { AddCharacterPlaceholderCard } from '@/features/story-builder/sidebar/AddCharacterPlaceholderCard';

interface StoryRosterGroupProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  characters: Character[];
  onSelectCharacter: (id: string) => void;
  characterErrorsById?: Record<string, string[]>;
  expandedRosterTileId: string | null;
  onToggleExpand: (id: string) => void;
  onAddCharacter: () => void;
  addLabel: string;
  addHasError?: boolean;
  additionalErrors?: string[];
}

export const StoryRosterGroup: React.FC<StoryRosterGroupProps> = ({
  title,
  collapsed,
  onToggle,
  characters,
  onSelectCharacter,
  characterErrorsById,
  expandedRosterTileId,
  onToggleExpand,
  onAddCharacter,
  addLabel,
  addHasError,
  additionalErrors,
}) => (
  <section className="space-y-2">
    <button
      type="button"
      aria-expanded={!collapsed}
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-2 rounded-xl mb-3 shadow-lg cursor-pointer select-none text-left"
      onClick={onToggle}
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
      <div className="flex items-center justify-between relative z-[1]">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
      </div>
    </button>

    <div
      className={`transition-all duration-300 ease-in-out ${collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[2000px] opacity-100 overflow-visible'}`}
    >
      <div className="space-y-2">
        {characters.map((char) => (
          <StoryRosterCharacterTile
            key={char.id}
            char={char}
            onSelect={onSelectCharacter}
            errors={characterErrorsById?.[char.id]}
            isExpanded={expandedRosterTileId === char.id}
            onToggleExpand={onToggleExpand}
          />
        ))}
        <AddCharacterPlaceholderCard label={addLabel} hasError={addHasError} onClick={onAddCharacter} />
        {additionalErrors?.map((error, index) => (
          <p key={`${error}-${index}`} className="text-sm text-red-500 font-medium pl-2">
            {error}
          </p>
        ))}
      </div>
    </div>
  </section>
);
