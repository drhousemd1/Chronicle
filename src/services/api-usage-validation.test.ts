import { describe, expect, it } from "vitest";

import { getSystemInstruction } from "@/services/llm";
import { buildCall1ValidationPresence } from "@/services/api-usage-validation";
import { buildContinueAssistantTailResponseJob } from "@/features/chat-runtime/roleplay-response-job";
import { renderRoleplayResponseJobFinalUserContent } from "@/features/chat-runtime/roleplay-response-job-rendering";
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
    (aiCharacter as any).background = {
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
    const characterGoalId = uid("goal");
    const characterStepId = uid("step");
    aiCharacter.goals = [
      {
        id: characterGoalId,
        title: "Extract confession",
        desiredOutcome: "James admits everything.",
        currentStatus: "Setting up game flow.",
        flexibility: "normal",
        progress: 20,
        steps: [{ id: characterStepId, description: "Probe gently", completed: false }],
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
    const storyGoalId = uid("sgoal");
    const storyStepId = uid("sstep");
    appData.world.core.storyGoals = [
      {
        id: storyGoalId,
        title: "Keep tension coherent",
        desiredOutcome: "No random jumps.",
        currentStatus: "In progress",
        flexibility: "normal",
        steps: [{ id: storyStepId, description: "Follow game turn order", completed: false }],
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

    const systemInstruction = getSystemInstruction(appData, 1, "night", [], true, null, [
      {
        goalId: storyGoalId,
        title: "Keep tension coherent",
        goalKind: "story",
        tier: "active",
        reason: "explicit_test_activation",
        evidence: ["Keep tension coherent"],
        evidenceConfidence: "explicit",
        sourceMessageId: conversation.messages[0].id,
        renderDetail: "full",
        openMilestoneId: storyStepId,
        openMilestoneDescription: "Follow game turn order",
        partialProgress: "none",
      },
      {
        goalId: characterGoalId,
        title: "Extract confession",
        goalKind: "character",
        ownerCharacterId: aiCharacter.id,
        ownerCharacterName: aiCharacter.name,
        tier: "active",
        reason: "explicit_test_activation",
        evidence: ["Extract confession"],
        evidenceConfidence: "explicit",
        sourceMessageId: conversation.messages[0].id,
        renderDetail: "full",
        openMilestoneId: characterStepId,
        openMilestoneDescription: "Probe gently",
        partialProgress: "none",
      },
    ]);
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
      expectedFinalUserContent: messages.at(-1)?.content || "",
      transport: {
        providerTransport: "responses",
        store: false,
        reasoningEffort: "medium",
      },
    });

    expect(presence["call1.meta.system_instruction"]).toBe(true);
    expect(presence["call1.meta.history_messages"]).toBe(true);
    expect(presence["call1.meta.final_user_wrapper"]).toBe(true);
    expect(presence["call1.transport.responses"]).toBe(true);
    expect(presence["call1.transport.store_false"]).toBe(true);
    expect(presence["call1.transport.reasoning_medium"]).toBe(true);
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

  it("accepts strict Continue when the rendered response-job wrapper has no player turn", () => {
    const appData = createDefaultScenarioData();
    const conversation: Conversation = {
      ...appData.conversations[0],
      id: "conversation-continue-validation",
      messages: [],
      updatedAt: now(),
    };
    const systemInstruction = getSystemInstruction(appData, 1, "night", [], true, null);
    const responseJob = buildContinueAssistantTailResponseJob({
      conversationId: conversation.id,
      assistantAnchor: {
        messageId: "assistant-1",
        generationId: "assistant-generation-1",
        acceptedTextTail: "Ashley pauses with her hand still resting on the table.",
      },
      currentStateSummary: "Day 1 at night. Ashley remains beside the table.",
      responseDetail: "standard",
    });
    const expectedFinalUserContent = renderRoleplayResponseJobFinalUserContent(responseJob);
    const messages = [
      { role: "system" as const, content: systemInstruction },
      { role: "user" as const, content: expectedFinalUserContent },
    ];

    const presence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction,
      messages,
      expectedFinalUserContent,
    });
    const alteredPresence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction,
      messages: [
        messages[0],
        { role: "user", content: `${expectedFinalUserContent}\nUnexpected extra wrapper text.` },
      ],
      expectedFinalUserContent,
    });

    expect(responseJob.playerTurn).toBeNull();
    expect(presence["call1.meta.final_user_wrapper"]).toBe(true);
    expect(alteredPresence["call1.meta.final_user_wrapper"]).toBe(false);
  });

  it("does not report deliberately omitted optional sources as missing from a selected packet", () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.controlledBy = "AI";
    aiCharacter.characterRole = "Main";
    aiCharacter.name = "Ashley";
    userCharacter.controlledBy = "User";
    userCharacter.name = "James";
    appData.characters = [aiCharacter, userCharacter];
    appData.sideCharacters = [{
      ...aiCharacter,
      id: uid("side"),
      name: "Iris",
      characterRole: "Side",
      background: {
        relationshipStatus: "",
        residence: "",
        educationLevel: "",
      },
      personality: {
        traits: [],
        miscellaneous: "",
        secrets: "",
        fears: "",
        kinksFantasies: "",
        desires: "",
      },
      firstMentionedIn: "conversation-selection-validation",
      extractedTraits: [],
    }];
    appData.world.core.storyPremise = "A deliberately optional archived premise.";
    appData.world.core.structuredLocations = [{
      id: uid("loc"),
      label: "Remote archive",
      description: "Not relevant to the current exchange.",
    }];

    const conversation: Conversation = {
      ...appData.conversations[0],
      id: "conversation-selection-validation",
      messages: [],
      updatedAt: now(),
    };
    const systemInstruction = getSystemInstruction(appData, 1, "night", [], true, null);
    const finalUserInput = "I ask Ashley to stay with me.";
    const messages = [
      { role: "system" as const, content: systemInstruction },
      { role: "user" as const, content: finalUserInput },
    ];
    const selectedSourceReceipts = [
      {
        surface: "main_character_cards" as const,
        sourceId: "section-3:ashley",
        sourceRecordId: "main_character_cards:ashley",
        modelFacing: true,
      },
      {
        surface: "user_character_cards" as const,
        sourceId: "section-5:james",
        sourceRecordId: "user_character_cards:james",
        modelFacing: true,
      },
    ];

    const selectedPresence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction,
      messages,
      expectedFinalUserContent: finalUserInput,
      sourceReceipts: selectedSourceReceipts,
    });
    const brokenSelectedPresence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction: systemInstruction.replace("CHARACTER: Ashley", "CHARACTER: Missing"),
      messages: [
        { role: "system", content: systemInstruction.replace("CHARACTER: Ashley", "CHARACTER: Missing") },
        { role: "user", content: finalUserInput },
      ],
      expectedFinalUserContent: finalUserInput,
      sourceReceipts: selectedSourceReceipts,
    });

    expect(selectedPresence["call1.story.story_premise"]).toBeUndefined();
    expect(selectedPresence["call1.story.structured_locations"]).toBeUndefined();
    expect(selectedPresence["call1.cast.ai_characters"]).toBe(true);
    expect(brokenSelectedPresence["call1.cast.ai_characters"]).toBe(false);
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
      expectedFinalUserContent: finalUserInput,
      transport: {
        providerTransport: "chat_completions",
        store: true,
        reasoningEffort: "low",
      },
    });

    expect(presence["call1.story.story_premise"]).toBe(false);
    expect(presence["call1.transport.responses"]).toBe(false);
    expect(presence["call1.transport.store_false"]).toBe(false);
    expect(presence["call1.transport.reasoning_medium"]).toBe(false);
    expect(presence["call1.cast.tone"]).toBeUndefined();
    expect(presence["call1.meta.history_messages"]).toBeUndefined();
  });

  it("validates projected provider history instead of treating withheld private text as missing", () => {
    const appData = createDefaultScenarioData();
    const conversation: Conversation = {
      ...appData.conversations[0],
      messages: [
        { id: uid("m"), role: "user", text: "I open the door. (I hope she follows.)", createdAt: now() },
        { id: uid("m"), role: "assistant", text: "Mara follows.", createdAt: now() },
        { id: uid("m"), role: "user", text: "This is the active player lane.", createdAt: now() },
      ],
      updatedAt: now(),
    };
    const expectedHistoryMessages = [
      { role: "user" as const, content: "I open the door." },
      { role: "assistant" as const, content: "Mara follows." },
    ];
    const systemInstruction = getSystemInstruction(appData, 1, "night", [], true, null);
    const finalUserInput = "This is the active player lane.";
    const messages = [
      { role: "system" as const, content: systemInstruction },
      ...expectedHistoryMessages,
      { role: "user" as const, content: finalUserInput },
    ];

    const projectedPresence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction,
      messages,
      expectedHistoryMessages,
      expectedFinalUserContent: finalUserInput,
    });
    const rawHistoryPresence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: conversation.messages[0].text },
        { role: "assistant", content: conversation.messages[1].text },
        { role: "user", content: finalUserInput },
      ],
      expectedHistoryMessages,
      expectedFinalUserContent: finalUserInput,
    });

    expect(projectedPresence["call1.meta.history_messages"]).toBe(true);
    expect(rawHistoryPresence["call1.meta.history_messages"]).toBe(false);
  });

  it("validates AI side-character facts through the same compiled representation", () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    userCharacter.controlledBy = "User";
    userCharacter.name = "James";
    appData.characters = [userCharacter];
    appData.sideCharacters = [{
      ...aiCharacter,
      id: uid("side"),
      name: "Iris",
      controlledBy: "AI",
      characterRole: "Side",
      roleDescription: "A discreet envoy assigned to the current negotiation.",
      physicalAppearance: {
        ...aiCharacter.physicalAppearance,
        eyeColor: "Amber-gold",
      },
      background: {
        relationshipStatus: "Single",
        residence: "East wing",
        educationLevel: "Court tutor",
      },
      personality: {
        traits: ["Observant under pressure"],
        miscellaneous: "",
        secrets: "",
        fears: "",
        kinksFantasies: "",
        desires: "",
      },
      sections: [],
      firstMentionedIn: "conversation-1",
      extractedTraits: [],
    }];

    const conversation: Conversation = {
      ...appData.conversations[0],
      messages: [],
      updatedAt: now(),
    };
    const systemInstruction = getSystemInstruction(appData, 1, "night", [], true, null);
    const finalUserInput = "I wait for Iris to answer.";
    const messages = [
      { role: "system" as const, content: systemInstruction },
      { role: "user" as const, content: finalUserInput },
    ];

    const presence = buildCall1ValidationPresence({
      appData,
      conversation,
      systemInstruction,
      messages,
      expectedFinalUserContent: finalUserInput,
    });

    expect(systemInstruction).toContain("CHARACTER: Iris");
    expect(systemInstruction.toLowerCase()).toContain("amber-gold");
    expect(presence["call1.cast.ai_characters"]).toBe(true);
    expect(presence["call1.cast.physical_appearance"]).toBe(true);
    expect(presence["call1.cast.personality"]).toBe(true);
  });
});
