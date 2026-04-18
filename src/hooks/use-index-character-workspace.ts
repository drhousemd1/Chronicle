import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { Character, ScenarioData, TabKey } from "@/types";
import { aiFillCharacter, aiGenerateCharacter } from "@/services/character-ai";
import { now, uid, uuid, createDefaultScenarioData } from "@/utils";
import * as supabaseData from "@/services/supabase-data";

type AppShellTab = TabKey | "library";

interface UseIndexCharacterWorkspaceArgs {
  userId?: string;
  tab: AppShellTab;
  activeData: ScenarioData | null;
  library: Character[];
  librarySearchQuery: string;
  selectedCharacterId: string | null;
  unsavedNewCharacterIds: Set<string>;
  characterInLibrary: Record<string, string | boolean>;
  globalModelId: string;
  setTab: Dispatch<SetStateAction<AppShellTab>>;
  setActiveData: Dispatch<SetStateAction<ScenarioData | null>>;
  setLibrary: Dispatch<SetStateAction<Character[]>>;
  setSelectedCharacterId: Dispatch<SetStateAction<string | null>>;
  setUnsavedNewCharacterIds: Dispatch<SetStateAction<Set<string>>>;
  setCharacterInLibrary: Dispatch<SetStateAction<Record<string, string | boolean>>>;
  closeCharacterPicker: () => void;
  closeAiPromptModal: () => void;
  openDeleteConfirm: (id: string, type: "character" | "bookmark" | "scenario") => void;
  saveDraftInBackground: () => Promise<void>;
}

export function useIndexCharacterWorkspace({
  userId,
  tab,
  activeData,
  library,
  librarySearchQuery,
  selectedCharacterId,
  unsavedNewCharacterIds,
  characterInLibrary,
  globalModelId,
  setTab,
  setActiveData,
  setLibrary,
  setSelectedCharacterId,
  setUnsavedNewCharacterIds,
  setCharacterInLibrary,
  closeCharacterPicker,
  closeAiPromptModal,
  openDeleteConfirm,
  saveDraftInBackground,
}: UseIndexCharacterWorkspaceArgs) {
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);

  const getSelectedCharacter = useCallback(() => {
    if (!selectedCharacterId) return null;
    const sourceList = tab === "library" ? library : activeData?.characters;
    return sourceList?.find((character) => character.id === selectedCharacterId) || null;
  }, [activeData?.characters, library, selectedCharacterId, tab]);

  const handleUpdateCharacter = useCallback(
    (id: string, patch: Partial<Character>) => {
      if (tab === "library") {
        setLibrary((previous) =>
          previous.map((character) => (character.id === id ? { ...character, ...patch } : character)),
        );
        return;
      }

      setActiveData((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          characters: previous.characters.map((character) =>
            character.id === id ? { ...character, ...patch } : character,
          ),
        };
      });
    },
    [setActiveData, setLibrary, tab],
  );

  const handleSaveCharacter = useCallback(async () => {
    if (!userId) return;

    if (tab === "library") {
      try {
        const character = library.find((entry) => entry.id === selectedCharacterId);
        if (character) {
          await supabaseData.saveCharacterToLibrary(character, userId);
        }
        setSelectedCharacterId(null);
      } catch (error: any) {
        console.error("Error saving character:", error.message);
      }
      return;
    }

    setSelectedCharacterId(null);
    setTab("world");
    void saveDraftInBackground();
  }, [library, saveDraftInBackground, selectedCharacterId, setSelectedCharacterId, setTab, tab, userId]);

  const handleCancelCharacterEdit = useCallback(() => {
    if (!selectedCharacterId) return;

    if (tab === "library") {
      if (unsavedNewCharacterIds.has(selectedCharacterId)) {
        setLibrary((previous) => previous.filter((character) => character.id !== selectedCharacterId));
        setUnsavedNewCharacterIds((previous) => {
          const next = new Set(previous);
          next.delete(selectedCharacterId);
          return next;
        });
      }
    } else {
      setActiveData((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          characters: previous.characters.filter((character) => character.id !== selectedCharacterId),
        };
      });
    }

    setSelectedCharacterId(null);

    if (tab === "characters") {
      setTab("world");
    }
  }, [
    selectedCharacterId,
    setActiveData,
    setLibrary,
    setSelectedCharacterId,
    setTab,
    setUnsavedNewCharacterIds,
    tab,
    unsavedNewCharacterIds,
  ]);

  const handleCreateCharacter = useCallback(() => {
    const timestamp = now();
    const character: Character = {
      id: uuid(),
      name: "New Character",
      nicknames: "",
      age: "",
      sexType: "",
      sexualOrientation: "",
      location: "",
      currentMood: "",
      controlledBy: "AI",
      characterRole: "Main",
      roleDescription: "",
      tags: "",
      avatarDataUrl: "",
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
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (tab === "library") {
      setLibrary((previous) => [character, ...previous]);
      setSelectedCharacterId(character.id);
      setUnsavedNewCharacterIds((previous) => new Set(previous).add(character.id));
      return;
    }

    setActiveData((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        characters: [character, ...previous.characters],
      };
    });
    setSelectedCharacterId(character.id);
  }, [setActiveData, setLibrary, setSelectedCharacterId, setUnsavedNewCharacterIds, tab]);

  const handleImportCharacter = useCallback(
    (character: Character) => {
      if (!activeData) return;
      if (activeData.characters.some((entry) => entry.id === character.id)) {
        console.error("Character already in scenario");
        return;
      }

      const copy = JSON.parse(JSON.stringify(character)) as Character;
      setActiveData((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          characters: [copy, ...previous.characters],
        };
      });
      closeCharacterPicker();
    },
    [activeData, closeCharacterPicker, setActiveData],
  );

  const handleDeleteCharacterFromList = useCallback(
    (id: string) => {
      openDeleteConfirm(id, "character");
    },
    [openDeleteConfirm],
  );

  const executeDeleteCharacter = useCallback(
    async (id: string) => {
      if (tab === "library") {
        try {
          await supabaseData.deleteCharacterFromLibrary(id);
          setLibrary((previous) => previous.filter((character) => character.id !== id));
          if (selectedCharacterId === id) setSelectedCharacterId(null);
        } catch (error: any) {
          console.error("Failed to delete character:", error.message);
        }
        return;
      }

      setActiveData((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          characters: previous.characters.filter((character) => character.id !== id),
        };
      });
      if (selectedCharacterId === id) setSelectedCharacterId(null);
    },
    [selectedCharacterId, setActiveData, setLibrary, setSelectedCharacterId, tab],
  );

  const handleAiFill = useCallback(
    async (userPrompt?: string, useExistingDetails = true) => {
      const character = getSelectedCharacter();
      if (!character) return;

      setIsAiFilling(true);
      closeAiPromptModal();

      try {
        const patch = await aiFillCharacter(
          character,
          activeData || createDefaultScenarioData(),
          globalModelId,
          userPrompt,
          useExistingDetails,
        );

        if (Object.keys(patch).length > 0) {
          handleUpdateCharacter(character.id, { ...patch, updatedAt: now() });
        }
      } catch (error) {
        console.error("AI Fill failed:", error);
      } finally {
        setIsAiFilling(false);
      }
    },
    [activeData, closeAiPromptModal, getSelectedCharacter, globalModelId, handleUpdateCharacter],
  );

  const handleAiGenerate = useCallback(
    async (userPrompt?: string, useExistingDetails = true) => {
      const character = getSelectedCharacter();
      if (!character) return;

      setIsAiGenerating(true);
      closeAiPromptModal();

      try {
        const patch = await aiGenerateCharacter(
          character,
          activeData || createDefaultScenarioData(),
          globalModelId,
          userPrompt,
          useExistingDetails,
        );

        if (Object.keys(patch).length > 0) {
          handleUpdateCharacter(character.id, { ...patch, updatedAt: now() });
        }
      } catch (error) {
        console.error("AI Generate failed:", error);
      } finally {
        setIsAiGenerating(false);
      }
    },
    [activeData, closeAiPromptModal, getSelectedCharacter, globalModelId, handleUpdateCharacter],
  );

  const handleSaveToLibrary = useCallback(async () => {
    const selected = getSelectedCharacter();
    if (!selected || !userId) return;

    setIsSavingToLibrary(true);
    try {
      if (tab === "library") {
        await supabaseData.saveCharacterToLibrary(selected, userId);
        setUnsavedNewCharacterIds((previous) => {
          const next = new Set(previous);
          next.delete(selected.id);
          return next;
        });
        return;
      }

      const existingLibraryId = characterInLibrary[selected.id];

      if (existingLibraryId && typeof existingLibraryId === "string") {
        const libraryCopy = { ...selected, id: existingLibraryId };
        await supabaseData.saveCharacterToLibrary(libraryCopy, userId);
        setLibrary((previous) =>
          previous.map((character) =>
            character.id === existingLibraryId ? { ...character, ...selected, id: existingLibraryId } : character,
          ),
        );
        return;
      }

      const newLibraryId = uuid();
      await supabaseData.saveCharacterCopyToLibrary(selected, userId, newLibraryId);

      const libraryCopy = { ...selected, id: newLibraryId };
      setLibrary((previous) => {
        if (previous.some((character) => character.id === newLibraryId)) return previous;
        return [libraryCopy, ...previous];
      });
      setCharacterInLibrary((previous) => ({ ...previous, [selected.id]: newLibraryId }));
    } catch (error: any) {
      console.error("Save failed:", error.message);
    } finally {
      setIsSavingToLibrary(false);
    }
  }, [
    characterInLibrary,
    getSelectedCharacter,
    setCharacterInLibrary,
    setLibrary,
    setUnsavedNewCharacterIds,
    tab,
    userId,
  ]);

  const selectedCharacterIsInLibrary = useMemo(() => {
    if (!selectedCharacterId) return false;
    return !!characterInLibrary[selectedCharacterId] || tab === "library";
  }, [characterInLibrary, selectedCharacterId, tab]);

  const filteredLibrary = useMemo(() => {
    if (!librarySearchQuery.trim()) return library;

    const query = librarySearchQuery.toLowerCase();
    return library.filter((character) => {
      if (character.name?.toLowerCase().includes(query)) return true;
      if (character.nicknames?.toLowerCase().includes(query)) return true;
      if (character.roleDescription?.toLowerCase().includes(query)) return true;
      if (character.tags?.toLowerCase().includes(query)) return true;

      const physicalAppearanceValues = [
        character.physicalAppearance?.hairColor,
        character.physicalAppearance?.eyeColor,
        character.physicalAppearance?.build,
        character.physicalAppearance?.height,
        character.physicalAppearance?.skinTone,
        character.physicalAppearance?.bodyHair,
        character.physicalAppearance?.breastSize,
        character.physicalAppearance?.genitalia,
        character.physicalAppearance?.makeup,
        character.physicalAppearance?.bodyMarkings,
        character.physicalAppearance?.temporaryConditions,
      ]
        .filter(Boolean)
        .join(" ");
      if (physicalAppearanceValues.toLowerCase().includes(query)) return true;

      const currentOutfitValues = [
        character.currentlyWearing?.top,
        character.currentlyWearing?.bottom,
        character.currentlyWearing?.undergarments,
        character.currentlyWearing?.miscellaneous,
      ]
        .filter(Boolean)
        .join(" ");
      if (currentOutfitValues.toLowerCase().includes(query)) return true;

      const preferredClothingValues = [
        character.preferredClothing?.casual,
        character.preferredClothing?.work,
        character.preferredClothing?.sleep,
        character.preferredClothing?.undergarments,
        character.preferredClothing?.miscellaneous,
      ]
        .filter(Boolean)
        .join(" ");
      if (preferredClothingValues.toLowerCase().includes(query)) return true;

      return (character.sections || []).some((section) => {
        if (section.title?.toLowerCase().includes(query)) return true;
        return (section.items || []).some(
          (item) =>
            item.label?.toLowerCase().includes(query) || item.value?.toLowerCase().includes(query),
        );
      });
    });
  }, [library, librarySearchQuery]);

  const handleAddSection = useCallback(
    (type: "structured" | "freeform" = "structured") => {
      const selected = getSelectedCharacter();
      if (!selected) return;

      handleUpdateCharacter(selected.id, {
        sections: [
          ...selected.sections,
          {
            id: uid("sec"),
            title: "New Section",
            type,
            items: [{ id: uid("item"), label: "", value: "", createdAt: now(), updatedAt: now() }],
            freeformValue: type === "freeform" ? "" : undefined,
            createdAt: now(),
            updatedAt: now(),
          },
        ],
      });
    },
    [getSelectedCharacter, handleUpdateCharacter],
  );

  return {
    isAiFilling,
    isAiGenerating,
    isSavingToLibrary,
    selectedCharacterIsInLibrary,
    filteredLibrary,
    handleSaveCharacter,
    handleCancelCharacterEdit,
    handleCreateCharacter,
    handleImportCharacter,
    handleUpdateCharacter,
    handleDeleteCharacterFromList,
    executeDeleteCharacter,
    handleAiFill,
    handleAiGenerate,
    handleSaveToLibrary,
    handleAddSection,
  };
}
