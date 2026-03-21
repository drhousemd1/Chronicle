import React from 'react';
import {
  ScenarioCardEditorView,
  type ScenarioCardEditorViewProps,
} from '@/features/character-editor-modal/ScenarioCardEditorView';

export type ScenarioCardViewProps = ScenarioCardEditorViewProps;

export const ScenarioCardView: React.FC<ScenarioCardViewProps> = (props) => (
  <ScenarioCardEditorView {...props} />
);

export default ScenarioCardView;
