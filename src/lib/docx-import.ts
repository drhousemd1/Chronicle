import JSZip from "jszip";

interface DocxExtractionResult {
  text: string;
  warnings: string[];
}

export interface StoryImportFileTextResult extends DocxExtractionResult {
  isDocx: boolean;
}

export interface StoryImportLimits {
  maxPlainTextBytes: number;
  maxDocxBytes: number;
  maxCompressedBytes: number;
  maxDocumentXmlBytes: number;
  maxParagraphs: number;
  maxExtractedTextChars: number;
}

export type StoryImportLimitCode =
  | "text-file-too-large"
  | "docx-file-too-large"
  | "docx-xml-too-large"
  | "docx-too-many-paragraphs"
  | "docx-text-too-large";

export const STORY_IMPORT_LIMITS: StoryImportLimits = {
  maxPlainTextBytes: 2 * 1024 * 1024,
  maxDocxBytes: 8 * 1024 * 1024,
  maxCompressedBytes: 8 * 1024 * 1024,
  maxDocumentXmlBytes: 4 * 1024 * 1024,
  maxParagraphs: 5_000,
  maxExtractedTextChars: 500_000,
};

export class StoryImportLimitError extends Error {
  readonly code: StoryImportLimitCode;
  readonly userMessage: string;

  constructor(code: StoryImportLimitCode, message: string, userMessage = message) {
    super(message);
    this.name = "StoryImportLimitError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

export const isStoryImportLimitError = (error: unknown): error is StoryImportLimitError =>
  error instanceof StoryImportLimitError ||
  (typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "StoryImportLimitError");

const DOCUMENT_XML_PATH = "word/document.xml";

const normalizeWhitespace = (value: string): string =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const formatByteLimit = (bytes: number): string => {
  const megabytes = bytes / (1024 * 1024);
  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
};

const resolveLimits = (limits?: Partial<StoryImportLimits>): StoryImportLimits => ({
  ...STORY_IMPORT_LIMITS,
  ...limits,
});

const createImportLimitError = (
  code: StoryImportLimitCode,
  limits: StoryImportLimits,
): StoryImportLimitError => {
  switch (code) {
    case "text-file-too-large":
      return new StoryImportLimitError(
        code,
        `Plain-text imports are limited to ${formatByteLimit(limits.maxPlainTextBytes)}.`,
        `Import file is too large. Text, Markdown, HTML, and DOC fallback imports are limited to ${formatByteLimit(limits.maxPlainTextBytes)} to protect browser stability.`,
      );
    case "docx-file-too-large":
      return new StoryImportLimitError(
        code,
        `DOCX imports are limited to ${formatByteLimit(limits.maxDocxBytes)}.`,
        `Import file is too large. DOCX imports are limited to ${formatByteLimit(limits.maxDocxBytes)} to protect browser stability.`,
      );
    case "docx-xml-too-large":
      return new StoryImportLimitError(
        code,
        `DOCX document XML exceeds ${formatByteLimit(limits.maxDocumentXmlBytes)}.`,
        "This DOCX is too large or complex to import safely. Try a smaller document or export the story as plain text first.",
      );
    case "docx-too-many-paragraphs":
      return new StoryImportLimitError(
        code,
        `DOCX contains more than ${limits.maxParagraphs.toLocaleString()} paragraphs.`,
        "This DOCX has too many paragraphs to import safely. Try splitting it into smaller files.",
      );
    case "docx-text-too-large":
      return new StoryImportLimitError(
        code,
        `DOCX extracted text exceeds ${limits.maxExtractedTextChars.toLocaleString()} characters.`,
        "This DOCX extracts to too much text to import safely. Try splitting it into smaller files.",
      );
  }
};

const getKnownUncompressedSize = (file: JSZip.JSZipObject): number | undefined => {
  const maybeInternalFile = file as JSZip.JSZipObject & {
    _data?: { uncompressedSize?: number };
  };
  const size = maybeInternalFile._data?.uncompressedSize;
  return typeof size === "number" ? size : undefined;
};

const getElementsByLocalName = (root: Document | Element, localName: string): Element[] =>
  Array.from(root.getElementsByTagName("*")).filter((element) => element.localName === localName);

const collectDocxTextParts = (node: Node, parts: string[]) => {
  if (node.nodeType !== 1) return;

  const element = node as Element;
  switch (element.localName) {
    case "t":
      parts.push(element.textContent ?? "");
      return;
    case "tab":
      parts.push("\t");
      return;
    case "br":
      parts.push("\n");
      return;
    default:
      Array.from(element.childNodes).forEach((childNode) => {
        collectDocxTextParts(childNode, parts);
      });
  }
};

const isDocxImportFile = (file: Pick<File, "name" | "type">): boolean => {
  const fileNameLower = file.name.toLowerCase();
  const mimeTypeLower = file.type.toLowerCase();
  return (
    fileNameLower.endsWith(".docx") ||
    mimeTypeLower.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
  );
};

export async function extractDocxPlainText(
  buffer: ArrayBuffer,
  limitOverrides?: Partial<StoryImportLimits>,
): Promise<DocxExtractionResult> {
  const warnings: string[] = [];
  const limits = resolveLimits(limitOverrides);

  if (buffer.byteLength > limits.maxCompressedBytes) {
    throw createImportLimitError("docx-file-too-large", limits);
  }

  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file(DOCUMENT_XML_PATH);

  if (!documentFile) {
    throw new Error("Unsupported DOCX structure: word/document.xml was not found.");
  }

  const knownXmlBytes = getKnownUncompressedSize(documentFile);
  if (knownXmlBytes !== undefined && knownXmlBytes > limits.maxDocumentXmlBytes) {
    throw createImportLimitError("docx-xml-too-large", limits);
  }

  const xmlBytes = await documentFile.async("uint8array");
  if (xmlBytes.byteLength > limits.maxDocumentXmlBytes) {
    throw createImportLimitError("docx-xml-too-large", limits);
  }

  const xml = new TextDecoder("utf-8").decode(xmlBytes);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");

  if (parserError) {
    throw new Error("DOCX XML could not be parsed.");
  }

  const paragraphNodes = getElementsByLocalName(doc, "p");

  if (paragraphNodes.length > limits.maxParagraphs) {
    throw createImportLimitError("docx-too-many-paragraphs", limits);
  }

  const paragraphs: string[] = [];
  let extractedTextChars = 0;

  paragraphNodes.forEach((paragraph) => {
    const chunkParts: string[] = [];

    collectDocxTextParts(paragraph, chunkParts);

    const paragraphText = chunkParts.join("").split("\u000b").join("\n").trim();
    if (!paragraphText) return;

    extractedTextChars += paragraphText.length + (paragraphs.length > 0 ? 2 : 0);
    if (extractedTextChars > limits.maxExtractedTextChars) {
      throw createImportLimitError("docx-text-too-large", limits);
    }

    paragraphs.push(paragraphText);
  });

  if (!paragraphs.length) {
    warnings.push("DOCX file parsed but no paragraph text was detected.");
    return { text: "", warnings };
  }

  const text = normalizeWhitespace(paragraphs.join("\n\n"));

  if (!text) {
    warnings.push("DOCX file parsed but extracted text was empty after normalization.");
  }

  return { text, warnings };
}

export async function readStoryImportFileText(
  file: File,
  limitOverrides?: Partial<StoryImportLimits>,
): Promise<StoryImportFileTextResult> {
  const limits = resolveLimits(limitOverrides);
  const isDocx = isDocxImportFile(file);
  const warnings: string[] = [];

  const readPlainTextFile = async (): Promise<string> => {
    if (file.size > limits.maxPlainTextBytes) {
      throw createImportLimitError("text-file-too-large", limits);
    }
    return file.text();
  };

  if (!isDocx) {
    return {
      text: await readPlainTextFile(),
      warnings,
      isDocx,
    };
  }

  if (file.size > limits.maxDocxBytes) {
    throw createImportLimitError("docx-file-too-large", limits);
  }

  try {
    const extraction = await extractDocxPlainText(await file.arrayBuffer(), limits);
    warnings.push(...extraction.warnings);

    if (extraction.text.trim()) {
      return {
        text: extraction.text,
        warnings,
        isDocx,
      };
    }

    warnings.push("DOCX extraction returned empty text; falling back to plain text import.");
    return {
      text: await readPlainTextFile(),
      warnings,
      isDocx,
    };
  } catch (error) {
    if (isStoryImportLimitError(error)) {
      throw error;
    }

    warnings.push("DOCX extraction failed; fell back to raw text parsing.");
    if (import.meta.env.DEV) {
      console.debug("[story-import] DOCX extraction fallback:", error);
    }

    return {
      text: await readPlainTextFile(),
      warnings,
      isDocx,
    };
  }
}
