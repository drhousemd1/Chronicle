import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const countOccurrences = (source: string, search: string): number =>
  source.split(search).length - 1;

describe('ReviewModal source contracts', () => {
  it('logs each submit/delete failure once', () => {
    const source = read('src/components/chronicle/ReviewModal.tsx');

    expect(countOccurrences(source, "console.error('Failed to submit review:', err);")).toBe(1);
    expect(countOccurrences(source, "console.error('Failed to delete review:', err);")).toBe(1);
  });
});
