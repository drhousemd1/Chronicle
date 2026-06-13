import { describe, expect, it } from 'vitest';
import {
  CONTENT_FILTER_NOTICE_TEXT,
  PROVIDER_ERROR_NOTICE_TEXT,
} from '@/services/llm';
import {
  buildContentFilterNoticeMessage,
  buildProviderErrorNoticeMessage,
} from './local-notices';

describe('local notice message builders', () => {
  it('builds content-filter notices with localNotice metadata and fallback text', () => {
    const notice = buildContentFilterNoticeMessage('', 3, 'night');

    expect(notice.role).toBe('assistant');
    expect(notice.text).toBe(CONTENT_FILTER_NOTICE_TEXT);
    expect(notice.localNotice).toBe('content_filter');
    expect(notice.day).toBe(3);
    expect(notice.timeOfDay).toBe('night');
    expect(notice.id).toBeTruthy();
    expect(notice.generationId).toBeTruthy();
    expect(typeof notice.createdAt).toBe('number');
  });

  it('normalizes provider-error notice text the same way the chat UI did before extraction', () => {
    expect(buildProviderErrorNoticeMessage('', 1, 'day').text).toBe(PROVIDER_ERROR_NOTICE_TEXT);
    expect(buildProviderErrorNoticeMessage('The AI provider failed while generating this turn. Please try again.').text).toBe(PROVIDER_ERROR_NOTICE_TEXT);
    expect(buildProviderErrorNoticeMessage('Chronicle: Already normalized.').text).toBe('Chronicle: Already normalized.');
    expect(buildProviderErrorNoticeMessage('timeout').text).toBe(`${PROVIDER_ERROR_NOTICE_TEXT} timeout`);
  });

  it('marks provider-error notices as local assistant messages', () => {
    const notice = buildProviderErrorNoticeMessage('timeout', 2, 'sunset');

    expect(notice.role).toBe('assistant');
    expect(notice.localNotice).toBe('provider_error');
    expect(notice.day).toBe(2);
    expect(notice.timeOfDay).toBe('sunset');
  });
});
