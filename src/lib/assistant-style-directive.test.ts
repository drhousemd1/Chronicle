import { describe, expect, it } from 'vitest';

import { analyzeAssistantCandidateStyle, analyzeRecentAssistantStyle } from '@/lib/assistant-style-directive';

const telemetryText = (value: unknown) => JSON.stringify(value);

describe('assistant style telemetry', () => {
  it('compares assistant responses against assistant responses instead of the latest user message', () => {
    const telemetry = analyzeRecentAssistantStyle([
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

    expect(telemetry.triggered).toBe(true);
    expect(telemetry.flags).toContain('repeated_action_dialogue_thought_cadence');
    expect(telemetry.diagnosticOnly).toBe(true);
    expect(telemetryText(telemetry)).not.toContain('[STYLE ADJUSTMENT FOR THIS TURN]');
    expect(telemetryText(telemetry)).not.toContain('[OUTPUT REVISION REQUIRED]');
  });

  it('stays untriggered when only one assistant response exists', () => {
    const telemetry = analyzeRecentAssistantStyle([
      {
        role: 'user',
        text: 'James: *He looks through the storm.* "Do you see that?"',
      },
      {
        role: 'assistant',
        text: 'Sarah: *She shields her eyes from the snow.* "Maybe. Keep close."',
      },
    ]);

    expect(telemetry.triggered).toBe(false);
    expect(telemetry.flags).toEqual([]);
  });

  it('detects narration-heavy outputs with little external dialogue without returning prompt text', () => {
    const telemetry = analyzeRecentAssistantStyle([
      {
        role: 'assistant',
        text: 'Sarah: *The storm hammered the windows while she crossed the room, checking the blanket, the fireplace, the door, and the narrow bed with the same tense precision she had used all night, her shoulders tight as she tried to keep everyone moving without letting the fear show on her face. The cold still clung to the walls, the floorboards creaked beneath her boots, and every sound from outside made her pause before she forced herself onward again.* "Move."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *The cabin felt too small around her as the blanket dragged against her damp clothing and the fading fire left every corner shadowed, each sound from outside making her tense while she tried to stay still, breathe through the cold, and ignore the pressure building under her skin. The mattress dipped under every shift, the air felt heavy and stale, and the same nervous awareness kept pulling her attention away from what anyone actually said.* "Fine."',
      },
    ]);

    expect(telemetry.triggered).toBe(true);
    expect(telemetry.flags).toContain('narration_heavy_output');
    expect(telemetry.flags).toContain('low_external_dialogue');
    expect(telemetryText(telemetry)).not.toContain('Move into purposeful external dialogue');
  });

  it('detects repeated descriptive and topic terms as telemetry fields', () => {
    const telemetry = analyzeRecentAssistantStyle([
      {
        role: 'assistant',
        text: 'Sarah: *The red fabric shifted under the blanket while the fireplace painted the cabin walls in orange light.* "Stay close."',
      },
      {
        role: 'assistant',
        text: 'Ashley: *The blanket pulled tighter as the fireplace glow faded across the cabin, leaving the red fabric half-hidden in shadow.* "I am trying."',
      },
    ]);

    expect(telemetry.triggered).toBe(true);
    expect(telemetry.flags).toContain('repeated_descriptive_terms');
    expect(telemetry.repeatedDescriptiveTerms.length).toBeGreaterThan(0);
  });

  it('detects repeated candidate cadence and phrasing as telemetry instead of triggering a hidden retry', () => {
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

    const telemetry = analyzeAssistantCandidateStyle(
      previousMessages,
      'Ashley: *Her palms moved slowly down his back while the quiet room pressed around them.* "Just relax for me, sweetie." (Every small reaction made her want to push further.)',
      [28, 29],
    );

    expect(telemetry.triggered).toBe(true);
    expect(telemetry.flags).toContain('same_candidate_structure');
    expect(telemetry.flags).toContain('reused_short_dialogue_phrasing');
    expect(telemetry.hiddenRetryAllowed).toBe(false);
    expect(telemetryText(telemetry)).not.toContain('[OUTPUT REVISION REQUIRED]');
  });

  it('detects offloading questions while keeping in-character consent and boundary questions untriggered', () => {
    const offloaded = analyzeAssistantCandidateStyle(
      [{ role: 'assistant', text: 'Ashley: *She looked over from the doorway.* "I heard you."' }],
      'Ashley: "What do you want me to do?"',
    );
    const inCharacter = analyzeAssistantCandidateStyle(
      [{ role: 'assistant', text: 'Ashley: *She stayed near the window with the letter pressed flat in both hands.* "You know why I came here."' }],
      'Ashley: *She keeps her hand still, waiting for his answer before moving closer.* "Do you want me to stop?"',
    );

    expect(offloaded.triggered).toBe(true);
    expect(offloaded.flags).toContain('offloaded_scene_to_user');
    expect(inCharacter.triggered).toBe(false);
  });

  it('detects detailed response collapse as a diagnostic flag only', () => {
    const telemetry = analyzeRecentAssistantStyle([
      { role: 'assistant', text: 'Ashley: "Fine."' },
      { role: 'assistant', text: 'Sarah: "Go."' },
    ], [14, 12], 'detailed');

    expect(telemetry.triggered).toBe(true);
    expect(telemetry.flags).toContain('detailed_response_collapse');
    expect(telemetryText(telemetry)).not.toContain('[STYLE CORRECTION]');
  });
});
