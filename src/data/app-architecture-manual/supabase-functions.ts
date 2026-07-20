import { defineManualArchitectureFiles } from "./types";

const edgeHeader = {
  label: "EDGE FUNCTION" as const,
  className: "edge-fn" as const,
  filterValue: "edge-fn" as const,
  navAccent: "edge-fn" as const,
};

const codeHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

const toolingHeader = {
  label: "TOOLING" as const,
  className: "tooling" as const,
  filterValue: "tooling" as const,
  navAccent: "tooling" as const,
};

export const supabaseFunctionArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/supabase/config.toml",
    header: toolingHeader,
    metric: "1 line",
    metricDescription: "Supabase CLI project binding.",
    description:
      "Binds local Supabase CLI operations to Chronicle's configured project ID. It contains no table definitions, secrets, function settings, or RLS policy by itself.",
    rows: [],
    reviewedSource: "Manual review of the single project_id setting.",
  },
  {
    path: "/supabase/functions/_shared/admin-debug.ts",
    header: codeHeader,
    metric: "25 lines",
    metricDescription: "Shared authorization check for optional edge-function debug traces.",
    description:
      "Returns false unless a request explicitly asks for debug data, then calls the has_role RPC for the authenticated user and permits the trace only when that user is an admin. A failed role check is logged and defaults closed, preventing ordinary requests from receiving model-facing or support-call diagnostics.",
    rows: [],
    reviewedSource: "Manual review of requested-value guard, has_role RPC, error handling, and fail-closed result.",
  },
  {
    path: "/supabase/functions/_shared/cors.ts",
    header: codeHeader,
    metric: "63 lines",
    metricDescription: "Shared CORS origin policy for Supabase edge functions.",
    description:
      "Builds the response headers used by Chronicle edge functions from an environment-supplied origin list or a narrow default set of local and Lovable origins. It supports exact origins, approved Lovable suffixes, and an explicit wildcard configuration, echoes only permitted request origins, and advertises the headers and HTTP methods accepted by the edge endpoints.",
    rows: [],
    reviewedSource: "Manual review of defaults, environment parsing, suffix matching, wildcard handling, fallback origin, and returned headers.",
  },
  {
    path: "/supabase/functions/_shared/rate-limit.ts",
    header: codeHeader,
    metric: "90 lines",
    metricDescription: "Best-effort per-isolate request rate limiter.",
    description:
      "Maintains an in-memory bucket map keyed by function scope and authenticated-user key, starts or increments fixed windows, rejects calls over the configured maximum, periodically removes expired buckets, and returns standard limit, remaining, reset, and retry headers. Because the store lives in one edge isolate's memory, it is a protective throttle rather than a globally consistent database-backed quota.",
    rows: [],
    reviewedSource: "Manual review of bucket identity, window rollover, rejection math, cleanup threshold, and header output.",
  },
  {
    path: "/supabase/functions/_shared/server-usage.ts",
    header: codeHeader,
    metric: "206 lines",
    metricDescription: "Authoritative server-side AI usage and active-test-session recorder.",
    description:
      "Defines the supported AI event vocabulary, normalizes event counts, strips metadata down to bounded scalar values, marks it server-authoritative, inserts the event into ai_usage_events, and mirrors a cost-estimated trace into the authenticated user's latest active ai_usage_test_session. Telemetry failure is logged and intentionally does not fail the owning AI request.",
    rows: [
      {
        id: "server-usage-primary",
        title: "Authoritative usage event",
        summary:
          "Uses the service role to record who invoked which edge function, the event type and count, and sanitized model/request metadata without storing arbitrary prompt objects.",
        badgeLabel: "USAGE WRITE",
        badgeClass: "data-block",
        details: [],
        security: true,
      },
      {
        id: "server-usage-test-mirror",
        title: "Optional active-session trace",
        summary:
          "When the same user has an active API usage test session, writes a linked event with call grouping, source function, token estimates, estimated cost, status, and authoritative-source markers.",
        badgeLabel: "TEST TRACE",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of event taxonomy, metadata sanitation, service-role setup, primary insert, active-session lookup, cost estimate, and mirror insert.",
  },
  {
    path: "/supabase/functions/_shared/state-sync-completeness.ts",
    header: codeHeader,
    metric: "121 lines",
    metricDescription: "Character physical-state review normalization and completeness rules.",
    description:
      "Normalizes physical-state review rows returned by the character-state worker against the eligible character list, rejects unknown or duplicate names, clamps confidence, records whether location and scene position were reviewed, and identifies characters missing a complete review. It can produce one completeness row per eligible character for primary, focused-retry, or missing evidence.",
    rows: [],
    reviewedSource: "Manual review of contracts, name matching, deduplication, confidence clamping, missing-review calculation, and completeness output.",
  },
  {
    path: "/supabase/functions/_shared/usage-cost.ts",
    header: codeHeader,
    metric: "251 lines",
    metricDescription: "Central token, image, and fallback cost estimator for AI telemetry.",
    description:
      "Defines Chronicle's current Grok text-token rates, cached-input rate, image rates, fallback per-call estimate, and Responses pre-generation violation cost. It extracts provider usage metadata, combines multi-call usage, and estimates cost from provider tokens first, character counts second, image counts or configured fallbacks last while keeping non-provider result events at zero cost.",
    rows: [
      {
        id: "usage-cost-provider",
        title: "Provider-backed estimates",
        summary:
          "Calculates standard and cached input, output, image, extra-request, and pre-generation-violation costs when provider usage metadata is available.",
        badgeLabel: "COST MODEL",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "usage-cost-fallback",
        title: "Fallback and provenance labels",
        summary:
          "Falls back to character-to-token estimates, fixed image prices, or per-call estimates and labels the chosen calculation source so finance views do not present all numbers as equally precise.",
        badgeLabel: "ESTIMATE SOURCE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of pricing constants, event sets, provider metadata helpers, every estimate branch, request-count adjustments, and result labels.",
  },
  {
    path: "/supabase/functions/_shared/xai-responses.ts",
    header: codeHeader,
    metric: "335 lines",
    metricDescription: "Shared xAI Responses request, parsing, and stream-normalization adapter.",
    description:
      "Defines Chronicle's server-side xAI Responses message, request, usage, debug, and result contracts. It converts Chat Completions JSON-schema settings to the Responses text format, builds store:false reasoning requests, performs the authenticated provider fetch, extracts visible text and reasoning summaries, validates completed response envelopes, normalizes streaming events, captures usage, and produces sanitized model-request metadata for admin diagnostics.",
    rows: [
      {
        id: "xai-responses-request",
        title: "Responses request compiler",
        summary:
          "Transforms Chronicle role/content messages and optional output controls into the provider's input array, max-output-token, temperature, reasoning, storage, and structured-output fields.",
        badgeLabel: "REQUEST ADAPTER",
        badgeClass: "api-call",
        details: [],
      },
      {
        id: "xai-responses-parse",
        title: "Envelope and output validation",
        summary:
          "Rejects malformed, incomplete, failed, refusal-only, or textless responses as appropriate and extracts output_text, reasoning summaries, and token details from successful bodies.",
        badgeLabel: "RESPONSE PARSER",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "xai-responses-stream",
        title: "Streaming event normalization",
        summary:
          "Converts provider text deltas, reasoning deltas, completion, failure, and incomplete events into one predictable shape used by the chat edge function.",
        badgeLabel: "STREAM ADAPTER",
        badgeClass: "integration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of every exported type and helper, request construction, fetch path, body validation, output/usage extraction, and stream-event branches.",
  },
  {
    path: "/supabase/functions/admin-ai-usage-summary/index.ts",
    header: edgeHeader,
    metric: "206 lines",
    metricDescription: "Admin-only all-time AI activity counter endpoint.",
    description:
      "Authenticates the bearer token, verifies the caller's admin role, then uses the service role to count accepted user and assistant messages, image-bearing records, generated side characters, and authoritative ai_usage_events across character AI, support workers, memory, and image calls. It reconciles table-derived and tracked counts conservatively and returns counters plus diagnostics to the finance/admin usage overview.",
    rows: [],
    reviewedSource: "Manual review of auth/admin guards, parallel table and event queries, authoritative-source filter, counter reconciliation, response payload, and error handling.",
  },
  {
    path: "/supabase/functions/admin-ai-usage-timeseries/index.ts",
    header: edgeHeader,
    metric: "402 lines",
    metricDescription: "Admin-only time-bucketed AI usage and estimated-cost endpoint.",
    description:
      "Builds day, week, month, or year buckets, authenticates and admin-authorizes the caller, reads user/assistant messages and server-authoritative AI usage events, optionally scopes them to selected users, and aggregates generation counts plus estimated text and image cost into chart points. Message filtering resolves conversation ownership because messages do not store user_id directly.",
    rows: [
      {
        id: "usage-timeseries-buckets",
        title: "Calendar bucket construction",
        summary:
          "Creates labeled date intervals for the requested period and assigns message and usage-event timestamps to the matching point.",
        badgeLabel: "TIME SERIES",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "usage-timeseries-costs",
        title: "Authoritative event aggregation",
        summary:
          "Ignores non-server event sources, routes each event type to the correct counter, excludes failed generated results from success counts, and uses the shared estimator for text and image cost.",
        badgeLabel: "COST AGGREGATE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of period math, admin guard, optional user filter, conversation join, event routing, cost calculation, and final point normalization.",
  },
  {
    path: "/supabase/functions/admin-api-usage-test-report/index.ts",
    header: edgeHeader,
    metric: "355 lines",
    metricDescription: "Admin-only report builder for API usage test sessions.",
    description:
      "Loads recent ai_usage_test_sessions and their event rows under an admin-only service-role boundary, groups events by session, calculates call and cost summaries, and derives requested validation-row states from event metadata. It returns both report rows and pass/fail/blank summaries for the finance testing surface; it is separate from the local file-backed Validation Evidence Ledger.",
    rows: [],
    reviewedSource: "Manual review of admin guard, bounded session query, event grouping, numeric normalization, validation-state merge rules, summaries, and empty-state response.",
  },
  {
    path: "/supabase/functions/admin-media-cleanup/index.ts",
    header: edgeHeader,
    metric: "166 lines",
    metricDescription: "Admin-only destructive cleanup for legacy public avatar objects.",
    description:
      "Lists objects in the public avatars and private character-avatar buckets, gathers canonical avatar references from character, side-character, session-state, and profile rows, and supports two tightly named cleanup actions. One removes unreferenced public objects that already have private mirrors; the other uses scan_legacy_avatar_refs before removing broader unmirrored candidates. It supports dry runs, fixed filename patterns, chunked deletion, and never accepts caller-supplied object paths.",
    rows: [
      {
        id: "media-cleanup-selection",
        title: "Server-derived candidate selection",
        summary:
          "Restricts work to the legacy character-avatar filename pattern and independently verifies private mirrors and database references before an object becomes eligible.",
        badgeLabel: "DELETION GUARD",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
      {
        id: "media-cleanup-delete",
        title: "Dry-run and chunked removal",
        summary:
          "Returns candidate counts and samples without mutation when requested, otherwise deletes only the computed list in bounded Storage API chunks and returns deletion errors separately.",
        badgeLabel: "STORAGE CLEANUP",
        badgeClass: "integration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of admin auth, action allowlist, storage queries, reference collection, RPC scan, dry run, path pattern, and chunked deletion.",
  },
  {
    path: "/supabase/functions/api-usage-test-session/index.ts",
    header: edgeHeader,
    metric: "389 lines",
    metricDescription: "Admin-controlled lifecycle endpoint for API usage test sessions.",
    description:
      "Authenticates and admin-authorizes the caller, then gets, starts, resumes, updates, or stops that user's active ai_usage_test_session. Start requests validate database UUIDs for stories and conversations, preserve unresolved local identities in bounded metadata, resume the existing session for the same scenario, close a different active scenario before inserting a new session, and keep service-role writes scoped to the authenticated admin user.",
    rows: [
      {
        id: "test-session-resolve",
        title: "Story and conversation identity resolution",
        summary:
          "Distinguishes real database UUIDs from local shell identities, validates database references, and records unresolved context without pretending it is a foreign-key match.",
        badgeLabel: "IDENTITY CHECK",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "test-session-lifecycle",
        title: "Single active-session lifecycle",
        summary:
          "Resumes and refreshes context for the same active scenario, closes a previous scenario before creating another, and supports an idempotent stop path.",
        badgeLabel: "SESSION STATE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of request contracts, admin guard, get/start/stop branches, UUID validation, metadata normalization, resume logic, and writes.",
  },
  {
    path: "/supabase/functions/chat/index.ts",
    header: edgeHeader,
    metric: "1,899 lines",
    metricDescription: "Authenticated text-generation gateway for roleplay and builder/helper calls.",
    description:
      "Receives bounded authenticated chat requests from the browser, rate-limits by user, validates message count and size, optionally authorizes admin debug traces, and dispatches either the xAI Responses path used by roleplay or the legacy Chat Completions compatibility path used by helper calls. It streams normalized text and provider-status events back to the browser, applies deterministic output cleanup, handles content-filter/provider failures, records server-authoritative usage, and captures sanitized request/timing/context evidence for approved debug sessions.",
    rows: [
      {
        id: "chat-edge-ingress",
        title: "Authenticated and bounded ingress",
        summary:
          "Handles CORS, verifies the Supabase bearer token, applies a per-user request window, rejects oversized or malformed bodies and messages, clamps output limits, and normalizes the declared usage event type.",
        badgeLabel: "INGRESS",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
      {
        id: "chat-edge-responses",
        title: "Roleplay Responses transport",
        summary:
          "Calls xAI Responses with store disabled and medium reasoning, parses streaming or JSON output, performs the controlled content-redirect retry where applicable, preserves provider exit/error evidence, and emits Chronicle-compatible SSE.",
        badgeLabel: "API CALL",
        badgeClass: "api-call",
        details: [],
      },
      {
        id: "chat-edge-legacy",
        title: "Helper-call compatibility transport",
        summary:
          "Keeps non-roleplay builder and enhancement calls on the declared Chat Completions path, including structured-output handling and usage capture, without silently routing them through roleplay response-job behavior.",
        badgeLabel: "HELPER CALLS",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "chat-edge-evidence",
        title: "Cleanup, telemetry, and debug evidence",
        summary:
          "Normalizes punctuation and generated text, records token and request metadata, and prepends an admin-only debug trace describing the actual model request, roleplay context summary, retry path, and timing.",
        badgeLabel: "DEBUG EVIDENCE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of request contracts, ingress limits, auth/rate/debug guards, both provider transports, stream parsing, retry/error branches, cleanup, telemetry, and response emission.",
  },
  {
    path: "/supabase/functions/check-shared-keys/index.ts",
    header: edgeHeader,
    metric: "82 lines",
    metricDescription: "Admin-only provider-key configuration status check.",
    description:
      "Authenticates the caller, requires the admin role, reads shared app-settings needed for provider configuration, and reports whether Chronicle's shared AI keys or related settings are present without returning the secret values themselves. It is an operational diagnostic, not a key-management endpoint.",
    rows: [],
    reviewedSource: "Manual review of auth/admin guards, app_settings lookup, status-only response, and error handling.",
  },
  {
    path: "/supabase/functions/compress-day-memories/index.ts",
    header: edgeHeader,
    metric: "451 lines",
    metricDescription: "Post-turn worker that compresses one completed day of durable memory rows.",
    description:
      "Authenticates and rate-limits the owner, validates a bounded set of day-memory rows and rejects malformed entries, optionally authorizes an admin trace, and calls xAI Responses for one short micro-summary of supported durable facts. It normalizes and caps the synopsis, returns accepted input row IDs plus rejected-row reasons and provider evidence, and records call/result telemetry; the browser owns the later row-ID persistence and deletion decision.",
    rows: [
      {
        id: "memory-compression-input",
        title: "Row-identity input contract",
        summary:
          "Requires explicit memory row IDs, points, and day values so the caller can replace exactly the reviewed rows instead of deleting by broad day predicates.",
        badgeLabel: "INPUT REVIEW",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "memory-compression-output",
        title: "Bounded synopsis and disposition",
        summary:
          "Returns a word-boundary-trimmed micro-summary with accepted IDs, rejected inputs, usage, and optional admin trace; it never performs the database mutation itself.",
        badgeLabel: "SUPPORT RESULT",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of input normalization, auth/rate/debug guards, prompt and schema, Responses branches, synopsis cap, row dispositions, and telemetry.",
  },
  {
    path: "/supabase/functions/evaluate-goal-alignment/index.ts",
    header: edgeHeader,
    metric: "492 lines",
    metricDescription: "Shadow-mode post-turn classifier for goal support, resistance, drift, or neutrality.",
    description:
      "Authenticates and rate-limits the user, validates story and character goal inputs plus the latest exchange, optionally exposes an admin debug trace, and asks xAI Responses for structured alignment signals with bounded intensity, evidence, and reasons. It normalizes malformed or unsupported output into review rows and records usage. The current application consumes these as shadow evaluation evidence rather than directly rewriting goal state.",
    rows: [],
    reviewedSource: "Manual review of goal contracts, signal/intensity normalization, auth/rate/debug guards, structured prompt, malformed-output path, response normalization, and telemetry.",
  },
  {
    path: "/supabase/functions/evaluate-goal-progress/index.ts",
    header: edgeHeader,
    metric: "488 lines",
    metricDescription: "Post-turn classifier for evidence-backed story and character goal-step progress.",
    description:
      "Authenticates and rate-limits the owner, validates pending goal steps and the latest exchange, and calls xAI Responses for structured completed, progressed, or not-progressed decisions. It rejects generic or ungrounded evidence, clamps confidence, returns per-step classification reviews with malformed-output reasons when needed, optionally includes admin diagnostics, and records authoritative usage; the browser applies accepted results to current goal state.",
    rows: [],
    reviewedSource: "Manual review of step contracts, evidence normalization, generic-evidence rejection, auth/rate/debug guards, prompt, structured response handling, and telemetry.",
  },
  {
    path: "/supabase/functions/extract-character-updates/index.ts",
    header: edgeHeader,
    metric: "1,514 lines",
    metricDescription: "Post-turn character-state review and supported-field extraction worker.",
    description:
      "Reviews the latest user/assistant exchange against eligible main and side character state, requests only supported material updates from xAI Responses, validates field paths and values, verifies cited evidence appears in the latest exchange, reconciles structured arrays against existing entries, and reports accepted and rejected candidate dispositions. It also enforces physical-state review completeness, can make one focused retry for missing reviews, supports a safe fallback request after provider-format failure, emits admin-only model traces, and records every provider call and result in usage telemetry.",
    rows: [
      {
        id: "character-update-authority",
        title: "Field and evidence authority",
        summary:
          "Limits updates to the shared allowed field vocabulary, rejects unsupported values and weak evidence, and requires latest-exchange support before a candidate can be returned as accepted.",
        badgeLabel: "CANDIDATE REVIEW",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "character-update-reconciliation",
        title: "Structured-field reconciliation",
        summary:
          "Matches labeled rows against existing sections using normalized names and similarity, distinguishes meaningful refinement from duplication, and produces review details rather than directly writing database rows.",
        badgeLabel: "STATE REVIEW",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "character-update-completeness",
        title: "Physical-state completeness and retry",
        summary:
          "Requires each eligible character's location and scene position to be reviewed, invokes one focused follow-up for missing rows, and records whether evidence came from the primary or retry response.",
        badgeLabel: "COMPLETENESS",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of contracts, allowed fields, evidence matching, structured reconciliation, prompt assembly, primary/focused/safe Responses calls, dispositions, traces, and telemetry.",
  },
  {
    path: "/supabase/functions/extract-memory-events/index.ts",
    header: edgeHeader,
    metric: "521 lines",
    metricDescription: "Post-turn durable-memory candidate reviewer.",
    description:
      "Authenticates and rate-limits the owner, sends the latest exchange to xAI Responses, and normalizes a bounded candidate list with point text, durability category, source classification, evidence, confidence, accepted state, and rejection reason. It accepts only approved durable categories and source-authority classes, limits candidate and accepted counts, truncates memory points safely, returns full review dispositions and optional admin trace, and records provider usage. It does not persist memory rows itself.",
    rows: [],
    reviewedSource: "Manual review of category/source allowlists, candidate normalization, limits, auth/rate/debug guards, structured prompt, response branches, review output, and telemetry.",
  },
  {
    path: "/supabase/functions/generate-cover-image/index.ts",
    header: edgeHeader,
    metric: "341 lines",
    metricDescription: "Authenticated story-cover image generation and private storage endpoint.",
    description:
      "Validates the user and per-user image rate limit, resolves the selected art-style backend prompt from art_styles, submits the composed prompt to xAI image generation, decodes the returned image, uploads it to the owner-scoped private story-covers bucket, creates a signed URL, and records success or failure usage. It does not publish the cover publicly; publish-cover handles that separate transition.",
    rows: [],
    reviewedSource: "Manual review of auth/rate guards, style lookup, provider request, image decoding, private upload, signed URL, cleanup/error branches, and telemetry.",
  },
  {
    path: "/supabase/functions/generate-scene-image/index.ts",
    header: edgeHeader,
    metric: "596 lines",
    metricDescription: "Two-stage scene-image prompt analysis and generation endpoint.",
    description:
      "Authenticates and rate-limits the owner, sanitizes character appearance and clothing inputs, asks a text model to convert dialogue and location into a structured visual plan, combines that plan with the selected art-style prompt under a byte limit, and calls xAI image generation. It returns the generated image result and records provider usage; the caller owns the later scene record and storage workflow.",
    rows: [
      {
        id: "scene-image-analysis",
        title: "Source-bounded visual analysis",
        summary:
          "Builds the analysis request from permitted character appearance fields, recent dialogue, and location, normalizes the structured result, and avoids passing unrelated private character state.",
        badgeLabel: "ANALYSIS CALL",
        badgeClass: "api-call",
        details: [],
      },
      {
        id: "scene-image-generation",
        title: "Style and byte-budgeted image call",
        summary:
          "Resolves the style prompt, assembles a bounded final image prompt, calls the image endpoint, and returns the generated media payload with usage/error accounting.",
        badgeLabel: "IMAGE CALL",
        badgeClass: "integration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of permitted field sets, analysis prompt, normalization, byte-limit assembly, auth/rate guards, style lookup, both provider calls, and telemetry.",
  },
  {
    path: "/supabase/functions/generate-side-character-avatar/index.ts",
    header: edgeHeader,
    metric: "568 lines",
    metricDescription: "Character-avatar prompt optimization, generation, and private storage endpoint.",
    description:
      "Authenticates and rate-limits the owner, optionally resolves an art style, uses a text call to optimize a short portrait prompt, calls xAI image generation, decodes the result, stores it in the owner-scoped character_avatars_private bucket, and returns a signed URL. It supports both generated side-character and manual character-avatar event types, provides admin-only request traces, and records each provider stage and terminal result.",
    rows: [],
    reviewedSource: "Manual review of prompt optimizer, auth/rate/debug guards, style lookup, text and image calls, private storage path, signed URL, and telemetry branches.",
  },
  {
    path: "/supabase/functions/generate-side-character/index.ts",
    header: edgeHeader,
    metric: "437 lines",
    metricDescription: "Source-supported starter profile generator for newly introduced side characters.",
    description:
      "Authenticates and rate-limits the owner, asks the provider for a structured starter profile based on the side character's first appearance and world context, and then sanitizes every generated field against source support. Unsupported private or hidden details are blanked, the avatar prompt is rebuilt from accepted visible traits, optional admin debug evidence is returned, and usage is recorded. The browser performs the actual side-character row creation and later enrichment merge.",
    rows: [
      {
        id: "side-character-structured-profile",
        title: "Starter profile schema",
        summary:
          "Requests a bounded set of public identity, appearance, clothing, personality, relationship, goal, speech, and avatar-prompt fields instead of freeform card text.",
        badgeLabel: "PROFILE CALL",
        badgeClass: "api-call",
        details: [],
      },
      {
        id: "side-character-source-sanitize",
        title: "First-appearance support guard",
        summary:
          "Compares generated values with the supplied source text, removes unsupported hidden details, deduplicates prompt traits, and returns only the sanitized profile.",
        badgeLabel: "SOURCE GUARD",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of schema, source-support helpers, avatar prompt builder, profile sanitizer, auth/rate/debug guards, provider call, and telemetry.",
  },
  {
    path: "/supabase/functions/migrate-base64-images/index.ts",
    header: edgeHeader,
    metric: "126 lines",
    metricDescription: "Admin-only one-time migration of base64 image URLs into Storage.",
    description:
      "Authenticates and requires an admin role, scans stories, characters, and side characters for data:image avatar or cover fields, decodes each image, uploads it to the legacy public covers or avatars bucket, obtains the public URL, and updates the owning row. It skips ordinary URLs and reports per-category migration totals; this is maintenance tooling, not the normal media upload path.",
    rows: [],
    reviewedSource: "Manual review of admin guard, three table scans, data-URL checks, decode/upload/update loops, storage buckets, and response totals.",
  },
  {
    path: "/supabase/functions/publish-cover/index.ts",
    header: edgeHeader,
    metric: "173 lines",
    metricDescription: "Owner-authorized promotion of a private story cover to public storage.",
    description:
      "Authenticates the owner, calls resolve_story_cover_publish_metadata to verify story ownership and obtain the private source/public destination, downloads the private cover, uploads it to the public covers bucket, updates stories.cover_image_url, and removes superseded public objects where safe. A null source clears the public cover and database URL; the service role performs storage operations only after the ownership RPC succeeds.",
    rows: [],
    reviewedSource: "Manual review of request contract, auth, ownership RPC, clear-cover branch, private download, public upload, story update, and old-object cleanup.",
  },
  {
    path: "/supabase/functions/sync-guide-to-github/index.ts",
    header: edgeHeader,
    metric: "230 lines",
    metricDescription: "Admin-only GitHub writer for App Guide Markdown files.",
    description:
      "Authenticates the caller, requires Chronicle admin role, validates access to the configured GitHub repository, converts guide titles to safe filenames, reads the current file SHA, and creates, updates, or deletes Markdown under docs/guides through the GitHub Contents API. It does not allow arbitrary repository paths, and it reports GitHub response errors without exposing the configured token.",
    rows: [
      {
        id: "guide-sync-authorization",
        title: "Admin and repository boundary",
        summary:
          "Requires both a valid Chronicle admin session and a server-held GitHub token that can access the fixed owner, repository, and guides directory.",
        badgeLabel: "WRITE GUARD",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
      {
        id: "guide-sync-file-operation",
        title: "Version-aware file update",
        summary:
          "Fetches the existing file identity, base64-encodes UTF-8 guide content, and supplies the current SHA for safe update or deletion through GitHub's API.",
        badgeLabel: "GITHUB WRITE",
        badgeClass: "integration",
        details: [],
      },
    ],
    reviewedSource: "Manual review of fixed repository scope, slugging, GitHub headers/errors, access probe, SHA lookup, auth/admin guard, and create/update/delete branches.",
  },
  {
    path: "/supabase/functions/track-ai-usage/index.ts",
    header: edgeHeader,
    metric: "225 lines",
    metricDescription: "Authenticated client-diagnostic AI usage intake.",
    description:
      "Accepts only the explicit client diagnostic event vocabulary, authenticates the user, sanitizes metadata through a blocklist and scalar bounds, writes a client_diagnostic row to ai_usage_events, and mirrors a cost-estimated event into the user's active API usage test session when present. Server-authoritative provider events are recorded by the edge functions themselves; this endpoint does not let the browser forge that source classification.",
    rows: [],
    reviewedSource: "Manual review of event allowlist, metadata blocklist/sanitizer, auth, usage insert, active-session lookup, trace insert, and response branches.",
  },
  {
    path: "/supabase/functions/track-api-usage-test/index.ts",
    header: edgeHeader,
    metric: "193 lines",
    metricDescription: "Authenticated event intake for the current active API usage test session.",
    description:
      "Validates and bounds a client trace event, authenticates the user, requires an active ai_usage_test_session owned by that user, confirms any supplied session identity matches it, normalizes numeric and metadata fields, and inserts one ai_usage_test_event. It cannot attach a trace to another user's session and caps key, group, source, and model identifiers before persistence.",
    rows: [],
    reviewedSource: "Manual review of payload contract, length/numeric normalization, auth, active-session ownership, optional session match, insert shape, and failures.",
  },
  {
    path: "/supabase/functions/xai-billing-balance/index.ts",
    header: edgeHeader,
    metric: "248 lines",
    metricDescription: "Admin-only xAI prepaid balance and billing-status adapter.",
    description:
      "Authenticates and admin-authorizes the caller, queries xAI billing with server-held credentials, normalizes integer-cent value objects into dollars, and returns prepaid balance, invoice, source, and diagnostic status fields. It prefers the current management API and can fall back to the legacy billing endpoint; provider failures are returned as operational diagnostics rather than exposing credentials.",
    rows: [
      {
        id: "billing-balance-current",
        title: "Management API path",
        summary:
          "Reads current prepaid and invoice data from the configured management endpoint and converts provider amount fields into the dashboard's dollar contract.",
        badgeLabel: "BILLING API",
        badgeClass: "integration",
        details: [],
      },
      {
        id: "billing-balance-fallback",
        title: "Legacy fallback and provenance",
        summary:
          "Attempts the older API only when the management path is unavailable and identifies which source produced the result so finance UI can communicate reliability.",
        badgeLabel: "FALLBACK",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of response contracts, currency conversion, fetch handling, management and legacy parsers, admin guard, fallback order, and diagnostics.",
  },
  {
    path: "/supabase/functions/_shared/roleplay-artifact-identity.ts",
    header: codeHeader,
    metric: "15 lines",
    metricDescription: "Edge-runtime builder for observable roleplay artifact identity.",
    description:
      "Selects one generated edge manifest and adds the deployed source revision from the edge environment when available. The resulting identity travels with debug evidence so local validation can distinguish a matching deployed artifact from an unknown or mismatched runtime.",
    rows: [],
    reviewedSource: "Manual review of manifest-name typing, environment revision precedence, source-state derivation, and returned identity fields.",
  },
  {
    path: "/supabase/functions/_shared/roleplay-artifact-manifests.ts",
    header: codeHeader,
    metric: "172 lines",
    metricDescription: "Generated source manifests for roleplay-related Supabase edge artifacts.",
    description:
      "Contains deterministic source digests, individual file hashes, terminal migration, and contract versions for chat, memory extraction, character updates, goal progress, goal alignment, and day compression. The artifact generator owns this file and edge functions consume it read-only.",
    rows: [],
    reviewedSource: "Manual review of generator ownership, all six edge artifact manifests, source lists, digest fields, migration identity, and shared contract versions.",
  },
]);
