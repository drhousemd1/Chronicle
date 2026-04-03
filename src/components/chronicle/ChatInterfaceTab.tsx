import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScenarioData, Character, Conversation, Message, CharacterTraitSection, Scene, TimeOfDay, SideCharacter, CharacterSessionState, Memory, WorldCore, StoryGoal, GoalFlexibility } from '../../types';
import { Button, TextArea } from './UI';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { uid, now, uuid } from '@/utils';
import { generateRoleplayResponseStream, getSystemInstruction, conciseStyleHints, balancedStyleHints, detailedStyleHints, REGENERATION_DIRECTIVE_TEXT, buildCanonNote } from '../../services/llm';
import { RefreshCw, MoreVertical, Copy, Pencil, Trash2, ChevronUp, ChevronDown, Sunrise, Sun, Sunset, Moon, Loader2, StepForward, Settings, Image as ImageIcon, Brain, Check, X, Info, Play, Pause, Move, Palette } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogContentBare,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

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
import {
  UserBackground,
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
  type CurrentlyWearing,
  type PhysicalAppearance,
  type PreferredClothing,
} from '@/types';
import { useArtStyles } from '@/contexts/ArtStylesContext';
import { LabeledToggle } from '@/components/ui/labeled-toggle';
import { trackAiUsageEvent } from '@/services/usage-tracking';
import {
  buildRequiredPresence,
  trackApiValidationSnapshot,
} from '@/services/api-usage-validation';

interface ChatInterfaceTabProps {
  scenarioId: string;
  appData: ScenarioData;
  conversationId: string;
  modelId: string;
  isAdmin?: boolean;
  onUpdate: (convs: Conversation[]) => void;
  onBack: () => void;
  onSaveScenario: (conversations?: Conversation[]) => void;
  onUpdateUiSettings?: (patch: {
    showBackgrounds?: boolean;
    transparentBubbles?: boolean;
    darkMode?: boolean;
    offsetBubbles?: boolean;
    proactiveCharacterDiscovery?: boolean;
    dynamicText?: boolean;
    proactiveNarrative?: boolean;
    narrativePov?: 'first' | 'third';
    nsfwIntensity?: 'normal' | 'high';
    realismMode?: boolean;
    responseVerbosity?: 'concise' | 'balanced' | 'detailed';
    chatCanvasColor?: string;
    chatBubbleColor?: string;
    apiUsageTestTracking?: boolean;
  }) => void;
  onUpdateSideCharacters?: (sideCharacters: SideCharacter[]) => void;
  // Lazy loading props
  onLoadOlderMessages?: (conversationId: string, beforeCreatedAt: string) => Promise<Message[]>;
  hasMoreMessages?: boolean;
}

type ActionEvent = { messageId: string; timestamp: number };
const TIME_SEQUENCE: TimeOfDay[] = ['sunrise', 'day', 'sunset', 'night'];
let isDebugLogging = false;
const debugLog = (...args: unknown[]) => {
  if (!import.meta.env.DEV || isDebugLogging) {
    return;
  }

  isDebugLogging = true;
  try {
    console.debug(...args);
  } catch {
    // Never let debug logging crash the chat UI.
  } finally {
    isDebugLogging = false;
  }
};

function parseMessageTokens(text: string, preserveWhitespace = false): { type: string; content: string }[] {
  let cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '');
  if (!preserveWhitespace) cleanRaw = cleanRaw.trim();
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
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokensToStyledHtml(tokens: { type: string; content: string }[], dynamicText: boolean): string {
  return tokens.map(token => {
    if (!dynamicText) {
      if (token.type === 'speech') {
        return `<span style="color:white;font-weight:500">"${escapeHtml(token.content)}"</span>`;
      }
      return `<span style="color:white;font-weight:500">${escapeHtml(token.content)}</span>`;
    }
    if (token.type === 'speech') {
      return `<span style="color:white;font-weight:500">"${escapeHtml(token.content)}"</span>`;
    }
    if (token.type === 'action') {
      return `<span style="color:rgb(148,163,184);font-style:italic">*${escapeHtml(token.content)}*</span>`;
    }
    if (token.type === 'thought') {
      return `<span style="color:rgba(199,210,254,0.9);font-style:italic;letter-spacing:-0.025em;text-shadow:0 0 8px rgba(129,140,248,0.6),0 0 16px rgba(129,140,248,0.4),0 0 24px rgba(129,140,248,0.2)">(${escapeHtml(token.content)})</span>`;
    }
    return `<span style="color:rgb(203,213,225)">${escapeHtml(token.content)}</span>`;
  }).join('');
}

function getCaretCharOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString().length;
}

function setCaretCharOffset(el: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let lastNode: Text | null = null;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    lastNode = node;
    if (charCount + node.length >= offset) {
      const range = document.createRange();
      range.setStart(node, offset - charCount);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    charCount += node.length;
  }
  // Fallback: offset exceeded total text -- place cursor at end
  if (lastNode) {
    const range = document.createRange();
    range.setStart(lastNode, lastNode.length);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}

const FormattedMessage: React.FC<{ text: string; dynamicText?: boolean }> = ({ text, dynamicText = true }) => {
  const tokens = useMemo(() => parseMessageTokens(text), [text]);

  return (
    <div className="whitespace-pre-wrap">
      {tokens.map((token, i) => {
        if (!dynamicText) {
          if (token.type === 'speech') {
            return (
              <span key={i} className="text-white font-medium">
                &ldquo;{token.content}&rdquo;
              </span>
            );
          }
          return (
            <span key={i} className="text-white font-medium">
              {token.content}
            </span>
          );
        }
        
        if (token.type === 'speech') {
          return (
            <span key={i} className="text-white font-medium">
              &ldquo;{token.content}&rdquo;
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
              className="text-indigo-200/90 italic tracking-tight animate-in fade-in zoom-in-95 duration-500"
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
  userChar: Character | null,
  resolveCanonicalName?: (name: string) => string | null
): string => {
  if (segment.speakerName) {
    // Has explicit speaker tag - normalize to canonical card name when possible
    const canonical = resolveCanonicalName?.(segment.speakerName);
    return (canonical || segment.speakerName).toLowerCase();
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
  userChar: Character | null,
  resolveCanonicalName?: (name: string) => string | null
): MessageSegment[] => {
  if (rawSegments.length <= 1) return rawSegments;
  
  // Resolve speaker names first (lowercased for comparison)
  const withResolvedNames = rawSegments.map(seg => ({
    ...seg,
    resolvedName: resolveRenderedSpeakerName(seg, isAi, appData, userChar, resolveCanonicalName),
    canonicalSpeakerName: seg.speakerName ? (resolveCanonicalName?.(seg.speakerName) || seg.speakerName) : null
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
      merged.push({
        speakerName: current.canonicalSpeakerName ?? current.speakerName,
        content: current.content
      });
      current = next;
    }
  }
  merged.push({
    speakerName: current.canonicalSpeakerName ?? current.speakerName,
    content: current.content
  });
  
  return merged;
};
const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));
const CHARACTER_AVATAR_PREVIEW_SIZE = 192;
const CHAT_TILE_HEIGHT = 140;
const CHAT_TILE_WIDTH = 268;

type Size2D = { width: number; height: number };
const avatarNaturalSizeCache = new Map<string, Size2D>();

const mapObjectPositionFromPreviewToTile = (
  stored: { x: number; y: number },
  imageSize: Size2D,
  tileSize: Size2D
): { x: number; y: number } => {
  const fromSize = {
    width: CHARACTER_AVATAR_PREVIEW_SIZE,
    height: CHARACTER_AVATAR_PREVIEW_SIZE,
  };

  const fromScale = Math.max(fromSize.width / imageSize.width, fromSize.height / imageSize.height);
  const toScale = Math.max(tileSize.width / imageSize.width, tileSize.height / imageSize.height);

  const mapAxis = (
    storedPercent: number,
    imageLength: number,
    fromLength: number,
    toLength: number
  ): number => {
    const fromRendered = imageLength * fromScale;
    const fromOverflow = Math.max(0, fromRendered - fromLength);
    const sourceOffset = fromOverflow === 0 ? 0 : ((fromOverflow * clampPercent(storedPercent)) / 100) / fromScale;

    const toRendered = imageLength * toScale;
    const toOverflow = Math.max(0, toRendered - toLength);
    if (toOverflow === 0) return 50;
    const toOffset = sourceOffset * toScale;
    return clampPercent((toOffset / toOverflow) * 100);
  };

  return {
    x: mapAxis(stored.x, imageSize.width, fromSize.width, tileSize.width),
    y: mapAxis(stored.y, imageSize.height, fromSize.height, tileSize.height),
  };
};

const mapTilePositionToPreview = (
  tilePos: { x: number; y: number },
  imageSize: Size2D,
  tileSize: Size2D
): { x: number; y: number } => {
  const previewSize = { width: CHARACTER_AVATAR_PREVIEW_SIZE, height: CHARACTER_AVATAR_PREVIEW_SIZE };

  const fromScale = Math.max(tileSize.width / imageSize.width, tileSize.height / imageSize.height);
  const toScale = Math.max(previewSize.width / imageSize.width, previewSize.height / imageSize.height);

  const mapAxis = (
    tilePercent: number,
    imageLength: number,
    fromLength: number,
    toLength: number
  ): number => {
    const fromRendered = imageLength * fromScale;
    const fromOverflow = Math.max(0, fromRendered - fromLength);
    const sourceOffset = fromOverflow === 0 ? 0 : ((fromOverflow * clampPercent(tilePercent)) / 100) / fromScale;

    const toRendered = imageLength * toScale;
    const toOverflow = Math.max(0, toRendered - toLength);
    if (toOverflow === 0) return 50;
    const toOffset = sourceOffset * toScale;
    return clampPercent((toOffset / toOverflow) * 100);
  };

  return {
    x: mapAxis(tilePos.x, imageSize.width, tileSize.width, previewSize.width),
    y: mapAxis(tilePos.y, imageSize.height, tileSize.height, previewSize.height),
  };
};
const HEX_COLOR_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

const normalizeHexColor = (value: string | undefined | null, fallback: string): string => {
  if (!value) return fallback;
  const trimmed = value.trim();
  const match = trimmed.match(HEX_COLOR_PATTERN);
  if (!match) return fallback;
  const raw = match[1].toLowerCase();
  const expanded = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  return `#${expanded}`;
};

const tryNormalizeHexColor = (value: string): string | null => {
  const trimmed = value.trim();
  const match = trimmed.match(HEX_COLOR_PATTERN);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  const expanded = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  return `#${expanded}`;
};

const getColorFamilyLabel = (hex: string): string => {
  const normalized = normalizeHexColor(hex, '#1a1b20');
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lightness = ((max + min) / 2) / 255;

  if (chroma < 12) {
    if (lightness < 0.18) return 'Very dark gray';
    if (lightness < 0.4) return 'Dark gray';
    if (lightness < 0.7) return 'Gray';
    return 'Light gray';
  }

  let hue = 0;
  if (max === r) hue = ((g - b) / chroma) % 6;
  else if (max === g) hue = (b - r) / chroma + 2;
  else hue = (r - g) / chroma + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  if (hue < 15 || hue >= 345) return 'Red';
  if (hue < 45) return 'Orange';
  if (hue < 70) return 'Yellow';
  if (hue < 160) return 'Green';
  if (hue < 200) return 'Cyan';
  if (hue < 260) return 'Blue';
  if (hue < 300) return 'Purple';
  if (hue < 345) return 'Pink';
  return 'Color';
};

export const ChatInterfaceTab: React.FC<ChatInterfaceTabProps> = ({
  scenarioId,
  appData,
  conversationId,
  modelId,
  isAdmin = false,
  onUpdate,
  onBack,
  onSaveScenario,
  onUpdateUiSettings,
  onUpdateSideCharacters,
  onLoadOlderMessages,
  hasMoreMessages = false
}) => {
  const { user } = useAuth();
  const { defaultStyleId: DEFAULT_STYLE_ID, getStyleById } = useArtStyles();
  const [input, setInput] = useState('');
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [formattedStreamingContent, setFormattedStreamingContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('day');
  // Time progression state
  const [timeProgressionMode, setTimeProgressionMode] = useState<'manual' | 'automatic'>('manual');
  const [timeProgressionInterval, setTimeProgressionInterval] = useState<number>(15);
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // seconds
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const timeRemainingRef = useRef<number>(15 * 60);
  const timeProgressionIntervalRef = useRef<number>(15);
  const currentDayRef = useRef<number>(1);
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
  // Per-tile avatar crop positioning UX (main character cards)
  const [repositioningTileCharId, setRepositioningTileCharId] = useState<string | null>(null);
  const [expandedTileCharId, setExpandedTileCharId] = useState<string | null>(null);
  const [tileAvatarPositionOverrides, setTileAvatarPositionOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [tileDragState, setTileDragState] = useState<{
    charId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPos: { x: number; y: number };
    width: number;
    height: number;
  } | null>(null);
  const [avatarNaturalSizes, setAvatarNaturalSizes] = useState<Record<string, Size2D>>({});

  // Admin debug: action tracking refs (Continue / Regenerate clicks)
  const continueEventsRef = useRef<ActionEvent[]>([]);
  const regenerateEventsRef = useRef<ActionEvent[]>([]);

  useEffect(() => {
    const characters = appData.characters;
    if (!characters?.length) return;
    let cancelled = false;

    characters.forEach((char) => {
      const url = char.avatarDataUrl;
      if (!url) return;
      const cached = avatarNaturalSizeCache.get(url);
      if (cached) {
        setAvatarNaturalSizes(prev => prev[char.id] ? prev : { ...prev, [char.id]: cached });
        return;
      }
      const img = new Image();
      img.onload = () => {
        const size = { width: img.naturalWidth || 1, height: img.naturalHeight || 1 };
        avatarNaturalSizeCache.set(url, size);
        if (!cancelled) setAvatarNaturalSizes(prev => ({ ...prev, [char.id]: size }));
      };
      img.src = url;
      if (img.complete && img.naturalWidth > 0) {
        const size = { width: img.naturalWidth, height: img.naturalHeight };
        avatarNaturalSizeCache.set(url, size);
        if (!cancelled) setAvatarNaturalSizes(prev => ({ ...prev, [char.id]: size }));
      }
    });

    return () => { cancelled = true; };
  }, [appData.characters]);

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [isMainCharacterDelete, setIsMainCharacterDelete] = useState(false);
  const [chatCanvasHexInput, setChatCanvasHexInput] = useState('#1a1b20');
  const [chatBubbleHexInput, setChatBubbleHexInput] = useState('#1a1b20');
  
  // Session-scoped world core overrides (global across all characters)
  const [worldCoreSessionOverrides, setWorldCoreSessionOverrides] = useState<Partial<WorldCore> | null>(null);
  
  // Collapsible character sections
  const [mainCharsCollapsed, setMainCharsCollapsed] = useState(false);
  const [sideCharsCollapsed, setSideCharsCollapsed] = useState(false);
  const [canScrollDownMainChars, setCanScrollDownMainChars] = useState(true);
  const mainCharsScrollRef = useRef<HTMLDivElement>(null);

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
  
  // Issue #7: Response length tracking for adaptive length directives
  const responseLengthsRef = useRef<number[]>([]);
  // Issue #7 + #10: Session message counter for precise session depth awareness
  const sessionMessageCountRef = useRef<number>(0);
  // Issue #6B: Track previous day for compression trigger
  const previousDayRef = useRef<number>(currentDay);
  // Character extraction cadence: hard-event trigger + periodic backstop
  const assistantTurnsSinceExtractionRef = useRef<number>(0);
  const EXTRACTION_BACKSTOP_INTERVAL = 6;
  const latestConversationsRef = useRef(appData.conversations);
  
  useEffect(() => {
    currentDayRef.current = currentDay;
  }, [currentDay]);
  
  // Reset session tracking when conversation changes
  useEffect(() => {
    responseLengthsRef.current = [];
    sessionMessageCountRef.current = 0;
    previousDayRef.current = currentDayRef.current;
    assistantTurnsSinceExtractionRef.current = 0;
  }, [conversationId]);

  useEffect(() => {
    latestConversationsRef.current = appData.conversations;
  }, [appData.conversations]);

  // Update conversation when day/time changes
  const handleDayTimeChange = useCallback((newDay: number, newTime: TimeOfDay) => {
    // Preserve current timer settings from refs to prevent stale snapshot overwrites
    const updatedConvs = latestConversationsRef.current.map(c =>
      c.id === conversationId
        ? {
            ...c,
            currentDay: newDay,
            currentTimeOfDay: newTime,
            timeProgressionMode: timeProgressionMode,
            timeProgressionInterval: timeProgressionIntervalRef.current,
            updatedAt: now()
          }
        : c
    );
    onUpdate(updatedConvs);
    // Direct DB persist only for day/time — timer settings are NOT written here
    supabaseData.updateConversationMeta(conversationId, { currentDay: newDay, currentTimeOfDay: newTime });
  }, [conversationId, onUpdate, timeProgressionMode]);

  // Issue #7: Compute length directive based on recent response pattern
  const getLengthDirective = (): string => {
    const lengths = responseLengthsRef.current;
    if (lengths.length < 3) return '';
    const last3 = lengths.slice(-3);
    const avg = last3.reduce((a, b) => a + b, 0) / 3;
    const allWithin20 = last3.every(l => Math.abs(l - avg) / avg < 0.2);
    if (!allWithin20) return '';
    if (avg > 150) {
      return `[LENGTH: Last 3 responses were ~${Math.round(avg)} words each. This response MUST be noticeably different in length -- try SHORT: 1-3 paragraphs max.]`;
    } else {
      return `[LENGTH: Last 3 responses were ~${Math.round(avg)} words each. This response MUST be noticeably different in length -- try LONGER with more sensory detail and internal thought.]`;
    }
  };

  const getExtractionDecision = (userText: string, aiText: string): { shouldExtract: boolean; reason: string } => {
    const combined = `${userText}\n${aiText}`;
    const locationChangePattern = /\b(enters?|entered|entering|leaves?|left|leaving|go(?:es|ing|ne)? to|arrives?|arrived|arriving|moves?|moved|moving to|heads?|headed|heading to|walks? into)\b/i;
    const clothingChangePattern = /\b(puts? on|takes? off|took off|removes?|removed|removing|unzips?|unzipped|zips? up|pulls? down|pulled down|lifts?|lifted|strips?|stripped|changes? into|undresses?)\b/i;
    const relationshipShiftPattern = /\b(i love you|we(?:'re| are) (dating|together|exclusive)|be my (boyfriend|girlfriend|partner)|broke up|break up|it'?s over|my ex|your ex|engaged|marry me|confess(?:ed)? feelings?|admit(?:ted)? feelings?)\b/i;
    const relationshipDynamicPattern = /\b(flirt(?:ed|ing)?|jealous|jealousy|possessive|possessiveness|caught feelings|admit(?:ted)? attraction|confess(?:ed)? attraction)\b/i;
    const intimacyMilestonePattern = /\b(first kiss|kiss(?:ed|ing)?|made out|slept together|had sex|fucked|went down on|oral|orgasm(?:ed)?|came)\b/i;
    const persistentConditionPattern = /\b(started|suddenly|now|became)\b[\s\S]{0,40}\b(bleeding|injured|sick|dizzy|faint|bruised|cramp|erect|hard|wet)\b/i;

    if (locationChangePattern.test(combined)) {
      return { shouldExtract: true, reason: 'hard_event:location' };
    }
    if (clothingChangePattern.test(combined)) {
      return { shouldExtract: true, reason: 'hard_event:clothing' };
    }
    if (relationshipShiftPattern.test(combined)) {
      return { shouldExtract: true, reason: 'hard_event:relationship' };
    }
    if (relationshipDynamicPattern.test(combined)) {
      return { shouldExtract: true, reason: 'hard_event:relationship_dynamic' };
    }
    if (intimacyMilestonePattern.test(combined)) {
      return { shouldExtract: true, reason: 'hard_event:intimacy' };
    }
    if (persistentConditionPattern.test(combined)) {
      return { shouldExtract: true, reason: 'hard_event:condition' };
    }
    if (assistantTurnsSinceExtractionRef.current >= EXTRACTION_BACKSTOP_INTERVAL) {
      return { shouldExtract: true, reason: `periodic_backstop:${EXTRACTION_BACKSTOP_INTERVAL}` };
    }
    return { shouldExtract: false, reason: 'skip' };
  };

  // Pass 7: Anti-loop micro-directive — detects confirmation loops and injects guards
  // Pass 8: Extended with structural repetition and low-initiative detectors
  const getAntiLoopDirective = (): string => {
    const msgs = conversation?.messages || [];
    if (msgs.length < 2) return '';
    
    const directives: string[] = [];
    
    // Check if user's last message is an affirmation
    const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      const affirmPatterns = /\b(yes|yeah|okay|ok|sure|i understand|i will|i promise|i agree|alright|fine|got it|of course|absolutely|definitely|right|mhm|uh huh|yep|yup)\b/i;
      if (affirmPatterns.test(lastUserMsg.text)) {
        directives.push('[ANTI-LOOP: User has ALREADY confirmed/agreed. Do NOT re-ask for confirmation. Do NOT say "tell me again" or "promise me." Take IMMEDIATE ACTION now.]');
      }
    }
    
    // Check if last 2 assistant messages repeat similar question stems
    const lastAiMsgs = msgs.filter(m => m.role === 'assistant').slice(-2);
    if (lastAiMsgs.length === 2) {
      const extractQuestions = (text: string) => {
        const matches = text.match(/"[^"]*\?"/g) || [];
        return matches.map(q => q.toLowerCase().replace(/[^a-z\s]/g, '').trim()).filter(Boolean);
      };
      const q1 = extractQuestions(lastAiMsgs[0].text);
      const q2 = extractQuestions(lastAiMsgs[1].text);
      const hasRepeat = q1.some(a => q2.some(b => {
        const words1 = new Set(a.split(/\s+/));
        const words2 = new Set(b.split(/\s+/));
        const overlap = ([...words1] as string[]).filter(w => words2.has(w) && w.length > 3).length;
        return overlap >= 3;
      }));
      if (hasRepeat) {
        directives.push('[ANTI-LOOP: Prior responses contained similar questions. Do NOT rephrase the same question. Advance to a NEW narrative beat with concrete action.]');
      }
    }
    
    // Check for deferral pattern in last assistant message
    const lastAiMsg = [...msgs].reverse().find(m => m.role === 'assistant');
    if (lastAiMsg) {
      const deferralPatterns = /\b(we'll talk|we'll discuss|we'll figure|we'll sort|later tonight|after dinner|after we're done|soon enough|tomorrow|eventually)\b/i;
      if (deferralPatterns.test(lastAiMsg.text)) {
        directives.push('[ANTI-LOOP: Previous response deferred action. This response MUST deliver on what was deferred — no more postponing.]');
      }
    }
    
    // Pass 8: Structural repetition detector — checks if recent AI responses follow the same template
    const recentAiMsgs = msgs.filter(m => m.role === 'assistant').slice(-3);
    if (recentAiMsgs.length >= 2) {
      // Detect the "quote → action → thought" triad pattern
      const detectTriadPattern = (text: string): boolean => {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) return false;
        
        let hasQuote = false, hasAction = false, hasThought = false;
        for (const line of lines) {
          const trimmed = line.replace(/^\w+:\s*/, ''); // strip speaker tag
          if (trimmed.match(/^"/)) hasQuote = true;
          if (trimmed.match(/^\*/)) hasAction = true;
          if (trimmed.match(/^\(/)) hasThought = true;
        }
        return hasQuote && hasAction && hasThought;
      };
      
      const triadCount = recentAiMsgs.filter(m => detectTriadPattern(m.text)).length;
      if (triadCount >= 2) {
        directives.push('[ANTI-STAGNATION: Your last responses all followed quote→action→thought structure. BREAK THE TEMPLATE NOW. Try: action-only opening, rapid dialogue exchange, environmental interruption, or decision-driven beat. Do NOT include internal thoughts this turn.]');
      }
    }
    
    // Pass 8: Low-initiative detector — checks if AI is just mirroring/reacting without driving
    if (recentAiMsgs.length >= 2) {
      const passivePatterns = /\b(watched|observed|waited|wondered|considered|thought about|looked at|noticed|studied|gazed|stared)\b/gi;
      const actionPatterns = /\b(grabbed|pulled|pushed|stood|walked|moved|reached|opened|closed|decided|turned|kissed|touched|picked up|put down|ran|jumped|threw|took|handed|stepped|leaned|sat down|knelt|whispered|shouted|slammed|knocked)\b/gi;
      
      let passiveCount = 0;
      let actionCount = 0;
      for (const m of recentAiMsgs.slice(-2)) {
        const pMatches = m.text.match(passivePatterns);
        const aMatches = m.text.match(actionPatterns);
        passiveCount += pMatches ? pMatches.length : 0;
        actionCount += aMatches ? aMatches.length : 0;
      }
      
      if (passiveCount > actionCount * 2 && passiveCount >= 4) {
        directives.push('[ANTI-STAGNATION: Recent responses are passive — mostly watching/observing/wondering. Characters must TAKE ACTION NOW. Make a decision, initiate physical movement, start a conversation, or change the environment. Stop being a spectator.]');
      }
    }
    
    // Pass 12: Ping-pong detector — detects alternating character blocks in last AI response
    if (lastAiMsg) {
      const lines = lastAiMsg.text.split('\n').filter((l: string) => l.trim().length > 0);
      const speakerPattern = /^([A-Z][a-zA-Z\s'-]+):/;
      const speakers: string[] = [];
      for (const line of lines) {
        const match = line.match(speakerPattern);
        if (match) {
          const name = match[1].trim();
          if (speakers.length === 0 || speakers[speakers.length - 1] !== name) {
            speakers.push(name);
          }
        }
      }
      // If 3+ blocks alternating between same 2 characters
      if (speakers.length >= 3) {
        const uniqueSpeakers = new Set(speakers);
        if (uniqueSpeakers.size <= 2) {
          directives.push('[ANTI-PING-PONG: Your last response alternated between the same two characters across ' + speakers.length + ' blocks. This turn, write from ONE character\'s perspective only. Other characters may be mentioned in narration but do NOT get their own tagged block. Advance the scene: reveal new information, make a decision, or change the physical situation.]');
        }
      }
    }
    
    // Pass 12: Emotional-loop detector — detects stasis reactions without scene change
    if (recentAiMsgs.length >= 2) {
      const emotionalStasisPatterns = /\b(sobbed|trembled|murmured|whispered|shuddered|whimpered|sniffled|choked|sighed|swallowed hard|blinked back tears|tears streamed|voice cracked|breath hitched|lip quivered|heart ached|chest tightened)\b/gi;
      const sceneChangePatterns = /\b(stood up|walked|left|entered|opened|closed|picked up|put down|grabbed|pulled|pushed|decided|turned to leave|moved to|stepped outside|drove|ran|called|texted|knocked|rang|arrived|phone buzzed|door opened|interrupted)\b/gi;
      
      let emotionalCount = 0;
      let sceneChangeCount = 0;
      for (const m of recentAiMsgs.slice(-2)) {
        const eMatches = m.text.match(emotionalStasisPatterns);
        const sMatches = m.text.match(sceneChangePatterns);
        emotionalCount += eMatches ? eMatches.length : 0;
        sceneChangeCount += sMatches ? sMatches.length : 0;
      }
      
      if (emotionalCount >= 4 && sceneChangeCount < 2) {
        directives.push('[ANTI-STAGNATION: Recent responses are emotional reactions without scene change. Something EXTERNAL must happen now: a phone rings, someone enters, a decision is made, a character physically moves to a new location or activity. Emotional processing is NOT forward movement.]');
      }
    }
    
    // Pass 13: Thought-tail detector — checks if recent AI responses end with parenthetical thoughts
    const aiMsgsForThoughtCheck = msgs.filter(m => m.role === 'assistant').slice(-3);
    if (aiMsgsForThoughtCheck.length >= 2) {
      const endsWithThought = (text: string): boolean => {
        const trimmed = text.trimEnd();
        return /\([^)]{5,}\)\s*$/.test(trimmed);
      };
      const thoughtTailCount = aiMsgsForThoughtCheck.filter(m => endsWithThought(m.text)).length;
      if (thoughtTailCount >= 2) {
        directives.push('[ANTI-THOUGHT-TAIL: Your recent responses all ended with internal thoughts in parentheses. This response must NOT end with a thought. End with dialogue or physical action instead.]');
      }
    }
    
    // Pass 13c: Cross-message multi-character pattern detector
    const last3AiMsgs = msgs.filter(m => m.role === 'assistant').slice(-3);
    if (last3AiMsgs.length >= 3) {
      const speakerPattern = /^([A-Z][a-zA-Z\s'-]+):/m;
      const allMultiChar = last3AiMsgs.every(m => {
        const lines = m.text.split('\n').filter((l: string) => l.trim().length > 0);
        const uniqueSpeakers = new Set<string>();
        for (const line of lines) {
          const match = line.match(speakerPattern);
          if (match) uniqueSpeakers.add(match[1].trim());
        }
        return uniqueSpeakers.size >= 2;
      });
      if (allMultiChar) {
        directives.push('[ANTI-MULTI-CHAR-PATTERN: Your last 3 responses ALL featured multiple AI characters. This response MUST be single-character only. Pick the focal character, write their beat, and STOP. Other characters can be referenced in narration but get NO tagged blocks this turn.]');
      }
    }
    
    return directives.join(' ');
  };

  

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
  
  // Load sidebar backgrounds when auth is ready - DEFERRED to not block first render
  useEffect(() => {
    if (conversationId === "loading" || !user?.id) return;

    let isCancelled = false;
    const frameId = requestAnimationFrame(() => {
      supabaseData.fetchSidebarBackgrounds(user.id).then(bgs => {
        if (isCancelled) return;
        setSidebarBackgrounds(bgs);
        const selected = bgs.find(bg => bg.isSelected);
        setSelectedSidebarBgId(selected?.id ?? null);
      }).catch(err => {
        if (!isCancelled) {
          console.error('Failed to load sidebar backgrounds:', err);
        }
      });
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [conversationId, user?.id]);
  
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
  
  // Issue #6B: Day-transition compression -- compress bullet memories when day increments
  // Memory CRUD handlers
  const handleCreateMemory = useCallback(async (
    content: string,
    day: number | null,
    timeOfDay: TimeOfDay | null,
    sourceMessageId?: string,
    entryType: import('@/types').MemoryEntryType = 'bullet'
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const memory = await supabaseData.createMemory(
      conversationId,
      user.id,
      content,
      day,
      timeOfDay,
      sourceMessageId ? 'message' : 'user',
      sourceMessageId,
      entryType
    );
    setMemories(prev => [...prev, memory]);
    return memory;
  }, [conversationId]);
  
  const handleUpdateMemory = useCallback(async (id: string, content: string) => {
    await supabaseData.updateMemory(id, content);
    setMemories(prev => prev.map(m => m.id === id ? { ...m, content, updatedAt: Date.now() } : m));
  }, []);
  
  const handleDeleteMemory = useCallback(async (id: string) => {
    await supabaseData.deleteMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);
  
  const handleDeleteAllMemories = useCallback(async () => {
    await supabaseData.deleteAllMemories(conversationId);
    setMemories([]);
  }, [conversationId]);
  
  const handleQuickSaveMemory = useCallback(async (
    content: string,
    day: number | null,
    timeOfDay: TimeOfDay | null,
    sourceMessageId: string
  ) => {
    await handleCreateMemory(content, day, timeOfDay, sourceMessageId);
  }, [handleCreateMemory]);

  useEffect(() => {
    const prevDay = previousDayRef.current;
    previousDayRef.current = currentDay;

    // Only compress when day increments (not decrements or initial load)
    if (currentDay > prevDay && memoriesEnabled && memoriesLoaded) {
      const completedDay = prevDay;
      const bulletMemories = memories.filter(
        m => m.day === completedDay && m.entryType === 'bullet'
      );
      if (bulletMemories.length === 0) return;

      const bullets = bulletMemories.map(m => m.content);

      void trackAiUsageEvent({
        eventType: 'memory_day_compression_call',
        eventSource: 'chat-interface',
        metadata: {
          conversationId,
          day: completedDay,
          bulletCount: bulletMemories.length,
          inputChars: bullets.join('\n').length,
          modelId,
        },
      });

      void trackApiValidationSnapshot({
        eventKey: 'validation.call2.memory_compress',
        eventSource: 'chat-interface.memory-compress',
        apiCallGroup: 'call_2',
        parentRowId: 'summary.call2.memory_compress',
        detailPresence: buildRequiredPresence([
          ['call2.memory_compress.bullets', bullets],
          ['call2.memory_compress.day', completedDay],
          ['call2.memory_compress.conversation_id', conversationId],
        ]),
        diagnostics: {
          bulletCount: bulletMemories.length,
        },
      });

      supabase.functions.invoke('compress-day-memories', {
        body: { bullets, day: completedDay, conversationId }
      }).then(async ({ data, error }) => {
        if (!error && data?.synopsis) {
          void trackAiUsageEvent({
            eventType: 'memory_bullets_compressed',
            eventSource: 'chat-interface',
            count: bulletMemories.length,
            metadata: {
              conversationId,
              day: completedDay,
              outputChars: data.synopsis.length,
            },
          });
          await handleCreateMemory(data.synopsis, completedDay, null, undefined, 'synopsis');
          for (const bm of bulletMemories) {
            await handleDeleteMemory(bm.id);
          }
        }
      }).catch(err => {
        console.error('[Day compression] Failed:', err);
      });
    }
  }, [currentDay, memories, memoriesEnabled, memoriesLoaded, conversationId, modelId, handleCreateMemory, handleDeleteMemory]);
  
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
      try {
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
          totalLuminosity += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
        }
        
        setSidebarBgIsLight((totalLuminosity / pixelCount) > 128);
      } catch (e) {
        console.warn('Could not analyze sidebar background brightness (CORS):', e);
        setSidebarBgIsLight(false);
      }
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
    } catch (err) {
      console.error('Failed to upload sidebar background:', err);
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
    }
  };
  
  const handleDeleteSidebarBg = async (id: string, imageUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabaseData.deleteSidebarBackground(user.id, id, imageUrl);
      setSidebarBackgrounds(prev => prev.filter(bg => bg.id !== id));
      if (selectedSidebarBgId === id) setSelectedSidebarBgId(null);
    } catch (err) {
      console.error('Failed to delete sidebar background:', err);
    }
  };
  
// Helper to get effective character (base + session overrides merged)
  const getEffectiveCharacter = useCallback((baseChar: Character): Character & { previousNames?: string[] } => {
    const sessionState = sessionStates.find(s => s.characterId === baseChar.id);
    if (!sessionState) return baseChar;

    const hasObjectContent = (value: unknown): value is Record<string, any> =>
      !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;

    const mergeExtrasSection = (baseSection: any, sessionSection: any) => {
      if (!hasObjectContent(sessionSection)) return baseSection;
      const baseExtras = Array.isArray(baseSection?._extras) ? baseSection._extras : [];
      const sessionExtras = Array.isArray(sessionSection?._extras) ? sessionSection._extras : [];
      if (sessionExtras.length === 0) {
        return { ...(baseSection || {}), ...sessionSection };
      }
      const mergedExtras = [...baseExtras];
      for (const entry of sessionExtras) {
        const label = (entry?.label || '').toLowerCase().trim();
        if (!label) continue;
        const idx = mergedExtras.findIndex((e: any) => (e?.label || '').toLowerCase().trim() === label);
        if (idx !== -1) mergedExtras[idx] = { ...mergedExtras[idx], ...entry };
        else mergedExtras.push(entry);
      }
      return { ...(baseSection || {}), ...sessionSection, _extras: mergedExtras };
    };
    
    const mergedPhysicalAppearance: PhysicalAppearance = {
      ...defaultPhysicalAppearance,
      ...(baseChar.physicalAppearance || {}),
      ...(sessionState.physicalAppearance || {}),
    };
    const mergedCurrentlyWearing: CurrentlyWearing = {
      ...defaultCurrentlyWearing,
      ...(baseChar.currentlyWearing || {}),
      ...(sessionState.currentlyWearing || {}),
    };
    const mergedPreferredClothing: PreferredClothing = {
      ...defaultPreferredClothing,
      ...(baseChar.preferredClothing || {}),
      ...(sessionState.preferredClothing || {}),
    };

    return {
      ...baseChar,
      name: sessionState.name || baseChar.name,
      previousNames: sessionState.previousNames || [],  // Hidden field for name history
      nicknames: sessionState.nicknames || baseChar.nicknames,  // Change 5
      age: sessionState.age || baseChar.age,
      sexType: sessionState.sexType || baseChar.sexType,
      sexualOrientation: sessionState.sexualOrientation || baseChar.sexualOrientation,
      roleDescription: sessionState.roleDescription || baseChar.roleDescription,
      location: sessionState.location || baseChar.location,
      currentMood: sessionState.currentMood || baseChar.currentMood,
      physicalAppearance: mergedPhysicalAppearance,
      currentlyWearing: mergedCurrentlyWearing,
      preferredClothing: mergedPreferredClothing,
      sections: sessionState.customSections || baseChar.sections,
      // Session-scoped goals overrides
      goals: sessionState.goals?.length ? sessionState.goals : (baseChar.goals || []),
      // Session-scoped avatar overrides
      avatarDataUrl: sessionState.avatarUrl || baseChar.avatarDataUrl,
      avatarPosition: sessionState.avatarPosition || baseChar.avatarPosition,
      // Session-scoped control and role overrides
      controlledBy: sessionState.controlledBy || baseChar.controlledBy,
      characterRole: sessionState.characterRole || baseChar.characterRole,
      // Change 5: Merge 7 missing section fields
      personality: hasObjectContent((sessionState as any).personality)
        ? {
            ...(baseChar.personality || {}),
            ...((sessionState as any).personality || {}),
            traits: (sessionState as any).personality?.traits ?? baseChar.personality?.traits,
            outwardTraits: (sessionState as any).personality?.outwardTraits ?? baseChar.personality?.outwardTraits,
            inwardTraits: (sessionState as any).personality?.inwardTraits ?? baseChar.personality?.inwardTraits,
          }
        : baseChar.personality,
      background: hasObjectContent((sessionState as any).background)
        ? { ...(baseChar.background || {}), ...((sessionState as any).background || {}) }
        : baseChar.background,
      tone: mergeExtrasSection(baseChar.tone, (sessionState as any).tone),
      keyLifeEvents: mergeExtrasSection(baseChar.keyLifeEvents, (sessionState as any).keyLifeEvents),
      relationships: mergeExtrasSection(baseChar.relationships, (sessionState as any).relationships),
      secrets: mergeExtrasSection(baseChar.secrets, (sessionState as any).secrets),
      fears: mergeExtrasSection(baseChar.fears, (sessionState as any).fears),
    };
  }, [sessionStates]);

  // Build appData with session-merged characters for LLM context
  // This ensures the AI sees current locations, moods, controlledBy, etc.
  const buildLLMAppData = useCallback((): ScenarioData => {
    return {
      ...appData,
      characters: appData.characters.map(c => getEffectiveCharacter(c)),
      world: { ...appData.world, core: effectiveWorldCore }
    };
  }, [appData, getEffectiveCharacter, effectiveWorldCore]);

  const normalizeSpeakerToken = useCallback((value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const parseNameList = useCallback((raw?: string | null): string[] => {
    if (!raw) return [];
    return raw
      .split(/[,;\n|/]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }, []);

  const computeSpeakerAliasScore = useCallback((target: string, candidate: string): number => {
    if (!target || !candidate) return 0;
    if (target === candidate) return 100;

    // Handles expansions like "Rhys" -> "Rhysand" while avoiding short ambiguous prefixes.
    if (target.startsWith(candidate) && candidate.length >= 4) {
      const distance = Math.max(0, target.length - candidate.length);
      return 85 - Math.min(distance * 2, 20);
    }

    if (candidate.startsWith(target) && target.length >= 4) {
      const distance = Math.max(0, candidate.length - target.length);
      return 75 - Math.min(distance * 2, 20);
    }

    return 0;
  }, []);

  type ResolvedSpeakerMatch =
    | { kind: 'main'; base: Character; effective: Character & { previousNames?: string[] }; canonicalName: string }
    | { kind: 'side'; side: SideCharacter; canonicalName: string };

  const resolveCharacterReference = useCallback((name: string | null): ResolvedSpeakerMatch | null => {
    if (!name) return null;
    const target = normalizeSpeakerToken(name);
    if (!target) return null;

    const candidates: Array<{ score: number; key: string; match: ResolvedSpeakerMatch }> = [];
    const registerCandidate = (alias: string, match: ResolvedSpeakerMatch, weightBoost = 0) => {
      const candidate = normalizeSpeakerToken(alias);
      if (!candidate) return;
      const score = computeSpeakerAliasScore(target, candidate) + weightBoost;
      if (score <= 0) return;
      candidates.push({ score, key: `${match.kind}:${match.canonicalName.toLowerCase()}`, match });
    };

    const effectiveMainChars = appData.characters.map((base) => ({
      base,
      effective: getEffectiveCharacter(base)
    }));

    for (const { base, effective } of effectiveMainChars) {
      const match: ResolvedSpeakerMatch = {
        kind: 'main',
        base,
        effective,
        canonicalName: effective.name
      };
      registerCandidate(effective.name, match, 6);
      parseNameList(effective.nicknames).forEach((nickname) => registerCandidate(nickname, match, 4));
      (effective.previousNames || []).forEach((previousName) => registerCandidate(previousName, match, 2));
    }

    for (const side of (appData.sideCharacters || [])) {
      const match: ResolvedSpeakerMatch = {
        kind: 'side',
        side,
        canonicalName: side.name
      };
      registerCandidate(side.name, match, 6);
      parseNameList(side.nicknames).forEach((nickname) => registerCandidate(nickname, match, 4));
    }

    if (candidates.length === 0) return null;
    candidates.sort((left, right) => right.score - left.score);

    const [top, second] = candidates;
    if (!top || top.score < 60) return null;

    // If top two candidates from different characters are tied, treat as ambiguous.
    if (second && top.score === second.score && top.key !== second.key) {
      return null;
    }

    return top.match;
  }, [
    appData.characters,
    appData.sideCharacters,
    computeSpeakerAliasScore,
    getEffectiveCharacter,
    normalizeSpeakerToken,
    parseNameList
  ]);

  const resolveCanonicalSpeakerName = useCallback((name: string): string | null => {
    const match = resolveCharacterReference(name);
    return match?.canonicalName ?? null;
  }, [resolveCharacterReference]);

  // Session-aware character lookup - searches effective names, nicknames, previousNames, and safe aliases.
  // Returns the EFFECTIVE character data (with session overrides merged) for main characters.
  const findCharacterWithSession = useCallback((name: string | null): (Character & { previousNames?: string[] }) | SideCharacter | null => {
    const match = resolveCharacterReference(name);
    if (!match) return null;
    return match.kind === 'main' ? match.effective : match.side;
  }, [resolveCharacterReference]);

  const conversation = appData.conversations.find(c => c.id === conversationId);
  const conversationCurrentDay = conversation?.currentDay;
  const conversationCurrentTimeOfDay = conversation?.currentTimeOfDay;
  const conversationTimeProgressionMode = conversation?.timeProgressionMode;
  const conversationTimeProgressionInterval = conversation?.timeProgressionInterval;
  const conversationTimeRemaining = conversation?.timeRemaining;
  
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
  const isExpandedTileInMainCharacters = useMemo(() => {
    if (!expandedTileCharId) return false;
    return mainCharactersForDisplay.some(
      (char) => char._source === 'character' && char.id === expandedTileCharId
    );
  }, [expandedTileCharId, mainCharactersForDisplay]);
  const hasExpandedTile = expandedTileCharId !== null;

  // Debug: log conversation state on mount and when it changes
  useEffect(() => {
    if (conversationId === "loading") return;
    debugLog('[ChatInterfaceTab] conversationId:', conversationId);
    debugLog('[ChatInterfaceTab] conversation found:', !!conversation);
    if (import.meta.env.DEV) {
      debugLog('[ChatInterfaceTab] messages count:', conversation?.messages?.length ?? 0);
    }
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
    if (conversationId) {
      setCurrentDay(conversationCurrentDay || 1);
      setCurrentTimeOfDay(conversationCurrentTimeOfDay || 'day');
      setTimeProgressionMode(conversationTimeProgressionMode || 'manual');
      const interval = conversationTimeProgressionInterval || 15;
      setTimeProgressionInterval(interval);
      timeProgressionIntervalRef.current = interval;
      const maxSeconds = interval * 60;
      const raw = conversationTimeRemaining != null
        ? conversationTimeRemaining
        : maxSeconds;
      // Clamp: if persisted timeRemaining exceeds interval window, reset it
      const restored = raw > maxSeconds ? maxSeconds : raw;
      setTimeRemaining(restored);
      timeRemainingRef.current = restored;
      // Persist corrected value if it was clamped
      if (raw > maxSeconds && conversationId) {
        supabaseData.updateConversationMeta(conversationId, { timeRemaining: maxSeconds });
      }
    }
  }, [
    conversationId,
    conversationCurrentDay,
    conversationCurrentTimeOfDay,
    conversationTimeProgressionMode,
    conversationTimeProgressionInterval,
    conversationTimeRemaining,
  ]);

  // Keep refs in sync with state so cleanup/timer captures latest values
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { timeProgressionIntervalRef.current = timeProgressionInterval; }, [timeProgressionInterval]);

  // Persist timeRemaining on unmount / navigation away
  useEffect(() => {
    const saveTimeRemaining = () => {
      if (timeProgressionMode === 'automatic' && conversationId) {
        supabaseData.updateConversationMeta(conversationId, { timeRemaining: timeRemainingRef.current });
      }
    };
    window.addEventListener('beforeunload', saveTimeRemaining);
    return () => {
      window.removeEventListener('beforeunload', saveTimeRemaining);
      saveTimeRemaining();
    };
  }, [conversationId, timeProgressionMode]);

  // Auto-advance timer — only runs when mode is 'automatic'
  useEffect(() => {
    if (timeProgressionMode !== 'automatic' || isTimerPaused) return;
    const tick = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Advance time
          const currentIndex = TIME_SEQUENCE.indexOf(currentTimeOfDay);
          const nextIndex = (currentIndex + 1) % TIME_SEQUENCE.length;
          const nextTime = TIME_SEQUENCE[nextIndex];
          if (nextIndex === 0) {
            // Night → Sunrise = new day
            const newDay = currentDay + 1;
            setCurrentDay(newDay);
            setCurrentTimeOfDay(nextTime);
            handleDayTimeChange(newDay, nextTime);
          } else {
            setCurrentTimeOfDay(nextTime);
            handleDayTimeChange(currentDay, nextTime);
          }
          return timeProgressionIntervalRef.current * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [timeProgressionMode, currentTimeOfDay, currentDay, isTimerPaused, handleDayTimeChange]);

  // Visibility API — pause/resume timer when tab is hidden
  useEffect(() => {
    if (timeProgressionMode !== 'automatic') return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPausedAt(Date.now());
      } else if (pausedAt) {
        const elapsed = Math.floor((Date.now() - pausedAt) / 1000);
        setTimeRemaining(prev => Math.max(0, prev - elapsed));
        setPausedAt(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timeProgressionMode, pausedAt]);

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

  // NOTE: Loading/missing conversation guards moved to just before final JSX return
  // to ensure all hooks are called on every render (React rules of hooks).

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
      debugLog(`Generating details for new side character: ${name}`);

      void trackApiValidationSnapshot({
        eventKey: 'validation.call2.side_character_profile',
        eventSource: 'chat-interface.side-character-profile',
        apiCallGroup: 'call_2',
        parentRowId: 'summary.call2.side_character_profile',
        detailPresence: buildRequiredPresence([
          ['call2.side_character_profile.name', name],
          ['call2.side_character_profile.dialog_context', dialogContext],
          ['call2.side_character_profile.world_context', appData.world.core.storyPremise],
          ['call2.side_character_profile.model_id', modelId],
        ]),
      });
      
      // 1. Generate detailed profile via Grok
      const { data: profileData, error: profileError } = await supabase.functions.invoke('generate-side-character', {
        body: { 
          name, 
          dialogContext, 
          extractedTraits: {},
          worldContext: appData.world.core.storyPremise,
          modelId
        }
      });
      
      if (profileError) {
        console.error('Profile generation failed:', profileError);
        return;
      }
      
      if (profileData && onUpdateSideCharacters) {
        void trackAiUsageEvent({
          eventType: 'side_character_card_generated',
          eventSource: 'chat-interface',
          metadata: {
            conversationId,
            characterId,
            characterName: name,
            modelId,
            inputChars: dialogContext.length + (appData.world.core.storyPremise?.length || 0),
            outputChars: JSON.stringify(profileData).length,
          },
        });

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
          debugLog(`Generating avatar for ${name}...`);
          
          // Get the art style prompt from the scenario's selected art style
          const selectedStyleId = appData.selectedArtStyle || DEFAULT_STYLE_ID;
          const styleData = getStyleById(selectedStyleId);

          void trackApiValidationSnapshot({
            eventKey: 'validation.call2.side_character_avatar',
            eventSource: 'chat-interface.side-character-avatar',
            apiCallGroup: 'call_2',
            parentRowId: 'summary.call2.side_character_avatar',
            detailPresence: buildRequiredPresence([
              ['call2.side_character_avatar.avatar_prompt', profileData.avatarPrompt],
              ['call2.side_character_avatar.character_name', name],
              ['call2.side_character_avatar.model_id', modelId],
            ]),
          });
          
          const { data: avatarData, error: avatarError } = await supabase.functions.invoke('generate-side-character-avatar', {
            body: { 
              avatarPrompt: profileData.avatarPrompt,
              characterName: name,
              modelId,
              stylePrompt: styleData?.backendPrompt || ''  // Pass the art style
            }
          });
          
          if (avatarError) {
            console.error('Avatar generation failed:', avatarError);
          } else if (avatarData?.imageUrl) {
            void trackAiUsageEvent({
              eventType: 'side_character_avatar_generated',
              eventSource: 'chat-interface',
              metadata: {
                conversationId,
                characterId,
                characterName: name,
                modelId,
                inputChars: profileData.avatarPrompt.length,
              },
            });

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
            
            debugLog(`${name} has joined the story!`);
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
      debugLog(`Detected ${newCharacters.length} new character(s):`, newCharacters.map(c => c.name));
      
      const newSideCharacters = newCharacters.map(nc => 
        createSideCharacter(nc.name, nc.dialogContext, conversationId)
      );

      newSideCharacters.forEach((sc) => {
        void trackAiUsageEvent({
          eventType: 'side_character_generated',
          eventSource: 'chat-interface',
          metadata: {
            conversationId,
            characterId: sc.id,
            characterName: sc.name,
          },
        });
      });
      
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
  // GOAL PROGRESS EVALUATION (step completion - runs in parallel)
  // ============================================================================

  const isAssistantMessageStillCurrent = useCallback((assistantMessageId?: string): boolean => {
    if (!assistantMessageId) return true;
    const latestConversation = latestConversationsRef.current.find(c => c.id === conversationId);
    if (!latestConversation) return false;

    const assistantIndex = latestConversation.messages.findIndex(
      m => m.id === assistantMessageId && m.role === 'assistant'
    );
    if (assistantIndex === -1) return false;

    const hasLaterUserMessage = latestConversation.messages
      .slice(assistantIndex + 1)
      .some(m => m.role === 'user');
    return !hasLaterUserMessage;
  }, [conversationId]);

  const evaluateGoalProgress = async (userMessage: string, aiResponse: string, sourceAssistantMessageId?: string) => {
    const storyGoals = effectiveWorldCore.storyGoals;
    if (!storyGoals?.length) return;

    const pendingSteps: Array<{ stepId: string; description: string; goalId: string; flexibility: GoalFlexibility }> = [];
    for (const goal of storyGoals) {
      for (const step of goal.steps || []) {
        if (!step.completed) {
          pendingSteps.push({
            stepId: step.id,
            description: step.description,
            goalId: goal.id,
            flexibility: goal.flexibility,
          });
        }
      }
    }

    if (pendingSteps.length === 0) return;

    try {
      void trackAiUsageEvent({
        eventType: 'goal_progress_eval_call',
        eventSource: 'chat-interface',
        metadata: {
          conversationId,
          pendingStepCount: pendingSteps.length,
          inputChars: (userMessage?.length || 0) + (aiResponse?.length || 0),
        },
      });

      void trackApiValidationSnapshot({
        eventKey: 'validation.call2.goal_eval',
        eventSource: 'chat-interface.goal-eval',
        apiCallGroup: 'call_2',
        parentRowId: 'summary.call2.goal_eval',
        detailPresence: buildRequiredPresence([
          ['call2.goal_eval.user_message', userMessage],
          ['call2.goal_eval.ai_response', aiResponse],
          ['call2.goal_eval.pending_steps', pendingSteps],
          ['call2.goal_eval.temporal_context', `${currentDay}:${currentTimeOfDay}`],
        ]),
        diagnostics: {
          pendingStepCount: pendingSteps.length,
        },
      });

      const { data, error } = await supabase.functions.invoke('evaluate-goal-progress', {
        body: {
          userMessage,
          aiResponse,
          pendingSteps: pendingSteps.map(s => ({ stepId: s.stepId, description: s.description })),
          flexibility: pendingSteps[0]?.flexibility || 'normal',
          currentDay,
          currentTimeOfDay,
        }
      });

      if (error || !data?.stepUpdates?.length) return;

      if (!isAssistantMessageStillCurrent(sourceAssistantMessageId)) {
        debugLog('[evaluateGoalProgress] Discarded stale result for non-current turn');
        return;
      }

      const completedIds = new Set(data.stepUpdates.filter((u: any) => u.completed).map((u: any) => u.stepId));
      if (completedIds.size === 0) return;

      const updatedGoals = storyGoals.map(goal => {
        const newSteps = (goal.steps || []).map(step => {
          if (completedIds.has(step.id)) {
            return { ...step, completed: true, completedAt: Date.now() };
          }
          return step;
        });
        return { ...goal, steps: newSteps, updatedAt: Date.now() };
      });

      setWorldCoreSessionOverrides(prev => ({
        ...(prev || {}),
        storyGoals: updatedGoals,
      }));

      debugLog(`[evaluateGoalProgress] Completed ${completedIds.size} steps`);
    } catch (err) {
      console.error('[evaluateGoalProgress] Failed:', err);
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

  interface ExtractionRequestMeta {
    sourceAssistantMessageId?: string;
    reason?: string;
  }

  const isAllowedExtractionField = (field: string): boolean => {
    if (field === 'location' || field === 'currentMood' || field === 'nicknames') return true;
    if (field.startsWith('goals.')) return true;
    if (field.startsWith('sections.')) return true;
    if (!field.includes('.')) return false;

    const [parent, child] = field.split('.');
    if (!parent || !child) return false;

    if (parent === 'physicalAppearance' || parent === 'currentlyWearing' || parent === 'preferredClothing' || parent === 'background') {
      return true;
    }

    if (parent === 'personality') {
      return ['traits', 'outwardTraits', 'inwardTraits', 'splitMode'].includes(child);
    }

    if (['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'].includes(parent)) {
      return child === '_extras';
    }

    return false;
  };

  const normalizeForSimilarity = (text: string): string =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const tokenSet = (text: string): Set<string> => {
    const STOP_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'at', 'from', 'is', 'are']);
    return new Set(normalizeForSimilarity(text).split(/\s+/).filter(t => t && !STOP_WORDS.has(t)));
  };

  const tokenSimilarity = (a: string, b: string): number => {
    const aSet = tokenSet(a);
    const bSet = tokenSet(b);
    if (aSet.size === 0 || bSet.size === 0) return 0;
    let overlap = 0;
    for (const t of aSet) {
      if (bSet.has(t)) overlap += 1;
    }
    return overlap / Math.max(aSet.size, bSet.size);
  };

  const findNearDuplicateExtraIndex = (
    existing: Array<{ label: string; value: string }>,
    nextLabel: string,
    nextValue: string
  ): number => {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < existing.length; i += 1) {
      const e = existing[i];
      const labelScore = tokenSimilarity(e.label || '', nextLabel);
      const valueScore = tokenSimilarity(e.value || '', nextValue);
      const score = Math.max(labelScore, valueScore);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return bestScore >= 0.72 ? bestIdx : -1;
  };

  const findNearDuplicateTraitIndex = (
    existing: Array<{ label: string; value: string }>,
    nextLabel: string,
    nextValue: string
  ): number => {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < existing.length; i += 1) {
      const t = existing[i];
      const labelScore = tokenSimilarity(t.label || '', nextLabel);
      const valueScore = tokenSimilarity(t.value || '', nextValue);
      const combinedScore = tokenSimilarity(`${t.label} ${t.value}`, `${nextLabel} ${nextValue}`);
      const score = Math.max(labelScore, valueScore, combinedScore);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return bestScore >= 0.72 ? bestIdx : -1;
  };

  const shouldRefineExistingText = (existing: string, incoming: string): boolean => {
    const oldText = (existing || '').trim();
    const newText = (incoming || '').trim();
    if (!newText) return false;
    if (!oldText) return true;

    const similarity = tokenSimilarity(oldText, newText);
    if (similarity < 0.72) return true;

    const oldTokens = tokenSet(oldText);
    const newTokens = tokenSet(newText);
    if (newTokens.size === 0) return false;
    let novel = 0;
    for (const t of newTokens) {
      if (!oldTokens.has(t)) novel += 1;
    }
    const novelty = novel / newTokens.size;
    return newText.length >= oldText.length * 1.12 && novelty >= 0.20;
  };

  // Concurrency guard + lightweight queue for extraction
  const extractionInProgressRef = useRef(false);
  const pendingExtractionRef = useRef<{ userMessage: string; aiResponse: string; meta?: ExtractionRequestMeta } | null>(null);

  // Build eligible character set from latest exchange
  const buildEligibleCharacterNames = useCallback((userMessage: string, aiResponse: string): Set<string> => {
    const eligible = new Set<string>();
    const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
    
    // Check all characters (main + side) by name, nicknames, previousNames
    const effectiveMainChars = appData.characters.map(c => getEffectiveCharacter(c));
    for (const c of effectiveMainChars) {
      const names = [c.name, ...(c.nicknames?.split(',').map(n => n.trim()) || []), ...(c.previousNames || [])].filter(Boolean);
      const mentioned = names.some(n => combinedText.includes(n.toLowerCase()));
      if (mentioned) {
        eligible.add(c.name.toLowerCase());
      }
    }
    for (const sc of (appData.sideCharacters || [])) {
      const names = [sc.name, ...(sc.nicknames?.split(',').map(n => n.trim()) || [])].filter(Boolean);
      const mentioned = names.some(n => combinedText.includes(n.toLowerCase()));
      if (mentioned) {
        eligible.add(sc.name.toLowerCase());
      }
    }
    return eligible;
  }, [appData.characters, appData.sideCharacters, getEffectiveCharacter]);

  // Call the dedicated extraction edge function
  const extractCharacterUpdatesFromDialogue = async (
    userMessage: string, 
    aiResponse: string,
    meta?: ExtractionRequestMeta
  ): Promise<ExtractedUpdate[]> => {
    // Concurrency guard: if busy, enqueue latest request
    if (extractionInProgressRef.current) {
      debugLog('[extractCharacterUpdates] Queuing — extraction already in progress');
      pendingExtractionRef.current = { userMessage, aiResponse, meta };
      return [];
    }
    extractionInProgressRef.current = true;
    debugLog('[extractCharacterUpdates] Started', meta?.reason ? `(${meta.reason})` : '');
    try {
      // Build eligible character set
      const eligibleNames = buildEligibleCharacterNames(userMessage, aiResponse);
      debugLog('[extractCharacterUpdates] Eligible characters:', [...eligibleNames]);
      if (eligibleNames.size === 0) return [];

      // Build character data for context — only eligible characters
      const charactersData = appData.characters.map(c => {
        const effective = getEffectiveCharacter(c);
        const normalizeSectionItems = (section: any): Array<{ label: string; value: string }> => {
          const sectionTitle = (section?.title || '').trim();
          const rawItems = Array.isArray(section?.items) ? section.items : [];
          const normalized = rawItems
            .map((item: any) => ({
              label: (item?.label || '').trim(),
              value: (item?.value || '').trim()
            }))
            .filter((item: any) => item.label || item.value)
            .map((item: any) => ({
              label: item.label || (sectionTitle ? `${sectionTitle} Details` : 'Details'),
              value: item.value || item.label
            }));

          if (normalized.length > 0) return normalized;

          const freeform = (section?.freeformValue || '').trim();
          if (freeform) {
            return [{ label: sectionTitle ? `${sectionTitle} Notes` : 'Details', value: freeform }];
          }
          return [];
        };

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
            items: normalizeSectionItems(s)
          }))
          .filter((s) => (s.title || '').trim() || s.items.length > 0),
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
      }).filter(c => eligibleNames.has(c.name.toLowerCase()));
      
      // Also include eligible side characters
      const sideCharsData = (appData.sideCharacters || []).filter(sc => 
        eligibleNames.has(sc.name.toLowerCase())
      ).map(sc => ({
        name: sc.name,
        nicknames: sc.nicknames,
        physicalAppearance: sc.physicalAppearance,
        currentlyWearing: sc.currentlyWearing,
        preferredClothing: sc.preferredClothing,
        location: sc.location,
        currentMood: sc.currentMood,
        background: sc.background,
        personality: sc.personality,
      }));
      
      const allCharacters = [...charactersData, ...sideCharsData];
      const scopedCharactersChars = JSON.stringify(allCharacters).length;

      void trackAiUsageEvent({
        eventType: 'character_cards_update_call',
        eventSource: 'chat-interface',
        metadata: {
          conversationId,
          extractionReason: meta?.reason || 'unknown',
          eligibleCharacterCount: eligibleNames.size,
          scopedCharacterCount: allCharacters.length,
          modelId,
          inputChars: (userMessage?.length || 0) + (aiResponse?.length || 0) + scopedCharactersChars,
        },
      });
      
      // Build recent context (last 20 messages for pattern detection)
      const conversation = appData.conversations.find(c => c.id === conversationId);
      const recentMessages = conversation?.messages.slice(-20) || [];
      const errorPatterns = ['Invalid token', 'xAI/Grok error', 'Payment required', '⚠️'];
      const filteredMessages = recentMessages.filter(m => 
        !errorPatterns.some(pat => m.text.includes(pat))
      );
      const recentContext = filteredMessages
        .map(m => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.text}`)
        .join('\n\n');

      void trackApiValidationSnapshot({
        eventKey: 'validation.call2.character_updates',
        eventSource: 'chat-interface.character-updates',
        apiCallGroup: 'call_2',
        parentRowId: 'summary.call2.character_updates',
        detailPresence: buildRequiredPresence([
          ['call2.character_updates.user_message', userMessage],
          ['call2.character_updates.ai_response', aiResponse],
          ['call2.character_updates.recent_context', recentContext],
          ['call2.character_updates.characters_payload', allCharacters],
          ['call2.character_updates.eligible_characters', [...eligibleNames]],
        ]),
        diagnostics: {
          scopedCharacterCount: allCharacters.length,
          eligibleCharacterCount: eligibleNames.size,
        },
      });
      
      const { data, error } = await supabase.functions.invoke('extract-character-updates', {
        body: {
          userMessage,
          aiResponse,
          recentContext,
          characters: allCharacters,
          modelId,
          eligibleCharacters: [...eligibleNames]
        }
      });
      
      if (error) {
        console.error('[extractCharacterUpdates] Edge function error:', error);
        return [];
      }
      
      // Defensive: filter out updates for non-eligible characters and unsupported fields
      const updates = (data?.updates || [])
        .filter((u: ExtractedUpdate) => eligibleNames.has(u.character.toLowerCase()))
        .filter((u: ExtractedUpdate) => isAllowedExtractionField(u.field));

      if (!isAssistantMessageStillCurrent(meta?.sourceAssistantMessageId)) {
        debugLog('[extractCharacterUpdates] Discarded stale result for non-current turn');
        return [];
      }

      if (updates.length > 0) {
        const updatedCharacters = new Set(
          updates
            .map((u: ExtractedUpdate) => (u.character || '').trim().toLowerCase())
            .filter(Boolean)
        );
        void trackAiUsageEvent({
          eventType: 'character_cards_updated',
          eventSource: 'chat-interface',
          count: updatedCharacters.size,
          metadata: {
            conversationId,
            extractionReason: meta?.reason || 'unknown',
            updateCount: updates.length,
            modelId,
            outputChars: JSON.stringify(updates).length,
          },
        });
      }

      debugLog(`[extractCharacterUpdates] Completed — ${updates.length} updates (filtered from ${data?.updates?.length || 0})`);
      return updates;
    } catch (err) {
      console.error('[extractCharacterUpdates] Failed:', err);
      return [];
    } finally {
      extractionInProgressRef.current = false;
      // Process queued extraction if any
      const pending = pendingExtractionRef.current;
      if (pending) {
        pendingExtractionRef.current = null;
        debugLog('[extractCharacterUpdates] Processing queued extraction');
        extractCharacterUpdatesFromDialogue(pending.userMessage, pending.aiResponse, pending.meta).then(updates => {
          if (updates.length > 0) {
            debugLog(`[extractCharacterUpdates] Queued extraction yielded ${updates.length} updates`);
            applyExtractedUpdates(updates);
          }
        }).catch(err => {
          console.error('[extractCharacterUpdates] Queued extraction failed:', err);
        });
      }
    }
  };

  const sanitizeMoodValue = (raw: string): string => {
    const cleaned = raw
      .replace(/[*"()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return '';

    const firstSentence = cleaned.split(/[.!?]/)[0].trim();
    const limited = firstSentence.split(/\s+/).slice(0, 12).join(' ');

    // Guard against stage-direction leakage in mood fields.
    const forbiddenPattern = /\b(foot|feet|toe|toes|thigh|hips?|breast|boob|cock|penis|pussy|ass|butt|bed|door|shirt|shorts|thong|bra|moves?|moving|walks?|walking|leans?|leaning|touches?|touching|presses?|pressing|curls?|curling|kneads?|kneading|whispers?|whispering|kisses?|kissing)\b/i;
    return forbiddenPattern.test(limited) ? '' : limited;
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
      const resolvedMatch = resolveCharacterReference(charNameLower);
      const mainChar = resolvedMatch?.kind === 'main' ? resolvedMatch.base : undefined;
      const sideChar = resolvedMatch?.kind === 'side' ? resolvedMatch.side : undefined;
      
      if (!mainChar && !sideChar) {
        debugLog(`[applyExtractedUpdates] Character not found: ${charNameLower}`);
      }
      
      if (mainChar) {
        // Build patch first, then only show indicator if there are real changes
        
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
        const updatedSections = [...(sessionState.customSections || mainChar.sections || [])];
        const updatedGoals = [...(sessionState.goals || mainChar.goals || [])];
        
        for (const update of charUpdates) {
          const { field, value } = update;
          if (!isAllowedExtractionField(field)) {
            debugLog(`[applyExtractedUpdates] Skipped unsupported field "${field}"`);
            continue;
          }
          
          // Handle goals.GoalTitle = "desired_outcome: X | ..." or "REMOVE" format
          if (field.startsWith('goals.')) {
            const goalTitle = field.slice(6); // Remove 'goals.' prefix
            if (goalTitle) {
              // Change 2: Handle REMOVE signal — delete obsolete goals
              if (value.trim() === 'REMOVE') {
                const removeIdx = updatedGoals.findIndex(g => 
                  g.title.toLowerCase() === goalTitle.toLowerCase()
                );
                if (removeIdx !== -1) {
                  debugLog(`[applyExtractedUpdates] REMOVED goal "${goalTitle}"`);
                  updatedGoals.splice(removeIdx, 1);
                  goalsModified = true;
                }
                continue;
              }

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

              // Helper: parse steps with line-boundary-anchored regex (Change 1 - Gap 1)
              const parseSteps = (raw: string): Array<{ id: string; description: string; completed: boolean }> => {
                const stepEntries = raw.split(/(?:^|\n)Step\s+\d+:\s*/i).filter(Boolean);
                return stepEntries
                  .map(desc => desc.trim().replace(/\|$/, '').trim())
                  .filter(Boolean)
                  .map(desc => ({ id: `step_${uuid().slice(0, 12)}`, description: desc, completed: false }));
              };
              
              // Find existing goal or create new one
              const existingGoalIndex = updatedGoals.findIndex(g => 
                g.title.toLowerCase() === goalTitle.toLowerCase()
              );
              
              if (existingGoalIndex !== -1) {
                const existingGoal = updatedGoals[existingGoalIndex];
                
                // Change 1: REPLACE steps instead of appending
                let updatedSteps = [...(existingGoal.steps || [])];
                
                if (newStepsMatch) {
                  const parsedSteps = parseSteps(newStepsMatch[1].trim());
                  
                  // Hard cap: reject absurd payloads (>15 parsed steps = broken output)
                  if (parsedSteps.length > 15) {
                    console.warn(`[applyExtractedUpdates] Rejected ${parsedSteps.length} steps for "${goalTitle}" (>15 = broken output). Keeping existing steps.`);
                    // Only apply progress/status, don't touch steps
                  } else {
                    // Cap at 8 steps max
                    updatedSteps = parsedSteps.slice(0, 8);
                  }
                }
                
                // Apply complete_steps AFTER replacement (Change 1 fix: order matters)
                if (completeStepsMatch) {
                  const indices = completeStepsMatch[1].trim().split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                  for (const idx of indices) {
                    if (idx >= 1 && idx <= updatedSteps.length) {
                      updatedSteps[idx - 1] = { ...updatedSteps[idx - 1], completed: true, completedAt: Date.now() };
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
                debugLog(`[applyExtractedUpdates] Updated goal "${goalTitle}" → ${progress}% (${updatedSteps.filter(s => s.completed).length}/${updatedSteps.length} steps)`);
              } else {
                // Change 2: Dedupe guard — reject near-duplicate titles
                const normalizedTitle = goalTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
                const isDuplicate = updatedGoals.some(g => {
                  const existingNorm = g.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
                  if (existingNorm === normalizedTitle) return true;
                  // Simple similarity: check if 80%+ words overlap
                  const newWords = new Set(normalizedTitle.split(/\s+/));
                  const existWords = new Set(existingNorm.split(/\s+/));
                  const overlap = [...newWords].filter(w => existWords.has(w)).length;
                  const maxLen = Math.max(newWords.size, existWords.size);
                  return maxLen > 0 && (overlap / maxLen) > 0.8;
                });
                
                if (isDuplicate) {
                  debugLog(`[applyExtractedUpdates] Rejected duplicate goal "${goalTitle}"`);
                  continue;
                }
                
                // Change 2: Enforce max 5 active goals
                if (updatedGoals.length >= 5) {
                  console.warn(`[applyExtractedUpdates] Goal cap reached (5). Ignoring new goal "${goalTitle}"`);
                  continue;
                }

                // Create new goal - parse any new_steps
                const newSteps = newStepsMatch ? parseSteps(newStepsMatch[1].trim()).slice(0, 8) : [];
                
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
                debugLog(`[applyExtractedUpdates] Created new goal "${goalTitle}" → ${progress}% with ${newSteps.length} steps`);
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
                debugLog(`[applyExtractedUpdates] Created new section: ${sectionTitle}`);
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
                debugLog(`[applyExtractedUpdates] Added new item "${itemLabel}" to section "${sectionTitle}"`);
              } else {
                // Update existing item
                section.items[itemIndex] = {
                  ...section.items[itemIndex],
                  value: value,
                  updatedAt: Date.now()
                };
                debugLog(`[applyExtractedUpdates] Updated item "${itemLabel}" in section "${sectionTitle}"`);
              }
              
              section.updatedAt = Date.now();
              sectionsModified = true;
            }
          } else if (field.includes('.')) {
            const [parent, child] = field.split('.');
            // Legacy compat: prompt now uses 'undergarments' but old cached extractions may still use 'underwear'
            let normalizedChild = child;
            if (parent === 'preferredClothing' && child === 'underwear') normalizedChild = 'undergarments';
            
            if (parent === 'physicalAppearance') {
              if (normalizedChild === '_extras') {
                // Change 7: _extras deduplication for physicalAppearance
                const existing = patch.physicalAppearance || sessionState.physicalAppearance || mainChar.physicalAppearance || {};
                const extras = [...((existing as any)._extras || [])];
                const parts = value.split(':');
                const newLabel = (parts[0]?.trim() || 'New').toLowerCase();
                const newValue = parts.slice(1).join(':')?.trim() || value;
                const existIdx = extras.findIndex((e: any) => e.label.toLowerCase() === newLabel);
                if (existIdx !== -1) {
                  extras[existIdx] = { ...extras[existIdx], value: newValue };
                } else {
                  const nearDupIdx = findNearDuplicateExtraIndex(extras, parts[0]?.trim() || 'New', newValue);
                  if (nearDupIdx !== -1) {
                    extras[nearDupIdx] = {
                      ...extras[nearDupIdx],
                      value: extras[nearDupIdx].value.length >= newValue.length ? extras[nearDupIdx].value : newValue
                    };
                  } else {
                    extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: newValue });
                  }
                }
                patch.physicalAppearance = { ...existing, ...(patch.physicalAppearance || {}), _extras: extras };
              } else {
                patch.physicalAppearance = { ...(mainChar.physicalAppearance || {}), ...(sessionState.physicalAppearance || {}), ...(patch.physicalAppearance || {}), [normalizedChild]: value };
              }
            } else if (parent === 'currentlyWearing') {
              if (normalizedChild === '_extras') {
                const existing = patch.currentlyWearing || sessionState.currentlyWearing || mainChar.currentlyWearing || {};
                const extras = [...((existing as any)._extras || [])];
                const parts = value.split(':');
                const newLabel = (parts[0]?.trim() || 'New').toLowerCase();
                const newValue = parts.slice(1).join(':')?.trim() || value;
                const existIdx = extras.findIndex((e: any) => e.label.toLowerCase() === newLabel);
                if (existIdx !== -1) {
                  extras[existIdx] = { ...extras[existIdx], value: newValue };
                } else {
                  const nearDupIdx = findNearDuplicateExtraIndex(extras, parts[0]?.trim() || 'New', newValue);
                  if (nearDupIdx !== -1) {
                    extras[nearDupIdx] = {
                      ...extras[nearDupIdx],
                      value: extras[nearDupIdx].value.length >= newValue.length ? extras[nearDupIdx].value : newValue
                    };
                  } else {
                    extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: newValue });
                  }
                }
                patch.currentlyWearing = { ...existing, ...(patch.currentlyWearing || {}), _extras: extras };
              } else {
                patch.currentlyWearing = { ...(mainChar.currentlyWearing || {}), ...(sessionState.currentlyWearing || {}), ...(patch.currentlyWearing || {}), [normalizedChild]: value };
              }
            } else if (parent === 'preferredClothing') {
              if (normalizedChild === '_extras') {
                const existing = patch.preferredClothing || sessionState.preferredClothing || mainChar.preferredClothing || {};
                const extras = [...((existing as any)._extras || [])];
                const parts = value.split(':');
                const newLabel = (parts[0]?.trim() || 'New').toLowerCase();
                const newValue = parts.slice(1).join(':')?.trim() || value;
                const existIdx = extras.findIndex((e: any) => e.label.toLowerCase() === newLabel);
                if (existIdx !== -1) {
                  extras[existIdx] = { ...extras[existIdx], value: newValue };
                } else {
                  const nearDupIdx = findNearDuplicateExtraIndex(extras, parts[0]?.trim() || 'New', newValue);
                  if (nearDupIdx !== -1) {
                    extras[nearDupIdx] = {
                      ...extras[nearDupIdx],
                      value: extras[nearDupIdx].value.length >= newValue.length ? extras[nearDupIdx].value : newValue
                    };
                  } else {
                    extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: newValue });
                  }
                }
                patch.preferredClothing = { ...existing, ...(patch.preferredClothing || {}), _extras: extras };
              } else {
                patch.preferredClothing = { ...(mainChar.preferredClothing || {}), ...(sessionState.preferredClothing || {}), ...(patch.preferredClothing || {}), [normalizedChild]: value };
              }
            } else if (parent === 'background') {
              // Update background hardcoded fields in session state
              const bg = patch.background || sessionState.background || mainChar.background || { jobOccupation: '', educationLevel: '', residence: '', hobbies: '', financialStatus: '', motivation: '' };
              if (normalizedChild === '_extras') {
                // Change 7: _extras deduplication for background
                const extras = [...((bg as any)._extras || [])];
                const parts = value.split(':');
                const newLabel = (parts[0]?.trim() || 'New').toLowerCase();
                const newValue = parts.slice(1).join(':')?.trim() || value;
                const existIdx = extras.findIndex((e: any) => e.label.toLowerCase() === newLabel);
                if (existIdx !== -1) {
                  extras[existIdx] = { ...extras[existIdx], value: newValue };
                } else {
                  const nearDupIdx = findNearDuplicateExtraIndex(extras, parts[0]?.trim() || 'New', newValue);
                  if (nearDupIdx !== -1) {
                    extras[nearDupIdx] = {
                      ...extras[nearDupIdx],
                      value: extras[nearDupIdx].value.length >= newValue.length ? extras[nearDupIdx].value : newValue
                    };
                  } else {
                    extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: newValue });
                  }
                }
                (bg as any)._extras = extras;
              } else {
                (bg as any)[normalizedChild] = value;
              }
              patch.background = bg;
            } else if (parent === 'personality') {
              // Change 3 (Gap 2): Add personality branch — was completely missing
              const pers = (patch as any).personality || (sessionState as any).personality || (mainChar as any).personality || {};
              if (normalizedChild === 'outwardTraits' || normalizedChild === 'inwardTraits' || normalizedChild === 'traits') {
                // Parse trait entries from "Label: Description" or JSON format
                let newTraits: Array<{ label: string; value: string }> = [];
                try {
                  const parsed = JSON.parse(value);
                  if (Array.isArray(parsed)) newTraits = parsed;
                } catch {
                  // Parse "Label: Description, Label2: Description2" or single "Label: Description"
                  const traitParts = value.split(/,\s*(?=[A-Z])/);
                  for (const part of traitParts) {
                    const colonIdx = part.indexOf(':');
                    if (colonIdx > 0) {
                      newTraits.push({ label: part.slice(0, colonIdx).trim(), value: part.slice(colonIdx + 1).trim() });
                    } else if (part.trim()) {
                      newTraits.push({ label: part.trim(), value: '' });
                    }
                  }
                }
                // Merge: update existing traits by label, append new ones
                const existingTraits = [...(pers[normalizedChild] || [])];
                for (const nt of newTraits) {
                  const idx = existingTraits.findIndex((t: any) => t.label.toLowerCase() === nt.label.toLowerCase());
                  if (idx !== -1) {
                    if (shouldRefineExistingText(existingTraits[idx].value || '', nt.value || '')) {
                      existingTraits[idx] = { ...existingTraits[idx], value: nt.value };
                    }
                  } else {
                    const nearDupIdx = findNearDuplicateTraitIndex(existingTraits, nt.label, nt.value);
                    if (nearDupIdx !== -1) {
                      const existing = existingTraits[nearDupIdx];
                      if (shouldRefineExistingText(existing.value || '', nt.value || '')) {
                        existingTraits[nearDupIdx] = {
                          ...existing,
                          value: nt.value
                        };
                      }
                    } else {
                      existingTraits.push({ id: `trait_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...nt });
                    }
                  }
                }
                (patch as any).personality = { ...pers, [normalizedChild]: existingTraits };
              } else {
                // Direct assignment for other personality fields (e.g., splitMode)
                (patch as any).personality = { ...pers, [normalizedChild]: value };
              }
            } else if (['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'].includes(parent) && normalizedChild === '_extras') {
              // Change 7: _extras deduplication for extras-only sections
              const sectionKey = parent as 'tone' | 'keyLifeEvents' | 'relationships' | 'secrets' | 'fears';
              const existing = (patch as any)[sectionKey] || (sessionState as any)[sectionKey] || (mainChar as any)[sectionKey] || {};
              const extras = [...(existing._extras || [])];
              const parts = value.split(':');
              const newLabel = (parts[0]?.trim() || 'New').toLowerCase();
              const newValue = parts.slice(1).join(':')?.trim() || value;
              const existIdx = extras.findIndex((e: any) => e.label.toLowerCase() === newLabel);
              if (existIdx !== -1) {
                if (shouldRefineExistingText(extras[existIdx]?.value || '', newValue || '')) {
                  extras[existIdx] = { ...extras[existIdx], value: newValue };
                  debugLog(`[applyExtractedUpdates] Updated existing ${parent}._extras entry "${parts[0]?.trim()}"`);
                } else {
                  debugLog(`[applyExtractedUpdates] Ignored low-value rewrite for ${parent}._extras entry "${parts[0]?.trim()}"`);
                }
              } else {
                const nearDupIdx = findNearDuplicateExtraIndex(extras, parts[0]?.trim() || 'New', newValue);
                if (nearDupIdx !== -1) {
                  if (shouldRefineExistingText(extras[nearDupIdx]?.value || '', newValue || '')) {
                    extras[nearDupIdx] = {
                      ...extras[nearDupIdx],
                      value: newValue
                    };
                    debugLog(`[applyExtractedUpdates] Refined near-duplicate ${parent}._extras entry "${parts[0]?.trim()}"`);
                  } else {
                    debugLog(`[applyExtractedUpdates] Ignored near-duplicate ${parent}._extras entry "${parts[0]?.trim()}"`);
                  }
                } else {
                  extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: newValue });
                }
              }
              (patch as any)[sectionKey] = { ...existing, _extras: extras };
            }
          } else {
            if (field === 'currentMood') {
              const sanitizedMood = sanitizeMoodValue(value);
              if (sanitizedMood) {
                patch.currentMood = sanitizedMood;
              } else {
                debugLog(`[applyExtractedUpdates] Skipped invalid currentMood payload: "${value}"`);
              }
            } else {
              patch[field] = value;
            }
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

        // Do not persist no-op writes; they create noisy "updated" signals.
        for (const key of Object.keys(patch)) {
          const sessionValue = (sessionState as any)[key];
          const baseValue = (mainChar as any)[key];
          const effectiveCurrent = sessionValue !== undefined ? sessionValue : baseValue;
          if (JSON.stringify(effectiveCurrent) === JSON.stringify((patch as any)[key])) {
            delete (patch as any)[key];
          }
        }
        
        if (Object.keys(patch).length > 0) {
          // Only show indicator when there are real changes to apply
          showCharacterUpdateIndicator(mainChar.id);
          await supabaseData.updateSessionState(sessionState.id, patch);
          setSessionStates(prev => prev.map(s => s.id === sessionState!.id ? { ...s, ...patch } : s));
          debugLog(`[applyExtractedUpdates] Updated ${mainChar.name}:`, Object.keys(patch));
        }
      } else if (sideChar) {
        // Build patch first, then show indicator only if real changes
        
        // Change 8: Expanded side character update paths (mirrors main character logic)
        const patch: Record<string, any> = {};
        for (const update of charUpdates) {
          const { field, value } = update;
          if (!isAllowedExtractionField(field)) {
            debugLog(`[applyExtractedUpdates] Skipped unsupported side-character field "${field}"`);
            continue;
          }
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            let normalizedChild = child;
            if (parent === 'preferredClothing' && child === 'underwear') normalizedChild = 'undergarments';
            
            if (parent === 'physicalAppearance') {
              if (normalizedChild === '_extras') {
                const existing = patch.physicalAppearance || sideChar.physicalAppearance || {};
                const extras = [...((existing as any)._extras || [])];
                const parts = value.split(':');
                const newLabel = (parts[0]?.trim() || 'New').toLowerCase();
                const newValue = parts.slice(1).join(':')?.trim() || value;
                const existIdx = extras.findIndex((e: any) => e.label.toLowerCase() === newLabel);
                if (existIdx !== -1) extras[existIdx] = { ...extras[existIdx], value: newValue };
                else {
                  const nearDupIdx = findNearDuplicateExtraIndex(extras, parts[0]?.trim() || 'New', newValue);
                  if (nearDupIdx !== -1) {
                    extras[nearDupIdx] = {
                      ...extras[nearDupIdx],
                      value: extras[nearDupIdx].value.length >= newValue.length ? extras[nearDupIdx].value : newValue
                    };
                  } else {
                    extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: newValue });
                  }
                }
                patch.physicalAppearance = { ...existing, ...(patch.physicalAppearance || {}), _extras: extras };
              } else {
                patch.physicalAppearance = { ...(sideChar.physicalAppearance || {}), ...(patch.physicalAppearance || {}), [normalizedChild]: value };
              }
            } else if (parent === 'currentlyWearing') {
              patch.currentlyWearing = { ...(sideChar.currentlyWearing || {}), ...(patch.currentlyWearing || {}), [normalizedChild]: value };
            } else if (parent === 'preferredClothing') {
              patch.preferredClothing = { ...(sideChar.preferredClothing || {}), ...(patch.preferredClothing || {}), [normalizedChild]: value };
            } else if (parent === 'background') {
              const bg = patch.background || sideChar.background || {};
              if (normalizedChild === '_extras') {
                const extras = [...((bg as any)._extras || [])];
                const parts = value.split(':');
                const newLabel = (parts[0]?.trim() || 'New').toLowerCase();
                const newValue = parts.slice(1).join(':')?.trim() || value;
                const existIdx = extras.findIndex((e: any) => e.label.toLowerCase() === newLabel);
                if (existIdx !== -1) extras[existIdx] = { ...extras[existIdx], value: newValue };
                else {
                  const nearDupIdx = findNearDuplicateExtraIndex(extras, parts[0]?.trim() || 'New', newValue);
                  if (nearDupIdx !== -1) {
                    extras[nearDupIdx] = {
                      ...extras[nearDupIdx],
                      value: extras[nearDupIdx].value.length >= newValue.length ? extras[nearDupIdx].value : newValue
                    };
                  } else {
                    extras.push({ id: `extra_${Date.now()}`, label: parts[0]?.trim() || 'New', value: newValue });
                  }
                }
                (bg as any)._extras = extras;
              } else {
                (bg as any)[normalizedChild] = value;
              }
              patch.background = bg;
            } else if (parent === 'personality') {
              const pers = patch.personality || sideChar.personality || {};
              if (normalizedChild === 'outwardTraits' || normalizedChild === 'inwardTraits' || normalizedChild === 'traits') {
                let newTraits: Array<{ label: string; value: string }> = [];
                try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) newTraits = parsed; } catch {
                  const traitParts = value.split(/,\s*(?=[A-Z])/);
                  for (const part of traitParts) {
                    const colonIdx = part.indexOf(':');
                    if (colonIdx > 0) newTraits.push({ label: part.slice(0, colonIdx).trim(), value: part.slice(colonIdx + 1).trim() });
                    else if (part.trim()) newTraits.push({ label: part.trim(), value: '' });
                  }
                }
                const existingTraits = [...((pers as any)[normalizedChild] || [])];
                for (const nt of newTraits) {
                  const idx = existingTraits.findIndex((t: any) => t.label.toLowerCase() === nt.label.toLowerCase());
                  if (idx !== -1) {
                    if (shouldRefineExistingText(existingTraits[idx].value || '', nt.value || '')) {
                      existingTraits[idx] = { ...existingTraits[idx], value: nt.value };
                    }
                  } else {
                    const nearDupIdx = findNearDuplicateTraitIndex(existingTraits, nt.label, nt.value);
                    if (nearDupIdx !== -1) {
                      const existing = existingTraits[nearDupIdx];
                      if (shouldRefineExistingText(existing.value || '', nt.value || '')) {
                        existingTraits[nearDupIdx] = {
                          ...existing,
                          value: nt.value
                        };
                      }
                    } else {
                      existingTraits.push({ id: `trait_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...nt });
                    }
                  }
                }
                patch.personality = { ...pers, [normalizedChild]: existingTraits };
              } else {
                patch.personality = { ...pers, [normalizedChild]: value };
              }
            }
          } else {
            if (field === 'currentMood') {
              const sanitizedMood = sanitizeMoodValue(value);
              if (sanitizedMood) {
                patch.currentMood = sanitizedMood;
              } else {
                debugLog(`[applyExtractedUpdates] Skipped invalid side-character currentMood payload: "${value}"`);
              }
            } else {
              patch[field] = value;
            }
          }
        }

        for (const key of Object.keys(patch)) {
          const current = (sideChar as any)[key];
          if (JSON.stringify(current) === JSON.stringify((patch as any)[key])) {
            delete (patch as any)[key];
          }
        }
        
        if (Object.keys(patch).length > 0) {
          // Only show indicator when there are real changes
          showCharacterUpdateIndicator(sideChar.id);
          await supabaseData.updateSideCharacter(sideChar.id, patch);
          if (onUpdateSideCharacters) {
            const updated = (appData.sideCharacters || []).map(sc => 
              sc.id === sideChar!.id ? { ...sc, ...patch } : sc
            );
            onUpdateSideCharacters(updated);
          }
          debugLog(`[applyExtractedUpdates] Updated side character ${sideChar.name}:`, Object.keys(patch));
        }
      } else {
        debugLog(`[applyExtractedUpdates] Character not found: ${charNameLower}`);
      }
    }
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
    setTimeRemaining(timeProgressionInterval * 60); // reset auto-advance timer
  };

  // Helper to format seconds as MM:SS
  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Save time progression settings to conversation
  const handleTimeProgressionChange = (mode: 'manual' | 'automatic', interval?: number) => {
    setTimeProgressionMode(mode);
    setIsTimerPaused(false);
    const effectiveInterval = interval ?? timeProgressionInterval;
    if (interval !== undefined) setTimeProgressionInterval(effectiveInterval);
    // Immediately sync refs so timer/cleanup always see latest values
    timeProgressionIntervalRef.current = effectiveInterval;
    const effectiveTimeRemaining = effectiveInterval * 60;
    setTimeRemaining(effectiveTimeRemaining);
    timeRemainingRef.current = effectiveTimeRemaining;
    
    // Update conversation in app state (local only)
    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? { ...c, timeProgressionMode: mode, timeProgressionInterval: effectiveInterval, timeRemaining: effectiveTimeRemaining, updatedAt: now() }
        : c
    );
    onUpdate(updatedConvs);
    // Direct DB persist — single source of truth for timer settings
    supabaseData.updateConversationMeta(conversationId, {
      timeProgressionMode: mode,
      timeProgressionInterval: effectiveInterval,
      timeRemaining: effectiveTimeRemaining
    });
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
  const getTimeBackgroundImage = (time: TimeOfDay): string => {
    switch (time) {
      case 'sunrise': return '/images/time-backgrounds/sunrise.png';
      case 'day':     return '/images/time-backgrounds/day.png';
      case 'sunset':  return '/images/time-backgrounds/sunset.png';
      case 'night':   return '/images/time-backgrounds/night.png';
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
      // Issue #8: Detect user-authored AI character content and prepend canon note
      const canonNote = buildCanonNote(input, appData.characters);
      
      // Issue #7: Compute length directive and increment session counter
      const lengthDirective = getLengthDirective();
      const antiLoopDirective = getAntiLoopDirective();
      sessionMessageCountRef.current += 1;
      
      // Build runtime directives string (injected as dedicated system message)
      const runtimeDirectives = antiLoopDirective || undefined;
      
      const llmInput = canonNote + input;
      const stream = generateRoleplayResponseStream(
        llmAppData,
        conversationId,
        llmInput,
        modelId,
        currentDay,
        currentTimeOfDay,
        memories,
        memoriesEnabled,
        undefined,
        lengthDirective || undefined,
        sessionMessageCountRef.current,
        runtimeDirectives,
        activeScene
      );

      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
        
        // Format streaming content on-the-fly to prevent flickering
        const existingNamesForStream = getKnownCharacterNames(appData);
        const formatted = stripUpdateTags(fullText);
        const { normalizedText } = normalizePlaceholderNames(formatted, existingNamesForStream, placeholderMapRef.current);
        setFormattedStreamingContent(normalizedText);
      }

      const userInput = input; // Capture before clearing

      // Strip any legacy update tags that might still be in response (fallback)
      let cleanedText = stripUpdateTags(fullText);
      
      // Apply placeholder name guard to replace "Man 1:", "Cashier:", etc. with proper names
      const existingNames = getKnownCharacterNames(appData);
      const { normalizedText } = normalizePlaceholderNames(cleanedText, existingNames, placeholderMapRef.current);
      cleanedText = normalizedText;
      
      // Issue #7: Track response word count for adaptive length directives
      responseLengthsRef.current.push(cleanedText.split(/\s+/).length);

      // Issue #6A: Auto-extract memory events (non-blocking, mirrors character extraction pattern)
      if (memoriesEnabled) {
        void trackAiUsageEvent({
          eventType: 'memory_extraction_call',
          eventSource: 'chat-interface',
          metadata: {
            conversationId,
            day: currentDay,
            timeOfDay: currentTimeOfDay,
            inputChars: cleanedText.length,
            modelId,
          },
        });

        void trackApiValidationSnapshot({
          eventKey: 'validation.call2.memory_extract',
          eventSource: 'chat-interface.memory-extract',
          apiCallGroup: 'call_2',
          parentRowId: 'summary.call2.memory_extract',
          detailPresence: buildRequiredPresence([
            ['call2.memory_extract.message_text', cleanedText],
            ['call2.memory_extract.character_names', allCharacterNames],
            ['call2.memory_extract.model_id', modelId],
          ]),
          diagnostics: {
            characterCount: allCharacterNames.length,
          },
        });

        supabase.functions.invoke('extract-memory-events', {
          body: {
            messageText: cleanedText,
            characterNames: allCharacterNames,
            modelId
          }
        }).then(({ data, error }) => {
          if (!error && data?.extractedEvents?.length > 0) {
            const events: string[] = data.extractedEvents;
            void trackAiUsageEvent({
              eventType: 'memory_events_extracted',
              eventSource: 'chat-interface',
              count: events.length,
              metadata: {
                conversationId,
                day: currentDay,
                timeOfDay: currentTimeOfDay,
                outputChars: events.join('\n').length,
              },
            });
            const combinedContent = events.length === 1
              ? events[0]
              : events.map((e: string) => `- ${e}`).join('\n');
            handleCreateMemory(combinedContent, currentDay, currentTimeOfDay);
          }
        }).catch(err => {
          console.error('[handleSend] Memory extraction failed:', err);
        });
      }


      const aiMessageId = uuid();
      const aiMsg: Message = { 
        id: aiMessageId, 
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

      evaluateGoalProgress(userInput, cleanedText, aiMessageId).catch(err => {
        console.error('[handleSend] Goal progress evaluation failed:', err);
      });

      assistantTurnsSinceExtractionRef.current += 1;
      const extractionDecision = getExtractionDecision(userInput, cleanedText);
      if (extractionDecision.shouldExtract) {
        assistantTurnsSinceExtractionRef.current = 0;
        extractCharacterUpdatesFromDialogue(userInput, cleanedText, {
          sourceAssistantMessageId: aiMessageId,
          reason: extractionDecision.reason
        }).then(updates => {
          if (updates.length > 0) {
            debugLog(`[handleSend] Extracted ${updates.length} character updates (${extractionDecision.reason})`, updates);
            applyExtractedUpdates(updates);
          }
        }).catch(err => {
          console.error('[handleSend] Character extraction failed:', err);
        });
      }
      
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
    regenerateEventsRef.current.push({ messageId, timestamp: Date.now() });
    const msgIndex = conversation?.messages.findIndex(m => m.id === messageId);
    if (msgIndex === undefined || msgIndex < 1) return;
    
    // Search backward from msgIndex for the nearest user message
    let userMessage: Message | undefined;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (conversation?.messages[i]?.role === 'user') {
        userMessage = conversation.messages[i];
        break;
      }
    }
    if (!userMessage) return;
    
    // Track which specific message is being regenerated (for in-place streaming)
    setRegeneratingMessageId(messageId);
    setIsRegenerating(true);
    setIsStreaming(true);
    setStreamingContent('');
    setFormattedStreamingContent('');
    
    try {
      // Strip the old AI response AND the triggering user message from context
      // (generateRoleplayResponseStream will re-add the user message as the final turn,
      //  so including it in history would duplicate it and reinforce confirmation loops)
      const llmAppData = buildLLMAppData();
      const conv = llmAppData.conversations.find(c => c.id === conversationId);
      const userMsgIdx = conv?.messages.findIndex(m => m.id === userMessage.id) ?? msgIndex;
      const truncateAt = userMsgIdx >= 0 ? userMsgIdx : msgIndex;
      const truncatedConvs = llmAppData.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: c.messages.slice(0, truncateAt) }
          : c
      );
      const truncatedAppData = { ...llmAppData, conversations: truncatedConvs };
      
      let fullText = '';
      const antiLoopDirective = getAntiLoopDirective();
      const runtimeDirectives = antiLoopDirective || undefined;
      // Apply canon note to regenerate flow so user-authored AI dialogue is preserved
      const canonNote = buildCanonNote(userMessage.text, appData.characters);
      const regenInput = canonNote + userMessage.text;
      const stream = generateRoleplayResponseStream(
        truncatedAppData,
        conversationId,
        regenInput,
        modelId,
        currentDay,
        currentTimeOfDay,
        memories,
        memoriesEnabled,
        true,
        undefined,
        undefined,
        runtimeDirectives,
        activeScene
      );
      
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
        
        // Format streaming content on-the-fly
        const existingNamesForStream = getKnownCharacterNames(appData);
        const formatted = stripUpdateTags(fullText);
        const { normalizedText } = normalizePlaceholderNames(formatted, existingNamesForStream, placeholderMapRef.current);
        setFormattedStreamingContent(normalizedText);
      }
      
      // Regeneration is text-variation only: avoid mutating persistent character state here.

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
    } catch (err) {
      console.error(err);
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
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (lastMsg) continueEventsRef.current.push({ messageId: lastMsg.id, timestamp: Date.now() });
    
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
      const antiLoopDirective = getAntiLoopDirective();
      
      // Build runtime directives (injected as dedicated system message)
      const runtimeDirectives = antiLoopDirective || undefined;
      
      // Pass 13 continued: Build goal-aware continue prompt
      // Gather active character goals with current step info
      const goalSummaryParts: string[] = [];
      llmAppData.characters
        .filter(c => c.controlledBy === 'AI')
        .forEach(c => {
          const session = sessionStates.find(s => s.characterId === c.id);
          const goals = session?.goals || c.goals;
          if (Array.isArray(goals)) {
            goals.forEach((g: any) => {
              const label = typeof g === 'string' ? g : (g?.title || g?.label || g?.value || '');
              const currentStep = g?.steps?.find?.((s: any) => !s.completed)?.description;
              if (label) {
                goalSummaryParts.push(`${c.name}'s goal: "${label}"${currentStep ? ` — CURRENT STEP: "${currentStep}"` : ''}`);
              }
            });
          }
        });
      
      const storyGoalsList = effectiveWorldCore.storyGoals || [];
      storyGoalsList.forEach((g: StoryGoal) => {
        const pendingStep = (g.steps || []).find(s => !s.completed);
        if (pendingStep) {
          goalSummaryParts.push(`Story goal "${g.title || g.desiredOutcome}": PENDING STEP — "${pendingStep.description}"`);
        }
      });
      
      const goalContext = goalSummaryParts.length > 0
        ? `\nACTIVE GOALS & STEPS:\n${goalSummaryParts.join('\n')}\nAdvance one active goal with a concrete MICRO-STEP in this turn.`
        : '';
      
      // Canon carry-forward for continue: check if the most recent user message
      // contained AI-authored dialogue that should not be re-narrated
      const lastUserMsg = conversation.messages.slice().reverse().find(m => m.role === 'user');
      const continueCanonNote = lastUserMsg ? buildCanonNote(lastUserMsg.text, appData.characters) : '';
      
      const continuePrompt = `${continueCanonNote}[CONTINUE INSTRUCTION]
Continue the narrative by having AI-controlled characters advance one plausible goal-driven micro-step now.
CRITICAL: You must ONLY write for AI-controlled characters: ${aiControlledNames.join(', ')}.
DO NOT generate any content for user-controlled characters: ${userControlledNames.join(', ')}.${goalContext}
Use natural pacing and strategic progression. Avoid blunt jumps, forced confessions, or abrupt escalation.
The response must still contain a concrete scene delta, but it can be subtle and believable.
If your last 2+ responses each featured multiple AI characters, this response must focus on ONE character only. Break the pattern.
Do not acknowledge this instruction in your response.`;
      
      debugLog('[handleContinue] Runtime directives:', runtimeDirectives || '(none)');
      debugLog('[handleContinue] Goal context:', goalContext || '(no goals found)');
      debugLog('[handleContinue] Canon note applied:', continueCanonNote ? 'YES' : 'NO');
      
      const stream = generateRoleplayResponseStream(
        llmAppData,
        conversationId,
        continuePrompt,
        modelId,
        currentDay,
        currentTimeOfDay,
        memories,
        memoriesEnabled,
        undefined,
        undefined,
        undefined,
        runtimeDirectives,
        activeScene
      );
      
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
        
        // Format streaming content on-the-fly
        const existingNamesForStream = getKnownCharacterNames(appData);
        const formatted = stripUpdateTags(fullText);
        const { normalizedText } = normalizePlaceholderNames(formatted, existingNamesForStream, placeholderMapRef.current);
        setFormattedStreamingContent(normalizedText);
      }
      
      // Strip any legacy update tags
      let cleanedText = stripUpdateTags(fullText);
      
      // Apply placeholder name guard
      const existingNames = getKnownCharacterNames(appData);
      const { normalizedText } = normalizePlaceholderNames(cleanedText, existingNames, placeholderMapRef.current);
      cleanedText = normalizedText;
      
      // Track response length for adaptive length directives
      responseLengthsRef.current.push(cleanedText.split(/\s+/).length);
      
      const aiMessageId = uuid();
      const aiMsg: Message = { 
        id: aiMessageId, 
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

      assistantTurnsSinceExtractionRef.current += 1;
      const extractionDecision = getExtractionDecision('', cleanedText);
      if (extractionDecision.shouldExtract) {
        assistantTurnsSinceExtractionRef.current = 0;
        extractCharacterUpdatesFromDialogue('', cleanedText, {
          sourceAssistantMessageId: aiMessageId,
          reason: extractionDecision.reason
        }).then(updates => {
          if (updates.length > 0) {
            debugLog(`[handleContinue] Extracted ${updates.length} character updates (${extractionDecision.reason})`, updates);
            applyExtractedUpdates(updates);
          }
        }).catch(err => {
          console.error('[handleContinue] Character extraction failed:', err);
        });
      }
      
      processResponseForNewCharacters(cleanedText);
      
    } catch (err) {
      console.error(err);
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
        console.error('No messages to generate scene from');
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

      void trackApiValidationSnapshot({
        eventKey: 'validation.single.scene_image',
        eventSource: 'chat-interface.scene-image',
        apiCallGroup: 'single_call',
        parentRowId: 'summary.single.scene_image',
        detailPresence: buildRequiredPresence([
          ['single.scene_image.prompt_or_messages', recentMessages],
          ['single.scene_image.characters_or_context', charactersData],
        ]),
      });
      
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

      void trackAiUsageEvent({
        eventType: 'scene_image_generated',
        eventSource: 'chat-interface',
        metadata: {
          conversationId,
          modelId,
          inputChars: recentMessages.join('\n').length + JSON.stringify(charactersData).length,
        },
      });
      
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
      
    } catch (error) {
      console.error('Failed to generate scene image:', error);
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

      const matched = resolveCharacterReference(name);
      if (matched?.kind === 'main') {
        return { char: matched.effective, cleanText: strippedText, speakerName: matched.effective.name };
      }
      if (matched?.kind === 'side') {
        return { char: matched.side, cleanText: strippedText, speakerName: matched.side.name };
      }

      // Unknown speaker - still strip the tag to prevent flicker, preserve raw label for placeholder
      return { char: null, cleanText: strippedText, speakerName: name };
    }

    // Fallback: check if character name appears in first sentence
    const firstSentence = cleanRaw.split(/[.!?\n]/)[0];
    const sentenceTokens = firstSentence.match(/[A-Za-z][A-Za-z' -]{2,}/g) || [];
    for (const token of sentenceTokens) {
      const matched = resolveCharacterReference(token);
      if (matched?.kind === 'main') {
        return { char: matched.effective, cleanText: cleanRaw, speakerName: matched.effective.name };
      }
      if (matched?.kind === 'side') {
        return { char: matched.side, cleanText: cleanRaw, speakerName: matched.side.name };
      }
    }

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
      }
    } catch (error) {
      console.error('Failed to delete character:', error);
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
        console.error('Not authenticated');
        return;
      }
      
      // Find or create session state for this character
      let sessionState = sessionStates.find(s => s.characterId === char.id);
      
      if (!sessionState) {
        // Create new session state
        sessionState = await supabaseData.createSessionState(char, conversationId, user.id);
        setSessionStates(prev => [...prev, sessionState!]);
      }
      
// Update session state with draft changes (including avatar, control, role, previousNames, and 7 section fields)
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
        // Change 4: Persist 7 section fields from manual save
        personality: (draft as any).personality,
        background: (draft as any).background,
        tone: (draft as any).tone,
        keyLifeEvents: (draft as any).keyLifeEvents,
        relationships: (draft as any).relationships,
        secrets: (draft as any).secrets,
        fears: (draft as any).fears,
      });
      
      // Refresh session states
      const updatedStates = await supabaseData.fetchSessionStates(conversationId);
      setSessionStates(updatedStates);
      
      closeCharacterEditModal();
    } catch (err) {
      console.error('Failed to save character edit:', err);
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
    } catch (err) {
      console.error('Failed to save side character edit:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };
  
  // Unified save handler for the modal
  const handleModalSave = async (draft: CharacterEditDraft) => {
    if (!characterToEdit) return;
    
   // Side characters have 'firstMentionedIn'; main characters do not
    if ('firstMentionedIn' in characterToEdit) {
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
      { id: 'breast-size', label: 'Breasts', value: char.physicalAppearance?.breastSize || '', createdAt: 0, updatedAt: 0 },
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
  const getTileAvatarPosition = useCallback((char: Character): { x: number; y: number } => {
    const override = tileAvatarPositionOverrides[char.id];
    if (override) return override;
    const stored = {
      x: clampPercent(char.avatarPosition?.x ?? 50),
      y: clampPercent(char.avatarPosition?.y ?? 50),
    };
    const naturalSize = avatarNaturalSizes[char.id];
    if (!naturalSize) return stored;
    return mapObjectPositionFromPreviewToTile(stored, naturalSize, { width: CHAT_TILE_WIDTH, height: CHAT_TILE_HEIGHT });
  }, [tileAvatarPositionOverrides, avatarNaturalSizes]);

  const persistMainCharacterTilePosition = useCallback(async (charId: string, position: { x: number; y: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const baseChar = appData.characters.find(c => c.id === charId);
      if (!baseChar) return;

      const naturalSize = avatarNaturalSizes[charId];
      const storedAvatarPosition = naturalSize
        ? mapTilePositionToPreview(position, naturalSize, { width: CHAT_TILE_WIDTH, height: CHAT_TILE_HEIGHT })
        : { x: clampPercent(position.x), y: clampPercent(position.y) };

      let sessionState = sessionStates.find(s => s.characterId === charId);
      if (!sessionState) {
        sessionState = await supabaseData.createSessionState(baseChar, conversationId, user.id);
        setSessionStates(prev => [...prev, sessionState!]);
      }

      await supabaseData.updateSessionState(sessionState.id, { avatarPosition: storedAvatarPosition });
      setSessionStates(prev =>
        prev.map(s => (s.id === sessionState!.id ? { ...s, avatarPosition: storedAvatarPosition } : s))
      );
    } catch (err) {
      console.error('Failed to persist tile avatar position:', err);
    }
  }, [appData.characters, conversationId, sessionStates, avatarNaturalSizes]);

  const toggleTileRepositionMode = useCallback((char: Character) => {
    setTileDragState(null);
    setExpandedTileCharId(prev => (prev === char.id ? null : prev));
    setTileAvatarPositionOverrides(prev => ({
      ...prev,
      [char.id]: getTileAvatarPosition(char)
    }));
    setRepositioningTileCharId(prev => (prev === char.id ? null : char.id));
  }, [getTileAvatarPosition]);

  const handleTileRepositionPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, char: Character) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (repositioningTileCharId !== char.id) return;

      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const startPos = getTileAvatarPosition(char);
      event.currentTarget.setPointerCapture(event.pointerId);

      setTileDragState({
        charId: char.id,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPos,
        width: rect.width || 1,
        height: rect.height || 1,
      });
    },
    [getTileAvatarPosition, repositioningTileCharId]
  );

  const handleTileRepositionPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!tileDragState) return;
    if (event.pointerId !== tileDragState.pointerId) return;

    event.preventDefault();
    const deltaX = event.clientX - tileDragState.startClientX;
    const deltaY = event.clientY - tileDragState.startClientY;

    const nextX = clampPercent(tileDragState.startPos.x - (deltaX / tileDragState.width) * 100);
    const nextY = clampPercent(tileDragState.startPos.y - (deltaY / tileDragState.height) * 100);

    setTileAvatarPositionOverrides(prev => ({
      ...prev,
      [tileDragState.charId]: { x: nextX, y: nextY },
    }));
  }, [tileDragState]);

  const handleTileRepositionPointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!tileDragState) return;
    if (event.pointerId !== tileDragState.pointerId) return;

    event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);

    const finalPos = tileAvatarPositionOverrides[tileDragState.charId] || tileDragState.startPos;
    void persistMainCharacterTilePosition(tileDragState.charId, finalPos);
    setTileDragState(null);
  }, [tileDragState, tileAvatarPositionOverrides, persistMainCharacterTilePosition]);

  const handleDoneTileReposition = useCallback((char: Character) => {
    const finalPos = tileAvatarPositionOverrides[char.id] || getTileAvatarPosition(char);
    void persistMainCharacterTilePosition(char.id, finalPos);
    setTileDragState(null);
    setRepositioningTileCharId(null);
  }, [getTileAvatarPosition, persistMainCharacterTilePosition, tileAvatarPositionOverrides]);

  useEffect(() => {
    if (!expandedTileCharId) return;
    if (!appData.characters.some((c) => c.id === expandedTileCharId)) {
      setExpandedTileCharId(null);
    }
  }, [appData.characters, expandedTileCharId]);

  const renderCharacterCard = (baseChar: Character) => {
    // Apply session-scoped overrides to get the effective character
    const char = getEffectiveCharacter(baseChar);
    const isUpdating = updatingCharacterIds.has(char.id);
    const isRepositioning = repositioningTileCharId === char.id;
    const isExpanded = expandedTileCharId === char.id;
    const tileAvatarPos = getTileAvatarPosition(char);

    return (
      <div
        key={char.id}
        className={`group rounded-2xl overflow-hidden transition-all duration-300 border-2 border-[#4a5f7f] hover:border-[#4a5f7f] relative bg-black ${isExpanded ? '' : 'h-[140px]'} ${isUpdating ? 'ring-2 ring-blue-500/60' : ''}`}
      >
        {char.avatarDataUrl ? (
          <img
            src={char.avatarDataUrl}
            alt={char.name}
            className={`block w-full transition-[height,object-fit] duration-300 ${isExpanded ? 'h-auto object-contain object-top' : 'h-full object-cover'}`}
            style={isExpanded ? undefined : { objectPosition: `${tileAvatarPos.x}% ${tileAvatarPos.y}%` }}
          />
        ) : (
          <div className={`flex h-full min-h-[140px] items-center justify-center font-black text-5xl italic uppercase ${!sidebarBgIsLight ? 'bg-slate-300 text-slate-600' : 'bg-zinc-800 text-zinc-500'}`}>
            {char.name.charAt(0)}
          </div>
        )}

        {char.avatarDataUrl && !isRepositioning && (
          <button
            type="button"
            onClick={() => setExpandedTileCharId((prev) => (prev === char.id ? null : char.id))}
            className="absolute inset-0 z-20"
            aria-label={isExpanded ? `Collapse ${char.name} avatar` : `Expand ${char.name} avatar`}
          />
        )}

        <div className="absolute inset-0 pointer-events-none bg-black/0 transition-colors duration-150 group-hover:bg-black/35" />

        {isRepositioning && char.avatarDataUrl && (
          <div
            className="absolute inset-0 z-[18] touch-none cursor-move"
            onPointerDown={(e) => handleTileRepositionPointerDown(e, char)}
            onPointerMove={handleTileRepositionPointerMove}
            onPointerUp={handleTileRepositionPointerEnd}
            onPointerCancel={handleTileRepositionPointerEnd}
          >
            <button
              type="button"
              className="absolute left-2 top-2 rounded-md bg-black/55 border border-white/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white hover:bg-black/70"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleDoneTileReposition(char);
              }}
            >
              Done
            </button>
          </div>
        )}

        {/* Blue vignette overlay - scoped to this card */}
        {isUpdating && (
          <div 
            className="absolute inset-0 z-[15] pointer-events-none rounded-2xl overflow-hidden animate-vignette-pulse"
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

        <div className="absolute inset-x-0 bottom-0 z-10 p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold tracking-tight text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                {char.name}
              </div>
            </div>
            <Badge 
              variant={char.controlledBy === 'User' ? 'default' : 'secondary'}
              className={`text-[9px] px-1.5 py-0.5 shadow-sm ${
                char.controlledBy === 'User' 
                  ? 'bg-blue-500 hover:bg-blue-500 text-white border-0' 
                  : 'bg-slate-500 hover:bg-slate-500 text-white border-0'
              }`}
            >
              {char.controlledBy}
            </Badge>
          </div>
        </div>

        {/* Edit dropdown menu - always visible */}
        <div className="absolute top-2 right-2 z-30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg transition-colors bg-black/30 hover:bg-black/50 text-white/70 hover:text-white"
                  aria-label={`Open actions for ${char.name}`}
                  title={`Open actions for ${char.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg z-50 bg-zinc-800 border-ghost-white text-zinc-200">
              <DropdownMenuItem onClick={() => toggleTileRepositionMode(char)} className="hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white">
                <Move className="w-4 h-4 mr-2" />
                {isRepositioning ? 'Done repositioning' : 'Reposition image'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCharacterEditModal(char)} className="hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white">
                <Pencil className="w-4 h-4 mr-2" />
                Edit character
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteMainCharacter(char.id)}
                className="text-red-600 focus:text-red-600 focus:!bg-zinc-700 hover:!bg-zinc-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete character
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const bubblesTransparent = appData.uiSettings?.transparentBubbles ?? false;
  const showBackground = appData.uiSettings?.showBackgrounds && activeScene;
  const darkMode = appData.uiSettings?.darkMode;
  const offsetBubbles = appData.uiSettings?.offsetBubbles ?? false;
  const dynamicText = appData.uiSettings?.dynamicText !== false;
  const chatCanvasColor = normalizeHexColor(appData.uiSettings?.chatCanvasColor, '#1a1b20');
  const chatBubbleColor = normalizeHexColor(appData.uiSettings?.chatBubbleColor, '#1a1b20');

  useEffect(() => {
    if (!isColorModalOpen) return;
    setChatCanvasHexInput(chatCanvasColor);
    setChatBubbleHexInput(chatBubbleColor);
  }, [chatCanvasColor, chatBubbleColor, isColorModalOpen]);

  const handleUpdateUiSettings = (patch: {
    showBackgrounds?: boolean;
    transparentBubbles?: boolean;
    darkMode?: boolean;
    offsetBubbles?: boolean;
    proactiveCharacterDiscovery?: boolean;
    dynamicText?: boolean;
    proactiveNarrative?: boolean;
    narrativePov?: 'first' | 'third';
    nsfwIntensity?: 'normal' | 'high';
    realismMode?: boolean;
    responseVerbosity?: 'concise' | 'balanced' | 'detailed';
    chatCanvasColor?: string;
    chatBubbleColor?: string;
    apiUsageTestTracking?: boolean;
  }) => {
    if (onUpdateUiSettings) {
      onUpdateUiSettings(patch);
    }
  };

  const handleChatCanvasColorInput = (value: string) => {
    setChatCanvasHexInput(value);
    const normalized = tryNormalizeHexColor(value);
    if (normalized) handleUpdateUiSettings({ chatCanvasColor: normalized });
  };

  const handleChatBubbleColorInput = (value: string) => {
    setChatBubbleHexInput(value);
    const normalized = tryNormalizeHexColor(value);
    if (normalized) handleUpdateUiSettings({ chatBubbleColor: normalized });
  };

  // LOADING STATE: Show skeleton UI while data is being fetched
  // Placed here (after all hooks) to comply with React rules of hooks
  if (conversationId === "loading" || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-800">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Preparing your story...</p>
        </div>
      </div>
    );
  }

  // Layout guardrail:
  // Keep lg breakpoint (not xl) for split-pane mode so ~1024-1279px widths
  // still render sidebar + main panel side-by-side instead of stacking.
  return (
    <div
      className={`flex flex-1 min-h-0 min-w-0 h-full w-full flex-col lg:flex-row overflow-hidden relative ${darkMode ? 'bg-slate-900' : ''}`}
      style={{ backgroundColor: chatCanvasColor }}
    >

      {/* Height-chain guardrail:
          lg:h-full + parent h-full/min-h-0 are required for full-height sidebar
          and nested scroll containers to stay functional. */}
      <aside className={`w-full lg:w-[clamp(250px,28vw,300px)] max-h-[52vh] lg:max-h-none h-auto lg:h-full flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)] z-10 transition-colors relative overflow-hidden ${showBackground ? 'bg-white/90 backdrop-blur-md' : 'bg-white'}`}>
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
                  ? 'text-black hover:text-blue-500' 
                  : 'text-white hover:text-blue-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Exit Scenario
            </button>
            
            {/* Settings cog button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center justify-center rounded-xl px-3 py-2 bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))] transition-all active:scale-95"
                  aria-label="Open scenario settings"
                  title="Open scenario settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-800 border-ghost-white text-zinc-200">
                <DropdownMenuItem onClick={() => setIsSidebarThemeOpen(true)} className="cursor-pointer hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Set Theme
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
          {/* Day/Time Control Panel - Fixed at top */}
          <section
            className="flex-shrink-0 rounded-xl p-4 border border-slate-200 shadow-lg transition-all duration-700 relative overflow-hidden"
          >
            {/* Preloaded background images — all mounted, only active one visible */}
            {(['sunrise', 'day', 'sunset', 'night'] as const).map((time) => (
              <img
                key={time}
                src={getTimeBackgroundImage(time)}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-700 ${
                  currentTimeOfDay === time ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-black/20 rounded-xl" />
            <div className="relative z-10">
            {/* Time Progression Label Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-widest ${getTimeTextColor(currentTimeOfDay)}`}>
                  {timeProgressionMode === 'automatic' ? 'Automatic' : 'Manual'}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className={`w-3 h-3 cursor-help ${getTimeTextColor(currentTimeOfDay)} opacity-60`} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="text-xs font-semibold leading-relaxed normal-case tracking-normal max-w-[300px]">
                    Change time settings in Chat Settings
                  </TooltipContent>
                </Tooltip>
              </div>
              {timeProgressionMode === 'automatic' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsTimerPaused(prev => !prev)}
                    className="p-0.5 rounded hover:bg-black/30 transition-colors"
                    aria-label={isTimerPaused ? 'Resume timer' : 'Pause timer'}
                    title={isTimerPaused ? 'Resume timer' : 'Pause timer'}
                  >
                    {isTimerPaused
                      ? <Play className={`w-3.5 h-3.5 ${getTimeTextColor(currentTimeOfDay)} ${currentTimeOfDay !== 'night' ? 'fill-black' : 'fill-white'}`} />
                      : <Pause className={`w-3.5 h-3.5 ${getTimeTextColor(currentTimeOfDay)}`} />}
                  </button>
                  <span className="bg-black/50 rounded-md px-2 py-0.5 text-xs font-mono text-white">
                    {formatCountdown(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
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
                      className="px-1.5 py-0.5 hover:bg-slate-100 transition-colors text-black hover:text-blue-500"
                      aria-label="Increase day"
                      title="Increase day"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={decrementDay}
                      disabled={currentDay <= 1}
                      className="px-1.5 py-0.5 hover:bg-slate-100 transition-colors text-black hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease day"
                      title="Decrease day"
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
                          ? 'bg-blue-100 border-2 border-blue-500 text-blue-500 shadow-sm'
                          : 'bg-white border border-black text-black hover:bg-slate-100'
                      }`}
                      aria-label={`Set time to ${time}`}
                      title={time.charAt(0).toUpperCase() + time.slice(1)}
                    >
                      {getTimeIcon(time)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </section>

          {/* Main Characters - Scrollable section */}
          <section className="flex flex-col min-h-0 flex-shrink-0">
            <h3
              className="text-[11px] font-bold text-white bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none shadow-lg"
              onClick={() => setMainCharsCollapsed(prev => !prev)}
            >
              Main Characters
              <ChevronDown className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${mainCharsCollapsed ? 'rotate-180' : ''}`} />
            </h3>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${mainCharsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
              <div
                ref={mainCharsScrollRef}
                className={isExpandedTileInMainCharacters ? 'overflow-visible pr-0' : 'max-h-[calc(140px*3+0.5rem*2+0.5rem)] overflow-y-auto pr-1'}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 transparent' }}
                onScroll={() => {
                  if (isExpandedTileInMainCharacters) return;
                  const el = mainCharsScrollRef.current;
                  if (!el) return;
                  setCanScrollDownMainChars(el.scrollTop < el.scrollHeight - el.clientHeight - 10);
                }}
              >
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
                        isDarkBg={!sidebarBgIsLight}
                      />
                    )
                )}
                {mainCharactersForDisplay.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center italic py-4">No main characters.</p>
                )}
              </div>
              </div>
              {/* Full-width card-like overflow indicator */}
              {!isExpandedTileInMainCharacters && mainCharactersForDisplay.length > 3 && canScrollDownMainChars && (
                 <div className={`mt-0 w-full rounded-2xl backdrop-blur-sm border border-ghost-white flex items-center justify-center py-1.5 ${!sidebarBgIsLight ? 'bg-ghost-white' : 'bg-black/30'}`}>
                   <ChevronDown className={`w-4 h-4 ${!sidebarBgIsLight ? 'text-black/80' : 'text-white/80'}`} />
                   <span className={`text-xs font-medium ml-1 ${!sidebarBgIsLight ? 'text-black/80' : 'text-white/80'}`}>
                     {mainCharactersForDisplay.length - 3}
                   </span>
                </div>
              )}
            </div>
          </section>

          {/* Side Characters - Scrollable section */}
          <section className="flex flex-col min-h-0 flex-1">
            <h3
              className="text-[11px] font-bold text-white bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none shadow-lg"
              onClick={() => setSideCharsCollapsed(prev => !prev)}
            >
              Side Characters
              <ChevronDown className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${sideCharsCollapsed ? 'rotate-180' : ''}`} />
            </h3>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sideCharsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
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
                        isDarkBg={!sidebarBgIsLight}
                      />
                    )
                )}
              </div>
            </ScrollableSection>
            </div>
          </section>
        </div>
        </div>
      </aside>

      <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden h-full relative z-10">
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
          
          <div ref={scrollRef} onScroll={handleScroll} className="relative z-10 h-full overflow-y-auto px-6 md:px-14 lg:px-20 py-8 space-y-10 custom-scrollbar scrollbar-thin">
          {conversation?.messages.length === 0 && !streamingContent && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-6">
               <div className="w-20 h-20 rounded-full bg-ghost-white flex items-center justify-center text-4xl shadow-sm border border-ghost-white">✨</div>
               <div className="text-center max-w-sm">
                 <p className="font-black uppercase tracking-[0.2em] text-sm text-slate-300">The stage is set</p>
                 <p className="text-xs mt-2 italic text-slate-500">Waiting for your first act. You can start by typing a prompt or action below.</p>
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
            const segments = mergeByRenderedSpeaker(
              rawSegments,
              isAi,
              appData,
              userChar,
              resolveCanonicalSpeakerName
            );

            return (
              <div key={msg.id} className={`w-full animate-in fade-in slide-in-from-bottom-4 duration-500 group ${
                offsetBubbles 
                  ? `max-w-3xl ${isAi ? 'mr-auto' : 'ml-auto'}` 
                  : 'max-w-4xl mx-auto'
              }`}>
                <div className={`p-8 pt-14 pb-12 rounded-[2rem] shadow-2xl flex flex-col gap-4 transition-all relative ${
                  bubblesTransparent
                    ? 'bg-black/50'
                    : ''
                }`}
                style={!bubblesTransparent ? { backgroundColor: chatBubbleColor } : undefined}>
                  
                  {/* Action buttons - top right corner */}
                  <div className={`absolute top-4 right-4 flex items-center gap-1 transition-opacity ${
                    inlineEditingId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {inlineEditingId === msg.id ? (
                      <>
                        {/* Save (checkmark) */}
                          <button
                            onClick={handleInlineEditSave}
                            className="p-2 rounded-lg hover:bg-ghost-white text-green-400 hover:text-green-300 transition-colors"
                            aria-label="Save edited message"
                            title="Save changes"
                          >
                          <Check className="w-4 h-4" />
                        </button>
                        {/* Cancel (X) */}
                        <button
                          onClick={handleInlineEditCancel}
                          className="p-2 rounded-lg hover:bg-ghost-white text-red-500 hover:text-red-400 transition-colors"
                          aria-label="Cancel editing message"
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
                            className="p-2 rounded-lg hover:bg-ghost-white text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                            aria-label="Continue conversation"
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
                            className="p-2 rounded-lg hover:bg-ghost-white text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                            aria-label="Regenerate response"
                            title="Regenerate response"
                          >
                            <RefreshCw className={`w-4 h-4 ${regeneratingMessageId === msg.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      
                        {/* Three-dot menu - all messages */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-2 rounded-lg hover:bg-ghost-white text-slate-400 hover:text-white transition-colors"
                              aria-label="More message actions"
                              title="More message actions"
                            >
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
                          className="rounded-xl shadow-lg border border-ghost-white w-full h-auto"
                        />
                        {/* Regenerate overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                          <button
                            onClick={handleGenerateSceneImage}
                            disabled={isGeneratingImage}
                            className="p-3 bg-ghost-white rounded-lg hover:bg-ghost-white transition-colors"
                            aria-label="Generate new scene image"
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
                      ? mergeByRenderedSpeaker(
                          parseMessageSegments(formattedStreamingContent),
                          isAi,
                          appData,
                          userChar,
                          resolveCanonicalSpeakerName
                        )
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
                        segmentName = segmentChar?.name || resolveCanonicalSpeakerName(segment.speakerName) || segment.speakerName;
                        segmentAvatar = segmentChar?.avatarDataUrl || null;
                        isGenerating = Boolean(segmentChar && 'isAvatarGenerating' in segmentChar && segmentChar.isAvatarGenerating);
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
                          prevSpeakerName = resolveCanonicalSpeakerName(prevSegment.speakerName) || prevSegment.speakerName;
                        } else if (!isAi) {
                          prevSpeakerName = userChar?.name || 'You';
                        } else {
                          const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
                          prevSpeakerName = aiChars.length > 0 ? aiChars[0]?.name || 'Narrator' : 'Narrator';
                        }
                      }
                      const showAvatar = segIndex === 0 || prevSpeakerName !== segmentName;
                    
                    return (
                      <div key={segIndex} className={`relative ${segIndex > 0 && showAvatar ? 'mt-2.5 pt-2.5 border-t border-ghost-white' : ''}`}>
                        {showAvatar && (
                          <div className="float-left mr-4 mb-2 flex flex-col items-center gap-1.5 w-16">
                            <div className={`w-12 h-12 rounded-md border-2 border-ghost-white shadow-lg overflow-hidden flex items-center justify-center ${segmentAvatar ? '' : 'bg-slate-800'}`}>
                              {isGenerating ? (
                                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                              ) : segmentAvatar ? (
                                <img src={segmentAvatar} alt={segmentName} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`font-black italic text-lg ${isAi ? 'text-white/30' : 'text-blue-500/50'}`}>
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
                              onBlur={(e) => setInlineEditText(e.currentTarget.value)}
                              className="w-full min-h-[120px] text-[15px] leading-relaxed font-normal whitespace-pre-wrap outline-none rounded-md -mx-1 px-1 py-1 bg-transparent resize-y"
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
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 text-sm text-slate-400">
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
                  
                </div>
              </div>
            );
          })}

          {formattedStreamingContent && !regeneratingMessageId && (() => {
            // Parse formatted streaming content into segments for multi-speaker rendering (only for NEW messages, not regeneration)
            // Using formattedStreamingContent to prevent flickering from system tags and placeholder names
            const userChar = appData.characters.find(c => c.controlledBy === 'User') || null;
            const rawSegments = parseMessageSegments(formattedStreamingContent);
            const segments = mergeByRenderedSpeaker(rawSegments, true, appData, userChar, resolveCanonicalSpeakerName);
            
            return (
              <div className={`w-full ${offsetBubbles ? 'max-w-3xl mr-auto' : 'max-w-4xl mx-auto'}`}>
                <div className={`p-8 pt-14 pb-12 rounded-[2rem] shadow-2xl flex flex-col gap-4 ${
                    bubblesTransparent
                      ? 'bg-black/50'
                      : ''
                }`}
                style={!bubblesTransparent ? { backgroundColor: chatBubbleColor } : undefined}>
                  {segments.map((segment, segIndex) => {
                    // Look up character for this segment using session-aware lookup
                    const segmentChar = segment.speakerName 
                      ? findCharacterWithSession(segment.speakerName)
                      : (() => {
                          const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
                          return aiChars.length > 0 ? getEffectiveCharacter(aiChars[0]) : null;
                        })();
                    const segmentName = segmentChar?.name
                      || (segment.speakerName ? (resolveCanonicalSpeakerName(segment.speakerName) || segment.speakerName) : null)
                      || 'Thinking';
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
                      prevSpeakerName = prevChar?.name
                        || (prevSegment.speakerName ? (resolveCanonicalSpeakerName(prevSegment.speakerName) || prevSegment.speakerName) : null)
                        || 'Thinking';
                    }
                    const showAvatar = segIndex === 0 || prevSpeakerName !== segmentName;
                    
                    return (
                      <div key={segIndex} className={`relative ${segIndex > 0 && showAvatar ? 'mt-2.5 pt-2.5 border-t border-ghost-white' : ''}`}>
                        {showAvatar && (
                          <div className="float-left mr-4 mb-2 flex flex-col items-center gap-1.5 w-16">
                            <div className={`w-12 h-12 rounded-md border-2 border-ghost-white shadow-lg overflow-hidden flex items-center justify-center ${segmentAvatar ? '' : 'bg-slate-800 animate-pulse'}`}>
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

        <div className={`pt-3 pb-3 px-8 border-t border-[hsl(var(--ui-border))] shadow-[0_-4px_12px_rgba(0,0,0,0.15)] transition-colors relative z-20 bg-[hsl(var(--ui-surface))]`}>
          <div className="w-full max-w-7xl mx-auto space-y-3">
            {/* Quick Actions Bar - Above Input */}
            <div className="relative flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 cursor-pointer bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))]"
              >
                <Settings className="w-4 h-4" />
                Chat Settings
              </button>
              
              {/* Generate Image Button */}
              <button
                onClick={handleGenerateSceneImage}
                disabled={isGeneratingImage || !conversation?.messages?.length}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 cursor-pointer bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))] disabled:opacity-50 disabled:pointer-events-none"
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
              </button>

              <button
                onClick={() => setIsColorModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 cursor-pointer bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))]"
              >
                <Palette className="w-4 h-4" />
                Change Color
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.35)] disabled:pointer-events-none sm:ml-auto sm:w-auto ${input.trim() ? 'bg-[#4a5f7f] text-white border-[#4a5f7f] hover:bg-[#5a6f8f]' : 'bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text-muted))] opacity-50'}`}
              >
                {isStreaming ? '...' : 'Send'}
              </button>
            </div>
            
            {/* Input Area */}
            <div className="bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] rounded-2xl p-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your action or dialogue..."
                rows={3}
                spellCheck={true}
                onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                className="block w-full bg-white text-black placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none border-0 resize-none overflow-hidden focus:ring-1 focus:ring-[hsl(var(--accent-teal))]/30 transition-all"
                ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }}}
              />
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isColorModalOpen} onOpenChange={setIsColorModalOpen}>
        <DialogContent className="max-w-xl bg-[#1f222b] border border-[#3a4152] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Change Chat Colors</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#3a4152] bg-[#191c24] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Chat Background</p>
                  <p className="text-xs text-zinc-400">Color behind all message bubbles</p>
                </div>
                <div className="h-8 w-8 rounded-md border border-white/20" style={{ backgroundColor: chatCanvasColor }} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={chatCanvasColor}
                  onChange={(e) => handleChatCanvasColorInput(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-white/20 bg-transparent p-1"
                  aria-label="Chat background color"
                />
                <input
                  type="text"
                  value={chatCanvasHexInput}
                  onChange={(e) => handleChatCanvasColorInput(e.target.value)}
                  onBlur={() => setChatCanvasHexInput(chatCanvasColor)}
                  className="h-10 flex-1 rounded-md border border-white/20 bg-[#12141b] px-3 text-sm font-mono uppercase text-white"
                  placeholder="#1A1B20"
                  spellCheck={false}
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                {chatCanvasColor.toUpperCase()} • {getColorFamilyLabel(chatCanvasColor)}
              </p>
            </div>

            <div className="rounded-xl border border-[#3a4152] bg-[#191c24] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Bubble Background</p>
                  <p className="text-xs text-zinc-400">Color of the dialog bubbles</p>
                </div>
                <div className="h-8 w-8 rounded-md border border-white/20" style={{ backgroundColor: chatBubbleColor }} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={chatBubbleColor}
                  onChange={(e) => handleChatBubbleColorInput(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-white/20 bg-transparent p-1"
                  aria-label="Bubble background color"
                />
                <input
                  type="text"
                  value={chatBubbleHexInput}
                  onChange={(e) => handleChatBubbleColorInput(e.target.value)}
                  onBlur={() => setChatBubbleHexInput(chatBubbleColor)}
                  className="h-10 flex-1 rounded-md border border-white/20 bg-[#12141b] px-3 text-sm font-mono uppercase text-white"
                  placeholder="#1A1B20"
                  spellCheck={false}
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                {chatBubbleColor.toUpperCase()} • {getColorFamilyLabel(chatBubbleColor)}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => {
                handleUpdateUiSettings({ chatCanvasColor: '#1a1b20', chatBubbleColor: '#1a1b20' });
                setChatCanvasHexInput('#1a1b20');
                setChatBubbleHexInput('#1a1b20');
              }}
              className="rounded-lg border border-white/20 bg-[#2a2f3b] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#343b49]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsColorModalOpen(false)}
              className="rounded-lg border border-[#4a5f7f] bg-[#4a5f7f] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#5a7093]"
            >
              Close
            </button>
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
        onReorder={(updated) => setSidebarBackgrounds(updated)}
        onAddFromLibrary={async (imageUrl: string) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const newBg = await supabaseData.createSidebarBackground(user.id, imageUrl);
            setSidebarBackgrounds(prev => [newBg, ...prev]);
          } catch (err) {
            console.error('Failed to add from library:', err);
          }
        }}
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
        <DialogContentBare className="max-w-2xl bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none" style={{ backgroundSize: '100% 30%', backgroundRepeat: 'no-repeat' }} />
            <div className="relative flex items-center gap-2.5 px-5 py-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M8.46 8.46a5 5 0 0 0 0 7.07"/>
              </svg>
              <span className="text-[16px] font-black text-white uppercase tracking-[0.08em]">Chat Settings</span>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="ml-auto w-7 h-7 rounded-lg bg-black/25 flex items-center justify-center hover:bg-black/40 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            <div className="bg-[#2e2e33] rounded-2xl p-4 flex flex-col gap-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] max-h-[70vh] overflow-y-auto">

              {/* INTERFACE SETTINGS */}
              <div>
                <p className="text-[12px] font-black text-[#a1a1aa] uppercase tracking-[0.12em] mb-2.5">Interface Settings</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Dynamic Backgrounds */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <span className="text-[13px] font-semibold text-[#eaedf1] flex items-center gap-1.5">
                      Dynamic Backgrounds
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-[13px] h-[13px] text-blue-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
                            Backgrounds will automatically change based on the story context if scene images are tagged in the gallery.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <LabeledToggle
                      checked={appData.uiSettings?.showBackgrounds ?? false}
                      onCheckedChange={(v) => handleUpdateUiSettings({ showBackgrounds: v })}
                    />
                  </div>

                  {/* Transparent Bubbles */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <span className="text-[13px] font-semibold text-[#eaedf1]">Transparent Bubbles</span>
                    <LabeledToggle
                      checked={bubblesTransparent}
                      onCheckedChange={(v) => handleUpdateUiSettings({ transparentBubbles: v })}
                    />
                  </div>

                  {/* Offset Bubbles */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <span className="text-[13px] font-semibold text-[#eaedf1]">Offset Bubbles</span>
                    <LabeledToggle
                      checked={offsetBubbles}
                      onCheckedChange={(v) => handleUpdateUiSettings({ offsetBubbles: v })}
                    />
                  </div>

                  {/* Dynamic Text */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <span className="text-[13px] font-semibold text-[#eaedf1]">Dynamic Text</span>
                    <LabeledToggle
                      checked={dynamicText}
                      onCheckedChange={(v) => handleUpdateUiSettings({ dynamicText: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* AI BEHAVIOR */}
              <div>
                <p className="text-[12px] font-black text-[#a1a1aa] uppercase tracking-[0.12em] mb-2.5">AI Behavior</p>
                <div className="flex flex-col gap-2">

                  {/* Character Discovery + Proactive AI Mode (2-col) */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Character Discovery */}
                    <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                      <div>
                        <div className="text-[13px] font-semibold text-[#eaedf1]">Character Discovery</div>
                        <div className="text-[12px] text-[#a1a1aa] mt-0.5">AI may introduce characters from established media</div>
                      </div>
                      <LabeledToggle
                        checked={appData.uiSettings?.proactiveCharacterDiscovery !== false}
                        onCheckedChange={(v) => handleUpdateUiSettings({ proactiveCharacterDiscovery: v })}
                      />
                    </div>

                    {/* Proactive AI Mode */}
                    <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                      <div>
                        <div className="text-[13px] font-semibold text-[#eaedf1]">Proactive AI Mode</div>
                        <div className="text-[12px] text-[#a1a1aa] mt-0.5">AI drives the story forward assertively</div>
                      </div>
                      <LabeledToggle
                        checked={appData.uiSettings?.proactiveNarrative !== false}
                        onCheckedChange={(v) => handleUpdateUiSettings({ proactiveNarrative: v })}
                      />
                    </div>
                  </div>

                  {/* Narrative POV */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#eaedf1]">Narrative POV</div>
                      <div className="text-[12px] text-[#a1a1aa] mt-0.5">How AI characters narrate their actions and thoughts</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleUpdateUiSettings({ narrativePov: 'first' })}
                        className={cn(
                          "px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors border-none",
                          appData.uiSettings?.narrativePov === 'first'
                            ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                            : "bg-[#3f3f46] text-[#a1a1aa]"
                        )}
                      >
                        1st Person
                      </button>
                      <button
                        onClick={() => handleUpdateUiSettings({ narrativePov: 'third' })}
                        className={cn(
                          "px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors border-none",
                          (appData.uiSettings?.narrativePov || 'third') === 'third'
                            ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                            : "bg-[#3f3f46] text-[#a1a1aa]"
                        )}
                      >
                        3rd Person
                      </button>
                    </div>
                  </div>

                  {/* NSFW Intensity */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#eaedf1]">NSFW Intensity</div>
                      <div className="text-[12px] text-[#a1a1aa] mt-0.5">How proactively AI engages in mature content</div>
                    </div>
                    <LabeledToggle
                      checked={appData.uiSettings?.nsfwIntensity === 'high'}
                      onCheckedChange={(v) => handleUpdateUiSettings({ nsfwIntensity: v ? 'high' : 'normal' })}
                      offLabel="Normal"
                      onLabel="High"
                    />
                  </div>

                  {/* Response Detail */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#eaedf1]">Response Detail</div>
                      <div className="text-[12px] text-[#a1a1aa] mt-0.5">Controls description length and sensory depth</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {(['concise', 'balanced', 'detailed'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => handleUpdateUiSettings({ responseVerbosity: level })}
                          className={cn(
                            "px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors capitalize border-none",
                            (appData.uiSettings?.responseVerbosity || 'balanced') === level
                              ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                              : "bg-[#3f3f46] text-[#a1a1aa]"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Realism Mode */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#eaedf1]">Realism Mode</div>
                      <div className="text-[12px] text-[#a1a1aa] mt-0.5">Physical actions have realistic consequences</div>
                    </div>
                    <LabeledToggle
                      checked={appData.uiSettings?.realismMode === true}
                      onCheckedChange={(v) => handleUpdateUiSettings({ realismMode: v })}
                    />
                  </div>

                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* TIME PROGRESSION */}
              <div>
                <p className="text-[12px] font-black text-[#a1a1aa] uppercase tracking-[0.12em] mb-1">Time Progression</p>
                <p className="text-[12px] text-[#a1a1aa] mb-2.5">Automatically advance the time of day while in a chat session</p>
                <div className="flex flex-col gap-2">
                  {/* Time Mode Toggle */}
                  <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#eaedf1]">Time Mode</div>
                      <div className="text-[12px] text-[#a1a1aa] mt-0.5">Advance time phases automatically on a timer</div>
                    </div>
                    <LabeledToggle
                      checked={timeProgressionMode === 'automatic'}
                      onCheckedChange={(v) => handleTimeProgressionChange(v ? 'automatic' : 'manual')}
                      offLabel="Manual"
                      onLabel="Automatic"
                    />
                  </div>

                  {/* Interval Dropdown (only when Automatic) */}
                  {timeProgressionMode === 'automatic' && (
                    <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                      <div>
                        <div className="text-[13px] font-semibold text-[#eaedf1]">Advance Every</div>
                        <div className="text-[12px] text-[#a1a1aa] mt-0.5">How often the time of day changes</div>
                      </div>
                      <select
                        value={timeProgressionInterval}
                        onChange={(e) => handleTimeProgressionChange('automatic', Number(e.target.value))}
                        className="bg-[#1c1c1f] border border-black/35 rounded-lg text-[12px] font-bold text-white px-3 py-1.5 focus:outline-none focus:border-blue-500"
                      >
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* ADMIN DEBUG EXPORT */}
              {isAdmin && (
                <>
                  <div className="h-px bg-white/5" />
                  <div>
                    <p className="text-[12px] font-black text-[#a1a1aa] uppercase tracking-[0.12em] mb-1">Admin</p>
                    <p className="text-[12px] text-[#a1a1aa] mb-2.5">Debug tools for conversation analysis</p>
                    <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (!conversation) return;
                        const allChars = [
                          ...appData.characters.map(c => ({ name: c.name, control: c.controlledBy })),
                          ...appData.sideCharacters.map(c => ({ name: c.name, control: c.controlledBy }))
                        ];
                        const userChars = allChars.filter(c => c.control === 'User').map(c => c.name);
                        const aiChars = allChars.filter(c => c.control === 'AI').map(c => c.name);

                        const lines: string[] = [];
                        const scenarioTitle = appData.world?.core?.scenarioName || 'Untitled';
                        const convTitle = conversation.title || 'Untitled Conversation';
                        const exportDate = new Date().toISOString().slice(0, 16).replace('T', ' ');

                        lines.push(`# Session Log — ${scenarioTitle}`);
                        lines.push(`**Conversation:** ${convTitle}`);
                        lines.push(`**Characters:** ${userChars.map(n => `${n} (User)`).join(', ')}${userChars.length && aiChars.length ? ', ' : ''}${aiChars.map(n => `${n} (AI)`).join(', ')}`);
                        lines.push(`**Model:** ${modelId}`);
                        lines.push(`**Exported:** ${exportDate}`);
                        lines.push(`**Messages:** ${conversation.messages.length}`);
                        lines.push('');
                        lines.push('---');
                        lines.push('');

                        const continueSet = new Set(continueEventsRef.current.map(e => e.messageId));
                        const regenSet = new Set(regenerateEventsRef.current.map(e => e.messageId));

                        let lastDay: number | undefined;
                        let lastTime: string | undefined;

                        for (const msg of conversation.messages) {
                          if (msg.role === 'system') continue;

                          // Day/time markers
                          if (msg.day !== lastDay || (msg.timeOfDay || '') !== lastTime) {
                            if (msg.day !== undefined || msg.timeOfDay) {
                              lines.push(`#### Day ${msg.day ?? '?'} — ${msg.timeOfDay ? msg.timeOfDay.charAt(0).toUpperCase() + msg.timeOfDay.slice(1) : '?'}`);
                              lines.push('');
                            }
                            lastDay = msg.day;
                            lastTime = msg.timeOfDay || '';
                          }

                          // Speaker attribution
                          if (msg.role === 'user') {
                            lines.push(`### ${userChars[0] || 'User'}`);
                          } else {
                            // Try to detect which AI character is speaking from the message text
                            const speakerName = aiChars.find(name => msg.text.startsWith(`*${name}`) || msg.text.includes(`${name} `)) || aiChars[0] || 'AI';
                            lines.push(`### ${speakerName} (AI)`);
                          }
                          lines.push(msg.text);
                          lines.push('');

                          // Action annotations
                          if (regenSet.has(msg.id)) {
                            lines.push('> 🔄 REGENERATE triggered on this message');
                            lines.push('');
                          }
                          if (continueSet.has(msg.id)) {
                            lines.push('> ⚡ CONTINUE triggered after this message');
                            lines.push('');
                          }
                        }

                        // Download
                        const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `session-log-${convTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#3c3e47] hover:bg-[#4a4c55] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[13px] font-semibold text-[#eaedf1] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download Session Log
                    </button>

                    <button
                      onClick={() => {
                        // Build exact same data the LLM would receive
                        const llmAppData = buildLLMAppData();
                        const systemInstruction = getSystemInstruction(
                          llmAppData,
                          currentDay,
                          currentTimeOfDay,
                          memories,
                          memoriesEnabled,
                          activeScene
                        );
                        
                        // Verbosity and max_tokens (exact same mapping as llm.ts)
                        const verbosity = llmAppData.uiSettings?.responseVerbosity || 'balanced';
                        const maxTokensByVerbosity: Record<string, number> = { concise: 1024, balanced: 2048, detailed: 3072 };
                        const maxTokens = maxTokensByVerbosity[verbosity] || 2048;
                        
                        // Anti-loop directive (current state)
                        const antiLoopDirective = getAntiLoopDirective();
                        
                        
                        // Length directive (current state)
                        const lengthDirective = getLengthDirective();
                        
                        // Style hint pool
                        const hintMap: Record<string, string[]> = { concise: conciseStyleHints, balanced: balancedStyleHints, detailed: detailedStyleHints };
                        const activeHints = hintMap[verbosity] || balancedStyleHints;
                        
                        const exportDate = new Date().toISOString().slice(0, 16).replace('T', ' ');
                        const lines: string[] = [];
                        
                        lines.push('# Master Prompt Snapshot');
                        lines.push(`**Model:** ${modelId}`);
                        lines.push(`**Verbosity:** ${verbosity} → max_tokens: ${maxTokens}`);
                        lines.push(`**Temperature:** 0.9 (hardcoded in edge function)`);
                        lines.push(`**Stream:** true`);
                        lines.push(`**Session Message Count:** ${sessionMessageCountRef.current}`);
                        lines.push(`**Exported:** ${exportDate}`);
                        lines.push('');
                        lines.push('---');
                        lines.push('');
                        lines.push('## System Instruction (verbatim)');
                        lines.push('');
                        lines.push(systemInstruction);
                        lines.push('');
                        lines.push('---');
                        lines.push('');
                        lines.push('## Runtime Parameters');
                        lines.push('');
                        
                        // Anti-loop directive
                        lines.push('### Anti-Loop Directive (current)');
                        lines.push('');
                        lines.push(antiLoopDirective || 'None — no patterns detected');
                        lines.push('');
                        
                        
                        // Length directive
                        lines.push('### Length Directive (current)');
                        lines.push('');
                        lines.push(lengthDirective || 'None — response lengths are varied');
                        lines.push('');
                        
                        // Style hint pool
                        lines.push(`### Style Hint Pool (${verbosity} mode)`);
                        lines.push('');
                        lines.push('One of these is randomly appended to each user message:');
                        lines.push('');
                        for (const hint of activeHints) {
                          lines.push(`- ${hint}`);
                        }
                        lines.push('');
                        
                        // Regeneration directive
                        lines.push('### Regeneration Directive (fixed template, appended on regenerate)');
                        lines.push('');
                        lines.push(REGENERATION_DIRECTIVE_TEXT);
                        lines.push('');
                        
                        // Session message format
                        lines.push('### Session Message Format');
                        lines.push('');
                        lines.push('Prepended to every user message:');
                        lines.push('`[SESSION: Message {N} of current session]`');
                        lines.push('');
                        
                        // Runtime directives injection format
                        lines.push('### Runtime Directives Injection');
                        lines.push('');
                        lines.push('When anti-loop directives are active, they are injected as a separate system message:');
                        lines.push('```');
                        lines.push('{ role: "system", content: "RUNTIME DIRECTIVES (HIGH PRIORITY — follow these for THIS response only):\\n[directives]" }');
                        lines.push('```');
                        lines.push('');
                        
                        // Download
                        const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const scenarioTitle = appData.world?.core?.scenarioName || 'untitled';
                        a.download = `master-prompt-${scenarioTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#3c3e47] hover:bg-[#4a4c55] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[13px] font-semibold text-[#eaedf1] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                      Download Master Prompt
                    </button>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </DialogContentBare>
      </Dialog>
      
      {/* Delete Character Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setCharacterToDelete(null);
        }}
        onConfirm={confirmDeleteCharacter}
        title="Delete Character"
        message="Are you sure you want to delete this character? This cannot be undone."
      />
    </div>
  );
};

export default ChatInterfaceTab;
