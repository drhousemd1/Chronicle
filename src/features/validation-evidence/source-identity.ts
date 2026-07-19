import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const SYSTEM_GIT_EXECUTABLE = '/usr/bin/git';

export type ValidationSourceIdentity = {
  revision: string | null;
  state: 'clean' | 'dirty' | 'unknown';
};

export async function readValidationSourceIdentity(cwd = process.cwd()): Promise<ValidationSourceIdentity> {
  try {
    const [{ stdout: status }, { stdout: revision }] = await Promise.all([
      execFileAsync(SYSTEM_GIT_EXECUTABLE, ['status', '--porcelain', '--untracked-files=normal'], { cwd }),
      execFileAsync(SYSTEM_GIT_EXECUTABLE, ['rev-parse', 'HEAD'], { cwd }),
    ]);
    if (status.trim()) return { revision: null, state: 'dirty' };
    return { revision: revision.trim() || null, state: revision.trim() ? 'clean' : 'unknown' };
  } catch {
    return { revision: null, state: 'unknown' };
  }
}
