import { Dispatch, MutableRefObject, SetStateAction, useCallback } from "react";
import {
  ContentThemes,
  Conversation,
  ConversationMetadata,
  Message,
  ScenarioData,
  ScenarioMetadata,
  TabKey,
  defaultContentThemes,
} from "@/types";
import { fetchSavedScenarios, SavedScenario, unsaveScenario } from "@/services/gallery-data";
import { createDefaultScenarioData, now, truncateLine, uuid } from "@/utils";
import * as supabaseData from "@/services/supabase-data";

type AppShellTab = TabKey | "library";

interface UseIndexScenarioLifecycleArgs {
  userId?: string;
  activeId: string | null;
  activeData: ScenarioData | null;
  registry: ScenarioMetadata[];
  savedScenarios: SavedScenario[];
  conversationRegistry: ConversationMetadata[];
  setActiveId: Dispatch<SetStateAction<string | null>>;
  setActiveData: Dispatch<SetStateAction<ScenarioData | null>>;
  setActiveCoverImage: Dispatch<SetStateAction<string>>;
  setActiveCoverPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setActiveContentThemes: Dispatch<SetStateAction<ContentThemes>>;
  setSelectedCharacterId: Dispatch<SetStateAction<string | null>>;
  setPlayingConversationId: Dispatch<SetStateAction<string | null>>;
  setTab: Dispatch<SetStateAction<AppShellTab>>;
  setRegistry: Dispatch<SetStateAction<ScenarioMetadata[]>>;
  setConversationRegistry: Dispatch<SetStateAction<ConversationMetadata[]>>;
  setSavedScenarios: Dispatch<SetStateAction<SavedScenario[]>>;
  setHasMoreMessagesMap: Dispatch<SetStateAction<Record<string, boolean>>>;
  setShowResumingOverlay: Dispatch<SetStateAction<boolean>>;
  setIsResuming: Dispatch<SetStateAction<boolean>>;
  resumeTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  openRemixConfirm: (scenarioId: string) => void;
  openDeleteConfirm: (id: string, type: "character" | "bookmark" | "scenario") => void;
}

export function useIndexScenarioLifecycle({
  userId,
  activeId,
  activeData,
  registry,
  savedScenarios,
  conversationRegistry,
  setActiveId,
  setActiveData,
  setActiveCoverImage,
  setActiveCoverPosition,
  setActiveContentThemes,
  setSelectedCharacterId,
  setPlayingConversationId,
  setTab,
  setRegistry,
  setConversationRegistry,
  setSavedScenarios,
  setHasMoreMessagesMap,
  setShowResumingOverlay,
  setIsResuming,
  resumeTimerRef,
  openRemixConfirm,
  openDeleteConfirm,
}: UseIndexScenarioLifecycleArgs) {
  const handlePlayScenario = useCallback(
    async (id: string) => {
      if (!userId) return;

      setActiveId(id);
      setPlayingConversationId("loading");
      setTab("chat_interface");
      setSelectedCharacterId(null);

      try {
        const result = await supabaseData.fetchScenarioForPlay(id);
        if (!result) {
          console.error("Scenario not found");
          setTab("hub");
          setPlayingConversationId(null);
          return;
        }

        const { data, coverImage, coverImagePosition, conversationCount } = result;
        setActiveCoverImage(coverImage);
        setActiveCoverPosition(coverImagePosition);

        try {
          const themes = await supabaseData.fetchContentThemes(id);
          data.contentThemes = themes;
        } catch (error) {
          console.warn("[handlePlayScenario] Failed to load content themes:", error);
        }

        const startingDay = data.story?.openingDialog?.startingDay || 1;
        const startingTimeOfDay = data.story?.openingDialog?.startingTimeOfDay || "day";

        const initialMessages: Message[] = [];
        const openingText = data.story?.openingDialog?.text?.trim();
        if (openingText) {
          initialMessages.push({
            id: uuid(),
            generationId: uuid(),
            role: "assistant",
            text: openingText,
            day: startingDay,
            timeOfDay: startingTimeOfDay,
            createdAt: now(),
          });
        }

        const timeProgressionMode = data.story?.openingDialog?.timeProgressionMode || "manual";
        const timeProgressionInterval = data.story?.openingDialog?.timeProgressionInterval || 15;

        const newConversation: Conversation = {
          id: uuid(),
          title: `Story Session ${conversationCount + 1}`,
          messages: initialMessages,
          currentDay: startingDay,
          currentTimeOfDay: startingTimeOfDay,
          timeProgressionMode,
          timeProgressionInterval,
          createdAt: now(),
          updatedAt: now(),
        };

        data.conversations = [newConversation];

        void supabaseData.saveConversation(newConversation, id, userId).catch((error) => {
          console.error("Failed to save conversation:", error);
        });

        const scenarioMeta = registry.find((scenario) => scenario.id === id);
        setConversationRegistry((previous) => [
          {
            conversationId: newConversation.id,
            scenarioId: id,
            scenarioTitle: scenarioMeta?.title || "Story",
            scenarioImageUrl: coverImage || null,
            conversationTitle: newConversation.title,
            lastMessage: openingText || "",
            messageCount: initialMessages.length,
            createdAt: newConversation.createdAt,
            updatedAt: newConversation.updatedAt,
            creatorName: null,
          },
          ...previous,
        ]);

        setActiveData(data);
        setPlayingConversationId(newConversation.id);
      } catch (error: any) {
        console.error("Failed to play scenario:", error.message);
        setTab("hub");
        setPlayingConversationId(null);
      }
    },
    [
      registry,
      setActiveCoverImage,
      setActiveCoverPosition,
      setActiveData,
      setActiveId,
      setConversationRegistry,
      setPlayingConversationId,
      setSelectedCharacterId,
      setTab,
      userId,
    ],
  );

  const handleEditScenario = useCallback(
    async (id: string) => {
      try {
        const result = await supabaseData.fetchScenarioById(id);
        if (!result) {
          console.error("Scenario not found");
          return;
        }

        const { data, coverImage, coverImagePosition } = result;
        const ownerId = await supabaseData.getScenarioOwner(id);
        const isOwnScenario = ownerId === userId;

        if (!isOwnScenario && userId) {
          openRemixConfirm(id);
          return;
        }

        let finalData = data;
        let finalCoverImage = coverImage;
        let finalCoverPosition = coverImagePosition;
        let finalContentThemes = defaultContentThemes;

        try {
          const draftRaw = localStorage.getItem(`draft_${id}`);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (draft.data && draft.savedAt) {
              const backendHasCharacters = data.characters.length > 0;
              const localHasCharacters = (draft.data.characters?.length ?? 0) > 0;

              if (!backendHasCharacters && localHasCharacters) {
                console.log("[handleEditScenario] Backend empty, restoring from local snapshot");
                finalData = draft.data;
                finalCoverImage = draft.coverImage ?? coverImage;
                finalCoverPosition = draft.coverPosition ?? coverImagePosition;
                finalContentThemes = draft.contentThemes ?? defaultContentThemes;

                if (userId) {
                  const derivedTitle = finalData.world.core.scenarioName || "Untitled";
                  void supabaseData
                    .saveScenarioWithVerification(
                      id,
                      finalData,
                      {
                        title: derivedTitle,
                        description: finalData.world.core.briefDescription || "",
                        coverImage: finalCoverImage,
                        coverImagePosition: finalCoverPosition,
                        tags: ["Custom"],
                      },
                      userId,
                      { isDraft: true },
                    )
                    .then((ok) => {
                      if (ok) {
                        try {
                          localStorage.removeItem(`draft_${id}`);
                        } catch (cleanupError) {
                          console.warn(
                            "[handleEditScenario] Failed to clear recovered local draft:",
                            cleanupError,
                          );
                        }
                        console.log("[handleEditScenario] Auto-repair succeeded");
                      }
                    })
                    .catch((saveError) =>
                      console.warn("[handleEditScenario] Auto-repair failed:", saveError),
                    );
                }
              } else if (backendHasCharacters) {
                try {
                  localStorage.removeItem(`draft_${id}`);
                } catch (cleanupError) {
                  console.warn(
                    "[handleEditScenario] Failed to clear stale local draft:",
                    cleanupError,
                  );
                }
              }
            } else {
              const legacyHasCharacters = (draft.characters?.length ?? 0) > 0;
              if (data.characters.length === 0 && legacyHasCharacters) {
                finalData = draft;
              }
              try {
                localStorage.removeItem(`draft_${id}`);
              } catch (cleanupError) {
                console.warn(
                  "[handleEditScenario] Failed to clear legacy local draft:",
                  cleanupError,
                );
              }
            }
          }
        } catch (error) {
          console.warn("Could not restore draft:", error);
        }

        setActiveId(id);
        setActiveData(finalData);
        setActiveCoverImage(finalCoverImage);
        setActiveCoverPosition(finalCoverPosition);

        if (finalContentThemes !== defaultContentThemes) {
          setActiveContentThemes(finalContentThemes);
        } else {
          try {
            const themes = await supabaseData.fetchContentThemes(id);
            setActiveContentThemes(themes);
          } catch (error) {
            console.error("Failed to load content themes:", error);
            setActiveContentThemes(defaultContentThemes);
          }
        }

        setTab("world");
        setSelectedCharacterId(null);
        setPlayingConversationId(null);
      } catch (error: any) {
        console.error("Failed to edit scenario:", error.message);
      }
    },
    [
      openRemixConfirm,
      setActiveContentThemes,
      setActiveCoverImage,
      setActiveCoverPosition,
      setActiveData,
      setActiveId,
      setPlayingConversationId,
      setSelectedCharacterId,
      setTab,
      userId,
    ],
  );

  const executeRemixClone = useCallback(
    async (id: string) => {
      if (!userId) return;
      try {
        const result = await supabaseData.fetchScenarioById(id);
        if (!result) {
          console.error("Scenario not found");
          return;
        }

        const { data, coverImage, coverImagePosition } = result;
        const newScenarioId = uuid();

        const clonedData = await supabaseData.cloneScenarioForRemix(
          id,
          newScenarioId,
          userId,
          data,
          coverImage,
          coverImagePosition,
        );

        const savedScenario = savedScenarios.find((scenario) => scenario.source_scenario_id === id);
        if (savedScenario?.published_scenario_id) {
          await supabaseData.trackRemix(savedScenario.published_scenario_id, newScenarioId, userId);
        }

        const updatedRegistry = await supabaseData.fetchMyScenarios(userId);
        setRegistry(updatedRegistry);

        setActiveId(newScenarioId);
        setActiveData(clonedData);
        setActiveCoverImage(coverImage);
        setActiveCoverPosition(coverImagePosition);
        setActiveContentThemes(defaultContentThemes);
        setTab("world");
        setSelectedCharacterId(null);
        setPlayingConversationId(null);
      } catch (error: any) {
        console.error("Failed to clone scenario:", error.message);
      }
    },
    [
      savedScenarios,
      setActiveContentThemes,
      setActiveCoverImage,
      setActiveCoverPosition,
      setActiveData,
      setActiveId,
      setPlayingConversationId,
      setRegistry,
      setSelectedCharacterId,
      setTab,
      userId,
    ],
  );

  const handleCreateNewScenario = useCallback(() => {
    const id = uuid();
    const data = createDefaultScenarioData();

    try {
      const draftRaw = localStorage.getItem(`draft_${id}`);
      if (draftRaw) {
        localStorage.removeItem(`draft_${id}`);
      }
    } catch (error) {
      console.warn("[handleCreateNewScenario] Local draft preflight failed:", error);
    }

    setActiveId(id);
    setActiveData(data);
    setActiveCoverImage("");
    setActiveCoverPosition({ x: 50, y: 50 });
    setActiveContentThemes(defaultContentThemes);
    setTab("world");
    setSelectedCharacterId(null);
    setPlayingConversationId(null);
  }, [
    setActiveContentThemes,
    setActiveCoverImage,
    setActiveCoverPosition,
    setActiveData,
    setActiveId,
    setPlayingConversationId,
    setSelectedCharacterId,
    setTab,
  ]);

  const handleDeleteScenario = useCallback(
    async (id: string) => {
      const savedScenario = savedScenarios.find((scenario) => scenario.source_scenario_id === id);
      const isBookmarked = savedScenario && !registry.some((scenario) => scenario.id === id);

      if (isBookmarked) {
        openDeleteConfirm(id, "bookmark");
      } else {
        openDeleteConfirm(id, "scenario");
      }
    },
    [openDeleteConfirm, registry, savedScenarios],
  );

  const executeDeleteScenario = useCallback(
    async (id: string) => {
      if (!userId) return;

      const savedScenario = savedScenarios.find((scenario) => scenario.source_scenario_id === id);
      const isBookmarked = savedScenario && !registry.some((scenario) => scenario.id === id);

      if (isBookmarked && savedScenario) {
        try {
          await unsaveScenario(savedScenario.published_scenario_id, userId);
          const refreshed = await fetchSavedScenarios(userId);
          setSavedScenarios(refreshed);
        } catch (error: any) {
          console.error("Failed to remove bookmark:", error.message);
        }
        return;
      }

      try {
        await supabaseData.deleteScenario(id);
        const updatedRegistry = await supabaseData.fetchMyScenarios(userId);
        setRegistry(updatedRegistry);

        const updatedConversationRegistry = await supabaseData.fetchConversationRegistry();
        setConversationRegistry(updatedConversationRegistry);

        if (activeId === id) {
          setActiveId(null);
          setActiveData(null);
          setSelectedCharacterId(null);
          setPlayingConversationId(null);
          setTab("hub");
        }
      } catch (error: any) {
        console.error("Delete failed:", error.message);
      }
    },
    [
      activeId,
      registry,
      savedScenarios,
      setActiveData,
      setActiveId,
      setConversationRegistry,
      setPlayingConversationId,
      setRegistry,
      setSavedScenarios,
      setSelectedCharacterId,
      setTab,
      userId,
    ],
  );

  const handleResumeFromHistory = useCallback(
    async (scenarioId: string, conversationId: string) => {
      setIsResuming(true);
      resumeTimerRef.current = setTimeout(() => setShowResumingOverlay(true), 300);

      try {
        const [scenarioResult, threadResult, sideCharacters] = await Promise.all([
          supabaseData.fetchScenarioForPlay(scenarioId),
          supabaseData.fetchConversationThreadRecent(conversationId, 30),
          supabaseData.fetchSideCharacters(conversationId),
        ]);

        if (!scenarioResult) {
          console.error("Scenario not found");
          setIsResuming(false);
          return;
        }
        if (!threadResult) {
          console.error("Conversation not found");
          setIsResuming(false);
          return;
        }

        const { data, coverImage, coverImagePosition } = scenarioResult;
        const { conversation: thread, hasMore } = threadResult;

        data.conversations = [thread];
        data.sideCharacters = sideCharacters;

        setHasMoreMessagesMap((previous) => ({ ...previous, [conversationId]: hasMore }));

        void supabaseData
          .fetchContentThemes(scenarioId)
          .then((themes) => {
            data.contentThemes = themes;
          })
          .catch((error) => {
            console.warn("[handleResumeFromHistory] Failed to load content themes:", error);
          });

        setActiveId(scenarioId);
        setActiveCoverImage(coverImage);
        setActiveCoverPosition(coverImagePosition);
        setActiveData(data);
        setPlayingConversationId(conversationId);
        setSelectedCharacterId(null);
        setTab("chat_interface");

        console.log(
          "[handleResumeFromHistory] Loaded",
          thread.messages.length,
          "messages (hasMore:",
          hasMore,
          ")",
        );
      } catch (error: any) {
        console.error("[handleResumeFromHistory] Error:", error);
      } finally {
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
        setShowResumingOverlay(false);
        setIsResuming(false);
      }
    },
    [
      resumeTimerRef,
      setActiveCoverImage,
      setActiveCoverPosition,
      setActiveData,
      setActiveId,
      setHasMoreMessagesMap,
      setIsResuming,
      setPlayingConversationId,
      setSelectedCharacterId,
      setShowResumingOverlay,
      setTab,
    ],
  );

  const handleLoadOlderMessages = useCallback(
    async (conversationId: string, beforeCreatedAt: string): Promise<Message[]> => {
      try {
        const olderMessages = await supabaseData.fetchOlderMessages(
          conversationId,
          beforeCreatedAt,
          20,
        );

        if (olderMessages.length === 0) {
          setHasMoreMessagesMap((previous) => ({ ...previous, [conversationId]: false }));
          return [];
        }

        setActiveData((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            conversations: previous.conversations.map((conversation) => {
              if (conversation.id !== conversationId) return conversation;
              return { ...conversation, messages: [...olderMessages, ...conversation.messages] };
            }),
          };
        });

        return olderMessages;
      } catch (error: any) {
        console.error("[handleLoadOlderMessages] Error:", error);
        return [];
      }
    },
    [setActiveData, setHasMoreMessagesMap],
  );

  const handleDeleteConversationFromHistory = useCallback(
    async (scenarioId: string, conversationId: string) => {
      const previousRegistry = [...conversationRegistry];
      setConversationRegistry((previous) =>
        previous.filter((conversation) => conversation.conversationId !== conversationId),
      );

      if (activeId === scenarioId && activeData) {
        setActiveData((previous) =>
          previous
            ? {
                ...previous,
                conversations: previous.conversations.filter(
                  (conversation) => conversation.id !== conversationId,
                ),
              }
            : previous,
        );
      }

      try {
        await supabaseData.deleteConversation(conversationId);
      } catch (error: any) {
        console.error("Failed to delete conversation:", error.message);
        setConversationRegistry(previousRegistry);
      }
    },
    [activeData, activeId, conversationRegistry, setActiveData, setConversationRegistry],
  );

  const handleDeleteAllConversations = useCallback(async () => {
    if (conversationRegistry.length === 0) {
      return;
    }

    const previousRegistry = [...conversationRegistry];
    setConversationRegistry([]);
    if (activeData) {
      setActiveData((previous) => (previous ? { ...previous, conversations: [] } : previous));
    }

    try {
      await Promise.all(
        previousRegistry.map((conversation) =>
          supabaseData.deleteConversation(conversation.conversationId),
        ),
      );
    } catch (error: any) {
      console.error("Failed to delete sessions:", error.message);
      setConversationRegistry(previousRegistry);
    }
  }, [activeData, conversationRegistry, setActiveData, setConversationRegistry]);

  return {
    handlePlayScenario,
    handleEditScenario,
    executeRemixClone,
    handleCreateNewScenario,
    handleDeleteScenario,
    executeDeleteScenario,
    handleResumeFromHistory,
    handleLoadOlderMessages,
    handleDeleteConversationFromHistory,
    handleDeleteAllConversations,
  };
}
