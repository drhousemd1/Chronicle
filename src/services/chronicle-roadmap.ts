import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import JSZip from 'jszip';

export type RoadmapPriority = 'critical' | 'important' | 'non-critical';
export type RoadmapStatus = 'Not yet started' | 'In progress' | 'Complete';

export interface RoadmapAttachment {
  id: string;
  name: string;
  path: string;
  contentType: string;
  size: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  priority: RoadmapPriority;
  status: RoadmapStatus;
  createdAt: string;
  updatedAt: string;
  attachments?: RoadmapAttachment[];
}

export interface RoadmapDocument {
  version: 1;
  revision: string | null;
  items: RoadmapItem[];
}

const SETTING_KEY = 'chronicle_roadmap_v1';
const ATTACHMENT_BUCKET = 'finance_documents';
const ATTACHMENT_PREFIX = 'chronicle-roadmap';
export const ROADMAP_MAX_ATTACHMENTS = 5;
export const ROADMAP_MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
export const ROADMAP_ATTACHMENT_ACCEPT = '.png,.jpg,.jpeg,.webp,.pdf,.docx,.md,.markdown,.txt,.html,.htm';
const SAFE_ITEM_ID = /^[a-zA-Z0-9_-]{1,128}$/;
const ATTACHMENT_PATH = /^chronicle-roadmap\/([a-zA-Z0-9_-]{1,128})\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.(png|jpg|webp|pdf|docx|md|txt|html)$/;
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ATTACHMENT_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  [DOCX_TYPE]: 'docx',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'text/html': 'html',
};
const FILE_TYPES: Record<string, { extension: string; contentType: string; compatibleTypes: string[] }> = {
  png: { extension: 'png', contentType: 'image/png', compatibleTypes: ['image/png'] },
  jpg: { extension: 'jpg', contentType: 'image/jpeg', compatibleTypes: ['image/jpeg', 'image/jpg'] },
  jpeg: { extension: 'jpg', contentType: 'image/jpeg', compatibleTypes: ['image/jpeg', 'image/jpg'] },
  webp: { extension: 'webp', contentType: 'image/webp', compatibleTypes: ['image/webp'] },
  pdf: { extension: 'pdf', contentType: 'application/pdf', compatibleTypes: ['application/pdf', 'application/x-pdf'] },
  docx: { extension: 'docx', contentType: DOCX_TYPE, compatibleTypes: [DOCX_TYPE, 'application/zip', 'application/x-zip-compressed'] },
  md: { extension: 'md', contentType: 'text/markdown', compatibleTypes: ['text/markdown', 'text/x-markdown', 'text/plain'] },
  markdown: { extension: 'md', contentType: 'text/markdown', compatibleTypes: ['text/markdown', 'text/x-markdown', 'text/plain'] },
  txt: { extension: 'txt', contentType: 'text/plain', compatibleTypes: ['text/plain'] },
  html: { extension: 'html', contentType: 'text/html', compatibleTypes: ['text/html', 'application/xhtml+xml', 'text/plain'] },
  htm: { extension: 'html', contentType: 'text/html', compatibleTypes: ['text/html', 'application/xhtml+xml', 'text/plain'] },
};

export function resolveRoadmapAttachmentType(file: Pick<File, 'name' | 'type'>): {
  extension: string;
  contentType: string;
  kind: 'image' | 'document';
} {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const format = Object.prototype.hasOwnProperty.call(FILE_TYPES, extension) ? FILE_TYPES[extension] : undefined;
  if (!format || !file.name.includes('.')) {
    throw new Error('Unsupported attachment. Choose PNG, JPEG, WebP, PDF, DOCX, Markdown, TXT, or HTML.');
  }
  const mime = file.type.split(';')[0].trim().toLowerCase();
  if (!['', 'application/octet-stream', 'binary/octet-stream'].includes(mime) && !format.compatibleTypes.includes(mime)) {
    throw new Error('The attachment file extension and reported file type do not match.');
  }
  return {
    extension: format.extension,
    contentType: format.contentType,
    kind: format.contentType.startsWith('image/') ? 'image' : 'document',
  };
}
const PRIORITIES: readonly RoadmapPriority[] = ['critical', 'important', 'non-critical'];
const STATUSES: readonly RoadmapStatus[] = ['Not yet started', 'In progress', 'Complete'];
const SECTION_LABELS: Record<RoadmapPriority, string> = {
  critical: 'Critical',
  important: 'Important',
  'non-critical': 'Non-critical',
};

export class RoadmapConflictError extends Error {
  constructor() {
    super('The Roadmap changed elsewhere or is no longer writable. Reload it before saving again; your edit has not been saved.');
    this.name = 'RoadmapConflictError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function parseAttachment(value: unknown, itemId?: string): RoadmapAttachment {
  if (!isRecord(value) || typeof value.id !== 'string' ||
      typeof value.name !== 'string' || !value.name.trim() || value.name.length > 255 ||
      typeof value.path !== 'string' || typeof value.contentType !== 'string' ||
      !Object.prototype.hasOwnProperty.call(ATTACHMENT_EXTENSIONS, value.contentType) ||
      !Number.isSafeInteger(value.size) || (value.size as number) <= 0 ||
      (value.size as number) > ROADMAP_MAX_ATTACHMENT_BYTES) {
    throw new Error('A Roadmap attachment is invalid. Use PNG, JPEG, WebP, PDF, DOCX, Markdown, TXT, or HTML files up to 8 MiB each.');
  }
  const match = ATTACHMENT_PATH.exec(value.path);
  if (!match || (itemId !== undefined && match[1] !== itemId) || match[2] !== value.id ||
      match[3] !== ATTACHMENT_EXTENSIONS[value.contentType]) {
    throw new Error('A Roadmap attachment has an invalid storage path or item identity.');
  }
  return {
    id: value.id,
    name: value.name,
    path: value.path,
    contentType: value.contentType,
    size: value.size as number,
  };
}

function parseAttachments(value: unknown, itemId: string): RoadmapAttachment[] {
  if (!Array.isArray(value) || value.length > ROADMAP_MAX_ATTACHMENTS) {
    throw new Error('Each Roadmap item can have at most 5 attachments.');
  }
  const parsed = value.map((attachment) => parseAttachment(attachment, itemId));
  if (new Set(parsed.map(({ id }) => id)).size !== parsed.length) {
    throw new Error('The Roadmap item contains duplicate attachment IDs.');
  }
  return parsed;
}

function parseItems(value: unknown): RoadmapItem[] {
  if (!Array.isArray(value)) throw new Error('The Roadmap item list is invalid.');
  const ids = new Set<string>();
  return value.map((item): RoadmapItem => {
    if (!isRecord(item) ||
        typeof item.id !== 'string' || !item.id.trim() ||
        typeof item.title !== 'string' || !item.title.trim() ||
        typeof item.description !== 'string' ||
        !PRIORITIES.includes(item.priority as RoadmapPriority) ||
        !STATUSES.includes(item.status as RoadmapStatus) ||
        !isTimestamp(item.createdAt) || !isTimestamp(item.updatedAt) ||
        Date.parse(item.updatedAt) < Date.parse(item.createdAt)) {
      throw new Error('A Roadmap item has an invalid title, description, priority, status, identity, or date.');
    }
    if (ids.has(item.id)) throw new Error('The Roadmap contains duplicate item IDs.');
    ids.add(item.id);
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      priority: item.priority as RoadmapPriority,
      status: item.status as RoadmapStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      ...(item.attachments === undefined ? {} : { attachments: parseAttachments(item.attachments, item.id) }),
    };
  });
}

function parseDocument(value: unknown, allowMissing = false): RoadmapDocument {
  if (!isRecord(value) || value.version !== 1 ||
      !(typeof value.revision === 'string' && value.revision.trim()) &&
      !(allowMissing && value.revision === null)) {
    throw new Error('The saved Roadmap format is invalid. It has not been replaced.');
  }
  const items = parseItems(value.items);
  if (value.revision === null && items.length !== 0) {
    throw new Error('An unsaved Roadmap cannot contain existing items.');
  }
  return { version: 1, revision: value.revision as string | null, items };
}

function storageError(error: { message: string }): Error {
  return new Error(`Chronicle could not save or load the Roadmap: ${error.message}`);
}

export async function loadRoadmap(): Promise<RoadmapDocument> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', SETTING_KEY)
    .maybeSingle();
  if (error) throw storageError(error);
  return data === null
    ? { version: 1, revision: null, items: [] }
    : parseDocument(data.setting_value);
}

export async function saveRoadmap(
  previous: RoadmapDocument,
  items: RoadmapItem[],
): Promise<RoadmapDocument> {
  const existing = parseDocument(previous, true);
  const next: RoadmapDocument = {
    version: 1,
    revision: crypto.randomUUID(),
    items: parseItems(items),
  };
  const payload = { setting_value: next as unknown as Json, updated_at: new Date().toISOString() };

  // The revision filter makes a stale writer fail instead of replacing newer edits.
  // A missing row uses INSERT, so a concurrent first save fails on the unique key.
  const result = existing.revision === null
    ? await supabase.from('app_settings')
      .insert({ setting_key: SETTING_KEY, ...payload })
      .select('setting_value')
      .maybeSingle()
    : await supabase.from('app_settings')
      .update(payload)
      .eq('setting_key', SETTING_KEY)
      .eq('setting_value->>revision', existing.revision)
      .select('setting_value')
      .maybeSingle();

  if (result.error?.code === '23505') throw new RoadmapConflictError();
  if (result.error) throw storageError(result.error);
  if (result.data === null) throw new RoadmapConflictError();
  const saved = parseDocument(result.data.setting_value);
  if (JSON.stringify(saved) !== JSON.stringify(next)) {
    throw new Error('The Roadmap save response did not match the submitted changes. Reload to check the saved list.');
  }
  return saved;
}

function decodeAttachmentText(bytes: Uint8Array): string {
  const encoding = bytes[0] === 255 && bytes[1] === 254 ? 'utf-16le'
    : bytes[0] === 254 && bytes[1] === 255 ? 'utf-16be' : 'utf-8';
  let text: string;
  try {
    text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Text attachments must contain valid UTF-8 or UTF-16 text.');
  }
  if (!text.trim()) throw new Error('Text attachments must contain nonempty text, not binary contents.');
  for (const character of text) {
    const code = character.charCodeAt(0);
    if ((code < 32 && ![9, 10, 13].includes(code)) || code === 127) {
      throw new Error('Text attachments must contain nonempty text, not binary contents.');
    }
  }
  return text;
}

async function validateDocx(bytes: Uint8Array): Promise<void> {
  if (![80, 75, 3, 4].every((byte, index) => bytes[index] === byte)) {
    throw new Error('The DOCX attachment is not a valid Word ZIP document.');
  }
  const zip = await JSZip.loadAsync(bytes);
  const readXml = async (path: string): Promise<Document> => {
    const entry = zip.file(path);
    if (!entry) throw new Error(`The DOCX attachment is missing ${path}.`);
    // Inspect only the two Word descriptors, never expand embedded images or other archive files.
    const size = (entry as typeof entry & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (size === undefined || size > ROADMAP_MAX_ATTACHMENT_BYTES) {
      throw new Error('The DOCX attachment has unsupported or oversized document contents.');
    }
    const xmlBytes = await entry.async('uint8array');
    if (xmlBytes.length > ROADMAP_MAX_ATTACHMENT_BYTES) throw new Error('The DOCX document contents exceed 8 MiB.');
    const xml = new DOMParser().parseFromString(decodeAttachmentText(xmlBytes), 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('The DOCX attachment contains invalid Word XML.');
    return xml;
  };
  const documentXml = await readXml('word/document.xml');
  const contentTypes = await readXml('[Content_Types].xml');
  const wordNamespaces = [
    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'http://purl.oclc.org/ooxml/wordprocessingml/main',
  ];
  const mainType = `${DOCX_TYPE}.main+xml`;
  const declaresWord = Array.from(contentTypes.getElementsByTagNameNS('*', 'Override')).some((node) =>
    node.getAttribute('PartName') === '/word/document.xml' && node.getAttribute('ContentType') === mainType);
  if (documentXml.documentElement.localName !== 'document' ||
      !wordNamespaces.includes(documentXml.documentElement.namespaceURI ?? '') ||
      !documentXml.getElementsByTagNameNS(documentXml.documentElement.namespaceURI, 'body').length ||
      !declaresWord || zip.file(/vbaProject\.bin$/i).length) {
    throw new Error('The DOCX attachment does not contain a supported Word document.');
  }
}

async function validateAttachmentContents(bytes: Uint8Array, contentType: string): Promise<void> {
  if (contentType === DOCX_TYPE) return validateDocx(bytes);
  if (contentType.startsWith('text/')) {
    decodeAttachmentText(bytes);
    return;
  }
  const hasExpectedSignature = contentType === 'image/png'
    ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
    : contentType === 'image/jpeg'
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : contentType === 'application/pdf'
        ? [37, 80, 68, 70, 45].every((byte, index) => bytes[index] === byte)
      : bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 &&
        bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
  if (!hasExpectedSignature) throw new Error('The attachment contents do not match the selected file type.');
}

export async function uploadRoadmapAttachment(itemId: string, file: File): Promise<RoadmapAttachment> {
  if (!SAFE_ITEM_ID.test(itemId)) throw new Error('The Roadmap item ID is invalid.');
  const format = resolveRoadmapAttachmentType(file);
  const id = crypto.randomUUID();
  const attachment = parseAttachment({
    id,
    name: file.name,
    path: `${ATTACHMENT_PREFIX}/${itemId}/${id}.${format.extension}`,
    contentType: format.contentType,
    size: file.size,
  }, itemId);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await validateAttachmentContents(bytes, format.contentType);
  // Supabase uses a Blob's own MIME instead of the contentType option. Upload the
  // unchanged bytes so files with empty/generic browser MIME get the validated type.
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET)
    .upload(attachment.path, bytes, { contentType: format.contentType, upsert: false });
  if (error) throw new Error(`Chronicle could not upload the attachment: ${error.message}`);
  if (data?.path !== attachment.path) throw new Error('Chronicle could not verify the attachment upload.');
  return attachment;
}

export async function getRoadmapAttachmentUrl(attachment: RoadmapAttachment): Promise<string> {
  const validated = parseAttachment(attachment);
  const image = validated.contentType.startsWith('image/');
  const bucket = supabase.storage.from(ATTACHMENT_BUCKET);
  const { data, error } = image
    ? await bucket.createSignedUrl(validated.path, 3600)
    : await bucket.createSignedUrl(validated.path, 3600, { download: validated.name });
  if (error) throw new Error(`Chronicle could not open the attachment: ${error.message}`);
  if (!data?.signedUrl) throw new Error('Chronicle did not receive an attachment access link.');
  const url = new URL(data.signedUrl);
  const expectedOrigin = new URL(import.meta.env.VITE_SUPABASE_URL).origin;
  if (url.origin !== expectedOrigin ||
      url.pathname !== `/storage/v1/object/sign/${ATTACHMENT_BUCKET}/${validated.path}` ||
      !url.searchParams.get('token') || (!image && !url.searchParams.has('download'))) {
    throw new Error('Chronicle received an invalid attachment access link.');
  }
  return url.href;
}

export async function removeRoadmapAttachments(attachments: RoadmapAttachment[]): Promise<void> {
  const paths = [...new Set(attachments.map((attachment) => parseAttachment(attachment).path))];
  if (paths.length === 0) return;
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
  if (error) throw new Error(`Chronicle could not remove the attachments: ${error.message}`);
  if (!data || paths.some((path) => !data.some((removed) => removed.name === path))) {
    throw new Error('Chronicle could not confirm that all selected attachments were removed.');
  }
}

function inlineMarkdown(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/[\\`*_{}[\]<>#]/g, '\\$&');
}

export function exportRoadmapMarkdown(
  document: RoadmapDocument,
  exportedAt = new Date().toISOString(),
): string {
  const roadmap = parseDocument(document, true);
  if (!isTimestamp(exportedAt)) throw new Error('The Roadmap export date is invalid.');
  const lines = ['# Chronicle Roadmap', '', `Exported: ${exportedAt}`, ''];
  for (const priority of PRIORITIES) {
    lines.push(`## ${SECTION_LABELS[priority]}`, '');
    const items = roadmap.items.filter((item) => item.priority === priority);
    if (items.length === 0) lines.push('No items.', '');
    for (const item of items) {
      lines.push(
        `### ${inlineMarkdown(item.title)}`,
        '',
        `Status: ${item.status}`,
        '',
        `ID: ${inlineMarkdown(item.id)}`,
        '',
        `Created: ${item.createdAt}  `,
        `Updated: ${item.updatedAt}`,
        '',
      );
      if (item.description) lines.push(item.description, '');
      if (item.attachments?.length) {
        lines.push('Attachments (private; authorized Chronicle admin access is required):', '');
        for (const attachment of item.attachments) {
          lines.push(`- ${inlineMarkdown(attachment.name)} — \`${ATTACHMENT_BUCKET}/${attachment.path}\``);
        }
        lines.push('');
      }
    }
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
