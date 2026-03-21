import React from 'react';
import {
  StoryBuilderScreen,
  type StoryBuilderScreenProps,
} from '@/features/story-builder/StoryBuilderScreen';

export type WorldTabProps = StoryBuilderScreenProps;

export const WorldTab: React.FC<WorldTabProps> = (props) => (
  <StoryBuilderScreen {...props} />
);

export default WorldTab;
