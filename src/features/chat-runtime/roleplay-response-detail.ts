export type RoleplayResponseVerbosity = 'concise' | 'balanced' | 'detailed';

export type EffectiveResponseDetail = {
  requestedSetting: string | null;
  effectiveSetting: RoleplayResponseVerbosity;
  source: 'explicit_ui_setting' | 'fallback_default';
  maxOutputTokens: number;
  instructionHash: string;
  instructionPreview: string;
};

const MAX_OUTPUT_TOKENS: Record<RoleplayResponseVerbosity, number> = {
  concise: 1024,
  balanced: 2048,
  detailed: 3072,
};

function isResponseVerbosity(value: unknown): value is RoleplayResponseVerbosity {
  return value === 'concise' || value === 'balanced' || value === 'detailed';
}

function hashInstruction(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function resolveEffectiveResponseDetail(
  requestedSetting: unknown,
  renderInstruction: (setting: RoleplayResponseVerbosity) => string,
): EffectiveResponseDetail {
  const effectiveSetting = isResponseVerbosity(requestedSetting)
    ? requestedSetting
    : 'balanced';
  const instruction = renderInstruction(effectiveSetting).trim();

  return {
    requestedSetting: typeof requestedSetting === 'string' ? requestedSetting : null,
    effectiveSetting,
    source: isResponseVerbosity(requestedSetting) ? 'explicit_ui_setting' : 'fallback_default',
    maxOutputTokens: MAX_OUTPUT_TOKENS[effectiveSetting],
    instructionHash: hashInstruction(instruction),
    instructionPreview: instruction.replace(/\s+/g, ' ').slice(0, 280),
  };
}
