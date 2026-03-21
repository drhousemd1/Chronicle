// Scenario Card View - Renders inside CharacterEditModal when "Scenario Card" toggle is active
// Shows session-scoped world core fields: Scenario, Setting, Locations, Custom Content, Story Goals

import React from 'react';
import { WorldCore, LocationEntry, WorldCustomSection, WorldCustomItem, StoryGoal } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { StoryGoalsSection } from '@/components/chronicle/StoryGoalsSection';
import { uid } from '@/utils';
import { cn } from '@/lib/utils';

// Reuse the same CollapsibleSection style from CharacterEditModal
const CollapsibleSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedContent?: React.ReactNode;
}> = ({ title, isExpanded, onToggle, children, collapsedContent }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
    <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
      <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">{title}</h2>
      <button 
        type="button"
        onClick={onToggle} 
        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 relative z-[1]"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </div>
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
        {isExpanded ? (
          <div className="space-y-4">
            {children}
          </div>
        ) : (
          <div className="w-full min-w-0">
            {collapsedContent || <p className="text-zinc-500 text-sm italic">No data</p>}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Auto-resizing textarea
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, className = '', rows = 1 }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={true}
      className={cn("w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words", className)}
    />
  );
};

export interface ScenarioCardEditorViewProps {
  scenarioDraft: Partial<WorldCore>;
  onUpdateScenarioDraft: React.Dispatch<React.SetStateAction<Partial<WorldCore>>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}

export const ScenarioCardEditorView: React.FC<ScenarioCardEditorViewProps> = ({
  scenarioDraft,
  onUpdateScenarioDraft,
  expandedSections,
  toggleSection
}) => {
  const updateField = (field: keyof WorldCore, value: any) => {
    onUpdateScenarioDraft(prev => ({ ...prev, [field]: value }));
  };

  const locations = scenarioDraft.structuredLocations || [];
  const customSections = scenarioDraft.customWorldSections || [];
  const storyGoals = scenarioDraft.storyGoals || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Scenario */}
      <CollapsibleSection
        title="Scenario"
        isExpanded={expandedSections.scenario !== false}
        onToggle={() => toggleSection('scenario')}
        collapsedContent={
          scenarioDraft.storyPremise 
            ? <p className="text-sm text-zinc-400 line-clamp-3">{scenarioDraft.storyPremise}</p>
            : undefined
        }
      >
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scenario / Premise</Label>
          <Textarea
            value={scenarioDraft.storyPremise || ''}
            onChange={(e) => updateField('storyPremise', e.target.value)}
            placeholder="The central situation, conflict, or premise..."
            rows={4}
            className="text-sm resize-none bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </CollapsibleSection>


      {/* Locations */}
      <CollapsibleSection
        title="Locations"
        isExpanded={expandedSections.locations !== false}
        onToggle={() => toggleSection('locations')}
        collapsedContent={
          locations.length > 0 && locations.some(l => l.label)
            ? <div className="space-y-2">{locations.filter(l => l.label).map(l => (
                <div key={l.id} className="space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{l.label}</span>
                  <p className="text-sm text-zinc-400">{l.description}</p>
                </div>
              ))}</div>
            : undefined
        }
      >
        <div className="space-y-3">
          {(locations.length > 0 ? locations : [{ id: 'loc_1', label: '', description: '' }, { id: 'loc_2', label: '', description: '' }]).map((loc, idx) => (
            <div key={loc.id} className="flex items-start gap-3">
              <Input 
                value={loc.label}
                onChange={(e) => {
                  const locs = [...(locations.length > 0 ? locations : [{ id: 'loc_1', label: '', description: '' }, { id: 'loc_2', label: '', description: '' }])];
                  locs[idx] = { ...locs[idx], label: e.target.value };
                  updateField('structuredLocations', locs);
                }}
                placeholder={idx === 0 ? "e.g. The Lakehouse" : "Location name..."}
                className="w-2/5 bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 text-sm"
              />
              <AutoResizeTextarea
                value={loc.description}
                onChange={(v) => {
                  const locs = [...(locations.length > 0 ? locations : [{ id: 'loc_1', label: '', description: '' }, { id: 'loc_2', label: '', description: '' }])];
                  locs[idx] = { ...locs[idx], description: v };
                  updateField('structuredLocations', locs);
                }}
                placeholder={idx === 0 ? "A secluded cabin by the lake..." : "Describe this location..."}
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  const locs = locations.filter((_, i) => i !== idx);
                  updateField('structuredLocations', locs.length > 0 ? locs : undefined);
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
              const locs = [...(locations.length > 0 ? locations : [{ id: 'loc_1', label: '', description: '' }, { id: 'loc_2', label: '', description: '' }])];
              locs.push({ id: uid('loc'), label: '', description: '' });
              updateField('structuredLocations', locs);
            }}
            className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            <span>ADD LOCATION</span>
          </button>
        </div>
      </CollapsibleSection>

      {/* Custom World Content */}
      {customSections.length > 0 && (
        <CollapsibleSection
          title="Custom World Content"
          isExpanded={expandedSections.customWorldContent !== false}
          onToggle={() => toggleSection('customWorldContent')}
        >
          <div className="space-y-6">
            {customSections.map((section, sIdx) => (
              <div key={section.id} className="p-4 bg-blue-900/40 rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={section.title}
                    onChange={(e) => {
                      const updated = [...customSections];
                      updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                      updateField('customWorldSections', updated);
                    }}
                    placeholder="Section Title..."
                    className="bg-transparent border-none text-white font-bold text-lg px-0 focus:ring-0 placeholder:text-zinc-500"
                  />
                   <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const updated = customSections.filter((_, i) => i !== sIdx);
                      updateField('customWorldSections', updated.length > 0 ? updated : undefined);
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
                        <Input
                          value={item.label}
                          onChange={(e) => {
                            const updated = [...customSections];
                            const items = [...updated[sIdx].items];
                            items[iIdx] = { ...items[iIdx], label: e.target.value };
                            updated[sIdx] = { ...updated[sIdx], items };
                            updateField('customWorldSections', updated);
                          }}
                          placeholder="LABEL"
                          className="w-2/5 bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 text-sm"
                        />
                        <AutoResizeTextarea
                          value={item.value}
                          onChange={(v) => {
                            const updated = [...customSections];
                            const items = [...updated[sIdx].items];
                            items[iIdx] = { ...items[iIdx], value: v };
                            updated[sIdx] = { ...updated[sIdx], items };
                            updateField('customWorldSections', updated);
                          }}
                          placeholder="Value..."
                          className="flex-1 px-3 py-2 rounded-lg text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        />
                         <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => {
                            const updated = [...customSections];
                            const items = updated[sIdx].items.filter((_, i) => i !== iIdx);
                            updated[sIdx] = { ...updated[sIdx], items };
                            updateField('customWorldSections', updated);
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
                        const updated = [...customSections];
                        const items = [...updated[sIdx].items, { id: uid('cwi'), label: '', value: '' }];
                        updated[sIdx] = { ...updated[sIdx], items };
                        updateField('customWorldSections', updated);
                      }}
                      className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={16} /> ADD ROW
                    </button>
                  </>
                ) : (
                  <>
                  {(() => {
                    const items = section.items.length > 0
                      ? section.items
                      : section.freeformValue
                        ? [{ id: uid('cwi'), label: '', value: section.freeformValue }]
                        : [{ id: uid('cwi'), label: '', value: '' }];
                    if (section.items.length === 0 && items.length > 0) {
                      const updated = [...customSections];
                      updated[sIdx] = { ...updated[sIdx], items, freeformValue: undefined };
                      updateField('customWorldSections', updated);
                    }
                    return items.map((item, iIdx) => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={item.label}
                            onChange={(e) => {
                              const updated = [...customSections];
                              const updatedItems = [...updated[sIdx].items];
                              updatedItems[iIdx] = { ...updatedItems[iIdx], label: e.target.value };
                              updated[sIdx] = { ...updated[sIdx], items: updatedItems };
                              updateField('customWorldSections', updated);
                            }}
                            placeholder="LABEL"
                            className="flex-1 bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 text-sm"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => {
                              const updated = [...customSections];
                              const updatedItems = updated[sIdx].items.filter((_, i) => i !== iIdx);
                              updated[sIdx] = { ...updated[sIdx], items: updatedItems.length > 0 ? updatedItems : [{ id: uid('cwi'), label: '', value: '' }] };
                              updateField('customWorldSections', updated);
                            }}
                            className="text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <AutoResizeTextarea
                          value={item.value}
                          onChange={(v) => {
                            const updated = [...customSections];
                            const updatedItems = [...updated[sIdx].items];
                            updatedItems[iIdx] = { ...updatedItems[iIdx], value: v };
                            updated[sIdx] = { ...updated[sIdx], items: updatedItems };
                            updateField('customWorldSections', updated);
                          }}
                          placeholder="Write your content here..."
                          className="w-full px-3 py-2 rounded-lg text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                          rows={4}
                        />
                      </div>
                    ));
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...customSections];
                      const currentItems = updated[sIdx].items.length > 0 ? updated[sIdx].items : [{ id: uid('cwi'), label: '', value: updated[sIdx].freeformValue || '' }];
                      updated[sIdx] = { ...updated[sIdx], items: [...currentItems, { id: uid('cwi'), label: '', value: '' }], freeformValue: undefined };
                      updateField('customWorldSections', updated);
                    }}
                    className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} /> ADD TEXT FIELD
                  </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Story Goals */}
      <StoryGoalsSection
        goals={storyGoals}
        onChange={(goals) => updateField('storyGoals', goals)}
      />
    </div>
  );
};

// Backward-compatible named export during migration
export const ScenarioCardView = ScenarioCardEditorView;
