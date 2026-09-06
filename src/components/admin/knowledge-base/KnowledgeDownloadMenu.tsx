import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { ChronicleSurfaceButton } from "@/components/chronicle/ChronicleDarkUi";
import { CHRONICLE_SURFACE_BUTTON_CLASS } from "@/components/chronicle/chronicle-dark-ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { requestKnowledgeSaveFile, writeKnowledgeFile, type KnowledgeExportFormat } from "./knowledge-file-save";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function KnowledgeDownloadMenu() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("Preparing…");
  const inFlight = useRef(false);
  const [ready, setReady] = useState<{ name: string; url: string } | null>(null);
  const [downloadRequested, setDownloadRequested] = useState(false);

  useEffect(() => {
    return () => { if (ready) URL.revokeObjectURL(ready.url); };
  }, [ready]);

  async function download(format: KnowledgeExportFormat) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    const now = new Date();
    try {
      // Request the destination before the first await or lazy module load.
      let target;
      try {
        const selection = requestKnowledgeSaveFile(format, now);
        setProgress(selection ? "Choose location…" : "Preparing…");
        target = await selection;
      } catch (error) {
        const name = error && typeof error === "object" && "name" in error ? error.name : undefined;
        if (name === "AbortError") return;
        // An embedded frame or browser policy may expose but block the API.
        if (name !== "SecurityError") throw error;
      }
      setProgress("Preparing…");
      const { prepareKnowledgeDownload } = await import("@/data/chronicle-knowledge-base/knowledge-export");
      const file = await prepareKnowledgeDownload(format, now);
      if (target) {
        setProgress("Saving…");
        await writeKnowledgeFile(target, file.blob);
        toast.success("Knowledge Base saved", { description: target.name });
      } else {
        setDownloadRequested(false);
        setReady({ name: file.name, url: URL.createObjectURL(file.blob) });
      }
    } catch (error) {
      toast.error("Could not download the Knowledge Base", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="chronicle-knowledge-header-actions">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ChronicleSurfaceButton
            className="chronicle-knowledge-download-button px-6 gap-2"
            disabled={busy}
            aria-busy={busy}
            aria-label={busy ? "Preparing Knowledge Base download" : "Download Knowledge Base"}
          >
            <Download size={14} aria-hidden="true" />
            {busy ? progress : "Download"}
            <ChevronDown size={14} aria-hidden="true" />
          </ChronicleSurfaceButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => void download("html")}>
              HTML
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void download("markdown")}>
              Markdown
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={!!ready} onOpenChange={open => { if (!open) setReady(null); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>Save Knowledge Base</DialogTitle>
            <DialogDescription>
              This browser cannot open a system Save As dialog. Download uses its download settings.
              To choose Desktop or another folder in a native dialog, open this page in Chrome or Edge.
            </DialogDescription>
          </DialogHeader>
          {ready && <>
            <p className="break-all text-sm">{ready.name}</p>
            <div className="flex flex-wrap gap-3">
              <a className={`${CHRONICLE_SURFACE_BUTTON_CLASS} px-5`} href={ready.url} download={ready.name}
                onClick={() => setDownloadRequested(true)}>Download file</a>
              <a className={`${CHRONICLE_SURFACE_BUTTON_CLASS} px-5`} href={ready.url} target="_blank" rel="noopener noreferrer">Open file</a>
            </div>
            {downloadRequested && <p role="status" className="text-sm text-muted-foreground">
              Download requested. If no file appears, this browser may be blocking downloads. The file remains available here; Chronicle cannot confirm a saved location.
            </p>}
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
