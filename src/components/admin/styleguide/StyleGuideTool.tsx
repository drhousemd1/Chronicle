import React, { useEffect, useRef, useState, useCallback } from 'react';
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
interface StyleGuideToolProps {
  onRegisterDownload?: (fn: (() => void) | null) => void;
}

export const StyleGuideTool: React.FC<StyleGuideToolProps> = ({ onRegisterDownload }) => {
  const [activeSection, setActiveSection] = useState('colors');
  const [activePage, setActivePage] = useState<'guide' | 'restructuring'>('guide');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onRegisterDownload?.(() => setShowDownloadModal(true));
    return () => onRegisterDownload?.(null);
  }, [onRegisterDownload]);
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
            <button key={s.id} onClick={() => { setActivePage('guide'); scrollTo(s.id); }} style={{
              display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: 12, fontWeight: 600, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activePage === 'guide' && activeSection === s.id ? 'rgba(74,95,127,0.12)' : 'transparent',
              color: activePage === 'guide' && activeSection === s.id ? sg.primary : '#475569',
              boxShadow: activePage === 'guide' && activeSection === s.id ? 'inset 0 0 0 1px rgba(74,95,127,0.18)' : 'none',
              transition: 'all 0.2s ease',
            }}>{s.label}</button>
          ))}
          <div style={{ width: 1, height: 20, background: sg.border, flexShrink: 0 }} />
          <button onClick={() => setActivePage('restructuring')} style={{
            display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', whiteSpace: 'nowrap',
            fontSize: 12, fontWeight: 600, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activePage === 'restructuring' ? 'rgba(245,158,11,0.15)' : 'transparent',
            color: activePage === 'restructuring' ? '#d97706' : '#475569',
            boxShadow: activePage === 'restructuring' ? 'inset 0 0 0 1px rgba(245,158,11,0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}>App Style Restructuring</button>
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
            <button key={s.id} onClick={() => { setActivePage('guide'); scrollTo(s.id); }} style={{
              display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activePage === 'guide' && activeSection === s.id ? 'rgba(74,95,127,0.12)' : 'transparent',
              color: activePage === 'guide' && activeSection === s.id ? sg.primary : '#475569',
              boxShadow: activePage === 'guide' && activeSection === s.id ? 'inset 0 0 0 1px rgba(74,95,127,0.18)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: 999, flexShrink: 0,
                background: activePage === 'guide' && activeSection === s.id ? sg.primary : '#cbd5e1',
                transition: 'background 0.2s ease',
              }} />
              {s.label}
            </button>
          ))}
          {/* Divider */}
          <div style={{ height: 1, background: sg.border, margin: '8px 0' }} />
          {/* Restructuring button */}
          <button onClick={() => setActivePage('restructuring')} style={{
            display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activePage === 'restructuring' ? 'rgba(245,158,11,0.15)' : 'transparent',
            color: activePage === 'restructuring' ? '#d97706' : '#475569',
            boxShadow: activePage === 'restructuring' ? 'inset 0 0 0 1px rgba(245,158,11,0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: 999, flexShrink: 0,
              background: activePage === 'restructuring' ? '#d97706' : '#cbd5e1',
              transition: 'background 0.2s ease',
            }} />
            App Style Restructuring
          </button>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
            Design System v1.0
          </div>
        </nav>
      )}

      {/* ─── MAIN AREA ─── */}
      {activePage === 'guide' ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Header */}
          <div style={{
             background: '#4a5f7f', borderBottom: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: isNarrow ? '24px 16px 18px' : '28px 42px 24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(30px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.1, marginBottom: 8 }}>
                  Chronicle Style Guide
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 980, lineHeight: 1.65 }}>
                  Every color, font size, border radius, and spacing value below was extracted from the live Chronicle source code. Use this as the single source of truth for all styling decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} style={{ padding: isNarrow ? '24px 16px 68px' : '36px 42px 84px', maxWidth: 1400 }}>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ═══ ORIGINAL CONTENT MARKER — preserved via keep-existing ═══ */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            STYLE_GUIDE_CONTENT_PLACEHOLDER
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Restructuring Header */}
          <div style={{
            background: '#4a5f7f', borderBottom: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: isNarrow ? '24px 16px 18px' : '28px 42px 24px',
          }}>
            <div>
              <h1 style={{ fontSize: 'clamp(30px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.1, marginBottom: 8 }}>
                App Style Restructuring
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 980, lineHeight: 1.65 }}>
                Document progress, consolidate changes, and plan next steps for styling consistency.
              </p>
            </div>
          </div>

          {/* Restructuring Content */}
          <div style={{ padding: isNarrow ? '24px 16px 68px' : '36px 42px 84px', maxWidth: 1400 }}>
            <div style={{
              background: sg.surface, border: `2px solid ${sg.border}`, borderRadius: 12,
              padding: '48px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No notes yet</h2>
              <p style={{ fontSize: 14, color: sg.muted, maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
                This page will be used to track styling progress across sessions — consolidating what's been changed, what's been fixed, and what needs to be done next.
              </p>
            </div>
          </div>
        </div>
      )}
      <StyleGuideDownloadModal open={showDownloadModal} onClose={() => setShowDownloadModal(false)} contentRef={contentRef} />
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
