import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { useIndexCharacterWorkspace } from "@/hooks/use-index-character-workspace";
import { Character, ScenarioData, TabKey } from "@/types";
import { createDefaultScenarioData } from "@/utils";

type AppShellTab = TabKey | "library";

function makeCharacter(id: string, name: string, controlledBy: Character["controlledBy"] = "AI"): Character {
  return {
    id,
    name,
    nicknames: "",
    age: "",
    sexType: "",
    sexualOrientation: "",
    location: "",
    currentMood: "",
    controlledBy,
    characterRole: "Main",
    roleDescription: "",
    tags: "",
    avatarDataUrl: "",
    avatarPosition: { x: 50, y: 50 },
    physicalAppearance: {
      hairColor: "",
      eyeColor: "",
      build: "",
      bodyHair: "",
      height: "",
      breastSize: "",
      genitalia: "",
      skinTone: "",
      makeup: "",
      bodyMarkings: "",
      temporaryConditions: "",
    },
    currentlyWearing: {
      top: "",
      bottom: "",
      undergarments: "",
      miscellaneous: "",
    },
    preferredClothing: {
      casual: "",
      work: "",
      sleep: "",
      undergarments: "",
      miscellaneous: "",
    },
    sections: [],
    createdAt: 1,
    updatedAt: 1,
  };
}

function makeScenario(characters: Character[]): ScenarioData {
  return {
    ...createDefaultScenarioData(),
    characters,
  };
}

function useWorkspaceHarness({
  initialCharacters,
  initialSelectedCharacterId,
  initialTab = "characters",
}: {
  initialCharacters: Character[];
  initialSelectedCharacterId: string | null;
  initialTab?: AppShellTab;
}) {
  const [tab, setTab] = useState<AppShellTab>(initialTab);
  const [activeData, setActiveData] = useState<ScenarioData | null>(() => makeScenario(initialCharacters));
  const [library, setLibrary] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(initialSelectedCharacterId);
  const [unsavedNewCharacterIds, setUnsavedNewCharacterIds] = useState<Set<string>>(() => new Set());
  const [characterInLibrary, setCharacterInLibrary] = useState<Record<string, string | boolean>>({});

  const workspace = useIndexCharacterWorkspace({
    userId: "user-1",
    tab,
    activeData,
    library,
    librarySearchQuery: "",
    selectedCharacterId,
    unsavedNewCharacterIds,
    characterInLibrary,
    globalModelId: "test-model",
    setTab,
    setActiveData,
    setLibrary,
    setSelectedCharacterId,
    setUnsavedNewCharacterIds,
    setCharacterInLibrary,
    closeCharacterPicker: vi.fn(),
    closeAiPromptModal: vi.fn(),
    openDeleteConfirm: vi.fn(),
    saveDraftInBackground: vi.fn().mockResolvedValue(undefined),
  });

  return {
    activeData,
    library,
    selectedCharacterId,
    tab,
    unsavedNewCharacterIds,
    workspace,
  };
}

describe("useIndexCharacterWorkspace", () => {
  it("restores an existing story character when a local edit is canceled", () => {
    const james = makeCharacter("char-james", "James", "User");
    const ashley = makeCharacter("char-ashley", "Ashley", "AI");
    const { result } = renderHook(() =>
      useWorkspaceHarness({
        initialCharacters: [james, ashley],
        initialSelectedCharacterId: "char-james",
      }),
    );

    act(() => {
      result.current.workspace.handleUpdateCharacter("char-james", { name: "Max" });
    });

    expect(result.current.activeData?.characters.find((character) => character.id === "char-james")?.name).toBe("Max");

    act(() => {
      result.current.workspace.handleCancelCharacterEdit();
    });

    const characters = result.current.activeData?.characters ?? [];
    expect(characters.map((character) => character.id)).toEqual(["char-james", "char-ashley"]);
    expect(characters.find((character) => character.id === "char-james")?.name).toBe("James");
    expect(result.current.selectedCharacterId).toBeNull();
    expect(result.current.tab).toBe("world");
  });

  it("removes a newly created unsaved story character when its edit is canceled", () => {
    const ashley = makeCharacter("char-ashley", "Ashley", "AI");
    const { result } = renderHook(() =>
      useWorkspaceHarness({
        initialCharacters: [ashley],
        initialSelectedCharacterId: null,
      }),
    );

    act(() => {
      result.current.workspace.handleCreateCharacter();
    });

    const createdId = result.current.selectedCharacterId;
    expect(createdId).toBeTruthy();
    expect(result.current.activeData?.characters).toHaveLength(2);

    act(() => {
      result.current.workspace.handleCancelCharacterEdit();
    });

    const characters = result.current.activeData?.characters ?? [];
    expect(characters.map((character) => character.id)).toEqual(["char-ashley"]);
    expect(result.current.selectedCharacterId).toBeNull();
    expect(result.current.tab).toBe("world");
    expect(result.current.unsavedNewCharacterIds.size).toBe(0);
  });
});
