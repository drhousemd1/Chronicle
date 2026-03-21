import React from 'react';
import {
  CharacterEditorModalScreen,
  type CharacterEditorModalScreenProps,
  type CharacterEditDraft,
} from '@/features/character-editor-modal/CharacterEditorModalScreen';

export type CharacterEditModalProps = CharacterEditorModalScreenProps;
export type { CharacterEditDraft };

export const CharacterEditModal: React.FC<CharacterEditModalProps> = (props) => (
  <CharacterEditorModalScreen {...props} />
);

export default CharacterEditModal;
