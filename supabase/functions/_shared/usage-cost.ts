export const GROK_43_INPUT_USD_PER_MILLION = 1.25;
export const GROK_43_CACHED_INPUT_USD_PER_MILLION = 0.2;
export const GROK_43_OUTPUT_USD_PER_MILLION = 2.5;
export const GROK_IMAGE_INPUT_USD_PER_IMAGE = 0.002;
export const GROK_IMAGE_OUTPUT_USD_PER_IMAGE = 0.02;
export const GROK_IMAGE_USD_PER_IMAGE = GROK_IMAGE_INPUT_USD_PER_IMAGE + GROK_IMAGE_OUTPUT_USD_PER_IMAGE;
export const TEXT_CALL_FALLBACK_USD = 0.0127;
export const RESPONSES_PRE_GENERATION_VIOLATION_USD = 0.05;

const NON_PROVIDER_RESULT_EVENTS = new Set([
  "character_cards_updated",
  "memory_events_extracted",
  "memory_bullets_compressed",
]);

const IMAGE_EVENTS = new Set([
  "side_character_avatar_generated",
  "character_avatar_generated",
  "scene_image_generated",
  "cover_image_generated",
]);

const PAID_TEXT_EVENTS = new Set([
  "chat_call_1",
  "character_ai_fill",
  "character_ai_generate",
  "character_card_ai_update",
  "character_cards_update_call",
  "character_ai_enhance_precise",
  "character_ai_enhance_detailed",
  "world_ai_enhance_precise",
  "world_ai_enhance_detailed",
  "memory_extraction_call",
  "memory_day_compression_call",
  "goal_progress_eval_call",
  "goal_alignment_eval_call",
  "side_character_generated",
  "side_character_card_generated",
]);

export type UsageEstimate = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  costEstimateSource:
    | "provider_tokens"
    | "provider_tokens_plus_extra_requests"
    | "provider_tokens_plus_image"
    | "character_estimate"
    | "character_estimate_plus_image"
    | "image_fixed_rate"
    | "image_fixed_rate_plus_extra_requests"
    | "fallback_per_call"
    | "non_provider_result";
};

export function toNonNegativeInt(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function toNonNegativeNumber(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

function estimateTextCost(inputTokens: number, outputTokens: number, cachedInputTokens = 0): number {
  const safeCachedInputTokens = Math.min(inputTokens, Math.max(0, cachedInputTokens));
  const billableStandardInputTokens = Math.max(0, inputTokens - safeCachedInputTokens);
  const inputCost = (billableStandardInputTokens / 1_000_000) * GROK_43_INPUT_USD_PER_MILLION;
  const cachedInputCost = (safeCachedInputTokens / 1_000_000) * GROK_43_CACHED_INPUT_USD_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * GROK_43_OUTPUT_USD_PER_MILLION;
  return inputCost + cachedInputCost + outputCost;
}

export function buildProviderUsageMetadata(usage: {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  reasoning_tokens?: number;
  input_tokens_details?: unknown;
} | null | undefined): Record<string, number | null> {
  const inputTokenDetails = usage?.input_tokens_details && typeof usage.input_tokens_details === "object"
    ? usage.input_tokens_details as Record<string, unknown>
    : {};
  const hasUsageTokens = typeof usage?.input_tokens === "number" || typeof usage?.output_tokens === "number";
  return {
    providerInputTokens: typeof usage?.input_tokens === "number" ? usage.input_tokens : null,
    providerCachedInputTokens: typeof inputTokenDetails.cached_tokens === "number" ? inputTokenDetails.cached_tokens : null,
    providerOutputTokens: typeof usage?.output_tokens === "number" ? usage.output_tokens : null,
    providerTotalTokens: typeof usage?.total_tokens === "number" ? usage.total_tokens : null,
    providerReasoningTokens: typeof usage?.reasoning_tokens === "number" ? usage.reasoning_tokens : null,
    providerUsageRequestCount: hasUsageTokens ? 1 : null,
  };
}

export function combineProviderUsageMetadata(...items: Array<Record<string, unknown> | null | undefined>): Record<string, number | null> {
  const keys = [
    "providerInputTokens",
    "providerCachedInputTokens",
    "providerOutputTokens",
    "providerTotalTokens",
    "providerReasoningTokens",
    "providerUsageRequestCount",
  ] as const;
  return Object.fromEntries(keys.map((key) => {
    let hasValue = false;
    let total = 0;
    for (const item of items) {
      const value = item?.[key];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      hasValue = true;
      total += value;
    }
    return [key, hasValue ? total : null];
  }));
}

export function estimateAiUsageCost(eventType: string, metadata: Record<string, unknown> = {}, count = 1): UsageEstimate {
  const safeCount = Math.max(1, toNonNegativeInt(count) || 1);
  const providerInputTokens = toNonNegativeInt(metadata.providerInputTokens);
  const providerCachedInputTokens = Math.min(providerInputTokens, toNonNegativeInt(metadata.providerCachedInputTokens));
  const providerOutputTokens = toNonNegativeInt(metadata.providerOutputTokens);
  const providerTotalTokens = toNonNegativeInt(metadata.providerTotalTokens);
  const providerUsageRequestCount = providerInputTokens > 0 || providerOutputTokens > 0
    ? Math.max(1, toNonNegativeInt(metadata.providerUsageRequestCount) || 1)
    : 0;
  const providerRequestCount = Math.max(
    providerUsageRequestCount,
    toNonNegativeInt(metadata.providerRequestCount) || safeCount,
  );
  const providerPreGenerationViolationCount = toNonNegativeInt(
    metadata.providerPreGenerationViolationCount ?? metadata.providerViolationCount,
  );
  const providerTransport = typeof metadata.providerTransport === "string" ? metadata.providerTransport : "";
  const preGenerationViolationUnitCost = providerTransport === "chat_completions" ? 0 : RESPONSES_PRE_GENERATION_VIOLATION_USD;

  if (NON_PROVIDER_RESULT_EVENTS.has(eventType)) {
    return {
      inputTokens: providerInputTokens,
      cachedInputTokens: providerCachedInputTokens,
      outputTokens: providerOutputTokens,
      totalTokens: providerTotalTokens || providerInputTokens + providerOutputTokens,
      estimatedCostUsd: 0,
      costEstimateSource: "non_provider_result",
    };
  }

  const hasImagePricing = IMAGE_EVENTS.has(eventType);
  const imageCount = hasImagePricing
    ? Math.max(1, toNonNegativeInt(metadata.imageCount) || safeCount)
    : 0;
  const providerImageRequestCount = imageCount > 0
    ? Math.max(imageCount, toNonNegativeInt(metadata.providerImageRequestCount) || imageCount)
    : 0;
  const inputChars = toNonNegativeInt(metadata.inputChars ?? (hasImagePricing ? undefined : metadata.promptChars));
  const outputChars = toNonNegativeInt(metadata.outputChars);

  if (providerInputTokens > 0 || providerOutputTokens > 0) {
    const missingProviderRequests = Math.max(
      0,
      providerRequestCount - providerUsageRequestCount - providerImageRequestCount - providerPreGenerationViolationCount,
    );
    const textCost = estimateTextCost(providerInputTokens, providerOutputTokens, providerCachedInputTokens);
    const imageCost = imageCount * GROK_IMAGE_USD_PER_IMAGE;
    const extraRequestCost =
      (missingProviderRequests * TEXT_CALL_FALLBACK_USD) +
      (providerPreGenerationViolationCount * preGenerationViolationUnitCost);
    return {
      inputTokens: providerInputTokens,
      cachedInputTokens: providerCachedInputTokens,
      outputTokens: providerOutputTokens,
      totalTokens: providerTotalTokens || providerInputTokens + providerOutputTokens,
      estimatedCostUsd: Number((textCost + imageCost + extraRequestCost).toFixed(6)),
      costEstimateSource: extraRequestCost > 0
        ? "provider_tokens_plus_extra_requests"
        : imageCount > 0
          ? "provider_tokens_plus_image"
          : "provider_tokens",
    };
  }

  if (inputChars > 0 || outputChars > 0) {
    const inputTokens = Math.ceil(inputChars / 4);
    const outputTokens = Math.ceil(outputChars / 4);
    const textCost = estimateTextCost(inputTokens, outputTokens);
    const imageCost = imageCount * GROK_IMAGE_USD_PER_IMAGE;
    const missingProviderRequests = Math.max(
      0,
      providerRequestCount - providerUsageRequestCount - providerImageRequestCount - providerPreGenerationViolationCount,
    );
    const extraRequestCost =
      (missingProviderRequests * TEXT_CALL_FALLBACK_USD) +
      (providerPreGenerationViolationCount * preGenerationViolationUnitCost);
    return {
      inputTokens,
      cachedInputTokens: 0,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: Number((textCost + imageCost + extraRequestCost).toFixed(6)),
      costEstimateSource: imageCount > 0 ? "character_estimate_plus_image" : "character_estimate",
    };
  }

  if (imageCount > 0) {
    const missingProviderRequests = Math.max(
      0,
      providerRequestCount - providerImageRequestCount - providerPreGenerationViolationCount,
    );
    const extraRequestCost =
      (missingProviderRequests * TEXT_CALL_FALLBACK_USD) +
      (providerPreGenerationViolationCount * preGenerationViolationUnitCost);
    return {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: Number(((imageCount * GROK_IMAGE_USD_PER_IMAGE) + extraRequestCost).toFixed(6)),
      costEstimateSource: extraRequestCost > 0 ? "image_fixed_rate_plus_extra_requests" : "image_fixed_rate",
    };
  }

  if (PAID_TEXT_EVENTS.has(eventType)) {
    const fallbackRequestCount = Math.max(1, providerRequestCount || safeCount);
    const billableFallbackRequests = Math.max(0, fallbackRequestCount - providerPreGenerationViolationCount);
    return {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: Number((
        (billableFallbackRequests * TEXT_CALL_FALLBACK_USD) +
        (providerPreGenerationViolationCount * preGenerationViolationUnitCost)
      ).toFixed(6)),
      costEstimateSource: "fallback_per_call",
    };
  }

  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    costEstimateSource: "non_provider_result",
  };
}
