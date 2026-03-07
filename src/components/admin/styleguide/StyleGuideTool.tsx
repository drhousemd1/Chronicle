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
  darkSoft: '#2f3137',
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
            Every color, font size, border radius, and spacing value below was extracted from the live Chronicle app. Use this as the single source of truth for all styling decisions.
          </p>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ padding: isNarrow ? '24px 16px 68px' : '36px 42px 84px', maxWidth: 1400 }}>

          {/* ═══ 1. COLORS ═══ */}
          <Section id="colors" title="Colors" desc="All colors organized by the page they appear on. Every hex value verified via getComputedStyle() on live DOM elements.">
            <PageSubheading>Story Builder Page</PageSubheading>
            <PageDesc>Colors used across the Story Builder / Story Setup interface.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#4a5f7f" name="Chronicle Blue" rows={[{ label: 'Hex', value: '#4a5f7f' }, { label: 'Token', value: 'bg-[#4a5f7f]' }, { label: 'Location', value: 'Panel header bars, MAIN CHARACTERS pill', isLocation: true }]} />
              <SwatchCard color="#2a2a2f" name="Panel Body / Dark Surface" rows={[{ label: 'Hex', value: '#2a2a2f' }, { label: 'Token', value: 'bg-[#2a2a2f]' }, { label: 'Location', value: 'Panel containers, Character Roster sidebar, character cards', isLocation: true }]} />
              <SwatchCard color="#1a1a1a" name="Icon Sidebar" rows={[{ label: 'Hex', value: '#1a1a1a' }, { label: 'Token', value: 'bg-[#1a1a1a]' }, { label: 'Location', value: 'Left icon navigation sidebar (72px wide)', isLocation: true }]} />
              <SwatchCard color="#2F3137" name="Button Background" rows={[{ label: 'Hex', value: '#2F3137' }, { label: 'Computed', value: 'rgb(47, 49, 55)' }, { label: 'Location', value: 'DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image, Publish to Gallery', isLocation: true }]} />
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
              <SwatchCard color="#eaedf1" name="Button Text Color" rows={[{ label: 'Hex', value: '#eaedf1' }, { label: 'Computed', value: 'rgb(234, 237, 241)' }, { label: 'Location', value: 'Text on all dark action buttons', isLocation: true }]} />
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
              <SwatchCard color="#ef4444" name="Red 500 / Delete Button" rows={[{ label: 'Hex', value: '#ef4444' }, { label: 'Computed', value: 'rgb(239, 68, 68)' }, { label: 'Location', value: 'Delete button background on card hover', isLocation: true }]} />
              <SwatchCard color="#2563eb" name="Blue 600 / Play Button" rows={[{ label: 'Hex', value: '#2563eb' }, { label: 'Computed', value: 'rgb(37, 99, 235)' }, { label: 'Location', value: 'Play button background on card hover', isLocation: true }]} />
              <SwatchCard color="#52525b" name="Zinc 600 / Create Card Border" rows={[{ label: 'Hex', value: '#52525b' }, { label: 'Computed', value: 'rgb(82, 82, 91)' }, { label: 'Location', value: '"Create New Story" dashed card border (2px dashed)', isLocation: true }]} />
              <SwatchCard color="rgba(255,255,255,0.6)" name="White / 60% — Description Text" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.6)' }, { label: 'Location', value: 'Story card description text', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(255,255,255,0.5)" name="White / 50% — Metadata Text" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.5)' }, { label: 'Location', value: '"Created by" text, stat numbers on story cards', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(0,0,0,0.5)" name="Card Shadow" rows={[{ label: 'Value', value: 'rgba(0,0,0,0.5)' }, { label: 'Full', value: '0px 12px 32px -2px' }, { label: 'Location', value: 'Story card and panel box-shadow', isLocation: true }]} />
            </div>
          </Section>

          <Divider />

          {/* ═══ 2. TYPOGRAPHY ═══ */}
          <Section id="typography" title="Typography" desc="Font sizes, weights, and letter-spacing values extracted from both pages. Each tile shows a rendered example, exact specs, and where the style is used." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>

            <TypeTile name="Page Title (White header bar)" exampleBg="#fff"
              exampleContent={<span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.45px', textTransform: 'uppercase' }}>STORY BUILDER</span>}
              specs={['18px', 'weight 900', '-0.45px tracking', '#0f172a (slate-900)']}
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
              locations='Directly below the "Story Setup" heading. Muted descriptive text.'
            />
            <TypeTile name="Panel Header Title (Blue bar)" exampleBg="#4a5f7f"
              exampleContent={<span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Story Card</span>}
              specs={['20px', 'weight 700', '-0.5px tracking', '#ffffff (white)']}
              locations='Inside the bg-[#4a5f7f] panel header bars — "Story Card", "World Core", "Story Arcs", "Opening Dialog", "Art Style Preference", "World Codex", "Content Themes", "Share Your Story".'
            />
            <TypeTile name="Field Labels (Inside panels)" exampleBg="#2a2a2f"
              exampleContent={<>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>STORY NAME</span>
                <span style={{ marginLeft: 24, fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>BRIEF DESCRIPTION</span>
                <span style={{ marginLeft: 24, fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>GENRE</span>
              </>}
              specs={['10px', 'weight 700', '0.5px tracking', 'uppercase', '#ffffff']}
              locations="All form field labels inside dark panels — STORY NAME, BRIEF DESCRIPTION, STORY PREMISE, PRIMARY LOCATIONS, STORY ARC TITLE, DESIRED OUTCOME, GUIDANCE STRENGTH, OPENING DIALOG, CHARACTER TYPES, GENRE, ORIGIN, etc."
            />
            <TypeTile name="Button Text (Header actions)" exampleBg="#2F3137"
              exampleContent={<span style={{ fontSize: 10, fontWeight: 700, color: '#eaedf1', letterSpacing: '0.5px', textTransform: 'uppercase' }}>SAVE AND CLOSE</span>}
              specs={['10px', 'weight 700', '0.5px tracking', 'uppercase', '#eaedf1']}
              locations='All dark action buttons — DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image, Publish to Gallery. Sits on bg-[#2F3137] buttons.'
            />
            <TypeTile name="Character Name (Roster sidebar)" exampleBg="#2a2a2f"
              exampleContent={<span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>ASHLEY</span>}
              specs={['14px', 'weight 700', 'normal tracking', '#ffffff']}
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
              specs={['18px', 'weight 900', '-0.45px tracking', '#ffffff (white)']}
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
            <TypeTile name="Tab Pill Text (Active / Inactive)" exampleBg="#2a2a2f"
              exampleContent={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#4a5f7f', borderRadius: 9999, padding: '6px 16px' }}>My Stories</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa' }}>Community</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa' }}>Favorites</span>
                </div>
              }
              specs={['12px', 'weight 700', 'Active: #fff on #4a5f7f', 'Inactive: #a1a1aa']}
              locations="Navigation tabs below the header bar on My Stories page. Active pill has rounded-full bg, inactive is text only."
            />
          </Section>

          <Divider />

          {/* ═══ 3. BUTTONS ═══ */}
          <Section id="buttons" title="Buttons" desc="All button styles found across Story Builder and My Stories pages." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>
            <div style={fullSpan}><PageDesc>Button styles used in the Story Builder workflow.</PageDesc></div>

            <EntryCard name="Header Action Button" pageTag="Story Builder"
              specs="<strong>bg:</strong> #2F3137 · <strong>color:</strong> #eaedf1 · <strong>10px / 700 / uppercase</strong> · <strong>border:</strong> 1px solid white/10 · <strong>border-radius:</strong> 12px · <strong>height:</strong> 40px · <strong>padding:</strong> 10px 24px · <strong>letter-spacing:</strong> 0.5px"
              preview={<>
                <button style={{ background: '#2F3137', color: '#eaedf1', height: 40, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'default', fontFamily: 'inherit' }}>DRAFTS</button>
                <button style={{ background: '#2F3137', color: '#eaedf1', height: 40, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'default', fontFamily: 'inherit' }}>SAVE AND CLOSE</button>
                <button style={{ background: '#2F3137', color: '#eaedf1', height: 40, padding: '0 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'default', fontFamily: 'inherit' }}>SAVE DRAFT</button>
              </>}
              code={`background: #2F3137;  /* rgb(47, 49, 55) */
color: #eaedf1;  /* rgb(234, 237, 241) */
font-size: 10px; font-weight: 700;
text-transform: uppercase; letter-spacing: 0.5px;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 12px; height: 40px;`}
            />
            <EntryCard name="AI Generate Button" pageTag="Story Builder"
              specs="<strong>bg:</strong> gradient (purple) · <strong>color:</strong> white · <strong>10px / 700 / uppercase</strong> · <strong>border-radius:</strong> 12px · <strong>height:</strong> 40px"
              preview={
                <button style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', color: '#fff', height: 40, padding: '0 22px', borderRadius: 12, border: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'default', fontFamily: 'inherit' }}>AI GENERATE</button>
              }
              code={`background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
color: #fff; font-size: 10px; font-weight: 700;
text-transform: uppercase; border-radius: 12px; height: 40px;`}
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
              specs="Appear on story card hover. All use <strong>10px / 700 / border-radius: 12px</strong>."
              preview={<>
                <button style={{ background: '#fff', color: '#0f172a', height: 36, padding: '0 18px', borderRadius: 12, border: '1px solid #dbe2ea', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'default', fontFamily: 'inherit' }}>EDIT</button>
                <button style={{ background: '#ef4444', color: '#fff', height: 36, padding: '0 18px', borderRadius: 12, border: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'default', fontFamily: 'inherit' }}>DELETE</button>
                <button style={{ background: '#2563eb', color: '#fff', height: 36, padding: '0 18px', borderRadius: 12, border: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'default', fontFamily: 'inherit' }}>PLAY</button>
              </>}
              code={`/* Edit */  bg: #ffffff; color: #0f172a;
/* Delete */ bg: #ef4444; color: #fff;
/* Play */   bg: #2563eb; color: #fff;
/* All share: */ font-size: 10px; font-weight: 700; border-radius: 12px;`}
            />
            <EntryCard name="Tab Pills — Active / Inactive" pageTag="My Stories"
              specs="<strong>Active:</strong> bg #4a5f7f, white text, rounded-full · <strong>Inactive:</strong> transparent, #a1a1aa text · Both 12px / 700"
              previewDark
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
              specs="<strong>bg:</strong> rgba(24,24,27,0.5) · <strong>color:</strong> white · <strong>border:</strong> 1px solid #3f3f46 · <strong>border-radius:</strong> 8px · <strong>padding:</strong> 8px 12px · <strong>font-size:</strong> 14px"
              previewDark
              previewStyle={{ flexDirection: 'column', gap: 12 }}
              preview={<>
                <input readOnly style={{ width: '100%', minHeight: 40, padding: '8px 12px', borderRadius: 8, border: '1px solid #3f3f46', background: 'rgba(24,24,27,0.5)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} placeholder="Enter story arc title..." />
                <input readOnly style={{ width: '100%', minHeight: 40, padding: '8px 12px', borderRadius: 8, border: '1px solid #3f3f46', background: 'rgba(24,24,27,0.5)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. The Lakehouse" />
              </>}
              code={`background: rgba(24, 24, 27, 0.5);  /* zinc-900/50 */
color: #fff; font-size: 14px;
border: 1px solid #3f3f46;  /* zinc-700 */
border-radius: 8px; padding: 8px 12px;`}
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
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1, background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', fontWeight: 500 }}>Fantasy</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1, background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', fontWeight: 500 }}>Romance</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1, background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', fontWeight: 500 }}>Dark Romance</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1, background: 'transparent', border: '2px dashed #71717a', color: '#60a5fa', fontWeight: 500 }}>+ Add custom</span>
              </>}
              code={`/* Tag chip */
background: #27272a;  /* zinc-800 */
color: #a1a1aa;  /* zinc-400 */
border: 1px solid #3f3f46;  /* zinc-700 */
font-size: 12px; font-weight: 500;
border-radius: 8px; padding: 6px 12px;

/* "+ Add custom" chip */
background: transparent; color: #60a5fa;
border: 2px dashed #71717a;  /* zinc-500 */`}
            />

            <div style={{ marginTop: 24 }}>
              <PageSubheading>My Stories Page</PageSubheading>
              <PageDesc>Badge styles used on My Stories cards.</PageDesc>
              <EntryCard name="SFW / NSFW Badges" pageTag="My Stories"
                specs='<strong>bg:</strong> #2a2a2f · <strong>12px / 700</strong> · <strong>border-radius:</strong> 8px · <strong>padding:</strong> 4px 10px · SFW = <strong>blue-400</strong>, NSFW = <strong>red-400</strong>'
                previewPlain
                preview={<>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1, background: '#2a2a2f', color: '#60a5fa', fontWeight: 700 }}>SFW</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1, background: '#2a2a2f', color: '#f87171', fontWeight: 700 }}>NSFW</span>
                </>}
                code={`background: #2a2a2f; border-radius: 8px; padding: 4px 10px;
font-size: 12px; font-weight: 700;
/* SFW */  color: #60a5fa;  /* blue-400 */
/* NSFW */ color: #f87171;  /* red-400 */`}
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
                specs="<strong>bg:</strong> #2a2a2f · <strong>border-radius:</strong> 24px · <strong>border:</strong> white/10 · <strong>box-shadow:</strong> rgba(0,0,0,0.5) 0px 12px 32px -2px"
                preview={<div style={{ width: '100%', height: 80, background: '#2a2a2f', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'rgba(0,0,0,0.5) 0px 12px 32px -2px' }} />}
                previewDark
                code={`background: #2a2a2f;  /* rgb(42, 42, 47) */
border-radius: 24px;  /* rounded-[24px] */
border: 1px solid rgba(255,255,255,0.1);  /* border-white/10 */
box-shadow: rgba(0,0,0,0.5) 0px 12px 32px -2px;`}
              />

              <EntryCard name="Panel Header Bar" pageTag="Story Builder"
                specs="<strong>bg:</strong> #4a5f7f · <strong>padding:</strong> 16px 24px · <strong>border-bottom:</strong> white/20 · <strong>shadow-lg</strong> · Contains H2 title (20px/700/white) and icon"
                preview={
                  <div style={{ background: '#4a5f7f', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}>⚙</div>
                    <span style={{ color: 'white', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>Story Card</span>
                  </div>
                }
                previewPlain
                code={`background: #4a5f7f;  /* bg-[#4a5f7f] */
padding: 16px 24px;  /* px-6 py-4 */
border-bottom: 1px solid rgba(255,255,255,0.2);  /* border-white/20 */
box-shadow: shadow-lg;
display: flex; align-items: center; gap: 12px;`}
              />

              <EntryCard name="Character Roster Sidebar" pageTag="Story Builder"
                specs='<strong>bg:</strong> #2a2a2f · <strong>width:</strong> 260px · <strong>border-right:</strong> white/10 · Contains section pills (<code>bg-[#4a5f7f]</code>) and character cards'
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
                specs='<strong>aspect-ratio:</strong> 2/3 · <strong>border-radius:</strong> 32px (rounded-[2rem]) · <strong>border:</strong> 1px solid #4a5f7f · <strong>gradient overlay:</strong> linear-gradient(to top, #020617, slate-900/60, transparent)'
                preview={null}
                previewPlain
                code={`aspect-ratio: 2/3;
border-radius: 32px;  /* rounded-[2rem] */
border: 1px solid rgb(74, 95, 127);  /* #4a5f7f */
box-shadow: rgba(0,0,0,0.5) 0px 12px 32px -2px;
/* Gradient overlay on card image: */
background: linear-gradient(to top, rgb(2,6,23), rgba(15,23,42,0.6), transparent);`}
              />
            </div>
          </Section>

          <Divider />

          {/* ═══ 7. MODALS (placeholder) ═══ */}
          <Section id="modals" title="Modals" desc="Pop-up modal and dialog container styling. Specs to be extracted from live source code.">
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontStyle: 'italic', background: '#f8fafc', borderRadius: 10, border: '2px dashed #d9dee6' }}>
              To be built — Modal specs will be extracted from the source code (backdrop, container, header, footer patterns).
            </div>
          </Section>

          <Divider />

          {/* ═══ 8. ICONS (placeholder) ═══ */}
          <Section id="icons" title="Icons" desc="Icon sizing and color conventions used across the app. Specs to be extracted from live source code.">
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontStyle: 'italic', background: '#f8fafc', borderRadius: 10, border: '2px dashed #d9dee6' }}>
              To be built — Icon sizes, colors, stroke weights, and containers will be extracted from the source code.
            </div>
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
