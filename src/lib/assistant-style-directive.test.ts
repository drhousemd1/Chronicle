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

  it('detects narration-heavy outputs with little external dialogue', () => {
    const directive = buildAssistantStyleDirective([
      {
        role: 'assistant',
        text: 'Sarah: *The storm hammered the windows while she crossed the room, checking the blanket, the fireplace, the door, and the narrow bed with the same tense precision she had used all night, her shoulders tight as she tried to keep everyone moving without letting the fear show on her face. The cold still clung to the walls, the floorboards creaked beneath her boots, and every sound from outside made her pause before she forced herself onward again.* "Move."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *The cabin felt too small around her as the blanket dragged against her damp clothing and the fading fire left every corner shadowed, each sound from outside making her tense while she tried to stay still, breathe through the cold, and ignore the pressure building under her skin. The mattress dipped under every shift, the air felt heavy and stale, and the same nervous awareness kept pulling her attention away from what anyone actually said.* "Fine."',
      },
    ]);

    expect(directive).toContain('narration-heavy responses');
    expect(directive).toContain('missing or very low external dialogue');
    expect(directive).toContain('do not bury external dialogue behind a long narration opening');
  });

  it('detects repeated descriptive terms across recent assistant outputs', () => {
    const directive = buildAssistantStyleDirective([
      {
        role: 'assistant',
        text: 'Sarah: *The red fabric shifted under the blanket while the fireplace painted the cabin walls in orange light.* "Stay close."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *The blanket pulled tighter as the fireplace glow faded across the cabin, leaving the red fabric half-hidden in shadow.* "I am trying."',
      },
    ]);

    expect(directive).toContain('repeated descriptive terms');
    expect(directive).toContain('do not reuse recent descriptive terms');
  });
});
