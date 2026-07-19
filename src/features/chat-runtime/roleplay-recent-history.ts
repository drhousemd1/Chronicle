import type { Message } from '@/types';
import type {
  RoleplayFinalUserLaneKind,
  RoleplayResponseJob,
} from './roleplay-response-job';
import type {
  RoleplayUserStateAuthority,
  RoleplayUserStateAuthorityDecision,
} from './roleplay-user-state-authority';

export type RoleplayRecentHistoryTreatment =
  | 'exact_user'
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
};

type CompileRoleplayRecentHistoryInput = {
  messages: Message[];
  responseJob?: RoleplayResponseJob;
  userStateAuthorityDecisions?: RoleplayUserStateAuthorityDecision[];
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

function removeRepeatedFragments(text: string, candidates: AnchorCandidate[]) {
  const stripped = [...candidates]
    .sort((a, b) => b.fragment.length - a.fragment.length)
    .reduce((value, candidate) => value.split(candidate.fragment).join(''), text)
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return {
    text: stripped,
    hasMeaningfulContent: anchorWordCount(stripped) >= 3,
  };
}

function buildStructuredOutcomeSummary(
  message: Message,
  decisions: RoleplayUserStateAuthorityDecision[],
): {
  content: string;
  decisions: RoleplayUserStateAuthorityDecision[];
  authorityClasses: RoleplayUserStateAuthority[];
} | null {
  const generationId = message.generationId || message.id;
  const seen = new Set<string>();
  const selected = decisions.filter((decision) => {
    if (decision.sourceRole !== 'assistant') return false;
    if (decision.sourceMessageId !== message.id) return false;
    if (!decision.sourceGenerationId || decision.sourceGenerationId !== generationId) return false;
    const supportedObservation = decision.authority === 'accepted_assistant_observable_change'
      && decision.modelFacingAction === 'allow_as_observation';
    const labeledInterpretation = decision.authority === 'assistant_interpretation'
      && decision.modelFacingAction === 'allow_as_character_interpretation';
    if (!supportedObservation && !labeledInterpretation) return false;
    const claim = normalizeHistoryText(decision.claim);
    const key = `${decision.authority}:${claim.toLocaleLowerCase()}`;
    if (!claim || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (selected.length === 0) return null;

  const lines = selected.map((decision) => (
    decision.authority === 'accepted_assistant_observable_change'
      ? `- Observed change: ${normalizeHistoryText(decision.claim)}`
      : `- Character interpretation, not established fact: ${normalizeHistoryText(decision.claim)}`
  ));
  return {
    content: ['Older assistant outcome summary:', ...lines].join('\n'),
    decisions: selected,
    authorityClasses: [...new Set(selected.map((decision) => decision.authority))],
  };
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

  if (responseJob.playerTurn?.messageId === message.id
    && normalizeHistoryText(responseJob.playerTurn.text) === normalizeHistoryText(message.text)) {
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
      const playerTurnIdMatchedWithDifferentText = responseJob?.playerTurn?.messageId === message.id
        && normalizeHistoryText(responseJob.playerTurn.text) !== normalizeHistoryText(message.text);
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

      providerMessages.push({ role, content: message.text });
      receipts.push({
        ...base,
        includedInProviderHistory: true,
        treatment: 'exact_user',
        reason: playerTurnIdMatchedWithDifferentText
          ? 'player_turn_id_matched_but_content_differed_preserved_in_history'
          : source.responseJobSource === 'player_turn'
          ? 'exact_user_turn_also_rendered_in_player_lane'
          : 'exact_user_continuity',
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

    const outcomeSummary = buildStructuredOutcomeSummary(message, userStateAuthorityDecisions);
    if (outcomeSummary) {
      providerMessages.push({ role, content: outcomeSummary.content });
      receipts.push({
        ...base,
        includedInProviderHistory: true,
        treatment: 'outcome_summary',
        reason: 'structured_source_authority_outcome_summary',
        transformedContent: outcomeSummary.content,
        sourceAuthorityDecisionCount: outcomeSummary.decisions.length,
        sourceAuthorityClasses: outcomeSummary.authorityClasses,
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
      const stripped = removeRepeatedFragments(
        message.text,
        (assistantCandidates.get(index) ?? []).filter((candidate) => repeatedAnchors.includes(candidate.display)),
      );
      if (stripped.hasMeaningfulContent) {
        providerMessages.push({ role, content: stripped.text });
      }
      receipts.push({
        ...base,
        includedInProviderHistory: stripped.hasMeaningfulContent,
        treatment: 'suppressed_style_anchor',
        reason: stripped.hasMeaningfulContent
          ? 'repeated_assistant_phrase_removed'
          : 'repeated_assistant_message_suppressed',
        repeatedAnchors,
      });
      suppressedStyleAnchors.push({
        messageId: message.id,
        generationId: message.generationId,
        repeatedAnchors,
      });
      return;
    }

    providerMessages.push({ role, content: message.text });
    receipts.push({
      ...base,
      includedInProviderHistory: true,
      treatment: 'exact_assistant_history',
      reason: 'accepted_assistant_history',
    });
  });

  return {
    historyMessages,
    packet: {
      providerMessages,
      receipts,
      suppressedStyleAnchors,
    },
  };
}
