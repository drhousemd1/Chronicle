import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScenarioData, Character, Conversation, Message, CharacterTraitSection, Scene, TimeOfDay, SideCharacter, CharacterSessionState, Memory, WorldCore } from '../../types';
import { Button, TextArea } from './UI';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { uid, now, uuid } from '../../services/storage';
import { generateRoleplayResponseStream } from '../../services/llm';
import { RefreshCw, MoreVertical, Copy, Pencil, Trash2, ChevronUp, ChevronDown, Sunrise, Sun, Sunset, Moon, Loader2, StepForward, Settings, Image as ImageIcon, Brain, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as supabaseData from '@/services/supabase-data';
import { 
  parseMessageSegments, 
  detectNewCharacters, 
  createSideCharacter, 
  getKnownCharacterNames,
  findCharacterByName,
  MessageSegment
} from '@/services/side-character-generator';
import { normalizePlaceholderNames, PlaceholderNameMap } from '@/services/placeholder-name-guard';
import { SideCharacterCard } from './SideCharacterCard';
import { CharacterEditModal, CharacterEditDraft } from './CharacterEditModal';
import { ScrollableSection } from './ScrollableSection';
import { SidebarThemeModal } from './SidebarThemeModal';
import { MemoriesModal } from './MemoriesModal';
import { MemoryQuickSaveButton } from './MemoryQuickSaveButton';
import { UserBackground } from '@/types';
import { getStyleById, DEFAULT_STYLE_ID } from '@/constants/avatar-styles';
import { LabeledToggle } from '@/components/ui/labeled-toggle';

interface ChatInterfaceTabProps {
  scenarioId: string;
  appData: ScenarioData;
  conversationId: string;
  modelId: string;
  onUpdate: (convs: Conversation[]) => void;
  onBack: () => void;
  onSaveScenario: (conversations?: Conversation[]) => void;
  onUpdateUiSettings?: (patch: { showBackgrounds?: boolean; transparentBubbles?: boolean; darkMode?: boolean; offsetBubbles?: boolean; proactiveCharacterDiscovery?: boolean; dynamicText?: boolean; proactiveNarrative?: boolean; narrativePov?: 'first' | 'third'; nsfwIntensity?: 'normal' | 'high'; realismMode?: boolean }) => void;
  onUpdateSideCharacters?: (sideCharacters: SideCharacter[]) => void;
  // Lazy loading props
  onLoadOlderMessages?: (conversationId: string, beforeCreatedAt: string) => Promise<Message[]>;
  hasMoreMessages?: boolean;
}

const FormattedMessage: React.FC<{ text: string; dynamicText?: boolean }> = ({ text, dynamicText = true }) => {
  const tokens = useMemo(() => {
    const cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();
    const regex = /(\*.*?\*)|(".*?")|(\(.*?\))/g;

    const parts: { type: string; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(cleanRaw)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'plain', content: cleanRaw.slice(lastIndex, match.index) });
      }

      const found = match[0];
      if (found.startsWith('*')) {
        parts.push({ type: 'action', content: found.slice(1, -1) });
      } else if (found.startsWith('"')) {
        parts.push({ type: 'speech', content: found.slice(1, -1) });
      } else if (found.startsWith('(')) {
        parts.push({ type: 'thought', content: found.slice(1, -1) });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < cleanRaw.length) {
      parts.push({ type: 'plain', content: cleanRaw.slice(lastIndex) });
    }

    return parts;
  }, [text]);

  return (
    // whitespace-pre-wrap preserves newlines and paragraph spacing
    <div className="whitespace-pre-wrap">
      {tokens.map((token, i) => {
        // Book-style: all white, consistent font
        if (!dynamicText) {
          // For speech, add quotes back (standard in books)
          if (token.type === 'speech') {
            return (
              <span key={i} className="text-white font-medium">
                "{token.content}"
              </span>
            );
          }
          // For actions and thoughts, no symbols (not standard in books)
          return (
            <span key={i} className="text-white font-medium">
              {token.content}
            </span>
          );
        }
        
        // Dynamic text styling (default)
        if (token.type === 'speech') {
          return (
            <span key={i} className="text-white font-medium">
              "{token.content}"
            </span>
          );
        }
        if (token.type === 'action') {
          return (
            <span key={i} className="text-slate-400 italic">
               {token.content}
            </span>
          );
        }
        if (token.type === 'thought') {
          return (
            <span 
              key={i} 
              className="text-indigo-200/90 text-sm italic font-light tracking-tight animate-in fade-in zoom-in-95 duration-500"
              style={{
                textShadow: '0 0 8px rgba(129, 140, 248, 0.6), 0 0 16px rgba(129, 140, 248, 0.4), 0 0 24px rgba(129, 140, 248, 0.2)'
              }}
            >
              {token.content}
            </span>
          );
        }
        return (
          <span key={i} className="text-slate-300">
            {token.content}
          </span>
        );
      })}
    </div>
  );
};

/**
 * Resolve a segment's speaker to the identity that will actually be rendered.
 * This normalizes null (default speaker) to the actual character name.
 */
const resolveRenderedSpeakerName = (
  segment: MessageSegment, 
  isAi: boolean, 
  appData: ScenarioData,
  userChar: Character | null
): string => {
  if (segment.speakerName) {
    // Has explicit speaker tag - use it
    return segment.speakerName.toLowerCase();
  } else if (!isAi) {
    // User message without tag - defaults to user's character
    return (userChar?.name || 'You').toLowerCase();
  } else {
    // AI message without tag - defaults to first AI character
    const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
    return (aiChars[0]?.name || 'Narrator').toLowerCase();
  }
};

/**
 * Merge consecutive segments by RESOLVED speaker identity.
 * This ensures that a null speaker (renders as Ashley) merges with an explicit "Ashley:" tag.
 */
const mergeByRenderedSpeaker = (
  rawSegments: MessageSegment[], 
  isAi: boolean,
  appData: ScenarioData,
  userChar: Character | null
): MessageSegment[] => {
  if (rawSegments.length <= 1) return rawSegments;
  
  // Resolve speaker names first (lowercased for comparison)
  const withResolvedNames = rawSegments.map(seg => ({
    ...seg,
    resolvedName: resolveRenderedSpeakerName(seg, isAi, appData, userChar)
  }));
  
  // Merge consecutive segments with same resolved name
  const merged: MessageSegment[] = [];
  let current = withResolvedNames[0];
  
  for (let i = 1; i < withResolvedNames.length; i++) {
    const next = withResolvedNames[i];
    if (current.resolvedName === next.resolvedName) {
      current = {
        ...current,
        content: current.content + '\n\n' + next.content
      };
    } else {
      // Use the original speakerName (preserve casing) for rendering
      merged.push({ speakerName: current.speakerName, content: current.content });
      current = next;
    }
  }
  merged.push({ speakerName: current.speakerName, content: current.content });
  
  return merged;
};

export const ChatInterfaceTab: React.FC<ChatInterfaceTabProps> = ({
  scenarioId,
  appData,
  conversationId,
  modelId,
  onUpdate,
  onBack,
  onSaveScenario,
  onUpdateUiSettings,
  onUpdateSideCharacters,
  onLoadOlderMessages,
  hasMoreMessages = false
}) => {
  const [input, setInput] = useState('');
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [formattedStreamingContent, setFormattedStreamingContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('day');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Lazy loading state for scroll-based message loading
  const isLoadingOlderRef = useRef(false);
  const [localHasMore, setLocalHasMore] = useState(hasMoreMessages);
  // Edit modal state for character cards
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState<Character | SideCharacter | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Session states for per-playthrough character overrides
  const [sessionStates, setSessionStates] = useState<CharacterSessionState[]>([]);
  const [sessionStatesLoaded, setSessionStatesLoaded] = useState(false);
  
  // Sidebar theme state
  const [isSidebarThemeOpen, setIsSidebarThemeOpen] = useState(false);
  const [sidebarBackgrounds, setSidebarBackgrounds] = useState<UserBackground[]>([]);
  const [selectedSidebarBgId, setSelectedSidebarBgId] = useState<string | null>(null);
  const [isUploadingSidebarBg, setIsUploadingSidebarBg] = useState(false);
  const [sidebarBgIsLight, setSidebarBgIsLight] = useState<boolean>(true);
  
  // Memories state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoriesEnabled, setMemoriesEnabled] = useState(true);
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);
  const [memoriesLoaded, setMemoriesLoaded] = useState(false);
  
  // Track which characters are showing the "updating" indicator
  const [updatingCharacterIds, setUpdatingCharacterIds] = useState<Set<string>>(new Set());
  
  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [isMainCharacterDelete, setIsMainCharacterDelete] = useState(false);
  
  // Session-scoped world core overrides (global across all characters)
  const [worldCoreSessionOverrides, setWorldCoreSessionOverrides] = useState<Partial<WorldCore> | null>(null);
  
  // Build effective world core by merging base with session overrides
  const effectiveWorldCore = useMemo((): WorldCore => {
    if (!worldCoreSessionOverrides) return appData.world.core;
    return {
      ...appData.world.core,
      ...worldCoreSessionOverrides,
      // Deep merge arrays that may have been overridden
      structuredLocations: worldCoreSessionOverrides.structuredLocations ?? appData.world.core.structuredLocations,
      customWorldSections: worldCoreSessionOverrides.customWorldSections ?? appData.world.core.customWorldSections,
      storyGoals: worldCoreSessionOverrides.storyGoals ?? appData.world.core.storyGoals,
    };
  }, [appData.world.core, worldCoreSessionOverrides]);
  
  // Persistent map for placeholder name replacements (ensures consistency across the conversation)
  const placeholderMapRef = useRef<PlaceholderNameMap>({});
  
  // Ref to always hold current sideCharacters - avoids stale closure in async callbacks
  const sideCharactersRef = useRef<SideCharacter[]>(appData.sideCharacters || []);
  useEffect(() => {
    sideCharactersRef.current = appData.sideCharacters || [];
  }, [appData.sideCharacters]);
  
  // Load session states on mount - DEFERRED to not block first render
  useEffect(() => {
    // Skip loading if we're in the "loading" state (waiting for scenario data)
    if (conversationId === "loading") return;
    
    // Use requestAnimationFrame to defer non-critical data loading
    // This allows the UI shell to render first
    const frameId = requestAnimationFrame(() => {
      supabaseData.fetchSessionStates(conversationId).then(states => {
        setSessionStates(states);
        setSessionStatesLoaded(true);
      }).catch(err => {
        console.error('Failed to load session states:', err);
        setSessionStatesLoaded(true);
      });
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [conversationId]);
  
  // Load sidebar backgrounds on mount - DEFERRED to not block first render
  useEffect(() => {
    // Skip loading if we're in the "loading" state
    if (conversationId === "loading") return;
    
    // Defer sidebar background loading to next frame
    const frameId = requestAnimationFrame(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabaseData.fetchSidebarBackgrounds(user.id).then(bgs => {
            setSidebarBackgrounds(bgs);
            const selected = bgs.find(bg => bg.isSelected);
            if (selected) setSelectedSidebarBgId(selected.id);
          }).catch(err => {
            console.error('Failed to load sidebar backgrounds:', err);
          });
        }
      });
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [conversationId]);
  
  // Load memories on mount - DEFERRED to not block first render
  useEffect(() => {
    if (conversationId === "loading") return;
    
    const frameId = requestAnimationFrame(() => {
      supabaseData.fetchMemories(conversationId).then(mems => {
        setMemories(mems);
        setMemoriesLoaded(true);
      }).catch(err => {
        console.error('Failed to load memories:', err);
        setMemoriesLoaded(true);
      });
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [conversationId]);
  
  // Memory CRUD handlers
  const handleCreateMemory = async (content: string, day: number | null, timeOfDay: TimeOfDay | null, sourceMessageId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const memory = await supabaseData.createMemory(
      conversationId,
      user.id,
      content,
      day,
      timeOfDay,
      sourceMessageId ? 'message' : 'user',
      sourceMessageId
    );
    setMemories(prev => [...prev, memory]);
    return memory;
  };
  
  const handleUpdateMemory = async (id: string, content: string) => {
    await supabaseData.updateMemory(id, content);
    setMemories(prev => prev.map(m => m.id === id ? { ...m, content, updatedAt: Date.now() } : m));
  };
  
  const handleDeleteMemory = async (id: string) => {
    await supabaseData.deleteMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };
  
  const handleDeleteAllMemories = async () => {
    await supabaseData.deleteAllMemories(conversationId);
    setMemories([]);
  };
  
  const handleQuickSaveMemory = async (content: string, day: number | null, timeOfDay: TimeOfDay | null, sourceMessageId: string) => {
    await handleCreateMemory(content, day, timeOfDay, sourceMessageId);
  };
  
  // Get all character names for memory extraction context
  const allCharacterNames = useMemo(() => {
    const mainNames = appData.characters.map(c => c.name);
    const sideNames = (appData.sideCharacters || []).map(sc => sc.name);
    return [...mainNames, ...sideNames];
  }, [appData.characters, appData.sideCharacters]);
  
  // Sidebar background handlers
  const selectedSidebarBgUrl = useMemo(() => {
    if (!selectedSidebarBgId) return null;
    return sidebarBackgrounds.find(bg => bg.id === selectedSidebarBgId)?.imageUrl || null;
  }, [selectedSidebarBgId, sidebarBackgrounds]);
  
  // Analyze sidebar background brightness for dynamic text color
  const analyzeImageBrightness = useCallback((imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const sampleSize = 50;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;
      
      let totalLuminosity = 0;
      const pixelCount = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuminosity += (0.299 * r + 0.587 * g + 0.114 * b);
      }
      
      const avgLuminosity = totalLuminosity / pixelCount;
      setSidebarBgIsLight(avgLuminosity > 128);
    };
    img.src = imageUrl;
  }, []);
  
  useEffect(() => {
    if (selectedSidebarBgUrl) {
      analyzeImageBrightness(selectedSidebarBgUrl);
    } else {
      setSidebarBgIsLight(true);
    }
  }, [selectedSidebarBgUrl, analyzeImageBrightness]);
  
  const handleUploadSidebarBg = async (file: File) => {
    try {
      setIsUploadingSidebarBg(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const filename = `sidebar-${Date.now()}-${file.name}`;
      const imageUrl = await supabaseData.uploadSidebarBackgroundImage(user.id, file, filename);
      const newBg = await supabaseData.createSidebarBackground(user.id, imageUrl);
      setSidebarBackgrounds(prev => [newBg, ...prev]);
      toast.success('Background uploaded!');
    } catch (err) {
      console.error('Failed to upload sidebar background:', err);
      toast.error('Failed to upload background');
    } finally {
      setIsUploadingSidebarBg(false);
    }
  };
  
  const handleSelectSidebarBg = async (id: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabaseData.setSelectedSidebarBackground(user.id, id);
      setSelectedSidebarBgId(id);
      setSidebarBackgrounds(prev => prev.map(bg => ({ ...bg, isSelected: bg.id === id })));
    } catch (err) {
      console.error('Failed to select sidebar background:', err);
      toast.error('Failed to update selection');
    }
  };
  
  const handleDeleteSidebarBg = async (id: string, imageUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabaseData.deleteSidebarBackground(user.id, id, imageUrl);
      setSidebarBackgrounds(prev => prev.filter(bg => bg.id !== id));
      if (selectedSidebarBgId === id) setSelectedSidebarBgId(null);
      toast.success('Background deleted');
    } catch (err) {
      console.error('Failed to delete sidebar background:', err);
      toast.error('Failed to delete background');
    }
  };
  
// Helper to get effective character (base + session overrides merged)
  const getEffectiveCharacter = useCallback((baseChar: Character): Character & { previousNames?: string[] } => {
    const sessionState = sessionStates.find(s => s.characterId === baseChar.id);
    if (!sessionState) return baseChar;
    
    return {
      ...baseChar,
      name: sessionState.name || baseChar.name,
      previousNames: sessionState.previousNames || [],  // Hidden field for name history
      age: sessionState.age || baseChar.age,
      sexType: sessionState.sexType || baseChar.sexType,
      roleDescription: sessionState.roleDescription || baseChar.roleDescription,
      location: sessionState.location || baseChar.location,
      currentMood: sessionState.currentMood || baseChar.currentMood,
      physicalAppearance: { ...baseChar.physicalAppearance, ...sessionState.physicalAppearance },
      currentlyWearing: sessionState.currentlyWearing || baseChar.currentlyWearing,
      preferredClothing: sessionState.preferredClothing 
        ? { ...baseChar.preferredClothing, ...sessionState.preferredClothing }
        : baseChar.preferredClothing,
      sections: sessionState.customSections || baseChar.sections,
      // Session-scoped goals overrides
      goals: sessionState.goals?.length ? sessionState.goals : (baseChar.goals || []),
      // Session-scoped avatar overrides
      avatarDataUrl: sessionState.avatarUrl || baseChar.avatarDataUrl,
      avatarPosition: sessionState.avatarPosition || baseChar.avatarPosition,
      // Session-scoped control and role overrides
      controlledBy: sessionState.controlledBy || baseChar.controlledBy,
      characterRole: sessionState.characterRole || baseChar.characterRole,
    };
  }, [sessionStates]);

  // Session-aware character lookup - searches effective names, nicknames, and previousNames
  // Returns the EFFECTIVE character data (with session overrides merged)
  // Build appData with session-merged characters for LLM context
  // This ensures the AI sees current locations, moods, controlledBy, etc.
  const buildLLMAppData = useCallback((): ScenarioData => {
    return {
      ...appData,
      characters: appData.characters.map(c => getEffectiveCharacter(c)),
      world: { ...appData.world, core: effectiveWorldCore }
    };
  }, [appData, getEffectiveCharacter, effectiveWorldCore]);

  const findCharacterWithSession = useCallback((name: string | null): (Character & { previousNames?: string[] }) | SideCharacter | null => {
    if (!name) return null;
    const nameLower = name.toLowerCase().trim();
    
    // Build effective main characters with session overrides
    const effectiveMainChars = appData.characters.map(c => getEffectiveCharacter(c));
    
    // Search effective main characters by current name
    let found = effectiveMainChars.find(c => c.name.toLowerCase() === nameLower);
    if (found) return found;
    
    // Search main characters by nicknames
    found = effectiveMainChars.find(c => {
      if (!c.nicknames) return false;
      return c.nicknames.split(',').some(n => n.trim().toLowerCase() === nameLower);
    });
    if (found) return found;
    
    // Search main characters by previousNames (hidden field)
    found = effectiveMainChars.find(c => {
      if (!c.previousNames?.length) return false;
      return c.previousNames.some(n => n.toLowerCase() === nameLower);
    });
    if (found) return found;
    
    // Search side characters by name
    const sideChars = appData.sideCharacters || [];
    let sideFound = sideChars.find(sc => sc.name.toLowerCase() === nameLower);
    if (sideFound) return sideFound;
    
    // Search side characters by nicknames
    sideFound = sideChars.find(sc => {
      if (!sc.nicknames) return false;
      return sc.nicknames.split(',').some(n => n.trim().toLowerCase() === nameLower);
    });
    if (sideFound) return sideFound;
    
    return null;
  }, [appData.characters, appData.sideCharacters, getEffectiveCharacter]);

  const conversation = appData.conversations.find(c => c.id === conversationId);
  
  // Merge all characters (main characters with session overrides + side characters)
  // and dynamically group by their effective characterRole
  // NOTE: Must be called before any early returns to maintain hooks order
  const allCharactersForDisplay = useMemo(() => {
    if (conversationId === "loading") return [];
    const effectiveMainChars = appData.characters.map(c => ({
      ...getEffectiveCharacter(c),
      _source: 'character' as const
    }));
    const sideChars = (appData.sideCharacters || []).map(sc => ({
      ...sc,
      _source: 'sideCharacter' as const
    }));
    return [...effectiveMainChars, ...sideChars];
  }, [appData.characters, appData.sideCharacters, getEffectiveCharacter, conversationId]);
  
  const mainCharactersForDisplay = useMemo(() => 
    allCharactersForDisplay.filter(c => c.characterRole === 'Main'),
    [allCharactersForDisplay]
  );
  const sideCharactersForDisplay = useMemo(() => 
    allCharactersForDisplay.filter(c => c.characterRole === 'Side'),
    [allCharactersForDisplay]
  );

  // Debug: log conversation state on mount and when it changes
  useEffect(() => {
    if (conversationId === "loading") return;
    console.log('[ChatInterfaceTab] conversationId:', conversationId);
    console.log('[ChatInterfaceTab] conversation found:', !!conversation);
    console.log('[ChatInterfaceTab] messages count:', conversation?.messages?.length);
    console.log('[ChatInterfaceTab] messages:', conversation?.messages?.map(m => ({ id: m.id, role: m.role, text: m.text.slice(0, 50) })));
  }, [conversationId, conversation]);
  
  // Trigger update indicator for a character (10-second duration)
  // MUST be defined before early return to maintain hooks order
  const showCharacterUpdateIndicator = useCallback((characterId: string) => {
    setUpdatingCharacterIds(prev => new Set(prev).add(characterId));
    setTimeout(() => {
      setUpdatingCharacterIds(prev => {
        const next = new Set(prev);
        next.delete(characterId);
        return next;
      });
    }, 10000); // 10 second duration for better visibility
  }, []);
  
  // Active scene computed from scene ID
  // MUST be defined before early return to maintain hooks order
  const activeScene = useMemo(() =>
    appData.scenes.find(s => s.id === activeSceneId) || null
  , [appData.scenes, activeSceneId]);
  
  // Auto-scroll effect - only scroll to bottom when user is already near bottom
  // This prevents scroll jumping when older messages are prepended at the top
  // MUST be defined before early return to maintain hooks order
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const currentCount = conversation?.messages?.length || 0;
      const prevCount = prevMessageCountRef.current;
      
      // If messages were added (not prepended older ones), auto-scroll if near bottom
      if (currentCount >= prevCount || streamingContent) {
        if (isNearBottomRef.current) {
          el.scrollTop = el.scrollHeight;
        }
      }
      prevMessageCountRef.current = currentCount;
    }
  }, [conversation?.messages, streamingContent]);
  
  // Sync hasMoreMessages prop to local state
  useEffect(() => {
    setLocalHasMore(hasMoreMessages);
  }, [hasMoreMessages]);
  
  // Scroll-based lazy loading of older messages
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Track if user is near bottom (for auto-scroll logic)
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    
    // Check if user scrolled near top and we have more messages to load
    if (
      el.scrollTop < 200 && 
      localHasMore && 
      !isLoadingOlderRef.current && 
      onLoadOlderMessages && 
      conversation?.messages?.length
    ) {
      const oldestMessage = conversation.messages[0];
      if (!oldestMessage) return;
      
      isLoadingOlderRef.current = true;
      const prevScrollHeight = el.scrollHeight;
      
      // Convert timestamp to ISO string for the query
      const beforeCreatedAt = new Date(oldestMessage.createdAt).toISOString();
      
      onLoadOlderMessages(conversationId, beforeCreatedAt).then(olderMessages => {
        if (olderMessages.length === 0) {
          setLocalHasMore(false);
        }
        
        // After messages are prepended by parent, preserve scroll position
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            scrollRef.current.scrollTop = newScrollHeight - prevScrollHeight;
          }
          isLoadingOlderRef.current = false;
        });
      }).catch(err => {
        console.error('[ChatInterfaceTab] Failed to load older messages:', err);
        isLoadingOlderRef.current = false;
      });
    }
  }, [localHasMore, onLoadOlderMessages, conversation?.messages, conversationId]);

  // Sync day/time state from conversation
  // MUST be defined before early return to maintain hooks order
  useEffect(() => {
    if (conversation) {
      setCurrentDay(conversation.currentDay || 1);
      setCurrentTimeOfDay(conversation.currentTimeOfDay || 'day');
    }
  }, [conversation?.id]);
  
  // Scene detection effect - detects which background scene to show based on conversation
  // MUST be defined before early return to maintain hooks order
  useEffect(() => {
    // Skip processing if in loading state
    if (conversationId === "loading" || !conversation) return;
    
    // For the FIRST message (opening dialog), always use starting scene
    const isInitialState = conversation?.messages.length === 1;
    
    if (isInitialState) {
      const startingScene = appData.scenes.find(s => s.isStartingScene);
      if (startingScene) {
        setActiveSceneId(startingScene.id);
        return;
      }
    }
    
    // First, try to find a [SCENE: tag] command in messages (highest priority)
    let foundSceneTag = false;
    if (conversation?.messages.length) {
      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        const match = conversation.messages[i].text.match(/\[SCENE:\s*(.*?)\]/);
        if (match) {
          const tag = match[1].trim();
          const scene = appData.scenes.find(s => 
            (s.tags ?? []).some(t => t.toLowerCase() === tag.toLowerCase())
          );
          if (scene) {
            setActiveSceneId(scene.id);
            foundSceneTag = true;
            break;
          }
        }
      }
    }
    
    // Second pass: Keyword-based detection if no explicit tag found
    if (!foundSceneTag && conversation?.messages.length && appData.scenes.length > 0) {
      const sceneScores: { sceneId: string; score: number; matchedInMostRecent: boolean }[] = [];
      const allMessages = conversation.messages;
      const recentMessages = allMessages.slice(-5).filter((_, idx, arr) => {
        const originalIndex = allMessages.length - arr.length + idx;
        return !(originalIndex === 0 && allMessages.length > 1);
      });
      
      const mostRecentMessageText = recentMessages.length > 0 
        ? recentMessages[recentMessages.length - 1].text.toLowerCase() 
        : '';
      
      const checkTagMatch = (tagKeyword: string, messageText: string): { matched: boolean; percentage: number } => {
        const stopWords = ['a', 'an', 'the', 'with', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or'];
        const tagWords = tagKeyword.split(/\s+/).filter(word => 
          word.length > 1 && !stopWords.includes(word)
        );
        
        if (tagWords.length === 0) return { matched: false, percentage: 0 };
        
        let matchedWords = 0;
        for (const word of tagWords) {
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordRegex = new RegExp(`\\b${escapedWord}\\b`, 'i');
          if (wordRegex.test(messageText)) {
            matchedWords++;
          }
        }
        
        const matchPercentage = matchedWords / tagWords.length;
        return { matched: matchPercentage >= 0.5, percentage: matchPercentage };
      };
      
      for (const scene of appData.scenes) {
        let score = 0;
        let matchedInMostRecent = false;
        const sceneTags = scene.tags ?? [];
        
        for (const tag of sceneTags) {
          if (tag && tag.trim() !== '') {
            const tagKeyword = tag.toLowerCase().trim();
            const { matched } = checkTagMatch(tagKeyword, mostRecentMessageText);
            if (matched) {
              matchedInMostRecent = true;
              break;
            }
          }
        }
        
        for (let msgIdx = 0; msgIdx < recentMessages.length; msgIdx++) {
          const messageText = recentMessages[msgIdx].text.toLowerCase();
          const messageWeight = msgIdx === recentMessages.length - 1 ? 3 : (msgIdx === recentMessages.length - 2 ? 2 : 1);
          
          for (const tag of sceneTags) {
            if (tag && tag.trim() !== '') {
              const tagKeyword = tag.toLowerCase().trim();
              const { matched, percentage } = checkTagMatch(tagKeyword, messageText);
              
              if (matched) {
                const matchBonus = 1 + percentage;
                score += messageWeight * matchBonus;
              }
            }
          }
        }
        
        if (score > 0) {
          sceneScores.push({ sceneId: scene.id, score, matchedInMostRecent });
        }
      }
      
      const validScenes = sceneScores.filter(s => s.matchedInMostRecent);
      
      if (validScenes.length > 0) {
        validScenes.sort((a, b) => b.score - a.score);
        setActiveSceneId(validScenes[0].sceneId);
        foundSceneTag = true;
      } else {
        foundSceneTag = true; // Prevent fallback to starting scene
      }
    }
    
    if (!foundSceneTag) {
      if (!activeSceneId) {
        const startingScene = appData.scenes.find(s => s.isStartingScene);
        if (startingScene) {
          setActiveSceneId(startingScene.id);
        }
      }
    }
  }, [conversationId, conversation, conversation?.messages, appData.scenes, activeSceneId]);

  // LOADING STATE: Show skeleton UI while data is being fetched
  // This enables immediate navigation with progressive data hydration
  // NOTE: This check is placed AFTER all hooks to comply with React rules
  if (conversationId === "loading" || (!conversation && conversationId !== "loading")) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400 text-sm">Loading your story...</p>
        </div>
      </div>
    );
  }

  // Helper to find any character (main, side, or auto-generated) by name
  const findAnyCharacterByName = (name: string | null): Character | SideCharacter | null => {
    return findCharacterByName(name, appData);
  };

  // Async function to generate side character details via edge function
  // Uses sideCharactersRef to avoid stale closure issues
  const generateSideCharacterDetailsAsync = async (
    characterId: string, 
    name: string, 
    dialogContext: string
  ) => {
    try {
      console.log(`Generating details for new side character: ${name}`);
      
      // 1. Generate detailed profile - pass modelId to use user's selected model
      const { data: profileData, error: profileError } = await supabase.functions.invoke('generate-side-character', {
        body: { 
          name, 
          dialogContext, 
          extractedTraits: {},
          worldContext: appData.world.core.settingOverview,
          modelId  // Pass user's selected model
        }
      });
      
      if (profileError) {
        console.error('Profile generation failed:', profileError);
        return;
      }
      
      if (profileData && onUpdateSideCharacters) {
        // Update character with generated details - use ref to get current state
        const updatedSideChars = sideCharactersRef.current.map(sc => {
          if (sc.id === characterId) {
            return {
              ...sc,
              age: profileData.age || sc.age,
              sexType: profileData.sexType || sc.sexType,
              roleDescription: profileData.roleDescription || sc.roleDescription,
              physicalAppearance: { ...sc.physicalAppearance, ...profileData.physicalAppearance },
              currentlyWearing: { ...sc.currentlyWearing, ...profileData.currentlyWearing },
              background: { ...sc.background, ...profileData.background },
              personality: { 
                ...sc.personality, 
                ...profileData.personality,
                traits: profileData.personality?.traits || sc.personality.traits
              },
              updatedAt: now()
            };
          }
          return sc;
        });
        onUpdateSideCharacters(updatedSideChars);
        
        // Persist updated character to database
        const updatedChar = updatedSideChars.find(sc => sc.id === characterId);
        if (updatedChar) {
          try {
            await supabaseData.updateSideCharacter(characterId, updatedChar);
          } catch (err) {
            console.error(`Failed to update side character ${name} in database:`, err);
          }
        }
        
        // 2. Generate avatar using the avatarPrompt - pass modelId and art style
        if (profileData.avatarPrompt) {
          console.log(`Generating avatar for ${name}...`);
          
          // Get the art style prompt from the scenario's selected art style
          const selectedStyleId = appData.selectedArtStyle || DEFAULT_STYLE_ID;
          const styleData = getStyleById(selectedStyleId);
          
          const { data: avatarData, error: avatarError } = await supabase.functions.invoke('generate-side-character-avatar', {
            body: { 
              avatarPrompt: profileData.avatarPrompt,
              characterName: name,
              modelId,  // Pass user's selected model
              stylePrompt: styleData?.backendPrompt || ''  // Pass the art style
            }
          });
          
          if (avatarError) {
            console.error('Avatar generation failed:', avatarError);
          } else if (avatarData?.imageUrl) {
            // Use ref to get current state - avoids stale closure
            const finalSideChars = sideCharactersRef.current.map(sc => {
              if (sc.id === characterId) {
                return {
                  ...sc,
                  avatarDataUrl: avatarData.imageUrl,
                  isAvatarGenerating: false,
                  updatedAt: now()
                };
              }
              return sc;
            });
            onUpdateSideCharacters(finalSideChars);
            
            // Persist avatar update to database
            try {
              await supabaseData.updateSideCharacter(characterId, { avatarDataUrl: avatarData.imageUrl });
            } catch (err) {
              console.error(`Failed to update side character avatar in database:`, err);
            }
            
            console.log(`${name} has joined the story!`);
          }
        }
      }
    } catch (error) {
      console.error('Side character generation failed:', error);
    }
  };

  // Process AI response to detect new characters
  const processResponseForNewCharacters = async (responseText: string) => {
    if (!onUpdateSideCharacters) return;
    
    const knownNames = getKnownCharacterNames(appData);
    const newCharacters = detectNewCharacters(responseText, knownNames);
    
    if (newCharacters.length > 0) {
      console.log(`Detected ${newCharacters.length} new character(s):`, newCharacters.map(c => c.name));
      
      const newSideCharacters = newCharacters.map(nc => 
        createSideCharacter(nc.name, nc.dialogContext, conversationId)
      );
      
      // Add to sideCharacters array (optimistic UI update)
      const updatedSideChars = [...(appData.sideCharacters || []), ...newSideCharacters];
      onUpdateSideCharacters(updatedSideChars);
      
      // Persist each new side character to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        for (const sc of newSideCharacters) {
          try {
            await supabaseData.saveSideCharacter(sc, conversationId, user.id);
          } catch (err) {
            console.error(`Failed to save side character ${sc.name}:`, err);
          }
        }
      }
      
      // Trigger async profile + avatar generation for each
      newSideCharacters.forEach(sc => {
        const nc = newCharacters.find(c => c.name === sc.name);
        if (nc) {
          generateSideCharacterDetailsAsync(sc.id, sc.name, nc.dialogContext);
        }
      });
    }
  };

  // Parse [UPDATE:], [ADDROW:], and [NEWCAT:] tags from AI response
  interface CharacterUpdate {
    characterName: string;
    type: 'update' | 'addrow' | 'newcat';
    updates?: Record<string, string>;
    categoryTitle?: string;
    items?: Array<{label: string; value: string}>;
  }

  const parseCharacterUpdates = (responseText: string): CharacterUpdate[] => {
    const results: CharacterUpdate[] = [];
    
    // Parse [UPDATE:...] tags - allow | or \ as field separators for flexibility
    const updateRegex = /\[UPDATE:([^|\\\]]+)[|\\]([^\]]+)\]/g;
    let match;
    while ((match = updateRegex.exec(responseText)) !== null) {
      const updates: Record<string, string> = {};
      // Split by | or \ for field pairs
      for (const pair of match[2].split(/[|\\]/)) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > 0) {
          const field = pair.slice(0, colonIndex).trim();
          const value = pair.slice(colonIndex + 1).trim();
          if (field && value) updates[field] = value;
        }
      }
      if (Object.keys(updates).length > 0) {
        results.push({ characterName: match[1].trim(), type: 'update', updates });
      }
    }
    
    // Parse [ADDROW:...] tags
    const addRowRegex = /\[ADDROW:([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    while ((match = addRowRegex.exec(responseText)) !== null) {
      const colonIndex = match[3].indexOf(':');
      if (colonIndex > 0) {
        const label = match[3].slice(0, colonIndex).trim();
        const value = match[3].slice(colonIndex + 1).trim();
        results.push({
          characterName: match[1].trim(),
          type: 'addrow',
          categoryTitle: match[2].trim(),
          items: [{label, value}]
        });
      }
    }
    
    // Parse [NEWCAT:...] tags
    const newCatRegex = /\[NEWCAT:([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    while ((match = newCatRegex.exec(responseText)) !== null) {
      const items = match[3].split('|').map(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > 0) {
          return {
            label: pair.slice(0, colonIndex).trim(),
            value: pair.slice(colonIndex + 1).trim()
          };
        }
        return { label: '', value: '' };
      }).filter(i => i.label);
      results.push({
        characterName: match[1].trim(),
        type: 'newcat',
        categoryTitle: match[2].trim(),
        items
      });
    }
    
    return results;
  };

  // Strip update tags from displayed message
  const stripUpdateTags = (text: string): string => {
    return text
      .replace(/\[UPDATE:[^\]]+\]/g, '')
      .replace(/\[ADDROW:[^\]]+\]/g, '')
      .replace(/\[NEWCAT:[^\]]+\]/g, '')
      .trim();
  };

  // Apply parsed updates to session state
  const applyCharacterUpdates = async (updates: CharacterUpdate[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const update of updates) {
      // Find the character by name
      const mainChar = appData.characters.find(c => c.name.toLowerCase() === update.characterName.toLowerCase());
      const sideChar = (appData.sideCharacters || []).find(sc => sc.name.toLowerCase() === update.characterName.toLowerCase());
      
      if (mainChar) {
        // Show updating indicator
        showCharacterUpdateIndicator(mainChar.id);
        
        // Find or create session state
        let sessionState = sessionStates.find(s => s.characterId === mainChar.id);
        if (!sessionState) {
          sessionState = await supabaseData.createSessionState(mainChar, conversationId, user.id);
          setSessionStates(prev => [...prev, sessionState!]);
        }
        
        if (update.type === 'update' && update.updates) {
          // Apply field updates
          const patch: Record<string, any> = {};
          for (const [field, value] of Object.entries(update.updates)) {
            if (field.includes('.')) {
              // Nested field like physicalAppearance.hairColor
              const [parent, child] = field.split('.');
              if (parent === 'physicalAppearance') {
                patch.physicalAppearance = { ...(sessionState.physicalAppearance || {}), [child]: value };
              } else if (parent === 'currentlyWearing') {
                patch.currentlyWearing = { ...(sessionState.currentlyWearing || {}), [child]: value };
              } else if (parent === 'preferredClothing') {
                patch.preferredClothing = { ...(sessionState.preferredClothing || {}), [child]: value };
              }
            } else {
              patch[field] = value;
            }
          }
          await supabaseData.updateSessionState(sessionState.id, patch);
          setSessionStates(prev => prev.map(s => s.id === sessionState!.id ? { ...s, ...patch } : s));
        }
      } else if (sideChar) {
        // Show updating indicator
        showCharacterUpdateIndicator(sideChar.id);
        
        if (update.type === 'update' && update.updates) {
          const patch: Record<string, any> = {};
          for (const [field, value] of Object.entries(update.updates)) {
            if (field.includes('.')) {
              const [parent, child] = field.split('.');
              if (parent === 'physicalAppearance') {
                patch.physicalAppearance = { ...(sideChar.physicalAppearance || {}), [child]: value };
              } else if (parent === 'currentlyWearing') {
                patch.currentlyWearing = { ...(sideChar.currentlyWearing || {}), [child]: value };
              }
            } else {
              patch[field] = value;
            }
          }
          await supabaseData.updateSideCharacter(sideChar.id, patch);
          if (onUpdateSideCharacters) {
            const updated = (appData.sideCharacters || []).map(sc => 
              sc.id === sideChar.id ? { ...sc, ...patch } : sc
            );
            onUpdateSideCharacters(updated);
          }
        }
      }
    }
  };

  // ============================================================================
  // DEDICATED CHARACTER UPDATE EXTRACTION (runs in parallel with narrative)
  // ============================================================================
  
  interface ExtractedUpdate {
    character: string;
    field: string;
    value: string;
  }

  // Call the dedicated extraction edge function
  const extractCharacterUpdatesFromDialogue = async (
    userMessage: string, 
    aiResponse: string
  ): Promise<ExtractedUpdate[]> => {
    try {
      // Build character data for context
      const charactersData = appData.characters.map(c => {
        const effective = getEffectiveCharacter(c);
        return {
          name: effective.name,
          previousNames: effective.previousNames || [],
          nicknames: effective.nicknames,
          physicalAppearance: effective.physicalAppearance,
          currentlyWearing: effective.currentlyWearing,
          preferredClothing: effective.preferredClothing,
          location: effective.location,
          currentMood: effective.currentMood,
          goals: (effective.goals || []).map(g => ({
            title: g.title,
            desiredOutcome: g.desiredOutcome || '',
            currentStatus: g.currentStatus || '',
            progress: g.progress || 0,
            steps: (g.steps || []).map(s => ({ id: s.id, description: s.description, completed: s.completed }))
          })),
          customSections: (effective.sections || []).map(s => ({
            title: s.title,
            items: s.items.map(i => ({ label: i.label, value: i.value }))
          })),
          // New sections
          background: effective.background,
          personality: effective.personality ? {
            splitMode: effective.personality.splitMode,
            traits: (effective.personality.traits || []).map(t => ({ label: t.label, value: t.value })),
            outwardTraits: (effective.personality.outwardTraits || []).map(t => ({ label: t.label, value: t.value })),
            inwardTraits: (effective.personality.inwardTraits || []).map(t => ({ label: t.label, value: t.value })),
          } : undefined,
          tone: effective.tone,
          keyLifeEvents: effective.keyLifeEvents,
          relationships: effective.relationships,
          secrets: effective.secrets,
          fears: effective.fears,
        };
      });
      
      // Also include side characters
      const sideCharsData = (appData.sideCharacters || []).map(sc => ({
        name: sc.name,
        nicknames: sc.nicknames,
        physicalAppearance: sc.physicalAppearance,
        currentlyWearing: sc.currentlyWearing,
        location: sc.location,
        currentMood: sc.currentMood
      }));
      
      const allCharacters = [...charactersData, ...sideCharsData];
      
      // Build recent context (last 6 messages for pattern detection)
      const conversation = appData.conversations.find(c => c.id === conversationId);
      const recentMessages = conversation?.messages.slice(-6) || [];
      const recentContext = recentMessages
        .map(m => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.text}`)
        .join('\n\n');
      
      const { data, error } = await supabase.functions.invoke('extract-character-updates', {
        body: {
          userMessage,
          aiResponse,
          recentContext,
          characters: allCharacters,
          modelId
        }
      });
      
      if (error) {
        console.error('[extractCharacterUpdates] Edge function error:', error);
        return [];
      }
      
      return data?.updates || [];
    } catch (err) {
      console.error('[extractCharacterUpdates] Failed:', err);
      return [];
    }
  };

  // Apply extracted updates to session state (enhanced to handle custom sections)
  const applyExtractedUpdates = async (updates: ExtractedUpdate[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || updates.length === 0) return;
    
    // Group updates by character
    const updatesByCharacter = new Map<string, ExtractedUpdate[]>();
    for (const update of updates) {
      const existing = updatesByCharacter.get(update.character.toLowerCase()) || [];
      existing.push(update);
      updatesByCharacter.set(update.character.toLowerCase(), existing);
    }
    
    for (const [charNameLower, charUpdates] of updatesByCharacter) {
      // Build effective character lookup (includes session-scoped names and previousNames)
      const effectiveMainChars = appData.characters.map(c => ({
        base: c,
        effective: getEffectiveCharacter(c)
      }));
      
      // Search by current effective name first
      let matchedMain = effectiveMainChars.find(({ effective }) => 
        effective.name.toLowerCase() === charNameLower
      );
      
      // If not found, check nicknames
      if (!matchedMain) {
        matchedMain = effectiveMainChars.find(({ effective }) => {
          if (!effective.nicknames) return false;
          return effective.nicknames.split(',').some(n => 
            n.trim().toLowerCase() === charNameLower
          );
        });
      }
      
      // If still not found, check previousNames (hidden field for renamed characters)
      if (!matchedMain) {
        matchedMain = effectiveMainChars.find(({ effective }) => {
          if (!effective.previousNames?.length) return false;
          return effective.previousNames.some(n => 
            n.toLowerCase() === charNameLower
          );
        });
      }
      
      const mainChar = matchedMain?.base;
      
      let sideChar = (appData.sideCharacters || []).find(sc => sc.name.toLowerCase() === charNameLower);
      if (!sideChar && !mainChar) {
        // Check nicknames
        sideChar = (appData.sideCharacters || []).find(sc => {
          if (!sc.nicknames) return false;
          return sc.nicknames.split(',').some(n => n.trim().toLowerCase() === charNameLower);
        });
      }
      
      if (!mainChar && !sideChar) {
        console.log(`[applyExtractedUpdates] Character not found: ${charNameLower}`);
      }
      
      if (mainChar) {
        // Show updating indicator
        showCharacterUpdateIndicator(mainChar.id);
        
        // Find or create session state
        let sessionState = sessionStates.find(s => s.characterId === mainChar!.id);
        if (!sessionState) {
          sessionState = await supabaseData.createSessionState(mainChar, conversationId, user.id);
          setSessionStates(prev => [...prev, sessionState!]);
        }
        
        // Build patch from updates
        const patch: Record<string, any> = {};
        let sectionsModified = false;
        let goalsModified = false;
        let updatedSections = [...(sessionState.customSections || mainChar.sections || [])];
        let updatedGoals = [...(sessionState.goals || mainChar.goals || [])];
        
        for (const update of charUpdates) {
          const { field, value } = update;
          
          // Handle goals.GoalTitle = "desired_outcome: X | current_status: Y | progress: Z | complete_steps: 1,2 | new_steps: Step 7: ..." format
          if (field.startsWith('goals.')) {
            const goalTitle = field.slice(6); // Remove 'goals.' prefix
            if (goalTitle) {
              let desiredOutcome = '';
              let currentStatus = value;
              let progress = 0;
              
              // Parse all fields from the value string
              const desiredMatch = value.match(/desired_outcome:\s*(.*?)\s*\|\s*current_status:/i);
              if (desiredMatch) {
                desiredOutcome = desiredMatch[1].trim();
              }
              
              const statusMatch = value.match(/current_status:\s*(.*?)\s*\|\s*progress:/i);
              if (statusMatch) {
                currentStatus = statusMatch[1].trim();
              } else {
                currentStatus = value
                  .replace(/desired_outcome:\s*.*?\s*\|\s*/i, '')
                  .replace(/\s*\|\s*progress:\s*\d+.*/i, '')
                  .replace(/current_status:\s*/i, '')
                  .trim();
              }
              
              const progressMatch = value.match(/progress:\s*(\d+)/i);
              if (progressMatch) {
                progress = Math.min(100, Math.max(0, parseInt(progressMatch[1], 10)));
              }
              
              // Parse step operations
              const completeStepsMatch = value.match(/complete_steps:\s*([^|]+)/i);
              const newStepsMatch = value.match(/new_steps:\s*(.*)/i);
              
              // Find existing goal or create new one
              const existingGoalIndex = updatedGoals.findIndex(g => 
                g.title.toLowerCase() === goalTitle.toLowerCase()
              );
              
              if (existingGoalIndex !== -1) {
                const existingGoal = updatedGoals[existingGoalIndex];
                let updatedSteps = [...(existingGoal.steps || [])];
                
                // Handle complete_steps: mark specified step indices as completed (1-indexed)
                if (completeStepsMatch) {
                  const indices = completeStepsMatch[1].trim().split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                  for (const idx of indices) {
                    if (idx >= 1 && idx <= updatedSteps.length) {
                      updatedSteps[idx - 1] = { ...updatedSteps[idx - 1], completed: true, completedAt: Date.now() };
                    }
                  }
                }
                
                // Handle new_steps: parse and append new steps
                if (newStepsMatch) {
                  const newStepsRaw = newStepsMatch[1].trim();
                  const stepEntries = newStepsRaw.split(/Step\s+\d+:\s*/i).filter(Boolean);
                  for (const desc of stepEntries) {
                    const trimmed = desc.trim().replace(/\|$/, '').trim();
                    if (trimmed) {
                      updatedSteps.push({ id: `step_${uuid().slice(0, 12)}`, description: trimmed, completed: false });
                    }
                  }
                }
                
                // Recalculate progress from steps if steps exist
                if (updatedSteps.length > 0) {
                  const completedCount = updatedSteps.filter(s => s.completed).length;
                  progress = Math.round((completedCount / updatedSteps.length) * 100);
                }
                
                updatedGoals[existingGoalIndex] = {
                  ...existingGoal,
                  currentStatus,
                  progress,
                  steps: updatedSteps,
                  ...(desiredOutcome ? { desiredOutcome } : {}),
                  updatedAt: Date.now()
                };
                console.log(`[applyExtractedUpdates] Updated goal "${goalTitle}" → ${progress}% (${updatedSteps.filter(s => s.completed).length}/${updatedSteps.length} steps)`);
              } else {
                // Create new goal - parse any new_steps
                const newSteps: Array<{ id: string; description: string; completed: boolean }> = [];
                if (newStepsMatch) {
                  const newStepsRaw = newStepsMatch[1].trim();
                  const stepEntries = newStepsRaw.split(/Step\s+\d+:\s*/i).filter(Boolean);
                  for (const desc of stepEntries) {
                    const trimmed = desc.trim().replace(/\|$/, '').trim();
                    if (trimmed) {
                      newSteps.push({ id: `step_${uuid().slice(0, 12)}`, description: trimmed, completed: false });
                    }
                  }
                }
                
                updatedGoals.push({
                  id: `goal_${uuid().slice(0, 12)}`,
                  title: goalTitle,
                  desiredOutcome,
                  currentStatus,
                  progress,
                  steps: newSteps,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                });
                console.log(`[applyExtractedUpdates] Created new goal "${goalTitle}" → ${progress}% with ${newSteps.length} steps`);
              }
              goalsModified = true;
            }
          }
          // Handle sections.SectionTitle.ItemLabel format
          else if (field.startsWith('sections.')) {
            const parts = field.split('.');
            if (parts.length >= 3) {
              const sectionTitle = parts[1];
              const itemLabel = parts.slice(2).join('.'); // Allow dots in item labels
              
              // Find or create section
              let sectionIndex = updatedSections.findIndex(s => s.title.toLowerCase() === sectionTitle.toLowerCase());
              if (sectionIndex === -1) {
                // Create new section
                const newSection = {
                  id: `sec_${uuid().slice(0, 12)}`,
                  title: sectionTitle,
                  items: [],
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                };
                updatedSections.push(newSection);
                sectionIndex = updatedSections.length - 1;
                console.log(`[applyExtractedUpdates] Created new section: ${sectionTitle}`);
              }
              
              // Find or create item in section
              const section = updatedSections[sectionIndex];
              const itemIndex = section.items.findIndex(i => i.label.toLowerCase() === itemLabel.toLowerCase());
              
              if (itemIndex === -1) {
                // Add new item
                section.items.push({
                  id: `item_${uuid().slice(0, 12)}`,
                  label: itemLabel,
                  value: value,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                });
                console.log(`[applyExtractedUpdates] Added new item "${itemLabel}" to section "${sectionTitle}"`);
              } else {
                // Update existing item
                section.items[itemIndex] = {
                  ...section.items[itemIndex],
                  value: value,
                  updatedAt: Date.now()
                };
                console.log(`[applyExtractedUpdates] Updated item "${itemLabel}" in section "${sectionTitle}"`);
              }
              
              section.updatedAt = Date.now();
              sectionsModified = true;
            }
          } else if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'physicalAppearance') {
              patch.physicalAppearance = { ...(sessionState.physicalAppearance || {}), ...(patch.physicalAppearance || {}), [child]: value };
            } else if (parent === 'currentlyWearing') {
              patch.currentlyWearing = { ...(sessionState.currentlyWearing || {}), ...(patch.currentlyWearing || {}), [child]: value };
            } else if (parent === 'preferredClothing') {
              patch.preferredClothing = { ...(sessionState.preferredClothing || {}), ...(patch.preferredClothing || {}), [child]: value };
            } else if (parent === 'background') {
              // Update background hardcoded fields in session state
              const bg = patch.background || sessionState.background || mainChar.background || { jobOccupation: '', educationLevel: '', residence: '', hobbies: '', financialStatus: '', motivation: '' };
              (bg as any)[child] = value;
              patch.background = bg;
            } else if (['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'].includes(parent) && child === '_extras') {
              // Append to _extras
              const sectionKey = parent as 'tone' | 'keyLifeEvents' | 'relationships' | 'secrets' | 'fears';
              const existing = (patch as any)[sectionKey] || (sessionState as any)[sectionKey] || (mainChar as any)[sectionKey] || {};
              const extras = [...(existing._extras || [])];
              const parts = value.split(':');
              extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: parts.slice(1).join(':')?.trim() || value });
              (patch as any)[sectionKey] = { ...existing, _extras: extras };
            }
          } else {
            patch[field] = value;
          }
        }
        
        // Add sections to patch if modified
        if (sectionsModified) {
          patch.customSections = updatedSections;
        }
        // Add goals to patch if modified
        if (goalsModified) {
          patch.goals = updatedGoals;
        }
        
        if (Object.keys(patch).length > 0) {
          await supabaseData.updateSessionState(sessionState.id, patch);
          setSessionStates(prev => prev.map(s => s.id === sessionState!.id ? { ...s, ...patch } : s));
          console.log(`[applyExtractedUpdates] Updated ${mainChar.name}:`, Object.keys(patch));
        }
      } else if (sideChar) {
        // Show updating indicator
        showCharacterUpdateIndicator(sideChar.id);
        
        // Build patch from updates
        const patch: Record<string, any> = {};
        for (const update of charUpdates) {
          const { field, value } = update;
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'physicalAppearance') {
              patch.physicalAppearance = { ...(sideChar.physicalAppearance || {}), ...(patch.physicalAppearance || {}), [child]: value };
            } else if (parent === 'currentlyWearing') {
              patch.currentlyWearing = { ...(sideChar.currentlyWearing || {}), ...(patch.currentlyWearing || {}), [child]: value };
            }
            // Note: Side characters don't have custom sections in current schema
          } else {
            patch[field] = value;
          }
        }
        
        if (Object.keys(patch).length > 0) {
          await supabaseData.updateSideCharacter(sideChar.id, patch);
          if (onUpdateSideCharacters) {
            const updated = (appData.sideCharacters || []).map(sc => 
              sc.id === sideChar!.id ? { ...sc, ...patch } : sc
            );
            onUpdateSideCharacters(updated);
          }
          console.log(`[applyExtractedUpdates] Updated side character ${sideChar.name}:`, Object.keys(patch));
        }
      } else {
        console.log(`[applyExtractedUpdates] Character not found: ${charNameLower}`);
      }
    }
  };
  // Update conversation when day/time changes
  const handleDayTimeChange = (newDay: number, newTime: TimeOfDay) => {
    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? { ...c, currentDay: newDay, currentTimeOfDay: newTime, updatedAt: now() }
        : c
    );
    onUpdate(updatedConvs);
    onSaveScenario(updatedConvs);
  };

  const incrementDay = () => {
    const newDay = currentDay + 1;
    setCurrentDay(newDay);
    handleDayTimeChange(newDay, currentTimeOfDay);
  };

  const decrementDay = () => {
    if (currentDay > 1) {
      const newDay = currentDay - 1;
      setCurrentDay(newDay);
      handleDayTimeChange(newDay, currentTimeOfDay);
    }
  };

  const selectTime = (time: TimeOfDay) => {
    setCurrentTimeOfDay(time);
    handleDayTimeChange(currentDay, time);
  };

  const getTimeIcon = (time: TimeOfDay) => {
    switch (time) {
      case 'sunrise': return <Sunrise className="w-4 h-4" />;
      case 'day': return <Sun className="w-4 h-4" />;
      case 'sunset': return <Sunset className="w-4 h-4" />;
      case 'night': return <Moon className="w-4 h-4" />;
    }
  };

  // Dynamic background gradient based on time of day
  const getTimeBackground = (time: TimeOfDay): string => {
    switch (time) {
      case 'sunrise':
        return 'bg-gradient-to-b from-amber-200 via-orange-100 to-amber-50';
      case 'day':
        return 'bg-gradient-to-b from-sky-200 via-blue-100 to-sky-50';
      case 'sunset':
        return 'bg-gradient-to-b from-pink-300 via-orange-200 to-amber-100';
      case 'night':
        return 'bg-gradient-to-b from-indigo-900 via-slate-800 to-indigo-950';
    }
  };

  // Text color for labels - white on dark night mode, black otherwise
  const getTimeTextColor = (time: TimeOfDay): string => {
    return time === 'night' ? 'text-white' : 'text-black';
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || isStreaming) return;

    const userMsg: Message = { 
      id: uuid(), 
      role: 'user', 
      text: input, 
      day: currentDay,
      timeOfDay: currentTimeOfDay,
      createdAt: now() 
    };
    const nextConvsWithUser = appData.conversations.map(c =>
      c.id === conversationId ? { ...c, messages: [...c.messages, userMsg], updatedAt: now() } : c
    );

    onUpdate(nextConvsWithUser);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setFormattedStreamingContent('');

    try {
      let fullText = '';
      const llmAppData = buildLLMAppData();
      const stream = generateRoleplayResponseStream(llmAppData, conversationId, input, modelId, currentDay, currentTimeOfDay, memories, memoriesEnabled);

      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
        
        // Format streaming content on-the-fly to prevent flickering
        const existingNamesForStream = getKnownCharacterNames(appData);
        let formatted = stripUpdateTags(fullText);
        const { normalizedText } = normalizePlaceholderNames(formatted, existingNamesForStream, placeholderMapRef.current);
        setFormattedStreamingContent(normalizedText);
      }

      // Use dedicated extraction service (runs in parallel, non-blocking)
      // This replaces the old parseCharacterUpdates + applyCharacterUpdates flow
      const userInput = input; // Capture before clearing
      extractCharacterUpdatesFromDialogue(userInput, fullText).then(updates => {
        if (updates.length > 0) {
          console.log(`[handleSend] Extracted ${updates.length} character updates:`, updates);
          applyExtractedUpdates(updates);
        }
      }).catch(err => {
        console.error('[handleSend] Character extraction failed:', err);
      });

      // Strip any legacy update tags that might still be in response (fallback)
      let cleanedText = stripUpdateTags(fullText);
      
      // Apply placeholder name guard to replace "Man 1:", "Cashier:", etc. with proper names
      const existingNames = getKnownCharacterNames(appData);
      const { normalizedText } = normalizePlaceholderNames(cleanedText, existingNames, placeholderMapRef.current);
      cleanedText = normalizedText;

      const aiMsg: Message = { 
        id: uuid(), 
        role: 'assistant', 
        text: cleanedText, 
        day: currentDay,
        timeOfDay: currentTimeOfDay,
        createdAt: now() 
      };
      const nextConvsWithAi = appData.conversations.map(c =>
        c.id === conversationId ? { ...c, messages: [...c.messages, userMsg, aiMsg], updatedAt: now() } : c
      );
      onUpdate(nextConvsWithAi);
      onSaveScenario(nextConvsWithAi);
      
      // Process AI response for new character detection
      processResponseForNewCharacters(cleanedText);
    } catch (err) {
      console.error(err);
      alert("Dialogue stream failed. Check your connection or model settings.");
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setFormattedStreamingContent('');
    }
  };

  const handleCopyMessage = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleDeleteMessage = (messageId: string) => {
    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: now() }
        : c
    );
    onUpdate(updatedConvs);
    onSaveScenario(updatedConvs);
  };

  const handleEditMessage = () => {
    if (!editingMessage || !editText.trim()) return;
    
    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? {
            ...c,
            messages: c.messages.map(m =>
              m.id === editingMessage.id ? { ...m, text: editText } : m
            ),
            updatedAt: now()
          }
        : c
    );
    onUpdate(updatedConvs);
    onSaveScenario(updatedConvs);
    setEditingMessage(null);
    setEditText('');
  };

  const handleInlineEditSave = () => {
    if (!inlineEditingId || !inlineEditText.trim()) return;
    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? {
            ...c,
            messages: c.messages.map(m =>
              m.id === inlineEditingId ? { ...m, text: inlineEditText } : m
            ),
            updatedAt: now()
          }
        : c
    );
    onUpdate(updatedConvs);
    onSaveScenario(updatedConvs);
    setInlineEditingId(null);
    setInlineEditText('');
  };

  const handleInlineEditCancel = () => {
    setInlineEditingId(null);
    setInlineEditText('');
  };

  const handleRegenerateMessage = async (messageId: string) => {
    const msgIndex = conversation?.messages.findIndex(m => m.id === messageId);
    if (msgIndex === undefined || msgIndex < 1) return;
    
    const userMessage = conversation?.messages[msgIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;
    
    // Track which specific message is being regenerated (for in-place streaming)
    setRegeneratingMessageId(messageId);
    setIsRegenerating(true);
    setIsStreaming(true);
    setStreamingContent('');
    setFormattedStreamingContent('');
    
    try {
      // Strip the old AI response from the conversation context so the AI generates fresh
      // without being influenced by (and swinging opposite to) the rejected response
      const llmAppData = buildLLMAppData();
      const truncatedConvs = llmAppData.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: c.messages.slice(0, msgIndex) }
          : c
      );
      const truncatedAppData = { ...llmAppData, conversations: truncatedConvs };
      
      let fullText = '';
      const stream = generateRoleplayResponseStream(truncatedAppData, conversationId, userMessage.text, modelId, currentDay, currentTimeOfDay, memories, memoriesEnabled, true);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
        
        // Format streaming content on-the-fly
        const existingNamesForStream = getKnownCharacterNames(appData);
        let formatted = stripUpdateTags(fullText);
        const { normalizedText } = normalizePlaceholderNames(formatted, existingNamesForStream, placeholderMapRef.current);
        setFormattedStreamingContent(normalizedText);
      }
      
      // Extract character updates from regenerated response
      extractCharacterUpdatesFromDialogue(userMessage.text, fullText).then(updates => {
        if (updates.length > 0) {
          console.log(`[handleRegenerate] Extracted ${updates.length} character updates:`, updates);
          applyExtractedUpdates(updates);
        }
      }).catch(err => {
        console.error('[handleRegenerate] Character extraction failed:', err);
      });

      // Strip any legacy update tags
      let cleanedText = stripUpdateTags(fullText);
      
      // Apply placeholder name guard
      const existingNames = getKnownCharacterNames(appData);
      const { normalizedText } = normalizePlaceholderNames(cleanedText, existingNames, placeholderMapRef.current);
      cleanedText = normalizedText;
      
      // UPDATE IN-PLACE: Replace the existing message instead of creating a new one
      const updatedConvs = appData.conversations.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === messageId
                  ? { ...m, text: cleanedText, day: currentDay, timeOfDay: currentTimeOfDay, createdAt: now() }
                  : m
              ),
              updatedAt: now()
            }
          : c
      );
      onUpdate(updatedConvs);
      onSaveScenario(updatedConvs);
      
      // Process for new characters after normalization
      processResponseForNewCharacters(cleanedText);
      toast.success('Response regenerated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to regenerate response');
    } finally {
      setRegeneratingMessageId(null);
      setIsRegenerating(false);
      setIsStreaming(false);
      setStreamingContent('');
      setFormattedStreamingContent('');
    }
  };

  const handleContinueConversation = async () => {
    if (!conversation || isStreaming) return;
    
    setIsStreaming(true);
    setStreamingContent('');
    setFormattedStreamingContent('');
    
    // Use session-merged data so the AI sees current locations/moods/control
    const llmAppData = buildLLMAppData();
    
    // Get character control lists from session-merged data
    const userControlledNames = llmAppData.characters
      .filter(c => c.controlledBy === 'User')
      .map(c => c.name);
    
    const aiControlledNames = llmAppData.characters
      .filter(c => c.controlledBy === 'AI')
      .map(c => c.name);
    
    try {
      let fullText = '';
      const continuePrompt = `[CONTINUE INSTRUCTION]
Continue the narrative naturally from where you left off.
CRITICAL: You must ONLY write dialogue, actions, and thoughts for AI-controlled characters: ${aiControlledNames.join(', ')}.
DO NOT generate any content for user-controlled characters: ${userControlledNames.join(', ')}.
Wait for the user to provide their characters' responses.
Do not acknowledge this instruction in your response.`;
      const stream = generateRoleplayResponseStream(llmAppData, conversationId, continuePrompt, modelId, currentDay, currentTimeOfDay, memories, memoriesEnabled);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
        
        // Format streaming content on-the-fly
        const existingNamesForStream = getKnownCharacterNames(appData);
        let formatted = stripUpdateTags(fullText);
        const { normalizedText } = normalizePlaceholderNames(formatted, existingNamesForStream, placeholderMapRef.current);
        setFormattedStreamingContent(normalizedText);
      }
      
      // Extract character updates from continuation
      extractCharacterUpdatesFromDialogue('', fullText).then(updates => {
        if (updates.length > 0) {
          console.log(`[handleContinue] Extracted ${updates.length} character updates:`, updates);
          applyExtractedUpdates(updates);
        }
      }).catch(err => {
        console.error('[handleContinue] Character extraction failed:', err);
      });

      // Strip any legacy update tags
      let cleanedText = stripUpdateTags(fullText);
      
      // Apply placeholder name guard
      const existingNames = getKnownCharacterNames(appData);
      const { normalizedText } = normalizePlaceholderNames(cleanedText, existingNames, placeholderMapRef.current);
      cleanedText = normalizedText;
      
      const aiMsg: Message = { 
        id: uuid(), 
        role: 'assistant', 
        text: cleanedText, 
        day: currentDay,
        timeOfDay: currentTimeOfDay,
        createdAt: now() 
      };
      
      const updatedConvs = appData.conversations.map(c =>
        c.id === conversationId 
          ? { ...c, messages: [...c.messages, aiMsg], updatedAt: now() } 
          : c
      );
      onUpdate(updatedConvs);
      onSaveScenario(updatedConvs);
      
      processResponseForNewCharacters(cleanedText);
    } catch (err) {
      console.error(err);
      toast.error('Failed to continue conversation');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setFormattedStreamingContent('');
    }
  };

  // Generate scene image from recent conversation context
  const handleGenerateSceneImage = async () => {
    if (!conversation || isGeneratingImage) return;
    
    setIsGeneratingImage(true);
    
    try {
      // Get last 5 messages for context
      const recentMessages = conversation.messages.slice(-5).map(m => ({
        role: m.role,
        text: m.text
      }));
      
      if (recentMessages.length === 0) {
        toast.error('No messages to generate scene from');
        setIsGeneratingImage(false);
        return;
      }
      
      // Get characters mentioned in recent messages
      const mentionedNames = new Set<string>();
      recentMessages.forEach(m => {
        const segments = parseMessageSegments(m.text);
        segments.forEach(seg => {
          if (seg.speakerName) mentionedNames.add(seg.speakerName);
        });
      });
      
      // Build character data for mentioned characters
      const charactersData = [...mentionedNames].map(name => {
        const char = findCharacterByName(name, appData);
        if (!char) return null;
        return {
          name: char.name,
          physicalAppearance: 'physicalAppearance' in char ? char.physicalAppearance : {},
          currentlyWearing: 'currentlyWearing' in char ? char.currentlyWearing : {}
        };
      }).filter(Boolean);
      
      // Get art style
      const selectedStyleId = appData.selectedArtStyle || DEFAULT_STYLE_ID;
      const styleData = getStyleById(selectedStyleId);
      
      // Get active scene location
      const sceneLocation = activeScene?.tags?.[0] || undefined;
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-scene-image', {
        body: {
          recentMessages,
          characters: charactersData,
          sceneLocation,
          timeOfDay: currentTimeOfDay,
          artStylePrompt: styleData?.backendPrompt || '',
          modelId
        }
      });
      
      if (error) {
        console.error('Scene image generation error:', error);
        throw new Error(error.message || 'Failed to generate image');
      }
      
      if (!data?.imageUrl) {
        throw new Error('No image returned from server');
      }
      
      // Create image message
      const imageMessage: Message = {
        id: uuid(),
        role: 'assistant',
        text: '',  // Empty text for image-only messages
        imageUrl: data.imageUrl,
        day: currentDay,
        timeOfDay: currentTimeOfDay,
        createdAt: now()
      };
      
      // Add to conversation
      const updatedMessages = [...conversation.messages, imageMessage];
      const updatedConv = { 
        ...conversation, 
        messages: updatedMessages,
        updatedAt: now()
      };
      
      // Update state and save
      const newConversations = appData.conversations.map(c => 
        c.id === conversationId ? updatedConv : c
      );
      onUpdate(newConversations);
      onSaveScenario(newConversations);
      
      toast.success('Scene image generated!');
      
    } catch (error) {
      console.error('Failed to generate scene image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Returns char (if known), cleanText (with Name: stripped), and speakerName (always if detected)
  const identifySpeaker = (text: string, isUser: boolean): { 
    char: Character | SideCharacter | null; 
    cleanText: string;
    speakerName: string | null;
  } => {
    const cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();

    if (isUser) {
      const userChar = appData.characters.find(c => c.controlledBy === 'User');
      if (userChar) {
        if (cleanRaw.toLowerCase().startsWith(userChar.name.toLowerCase() + ':')) {
          return { 
            char: userChar, 
            cleanText: cleanRaw.slice(userChar.name.length + 1).trim(),
            speakerName: userChar.name 
          };
        }
        return { char: userChar, cleanText: cleanRaw, speakerName: userChar.name };
      }
    }

    // Match "Name:" pattern at the start
    const colonMatch = cleanRaw.match(/^([A-Z][a-zA-Z\s']{0,29}):/);
    if (colonMatch) {
      const name = colonMatch[1].trim();
      const strippedText = cleanRaw.slice(colonMatch[0].length).trim();
      
      // Check main characters first
      const char = appData.characters.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (char) return { char, cleanText: strippedText, speakerName: name };
      
      // Then check auto-generated side characters
      const sideChar = (appData.sideCharacters || []).find(c => c.name.toLowerCase() === name.toLowerCase());
      if (sideChar) return { char: sideChar, cleanText: strippedText, speakerName: name };
      
      // Unknown speaker - still strip the tag to prevent flicker, return name for placeholder
      return { char: null, cleanText: strippedText, speakerName: name };
    }

    // Fallback: check if character name appears in first sentence
    const firstSentence = cleanRaw.split(/[.!?\n]/)[0];
    const foundChar = appData.characters.find(c => firstSentence.includes(c.name));
    if (foundChar) return { char: foundChar, cleanText: cleanRaw, speakerName: foundChar.name };
    
    const foundSideChar = (appData.sideCharacters || []).find(c => firstSentence.includes(c.name));
    if (foundSideChar) return { char: foundSideChar, cleanText: cleanRaw, speakerName: foundSideChar.name };

    // Default to first AI character for AI messages
    const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
    if (!isUser && aiChars.length > 0) {
      return { char: aiChars[0], cleanText: cleanRaw, speakerName: aiChars[0].name };
    }

    return { char: null, cleanText: cleanRaw, speakerName: null };
  };

  const toggleCharacterExpand = (id: string) => {
    setExpandedCharId(expandedCharId === id ? null : id);
  };
  
  // Open the character edit modal
  const openCharacterEditModal = (char: Character | SideCharacter) => {
    setCharacterToEdit(char);
    setEditModalOpen(true);
  };
  
  // Close the edit modal
  const closeCharacterEditModal = () => {
    setEditModalOpen(false);
    setCharacterToEdit(null);
  };
  
  // Delete a side character - opens confirmation dialog
  const handleDeleteSideCharacter = (charId: string) => {
    setCharacterToDelete(charId);
    setIsMainCharacterDelete(false);
    setIsDeleteDialogOpen(true);
  };
  
  // Delete a main character - opens confirmation dialog
  const handleDeleteMainCharacter = (charId: string) => {
    setCharacterToDelete(charId);
    setIsMainCharacterDelete(true);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm deletion of a character (main or side)
  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;
    
    try {
      if (isMainCharacterDelete) {
        // For main characters, we delete any session state overrides
        // The character still exists in the scenario but their session edits are cleared
        const { error } = await supabase
          .from('character_session_states')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('character_id', characterToDelete);
        
        if (error) throw error;
        toast.success('Character edits cleared');
      } else {
        // Delete side character
        await supabaseData.deleteSideCharacter(characterToDelete);
        
        // Update local ref and propagate to parent
        const updatedList = sideCharactersRef.current.filter(sc => sc.id !== characterToDelete);
        sideCharactersRef.current = updatedList;
        onUpdateSideCharacters?.(updatedList);
        
        // Close expanded state if this was the expanded character
        if (expandedCharId === characterToDelete) {
          setExpandedCharId(null);
        }
        
        toast.success('Character deleted');
      }
    } catch (error) {  
      console.error('Failed to delete character:', error);
      toast.error('Failed to delete character');
    } finally {
      setIsDeleteDialogOpen(false);
      setCharacterToDelete(null);
      setIsMainCharacterDelete(false);
    }
  };
  
  // Save character edits to session state (main characters only)
  const handleSaveMainCharacterEdit = async (char: Character, draft: CharacterEditDraft) => {
    setIsSavingEdit(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }
      
      // Find or create session state for this character
      let sessionState = sessionStates.find(s => s.characterId === char.id);
      
      if (!sessionState) {
        // Create new session state
        sessionState = await supabaseData.createSessionState(char, conversationId, user.id);
        setSessionStates(prev => [...prev, sessionState!]);
      }
      
// Update session state with draft changes (including avatar, control, role, and previousNames)
      await supabaseData.updateSessionState(sessionState.id, {
        name: draft.name,
        previousNames: draft.previousNames,  // Hidden field for name history
        age: draft.age,
        sexType: draft.sexType,
        roleDescription: draft.roleDescription,
        location: draft.location,
        currentMood: draft.currentMood,
        physicalAppearance: draft.physicalAppearance,
        currentlyWearing: draft.currentlyWearing as any,
        preferredClothing: draft.preferredClothing,
        customSections: draft.sections,
        goals: draft.goals,
        avatarUrl: draft.avatarDataUrl,
        avatarPosition: draft.avatarPosition,
        controlledBy: draft.controlledBy,
        characterRole: draft.characterRole,
      });
      
      // Refresh session states
      const updatedStates = await supabaseData.fetchSessionStates(conversationId);
      setSessionStates(updatedStates);
      
      closeCharacterEditModal();
      toast.success('Character updated for this session');
    } catch (err) {
      console.error('Failed to save character edit:', err);
      toast.error('Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };
  
  // Save side character edits (already session-scoped via side_characters table)
  const handleSaveSideCharacterEdit = async (char: SideCharacter, draft: CharacterEditDraft) => {
    setIsSavingEdit(true);
    
    try {
const updatedChar: SideCharacter = {
        ...char,
        name: draft.name || char.name,
        age: draft.age || char.age,
        sexType: draft.sexType || char.sexType,
        roleDescription: draft.roleDescription || char.roleDescription,
        location: draft.location || char.location,
        currentMood: draft.currentMood || char.currentMood,
        controlledBy: draft.controlledBy || char.controlledBy,
        characterRole: draft.characterRole || char.characterRole,
        physicalAppearance: { ...char.physicalAppearance, ...draft.physicalAppearance },
        currentlyWearing: { ...char.currentlyWearing, ...draft.currentlyWearing },
        preferredClothing: { ...char.preferredClothing, ...draft.preferredClothing },
        background: draft.background ? { ...char.background, ...draft.background } : char.background,
        personality: draft.personality ? { ...char.personality, ...draft.personality } : char.personality,
        avatarDataUrl: draft.avatarDataUrl || char.avatarDataUrl,
        avatarPosition: draft.avatarPosition || char.avatarPosition,
        updatedAt: now(),
      };
      
      // Update in Supabase
      await supabaseData.updateSideCharacter(char.id, updatedChar);
      
      // Update local state
      const updatedList = sideCharactersRef.current.map(sc => 
        sc.id === char.id ? updatedChar : sc
      );
      onUpdateSideCharacters?.(updatedList);
      
      closeCharacterEditModal();
      toast.success('Character updated');
    } catch (err) {
      console.error('Failed to save side character edit:', err);
      toast.error('Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };
  
  // Unified save handler for the modal
  const handleModalSave = async (draft: CharacterEditDraft) => {
    if (!characterToEdit) return;
    
    // Check if it's a side character (has 'background' property)
    if ('background' in characterToEdit) {
      await handleSaveSideCharacterEdit(characterToEdit as SideCharacter, draft);
    } else {
      // Find the base character for main characters
      const baseChar = appData.characters.find(c => c.id === characterToEdit.id);
      if (baseChar) {
        await handleSaveMainCharacterEdit(baseChar, draft);
      }
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Helper functions to convert hardcoded attributes to CharacterTraitSection format
  const createBasicsSection = (char: Character): CharacterTraitSection => ({
    id: 'basics',
    title: 'Basics',
    items: [
      { id: 'age', label: 'Age', value: char.age || '', createdAt: 0, updatedAt: 0 },
      { id: 'role', label: 'Role', value: char.roleDescription || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const createPhysicalAppearanceSection = (char: Character): CharacterTraitSection => ({
    id: 'physical-appearance',
    title: 'Physical Appearance',
    items: [
      { id: 'hair-color', label: 'Hair Color', value: char.physicalAppearance?.hairColor || '', createdAt: 0, updatedAt: 0 },
      { id: 'eye-color', label: 'Eye Color', value: char.physicalAppearance?.eyeColor || '', createdAt: 0, updatedAt: 0 },
      { id: 'build', label: 'Build', value: char.physicalAppearance?.build || '', createdAt: 0, updatedAt: 0 },
      { id: 'body-hair', label: 'Body Hair', value: char.physicalAppearance?.bodyHair || '', createdAt: 0, updatedAt: 0 },
      { id: 'height', label: 'Height', value: char.physicalAppearance?.height || '', createdAt: 0, updatedAt: 0 },
      { id: 'breast-size', label: 'Breast Size', value: char.physicalAppearance?.breastSize || '', createdAt: 0, updatedAt: 0 },
      { id: 'genitalia', label: 'Genitalia', value: char.physicalAppearance?.genitalia || '', createdAt: 0, updatedAt: 0 },
      { id: 'skin-tone', label: 'Skin Tone', value: char.physicalAppearance?.skinTone || '', createdAt: 0, updatedAt: 0 },
      { id: 'makeup', label: 'Makeup', value: char.physicalAppearance?.makeup || '', createdAt: 0, updatedAt: 0 },
      { id: 'body-markings', label: 'Body Markings', value: char.physicalAppearance?.bodyMarkings || '', createdAt: 0, updatedAt: 0 },
      { id: 'temporary-conditions', label: 'Temporary Conditions', value: char.physicalAppearance?.temporaryConditions || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const createCurrentlyWearingSection = (char: Character): CharacterTraitSection => ({
    id: 'currently-wearing',
    title: 'Currently Wearing',
    items: [
      { id: 'top', label: 'Shirt/Top', value: char.currentlyWearing?.top || '', createdAt: 0, updatedAt: 0 },
      { id: 'bottom', label: 'Pants/Bottoms', value: char.currentlyWearing?.bottom || '', createdAt: 0, updatedAt: 0 },
      { id: 'undergarments', label: 'Undergarments', value: char.currentlyWearing?.undergarments || '', createdAt: 0, updatedAt: 0 },
      { id: 'miscellaneous', label: 'Miscellaneous', value: char.currentlyWearing?.miscellaneous || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const createPreferredClothingSection = (char: Character): CharacterTraitSection => ({
    id: 'preferred-clothing',
    title: 'Preferred Clothing',
    items: [
      { id: 'casual', label: 'Casual', value: char.preferredClothing?.casual || '', createdAt: 0, updatedAt: 0 },
      { id: 'work', label: 'Work', value: char.preferredClothing?.work || '', createdAt: 0, updatedAt: 0 },
      { id: 'sleep', label: 'Sleep', value: char.preferredClothing?.sleep || '', createdAt: 0, updatedAt: 0 },
      { id: 'undergarments', label: 'Undergarments', value: char.preferredClothing?.undergarments || '', createdAt: 0, updatedAt: 0 },
      { id: 'miscellaneous-pref', label: 'Miscellaneous', value: char.preferredClothing?.miscellaneous || '', createdAt: 0, updatedAt: 0 },
    ].filter(item => item.value),
    createdAt: 0,
    updatedAt: 0,
  });

  const renderSection = (section: CharacterTraitSection) => {
    const isOpen = openSections[section.id] !== false;
    return (
      <div key={section.id} className="border-t border-slate-200/60 first:border-t-0">
        <button
          onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
          className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-slate-100/50 transition-colors group"
        >
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{section.title}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12" height="12"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 text-slate-300 group-hover:text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {isOpen && (
          <div className="pb-4 px-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {section.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">{item.value || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCharacterCard = (baseChar: Character) => {
    // Apply session-scoped overrides to get the effective character
    const char = getEffectiveCharacter(baseChar);
    const isUpdating = updatingCharacterIds.has(char.id);
    
    return (
      <div
        key={char.id}
        className={`rounded-2xl transition-all duration-300 border-2 backdrop-blur-sm relative bg-white/30 border-transparent hover:bg-white ${isUpdating ? 'ring-2 ring-blue-400/60' : ''}`}
      >
        {/* Blue vignette overlay - scoped to this card */}
        {isUpdating && (
          <div 
            className="absolute inset-0 z-[1] pointer-events-none rounded-2xl overflow-hidden animate-vignette-pulse"
            style={{
              background: 'radial-gradient(ellipse 120% 100% at center 30%, transparent 25%, rgba(59, 130, 246, 0.25) 50%, rgba(59, 130, 246, 0.5) 80%, rgba(59, 130, 246, 1) 100%)'
            }}
          />
        )}
        
        {/* "Updating..." text overlay - top-left with ethereal glow */}
        {isUpdating && (
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <span 
              className="text-indigo-200/90 text-xs italic font-light tracking-tight animate-in fade-in zoom-in-95 duration-500"
              style={{
                textShadow: '0 0 8px rgba(129, 140, 248, 0.6), 0 0 16px rgba(129, 140, 248, 0.4), 0 0 24px rgba(129, 140, 248, 0.2)'
              }}
            >
              Updating...
            </span>
          </div>
        )}
        <div className="relative">
          <div className="w-full flex flex-col items-center gap-2 p-3 text-center">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full border-2 shadow-sm overflow-hidden bg-slate-50 transition-all duration-300 border-slate-100`}>
                {char.avatarDataUrl ? (
                  <img src={char.avatarDataUrl} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-xl italic uppercase">
                    {char.name.charAt(0)}
                  </div>
                )}
              </div>
              <Badge 
                variant={char.controlledBy === 'User' ? 'default' : 'secondary'}
                className={`absolute -bottom-1 -right-1 text-[9px] px-1.5 py-0.5 shadow-sm ${
                  char.controlledBy === 'User' 
                    ? 'bg-blue-500 hover:bg-blue-500 text-white border-0' 
                    : 'bg-slate-500 hover:bg-slate-500 text-white border-0'
                }`}
              >
                {char.controlledBy}
              </Badge>
            </div>
            <div className="text-sm font-bold tracking-tight text-slate-800">{char.name}</div>
          </div>
          
          {/* Edit dropdown menu - always visible */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-lg z-50">
                <DropdownMenuItem onClick={() => openCharacterEditModal(char)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit character
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteMainCharacter(char.id)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete character
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  const bubblesTransparent = appData.uiSettings?.transparentBubbles;
  const showBackground = appData.uiSettings?.showBackgrounds && activeScene;
  const darkMode = appData.uiSettings?.darkMode;
  const offsetBubbles = appData.uiSettings?.offsetBubbles;
  const dynamicText = appData.uiSettings?.dynamicText !== false;

  const handleUpdateUiSettings = (patch: { showBackgrounds?: boolean; transparentBubbles?: boolean; darkMode?: boolean; offsetBubbles?: boolean; proactiveCharacterDiscovery?: boolean; dynamicText?: boolean; proactiveNarrative?: boolean; narrativePov?: 'first' | 'third'; nsfwIntensity?: 'normal' | 'high'; realismMode?: boolean }) => {
    if (onUpdateUiSettings) {
      onUpdateUiSettings(patch);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-1 h-full w-full overflow-hidden relative ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>

      <aside className={`w-[300px] flex-shrink-0 border-r border-slate-200 flex flex-col h-full shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)] z-10 transition-colors relative overflow-hidden ${showBackground ? 'bg-white/90 backdrop-blur-md' : 'bg-white'}`}>
        {/* Sidebar background image layer */}
        {selectedSidebarBgUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={selectedSidebarBgUrl}
              className="w-full h-full object-cover"
              alt="Sidebar theme"
            />
          </div>
        )}
        
        
        {/* All sidebar content in relative z-10 container */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${
                sidebarBgIsLight 
                  ? 'text-black hover:text-blue-600' 
                  : 'text-white hover:text-blue-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Exit Scenario
            </button>
            
            {/* Settings cog button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-xl px-3 py-2 bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all active:scale-95">
                  <Settings className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsSidebarThemeOpen(true)} className="cursor-pointer">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Set Theme
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Day/Time Control Panel - Fixed at top */}
          <section className={`flex-shrink-0 rounded-xl p-4 border border-slate-200 transition-all duration-700 animate-sky ${getTimeBackground(currentTimeOfDay)}`}>
            <div className="flex gap-4 items-center">
              {/* Day Counter */}
              <div className="flex flex-col items-center gap-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${getTimeTextColor(currentTimeOfDay)}`}>Day</span>
                <div className="flex items-center bg-white rounded-lg border border-black shadow-sm">
                  <div className="px-3 py-1.5 min-w-[40px] text-center font-bold text-black text-sm">
                    {currentDay}
                  </div>
                  <div className="flex flex-col border-l border-black">
                    <button 
                      onClick={incrementDay}
                      className="px-1.5 py-0.5 hover:bg-slate-100 transition-colors text-black hover:text-blue-600"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={decrementDay}
                      disabled={currentDay <= 1}
                      className="px-1.5 py-0.5 hover:bg-slate-100 transition-colors text-black hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Time of Day Icons */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${getTimeTextColor(currentTimeOfDay)}`}>Time</span>
                <div className="flex gap-1">
                  {(['sunrise', 'day', 'sunset', 'night'] as TimeOfDay[]).map((time) => (
                    <button
                      key={time}
                      onClick={() => selectTime(time)}
                      className={`p-2 rounded-lg transition-all ${
                        currentTimeOfDay === time
                          ? 'bg-blue-100 border-2 border-blue-400 text-blue-600 shadow-sm'
                          : 'bg-white border border-black text-black hover:bg-slate-100'
                      }`}
                      title={time.charAt(0).toUpperCase() + time.slice(1)}
                    >
                      {getTimeIcon(time)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Main Characters - Scrollable section */}
          <section className="flex flex-col min-h-0 flex-shrink-0">
            <h3 className="flex-shrink-0 text-[11px] font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase">Main Characters</h3>
              <ScrollableSection maxHeight="400px" className="pr-1">
                <div className="space-y-2 pb-2">
                {mainCharactersForDisplay.map(char => 
                  char._source === 'character' 
                    ? renderCharacterCard(appData.characters.find(c => c.id === char.id)!)
                    : (
                      <SideCharacterCard
                        key={char.id}
                        character={char as SideCharacter}
                        onStartEdit={() => openCharacterEditModal(char as SideCharacter)}
                        onDelete={() => handleDeleteSideCharacter(char.id)}
                        isUpdating={updatingCharacterIds.has(char.id)}
                      />
                    )
                )}
                {mainCharactersForDisplay.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center italic py-4">No main characters.</p>
                )}
              </div>
            </ScrollableSection>
          </section>

          {/* Side Characters - Scrollable section */}
          <section className="flex flex-col min-h-0 flex-1">
            <h3 className="flex-shrink-0 text-[11px] font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase">Side Characters</h3>
            <ScrollableSection maxHeight="calc(50vh - 120px)" className="pr-1">
              <div className="space-y-2 pb-2">
                {sideCharactersForDisplay.map(char => 
                  char._source === 'character' 
                    ? renderCharacterCard(appData.characters.find(c => c.id === char.id)!)
                    : (
                      <SideCharacterCard
                        key={char.id}
                        character={char as SideCharacter}
                        onStartEdit={() => openCharacterEditModal(char as SideCharacter)}
                        onDelete={() => handleDeleteSideCharacter(char.id)}
                        isUpdating={updatingCharacterIds.has(char.id)}
                      />
                    )
                )}
                {sideCharactersForDisplay.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center italic py-4">No side characters yet.</p>
                )}
              </div>
            </ScrollableSection>
          </section>
        </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden h-full relative z-10">
        {/* Chat scroll area with background contained inside */}
        <div className="flex-1 relative overflow-hidden">
          {/* Background layer - contained to chat area only, not input bar */}
          {showBackground && (
            <div className="absolute inset-0 z-0">
              <img
                src={activeScene?.url}
                className="w-full h-full object-cover transition-opacity duration-1000 animate-in fade-in fill-mode-forwards"
                alt="Scene background"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}
          
          <div ref={scrollRef} onScroll={handleScroll} className="relative z-10 h-full overflow-y-auto px-4 md:px-8 lg:px-12 py-8 space-y-6 custom-scrollbar scrollbar-thin">
          {conversation?.messages.length === 0 && !streamingContent && (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
               <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-sm border border-slate-100">✨</div>
               <div className="text-center max-w-sm">
                 <p className="font-black uppercase tracking-[0.2em] text-sm text-slate-600">The stage is set</p>
                 <p className="text-xs mt-2 italic text-slate-400">Waiting for your first act. You can start by typing a prompt or action below.</p>
               </div>
             </div>
          )}

          {conversation?.messages.map((msg) => {
            const isAi = msg.role === 'assistant';
            
            // Get the primary speaker for user messages
            const userChar = appData.characters.find(c => c.controlledBy === 'User') || null;
            
            // Parse segments and merge by RESOLVED speaker identity
            // This ensures null (default AI) and explicit "Ashley:" merge correctly
            const rawSegments = parseMessageSegments(msg.text);
            const segments = mergeByRenderedSpeaker(rawSegments, isAi, appData, userChar);

            return (
              <div key={msg.id} className={`w-full animate-in fade-in slide-in-from-bottom-4 duration-500 group ${
                offsetBubbles 
                  ? `max-w-4xl ${isAi ? 'mr-auto' : 'ml-auto'}` 
                  : 'max-w-7xl mx-auto'
              }`}>
                <div className={`p-8 pt-14 pb-12 rounded-[2rem] shadow-2xl flex flex-col gap-4 transition-all relative ${
                  bubblesTransparent
                    ? 'bg-black/50'
                    : 'bg-[#1c1f26]'
                } ${!isAi ? 'border-2 border-blue-400' : 'border border-white/5 hover:border-white/20'}`}>
                  
                  {/* Action buttons - top right corner */}
                  <div className={`absolute top-4 right-4 flex items-center gap-1 transition-opacity ${
                    inlineEditingId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {inlineEditingId === msg.id ? (
                      <>
                        {/* Save (checkmark) */}
                        <button
                          onClick={handleInlineEditSave}
                          className="p-2 rounded-lg hover:bg-white/10 text-green-400 hover:text-green-300 transition-colors"
                          title="Save changes"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        {/* Cancel (X) */}
                        <button
                          onClick={handleInlineEditCancel}
                          className="p-2 rounded-lg hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
                          title="Cancel editing"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Continue button - show on the LAST message in the conversation (user or AI) */}
                        {msg.id === conversation?.messages.slice(-1)[0]?.id && (
                          <button
                            onClick={handleContinueConversation}
                            disabled={isStreaming || isRegenerating}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                            title="Continue"
                          >
                            <StepForward className="w-4 h-4" />
                          </button>
                        )}
                      
                        {/* Regenerate button - AI messages only */}
                        {isAi && (
                          <button
                            onClick={() => handleRegenerateMessage(msg.id)}
                            disabled={isStreaming || isRegenerating}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                            title="Regenerate response"
                          >
                            <RefreshCw className={`w-4 h-4 ${regeneratingMessageId === msg.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      
                        {/* Three-dot menu - all messages */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleCopyMessage(msg.text)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setInlineEditingId(msg.id); setInlineEditText(msg.text); }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                  
                  {/* Render image if this is an image message */}
                  {msg.imageUrl && (
                    <div className="flex justify-center py-4">
                      <div className="relative group/image max-w-2xl w-full">
                        <img 
                          src={msg.imageUrl} 
                          alt="Generated scene" 
                          className="rounded-xl shadow-lg border border-white/10 w-full h-auto"
                        />
                        {/* Regenerate overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                          <button
                            onClick={handleGenerateSceneImage}
                            disabled={isGeneratingImage}
                            className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                            title="Generate new image"
                          >
                            <RefreshCw className={`w-5 h-5 text-white ${isGeneratingImage ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-lg">
                          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3" />
                            Scene
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Render text segments - avatar only shows when speaker changes */}
                  {/* If this message is being regenerated, show streaming content instead */}
                  {msg.text && (() => {
                    // If this message is being regenerated, use streaming content
                    const displaySegments = regeneratingMessageId === msg.id && formattedStreamingContent
                      ? mergeByRenderedSpeaker(parseMessageSegments(formattedStreamingContent), isAi, appData, userChar)
                      : segments;
                    
                    return displaySegments.map((segment, segIndex) => {
                      // Determine speaker for this segment
                      let segmentChar: Character | SideCharacter | null = null;
                      let segmentName = '';
                      let segmentAvatar: string | null = null;
                      let isGenerating = false;
                      
                      if (segment.speakerName) {
                        // BOTH user and AI: If there's a speaker tag, use session-aware lookup
                        segmentChar = findCharacterWithSession(segment.speakerName);
                        segmentName = segment.speakerName;
                        segmentAvatar = segmentChar?.avatarDataUrl || null;
                        isGenerating = segmentChar && 'isAvatarGenerating' in segmentChar ? segmentChar.isAvatarGenerating : false;
                      } else if (!isAi) {
                        // User message WITHOUT speaker tag - default to user's effective character
                        const effectiveUserChar = userChar ? getEffectiveCharacter(userChar) : null;
                        segmentChar = effectiveUserChar || null;
                        segmentName = effectiveUserChar?.name || 'You';
                        segmentAvatar = effectiveUserChar?.avatarDataUrl || null;
                      } else {
                        // AI message without speaker - use first AI character's effective data
                        const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
                        segmentChar = aiChars.length > 0 ? getEffectiveCharacter(aiChars[0]) : null;
                        segmentName = segmentChar?.name || 'Narrator';
                        segmentAvatar = segmentChar?.avatarDataUrl || null;
                      }
                      
                      // Check if this is a different speaker than the previous segment
                      const prevSegment = segIndex > 0 ? displaySegments[segIndex - 1] : null;
                      let prevSpeakerName = '';
                      if (prevSegment) {
                        if (prevSegment.speakerName) {
                          prevSpeakerName = prevSegment.speakerName;
                        } else if (!isAi) {
                          prevSpeakerName = userChar?.name || 'You';
                        } else {
                          const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
                          prevSpeakerName = aiChars.length > 0 ? aiChars[0]?.name || 'Narrator' : 'Narrator';
                        }
                      }
                      const showAvatar = segIndex === 0 || prevSpeakerName !== segmentName;
                    
                    return (
                      <div key={segIndex} className={`relative ${segIndex > 0 && showAvatar ? 'mt-2.5 pt-2.5 border-t border-white/5' : ''}`}>
                        {showAvatar && (
                          <div className="float-left mr-4 mb-2 flex flex-col items-center gap-1.5 w-16">
                            <div className={`w-12 h-12 rounded-full border-2 border-white/10 shadow-lg overflow-hidden flex items-center justify-center ${segmentAvatar ? '' : 'bg-slate-800'}`}>
                              {isGenerating ? (
                                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                              ) : segmentAvatar ? (
                                <img src={segmentAvatar} alt={segmentName} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`font-black italic text-lg ${isAi ? 'text-white/30' : 'text-blue-400/50'}`}>
                                  {segmentName.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest text-center truncate w-full ${!isAi ? 'text-blue-300' : 'text-slate-500'}`}>
                              {segmentName}
                            </span>
                          </div>
                        )}
                        <div className={showAvatar ? "pt-1 antialiased" : "antialiased"}>
                          {inlineEditingId === msg.id && segIndex === 0 ? (
                            <textarea
                              value={inlineEditText}
                              onChange={(e) => setInlineEditText(e.target.value)}
                              className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white text-[15px] leading-relaxed font-normal resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                              style={{ height: 'auto', minHeight: '100px' }}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }}
                              onInput={(e) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                              autoFocus
                            />
                          ) : inlineEditingId === msg.id ? null : (
                            <FormattedMessage text={segment.content} dynamicText={dynamicText} />
                          )}
                        </div>
                        {showAvatar && <div className="clear-both" />}
                      </div>
                     );
                    });
                  })()}
                  
                  {/* Day/Time Badge - bottom left */}
                  {(msg.day || msg.timeOfDay) && (
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 text-sm text-white">
                      {msg.day && <span>Day: {msg.day}</span>}
                      {msg.timeOfDay && (
                        <span className="flex items-center gap-1">
                          {msg.timeOfDay === 'sunrise' && <Sunrise className="w-5 h-5" />}
                          {msg.timeOfDay === 'day' && <Sun className="w-5 h-5" />}
                          {msg.timeOfDay === 'sunset' && <Sunset className="w-5 h-5" />}
                          {msg.timeOfDay === 'night' && <Moon className="w-5 h-5" />}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Brain Icon for Quick Memory Save - bottom right */}
                  <div className="absolute bottom-3 right-4">
                    <MemoryQuickSaveButton
                      messageId={msg.id}
                      messageText={msg.text}
                      day={msg.day}
                      timeOfDay={msg.timeOfDay}
                      characterNames={allCharacterNames}
                      modelId={modelId}
                      onSaveMemory={handleQuickSaveMemory}
                      hasExistingMemory={memories.some(m => m.sourceMessageId === msg.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {formattedStreamingContent && !regeneratingMessageId && (() => {
            // Parse formatted streaming content into segments for multi-speaker rendering (only for NEW messages, not regeneration)
            // Using formattedStreamingContent to prevent flickering from system tags and placeholder names
            const userChar = appData.characters.find(c => c.controlledBy === 'User') || null;
            const rawSegments = parseMessageSegments(formattedStreamingContent);
            const segments = mergeByRenderedSpeaker(rawSegments, true, appData, userChar);
            
            return (
              <div className={`w-full ${offsetBubbles ? 'max-w-4xl mr-auto' : 'max-w-7xl mx-auto'}`}>
                <div className={`p-8 pt-14 pb-12 rounded-[2rem] border shadow-2xl flex flex-col gap-4 ${
                    bubblesTransparent
                      ? 'bg-black/50 border-white/5'
                      : 'bg-[#1c1f26] border-white/5'
                }`}>
                  {segments.map((segment, segIndex) => {
                    // Look up character for this segment using session-aware lookup
                    const segmentChar = segment.speakerName 
                      ? findCharacterWithSession(segment.speakerName)
                      : (() => {
                          const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
                          return aiChars.length > 0 ? getEffectiveCharacter(aiChars[0]) : null;
                        })();
                    const segmentName = segment.speakerName || segmentChar?.name || 'Thinking';
                    const segmentAvatar = segmentChar?.avatarDataUrl || null;
                    const isGenerating = segmentChar && 'isAvatarGenerating' in segmentChar ? segmentChar.isAvatarGenerating : false;
                    
                    // Check if this is a different speaker than the previous segment
                    const prevSegment = segIndex > 0 ? segments[segIndex - 1] : null;
                    let prevSpeakerName = '';
                    if (prevSegment) {
                      const prevChar = prevSegment.speakerName 
                        ? findCharacterWithSession(prevSegment.speakerName)
                        : (() => {
                            const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
                            return aiChars.length > 0 ? getEffectiveCharacter(aiChars[0]) : null;
                          })();
                      prevSpeakerName = prevSegment.speakerName || prevChar?.name || 'Thinking';
                    }
                    const showAvatar = segIndex === 0 || prevSpeakerName !== segmentName;
                    
                    return (
                      <div key={segIndex} className={`relative ${segIndex > 0 && showAvatar ? 'mt-2.5 pt-2.5 border-t border-white/5' : ''}`}>
                        {showAvatar && (
                          <div className="float-left mr-4 mb-2 flex flex-col items-center gap-1.5 w-16">
                            <div className={`w-12 h-12 rounded-full border-2 border-white/10 shadow-lg overflow-hidden flex items-center justify-center ${segmentAvatar ? '' : 'bg-slate-800 animate-pulse'}`}>
                              {isGenerating ? (
                                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                              ) : segmentAvatar ? (
                                <img src={segmentAvatar} alt={segmentName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-white/30 font-black italic text-lg">
                                  {segmentName.charAt(0) || '...'}
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-center text-slate-500 truncate w-full">
                              {segmentName}
                            </span>
                          </div>
                        )}
                        <div className={showAvatar ? "pt-1 antialiased" : "antialiased"}>
                          <FormattedMessage text={segment.content} dynamicText={dynamicText} />
                        </div>
                        {showAvatar && <div className="clear-both" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          </div>
        </div>

        <div className={`pt-3 pb-8 px-8 border-t border-slate-700 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] transition-colors relative z-20 bg-[#1a1a1a]`}>
          <div className="w-full max-w-7xl mx-auto space-y-3">
            {/* Quick Actions Bar - Above Input */}
            <div className="flex items-center gap-2 relative">
              <Button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                variant="secondary"
                className="!border-slate-900 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Chat Settings
              </Button>
              
              {/* Generate Image Button */}
              <Button
                onClick={handleGenerateSceneImage}
                disabled={isStreaming || isGeneratingImage || !conversation?.messages?.length}
                variant="secondary"
                className="!border-slate-900 flex items-center gap-2"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Generate Image
                  </>
                )}
              </Button>
              
              {/* Memories Button */}
              <Button
                onClick={() => setIsMemoriesModalOpen(true)}
                variant="secondary"
                className="!border-slate-900 flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Memories {memories.length > 0 && `(${memories.length})`}
              </Button>
              
            </div>
            
            {/* Input Area */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <TextArea
                  value={input}
                  onChange={setInput}
                  placeholder="Describe your action or dialogue..."
                  rows={3}
                  autoResize={true}
                  className="!py-4 !px-6 !bg-slate-50 !border-slate-200 !text-slate-900 !placeholder-slate-400 focus:!ring-blue-500/10 focus:!border-blue-400 transition-all min-h-[112px] !rounded-2xl shadow-inner"
                  onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={`self-end px-10 py-4 text-white shadow-lg font-black uppercase tracking-widest rounded-2xl border-none transition-all active:scale-95 ${
                  !input.trim() || isStreaming
                    ? '!bg-slate-500 opacity-70 cursor-not-allowed'
                    : '!bg-blue-600 hover:!bg-blue-500'
                }`}
              >
                {isStreaming ? '...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Character Edit Modal */}
<CharacterEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        character={characterToEdit}
        onSave={handleModalSave}
        isSaving={isSavingEdit}
        modelId={modelId}
        conversationId={conversationId}
        allCharacters={allCharactersForDisplay}
        scenarioWorldCore={effectiveWorldCore}
        onSaveScenarioCard={(patch) => {
          setWorldCoreSessionOverrides(prev => prev ? { ...prev, ...patch } : patch);
        }}
      />
      
      {/* Sidebar Theme Modal */}
      <SidebarThemeModal
        isOpen={isSidebarThemeOpen}
        onClose={() => setIsSidebarThemeOpen(false)}
        selectedBackgroundId={selectedSidebarBgId}
        backgrounds={sidebarBackgrounds}
        onSelectBackground={handleSelectSidebarBg}
        onUpload={handleUploadSidebarBg}
        onDelete={handleDeleteSidebarBg}
        isUploading={isUploadingSidebarBg}
      />
      
      {/* Memories Modal */}
      <MemoriesModal
        isOpen={isMemoriesModalOpen}
        onClose={() => setIsMemoriesModalOpen(false)}
        conversationId={conversationId}
        currentDay={currentDay}
        currentTimeOfDay={currentTimeOfDay}
        memories={memories}
        memoriesEnabled={memoriesEnabled}
        onMemoriesChange={setMemories}
        onToggleEnabled={setMemoriesEnabled}
        onCreateMemory={handleCreateMemory}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={handleDeleteMemory}
        onDeleteAllMemories={handleDeleteAllMemories}
      />
      
      {/* Chat Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)]">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-900 uppercase tracking-tight">
              <Settings className="w-5 h-5" />
              Chat Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Interface Settings Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Interface Settings
              </h3>
              
              {/* 2-column grid for toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Show Backgrounds */}
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-700">Show Background</span>
                  <LabeledToggle
                    checked={appData.uiSettings?.showBackgrounds ?? false}
                    onCheckedChange={(v) => handleUpdateUiSettings({ showBackgrounds: v })}
                  />
                </div>
                
                {/* Transparent Bubbles */}
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-700">Transparent Bubbles</span>
                  <LabeledToggle
                    checked={bubblesTransparent}
                    onCheckedChange={(v) => handleUpdateUiSettings({ transparentBubbles: v })}
                  />
                </div>
                
                {/* Dark Mode */}
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-700">Dark Mode</span>
                  <LabeledToggle
                    checked={appData.uiSettings?.darkMode ?? false}
                    onCheckedChange={(v) => handleUpdateUiSettings({ darkMode: v })}
                  />
                </div>
                
                {/* Offset Bubbles */}
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-700">Offset Bubbles</span>
                  <LabeledToggle
                    checked={offsetBubbles}
                    onCheckedChange={(v) => handleUpdateUiSettings({ offsetBubbles: v })}
                  />
                </div>
                
                {/* Dynamic Text */}
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-700">Dynamic Text</span>
                  <LabeledToggle
                    checked={dynamicText}
                    onCheckedChange={(v) => handleUpdateUiSettings({ dynamicText: v })}
                  />
                </div>
              </div>
            </div>
            
            {/* Visual Divider */}
            <div className="border-t border-slate-200" />
            
            {/* AI Behavior Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                AI Behavior
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Proactive Character Discovery */}
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-700">Character Discovery</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      AI may introduce characters from established media
                    </p>
                  </div>
                  <LabeledToggle
                    checked={appData.uiSettings?.proactiveCharacterDiscovery !== false}
                    onCheckedChange={(v) => handleUpdateUiSettings({ proactiveCharacterDiscovery: v })}
                  />
                </div>
                
                {/* Proactive AI Mode */}
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-700">Proactive AI Mode</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      AI drives the story forward assertively
                    </p>
                  </div>
                  <LabeledToggle
                    checked={appData.uiSettings?.proactiveNarrative !== false}
                    onCheckedChange={(v) => handleUpdateUiSettings({ proactiveNarrative: v })}
                  />
                </div>
              </div>
              
              {/* POV Selection */}
              <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-700">Narrative POV</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How AI characters narrate their actions and thoughts
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateUiSettings({ narrativePov: 'first' })}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                      appData.uiSettings?.narrativePov === 'first'
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    )}
                  >
                    1st Person
                  </button>
                  <button
                    onClick={() => handleUpdateUiSettings({ narrativePov: 'third' })}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                      (appData.uiSettings?.narrativePov || 'third') === 'third'
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    )}
                  >
                    3rd Person
                  </button>
                </div>
              </div>
              
              {/* NSFW Intensity */}
              <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-700">NSFW Intensity</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How proactively AI engages in mature content
                  </p>
                </div>
                <LabeledToggle
                  checked={appData.uiSettings?.nsfwIntensity === 'high'}
                  onCheckedChange={(v) => handleUpdateUiSettings({ nsfwIntensity: v ? 'high' : 'normal' })}
                  offLabel="Normal"
                  onLabel="High"
                />
              </div>
              
              {/* Realism Mode */}
              <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-700">Realism Mode</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Physical actions have realistic consequences
                  </p>
                </div>
                <LabeledToggle
                  checked={appData.uiSettings?.realismMode === true}
                  onCheckedChange={(v) => handleUpdateUiSettings({ realismMode: v })}
                />
              </div>
            </div>
            
            {/* Footer Note */}
            <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
              Backgrounds will automatically change based on the story context if scene images are tagged in the gallery.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Character Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Delete Character</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to delete this character? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCharacterToDelete(null);
              }}
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 border-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCharacter}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatInterfaceTab;
