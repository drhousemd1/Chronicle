import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  FileImage,
  LockKeyhole,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { uuid } from "@/utils";

import { RND_PROTOTYPE_DEFINITIONS, getRndPrototypeDefinition } from "./rnd-registry";
import {
  loadRndRepositoryWorkspace,
  mergeRndWorkspaces,
  saveRndMockupToRepository,
} from "./rnd-repository-client";
import {
  createBlankRndMockup,
  describeRndStorageError,
  loadRndWorkspace,
  prepareReferenceAssets,
  saveRndMockup,
} from "./rnd-storage";
import { RndPrototypeShell } from "./RndPrototypeShell";
import {
  RND_SCHEMA_VERSION,
  type PreviewBackground,
  type RndDocumentBlock,
  type RndMockupRecord,
  type RndReferenceAsset,
} from "./rnd-types";

const LAST_SELECTED_KEY = "chronicle-rnd-last-selected-v1";
const INTERNAL_BLOCK_DRAG_TYPE = "application/x-chronicle-rnd-block-id";
const AUTOSAVE_DELAY_MS = 500;

type SaveState = "idle" | "saving" | "saved" | "error";
type RepositorySaveState = "idle" | "saving" | "saved" | "error";

function projectDocumentBlocks(documentBlocks: readonly RndDocumentBlock[]) {
  return {
    notes: documentBlocks
      .filter((block): block is Extract<RndDocumentBlock, { type: "text" }> => block.type === "text")
      .map((block) => block.text)
      .join("\n"),
    assetIds: documentBlocks
      .filter((block): block is Extract<RndDocumentBlock, { type: "image" }> => block.type === "image")
      .map((block) => block.assetId),
  };
}

function ensureEditableDocument(documentBlocks: RndDocumentBlock[]): RndDocumentBlock[] {
  if (documentBlocks.length === 0) return [{ id: uuid(), type: "text", text: "" }];
  if (documentBlocks[documentBlocks.length - 1].type === "image") {
    return [...documentBlocks, { id: uuid(), type: "text", text: "" }];
  }
  return documentBlocks;
}

interface DocumentTextBlockProps {
  block: Extract<RndDocumentBlock, { type: "text" }>;
  disabled: boolean;
  showPlaceholder: boolean;
  onChange: (text: string) => void;
  onSplit: (selectionStart: number, selectionEnd: number) => void;
}

function DocumentTextBlock({
  block,
  disabled,
  showPlaceholder,
  onChange,
  onSplit,
}: DocumentTextBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 32)}px`;
  }, []);

  useEffect(resize, [block.text, resize]);

  return (
    <textarea
      ref={textareaRef}
      data-rnd-document-block-id={block.id}
      data-rnd-text-block-id={block.id}
      aria-label="Document text"
      value={block.text}
      onChange={(event) => {
        onChange(event.target.value);
        resize();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        event.preventDefault();
        onSplit(event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
      }}
      disabled={disabled}
      rows={1}
      spellCheck
      placeholder={showPlaceholder ? "Start typing…" : undefined}
      className="block min-h-8 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[16px] leading-8 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-0 disabled:opacity-60"
    />
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function createRecordForDefinition(
  definition: (typeof RND_PROTOTYPE_DEFINITIONS)[number],
): RndMockupRecord {
  return {
    schemaVersion: RND_SCHEMA_VERSION,
    id: definition.id,
    displayTitle: definition.defaultTitle,
    purpose: definition.defaultPurpose,
    notes: "",
    createdAt: definition.createdAt,
    contentUpdatedAt: definition.createdAt,
    previewBackground: "charcoal",
    assetIds: [],
    documentBlocks: [{ id: uuid(), type: "text", text: "" }],
  };
}

interface AssetPreview {
  asset: RndReferenceAsset;
  url: string;
}

interface ResearchDevelopmentToolProps {
  onOpenStyleGuide: () => void;
  onRegisterBeforeLeave?: (handler: (() => Promise<boolean>) | null) => void;
  onRegisterAddMockup?: (handler: (() => Promise<void>) | null) => void;
  onRegisterRepositorySave?: (handler: (() => Promise<void>) | null) => void;
  onRepositorySaveStateChange?: (state: RepositorySaveState) => void;
}

export function ResearchDevelopmentTool({
  onOpenStyleGuide,
  onRegisterBeforeLeave,
  onRegisterAddMockup,
  onRegisterRepositorySave,
  onRepositorySaveStateChange,
}: ResearchDevelopmentToolProps) {
  const [mockups, setMockups] = useState<RndMockupRecord[]>([]);
  const [assets, setAssets] = useState<RndReferenceAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RndMockupRecord | null>(null);
  const [pendingAssets, setPendingAssets] = useState<RndReferenceAsset[]>([]);
  const [removedAssetIds, setRemovedAssetIds] = useState<string[]>([]);
  const [assetPreviews, setAssetPreviews] = useState<AssetPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [repositorySaveState, setRepositorySaveState] = useState<RepositorySaveState>("idle");
  const [repositoryMessage, setRepositoryMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const purposeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const documentEditorRef = useRef<HTMLDivElement>(null);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const repositorySaveInFlightRef = useRef<Promise<void> | null>(null);
  const addMockupHandlerRef = useRef<() => Promise<void>>(async () => {});
  const repositorySaveHandlerRef = useRef<() => Promise<void>>(async () => {});
  const draftRevisionRef = useRef(0);

  const resizePurposeTextarea = useCallback(() => {
    const textarea = purposeTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 32)}px`;
  }, []);

  useEffect(resizePurposeTextarea, [draft?.purpose, resizePurposeTextarea]);

  useEffect(() => {
    window.addEventListener("resize", resizePurposeTextarea);
    return () => window.removeEventListener("resize", resizePurposeTextarea);
  }, [resizePurposeTextarea]);

  const savedSelectedRecord = useMemo(
    () => mockups.find((mockup) => mockup.id === draft?.id),
    [draft?.id, mockups],
  );
  const isDirty = useMemo(() => {
    if (!draft || !savedSelectedRecord) return false;
    return (
      JSON.stringify(draft) !== JSON.stringify(savedSelectedRecord) ||
      pendingAssets.length > 0 ||
      removedAssetIds.length > 0
    );
  }, [draft, pendingAssets.length, removedAssetIds.length, savedSelectedRecord]);
  const draftSaveSnapshotRef = useRef({ draft, isDirty, pendingAssets, removedAssetIds });
  draftSaveSnapshotRef.current = { draft, isDirty, pendingAssets, removedAssetIds };

  const selectedAssets = useMemo(() => {
    if (!draft) return [];
    const selectedIds = new Set(draft.assetIds);
    return assets.filter((asset) => selectedIds.has(asset.id));
  }, [assets, draft]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [localResult, repositoryResult] = await Promise.allSettled([
          loadRndWorkspace(),
          loadRndRepositoryWorkspace(),
        ]);
        if (localResult.status === "rejected" && repositoryResult.status === "rejected") {
          throw localResult.reason;
        }
        const localWorkspace =
          localResult.status === "fulfilled" ? localResult.value : { mockups: [], assets: [] };
        const repositoryWorkspace =
          repositoryResult.status === "fulfilled"
            ? repositoryResult.value
            : { mockups: [], assets: [] };
        const loaded = mergeRndWorkspaces(localWorkspace, repositoryWorkspace);
        const knownIds = new Set(loaded.mockups.map((mockup) => mockup.id));
        const sourceBackedRecords = RND_PROTOTYPE_DEFINITIONS
          .filter((definition) => !knownIds.has(definition.id))
          .map(createRecordForDefinition);

        if (cancelled) return;
        const nextMockups = [...loaded.mockups, ...sourceBackedRecords].sort((left, right) =>
          left.createdAt.localeCompare(right.createdAt),
        );
        setMockups(nextMockups);
        setAssets(loaded.assets);

        let storedSelection: string | null = null;
        try {
          storedSelection = window.localStorage.getItem(LAST_SELECTED_KEY);
        } catch {
          // IndexedDB remains authoritative when localStorage preferences are unavailable.
        }
        const initialSelection = nextMockups.some((mockup) => mockup.id === storedSelection)
          ? storedSelection
          : nextMockups[0]?.id ?? null;
        setSelectedId(initialSelection);
        setDraft(nextMockups.find((mockup) => mockup.id === initialSelection) ?? null);
        setIsLoading(false);

        if (repositoryResult.status === "rejected") {
          setRepositorySaveState("error");
          setRepositoryMessage(
            repositoryResult.reason instanceof Error
              ? repositoryResult.reason.message
              : "Repository-backed mock-ups could not be loaded.",
          );
        }
        if (localResult.status === "rejected") {
          setErrorMessage(describeRndStorageError(localResult.reason));
        }

        if (sourceBackedRecords.length > 0) {
          const seedResults = await Promise.allSettled(
            sourceBackedRecords.map((record) => saveRndMockup(record)),
          );
          if (!cancelled && seedResults.some((result) => result.status === "rejected")) {
            setErrorMessage(
              "Existing R&D notes are available, but Chronicle could not save a new source-backed mock-up record to this device.",
            );
            setSaveState("error");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(describeRndStorageError(error));
          setSaveState("error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    try {
      window.localStorage.setItem(LAST_SELECTED_KEY, selectedId);
    } catch {
      // Selection persistence is optional; the R&D record remains saved in IndexedDB.
    }
  }, [selectedId]);

  useEffect(() => {
    const previews = selectedAssets.map((asset) => ({
      asset,
      url: URL.createObjectURL(asset.blob),
    }));
    setAssetPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [selectedAssets]);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const setDraftField = <Key extends keyof RndMockupRecord,>(
    key: Key,
    value: RndMockupRecord[Key],
  ) => {
    draftRevisionRef.current += 1;
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    if (!saveInFlightRef.current) setSaveState("idle");
    if (repositorySaveState !== "saving") {
      setRepositorySaveState("idle");
      setRepositoryMessage("");
    }
    setErrorMessage("");
  };

  const setDocumentBlocks = (
    update: (current: RndDocumentBlock[]) => RndDocumentBlock[],
  ) => {
    draftRevisionRef.current += 1;
    setDraft((current) => {
      if (!current) return current;
      const documentBlocks = ensureEditableDocument(update(current.documentBlocks));
      return { ...current, documentBlocks, ...projectDocumentBlocks(documentBlocks) };
    });
    if (!saveInFlightRef.current) setSaveState("idle");
    if (repositorySaveState !== "saving") {
      setRepositorySaveState("idle");
      setRepositoryMessage("");
    }
    setErrorMessage("");
  };

  const updateTextBlock = (blockId: string, text: string) => {
    setDocumentBlocks((current) =>
      current.map((block) =>
        block.id === blockId && block.type === "text" ? { ...block, text } : block,
      ),
    );
  };

  const splitTextBlock = (blockId: string, selectionStart: number, selectionEnd: number) => {
    const nextBlockId = uuid();
    setDocumentBlocks((current) => {
      const blockIndex = current.findIndex((block) => block.id === blockId && block.type === "text");
      const block = current[blockIndex];
      if (blockIndex < 0 || block.type !== "text") return current;
      return [
        ...current.slice(0, blockIndex),
        { ...block, text: block.text.slice(0, selectionStart) },
        { id: nextBlockId, type: "text", text: block.text.slice(selectionEnd) },
        ...current.slice(blockIndex + 1),
      ];
    });
    window.setTimeout(() => {
      const textarea = documentEditorRef.current?.querySelector<HTMLTextAreaElement>(
        `[data-rnd-text-block-id="${nextBlockId}"]`,
      );
      textarea?.focus();
      textarea?.setSelectionRange(0, 0);
    }, 0);
  };

  const persistDraft = useCallback((): Promise<boolean> => {
    if (saveInFlightRef.current) return saveInFlightRef.current;
    if (!draftSaveSnapshotRef.current.draft || !draftSaveSnapshotRef.current.isDirty) {
      return Promise.resolve(true);
    }

    const saveTask = (async () => {
      setSaveState("saving");
      setErrorMessage("");
      // All callers share this drain, so navigation cannot accept an older
      // autosave while text edited during that write is still only in memory.
      while (true) {
        const { draft, pendingAssets, removedAssetIds } = draftSaveSnapshotRef.current;
        if (!draft) return true;
        const savedRevision = draftRevisionRef.current;
        const savedAssetIds = new Set(pendingAssets.map((asset) => asset.id));
        const savedRemovedAssetIds = new Set(removedAssetIds);
        const recordToSave: RndMockupRecord = {
          ...draft,
          contentUpdatedAt: new Date().toISOString(),
        };

        try {
          await saveRndMockup(recordToSave, pendingAssets, removedAssetIds);
          setMockups((current) =>
            current.map((mockup) => (mockup.id === recordToSave.id ? recordToSave : mockup)),
          );
          const hasNewerChanges = draftRevisionRef.current !== savedRevision;
          setDraft((current) =>
            !hasNewerChanges && current?.id === recordToSave.id ? recordToSave : current,
          );
          setPendingAssets((current) =>
            current.filter((asset) => !savedAssetIds.has(asset.id)),
          );
          setRemovedAssetIds((current) =>
            current.filter((assetId) => !savedRemovedAssetIds.has(assetId)),
          );
          if (!hasNewerChanges) {
            setSaveState("saved");
            return true;
          }
        } catch (error) {
          setErrorMessage(describeRndStorageError(error));
          setSaveState("error");
          return false;
        }
      }
    })();

    saveInFlightRef.current = saveTask;
    void saveTask.finally(() => {
      if (saveInFlightRef.current === saveTask) saveInFlightRef.current = null;
    });
    return saveTask;
  }, []);

  useEffect(() => {
    if (!isDirty || isLoading || saveState === "saving" || saveState === "error") return;
    const autosaveTimer = window.setTimeout(() => {
      void persistDraft();
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(autosaveTimer);
  }, [draft, isDirty, isLoading, pendingAssets, persistDraft, removedAssetIds, saveState]);

  useEffect(() => {
    const persistBeforeLeave = async () => {
      if (repositorySaveInFlightRef.current) await repositorySaveInFlightRef.current;
      return persistDraft();
    };
    onRegisterBeforeLeave?.(persistBeforeLeave);
    return () => onRegisterBeforeLeave?.(null);
  }, [onRegisterBeforeLeave, persistDraft]);

  const selectMockup = async (id: string) => {
    if (id === selectedId) return;
    if (!(await persistDraft())) return;
    const next = mockups.find((mockup) => mockup.id === id) ?? null;
    setSelectedId(next?.id ?? null);
    setDraft(next);
    setPendingAssets([]);
    setRemovedAssetIds([]);
    setSaveState("idle");
    setRepositorySaveState("idle");
    setRepositoryMessage("");
    setErrorMessage("");
  };

  const addNewMockup = async () => {
    if (saveInFlightRef.current) return;
    if (!(await persistDraft())) return;
    if (saveInFlightRef.current) return;

    const newMockup = createBlankRndMockup();
    const createTask = (async () => {
      setSaveState("saving");
      setErrorMessage("");
      try {
        await saveRndMockup(newMockup);
        setMockups((current) => [...current, newMockup]);
        setSelectedId(newMockup.id);
        setDraft(newMockup);
        setPendingAssets([]);
        setRemovedAssetIds([]);
        setSaveState("saved");
        setRepositorySaveState("idle");
        setRepositoryMessage("");
        window.setTimeout(() => titleInputRef.current?.focus(), 0);
        return true;
      } catch (error) {
        setErrorMessage(describeRndStorageError(error));
        setSaveState("error");
        return false;
      }
    })();
    saveInFlightRef.current = createTask;
    await createTask;
    if (saveInFlightRef.current === createTask) saveInFlightRef.current = null;
  };
  addMockupHandlerRef.current = addNewMockup;
  const addMockupAvailable =
    !isLoading && saveState !== "saving" && repositorySaveState !== "saving";

  useEffect(() => {
    if (!addMockupAvailable) {
      onRegisterAddMockup?.(null);
      return;
    }
    const registeredAddMockup = () => addMockupHandlerRef.current();
    onRegisterAddMockup?.(registeredAddMockup);
    return () => onRegisterAddMockup?.(null);
  }, [addMockupAvailable, onRegisterAddMockup]);

  const openStyleGuide = async () => {
    if (await persistDraft()) onOpenStyleGuide();
  };

  const saveToRepository = useCallback(async () => {
    if (!draft || repositorySaveInFlightRef.current) return;
    const saveTask = (async () => {
      const savedRevision = draftRevisionRef.current;
      const recordToSave: RndMockupRecord = {
        ...draft,
        displayTitle: draft.displayTitle.trim() || "Untitled Mock-up",
        contentUpdatedAt: new Date().toISOString(),
      };
      setRepositorySaveState("saving");
      setRepositoryMessage("");
      try {
        await saveRndMockupToRepository(recordToSave, selectedAssets);
        const hasNewerChanges = draftRevisionRef.current !== savedRevision;
        setRepositorySaveState(hasNewerChanges ? "idle" : "saved");
      } catch (error) {
        setRepositorySaveState("error");
        setRepositoryMessage(
          error instanceof Error ? error.message : "Chronicle could not save this mock-up to the repository.",
        );
      }
    })();
    repositorySaveInFlightRef.current = saveTask;
    await saveTask;
    if (repositorySaveInFlightRef.current === saveTask) {
      repositorySaveInFlightRef.current = null;
    }
  }, [draft, selectedAssets]);
  repositorySaveHandlerRef.current = saveToRepository;
  const repositorySaveAvailable = draft !== null;

  useEffect(() => {
    if (!repositorySaveAvailable) {
      onRegisterRepositorySave?.(null);
      return;
    }
    const registeredSave = () => repositorySaveHandlerRef.current();
    onRegisterRepositorySave?.(registeredSave);
    return () => onRegisterRepositorySave?.(null);
  }, [onRegisterRepositorySave, repositorySaveAvailable]);

  useEffect(() => {
    onRepositorySaveStateChange?.(repositorySaveState);
  }, [onRepositorySaveStateChange, repositorySaveState]);

  useEffect(
    () => () => onRepositorySaveStateChange?.("idle"),
    [onRepositorySaveStateChange],
  );

  const addReferenceFiles = (
    fileList: FileList | File[],
    insertAfterBlockId: string | null = null,
  ) => {
    if (!draft || saveState === "saving") return;
    setErrorMessage("");
    try {
      const nextAssets = prepareReferenceAssets(Array.from(fileList), {
        mockupId: draft.id,
        existingPageCount: draft.assetIds.length,
        existingTotalBytes: assets.reduce((sum, asset) => sum + asset.size, 0),
      });
      if (nextAssets.length === 0) return;
      setAssets((current) => [...current, ...nextAssets]);
      setPendingAssets((current) => [...current, ...nextAssets]);
      setDocumentBlocks((current) => {
        const imageBlocks: RndDocumentBlock[] = nextAssets.map((asset) => ({
          id: uuid(),
          type: "image",
          assetId: asset.id,
        }));
        const targetIndex = insertAfterBlockId
          ? current.findIndex((block) => block.id === insertAfterBlockId)
          : -1;
        const trailingBlock = current[current.length - 1];
        const hasTrailingBlankText = trailingBlock?.type === "text" && trailingBlock.text === "";
        const insertionIndex =
          targetIndex >= 0
            ? targetIndex + 1
            : hasTrailingBlankText
              ? current.length - 1
              : current.length;
        return [
          ...current.slice(0, insertionIndex),
          ...imageBlocks,
          ...current.slice(insertionIndex),
        ];
      });
    } catch (error) {
      setErrorMessage(describeRndStorageError(error));
      setSaveState("error");
    }
  };

  const removeReferenceImage = (assetId: string) => {
    if (saveState === "saving") return;
    const isPending = pendingAssets.some((asset) => asset.id === assetId);
    setDocumentBlocks((current) =>
      current.filter((block) => block.type !== "image" || block.assetId !== assetId),
    );
    setAssets((current) => current.filter((asset) => asset.id !== assetId));
    if (isPending) {
      setPendingAssets((current) => current.filter((asset) => asset.id !== assetId));
    } else {
      setRemovedAssetIds((current) => [...current, assetId]);
    }
    setSaveState("idle");
    setErrorMessage("");
  };

  const moveImageBlock = (draggedBlockId: string, insertAfterBlockId: string | null) => {
    setDocumentBlocks((current) => {
      if (draggedBlockId === insertAfterBlockId) return current;
      const draggedBlock = current.find(
        (block) => block.id === draggedBlockId && block.type === "image",
      );
      if (!draggedBlock) return current;

      const remaining = current.filter((block) => block.id !== draggedBlockId);
      const targetIndex = insertAfterBlockId
        ? remaining.findIndex((block) => block.id === insertAfterBlockId)
        : -1;
      const trailingBlock = remaining[remaining.length - 1];
      const hasTrailingBlankText = trailingBlock?.type === "text" && trailingBlock.text === "";
      const insertionIndex =
        targetIndex >= 0
          ? targetIndex + 1
          : hasTrailingBlankText
            ? remaining.length - 1
            : remaining.length;
      return [
        ...remaining.slice(0, insertionIndex),
        draggedBlock,
        ...remaining.slice(insertionIndex),
      ];
    });
  };

  const definition = draft ? getRndPrototypeDefinition(draft.id) : undefined;
  const isSaving = saveState === "saving";
  const isRepositorySaving = repositorySaveState === "saving";

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white text-zinc-900 lg:flex-row">
      <aside className="flex h-auto max-h-[52vh] w-full flex-shrink-0 flex-col bg-[#2a2a2f] shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] lg:h-full lg:max-h-none lg:w-[clamp(250px,28vw,300px)]">
        <div className="bg-[#3c3e47] p-6 shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-white">Research & Development</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">Prototype workspace — not implemented Chronicle behavior.</p>
        </div>

        <nav aria-label="R&D workspace" className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-[#2a2a2f] p-4 pb-20 scrollbar-none">
          <button
            type="button"
            onClick={() => void openStyleGuide()}
            disabled={isSaving || isRepositorySaving}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl bg-[#3c3e47] px-4 py-3 text-left text-sm font-bold text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BookOpen className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
            <span>
              <span className="block">Chronicle UI Guide</span>
              <span className="mt-0.5 block text-[10px] font-normal text-white/40">Open the canonical guide</span>
            </span>
          </button>

          <section className="space-y-2">
            <div className="relative mb-3 w-full overflow-hidden rounded-xl border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-2 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: "60%" }} />
              <span className="relative z-[1] text-[10px] font-bold uppercase tracking-wider text-white">Mock-ups</span>
            </div>
            <div className="space-y-2">
              {mockups.map((mockup) => {
                const label = draft?.id === mockup.id ? draft.displayTitle : mockup.displayTitle;
                const sourceAttached = !!getRndPrototypeDefinition(mockup.id);
                return (
                  <button
                    key={mockup.id}
                    type="button"
                    onClick={() => void selectMockup(mockup.id)}
                    aria-current={selectedId === mockup.id ? "page" : undefined}
                    disabled={isSaving || isRepositorySaving}
                    className={cn(
                      "flex h-10 w-full items-center gap-2 rounded-xl border bg-[#3c3e47] px-3 text-left text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40 disabled:cursor-not-allowed disabled:opacity-50",
                      selectedId === mockup.id ? "border-[#7891b3]" : "border-transparent",
                    )}
                  >
                    {sourceAttached ? (
                      <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-white/70" aria-hidden="true" />
                    ) : (
                      <FileImage className="h-3.5 w-3.5 shrink-0 text-white/45" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">{label || "Untitled Mock-up"}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </nav>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex min-h-full items-center justify-center p-8 text-sm text-zinc-500">Loading document…</div>
        ) : draft ? (
          <div
            role="region"
            aria-label="Editable mock-up document"
            aria-busy={isSaving}
            onDragOver={(event) => {
              event.preventDefault();
              if (isSaving) return;
              const isMovingBlock = Array.from(event.dataTransfer.types ?? []).includes(
                INTERNAL_BLOCK_DRAG_TYPE,
              );
              event.dataTransfer.dropEffect = isMovingBlock ? "move" : "copy";
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (isSaving) return;
              const targetBlockId =
                event.target instanceof Element
                  ? event.target.closest<HTMLElement>("[data-rnd-document-block-id]")?.dataset
                      .rndDocumentBlockId ?? null
                  : null;
              const draggedBlockId =
                typeof event.dataTransfer.getData === "function"
                  ? event.dataTransfer.getData(INTERNAL_BLOCK_DRAG_TYPE)
                  : "";
              if (draggedBlockId) {
                moveImageBlock(draggedBlockId, targetBlockId);
                return;
              }
              if (event.dataTransfer.files?.length) {
                addReferenceFiles(event.dataTransfer.files, targetBlockId);
              }
            }}
            className="min-h-full w-full bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-12"
          >
            <div className="border-b border-zinc-200 pb-8">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2">
                <label htmlFor="rnd-title" className="shrink-0 text-sm font-bold text-black">
                  Title:
                </label>
                <input
                  ref={titleInputRef}
                  id="rnd-title"
                  aria-label="Title"
                  value={draft.displayTitle}
                  onChange={(event) => setDraftField("displayTitle", event.target.value)}
                  className="min-w-[220px] flex-1 border-0 bg-transparent p-0 text-3xl font-bold tracking-[-0.025em] text-black placeholder:text-zinc-500 focus:outline-none focus:ring-0"
                  placeholder="Untitled Mock-up"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-zinc-700">
                <span>
                  <span className="font-bold text-black">Date created:</span>{" "}
                  {formatDate(draft.createdAt)}
                </span>
                <span>
                  <span className="font-bold text-black">Last edited:</span>{" "}
                  {formatDate(draft.contentUpdatedAt)}
                </span>
              </div>

              <div className="mt-4">
                <label htmlFor="rnd-purpose" className="block text-sm font-bold text-black">
                  Purpose:
                </label>
                <textarea
                  ref={purposeTextareaRef}
                  id="rnd-purpose"
                  aria-label="Brief purpose"
                  value={draft.purpose}
                  onChange={(event) => {
                    setDraftField("purpose", event.target.value);
                    resizePurposeTextarea();
                  }}
                  onInput={resizePurposeTextarea}
                  rows={1}
                  wrap="soft"
                  spellCheck
                  placeholder="What this mock-up is for"
                  className="mt-2 block min-h-8 w-full resize-none overflow-hidden whitespace-pre-wrap break-words border-0 bg-transparent p-0 text-base leading-8 text-zinc-900 placeholder:font-medium placeholder:text-zinc-500 focus:outline-none focus:ring-0"
                />
              </div>

              {repositorySaveState === "error" && repositoryMessage ? (
                <p
                  role="alert"
                  className="mt-3 text-sm font-medium text-rose-700"
                >
                  {repositoryMessage}
                </p>
              ) : null}
            </div>

            {errorMessage ? <p role="alert" className="mt-5 text-sm text-rose-600">{errorMessage}</p> : null}

            <div className="mt-8 space-y-8">
              <RndPrototypeShell
                mockup={draft}
                definition={definition}
                isEditingDisabled={isSaving || isRepositorySaving}
                onBackgroundChange={(background: PreviewBackground) =>
                  setDraftField("previewBackground", background)
                }
              />
              {definition?.additionalSections?.map((section) => (
                <RndPrototypeShell
                  key={section.id}
                  mockup={draft}
                  definition={definition}
                  section={section}
                  isEditingDisabled={isSaving || isRepositorySaving}
                  onBackgroundChange={(background: PreviewBackground) =>
                    setDraftField("previewBackground", background)
                  }
                />
              ))}
            </div>

            <div ref={documentEditorRef} className="mt-8 min-h-[58vh] w-full">
              {draft.documentBlocks.map((block) => {
                if (block.type === "text") {
                  return (
                    <DocumentTextBlock
                      key={block.id}
                      block={block}
                      disabled={false}
                      showPlaceholder={
                        draft.documentBlocks.length === 1 && block.text.length === 0
                      }
                      onChange={(text) => updateTextBlock(block.id, text)}
                      onSplit={(selectionStart, selectionEnd) =>
                        splitTextBlock(block.id, selectionStart, selectionEnd)
                      }
                    />
                  );
                }

                const preview = assetPreviews.find(
                  ({ asset }) => asset.id === block.assetId,
                );
                if (!preview) return null;
                return (
                  <figure
                    key={block.id}
                    data-rnd-document-block-id={block.id}
                    draggable={!isSaving}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData(INTERNAL_BLOCK_DRAG_TYPE, block.id);
                    }}
                    className="group relative my-4 w-fit max-w-full cursor-grab active:cursor-grabbing"
                  >
                    <img
                      src={preview.url}
                      alt={preview.asset.fileName}
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => removeReferenceImage(preview.asset.id)}
                      disabled={isSaving}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center bg-white/90 text-zinc-600 opacity-100 shadow-sm transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7891b3] disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      aria-label={`Remove ${preview.asset.fileName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </figure>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-h-full bg-white px-6 py-10 sm:px-10 lg:px-14">
            <button
              type="button"
              onClick={() => void addNewMockup()}
              disabled={saveState === "saving" || !!errorMessage}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4a5f7f] hover:text-[#31445e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7891b3] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create a blank document
            </button>
            {errorMessage ? <p role="alert" className="mt-5 text-sm text-rose-600">{errorMessage}</p> : null}
          </div>
        )}
      </main>
    </div>
  );
}

export default ResearchDevelopmentTool;
