import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { Sparkles, Pencil, Lock, X, Plus, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { StarRating } from '@/components/chronicle/StarRating';
import { SpiceRating } from '@/components/chronicle/SpiceRating';
import { CircularProgress } from '@/components/chronicle/CircularProgress';
import { Badge } from '@/components/ui/badge';
import { StyleGuideDownloadModal } from './StyleGuideDownloadModal';
import {
  KeepOrEditModal, EditDetailModal, EditsListModal,
  getEditsRegistry, upsertEdit, removeKeep, addKeep, getKeeps, getEditsCount,
  type EditEntry,
} from './StyleGuideEditsModal';

/* ═══════════════════════ EDITS CONTEXT ═══════════════════════ */
interface EditsContextValue {
  keeps: Set<string>;
  editIds: Set<string>; // card names that have edits
  onCardAction: (cardName: string, cardType: string, details: Record<string, string>) => void;
  onRemoveKeep: (cardName: string) => void;
}
const EditsContext = createContext<EditsContextValue | null>(null);

/* ═══════════════════════ CARD EDIT WRAPPER (HOC-style) ═══════════════════════ */
const CardEditOverlay: React.FC<{ cardName: string; cardType: string; details: Record<string, string>; children: React.ReactNode }> = ({ cardName, cardType, details, children }) => {
  const ctx = useContext(EditsContext);
  const [hovered, setHovered] = useState(false);
  if (!ctx) return <>{children}</>;

  const isKept = ctx.keeps.has(cardName);
  const isEdited = ctx.editIds.has(cardName);

  return (
    <div
      style={{ position: 'relative', alignSelf: 'start', width: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {/* Status pills */}
      {(isKept || isEdited) && (
        <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, display: 'flex', gap: 4 }}>
          {isKept && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); ctx.onRemoveKeep(cardName); }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] hover:brightness-125 hover:border-red-500/50 active:scale-95 transition-all cursor-pointer"
            >
              Keep <span className="text-[8px] ml-0.5 opacity-60">✕</span>
            </button>
          )}
          {isEdited && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))]">Edit</span>
          )}
        </div>
      )}
      {/* Hover overlay */}
      {hovered && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 9,
            background: 'rgba(0,0,0,0.25)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onClick={(e) => { e.stopPropagation(); ctx.onCardAction(cardName, cardType, details); }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] backdrop-blur-sm">
            <Pencil size={16} color="#fff" />
          </div>
        </div>
      )}
    </div>
  );
};

const SECTIONS = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Form Inputs' },
  { id: 'badges', label: 'Badges & Tags' },
  { id: 'panels', label: 'Panels & Modals' },
  { id: 'icons', label: 'Icons' },
] as const;

/* ─── inline style constants matching the HTML mockup ─── */
const sg = {
  primary: '#4a5f7f',
  bg: '#f3f4f6',
  surface: '#ffffff',
  text: 'hsl(228, 7%, 20%)',
  muted: '#64748b',
  border: '#d9dee6',
  borderStrong: '#c6ced9',
  dark: '#2a2a2f',
  shadow: '0 8px 24px rgba(15,23,42,0.08)',
  shadowHover: '0 12px 32px rgba(15,23,42,0.12)',
} as const;

/* ═══════════════════════ PAGE SUBHEADING ═══════════════════════ */
const PageSubheading: React.FC<{ children: React.ReactNode; fullSpan?: boolean }> = ({ children, fullSpan }) => (
  <div style={{
    display: 'block', margin: '22px 0 10px', padding: '8px 14px', borderRadius: 6,
    background: 'linear-gradient(90deg, #2d2d2d 0%, #646973 65%, rgba(100,105,115,0) 100%)',
    color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase',
    ...(fullSpan ? { gridColumn: '1 / -1' } : {}),
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

/* ═══════════════════════ SWATCH CARD V2 (Standardized) ═══════════════════════ */
interface SwatchV2Props {
  color: string;
  name: string;
  locations: string;
  value: string;
  token: string;
  pageSpecific: boolean;
  appWide: boolean;
  effect?: string;
  extraPreviewStyle?: React.CSSProperties;
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#334155', fontFamily: 'Inter, system-ui, sans-serif',
};
const valueStyle: React.CSSProperties = {
  fontSize: 12, color: '#334155', fontFamily: 'Inter, system-ui, sans-serif',
};

const SwatchCardV2: React.FC<SwatchV2Props> = (props) => {
  const { color, name, locations, value, token, pageSpecific, appWide, effect, extraPreviewStyle } = props;
  const details = { Value: value, Token: token, Locations: locations, ...(effect ? { Effect: effect } : {}) };
  return (
  <CardEditOverlay cardName={name} cardType="Swatch" details={details}>
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadowHover; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadow; }}
  >
    <div style={{ height: 78, background: color, ...extraPreviewStyle }} />
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Color Name:</span>
        <span style={valueStyle}>{name}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Locations:</span>
        <span style={valueStyle}>{locations}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Value:</span>
        <span style={{ ...valueStyle, fontFamily: "'SF Mono','Fira Code','JetBrains Mono',monospace", fontSize: 11 }}>{value}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Token:</span>
        <span style={{ ...valueStyle, fontFamily: "'SF Mono','Fira Code','JetBrains Mono',monospace", fontSize: 11 }}>{token}</span>
      </div>
      {effect && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Effect:</span>
          <span style={{ ...valueStyle, fontFamily: "'SF Mono','Fira Code','JetBrains Mono',monospace", fontSize: 11 }}>{effect}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={pageSpecific} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          Page Specific
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={appWide} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          App Wide
        </label>
      </div>
    </div>
  </div>
  </CardEditOverlay>
  );
};

/* ═══════════════════════ TYPO CARD V2 (Standardized) ═══════════════════════ */
interface TypoV2Props {
  fontName: string;
  exampleContent: React.ReactNode;
  exampleBg?: string;
  fontFamily?: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing?: string;
  textTransform?: string;
  color: string;
  lineHeight?: string;
  locations: string;
  pageSpecific: boolean;
  appWide: boolean;
}

const monoStyle: React.CSSProperties = { ...valueStyle, fontFamily: "'SF Mono','Fira Code','JetBrains Mono',monospace", fontSize: 11 };

const TypoCardV2: React.FC<TypoV2Props> = (props) => {
  const { fontName, exampleContent, exampleBg, fontFamily, fontSize, fontWeight, letterSpacing, textTransform, color, lineHeight, locations, pageSpecific, appWide } = props;
  const details = { 'Font Family': fontFamily || '', 'Font Size': fontSize, 'Font Weight': fontWeight, Color: color, Locations: locations };
  return (
  <CardEditOverlay cardName={fontName} cardType="Typography" details={details}>
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadowHover; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadow; }}
  >
    {/* Example preview strip */}
    <div style={{
      background: exampleBg || '#fff', padding: '14px 16px',
      display: 'flex', alignItems: 'center', minHeight: 56,
    }}>{exampleContent}</div>

    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Font Name:</span>
        <span style={valueStyle}>{fontName}</span>
      </div>
      {fontFamily && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Font Family:</span>
          <span style={monoStyle}>{fontFamily}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Font Size:</span>
        <span style={monoStyle}>{fontSize}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Font Weight:</span>
        <span style={monoStyle}>{fontWeight}</span>
      </div>
      {letterSpacing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Letter Spacing:</span>
          <span style={monoStyle}>{letterSpacing}</span>
        </div>
      )}
      {textTransform && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Text Transform:</span>
          <span style={monoStyle}>{textTransform}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Color:</span>
        <span style={monoStyle}>{color}</span>
      </div>
      {lineHeight && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Line Height:</span>
          <span style={monoStyle}>{lineHeight}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Locations:</span>
        <span style={valueStyle}>{locations}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={pageSpecific} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          Page Specific
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={appWide} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          App Wide
        </label>
      </div>
    </div>
  </div>
  </CardEditOverlay>
  );
};


/* ═══════════════════════ INPUT CARD V2 (Standardized) ═══════════════════════ */
interface InputV2Props {
  inputName: string;
  preview: React.ReactNode;
  background: string;
  border: string;
  borderRadius: string;
  textColor: string;
  placeholderColor?: string;
  focusStyle?: string;
  fontSize: string;
  padding: string;
  purpose: string;
  locations: string;
  pageSpecific?: boolean;
  appWide?: boolean;
  notes?: string;
}

const InputCardV2: React.FC<InputV2Props> = (props) => {
  const { inputName, preview, background, border, borderRadius, textColor, placeholderColor, focusStyle, fontSize, padding, purpose, locations, pageSpecific, appWide, notes } = props;
  const details = { Background: background, Border: border, 'Border Radius': borderRadius, 'Text Color': textColor, 'Font Size': fontSize, Padding: padding, Purpose: purpose, Locations: locations };
  return (
  <CardEditOverlay cardName={inputName} cardType="Input" details={details}>
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadowHover; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadow; }}
  >
    {/* Preview strip */}
    <div style={{
      background: '#fff', padding: '16px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 12, minHeight: 64,
      boxShadow: 'inset 0 -1px 0 #e2e8f0',
    }}>{preview}</div>

    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Input Name:</span>
        <span style={valueStyle}>{inputName}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Background:</span>
        <span style={monoStyle}>{background}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Border:</span>
        <span style={monoStyle}>{border}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Border Radius:</span>
        <span style={monoStyle}>{borderRadius}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Text Color:</span>
        <span style={monoStyle}>{textColor}</span>
      </div>
      {placeholderColor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Placeholder Color:</span>
          <span style={monoStyle}>{placeholderColor}</span>
        </div>
      )}
      {focusStyle && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Focus Style:</span>
          <span style={monoStyle}>{focusStyle}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Font Size:</span>
        <span style={monoStyle}>{fontSize}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Padding:</span>
        <span style={monoStyle}>{padding}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Purpose:</span>
        <span style={valueStyle}>{purpose}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Locations:</span>
        <span style={valueStyle}>{locations}</span>
      </div>
      {notes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Notes:</span>
          <span style={valueStyle}>{notes}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={pageSpecific} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          Page Specific
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={appWide} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          App Wide
        </label>
      </div>
    </div>
  </div>
  </CardEditOverlay>
  );
};


/* ═══════════════════════ BADGE CARD V2 (Standardized) ═══════════════════════ */
interface BadgeV2Props {
  badgeName: string;
  preview: React.ReactNode;
  
  background: string;
  textColor: string;
  size: string;
  borderRadius: string;
  padding: string;
  purpose: string;
  locations: string;
  pageSpecific?: boolean;
  appWide?: boolean;
  notes?: string;
  states?: string;
}

const BadgeCardV2: React.FC<BadgeV2Props> = (props) => {
  const { badgeName, preview, background, textColor, size, borderRadius, padding, purpose, locations, pageSpecific, appWide, notes, states } = props;
  const details = { Background: background, 'Text Color': textColor, Size: size, 'Border Radius': borderRadius, Padding: padding, Purpose: purpose, Locations: locations };
  return (
  <CardEditOverlay cardName={badgeName} cardType="Badge" details={details}>
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadowHover; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadow; }}
  >
    {/* Preview strip */}
    <div style={{
      background: '#fff', padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 64,
      boxShadow: 'inset 0 -1px 0 #e2e8f0', flexWrap: 'wrap',
    }}>{preview}</div>

    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Badge Name:</span>
        <span style={valueStyle}>{badgeName}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Background:</span>
        <span style={monoStyle}>{background}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Text Color:</span>
        <span style={monoStyle}>{textColor}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Size:</span>
        <span style={monoStyle}>{size}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Border Radius:</span>
        <span style={monoStyle}>{borderRadius}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Padding:</span>
        <span style={monoStyle}>{padding}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Purpose:</span>
        <span style={valueStyle}>{purpose}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Locations:</span>
        <span style={valueStyle}>{locations}</span>
      </div>
      {states && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>States:</span>
          <span style={valueStyle}>{states}</span>
        </div>
      )}
      {notes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Notes:</span>
          <span style={valueStyle}>{notes}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={pageSpecific} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          Page Specific
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={appWide} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          App Wide
        </label>
      </div>
    </div>
  </div>
  </CardEditOverlay>
  );
};


interface TypeTileProps {
  name: string;
  exampleBg?: string;
  exampleContent: React.ReactNode;
  specs: string[];
  locations: string;
}

/* ═══════════════════════ PANEL CARD V2 (Standardized) ═══════════════════════ */
interface PanelV2Props {
  panelName: string;
  preview: React.ReactNode;
  previewBg?: string;
  background: string;
  border: string;
  borderRadius: string;
  shadow?: string;
  purpose: string;
  locations: string;
  pageSpecific?: boolean;
  appWide?: boolean;
  notes?: string;
}

const PanelCardV2: React.FC<PanelV2Props> = (props) => {
  const { panelName, preview, previewBg, background, border, borderRadius, shadow, purpose, locations, pageSpecific, appWide, notes } = props;
  const details = { Background: background, Border: border, 'Border Radius': borderRadius, ...(shadow ? { Shadow: shadow } : {}), Purpose: purpose, Locations: locations };
  return (
  <CardEditOverlay cardName={panelName} cardType="Panel" details={details}>
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadowHover; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadow; }}
  >
    {/* Preview strip */}
    <div style={{
      background: previewBg || '#fff', padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 80,
      boxShadow: 'inset 0 -1px 0 #e2e8f0',
    }}>{preview}</div>

    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Panel Name:</span>
        <span style={valueStyle}>{panelName}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Background:</span>
        <span style={monoStyle}>{background}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Border:</span>
        <span style={monoStyle}>{border}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Border Radius:</span>
        <span style={monoStyle}>{borderRadius}</span>
      </div>
      {shadow && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Shadow:</span>
          <span style={monoStyle}>{shadow}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Purpose:</span>
        <span style={valueStyle}>{purpose}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Locations:</span>
        <span style={valueStyle}>{locations}</span>
      </div>
      {notes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={labelStyle}>Notes:</span>
          <span style={valueStyle}>{notes}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={pageSpecific} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          Page Specific
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={appWide} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          App Wide
        </label>
      </div>
    </div>
  </div>
  </CardEditOverlay>
  );
};

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

/* ═══════════════════════ BUTTON CARD V2 (Standardized) ═══════════════════════ */
interface ButtonV2Props {
  buttonName: string;
  preview: React.ReactNode;
  buttonColor: string;
  textColor?: string;
  size: string;
  purpose: string;
  visualEffects?: string;
  locations: string;
  pageSpecific?: boolean;
  appWide?: boolean;
}

const ButtonCardV2: React.FC<ButtonV2Props> = (props) => {
  const { buttonName, preview, buttonColor, textColor, size, purpose, visualEffects, locations, pageSpecific, appWide } = props;
  const details = { 'Button Color': buttonColor, 'Text Color': textColor || '', Size: size, Purpose: purpose, 'Visual Effects': visualEffects || '', Locations: locations };
  return (
  <CardEditOverlay cardName={buttonName} cardType="Button" details={details}>
  <div style={{
    background: sg.surface, border: '2px solid #000', borderRadius: 10, overflow: 'hidden',
    boxShadow: sg.shadow, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadowHover; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = sg.shadow; }}
  >
    {/* Preview strip */}
    <div style={{
      background: '#fff', padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 64,
      boxShadow: 'inset 0 -1px 0 #e2e8f0',
    }}>{preview}</div>

    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Button Name:</span>
        <span style={valueStyle}>{buttonName}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Button Color:</span>
        <span style={monoStyle}>{buttonColor}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Text Color:</span>
        <span style={monoStyle}>{textColor}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Size:</span>
        <span style={monoStyle}>{size}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Purpose:</span>
        <span style={valueStyle}>{purpose}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Visual Effects:</span>
        <span style={monoStyle}>{visualEffects}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={labelStyle}>Locations:</span>
        <span style={valueStyle}>{locations}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={pageSpecific} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          Page Specific
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'default' }}>
          <input type="checkbox" checked={appWide} disabled style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
          App Wide
        </label>
      </div>
    </div>
  </div>
  </CardEditOverlay>
  );
};

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

const EntryCard: React.FC<EntryCardProps> = (props) => {
  const { name, pageTag, specs, preview, code, previewDark, previewPlain, previewStyle } = props;
  const details = { 'Page Tag': pageTag, Specs: specs };
  return (
  <CardEditOverlay cardName={name} cardType="Entry" details={details}>
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
  </CardEditOverlay>
  );
};

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
  onRegisterEdits?: (fn: (() => void) | null) => void;
  onEditsCountChange?: (count: number) => void;
}

export const StyleGuideTool: React.FC<StyleGuideToolProps> = ({ onRegisterDownload, onRegisterEdits, onEditsCountChange }) => {
  const [activeSection, setActiveSection] = useState('colors');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showRestructuring, setShowRestructuring] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Edits system state
  const [keeps, setKeeps] = useState<Set<string>>(new Set());
  const [editNames, setEditNames] = useState<Set<string>>(new Set());
  const [showEditsListModal, setShowEditsListModal] = useState(false);
  const [keepOrEditTarget, setKeepOrEditTarget] = useState<{ cardName: string; cardType: string; details: Record<string, string> } | null>(null);
  const [editDetailTarget, setEditDetailTarget] = useState<{ cardName: string; cardType: string; details: Record<string, string>; existingComment?: string; existingId?: string } | null>(null);

  const onEditsCountChangeRef = useRef(onEditsCountChange);
  onEditsCountChangeRef.current = onEditsCountChange;

  const refreshEditsState = useCallback(async () => {
    const [keepsData, registry] = await Promise.all([getKeeps(), getEditsRegistry()]);
    setKeeps(keepsData);
    setEditNames(new Set(registry.map(e => e.cardName)));
    onEditsCountChangeRef.current?.(registry.length);
  }, []);

  // Initial sync on mount
  useEffect(() => {
    refreshEditsState();
  }, [refreshEditsState]);

  const handleCardAction = useCallback((cardName: string, cardType: string, details: Record<string, string>) => {
    setKeepOrEditTarget({ cardName, cardType, details });
  }, []);

  const handleKeep = useCallback(async () => {
    if (!keepOrEditTarget) return;
    await addKeep(keepOrEditTarget.cardName);
    refreshEditsState();
  }, [keepOrEditTarget, refreshEditsState]);

  const handleEditOpen = useCallback(async () => {
    if (!keepOrEditTarget) return;
    const registry = await getEditsRegistry();
    const existing = registry.find(e => e.cardName === keepOrEditTarget.cardName);
    setEditDetailTarget({
      cardName: keepOrEditTarget.cardName,
      cardType: keepOrEditTarget.cardType,
      details: keepOrEditTarget.details,
      existingComment: existing?.comment,
      existingId: existing?.id,
    });
  }, [keepOrEditTarget]);

  const handleSaveEdit = useCallback(async (entry: EditEntry) => {
    await upsertEdit(entry);
    refreshEditsState();
  }, [refreshEditsState]);

  const handleRemoveKeep = useCallback(async (cardName: string) => {
    await removeKeep(cardName);
    refreshEditsState();
  }, [refreshEditsState]);

  const editsContextValue = React.useMemo<EditsContextValue>(() => ({
    keeps,
    editIds: editNames,
    onCardAction: handleCardAction,
    onRemoveKeep: handleRemoveKeep,
  }), [keeps, editNames, handleCardAction, handleRemoveKeep]);

  useEffect(() => {
    onRegisterDownload?.(() => setShowDownloadModal(true));
    return () => onRegisterDownload?.(null);
  }, [onRegisterDownload]);

  useEffect(() => {
    onRegisterEdits?.(() => setShowEditsListModal(true));
    return () => onRegisterEdits?.(null);
  }, [onRegisterEdits]);
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
    if (showRestructuring) {
      setShowRestructuring(false);
      requestAnimationFrame(() => {
        document.getElementById(`sg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      document.getElementById(`sg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showRestructuring]);

  const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMedium ? '1fr' : 'repeat(2,minmax(0,1fr))', gap: 16, alignItems: 'stretch' };
  const fullSpan: React.CSSProperties = isMedium ? {} : { gridColumn: '1 / -1' };

  return (
    <EditsContext.Provider value={editsContextValue}>
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
          {/* Restructuring button */}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button onClick={() => setShowRestructuring(!showRestructuring)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: showRestructuring ? 'rgba(74,95,127,0.12)' : 'transparent',
              color: showRestructuring ? sg.primary : '#475569',
              boxShadow: showRestructuring ? 'inset 0 0 0 1px rgba(74,95,127,0.18)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: 999, flexShrink: 0,
                background: showRestructuring ? sg.primary : '#cbd5e1',
                transition: 'background 0.2s ease',
              }} />
              App Style Restructuring
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>
            Design System v1.0
          </div>
        </nav>
      )}

      {/* ─── MAIN AREA ─── */}
      {showRestructuring ? (
        <div style={{ flex: 1, background: '#ffffff' }} />
      ) : (
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
          {/* ═══ 1. COLORS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="colors" title="Colors" desc="All colors organized by the page they appear on. Every value verified against live source code and CSS custom properties.">
            
            {/* ─── Story Builder ─── */}
            <PageSubheading>Story Builder Page</PageSubheading>
            <PageDesc>Colors used across the Story Builder / Story Setup interface.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#4a5f7f" name="Slate Blue" locations="Panel header bars, MAIN CHARACTERS pill" value="#4a5f7f" token="bg-[#4a5f7f]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#2a2a2f" name="Dark Charcoal" locations="Panel containers, Character Roster sidebar, character cards" value="#2a2a2f" token="bg-[#2a2a2f]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#1a1a1a" name="Soft Black" locations="Left icon navigation sidebar" value="#1a1a1a" token="bg-[#1a1a1a]" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="hsl(228, 7%, 20%)" name="Graphite" locations="Story Setup heading, header titles, DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image, header action buttons, secondary button text, ghost button hover" value="hsl(228 7% 20%)" token="text-[hsl(var(--ui-surface-2))]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="rgba(248,250,252,0.3)" name="Ghost White" locations="Top header bar backgrounds, Main content area behind panels, Story card stats, 'Created by' text, form labels, loading text, checkbox labels, Story card description, folder description, sidebar chevrons, empty state text, unpublish button, character labels, model subtitle, review score" value="rgba(248,250,252,0.3)" token="text-[rgba(248,250,252,0.3)] / bg-[rgba(248,250,252,0.3)]" pageSpecific={false} appWide={true} extraPreviewStyle={{ border: '1px dashed #ccc' }} />
              <SwatchCardV2 color="#64748b" name="Cool Gray" locations="Subtitle text below page headings" value="#64748b" token="text-slate-500" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="rgba(24,24,27,0.5)" name="Smoke Black" locations="All text inputs, textareas, bullet-list containers" value="rgba(24,24,27,0.5)" token="bg-zinc-900/50" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#3f3f46" name="Mid Charcoal" locations="Input borders, textarea borders, tag chip borders" value="#3f3f46" token="border-zinc-700" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#3b82f6" name="True Blue" locations="Art Style checkmark badge, guidance box border, Play button on card hover, tag badges, Open buttons, Plus buttons, reposition overlay, Chronicle logo, Provider label, Learn More link, day counter arrows, time-of-day active state, arc flow connectors, Save buttons, '+ Add' links, active slider labels, SFW badge text, user message bubble border, dashed add button text, sparkle icon hover, character name hover, AI/Player toggle, focus rings on style selectors, input focus borders" value="#3b82f6" token="bg-blue-500 / text-blue-500 / border-blue-500 / ring-blue-500" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#a1a1aa" name="Silver Gray" locations="Trash icons, tag chip text, inactive tab text" value="#a1a1aa" token="text-zinc-400" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#71717a" name="Stone Gray" locations='Dashed "add" button borders, inactive slider labels' value="#71717a" token="border-zinc-500" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#27272a" name="Dark Zinc" locations="Genre/Origin/Type tag chips, art style card backgrounds, character avatar, Story card gradient overlay, admin card gradient, folder card gradient, loading screen background" value="#27272a" token="bg-zinc-800" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="hsl(210, 20%, 93%)" name="Pale Silver" locations="Shadow Surface button text, dark panel text" value="hsl(210 20% 93%)" token="text-[hsl(var(--ui-text))]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#e2e8f0" name="Light Steel" locations="Header bar bottom border" value="#e2e8f0" token="border-slate-200" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="rgba(58,58,63,0.3)" name="Muted Charcoal" locations="Story Arc guidance description box" value="rgba(58,58,63,0.3)" token="bg-[#3a3a3f]/30" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px solid rgba(59,130,246,0.2)' }} />
              <SwatchCardV2 color="#d4d4d8" name="Light Zinc" locations="Bullet list text in World Codex Dialog Formatting" value="#d4d4d8" token="text-zinc-300" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="rgba(255,255,255,0.1)" name="Faint White" locations="Button borders, panel outer borders, character card borders" value="rgba(255,255,255,0.1)" token="border-white/10" pageSpecific={false} appWide={true} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(255,255,255,0.2)" name="Dim White" locations="Panel header bar bottom border" value="rgba(255,255,255,0.2)" token="border-white/20" pageSpecific={false} appWide={true} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>

            <Divider />

            {/* ─── My Stories ─── */}
            <PageSubheading>My Stories Page</PageSubheading>
            <PageDesc>Colors used on the My Stories gallery/card grid.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="rgba(248,250,252,0.5)" name="Frosted White" locations="Full page background" value="rgba(248,250,252,0.5)" token="bg-slate-50/50" pageSpecific={false} appWide={true} extraPreviewStyle={{ border: '1px dashed #ccc' }} />
              <SwatchCardV2 color="#4a5f7f" name="Slate Blue" locations="Active tab pill, story card border" value="#4a5f7f" token="bg-[#4a5f7f]" pageSpecific={false} appWide={true} />
              
              <SwatchCardV2 color="#2a2a2f" name="Dark Charcoal" locations="SFW/NSFW badge backgrounds on story cards" value="#2a2a2f" token="bg-[#2a2a2f]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#f87171" name="Coral Red" locations="NSFW badge text" value="#f87171" token="text-red-400" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#ef4444" name="Bright Red" locations="Delete button on card hover" value="#ef4444" token="bg-[hsl(var(--destructive))]" pageSpecific={false} appWide={true} />
              
              <SwatchCardV2 color="#52525b" name="Ash Gray" locations='"Create New Story" card border' value="#52525b" token="border-zinc-600" pageSpecific={true} appWide={false} />
              
              
              <SwatchCardV2 color="rgba(0,0,0,0.5)" name="Half Black" locations="Story card and panel shadow" value="rgba(0,0,0,0.5)" token="shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)]" pageSpecific={false} appWide={true} />
            </div>

            <Divider />

            {/* ─── Community Gallery ─── */}
            <PageSubheading>Community Gallery</PageSubheading>
            <PageDesc>Colors specific to the Community Gallery page and gallery cards.</PageDesc>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#121214" name="Near Black" locations="GalleryHub main wrapper, Account page background" value="#121214" token="bg-[#121214]" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="rgba(18,18,20,0.8)" name="Glass Black" locations="Gallery sticky header" value="rgba(18,18,20,0.8)" token="bg-[#121214]/80" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(58,58,63,0.5)" name="Smoke Charcoal" locations="Gallery search input background" value="rgba(58,58,63,0.5)" token="bg-[#3a3a3f]/50" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="#18181b" name="Dark Zinc" locations="Gallery category filter sidebar" value="#18181b" token="bg-[#18181b]" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#facc15" name="Bright Yellow" locations="Category sidebar accent bar" value="#facc15" token="bg-yellow-400" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="rgba(59,130,246,0.2)" name="Faint Blue" locations="Active story type filter chip background" value="rgba(59,130,246,0.2)" token="bg-blue-500/20" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(168,85,247,0.2)" name="Faint Purple" locations="Active genre filter chip background" value="rgba(168,85,247,0.2)" token="bg-purple-500/20" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>

            <Divider />

            {/* ─── Chat Interface ─── */}
            <PageSubheading>Chat Interface</PageSubheading>
            <PageDesc>Colors unique to the chat/conversation view.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#1c1f26" name="Ink Blue" locations="Chat message bubble, transparent mode OFF" value="#1c1f26" token="bg-[#1c1f26]" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="rgba(0,0,0,0.5)" name="Half Black" locations="Chat message bubble, transparent mode ON" value="rgba(0,0,0,0.5)" token="bg-black/50" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="#94a3b8" name="Muted Slate" locations="Italic action text in chat (*actions*)" value="#94a3b8" token="text-slate-400" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="rgba(199,210,254,0.9)" name="Soft Indigo" locations="Thought text in chat (parenthetical)" value="rgba(199,210,254,0.9)" token="text-indigo-200/90" effect="textShadow: indigo glow" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="#3b82f6" name="True Blue" locations="User message bubble border" value="#3b82f6" token="border-blue-500" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="rgba(255,255,255,0.3)" name="Milky White" locations="SideCharacterCard when sidebar bg is dark (isDarkBg=true)" value="rgba(255,255,255,0.3)" token="bg-white/30" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(0,0,0,0.3)" name="Smoke Black" locations="SideCharacterCard when sidebar bg is light (isDarkBg=false)" value="rgba(0,0,0,0.3)" token="bg-black/30" pageSpecific={true} appWide={false} />
            </div>

            <Divider />

            {/* ─── Chat History ─── */}
            <PageSubheading>Chat History</PageSubheading>
            <PageDesc>Colors for the conversation session cards.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#2a2a2f" name="Dark Charcoal" locations="Session card outer background, empty state card" value="#2a2a2f" token="bg-[#2a2a2f]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="rgba(58,58,63,0.3)" name="Muted Charcoal" locations="Inner nested card in session entries" value="rgba(58,58,63,0.3)" token="bg-[#3a3a3f]/30" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(255,255,255,0.05)" name="Ghost White" locations="Inner card subtle border" value="rgba(255,255,255,0.05)" token="border-white/5" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(255,255,255,0.1)" name="Faint White" locations="Session delete button background" value="rgba(255,255,255,0.1)" token="bg-white/10" pageSpecific={false} appWide={true} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(24,24,27,0.5)" name="Smoke Black" locations="Last message preview box in session cards" value="rgba(24,24,27,0.5)" token="bg-zinc-900/50" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="#71717a" name="Stone Gray" locations="Message count, date, Created by attribution" value="#71717a" token="text-zinc-500" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#a1a1aa" name="Silver Gray" locations="Last message preview text, delete icon default" value="#a1a1aa" token="text-zinc-400" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#4a5f7f" name="Slate Blue" locations="Session card border, empty state border, thumbnail border" value="#4a5f7f" token="border-[#4a5f7f]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#27272a" name="Dark Zinc" locations="Thumbnail fallback background" value="#27272a" token="bg-zinc-800" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="rgba(255,255,255,0.15)" name="Dim White" locations="Delete button hover background" value="rgba(255,255,255,0.15)" token="bg-white/15" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="#f87171" name="Coral Red" locations="Delete button hover icon color" value="#f87171" token="text-red-400" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="rgba(239,68,68,0.3)" name="Faint Red" locations="Delete button hover border" value="rgba(239,68,68,0.3)" token="border-red-500/30" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>

            <Divider />

            {/* ─── Account Page ─── */}
            <PageSubheading>Account Page</PageSubheading>
            <PageDesc>Colors for the dark-themed Account settings page.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#121214" name="Near Black" locations="Full page background for Account section" value="#121214" token="bg-[#121214]" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#1e1e22" name="Charcoal" locations="Email, Plan, Password setting cards" value="#1e1e22" token="bg-[#1e1e22]" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#2b2b2e" name="Warm Charcoal" locations="Pill tab container on Account and Gallery pages" value="#2b2b2e" token="bg-[#2b2b2e]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="rgba(74,95,127,0.2)" name="Frosted Slate" locations="Subscription plan badge background" value="rgba(74,95,127,0.2)" token="bg-[#4a5f7f]/20" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>

            <Divider />

            {/* ─── Auth Page ─── */}
            <PageSubheading>Auth Page</PageSubheading>
            <PageDesc>The light-themed authentication page gradient and card colors.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)" name="Navy-to-Purple Gradient" locations="Auth page full-screen background" value="from-slate-900 via-purple-900 to-slate-900" token="—" pageSpecific={true} appWide={false} extraPreviewStyle={{ background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)' }} />
              <SwatchCardV2 color="rgba(30,41,59,0.5)" name="Dark Slate Glass" locations="Login/signup Card component background" value="rgba(30,41,59,0.5)" token="bg-slate-800/50" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(51,65,85,0.5)" name="Slate Glass" locations="Email and password input fields on auth page" value="rgba(51,65,85,0.5)" token="bg-slate-700/50" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="#7c3aed" name="Vivid Purple" locations="Sign In / Create Account button" value="#7c3aed" token="bg-purple-600" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#a78bfa" name="Soft Purple" locations="'Don't have an account? Sign up' toggle text" value="#a78bfa" token="text-purple-400" pageSpecific={true} appWide={false} />
            </div>
            <InconsistencyNote items={[
              { file: 'Auth.tsx', note: 'Uses purple accent (purple-600 button, purple-400 link) while rest of app uses blue #4a5f7f accent.' },
            ]} />

            <Divider />

            {/* ─── Creator Profile ─── */}
            <PageSubheading>Creator Profile</PageSubheading>
            <PageDesc>Colors for the public Creator Profile page.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#121214" name="Near Black" locations="Full page background (same as Gallery/Account)" value="#121214" token="bg-[#121214]" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#1e1e22" name="Charcoal" locations="Profile info card, bio section" value="#1e1e22" token="bg-[#1e1e22]" pageSpecific={true} appWide={false} />
              
              <SwatchCardV2 color="rgba(255,255,255,0.05)" name="Ghost White" locations="Stat pills (followers, plays, etc.) on Creator Profile" value="rgba(255,255,255,0.05)" token="bg-white/5" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(255,255,255,0.1)" name="Faint White" locations="Unfollow button (toggle state)" value="rgba(255,255,255,0.1)" token="bg-white/10" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>
            <InconsistencyNote items={[
              { file: 'CreatorProfile.tsx', note: 'Uses bg-[#1e1e22] surface which doesn\'t match bg-[#2a2a2f] or bg-zinc-900 used elsewhere.' },
            ]} />

            <Divider />

            {/* ─── Global Sidebar ─── */}
            <PageSubheading>Global Sidebar</PageSubheading>
            <PageDesc>Colors for the main application navigation sidebar.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#1a1a1a" name="Soft Black" locations="Global left sidebar (280px expanded, 72px collapsed)" value="#1a1a1a" token="bg-[#1a1a1a]" pageSpecific={false} appWide={true} />
              <SwatchCardV2 color="#4a5f7f" name="Slate Blue" locations="Active navigation item background" value="#4a5f7f" token="bg-[#4a5f7f]" pageSpecific={false} appWide={true} effect="shadow-lg shadow-black/40" />
              <SwatchCardV2 color="#94a3b8" name="Muted Slate" locations="Inactive sidebar item text and icons" value="#94a3b8" token="text-slate-400" pageSpecific={false} appWide={true} />
            </div>

            <Divider />

            {/* ─── Character Builder ─── */}
            <PageSubheading>Character Builder</PageSubheading>
            <PageDesc>Colors specific to the Character Builder / CharactersTab editor.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="rgba(58,58,63,0.3)" name="Muted Charcoal" locations="HardcodedSection inner card, character trait row containers" value="rgba(58,58,63,0.3)" token="bg-[#3a3a3f]/30" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(24,24,27,0.5)" name="Smoke Black" locations="Read-only trait labels (Physical Appearance, Personality, etc.)" value="rgba(24,24,27,0.5)" token="bg-zinc-900/50" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
              <SwatchCardV2 color="rgba(96,165,250,0.1)" name="Faint Blue" locations="AI Enhance sparkle button hover state" value="rgba(96,165,250,0.1)" token="bg-blue-500/10" pageSpecific={true} appWide={false} extraPreviewStyle={{ border: '1px dashed #999' }} />
            </div>

            <Divider />

            {/* ─── Model Settings ─── */}
            <PageSubheading>Model Settings</PageSubheading>
            <PageDesc>Colors used on the Model Settings page — NOTE: this page uses a LIGHT THEME unlike the rest of the app.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="#ffffff" name="White" locations="Inactive model selection card background" value="#ffffff" token="bg-white" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#0f172a" name="Deep Navy" locations="Active/selected model card background, scale-[1.02]" value="#0f172a" token="bg-slate-900" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#faf5ff" name="Pale Lavender" locations="Admin-only share toggle row background, border-purple-200" value="#faf5ff" token="bg-purple-50" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#f8fafc" name="Ice White" locations="Connection setup container within Model Settings" value="#f8fafc" token="bg-slate-50" pageSpecific={true} appWide={false} />
            </div>
            <InconsistencyNote items={[
              { file: 'ModelSettingsTab.tsx', note: 'Uses LIGHT THEME (bg-white, text-[hsl(var(--ui-surface-2))], border-slate-200) while every other page in the app uses dark theme. Major design inconsistency.' },
              { file: 'ModelSettingsTab.tsx', note: 'Card hover uses scale-[1.02] transition — unique to this page, not used elsewhere.' },
            ]} />

            <Divider />

            {/* ─── World Tab ─── */}
            <PageSubheading>World Tab</PageSubheading>
            <PageDesc>Colors specific to the World Tab and its hint/character components.</PageDesc>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <SwatchCardV2 color="rgba(0,0,0,0.8)" name="Near Black Glass" locations="World Tab character card button background" value="rgba(0,0,0,0.8)" token="bg-black/80" pageSpecific={true} appWide={false} />
              <SwatchCardV2 color="#4a5f7f" name="Slate Blue" locations="Character card border, hover brightens to #6b82a8" value="#4a5f7f" token="border-[#4a5f7f]" pageSpecific={true} appWide={false} />
            </div>
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 2. TYPOGRAPHY ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="typography" title="Typography" desc="Font sizes, weights, and letter-spacing values extracted from source code." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif" exampleBg="#fff"
              exampleContent={<span className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">STORY BUILDER</span>}
              fontSize="18px (text-lg)" fontWeight="900 (font-black)"
              letterSpacing="-0.5px (tracking-tight)" textTransform="uppercase"
              color="hsl(228,7%,20%) (Graphite)"
              locations='Page title — top-left of the white header bar on every page ("STORY BUILDER", "ACCOUNT", "MY STORIES"). Always uppercase, next to the back arrow.'
              pageSpecific={false} appWide={true}
            />
            <TypoCardV2 fontName="System Sans-Serif" exampleBg="#fff"
              exampleContent={<span style={{ fontSize: 36, fontWeight: 900, color: 'hsl(228,7%,20%)', letterSpacing: '-0.9px' }}>Story Setup</span>}
              fontSize="36px" fontWeight="900 (font-black)"
              letterSpacing="-0.9px"
              color="hsl(228,7%,20%) (Graphite)"
              locations="Section heading — large heading at top of the content area on Story Builder page."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif" exampleBg="#4a5f7f"
              exampleContent={<span className="text-xl font-bold tracking-tight text-white">Story Card</span>}
              fontSize="20px (text-xl)" fontWeight="700 (font-bold)"
              letterSpacing="-0.5px (tracking-tight)"
              color="#ffffff (text-white)"
              locations='Panel header title — inside bg-[#4a5f7f] panel header bars ("Story Card", "World Core", "Story Arcs", "Opening Dialog").'
              pageSpecific={false} appWide={true}
            />
            <TypoCardV2 fontName="System Sans-Serif" exampleBg="#2a2a2f"
              exampleContent={<>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">STORY NAME</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider ml-6">BRIEF DESCRIPTION</span>
              </>}
              fontSize="10px (text-[10px])" fontWeight="700 (font-bold)"
              letterSpacing="0.05em (tracking-wider)" textTransform="uppercase"
              color="#ffffff (text-white)"
              locations="Field label — all form field labels inside dark panels."
              pageSpecific={false} appWide={true}
            />
            <TypoCardV2 fontName="System Sans-Serif" exampleBg="hsl(228, 7%, 20%)"
              exampleContent={<span className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: 'hsl(210, 20%, 93%)' }}>SAVE AND CLOSE</span>}
              fontSize="10px (text-[10px])" fontWeight="700 (font-bold)"
              letterSpacing="0.05em (tracking-wider)" textTransform="uppercase"
              color="hsl(210,20%,93%) (ui-text)" lineHeight="1 (leading-none)"
              locations='Button label — all Shadow Surface action buttons (DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image).'
              pageSpecific={false} appWide={true}
            />
            <TypoCardV2 fontName="System Sans-Serif" exampleBg="#2a2a2f"
              exampleContent={<span className="text-sm font-bold text-white">ASHLEY</span>}
              fontSize="14px (text-sm)" fontWeight="700 (font-bold)"
              color="#ffffff (text-white)"
              locations="Character name — names in the Character Roster sidebar panel."
              pageSpecific={true} appWide={false}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>My Stories Page</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="linear-gradient(to top, #020617, rgba(15,23,42,0.6))"
              exampleContent={<span className="text-lg font-black text-white tracking-tight">Acotar</span>}
              fontSize="18px (text-lg)" fontWeight="900 (font-black)"
              letterSpacing="tight (tracking-tight)"
              color="#ffffff (white)"
              locations="Story card title — story name on the card overlay gradient."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#fff"
              exampleContent={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="text-xs font-bold text-white bg-[#4a5f7f] rounded-full px-4 py-1.5">My Stories</span>
                  <span className="text-xs font-bold text-zinc-400">Community</span>
                </div>
              }
              fontSize="12px (text-xs)" fontWeight="700 (font-bold)"
              color="Active: #fff on #4a5f7f · Inactive: #a1a1aa"
              locations="Tab pill text — navigation tabs below the header bar on My Stories page."
              pageSpecific={true} appWide={false}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Community Gallery</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="linear-gradient(to top, #020617, rgba(15,23,42,0.6))"
              exampleContent={<span className="text-lg font-black text-white leading-tight tracking-tight">The Dark Forest</span>}
              fontSize="18px (text-lg)" fontWeight="900 (font-black)"
              letterSpacing="tight (tracking-tight)"
              color="#ffffff (white)" lineHeight="tight (leading-tight)"
              locations="Card title — story title on Gallery card overlay. Truncated. Hover: text-blue-300."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#2a2a2f"
              exampleContent={<span className="text-xs text-[rgba(248,250,252,0.3)] italic leading-relaxed">A romantic fantasy adventure in the fae lands...</span>}
              fontSize="12px (text-xs)" fontWeight="400 (normal, italic)"
              color="rgba(248,250,252,0.3) (Ghost White)" lineHeight="relaxed (leading-relaxed)"
              locations="Card description — story description below title on gallery cards. line-clamp-2."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#2a2a2f"
              exampleContent={<span className="text-[10px] text-[rgba(248,250,252,0.3)]">👁 123 ❤ 45 🔖 12 ▶ 67</span>}
              fontSize="10px (text-[10px])" fontWeight="400 (normal)"
              color="rgba(248,250,252,0.3) (Ghost White)"
              locations="Card stats — view/like/save/play counts at bottom of gallery cards. flex gap-3."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#3a3a3f"
              exampleContent={<span className="text-sm text-zinc-500">Search titles, descriptions, or #tags...</span>}
              fontSize="14px (text-sm)" fontWeight="400 (normal)"
              color="#71717a (zinc-500)"
              locations="Search placeholder — gallery search input placeholder text."
              pageSpecific={true} appWide={false}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Chat Interface</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#1c1f26"
              exampleContent={<span className="text-[15px] font-medium text-white leading-relaxed">"Hello there, how are you?"</span>}
              fontSize="15px (text-[15px])" fontWeight="500 (font-medium)"
              color="#ffffff (white)" lineHeight="relaxed (leading-relaxed)"
              locations="Speech text — speech/dialogue text in chat messages. Quoted content."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#1c1f26"
              exampleContent={<span className="text-[15px] italic text-slate-400 leading-relaxed">*walks slowly toward the door*</span>}
              fontSize="15px (text-[15px])" fontWeight="400 (italic)"
              color="#94a3b8 (slate-400)" lineHeight="relaxed (leading-relaxed)"
              locations="Action text — action text in chat messages wrapped in asterisks."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#1c1f26"
              exampleContent={<span className="text-[9px] font-black uppercase tracking-widest text-slate-500">NARRATOR</span>}
              fontSize="9px (text-[9px])" fontWeight="900 (font-black)"
              letterSpacing="widest (tracking-widest)" textTransform="uppercase"
              color="#64748b (slate-500)"
              locations="Character label — character name below avatar in chat bubbles. AI: text-slate-500, User: text-blue-300."
              pageSpecific={true} appWide={false}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Chat History</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#2a2a2f"
              exampleContent={<span className="font-bold text-white">The Dark Forest Adventure</span>}
              fontSize="16px (default)" fontWeight="700 (font-bold)"
              color="#ffffff (white)"
              locations="Session title — scenario title in chat history session cards. truncate."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="rgba(24,24,27,0.5)"
              exampleContent={<span className="text-sm text-zinc-400 leading-relaxed">The wind howled through the trees as she approached...</span>}
              fontSize="14px (text-sm)" fontWeight="400 (normal)"
              color="#a1a1aa (zinc-400)" lineHeight="relaxed (leading-relaxed)"
              locations="Message preview — last message preview in session cards. line-clamp-2."
              pageSpecific={true} appWide={false}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Account Page</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#1e1e22"
              exampleContent={<span className="text-lg font-bold text-white">Email Address</span>}
              fontSize="18px (text-lg)" fontWeight="700 (font-bold)"
              color="#ffffff (white)"
              locations="Settings section title — section headings in Account settings cards (Email, Plan, Password)."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#1e1e22"
              exampleContent={<span className="text-xs font-bold text-white/40 uppercase tracking-wider">NEW PASSWORD</span>}
              fontSize="12px (text-xs)" fontWeight="700 (font-bold)"
              letterSpacing="0.05em (tracking-wider)" textTransform="uppercase"
              color="rgba(255,255,255,0.4) (white/40)"
              locations="Account field label — form field labels in Account settings (New Password, Confirm)."
              pageSpecific={true} appWide={false}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Global Sidebar</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#1a1a1a"
              exampleContent={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="text-sm font-bold text-white">My Stories</span>
                  <span className="text-sm font-bold text-slate-400 ml-4">Chat History</span>
                </div>
              }
              fontSize="14px (text-sm)" fontWeight="700 (font-bold)"
              color="Active: #ffffff (white) · Inactive: #94a3b8 (slate-400)"
              locations="Sidebar nav item — global sidebar navigation items (expanded mode)."
              pageSpecific={false} appWide={true}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#4a5f7f"
              exampleContent={<span className="text-[10px] font-black tracking-wide uppercase text-blue-200">ACOTAR</span>}
              fontSize="10px (text-[10px])" fontWeight="900 (font-black)"
              letterSpacing="wide (tracking-wide)" textTransform="uppercase"
              color="#bfdbfe (blue-200)"
              locations="Sidebar subtitle — active scenario subtitle below Story Builder nav item."
              pageSpecific={false} appWide={true}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Character Builder</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="rgba(24,24,27,0.5)"
              exampleContent={<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PHYSICAL APPEARANCE</span>}
              fontSize="10px (text-[10px])" fontWeight="700 (font-bold)"
              letterSpacing="widest (tracking-widest)" textTransform="uppercase"
              color="#a1a1aa (zinc-400)"
              locations="HardcodedRow label (read-only) — read-only trait labels in character builder HardcodedRow components. Paired with Lock icon (w-3.5 h-3.5 text-zinc-400)."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="rgba(24,24,27,0.5)"
              exampleContent={<span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">CUSTOM TRAIT</span>}
              fontSize="10px (text-[10px])" fontWeight="700 (font-bold)"
              letterSpacing="widest (tracking-widest)" textTransform="uppercase"
              color="#d4d4d8 (zinc-300)"
              locations="ExtraRow editable label — user-created custom trait labels, editable via input. Same layout as HardcodedRow but without Lock icon, has red X delete."
              pageSpecific={true} appWide={false}
            />

            <div style={{ ...fullSpan, margin: '8px 0 4px' }}><Divider style={{ margin: '8px 0 4px' }} /></div>
            <div style={fullSpan}><PageSubheading>Model Settings</PageSubheading></div>

            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#0f172a"
              exampleContent={<span className="font-bold text-white">Grok Beta</span>}
              fontSize="16px (default)" fontWeight="700 (font-bold)"
              color="Active: #ffffff (white) · Inactive: #0f172a (slate-900)"
              locations="Model name — model name inside selection cards. White on dark active card, slate-900 on white inactive card."
              pageSpecific={true} appWide={false}
            />
            <TypoCardV2 fontName="System Sans-Serif"
              exampleBg="#f8fafc"
              exampleContent={<span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">SYSTEM LINKED</span>}
              fontSize="10px (text-[10px])" fontWeight="900 (font-black)"
              letterSpacing="widest (tracking-widest)" textTransform="uppercase"
              color="#059669 (emerald-600)"
              locations="Connection status text — connection status badge text in Model Settings. Error state: text-slate-500."
              pageSpecific={true} appWide={false}
            />
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 3. BUTTONS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="buttons" title="Button Styles" desc="All button styles found across the application. Verified against source code." style={twoCol}>
            <div style={fullSpan}><PageSubheading>Story Builder Page</PageSubheading></div>

            <ButtonCardV2
              buttonName="Default Button"
              preview={
                <button className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[10px] font-bold leading-none uppercase tracking-wider" style={{ cursor: 'default' }}>DEFAULT BUTTON</button>
              }
              buttonColor="hsl(228 7% 20%) — bg-[hsl(var(--ui-surface-2))]"
              textColor="hsl(210 20% 93%) — text-[hsl(var(--ui-text))]"
              size="h-10 (40px) × px-6 — rounded-xl (12px)"
              purpose="Standard action button used across the app"
              visualEffects="shadow: 0 10px 30px rgba(0,0,0,0.35) · border: 1px solid hsl(var(--ui-border))"
              locations="DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image — Story Builder header bar, modal footers, confirmation dialogs"
              pageSpecific={false} appWide={true}
            />
            <ButtonCardV2
              buttonName="AI Generate"
              preview={
                <button
                  className="group relative flex h-10 px-4 rounded-xl overflow-hidden text-white text-[10px] font-bold leading-none shadow-[0_12px_40px_rgba(0,0,0,0.45)] cursor-default"
                  style={{ minWidth: 140 }}
                >
                  {/* Layer 1: Iridescent outer border ring */}
                  <span aria-hidden className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.10)) drop-shadow(0 0 18px rgba(109,94,247,0.10)) drop-shadow(0 0 18px rgba(34,184,200,0.10))" }} />
                  {/* Layer 2: 2px border mask */}
                  <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "#2B2D33" }} />
                  {/* Layer 3: Surface gradient */}
                  <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33" }} />
                  {/* Layer 4: Top sheen */}
                  <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))" }} />
                  {/* Layer 5: Diagonal sheen */}
                  <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.22)", background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.00) 55%)", mixBlendMode: "screen" }} />
                  {/* Layer 6: Teal bloom */}
                  <span aria-hidden className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)" }} />
                  {/* Layer 7: Purple bloom */}
                  <span aria-hidden className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)" }} />
                  {/* Layer 8: Inner edge shadows */}
                  <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)" }} />
                  {/* Content */}
                  <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-200" style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }} />
                    <span className="whitespace-nowrap drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">AI Generate</span>
                  </span>
                </button>
              }
              buttonColor="#2B2D33 base with teal rgba(34,184,200) and purple rgba(109,94,247) gradient overlays at 22% opacity"
              textColor="#ffffff — text-white, text-[10px] font-bold. Sparkles icon: text-cyan-200 with teal glow filter"
              size="h-10 × px-4 — rounded-xl (12px), overflow-hidden"
              purpose="AI-powered generation actions — triggers AI content creation"
              visualEffects="8-layer construction: iridescent border ring (linear-gradient 90deg teal/purple/white), 2px border mask (#2B2D33), surface gradient, top sheen, diagonal sheen (mix-blend-mode: screen), teal bloom (blur-2xl top-left), purple bloom (blur-3xl bottom-right), inset edge shadows. Outer shadow: 0 12px 40px rgba(0,0,0,0.45)"
              locations="Avatar AI Generate, Cover Image AI Generate, Scene Gallery AI Generate — all action button groups"
              pageSpecific={false} appWide={true}
            />
            <ButtonCardV2
              buttonName="Dashed Add"
              preview={
                <button style={{ width: '100%', minHeight: 64, padding: '12px 18px', borderRadius: 12, border: '2px dashed #71717a', background: 'transparent', color: '#3b82f6', fontSize: 14, fontWeight: 500, cursor: 'default', fontFamily: 'inherit' }}>+ Add Custom Content</button>
              }
              buttonColor="transparent — bg-transparent"
              textColor="#3b82f6 — text-blue-500"
              size="full-width × min-h-[64px] × px-[18px] py-[12px] — rounded-[12px]"
              purpose="Add new items — story arcs, characters, custom content sections"
              visualEffects="border: 2px dashed #71717a (zinc-500). Hover: border-color #3b82f6, bg rgba(59,130,246,0.05)."
              locations="Story Builder — Add New Story Arc, Add Character, Add Custom Content, Add Next Phase."
              pageSpecific={true} appWide={false}
            />

            <div style={fullSpan}><PageSubheading>My Stories Page</PageSubheading></div>

            <ButtonCardV2
              buttonName="Card Hover Buttons — Edit / Delete / Play"
              buttonColor="Edit: #ffffff — bg-white. Delete: hsl(var(--destructive)) — bg-[hsl(var(--destructive))]. Play: #3b82f6 — bg-blue-500"
              textColor="Edit: hsl(228,7%,20%) — text-[hsl(var(--ui-surface-2))]. Delete/Play: #ffffff — text-white"
              size="h-8 px-4 — rounded-xl (12px)"
              purpose="Compact card variant for story card hover overlay actions"
              visualEffects="shadow-2xl · text-[10px] font-bold leading-none uppercase tracking-wider"
              locations="StoryHub — story card hover overlay"
              pageSpecific={true}
              appWide={false}
              preview={<div className="flex gap-2">
                <button className="h-8 px-4 rounded-xl bg-white text-[hsl(var(--ui-surface-2))] text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>EDIT</button>
                <button className="h-8 px-4 rounded-xl bg-[hsl(var(--destructive))] text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>DELETE</button>
                <button className="h-8 px-4 rounded-xl bg-blue-500 text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>PLAY</button>
              </div>}
            />
            <ButtonCardV2
              buttonName="Tab Pills — Active / Inactive"
              buttonColor="Active: #4a5f7f — bg-[#4a5f7f]. Inactive: transparent — bg-transparent"
              textColor="Active: #ffffff — text-white. Inactive: #a1a1aa — text-[#a1a1aa]"
              size="px-4 py-1.5 — rounded-full"
              purpose="Filter pill bar for story list segmentation"
              visualEffects="text-xs font-bold"
              locations="My Stories hub header — filter pills"
              pageSpecific={true}
              appWide={false}
              preview={<div className="flex gap-2">
                <button className="bg-[#4a5f7f] text-white text-xs font-bold px-4 py-1.5 rounded-full" style={{ cursor: 'default' }}>My Stories</button>
                <button className="text-zinc-400 text-xs font-bold px-4 py-1.5 rounded-full" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>Community</button>
              </div>}
            />
            <ButtonCardV2
              buttonName="Settings Gear"
              buttonColor="hsl(228 7% 20%) — bg-[hsl(var(--ui-surface-2))]"
              textColor="hsl(210 20% 93%) — text-[hsl(var(--ui-text))]"
              size="px-3 py-2 icon-only — rounded-xl (12px)"
              purpose="Opens background customization settings"
              visualEffects="shadow: 0 10px 30px rgba(0,0,0,0.35) · border: 1px solid hsl(var(--ui-border))"
              locations="My Stories hub header — gear icon for background picker"
              pageSpecific={true}
              appWide={false}
              preview={
                <button className="inline-flex items-center justify-center rounded-xl px-3 py-2 border bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>⚙</button>
              }
            />
            <ButtonCardV2
              buttonName="New Story Card"
              buttonColor="transparent → zinc-800/zinc-900 gradient — bg-gradient-to-br from-zinc-800 to-zinc-900"
              textColor="#71717a — text-zinc-500"
              size="aspect-[2/3] full card — rounded-[2rem]"
              purpose="Creates a new story — card-sized button in story grid"
              visualEffects="border: 2px dashed #52525b (zinc-600). Hover: border-blue-500, text-blue-500"
              locations="My Stories hub — last card in story grid"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 24px', borderRadius: 16, border: '2px dashed #52525b', background: 'linear-gradient(to bottom right, #27272a, #18181b)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(113,113,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#71717a' }}>+</div>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a' }}>New Story</span>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Story Detail — Edit"
              buttonColor="rgba(255,255,255,0.05) — bg-white/5"
              textColor="#ffffff — text-white"
              size="flex-1 h-12 — rounded-xl"
              purpose="Edit owned story from detail modal"
              visualEffects="border: 1px solid rgba(255,255,255,0.1) — border-white/10. Hover: bg-white/10"
              locations="StoryDetailModal — owned mode only"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <button className="h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors" style={{ cursor: 'default', minWidth: 140 }}>✏ Edit</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Story Detail — Play"
              buttonColor="#3b82f6 — bg-[#3b82f6]"
              textColor="#ffffff — text-white"
              size="flex-1 h-12 — rounded-xl"
              purpose="Play/resume story from detail modal"
              visualEffects="shadow-md. Hover: bg-[#2d6fdb]"
              locations="StoryDetailModal — both owned and gallery modes"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <button className="h-12 bg-[#3b82f6] rounded-xl text-white shadow-md text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2d6fdb] transition-colors" style={{ cursor: 'default', minWidth: 140 }}>▶ Play</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Story Detail — Like"
              buttonColor="Default: rgba(255,255,255,0.05) — bg-white/5. Active: rgba(244,63,94,0.2) — bg-rose-500/20"
              textColor="Default: #ffffff — text-white. Active: #fb7185 — text-rose-400"
              size="flex-1 h-12 — rounded-xl"
              purpose="Like a story — toggle button with filled heart when active"
              visualEffects="Default: border-white/10. Active: border-rose-500/50. fill-current on icon when active"
              locations="StoryDetailModal — gallery mode (non-owned)"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 20px', width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <button className="h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ cursor: 'default', minWidth: 100 }}>♡ Like</button>
                  <button className="h-12 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400 text-sm font-semibold flex items-center justify-center gap-2" style={{ cursor: 'default', minWidth: 100 }}>❤ Liked</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Story Detail — Save"
              buttonColor="Default: rgba(255,255,255,0.05) — bg-white/5. Active: rgba(245,158,11,0.2) — bg-amber-500/20"
              textColor="Default: #ffffff — text-white. Active: #fbbf24 — text-amber-400"
              size="flex-1 h-12 — rounded-xl"
              purpose="Save/bookmark a story — toggle button with filled bookmark when active"
              visualEffects="Default: border-white/10. Active: border-amber-500/50. fill-current on icon when active"
              locations="StoryDetailModal — gallery mode (non-owned)"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 20px', width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <button className="h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ cursor: 'default', minWidth: 100 }}>🔖 Save</button>
                  <button className="h-12 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-400 text-sm font-semibold flex items-center justify-center gap-2" style={{ cursor: 'default', minWidth: 100 }}>🔖 Saved</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Story Detail — Remove from Gallery"
              buttonColor="rgba(255,255,255,0.05) — bg-white/5"
              textColor="rgba(248,250,252,0.3) — text-[rgba(248,250,252,0.3)]"
              size="w-full h-10 — rounded-xl"
              purpose="Unpublish owned story from community gallery"
              visualEffects="border: 1px solid rgba(255,255,255,0.1) — border-white/10"
              locations="StoryDetailModal — owned + published stories only"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <button className="h-10 bg-white/5 border border-white/10 text-[rgba(248,250,252,0.3)] rounded-xl font-semibold text-sm flex items-center justify-center gap-2" style={{ cursor: 'default', minWidth: 220 }}>🌐 Remove from Gallery</button>
                </div>
              }
            />

            <div style={fullSpan}><PageSubheading>Community Gallery</PageSubheading></div>

            <ButtonCardV2
              buttonName="Gallery Icon Buttons — Like / Save"
              buttonColor="Default: rgba(255,255,255,0.9) — bg-white/90. Liked: #f43f5e — bg-rose-500. Saved: #f59e0b — bg-amber-500"
              textColor="Default: #334155 — text-slate-700. Liked/Saved: #ffffff — text-white"
              size="h-8 w-8 — rounded-xl (12px)"
              purpose="Icon toggle buttons for liking and saving gallery stories on card hover"
              visualEffects="shadow-2xl"
              locations="GalleryStoryCard — hover overlay"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-2xl" style={{ cursor: 'default' }}>♡</button>
                  <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-rose-500 text-white shadow-2xl" style={{ cursor: 'default' }}>♥</button>
                  <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xl" style={{ cursor: 'default' }}>🔖</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Gallery PLAY Button"
              buttonColor="#3b82f6 — bg-blue-500"
              textColor="#ffffff — text-white"
              size="h-8 px-4 — rounded-xl (12px)"
              purpose="Compact play action on gallery story card hover overlay"
              visualEffects="shadow-2xl · text-[10px] font-bold leading-none uppercase tracking-wider"
              locations="GalleryStoryCard — hover overlay"
              pageSpecific={true}
              appWide={false}
              preview={
                <button className="h-8 px-4 rounded-xl bg-blue-500 text-white text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl" style={{ cursor: 'default' }}>PLAY</button>
              }
            />
            <ButtonCardV2
              buttonName="Gallery Search Button"
              buttonColor="#4a5f7f — bg-[#4a5f7f]"
              textColor="#ffffff — text-white"
              size="px-4 py-1.5 — rounded-lg (8px)"
              purpose="Submit search inside the gallery search input"
              visualEffects="text-sm font-semibold. Hover: bg-[#5a6f8f]. Positioned absolute inside search input"
              locations="GalleryHub — search header"
              pageSpecific={true}
              appWide={false}
              preview={
                <button className="px-4 py-1.5 bg-[#4a5f7f] text-white rounded-lg font-semibold text-sm" style={{ cursor: 'default' }}>Search</button>
              }
            />
            <ButtonCardV2
              buttonName="Browse Categories Button"
              buttonColor="#4a5f7f — bg-[#4a5f7f]"
              textColor="#ffffff — text-white"
              size="px-4 py-3 — rounded-lg (8px)"
              purpose="Toggle the category filter sidebar open/close"
              visualEffects="text-sm font-semibold. Hover: bg-[#5a6f8f]. Filter count badge: px-1.5 py-0.5 bg-white/20 rounded-full text-xs"
              locations="GalleryHub — search header, right side"
              pageSpecific={true}
              appWide={false}
              preview={
                <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#4a5f7f] text-white font-semibold text-sm" style={{ cursor: 'default' }}>
                  ▦ Browse Categories
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">3</span>
                </button>
              }
            />

            <div style={fullSpan}><PageSubheading>Chat Interface</PageSubheading></div>

            <ButtonCardV2
              buttonName="Chat Settings / Generate Image Buttons"
              buttonColor="hsl(var(--ui-surface-2)) — bg-[hsl(var(--ui-surface-2))]"
              textColor="hsl(var(--ui-text)) — text-[hsl(var(--ui-text))]"
              size="rounded-xl px-4 py-2 — text-[10px] font-bold uppercase tracking-widest"
              purpose="Open chat settings modal / trigger scene image generation"
              visualEffects="border-[hsl(var(--ui-border))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))]"
              locations="ChatInterfaceTab — quick actions bar above input"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>⚙ Chat Settings</button>
                  <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest border bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>🖼 Generate Image</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Chat Send Button (Active / Inactive)"
              buttonColor="Active: #4a5f7f — bg-[#4a5f7f]. Inactive: bg-[hsl(var(--ui-surface-2))] opacity-50"
              textColor="Active: #ffffff — text-white. Inactive: text-[hsl(var(--ui-text-muted))]"
              size="rounded-xl px-4 py-2 — text-[10px] font-bold uppercase tracking-widest"
              purpose="Send current message to the AI. Shows 'Send' or '...' while streaming"
              visualEffects="shadow-[0_10px_30px_rgba(0,0,0,0.35)] border-[hsl(var(--ui-border))]"
              locations="ChatInterfaceTab — input area, right side"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-[#4a5f7f] text-white border border-[#4a5f7f] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Send</button>
                  <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-zinc-500 opacity-50 shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>Send</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Chat Message Action Icons"
              buttonColor="transparent — hover:bg-white/10"
              textColor="Default: #94a3b8 — text-slate-400. Hover: text-white. Save: text-green-400. Cancel: text-red-400"
              size="p-2 — rounded-lg"
              purpose="Per-message actions visible on hover (regenerate, menu, save edit, cancel edit)"
              visualEffects="transition-colors"
              locations="ChatInterfaceTab — message bubble hover overlay"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', background: '#1e1e1e', padding: 8, borderRadius: 8 }}>
                  <button className="p-2 rounded-lg text-slate-400" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>↻</button>
                  <button className="p-2 rounded-lg text-slate-400" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>⋮</button>
                  <button className="p-2 rounded-lg text-green-400" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✓</button>
                  <button className="p-2 rounded-lg text-red-400" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✕</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Sidebar Settings Cog"
              buttonColor="hsl(var(--ui-surface-2)) — bg-[hsl(var(--ui-surface-2))]"
              textColor="hsl(var(--ui-text)) — text-[hsl(var(--ui-text))]"
              size="rounded-xl px-3 py-2 — icon-only"
              purpose="Opens dropdown with 'Set Theme' option for sidebar customization"
              visualEffects="border-[hsl(var(--ui-border))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))]"
              locations="ChatInterfaceTab — sidebar header"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className="inline-flex items-center justify-center rounded-xl px-3 py-2 border bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ cursor: 'default' }}>⚙</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Exit Scenario"
              buttonColor="transparent — text link with icon"
              textColor="Dark bg: text-white hover:text-blue-300. Light bg: text-black hover:text-blue-500"
              size="text-xs font-black uppercase tracking-widest"
              purpose="Navigate back from chat to story hub"
              visualEffects="Adaptive color based on sidebar background luminosity (sidebarBgIsLight)"
              locations="ChatInterfaceTab — sidebar top, above character cards"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <div style={{ background: '#1e1e1e', padding: '8px 12px', borderRadius: 8 }}>
                    <span className="text-xs font-black uppercase tracking-widest text-white" style={{ cursor: 'default' }}>‹ Exit Scenario</span>
                  </div>
                  <div style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: 8 }}>
                    <span className="text-xs font-black uppercase tracking-widest text-black" style={{ cursor: 'default' }}>‹ Exit Scenario</span>
                  </div>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Time of Day Selectors"
              buttonColor="Active: #dbeafe — bg-blue-100 border-2 border-blue-500. Inactive: bg-white border border-black"
              textColor="Active: #3b82f6 — text-blue-500. Inactive: #000000 — text-black"
              size="p-2 — rounded-lg"
              purpose="Set the current time of day for the story (Sunrise / Day / Sunset / Night)"
              visualEffects="Active: shadow-sm. Inactive: hover:bg-slate-100"
              locations="ChatInterfaceTab — day/time control panel"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button className="p-2 rounded-lg bg-white border border-black text-black" style={{ cursor: 'default' }}><Sunrise className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg bg-blue-100 border-2 border-blue-500 text-blue-500 shadow-sm" style={{ cursor: 'default' }}><Sun className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg bg-white border border-black text-black" style={{ cursor: 'default' }}><Sunset className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg bg-white border border-black text-black" style={{ cursor: 'default' }}><Moon className="w-4 h-4" /></button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Day Counter Stepper"
              buttonColor="transparent — hover:bg-slate-100"
              textColor="#000000 — text-black font-bold text-sm. Arrows: hover:text-blue-500. Down disabled at day 1: opacity-30"
              size="Container: rounded-lg border border-black shadow-sm. Number: px-3 py-1.5. Arrows: px-1.5 py-0.5"
              purpose="Increment/decrement the in-story day counter"
              visualEffects="Container: bg-white shadow-sm. Vertical divider: border-l border-black"
              locations="ChatInterfaceTab — day/time control panel, below 'Day' label"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'black', marginBottom: 2 }}>Day</span>
                    <div className="inline-flex items-stretch bg-white rounded-lg border border-black shadow-sm" style={{ overflow: 'hidden' }}>
                      <span className="px-3 py-1.5 font-bold text-sm text-black" style={{ display: 'flex', alignItems: 'center' }}>1</span>
                      <div className="border-l border-black flex flex-col">
                        <button className="px-1.5 py-0.5 text-black hover:bg-slate-100" style={{ cursor: 'default', background: 'transparent', border: 'none', fontSize: 10, lineHeight: 1 }}>▲</button>
                        <button className="px-1.5 py-0.5 text-black opacity-30" style={{ cursor: 'default', background: 'transparent', border: 'none', fontSize: 10, lineHeight: 1 }}>▼</button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Timer Pause / Play"
              buttonColor="transparent — hover:bg-black/30"
              textColor="Adaptive via getTimeTextColor(): Sunrise/Day/Sunset → text-black. Night → text-white"
              size="p-0.5 — rounded"
              purpose="Pause or resume the auto-advancing time progression timer"
              visualEffects="Adaptive text color matches time-of-day sky background"
              locations="ChatInterfaceTab — auto-timer row in day/time panel"
              pageSpecific={true}
              appWide={false}
              preview={
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <div style={{ background: '#87CEEB', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="text-black text-xs font-mono">04:32</span>
                    <button className="p-0.5 rounded text-black" style={{ cursor: 'default', background: 'transparent', border: 'none', fontSize: 12 }}>⏸</button>
                  </div>
                  <div style={{ background: '#1a1a2e', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="text-white text-xs font-mono">04:32</span>
                    <button className="p-0.5 rounded text-white" style={{ cursor: 'default', background: 'transparent', border: 'none', fontSize: 12 }}>▶</button>
                  </div>
                </div>
              }
            />

            <div style={fullSpan}><PageSubheading>Chat History</PageSubheading></div>

            <ButtonCardV2
              buttonName="Session Delete Button"
              buttonColor="bg-white/10 border-white/10"
              textColor="text-zinc-400"
              size="p-2 rounded-lg"
              purpose="Delete a saved conversation session"
              visualEffects="Hover: bg-white/15 text-red-400 border-red-500/30"
              locations="ConversationsTab — action column on each session card"
              pageSpecific
              preview={
                <button className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400" style={{ cursor: 'default' }}>🗑</button>
              }
            />
            <ButtonCardV2
              buttonName="Load More Button"
              buttonColor="bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))]"
              textColor="text-[hsl(var(--ui-text))]"
              size="px-6 py-2 rounded-xl — text-sm font-bold"
              purpose="Paginated loading of additional conversation sessions"
              visualEffects="Shadow Surface: shadow-[0_10px_30px_rgba(0,0,0,0.35)]. Hover: bg-white/5. Active: bg-white/10 scale-95"
              locations="ConversationsTab — bottom of session list"
              pageSpecific
              preview={
                <button className="px-6 py-2 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-sm font-bold" style={{ cursor: 'default' }}>Load More (15 remaining)</button>
              }
            />

            <div style={fullSpan}><PageSubheading>Image Library</PageSubheading></div>

            <ButtonCardV2
              buttonName="Folder Hover Buttons — Edit / Open"
              buttonColor="Edit: bg-white text-[hsl(var(--ui-surface-2))]. Open: bg-blue-500 text-white"
              size="px-4 py-2 rounded-xl — font-bold text-xs uppercase tracking-wider"
              purpose="Overlay actions on folder card hover"
              visualEffects="shadow-xl on both"
              locations="ImageLibraryTab — folder card hover overlay"
              pageSpecific
              preview={<>
                <button className="px-4 py-2 bg-white text-[hsl(var(--ui-surface-2))] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl" style={{ cursor: 'default' }}>Edit</button>
                <button className="px-4 py-2 bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl" style={{ cursor: 'default' }}>Open</button>
              </>}
            />

            <div style={fullSpan}><PageSubheading>Account Page</PageSubheading></div>

            <ButtonCardV2
              buttonName="Account Tab Pills (Dark Variant)"
              buttonColor="Active: bg-[#4a5f7f] text-white shadow-sm. Inactive: text-[#a1a1aa]"
              size="px-4 py-1.5 rounded-full — text-xs font-bold"
              purpose="Tab navigation between Account, Subscription, Profile"
              visualEffects="Container: bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]. Inactive hover: text-[#e4e4e7]"
              locations="Account page tab bar. Same pattern on Gallery page sort pills"
              appWide
              preview={
                <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5">
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#4a5f7f] text-white shadow-sm" style={{ cursor: 'default' }}>Settings</button>
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold text-[#a1a1aa]" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>Subscription</button>
                  <button className="px-4 py-1.5 rounded-full text-xs font-bold text-[#a1a1aa]" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>Profile</button>
                </div>
              }
            />

            <div style={fullSpan}><PageSubheading>Auth Page</PageSubheading></div>

            <ButtonCardV2
              buttonName="Auth Submit Button"
              buttonColor="bg-purple-600 hover:bg-purple-700 text-white"
              size="w-full — shadcn Button default (h-10 px-4 py-2 rounded-md text-sm font-medium)"
              purpose="Sign In / Create Account form submission"
              locations="Auth.tsx — form submit"
              pageSpecific
              preview={
                <button className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-md text-sm font-medium" style={{ cursor: 'default' }}>Sign In</button>
              }
            />
            <ButtonCardV2
              buttonName="Auth Toggle Link"
              buttonColor="text-purple-400 hover:text-purple-300"
              size="text-sm — unstyled button (no bg, no border)"
              purpose="Toggle between Sign In and Sign Up forms"
              locations="Auth.tsx — below form"
              pageSpecific
              preview={
                <button className="text-purple-400 hover:text-purple-300 text-sm" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>{"Don't have an account? Sign up"}</button>
              }
            />

            <div style={fullSpan}><PageSubheading>Chronicle UI.tsx — Parallel Button System</PageSubheading></div>
            <div style={fullSpan}>
              <InconsistencyNote items={[
                { file: 'UI.tsx', note: 'Defines a completely separate Button component with 7 variants (primary, secondary, danger, ghost, brand, outlineDark, gradient). Uses rounded-xl px-4 py-2 text-sm font-semibold + active:scale-95 — different from both shadcn Button and Shadow Surface standard.' },
                { file: 'Global', note: 'Two parallel button systems coexist: shadcn Button (Auth, some modals) vs Chronicle UI.tsx Button (StoryHub, Chat, WorldTab, ModelSettings, ~50% of app).' },
              ]} />
            </div>

            <ButtonCardV2
              buttonName="Chronicle UI.tsx — Primary"
              buttonColor="bg-slate-900 text-white border-slate-900"
              size="rounded-xl px-4 py-2 — text-sm font-semibold"
              purpose="Primary actions across Chronicle UI system"
              visualEffects="hover:bg-slate-800 active:scale-95 shadow-md"
              locations="StoryHub, CharactersTab, WorldTab, ModelSettings"
              appWide
              preview={
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-slate-900 text-white border-slate-900 shadow-md" style={{ cursor: 'default' }}>Primary</button>
              }
            />
            <ButtonCardV2
              buttonName="Chronicle UI.tsx — Brand / Gradient / OutlineDark"
              buttonColor="Brand: bg-[#4a5f7f] text-white. Gradient: from-purple-600 via-violet-500 to-blue-500. OutlineDark: bg-zinc-900/80 text-white border-zinc-600"
              size="rounded-xl px-4 py-2 — text-sm font-semibold"
              purpose="Accent variant buttons in Chronicle UI system"
              visualEffects="Brand: shadow-md. Gradient: shadow-lg border-0. OutlineDark: hover:bg-zinc-800"
              locations="StoryHub, Chat, WorldTab, ModelSettings"
              appWide
              preview={<>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-[#4a5f7f] text-white border-[#4a5f7f] shadow-md" style={{ cursor: 'default' }}>Brand</button>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border-0 bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 text-white shadow-lg" style={{ cursor: 'default' }}>Gradient</button>
                <button className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-zinc-900/80 text-white border-zinc-600" style={{ cursor: 'default' }}>Outline Dark</button>
              </>}
            />

            <div style={fullSpan}><PageSubheading>Creator Profile</PageSubheading></div>

            <ButtonCardV2
              buttonName="Follow / Unfollow Toggle"
              buttonColor="Follow: bg-[#4a5f7f] text-white. Following: bg-white/10 text-white"
              size="w-full px-4 py-2.5 rounded-xl — text-sm font-semibold"
              purpose="Toggle follow state on creator profiles"
              visualEffects="Following hover: bg-red-500/20 text-red-400 (shows 'Unfollow' on hover). Uses UserPlus / UserMinus icons"
              locations="CreatorProfile.tsx — profile header"
              pageSpecific
              preview={<>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#4a5f7f] text-white" style={{ cursor: 'default' }}>+ Follow</button>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white/10 text-white" style={{ cursor: 'default' }}>✓ Following</button>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-red-500/20 text-red-400" style={{ cursor: 'default' }}>− Unfollow</button>
              </>}
            />

            <div style={fullSpan}><PageSubheading>Upload Source Menu</PageSubheading></div>

            <ButtonCardV2
              buttonName="UploadSourceMenu Dropdown (Light Theme)"
              buttonColor="Dropdown: bg-white border-slate-200"
              size="Dropdown items: px-2 py-1.5 text-sm text-[hsl(var(--ui-surface-2))]"
              purpose="Source selection for image uploads (Device or Library)"
              visualEffects="shadow-lg. Trigger uses Chronicle UI.tsx Button"
              locations="AvatarGenerationModal, CoverImageGenerationModal, SceneImageGenerationModal"
              appWide
              preview={
                <div className="bg-white border border-slate-200 rounded-md shadow-lg p-1" style={{ width: 180 }}>
                  <div className="px-2 py-1.5 text-sm text-[hsl(var(--ui-surface-2))] rounded-sm" style={{ cursor: 'default' }}>📤 From Device</div>
                  <div className="px-2 py-1.5 text-sm text-[hsl(var(--ui-surface-2))] rounded-sm" style={{ cursor: 'default' }}>🖼 From Library</div>
                </div>
              }
            />
            <InconsistencyNote items={[
              { file: 'UploadSourceMenu.tsx', note: 'Uses bg-white border-slate-200 dropdown appearing over dark-themed modal content. Should match dark dropdown standard (bg-zinc-800 border-white/10).' },
            ]} />

            <div style={fullSpan}><PageSubheading>Global Sidebar</PageSubheading></div>

            <ButtonCardV2
              buttonName="Sidebar Navigation Item"
              buttonColor="Active: bg-[#4a5f7f] shadow-lg shadow-black/40 text-white. Inactive: text-slate-400"
              size="rounded-xl px-4 py-3 — font-bold text-sm. Collapsed: px-3 py-3 centered"
              purpose="Primary navigation between app sections"
              visualEffects="Inactive hover: bg-white/10 text-white shadow-md shadow-black/20"
              locations="Index.tsx — main sidebar navigation"
              appWide
              preview={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-sm text-white bg-[#4a5f7f] shadow-lg" style={{ cursor: 'default', border: 'none' }}>📚 My Stories</button>
                  <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-sm text-slate-400" style={{ cursor: 'default', border: 'none', background: 'transparent' }}>💬 Chat History</button>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Sidebar Collapse Toggle"
              buttonColor="text-slate-400 hover:text-white hover:bg-white/10"
              size="p-2 rounded-lg"
              purpose="Toggle sidebar between expanded and collapsed states"
              visualEffects="transition-colors. Uses PanelLeft / PanelLeftClose icons"
              locations="Index.tsx — sidebar header"
              appWide
              preview={
                <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>◀</button>
              }
            />

            <div style={fullSpan}><PageSubheading>Character Builder</PageSubheading></div>

            <ButtonCardV2
              buttonName="AI Enhance Sparkle Button"
              buttonColor="text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10"
              size="p-1.5 rounded-md"
              purpose="Opens EnhanceModeModal for AI-assisted character field enhancement"
              visualEffects="transition-colors. Uses Sparkles size={14}"
              locations="CharactersTab — section headers for enhanceable fields"
              pageSpecific
              preview={
                <button className="p-1.5 rounded-md text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✨</button>
              }
            />
            <ButtonCardV2
              buttonName="EnhanceModeModal Option Cards"
              buttonColor="bg-zinc-800/50 border-white/10"
              size="p-5 rounded-2xl — w-10 h-10 rounded-xl icon containers"
              purpose="Choose between Precise and Detailed AI enhancement modes"
              visualEffects="Hover: border-blue-500/50 bg-blue-500/10. Icon bg: blue-500/20 (Precise) or purple-500/20 (Detailed)"
              locations="EnhanceModeModal — two-column option grid"
              pageSpecific
              preview={<>
                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-zinc-800/50 hover:border-blue-500/50" style={{ cursor: 'default', width: 120 }}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">✨</div>
                  <span className="text-white font-bold text-xs">Precise</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-zinc-800/50 hover:border-purple-500/50" style={{ cursor: 'default', width: 120 }}>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">≡</div>
                  <span className="text-white font-bold text-xs">Detailed</span>
                </button>
              </>}
            />
            <InconsistencyNote items={[
              { file: 'EnhanceModeModal.tsx', note: 'Uses rounded-2xl for option cards, but CharacterCreationModal uses rounded-xl for similar option patterns.' },
            ]} />

            <ButtonCardV2
              buttonName="ExtraRow Delete Button"
              buttonColor="text-red-400 hover:text-red-300 hover:bg-red-900/30"
              size="Section delete: p-1 rounded-md. Item delete: p-1.5 rounded-md"
              purpose="Remove user-created custom trait rows and sections"
              visualEffects="transition-colors. Uses X icon"
              locations="CharacterEditModal — custom section headers (p-1) and individual items (p-1.5)"
              pageSpecific
              preview={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="p-1 rounded-md text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✕</button>
                  <span className="text-zinc-500 text-xs">p-1</span>
                  <button className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors" style={{ cursor: 'default', background: 'transparent', border: 'none' }}>✕</button>
                  <span className="text-zinc-500 text-xs">p-1.5</span>
                </div>
              }
            />

            <div style={fullSpan}><PageSubheading>Model Settings</PageSubheading></div>

            <ButtonCardV2
              buttonName="Model Selection Card (Active / Inactive)"
              buttonColor="Active: bg-slate-900 border-slate-900 text-white. Inactive: bg-white border-slate-200 text-[hsl(var(--ui-surface-2))]"
              size="p-3 rounded-xl"
              purpose="Select AI model for story generation"
              visualEffects="Active: shadow-xl scale-[1.02]. Inactive hover: border-blue-500 shadow-lg scale-[1.01]"
              locations="ModelSettingsTab — model grid"
              pageSpecific
              preview={<>
                <button className="text-left p-3 rounded-xl border bg-slate-900 border-slate-900 shadow-xl" style={{ cursor: 'default', width: 160, transform: 'scale(1.02)' }}>
                  <div className="text-white font-bold text-xs">Grok Beta</div>
                  <div className="text-slate-400 text-[9px] mt-0.5">Selected model</div>
                </button>
                <button className="text-left p-3 rounded-xl border bg-white border-slate-200" style={{ cursor: 'default', width: 160 }}>
                  <div className="text-[hsl(var(--ui-surface-2))] font-bold text-xs">Grok 2</div>
                  <div className="text-slate-500 text-[9px] mt-0.5">Inactive model</div>
                </button>
              </>}
            />
            <InconsistencyNote items={[
              { file: 'ModelSettingsTab.tsx', note: 'LIGHT THEME page (bg-white, text-[hsl(var(--ui-surface-2))]) while every other page uses dark theme. Major inconsistency.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Image Library</PageSubheading></div>

            <ButtonCardV2
              buttonName="New Folder Dashed Card"
              buttonColor="border-zinc-600 (dashed). bg-gradient-to-br from-zinc-800 to-zinc-900"
              size="rounded-[2rem] aspect-[2/3] — border-2 border-dashed"
              purpose="Create a new image folder"
              visualEffects="Hover: border-blue-500 transition-colors"
              locations="ImageLibraryTab — first card in folder grid"
              pageSpecific
              preview={
                <div className="border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition-colors" style={{ width: 100, aspectRatio: '2/3', cursor: 'default' }}>
                  <span className="text-zinc-400 text-lg">+</span>
                  <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider">New Folder</span>
                </div>
              }
            />
            <ButtonCardV2
              buttonName="Folder Delete Button (Circular)"
              buttonColor="bg-black/40 text-[rgba(248,250,252,0.3)] hover:text-rose-500"
              size="p-3 rounded-full"
              purpose="Delete an image folder"
              visualEffects="hover:bg-black/60 transition-all. Positioned absolute top-right on folder cards"
              locations="ImageLibraryTab — folder card overlay"
              pageSpecific
              preview={
                <button className="p-3 bg-black/40 text-[rgba(248,250,252,0.3)] hover:text-rose-500 rounded-full transition-all" style={{ cursor: 'default', border: 'none' }}>🗑</button>
              }
            />
            <InconsistencyNote items={[
              { file: 'ImageLibraryTab.tsx', note: 'Folder delete uses rounded-full while all other action buttons in the app use rounded-xl.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Story Detail Modal</PageSubheading></div>

            <ButtonCardV2
              buttonName="Story Detail Action Buttons"
              buttonColor="Base: bg-white/5 border-white/10. Liked: bg-rose-500/20 border-rose-500/50 text-rose-400. Saved: bg-amber-500/20 border-amber-500/50 text-amber-400. Play: bg-[#3b82f6] text-white"
              size="h-12 px-6 rounded-xl — text-sm font-semibold"
              purpose="Like, Save, Play actions on story detail view"
              visualEffects="Taller than standard (h-12 vs h-10). Toggle states with color transitions"
              locations="StoryDetailModal — action bar"
              pageSpecific
              preview={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold" style={{ cursor: 'default' }}>♡ Like</button>
                  <button className="h-12 px-6 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 text-sm font-semibold" style={{ cursor: 'default' }}>♥ Liked</button>
                  <button className="h-12 px-6 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 text-sm font-semibold" style={{ cursor: 'default' }}>★ Saved</button>
                  <button className="h-12 px-6 rounded-xl bg-[#3b82f6] text-white text-sm font-bold" style={{ cursor: 'default' }}>▶ PLAY</button>
                </div>
              }
            />

            <div style={fullSpan}><PageSubheading>Review Modal</PageSubheading></div>

            <ButtonCardV2
              buttonName="Review Submit / Delete Buttons"
              buttonColor="Submit: bg-[#4a5f7f] text-white. Delete: bg-red-600/20 border-red-500/30 text-red-400"
              size="h-11 px-6 rounded-xl — text-sm font-semibold"
              purpose="Submit or delete a scenario review"
              visualEffects="Non-standard h-11 (standard is h-10)"
              locations="ReviewModal — footer actions"
              pageSpecific
              preview={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="h-11 px-6 rounded-xl bg-[#4a5f7f] text-white text-sm font-semibold" style={{ cursor: 'default' }}>Submit Review</button>
                  <button className="h-11 px-6 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-semibold" style={{ cursor: 'default' }}>Delete Review</button>
                </div>
              }
            />
            <InconsistencyNote items={[
              { file: 'ReviewModal.tsx', note: 'Uses h-11 + text-sm for buttons instead of standard h-10 + text-[10px] uppercase.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Share Story Modal</PageSubheading></div>

            <ButtonCardV2
              buttonName="Share Modal !important Override Buttons"
              buttonColor="Publish: !bg-blue-600 text-white. Unpublish: !bg-rose-500/20 !text-rose-300 !border-rose-500/30"
              size="Chronicle UI.tsx Button base (rounded-xl px-4 py-2 text-sm font-semibold) with !important overrides"
              purpose="Publish / Update / Unpublish scenario to gallery"
              visualEffects="Bypasses Shadow Surface pattern via !important CSS overrides"
              locations="ShareStoryModal — footer actions"
              pageSpecific
              preview={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider" style={{ cursor: 'default' }}>Publish to Gallery</button>
                  <button className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider" style={{ cursor: 'default' }}>Update Publication</button>
                  <button className="h-10 px-6 rounded-xl bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider" style={{ cursor: 'default' }}>Unpublish</button>
                </div>
              }
            />
            <InconsistencyNote items={[
              { file: 'ShareStoryModal.tsx', note: 'Uses !important CSS overrides on buttons instead of proper variant classes.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Arc System</PageSubheading></div>

            <ButtonCardV2
              buttonName="Arc Phase Delete Button"
              buttonColor="border-red-400/50 bg-transparent text-red-300"
              size="w-[30px] h-[30px] rounded-[10px]"
              purpose="Delete a narrative arc phase"
              visualEffects="hover:bg-red-500/20 transition-colors"
              locations="ArcPhaseCard — phase card header"
              pageSpecific
              preview={
                <button className="w-[30px] h-[30px] rounded-[10px] border border-red-400/50 bg-transparent text-red-300 flex items-center justify-center text-xs hover:bg-red-500/20 transition-colors" style={{ cursor: 'default' }}>✕</button>
              }
            />
            <InconsistencyNote items={[
              { file: 'ArcPhaseCard.tsx', note: 'Phase delete button uses rounded-[10px] (10px) and w-[30px] h-[30px] instead of standard rounded-xl (12px) and h-10.' },
            ]} />

            <div style={fullSpan}><PageSubheading>Tag Chips</PageSubheading></div>

            <ButtonCardV2
              buttonName="Tag Chip Remove Button"
              buttonColor="Default: bg-blue-500/20 text-blue-300 border-blue-500/30. Hover: bg-red-500/20 text-red-300 border-red-500/30"
              size="Modal variant: px-2.5 py-1 text-xs. Input variant: px-3 py-1.5 text-sm. Both: rounded-full font-medium"
              purpose="Remove a tag from a tag list"
              visualEffects="X icon: opacity-50 → hover opacity-100. Entire chip transitions to red on hover"
              locations="SceneTagEditorModal (px-2.5 py-1 text-xs), TagInput (px-3 py-1.5 text-sm)"
              appWide
              preview={
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium" style={{ cursor: 'default' }}>
                    <span>fantasy</span><span style={{ opacity: 0.5 }}>✕</span>
                  </button>
                  <span className="text-zinc-500 text-[9px]">xs</span>
                  <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium" style={{ cursor: 'default' }}>
                    <span>romance</span><span style={{ opacity: 0.5 }}>✕</span>
                  </button>
                  <span className="text-zinc-500 text-[9px]">sm</span>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-medium" style={{ cursor: 'default' }}>
                    <span>hover</span><span>✕</span>
                  </button>
                </div>
              }
            />
          </Section>

          <Divider />

           {/* ═══════════════════════════════════════════════════════════════ */}
           {/* ═══ 4. FORM INPUTS ═══ */}
           {/* ═══════════════════════════════════════════════════════════════ */}
           <Section id="inputs" title="Form Inputs" desc="Input fields and textareas used throughout the application.">

            <PageSubheading>Story Builder Page</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Dark Theme Text Input"
                background="rgba(24,24,27,0.5) / bg-zinc-900/50"
                border="1px solid #3f3f46 / border-zinc-700"
                borderRadius="rounded-lg (8px)"
                textColor="white"
                placeholderColor="text-zinc-500"
                fontSize="14px / text-sm"
                padding="px-3 py-2"
                purpose="Standard dark text input used across Story Builder forms"
                locations="Story Builder — arc titles, world name, description fields"
                pageSpecific
                appWide
                preview={<>
                  <input readOnly className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 text-white text-sm px-3 py-2 outline-none" placeholder="Enter story arc title..." />
                  <input readOnly className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 text-white text-sm px-3 py-2 outline-none" placeholder="e.g. The Lakehouse" />
                </>}
              />
            </div>

            <PageSubheading>Community Gallery</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Gallery Search Input"
                background="#3a3a3f/50 / bg-[#3a3a3f]/50"
                border="border-white/10"
                borderRadius="rounded-xl (12px)"
                textColor="white"
                placeholderColor="text-zinc-500"
                focusStyle="ring-2 ring-[#4a5f7f] border-transparent"
                fontSize="14px / text-sm"
                padding="pl-12 pr-24 py-3"
                purpose="Full-width search bar with icon prefix and filter suffix"
                locations="Community Gallery — top search bar"
                pageSpecific
                preview={
                  <input readOnly className="w-full pl-12 pr-24 py-3 bg-[#3a3a3f]/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 outline-none" placeholder="Search titles, descriptions, or #tags..." />
                }
              />
            </div>

            <PageSubheading>Chat Interface</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Chat Input Textarea"
                background="white (inside hsl(var(--ui-surface-2)) wrapper)"
                border="none (wrapper: border-[hsl(var(--ui-border))])"
                borderRadius="rounded-xl (inner) / rounded-2xl (wrapper)"
                textColor="black"
                placeholderColor="placeholder-gray-400"
                focusStyle="ring-1 ring-[hsl(var(--accent-teal))]/30"
                fontSize="14px / text-sm"
                padding="px-4 py-3 (inner) / p-2 (wrapper)"
                purpose="Primary message composition textarea"
                locations="Chat Interface — bottom input area"
                pageSpecific
                preview={
                  <div className="bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] rounded-2xl p-2 w-full">
                    <textarea readOnly className="block w-full bg-white text-black placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none border-0 resize-none" placeholder="Describe your action or dialogue..." rows={2} />
                  </div>
                }
              />
            </div>

            <PageSubheading>Account Page</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Account Password Input"
                background="#2a2a2f / bg-[#2a2a2f]"
                border="border-white/10"
                borderRadius="rounded-xl (12px)"
                textColor="white"
                placeholderColor="text-zinc-500"
                focusStyle="ring-2 ring-[#4a5f7f]"
                fontSize="14px / text-sm"
                padding="px-4 py-3"
                purpose="Password field with visibility toggle button"
                locations="Account Settings — Change Password section"
                pageSpecific
                preview={
                  <input readOnly type="password" className="w-full bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none" placeholder="••••••••" />
                }
              />
            </div>

            <PageSubheading>Auth Page</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Auth Input (Dark Slate)"
                background="bg-slate-700/50"
                border="border-slate-600"
                borderRadius="rounded-md (6px — shadcn default)"
                textColor="white"
                placeholderColor="text-slate-400 / text-slate-500"
                focusStyle="shadcn default ring behavior"
                fontSize="14px / text-sm"
                padding="px-3 py-2 (h-10)"
                purpose="Login/signup form fields using shadcn Input with className overrides"
                locations="Auth Page — email, password, and display name fields"
                pageSpecific
                notes="⚠ Uses slate-* palette (unique to Auth) vs zinc-* (rest of app). Third input color system alongside zinc-* (dark) and slate-50 (Chronicle UI)."              preview={<>
                  <input readOnly className="w-full rounded-md border border-slate-600 bg-slate-700/50 text-white text-sm px-3 py-2 outline-none placeholder:text-slate-500" placeholder="you@example.com" />
                  <input readOnly type="password" className="w-full rounded-md border border-slate-600 bg-slate-700/50 text-white text-sm px-3 py-2 outline-none placeholder:text-slate-500" placeholder="••••••••" />
                </>}
              />
            </div>
            <InconsistencyNote items={[
              { file: 'Auth.tsx', note: 'Uses bg-slate-700/50 border-slate-600 — a third input color system alongside zinc-* (dark) and slate-50 (Chronicle UI).' },
            ]} />

            <PageSubheading>Character Library Search</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Header Search (Dark Pill)"
                background="transparent (inside #2b2b2e pill container)"
                border="none (container provides visual border)"
                borderRadius="rounded-full (999px)"
                textColor="white"
                placeholderColor="text-zinc-500"
                fontSize="12px / text-xs font-bold"
                padding="h-7 w-56 px-3 py-1"
                purpose="Compact search pill inside white header bar"
                locations="Character Library — header row dark pill"
                pageSpecific
                preview={
                  <div className="bg-[#2b2b2e] rounded-full p-1">
                    <input readOnly className="h-7 w-56 px-3 py-1 text-xs font-bold rounded-full bg-transparent text-white placeholder:text-zinc-500 outline-none" placeholder="Search characters..." />
                  </div>
                }
              />
            </div>

            <PageSubheading>Character Builder</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="HardcodedRow Textarea"
                background="bg-zinc-900/50"
                border="border-white/10 (very subtle)"
                borderRadius="rounded-lg (8px)"
                textColor="text-zinc-300"
                placeholderColor="text-zinc-500"
                fontSize="14px / text-sm"
                padding="px-3 py-2"
                purpose="Trait value textarea inside HardcodedRow layout"
                locations="Character Builder — collapsible sections (Physical Appearance, Background, etc.)"
                pageSpecific
                preview={
                  <textarea readOnly className="w-full rounded-lg border border-white/10 bg-zinc-900/50 text-zinc-300 text-sm px-3 py-2 outline-none resize-none" rows={2} placeholder="Athletic build; tall; sharp jawline..." />
                }
              />
              <InputCardV2
                inputName="Builder Form Row Input"
                background="bg-zinc-900/50"
                border="border-white/10"
                borderRadius="rounded-lg (8px)"
                textColor="white"
                fontSize="14px / text-sm"
                padding="px-3 py-2"
                purpose="Label + value pair input in collapsible character builder sections"
                locations="Character Builder — trait label (w-2/5) and value (flex-1) columns"
                pageSpecific
                notes="Lock icon (w-3.5 h-3.5 text-zinc-400) marks hardcoded fields. Both label and value columns share identical input styling."
                preview={
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <div style={{ width: '40%', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#a1a1aa', fontSize: 10 }}>🔒</span>
                      <input readOnly className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm" value="Physical Appearance" />
                    </div>
                    <input readOnly className="flex-1 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm" placeholder="Describe appearance..." />
                  </div>
                }
              />
            </div>

            <PageSubheading>Chat Settings — LabeledToggle</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="LabeledToggle Component"
                background="N/A (composite control)"
                border="N/A"
                borderRadius="rounded-full (track)"
                textColor="Off label: text-zinc-200, On label: text-blue-500"
                fontSize="12px / text-xs font-semibold"
                padding="N/A"
                purpose="Custom toggle with Off/On text labels flanking the track"
                locations="Chat Settings — Time Progression, Auto-Generate Side Characters, all model settings toggles"
                appWide
                notes="Track: h-5 w-9 rounded-full. Thumb: h-4 w-4 bg-white shadow-md. On: bg-blue-500. Off: bg-zinc-600. Locked: bg-zinc-500 + Lock icon (w-3 h-3 text-zinc-500) + opacity-70."
                preview={<>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
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
                  </div>
                </>}
              />
            </div>


            <PageSubheading>Review Modal</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Review Textarea (Frosted)"
                background="bg-white/5"
                border="border-white/10"
                borderRadius="rounded-lg (8px)"
                textColor="white"
                placeholderColor="text-white/30"
                fontSize="14px / text-sm"
                padding="px-3 py-2"
                purpose="Comment textarea in review submission form"
                locations="Review Modal — comment field"
                pageSpecific
                notes="Yet another dark textarea variant distinct from Story Builder (bg-zinc-900/50 border-zinc-700)."
                preview={
                  <textarea readOnly className="w-full min-h-[60px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 px-3 py-2 text-sm" placeholder="Share your thoughts..." />
                }
              />
            </div>


            <PageSubheading>GuidanceStrengthSlider</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="GuidanceStrengthSlider (Custom 3-Point)"
                background="rgba(21,25,34,0.95) (track)"
                border="N/A"
                borderRadius="rounded-full (track + knob)"
                textColor="text-blue-500 (active label) / text-zinc-500 (inactive)"
                fontSize="10px / text-[10px] font-black uppercase tracking-widest"
                padding="N/A"
                purpose="Custom 3-point slider for AI guidance strength (Rigid / Normal / Flexible)"
                locations="Story Builder — Model Settings section"
                pageSpecific
                notes="Fill gradient: linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5). Knob: w-6 h-6 bg-white border-[3px] border-blue-500. Description box: bg-zinc-900 rounded-xl p-4 border-white/5."
                preview={
                  <div style={{ width: '100%' }}>
                    <div style={{ position: 'relative', height: 12, borderRadius: 999, background: 'rgba(21,25,34,0.95)' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '50%', borderRadius: 999, background: 'linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '3px solid #3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rigid</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Normal</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Flexible</span>
                    </div>
                  </div>
                }
              />
            </div>

            <PageSubheading>TagInput Component</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="TagInput (Enter-to-Add)"
                background="bg-zinc-900/50 / bg-zinc-800"
                border="border-zinc-700"
                borderRadius="rounded-xl (12px — input) / rounded-full (tags)"
                textColor="white (input) / text-blue-300 (tags)"
                placeholderColor="text-zinc-500"
                focusStyle="ring-2 ring-blue-500/50 border-transparent"
                fontSize="14px / text-sm (input) / text-sm font-medium (tags)"
                padding="px-4 py-3 (input) / px-3 py-1.5 (tags)"
                purpose="Tag input with enter-to-add pattern and removable tag chips"
                locations="Story Builder — content themes tags, Scene Tag Editor"
                appWide
                notes="Tags: bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full. Counter: text-xs text-zinc-500. Max 10 tags."
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
              />
            </div>

            <PageSubheading>Scene Tag Editor Input</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Scene Tag Editor Input"
                background="bg-zinc-800"
                border="border-zinc-700"
                borderRadius="rounded-lg (8px)"
                textColor="white"
                placeholderColor="text-zinc-500"
                focusStyle="border-[#4a5f7f]"
                fontSize="14px / text-sm"
                padding="px-3 py-2"
                purpose="Scene name/tag input field in custom overlay modal"
                locations="Scene Tag Editor Modal — tag name input"
                pageSpecific
                preview={
                  <input readOnly className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 outline-none" placeholder="Untitled scene" />
                }
              />
            </div>

            <PageSubheading>Chronicle UI.tsx — Parallel Input System</PageSubheading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <InputCardV2
                inputName="Chronicle UI Input"
                background="bg-slate-50"
                border="border-slate-200"
                borderRadius="rounded-2xl (16px)"
                textColor="text-[hsl(var(--ui-surface-2))] (inherited)"
                placeholderColor="text-slate-400"
                focusStyle="ring-2 ring-blue-100 border-blue-500"
                fontSize="14px / text-sm"
                padding="px-4 py-3"
                purpose="Light-theme input primitive defined in UI.tsx"
                locations="StoryHub, CharactersTab, WorldTab, ModelSettings, PublicProfileTab"
                appWide
                notes="Used across ~50% of the app. Label: text-xs font-bold uppercase text-slate-500. Different from shadcn Input and all dark-themed inputs."
                preview={
                  <div style={{ width: '100%' }}>
                    <label className="block text-xs font-bold uppercase mb-1 text-slate-500">Label</label>
                    <input readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Chronicle UI Input..." />
                  </div>
                }
              />
              <InputCardV2
                inputName="Chronicle UI TextArea"
                
                background="bg-slate-50"
                border="border-slate-200"
                borderRadius="rounded-2xl (16px)"
                textColor="text-[hsl(var(--ui-surface-2))] (inherited)"
                placeholderColor="text-slate-400"
                focusStyle="ring-2 ring-blue-100 border-blue-500"
                fontSize="14px / text-sm"
                padding="px-4 py-3"
                purpose="Light-theme textarea matching Chronicle Input styling"
                locations="CharacterEditForm, WorldTab, ShareStoryModal"
                appWide
                notes="Same styling as Chronicle Input. Supports autoResize prop."
                preview={
                  <textarea readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none resize-none" rows={2} placeholder="Chronicle UI TextArea..." />
                }
              />
              <InputCardV2
                inputName="CharacterPicker Search (Dark Override)"
                background="!bg-zinc-900/50 (overrides Chronicle UI)"
                border="!border-zinc-700"
                borderRadius="rounded-2xl (16px — inherited from Chronicle)"
                textColor="!text-white"
                placeholderColor="!text-zinc-400"
                fontSize="14px / text-sm"
                padding="px-4 py-3"
                purpose="Chronicle UI Input forced dark with !important overrides"
                locations="Character Picker — search field"
                pageSpecific
                notes="⚠ Demonstrates friction of using Chronicle UI primitives in dark context. Uses !important CSS overrides."
                preview={
                  <input readOnly className="w-full rounded-2xl bg-zinc-900/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" placeholder="Search characters..." />
                }
              />
            </div>
            <InconsistencyNote items={[
              { file: 'UI.tsx', note: 'Defines Input/TextArea with bg-slate-50 border-slate-200 styling. Components in dark contexts need !important overrides.' },
            ]} />

          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 5. BADGES & TAGS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
           <Section id="badges" title="Badges & Tags" desc="Badges on story cards, tag chips, and status indicators.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

              {/* ── Story Builder — Content Theme Chips ── */}
              <PageSubheading fullSpan>Story Builder — Content Theme Chips</PageSubheading>

              <BadgeCardV2
                badgeName="Content Theme Chip (Unselected)"
                background="bg-zinc-800"
                textColor="text-zinc-400"
                size="text-xs font-medium"
                borderRadius="rounded-lg"
                padding="px-3 py-1.5"
                purpose="Unselected preset option in content theme picker"
                locations="ContentThemesSection — genre, origin, character type, trigger warning pickers"
                pageSpecific
                notes="border border-zinc-700. Hover: hover:bg-zinc-700 hover:text-zinc-300"
                preview={
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Fantasy</span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Romance</span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-400">Horror</span>
                  </div>
                }
              />

              <BadgeCardV2
                badgeName="Content Theme Chip (Selected)"
                background="bg-blue-500/20"
                textColor="text-blue-300"
                size="text-xs font-medium"
                borderRadius="rounded-lg"
                padding="px-3 py-1.5"
                purpose="Selected preset option in content theme picker"
                locations="ContentThemesSection — selected genre, origin, character type, trigger warning"
                pageSpecific
                notes="border border-blue-500/30"
                preview={
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">Fantasy</span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">Romance</span>
                  </div>
                }
              />

              <BadgeCardV2
                badgeName="Custom Tag (Removable)"
                background="bg-blue-500/20"
                textColor="text-blue-300"
                size="text-xs font-medium"
                borderRadius="rounded-lg"
                padding="px-3 py-1.5"
                purpose="User-added custom tag with X dismiss button"
                locations="ContentThemesSection — custom options list"
                pageSpecific
                notes="border border-blue-500/30. X button: hover:text-white transition-colors. Uses Lucide X icon w-3 h-3."
                preview={
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      my-custom-tag
                      <X className="w-3 h-3 opacity-70" />
                    </span>
                  </div>
                }
              />

              <BadgeCardV2
                badgeName="Add Custom Button (Dashed)"
                background="bg-transparent"
                textColor="text-blue-500"
                size="text-xs font-medium"
                borderRadius="rounded-lg"
                padding="px-3 py-1.5"
                purpose="Trigger to add custom content theme tag"
                locations="ContentThemesSection — end of tag list when allowCustom=true"
                pageSpecific
                notes="border-2 border-dashed border-zinc-500. Hover: hover:border-blue-500 hover:bg-blue-500/5. Uses Lucide Plus icon w-3 h-3."
                preview={
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-transparent text-blue-500 border-2 border-dashed border-zinc-500 flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add custom
                  </button>
                }
              />

              {/* ── Story Cards — Overlay Badges ── */}
              <PageSubheading fullSpan>Story Cards — Overlay Badges</PageSubheading>

              <BadgeCardV2
                badgeName="SFW / NSFW Badge"
                background="bg-[#2a2a2f]"
                textColor="SFW: text-blue-500 · NSFW: text-red-400"
                size="text-xs font-bold uppercase tracking-wide"
                borderRadius="rounded-lg"
                padding="px-2.5 py-1"
                purpose="Content rating badge overlaid on story cards"
                locations="GalleryStoryCard (top-right), StoryHub (top-right)"
                appWide
                notes="backdrop-blur-sm shadow-lg. Positioned absolute top-4 right-4 z-10."
                states="SFW = text-blue-500, NSFW = text-red-400"
                preview={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-blue-500 uppercase tracking-wide">SFW</span>
                    <span className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-red-400 uppercase tracking-wide">NSFW</span>
                  </div>
                }
              />

              <BadgeCardV2
                badgeName="Published Badge (Card Overlay)"
                background="bg-[#2a2a2f]"
                textColor="text-emerald-400"
                size="text-xs font-bold uppercase tracking-wide"
                borderRadius="rounded-lg"
                padding="px-2.5 py-1"
                purpose="Indicates story is published to the gallery"
                locations="StoryHub — top-left badge container on story cards"
                pageSpecific
                notes="backdrop-blur-sm shadow-lg. Only shown for owned published scenarios."
                preview={
                  <span className="px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-emerald-400 uppercase tracking-wide">Published</span>
                }
              />

              <BadgeCardV2
                badgeName="Editable Badge (Pencil Icon)"
                background="bg-[#2a2a2f]"
                textColor="text-purple-400 (icon)"
                size="w-4 h-4 (Pencil icon)"
                borderRadius="rounded-lg"
                padding="p-1.5"
                purpose="Indicates story allows remixing/editing by other users"
                locations="GalleryStoryCard (top-left), StoryHub (top-left badge container)"
                appWide
                notes="backdrop-blur-sm shadow-lg. Contains Lucide Pencil icon only, no text."
                preview={
                  <div className="p-1.5 backdrop-blur-sm rounded-lg shadow-lg bg-[#2a2a2f]">
                    <Pencil className="w-4 h-4 text-purple-400" />
                  </div>
                }
              />

              {/* ── Story Detail Modal — Inline Status Badges ── */}
              <PageSubheading fullSpan>Story Detail Modal — Inline Status Badges</PageSubheading>

              <BadgeCardV2
                badgeName="Published Badge (Inline)"
                background="bg-emerald-500/20"
                textColor="text-emerald-400"
                size="text-xs font-bold"
                borderRadius="rounded-lg"
                padding="px-2.5 py-1"
                purpose="Inline published status badge in story detail modal header"
                locations="StoryDetailModal — status badges row (owned scenarios only)"
                pageSpecific
                notes="No backdrop-blur. Different from card overlay version which uses bg-[#2a2a2f]."
                preview={
                  <span className="inline-flex w-fit px-2.5 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">PUBLISHED</span>
                }
              />

              <BadgeCardV2
                badgeName="Editable Badge (Inline)"
                background="bg-purple-500/20"
                textColor="text-purple-400"
                size="text-xs font-bold"
                borderRadius="rounded-lg"
                padding="px-2.5 py-1"
                purpose="Inline editable status badge in story detail modal header"
                locations="StoryDetailModal — status badges row (when allow_remix enabled)"
                pageSpecific
                notes="No backdrop-blur. Text-only variant (no Pencil icon)."
                preview={
                  <span className="inline-flex w-fit px-2.5 py-1 bg-purple-500/20 rounded-lg text-xs font-bold text-purple-400">EDITABLE</span>
                }
              />

              {/* ── Community Gallery — Active Filter Chips ── */}
              <PageSubheading fullSpan>Community Gallery — Active Filter Chips</PageSubheading>

              <BadgeCardV2
                badgeName="Gallery Filter Chips (Color-Coded)"
                background="bg-{color}-500/20 per category"
                textColor="text-{color}-400 per category"
                size="text-xs font-medium"
                borderRadius="rounded-full"
                padding="px-2 py-1"
                purpose="Active filter indicators in gallery with X dismiss"
                locations="GalleryHub — active filters bar"
                pageSpecific
                notes="Search text: bg-white/20 text-white. Story Type: blue. Genre: purple. Origin: green. Warnings: amber. Search tags: bg-white/20 text-white. Each has X dismiss button (Lucide X w-3 h-3, hover:text-red-300)."
                states="5 color variants by category type"
                preview={
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium flex items-center gap-1">"search" <X className="w-3 h-3" /></span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded-full text-xs font-medium flex items-center gap-1">SFW <X className="w-3 h-3" /></span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center gap-1">Romance <X className="w-3 h-3" /></span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1">Original <X className="w-3 h-3" /></span>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium flex items-center gap-1">Violence <X className="w-3 h-3" /></span>
                  </div>
                }
              />

              {/* ── Scene Tags ── */}
              <PageSubheading fullSpan>Scene Tags & Tag Input</PageSubheading>

              <BadgeCardV2
                badgeName="Scene Tag Chip"
                background="bg-blue-500/20"
                textColor="text-blue-300"
                size="text-xs font-medium"
                borderRadius="rounded-full"
                padding="px-2.5 py-1"
                purpose="Tag chips for scene/image tags"
                locations="SceneTagEditorModal — tag list, TagInput — displayed tags"
                appWide
                notes="border border-blue-500/30. SceneTagEditorModal tags have hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 for removal. TagInput variant uses slightly larger px-3 py-1.5."
                preview={
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium">
                      landscape <X size={12} className="opacity-50" />
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium">
                      battle
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium">
                      night <X className="w-3.5 h-3.5" />
                    </span>
                  </div>
                }
              />

              {/* ── Chat Interface ── */}
              <PageSubheading fullSpan>Chat Interface</PageSubheading>

              <BadgeCardV2
                badgeName="Side Character Control Badge"
                background="User: bg-blue-500 · AI: bg-slate-500"
                textColor="text-white"
                size="text-[8px] (smallest text in app)"
                borderRadius="rounded (shadcn Badge)"
                padding="px-1.5 py-0.5"
                purpose="Micro badge indicating character control type on avatar"
                locations="SideCharacterCard — absolute -bottom-1 -right-1 on avatar"
                pageSpecific
                notes="Uses shadcn Badge component. shadow-sm border-0. hover:bg-blue-500 / hover:bg-slate-500 (no hover change)."
                states="User = bg-blue-500, AI = bg-slate-500"
                preview={
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Badge variant="default" className="text-[8px] px-1.5 py-0.5 shadow-sm border-0 bg-blue-500 hover:bg-blue-500 text-white">User</Badge>
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5 shadow-sm border-0 bg-slate-500 hover:bg-slate-500 text-white">AI</Badge>
                  </div>
                }
              />

              {/* ── Image Library ── */}
              <PageSubheading fullSpan>Image Library</PageSubheading>

              <BadgeCardV2
                badgeName="Folder Image Count Badge"
                background="bg-blue-600"
                textColor="text-white"
                size="text-[9px] font-black uppercase tracking-widest"
                borderRadius="rounded-md"
                padding="px-2 py-1"
                purpose="Displays image count in folder cards"
                locations="ImageLibraryTab — folder card bottom overlay"
                pageSpecific
                notes="shadow-lg"
                preview={
                  <span className="bg-blue-600 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">12 IMAGES</span>
                }
              />

              {/* ── Account Page ── */}
              <PageSubheading fullSpan>Account Page — Subscription Tier Badges</PageSubheading>

              <BadgeCardV2
                badgeName="Current Plan Badge"
                background="bg-emerald-500/20"
                textColor="text-emerald-400"
                size="text-[10px] font-bold uppercase tracking-wider"
                borderRadius="rounded-full"
                padding="px-3 py-1"
                purpose="Indicates the user's current subscription tier"
                locations="SubscriptionTab — absolute -top-3 right-4 on tier card"
                pageSpecific
                notes="border border-emerald-500/30"
                preview={
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">Current Plan</span>
                }
              />

              <BadgeCardV2
                badgeName="Coming Soon Badge"
                background="bg-[#4a5f7f]"
                textColor="text-white"
                size="text-[10px] font-bold uppercase tracking-wider"
                borderRadius="rounded-full"
                padding="px-3 py-1"
                purpose="Indicates a subscription tier is not yet available"
                locations="SubscriptionTab — absolute -top-3 right-4 on tier card"
                pageSpecific
                preview={
                  <span className="px-3 py-1 bg-[#4a5f7f] text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Coming Soon</span>
                }
              />

              {/* ── Character Builder ── */}
              <PageSubheading fullSpan>Character Builder</PageSubheading>

              <BadgeCardV2
                badgeName="Lock Icon Indicator"
                background="(none — icon only)"
                textColor="text-zinc-400"
                size="w-3.5 h-3.5 (Lucide Lock icon)"
                borderRadius="n/a"
                padding="w-7 flex-shrink-0 container"
                purpose="Indicates non-removable, system-defined trait section in character builder"
                locations="CharacterEditModal, CharactersTab — HardcodedRow end position"
                pageSpecific
                notes="Positioned in a w-7 flex-shrink-0 container at end of row. Only on hardcoded trait sections, not user-added extras."
                preview={
                  <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PERSONALITY</span>
                    <div className="w-7 flex-shrink-0 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                }
              />

              {/* ── Model Settings ── */}
              <PageSubheading fullSpan>Model Settings</PageSubheading>

              <BadgeCardV2
                badgeName="Connection Status Badge (Animated)"
                background="Connected: bg-emerald-50 · Checking: bg-amber-50 · Unlinked: bg-slate-100"
                textColor="Connected: text-emerald-600 · Checking: text-amber-600 · Unlinked: text-slate-500"
                size="text-[10px] font-black uppercase tracking-widest"
                borderRadius="rounded-full"
                padding="px-4 py-2"
                purpose="Shows API connection status with animated indicator dot"
                locations="ModelSettingsTab — header area"
                pageSpecific
                states="Connected: border-emerald-100, dot bg-emerald-500 animate-pulse · Checking: border-amber-100, dot bg-amber-500 animate-bounce · Unlinked: border-slate-200, dot bg-slate-300"
                preview={
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />System Linked
                    </span>
                    <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />Checking...
                    </span>
                    <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />Unlinked
                    </span>
                  </div>
                }
              />

              {/* ── Interactive Rating Components ── */}
              <PageSubheading fullSpan>Interactive Rating Components</PageSubheading>

              <BadgeCardV2
                badgeName="Star Rating"
                background="(transparent)"
                textColor="Filled: text-amber-400 fill-amber-400 · Empty: text-white/20"
                size="16px default, 20px review display"
                borderRadius="n/a"
                padding="gap-0.5"
                purpose="Star-based rating display/input using Lucide Star/StarHalf icons"
                locations="ReviewModal — review form criteria, StoryDetailModal — review cards"
                appWide
                notes="Interactive mode: cursor-pointer hover:scale-110 transition-transform. Also has 'slate' color variant: filled text-[hsl(215,25%,40%)] fill-[hsl(215,25%,40%)]."
                states="Interactive (hover:scale-110) vs Non-interactive (cursor-default). Supports half-star display."
                preview={
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Amber 4/5</div>
                      <StarRating rating={4} size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Half star 3.5/5</div>
                      <StarRating rating={3.5} size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Slate variant</div>
                      <StarRating rating={3} size={18} color="slate" />
                    </div>
                  </div>
                }
              />

              <BadgeCardV2
                badgeName="Spice Rating"
                background="(transparent)"
                textColor="Filled: text-red-500 fill-red-500 · Empty: text-white/20"
                size="16px default"
                borderRadius="n/a"
                padding="gap-0.5"
                purpose="Flame-based spice/heat level rating using Lucide Flame icon"
                locations="ReviewModal — spice level criteria, StoryDetailModal — review cards"
                appWide
                notes="5-level scale (maxLevel default: 5). Same interactive pattern as StarRating."
                states="Interactive (hover:scale-110) vs Non-interactive (cursor-default)"
                preview={
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>3/5</div>
                      <SpiceRating rating={3} size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>5/5</div>
                      <SpiceRating rating={5} size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>0/5</div>
                      <SpiceRating rating={0} size={18} />
                    </div>
                  </div>
                }
              />

              <BadgeCardV2
                badgeName="Circular Progress Ring"
                background="Dark: bg stroke #334155"
                textColor="0%: text-slate-400 · 1-99%: text-blue-500 · 100%: text-green-400"
                size="40px default (font-bold text-[10px] center text)"
                borderRadius="circular (SVG)"
                padding="n/a"
                purpose="SVG circle progress ring showing completion percentage"
                locations="Story Builder — Arc system phase cards"
                pageSpecific
                notes="strokeWidth: 3. Progress stroke: #3b82f6 (in-progress), #22c55e (complete). Has light variant (bg stroke #e2e8f0) and dark variant (bg stroke #334155). Center text: text-lg for size≥80."
                states="0% → slate (empty) · 1-99% → blue · 100% → green"
                preview={
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>0%</div>
                      <CircularProgress value={0} variant="dark" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>50%</div>
                      <CircularProgress value={50} variant="dark" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>100%</div>
                      <CircularProgress value={100} variant="dark" />
                    </div>
                  </div>
                }
              />

            </div>
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 6. PANELS & MODALS ═══ */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Section id="panels" title="Panels & Modals" desc="Container patterns, card layouts, sidebars, modal dialogs, and overlay systems used throughout the application.">

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

              {/* ─── Story Builder Page ─── */}
              <PageSubheading fullSpan>Story Builder Page</PageSubheading>

              <PanelCardV2
                panelName="Panel Container"
                background="#2a2a2f"
                border="border-white/10"
                borderRadius="rounded-[24px]"
                shadow="0 12px 32px -2px rgba(0,0,0,0.5)"
                purpose="Primary dark container for builder sections (Characters, World, Arc)"
                locations="CharactersTab.tsx, WorldTab.tsx"
                pageSpecific appWide={false}
                preview={<div className="w-full h-16 bg-[#2a2a2f] rounded-[24px] border border-white/10" style={{ boxShadow: '0 12px 32px -2px rgba(0,0,0,0.5)' }} />}
              />

              <PanelCardV2
                panelName="Panel Header Bar"
                background="#4a5f7f"
                border="border-b border-white/20"
                borderRadius="rounded-t-[24px] (inherits from parent)"
                shadow="shadow-lg"
                purpose="Colored header banner for collapsible builder sections"
                locations="CharactersTab.tsx"
                pageSpecific appWide={false}
                preview={
                  <div className="w-full bg-[#4a5f7f] rounded-xl px-4 py-2 flex items-center gap-2 border-b border-white/20 shadow-lg">
                    <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white text-[10px]">⚙</div>
                    <span className="text-white text-sm font-bold tracking-tight">Section Title</span>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Story Card"
                background="gradient overlay: from-zinc-800 via-slate-900/60 to-transparent"
                border="border border-[#4a5f7f]"
                borderRadius="rounded-[2rem]"
                shadow="0 12px 32px -2px rgba(0,0,0,0.5)"
                purpose="Card for stories in My Stories grid and Gallery. Aspect 2/3."
                locations="StoryHub.tsx, GalleryStoryCard.tsx, ImageLibraryTab.tsx"
                appWide pageSpecific={false}
                preview={
                  <div className="relative overflow-hidden rounded-[2rem] border border-[#4a5f7f]" style={{ width: 90, aspectRatio: '2/3', boxShadow: '0 12px 32px -2px rgba(0,0,0,0.5)' }}>
                    <div className="absolute inset-0 bg-slate-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-800 via-slate-900/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-white text-[8px] font-bold">Story Title</div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Builder Collapsible Section"
                background="#2a2a2f (outer), #3a3a3f/30 (inner)"
                border="border-white/10 (outer), border-white/5 (inner)"
                borderRadius="rounded-[24px]"
                shadow="0 12px 32px -2px rgba(0,0,0,0.5)"
                purpose="Collapsible character trait sections with header bar and nested inner cards"
                locations="CharactersTab.tsx"
                pageSpecific appWide={false}
                notes="Uses rounded-[24px] — yet another radius variant. Form inputs: bg-zinc-900/50 border-white/10 rounded-lg"
                preview={
                  <div className="rounded-[16px] border border-white/10 overflow-hidden" style={{ background: '#2a2a2f', width: '100%', boxShadow: '0 8px 20px -2px rgba(0,0,0,0.4)' }}>
                    <div className="px-3 py-1.5 border-b border-white/20 flex items-center justify-between" style={{ background: '#4a5f7f' }}>
                      <span className="text-white text-[9px] font-bold uppercase tracking-wider">Appearance</span>
                      <span className="text-[rgba(248,250,252,0.3)] text-[10px]">▾</span>
                    </div>
                    <div className="p-2">
                      <div className="rounded-lg p-2" style={{ background: 'rgba(58,58,63,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input readOnly className="w-2/5 px-2 py-1 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-[9px]" value="Hair" />
                          <input readOnly className="flex-1 px-2 py-1 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-[9px]" value="Silver strands" />
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* ─── Chat Interface ─── */}
              <PageSubheading fullSpan>Chat Interface</PageSubheading>

              <PanelCardV2
                panelName="Chat Message Bubble"
                background="AI: #1c1f26 · User: #1c1f26 · Transparent: bg-black/50"
                border="AI: border-white/5 · User: border-2 border-blue-500"
                borderRadius="rounded-[2rem]"
                purpose="Chat message containers. AI and User variants with optional transparent mode."
                locations="ChatInterfaceTab.tsx"
                pageSpecific appWide={false}
                notes="bg #1c1f26 is unique — doesn't match any panel token"
                preview={
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <div className="flex-1 bg-[#1c1f26] rounded-[2rem] border border-white/5 p-3" style={{ minHeight: 48 }}>
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">AI</div>
                      <div className="text-[9px] text-white">Message...</div>
                    </div>
                    <div className="flex-1 bg-[#1c1f26] rounded-[2rem] border-2 border-blue-500 p-3" style={{ minHeight: 48 }}>
                      <div className="text-[8px] font-black uppercase tracking-widest text-blue-300 mb-0.5">USER</div>
                      <div className="text-[9px] text-white">Reply...</div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Frosted Glass Character Card"
                background="Dark BG: bg-white/30 · Light BG: bg-black/30"
                border="border-transparent"
                borderRadius="rounded-2xl"
                purpose="Adaptive frosted glass card. Switches tint based on sidebar brightness threshold (128)."
                locations="SideCharacterCard.tsx"
                pageSpecific appWide={false}
                notes="backdrop-blur-sm. Avatar: w-20 h-20 rounded-full — only circular avatar in app."
                preview={
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <div className="flex-1 rounded-2xl p-2 text-center backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.3)', minHeight: 48 }}>
                      <div className="text-[9px] font-bold text-slate-800">Light card</div>
                      <div className="text-[8px] text-slate-600">Dark bg</div>
                    </div>
                    <div className="flex-1 rounded-2xl p-2 text-center backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.3)', minHeight: 48 }}>
                      <div className="text-[9px] font-bold text-white">Dark card</div>
                      <div className="text-[8px] text-white/70">Light bg</div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Chat Input Bar"
                background="hsl(var(--ui-surface))"
                border="border-t border-[hsl(var(--ui-border))]"
                borderRadius="N/A (bottom-docked)"
                shadow="0 -4px 12px rgba(0,0,0,0.15)"
                purpose="Bottom-docked input area with quick actions row and textarea"
                locations="ChatInterfaceTab.tsx"
                pageSpecific appWide={false}
                preview={
                  <div className="w-full bg-[hsl(var(--ui-surface))] border-t border-[hsl(var(--ui-border))] shadow-[0_-4px_12px_rgba(0,0,0,0.15)] rounded-b-lg p-2" style={{ minHeight: 40 }}>
                    <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Input Bar</div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Chat Sidebar (White)"
                background="bg-white (with bg image: bg-white/90 backdrop-blur-md)"
                border="N/A (inset shadow)"
                borderRadius="N/A"
                shadow="inset -4px 0 12px rgba(0,0,0,0.02)"
                purpose="Light-themed sidebar with character info, world info, collapsible sections"
                locations="ChatInterfaceTab.tsx"
                pageSpecific appWide={false}
                notes="⚠ White sidebar in dark-themed app. Section headers: bg-[#4a5f7f] rounded-lg"
                preview={
                  <div style={{ display: 'flex', width: '100%', height: 80, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: '45%', background: '#fff', padding: 8, boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.02)' }}>
                      <div className="px-1.5 py-0.5 rounded text-white text-[7px] font-black uppercase mb-1" style={{ background: '#4a5f7f', display: 'inline-block' }}>Characters</div>
                      <div className="text-[8px] font-bold text-slate-700">Castle Grounds</div>
                    </div>
                    <div style={{ flex: 1, background: '#1a1a1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 8, color: '#64748b' }}>Chat (dark)</span>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Chat Sidebar Collapsible Info"
                background="bg-white (inherits from sidebar)"
                border="N/A"
                borderRadius="N/A"
                purpose="Collapsible info sections with label/value pairs inside the white sidebar"
                locations="ChatInterfaceTab.tsx"
                pageSpecific appWide={false}
                notes="Labels: text-[9px] font-bold text-slate-400 uppercase. Values: text-[11px] font-bold text-slate-700."
                preview={
                  <div style={{ background: '#fff', padding: 8, borderRadius: 6, width: '100%' }}>
                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1" style={{ letterSpacing: '0.15em' }}>World Info</div>
                    <div><span className="text-[8px] font-bold text-slate-400 uppercase">Location</span><div className="text-[10px] font-bold text-slate-700">Castle</div></div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Side Character Card (Dual Mode)"
                background="Frosted glass — adaptive tint"
                border="border-transparent"
                borderRadius="rounded-2xl"
                purpose="Side character display with frosted glass, circular avatar, and updating vignette pulse"
                locations="SideCharacterCard.tsx"
                pageSpecific appWide={false}
                notes="Avatar: w-20 h-20 rounded-full (only circular avatar). Updating: blue vignette + animate-vignette-pulse."
                preview={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="rounded-2xl p-2 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.3)', width: 80 }}>
                      <div className="w-10 h-10 rounded-full bg-slate-600 mx-auto mb-1" />
                      <div className="text-[8px] font-bold text-slate-800 text-center">Name</div>
                    </div>
                    <div className="rounded-2xl p-2 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.3)', width: 80 }}>
                      <div className="w-10 h-10 rounded-full bg-zinc-700 mx-auto mb-1" />
                      <div className="text-[8px] font-bold text-white text-center">Name</div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Day/Time Sky Panel"
                background="Preloaded stacked images with crossfade"
                border="N/A"
                borderRadius="rounded-xl"
                shadow="shadow-lg"
                purpose="Dynamic time-of-day visual with crossfade transitions and bg-black/20 overlay"
                locations="ChatInterfaceTab.tsx"
                pageSpecific appWide={false}
                notes="Images: object-cover object-center. Text color via getTimeTextColor() helper."
                preview={
                  <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ width: '100%', height: 56 }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-300 to-blue-500" />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative flex items-center justify-center h-full">
                      <span className="text-white text-[9px] font-bold">Day 1 · Sunrise</span>
                    </div>
                  </div>
                }
              />

              {/* ─── Chat History ─── */}
              <PageSubheading fullSpan>Chat History</PageSubheading>

              <PanelCardV2
                panelName="Session Card (Double-nested)"
                background="Outer: #2a2a2f · Inner: #3a3a3f/30"
                border="Outer: border-[#4a5f7f] · Inner: border-white/5"
                borderRadius="rounded-2xl"
                purpose="Chat session card with nested inner card for conversation preview"
                locations="ConversationsTab.tsx"
                pageSpecific appWide={false}
                preview={
                  <div className="w-full bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] p-2">
                    <div className="bg-[#3a3a3f]/30 rounded-xl border border-white/5 p-2">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-[#4a5f7f] flex-shrink-0" />
                        <div><div className="text-[9px] font-bold text-white">Story</div><div className="text-[7px] text-zinc-500">💬 24</div></div>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* ─── Community Gallery ─── */}
              <PageSubheading fullSpan>Community Gallery</PageSubheading>

              <PanelCardV2
                panelName="Category Sidebar"
                background="#18181b"
                border="border-r border-white/10"
                borderRadius="N/A"
                purpose="Left sidebar with collapsible category filters and yellow accent bar"
                locations="GalleryCategorySidebar.tsx"
                pageSpecific appWide={false}
                notes="Yellow accent: h-0.5 bg-yellow-400 at top. Selected item: bg-blue-500/20 text-blue-500."
                preview={
                  <div className="rounded-lg overflow-hidden" style={{ width: 140 }}>
                    <div className="h-0.5 bg-yellow-400" />
                    <div className="bg-[#18181b] p-2">
                      <div className="text-[8px] font-bold text-white mb-1">Categories</div>
                      <div className="text-[7px] text-white/70 py-0.5">▸ Genre</div>
                      <div className="text-[7px] text-white/70 py-0.5">▸ Origin</div>
                    </div>
                  </div>
                }
              />

              {/* ─── Account Page ─── */}
              <PageSubheading fullSpan>Account Page</PageSubheading>

              <PanelCardV2
                panelName="Settings Card"
                background="#1e1e22"
                border="border-white/10"
                borderRadius="rounded-2xl"
                purpose="Account settings section card with icon, title, and content area"
                locations="AccountSettingsTab.tsx"
                pageSpecific appWide={false}
                preview={
                  <div className="w-full bg-[#1e1e22] rounded-2xl border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#4a5f7f] text-[10px]">✉</span>
                      <span className="text-[10px] font-bold text-white">Email</span>
                    </div>
                    <div className="text-[8px] text-white/70 bg-[#2a2a2f] rounded-lg px-2 py-1.5 border border-white/5">user@email.com</div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Subscription Tier Cards"
                background="Free: bg-white/5 · Pro: bg-[#4a5f7f]/10 · Premium: bg-amber-500/10"
                border="Free: border-white/10 · Pro: border-[#4a5f7f]/30 · Premium: border-amber-500/20"
                borderRadius="rounded-2xl"
                purpose="Pricing tier comparison cards with badges (Current Plan, Coming Soon)"
                locations="SubscriptionTab.tsx"
                pageSpecific appWide={false}
                notes="Current badge: bg-emerald-500/20 text-emerald-400. Soon badge: bg-[#4a5f7f] text-white."
                preview={
                  <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                    <div className="flex-1 rounded-lg border border-white/10 p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-slate-400 text-[7px] font-bold">Free</div>
                      <div className="text-white text-[10px] font-black">$0</div>
                    </div>
                    <div className="flex-1 rounded-lg p-2" style={{ background: 'rgba(74,95,127,0.1)', border: '1px solid rgba(74,95,127,0.3)' }}>
                      <div style={{ color: '#7ba3d4' }} className="text-[7px] font-bold">Pro</div>
                      <div className="text-white text-[10px] font-black">$9.99</div>
                    </div>
                    <div className="flex-1 rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <div className="text-amber-400 text-[7px] font-bold">Premium</div>
                      <div className="text-white text-[10px] font-black">$19.99</div>
                    </div>
                  </div>
                }
              />

              {/* ─── Auth Page ─── */}
              <PageSubheading fullSpan>Auth Page</PageSubheading>

              <PanelCardV2
                panelName="Auth Card"
                background="bg-slate-800/50"
                border="border-slate-700"
                borderRadius="rounded-lg"
                purpose="Login/signup card with frosted glass on gradient background"
                locations="Auth.tsx"
                pageSpecific appWide={false}
                notes="backdrop-blur-sm. Max-width: max-w-md. Uses shadcn Card with overrides."
                preview={
                  <div className="rounded-lg border border-slate-700 p-3" style={{ background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(4px)', width: 160 }}>
                    <div className="text-[10px] font-bold text-white text-center">Chronicle Studio</div>
                    <div className="text-[7px] text-slate-400 text-center">Sign in</div>
                  </div>
                }
              />

              {/* ─── Global ─── */}
              <PageSubheading fullSpan>Global</PageSubheading>

              <PanelCardV2
                panelName="Global Sidebar"
                background="#1a1a1a"
                border="border-r border-black"
                borderRadius="N/A"
                shadow="shadow-2xl"
                purpose="Main navigation sidebar. Expanded: w-[280px], Collapsed: w-[72px]. Smooth transition-all duration-300."
                locations="ChronicleApp.tsx"
                appWide pageSpecific={false}
                notes="Logo: w-10 h-10 rounded-xl bg-[#4a5f7f] shadow-xl shadow-[#4a5f7f]/30"
                preview={
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div className="bg-[#1a1a1a] rounded-lg border-r border-black shadow-2xl p-2" style={{ width: 90, minHeight: 60 }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-lg bg-[#4a5f7f] flex items-center justify-center text-white text-[7px] font-black italic">C</div>
                        <span className="text-[7px] font-black text-white uppercase">Chronicle</span>
                      </div>
                      <div className="text-[7px] font-bold text-white bg-[#4a5f7f] rounded px-1.5 py-0.5 mb-0.5">Stories</div>
                      <div className="text-[7px] font-bold text-slate-400 px-1.5 py-0.5">Chat</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg border-r border-black shadow-2xl p-1.5 flex flex-col items-center gap-1" style={{ width: 30, minHeight: 60 }}>
                      <div className="w-5 h-5 rounded-lg bg-[#4a5f7f] flex items-center justify-center text-white text-[7px] font-black italic">C</div>
                      <div className="w-4 h-4 rounded bg-[#4a5f7f] opacity-70" />
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Dropdown Menu"
                background="bg-zinc-800"
                border="border-white/10"
                borderRadius="rounded-md"
                shadow="shadow-lg"
                purpose="Context menus for character cards, theme settings, etc."
                locations="Global pattern"
                appWide pageSpecific={false}
                notes="Items: hover:bg-zinc-700 text-white. Destructive: text-red-600 hover:bg-zinc-700."
                preview={
                  <div className="bg-zinc-800 border border-white/10 rounded-md p-1 shadow-lg" style={{ width: 140 }}>
                    <div className="px-2 py-1 text-[9px] text-white rounded-sm" style={{ cursor: 'default' }}>Edit</div>
                    <div className="px-2 py-1 text-[9px] text-white rounded-sm" style={{ cursor: 'default' }}>Duplicate</div>
                    <div className="h-px bg-white/10 my-0.5" />
                    <div className="px-2 py-1 text-[9px] text-red-600 rounded-sm" style={{ cursor: 'default' }}>Delete</div>
                  </div>
                }
              />

              {/* ─── World Tab ─── */}
              <PageSubheading fullSpan>World Tab</PageSubheading>

              <PanelCardV2
                panelName="HintBox"
                background="bg-zinc-900"
                border="border border-white/5"
                borderRadius="rounded-xl"
                purpose="Contextual guidance text with diamond bullet points"
                locations="WorldTab.tsx"
                pageSpecific appWide={false}
                preview={
                  <div className="bg-zinc-900 rounded-xl p-3 border border-white/5" style={{ width: '100%' }}>
                    <div className="text-[8px] text-zinc-400 leading-relaxed">
                      <span className="text-zinc-500 mr-1">◆</span> Hint text<br/>
                      <span className="text-zinc-500 mr-1">◆</span> Guidance line
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="CharacterButton"
                background="bg-black/80"
                border="border-[#4a5f7f] · hover: border-[#6b82a8] · error: border-2 border-red-500"
                borderRadius="rounded-2xl"
                purpose="Character selection button in World Tab with avatar, name, and control badge"
                locations="WorldTab.tsx"
                pageSpecific appWide={false}
                preview={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="bg-black/80 rounded-2xl border border-[#4a5f7f] p-2 flex items-center gap-1.5" style={{ cursor: 'default' }}>
                      <div className="w-6 h-6 rounded-lg bg-zinc-700" />
                      <span className="text-white text-[8px] font-bold">Name</span>
                    </div>
                    <div className="bg-black/80 rounded-2xl border-2 border-red-500 p-2 flex items-center gap-1.5" style={{ cursor: 'default' }}>
                      <div className="w-6 h-6 rounded-lg bg-zinc-700" />
                      <span className="text-white text-[8px] font-bold">Error</span>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="World Tab Two-Pane Layout"
                background="Sidebar: #2a2a2f · Content: Chronicle UI light Cards"
                border="border-r border-white/10"
                borderRadius="N/A"
                purpose="Two-pane layout with dark sidebar and light-theme Chronicle UI Cards on right"
                locations="WorldTab.tsx"
                pageSpecific appWide={false}
                notes="⚠ Right pane uses light-theme Cards (bg-white) on dark background"
                preview={
                  <div style={{ display: 'flex', width: '100%', height: 70, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: 80, background: '#2a2a2f', borderRight: '1px solid rgba(255,255,255,0.1)', padding: 6 }}>
                      <div className="text-[7px] font-black uppercase text-white/70 px-1 py-0.5 rounded mb-1" style={{ background: '#4a5f7f' }}>Chars</div>
                      <div className="rounded p-1" style={{ background: 'rgba(58,58,63,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-[7px] text-white font-semibold">Hero</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, background: '#2a2a2f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="rounded-xl bg-white border border-slate-200 p-2 text-[7px] text-slate-500" style={{ width: '80%' }}>Light Card</div>
                    </div>
                  </div>
                }
              />

              {/* ─── Story Detail ─── */}
              <PageSubheading fullSpan>Story Detail</PageSubheading>

              <PanelCardV2
                panelName="Story Detail Character Card"
                background="bg-white/5"
                border="N/A"
                borderRadius="rounded-xl"
                purpose="Character listing within Story Detail modal"
                locations="StoryDetailModal.tsx"
                pageSpecific appWide={false}
                notes="Avatar: w-12 h-12 rounded-xl. Name: font-semibold text-white. Role: text-xs text-[rgba(248,250,252,0.3)]."
                preview={
                  <div className="bg-white/5 rounded-xl p-2 flex items-center gap-2" style={{ maxWidth: 200 }}>
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-400 text-[10px]">👤</div>
                    <div><div className="text-white font-semibold text-[9px]">Elena</div><div className="text-[rgba(248,250,252,0.3)] text-[7px]">Protagonist</div></div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Review Card"
                background="bg-white/5"
                border="N/A"
                borderRadius="rounded-xl"
                purpose="User review display with StarRating, SpiceRating, comment"
                locations="StoryDetailModal.tsx"
                pageSpecific appWide={false}
                preview={
                  <div className="bg-white/5 rounded-xl p-3" style={{ maxWidth: 220 }}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-semibold text-white">Reviewer</span>
                      <span className="text-[7px] text-white/40">2d ago</span>
                    </div>
                    <div className="flex gap-2 mb-1"><span style={{ fontSize: 9 }}>⭐⭐⭐⭐☆</span><span style={{ fontSize: 9 }}>🔥🔥</span></div>
                    <p className="text-[8px] text-white/70">Great story!</p>
                  </div>
                }
              />

              {/* ─── Share Story ─── */}
              <PageSubheading fullSpan>Share Story</PageSubheading>

              <PanelCardV2
                panelName="Blue Info Callout"
                background="bg-blue-500/10"
                border="border border-blue-500/20"
                borderRadius="rounded-xl"
                purpose="Permission/info callout in Share Story modal"
                locations="ShareStoryModal.tsx"
                pageSpecific appWide={false}
                notes="Text: text-blue-300 text-xs. Unique pattern — not used elsewhere."
                preview={
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3" style={{ maxWidth: 240 }}>
                    <p className="text-blue-300 text-[8px]">ℹ️ Published stories visible to all users.</p>
                  </div>
                }
              />

              {/* ─── Art Style Selection ─── */}
              <PageSubheading fullSpan>Art Style Selection</PageSubheading>

              <PanelCardV2
                panelName="Art Style Selection Card"
                background="bg-card"
                border="ring-1 ring-border · selected: ring-2 ring-blue-500"
                borderRadius="rounded-xl"
                shadow="selected: shadow-md"
                purpose="Art style picker in image generation modals"
                locations="AvatarGenerationModal, CoverImageGenerationModal, SceneImageGenerationModal"
                appWide={false} pageSpecific
                notes="Checkmark: w-5 h-5 bg-primary rounded-full. ⚠ Uses light-theme (bg-card)."
                preview={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 70, padding: 6, borderRadius: 10, background: '#fff', boxShadow: '0 0 0 1px #e2e8f0', position: 'relative' }}>
                      <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 6, background: '#e2e8f0' }} />
                      <p style={{ fontSize: 8, fontWeight: 600, textAlign: 'center', marginTop: 4, color: '#111827' }}>Style A</p>
                    </div>
                    <div style={{ width: 70, padding: 6, borderRadius: 10, background: '#fff', boxShadow: '0 0 0 2px #3b82f6', position: 'relative' }}>
                      <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 6, background: '#e2e8f0' }} />
                      <p style={{ fontSize: 8, fontWeight: 600, textAlign: 'center', marginTop: 4, color: '#111827' }}>Style B</p>
                      <div style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700 }}>✓</div>
                    </div>
                  </div>
                }
              />

              {/* ─── Misc Panels ─── */}
              <PageSubheading fullSpan>Misc Panels</PageSubheading>

              <PanelCardV2
                panelName="CharacterPicker Overlay"
                background="bg-zinc-900"
                border="border-white/10"
                borderRadius="rounded-3xl"
                purpose="Full-screen character picker with custom backdrop (bg-slate-900/50 backdrop-blur-sm)"
                locations="CharacterPicker.tsx"
                pageSpecific appWide={false}
                notes="⚠ rounded-3xl — unique container radius. Third overlay implementation (not Dialog/AlertDialog)."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 60, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '8px 16px', color: '#fff', fontSize: 9, fontWeight: 600 }}>
                      Picker — rounded-3xl
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="ScrollableSection Fade"
                background="from-white via-white/80 to-transparent"
                border="N/A"
                borderRadius="N/A"
                purpose="Fade indicators for overflow scrolling (top and bottom)"
                locations="ScrollableSection.tsx"
                appWide pageSpecific={false}
                notes="⚠ White gradients on dark backgrounds — visually jarring. Height: h-8."
                preview={
                  <div style={{ position: 'relative', height: 40, width: '100%', background: '#2a2a2f', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: 'linear-gradient(to bottom, white, rgba(255,255,255,0.8), transparent)', zIndex: 1 }} />
                    <div style={{ padding: '16px 8px', fontSize: 8, color: '#94a3b8' }}>Content</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, background: 'linear-gradient(to top, white, rgba(255,255,255,0.8), transparent)', zIndex: 1 }} />
                  </div>
                }
              />

              <PanelCardV2
                panelName="Chronicle UI Card"
                background="bg-white"
                border="border-slate-200"
                borderRadius="rounded-3xl"
                shadow="shadow-sm"
                purpose="Light-theme card from Chronicle UI.tsx. Parallel to dark app panels."
                locations="UI.tsx, BackgroundPickerModal.tsx"
                appWide={false} pageSpecific
                notes="⚠ Light theme — conflicts with dark panel standard (bg-[#2a2a2f])."
                preview={
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" style={{ width: '100%' }}>
                    <div className="text-[9px] font-bold text-[hsl(var(--ui-surface-2))]">Chronicle Card</div>
                    <div className="text-[7px] text-slate-500 mt-0.5">Light-theme from UI.tsx</div>
                  </div>
                }
              />

              {/* ─── Arc System ─── */}
              <PageSubheading fullSpan>Arc System</PageSubheading>

              <PanelCardV2
                panelName="Arc Phase Card"
                background="#2a2a2f"
                border="border-white/10"
                borderRadius="rounded-2xl"
                purpose="Phase container with progress ring, phase title, branch lanes (success/fail)"
                locations="ArcPhaseCard.tsx"
                pageSpecific appWide={false}
                notes="Phases inline separated by border-t. Contains CircularProgress component."
                preview={
                  <div className="bg-[#2a2a2f] rounded-2xl border border-white/10 p-3" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <svg width={24} height={24} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={12} cy={12} r={9} stroke="#334155" strokeWidth={3} fill="none" />
                        <circle cx={12} cy={12} r={9} stroke="#3b82f6" strokeWidth={3} fill="none" strokeDasharray={56.5} strokeDashoffset={28.3} />
                      </svg>
                      <span className="text-white font-bold text-[9px]">Phase 1</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div className="flex-1 rounded p-1.5" style={{ background: 'rgba(34,197,127,0.28)' }}><span className="text-[7px] font-bold text-emerald-300 uppercase">Succeed</span></div>
                      <div className="flex-1 rounded p-1.5" style={{ background: 'rgba(240,74,95,0.28)' }}><span className="text-[7px] font-bold text-red-300 uppercase">Fail</span></div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Arc Branch Lane"
                background="Success: rgba(34,197,127,0.28) · Fail: rgba(240,74,95,0.28)"
                border="Step borders: Red (failed), Blue (succeeded), Orange (deviated)"
                borderRadius="rounded-lg"
                purpose="Color-coded branch lanes with status-based step cards"
                locations="ArcBranchLane.tsx"
                pageSpecific appWide={false}
                notes="Step cards: success rgba(51,75,66,0.78), fail rgba(78,58,68,0.78). ⚠ Uses inline rgba() not Tailwind tokens."
                preview={
                  <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                    <div className="flex-1 rounded p-2" style={{ background: 'rgba(34,197,127,0.28)' }}>
                      <div className="text-[7px] font-bold text-emerald-300 uppercase mb-1">Succeed</div>
                      <div className="rounded p-1 border-l-2 border-blue-500 mb-1" style={{ background: 'rgba(51,75,66,0.78)' }}><span className="text-[7px] text-white">Step 1</span></div>
                    </div>
                    <div className="flex-1 rounded p-2" style={{ background: 'rgba(240,74,95,0.28)' }}>
                      <div className="text-[7px] font-bold text-red-300 uppercase mb-1">Fail</div>
                      <div className="rounded p-1 border-l-2 border-red-500 mb-1" style={{ background: 'rgba(78,58,68,0.78)' }}><span className="text-[7px] text-white">Step 1</span></div>
                    </div>
                  </div>
                }
              />

              {/* ─── Creator Profile ─── */}
              <PageSubheading fullSpan>Creator Profile</PageSubheading>

              <PanelCardV2
                panelName="Creator Profile Card"
                background="#1e1e22"
                border="border-white/10"
                borderRadius="rounded-2xl"
                purpose="Creator profile display with avatar, bio, stats pills, follow button"
                locations="CreatorProfile.tsx"
                pageSpecific appWide={false}
                notes="Stats: bg-white/5 rounded-xl. ⚠ #1e1e22 — yet another dark surface color."
                preview={
                  <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-3" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="w-10 h-10 rounded-xl bg-zinc-700" />
                      <div><div className="text-white font-bold text-[9px]">Creator</div><div className="text-[rgba(248,250,252,0.3)] text-[7px]">@user</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <div className="bg-white/5 rounded-lg px-2 py-1 text-[7px] text-white/70">👁 1.2k</div>
                      <div className="bg-white/5 rounded-lg px-2 py-1 text-[7px] text-white/70">❤ 340</div>
                    </div>
                  </div>
                }
              />

              {/* ─── Model Settings ─── */}
              <PageSubheading fullSpan>Model Settings</PageSubheading>

              <PanelCardV2
                panelName="Narrative Core Info Card"
                background="bg-slate-900"
                border="N/A"
                borderRadius="rounded-lg"
                purpose="Dark info card with watermark text on light-theme settings page"
                locations="ModelSettingsTab.tsx"
                pageSpecific appWide={false}
                notes="Watermark: text-[120px] font-black text-white/5 italic. Light page, dark card."
                preview={
                  <div className="bg-slate-900 text-white rounded-lg p-3 relative overflow-hidden" style={{ width: '100%', minHeight: 50 }}>
                    <div className="relative z-10">
                      <div className="font-black text-[9px] tracking-tight">Narrative Core</div>
                      <div className="text-[7px] text-[rgba(248,250,252,0.3)]">Powered by AI</div>
                    </div>
                    <div className="absolute -right-1 -bottom-1 text-[36px] font-black text-white/5 italic select-none">AI</div>
                  </div>
                }
              />

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* ═══ MODALS ═══ */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <PageSubheading fullSpan>Modal — Global Patterns</PageSubheading>

              <PanelCardV2
                panelName="Modal Backdrop"
                background="bg-black/80 (standard)"
                border="N/A"
                borderRadius="N/A"
                purpose="Radix DialogOverlay. Fixed inset-0, z-50."
                locations="Global (all Dialog-based modals)"
                appWide pageSpecific={false}
                notes="Variants: bg-black/90 backdrop-blur-sm (ReviewModal), bg-black/85 (SceneTagEditor)"
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 60, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #334155, #475569)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#94a3b8' }}>App Content</div>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 14px', color: '#fff', fontSize: 8, fontWeight: 600 }}>Modal</div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Modal Footer / Button Row"
                background="N/A (inherits modal bg)"
                border="N/A"
                borderRadius="rounded-xl (buttons)"
                purpose="Standard modal action buttons: Cancel, Save, Delete"
                locations="Global modal pattern"
                appWide pageSpecific={false}
                notes="h-10 px-6 text-[10px] font-bold uppercase tracking-wider. Cancel: bg-[hsl(240_6%_18%)]. Destructive: bg-[hsl(var(--destructive))]."
                preview={
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="h-8 px-4 rounded-xl bg-[hsl(240_6%_18%)] border border-[hsl(var(--ui-border))] text-zinc-300 text-[8px] font-bold uppercase tracking-wider leading-none" style={{ cursor: 'default' }}>Cancel</button>
                    <button className="h-8 px-4 rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] text-[8px] font-bold uppercase tracking-wider leading-none" style={{ cursor: 'default' }}>Save</button>
                    <button className="h-8 px-4 rounded-xl bg-[hsl(var(--destructive))] text-white text-[8px] font-bold uppercase tracking-wider leading-none" style={{ cursor: 'default' }}>Delete</button>
                  </div>
                }
              />

              {/* ─── Specific Modals ─── */}
              <PageSubheading fullSpan>Modal — Specific Implementations</PageSubheading>

              <PanelCardV2
                panelName="DeleteConfirmDialog"
                background="hsl(240, 6%, 10%)"
                border="border-white/10"
                borderRadius="rounded-2xl"
                shadow="0 10px 30px rgba(0,0,0,0.5)"
                purpose="AlertDialog for all destructive actions (characters, sessions, stories)"
                locations="DeleteConfirmDialog.tsx"
                appWide pageSpecific={false}
                notes="Uses AlertDialog (not Dialog). Cancel: bg-[hsl(240_6%_18%)]. Delete: bg-[hsl(var(--destructive))]."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 60, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'hsl(240,6%,10%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 16px' }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#e8eef8', marginBottom: 4 }}>Delete this?</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ padding: '2px 8px', borderRadius: 8, background: 'hsl(240,6%,18%)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eef8', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', cursor: 'default' }}>Cancel</button>
                        <button style={{ padding: '2px 8px', borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', cursor: 'default', border: 'none' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Chat Settings Modal"
                background="bg-zinc-900"
                border="border-white/10"
                borderRadius="rounded-lg"
                shadow="0 12px 32px -2px rgba(0,0,0,0.5)"
                purpose="Toggle grid for chat display options (Dynamic BG, Transparent, POV)"
                locations="ChatInterfaceTab.tsx"
                pageSpecific appWide={false}
                notes="max-w-2xl. Toggle rows: p-3 bg-zinc-800/50 rounded-xl. Grid: grid-cols-2."
                preview={
                  <div className="bg-zinc-900 border border-white/10 rounded-lg p-3" style={{ width: '100%' }}>
                    <div className="text-[8px] font-black text-white uppercase tracking-tight mb-2">⚙ Chat Settings</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-1.5 bg-zinc-800/50 rounded-lg"><span className="text-[7px] font-semibold text-zinc-200">Dynamic BG</span></div>
                      <div className="p-1.5 bg-zinc-800/50 rounded-lg"><span className="text-[7px] font-semibold text-zinc-200">Transparent</span></div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="Two-Option Selection Modal"
                background="bg-zinc-900"
                border="border-white/10"
                borderRadius="rounded-lg"
                purpose="Shared 2-column option picker pattern (blue/purple accent cards)"
                locations="CharacterCreationModal, EnhanceModeModal, CustomContentTypeModal"
                appWide={false} pageSpecific
                notes="p-0 gap-0 [&>button]:hidden. Option cards: p-5 rounded-2xl bg-zinc-800/50. ⚠ 3 identical layouts — should be shared component."
                preview={
                  <div className="rounded-lg overflow-hidden" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                    <div style={{ padding: '8px 12px 4px' }}>
                      <div className="text-white text-[9px] font-bold">Select Option</div>
                      <div className="text-zinc-400 text-[7px] mt-0.5">Choose below.</div>
                    </div>
                    <div style={{ padding: '4px 12px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div className="p-2 rounded-xl border border-white/10 text-center" style={{ background: 'rgba(39,39,42,0.5)' }}>
                        <div className="w-6 h-6 rounded-lg mx-auto mb-1 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}><span className="text-blue-500 text-[8px]">★</span></div>
                        <div className="text-white text-[7px] font-bold">Option A</div>
                      </div>
                      <div className="p-2 rounded-xl border border-white/10 text-center" style={{ background: 'rgba(39,39,42,0.5)' }}>
                        <div className="w-6 h-6 rounded-lg mx-auto mb-1 flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)' }}><span className="text-purple-400 text-[8px]">◆</span></div>
                        <div className="text-white text-[7px] font-bold">Option B</div>
                      </div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="AIPromptModal"
                background="hsl(var(--ui-surface))"
                border="border-[hsl(var(--ui-border))]"
                borderRadius="rounded-lg"
                purpose="AI character fill/generate prompt with colored header banner"
                locations="AIPromptModal.tsx"
                pageSpecific appWide={false}
                notes="Only modal with colored header bar: bg-[#4a5f7f] -mx-6 -mt-6 px-6 py-4 rounded-t-lg"
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#2a2a2f', borderRadius: 6, overflow: 'hidden', width: 160 }}>
                      <div style={{ background: '#4a5f7f', padding: '4px 10px' }}><span style={{ fontSize: 7, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>AI Prompt</span></div>
                      <div style={{ padding: '4px 10px', fontSize: 7, color: '#94a3b8' }}>Content...</div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="CharacterEditModal"
                background="#2a2a2f"
                border="border-white/10"
                borderRadius="rounded-lg"
                purpose="Full character editing modal with dark header and form sections"
                locations="CharacterEditModal.tsx"
                pageSpecific appWide={false}
                notes="max-w-6xl. Header: bg-black. ⚠ Uses bg-[#2a2a2f] instead of standard bg-zinc-900."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#2a2a2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600 }}>
                      Character Edit — max-w-6xl
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="ShareStoryModal"
                background="#2a2a2f"
                border="border-white/10"
                borderRadius="rounded-lg"
                purpose="Publish/share settings with permission toggles and !important button overrides"
                locations="ShareStoryModal.tsx"
                pageSpecific appWide={false}
                notes="max-w-lg. Info card: bg-zinc-900/50 rounded-xl border-zinc-700. ⚠ !important CSS overrides on buttons."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#2a2a2f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600 }}>
                      Share Story
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="StoryDetailModal"
                background="#121214"
                border="border-white/10"
                borderRadius="rounded-[32px]"
                shadow="0 20px 50px rgba(0,0,0,0.5)"
                purpose="Full story detail view with action bar, characters, reviews"
                locations="StoryDetailModal.tsx"
                pageSpecific appWide={false}
                notes="⚠ Unique 32px radius — standard modals use rounded-lg. Custom overlay."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '8px 20px', color: '#fff', fontSize: 8, fontWeight: 600, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                      Story Detail — rounded-[32px]
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="ReviewModal"
                background="#121214"
                border="border-white/10"
                borderRadius="rounded-2xl"
                purpose="Review submission/editing with star + spice ratings"
                locations="ReviewModal.tsx"
                pageSpecific appWide={false}
                notes="Custom overlay: bg-black/90 backdrop-blur-sm. Buttons: h-11 text-sm (non-standard). Submit: bg-[#4a5f7f]. Delete: bg-red-600/20."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600 }}>
                      Review — rounded-2xl
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="DraftsModal"
                background="bg-zinc-900"
                border="border border-white/10"
                borderRadius="rounded-xl"
                shadow="0 10px 30px rgba(0,0,0,0.5)"
                purpose="Draft message list with restore/delete actions"
                locations="DraftsModal.tsx"
                pageSpecific appWide={false}
                notes="max-w-md p-0. Uses rounded-xl (unique among modals)."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                      Drafts — rounded-xl
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="FolderEditModal"
                background="bg-zinc-900"
                border="border-[#4a5f7f]"
                borderRadius="rounded-lg"
                purpose="Folder name/description editing. Close button hidden."
                locations="FolderEditModal.tsx"
                pageSpecific appWide={false}
                notes="⚠ Uses border-[#4a5f7f] (accent) instead of standard border-white/10. [&>button]:hidden."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid #4a5f7f', borderRadius: 6, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600 }}>
                      Folder Edit — border-[#4a5f7f]
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="SidebarThemeModal"
                background="bg-zinc-900"
                border="border-white/10"
                borderRadius="rounded-lg"
                shadow="0 12px 32px -2px rgba(0,0,0,0.5)"
                purpose="Sidebar background/theme customization with image picker and color controls"
                locations="SidebarThemeModal.tsx"
                pageSpecific appWide={false}
                notes="w-[min(96vw,1280px)]. [&>button]:hidden. Wide modal."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600 }}>
                      Sidebar Theme — wide modal
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="SceneTagEditorModal"
                background="bg-zinc-900"
                border="border-[#4a5f7f]"
                borderRadius="rounded-xl"
                purpose="Image tag editing with preview and tag input. Custom overlay (not Radix Dialog)."
                locations="SceneTagEditorModal.tsx"
                pageSpecific appWide={false}
                notes="⚠ Uses fixed inset-0 overlay (bg-black/85) instead of Radix Dialog. Accent border."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.85)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181b', border: '1px solid #4a5f7f', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600 }}>
                      Scene Tag Editor
                    </div>
                  </div>
                }
              />

              {/* ─── Light-Theme Modals ─── */}
              <PageSubheading fullSpan>Modal — Light-Theme Variants</PageSubheading>

              <PanelCardV2
                panelName="Image Generation Modals"
                background="shadcn DialogContent default (light bg)"
                border="border-slate-200 (default)"
                borderRadius="rounded-lg"
                purpose="Avatar, Cover Image, Scene Image generation. Only light-theme modals in app."
                locations="AvatarGenerationModal, CoverImageGenerationModal, SceneImageGenerationModal"
                pageSpecific appWide={false}
                notes="⚠ Only light-theme modals in entire app. Inputs: bg-slate-50 border-slate-200."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 16px', color: '#111827', fontSize: 8, fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                      ✨ Generate — light theme
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="ChangeNameModal"
                background="shadcn DialogContent default (light bg)"
                border="default"
                borderRadius="rounded-lg"
                purpose="Character name change. Cancel: bg-slate-100. Save: bg-slate-900."
                locations="ChangeNameModal.tsx"
                pageSpecific appWide={false}
                notes="⚠ Light theme — same inconsistency as Image Gen modals. Uses slate-100/slate-700 buttons."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 16px', color: '#111827', fontSize: 8, fontWeight: 600 }}>
                      Change Name — light
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="BackgroundPickerModal"
                background="bg-transparent"
                border="N/A"
                borderRadius="rounded-lg"
                purpose="Wraps Chronicle UI Card. Transparent shell with shadow-none."
                locations="BackgroundPickerModal.tsx"
                pageSpecific appWide={false}
                notes="[&>button]:hidden. Uses Chronicle UI Card inside a transparent Dialog."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.6)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                      <div className="rounded-xl border border-slate-200 bg-white p-2 text-[8px] text-slate-600 font-semibold" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Background Picker (transparent shell)</div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="ImageLibraryPickerModal"
                background="shadcn DialogContent default"
                border="default"
                borderRadius="rounded-lg"
                purpose="Image selection from library folders"
                locations="ImageLibraryPickerModal.tsx"
                pageSpecific appWide={false}
                notes="Header: bg-slate-50. Light-theme modal."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '4px 12px', fontSize: 7, fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Image Library</div>
                      <div style={{ padding: '4px 12px', fontSize: 7, color: '#64748b' }}>Select image...</div>
                    </div>
                  </div>
                }
              />

              <PanelCardV2
                panelName="MemoriesModal"
                background="bg-slate-900"
                border="border-slate-700"
                borderRadius="rounded-lg"
                purpose="Conversation memory viewer"
                locations="MemoriesModal.tsx"
                pageSpecific appWide={false}
                notes="⚠ Uses bg-slate-900 + border-slate-700 — neither standard dark tokens."
                preview={
                  <div style={{ position: 'relative', width: '100%', height: 56, borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.8)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 16px', color: '#fff', fontSize: 8, fontWeight: 600 }}>
                      Memories — bg-slate-900
                    </div>
                  </div>
                }
              />

            </div>

            {/* Inconsistency notes at bottom */}
            <div style={{ marginTop: 24 }}>
              <InconsistencyNote items={[
                { file: 'SideCharacterCard.tsx', note: 'Uses rounded-full avatar (w-20 h-20) — every other avatar in the app uses rounded-2xl.' },
                { file: 'ChatInterfaceTab.tsx', note: 'Chat bubble bg #1c1f26 does not match any panel token (#2a2a2f or bg-zinc-900).' },
                { file: 'ChatInterfaceTab.tsx', note: 'White sidebar (bg-white) with text-slate-700 inside a dark-themed app.' },
                { file: 'ScrollableSection.tsx', note: 'White fade gradients on dark backgrounds — visually jarring.' },
                { file: 'WorldTab.tsx', note: 'Right pane uses light-theme Chronicle UI Cards on dark bg-[#2a2a2f] background.' },
                { file: 'CharactersTab.tsx', note: 'Uses rounded-[24px] — yet another radius variant alongside rounded-2xl/3xl/[2rem]/[32px].' },
                { file: 'ArcBranchLane.tsx', note: 'Uses inline rgba() instead of Tailwind tokens.' },
                { file: 'UI.tsx', note: 'Light-theme Card (bg-white rounded-3xl) conflicts with dark panel standard.' },
              ]} />
              <InconsistencyNote items={[
                { file: 'Global', note: '5 different modal backgrounds: bg-zinc-900, bg-[#2a2a2f], bg-[#121214], bg-slate-900, default light (shadcn).' },
                { file: 'Global', note: '3 different modal border-radius values: rounded-lg (standard), rounded-2xl (Review/Delete), rounded-[32px] (Story Detail).' },
                { file: 'Global', note: 'Button sizing varies: h-10 (standard), h-11 (Review), h-12 (Story Detail actions).' },
                { file: 'Global', note: '3 modal border styles: border-white/10 (standard), border-[#4a5f7f] (accent), border-slate-700 (Memories).' },
                { file: 'Global', note: '2 dialog systems: Radix Dialog (standard) vs custom fixed inset-0 (SceneTagEditor, CharacterPicker).' },
                { file: 'CharacterCreation / EnhanceMode / CustomContentType', note: '3 identical Two-Option modal layouts — should be shared component.' },
                { file: 'AvatarGen / CoverGen / SceneGen / ChangeNameModal', note: 'Light-theme modals in otherwise dark-themed app.' },
                { file: 'AIPromptModal.tsx', note: 'Only modal with colored header bar pattern (bg-[#4a5f7f] -mx-6 -mt-6).' },
              ]} />
            </div>
          </Section>

          <Divider />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ═══ 7. ICONS ═══ */}
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
              specs='<strong>Default:</strong> text-white, text-zinc-400. <strong>Accent:</strong> text-blue-500, text-purple-400, text-cyan-200. <strong>Destructive:</strong> text-red-400.'
              preview={
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { color: '#ffffff', label: 'text-white', role: 'Default', needsBorder: true },
                    { color: '#a1a1aa', label: 'text-zinc-400', role: 'Muted', needsBorder: false },
                    { color: '#3b82f6', label: 'text-blue-500', role: 'Accent', needsBorder: false },
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
text-blue-500    — Accent
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
                      <div className="w-5 h-5 rounded bg-blue-500" />
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
              specs='<strong>Sparkles size={14}</strong> (w-3.5 h-3.5). Default: text-zinc-400. Hover: text-blue-500. Used as AI enhancement trigger on character trait rows. Paired with p-1.5 rounded-md container.'
              preview={
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="p-1.5 rounded-md text-zinc-400" style={{ background: 'transparent' }}>✨</div>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Default</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="p-1.5 rounded-md text-blue-500 bg-blue-500/10">✨</div>
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
      )}
      <StyleGuideDownloadModal open={showDownloadModal} onClose={() => setShowDownloadModal(false)} contentRef={contentRef} />
      
      {/* Edits modals */}
      <KeepOrEditModal
        open={!!keepOrEditTarget}
        onOpenChange={(o) => { if (!o) setKeepOrEditTarget(null); }}
        cardName={keepOrEditTarget?.cardName || ''}
        cardType={keepOrEditTarget?.cardType || ''}
        details={keepOrEditTarget?.details || {}}
        onKeep={handleKeep}
        onEdit={handleEditOpen}
      />
      <EditDetailModal
        open={!!editDetailTarget}
        onOpenChange={(o) => { if (!o) setEditDetailTarget(null); }}
        cardName={editDetailTarget?.cardName || ''}
        cardType={editDetailTarget?.cardType || ''}
        details={editDetailTarget?.details || {}}
        existingComment={editDetailTarget?.existingComment}
        existingId={editDetailTarget?.existingId}
        onSave={handleSaveEdit}
      />
      <EditsListModal
        open={showEditsListModal}
        onOpenChange={setShowEditsListModal}
        onCountChange={refreshEditsState}
      />
    </div>
    </EditsContext.Provider>
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
