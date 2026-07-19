import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const currentTestPath = 'src/features/chat-runtime/structured-mood-removal.test.ts';
const sourceRoots = ['src', 'scripts', 'supabase/functions'];
const inspectedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md']);
const retiredStructuredMoodTokens = [
  /currentMood/,
  /current_mood/,
  /Current Mood/,
  /\bmood=/,
];

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(absolutePath);
    if (!entry.isFile() || !inspectedExtensions.has(extname(entry.name))) return [];
    return [absolutePath];
  });
}

describe('structured mood terminal removal', () => {
  it('keeps retired structured-mood fields out of active code, scripts, and edge functions', () => {
    const matches = sourceRoots
      .flatMap((root) => listSourceFiles(join(repositoryRoot, root)))
      .filter((filePath) => relative(repositoryRoot, filePath) !== currentTestPath)
      .flatMap((filePath) => {
        const source = readFileSync(filePath, 'utf8');
        return retiredStructuredMoodTokens
          .filter((pattern) => pattern.test(source))
          .map((pattern) => `${relative(repositoryRoot, filePath)} matched ${pattern.source}`);
      });

    expect(matches).toEqual([]);
  });
});
