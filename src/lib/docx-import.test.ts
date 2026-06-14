import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  extractDocxPlainText,
  readStoryImportFileText,
  StoryImportLimitError,
  STORY_IMPORT_LIMITS,
} from "@/lib/docx-import";

const makeDocxBuffer = async (bodyXml: string): Promise<ArrayBuffer> => {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}</w:body>
</w:document>`,
  );

  return zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
};

describe("extractDocxPlainText", () => {
  it("extracts normal DOCX paragraph text", async () => {
    const buffer = await makeDocxBuffer(`
      <w:p><w:r><w:t>Hello</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>world</w:t></w:r></w:p>
      <w:p><w:r><w:t>Second line</w:t></w:r></w:p>
    `);

    const result = await extractDocxPlainText(buffer);

    expect(result).toEqual({
      text: "Hello\tworld\n\nSecond line",
      warnings: [],
    });
  });

  it("rejects compressed DOCX payloads before ZIP parsing when they exceed the input cap", async () => {
    await expect(
      extractDocxPlainText(new ArrayBuffer(16), { maxCompressedBytes: 8 }),
    ).rejects.toMatchObject({
      code: "docx-file-too-large",
    });
  });

  it("rejects decompressed document XML that exceeds the XML cap", async () => {
    const buffer = await makeDocxBuffer(`<w:p><w:r><w:t>${"A".repeat(256)}</w:t></w:r></w:p>`);

    await expect(
      extractDocxPlainText(buffer, { maxDocumentXmlBytes: 128 }),
    ).rejects.toMatchObject({
      code: "docx-xml-too-large",
    });
  });

  it("rejects DOCX files with too many paragraphs", async () => {
    const buffer = await makeDocxBuffer(`
      <w:p><w:r><w:t>One</w:t></w:r></w:p>
      <w:p><w:r><w:t>Two</w:t></w:r></w:p>
      <w:p><w:r><w:t>Three</w:t></w:r></w:p>
    `);

    await expect(
      extractDocxPlainText(buffer, { maxParagraphs: 2 }),
    ).rejects.toMatchObject({
      code: "docx-too-many-paragraphs",
    });
  });

  it("rejects extracted text that exceeds the output cap", async () => {
    const buffer = await makeDocxBuffer(`<w:p><w:r><w:t>${"A".repeat(32)}</w:t></w:r></w:p>`);

    await expect(
      extractDocxPlainText(buffer, { maxExtractedTextChars: 16 }),
    ).rejects.toMatchObject({
      code: "docx-text-too-large",
    });
  });
});

describe("readStoryImportFileText", () => {
  it("rejects oversized plain-text imports before reading file contents", async () => {
    let textRead = false;
    const file = {
      name: "huge-story.txt",
      type: "text/plain",
      size: STORY_IMPORT_LIMITS.maxPlainTextBytes + 1,
      text: async () => {
        textRead = true;
        return "should not be read";
      },
    } as unknown as File;

    await expect(readStoryImportFileText(file)).rejects.toBeInstanceOf(StoryImportLimitError);
    expect(textRead).toBe(false);
  });

  it("rejects oversized DOCX imports before reading arrayBuffer or fallback text contents", async () => {
    let arrayBufferRead = false;
    let textRead = false;
    const file = {
      name: "huge-story.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: STORY_IMPORT_LIMITS.maxDocxBytes + 1,
      arrayBuffer: async () => {
        arrayBufferRead = true;
        return new ArrayBuffer(0);
      },
      text: async () => {
        textRead = true;
        return "should not be read";
      },
    } as unknown as File;

    await expect(readStoryImportFileText(file)).rejects.toBeInstanceOf(StoryImportLimitError);
    expect(arrayBufferRead).toBe(false);
    expect(textRead).toBe(false);
  });
});
