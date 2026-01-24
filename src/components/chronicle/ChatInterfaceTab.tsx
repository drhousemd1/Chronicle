import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScenarioData, Character, Conversation, Message, CharacterTraitSection, Scene, TimeOfDay, SideCharacter, CharacterSessionState, Memory } from '../../types';
import { Button, TextArea } from './UI';
import { Badge } from '@/components/ui/badge';
import { uid, now, uuid } from '../../services/storage';
import { generateRoleplayResponseStream } from '../../services/llm';
import { RefreshCw, MoreVertical, Copy, Pencil, Trash2, ChevronUp, ChevronDown, Sunrise, Sun, Sunset, Moon, Loader2, StepForward, Settings, Image as ImageIcon, Brain } from 'lucide-react';
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
import { SideCharacterCard } from './SideCharacterCard';
import { CharacterEditModal, CharacterEditDraft } from './CharacterEditModal';
import { ScrollableSection } from './ScrollableSection';
import { SidebarThemeModal } from './SidebarThemeModal';
import { MemoriesModal } from './MemoriesModal';
import { MemoryQuickSaveButton } from './MemoryQuickSaveButton';
import { UserBackground } from '@/types';
import { getStyleById, DEFAULT_STYLE_ID } from '@/constants/avatar-styles';

interface ChatInterfaceTabProps {
  scenarioId: string;
  appData: ScenarioData;
  conversationId: string;
  modelId: string;
  onUpdate: (convs: Conversation[]) => void;
  onBack: () => void;
  onSaveScenario: (conversations?: Conversation[]) => void;
  onUpdateUiSettings?: (patch: { showBackgrounds?: boolean; transparentBubbles?: boolean; darkMode?: boolean; offsetBubbles?: boolean }) => void;
  onUpdateSideCharacters?: (sideCharacters: SideCharacter[]) => void;
}

const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
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
  onUpdateSideCharacters
}) => {
  const [input, setInput] = useState('');
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('day');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
  
  // Memories state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoriesEnabled, setMemoriesEnabled] = useState(true);
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);
  const [memoriesLoaded, setMemoriesLoaded] = useState(false);
  
  // Track which characters are showing the "updating" indicator
  const [updatingCharacterIds, setUpdatingCharacterIds] = useState<Set<string>>(new Set());
  
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
  const getEffectiveCharacter = useCallback((baseChar: Character): Character => {
    const sessionState = sessionStates.find(s => s.characterId === baseChar.id);
    if (!sessionState) return baseChar;
    
    return {
      ...baseChar,
      name: sessionState.name || baseChar.name,
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
      // Session-scoped avatar overrides
      avatarDataUrl: sessionState.avatarUrl || baseChar.avatarDataUrl,
      avatarPosition: sessionState.avatarPosition || baseChar.avatarPosition,
      // Session-scoped control and role overrides
      controlledBy: sessionState.controlledBy || baseChar.controlledBy,
      characterRole: sessionState.characterRole || baseChar.characterRole,
    };
  }, [sessionStates]);

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
  
  // Trigger update indicator for a character (5-second duration)
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
          physicalAppearance: effective.physicalAppearance,
          currentlyWearing: effective.currentlyWearing,
          location: effective.location,
          currentMood: effective.currentMood
        };
      });
      
      // Also include side characters
      const sideCharsData = (appData.sideCharacters || []).map(sc => ({
        name: sc.name,
        physicalAppearance: sc.physicalAppearance,
        currentlyWearing: sc.currentlyWearing,
        location: sc.location,
        currentMood: sc.currentMood
      }));
      
      const allCharacters = [...charactersData, ...sideCharsData];
      
      const { data, error } = await supabase.functions.invoke('extract-character-updates', {
        body: {
          userMessage,
          aiResponse,
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

  // Apply extracted updates to session state (simplified version for new format)
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
      // Find the character
      const mainChar = appData.characters.find(c => c.name.toLowerCase() === charNameLower);
      const sideChar = (appData.sideCharacters || []).find(sc => sc.name.toLowerCase() === charNameLower);
      
      if (mainChar) {
        // Show updating indicator
        showCharacterUpdateIndicator(mainChar.id);
        
        // Find or create session state
        let sessionState = sessionStates.find(s => s.characterId === mainChar.id);
        if (!sessionState) {
          sessionState = await supabaseData.createSessionState(mainChar, conversationId, user.id);
          setSessionStates(prev => [...prev, sessionState!]);
        }
        
        // Build patch from updates
        const patch: Record<string, any> = {};
        for (const update of charUpdates) {
          const { field, value } = update;
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'physicalAppearance') {
              patch.physicalAppearance = { ...(sessionState.physicalAppearance || {}), ...(patch.physicalAppearance || {}), [child]: value };
            } else if (parent === 'currentlyWearing') {
              patch.currentlyWearing = { ...(sessionState.currentlyWearing || {}), ...(patch.currentlyWearing || {}), [child]: value };
            } else if (parent === 'preferredClothing') {
              patch.preferredClothing = { ...(sessionState.preferredClothing || {}), ...(patch.preferredClothing || {}), [child]: value };
            }
          } else {
            patch[field] = value;
          }
        }
        
        if (Object.keys(patch).length > 0) {
          await supabaseData.updateSessionState(sessionState.id, patch);
          setSessionStates(prev => prev.map(s => s.id === sessionState!.id ? { ...s, ...patch } : s));
          console.log(`[applyExtractedUpdates] Updated ${mainChar.name}:`, patch);
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
          } else {
            patch[field] = value;
          }
        }
        
        if (Object.keys(patch).length > 0) {
          await supabaseData.updateSideCharacter(sideChar.id, patch);
          if (onUpdateSideCharacters) {
            const updated = (appData.sideCharacters || []).map(sc => 
              sc.id === sideChar.id ? { ...sc, ...patch } : sc
            );
            onUpdateSideCharacters(updated);
          }
          console.log(`[applyExtractedUpdates] Updated side character ${sideChar.name}:`, patch);
        }
      }
    }
  };

  const activeScene = useMemo(() =>
    appData.scenes.find(s => s.id === activeSceneId) || null
  , [appData.scenes, activeSceneId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingContent]);

  // Sync day/time state from conversation
  useEffect(() => {
    if (conversation) {
      setCurrentDay(conversation.currentDay || 1);
      setCurrentTimeOfDay(conversation.currentTimeOfDay || 'day');
    }
  }, [conversation?.id]);

  useEffect(() => {
    // For the FIRST message (opening dialog), always use starting scene
    // This ensures the starred "default" scene takes priority over any keyword detection
    const isInitialState = conversation?.messages.length === 1;
    
    if (isInitialState) {
      const startingScene = appData.scenes.find(s => s.isStartingScene);
      if (startingScene) {
        setActiveSceneId(startingScene.id);
        return; // Skip keyword detection for opening
      }
    }
    
    // First, try to find a [SCENE: tag] command in messages (highest priority)
    let foundSceneTag = false;
    if (conversation?.messages.length) {
      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        const match = conversation.messages[i].text.match(/\[SCENE:\s*(.*?)\]/);
        if (match) {
          const tag = match[1].trim();
          // Check if any scene has this tag in its tags array
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
    // Skip the first message (opening dialog) to preserve starting scene
    if (!foundSceneTag && conversation?.messages.length && appData.scenes.length > 0) {
      // Start from the end, but skip keyword detection in the opening dialog (index 0)
      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        // For the first message, only detect if we're past initial state (more than 1 message)
        if (i === 0 && conversation.messages.length > 1) {
          // Skip keyword detection in opening dialog when other messages exist
          continue;
        }
        
        const messageText = conversation.messages[i].text.toLowerCase();
        
        // Check each scene's tags as keywords in the message
        for (const scene of appData.scenes) {
          const sceneTags = scene.tags ?? [];
          for (const tag of sceneTags) {
            if (tag && tag.trim() !== '') {
              const tagKeyword = tag.toLowerCase().trim();
              // Escape special regex characters in the tag
              const escapedTag = tagKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              // Match whole word boundaries to avoid false positives
              const wordBoundaryRegex = new RegExp(`\\b${escapedTag}\\b`, 'i');
              if (wordBoundaryRegex.test(messageText)) {
                setActiveSceneId(scene.id);
                foundSceneTag = true;
                break;
              }
            }
          }
          if (foundSceneTag) break;
        }
        if (foundSceneTag) break;
      }
    }
    
    // If no [SCENE:] tag or keyword was found, fall back to the starting scene
    if (!foundSceneTag) {
      const startingScene = appData.scenes.find(s => s.isStartingScene);
      if (startingScene) {
        setActiveSceneId(startingScene.id);
      }
    }
  }, [conversation?.messages, appData.scenes]);

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

    try {
      let fullText = '';
      const stream = generateRoleplayResponseStream(appData, conversationId, input, modelId, currentDay, currentTimeOfDay, memories, memoriesEnabled);

      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
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
      const cleanedText = stripUpdateTags(fullText);

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

  const handleRegenerateMessage = async (messageId: string) => {
    const msgIndex = conversation?.messages.findIndex(m => m.id === messageId);
    if (msgIndex === undefined || msgIndex < 1) return;
    
    const userMessage = conversation?.messages[msgIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;
    
    const messagesBeforeAi = conversation?.messages.slice(0, msgIndex) || [];
    
    setIsRegenerating(true);
    setIsStreaming(true);
    setStreamingContent('');
    
    try {
      let fullText = '';
      const stream = generateRoleplayResponseStream(appData, conversationId, userMessage.text, modelId, currentDay, currentTimeOfDay, memories, memoriesEnabled);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
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
      const cleanedText = stripUpdateTags(fullText);
      
      const newAiMsg: Message = { 
        id: uuid(), 
        role: 'assistant', 
        text: cleanedText, 
        day: currentDay,
        timeOfDay: currentTimeOfDay,
        createdAt: now() 
      };
      const updatedConvs = appData.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...messagesBeforeAi, newAiMsg], updatedAt: now() }
          : c
      );
      onUpdate(updatedConvs);
      onSaveScenario(updatedConvs);
      toast.success('Response regenerated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to regenerate response');
    } finally {
      setIsRegenerating(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleContinueConversation = async () => {
    if (!conversation || isStreaming) return;
    
    setIsStreaming(true);
    setStreamingContent('');
    
    // Get character control lists for explicit instruction
    const userControlledNames = appData.characters
      .filter(c => c.controlledBy === 'User')
      .map(c => c.name);
    
    const aiControlledNames = appData.characters
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
      const stream = generateRoleplayResponseStream(appData, conversationId, continuePrompt, modelId, currentDay, currentTimeOfDay, memories, memoriesEnabled);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
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
      const cleanedText = stripUpdateTags(fullText);
      
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
      
// Update session state with draft changes (including avatar, control, and role)
      await supabaseData.updateSessionState(sessionState.id, {
        name: draft.name,
        age: draft.age,
        sexType: draft.sexType,
        roleDescription: draft.roleDescription,
        location: draft.location,
        currentMood: draft.currentMood,
        physicalAppearance: draft.physicalAppearance,
        currentlyWearing: draft.currentlyWearing as any,
        preferredClothing: draft.preferredClothing,
        customSections: draft.sections,
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
    const isExpanded = expandedCharId === char.id;
    const isUpdating = updatingCharacterIds.has(char.id);
    
    return (
      <div
        key={char.id}
        className={`rounded-2xl transition-all duration-300 border-2 backdrop-blur-sm relative ${
          isExpanded ? 'bg-white border-blue-100 shadow-sm' : 'bg-white/30 border-transparent hover:bg-white'
        } ${isUpdating ? 'ring-2 ring-blue-400/60' : ''}`}
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
          <button
            onClick={() => toggleCharacterExpand(char.id)}
            className="w-full flex flex-col items-center gap-2 p-3 text-center group"
          >
            <div className="relative">
              <div className={`w-20 h-20 rounded-full border-2 shadow-sm overflow-hidden bg-slate-50 transition-all duration-300 ${isExpanded ? 'border-blue-400 scale-105 shadow-blue-100' : 'border-slate-100 group-hover:border-blue-200'}`}>
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
            <div className="flex items-center gap-2">
              <div className={`text-sm font-bold tracking-tight transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-800'}`}>{char.name}</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14" height="14"
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-300 text-slate-400 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>
          
          {/* Edit dropdown menu - visible when expanded */}
          {isExpanded && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-lg">
                  <DropdownMenuItem onClick={() => openCharacterEditModal(char)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit for this session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="px-5 pb-5 pt-1 space-y-1 animate-in zoom-in-95 duration-300">
            {/* 1. Basics - Avatar panel data */}
            {createBasicsSection(char).items.length > 0 && renderSection(createBasicsSection(char))}
            
            {/* 2. Physical Appearance - hardcoded */}
            {createPhysicalAppearanceSection(char).items.length > 0 && renderSection(createPhysicalAppearanceSection(char))}
            
            {/* 3. Currently Wearing - hardcoded */}
            {createCurrentlyWearingSection(char).items.length > 0 && renderSection(createCurrentlyWearingSection(char))}
            
            {/* 4. Preferred Clothing - hardcoded */}
            {createPreferredClothingSection(char).items.length > 0 && renderSection(createPreferredClothingSection(char))}
            
            {/* 5. Custom sections */}
            {char.sections.map(section => renderSection(section))}
          </div>
        )}
      </div>
    );
  };

  const bubblesTransparent = appData.uiSettings?.transparentBubbles;
  const showBackground = appData.uiSettings?.showBackgrounds && activeScene;
  const darkMode = appData.uiSettings?.darkMode;
  const offsetBubbles = appData.uiSettings?.offsetBubbles;

  const handleUpdateUiSettings = (patch: { showBackgrounds?: boolean; transparentBubbles?: boolean; darkMode?: boolean; offsetBubbles?: boolean }) => {
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
              className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
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
          <section className="flex-shrink-0 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex gap-4 items-center">
              {/* Day Counter */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Day</span>
                <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="px-3 py-1.5 min-w-[40px] text-center font-bold text-slate-700 text-sm">
                    {currentDay}
                  </div>
                  <div className="flex flex-col border-l border-slate-200">
                    <button 
                      onClick={incrementDay}
                      className="px-1.5 py-0.5 hover:bg-slate-100 transition-colors text-slate-500 hover:text-blue-600"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={decrementDay}
                      disabled={currentDay <= 1}
                      className="px-1.5 py-0.5 hover:bg-slate-100 transition-colors text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Time of Day Icons */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                <div className="flex gap-1">
                  {(['sunrise', 'day', 'sunset', 'night'] as TimeOfDay[]).map((time) => (
                    <button
                      key={time}
                      onClick={() => selectTime(time)}
                      className={`p-2 rounded-lg transition-all ${
                        currentTimeOfDay === time
                          ? 'bg-blue-100 border-2 border-blue-400 text-blue-600 shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
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
                        isExpanded={expandedCharId === char.id}
                        onToggleExpand={() => toggleCharacterExpand(char.id)}
                        onStartEdit={() => openCharacterEditModal(char as SideCharacter)}
                        openSections={openSections}
                        onToggleSection={toggleSection}
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
                        isExpanded={expandedCharId === char.id}
                        onToggleExpand={() => toggleCharacterExpand(char.id)}
                        onStartEdit={() => openCharacterEditModal(char as SideCharacter)}
                        openSections={openSections}
                        onToggleSection={toggleSection}
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
          
          <div ref={scrollRef} className="relative z-10 h-full overflow-y-auto px-4 md:px-8 lg:px-12 py-8 space-y-6 custom-scrollbar scrollbar-thin">
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
                <div className={`p-8 pb-12 rounded-[2rem] shadow-2xl flex flex-col gap-4 transition-all relative ${
                  bubblesTransparent
                    ? 'bg-black/50'
                    : 'bg-[#1c1f26]'
                } ${!isAi ? 'border-2 border-blue-400' : 'border border-white/5 hover:border-white/20'}`}>
                  
                  {/* Action buttons - top right corner */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
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
                        <DropdownMenuItem onClick={() => { setEditingMessage(msg); setEditText(msg.text); }}>
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
                  
                  {/* Render text segments - each speaker gets their own avatar block */}
                  {msg.text && segments.map((segment, segIndex) => {
                    // Determine speaker for this segment
                    let segmentChar: Character | SideCharacter | null = null;
                    let segmentName = '';
                    let segmentAvatar: string | null = null;
                    let isGenerating = false;
                    
                    if (segment.speakerName) {
                      // BOTH user and AI: If there's a speaker tag, use that character
                      segmentChar = findCharacterByName(segment.speakerName, appData);
                      segmentName = segment.speakerName;
                      segmentAvatar = segmentChar?.avatarDataUrl || null;
                      isGenerating = segmentChar && 'isAvatarGenerating' in segmentChar ? segmentChar.isAvatarGenerating : false;
                    } else if (!isAi) {
                      // User message WITHOUT speaker tag - default to user's character
                      segmentChar = userChar || null;
                      segmentName = userChar?.name || 'You';
                      segmentAvatar = userChar?.avatarDataUrl || null;
                    } else {
                      // AI message without speaker - use first AI character as default
                      const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
                      segmentChar = aiChars.length > 0 ? aiChars[0] : null;
                      segmentName = segmentChar?.name || 'Narrator';
                      segmentAvatar = segmentChar?.avatarDataUrl || null;
                    }
                    
                    return (
                      <div key={segIndex} className={`relative ${segIndex > 0 ? 'mt-2.5 pt-2.5 border-t border-white/5' : ''}`}>
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
                        <div className="pt-1 antialiased">
                          <FormattedMessage text={segment.content} />
                        </div>
                        <div className="clear-both" />
                      </div>
                    );
                  })}
                  
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

          {streamingContent && (() => {
            // Parse streaming content into segments for multi-speaker rendering
            const userChar = appData.characters.find(c => c.controlledBy === 'User') || null;
            const rawSegments = parseMessageSegments(streamingContent);
            const segments = mergeByRenderedSpeaker(rawSegments, true, appData, userChar);
            
            return (
              <div className={`w-full ${offsetBubbles ? 'max-w-4xl mr-auto' : 'max-w-7xl mx-auto'}`}>
                <div className={`p-8 pb-12 rounded-[2rem] border shadow-2xl flex flex-col gap-4 ${
                    bubblesTransparent
                      ? 'bg-black/50 border-white/5'
                      : 'bg-[#1c1f26] border-white/5'
                }`}>
                  {segments.map((segment, segIndex) => {
                    // Look up character for this segment
                    const segmentChar = segment.speakerName 
                      ? findCharacterByName(segment.speakerName, appData)
                      : appData.characters.find(c => c.controlledBy === 'AI');
                    const segmentName = segment.speakerName || segmentChar?.name || 'Thinking';
                    const segmentAvatar = segmentChar?.avatarDataUrl || null;
                    const isGenerating = segmentChar && 'isAvatarGenerating' in segmentChar ? segmentChar.isAvatarGenerating : false;
                    
                    return (
                      <div key={segIndex} className={`relative ${segIndex > 0 ? 'mt-2.5 pt-2.5 border-t border-white/5' : ''}`}>
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
                        <div className="pt-1 antialiased">
                          <FormattedMessage text={segment.content} />
                        </div>
                        <div className="clear-both" />
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
                className="!border-slate-900"
              >
                Interface
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
              
              {isSettingsOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-4 animate-in slide-in-from-bottom-2 z-[100]">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Show Backgrounds</span>
                      <input
                        type="checkbox"
                        checked={appData.uiSettings?.showBackgrounds}
                        onChange={(e) => handleUpdateUiSettings({ showBackgrounds: e.target.checked })}
                      />
                   </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transparent Bubbles</span>
                       <input
                         type="checkbox"
                         checked={bubblesTransparent}
                         onChange={(e) => handleUpdateUiSettings({ transparentBubbles: e.target.checked })}
                       />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dark Mode</span>
                       <input
                         type="checkbox"
                         checked={appData.uiSettings?.darkMode}
                         onChange={(e) => handleUpdateUiSettings({ darkMode: e.target.checked })}
                         className="accent-blue-500"
                       />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offset Bubbles</span>
                       <input
                         type="checkbox"
                         checked={offsetBubbles}
                         onChange={(e) => handleUpdateUiSettings({ offsetBubbles: e.target.checked })}
                         className="accent-blue-500"
                       />
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-3">
                     Backgrounds will automatically change based on the story context if scene images are tagged in the gallery.
                   </p>
                </div>
              )}
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

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <TextArea
            value={editText}
            onChange={setEditText}
            rows={6}
            className="w-full"
            placeholder="Edit your message..."
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingMessage(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditMessage}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Character Edit Modal */}
<CharacterEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        character={characterToEdit}
        onSave={handleModalSave}
        isSaving={isSavingEdit}
        modelId={modelId}
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
    </div>
  );
};

export default ChatInterfaceTab;
