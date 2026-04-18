import { useCallback, useState } from "react";
import { StoryImportMode } from "@/lib/story-transfer";

export type IndexAiPromptModalState = { mode: "fill" | "generate" } | null;
export type IndexDeleteConfirmType = "character" | "bookmark" | "scenario";
export type IndexConversationDeleteTarget = {
  scenarioId: string;
  conversationId: string;
} | null;
export type IndexStoryTransferNoticeState = {
  tone: "success" | "error" | "info";
  text: string;
} | null;

export function useIndexDialogState() {
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);
  const [aiPromptModal, setAiPromptModal] = useState<IndexAiPromptModalState>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] =
    useState<IndexDeleteConfirmType>("character");
  const [convDeleteTarget, setConvDeleteTarget] =
    useState<IndexConversationDeleteTarget>(null);
  const [convDeleteAllOpen, setConvDeleteAllOpen] = useState(false);
  const [remixConfirmId, setRemixConfirmId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [storyExportModalOpen, setStoryExportModalOpen] = useState(false);
  const [storyImportModalOpen, setStoryImportModalOpen] = useState(false);
  const [storyImportMode, setStoryImportMode] = useState<StoryImportMode>("merge");
  const [storyTransferNotice, setStoryTransferNotice] =
    useState<IndexStoryTransferNoticeState>(null);
  const [storyTransferWarningDetails, setStoryTransferWarningDetails] = useState<string[]>([]);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isImageLibraryBackgroundModalOpen, setIsImageLibraryBackgroundModalOpen] =
    useState(false);

  const dismissStoryTransferNotice = useCallback(() => {
    setStoryTransferNotice(null);
    setStoryTransferWarningDetails([]);
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen((prev) => !prev);
  }, []);

  const closeUserMenu = useCallback(() => {
    setUserMenuOpen(false);
  }, []);

  const openCharacterPicker = useCallback(() => {
    setIsCharacterPickerOpen(true);
  }, []);

  const closeCharacterPicker = useCallback(() => {
    setIsCharacterPickerOpen(false);
  }, []);

  const openAiPromptModal = useCallback((mode: "fill" | "generate") => {
    setAiPromptModal({ mode });
  }, []);

  const closeAiPromptModal = useCallback(() => {
    setAiPromptModal(null);
  }, []);

  const openBackgroundModal = useCallback(() => {
    setIsBackgroundModalOpen(true);
  }, []);

  const closeBackgroundModal = useCallback(() => {
    setIsBackgroundModalOpen(false);
  }, []);

  const openImageLibraryBackgroundModal = useCallback(() => {
    setIsImageLibraryBackgroundModalOpen(true);
  }, []);

  const closeImageLibraryBackgroundModal = useCallback(() => {
    setIsImageLibraryBackgroundModalOpen(false);
  }, []);

  const openStoryExportModal = useCallback(() => {
    setStoryExportModalOpen(true);
  }, []);

  const closeStoryExportModal = useCallback(() => {
    setStoryExportModalOpen(false);
  }, []);

  const openStoryImportModal = useCallback(() => {
    setStoryImportModalOpen(true);
  }, []);

  const closeStoryImportModal = useCallback(() => {
    setStoryImportModalOpen(false);
  }, []);

  const openConversationDeleteTarget = useCallback(
    (scenarioId: string, conversationId: string) => {
      setConvDeleteTarget({ scenarioId, conversationId });
    },
    [],
  );

  const closeConversationDeleteTarget = useCallback(() => {
    setConvDeleteTarget(null);
  }, []);

  const handleConversationDeleteTargetOpenChange = useCallback((open: boolean) => {
    if (!open) setConvDeleteTarget(null);
  }, []);

  const openConversationDeleteAll = useCallback(() => {
    setConvDeleteAllOpen(true);
  }, []);

  const handleConversationDeleteAllOpenChange = useCallback((open: boolean) => {
    setConvDeleteAllOpen(open);
  }, []);

  const closeConversationDeleteAll = useCallback(() => {
    setConvDeleteAllOpen(false);
  }, []);

  const openDeleteConfirm = useCallback(
    (id: string, type: IndexDeleteConfirmType) => {
      setDeleteConfirmId(id);
      setDeleteConfirmType(type);
    },
    [],
  );

  const clearDeleteConfirm = useCallback(() => {
    setDeleteConfirmId(null);
    setDeleteConfirmType("character");
  }, []);

  const handleDeleteConfirmOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteConfirmId(null);
      setDeleteConfirmType("character");
    }
  }, []);

  const openRemixConfirm = useCallback((scenarioId: string) => {
    setRemixConfirmId(scenarioId);
  }, []);

  const closeRemixConfirm = useCallback(() => {
    setRemixConfirmId(null);
  }, []);

  const handleRemixConfirmOpenChange = useCallback((open: boolean) => {
    if (!open) setRemixConfirmId(null);
  }, []);

  return {
    isCharacterPickerOpen,
    aiPromptModal,
    userMenuOpen,
    deleteConfirmId,
    deleteConfirmType,
    convDeleteTarget,
    convDeleteAllOpen,
    remixConfirmId,
    authModalOpen,
    storyExportModalOpen,
    storyImportModalOpen,
    storyImportMode,
    storyTransferNotice,
    storyTransferWarningDetails,
    isBackgroundModalOpen,
    isImageLibraryBackgroundModalOpen,
    setStoryImportMode,
    setStoryTransferNotice,
    setStoryTransferWarningDetails,
    dismissStoryTransferNotice,
    openAuthModal,
    closeAuthModal,
    toggleUserMenu,
    closeUserMenu,
    openCharacterPicker,
    closeCharacterPicker,
    openAiPromptModal,
    closeAiPromptModal,
    openBackgroundModal,
    closeBackgroundModal,
    openImageLibraryBackgroundModal,
    closeImageLibraryBackgroundModal,
    openStoryExportModal,
    closeStoryExportModal,
    openStoryImportModal,
    closeStoryImportModal,
    openConversationDeleteTarget,
    closeConversationDeleteTarget,
    handleConversationDeleteTargetOpenChange,
    openConversationDeleteAll,
    handleConversationDeleteAllOpenChange,
    closeConversationDeleteAll,
    openDeleteConfirm,
    clearDeleteConfirm,
    handleDeleteConfirmOpenChange,
    openRemixConfirm,
    closeRemixConfirm,
    handleRemixConfirmOpenChange,
  };
}
