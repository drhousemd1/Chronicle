import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { StyleGuideDownloadModal } from './StyleGuideDownloadModal';
import {
  KeepOrEditModal, EditDetailModal, EditsListModal,
  getEditsRegistry, upsertEdit, removeKeep, addKeep, getKeeps, getEditsCount,
  type EditEntry, type SwatchOption,
} from './StyleGuideEditsModal';

/* ═══════════════════════ EDITS CONTEXT ═══════════════════════ */
interface EditsContextValue {
  keeps: Set<string>;
  editIds: Set<string>;
  onCardAction: (cardName: string, cardType: string, details: Record<string, string>) => void;
  onRemoveKeep: (cardName: string) => void;
}
const EditsContext = createContext<EditsContextValue | null>(null);

/* ═══════════════════════ CARD EDIT WRAPPER ═══════════════════════ */
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

/* ═══════════════════════ CONSTANTS ═══════════════════════ */
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

const ALL_SWATCHES: SwatchOption[] = [];

const GENERAL_PURPOSE_PROTOCOL = `Chronicle Work Manual: docs/architecture-knowledge/chronicle-work-manual.md
Chronicle Work Manual version: 0.2.2-provisional

Open 1. Start Here in the canonical Work Manual before using this tool for Chronicle work. The manual owns work classification, records, checks, review, delivery, and stopping.

Tool mechanics:
- Use App Style Guide as a visual and component reference.
- Use Chronicle Knowledge Base capability manuals for verified product behavior and ownership.
- Use App Guide for its maintained long-form page and system references.
- Use Quality Hub to run or inspect an explicitly selected scan.

This panel does not require a plan, audit, Current Work record, Issue, Changelog entry, full check package, or documentation update. Those actions occur only when the Work Manual or the user's explicit request triggers them.`;

const SCAN_ONLY_PROTOCOL = `Quality Hub scan mechanics

Chronicle Work Manual: docs/architecture-knowledge/chronicle-work-manual.md
Chronicle Work Manual version: 0.2.2-provisional

Use this panel only after the Work Manual or the user selects a Quality Hub scan.

1. Select the module that matches the authorized scan scope.
2. Record the exact module, source surface inspected, checks run, skipped areas, result counts, agent label, and timestamp in Scan Runs.
3. Treat a suspected problem as a finding to verify. Create or update an Issue only when the Work Manual's Issue trigger is met.
4. Create or update Current Work only when the Work Manual's continuity trigger is met.
5. Accepted Changelog history remains read-only here and is created only by the protected closeout or accepted-update mechanism.
6. When live Supabase facts matter, follow the Work Manual's live-system safeguard and record what remains unverified.

Quality Hub defines scan mechanics and stored scan data. It does not independently expand the work or decide which Chronicle records are required.`;



interface StyleGuideToolProps {
  onRegisterDownload?: (fn: (() => void) | null) => void;
  onRegisterEdits?: (fn: (() => void) | null) => void;
  onEditsCountChange?: (count: number) => void;
  onSwitchToAppGuide?: () => void;
}

export const StyleGuideTool: React.FC<StyleGuideToolProps> = ({ onRegisterDownload, onRegisterEdits, onEditsCountChange, onSwitchToAppGuide }) => {
  const navigate = useNavigate();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
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

  useEffect(() => { refreshEditsState(); }, [refreshEditsState]);

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

  const openAppGuide = useCallback(() => { if (onSwitchToAppGuide) onSwitchToAppGuide(); else navigate('/?tab=admin&adminTool=app_guide'); }, [onSwitchToAppGuide, navigate]);

  return (
    <EditsContext.Provider value={editsContextValue}>
      <div
        style={{
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          height: '100%',
          background: sg.bg,
          fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
          color: sg.text,
          lineHeight: 1.5,
          overflow: 'hidden',
        }}
      >
        {/* ─── LEFT NAV BAR ─── */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            width: isNarrow ? '100%' : 260,
            minWidth: isNarrow ? '100%' : 260,
            height: isNarrow ? 'auto' : '100%',
            display: 'flex',
            flexDirection: isNarrow ? 'row' : 'column',
            gap: 8,
            padding: isNarrow ? '12px 14px' : '20px 14px 24px',
            background: sg.surface,
            borderRight: isNarrow ? 'none' : `1px solid ${sg.border}`,
            borderBottom: isNarrow ? `1px solid ${sg.border}` : 'none',
            boxShadow: isNarrow ? '0 2px 8px rgba(15,23,42,0.05)' : '2px 0 10px rgba(15,23,42,0.05)',
            zIndex: 70,
          }}
        >
          <button
            type="button"
            onClick={() => setShowHowToUse(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: isNarrow ? 12 : 13, fontWeight: 800,
              padding: isNarrow ? '10px 12px' : '12px 14px',
              borderRadius: 10, border: `1px solid ${sg.border}`,
              cursor: 'pointer',
              background: '#ffffff', color: '#1f2937',
              transition: 'all 0.2s ease',
              flex: isNarrow ? 1 : undefined,
            }}
          >
            How to Use
          </button>

          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: isNarrow ? 12 : 13, fontWeight: 700,
              padding: isNarrow ? '10px 12px' : '12px 14px',
              borderRadius: 10, border: `1px solid ${sg.border}`,
              cursor: 'default',
              background: 'rgba(74,95,127,0.12)', color: sg.primary,
              boxShadow: 'inset 0 0 0 1px rgba(74,95,127,0.18)',
              flex: isNarrow ? 1 : undefined,
            }}
            aria-current="page"
          >
            App Style Guide
          </button>

          <button
            type="button"
            onClick={openAppGuide}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', whiteSpace: 'nowrap',
              fontSize: isNarrow ? 12 : 13, fontWeight: 700,
              padding: isNarrow ? '10px 12px' : '12px 14px',
              borderRadius: 10, border: `1px solid ${sg.border}`,
              cursor: 'pointer',
              background: '#ffffff', color: '#475569',
              transition: 'all 0.2s ease',
              flex: isNarrow ? 1 : undefined,
            }}
          >
            App Guide
          </button>

        </nav>

        {/* ─── MAIN CONTENT ─── */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div
            style={{
              background: '#4a5f7f',
              borderBottom: '1px solid rgba(248,250,252,0.3)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              padding: isNarrow ? '24px 16px 18px' : '28px 42px 24px',
            }}
          >
            <h1 style={{ fontSize: 'clamp(30px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.1, marginBottom: 8 }}>
              Chronicle App Style Guide
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 980, lineHeight: 1.65 }}>
              Style guide data has been reset and cleared.
            </p>
          </div>

          <div ref={contentRef} style={{ padding: isNarrow ? '16px' : '24px 42px', display: 'grid', gap: 18 }}>

            <iframe
              title="Style Guide Component Example"
              src="/style-guide-component-example.html"
              style={{
                width: '100%',
                minHeight: 5200,
                border: 'none',
                background: 'transparent',
                display: 'block',
              }}
            />

          </div>
        </div>
      </div>

      {/* Modals */}
      <StyleGuideDownloadModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        contentRef={contentRef}
      />
      <KeepOrEditModal
        open={!!keepOrEditTarget}
        cardName={keepOrEditTarget?.cardName ?? ''}
        cardType={keepOrEditTarget?.cardType ?? ''}
        details={keepOrEditTarget?.details ?? {}}
        onOpenChange={(open) => { if (!open) setKeepOrEditTarget(null); }}
        onKeep={handleKeep}
        onEdit={handleEditOpen}
      />
      <EditDetailModal
        open={!!editDetailTarget}
        cardName={editDetailTarget?.cardName ?? ''}
        cardType={editDetailTarget?.cardType ?? ''}
        details={editDetailTarget?.details ?? {}}
        existingComment={editDetailTarget?.existingComment}
        existingId={editDetailTarget?.existingId}
        onOpenChange={(open) => { if (!open) setEditDetailTarget(null); }}
        onSave={handleSaveEdit}
      />
      <EditsListModal
        open={showEditsListModal}
        onOpenChange={(open) => { if (!open) setShowEditsListModal(false); }}
        onCountChange={refreshEditsState}
      />
      {showHowToUse && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: 'min(920px, 100%)',
              maxHeight: '85vh',
              overflow: 'auto',
              borderRadius: 20,
              border: `1px solid ${sg.borderStrong}`,
              background: '#2a2a2f',
              boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 18px',
                color: '#fff',
                borderBottom: '1px solid rgba(255,255,255,0.14)',
                background: 'linear-gradient(180deg,#5a7292 0%,#4a5f7f 100%)',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>App Dashboard: How to Use</div>
              <button
                type="button"
                onClick={() => setShowHowToUse(false)}
                style={{
                  border: 'none',
                  borderRadius: 10,
                  background: '#2f3137',
                  color: '#eaedf1',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '8px 14px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: 18, display: 'grid', gap: 12, color: '#d4d4d8', fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#1c1c1f', padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Chronicle Workflow Pointer</div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: '#d4d4d8',
                  }}
                >
                  {GENERAL_PURPOSE_PROTOCOL.replace(/\\/g, '')}
                </pre>
              </div>
              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#1c1c1f', padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Quality Hub Scan Mechanics</div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: '#d4d4d8',
                  }}
                >
                  {SCAN_ONLY_PROTOCOL}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
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
