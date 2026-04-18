
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScenarioData, TabKey, Character, ScenarioMetadata, Conversation, ConversationMetadata, ContentThemes, defaultContentThemes } from "@/types";

import { fetchSavedScenarios, SavedScenario, PublishedScenario } from "@/services/gallery-data";
import { createDefaultScenarioData, now, uuid } from "@/utils";
import { useModelSettings, ModelSettingsProvider } from "@/contexts/ModelSettingsContext";
import { CharacterPicker, CharacterPickerWithRefresh } from "@/components/chronicle/CharacterPicker";
import { BackgroundPickerModal } from "@/components/chronicle/BackgroundPickerModal";
import { GalleryNsfwAgeModal } from "@/components/chronicle/GalleryNsfwAgeModal";
import { useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { AppShellTopBar } from "@/components/app-shell/AppShellTopBar";
import { AppShellWorkspace } from "@/components/app-shell/AppShellWorkspace";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AIPromptModal } from "@/components/chronicle/AIPromptModal";
import { useGalleryNsfwAccess } from "@/hooks/use-gallery-nsfw-preference";
import { useIndexAuthenticatedData } from "@/hooks/use-index-authenticated-data";
import { useIndexBackgroundWorkspace } from "@/hooks/use-index-background-workspace";
import { useIndexCharacterWorkspace } from "@/hooks/use-index-character-workspace";
import { useIndexDialogState } from "@/hooks/use-index-dialog-state";
import { useIndexScenarioLifecycle } from "@/hooks/use-index-scenario-lifecycle";
import { useIndexScenarioPersistence } from "@/hooks/use-index-scenario-persistence";
import { useIndexShellBootstrap } from "@/hooks/use-index-shell-bootstrap";
import * as supabaseData from "@/services/supabase-data";
import { DeleteConfirmDialog } from "@/components/chronicle/DeleteConfirmDialog";

import { getEditsCount } from "@/components/admin/styleguide/StyleGuideEditsModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { hasPublishErrors, validateForPublish } from "@/utils/publish-validation";
import { StoryExportFormatModal } from "@/components/chronicle/StoryExportFormatModal";
import { StoryImportModeModal } from "@/components/chronicle/StoryImportModeModal";
import {
  startApiUsageTestSession,
  stopApiUsageTestSession,
  type ApiUsageTestSession,
} from "@/services/api-usage-test-session";

const loadCharactersTabModule = () => import("@/features/character-builder/CharacterBuilderScreen");
const loadWorldTabModule = () => import("@/features/story-builder/StoryBuilderScreen");
const loadConversationsTabModule = () => import("@/components/chronicle/ConversationsTab");
const loadAdminPageModule = () => import("@/pages/Admin");
const loadAccountSettingsTabModule = () => import("@/components/account/AccountSettingsTab");
const loadSubscriptionTabModule = () => import("@/components/account/SubscriptionTab");
const loadPublicProfileTabModule = () => import("@/components/account/PublicProfileTab");
const loadScenarioHubModule = () => import("@/components/chronicle/StoryHub");
const loadChatInterfaceTabModule = () => import("@/components/chronicle/ChatInterfaceTab");
const loadImageLibraryTabModule = () => import("@/components/chronicle/ImageLibraryTab");
const loadGalleryHubModule = () => import("@/components/chronicle/GalleryHub");

const CharactersTab = React.lazy(() =>
  loadCharactersTabModule().then((m) => ({ default: m.CharacterBuilderScreen }))
);
const WorldTab = React.lazy(() =>
  loadWorldTabModule().then((m) => ({ default: m.StoryBuilderScreen }))
);
const ConversationsTab = React.lazy(() =>
  loadConversationsTabModule().then((m) => ({ default: m.ConversationsTab }))
);
const AdminPage = React.lazy(() =>
  loadAdminPageModule().then((m) => ({ default: m.AdminPage }))
);
const AccountSettingsTab = React.lazy(() =>
  loadAccountSettingsTabModule().then((m) => ({ default: m.AccountSettingsTab }))
);
const SubscriptionTab = React.lazy(() =>
  loadSubscriptionTabModule().then((m) => ({ default: m.SubscriptionTab }))
);
const PublicProfileTab = React.lazy(() =>
  loadPublicProfileTabModule().then((m) => ({ default: m.PublicProfileTab }))
);
const ScenarioHub = React.lazy(() =>
  loadScenarioHubModule().then((m) => ({ default: m.ScenarioHub }))
);
const ChatInterfaceTab = React.lazy(() =>
  loadChatInterfaceTabModule().then((m) => ({ default: m.ChatInterfaceTab }))
);
const ImageLibraryTab = React.lazy(() =>
  loadImageLibraryTabModule().then((m) => ({ default: m.ImageLibraryTab }))
);
const GalleryHub = React.lazy(() =>
  loadGalleryHubModule().then((m) => ({ default: m.GalleryHub }))
);

const LazyTabFallback = ({ className = "" }: { className?: string }) => (
  <div className={`h-full w-full ${className}`} aria-hidden="true" />
);

const HUB_FILTER_OPTIONS = [
  { key: "my", label: "My Stories" },
  { key: "bookmarked", label: "Saved Stories" },
  { key: "published", label: "Published" },
  { key: "drafts", label: "Drafts" },
  { key: "all", label: "All" },
] as const;

const GALLERY_SORT_OPTIONS = [
  { key: "all", label: "All Stories" },
  { key: "recent", label: "Recent" },
  { key: "liked", label: "Liked" },
  { key: "saved", label: "Saved" },
  { key: "played", label: "Played" },
  { key: "following", label: "Following" },
] as const;

const IndexContent = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const { modelId: globalModelId, setModelId: setGlobalModelId } = useModelSettings();

  // Stable reference for default scenario data - prevents infinite re-render loops
  // when activeData is null during the loading transition to chat_interface
  const defaultScenarioData = useMemo(() => createDefaultScenarioData(), []);

  const [registry, setRegistry] = useState<ScenarioMetadata[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<ScenarioData | null>(null);
  const [activeCoverImage, setActiveCoverImage] = useState<string>("");
  const [activeCoverPosition, setActiveCoverPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [activeContentThemes, setActiveContentThemes] = useState<ContentThemes>(defaultContentThemes);
  const [playingConversationId, setPlayingConversationId] = useState<string | null>(null);
  const [library, setLibrary] = useState<Character[]>([]);
  const [tab, setTab] = useState<TabKey | "library">("gallery");
  const [fatal, setFatal] = useState<string>("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [conversationRegistry, setConversationRegistry] = useState<ConversationMetadata[]>([]);
  // Removed: selectedConversationEntry state - sessions now open directly
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
  const [storyNameError, setStoryNameError] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  // Track which conversations have more older messages to load
  const [hasMoreMessagesMap, setHasMoreMessagesMap] = useState<Record<string, boolean>>({});
  // Track characters saved to library (by their ID). Value is the library character's ID (string) or true for library-originating characters.
  const [characterInLibrary, setCharacterInLibrary] = useState<Record<string, string | boolean>>({});
  // Track newly created characters in library that haven't been saved yet
  const [unsavedNewCharacterIds, setUnsavedNewCharacterIds] = useState<Set<string>>(new Set());
  // Search query for library tab
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
   const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('chronicle_sidebar_collapsed') === 'true';
  });

  // Delayed resume overlay
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResumingOverlay, setShowResumingOverlay] = useState(false);
  const [isInImageFolder, setIsInImageFolder] = useState(false);
  const imageLibraryExitFolderRef = React.useRef<(() => void) | null>(null);
  const [imageLibrarySearchQuery, setImageLibrarySearchQuery] = useState('');
  const [adminActiveTool, setAdminActiveTool] = useState<string>('hub');
  const [isAdminState, setIsAdminState] = useState(false);
  const [activeApiUsageTestSession, setActiveApiUsageTestSession] = useState<ApiUsageTestSession | null>(null);
  const [isApiUsageToggleBusy, setIsApiUsageToggleBusy] = useState(false);
  const [apiUsageToggleError, setApiUsageToggleError] = useState<string | null>(null);
  const [navButtonImages, setNavButtonImages] = useState<Record<string, any>>({});
  const [guideTheme, setGuideTheme] = useState<'dark' | 'light'>('dark');
  const guideSaveRef = React.useRef<(() => Promise<void>) | null>(null);
  const guideSyncAllRef = React.useRef<(() => Promise<void>) | null>(null);
  const styleGuideDownloadRef = React.useRef<(() => void) | null>(null);
  const styleGuideEditsRef = React.useRef<(() => void) | null>(null);
  const [styleGuideEditsCount, setStyleGuideEditsCount] = useState(0);
  const imageLibraryUploadRef = React.useRef<(() => void) | null>(null);
  const storyTransferFileRef = React.useRef<HTMLInputElement | null>(null);
  // Read URL query params for deep-linking (e.g. /?tab=admin&adminTool=app_guide)
  const [searchParams, setSearchParams] = useSearchParams();
  // Pagination state
  const SCENARIO_PAGE_SIZE = 50;
  const [hasMoreScenarios, setHasMoreScenarios] = useState(true);
  const [isLoadingMoreScenarios, setIsLoadingMoreScenarios] = useState(false);

  // Hub filter state for "Your Stories" tab
  type HubFilter = "my" | "bookmarked" | "published" | "drafts" | "all";
  const [hubFilter, setHubFilter] = useState<HubFilter>("all");

  // Gallery sort state (lifted from GalleryHub)
  type GallerySortOption = 'all' | 'recent' | 'liked' | 'saved' | 'played' | 'following';
  const [gallerySortBy, setGallerySortBy] = useState<GallerySortOption>('all');
  const {
    showNsfw: galleryShowNsfw,
    onToggleChange: handleGalleryNsfwToggleChange,
    requestShowNsfw: requestGalleryShowNsfw,
    confirmOpen: galleryNsfwConfirmOpen,
    closeConfirm: closeGalleryNsfwConfirm,
    confirmShowNsfw: confirmGalleryShowNsfw,
  } = useGalleryNsfwAccess();
  const {
    hubBackgrounds,
    selectedHubBackgroundId,
    selectedImageLibraryBackgroundId,
    isUploadingBackground,
    selectedHubBackground,
    selectedBackgroundUrl,
    selectedImageLibraryBackgroundUrl,
    setHubBackgrounds,
    setSelectedHubBackgroundId,
    setSelectedImageLibraryBackgroundId,
    handleUploadBackground,
    handleSelectBackground,
    handleDeleteBackground,
    handleSelectImageLibraryBackground,
    handleOverlayChange,
  } = useIndexBackgroundWorkspace({
    userId: user?.id,
  });
  const [accountActiveTab, setAccountActiveTab] = useState<string>('settings');
  const accountProfileSaveRef = React.useRef<(() => Promise<void>) | null>(null);
  const [isAccountProfileSaving, setIsAccountProfileSaving] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [publishedScenariosData, setPublishedScenariosData] = useState<Map<string, PublishedScenario>>(new Map());
  const [contentThemesMap, setContentThemesMap] = useState<Map<string, ContentThemes>>(new Map());
  const [userProfile, setUserProfile] = useState<{ username: string | null; display_name: string | null; avatar_url: string | null } | null>(null);

  // Derive publishedScenarioIds from publishedScenariosData
  const publishedScenarioIds = useMemo(() => {
    return new Set(publishedScenariosData.keys());
  }, [publishedScenariosData]);

  const {
    isCharacterPickerOpen,
    aiPromptModal,
    userMenuOpen,
    deleteConfirmId,
    deleteConfirmType,
    convDeleteTarget,
    convDeleteAllOpen,
    remixConfirmId,
    authModalOpen,
    storyExportModalOpen,
    storyImportModalOpen,
    storyImportMode,
    storyTransferNotice,
    storyTransferWarningDetails,
    isBackgroundModalOpen,
    isImageLibraryBackgroundModalOpen,
    setStoryImportMode,
    setStoryTransferNotice,
    setStoryTransferWarningDetails,
    dismissStoryTransferNotice,
    openAuthModal,
    closeAuthModal,
    toggleUserMenu,
    closeUserMenu,
    openCharacterPicker,
    closeCharacterPicker,
    openAiPromptModal,
    closeAiPromptModal,
    openBackgroundModal,
    closeBackgroundModal,
    openImageLibraryBackgroundModal,
    closeImageLibraryBackgroundModal,
    openStoryExportModal,
    closeStoryExportModal,
    openStoryImportModal,
    closeStoryImportModal,
    openConversationDeleteTarget,
    closeConversationDeleteTarget,
    handleConversationDeleteTargetOpenChange,
    openConversationDeleteAll,
    handleConversationDeleteAllOpenChange,
    closeConversationDeleteAll,
    openDeleteConfirm,
    clearDeleteConfirm,
    handleDeleteConfirmOpenChange,
    openRemixConfirm,
    closeRemixConfirm,
    handleRemixConfirmOpenChange,
  } = useIndexDialogState();

  const handleApiUsageTestToggle = useCallback(async (enabled: boolean) => {
    if (!isAdminState || !user?.id) return;

    setIsApiUsageToggleBusy(true);
    setApiUsageToggleError(null);
    try {
      if (enabled) {
        const scenarioName =
          activeData?.world?.core?.scenarioName ||
          registry.find((entry) => entry.id === activeId)?.title ||
          "Untitled Scenario";
        const activeConversation =
          activeData?.conversations?.find((conv) => conv.id === playingConversationId) || null;

        const session = await startApiUsageTestSession({
          scenarioId: activeId || null,
          scenarioName,
          conversationId: activeConversation?.id || null,
          conversationName: activeConversation?.title || "",
          metadata: {
            startedFrom: "story_builder_header",
            tab,
          },
        });
        setActiveApiUsageTestSession(session);
      } else {
        await stopApiUsageTestSession(activeApiUsageTestSession?.id || null);
        setActiveApiUsageTestSession(null);
      }
    } catch (error) {
      console.error("[api-usage-test] Failed to toggle tracking:", error);
      const message = error instanceof Error ? error.message : String(error || "Failed to update tracking");
      setApiUsageToggleError(message);
    } finally {
      setIsApiUsageToggleBusy(false);
    }
  }, [
    activeApiUsageTestSession?.id,
    activeData?.conversations,
    activeData?.world?.core?.scenarioName,
    activeId,
    isAdminState,
    playingConversationId,
    registry,
    tab,
    user?.id,
  ]);

  const clearAppliedSearchParams = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const resetAccountProfileSaveState = useCallback(() => {
    accountProfileSaveRef.current = null;
    setIsAccountProfileSaving(false);
  }, []);

  const warmupLoaders = useMemo(
    () => [
      loadScenarioHubModule,
      loadConversationsTabModule,
      loadWorldTabModule,
      loadCharactersTabModule,
      loadAdminPageModule,
      loadChatInterfaceTabModule,
      loadImageLibraryTabModule,
      loadAccountSettingsTabModule,
      loadSubscriptionTabModule,
      loadPublicProfileTabModule,
    ],
    [],
  );

  useIndexShellBootstrap({
    searchParams,
    clearAppliedSearchParams,
    setTab,
    setAdminActiveTool,
    storyTransferNotice,
    dismissStoryTransferNotice,
    sidebarCollapsed,
    setSidebarCollapsed,
    authLoading,
    isAuthenticated,
    tab,
    openAuthModal,
    userId: user?.id,
    setIsAdminState,
    accountActiveTab,
    resetAccountProfileSaveState,
    isAdminState,
    setActiveApiUsageTestSession,
    setNavButtonImages,
    warmupLoaders,
  });

  const [conversationsEnriched, setConversationsEnriched] = useState(false);

  // (Draft count refresh removed - drafts are now DB-backed and shown in the hub)
  useIndexAuthenticatedData({
    isAuthenticated,
    userId: user?.id,
    scenarioPageSize: SCENARIO_PAGE_SIZE,
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
  });

  const {
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
  } = useIndexScenarioPersistence({
    activeId,
    activeData,
    activeCoverImage,
    activeCoverPosition,
    activeContentThemes,
    userId: user?.id,
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
  });

  const {
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
  } = useIndexScenarioLifecycle({
    userId: user?.id,
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
  });

  const {
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
  } = useIndexCharacterWorkspace({
    userId: user?.id,
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
  });

  // Compute filtered registry based on hubFilter
  const filteredRegistry = useMemo(() => {
    const myScenarioIds = new Set(registry.map(s => s.id));
    
    // Convert saved scenarios to ScenarioMetadata format
    const bookmarkedScenarios: ScenarioMetadata[] = savedScenarios
      .filter(saved => 
        saved.published_scenario?.scenario && 
        !myScenarioIds.has(saved.source_scenario_id) // Exclude own scenarios
      )
      .map(saved => ({
        id: saved.source_scenario_id,
        title: saved.published_scenario!.scenario!.title,
        description: saved.published_scenario!.scenario!.description || '',
        coverImage: saved.published_scenario!.scenario!.cover_image_url || '',
        coverImagePosition: (saved.published_scenario!.scenario!.cover_image_position as { x: number; y: number }) || { x: 50, y: 50 },
        tags: saved.published_scenario!.tags || [],
        createdAt: new Date(saved.created_at).getTime(),
        updatedAt: new Date(saved.created_at).getTime(),
        isBookmarked: true,
      }));
    
    switch (hubFilter) {
      case "my":
        return registry.filter(s => !s.isDraft);
      case "bookmarked":
        return bookmarkedScenarios;
      case "published":
        return registry.filter(s => publishedScenarioIds.has(s.id));
      case "drafts":
        return registry.filter(s => s.isDraft);
      case "all":
        return [...registry, ...bookmarkedScenarios];
    }
  }, [registry, savedScenarios, hubFilter, publishedScenarioIds]);

  const handleSignOut = async () => {
    await signOut();
    setTab("gallery");
  };

  const requireAuth = useCallback((action: () => void) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    action();
  }, [isAuthenticated, openAuthModal]);

  // Build bookmarked creator names map
  const bookmarkedCreatorNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const saved of savedScenarios) {
      if (saved.published_scenario?.scenario) {
        const pub = saved.published_scenario as any;
        const name = pub.publisher?.display_name || pub.publisher?.username || 'Anonymous';
        map.set(saved.source_scenario_id, name);
      }
      }
    return map;
  }, [savedScenarios]);

  // Load more scenarios handler
  const handleLoadMoreScenarios = useCallback(async () => {
    if (!user || isLoadingMoreScenarios || !hasMoreScenarios) return;
    setIsLoadingMoreScenarios(true);
    try {
      const more = await supabaseData.fetchMyScenariosPaginated(user.id, SCENARIO_PAGE_SIZE, registry.length);
      if (more.length < SCENARIO_PAGE_SIZE) setHasMoreScenarios(false);
      if (more.length > 0) setRegistry(prev => [...prev, ...more]);
    } catch (e) {
      console.error('Failed to load more scenarios:', e);
    } finally {
      setIsLoadingMoreScenarios(false);
    }
  }, [user, isLoadingMoreScenarios, hasMoreScenarios, registry.length]);

  // Handler for playing a scenario from the gallery
  const handleGalleryPlay = (scenarioId: string, publishedScenarioId: string) => {
    void publishedScenarioId;
    handlePlayScenario(scenarioId);
  };

  // Handler to refresh saved scenarios when bookmark changes in gallery
  const handleGallerySaveChange = useCallback(async () => {
    if (!user) return;
    try {
      const savedScens = await fetchSavedScenarios(user.id);
      setSavedScenarios(savedScens);
    } catch (e) {
      console.error('Failed to refresh saved scenarios:', e);
    }
  }, [user]);

  function handleUpdateActive(patch: Partial<ScenarioData>) {
    setActiveData(prev => prev ? { ...prev, ...patch } : null);
  }

  function handleAddWorldEntry() {
    if (!activeData) return;
    const t = now();
    const newEntry = { id: uuid(), title: '', body: '', createdAt: t, updatedAt: t }; // Use UUID for Supabase
    handleUpdateActive({ world: { ...activeData.world, entries: [newEntry, ...activeData.world.entries] } });
  }

  // Handle AI prompt modal submission
  function handleAIPromptSubmit(prompt: string, useExistingDetails: boolean) {
    if (aiPromptModal?.mode === 'fill') {
      handleAiFill(prompt, useExistingDetails);
    } else if (aiPromptModal?.mode === 'generate') {
      handleAiGenerate(prompt, useExistingDetails);
    }
  }

  // Intentionally do not block initial shell render behind an auth spinner.
  // We allow the app chrome to render immediately while auth state resolves.

  if (fatal) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
      <div>
        <h1 className="text-3xl font-black mb-4 text-rose-500">CRITICAL ERROR</h1>
        <p className="max-w-md mb-8">{fatal}</p>
        <button onClick={() => {
          const prefixes = ['rpg_', 'draft_', 'chronicle_', 'quality_hub_'];
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && prefixes.some(p => key.startsWith(p))) keysToRemove.push(key);
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          location.reload();
        }} className={`px-6 py-3 bg-white text-[hsl(var(--ui-surface-2))] rounded-2xl font-bold`}>Clear App Data &amp; Restart</button>
      </div>
    </div>
  );

  const isDraft = activeId ? !registry.some(r => r.id === activeId) : false;
  const activeMeta = registry.find(m => m.id === activeId);
  const isApiUsageTrackingAnyStory = activeApiUsageTestSession?.status === "active";
  const isApiUsageTrackingCurrentStory =
    activeApiUsageTestSession?.status === "active" &&
    !!activeId &&
    activeApiUsageTestSession?.scenarioId === activeId;
  const apiUsageTrackingStatusText = isApiUsageToggleBusy
    ? "Updating..."
    : apiUsageToggleError
      ? `Error: ${apiUsageToggleError}`
    : isApiUsageTrackingCurrentStory
      ? `Tracking this story • ${activeApiUsageTestSession?.id.slice(0, 8)}`
      : isApiUsageTrackingAnyStory
        ? `Tracking another story • ${activeApiUsageTestSession?.id.slice(0, 8)}`
        : "Off";

  const openStoryBuilderFromSidebar = () => {
    setSelectedCharacterId(null);
    setPlayingConversationId(null);

    if (activeData) {
      setTab("world");
      return;
    }

    handleCreateNewScenario();
  };

  const showShellTopBar =
    tab === "characters" ||
    tab === "world" ||
    tab === "library" ||
    tab === "conversations" ||
    tab === "hub" ||
    tab === "image_library" ||
    tab === "gallery" ||
    tab === "admin" ||
    tab === "account";

  const handleBuilderBack = () => {
    if (tab === "characters") {
      setSelectedCharacterId(null);
      setTab("world");
      return;
    }

    setActiveId(null);
    setActiveData(null);
    setTab("hub");
  };

  const handleFinalizeAndCloseStory = async () => {
    if (!activeId || !activeData) return;

    const errors = validateForPublish({
      scenarioTitle: activeData.world.core.scenarioName || "",
      world: activeData.world,
      characters: activeData.characters,
      openingDialog: activeData.story.openingDialog,
      contentThemes: activeContentThemes,
      coverImage: activeCoverImage,
    });

    if (hasPublishErrors(errors)) {
      setTab("world");
      window.dispatchEvent(new CustomEvent("chronicle:save-validation-failed", { detail: errors }));
      return;
    }

    setIsSavingAndClosing(true);
    const safety = setTimeout(() => {
      console.warn("Save&Close safety timeout");
      setIsSavingAndClosing(false);
    }, 12000);

    try {
      await handleSave(true);
    } finally {
      clearTimeout(safety);
      setIsSavingAndClosing(false);
    }
  };

  const handleSaveDraftFromHeader = async () => {
    if (!activeId || !activeData || !user) return;

    setIsSaving(true);
    try {
      await saveDraftInBackground();
      setTimeout(() => setIsSaving(false), 1200);
    } catch (error) {
      console.warn("Could not save draft:", error);
      setStoryTransferNotice({
        tone: "error",
        text: "Draft save failed. Please try again.",
      });
      setIsSaving(false);
    }
  };

  const handleOpenStyleGuideEdits = () => {
    styleGuideEditsRef.current?.();
  };

  const handleSaveAccountProfile = () => {
    void accountProfileSaveRef.current?.();
  };

  return (
    <TooltipProvider>
      <div className="h-screen min-w-0 flex bg-white overflow-hidden relative">
        <AppSidebar
          tab={tab}
          sidebarCollapsed={sidebarCollapsed}
          hasActiveStory={!!activeId}
          activeStoryTitle={activeMeta?.title}
          isAdminState={isAdminState}
          isAuthenticated={isAuthenticated}
          userEmail={user?.email ?? null}
          displayName={userProfile?.display_name ?? null}
          avatarUrl={userProfile?.avatar_url ?? null}
          userMenuOpen={userMenuOpen}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectGallery={() => handleNavigateAway("gallery")}
          onSelectHub={() => requireAuth(() => handleNavigateAway("hub"))}
          onSelectLibrary={() => requireAuth(() => handleNavigateAway("library"))}
          onSelectImageLibrary={() => requireAuth(() => handleNavigateAway("image_library"))}
          onSelectConversations={() => requireAuth(() => handleNavigateAway("conversations"))}
          onSelectStoryBuilder={openStoryBuilderFromSidebar}
          onSelectAdmin={() => requireAuth(() => { setAdminActiveTool("hub"); setTab("admin"); })}
          onToggleUserMenu={toggleUserMenu}
          onSelectPublicProfile={() => { setAccountActiveTab("profile"); setTab("account"); closeUserMenu(); }}
          onSelectAccountSettings={() => { setAccountActiveTab("settings"); setTab("account"); closeUserMenu(); }}
          onSignIn={openAuthModal}
          onSignOut={() => { handleSignOut(); closeUserMenu(); }}
        />

      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-ghost-white">
        {showShellTopBar && (
          <AppShellTopBar
            tab={tab}
            library={{
              selectedCharacterId,
              searchQuery: librarySearchQuery,
              onSearchChange: setLibrarySearchQuery,
              onBack: () => setSelectedCharacterId(null),
            }}
            builder={{
              activeTab: tab === "characters" ? "characters" : "world",
              onBack: handleBuilderBack,
            }}
            hub={{
              activeFilter: hubFilter,
              options: [...HUB_FILTER_OPTIONS],
              onFilterChange: (value) => setHubFilter(value as HubFilter),
              onOpenBackgroundModal: openBackgroundModal,
            }}
            gallery={{
              activeSort: gallerySortBy,
              options: [...GALLERY_SORT_OPTIONS],
              onSortChange: (value) => setGallerySortBy(value as GallerySortOption),
              showNsfw: galleryShowNsfw,
              onToggleNsfw: handleGalleryNsfwToggleChange,
            }}
            imageLibrary={{
              isInFolder: isInImageFolder,
              searchQuery: imageLibrarySearchQuery,
              onSearchChange: setImageLibrarySearchQuery,
              onExitFolder: () => imageLibraryExitFolderRef.current?.(),
              onUploadImages: () => imageLibraryUploadRef.current?.(),
              onOpenBackgroundModal: openImageLibraryBackgroundModal,
            }}
            admin={{
              activeTool: adminActiveTool,
              guideTheme,
              styleGuideEditsCount,
              onBackToHub: () => setAdminActiveTool("hub"),
              onToggleGuideTheme: () => setGuideTheme((prev) => (prev === "dark" ? "light" : "dark")),
              onGuideSave: () => guideSaveRef.current?.(),
              onGuideSyncAll: () => guideSyncAllRef.current?.(),
              onOpenStyleGuideEdits: handleOpenStyleGuideEdits,
              onDownloadStyleGuide: () => styleGuideDownloadRef.current?.(),
            }}
            account={{
              activeTab: accountActiveTab,
              isSavingProfile: isAccountProfileSaving,
              onBack: () => setTab("hub"),
              onSaveProfile: handleSaveAccountProfile,
            }}
            conversations={{
              hasConversations: conversationRegistry.length > 0,
              onDeleteAll: openConversationDeleteAll,
            }}
            storyBuilder={{
              canInteract: !!activeData,
              isSaving,
              isSavingAndClosing,
              isAdminState,
              apiUsageTrackingStatusText,
              isApiUsageTrackingCurrentStory,
              isApiUsageToggleBusy,
              storyTransferNotice: storyTransferNotice
                ? {
                    ...storyTransferNotice,
                    warningDetails: storyTransferWarningDetails,
                  }
                : null,
              onOpenImport: handleOpenStoryImport,
              onOpenExport: handleOpenStoryExport,
              onFinalizeAndClose: handleFinalizeAndCloseStory,
              onSaveDraft: handleSaveDraftFromHeader,
              onToggleApiUsageTracking: (checked) => {
                void handleApiUsageTestToggle(checked);
              },
            }}
            characterEditor={{
              selectedCharacterId,
              isLibraryTab: tab === "library",
              isAiFilling,
              isSaving,
              isSavingAndClosing,
              isSavingToLibrary,
              selectedCharacterIsInLibrary,
              onOpenAiFill: () => openAiPromptModal("fill"),
              onSave: handleSaveCharacter,
              onCancel: handleCancelCharacterEdit,
              onSaveToLibrary: handleSaveToLibrary,
              onOpenCharacterPicker: openCharacterPicker,
              onCreateCharacter: handleCreateCharacter,
            }}
          />
        )}

        {/* Layout guardrail:
            This wrapper must stay flex-1 + min-h-0 in a column context so nested
            builders can establish bounded heights and keep internal pane scrolling. */}
        <AppShellWorkspace>
          {tab === "hub" && (
            <div 
              className="relative w-full h-full bg-black"
              style={selectedBackgroundUrl ? {
                backgroundImage: `url(${selectedBackgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : undefined}
            >
              {selectedBackgroundUrl && (() => {
                const oColor = selectedHubBackground?.overlayColor || 'black';
                const oOpacity = (selectedHubBackground?.overlayOpacity ?? 10) / 100;
                return <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: oColor === 'white' ? `rgba(255,255,255,${oOpacity})` : `rgba(0,0,0,${oOpacity})` }} />;
              })()}
              <React.Suspense fallback={<LazyTabFallback className="bg-black/70" />}>
                <ScenarioHub
                  registry={filteredRegistry}
                  onPlay={handlePlayScenario}
                  onEdit={handleEditScenario}
                  onDelete={handleDeleteScenario}
                  onCreate={handleCreateNewScenario}
                  publishedScenarioIds={publishedScenarioIds}
                  contentThemesMap={contentThemesMap}
                  publishedScenariosData={publishedScenariosData}
                  ownerUsername={userProfile?.display_name || userProfile?.username || undefined}
                  bookmarkedCreatorNames={bookmarkedCreatorNames}
                  onLoadMore={handleLoadMoreScenarios}
                  hasMore={hasMoreScenarios}
                  isLoadingMore={isLoadingMoreScenarios}
                />
              </React.Suspense>
            </div>
          )}

          {tab === "gallery" && (
            <React.Suspense fallback={<LazyTabFallback className="bg-black" />}>
              <GalleryHub
                onPlay={handleGalleryPlay}
                onSaveChange={handleGallerySaveChange}
                sortBy={gallerySortBy}
                onSortChange={setGallerySortBy}
                onAuthRequired={openAuthModal}
                showNsfw={galleryShowNsfw}
                onRequestShowNsfw={requestGalleryShowNsfw}
              />
            </React.Suspense>
          )}

          {tab === "image_library" && (
            <div 
              className="relative w-full h-full bg-black"
              style={selectedImageLibraryBackgroundUrl ? {
                backgroundImage: `url(${selectedImageLibraryBackgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : undefined}
            >
              {selectedImageLibraryBackgroundUrl && (
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
              )}
              <React.Suspense fallback={<LazyTabFallback className="bg-black/80" />}>
                <ImageLibraryTab 
                  userId={user?.id ?? null}
                  onFolderChange={(inFolder, exitFn) => {
                    setIsInImageFolder(inFolder);
                    imageLibraryExitFolderRef.current = exitFn || null;
                    if (!inFolder) setImageLibrarySearchQuery('');
                  }}
                  searchQuery={imageLibrarySearchQuery}
                  uploadRef={imageLibraryUploadRef}
                />
              </React.Suspense>
            </div>
          )}

          {tab === "library" && (
            <div className="h-full overflow-y-auto bg-black p-4 relative z-10 sm:p-6 lg:p-10">
              <React.Suspense fallback={<LazyTabFallback className="bg-black" />}>
                <CharactersTab
                  appData={{ ...createDefaultScenarioData(), characters: filteredLibrary }}
                  selectedId={selectedCharacterId}
                  onSelect={setSelectedCharacterId}
                  onUpdate={handleUpdateCharacter}
                  onDelete={handleDeleteCharacterFromList}
                  onAddSection={handleAddSection}
                  onAddNew={handleCreateCharacter}
                  navButtonImages={navButtonImages}
                  onNavButtonImagesChange={setNavButtonImages}
                />
              </React.Suspense>
            </div>
          )}

          {tab === "characters" && activeData && (
            // Height-chain guardrail: keep h-full + min-h-0 + overflow-hidden wrapper
            // so Character Builder side nav and main pane scroll regions resolve correctly.
            <div className="h-full min-h-0 overflow-hidden">
              <React.Suspense fallback={<LazyTabFallback className="bg-black" />}>
                <CharactersTab
                  appData={activeData}
                  selectedId={selectedCharacterId}
                  onSelect={setSelectedCharacterId}
                  onUpdate={handleUpdateCharacter}
                  onDelete={handleDeleteCharacterFromList}
                  onAddSection={handleAddSection}
                  scenarioId={activeId}
                  isAdmin={isAdminState}
                  navButtonImages={navButtonImages}
                  onNavButtonImagesChange={setNavButtonImages}
                />
              </React.Suspense>
            </div>
          )}

          {tab === "world" && activeData && activeId && (
            // Height-chain guardrail: keep h-full + min-h-0 + overflow-hidden wrapper
            // so Story Builder roster + content panes preserve full-height behavior.
            <div className="h-full min-h-0 overflow-hidden">
              <React.Suspense fallback={<LazyTabFallback className="bg-black" />}>
                <WorldTab
                  scenarioId={activeId}
                  world={activeData.world}
                  characters={activeData.characters}
                  openingDialog={activeData.story.openingDialog}
                  scenes={activeData.scenes}
                  coverImage={activeCoverImage}
                  coverImagePosition={activeCoverPosition}
                  selectedArtStyle={activeData.selectedArtStyle || 'cinematic-2-5d'}
                  onUpdateWorld={(patch) => handleUpdateActive({ world: { ...activeData.world, ...patch } })}
                  onUpdateOpening={(patch) => handleUpdateActive({ story: { openingDialog: { ...activeData.story.openingDialog, ...patch } } })}
                  onUpdateScenes={(scenes) => handleUpdateActive({ scenes })}
                  onUpdateCoverImage={setActiveCoverImage}
                  onUpdateCoverPosition={setActiveCoverPosition}
                  onUpdateArtStyle={(styleId) => handleUpdateActive({ selectedArtStyle: styleId })}
                  contentThemes={activeContentThemes}
                  onUpdateContentThemes={async (themes) => {
                    setActiveContentThemes(themes);
                    if (activeId && user) {
                      try {
                        await supabaseData.saveContentThemes(activeId, themes);
                      } catch (e) {
                        console.error('Failed to save content themes:', e);
                      }
                    }
                  }}
                  onCreateCharacter={() => { handleCreateCharacter(); setTab("characters"); }}
                  onOpenLibraryPicker={openCharacterPicker}
                  onSelectCharacter={(id) => { setSelectedCharacterId(id); setTab("characters"); }}
                  storyNameError={storyNameError}
                />
              </React.Suspense>
            </div>
          )}

          {tab === "conversations" && (
            <div className="relative h-full overflow-y-auto bg-black p-4 sm:p-6 lg:p-10">
              {showResumingOverlay && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                  <p className="text-white font-medium text-lg">Resuming session...</p>
                </div>
              )}
              <React.Suspense fallback={<LazyTabFallback className="bg-black" />}>
                <ConversationsTab
                  globalRegistry={conversationRegistry}
                  onResume={handleResumeFromHistory}
                  onDelete={(scenarioId, conversationId) => {
                    openConversationDeleteTarget(scenarioId, conversationId);
                  }}
                />
              </React.Suspense>

              {/* Single delete confirm */}
              <DeleteConfirmDialog
                open={!!convDeleteTarget}
                onOpenChange={handleConversationDeleteTargetOpenChange}
                onConfirm={() => {
                  if (convDeleteTarget) {
                    handleDeleteConversationFromHistory(convDeleteTarget.scenarioId, convDeleteTarget.conversationId);
                  }
                  closeConversationDeleteTarget();
                }}
                title="Delete this session?"
                message="This saved session will be permanently deleted. This cannot be undone."
              />

              {/* Delete All confirm */}
              <DeleteConfirmDialog
                open={convDeleteAllOpen}
                onOpenChange={handleConversationDeleteAllOpenChange}
                onConfirm={() => {
                  closeConversationDeleteAll();
                  handleDeleteAllConversations();
                }}
                title={`Delete all ${conversationRegistry.length} session${conversationRegistry.length !== 1 ? 's' : ''}?`}
                message="All saved sessions will be permanently deleted. This cannot be undone."
              />
            </div>
          )}

          {tab === "chat_interface" && activeId && playingConversationId && (
            <React.Suspense fallback={<LazyTabFallback className="bg-black" />}>
              <ChatInterfaceTab
                scenarioId={activeId}
                appData={activeData || defaultScenarioData}
                conversationId={playingConversationId}
                modelId={globalModelId}
                isAdmin={isAdminState}
                onUpdate={(convs) => handleUpdateActive({ conversations: convs })}
                onBack={() => { setPlayingConversationId(null); setTab("hub"); }}
                onSaveScenario={(conversations?: Conversation[]) => {
                  if (conversations && user && activeId) {
                    // Find the specific conversation that was modified
                    const modifiedConv = conversations.find(c => c.id === playingConversationId);
                    
                    if (modifiedConv) {
                      // OPTIMIZATION: Use incremental save for normal chat (upsert new messages only)
                      // instead of delete-all + re-insert which is destructive and slow
                      // Only save the last 2 messages (user msg + AI response), not the entire history
                      const newMessages = modifiedConv.messages.slice(-2);
                      supabaseData.saveNewMessages(modifiedConv.id, newMessages)
                        .then(() => {
                          // Update conversation metadata (day, time) separately
                          return supabaseData.updateConversationMeta(modifiedConv.id, {
                            currentDay: modifiedConv.currentDay,
                            currentTimeOfDay: modifiedConv.currentTimeOfDay,
                            title: modifiedConv.title
                          });
                        })
                        .catch(err => {
                          console.error('Failed to save conversation:', err);
                        });
                    }
                    
                    // Update local state only (no full scenario save during chat)
                    if (activeData) {
                      setActiveData({ ...activeData, conversations });
                    }
                  } else if (activeData) {
                    handleSave();
                  }
                }}
                onUpdateUiSettings={(patch) => {
                  const currentSettings = activeData?.uiSettings ?? createDefaultScenarioData().uiSettings!;
                  const merged: NonNullable<ScenarioData["uiSettings"]> = {
                    ...currentSettings,
                    ...patch,
                    showBackgrounds: patch.showBackgrounds ?? currentSettings.showBackgrounds,
                    transparentBubbles: patch.transparentBubbles ?? currentSettings.transparentBubbles,
                    darkMode: patch.darkMode ?? currentSettings.darkMode,
                  };
                  handleUpdateActive({ uiSettings: merged });
                  // Persist to DB (fire-and-forget)
                  if (activeId) {
                    supabaseData.updateStoryUiSettings(activeId, merged);
                  }
                }}
                onUpdateSideCharacters={(sideCharacters) => handleUpdateActive({ sideCharacters })}
                onLoadOlderMessages={handleLoadOlderMessages}
                hasMoreMessages={!!(playingConversationId && hasMoreMessagesMap[playingConversationId])}
              />
            </React.Suspense>
          )}


          {tab === "admin" && (
            <React.Suspense fallback={<LazyTabFallback className="bg-black" />}>
              <AdminPage activeTool={adminActiveTool} onSetActiveTool={setAdminActiveTool} onRegisterGuideSave={(fn) => { guideSaveRef.current = fn; }} onRegisterGuideSyncAll={(fn) => { guideSyncAllRef.current = fn; }} onRegisterStyleGuideDownload={(fn) => { styleGuideDownloadRef.current = fn; }} onRegisterStyleGuideEdits={(fn) => { styleGuideEditsRef.current = fn; getEditsCount().then(c => setStyleGuideEditsCount(c)); }} onStyleGuideEditsCountChange={(count) => setStyleGuideEditsCount(count)} guideTheme={guideTheme} />
            </React.Suspense>
          )}

          {tab === "account" && (
            <div className="h-full overflow-y-auto bg-[#121214] p-4 sm:p-6 lg:p-10">
              <div>
                {/* Account Tab Pills */}
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]">
                    {[
                      { key: 'settings', label: 'Account Settings' },
                      { key: 'subscription', label: 'Subscription' },
                      { key: 'profile', label: 'Public Profile' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setAccountActiveTab(option.key)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border-t",
                          accountActiveTab === option.key
                            ? "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-white/20 text-white shadow-sm"
                            : "border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]"
                        )}
                      >
                        {accountActiveTab === option.key && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
                        )}
                        <span className="relative z-[1]">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {accountActiveTab === 'settings' && (
                  <React.Suspense fallback={<LazyTabFallback className="bg-[#121214]" />}>
                    <AccountSettingsTab user={user} />
                  </React.Suspense>
                )}
                {accountActiveTab === 'subscription' && (
                  <React.Suspense fallback={<LazyTabFallback className="bg-[#121214]" />}>
                    <SubscriptionTab />
                  </React.Suspense>
                )}
                {accountActiveTab === 'profile' && (
                  <React.Suspense fallback={<LazyTabFallback className="bg-[#121214]" />}>
                    <PublicProfileTab
                      user={user}
                      onRegisterSave={(saveFn) => {
                        accountProfileSaveRef.current = saveFn;
                      }}
                      onSavingStateChange={setIsAccountProfileSaving}
                      onPlayScenario={handleGalleryPlay}
                    />
                  </React.Suspense>
                )}
              </div>
            </div>
          )}
        </AppShellWorkspace>
      </main>

      {isCharacterPickerOpen && (
        <CharacterPickerWithRefresh
          library={library}
          refreshLibrary={refreshCharacterLibrary}
          onSelect={handleImportCharacter}
          onClose={closeCharacterPicker}
        />
      )}

      <BackgroundPickerModal
        isOpen={isBackgroundModalOpen}
        onClose={closeBackgroundModal}
        title="My Stories Background"
        selectedBackgroundId={selectedHubBackgroundId}
        backgrounds={hubBackgrounds}
        onSelectBackground={handleSelectBackground}
        onUpload={handleUploadBackground}
        onDelete={handleDeleteBackground}
        isUploading={isUploadingBackground}
        onOverlayChange={handleOverlayChange}
      />

      <BackgroundPickerModal
        isOpen={isImageLibraryBackgroundModalOpen}
        onClose={closeImageLibraryBackgroundModal}
        title="Image Library Background"
        selectedBackgroundId={selectedImageLibraryBackgroundId}
        backgrounds={hubBackgrounds}
        onSelectBackground={handleSelectImageLibraryBackground}
        onUpload={handleUploadBackground}
        onDelete={handleDeleteBackground}
        isUploading={isUploadingBackground}
        onOverlayChange={handleOverlayChange}
      />

      {/* Delete Confirmation Dialog - handles characters, bookmarks, and scenarios */}
      <DeleteConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={handleDeleteConfirmOpenChange}
        onConfirm={() => {
          if (!deleteConfirmId) return;
          if (deleteConfirmType === 'bookmark' || deleteConfirmType === 'scenario') {
            executeDeleteScenario(deleteConfirmId);
          } else {
            executeDeleteCharacter(deleteConfirmId);
          }
          clearDeleteConfirm();
        }}
        title={
          deleteConfirmType === 'bookmark' ? 'Remove Bookmark?' :
          deleteConfirmType === 'scenario' ? 'Delete Scenario?' :
          undefined
        }
        message={
          deleteConfirmType === 'bookmark' ? 'Remove this story from your bookmarks?' :
          deleteConfirmType === 'scenario' ? 'Delete this entire scenario? This cannot be undone.' :
          tab === "library" ? "This will permanently delete the character from your Global Library." : "This will remove the character from this scenario."
        }
      />

      {/* Remix Confirmation Dialog */}
      <DeleteConfirmDialog
        open={remixConfirmId !== null}
        onOpenChange={handleRemixConfirmOpenChange}
        onConfirm={() => {
          if (remixConfirmId) executeRemixClone(remixConfirmId);
          closeRemixConfirm();
        }}
        title="Clone Story for Editing"
        message="You are about to open another creator's story in the editor. This will clone the details of the story and create a version in 'My Stories' that you can then edit. This will not affect the original creator's uploaded story."
      />

      {/* AI Prompt Modal */}
      <AIPromptModal
        isOpen={aiPromptModal !== null}
        onClose={closeAiPromptModal}
        onSubmit={handleAIPromptSubmit}
        mode={aiPromptModal?.mode || 'fill'}
        isProcessing={isAiFilling || isAiGenerating}
      />

      {/* DraftsModal removed - drafts are now DB-backed and shown in the hub */}

      <StoryExportFormatModal
        open={storyExportModalOpen}
        onClose={closeStoryExportModal}
        onSelect={handleExportStoryTransfer}
      />

      <StoryImportModeModal
        open={storyImportModalOpen}
        onClose={closeStoryImportModal}
        onSelect={handleSelectStoryImportMode}
      />

      <GalleryNsfwAgeModal
        open={galleryNsfwConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeGalleryNsfwConfirm();
          }
        }}
        onConfirm={confirmGalleryShowNsfw}
      />

      <AuthModal open={authModalOpen} onClose={closeAuthModal} />
      <input
        ref={storyTransferFileRef}
        type="file"
        accept=".txt,.md,.markdown,.json,.chronicle,.doc,.docx,.rtf,.html,.htm"
        className="hidden"
        onChange={handleImportStoryTransferFile}
      />

      </div>
    </TooltipProvider>
  );
};

const Index = () => (
  <ModelSettingsProvider>
    <IndexContent />
  </ModelSettingsProvider>
);

export default Index;
