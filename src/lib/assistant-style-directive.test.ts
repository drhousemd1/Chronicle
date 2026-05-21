import { describe, expect, it } from 'vitest';

import { buildAssistantStyleDirective } from '@/lib/assistant-style-directive';

describe('buildAssistantStyleDirective', () => {
  it('compares assistant responses against assistant responses instead of the latest user message', () => {
    const directive = buildAssistantStyleDirective([
      {
        role: 'assistant',
        text: 'Sarah: *She moved through the storm.* "Stay close." (They could not get separated.)',
      },
      {
        role: 'user',
        text: 'James: "Can you hear me?"',
      },
      {
        role: 'assistant',
        text: 'Ashley: *She stumbled after them.* "I am here." (She had to keep moving.)\n\nSarah: *She looked back.* "Keep going."',
      },
    ]);

    expect(directive).toContain('[STYLE ADJUSTMENT FOR THIS TURN]');
    expect(directive).toContain("Compare against your own previous 2-3 assistant character blocks, not the user's message.");
    expect(directive).toContain('repeated action -> dialogue -> internal thought cadence');
  });

  it('stays silent when only one assistant response exists', () => {
    const directive = buildAssistantStyleDirective([
      {
        role: 'user',
        text: 'James: *He looks through the storm.* "Do you see that?"',
      },
      {
        role: 'assistant',
        text: 'Sarah: *She shields her eyes from the snow.* "Maybe. Keep close."',
      },
    ]);

    expect(directive).toBe('');
  });
});
