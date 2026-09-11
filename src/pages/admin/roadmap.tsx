import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Download, FileText, Flag, Lightbulb, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { AppShellHeader } from "@/components/app-shell/AppShellHeader";
import { requestKnowledgeSaveFile, writeKnowledgeFile } from "@/components/admin/knowledge-base/knowledge-file-save";
import { ChronicleSurfaceButton as SurfaceButton } from "@/components/chronicle/ChronicleDarkUi";
import { Dialog, DialogContentBare, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { exportRoadmapMarkdown, getRoadmapAttachmentUrl, loadRoadmap, removeRoadmapAttachments, resolveRoadmapAttachmentType, ROADMAP_ATTACHMENT_ACCEPT, ROADMAP_MAX_ATTACHMENTS, ROADMAP_MAX_ATTACHMENT_BYTES, RoadmapConflictError, saveRoadmap, uploadRoadmapAttachment, type RoadmapAttachment, type RoadmapDocument, type RoadmapItem, type RoadmapPriority, type RoadmapStatus } from "@/services/chronicle-roadmap";
import "./roadmap.css";

const sections = [
  { id: "critical", title: "Critical", description: "Must be resolved before Chronicle is functional and ready for real use.", Icon: TriangleAlert },
  { id: "important", title: "Important", description: "Ideally addressed, but not required before deployment.", Icon: Flag },
  { id: "non-critical", title: "Non-critical", description: "Future ideas, minor refinements, and bugs that do not break the app.", Icon: Lightbulb },
] as const;
const statuses: RoadmapStatus[] = ["Not yet started", "In progress", "Complete"];
type Editor = { item: RoadmapItem; isNew: boolean; files: File[]; uploaded: RoadmapAttachment[] };
const message = (error: unknown) => error instanceof Error ? error.message : "The roadmap could not be saved. Please try again.";

function Attachment({ attachment }: { attachment: RoadmapAttachment }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const resolve = () => void getRoadmapAttachmentUrl(attachment).then(value => { if (active) { setUrl(value); setFailed(false); } }).catch(() => { if (active) setFailed(true); });
    resolve();
    const timer = window.setInterval(resolve, 50 * 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [attachment]);
  if (!url || failed) return <span className="roadmap-screenshot-unavailable">{attachment.name}{failed ? " — file unavailable" : " — loading…"}</span>;
  return attachment.contentType.startsWith("image/")
    ? <a className="roadmap-screenshot" href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={attachment.name} loading="lazy" onError={() => setFailed(true)} /><span>{attachment.name}</span></a>
    : <a className="roadmap-document" href={url} download={attachment.name} aria-label={`Download ${attachment.name}`}><FileText size={20} aria-hidden="true" /><span>{attachment.name}</span><Download size={15} aria-hidden="true" /></a>;
}

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [document, setDocument] = useState<RoadmapDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<RoadmapItem | null>(null);
  const busy = useRef(false);
  const reading = useRef(false);
  const writeEpoch = useRef(0);
  const mounted = useRef(true);
  const hasDraft = useRef(false);
  hasDraft.current = !!editor || !!deleting;

  const refresh = useCallback(async (background = false) => {
    if (busy.current || reading.current || (background && (hasDraft.current || window.document.visibilityState === "hidden"))) return;
    reading.current = true;
    const startedAt = writeEpoch.current;
    if (!background) { setLoading(true); setError(""); }
    try {
      const next = await loadRoadmap();
      if (mounted.current && startedAt === writeEpoch.current && (!background || !hasDraft.current)) { setDocument(current => current?.revision === next.revision ? current : next); setConflict(false); setError(""); }
    } catch (cause) {
      if (mounted.current && startedAt === writeEpoch.current && !hasDraft.current) setError(message(cause));
    } finally {
      reading.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; };
  }, [refresh]);

  useEffect(() => {
    const sync = () => void refresh(true);
    window.addEventListener("focus", sync);
    window.document.addEventListener("visibilitychange", sync);
    const interval = window.setInterval(sync, 20_000);
    return () => { window.removeEventListener("focus", sync); window.document.removeEventListener("visibilitychange", sync); window.clearInterval(interval); };
  }, [refresh]);

  useEffect(() => {
    if (conflict && !editor && !deleting) void refresh(true);
  }, [conflict, editor, deleting, refresh]);

  // Explicit Save owns edits; warn before a browser reload discards an open draft.
  useEffect(() => {
    if (!editor && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editor, saving]);

  async function persist(prepare: RoadmapItem[] | (() => Promise<RoadmapItem[]>)) {
    if (!document || busy.current || conflict) return false;
    busy.current = true;
    writeEpoch.current += 1;
    setSaving(true); setError("");
    try {
      const items = typeof prepare === "function" ? await prepare() : prepare;
      const next = await saveRoadmap(document, items);
      if (mounted.current) { setDocument(next); toast.success("Saved", { duration: 2500 }); }
      return true;
    } catch (cause) {
      if (mounted.current) {
        setConflict(cause instanceof RoadmapConflictError);
        setError(cause instanceof RoadmapConflictError
          ? hasDraft.current ? "The roadmap changed elsewhere. Your draft is still here. Close this dialog to load the latest list before editing again." : "The roadmap changed elsewhere. Loading the latest list…"
          : message(cause));
      }
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function add(priority: RoadmapPriority) {
    const now = new Date().toISOString();
    setError("");
    setEditor({ isNew: true, files: [], uploaded: [], item: { id: crypto.randomUUID(), title: "", description: "", priority, status: "Not yet started", createdAt: now, updatedAt: now } });
  }

  async function cleanAttachments(attachments: RoadmapAttachment[]) {
    if (!attachments.length) return;
    try {
      // A response can be lost after a successful save. Never remove a file still
      // referenced by the latest saved list, even when closing a failed draft.
      const latest = await loadRoadmap();
      const used = new Set(latest.items.flatMap(item => (item.attachments ?? []).map(file => file.path)));
      const unused = attachments.filter(file => !used.has(file.path));
      if (unused.length) await removeRoadmapAttachments(unused);
    } catch {
      toast.error("The item is unchanged, but an unused attachment could not be removed from storage.");
    }
  }

  function closeEditor() {
    if (saving) return;
    const uploaded = editor?.uploaded ?? [];
    setEditor(null);
    void cleanAttachments(uploaded);
  }

  function attach(files: FileList | null) {
    if (!editor || !files) return;
    const incoming = Array.from(files);
    if (incoming.length + editor.files.length + (editor.item.attachments?.length ?? 0) > ROADMAP_MAX_ATTACHMENTS) { setError(`Attach up to ${ROADMAP_MAX_ATTACHMENTS} files per item.`); return; }
    try { incoming.forEach(file => resolveRoadmapAttachmentType(file)); }
    catch (cause) { setError(message(cause)); return; }
    if (incoming.some(file => !file.size || file.size > ROADMAP_MAX_ATTACHMENT_BYTES)) { setError("Each file must be non-empty and no larger than 8 MB."); return; }
    setError(""); setEditor({ ...editor, files: [...editor.files, ...incoming] });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editor || !document || !editor.item.title.trim()) return;
    let item = { ...editor.item, title: editor.item.title.trim(), updatedAt: new Date().toISOString() };
    const files = [...editor.files];
    const uploaded = [...editor.uploaded];
    const previousAttachments = document.items.find(old => old.id === item.id)?.attachments ?? [];
    const success = await persist(async () => {
      while (files.length) {
        const attachment = await uploadRoadmapAttachment(item.id, files[0]);
        files.shift(); uploaded.push(attachment);
        item = { ...item, attachments: [...(item.attachments ?? []), attachment] };
        setEditor({ ...editor, item, files: [...files], uploaded: [...uploaded] });
      }
      return editor.isNew ? [...document.items, item] : document.items.map(old => old.id === item.id ? item : old);
    });
    if (success) {
      setEditor(null);
      const retained = new Set((item.attachments ?? []).map(file => file.path));
      void cleanAttachments([...previousAttachments, ...uploaded].filter(file => !retained.has(file.path)));
    }
  }

  async function changeStatus(item: RoadmapItem, status: RoadmapStatus) {
    if (!document || item.status === status) return;
    await persist(document.items.map(old => old.id === item.id ? { ...old, status, updatedAt: new Date().toISOString() } : old));
  }

  async function remove() {
    if (!document || !deleting) return;
    if (await persist(document.items.filter(item => item.id !== deleting.id))) { setDeleting(null); void cleanAttachments(deleting.attachments ?? []); }
  }

  async function download() {
    if (!document) return;
    const now = new Date();
    const name = `chronicle-roadmap-${now.toISOString().slice(0, 10)}.md`;
    try {
      let selection;
      try {
        const request = requestKnowledgeSaveFile("markdown", now, { name, id: "chronicle-roadmap" });
        if (request) selection = await request;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!(cause instanceof DOMException) || cause.name !== "SecurityError") throw cause;
      }
      const blob = new Blob([exportRoadmapMarkdown(document)], { type: "text/markdown;charset=utf-8" });
      if (selection) {
        await writeKnowledgeFile(selection, blob);
        toast.success("Roadmap exported", { duration: 2500 });
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url; anchor.download = name;
      window.document.body.append(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.info("Download requested. This browser controls the save location.", { duration: 4000 });
    } catch (cause) { toast.error(`Could not export the roadmap: ${message(cause)}`); }
  }

  const disabled = loading || saving || !document || conflict;
  const updateEditor = (patch: Partial<RoadmapItem>) => setEditor(current => current ? { ...current, item: { ...current.item, ...patch } } : null);

  return <div className="chronicle-roadmap">
    <div className="roadmap-header">
      <AppShellHeader visible leftContent={<>
        <button type="button" aria-label="Back to Admin Panel" disabled={saving} onClick={() => navigate("/?tab=admin")} className="rounded-full p-2 transition-colors hover:bg-slate-100"><ChevronLeft size={20} strokeWidth={2.5} /></button>
        <h1 className="text-lg font-black uppercase tracking-tight text-[hsl(var(--ui-surface-2))]">Roadmap</h1>
      </>} rightContent={<>
        <SurfaceButton className="gap-2 px-5" disabled={!document || loading || saving} onClick={download}><Download size={15} />Markdown</SurfaceButton>
      </>} />
    </div>
    <main className="roadmap-main">
      <div className="roadmap-intro"><p>Issues, improvements, and ideas in one place.</p></div>
      {error && !editor && !deleting && <p role="alert" className="roadmap-error">{error}</p>}
      {loading && <p role="status" className="roadmap-loading">Loading roadmap…</p>}
      {!loading && document && sections.map(({ id, title, description, Icon }) => <section key={id} className={`roadmap-section roadmap-section--${id}`} aria-labelledby={`roadmap-${id}`}>
        <div className="roadmap-section-heading">
          <Icon className="roadmap-priority-icon" size={27} aria-hidden="true" />
          <div className="roadmap-section-label"><h2 id={`roadmap-${id}`}>{title}</h2><p>{description}</p></div>
          <SurfaceButton disabled={disabled} className="gap-2 px-4" onClick={() => add(id)} aria-label={`Add item to ${title}`}><Plus size={17} />Add item</SurfaceButton>
        </div>
        <div className="roadmap-items">
          {document.items.filter(item => item.priority === id).map(item => <article key={item.id} className="roadmap-item" data-roadmap-item-id={item.id} aria-labelledby={`roadmap-item-${item.id}`}>
            <h3 id={`roadmap-item-${item.id}`}>{item.title}</h3>
            <div className="roadmap-item-actions">
              <button type="button" disabled={disabled} aria-label={`Edit ${item.title}`} title="Edit item" onClick={() => { setError(""); setEditor({ item: { ...item }, isNew: false, files: [], uploaded: [] }); }}><Pencil size={17} /></button>
              <button type="button" disabled={disabled} aria-label={`Delete ${item.title}`} title="Delete item" onClick={() => { setError(""); setDeleting(item); }}><Trash2 size={17} /></button>
            </div>
            <div className="roadmap-item-status"><label htmlFor={`status-${item.id}`}>Status:</label><select id={`status-${item.id}`} aria-label={`Status for ${item.title}`} value={item.status} disabled={disabled} onChange={event => void changeStatus(item, event.target.value as RoadmapStatus)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></div>
            {item.description && <p className="roadmap-description">{item.description}</p>}
            {!!item.attachments?.length && <div className="roadmap-screenshots">{item.attachments.map(attachment => <Attachment key={attachment.id} attachment={attachment} />)}</div>}
          </article>)}
          {!document.items.some(item => item.priority === id) && <p className="roadmap-empty">No items yet.</p>}
        </div>
      </section>)}
    </main>
    <Dialog open={!!editor} onOpenChange={open => { if (!open) closeEditor(); }}>
      <DialogContentBare className="roadmap-dialog" onInteractOutside={event => event.preventDefault()}>
        <div className="roadmap-dialog-heading"><DialogTitle>{editor?.isNew ? "Add item" : "Edit item"}</DialogTitle><button type="button" disabled={saving} aria-label="Close editor" onClick={closeEditor}><X size={18} /></button></div>
        <DialogDescription className="sr-only">Describe the item, choose its section and status, then save it to the shared roadmap.</DialogDescription>
        {editor && <form onSubmit={event => void submit(event)} className="roadmap-editor">
          <label>Heading<input autoFocus required maxLength={200} value={editor.item.title} disabled={saving} onChange={event => updateEditor({ title: event.target.value })} /></label>
          <label>Description<textarea rows={6} maxLength={20_000} value={editor.item.description} disabled={saving} onChange={event => updateEditor({ description: event.target.value })} /></label>
          <div className="roadmap-attachments-editor">
            <label>Attach files<input type="file" multiple accept={ROADMAP_ATTACHMENT_ACCEPT} disabled={saving} onChange={event => { attach(event.target.files); event.target.value = ""; }} /></label>
            <p>Images, PDF, Word, Markdown, text, or HTML. Up to 5 files, 8 MB each.</p>
            {(editor.item.attachments ?? []).map(file => <div className="roadmap-attachment-row" key={file.id}><Attachment attachment={file} /><button type="button" disabled={saving} aria-label={`Remove ${file.name}`} onClick={() => updateEditor({ attachments: editor.item.attachments?.filter(old => old.id !== file.id) })}><X size={16} /></button></div>)}
            {editor.files.map((file, index) => <div className="roadmap-attachment-row" key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" disabled={saving} aria-label={`Remove ${file.name}`} onClick={() => setEditor({ ...editor, files: editor.files.filter((_, i) => i !== index) })}><X size={16} /></button></div>)}
          </div>
          <div className="roadmap-editor-options">
            <label>Section<select value={editor.item.priority} disabled={saving} onChange={event => updateEditor({ priority: event.target.value as RoadmapPriority })}>{sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>
            <label>Status<select value={editor.item.status} disabled={saving} onChange={event => updateEditor({ status: event.target.value as RoadmapStatus })}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
          </div>
          {error && <p role="alert" className="roadmap-error">{error}</p>}
          <div className="roadmap-dialog-actions"><SurfaceButton disabled={saving} className="px-5" onClick={closeEditor}>Cancel</SurfaceButton><SurfaceButton type="submit" className="px-5" disabled={saving || conflict || !editor.item.title.trim()}>{saving ? "Saving…" : "Save"}</SurfaceButton></div>
        </form>}
      </DialogContentBare>
    </Dialog>
    <Dialog open={!!deleting} onOpenChange={open => { if (!open && !saving) setDeleting(null); }}>
      <DialogContentBare className="roadmap-dialog roadmap-delete-dialog" onInteractOutside={event => event.preventDefault()}>
        <div className="roadmap-dialog-heading"><DialogTitle>Delete item?</DialogTitle></div>
        <div className="roadmap-editor"><DialogDescription className="roadmap-delete-description">Remove “{deleting?.title}” from the roadmap? This cannot be undone.</DialogDescription>
          {error && <p role="alert" className="roadmap-error">{error}</p>}
          <div className="roadmap-dialog-actions"><SurfaceButton disabled={saving} className="px-5" onClick={() => setDeleting(null)}>Cancel</SurfaceButton><SurfaceButton disabled={saving || conflict} className="px-5" onClick={() => void remove()}>{saving ? "Deleting…" : "Delete item"}</SurfaceButton></div>
        </div>
      </DialogContentBare>
    </Dialog>
  </div>;
}
