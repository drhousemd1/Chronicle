

# Fix Duplicate API Call 2 in Sidebar

## Problem
The sidebar in `public/api-call-inspector-chronicle.html` contains **two** "API Call 2" sections (lines 735-759 and lines 773-794). The second is a duplicate missing the "Narrative Directive" item. There is only one content section for `api-call-2`, so the duplicate sidebar block is pure redundancy.

## Fix

**File: `public/api-call-inspector-chronicle.html`**

Delete lines 772-794 — the duplicate "API Call 2" sidebar group (divider + header + tree with 4 items). This leaves the correct single API Call 2 block (lines 735-759) which already includes all 5 items: Character Extraction, Memory Extraction, Arc Progress Eval, Memory Compression, and Narrative Directive.

No other changes needed — the content sections (`api-call-1`, `api-call-2`, `api-call-3`) and the remaining sidebar groups (Text Field Generation, Image Generation) are all correctly categorized and non-duplicated.

