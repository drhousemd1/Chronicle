import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Character, CharacterTraitSection, CharacterTraitSectionType, ScenarioData, PhysicalAppearance, CurrentlyWearing, PreferredClothing, CharacterGoal, CharacterExtraRow, CharacterBackground, CharacterTone, CharacterKeyLifeEvents, CharacterRelationships, CharacterSecrets, CharacterFears, defaultCharacterBackground } from '@/types';
import { CustomContentTypeModal } from '@/components/chronicle/CustomContentTypeModal';
import { TabFieldNavigator } from '@/components/chronicle/TabFieldNavigator';
import { Button } from '@/components/chronicle/UI';
import { Icons } from '@/constants';
import { uid, now, clamp, compressAndUpload, resizeImage } from '@/utils';
import { useAuth } from '@/hooks/use-auth';
import { uploadAvatar, dataUrlToBlob, updateNavButtonImages, loadNavButtonImages } from '@/services/supabase-data';
import { AvatarGenerationModal } from '@/components/chronicle/AvatarGenerationModal';
import { AvatarActionButtons } from '@/components/chronicle/AvatarActionButtons';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  X,
  PenSquare,
  Fingerprint,
  Accessibility,
  Shirt,
  Brain,
  Mic2,
  ScrollText,
  Users,
  EyeOff,
  TriangleAlert,
  Flag,
  CircleUserRound,
  Stars,
  Pencil,
  Move,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { aiEnhanceCharacterField, GENERATE_BOTH_PREFIX, parseGenerateBothResponse } from '@/services/character-ai';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { EnhanceModeModal, EnhanceMode } from '@/components/chronicle/EnhanceModeModal';
import { CharacterGoalsSection } from '@/components/chronicle/CharacterGoalsSection';
import { PersonalitySection } from '@/components/chronicle/PersonalitySection';
import { defaultPersonality } from '@/components/chronicle/PersonalitySection';
import { NavButtonImageConfig, SectionProgress } from '@/features/character-builder/types/character-builder.types';
import { AutoResizeTextareaField } from '@/features/character-builder/rows/AutoResizeTextareaField';
import { HardcodedSection } from '@/features/character-builder/sections/HardcodedSection';
import { HardcodedRow } from '@/features/character-builder/rows/HardcodedRow';
import { ExtraRow } from '@/features/character-builder/rows/ExtraRow';
import { TraitNavButton } from '@/features/character-builder/sidebar/TraitNavButton';
import { TraitProgressRing } from '@/features/character-builder/sidebar/TraitProgressRing';
import {
  CANONICAL_CHARACTER_BUILT_IN_SECTIONS,
  getCharacterSectionKeyAliases,
  isCharacterSectionKeyMatch,
  toCanonicalCharacterSectionKey,
} from '@/features/character-builder/utils/section-keys';
import {
  calculateCharacterSectionProgress,
  emptySectionProgress,
} from '@/features/character-builder/utils/section-progress';
import {
  clampPercent,
  mapPreviewToTilePosition,
  Size2D,
} from '@/features/shared-builder/utils/image-position';
import { supabase } from '@/integrations/supabase/client';

export interface CharacterBuilderScreenProps {
  appData: ScenarioData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Character>) => void;
  onDelete: (id: string) => void;
  onAddSection?: (type?: CharacterTraitSectionType) => void;
  onAddNew?: () => void;
  scenarioId?: string | null;
  isAdmin?: boolean;
  navButtonImages?: Record<string, NavButtonImageConfig>;
  onNavButtonImagesChange?: (images: Record<string, NavButtonImageConfig>) => void;
}

const TRAIT_NAV_ICON_BY_KEY: Record<string, LucideIcon> = {
  basics: Fingerprint,
  physicalAppearance: Accessibility,
  currentlyWearing: CircleUserRound,
  preferredClothing: Shirt,
  personality: Brain,
  tone: Mic2,
  background: ScrollText,
  keyLifeEvents: Stars,
  relationships: Users,
  secrets: EyeOff,
  fears: TriangleAlert,
  characterGoals: Flag,
};
const BUILT_IN_TRAIT_SECTIONS = [...CANONICAL_CHARACTER_BUILT_IN_SECTIONS];
const NON_BASICS_BUILT_IN_TRAIT_SECTIONS = BUILT_IN_TRAIT_SECTIONS.filter(
  (section) => section.key !== 'basics'
);

const CHARACTER_NAV_SIDEBAR_WIDTH = 320;
const CHARACTER_NAV_BUTTON_HEIGHT = 60;
const CHARACTER_NAV_OUTER_PADDING = 10;
const CHARACTER_NAV_TRAY_PADDING = 10;
const CHARACTER_NAV_PREVIEW_WIDTH =
  CHARACTER_NAV_SIDEBAR_WIDTH - CHARACTER_NAV_OUTER_PADDING * 2 - CHARACTER_NAV_TRAY_PADDING * 2;

const CHARACTER_HEADER_TILE_WIDTH = 268;
const CHARACTER_HEADER_TILE_HEIGHT = 140;
const CHARACTER_AVATAR_PREVIEW_SIZE = 192;

const headerTileNaturalSizeCache = new Map<string, Size2D>();
const calculateSectionProgress = calculateCharacterSectionProgress;

const normalizeNavButtonImageMap = (
  images: Record<string, NavButtonImageConfig> | null | undefined
): Record<string, NavButtonImageConfig> => {
  if (!images) return {};
  return Object.entries(images).reduce<Record<string, NavButtonImageConfig>>((acc, [rawKey, value]) => {
    acc[toCanonicalCharacterSectionKey(rawKey)] = value;
    return acc;
  }, {});
};

const withLegacyNavButtonImageAliases = (
  images: Record<string, NavButtonImageConfig>
): Record<string, NavButtonImageConfig> => {
  if (!images.basics && images.profile) {
    return { ...images, basics: images.profile };
  }
  if (images.basics && !images.profile) {
    return { ...images, profile: images.basics };
  }
  return images;
};

export const CharacterBuilderScreen: React.FC<CharacterBuilderScreenProps> = ({ 
  appData, 
  selectedId, 
  onSelect, 
  onUpdate, 
  onDelete,
  onAddSection: externalAddSection,
  onAddNew,
  scenarioId,
  isAdmin,
  navButtonImages: navButtonImagesProp,
  onNavButtonImagesChange
}) => {
  const { user } = useAuth();
  const characters = appData.characters;
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number, pos: { x: number, y: number } } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [enhancingField, setEnhancingField] = useState<string | null>(null);
  const [enhanceModeTarget, setEnhanceModeTarget] = useState<{
    fieldKey: string;
    section: 'physicalAppearance' | 'currentlyWearing' | 'preferredClothing' | 'custom';
    getCurrentValue: () => string;
    setValue: (value: string) => void;
    customLabel?: string;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    avatar: true,
    physicalAppearance: true,
    currentlyWearing: true,
    preferredClothing: true,
    personality: true,
    tone: true,
    background: true,
    keyLifeEvents: true,
    relationships: true,
    secrets: true,
    fears: true,
    characterGoals: true
  });
  const [expandedCustomSections, setExpandedCustomSections] = useState<Record<string, boolean>>({});
  const [activeTraitSection, setActiveTraitSection] = useState<string>('basics');
  const [localNavButtonImages, setLocalNavButtonImages] = useState<Record<string, NavButtonImageConfig>>({});
  const navButtonImages = navButtonImagesProp ?? localNavButtonImages;
  const setNavButtonImages = onNavButtonImagesChange ?? setLocalNavButtonImages;
  const [showNavImageEditor, setShowNavImageEditor] = useState(false);
  const [editingNavKey, setEditingNavKey] = useState<string>('physicalAppearance');
  const [draftNavImage, setDraftNavImage] = useState<NavButtonImageConfig | null>(null);
  const [isDraggingNavImage, setIsDraggingNavImage] = useState(false);
  const navDragStartRef = useRef<{ mouseX: number; mouseY: number; imageX: number; imageY: number } | null>(null);
  const navImageFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const getNavImageForSection = useCallback(
    (sectionKey: string): NavButtonImageConfig | undefined => {
      for (const alias of getCharacterSectionKeyAliases(sectionKey)) {
        if (navButtonImages[alias]) return navButtonImages[alias];
      }
      return undefined;
    },
    [navButtonImages]
  );

  // Load nav button images from global app_settings on mount (only if not provided via props)
  useEffect(() => {
    if (!navButtonImagesProp) {
      loadNavButtonImages().then((images) => {
        setLocalNavButtonImages(normalizeNavButtonImageMap(images as Record<string, NavButtonImageConfig>));
      }).catch(() => {});
    }
  }, [navButtonImagesProp]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCustomSection = (sectionId: string) => {
    setExpandedCustomSections(prev => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? true)
    }));
  };

  const selected = characters.find(c => c.id === selectedId);

  // ── Header tile image positioning (Phase B) ──
  const [headerTileImageSize, setHeaderTileImageSize] = useState<Size2D | null>(
    () => (selected?.avatarDataUrl ? headerTileNaturalSizeCache.get(selected.avatarDataUrl) ?? null : null)
  );

  useEffect(() => {
    if (!selected?.avatarDataUrl) { setHeaderTileImageSize(null); return; }
    const cached = headerTileNaturalSizeCache.get(selected.avatarDataUrl);
    if (cached) { setHeaderTileImageSize(cached); return; }
    let cancelled = false;
    const img = new Image();
    const commit = () => {
      const s = { width: img.naturalWidth || 1, height: img.naturalHeight || 1 };
      headerTileNaturalSizeCache.set(selected.avatarDataUrl!, s);
      if (!cancelled) setHeaderTileImageSize(s);
    };
    img.onload = commit;
    img.onerror = () => { if (!cancelled) setHeaderTileImageSize(null); };
    img.src = selected.avatarDataUrl;
    if (img.complete && img.naturalWidth > 0) commit();
    return () => { cancelled = true; };
  }, [selected?.avatarDataUrl]);

  const headerTileObjectPosition = useMemo(() => {
    const stored = {
      x: clampPercent(selected?.avatarPosition?.x ?? 50),
      y: clampPercent(selected?.avatarPosition?.y ?? 50),
    };
    if (!headerTileImageSize) return stored;
    return mapPreviewToTilePosition(
      stored,
      headerTileImageSize,
      { width: CHARACTER_AVATAR_PREVIEW_SIZE, height: CHARACTER_AVATAR_PREVIEW_SIZE },
      { width: CHARACTER_HEADER_TILE_WIDTH, height: CHARACTER_HEADER_TILE_HEIGHT }
    );
  }, [selected?.avatarPosition?.x, selected?.avatarPosition?.y, headerTileImageSize]);
  const customTraitNavItems = useMemo(() => (selected?.sections || []).map((section) => ({
    key: `custom:${section.id}`,
    label: section.title?.trim() || 'Custom Section',
  })), [selected?.sections]);
  const sidebarTraitNavItems = useMemo(() => ([
    { key: 'basics', label: 'Basics' },
    ...NON_BASICS_BUILT_IN_TRAIT_SECTIONS,
    ...customTraitNavItems,
  ]), [customTraitNavItems]);
  const traitNavItems = useMemo(() => [...BUILT_IN_TRAIT_SECTIONS, ...customTraitNavItems], [customTraitNavItems]);
  const sectionProgressByKey = selected
    ? traitNavItems.reduce<Record<string, SectionProgress>>((acc, item) => {
        acc[item.key] = calculateSectionProgress(selected, item.key);
        return acc;
      }, {})
    : {};
  const isTraitVisible = (key: string) => isCharacterSectionKeyMatch(activeTraitSection, key);

  useEffect(() => {
    if (!selectedId) return;
    if (traitNavItems.length === 0) return;
    const isActiveValid = traitNavItems.some((item) => isCharacterSectionKeyMatch(item.key, activeTraitSection));
    if (!isActiveValid) {
      setActiveTraitSection(traitNavItems[0].key);
    }
  }, [selectedId, activeTraitSection, traitNavItems]);

  // Auto-navigate to newly added custom section
  const prevSectionCountRef = useRef(selected?.sections?.length ?? 0);
  useEffect(() => {
    if (!selected) return;
    const currentCount = selected.sections.length;
    if (currentCount > prevSectionCountRef.current && currentCount > 0) {
      const newest = selected.sections[currentCount - 1];
      setActiveTraitSection(`custom:${newest.id}`);
    }
    prevSectionCountRef.current = currentCount;
  }, [selected, selected?.sections?.length]);

  const loadNavImageDraft = useCallback((navKey: string) => {
    setEditingNavKey(navKey);
    const existing = getNavImageForSection(navKey);
    setDraftNavImage(existing ? { ...existing } : null);
  }, [getNavImageForSection]);

  const openNavImageEditor = () => {
    const fallbackKey = sidebarTraitNavItems[0]?.key;
    const targetKey = sidebarTraitNavItems.some((item) => isCharacterSectionKeyMatch(item.key, activeTraitSection))
      ? activeTraitSection
      : fallbackKey;
    if (!targetKey) return;
    loadNavImageDraft(targetKey);
    setShowNavImageEditor(true);
  };

  const handleNavImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const src = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '';
      if (!src) return;
      setDraftNavImage({ src, x: 0, y: 0, scale: 1 });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleNavImageMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draftNavImage) return;
    setIsDraggingNavImage(true);
    navDragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      imageX: draftNavImage.x,
      imageY: draftNavImage.y,
    };
    event.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingNavImage) return;
    const handleMouseMove = (event: MouseEvent) => {
      const dragStartState = navDragStartRef.current;
      if (!dragStartState) return;
      const deltaX = event.clientX - dragStartState.mouseX;
      const deltaY = event.clientY - dragStartState.mouseY;
      setDraftNavImage((prev) => (prev
        ? {
            ...prev,
            x: dragStartState.imageX + deltaX,
            y: dragStartState.imageY + deltaY,
          }
        : prev));
    };

    const handleMouseUp = () => {
      setIsDraggingNavImage(false);
      navDragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingNavImage]);

  const handleNavImageWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!draftNavImage) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    setDraftNavImage((prev) => (prev
      ? {
          ...prev,
          scale: clamp(prev.scale + delta, 0.2, 3),
        }
      : prev));
  };

  const handleNavImageScaleChange = (value: string) => {
    const nextScale = clamp(Number(value) / 100, 0.2, 3);
    setDraftNavImage((prev) => (prev
      ? { ...prev, scale: nextScale }
      : prev));
  };

  const handleSaveNavImage = async () => {
    let imageToSave = draftNavImage;

    // Upload original quality image to storage (CDN handles fast delivery)
    if (imageToSave && imageToSave.src.startsWith('data:') && user) {
      try {
        const response = await fetch(imageToSave.src);
        const blob = await response.blob();
        const filename = `${user.id}/nav-btn-${editingNavKey}-${Date.now()}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
        const { error } = await supabase.storage
          .from('backgrounds')
          .upload(filename, blob, { upsert: true, contentType: blob.type });
        if (error) throw error;
        const { data } = supabase.storage.from('backgrounds').getPublicUrl(filename);
        imageToSave = { ...imageToSave, src: data.publicUrl };
      } catch (e) {
        console.error('Failed to upload nav button image:', e);
      }
    }

    const updatedImages = normalizeNavButtonImageMap(navButtonImages);
    if (imageToSave) updatedImages[editingNavKey] = imageToSave;
    else delete updatedImages[editingNavKey];

    setNavButtonImages(updatedImages);

    // Persist to global app_settings — await before closing
    try {
      await updateNavButtonImages(withLegacyNavButtonImageAliases(updatedImages));
      setShowNavImageEditor(false);
    } catch (e) {
      console.error('Failed to persist nav button images:', e);
      // Keep modal open on failure so user can retry
    }
  };

  const handleRemoveNavImage = () => {
    setDraftNavImage(null);
  };

  const navActionButtonClass = "relative w-full min-h-[60px] px-[14px] rounded-xl border-2 border-transparent text-left select-none overflow-hidden flex items-center justify-between gap-3 bg-[#3c3e47] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-[filter,transform,box-shadow,border-color] duration-150 ease-out hover:brightness-[1.12] hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99]";

  // Open modal to choose enhance mode before calling AI
  const openEnhanceModeModal = (
    fieldKey: string,
    section: 'physicalAppearance' | 'currentlyWearing' | 'preferredClothing' | 'custom',
    getCurrentValue: () => string,
    setValue: (value: string) => void,
    customLabel?: string
  ) => {
    if (enhancingField) return;
    setEnhanceModeTarget({ fieldKey, section, getCurrentValue, setValue, customLabel });
  };

  // Handler for per-field AI enhancement (called after mode selection)
  const handleEnhanceField = async (
    fieldKey: string,
    section: 'physicalAppearance' | 'currentlyWearing' | 'preferredClothing' | 'custom',
    getCurrentValue: () => string,
    setValue: (value: string) => void,
    customLabel?: string,
    mode: EnhanceMode = 'detailed'
  ) => {
    if (!selected || enhancingField) return;

    setEnhancingField(fieldKey);
    try {
      const currentValue = getCurrentValue();

      const enhanced = await aiEnhanceCharacterField(
        fieldKey,
        currentValue,
        selected,
        appData,
        appData.selectedModel || 'grok-3',
        customLabel,
        mode
      );

      setValue(enhanced);
    } catch (error) {
      console.error('Enhancement failed:', error);
    } finally {
      setEnhancingField(null);
    }
  };

  const handleEnhanceModeSelect = (mode: EnhanceMode) => {
    if (!enhanceModeTarget) return;
    const { fieldKey, section, getCurrentValue, setValue, customLabel } = enhanceModeTarget;
    setEnhanceModeTarget(null);
    handleEnhanceField(fieldKey, section, getCurrentValue, setValue, customLabel, mode);
  };

  const handleUpdateSection = (charId: string, sectionId: string, patch: Partial<CharacterTraitSection>) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    const nextSections = char.sections.map(s => s.id === sectionId ? { ...s, ...patch, updatedAt: now() } : s);
    onUpdate(charId, { sections: nextSections });
  };

  const handleAddItem = (charId: string, sectionId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    const nextSections = char.sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: [...s.items, { id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }],
        updatedAt: now()
      };
    });
    onUpdate(charId, { sections: nextSections });
  };

  const handleAiPortrait = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarGenerated = async (imageUrl: string) => {
    if (selected) {
      let finalUrl = imageUrl;
      try {
        finalUrl = await compressAndUpload(imageUrl, 'avatars', user?.id || 'anon', 512, 512, 0.85);
      } catch { /* use original */ }
      onUpdate(selected.id, {
        avatarDataUrl: finalUrl,
        avatarPosition: { x: 50, y: 50 }
      });

    }
    setShowAvatarModal(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning || !selected) return;
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      pos: selected.avatarPosition || { x: 50, y: 50 }
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart || !selected || !avatarContainerRef.current) return;

    const rect = avatarContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    onUpdate(selected.id, {
      avatarPosition: {
        x: clamp(dragStart.pos.x - deltaX, 0, 100),
        y: clamp(dragStart.pos.y - deltaY, 0, 100)
      }
    });
  }, [dragStart, selected, onUpdate]);

  const handleMouseUp = () => {
    setDragStart(null);
  };

  // Touch event handlers for iPad/touch device repositioning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRepositioning || !selected) return;
    e.preventDefault();
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      pos: selected.avatarPosition || { x: 50, y: 50 }
    });
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStart || !selected || !avatarContainerRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = avatarContainerRef.current.getBoundingClientRect();
    const deltaX = ((touch.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((touch.clientY - dragStart.y) / rect.height) * 100;
    onUpdate(selected.id, {
      avatarPosition: {
        x: clamp(dragStart.pos.x - deltaX, 0, 100),
        y: clamp(dragStart.pos.y - deltaY, 0, 100)
      }
    });
  }, [dragStart, selected, onUpdate]);

  const handleTouchEnd = () => {
    setDragStart(null);
  };

  // Handlers for updating hardcoded sections
  const handlePhysicalAppearanceChange = (field: keyof PhysicalAppearance, value: string) => {
    if (!selected) return;
    onUpdate(selected.id, {
      physicalAppearance: {
        ...selected.physicalAppearance,
        [field]: value
      }
    });
  };

  const handleCurrentlyWearingChange = (field: keyof CurrentlyWearing, value: string) => {
    if (!selected) return;
    onUpdate(selected.id, {
      currentlyWearing: {
        ...selected.currentlyWearing,
        [field]: value
      }
    });
  };

  const handlePreferredClothingChange = (field: keyof PreferredClothing, value: string) => {
    if (!selected) return;
    onUpdate(selected.id, {
      preferredClothing: {
        ...selected.preferredClothing,
        [field]: value
      }
    });
  };

  // Extras handlers for hardcoded sections (extended for new sections)
  type ExtrasSection = 'physicalAppearance' | 'currentlyWearing' | 'preferredClothing' | 'background' | 'tone' | 'keyLifeEvents' | 'relationships' | 'secrets' | 'fears';

  const handleAddExtra = (section: ExtrasSection) => {
    if (!selected) return;
    const current = (selected as any)[section] as any || {};
    const extras = [...(current._extras || []), { id: uid('extra'), label: '', value: '' }];
    onUpdate(selected.id, { [section]: { ...current, _extras: extras } } as any);
  };

  const handleUpdateExtra = (section: ExtrasSection, extraId: string, patch: Partial<CharacterExtraRow>) => {
    if (!selected) return;
    const current = (selected as any)[section] as any || {};
    const extras = (current._extras || []).map((e: CharacterExtraRow) => e.id === extraId ? { ...e, ...patch } : e);
    onUpdate(selected.id, { [section]: { ...current, _extras: extras } } as any);
  };

  const handleDeleteExtra = (section: ExtrasSection, extraId: string) => {
    if (!selected) return;
    const current = (selected as any)[section] as any || {};
    const extras = (current._extras || []).filter((e: CharacterExtraRow) => e.id !== extraId);
    onUpdate(selected.id, { [section]: { ...current, _extras: extras } } as any);
  };

  // Handler for Background hardcoded fields
  const handleBackgroundChange = (field: keyof CharacterBackground, value: string) => {
    if (!selected) return;
    onUpdate(selected.id, {
      background: {
        ...(selected.background || defaultCharacterBackground),
        [field]: value
      }
    });
  };

  // Condensed view helpers for collapsed sections
  const CollapsedFieldRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{label}</span>
        <p className="text-sm text-zinc-400">{value}</p>
      </div>
    );
  };

  // Helper to build enhance args for ExtraRow fields with generate-both support
  const buildExtraEnhanceArgs = (
    sectionPrefix: string,
    fieldKeyPrefix: string,
    extra: CharacterExtraRow,
    sectionKey: ExtrasSection,
    sectionLabel: string
  ) => {
    if (extra.label) {
      return {
        customLabel: extra.label,
        setValue: (v: string) => handleUpdateExtra(sectionKey, extra.id, { value: v })
      };
    }
    return {
      customLabel: `${GENERATE_BOTH_PREFIX}${sectionLabel}`,
      setValue: (v: string) => {
        const parsed = parseGenerateBothResponse(v);
        if (parsed) handleUpdateExtra(sectionKey, extra.id, { label: parsed.label, value: parsed.value });
        else handleUpdateExtra(sectionKey, extra.id, { value: v });
      }
    };
  };

  const CollapsedPhysicalAppearance = () => {
    const data = selected?.physicalAppearance;
    const extras = data?._extras?.filter(e => e.label || e.value) || [];
    const hasAnyValue = data && (Object.entries(data).some(([k, v]) => k !== '_extras' && v) || extras.length > 0);
    if (!hasAnyValue) return <p className="text-zinc-500 text-sm italic">No appearance details</p>;
    return (
      <div className="space-y-4">
        <CollapsedFieldRow label="Hair" value={data?.hairColor || ''} />
        <CollapsedFieldRow label="Eyes" value={data?.eyeColor || ''} />
        <CollapsedFieldRow label="Build" value={data?.build || ''} />
        <CollapsedFieldRow label="Height" value={data?.height || ''} />
        <CollapsedFieldRow label="Skin Tone" value={data?.skinTone || ''} />
        <CollapsedFieldRow label="Body Hair" value={data?.bodyHair || ''} />
        <CollapsedFieldRow label="Breasts" value={data?.breastSize || ''} />
        <CollapsedFieldRow label="Genitalia" value={data?.genitalia || ''} />
        <CollapsedFieldRow label="Makeup" value={data?.makeup || ''} />
        <CollapsedFieldRow label="Markings" value={data?.bodyMarkings || ''} />
        <CollapsedFieldRow label="Conditions" value={data?.temporaryConditions || ''} />
        {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
      </div>
    );
  };

  const CollapsedCurrentlyWearing = () => {
    const data = selected?.currentlyWearing;
    const extras = data?._extras?.filter(e => e.label || e.value) || [];
    const hasAnyValue = data && (Object.entries(data).some(([k, v]) => k !== '_extras' && v) || extras.length > 0);
    if (!hasAnyValue) return <p className="text-zinc-500 text-sm italic">No clothing details</p>;
    return (
      <div className="space-y-4">
        <CollapsedFieldRow label="Top" value={data?.top || ''} />
        <CollapsedFieldRow label="Bottom" value={data?.bottom || ''} />
        <CollapsedFieldRow label="Undergarments" value={data?.undergarments || ''} />
        <CollapsedFieldRow label="Other" value={data?.miscellaneous || ''} />
        {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
      </div>
    );
  };

  const CollapsedPreferredClothing = () => {
    const data = selected?.preferredClothing;
    const extras = data?._extras?.filter(e => e.label || e.value) || [];
    const hasAnyValue = data && (Object.entries(data).some(([k, v]) => k !== '_extras' && v) || extras.length > 0);
    if (!hasAnyValue) return <p className="text-zinc-500 text-sm italic">No preferences set</p>;
    return (
      <div className="space-y-4">
        <CollapsedFieldRow label="Casual" value={data?.casual || ''} />
        <CollapsedFieldRow label="Work" value={data?.work || ''} />
        <CollapsedFieldRow label="Sleep" value={data?.sleep || ''} />
        <CollapsedFieldRow label="Undergarments" value={data?.undergarments || ''} />
        <CollapsedFieldRow label="Other" value={data?.miscellaneous || ''} />
        {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
      </div>
    );
  };

  // State for content type picker modal
  const [showCategoryTypeModal, setShowCategoryTypeModal] = useState(false);

  // Handle adding a new custom section
  const handleAddSection = (type: CharacterTraitSectionType = 'structured') => {
    if (!selected) return;
    // If external handler is provided, use it (for scenario builder)
    if (externalAddSection) {
      const prevCount = selected.sections.length;
      externalAddSection(type);
      // Auto-navigate will be handled by the useEffect below
      return;
    }
    // Otherwise use internal logic (for chat interface)
    const newSection: CharacterTraitSection = {
      id: uid('sec'),
      title: 'New Section',
      type,
      items: [{ id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }],
      freeformValue: undefined,
      createdAt: now(),
      updatedAt: now()
    };
    setExpandedCustomSections(prev => ({ ...prev, [newSection.id]: true }));
    onUpdate(selected.id, { sections: [...selected.sections, newSection] });
  };

  if (!selectedId || !selected) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
          {characters.map(c => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              aria-label={`Open character ${c.name || 'Unnamed'}`}
              className="group relative cursor-pointer transition-all duration-300 group-hover:-translate-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14151a]"
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(c.id);
                }
              }}
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 !shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] transition-shadow duration-300 group-hover:shadow-2xl border border-[#4a5f7f] relative">

                {c.avatarDataUrl ? (
                  <img
                    src={c.avatarDataUrl}
                    alt={c.name}
                    style={{ 
                      objectPosition: `${c.avatarPosition?.x ?? 50}% ${c.avatarPosition?.y ?? 50}%` 
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 p-10 text-center">
                     <div className="font-black text-ghost-white text-6xl uppercase tracking-tighter italic break-words">{c.name.charAt(0) || '?'}</div>
                  </div>
                )}

                {/* Always-visible bottom gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-[1]" />

                <div className="absolute inset-x-0 bottom-0 p-6 z-[2]">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {c.tags && c.tags.split(',').slice(0, 2).map(tag => (
                      <span key={tag} className="bg-blue-500 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg truncate max-w-[100px]">
                        {tag.trim()}
                      </span>
                    ))}
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg ${c.characterRole === 'Main' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white/80'}`}>
                      {c.characterRole}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight mb-1 tracking-tight group-hover:text-blue-300 transition-colors truncate">{c.name || "Unnamed"}</h3>
                  <p className="text-xs text-white line-clamp-3 leading-relaxed italic">
                     {c.roleDescription || c.sections[0]?.items[0]?.value || "No description available."}
                  </p>
                </div>

                <button 
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  className="absolute top-4 right-4 p-3 bg-black/40 text-white hover:text-rose-400 hover:bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="group aspect-[2/3] w-full overflow-hidden rounded-[2rem] border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 transition-all duration-300 hover:border-blue-500 flex flex-col items-center justify-center gap-4 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center group-hover:bg-blue-900/30 transition-colors">
                <Plus className="w-8 h-8 text-zinc-500 group-hover:text-blue-500" />
              </div>
              <span className="text-sm font-black text-zinc-500 group-hover:text-blue-500 uppercase tracking-widest">
                New Character
              </span>
            </button>
          )}
          {characters.length === 0 && !onAddNew && (
            <div className="col-span-full py-20 text-center text-slate-400 select-none">
              <div className="text-6xl mb-4 font-thin opacity-30">✦</div>
              <p className="font-bold text-lg text-slate-500">Character Creation</p>
              <p className="text-sm">Select or import a character from Library or Create New</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const avatarPos = selected.avatarPosition || { x: 50, y: 50 };

  // Layout guardrail:
  // Keep lg:flex-row and explicit h-full/min-h-0 to preserve split-pane behavior
  // and avoid scroll breakage at intermediate desktop widths.
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col lg:flex-row overflow-hidden">
      {/* Height-chain guardrail for full-height nav at lg+ */}
      <aside
        className="w-full lg:w-[320px] lg:max-w-[320px] flex-shrink-0 bg-[#2a2a2f] flex flex-col h-auto lg:h-full max-h-[52vh] lg:max-h-none rounded-none shadow-[0_12px_32px_-2px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]"
      >
        <div className="p-3">
          <div className={cn(
            "group relative overflow-hidden rounded-2xl bg-black border border-[#4a5f7f]",
          )} style={{ height: CHARACTER_HEADER_TILE_HEIGHT }}>
            {selected.avatarDataUrl ? (
              <img
                src={selected.avatarDataUrl}
                alt={selected.name || 'Character'}
                className="block w-full h-full object-cover"
                style={{ objectPosition: `${headerTileObjectPosition.x}% ${headerTileObjectPosition.y}%` }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 font-black text-5xl italic uppercase text-slate-500">
                {selected.name.charAt(0) || '?'}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 z-[5] pointer-events-none" />
            {/* Bottom info */}
            <div className="absolute inset-x-0 bottom-0 z-30 p-3">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                    {selected.name || 'Unnamed Character'}
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wide shrink-0 rounded-full px-2 py-0.5",
                  selected.controlledBy === 'User' ? "bg-blue-500 text-white" : "bg-slate-500 text-white"
                )}>
                  {selected.controlledBy || 'AI'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto scrollbar-none bg-[#2a2a2f]"
          style={{ padding: `${CHARACTER_NAV_OUTER_PADDING}px` }}
        >
          <div
            className="rounded-2xl space-y-2 bg-[#2e2e33] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]"
            style={{ padding: `${CHARACTER_NAV_TRAY_PADDING}px` }}
          >
              {sidebarTraitNavItems.map((item) => {
                const active = isCharacterSectionKeyMatch(item.key, activeTraitSection);
                const Icon = TRAIT_NAV_ICON_BY_KEY[item.key] || Sparkles;
                const backgroundImage = getNavImageForSection(item.key);

                return (
                  <TraitNavButton
                    key={item.key}
                    label={item.label}
                    progress={sectionProgressByKey[item.key] || emptySectionProgress}
                    active={active}
                    icon={Icon}
                    backgroundImage={backgroundImage}
                    onClick={() => setActiveTraitSection(item.key)}
                  />
                );
              })}

              <button
                type="button"
                onClick={() => setShowCategoryTypeModal(true)}
                className={navActionButtonClass}
              >
                <span className="relative z-10 min-w-0 flex items-center gap-[10px]">
                  <Plus className="w-[18px] h-[18px] shrink-0 text-[#60a5fa]" />
                  <span className="truncate text-[12px] font-black tracking-[0.08em] leading-tight text-[#eaedf1]">
                    Custom Content
                  </span>
                </span>
                <span className="relative z-10 w-8 h-8 shrink-0" aria-hidden />
              </button>

              {user && isAdmin && (
                <button
                  type="button"
                  onClick={openNavImageEditor}
                  className={navActionButtonClass}
                >
                  <span className="relative z-10 min-w-0 flex items-center gap-[10px]">
                    <PenSquare className="w-[18px] h-[18px] shrink-0 text-[#60a5fa]" />
                    <span className="truncate text-[12px] font-black tracking-[0.08em] leading-tight text-[#eaedf1]">
                      Edit Buttons (Admin)
                    </span>
                  </span>
                  <span className="relative z-10 w-8 h-8 shrink-0" aria-hidden />
                </button>
              )}
          </div>
        </div>
      </aside>

      <TabFieldNavigator className="flex-1 min-h-0 min-w-0 overflow-y-auto scrollbar-thin bg-[#1a1b20]">
        <div className="p-4 lg:p-10 max-w-6xl mx-auto space-y-6 pb-20">
          {isTraitVisible('basics') && (
            <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
              <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }} />
                <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Basics</h2>
                <button
                  onClick={() => toggleSection('avatar')}
                  className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-ghost-white relative z-[1]"
                >
                  {expandedSections.avatar ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </button>
              </div>
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                  {expandedSections.avatar ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {/* Left column: Avatar + buttons */}
                        <div className="flex flex-col gap-3">
                          <div
                            ref={avatarContainerRef}
                            className={`relative group w-full aspect-square rounded-2xl shadow-lg select-none ${isRepositioning ? 'ring-4 ring-blue-500 cursor-move overflow-hidden' : selected.avatarDataUrl ? 'border-2 border-[#4a5f7f] overflow-hidden' : ''}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={isRepositioning ? { touchAction: 'none' } : undefined}
                          >
                            {selected.avatarDataUrl ? (
                              <img
                                src={selected.avatarDataUrl}
                                style={{
                                  objectPosition: `${avatarPos.x}% ${avatarPos.y}%`,
                                  pointerEvents: 'none'
                                }}
                                className={`w-full h-full object-cover transition-opacity ${isGeneratingImg ? 'opacity-50' : ''}`}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center border-2 border-dashed border-[#4a5f7f] gap-3 rounded-2xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No Avatar</span>
                              </div>
                            )}

                            {isGeneratingImg && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                            {/* Three-dot menu — top-right of avatar */}
                            {selected.avatarDataUrl && !isRepositioning && (
                              <div className="absolute top-2 right-2 z-30">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 rounded-lg transition-colors bg-black/30 hover:bg-black/50 text-white/70 hover:text-white">
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="shadow-lg z-50 bg-zinc-800 border-ghost-white text-zinc-200">
                                    <DropdownMenuItem onClick={() => setIsRepositioning(true)} className="hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white">
                                      <Move className="w-4 h-4 mr-2" />
                                      Reposition image
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                            {/* Reposition overlay with Done button */}
                            {isRepositioning && (
                              <div className="absolute inset-0 z-[18] touch-none cursor-move pointer-events-auto">
                                <button
                                  type="button"
                                  className="absolute left-2 top-2 rounded-md bg-black/55 border border-white/20 px-2 py-1 text-[9px] font-bold text-white hover:bg-black/70 pointer-events-auto z-20"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsRepositioning(false);
                                  }}
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>

                          <AvatarActionButtons
                            onUploadFromDevice={() => fileInputRef.current?.click()}
                            onSelectFromLibrary={(imageUrl) => {
                              if (selected) {
                                onUpdate(selected.id, {
                                  avatarDataUrl: imageUrl,
                                  avatarPosition: { x: 50, y: 50 }
                                });
                              }
                            }}
                            onGenerateClick={handleAiPortrait}
                            disabled={isUploading}
                            isGenerating={isGeneratingImg}
                            isUploading={isUploading}
                          />

                          <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f || !selected || !user) {
                                if (!user) console.error('Please sign in to upload avatars');
                                return;
                              }

                              setIsUploading(true);
                              try {
                                const reader = new FileReader();
                                reader.onload = async () => {
                                  try {
                                    const optimized = await resizeImage(reader.result as string, 512, 512, 0.7);
                                    const blob = dataUrlToBlob(optimized);
                                    if (!blob) throw new Error('Failed to process image');

                                    const filename = `avatar-${selected.id}-${Date.now()}.jpg`;
                                    const publicUrl = await uploadAvatar(user.id, blob, filename);

                                    onUpdate(selected.id, {
                                      avatarDataUrl: publicUrl,
                                      avatarPosition: { x: 50, y: 50 }
                                    });
                                    setIsRepositioning(true);
                                  } catch (error) {
                                    console.error('Avatar upload failed:', error);
                                  } finally {
                                    setIsUploading(false);
                                  }
                                };
                                reader.readAsDataURL(f);
                              } catch (error) {
                                console.error('Avatar upload failed:', error);
                                setIsUploading(false);
                              }
                            }}
                          />
                        </div>

                        {/* Right column: Name, Nickname, Age, Sex */}
                        <div className="flex flex-col gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Name</label>
                            <AutoResizeTextareaField value={selected.name === "New Character" ? "" : selected.name} onChange={(v) => onUpdate(selected.id, { name: v })} placeholder="Character name" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Nicknames</label>
                            <AutoResizeTextareaField value={selected.nicknames || ''} onChange={(v) => onUpdate(selected.id, { nicknames: v })} placeholder="Nicknames" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Age</label>
                              <AutoResizeTextareaField value={selected.age || ''} onChange={(v) => onUpdate(selected.id, { age: v })} placeholder="25" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sex / Identity</label>
                              <AutoResizeTextareaField value={selected.sexType} onChange={(v) => onUpdate(selected.id, { sexType: v })} placeholder="Female, Male, Non-binary" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sexual Orientation</label>
                            <AutoResizeTextareaField value={selected.sexualOrientation || ''} onChange={(v) => onUpdate(selected.id, { sexualOrientation: v })} placeholder="Heterosexual, Bisexual, etc." className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Controlled By</label>
                              <div className="flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                                <button
                                  onClick={() => onUpdate(selected.id, { controlledBy: 'AI' })}
                                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${selected.controlledBy === 'AI' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}
                                >
                                  AI
                                </button>
                                <button
                                  onClick={() => onUpdate(selected.id, { controlledBy: 'User' })}
                                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${selected.controlledBy === 'User' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}
                                >
                                  User
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Character Role</label>
                              <div className="flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                                <button
                                  onClick={() => onUpdate(selected.id, { characterRole: 'Main' })}
                                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${selected.characterRole === 'Main' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}
                                >
                                  Main
                                </button>
                                <button
                                  onClick={() => onUpdate(selected.id, { characterRole: 'Side' })}
                                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${selected.characterRole === 'Side' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}
                                >
                                  Side
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Below grid: remaining fields */}
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Location</label>
                          <AutoResizeTextareaField value={selected.location || ''} onChange={(v) => onUpdate(selected.id, { location: v })} placeholder="Current location" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Current Mood</label>
                          <AutoResizeTextareaField value={selected.currentMood || ''} onChange={(v) => onUpdate(selected.id, { currentMood: v })} placeholder="Happy, Tired" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Role Description</label>
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => openEnhanceModeModal(
                                'roleDescription',
                                'custom',
                                () => selected.roleDescription || '',
                                (v) => onUpdate(selected.id, { roleDescription: v }),
                                'Role Description'
                              )}
                              disabled={enhancingField !== null}
                              title="Enhance with AI"
                              className={cn(
                                "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden text-cyan-200 transition-all",
                                enhancingField === 'roleDescription' ? "animate-pulse cursor-wait" : "hover:brightness-125"
                              )}
                              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
                            >
                              <span aria-hidden className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)' }} />
                              <span aria-hidden className="absolute rounded-[6px] pointer-events-none" style={{ inset: '1.5px', background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33' }} />
                              <Sparkles size={13} className="relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }} />
                            </button>
                          </div>
                          <AutoResizeTextareaField value={selected.roleDescription || ''} onChange={(v) => onUpdate(selected.id, { roleDescription: v })} placeholder="Brief description of the character's role" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#4a5f7f]">
                        {selected.avatarDataUrl ? (
                          <img
                            src={selected.avatarDataUrl}
                            style={{ objectPosition: `${avatarPos.x}% ${avatarPos.y}%` }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-xl text-zinc-500">
                            {selected.name.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-bold text-white">{selected.name || 'Unnamed'}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
                          {selected.age && <span>{selected.age} years</span>}
                          {selected.sexType && <span>{selected.sexType}</span>}
                          {selected.location && <span className="text-zinc-400">{selected.location}</span>}
                        </div>
                        {selected.currentMood && (
                          <p className="text-xs text-zinc-400 italic">Mood: {selected.currentMood}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HARDCODED SECTION 1: Physical Appearance */}
          {isTraitVisible('physicalAppearance') && (
          <HardcodedSection 
            title="Physical Appearance"
            isExpanded={expandedSections.physicalAppearance}
            onToggle={() => toggleSection('physicalAppearance')}
            collapsedContent={<CollapsedPhysicalAppearance />}
          >
            <HardcodedRow label="Hair Color" value={selected.physicalAppearance?.hairColor || ''} onChange={(v) => handlePhysicalAppearanceChange('hairColor', v)} placeholder="Brunette, Blonde, Black" onEnhance={() => openEnhanceModeModal('hairColor', 'physicalAppearance', () => selected.physicalAppearance?.hairColor || '', (v) => handlePhysicalAppearanceChange('hairColor', v))} isEnhancing={enhancingField === 'hairColor'} />
            <HardcodedRow label="Eye Color" value={selected.physicalAppearance?.eyeColor || ''} onChange={(v) => handlePhysicalAppearanceChange('eyeColor', v)} placeholder="Blue, Brown, Green" onEnhance={() => openEnhanceModeModal('eyeColor', 'physicalAppearance', () => selected.physicalAppearance?.eyeColor || '', (v) => handlePhysicalAppearanceChange('eyeColor', v))} isEnhancing={enhancingField === 'eyeColor'} />
            <HardcodedRow label="Build" value={selected.physicalAppearance?.build || ''} onChange={(v) => handlePhysicalAppearanceChange('build', v)} placeholder="Athletic, Slim, Curvy" onEnhance={() => openEnhanceModeModal('build', 'physicalAppearance', () => selected.physicalAppearance?.build || '', (v) => handlePhysicalAppearanceChange('build', v))} isEnhancing={enhancingField === 'build'} />
            <HardcodedRow label="Body Hair" value={selected.physicalAppearance?.bodyHair || ''} onChange={(v) => handlePhysicalAppearanceChange('bodyHair', v)} placeholder="Smooth, Light, Natural" onEnhance={() => openEnhanceModeModal('bodyHair', 'physicalAppearance', () => selected.physicalAppearance?.bodyHair || '', (v) => handlePhysicalAppearanceChange('bodyHair', v))} isEnhancing={enhancingField === 'bodyHair'} />
            <HardcodedRow label="Height" value={selected.physicalAppearance?.height || ''} onChange={(v) => handlePhysicalAppearanceChange('height', v)} placeholder="5 foot 8" onEnhance={() => openEnhanceModeModal('height', 'physicalAppearance', () => selected.physicalAppearance?.height || '', (v) => handlePhysicalAppearanceChange('height', v))} isEnhancing={enhancingField === 'height'} />
            <HardcodedRow label="Breasts" value={selected.physicalAppearance?.breastSize || ''} onChange={(v) => handlePhysicalAppearanceChange('breastSize', v)} placeholder="Size, description" onEnhance={() => openEnhanceModeModal('breastSize', 'physicalAppearance', () => selected.physicalAppearance?.breastSize || '', (v) => handlePhysicalAppearanceChange('breastSize', v))} isEnhancing={enhancingField === 'breastSize'} />
            <HardcodedRow label="Genitalia" value={selected.physicalAppearance?.genitalia || ''} onChange={(v) => handlePhysicalAppearanceChange('genitalia', v)} placeholder="Size, description" onEnhance={() => openEnhanceModeModal('genitalia', 'physicalAppearance', () => selected.physicalAppearance?.genitalia || '', (v) => handlePhysicalAppearanceChange('genitalia', v))} isEnhancing={enhancingField === 'genitalia'} />
            <HardcodedRow label="Skin Tone" value={selected.physicalAppearance?.skinTone || ''} onChange={(v) => handlePhysicalAppearanceChange('skinTone', v)} placeholder="Fair, Olive, Dark" onEnhance={() => openEnhanceModeModal('skinTone', 'physicalAppearance', () => selected.physicalAppearance?.skinTone || '', (v) => handlePhysicalAppearanceChange('skinTone', v))} isEnhancing={enhancingField === 'skinTone'} />
            <HardcodedRow label="Makeup" value={selected.physicalAppearance?.makeup || ''} onChange={(v) => handlePhysicalAppearanceChange('makeup', v)} placeholder="Light, Heavy, None" onEnhance={() => openEnhanceModeModal('makeup', 'physicalAppearance', () => selected.physicalAppearance?.makeup || '', (v) => handlePhysicalAppearanceChange('makeup', v))} isEnhancing={enhancingField === 'makeup'} />
            <HardcodedRow label="Body Markings" value={selected.physicalAppearance?.bodyMarkings || ''} onChange={(v) => handlePhysicalAppearanceChange('bodyMarkings', v)} placeholder="Scars, tattoos, birthmarks, piercings" onEnhance={() => openEnhanceModeModal('bodyMarkings', 'physicalAppearance', () => selected.physicalAppearance?.bodyMarkings || '', (v) => handlePhysicalAppearanceChange('bodyMarkings', v))} isEnhancing={enhancingField === 'bodyMarkings'} />
            <HardcodedRow label="Temporary Conditions" value={selected.physicalAppearance?.temporaryConditions || ''} onChange={(v) => handlePhysicalAppearanceChange('temporaryConditions', v)} placeholder="Injuries, illness, etc." onEnhance={() => openEnhanceModeModal('temporaryConditions', 'physicalAppearance', () => selected.physicalAppearance?.temporaryConditions || '', (v) => handlePhysicalAppearanceChange('temporaryConditions', v))} isEnhancing={enhancingField === 'temporaryConditions'} />
            {/* User-added extras */}
            {(selected.physicalAppearance?._extras || []).map(extra => {
              const args = buildExtraEnhanceArgs('extra_pa', `extra_pa_${extra.id}`, extra, 'physicalAppearance', 'physical appearance detail');
              return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('physicalAppearance', extra.id, patch)} onDelete={() => handleDeleteExtra('physicalAppearance', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_pa_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_pa_${extra.id}`} />;
            })}
            <button type="button" onClick={() => handleAddExtra('physicalAppearance')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 2: Currently Wearing */}
          {isTraitVisible('currentlyWearing') && (
          <HardcodedSection 
            title="Currently Wearing"
            isExpanded={expandedSections.currentlyWearing}
            onToggle={() => toggleSection('currentlyWearing')}
            collapsedContent={<CollapsedCurrentlyWearing />}
          >
            <HardcodedRow label="Shirt/Top" value={selected.currentlyWearing?.top || ''} onChange={(v) => handleCurrentlyWearingChange('top', v)} placeholder="White blouse, T-shirt" onEnhance={() => openEnhanceModeModal('top', 'currentlyWearing', () => selected.currentlyWearing?.top || '', (v) => handleCurrentlyWearingChange('top', v))} isEnhancing={enhancingField === 'top'} />
            <HardcodedRow label="Pants/Bottoms" value={selected.currentlyWearing?.bottom || ''} onChange={(v) => handleCurrentlyWearingChange('bottom', v)} placeholder="Jeans, Skirt, Shorts" onEnhance={() => openEnhanceModeModal('bottom', 'currentlyWearing', () => selected.currentlyWearing?.bottom || '', (v) => handleCurrentlyWearingChange('bottom', v))} isEnhancing={enhancingField === 'bottom'} />
            <HardcodedRow label="Undergarments" value={selected.currentlyWearing?.undergarments || ''} onChange={(v) => handleCurrentlyWearingChange('undergarments', v)} placeholder="Bras, panties, boxers, etc." onEnhance={() => openEnhanceModeModal('undergarments', 'currentlyWearing', () => selected.currentlyWearing?.undergarments || '', (v) => handleCurrentlyWearingChange('undergarments', v))} isEnhancing={enhancingField === 'undergarments'} />
            <HardcodedRow label="Miscellaneous" value={selected.currentlyWearing?.miscellaneous || ''} onChange={(v) => handleCurrentlyWearingChange('miscellaneous', v)} placeholder="Outerwear, footwear, accessories" onEnhance={() => openEnhanceModeModal('cw_miscellaneous', 'currentlyWearing', () => selected.currentlyWearing?.miscellaneous || '', (v) => handleCurrentlyWearingChange('miscellaneous', v))} isEnhancing={enhancingField === 'cw_miscellaneous'} />
            {/* User-added extras */}
            {(selected.currentlyWearing?._extras || []).map(extra => {
              const args = buildExtraEnhanceArgs('extra_cw', `extra_cw_${extra.id}`, extra, 'currentlyWearing', 'currently wearing detail');
              return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('currentlyWearing', extra.id, patch)} onDelete={() => handleDeleteExtra('currentlyWearing', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_cw_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_cw_${extra.id}`} />;
            })}
            <button type="button" onClick={() => handleAddExtra('currentlyWearing')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 3: Preferred Clothing */}
          {isTraitVisible('preferredClothing') && (
          <HardcodedSection 
            title="Preferred Clothing"
            isExpanded={expandedSections.preferredClothing}
            onToggle={() => toggleSection('preferredClothing')}
            collapsedContent={<CollapsedPreferredClothing />}
          >
            <HardcodedRow label="Casual" value={selected.preferredClothing?.casual || ''} onChange={(v) => handlePreferredClothingChange('casual', v)} placeholder="Jeans and t-shirts" onEnhance={() => openEnhanceModeModal('casual', 'preferredClothing', () => selected.preferredClothing?.casual || '', (v) => handlePreferredClothingChange('casual', v))} isEnhancing={enhancingField === 'casual'} />
            <HardcodedRow label="Work" value={selected.preferredClothing?.work || ''} onChange={(v) => handlePreferredClothingChange('work', v)} placeholder="Business casual, Uniform" onEnhance={() => openEnhanceModeModal('work', 'preferredClothing', () => selected.preferredClothing?.work || '', (v) => handlePreferredClothingChange('work', v))} isEnhancing={enhancingField === 'work'} />
            <HardcodedRow label="Sleep" value={selected.preferredClothing?.sleep || ''} onChange={(v) => handlePreferredClothingChange('sleep', v)} placeholder="Pajamas, Nightgown" onEnhance={() => openEnhanceModeModal('sleep', 'preferredClothing', () => selected.preferredClothing?.sleep || '', (v) => handlePreferredClothingChange('sleep', v))} isEnhancing={enhancingField === 'sleep'} />
            <HardcodedRow label="Undergarments" value={selected.preferredClothing?.undergarments || ''} onChange={(v) => handlePreferredClothingChange('undergarments', v)} placeholder="Cotton basics, Lace" onEnhance={() => openEnhanceModeModal('pc_undergarments', 'preferredClothing', () => selected.preferredClothing?.undergarments || '', (v) => handlePreferredClothingChange('undergarments', v))} isEnhancing={enhancingField === 'pc_undergarments'} />
            <HardcodedRow label="Miscellaneous" value={selected.preferredClothing?.miscellaneous || ''} onChange={(v) => handlePreferredClothingChange('miscellaneous', v)} placeholder="Formal, athletic, swimwear, etc." onEnhance={() => openEnhanceModeModal('pc_miscellaneous', 'preferredClothing', () => selected.preferredClothing?.miscellaneous || '', (v) => handlePreferredClothingChange('miscellaneous', v))} isEnhancing={enhancingField === 'pc_miscellaneous'} />
            {/* User-added extras */}
            {(selected.preferredClothing?._extras || []).map(extra => {
              const args = buildExtraEnhanceArgs('extra_pc', `extra_pc_${extra.id}`, extra, 'preferredClothing', 'preferred clothing detail');
              return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('preferredClothing', extra.id, patch)} onDelete={() => handleDeleteExtra('preferredClothing', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_pc_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_pc_${extra.id}`} />;
            })}
            <button type="button" onClick={() => handleAddExtra('preferredClothing')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 4: Personality */}
          {isTraitVisible('personality') && (
          <PersonalitySection
            personality={selected.personality || defaultPersonality}
            onChange={(personality) => onUpdate(selected.id, { personality })}
            isExpanded={expandedSections.personality}
            onToggle={() => toggleSection('personality')}
            onEnhanceField={(fieldKey, getCurrentValue, setValue, customLabel) => openEnhanceModeModal(fieldKey, 'custom', getCurrentValue, setValue, customLabel)}
            enhancingField={enhancingField}
          />
          )}

          {/* HARDCODED SECTION 5: Tone */}
          {isTraitVisible('tone') && (
          <HardcodedSection 
            title="Tone"
            isExpanded={expandedSections.tone}
            onToggle={() => toggleSection('tone')}
            collapsedContent={
              (() => {
                const extras = selected.tone?._extras?.filter(e => e.label || e.value) || [];
                if (extras.length === 0) return <p className="text-zinc-500 text-sm italic">No tone details</p>;
                return (
                  <div className="space-y-4">
                    {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
                  </div>
                );
              })()
            }
          >
            {(() => {
              const extras = selected.tone?._extras || [];
              if (extras.length === 0) {
                handleAddExtra('tone');
                return null;
              }
              return extras.map(extra => {
                const args = buildExtraEnhanceArgs('extra_tone', `extra_tone_${extra.id}`, extra, 'tone', 'character tone/voice detail');
                return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('tone', extra.id, patch)} onDelete={() => handleDeleteExtra('tone', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_tone_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_tone_${extra.id}`} />;
              });
            })()}
            <button type="button" onClick={() => handleAddExtra('tone')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 6: Background */}
          {isTraitVisible('background') && (
          <HardcodedSection 
            title="Background"
            isExpanded={expandedSections.background}
            onToggle={() => toggleSection('background')}
            collapsedContent={
              (() => {
                const bg = selected.background;
                const extras = bg?._extras?.filter(e => e.label || e.value) || [];
                const hasAnyValue = bg && (Object.entries(bg).some(([k, v]) => k !== '_extras' && v) || extras.length > 0);
                if (!hasAnyValue) return <p className="text-zinc-500 text-sm italic">No background details</p>;
                return (
                  <div className="space-y-4">
                    <CollapsedFieldRow label="Job / Occupation" value={bg?.jobOccupation || ''} />
                    <CollapsedFieldRow label="Education Level" value={bg?.educationLevel || ''} />
                    <CollapsedFieldRow label="Residence" value={bg?.residence || ''} />
                    <CollapsedFieldRow label="Hobbies" value={bg?.hobbies || ''} />
                    <CollapsedFieldRow label="Financial Status" value={bg?.financialStatus || ''} />
                    <CollapsedFieldRow label="Motivation" value={bg?.motivation || ''} />
                    {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
                  </div>
                );
              })()
            }
          >
            <HardcodedRow label="Job / Occupation" value={selected.background?.jobOccupation || ''} onChange={(v) => handleBackgroundChange('jobOccupation', v)} placeholder="Software Engineer, Teacher" onEnhance={() => openEnhanceModeModal('bg_jobOccupation', 'custom', () => selected.background?.jobOccupation || '', (v) => handleBackgroundChange('jobOccupation', v), 'Job / Occupation')} isEnhancing={enhancingField === 'bg_jobOccupation'} />
            <HardcodedRow label="Education Level" value={selected.background?.educationLevel || ''} onChange={(v) => handleBackgroundChange('educationLevel', v)} placeholder="Bachelor's, High School" onEnhance={() => openEnhanceModeModal('bg_educationLevel', 'custom', () => selected.background?.educationLevel || '', (v) => handleBackgroundChange('educationLevel', v), 'Education Level')} isEnhancing={enhancingField === 'bg_educationLevel'} />
            <HardcodedRow label="Residence" value={selected.background?.residence || ''} onChange={(v) => handleBackgroundChange('residence', v)} placeholder="Downtown apartment, Suburban house" onEnhance={() => openEnhanceModeModal('bg_residence', 'custom', () => selected.background?.residence || '', (v) => handleBackgroundChange('residence', v), 'Residence')} isEnhancing={enhancingField === 'bg_residence'} />
            <HardcodedRow label="Hobbies" value={selected.background?.hobbies || ''} onChange={(v) => handleBackgroundChange('hobbies', v)} placeholder="Reading, Hiking, Gaming" onEnhance={() => openEnhanceModeModal('bg_hobbies', 'custom', () => selected.background?.hobbies || '', (v) => handleBackgroundChange('hobbies', v), 'Hobbies')} isEnhancing={enhancingField === 'bg_hobbies'} />
            <HardcodedRow label="Financial Status" value={selected.background?.financialStatus || ''} onChange={(v) => handleBackgroundChange('financialStatus', v)} placeholder="Middle class, Wealthy" onEnhance={() => openEnhanceModeModal('bg_financialStatus', 'custom', () => selected.background?.financialStatus || '', (v) => handleBackgroundChange('financialStatus', v), 'Financial Status')} isEnhancing={enhancingField === 'bg_financialStatus'} />
            <HardcodedRow label="Motivation" value={selected.background?.motivation || ''} onChange={(v) => handleBackgroundChange('motivation', v)} placeholder="What drives this character" onEnhance={() => openEnhanceModeModal('bg_motivation', 'custom', () => selected.background?.motivation || '', (v) => handleBackgroundChange('motivation', v), 'Motivation')} isEnhancing={enhancingField === 'bg_motivation'} />
            {(selected.background?._extras || []).map(extra => {
              const args = buildExtraEnhanceArgs('extra_bg', `extra_bg_${extra.id}`, extra, 'background', 'background detail');
              return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('background', extra.id, patch)} onDelete={() => handleDeleteExtra('background', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_bg_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_bg_${extra.id}`} />;
            })}
            <button type="button" onClick={() => handleAddExtra('background')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 7: Key Life Events */}
          {isTraitVisible('keyLifeEvents') && (
          <HardcodedSection 
            title="Key Life Events"
            isExpanded={expandedSections.keyLifeEvents}
            onToggle={() => toggleSection('keyLifeEvents')}
            collapsedContent={
              (() => {
                const extras = selected.keyLifeEvents?._extras?.filter(e => e.label || e.value) || [];
                if (extras.length === 0) return <p className="text-zinc-500 text-sm italic">No events recorded</p>;
                return (
                  <div className="space-y-4">
                    {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
                  </div>
                );
              })()
            }
          >
            {(() => {
              const extras = selected.keyLifeEvents?._extras || [];
              if (extras.length === 0) {
                handleAddExtra('keyLifeEvents');
                return null;
              }
              return extras.map(extra => {
                const args = buildExtraEnhanceArgs('extra_kle', `extra_kle_${extra.id}`, extra, 'keyLifeEvents', 'key life event');
                return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('keyLifeEvents', extra.id, patch)} onDelete={() => handleDeleteExtra('keyLifeEvents', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_kle_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_kle_${extra.id}`} />;
              });
            })()}
            <button type="button" onClick={() => handleAddExtra('keyLifeEvents')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 8: Relationships */}
          {isTraitVisible('relationships') && (
          <HardcodedSection 
            title="Relationships"
            isExpanded={expandedSections.relationships}
            onToggle={() => toggleSection('relationships')}
            collapsedContent={
              (() => {
                const extras = selected.relationships?._extras?.filter(e => e.label || e.value) || [];
                if (extras.length === 0) return <p className="text-zinc-500 text-sm italic">No relationships defined</p>;
                return (
                  <div className="space-y-4">
                    {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
                  </div>
                );
              })()
            }
          >
            {(() => {
              const extras = selected.relationships?._extras || [];
              if (extras.length === 0) {
                handleAddExtra('relationships');
                return null;
              }
              return extras.map(extra => {
                const args = buildExtraEnhanceArgs('extra_rel', `extra_rel_${extra.id}`, extra, 'relationships', 'relationship');
                return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('relationships', extra.id, patch)} onDelete={() => handleDeleteExtra('relationships', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_rel_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_rel_${extra.id}`} />;
              });
            })()}
            <button type="button" onClick={() => handleAddExtra('relationships')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 9: Secrets */}
          {isTraitVisible('secrets') && (
          <HardcodedSection 
            title="Secrets"
            isExpanded={expandedSections.secrets}
            onToggle={() => toggleSection('secrets')}
            collapsedContent={
              (() => {
                const extras = selected.secrets?._extras?.filter(e => e.label || e.value) || [];
                if (extras.length === 0) return <p className="text-zinc-500 text-sm italic">No secrets defined</p>;
                return (
                  <div className="space-y-4">
                    {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
                  </div>
                );
              })()
            }
          >
            {(() => {
              const extras = selected.secrets?._extras || [];
              if (extras.length === 0) {
                handleAddExtra('secrets');
                return null;
              }
              return extras.map(extra => {
                const args = buildExtraEnhanceArgs('extra_sec', `extra_sec_${extra.id}`, extra, 'secrets', 'secret');
                return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('secrets', extra.id, patch)} onDelete={() => handleDeleteExtra('secrets', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_sec_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_sec_${extra.id}`} />;
              });
            })()}
            <button type="button" onClick={() => handleAddExtra('secrets')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 10: Fears */}
          {isTraitVisible('fears') && (
          <HardcodedSection 
            title="Fears"
            isExpanded={expandedSections.fears}
            onToggle={() => toggleSection('fears')}
            collapsedContent={
              (() => {
                const extras = selected.fears?._extras?.filter(e => e.label || e.value) || [];
                if (extras.length === 0) return <p className="text-zinc-500 text-sm italic">No fears defined</p>;
                return (
                  <div className="space-y-4">
                    {extras.map(e => <CollapsedFieldRow key={e.id} label={e.label || 'Untitled'} value={e.value} />)}
                  </div>
                );
              })()
            }
          >
            {(() => {
              const extras = selected.fears?._extras || [];
              if (extras.length === 0) {
                handleAddExtra('fears');
                return null;
              }
              return extras.map(extra => {
                const args = buildExtraEnhanceArgs('extra_fear', `extra_fear_${extra.id}`, extra, 'fears', 'fear');
                return <ExtraRow key={extra.id} extra={extra} onUpdate={(patch) => handleUpdateExtra('fears', extra.id, patch)} onDelete={() => handleDeleteExtra('fears', extra.id)} onEnhance={() => openEnhanceModeModal(`extra_fear_${extra.id}`, 'custom', () => extra.value, args.setValue, args.customLabel)} isEnhancing={enhancingField === `extra_fear_${extra.id}`} />;
              });
            })()}
            <button type="button" onClick={() => handleAddExtra('fears')} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Row
            </button>
          </HardcodedSection>
          )}

          {/* HARDCODED SECTION 11: Character Goals */}
          {isTraitVisible('characterGoals') && (
          <CharacterGoalsSection
            goals={selected.goals || []}
            onChange={(goals) => onUpdate(selected.id, { goals })}
            isExpanded={expandedSections.characterGoals}
            onToggle={() => toggleSection('characterGoals')}
            onEnhanceField={(fieldKey, getCurrentValue, setValue, customLabel) => openEnhanceModeModal(fieldKey, 'custom', getCurrentValue, setValue, customLabel)}
            enhancingField={enhancingField}
          />
          )}


          {/* USER-CREATED CUSTOM SECTIONS */}
          {selected.sections
            .filter(section => isTraitVisible(`custom:${section.id}`))
            .map(section => (
            <div key={section.id} className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              {/* Dark blue header with editable title */}
              <div className="bg-[#4a5f7f] border-b border-[#4a5f7f] px-5 py-3 flex items-center justify-between shadow-lg">
                <AutoResizeTextareaField
                  value={section.title}
                  onChange={(v) => handleUpdateSection(selected.id, section.id, { title: v })}
                  placeholder="Section Title"
                  className="bg-transparent border-none text-white text-xl font-bold tracking-tight placeholder:text-[rgba(248,250,252,0.3)] focus:outline-none flex-1 mr-2"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={() => toggleCustomSection(section.id)} 
                    className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-ghost-white"
                  >
                    {(expandedCustomSections[section.id] ?? true) ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </button>
                  <button 
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const next = selected.sections.filter(s => s.id !== section.id);
                      onUpdate(selected.id, { sections: next });
                    }}
                    className="text-white hover:text-red-400 p-1 rounded-md hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="p-5">
                <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
                  {(expandedCustomSections[section.id] ?? true) ? (
                    <div className="space-y-4">
                    {section.type === 'freeform' ? (
                      /* Freeform: labeled text areas */
                      <>
                      {(() => {
                        const items = section.items.length > 0
                          ? section.items
                          : section.freeformValue
                            ? [{ id: uid('item'), label: '', value: section.freeformValue, createdAt: now(), updatedAt: now() }]
                            : [{ id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }];
                        // Auto-migrate freeformValue to items if needed
                        if (section.items.length === 0 && items.length > 0) {
                          handleUpdateSection(selected.id, section.id, { items, freeformValue: undefined });
                        }
                        return items.map(item => (
                          <div key={item.id} className="flex items-start gap-2">
                            <AutoResizeTextareaField
                              value={item.value}
                              onChange={(v) => {
                                const nextItems = (section.items.length > 0 ? section.items : items).map(it => it.id === item.id ? { ...it, value: v } : it);
                                handleUpdateSection(selected.id, section.id, { items: nextItems });
                              }}
                              placeholder="Write your content here..."
                              className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              rows={4}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => {
                                const nextItems = (section.items.length > 0 ? section.items : items).filter(it => it.id !== item.id);
                                handleUpdateSection(selected.id, section.id, { items: nextItems.length > 0 ? nextItems : [{ id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }] });
                              }}
                              className="mt-2 text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30 shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ));
                      })()}
                      <button
                        type="button"
                        onClick={() => {
                          const currentItems = section.items.length > 0 ? section.items : [{ id: uid('item'), label: '', value: section.freeformValue || '', createdAt: now(), updatedAt: now() }];
                          handleUpdateSection(selected.id, section.id, { items: [...currentItems, { id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }], freeformValue: undefined });
                        }}
                        className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add Text Field
                      </button>
                      </>
                    ) : (
                      /* Structured: label + description rows */
                      <>
                      {section.items.map(item => (
                        <div key={item.id}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 flex gap-2">
                              <div className="w-1/3 flex items-center gap-1.5">
                                <AutoResizeTextareaField
                                  value={item.label}
                                  onChange={(v) => {
                                    const nextItems = section.items.map(it => it.id === item.id ? { ...it, label: v } : it);
                                    handleUpdateSection(selected.id, section.id, { items: nextItems });
                                  }}
                                   placeholder="LABEL"
                                   className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => {
                                      const customLabel = item.label
                                        ? item.label
                                        : `${GENERATE_BOTH_PREFIX}custom field for ${section.title}`;
                                      const setValue = item.label
                                        ? (v: string) => {
                                            const nextItems = section.items.map(it => it.id === item.id ? { ...it, value: v } : it);
                                            handleUpdateSection(selected.id, section.id, { items: nextItems });
                                          }
                                        : (v: string) => {
                                            const parsed = parseGenerateBothResponse(v);
                                            if (parsed) {
                                              const nextItems = section.items.map(it => it.id === item.id ? { ...it, label: parsed.label, value: parsed.value } : it);
                                              handleUpdateSection(selected.id, section.id, { items: nextItems });
                                            } else {
                                              const nextItems = section.items.map(it => it.id === item.id ? { ...it, value: v } : it);
                                              handleUpdateSection(selected.id, section.id, { items: nextItems });
                                            }
                                          };
                                      openEnhanceModeModal(
                                        `custom-${section.id}-${item.id}`,
                                        'custom',
                                        () => item.value,
                                        setValue,
                                        customLabel
                                      );
                                    }}
                                    disabled={enhancingField === `custom-${section.id}-${item.id}`}
                                    title="Enhance with AI"
                                    className={cn(
                                      "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden text-cyan-200 transition-all",
                                      enhancingField === `custom-${section.id}-${item.id}` ? "animate-pulse cursor-wait" : "hover:brightness-125"
                                    )}
                                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
                                  >
                                    <span aria-hidden className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)' }} />
                                    <span aria-hidden className="absolute rounded-[6px] pointer-events-none" style={{ inset: '1.5px', background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33' }} />
                                    <Sparkles size={13} className="relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }} />
                                  </button>
                              </div>
                              <AutoResizeTextareaField
                                value={item.value}
                                onChange={(v) => {
                                  const nextItems = section.items.map(it => it.id === item.id ? { ...it, value: v } : it);
                                  handleUpdateSection(selected.id, section.id, { items: nextItems });
                                }}
                                placeholder="Description"
                                className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => {
                                const nextItems = section.items.filter(it => it.id !== item.id);
                                handleUpdateSection(selected.id, section.id, { items: nextItems });
                              }}
                              className="text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30 mt-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddItem(selected.id, section.id)}
                        className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add Row
                      </button>
                      </>
                    )}
                    </div>
                  ) : (
                    // Collapsed view - show summary
                    (() => {
                      if (section.type === 'freeform') {
                        const items = section.items.length > 0 ? section.items : (section.freeformValue ? [{ id: 'legacy', label: '', value: section.freeformValue }] : []);
                        return items.length > 0 && items.some(it => it.value)
                          ? <div className="space-y-2">{items.filter(it => it.value).map(it => (
                              <div key={it.id}>
                                {it.label && <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{it.label}</span>}
                                <p className="text-sm text-zinc-400 whitespace-pre-wrap">{it.value}</p>
                              </div>
                            ))}</div>
                          : <p className="text-zinc-500 text-sm italic">No content</p>;
                      }
                      const hasAnyValue = section.items.some(item => item.label || item.value);
                      if (!hasAnyValue) {
                        return <p className="text-zinc-500 text-sm italic">No items</p>;
                      }
                      return (
                        <div className="space-y-4">
                          {section.items.filter(item => item.label || item.value).map((item) => (
                            <div key={item.id} className="space-y-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                                {item.label || 'Untitled'}
                              </span>
                              <p className="text-sm text-zinc-400">{item.value || '—'}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          ))}

          <CustomContentTypeModal
            open={showCategoryTypeModal}
            onClose={() => setShowCategoryTypeModal(false)}
            onSelect={(type) => handleAddSection(type as CharacterTraitSectionType)}
          />
        </div>
      </TabFieldNavigator>

      {/* Avatar Generation Modal */}
      <AvatarGenerationModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onGenerated={handleAvatarGenerated}
        characterName={selected?.name || "Character"}
        characterData={{
          physicalAppearance: selected?.physicalAppearance,
          currentlyWearing: selected?.currentlyWearing,
          sexType: selected?.sexType,
          age: selected?.age
        }}
        modelId={appData.selectedModel || "grok-3"} /* GROK ONLY */
      />

      <Dialog
        open={showNavImageEditor}
        onOpenChange={(open) => {
          setShowNavImageEditor(open);
          if (!open) {
            setIsDraggingNavImage(false);
            navDragStartRef.current = null;
          }
        }}
      >
        <DialogContent className="max-w-[460px] overflow-hidden border-0 p-0 bg-[#2a2a2f] shadow-[0_24px_60px_rgba(0,0,0,0.70),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
          <DialogHeader className="relative overflow-hidden bg-[linear-gradient(180deg,#5a7292_0%,#4a5f7f_100%)] px-[18px] py-[14px] shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,transparent_30%)]" />
            <DialogTitle className="relative z-10 text-[14px] font-black tracking-[0.08em] uppercase text-white">
              Edit Button Image
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-3">
            <div className="bg-[#2e2e33] rounded-[14px] p-[14px] space-y-3 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30)]">
              <select
                value={editingNavKey}
                onChange={(event) => loadNavImageDraft(event.target.value)}
                className="w-full bg-[#1c1c1f] text-[#eaedf1] text-[12px] font-bold px-[10px] py-2 rounded-lg border border-black/35 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]"
              >
                {sidebarTraitNavItems.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>

              <div
                onMouseDown={handleNavImageMouseDown}
                onWheel={handleNavImageWheel}
                className={cn(
                  "relative rounded-[14px] overflow-hidden bg-[#3c3e47] mx-auto",
                  "shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]",
                  draftNavImage ? (isDraggingNavImage ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                )}
                style={{ width: CHARACTER_NAV_PREVIEW_WIDTH, height: CHARACTER_NAV_BUTTON_HEIGHT }}
              >
                {draftNavImage && (
                  <img
                    src={draftNavImage.src}
                    alt=""
                    draggable={false}
                    className="absolute top-0 left-0 pointer-events-none select-none max-w-none"
                    style={{
                      transformOrigin: '0 0',
                      transform: `translate(${draftNavImage.x}px, ${draftNavImage.y}px) scale(${draftNavImage.scale})`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                <div className="absolute inset-0 z-10 flex items-center justify-between px-[14px] pointer-events-none">
                  <span className="text-[11px] font-black tracking-[0.08em] uppercase text-[#eaedf1] truncate">
                    {sidebarTraitNavItems.find((item) => isCharacterSectionKeyMatch(item.key, editingNavKey))?.label || 'Section'}
                  </span>
                  <TraitProgressRing
                    progress={sectionProgressByKey[toCanonicalCharacterSectionKey(editingNavKey)] || emptySectionProgress}
                    active={isCharacterSectionKeyMatch(editingNavKey, activeTraitSection)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#a1a1aa] min-w-[52px]">Scale</label>
                <input
                  type="range"
                  min={20}
                  max={300}
                  value={draftNavImage ? Math.round(draftNavImage.scale * 100) : 100}
                  onChange={(event) => handleNavImageScaleChange(event.target.value)}
                  disabled={!draftNavImage}
                  className="flex-1 h-1 cursor-pointer accent-[#3b82f6] disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-[#eaedf1] font-bold min-w-[40px] text-right">
                  {draftNavImage ? `${Math.round(draftNavImage.scale * 100)}%` : '100%'}
                </span>
              </div>

              <p className="text-[11px] text-[#71717a] text-center">
                Drag the image to reposition. Scroll to zoom or use the slider.
              </p>
            </div>

            <input
              ref={navImageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleNavImageUpload}
            />

            <button
              type="button"
              onClick={() => navImageFileInputRef.current?.click()}
              className="w-full rounded-[10px] bg-[#3c3e47] text-[#eaedf1] text-[12px] font-bold py-[9px] shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-[filter,transform] duration-150 hover:brightness-110 hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99]"
            >
              Upload Image
            </button>

            <DialogFooter className="flex flex-row gap-2 sm:justify-start">
              <button
                type="button"
                onClick={handleSaveNavImage}
                className="flex-1 rounded-[10px] bg-[#3b82f6] text-white text-[12px] font-black tracking-[0.05em] uppercase py-[10px] shadow-[0_4px_12px_rgba(59,130,246,0.35)] transition-[filter,transform] duration-150 hover:brightness-110 hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowNavImageEditor(false)}
                className="flex-1 rounded-[10px] bg-[#3c3e47] text-[#eaedf1] text-[12px] font-black tracking-[0.05em] uppercase py-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.09)] transition-[filter,transform] duration-150 hover:brightness-110 hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveNavImage}
                disabled={!draftNavImage}
                className="rounded-[10px] bg-[hsl(0,72%,51%)] text-white text-[12px] font-black tracking-[0.05em] uppercase px-[14px] py-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-[filter,transform,opacity] duration-150 hover:brightness-110 hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Reset
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhance Mode Selector Modal */}
      <EnhanceModeModal
        open={enhanceModeTarget !== null}
        onClose={() => setEnhanceModeTarget(null)}
        onSelect={handleEnhanceModeSelect}
      />
    </div>
  );
};
