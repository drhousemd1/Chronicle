import React from 'react';
import { Character } from '@/types';
import { StoryRosterGroup } from '@/features/story-builder/sidebar/StoryRosterGroup';

interface StoryRosterSidebarProps {
  characters: Character[];
  onSelectCharacter: (id: string) => void;
  characterErrorsById?: Record<string, string[]>;
  expandedRosterTileId: string | null;
  onToggleExpand: (id: string) => void;
  onAddCharacter: () => void;
  mainCharsCollapsed: boolean;
  sideCharsCollapsed: boolean;
  onToggleMainChars: () => void;
  onToggleSideChars: () => void;
  noAICharacterError?: string;
  noUserCharacterError?: string;
}

export const StoryRosterSidebar: React.FC<StoryRosterSidebarProps> = ({
  characters,
  onSelectCharacter,
  characterErrorsById,
  expandedRosterTileId,
  onToggleExpand,
  onAddCharacter,
  mainCharsCollapsed,
  sideCharsCollapsed,
  onToggleMainChars,
  onToggleSideChars,
  noAICharacterError,
  noUserCharacterError,
}) => {
  const mainCharacters = characters.filter((character) => character.characterRole === 'Main');
  const sideCharacters = characters.filter((character) => character.characterRole === 'Side');

  return (
    // Layout guardrail: keep lg:h-full + lg:max-h-none so roster fills pane height
    // when split-pane mode is active; mobile/tablet still uses capped stacked mode.
    <aside className="w-full lg:w-[clamp(250px,28vw,300px)] flex-shrink-0 bg-[#2a2a2f] shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] flex flex-col h-auto lg:h-full max-h-[52vh] lg:max-h-none">
      <div className="p-6 bg-[#3c3e47] shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)]">
        <div className="text-[10px] font-black text-white uppercase tracking-widest">Character Roster</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none pb-20 bg-[#2a2a2f]">
        <StoryRosterGroup
          title="Main Characters"
          collapsed={mainCharsCollapsed}
          onToggle={onToggleMainChars}
          characters={mainCharacters}
          onSelectCharacter={onSelectCharacter}
          characterErrorsById={characterErrorsById}
          expandedRosterTileId={expandedRosterTileId}
          onToggleExpand={onToggleExpand}
          onAddCharacter={onAddCharacter}
          addLabel="Main Character"
          addHasError={Boolean(noAICharacterError || noUserCharacterError)}
          additionalErrors={[noAICharacterError, noUserCharacterError].filter(Boolean) as string[]}
        />

        <StoryRosterGroup
          title="Side Characters"
          collapsed={sideCharsCollapsed}
          onToggle={onToggleSideChars}
          characters={sideCharacters}
          onSelectCharacter={onSelectCharacter}
          characterErrorsById={characterErrorsById}
          expandedRosterTileId={expandedRosterTileId}
          onToggleExpand={onToggleExpand}
          onAddCharacter={onAddCharacter}
          addLabel="Side Character"
        />
      </div>
    </aside>
  );
};
