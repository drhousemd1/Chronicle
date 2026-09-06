// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { knowledgeFileDetails, requestKnowledgeSaveFile, writeKnowledgeFile } from "./knowledge-file-save";

afterEach(() => vi.unstubAllGlobals());

describe("Knowledge Base native file saving", () => {
  it.each([['html', 'html', 'text/html'], ['markdown', 'md', 'text/markdown']] as const)("passes a safe %s filename and type to the native chooser", (format, extension, mime) => {
    const now = new Date("2026-09-05T12:00:00.000Z");
    const picker = vi.fn().mockResolvedValue({});
    vi.stubGlobal("showSaveFilePicker", picker);
    requestKnowledgeSaveFile(format, now);
    expect(picker).toHaveBeenCalledWith({
      id: "chronicle-knowledge-base", startIn: "desktop",
      suggestedName: `chronicle-knowledge-base-2026-09-05T12-00-00-000Z.${extension}`,
      types: [{ description: format === "html" ? "HTML" : "Markdown", accept: { [mime]: [`.${extension}`] } }],
    });
    expect(knowledgeFileDetails(format, now).mime).toBe(mime);
  });

  it("does not report write completion until the stream has closed", async () => {
    let finish!: () => void;
    const close = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const write = vi.fn().mockResolvedValue(undefined);
    const blob = new Blob(["complete contents"]);
    const saved = vi.fn();
    const operation = writeKnowledgeFile({ name: "file.html", createWritable: async () => ({ write, close, abort: vi.fn() }) }, blob).then(saved);
    await vi.waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(write).toHaveBeenCalledWith(blob);
    expect(saved).not.toHaveBeenCalled();
    finish();
    await operation;
    expect(saved).toHaveBeenCalledOnce();
  });

  it("preserves the failure if closing and aborting both fail", async () => {
    const abort = vi.fn().mockRejectedValue(new Error("Cleanup failed"));
    const handle = { name: "file", createWritable: async () => ({ write: vi.fn(), close: vi.fn().mockRejectedValue(new Error("Save failed")), abort }) };
    await expect(writeKnowledgeFile(handle, new Blob())).rejects.toThrow("Save failed");
    expect(abort).toHaveBeenCalledOnce();
  });
});
