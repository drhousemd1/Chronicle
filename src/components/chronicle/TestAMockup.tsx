import React, { useState } from 'react';
import { Sparkles, Plus, Lock } from 'lucide-react';

const FIELDS: [string, string][] = [
  ["Hair Color", "Brunette, Blonde, Black"],
  ["Eye Color", "Blue, Brown, Green"],
  ["Build", "Athletic, Slim, Curvy"],
  ["Body Hair", "Smooth, Light, Natural"],
  ["Height", "5 foot 8"],
  ["Breasts", "Size, description"],
  ["Genitalia", "Size, description"],
  ["Skin Tone", "Fair, Olive, Dark"],
  ["Makeup", "Light, Heavy, None"],
  ["Body Markings", "Scars, tattoos, birthmarks, piercings"],
  ["Temporary Conditions", "Injuries, illness, etc."],
];

export const TestAMockup: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(([label, val]) => [label, val]))
  );

  const updateValue = (label: string, val: string) =>
    setValues((prev) => ({ ...prev, [label]: val }));

  return (
    <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Test A</h3>
        <p className="text-sm text-muted-foreground">Physical Appearance mockup — visual test only</p>
      </div>
      <div className="p-6 pt-4">
        <div className="space-y-3">
          {FIELDS.map(([label]) => (
            <div key={label} className="grid grid-cols-[160px_28px_1fr_28px] items-center gap-2">
              <div className="rounded-md border border-input dark:bg-input/30 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] truncate">
                {label}
              </div>
              <span className="flex items-center justify-center text-muted-foreground">
                <Sparkles size={14} />
              </span>
              <input
                type="text"
                value={values[label] ?? ''}
                onChange={(e) => updateValue(label, e.target.value)}
                className="rounded-md border border-input dark:bg-input/30 bg-transparent h-9 w-full min-w-0 px-3 py-1 text-base text-muted-foreground shadow-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" className="flex items-center justify-center text-muted-foreground">
                <Lock size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center p-6 pt-0">
        <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-dashed border-input bg-transparent px-4 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full">
          <Plus size={16} />
          Add Row
        </button>
      </div>
    </div>
  );
};
