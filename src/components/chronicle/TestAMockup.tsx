import React, { useState } from "react";

const FIELDS: Array<[string, string]> = [
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

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M9.9 3.2a.9.9 0 0 1 1.7 0l1.2 3.9a2 2 0 0 0 1.3 1.3l3.9 1.2a.9.9 0 0 1 0 1.7l-3.9 1.2a2 2 0 0 0-1.3 1.3l-1.2 3.9a.9.9 0 0 1-1.7 0l-1.2-3.9a2 2 0 0 0-1.3-1.3l-3.9-1.2a.9.9 0 0 1 0-1.7l3.9-1.2a2 2 0 0 0 1.3-1.3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/*
 * Local dark-token scoping CSS variables.
 * These override the global theme tokens inside this component
 * so borders/inputs/backgrounds match the reference exactly.
 */
const LOCAL_DARK_TOKENS: React.CSSProperties = {
  // oklch values converted to approximate hex for CSS var compatibility
  ["--background" as string]: "oklch(0.145 0 0)",
  ["--foreground" as string]: "oklch(0.985 0 0)",
  ["--card" as string]: "oklch(0.205 0 0)",
  ["--card-foreground" as string]: "oklch(0.985 0 0)",
  ["--primary" as string]: "oklch(0.922 0 0)",
  ["--primary-foreground" as string]: "oklch(0.205 0 0)",
  ["--muted" as string]: "oklch(0.269 0 0)",
  ["--muted-foreground" as string]: "oklch(0.708 0 0)",
  ["--accent" as string]: "oklch(0.371 0 0)",
  ["--accent-foreground" as string]: "oklch(0.985 0 0)",
  ["--border" as string]: "oklch(1 0 0 / 10%)",
  ["--input" as string]: "oklch(1 0 0 / 15%)",
  ["--ring" as string]: "oklch(0.556 0 0)",
  ["--radius" as string]: "0.625rem",
  fontFamily: '"Manrope", "Segoe UI", sans-serif',
  colorScheme: "dark",
};

export const TestAMockup: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(([label, val]) => [label, val]))
  );

  const updateValue = (label: string, val: string) =>
    setValues((prev) => ({ ...prev, [label]: val }));

  return (
    <div className="dark" style={LOCAL_DARK_TOKENS}>
      <section
        className="flex w-full flex-col gap-6 rounded-xl border py-6 shadow-sm"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <header className="grid auto-rows-min items-start gap-2 px-6 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="leading-none font-semibold text-2xl">Physical Appearance</h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Swap in new attributes while preserving the base shadcn card style.
          </p>
        </header>

        {/* Content / Rows */}
        <div className="px-6" style={{ maxHeight: 690, overflow: "auto", paddingRight: 4 }}>
          <div className="space-y-3">
            {FIELDS.map(([label]) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 220px) 24px minmax(0, 1fr) 24px",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Label */}
                <div
                  className="rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]"
                  style={{
                    border: "1px solid var(--input)",
                    backgroundColor: "var(--input)",
                  }}
                >
                  {label}
                </div>

                {/* Sparkles icon */}
                <span style={{ color: "var(--muted-foreground)" }}>
                  <SparklesIcon />
                </span>

                {/* Editable value */}
                <input
                  type="text"
                  value={values[label] ?? ""}
                  onChange={(e) => updateValue(label, e.target.value)}
                  className="h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs"
                  style={{
                    border: "1px solid var(--input)",
                    backgroundColor: "var(--input)",
                    color: "var(--muted-foreground)",
                    outline: "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    boxSizing: "border-box",
                  }}
                />

                {/* Lock icon */}
                <button type="button" className="inline-flex items-center justify-center" style={{ color: "var(--muted-foreground)", background: "none", border: 0, padding: 0, cursor: "pointer" }}>
                  <LockIcon />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center px-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-dashed px-4 py-2 text-sm font-medium shadow-xs"
            style={{
              borderColor: "var(--input)",
              backgroundColor: "var(--input)",
              color: "var(--primary)",
              cursor: "pointer",
            }}
          >
            <PlusIcon />
            Add Row
          </button>
        </footer>
      </section>
    </div>
  );
};
