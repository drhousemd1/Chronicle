import React, { useEffect, useRef, useState, useCallback } from 'react';

const SECTIONS = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Form Inputs' },
  { id: 'badges', label: 'Badges & Tags' },
  { id: 'panels', label: 'Panels' },
  { id: 'modals', label: 'Modals' },
  { id: 'icons', label: 'Icons' },
] as const;

/* ─── inline style constants matching the HTML mockup ─── */
const sg = {
  primary: '#4a5f7f',
  bg: '#f3f4f6',
  surface: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#d9dee6',
  borderStrong: '#c6ced9',
  dark: '#2a2a2f',
  shadow: '0 8px 24px rgba(15,23,42,0.08)',
  shadowHover: '0 12px 32px rgba(15,23,42,0.12)',
} as const;

/* ═══════════════════════ PAGE SUBHEADING ═══════════════════════ */
const PageSubheading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    display: 'block', margin: '22px 0 10px', padding: '8px 14px', borderRadius: 6,
    background: 'linear-gradient(90deg, #2d2d2d 0%, #646973 65%, rgba(100,105,115,0) 100%)',
    color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase',
  }}>{children}</div>
);

const PageDesc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontSize: 12, color: sg.muted, marginBottom: 16 }}>{children}</p>
);

/* ═══════════════════════ SWATCH CARD ═══════════════════════ */
interface SwatchProps {
  color: string;
  name: string;
  rows: { label: string; value: string; isLocation?: boolean }[];
  extraPreviewStyle?: React.CSSProperties;
}

const SwatchCard: React.FC<SwatchProps> = ({ color, name, rows, extraPreviewStyle }) => (
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadowHover; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadow; }}
  >
    <div style={{ height: 78, background: color, ...extraPreviewStyle }} />
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 8, alignItems: 'start', fontSize: 11 }}>
            <span style={{ textTransform: 'uppercase', fontSize: 9, fontWeight: 700, letterSpacing: '0.6px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span style={{
              fontSize: 11, color: r.isLocation ? '#475569' : '#334155',
              fontFamily: r.isLocation ? 'Inter, system-ui, sans-serif' : "'SF Mono','Fira Code','JetBrains Mono',monospace",
            }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════ TYPOGRAPHY TILE ═══════════════════════ */
interface TypeTileProps {
  name: string;
  exampleBg?: string;
  exampleContent: React.ReactNode;
  specs: string[];
  locations: string;
}

const TypeTile: React.FC<TypeTileProps> = ({ name, exampleBg, exampleContent, specs, locations }) => (
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, display: 'flex', flexDirection: 'column', height: '100%',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: '#f8fafc' }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase', color: '#111827' }}>{name}</span>
    </div>
    <div style={{ padding: 14, display: 'grid', gridTemplateRows: 'auto auto minmax(86px,1fr)', gap: 10, flex: 1, minHeight: 0 }}>
      <TileRow label="Example:">
        <div style={{
          background: exampleBg || '#fff', borderRadius: 8, padding: '12px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 14, minHeight: 48,
        }}>{exampleContent}</div>
      </TileRow>
      <TileRow label="Specs:">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: 12, color: '#334155', fontFamily: "'SF Mono','Fira Code','JetBrains Mono',monospace" }}>
          {specs.map((s, i) => <span key={i}>{s}</span>)}
        </div>
      </TileRow>
      <TileRow label="Locations used:" style={{ alignItems: 'start' }}>
        <div style={{ fontSize: 12, color: sg.muted, lineHeight: 1.6, maxHeight: '100%', overflow: 'auto' }}>{locations}</div>
      </TileRow>
    </div>
  </div>
);

const TileRow: React.FC<{ label: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ label, children, style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr)', alignItems: 'center', gap: 12, ...style }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#94a3b8' }}>{label}</span>
    {children}
  </div>
);

/* ═══════════════════════ ENTRY CARD (buttons, inputs, etc.) ═══════════════════════ */
interface EntryCardProps {
  name: string;
  pageTag: string;
  specs: string;
  preview: React.ReactNode;
  code: string;
  previewDark?: boolean;
  previewPlain?: boolean;
  previewStyle?: React.CSSProperties;
}

const EntryCard: React.FC<EntryCardProps> = ({ name, pageTag, specs, preview, code, previewDark, previewPlain, previewStyle }) => (
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, display: 'flex', flexDirection: 'column', height: '100%',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', background: '#f8fafc' }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase', color: '#111827' }}>{name}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 999, fontSize: 9,
        fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#334155', background: '#e2e8f0',
      }}>{pageTag}</span>
    </div>
    <div style={{ padding: 14, display: 'grid', gridTemplateRows: 'auto auto minmax(112px,1fr)', gap: 10, flex: 1, minHeight: 0 }}>
      <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: specs }} />
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: previewPlain ? undefined : 'center', gap: 10, padding: previewPlain ? 0 : 14,
        borderRadius: 8, background: previewPlain ? 'transparent' : previewDark ? '#25272d' : '#f8fafc',
        minHeight: 72, ...previewStyle,
      }}>{preview}</div>
      <div style={{
        fontFamily: "'SF Mono','Fira Code','JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.6,
        color: '#334155', whiteSpace: 'pre-wrap', background: '#f1f5f9', borderRadius: 8, padding: 12,
        minHeight: 112, overflow: 'auto',
      }}>{code}</div>
    </div>
  </div>
);

/* ═══════════════════════ DIVIDER ═══════════════════════ */
const Divider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <hr style={{ border: 'none', height: 1, background: sg.border, margin: '52px 0', ...style }} />
);

/* ═══════════════════════ INCONSISTENCY NOTE ═══════════════════════ */
const InconsistencyNote: React.FC<{ items: { file: string; note: string }[] }> = ({ items }) => (
  <div style={{
    marginTop: 10, padding: '12px 14px', borderRadius: 8,
    background: '#fffbeb', border: '1px solid #fcd34d',
    fontSize: 11, lineHeight: 1.7, color: '#92400e',
  }}>
    <div style={{ fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, color: '#b45309' }}>
      ⚠ Inconsistencies Found
    </div>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', marginBottom: 2 }}>
        <span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontWeight: 700, fontSize: 10, color: '#b45309', whiteSpace: 'nowrap' }}>{item.file}</span>
        <span>{item.note}</span>
      </div>
    ))}
  </div>
);

/* ═══════════════════════ SECTION WRAPPER ═══════════════════════ */
const Section: React.FC<{ id: string; title: string; desc: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, title, desc, children, style }) => (
  <section id={`sg-${id}`} style={{ marginBottom: 64, scrollMarginTop: 96, ...style }}>
    <div style={{ marginBottom: 10 }}>
      <h2 style={{
        display: 'inline-block', fontSize: 'clamp(34px,5vw,46px)', fontWeight: 900, letterSpacing: '-0.04em',
        color: '#111827', borderBottom: '4px solid #111827', paddingBottom: 4,
      }}>{title}</h2>
    </div>
    <p style={{ fontSize: 13, color: sg.muted, maxWidth: 900, marginBottom: 22 }}>{desc}</p>
    {children}
  </section>
);

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export const StyleGuideTool: React.FC = () => {
  const [activeSection, setActiveSection] = useState('colors');
  const contentRef = useRef<HTMLDivElement>(null);
  const isNarrow = useMediaQuery('(max-width: 1024px)');
  const isMedium = useMediaQuery('(max-width: 1100px)');

  // scroll-spy
  useEffect(() => {
    const container = contentRef.current?.parentElement;
    if (!container) return;
    const handler = () => {
      const sections = SECTIONS.map(s => document.getElementById(`sg-${s.id}`)).filter(Boolean) as HTMLElement[];
      let current = 'colors';
      for (const sec of sections) {
        if (sec.getBoundingClientRect().top <= 140) current = sec.id.replace('sg-', '');
      }
      setActiveSection(current);
    };
    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(`sg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMedium ? '1fr' : 'repeat(2,minmax(0,1fr))', gap: 16, alignItems: 'stretch' };
  const fullSpan: React.CSSProperties = isMedium ? {} : { gridColumn: '1 / -1' };

  return (
    <div style={{ display: 'flex', flexDirection: isNarrow ? 'column' : 'row', height: '100%', background: sg.bg, fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif", color: sg.text, lineHeight: 1.5, overflow: 'hidden' }}>
      {/* ─── SIDEBAR / NAV ─── */}
      {isNarrow ? (
        <nav style={{
          position: 'sticky', top: 0, zIndex: 90, display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 14px', background: sg.surface, borderBottom: `1px solid ${sg.border}`,
          boxShadow: '0 2px 8px rgba(15,23,42,0.05)', overflowX: 'auto', overflowY: 'hidden',
        }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: 12, fontWeight: 600, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeSection === s.id ? 'rgba(74,95,127,0.12)' : 'transparent',
              color: activeSection === s.id ? sg.primary : '#475569',
              boxShadow: activeSection === s.id ? 'inset 0 0 0 1px rgba(74,95,127,0.18)' : 'none',
              transition: 'all 0.2s ease',
            }}>{s.label}</button>
          ))}
        </nav>
      ) : (
        <nav style={{
          position: 'sticky', top: 0, width: 260, minWidth: 260, height: '100%', display: 'flex', flexDirection: 'column',
          gap: 6, padding: '108px 14px 24px', background: sg.surface, borderRight: `1px solid ${sg.border}`,
          boxShadow: '2px 0 10px rgba(15,23,42,0.05)', overflowY: 'auto', zIndex: 70,
        }}>
          {/* Title block */}
          <div style={{
            position: 'absolute', top: 24, left: 18, right: 18, whiteSpace: 'pre-line',
            fontSize: 14, fontWeight: 800, lineHeight: 1.2, color: '#111827', padding: 12,
            border: `1px solid ${sg.border}`, borderRadius: 10, background: '#f8fafc',
          }}>{'Chronicle\nStyle Guide'}</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeSection === s.id ? 'rgba(74,95,127,0.12)' : 'transparent',
              color: activeSection === s.id ? sg.primary : '#475569',
              boxShadow: activeSection === s.id ? 'inset 0 0 0 1px rgba(74,95,127,0.18)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: 999, flexShrink: 0,
                background: activeSection === s.id ? sg.primary : '#cbd5e1',
                transition: 'background 0.2s ease',
              }} />
              {s.label}
            </button>
          ))}
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
            Design System v1.0
          </div>
        </nav>
      )}

      {/* ─── MAIN AREA ─── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 60, background: sg.surface, borderBottom: `1px solid ${sg.border}`,
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: isNarrow ? '24px 16px 18px' : '28px 42px 24px',
        }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
            color: '#1e293b', padding: '4px 10px', borderRadius: 999, background: '#e2e8f0', marginBottom: 12,
          }}>Visual Reference</div>
          <h1 style={{ fontSize: 'clamp(30px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', lineHeight: 1.1, marginBottom: 8 }}>
            Chronicle Style Guide
          </h1>
          <p style={{ fontSize: 14, color: '#475569', maxWidth: 980, lineHeight: 1.65 }}>
            Every color, font size, border radius, and spacing value below was extracted from the live Chronicle source code. Use this as the single source of truth for all styling decisions.
          </p>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ padding: isNarrow ? '24px 16px 68px' : '36px 42px 84px', maxWidth: 1400 }}>

          {/* ═══ 1. COLORS ═══ */}
          <Section id="colors" title="Colors" desc="All colors organized by the page they appear on. Every value verified against live source code and CSS custom properties.">
            <PageSubheading>Story Builder Page</PageSubheading>
            <PageDesc>Colors used across the Story Builder / Story Setup interface.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#4a5f7f" name="Chronicle Blue" rows={[{ label: 'Hex', value: '#4a5f7f' }, { label: 'Token', value: 'bg-[#4a5f7f]' }, { label: 'Location', value: 'Panel header bars, MAIN CHARACTERS pill', isLocation: true }]} />
              <SwatchCard color="#2a2a2f" name="Panel Body / Dark Surface" rows={[{ label: 'Hex', value: '#2a2a2f' }, { label: 'Token', value: 'bg-[#2a2a2f]' }, { label: 'Location', value: 'Panel containers, Character Roster sidebar, character cards', isLocation: true }]} />
              <SwatchCard color="#1a1a1a" name="Icon Sidebar" rows={[{ label: 'Hex', value: '#1a1a1a' }, { label: 'Token', value: 'bg-[#1a1a1a]' }, { label: 'Location', value: 'Left icon navigation sidebar (72px wide)', isLocation: true }]} />
              <SwatchCard color="hsl(228, 7%, 20%)" name="Shadow Surface Button BG" rows={[{ label: 'HSL', value: 'hsl(228 7% 20%)' }, { label: 'Token', value: 'bg-[hsl(var(--ui-surface-2))]' }, { label: 'CSS Var', value: '--ui-surface-2: 228 7% 20%' }, { label: 'Location', value: 'DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image, all header action buttons', isLocation: true }]} />
              <SwatchCard color="#ffffff" name="Header Bar" rows={[{ label: 'Hex', value: '#ffffff' }, { label: 'Token', value: 'bg-white' }, { label: 'Location', value: 'Top header bar background (64px height)', isLocation: true }]} />
              <SwatchCard color="rgba(248,250,252,0.3)" name="Content Area Background" rows={[{ label: 'Value', value: 'rgba(248,250,252,0.3)' }, { label: 'Token', value: 'bg-slate-50/30' }, { label: 'Location', value: 'Main content area behind panels', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #ccc' }} />
              <SwatchCard color="#0f172a" name="Slate 900 / Title Text" rows={[{ label: 'Hex', value: '#0f172a' }, { label: 'Computed', value: 'rgb(15, 23, 42)' }, { label: 'Location', value: '"Story Setup" H1, "STORY BUILDER" header title', isLocation: true }]} />
              <SwatchCard color="#64748b" name="Slate 500 / Subtitle" rows={[{ label: 'Hex', value: '#64748b' }, { label: 'Computed', value: 'rgb(100, 116, 139)' }, { label: 'Location', value: '"Configure the foundation of your interactive narrative" subtitle', isLocation: true }]} />
              <SwatchCard color="rgba(24,24,27,0.5)" name="Input Background" rows={[{ label: 'Value', value: 'rgba(24,24,27,0.5)' }, { label: 'Token', value: 'bg-zinc-900/50' }, { label: 'Location', value: 'All text inputs, textareas, bullet-list containers', isLocation: true }]} />
              <SwatchCard color="#3f3f46" name="Zinc 700 / Input Border" rows={[{ label: 'Hex', value: '#3f3f46' }, { label: 'Computed', value: 'rgb(63, 63, 70)' }, { label: 'Location', value: 'Input/textarea borders, tag chip borders', isLocation: true }]} />
              <SwatchCard color="#60a5fa" name="Blue 400 / Link Blue" rows={[{ label: 'Hex', value: '#60a5fa' }, { label: 'Computed', value: 'rgb(96, 165, 250)' }, { label: 'Location', value: '"+ Add Location" links, "+ Add custom" text, active slider labels, SFW badge text', isLocation: true }]} />
              <SwatchCard color="#3b82f6" name="Blue 500 / Checkmark" rows={[{ label: 'Hex', value: '#3b82f6' }, { label: 'Computed', value: 'rgb(59, 130, 246)' }, { label: 'Location', value: 'Art Style selection checkmark badge, guidance box border (at 20% opacity)', isLocation: true }]} />
              <SwatchCard color="#a1a1aa" name="Zinc 400 / Muted Text" rows={[{ label: 'Hex', value: '#a1a1aa' }, { label: 'Computed', value: 'rgb(161, 161, 170)' }, { label: 'Location', value: 'Trash icons, tag chip text, inactive tab text', isLocation: true }]} />
              <SwatchCard color="#71717a" name="Zinc 500 / Dashed Borders" rows={[{ label: 'Hex', value: '#71717a' }, { label: 'Computed', value: 'rgb(113, 113, 122)' }, { label: 'Location', value: 'Dashed "add" button borders, inactive slider labels', isLocation: true }]} />
              <SwatchCard color="#27272a" name="Zinc 800 / Tag Chip BG" rows={[{ label: 'Hex', value: '#27272a' }, { label: 'Computed', value: 'rgb(39, 39, 42)' }, { label: 'Location', value: 'Genre/Origin/Type tag chips, art style card backgrounds, character avatar', isLocation: true }]} />
              <SwatchCard color="hsl(210, 20%, 93%)" name="UI Text Color" rows={[{ label: 'HSL', value: 'hsl(210 20% 93%)' }, { label: 'Token', value: 'text-[hsl(var(--ui-text))]' }, { label: 'CSS Var', value: '--ui-text: 210 20% 93%' }, { label: 'Location', value: 'Text on all Shadow Surface buttons, dark UI panel text', isLocation: true }]} />
              <SwatchCard color="#e2e8f0" name="Slate 200 / Header Border" rows={[{ label: 'Hex', value: '#e2e8f0' }, { label: 'Computed', value: 'rgb(226, 232, 240)' }, { label: 'Location', value: 'Header bar bottom border', isLocation: true }]} />
              <SwatchCard color="rgba(58,58,63,0.3)" name="Guidance Box Surface" rows={[{ label: 'Value', value: 'rgba(58,58,63,0.3)' }, { label: 'Token', value: 'bg-[#3a3a3f]/30' }, { label: 'Location', value: 'Story Arc guidance description box, border: blue-500/20', isLocation: true }]} extraPreviewStyle={{ border: '1px solid rgba(59,130,246,0.2)' }} />
              <SwatchCard color="#d4d4d8" name="Zinc 300 / Body Text" rows={[{ label: 'Hex', value: '#d4d4d8' }, { label: 'Computed', value: 'rgb(212, 212, 216)' }, { label: 'Location', value: 'Bullet list text in World Codex Dialog Formatting', isLocation: true }]} />
              <SwatchCard color="rgba(255,255,255,0.1)" name="White / 10% — Subtle Border" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.1)' }, { label: 'Token', value: 'border-white/10' }, { label: 'Location', value: 'Button borders, panel outer borders, character card borders', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(255,255,255,0.2)" name="White / 20% — Panel Header Border" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.2)' }, { label: 'Token', value: 'border-white/20' }, { label: 'Location', value: 'Panel header bar bottom border (below #4a5f7f bar)', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>

            <Divider />

            <PageSubheading>My Stories Page</PageSubheading>
            <PageDesc>Colors used on the My Stories gallery/card grid.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="rgba(248,250,252,0.5)" name="Page Background" rows={[{ label: 'Value', value: 'rgba(248,250,252,0.5)' }, { label: 'Token', value: 'bg-slate-50/50' }, { label: 'Location', value: 'Full page background', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #ccc' }} />
              <SwatchCard color="#4a5f7f" name="Active Tab Pill / Card Border" rows={[{ label: 'Hex', value: '#4a5f7f' }, { label: 'Computed', value: 'rgb(74, 95, 127)' }, { label: 'Location', value: 'Active tab pill bg, story card border (1px solid)', isLocation: true }]} />
              <SwatchCard color="#020617" name="Slate 950 / Card Gradient Bottom" rows={[{ label: 'Hex', value: '#020617' }, { label: 'Computed', value: 'rgb(2, 6, 23)' }, { label: 'Location', value: 'Story card gradient bottom: linear-gradient(to top, #020617, slate-900/60, transparent)', isLocation: true }]} />
              <SwatchCard color="#2a2a2f" name="Badge Background" rows={[{ label: 'Hex', value: '#2a2a2f' }, { label: 'Computed', value: 'rgb(42, 42, 47)' }, { label: 'Location', value: 'SFW/NSFW badge backgrounds on story cards', isLocation: true }]} />
              <SwatchCard color="#f87171" name="Red 400 / NSFW Badge" rows={[{ label: 'Hex', value: '#f87171' }, { label: 'Computed', value: 'rgb(248, 113, 113)' }, { label: 'Location', value: 'NSFW badge text color', isLocation: true }]} />
              <SwatchCard color="#ef4444" name="Red 500 / Delete Button" rows={[{ label: 'Hex', value: '#ef4444' }, { label: 'Token', value: 'bg-[hsl(var(--destructive))]' }, { label: 'Location', value: 'Delete button background on card hover', isLocation: true }]} />
              <SwatchCard color="#2563eb" name="Blue 600 / Play Button" rows={[{ label: 'Hex', value: '#2563eb' }, { label: 'Computed', value: 'rgb(37, 99, 235)' }, { label: 'Location', value: 'Play button background on card hover', isLocation: true }]} />
              <SwatchCard color="#52525b" name="Zinc 600 / Create Card Border" rows={[{ label: 'Hex', value: '#52525b' }, { label: 'Computed', value: 'rgb(82, 82, 91)' }, { label: 'Location', value: '"Create New Story" dashed card border (2px dashed)', isLocation: true }]} />
              <SwatchCard color="rgba(255,255,255,0.6)" name="White / 60% — Description Text" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.6)' }, { label: 'Location', value: 'Story card description text', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(255,255,255,0.5)" name="White / 50% — Metadata Text" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.5)' }, { label: 'Location', value: '"Created by" text, stat numbers on story cards', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(0,0,0,0.5)" name="Card Shadow" rows={[{ label: 'Value', value: 'rgba(0,0,0,0.5)' }, { label: 'Full', value: '0px 12px 32px -2px' }, { label: 'Location', value: 'Story card and panel box-shadow', isLocation: true }]} />
            </div>
          </Section>

          <Divider />

          {/* ═══ 2. TYPOGRAPHY ═══ */}
          <Section id="typography" title="Typography" desc="Font sizes, weights, and letter-spacing values extracted from source code. Each tile shows a rendered example, exact specs, and where the style is used." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>

            <TypeTile name="Page Title (White header bar)" exampleBg="#fff"
              exampleContent={<span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.45px', textTransform: 'uppercase' }}>STORY BUILDER</span>}
              specs={['18px', 'weight 900', '-0.45px tracking', '#0f172a (slate-900)', 'uppercase']}
              locations='Top-left of the white header bar on every page — "STORY BUILDER", "ACCOUNT", "MY STORIES". Always uppercase, always next to the back arrow. Sits on white bg-white header bar.'
            />
            <TypeTile name="Section Title (Content area)" exampleBg="#fff"
              exampleContent={<span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.9px' }}>Story Setup</span>}
              specs={['36px', 'weight 900', '-0.9px tracking', '#0f172a (slate-900)']}
              locations="Large heading at top of the content area on Story Builder page. Dark text on the light bg-slate-50/30 background."
            />
            <TypeTile name="Section Subtitle (Content area)" exampleBg="#fff"
              exampleContent={<span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>Configure the foundation of your interactive narrative.</span>}
              specs={['14px', 'weight 500', 'normal tracking', '#64748b (slate-500)']}
              locations='"Below the "Story Setup" heading. Muted descriptive text.'
            />
            <TypeTile name="Panel Header Title (Blue bar)" exampleBg="#4a5f7f"
              exampleContent={<span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Story Card</span>}
              specs={['text-xl (20px)', 'font-bold (700)', 'tracking-tight (-0.5px)', 'text-white']}
              locations='Inside the bg-[#4a5f7f] panel header bars — "Story Card", "World Core", "Story Arcs", "Opening Dialog", "Art Style Preference", "World Codex", "Content Themes", "Share Your Story".'
            />
            <TypeTile name="Field Labels (Inside panels)" exampleBg="#2a2a2f"
              exampleContent={<>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>STORY NAME</span>
                <span style={{ marginLeft: 24, fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>BRIEF DESCRIPTION</span>
                <span style={{ marginLeft: 24, fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>GENRE</span>
              </>}
              specs={['text-[10px]', 'font-bold (700)', 'tracking-wider (0.05em)', 'uppercase', 'text-white']}
              locations="All form field labels inside dark panels — STORY NAME, BRIEF DESCRIPTION, STORY PREMISE, PRIMARY LOCATIONS, STORY ARC TITLE, DESIRED OUTCOME, GUIDANCE STRENGTH, OPENING DIALOG, CHARACTER TYPES, GENRE, ORIGIN, etc."
            />
            <TypeTile name="Button Text (Shadow Surface)" exampleBg="hsl(228, 7%, 20%)"
              exampleContent={<span style={{ fontSize: 10, fontWeight: 700, color: 'hsl(210, 20%, 93%)', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>SAVE AND CLOSE</span>}
              specs={['text-[10px]', 'font-bold (700)', 'tracking-wider (0.05em)', 'uppercase', 'leading-none', 'text-[hsl(var(--ui-text))]']}
              locations='All Shadow Surface action buttons — DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image, Publish to Gallery. Uses --ui-text token.'
            />
            <TypeTile name="Character Name (Roster sidebar)" exampleBg="#2a2a2f"
              exampleContent={<span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>ASHLEY</span>}
              specs={['14px', 'font-bold (700)', 'normal tracking', 'text-white']}
              locations="Character names in the left Character Roster sidebar panel on Story Builder."
            />
            <TypeTile name="Add Link Text (Blue interactive)" exampleBg="#2a2a2f"
              exampleContent={<span style={{ fontSize: 14, fontWeight: 400, color: '#60a5fa' }}>+ Add Location</span>}
              specs={['14px', 'weight 400', 'normal tracking', '#60a5fa (blue-400)']}
              locations='"+ Add Location" links in World Core panel. Blue interactive text elements.'
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>My Stories Page</PageSubheading></div>

            <TypeTile name="Page Title (White header bar)" exampleBg="#fff"
              exampleContent={<span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.45px', textTransform: 'uppercase' }}>MY STORIES</span>}
              specs={['18px', 'weight 900', '-0.45px tracking', '#0f172a (slate-900)', 'uppercase']}
              locations='Top-left of the white header bar. Same style as "STORY BUILDER" — shared across all pages.'
            />
            <TypeTile name="Story Card Title (On card overlay)" exampleBg="linear-gradient(to top, #020617, rgba(15,23,42,0.6))"
              exampleContent={<span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.45px' }}>Acotar</span>}
              specs={['18px', 'weight 900', '-0.45px tracking', 'text-white']}
              locations="Story name on the card overlay gradient. H3 element. White text on the dark gradient bottom of each card."
            />
            <TypeTile name="Story Card Description" exampleBg="#2a2a2f"
              exampleContent={<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>A romantic fantasy adventure in the fae lands...</span>}
              specs={['12px', 'weight 400', 'normal tracking', 'rgba(255,255,255,0.6)']}
              locations="Story description text below the title on each card."
            />
            <TypeTile name='Card Metadata ("Created by" / Stats)' exampleBg="#2a2a2f"
              exampleContent={<>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Created by: ThomasH</span>
                <span style={{ marginLeft: 16, fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>12 chapters · 3.2k words</span>
              </>}
              specs={['"Created by": 11px / 500', 'Stats: 10px / 400', 'rgba(255,255,255,0.5)']}
              locations='"Created by" line and stat numbers at the bottom of each story card.'
            />
            <TypeTile name="Tab Pill Text (Active / Inactive)" exampleBg="#fff"
              exampleContent={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#4a5f7f', borderRadius: 9999, padding: '6px 16px' }}>My Stories</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa' }}>Community</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa' }}>Favorites</span>
                </div>
              }
              specs={['12px', 'font-bold (700)', 'Active: #fff on #4a5f7f', 'Inactive: #a1a1aa']}
              locations="Navigation tabs below the header bar on My Stories page. Active pill has rounded-full bg, inactive is text only."
            />
          </Section>

          <Divider />

          {/* ═══ 3. BUTTONS ═══ */}
          <Section id="buttons" title="Buttons" desc="All button styles found across Story Builder and My Stories pages. Verified against source code." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>
            <div style={fullSpan}><PageDesc>Button styles used in the Story Builder workflow.</PageDesc></div>

            <EntryCard name="Shadow Surface Button (Header Actions)" pageTag="Story Builder"
              specs='<strong>bg:</strong> hsl(var(--ui-surface-2)) · <strong>color:</strong> hsl(var(--ui-text)) · <strong>text-[10px] / font-bold / uppercase / tracking-wider / leading-none</strong> · <strong>border:</strong> 1px solid hsl(var(--ui-border)) · <strong>border-radius:</strong> rounded-xl (12px) · <strong>height:</strong> h-10 (40px) · <strong>padding:</strong> px-6 · <strong>shadow:</strong> 0 10px 30px rgba(0,0,0,0.35)'
              preview={<>
                <button className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold leading-none uppercase tracking-wider" style={{ cursor: 'default' }}>DRAFTS</button>
                <button className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold leading-none uppercase tracking-wider" style={{ cursor: 'default' }}>SAVE AND CLOSE</button>
                <button className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold leading-none uppercase tracking-wider" style={{ cursor: 'default' }}>SAVE DRAFT</button>
              </>}
              code={`/* Shadow Surface — canonical header action button */
className="inline-flex items-center justify-center
  h-10 px-6 rounded-xl
  border border-[hsl(var(--ui-border))]
  bg-[hsl(var(--ui-surface-2))]
  text-[hsl(var(--ui-text))]
  shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-[10px] font-bold leading-none uppercase tracking-wider
  hover:brightness-125 active:brightness-150
  transition-all active:scale-95"

/* CSS custom properties (from index.css): */
--ui-surface-2: 228 7% 20%;        /* ≈ #2a2b30 */
--ui-border: 0 0% 100% / 0.10;     /* white at 10% */
--ui-text: 210 20% 93%;            /* ≈ #e5eaf0 */`}
            />
            <EntryCard name="AI Generate Button" pageTag="Story Builder"
              specs="<strong>bg:</strong> gradient (purple) · <strong>color:</strong> white · <strong>text-[10px] / font-bold / uppercase</strong> · <strong>border-radius:</strong> rounded-xl (12px) · <strong>height:</strong> h-10 (40px)"
              preview={
                <button style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', color: '#fff', height: 40, padding: '0 22px', borderRadius: 12, border: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, cursor: 'default', fontFamily: 'inherit' }}>AI GENERATE</button>
              }
              code={`background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
color: #fff;
font-size: 10px; font-weight: 700;
text-transform: uppercase; letter-spacing: 0.05em;
border-radius: 12px; height: 40px; line-height: 1;`}
            />
            <EntryCard name='Dashed "Add" Buttons' pageTag="Story Builder"
              specs='<strong>border:</strong> 2px dashed #71717a · <strong>color:</strong> #60a5fa · <strong>14px / 500</strong> · <strong>border-radius:</strong> 12px · <strong>bg:</strong> transparent · Full-width'
              previewPlain
              previewStyle={{ flexDirection: 'column' }}
              preview={
                <button style={{ width: '100%', minHeight: 64, padding: '12px 18px', borderRadius: 12, border: '2px dashed #71717a', background: 'transparent', color: '#60a5fa', fontSize: 14, fontWeight: 500, cursor: 'default', fontFamily: 'inherit' }}>+ Add Custom Content</button>
              }
              code={`background: transparent; color: #60a5fa;  /* blue-400 */
font-size: 14px; font-weight: 500;
border: 2px dashed #71717a;  /* zinc-500 */
border-radius: 12px; width: 100%;
/* Hover: */
border-color: #60a5fa; background: rgba(96,165,250,0.12);`}
            />

            <div style={fullSpan}><PageSubheading>My Stories Page</PageSubheading></div>
            <div style={fullSpan}><PageDesc>Button styles used on the My Stories gallery and card interactions.</PageDesc></div>

            <EntryCard name="Card Hover Buttons — Edit / Delete / Play" pageTag="My Stories"
              specs='Compact card variant: <strong>h-8 px-4 rounded-xl</strong> · <strong>text-[10px] font-bold leading-none uppercase tracking-wider</strong>. Edit: bg-white text-slate-900. Delete: bg-[hsl(var(--destructive))]. Play: bg-blue-600.'
              preview={<>
                <button className="h-8 px-4 rounded-xl bg-white text-slate-900 text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>EDIT</button>
                <button className="h-8 px-4 rounded-xl bg-[hsl(var(--destructive))] text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>DELETE</button>
                <button className="h-8 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>PLAY</button>
              </>}
              code={`/* Card hover buttons (compact h-8 variant) */
/* Edit */   className="h-8 px-4 rounded-xl bg-white text-slate-900
               text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl"
/* Delete */ className="h-8 px-4 rounded-xl bg-[hsl(var(--destructive))] text-white
               text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl"
/* Play */   className="h-8 px-4 rounded-xl bg-blue-600 text-white
               text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl"

/* Source: StoryHub.tsx lines 82-97 */`}
            />
            <EntryCard name="Tab Pills — Active / Inactive" pageTag="My Stories"
              specs="<strong>Active:</strong> bg #4a5f7f, white text, rounded-full · <strong>Inactive:</strong> transparent, #a1a1aa text · Both 12px / 700"
              preview={<>
                <button style={{ background: '#4a5f7f', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'default', fontFamily: 'inherit' }}>My Stories</button>
                <button style={{ background: 'transparent', color: '#a1a1aa', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'default', fontFamily: 'inherit' }}>Community</button>
                <button style={{ background: 'transparent', color: '#a1a1aa', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'default', fontFamily: 'inherit' }}>Favorites</button>
              </>}
              code={`/* Active */   bg: #4a5f7f; color: #fff; border-radius: 9999px; padding: 6px 16px;
/* Inactive */ bg: transparent; color: #a1a1aa;  /* zinc-400 */
/* Both */     font-size: 12px; font-weight: 700;`}
            />
          </Section>

          <Divider />

          {/* ═══ 4. FORM INPUTS ═══ */}
          <Section id="inputs" title="Form Inputs" desc="Input fields and textareas used throughout Story Builder panels.">
            <PageSubheading>Story Builder Page</PageSubheading>
            <PageDesc>Form controls used within Story Builder panels.</PageDesc>
            <EntryCard name="Text Input / Textarea" pageTag="Story Builder"
              specs="<strong>bg:</strong> rgba(24,24,27,0.5) · <strong>color:</strong> white · <strong>border:</strong> 1px solid #3f3f46 · <strong>border-radius:</strong> rounded-lg (8px) · <strong>padding:</strong> 8px 12px · <strong>font-size:</strong> 14px"
              previewDark
              previewStyle={{ flexDirection: 'column', gap: 12 }}
              preview={<>
                <input readOnly className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 text-white text-sm px-3 py-2 outline-none" placeholder="Enter story arc title..." />
                <input readOnly className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 text-white text-sm px-3 py-2 outline-none" placeholder="e.g. The Lakehouse" />
              </>}
              code={`className="w-full rounded-lg border border-zinc-700
  bg-zinc-900/50 text-white text-sm px-3 py-2"

/* Resolved values: */
background: rgba(24, 24, 27, 0.5);  /* bg-zinc-900/50 */
color: #fff;
font-size: 14px;  /* text-sm = 0.875rem but rendered ~14px */
border: 1px solid #3f3f46;  /* border-zinc-700 */
border-radius: 8px;  /* rounded-lg */
padding: 8px 12px;  /* py-2 px-3 */`}
            />
          </Section>

          <Divider />

          {/* ═══ 5. BADGES & TAGS ═══ */}
          <Section id="badges" title="Badges & Tags" desc="Badges on story cards and tag chips in Content Themes.">
            <PageSubheading>Story Builder Page</PageSubheading>
            <PageDesc>Tag and chip styles used in Story Builder content setup.</PageDesc>
            <EntryCard name="Content Theme Tag Chips" pageTag="Story Builder"
              specs='<strong>bg:</strong> #27272a · <strong>color:</strong> #a1a1aa · <strong>border:</strong> 1px solid #3f3f46 · <strong>12px / 500</strong> · <strong>border-radius:</strong> 8px · <strong>padding:</strong> 6px 12px'
              previewPlain
              previewStyle={{ gap: 8 }}
              preview={<>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Fantasy</span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Romance</span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Dark Romance</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1, background: 'transparent', border: '2px dashed #71717a', color: '#60a5fa', fontWeight: 500 }}>+ Add custom</span>
              </>}
              code={`/* Tag chip */
className="inline-flex items-center px-3 py-1.5
  rounded-lg text-xs font-medium
  bg-zinc-800 border border-zinc-700 text-zinc-400"

/* "+ Add custom" chip */
background: transparent; color: #60a5fa;
border: 2px dashed #71717a;  /* zinc-500 */`}
            />

            <div style={{ marginTop: 24 }}>
              <PageSubheading>My Stories Page</PageSubheading>
              <PageDesc>Badge styles used on My Stories cards.</PageDesc>
              <EntryCard name="SFW / NSFW Badges" pageTag="My Stories"
                specs='<strong>bg:</strong> #2a2a2f · <strong>12px / 700</strong> · <strong>border-radius:</strong> rounded-lg (8px) · <strong>padding:</strong> px-2.5 py-1 · SFW = <strong>blue-400</strong>, NSFW = <strong>red-400</strong>'
                previewPlain
                preview={<>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2a2a2f] text-blue-400">SFW</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2a2a2f] text-red-400">NSFW</span>
                </>}
                code={`className="inline-flex items-center px-2.5 py-1
  rounded-lg text-xs font-bold bg-[#2a2a2f]"

/* SFW */  text-blue-400   /* #60a5fa */
/* NSFW */ text-red-400    /* #f87171 */

/* Source: GalleryStoryCard.tsx, StoryHub.tsx */`}
              />
            </div>
          </Section>

          <Divider />

          {/* ═══ 6. PANELS ═══ */}
          <Section id="panels" title="Panels" desc="The dark rounded panel containers used in Story Builder for each section (Story Card, World Core, Story Arcs, etc.).">
            <PageSubheading>Story Builder Page</PageSubheading>
            <PageDesc>Panel shell and structure patterns used across Story Builder.</PageDesc>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Panel Container" pageTag="Story Builder"
                specs="<strong>bg:</strong> #2a2a2f · <strong>border-radius:</strong> rounded-[24px] · <strong>border:</strong> border-white/10 · <strong>box-shadow:</strong> 0 12px 32px -2px rgba(0,0,0,0.5)"
                preview={<div className="w-full h-20 bg-[#2a2a2f] rounded-[24px] border border-white/10" style={{ boxShadow: 'rgba(0,0,0,0.5) 0px 12px 32px -2px' }} />}
                previewPlain
                code={`className="bg-[#2a2a2f] rounded-[24px] border border-white/10"
style={{ boxShadow: 'rgba(0,0,0,0.5) 0px 12px 32px -2px' }}

/* Resolved: */
background: #2a2a2f;
border-radius: 24px;
border: 1px solid rgba(255,255,255,0.1);
box-shadow: rgba(0,0,0,0.5) 0px 12px 32px -2px;

/* Source: StoryCardView.tsx line 22 */`}
              />

              <EntryCard name="Panel Header Bar" pageTag="Story Builder"
                specs="<strong>bg:</strong> #4a5f7f · <strong>padding:</strong> px-5 py-3 · <strong>border-bottom:</strong> border-white/20 · <strong>shadow-lg</strong> · Contains H2 title (text-xl font-bold tracking-tight text-white) and icon"
                preview={
                  <div className="w-full bg-[#4a5f7f] rounded-xl px-5 py-3 flex items-center gap-3 border-b border-white/20 shadow-lg">
                    <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-sm">⚙</div>
                    <span className="text-white text-xl font-bold tracking-tight">Story Card</span>
                  </div>
                }
                previewPlain
                code={`className="bg-[#4a5f7f] px-5 py-3 flex items-center gap-3
  border-b border-white/20 shadow-lg"

/* Title: */
className="text-white text-xl font-bold tracking-tight"

/* Source: StoryCardView.tsx panel headers */`}
              />

              <EntryCard name="Character Roster Sidebar" pageTag="Story Builder"
                specs='<strong>bg:</strong> #2a2a2f · <strong>width:</strong> 260px · <strong>border-right:</strong> border-white/10 · Contains section pills (<code>bg-[#4a5f7f]</code>) and character cards'
                preview={null}
                previewPlain
                code={`width: 260px;
background: #2a2a2f;  /* bg-[#2a2a2f] */
border-right: 1px solid rgba(255,255,255,0.1);
/* "MAIN CHARACTERS" pill inside: */
background: #4a5f7f; border-radius: 8px; padding: 8px 16px;
color: white; font-size: 12px; font-weight: 700; text-transform: uppercase;`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>My Stories Page</PageSubheading>
              <PageDesc>Card container styling used in the My Stories gallery grid.</PageDesc>
              <EntryCard name="Story Card (My Stories Grid)" pageTag="My Stories"
                specs='<strong>aspect-ratio:</strong> 2/3 · <strong>border-radius:</strong> rounded-[2rem] (32px) · <strong>border:</strong> 1px solid #4a5f7f · <strong>shadow:</strong> 0 12px 32px -2px rgba(0,0,0,0.5) · <strong>gradient overlay:</strong> linear-gradient(to top, #020617, slate-900/60, transparent)'
                preview={
                  <div className="relative overflow-hidden rounded-[2rem] border border-[#4a5f7f]" style={{ width: 120, aspectRatio: '2/3', boxShadow: '0 12px 32px -2px rgba(0,0,0,0.5)' }}>
                    <div className="absolute inset-0 bg-slate-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-white text-xs font-bold">Story Title</div>
                      <div className="text-white/60 text-[9px] mt-0.5">Description text...</div>
                    </div>
                  </div>
                }
                previewPlain
                code={`className="aspect-[2/3] w-full overflow-hidden rounded-[2rem]
  bg-slate-200 border border-[#4a5f7f]
  !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]"

/* Gradient overlay: */
className="bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"

/* Source: StoryHub.tsx line 35, GalleryStoryCard.tsx line 65 */`}
              />
            </div>
          </Section>

          <Divider />

          {/* ═══ 7. MODALS ═══ */}
          <Section id="modals" title="Modals" desc="Pop-up modal and dialog container styling extracted from source code. Canonical patterns and inconsistencies documented.">

            <EntryCard name="Modal Backdrop" pageTag="Global"
              specs='<strong>Standard:</strong> Radix DialogOverlay default — <code>bg-black/80</code> (fixed inset-0, z-50). Fade animation via Radix data-state.'
              preview={
                <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #334155 0%, #475569 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94a3b8' }}>App Content Behind</div>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>Modal Content</div>
                </div>
              }
              previewDark
              code={`/* Radix DialogOverlay (default) */
background: rgba(0, 0, 0, 0.80);  /* bg-black/80 */
position: fixed;
inset: 0;
z-index: 50;`}
            />
            <InconsistencyNote items={[
              { file: 'ReviewModal.tsx', note: 'Uses bg-black/90 backdrop-blur-sm instead of standard bg-black/80' },
              { file: 'SceneTagEditorModal.tsx', note: 'Uses raw div with bg-black/85 instead of Radix DialogOverlay' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Modal Container" pageTag="Global"
              specs='<strong>Canonical:</strong> bg-zinc-900 · border: 1px solid rgba(255,255,255,0.1) · border-radius: rounded-lg (8px via Radix) · shadow: 0 10px 30px rgba(0,0,0,0.5) · padding: 0 (content manages own padding) · Close button: Radix default X (top-right) or hidden via [&>button]:hidden'
              preview={
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
                  <div className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-4" style={{ minWidth: 180, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div className="text-xs font-bold text-white mb-1">Standard Modal</div>
                    <div className="text-[10px] text-zinc-400">bg-zinc-900 · border-white/10</div>
                  </div>
                  <div className="flex-1 bg-[#2a2a2f] border border-white/10 rounded-lg p-4" style={{ minWidth: 180, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div className="text-xs font-bold text-white mb-1">Variant (Edit Modals)</div>
                    <div className="text-[10px] text-zinc-400">bg-[#2a2a2f] · border-white/10</div>
                  </div>
                </div>
              }
              code={`/* Canonical container */
className="bg-zinc-900 border border-white/10 rounded-lg"
style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}

/* DeleteConfirmDialog canonical (HSL tokens): */
className="bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)]
  shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)]"

/* Close button: Radix default or hidden with [&>button]:hidden */`}
            />
            <InconsistencyNote items={[
              { file: 'ShareStoryModal, CharacterEditModal', note: 'bg-[#2a2a2f] instead of bg-zinc-900' },
              { file: 'ReviewModal', note: 'bg-[#121214] (darker variant)' },
              { file: 'MemoriesModal', note: 'bg-slate-900 + border-slate-700 instead of zinc-900 + white/10' },
              { file: 'AIPromptModal', note: 'bg-[hsl(var(--ui-surface))] + border-[hsl(var(--ui-border))] (CSS variable tokens)' },
              { file: 'BackgroundPickerModal', note: 'bg-transparent wrapper around Card component' },
              { file: 'FolderEditModal', note: 'border-[#4a5f7f] instead of border-white/10' },
              { file: 'ChangeNameModal + generation modals', note: 'No explicit bg/border — uses Dialog default (light theme)' },
              { file: 'SceneTagEditorModal', note: 'Raw div instead of Dialog component; border-[#4a5f7f]' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Modal Header" pageTag="Global"
              specs='<strong>Pattern A — Simple:</strong> DialogHeader with text-lg font-bold text-white, optional DialogDescription text-sm text-zinc-400. Padding: px-5 pt-5 pb-3.<br/><strong>Pattern B — Banner:</strong> Slate blue bg-[#4a5f7f] full-width header bar for AI/generation modals.'
              preview={
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
                  <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden" style={{ minWidth: 180 }}>
                    <div className="px-4 pt-3 pb-2">
                      <div className="text-sm font-bold text-white">Simple Header</div>
                      <div className="text-xs text-zinc-500 mt-0.5">Optional description text</div>
                    </div>
                  </div>
                  <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden" style={{ minWidth: 180 }}>
                    <div className="bg-[#4a5f7f] px-4 py-2.5">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">Banner Header</div>
                    </div>
                  </div>
                </div>
              }
              code={`/* Pattern A — Simple header */
className="px-5 pt-5 pb-3"
/* Title: */ className="text-lg font-bold text-white"
/* Desc:  */ className="text-sm text-zinc-400"

/* Pattern B — Slate blue banner */
className="bg-[#4a5f7f] -mx-6 -mt-6 px-6 py-4 rounded-t-lg
  border-b border-white/20"
/* Title: */ className="text-white text-lg font-bold"

/* Source: AIPromptModal.tsx line 51 */`}
            />
            <InconsistencyNote items={[
              { file: 'ReviewModal, SidebarThemeModal', note: 'Custom div header with border-b divider instead of DialogHeader' },
              { file: 'CharacterCreation, EnhanceMode, CustomContentType', note: 'Raw <h3> instead of DialogHeader component' },
              { file: 'ChangeNameModal', note: 'Uses DialogTitle text-lg font-bold (no text-white — inherits default)' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Modal Footer / Button Row" pageTag="Global"
              specs='<strong>Canonical — Shadow Surface:</strong> h-10 (40px) · px-6 · rounded-xl (12px) · text-[10px] font-bold uppercase tracking-wider · leading-none.<br/><strong>Standard action:</strong> bg-[hsl(var(--ui-surface-2))].<br/><strong>Cancel:</strong> bg-[hsl(240_6%_18%)].<br/><strong>Destructive:</strong> bg-[hsl(var(--destructive))].<br/><strong>Layout:</strong> flex justify-end gap-2 sm:gap-2.'
              preview={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="h-10 px-6 rounded-xl bg-[hsl(240_6%_18%)] border border-[hsl(var(--ui-border))] text-zinc-300 text-[10px] font-bold uppercase tracking-wider leading-none shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Cancel</button>
                  <button className="h-10 px-6 rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] text-[10px] font-bold uppercase tracking-wider leading-none shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Save</button>
                  <button className="h-10 px-6 rounded-xl bg-[hsl(var(--destructive))] text-white text-[10px] font-bold uppercase tracking-wider leading-none shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Delete</button>
                </div>
              }
              code={`/* Shadow Surface standard button (modal footer) */
className="h-10 px-6 rounded-xl
  bg-[hsl(var(--ui-surface-2))]
  border border-[hsl(var(--ui-border))]
  text-[hsl(var(--ui-text))]
  shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-[10px] font-bold uppercase tracking-wider leading-none"

/* Cancel variant: */
className="... bg-[hsl(240_6%_18%)] text-zinc-300"

/* Destructive variant: */
className="... bg-[hsl(var(--destructive))] text-white border-0"

/* Source: DeleteConfirmDialog.tsx, FolderEditModal.tsx */`}
            />
            <InconsistencyNote items={[
              { file: 'ReviewModal', note: 'h-11 with text-sm font-semibold instead of h-10 text-[10px] uppercase' },
              { file: 'AIPromptModal', note: 'Iridescent layered gradient button — unique one-off design' },
              { file: 'ShareStoryModal, generation modals', note: '<Button> component with variant overrides instead of raw Shadow Surface' },
              { file: 'SceneTagEditorModal', note: 'Raw px-4 py-2 text-sm — completely non-standard' },
              { file: 'DraftsModal inline buttons', note: 'Compact h-8 px-3 text-[10px] (card variant, correct for inline use)' },
              { file: 'ChangeNameModal', note: 'Uses <Button> with hardcoded bg-slate-900/bg-slate-100 — not using design tokens' },
            ]} />
          </Section>

          <Divider />

          {/* ═══ 8. ICONS ═══ */}
          <Section id="icons" title="Icons" desc="Icon sizing, color conventions, and container patterns extracted from source code. All icons use Lucide React.">

            <EntryCard name="Icon Size Scale" pageTag="Global"
              specs='<strong>6 sizes in use.</strong> Default for inline/button icons: w-4 h-4 (16px). Default for modal/panel title icons: w-5 h-5 (20px). Larger sizes reserved for empty states and loading.'
              preview={
                <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
                  {[
                    { size: 12, label: 'w-3', usage: 'Chevrons, compact btns' },
                    { size: 14, label: 'w-3.5', usage: 'Rare (sparkle)' },
                    { size: 16, label: 'w-4', usage: 'Default — buttons, forms' },
                    { size: 20, label: 'w-5', usage: 'Title icons, panels' },
                    { size: 24, label: 'w-6', usage: 'Spinners, close btns' },
                    { size: 32, label: 'w-8', usage: 'Empty states' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: s.size, height: s.size, borderRadius: 3, background: '#6b7280', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', fontFamily: "'SF Mono','Fira Code',monospace" }}>{s.label}</span>
                      <span style={{ fontSize: 9, color: '#64748b', textAlign: 'center', maxWidth: 80 }}>{s.usage}</span>
                    </div>
                  ))}
                </div>
              }
              code={`/* Icon size scale (Lucide className) */
w-3 h-3    →  12px  — Inline indicators, chevrons, compact button icons
w-3.5 h-3.5 → 14px  — Rare usage (AIPromptModal sparkle)
w-4 h-4    →  16px  — DEFAULT: form icons, button icons, dropdown items, action buttons
w-5 h-5    →  20px  — Modal title icons, panel header icons, card action icons
w-6 h-6    →  24px  — Loading spinners, ShareStory title icon, large modal close buttons
w-8 h-8    →  32px  — Empty state placeholder icons (BackgroundPicker)`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Icon Colors" pageTag="Global"
              specs='<strong>Default:</strong> text-white, text-zinc-400. <strong>Accent:</strong> text-blue-400, text-purple-400, text-cyan-200. <strong>Destructive:</strong> text-red-400. <strong>Hover:</strong> hover:text-white, hover:text-red-400. <strong>Disabled:</strong> text-white/40, text-white/20.'
              preview={
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { color: '#ffffff', label: 'text-white', role: 'Default', needsDarkBg: true },
                    { color: '#a1a1aa', label: 'text-zinc-400', role: 'Muted', needsDarkBg: false },
                    { color: '#60a5fa', label: 'text-blue-400', role: 'Accent', needsDarkBg: false },
                    { color: '#c084fc', label: 'text-purple-400', role: 'Accent', needsDarkBg: false },
                    { color: '#a5f3fc', label: 'text-cyan-200', role: 'Accent', needsDarkBg: false },
                    { color: '#f87171', label: 'text-red-400', role: 'Destructive', needsDarkBg: false },
                    { color: 'rgba(255,255,255,0.4)', label: 'text-white/40', role: 'Disabled', needsDarkBg: true },
                  ].map(c => (
                    <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6, background: c.color,
                        border: c.needsDarkBg ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.1)',
                        ...(c.needsDarkBg ? { boxShadow: 'inset 0 0 0 1px #cbd5e1' } : {}),
                      }} />
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#334155', fontFamily: "'SF Mono','Fira Code',monospace" }}>{c.label}</span>
                      <span style={{ fontSize: 8, color: '#64748b' }}>{c.role}</span>
                    </div>
                  ))}
                </div>
              }
              code={`/* Icon color tokens */
/* Default: */     color: #fff;           /* text-white */
/* Muted: */       color: #a1a1aa;        /* text-zinc-400 */
/* Accent: */      color: #60a5fa;        /* text-blue-400 */
                   color: #c084fc;        /* text-purple-400 */
                   color: #a5f3fc;        /* text-cyan-200 */
/* Destructive: */ color: #f87171;        /* text-red-400 */
/* Hover: */       hover: color #fff;     /* hover:text-white */
                   hover: color #f87171;  /* hover:text-red-400 */
/* Disabled: */    color: rgba(255,255,255,0.4);  /* text-white/40 */`}
            />
            <InconsistencyNote items={[
              { file: 'MemoriesModal, ChangeNameModal', note: 'Uses text-slate-400/text-slate-500 instead of text-zinc-400/text-zinc-500 for muted icons' },
              { file: 'Various modals', note: 'Inconsistent use of text-zinc-400 vs text-zinc-500 for same semantic role (secondary/muted)' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Icon Containers" pageTag="Global"
              specs='<strong>4 container patterns:</strong> (1) No container — icon sits directly in header bar. (2) Selection checkmark — w-5 h-5 bg-blue-500 rounded-full with w-3 h-3 check. (3) Option icon — w-10 h-10 rounded-xl bg-{color}-500/20 with w-5 h-5 icon. (4) Action button — h-8 w-8 rounded-xl with centered w-4 h-4 icon.'
              preview={
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* No container */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="w-5 h-5 rounded bg-zinc-400" />
                    <span style={{ fontSize: 8, color: '#64748b' }}>No container</span>
                  </div>
                  {/* Selection checkmark */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-sm bg-white" />
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Checkmark</span>
                  </div>
                  {/* Option icon */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <div className="w-5 h-5 rounded bg-blue-400" />
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Option</span>
                  </div>
                  {/* Action button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="h-8 w-8 rounded-xl bg-zinc-200 flex items-center justify-center">
                      <div className="w-4 h-4 rounded bg-zinc-500" />
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Action btn</span>
                  </div>
                </div>
              }
              code={`/* 1. No container — icon in header bar */
/* Just the icon, no wrapping element */

/* 2. Selection checkmark */
className="w-5 h-5 rounded-full bg-blue-500
  flex items-center justify-center"
/* Inner check: w-3 h-3 */

/* 3. Option icon (CharacterCreation) */
className="w-10 h-10 rounded-xl bg-blue-500/20
  flex items-center justify-center"
/* Inner icon: w-5 h-5 */

/* 4. Action button (gallery cards) */
className="h-8 w-8 rounded-xl"
/* Inner icon: w-4 h-4 */

/* Source: StoryHub.tsx, GalleryStoryCard.tsx, CharacterCreationModal.tsx */`}
            />
          </Section>

        </div>
      </div>
    </div>
  );
};

/* ─── Simple media query hook ─── */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export default StyleGuideTool;
