import React from 'react';
import {
  CharacterBuilderScreen,
  type CharacterBuilderScreenProps,
} from '@/features/character-builder/CharacterBuilderScreen';

export type CharactersTabProps = CharacterBuilderScreenProps;

export const CharactersTab: React.FC<CharactersTabProps> = (props) => (
  <CharacterBuilderScreen {...props} />
);

export default CharactersTab;
