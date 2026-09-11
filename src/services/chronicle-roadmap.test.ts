import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import {
  exportRoadmapMarkdown,
  getRoadmapAttachmentUrl,
  loadRoadmap,
  removeRoadmapAttachments,
  resolveRoadmapAttachmentType,
  ROADMAP_ATTACHMENT_ACCEPT,
  ROADMAP_MAX_ATTACHMENT_BYTES,
  ROADMAP_MAX_ATTACHMENTS,
  RoadmapConflictError,
  saveRoadmap,
  uploadRoadmapAttachment,
  type RoadmapAttachment,
  type RoadmapDocument,
  type RoadmapItem,
} from './chronicle-roadmap';

const database = vi.hoisted(() => {
  type Query = {
    operation: 'read' | 'insert' | 'update';
    payload?: { setting_key?: string; setting_value: unknown; updated_at: string };
    filters: [string, string][];
  };
  const state = {
    row: null as unknown,
    error: null as { message: string; code?: string } | null,
    noWriteRows: false,
    overrideResponse: false,
    responseValue: null as unknown,
    queries: [] as Query[],
  };
  const from = vi.fn(() => {
    const query: Query = { operation: 'read', filters: [] };
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, value: string) => {
        query.filters.push([field, value]);
        return builder;
      }),
      insert: vi.fn((payload: NonNullable<Query['payload']>) => {
        query.operation = 'insert';
        query.payload = payload;
        return builder;
      }),
      update: vi.fn((payload: NonNullable<Query['payload']>) => {
        query.operation = 'update';
        query.payload = payload;
        return builder;
      }),
      maybeSingle: vi.fn(async () => {
        state.queries.push(query);
        if (state.error) return { data: null, error: state.error };
        if (query.operation === 'read') {
          return { data: state.row === null ? null : { setting_value: structuredClone(state.row) }, error: null };
        }
        if (state.noWriteRows) return { data: null, error: null };
        if (query.operation === 'insert' && state.row !== null) {
          return { data: null, error: { code: '23505', message: 'duplicate key' } };
        }
        if (query.operation === 'update') {
          const revision = query.filters.find(([field]) => field === 'setting_value->>revision')?.[1];
          if (state.row === null || (state.row as { revision: string }).revision !== revision) {
            return { data: null, error: null };
          }
        }
        state.row = structuredClone(query.payload?.setting_value);
        return {
          data: { setting_value: structuredClone(state.overrideResponse ? state.responseValue : state.row) },
          error: null,
        };
      }),
    };
    return builder;
  });
  return { state, from };
});

const storage = vi.hoisted(() => {
  const upload = vi.fn();
  const createSignedUrl = vi.fn();
  const remove = vi.fn();
  return { upload, createSignedUrl, remove, from: vi.fn(() => ({ upload, createSignedUrl, remove })) };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: database.from, storage: { from: storage.from } },
}));

const CREATED = '2026-09-10T20:00:00.000Z';
const UPDATED = '2026-09-10T21:00:00.000Z';

function item(overrides: Partial<RoadmapItem> = {}): RoadmapItem {
  return {
    id: 'item-1',
    title: 'Preserve unsaved changes',
    description: 'Keep the user’s exact description.\nIncluding its second line.',
    priority: 'critical',
    status: 'Not yet started',
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

function document(items = [item()]): RoadmapDocument {
  return { version: 1, revision: 'revision-1', items };
}

function attachment(overrides: Partial<RoadmapAttachment> = {}): RoadmapAttachment {
  const id = '12345678-1234-1234-1234-123456789012';
  return {
    id,
    name: 'Screenshot.png',
    path: `chronicle-roadmap/item-1/${id}.png`,
    contentType: 'image/png',
    size: 100,
    ...overrides,
  };
}

function imageFile(bytes: number[], type = 'image/png', name = 'Screenshot.png'): File {
  const content = new Uint8Array(bytes);
  // jsdom's File does not implement Blob.arrayBuffer; supply the browser method.
  return Object.assign(new File([content], name, { type }), {
    arrayBuffer: async () => content.buffer,
  });
}

function textFile(text: string, name: string, type = ''): File {
  return imageFile(Array.from(new TextEncoder().encode(text)), type, name);
}

async function docxFile(options: { missingDocument?: boolean; invalidXml?: boolean; macroType?: boolean; oversizedXml?: boolean } = {}): Promise<File> {
  const zip = new JSZip();
  const mainType = options.macroType ? 'application/vnd.ms-word.document.macroEnabled.main+xml'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml';
  zip.file('[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="${mainType}"/></Types>`);
  if (!options.missingDocument) {
    const xml = options.invalidXml ? '<w:document' : `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${options.oversizedXml ? 'x'.repeat(ROADMAP_MAX_ATTACHMENT_BYTES) : 'Original document wording'}</w:t></w:r></w:p></w:body></w:document>`;
    zip.file('word/document.xml', xml);
  }
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return imageFile(Array.from(bytes), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Original report.docx');
}

describe('Chronicle Roadmap persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(database.state, {
      row: null,
      error: null,
      noWriteRows: false,
      overrideResponse: false,
      responseValue: null,
      queries: [],
    });
  });

  it('loads a missing row as an unsaved empty list without inserting examples', async () => {
    expect(await loadRoadmap()).toEqual({ version: 1, revision: null, items: [] });
    expect(database.from).toHaveBeenCalledWith('app_settings');
    expect(database.state.queries).toEqual([
      { operation: 'read', filters: [['setting_key', 'chronicle_roadmap_v1']] },
    ]);
    expect(database.state.row).toBeNull();
  });

  it('creates the first saved document, validates its returned value, and reads it back', async () => {
    const empty = await loadRoadmap();
    const saved = await saveRoadmap(empty, [item()]);
    expect(saved.version).toBe(1);
    expect(saved.revision).toEqual(expect.any(String));
    expect(saved.items).toEqual([item()]);
    expect(await loadRoadmap()).toEqual(saved);
    expect(database.state.queries[1]).toMatchObject({
      operation: 'insert',
      payload: {
        setting_key: 'chronicle_roadmap_v1',
        setting_value: saved,
        updated_at: expect.any(String),
      },
    });
  });

  it('saves edited text, priority, and status under the expected revision without changing identity or created date', async () => {
    database.state.row = document();
    const previous = await loadRoadmap();
    const edited = item({ title: 'Revised title', description: 'New notes', priority: 'important', status: 'In progress', updatedAt: UPDATED });
    const saved = await saveRoadmap(previous, [edited]);
    expect(saved.revision).not.toEqual(previous.revision);
    expect(saved.items).toEqual([edited]);
    expect(previous).toEqual(document());
    expect(database.state.queries[1].filters).toEqual([
      ['setting_key', 'chronicle_roadmap_v1'],
      ['setting_value->>revision', 'revision-1'],
    ]);
    expect(await loadRoadmap()).toEqual(saved);
  });

  it('keeps completed items in their original section and deletes only explicitly removed members', async () => {
    database.state.row = document([item(), item({ id: 'item-2', priority: 'non-critical' })]);
    const previous = await loadRoadmap();
    const completed = await saveRoadmap(previous, [item({ status: 'Complete', updatedAt: UPDATED }), previous.items[1]]);
    expect(completed.items.map(({ id, priority, status }) => ({ id, priority, status }))).toEqual([
      { id: 'item-1', priority: 'critical', status: 'Complete' },
      { id: 'item-2', priority: 'non-critical', status: 'Not yet started' },
    ]);
    const afterDeletion = await saveRoadmap(completed, [completed.items[0]]);
    expect((await loadRoadmap()).items).toEqual([completed.items[0]]);
    expect(afterDeletion.items).toHaveLength(1);
  });

  it('rejects a stale writer without replacing a newer edit', async () => {
    database.state.row = document();
    const firstReader = await loadRoadmap();
    const secondReader = await loadRoadmap();
    const firstSave = await saveRoadmap(firstReader, [item({ status: 'In progress', updatedAt: UPDATED })]);
    await expect(saveRoadmap(secondReader, [item({ title: 'Stale replacement' })])).rejects.toBeInstanceOf(RoadmapConflictError);
    expect(await loadRoadmap()).toEqual(firstSave);
  });

  it('rejects concurrent first inserts instead of upserting over the first saved list', async () => {
    const firstReader = await loadRoadmap();
    const secondReader = await loadRoadmap();
    const firstSave = await saveRoadmap(firstReader, [item()]);
    await expect(saveRoadmap(secondReader, [item({ id: 'item-2' })])).rejects.toBeInstanceOf(RoadmapConflictError);
    expect(await loadRoadmap()).toEqual(firstSave);
  });

  it.each(['insert', 'update'])('does not report success for a zero-row %s response', async (operation) => {
    const previous: RoadmapDocument = operation === 'insert'
      ? { version: 1, revision: null, items: [] }
      : document();
    database.state.row = operation === 'insert' ? null : previous;
    database.state.noWriteRows = true;
    await expect(saveRoadmap(previous, [item()])).rejects.toBeInstanceOf(RoadmapConflictError);
  });

  it.each([
    {},
    { version: 2, revision: 'a', items: [] },
    { version: 1, revision: null, items: [] },
    { version: 1, revision: '', items: [] },
    { version: 1, revision: 'a', items: null },
    document([item({ title: ' ' })]),
    document([item({ status: 'Done' as RoadmapItem['status'] })]),
    document([item({ priority: 'urgent' as RoadmapItem['priority'] })]),
    document([item({ description: 2 as unknown as string })]),
    document([item({ createdAt: 'not a date' })]),
    document([item({ updatedAt: '2026-09-09T00:00:00.000Z' })]),
    document([item(), item()]),
  ])('rejects malformed stored content instead of replacing it with an empty list: %#', async (malformed) => {
    database.state.row = malformed;
    await expect(loadRoadmap()).rejects.toThrow();
    expect(database.state.row).toEqual(malformed);
    expect(database.state.queries.every((query) => query.operation === 'read')).toBe(true);
  });

  it('rejects malformed edited items and duplicate IDs before issuing a database request', async () => {
    await expect(saveRoadmap(document(), [item({ title: '' })])).rejects.toThrow();
    await expect(saveRoadmap(document(), [item(), item()])).rejects.toThrow('duplicate');
    await expect(saveRoadmap({ version: 1, revision: null, items: [item()] }, [item()])).rejects.toThrow('unsaved');
    expect(database.from).not.toHaveBeenCalled();
  });

  it('reports load and save failures without falling back to browser-local data', async () => {
    database.state.error = { code: '42501', message: 'Permission denied' };
    await expect(loadRoadmap()).rejects.toThrow('Permission denied');
    await expect(saveRoadmap(document(), [item()])).rejects.toThrow('Permission denied');
  });

  it('rejects a malformed or mismatched save read-back rather than claiming the edit was verified', async () => {
    database.state.row = document();
    database.state.overrideResponse = true;
    database.state.responseValue = { version: 1, revision: null, items: [] };
    await expect(saveRoadmap(document(), [item()])).rejects.toThrow('format');
    database.state.row = document();
    database.state.responseValue = document([item({ title: 'Unexpected rewritten content' })]);
    await expect(saveRoadmap(document(), [item()])).rejects.toThrow('did not match');
  });

  it('loads legacy items without inventing attachment metadata, then saves and reads back attached screenshots', async () => {
    database.state.row = document();
    const previous = await loadRoadmap();
    expect(previous.items[0]).not.toHaveProperty('attachments');
    const next = await saveRoadmap(previous, [item({ attachments: [attachment()], updatedAt: UPDATED })]);
    expect(next.items[0].attachments).toEqual([attachment()]);
    expect(await loadRoadmap()).toEqual(next);
    expect(database.state.queries.every((query) => query.operation !== 'insert')).toBe(true);
  });

  it.each([
    attachment({ path: 'chronicle-roadmap/other-item/12345678-1234-1234-1234-123456789012.png' }),
    attachment({ path: 'https://example.com/screenshot.png' }),
    attachment({ path: '../Screenshot.png' }),
    attachment({ path: 'chronicle-roadmap/item-1/12345678-1234-1234-1234-123456789012.svg' }),
    attachment({ id: 'different-id' }),
    attachment({ contentType: 'image/jpeg' }),
    attachment({ contentType: 'image/svg+xml' }),
    attachment({ contentType: 'constructor' }),
    attachment({ size: ROADMAP_MAX_ATTACHMENT_BYTES + 1 }),
    attachment({ size: 0 }),
    attachment({ size: 1.5 }),
    attachment({ name: '' }),
  ])('rejects malformed screenshot metadata on both load and save: %#', async (badAttachment) => {
    database.state.row = document([item({ attachments: [badAttachment] })]);
    await expect(loadRoadmap()).rejects.toThrow('attachment');
    database.state.queries = [];
    await expect(saveRoadmap(document(), [item({ attachments: [badAttachment] })])).rejects.toThrow('attachment');
    expect(database.state.queries).toHaveLength(0);
  });

  it('rejects duplicate attachments, malformed lists, and more than five screenshots per item', async () => {
    await expect(saveRoadmap(document(), [item({ attachments: [attachment(), attachment()] })])).rejects.toThrow('duplicate attachment');
    await expect(saveRoadmap(document(), [item({ attachments: null as unknown as RoadmapAttachment[] })])).rejects.toThrow('at most 5');
    const tooMany = Array.from({ length: ROADMAP_MAX_ATTACHMENTS + 1 }, (_, index) => {
      const id = `12345678-1234-1234-1234-${String(index).padStart(12, '0')}`;
      return attachment({ id, path: `chronicle-roadmap/item-1/${id}.png` });
    });
    database.state.row = document([item({ attachments: tooMany })]);
    await expect(loadRoadmap()).rejects.toThrow('at most 5');
    await expect(saveRoadmap(document(), [item({ attachments: tooMany })])).rejects.toThrow('at most 5');
  });
});

describe('Chronicle Roadmap private attachment storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://chronicle.example.test');
    storage.upload.mockImplementation(async (path: string) => ({ data: { path }, error: null }));
    storage.createSignedUrl.mockImplementation(async (path: string, _duration: number, options?: { download: string }) => {
      const url = new URL(`https://chronicle.example.test/storage/v1/object/sign/finance_documents/${path}?token=private-token`);
      if (options) url.searchParams.set('download', options.download);
      return { data: { signedUrl: url.href }, error: null };
    });
    storage.remove.mockImplementation(async (paths: string[]) => ({ data: paths.map((name) => ({ name })), error: null }));
  });

  it.each([
    ['image/png', 'png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ['image/jpeg', 'jpg', [255, 216, 255, 224]],
    ['image/webp', 'webp', [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]],
  ] as const)('uploads %s only into the isolated private Roadmap prefix without finance table records', async (type, extension, bytes) => {
    const file = imageFile([...bytes], type, `Original screenshot.${extension}`);
    const uploaded = await uploadRoadmapAttachment('item-1', file);
    expect(uploaded).toEqual({
      id: expect.any(String),
      name: file.name,
      path: `chronicle-roadmap/item-1/${uploaded.id}.${extension}`,
      contentType: type,
      size: bytes.length,
    });
    expect(storage.from).toHaveBeenCalledWith('finance_documents');
    expect(storage.upload).toHaveBeenCalledWith(uploaded.path, new Uint8Array(bytes), { contentType: type, upsert: false });
    expect(database.from).not.toHaveBeenCalled();
  });

  it('rejects SVG, oversized, empty, mismatched-content images and unsafe item paths before storage access', async () => {
    await expect(uploadRoadmapAttachment('item-1', imageFile([60, 115, 118, 103], 'image/svg+xml'))).rejects.toThrow('attachment');
    const oversized = imageFile([137, 80, 78, 71, 13, 10, 26, 10]);
    Object.defineProperty(oversized, 'size', { value: ROADMAP_MAX_ATTACHMENT_BYTES + 1 });
    await expect(uploadRoadmapAttachment('item-1', oversized)).rejects.toThrow('8 MiB');
    await expect(uploadRoadmapAttachment('item-1', imageFile([]))).rejects.toThrow('attachment');
    await expect(uploadRoadmapAttachment('item-1', imageFile([60, 115, 118, 103]))).rejects.toThrow('contents');
    await expect(uploadRoadmapAttachment('../outside', imageFile([137, 80, 78, 71, 13, 10, 26, 10]))).rejects.toThrow('ID');
    expect(storage.from).not.toHaveBeenCalled();
  });

  it('throws upload failures and unverified upload responses', async () => {
    const file = imageFile([137, 80, 78, 71, 13, 10, 26, 10]);
    storage.upload.mockResolvedValueOnce({ data: null, error: { message: 'Upload denied' } });
    await expect(uploadRoadmapAttachment('item-1', file)).rejects.toThrow('Upload denied');
    storage.upload.mockResolvedValueOnce({ data: { path: 'wrong-path' }, error: null });
    await expect(uploadRoadmapAttachment('item-1', file)).rejects.toThrow('verify');
  });

  it('uses a one-hour signed URL for the exact private screenshot path', async () => {
    const url = await getRoadmapAttachmentUrl(attachment());
    expect(storage.createSignedUrl).toHaveBeenCalledWith(attachment().path, 3600);
    expect(url).toBe(`https://chronicle.example.test/storage/v1/object/sign/finance_documents/${attachment().path}?token=private-token`);
  });

  it('rejects arbitrary paths, outbound URLs, missing links, and signed-link errors', async () => {
    await expect(getRoadmapAttachmentUrl(attachment({ path: 'other-prefix/private.png' }))).rejects.toThrow('path');
    expect(storage.createSignedUrl).not.toHaveBeenCalled();
    storage.createSignedUrl.mockResolvedValueOnce({ data: null, error: { message: 'Access denied' } });
    await expect(getRoadmapAttachmentUrl(attachment())).rejects.toThrow('Access denied');
    storage.createSignedUrl.mockResolvedValueOnce({ data: null, error: null });
    await expect(getRoadmapAttachmentUrl(attachment())).rejects.toThrow('access link');
    storage.createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'https://unrelated.example/image.png?token=x' }, error: null });
    await expect(getRoadmapAttachmentUrl(attachment())).rejects.toThrow('invalid attachment access link');
    storage.createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: `https://chronicle.example.test/storage/v1/object/sign/another_bucket/${attachment().path}?token=x` }, error: null });
    await expect(getRoadmapAttachmentUrl(attachment())).rejects.toThrow('invalid attachment access link');
  });

  it('removes only validated selected Roadmap objects, deduplicating paths and doing nothing for an empty list', async () => {
    await removeRoadmapAttachments([]);
    expect(storage.from).not.toHaveBeenCalled();
    await removeRoadmapAttachments([attachment(), attachment()]);
    expect(storage.from).toHaveBeenCalledWith('finance_documents');
    expect(storage.remove).toHaveBeenCalledWith([attachment().path]);
    expect(database.from).not.toHaveBeenCalled();
    await expect(removeRoadmapAttachments([attachment({ path: 'finance-receipt.pdf' })])).rejects.toThrow('path');
    expect(storage.remove).toHaveBeenCalledTimes(1);
  });

  it('throws storage removal failures and does not falsely confirm missing deletion receipts', async () => {
    storage.remove.mockResolvedValueOnce({ data: null, error: { message: 'Delete denied' } });
    await expect(removeRoadmapAttachments([attachment()])).rejects.toThrow('Delete denied');
    storage.remove.mockResolvedValueOnce({ data: [], error: null });
    await expect(removeRoadmapAttachments([attachment()])).rejects.toThrow('could not confirm');
  });

  it.each([
    ['Notes.md', '', 'md', 'text/markdown'],
    ['Notes.markdown', 'text/plain', 'md', 'text/markdown'],
    ['Reference.TXT', 'text/plain;charset=utf-8', 'txt', 'text/plain'],
    ['Mockup.htm', 'text/plain', 'html', 'text/html'],
    ['Mockup.html', 'text/html', 'html', 'text/html'],
    ['Research.pdf', 'application/octet-stream', 'pdf', 'application/pdf'],
    ['Document.docx', 'application/zip', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['Image.jpeg', '', 'jpg', 'image/jpeg'],
  ])('resolves recognized extension and compatible browser MIME for %s', (name, type, extension, contentType) => {
    expect(resolveRoadmapAttachmentType({ name, type })).toEqual({
      extension, contentType, kind: contentType.startsWith('image/') ? 'image' : 'document',
    });
    expect(ROADMAP_ATTACHMENT_ACCEPT).toContain(`.${name.split('.').pop()?.toLowerCase()}`);
  });

  it.each([
    ['notes.md', 'image/png'],
    ['report.pdf', 'text/html'],
    ['image.png', 'application/pdf'],
    ['renamed.docx', 'application/msword'],
    ['program.exe', 'application/octet-stream'],
    ['macro.docm', 'application/vnd.ms-word.document.macroEnabled.12'],
    ['vector.svg', 'image/svg+xml'],
  ])('rejects unsupported or obviously mismatched document types: %s', (name, type) => {
    expect(() => resolveRoadmapAttachmentType({ name, type })).toThrow('attachment');
  });

  it.each([
    ['Research.pdf', 'application/pdf', '%PDF-1.7\nOriginal PDF bytes\n%%EOF', 'pdf', 'application/pdf'],
    ['Notes.md', '', '# Original notes\nKeep **this formatting**.', 'md', 'text/markdown'],
    ['Notes.markdown', 'text/plain', '# Original notes\nSecond paragraph.', 'md', 'text/markdown'],
    ['Notes.txt', 'text/plain', 'Original plain text\nSecond line.', 'txt', 'text/plain'],
    ['Mockup.html', 'text/html', '<!doctype html><html><script>window.shouldNeverRun=true</script></html>', 'html', 'text/html'],
    ['Mockup.htm', '', '<html><body>Original mockup</body></html>', 'html', 'text/html'],
  ])('preserves original %s upload bytes while recording a canonical file type and forced-download link', async (name, type, contents, extension, contentType) => {
    const file = textFile(contents, name, type);
    const uploaded = await uploadRoadmapAttachment('item-1', file);
    expect(uploaded.name).toBe(name);
    expect(uploaded.contentType).toBe(contentType);
    expect(uploaded.path).toBe(`chronicle-roadmap/item-1/${uploaded.id}.${extension}`);
    expect(storage.upload).toHaveBeenCalledWith(uploaded.path, new Uint8Array(new TextEncoder().encode(contents)), { contentType, upsert: false });
    const uploadedBytes = storage.upload.mock.calls[0][1] as Uint8Array;
    expect(new TextDecoder().decode(uploadedBytes)).toBe(contents);
    const url = await getRoadmapAttachmentUrl(uploaded);
    expect(storage.createSignedUrl).toHaveBeenCalledWith(uploaded.path, 3600, { download: name });
    expect(new URL(url).searchParams.get('download')).toBe(name);
  });

  it('validates real DOCX ZIP Word contents and uploads the original file unchanged', async () => {
    const file = await docxFile();
    const uploaded = await uploadRoadmapAttachment('item-1', file);
    expect(uploaded.path).toMatch(/\.docx$/);
    expect(uploaded.contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(storage.upload.mock.calls[0][1]).toEqual(new Uint8Array(await file.arrayBuffer()));
    const originalZip = await JSZip.loadAsync(await file.arrayBuffer());
    expect(await originalZip.file('word/document.xml')?.async('string')).toContain('Original document wording');
    await getRoadmapAttachmentUrl(uploaded);
    expect(storage.createSignedUrl).toHaveBeenCalledWith(uploaded.path, 3600, { download: file.name });
  });

  it.each([
    { missingDocument: true },
    { invalidXml: true },
    { macroType: true },
    { oversizedXml: true },
  ])('rejects non-Word, invalid, macro-enabled, or unsafe expanded DOCX contents: %#', async (options) => {
    await expect(uploadRoadmapAttachment('item-1', await docxFile(options))).rejects.toThrow('DOCX');
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('rejects renamed PDFs/DOCX, blank text, invalid encoding, and binary text contents before uploading', async () => {
    await expect(uploadRoadmapAttachment('item-1', textFile('Not a PDF', 'Wrong.pdf', 'application/pdf'))).rejects.toThrow('contents');
    await expect(uploadRoadmapAttachment('item-1', textFile('Not a ZIP', 'Wrong.docx'))).rejects.toThrow('DOCX');
    await expect(uploadRoadmapAttachment('item-1', textFile(' \n\t', 'Empty.md'))).rejects.toThrow('nonempty');
    await expect(uploadRoadmapAttachment('item-1', imageFile([255, 255, 255], '', 'Invalid.txt'))).rejects.toThrow('valid UTF');
    await expect(uploadRoadmapAttachment('item-1', imageFile([65, 0, 66], '', 'Binary.txt'))).rejects.toThrow('binary');
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('accepts BOM-marked UTF-16 text without converting the stored original', async () => {
    const bytes = [255, 254, 72, 0, 105, 0];
    const file = imageFile(bytes, '', 'Windows notes.txt');
    const uploaded = await uploadRoadmapAttachment('item-1', file);
    expect(storage.upload).toHaveBeenCalledWith(uploaded.path, new Uint8Array(bytes), { contentType: 'text/plain', upsert: false });
  });

  it('refuses a document access link that lacks the forced-download parameter', async () => {
    const uploaded = await uploadRoadmapAttachment('item-1', textFile('<html>mockup</html>', 'Mockup.html'));
    storage.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: `https://chronicle.example.test/storage/v1/object/sign/finance_documents/${uploaded.path}?token=x` }, error: null,
    });
    await expect(getRoadmapAttachmentUrl(uploaded)).rejects.toThrow('invalid attachment access link');
  });

  it('persists a document alongside existing screenshots and preserves both through a status update', async () => {
    Object.assign(database.state, { row: document([item({ attachments: [attachment()] })]), error: null, noWriteRows: false, overrideResponse: false });
    const uploaded = await uploadRoadmapAttachment('item-1', textFile('# Saved issue context\nDetailed source text.', 'Issue notes.md', 'text/plain'));
    const previous = await loadRoadmap();
    const saved = await saveRoadmap(previous, [item({ attachments: [attachment(), uploaded], status: 'In progress', updatedAt: UPDATED })]);
    expect((await loadRoadmap()).items[0].attachments).toEqual([attachment(), uploaded]);
    expect(saved.items[0].status).toBe('In progress');
    const markdown = exportRoadmapMarkdown(saved, UPDATED);
    expect(markdown).toContain('Attachments (private; authorized Chronicle admin access is required):');
    expect(markdown).toContain(`finance_documents/${uploaded.path}`);
    expect(markdown).toContain('Issue notes.md');
    expect(markdown).not.toContain('token=');
  });
});

describe('Chronicle Roadmap Markdown export', () => {
  it('exports every section and status with item identities, dates, and descriptions in saved order', () => {
    const source = document([
      item(),
      item({ id: 'item-2', priority: 'important', status: 'In progress', title: 'Improve layout', updatedAt: UPDATED }),
      item({ id: 'item-3', priority: 'non-critical', status: 'Complete', title: 'A completed idea' }),
      item({ id: 'item-4', title: 'Second critical item' }),
    ]);
    const markdown = exportRoadmapMarkdown(source, UPDATED);
    expect(markdown).toContain(`# Chronicle Roadmap\n\nExported: ${UPDATED}`);
    expect(markdown.indexOf('## Critical')).toBeLessThan(markdown.indexOf('## Important'));
    expect(markdown.indexOf('## Important')).toBeLessThan(markdown.indexOf('## Non-critical'));
    for (const entry of source.items) {
      expect(markdown).toContain(`### ${entry.title}`);
      expect(markdown).toContain(`Status: ${entry.status}`);
      expect(markdown).toContain(`ID: ${entry.id}`);
      expect(markdown).toContain(`Created: ${entry.createdAt}`);
      expect(markdown).toContain(`Updated: ${entry.updatedAt}`);
      expect(markdown).toContain(entry.description);
    }
    expect(markdown.indexOf('### Preserve')).toBeLessThan(markdown.indexOf('### Second critical'));
    expect(markdown).not.toContain('No items.');
  });

  it('labels only genuinely empty sections and supports a completely empty unsaved list', () => {
    const partial = exportRoadmapMarkdown(document(), UPDATED);
    expect(partial.match(/No items\./g)).toHaveLength(2);
    const empty = exportRoadmapMarkdown({ version: 1, revision: null, items: [] }, UPDATED);
    expect(empty.match(/No items\./g)).toHaveLength(3);
  });

  it('escapes heading syntax without rewriting the description and rejects malformed export input', () => {
    const markdown = exportRoadmapMarkdown(document([item({ title: 'Fix [button] *label*\n# heading', description: '**Detailed notes**\nSecond line' })]), UPDATED);
    expect(markdown).toContain('### Fix \\[button\\] \\*label\\* \\# heading');
    expect(markdown).toContain('**Detailed notes**\nSecond line');
    expect(() => exportRoadmapMarkdown(document(), 'bad date')).toThrow('date');
    expect(() => exportRoadmapMarkdown(document([item({ title: '' })]), UPDATED)).toThrow();
  });

  it('exports private screenshot names and stable storage paths, never temporary access links', () => {
    const markdown = exportRoadmapMarkdown(document([item({ attachments: [attachment()] })]), UPDATED);
    expect(markdown).toContain('Attachments (private; authorized Chronicle admin access is required):');
    expect(markdown).toContain(`- Screenshot.png — \`finance_documents/${attachment().path}\``);
    expect(markdown).not.toContain('signedUrl');
    expect(markdown).not.toContain('token=');
    expect(markdown).not.toContain('https://');
  });
});
