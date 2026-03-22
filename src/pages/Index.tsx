
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScenarioData, TabKey, Character, ScenarioMetadata, Conversation, Message, ConversationMetadata, SideCharacter, UserBackground, ContentThemes, defaultContentThemes } from "@/types";

import { fetchSavedScenarios, SavedScenario, unsaveScenario, fetchUserPublishedScenarios, PublishedScenario } from "@/services/gallery-data";
import { createDefaultScenarioData, now, uid, uuid, truncateLine, resizeImage } from "@/utils";
import { CharacterBuilderScreen as CharactersTab } from "@/features/character-builder/CharacterBuilderScreen";
import { StoryBuilderScreen as WorldTab } from "@/features/story-builder/StoryBuilderScreen";
import { ConversationsTab } from "@/components/chronicle/ConversationsTab";
import { useModelSettings, ModelSettingsProvider } from "@/contexts/ModelSettingsContext";
import { checkIsAdmin } from "@/services/app-settings";
import { AdminPage } from "@/pages/Admin";
import { AccountSettingsTab } from "@/components/account/AccountSettingsTab";
import { SubscriptionTab } from "@/components/account/SubscriptionTab";
import { PublicProfileTab } from "@/components/account/PublicProfileTab";

import { ScenarioHub } from "@/components/chronicle/StoryHub";
import { ModelSettingsTab } from "@/components/chronicle/ModelSettingsTab";
import { ChatInterfaceTab } from "@/components/chronicle/ChatInterfaceTab";
import { ImageLibraryTab } from "@/components/chronicle/ImageLibraryTab";
import { GalleryHub } from "@/components/chronicle/GalleryHub";
import { Button } from "@/components/chronicle/UI";
import { aiFillCharacter, aiGenerateCharacter } from "@/services/character-ai";
import { CharacterPicker, CharacterPickerWithRefresh } from "@/components/chronicle/CharacterPicker";
import { BackgroundPickerModal } from "@/components/chronicle/BackgroundPickerModal";
import { useAuth } from "@/hooks/use-auth";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelLeftClose, PanelLeft, Settings, Image as ImageIcon, Sparkles, ArrowLeft, UserCircle, Sun, Moon, Download, Upload, Pencil, LogIn, LogOut, ChevronDown } from "lucide-react";
import { AIPromptModal } from "@/components/chronicle/AIPromptModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import * as supabaseData from "@/services/supabase-data";
import { DeleteConfirmDialog } from "@/components/chronicle/DeleteConfirmDialog";
import { ChangeNameModal } from "@/components/chronicle/ChangeNameModal";

import { getEditsCount } from "@/components/admin/styleguide/StyleGuideEditsModal";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  exportScenarioToJson,
  exportScenarioToText,
  exportScenarioToWordDocument,
  importScenarioFromAny,
  StoryImportMode,
} from "@/lib/story-transfer";
import { hasPublishErrors, validateForPublish } from "@/utils/publish-validation";
import { StoryExportFormatModal, StoryExportFormat } from "@/components/chronicle/StoryExportFormatModal";
import { StoryImportModeModal } from "@/components/chronicle/StoryImportModeModal";
import { normalizeBuilderTab, toLegacyBuilderTab } from "@/features/navigation/builder-tabs";
const IconsList = {
  Gallery: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Hub: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Characters: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  World: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Chat: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  System: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="7" x2="7.01" y1="15" y2="15"/><line x1="12" x2="12.01" y1="15" y2="15"/></svg>,
  Model: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10"/><path d="M18.4 4.6a10 10 0 1 1-12.8 0"/></svg>,
  Builder: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Library: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>,
  ImageLibrary: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  ChatInterface: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
};

function SidebarItem({ 
  active, 
  label, 
  onClick, 
  icon, 
  subtitle, 
  className = "",
  collapsed = false 
}: { 
  active: boolean; 
  label: string; 
  onClick: () => void; 
  icon: React.ReactNode; 
  subtitle?: string; 
  className?: string;
  collapsed?: boolean;
}) {
  const activeClasses = active 
    ? "bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 shadow-lg shadow-black/40 text-white"
    : "text-slate-400 hover:bg-ghost-white hover:text-white hover:shadow-md hover:shadow-black/20";
  
  const content = (
    <button 
      type="button" 
      onClick={onClick} 
      className={`relative overflow-hidden w-full flex flex-col rounded-xl transition-all duration-200 font-bold text-sm mb-1 cursor-pointer group border border-transparent ${activeClasses} ${className} ${collapsed ? 'px-3 py-3 items-center justify-center' : 'px-4 py-3'}`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }} />
      )}
      <div className={`relative z-[1] flex items-center ${collapsed ? 'justify-center' : 'gap-3 w-full'}`}>
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
      {!collapsed && subtitle && (
        <div className={`relative z-[1] text-[10px] font-black tracking-wide uppercase mt-1 ml-8 text-left transition-colors duration-200 truncate ${active ? "text-blue-200 opacity-100" : "text-slate-600 opacity-70 group-hover:text-slate-400"}`}>
          {subtitle}
        </div>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-semibold">
          {label}
          {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

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
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);
  const [conversationRegistry, setConversationRegistry] = useState<ConversationMetadata[]>([]);
  // Removed: selectedConversationEntry state - sessions now open directly
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
  const [storyNameError, setStoryNameError] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  // Track which conversations have more older messages to load
  const [hasMoreMessagesMap, setHasMoreMessagesMap] = useState<Record<string, boolean>>({});
  const [aiPromptModal, setAiPromptModal] = useState<{ mode: 'fill' | 'generate' } | null>(null);
  // Track characters saved to library (by their ID). Value is the library character's ID (string) or true for library-originating characters.
  const [characterInLibrary, setCharacterInLibrary] = useState<Record<string, string | boolean>>({});
  // Track newly created characters in library that haven't been saved yet
  const [unsavedNewCharacterIds, setUnsavedNewCharacterIds] = useState<Set<string>>(new Set());
  // Search query for library tab
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
   const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('chronicle_sidebar_collapsed') === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'character' | 'bookmark' | 'scenario'>('character');
  
  // Conversations tab modal state
  const [convDeleteTarget, setConvDeleteTarget] = useState<{ scenarioId: string; conversationId: string } | null>(null);
  const [convDeleteAllOpen, setConvDeleteAllOpen] = useState(false);
  
  
  // Delayed resume overlay
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResumingOverlay, setShowResumingOverlay] = useState(false);
  const [remixConfirmId, setRemixConfirmId] = useState<string | null>(null);
  const [isInImageFolder, setIsInImageFolder] = useState(false);
  const imageLibraryExitFolderRef = React.useRef<(() => void) | null>(null);
  const [imageLibrarySearchQuery, setImageLibrarySearchQuery] = useState('');
  const [adminActiveTool, setAdminActiveTool] = useState<string>('hub');
  const [isAdminState, setIsAdminState] = useState(false);
  const [navButtonImages, setNavButtonImages] = useState<Record<string, any>>({});
  const [guideTheme, setGuideTheme] = useState<'dark' | 'light'>('dark');
  const guideSaveRef = React.useRef<(() => Promise<void>) | null>(null);
  const guideSyncAllRef = React.useRef<(() => Promise<void>) | null>(null);
  const styleGuideDownloadRef = React.useRef<(() => void) | null>(null);
  const styleGuideEditsRef = React.useRef<(() => void) | null>(null);
  const [styleGuideEditsCount, setStyleGuideEditsCount] = useState(0);
  const imageLibraryUploadRef = React.useRef<(() => void) | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const storyTransferFileRef = React.useRef<HTMLInputElement | null>(null);
  const [storyExportModalOpen, setStoryExportModalOpen] = useState(false);
  const [storyImportModalOpen, setStoryImportModalOpen] = useState(false);
  const [storyImportMode, setStoryImportMode] = useState<StoryImportMode>('merge');
  const [storyTransferNotice, setStoryTransferNotice] = useState<{
    tone: "success" | "error" | "info";
    text: string;
  } | null>(null);
  // Read URL query params for deep-linking (e.g. /?tab=admin&adminTool=app_guide)
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const qTab = searchParams.get('tab');
    const qTool = searchParams.get('adminTool');
    if (qTab) {
      const normalizedTab = toLegacyBuilderTab(normalizeBuilderTab(qTab));
      setTab(normalizedTab as TabKey);
      if (normalizedTab === 'admin' && qTool) {
        setAdminActiveTool(qTool);
      }
      // Clear params after applying so they don't persist on further nav
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!storyTransferNotice) return;
    const t = setTimeout(() => setStoryTransferNotice(null), 4000);
    return () => clearTimeout(t);
  }, [storyTransferNotice]);
  // Pagination state
  const SCENARIO_PAGE_SIZE = 50;
  const [hasMoreScenarios, setHasMoreScenarios] = useState(true);
  const [isLoadingMoreScenarios, setIsLoadingMoreScenarios] = useState(false);

  // Hub background state
  const [hubBackgrounds, setHubBackgrounds] = useState<UserBackground[]>([]);
  const [selectedHubBackgroundId, setSelectedHubBackgroundId] = useState<string | null>(null);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  // Image Library background state (separate selection, shared pool)
  const [selectedImageLibraryBackgroundId, setSelectedImageLibraryBackgroundId] = useState<string | null>(null);
  const [isImageLibraryBackgroundModalOpen, setIsImageLibraryBackgroundModalOpen] = useState(false);

  // Hub filter state for "Your Stories" tab
  type HubFilter = "my" | "bookmarked" | "published" | "drafts" | "all";
  const [hubFilter, setHubFilter] = useState<HubFilter>("all");

  // Gallery sort state (lifted from GalleryHub)
  type GallerySortOption = 'all' | 'recent' | 'liked' | 'saved' | 'played' | 'following';
  const [gallerySortBy, setGallerySortBy] = useState<GallerySortOption>('all');
  const [accountActiveTab, setAccountActiveTab] = useState<string>('settings');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [publishedScenariosData, setPublishedScenariosData] = useState<Map<string, PublishedScenario>>(new Map());
  const [contentThemesMap, setContentThemesMap] = useState<Map<string, ContentThemes>>(new Map());
  const [userProfile, setUserProfile] = useState<{ username: string | null; display_name: string | null; avatar_url: string | null } | null>(null);

  // Derive publishedScenarioIds from publishedScenariosData
  const publishedScenarioIds = useMemo(() => {
    return new Set(publishedScenariosData.keys());
  }, [publishedScenariosData]);

  useEffect(() => {
    localStorage.setItem('chronicle_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Auto-collapse sidebar on tablet-sized viewports
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1024px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarCollapsed(true);
    };
    onChange(mql);
    mql.addEventListener('change', onChange as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener('change', onChange as (e: MediaQueryListEvent) => void);
  }, []);

  // Guest users: redirect to gallery if they try to access protected tabs
  useEffect(() => {
    if (!authLoading && !isAuthenticated && tab !== "gallery") {
      setTab("gallery");
    }
  }, [authLoading, isAuthenticated, tab]);

  // Handle ?auth=1 query param — open auth modal and clean URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === '1') {
      setAuthModalOpen(true);
      params.delete('auth');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    if (user?.id) checkIsAdmin(user.id).then(setIsAdminState);
  }, [user?.id]);

  // Preload nav button images at app startup so they're ready before tab renders
  useEffect(() => {
    supabaseData.loadNavButtonImages().then((images) => {
      setNavButtonImages((images || {}) as Record<string, any>);
    }).catch(() => {});
  }, []);

  // (Draft count refresh removed - drafts are now DB-backed and shown in the hub)

  // Track whether conversation previews have been enriched
  const [conversationsEnriched, setConversationsEnriched] = useState(false);

  // Wrap each promise with a timeout so one slow request can't block the whole app
  function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T, label: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((resolve) => {
        setTimeout(() => {
          console.warn(`[withTimeout] ${label} timed out after ${ms}ms, using fallback`);
          resolve(fallback);
        }, ms);
      })
    ]);
  }

  // Load data from Supabase when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const currentUser = user;

    async function loadData() {
      setIsLoading(true);
      try {
        const [scenarios, characters, conversations, backgrounds, imageLibraryBgId, savedScens, publishedData, profile] = await Promise.all([
          withTimeout(supabaseData.fetchMyScenariosPaginated(currentUser.id, SCENARIO_PAGE_SIZE, 0), 15000, [], 'fetchMyScenariosPaginated'),
          withTimeout(supabaseData.fetchCharacterLibrary(), 15000, [], 'fetchCharacterLibrary'),
          withTimeout(supabaseData.fetchConversationRegistry(), 15000, [], 'fetchConversationRegistry'),
          withTimeout(supabaseData.fetchUserBackgrounds(currentUser.id), 15000, [], 'fetchUserBackgrounds'),
          withTimeout(supabaseData.getImageLibraryBackground(currentUser.id), 15000, null, 'getImageLibraryBackground'),
          withTimeout(fetchSavedScenarios(currentUser.id), 15000, [], 'fetchSavedScenarios'),
          withTimeout(fetchUserPublishedScenarios(currentUser.id), 15000, new Map(), 'fetchUserPublishedScenarios'),
          withTimeout(supabaseData.fetchUserProfile(currentUser.id), 15000, null, 'fetchUserProfile')
        ]);
        setRegistry(scenarios);
        setHasMoreScenarios(scenarios.length >= SCENARIO_PAGE_SIZE);
        setLibrary(characters);
        setConversationRegistry(conversations);
        setConversationsEnriched(false);
        setHubBackgrounds(backgrounds);
        setSavedScenarios(savedScens);
        setPublishedScenariosData(publishedData);
        setUserProfile(profile);
        
        // Fetch content themes for all user scenarios + bookmarked scenarios
        const ownedIds = scenarios.map(s => s.id);
        const bookmarkedIds = savedScens
          .filter(s => s.published_scenario?.scenario && !ownedIds.includes(s.source_scenario_id))
          .map(s => s.source_scenario_id);
        const allThemeIds = [...ownedIds, ...bookmarkedIds];
        
        if (allThemeIds.length > 0) {
          const themesMap = await supabaseData.fetchContentThemesForScenarios(allThemeIds);
          setContentThemesMap(themesMap);
        }
        
        // Set the selected background if one is marked as selected (Hub)
        const selectedBg = backgrounds.find(bg => bg.isSelected);
        if (selectedBg) {
          setSelectedHubBackgroundId(selectedBg.id);
        }
        
        // Set the selected background for Image Library
        if (imageLibraryBgId) {
          setSelectedImageLibraryBackgroundId(imageLibraryBgId);
        }
      } catch (e: any) {
        console.error("Failed to load data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isAuthenticated, user]);

  // Lazy-load conversation message previews when the Conversations tab is viewed
  // Re-enrich when registry changes (e.g. new conversations created) by tracking registry length
  const registryLengthRef = React.useRef(conversationRegistry.length);
  useEffect(() => {
    if (tab !== "conversations" || conversationRegistry.length === 0) return;
    // Re-enrich if registry size changed (new conversations added) or never enriched
    if (conversationsEnriched && registryLengthRef.current === conversationRegistry.length) return;
    registryLengthRef.current = conversationRegistry.length;
    setConversationsEnriched(true);
    supabaseData.enrichConversationRegistry(conversationRegistry).then(enriched => {
      setConversationRegistry(enriched);
    }).catch(err => {
      console.warn('[enrichConversationRegistry] Failed:', err);
    });
  }, [tab, conversationsEnriched, conversationRegistry]);

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

  const isValidUuid = useCallback(
    (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s),
    [],
  );

  const migrateScenarioDataIds = useCallback(
    (data: ScenarioData) => {
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

      const nextCharacters = data.characters.map((c) => {
        const nextId = mapId(c.id, characterIdMap);
        return nextId === c.id ? c : { ...c, id: nextId };
      });

      const nextEntries = data.world.entries.map((e) => {
        const nextId = mapId(e.id, codexEntryIdMap);
        return nextId === e.id ? e : { ...e, id: nextId };
      });

      const nextScenes = data.scenes.map((s) => {
        const nextId = mapId(s.id, sceneIdMap);
        return nextId === s.id ? s : { ...s, id: nextId };
      });

      const nextConversations = data.conversations.map((c) => {
        const nextConvId = mapId(c.id, conversationIdMap);
        const nextMsgs = c.messages.map((m) => {
          const nextMsgId = mapId(m.id, messageIdMap);
          return nextMsgId === m.id ? m : { ...m, id: nextMsgId };
        });
        return {
          ...c,
          id: nextConvId,
          messages: nextMsgs,
        };
      });

      const nextData: ScenarioData = {
        ...data,
        characters: nextCharacters,
        world: { ...data.world, entries: nextEntries },
        scenes: nextScenes,
        conversations: nextConversations,
      };

      return {
        didMigrate,
        data: nextData,
        characterIdMap,
        conversationIdMap,
      };
    },
    [isValidUuid],
  );

  const handleSignOut = async () => {
    await signOut();
    setTab("gallery");
  };

  const requireAuth = useCallback((action: () => void) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    action();
  }, [isAuthenticated]);

  // Hub Background Handlers
  const handleUploadBackground = async (file: File) => {
    if (!user) return;
    setIsUploadingBackground(true);
    try {
      // Read file and compress
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const optimized = await resizeImage(dataUrl, 1920, 1080, 0.8);
          const blob = supabaseData.dataUrlToBlob(optimized);
          if (!blob) throw new Error('Failed to process image');
          
          const filename = `bg-${uuid()}-${Date.now()}.jpg`;
          const publicUrl = await supabaseData.uploadBackgroundImage(user.id, blob, filename);
          const newBg = await supabaseData.createUserBackground(user.id, publicUrl);
          
          setHubBackgrounds(prev => [newBg, ...prev]);
        } catch (e: any) {
          console.error("Upload failed:", e.message);
        } finally {
          setIsUploadingBackground(false);
        }
      };
      reader.onerror = () => {
        console.error("Failed to read file");
        setIsUploadingBackground(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      console.error("Upload failed:", e.message);
      setIsUploadingBackground(false);
    }
  };

  const handleSelectBackground = async (id: string | null) => {
    if (!user) return;
    try {
      await supabaseData.setSelectedBackground(user.id, id);
      setSelectedHubBackgroundId(id);
      setHubBackgrounds(prev => prev.map(bg => ({
        ...bg,
        isSelected: bg.id === id
      })));
    } catch (e: any) {
      console.error("Failed to set background:", e.message);
    }
  };

  const handleDeleteBackground = async (id: string, imageUrl: string) => {
    if (!user) return;
    try {
      await supabaseData.deleteUserBackground(user.id, id, imageUrl);
      setHubBackgrounds(prev => prev.filter(bg => bg.id !== id));
      if (selectedHubBackgroundId === id) {
        setSelectedHubBackgroundId(null);
      }
    } catch (e: any) {
      console.error("Failed to delete background:", e.message);
    }
  };

  // Get the selected background URL for hub
  const selectedBackgroundUrl = selectedHubBackgroundId 
    ? hubBackgrounds.find(bg => bg.id === selectedHubBackgroundId)?.imageUrl 
    : null;

  // Get the selected background URL for Image Library
  const selectedImageLibraryBackgroundUrl = selectedImageLibraryBackgroundId
    ? hubBackgrounds.find(bg => bg.id === selectedImageLibraryBackgroundId)?.imageUrl
    : null;

  // Handler for Image Library background selection (persisted to DB)
  const handleSelectImageLibraryBackground = async (id: string | null) => {
    if (!user) return;
    try {
      await supabaseData.setImageLibraryBackground(user.id, id);
      setSelectedImageLibraryBackgroundId(id);
    } catch (e: any) {
      console.error("Failed to set background:", e.message);
    }
  };

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

  // Handler for overlay changes
  const handleOverlayChange = async (bgId: string, color: string, opacity: number) => {
    if (!user) return;
    setHubBackgrounds(prev => prev.map(bg => bg.id === bgId ? { ...bg, overlayColor: color, overlayOpacity: opacity } : bg));
    try {
      await supabaseData.updateBackgroundOverlay(user.id, bgId, color, opacity);
    } catch (e: any) {
      console.error("Failed to update overlay:", e.message);
    }
  };

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
  const handleGalleryPlay = useCallback((scenarioId: string, publishedScenarioId: string) => {
    // For now, just play the scenario normally
    // In the future, this could handle special gallery-specific logic
    handlePlayScenario(scenarioId);
  }, []);

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

  async function handlePlayScenario(id: string) {
    if (!user) return;
    
    // OPTIMIZATION: Immediately switch to chat tab and show loading state
    // This gives instant visual feedback while data loads in background
    setActiveId(id);
    setPlayingConversationId("loading"); // Special loading flag
    setTab("chat_interface");
    setSelectedCharacterId(null);
    
    try {
      // Use optimized fetch that skips loading all existing conversation messages
      const result = await supabaseData.fetchScenarioForPlay(id);
      if (!result) {
        console.error("Scenario not found");
        setTab("hub");
        setPlayingConversationId(null);
        return;
      }
      const { data, coverImage, coverImagePosition, conversationCount } = result;
      
      // Set cover image from fetched result
      setActiveCoverImage(coverImage);
      setActiveCoverPosition(coverImagePosition);
      
      // Load content themes for LLM injection
      try {
        const themes = await supabaseData.fetchContentThemes(id);
        data.contentThemes = themes;
      } catch (e) {
        console.warn('[handlePlayScenario] Failed to load content themes:', e);
      }
      
      // Get starting day/time from scenario's opening dialog
      const startingDay = data.story?.openingDialog?.startingDay || 1;
      const startingTimeOfDay = data.story?.openingDialog?.startingTimeOfDay || 'day';
      
      const initialMessages: Message[] = [];
      const openingText = data.story?.openingDialog?.text?.trim();
      if (openingText) {
        initialMessages.push({
          id: uuid(),
          role: "assistant",
          text: openingText,
          day: startingDay,
          timeOfDay: startingTimeOfDay,
          createdAt: now()
        });
      }

      // Get time progression defaults from scenario
      const timeProgressionMode = data.story?.openingDialog?.timeProgressionMode || 'manual';
      const timeProgressionInterval = data.story?.openingDialog?.timeProgressionInterval || 15;

      const newConv: Conversation = { 
        id: uuid(),
        title: `Story Session ${conversationCount + 1}`, 
        messages: initialMessages, 
        currentDay: startingDay,
        currentTimeOfDay: startingTimeOfDay,
        timeProgressionMode,
        timeProgressionInterval,
        createdAt: now(), 
        updatedAt: now() 
      };

      data.conversations = [newConv];
      
      // Save to Supabase (in background, don't block UI)
      supabaseData.saveConversation(newConv, id, user.id).catch(err => {
        console.error('Failed to save conversation:', err);
      });
      
      // OPTIMIZATION: Update conversation registry optimistically instead of refetching
      const scenarioMeta = registry.find(r => r.id === id);
      setConversationRegistry(prev => [{
        conversationId: newConv.id,
        scenarioId: id,
        scenarioTitle: scenarioMeta?.title || 'Story',
        scenarioImageUrl: coverImage || null,
        conversationTitle: newConv.title,
        lastMessage: openingText || '',
        messageCount: initialMessages.length,
        createdAt: newConv.createdAt,
        updatedAt: newConv.updatedAt,
        creatorName: null
      }, ...prev]);
      
      setActiveData(data);
      setPlayingConversationId(newConv.id);
    } catch (e: any) {
      console.error("Failed to play scenario:", e.message);
      setTab("hub");
      setPlayingConversationId(null);
    }
  }

  async function handleEditScenario(id: string) {
    try {
      const result = await supabaseData.fetchScenarioById(id);
      if (!result) {
        console.error("Scenario not found");
        return;
      }
      const { data, coverImage, coverImagePosition } = result;
      
      // Check if this is someone else's scenario (bookmarked/remixable)
      const ownerId = await supabaseData.getScenarioOwner(id);
      const isOwnScenario = ownerId === user?.id;
      
      if (!isOwnScenario && user) {
        // Show remix confirmation dialog instead of silently cloning
        setRemixConfirmId(id);
        return;
      }
      
      // Own scenario - edit directly
      // Determine best data source: backend vs local safety snapshot
      let finalData = data;
      let finalCoverImage = coverImage;
      let finalCoverPosition = coverImagePosition;
      let finalContentThemes = defaultContentThemes;
      
      try {
        const draftRaw = localStorage.getItem(`draft_${id}`);
        if (draftRaw) {
          const draft = JSON.parse(draftRaw);
          if (draft.data && draft.savedAt) {
            // Compare: use local snapshot only if backend data is empty/missing characters
            // but local snapshot has them (recovery case)
            const backendHasChars = data.characters.length > 0;
            const localHasChars = (draft.data.characters?.length ?? 0) > 0;
            
            if (!backendHasChars && localHasChars) {
              // Backend is empty but local has data — restore from snapshot
              console.log('[handleEditScenario] Backend empty, restoring from local snapshot');
              finalData = draft.data;
              finalCoverImage = draft.coverImage ?? coverImage;
              finalCoverPosition = draft.coverPosition ?? coverImagePosition;
              finalContentThemes = draft.contentThemes ?? defaultContentThemes;
              
              // Auto-repair: persist recovered data back to backend
              if (user) {
                const derivedTitle = finalData.world.core.scenarioName || 'Untitled';
                supabaseData.saveScenarioWithVerification(id, finalData, {
                  title: derivedTitle,
                  description: finalData.world.core.briefDescription || '',
                  coverImage: finalCoverImage,
                  coverImagePosition: finalCoverPosition,
                  tags: ['Custom'],
                }, user.id, { isDraft: true }).then(ok => {
                  if (ok) {
                    try { localStorage.removeItem(`draft_${id}`); } catch (_) {}
                    console.log('[handleEditScenario] Auto-repair succeeded');
                  }
                }).catch(e => console.warn('[handleEditScenario] Auto-repair failed:', e));
              }
            } else if (backendHasChars) {
              // Backend has data — prefer it, discard local snapshot
              try { localStorage.removeItem(`draft_${id}`); } catch (_) {}
            }
          } else {
            // Legacy format: draft is the ScenarioData directly
            const legacyHasChars = (draft.characters?.length ?? 0) > 0;
            if (data.characters.length === 0 && legacyHasChars) {
              finalData = draft;
            }
            try { localStorage.removeItem(`draft_${id}`); } catch (_) {}
          }
        }
      } catch (e) {
        console.warn('Could not restore draft:', e);
      }
      
      setActiveId(id);
      setActiveData(finalData);
      setActiveCoverImage(finalCoverImage);
      setActiveCoverPosition(finalCoverPosition);
      
      // Load content themes for this scenario (use draft if available, otherwise fetch)
      if (finalContentThemes !== defaultContentThemes) {
        setActiveContentThemes(finalContentThemes);
      } else {
        try {
          const themes = await supabaseData.fetchContentThemes(id);
          setActiveContentThemes(themes);
        } catch (e) {
          console.error('Failed to load content themes:', e);
          setActiveContentThemes(defaultContentThemes);
        }
      }
      
      setTab("world"); 
      setSelectedCharacterId(null);
      setPlayingConversationId(null);
    } catch (e: any) {
      console.error("Failed to edit scenario:", e.message);
    }
  }

  // Execute the remix clone after user confirms
  async function executeRemixClone(id: string) {
    if (!user) return;
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
        user.id,
        data,
        coverImage,
        coverImagePosition
      );
      
      // Track the remix for attribution
      const savedScenario = savedScenarios.find(s => s.source_scenario_id === id);
      if (savedScenario?.published_scenario_id) {
        await supabaseData.trackRemix(savedScenario.published_scenario_id, newScenarioId, user.id);
      }
      
      // Refresh registry to show the new clone
      const updatedRegistry = await supabaseData.fetchMyScenarios(user.id);
      setRegistry(updatedRegistry);
      
      setActiveId(newScenarioId);
      setActiveData(clonedData);
      setActiveCoverImage(coverImage);
      setActiveCoverPosition(coverImagePosition);
      setActiveContentThemes(defaultContentThemes);


      setTab("world"); 
      setSelectedCharacterId(null);
      setPlayingConversationId(null);
    } catch (e: any) {
      console.error("Failed to clone scenario:", e.message);
    }
  }

  function handleCreateNewScenario() {
    const id = uuid();
    const data = createDefaultScenarioData();
    
    // Check for a local draft
    try {
      const draftRaw = localStorage.getItem(`draft_${id}`);
      if (draftRaw) {
        // Very unlikely for a brand new UUID, but handle it
        localStorage.removeItem(`draft_${id}`);
      }
    } catch (e) { /* ignore */ }
    
    setActiveId(id);
    setActiveData(data);
    setActiveCoverImage("");
    setActiveCoverPosition({ x: 50, y: 50 });
    setActiveContentThemes(defaultContentThemes);
    setTab("world"); 
    setSelectedCharacterId(null);
    setPlayingConversationId(null);
  }



  const handleSaveWithData = useCallback(async (dataOverride: ScenarioData | null, navigateToHub: boolean = false): Promise<boolean> => {
    const dataToUse = dataOverride || activeData;
    if (!activeId || !dataToUse || !user) {
      console.error("No active scenario found to save.");
      return false;
    }

    // Migrate legacy (non-UUID) IDs in-memory so saves work with the backend UUID schema.
    let scenarioIdToSave = activeId;
    let didMigrateScenarioId = false;

    if (!isValidUuid(activeId)) {
      scenarioIdToSave = uuid();
      didMigrateScenarioId = true;
      setActiveId(scenarioIdToSave);
    }

    const migrated = migrateScenarioDataIds(dataToUse);
    const dataToSave = migrated.didMigrate ? migrated.data : dataToUse;

    if (migrated.didMigrate) {
      setActiveData(migrated.data);
      setSelectedCharacterId((prev) => {
        if (!prev) return prev;
        return migrated.characterIdMap.get(prev) || prev;
      });
      setPlayingConversationId((prev) => {
        if (!prev) return prev;
        return migrated.conversationIdMap.get(prev) || prev;
      });
    }

    if (didMigrateScenarioId || migrated.didMigrate) {
      console.log("Migrated legacy IDs - saving as new scenario compatible with backend");
    }
    
    // Validate story name is required
    if (!dataToSave.world.core.scenarioName?.trim()) {
      setStoryNameError(true);
      setTab("world");
      return false;
    }
    setStoryNameError(false);

    try {
      const derivedTitle = dataToSave.world.core.scenarioName || "New Story";

      const metadata = {
        title: derivedTitle,
        description: dataToSave.world.core.briefDescription || 
                     truncateLine(dataToSave.world.core.storyPremise || "Created via Builder", 120),
        coverImage: activeCoverImage,
        coverImagePosition: activeCoverPosition,
        tags: ["Custom"]
      };

      await supabaseData.saveScenarioWithVerification(scenarioIdToSave, dataToSave, metadata, user.id);
      
      // Fire-and-forget registry refreshes — save already succeeded, no need to block UI
      supabaseData.fetchMyScenarios(user.id)
        .then(r => setRegistry(r))
        .catch(e => console.warn('Registry refresh failed:', e));
      supabaseData.fetchConversationRegistry()
        .then(r => setConversationRegistry(r))
        .catch(e => console.warn('Conversation registry refresh failed:', e));
      
      // Removed: selectedConversationEntry sync - no longer needed
      
      // Character library sync removed — characters are only added to library
      // via the explicit "Add to Character Library" button (handleSaveToLibrary)

      

      if (navigateToHub) {
        setActiveId(null);
        setActiveData(null);
        setSelectedCharacterId(null);
        setTab("hub");
      }
      // Clear any leftover localStorage drafts on successful DB save
      try { localStorage.removeItem(`draft_${scenarioIdToSave}`); } catch (_) { /* ignore */ }

      return true;
    } catch (e: any) {
      console.error("Save failed:", e);
      return false;
    } finally {
    }
  }, [activeId, activeData, activeCoverImage, activeCoverPosition, user, isValidUuid, migrateScenarioDataIds, library]);

  // Wrapper for backward compatibility - uses current activeData
  const handleSave = useCallback(async (navigateToHub: boolean = false): Promise<boolean> => {
    return handleSaveWithData(null, navigateToHub);
  }, [handleSaveWithData]);

  // Refresh library from backend and update state
  const refreshCharacterLibrary = useCallback(async () => {
    const updated = await supabaseData.fetchCharacterLibrary();
    setLibrary(updated);
    return updated;
  }, []);

  const toTransferBaseName = useCallback((scenarioName?: string) => {
    const base = (scenarioName || "chronicle-story")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const date = new Date().toISOString().slice(0, 10);
    return `${base || "chronicle-story"}-${date}`;
  }, []);

  const downloadTransferFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportStoryTransfer = useCallback((format: StoryExportFormat) => {
    if (!activeData) return;
    try {
      const baseName = toTransferBaseName(activeData.world.core.scenarioName);
      if (format === "markdown") {
        downloadTransferFile(
          exportScenarioToText(activeData),
          `${baseName}.chronicle.md`,
          "text/markdown;charset=utf-8"
        );
      } else if (format === "json") {
        downloadTransferFile(
          exportScenarioToJson(activeData),
          `${baseName}.chronicle.json`,
          "application/json;charset=utf-8"
        );
      } else {
        downloadTransferFile(
          exportScenarioToWordDocument(activeData),
          `${baseName}.chronicle.rtf`,
          "text/rtf;charset=utf-8"
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
  }, [activeData, downloadTransferFile, toTransferBaseName]);

  const handleOpenStoryExport = useCallback(() => {
    if (!activeData) return;
    setStoryExportModalOpen(true);
  }, [activeData]);

  const handleOpenStoryImport = useCallback(() => {
    if (!activeData) return;
    setStoryImportModalOpen(true);
  }, [activeData]);

  const handleSelectStoryImportMode = useCallback((mode: StoryImportMode) => {
    setStoryImportMode(mode);
    storyTransferFileRef.current?.click();
  }, []);

  const handleImportStoryTransferFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeData) return;

    try {
      const text = await file.text();
      const result = importScenarioFromAny(
        { text, fileName: file.name, mimeType: file.type },
        activeData,
        storyImportMode
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

      const warningsCount = result.warnings.length;
      setStoryTransferNotice({
        tone: warningsCount > 0 ? "info" : "success",
        text: `Import ${storyImportMode}: ${summaryParts.join(", ")}.${warningsCount > 0 ? ` ${warningsCount} warning${warningsCount === 1 ? "" : "s"}.` : ""}`,
      });
    } catch (error) {
      console.error("Story import failed:", error);
      setStoryTransferNotice({
        tone: "error",
        text: "Import failed. Try JSON, Markdown/TXT, HTML/DOC, or DOCX again.",
      });
    }
  }, [activeData, storyImportMode]);

  // Navigation handler - stashes draft to localStorage as safety net, no DB save
  const handleNavigateAway = useCallback(async (targetTab: TabKey | "library") => {
    if (activeId && activeData) {
      try {
        localStorage.setItem(`draft_${activeId}`, JSON.stringify({
          data: activeData,
          coverImage: activeCoverImage,
          coverPosition: activeCoverPosition,
          contentThemes: activeContentThemes,
          savedAt: Date.now(),
        }));
      } catch (e) {
        console.warn("Could not stash draft to localStorage:", e);
      }
    }

    setActiveId(null);
    setActiveData(null);
    setSelectedCharacterId(null);
    setPlayingConversationId(null);
    setTab(targetTab);

    // Auto-refresh library when navigating to library tab
    if (targetTab === "library") {
      refreshCharacterLibrary().catch(e => console.warn("Library refresh failed:", e));
    }
  }, [activeId, activeData, activeCoverImage, activeCoverPosition, activeContentThemes, refreshCharacterLibrary]);

  // Silently persist the current draft to the database (fire-and-forget safe)
  async function saveDraftInBackground() {
    try {
      if (!activeId || !activeData || !user) return;

      let scenarioIdToSave = activeId;
      if (!isValidUuid(activeId)) {
        scenarioIdToSave = uuid();
        setActiveId(scenarioIdToSave);
      }

      const migrated = migrateScenarioDataIds(activeData);
      const dataToSave = migrated.didMigrate ? migrated.data : activeData;

      if (migrated.didMigrate) {
        setActiveData(migrated.data);
        setSelectedCharacterId((prev) => {
          if (!prev) return prev;
          return migrated.characterIdMap.get(prev) || prev;
        });
        setPlayingConversationId((prev) => {
          if (!prev) return prev;
          return migrated.conversationIdMap.get(prev) || prev;
        });
      }

      const derivedTitle = dataToSave.world.core.scenarioName || 'Untitled';
      const metadata = {
        title: derivedTitle,
        description: dataToSave.world.core.briefDescription ||
                     truncateLine(dataToSave.world.core.storyPremise || 'Created via Builder', 120),
        coverImage: activeCoverImage,
        coverImagePosition: activeCoverPosition,
        tags: ['Custom']
      };

      // Write local safety snapshot before remote save
      try {
        localStorage.setItem(`draft_${scenarioIdToSave}`, JSON.stringify({
          data: dataToSave,
          coverImage: activeCoverImage,
          coverPosition: activeCoverPosition,
          contentThemes: activeContentThemes,
          savedAt: Date.now(),
        }));
      } catch (_) { /* quota exceeded — non-fatal */ }

      const verified = await supabaseData.saveScenarioWithVerification(scenarioIdToSave, dataToSave, metadata, user.id, { isDraft: true });

      if (verified) {
        try { localStorage.removeItem(`draft_${scenarioIdToSave}`); } catch (_) {}
      } else {
        console.warn('Draft saved but child-data verification failed; local snapshot kept as backup.');
      }

      // Refresh registry so hub shows the draft
      supabaseData.fetchMyScenarios(user.id)
        .then(r => { setRegistry(r); setHubFilter("my"); })
        .catch(e => console.warn('Registry refresh failed:', e));
    } catch (e) {
      console.warn('Background draft save failed:', e);
    }
  }

  async function handleSaveCharacter() {
    if (!user) return;
    
    if (tab === 'library') {
      try {
        const char = library.find(c => c.id === selectedCharacterId);
        if (char) {
          await supabaseData.saveCharacterToLibrary(char, user.id);
          
        }
        setSelectedCharacterId(null);
      } catch (e: any) {
        console.error("Error saving character:", e.message);
      }
    } else {
      setSelectedCharacterId(null);
      setTab("world");
      // Silently persist the draft so character changes are never lost
      saveDraftInBackground();
    }
  }

  function handleCancelCharacterEdit() {
    if (!selectedCharacterId) return;
    
    if (tab === "library") {
      // Only remove if this is a newly created, unsaved character
      if (unsavedNewCharacterIds.has(selectedCharacterId)) {
        setLibrary(prev => prev.filter(c => c.id !== selectedCharacterId));
        setUnsavedNewCharacterIds(prev => {
          const next = new Set(prev);
          next.delete(selectedCharacterId);
          return next;
        });
      }
      // For already-persisted characters, just deselect (don't remove)
    } else if (activeData) {
      // Remove the character from the scenario
      handleUpdateActive({ 
        characters: activeData.characters.filter(c => c.id !== selectedCharacterId) 
      });
    }
    
    setSelectedCharacterId(null);
    
    // Navigate back to world tab (Scenario Builder main page)
    if (tab === "characters") {
      setTab("world");
    }
  }

  function handleCreateCharacter() {
    const t = now();
    const c: Character = {
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
        hairColor: '',
        eyeColor: '',
        build: '',
        bodyHair: '',
        height: '',
        breastSize: '',
        genitalia: '',
        skinTone: '',
        makeup: '',
        bodyMarkings: '',
        temporaryConditions: ''
      },
      currentlyWearing: {
        top: '',
        bottom: '',
        undergarments: '',
        miscellaneous: ''
      },
      preferredClothing: {
        casual: '',
        work: '',
        sleep: '',
        undergarments: '',
        miscellaneous: ''
      },
      sections: [], // Start with empty sections - user can add custom ones
      createdAt: t,
      updatedAt: t,
    };
    if (tab === "library") {
      setLibrary(prev => [c, ...prev]);
      setSelectedCharacterId(c.id);
      setUnsavedNewCharacterIds(prev => new Set(prev).add(c.id));
      return;
    }
    if (activeData) {
      handleUpdateActive({ characters: [c, ...activeData.characters] });
      setSelectedCharacterId(c.id);
    }
  }

  function handleImportCharacter(char: Character) {
    if (!activeData) return;
    if (activeData.characters.some(c => c.id === char.id)) {
      console.error("Character already in scenario");
      return;
    }
    const copy = JSON.parse(JSON.stringify(char));
    handleUpdateActive({ characters: [copy, ...activeData.characters] });
    setIsCharacterPickerOpen(false);
  }

  async function handleDeleteScenario(id: string) {
    // Check if this is a bookmarked scenario (not owned by user)
    const savedScenario = savedScenarios.find(s => s.source_scenario_id === id);
    const isBookmarked = savedScenario && !registry.some(r => r.id === id);
    
    if (isBookmarked) {
      // Show styled confirmation dialog for bookmark removal
      setDeleteConfirmId(id);
      setDeleteConfirmType('bookmark');
    } else {
      // Show styled confirmation dialog for scenario deletion
      setDeleteConfirmId(id);
      setDeleteConfirmType('scenario');
    }
  }

  async function executeDeleteScenario(id: string) {
    const savedScenario = savedScenarios.find(s => s.source_scenario_id === id);
    const isBookmarked = savedScenario && !registry.some(r => r.id === id);
    
    if (isBookmarked) {
      try {
        await unsaveScenario(savedScenario.published_scenario_id, user!.id);
        const savedScens = await fetchSavedScenarios(user!.id);
        setSavedScenarios(savedScens);
        
      } catch (e: any) {
        console.error("Failed to remove bookmark:", e.message);
      }
    } else {
      try {
        await supabaseData.deleteScenario(id);
        const updatedRegistry = await supabaseData.fetchMyScenarios(user!.id);
        setRegistry(updatedRegistry);
        
        const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
        setConversationRegistry(updatedConvRegistry);
        
        if (activeId === id) {
          setActiveId(null);
          setActiveData(null);
          setSelectedCharacterId(null);
          setPlayingConversationId(null);
          setTab("hub");
        }
      } catch (e: any) {
        console.error("Delete failed:", e.message);
      }
    }
  }
  
  async function handleResumeFromHistory(scenarioId: string, conversationId: string) {
    setIsResuming(true);
    // Only show overlay after 300ms to avoid flash on fast loads
    resumeTimerRef.current = setTimeout(() => setShowResumingOverlay(true), 300);
    
    try {
      // Parallel fetch: scenario, recent messages (30), and side characters
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

      // Store hasMore so the lazy-load scroll handler knows there's older history
      setHasMoreMessagesMap(prev => ({ ...prev, [conversationId]: hasMore }));

      // Non-blocking: load content themes
      supabaseData.fetchContentThemes(scenarioId).then(themes => {
        data.contentThemes = themes;
      }).catch(e => {
        console.warn('[handleResumeFromHistory] Failed to load content themes:', e);
      });

      setActiveId(scenarioId);
      setActiveCoverImage(coverImage);
      setActiveCoverPosition(coverImagePosition);
      setActiveData(data);
      setPlayingConversationId(conversationId);
      setSelectedCharacterId(null);
      setTab("chat_interface");
      
      console.log('[handleResumeFromHistory] Loaded', thread.messages.length, 'messages (hasMore:', hasMore, ')');
    } catch (e: any) {
      console.error('[handleResumeFromHistory] Error:', e);
      
    } finally {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
      setShowResumingOverlay(false);
      setIsResuming(false);
    }
  }
  
  // Handle scroll-based lazy loading of older messages
  const handleLoadOlderMessages = useCallback(async (convId: string, beforeCreatedAt: string): Promise<Message[]> => {
    try {
      const olderMessages = await supabaseData.fetchOlderMessages(convId, beforeCreatedAt, 20);
      
      if (olderMessages.length === 0) {
        setHasMoreMessagesMap(prev => ({ ...prev, [convId]: false }));
        return [];
      }
      
      // Prepend older messages to the conversation in activeData
      setActiveData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          conversations: prev.conversations.map(c => {
            if (c.id !== convId) return c;
            return { ...c, messages: [...olderMessages, ...c.messages] };
          })
        };
      });
      
      return olderMessages;
    } catch (e: any) {
      console.error('[handleLoadOlderMessages] Error:', e);
      return [];
    }
  }, []);

  async function handleDeleteConversationFromHistory(scenarioId: string, conversationId: string) {
    // Optimistic UI update - remove immediately
    const previousRegistry = [...conversationRegistry];
    setConversationRegistry(prev => prev.filter(c => c.conversationId !== conversationId));
    
    if (activeId === scenarioId && activeData) {
      setActiveData(prev => prev ? { 
        ...prev, 
        conversations: prev.conversations.filter(c => c.id !== conversationId) 
      } : prev);
    }
    
    // Delete from database in background
    try {
      await supabaseData.deleteConversation(conversationId);
    } catch (e: any) {
      // On error, restore previous state
      console.error("Failed to delete conversation:", e.message);
      setConversationRegistry(previousRegistry);
    }
  }
  
  async function handleDeleteAllConversations() {
    if (conversationRegistry.length === 0) {
      
      return;
    }
    
    // Store for potential rollback
    const previousRegistry = [...conversationRegistry];
    
    // Optimistic UI update - clear immediately
    setConversationRegistry([]);
    if (activeData) {
      setActiveData(prev => prev ? { ...prev, conversations: [] } : prev);
    }
    
    // Delete from database in parallel batch
    try {
      await Promise.all(previousRegistry.map(entry => supabaseData.deleteConversation(entry.conversationId)));
      
    } catch (e: any) {
      // On error, restore previous state
      console.error("Failed to delete sessions:", e.message);
      setConversationRegistry(previousRegistry);
    }
  }
  

  function handleUpdateActive(patch: Partial<ScenarioData>) {
    setActiveData(prev => prev ? { ...prev, ...patch } : null);
  }

  function handleUpdateCharacter(id: string, patch: Partial<Character>) {
    if (tab === "library") {
      setLibrary(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    } else {
      setActiveData(prev => {
        if (!prev) return prev;
        return { ...prev, characters: prev.characters.map((c) => c.id === id ? { ...c, ...patch } : c) };
      });
    }
  }

  function handleDeleteCharacterFromList(id: string) {
    setDeleteConfirmId(id);
  }

  async function executeDeleteCharacter(id: string) {
    if (tab === "library") {
      try {
        await supabaseData.deleteCharacterFromLibrary(id);
        const nextLib = library.filter(c => c.id !== id);
        setLibrary(nextLib);
        if (selectedCharacterId === id) setSelectedCharacterId(null);
        
      } catch (e: any) {
        console.error("Failed to delete character:", e.message);
      }
    } else if (activeData) {
      const nextChars = activeData.characters.filter((c) => c.id !== id);
      handleUpdateActive({ characters: nextChars });
      if (selectedCharacterId === id) setSelectedCharacterId(null);
    }
  }

  function handleAddWorldEntry() {
    if (!activeData) return;
    const t = now();
    const newEntry = { id: uuid(), title: '', body: '', createdAt: t, updatedAt: t }; // Use UUID for Supabase
    handleUpdateActive({ world: { ...activeData.world, entries: [newEntry, ...activeData.world.entries] } });
  }

  async function handleAiFill(userPrompt?: string, useExistingDetails: boolean = true) {
    let character = tab === "library" ? library.find(c => c.id === selectedCharacterId) : activeData?.characters.find(c => c.id === selectedCharacterId);
    if (!character) return;
    setIsAiFilling(true);
    setAiPromptModal(null);
    try {
      const patch = await aiFillCharacter(character, activeData || createDefaultScenarioData(), globalModelId, userPrompt, useExistingDetails);
      if (Object.keys(patch).length > 0) {
        handleUpdateCharacter(character.id, { ...patch, updatedAt: now() });
      } else {
      }
    } catch (e) {
      console.error(e);
      console.error("AI Fill failed:", e);
    } finally {
      setIsAiFilling(false);
    }
  }

  async function handleAiGenerate(userPrompt?: string, useExistingDetails: boolean = true) {
    let character = tab === "library" ? library.find(c => c.id === selectedCharacterId) : activeData?.characters.find(c => c.id === selectedCharacterId);
    if (!character) return;
    setIsAiGenerating(true);
    setAiPromptModal(null);
    try {
      const patch = await aiGenerateCharacter(character, activeData || createDefaultScenarioData(), globalModelId, userPrompt, useExistingDetails);
      if (Object.keys(patch).length > 0) {
        handleUpdateCharacter(character.id, { ...patch, updatedAt: now() });
      } else {
      }
    } catch (e) {
      console.error(e);
      console.error("AI Generate failed:", e);
    } finally {
      setIsAiGenerating(false);
    }
  }

  // Handle AI prompt modal submission
  function handleAIPromptSubmit(prompt: string, useExistingDetails: boolean) {
    if (aiPromptModal?.mode === 'fill') {
      handleAiFill(prompt, useExistingDetails);
    } else if (aiPromptModal?.mode === 'generate') {
      handleAiGenerate(prompt, useExistingDetails);
    }
  }

  // Handle saving character to library
  async function handleSaveToLibrary() {
    if (!selectedCharacterId) return;
    const sourceList = tab === "library" ? library : activeData?.characters;
    const selected = sourceList?.find(c => c.id === selectedCharacterId);
    if (!selected || !user) return;
    
    setIsSavingToLibrary(true);
    try {
      if (tab === "library") {
        // Already in library tab - just save/update in place
        await supabaseData.saveCharacterToLibrary(selected, user.id);
        // Remove from unsaved set since it's now persisted
        setUnsavedNewCharacterIds(prev => {
          const next = new Set(prev);
          next.delete(selected.id);
          return next;
        });
      } else {
        // From Scenario Builder - check if we already have a library copy
        const existingLibraryId = characterInLibrary[selected.id];
        
        if (existingLibraryId && typeof existingLibraryId === 'string') {
          // Update existing library copy
          const libraryCopy = { ...selected, id: existingLibraryId };
          await supabaseData.saveCharacterToLibrary(libraryCopy, user.id);
          // Also update local library state
          setLibrary(prev => prev.map(c => c.id === existingLibraryId ? { ...c, ...selected, id: existingLibraryId } : c));
          
        } else {
          // Create a NEW copy with a new UUID for the library
          const newLibraryId = uuid();
          await supabaseData.saveCharacterCopyToLibrary(selected, user.id, newLibraryId);
          
          // Add to local library state with new ID
          const libraryCopy = { ...selected, id: newLibraryId };
          setLibrary(prev => {
            const exists = prev.some(c => c.id === newLibraryId);
            if (exists) return prev;
            return [libraryCopy, ...prev];
          });
          // Map scenario char ID -> library char ID
          setCharacterInLibrary(prev => ({ ...prev, [selected.id]: newLibraryId }));
          
        }
      }
    } catch (e: any) {
      console.error(e);
      console.error("Save failed:", e.message);
    } finally {
      setIsSavingToLibrary(false);
    }
  }

  // Check if current character is in library
  const selectedCharacterIsInLibrary = useMemo(() => {
    if (!selectedCharacterId) return false;
    return !!characterInLibrary[selectedCharacterId] || tab === "library";
  }, [selectedCharacterId, characterInLibrary, tab]);

  // Filter library characters by search query
  const filteredLibrary = useMemo(() => {
    if (!librarySearchQuery.trim()) return library;
    const q = librarySearchQuery.toLowerCase();
    return library.filter(c => {
      // Search name, nicknames, roleDescription, tags
      if (c.name?.toLowerCase().includes(q)) return true;
      if (c.nicknames?.toLowerCase().includes(q)) return true;
      if (c.roleDescription?.toLowerCase().includes(q)) return true;
      if (c.tags?.toLowerCase().includes(q)) return true;
      // Search physical appearance fields
      const pa = c.physicalAppearance;
      if (pa) {
        const paValues = [pa.hairColor, pa.eyeColor, pa.build, pa.height, pa.skinTone, pa.bodyHair, pa.breastSize, pa.genitalia, pa.makeup, pa.bodyMarkings, pa.temporaryConditions].join(' ');
        if (paValues.toLowerCase().includes(q)) return true;
      }
      // Search currently wearing
      const cw = c.currentlyWearing;
      if (cw) {
        const cwValues = [cw.top, cw.bottom, cw.undergarments, cw.miscellaneous].join(' ');
        if (cwValues.toLowerCase().includes(q)) return true;
      }
      // Search preferred clothing
      const pc = c.preferredClothing;
      if (pc) {
        const pcValues = [pc.casual, pc.work, pc.sleep, pc.undergarments, pc.miscellaneous].join(' ');
        if (pcValues.toLowerCase().includes(q)) return true;
      }
      // Search sections
      for (const sec of c.sections || []) {
        if (sec.title?.toLowerCase().includes(q)) return true;
        for (const item of sec.items || []) {
          if (item.label?.toLowerCase().includes(q) || item.value?.toLowerCase().includes(q)) return true;
        }
      }
      return false;
    });
  }, [library, librarySearchQuery]);

  function handleAddSection(type: 'structured' | 'freeform' = 'structured') {
     if (!selectedCharacterId) return;
     const sourceList = tab === "library" ? library : activeData?.characters;
     const selected = sourceList?.find(c => c.id === selectedCharacterId);
     if (!selected) return;
     handleUpdateCharacter(selected.id, {
       sections: [...selected.sections, {
         id: uid('sec'),
         title: 'New Section',
         type,
         items: [{ id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }],
         freeformValue: type === 'freeform' ? '' : undefined,
         createdAt: now(),
         updatedAt: now()
       }]
     });
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-[#4a5f7f]/30 mx-auto mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
                    <span className="relative z-[1]">C</span>
                  </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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

  return (
    <TooltipProvider>
      <div className="h-screen min-w-0 flex bg-white overflow-hidden relative">
        {/* Session resume now navigates immediately to chat with loading skeleton - no overlay needed */}
        <aside className={`flex-shrink-0 bg-[#1a1a1a] flex flex-col border-r border-black shadow-2xl z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}`}>
          <div className={`py-8 ${sidebarCollapsed ? 'px-4' : 'px-8'} transition-all duration-300`}>
            <div className={`flex ${sidebarCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-[#4a5f7f]/30 flex-shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
                    <span className="relative z-[1]">C</span>
                  </div>
                {!sidebarCollapsed && (
                  <div className="font-black uppercase tracking-tighter text-2xl leading-none text-white whitespace-nowrap overflow-hidden">Chronicle</div>
                )}
              </div>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-ghost-white transition-colors"
                  >
                    {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <nav className={`flex-1 overflow-y-auto pb-4 mt-4 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
            <SidebarItem active={tab === "gallery"} label="Community Gallery" icon={<IconsList.Gallery />} onClick={() => handleNavigateAway("gallery")} collapsed={sidebarCollapsed} />
            <SidebarItem active={tab === "hub"} label="My Stories" icon={<IconsList.Hub />} onClick={() => requireAuth(() => handleNavigateAway("hub"))} collapsed={sidebarCollapsed} />
            <SidebarItem active={tab === "library"} label="Character Library" icon={<IconsList.Library />} onClick={() => requireAuth(() => handleNavigateAway("library"))} collapsed={sidebarCollapsed} />
            <SidebarItem active={tab === "image_library"} label="Image Library" icon={<IconsList.ImageLibrary />} onClick={() => requireAuth(() => handleNavigateAway("image_library"))} collapsed={sidebarCollapsed} />
            
            <SidebarItem active={tab === "conversations"} label="Chat History" icon={<IconsList.Chat />} onClick={() => requireAuth(() => handleNavigateAway("conversations"))} collapsed={sidebarCollapsed} />
            
            <SidebarItem 
              active={tab === "world" || tab === "characters"} 
              label="Story Builder"
              subtitle={activeId ? (activeMeta?.title || "Unsaved Draft") : undefined}
              icon={<IconsList.Builder />} 
              onClick={() => requireAuth(() => {
                if (playingConversationId) handleCreateNewScenario();
                else if (activeId) setTab("world");
                else handleCreateNewScenario();
              })}
              className={!activeId ? "opacity-80" : ""}
              collapsed={sidebarCollapsed}
            />

            {isAdminState && (
              <div className="pt-4 mt-4 border-t border-ghost-white">
                <SidebarItem active={tab === "admin"} label="Admin" icon={<Settings className="w-5 h-5" />} onClick={() => requireAuth(() => { setAdminActiveTool('hub'); setTab("admin"); })} collapsed={sidebarCollapsed} />
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-ghost-white">
              {isAuthenticated && user ? (() => {
                const displayName = userProfile?.display_name || user.email?.split('@')[0] || 'User';
                const initials = displayName.slice(0, 2).toUpperCase();
                return (
                  <div>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(prev => !prev)}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-xl px-2 py-2 hover:bg-ghost-white active:bg-ghost-white transition-all text-left",
                        sidebarCollapsed && "justify-center px-0"
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {userProfile?.avatar_url ? (
                          <AvatarImage src={userProfile.avatar_url} alt={displayName} />
                        ) : null}
                        <AvatarFallback className="bg-[#4a5f7f] text-white text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {!sidebarCollapsed && (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">{displayName}</p>
                            <p className="text-xs text-white/30 truncate">{user.email}</p>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-white/30 shrink-0 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                        </>
                      )}
                    </button>
                    {userMenuOpen && (
                      <div className={cn("flex flex-col gap-0.5 mt-1", !sidebarCollapsed && "pl-4")}>
                        <button
                          type="button"
                          onClick={() => { setAccountActiveTab('profile'); setTab("account"); setUserMenuOpen(false); }}
                          className={cn(
                            "flex items-center gap-2 w-full rounded-lg px-2 py-1.5 hover:bg-ghost-white transition-colors text-white/70 hover:text-white text-sm font-bold",
                            sidebarCollapsed && "justify-center px-0"
                          )}
                        >
                          <UserCircle className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span>Public Profile</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAccountActiveTab('settings'); setTab("account"); setUserMenuOpen(false); }}
                          className={cn(
                            "flex items-center gap-2 w-full rounded-lg px-2 py-1.5 hover:bg-ghost-white transition-colors text-white/70 hover:text-white text-sm font-bold",
                            sidebarCollapsed && "justify-center px-0"
                          )}
                        >
                          <Settings className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span>Account Settings</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => { handleSignOut(); setUserMenuOpen(false); }}
                          className={cn(
                            "flex items-center gap-2 w-full rounded-lg px-2 py-1.5 hover:bg-ghost-white transition-colors text-red-500 text-sm font-bold",
                            sidebarCollapsed && "justify-center px-0"
                          )}
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span>Sign Out</span>}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-xl px-2 py-2 hover:bg-ghost-white active:bg-ghost-white transition-all text-[#4a5f7f]",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                >
                  <LogIn className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm font-bold">Sign In</span>}
                </button>
              )}
            </div>
          </nav>
        </aside>

      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-ghost-white">
        {(tab === "characters" || tab === "world" || tab === "library" || tab === "conversations" || tab === "hub" || tab === "image_library" || tab === "gallery" || tab === "admin" || tab === "account") && (
          <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[rgba(248,250,252,0.3)] px-4 py-3 shadow-sm lg:px-8">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
              {tab === "library" && (
                <div className="flex items-center gap-3 flex-1">
                  {selectedCharacterId && (
                    <button 
                      onClick={() => setSelectedCharacterId(null)} 
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                  )}
                  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                    Character Library
                  </h1>
                  {!selectedCharacterId && (
                    <div className="ml-4 bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]">
                      <input
                        type="text"
                        value={librarySearchQuery}
                        onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        placeholder="Search characters..."
                        className="h-7 w-56 px-3 py-1 text-xs font-bold rounded-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
              {(tab === "world" || tab === "characters") && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (tab === "characters") {
                        setSelectedCharacterId(null);
                        setTab("world");
                      } else {
                        setActiveId(null);
                        setActiveData(null);
                        setTab("hub");
                      }
                    }} 
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                    {tab === "characters" ? "Character Builder" : "Story Builder"}
                  </h1>
                </div>
              )}
              {tab === "conversations" && (
                <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                  Chat History
                </h1>
              )}
              {tab === "hub" && (
                <div className="flex items-center gap-6">
                  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                    My Stories
                  </h1>
                  <div className="overflow-x-auto scrollbar-none flex-shrink-0">
                    <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]">
                      {[
                        { key: "my" as const, label: "My Stories" },
                        { key: "bookmarked" as const, label: "Saved Stories" },
                        { key: "published" as const, label: "Published" },
                        { key: "drafts" as const, label: "Drafts" },
                        { key: "all" as const, label: "All" },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setHubFilter(option.key)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border-t",
                            hubFilter === option.key 
                              ? "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-white/20 text-white shadow-sm" 
                              : "border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]"
                          )}
                        >
                          {hubFilter === option.key && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
                          )}
                          <span className="relative z-[1]">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {tab === "image_library" && (
                <div className="flex items-center gap-2">
                  {isInImageFolder && (
                    <button
                      type="button"
                      onClick={() => imageLibraryExitFolderRef.current?.()}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                  )}
                  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                    Image Library
                  </h1>
                  {isInImageFolder && (
                    <div className="ml-4 bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]">
                      <input
                        type="text"
                        value={imageLibrarySearchQuery}
                        onChange={(e) => setImageLibrarySearchQuery(e.target.value)}
                        placeholder="Search by tags..."
                        className="h-7 w-56 px-3 py-1 text-xs font-bold rounded-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
              {tab === "admin" && (
                <div className="flex items-center gap-2">
                  {adminActiveTool !== 'hub' && (
                    <button
                      type="button"
                      onClick={() => setAdminActiveTool('hub')}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                  )}
                  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                    Admin Panel
                  </h1>
                </div>
              )}
              {tab === "account" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTab("hub")}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                    Account
                  </h1>
                </div>
              )}
              {tab === "gallery" && (
                <div className="flex items-center gap-6">
                  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                    Community Gallery
                  </h1>
                  <div className="overflow-x-auto scrollbar-none flex-shrink-0">
                    <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]">
                      {[
                        { key: 'all' as GallerySortOption, label: 'All Stories' },
                        { key: 'recent' as GallerySortOption, label: 'Recent' },
                        { key: 'liked' as GallerySortOption, label: 'Liked' },
                        { key: 'saved' as GallerySortOption, label: 'Saved' },
                        { key: 'played' as GallerySortOption, label: 'Played' },
                        { key: 'following' as GallerySortOption, label: 'Following' },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setGallerySortBy(option.key)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border-t",
                            gallerySortBy === option.key 
                              ? "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-white/20 text-white shadow-sm" 
                              : "border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]"
                          )}
                        >
                          {gallerySortBy === option.key && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
                          )}
                          <span className="relative z-[1]">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
              {tab === "world" && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenStoryImport}
                    disabled={!activeData || isSavingAndClosing}
                    className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                    <Upload size={14} />
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenStoryExport}
                    disabled={!activeData || isSavingAndClosing}
                    className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeId || !activeData) return;
                      // Run validation before saving to DB
                      const errors = validateForPublish({
                        scenarioTitle: activeData.world.core.scenarioName || '',
                        world: activeData.world,
                        characters: activeData.characters,
                        openingDialog: activeData.story.openingDialog,
                        contentThemes: activeContentThemes,
                        coverImage: activeCoverImage,
                      });
                      if (hasPublishErrors(errors)) {
                        // Switch to world tab so user sees errors (already on world tab but ensure state)
                        setTab("world");
                        // WorldTab will pick up errors via live re-validation when publish button is clicked;
                        // we trigger it by simulating a publish-error state. We'll dispatch a custom event.
                        window.dispatchEvent(new CustomEvent('chronicle:save-validation-failed', { detail: errors }));
                        return;
                      }
                      setIsSavingAndClosing(true);
                      const safety = setTimeout(() => { console.warn('Save&Close safety timeout'); setIsSavingAndClosing(false); }, 12000);
                      try {
                        await handleSave(true);
                      } finally { clearTimeout(safety); setIsSavingAndClosing(false); }
                    }}
                    disabled={isSavingAndClosing}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                     {isSavingAndClosing ? 'Saving...' : 'Finalize and Close'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeId || !activeData || !user) return;
                      setIsSaving(true);
                      try {
                        await saveDraftInBackground();
                        setTimeout(() => setIsSaving(false), 1200);
                      } catch (e) {
                        console.warn('Could not save draft:', e);
                        setStoryTransferNotice({
                          tone: "error",
                          text: "Draft save failed. Please try again.",
                        });
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving || isSavingAndClosing}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                 {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  {storyTransferNotice && (
                    <span className={cn("text-xs truncate max-w-[200px] animate-in fade-in duration-300",
                      storyTransferNotice.tone === "success" && "text-emerald-400",
                      storyTransferNotice.tone === "error" && "text-red-400",
                      storyTransferNotice.tone === "info" && "text-sky-400",
                    )}>
                      {storyTransferNotice.text}
                    </span>
                  )}
                </>
              )}
              {tab === "conversations" && conversationRegistry.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConvDeleteAllOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl h-10 px-6 border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                >
                  Delete All
                </button>
              )}
              {tab === "hub" && (
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setIsBackgroundModalOpen(true)} className="cursor-pointer">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Change Background
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {tab === "admin" && adminActiveTool === "app_guide" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuideTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                    title={guideTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {guideTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => guideSaveRef.current?.()}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => guideSyncAllRef.current?.()}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                    Sync All
                  </button>
                </div>
              )}
              {tab === "admin" && adminActiveTool === "style_guide" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { styleGuideEditsRef.current?.(); }}
                    className="relative inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                    <Pencil size={14} />
                    Edits
                    {styleGuideEditsCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-zinc-600 text-[9px] font-bold px-1">
                        {styleGuideEditsCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => styleGuideDownloadRef.current?.()}
                    className="inline-flex items-center gap-2 justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              )}
              {tab === "image_library" && (
                <div className="flex items-center gap-2">
                  {isInImageFolder && (
                    <button
                      type="button"
                      onClick={() => imageLibraryUploadRef.current?.()}
                      className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                    >
                      + Upload Images
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setIsImageLibraryBackgroundModalOpen(true)} className="cursor-pointer">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Change Background
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {(tab === "characters" || tab === "library") && (
                <>
                  {selectedCharacterId && (
                    <>
                      {/* AI Fill Button with tooltip - Premium iridescent style */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setAiPromptModal({ mode: 'fill' })}
                            disabled={isAiFilling}
                            className="group relative flex h-10 px-4 rounded-xl overflow-hidden
                              text-white text-[10px] font-bold leading-none
                              shadow-[0_12px_40px_rgba(0,0,0,0.45)]
                              hover:brightness-125 transition-all
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45
                              disabled:opacity-50"
                          >
                            {/* Layer 1: Iridescent outer border ring */}
                            <span
                              aria-hidden
                              className="absolute inset-0 rounded-xl"
                              style={{
                                background:
                                  "linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)",
                                filter:
                                  "drop-shadow(0 0 10px rgba(255,255,255,0.10)) drop-shadow(0 0 18px rgba(109,94,247,0.10)) drop-shadow(0 0 18px rgba(34,184,200,0.10))",
                              }}
                            />
                            {/* Layer 2: Mask to create 2px border effect */}
                            <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "#2B2D33" }} />
                            {/* Layer 3: Button surface with gradient */}
                            <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33" }} />
                            {/* Layer 4: Soft top sheen */}
                            <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))" }} />
                            {/* Layer 5: Border sheen */}
                            <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.22)", background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.00) 55%)", mixBlendMode: "screen" }} />
                            {/* Layer 6: Teal bloom */}
                            <span aria-hidden className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)" }} />
                            {/* Layer 7: Purple bloom */}
                            <span aria-hidden className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)" }} />
                            {/* Layer 8: Crisp inner edge */}
                            <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)" }} />
                            {/* Content layer */}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-200" style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }} />
                              <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
                                {isAiFilling ? "Filling..." : "AI Fill"}
                              </span>
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Have AI generate text for empty fields</TooltipContent>
                      </Tooltip>

                      {/* Save (Quick Save) Button - hidden in library tab */}
                      {tab !== "library" && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveCharacter();
                        }}
                        disabled={isSaving || isSavingAndClosing}
                        className="flex h-10 px-6 items-center justify-center gap-2 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      )}

                      {/* Cancel Button - Dark surface style */}
                      <button
                        type="button"
                        onClick={handleCancelCharacterEdit}
                        className="flex h-10 px-6 items-center justify-center gap-2 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                      >
                        Cancel
                      </button>

                      {/* Character Library Button with tooltip - matching Cancel button style */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={handleSaveToLibrary}
                            disabled={isSavingToLibrary}
                            className="flex h-10 px-6 items-center justify-center gap-2 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                          >
                            {isSavingToLibrary ? 'Saving...' : selectedCharacterIsInLibrary ? 'Update Character' : '+ Character Library'}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {selectedCharacterIsInLibrary ? 'Update character profile in library' : 'Add character to library'}
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  {!selectedCharacterId && tab === "characters" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTab("world")}
                        className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCharacterPickerOpen(true)}
                        className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                      >
                        Import from Library
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCharacter}
                        className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                      >
                        + New Character
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </header>
        )}

        {/* Layout guardrail:
            This wrapper must stay flex-1 + min-h-0 in a column context so nested
            builders can establish bounded heights and keep internal pane scrolling. */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
                const selBg = hubBackgrounds.find(bg => bg.id === selectedHubBackgroundId);
                const oColor = selBg?.overlayColor || 'black';
                const oOpacity = (selBg?.overlayOpacity ?? 10) / 100;
                return <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: oColor === 'white' ? `rgba(255,255,255,${oOpacity})` : `rgba(0,0,0,${oOpacity})` }} />;
              })()}
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
            </div>
          )}

          {tab === "gallery" && (
            <GalleryHub onPlay={handleGalleryPlay} onSaveChange={handleGallerySaveChange} sortBy={gallerySortBy} onSortChange={setGallerySortBy} onAuthRequired={() => setAuthModalOpen(true)} />
          )}

          <div 
            className={cn("relative w-full h-full bg-black", tab === "image_library" ? "block" : "hidden")}
            style={selectedImageLibraryBackgroundUrl ? {
              backgroundImage: `url(${selectedImageLibraryBackgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            {selectedImageLibraryBackgroundUrl && (
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            )}
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
          </div>

          {tab === "library" && (
            <div className="h-full overflow-y-auto bg-black p-4 relative z-10 sm:p-6 lg:p-10">
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
            </div>
          )}

          {tab === "characters" && activeData && (
            // Height-chain guardrail: keep h-full + min-h-0 + overflow-hidden wrapper
            // so Character Builder side nav and main pane scroll regions resolve correctly.
            <div className="h-full min-h-0 overflow-hidden">
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
            </div>
          )}

          {tab === "world" && activeData && activeId && (
            // Height-chain guardrail: keep h-full + min-h-0 + overflow-hidden wrapper
            // so Story Builder roster + content panes preserve full-height behavior.
            <div className="h-full min-h-0 overflow-hidden">
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
                onOpenLibraryPicker={() => { setIsCharacterPickerOpen(true); }}
                onSelectCharacter={(id) => { setSelectedCharacterId(id); setTab("characters"); }}
                storyNameError={storyNameError}
              />
            </div>
          )}

          {tab === "conversations" && (
            <div className="relative h-full overflow-y-auto bg-black p-4 sm:p-6 lg:p-10">
              {showResumingOverlay && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-ghost-white border-t-white rounded-full animate-spin mb-4" />
                  <p className="text-white font-medium text-lg">Loading session...</p>
                </div>
              )}
              <ConversationsTab
                globalRegistry={conversationRegistry}
                onResume={handleResumeFromHistory}
                onDelete={(scenarioId, conversationId) => {
                  setConvDeleteTarget({ scenarioId, conversationId });
                }}
              />

              {/* Single delete confirm */}
              <DeleteConfirmDialog
                open={!!convDeleteTarget}
                onOpenChange={(open) => { if (!open) setConvDeleteTarget(null); }}
                onConfirm={() => {
                  if (convDeleteTarget) {
                    handleDeleteConversationFromHistory(convDeleteTarget.scenarioId, convDeleteTarget.conversationId);
                  }
                  setConvDeleteTarget(null);
                }}
                title="Delete this session?"
                message="This saved session will be permanently deleted. This cannot be undone."
              />

              {/* Delete All confirm */}
              <DeleteConfirmDialog
                open={convDeleteAllOpen}
                onOpenChange={setConvDeleteAllOpen}
                onConfirm={() => {
                  setConvDeleteAllOpen(false);
                  handleDeleteAllConversations();
                }}
                title={`Delete all ${conversationRegistry.length} session${conversationRegistry.length !== 1 ? 's' : ''}?`}
                message="All saved sessions will be permanently deleted. This cannot be undone."
              />
            </div>
          )}

          {tab === "chat_interface" && activeId && playingConversationId && (
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
          )}


          {tab === "admin" && (
              <AdminPage activeTool={adminActiveTool} onSetActiveTool={setAdminActiveTool} onRegisterGuideSave={(fn) => { guideSaveRef.current = fn; }} onRegisterGuideSyncAll={(fn) => { guideSyncAllRef.current = fn; }} onRegisterStyleGuideDownload={(fn) => { styleGuideDownloadRef.current = fn; }} onRegisterStyleGuideEdits={(fn) => { styleGuideEditsRef.current = fn; getEditsCount().then(c => setStyleGuideEditsCount(c)); }} onStyleGuideEditsCountChange={(count) => setStyleGuideEditsCount(count)} guideTheme={guideTheme} />
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
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                          accountActiveTab === option.key
                            ? "bg-[#4a5f7f] text-white shadow-sm"
                            : "text-[#a1a1aa] hover:text-[#e4e4e7]"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {accountActiveTab === 'settings' && (
                  <AccountSettingsTab user={user} />
                )}
                {accountActiveTab === 'subscription' && (
                  <SubscriptionTab />
                )}
                {accountActiveTab === 'profile' && (
                  <PublicProfileTab user={user} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {isCharacterPickerOpen && (
        <CharacterPickerWithRefresh
          library={library}
          refreshLibrary={refreshCharacterLibrary}
          onSelect={handleImportCharacter}
          onClose={() => setIsCharacterPickerOpen(false)}
        />
      )}

      <BackgroundPickerModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
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
        onClose={() => setIsImageLibraryBackgroundModalOpen(false)}
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
        onOpenChange={(open) => { if (!open) { setDeleteConfirmId(null); setDeleteConfirmType('character'); } }}
        onConfirm={() => {
          if (!deleteConfirmId) return;
          if (deleteConfirmType === 'bookmark' || deleteConfirmType === 'scenario') {
            executeDeleteScenario(deleteConfirmId);
          } else {
            executeDeleteCharacter(deleteConfirmId);
          }
          setDeleteConfirmId(null);
          setDeleteConfirmType('character');
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
        onOpenChange={(open) => { if (!open) setRemixConfirmId(null); }}
        onConfirm={() => {
          if (remixConfirmId) executeRemixClone(remixConfirmId);
          setRemixConfirmId(null);
        }}
        title="Clone Story for Editing"
        message="You are about to open another creator's story in the editor. This will clone the details of the story and create a version in 'My Stories' that you can then edit. This will not affect the original creator's uploaded story."
      />

      {/* AI Prompt Modal */}
      <AIPromptModal
        isOpen={aiPromptModal !== null}
        onClose={() => setAiPromptModal(null)}
        onSubmit={handleAIPromptSubmit}
        mode={aiPromptModal?.mode || 'fill'}
        isProcessing={isAiFilling || isAiGenerating}
      />

      {/* DraftsModal removed - drafts are now DB-backed and shown in the hub */}

      <StoryExportFormatModal
        open={storyExportModalOpen}
        onClose={() => setStoryExportModalOpen(false)}
        onSelect={handleExportStoryTransfer}
      />

      <StoryImportModeModal
        open={storyImportModalOpen}
        onClose={() => setStoryImportModalOpen(false)}
        onSelect={handleSelectStoryImportMode}
      />

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
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
