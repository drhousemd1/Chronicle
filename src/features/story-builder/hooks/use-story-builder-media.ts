import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type RefObject,
  type TouchEvent,
} from 'react';
import { getClosestRatio } from '@/components/chronicle/AspectRatioUtils';
import { supabase } from '@/integrations/supabase/client';
import { buildRequiredPresence, trackApiValidationSnapshot } from '@/services/api-usage-validation';
import { uploadCoverImage, uploadSceneImage, dataUrlToBlob } from '@/services/supabase-data';
import { trackAiUsageEvent } from '@/services/usage-tracking';
import { clamp, compressAndUpload, now, resizeImage, uuid } from '@/utils';
import type { Scene } from '@/types';

type CoverPosition = { x: number; y: number };
type AspectRatioMeta = { label: string; orientation: 'portrait' | 'landscape' | 'square' };
type StyleLookup = (styleId: string) => { backendPrompt?: string } | undefined;

export interface UseStoryBuilderMediaOptions {
  scenarioId: string;
  userId?: string;
  scenes: Scene[];
  coverImagePosition: CoverPosition;
  scenarioTitle?: string;
  storyPremise?: string;
  getStyleById: StyleLookup;
  onUpdateCoverImage: (url: string) => void;
  onUpdateCoverPosition: (position: CoverPosition) => void;
  onUpdateScenes: (scenes: Scene[]) => void;
}

export interface StoryBuilderMediaController {
  fileInputRef: RefObject<HTMLInputElement | null>;
  coverFileInputRef: RefObject<HTMLInputElement | null>;
  coverContainerRef: RefObject<HTMLDivElement | null>;
  sceneAspectRatios: Record<string, AspectRatioMeta>;
  editingScene: Scene | null;
  showCoverGenModal: boolean;
  showSceneGenModal: boolean;
  isUploading: boolean;
  isUploadingCover: boolean;
  isGeneratingScene: boolean;
  isRepositioningCover: boolean;
  pendingDeleteCover: boolean;
  pendingDeleteSceneId: string | null;
  openCoverGenerator: () => void;
  closeCoverGenerator: () => void;
  openSceneGenerator: () => void;
  closeSceneGenerator: () => void;
  openSceneEditor: (scene: Scene) => void;
  closeSceneEditor: () => void;
  beginCoverRepositioning: () => void;
  finishCoverRepositioning: () => void;
  setPendingDeleteCover: (open: boolean) => void;
  setPendingDeleteSceneId: (sceneId: string | null) => void;
  handleCoverMouseDown: (e: MouseEvent) => void;
  handleCoverMouseMove: (e: MouseEvent) => void;
  handleCoverMouseUp: () => void;
  handleCoverTouchStart: (e: TouchEvent) => void;
  handleCoverTouchMove: (e: TouchEvent) => void;
  handleCoverTouchEnd: () => void;
  handleCoverUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleCoverSelectedFromLibrary: (imageUrl: string) => void;
  handleCoverGenerated: (imageUrl: string) => Promise<void>;
  requestDeleteCover: () => void;
  confirmDeleteCover: () => void;
  handleAddScene: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSceneSelectedFromLibrary: (imageUrl: string) => void;
  handleSceneGenerate: (prompt: string, styleId: string) => Promise<void>;
  handleSaveScene: (id: string, title: string, tags: string[]) => void;
  requestDeleteScene: (id: string) => void;
  confirmDeleteScene: () => void;
  toggleStartingScene: (sceneId: string) => void;
}

export function useStoryBuilderMedia({
  scenarioId,
  userId,
  scenes,
  coverImagePosition,
  scenarioTitle,
  storyPremise,
  getStyleById,
  onUpdateCoverImage,
  onUpdateCoverPosition,
  onUpdateScenes,
}: UseStoryBuilderMediaOptions): StoryBuilderMediaController {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [coverDragStart, setCoverDragStart] = useState<{ x: number; y: number; pos: CoverPosition } | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [showCoverGenModal, setShowCoverGenModal] = useState(false);
  const [showSceneGenModal, setShowSceneGenModal] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [pendingDeleteCover, setPendingDeleteCover] = useState(false);
  const [pendingDeleteSceneId, setPendingDeleteSceneId] = useState<string | null>(null);
  const [sceneAspectRatios, setSceneAspectRatios] = useState<Record<string, AspectRatioMeta>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingScene) return;
    if (!scenes.some((scene) => scene.id === editingScene.id)) {
      setEditingScene(null);
    }
  }, [editingScene, scenes]);

  useEffect(() => {
    if (!scenes.length) {
      setSceneAspectRatios({});
      return;
    }

    const pending = new Map<string, AspectRatioMeta>();
    let cancelled = false;
    let loaded = 0;

    scenes.forEach((scene) => {
      const image = new window.Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (cancelled) return;
        pending.set(scene.id, getClosestRatio(image.naturalWidth, image.naturalHeight));
        loaded += 1;
        if (loaded === scenes.length) {
          setSceneAspectRatios(Object.fromEntries(pending));
        }
      };
      image.onerror = () => {
        loaded += 1;
      };
      image.src = scene.url;
    });

    return () => {
      cancelled = true;
    };
  }, [scenes]);

  const beginCoverRepositioning = useCallback(() => {
    setIsRepositioningCover(true);
  }, []);

  const finishCoverRepositioning = useCallback(() => {
    setCoverDragStart(null);
    setIsRepositioningCover(false);
  }, []);

  const openCoverGenerator = useCallback(() => setShowCoverGenModal(true), []);
  const closeCoverGenerator = useCallback(() => setShowCoverGenModal(false), []);
  const openSceneGenerator = useCallback(() => setShowSceneGenModal(true), []);
  const closeSceneGenerator = useCallback(() => setShowSceneGenModal(false), []);
  const openSceneEditor = useCallback((scene: Scene) => setEditingScene(scene), []);
  const closeSceneEditor = useCallback(() => setEditingScene(null), []);

  const handleCoverMouseDown = useCallback((e: MouseEvent) => {
    if (!isRepositioningCover) return;
    e.preventDefault();
    setCoverDragStart({
      x: e.clientX,
      y: e.clientY,
      pos: coverImagePosition || { x: 50, y: 50 },
    });
  }, [coverImagePosition, isRepositioningCover]);

  const handleCoverMouseMove = useCallback((e: MouseEvent) => {
    if (!coverDragStart || !coverContainerRef.current) return;

    const rect = coverContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - coverDragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - coverDragStart.y) / rect.height) * 100;

    onUpdateCoverPosition({
      x: clamp(coverDragStart.pos.x - deltaX, 0, 100),
      y: clamp(coverDragStart.pos.y - deltaY, 0, 100),
    });
  }, [coverDragStart, onUpdateCoverPosition]);

  const handleCoverMouseUp = useCallback(() => {
    setCoverDragStart(null);
  }, []);

  const handleCoverTouchStart = useCallback((e: TouchEvent) => {
    if (!isRepositioningCover) return;
    e.preventDefault();
    const touch = e.touches[0];
    setCoverDragStart({
      x: touch.clientX,
      y: touch.clientY,
      pos: coverImagePosition || { x: 50, y: 50 },
    });
  }, [coverImagePosition, isRepositioningCover]);

  const handleCoverTouchMove = useCallback((e: TouchEvent) => {
    if (!coverDragStart || !coverContainerRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = coverContainerRef.current.getBoundingClientRect();
    const deltaX = ((touch.clientX - coverDragStart.x) / rect.width) * 100;
    const deltaY = ((touch.clientY - coverDragStart.y) / rect.height) * 100;

    onUpdateCoverPosition({
      x: clamp(coverDragStart.pos.x - deltaX, 0, 100),
      y: clamp(coverDragStart.pos.y - deltaY, 0, 100),
    });
  }, [coverDragStart, onUpdateCoverPosition]);

  const handleCoverTouchEnd = useCallback(() => {
    setCoverDragStart(null);
  }, []);

  const handleCoverSelectedFromLibrary = useCallback((imageUrl: string) => {
    onUpdateCoverImage(imageUrl);
    onUpdateCoverPosition({ x: 50, y: 50 });
    setIsRepositioningCover(true);
  }, [onUpdateCoverImage, onUpdateCoverPosition]);

  const handleCoverGenerated = useCallback(async (imageUrl: string) => {
    try {
      const compressedUrl = await compressAndUpload(imageUrl, 'covers', userId || 'anon', 1024, 1536, 0.85);
      onUpdateCoverImage(compressedUrl);
    } catch {
      onUpdateCoverImage(imageUrl);
    }

    onUpdateCoverPosition({ x: 50, y: 50 });
    setIsRepositioningCover(true);
    setShowCoverGenModal(false);
  }, [onUpdateCoverImage, onUpdateCoverPosition, userId]);

  const handleCoverUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

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
          const publicUrl = await uploadCoverImage(userId, blob, filename);

          onUpdateCoverImage(publicUrl);
          onUpdateCoverPosition({ x: 50, y: 50 });
          setIsRepositioningCover(true);
        } catch (error) {
          console.error('Cover upload failed:', error);
        } finally {
          setIsUploadingCover(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Cover upload failed:', error);
      setIsUploadingCover(false);
    }

    e.target.value = '';
  }, [onUpdateCoverImage, onUpdateCoverPosition, userId]);

  const requestDeleteCover = useCallback(() => {
    setIsRepositioningCover(false);
    setCoverDragStart(null);
    setPendingDeleteCover(true);
  }, []);

  const confirmDeleteCover = useCallback(() => {
    onUpdateCoverImage('');
    onUpdateCoverPosition({ x: 50, y: 50 });
    setIsRepositioningCover(false);
    setCoverDragStart(null);
    setPendingDeleteCover(false);
  }, [onUpdateCoverImage, onUpdateCoverPosition]);

  const handleSceneSelectedFromLibrary = useCallback((imageUrl: string) => {
    const newScene: Scene = {
      id: uuid(),
      url: imageUrl,
      tags: [],
      createdAt: now(),
    };
    onUpdateScenes([newScene, ...scenes]);
    setEditingScene(newScene);
  }, [onUpdateScenes, scenes]);

  const handleAddScene = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) {
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
          const blob = dataUrlToBlob(optimized);
          if (!blob) throw new Error('Failed to process image');

          const filename = `scene-${uuid()}-${Date.now()}.jpg`;
          const publicUrl = await uploadSceneImage(userId, blob, filename);

          const newScene: Scene = {
            id: uuid(),
            url: publicUrl,
            tags: [],
            createdAt: now(),
          };
          onUpdateScenes([newScene, ...scenes]);
          setEditingScene(newScene);
        } catch (error) {
          console.error('Scene upload failed:', error);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Scene upload failed:', error);
      setIsUploading(false);
    }

    e.target.value = '';
  }, [onUpdateScenes, scenes, userId]);

  const handleSceneGenerate = useCallback(async (prompt: string, styleId: string) => {
    if (!userId) {
      console.error('Please sign in to generate scenes');
      return;
    }

    setIsGeneratingScene(true);
    try {
      const style = getStyleById(styleId);
      const artStylePrompt = style?.backendPrompt || '';

      void trackApiValidationSnapshot({
        eventKey: 'validation.single.scene_image',
        eventSource: 'story-builder.scene-modal',
        apiCallGroup: 'single_call',
        parentRowId: 'summary.single.scene_image',
        detailPresence: buildRequiredPresence([
          ['single.scene_image.prompt_or_messages', prompt],
          ['single.scene_image.characters_or_context', artStylePrompt || storyPremise || scenarioTitle],
        ]),
        diagnostics: { scenarioId },
      });

      const { data, error } = await supabase.functions.invoke('generate-cover-image', {
        body: {
          prompt: `Scene: ${prompt}. Landscape composition, 4:3 aspect ratio, widescreen environment background.`,
          artStylePrompt,
          scenarioTitle,
        },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image URL returned');

      void trackAiUsageEvent({
        eventType: 'scene_image_generated',
        eventSource: 'story-builder-scene-modal',
        metadata: { scenarioId },
      });

      let finalUrl = data.imageUrl;
      try {
        finalUrl = await compressAndUpload(data.imageUrl, 'scenes', userId, 1024, 768, 0.85);
      } catch {
        // Use original URL if compression fails.
      }

      const newScene: Scene = {
        id: uuid(),
        url: finalUrl,
        tags: [],
        createdAt: now(),
      };
      onUpdateScenes([newScene, ...scenes]);
      setEditingScene(newScene);
      setShowSceneGenModal(false);
    } catch (error) {
      console.error('Scene generation failed:', error);
    } finally {
      setIsGeneratingScene(false);
    }
  }, [getStyleById, onUpdateScenes, scenarioId, scenarioTitle, scenes, storyPremise, userId]);

  const handleSaveScene = useCallback((id: string, title: string, tags: string[]) => {
    const updatedScenes = scenes.map((scene) => (scene.id === id ? { ...scene, title, tags } : scene));
    onUpdateScenes(updatedScenes);
  }, [onUpdateScenes, scenes]);

  const requestDeleteScene = useCallback((id: string) => {
    setPendingDeleteSceneId(id);
  }, []);

  const confirmDeleteScene = useCallback(() => {
    if (!pendingDeleteSceneId) return;
    onUpdateScenes(scenes.filter((scene) => scene.id !== pendingDeleteSceneId));
    setPendingDeleteSceneId(null);
  }, [onUpdateScenes, pendingDeleteSceneId, scenes]);

  const toggleStartingScene = useCallback((sceneId: string) => {
    const updatedScenes = scenes.map((scene) => ({
      ...scene,
      isStartingScene: scene.id === sceneId ? !scene.isStartingScene : false,
    }));
    onUpdateScenes(updatedScenes);
  }, [onUpdateScenes, scenes]);

  return {
    fileInputRef,
    coverFileInputRef,
    coverContainerRef,
    sceneAspectRatios,
    editingScene,
    showCoverGenModal,
    showSceneGenModal,
    isUploading,
    isUploadingCover,
    isGeneratingScene,
    isRepositioningCover,
    pendingDeleteCover,
    pendingDeleteSceneId,
    openCoverGenerator,
    closeCoverGenerator,
    openSceneGenerator,
    closeSceneGenerator,
    openSceneEditor,
    closeSceneEditor,
    beginCoverRepositioning,
    finishCoverRepositioning,
    setPendingDeleteCover,
    setPendingDeleteSceneId,
    handleCoverMouseDown,
    handleCoverMouseMove,
    handleCoverMouseUp,
    handleCoverTouchStart,
    handleCoverTouchMove,
    handleCoverTouchEnd,
    handleCoverUpload,
    handleCoverSelectedFromLibrary,
    handleCoverGenerated,
    requestDeleteCover,
    confirmDeleteCover,
    handleAddScene,
    handleSceneSelectedFromLibrary,
    handleSceneGenerate,
    handleSaveScene,
    requestDeleteScene,
    confirmDeleteScene,
    toggleStartingScene,
  };
}
