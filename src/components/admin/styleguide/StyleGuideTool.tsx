import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { StyleGuideDownloadModal } from './StyleGuideDownloadModal';

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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 1. COLORS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="colors" title="Colors" desc="All colors organized by the page they appear on. Every value verified against live source code and CSS custom properties.">
            
            {/* ─── Story Builder ─── */}
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

            {/* ─── My Stories ─── */}
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

            <Divider />

            {/* ─── Community Gallery ─── */}
            <PageSubheading>Community Gallery</PageSubheading>
            <PageDesc>Colors specific to the Community Gallery page and gallery cards.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#121214" name="Gallery Page Background" rows={[{ label: 'Hex', value: '#121214' }, { label: 'Token', value: 'bg-[#121214]' }, { label: 'Location', value: 'GalleryHub main wrapper, Account page background', isLocation: true }]} />
              <SwatchCard color="rgba(18,18,20,0.8)" name="Gallery Header Glass" rows={[{ label: 'Value', value: 'rgba(18,18,20,0.8)' }, { label: 'Effect', value: 'backdrop-filter: blur(12px)' }, { label: 'Location', value: 'Gallery sticky header with glassmorphic effect', isLocation: true }]} />
              <SwatchCard color="rgba(58,58,63,0.5)" name="Gallery Search Input BG" rows={[{ label: 'Value', value: 'rgba(58,58,63,0.5)' }, { label: 'Token', value: 'bg-[#3a3a3f]/50' }, { label: 'Location', value: 'Gallery search input background', isLocation: true }]} />
              <SwatchCard color="#18181b" name="Category Sidebar BG" rows={[{ label: 'Hex', value: '#18181b' }, { label: 'Token', value: 'bg-[#18181b]' }, { label: 'Location', value: 'Gallery category filter sidebar (280px)', isLocation: true }]} />
              <SwatchCard color="#facc15" name="Yellow Accent Border" rows={[{ label: 'Hex', value: '#facc15' }, { label: 'Token', value: 'bg-yellow-400' }, { label: 'Location', value: '2px accent bar at top of category sidebar', isLocation: true }]} />
              <SwatchCard color="rgba(59,130,246,0.2)" name="Blue Filter Tag BG" rows={[{ label: 'Value', value: 'rgba(59,130,246,0.2)' }, { label: 'Token', value: 'bg-blue-500/20' }, { label: 'Location', value: 'Active story type filter chip background', isLocation: true }]} />
              <SwatchCard color="rgba(168,85,247,0.2)" name="Purple Genre Filter BG" rows={[{ label: 'Value', value: 'rgba(168,85,247,0.2)' }, { label: 'Token', value: 'bg-purple-500/20' }, { label: 'Location', value: 'Active genre filter chip background, purple-400 text', isLocation: true }]} />
            </div>

            <Divider />

            {/* ─── Chat Interface ─── */}
            <PageSubheading>Chat Interface</PageSubheading>
            <PageDesc>Colors unique to the chat/conversation view.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#1c1f26" name="Chat Bubble (Solid)" rows={[{ label: 'Hex', value: '#1c1f26' }, { label: 'Token', value: 'bg-[#1c1f26]' }, { label: 'Location', value: 'Chat message bubble when transparent mode is OFF', isLocation: true }]} />
              <SwatchCard color="rgba(0,0,0,0.5)" name="Chat Bubble (Transparent)" rows={[{ label: 'Value', value: 'rgba(0,0,0,0.5)' }, { label: 'Token', value: 'bg-black/50' }, { label: 'Location', value: 'Chat message bubble when transparent mode is ON', isLocation: true }]} />
              <SwatchCard color="#94a3b8" name="Action Text (Italic)" rows={[{ label: 'Hex', value: '#94a3b8' }, { label: 'Token', value: 'text-slate-400' }, { label: 'Location', value: 'Italic action text in chat (*actions*)', isLocation: true }]} />
              <SwatchCard color="rgba(199,210,254,0.9)" name="Thought Text (Glowing)" rows={[{ label: 'Value', value: 'rgba(199,210,254,0.9)' }, { label: 'Token', value: 'text-indigo-200/90' }, { label: 'Effect', value: 'textShadow: indigo glow' }, { label: 'Location', value: 'Thought text in chat (parenthetical)', isLocation: true }]} />
              <SwatchCard color="rgba(59,130,246,1)" name="User Bubble Border" rows={[{ label: 'Value', value: 'border-2 border-blue-400' }, { label: 'Location', value: 'User (non-AI) message bubble gets a blue-400 border to differentiate', isLocation: true }]} />
              <SwatchCard color="rgba(255,255,255,0.3)" name="Frosted Glass (Light BG)" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.3)' }, { label: 'Token', value: 'bg-white/30' }, { label: 'Location', value: 'SideCharacterCard when sidebar bg is dark (isDarkBg=true)', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(0,0,0,0.3)" name="Frosted Glass (Dark BG)" rows={[{ label: 'Value', value: 'rgba(0,0,0,0.3)' }, { label: 'Token', value: 'bg-black/30' }, { label: 'Location', value: 'SideCharacterCard when sidebar bg is light (isDarkBg=false)', isLocation: true }]} />
            </div>

            <Divider />

            {/* ─── Chat History ─── */}
            <PageSubheading>Chat History</PageSubheading>
            <PageDesc>Colors for the conversation session cards.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="rgba(58,58,63,0.3)" name="Session Inner Card BG" rows={[{ label: 'Value', value: 'rgba(58,58,63,0.3)' }, { label: 'Token', value: 'bg-[#3a3a3f]/30' }, { label: 'Location', value: 'Inner nested card in session entries', isLocation: true }]} />
              <SwatchCard color="rgba(255,255,255,0.1)" name="Delete Button BG" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.1)' }, { label: 'Token', value: 'bg-white/10' }, { label: 'Location', value: 'Session delete button background, border-white/10', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(24,24,27,0.5)" name="Message Preview BG" rows={[{ label: 'Value', value: 'rgba(24,24,27,0.5)' }, { label: 'Token', value: 'bg-zinc-900/50' }, { label: 'Location', value: 'Last message preview box in session cards', isLocation: true }]} />
            </div>

            <Divider />

            {/* ─── Account Page ─── */}
            <PageSubheading>Account Page</PageSubheading>
            <PageDesc>Colors for the dark-themed Account settings page.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#121214" name="Account Page BG" rows={[{ label: 'Hex', value: '#121214' }, { label: 'Token', value: 'bg-[#121214]' }, { label: 'Location', value: 'Full page background for Account section', isLocation: true }]} />
              <SwatchCard color="#1e1e22" name="Settings Card BG" rows={[{ label: 'Hex', value: '#1e1e22' }, { label: 'Token', value: 'bg-[#1e1e22]' }, { label: 'Location', value: 'Email, Plan, Password setting cards', isLocation: true }]} />
              <SwatchCard color="#2b2b2e" name="Tab Container BG" rows={[{ label: 'Hex', value: '#2b2b2e' }, { label: 'Token', value: 'bg-[#2b2b2e]' }, { label: 'Location', value: 'Pill tab container on Account and Gallery pages', isLocation: true }]} />
              <SwatchCard color="rgba(74,95,127,0.2)" name="Plan Badge BG" rows={[{ label: 'Value', value: 'rgba(74,95,127,0.2)' }, { label: 'Token', value: 'bg-[#4a5f7f]/20' }, { label: 'Location', value: 'Subscription plan badge background, text: #7ba3d4', isLocation: true }]} />
            </div>

            <Divider />

            {/* ─── Auth Page ─── */}
            <PageSubheading>Auth Page</PageSubheading>
            <PageDesc>The light-themed authentication page gradient and card colors.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)" name="Auth Page Gradient" rows={[{ label: 'Value', value: 'from-slate-900 via-purple-900 to-slate-900' }, { label: 'Location', value: 'Auth page full-screen background', isLocation: true }]} extraPreviewStyle={{ background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)' }} />
              <SwatchCard color="rgba(30,41,59,0.5)" name="Auth Card BG" rows={[{ label: 'Value', value: 'rgba(30,41,59,0.5)' }, { label: 'Token', value: 'bg-slate-800/50' }, { label: 'Location', value: 'Login/signup Card component background', isLocation: true }]} />
              <SwatchCard color="rgba(51,65,85,0.5)" name="Auth Input BG" rows={[{ label: 'Value', value: 'rgba(51,65,85,0.5)' }, { label: 'Token', value: 'bg-slate-700/50' }, { label: 'Location', value: 'Email and password input fields on auth page', isLocation: true }]} />
              <SwatchCard color="#7c3aed" name="Purple 600 / Auth Submit" rows={[{ label: 'Hex', value: '#7c3aed' }, { label: 'Token', value: 'bg-purple-600' }, { label: 'Location', value: 'Sign In / Create Account button', isLocation: true }]} />
              <SwatchCard color="#a78bfa" name="Purple 400 / Auth Toggle Link" rows={[{ label: 'Hex', value: '#a78bfa' }, { label: 'Token', value: 'text-purple-400' }, { label: 'Location', value: '"Don\'t have an account? Sign up" toggle text', isLocation: true }]} />
            </div>
            <InconsistencyNote items={[
              { file: 'Auth.tsx', note: 'Uses purple accent (purple-600 button, purple-400 link) while rest of app uses blue #4a5f7f accent.' },
            ]} />

            <Divider />

            {/* ─── Creator Profile ─── */}
            <PageSubheading>Creator Profile</PageSubheading>
            <PageDesc>Colors for the public Creator Profile page.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#121214" name="Profile Page BG" rows={[{ label: 'Hex', value: '#121214' }, { label: 'Token', value: 'bg-[#121214]' }, { label: 'Location', value: 'Full page background (same as Gallery/Account)', isLocation: true }]} />
              <SwatchCard color="#1e1e22" name="Profile Card BG" rows={[{ label: 'Hex', value: '#1e1e22' }, { label: 'Token', value: 'bg-[#1e1e22]' }, { label: 'Location', value: 'Profile info card, bio section', isLocation: true }]} />
              <SwatchCard color="#ffffff" name="Profile Header Bar" rows={[{ label: 'Hex', value: '#ffffff' }, { label: 'Token', value: 'bg-white' }, { label: 'Location', value: 'Top header bar on Creator Profile — light on dark page', isLocation: true }]} />
              <SwatchCard color="rgba(255,255,255,0.05)" name="Stats Pill BG" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.05)' }, { label: 'Token', value: 'bg-white/5' }, { label: 'Location', value: 'Stat pills (followers, plays, etc.) on Creator Profile', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCard color="rgba(255,255,255,0.1)" name="Unfollow Button BG" rows={[{ label: 'Value', value: 'rgba(255,255,255,0.1)' }, { label: 'Token', value: 'bg-white/10' }, { label: 'Location', value: 'Unfollow button (toggle state)', isLocation: true }]} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>
            <InconsistencyNote items={[
              { file: 'CreatorProfile.tsx', note: 'Uses bg-white header bar on bg-[#121214] dark page — jarring light/dark contrast.' },
              { file: 'CreatorProfile.tsx', note: 'Uses bg-[#1e1e22] surface which doesn\'t match bg-[#2a2a2f] or bg-zinc-900 used elsewhere.' },
            ]} />

            <Divider />

            {/* ─── Global Sidebar ─── */}
            <PageSubheading>Global Sidebar</PageSubheading>
            <PageDesc>Colors for the main application navigation sidebar.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#1a1a1a" name="Sidebar Background" rows={[{ label: 'Hex', value: '#1a1a1a' }, { label: 'Token', value: 'bg-[#1a1a1a]' }, { label: 'Location', value: 'Global left sidebar (280px expanded, 72px collapsed)', isLocation: true }]} />
              <SwatchCard color="#4a5f7f" name="Active Sidebar Item" rows={[{ label: 'Hex', value: '#4a5f7f' }, { label: 'Token', value: 'bg-[#4a5f7f]' }, { label: 'Effect', value: 'shadow-lg shadow-black/40' }, { label: 'Location', value: 'Active navigation item background', isLocation: true }]} />
              <SwatchCard color="#94a3b8" name="Inactive Sidebar Text" rows={[{ label: 'Hex', value: '#94a3b8' }, { label: 'Token', value: 'text-slate-400' }, { label: 'Location', value: 'Inactive sidebar item text and icons', isLocation: true }]} />
            </div>

            <Divider />

            {/* ─── Character Builder ─── */}
            <PageSubheading>Character Builder</PageSubheading>
            <PageDesc>Colors specific to the Character Builder / CharactersTab editor.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="rgba(58,58,63,0.3)" name="Inner Card Surface" rows={[{ label: 'Value', value: 'rgba(58,58,63,0.3)' }, { label: 'Token', value: 'bg-[#3a3a3f]/30' }, { label: 'Location', value: 'HardcodedSection inner card, character trait row containers', isLocation: true }]} />
              <SwatchCard color="rgba(24,24,27,0.5)" name="HardcodedRow Label BG" rows={[{ label: 'Value', value: 'rgba(24,24,27,0.5)' }, { label: 'Token', value: 'bg-zinc-900/50' }, { label: 'Location', value: 'Read-only trait labels (Physical Appearance, Personality, etc.)', isLocation: true }]} />
              <SwatchCard color="rgba(96,165,250,0.1)" name="Enhance Hover BG" rows={[{ label: 'Value', value: 'rgba(96,165,250,0.1)' }, { label: 'Token', value: 'bg-blue-500/10' }, { label: 'Location', value: 'AI Enhance sparkle button hover state', isLocation: true }]} />
            </div>

            <Divider />

            {/* ─── Model Settings ─── */}
            <PageSubheading>Model Settings</PageSubheading>
            <PageDesc>Colors used on the Model Settings page — NOTE: this page uses a LIGHT THEME unlike the rest of the app.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="#ffffff" name="Model Card BG (Inactive)" rows={[{ label: 'Hex', value: '#ffffff' }, { label: 'Token', value: 'bg-white' }, { label: 'Location', value: 'Inactive model selection card background', isLocation: true }]} />
              <SwatchCard color="#0f172a" name="Model Card BG (Active)" rows={[{ label: 'Hex', value: '#0f172a' }, { label: 'Token', value: 'bg-slate-900' }, { label: 'Location', value: 'Active/selected model card background, scale-[1.02]', isLocation: true }]} />
              <SwatchCard color="#faf5ff" name="Admin Share Panel" rows={[{ label: 'Hex', value: '#faf5ff' }, { label: 'Token', value: 'bg-purple-50' }, { label: 'Location', value: 'Admin-only share toggle row background, border-purple-200', isLocation: true }]} />
              <SwatchCard color="#f8fafc" name="Connection Setup BG" rows={[{ label: 'Hex', value: '#f8fafc' }, { label: 'Token', value: 'bg-slate-50' }, { label: 'Location', value: 'Connection setup container within Model Settings', isLocation: true }]} />
            </div>
            <InconsistencyNote items={[
              { file: 'ModelSettingsTab.tsx', note: 'Uses LIGHT THEME (bg-white, text-slate-900, border-slate-200) while every other page in the app uses dark theme. Major design inconsistency.' },
              { file: 'ModelSettingsTab.tsx', note: 'Card hover uses scale-[1.02] transition — unique to this page, not used elsewhere.' },
            ]} />

            <Divider />

            {/* ─── World Tab ─── */}
            <PageSubheading>World Tab</PageSubheading>
            <PageDesc>Colors specific to the World Tab and its hint/character components.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCard color="rgba(0,0,0,0.8)" name="CharacterButton BG" rows={[{ label: 'Value', value: 'rgba(0,0,0,0.8)' }, { label: 'Token', value: 'bg-black/80' }, { label: 'Location', value: 'World Tab character card button background', isLocation: true }]} />
              <SwatchCard color="#4a5f7f" name="CharacterButton Border" rows={[{ label: 'Hex', value: '#4a5f7f' }, { label: 'Token', value: 'border-[#4a5f7f]' }, { label: 'Hover', value: 'border-[#6b82a8]' }, { label: 'Location', value: 'Character card border, hover brightens to #6b82a8', isLocation: true }]} />
            </div>
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 2. TYPOGRAPHY ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="typography" title="Typography" desc="Font sizes, weights, and letter-spacing values extracted from source code." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>

            <TypeTile name="Page Title (White header bar)" exampleBg="#fff"
              exampleContent={<span className="text-lg font-black text-slate-900 uppercase tracking-tight">STORY BUILDER</span>}
              specs={['18px', 'weight 900', 'tracking-tight', '#0f172a (slate-900)', 'uppercase']}
              locations='Top-left of the white header bar on every page — "STORY BUILDER", "ACCOUNT", "MY STORIES". Always uppercase, always next to the back arrow.'
            />
            <TypeTile name="Section Title (Content area)" exampleBg="#fff"
              exampleContent={<span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.9px' }}>Story Setup</span>}
              specs={['36px', 'weight 900', '-0.9px tracking', '#0f172a (slate-900)']}
              locations="Large heading at top of the content area on Story Builder page."
            />
            <TypeTile name="Panel Header Title (Blue bar)" exampleBg="#4a5f7f"
              exampleContent={<span className="text-xl font-bold tracking-tight text-white">Story Card</span>}
              specs={['text-xl (20px)', 'font-bold (700)', 'tracking-tight (-0.5px)', 'text-white']}
              locations='Inside the bg-[#4a5f7f] panel header bars — "Story Card", "World Core", "Story Arcs", "Opening Dialog".'
            />
            <TypeTile name="Field Labels (Inside panels)" exampleBg="#2a2a2f"
              exampleContent={<>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">STORY NAME</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider ml-6">BRIEF DESCRIPTION</span>
              </>}
              specs={['text-[10px]', 'font-bold (700)', 'tracking-wider (0.05em)', 'uppercase', 'text-white']}
              locations="All form field labels inside dark panels."
            />
            <TypeTile name="Button Text (Shadow Surface)" exampleBg="hsl(228, 7%, 20%)"
              exampleContent={<span className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: 'hsl(210, 20%, 93%)' }}>SAVE AND CLOSE</span>}
              specs={['text-[10px]', 'font-bold (700)', 'tracking-wider', 'uppercase', 'leading-none']}
              locations='All Shadow Surface action buttons — DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image.'
            />
            <TypeTile name="Character Name (Roster sidebar)" exampleBg="#2a2a2f"
              exampleContent={<span className="text-sm font-bold text-white">ASHLEY</span>}
              specs={['14px', 'font-bold (700)', 'normal tracking', 'text-white']}
              locations="Character names in the Character Roster sidebar panel."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>My Stories Page</PageSubheading></div>

            <TypeTile name="Story Card Title" exampleBg="linear-gradient(to top, #020617, rgba(15,23,42,0.6))"
              exampleContent={<span className="text-lg font-black text-white tracking-tight">Acotar</span>}
              specs={['text-lg (18px)', 'font-black (900)', 'tracking-tight', 'text-white']}
              locations="Story name on the card overlay gradient."
            />
            <TypeTile name="Tab Pill Text" exampleBg="#fff"
              exampleContent={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="text-xs font-bold text-white bg-[#4a5f7f] rounded-full px-4 py-1.5">My Stories</span>
                  <span className="text-xs font-bold text-zinc-400">Community</span>
                </div>
              }
              specs={['12px', 'font-bold (700)', 'Active: #fff on #4a5f7f', 'Inactive: #a1a1aa']}
              locations="Navigation tabs below the header bar on My Stories page."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Community Gallery</PageSubheading></div>

            <TypeTile name="Gallery Card Title" exampleBg="linear-gradient(to top, #020617, rgba(15,23,42,0.6))"
              exampleContent={<span className="text-lg font-black text-white leading-tight tracking-tight">The Dark Forest</span>}
              specs={['text-lg', 'font-black', 'leading-tight tracking-tight', 'text-white']}
              locations="Story title on Gallery card overlay. Truncated. Hover: text-blue-300."
            />
            <TypeTile name="Gallery Card Description" exampleBg="#2a2a2f"
              exampleContent={<span className="text-xs text-white/60 italic leading-relaxed">A romantic fantasy adventure in the fae lands...</span>}
              specs={['text-xs (12px)', 'weight 400', 'italic', 'text-white/60', 'line-clamp-2']}
              locations="Story description below title on gallery cards."
            />
            <TypeTile name="Gallery Card Stats" exampleBg="#2a2a2f"
              exampleContent={<span className="text-[10px] text-white/50">👁 123 ❤ 45 🔖 12 ▶ 67</span>}
              specs={['text-[10px]', 'weight 400', 'text-white/50', 'flex gap-3']}
              locations="View/like/save/play counts at bottom of gallery cards."
            />
            <TypeTile name="Gallery Search Placeholder" exampleBg="#3a3a3f"
              exampleContent={<span className="text-sm text-zinc-500">Search titles, descriptions, or #tags...</span>}
              specs={['text-sm (14px)', 'weight 400', 'text-zinc-500 placeholder']}
              locations="Gallery search input placeholder text."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Chat Interface</PageSubheading></div>

            <TypeTile name="Chat Message Text (Speech)" exampleBg="#1c1f26"
              exampleContent={<span className="text-[15px] font-medium text-white leading-relaxed">"Hello there, how are you?"</span>}
              specs={['15px', 'font-medium (500)', 'text-white', 'leading-relaxed']}
              locations="Speech/dialogue text in chat messages. Quoted content."
            />
            <TypeTile name="Chat Action Text (Italic)" exampleBg="#1c1f26"
              exampleContent={<span className="text-[15px] italic text-slate-400 leading-relaxed">*walks slowly toward the door*</span>}
              specs={['15px', 'italic', 'text-slate-400', 'leading-relaxed']}
              locations="Action text in chat messages wrapped in asterisks."
            />
            <TypeTile name="Character Label (Chat)" exampleBg="#1c1f26"
              exampleContent={<span className="text-[9px] font-black uppercase tracking-widest text-slate-500">NARRATOR</span>}
              specs={['text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-500']}
              locations="Character name below avatar in chat bubbles. AI: text-slate-500, User: text-blue-300."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Chat History</PageSubheading></div>

            <TypeTile name="Session Title" exampleBg="#2a2a2f"
              exampleContent={<span className="font-bold text-white">The Dark Forest Adventure</span>}
              specs={['default (16px)', 'font-bold', 'text-white', 'truncate']}
              locations="Scenario title in chat history session cards."
            />
            <TypeTile name="Message Preview" exampleBg="rgba(24,24,27,0.5)"
              exampleContent={<span className="text-sm text-zinc-400 leading-relaxed">The wind howled through the trees as she approached...</span>}
              specs={['text-sm (14px)', 'weight 400', 'text-zinc-400', 'line-clamp-2']}
              locations="Last message preview in session cards."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Account Page</PageSubheading></div>

            <TypeTile name="Settings Section Title" exampleBg="#1e1e22"
              exampleContent={<span className="text-lg font-bold text-white">Email Address</span>}
              specs={['text-lg (18px)', 'font-bold', 'text-white']}
              locations="Section headings in Account settings cards (Email, Plan, Password)."
            />
            <TypeTile name="Account Field Label" exampleBg="#1e1e22"
              exampleContent={<span className="text-xs font-bold text-white/40 uppercase tracking-wider">NEW PASSWORD</span>}
              specs={['text-xs', 'font-bold', 'text-white/40', 'uppercase tracking-wider']}
              locations="Form field labels in Account settings (New Password, Confirm)."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Global Sidebar</PageSubheading></div>

            <TypeTile name="Sidebar Nav Item" exampleBg="#1a1a1a"
              exampleContent={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="text-sm font-bold text-white">My Stories</span>
                  <span className="text-sm font-bold text-slate-400 ml-4">Chat History</span>
                </div>
              }
              specs={['text-sm (14px)', 'font-bold', 'Active: text-white', 'Inactive: text-slate-400']}
              locations="Global sidebar navigation items (expanded mode)."
            />
            <TypeTile name="Sidebar Subtitle" exampleBg="#4a5f7f"
              exampleContent={<span className="text-[10px] font-black tracking-wide uppercase text-blue-200">ACOTAR</span>}
              specs={['text-[10px]', 'font-black', 'tracking-wide uppercase', 'text-blue-200']}
              locations="Active scenario subtitle below Story Builder nav item."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Character Builder</PageSubheading></div>

            <TypeTile name="HardcodedRow Label (Read-only)" exampleBg="rgba(24,24,27,0.5)"
              exampleContent={<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PHYSICAL APPEARANCE</span>}
              specs={['text-[10px]', 'font-bold', 'uppercase', 'tracking-widest', 'text-zinc-400']}
              locations="Read-only trait labels in character builder HardcodedRow components. Paired with Lock icon (w-3.5 h-3.5 text-zinc-400)."
            />
            <TypeTile name="ExtraRow Editable Label" exampleBg="rgba(24,24,27,0.5)"
              exampleContent={<span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">CUSTOM TRAIT</span>}
              specs={['text-[10px]', 'font-bold', 'uppercase', 'tracking-widest', 'text-zinc-300']}
              locations="User-created custom trait labels — editable via input. Same layout as HardcodedRow but without Lock icon, has red X delete."
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Model Settings</PageSubheading></div>

            <TypeTile name="Model Name (Active Card)" exampleBg="#0f172a"
              exampleContent={<span className="font-bold text-white">Grok Beta</span>}
              specs={['default (16px)', 'font-bold', 'text-white (active)', 'text-slate-900 (inactive)']}
              locations="Model name inside selection cards. White on dark active card, slate-900 on white inactive card."
            />
            <TypeTile name="Connection Status Text" exampleBg="#f8fafc"
              exampleContent={<span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">SYSTEM LINKED</span>}
              specs={['text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-emerald-600']}
              locations="Connection status badge text in Model Settings. Error state: text-slate-500."
            />
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 3. BUTTONS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="buttons" title="Buttons" desc="All button styles found across the application. Verified against source code." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>

            <EntryCard name="Shadow Surface Button (Header Actions)" pageTag="Story Builder"
              specs='<strong>bg:</strong> hsl(var(--ui-surface-2)) · <strong>color:</strong> hsl(var(--ui-text)) · <strong>text-[10px] / font-bold / uppercase / tracking-wider / leading-none</strong> · <strong>border:</strong> 1px solid hsl(var(--ui-border)) · <strong>border-radius:</strong> rounded-xl (12px) · <strong>height:</strong> h-10 (40px) · <strong>padding:</strong> px-6 · <strong>shadow:</strong> 0 10px 30px rgba(0,0,0,0.35)'
              preview={<>
                <button className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold leading-none uppercase tracking-wider" style={{ cursor: 'default' }}>DRAFTS</button>
                <button className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold leading-none uppercase tracking-wider" style={{ cursor: 'default' }}>SAVE AND CLOSE</button>
              </>}
              code={`/* Shadow Surface — canonical header action button */
className="inline-flex items-center justify-center
  h-10 px-6 rounded-xl
  border border-[hsl(var(--ui-border))]
  bg-[hsl(var(--ui-surface-2))]
  text-[hsl(var(--ui-text))]
  shadow-[0_10px_30px_rgba(0,0,0,0.35)]
  text-[10px] font-bold leading-none uppercase tracking-wider"`}
            />
            <EntryCard name="AI Generate Button" pageTag="Story Builder"
              specs="<strong>bg:</strong> gradient (purple) · <strong>color:</strong> white · <strong>text-[10px] / font-bold / uppercase</strong> · <strong>border-radius:</strong> rounded-xl (12px) · <strong>height:</strong> h-10 (40px)"
              preview={
                <button style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', color: '#fff', height: 40, padding: '0 22px', borderRadius: 12, border: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, cursor: 'default', fontFamily: 'inherit' }}>AI GENERATE</button>
              }
              code={`background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
height: 40px; border-radius: 12px;
text-[10px] font-bold uppercase tracking-wider`}
            />
            <EntryCard name='Dashed "Add" Buttons' pageTag="Story Builder"
              specs='<strong>border:</strong> 2px dashed #71717a · <strong>color:</strong> #60a5fa · <strong>14px / 500</strong> · <strong>border-radius:</strong> 12px · <strong>bg:</strong> transparent · Full-width'
              previewPlain previewStyle={{ flexDirection: 'column' }}
              preview={
                <button style={{ width: '100%', minHeight: 64, padding: '12px 18px', borderRadius: 12, border: '2px dashed #71717a', background: 'transparent', color: '#60a5fa', fontSize: 14, fontWeight: 500, cursor: 'default', fontFamily: 'inherit' }}>+ Add Custom Content</button>
              }
              code={`border: 2px dashed #71717a; color: #60a5fa;
border-radius: 12px; width: 100%;
hover: border-color: #60a5fa; bg: rgba(96,165,250,0.12);`}
            />

            <div style={fullSpan}><PageSubheading>My Stories Page</PageSubheading></div>

            <EntryCard name="Card Hover Buttons — Edit / Delete / Play" pageTag="My Stories"
              specs='Compact card variant: <strong>h-8 px-4 rounded-xl</strong> · <strong>text-[10px] font-bold leading-none uppercase tracking-wider</strong>. Edit: bg-white text-slate-900. Delete: bg-[hsl(var(--destructive))]. Play: bg-blue-600.'
              preview={<>
                <button className="h-8 px-4 rounded-xl bg-white text-slate-900 text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>EDIT</button>
                <button className="h-8 px-4 rounded-xl bg-[hsl(var(--destructive))] text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>DELETE</button>
                <button className="h-8 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>PLAY</button>
              </>}
              code={`/* Card hover buttons (compact h-8 variant) */
h-8 px-4 rounded-xl text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl
/* Edit: bg-white text-slate-900 */
/* Delete: bg-[hsl(var(--destructive))] text-white */
/* Play: bg-blue-600 text-white */`}
            />
            <EntryCard name="Tab Pills — Active / Inactive" pageTag="My Stories"
              specs="<strong>Active:</strong> bg #4a5f7f, white text, rounded-full · <strong>Inactive:</strong> transparent, #a1a1aa text · Both 12px / 700"
              preview={<>
                <button className="bg-[#4a5f7f] text-white text-xs font-bold px-4 py-1.5 rounded-full" style={{ cursor: 'default' }}>My Stories</button>
                <button className="text-zinc-400 text-xs font-bold px-4 py-1.5 rounded-full" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>Community</button>
              </>}
              code={`/* Active */  bg-[#4a5f7f] text-white rounded-full px-4 py-1.5
/* Inactive */ bg-transparent text-[#a1a1aa]
/* Both */ text-xs font-bold`}
            />

            <div style={fullSpan}><PageSubheading>Community Gallery</PageSubheading></div>

            <EntryCard name="Gallery Icon Buttons — Like / Save" pageTag="Gallery"
              specs='<strong>h-8 w-8 rounded-xl</strong> · Icon buttons. Default: bg-white/90 text-slate-700. Active Like: bg-rose-500 text-white. Active Save: bg-amber-500 text-white.'
              preview={<>
                <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-2xl" style={{ cursor: 'default' }}>♡</button>
                <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-rose-500 text-white shadow-2xl" style={{ cursor: 'default' }}>♥</button>
                <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xl" style={{ cursor: 'default' }}>🔖</button>
              </>}
              code={`/* Default */ h-8 w-8 rounded-xl bg-white/90 text-slate-700 shadow-2xl
/* Liked */  bg-rose-500 text-white
/* Saved */  bg-amber-500 text-white
/* Source: GalleryStoryCard.tsx lines 108-137 */`}
            />
            <EntryCard name="Gallery PLAY Button" pageTag="Gallery"
              specs='<strong>h-8 px-4 rounded-xl bg-blue-600</strong> · text-[10px] font-bold uppercase tracking-wider shadow-2xl. Same compact card variant as My Stories.'
              preview={
                <button className="h-8 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>PLAY</button>
              }
              code={`h-8 px-4 rounded-xl bg-blue-600 text-white
text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl`}
            />
            <EntryCard name="Gallery Search Button" pageTag="Gallery"
              specs='<strong>bg:</strong> #4a5f7f · <strong>text:</strong> white · <strong>text-sm font-semibold</strong> · <strong>rounded-lg</strong> · Positioned absolute inside search input.'
              preview={
                <button className="px-4 py-1.5 bg-[#4a5f7f] text-white rounded-lg font-semibold text-sm" style={{ cursor: 'default' }}>Search</button>
              }
              code={`px-4 py-1.5 bg-[#4a5f7f] text-white rounded-lg font-semibold text-sm
hover:bg-[#5a6f8f]`}
            />
            <EntryCard name="Browse Categories Button" pageTag="Gallery"
              specs='<strong>bg:</strong> #4a5f7f · <strong>text:</strong> white · <strong>text-sm font-semibold</strong> · <strong>rounded-lg</strong> · Shows filter count badge (bg-white/20).'
              preview={
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#4a5f7f] text-white font-semibold text-sm" style={{ cursor: 'default' }}>
                  ▦ Browse Categories
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">3</span>
                </button>
              }
              code={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm
bg-[#4a5f7f] text-white hover:bg-[#5a6f8f]
/* Filter count badge: px-1.5 py-0.5 bg-white/20 rounded-full text-xs */`}
            />

            <div style={fullSpan}><PageSubheading>Chat Interface</PageSubheading></div>

            <EntryCard name="Chat Settings / Generate Image Buttons" pageTag="Chat"
              specs='Shadow Surface variant with icon. <strong>rounded-xl px-4 py-2</strong> · text-[10px] font-bold uppercase tracking-widest. Uses --ui-surface-2 and --ui-border tokens.'
              preview={<>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>⚙ Chat Settings</button>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>🖼 Generate Image</button>
              </>}
              code={`inline-flex items-center gap-2 rounded-xl px-4 py-2
text-[10px] font-bold uppercase tracking-widest border
bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))]
text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]`}
            />
            <EntryCard name="Chat Send Button (Active / Inactive)" pageTag="Chat"
              specs='<strong>Active:</strong> bg-[#4a5f7f] text-white border-[#4a5f7f]. <strong>Inactive:</strong> bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text-muted))] opacity-50.'
              preview={<>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-[#4a5f7f] text-white border border-[#4a5f7f] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Send</button>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-zinc-500 opacity-50 shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Send</button>
              </>}
              code={`/* Active (has input) */
bg-[#4a5f7f] text-white border-[#4a5f7f] hover:bg-[#5a6f8f]
/* Inactive (empty input) */
bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text-muted))] opacity-50`}
            />
            <EntryCard name="Chat Message Action Icons" pageTag="Chat"
              specs='Icon-only buttons visible on hover. <strong>p-2 rounded-lg</strong> · text-slate-400 hover:text-white · hover:bg-white/10.'
              preview={<>
                <button className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>↻</button>
                <button className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>⋮</button>
                <button className="p-2 rounded-lg text-green-400 hover:bg-white/10" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✓</button>
                <button className="p-2 rounded-lg text-red-400 hover:bg-white/10" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✕</button>
              </>}
              code={`p-2 rounded-lg hover:bg-white/10 transition-colors
/* Default: text-slate-400 hover:text-white */
/* Save (inline edit): text-green-400 */
/* Cancel: text-red-400 */`}
            />

            <div style={fullSpan}><PageSubheading>Chat History</PageSubheading></div>

            <EntryCard name="Session Delete Button" pageTag="Chat History"
              specs='<strong>p-2 rounded-lg bg-white/10 border border-white/10</strong> · text-zinc-400. Hover: text-red-400, border-red-500/30.'
              preview={
                <button className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400" style={{ cursor: 'default' }}>🗑</button>
              }
              code={`p-2 rounded-lg bg-white/10 border border-white/10
text-zinc-400 hover:bg-white/15 hover:text-red-400 hover:border-red-500/30`}
            />
            <EntryCard name="Load More Button" pageTag="Chat History"
              specs='Shadow Surface variant. <strong>px-6 py-2 rounded-xl</strong> · text-sm font-bold. Uses --ui-surface-2 and --ui-border tokens.'
              preview={
                <button className="px-6 py-2 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-sm font-bold" style={{ cursor: 'default' }}>Load More (15 remaining)</button>
              }
              code={`px-6 py-2 rounded-xl
border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))]
text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
text-sm font-bold`}
            />

            <div style={fullSpan}><PageSubheading>Image Library</PageSubheading></div>

            <EntryCard name="Folder Hover Buttons — Edit / Open" pageTag="Image Library"
              specs='<strong>px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider</strong>. Edit: bg-white text-slate-900. Open: bg-blue-600 text-white.'
              preview={<>
                <button className="px-4 py-2 bg-white text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl" style={{ cursor: 'default' }}>Edit</button>
                <button className="px-4 py-2 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl" style={{ cursor: 'default' }}>Open</button>
              </>}
              code={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xl
/* Edit: bg-white text-slate-900 */
/* Open: bg-blue-600 text-white */`}
            />

            <div style={fullSpan}><PageSubheading>Account Page</PageSubheading></div>

            <EntryCard name="Account Tab Pills (Dark Variant)" pageTag="Account"
              specs='<strong>Active:</strong> bg-[#4a5f7f] text-white shadow-sm. <strong>Inactive:</strong> text-[#a1a1aa] hover:text-[#e4e4e7]. <strong>Container:</strong> bg-[#2b2b2e] rounded-full p-1. Same pattern used on Gallery page sort pills.'
              preview={
                <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5">
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#4a5f7f] text-white shadow-sm" style={{ cursor: 'default' }}>Settings</button>
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold text-[#a1a1aa]" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>Subscription</button>
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold text-[#a1a1aa]" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>Profile</button>
                </div>
              }
              code={`/* Container */ bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]
/* Active */   px-4 py-1.5 rounded-full text-xs font-bold bg-[#4a5f7f] text-white shadow-sm
/* Inactive */ px-4 py-1.5 rounded-full text-xs font-bold text-[#a1a1aa] hover:text-[#e4e4e7]`}
            />

            <div style={fullSpan}><PageSubheading>Auth Page</PageSubheading></div>

            <EntryCard name="Auth Submit Button" pageTag="Auth"
              specs='<strong>bg-purple-600 hover:bg-purple-700</strong> · text-white · Full-width. Uses shadcn Button component with override classes.'
              preview={
                <button className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-md text-sm font-medium" style={{ cursor: 'default' }}>Sign In</button>
              }
              code={`/* Uses shadcn <Button> with overrides */
className="w-full bg-purple-600 hover:bg-purple-700 text-white"
/* Source: Auth.tsx line 158 */`}
            />
            <EntryCard name="Auth Toggle Link" pageTag="Auth"
              specs={'Unstyled button link. <strong>text-purple-400 hover:text-purple-300 text-sm</strong>. "Don\'t have an account? Sign up" / "Already have an account? Sign in".'}
              preview={
                <button className="text-purple-400 hover:text-purple-300 text-sm" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>{"Don't have an account? Sign up"}</button>
              }
              previewDark
              code={`text-purple-400 hover:text-purple-300 text-sm
/* Unstyled button — no bg, no border */`}
            />

            <div style={fullSpan}><PageSubheading>Chronicle UI.tsx — Parallel Button System</PageSubheading></div>
            <div style={fullSpan}>
              <InconsistencyNote items={[
                { file: 'UI.tsx', note: 'Defines a completely separate Button component with 7 variants (primary, secondary, danger, ghost, brand, outlineDark, gradient). Uses rounded-xl px-4 py-2 text-sm font-semibold + active:scale-95 — different from both shadcn Button and Shadow Surface standard.' },
                { file: 'Global', note: 'Two parallel button systems coexist: shadcn Button (Auth, some modals) vs Chronicle UI.tsx Button (StoryHub, Chat, WorldTab, ModelSettings, ~50% of app).' },
              ]} />
            </div>

            <EntryCard name="Chronicle UI.tsx — Primary" pageTag="Chronicle UI System"
              specs='<strong>bg-slate-900 text-white border-slate-900</strong> · rounded-xl px-4 py-2 text-sm font-semibold · active:scale-95. Used across StoryHub, CharactersTab, WorldTab, ModelSettings.'
              preview={
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-slate-900 text-white border-slate-900 shadow-md" style={{ cursor: 'default' }}>Primary</button>
              }
              code={`/* Chronicle UI.tsx Button — primary */
bg-slate-900 text-white border-slate-900 hover:bg-slate-800
rounded-xl px-4 py-2 text-sm font-semibold active:scale-95 shadow-md`}
            />
            <EntryCard name="Chronicle UI.tsx — Brand / Gradient / OutlineDark" pageTag="Chronicle UI System"
              specs='<strong>Brand:</strong> bg-[#4a5f7f] text-white. <strong>Gradient:</strong> bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 text-white. <strong>OutlineDark:</strong> bg-zinc-900/80 text-white border-zinc-600.'
              preview={<>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-[#4a5f7f] text-white border-[#4a5f7f] shadow-md" style={{ cursor: 'default' }}>Brand</button>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border-0 bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 text-white shadow-lg" style={{ cursor: 'default' }}>Gradient</button>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-zinc-900/80 text-white border-zinc-600" style={{ cursor: 'default' }}>Outline Dark</button>
              </>}
              previewDark
              code={`/* Brand */ bg-[#4a5f7f] text-white border-[#4a5f7f] shadow-md
/* Gradient */ bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 border-0 shadow-lg
/* OutlineDark */ bg-zinc-900/80 text-white border-zinc-600`}
            />

            <div style={fullSpan}><PageSubheading>Creator Profile</PageSubheading></div>

            <EntryCard name="Follow / Unfollow Toggle" pageTag="Creator Profile"
              specs='<strong>Follow:</strong> bg-[#4a5f7f] text-white shadow-lg. <strong>Following:</strong> bg-white/10 text-white. Rounded-xl px-6 py-2.5 text-sm font-bold. Brand accent toggle pattern.'
              preview={<>
                <button className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold bg-[#4a5f7f] text-white shadow-lg" style={{ cursor: 'default' }}>Follow</button>
                <button className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold bg-white/10 text-white" style={{ cursor: 'default' }}>Following ✓</button>
              </>}
              previewDark
              code={`/* Follow */ bg-[#4a5f7f] text-white shadow-lg rounded-xl px-6 py-2.5
/* Following */ bg-white/10 text-white rounded-xl px-6 py-2.5`}
            />

            <div style={fullSpan}><PageSubheading>Upload Source Menu</PageSubheading></div>

            <EntryCard name="UploadSourceMenu Dropdown (Light Theme)" pageTag="Modals"
              specs='Uses Chronicle UI.tsx Button as trigger. Dropdown content: <strong>bg-white border-slate-200 shadow-lg</strong>. Items: standard Radix DropdownMenuItem. Light-theme dropdown appearing over dark-themed modals.'
              preview={
                <div className="bg-white border border-slate-200 rounded-md shadow-lg p-1" style={{ width: 180 }}>
                  <div className="px-2 py-1.5 text-sm text-slate-900 rounded-sm" style={{ cursor: 'default' }}>📤 From Device</div>
                  <div className="px-2 py-1.5 text-sm text-slate-900 rounded-sm" style={{ cursor: 'default' }}>🖼 From Library</div>
                </div>
              }
              code={`/* Trigger: Chronicle UI.tsx Button */
/* Dropdown: bg-white border-slate-200 shadow-lg */
/* ⚠ Light-theme dropdown on dark-themed modals */`}
            />
            <InconsistencyNote items={[
              { file: 'UploadSourceMenu.tsx', note: 'Uses bg-white border-slate-200 dropdown appearing over dark-themed modal content. Should match dark dropdown standard (bg-zinc-800 border-white/10).' },
            ]} />

            <div style={fullSpan}><PageSubheading>Global Sidebar</PageSubheading></div>

            <EntryCard name="Sidebar Navigation Item" pageTag="Global"
              specs='<strong>Active:</strong> bg-[#4a5f7f] shadow-lg shadow-black/40 text-white. <strong>Inactive:</strong> text-slate-400 hover:bg-white/10 hover:text-white. <strong>rounded-xl</strong> · font-bold text-sm. Collapsed: px-3 py-3 centered. Expanded: px-4 py-3.'
              preview={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-sm text-white bg-[#4a5f7f] shadow-lg" style={{ cursor: 'default', border: 'none' }}>📚 My Stories</button>
                  <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-sm text-slate-400" style={{ cursor: 'default', border: 'none', background: 'transparent' }}>💬 Chat History</button>
                </div>
              }
              previewPlain previewStyle={{ flexDirection: 'column' }}
              code={`/* Active */
bg-[#4a5f7f] shadow-lg shadow-black/40 text-white
/* Inactive */
text-slate-400 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-black/20
/* Shared */
w-full flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-sm`}
            />
            <EntryCard name="Sidebar Collapse Toggle" pageTag="Global"
              specs='<strong>p-2 rounded-lg</strong> · text-slate-400 hover:text-white hover:bg-white/10. Uses PanelLeft / PanelLeftClose icons.'
              preview={
                <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>◀</button>
              }
              code={`p-2 rounded-lg text-slate-400
hover:text-white hover:bg-white/10 transition-colors`}
            />

            <div style={fullSpan}><PageSubheading>Character Builder</PageSubheading></div>

            <EntryCard name="AI Enhance Sparkle Button" pageTag="Character Builder"
              specs='<strong>p-1.5 rounded-md</strong> · text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10. Uses <code>Sparkles size={14}</code>. Opens EnhanceModeModal.'
              preview={
                <button className="p-1.5 rounded-md text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✨</button>
              }
              code={`p-1.5 rounded-md text-zinc-400
hover:text-blue-400 hover:bg-blue-500/10 transition-colors
/* Sparkles size={14} */`}
            />
            <EntryCard name="EnhanceModeModal Option Cards" pageTag="Character Builder"
              specs='<strong>p-5 rounded-2xl border border-white/10 bg-zinc-800/50</strong>. Icon container: <strong>w-10 h-10 rounded-xl bg-blue-500/20</strong> (Precise) or <strong>bg-purple-500/20</strong> (Detailed). Hover: border-blue-500/50 bg-blue-500/10.'
              previewDark
              preview={<>
                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-zinc-800/50 hover:border-blue-500/50" style={{ cursor: 'default', width: 120 }}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">✨</div>
                  <span className="text-white font-bold text-xs">Precise</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-zinc-800/50 hover:border-purple-500/50" style={{ cursor: 'default', width: 120 }}>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">≡</div>
                  <span className="text-white font-bold text-xs">Detailed</span>
                </button>
              </>}
              code={`p-5 rounded-2xl border border-white/10 bg-zinc-800/50
hover:border-blue-500/50 hover:bg-blue-500/10
/* Icon: w-10 h-10 rounded-xl bg-blue-500/20 */
/* Alt:  w-10 h-10 rounded-xl bg-purple-500/20 */`}
            />
            <InconsistencyNote items={[
              { file: 'EnhanceModeModal.tsx', note: 'Uses rounded-2xl for option cards, but CharacterCreationModal uses rounded-xl for similar option patterns.' },
            ]} />

            <EntryCard name="ExtraRow Delete Button" pageTag="Character Builder"
              specs='<strong>p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/30</strong>. X icon to remove user-created custom trait rows.'
              preview={
                <button className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✕</button>
              }
              code={`p-1 rounded text-red-400
hover:text-red-300 hover:bg-red-900/30 transition-colors`}
            />

            <div style={fullSpan}><PageSubheading>Model Settings</PageSubheading></div>

            <EntryCard name="Model Selection Card (Active / Inactive)" pageTag="Model Settings"
              specs='<strong>Active:</strong> bg-slate-900 border-slate-900 shadow-xl scale-[1.02]. <strong>Inactive:</strong> bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg hover:scale-[1.01]. Light theme — unique to this page.'
              preview={<>
                <button className="text-left p-3 rounded-xl border bg-slate-900 border-slate-900 shadow-xl" style={{ cursor: 'default', width: 160, transform: 'scale(1.02)' }}>
                  <div className="text-white font-bold text-xs">Grok Beta</div>
                  <div className="text-slate-400 text-[9px] mt-0.5">Selected model</div>
                </button>
                <button className="text-left p-3 rounded-xl border bg-white border-slate-200" style={{ cursor: 'default', width: 160 }}>
                  <div className="text-slate-900 font-bold text-xs">Grok 2</div>
                  <div className="text-slate-500 text-[9px] mt-0.5">Inactive model</div>
                </button>
              </>}
              code={`/* Active */
bg-slate-900 border-slate-900 shadow-xl scale-[1.02]
text-white
/* Inactive */
bg-white border-slate-200 hover:border-blue-400
hover:shadow-lg hover:scale-[1.01]
text-slate-900`}
            />
            <InconsistencyNote items={[
              { file: 'ModelSettingsTab.tsx', note: 'LIGHT THEME page (bg-white, text-slate-900) while every other page uses dark theme. Major inconsistency.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Image Library</PageSubheading></div>

            <EntryCard name="New Folder Dashed Card" pageTag="Image Library"
              specs='<strong>border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2rem]</strong>. Hover: border-blue-400. Same aspect-[2/3] as folder cards.'
              previewDark
              preview={
                <div className="border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-blue-400 transition-colors" style={{ width: 100, aspectRatio: '2/3', cursor: 'default' }}>
                  <span className="text-zinc-400 text-lg">+</span>
                  <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider">New Folder</span>
                </div>
              }
              code={`border-2 border-dashed border-zinc-600
bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2rem]
hover:border-blue-400 transition-colors
aspect-[2/3]`}
            />
            <EntryCard name="Folder Delete Button (Circular)" pageTag="Image Library"
              specs='<strong>p-3 bg-black/40 text-white/50 hover:text-rose-500 rounded-full</strong>. Opacity transition. Positioned absolute top-right on folder cards.'
              previewDark
              preview={
                <button className="p-3 bg-black/40 text-white/50 hover:text-rose-500 rounded-full transition-all" style={{ cursor: 'default', border: 'none' }}>🗑</button>
              }
              code={`p-3 bg-black/40 text-white/50
hover:text-rose-500 rounded-full transition-all`}
            />
            <InconsistencyNote items={[
              { file: 'ImageLibraryTab.tsx', note: 'Folder delete uses rounded-full while all other action buttons in the app use rounded-xl.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Story Detail Modal</PageSubheading></div>

            <EntryCard name="Story Detail Action Buttons" pageTag="Story Detail Modal"
              specs='<strong>h-12 bg-white/5 border-white/10 rounded-xl</strong>. Taller than standard (h-12 vs h-10). Toggle states: liked <code>bg-rose-500/20 border-rose-500/50 text-rose-400</code>, saved <code>bg-amber-500/20 border-amber-500/50 text-amber-400</code>. Play: <code>bg-[#3b82f6]</code>.'
              previewDark
              preview={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold" style={{ cursor: 'default' }}>♡ Like</button>
                  <button className="h-12 px-6 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-semibold" style={{ cursor: 'default' }}>♥ Liked</button>
                  <button className="h-12 px-6 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-semibold" style={{ cursor: 'default' }}>★ Saved</button>
                  <button className="h-12 px-6 rounded-xl bg-[#3b82f6] text-white text-xs font-bold" style={{ cursor: 'default' }}>▶ PLAY</button>
                </div>
              }
              code={`/* Base: h-12 bg-white/5 border-white/10 rounded-xl */
/* Liked: bg-rose-500/20 border-rose-500/50 text-rose-400 */
/* Saved: bg-amber-500/20 border-amber-500/50 text-amber-400 */
/* Play: bg-[#3b82f6] text-white */`}
            />

            <div style={fullSpan}><PageSubheading>Review Modal</PageSubheading></div>

            <EntryCard name="Review Submit / Delete Buttons" pageTag="Review Modal"
              specs='<strong>h-11</strong> (non-standard — standard is h-10). Submit: <code>bg-[#4a5f7f] rounded-xl font-semibold text-sm</code>. Delete: <code>bg-red-600/20 border-red-500/30 text-red-400 rounded-xl</code>. Both use text-sm instead of standard text-[10px] uppercase.'
              previewDark
              preview={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="h-11 px-6 rounded-xl bg-[#4a5f7f] text-white text-sm font-semibold" style={{ cursor: 'default' }}>Submit Review</button>
                  <button className="h-11 px-6 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-semibold" style={{ cursor: 'default' }}>Delete Review</button>
                </div>
              }
              code={`/* Submit: h-11 bg-[#4a5f7f] rounded-xl font-semibold text-sm */
/* Delete: h-11 bg-red-600/20 border-red-500/30 text-red-400 */
/* ⚠ Non-standard: h-11 + text-sm vs standard h-10 + text-[10px] */`}
            />
            <InconsistencyNote items={[
              { file: 'ReviewModal.tsx', note: 'Uses h-11 + text-sm for buttons instead of standard h-10 + text-[10px] uppercase.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Share Story Modal</PageSubheading></div>

            <EntryCard name="Share Modal !important Override Buttons" pageTag="Share Story Modal"
              specs='Uses Chronicle UI Button with <code>!important</code> CSS overrides: <code>!bg-blue-600</code>, <code>!bg-rose-500/20</code>. This bypasses the standard Shadow Surface pattern entirely.'
              previewDark
              preview={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider" style={{ cursor: 'default' }}>Publish</button>
                  <button className="h-10 px-6 rounded-xl bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider" style={{ cursor: 'default' }}>Unpublish</button>
                </div>
              }
              code={`/* Uses !important overrides on Chronicle UI Button */
/* !bg-blue-600 — forced blue background */
/* !bg-rose-500/20 — forced semi-transparent rose */
/* ⚠ Bypasses Shadow Surface pattern */`}
            />
            <InconsistencyNote items={[
              { file: 'ShareStoryModal.tsx', note: 'Uses !important CSS overrides on buttons instead of proper variant classes.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Arc System</PageSubheading></div>

            <EntryCard name="Arc Phase Delete Button" pageTag="Arc System"
              specs='<strong>w-[30px] h-[30px] rounded-[10px]</strong> · border border-red-400/50 bg-transparent. Hover: bg-red-500/20. Non-standard sizing — standard buttons use h-10 rounded-xl (12px). This uses 10px radius and 30px dimensions.'
              previewDark
              preview={
                <button className="w-[30px] h-[30px] rounded-[10px] border border-red-400/50 bg-transparent text-red-400 flex items-center justify-center text-xs hover:bg-red-500/20 transition-colors" style={{ cursor: 'default' }}>✕</button>
              }
              code={`w-[30px] h-[30px] rounded-[10px] border border-red-400/50
bg-transparent text-red-400 hover:bg-red-500/20
/* ⚠ Non-standard: rounded-[10px] vs standard rounded-xl (12px) */`}
            />
            <InconsistencyNote items={[
              { file: 'ArcPhaseCard.tsx', note: 'Phase delete button uses rounded-[10px] (10px) and w-[30px] h-[30px] instead of standard rounded-xl (12px) and h-10.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Tag Chips</PageSubheading></div>

            <EntryCard name="Tag Chip Remove Button" pageTag="Scene Tag Editor / Tag Input"
              specs='Blue tag chip with inline X remove. <strong>px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs</strong>. X icon: opacity-50, hover opacity-100. Hover state transitions entire chip to red variant.'
              previewDark
              preview={
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium" style={{ cursor: 'default' }}>
                    <span>fantasy</span><span style={{ opacity: 0.5 }}>✕</span>
                  </button>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-medium" style={{ cursor: 'default' }}>
                    <span>romance</span><span>✕</span>
                  </button>
                </div>
              }
              code={`/* Default: bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full */
/* Hover: bg-red-500/20 text-red-300 border-red-500/30 */
/* X icon: opacity-50 → hover opacity-100 */`}
            />
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 4. FORM INPUTS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="inputs" title="Form Inputs" desc="Input fields and textareas used throughout the application.">
            <PageSubheading>Story Builder Page</PageSubheading>
            <EntryCard name="Text Input / Textarea (Dark Theme)" pageTag="Story Builder"
              specs="<strong>bg:</strong> rgba(24,24,27,0.5) · <strong>color:</strong> white · <strong>border:</strong> 1px solid #3f3f46 · <strong>border-radius:</strong> rounded-lg (8px) · <strong>padding:</strong> 8px 12px · <strong>font-size:</strong> 14px"
              previewDark previewStyle={{ flexDirection: 'column', gap: 12 }}
              preview={<>
                <input readOnly className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 text-white text-sm px-3 py-2 outline-none" placeholder="Enter story arc title..." />
                <input readOnly className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 text-white text-sm px-3 py-2 outline-none" placeholder="e.g. The Lakehouse" />
              </>}
              code={`bg-zinc-900/50 border-zinc-700 text-white text-sm px-3 py-2 rounded-lg`}
            />

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Community Gallery</PageSubheading>
              <EntryCard name="Gallery Search Input" pageTag="Gallery"
                specs='<strong>bg:</strong> bg-[#3a3a3f]/50 · <strong>border:</strong> border-white/10 · <strong>rounded-xl</strong> · <strong>text:</strong> white · <strong>placeholder:</strong> text-zinc-500 · <strong>focus:</strong> ring-2 ring-[#4a5f7f]'
                previewDark previewStyle={{ flexDirection: 'column', gap: 12 }}
                preview={
                  <input readOnly className="w-full pl-12 pr-24 py-3 bg-[#3a3a3f]/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 outline-none" placeholder="Search titles, descriptions, or #tags..." />
                }
                code={`w-full pl-12 pr-24 py-3
bg-[#3a3a3f]/50 border border-white/10 rounded-xl
text-white placeholder:text-zinc-500
focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Chat Interface</PageSubheading>
              <EntryCard name="Chat Input Textarea (White BG)" pageTag="Chat"
                specs='<strong>bg:</strong> white · <strong>text:</strong> black · <strong>border:</strong> none (wrapper has border) · <strong>rounded-xl</strong> · <strong>focus:</strong> ring-1 ring-[hsl(var(--accent-teal))]/30. Inside a bg-[hsl(var(--ui-surface-2))] wrapper.'
                previewStyle={{ flexDirection: 'column', gap: 8 }}
                preview={
                  <div className="bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] rounded-2xl p-2 w-full">
                    <textarea readOnly className="block w-full bg-white text-black placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none border-0 resize-none" placeholder="Describe your action or dialogue..." rows={2} />
                  </div>
                }
                code={`/* Outer wrapper */
bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] rounded-2xl p-2
/* Inner textarea */
bg-white text-black placeholder-gray-400 rounded-xl px-4 py-3 text-sm
border-0 resize-none focus:ring-1 focus:ring-[hsl(var(--accent-teal))]/30`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Account Page</PageSubheading>
              <EntryCard name="Account Password Input (Dark Theme)" pageTag="Account"
                specs='<strong>bg:</strong> #2a2a2f · <strong>border:</strong> border-white/10 · <strong>rounded-xl</strong> · <strong>text:</strong> white text-sm · <strong>focus:</strong> ring-2 ring-[#4a5f7f]. Includes visibility toggle button.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 12 }}
                preview={
                  <input readOnly type="password" className="w-full bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none" placeholder="••••••••" />
                }
                code={`w-full bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-3
text-white text-sm focus:ring-2 focus:ring-[#4a5f7f]`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Auth Page</PageSubheading>
              <EntryCard name="Auth Input (Semi-transparent)" pageTag="Auth"
                specs='<strong>bg:</strong> bg-slate-700/50 · <strong>border:</strong> border-slate-600 · <strong>text:</strong> white · <strong>placeholder:</strong> text-slate-500. Uses shadcn Input component with overrides.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 12 }}
                preview={<>
                  <input readOnly className="w-full rounded-md border border-slate-600 bg-slate-700/50 text-white text-sm px-3 py-2 outline-none placeholder:text-slate-500" placeholder="you@example.com" />
                  <input readOnly type="password" className="w-full rounded-md border border-slate-600 bg-slate-700/50 text-white text-sm px-3 py-2 outline-none placeholder:text-slate-500" placeholder="••••••••" />
                </>}
                code={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500
/* Uses shadcn Input with className overrides */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Character Library Search</PageSubheading>
              <EntryCard name="Header Search (Dark Pill)" pageTag="Character Library"
                specs='<strong>bg:</strong> bg-[#2b2b2e] rounded-full · <strong>h-7 w-56 px-3 py-1</strong> · <strong>text-xs font-bold</strong> · text-white placeholder:text-zinc-500. Sits inside dark pill container in white header.'
                preview={
                  <div className="bg-[#2b2b2e] rounded-full p-1">
                    <input readOnly className="h-7 w-56 px-3 py-1 text-xs font-bold rounded-full bg-transparent text-white placeholder:text-zinc-500 outline-none" placeholder="Search characters..." />
                  </div>
                }
                code={`/* Container */ bg-[#2b2b2e] rounded-full p-1
/* Input */ h-7 w-56 px-3 py-1 text-xs font-bold rounded-full
bg-transparent text-white placeholder:text-zinc-500`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Character Builder</PageSubheading>
              <EntryCard name="HardcodedRow Textarea (Borderless)" pageTag="Character Builder"
                specs='<strong>bg:</strong> bg-zinc-900/50 · <strong>border:</strong> border-white/10 (very subtle) · <strong>rounded-lg</strong> · <strong>text:</strong> text-zinc-300 text-sm. Used for trait values inside HardcodedRow layout.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 12 }}
                preview={
                  <textarea readOnly className="w-full rounded-lg border border-white/10 bg-zinc-900/50 text-zinc-300 text-sm px-3 py-2 outline-none resize-none" rows={2} placeholder="Athletic build; tall; sharp jawline..." />
                }
                code={`bg-zinc-900/50 border border-white/10 rounded-lg
text-zinc-300 text-sm px-3 py-2 resize-none`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Chat Settings — LabeledToggle</PageSubheading>
              <EntryCard name="LabeledToggle Component" pageTag="Chat Settings"
                specs='Custom toggle with Off/On labels. <strong>Track:</strong> h-5 w-9 rounded-full. <strong>Thumb:</strong> h-4 w-4 rounded-full bg-white. <strong>On:</strong> bg-blue-500, On label text-blue-500. <strong>Off:</strong> bg-zinc-600, Off label text-zinc-200. <strong>Locked:</strong> bg-zinc-500 + Lock icon.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 16 }}
                preview={<>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-500">Off</span>
                    <div className="relative h-5 w-9 rounded-full bg-blue-500">
                      <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md" style={{ transform: 'translateX(16px)' }} />
                    </div>
                    <span className="text-xs font-semibold text-blue-500">On</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-200">Off</span>
                    <div className="relative h-5 w-9 rounded-full bg-zinc-600">
                      <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md" style={{ transform: 'translateX(2px)' }} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500">On</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 opacity-70">
                    <span className="text-xs font-semibold text-zinc-200">Off</span>
                    <div className="relative h-5 w-9 rounded-full bg-zinc-500">
                      <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md" style={{ transform: 'translateX(2px)' }} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500">On</span>
                    <span className="text-zinc-500 text-xs">🔒</span>
                  </div>
                </>}
                code={`/* Track */ h-5 w-9 rounded-full
/* On: bg-blue-500 | Off: bg-zinc-600 | Locked: bg-zinc-500 */
/* Thumb */ h-4 w-4 rounded-full bg-white shadow-md
/* On label: text-blue-500 | Off label: text-zinc-200 */
/* Locked: opacity-70 + Lock icon w-3 h-3 text-zinc-500 */`}
              />
            </div>

            <PageSubheading>Image Generation Modals (Light Theme)</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Light-Theme Generation Textarea" pageTag="AI Generation Modals"
                specs='<strong>bg-slate-50 border-slate-200</strong>. Focus: <code>ring-2 ring-blue-100 border-blue-400</code>. Uses shadcn light-theme defaults — unique to Avatar, Cover Image, and Scene Image generation modals. Every other textarea in the app uses dark theme.'
                preview={
                  <textarea readOnly className="w-full min-h-[60px] rounded-md border bg-slate-50 border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" placeholder="Describe your character's appearance..." />
                }
                code={`bg-slate-50 border-slate-200 text-sm
focus:ring-2 focus:ring-blue-100 focus:border-blue-400
/* ⚠ Light theme — only used in generation modals */`}
              />
            </div>

            <PageSubheading>Review Modal</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Review Textarea (Frosted)" pageTag="Review Modal"
                specs='<strong>bg-white/5 border-white/10</strong>. Text: white. Placeholder: <code>text-white/30</code>. Yet another dark textarea variant distinct from Story Builder (bg-zinc-900/50 border-zinc-700).'
                previewDark
                preview={
                  <textarea readOnly className="w-full min-h-[60px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 px-3 py-2 text-sm" placeholder="Share your thoughts..." />
                }
                code={`bg-white/5 border-white/10 text-white
placeholder:text-white/30 rounded-lg text-sm`}
              />
            </div>

            <PageSubheading>Memories Modal</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Memories Select / Textarea (Slate)" pageTag="Memories Modal"
                specs='<strong>bg-slate-900 border-slate-600</strong> (trigger), <strong>bg-slate-800 border-slate-600</strong> (content). Uses slate-* palette throughout while the app standard is zinc-*.'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <div className="h-10 px-3 rounded-md bg-slate-900 border border-slate-600 text-white text-sm flex items-center">Day 1</div>
                    <textarea readOnly className="w-full min-h-[40px] rounded-md bg-slate-800/70 border border-purple-500/30 text-white placeholder:text-slate-400 px-3 py-2 text-sm" placeholder="Add a memory..." />
                  </div>
                }
                code={`/* Select trigger: bg-slate-900 border-slate-600 */
/* Select content: bg-slate-800 border-slate-600 */
/* Add form: bg-slate-800/70 border-purple-500/30 */
/* ⚠ Uses slate-* instead of app-standard zinc-* */`}
              />
              <InconsistencyNote items={[
                { file: 'MemoriesModal.tsx', note: 'Uses slate-* palette throughout while every other dark component uses zinc-*.' },
              ]} />
            </div>

            <PageSubheading>GuidanceStrengthSlider</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="GuidanceStrengthSlider (Custom 3-Point)" pageTag="Story Builder"
                specs='Custom 3-point slider (Rigid / Normal / Flexible). <strong>Track:</strong> 12px height, bg <code>rgba(21,25,34,0.95)</code>. <strong>Fill:</strong> <code>linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)</code>. <strong>Knob:</strong> w-6 h-6 rounded-full bg-white border-[3px] border-blue-500. Labels: <code>text-[10px] font-black uppercase tracking-widest</code>. Active label: text-blue-400, inactive: text-zinc-500.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 8 }}
                preview={
                  <div style={{ width: '100%' }}>
                    <div style={{ position: 'relative', height: 12, borderRadius: 999, background: 'rgba(21,25,34,0.95)' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '50%', borderRadius: 999, background: 'linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '3px solid #3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rigid</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Normal</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Flexible</span>
                    </div>
                  </div>
                }
                code={`/* Track: h-[12px] rounded-full bg-[rgba(21,25,34,0.95)] */
/* Fill: linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5) */
/* Knob: w-6 h-6 rounded-full bg-white border-[3px] border-blue-500 */
/* Labels: text-[10px] font-black uppercase tracking-widest */
/* Active: text-blue-400 | Inactive: text-zinc-500 */
/* Description box: bg-zinc-900 rounded-xl p-4 border-white/5 */`}
              />
            </div>

            <PageSubheading>TagInput Component</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="TagInput (Enter-to-Add)" pageTag="Story Builder / Scene Tag Editor"
                specs='Input field with enter-to-add pattern. <strong>Input:</strong> <code>bg-zinc-800 border-zinc-700 rounded-lg text-sm</code>. Tags appear as blue chips above (<code>bg-blue-500/20 text-blue-300 rounded-full</code>). Counter: <code>text-[10px] text-zinc-500</code>. Max 10 tags.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 8 }}
                preview={
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium inline-flex items-center gap-1">tag1 <span style={{ opacity: 0.5 }}>✕</span></span>
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium inline-flex items-center gap-1">tag2 <span style={{ opacity: 0.5 }}>✕</span></span>
                    </div>
                    <input readOnly className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 outline-none" placeholder="Add tag and press Enter..." />
                    <p className="text-[10px] text-zinc-500 mt-1.5">2/10 tags — Press Enter to add</p>
                  </div>
                }
                code={`/* Input: bg-zinc-800 border-zinc-700 rounded-lg text-sm */
/* Tags: bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full */
/* Counter: text-[10px] text-zinc-500 */
/* Max: 10 tags */`}
              />
            </div>

            <PageSubheading>Scene Tag Editor Input</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Scene Tag Editor Input (Dark)" pageTag="Scene Tag Editor"
                specs='<strong>bg-zinc-800 border-zinc-700 rounded-lg</strong>. Focus: <code>border-[#4a5f7f]</code>. Text: white, placeholder text-zinc-500. Used in the custom overlay SceneTagEditorModal.'
                previewDark
                preview={
                  <input readOnly className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 outline-none" placeholder="Untitled scene" />
                }
                code={`bg-zinc-800 border-zinc-700 rounded-lg text-sm text-white
placeholder:text-zinc-500 focus:border-[#4a5f7f]`}
              />
            </div>

            <PageSubheading>Chronicle UI.tsx — Parallel Input System</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Chronicle UI.tsx Input (Light Theme)" pageTag="Chronicle UI System"
                specs='<strong>bg-slate-50 border-slate-200 rounded-2xl</strong>. Light-theme input used across StoryHub, CharactersTab, WorldTab, ModelSettings, PublicProfileTab. Different from shadcn Input and all dark-themed inputs. Label: <code>text-xs font-bold uppercase</code>.'
                preview={
                  <div style={{ width: '100%' }}>
                    <label className="block text-xs font-bold uppercase mb-1 text-slate-500">Label</label>
                    <input readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Chronicle UI Input..." />
                  </div>
                }
                code={`/* Chronicle UI.tsx Input */
rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm
focus:ring-2 focus:ring-blue-100 focus:border-blue-400
/* Label: text-xs font-bold uppercase text-slate-500 */
/* ⚠ Light theme — used across ~50% of the app */`}
              />
              <EntryCard name="Chronicle UI.tsx TextArea (Light Theme)" pageTag="Chronicle UI System"
                specs='Same styling as Chronicle Input. <strong>bg-slate-50 border-slate-200 rounded-2xl</strong>. Supports autoResize prop. Used in CharacterEditForm, WorldTab, ShareStoryModal.'
                preview={
                  <textarea readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none resize-none" rows={2} placeholder="Chronicle UI TextArea..." />
                }
                code={`/* Chronicle UI.tsx TextArea */
rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none
focus:ring-2 focus:ring-blue-100 focus:border-blue-400
/* ⚠ Light theme — same issue as Chronicle Input */`}
              />
              <EntryCard name="CharacterPicker Search (Dark Override)" pageTag="Character Picker"
                specs='Chronicle UI.tsx Input with <strong>!important overrides</strong> to force dark theme: <code>!bg-zinc-900/50 !border-zinc-700 !text-white</code>. Demonstrates the friction of using light-theme primitives in a dark context.'
                previewDark
                preview={
                  <input readOnly className="w-full rounded-2xl bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" placeholder="Search characters..." />
                }
                code={`/* Chronicle UI.tsx Input with !important dark overrides */
className="!bg-zinc-900/50 !border-zinc-700 !text-white !placeholder:text-zinc-400"
/* ⚠ Demonstrates friction of using light primitives in dark context */`}
              />
              <InconsistencyNote items={[
                { file: 'UI.tsx', note: 'Defines light-theme Input/TextArea (bg-slate-50 border-slate-200) while app is dark-themed. Components using it in dark contexts need !important overrides.' },
                { file: 'CharacterPicker.tsx', note: 'Uses !important CSS overrides to force dark styling on Chronicle UI Input.' },
              ]} />
            </div>

            <PageSubheading>Character Builder Inline Inputs</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Builder Form Row Input (Dark)" pageTag="Character Builder"
                specs='<strong>bg-zinc-900/50 border-white/10 rounded-lg</strong>. Used in collapsible character builder sections for trait values. Label column: <code>w-2/5</code> with same styling. Both label and value share identical input styling. Lock icon (w-3.5 h-3.5 text-zinc-400) marks hardcoded fields.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 8 }}
                preview={
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <div style={{ width: '40%', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#a1a1aa', fontSize: 10 }}>🔒</span>
                      <input readOnly className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm" value="Physical Appearance" />
                    </div>
                    <input readOnly className="flex-1 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm" placeholder="Describe appearance..." />
                  </div>
                }
                code={`/* Label column: w-2/5 */
bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white
/* Lock icon: w-3.5 h-3.5 text-zinc-400 (hardcoded fields) */
/* Value column: flex-1, same input styling */`}
              />
            </div>

            <PageSubheading>Auth Page Dark Inputs</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Auth Login Input (Dark Slate)" pageTag="Auth Page"
                specs='<strong>bg-slate-700/50 border-slate-600 text-white</strong>. Unique dark input variant only used on Auth page. Uses shadcn Input as base with className overrides. Focus ring uses default shadcn ring behavior. Different from both Chronicle UI inputs and standard dark inputs (zinc-*).'
                previewDark
                preview={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <input readOnly className="h-10 w-full rounded-md bg-slate-700/50 border border-slate-600 text-white px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Email address" />
                    <input readOnly type="password" className="h-10 w-full rounded-md bg-slate-700/50 border border-slate-600 text-white px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Password" />
                  </div>
                }
                code={`/* Auth-only dark input variant */
bg-slate-700/50 border-slate-600 text-white rounded-md
placeholder:text-slate-400
/* ⚠ Uses slate-* (unique to Auth) vs zinc-* (rest of app) */
/* ⚠ rounded-md (shadcn) vs rounded-2xl (Chronicle) vs rounded-lg (builder) */`}
              />
              <InconsistencyNote items={[
                { file: 'Auth.tsx', note: 'Uses bg-slate-700/50 border-slate-600 — a third input color system alongside zinc-* (dark) and slate-50 (Chronicle light).' },
              ]} />
            </div>
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 5. BADGES & TAGS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="badges" title="Badges & Tags" desc="Badges on story cards, tag chips, and status indicators.">
            <PageSubheading>Story Builder Page</PageSubheading>
            <EntryCard name="Content Theme Tag Chips" pageTag="Story Builder"
              specs='<strong>bg:</strong> #27272a · <strong>color:</strong> #a1a1aa · <strong>border:</strong> 1px solid #3f3f46 · <strong>12px / 500</strong> · <strong>border-radius:</strong> 8px'
              previewPlain previewStyle={{ gap: 8 }}
              preview={<>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Fantasy</span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Romance</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 8, fontSize: 12, background: 'transparent', border: '2px dashed #71717a', color: '#60a5fa', fontWeight: 500 }}>+ Add custom</span>
              </>}
              code={`bg-zinc-800 border border-zinc-700 text-zinc-400
px-3 py-1.5 rounded-lg text-xs font-medium`}
            />

            <div style={{ marginTop: 24 }}>
              <PageSubheading>My Stories + Gallery Cards</PageSubheading>
              <EntryCard name="SFW / NSFW Badges" pageTag="Cards"
                specs='<strong>bg:</strong> #2a2a2f · <strong>12px / 700</strong> · <strong>rounded-lg</strong> · SFW = <strong>blue-400</strong>, NSFW = <strong>red-400</strong>. Positioned absolute top-right on card.'
                previewPlain
                preview={<>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2a2a2f] text-blue-400">SFW</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2a2a2f] text-red-400">NSFW</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2a2a2f] text-emerald-400 uppercase tracking-wide">Published</span>
                </>}
                code={`px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2a2a2f]
/* SFW */       text-blue-400
/* NSFW */      text-red-400
/* Published */ text-emerald-400 uppercase tracking-wide`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Community Gallery Filters</PageSubheading>
              <EntryCard name="Active Filter Chips" pageTag="Gallery"
                specs='Color-coded by category. <strong>px-2 py-1 rounded-full text-xs font-medium</strong>. Each category uses a different color-500/20 bg with matching color-400 text.'
                previewPlain previewStyle={{ gap: 8 }}
                preview={<>
                  <span className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium">"search text"</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">SFW</span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">Romance</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Original</span>
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">Violence</span>
                </>}
                code={`/* Pattern: px-2 py-1 bg-{color}-500/20 text-{color}-400 rounded-full text-xs font-medium */
/* Search text: bg-white/20 text-white */
/* Story Type:  bg-blue-500/20 text-blue-400 */
/* Genre:       bg-purple-500/20 text-purple-400 */
/* Origin:      bg-green-500/20 text-green-400 */
/* Warnings:    bg-amber-500/20 text-amber-400 */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Chat Interface</PageSubheading>
              <EntryCard name="Character Control Badge" pageTag="Chat"
                specs='<strong>text-[8px] px-1.5 py-0.5 rounded</strong>. User-controlled: bg-blue-500 text-white. AI-controlled: bg-slate-500 text-white. Positioned absolute bottom-right of avatar.'
                previewPlain previewStyle={{ gap: 8 }}
                preview={<>
                  <span className="text-[8px] px-1.5 py-0.5 bg-blue-500 text-white rounded shadow-sm font-bold">User</span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-slate-500 text-white rounded shadow-sm font-bold">AI</span>
                </>}
                code={`text-[8px] px-1.5 py-0.5 shadow-sm border-0
/* User: bg-blue-500 text-white */
/* AI: bg-slate-500 text-white */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Image Library</PageSubheading>
              <EntryCard name="Image Count Badge" pageTag="Image Library"
                specs='<strong>bg-blue-600 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg</strong>. Shows image count in folder cards.'
                previewPlain
                preview={
                  <span className="bg-blue-600 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">12 IMAGES</span>
                }
                code={`bg-blue-600 text-[9px] font-black text-white
px-2 py-1 rounded-md uppercase tracking-widest shadow-lg`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Account Page</PageSubheading>
              <EntryCard name="Subscription Plan Badge" pageTag="Account"
                specs='<strong>bg-[#4a5f7f]/20 text-[#7ba3d4]</strong> · <strong>px-3 py-1.5 rounded-lg text-sm font-bold</strong>.'
                previewPlain
                preview={
                  <span className="px-3 py-1.5 bg-[#4a5f7f]/20 text-[#7ba3d4] rounded-lg text-sm font-bold">Free</span>
                }
                code={`px-3 py-1.5 bg-[#4a5f7f]/20 text-[#7ba3d4] rounded-lg text-sm font-bold`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Character Builder</PageSubheading>
              <EntryCard name="Lock Icon Indicator (HardcodedRow)" pageTag="Character Builder"
                specs='<strong>w-3.5 h-3.5 text-zinc-400</strong>. Lock icon positioned at end of HardcodedRow to indicate read-only status. Only on hardcoded trait sections, not user-added extras.'
                previewPlain previewStyle={{ gap: 12 }}
                preview={<>
                  <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PERSONALITY</span>
                    <span className="text-zinc-400 text-xs">🔒</span>
                  </div>
                </>}
                code={`/* Lock icon: w-3.5 h-3.5 text-zinc-400 (Lucide Lock) */
/* Positioned after label in HardcodedRow */
/* Indicates non-removable, system-defined trait section */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Model Settings</PageSubheading>
              <EntryCard name="Connection Status Badge (Animated)" pageTag="Model Settings"
                specs='<strong>px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest</strong>. Connected: bg-emerald-50 text-emerald-600 border-emerald-100, dot animate-pulse. Checking: bg-amber-50 text-amber-600 border-amber-100, dot animate-bounce. Unlinked: bg-slate-100 text-slate-500.'
                previewPlain previewStyle={{ gap: 8, flexWrap: 'wrap' }}
                preview={<>
                  <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />System Linked
                  </span>
                  <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />Checking...
                  </span>
                  <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />Unlinked
                  </span>
                </>}
                code={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest
/* Connected: bg-emerald-50 text-emerald-600 border-emerald-100, dot animate-pulse */
/* Checking:  bg-amber-50 text-amber-600 border-amber-100, dot animate-bounce */
/* Unlinked:  bg-slate-100 text-slate-500 border-slate-200 */`}
              />
            </div>

            <PageSubheading>Interactive Rating Components</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="StarRating Component" pageTag="Review Modal / Story Detail"
                specs='<strong>Amber stars:</strong> filled <code>text-amber-400 fill-amber-400</code>, empty <code>text-white/20</code>. Interactive: <code>hover:scale-110</code> transition. Sizes: 16px (default), 20px (review display). Used in review forms and story detail review cards.'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {'★★★★☆'.split('').map((s, i) => (
                        <span key={i} style={{ fontSize: 16, color: s === '★' ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>{s === '★' ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>4/5</span>
                  </div>
                }
                code={`/* Filled: text-amber-400 fill-amber-400 */
/* Empty: text-white/20 */
/* Interactive: cursor-pointer hover:scale-110 transition-transform */
/* Non-interactive: cursor-default */`}
              />

              <EntryCard name="SpiceRating Component" pageTag="Review Modal / Story Detail"
                specs='<strong>Red flames:</strong> filled <code>text-red-500 fill-red-500</code>, empty <code>text-white/20</code>. Same interactive pattern as StarRating. Uses Lucide <code>Flame</code> icon. 5-level scale.'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ fontSize: 16, color: i <= 3 ? '#ef4444' : 'rgba(255,255,255,0.2)' }}>🔥</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>3/5</span>
                  </div>
                }
                code={`/* Filled: text-red-500 fill-red-500 */
/* Empty: text-white/20 */
/* Interactive: cursor-pointer hover:scale-110 transition-transform */
/* Uses Lucide Flame icon, maxLevel default: 5 */`}
              />

              <EntryCard name="CircularProgress (SVG Ring)" pageTag="Story Builder / Arc System"
                specs='SVG circle progress ring. <strong>Light variant:</strong> bg stroke #e2e8f0, progress stroke varies by state. <strong>Dark variant:</strong> bg stroke #334155. <strong>States:</strong> 0% → slate (empty), 1-99% → #3b82f6 (blue), 100% → #22c55e (green). Center text: <code>font-bold text-[10px]</code> (or text-lg for size≥80).'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={40} height={40} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={20} cy={20} r={17} stroke="#334155" strokeWidth={3} fill="none" />
                        <circle cx={20} cy={20} r={17} stroke="#3b82f6" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={106.8} strokeDashoffset={53.4} />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>50%</span>
                    </div>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={40} height={40} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={20} cy={20} r={17} stroke="#334155" strokeWidth={3} fill="none" />
                        <circle cx={20} cy={20} r={17} stroke="#22c55e" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={106.8} strokeDashoffset={0} />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: 10, fontWeight: 700, color: '#4ade80' }}>100%</span>
                    </div>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={40} height={40} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={20} cy={20} r={17} stroke="#334155" strokeWidth={3} fill="none" />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>0%</span>
                    </div>
                  </div>
                }
                code={`/* SVG circle: radius = (size - strokeWidth) / 2 */
/* Background stroke: #e2e8f0 (light) or #334155 (dark) */
/* Progress: #3b82f6 (in-progress), #22c55e (complete) */
/* Empty: #475569 (dark) or #94a3b8 (light) */
/* Center: font-bold text-[10px] (size<80) or text-lg */`}
              />

              <EntryCard name="Tag Chips (Blue Rounded-Full)" pageTag="Scene Tag Editor / Tag Input"
                specs='<strong>px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium</strong>. Used in TagInput and SceneTagEditorModal for scene/image tags. Different from content theme chips which use category-specific colors.'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium">landscape</span>
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium">battle</span>
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium">night</span>
                  </div>
                }
                code={`px-2.5 py-1 bg-blue-500/20 text-blue-300
border border-blue-500/30 rounded-full text-xs font-medium
/* ≠ Content theme chips which use category-specific colors */`}
              />

              <EntryCard name="Side Character Control Badge" pageTag="Chat Interface"
                specs='Micro badge showing character control. <strong>User-controlled:</strong> bg-blue-500 text-white text-[8px]. <strong>AI-controlled:</strong> bg-slate-500 text-white text-[8px]. <strong>rounded-md px-1.5 py-0.5</strong>. Smallest text in the app.'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-500 text-white font-bold" style={{ fontSize: 8 }}>USER</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-500 text-white font-bold" style={{ fontSize: 8 }}>AI</span>
                  </div>
                }
                code={`/* User: bg-blue-500 text-white text-[8px] font-bold */
/* AI: bg-slate-500 text-white text-[8px] font-bold */
/* rounded-md px-1.5 py-0.5 */`}
              />
            </div>
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 6. PANELS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="panels" title="Panels" desc="Container patterns: dark rounded panels, card layouts, sidebars, and special containers.">
            <PageSubheading>Story Builder Page</PageSubheading>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Panel Container" pageTag="Story Builder"
                specs="<strong>bg:</strong> #2a2a2f · <strong>border-radius:</strong> rounded-[24px] · <strong>border:</strong> border-white/10 · <strong>box-shadow:</strong> 0 12px 32px -2px rgba(0,0,0,0.5)"
                preview={<div className="w-full h-20 bg-[#2a2a2f] rounded-[24px] border border-white/10" style={{ boxShadow: 'rgba(0,0,0,0.5) 0px 12px 32px -2px' }} />}
                previewPlain
                code={`bg-[#2a2a2f] rounded-[24px] border border-white/10
shadow: rgba(0,0,0,0.5) 0px 12px 32px -2px`}
              />
              <EntryCard name="Panel Header Bar" pageTag="Story Builder"
                specs="<strong>bg:</strong> #4a5f7f · <strong>padding:</strong> px-5 py-3 · <strong>border-bottom:</strong> border-white/20 · <strong>shadow-lg</strong>"
                preview={
                  <div className="w-full bg-[#4a5f7f] rounded-xl px-5 py-3 flex items-center gap-3 border-b border-white/20 shadow-lg">
                    <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-sm">⚙</div>
                    <span className="text-white text-xl font-bold tracking-tight">Story Card</span>
                  </div>
                }
                previewPlain
                code={`bg-[#4a5f7f] px-5 py-3 border-b border-white/20 shadow-lg
/* Title: text-white text-xl font-bold tracking-tight */`}
              />
              <EntryCard name="Story Card (My Stories + Gallery)" pageTag="Cards"
                specs='<strong>aspect-ratio:</strong> 2/3 · <strong>border-radius:</strong> rounded-[2rem] (32px) · <strong>border:</strong> 1px solid #4a5f7f · <strong>shadow:</strong> 0 12px 32px -2px rgba(0,0,0,0.5) · <strong>gradient overlay:</strong> from-slate-950 via-slate-900/60 to-transparent'
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
                code={`aspect-[2/3] rounded-[2rem] border border-[#4a5f7f]
shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]
/* Gradient: bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Chat Interface</PageSubheading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <EntryCard name="Chat Message Bubble" pageTag="Chat"
                  specs='<strong>Solid:</strong> bg-[#1c1f26]. <strong>Transparent:</strong> bg-black/50. <strong>border-radius:</strong> rounded-[2rem]. <strong>padding:</strong> p-8 pt-14 pb-12. User: border-2 border-blue-400. AI: border border-white/5.'
                  preview={
                    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                      <div className="flex-1 bg-[#1c1f26] rounded-[2rem] border border-white/5 p-4" style={{ minHeight: 60 }}>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">AI</div>
                        <div className="text-xs text-white">Message content...</div>
                      </div>
                      <div className="flex-1 bg-[#1c1f26] rounded-[2rem] border-2 border-blue-400 p-4" style={{ minHeight: 60 }}>
                        <div className="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-1">USER</div>
                        <div className="text-xs text-white">User message...</div>
                      </div>
                    </div>
                  }
                  previewPlain
                  code={`/* AI bubble */
bg-[#1c1f26] rounded-[2rem] border border-white/5 p-8 pt-14 pb-12
/* User bubble */
bg-[#1c1f26] rounded-[2rem] border-2 border-blue-400 p-8 pt-14 pb-12
/* Transparent variant: bg-black/50 instead of bg-[#1c1f26] */`}
                />
                <EntryCard name="Frosted Glass Character Card" pageTag="Chat"
                  specs='Adaptive frosted glass. <strong>Dark BG (isDarkBg):</strong> bg-white/30 text-slate-800. <strong>Light BG:</strong> bg-black/30 text-white. <strong>rounded-2xl backdrop-blur-sm</strong>. Brightness threshold: 128.'
                  preview={
                    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                      <div className="flex-1 rounded-2xl p-3 text-center bg-white/30 backdrop-blur-sm border-2 border-transparent" style={{ background: 'rgba(255,255,255,0.3)', minHeight: 60 }}>
                        <div className="text-xs font-bold text-slate-800">Light mode</div>
                        <div className="text-[9px] text-slate-600">Dark sidebar bg</div>
                      </div>
                      <div className="flex-1 rounded-2xl p-3 text-center bg-black/30 backdrop-blur-sm border-2 border-transparent" style={{ background: 'rgba(0,0,0,0.3)', minHeight: 60 }}>
                        <div className="text-xs font-bold text-white">Dark mode</div>
                        <div className="text-[9px] text-white/70">Light sidebar bg</div>
                      </div>
                    </div>
                  }
                  previewPlain
                  code={`/* isDarkBg=true (dark sidebar) → light card */
bg-white/30 text-slate-800 border-transparent backdrop-blur-sm rounded-2xl
/* isDarkBg=false (light sidebar) → dark card */
bg-black/30 text-white border-transparent backdrop-blur-sm rounded-2xl`}
                />
                <EntryCard name="Chat Input Bar Container" pageTag="Chat"
                  specs='<strong>bg:</strong> bg-[hsl(var(--ui-surface))] · <strong>border-top:</strong> border-[hsl(var(--ui-border))] · <strong>shadow:</strong> 0 -4px 12px rgba(0,0,0,0.15). Contains quick actions row + textarea wrapper.'
                  preview={
                    <div className="w-full bg-[hsl(var(--ui-surface))] border-t border-[hsl(var(--ui-border))] shadow-[0_-4px_12px_rgba(0,0,0,0.15)] rounded-b-lg p-3" style={{ minHeight: 50 }}>
                      <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Input Bar Container</div>
                    </div>
                  }
                  previewPlain
                  code={`bg-[hsl(var(--ui-surface))] border-t border-[hsl(var(--ui-border))]
shadow-[0_-4px_12px_rgba(0,0,0,0.15)] pt-3 pb-3 px-8`}
                />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Chat History</PageSubheading>
              <EntryCard name="Session Card (Double-nested)" pageTag="Chat History"
                specs='<strong>Outer:</strong> bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] p-4. <strong>Inner:</strong> bg-[#3a3a3f]/30 rounded-2xl border border-white/5 p-4. Contains thumbnail, title, actions, preview.'
                preview={
                  <div className="w-full bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] p-3">
                    <div className="bg-[#3a3a3f]/30 rounded-2xl border border-white/5 p-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-[#4a5f7f] flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-white">Story Title</div>
                          <div className="text-[9px] text-zinc-500 mt-1">💬 24 • Mar 5, 2026</div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Outer card */
bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] overflow-hidden p-4
/* Inner card */
bg-[#3a3a3f]/30 rounded-2xl border border-white/5 p-4
/* Thumbnail */
w-24 h-24 rounded-lg bg-zinc-800 border border-[#4a5f7f] shadow-[0_4px_12px_rgba(0,0,0,0.4)]`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Community Gallery</PageSubheading>
              <EntryCard name="Category Sidebar" pageTag="Gallery"
                specs='<strong>bg:</strong> #18181b · <strong>width:</strong> 288px (w-72) · <strong>border-right:</strong> border-white/10. Yellow accent bar (h-0.5 bg-yellow-400) at top. Collapsible sections.'
                preview={
                  <div className="rounded-lg overflow-hidden" style={{ width: 180 }}>
                    <div className="h-0.5 bg-yellow-400" />
                    <div className="bg-[#18181b] p-3">
                      <div className="text-xs font-bold text-white mb-2">Browse Categories</div>
                      <div className="text-[9px] text-white/70 py-1">▸ Story Type</div>
                      <div className="text-[9px] text-white/70 py-1">▸ Genre</div>
                      <div className="text-[9px] text-white/70 py-1">▸ Origin</div>
                    </div>
                  </div>
                }
                previewPlain
                code={`w-72 bg-[#18181b] border-r border-white/10
/* Yellow accent: h-0.5 bg-yellow-400 */
/* Section item: px-3 py-2 rounded-lg text-sm
   Selected: bg-blue-500/20 text-blue-400
   Default: text-white/70 hover:bg-white/5 */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Image Library</PageSubheading>
              <EntryCard name="Folder Grid Card" pageTag="Image Library"
                specs='Shared card pattern with My Stories. <strong>aspect-[2/3] rounded-[2rem] border border-[#4a5f7f]</strong>. Shadow, gradient overlay, hover actions identical to story cards.'
                preview={
                  <div className="relative overflow-hidden rounded-[2rem] border border-[#4a5f7f]" style={{ width: 100, aspectRatio: '2/3', boxShadow: '0 12px 32px -2px rgba(0,0,0,0.5)' }}>
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                      <span className="text-white/10 text-2xl">📁</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-[9px] text-white font-bold">Folder Name</div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Same card pattern as My Stories */
aspect-[2/3] rounded-[2rem] border border-[#4a5f7f]
shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]
/* Gradient: from-slate-950 via-slate-900/20 to-transparent */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Account Page</PageSubheading>
              <EntryCard name="Settings Card" pageTag="Account"
                specs='<strong>bg:</strong> #1e1e22 · <strong>rounded-2xl</strong> · <strong>border:</strong> border-white/10 · <strong>padding:</strong> p-6. Contains icon, title, and content section.'
                preview={
                  <div className="w-full bg-[#1e1e22] rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#4a5f7f]">✉</span>
                      <span className="text-sm font-bold text-white">Email Address</span>
                    </div>
                    <div className="text-xs text-white/70 bg-[#2a2a2f] rounded-xl px-3 py-2 border border-white/5">user@example.com</div>
                  </div>
                }
                previewPlain
                code={`bg-[#1e1e22] rounded-2xl border border-white/10 p-6
/* Inner display: bg-[#2a2a2f] rounded-xl px-4 py-3 border border-white/5 */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Auth Page</PageSubheading>
              <EntryCard name="Auth Card (Light Theme)" pageTag="Auth"
                specs='Uses shadcn Card component. <strong>bg-slate-800/50 border-slate-700 backdrop-blur-sm</strong>. Max-width: max-w-md. Semi-transparent with blur effect on gradient background.'
                preview={
                  <div className="rounded-lg border border-slate-700 p-4" style={{ background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(4px)', width: 200 }}>
                    <div className="text-sm font-bold text-white text-center mb-1">Chronicle Studio</div>
                    <div className="text-[9px] text-slate-400 text-center">Sign in to continue</div>
                  </div>
                }
                previewPlain
                code={`/* shadcn Card with overrides */
bg-slate-800/50 border-slate-700 backdrop-blur-sm
max-w-md w-full`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Global Sidebar</PageSubheading>
              <EntryCard name="Sidebar (Expanded + Collapsed)" pageTag="Global"
                specs='<strong>bg:</strong> #1a1a1a · <strong>Expanded:</strong> w-[280px]. <strong>Collapsed:</strong> w-[72px]. <strong>border-right:</strong> border-black · <strong>shadow:</strong> shadow-2xl. Smooth transition: transition-all duration-300.'
                preview={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="bg-[#1a1a1a] rounded-lg border-r border-black shadow-2xl p-3" style={{ width: 120, minHeight: 80 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-[#4a5f7f] flex items-center justify-center text-white text-[9px] font-black italic">C</div>
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">Chronicle</span>
                      </div>
                      <div className="text-[8px] font-bold text-white bg-[#4a5f7f] rounded-lg px-2 py-1 mb-1">My Stories</div>
                      <div className="text-[8px] font-bold text-slate-400 px-2 py-1">Chat</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg border-r border-black shadow-2xl p-2 flex flex-col items-center gap-2" style={{ width: 40, minHeight: 80 }}>
                      <div className="w-6 h-6 rounded-lg bg-[#4a5f7f] flex items-center justify-center text-white text-[9px] font-black italic">C</div>
                      <div className="w-6 h-6 rounded bg-[#4a5f7f] opacity-70" />
                      <div className="w-6 h-6 rounded bg-transparent" />
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Expanded */ w-[280px] bg-[#1a1a1a] border-r border-black shadow-2xl
/* Collapsed */ w-[72px]
/* transition-all duration-300 */
/* Logo: w-10 h-10 rounded-xl bg-[#4a5f7f] shadow-xl shadow-[#4a5f7f]/30 */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Character Builder</PageSubheading>
              <EntryCard name="Chat Message Bubble (AI / User / Transparent)" pageTag="Chat"
                specs='<strong>AI Solid:</strong> bg-[#1c1f26] rounded-[2rem] border border-white/5. <strong>User:</strong> same + border-2 border-blue-400. <strong>Transparent:</strong> bg-black/50. Padding: p-8 pt-14 pb-12.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 12 }}
                preview={<>
                  <div className="bg-[#1c1f26] rounded-[2rem] border border-white/5 p-4">
                    <div className="text-xs text-white">AI message (solid mode)</div>
                  </div>
                  <div className="bg-[#1c1f26] rounded-[2rem] border-2 border-blue-400 p-4">
                    <div className="text-xs text-white">User message</div>
                  </div>
                  <div className="bg-black/50 rounded-[2rem] border border-white/5 p-4">
                    <div className="text-xs text-white">AI message (transparent mode)</div>
                  </div>
                </>}
                code={`/* AI Solid */      bg-[#1c1f26] rounded-[2rem] border border-white/5
/* User */          bg-[#1c1f26] rounded-[2rem] border-2 border-blue-400
/* AI Transparent */ bg-black/50 rounded-[2rem] border border-white/5
/* Padding: p-8 pt-14 pb-12 */`}
              />
              <InconsistencyNote items={[
                { file: 'ChatInterfaceTab.tsx', note: 'Chat bubble bg #1c1f26 does not match any panel token (#2a2a2f or bg-zinc-900). Unique surface color only used here.' },
              ]} />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>World Tab</PageSubheading>
              <EntryCard name="HintBox Component" pageTag="World Tab"
                specs='<strong>bg-zinc-900 rounded-xl p-4 border border-white/5</strong>. Contains ◆ diamond bullet points in text-zinc-400. Used for contextual guidance text.'
                previewDark
                preview={
                  <div className="bg-zinc-900 rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      <span className="text-zinc-500 mr-1">◆</span> Hint text with diamond bullets<br/>
                      <span className="text-zinc-500 mr-1">◆</span> Additional guidance line
                    </div>
                  </div>
                }
                code={`bg-zinc-900 rounded-xl p-4 border border-white/5
/* Bullets: ◆ text-zinc-500 mr-1 */
/* Text: text-zinc-400 text-xs leading-relaxed */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <EntryCard name="CharacterButton (World Tab)" pageTag="World Tab"
                specs='<strong>bg-black/80 rounded-2xl border-[#4a5f7f] hover:border-[#6b82a8]</strong>. Error state: border-2 border-red-500. Contains avatar + name + control badge.'
                previewDark previewStyle={{ gap: 12 }}
                preview={<>
                  <div className="bg-black/80 rounded-2xl border border-[#4a5f7f] p-3 flex items-center gap-2" style={{ cursor: 'default', width: 160 }}>
                    <div className="w-8 h-8 rounded-lg bg-zinc-700" />
                    <span className="text-white text-xs font-bold">Ashley</span>
                  </div>
                  <div className="bg-black/80 rounded-2xl border-2 border-red-500 p-3 flex items-center gap-2" style={{ cursor: 'default', width: 160 }}>
                    <div className="w-8 h-8 rounded-lg bg-zinc-700" />
                    <span className="text-white text-xs font-bold">Error State</span>
                  </div>
                </>}
                code={`bg-black/80 rounded-2xl border border-[#4a5f7f]
hover:border-[#6b82a8] transition-colors
/* Error: border-2 border-red-500 */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Day/Time Panel</PageSubheading>
              <EntryCard name="Day/Time Sky Panel" pageTag="Chat"
                specs='Preloaded stacked &lt;img&gt; elements with crossfade (opacity duration-700). <strong>bg-black/20</strong> overlay for legibility. <strong>shadow-lg</strong> elevation. Timer controls use getTimeTextColor helper.'
                previewDark
                preview={
                  <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ width: '100%', height: 80 }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-300 to-blue-400" />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative flex items-center justify-center h-full">
                      <span className="text-white text-xs font-bold">Day 1 · Sunrise</span>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Stacked preloaded images with opacity crossfade */
/* object-cover object-center */
/* Overlay: absolute inset-0 bg-black/20 */
/* Container: shadow-lg rounded-xl overflow-hidden */
/* Text: getTimeTextColor() → black for Sunrise/Day/Sunset, white for Night */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Model Settings</PageSubheading>
              <EntryCard name="Narrative Core Info Card" pageTag="Model Settings"
                specs='<strong>bg-slate-900 text-white</strong> Card with watermark text. Watermark: <strong>text-[120px] font-black text-white/5 italic</strong>. Light-theme page, dark info card.'
                previewDark
                preview={
                  <div className="bg-slate-900 text-white rounded-lg p-4 relative overflow-hidden" style={{ width: '100%', minHeight: 80 }}>
                    <div className="relative z-10">
                      <div className="font-black text-sm tracking-tight mb-1">Narrative Core</div>
                      <div className="text-[9px] text-white/60">Powered by xAI Grok</div>
                    </div>
                    <div className="absolute -right-2 -bottom-2 text-[60px] font-black text-white/5 italic select-none">AI</div>
                  </div>
                }
                previewPlain
                code={`bg-slate-900 text-white rounded-lg p-6 relative overflow-hidden
/* Watermark: absolute -right-4 -bottom-4
   text-[120px] font-black text-white/5 italic select-none */`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <PageSubheading>Dropdown Menus</PageSubheading>
              <EntryCard name="Dropdown Menu Panel (Standardized)" pageTag="Global"
                specs='<strong>bg-zinc-800 border-white/10</strong>. Items: hover bg-zinc-700 text-white. Destructive items: text-red-600 hover bg-zinc-700. Used across character cards, theme settings, etc.'
                previewDark
                preview={
                  <div className="bg-zinc-800 border border-white/10 rounded-md p-1 shadow-lg" style={{ width: 180 }}>
                    <div className="px-2 py-1.5 text-sm text-white rounded-sm hover:bg-zinc-700" style={{ cursor: 'default' }}>Edit character</div>
                    <div className="px-2 py-1.5 text-sm text-white rounded-sm hover:bg-zinc-700" style={{ cursor: 'default' }}>Duplicate</div>
                    <div className="h-px bg-white/10 my-1" />
                    <div className="px-2 py-1.5 text-sm text-red-600 rounded-sm hover:bg-zinc-700" style={{ cursor: 'default' }}>Delete character</div>
                  </div>
                }
                previewPlain
                code={`bg-zinc-800 border border-white/10 rounded-md p-1 shadow-lg
/* Items: px-2 py-1.5 text-sm text-white rounded-sm */
/* Hover: bg-zinc-700 */
/* Destructive: text-red-600 (keeps bg-zinc-700 on hover) */
/* Separator: h-px bg-white/10 */`}
              />
            </div>

            <PageSubheading>Art Style Selection Grid (Shared)</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Art Style Selection Card" pageTag="AI Generation Modals"
                specs='<strong>Card:</strong> <code>rounded-xl bg-card ring-1 ring-border p-2</code>. Selected: <code>ring-2 ring-blue-400 shadow-md</code>. <strong>Checkmark:</strong> <code>w-5 h-5 bg-primary rounded-full</code> absolute top-right. <strong>Label:</strong> <code>text-xs font-semibold text-foreground</code>. Shared across Avatar, Cover Image, and Scene Image generation modals.'
                preview={
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ width: 100, padding: 8, borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px #e2e8f0', position: 'relative' }}>
                      <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 8, background: '#e2e8f0' }} />
                      <p style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', marginTop: 8, color: '#111827' }}>Style A</p>
                    </div>
                    <div style={{ width: 100, padding: 8, borderRadius: 12, background: '#fff', boxShadow: '0 0 0 2px #60a5fa', position: 'relative' }}>
                      <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 8, background: '#e2e8f0' }} />
                      <p style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', marginTop: 8, color: '#111827' }}>Style B</p>
                      <div style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</div>
                    </div>
                  </div>
                }
                code={`/* Card: rounded-xl bg-card ring-1 ring-border p-2 */
/* Selected: ring-2 ring-blue-400 shadow-md */
/* Checkmark: w-5 h-5 bg-primary rounded-full (absolute top-1 right-1) */
/* Label: text-xs font-semibold text-center text-foreground */
/* ⚠ Uses light-theme (bg-card) while app is dark */`}
              />
            </div>

            <PageSubheading>Story Detail Modal</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Story Detail Character Card" pageTag="Story Detail Modal"
                specs='<strong>bg-white/5 rounded-xl p-3</strong>. Contains avatar (w-12 h-12 rounded-xl), character name (font-semibold text-white), role description (text-xs text-white/60). Used in character listing within Story Detail.'
                previewDark
                preview={
                  <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3" style={{ maxWidth: 280 }}>
                    <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center text-zinc-400 text-lg">👤</div>
                    <div>
                      <div className="text-white font-semibold text-sm">Elena Blackwood</div>
                      <div className="text-white/60 text-xs">Protagonist</div>
                    </div>
                  </div>
                }
                code={`bg-white/5 rounded-xl p-3
/* Avatar: w-12 h-12 rounded-xl */
/* Name: font-semibold text-white text-sm */
/* Role: text-xs text-white/60 */`}
              />

              <EntryCard name="Review Card" pageTag="Story Detail Modal"
                specs='<strong>bg-white/5 rounded-xl p-4</strong>. Contains StarRating + SpiceRating inline, reviewer name (text-sm font-semibold text-white), comment (text-sm text-white/70), date (text-xs text-white/40).'
                previewDark
                preview={
                  <div className="bg-white/5 rounded-xl p-4" style={{ maxWidth: 320 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="text-sm font-semibold text-white">Reviewer</span>
                      <span className="text-xs text-white/40">2 days ago</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12 }}>⭐⭐⭐⭐☆</span>
                      <span style={{ fontSize: 12 }}>🔥🔥🔥</span>
                    </div>
                    <p className="text-sm text-white/70">Great story, well-crafted characters.</p>
                  </div>
                }
                code={`bg-white/5 rounded-xl p-4
/* StarRating + SpiceRating inline row */
/* Reviewer: text-sm font-semibold text-white */
/* Comment: text-sm text-white/70 */
/* Date: text-xs text-white/40 */`}
              />
            </div>

            <PageSubheading>Share Story Modal</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Blue Info Callout" pageTag="Share Story Modal"
                specs='<strong>bg-blue-500/10 border-blue-500/20 rounded-xl p-4</strong>. Used for permission/info callouts. Text: <code>text-blue-300 text-xs</code>. Unique pattern — not used anywhere else in the app.'
                previewDark
                preview={
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4" style={{ maxWidth: 320 }}>
                    <p className="text-blue-300 text-xs">ℹ️ Published stories are visible to all users in the Community Gallery.</p>
                  </div>
                }
                code={`bg-blue-500/10 border border-blue-500/20 rounded-xl p-4
/* Text: text-blue-300 text-xs */
/* Unique info callout pattern */`}
              />
            </div>

            <PageSubheading>Side Character Card</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Side Character Card (Dual Mode)" pageTag="Chat Interface"
                specs='Frosted glass card with <strong>isDarkBg</strong> prop. Dark BG → bg-white/30 text-slate-800. Light BG → bg-black/30 text-white. <strong>Avatar: w-20 h-20 rounded-full</strong> — only circular avatar in the app. Updating state: blue vignette with animate-vignette-pulse.'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="rounded-2xl p-3 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.3)', width: 120 }}>
                      <div className="w-12 h-12 rounded-full bg-slate-600 mx-auto mb-2" />
                      <div className="text-xs font-bold text-slate-800 text-center">Dark BG</div>
                    </div>
                    <div className="rounded-2xl p-3 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.3)', width: 120 }}>
                      <div className="w-12 h-12 rounded-full bg-zinc-700 mx-auto mb-2" />
                      <div className="text-xs font-bold text-white text-center">Light BG</div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* isDarkBg=true → bg-white/30 text-slate-800 */
/* isDarkBg=false → bg-black/30 text-white */
/* Avatar: w-20 h-20 rounded-full (⚠ only circular avatar) */
/* Updating: blue vignette overlay + animate-vignette-pulse */`}
              />
              <InconsistencyNote items={[
                { file: 'SideCharacterCard.tsx', note: 'Uses rounded-full avatar (w-20 h-20) — every other avatar in the app uses rounded-2xl.' },
              ]} />
            </div>

            <PageSubheading>Creator Profile</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Creator Profile Card" pageTag="Creator Profile"
                specs='<strong>bg-[#1e1e22] rounded-2xl border-white/10 p-6</strong>. Contains avatar, display name, bio, stats pills (bg-white/5 rounded-xl). Follow button: bg-[#4a5f7f]. Yet another dark surface color (#1e1e22 vs #2a2a2f vs zinc-900).'
                previewDark
                preview={
                  <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-4" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="w-16 h-16 rounded-2xl bg-zinc-700" />
                      <div>
                        <div className="text-white font-bold text-sm">Creator Name</div>
                        <div className="text-white/60 text-xs">@username</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div className="bg-white/5 rounded-xl px-3 py-1.5 text-xs text-white/70">👁 1.2k</div>
                      <div className="bg-white/5 rounded-xl px-3 py-1.5 text-xs text-white/70">❤ 340</div>
                    </div>
                  </div>
                }
                previewPlain
                code={`bg-[#1e1e22] rounded-2xl border border-white/10 p-6
/* Stats: bg-white/5 rounded-xl px-3 py-2 */
/* ⚠ #1e1e22 — yet another dark surface, not matching #2a2a2f or zinc-900 */`}
              />
            </div>

            <PageSubheading>Character Picker (Full-Screen Overlay)</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="CharacterPicker Overlay" pageTag="Chat Interface"
                specs='Third overlay implementation: <strong>fixed inset-0 bg-slate-900/50 backdrop-blur-sm</strong>. Inner container: <strong>bg-zinc-900 rounded-3xl border-white/10</strong>. Character cards: <code>bg-black/30 rounded-2xl border-transparent hover:bg-black/50</code>. Uses rounded-3xl — unique container radius.'
                previewDark
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                      CharacterPicker — rounded-3xl
                    </div>
                  </div>
                }
                code={`/* Backdrop: fixed inset-0 bg-slate-900/50 backdrop-blur-sm */
/* Container: bg-zinc-900 rounded-3xl border-white/10 */
/* Character cards: bg-black/30 rounded-2xl hover:bg-black/50 */
/* ⚠ Third overlay implementation (not Dialog, not AlertDialog) */
/* ⚠ rounded-3xl — unique, standard containers use rounded-2xl */`}
              />
              <InconsistencyNote items={[
                { file: 'CharacterPicker.tsx', note: 'Uses rounded-3xl container — unique in the app. Standard is rounded-2xl. Also uses custom overlay (bg-slate-900/50) instead of Radix Dialog.' },
              ]} />
            </div>

            <PageSubheading>ScrollableSection Fade Indicators</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="ScrollableSection (White Fade)" pageTag="Global"
                specs='Fade indicators for overflow scrolling. <strong>Top:</strong> <code>bg-gradient-to-b from-white via-white/80 to-transparent</code>. <strong>Bottom:</strong> <code>bg-gradient-to-t from-white via-white/80 to-transparent</code>. Height: h-8. Uses white gradients that assume light-theme containers.'
                preview={
                  <div style={{ position: 'relative', height: 60, width: '100%', background: '#2a2a2f', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(to bottom, white, rgba(255,255,255,0.8), transparent)', zIndex: 1 }} />
                    <div style={{ padding: '24px 12px', fontSize: 10, color: '#94a3b8' }}>Content underneath</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(to top, white, rgba(255,255,255,0.8), transparent)', zIndex: 1 }} />
                  </div>
                }
                previewPlain
                code={`/* Top: from-white via-white/80 to-transparent h-8 */
/* Bottom: from-white via-white/80 to-transparent h-8 */
/* ⚠ White gradients on dark backgrounds — visually jarring */`}
              />
              <InconsistencyNote items={[
                { file: 'ScrollableSection.tsx', note: 'Uses from-white fade gradients that assume light-theme containers. Appears broken on dark backgrounds.' },
              ]} />
            </div>

            <PageSubheading>Chronicle UI.tsx Card (Light Theme)</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Chronicle UI.tsx Card" pageTag="Chronicle UI System"
                specs='<strong>rounded-3xl border-slate-200 bg-white p-4 shadow-sm</strong>. Light-theme card used in BackgroundPickerModal, some settings views. Part of the parallel Chronicle UI component system.'
                preview={
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" style={{ width: '100%' }}>
                    <div className="text-sm font-bold text-slate-900">Chronicle Card</div>
                    <div className="text-xs text-slate-500 mt-1">Light-theme card from UI.tsx</div>
                  </div>
                }
                previewPlain
                code={`/* Chronicle UI.tsx Card */
rounded-3xl border-slate-200 bg-white p-4 shadow-sm
/* ⚠ Light theme — parallel to dark app panels (bg-[#2a2a2f]) */`}
              />
              <InconsistencyNote items={[
                { file: 'UI.tsx', note: 'Defines light-theme Card (bg-white rounded-3xl border-slate-200). Conflicts with app-wide dark panel standard (bg-[#2a2a2f] border-white/10).' },
              ]} />
            </div>

            <PageSubheading>Arc System</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Arc Phase Card Container" pageTag="Arc System"
                specs='Phase container within the Story Arc. Contains progress ring (CircularProgress), phase title, branch lanes (success/fail), and sparkle enhance buttons. Uses <code>rounded-2xl</code> container where linked phases appear as inline sections separated by <code>border-t</code>.'
                previewDark
                preview={
                  <div className="bg-[#2a2a2f] rounded-2xl border border-white/10 p-4" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width={32} height={32} style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={16} cy={16} r={13} stroke="#334155" strokeWidth={3} fill="none" />
                          <circle cx={16} cy={16} r={13} stroke="#3b82f6" strokeWidth={3} fill="none" strokeDasharray={81.7} strokeDashoffset={40.8} />
                        </svg>
                        <span style={{ position: 'absolute', fontSize: 8, fontWeight: 700, color: '#60a5fa' }}>50%</span>
                      </div>
                      <span className="text-white font-bold text-sm">Phase 1: Discovery</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="flex-1 rounded-lg p-2" style={{ background: 'rgba(34,197,127,0.28)' }}>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase">Succeed</span>
                      </div>
                      <div className="flex-1 rounded-lg p-2" style={{ background: 'rgba(240,74,95,0.28)' }}>
                        <span className="text-[9px] font-bold text-red-300 uppercase">Fail</span>
                      </div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Container: rounded-2xl border-t (inline sections) */
/* Progress: CircularProgress component */
/* Branch lanes: success rgba(34,197,127,0.28), fail rgba(240,74,95,0.28) */
/* Phase title: text-white font-bold text-sm */`}
              />

              <EntryCard name="Arc Branch Lane (Success / Fail)" pageTag="Arc System"
                specs='Color-coded branch lanes. <strong>Success:</strong> strip bg <code>rgba(34,197,127,0.28)</code>, step cards <code>rgba(51,75,66,0.78)</code>. <strong>Fail:</strong> strip bg <code>rgba(240,74,95,0.28)</code>, step cards <code>rgba(78,58,68,0.78)</code>. Step card borders are status-based: Red (Failed), Blue (Succeeded), Orange (Deviated). Uses inline <code>rgba()</code> instead of Tailwind tokens.'
                previewDark
                preview={
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <div className="flex-1 rounded-lg p-3" style={{ background: 'rgba(34,197,127,0.28)' }}>
                      <div className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider mb-2">Succeed</div>
                      <div className="rounded-lg p-2 border-l-2 border-blue-500 mb-1.5" style={{ background: 'rgba(51,75,66,0.78)' }}>
                        <span className="text-[9px] text-white">Step 1 — Resolved</span>
                      </div>
                      <div className="rounded-lg p-2 border-l-2 border-orange-400" style={{ background: 'rgba(51,75,66,0.78)' }}>
                        <span className="text-[9px] text-white">Step 2 — Deviated</span>
                      </div>
                    </div>
                    <div className="flex-1 rounded-lg p-3" style={{ background: 'rgba(240,74,95,0.28)' }}>
                      <div className="text-[9px] font-bold text-red-300 uppercase tracking-wider mb-2">Fail</div>
                      <div className="rounded-lg p-2 border-l-2 border-red-500 mb-1.5" style={{ background: 'rgba(78,58,68,0.78)' }}>
                        <span className="text-[9px] text-white">Step 1 — Failed</span>
                      </div>
                      <div className="rounded-lg p-2 border-l-2 border-zinc-600 opacity-50" style={{ background: 'rgba(78,58,68,0.78)' }}>
                        <span className="text-[9px] text-zinc-400">🔒 DYNAMIC RECOVERY</span>
                      </div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Success lane: rgba(34,197,127,0.28) */
/* Success step: rgba(51,75,66,0.78) */
/* Fail lane: rgba(240,74,95,0.28) */
/* Fail step: rgba(78,58,68,0.78) */
/* Step borders: Red (failed), Blue (succeeded), Orange (deviated) */
/* ⚠ Uses inline rgba() instead of Tailwind tokens */`}
              />
              <InconsistencyNote items={[
                { file: 'ArcBranchLane.tsx', note: 'Uses inline rgba() colors instead of Tailwind tokens. Unique to the Arc system — no other component does this.' },
              ]} />
            </div>

            <PageSubheading>Chat Interface — White Sidebar</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Chat Sidebar (Light Theme)" pageTag="Chat Interface"
                specs='<strong>bg-white</strong> with <code>shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)]</code>. Optional background image overlay adds <code>bg-white/90 backdrop-blur-md</code>. Section headers: <code>#4a5f7f rounded-lg</code> pills with uppercase labels (MAIN CHARACTERS, SIDE CHARACTERS). Collapsible sections with chevron toggles.'
                preview={
                  <div style={{ display: 'flex', gap: 0, width: '100%', height: 140, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: '40%', background: '#fff', padding: 10, borderRight: '1px solid #e2e8f0', boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.02)' }}>
                      <div className="px-2 py-1 rounded-lg text-white text-[8px] font-black uppercase tracking-widest mb-2" style={{ background: '#4a5f7f', display: 'inline-block' }}>Main Characters</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Location</div>
                      <div className="text-[11px] font-bold text-slate-700 mb-2">Castle Grounds</div>
                      <div className="px-2 py-1 rounded-lg text-white text-[8px] font-black uppercase tracking-widest" style={{ background: '#4a5f7f', display: 'inline-block' }}>Side Characters</div>
                    </div>
                    <div style={{ flex: 1, background: '#1a1a1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Chat Area (dark)</span>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Sidebar: bg-white shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)] */
/* With BG image: bg-white/90 backdrop-blur-md */
/* Section headers: bg-[#4a5f7f] rounded-lg px-2 py-1 */
/* Labels: text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 */
/* Values: text-[11px] font-bold text-slate-700 */
/* ⚠ White sidebar in otherwise dark-themed app */`}
              />
              <InconsistencyNote items={[
                { file: 'ChatInterfaceTab.tsx', note: 'Uses bg-white sidebar with text-slate-700 values inside a dark-themed application. Jarring contrast with surrounding dark content.' },
              ]} />
            </div>

            <PageSubheading>World Tab — Two-Pane Layout</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="World Tab Sidebar + Content" pageTag="World Tab"
                specs='<strong>Left sidebar:</strong> <code>w-[260px] bg-[#2a2a2f] border-r border-white/10</code> with <code>#4a5f7f</code> header. <strong>Right content:</strong> uses Chronicle UI.tsx components (light-theme Cards/Inputs on dark background). "Add Character" button: <code>border-2 border-dashed border-zinc-600</code> with <code>bg-[#1a1a1f]</code> icon container.'
                previewDark
                preview={
                  <div style={{ display: 'flex', width: '100%', height: 130, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: 120, background: '#2a2a2f', borderRight: '1px solid rgba(255,255,255,0.1)', padding: 8 }}>
                      <div className="text-[8px] font-black uppercase tracking-widest text-white/70 px-2 py-1 rounded-lg mb-2" style={{ background: '#4a5f7f' }}>Characters</div>
                      <div className="rounded-lg p-2 mb-2" style={{ background: 'rgba(58,58,63,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-[9px] text-white font-semibold">Hero</div>
                      </div>
                      <div className="flex items-center justify-center rounded-xl p-2" style={{ background: 'rgba(58,58,63,0.3)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1f', border: '2px dashed #52525b' }}>
                          <span className="text-zinc-500 text-xs">+</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, background: '#2a2a2f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="rounded-2xl bg-white border border-slate-200 p-3 text-[9px] text-slate-500" style={{ width: '80%' }}>Chronicle UI Card (light)</div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Sidebar: w-[260px] bg-[#2a2a2f] border-r border-white/10 */
/* Header: bg-[#4a5f7f] rounded-lg */
/* Character item: bg-[#3a3a3f]/30 rounded-xl border-white/5 */
/* Add button: border-2 border-dashed border-zinc-600 */
/* Icon container: w-14 h-14 rounded-xl bg-[#1a1a1f] */
/* ⚠ Right pane uses Chronicle UI light-theme Cards on dark bg */`}
              />
              <InconsistencyNote items={[
                { file: 'WorldTab.tsx', note: 'Right content area uses Chronicle UI.tsx light-theme components (bg-white Cards, bg-slate-50 Inputs) on a bg-[#2a2a2f] dark background.' },
              ]} />
            </div>

            <PageSubheading>Character Builder — Collapsible Sections</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Builder Collapsible Section" pageTag="Character Builder"
                specs='<strong>Container:</strong> <code>bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]</code>. <strong>Header bar:</strong> <code>bg-[#4a5f7f] border-b border-white/20 px-5 py-3 shadow-lg</code>. <strong>Inner card:</strong> <code>bg-[#3a3a3f]/30 rounded-2xl border border-white/5</code>. Form rows: label (w-2/5) + value input, both <code>bg-zinc-900/50 border-white/10 rounded-lg</code>.'
                previewDark previewStyle={{ flexDirection: 'column', gap: 0, padding: 0 }}
                preview={
                  <div className="rounded-[16px] border border-white/10 overflow-hidden" style={{ background: '#2a2a2f', width: '100%', boxShadow: '0 12px 32px -2px rgba(0,0,0,0.50)' }}>
                    <div className="px-4 py-2 border-b border-white/20 flex items-center justify-between" style={{ background: '#4a5f7f' }}>
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">Physical Appearance</span>
                      <span className="text-white/60 text-xs">▾</span>
                    </div>
                    <div className="p-3">
                      <div className="rounded-xl p-2" style={{ background: 'rgba(58,58,63,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input readOnly className="w-2/5 px-2 py-1.5 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-[10px]" value="Hair" />
                          <input readOnly className="flex-1 px-2 py-1.5 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-[10px]" value="Long silver strands" />
                        </div>
                      </div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Container: bg-[#2a2a2f] rounded-[24px] border-white/10 */
/* shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] */
/* Header: bg-[#4a5f7f] border-b border-white/20 px-5 py-3 */
/* Inner card: bg-[#3a3a3f]/30 rounded-2xl border-white/5 */
/* Form inputs: bg-zinc-900/50 border-white/10 rounded-lg */
/* ⚠ Uses rounded-[24px] — yet another radius variant */`}
              />
              <InconsistencyNote items={[
                { file: 'CharactersTab.tsx', note: 'Uses rounded-[24px] for section containers — different from rounded-2xl (16px), rounded-3xl (24px Tailwind), and rounded-[2rem] (story cards).' },
              ]} />
            </div>

            <PageSubheading>Chat Sidebar — Info Sections</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Chat Sidebar Collapsible Info" pageTag="Chat Interface"
                specs='Light-themed collapsible info sections inside the white sidebar. <strong>Labels:</strong> <code>text-[9px] font-bold text-slate-400 uppercase tracking-wider</code>. <strong>Values:</strong> <code>text-[11px] font-bold text-slate-700</code>. <strong>Section header:</strong> <code>text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]</code> with rotate-180 chevron toggle.'
                preview={
                  <div style={{ background: '#fff', padding: 12, borderRadius: 8, width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="text-[10px] font-black text-slate-400 uppercase" style={{ letterSpacing: '0.15em' }}>World Info</span>
                      <span style={{ color: '#94a3b8', fontSize: 10 }}>▾</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.05em' }}>Location</span>
                        <div className="text-[11px] font-bold text-slate-700">Castle Grounds</div>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.05em' }}>Time</span>
                        <div className="text-[11px] font-bold text-slate-700">Day 3, Sunset</div>
                      </div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Section header: text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] */
/* Label: text-[9px] font-bold text-slate-400 uppercase tracking-wider */
/* Value: text-[11px] font-bold text-slate-700 */
/* ⚠ Uses text-slate-700 (light theme) — consistent within white sidebar */`}
              />
            </div>

            <PageSubheading>Subscription Tab</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Subscription Tier Card" pageTag="Account Page"
                specs='Pricing tier cards with <strong>bg-white/5 rounded-2xl border-white/10</strong> (Free), <strong>bg-[#4a5f7f]/10 border-[#4a5f7f]/30</strong> (Pro), <strong>bg-amber-500/10 border-amber-500/20</strong> (Premium). "Coming Soon" badge: <code>bg-[#4a5f7f] text-white rounded-full text-[10px]</code>. "Current Plan" badge: <code>bg-emerald-500/20 text-emerald-400 border-emerald-500/30</code>.'
                previewDark previewStyle={{ gap: 8 }}
                preview={
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <div className="flex-1 rounded-xl border border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-slate-400 text-[9px] font-bold">Free</div>
                      <div className="text-white text-sm font-black mt-1">$0</div>
                      <div className="mt-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[8px] font-bold uppercase inline-block">Current</div>
                    </div>
                    <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(74,95,127,0.1)', border: '1px solid rgba(74,95,127,0.3)' }}>
                      <div style={{ color: '#7ba3d4' }} className="text-[9px] font-bold">Pro</div>
                      <div className="text-white text-sm font-black mt-1">$9.99</div>
                      <div className="mt-2 px-2 py-0.5 bg-[#4a5f7f] text-white rounded-full text-[8px] font-bold uppercase inline-block">Soon</div>
                    </div>
                    <div className="flex-1 rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <div className="text-amber-400 text-[9px] font-bold">Premium</div>
                      <div className="text-white text-sm font-black mt-1">$19.99</div>
                      <div className="mt-2 px-2 py-0.5 bg-[#4a5f7f] text-white rounded-full text-[8px] font-bold uppercase inline-block">Soon</div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Free: bg-white/5 border-white/10 */
/* Pro: bg-[#4a5f7f]/10 border-[#4a5f7f]/30, color: #7ba3d4 */
/* Premium: bg-amber-500/10 border-amber-500/20, color: text-amber-400 */
/* Current badge: bg-emerald-500/20 text-emerald-400 border-emerald-500/30 */
/* Coming Soon badge: bg-[#4a5f7f] text-white rounded-full */
/* CTA button: bg-[#4a5f7f] hover:bg-[#5a6f8f] (brand accent) */`}
              />
            </div>
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 7. MODALS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="modals" title="Modals" desc="Pop-up modal and dialog container styling. Canonical patterns and inconsistencies documented.">

            <EntryCard name="Modal Backdrop" pageTag="Global"
              specs='<strong>Standard:</strong> Radix DialogOverlay default — <code>bg-black/80</code> (fixed inset-0, z-50).'
              preview={
                <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #334155 0%, #475569 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94a3b8' }}>App Content Behind</div>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>Modal Content</div>
                </div>
              }
              previewDark
              code={`background: rgba(0, 0, 0, 0.80);  /* bg-black/80 */
position: fixed; inset: 0; z-index: 50;`}
            />
            <InconsistencyNote items={[
              { file: 'ReviewModal.tsx', note: 'Uses bg-black/90 backdrop-blur-sm instead of standard bg-black/80' },
              { file: 'SceneTagEditorModal.tsx', note: 'Uses raw div with bg-black/85 instead of Radix DialogOverlay' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Modal Container" pageTag="Global"
              specs='<strong>Canonical:</strong> bg-zinc-900 · border: 1px solid rgba(255,255,255,0.1) · border-radius: rounded-lg · shadow: 0 10px 30px rgba(0,0,0,0.5)'
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
              code={`/* Canonical */ bg-zinc-900 border border-white/10 rounded-lg
/* Edit variant */ bg-[#2a2a2f] border border-white/10`}
            />
            <InconsistencyNote items={[
              { file: 'ShareStoryModal, CharacterEditModal', note: 'bg-[#2a2a2f] instead of bg-zinc-900' },
              { file: 'ReviewModal', note: 'bg-[#121214] (darker variant)' },
              { file: 'MemoriesModal', note: 'bg-slate-900 + border-slate-700' },
              { file: 'AIPromptModal', note: 'bg-[hsl(var(--ui-surface))] (CSS variable tokens)' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Modal Header" pageTag="Global"
              specs='<strong>Pattern A — Simple:</strong> text-lg font-bold text-white. <strong>Pattern B — Banner:</strong> bg-[#4a5f7f] full-width header bar.'
              preview={
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
                  <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden" style={{ minWidth: 180 }}>
                    <div className="px-4 pt-3 pb-2">
                      <div className="text-sm font-bold text-white">Simple Header</div>
                      <div className="text-xs text-zinc-500 mt-0.5">Optional description</div>
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
text-lg font-bold text-white
/* Pattern B — Slate blue banner */
bg-[#4a5f7f] px-6 py-4 border-b border-white/20`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Modal Footer / Button Row" pageTag="Global"
              specs='Shadow Surface buttons: <strong>h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider leading-none</strong>. Standard: bg-[hsl(var(--ui-surface-2))]. Cancel: bg-[hsl(240_6%_18%)]. Destructive: bg-[hsl(var(--destructive))].'
              preview={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="h-10 px-6 rounded-xl bg-[hsl(240_6%_18%)] border border-[hsl(var(--ui-border))] text-zinc-300 text-[10px] font-bold uppercase tracking-wider leading-none shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Cancel</button>
                  <button className="h-10 px-6 rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] text-[10px] font-bold uppercase tracking-wider leading-none shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Save</button>
                  <button className="h-10 px-6 rounded-xl bg-[hsl(var(--destructive))] text-white text-[10px] font-bold uppercase tracking-wider leading-none shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Delete</button>
                </div>
              }
              code={`h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider leading-none
shadow-[0_10px_30px_rgba(0,0,0,0.35)]
/* Standard: bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] */
/* Cancel: bg-[hsl(240_6%_18%)] text-zinc-300 */
/* Destructive: bg-[hsl(var(--destructive))] text-white */`}
            />
            <InconsistencyNote items={[
              { file: 'ReviewModal', note: 'h-11 text-sm font-semibold instead of h-10 text-[10px] uppercase' },
              { file: 'SceneTagEditorModal', note: 'Raw px-4 py-2 text-sm — non-standard' },
              { file: 'ChangeNameModal', note: 'Uses <Button> with hardcoded bg-slate-900/bg-slate-100' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Chat Settings Modal" pageTag="Chat"
              specs='<strong>max-w-2xl bg-zinc-900 border-white/10</strong>. Contains toggle grid: 2-col layout. Each toggle row: <strong>p-3 bg-zinc-800/50 rounded-xl</strong> with text-sm font-semibold text-zinc-200.'
              preview={
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-4" style={{ maxWidth: 300 }}>
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                    <span className="text-xs font-black text-white uppercase tracking-tight">⚙ Chat Settings</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-zinc-800/50 rounded-xl">
                      <span className="text-[9px] font-semibold text-zinc-200">Dynamic BG</span>
                    </div>
                    <div className="p-2 bg-zinc-800/50 rounded-xl">
                      <span className="text-[9px] font-semibold text-zinc-200">Transparent</span>
                    </div>
                  </div>
                </div>
              }
              previewPlain
              code={`max-w-2xl bg-zinc-900 border-white/10
/* Toggle rows: p-3 bg-zinc-800/50 rounded-xl */
/* Grid: grid-cols-1 md:grid-cols-2 gap-3 */
/* Labels: text-sm font-semibold text-zinc-200 */
/* POV buttons: px-3 py-1.5 text-xs font-semibold rounded-lg
   Active: bg-blue-500 text-white
   Inactive: bg-zinc-700 text-zinc-300 */`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="EnhanceModeModal" pageTag="Character Builder"
              specs='<strong>sm:max-w-md bg-zinc-900 border-white/10</strong>. Close button hidden. 2-column grid of option cards (Precise / Detailed). Each card: p-5 rounded-2xl bg-zinc-800/50 with icon container w-10 h-10 rounded-xl.'
              preview={
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-4" style={{ maxWidth: 300 }}>
                  <div className="mb-3">
                    <div className="text-sm font-bold text-white">Enhancement Style</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">Choose how the AI should expand this field.</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-white/10 bg-zinc-800/50">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">✨</div>
                      <span className="text-white font-bold text-[9px]">Precise</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-white/10 bg-zinc-800/50">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs">≡</div>
                      <span className="text-white font-bold text-[9px]">Detailed</span>
                    </div>
                  </div>
                </div>
              }
              previewPlain
              code={`sm:max-w-md bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden
/* Option cards: p-5 rounded-2xl border-white/10 bg-zinc-800/50 */
/* Precise icon: w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 */
/* Detailed icon: w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 */
/* Hover: border-blue-500/50 bg-blue-500/10 (Precise) */
/* Hover: border-purple-500/50 bg-purple-500/10 (Detailed) */`}
            />
            <div style={{ marginTop: 16 }} />

            <EntryCard name="Image Generation Modal (Light Theme)" pageTag="AI Generation Modals"
              specs='<strong>Uses shadcn DialogContent defaults</strong> — light background, no dark overrides. Inputs: <code>bg-slate-50 border-slate-200</code>. Buttons: shadcn Button default variant. These are the <strong>only modals</strong> in the entire app using light-theme defaults.'
              preview={
                <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 24px', color: '#111827', fontSize: 11, fontWeight: 600, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                    <div style={{ marginBottom: 6 }}>✨ Generate Avatar</div>
                    <div style={{ padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 10, color: '#94a3b8' }}>Describe your character...</div>
                  </div>
                </div>
              }
              previewDark
              code={`/* Container: shadcn DialogContent (default light bg) */
/* Inputs: bg-slate-50 border-slate-200 */
/* Focus: ring-2 ring-blue-100 border-blue-400 */
/* Buttons: shadcn <Button> default variant */
/* ⚠ ONLY light-theme modals in the entire app */`}
            />

            <InconsistencyNote items={[
              { file: 'AvatarGenerationModal.tsx', note: 'Uses shadcn light-theme DialogContent defaults while every other modal uses bg-zinc-900 border-white/10.' },
              { file: 'CoverImageGenerationModal.tsx', note: 'Same light-theme inconsistency as AvatarGenerationModal.' },
              { file: 'SceneImageGenerationModal.tsx', note: 'Same light-theme inconsistency as AvatarGenerationModal.' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Story Detail Modal" pageTag="Story Detail / Gallery"
              specs='<strong>bg-[#121214] rounded-[32px]</strong>. Unique 32px radius — the only modal using this value. Standard modals use rounded-lg. Contains custom action bar, character cards, review section, and content theme tags.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 32, padding: '16px 28px', color: '#fff', fontSize: 11, fontWeight: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                    Story Detail — rounded-[32px]
                  </div>
                </div>
              }
              code={`bg-[#121214] rounded-[32px] border-white/10
/* ⚠ Unique 32px radius — standard modals use rounded-lg */
/* Contains: action bar, character cards, review section */`}
            />

            <InconsistencyNote items={[
              { file: 'StoryDetailModal.tsx', note: 'Uses rounded-[32px] while standard modals use rounded-lg. Also uses bg-[#121214] vs standard bg-zinc-900.' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Review Modal" pageTag="Gallery / Story Detail"
              specs='<strong>bg-[#121214] rounded-2xl</strong>. Third different dark modal bg variant. Buttons use non-standard h-11 + text-sm (standard is h-10 + text-[10px]). Submit: <code>bg-[#4a5f7f]</code>. Delete: <code>bg-red-600/20</code>.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    Review Modal — rounded-2xl
                  </div>
                </div>
              }
              code={`bg-[#121214] rounded-2xl
/* Buttons: h-11 text-sm (non-standard) */
/* Submit: bg-[#4a5f7f] */
/* Delete: bg-red-600/20 border-red-500/30 text-red-400 */`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Memories Modal (Slate Theme)" pageTag="Chat Interface"
              specs='<strong>bg-slate-900 border-slate-700</strong>. Uses slate-* palette throughout instead of app-standard zinc-*. Toggle rows: <code>bg-slate-800/50 border-slate-700</code>. Add form: <code>bg-slate-800/70 border-purple-500/30</code> with <code>animate-in slide-in-from-top-2</code>.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    Memories — slate palette
                  </div>
                </div>
              }
              code={`bg-slate-900 border-slate-700
/* Toggle: bg-slate-800/50 border-slate-700 rounded-lg */
/* Add form: bg-slate-800/70 border-purple-500/30 */
/* ⚠ Uses slate-* instead of app-standard zinc-* */`}
            />

            <InconsistencyNote items={[
              { file: 'MemoriesModal.tsx', note: 'Uses slate-* palette throughout while every other modal uses zinc-*. Also uses bg-slate-900 vs standard bg-zinc-900.' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Share Story Modal" pageTag="Story Builder"
              specs='<strong>bg-[#2a2a2f] border-white/10</strong>. Uses !important CSS overrides on buttons (<code>!bg-blue-600</code>, <code>!bg-rose-500/20</code>). Info card: <code>bg-zinc-900/50 rounded-xl border-zinc-700</code>.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#2a2a2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    Share Story — bg-[#2a2a2f]
                  </div>
                </div>
              }
              code={`bg-[#2a2a2f] border-white/10
/* Buttons: !important overrides (!bg-blue-600, !bg-rose-500/20) */
/* Info card: bg-zinc-900/50 rounded-xl border-zinc-700 */`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="ChangeNameModal (Light Theme)" pageTag="Character Builder"
              specs='<strong>Uses default DialogContent</strong> — no dark overrides. Buttons: <code>bg-slate-100 text-slate-700</code> (Cancel), <code>bg-slate-900 text-white</code> (Save). Current name display: <code>bg-slate-100 text-slate-600</code>. Same light-theme issue as Image Generation modals.'
              preview={
                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 24px', color: '#111827', fontSize: 11, fontWeight: 600, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                    Change Name — light theme
                  </div>
                </div>
              }
              previewDark
              code={`/* Default DialogContent (light theme, no overrides) */
/* Cancel: bg-slate-100 hover:bg-slate-200 text-slate-700 */
/* Save: bg-slate-900 hover:bg-slate-800 text-white */
/* ⚠ Light theme — same issue as Image Gen modals */`}
            />
            <InconsistencyNote items={[
              { file: 'ChangeNameModal.tsx', note: 'Uses default light-theme DialogContent while every other modal uses dark overrides. Uses slate-100/slate-700 buttons.' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="AIPromptModal (Colored Header)" pageTag="Chat Interface"
              specs='<strong>bg-[hsl(var(--ui-surface))]</strong> with unique colored header bar: <code>bg-[#4a5f7f] -mx-6 -mt-6 px-6 py-4 rounded-t-lg</code>. Only modal with a full-width colored header banner that uses negative margins to bleed edge-to-edge.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#2a2a2f', borderRadius: 8, overflow: 'hidden', width: 220, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                    <div style={{ background: '#4a5f7f', padding: '8px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Prompt</span>
                    </div>
                    <div style={{ padding: '8px 16px', fontSize: 10, color: '#94a3b8' }}>Modal content...</div>
                  </div>
                </div>
              }
              code={`bg-[hsl(var(--ui-surface))]
/* Header: bg-[#4a5f7f] -mx-6 -mt-6 px-6 py-4 rounded-t-lg */
/* ⚠ Only modal with a colored header bar using negative margins */`}
            />
            <InconsistencyNote items={[
              { file: 'AIPromptModal.tsx', note: 'Only modal with a colored header bar pattern (bg-[#4a5f7f] -mx-6 -mt-6). Not used anywhere else.' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="DeleteConfirmDialog (AlertDialog)" pageTag="Global"
              specs='Uses <strong>AlertDialog</strong> instead of Dialog. <strong>bg-[hsl(240_6%_10%)] rounded-2xl border-white/10</strong>. Cancel: <code>bg-[hsl(240_6%_18%)]</code>. Delete: <code>bg-[hsl(var(--destructive))]</code>. Standardized across all destructive actions. Shadow: <code>0 10px 30px rgba(0,0,0,0.5)</code>.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'hsl(240, 6%, 10%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '12px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#e8eef8', marginBottom: 4 }}>Delete this? <span style={{ color: '#ef4444' }}>Delete</span></div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button style={{ padding: '4px 12px', borderRadius: 12, background: 'hsl(240, 6%, 18%)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eef8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', cursor: 'default' }}>Cancel</button>
                      <button style={{ padding: '4px 12px', borderRadius: 12, background: '#ef4444', border: 'none', color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', cursor: 'default' }}>Delete</button>
                    </div>
                  </div>
                </div>
              }
              code={`/* AlertDialog (not Dialog) */
bg-[hsl(240_6%_10%)] rounded-2xl border-white/10
shadow-[0_10px_30px_rgba(0,0,0,0.5)]
/* Cancel: bg-[hsl(240_6%_18%)] border-white/10 */
/* Delete: bg-[hsl(var(--destructive))] */
/* Buttons: h-10 px-6 text-[10px] font-bold uppercase tracking-wider */`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="SceneTagEditorModal (Custom Overlay)" pageTag="Image Library"
              specs='Uses <strong>custom <code>fixed inset-0</code> overlay</strong> instead of Radix Dialog. Backdrop: <code>bg-black/85</code>. Container: <code>bg-zinc-900 rounded-xl border-[#4a5f7f]</code>. Contains image preview, title input, and tag editor. Uses accent border <code>border-[#4a5f7f]</code> instead of standard <code>border-white/10</code>.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.85)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid #4a5f7f', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    Scene Tags — custom overlay
                  </div>
                </div>
              }
              code={`/* Custom overlay: fixed inset-0 bg-black/85 (NOT Radix Dialog) */
bg-zinc-900 rounded-xl border-[#4a5f7f]
/* ⚠ Uses fixed inset-0 instead of Dialog component */
/* ⚠ Uses border-[#4a5f7f] instead of border-white/10 */`}
            />
            <InconsistencyNote items={[
              { file: 'SceneTagEditorModal.tsx', note: 'Uses custom fixed inset-0 overlay instead of Radix Dialog component. Also uses border-[#4a5f7f] instead of standard border-white/10.' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="FolderEditModal (Accent Border)" pageTag="Image Library"
              specs='<strong>bg-zinc-900 border-[#4a5f7f]</strong>. Uses accent border <code>border-[#4a5f7f]</code> matching the Story Builder panel system instead of standard modal <code>border-white/10</code>. Close button hidden via <code>[&>button]:hidden</code>.'
              previewDark
              preview={
                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid #4a5f7f', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    Folder Edit — border-[#4a5f7f]
                  </div>
                </div>
              }
              code={`bg-zinc-900 border-[#4a5f7f] [&>button]:hidden
/* ⚠ Uses border-[#4a5f7f] instead of standard border-white/10 */`}
            />
            <InconsistencyNote items={[
              { file: 'FolderEditModal.tsx', note: 'Uses accent border-[#4a5f7f] instead of standard modal border-white/10.' },
            ]} />

            <div style={{ marginTop: 16 }} />

            <PageSubheading>Two-Option Selection Modal (Shared Pattern)</PageSubheading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EntryCard name="Two-Option Selection Modal" pageTag="CharacterCreation / EnhanceMode / CustomContentType"
                specs='<strong>Shared reusable pattern</strong> used by 3 modals (CharacterCreationModal, EnhanceModeModal, CustomContentTypeModal). Container: <code>bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden</code>. Header: <code>px-6 pt-5 pb-3</code> with <code>text-white text-lg font-bold tracking-tight</code>. Grid: <code>px-6 pb-6 grid grid-cols-2 gap-3</code>. Option cards: <code>p-5 rounded-2xl border border-white/10 bg-zinc-800/50</code>. Left hover: <code>hover:border-blue-500/50 hover:bg-blue-500/10</code>. Right hover: <code>hover:border-purple-500/50 hover:bg-purple-500/10</code>. Icon: <code>w-10 h-10 rounded-xl</code> with <code>bg-blue-500/20</code> (left) / <code>bg-purple-500/20</code> (right).'
                previewDark previewStyle={{ flexDirection: 'column', gap: 0, padding: 0 }}
                preview={
                  <div className="rounded-lg overflow-hidden" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                    <div style={{ padding: '12px 16px 8px' }}>
                      <div className="text-white text-sm font-bold" style={{ letterSpacing: '-0.01em' }}>Selection Title</div>
                      <div className="text-zinc-400 text-[10px] mt-0.5">Choose an option below.</div>
                    </div>
                    <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div className="p-3 rounded-xl border border-white/10 text-center" style={{ background: 'rgba(39,39,42,0.5)' }}>
                        <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
                          <span className="text-blue-400 text-xs">★</span>
                        </div>
                        <div className="text-white text-[10px] font-bold">Option A</div>
                        <div className="text-zinc-400 text-[8px] mt-0.5">Blue hover accent</div>
                      </div>
                      <div className="p-3 rounded-xl border border-white/10 text-center" style={{ background: 'rgba(39,39,42,0.5)' }}>
                        <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)' }}>
                          <span className="text-purple-400 text-xs">◆</span>
                        </div>
                        <div className="text-white text-[10px] font-bold">Option B</div>
                        <div className="text-zinc-400 text-[8px] mt-0.5">Purple hover accent</div>
                      </div>
                    </div>
                  </div>
                }
                previewPlain
                code={`/* Container: bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden */
/* Header: px-6 pt-5 pb-3 */
/* Title: text-white text-lg font-bold tracking-tight */
/* Subtitle: text-zinc-400 text-sm mt-1 */
/* Grid: px-6 pb-6 grid grid-cols-2 gap-3 */
/* Option card: p-5 rounded-2xl border border-white/10 bg-zinc-800/50 */
/* Left hover: hover:border-blue-500/50 hover:bg-blue-500/10 */
/* Right hover: hover:border-purple-500/50 hover:bg-purple-500/10 */
/* Icon: w-10 h-10 rounded-xl bg-{color}-500/20 */
/* Used by: CharacterCreationModal, EnhanceModeModal, CustomContentTypeModal */
/* ⚠ 3 identical layouts implemented separately — should be shared component */`}
              />
              <InconsistencyNote items={[
                { file: 'CharacterCreationModal / EnhanceModeModal / CustomContentTypeModal', note: 'Three modals share identical layout (bg-zinc-900, grid cols-2, blue/purple option cards) but are implemented as separate components with duplicated markup.' },
              ]} />
            </div>

            <div style={{ marginTop: 16 }} />

            {/* Master Modal Inconsistency Summary */}
            <InconsistencyNote items={[
              { file: 'Global', note: '5 different modal background colors: bg-zinc-900, bg-[#2a2a2f], bg-[#121214], bg-slate-900, and default light (shadcn).' },
              { file: 'Global', note: '3 different modal border-radius values: rounded-lg (standard), rounded-2xl (Review/Delete), rounded-[32px] (Story Detail).' },
              { file: 'Global', note: 'Button sizing varies: h-10 (standard), h-11 (Review), h-12 (Story Detail actions).' },
              { file: 'Global', note: '3 different modal border styles: border-white/10 (standard), border-[#4a5f7f] (accent), border-slate-700 (Memories).' },
              { file: 'Global', note: '2 different dialog systems: Radix Dialog (standard) vs custom fixed inset-0 overlay (SceneTagEditor).' },
            ]} />
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 8. ICONS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="icons" title="Icons" desc="Icon sizing, color conventions, and container patterns. All icons use Lucide React.">

            <EntryCard name="Icon Size Scale" pageTag="Global"
              specs='<strong>6 sizes in use.</strong> Default inline/button: w-4 h-4 (16px). Modal/panel title: w-5 h-5 (20px). Larger sizes for empty states and loading.'
              preview={
                <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
                  {[
                    { size: 12, label: 'w-3', usage: 'Chevrons, compact' },
                    { size: 14, label: 'w-3.5', usage: 'Rare (sparkle)' },
                    { size: 16, label: 'w-4', usage: 'Default — buttons' },
                    { size: 20, label: 'w-5', usage: 'Title icons' },
                    { size: 24, label: 'w-6', usage: 'Spinners' },
                    { size: 32, label: 'w-8', usage: 'Empty states' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: s.size, height: s.size, borderRadius: 3, background: '#6b7280' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', fontFamily: "'SF Mono','Fira Code',monospace" }}>{s.label}</span>
                      <span style={{ fontSize: 9, color: '#64748b', textAlign: 'center', maxWidth: 80 }}>{s.usage}</span>
                    </div>
                  ))}
                </div>
              }
              code={`w-3 h-3  → 12px  — Chevrons, compact button icons
w-3.5    → 14px  — Rare
w-4 h-4  → 16px  — DEFAULT: buttons, forms, dropdowns
w-5 h-5  → 20px  — Modal titles, panel headers
w-6 h-6  → 24px  — Loading spinners
w-8 h-8  → 32px  — Empty state placeholders`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Icon Colors" pageTag="Global"
              specs='<strong>Default:</strong> text-white, text-zinc-400. <strong>Accent:</strong> text-blue-400, text-purple-400, text-cyan-200. <strong>Destructive:</strong> text-red-400.'
              preview={
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { color: '#ffffff', label: 'text-white', role: 'Default', needsBorder: true },
                    { color: '#a1a1aa', label: 'text-zinc-400', role: 'Muted', needsBorder: false },
                    { color: '#60a5fa', label: 'text-blue-400', role: 'Accent', needsBorder: false },
                    { color: '#c084fc', label: 'text-purple-400', role: 'Accent', needsBorder: false },
                    { color: '#f87171', label: 'text-red-400', role: 'Destructive', needsBorder: false },
                    { color: 'rgba(255,255,255,0.4)', label: 'text-white/40', role: 'Disabled', needsBorder: true },
                  ].map(c => (
                    <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6, background: c.color,
                        border: c.needsBorder ? '1px solid #e2e8f0' : '1px solid rgba(0,0,0,0.1)',
                      }} />
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#334155', fontFamily: "'SF Mono','Fira Code',monospace" }}>{c.label}</span>
                      <span style={{ fontSize: 8, color: '#64748b' }}>{c.role}</span>
                    </div>
                  ))}
                </div>
              }
              code={`text-white       — Default
text-zinc-400    — Muted
text-blue-400    — Accent
text-purple-400  — Accent
text-red-400     — Destructive
hover:text-white — Hover state
text-white/40    — Disabled`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Icon Containers" pageTag="Global"
              specs='<strong>4 patterns:</strong> (1) No container. (2) Checkmark: w-5 h-5 bg-blue-500 rounded-full. (3) Option: w-10 h-10 rounded-xl bg-{color}-500/20. (4) Action button: h-8 w-8 rounded-xl.'
              preview={
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="w-5 h-5 rounded bg-zinc-400" />
                    <span style={{ fontSize: 8, color: '#64748b' }}>No container</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-sm bg-white" />
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Checkmark</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <div className="w-5 h-5 rounded bg-blue-400" />
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Option</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="h-8 w-8 rounded-xl bg-zinc-200 flex items-center justify-center">
                      <div className="w-4 h-4 rounded bg-zinc-500" />
                    </div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Action btn</span>
                  </div>
                </div>
              }
              code={`/* 1. No container */
/* 2. Checkmark: w-5 h-5 bg-blue-500 rounded-full */
/* 3. Option: w-10 h-10 rounded-xl bg-{color}-500/20 */
/* 4. Action button: h-8 w-8 rounded-xl */`}
            />

            <div style={{ marginTop: 16 }} />

            <EntryCard name="Sparkles Enhance Icon" pageTag="Character Builder"
              specs='<strong>Sparkles size={14}</strong> (w-3.5 h-3.5). Default: text-zinc-400. Hover: text-blue-400. Used as AI enhancement trigger on character trait rows. Paired with p-1.5 rounded-md container.'
              preview={
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="p-1.5 rounded-md text-zinc-400" style={{ background: 'transparent' }}>✨</div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Default</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="p-1.5 rounded-md text-blue-400 bg-blue-500/10">✨</div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Hover</span>
                  </div>
                </div>
              }
              code={`/* Sparkles size={14} — Lucide React */
/* Default: text-zinc-400 */
/* Hover: text-blue-400, container bg-blue-500/10 */
/* Container: p-1.5 rounded-md */`}
            />
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ MASTER INCONSISTENCY SUMMARY ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111827', marginBottom: 8 }}>
              Master Inconsistency Report
            </h2>
            <p style={{ fontSize: 13, color: sg.muted, maxWidth: 900, marginBottom: 22 }}>
              Complete catalog of design system inconsistencies across all 6 documentation passes.
            </p>

            <PageSubheading>Dual Component Systems</PageSubheading>
            <InconsistencyNote items={[
              { file: 'UI.tsx vs ui/*', note: 'Two parallel component systems: shadcn/Radix (Auth, some modals) vs Chronicle UI.tsx (StoryHub, Chat, WorldTab, ~50% of app). Different styling, different APIs.' },
              { file: 'Buttons', note: 'shadcn Button (rounded-md, CVA variants) vs Chronicle Button (rounded-xl, 7 custom variants, active:scale-95).' },
              { file: 'Cards', note: 'shadcn Card (rounded-lg bg-card) vs Chronicle Card (rounded-3xl bg-white border-slate-200).' },
              { file: 'Inputs', note: 'shadcn Input (rounded-md bg-background) vs Chronicle Input (rounded-2xl bg-slate-50 border-slate-200).' },
            ]} />

            <PageSubheading>Theme Inconsistencies</PageSubheading>
            <InconsistencyNote items={[
              { file: 'Auth.tsx', note: 'Purple accent (purple-600 buttons, purple-400 links) while rest of app uses blue #4a5f7f.' },
              { file: 'ChangeNameModal, Image Gen modals', note: 'Light-theme modals (default DialogContent) in a dark-themed app.' },
              { file: 'UploadSourceMenu.tsx', note: 'Light-theme dropdown (bg-white border-slate-200) over dark modal content.' },
              { file: 'ScrollableSection.tsx', note: 'White fade gradients (from-white) that assume light-theme containers.' },
              { file: 'CreatorProfile.tsx', note: 'bg-white header bar on bg-[#121214] dark page — jarring contrast.' },
            ]} />

            <PageSubheading>Surface Color Proliferation</PageSubheading>
            <InconsistencyNote items={[
              { file: 'Modals', note: '5 different modal backgrounds: bg-zinc-900, bg-[#2a2a2f], bg-[#121214], bg-slate-900, default light (shadcn).' },
              { file: 'Dark surfaces', note: '4+ dark surface colors: #2a2a2f, #1e1e22, #18181b, zinc-900, slate-900 — no unified token.' },
              { file: 'Borders', note: '3 modal border styles: border-white/10 (standard), border-[#4a5f7f] (accent), border-slate-700 (Memories).' },
            ]} />

            <PageSubheading>Overlay & Dialog Systems</PageSubheading>
            <InconsistencyNote items={[
              { file: 'Global', note: '3 different overlay systems: Radix Dialog (standard), AlertDialog (delete confirms), custom fixed inset-0 (SceneTagEditor, CharacterPicker).' },
              { file: 'Backdrop opacity', note: 'bg-black/80 (standard), bg-black/85 (SceneTagEditor), bg-black/90 (ReviewModal), bg-slate-900/50 (CharacterPicker).' },
            ]} />

            <PageSubheading>Border Radius Variance</PageSubheading>
            <InconsistencyNote items={[
              { file: 'Containers', note: 'rounded-lg (modals), rounded-xl (buttons/cards), rounded-2xl (panels/account), rounded-3xl (CharacterPicker), rounded-[2rem] (story cards), rounded-[32px] (StoryDetail).' },
              { file: 'Avatars', note: 'rounded-2xl (standard) vs rounded-full (SideCharacterCard only).' },
              { file: 'Arc system', note: 'rounded-[10px] delete button vs standard rounded-xl (12px).' },
            ]} />

            <PageSubheading>Button Sizing Variance</PageSubheading>
            <InconsistencyNote items={[
              { file: 'Height', note: 'h-8 (card compact), h-10 (standard), h-11 (Review modal), h-12 (StoryDetail actions).' },
              { file: 'Typography', note: 'text-[10px] uppercase (Shadow Surface standard) vs text-sm (Chronicle UI.tsx) vs text-xs (card actions).' },
            ]} />

            <PageSubheading>Pass 6 — Layout & Modal Patterns</PageSubheading>
            <InconsistencyNote items={[
              { file: 'CharacterCreation / EnhanceMode / CustomContentType', note: 'Three modals share identical layout but are implemented as separate components with duplicated markup. Should be a shared TwoOptionModal component.' },
              { file: 'ChatInterfaceTab.tsx', note: 'White sidebar (bg-white) with light-theme typography (text-slate-700) inside a dark-themed application.' },
              { file: 'CharactersTab.tsx', note: 'Uses rounded-[24px] for builder sections — adding to the existing radius variance (rounded-2xl/rounded-3xl/rounded-[2rem]/rounded-[32px]).' },
              { file: 'WorldTab.tsx', note: 'Right content pane uses Chronicle UI.tsx light-theme components (bg-white Cards, bg-slate-50 Inputs) on a bg-[#2a2a2f] dark background.' },
              { file: 'Auth.tsx inputs', note: 'Third input color system: bg-slate-700/50 border-slate-600 (Auth) vs bg-zinc-900/50 border-white/10 (builder) vs bg-slate-50 border-slate-200 (Chronicle).' },
            ]} />
          </div>

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
