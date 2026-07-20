import type { Message } from '@/types';
import type {
  RoleplayFinalUserLaneKind,
  RoleplayResponseJob,
} from './roleplay-response-job';
import type {
  RoleplayUserStateAuthority,
  RoleplayUserStateAuthorityDecision,
} from './roleplay-user-state-authority';
import {
  renderRoleplayAssistantOutcomeRecord,
  type RoleplayAssistantOutcomeCategoryStatus,
  type RoleplayAssistantOutcomeRecord,
} from './roleplay-assistant-outcome';
import type { MessageFormattingWarning } from './message-formatting-utils';
import {
  projectPlayerTurnVisibility,
  type PlayerTurnPrivateSpan,
} from './player-turn-visibility';

export type RoleplayRecentHistoryTreatment =
  | 'exact_user'
  | 'visible_user_projection'
  | 'exact_latest_assistant'
  | 'exact_assistant_history'
  | 'outcome_summary'
  | 'suppressed_style_anchor';

export type RoleplayRecentHistorySourceLane =
  | 'recent_history'
  | 'player_turn'
  | 'retry_contrast'
  | 'continue_anchor'
  | 'continue_context';

export type RoleplayRecentHistoryReceipt = {
  messageId: string;
  generationId?: string;
  role: 'user' | 'assistant';
  includedInProviderHistory: boolean;
  responseJobSource: RoleplayRecentHistorySourceLane;
  sourceGenerationId?: string;
  generationMatchesResponseJobSource?: boolean;
  alsoRenderedInFinalUserLane?: RoleplayFinalUserLaneKind;
  treatment: RoleplayRecentHistoryTreatment;
  reason: string;
  repeatedAnchors?: string[];
  transformedContent?: string;
  sourceAuthorityDecisionCount?: number;
  sourceAuthorityClasses?: RoleplayUserStateAuthority[];
  outcomeFactCount?: number;
  outcomeCategoryStatus?: RoleplayAssistantOutcomeCategoryStatus[];
  privateSpans?: readonly PlayerTurnPrivateSpan[];
  visibilityWarnings?: readonly MessageFormattingWarning[];
};

export type RoleplaySuppressedStyleAnchor = {
  messageId: string;
  generationId?: string;
  repeatedAnchors: string[];
};

export type RoleplayRecentHistoryProviderMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type RoleplayRecentHistoryPacket = {
  providerMessages: RoleplayRecentHistoryProviderMessage[];
  receipts: RoleplayRecentHistoryReceipt[];
  suppressedStyleAnchors: RoleplaySuppressedStyleAnchor[];
  assistantOutcomeRecords?: RoleplayAssistantOutcomeRecord[];
};

type CompileRoleplayRecentHistoryInput = {
  messages: Message[];
  responseJob?: RoleplayResponseJob;
  userStateAuthorityDecisions?: RoleplayUserStateAuthorityDecision[];
  assistantOutcomeRecords?: RoleplayAssistantOutcomeRecord[];
  limit: number;
  isLocalNotice: (message: Message) => boolean;
};

type AnchorCandidate = {
  key: string;
  display: string;
  fragment: string;
};

function anchorWordCount(value: string) {
  return value.match(/[a-z0-9']+/gi)?.length ?? 0;
}

function anchorKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function anchorDisplay(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["“]|["”]$/g, '');
}

function normalizeHistoryText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function collectAnchorCandidates(text: string): AnchorCandidate[] {
  const candidates: Array<{ display: string; fragment: string }> = [];
  const quoted = /["“]([^"”]+)["”]/g;
  const actions = /\*([^*]+)\*/g;
  let match: RegExpExecArray | null;

  while ((match = quoted.exec(text)) !== null) {
    candidates.push({ display: match[1], fragment: match[0] });
  }
  while ((match = actions.exec(text)) !== null) {
    candidates.push({ display: match[1], fragment: match[0] });
  }

  const sentences = text.match(/[^.!?\n]+[.!?]?/g) ?? [];
  candidates.push(...sentences.map((sentence) => ({ display: sentence, fragment: sentence })));

  const unique = new Map<string, AnchorCandidate>();
  for (const candidate of candidates) {
    const display = anchorDisplay(candidate.display);
    const key = anchorKey(display);
    if (anchorWordCount(key) < 4 || unique.has(key)) continue;
    unique.set(key, { key, display, fragment: candidate.fragment });
  }
  return [...unique.values()];
}

function authorityEvidenceForMessage(
  message: Message,
  decisions: RoleplayUserStateAuthorityDecision[],
): Pick<RoleplayRecentHistoryReceipt, 'sourceAuthorityDecisionCount' | 'sourceAuthorityClasses'> {
  const generationId = message.generationId || message.id;
  const matching = decisions.filter((decision) => (
    decision.sourceRole === 'assistant'
      && decision.sourceMessageId === message.id
      && decision.sourceGenerationId === generationId
  ));
  return matching.length > 0
    ? {
        sourceAuthorityDecisionCount: matching.length,
        sourceAuthorityClasses: [...new Set(matching.map((decision) => decision.authority))],
      }
    : {};
}

function responseJobSourceForMessage(
  message: Message,
  responseJob?: RoleplayResponseJob,
): Pick<
  RoleplayRecentHistoryReceipt,
  'responseJobSource' | 'sourceGenerationId' | 'generationMatchesResponseJobSource' | 'alsoRenderedInFinalUserLane'
> {
  if (!responseJob) {
    return {
      responseJobSource: 'recent_history',
    };
  }

  if (responseJob.playerTurn?.messageId === message.id) {
    return {
      responseJobSource: 'player_turn',
      alsoRenderedInFinalUserLane: 'player_turn',
    };
  }

  if (responseJob.modeData.kind === 'retry_regenerate'
    && responseJob.modeData.rejectedMessageId === message.id) {
    const sourceGenerationId = responseJob.modeData.rejectedGenerationId;
    return {
      responseJobSource: 'retry_contrast',
      sourceGenerationId,
      generationMatchesResponseJobSource: sourceGenerationId
        ? (message.generationId || message.id) === sourceGenerationId
        : undefined,
      alsoRenderedInFinalUserLane: 'retry_rejection',
    };
  }

  if (responseJob.modeData.kind === 'continue_assistant_tail'
    && responseJob.modeData.assistantMessageId === message.id) {
    const sourceGenerationId = responseJob.modeData.assistantGenerationId;
    return {
      responseJobSource: 'continue_anchor',
      sourceGenerationId,
      generationMatchesResponseJobSource: sourceGenerationId
        ? (message.generationId || message.id) === sourceGenerationId
        : undefined,
      alsoRenderedInFinalUserLane: 'continue_anchor',
    };
  }

  if (responseJob.modeData.kind === 'continue_assistant_tail'
    && responseJob.modeData.priorUserMessageId === message.id) {
    return {
      responseJobSource: 'continue_context',
    };
  }

  return {
    responseJobSource: 'recent_history',
  };
}

export function compileRoleplayRecentHistory({
  messages,
  responseJob,
  userStateAuthorityDecisions = [],
  assistantOutcomeRecords = [],
  limit,
  isLocalNotice,
}: CompileRoleplayRecentHistoryInput): {
  historyMessages: Message[];
  packet: RoleplayRecentHistoryPacket;
} {
  const historyMessages = messages
    .filter((message) => !isLocalNotice(message))
    .slice(-limit);
  const sources = historyMessages.map((message) => responseJobSourceForMessage(message, responseJob));
  const acceptedAssistantIndexes = historyMessages
    .map((message, index) => ({ message, index, source: sources[index] }))
    .filter(({ message, source }) => message.role === 'assistant'
      && source.responseJobSource !== 'retry_contrast'
      && source.responseJobSource !== 'continue_anchor')
    .map(({ index }) => index);
  let latestAssistantIndex = -1;
  if (acceptedAssistantIndexes.length > 0) {
    latestAssistantIndex = acceptedAssistantIndexes[acceptedAssistantIndexes.length - 1];
  }
  const assistantCandidates = new Map<number, AnchorCandidate[]>();

  historyMessages.forEach((message, index) => {
    if (acceptedAssistantIndexes.includes(index)) {
      assistantCandidates.set(index, collectAnchorCandidates(message.text));
    }
  });

  const providerMessages: RoleplayRecentHistoryProviderMessage[] = [];
  const receipts: RoleplayRecentHistoryReceipt[] = [];
  const suppressedStyleAnchors: RoleplaySuppressedStyleAnchor[] = [];

  historyMessages.forEach((message, index) => {
    const role: RoleplayRecentHistoryReceipt['role'] = message.role === 'assistant' ? 'assistant' : 'user';
    const source = sources[index];
    const base = {
      messageId: message.id,
      generationId: message.generationId,
      role,
      ...source,
    };

    if (role === 'user') {
      if (source.responseJobSource === 'player_turn'
        && source.alsoRenderedInFinalUserLane === 'player_turn') {
        receipts.push({
          ...base,
          includedInProviderHistory: false,
          treatment: 'exact_user',
          reason: 'exact_user_turn_represented_in_higher_authority_player_lane',
        });
        return;
      }

      const projection = projectPlayerTurnVisibility(message.text, message.id);
      if (!projection.visibleText) {
        receipts.push({
          ...base,
          includedInProviderHistory: false,
          treatment: 'visible_user_projection',
          reason: 'private_user_history_has_no_model_visible_text',
          transformedContent: '',
          privateSpans: projection.privateSpans,
          visibilityWarnings: projection.warnings,
        });
        return;
      }

      providerMessages.push({ role, content: projection.visibleText });
      receipts.push({
        ...base,
        includedInProviderHistory: true,
        treatment: projection.changed ? 'visible_user_projection' : 'exact_user',
        reason: projection.changed
          ? 'private_parenthetical_spans_removed_from_user_history'
          : 'exact_user_continuity',
        transformedContent: projection.changed ? projection.visibleText : undefined,
        privateSpans: projection.privateSpans,
        visibilityWarnings: projection.warnings,
      });
      return;
    }

    if (source.responseJobSource === 'retry_contrast') {
      receipts.push({
        ...base,
        includedInProviderHistory: false,
        treatment: 'suppressed_style_anchor',
        reason: 'rejected_retry_attempt_not_accepted_history',
      });
      return;
    }

    if (source.responseJobSource === 'continue_anchor') {
      receipts.push({
        ...base,
        includedInProviderHistory: false,
        treatment: 'exact_latest_assistant',
        reason: 'represented_in_continue_anchor_lane',
      });
      return;
    }

    if (index === latestAssistantIndex) {
      providerMessages.push({ role, content: message.text });
      receipts.push({
        ...base,
        includedInProviderHistory: true,
        treatment: 'exact_latest_assistant',
        reason: 'latest_accepted_assistant_continuity',
      });
      return;
    }

    const generationId = message.generationId || message.id;
    const outcomeRecord = assistantOutcomeRecords.find((record) => (
      record.messageId === message.id && record.generationId === generationId
    ));
    const renderedOutcome = outcomeRecord
      ? renderRoleplayAssistantOutcomeRecord(outcomeRecord)
      : null;
    if (outcomeRecord && renderedOutcome) {
      providerMessages.push({ role, content: renderedOutcome });
      receipts.push({
        ...base,
        includedInProviderHistory: true,
        treatment: 'outcome_summary',
        reason: 'generation_matched_persisted_assistant_outcome',
        transformedContent: renderedOutcome,
        sourceAuthorityDecisionCount:
          outcomeRecord.authoritySummary.acceptedObservationCount
          + outcomeRecord.authoritySummary.excludedInterpretationCount
          + outcomeRecord.authoritySummary.excludedUnsupportedCount,
        sourceAuthorityClasses: outcomeRecord.authoritySummary.authorityClasses,
        outcomeFactCount: outcomeRecord.facts.length,
        outcomeCategoryStatus: outcomeRecord.categoryStatus,
      });
      return;
    }

    const laterAssistantCandidateKeys = new Set(
      [...assistantCandidates.entries()]
        .filter(([candidateIndex]) => candidateIndex > index)
        .flatMap(([, candidates]) => candidates.map((candidate) => candidate.key)),
    );
    const repeatedAnchors = (assistantCandidates.get(index) ?? [])
      .filter((candidate) => laterAssistantCandidateKeys.has(candidate.key))
      .map((candidate) => candidate.display);

    if (repeatedAnchors.length) {
      suppressedStyleAnchors.push({
        messageId: message.id,
        generationId: message.generationId,
        repeatedAnchors,
      });
    }
    receipts.push({
      ...base,
      ...authorityEvidenceForMessage(message, userStateAuthorityDecisions),
      includedInProviderHistory: false,
      treatment: 'suppressed_style_anchor',
      reason: outcomeRecord
        ? 'older_assistant_without_safe_persisted_outcome_omitted'
        : 'older_assistant_without_outcome_record_omitted',
      repeatedAnchors: repeatedAnchors.length ? repeatedAnchors : undefined,
      outcomeFactCount: outcomeRecord?.facts.length,
      outcomeCategoryStatus: outcomeRecord?.categoryStatus,
    });
  });

  return {
    historyMessages,
    packet: {
      providerMessages,
      receipts,
      suppressedStyleAnchors,
      assistantOutcomeRecords,
    },
  };
}
