
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ScenarioData, TabKey, Character, ScenarioMetadata, Conversation, Message, ConversationMetadata, SideCharacter, UserBackground, ContentThemes, defaultContentThemes } from "@/types";

import { fetchSavedScenarios, SavedScenario, unsaveScenario, fetchUserPublishedScenarios, PublishedScenario } from "@/services/gallery-data";
import { createDefaultScenarioData, now, uid, uuid, truncateLine, resizeImage } from "@/utils";
import { CharactersTab } from "@/components/chronicle/CharactersTab";
import { WorldTab } from "@/components/chronicle/WorldTab";
import { ConversationsTab } from "@/components/chronicle/ConversationsTab";
import { useModelSettings, ModelSettingsProvider } from "@/contexts/ModelSettingsContext";
import { isAdminUser } from "@/services/app-settings";
import { AdminPage } from "@/pages/Admin";
import { AccountSettingsTab } from "@/components/account/AccountSettingsTab";
import { SubscriptionTab } from "@/components/account/SubscriptionTab";
import { PublicProfileTab } from "@/components/account/PublicProfileTab";

import { ScenarioHub } from "@/components/chronicle/ScenarioHub";
import { ModelSettingsTab } from "@/components/chronicle/ModelSettingsTab";
import { ChatInterfaceTab } from "@/components/chronicle/ChatInterfaceTab";
import { ImageLibraryTab } from "@/components/chronicle/ImageLibraryTab";
import { GalleryHub } from "@/components/chronicle/GalleryHub";
import { Button } from "@/components/chronicle/UI";
import { aiFillCharacter, aiGenerateCharacter } from "@/services/character-ai";
import { CharacterPicker, CharacterPickerWithRefresh } from "@/components/chronicle/CharacterPicker";
import { BackgroundPickerModal } from "@/components/chronicle/BackgroundPickerModal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelLeftClose, PanelLeft, Settings, Image as ImageIcon, Sparkles, ArrowLeft, UserCircle } from "lucide-react";
import { AIPromptModal } from "@/components/chronicle/AIPromptModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as supabaseData from "@/services/supabase-data";
import { DeleteConfirmDialog } from "@/components/chronicle/DeleteConfirmDialog";

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
    ? "bg-[#4a5f7f] shadow-lg shadow-black/40 text-white"
    : "text-slate-400 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-black/20";
  
  const content = (
    <button 
      type="button" 
      onClick={onClick} 
      className={`w-full flex flex-col rounded-xl transition-all duration-200 font-bold text-sm mb-1 cursor-pointer group border border-transparent ${activeClasses} ${className} ${collapsed ? 'px-3 py-3 items-center justify-center' : 'px-4 py-3'}`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 w-full'}`}>
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
      {!collapsed && subtitle && (
        <div className={`text-[10px] font-black tracking-wide uppercase mt-1 ml-8 text-left transition-colors duration-200 ${active ? "text-blue-200 opacity-100" : "text-slate-600 opacity-70 group-hover:text-slate-400"}`}>
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
  const { toast } = useToast();
  const { modelId: globalModelId, setModelId: setGlobalModelId } = useModelSettings();

  const [registry, setRegistry] = useState<ScenarioMetadata[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<ScenarioData | null>(null);
  const [activeCoverImage, setActiveCoverImage] = useState<string>("");
  const [activeCoverPosition, setActiveCoverPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [activeContentThemes, setActiveContentThemes] = useState<ContentThemes>(defaultContentThemes);
  const [playingConversationId, setPlayingConversationId] = useState<string | null>(null);
  const [library, setLibrary] = useState<Character[]>([]);
  const [tab, setTab] = useState<TabKey | "library">("hub");
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
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  // Track which conversations have more older messages to load
  const [hasMoreMessagesMap, setHasMoreMessagesMap] = useState<Record<string, boolean>>({});
  const [aiPromptModal, setAiPromptModal] = useState<{ mode: 'fill' | 'generate' } | null>(null);
  // Track characters saved to library (by their ID)
  const [characterInLibrary, setCharacterInLibrary] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('chronicle_sidebar_collapsed') === 'true';
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isInImageFolder, setIsInImageFolder] = useState(false);
  const imageLibraryExitFolderRef = React.useRef<(() => void) | null>(null);
  const [adminActiveTool, setAdminActiveTool] = useState<string>('hub');

  // Hub background state
  const [hubBackgrounds, setHubBackgrounds] = useState<UserBackground[]>([]);
  const [selectedHubBackgroundId, setSelectedHubBackgroundId] = useState<string | null>(null);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  // Image Library background state (separate selection, shared pool)
  const [selectedImageLibraryBackgroundId, setSelectedImageLibraryBackgroundId] = useState<string | null>(null);
  const [isImageLibraryBackgroundModalOpen, setIsImageLibraryBackgroundModalOpen] = useState(false);

  // Hub filter state for "Your Stories" tab
  type HubFilter = "my" | "bookmarked" | "published" | "all";
  const [hubFilter, setHubFilter] = useState<HubFilter>("all");

  // Gallery sort state (lifted from GalleryHub)
  type GallerySortOption = 'all' | 'recent' | 'liked' | 'saved' | 'played' | 'following';
  const [gallerySortBy, setGallerySortBy] = useState<GallerySortOption>('all');
  const [accountActiveTab, setAccountActiveTab] = useState<string>('settings');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [publishedScenariosData, setPublishedScenariosData] = useState<Map<string, PublishedScenario>>(new Map());
  const [contentThemesMap, setContentThemesMap] = useState<Map<string, ContentThemes>>(new Map());
  const [userProfile, setUserProfile] = useState<{ username: string | null } | null>(null);

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

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

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

    async function loadData() {
      setIsLoading(true);
      try {
        const [scenarios, characters, conversations, backgrounds, imageLibraryBgId, savedScens, publishedData, profile] = await Promise.all([
          withTimeout(supabaseData.fetchMyScenarios(user.id), 15000, [], 'fetchMyScenarios'),
          withTimeout(supabaseData.fetchCharacterLibrary(), 15000, [], 'fetchCharacterLibrary'),
          withTimeout(supabaseData.fetchConversationRegistry(), 15000, [], 'fetchConversationRegistry'),
          withTimeout(supabaseData.fetchUserBackgrounds(user.id), 15000, [], 'fetchUserBackgrounds'),
          withTimeout(supabaseData.getImageLibraryBackground(user.id), 15000, null, 'getImageLibraryBackground'),
          withTimeout(fetchSavedScenarios(user.id), 15000, [], 'fetchSavedScenarios'),
          withTimeout(fetchUserPublishedScenarios(user.id), 15000, new Map(), 'fetchUserPublishedScenarios'),
          withTimeout(supabaseData.fetchUserProfile(user.id), 15000, null, 'fetchUserProfile')
        ]);
        setRegistry(scenarios);
        setLibrary(characters);
        setConversationRegistry(conversations);
        setConversationsEnriched(false);
        setHubBackgrounds(backgrounds);
        setSavedScenarios(savedScens);
        setPublishedScenariosData(publishedData);
        setUserProfile(profile);
        
        // Fetch content themes for all user scenarios
        if (scenarios.length > 0) {
          const themesMap = await supabaseData.fetchContentThemesForScenarios(scenarios.map(s => s.id));
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
        toast({
          title: "Failed to load data",
          description: e.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isAuthenticated, user, toast]);

  // Lazy-load conversation message previews when the Conversations tab is first viewed
  useEffect(() => {
    if (tab !== "conversations" || conversationsEnriched || conversationRegistry.length === 0) return;
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
        return registry;
      case "bookmarked":
        return bookmarkedScenarios;
      case "published":
        return registry.filter(s => publishedScenarioIds.has(s.id));
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
    navigate('/auth');
  };

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
          toast({ title: "Upload failed", description: e.message, variant: "destructive" });
        } finally {
          setIsUploadingBackground(false);
        }
      };
      reader.onerror = () => {
        toast({ title: "Failed to read file", variant: "destructive" });
        setIsUploadingBackground(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
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
      toast({ title: "Failed to set background", description: e.message, variant: "destructive" });
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
      toast({ title: "Failed to delete background", description: e.message, variant: "destructive" });
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
      toast({ title: "Failed to set background", description: e.message, variant: "destructive" });
    }
  };

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
        toast({ title: "Scenario not found", variant: "destructive" });
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

      const newConv: Conversation = { 
        id: uuid(),
        title: `Story Session ${conversationCount + 1}`, 
        messages: initialMessages, 
        currentDay: startingDay,
        currentTimeOfDay: startingTimeOfDay,
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
        updatedAt: newConv.updatedAt
      }, ...prev]);
      
      setActiveData(data);
      setPlayingConversationId(newConv.id);
    } catch (e: any) {
      toast({ title: "Failed to play scenario", description: e.message, variant: "destructive" });
      setTab("hub");
      setPlayingConversationId(null);
    }
  }

  async function handleEditScenario(id: string) {
    try {
      const result = await supabaseData.fetchScenarioById(id);
      if (!result) {
        toast({ title: "Scenario not found", variant: "destructive" });
        return;
      }
      const { data, coverImage, coverImagePosition } = result;
      
      // Check if this is someone else's scenario (bookmarked/remixable)
      const ownerId = await supabaseData.getScenarioOwner(id);
      const isOwnScenario = ownerId === user?.id;
      
      if (!isOwnScenario && user) {
        // This is a bookmarked/remixed scenario - create a personal clone
        const newScenarioId = uuid();
        
        toast({ 
          title: "Creating your copy...", 
          description: "You'll be editing your own version of this story." 
        });
        
        const clonedData = await supabaseData.cloneScenarioForRemix(
          id,
          newScenarioId,
          user.id,
          data,
          coverImage,
          coverImagePosition
        );
        
        // Track the remix for attribution (find the published scenario ID)
        const savedScenario = savedScenarios.find(s => s.source_scenario_id === id);
        if (savedScenario?.published_scenario_id) {
          await supabaseData.trackRemix(savedScenario.published_scenario_id, newScenarioId, user.id);
        }
        
        // Refresh registry to show the new clone
        const updatedRegistry = await supabaseData.fetchMyScenarios(user.id);
        setRegistry(updatedRegistry);
        
        // Switch to editing the CLONE
        setActiveId(newScenarioId);
        setActiveData(clonedData);
        setActiveCoverImage(coverImage);
        setActiveCoverPosition(coverImagePosition);
        setActiveContentThemes(defaultContentThemes); // New clone starts with empty themes
        
        toast({ 
          title: "Your copy is ready!", 
          description: "Edit freely - your changes won't affect the original." 
        });
      } else {
        // Own scenario - edit directly
        setActiveId(id);
        setActiveData(data);
        setActiveCoverImage(coverImage);
        setActiveCoverPosition(coverImagePosition);
        
        // Load content themes for this scenario
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
      toast({ title: "Failed to edit scenario", description: e.message, variant: "destructive" });
    }
  }

  function handleCreateNewScenario() {
    const id = uuid(); // Use proper UUID for Supabase
    const data = createDefaultScenarioData();
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
      toast({ title: "Error", description: "No active scenario found to save.", variant: "destructive" });
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
    
    try {
      const derivedTitle = dataToSave.world.core.scenarioName || 
                           (dataToSave.characters[0]?.name ? `${dataToSave.characters[0].name}'s Story` : "New Scenario");

      const metadata = {
        title: derivedTitle,
        description: dataToSave.world.core.briefDescription || 
                     truncateLine(dataToSave.world.core.settingOverview || "Created via Builder", 120),
        coverImage: activeCoverImage,
        coverImagePosition: activeCoverPosition,
        tags: ["Custom"]
      };

      await supabaseData.saveScenario(scenarioIdToSave, dataToSave, metadata, user.id);
      
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

      return true;
    } catch (e: any) {
      console.error("Save failed:", e);
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
      return false;
    } finally {
    }
  }, [activeId, activeData, activeCoverImage, activeCoverPosition, user, toast, isValidUuid, migrateScenarioDataIds, library]);

  // Wrapper for backward compatibility - uses current activeData
  const handleSave = useCallback(async (navigateToHub: boolean = false): Promise<boolean> => {
    return handleSaveWithData(null, navigateToHub);
  }, [handleSaveWithData]);

  // Navigation handler - stashes draft to localStorage as safety net, no DB save
  const handleNavigateAway = useCallback(async (targetTab: TabKey | "library") => {
    if (activeId && activeData) {
      try {
        localStorage.setItem(`draft_${activeId}`, JSON.stringify(activeData));
      } catch (e) {
        console.warn("Could not stash draft to localStorage:", e);
      }
    }

    setActiveId(null);
    setActiveData(null);
    setSelectedCharacterId(null);
    setPlayingConversationId(null);
    setTab(targetTab);
  }, [activeId, activeData]);

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
        toast({ title: "Error saving character", description: e.message, variant: "destructive" });
      }
    } else {
      const success = await handleSave();
      if (success) {
        setSelectedCharacterId(null);
        setTab("world"); 
      }
    }
  }

  function handleCancelCharacterEdit() {
    if (!selectedCharacterId) return;
    
    if (tab === "library") {
      // Remove the character from the library
      setLibrary(prev => prev.filter(c => c.id !== selectedCharacterId));
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
      toast({ title: "Character already in scenario", variant: "destructive" });
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
      // This is a bookmarked scenario - ask to remove from collection
      if (!confirm("Remove this story from your bookmarks?")) return;
      
      try {
        await unsaveScenario(savedScenario.published_scenario_id, user!.id);
        
        // Refresh saved scenarios
        const savedScens = await fetchSavedScenarios(user!.id);
        setSavedScenarios(savedScens);
        
        toast({ title: "Removed from bookmarks" });
      } catch (e: any) {
        toast({ title: "Failed to remove bookmark", description: e.message, variant: "destructive" });
      }
    } else {
      // This is the user's own scenario - delete it entirely
      if (!confirm("Delete this entire scenario? This cannot be undone.")) return;
      
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
        toast({ title: "Delete failed", description: e.message, variant: "destructive" });
      }
    }
  }
  
  async function handleResumeFromHistory(scenarioId: string, conversationId: string) {
    setIsResuming(true);
    
    try {
      // Parallel fetch: scenario, recent messages (30), and side characters
      const [scenarioResult, threadResult, sideCharacters] = await Promise.all([
        supabaseData.fetchScenarioForPlay(scenarioId),
        supabaseData.fetchConversationThreadRecent(conversationId, 30),
        supabaseData.fetchSideCharacters(conversationId),
      ]);

      if (!scenarioResult) {
        toast({ title: "Scenario not found", variant: "destructive" });
        setIsResuming(false);
        return;
      }
      if (!threadResult) {
        toast({ title: "Conversation not found", variant: "destructive" });
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
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
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
      toast({ title: "Failed to delete conversation", description: e.message, variant: "destructive" });
      setConversationRegistry(previousRegistry);
    }
  }
  
  async function handleDeleteAllConversations() {
    if (conversationRegistry.length === 0) {
      toast({ title: "No sessions to delete", description: "Your chat history is already empty." });
      return;
    }
    
    if (!confirm(`Delete all ${conversationRegistry.length} saved session${conversationRegistry.length > 1 ? 's' : ''} forever? This cannot be undone.`)) {
      return;
    }
    
    // Store for potential rollback
    const previousRegistry = [...conversationRegistry];
    
    // Optimistic UI update - clear immediately
    setConversationRegistry([]);
    if (activeData) {
      setActiveData(prev => prev ? { ...prev, conversations: [] } : prev);
    }
    
    // Delete from database in background
    try {
      for (const entry of previousRegistry) {
        await supabaseData.deleteConversation(entry.conversationId);
      }
      toast({ title: "All sessions deleted", description: "Your chat history has been cleared." });
    } catch (e: any) {
      // On error, restore previous state
      toast({ title: "Failed to delete sessions", description: e.message, variant: "destructive" });
      setConversationRegistry(previousRegistry);
    }
  }
  
  async function handleRenameConversationFromHistory(scenarioId: string, conversationId: string, newTitle: string) {
    try {
      await supabaseData.renameConversation(conversationId, newTitle);
      
      const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
      setConversationRegistry(updatedConvRegistry);
      
      if (activeId === scenarioId && activeData) {
        const updatedData = { 
          ...activeData, 
          conversations: activeData.conversations.map(c => 
            c.id === conversationId ? { ...c, title: newTitle, updatedAt: now() } : c
          ) 
        };
        setActiveData(updatedData);
      }
      
      
    } catch (e: any) {
      toast({ title: "Failed to rename conversation", description: e.message, variant: "destructive" });
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
        toast({ title: "Failed to delete character", description: e.message, variant: "destructive" });
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
        toast({ title: "AI Fill complete", description: "Empty fields have been filled." });
      } else {
        toast({ title: "Nothing to fill", description: "All fields already have values." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "AI Fill failed", variant: "destructive" });
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
        toast({ title: "AI Generate complete", description: "Character has been enhanced with new sections and filled fields." });
      } else {
        toast({ title: "Generation complete", description: "No new content was needed." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "AI Generate failed", variant: "destructive" });
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
      const isInLib = characterInLibrary[selected.id] || tab === "library";
      
      await supabaseData.saveCharacterToLibrary(selected, user.id);
      
      if (!isInLib) {
        setLibrary(prev => {
          const exists = prev.some(c => c.id === selected.id);
          if (exists) return prev;
          return [selected, ...prev];
        });
        setCharacterInLibrary(prev => ({ ...prev, [selected.id]: true }));
        toast({ title: "Added to library", description: "Character has been added to your library." });
      } else {
        toast({ title: "Character updated", description: "Character profile updated in library." });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingToLibrary(false);
    }
  }

  // Check if current character is in library
  const selectedCharacterIsInLibrary = useMemo(() => {
    if (!selectedCharacterId) return false;
    return characterInLibrary[selectedCharacterId] || tab === "library";
  }, [selectedCharacterId, characterInLibrary, tab]);

  function handleAddSection() {
     if (!selectedCharacterId) return;
     const sourceList = tab === "library" ? library : activeData?.characters;
     const selected = sourceList?.find(c => c.id === selectedCharacterId);
     if (!selected) return;
     handleUpdateCharacter(selected.id, { sections: [...selected.sections, { id: uid('sec'), title: 'New Section', items: [], createdAt: now(), updatedAt: now() }] });
  }

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-10 h-10 rounded-xl bg-[#4a5f7f] flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-[#4a5f7f]/30 mx-auto mb-4">C</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (fatal) return <div className="h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center"><div><h1 className="text-3xl font-black mb-4 text-rose-500">CRITICAL ERROR</h1><p className="max-w-md mb-8">{fatal}</p><button onClick={() => { localStorage.clear(); location.reload(); }} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold">Clear All Data & Restart</button></div></div>;

  const isDraft = activeId ? !registry.some(r => r.id === activeId) : false;
  const activeMeta = registry.find(m => m.id === activeId);

  return (
    <TooltipProvider>
      <div className="h-screen flex bg-white overflow-hidden relative">
        {/* Session resume now navigates immediately to chat with loading skeleton - no overlay needed */}
        <aside className={`flex-shrink-0 bg-[#1a1a1a] flex flex-col border-r border-black shadow-2xl z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}`}>
          <div className={`py-8 ${sidebarCollapsed ? 'px-4' : 'px-8'} transition-all duration-300`}>
            <div className={`flex ${sidebarCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
                <div className="w-10 h-10 rounded-xl bg-[#4a5f7f] flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-[#4a5f7f]/30 flex-shrink-0">C</div>
                {!sidebarCollapsed && (
                  <div className="font-black uppercase tracking-tighter text-2xl leading-none text-white whitespace-nowrap overflow-hidden">Chronicle</div>
                )}
              </div>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
            <SidebarItem active={tab === "hub"} label="Your Stories" icon={<IconsList.Hub />} onClick={() => handleNavigateAway("hub")} collapsed={sidebarCollapsed} />
            <SidebarItem active={tab === "library"} label="Character Library" icon={<IconsList.Library />} onClick={() => handleNavigateAway("library")} collapsed={sidebarCollapsed} />
            <SidebarItem active={tab === "image_library"} label="Image Library" icon={<IconsList.ImageLibrary />} onClick={() => handleNavigateAway("image_library")} collapsed={sidebarCollapsed} />
            
            <SidebarItem active={tab === "conversations"} label="Chat History" icon={<IconsList.Chat />} onClick={() => { setTab("conversations"); }} collapsed={sidebarCollapsed} />
            
            <SidebarItem 
              active={tab === "world" || tab === "characters"} 
              label="Scenario Builder"
              subtitle={activeId ? (activeMeta?.title || "Unsaved Draft") : undefined}
              icon={<IconsList.Builder />} 
              onClick={() => {
                if (activeId) setTab("world");
                else handleCreateNewScenario();
              }}
              className={!activeId ? "opacity-80" : ""}
              collapsed={sidebarCollapsed}
            />

            {isAdminUser(user?.id) && (
              <div className="pt-4 mt-4 border-t border-white/10">
                <SidebarItem active={tab === "admin"} label="Admin" icon={<Settings className="w-5 h-5" />} onClick={() => { setAdminActiveTool('hub'); setTab("admin"); }} collapsed={sidebarCollapsed} />
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-white/10">
              <SidebarItem active={tab === "account"} label="Account" icon={<UserCircle className="w-5 h-5" />} onClick={() => setTab("account")} collapsed={sidebarCollapsed} />
            </div>
          </nav>
        </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {(tab === "characters" || tab === "world" || tab === "library" || tab === "conversations" || tab === "hub" || tab === "image_library" || tab === "gallery" || tab === "admin" || tab === "account") && (
          <header className="flex-shrink-0 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-8 shadow-sm">
            <div className="flex items-center gap-4">
              {tab === "library" && (
                <div className="flex items-center gap-3">
                  {selectedCharacterId && (
                    <button 
                      onClick={() => setSelectedCharacterId(null)} 
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                  )}
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Character Library
                  </h1>
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
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Scenario Builder
                  </h1>
                </div>
              )}
              {tab === "conversations" && (
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Chat History
                </h1>
              )}
              {tab === "hub" && (
                <div className="flex items-center gap-6">
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Your Stories
                  </h1>
                  <div className="overflow-x-auto scrollbar-none flex-shrink-0">
                    <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]">
                      <button
                        onClick={() => setHubFilter("my")}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                          hubFilter === "my" 
                            ? "bg-[#4a5f7f] text-white shadow-sm" 
                            : "text-[#a1a1aa] hover:text-[#e4e4e7]"
                        )}
                      >
                        My Stories
                      </button>
                      <button
                        onClick={() => setHubFilter("bookmarked")}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                          hubFilter === "bookmarked" 
                            ? "bg-[#4a5f7f] text-white shadow-sm" 
                            : "text-[#a1a1aa] hover:text-[#e4e4e7]"
                        )}
                      >
                        Saved Stories
                      </button>
                      <button
                        onClick={() => setHubFilter("published")}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                          hubFilter === "published" 
                            ? "bg-[#4a5f7f] text-white shadow-sm" 
                            : "text-[#a1a1aa] hover:text-[#e4e4e7]"
                        )}
                      >
                        Published
                      </button>
                      <button
                        onClick={() => setHubFilter("all")}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                          hubFilter === "all" 
                            ? "bg-[#4a5f7f] text-white shadow-sm" 
                            : "text-[#a1a1aa] hover:text-[#e4e4e7]"
                        )}
                      >
                        All
                      </button>
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
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Image Library
                  </h1>
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
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
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
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Account
                  </h1>
                </div>
              )}
              {tab === "gallery" && (
                <div className="flex items-center gap-6">
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
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
                            "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                            gallerySortBy === option.key 
                              ? "bg-[#4a5f7f] text-white shadow-sm" 
                              : "text-[#a1a1aa] hover:text-[#e4e4e7]"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {tab === "world" && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingAndClosing(true);
                      const safety = setTimeout(() => { console.warn('Save&Close safety timeout'); setIsSavingAndClosing(false); }, 12000);
                      try {
                        await handleSave(true);
                      } finally { clearTimeout(safety); setIsSavingAndClosing(false); }
                    }}
                    disabled={isSavingAndClosing || isSaving}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSavingAndClosing ? 'Saving...' : 'Save and Close'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSaving(true);
                      const safety = setTimeout(() => { console.warn('Save safety timeout'); setIsSaving(false); }, 12000);
                      try {
                        await handleSave(false);
                      } finally { clearTimeout(safety); setIsSaving(false); }
                    }}
                    disabled={isSaving || isSavingAndClosing}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
              {tab === "conversations" && conversationRegistry.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllConversations}
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 text-sm font-bold"
                >
                  Delete All
                </button>
              )}
              {tab === "hub" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl px-3 py-2 border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95"
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
              )}
              {tab === "image_library" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl px-3 py-2 border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95"
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
                              text-white text-[10px] font-bold leading-none uppercase tracking-wider
                              shadow-[0_12px_40px_rgba(0,0,0,0.45)]
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

                      {/* Save (Quick Save) Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSaving(true);
                          const safety = setTimeout(() => { console.warn('CharSave safety timeout'); setIsSaving(false); }, 12000);
                          try {
                            await handleSave(false);
                          } finally { clearTimeout(safety); setIsSaving(false); }
                        }}
                        disabled={isSaving || isSavingAndClosing}
                        className="flex h-10 px-6 items-center justify-center gap-2
                          rounded-xl border border-[hsl(var(--ui-border))] 
                          bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                          text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
hover:brightness-125 active:brightness-150 disabled:opacity-50 disabled:pointer-events-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                          transition-colors"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>

                      {/* Cancel Button - Dark surface style */}
                      <button
                        type="button"
                        onClick={handleCancelCharacterEdit}
                        className="flex h-10 px-6 items-center justify-center gap-2
                          rounded-xl border border-[hsl(var(--ui-border))] 
                          bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                          text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
                          hover:bg-white/5 active:bg-white/10
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                          transition-colors"
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
                            className="flex h-10 px-6 items-center justify-center gap-2
                              rounded-xl border border-[hsl(var(--ui-border))] 
                              bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                              text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
                              hover:brightness-125 active:brightness-150 disabled:opacity-50 disabled:pointer-events-none
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                              transition-colors"
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
                        className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCharacterPickerOpen(true)}
                        className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
                      >
                        Import from Library
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCharacter}
                        className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
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

        <div className="flex-1 overflow-hidden">
          {tab === "hub" && (
            <div 
              className="relative w-full h-full bg-black"
              style={selectedBackgroundUrl ? {
                backgroundImage: `url(${selectedBackgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : undefined}
            >
              {selectedBackgroundUrl && (
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
              )}
              <ScenarioHub
                registry={filteredRegistry}
                onPlay={handlePlayScenario}
                onEdit={handleEditScenario}
                onDelete={handleDeleteScenario}
                onCreate={handleCreateNewScenario}
                publishedScenarioIds={publishedScenarioIds}
                contentThemesMap={contentThemesMap}
                publishedScenariosData={publishedScenariosData}
                ownerUsername={userProfile?.username || undefined}
              />
            </div>
          )}

          {tab === "gallery" && (
            <GalleryHub onPlay={handleGalleryPlay} onSaveChange={handleGallerySaveChange} sortBy={gallerySortBy} onSortChange={setGallerySortBy} />
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
              <ImageLibraryTab 
                onFolderChange={(inFolder, exitFn) => {
                  setIsInImageFolder(inFolder);
                  imageLibraryExitFolderRef.current = exitFn || null;
                }}
              />
            </div>
          )}

          {tab === "library" && (
            <div className="p-10 overflow-y-auto h-full bg-black">
              <CharactersTab
                appData={{ ...createDefaultScenarioData(), characters: library }}
                selectedId={selectedCharacterId}
                onSelect={setSelectedCharacterId}
                onUpdate={handleUpdateCharacter}
                onDelete={handleDeleteCharacterFromList}
                onAddSection={handleAddSection}
                onAddNew={handleCreateCharacter}
              />
            </div>
          )}

          {tab === "characters" && activeData && (
            <div className="p-10 overflow-y-auto h-full">
              <CharactersTab
                appData={activeData}
                selectedId={selectedCharacterId}
                onSelect={setSelectedCharacterId}
                onUpdate={handleUpdateCharacter}
                onDelete={handleDeleteCharacterFromList}
                onAddSection={handleAddSection}
              />
            </div>
          )}

          {tab === "world" && activeData && activeId && (
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
                // Auto-save content themes if we have a valid scenario ID
                if (activeId && user) {
                  try {
                    await supabaseData.saveContentThemes(activeId, themes);
                  } catch (e) {
                    console.error('Failed to save content themes:', e);
                  }
                }
              }}
              onNavigateToCharacters={() => { setTab("characters"); setSelectedCharacterId(null); }}
              onSelectCharacter={(id) => { setSelectedCharacterId(id); setTab("characters"); }}
            />
          )}

          {tab === "conversations" && (
            <div className="relative p-10 overflow-y-auto h-full bg-black">
              {isResuming && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                  <p className="text-white font-medium text-lg">Loading session...</p>
                </div>
              )}
              <ConversationsTab
                globalRegistry={conversationRegistry}
                onResume={handleResumeFromHistory}
                onRename={(scenarioId, conversationId) => {
                  const entry = conversationRegistry.find(e => e.conversationId === conversationId);
                  const title = prompt("Rename session:", entry?.conversationTitle || "")?.trim();
                  if (title) {
                    handleRenameConversationFromHistory(scenarioId, conversationId, title);
                  }
                }}
                onDelete={(scenarioId, conversationId) => {
                  if (confirm("Delete this saved session forever?")) {
                    handleDeleteConversationFromHistory(scenarioId, conversationId);
                  }
                }}
              />
            </div>
          )}

          {tab === "chat_interface" && activeId && playingConversationId && (
            <ChatInterfaceTab
              scenarioId={activeId}
              appData={activeData || createDefaultScenarioData()}
              conversationId={playingConversationId}
              modelId={globalModelId}
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
                        toast({ 
                          title: "Save failed", 
                          description: "Your messages may not be saved.", 
                          variant: "destructive" 
                        });
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
                const currentSettings = activeData?.uiSettings || createDefaultScenarioData().uiSettings;
                handleUpdateActive({ uiSettings: { ...currentSettings, ...patch } });
              }}
              onUpdateSideCharacters={(sideCharacters) => handleUpdateActive({ sideCharacters })}
              onLoadOlderMessages={handleLoadOlderMessages}
              hasMoreMessages={!!(playingConversationId && hasMoreMessagesMap[playingConversationId])}
            />
          )}


          {tab === "admin" && (
            <AdminPage activeTool={adminActiveTool} onSetActiveTool={setAdminActiveTool} selectedModelId={globalModelId} onSelectModel={setGlobalModelId} />
          )}

          {tab === "account" && (
            <div className="p-10 overflow-y-auto h-full bg-[#121214]">
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
          refreshLibrary={async () => {
            const updated = await supabaseData.fetchCharacterLibrary();
            setLibrary(updated);
            return updated;
          }}
          onSelect={handleImportCharacter}
          onClose={() => setIsCharacterPickerOpen(false)}
        />
      )}

      <BackgroundPickerModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        title="Your Stories Background"
        selectedBackgroundId={selectedHubBackgroundId}
        backgrounds={hubBackgrounds}
        onSelectBackground={handleSelectBackground}
        onUpload={handleUploadBackground}
        onDelete={handleDeleteBackground}
        isUploading={isUploadingBackground}
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
      />

      {/* Delete Character Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        onConfirm={() => {
          if (deleteConfirmId) executeDeleteCharacter(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        message={tab === "library" ? "This will permanently delete the character from your Global Library." : "This will remove the character from this scenario."}
      />

      {/* AI Prompt Modal */}
      <AIPromptModal
        isOpen={aiPromptModal !== null}
        onClose={() => setAiPromptModal(null)}
        onSubmit={handleAIPromptSubmit}
        mode={aiPromptModal?.mode || 'fill'}
        isProcessing={isAiFilling || isAiGenerating}
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
