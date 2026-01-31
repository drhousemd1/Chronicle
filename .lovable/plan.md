
# Refresh Button & NSFW High Intensity Improvements

## Status: ✅ IMPLEMENTED

---

## Changes Made

### 1. Regeneration Divergence (Refresh Button)
**File: `src/services/llm.ts`**
- Added `isRegeneration?: boolean` parameter to `generateRoleplayResponseStream()`
- Added `REGENERATION DIRECTIVE - CRITICAL` that gets appended to user message when regenerating
- Directive explicitly tells AI to take a completely different approach, not just rephrase

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**
- Updated `handleRegenerateMessage` to pass `true` for `isRegeneration` flag

### 2. Aggressive NSFW High Intensity Prompt
**File: `src/services/llm.ts`**
- Replaced mild NSFW High prompt with aggressive version including:
  - **SEXUAL PROACTIVITY (MANDATORY)** - Characters actively pursue desire
  - **EXPLICIT CONTENT REQUIREMENTS** - Anatomical language, sensory detail, sounds
  - **CHARACTER SEXUAL AGENCY** - Act on desire, don't just think about it
  - **RESISTANCE ONLY WHEN WARRANTED** - Characters want intimacy by default
  - **PACING** - Quick tension build, momentum continues

---

## Testing Recommendations

1. **Regeneration divergence test**: Click refresh 3+ times - each should feel like a different story branch
2. **NSFW High escalation test**: With High mode, start a scene with mild flirtation - AI should escalate without user prompting
3. **Explicit language test**: With High mode, verify AI uses anatomical terms, not euphemisms
4. **Toggle comparison**: Switch between Normal and High mid-conversation - verify noticeable behavior change
