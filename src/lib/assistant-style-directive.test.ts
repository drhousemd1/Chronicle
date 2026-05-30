import { describe, expect, it } from 'vitest';

import { buildAssistantRepetitionRepairDirective, buildAssistantStyleDirective } from '@/lib/assistant-style-directive';

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
    expect(directive).toContain('start with external dialogue when that fits the current exchange');
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
    expect(directive).toContain('Do not reuse the same descriptive focus');
  });

  it('detects repeated action-first dialogue blocks without requiring internal thoughts', () => {
    const directive = buildAssistantStyleDirective([
      {
        role: 'assistant',
        text: 'Ashley: *She crossed the room and adjusted the folded fabric in her hands while watching him closely.* "Keep that on for now. We can talk about the rest once you settle down."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *She stepped closer and smoothed the fabric against his shoulder while keeping her voice gentle.* "Keep wearing it for me. No one else needs to know about this yet."',
      },
    ]);

    expect(directive).toContain('repeated action-first dialogue cadence');
    expect(directive).toContain('start with external dialogue when that fits the current exchange');
  });

  it('detects repeated dialogue or topic focus even when wording changes', () => {
    const directive = buildAssistantStyleDirective([
      {
        role: 'assistant',
        text: 'Ashley: *She lowered her voice.* "Keep wearing it for now. This can stay our private secret."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *She smiled softly.* "You should keep wearing this, and our private secret can stay between us."',
      },
    ]);

    expect(directive).toContain('repeated dialogue or topic focus');
    expect(directive).toContain('topic focus');
  });

  it('builds a repair directive when a candidate output repeats recent assistant cadence and phrasing', () => {
    const previousMessages = [
      {
        role: 'assistant',
        text: 'Ashley: *Her palms moved slowly down his back while the quiet room pressed around them.* "Just relax for me, sweetie." (Every small reaction made her want to push further.)',
      },
      {
        role: 'assistant',
        text: 'Ashley: *Her palms moved slowly across his back while the quiet room held around them.* "Just relax for me, sweetie." (Every small reaction made her want to push further.)',
      },
    ];

    const directive = buildAssistantRepetitionRepairDirective(
      previousMessages,
      'Ashley: *Her palms moved slowly down his back while the quiet room pressed around them.* "Just relax for me, sweetie." (Every small reaction made her want to push further.)',
      [28, 29],
    );

    expect(directive).toContain('[OUTPUT REVISION REQUIRED]');
    expect(directive).toContain('do not rewrite the same exchange with swapped wording');
    expect(directive).toContain("develop the AI-controlled character's side of the current exchange");
  });

  it('builds a repair directive when a candidate repeats the action-first dialogue cadence', () => {
    const previousMessages = [
      {
        role: 'assistant',
        text: 'Ashley: *She moved to the dresser and picked up the folded garment with a careful smile.* "Keep it on for me. This stays between us."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *She stepped back and watched the garment settle against him with visible approval.* "Keep wearing it. No one needs to know yet."',
      },
    ];

    const directive = buildAssistantRepetitionRepairDirective(
      previousMessages,
      'Ashley: *She reached forward and smoothed the garment against him with the same careful smile.* "Keep it on for me. This stays between us."',
      [31, 34],
    );

    expect(directive).toContain('[OUTPUT REVISION REQUIRED]');
    expect(directive).toContain('same action-first dialogue cadence');
  });

  it('does not repair a candidate for structure alone when the content is otherwise fresh', () => {
    const previousMessages = [
      {
        role: 'assistant',
        text: 'Sarah: *She checked the lantern and glanced toward the hallway.* "I will look upstairs while you stay here."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *She folded the blanket and set it beside the chair.* "That should keep you warm for now."',
      },
    ];

    const directive = buildAssistantRepetitionRepairDirective(
      previousMessages,
      'Sarah: *She opened the old ledger and traced the faded handwriting with one finger.* "This changes what we know about the estate."',
      [22, 24],
    );

    expect(directive).toBe('');
  });

  it('compares a regenerate candidate against the message being replaced', () => {
    const directive = buildAssistantRepetitionRepairDirective(
      [],
      'Ashley: *She leaned closer with a private smile.* "Keep it on for me. This stays between us."',
      [],
      ['Ashley: *She leaned closer with a private smile.* "Keep it on for me. This stays between us."'],
    );

    expect(directive).toContain('[OUTPUT REVISION REQUIRED]');
    expect(directive).toContain('reused short dialogue phrasing');
  });
});
