import { supabase } from "@/integrations/supabase/client";
import {
  API_USAGE_VALIDATION_ROWS,
  API_USAGE_VALIDATION_ROW_IDS,
  API_USAGE_VALIDATION_ROW_BY_ID,
  ApiUsageValidationCallGroup,
  ApiUsageValidationRowKind,
} from "@/data/api-usage-validation-registry";

export interface AdminUsageCounters {
  messagesSent: number;
  messagesGenerated: number;
  imagesGenerated: number;
  aiFillClicks: number;
  aiUpdateClicks: number;
  aiEnhanceClicks: number;
  characterUpdateCalls: number;
  characterCardsUpdated: number;
  aiCharacterCardsGenerated: number;
  aiAvatarsGenerated: number;
  memoryExtractionCalls: number;
  memoryEventsExtracted: number;
  memoryCompressionCalls: number;
  memoryBulletsCompressed: number;
  sideCharacterAvatarsGenerated: number;
  characterAvatarsGenerated: number;
  sceneImagesGenerated: number;
  coverImagesGenerated: number;
}

export interface AdminUsageSummary {
  fetchedAt: string;
  counters: AdminUsageCounters;
}

export type AdminUsagePeriod = "day" | "week" | "month" | "year";

export interface AdminUsageTimeseriesPoint {
  label: string;
  messagesSent: number;
  messagesGenerated: number;
  imagesGenerated: number;
  aiFillClicks: number;
  aiUpdateClicks: number;
  aiEnhanceClicks: number;
  characterUpdateCalls: number;
  characterCardsUpdated: number;
  aiCharacterCardsGenerated: number;
  aiAvatarsGenerated: number;
  memoryExtractionCalls: number;
  memoryEventsExtracted: number;
  memoryCompressionCalls: number;
  memoryBulletsCompressed: number;
  sideCharacterAvatarsGenerated: number;
  characterAvatarsGenerated: number;
  sceneImagesGenerated: number;
  coverImagesGenerated: number;
  textCostUsd: number;
  imageCostUsd: number;
}

export interface AdminUsageTimeseries {
  fetchedAt: string;
  period: AdminUsagePeriod;
  points: AdminUsageTimeseriesPoint[];
}

export interface AdminApiUsageTestRow {
  sessionId: string;
  sessionName: string;
  createdAt: string;
  messagesSent: number;
  messagesGenerated: number;
  imagesGenerated: number;
  aiFillClicks: number;
  aiUpdateClicks: number;
  aiEnhanceClicks: number;
  aiCharacterCards: number;
  aiAvatars: number;
  cardUpdateCalls: number;
  cardsUpdated: number;
  memoryExtractCalls: number;
  memoryEvents: number;
  memoryCompressed: number;
  memoryBullets: number;
  totalTokensEst: number;
  totalCostEstUsd: number;
}

export type AdminApiUsageValidationStatus = "pass" | "fail" | "blank";

export interface AdminApiUsageValidationRow {
  id: string;
  label: string;
  helpText: string;
  kind: ApiUsageValidationRowKind;
  callGroup: ApiUsageValidationCallGroup;
  parentId?: string;
  sort: number;
}

export interface AdminApiUsageValidationSummary {
  overall: {
    pass: number;
    fail: number;
    blank: number;
  };
  bySession: Record<
    string,
    {
      pass: number;
      fail: number;
      blank: number;
      triggered: number;
    }
  >;
}

export interface ValidationSnapshotLike {
  expectedIds?: string[];
  sentIds?: string[];
  missingIds?: string[];
}

export function aggregateValidationStatuses(
  rowIds: string[],
  snapshots: ValidationSnapshotLike[]
): Record<string, AdminApiUsageValidationStatus> {
  const statusMap: Record<string, AdminApiUsageValidationStatus> = Object.fromEntries(
    rowIds.map((rowId) => [rowId, "blank" as AdminApiUsageValidationStatus])
  );

  const applyPass = (rowId: string) => {
    if (!(rowId in statusMap)) return;
    if (statusMap[rowId] !== "fail") statusMap[rowId] = "pass";
  };
  const applyFail = (rowId: string) => {
    if (!(rowId in statusMap)) return;
    statusMap[rowId] = "fail";
  };

  for (const snapshot of snapshots) {
    const sent = Array.isArray(snapshot.sentIds) ? snapshot.sentIds : [];
    const missing = Array.isArray(snapshot.missingIds) ? snapshot.missingIds : [];

    for (const rowId of sent) applyPass(rowId);
    for (const rowId of missing) applyFail(rowId);
  }

  return statusMap;
}

export interface AdminApiUsageTestReport {
  fetchedAt: string;
  rows: AdminApiUsageTestRow[];
  validationRows: AdminApiUsageValidationRow[];
  validationStatusBySession: Record<string, Record<string, AdminApiUsageValidationStatus>>;
  validationSummary: AdminApiUsageValidationSummary;
}

const EMPTY_COUNTERS: AdminUsageCounters = {
  messagesSent: 0,
  messagesGenerated: 0,
  imagesGenerated: 0,
  aiFillClicks: 0,
  aiUpdateClicks: 0,
  aiEnhanceClicks: 0,
  characterUpdateCalls: 0,
  characterCardsUpdated: 0,
  aiCharacterCardsGenerated: 0,
  aiAvatarsGenerated: 0,
  memoryExtractionCalls: 0,
  memoryEventsExtracted: 0,
  memoryCompressionCalls: 0,
  memoryBulletsCompressed: 0,
  sideCharacterAvatarsGenerated: 0,
  characterAvatarsGenerated: 0,
  sceneImagesGenerated: 0,
  coverImagesGenerated: 0,
};

function toFiniteNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchAdminUsageSummary(): Promise<AdminUsageSummary> {
  const { data, error } = await supabase.functions.invoke("admin-ai-usage-summary");
  if (error) {
    throw new Error(error.message || "Failed to load admin usage summary");
  }

  const rawCounters = data?.counters ?? {};

  return {
    fetchedAt: typeof data?.fetchedAt === "string" ? data.fetchedAt : new Date().toISOString(),
    counters: {
      messagesSent: toFiniteNumber(rawCounters.messagesSent),
      messagesGenerated: toFiniteNumber(rawCounters.messagesGenerated),
      imagesGenerated: toFiniteNumber(rawCounters.imagesGenerated),
      aiFillClicks: toFiniteNumber(rawCounters.aiFillClicks),
      aiUpdateClicks: toFiniteNumber(rawCounters.aiUpdateClicks),
      aiEnhanceClicks: toFiniteNumber(rawCounters.aiEnhanceClicks),
      characterUpdateCalls: toFiniteNumber(rawCounters.characterUpdateCalls),
      characterCardsUpdated: toFiniteNumber(rawCounters.characterCardsUpdated),
      aiCharacterCardsGenerated: toFiniteNumber(rawCounters.aiCharacterCardsGenerated),
      aiAvatarsGenerated: toFiniteNumber(rawCounters.aiAvatarsGenerated),
      memoryExtractionCalls: toFiniteNumber(rawCounters.memoryExtractionCalls),
      memoryEventsExtracted: toFiniteNumber(rawCounters.memoryEventsExtracted),
      memoryCompressionCalls: toFiniteNumber(rawCounters.memoryCompressionCalls),
      memoryBulletsCompressed: toFiniteNumber(rawCounters.memoryBulletsCompressed),
      sideCharacterAvatarsGenerated: toFiniteNumber(rawCounters.sideCharacterAvatarsGenerated),
      characterAvatarsGenerated: toFiniteNumber(rawCounters.characterAvatarsGenerated),
      sceneImagesGenerated: toFiniteNumber(rawCounters.sceneImagesGenerated),
      coverImagesGenerated: toFiniteNumber(rawCounters.coverImagesGenerated),
    },
  };
}

export function getEmptyUsageSummary(): AdminUsageSummary {
  return {
    fetchedAt: new Date().toISOString(),
    counters: { ...EMPTY_COUNTERS },
  };
}

function buildEmptyLabels(period: AdminUsagePeriod): string[] {
  if (period === "day") return ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"];
  if (period === "week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (period === "month") return ["Wk1", "Wk2", "Wk3", "Wk4"];
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

export function getEmptyUsageTimeseries(period: AdminUsagePeriod): AdminUsageTimeseries {
  const points = buildEmptyLabels(period).map((label) => ({
    label,
    messagesSent: 0,
    messagesGenerated: 0,
    imagesGenerated: 0,
    aiFillClicks: 0,
    aiUpdateClicks: 0,
    aiEnhanceClicks: 0,
    characterUpdateCalls: 0,
    characterCardsUpdated: 0,
    aiCharacterCardsGenerated: 0,
    aiAvatarsGenerated: 0,
    memoryExtractionCalls: 0,
    memoryEventsExtracted: 0,
    memoryCompressionCalls: 0,
    memoryBulletsCompressed: 0,
    sideCharacterAvatarsGenerated: 0,
    characterAvatarsGenerated: 0,
    sceneImagesGenerated: 0,
    coverImagesGenerated: 0,
    textCostUsd: 0,
    imageCostUsd: 0,
  }));

  return {
    fetchedAt: new Date().toISOString(),
    period,
    points,
  };
}

export async function fetchAdminUsageTimeseries(period: AdminUsagePeriod): Promise<AdminUsageTimeseries> {
  const { data, error } = await supabase.functions.invoke("admin-ai-usage-timeseries", {
    body: { period },
  });
  if (error) {
    throw new Error(error.message || "Failed to load admin usage timeseries");
  }

  const points = Array.isArray(data?.points) ? data.points : [];

  return {
    fetchedAt: typeof data?.fetchedAt === "string" ? data.fetchedAt : new Date().toISOString(),
    period: (data?.period as AdminUsagePeriod) || period,
    points: points.map((point: any) => ({
      label: typeof point?.label === "string" ? point.label : "",
      messagesSent: toFiniteNumber(point?.messagesSent),
      messagesGenerated: toFiniteNumber(point?.messagesGenerated),
      imagesGenerated: toFiniteNumber(point?.imagesGenerated),
      aiFillClicks: toFiniteNumber(point?.aiFillClicks),
      aiUpdateClicks: toFiniteNumber(point?.aiUpdateClicks),
      aiEnhanceClicks: toFiniteNumber(point?.aiEnhanceClicks),
      characterUpdateCalls: toFiniteNumber(point?.characterUpdateCalls),
      characterCardsUpdated: toFiniteNumber(point?.characterCardsUpdated),
      aiCharacterCardsGenerated: toFiniteNumber(point?.aiCharacterCardsGenerated),
      aiAvatarsGenerated: toFiniteNumber(point?.aiAvatarsGenerated),
      memoryExtractionCalls: toFiniteNumber(point?.memoryExtractionCalls),
      memoryEventsExtracted: toFiniteNumber(point?.memoryEventsExtracted),
      memoryCompressionCalls: toFiniteNumber(point?.memoryCompressionCalls),
      memoryBulletsCompressed: toFiniteNumber(point?.memoryBulletsCompressed),
      sideCharacterAvatarsGenerated: toFiniteNumber(point?.sideCharacterAvatarsGenerated),
      characterAvatarsGenerated: toFiniteNumber(point?.characterAvatarsGenerated),
      sceneImagesGenerated: toFiniteNumber(point?.sceneImagesGenerated),
      coverImagesGenerated: toFiniteNumber(point?.coverImagesGenerated),
      textCostUsd: toFiniteNumber(point?.textCostUsd),
      imageCostUsd: toFiniteNumber(point?.imageCostUsd),
    })),
  };
}

export async function fetchAdminApiUsageTestReport(limit = 50): Promise<AdminApiUsageTestReport> {
  const { data, error } = await supabase.functions.invoke("admin-api-usage-test-report", {
    body: { limit, validationRowIds: API_USAGE_VALIDATION_ROW_IDS },
  });
  if (error) {
    throw new Error(error.message || "Failed to load API usage test report");
  }

  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const rawValidationRows = Array.isArray(data?.validationRows) ? data.validationRows : [];
  const mappedValidationRows = rawValidationRows
    .map((rowId: unknown) => (typeof rowId === "string" ? API_USAGE_VALIDATION_ROW_BY_ID[rowId] : null))
    .filter((row: AdminApiUsageValidationRow | null): row is AdminApiUsageValidationRow => Boolean(row))
    .sort((a: AdminApiUsageValidationRow, b: AdminApiUsageValidationRow) => a.sort - b.sort);
  const validationRows = mappedValidationRows.length > 0
    ? mappedValidationRows
    : API_USAGE_VALIDATION_ROWS;

  const rawStatusBySession = (data?.validationStatusBySession && typeof data.validationStatusBySession === "object")
    ? (data.validationStatusBySession as Record<string, Record<string, unknown>>)
    : {};
  const validationStatusBySession = Object.fromEntries(
    Object.entries(rawStatusBySession).map(([sessionId, rowMap]) => [
      sessionId,
      Object.fromEntries(
        Object.entries(rowMap || {}).map(([rowId, status]) => {
          const normalized: AdminApiUsageValidationStatus =
            status === "pass" || status === "fail" || status === "blank" ? status : "blank";
          return [rowId, normalized];
        })
      ),
    ])
  ) as Record<string, Record<string, AdminApiUsageValidationStatus>>;

  const validationSummary: AdminApiUsageValidationSummary = {
    overall: {
      pass: toFiniteNumber(data?.validationSummary?.overall?.pass),
      fail: toFiniteNumber(data?.validationSummary?.overall?.fail),
      blank: toFiniteNumber(data?.validationSummary?.overall?.blank),
    },
    bySession: Object.fromEntries(
      Object.entries((data?.validationSummary?.bySession && typeof data.validationSummary.bySession === "object")
        ? (data.validationSummary.bySession as Record<string, Record<string, unknown>>)
        : {}).map(([sessionId, summary]) => [
        sessionId,
        {
          pass: toFiniteNumber(summary?.pass),
          fail: toFiniteNumber(summary?.fail),
          blank: toFiniteNumber(summary?.blank),
          triggered: toFiniteNumber(summary?.triggered),
        },
      ])
    ),
  };

  return {
    fetchedAt: typeof data?.fetchedAt === "string" ? data.fetchedAt : new Date().toISOString(),
    rows: rows.map((row: any) => ({
      sessionId: typeof row?.sessionId === "string" ? row.sessionId : "",
      sessionName: typeof row?.sessionName === "string" ? row.sessionName : "Untitled Session",
      createdAt: typeof row?.createdAt === "string" ? row.createdAt : "",
      messagesSent: toFiniteNumber(row?.messagesSent),
      messagesGenerated: toFiniteNumber(row?.messagesGenerated),
      imagesGenerated: toFiniteNumber(row?.imagesGenerated),
      aiFillClicks: toFiniteNumber(row?.aiFillClicks),
      aiUpdateClicks: toFiniteNumber(row?.aiUpdateClicks),
      aiEnhanceClicks: toFiniteNumber(row?.aiEnhanceClicks),
      aiCharacterCards: toFiniteNumber(row?.aiCharacterCards),
      aiAvatars: toFiniteNumber(row?.aiAvatars),
      cardUpdateCalls: toFiniteNumber(row?.cardUpdateCalls),
      cardsUpdated: toFiniteNumber(row?.cardsUpdated),
      memoryExtractCalls: toFiniteNumber(row?.memoryExtractCalls),
      memoryEvents: toFiniteNumber(row?.memoryEvents),
      memoryCompressed: toFiniteNumber(row?.memoryCompressed),
      memoryBullets: toFiniteNumber(row?.memoryBullets),
      totalTokensEst: toFiniteNumber(row?.totalTokensEst),
      totalCostEstUsd: toFiniteNumber(row?.totalCostEstUsd),
    })),
    validationRows,
    validationStatusBySession,
    validationSummary,
  };
}
