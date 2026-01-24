import { ScenarioData, Character, World, TimeOfDay, Memory } from "../types";
import { supabase } from "@/integrations/supabase/client";

const TIME_DESCRIPTIONS: Record<TimeOfDay, string> = {
  sunrise: "early morning (sunrise, around 6-10am)",
  day: "daytime (mid-morning to afternoon, around 10am-5pm)",
  sunset: "evening (sunset, around 5-9pm)",
  night: "nighttime (after dark, around 9pm-6am)"
};

// Critical dialog formatting rules that are always included
const CRITICAL_DIALOG_RULES = `Enclose all spoken dialogue in " ".
Enclose all physical actions or descriptions in * *.
Enclose all internal thoughts in ( ).`;

function getSystemInstruction(
  appData: ScenarioData, 
  currentDay?: number, 
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean
): string {
  // Combine critical rules with any user-defined additional formatting
  const fullDialogFormatting = CRITICAL_DIALOG_RULES + (appData.world.core.dialogFormatting ? `\n${appData.world.core.dialogFormatting}` : '');
  
  const worldContext = `
    SETTING OVERVIEW: ${appData.world.core.settingOverview}
    RULES/TECH: ${appData.world.core.rulesOfMagicTech}
    FACTIONS: ${appData.world.core.factions}
    LOCATIONS: ${appData.world.core.locations}
    TONE & THEMES: ${appData.world.core.toneThemes}
    NARRATIVE STYLE: ${appData.world.core.narrativeStyle}
    DIALOG FORMATTING: ${fullDialogFormatting}
  `;

  const characterContext = appData.characters.map(c => {
    const traits = c.sections.map(s => `${s.title}: ${s.items.map(it => `${it.label}=${it.value}`).join(', ')}`).join('\n');
    return `CHARACTER: ${c.name} (${c.sexType})
ROLE: ${c.characterRole}
CONTROL: ${c.controlledBy}
TAGS: ${c.tags}
TRAITS:
${traits}`;
  }).join('\n\n');

  const codexContext = appData.world.entries.map(e => `CODEX [${e.title}]: ${e.body}`).join('\n');
  
  const sceneTags = appData.scenes.flatMap(s => s.tags ?? []).join(', ');

  // Temporal context section
  const temporalContext = currentDay && currentTimeOfDay ? `
    CURRENT TEMPORAL CONTEXT:
    - Day: ${currentDay} of the story
    - Time of Day: ${TIME_DESCRIPTIONS[currentTimeOfDay]}
    
    TEMPORAL CONSISTENCY RULES:
    - Generate dialogue and actions appropriate for the current time of day
    - Characters should reference activities typical for ${currentTimeOfDay} (e.g., breakfast/waking in morning, sleep preparation at night)
    - Maintain continuity with the current day number
    - Be consistent with time-appropriate lighting, activities, and character energy levels
  ` : '';

  // Memories context section
  const memoriesContext = memoriesEnabled !== false && memories && memories.length > 0 ? `
    STORY MEMORIES (Established facts and events - DO NOT contradict these):
    ${memories
      .sort((a, b) => (a.day || 0) - (b.day || 0))
      .map(m => {
        const timeInfo = m.day ? `[Day ${m.day}${m.timeOfDay ? `, ${m.timeOfDay}` : ''}]` : '[Unknown time]';
        return `• ${timeInfo} ${m.content}`;
      }).join('\n')}
    
    MEMORY RULES:
    - These events HAVE HAPPENED. Do not write them as new occurrences.
    - Characters should remember and reference past events appropriately.
    - Maintain chronological consistency (current day is ${currentDay || 1}).
    - Events from earlier days should feel like memories, not recent events.
    - Never contradict or "re-do" events listed in memories.
  ` : '';

  // Note: Character state tracking is now handled by a dedicated extraction service
  // (extract-character-updates edge function) that runs in parallel after the narrative response.
  // This separation of concerns allows the narrative AI to focus purely on creative storytelling.

  return `
    You are an expert Game Master and roleplayer for a creative writing/RPG studio.
    
    WORLD CONTEXT:
    ${worldContext}
    
    CODEX:
    ${codexContext}
    
    CAST:
    ${characterContext}
    
    AVAILABLE SCENES: [${sceneTags}]
    ${temporalContext}
    ${memoriesContext}
    INSTRUCTIONS:
    - Respond as the narrator or relevant characters.
    - NARRATIVE FOCUS: Prioritize 'ROLE: Main' characters in the narrative.
    - MAINTAIN CONTROL CONTEXT:
        * ONLY generate dialogue and actions for characters marked as 'CONTROL: AI'.
        * DO NOT generate dialogue or actions for characters marked as 'CONTROL: User'.
    - STRICT FORMATTING RULES (MANDATORY):
        1. ENCLOSE ALL OUTSPOKEN DIALOGUE IN "DOUBLE QUOTES".
        2. ENCLOSE ALL PHYSICAL ACTIONS OR DESCRIPTIONS IN *ASTERISKS*.
        3. ENCLOSE ALL INTERNAL THOUGHTS OR MENTAL STATES IN (PARENTHESES).
        Example: *He walks toward her, his heart racing.* (I hope she doesn't notice.) "Hey, did you wait long?"
    - MULTI-CHARACTER RESPONSES:
        * When multiple characters speak or act in a response, prefix each section with their name followed by a colon: "CharacterName:"
        * This applies to ALL characters, including new characters not in the CAST list above.
        * For new characters, include descriptive physical traits in their first appearance using *action* format.
        * Example: Sarah: *The woman walked in, her long brown hair swaying as she moved.* "Hey everyone!"
    - SCENE TAGGING (IMPORTANT):
        * When the scene location changes to one of the AVAILABLE SCENES, you MUST append [SCENE: exact_tag_name] at the very end of your response.
        * Match the tag exactly as listed in AVAILABLE SCENES: [${sceneTags}]
        * Example: If someone goes to a location tagged "home", end your response with [SCENE: home]
    - Maintain consistent tone and continuity.
    - Keep responses immersive, descriptive, and emotionally resonant.
    - Respect character gender/sex and traits.
  `;
}

export async function* generateRoleplayResponseStream(
  appData: ScenarioData,
  conversationId: string,
  userMessage: string,
  modelId: string,
  currentDay?: number,
  currentTimeOfDay?: TimeOfDay,
  memories?: Memory[],
  memoriesEnabled?: boolean
): AsyncGenerator<string, void, unknown> {
  const conversation = appData.conversations.find(c => c.id === conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const systemInstruction = getSystemInstruction(appData, currentDay, currentTimeOfDay, memories, memoriesEnabled);
  
  // Build messages array for OpenAI-compatible API
  const messages = [
    { role: 'system' as const, content: systemInstruction },
    ...conversation.messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.text
    })),
    { role: 'user' as const, content: userMessage }
  ];

  console.log(`[llm.ts] Calling chat edge function with model: ${modelId}`);

  // Call the chat edge function
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages,
      modelId,
      stream: true
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    yield `⚠️ ${errorData.error || 'Failed to connect to AI service'}`;
    return;
  }

  if (!response.body) {
    yield "⚠️ No response stream available";
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    textBuffer += decoder.decode(value, { stream: true });

    // Process line-by-line as data arrives
    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) yield content;
      } catch {
        // Incomplete JSON - put back and wait for more
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining buffer
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) yield content;
      } catch { /* ignore */ }
    }
  }
}

export async function brainstormCharacterDetails(
  name: string, 
  appData: ScenarioData, 
  modelId: string
): Promise<Partial<Character>> {
  const systemPrompt = `You are a creative writing assistant specialized in character creation for an RPG set in: ${appData.world.core.scenarioName || 'a creative setting'}.
  
Return a JSON object with these fields:
- sexType: Sex and character archetype (e.g., "Female Human", "Male Elf")
- tags: Descriptive tags comma-separated
- bio: Brief background story (2-3 sentences)
- motivation: Primary goal or drive
- appearance: Visual description

Respond ONLY with valid JSON.`;

  const userPrompt = `Brainstorm details for a new character named "${name}".`;

  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        modelId,
        stream: false
      }
    });

    if (error) {
      console.error("Brainstorm error:", error);
      return {};
    }

    const content = data?.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {};
  } catch (e) {
    console.error("Brainstorm parsing failed:", e);
    return {};
  }
}

// Note: Character image generation is handled by the generate-side-character-avatar edge function.
