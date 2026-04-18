import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import {
  Character,
  ContentThemes,
  ConversationMetadata,
  ScenarioMetadata,
  TabKey,
  UserBackground,
} from "@/types";
import {
  fetchSavedScenarios,
  fetchUserPublishedScenarios,
  PublishedScenario,
  SavedScenario,
} from "@/services/gallery-data";
import * as supabaseData from "@/services/supabase-data";

type AppShellTab = TabKey | "library";

interface UserProfileState {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface UseIndexAuthenticatedDataArgs {
  isAuthenticated: boolean;
  userId?: string;
  scenarioPageSize: number;
  tab: AppShellTab;
  conversationRegistry: ConversationMetadata[];
  conversationsEnriched: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setRegistry: Dispatch<SetStateAction<ScenarioMetadata[]>>;
  setHasMoreScenarios: Dispatch<SetStateAction<boolean>>;
  setLibrary: Dispatch<SetStateAction<Character[]>>;
  setConversationRegistry: Dispatch<SetStateAction<ConversationMetadata[]>>;
  setConversationsEnriched: Dispatch<SetStateAction<boolean>>;
  setHubBackgrounds: Dispatch<SetStateAction<UserBackground[]>>;
  setSavedScenarios: Dispatch<SetStateAction<SavedScenario[]>>;
  setPublishedScenariosData: Dispatch<SetStateAction<Map<string, PublishedScenario>>>;
  setUserProfile: Dispatch<SetStateAction<UserProfileState | null>>;
  setContentThemesMap: Dispatch<SetStateAction<Map<string, ContentThemes>>>;
  setSelectedHubBackgroundId: Dispatch<SetStateAction<string | null>>;
  setSelectedImageLibraryBackgroundId: Dispatch<SetStateAction<string | null>>;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        if (import.meta.env.DEV) {
          console.debug(`[withTimeout] ${label} timed out after ${ms}ms, using fallback`);
        }
        resolve(fallback);
      }, ms);
    }),
  ]);
}

export function useIndexAuthenticatedData({
  isAuthenticated,
  userId,
  scenarioPageSize,
  tab,
  conversationRegistry,
  conversationsEnriched,
  setIsLoading,
  setRegistry,
  setHasMoreScenarios,
  setLibrary,
  setConversationRegistry,
  setConversationsEnriched,
  setHubBackgrounds,
  setSavedScenarios,
  setPublishedScenariosData,
  setUserProfile,
  setContentThemesMap,
  setSelectedHubBackgroundId,
  setSelectedImageLibraryBackgroundId,
}: UseIndexAuthenticatedDataArgs) {
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    const authenticatedUserId = userId;

    async function loadData() {
      setIsLoading(true);
      try {
        const backfillResult = await withTimeout(
          supabaseData.backfillCanonicalWorldCoreForUser(authenticatedUserId),
          20000,
          { total: 0, updated: 0 },
          "backfillCanonicalWorldCoreForUser",
        );
        if (backfillResult.updated > 0) {
          console.info(
            `[Index] Canonical world_core backfill updated ${backfillResult.updated}/${backfillResult.total} scenario(s).`,
          );
        }

        const [
          scenarios,
          characters,
          conversations,
          backgrounds,
          imageLibraryBgId,
          savedScenarios,
          publishedData,
          profile,
        ] = await Promise.all([
          withTimeout(
            supabaseData.fetchMyScenariosPaginated(authenticatedUserId, scenarioPageSize, 0),
            15000,
            [],
            "fetchMyScenariosPaginated",
          ),
          withTimeout(
            supabaseData.fetchCharacterLibrary(),
            15000,
            [],
            "fetchCharacterLibrary",
          ),
          withTimeout(
            supabaseData.fetchConversationRegistry(),
            15000,
            [],
            "fetchConversationRegistry",
          ),
          withTimeout(
            supabaseData.fetchUserBackgrounds(authenticatedUserId),
            15000,
            [],
            "fetchUserBackgrounds",
          ),
          withTimeout(
            supabaseData.getImageLibraryBackground(authenticatedUserId),
            15000,
            null,
            "getImageLibraryBackground",
          ),
          withTimeout(fetchSavedScenarios(authenticatedUserId), 15000, [], "fetchSavedScenarios"),
          withTimeout(
            fetchUserPublishedScenarios(authenticatedUserId),
            15000,
            new Map<string, PublishedScenario>(),
            "fetchUserPublishedScenarios",
          ),
          withTimeout(
            supabaseData.fetchUserProfile(authenticatedUserId),
            15000,
            null,
            "fetchUserProfile",
          ),
        ]);

        setRegistry(scenarios);
        setHasMoreScenarios(scenarios.length >= scenarioPageSize);
        setLibrary(characters);
        setConversationRegistry(conversations);
        setConversationsEnriched(false);
        setHubBackgrounds(backgrounds);
        setSavedScenarios(savedScenarios);
        setPublishedScenariosData(publishedData);
        setUserProfile(profile);

        const ownedIds = scenarios.map((scenario) => scenario.id);
        const bookmarkedIds = savedScenarios
          .filter(
            (saved) =>
              saved.published_scenario?.scenario &&
              !ownedIds.includes(saved.source_scenario_id),
          )
          .map((saved) => saved.source_scenario_id);
        const allThemeIds = [...ownedIds, ...bookmarkedIds];

        if (allThemeIds.length > 0) {
          const themesMap = await supabaseData.fetchContentThemesForScenarios(allThemeIds);
          setContentThemesMap(themesMap);
        }

        const selectedBackground = backgrounds.find((background) => background.isSelected);
        if (selectedBackground) {
          setSelectedHubBackgroundId(selectedBackground.id);
        }

        if (imageLibraryBgId) {
          setSelectedImageLibraryBackgroundId(imageLibraryBgId);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [
    isAuthenticated,
    scenarioPageSize,
    setContentThemesMap,
    setConversationRegistry,
    setConversationsEnriched,
    setHasMoreScenarios,
    setHubBackgrounds,
    setIsLoading,
    setLibrary,
    setPublishedScenariosData,
    setRegistry,
    setSavedScenarios,
    setSelectedHubBackgroundId,
    setSelectedImageLibraryBackgroundId,
    setUserProfile,
    userId,
  ]);

  const registryLengthRef = useRef(conversationRegistry.length);

  useEffect(() => {
    if (tab !== "conversations" || conversationRegistry.length === 0) return;
    if (conversationsEnriched && registryLengthRef.current === conversationRegistry.length) return;

    registryLengthRef.current = conversationRegistry.length;
    setConversationsEnriched(true);
    void supabaseData
      .enrichConversationRegistry(conversationRegistry)
      .then((enriched) => {
        setConversationRegistry(enriched);
      })
      .catch((error) => {
        console.warn("[enrichConversationRegistry] Failed:", error);
      });
  }, [
    conversationRegistry,
    conversationsEnriched,
    setConversationRegistry,
    setConversationsEnriched,
    tab,
  ]);
}
