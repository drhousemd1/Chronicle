export type KnowledgeExportFormat = "html" | "markdown";

export type KnowledgeSaveHandle = {
  name: string;
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
    abort: () => Promise<void>;
  }>;
};

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    id: string;
    suggestedName: string;
    startIn: "desktop";
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<KnowledgeSaveHandle>;
};

export function knowledgeFileDetails(format: KnowledgeExportFormat, now: Date) {
  const extension = format === "html" ? "html" : "md";
  return {
    name: `chronicle-knowledge-base-${now.toISOString().replace(/[:.]/g, "-")}.${extension}`,
    mime: format === "html" ? "text/html" : "text/markdown",
    extension,
  };
}

// Must run directly inside the user's click, before lazy imports or document
// generation consume the browser's transient user activation.
export function requestKnowledgeSaveFile(format: KnowledgeExportFormat, now: Date, destination?: { name: string; id: string }) {
  const browser = window as SavePickerWindow;
  if (typeof browser.showSaveFilePicker !== "function") return null;
  const file = knowledgeFileDetails(format, now);
  return browser.showSaveFilePicker({
    id: destination?.id ?? "chronicle-knowledge-base",
    suggestedName: destination?.name ?? file.name,
    startIn: "desktop",
    types: [{ description: format === "html" ? "HTML" : "Markdown", accept: { [file.mime]: [`.${file.extension}`] } }],
  });
}

export async function writeKnowledgeFile(handle: KnowledgeSaveHandle, blob: Blob) {
  const writable = await handle.createWritable();
  try {
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    // Do not commit a partial export or replace the original error if cleanup fails.
    await writable.abort().catch(() => undefined);
    throw error;
  }
}
