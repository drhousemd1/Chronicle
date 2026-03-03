import React, { useState } from "react";

const FIELDS: Array<[string, string]> = [
  ["HAIR COLOR", "Brunette, Blonde, Black"],
  ["EYE COLOR", "Blue, Brown, Green"],
  ["BUILD", "Athletic, Slim, Curvy"],
  ["BODY HAIR", "Smooth, Light, Natural"],
  ["HEIGHT", "5 foot 8"],
  ["BREASTS", "Size, description"],
  ["GENITALIA", "Size, description"],
  ["SKIN TONE", "Fair, Olive, Dark"],
  ["MAKEUP", "Light, Heavy, None"],
  ["BODY MARKINGS", "Scars, tattoos, birthmarks, piercings"],
  ["TEMPORARY CONDITIONS", "Injuries, illness, etc."],
];

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
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
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 20, height: 20 }}>
      <rect
        x="4"
        y="11"
        width="16"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 11V7a4 4 0 0 1 8 0v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const TestAMockup: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(([label, val]) => [label, val]))
  );

  const updateValue = (label: string, val: string) =>
    setValues((prev) => ({ ...prev, [label]: val }));

  return (
    <section style={styles.card}>
      <header style={styles.header}>
        <h2 style={styles.title}>Physical Appearance</h2>
        <p style={styles.subtitle}>Swap in new attributes while preserving the base shadcn card style.</p>
      </header>

      <div style={styles.content}>
        {FIELDS.map(([label]) => (
          <div key={label} style={styles.row}>
            <div style={styles.labelBox}>{label}</div>
            <button type="button" style={styles.iconButton} aria-label={`Enhance ${label}`}>
              <SparklesIcon />
            </button>
            <input
              type="text"
              value={values[label] ?? ""}
              onChange={(e) => updateValue(label, e.target.value)}
              style={styles.valueInput}
            />
            <button type="button" style={styles.iconButton} aria-label={`Lock ${label}`}>
              <LockIcon />
            </button>
          </div>
        ))}
      </div>

      <footer style={styles.footer}>
        <button type="button" style={styles.addButton}>
          <PlusIcon />
          Add Row
        </button>
      </footer>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: "100%",
    maxWidth: 1120,
    border: "1px solid #2f3440",
    borderRadius: 20,
    background: "#15181e",
    boxShadow: "0 18px 36px rgba(0,0,0,0.34)",
    overflow: "hidden",
    color: "#eceff5",
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
  },
  header: {
    padding: "32px 38px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: {
    margin: 0,
    fontSize: 54,
    lineHeight: 1.04,
    letterSpacing: "-0.02em",
    fontWeight: 700,
  },
  subtitle: {
    margin: "14px 0 0",
    color: "#a3a9b5",
    fontSize: 26,
    lineHeight: 1.35,
    maxWidth: 980,
  },
  content: {
    padding: "22px 38px 20px",
    display: "grid",
    gap: 12,
    maxHeight: 780,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 360px) 24px minmax(0, 1fr) 24px",
    alignItems: "center",
    gap: 14,
  },
  labelBox: {
    height: 52,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#232730",
    display: "flex",
    alignItems: "center",
    padding: "0 26px",
    fontSize: 18,
    letterSpacing: "0.12em",
    fontWeight: 700,
    color: "#eef2f7",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  valueInput: {
    height: 52,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#232730",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    color: "#a7adb8",
    fontSize: 16,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  iconButton: {
    width: 24,
    height: 24,
    border: 0,
    borderRadius: 8,
    background: "transparent",
    color: "#9da5b5",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    cursor: "pointer",
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "18px 38px 26px",
  },
  addButton: {
    width: "100%",
    minHeight: 58,
    borderRadius: 14,
    border: "1px dashed rgba(166,175,188,0.55)",
    background: "transparent",
    color: "#c0c8d5",
    fontSize: 32,
    lineHeight: 1.08,
    letterSpacing: "-0.005em",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    cursor: "pointer",
  },
};
