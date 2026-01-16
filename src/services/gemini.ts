
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioData, Character, World, TimeOfDay } from "../types";
import { resizeImage } from "../utils";

const MODEL_IMAGE = 'gemini-2.5-flash-image';

// Placeholder for API key - will be replaced with Supabase secrets
const getApiKey = () => {
  // TODO: This will be fetched from Supabase secrets/edge function
  return "";
};

const TIME_DESCRIPTIONS: Record<TimeOfDay, string> = {
  sunrise: "early morning (sunrise, around 6-10am)",
  day: "daytime (mid-morning to afternoon, around 10am-5pm)",
  sunset: "evening (sunset, around 5-9pm)",
  night: "nighttime (after dark, around 9pm-6am)"
};

function getSystemInstruction(appData: ScenarioData, currentDay?: number, currentTimeOfDay?: TimeOfDay): string {
  const worldContext = `
    SETTING OVERVIEW: ${appData.world.core.settingOverview}
    RULES/TECH: ${appData.world.core.rulesOfMagicTech}
    FACTIONS: ${appData.world.core.factions}
    LOCATIONS: ${appData.world.core.locations}
    TONE & THEMES: ${appData.world.core.toneThemes}
    NARRATIVE STYLE: ${appData.world.core.narrativeStyle}
    DIALOG FORMATTING: ${appData.world.core.dialogFormatting}
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
  
  const sceneTags = appData.scenes.map(s => s.tag).join(', ');

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
    
    - Maintain consistent tone and continuity.
    - Keep responses immersive, descriptive, and emotionally resonant.
    - Respect character gender/sex and traits.
    - SCENE TAGGING: Append [SCENE: tag_name] at the very end of your response if the visual location changes.
  `;
}

export async function* generateRoleplayResponseStream(
  appData: ScenarioData,
  conversationId: string,
  userMessage: string,
  modelId: string,
  currentDay?: number,
  currentTimeOfDay?: TimeOfDay
) {
  const apiKey = getApiKey();
  if (!apiKey) {
    yield "⚠️ API key not configured. Please set up your Gemini API key in the settings.";
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const conversation = appData.conversations.find(c => c.id === conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const systemInstruction = getSystemInstruction(appData, currentDay, currentTimeOfDay);
  const history = conversation.messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));

  const responseStream = await ai.models.generateContentStream({
    model: modelId,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] }
    ],
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.9,
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) yield chunk.text;
  }
}

export async function generateCharacterImage(character: Partial<Character>, world: World): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    A professional character portrait for a roleplaying game. 
    Character Name: ${character.name}
    Sex/Type: ${character.sexType}
    Tags/Style: ${character.tags}
    World Context: ${world.core.settingOverview}
    Visual Description: High quality, digital art style, centered composition, clear features.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
        return await resizeImage(rawBase64, 512, 512, 0.75);
      }
    }
    return null;
  } catch (err) {
    console.error("Image generation error:", err);
    return null;
  }
}

export async function brainstormCharacterDetails(name: string, appData: ScenarioData, modelId: string): Promise<Partial<Character>> {
  const apiKey = getApiKey();
  if (!apiKey) return {};
  
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = `You are a creative writing assistant specialized in character creation for an RPG set in: ${appData.world.core.scenarioName || 'a creative setting'}.`;
  const prompt = `Brainstorm details for a new character named "${name}".`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { 
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sexType: { type: Type.STRING, description: "Sex and character archetype" },
          tags: { type: Type.STRING, description: "Descriptive tags" },
          bio: { type: Type.STRING, description: "Brief background story" },
          motivation: { type: Type.STRING, description: "Primary goal or drive" },
          appearance: { type: Type.STRING, description: "Visual description" },
        },
        required: ["sexType", "tags", "bio", "motivation", "appearance"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (e) {
    console.error("Brainstorm parsing failed:", e);
    return {};
  }
}
