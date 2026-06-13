import { describe, expect, it } from 'vitest';

import {
  parseMessageTokens,
  sanitizeAssistantMessageText,
  tokensToStyledHtml,
} from './message-formatting-utils';

describe('chat message formatting helpers', () => {
  it('sanitizes assistant wrapper artifacts without changing normal roleplay prose', () => {
    const sanitized = sanitizeAssistantMessageText([
      '```',
      '<writer_draft>',
      'Ashley:: *(I need to stay calm.)*',
      'priority: "Move now."',
      'The door opens — slowly.',
      '</writer_draft>',
    ].join('\n'));

    expect(sanitized).toBe([
      'Ashley: (I need to stay calm.)',
      '"Move now."',
      'The door opens... slowly.',
    ].join('\n'));
  });

  it('parses action, speech, thought, and narration in their original order', () => {
    expect(parseMessageTokens('Lead *moves* "Hi there," (not yet) ending')).toEqual([
      { type: 'plain', content: 'Lead ' },
      { type: 'action', content: 'moves' },
      { type: 'plain', content: ' ' },
      { type: 'speech', content: 'Hi there,', trailing: '' },
      { type: 'plain', content: ' ' },
      { type: 'thought', content: 'not yet' },
      { type: 'plain', content: ' ending' },
    ]);
  });

  it('removes scene tags during token parsing and preserves optional speech trailing punctuation', () => {
    expect(parseMessageTokens('[SCENE: Cabin]\n"He knows"!')).toEqual([
      { type: 'speech', content: 'He knows', trailing: '!' },
    ]);
  });

  it('renders styled editor html with escaping and existing color contracts', () => {
    const html = tokensToStyledHtml(
      parseMessageTokens('*<moves>* "Hi" (secret)', true),
      true,
      'default',
    );

    expect(html).toContain('*&lt;moves&gt;*');
    expect(html).toContain('"Hi"');
    expect(html).toContain('(secret)');
    expect(html).toContain('rgba(199,210,254,0.9)');
  });
});
