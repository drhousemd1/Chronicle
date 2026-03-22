import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileUp } from "lucide-react";
import {
  apiInspectorGuideCombinedHtml,
  apiInspectorGuideStyles,
} from "@/data/api-inspector-guide-template";

const STORAGE_KEY = "chronicle-api-inspector-guide-html-v2";
const STORAGE_KEY_V3 = "chronicle-api-inspector-guide-html-v3";

type SidebarEntry = {
  id: string;
  label: string;
  targetId: string | null;
};

type SidebarGroup = {
  id: string;
  label: string;
  subtitle: string;
  entries: SidebarEntry[];
};

type SidebarLookupEntry = {
  id: string;
  label: string;
  type: "phase" | "item";
  match: string;
};

type SidebarLookupGroup = {
  id: string;
  label: string;
  subtitle: string;
  entries: SidebarLookupEntry[];
};

const SIDEBAR_BLUEPRINT: SidebarLookupGroup[] = [
  {
    id: "api-call-1",
    label: "API Call 1",
    subtitle: "Primary roleplay request",
    entries: [
      { id: "phase-1", label: "User Sends Message", type: "phase", match: "phase 1: user sends message" },
      {
        id: "phase-2",
        label: "System Prompt Assembly",
        type: "phase",
        match: "phase 2: system prompt assembly",
      },
      { id: "phase-3", label: "API Call 1 Fires", type: "phase", match: "phase 3: api call 1 fires" },
      {
        id: "sandbox-context",
        label: "Sandbox Context (Preamble)",
        type: "item",
        match: "sandbox context (preamble)",
      },
      {
        id: "world-context",
        label: "Story Builder: World Context",
        type: "item",
        match: "story builder page: world context",
      },
      {
        id: "character-serialization",
        label: "Character Serialization",
        type: "item",
        match: "character serialization",
      },
      { id: "message-array", label: "Message Array", type: "item", match: "message array" },
      {
        id: "content-filter",
        label: "403 Content Filter Retry",
        type: "item",
        match: "403 content filter retry",
      },
    ],
  },
  {
    id: "api-call-2",
    label: "API Call 2",
    subtitle: "Post-response processing",
    entries: [
      {
        id: "phase-5",
        label: "Post-Response Processing",
        type: "phase",
        match: "phase 5: post-response processing (api call 2)",
      },
      { id: "memory-lifecycle", label: "Memory Lifecycle", type: "item", match: "memory lifecycle" },
      { id: "phase-4", label: "Response Streaming", type: "phase", match: "phase 4: response streaming & display" },
    ],
  },
  {
    id: "api-call-3",
    label: "API Call 3",
    subtitle: "Generation and enhance flows",
    entries: [
      {
        id: "phase-6",
        label: "Image Generation Calls",
        type: "phase",
        match: "phase 6: image generation calls",
      },
      {
        id: "phase-7",
        label: "AI Character Generation Calls",
        type: "phase",
        match: "phase 7: ai character generation calls",
      },
    ],
  },
  {
    id: "character-ai-enhance",
    label: "Character Builder — AI Enhance",
    subtitle: "Container-targeted enrich calls",
    entries: [
      {
        id: "cb-basics",
        label: "Basics Container",
        type: "item",
        match: "character builder page: basics container",
      },
      {
        id: "cb-physical",
        label: "Physical Appearance",
        type: "item",
        match: "character builder page: physical appearance container",
      },
      {
        id: "cb-wearing",
        label: "Currently Wearing",
        type: "item",
        match: "character builder page: currently wearing container",
      },
      {
        id: "cb-clothing",
        label: "Preferred Clothing",
        type: "item",
        match: "character builder page: preferred clothing container",
      },
      {
        id: "cb-personality",
        label: "Personality",
        type: "item",
        match: "character builder page: personality container",
      },
      { id: "cb-tone", label: "Tone", type: "item", match: "character builder page: tone container" },
      {
        id: "cb-background",
        label: "Background",
        type: "item",
        match: "character builder page: background container",
      },
      {
        id: "cb-kle",
        label: "Key Life Events",
        type: "item",
        match: "character builder page: key life events container",
      },
      {
        id: "cb-relationships",
        label: "Relationships",
        type: "item",
        match: "character builder page: relationships container",
      },
      { id: "cb-secrets", label: "Secrets", type: "item", match: "character builder page: secrets container" },
      { id: "cb-fears", label: "Fears", type: "item", match: "character builder page: fears container" },
      {
        id: "cb-goals",
        label: "Goals & Desires",
        type: "item",
        match: "character builder page: goals & desires container",
      },
      {
        id: "cb-custom",
        label: "Custom Content",
        type: "item",
        match: "character builder page: custom content container",
      },
    ],
  },
  {
    id: "story-ai-enhance",
    label: "Story Builder — AI Enhance",
    subtitle: "Story-level target fields",
    entries: [
      {
        id: "sb-world-context",
        label: "World Context",
        type: "item",
        match: "story builder page: world context",
      },
      {
        id: "sb-content-themes",
        label: "Content Theme Directives",
        type: "item",
        match: "story builder page: content theme directives",
      },
      { id: "sb-codex", label: "Codex Entries", type: "item", match: "codex entries" },
      { id: "sb-memory", label: "Memory Block", type: "item", match: "memory block" },
      { id: "sb-temporal", label: "Temporal Context", type: "item", match: "temporal context" },
    ],
  },
];

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const apiInspectorExtraStyles = `
.pending-pipelines {
  margin: 8px 24px 28px;
  padding: 14px 16px 10px;
  border: 1px solid #e1d7cb;
  border-radius: 8px;
  background: #fffaf3;
}
.pending-pipelines .pending-header {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #b45309;
  letter-spacing: 0.02em;
}
.pending-pipelines .pending-sub {
  margin-top: 4px;
  margin-bottom: 10px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  color: #7c2d12;
}
.pending-pipelines .pending-tree {
  padding: 0;
}

/* Error/health status system */
.tag-icon { font-size: 10px; }
.tag.has-error {
  background: rgba(220, 38, 38, 0.1) !important;
  color: #dc2626 !important;
  border: 1px solid rgba(220, 38, 38, 0.4) !important;
  animation: error-pulse 2s ease-in-out infinite;
}
@keyframes error-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(220, 38, 38, 0.15); }
  50% { box-shadow: 0 0 12px rgba(220, 38, 38, 0.45), 0 0 4px rgba(220, 38, 38, 0.25); }
}
.error-note {
  color: #333;
  font-size: 11.5px;
  font-family: -apple-system, sans-serif;
  padding: 6px 10px;
  line-height: 1.5;
  margin: 4px 0 2px 0;
  background: #fff3f0;
  border-left: 3.5px solid #dc2626;
  border-radius: 0 4px 4px 0;
}
.error-note::before {
  content: '⚠ ';
  font-size: 12px;
}
.issue-label {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.4px;
  color: #111;
  margin-right: 4px;
}
.issue-type-key {
  margin: 10px 24px 16px;
  padding: 10px 14px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-family: -apple-system, sans-serif;
  font-size: 11.5px;
  line-height: 1.9;
  color: #444;
}
.issue-type-key .key-title {
  font-size: 12px;
  color: #111;
  font-weight: 700;
}
.issue-type-key .key-label {
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.4px;
  color: #111;
}
`;

const downloadBlob = (filename: string, content: string, mime = "text/html") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const normalizeGuideMarkup = (rawMarkup: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawMarkup, "text/html");

  doc.querySelectorAll("script").forEach((node) => node.remove());
  // Keep the guide's View Prompt controls, but remove inline onclick handlers
  // so React can own modal behavior.
  doc.querySelectorAll(".code-view-btn").forEach((node) => node.removeAttribute("onclick"));
  // Remove static modal shell from raw guide markup; React renders modal statefully.
  doc.querySelectorAll(".code-modal-overlay").forEach((node) => node.remove());

  // Rebuild Phase 3 (API Call 1) with explicit wire-level mapping so it's clear what
  // is actually transmitted from client -> edge -> xAI.
  const phaseNodes = Array.from(doc.querySelectorAll(".tree > .tree-node")) as HTMLElement[];
  const phase3Node = phaseNodes.find((node) =>
    normalizeText(node.querySelector(".phase-row .phase-label")?.textContent || "").startsWith("phase 3: api call 1 fires"),
  );
  const phase3Children = phase3Node?.querySelector(":scope > .children");
  if (phase3Children) {
    phase3Children.querySelectorAll('[data-generated="phase3-wire-map"]').forEach((node) => node.remove());

    const phase3WireMapHtml = `
      <div class="tree-node open" data-generated="phase3-wire-map">
        <div class="section-row" onclick="this.parentElement.classList.toggle('open')">
          <div class="chevron">▶</div>
          <span class="section-label">Wire Payload Mapping (Code Truth)</span>
          <span class="section-desc">— exactly what API Call 1 sends and receives</span>
        </div>
        <div class="children">
          <div class="item-row">
            <div class="item-name-row">
              <span class="tag code-logic"><span class="tag-icon">🔧</span> code logic</span>
              <span class="item-name code">Frontend → /functions/v1/chat Request Envelope</span>
              <span class="code-view-btn">▸ View Prompt</span>
              <span class="tag source">llm.ts</span>
            </div>
            <div class="file-ref">src/services/llm.ts (generateRoleplayResponseStream, lines ~831-901)</div>
            <div class="code-source">POST ${"${VITE_SUPABASE_URL}"}/functions/v1/chat
Headers:
- Content-Type: application/json
- Authorization: Bearer ${"${session.access_token}"}
- apikey: ${"${VITE_SUPABASE_PUBLISHABLE_KEY}"}

Body:
{
  "messages": [
    { "role": "system", "content": "__SYSTEM_INSTRUCTION__" },
    { "role": "user|assistant", "content": "__HISTORY_MESSAGE__" },
    { "role": "system", "content": "RUNTIME DIRECTIVES ... (optional)" },
    { "role": "user", "content": "__ASSEMBLED_USER_MESSAGE__" }
  ],
  "modelId": "grok-4-1-fast-reasoning",
  "stream": true,
  "max_tokens": 1024|2048|3072
}</div>
            <div class="item-desc">This is the exact browser request shape that leaves the app for API Call 1.</div>
            <div class="item-subs">
              <div class="item-sub">
                <span class="tag context-injection"><span class="tag-icon">📥</span> context injection</span>
                <span class="sub-name injection">messages[]</span>: <span class="sub-desc">Fully assembled array: system prompt + history + optional runtime directives + assembled user message.</span>
              </div>
              <div class="item-sub">
                <span class="tag context-injection"><span class="tag-icon">📥</span> context injection</span>
                <span class="sub-name injection">modelId</span>: <span class="sub-desc">Client-selected model id (currently intended to be Grok only).</span>
              </div>
              <div class="item-sub">
                <span class="tag context-injection"><span class="tag-icon">📥</span> context injection</span>
                <span class="sub-name injection">max_tokens</span>: <span class="sub-desc">Derived from verbosity: concise=1024, balanced=2048, detailed=3072.</span>
              </div>
            </div>
          </div>

          <div class="item-row">
            <div class="item-name-row">
              <span class="tag check"><span class="tag-icon">✓</span> validation check</span>
              <span class="item-name check">Edge Function Gatekeeping + Model Enforcement</span>
              <span class="tag source">chat/index.ts</span>
            </div>
            <div class="file-ref">supabase/functions/chat/index.ts (auth + model normalization, lines ~73-100)</div>
            <div class="item-desc">Before forwarding to xAI, the edge function verifies auth and normalizes model usage to app policy.</div>
            <div class="item-subs">
              <div class="item-sub">
                <span class="tag check"><span class="tag-icon">✓</span> validation check</span>
                <span class="sub-name check">Auth Check</span>: <span class="sub-desc">Requires Bearer token and validates user via Supabase Auth.</span>
              </div>
              <div class="item-sub">
                <span class="tag check"><span class="tag-icon">✓</span> validation check</span>
                <span class="sub-name check">Model Allowlist</span>: <span class="sub-desc">Only allows grok-4-1-fast-reasoning; other values are replaced with the allowlisted model.</span>
              </div>
              <div class="item-sub">
                <span class="tag check"><span class="tag-icon">✓</span> validation check</span>
                <span class="sub-name check">Required Fields</span>: <span class="sub-desc">Rejects if messages/modelId are missing.</span>
              </div>
            </div>
          </div>

          <div class="item-row">
            <div class="item-name-row">
              <span class="tag data-block"><span class="tag-icon">📦</span> data block</span>
              <span class="item-name core">Supabase → xAI /v1/chat/completions Payload</span>
              <span class="code-view-btn">▸ View Prompt</span>
              <span class="tag source">chat/index.ts</span>
            </div>
            <div class="file-ref">supabase/functions/chat/index.ts (callXAI, lines ~33-57)</div>
            <div class="code-source">POST https://api.x.ai/v1/chat/completions
Headers:
- Authorization: Bearer ${"${XAI_API_KEY}"}
- Content-Type: application/json

Body:
{
  "model": "grok-4-1-fast-reasoning",
  "messages": "__FORWARDED_FROM_CLIENT__",
  "stream": true|false,
  "temperature": 0.9,
  "max_tokens": "__FORWARDED_MAX_TOKENS__"
}</div>
            <div class="item-desc">This is the exact upstream payload forwarded to xAI after edge-function checks.</div>
            <div class="item-subs">
              <div class="item-sub">
                <span class="tag context-injection"><span class="tag-icon">📥</span> context injection</span>
                <span class="sub-name injection">messages</span>: <span class="sub-desc">Forwarded as-is from the browser payload after model/auth checks.</span>
              </div>
              <div class="item-sub">
                <span class="tag context-injection"><span class="tag-icon">📥</span> context injection</span>
                <span class="sub-name injection">temperature</span>: <span class="sub-desc">Pinned to 0.9 for API Call 1 in this edge function.</span>
              </div>
              <div class="item-sub">
                <span class="tag context-injection"><span class="tag-icon">📥</span> context injection</span>
                <span class="sub-name injection">max_tokens</span>: <span class="sub-desc">Forwarded from client (verbosity-based cap from llm.ts).</span>
              </div>
            </div>
          </div>

          <div class="item-row">
            <div class="item-name-row">
              <span class="tag code-logic"><span class="tag-icon">🔧</span> code logic</span>
              <span class="item-name code">Streaming Relay Contract (xAI SSE → Browser)</span>
              <span class="tag source">chat/index.ts + llm.ts</span>
            </div>
            <div class="file-ref">supabase/functions/chat/index.ts (stream response relay, lines ~107-121)
src/services/llm.ts (SSE parse loop, lines ~911-971)</div>
            <div class="item-desc">For stream=true, edge returns text/event-stream directly, and the frontend parses only data: lines with delta.content chunks.</div>
            <div class="item-subs">
              <div class="item-sub">
                <span class="tag code-logic"><span class="tag-icon">🔧</span> code logic</span>
                <span class="sub-name code">Edge Headers</span>: <span class="sub-desc">text/event-stream, no-cache, keep-alive.</span>
              </div>
              <div class="item-sub">
                <span class="tag code-logic"><span class="tag-icon">🔧</span> code logic</span>
                <span class="sub-name code">Client Parser</span>: <span class="sub-desc">Skips blank/comments, reads "data: " JSON, yields choices[0].delta.content, stops on [DONE].</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    phase3Children.insertAdjacentHTML("beforeend", phase3WireMapHtml);

    const contentFilterRow = Array.from(phase3Children.querySelectorAll(".item-row")).find((row) =>
      normalizeText(row.querySelector(".item-name")?.textContent || "").includes("403 content filter retry"),
    );
    if (contentFilterRow && !contentFilterRow.querySelector(".item-subs")) {
      contentFilterRow.insertAdjacentHTML(
        "beforeend",
        `
          <div class="item-subs">
            <div class="item-sub">
              <span class="tag code-logic"><span class="tag-icon">🔧</span> code logic</span>
              <span class="sub-name code">Retry Insertion Point</span>: <span class="sub-desc">Injects CONTENT_REDIRECT_DIRECTIVE as a system message immediately before the final user message.</span>
            </div>
            <div class="item-sub">
              <span class="tag check"><span class="tag-icon">✓</span> validation check</span>
              <span class="sub-name check">Failure Outcome</span>: <span class="sub-desc">If retry still fails, edge returns 422 + error_type=content_filtered and client shows fallback message.</span>
            </div>
          </div>
        `,
      );
    }
  }

  const primaryTree = doc.querySelector(".tree");
  if (primaryTree) {
    const detachedNodes: HTMLElement[] = [];
    const topLevelNodes = Array.from(primaryTree.children).filter((child) =>
      child.classList?.contains("tree-node"),
    ) as HTMLElement[];

    topLevelNodes.forEach((node) => {
      const phaseLabel = normalizeText(node.querySelector(".phase-row .phase-label")?.textContent || "");
      if (
        phaseLabel.startsWith("phase 4:") ||
        phaseLabel.startsWith("phase 5:") ||
        phaseLabel.startsWith("phase 6:") ||
        phaseLabel.startsWith("phase 7:")
      ) {
        detachedNodes.push(node);
      }
    });

    if (detachedNodes.length > 0) {
      const pendingWrapper = doc.createElement("div");
      pendingWrapper.className = "pending-pipelines";
      pendingWrapper.innerHTML = `
        <div class="pending-header">Additional Pipelines (Not Part of API Call 1)</div>
        <div class="pending-sub">
          These phases are separate flows: response streaming, API Call 2 post-processing, image generation, and AI character generation.
        </div>
      `;

      const pendingTree = doc.createElement("div");
      pendingTree.className = "tree pending-tree";
      detachedNodes.forEach((node) => pendingTree.appendChild(node));
      pendingWrapper.appendChild(pendingTree);

      const changelog = doc.querySelector(".changelog");
      if (changelog?.parentElement) {
        changelog.parentElement.insertBefore(pendingWrapper, changelog);
      } else {
        primaryTree.insertAdjacentElement("afterend", pendingWrapper);
      }
    }
  }

  // Normalize all tag icons to text-based health status:
  // ✓ default/healthy, ⚠ for tags explicitly marked .has-error.
  doc.querySelectorAll(".tag:not(.source)").forEach((tagNode) => {
    const tag = tagNode as HTMLElement;
    let icon = tag.querySelector(".tag-icon") as HTMLElement | null;
    if (!icon) {
      icon = doc.createElement("span");
      icon.className = "tag-icon";
      tag.insertBefore(icon, tag.firstChild);
    }
    icon.textContent = tag.classList.contains("has-error") ? "⚠" : "✓";
  });

  // Issue-type key panel used by audits (human-readable taxonomy).
  if (!doc.querySelector("#issueTypeKeyPanel")) {
    const issueTypeKey = doc.createElement("div");
    issueTypeKey.id = "issueTypeKeyPanel";
    issueTypeKey.className = "issue-type-key";
    issueTypeKey.innerHTML = `
      <div class="key-title">Issue Type Key</div>
      <div><span class="key-label">MISSING FILE</span> — A field or block expected in the prompt but not present at all</div>
      <div><span class="key-label">MISSING CONTEXT</span> — Data is passed but has no description or framing for the LLM</div>
      <div><span class="key-label">UNLABELED BLOCK</span> — Data exists but has no header or delimiter for the LLM to parse</div>
      <div><span class="key-label">FORMAT MISMATCH</span> — Data shape doesn't match what the LLM expects</div>
      <div><span class="key-label">DEPRIORITIZED</span> — Content likely ignored due to position or length in context window</div>
      <div><span class="key-label">STALE DATA</span> — Content not refreshing or updating when it should</div>
      <div><span class="key-label">REDUNDANT</span> — Duplicate content wasting context window space</div>
      <div><span class="key-label">TRUNCATION RISK</span> — Content may exceed a limit and get cut off</div>
      <div><span class="key-label">FLOW BROKEN</span> — Pipeline from data source to prompt assembly is interrupted</div>
    `;
    const tree = doc.querySelector(".tree");
    if (tree) {
      tree.insertAdjacentElement("beforebegin", issueTypeKey);
    }
  }

  return doc.body.innerHTML.trim();
};

const defaultGuideMarkup = normalizeGuideMarkup(apiInspectorGuideCombinedHtml);

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const buildStandaloneHtml = (innerMarkup: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Chronicle - System Architecture Map</title>
<style>${apiInspectorGuideStyles}
${apiInspectorExtraStyles}</style>
</head>
<body>
${innerMarkup}
</body>
</html>`;

const ApiInspectorPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [guideMarkup, setGuideMarkup] = useState<string>(defaultGuideMarkup);
  const [importError, setImportError] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<{ title: string; source: string } | null>(null);
  const [sidebarGroups, setSidebarGroups] = useState<SidebarGroup[]>([]);
  const [activeSidebarEntryId, setActiveSidebarEntryId] = useState<string | null>(null);

  useEffect(() => {
    // Drop old key that may contain a stripped version without View Prompt controls.
    localStorage.removeItem(STORAGE_KEY);
    const saved = localStorage.getItem(STORAGE_KEY_V3);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { html?: string };
      if (parsed?.html && typeof parsed.html === "string") {
        setGuideMarkup(normalizeGuideMarkup(parsed.html));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_V3, JSON.stringify({ html: guideMarkup }));
  }, [guideMarkup]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const onClickCapture = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const promptBtn = target.closest(".code-view-btn") as HTMLElement | null;
      if (!promptBtn) return;

      event.preventDefault();
      event.stopPropagation();

      const item = promptBtn.closest(".item-row");
      const source = item?.querySelector(".code-source")?.textContent?.trim();
      if (!source) return;

      const title =
        item?.querySelector(".item-name")?.textContent?.trim() ||
        promptBtn.textContent?.trim() ||
        "Prompt Source";

      setActivePrompt({ title, source });
    };

    root.addEventListener("click", onClickCapture, true);
    return () => root.removeEventListener("click", onClickCapture, true);
  }, [guideMarkup]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const phaseMap = new Map<string, string>();
    const itemMap = new Map<string, string>();
    let phaseCounter = 0;
    let itemCounter = 0;

    root.querySelectorAll<HTMLElement>(".phase-row").forEach((phaseRow) => {
      const label = normalizeText(phaseRow.querySelector(".phase-label")?.textContent || "");
      const phaseNode = phaseRow.closest(".tree-node") as HTMLElement | null;
      if (!phaseNode) return;

      if (!phaseNode.id) {
        phaseCounter += 1;
        phaseNode.id = `api-inspector-phase-${phaseCounter}-${toSlug(label || `phase-${phaseCounter}`)}`;
      }

      if (label && !phaseMap.has(label)) {
        phaseMap.set(label, phaseNode.id);
      }
    });

    root.querySelectorAll<HTMLElement>(".item-row").forEach((itemRow) => {
      const itemName = normalizeText(itemRow.querySelector(".item-name")?.textContent || "");
      if (!itemRow.id) {
        itemCounter += 1;
        itemRow.id = `api-inspector-item-${itemCounter}-${toSlug(itemName || `item-${itemCounter}`)}`;
      }

      if (itemName && !itemMap.has(itemName)) {
        itemMap.set(itemName, itemRow.id);
      }
    });

    const groups: SidebarGroup[] = SIDEBAR_BLUEPRINT.map((group) => {
      const entries: SidebarEntry[] = group.entries.map((entry) => {
        const normalizedMatch = normalizeText(entry.match);
        const targetId = entry.type === "phase" ? phaseMap.get(normalizedMatch) || null : itemMap.get(normalizedMatch) || null;
        return {
          id: `${group.id}-${entry.id}`,
          label: entry.label,
          targetId,
        };
      });

      return {
        id: group.id,
        label: group.label,
        subtitle: group.subtitle,
        entries,
      };
    });

    setSidebarGroups(groups);
    const firstAvailable = groups.flatMap((group) => group.entries).find((entry) => entry.targetId);
    setActiveSidebarEntryId(firstAvailable?.id || null);
  }, [guideMarkup]);

  const openTreeAncestors = (target: HTMLElement) => {
    let current: HTMLElement | null = target;
    while (current) {
      const treeNode = current.closest(".tree-node") as HTMLElement | null;
      if (!treeNode) break;
      treeNode.classList.add("open");
      current = treeNode.parentElement;
    }
  };

  const jumpToNode = (id: string) => {
    const root = contentRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!target) return;

    openTreeAncestors(target);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportedHtml = useMemo(() => buildStandaloneHtml(guideMarkup), [guideMarkup]);

  const openImportPicker = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await file.text();
      let htmlCandidate = raw;

      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.html === "string") {
          htmlCandidate = parsed.html;
        } else {
          throw new Error("JSON import must contain an `html` field.");
        }
      }

      const normalized = normalizeGuideMarkup(htmlCandidate);
      if (!normalized) {
        throw new Error("Imported file is empty after normalization.");
      }

      setGuideMarkup(normalized);
      setImportError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import guide file.";
      setImportError(message);
    } finally {
      event.target.value = "";
    }
  };

  const handleExport = () => {
    const name = `chronicle-system-architecture-map-${new Date().toISOString().slice(0, 10)}.html`;
    downloadBlob(name, exportedHtml);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <style>{`${apiInspectorGuideStyles}\n${apiInspectorExtraStyles}`}</style>

      <header className="flex-shrink-0 h-14 border-b border-slate-200 bg-white flex items-center px-4 lg:px-8 shadow-sm gap-3 z-20">
        <button
          type="button"
          onClick={() => navigate("/?tab=admin&adminTool=style_guide")}
          className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>

        <h1 className="text-[22px] font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
          API Inspector
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl px-5 h-9 text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer bg-[#2d3440] text-[#e8ecf0] border-white/[0.08] hover:bg-[#3a4350] shadow-md"
            onClick={openImportPicker}
          >
            <FileUp size={14} /> Import
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl px-5 h-9 text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer bg-[#2d3440] text-[#e8ecf0] border-white/[0.08] hover:bg-[#3a4350] shadow-md"
            onClick={handleExport}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="text/html,application/json,.html,.json"
        className="hidden"
        onChange={handleImport}
      />

      {importError ? (
        <div className="mx-4 mt-3 border border-red-300 bg-red-50 text-red-700 rounded-md px-3 py-2 text-xs">
          {importError}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <style>{`
          .api-inspector-sidebar {
            width: 258px;
            background: #ffffff;
            border-right: 1px solid #d9dee6;
            overflow-y: auto;
            flex-shrink: 0;
            font-family: system-ui, sans-serif;
            box-shadow: 2px 0 8px rgba(15, 23, 42, 0.04);
          }
          .api-inspector-sidebar .sb-group-header {
            padding: 14px 16px 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .api-inspector-sidebar .sb-group-number {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: #4a5f7f;
          }
          .api-inspector-sidebar .sb-group-desc {
            font-size: 10px;
            color: #334155;
          }
          .api-inspector-sidebar .sb-tree {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-left: 16px;
            padding: 4px 0;
          }
          .api-inspector-sidebar .sb-tree::before {
            content: '';
            position: absolute;
            left: 7px;
            top: 0;
            bottom: 20px;
            width: 2px;
            background: #333;
          }
          .api-inspector-sidebar .sb-item {
            position: relative;
            background: none;
            border-radius: 0;
            box-shadow: none;
            margin: 0;
            padding: 8px 8px 8px 26px;
            text-align: left;
            border: none;
            cursor: pointer;
          }
          .api-inspector-sidebar .sb-item::before {
            content: '';
            position: absolute;
            left: 7px;
            top: 50%;
            transform: translateY(-50%);
            width: 11px;
            height: 12px;
            border-left: 2px solid #333;
            border-bottom: 2px solid #333;
            border-radius: 0 0 0 3px;
          }
          .api-inspector-sidebar .sb-item .si-title {
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
            transition: color .12s ease;
          }
          .api-inspector-sidebar .sb-item:hover .si-title {
            color: #4a5f7f;
          }
          .api-inspector-sidebar .sb-item.active .si-title {
            color: #4a5f7f;
            font-weight: 700;
          }
          .api-inspector-sidebar .sb-item.missing {
            opacity: 0.45;
            cursor: default;
          }
          .api-inspector-sidebar .sb-item.missing:hover .si-title {
            color: #0f172a;
          }
          .api-inspector-sidebar .sb-divider {
            height: 1px;
            background: #d9dee6;
            margin: 8px 12px;
          }
        `}</style>

        <aside className="api-inspector-sidebar hidden md:block">
          {sidebarGroups.map((group, index) => (
            <div key={group.id}>
              <div className="sb-group-header">
                <div className="sb-group-number">{group.label}</div>
                <div className="sb-group-desc">{group.subtitle}</div>
              </div>

              <div className="sb-tree">
                {group.entries.map((entry) => {
                  const isMissing = !entry.targetId;
                  const isActive = activeSidebarEntryId === entry.id && !isMissing;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={`sb-item ${isActive ? "active" : ""} ${isMissing ? "missing" : ""}`.trim()}
                      onClick={() => {
                        if (!entry.targetId) return;
                        setActiveSidebarEntryId(entry.id);
                        jumpToNode(entry.targetId);
                      }}
                      disabled={isMissing}
                    >
                      <span className="si-title">{entry.label}</span>
                    </button>
                  );
                })}
              </div>

              {index < sidebarGroups.length - 1 ? <div className="sb-divider" /> : null}
            </div>
          ))}
        </aside>

        <div className="flex-1 overflow-auto" ref={contentRef} dangerouslySetInnerHTML={{ __html: guideMarkup }} />
      </div>

      {activePrompt ? (
        <div
          className="code-modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-label="Prompt source modal"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActivePrompt(null);
            }
          }}
        >
          <div className="code-modal">
            <div className="code-modal-header">
              <span>{activePrompt.title}</span>
              <button
                type="button"
                className="code-modal-close"
                aria-label="Close prompt modal"
                onClick={() => setActivePrompt(null)}
              >
                ×
              </button>
            </div>
            <div className="code-modal-body">{activePrompt.source}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ApiInspectorPage;
