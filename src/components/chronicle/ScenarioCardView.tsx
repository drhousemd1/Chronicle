// Scenario Card View - Renders inside CharacterEditModal when "Scenario Card" toggle is active
// Shows session-scoped world core fields: Scenario, Setting, Locations, Custom Content, Story Goals

import React from 'react';
import { WorldCore, LocationEntry, WorldCustomSection, WorldCustomItem, StoryGoal } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { StoryGoalsSection } from './StoryGoalsSection';
import { uid } from '@/utils';

// Reuse the same CollapsibleSection style from CharacterEditModal
const CollapsibleSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedContent?: React.ReactNode;
}> = ({ title, isExpanded, onToggle, children, collapsedContent }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
      <h2 className="text-white text-xl font-bold tracking-tight">{title}</h2>
      <button 
        type="button"
        onClick={onToggle} 
        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </div>
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
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
      className={`w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words ${className}`}
    />
  );
};

interface ScenarioCardViewProps {
  scenarioDraft: Partial<WorldCore>;
  onUpdateScenarioDraft: React.Dispatch<React.SetStateAction<Partial<WorldCore>>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}

export const ScenarioCardView: React.FC<ScenarioCardViewProps> = ({
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
            className="text-sm resize-none bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </CollapsibleSection>

      {/* Setting Overview */}
      <CollapsibleSection
        title="Setting Overview"
        isExpanded={expandedSections.settingOverview !== false}
        onToggle={() => toggleSection('settingOverview')}
        collapsedContent={
          scenarioDraft.settingOverview 
            ? <p className="text-sm text-zinc-400 line-clamp-3">{scenarioDraft.settingOverview}</p>
            : undefined
        }
      >
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Setting</Label>
          <Textarea
            value={scenarioDraft.settingOverview || ''}
            onChange={(e) => updateField('settingOverview', e.target.value)}
            placeholder="Describe the physical and cultural landscape..."
            rows={4}
            className="text-sm resize-none bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:ring-blue-500/20 focus:border-blue-500"
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
                className="w-1/3 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 text-sm"
              />
              <AutoResizeTextarea
                value={loc.description}
                onChange={(v) => {
                  const locs = [...(locations.length > 0 ? locations : [{ id: 'loc_1', label: '', description: '' }, { id: 'loc_2', label: '', description: '' }])];
                  locs[idx] = { ...locs[idx], description: v };
                  updateField('structuredLocations', locs);
                }}
                placeholder={idx === 0 ? "A secluded cabin by the lake..." : "Describe this location..."}
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
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
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            <Plus size={16} />
            <span>Add Location</span>
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
              <div key={section.id} className="p-4 bg-blue-900/40 rounded-2xl border border-white/5 space-y-3">
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
                    onClick={() => {
                      const updated = customSections.filter((_, i) => i !== sIdx);
                      updateField('customWorldSections', updated.length > 0 ? updated : undefined);
                    }}
                    className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                      placeholder="Label..."
                      className="w-1/3 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 text-sm"
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
                      className="flex-1 px-3 py-2 rounded-lg text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
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
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Item</span>
                </button>
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
