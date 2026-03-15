import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Character, CharacterTraitSection, CharacterTraitSectionType, ScenarioData, PhysicalAppearance, CurrentlyWearing, PreferredClothing, CharacterGoal, CharacterExtraRow, CharacterBackground, CharacterTone, CharacterKeyLifeEvents, CharacterRelationships, CharacterSecrets, CharacterFears, defaultCharacterBackground } from '@/types';
import { CustomContentTypeModal } from './CustomContentTypeModal';
import { Button, TextArea, Card } from './UI';
import { Icons } from '@/constants';
import { uid, now, clamp, resizeImage } from '@/utils';
import { useAuth } from '@/hooks/use-auth';
import { uploadAvatar, dataUrlToBlob, updateNavButtonImages, loadNavButtonImages } from '@/services/supabase-data';


          {/* USER-CREATED CUSTOM SECTIONS */}
          {selected.sections
            .filter(section => isTraitVisible(`custom:${section.id}`))
            .map(section => (
            <div key={section.id} className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              {/* Dark blue header with editable title */}
              <div className="bg-[#4a5f7f] border-b border-[#4a5f7f] px-5 py-3 flex items-center justify-between shadow-lg">
                <AutoResizeTextarea
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
                            <AutoResizeTextarea
                              value={item.value}
                              onChange={(v) => {
                                const nextItems = (section.items.length > 0 ? section.items : items).map(it => it.id === item.id ? { ...it, value: v } : it);
                                handleUpdateSection(selected.id, section.id, { items: nextItems });
                              }}
                              placeholder="Write your content here..."
                              className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border-t border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              rows={4}
                            />
                            <button
                              type="button"
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
                                <AutoResizeTextarea
                                  value={item.label}
                                  onChange={(v) => {
                                    const nextItems = section.items.map(it => it.id === item.id ? { ...it, label: v } : it);
                                    handleUpdateSection(selected.id, section.id, { items: nextItems });
                                  }}
                                   placeholder="LABEL"
                                   className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border-t border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
                                />
                                <button
                                    type="button"
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
                              <AutoResizeTextarea
                                value={item.value}
                                onChange={(v) => {
                                  const nextItems = section.items.map(it => it.id === item.id ? { ...it, value: v } : it);
                                  handleUpdateSection(selected.id, section.id, { items: nextItems });
                                }}
                                placeholder="Description"
                                className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border-t border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                            <button
                              type="button"
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
      </div>

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
                className="w-full bg-[#1c1c1f] text-[#eaedf1] text-[12px] font-bold px-[10px] py-2 rounded-lg border-0 border-t border-black/35 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]"
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
                    {sidebarTraitNavItems.find((item) => item.key === editingNavKey)?.label || 'Section'}
                  </span>
                  <SidebarProgressRing
                    progress={sectionProgressByKey[editingNavKey] || toProgress(0, 0)}
                    active={editingNavKey === activeTraitSection}
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
