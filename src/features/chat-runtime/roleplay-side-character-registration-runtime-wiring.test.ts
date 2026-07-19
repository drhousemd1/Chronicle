import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const chatInterfaceSource = readFileSync(
  resolve(process.cwd(), 'src/components/chronicle/ChatInterfaceTab.tsx'),
  'utf8',
);

describe('dynamic side-character runtime ordering', () => {
  it('publishes and minimally persists new side characters before state review is queued', () => {
    const registrationStart = chatInterfaceSource.indexOf(
      'await persistDynamicSideCharactersBeforeStateReview({',
    );
    const publishRefUpdate = chatInterfaceSource.indexOf(
      'sideCharactersRef.current = characters;',
      registrationStart,
    );
    const minimalPersist = chatInterfaceSource.indexOf(
      'await supabaseData.saveSideCharacter(sideCharacter, conversationId, user.id);',
      registrationStart,
    );
    const sendRegistration = chatInterfaceSource.indexOf(
      'await processResponseForNewCharacters(cleanedText, aiMsg);',
    );
    const sendStateReviewQueue = chatInterfaceSource.indexOf(
      'queueAssistantDerivedWorkAfterSourcePersist([userMsg, aiMsg]',
      sendRegistration,
    );

    expect(registrationStart).toBeGreaterThan(-1);
    expect(publishRefUpdate).toBeGreaterThan(registrationStart);
    expect(minimalPersist).toBeGreaterThan(publishRefUpdate);
    expect(sendRegistration).toBeGreaterThan(-1);
    expect(sendStateReviewQueue).toBeGreaterThan(sendRegistration);
  });
});
