import React, {
  ChangeEvent,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
} from "react";
import {
  Character,
  ContentThemes,
  ConversationMetadata,
  ScenarioData,
  ScenarioMetadata,
  TabKey,
  defaultContentThemes,
} from "@/types";
import { createDefaultScenarioData, now, truncateLine, uuid } from "@/utils";
import {
  exportScenarioToJson,
  exportScenarioToText,
  exportScenarioToWordDocument,
  importScenarioFromAny,
  StoryImportMode,
} from "@/lib/story-transfer";
import { extractDocxPlainText } from "@/lib/docx-import";
import { StoryExportFormat } from "@/components/chronicle/StoryExportFormatModal";
import * as supabaseData from "@/services/supabase-data";

type AppShellTab = TabKey | "library";

interface UseIndexScenarioPersistenceArgs {
  activeId: string | null;
  activeData: ScenarioData | null;
  activeCoverImage: string;
  activeCoverPosition: { x: number; y: number };
  activeContentThemes: ContentThemes;
  userId?: string;
  setActiveId: Dispatch<SetStateAction<string | null>>;
  setActiveData: Dispatch<SetStateAction<ScenarioData | null>>;
  setSelectedCharacterId: Dispatch<SetStateAction<string | null>>;
  setPlayingConversationId: Dispatch<SetStateAction<string | null>>;
  setTab: Dispatch<SetStateAction<AppShellTab>>;
  setRegistry: Dispatch<SetStateAction<ScenarioMetadata[]>>;
  setConversationRegistry: Dispatch<SetStateAction<ConversationMetadata[]>>;
  setLibrary: Dispatch<SetStateAction<Character[]>>;
  setStoryNameError: Dispatch<SetStateAction<boolean>>;
  storyImportMode: StoryImportMode;
  setStoryImportMode: Dispatch<SetStateAction<StoryImportMode>>;
  setStoryTransferNotice: Dispatch<
    SetStateAction<
      | {
          tone: "success" | "error" | "info";
          text: string;
        }
      | null
    >
  >;
  setStoryTransferWarningDetails: Dispatch<SetStateAction<string[]>>;
  storyTransferFileRef: MutableRefObject<HTMLInputElement | null>;
  openStoryExportModal: () => void;
  openStoryImportModal: () => void;
}

const isValidUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function migrateScenarioDataIds(data: ScenarioData) {
  let didMigrate = false;

  const characterIdMap = new Map<string, string>();
  const codexEntryIdMap = new Map<string, string>();
  const sceneIdMap = new Map<string, string>();
  const conversationIdMap = new Map<string, string>();
  const messageIdMap = new Map<string, string>();

  const mapId = (id: string, map: Map<string, string>) => {
    if (isValidUuid(id)) return id;
    const existing = map.get(id);
    if (existing) return existing;
    const next = uuid();
    map.set(id, next);
    didMigrate = true;
    return next;
  };

  const nextCharacters = data.characters.map((character) => {
    const nextId = mapId(character.id, characterIdMap);
    return nextId === character.id ? character : { ...character, id: nextId };
  });

  const nextEntries = data.world.entries.map((entry) => {
    const nextId = mapId(entry.id, codexEntryIdMap);
    return nextId === entry.id ? entry : { ...entry, id: nextId };
  });

  const nextScenes = data.scenes.map((scene) => {
    const nextId = mapId(scene.id, sceneIdMap);
    return nextId === scene.id ? scene : { ...scene, id: nextId };
  });

  const nextConversations = data.conversations.map((conversation) => {
    const nextConversationId = mapId(conversation.id, conversationIdMap);
    const nextMessages = conversation.messages.map((message) => {
      const nextMessageId = mapId(message.id, messageIdMap);
      return nextMessageId === message.id ? message : { ...message, id: nextMessageId };
    });

    return {
      ...conversation,
      id: nextConversationId,
      messages: nextMessages,
    };
  });

  return {
    didMigrate,
    data: {
      ...data,
      characters: nextCharacters,
      world: { ...data.world, entries: nextEntries },
      scenes: nextScenes,
      conversations: nextConversations,
    } satisfies ScenarioData,
    characterIdMap,
    conversationIdMap,
  };
}

function toTransferBaseName(scenarioName?: string) {
  const base = (scenarioName || "chronicle-story")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${base || "chronicle-story"}-${date}`;
}

function downloadTransferFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useIndexScenarioPersistence({
  activeId,
  activeData,
  activeCoverImage,
  activeCoverPosition,
  activeContentThemes,
  userId,
  setActiveId,
  setActiveData,
  setSelectedCharacterId,
  setPlayingConversationId,
  setTab,
  setRegistry,
  setConversationRegistry,
  setLibrary,
  setStoryNameError,
  storyImportMode,
  setStoryImportMode,
  setStoryTransferNotice,
  setStoryTransferWarningDetails,
  storyTransferFileRef,
  openStoryExportModal,
  openStoryImportModal,
}: UseIndexScenarioPersistenceArgs) {
  const refreshCharacterLibrary = useCallback(async () => {
    const updated = await supabaseData.fetchCharacterLibrary();
    setLibrary(updated);
    return updated;
  }, [setLibrary]);

  const handleSaveWithData = useCallback(
    async (dataOverride: ScenarioData | null, navigateToHub = false): Promise<boolean> => {
      const dataToUse = dataOverride || activeData;
      if (!activeId || !dataToUse || !userId) {
        console.error("No active scenario found to save.");
        return false;
      }

      let scenarioIdToSave = activeId;
      let didMigrateScenarioId = false;

      if (!isValidUuid(activeId)) {
        scenarioIdToSave = uuid();
        didMigrateScenarioId = true;
        setActiveId(scenarioIdToSave);
      }

      const migrated = migrateScenarioDataIds(dataToUse);
      const nextDataToSave = migrated.didMigrate ? migrated.data : dataToUse;

      if (migrated.didMigrate) {
        setActiveData(migrated.data);
        setSelectedCharacterId((previous) => {
          if (!previous) return previous;
          return migrated.characterIdMap.get(previous) || previous;
        });
        setPlayingConversationId((previous) => {
          if (!previous) return previous;
          return migrated.conversationIdMap.get(previous) || previous;
        });
      }

      if (didMigrateScenarioId || migrated.didMigrate) {
        console.log("Migrated legacy IDs - saving as new scenario compatible with backend");
      }

      if (!nextDataToSave.world.core.scenarioName?.trim()) {
        console.error("Scenario name is required before saving.");
        setStoryNameError(true);
        setTab("world");
        return false;
      }
      setStoryNameError(false);

      const metadata = {
        title: nextDataToSave.world.core.scenarioName,
        description:
          nextDataToSave.world.core.briefDescription ||
          truncateLine(nextDataToSave.world.core.storyPremise || "Created via Builder", 120),
        coverImage: activeCoverImage,
        coverImagePosition: activeCoverPosition,
        tags: ["Custom"],
      };

      try {
        localStorage.setItem(
          `draft_${scenarioIdToSave}`,
          JSON.stringify({
            data: nextDataToSave,
            coverImage: activeCoverImage,
            coverPosition: activeCoverPosition,
            contentThemes: activeContentThemes,
            savedAt: Date.now(),
          }),
        );
      } catch (storageError) {
        console.warn("[handleSaveWithData] Could not write local safety snapshot:", storageError);
      }

      try {
        const verified = await supabaseData.saveScenarioWithVerification(
          scenarioIdToSave,
          nextDataToSave,
          metadata,
          userId,
        );

        if (!verified) {
          console.warn(
            "Scenario saved, but child-data verification reported a mismatch; local snapshot kept as backup.",
          );
        }

        void supabaseData
          .fetchMyScenarios(userId)
          .then((registry) => setRegistry(registry))
          .catch((error) => console.warn("Registry refresh failed:", error));
        void supabaseData
          .fetchConversationRegistry()
          .then((registry) => setConversationRegistry(registry))
          .catch((error) => console.warn("Conversation registry refresh failed:", error));

        if (navigateToHub) {
          setActiveId(null);
          setActiveData(null);
          setSelectedCharacterId(null);
          setTab("hub");
        }

        try {
          localStorage.removeItem(`draft_${scenarioIdToSave}`);
        } catch (cleanupError) {
          console.warn(
            "[handleSaveWithData] Failed to clear local draft after DB save:",
            cleanupError,
          );
        }

        return true;
      } catch (error) {
        console.error("Save failed:", error);
        return false;
      }
    },
    [
      activeContentThemes,
      activeCoverImage,
      activeCoverPosition,
      activeData,
      activeId,
      setActiveData,
      setActiveId,
      setConversationRegistry,
      setPlayingConversationId,
      setRegistry,
      setSelectedCharacterId,
      setStoryNameError,
      setTab,
      userId,
    ],
  );

  const handleSave = useCallback(
    async (navigateToHub = false): Promise<boolean> => handleSaveWithData(null, navigateToHub),
    [handleSaveWithData],
  );

  const handleExportStoryTransfer = useCallback(
    (format: StoryExportFormat) => {
      if (!activeData) return;

      try {
        const baseName = toTransferBaseName(activeData.world.core.scenarioName);
        if (format === "markdown") {
          downloadTransferFile(
            exportScenarioToText(activeData),
            `${baseName}.chronicle.md`,
            "text/markdown;charset=utf-8",
          );
        } else if (format === "json") {
          downloadTransferFile(
            exportScenarioToJson(activeData),
            `${baseName}.chronicle.json`,
            "application/json;charset=utf-8",
          );
        } else {
          downloadTransferFile(
            exportScenarioToWordDocument(activeData),
            `${baseName}.chronicle.rtf`,
            "text/rtf;charset=utf-8",
          );
        }

        setStoryTransferNotice({
          tone: "success",
          text: `Exported as ${format === "word" ? "Word document" : format.toUpperCase()}.`,
        });
      } catch (error) {
        console.error("Story export failed:", error);
        setStoryTransferNotice({
          tone: "error",
          text: "Export failed. Please try again.",
        });
      }
    },
    [activeData, setStoryTransferNotice],
  );

  const handleOpenStoryExport = useCallback(() => {
    if (!activeData) return;
    openStoryExportModal();
  }, [activeData, openStoryExportModal]);

  const handleOpenStoryImport = useCallback(() => {
    if (!activeData) return;
    openStoryImportModal();
  }, [activeData, openStoryImportModal]);

  const handleSelectStoryImportMode = useCallback(
    (mode: StoryImportMode) => {
      setStoryImportMode(mode);
      storyTransferFileRef.current?.click();
    },
    [setStoryImportMode, storyTransferFileRef],
  );

  const handleImportStoryTransferFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !activeData) return;

      try {
        const fileNameLower = file.name.toLowerCase();
        const mimeTypeLower = file.type.toLowerCase();
        const looksLikeDocx =
          fileNameLower.endsWith(".docx") ||
          mimeTypeLower.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          );
        const importWarnings: string[] = [];
        let text = "";

        if (looksLikeDocx) {
          try {
            const extraction = await extractDocxPlainText(await file.arrayBuffer());
            text = extraction.text;
            importWarnings.push(...extraction.warnings);
            if (!text.trim()) {
              importWarnings.push(
                "DOCX extraction returned empty text; falling back to plain text import.",
              );
              text = await file.text();
            }
          } catch (docxError) {
            importWarnings.push("DOCX extraction failed; fell back to raw text parsing.");
            if (import.meta.env.DEV) {
              console.debug("[story-import] DOCX extraction fallback:", docxError);
            }
            text = await file.text();
          }
        } else {
          text = await file.text();
        }

        const result = importScenarioFromAny(
          { text, fileName: file.name, mimeType: file.type },
          activeData,
          storyImportMode,
        );
        setActiveData(result.data);

        const {
          updatedStoryFields,
          updatedCharacters,
          createdCharacters,
          createdCharacterCustomSections,
          createdWorldCustomSections,
        } = result.summary;

        const summaryParts = [
          `${updatedStoryFields} story fields`,
          `${updatedCharacters} characters updated`,
          `${createdCharacters} characters created`,
          `${createdCharacterCustomSections + createdWorldCustomSections} custom sections added`,
        ];

        const warningDetails = [...importWarnings, ...result.warnings];
        const warningsCount = warningDetails.length;
        setStoryTransferWarningDetails(warningDetails);
        setStoryTransferNotice({
          tone: warningsCount > 0 ? "info" : "success",
          text: `Import ${storyImportMode}: ${summaryParts.join(", ")}.${warningsCount > 0 ? ` ${warningsCount} warning${warningsCount === 1 ? "" : "s"}.` : ""}`,
        });
      } catch (error) {
        console.error("Story import failed:", error);
        setStoryTransferWarningDetails([]);
        setStoryTransferNotice({
          tone: "error",
          text: "Import failed. Try JSON, Markdown/TXT, HTML/DOC, or DOCX again.",
        });
      }
    },
    [
      activeData,
      setActiveData,
      setStoryTransferNotice,
      setStoryTransferWarningDetails,
      storyImportMode,
    ],
  );

  const handleNavigateAway = useCallback(
    async (targetTab: AppShellTab) => {
      if (activeId && activeData) {
        try {
          localStorage.setItem(
            `draft_${activeId}`,
            JSON.stringify({
              data: activeData,
              coverImage: activeCoverImage,
              coverPosition: activeCoverPosition,
              contentThemes: activeContentThemes,
              savedAt: Date.now(),
            }),
          );
        } catch (error) {
          console.warn("Could not stash draft to localStorage:", error);
        }
      }

      setActiveId(null);
      setActiveData(null);
      setSelectedCharacterId(null);
      setPlayingConversationId(null);
      setTab(targetTab);

      if (targetTab === "library") {
        void refreshCharacterLibrary().catch((error) =>
          console.warn("Library refresh failed:", error),
        );
      }
    },
    [
      activeContentThemes,
      activeCoverImage,
      activeCoverPosition,
      activeData,
      activeId,
      refreshCharacterLibrary,
      setActiveData,
      setActiveId,
      setPlayingConversationId,
      setSelectedCharacterId,
      setTab,
    ],
  );

  const saveDraftInBackground = useCallback(async () => {
    try {
      if (!activeId || !activeData || !userId) return;

      let scenarioIdToSave = activeId;
      if (!isValidUuid(activeId)) {
        scenarioIdToSave = uuid();
        setActiveId(scenarioIdToSave);
      }

      const migrated = migrateScenarioDataIds(activeData);
      const nextDataToSave = migrated.didMigrate ? migrated.data : activeData;

      if (migrated.didMigrate) {
        setActiveData(migrated.data);
        setSelectedCharacterId((previous) => {
          if (!previous) return previous;
          return migrated.characterIdMap.get(previous) || previous;
        });
        setPlayingConversationId((previous) => {
          if (!previous) return previous;
          return migrated.conversationIdMap.get(previous) || previous;
        });
      }

      const metadata = {
        title: nextDataToSave.world.core.scenarioName || "Untitled",
        description:
          nextDataToSave.world.core.briefDescription ||
          truncateLine(nextDataToSave.world.core.storyPremise || "Created via Builder", 120),
        coverImage: activeCoverImage,
        coverImagePosition: activeCoverPosition,
        tags: ["Custom"],
      };

      try {
        localStorage.setItem(
          `draft_${scenarioIdToSave}`,
          JSON.stringify({
            data: nextDataToSave,
            coverImage: activeCoverImage,
            coverPosition: activeCoverPosition,
            contentThemes: activeContentThemes,
            savedAt: Date.now(),
          }),
        );
      } catch (storageError) {
        console.warn(
          "[saveDraftInBackground] Could not write local safety snapshot:",
          storageError,
        );
      }

      const verified = await supabaseData.saveScenarioWithVerification(
        scenarioIdToSave,
        nextDataToSave,
        metadata,
        userId,
        { isDraft: true },
      );

      if (verified) {
        try {
          localStorage.removeItem(`draft_${scenarioIdToSave}`);
        } catch (cleanupError) {
          console.warn(
            "[saveDraftInBackground] Failed to clear local draft after verified save:",
            cleanupError,
          );
        }
      } else {
        console.warn("Draft saved but child-data verification failed; local snapshot kept as backup.");
      }

      void supabaseData
        .fetchMyScenarios(userId)
        .then((registry) => setRegistry(registry))
        .catch((error) => console.warn("Registry refresh failed:", error));
    } catch (error) {
      console.warn("Background draft save failed:", error);
    }
  }, [
    activeContentThemes,
    activeCoverImage,
    activeCoverPosition,
    activeData,
    activeId,
    setActiveData,
    setActiveId,
    setPlayingConversationId,
    setRegistry,
    setSelectedCharacterId,
    userId,
  ]);

  return {
    refreshCharacterLibrary,
    handleSaveWithData,
    handleSave,
    handleExportStoryTransfer,
    handleOpenStoryExport,
    handleOpenStoryImport,
    handleSelectStoryImportMode,
    handleImportStoryTransferFile,
    handleNavigateAway,
    saveDraftInBackground,
  };
}
