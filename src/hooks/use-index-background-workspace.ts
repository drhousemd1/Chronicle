import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { UserBackground } from "@/types";
import { resizeImage, uuid } from "@/utils";
import * as supabaseData from "@/services/supabase-data";

interface UseIndexBackgroundWorkspaceArgs {
  userId?: string;
}

export function useIndexBackgroundWorkspace({ userId }: UseIndexBackgroundWorkspaceArgs) {
  const [hubBackgrounds, setHubBackgrounds] = useState<UserBackground[]>([]);
  const [selectedHubBackgroundId, setSelectedHubBackgroundId] = useState<string | null>(null);
  const [selectedImageLibraryBackgroundId, setSelectedImageLibraryBackgroundId] = useState<
    string | null
  >(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  const handleUploadBackground = useCallback(
    async (file: File) => {
      if (!userId) return;

      setIsUploadingBackground(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            const optimized = await resizeImage(dataUrl, 1920, 1080, 0.8);
            const blob = supabaseData.dataUrlToBlob(optimized);
            if (!blob) throw new Error("Failed to process image");

            const filename = `bg-${uuid()}-${Date.now()}.jpg`;
            const publicUrl = await supabaseData.uploadBackgroundImage(userId, blob, filename);
            const newBackground = await supabaseData.createUserBackground(userId, publicUrl);

            setHubBackgrounds((previous) => [newBackground, ...previous]);
          } catch (error: any) {
            console.error("Upload failed:", error.message);
          } finally {
            setIsUploadingBackground(false);
          }
        };

        reader.onerror = () => {
          console.error("Failed to read file");
          setIsUploadingBackground(false);
        };

        reader.readAsDataURL(file);
      } catch (error: any) {
        console.error("Upload failed:", error.message);
        setIsUploadingBackground(false);
      }
    },
    [userId],
  );

  const handleSelectBackground = useCallback(
    async (id: string | null) => {
      if (!userId) return;
      try {
        await supabaseData.setSelectedBackground(userId, id);
        setSelectedHubBackgroundId(id);
        setHubBackgrounds((previous) =>
          previous.map((background) => ({
            ...background,
            isSelected: background.id === id,
          })),
        );
      } catch (error: any) {
        console.error("Failed to set background:", error.message);
      }
    },
    [userId],
  );

  const handleDeleteBackground = useCallback(
    async (id: string, imageUrl: string) => {
      if (!userId) return;
      try {
        await supabaseData.deleteUserBackground(userId, id, imageUrl);
        setHubBackgrounds((previous) => previous.filter((background) => background.id !== id));
        if (selectedHubBackgroundId === id) {
          setSelectedHubBackgroundId(null);
        }
      } catch (error: any) {
        console.error("Failed to delete background:", error.message);
      }
    },
    [selectedHubBackgroundId, userId],
  );

  const handleSelectImageLibraryBackground = useCallback(
    async (id: string | null) => {
      if (!userId) return;
      try {
        await supabaseData.setImageLibraryBackground(userId, id);
        setSelectedImageLibraryBackgroundId(id);
      } catch (error: any) {
        console.error("Failed to set background:", error.message);
      }
    },
    [userId],
  );

  const handleOverlayChange = useCallback(
    async (backgroundId: string, color: string, opacity: number) => {
      if (!userId) return;
      setHubBackgrounds((previous) =>
        previous.map((background) =>
          background.id === backgroundId
            ? { ...background, overlayColor: color, overlayOpacity: opacity }
            : background,
        ),
      );
      try {
        await supabaseData.updateBackgroundOverlay(userId, backgroundId, color, opacity);
      } catch (error: any) {
        console.error("Failed to update overlay:", error.message);
      }
    },
    [userId],
  );

  const selectedHubBackground = useMemo(
    () => hubBackgrounds.find((background) => background.id === selectedHubBackgroundId) || null,
    [hubBackgrounds, selectedHubBackgroundId],
  );

  const selectedBackgroundUrl = selectedHubBackground?.imageUrl || null;

  const selectedImageLibraryBackgroundUrl = useMemo(
    () =>
      hubBackgrounds.find((background) => background.id === selectedImageLibraryBackgroundId)
        ?.imageUrl || null,
    [hubBackgrounds, selectedImageLibraryBackgroundId],
  );

  return {
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
  };
}
