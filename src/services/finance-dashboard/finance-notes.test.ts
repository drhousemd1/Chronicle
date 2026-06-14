import { describe, expect, it } from 'vitest';
import {
  buildAdminOverviewNotePayload,
  sanitizeFinanceNoteHtml,
} from './finance-notes';

describe('finance admin notes sanitizer', () => {
  it('strips executable markup while preserving basic rich text', () => {
    const sanitized = sanitizeFinanceNoteHtml(`
      <div onclick="alert('x')">
        <strong>Revenue note</strong>
        <img src=x onerror="alert('owned')">
        <a href="javascript:alert('owned')" target="_blank">bad link</a>
        <a href="https://example.com/report" target="_blank" onclick="steal()">safe link</a>
        <script>alert('owned')</script>
        <input type="checkbox" checked onmouseover="steal()">
      </div>
    `);

    expect(sanitized).toContain('<strong>Revenue note</strong>');
    expect(sanitized).toContain('<a href="https://example.com/report" target="_blank" rel="noopener noreferrer">safe link</a>');
    expect(sanitized).toContain('<input type="checkbox" checked="">');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('onmouseover');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain("alert('owned')");
  });

  it('builds storage payloads from sanitized html and sanitized plain text', () => {
    const payload = buildAdminOverviewNotePayload(
      `<p>Clean <em>note</em></p><svg><script>alert('owned')</script></svg>`,
      'admin-user-id',
    );

    expect(payload).toMatchObject({
      note_key: 'overview_notes',
      author_id: 'admin-user-id',
      updated_by: 'admin-user-id',
      content_html: '<p>Clean <em>note</em></p>',
      content: 'Clean note',
    });
  });
});
