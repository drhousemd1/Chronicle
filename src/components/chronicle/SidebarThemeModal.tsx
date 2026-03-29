import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { UserBackground } from "@/types";
import { updateSidebarBackgroundCategories } from "@/services/supabase-data";
import {
  Dialog,
  DialogContentBare,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/constants";
import { Check, Image, ChevronDown, Upload, GripVertical, Plus, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageLibraryPickerModal } from "./ImageLibraryPickerModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface CategoryRow {
  id: string;
  label: string;
  bgIds: string[]; // ordered background ids belonging to this row
}

interface SidebarThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBackgroundId: string | null;
  backgrounds: UserBackground[];
  onSelectBackground: (id: string | null) => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string, imageUrl: string) => void;
  isUploading: boolean;
  onReorder?: (updated: UserBackground[]) => void;
  onAddFromLibrary?: (imageUrl: string) => Promise<void>;
}

const getCategoryLabel = (bg: UserBackground) => bg.category || "Uncategorized";

const deriveCategoryOrder = (backgrounds: UserBackground[]): string[] => {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const bg of backgrounds) {
    const label = getCategoryLabel(bg);
    if (!seen.has(label)) {
      seen.add(label);
      ordered.push(label);
    }
  }
  if (seen.has("Uncategorized")) {
    return ["Uncategorized", ...ordered.filter((l) => l !== "Uncategorized")];
  }
  return ordered;
};

/* ── Inline sub-components ────────────────────────────────────────────────── */

function RowLabel({ label, onRename }: { label: string; onRename: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(label);

  const commit = () => {
    setEditing(false);
    onRename(val.trim() || label);
  };

  if (editing) {
    return (
      <input
        value={val}
        autoFocus
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setVal(label); setEditing(false); }
        }}
        className="bg-white/[0.08] border border-blue-500/60 rounded-md text-white text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 outline-none w-40"
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to rename"
      className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest cursor-text px-1 py-0.5 rounded hover:text-zinc-200 transition-colors"
    >
      {label}
    </span>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function SidebarThemeModal({
  isOpen,
  onClose,
  selectedBackgroundId,
  backgrounds,
  onSelectBackground,
  onUpload,
  onDelete,
  isUploading,
  onReorder,
  onAddFromLibrary,
}: SidebarThemeModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => deriveCategoryOrder(backgrounds));

  /* ── Local state mirror — source of truth while modal is open ─── */
  const [localBackgrounds, setLocalBackgrounds] = useState<UserBackground[]>(backgrounds);

  // Sync from prop when backgrounds change (new upload, delete, etc.)
  useEffect(() => {
    setLocalBackgrounds(backgrounds);
    setCategoryOrder((prev) => {
      const incoming = deriveCategoryOrder(backgrounds);
      const merged = prev.filter((label) => incoming.includes(label));
      for (const label of incoming) {
        if (!merged.includes(label)) merged.push(label);
      }
      if (merged.includes("Uncategorized")) {
        return ["Uncategorized", ...merged.filter((l) => l !== "Uncategorized")];
      }
      return merged;
    });
  }, [backgrounds]);

  /* ── Derive category rows from local state ──────────────────── */
  const effectiveRows = useMemo(() => {
    const catMap = new Map<string, UserBackground[]>();
    for (const bg of localBackgrounds) {
      const cat = getCategoryLabel(bg);
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(bg);
    }

    const orderedLabels = [
      ...categoryOrder.filter((label) => catMap.has(label)),
      ...Array.from(catMap.keys()).filter((label) => !categoryOrder.includes(label)),
    ];

    const normalizedLabels = orderedLabels.includes("Uncategorized")
      ? ["Uncategorized", ...orderedLabels.filter((l) => l !== "Uncategorized")]
      : orderedLabels;

    const rows: CategoryRow[] = normalizedLabels.map((label) => {
      const ids = (catMap.get(label) || [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt)
        .map((bg) => bg.id);
      return { id: `row-${label}`, label, bgIds: ids };
    });

    if (rows.length === 0) {
      rows.push({ id: "row-Uncategorized", label: "Uncategorized", bgIds: [] });
    }
    return rows;
  }, [categoryOrder, localBackgrounds]);

  const bgMap = new Map(localBackgrounds.map((b) => [b.id, b]));

  /* ── Drag state ────────────────────────────────────────────────────── */
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ toRowId?: string; beforeBgId?: string | null; isNewRow?: boolean } | null>(null);
  const dragInfo = useRef<{ bgId: string; fromRowId: string } | null>(null);
  const dropInfo = useRef<{ toRowId?: string; beforeBgId?: string | null; isNewRow?: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRaf = useRef<number>(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Persist: update only the affected items in localBackgrounds + DB ── */
  const persistMoveChanges = useCallback((updatedBgs: UserBackground[]) => {
    setLocalBackgrounds(updatedBgs);
    onReorder?.(updatedBgs);

    // Build DB updates only for items whose category/sortOrder changed vs prop
    const dbUpdates: Array<{ id: string; category: string; sort_order: number }> = [];
    for (const bg of updatedBgs) {
      const orig = backgrounds.find((b) => b.id === bg.id);
      if (!orig || orig.category !== bg.category || orig.sortOrder !== bg.sortOrder) {
        dbUpdates.push({ id: bg.id, category: bg.category, sort_order: bg.sortOrder });
      }
    }
    if (dbUpdates.length > 0) {
      updateSidebarBackgroundCategories(dbUpdates).catch(console.error);
    }
  }, [backgrounds, onReorder]);

  /* ── Core move operation: move one bg from source to destination ── */
  const moveItem = useCallback((bgId: string, destCategory: string, destIndex: number | null) => {
    setLocalBackgrounds((prev) => {
      const updated = prev.map((bg) => ({ ...bg }));
      const item = updated.find((bg) => bg.id === bgId);
      if (!item) return prev;

      const oldCategory = item.category;

      // Set new category
      item.category = destCategory;

      // Get items in destination category (excluding the moved item to avoid duplication)
      const destItems = updated
        .filter((bg) => bg.category === destCategory && bg.id !== bgId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);

      // Insert at position
      if (destIndex === null || destIndex >= destItems.length) {
        destItems.push(item);
      } else {
        destItems.splice(Math.max(0, destIndex), 0, item);
      }

      // Renumber destination
      destItems.forEach((bg, i) => { bg.sortOrder = i; });

      // If source category changed, renumber source too
      if (oldCategory !== destCategory) {
        const sourceItems = updated
          .filter((bg) => bg.category === oldCategory && bg.id !== bgId)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);
        sourceItems.forEach((bg, i) => { bg.sortOrder = i; });
      }

      // Persist
      onReorder?.(updated);
      const dbUpdates: Array<{ id: string; category: string; sort_order: number }> = [];
      for (const bg of updated) {
        const orig = prev.find((b) => b.id === bg.id);
        if (!orig || orig.category !== bg.category || orig.sortOrder !== bg.sortOrder) {
          dbUpdates.push({ id: bg.id, category: bg.category, sort_order: bg.sortOrder });
        }
      }
      if (dbUpdates.length > 0) {
        updateSidebarBackgroundCategories(dbUpdates).catch(console.error);
      }

      return updated;
    });
  }, [onReorder]);

  const handleRenameRow = (rowId: string, newLabel: string) => {
    const oldRow = effectiveRows.find((r) => r.id === rowId);
    if (!oldRow) return;

    setCategoryOrder((prev) => prev.map((label) => (label === oldRow.label ? newLabel : label)));

    setLocalBackgrounds((prev) => {
      const updated = prev.map((bg) =>
        oldRow.bgIds.includes(bg.id) ? { ...bg, category: newLabel } : bg
      );
      onReorder?.(updated);
      return updated;
    });

    const updates = oldRow.bgIds.map((id, i) => ({ id, category: newLabel, sort_order: i }));
    if (updates.length > 0) {
      updateSidebarBackgroundCategories(updates).catch(console.error);
    }
  };

  /* ── Drag handlers ─────────────────────────────────────────────────── */
  const onTileDragStart = (e: React.DragEvent, bgId: string, fromRowId: string) => {
    dragInfo.current = { bgId, fromRowId };
    setIsDragging(true);
    e.dataTransfer.clearData();
    e.dataTransfer.setData("text/plain", bgId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => { if (e.target instanceof HTMLElement) e.target.style.opacity = "0.35"; }, 0);
  };

  const stopAutoScroll = useCallback(() => cancelAnimationFrame(autoScrollRaf.current), []);

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setDropTarget(null);
    dragInfo.current = null;
    dropInfo.current = null;
    stopAutoScroll();
  }, [stopAutoScroll]);

  useEffect(() => {
    if (!isOpen) {
      resetDragState();
    }
  }, [isOpen, resetDragState]);

  const onTileDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) e.target.style.opacity = "1";
    resetDragState();
  };

  const onDropZoneDragOver = (e: React.DragEvent, toRowId: string, beforeBgId: string | null = null) => {
    if (!dragInfo.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dropInfo.current = { toRowId, beforeBgId, isNewRow: false };
    setDropTarget((prev) =>
      prev?.toRowId === toRowId && prev?.beforeBgId === beforeBgId && !prev?.isNewRow
        ? prev
        : { toRowId, beforeBgId }
    );
  };

  const onNewRowDragOver = (e: React.DragEvent) => {
    if (!dragInfo.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dropInfo.current = { isNewRow: true };
    setDropTarget((prev) => (prev?.isNewRow ? prev : { isNewRow: true }));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const drag = dragInfo.current;
    const drop = dropInfo.current;

    if (!drag || !drop) {
      resetDragState();
      return;
    }

    if (drop.isNewRow) {
      let newLabel = "New Category";
      let counter = 1;
      while (categoryOrder.includes(newLabel) || effectiveRows.some((r) => r.label === newLabel)) {
        newLabel = `New Category ${counter++}`;
      }
      setCategoryOrder((prev) => [...prev, newLabel]);
      moveItem(drag.bgId, newLabel, 0);
      resetDragState();
      return;
    }

    if (!drop.toRowId) {
      resetDragState();
      return;
    }

    const destRow = effectiveRows.find((r) => r.id === drop.toRowId);
    if (!destRow) {
      resetDragState();
      return;
    }

    let destIndex: number | null = null;
    if (drop.beforeBgId !== null && drop.beforeBgId !== undefined) {
      const idx = destRow.bgIds.indexOf(drop.beforeBgId);
      destIndex = idx === -1 ? null : idx;
    }

    const sourceRow = effectiveRows.find((r) => r.id === drag.fromRowId);
    if (sourceRow && sourceRow.label === destRow.label) {
      const currentIdx = sourceRow.bgIds.indexOf(drag.bgId);
      if (destIndex === currentIdx || (destIndex === null && currentIdx === sourceRow.bgIds.length - 1)) {
        resetDragState();
        return;
      }
    }

    moveItem(drag.bgId, destRow.label, destIndex);
    resetDragState();
  };

  const handleScrollAreaDragOver = (e: React.DragEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    const zone = 80;
    const speed = 10;
    cancelAnimationFrame(autoScrollRaf.current);
    if (e.clientY < top + zone) {
      const scroll = () => { el.scrollTop -= speed; autoScrollRaf.current = requestAnimationFrame(scroll); };
      autoScrollRaf.current = requestAnimationFrame(scroll);
    } else if (e.clientY > bottom - zone) {
      const scroll = () => { el.scrollTop += speed; autoScrollRaf.current = requestAnimationFrame(scroll); };
      autoScrollRaf.current = requestAnimationFrame(scroll);
    }
  };

  /* ── Library pick handler ─────────────────────────────────────────── */
  const handleLibraryPick = async (imageUrl: string) => {
    setIsPickerOpen(false);
    if (onAddFromLibrary) {
      await onAddFromLibrary(imageUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentBare className="w-[min(96vw,1280px)] max-w-none">
        <DialogTitle className="sr-only">Sidebar Theme</DialogTitle>
        <DialogDescription className="sr-only">
          Customize and organize sidebar background images.
        </DialogDescription>
        <div className="bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">

          {/* ── Header ── */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),transparent)] bg-[length:100%_30%] bg-no-repeat pointer-events-none" />
            <div className="relative flex items-center gap-2.5 px-5 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span className="text-base font-black text-white uppercase tracking-widest">
                Sidebar Theme
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-5">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />

            {/* ── Inner tray ── */}
            <div className="bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] p-5">

              {/* Upload row */}
              <div className="flex justify-end items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[#eaedf1] font-bold text-xs h-10 px-4 rounded-xl hover:bg-[#44464f] transition-colors cursor-pointer"
                >
                  Close
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center justify-center gap-2 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[#eaedf1] font-bold text-xs h-10 px-4 rounded-xl hover:bg-[#44464f] transition-colors disabled:opacity-50 cursor-pointer"
                      disabled={isUploading}
                    >
                      <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                      {isUploading ? "Uploading..." : "Upload Image"}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-[#3c3e47] border-black/20 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09)] z-50">
                    <DropdownMenuItem
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer text-zinc-200 hover:!bg-white/[0.06] focus:!bg-white/[0.06] focus:!text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" /> From Device
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsPickerOpen(true)}
                      className="cursor-pointer text-zinc-200 hover:!bg-white/[0.06] focus:!bg-white/[0.06] focus:!text-white"
                    >
                      <Image className="w-4 h-4 mr-2" /> From Library
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-[13px] h-[13px] text-blue-500 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[220px] bg-[#18181b] border-white/10 text-xs font-semibold leading-relaxed normal-case tracking-normal text-zinc-200">
                      Recommended: 300px × 1080px (portrait orientation)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Scrollable area */}
              <div
                ref={scrollRef}
                className="max-h-[520px] overflow-y-auto pr-2"
                onDragOver={handleScrollAreaDragOver}
                onDragLeave={stopAutoScroll}
                onDrop={stopAutoScroll}
              >
                {effectiveRows.map((row) => (
                  <div key={row.id} className="mb-4">
                    {/* Row label */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <RowLabel label={row.label} onRename={(val) => handleRenameRow(row.id, val)} />
                      <span className="text-[10px] text-zinc-700">· click to rename</span>
                    </div>

                    {/* Tile grid */}
                    <div className="grid grid-cols-5 md:grid-cols-7 gap-2.5">

                      {/* Default tile — only in first row */}
                      {row.id === effectiveRows[0].id && (
                        <div
                          className="relative"
                          onDragOver={(e) => onDropZoneDragOver(e, row.id, row.bgIds[0] ?? null)}
                          onDrop={onDrop}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectBackground(null)}
                            className={`relative w-full aspect-[1/3] rounded-xl overflow-hidden transition-all cursor-default bg-[#1c1c1f] ${
                              selectedBackgroundId === null
                                ? "ring-2 ring-blue-500 ring-inset border border-blue-500/30"
                                : "border border-white/[0.08]"
                            }`}
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                              <Image className="w-7 h-7 text-zinc-600" />
                              <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Default</span>
                            </div>
                            {selectedBackgroundId === null && (
                              <div className="absolute top-2 right-2 w-[22px] h-[22px] bg-blue-500 rounded-md flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Image tiles */}
                      {row.bgIds.map((bgId) => {
                        const bg = bgMap.get(bgId);
                        if (!bg) return null;

                        const isDropBeforeThis = isDragging && dropTarget?.toRowId === row.id && dropTarget?.beforeBgId === bgId;

                        return (
                          <React.Fragment key={bg.id}>
                            {/* Ghost placeholder — appears before the tile when this is the drop target */}
                            {isDropBeforeThis && (
                              <div
                                className="aspect-[1/3] rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04]"
                                onDragOver={(e) => onDropZoneDragOver(e, row.id, bg.id)}
                                onDrop={onDrop}
                              />
                            )}
                            <div
                              className="relative"
                              onDragOver={(e) => onDropZoneDragOver(e, row.id, bg.id)}
                              onDrop={onDrop}
                            >
                            <div
                              draggable
                              onDragStart={(e) => onTileDragStart(e, bg.id, row.id)}
                              onDragEnd={onTileDragEnd}
                              onClick={() => onSelectBackground(bg.id)}
                              className={`group relative aspect-[1/3] rounded-xl overflow-hidden transition-all cursor-grab select-none bg-[#1c1c1f] ${
                                selectedBackgroundId === bg.id
                                  ? "ring-2 ring-blue-500 ring-inset border border-blue-500/30"
                                  : "border border-white/[0.08]"
                              }`}
                            >
                              <img src={bg.imageUrl} alt="Background" className="absolute inset-0 w-full h-full object-cover" />

                              {/* Grip handle */}
                              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-white/[0.35] z-[2] pointer-events-none">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>

                              {/* Hover overlay */}
                              <div className="absolute inset-0 z-[1]">
                                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(bg.id, bg.imageUrl);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 flex items-center justify-center"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>

                              {/* Selection check */}
                              {selectedBackgroundId === bg.id && (
                                <div className="absolute top-2 left-2 w-[22px] h-[22px] bg-blue-500 rounded-md flex items-center justify-center z-[3]">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          </React.Fragment>
                        );
                      })}

                      {/* End-of-row ghost placeholder — only visible when dragging over this row's end */}
                      {isDragging && dropTarget?.toRowId === row.id && dropTarget?.beforeBgId === null && (
                        <div
                          className="aspect-[1/3] rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04]"
                          onDragOver={(e) => onDropZoneDragOver(e, row.id, null)}
                          onDrop={onDrop}
                        />
                      )}

                      {/* Invisible end-of-row drop target (always in DOM so you can drag to row end) */}
                      {isDragging && !(dropTarget?.toRowId === row.id && dropTarget?.beforeBgId === null) && (
                        <div
                          className="aspect-[1/3]"
                          onDragOver={(e) => onDropZoneDragOver(e, row.id, null)}
                          onDrop={onDrop}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* New category drop zone — only visible while dragging */}
                {isDragging && (
                  <div
                    onDragOver={onNewRowDragOver}
                    onDrop={onDrop}
                    className={`mt-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 ${
                      dropTarget?.isNewRow
                        ? "border-2 border-dashed border-white/20 bg-white/[0.04]"
                        : "border-2 border-dashed border-white/[0.08] bg-transparent"
                    }`}
                  >
                    <Plus className={`w-3.5 h-3.5 ${dropTarget?.isNewRow ? "text-zinc-300" : "text-zinc-600"}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${dropTarget?.isNewRow ? "text-zinc-300" : "text-zinc-600"}`}>
                      Drop here to create new category
                    </span>
                  </div>
                )}
              </div>

              {/* Empty state */}
              {localBackgrounds.length === 0 && (
                <div className="mt-6 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-700 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest">No themes uploaded</p>
                  <p className="text-[10px] mt-1">Upload images to customize your sidebar background.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ImageLibraryPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleLibraryPick}
        />
      </DialogContentBare>
    </Dialog>
  );
}
