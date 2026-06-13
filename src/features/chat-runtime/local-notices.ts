import type { Message, TimeOfDay } from '@/types';
import {
  CONTENT_FILTER_NOTICE_TEXT,
  PROVIDER_ERROR_NOTICE_TEXT,
} from '@/services/llm';
import { now, uuid } from '@/utils';

export function buildContentFilterNoticeMessage(
  message: string,
  day?: number,
  timeOfDay?: TimeOfDay,
): Message {
  return {
    id: uuid(),
    generationId: uuid(),
    role: 'assistant',
    text: message || CONTENT_FILTER_NOTICE_TEXT,
    localNotice: 'content_filter',
    day,
    timeOfDay,
    createdAt: now(),
  };
}

export function buildProviderErrorNoticeMessage(
  message: string,
  day?: number,
  timeOfDay?: TimeOfDay,
): Message {
  const trimmedMessage = message.trim();
  const unprefixedStandardNotice = PROVIDER_ERROR_NOTICE_TEXT.replace(/^Chronicle:\s*/, '');
  const normalizedMessage = !trimmedMessage || trimmedMessage === unprefixedStandardNotice
    ? PROVIDER_ERROR_NOTICE_TEXT
    : trimmedMessage.startsWith('Chronicle:')
      ? trimmedMessage
      : `${PROVIDER_ERROR_NOTICE_TEXT} ${trimmedMessage}`.trim();

  return {
    id: uuid(),
    generationId: uuid(),
    role: 'assistant',
    text: normalizedMessage || PROVIDER_ERROR_NOTICE_TEXT,
    localNotice: 'provider_error',
    day,
    timeOfDay,
    createdAt: now(),
  };
}
