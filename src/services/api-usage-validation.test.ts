import { describe, expect, it } from "vitest";

import { getSystemInstruction } from "@/services/llm";
import { buildCall1ValidationPresence } from "@/services/api-usage-validation";
import { createDefaultScenarioData, getHardcodedTestCharacters, now, uid } from "@/utils";
import type { Conversation } from "@/types";

describe("api-usage-validation call1 coverage", () => {
  it("marks authored canonical fields as sent when present in system instruction", () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.controlledBy = "AI";
    aiCharacter.name = "Ashley";
    aiCharacter.age = "24";
    aiCharacter.roleDescription = "Quiet but strategic.";
    aiCharacter.physicalAppearance = {
      ...aiCharacter.physicalAppearance,
      hairColor: "Black",
      _extras: [{ id: uid("extra"), label: "Tattoo", value: "Moon on shoulder" }],
    };
    aiCharacter.currentlyWearing = {
      ...aiCharacter.currentlyWearing,
      top: "Zip hoodie",
      undergarments: "Black bra",
    };
    aiCharacter.preferredClothing = {
      ...aiCharacter.preferredClothing,
      casual: "Athleisure",
    };
    aiCharacter.background = {
      ...aiCharacter.background,
      residence: "Boise",
      _extras: [{ id: uid("extra"), label: "History", value: "Transferred schools twice" }],
    };
    aiCharacter.relationships = {
      _extras: [{ id: uid("rel"), label: "James", value: "Protective and tense" }],
    };
    aiCharacter.secrets = {
      _extras: [{ id: uid("sec"), label: "Hidden", value: "Knows more than she says" }],
    };
    aiCharacter.fears = {
      _extras: [{ id: uid("fear"), label: "Fear", value: "Losing control" }],
    };
    aiCharacter.goals = [
      {
        id: uid("goal"),
        title: "Extract confession",
        desiredOutcome: "James admits everything.",
        currentStatus: "Setting up game flow.",
        flexibility: "normal",
        progress: 20,
        steps: [{ id: uid("step"), description: "Probe gently", completed: false }],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    userCharacter.controlledBy = "User";
    userCharacter.name = "James";

    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.scenarioName = "Ashley's Secret";
    appData.world.core.briefDescription = "Slow-burn family tension";
    appData.world.core.storyPremise = "A game night turns into layered confessions.";
    appData.world.core.structuredLocations = [
      { id: uid("loc"), label: "Living Room", description: "Warm lamp light and wine glasses." },
    ];
    appData.world.core.customWorldSections = [
      {
        id: uid("wsec"),
        title: "Ground Rules",
        items: [{ id: uid("item"), label: "Pace", value: "Subtle first, escalate later" }],
      },
    ];
    appData.world.core.storyGoals = [
      {
        id: uid("sgoal"),
        title: "Keep tension coherent",
        desiredOutcome: "No random jumps.",
        currentStatus: "In progress",
        flexibility: "normal",
        steps: [{ id: uid("sstep"), description: "Follow game turn order", completed: false }],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    const conversation: Conversation = {
      ...appData.conversations[0],
      messages: [
        { id: uid("m"), role: "user", text: "Let's go slowly.", createdAt: now() },
        { id: uid("m"), role: "assistant", text: "Sarah nods and keeps it subtle.", createdAt: now() },
      ],
      updatedAt: now(),
    };

    const systemInstruction = getSystemInstruction(appData, 1, "night", [], true, null);
    const finalUserInput = "Can we keep it playful but subtle?";
    const messages = [
      { role: "system" as const, content: systemInstruction },
      ...conversation.messages.map((message) => ({
        role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: message.text,
      })),
      { role: "user" as const, content: `[SESSION: Message 3 of current session] ${finalUserInput}` },
    ];

    const presence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction,
      messages,
      finalUserInput,
    });

    expect(presence["call1.meta.system_instruction"]).toBe(true);
    expect(presence["call1.meta.history_messages"]).toBe(true);
    expect(presence["call1.meta.final_user_wrapper"]).toBe(true);
    expect(presence["call1.story.scenario_name"]).toBe(true);
    expect(presence["call1.story.story_premise"]).toBe(true);
    expect(presence["call1.story.structured_locations"]).toBe(true);
    expect(presence["call1.story.custom_world_sections"]).toBe(true);
    expect(presence["call1.story.story_goals"]).toBe(true);
    expect(presence["call1.cast.ai_characters"]).toBe(true);
    expect(presence["call1.cast.user_controlled_exclusions"]).toBe(true);
    expect(presence["call1.cast.physical_appearance"]).toBe(true);
    expect(presence["call1.cast.currently_wearing"]).toBe(true);
    expect(presence["call1.cast.preferred_clothing"]).toBe(true);
    expect(presence["call1.cast.background"]).toBe(true);
    expect(presence["call1.cast.relationships"]).toBe(true);
    expect(presence["call1.cast.secrets"]).toBe(true);
    expect(presence["call1.cast.fears"]).toBe(true);
    expect(presence["call1.cast.character_goals"]).toBe(true);
  });

  it("marks authored fields as missing when prompt content is removed, and leaves non-authored rows undefined", () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.controlledBy = "AI";
    aiCharacter.name = "Ashley";
    aiCharacter.tone = { _extras: [] };
    userCharacter.controlledBy = "User";
    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.storyPremise = "This premise should be present.";

    const conversation: Conversation = {
      ...appData.conversations[0],
      messages: [],
      updatedAt: now(),
    };

    const systemInstruction = getSystemInstruction(appData, 1, "day", [], true, null);
    const brokenInstruction = systemInstruction.replace(appData.world.core.storyPremise, "");
    const finalUserInput = "Continue";
    const messages = [
      { role: "system" as const, content: brokenInstruction },
      { role: "user" as const, content: finalUserInput },
    ];

    const presence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction: brokenInstruction,
      messages,
      finalUserInput,
    });

    expect(presence["call1.story.story_premise"]).toBe(false);
    expect(presence["call1.cast.tone"]).toBeUndefined();
    expect(presence["call1.meta.history_messages"]).toBeUndefined();
  });
});
