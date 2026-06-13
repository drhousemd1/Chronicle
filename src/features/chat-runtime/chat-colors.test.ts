import { describe, expect, it } from 'vitest';

import {
  getColorFamilyLabel,
  normalizeHexColor,
  tryNormalizeHexColor,
} from './chat-colors';

describe('chat color helpers', () => {
  it('normalizes valid hex colors and falls back for invalid input', () => {
    expect(normalizeHexColor('#ABC', '#111111')).toBe('#aabbcc');
    expect(normalizeHexColor('00ff88', '#111111')).toBe('#00ff88');
    expect(normalizeHexColor('not-a-color', '#111111')).toBe('#111111');
    expect(normalizeHexColor(null, '#111111')).toBe('#111111');
  });

  it('returns null for invalid typed color drafts', () => {
    expect(tryNormalizeHexColor('#abc')).toBe('#aabbcc');
    expect(tryNormalizeHexColor('123456')).toBe('#123456');
    expect(tryNormalizeHexColor('#zzzzzz')).toBeNull();
  });

  it('keeps existing broad color family labels', () => {
    expect(getColorFamilyLabel('#050505')).toBe('Very dark gray');
    expect(getColorFamilyLabel('#ff0000')).toBe('Red');
    expect(getColorFamilyLabel('#00ff00')).toBe('Green');
    expect(getColorFamilyLabel('#0000ff')).toBe('Blue');
    expect(getColorFamilyLabel('#ff80c0')).toBe('Pink');
  });
});
