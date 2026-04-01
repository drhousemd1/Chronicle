/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { CharacterPersonality, PersonalityTrait, PersonalityTraitFlexibility } from '@/types';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

import { uid } from '@/utils';
import { cn } from '@/lib/utils';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { GENERATE_BOTH_PREFIX, parseGenerateBothResponse } from '@/services/character-ai';

interface PersonalitySectionProps {
  personality: CharacterPersonality;
  onChange: (personality: CharacterPersonality) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
  onEnhanceField?: (fieldKey: string, getCurrentValue: () => string, setValue: (value: string) => void, customLabel?: string) => void;
  enhancingField?: string | null;
}

const FLEX_OPTIONS: { value: PersonalityTraitFlexibility; label: string }[] = [
  { value: 'rigid', label: 'Rigid' },
  { value: 'normal', label: 'Normal' },
  { value: 'flexible', label: 'Flexible' },
];

const FLEX_COLORS: Record<PersonalityTraitFlexibility, string> = {
  rigid: 'text-red-500',
  normal: 'text-blue-500',
  flexible: 'text-emerald-400',
};

const defaultTrait = (): PersonalityTrait => ({
  id: uid('ptrait'),
  label: '',
  value: '',
  flexibility: 'normal',
});

export const defaultPersonality: CharacterPersonality = {
  splitMode: false,
  traits: [defaultTrait()],
  outwardTraits: [defaultTrait()],
  inwardTraits: [defaultTrait()],
};




const TraitRow: React.FC<{
  trait: PersonalityTrait;
  onUpdate: (patch: Partial<PersonalityTrait>) => void;
  onDelete: () => void;
  readOnly?: boolean;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}> = ({ trait, onUpdate, onDelete, readOnly, onEnhance, isEnhancing }) => {
  if (readOnly) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{trait.label || 'Untitled'}</span>
          <span className={cn("text-[9px] font-bold uppercase", FLEX_COLORS[trait.flexibility])}>[{trait.flexibility}]</span>
        </div>
        <p className="text-sm text-zinc-400">{trait.value || '—'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start">
      <div className="flex-1 flex flex-col md:flex-row gap-2 min-w-0">
        <div className="w-full md:w-1/3 flex items-center gap-1.5 min-w-0">
          <AutoResizeTextarea
            value={trait.label}
            onChange={(v) => onUpdate({ label: v })}
            placeholder="PERSONALITY TRAIT"
            className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
          />
          {onEnhance && (
            <button
              type="button"
              tabIndex={-1}
              onClick={onEnhance}
              disabled={isEnhancing}
              title="Enhance with AI"
              className={cn(
                "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden text-cyan-200 transition-all",
                isEnhancing ? "animate-pulse cursor-wait" : "hover:brightness-125"
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
          value={trait.value}
          onChange={(v) => onUpdate({ value: v })}
          placeholder="Description..."
          className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
        />
      </div>
      {/* Flexibility dropdown */}
      <div className="ml-auto flex items-center gap-2">
        <select
          value={trait.flexibility}
          onChange={(e) => onUpdate({ flexibility: e.target.value as PersonalityTraitFlexibility })}
          className="mt-1 w-full md:w-auto text-[10px] font-bold uppercase bg-[#1c1c1f] border border-black/35 text-zinc-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          {FLEX_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="button"
          tabIndex={-1}
          onClick={onDelete}
          className="text-zinc-500 hover:text-rose-400 transition-colors p-1 mt-1 rounded-md hover:bg-red-900/20"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const TraitList: React.FC<{
  heading?: string;
  traits: PersonalityTrait[];
  onUpdateTrait: (id: string, patch: Partial<PersonalityTrait>) => void;
  onDeleteTrait: (id: string) => void;
  onAddTrait: () => void;
  readOnly?: boolean;
  onEnhanceTrait?: (trait: PersonalityTrait) => void;
  enhancingField?: string | null;
}> = ({ heading, traits, onUpdateTrait, onDeleteTrait, onAddTrait, readOnly, onEnhanceTrait, enhancingField }) => (
  <div className="space-y-3">
    {heading && (
      <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.15em] border-b border-[#4a5f7f] pb-2">{heading}</h4>
    )}
    {traits.length > 0 ? (
      <div className="space-y-3">
        {traits.map(trait => (
          <TraitRow
            key={trait.id}
            trait={trait}
            onUpdate={(patch) => onUpdateTrait(trait.id, patch)}
            onDelete={() => onDeleteTrait(trait.id)}
            readOnly={readOnly}
            onEnhance={onEnhanceTrait ? () => onEnhanceTrait(trait) : undefined}
            isEnhancing={enhancingField === `personality_${trait.id}`}
          />
        ))}
      </div>
    ) : (
      <p className="text-zinc-500 text-sm italic">No traits defined</p>
    )}
    {!readOnly && (
      <button
        type="button"
        onClick={onAddTrait}
        className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1"
      >
        <Plus className="w-4 h-4" /> Add Trait
      </button>
    )}
  </div>
);

const hasRealContent = (arr: PersonalityTrait[]) =>
  arr.some(t => t.label.trim() || t.value.trim());

export const PersonalitySection: React.FC<PersonalitySectionProps> = ({
  personality,
  onChange,
  isExpanded = true,
  onToggle,
  readOnly = false,
  onEnhanceField,
  enhancingField,
}) => {
  const updateTraits = (key: 'traits' | 'outwardTraits' | 'inwardTraits', id: string, patch: Partial<PersonalityTrait>) => {
    onChange({
      ...personality,
      [key]: personality[key].map(t => t.id === id ? { ...t, ...patch } : t),
    });
  };

  const deleteTrait = (key: 'traits' | 'outwardTraits' | 'inwardTraits', id: string) => {
    onChange({
      ...personality,
      [key]: personality[key].filter(t => t.id !== id),
    });
  };

  const addTrait = (key: 'traits' | 'outwardTraits' | 'inwardTraits') => {
    onChange({
      ...personality,
      [key]: [...personality[key], defaultTrait()],
    });
  };

  const handleEnhanceTrait = (key: 'traits' | 'outwardTraits' | 'inwardTraits', trait: PersonalityTrait) => {
    if (!onEnhanceField) return;

    // Map the trait list key to the correct personality bucket prefix
    const bucketPrefix = key === 'outwardTraits' ? 'personality_outward'
      : key === 'inwardTraits' ? 'personality_inward'
      : 'personality';

    // Map to the correct generate-both hint
    const generateBothHint = key === 'outwardTraits' ? 'outward personality trait'
      : key === 'inwardTraits' ? 'inward personality trait'
      : 'personality trait';
    
    if (trait.label) {
      // Has label: enhance value only
      onEnhanceField(
        `${bucketPrefix}_${trait.id}`,
        () => trait.value,
        (v) => updateTraits(key, trait.id, { value: v }),
        `Personality trait: ${trait.label}`
      );
    } else {
      // No label: generate both label and description
      onEnhanceField(
        `${bucketPrefix}_${trait.id}`,
        () => trait.value,
        (v) => {
          const parsed = parseGenerateBothResponse(v);
          if (parsed) {
            updateTraits(key, trait.id, { label: parsed.label, value: parsed.value });
          } else {
            updateTraits(key, trait.id, { value: v });
          }
        },
        `${GENERATE_BOTH_PREFIX}${generateBothHint}`
      );
    }
  };

  const CollapsedView = () => {
    const allTraits = personality.splitMode
      ? [...personality.outwardTraits, ...personality.inwardTraits]
      : personality.traits;
    const filled = allTraits.filter(t => t.label || t.value);
    if (filled.length === 0) return <p className="text-zinc-500 text-sm italic">No personality traits defined</p>;
    return (
      <div className="space-y-3">
        {filled.map(t => (
          <TraitRow key={t.id} trait={t} onUpdate={() => {}} onDelete={() => {}} readOnly />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
      <div className="bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
        <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Personality</h2>
        {onToggle && (
          <button onClick={onToggle} className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-ghost-white relative z-[1]">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
          {!isExpanded ? (
            <CollapsedView />
          ) : (
            <div className="space-y-5">
              {/* Split toggle */}
              {!readOnly && (
                <div className="flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      const patch: Partial<CharacterPersonality> = { ...personality, splitMode: false };
                      if (!hasRealContent(personality.traits) && (hasRealContent(personality.outwardTraits) || hasRealContent(personality.inwardTraits))) {
                        patch.traits = [...personality.outwardTraits, ...personality.inwardTraits]
                          .filter(t => t.label.trim() || t.value.trim())
                          .map(t => ({ ...t, id: uid('ptrait') }));
                        if (patch.traits.length === 0) patch.traits = [defaultTrait()];
                      }
                      onChange(patch as CharacterPersonality);
                    }}
                    className={cn(
                      "px-3.5 py-1.5 text-[10px] font-black rounded-lg border-none cursor-pointer transition-all",
                      !personality.splitMode
                        ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                        : "bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300"
                    )}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const patch: Partial<CharacterPersonality> = { ...personality, splitMode: true };
                      if (!hasRealContent(personality.outwardTraits) && hasRealContent(personality.traits)) {
                        patch.outwardTraits = personality.traits.map(t => ({ ...t, id: uid('ptrait') }));
                      }
                      onChange(patch as CharacterPersonality);
                    }}
                    className={cn(
                      "px-3.5 py-1.5 text-[10px] font-black rounded-lg border-none cursor-pointer transition-all",
                      personality.splitMode
                        ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                        : "bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300"
                    )}
                  >
                    Split
                  </button>
                </div>
              )}

              {personality.splitMode ? (
                <div className="space-y-6">
                  <TraitList
                    heading="Outward Personality"
                    traits={personality.outwardTraits}
                    onUpdateTrait={(id, patch) => updateTraits('outwardTraits', id, patch)}
                    onDeleteTrait={(id) => deleteTrait('outwardTraits', id)}
                    onAddTrait={() => addTrait('outwardTraits')}
                    readOnly={readOnly}
                    onEnhanceTrait={onEnhanceField ? (trait) => handleEnhanceTrait('outwardTraits', trait) : undefined}
                    enhancingField={enhancingField}
                  />
                  <TraitList
                    heading="Inward Personality"
                    traits={personality.inwardTraits}
                    onUpdateTrait={(id, patch) => updateTraits('inwardTraits', id, patch)}
                    onDeleteTrait={(id) => deleteTrait('inwardTraits', id)}
                    onAddTrait={() => addTrait('inwardTraits')}
                    readOnly={readOnly}
                    onEnhanceTrait={onEnhanceField ? (trait) => handleEnhanceTrait('inwardTraits', trait) : undefined}
                    enhancingField={enhancingField}
                  />
                </div>
              ) : (
                <TraitList
                  traits={personality.traits}
                  onUpdateTrait={(id, patch) => updateTraits('traits', id, patch)}
                  onDeleteTrait={(id) => deleteTrait('traits', id)}
                  onAddTrait={() => addTrait('traits')}
                  readOnly={readOnly}
                  onEnhanceTrait={onEnhanceField ? (trait) => handleEnhanceTrait('traits', trait) : undefined}
                  enhancingField={enhancingField}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
