import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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



interface StyleGuideToolProps {
  onRegisterDownload?: (fn: (() => void) | null) => void;
  onRegisterEdits?: (fn: (() => void) | null) => void;
  onEditsCountChange?: (count: number) => void;
  onSwitchToAppGuide?: () => void;
}

type GuideDocSummary = {
  id: string;
  title: string;
  updatedAt: string | null;
};

export const StyleGuideTool: React.FC<StyleGuideToolProps> = ({ onRegisterDownload, onRegisterEdits, onEditsCountChange, onSwitchToAppGuide }) => {
  const navigate = useNavigate();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [guideDocs, setGuideDocs] = useState<GuideDocSummary[]>([]);
  const [guideDocsLoading, setGuideDocsLoading] = useState(false);
  const [guideDocsError, setGuideDocsError] = useState<string | null>(null);
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

  const openAppArchitecture = useCallback(() => navigate('/style-guide/app-architecture'), [navigate]);
  const openUiAudit = useCallback(() => navigate('/style-guide/ui-audit'), [navigate]);
  const openApiInspector = useCallback(() => navigate('/style-guide/api-inspector'), [navigate]);
  const openAppGuide = useCallback(() => { if (onSwitchToAppGuide) onSwitchToAppGuide(); else navigate('/?tab=admin&adminTool=app_guide'); }, [onSwitchToAppGuide, navigate]);

  const formatDateTime = useCallback((value: string | null) => {
    if (!value) return 'Unknown';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown';
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const describeGuideDocPurpose = useCallback((title: string) => {
    const normalized = title.toLowerCase();
    if (normalized.includes('app overview')) return 'Global architecture baseline: stack, routing, app shell, and shared systems.';
    if (normalized.includes('community gallery')) return 'Gallery UX + data flow reference: discovery surfaces, sorting/filtering, and card behavior.';
    if (normalized.includes('my stories')) return 'Story management structure: ownership, drafts/bookmarks/published state, and transitions.';
    if (normalized.includes('character library')) return 'Character library architecture: sourcing, search/filter behavior, and tile/list interactions.';
    if (normalized.includes('image library')) return 'Image pipeline guide: asset ingestion, folders, metadata, and downstream usage.';
    if (normalized.includes('chat history')) return 'Conversation registry behavior: session retrieval, resume flow, and retention/deletion rules.';
    if (normalized.includes('chat interface')) return 'Live chat runtime reference: message rendering, state sync, controls, and prompts.';
    if (normalized.includes('scenario builder') || normalized.includes('story builder')) return 'Story Builder/World Builder behavior, sections, and save/compose flows.';
    if (normalized.includes('character builder')) return 'Character Builder structure: containers, custom fields, AI-enhance mapping, and save behavior.';
    if (normalized.includes('admin panel')) return 'Admin tool taxonomy, navigation patterns, and governance controls.';
    if (normalized.includes('account')) return 'Account/profile/subscription behavior and user-setting boundaries.';
    if (normalized.includes('shared elements') || normalized.includes('architecture')) return 'Cross-cutting components, primitives, and shared interaction contracts.';
    return 'Page/system-specific implementation guide and maintenance reference.';
  }, []);

  useEffect(() => {
    if (!showHowToUse) return;
    let mounted = true;
    const loadGuideDocs = async () => {
      setGuideDocsLoading(true);
      setGuideDocsError(null);
      try {
        const { data, error } = await (supabase as any)
          .from('guide_documents')
          .select('id,title,updated_at,sort_order')
          .order('sort_order', { ascending: true });
        if (!mounted) return;
        if (error) {
          setGuideDocsError(error.message || 'Failed to load guide documents.');
          setGuideDocs([]);
          return;
        }
        const nextDocs: GuideDocSummary[] = (data || []).map((row: any) => ({
          id: String(row?.id ?? ''),
          title: String(row?.title ?? 'Untitled Document'),
          updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : null,
        }));
        setGuideDocs(nextDocs);
      } catch (error: any) {
        if (!mounted) return;
        setGuideDocsError(error?.message || 'Failed to load guide documents.');
        setGuideDocs([]);
      } finally {
        if (mounted) setGuideDocsLoading(false);
      }
    };

    void loadGuideDocs();
    return () => {
      mounted = false;
    };
  }, [showHowToUse]);

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

          <button
            type="button"
            onClick={openAppArchitecture}
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
            App Architecture
          </button>

          <button
            type="button"
            onClick={openUiAudit}
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
            Quality Hub
          </button>

          <button
            type="button"
            onClick={openApiInspector}
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
            API Inspector
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
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>Purpose of this modal</div>
                <p style={{ margin: 0 }}>
                  This is the operating manual for humans and LLM agents. Use it as strict instructions for where to inspect, where to log findings,
                  and where to record implementation changes. Do not skip sections or freestyle workflows.
                </p>
              </div>
              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#1c1c1f', padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>Tool directory (exact scope + expected use)</div>
                <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                  <li>
                    <strong>App Style Guide</strong>:
                    <div>Use for visual implementation standards only (tokens, spacing, component appearance). Not for runtime/debug logic.</div>
                  </li>
                  <li>
                    <strong>App Guide</strong>:
                    <div>Use for long-form page/system explanations and operational documentation by page. This is narrative context and process guidance.</div>
                  </li>
                  <li>
                    <strong>App Architecture</strong>:
                    <div>Use for filesystem/component mapping (what folder/file owns what behavior). Use this first when locating code ownership.</div>
                  </li>
                  <li>
                    <strong>Quality Hub</strong>:
                    <div>Use as execution + governance center for scans, issue tracking, run history, and implemented-change history.</div>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 4 }}>
                      <li><strong>Overview</strong>: scan entry point and module checklist selection.</li>
                      <li><strong>Issue Registry</strong>: diagnosed issues only (severity/confidence/evidence/files/status).</li>
                      <li><strong>Scan Runs</strong>: each scan execution (scope, summary, agent/model, timestamp).</li>
                      <li><strong>Change Log</strong>: actual implemented changes (what changed, where, why, expected impact).</li>
                    </ul>
                  </li>
                  <li>
                    <strong>API Inspector</strong>:
                    <div>Use for end-to-end AI/runtime flow verification: prompt assembly, context injections, API payload flow, and post-call handling.</div>
                  </li>
                </ol>
              </div>

              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#1c1c1f', padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>App Guide live document inventory (what exists + what each doc is for)</div>
                {guideDocsLoading && <p style={{ margin: 0 }}>Loading App Guide document list...</p>}
                {!guideDocsLoading && guideDocsError && (
                  <p style={{ margin: 0, color: '#fda4af' }}>
                    Unable to load App Guide docs from database: {guideDocsError}
                  </p>
                )}
                {!guideDocsLoading && !guideDocsError && guideDocs.length === 0 && (
                  <p style={{ margin: 0 }}>No App Guide documents found.</p>
                )}
                {!guideDocsLoading && !guideDocsError && guideDocs.length > 0 && (
                  <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                    {guideDocs.map((doc) => (
                      <li key={doc.id}>
                        <strong>{doc.title}</strong>
                        <div>{describeGuideDocPurpose(doc.title)}</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>Last updated: {formatDateTime(doc.updatedAt)}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#1c1c1f', padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>LLM runbook (strict execution order)</div>
                <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                  <li>Start in <strong>App Architecture</strong> to identify ownership (folder/file/component).</li>
                  <li>Move to <strong>API Inspector</strong> if issue touches AI prompt flow, API payloads, enrich/fill behavior, or context injection.</li>
                  <li>Open <strong>Quality Hub → Overview</strong> and select the matching scan module checklist.</li>
                  <li>Run scan and write a run summary in <strong>Scan Runs</strong> (scope + what was checked + what was skipped).</li>
                  <li>For each confirmed issue, create/update entry in <strong>Issue Registry</strong> with exact files and evidence.</li>
                  <li>After implementing code changes, add a matching entry in <strong>Change Log</strong> with files touched and expected outcome.</li>
                  <li>Re-test and update related <strong>Issue Registry</strong> status (open/reviewed/deferred/fixed).</li>
                </ol>
              </div>

              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#1c1c1f', padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>Logging rules (non-optional)</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                  <li><strong>Issue Registry</strong> stores problems and evidence, not implementation details.</li>
                  <li><strong>Scan Runs</strong> stores each scan attempt and summary, even if no findings were discovered.</li>
                  <li><strong>Change Log</strong> stores every code/config/docs change that was actually applied.</li>
                  <li>Do not put implementation-only notes in Issue Registry without a corresponding Change Log record.</li>
                  <li>Every fix should link back to a known issue or explicitly state it was proactive hardening/cleanup.</li>
                </ul>
              </div>

              <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#1c1c1f', padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>When to use each tool first (quick decision matrix)</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                  <li>UI mismatch / spacing / visual consistency issue → <strong>App Style Guide</strong> then <strong>Quality Hub</strong>.</li>
                  <li>“Where does this behavior live?” confusion → <strong>App Architecture</strong> first.</li>
                  <li>Prompt quality / missing AI context / wrong generation behavior → <strong>API Inspector</strong> first.</li>
                  <li>Need narrative page-level context or operator guidance → <strong>App Guide</strong>.</li>
                  <li>Need formal issue management and progress tracking → <strong>Quality Hub</strong>.</li>
                </ul>
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
