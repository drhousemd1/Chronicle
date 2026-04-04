import JSZip from "jszip";

interface DocxExtractionResult {
  text: string;
  warnings: string[];
}

const DOCUMENT_XML_PATH = "word/document.xml";

const normalizeWhitespace = (value: string): string =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export async function extractDocxPlainText(buffer: ArrayBuffer): Promise<DocxExtractionResult> {
  const warnings: string[] = [];

  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file(DOCUMENT_XML_PATH);

  if (!documentFile) {
    throw new Error("Unsupported DOCX structure: word/document.xml was not found.");
  }

  const xml = await documentFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");

  if (parserError) {
    throw new Error("DOCX XML could not be parsed.");
  }

  const paragraphNodes = Array.from(doc.getElementsByTagName("w:p"));

  const paragraphs = paragraphNodes
    .map((paragraph) => {
      const chunkParts: string[] = [];

      paragraph.querySelectorAll("w:t").forEach((node) => {
        chunkParts.push(node.textContent ?? "");
      });

      // Preserve simple manual separators from DOCX runs.
      paragraph.querySelectorAll("w:tab").forEach(() => {
        chunkParts.push("\t");
      });
      paragraph.querySelectorAll("w:br").forEach(() => {
        chunkParts.push("\n");
      });

      return chunkParts.join("").split("\u000b").join("\n").trim();
    })
    .filter(Boolean);

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
