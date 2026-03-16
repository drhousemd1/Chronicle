
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { World, OpeningDialog, CodexEntry, Character, Scene, TimeOfDay, WorldCore, ContentThemes, defaultContentThemes, LocationEntry, WorldCustomSection, WorldCustomItem, WorldCustomSectionType, StoryGoal } from '@/types';
import { validateForPublish, hasPublishErrors, PublishValidationErrors } from '@/utils/publish-validation';
import { EnhanceableWorldFields } from '@/services/world-ai';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { Button, Card } from './UI';
import { Icons } from '@/constants';
import { uid, now, resizeImage, uuid, clamp } from '@/utils';
import { useAuth } from '@/hooks/use-auth';
import { uploadSceneImage, uploadCoverImage, dataUrlToBlob } from '@/services/supabase-data';
import { supabase } from '@/integrations/supabase/client';

import { Sunrise, Sun, Sunset, Moon, ChevronUp, ChevronDown, Pencil, Sparkles, Share2, Trash2, Plus, X, Info, Lock } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { StoryGoalsSection } from './StoryGoalsSection';
import { useArtStyles } from '@/contexts/ArtStylesContext';
import { cn } from '@/lib/utils';
import { SceneTagEditorModal } from './SceneTagEditorModal';
import { CoverImageGenerationModal } from './CoverImageGenerationModal';
import { SceneImageGenerationModal } from './SceneImageGenerationModal';
import { CoverImageActionButtons } from './CoverImageActionButtons';
import { SceneGalleryActionButtons } from './SceneGalleryActionButtons';
import { ShareScenarioModal } from './ShareStoryModal';
import { ContentThemesSection } from './ContentThemesSection';
import { aiEnhanceWorldField } from '@/services/world-ai';
import { EnhanceModeModal, EnhanceMode } from './EnhanceModeModal';
import { CharacterCreationModal } from './CharacterCreationModal';
import { useModelSettings } from '@/contexts/ModelSettingsContext';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { getClosestRatio, AspectRatioIcon } from './AspectRatioUtils';
import { CustomContentTypeModal } from './CustomContentTypeModal';
import { TabFieldNavigator } from './TabFieldNavigator';

interface WorldTabProps {
  scenarioId: string;
  world: World;
  characters: Character[];
  openingDialog: OpeningDialog;
  scenes: Scene[];
  coverImage: string;
  coverImagePosition: { x: number; y: number };
  selectedArtStyle: string;
  onUpdateWorld: (world: Partial<World>) => void;
  onUpdateOpening: (opening: Partial<OpeningDialog>) => void;
  onUpdateScenes: (scenes: Scene[]) => void;
  onUpdateCoverImage: (url: string) => void;
  onUpdateCoverPosition: (position: { x: number; y: number }) => void;
  onUpdateArtStyle: (styleId: string) => void;
  contentThemes: ContentThemes;
  onUpdateContentThemes: (themes: ContentThemes) => void;
  onCreateCharacter: () => void;
  onOpenLibraryPicker: () => void;
  onSelectCharacter: (id: string) => void;
  storyNameError?: boolean;
}

const HintBox: React.FC<{ hints: string[] }> = ({ hints }) => (
  <div className="bg-zinc-900 rounded-xl p-4 space-y-2 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
    {hints.map((hint, index) => (
      <p key={index} className="text-sm text-zinc-400 leading-relaxed flex items-start gap-2">
        <span className="text-zinc-500 mt-0.5">◆</span>
        <span>{hint}</span>
      </p>
    ))}
  </div>
);

// AutoResizeTextarea is now imported from ./AutoResizeTextarea

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));
const CHARACTER_AVATAR_PREVIEW_SIZE = 192; // CharactersTab avatar preview uses w-48 h-48
const STORY_ROSTER_TILE_HEIGHT = 140;
const STORY_ROSTER_TILE_WIDTH = 268; // Sidebar 300px - horizontal padding 32px

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

const CharacterRosterTile: React.FC<{
  char: Character;
  onSelect: (id: string) => void;
  errors?: string[];
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}> = ({ char, onSelect, errors, isExpanded, onToggleExpand }) => {
  const hasAvatar = Boolean(char.avatarDataUrl);
  const [naturalImageSize, setNaturalImageSize] = useState<Size2D | null>(
    () => (char.avatarDataUrl ? avatarNaturalSizeCache.get(char.avatarDataUrl) ?? null : null)
  );

  useEffect(() => {
    if (!hasAvatar) {
      setNaturalImageSize(null);
      return;
    }

    const cachedSize = avatarNaturalSizeCache.get(char.avatarDataUrl!);
    if (cachedSize) {
      setNaturalImageSize(cachedSize);
      return;
    }

    let cancelled = false;
    const image = new Image();
    const commitSize = () => {
      const nextSize = {
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      };
      avatarNaturalSizeCache.set(char.avatarDataUrl!, nextSize);
      if (!cancelled) setNaturalImageSize(nextSize);
    };

    image.onload = () => { commitSize(); };
    image.onerror = () => { if (!cancelled) setNaturalImageSize(null); };
    image.src = char.avatarDataUrl!;
    if (image.complete && image.naturalWidth > 0) {
      commitSize();
    }

    return () => { cancelled = true; };
  }, [char.avatarDataUrl, hasAvatar]);

  const tileObjectPosition = useMemo(() => {
    const stored = {
      x: clampPercent(char.avatarPosition?.x ?? 50),
      y: clampPercent(char.avatarPosition?.y ?? 50),
    };

    if (!naturalImageSize) return stored;

    return mapObjectPositionFromPreviewToTile(
      stored,
      naturalImageSize,
      { width: STORY_ROSTER_TILE_WIDTH, height: STORY_ROSTER_TILE_HEIGHT }
    );
  }, [char.avatarPosition?.x, char.avatarPosition?.y, naturalImageSize]);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl bg-black transition-all duration-300",
          isExpanded ? "" : "h-[140px]",
          errors && errors.length > 0
            ? "border border-red-500"
            : "border border-[#4a5f7f]"
        )}
      >
        {hasAvatar ? (
          <img
            src={char.avatarDataUrl}
            alt={char.name}
            className={`block w-full transition-[height,object-fit] duration-300 ${isExpanded ? 'h-auto object-contain object-top' : 'h-full object-cover'}`}
            style={isExpanded ? undefined : { objectPosition: `${tileObjectPosition.x}% ${tileObjectPosition.y}%` }}
          />
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 font-black text-5xl italic uppercase text-slate-500">
            {char.name.charAt(0)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 z-[5] pointer-events-none" />

        {/* Click area to toggle expand/collapse - only when avatar exists */}
        {hasAvatar && (
          <button
            type="button"
            onClick={() => onToggleExpand(char.id)}
            className="absolute inset-0 z-20"
            aria-label={isExpanded ? `Collapse ${char.name} avatar` : `Expand ${char.name} avatar`}
          />
        )}

        {/* Edit button - top right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(char.id);
          }}
          className="absolute right-2 top-2 z-30 rounded-lg bg-black/35 p-1.5 text-white/75 transition-colors hover:bg-black/55 hover:text-white"
          aria-label={`Edit ${char.name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Bottom info overlay */}
        <div className="absolute inset-x-0 bottom-0 z-30 p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{char.name}</div>
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wide shrink-0 rounded-full px-2 py-0.5",
              char.controlledBy === 'User' ? "bg-blue-500 text-white" : "bg-slate-500 text-white"
            )}>
              {char.controlledBy}
            </span>
          </div>
        </div>
      </div>

      {errors && errors.length > 0 && (
        <div className="pl-2 space-y-0.5">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-500 font-medium">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export const WorldTab: React.FC<WorldTabProps> = ({ 
  scenarioId,
  world, 
  characters, 
  openingDialog, 
  scenes,
  coverImage,
  coverImagePosition,
  selectedArtStyle,
  onUpdateWorld, 
  onUpdateOpening, 
  onUpdateScenes,
  onUpdateCoverImage,
  onUpdateCoverPosition,
  onUpdateArtStyle,
  contentThemes,
  onUpdateContentThemes,
  onCreateCharacter,
  onOpenLibraryPicker,
  onSelectCharacter,
  storyNameError
}) => {
  const { user } = useAuth();
  const { modelId } = useModelSettings();
  const { styles: AVATAR_STYLES, getStyleById } = useArtStyles();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [coverDragStart, setCoverDragStart] = useState<{ x: number; y: number; pos: { x: number; y: number } } | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [showCoverGenModal, setShowCoverGenModal] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [showSceneGenModal, setShowSceneGenModal] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [enhancingField, setEnhancingField] = useState<EnhanceableWorldFields | null>(null);
  const [enhanceModeTarget, setEnhanceModeTarget] = useState<EnhanceableWorldFields | null>(null);
  const [pendingDeleteCover, setPendingDeleteCover] = useState(false);
  const [pendingDeleteSceneId, setPendingDeleteSceneId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);
  const [sceneAspectRatios, setSceneAspectRatios] = useState<Record<string, { label: string; orientation: 'portrait' | 'landscape' | 'square' }>>({});
  const [isCharacterCreationOpen, setIsCharacterCreationOpen] = useState(false);
  const [showContentTypeModal, setShowContentTypeModal] = useState(false);
  const [publishErrors, setPublishErrors] = useState<PublishValidationErrors>({});
  const [expandedRosterTileId, setExpandedRosterTileId] = useState<string | null>(null);
  const [mainCharsCollapsed, setMainCharsCollapsed] = useState(false);
  const [sideCharsCollapsed, setSideCharsCollapsed] = useState(false);

  // Reset expanded roster tile if character is removed
  useEffect(() => {
    if (!expandedRosterTileId) return;
    if (!characters.some((char) => char.id === expandedRosterTileId)) {
      setExpandedRosterTileId(null);
    }
  }, [characters, expandedRosterTileId]);

  // Listen for save-validation-failed events from Index.tsx (Save & Close button)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as PublishValidationErrors;
      setPublishErrors(detail);
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector('.border-red-500');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };
    window.addEventListener('chronicle:save-validation-failed', handler);
    return () => window.removeEventListener('chronicle:save-validation-failed', handler);
  }, []);

  // Live re-validation: when publishErrors is non-empty, re-run validation on every relevant change
  useEffect(() => {
    if (Object.keys(publishErrors).length === 0) return;
    const updated = validateForPublish({
      scenarioTitle: world.core.scenarioName || '',
      world,
      characters,
      openingDialog,
      contentThemes,
      coverImage,
    });
    setPublishErrors(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, characters, openingDialog, contentThemes, coverImage]);

  // Detect aspect ratios for scene images
  useEffect(() => {
    if (!scenes.length) { setSceneAspectRatios({}); return; }
    const pending = new Map<string, { label: string; orientation: 'portrait' | 'landscape' | 'square' }>();
    let cancelled = false;
    let loaded = 0;
    scenes.forEach((scene) => {
      const el = new window.Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => {
        if (cancelled) return;
        pending.set(scene.id, getClosestRatio(el.naturalWidth, el.naturalHeight));
        loaded++;
        if (loaded === scenes.length) {
          setSceneAspectRatios(Object.fromEntries(pending));
        }
      };
      el.onerror = () => { loaded++; };
      el.src = scene.url;
    });
    return () => { cancelled = true; };
  }, [scenes]);

  const updateCore = (patch: any) => {
    onUpdateWorld({ core: { ...world.core, ...patch } });
  };

  // AI enhancement handler for World Core fields
  const handleEnhanceField = async (fieldName: EnhanceableWorldFields, mode: EnhanceMode = 'detailed') => {
    if (!modelId) {
      console.error("No model selected. Please select a model in settings.");
      return;
    }
    
    setEnhancingField(fieldName);
    try {
      const enhanced = await aiEnhanceWorldField(
        fieldName,
        (world.core[fieldName] as string) || '',
        world.core,
        modelId,
        mode
      );
      updateCore({ [fieldName]: enhanced });
    } catch (error: any) {
      console.error('Enhancement failed:', error);
    } finally {
      setEnhancingField(null);
    }
  };

  const handleEnhanceModeSelect = (mode: EnhanceMode) => {
    if (!enhanceModeTarget) return;
    const fieldName = enhanceModeTarget;
    setEnhanceModeTarget(null);
    handleEnhanceField(fieldName, mode);
  };

  // Reusable field label with AI enhance button (dark theme)
  const FieldLabel: React.FC<{
    label: string;
    fieldName: EnhanceableWorldFields;
  }> = ({ label, fieldName }) => {
    const isLoading = enhancingField === fieldName;
    return (
      <div className="flex items-center gap-2 mb-1">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          {label}
        </label>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setEnhanceModeTarget(fieldName)}
          disabled={isLoading || enhancingField !== null}
          title="Enhance with AI"
          className={cn(
            "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden transition-all text-cyan-200",
            isLoading
              ? "animate-pulse cursor-wait"
              : enhancingField !== null
              ? "opacity-50 cursor-not-allowed"
              : "hover:brightness-125"
          )}
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
        >
          <span aria-hidden className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)' }} />
          <span aria-hidden className="absolute rounded-[6px] pointer-events-none" style={{ inset: '1.5px', background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33' }} />
          <Sparkles size={13} className="relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }} />
        </button>
      </div>
    );
  };

  const handleUpdateEntry = (id: string, patch: Partial<CodexEntry>) => {
    const next = world.entries.map(e => e.id === id ? { ...e, ...patch, updatedAt: now() } : e);
    onUpdateWorld({ entries: next });
  };

  // Cover image handlers
  const handleCoverMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioningCover) return;
    e.preventDefault();
    setCoverDragStart({
      x: e.clientX,
      y: e.clientY,
      pos: coverImagePosition || { x: 50, y: 50 }
    });
  };

  const handleCoverMouseMove = useCallback((e: React.MouseEvent) => {
    if (!coverDragStart || !coverContainerRef.current) return;
    
    const rect = coverContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - coverDragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - coverDragStart.y) / rect.height) * 100;

    onUpdateCoverPosition({
      x: clamp(coverDragStart.pos.x - deltaX, 0, 100),
      y: clamp(coverDragStart.pos.y - deltaY, 0, 100)
    });
  }, [coverDragStart, onUpdateCoverPosition]);

  const handleCoverMouseUp = () => {
    setCoverDragStart(null);
  };

  const handleCoverTouchStart = (e: React.TouchEvent) => {
    if (!isRepositioningCover) return;
    e.preventDefault();
    const touch = e.touches[0];
    setCoverDragStart({
      x: touch.clientX,
      y: touch.clientY,
      pos: coverImagePosition || { x: 50, y: 50 }
    });
  };

  const handleCoverTouchMove = useCallback((e: React.TouchEvent) => {
    if (!coverDragStart || !coverContainerRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = coverContainerRef.current.getBoundingClientRect();
    const deltaX = ((touch.clientX - coverDragStart.x) / rect.width) * 100;
    const deltaY = ((touch.clientY - coverDragStart.y) / rect.height) * 100;
    onUpdateCoverPosition({
      x: clamp(coverDragStart.pos.x - deltaX, 0, 100),
      y: clamp(coverDragStart.pos.y - deltaY, 0, 100)
    });
  }, [coverDragStart, onUpdateCoverPosition]);

  const handleCoverTouchEnd = () => {
    setCoverDragStart(null);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const optimized = await resizeImage(dataUrl, 1024, 1536, 0.85);
          const blob = dataUrlToBlob(optimized);
          if (!blob) throw new Error('Failed to process image');
          
          const filename = `cover-${uuid()}-${Date.now()}.jpg`;
          const publicUrl = await uploadCoverImage(user.id, blob, filename);
          
          onUpdateCoverImage(publicUrl);
          onUpdateCoverPosition({ x: 50, y: 50 });
        } catch (error) {
          console.error('Cover upload failed:', error);
        } finally {
          setIsUploadingCover(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Cover upload failed:', error);
      console.error('Cover upload failed:', error);
      setIsUploadingCover(false);
    }
    e.target.value = '';
  };

  const handleDeleteCover = () => {
    setPendingDeleteCover(true);
  };

  const confirmDeleteCover = () => {
    onUpdateCoverImage('');
    onUpdateCoverPosition({ x: 50, y: 50 });
    setPendingDeleteCover(false);
  };

  const handleAddScene = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user) {
      console.error('Please sign in to upload scenes');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const optimized = await resizeImage(dataUrl, 1024, 768, 0.7);
          
          // Convert to blob and upload to Supabase Storage
          const blob = dataUrlToBlob(optimized);
          if (!blob) throw new Error('Failed to process image');
          
          const filename = `scene-${uuid()}-${Date.now()}.jpg`; // Use UUID for unique filename
          const publicUrl = await uploadSceneImage(user.id, blob, filename);
          
          const newScene: Scene = {
            id: uuid(), // Use UUID for Supabase
            url: publicUrl,
            tags: [],
            createdAt: now()
          };
          onUpdateScenes([newScene, ...scenes]);
          setEditingScene(newScene); // Open editor immediately for new scenes
        } catch (error) {
          console.error('Scene upload failed:', error);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Scene upload failed:', error);
      console.error('Scene upload failed:', error);
      setIsUploading(false);
    }
    e.target.value = '';
  };

  const handleSaveScene = (id: string, title: string, tags: string[]) => {
    const updatedScenes = scenes.map(s => s.id === id ? { ...s, title, tags } : s);
    onUpdateScenes(updatedScenes);
  };

  const handleDeleteScene = (id: string) => {
    setPendingDeleteSceneId(id);
  };

  const confirmDeleteScene = () => {
    if (pendingDeleteSceneId) {
      onUpdateScenes(scenes.filter(s => s.id !== pendingDeleteSceneId));
      setPendingDeleteSceneId(null);
    }
  };

  const mainCharacters = characters.filter(c => c.characterRole === 'Main');
  const sideCharacters = characters.filter(c => c.characterRole === 'Side');

  const noAICharacterError = publishErrors.noAICharacter;
  const noUserCharacterError = publishErrors.noUserCharacter;

  const AddCharacterPlaceholder: React.FC<{ label: string; hasError?: boolean }> = ({ label, hasError }) => (
    <button
      type="button"
      onClick={() => setIsCharacterCreationOpen(true)}
      className={cn(
        "w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5",
        hasError && "border border-red-500 ring-2 ring-red-500"
      )}
    >
      <Plus size={16} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <aside className="w-[300px] flex-shrink-0 bg-[#2a2a2f] shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] flex flex-col h-full">
        <div className="p-6 bg-[#3c3e47] shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)]">
          <div className="text-[10px] font-black text-white uppercase tracking-widest">Character Roster</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none pb-20 bg-[#2a2a2f]">
          <section className="space-y-2">
            <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-2 rounded-xl mb-3 shadow-lg cursor-pointer select-none" onClick={() => setMainCharsCollapsed(prev => !prev)}>
              <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
              <div className="flex items-center justify-between relative z-[1]">
                <div className="text-[10px] font-bold text-white uppercase tracking-wider">Main Characters</div>
                <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${mainCharsCollapsed ? 'rotate-180' : ''}`} />
              </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${mainCharsCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[2000px] opacity-100 overflow-visible'}`}>
              <div className="space-y-2">
                {mainCharacters.map(char => <CharacterRosterTile key={char.id} char={char} onSelect={onSelectCharacter} errors={publishErrors.characters?.[char.id]} isExpanded={expandedRosterTileId === char.id} onToggleExpand={(charId) => setExpandedRosterTileId(prev => prev === charId ? null : charId)} />)}
                <AddCharacterPlaceholder label="Main Character" hasError={!!noAICharacterError || !!noUserCharacterError} />
                {noAICharacterError && <p className="text-sm text-red-500 font-medium pl-2">{noAICharacterError}</p>}
                {noUserCharacterError && <p className="text-sm text-red-500 font-medium pl-2">{noUserCharacterError}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-2 rounded-xl mb-3 shadow-lg cursor-pointer select-none" onClick={() => setSideCharsCollapsed(prev => !prev)}>
              <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
              <div className="flex items-center justify-between relative z-[1]">
                <div className="text-[10px] font-bold text-white uppercase tracking-wider">Side Characters</div>
                <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${sideCharsCollapsed ? 'rotate-180' : ''}`} />
              </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${sideCharsCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[2000px] opacity-100 overflow-visible'}`}>
              <div className="space-y-2">
                {sideCharacters.map(char => <CharacterRosterTile key={char.id} char={char} onSelect={onSelectCharacter} errors={publishErrors.characters?.[char.id]} isExpanded={expandedRosterTileId === char.id} onToggleExpand={(charId) => setExpandedRosterTileId(prev => prev === charId ? null : charId)} />)}
                <AddCharacterPlaceholder label="Side Character" />
              </div>
            </div>
          </section>
        </div>
      </aside>

      <TabFieldNavigator className="flex-1 overflow-y-auto scrollbar-thin bg-ghost-white">
        <div className="p-4 lg:p-10 max-w-4xl mx-auto space-y-12 pb-20">
          <div className="mb-2">
            <h1 className="text-2xl lg:text-4xl font-black text-[hsl(var(--ui-surface-2))] tracking-tight">Story Setup</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Configure the foundation of your interactive narrative.</p>
          </div>

          {/* Cover Image Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              {/* Section Header - Steel Blue */}
              <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-[1]"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Story Card</h2>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                      <div className="flex flex-col md:flex-row gap-8">
                    {/* Preview Container - Portrait aspect ratio for story cards */}
                    <div data-publish-error={!!publishErrors.coverImage || undefined}>
                    <div 
                      ref={coverContainerRef}
                      onMouseDown={handleCoverMouseDown}
                      onMouseMove={handleCoverMouseMove}
                      onMouseUp={handleCoverMouseUp}
                      onMouseLeave={handleCoverMouseUp}
                      onTouchStart={handleCoverTouchStart}
                      onTouchMove={handleCoverTouchMove}
                      onTouchEnd={handleCoverTouchEnd}
                      style={isRepositioningCover ? { touchAction: 'none' } : undefined}
                      className={cn(
                        "relative w-full md:w-48 aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-200",
                        isRepositioningCover 
                          ? 'ring-4 ring-blue-500 cursor-move shadow-xl shadow-blue-500/20' 
                          : publishErrors.coverImage
                            ? 'border-2 border-red-500 ring-2 ring-red-500'
                            : coverImage
                              ? 'border-2 border-zinc-500 shadow-lg'
                              : 'shadow-lg'
                      )}
                    >
                      {coverImage ? (
                        <>
                          <img 
                            src={coverImage}
                            alt="Cover"
                            style={{ objectPosition: `${coverImagePosition.x}% ${coverImagePosition.y}%` }}
                            className="w-full h-full object-cover pointer-events-none select-none"
                            draggable={false}
                          />
                          {isRepositioningCover && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-full h-[1px] bg-blue-500/40 absolute" />
                              <div className="h-full w-[1px] bg-blue-500/40 absolute" />
                               <div className="bg-blue-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg absolute bottom-3 tracking-widest shadow-xl">
                                Drag to Refocus
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#1c1c1f] flex flex-col items-center justify-center gap-3 rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No Cover</span>
                        </div>
                      )}
                    </div>
                    {publishErrors.coverImage && (
                      <p className="text-sm text-red-500 font-medium mt-2">{publishErrors.coverImage}</p>
                    )}
                    </div>
                    
                    {/* Right column: buttons + fields */}
                    <div className="flex flex-col gap-4 flex-1">
                      <CoverImageActionButtons
                        onUploadFromDevice={() => coverFileInputRef.current?.click()}
                        onSelectFromLibrary={(imageUrl) => {
                          onUpdateCoverImage(imageUrl);
                          onUpdateCoverPosition({ x: 50, y: 50 });
                        }}
                        onGenerateClick={() => setShowCoverGenModal(true)}
                        disabled={isUploadingCover || isGeneratingCover}
                        isUploading={isUploadingCover}
                        isGenerating={isGeneratingCover}
                      />
                      
                      <div data-publish-error={!!publishErrors.storyTitle || undefined}>
                        <FieldLabel label="Story Name" fieldName="scenarioName" />
                         <AutoResizeTextarea value={world.core.scenarioName} onChange={(v) => updateCore({ scenarioName: v })} placeholder="e.g. Chronicles of Eldoria" className={`px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${(storyNameError && !world.core.scenarioName?.trim()) || publishErrors.storyTitle ? 'border border-red-500 ring-2 ring-red-500' : 'border-t border-black/35'}`} />
                        {((storyNameError && !world.core.scenarioName?.trim()) || publishErrors.storyTitle) && (
                          <p className="text-sm text-red-500 mt-1">{publishErrors.storyTitle || 'Story name is required'}</p>
                        )}
                      </div>
                      <div data-publish-error={!!publishErrors.briefDescription || undefined}>
                        <FieldLabel label="Brief Description" fieldName="briefDescription" />
                        <AutoResizeTextarea value={world.core.briefDescription || ''} onChange={(v) => updateCore({ briefDescription: v })} rows={2} placeholder="A short summary that appears on your story card (1-2 sentences)..." className={`px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${publishErrors.briefDescription ? 'border border-red-500 ring-2 ring-red-500' : 'border-t border-black/35'}`} />
                        {publishErrors.briefDescription && <p className="text-sm text-red-500 font-medium mt-1">{publishErrors.briefDescription}</p>}
                      </div>
                      
                      {coverImage && (
                        <div className="flex flex-wrap gap-3">
                          <button 
                            onClick={() => setIsRepositioningCover(!isRepositioningCover)}
                            className={`h-10 px-5 rounded-xl text-[10px] font-bold leading-none transition-colors ${
                              isRepositioningCover 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-[#303035] border-0 text-[#eaedf1] hover:bg-[#343439] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]'
                            }`}
                          >
                            {isRepositioningCover ? "Done" : "Reposition"}
                          </button>
                          <button 
                            onClick={handleDeleteCover}
                            className="h-10 px-5 rounded-xl text-[10px] font-bold leading-none bg-[hsl(var(--destructive))] hover:brightness-110 text-[hsl(var(--destructive-foreground))] border-0 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        ref={coverFileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleCoverUpload} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* World Core Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-[1]"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">World Core</h2>
              </div>
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                  <div className="grid grid-cols-1 gap-8">
                    <div data-publish-error={!!publishErrors.storyPremise || undefined}>
                      <FieldLabel label="Story Premise" fieldName="storyPremise" />
                      <AutoResizeTextarea value={world.core.storyPremise || ''} onChange={(v) => updateCore({ storyPremise: v })} rows={8} placeholder="What's the central situation or conflict? What's at stake? Describe the overall narrative the AI should understand..." className={`px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${publishErrors.storyPremise ? 'border border-red-500 ring-2 ring-red-500' : 'border-t border-black/35'}`} />
                      {publishErrors.storyPremise && <p className="text-sm text-red-500 mt-1">{publishErrors.storyPremise}</p>}
                    </div>
                    
                    {/* Structured Locations */}
                    <div data-publish-error={!!publishErrors.location || undefined}>
                      <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${publishErrors.location ? 'text-red-500' : 'text-zinc-400'}`}>Primary Locations</label>
                      {publishErrors.location && <p className="text-sm text-red-500 font-medium mb-2">{publishErrors.location}</p>}
                      <div className="space-y-3">
                        {(world.core.structuredLocations && world.core.structuredLocations.length > 0 
                          ? world.core.structuredLocations 
                          : [{ id: 'loc_default_1', label: '', description: '' }, { id: 'loc_default_2', label: '', description: '' }]
                        ).map((loc, idx) => (
                          <div key={loc.id} className="flex items-start gap-3">
                            <AutoResizeTextarea 
                              value={loc.label} 
                              onChange={(v) => {
                                const locs = [...(world.core.structuredLocations || [{ id: 'loc_default_1', label: '', description: '' }, { id: 'loc_default_2', label: '', description: '' }])];
                                locs[idx] = { ...locs[idx], label: v };
                                updateCore({ structuredLocations: locs });
                              }}
                              placeholder={idx === 0 ? "e.g. The Lakehouse" : "Location name..."}
className="w-2/5 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <AutoResizeTextarea 
                              value={loc.description}
                              onChange={(v) => {
                                const locs = [...(world.core.structuredLocations || [{ id: 'loc_default_1', label: '', description: '' }, { id: 'loc_default_2', label: '', description: '' }])];
                                locs[idx] = { ...locs[idx], description: v };
                                updateCore({ structuredLocations: locs });
                              }}
                              rows={1}
                              placeholder={idx === 0 ? "A secluded cabin by the lake..." : "Describe this location..."}
                              className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border-t border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const locs = [...(world.core.structuredLocations || [])];
                                locs.splice(idx, 1);
                                updateCore({ structuredLocations: locs.length > 0 ? locs : undefined });
                              }}
                              className="mt-2 text-zinc-500 hover:text-rose-400 transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const locs = [...(world.core.structuredLocations || [{ id: 'loc_default_1', label: '', description: '' }, { id: 'loc_default_2', label: '', description: '' }])];
                            locs.push({ id: uid('loc'), label: '', description: '' });
                            updateCore({ structuredLocations: locs });
                          }}
                          className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus size={16} />
                          <span>Add Location</span>
                        </button>
                      </div>
                    </div>
                    
                    
                    {/* Custom World Content Sections */}
                    {(world.core.customWorldSections || []).map((section, sIdx) => (
                      <div key={section.id} className="space-y-1">
                        <div className="flex items-center gap-3">
                          <AutoResizeTextarea
                            value={section.title}
                            onChange={(v) => {
                              const sections = [...(world.core.customWorldSections || [])];
                              sections[sIdx] = { ...sections[sIdx], title: v };
                              updateCore({ customWorldSections: sections });
                            }}
                            placeholder="Section Title..."
                            className="flex-1 bg-transparent border-none text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0 focus:ring-0 placeholder:text-zinc-500 placeholder:uppercase placeholder:tracking-widest placeholder:font-black"
                          />
                  <button
                    type="button"
                    tabIndex={-1}
                            onClick={() => {
                              const sections = (world.core.customWorldSections || []).filter((_, i) => i !== sIdx);
                              updateCore({ customWorldSections: sections.length > 0 ? sections : undefined });
                            }}
                            className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {(!section.type || section.type === 'structured') ? (
                          <>
                            {section.items.map((item, iIdx) => (
                              <div key={item.id} className="flex items-start gap-3">
                                <div className="w-2/5 flex items-center gap-1.5 min-w-0">
                                  <AutoResizeTextarea
                                    value={item.label}
                                    onChange={(v) => {
                                      const sections = [...(world.core.customWorldSections || [])];
                                      const items = [...sections[sIdx].items];
                                      items[iIdx] = { ...items[iIdx], label: v };
                                      sections[sIdx] = { ...sections[sIdx], items };
                                      updateCore({ customWorldSections: sections });
                                    }}
                                    placeholder="LABEL"
className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                  {(
                                  <button
                                    type="button"
                                    tabIndex={-1}
                                      onClick={() => {
                                        const fieldKey = `world_custom_${item.id}`;
                                        if (enhancingField) return;
                                        setEnhancingField(fieldKey as any);
                                        aiEnhanceWorldField(
                                          'customContent',
                                          item.value,
                                          { ...world.core, briefDescription: `Context for "${section.title}" section, field "${item.label}": ${world.core.briefDescription || ''}` },
                                          modelId
                                        ).then(enhanced => {
                                          const sections = [...(world.core.customWorldSections || [])];
                                          const items = [...sections[sIdx].items];
                                          items[iIdx] = { ...items[iIdx], value: enhanced };
                                          sections[sIdx] = { ...sections[sIdx], items };
                                          updateCore({ customWorldSections: sections });
                                        }).catch(err => {
                                          console.error('Enhancement failed:', err);
                                        }).finally(() => {
                                          setEnhancingField(null);
                                        });
                                      }}
                                      disabled={enhancingField !== null}
                                      title="Enhance with AI"
                                      className={cn(
                                        "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden transition-all text-cyan-200",
                                        enhancingField === `world_custom_${item.id}`
                                          ? "animate-pulse cursor-wait"
                                          : enhancingField !== null
                                          ? "opacity-50 cursor-not-allowed"
                                          : "hover:brightness-125"
                                      )}
                                      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
                                    >
                                      <span aria-hidden className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)' }} />
                                      <span aria-hidden className="absolute rounded-[6px] pointer-events-none" style={{ inset: '1.5px', background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33' }} />
                                      <Sparkles size={13} className="relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }} />
                                    </button>
                                  )}
                                </div>
                                <AutoResizeTextarea
                                  value={item.value}
                                  onChange={(v) => {
                                    const sections = [...(world.core.customWorldSections || [])];
                                    const items = [...sections[sIdx].items];
                                    items[iIdx] = { ...items[iIdx], value: v };
                                    sections[sIdx] = { ...sections[sIdx], items };
                                    updateCore({ customWorldSections: sections });
                                  }}
                                  rows={1}
                                  placeholder="Description..."
className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => {
                                    const sections = [...(world.core.customWorldSections || [])];
                                    sections[sIdx] = { ...sections[sIdx], items: sections[sIdx].items.filter((_, i) => i !== iIdx) };
                                    updateCore({ customWorldSections: sections });
                                  }}
                                  className="mt-2 text-zinc-500 hover:text-rose-400 transition-colors p-1"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const sections = [...(world.core.customWorldSections || [])];
                                sections[sIdx] = { ...sections[sIdx], items: [...sections[sIdx].items, { id: uid('wci'), label: '', value: '' }] };
                                updateCore({ customWorldSections: sections });
                              }}
                              className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Plus size={16} />
                              <span>Add Row</span>
                            </button>
                          </>
                        ) : (
                          /* Freeform: labeled text areas */
                          <>
                          {(() => {
                            const items = section.items.length > 0
                              ? section.items
                              : section.freeformValue
                                ? [{ id: uid('wci'), label: '', value: section.freeformValue }]
                                : [{ id: uid('wci'), label: '', value: '' }];
                            if (section.items.length === 0 && items.length > 0) {
                              const sections = [...(world.core.customWorldSections || [])];
                              sections[sIdx] = { ...sections[sIdx], items, freeformValue: undefined };
                              updateCore({ customWorldSections: sections });
                            }
                            return items.map((item, iIdx) => (
                              <div key={item.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <AutoResizeTextarea
                                    value={item.label}
                                    onChange={(v) => {
                                      const sections = [...(world.core.customWorldSections || [])];
                                      const updatedItems = [...sections[sIdx].items];
                                      updatedItems[iIdx] = { ...updatedItems[iIdx], label: v };
                                      sections[sIdx] = { ...sections[sIdx], items: updatedItems };
                                      updateCore({ customWorldSections: sections });
                                    }}
                                    placeholder="LABEL"
                                    className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border-t border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
                                  />
                                  <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => {
                                      const sections = [...(world.core.customWorldSections || [])];
                                      const updatedItems = sections[sIdx].items.filter((_, i) => i !== iIdx);
                                      sections[sIdx] = { ...sections[sIdx], items: updatedItems.length > 0 ? updatedItems : [{ id: uid('wci'), label: '', value: '' }] };
                                      updateCore({ customWorldSections: sections });
                                    }}
                                    className="text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <AutoResizeTextarea
                                  value={item.value}
                                  onChange={(v) => {
                                    const sections = [...(world.core.customWorldSections || [])];
                                    const updatedItems = [...sections[sIdx].items];
                                    updatedItems[iIdx] = { ...updatedItems[iIdx], value: v };
                                    sections[sIdx] = { ...sections[sIdx], items: updatedItems };
                                    updateCore({ customWorldSections: sections });
                                  }}
                                  rows={4}
                                  placeholder="Write your content here..."
className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                              </div>
                            ));
                          })()}
                          <button
                            type="button"
                            onClick={() => {
                              const sections = [...(world.core.customWorldSections || [])];
                              const currentItems = sections[sIdx].items.length > 0 ? sections[sIdx].items : [{ id: uid('wci'), label: '', value: sections[sIdx].freeformValue || '' }];
                              sections[sIdx] = { ...sections[sIdx], items: [...currentItems, { id: uid('wci'), label: '', value: '' }], freeformValue: undefined };
                              updateCore({ customWorldSections: sections });
                            }}
                            className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus size={16} /> Add Text Field
                          </button>
                          </>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Custom Content Button */}
                    <button
                      type="button"
                      onClick={() => setShowContentTypeModal(true)}
                      className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={16} />
                      Add Custom Content
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Story Goals Section */}
          <StoryGoalsSection
            goals={world.core.storyGoals || []}
            onChange={(goals) => updateCore({ storyGoals: goals })}
            hasError={!!publishErrors.storyArc}
            onEnhanceField={(fieldKey, getCurrentValue, setValue, customLabel) => {
              if (enhancingField) return;
              setEnhancingField(fieldKey as any);
              aiEnhanceWorldField(
                'customContent',
                getCurrentValue(),
                { ...world.core, briefDescription: `Context for "${customLabel}": ${world.core.briefDescription || ''}` },
                modelId
              ).then(enhanced => {
                setValue(enhanced);
              }).catch(err => {
                console.error('Enhancement failed:', err);
              }).finally(() => {
                setEnhancingField(null);
              });
            }}
            enhancingField={enhancingField as string | null}
          />

          {/* Opening Dialog Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-[1]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Opening Dialog</h2>
              </div>
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                  <div className="space-y-6">
                    <div data-publish-error={!!publishErrors.openingDialog || undefined}>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        Opening Dialog
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
                              <ul className="space-y-1 list-disc list-outside pl-4 font-semibold">
                                <li>Opening dialog displays at the start of every new session — set the scene for where the story begins.</li>
                                <li>Start dialog blocks with the character name followed by ":" (e.g., "James:").</li>
                                <li>Enclose spoken dialogue in " ".</li>
                                <li>Enclose physical actions in * *.</li>
                                <li>Enclose internal thoughts in ( ).</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                      <AutoResizeTextarea 
                        value={openingDialog.text} 
                        onChange={(v) => onUpdateOpening({ text: v })} 
                        rows={8} 
                        placeholder='James: *James looked up from where he sat on the ground* (What was that?) "Hello? Is anyone there?"'
                        className={`px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${publishErrors.openingDialog ? 'border border-red-500 ring-2 ring-red-500' : 'border-t border-black/35'}`}
                      />
                      {publishErrors.openingDialog && <p className="text-sm text-red-500 mt-1">{publishErrors.openingDialog}</p>}
                    </div>
                    
                    {/* Starting Day & Time + Mode Controls - Single Row */}
                    <div className="flex items-end gap-4 flex-wrap">
                      {/* Starting Day & Time group */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Starting Day & Time</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
                              Set when your story begins. The AI will use this context for time-appropriate responses.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Day Counter */}
                          <div className="flex items-center gap-1.5 bg-[#3c3e47] rounded-xl px-3 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                            <span className="text-[10px] font-bold text-zinc-400">Day</span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = openingDialog.startingDay || 1;
                                if (current > 1) onUpdateOpening({ startingDay: current - 1 });
                              }}
                              className="p-0.5 rounded-md hover:bg-zinc-700 text-zinc-400 transition-colors disabled:opacity-30"
                              disabled={(openingDialog.startingDay || 1) <= 1}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <span className="text-base font-bold text-white min-w-[2ch] text-center">
                              {openingDialog.startingDay || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = openingDialog.startingDay || 1;
                                onUpdateOpening({ startingDay: current + 1 });
                              }}
                              className="p-0.5 rounded-md hover:bg-zinc-700 text-zinc-400 transition-colors"
                            >
                              <ChevronUp size={14} />
                            </button>
                          </div>

                          {/* Time of Day Icons */}
                          <div className="flex items-center gap-1 bg-[#3c3e47] rounded-xl p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                            {([
                              { key: 'sunrise' as TimeOfDay, icon: Sunrise, label: 'Sunrise' },
                              { key: 'day' as TimeOfDay, icon: Sun, label: 'Day' },
                              { key: 'sunset' as TimeOfDay, icon: Sunset, label: 'Sunset' },
                              { key: 'night' as TimeOfDay, icon: Moon, label: 'Night' },
                            ] as const).map(({ key, icon: Icon, label }) => {
                              const isActive = (openingDialog.startingTimeOfDay || 'day') === key;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => onUpdateOpening({ startingTimeOfDay: key })}
                                  title={label}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    isActive 
                                      ? 'bg-blue-500 text-white shadow-md' 
                                      : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                  }`}
                                >
                                  <Icon size={16} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Mode group */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mode</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
                              <ul className="list-disc list-outside pl-4 space-y-1">
                                <li><strong>Manual:</strong> User will update the day and time counters manually when they want the day/time to advance.</li>
                                <li><strong>Automatic:</strong> Time/day will progress by set intervals.</li>
                                <li>Users can adjust these settings during their playthrough in the chat settings tab.</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                          <button
                            type="button"
                            onClick={() => onUpdateOpening({ timeProgressionMode: 'manual' })}
                            className={cn(
                              "px-3.5 py-1.5 text-[10px] font-black rounded-lg border-none cursor-pointer transition-all",
                              (openingDialog.timeProgressionMode || 'manual') === 'manual'
                                ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                                : "bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300"
                            )}
                          >
                            Manual
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateOpening({ timeProgressionMode: 'automatic' })}
                            className={cn(
                              "px-3.5 py-1.5 text-[10px] font-black rounded-lg border-none cursor-pointer transition-all",
                              openingDialog.timeProgressionMode === 'automatic'
                                ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                                : "bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300"
                            )}
                          >
                            Automatic
                          </button>
                        </div>
                      </div>

                      {/* Time Interval group */}
                      <div className={cn(
                        "transition-opacity",
                        (openingDialog.timeProgressionMode || 'manual') === 'manual' && "opacity-40 pointer-events-none"
                      )}>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Time Interval</label>
                        <select
                          value={openingDialog.timeProgressionInterval || 15}
                          onChange={(e) => onUpdateOpening({ timeProgressionInterval: Number(e.target.value) })}
                          className="bg-[#1c1c1f] border border-black/35 rounded-xl text-xs text-white px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={5}>5 minutes</option>
                          <option value={10}>10 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Scene Gallery Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-[1]"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Scene Gallery</h2>
              </div>
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                {/* Header row: label + tooltip on left, buttons on right */}
                <div className="flex items-end justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Scene Gallery Photos</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
                        <ul className="space-y-1 list-disc list-outside pl-4 font-semibold">
                          <li>Upload images to be used for different scenes.</li>
                          <li>Add "tags" for each image.</li>
                          <li>Background adapts based on tags mentioned in dialog.</li>
                          <li>Recommend: 1280×896, 4:3 landscape.</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <SceneGalleryActionButtons
                    onUploadFromDevice={() => fileInputRef.current?.click()}
                    onSelectFromLibrary={(imageUrl) => {
                      const newScene: Scene = {
                        id: uuid(),
                        url: imageUrl,
                        tags: [],
                        createdAt: now()
                      };
                      onUpdateScenes([newScene, ...scenes]);
                      setEditingScene(newScene);
                    }}
                    onGenerateClick={() => setShowSceneGenModal(true)}
                    disabled={isUploading || isGeneratingScene}
                    isUploading={isUploading}
                    isGenerating={isGeneratingScene}
                  />
                </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddScene} />
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {scenes.map(scene => {
                      const sceneTags = scene.tags ?? ((scene as any).tag ? [(scene as any).tag] : []);
                      
                      return (
                        <div key={scene.id} className="group relative rounded-xl overflow-hidden bg-zinc-800 cursor-pointer shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]" onClick={() => setEditingScene({ ...scene, tags: sceneTags })}>
                          {/* Image with zoom hover */}
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={scene.url} 
                              alt={scene.title || 'Scene'} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                          </div>
                          
                          {/* Footer bar */}
                          <div className="bg-zinc-700 px-3 py-2 flex items-center justify-between">
                            <span className="text-xs text-white/80 font-medium truncate">{scene.title || 'Untitled scene'}</span>
                            {sceneAspectRatios[scene.id] ? (
                              <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <AspectRatioIcon orientation={sceneAspectRatios[scene.id].orientation} />
                                <span className="text-[10px] text-zinc-400">{sceneAspectRatios[scene.id].label}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-2">…</span>
                            )}
                          </div>
                          
                          {/* Delete button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                          >
                            <Icons.Trash />
                          </button>
                          
                          {/* Starting Scene star */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedScenes = scenes.map(s => ({
                                ...s,
                                isStartingScene: s.id === scene.id ? !s.isStartingScene : false
                              }));
                              onUpdateScenes(updatedScenes);
                            }}
                            className={`absolute top-2 left-2 p-1.5 rounded-lg transition-all ${
                              scene.isStartingScene 
                                ? 'bg-amber-500 text-white opacity-100 shadow-lg shadow-amber-500/30' 
                                : 'bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/70'
                            }`}
                            title={scene.isStartingScene ? "Starting scene" : "Set as starting scene"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={scene.isStartingScene ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </button>
                          {scene.isStartingScene && (
                            <div className="absolute top-2 left-10 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-lg">
                              Start
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {scenes.length === 0 && (
                      <div className="col-span-full py-12 text-center text-zinc-500 rounded-2xl bg-[#1c1c1f] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                         <p className="text-xs font-bold uppercase tracking-widest">No scenes uploaded</p>
                         <p className="text-sm mt-1 text-zinc-500">Upload images to enable dynamic backgrounds in chat.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Art Style Preference Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-[1]">
                  <circle cx="13.5" cy="6.5" r="2.5"/>
                  <circle cx="6" cy="12" r="2.5"/>
                  <circle cx="18" cy="12" r="2.5"/>
                  <circle cx="9" cy="18.5" r="2.5"/>
                  <circle cx="17" cy="18.5" r="2.5"/>
                  <path d="M12 2v1"/>
                </svg>
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Art Style Preference</h2>
              </div>
              <div className="p-5 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Art Style Selection</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-blue-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-semibold leading-relaxed normal-case tracking-normal max-w-[300px]">
                      Select an art style you would like the AI to use when generating character avatars or images during your playthrough.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="p-3 bg-[#2e2e33] rounded-xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] overflow-visible">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {AVATAR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => onUpdateArtStyle(style.id)}
                        className={cn(
                          "relative rounded-xl p-2 transition-all duration-200 cursor-pointer outline-none",
                          "bg-zinc-800 hover:bg-zinc-700",
                          selectedArtStyle === style.id
                            ? "ring-2 ring-blue-500 shadow-md shadow-blue-500/20"
                            : "ring-1 ring-zinc-600 hover:ring-zinc-500",
                          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                        )}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-zinc-900">
                          <img
                            src={style.thumbnailUrl}
                            alt={style.displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-semibold text-zinc-200 text-center mt-2 truncate">
                          {style.displayName}
                        </p>
                        {selectedArtStyle === style.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* World Codex Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-[1]"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">World Codex</h2>
              </div>
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                  <div className="space-y-8">
                    
                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">
                        Dialog Formatting
                        <Lock className="w-3 h-3 text-zinc-500" />
                      </label>
                      
                      {/* Critical rules - always present, read-only */}
                      <div className="bg-[#1c1c1f] rounded-lg px-3 py-2 text-sm text-zinc-300 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Enclose all spoken dialogue in " "</li>
                          <li>Enclose all physical actions or descriptions in * *</li>
                          <li>Enclose all internal thoughts in ( )</li>
                        </ul>
                      </div>
                      
                      {/* User's additional formatting preferences - editable */}
                      <div className="mt-4">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Additional Formatting Rules (Optional)</label>
                        <AutoResizeTextarea 
                          value={world.core.dialogFormatting} 
                          onChange={(v) => updateCore({ dialogFormatting: v })} 
                          rows={3} 
                          placeholder="Add any custom formatting preferences here..."
className="px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {world.entries.length > 0 && (
                      <div className="space-y-6 pt-6 border-t border-white/10">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Additional Entries</h3>
                        <div className="grid grid-cols-1 gap-6">
                          {world.entries.map(entry => (
                            <div key={entry.id} className="p-6 space-y-4 group rounded-2xl bg-zinc-800/50 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <AutoResizeTextarea 
                                    value={entry.title} 
                                    onChange={(v) => handleUpdateEntry(entry.id, { title: v })} 
                                    placeholder="Entry Title..." 
                                    className="text-sm font-bold bg-transparent border-none px-0 focus:ring-0 text-white placeholder:text-zinc-500"
                                  />
                                </div>
                                <Button variant="ghost" className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 !p-0 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => {
                                  const next = world.entries.filter(e => e.id !== entry.id);
                                  onUpdateWorld({ entries: next });
                                }}><Icons.Trash /></Button>
                              </div>
                              <AutoResizeTextarea value={entry.body} onChange={(v) => handleUpdateEntry(entry.id, { body: v })} placeholder="Detail the specifics..." rows={4} className="px-3 py-2 text-sm bg-[#1c1c1f] border-t border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Content Themes Section */}
          <ContentThemesSection
            themes={contentThemes}
            onUpdate={onUpdateContentThemes}
            tagsError={publishErrors.tags}
            storyTypeError={publishErrors.storyType}
          />

          {/* Share Section */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
                <Share2 className="w-5 h-5 text-white relative z-[1]" />
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Share Your Story</h2>
              </div>
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    const errors = validateForPublish({
                      scenarioTitle: world.core.scenarioName || '',
                      world,
                      characters,
                      openingDialog,
                      contentThemes,
                      coverImage,
                    });
                    setPublishErrors(errors);
                    if (!hasPublishErrors(errors)) {
                      setShowShareModal(true);
                    } else {
                      // Auto-scroll to first errored field
                      setTimeout(() => {
                        const firstError = document.querySelector('[data-publish-error="true"]');
                        if (firstError) {
                          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 50);
                    }
                  }}
                  className="flex h-10 w-full items-center justify-center gap-2 px-4
                    rounded-xl border-0
                    bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]
                    text-[#eaedf1] text-xs font-bold leading-none
                    hover:bg-[#44464f] active:bg-[#44464f]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
                    transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Publish to Gallery</span>
                </button>

                {/* Inline publish validation errors */}
                {hasPublishErrors(publishErrors) && (
                  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-red-300">Please fix the following before publishing:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-red-200/70">
                          {publishErrors.storyTitle && <li>{publishErrors.storyTitle}</li>}
                          {publishErrors.storyPremise && <li>{publishErrors.storyPremise}</li>}
                          {publishErrors.openingDialog && <li>{publishErrors.openingDialog}</li>}
                          {publishErrors.tags && <li>{publishErrors.tags}</li>}
                          {publishErrors.storyType && <li>{publishErrors.storyType}</li>}
                          {publishErrors.noAICharacter && <li>{publishErrors.noAICharacter}</li>}
                          {publishErrors.noUserCharacter && <li>{publishErrors.noUserCharacter}</li>}
                          {publishErrors.characters && Object.entries(publishErrors.characters).map(([cid, msgs]) => {
                            const char = characters.find(c => c.id === cid);
                            const charName = char?.name && char.name !== 'New Character' ? char.name : 'Unnamed character';
                            return msgs.map((msg, i) => <li key={`${cid}-${i}`}>{charName}: {msg}</li>);
                          })}
                          {publishErrors.location && <li>{publishErrors.location}</li>}
                          {publishErrors.storyArc && <li>{publishErrors.storyArc}</li>}
                          {publishErrors.coverImage && <li>{publishErrors.coverImage}</li>}
                          {publishErrors.briefDescription && <li>{publishErrors.briefDescription}</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </TabFieldNavigator>
      
      {/* Scene Tag Editor Modal */}
      <SceneTagEditorModal
        isOpen={!!editingScene}
        onClose={() => setEditingScene(null)}
        scene={editingScene}
        onSave={handleSaveScene}
      />
      
      {/* Cover Image Generation Modal */}
      <CoverImageGenerationModal
        isOpen={showCoverGenModal}
        onClose={() => setShowCoverGenModal(false)}
        onGenerated={async (imageUrl) => {
          try {
            const { compressAndUpload } = await import('@/utils');
            const compressedUrl = await compressAndUpload(imageUrl, 'covers', user?.id || 'anon', 1024, 1536, 0.85);
            onUpdateCoverImage(compressedUrl);
          } catch {
            // Fallback to original URL if compression fails
            onUpdateCoverImage(imageUrl);
          }
          onUpdateCoverPosition({ x: 50, y: 50 });
          setShowCoverGenModal(false);
          
        }}
        scenarioTitle={world.core.scenarioName}
      />
      
      {/* Scene Image Generation Modal */}
      <SceneImageGenerationModal
        isOpen={showSceneGenModal}
        onClose={() => setShowSceneGenModal(false)}
        onGenerate={async (prompt, styleId) => {
          if (!user) {
            console.error('Please sign in to generate scenes');
            return;
          }
          
          setIsGeneratingScene(true);
          try {
            const style = getStyleById(styleId);
            const artStylePrompt = style?.backendPrompt || '';
            
            const { data, error } = await supabase.functions.invoke('generate-cover-image', {
              body: {
                prompt: `Scene: ${prompt}. Landscape composition, 4:3 aspect ratio, widescreen environment background.`,
                artStylePrompt,
                scenarioTitle: world.core.scenarioName
              }
            });
            
            if (error) throw error;
            
            if (data?.imageUrl) {
              // Compress before saving
              let finalUrl = data.imageUrl;
              try {
                const { compressAndUpload } = await import('@/utils');
                finalUrl = await compressAndUpload(data.imageUrl, 'scenes', user!.id, 1024, 768, 0.85);
              } catch { /* use original */ }
              // Create new scene with the compressed image
              const newScene: Scene = {
                id: uuid(),
                url: finalUrl,
                tags: [],
                createdAt: now()
              };
              onUpdateScenes([newScene, ...scenes]);
              setEditingScene(newScene);
              setShowSceneGenModal(false);
              
            } else {
              throw new Error('No image URL returned');
            }
          } catch (err) {
            console.error('Scene generation failed:', err);
            console.error('Failed to generate scene:', err);
          } finally {
            setIsGeneratingScene(false);
          }
        }}
        isGenerating={isGeneratingScene}
        selectedArtStyle={selectedArtStyle}
      />
      
      {/* Share Scenario Modal */}
      {user && (
        <ShareScenarioModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          scenarioId={scenarioId}
          scenarioTitle={world.core.scenarioName || 'Untitled Story'}
          userId={user.id}
        />
      )}
      
      {/* Delete Confirm Dialogs */}
      <DeleteConfirmDialog
        open={pendingDeleteCover}
        onOpenChange={setPendingDeleteCover}
        onConfirm={confirmDeleteCover}
        title="Remove cover image?"
        message="This will remove the cover image from your scenario."
      />
      <DeleteConfirmDialog
        open={!!pendingDeleteSceneId}
        onOpenChange={(open) => { if (!open) setPendingDeleteSceneId(null); }}
        onConfirm={confirmDeleteScene}
        title="Remove scene image?"
        message="This will remove the scene image from your gallery."
      />

      {/* Enhance Mode Selector Modal */}
      <EnhanceModeModal
        open={enhanceModeTarget !== null}
        onClose={() => setEnhanceModeTarget(null)}
        onSelect={handleEnhanceModeSelect}
      />

      {/* Character Creation Modal */}
      <CharacterCreationModal
        open={isCharacterCreationOpen}
        onClose={() => setIsCharacterCreationOpen(false)}
        onImportFromLibrary={onOpenLibraryPicker}
        onCreateNew={onCreateCharacter}
      />

      {/* Content Type Picker Modal */}
      <CustomContentTypeModal
        open={showContentTypeModal}
        onClose={() => setShowContentTypeModal(false)}
        onSelect={(type) => {
          const sections = [...(world.core.customWorldSections || [])];
          sections.push({
            id: uid('wcs'),
            title: '',
            type,
            items: type === 'structured' ? [{ id: uid('wci'), label: '', value: '' }] : [{ id: uid('wci'), label: '', value: '' }],
            freeformValue: type === 'freeform' ? '' : undefined,
          });
          updateCore({ customWorldSections: sections });
        }}
      />
    </div>
  );
};
