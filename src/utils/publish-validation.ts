import type { Character, World, OpeningDialog, ContentThemes, StoryGoal, LocationEntry } from '@/types';

export interface PublishValidationErrors {
  storyTitle?: string;
  storyPremise?: string;
  openingDialog?: string;
  tags?: string;
  storyType?: string;
  noCharacters?: string;
  characters?: Record<string, string[]>; // characterId -> array of error messages
  location?: string;
  storyArc?: string;
}

export function validateForPublish(data: {
  scenarioTitle: string;
  world: World;
  characters: Character[];
  openingDialog: OpeningDialog;
  contentThemes: ContentThemes;
}): PublishValidationErrors {
  const errors: PublishValidationErrors = {};
  const { scenarioTitle, world, characters, openingDialog, contentThemes } = data;

  // 1. Story title
  const trimmedTitle = (scenarioTitle || '').trim();
  if (!trimmedTitle || trimmedTitle === 'Untitled Story') {
    errors.storyTitle = 'Story title is required';
  }

  // 2. Story premise
  if (!(world.core.storyPremise || '').trim()) {
    errors.storyPremise = 'Story premise is required';
  }

  // 3. Opening dialog
  if (!(openingDialog.text || '').trim()) {
    errors.openingDialog = 'Opening dialog is required';
  }

  // 4. Tags (at least 5 across all categories, excluding storyType)
  const tagCount =
    (contentThemes.characterTypes?.length || 0) +
    (contentThemes.genres?.length || 0) +
    (contentThemes.origin?.length || 0) +
    (contentThemes.triggerWarnings?.length || 0) +
    (contentThemes.customTags?.length || 0);
  if (tagCount < 5) {
    errors.tags = `At least 5 tags required (currently ${tagCount})`;
  }

  // 5. SFW/NSFW
  if (contentThemes.storyType !== 'SFW' && contentThemes.storyType !== 'NSFW') {
    errors.storyType = 'SFW or NSFW must be selected';
  }

  // 6. At least 1 character
  if (characters.length === 0) {
    errors.noCharacters = 'At least 1 character is required';
  }

  // 7 & 10. Character names + NSFW age check
  const charErrors: Record<string, string[]> = {};
  const isNsfw = contentThemes.storyType === 'NSFW';

  for (const char of characters) {
    const msgs: string[] = [];
    const name = (char.name || '').trim();
    if (!name || name === 'New Character') {
      msgs.push('Name is required');
    }
    if (isNsfw) {
      const ageNum = parseInt(char.age, 10);
      if (!isNaN(ageNum) && ageNum < 18) {
        msgs.push('Characters in NSFW stories must be 18+');
      }
    }
    if (msgs.length > 0) {
      charErrors[char.id] = msgs;
    }
  }
  if (Object.keys(charErrors).length > 0) {
    errors.characters = charErrors;
  }

  // 8. Location
  const locs: LocationEntry[] = world.core.structuredLocations || [];
  const hasValidLocation = locs.some(
    (l) => (l.label || '').trim() && (l.description || '').trim()
  );
  if (!hasValidLocation) {
    errors.location = 'At least 1 location with label and description is required';
  }

  // 9. Story arc
  const goals: StoryGoal[] = world.core.storyGoals || [];
  const hasValidArc = goals.some(
    (g) => (g.title || '').trim() && (g.desiredOutcome || '').trim()
  );
  if (!hasValidArc) {
    errors.storyArc = 'At least 1 story arc with title and desired outcome is required';
  }

  return errors;
}

export function hasPublishErrors(errors: PublishValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
