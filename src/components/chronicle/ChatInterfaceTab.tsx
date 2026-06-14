import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScenarioData, Character, CharacterStateMessageSnapshot, CharacterStateSnapshotPayload, Conversation, Message, CharacterTraitSection, Scene, TimeOfDay, SideCharacter, SideCharacterMessageSnapshot, SideCharacterStateSnapshotPayload, CharacterSessionState, Memory, WorldCore, StoryGoal, GoalFlexibility, StoryGoalStepDerivation, FieldChangeMetadataMap, GoalAlignmentEvaluation, GoalAlignmentState } from '../../types';
import { Button, TextArea } from './UI';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { isTaskLevelGoalText, parseExtractedGoalUpdateValue } from '@/lib/goal-state-guard';
import {
  applyGoalAlignmentEvaluation,
  buildGoalAlignmentKey,
  formatGoalAlignmentChange,
  normalizeGoalAlignmentState,
  shouldRenderGoalToWriter,
} from '@/lib/goal-alignment';
import { analyzeAssistantCandidateStyle, analyzeRecentAssistantStyle, type AssistantStyleTelemetry } from '@/lib/assistant-style-directive';
import { uid, now, uuid } from '@/utils';
import {
  ContentFilteredChatError,
  buildEstablishedFactNote,
  isLocalRoleplayNoticeMessage,
  renderGoalMilestoneTarget,
} from '../../services/llm';
import { RefreshCw, MoreVertical, Copy, Pencil, Trash2, ChevronUp, ChevronDown, Sunrise, Sun, Sunset, Moon, Loader2, StepForward, Settings, Image as ImageIcon, Brain, Check, X, Info, Play, Pause, Move, Palette, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import type { PlaceholderNameMap } from '@/services/placeholder-name-guard';
import { SideCharacterCard } from './SideCharacterCard';
import { CharacterEditModal, CharacterEditDraft } from './CharacterEditModal';
import { ScrollableSection } from './ScrollableSection';
import { SidebarThemeModal } from './SidebarThemeModal';
import { MemoriesModal } from './MemoriesModal';
import { MemoryQuickSaveButton } from './MemoryQuickSaveButton';
import { ChatSpellcheckTextarea } from './ChatSpellcheckTextarea';
import {
  UserBackground,
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
  defaultSideCharacterPersonality,
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
import {
  CHAT_DEBUG_ISSUE_TAGS,
  normalizeDialogDebugTags,
  type ChatDebugIssueTag,
  type ChatDebugRequestRecord,
  type ChatDebugTrace,
  type DialogDebugComment,
} from '@/features/chat-debug/types';
import {
  buildDialogDebugCommentKey,
} from '@/features/chat-debug/storage';
import {
  buildChatReviewHtml,
  slugifyReviewExportFilePart,
} from '@/features/chat-debug/review-export';
import {
  buildSupportCallDebugStatus,
  splitEdgeDebugPayload,
} from '@/features/chat-runtime/debug-support';
import { usePostTurnSupportQueue } from '@/features/chat-runtime/use-post-turn-support-queue';
import {
  buildContentFilterNoticeMessage,
  buildProviderErrorNoticeMessage,
} from '@/features/chat-runtime/local-notices';
import {
  buildExportDialogDebugComments,
  dialogDebugCommentsEqual,
  loadDialogDebugComments,
  mergeDialogDebugComments,
  saveDialogDebugComments,
  stripDialogDebugCommentsForMessage,
} from '@/features/chat-runtime/dialog-debug-comments';
import {
  buildSceneImageCharacterData,
  mergeGeneratedProfileSection,
  sanitizeGeneratedSideCharacterProfile,
} from '@/features/chat-runtime/side-character-profile';
import {
  FormattedMessage,
  InlineFormattedMessageEditor,
} from '@/features/chat-runtime/message-formatting';
import { sanitizeAssistantMessageText } from '@/features/chat-runtime/message-formatting-utils';
import {
  buildEditableMessageSegments,
  buildInlineEditedMessageText,
  extractHiddenMessageTags,
  mergeByRenderedSpeaker,
} from '@/features/chat-runtime/speaker-resolution';
import {
  avatarNaturalSizeCache,
  CHAT_SIDEBAR_WIDTH,
  CHAT_TILE_HEIGHT,
  CHAT_TILE_WIDTH,
  clampPercent,
  mapObjectPositionFromPreviewToTile,
  mapTilePositionToPreview,
  type Size2D,
} from '@/features/chat-runtime/avatar-position';
import {
  getColorFamilyLabel,
  normalizeHexColor,
  tryNormalizeHexColor,
} from '@/features/chat-runtime/chat-colors';
import {
  applyCharacterSnapshot,
  applySideCharacterSnapshot,
  buildActiveCharacterSnapshotMap,
  buildActiveGoalAlignmentMap,
  buildActiveGoalCompletionIds,
  buildActiveMemories,
  buildActiveSideCharacterSnapshotMap,
  buildEffectiveWorldCore,
  buildMessageGenerationMap,
  upsertCharacterStateMessageSnapshot,
  upsertSideCharacterStateMessageSnapshot,
} from '@/features/chat-runtime/effective-state';
import { useChatDebugTrace } from '@/features/chat-runtime/use-chat-debug-trace';
import { TypingIndicatorBubble } from '@/components/chronicle/chat/TypingIndicatorBubble';
import {
  collectRoleplayResponse,
  readRoleplayRequestDebugFromError,
} from '@/features/chat-runtime/collect-roleplay-response';

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
    dynamicText?: boolean;
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

type ActionEvent = { messageId: string; generationId?: string; timestamp: number };

const TIME_SEQUENCE: TimeOfDay[] = ['sunrise', 'day', 'sunset', 'night'];
const GOAL_ALIGNMENT_SHADOW_MODE = true;

const DIALOG_DEBUG_ENABLED_STORAGE_KEY = 'chronicle_dialog_debug_enabled_v1';

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
  const [inlineEditSegments, setInlineEditSegments] = useState<MessageSegment[]>([]);
  const [inlineEditSystemTags, setInlineEditSystemTags] = useState<string[]>([]);
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
  const [characterStateSnapshots, setCharacterStateSnapshots] = useState<CharacterStateMessageSnapshot[]>([]);
  const [sideCharacterSnapshots, setSideCharacterSnapshots] = useState<SideCharacterMessageSnapshot[]>([]);
  const characterStateSnapshotsRef = useRef<CharacterStateMessageSnapshot[]>([]);
  const sideCharacterSnapshotsRef = useRef<SideCharacterMessageSnapshot[]>([]);
  const [goalStepDerivations, setGoalStepDerivations] = useState<StoryGoalStepDerivation[]>([]);
  const [goalAlignmentStates, setGoalAlignmentStates] = useState<GoalAlignmentState[]>([]);
  const [canonicalDerivationsLoaded, setCanonicalDerivationsLoaded] = useState(false);
  const [canonicalDerivationsLoadError, setCanonicalDerivationsLoadError] = useState<string | null>(null);

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
  const {
    chatDebugTraceStoreRef,
    saveChatDebugTrace,
    recordChatDebugSupportCall,
  } = useChatDebugTrace({ scenarioId, conversationId, isAdmin });
  const [dialogDebugEnabled, setDialogDebugEnabled] = useState(false);
  const [dialogDebugComments, setDialogDebugComments] = useState<Record<string, DialogDebugComment>>({});
  const [activeDialogDebugMessage, setActiveDialogDebugMessage] = useState<Message | null>(null);
  const [dialogDebugDraft, setDialogDebugDraft] = useState('');
  const [dialogDebugTagDraft, setDialogDebugTagDraft] = useState<ChatDebugIssueTag[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      setDialogDebugEnabled(false);
      setDialogDebugComments({});
      return;
    }

    const currentConversation = appData.conversations.find((entry) => entry.id === conversationId);
    const localComments = loadDialogDebugComments(
      scenarioId,
      conversationId,
      currentConversation?.messages || [],
    );

    try {
      setDialogDebugEnabled(window.localStorage.getItem(DIALOG_DEBUG_ENABLED_STORAGE_KEY) === 'true');
    } catch {
      setDialogDebugEnabled(false);
    }
    setDialogDebugComments(localComments);

    if (!user?.id) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const remoteComments = await supabaseData.fetchConversationDialogDebugComments(conversationId);
        if (cancelled) return;

        const mergedComments = mergeDialogDebugComments(remoteComments, localComments);
        setDialogDebugComments(mergedComments);

        if (!dialogDebugCommentsEqual(localComments, mergedComments)) {
          saveDialogDebugComments(scenarioId, conversationId, mergedComments);
        }

        if (!dialogDebugCommentsEqual(remoteComments, mergedComments)) {
          await supabaseData.upsertConversationDialogDebugComments({
            conversationId,
            userId: user.id,
            comments: Object.values(mergedComments),
          });
        }
      } catch (error) {
        console.error('[dialogDebugComments] Failed to load persisted playthrough notes:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appData.conversations, conversationId, isAdmin, scenarioId, user?.id]);

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
  const conversation = appData.conversations.find(c => c.id === conversationId);
  const exportDialogDebugComments = useMemo(
    () => buildExportDialogDebugComments(dialogDebugComments, conversation?.messages || []),
    [conversation?.messages, dialogDebugComments],
  );

  const buildAssistantStyleTelemetryCall = useCallback((
    source: 'send' | 'regenerate' | 'continue',
    recentTelemetry: AssistantStyleTelemetry,
    candidateTelemetry: AssistantStyleTelemetry,
  ): ChatDebugRequestRecord | null => {
    if (!isAdmin) return null;

    return {
      id: `local.assistant-style-telemetry.${source}.${Date.now()}`,
      label: `Local assistant style telemetry - ${source}`,
      apiCallGroup: 'support',
      endpoint: 'local://assistant-style-telemetry',
      method: 'LOCAL',
      capturedAt: Date.now(),
      status: 'completed',
      requestBody: {
        source,
        diagnosticOnly: true,
        grokFacing: false,
      },
      responseBody: {
        recentTelemetry,
        candidateTelemetry,
        summary: 'Detector telemetry only. This was not sent to Grok/xAI and did not trigger a hidden retry or alter the visible response.',
      },
      notes: [
        'Style and repetition detectors now run as local debug telemetry only.',
        'Chronicle commits the first completed API Call 1 draft unless the provider request itself fails.',
      ],
    };
  }, [isAdmin]);

  const appendContentFilterNotice = useCallback((
    baseConversations: Conversation[],
    error: ContentFilteredChatError,
    trace: ChatDebugTrace | null,
    call1Request?: ChatDebugRequestRecord | null,
  ) => {
    const noticeMessage = buildContentFilterNoticeMessage(error.message, currentDay, currentTimeOfDay);
    const nextConversations = baseConversations.map(c =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, noticeMessage], updatedAt: now() }
        : c
    );

    latestConversationsRef.current = nextConversations;
    onUpdate(nextConversations);
    onSaveScenario(nextConversations);
    saveChatDebugTrace(
      noticeMessage,
      trace,
      call1Request ? { ...call1Request, status: 'error', error: error.message } : null,
    );

    return nextConversations;
  }, [conversationId, currentDay, currentTimeOfDay, onSaveScenario, onUpdate, saveChatDebugTrace]);

  const appendProviderErrorNotice = useCallback((
    baseConversations: Conversation[],
    message: string,
    trace: ChatDebugTrace | null,
    call1Request?: ChatDebugRequestRecord | null,
  ) => {
    const noticeMessage = buildProviderErrorNoticeMessage(message, currentDay, currentTimeOfDay);
    const nextConversations = baseConversations.map(c =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, noticeMessage], updatedAt: now() }
        : c
    );

    latestConversationsRef.current = nextConversations;
    onUpdate(nextConversations);
    onSaveScenario(nextConversations);
    saveChatDebugTrace(
      noticeMessage,
      trace,
      call1Request ? { ...call1Request, status: 'error', error: message } : null,
    );

    return nextConversations;
  }, [conversationId, currentDay, currentTimeOfDay, onSaveScenario, onUpdate, saveChatDebugTrace]);

  const latestMessageGenerationMap = useMemo(() => {
    return buildMessageGenerationMap(conversation?.messages || []);
  }, [conversation?.messages]);

  const activeGoalCompletionIds = useMemo(() => {
    return buildActiveGoalCompletionIds(
      goalStepDerivations.filter((derivation) => derivation.conversationId === conversationId),
      latestMessageGenerationMap,
    );
  }, [conversationId, goalStepDerivations, latestMessageGenerationMap]);

  const activeGoalAlignmentMap = useMemo(() => {
    if (GOAL_ALIGNMENT_SHADOW_MODE) {
      return new Map<string, GoalAlignmentState>();
    }

    return buildActiveGoalAlignmentMap(
      goalAlignmentStates.filter((entry) => entry.conversationId === conversationId),
      latestMessageGenerationMap,
    );
  }, [conversationId, goalAlignmentStates, latestMessageGenerationMap]);

  const canUseCanonicalChatState = canonicalDerivationsLoaded && !canonicalDerivationsLoadError;

  const activeMemories = useMemo(() => {
    return buildActiveMemories(
      memories.filter((memory) => memory.conversationId === conversationId),
      latestMessageGenerationMap,
    );
  }, [conversationId, memories, latestMessageGenerationMap]);

  // Build effective world core by merging base with session overrides and canonical goal derivations.
  const effectiveWorldCore = useMemo((): WorldCore => {
    return buildEffectiveWorldCore({
      baseCore: appData.world.core,
      worldCoreSessionOverrides,
      activeGoalAlignmentMap,
      activeGoalCompletionIds,
    });
  }, [activeGoalAlignmentMap, activeGoalCompletionIds, appData.world.core, worldCoreSessionOverrides]);

  const exportPostTurnStateChanges = useMemo((): Record<string, string[]> => {
    const changes: Record<string, string[]> = {};
    const append = (messageId: string, text: string) => {
      if (!changes[messageId]) changes[messageId] = [];
      changes[messageId].push(text);
    };
    const formatClock = (day: number | null | undefined, timeOfDay: TimeOfDay | null | undefined) => (
      day != null || timeOfDay ? `Day ${day ?? '?'}, ${timeOfDay ?? 'unknown'}` : 'story time unknown'
    );
    const mainNameById = new Map(appData.characters.map((character) => [character.id, character.name]));
    const sideNameById = new Map((appData.sideCharacters || []).map((character) => [character.id, character.name]));

    for (const snapshot of characterStateSnapshots.filter((entry) => entry.conversationId === conversationId)) {
      if (latestMessageGenerationMap.get(snapshot.sourceMessageId) !== snapshot.sourceGenerationId) continue;
      const characterName = mainNameById.get(snapshot.characterId) || 'Unknown character';
      for (const metadata of Object.values(snapshot.statePayload._fieldChangeMetadata || {})) {
        if (metadata.sourceMessageId !== snapshot.sourceMessageId || metadata.sourceGenerationId !== snapshot.sourceGenerationId) continue;
        append(
          snapshot.sourceMessageId,
          `${characterName}.${metadata.fieldPath} updated at ${formatClock(metadata.storyDay, metadata.timeOfDay)}${metadata.nextValuePreview ? ` -> ${metadata.nextValuePreview}` : ''}`,
        );
      }
    }

    for (const snapshot of sideCharacterSnapshots.filter((entry) => entry.conversationId === conversationId)) {
      if (latestMessageGenerationMap.get(snapshot.sourceMessageId) !== snapshot.sourceGenerationId) continue;
      const characterName = sideNameById.get(snapshot.sideCharacterId) || 'Unknown side character';
      for (const metadata of Object.values(snapshot.statePayload._fieldChangeMetadata || {})) {
        if (metadata.sourceMessageId !== snapshot.sourceMessageId || metadata.sourceGenerationId !== snapshot.sourceGenerationId) continue;
        append(
          snapshot.sourceMessageId,
          `${characterName}.${metadata.fieldPath} updated at ${formatClock(metadata.storyDay, metadata.timeOfDay)}${metadata.nextValuePreview ? ` -> ${metadata.nextValuePreview}` : ''}`,
        );
      }
    }

    const goalMap = new Map(effectiveWorldCore.storyGoals?.map((goal) => [goal.id, goal]) || []);
    for (const derivation of goalStepDerivations.filter((entry) => entry.conversationId === conversationId)) {
      if (latestMessageGenerationMap.get(derivation.sourceMessageId) !== derivation.sourceGenerationId) continue;
      if (!derivation.completed) continue;
      const goal = goalMap.get(derivation.goalId);
      const step = goal?.steps?.find((entry) => entry.id === derivation.stepId);
      append(
        derivation.sourceMessageId,
        `Story goal step completed at ${formatClock(derivation.day, derivation.timeOfDay)}: ${goal?.title || derivation.goalId}${step?.description ? ` -> ${step.description}` : ''}`,
      );
    }

    const characterGoalLabelMap = new Map<string, string>();
    for (const character of appData.characters) {
      for (const goal of character.goals || []) {
        characterGoalLabelMap.set(
          buildGoalAlignmentKey('character', goal.id, character.id),
          `${character.name} goal "${goal.title}"`,
        );
      }
    }
    for (const state of goalAlignmentStates.filter((entry) => entry.conversationId === conversationId)) {
      if (!state.sourceMessageId) continue;
      if (state.sourceGenerationId && latestMessageGenerationMap.get(state.sourceMessageId) !== state.sourceGenerationId) continue;
      const normalized = normalizeGoalAlignmentState(state);
      const label = normalized.goalKind === 'story'
        ? `Story goal "${goalMap.get(normalized.goalId)?.title || normalized.goalId}"`
        : characterGoalLabelMap.get(buildGoalAlignmentKey('character', normalized.goalId, normalized.characterId)) || `Character goal "${normalized.goalId}"`;
      append(
        state.sourceMessageId,
        formatGoalAlignmentChange(normalized, label),
      );
    }

    for (const memory of memories.filter((entry) => entry.conversationId === conversationId && entry.sourceMessageId)) {
      if (memory.sourceGenerationId && latestMessageGenerationMap.get(memory.sourceMessageId!) !== memory.sourceGenerationId) continue;
      append(
        memory.sourceMessageId!,
        `Memory ${memory.entryType || 'entry'} saved at ${formatClock(memory.day, memory.timeOfDay)}: ${memory.content}`,
      );
    }

    return changes;
  }, [
    appData.characters,
    appData.sideCharacters,
    characterStateSnapshots,
    conversationId,
    effectiveWorldCore.storyGoals,
    goalAlignmentStates,
    goalStepDerivations,
    latestMessageGenerationMap,
    memories,
    sideCharacterSnapshots,
  ]);

  // Persistent map for placeholder name replacements (ensures consistency across the conversation)
  const placeholderMapRef = useRef<PlaceholderNameMap>({});

  // Issue #7: Response tracking for local style telemetry
  const responseLengthsRef = useRef<number[]>([]);
  const getAssistantResponseLengths = (messages: Message[]) => {
    return messages
      .filter((message) => message.role === 'assistant' && message.text?.trim() && !isLocalRoleplayNoticeMessage(message))
      .slice(-10)
      .map((message) => message.text.trim().split(/\s+/).length)
      .filter((wordCount) => wordCount > 0);
  };
  const syncAssistantResponseLengths = (messages: Message[]) => {
    responseLengthsRef.current = getAssistantResponseLengths(messages);
  };
  const filterRoleplayMessagesForStyleEvidence = (messages: Message[]) => {
    return messages.filter((message) => !isLocalRoleplayNoticeMessage(message));
  };
  // Issue #7 + #10: Session message counter for precise session depth awareness
  const sessionMessageCountRef = useRef<number>(0);
  // Issue #6B: Track previous day for compression trigger
  const previousDayRef = useRef<number>(currentDay);
  const latestConversationsRef = useRef(appData.conversations);

  useEffect(() => {
    currentDayRef.current = currentDay;
  }, [currentDay]);

  // Reset session tracking when conversation changes
  useEffect(() => {
    responseLengthsRef.current = [];
    sessionMessageCountRef.current = 0;
    previousDayRef.current = currentDayRef.current;
    placeholderMapRef.current = {};
    continueEventsRef.current = [];
    setWorldCoreSessionOverrides(null);
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

  // Ref to always hold current sideCharacters - avoids stale closure in async callbacks
  const sideCharactersRef = useRef<SideCharacter[]>(appData.sideCharacters || []);
  useEffect(() => {
    sideCharactersRef.current = appData.sideCharacters || [];
  }, [appData.sideCharacters]);

  // Load session states on mount - DEFERRED to not block first render
  useEffect(() => {
    // Skip loading if we're in the "loading" state (waiting for scenario data)
    if (conversationId === "loading") return;

    let isCancelled = false;
    setSessionStates([]);
    setSessionStatesLoaded(false);

    // Use requestAnimationFrame to defer non-critical data loading
    // This allows the UI shell to render first
    const frameId = requestAnimationFrame(() => {
      supabaseData.fetchSessionStates(conversationId).then(states => {
        if (isCancelled) return;
        setSessionStates(states);
        setSessionStatesLoaded(true);
      }).catch(err => {
        if (isCancelled) return;
        console.error('Failed to load session states:', err);
        setSessionStatesLoaded(true);
      });
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [conversationId]);

  useEffect(() => {
    if (conversationId === "loading") return;

    let isCancelled = false;
    characterStateSnapshotsRef.current = [];
    sideCharacterSnapshotsRef.current = [];
    setCharacterStateSnapshots([]);
    setSideCharacterSnapshots([]);
    setGoalStepDerivations([]);
    setGoalAlignmentStates([]);
    setCanonicalDerivationsLoaded(false);
    setCanonicalDerivationsLoadError(null);

    const frameId = requestAnimationFrame(() => {
      Promise.all([
        supabaseData.fetchCharacterStateMessageSnapshots(conversationId),
        supabaseData.fetchSideCharacterMessageSnapshots(conversationId),
        supabaseData.fetchStoryGoalStepDerivations(conversationId),
        supabaseData.fetchGoalAlignmentStates(conversationId),
      ]).then(([snapshots, sideSnapshots, derivations, alignmentStates]) => {
        if (isCancelled) return;
        characterStateSnapshotsRef.current = snapshots;
        sideCharacterSnapshotsRef.current = sideSnapshots;
        setCharacterStateSnapshots(snapshots);
        setSideCharacterSnapshots(sideSnapshots);
        setGoalStepDerivations(derivations);
        setGoalAlignmentStates(alignmentStates);
        setCanonicalDerivationsLoadError(null);
        setCanonicalDerivationsLoaded(true);
      }).catch(err => {
        if (isCancelled) return;
        console.error('Failed to load canonical chat derivations:', err);
        setCanonicalDerivationsLoadError('Could not load canonical chat state. Refresh before generating another response.');
        setCanonicalDerivationsLoaded(false);
      });
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frameId);
    };
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

    let isCancelled = false;
    setMemories([]);
    setMemoriesLoaded(false);

    const frameId = requestAnimationFrame(() => {
      supabaseData.fetchMemories(conversationId).then(mems => {
        if (isCancelled) return;
        setMemories(mems);
        setMemoriesLoaded(true);
      }).catch(err => {
        if (isCancelled) return;
        console.error('Failed to load memories:', err);
        setMemoriesLoaded(true);
      });
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [conversationId]);

  // Issue #6B: Day-transition compression -- compress bullet memories when day increments
  // Memory CRUD handlers
  const handleCreateMemory = useCallback(async (
    content: string,
    day: number | null,
    timeOfDay: TimeOfDay | null,
    sourceMessageId?: string,
    sourceGenerationId?: string,
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
      sourceGenerationId,
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
      const bulletMemories = activeMemories.filter(
        m => m.day === completedDay && m.entryType === 'bullet'
      );
      if (bulletMemories.length === 0) return;

      const bullets = bulletMemories.map(m => m.content);
      const compressionSourceMessage = conversation?.messages
        .filter((message) => message.role === 'assistant' && !isLocalRoleplayNoticeMessage(message))
        .slice(-1)[0];
      const requestBody = { bullets, day: completedDay, conversationId, debugTrace: isAdmin };

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

      recordChatDebugSupportCall(compressionSourceMessage, {
        id: 'call2.memory-compress',
        label: 'Supporting Call - Day memory compression',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/compress-day-memories',
        method: 'POST',
        capturedAt: Date.now(),
        status: 'sent',
        requestBody,
      });

      supabase.functions.invoke('compress-day-memories', {
        body: requestBody
      }).then(async ({ data, error }) => {
        const compressionDebug = splitEdgeDebugPayload(data);
        const compressionDebugStatus = buildSupportCallDebugStatus(error, compressionDebug.responseBody);
        recordChatDebugSupportCall(compressionSourceMessage, {
          id: 'call2.memory-compress',
          label: 'Supporting Call - Day memory compression',
          apiCallGroup: 'call_2',
          endpoint: '/functions/v1/compress-day-memories',
          method: 'POST',
          capturedAt: Date.now(),
          status: compressionDebugStatus.status,
          error: compressionDebugStatus.error,
          requestBody,
          responseBody: compressionDebug.responseBody,
          modelRequest: compressionDebug.modelRequest,
          modelRequests: compressionDebug.modelRequests,
        });

        const compressionResponseBody = compressionDebug.responseBody as { synopsis?: unknown } | null | undefined;
        const synopsis = typeof compressionResponseBody?.synopsis === 'string'
          ? compressionResponseBody.synopsis
          : '';
        if (!error && synopsis) {
          void trackAiUsageEvent({
            eventType: 'memory_bullets_compressed',
            eventSource: 'chat-interface',
            count: bulletMemories.length,
            metadata: {
              conversationId,
              day: completedDay,
              outputChars: synopsis.length,
            },
          });
          await handleCreateMemory(synopsis, completedDay, null, undefined, undefined, 'synopsis');
          for (const bm of bulletMemories) {
            await handleDeleteMemory(bm.id);
          }
        }
      }).catch(err => {
        console.error('[Day compression] Failed:', err);
      });
    }
  }, [activeMemories, currentDay, memoriesEnabled, memoriesLoaded, conversation?.messages, conversationId, isAdmin, modelId, handleCreateMemory, handleDeleteMemory, recordChatDebugSupportCall]);

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

// Helper to get effective character (base + stable session overrides + canonical message-scoped snapshots)
  const getManualSessionCharacter = useCallback((baseChar: Character): Character & { previousNames?: string[] } => {
    const sessionState = sessionStates.find(s => s.conversationId === conversationId && s.characterId === baseChar.id);
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
    const effectiveSections =
      Array.isArray(sessionState.customSections) && sessionState.customSections.length > 0
        ? sessionState.customSections
        : (baseChar.sections || []);

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
      sections: effectiveSections,
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
  }, [conversationId, sessionStates]);

  const activeCharacterSnapshotMap = useMemo(
    () => buildActiveCharacterSnapshotMap(
      characterStateSnapshots.filter((snapshot) => snapshot.conversationId === conversationId),
      latestMessageGenerationMap,
      conversation?.messages || [],
    ),
    [characterStateSnapshots, conversationId, latestMessageGenerationMap, conversation?.messages],
  );

  const activeSideCharacterSnapshotMap = useMemo(
    () => buildActiveSideCharacterSnapshotMap(
      sideCharacterSnapshots.filter((snapshot) => snapshot.conversationId === conversationId),
      latestMessageGenerationMap,
      conversation?.messages || [],
    ),
    [sideCharacterSnapshots, conversationId, latestMessageGenerationMap, conversation?.messages],
  );

  const computeEffectiveCharacter = useCallback((
    baseChar: Character,
    snapshotMap: Map<string, CharacterStateMessageSnapshot> = activeCharacterSnapshotMap,
    alignmentMap: Map<string, GoalAlignmentState> = activeGoalAlignmentMap,
  ): Character & { previousNames?: string[] } => {
    return applyCharacterSnapshot({
      baseChar,
      manualMergedCharacter: getManualSessionCharacter(baseChar),
      snapshotMap,
      alignmentMap,
    });
  }, [activeCharacterSnapshotMap, activeGoalAlignmentMap, getManualSessionCharacter]);

  const getEffectiveCharacter = useCallback((baseChar: Character): Character & { previousNames?: string[] } => {
    return computeEffectiveCharacter(baseChar);
  }, [computeEffectiveCharacter]);

  const effectiveMainCharacters = useMemo(
    () => appData.characters.map((character) => getEffectiveCharacter(character)),
    [appData.characters, getEffectiveCharacter],
  );

  const computeEffectiveSideCharacter = useCallback((
    baseChar: SideCharacter,
    snapshotMap: Map<string, SideCharacterMessageSnapshot> = activeSideCharacterSnapshotMap,
  ): SideCharacter => {
    return applySideCharacterSnapshot(baseChar, snapshotMap);
  }, [activeSideCharacterSnapshotMap]);

  const getLatestConversationMessages = useCallback((): Message[] => {
    return latestConversationsRef.current.find(c => c.id === conversationId)?.messages || conversation?.messages || [];
  }, [conversation?.messages, conversationId]);

  const buildCurrentCharacterSnapshotMap = useCallback(() => {
    const messages = getLatestConversationMessages();
    return buildActiveCharacterSnapshotMap(
      characterStateSnapshotsRef.current.filter((snapshot) => snapshot.conversationId === conversationId),
      buildMessageGenerationMap(messages),
      messages,
    );
  }, [conversationId, getLatestConversationMessages]);

  const buildCurrentSideCharacterSnapshotMap = useCallback(() => {
    const messages = getLatestConversationMessages();
    return buildActiveSideCharacterSnapshotMap(
      sideCharacterSnapshotsRef.current.filter((snapshot) => snapshot.conversationId === conversationId),
      buildMessageGenerationMap(messages),
      messages,
    );
  }, [conversationId, getLatestConversationMessages]);

  const getCurrentEffectiveMainCharacters = useCallback(() => {
    const snapshotMap = buildCurrentCharacterSnapshotMap();
    return appData.characters.map((character) => computeEffectiveCharacter(character, snapshotMap));
  }, [appData.characters, buildCurrentCharacterSnapshotMap, computeEffectiveCharacter]);

  const getCurrentEffectiveSideCharacters = useCallback(() => {
    const snapshotMap = buildCurrentSideCharacterSnapshotMap();
    return (appData.sideCharacters || []).map((sideChar) => computeEffectiveSideCharacter(sideChar, snapshotMap));
  }, [appData.sideCharacters, buildCurrentSideCharacterSnapshotMap, computeEffectiveSideCharacter]);

  const upsertCharacterSnapshotInRuntimeState = useCallback((snapshot: CharacterStateMessageSnapshot) => {
    const next = upsertCharacterStateMessageSnapshot(characterStateSnapshotsRef.current, snapshot);
    characterStateSnapshotsRef.current = next;
    setCharacterStateSnapshots(next);
  }, []);

  const upsertSideCharacterSnapshotInRuntimeState = useCallback((snapshot: SideCharacterMessageSnapshot) => {
    const next = upsertSideCharacterStateMessageSnapshot(sideCharacterSnapshotsRef.current, snapshot);
    sideCharacterSnapshotsRef.current = next;
    setSideCharacterSnapshots(next);
  }, []);

  const effectiveSideCharacters = useMemo(
    () => getCurrentEffectiveSideCharacters(),
    [getCurrentEffectiveSideCharacters],
  );

  // Get all character names for memory extraction context
  const allCharacterNames = useMemo(() => {
    const mainNames = effectiveMainCharacters.map(c => c.name);
    const sideNames = effectiveSideCharacters.map(sc => sc.name);
    return [...mainNames, ...sideNames];
  }, [effectiveMainCharacters, effectiveSideCharacters]);

  // Build appData with session-merged characters for LLM context
  // This ensures the AI sees current locations, moods, controlledBy, etc.
  const buildLLMAppData = useCallback((overrides?: {
    snapshots?: CharacterStateMessageSnapshot[];
    sideSnapshots?: SideCharacterMessageSnapshot[];
    goalDerivations?: StoryGoalStepDerivation[];
    conversationMessages?: Message[];
  }): ScenarioData => {
    const conversationMessages = overrides?.conversationMessages ?? conversation?.messages ?? [];
    const overrideGenerationMap = overrides?.conversationMessages
      ? buildMessageGenerationMap(conversationMessages)
      : latestMessageGenerationMap;

    const snapshotMap =
      overrides?.snapshots || overrides?.conversationMessages
        ? buildActiveCharacterSnapshotMap(
            (overrides?.snapshots ?? characterStateSnapshots).filter((snapshot) => snapshot.conversationId === conversationId),
            overrideGenerationMap,
            conversationMessages,
          )
        : activeCharacterSnapshotMap;

    const sideSnapshotMap =
      overrides?.sideSnapshots || overrides?.conversationMessages
        ? buildActiveSideCharacterSnapshotMap(
            (overrides?.sideSnapshots ?? sideCharacterSnapshots).filter((snapshot) => snapshot.conversationId === conversationId),
            overrideGenerationMap,
            conversationMessages,
          )
        : activeSideCharacterSnapshotMap;

    const overrideGoalCompletionIds =
      overrides?.goalDerivations || overrides?.conversationMessages
        ? buildActiveGoalCompletionIds(
            (overrides?.goalDerivations ?? goalStepDerivations).filter((derivation) => derivation.conversationId === conversationId),
            overrideGenerationMap,
          )
        : activeGoalCompletionIds;

    const overrideGoalAlignmentMap = GOAL_ALIGNMENT_SHADOW_MODE
      ? new Map<string, GoalAlignmentState>()
      : overrides?.conversationMessages
        ? buildActiveGoalAlignmentMap(
            goalAlignmentStates.filter((state) => state.conversationId === conversationId),
            overrideGenerationMap,
          )
        : activeGoalAlignmentMap;

    const worldCore = buildEffectiveWorldCore({
      baseCore: appData.world.core,
      worldCoreSessionOverrides,
      activeGoalAlignmentMap: overrideGoalAlignmentMap,
      activeGoalCompletionIds: overrideGoalCompletionIds,
    });

    return {
      ...appData,
      characters: appData.characters.map(c => computeEffectiveCharacter(c, snapshotMap, overrideGoalAlignmentMap)),
      sideCharacters: (appData.sideCharacters || []).map((sideChar) => computeEffectiveSideCharacter(sideChar, sideSnapshotMap)),
      conversations: overrides?.conversationMessages
        ? appData.conversations.map((entry) => (
            entry.id === conversationId
              ? { ...entry, messages: conversationMessages }
              : entry
          ))
        : appData.conversations,
      world: { ...appData.world, core: worldCore }
    };
  }, [
    activeCharacterSnapshotMap,
    activeGoalCompletionIds,
    activeGoalAlignmentMap,
    activeSideCharacterSnapshotMap,
    appData,
    characterStateSnapshots,
    conversationId,
    computeEffectiveCharacter,
    computeEffectiveSideCharacter,
    conversation?.messages,
    goalAlignmentStates,
    goalStepDerivations,
    latestMessageGenerationMap,
    sideCharacterSnapshots,
    worldCoreSessionOverrides,
  ]);

  const effectiveAppData = useMemo(() => buildLLMAppData(), [buildLLMAppData]);
  const establishedFactNoteCharacters = useMemo(
    () => [...effectiveMainCharacters, ...effectiveSideCharacters],
    [effectiveMainCharacters, effectiveSideCharacters],
  );

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
    | { kind: 'side'; base: SideCharacter; effective: SideCharacter; canonicalName: string };

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
      const effectiveSide = computeEffectiveSideCharacter(side);
      const match: ResolvedSpeakerMatch = {
        kind: 'side',
        base: side,
        effective: effectiveSide,
        canonicalName: effectiveSide.name
      };
      registerCandidate(effectiveSide.name, match, 6);
      parseNameList(effectiveSide.nicknames).forEach((nickname) => registerCandidate(nickname, match, 4));
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
    computeEffectiveSideCharacter,
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
    return match.effective;
  }, [resolveCharacterReference]);

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
    const sideChars = effectiveSideCharacters.map(sc => ({
      ...sc,
      _source: 'sideCharacter' as const
    }));
    return [...effectiveMainChars, ...sideChars];
  }, [appData.characters, effectiveSideCharacters, getEffectiveCharacter, conversationId]);

  const mainCharactersForDisplay = useMemo(() =>
    allCharactersForDisplay.filter(c => c.characterRole === 'Main'),
    [allCharactersForDisplay]
  );
  const sideCharactersForDisplay = useMemo(() =>
    allCharactersForDisplay.filter(c => c.characterRole === 'Side'),
    [allCharactersForDisplay]
  );
  const chatSpellAllowlistEntries = useMemo(() => {
    const entries: Array<string | null | undefined> = [
      appData.world?.core?.scenarioName,
    ];

    for (const location of appData.world?.core?.structuredLocations || []) {
      entries.push(location.label);
    }

    for (const scene of appData.scenes || []) {
      entries.push(scene.title, ...(scene.tags || []));
    }

    for (const character of appData.characters) {
      entries.push(
        character.name,
        character.nicknames,
        character.location,
      );
    }

    for (const sideCharacter of appData.sideCharacters || []) {
      entries.push(
        sideCharacter.name,
        sideCharacter.nicknames,
        sideCharacter.location,
      );
    }

    return entries;
  }, [appData.characters, appData.scenes, appData.sideCharacters, appData.world]);
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

  // Canonical scene context is stricter than the visual background scene. Keyword
  // detection and starting-scene art can change the backdrop, but only explicit
  // scene tags change what API Call 1 receives as the current narrative location.
  const canonicalActiveScene = useMemo(() => {
    for (let i = (conversation?.messages.length || 0) - 1; i >= 0; i--) {
      const match = conversation?.messages[i]?.text.match(/\[SCENE:\s*(.*?)\]/);
      if (!match) continue;
      const tag = match[1].trim();
      const scene = appData.scenes.find(s =>
        (s.tags ?? []).some(t => t.toLowerCase() === tag.toLowerCase())
      );
      if (scene) return scene;
    }

    return null;
  }, [appData.scenes, conversation?.messages]);

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
    return findCharacterByName(name, effectiveAppData);
  };

  // Async function to generate side character details via edge function
  // Uses sideCharactersRef to avoid stale closure issues
  const generateSideCharacterDetailsAsync = async (
    characterId: string,
    name: string,
    dialogContext: string,
    sourceMessage?: Pick<Message, 'id' | 'generationId'>,
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
      const profileRequestBody = {
        name,
        dialogContext,
        extractedTraits: {},
        worldContext: appData.world.core.storyPremise,
        modelId,
        debugTrace: isAdmin,
      };
      recordChatDebugSupportCall(sourceMessage, {
        id: `support.side-character-profile.${characterId}`,
        label: `Supporting Call - Side-character profile (${name})`,
        apiCallGroup: 'support',
        endpoint: '/functions/v1/generate-side-character',
        method: 'POST',
        capturedAt: Date.now(),
        status: 'sent',
        requestBody: profileRequestBody,
      });

      const { data: profileData, error: profileError } = await supabase.functions.invoke('generate-side-character', {
        body: profileRequestBody
      });
      const profileDebug = splitEdgeDebugPayload(profileData);
      const profileSourceText = [
        dialogContext,
        JSON.stringify(profileRequestBody.extractedTraits || {}),
      ].join('\n');
      const profileForUse = sanitizeGeneratedSideCharacterProfile(
        profileDebug.responseBody,
        name,
        profileSourceText,
      );
      const profileDebugStatus = buildSupportCallDebugStatus(profileError, profileDebug.responseBody);

      recordChatDebugSupportCall(sourceMessage, {
        id: `support.side-character-profile.${characterId}`,
        label: `Supporting Call - Side-character profile (${name})`,
        apiCallGroup: 'support',
        endpoint: '/functions/v1/generate-side-character',
        method: 'POST',
        capturedAt: Date.now(),
        status: profileDebugStatus.status,
        requestBody: profileRequestBody,
        modelRequest: profileDebug.modelRequest,
        modelRequests: profileDebug.modelRequests,
        responseBody: profileDebug.responseBody ?? null,
        error: profileDebugStatus.error,
      });

      if (profileError) {
        console.error('Profile generation failed:', profileError);
        return;
      }

      if (profileForUse && onUpdateSideCharacters) {
        void trackAiUsageEvent({
          eventType: 'side_character_card_generated',
          eventSource: 'chat-interface',
          metadata: {
            conversationId,
            characterId,
            characterName: name,
            modelId,
            inputChars: dialogContext.length + (appData.world.core.storyPremise?.length || 0),
            outputChars: JSON.stringify(profileForUse).length,
          },
        });

        // Update character with generated details - use ref to get current state
        const updatedSideChars = sideCharactersRef.current.map(sc => {
          if (sc.id === characterId) {
            return {
              ...sc,
              nicknames: profileForUse.nicknames || sc.nicknames,
              age: profileForUse.age || sc.age,
              sexType: profileForUse.sexType || sc.sexType,
              sexualOrientation: profileForUse.sexualOrientation || sc.sexualOrientation,
              roleDescription: profileForUse.roleDescription || sc.roleDescription,
              physicalAppearance: mergeGeneratedProfileSection(sc.physicalAppearance, profileForUse.physicalAppearance),
              currentlyWearing: mergeGeneratedProfileSection(sc.currentlyWearing, profileForUse.currentlyWearing),
              background: mergeGeneratedProfileSection(sc.background, profileForUse.background),
              personality: mergeGeneratedProfileSection(sc.personality, profileForUse.personality),
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
        if (profileForUse.avatarPrompt) {
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
              ['call2.side_character_avatar.avatar_prompt', profileForUse.avatarPrompt],
              ['call2.side_character_avatar.character_name', name],
              ['call2.side_character_avatar.model_id', modelId],
            ]),
          });

          const avatarRequestBody = {
            avatarPrompt: profileForUse.avatarPrompt,
            characterName: name,
            modelId,
            stylePrompt: styleData?.backendPrompt || '',
            usageEventType: 'side_character_avatar_generated',
            debugTrace: isAdmin,
          };
          recordChatDebugSupportCall(sourceMessage, {
            id: `support.side-character-avatar.${characterId}`,
            label: `Supporting Call - Side-character avatar (${name})`,
            apiCallGroup: 'support',
            endpoint: '/functions/v1/generate-side-character-avatar',
            method: 'POST',
            capturedAt: Date.now(),
            status: 'sent',
            requestBody: avatarRequestBody,
          });

          const { data: avatarData, error: avatarError } = await supabase.functions.invoke('generate-side-character-avatar', {
            body: avatarRequestBody
          });
          const avatarDebug = splitEdgeDebugPayload(avatarData);
          const avatarResponseBody = avatarDebug.responseBody as any;
          const avatarDebugStatus = buildSupportCallDebugStatus(avatarError, avatarResponseBody);

          recordChatDebugSupportCall(sourceMessage, {
            id: `support.side-character-avatar.${characterId}`,
            label: `Supporting Call - Side-character avatar (${name})`,
            apiCallGroup: 'support',
            endpoint: '/functions/v1/generate-side-character-avatar',
            method: 'POST',
            capturedAt: Date.now(),
            status: avatarDebugStatus.status,
            requestBody: avatarRequestBody,
            modelRequest: avatarDebug.modelRequest,
            modelRequests: avatarDebug.modelRequests,
            responseBody: avatarResponseBody ? { ...avatarResponseBody, imageUrl: avatarResponseBody.imageUrl ? '[image data url omitted from summary]' : undefined } : null,
            error: avatarDebugStatus.error,
          });

          if (avatarError) {
            console.error('Avatar generation failed:', avatarError);
          } else if (avatarResponseBody?.imageUrl) {
            void trackAiUsageEvent({
              eventType: 'side_character_avatar_generated',
              eventSource: 'chat-interface',
              metadata: {
                conversationId,
                characterId,
                characterName: name,
                modelId,
                inputChars: profileForUse.avatarPrompt.length,
              },
            });

            // Use ref to get current state - avoids stale closure
            const finalSideChars = sideCharactersRef.current.map(sc => {
              if (sc.id === characterId) {
                return {
                  ...sc,
                  avatarDataUrl: avatarResponseBody.imageUrl,
                  isAvatarGenerating: false,
                  updatedAt: now()
                };
              }
              return sc;
            });
            onUpdateSideCharacters(finalSideChars);

            // Persist avatar update to database
            try {
              await supabaseData.updateSideCharacter(characterId, { avatarDataUrl: avatarResponseBody.imageUrl });
            } catch (err) {
              console.error(`Failed to update side character avatar in database:`, err);
            }

            debugLog(`${name} has joined the story!`);
          }
        }
      }
    } catch (error) {
      recordChatDebugSupportCall(sourceMessage, {
        id: `support.side-character-profile.${characterId}`,
        label: `Supporting Call - Side-character profile (${name})`,
        apiCallGroup: 'support',
        endpoint: '/functions/v1/generate-side-character',
        method: 'POST',
        capturedAt: Date.now(),
        status: 'error',
        requestBody: {
          name,
          dialogContext,
          extractedTraits: {},
          worldContext: appData.world.core.storyPremise,
          modelId,
          debugTrace: isAdmin,
        },
        error: error instanceof Error ? error.message : String(error),
      });
      console.error('Side character generation failed:', error);
    }
  };

  // Process AI response to detect new characters
  const processResponseForNewCharacters = async (
    responseText: string,
    sourceMessage?: Pick<Message, 'id' | 'generationId'>,
  ) => {
    if (!onUpdateSideCharacters) return;

    const knownNames = getKnownCharacterNames(effectiveAppData);
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
          generateSideCharacterDetailsAsync(sc.id, sc.name, nc.dialogContext, sourceMessage);
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

  const sanitizeAssistantOutput = useCallback((text: string): string => {
    return sanitizeAssistantMessageText(stripUpdateTags(text));
  }, []);

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
        let sessionState = sessionStates.find(s => s.conversationId === conversationId && s.characterId === mainChar.id);
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

  const isMessageGenerationStillCurrent = useCallback((messageId?: string, generationId?: string): boolean => {
    if (!messageId) return true;
    const latestConversation = latestConversationsRef.current.find(c => c.id === conversationId);
    if (!latestConversation) return false;

    const messageIndex = latestConversation.messages.findIndex(
      m => m.id === messageId,
    );
    if (messageIndex === -1) return false;

    const currentMessage = latestConversation.messages[messageIndex];
    const currentGenerationId = currentMessage.generationId || currentMessage.id;
    if (generationId && currentGenerationId !== generationId) return false;

    return true;
  }, [conversationId]);

  const normalizeEvidenceForGate = (value: unknown): string =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^evidence\s*:\s*/i, '')
      .trim();

  const isGenericEvidenceText = (value: unknown): boolean => {
    const normalized = normalizeEvidenceForGate(value).toLowerCase();
    return !normalized ||
      /^(short quote|close paraphrase|supported by|evidence from|latest exchange|short exchange evidence|brief evidence|model evidence)/i.test(normalized) ||
      normalized.includes('from this exchange');
  };

  const evaluateGoalProgress = async (
    userMessage: string,
    aiResponse: string,
    sourceAssistantMessageId?: string,
    sourceAssistantGenerationId?: string,
  ) => {
    const storyGoals = (effectiveWorldCore.storyGoals || []).filter((goal) => {
      const flexibility: GoalFlexibility =
        goal?.flexibility === 'rigid' || goal?.flexibility === 'flexible'
          ? goal.flexibility
          : 'normal';
      return shouldRenderGoalToWriter(goal?.alignment, flexibility);
    });
    if (!storyGoals?.length) return;

    const pendingSteps: Array<{
      stepId: string;
      description: string;
      goalId: string;
      goalTitle: string;
      goalDesiredOutcome: string;
      goalCurrentStatus: string;
      flexibility: GoalFlexibility;
    }> = [];
    for (const goal of storyGoals) {
      const currentOpenStep = (goal.steps || []).find((step) => !step.completed);
      if (currentOpenStep) {
        pendingSteps.push({
          stepId: currentOpenStep.id,
          description: currentOpenStep.description,
          goalId: goal.id,
          goalTitle: goal.title || 'Untitled story goal',
          goalDesiredOutcome: goal.desiredOutcome || '',
          goalCurrentStatus: goal.currentStatus || '',
          flexibility: goal.flexibility,
        });
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

      const requestBody = {
        userMessage,
        aiResponse,
        pendingSteps: pendingSteps.map(s => ({
          stepId: s.stepId,
          goalId: s.goalId,
          goalTitle: s.goalTitle,
          goalDesiredOutcome: s.goalDesiredOutcome,
          goalCurrentStatus: s.goalCurrentStatus,
          description: s.description,
          flexibility: s.flexibility,
        })),
        currentDay,
        currentTimeOfDay,
        debugTrace: isAdmin,
      };
      const sourceMessage = sourceAssistantMessageId
        ? { id: sourceAssistantMessageId, generationId: sourceAssistantGenerationId }
        : null;
      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.goal-progress-eval',
        label: 'Supporting Call - Goal progress evaluation',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/evaluate-goal-progress',
        method: 'POST',
        capturedAt: Date.now(),
        status: 'sent',
        requestBody,
      });

      const { data, error } = await supabase.functions.invoke('evaluate-goal-progress', {
        body: requestBody,
      });
      const goalDebug = splitEdgeDebugPayload(data);
      const returnedStepUpdates = Array.isArray((goalDebug.responseBody as any)?.stepUpdates)
        ? ((goalDebug.responseBody as any).stepUpdates as any[])
        : Array.isArray((data as any)?.stepUpdates)
          ? ((data as any).stepUpdates as any[])
          : [];
      const returnedClassificationReviews = Array.isArray((goalDebug.responseBody as any)?.classificationReviews)
        ? ((goalDebug.responseBody as any).classificationReviews as any[])
        : Array.isArray((data as any)?.classificationReviews)
          ? ((data as any).classificationReviews as any[])
          : [];
      const pendingByStepId = new Map(pendingSteps.map((step) => [step.stepId, step]));
      const completionReviewSource = returnedClassificationReviews.length ? returnedClassificationReviews : returnedStepUpdates;
      const completionReviews = completionReviewSource.map((update, index) => {
        const pending = pendingByStepId.get(String(update?.stepId || ''));
        const confidence = typeof update?.confidence === 'number'
          ? update.confidence
          : Number(update?.confidence || 0);
        const evidence = normalizeEvidenceForGate(update?.evidence);
        const genericEvidence = isGenericEvidenceText(evidence);
        const modelCompleted = update?.modelCompleted === true || update?.completed === true;
        const accepted =
          !!pending &&
          update?.completed === true &&
          update?.result === 'completed' &&
          Number.isFinite(confidence) &&
          confidence >= 0.75 &&
          evidence.length > 0 &&
          !genericEvidence;
        const reason = accepted
          ? 'accepted'
          : !pending
            ? 'unknown_step'
            : !modelCompleted
              ? 'not_marked_completed'
              : update?.result !== 'completed'
                ? 'result_not_completed'
                : !Number.isFinite(confidence) || confidence < 0.75
                ? 'low_confidence'
                  : !evidence || genericEvidence
                    ? 'missing_evidence'
                    : 'rejected';
        return {
          index: typeof update?.index === 'number' ? update.index : index,
          stepId: String(update?.stepId || 'unknown'),
          result: update?.result || 'unknown',
          completed: update?.completed === true,
          modelCompleted,
          confidence: Number.isFinite(confidence) ? confidence : 0,
          evidence,
          accepted,
          reason: update?.rejectionReason || reason,
        };
      });
      const acceptedStepCompletions = completionReviews.filter((review) => review.accepted);
      const rejectedStepCompletions = completionReviews.filter((review) => !review.accepted && (review.modelCompleted || review.result === 'completed'));
      const reviewedGoalResponseBody = goalDebug.responseBody && typeof goalDebug.responseBody === 'object'
        ? {
            ...(goalDebug.responseBody as Record<string, unknown>),
            stepCompletionReviews: completionReviews,
            acceptedStepCompletions,
            rejectedStepCompletions,
          }
        : goalDebug.responseBody ?? null;
      const goalDebugStatus = buildSupportCallDebugStatus(error, reviewedGoalResponseBody);

      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.goal-progress-eval',
        label: 'Supporting Call - Goal progress evaluation',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/evaluate-goal-progress',
        method: 'POST',
        capturedAt: Date.now(),
        status: goalDebugStatus.status,
        requestBody,
        modelRequest: goalDebug.modelRequest,
        modelRequests: goalDebug.modelRequests,
        responseBody: reviewedGoalResponseBody,
        error: goalDebugStatus.error,
      });

      if (error || !returnedStepUpdates.length) return;

      if (!isMessageGenerationStillCurrent(sourceAssistantMessageId, sourceAssistantGenerationId)) {
        debugLog('[evaluateGoalProgress] Discarded stale result for non-current turn');
        return;
      }

      const completions = acceptedStepCompletions
        .map((review) => {
          const pending = pendingSteps.find(step => step.stepId === review.stepId);
          if (!pending) return null;
          return {
            goalId: pending.goalId,
            stepId: review.stepId,
            completed: true,
          };
        })
        .filter(Boolean) as Array<{ goalId: string; stepId: string; completed: boolean }>;
      if (completions.length === 0 || !sourceAssistantMessageId || !sourceAssistantGenerationId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (!isMessageGenerationStillCurrent(sourceAssistantMessageId, sourceAssistantGenerationId)) {
        debugLog('[evaluateGoalProgress] Discarded stale result before persistence');
        return;
      }

      const persisted = await supabaseData.upsertStoryGoalStepDerivations({
        conversationId,
        userId: user.id,
        sourceMessageId: sourceAssistantMessageId,
        sourceGenerationId: sourceAssistantGenerationId,
        day: currentDay,
        timeOfDay: currentTimeOfDay,
        completions,
      });

      setGoalStepDerivations(prev => {
        const next = [...prev];
        for (const derivation of persisted) {
          const index = next.findIndex(
            (entry) =>
              entry.stepId === derivation.stepId &&
              entry.sourceMessageId === derivation.sourceMessageId &&
              entry.sourceGenerationId === derivation.sourceGenerationId,
          );
          if (index === -1) next.push(derivation);
          else next[index] = derivation;
        }
        return next;
      });

      debugLog(`[evaluateGoalProgress] Completed ${completions.length} steps`);
    } catch (err) {
      console.error('[evaluateGoalProgress] Failed:', err);
    }
  };

  const evaluateGoalAlignment = async (
    userMessage: string,
    aiResponse: string,
    sourceAssistantMessageId?: string,
    sourceAssistantGenerationId?: string,
  ) => {
    const storyGoals = (effectiveWorldCore.storyGoals || [])
      .filter((goal) => goal.title?.trim() || goal.desiredOutcome?.trim())
      .map((goal) => ({
        goalId: goal.id,
        goalKind: 'story' as const,
        characterId: null,
        title: goal.title || 'Untitled story goal',
        desiredOutcome: goal.desiredOutcome || '',
        currentStatus: goal.currentStatus || '',
        flexibility: goal.flexibility || 'normal',
        openStep: (goal.steps || []).find((step) => !step.completed)?.description || '',
        alignment: goal.alignment,
      }));

    const characterGoals = effectiveMainCharacters
      .filter((character) => character.controlledBy !== 'User')
      .flatMap((character) => (character.goals || [])
        .filter((goal) => goal.title?.trim() || goal.desiredOutcome?.trim())
        .map((goal) => ({
          goalId: goal.id,
          goalKind: 'character' as const,
          characterId: character.id,
          characterName: character.name,
          title: goal.title || 'Untitled character goal',
          desiredOutcome: goal.desiredOutcome || '',
          currentStatus: goal.currentStatus || '',
          flexibility: goal.flexibility || 'normal',
          openStep: (goal.steps || []).find((step) => !step.completed)?.description || '',
          alignment: goal.alignment,
        })));

    const goals = [...storyGoals, ...characterGoals];
    if (goals.length === 0) return;
    if (!isMessageGenerationStillCurrent(sourceAssistantMessageId, sourceAssistantGenerationId)) {
      debugLog('[evaluateGoalAlignment] Skipped stale turn before support call');
      return;
    }

    const conversationForContext = latestConversationsRef.current.find(c => c.id === conversationId);
    const recentContext = (conversationForContext?.messages || [])
      .filter((message) => !isLocalRoleplayNoticeMessage(message))
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.text}`)
      .join('\n\n');

    try {
      void trackAiUsageEvent({
        eventType: 'goal_alignment_eval_call',
        eventSource: 'chat-interface',
        metadata: {
          conversationId,
          goalCount: goals.length,
          inputChars: (userMessage?.length || 0) + (aiResponse?.length || 0) + recentContext.length,
        },
      });

      void trackApiValidationSnapshot({
        eventKey: 'validation.call2.goal_alignment',
        eventSource: 'chat-interface.goal-alignment',
        apiCallGroup: 'call_2',
        parentRowId: 'summary.call2.goal_alignment',
        detailPresence: buildRequiredPresence([
          ['call2.goal_alignment.user_message', userMessage],
          ['call2.goal_alignment.ai_response', aiResponse],
          ['call2.goal_alignment.recent_context', recentContext],
          ['call2.goal_alignment.goals', goals],
          ['call2.goal_alignment.temporal_context', `${currentDay}:${currentTimeOfDay}`],
        ]),
        diagnostics: {
          goalCount: goals.length,
        },
      });

      const requestBody = {
        userMessage,
        aiResponse,
        recentContext,
        goals,
        currentDay,
        currentTimeOfDay,
        debugTrace: isAdmin,
      };
      const sourceMessage = sourceAssistantMessageId
        ? { id: sourceAssistantMessageId, generationId: sourceAssistantGenerationId }
        : null;

      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.goal-alignment-eval',
        label: 'Supporting Call - Goal alignment evaluation',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/evaluate-goal-alignment',
        method: 'POST',
        capturedAt: Date.now(),
        status: 'sent',
        requestBody,
      });

      const { data, error } = await supabase.functions.invoke('evaluate-goal-alignment', {
        body: requestBody,
      });
      const alignmentDebug = splitEdgeDebugPayload(data);
      const reviewedAlignmentResponseBody = alignmentDebug.responseBody && typeof alignmentDebug.responseBody === 'object'
        ? {
            ...(alignmentDebug.responseBody as Record<string, unknown>),
            shadowMode: GOAL_ALIGNMENT_SHADOW_MODE,
            persistence: GOAL_ALIGNMENT_SHADOW_MODE ? 'diagnostic_only' : 'eligible',
          }
        : alignmentDebug.responseBody ?? null;
      const alignmentDebugStatus = buildSupportCallDebugStatus(error, reviewedAlignmentResponseBody);

      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.goal-alignment-eval',
        label: 'Supporting Call - Goal alignment evaluation',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/evaluate-goal-alignment',
        method: 'POST',
        capturedAt: Date.now(),
        status: alignmentDebugStatus.status,
        requestBody,
        modelRequest: alignmentDebug.modelRequest,
        modelRequests: alignmentDebug.modelRequests,
        responseBody: reviewedAlignmentResponseBody,
        notes: GOAL_ALIGNMENT_SHADOW_MODE
          ? ['Goal alignment shadow mode is enabled; evaluations are shown for review but are not persisted or injected into API Call 1.']
          : undefined,
        error: alignmentDebugStatus.error,
      });

      if (error || !data?.evaluations?.length) return;
      if (GOAL_ALIGNMENT_SHADOW_MODE) {
        debugLog('[evaluateGoalAlignment] Shadow mode active; skipped persistence and prompt steering');
        return;
      }
      if (!isMessageGenerationStillCurrent(sourceAssistantMessageId, sourceAssistantGenerationId)) {
        debugLog('[evaluateGoalAlignment] Discarded stale result for non-current turn');
        return;
      }

      const evaluatedAt = Date.now();
      const goalByKey = new Map(goals.map((goal) => [
        buildGoalAlignmentKey(goal.goalKind, goal.goalId, goal.characterId),
        goal,
      ]));
      const latestConversationForBaseline = latestConversationsRef.current.find(c => c.id === conversationId);
      const latestGenerationMap = buildMessageGenerationMap(latestConversationForBaseline?.messages || []);
      const latestPersistedAlignmentStates = await supabaseData.fetchGoalAlignmentStates(conversationId);
      if (!isMessageGenerationStillCurrent(sourceAssistantMessageId, sourceAssistantGenerationId)) {
        debugLog('[evaluateGoalAlignment] Discarded stale result after baseline refresh');
        return;
      }
      const existingByKey = buildActiveGoalAlignmentMap(
        latestPersistedAlignmentStates.filter((state) => state.conversationId === conversationId),
        latestGenerationMap,
      );

      const nextStates = (data.evaluations as GoalAlignmentEvaluation[])
        .filter((evaluation) => evaluation.signal !== 'not_applicable' && evaluation.intensity > 0)
        .map((evaluation) => {
          const key = buildGoalAlignmentKey(evaluation.goalKind, evaluation.goalId, evaluation.characterId);
          const goal = goalByKey.get(key);
          if (!goal) return null;
          const previous = existingByKey.get(key) || {
            goalId: evaluation.goalId,
            goalKind: evaluation.goalKind,
            characterId: evaluation.characterId ?? null,
          };
          return applyGoalAlignmentEvaluation(
            previous,
            evaluation,
            goal.flexibility,
            {
              conversationId,
              sourceMessageId: sourceAssistantMessageId,
              sourceGenerationId: sourceAssistantGenerationId,
              day: currentDay,
              timeOfDay: currentTimeOfDay,
              evaluatedAt,
            },
          );
        })
        .filter(Boolean) as GoalAlignmentState[];

      if (nextStates.length === 0 || !sourceAssistantMessageId || !sourceAssistantGenerationId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const persisted = await supabaseData.upsertGoalAlignmentStates({
        conversationId,
        userId: user.id,
        states: nextStates,
      });

      setGoalAlignmentStates(prev => {
        const next = [...prev];
        for (const state of persisted) {
          const key = buildGoalAlignmentKey(state.goalKind, state.goalId, state.characterId);
          const index = next.findIndex((entry) => (
            entry.conversationId === conversationId &&
            buildGoalAlignmentKey(entry.goalKind, entry.goalId, entry.characterId) === key
          ));
          if (index === -1) next.push(state);
          else next[index] = state;
        }
        return next;
      });

      debugLog(`[evaluateGoalAlignment] Updated ${persisted.length} goal alignment states`);
    } catch (err) {
      console.error('[evaluateGoalAlignment] Failed:', err);
    }
  };

  // ============================================================================
  // DEDICATED CHARACTER UPDATE EXTRACTION (runs in parallel with narrative)
  // ============================================================================

  interface ExtractedUpdate {
    character: string;
    field: string;
    value: string;
    evidence?: string;
    confidence?: number;
  }

  interface ExtractionRequestMeta {
    sourceMessageId?: string;
    sourceMessageGenerationId?: string;
    reason?: string;
  }

  const isAllowedExtractionField = (field: string): boolean => {
    if (['age', 'sexType', 'sexualOrientation', 'roleDescription', 'location', 'scenePosition', 'currentMood', 'nicknames'].includes(field)) return true;
    if (field.startsWith('goals.')) return true;
    if (field.startsWith('sections.')) {
      const sectionTitle = field.split('.')[1]?.trim().toLowerCase();
      return sectionTitle !== 'goals' && sectionTitle !== 'goal';
    }
    if (!field.includes('.')) return false;

    const [parent, child] = field.split('.');
    if (!parent || !child) return false;

    if (parent === 'physicalAppearance' || parent === 'currentlyWearing' || parent === 'preferredClothing' || parent === 'background') {
      return true;
    }

    if (parent === 'personality') {
      return ['traits', 'outwardTraits', 'inwardTraits', 'splitMode', 'miscellaneous', 'secrets', 'fears', 'kinksFantasies', 'desires'].includes(child);
    }

    if (['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'].includes(parent)) {
      return child === '_extras';
    }

    return false;
  };

  const isAllowedExtractionUpdate = (update: ExtractedUpdate): boolean => {
    if (!isAllowedExtractionField(update.field)) return false;
    if (update.field.startsWith('goals.') && update.value.trim().toUpperCase() === 'REMOVE') return false;
    const confidence = typeof update.confidence === 'number'
      ? update.confidence
      : Number(update.confidence || 0);
    if (!Number.isFinite(confidence) || confidence < 0.72) return false;
    if (typeof update.evidence !== 'string' || !update.evidence.trim()) return false;
    if (isGenericEvidenceText(update.evidence)) return false;
    return true;
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

  const goalComparableText = (goal: any): string =>
    [goal?.title, goal?.desiredOutcome, goal?.currentStatus]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .join(' ');

  const findSimilarGoalIndex = (
    goals: any[],
    goalTitle: string,
    desiredOutcome: string,
  ): number => {
    const candidate = [goalTitle, desiredOutcome].filter(Boolean).join(' ');
    if (!candidate.trim()) return -1;

    let bestIndex = -1;
    let bestScore = 0;
    goals.forEach((goal, index) => {
      const titleScore = tokenSimilarity(goal?.title || '', goalTitle);
      const combinedScore = tokenSimilarity(goalComparableText(goal), candidate);
      const score = Math.max(titleScore, combinedScore);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestScore >= 0.58 ? bestIndex : -1;
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

  const findNearDuplicateStringIndex = (existing: string[], nextValue: string): number => {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < existing.length; i += 1) {
      const score = tokenSimilarity(existing[i] || '', nextValue);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return bestScore >= 0.72 ? bestIdx : -1;
  };

  const normalizeSideCharacterTraitText = (entry: unknown): string => {
    if (typeof entry === 'string') return entry.trim();
    if (entry && typeof entry === 'object') {
      const trait = entry as { label?: unknown; value?: unknown };
      const label = typeof trait.label === 'string' ? trait.label.trim() : '';
      const value = typeof trait.value === 'string' ? trait.value.trim() : '';
      if (label && value) return `${label}: ${value}`;
      return label || value;
    }
    return '';
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

  // Build eligible character set from latest exchange
  const buildEligibleCharacterNames = useCallback((
    userMessage: string,
    aiResponse: string,
    mainCharacters: Array<Character & { previousNames?: string[] }> = effectiveMainCharacters,
    sideCharacters: SideCharacter[] = effectiveSideCharacters,
  ): Set<string> => {
    const eligible = new Set<string>();
    const combinedText = `${userMessage}\n${aiResponse}`;
    const isAliasMentioned = (alias: string): boolean => {
      const trimmed = alias.trim();
      if (!trimmed) return false;
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-zA-Z0-9])${escaped}(?=$|[^a-zA-Z0-9])`, 'i').test(combinedText);
    };

    const addTaggedSpeaker = (speakerName: string | null | undefined) => {
      const normalizedSpeaker = speakerName?.trim().toLowerCase();
      if (!normalizedSpeaker) return;
      const mainMatch = mainCharacters.find((character) => character.name.toLowerCase() === normalizedSpeaker);
      if (mainMatch) {
        eligible.add(mainMatch.name.toLowerCase());
        return;
      }
      const sideMatch = sideCharacters.find((character) => character.name.toLowerCase() === normalizedSpeaker);
      if (sideMatch) eligible.add(sideMatch.name.toLowerCase());
    };

    for (const segment of parseMessageSegments(userMessage)) addTaggedSpeaker(segment.speakerName);
    for (const segment of parseMessageSegments(aiResponse)) addTaggedSpeaker(segment.speakerName);

    // Check all characters (main + side) by name, nicknames, previousNames
    for (const c of mainCharacters) {
      const names = [c.name, ...(c.nicknames?.split(',').map(n => n.trim()) || []), ...(c.previousNames || [])].filter(Boolean);
      const mentioned = names.some(isAliasMentioned);
      if (mentioned) {
        eligible.add(c.name.toLowerCase());
      }
    }
    for (const sc of sideCharacters) {
      const names = [sc.name, ...(sc.nicknames?.split(',').map(n => n.trim()) || [])].filter(Boolean);
      const mentioned = names.some(isAliasMentioned);
      if (mentioned) {
        eligible.add(sc.name.toLowerCase());
      }
    }
    return eligible;
  }, [effectiveMainCharacters, effectiveSideCharacters]);

  // Call the dedicated extraction edge function
  const extractCharacterUpdatesFromDialogue = async (
    userMessage: string,
    aiResponse: string,
    meta?: ExtractionRequestMeta
  ): Promise<ExtractedUpdate[]> => {
    debugLog('[extractCharacterUpdates] Started', meta?.reason ? `(${meta.reason})` : '');
    try {
      const currentEffectiveMainCharacters = getCurrentEffectiveMainCharacters();
      const currentEffectiveSideCharacters = getCurrentEffectiveSideCharacters();
      // Build eligible character set
      const eligibleNames = buildEligibleCharacterNames(
        userMessage,
        aiResponse,
        currentEffectiveMainCharacters,
        currentEffectiveSideCharacters,
      );
      debugLog('[extractCharacterUpdates] Eligible characters:', [...eligibleNames]);
      if (eligibleNames.size === 0) return [];

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

      // Build character data for context — only eligible characters
      const charactersData = currentEffectiveMainCharacters.map((effective) => {
        return {
          name: effective.name,
          previousNames: effective.previousNames || [],
          nicknames: effective.nicknames,
          age: effective.age,
          sexType: effective.sexType,
          sexualOrientation: effective.sexualOrientation,
          roleDescription: effective.roleDescription,
          physicalAppearance: effective.physicalAppearance,
          currentlyWearing: effective.currentlyWearing,
          preferredClothing: effective.preferredClothing,
          location: effective.location,
          scenePosition: effective.scenePosition || '',
          currentMood: effective.currentMood,
          goals: (effective.goals || []).map(g => ({
            title: g.title,
            desiredOutcome: g.desiredOutcome || '',
            currentStatus: g.currentStatus || '',
            progress: g.progress || 0,
            flexibility: g.flexibility || 'normal',
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
      const sideCharsData = currentEffectiveSideCharacters.filter(sc =>
        eligibleNames.has(sc.name.toLowerCase())
      ).map(sc => ({
        name: sc.name,
        nicknames: sc.nicknames,
        age: sc.age,
        sexType: sc.sexType,
        sexualOrientation: sc.sexualOrientation,
        roleDescription: sc.roleDescription,
        customSections: (sc.sections || []).map(s => ({
          title: s.title,
          items: normalizeSectionItems(s)
        }))
        .filter((s) => (s.title || '').trim() || s.items.length > 0),
        physicalAppearance: sc.physicalAppearance,
        currentlyWearing: sc.currentlyWearing,
        preferredClothing: sc.preferredClothing,
        location: sc.location,
        scenePosition: sc.scenePosition || '',
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

      // Build recent context from only the freshest slice. Older durable truth should
      // come from canonical state, not from re-reading a huge transcript every turn.
      const conversation = appData.conversations.find(c => c.id === conversationId);
      const recentMessages = (conversation?.messages || [])
        .filter((message) => !isLocalRoleplayNoticeMessage(message))
        .slice(-10);
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
          ['call2.character_updates.story_clock', { day: currentDay, timeOfDay: currentTimeOfDay }],
        ]),
        diagnostics: {
          scopedCharacterCount: allCharacters.length,
          eligibleCharacterCount: eligibleNames.size,
        },
      });

      const requestBody = {
        userMessage,
        aiResponse,
        recentContext,
        characters: allCharacters,
        modelId,
        eligibleCharacters: [...eligibleNames],
        currentDay,
        currentTimeOfDay,
        debugTrace: isAdmin,
      };
      const sourceMessage = meta?.sourceMessageId
        ? { id: meta.sourceMessageId, generationId: meta.sourceMessageGenerationId }
        : null;
      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.character-state-sync',
        label: 'API Call 2 - Character state sync',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/extract-character-updates',
        method: 'POST',
        capturedAt: Date.now(),
        status: 'sent',
        requestBody,
      });

      const { data, error } = await supabase.functions.invoke('extract-character-updates', {
        body: requestBody
      });
      const characterDebug = splitEdgeDebugPayload(data);
      const rawCharacterUpdates = Array.isArray((characterDebug.responseBody as any)?.updates)
        ? ((characterDebug.responseBody as any).updates as any[])
        : Array.isArray((data as any)?.updates)
          ? ((data as any).updates as any[])
          : [];
      const returnedCandidateReviews = Array.isArray((characterDebug.responseBody as any)?.candidateReviews)
        ? ((characterDebug.responseBody as any).candidateReviews as any[])
        : Array.isArray((data as any)?.candidateReviews)
          ? ((data as any).candidateReviews as any[])
          : [];
      const characterUpdateReviews = (returnedCandidateReviews.length ? returnedCandidateReviews : rawCharacterUpdates).map((update, index) => {
        const normalized: ExtractedUpdate = {
          character: String(update?.character || ''),
          field: String(update?.field || ''),
          value: String(update?.value || ''),
          evidence: normalizeEvidenceForGate(update?.evidence),
          confidence: typeof update?.confidence === 'number'
            ? update.confidence
            : Number(update?.confidence || 0),
        };
        const eligible = eligibleNames.has(normalized.character.toLowerCase());
        const genericEvidence = isGenericEvidenceText(normalized.evidence);
        const edgeAccepted = update?.accepted === true;
        const accepted = returnedCandidateReviews.length
          ? edgeAccepted
          : eligible && isAllowedExtractionUpdate(normalized);
        const reason = accepted
          ? 'accepted'
          : typeof update?.reason === 'string' && update.reason.trim()
            ? update.reason.trim()
          : !eligible
            ? 'ineligible_character'
            : !isAllowedExtractionField(normalized.field)
              ? 'unsupported_field'
              : normalized.field.startsWith('goals.') && normalized.value.trim().toUpperCase() === 'REMOVE'
                ? 'unsupported_goal_removal'
                : !Number.isFinite(normalized.confidence || 0) || (normalized.confidence || 0) < 0.72
                  ? 'low_confidence'
                  : !normalized.evidence?.trim() || genericEvidence
                    ? 'missing_evidence'
                    : 'rejected';
        return {
          index: typeof update?.index === 'number' ? update.index : index,
          character: normalized.character,
          originalCharacter: typeof update?.originalCharacter === 'string' ? update.originalCharacter : undefined,
          field: normalized.field,
          value: normalized.value,
          evidence: normalized.evidence || '',
          confidence: Number.isFinite(normalized.confidence || 0) ? normalized.confidence || 0 : 0,
          accepted,
          reason,
        };
      });
      const reviewedCharacterResponseBody = characterDebug.responseBody && typeof characterDebug.responseBody === 'object'
        ? {
            ...(characterDebug.responseBody as Record<string, unknown>),
            characterUpdateReviews,
            acceptedUpdates: characterUpdateReviews.filter((review) => review.accepted),
            rejectedUpdates: characterUpdateReviews.filter((review) => !review.accepted),
          }
        : characterDebug.responseBody ?? null;
      const characterDebugStatus = buildSupportCallDebugStatus(error, reviewedCharacterResponseBody);

      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.character-state-sync',
        label: 'API Call 2 - Character state sync',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/extract-character-updates',
        method: 'POST',
        capturedAt: Date.now(),
        status: characterDebugStatus.status,
        requestBody,
        modelRequest: characterDebug.modelRequest,
        modelRequests: characterDebug.modelRequests,
        responseBody: reviewedCharacterResponseBody,
        error: characterDebugStatus.error,
      });

      if (error) {
        console.error('[extractCharacterUpdates] Edge function error:', error);
        return [];
      }

      // Defensive: filter out updates for non-eligible characters and unsupported fields
      const updates = rawCharacterUpdates
        .filter((u: any): u is ExtractedUpdate => (
          typeof u?.character === 'string' &&
          typeof u?.field === 'string' &&
          typeof u?.value === 'string'
        ))
        .filter((u: ExtractedUpdate) => eligibleNames.has(u.character.toLowerCase()))
        .filter((u: ExtractedUpdate) => isAllowedExtractionUpdate(u));

      if (!isMessageGenerationStillCurrent(meta?.sourceMessageId, meta?.sourceMessageGenerationId)) {
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

  const sanitizeScenePositionValue = (raw: string): string => {
    const cleaned = raw
      .replace(/[*"()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return '';

    return cleaned.split(/\s+/).slice(0, 18).join(' ');
  };

  const cloneData = <T,>(value: T): T => {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  };

  const previewStateValue = (value: unknown): string | undefined => {
    if (value == null || value === '') return undefined;
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    const compact = raw.replace(/\s+/g, ' ').trim();
    return compact.length > 260 ? `${compact.slice(0, 257)}...` : compact;
  };

  const getFieldValueForMetadata = (payload: Record<string, any>, fieldPath: string): unknown => {
    if (fieldPath.startsWith('goals.')) {
      const goalTitle = fieldPath.slice(6).toLowerCase();
      return (payload.goals || []).find((goal: any) => goal?.title?.toLowerCase?.() === goalTitle);
    }

    if (fieldPath.startsWith('sections.')) {
      const [, sectionTitle, ...itemParts] = fieldPath.split('.');
      const itemLabel = itemParts.join('.').toLowerCase();
      const section = (payload.sections || []).find((entry: any) => entry?.title?.toLowerCase?.() === sectionTitle.toLowerCase());
      return section?.items?.find((item: any) => item?.label?.toLowerCase?.() === itemLabel);
    }

    const parts = fieldPath.split('.');
    let current: any = payload;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  };

  const stampFieldChangeMetadata = <T extends { _fieldChangeMetadata?: FieldChangeMetadataMap }>(
    currentPayload: T,
    nextPayload: T,
    updates: ExtractedUpdate[],
    meta: Required<Pick<ExtractionRequestMeta, 'sourceMessageId' | 'sourceMessageGenerationId'>>,
  ): T => {
    const stamped = cloneData(nextPayload);
    const existingMetadata = cloneData(currentPayload._fieldChangeMetadata || {});
    const updatedAt = Date.now();

    for (const update of updates) {
      const previousValue = getFieldValueForMetadata(currentPayload as Record<string, any>, update.field);
      const nextValue = getFieldValueForMetadata(nextPayload as Record<string, any>, update.field);
      if (JSON.stringify(previousValue ?? null) === JSON.stringify(nextValue ?? null)) continue;

      existingMetadata[update.field] = {
        fieldPath: update.field,
        storyDay: currentDay,
        timeOfDay: currentTimeOfDay,
        sourceMessageId: meta.sourceMessageId,
        sourceGenerationId: meta.sourceMessageGenerationId,
        updatedAt,
        previousValuePreview: previewStateValue(previousValue),
        nextValuePreview: previewStateValue(nextValue ?? update.value),
      };
    }

    stamped._fieldChangeMetadata = existingMetadata;
    return stamped;
  };

  const upsertExtrasEntry = (
    existing: Array<{ id?: string; label: string; value: string }>,
    rawValue: string,
  ) => {
    const parts = rawValue.split(':');
    const nextLabel = parts[0]?.trim() || 'New';
    const nextValue = parts.slice(1).join(':').trim() || rawValue;
    const exactIndex = existing.findIndex((entry) => entry.label.toLowerCase() === nextLabel.toLowerCase());
    if (exactIndex !== -1) {
      if (shouldRefineExistingText(existing[exactIndex]?.value || '', nextValue || '')) {
        existing[exactIndex] = { ...existing[exactIndex], value: nextValue };
      }
      return;
    }
    const nearDupIdx = findNearDuplicateExtraIndex(existing as Array<{ label: string; value: string }>, nextLabel, nextValue);
    if (nearDupIdx !== -1) {
      if (shouldRefineExistingText(existing[nearDupIdx]?.value || '', nextValue || '')) {
        existing[nearDupIdx] = { ...existing[nearDupIdx], value: nextValue };
      }
      return;
    }
    existing.push({ id: `extra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label: nextLabel, value: nextValue });
  };

  const parseGoalSteps = (raw: string): Array<{ id: string; description: string; completed: boolean }> => {
    const stepEntries = raw.split(/\bStep\s+\d+:\s*/i).filter(Boolean);
    return stepEntries
      .map(desc => desc
        .trim()
        .replace(/\|$/, '')
        .replace(/\s*\((?:complete|completed)\)\.?$/i, '')
        .trim())
      .filter(Boolean)
      .slice(0, 10)
      .map(desc => ({ id: `step_${uuid().slice(0, 12)}`, description: desc, completed: false }));
  };

  const toCharacterStateSnapshotPayload = (
    character: Character & { previousNames?: string[] },
  ): CharacterStateSnapshotPayload => ({
    nicknames: character.nicknames,
    previousNames: cloneData(character.previousNames || []),
    location: character.location,
    scenePosition: character.scenePosition,
    currentMood: character.currentMood,
    physicalAppearance: cloneData(character.physicalAppearance || defaultPhysicalAppearance),
    currentlyWearing: cloneData(character.currentlyWearing || defaultCurrentlyWearing),
    preferredClothing: cloneData(character.preferredClothing || defaultPreferredClothing),
    sections: cloneData(character.sections || []),
    goals: cloneData(character.goals || []),
    personality: character.personality ? cloneData(character.personality) : undefined,
    background: character.background ? cloneData(character.background) : undefined,
    tone: character.tone ? cloneData(character.tone) : undefined,
    keyLifeEvents: character.keyLifeEvents ? cloneData(character.keyLifeEvents) : undefined,
    relationships: character.relationships ? cloneData(character.relationships) : undefined,
    secrets: character.secrets ? cloneData(character.secrets) : undefined,
    fears: character.fears ? cloneData(character.fears) : undefined,
    _fieldChangeMetadata: cloneData((character as any)._fieldChangeMetadata || {}),
  });

  const toSideCharacterStateSnapshotPayload = (
    character: SideCharacter,
  ): SideCharacterStateSnapshotPayload => ({
    name: character.name,
    nicknames: character.nicknames,
    age: character.age,
    sexType: character.sexType,
    sexualOrientation: character.sexualOrientation,
    location: character.location,
    scenePosition: character.scenePosition,
    currentMood: character.currentMood,
    controlledBy: character.controlledBy,
    characterRole: character.characterRole,
    roleDescription: character.roleDescription,
    physicalAppearance: cloneData(character.physicalAppearance || defaultPhysicalAppearance),
    currentlyWearing: cloneData(character.currentlyWearing || defaultCurrentlyWearing),
    preferredClothing: cloneData(character.preferredClothing || defaultPreferredClothing),
    background: cloneData(character.background || {}),
    personality: cloneData(character.personality || {}),
    sections: cloneData(character.sections || []),
    avatarDataUrl: character.avatarDataUrl,
    avatarPosition: character.avatarPosition ? cloneData(character.avatarPosition) : undefined,
    extractedTraits: cloneData(character.extractedTraits || []),
    _fieldChangeMetadata: cloneData((character as any)._fieldChangeMetadata || {}),
  });

  const applyUpdatesToCharacterSnapshot = (
    effectiveChar: Character & { previousNames?: string[] },
    charUpdates: ExtractedUpdate[],
  ): Character & { previousNames?: string[] } => {
    const nextState = cloneData({
      ...effectiveChar,
      sections: cloneData(effectiveChar.sections || []),
      goals: cloneData(effectiveChar.goals || []),
      physicalAppearance: cloneData(effectiveChar.physicalAppearance || {}),
      currentlyWearing: cloneData(effectiveChar.currentlyWearing || {}),
      preferredClothing: cloneData(effectiveChar.preferredClothing || {}),
      background: cloneData(effectiveChar.background || {}),
      tone: cloneData(effectiveChar.tone || {}),
      keyLifeEvents: cloneData(effectiveChar.keyLifeEvents || {}),
      relationships: cloneData(effectiveChar.relationships || {}),
      secrets: cloneData(effectiveChar.secrets || {}),
      fears: cloneData(effectiveChar.fears || {}),
      personality: effectiveChar.personality ? cloneData(effectiveChar.personality) : undefined,
      previousNames: cloneData(effectiveChar.previousNames || []),
    }) as Character & { previousNames?: string[] };

    for (const update of charUpdates) {
      const { field, value } = update;
      if (!isAllowedExtractionField(field)) continue;

      if (field.startsWith('goals.')) {
        const goalTitle = field.slice(6);
        if (!goalTitle) continue;
        const existingGoals = [...(nextState.goals || [])];

        if (value.trim().toUpperCase() === 'REMOVE') continue;

        const parsedGoalUpdate = parseExtractedGoalUpdateValue(value);
        const desiredOutcome = parsedGoalUpdate.desiredOutcome;
        let currentStatus = parsedGoalUpdate.currentStatus;
        let progress = parsedGoalUpdate.progress ?? 0;

        let existingGoalIndex = existingGoals.findIndex(g => g.title.toLowerCase() === goalTitle.toLowerCase());
        if (existingGoalIndex === -1) {
          existingGoalIndex = findSimilarGoalIndex(existingGoals, goalTitle, desiredOutcome);
        }

        if (existingGoalIndex !== -1) {
          const existingGoal = existingGoals[existingGoalIndex];
          const updatedSteps = [...(existingGoal.steps || [])];
          if (!parsedGoalUpdate.hasProgress) progress = existingGoal.progress || 0;
          if (!parsedGoalUpdate.hasCurrentStatus) currentStatus = existingGoal.currentStatus || '';
          for (const idx of parsedGoalUpdate.completeStepIndexes) {
            if (idx >= 1 && idx <= updatedSteps.length) {
              updatedSteps[idx - 1] = {
                ...updatedSteps[idx - 1],
                completed: true,
                completedAt: Date.now(),
                completedDay: currentDay,
                completedTimeOfDay: currentTimeOfDay,
              };
            }
          }
          if (updatedSteps.length > 0) {
            const completedCount = updatedSteps.filter(s => s.completed).length;
            progress = Math.round((completedCount / updatedSteps.length) * 100);
          }
          existingGoals[existingGoalIndex] = {
            ...existingGoal,
            currentStatus: currentStatus || existingGoal.currentStatus || '',
            progress,
            steps: updatedSteps,
            ...(desiredOutcome ? { desiredOutcome } : {}),
            updatedAt: Date.now(),
          };
        } else {
          const hasDurableOutcome = Boolean(desiredOutcome && !isTaskLevelGoalText(desiredOutcome));
          if (isTaskLevelGoalText(goalTitle) && !hasDurableOutcome) {
            continue;
          }
          const parsedSteps = parsedGoalUpdate.newStepsText
            ? parseGoalSteps(parsedGoalUpdate.newStepsText).filter(step => !isTaskLevelGoalText(step.description))
            : [];

          existingGoals.push({
            id: `goal_${uuid().slice(0, 12)}`,
            title: goalTitle,
            desiredOutcome,
            currentStatus: currentStatus || 'Goal newly established.',
            progress,
            steps: parsedSteps,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            flexibility: 'normal',
          });
        }
        nextState.goals = existingGoals;
        continue;
      }

      if (field.startsWith('sections.')) {
        const parts = field.split('.');
        if (parts.length < 3) continue;
        const sectionTitle = parts[1];
        const itemLabel = parts.slice(2).join('.');
        const sections = [...(nextState.sections || [])];
        let sectionIndex = sections.findIndex(s => s.title.toLowerCase() === sectionTitle.toLowerCase());
        if (sectionIndex === -1) {
          sections.push({
            id: `section_${uuid().slice(0, 12)}`,
            title: sectionTitle,
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          sectionIndex = sections.length - 1;
        }
        const section = { ...sections[sectionIndex], items: [...(sections[sectionIndex].items || [])], updatedAt: Date.now() };
        const itemIndex = section.items.findIndex(item => item.label.toLowerCase() === itemLabel.toLowerCase());
        if (itemIndex === -1) {
          section.items.push({
            id: `item_${uuid().slice(0, 12)}`,
            label: itemLabel,
            value,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else {
          section.items[itemIndex] = {
            ...section.items[itemIndex],
            value,
            updatedAt: Date.now(),
          };
        }
        sections[sectionIndex] = section;
        nextState.sections = sections;
        continue;
      }

      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const normalizedChild = parent === 'preferredClothing' && child === 'underwear' ? 'undergarments' : child;
        if (parent === 'physicalAppearance' || parent === 'currentlyWearing' || parent === 'preferredClothing' || parent === 'background') {
          const target = cloneData((nextState as any)[parent] || {});
          if (normalizedChild === '_extras') {
            const extras = [...(target._extras || [])];
            upsertExtrasEntry(extras, value);
            target._extras = extras;
          } else {
            target[normalizedChild] = value;
          }
          (nextState as any)[parent] = target;
          continue;
        }

        if (parent === 'personality') {
          const personality = cloneData(nextState.personality || { splitMode: false, traits: [], outwardTraits: [], inwardTraits: [] });
          if (normalizedChild === 'splitMode') {
            personality.splitMode = value.trim().toLowerCase() === 'true';
          } else if (normalizedChild === 'traits' || normalizedChild === 'outwardTraits' || normalizedChild === 'inwardTraits') {
            let newTraits: Array<{ label: string; value: string }> = [];
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) newTraits = parsed;
            } catch {
              const traitParts = value.split(/,\s*(?=[A-Z])/);
              for (const part of traitParts) {
                const colonIdx = part.indexOf(':');
                if (colonIdx > 0) newTraits.push({ label: part.slice(0, colonIdx).trim(), value: part.slice(colonIdx + 1).trim() });
                else if (part.trim()) newTraits.push({ label: part.trim(), value: '' });
              }
            }
            const existingTraits = [...((personality as any)[normalizedChild] || [])];
            for (const nt of newTraits) {
              const exactIndex = existingTraits.findIndex((t: any) => t.label.toLowerCase() === nt.label.toLowerCase());
              if (exactIndex !== -1) {
                if (shouldRefineExistingText(existingTraits[exactIndex].value || '', nt.value || '')) {
                  existingTraits[exactIndex] = { ...existingTraits[exactIndex], value: nt.value };
                }
              } else {
                const nearDupIdx = findNearDuplicateTraitIndex(existingTraits, nt.label, nt.value);
                if (nearDupIdx !== -1) {
                  const existing = existingTraits[nearDupIdx];
                  if (shouldRefineExistingText(existing.value || '', nt.value || '')) {
                    existingTraits[nearDupIdx] = { ...existing, value: nt.value };
                  }
                } else {
                  existingTraits.push({ id: `trait_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label: nt.label, value: nt.value, flexibility: 'normal' });
                }
              }
            }
            (personality as any)[normalizedChild] = existingTraits;
          }
          nextState.personality = personality;
          continue;
        }

        if (['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'].includes(parent) && normalizedChild === '_extras') {
          const sectionKey = parent as 'tone' | 'keyLifeEvents' | 'relationships' | 'secrets' | 'fears';
          const section = cloneData((nextState as any)[sectionKey] || {});
          const extras = [...(section._extras || [])];
          upsertExtrasEntry(extras, value);
          section._extras = extras;
          (nextState as any)[sectionKey] = section;
          continue;
        }
      }

      if (field === 'currentMood') {
        const sanitizedMood = sanitizeMoodValue(value);
        if (sanitizedMood) nextState.currentMood = sanitizedMood;
      } else if (field === 'scenePosition') {
        const sanitizedScenePosition = sanitizeScenePositionValue(value);
        if (sanitizedScenePosition) nextState.scenePosition = sanitizedScenePosition;
      } else {
        (nextState as any)[field] = value;
      }
    }

    return nextState;
  };

  const applyUpdatesToSideCharacterSnapshot = (
    effectiveChar: SideCharacter,
    charUpdates: ExtractedUpdate[],
  ): SideCharacter => {
    const nextState = cloneData({
      ...effectiveChar,
      sections: cloneData(effectiveChar.sections || []),
      physicalAppearance: cloneData(effectiveChar.physicalAppearance || {}),
      currentlyWearing: cloneData(effectiveChar.currentlyWearing || {}),
      preferredClothing: cloneData(effectiveChar.preferredClothing || {}),
      background: cloneData(effectiveChar.background || {}),
      personality: cloneData(effectiveChar.personality || {}),
      extractedTraits: cloneData(effectiveChar.extractedTraits || []),
    }) as SideCharacter;

    for (const update of charUpdates) {
      const { field, value } = update;
      if (!isAllowedExtractionField(field)) continue;

      if (field.startsWith('sections.')) {
        const parts = field.split('.');
        if (parts.length < 3) continue;
        const sectionTitle = parts[1];
        const itemLabel = parts.slice(2).join('.');
        const sections = [...(nextState.sections || [])];
        let sectionIndex = sections.findIndex(s => s.title.toLowerCase() === sectionTitle.toLowerCase());
        if (sectionIndex === -1) {
          sections.push({
            id: `section_${uuid().slice(0, 12)}`,
            title: sectionTitle,
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          sectionIndex = sections.length - 1;
        }
        const section = { ...sections[sectionIndex], items: [...(sections[sectionIndex].items || [])], updatedAt: Date.now() };
        const itemIndex = section.items.findIndex(item => item.label.toLowerCase() === itemLabel.toLowerCase());
        if (itemIndex === -1) {
          section.items.push({
            id: `item_${uuid().slice(0, 12)}`,
            label: itemLabel,
            value,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else {
          section.items[itemIndex] = {
            ...section.items[itemIndex],
            value,
            updatedAt: Date.now(),
          };
        }
        sections[sectionIndex] = section;
        nextState.sections = sections;
        continue;
      }

      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const normalizedChild = parent === 'preferredClothing' && child === 'underwear' ? 'undergarments' : child;

        if (parent === 'physicalAppearance' || parent === 'currentlyWearing' || parent === 'preferredClothing' || parent === 'background') {
          const target = cloneData((nextState as any)[parent] || {});
          if (normalizedChild === '_extras') {
            const extras = [...(target._extras || [])];
            upsertExtrasEntry(extras, value);
            target._extras = extras;
          } else {
            target[normalizedChild] = value;
          }
          (nextState as any)[parent] = target;
          continue;
        }

        if (parent === 'personality') {
          const personality = cloneData(nextState.personality || defaultSideCharacterPersonality);
          if (normalizedChild === 'traits') {
            let newTraits: string[] = [];
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                newTraits = parsed.map(normalizeSideCharacterTraitText).filter(Boolean);
              }
            } catch {
              newTraits = value.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
            }

            const existingTraits = [...(personality.traits || [])]
              .map((trait) => normalizeSideCharacterTraitText(trait))
              .filter(Boolean);
            for (const nextTrait of newTraits) {
              const exactIndex = existingTraits.findIndex((trait) => trait.toLowerCase() === nextTrait.toLowerCase());
              if (exactIndex !== -1) {
                if (shouldRefineExistingText(existingTraits[exactIndex] || '', nextTrait || '')) {
                  existingTraits[exactIndex] = nextTrait;
                }
              } else {
                const nearDupIdx = findNearDuplicateStringIndex(existingTraits, nextTrait);
                if (nearDupIdx !== -1) {
                  const existing = existingTraits[nearDupIdx];
                  if (shouldRefineExistingText(existing || '', nextTrait || '')) {
                    existingTraits[nearDupIdx] = nextTrait;
                  }
                } else {
                  existingTraits.push(nextTrait);
                }
              }
            }
            personality.traits = existingTraits;
          } else {
            (personality as any)[normalizedChild] = value;
          }
          nextState.personality = personality;
          continue;
        }
      }

      if (field === 'currentMood') {
        const sanitizedMood = sanitizeMoodValue(value);
        if (sanitizedMood) {
          nextState.currentMood = sanitizedMood;
        }
        continue;
      }

      if (field === 'scenePosition') {
        const sanitizedScenePosition = sanitizeScenePositionValue(value);
        if (sanitizedScenePosition) {
          nextState.scenePosition = sanitizedScenePosition;
        }
        continue;
      }

      (nextState as any)[field] = value;
    }

    return nextState;
  };

  // Apply extracted updates to canonical per-message state for main characters.
  const applyExtractedUpdates = async (updates: ExtractedUpdate[], meta?: ExtractionRequestMeta) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || updates.length === 0) return;
    if (!isMessageGenerationStillCurrent(meta?.sourceMessageId, meta?.sourceMessageGenerationId)) {
      debugLog('[applyExtractedUpdates] Discarded stale updates before persistence');
      return;
    }

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
      const sideChar = resolvedMatch?.kind === 'side' ? resolvedMatch.base : undefined;

      if (!mainChar && !sideChar) {
        debugLog(`[applyExtractedUpdates] Character not found: ${charNameLower}`);
      }

      if (mainChar) {
        if (!meta?.sourceMessageId || !meta?.sourceMessageGenerationId) {
          debugLog(`[applyExtractedUpdates] Missing canonical source metadata for ${mainChar.name}; skipping main-character snapshot persist`);
          continue;
        }

        if (!isMessageGenerationStillCurrent(meta.sourceMessageId, meta.sourceMessageGenerationId)) {
          debugLog(`[applyExtractedUpdates] Discarded stale main-character snapshot before persist for ${mainChar.name}`);
          return;
        }

        const effectiveChar = computeEffectiveCharacter(mainChar, buildCurrentCharacterSnapshotMap());
        const nextEffectiveChar = applyUpdatesToCharacterSnapshot(effectiveChar, charUpdates);
        const currentPayload = toCharacterStateSnapshotPayload(effectiveChar);
        const nextPayload = stampFieldChangeMetadata(
          currentPayload,
          toCharacterStateSnapshotPayload(nextEffectiveChar),
          charUpdates,
          {
            sourceMessageId: meta.sourceMessageId,
            sourceMessageGenerationId: meta.sourceMessageGenerationId,
          },
        );

        if (JSON.stringify(currentPayload) === JSON.stringify(nextPayload)) {
          debugLog(`[applyExtractedUpdates] No canonical delta for ${mainChar.name}`);
          continue;
        }

        showCharacterUpdateIndicator(mainChar.id);

        const persistedSnapshot = await supabaseData.upsertCharacterStateMessageSnapshot({
          conversationId,
          characterId: mainChar.id,
          userId: user.id,
          sourceMessageId: meta.sourceMessageId,
          sourceGenerationId: meta.sourceMessageGenerationId,
          statePayload: nextPayload,
        });

        upsertCharacterSnapshotInRuntimeState(persistedSnapshot);

        debugLog(`[applyExtractedUpdates] Persisted canonical snapshot for ${mainChar.name}:`, Object.keys(nextPayload));
      } else if (sideChar) {
        if (!meta?.sourceMessageId || !meta?.sourceMessageGenerationId) {
          debugLog(`[applyExtractedUpdates] Missing canonical source metadata for ${sideChar.name}; skipping side-character snapshot persist`);
          continue;
        }

        if (!isMessageGenerationStillCurrent(meta.sourceMessageId, meta.sourceMessageGenerationId)) {
          debugLog(`[applyExtractedUpdates] Discarded stale side-character snapshot before persist for ${sideChar.name}`);
          return;
        }

        const effectiveSideChar = computeEffectiveSideCharacter(sideChar, buildCurrentSideCharacterSnapshotMap());
        const nextEffectiveSideChar = applyUpdatesToSideCharacterSnapshot(effectiveSideChar, charUpdates);
        const currentPayload = toSideCharacterStateSnapshotPayload(effectiveSideChar);
        const nextPayload = stampFieldChangeMetadata(
          currentPayload,
          toSideCharacterStateSnapshotPayload(nextEffectiveSideChar),
          charUpdates,
          {
            sourceMessageId: meta.sourceMessageId,
            sourceMessageGenerationId: meta.sourceMessageGenerationId,
          },
        );

        if (JSON.stringify(currentPayload) === JSON.stringify(nextPayload)) {
          debugLog(`[applyExtractedUpdates] No canonical delta for ${sideChar.name}`);
          continue;
        }

        showCharacterUpdateIndicator(sideChar.id);

        const persistedSnapshot = await supabaseData.upsertSideCharacterMessageSnapshot({
          conversationId,
          sideCharacterId: sideChar.id,
          userId: user.id,
          sourceMessageId: meta.sourceMessageId,
          sourceGenerationId: meta.sourceMessageGenerationId,
          statePayload: nextPayload,
        });

        upsertSideCharacterSnapshotInRuntimeState(persistedSnapshot);

        debugLog(`[applyExtractedUpdates] Persisted canonical side-character snapshot for ${sideChar.name}:`, Object.keys(nextPayload));
      } else {
        debugLog(`[applyExtractedUpdates] Character not found: ${charNameLower}`);
      }
    }
  };

  const queueAssistantMemoryExtraction = useCallback((userMessage: string, aiResponse: string, sourceMessage: Message) => {
    if (!memoriesEnabled) return;
    const combinedTextLength = (userMessage?.length || 0) + (aiResponse?.length || 0);
    const recentExistingMemories = activeMemories
      .slice(-20)
      .map((memory) => memory.content?.trim())
      .filter(Boolean) as string[];
    const isNearDuplicateMemory = (existing: string[], nextValue: string): boolean => {
      const normalize = (value: string): string =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      const toTokenSet = (value: string): Set<string> => {
        const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'at', 'from', 'is', 'are']);
        return new Set(normalize(value).split(/\s+/).filter((token) => token && !stopWords.has(token)));
      };
      const nextSet = toTokenSet(nextValue);
      if (nextSet.size === 0) return false;
      return existing.some((memory) => {
        const currentSet = toTokenSet(memory);
        if (currentSet.size === 0) return false;
        let overlap = 0;
        for (const token of currentSet) {
          if (nextSet.has(token)) overlap += 1;
        }
        return overlap / Math.max(currentSet.size, nextSet.size) >= 0.72;
      });
    };
    const messageText = [
      userMessage ? `USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `AI RESPONSE:\n${aiResponse}` : '',
    ].filter(Boolean).join('\n\n---\n\n');

    void trackAiUsageEvent({
      eventType: 'memory_extraction_call',
      eventSource: 'chat-interface',
      metadata: {
        conversationId,
        day: sourceMessage.day ?? currentDay,
        timeOfDay: sourceMessage.timeOfDay ?? currentTimeOfDay,
        inputChars: combinedTextLength,
        modelId,
      },
    });

    void trackApiValidationSnapshot({
      eventKey: 'validation.call2.memory_extract',
      eventSource: 'chat-interface.memory-extract',
      apiCallGroup: 'call_2',
      parentRowId: 'summary.call2.memory_extract',
      detailPresence: buildRequiredPresence([
        ['call2.memory_extract.message_text', messageText],
        ['call2.memory_extract.user_message', userMessage],
        ['call2.memory_extract.ai_response', aiResponse],
        ['call2.memory_extract.character_names', allCharacterNames],
        ['call2.memory_extract.recent_existing_memories', recentExistingMemories],
        ['call2.memory_extract.model_id', modelId],
      ]),
      diagnostics: {
        characterCount: allCharacterNames.length,
      },
    });

    const requestBody = {
      messageText,
      userMessage,
      aiResponse,
      characterNames: allCharacterNames,
      recentExistingMemories,
      modelId,
      debugTrace: isAdmin,
    };
    recordChatDebugSupportCall(sourceMessage, {
      id: 'call2.memory-extraction',
      label: 'Supporting Call - Memory extraction',
      apiCallGroup: 'call_2',
      endpoint: '/functions/v1/extract-memory-events',
      method: 'POST',
      capturedAt: Date.now(),
      status: 'sent',
      requestBody,
    });

    supabase.functions.invoke('extract-memory-events', {
      body: requestBody
    }).then(({ data, error }) => {
      const memoryDebug = splitEdgeDebugPayload(data);
      const memoryDebugStatus = buildSupportCallDebugStatus(error, memoryDebug.responseBody);
      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.memory-extraction',
        label: 'Supporting Call - Memory extraction',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/extract-memory-events',
        method: 'POST',
        capturedAt: Date.now(),
        status: memoryDebugStatus.status,
        requestBody,
        modelRequest: memoryDebug.modelRequest,
        modelRequests: memoryDebug.modelRequests,
        responseBody: memoryDebug.responseBody ?? null,
        error: memoryDebugStatus.error,
      });
      if (error || !data?.extractedEvents?.length) return;
      if (!isMessageGenerationStillCurrent(sourceMessage.id, sourceMessage.generationId)) {
        debugLog('[memoryExtraction] Discarded stale result for non-current turn');
        return;
      }

      const events: string[] = [];
      for (const event of data.extractedEvents as string[]) {
        const trimmed = event.trim();
        if (!trimmed) continue;
        if (isNearDuplicateMemory([...recentExistingMemories, ...events], trimmed)) continue;
        events.push(trimmed);
      }
      if (events.length === 0) return;

      void trackAiUsageEvent({
        eventType: 'memory_events_extracted',
        eventSource: 'chat-interface',
        count: events.length,
        metadata: {
          conversationId,
          day: sourceMessage.day ?? currentDay,
          timeOfDay: sourceMessage.timeOfDay ?? currentTimeOfDay,
          outputChars: events.join('\n').length,
        },
      });

      const combinedContent = events.length === 1
        ? events[0]
        : events.map((event: string) => `- ${event}`).join('\n');

      handleCreateMemory(
        combinedContent,
        sourceMessage.day ?? currentDay,
        sourceMessage.timeOfDay ?? currentTimeOfDay,
        sourceMessage.id,
        sourceMessage.generationId,
      );
    }).catch(err => {
      recordChatDebugSupportCall(sourceMessage, {
        id: 'call2.memory-extraction',
        label: 'Supporting Call - Memory extraction',
        apiCallGroup: 'call_2',
        endpoint: '/functions/v1/extract-memory-events',
        method: 'POST',
        capturedAt: Date.now(),
        status: 'error',
        requestBody,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error('[queueAssistantMemoryExtraction] Memory extraction failed:', err);
    });
  }, [
    allCharacterNames,
    activeMemories,
    conversationId,
    currentDay,
    currentTimeOfDay,
    handleCreateMemory,
    isMessageGenerationStillCurrent,
    isAdmin,
    memoriesEnabled,
    modelId,
    recordChatDebugSupportCall,
  ]);

  const {
    queueAssistantDerivedWorkAfterSourcePersist,
  } = usePostTurnSupportQueue<ExtractedUpdate>({
    conversationId,
    saveNewMessages: supabaseData.saveNewMessages,
    queueMemoryExtraction: queueAssistantMemoryExtraction,
    evaluateGoalProgress,
    evaluateGoalAlignment,
    extractCharacterUpdatesFromDialogue,
    applyExtractedUpdates,
    debugLog,
  });

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
    if (!input.trim() || !conversation || isStreaming || !canUseCanonicalChatState) return;

    const userMsg: Message = {
      id: uuid(),
      generationId: uuid(),
      role: 'user',
      text: input,
      day: currentDay,
      timeOfDay: currentTimeOfDay,
      createdAt: now()
    };
    const nextConvsWithUser = appData.conversations.map(c =>
      c.id === conversationId ? { ...c, messages: [...c.messages, userMsg], updatedAt: now() } : c
    );

    latestConversationsRef.current = nextConvsWithUser;
    onUpdate(nextConvsWithUser);
    const userInput = input;
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setFormattedStreamingContent('');

    let pendingDebugTrace: ChatDebugTrace | null = null;
    let pendingCall1Request: ChatDebugRequestRecord | null = null;
    let pendingStyleTelemetryCall: ChatDebugRequestRecord | null = null;

    try {
      const llmAppData = buildLLMAppData();
	      // Issue #8: Detect user-authored AI character content and prepend an established-fact note.
      const establishedFactNote = buildEstablishedFactNote(input, establishedFactNoteCharacters);
      const currentResponseLengths = getAssistantResponseLengths(conversation.messages);
      const styleEvidenceMessages = filterRoleplayMessagesForStyleEvidence(conversation.messages);
      const recentStyleTelemetry = analyzeRecentAssistantStyle(
        styleEvidenceMessages,
        currentResponseLengths,
        llmAppData.uiSettings?.responseVerbosity,
      );
      sessionMessageCountRef.current += 1;

      const llmInput = establishedFactNote + input;
      const responseResult = await collectRoleplayResponse({
        appData: llmAppData,
        conversationId,
        userMessage: llmInput,
        modelId,
        currentDay,
        currentTimeOfDay,
        memories: activeMemories,
        memoriesEnabled,
        sessionMessageCount: sessionMessageCountRef.current,
        activeScene: canonicalActiveScene,
        debugTrace: isAdmin,
        placeholderMap: placeholderMapRef.current,
        knownCharacterNames: getKnownCharacterNames(effectiveAppData),
        sanitizeAssistantOutput,
        streamToUi: false,
        onStreamingContent: setStreamingContent,
        onFormattedStreamingContent: setFormattedStreamingContent,
      });
      const cleanedText = responseResult.cleanedText;
      pendingDebugTrace = responseResult.debugTrace;
      pendingCall1Request = responseResult.call1Request;
      const candidateStyleTelemetry = analyzeAssistantCandidateStyle(
        styleEvidenceMessages,
        cleanedText,
        currentResponseLengths,
      );
      pendingStyleTelemetryCall = buildAssistantStyleTelemetryCall('send', recentStyleTelemetry, candidateStyleTelemetry);

      const liveConversation = latestConversationsRef.current.find(c => c.id === conversationId);
      const liveUserMessage = liveConversation?.messages.find(message => message.id === userMsg.id);
      if (!liveConversation || !liveUserMessage || (liveUserMessage.generationId || liveUserMessage.id) !== (userMsg.generationId || userMsg.id)) {
        debugLog('[handleSend] Skipping assistant commit because the triggering user message changed before completion.');
        return;
      }
      placeholderMapRef.current = responseResult.placeholderMap;

      const aiMessageId = uuid();
      const aiMsg: Message = {
        id: aiMessageId,
        generationId: uuid(),
        role: 'assistant',
        text: cleanedText,
        day: currentDay,
        timeOfDay: currentTimeOfDay,
	        createdAt: now()
	      };
      const nextConvsWithAi = latestConversationsRef.current.map(c => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          messages: [...c.messages, aiMsg],
          updatedAt: now(),
        };
      });
      latestConversationsRef.current = nextConvsWithAi;
      const updatedConversation = nextConvsWithAi.find(c => c.id === conversationId);
      if (updatedConversation) syncAssistantResponseLengths(updatedConversation.messages);
      onUpdate(nextConvsWithAi);
      onSaveScenario(nextConvsWithAi);
      saveChatDebugTrace(aiMsg, pendingDebugTrace, pendingCall1Request);
      if (pendingStyleTelemetryCall) recordChatDebugSupportCall(aiMsg, pendingStyleTelemetryCall);
      queueAssistantDerivedWorkAfterSourcePersist([userMsg, aiMsg], userInput, cleanedText, aiMsg);

      // Process AI response for new character detection
      processResponseForNewCharacters(cleanedText, aiMsg);
    } catch (err) {
      console.error(err);
      if (err instanceof ContentFilteredChatError) {
        const errorDebug = readRoleplayRequestDebugFromError(err, pendingDebugTrace, pendingCall1Request);
        const latestBase = latestConversationsRef.current;
        const liveConversation = latestBase.find(c => c.id === conversationId);
        const liveUserMessage = liveConversation?.messages.find(message => message.id === userMsg.id);
        if (!liveConversation || !liveUserMessage || (liveUserMessage.generationId || liveUserMessage.id) !== (userMsg.generationId || userMsg.id)) {
          debugLog('[handleSend] Skipping content-filter notice because the triggering user message changed before completion.');
          return;
        }
        appendContentFilterNotice(
          latestBase,
          err,
          errorDebug.trace,
          errorDebug.call1Request,
        );
        return;
      }
      const message = err instanceof Error ? err.message : "Dialogue stream failed. Check your connection or model settings.";
      const errorDebug = readRoleplayRequestDebugFromError(err, pendingDebugTrace, pendingCall1Request);
      const latestBase = latestConversationsRef.current;
      const liveConversation = latestBase.find(c => c.id === conversationId);
      const liveUserMessage = liveConversation?.messages.find(message => message.id === userMsg.id);
      if (!liveConversation || !liveUserMessage || (liveUserMessage.generationId || liveUserMessage.id) !== (userMsg.generationId || userMsg.id)) {
        debugLog('[handleSend] Skipping provider-error notice because the triggering user message changed before completion.');
        return;
      }
      appendProviderErrorNotice(
        latestBase,
        message,
        errorDebug.trace,
        errorDebug.call1Request,
      );
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setFormattedStreamingContent('');
    }
  };

  const handleCopyMessage = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleDialogDebugToggle = (enabled: boolean) => {
    setDialogDebugEnabled(enabled);
    try {
      window.localStorage.setItem(DIALOG_DEBUG_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // Local debug toggle should not affect chat if browser storage is unavailable.
    }
  };

  const openDialogDebugComment = (message: Message) => {
    const existing = dialogDebugComments[buildDialogDebugCommentKey(message.id, message.generationId)];
    setActiveDialogDebugMessage(message);
    setDialogDebugDraft(existing?.note || '');
    setDialogDebugTagDraft(existing?.tags || []);
  };

  const closeDialogDebugComment = () => {
    setActiveDialogDebugMessage(null);
    setDialogDebugDraft('');
    setDialogDebugTagDraft([]);
  };

  const toggleDialogDebugTag = (tag: ChatDebugIssueTag) => {
    setDialogDebugTagDraft((current) => (
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : normalizeDialogDebugTags([...current, tag])
    ));
  };

  const handleDialogDebugCommentSave = () => {
    if (!activeDialogDebugMessage) return;
    const note = dialogDebugDraft.trim();
    const tags = normalizeDialogDebugTags(dialogDebugTagDraft);
    const generationId = activeDialogDebugMessage.generationId || activeDialogDebugMessage.id;
    const commentKey = buildDialogDebugCommentKey(activeDialogDebugMessage.id, generationId);
    const existing = dialogDebugComments[commentKey];
    const nextComments = { ...dialogDebugComments };

    if (note || tags.length > 0) {
      nextComments[commentKey] = {
        messageId: activeDialogDebugMessage.id,
        generationId,
        note,
        tags,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      delete nextComments[commentKey];
    }

    setDialogDebugComments(nextComments);
    saveDialogDebugComments(scenarioId, conversationId, nextComments);
    if (user?.id) {
      const nextComment = nextComments[commentKey];
      const persistenceTask = nextComment
        ? supabaseData.upsertConversationDialogDebugComments({
            conversationId,
            userId: user.id,
            comments: [nextComment],
          })
        : supabaseData.deleteConversationDialogDebugComment(
            conversationId,
            activeDialogDebugMessage.id,
            generationId,
          );
      Promise.resolve(persistenceTask).catch((error) => {
        console.error('[dialogDebugComments] Failed to persist playthrough note:', error);
      });
    }
    closeDialogDebugComment();
  };

  const handleDeleteMessage = (messageId: string) => {
    const nextComments = stripDialogDebugCommentsForMessage(dialogDebugComments, messageId);
    if (!dialogDebugCommentsEqual(nextComments, dialogDebugComments)) {
      setDialogDebugComments(nextComments);
      saveDialogDebugComments(scenarioId, conversationId, nextComments);
    }

    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: now() }
        : c
    );
    latestConversationsRef.current = updatedConvs;
    onUpdate(updatedConvs);
    supabaseData.deleteConversationMessage(messageId).catch(err => {
      console.error('[handleDeleteMessage] Failed to delete message:', err);
    });
  };

  const handleEditMessage = () => {
    if (!editingMessage || !editText.trim()) return;

    const updatedMessage: Message = {
      ...editingMessage,
      text: editText,
      generationId: uuid(),
    };

    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? {
            ...c,
            messages: c.messages.map(m =>
              m.id === editingMessage.id ? updatedMessage : m
            ),
            updatedAt: now()
          }
        : c
    );
    latestConversationsRef.current = updatedConvs;
    onUpdate(updatedConvs);
    supabaseData.saveNewMessages(conversationId, [updatedMessage]).catch(err => {
      console.error('[handleEditMessage] Failed to persist edited message:', err);
    });
    setEditingMessage(null);
    setEditText('');
  };

  const handleInlineEditSave = () => {
    const inlineEditedText = buildInlineEditedMessageText(inlineEditSegments, inlineEditSystemTags);
    if (!inlineEditingId || !inlineEditedText.trim()) return;
    const targetMessage = conversation?.messages.find((message) => message.id === inlineEditingId);
    if (!targetMessage) return;

    const updatedMessage: Message = {
      ...targetMessage,
      text: inlineEditedText,
      generationId: uuid(),
    };

    const updatedConvs = appData.conversations.map(c =>
      c.id === conversationId
        ? {
            ...c,
            messages: c.messages.map(m =>
              m.id === inlineEditingId ? updatedMessage : m
            ),
            updatedAt: now()
          }
        : c
    );
    latestConversationsRef.current = updatedConvs;
    onUpdate(updatedConvs);
    supabaseData.saveNewMessages(conversationId, [updatedMessage]).catch(err => {
      console.error('[handleInlineEditSave] Failed to persist inline edit:', err);
    });
    setInlineEditingId(null);
    setInlineEditSegments([]);
    setInlineEditSystemTags([]);
  };

  const handleInlineEditCancel = () => {
    setInlineEditingId(null);
    setInlineEditSegments([]);
    setInlineEditSystemTags([]);
  };

  const openInlineMessageEditor = (msg: Message, isAi: boolean) => {
    const userChar = effectiveMainCharacters.find(c => c.controlledBy === 'User') || null;
    setInlineEditingId(msg.id);
    setInlineEditSystemTags(extractHiddenMessageTags(msg.text));
    setInlineEditSegments(
      buildEditableMessageSegments(
        msg.text,
        isAi,
        effectiveAppData,
        userChar,
        resolveCanonicalSpeakerName
      )
    );
  };

  const handleRegenerateMessage = async (messageId: string) => {
    const conv = conversation;
    if (!conv || !canUseCanonicalChatState) return;

    const msgIndex = conv.messages.findIndex(m => m.id === messageId);
    if (msgIndex < 1) return;
    const existingMessage = conv.messages[msgIndex];
    if (!existingMessage || existingMessage.role !== 'assistant') {
      console.warn('[handleRegenerate] Target message missing during regenerate:', messageId);
      return;
    }
    const expectedGenerationId = existingMessage.generationId || existingMessage.id;

    // Search backward from msgIndex for the nearest user message
    let userMessage: Message | undefined;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (conv.messages[i]?.role === 'user') {
        userMessage = conv.messages[i];
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

    let pendingDebugTrace: ChatDebugTrace | null = null;
    let pendingCall1Request: ChatDebugRequestRecord | null = null;
    let pendingStyleTelemetryCall: ChatDebugRequestRecord | null = null;

    try {
      // Strip the old AI response AND the triggering user message from context
      // (generateRoleplayResponseStream will re-add the user message as the final turn,
      //  so including it in history would duplicate it and reinforce confirmation loops)
      const userMsgIdx = conv?.messages.findIndex(m => m.id === userMessage.id) ?? msgIndex;
      const truncateAt = userMsgIdx >= 0 ? userMsgIdx : msgIndex;
      const truncatedMessages = conv?.messages.slice(0, truncateAt) || [];
      const truncatedStyleEvidenceMessages = filterRoleplayMessagesForStyleEvidence(truncatedMessages);
      const truncatedAppData = buildLLMAppData({ conversationMessages: truncatedMessages });
      const truncatedMemories = buildActiveMemories(
        memories,
        buildMessageGenerationMap(truncatedMessages),
      );
      const truncatedResponseLengths = getAssistantResponseLengths(truncatedMessages);

	      // Apply the established-fact note to regenerate flow so user-authored AI dialogue is preserved.
      const establishedFactNote = buildEstablishedFactNote(userMessage.text, establishedFactNoteCharacters);
      const previousAssistantContext = existingMessage.text?.trim()
        ? `\n\n[PREVIOUS ASSISTANT RESPONSE BEING REGENERATED - REFERENCE ONLY]\nThis text is the assistant response being replaced. Do not continue from it as story state. Use it only to preserve broad direction and avoid repeating the same wording, structure, or execution.\n${existingMessage.text.trim()}`
        : '';
      const regenInput = establishedFactNote + userMessage.text + previousAssistantContext;
      const recentStyleTelemetry = analyzeRecentAssistantStyle(
        truncatedStyleEvidenceMessages,
        truncatedResponseLengths,
        truncatedAppData.uiSettings?.responseVerbosity,
      );

      // Regeneration is text-variation only: avoid mutating persistent character state here.

      const responseResult = await collectRoleplayResponse({
        appData: truncatedAppData,
        conversationId,
        userMessage: regenInput,
        modelId,
        currentDay,
        currentTimeOfDay,
        memories: truncatedMemories,
        memoriesEnabled,
        isRegeneration: true,
        activeScene: canonicalActiveScene,
        debugTrace: isAdmin,
        placeholderMap: placeholderMapRef.current,
        knownCharacterNames: getKnownCharacterNames(effectiveAppData),
        sanitizeAssistantOutput,
        streamToUi: false,
        onStreamingContent: setStreamingContent,
        onFormattedStreamingContent: setFormattedStreamingContent,
      });
      const cleanedText = responseResult.cleanedText;
      pendingDebugTrace = responseResult.debugTrace;
      pendingCall1Request = responseResult.call1Request;
      const candidateStyleTelemetry = analyzeAssistantCandidateStyle(
        truncatedStyleEvidenceMessages,
        cleanedText,
        truncatedResponseLengths,
        [existingMessage.text],
      );
      pendingStyleTelemetryCall = buildAssistantStyleTelemetryCall('regenerate', recentStyleTelemetry, candidateStyleTelemetry);

      // UPDATE IN-PLACE: Replace the existing message instead of creating a new one
      const regeneratedMessage = {
        ...existingMessage,
        text: cleanedText,
        day: currentDay,
        timeOfDay: currentTimeOfDay,
        createdAt: now(),
        generationId: uuid(),
      };

      const liveConversation = latestConversationsRef.current.find(c => c.id === conversationId);
      const liveTargetMessage = liveConversation?.messages.find(m => m.id === messageId);
      if (!liveConversation || !liveTargetMessage || (liveTargetMessage.generationId || liveTargetMessage.id) !== expectedGenerationId) {
        debugLog('[handleRegenerate] Skipping assistant commit because the target message changed before completion.');
        return;
      }
      placeholderMapRef.current = responseResult.placeholderMap;

      const updatedConvs = latestConversationsRef.current.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === messageId
                  ? regeneratedMessage
                  : m
              ),
              updatedAt: now()
            }
          : c
      );
      latestConversationsRef.current = updatedConvs;
      const updatedConversation = updatedConvs.find(c => c.id === conversationId);
      if (updatedConversation) syncAssistantResponseLengths(updatedConversation.messages);
      onUpdate(updatedConvs);
      saveChatDebugTrace(regeneratedMessage, pendingDebugTrace, pendingCall1Request);
      if (pendingStyleTelemetryCall) recordChatDebugSupportCall(regeneratedMessage, pendingStyleTelemetryCall);
      regenerateEventsRef.current.push({
        messageId,
        generationId: regeneratedMessage.generationId || regeneratedMessage.id,
        timestamp: Date.now(),
      });
      queueAssistantDerivedWorkAfterSourcePersist([regeneratedMessage], userMessage.text, cleanedText, regeneratedMessage);

      // Process for new characters after normalization
      processResponseForNewCharacters(cleanedText, regeneratedMessage);
    } catch (err) {
      console.error(err);
      if (err instanceof ContentFilteredChatError) {
        const errorDebug = readRoleplayRequestDebugFromError(err, pendingDebugTrace, pendingCall1Request);
        const latestBase = latestConversationsRef.current;
        const liveConversation = latestBase.find(c => c.id === conversationId);
        const liveTargetMessage = liveConversation?.messages.find(m => m.id === messageId);
        if (!liveConversation || !liveTargetMessage || (liveTargetMessage.generationId || liveTargetMessage.id) !== expectedGenerationId) {
          debugLog('[handleRegenerate] Skipping content-filter notice because the target message changed before completion.');
          return;
        }
        appendContentFilterNotice(
          latestBase,
          err,
          errorDebug.trace,
          errorDebug.call1Request,
        );
        return;
      }
      const message = err instanceof Error ? err.message : "Regeneration failed. Check your connection or model settings.";
      const errorDebug = readRoleplayRequestDebugFromError(err, pendingDebugTrace, pendingCall1Request);
      const latestBase = latestConversationsRef.current;
      const liveConversation = latestBase.find(c => c.id === conversationId);
      const liveTargetMessage = liveConversation?.messages.find(m => m.id === messageId);
      if (!liveConversation || !liveTargetMessage || (liveTargetMessage.generationId || liveTargetMessage.id) !== expectedGenerationId) {
        debugLog('[handleRegenerate] Skipping provider-error notice because the target message changed before completion.');
        return;
      }
      appendProviderErrorNotice(
        latestBase,
        message,
        errorDebug.trace,
        errorDebug.call1Request,
      );
    } finally {
      setRegeneratingMessageId(null);
      setIsRegenerating(false);
      setIsStreaming(false);
      setStreamingContent('');
      setFormattedStreamingContent('');
    }
  };

  const handleContinueConversation = async () => {
    if (!conversation || isStreaming || !canUseCanonicalChatState) return;
    const lastRoleplayMessage = conversation.messages
      .filter((message) => !isLocalRoleplayNoticeMessage(message))
      .slice(-1)[0];
    const continueAnchorMessageId = lastRoleplayMessage?.id || null;
    const continueAnchorGenerationId = lastRoleplayMessage
      ? (lastRoleplayMessage.generationId || lastRoleplayMessage.id)
      : null;
    const isContinueAnchorStillCurrent = (messages: Message[] | undefined): boolean => {
      const liveRoleplayTail = (messages || [])
        .filter((message) => !isLocalRoleplayNoticeMessage(message))
        .slice(-1)[0];
      return continueAnchorMessageId
        ? liveRoleplayTail?.id === continueAnchorMessageId && (liveRoleplayTail.generationId || liveRoleplayTail.id) === continueAnchorGenerationId
        : !liveRoleplayTail;
    };

    setIsStreaming(true);
    setStreamingContent('');
    setFormattedStreamingContent('');

    // Use session-merged data so the AI sees current locations/moods/control
    const llmAppData = buildLLMAppData();
    const allPlayableCharacters = [...llmAppData.characters, ...(llmAppData.sideCharacters || [])];

    // Get character control lists from session-merged data
    const userControlledNames = allPlayableCharacters
      .filter(c => c.controlledBy === 'User')
      .map(c => c.name);

    const aiControlledNames = allPlayableCharacters
      .filter(c => c.controlledBy === 'AI')
      .map(c => c.name);

    let pendingDebugTrace: ChatDebugTrace | null = null;
    let pendingCall1Request: ChatDebugRequestRecord | null = null;
    let pendingStyleTelemetryCall: ChatDebugRequestRecord | null = null;

    try {
      const currentResponseLengths = getAssistantResponseLengths(conversation.messages);
      const styleEvidenceMessages = filterRoleplayMessagesForStyleEvidence(conversation.messages);
      const recentStyleTelemetry = analyzeRecentAssistantStyle(
        styleEvidenceMessages,
        currentResponseLengths,
        llmAppData.uiSettings?.responseVerbosity,
      );

	      // Build goal-aware continue prompt without turning goals into a task list.
	      const goalSummaryParts: string[] = [];
	      const isGoalVisibleToWriter = (goal: any): boolean => {
	        const flexibility: GoalFlexibility =
	          goal?.flexibility === 'rigid' || goal?.flexibility === 'flexible'
	            ? goal.flexibility
	            : 'normal';
	        return shouldRenderGoalToWriter(goal?.alignment, flexibility);
	      };
	      allPlayableCharacters
	        .filter(c => c.controlledBy === 'AI')
	        .forEach(c => {
	          const goals = 'goals' in c ? c.goals : undefined;
	          if (Array.isArray(goals)) {
	            goals.filter(isGoalVisibleToWriter).forEach((g: any) => {
	              const label = typeof g === 'string' ? g : (g?.title || g?.label || g?.value || '');
	              const currentStep = g?.steps?.find?.((s: any) => !s.completed)?.description;
	              if (label) {
                goalSummaryParts.push(`${c.name}'s current goal: "${label}"${currentStep ? `; current open milestone: "${renderGoalMilestoneTarget(currentStep)}"` : ''}`);
              }
            });
          }
        });

	      const storyGoalsList = effectiveWorldCore.storyGoals || [];
	      storyGoalsList.filter(isGoalVisibleToWriter).forEach((g: StoryGoal) => {
	        const pendingStep = (g.steps || []).find(s => !s.completed);
	        if (pendingStep) {
          goalSummaryParts.push(`Story goal "${g.title || g.desiredOutcome}"; current open milestone: "${renderGoalMilestoneTarget(pendingStep.description)}"`);
        }
      });

	      const goalContext = goalSummaryParts.length > 0
	        ? `\nGOAL CONTINUITY:\n${goalSummaryParts.join('\n')}\nUse this as background continuity only. The current open milestone is an eventual direction, not a command or next-action checklist; use it only when the immediate scene and user control boundaries naturally support it.`
	        : '';

		      // Carry forward user-authored AI dialogue without making Continue restart there.
		      const lastUserMsg = conversation.messages.slice().reverse().find(m => m.role === 'user');
		      const lastUserSceneText = lastUserMsg?.text?.trim() || '';
		      const continueEstablishedFactNote = lastUserMsg ? buildEstablishedFactNote(lastUserMsg.text, establishedFactNoteCharacters) : '';
		      const lastUserSceneAnchor = lastUserSceneText
		        ? `\nBACKGROUND USER-AUTHORED SCENE TURN FOR FACTS AND USER-CONTROL BOUNDARIES ONLY:\n${lastUserSceneText}\n`
		        : '\nBACKGROUND USER-AUTHORED SCENE TURN FOR FACTS AND USER-CONTROL BOUNDARIES ONLY:\n(none found)\n';

	      const continuePrompt = `${continueEstablishedFactNote}[CONTINUE INSTRUCTION]
Continue from after the latest visible assistant response. Do not restart from, paraphrase, or circle around an older user-authored scene turn.
${lastUserSceneAnchor}
The background user-authored turn above is only there to preserve established facts and user-character control boundaries.
Write only for AI-controlled characters: ${aiControlledNames.join(', ')}.
Do not write dialogue, actions, or thoughts for user-controlled characters: ${userControlledNames.join(', ')}.${goalContext}
Do not complete an action for a user-controlled character after an AI character gives them an instruction. The AI can command, prepare, or act itself, but the user must author the user-controlled character's execution.
Use active story and character goals as continuity, not as a checklist. Continue only as far as the current scene naturally supports, and stop before the response depends on an unmade user choice or action.
Develop the AI-controlled character's side of the current exchange enough that it follows the active RESPONSE DETAIL setting while preserving user control.
If an AI character asked or was asked a question, acknowledge that question in this response. Acknowledgement can be a direct answer, refusal, deflection, counter-question, visible hesitation, or turning the question toward another present character.
Choose the AI character or characters whose response is physically, emotionally, or causally next. A single focused block is fine when only one AI character matters, but do not omit a directly affected AI character just because this is a Continue request.
If the latest user turn directly addressed two AI characters and both need to answer or acknowledge, give each one short tagged block instead of letting one character narrate the other's answer.
Follow the active RESPONSE DETAIL setting from the system prompt; Continue is not a request to shrink the response unless the scene itself calls for a short response.
Avoid long back-and-forth chains between AI characters. Leave room for the user to respond.
Do not acknowledge this instruction in your response.`;

	      debugLog('[handleContinue] Goal context:', goalContext || '(no goals found)');
	      debugLog('[handleContinue] Established-fact note applied:', continueEstablishedFactNote ? 'YES' : 'NO');

      const responseResult = await collectRoleplayResponse({
        appData: llmAppData,
        conversationId,
        userMessage: continuePrompt,
        modelId,
        currentDay,
        currentTimeOfDay,
        memories: activeMemories,
        memoriesEnabled,
        activeScene: canonicalActiveScene,
        debugTrace: isAdmin,
        placeholderMap: placeholderMapRef.current,
        knownCharacterNames: getKnownCharacterNames(effectiveAppData),
        sanitizeAssistantOutput,
        streamToUi: false,
        onStreamingContent: setStreamingContent,
        onFormattedStreamingContent: setFormattedStreamingContent,
      });
      const cleanedText = responseResult.cleanedText;
	      pendingDebugTrace = responseResult.debugTrace;
	      pendingCall1Request = responseResult.call1Request;
	      const candidateStyleTelemetry = analyzeAssistantCandidateStyle(
	        styleEvidenceMessages,
	        cleanedText,
	        currentResponseLengths,
	      );
	      pendingStyleTelemetryCall = buildAssistantStyleTelemetryCall('continue', recentStyleTelemetry, candidateStyleTelemetry);

      const liveConversation = latestConversationsRef.current.find(c => c.id === conversationId);
      if (!liveConversation || !isContinueAnchorStillCurrent(liveConversation.messages)) {
        debugLog('[handleContinue] Skipping assistant commit because the conversation tail changed before completion.');
        return;
      }
      placeholderMapRef.current = responseResult.placeholderMap;

      const aiMessageId = uuid();
      const aiMsg: Message = {
        id: aiMessageId,
        generationId: uuid(),
        role: 'assistant',
        text: cleanedText,
        day: currentDay,
        timeOfDay: currentTimeOfDay,
	        createdAt: now()
	      };

      const updatedConvs = latestConversationsRef.current.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, aiMsg], updatedAt: now() }
          : c
      );
      latestConversationsRef.current = updatedConvs;
      const updatedConversation = updatedConvs.find(c => c.id === conversationId);
      if (updatedConversation) syncAssistantResponseLengths(updatedConversation.messages);
      onUpdate(updatedConvs);
      onSaveScenario(updatedConvs);
      saveChatDebugTrace(aiMsg, pendingDebugTrace, pendingCall1Request);
      if (pendingStyleTelemetryCall) recordChatDebugSupportCall(aiMsg, pendingStyleTelemetryCall);
      if (lastRoleplayMessage) {
        continueEventsRef.current.push({
          messageId: lastRoleplayMessage.id,
          generationId: continueAnchorGenerationId || undefined,
          timestamp: Date.now(),
        });
      }
      queueAssistantDerivedWorkAfterSourcePersist([aiMsg], lastUserSceneText, cleanedText, aiMsg);

      processResponseForNewCharacters(cleanedText, aiMsg);

    } catch (err) {
      console.error(err);
      if (err instanceof ContentFilteredChatError) {
        const errorDebug = readRoleplayRequestDebugFromError(err, pendingDebugTrace, pendingCall1Request);
        const latestBase = latestConversationsRef.current;
        const liveConversation = latestBase.find(c => c.id === conversationId);
        if (!liveConversation || !isContinueAnchorStillCurrent(liveConversation.messages)) {
          debugLog('[handleContinue] Skipping content-filter notice because the conversation tail changed before completion.');
          return;
        }
        appendContentFilterNotice(
          latestBase,
          err,
          errorDebug.trace,
          errorDebug.call1Request,
        );
        return;
      }
      const message = err instanceof Error ? err.message : "Continue failed. Check your connection or model settings.";
      const errorDebug = readRoleplayRequestDebugFromError(err, pendingDebugTrace, pendingCall1Request);
      const latestBase = latestConversationsRef.current;
      const liveConversation = latestBase.find(c => c.id === conversationId);
      if (!liveConversation || !isContinueAnchorStillCurrent(liveConversation.messages)) {
        debugLog('[handleContinue] Skipping provider-error notice because the conversation tail changed before completion.');
        return;
      }
      appendProviderErrorNotice(
        latestBase,
        message,
        errorDebug.trace,
        errorDebug.call1Request,
      );
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
      const recentMessages = conversation.messages
        .filter((message) => !isLocalRoleplayNoticeMessage(message))
        .slice(-5)
        .map(m => ({
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

	      // Build character data for mentioned characters. Keep this visual-only; private/intimate card fields stay out of the image lane.
	      const charactersData = [...mentionedNames].map(name => {
	        const char = findCharacterByName(name, effectiveAppData);
	        if (!char) return null;
	        return buildSceneImageCharacterData(char);
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
	          inputChars: recentMessages.map((message) => message.text).join('\n').length + JSON.stringify(charactersData).length,
        },
      });

      // Create image message
      const imageMessage: Message = {
        id: uuid(),
        generationId: uuid(),
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
      const userChar = effectiveMainCharacters.find(c => c.controlledBy === 'User');
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
        return { char: matched.effective, cleanText: strippedText, speakerName: matched.effective.name };
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
        return { char: matched.effective, cleanText: cleanRaw, speakerName: matched.effective.name };
      }
    }

    // Default to first AI character for AI messages
    const aiChars = effectiveMainCharacters.filter(c => c.controlledBy === 'AI');
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
      let sessionState = sessionStates.find(s => s.conversationId === conversationId && s.characterId === char.id);

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
        sections: draft.sections ?? char.sections,
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

      let sessionState = sessionStates.find(s => s.conversationId === conversationId && s.characterId === charId);
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleTileRepositionMode(char)}>
                <Move className="w-4 h-4 mr-2" />
                {isRepositioning ? 'Done repositioning' : 'Reposition image'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCharacterEditModal(char)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit character
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteMainCharacter(char.id)}
                className="text-red-400 focus:text-red-400"
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
    dynamicText?: boolean;
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
  // The chat sidebar is intentionally a fixed split pane during active sessions.
  // Do not reintroduce stacked/mobile sidebar behavior here: the transcript should
  // shrink first, because moving the character column above the chat breaks the
  // intended Chronicle runtime layout and disorients in-session navigation.
  return (
    <div
      className={`flex flex-1 min-h-0 min-w-0 h-full w-full flex-row overflow-hidden relative ${darkMode ? 'bg-slate-900' : ''}`}
      style={{ backgroundColor: chatCanvasColor }}
    >

      {/* Height-chain guardrail:
          Chat sidebar width/height are fixed on purpose to preserve the split-pane
          session layout. Keep h-full/min-h-0 so nested scroll containers stay functional. */}
      <aside
        className={`h-full flex-shrink-0 border-r border-slate-200 flex flex-col shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)] z-10 transition-colors relative overflow-hidden ${showBackground ? 'bg-white/90 backdrop-blur-md' : 'bg-white'}`}
        style={{
          width: CHAT_SIDEBAR_WIDTH,
          minWidth: CHAT_SIDEBAR_WIDTH,
          maxWidth: CHAT_SIDEBAR_WIDTH,
        }}
      >
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
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
                  aria-label="Open scenario settings"
                  title="Open scenario settings"
                >
                  <Settings className="w-5 h-5" />
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
                    ? renderCharacterCard(char as Character)
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
                    ? renderCharacterCard(char as Character)
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
            const isLocalNotice = isLocalRoleplayNoticeMessage(msg);
            const visibleMessageText = isAi ? sanitizeAssistantMessageText(msg.text) : msg.text;

            // Get the primary speaker for user messages
            const userChar = effectiveMainCharacters.find(c => c.controlledBy === 'User') || null;

            // Parse segments and merge by RESOLVED speaker identity
            // This ensures null (default AI) and explicit "Ashley:" merge correctly
            const rawSegments = parseMessageSegments(visibleMessageText);
            const segments = mergeByRenderedSpeaker(
              rawSegments,
              isAi,
              effectiveAppData,
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
                        {!isLocalNotice && msg.id === conversation?.messages.filter((message) => !isLocalRoleplayNoticeMessage(message)).slice(-1)[0]?.id && (
	                          <button
	                            onClick={handleContinueConversation}
	                            disabled={isStreaming || isRegenerating || !canUseCanonicalChatState}
	                            className="p-2 rounded-lg hover:bg-ghost-white text-slate-400 hover:text-white transition-colors disabled:opacity-30"
	                            aria-label="Continue conversation"
	                            title={canonicalDerivationsLoadError || "Continue"}
	                          >
                            <StepForward className="w-4 h-4" />
                          </button>
                        )}

                        {/* Regenerate button - AI messages only */}
                        {isAi && !isLocalNotice && (
	                          <button
	                            onClick={() => handleRegenerateMessage(msg.id)}
	                            disabled={isStreaming || isRegenerating || !canUseCanonicalChatState}
	                            className="p-2 rounded-lg hover:bg-ghost-white text-slate-400 hover:text-white transition-colors disabled:opacity-30"
	                            aria-label="Regenerate response"
	                            title={canonicalDerivationsLoadError || "Regenerate response"}
	                          >
                            <RefreshCw className={`w-4 h-4 ${regeneratingMessageId === msg.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}

                        {isAdmin && dialogDebugEnabled && (
                          <button
                            onClick={() => openDialogDebugComment(msg)}
                            className={cn(
                              "p-2 rounded-lg hover:bg-ghost-white transition-colors",
                              dialogDebugComments[buildDialogDebugCommentKey(msg.id, msg.generationId)]
                                ? "text-emerald-300 hover:text-emerald-200"
                                : "text-slate-400 hover:text-white"
                            )}
                            aria-label="Add dialogue debug note"
                            title={dialogDebugComments[buildDialogDebugCommentKey(msg.id, msg.generationId)] ? "Edit dialogue debug note" : "Add dialogue debug note"}
                          >
                            <MessageSquare className="w-4 h-4" />
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
                            <DropdownMenuItem onClick={() => openInlineMessageEditor(msg, isAi)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-red-400 focus:text-red-400"
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
                    const isEditingThisMessage = inlineEditingId === msg.id;
                    // If this message is being regenerated, use streaming content
                    const displaySegments = isEditingThisMessage
                      ? (inlineEditSegments.length > 0 ? inlineEditSegments : segments)
                      : regeneratingMessageId === msg.id && formattedStreamingContent
                        ? mergeByRenderedSpeaker(
                            parseMessageSegments(sanitizeAssistantMessageText(formattedStreamingContent)),
                            isAi,
                            effectiveAppData,
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
                        const aiChars = effectiveMainCharacters.filter(c => c.controlledBy === 'AI');
                        segmentChar = aiChars.length > 0 ? aiChars[0] : null;
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
                          const aiChars = effectiveMainCharacters.filter(c => c.controlledBy === 'AI');
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
                          {/* Guardrail: multi-speaker edit mode must keep every rendered speaker row visible.
                              Do not collapse editing back into only the first segment, or later character
                              blocks will render as empty shells underneath their avatars. */}
                          {isEditingThisMessage ? (
                            <InlineFormattedMessageEditor
                              value={segment.content}
                              dynamicText={dynamicText}
                              plainTextMode={isAi ? 'action' : 'default'}
                              autoFocus={segIndex === 0}
                              onChange={(nextContent) => {
                                setInlineEditSegments(prev => prev.map((editSegment, editIndex) => (
                                  editIndex === segIndex
                                    ? { ...editSegment, content: nextContent }
                                    : editSegment
                                )));
                              }}
                            />
                          ) : (
                            <FormattedMessage text={segment.content} dynamicText={dynamicText} plainTextMode={isAi ? 'action' : 'default'} />
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

          {isStreaming && !formattedStreamingContent && !regeneratingMessageId && (
            <TypingIndicatorBubble
              offsetBubbles={offsetBubbles}
              bubblesTransparent={bubblesTransparent}
              chatBubbleColor={chatBubbleColor}
            />
          )}

          {formattedStreamingContent && !regeneratingMessageId && (() => {
            // Parse formatted streaming content into segments for multi-speaker rendering (only for NEW messages, not regeneration)
            // Using formattedStreamingContent to prevent flickering from system tags and placeholder names
            const userChar = effectiveMainCharacters.find(c => c.controlledBy === 'User') || null;
            const rawSegments = parseMessageSegments(sanitizeAssistantMessageText(formattedStreamingContent));
            const segments = mergeByRenderedSpeaker(rawSegments, true, effectiveAppData, userChar, resolveCanonicalSpeakerName);

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
                          const aiChars = effectiveMainCharacters.filter(c => c.controlledBy === 'AI');
                          return aiChars.length > 0 ? aiChars[0] : null;
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
                            const aiChars = effectiveMainCharacters.filter(c => c.controlledBy === 'AI');
                            return aiChars.length > 0 ? aiChars[0] : null;
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
                          <FormattedMessage text={segment.content} dynamicText={dynamicText} plainTextMode="action" />
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

        <div className="relative z-20 border-t border-[hsl(var(--ui-border))] bg-[#2a2a2f] px-5 pb-4 pt-4 shadow-[0_-6px_16px_rgba(0,0,0,0.24)] transition-colors md:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-3">
            {/* Quick Actions Bar - Above Input */}
            <div className="relative flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-[#3c3e47] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] active:scale-95"
              >
                <Settings className="w-4 h-4" />
                Chat Settings
              </button>

              {/* Generate Image Button */}
              <button
                onClick={handleGenerateSceneImage}
                disabled={isGeneratingImage || !conversation?.messages?.length}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-[#3c3e47] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-[#3c3e47] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] active:scale-95"
              >
                <Palette className="w-4 h-4" />
                Change Color
              </button>

	              <button
	                onClick={handleSend}
	                disabled={!input.trim() || isStreaming || !canUseCanonicalChatState}
	                title={canonicalDerivationsLoadError || undefined}
	                className={cn(
	                  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-5 text-[11px] font-black uppercase tracking-[0.12em] transition-colors active:scale-95 disabled:pointer-events-none sm:ml-auto sm:w-auto',
	                  input.trim() && !isStreaming && canUseCanonicalChatState
                    ? 'border-[#5f7ca7] bg-[#5a7292] text-white shadow-[0_10px_28px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(0,0,0,0.26)] hover:bg-[#6884ab]'
                    : 'border-white/[0.10] bg-[#3c3e47] text-[#8f95a3] opacity-50 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]',
                )}
              >
                {isStreaming ? '...' : 'Send'}
              </button>
            </div>

            {/* Input Area */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#2e2e33] p-2.5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
              <ChatSpellcheckTextarea
                value={input}
                onChange={setInput}
                placeholder="Describe your action or dialogue..."
                onSubmit={handleSend}
                allowlistEntries={chatSpellAllowlistEntries}
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
        memories={activeMemories}
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
                    <div className="flex items-center justify-between gap-2 bg-[#3c3e47] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                      <div>
                        <div className="text-[13px] font-semibold text-[#eaedf1]">Dialogue Debug Notes</div>
                        <div className="text-[12px] text-[#a1a1aa] mt-0.5">Show comment buttons on chat bubbles for playthrough QA notes</div>
                      </div>
                      <LabeledToggle
                        checked={dialogDebugEnabled}
                        onCheckedChange={handleDialogDebugToggle}
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!conversation) return;
                        const scenarioTitle = appData.world?.core?.scenarioName || 'Untitled';
                        const convTitle = conversation.title || 'Untitled Conversation';
                        const exportedAt = new Date();
                        const html = buildChatReviewHtml({
                          appData: effectiveAppData,
                          conversation,
                          scenarioTitle,
                          modelId,
                          exportedAt,
                          continueMessageEvents: continueEventsRef.current,
                          regenerateMessageEvents: regenerateEventsRef.current,
                          sanitizeAssistantText: sanitizeAssistantMessageText,
                          messageComments: exportDialogDebugComments,
                          postTurnStateChanges: exportPostTurnStateChanges,
                          debugRecords: chatDebugTraceStoreRef.current,
                        });
                        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `session-log-${slugifyReviewExportFilePart(convTitle || scenarioTitle)}-${exportedAt.getTime()}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#3c3e47] hover:bg-[#4a4c55] rounded-[10px] p-[12px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[13px] font-semibold text-[#eaedf1] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download Session Log
                    </button>

                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </DialogContentBare>
      </Dialog>

      <Dialog
        open={!!activeDialogDebugMessage}
        onOpenChange={(open) => {
          if (!open) closeDialogDebugComment();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col overflow-hidden bg-[#1f222b] border border-[#3a4152] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Dialogue Debug Note</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#78dcca] mb-2">
                Message preview
              </p>
              <div className="max-h-[42vh] min-h-[240px] overflow-y-auto rounded-lg border border-white/5 bg-black/10 p-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {activeDialogDebugMessage
                  ? (activeDialogDebugMessage.role === 'assistant'
                    ? sanitizeAssistantMessageText(activeDialogDebugMessage.text)
                    : activeDialogDebugMessage.text
                  )
                  : ''}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                  Issue tags
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                    >
                      {dialogDebugTagDraft.length > 0
                        ? `${dialogDebugTagDraft.length} tag${dialogDebugTagDraft.length === 1 ? '' : 's'} selected`
                        : 'Choose issue tags'}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Issue categories</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {CHAT_DEBUG_ISSUE_TAGS.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={dialogDebugTagDraft.includes(tag)}
                        onSelect={(event) => event.preventDefault()}
                        onCheckedChange={() => toggleDialogDebugTag(tag)}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {dialogDebugTagDraft.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dialogDebugTagDraft.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer border-[#78dcca]/30 bg-[#78dcca]/10 px-2.5 py-1 text-[11px] font-bold text-[#d8fff7] hover:bg-[#78dcca]/16"
                      onClick={() => toggleDialogDebugTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-zinc-500">
                Select as many issue types as fit this message. These tags stay local and show up in the exported session log.
              </p>
            </div>
            <label className="block">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                What is wrong with this bubble?
              </span>
              <textarea
                value={dialogDebugDraft}
                onChange={(event) => setDialogDebugDraft(event.target.value)}
                placeholder="Example: Sarah answered a question meant for Ashley, or the response sounded mechanical here."
                className="mt-2 min-h-[150px] w-full resize-y rounded-xl border border-white/10 bg-[#111318] p-3 text-sm leading-relaxed text-zinc-100 outline-none focus:border-[#78dcca]/70"
              />
            </label>
            <p className="text-xs text-zinc-500">
	              Saved to this playthrough for review exports only. This is not sent to the AI and does not alter accepted story state.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => {
                setDialogDebugDraft('');
                setDialogDebugTagDraft([]);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={closeDialogDebugComment}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDialogDebugCommentSave}
              className="rounded-lg bg-[#5f789d] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:bg-[#6f8fbf]"
            >
              Save Note
            </button>
          </DialogFooter>
        </DialogContent>
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
