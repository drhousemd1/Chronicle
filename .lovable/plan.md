

## Page Header Button Restyling — All Pages

### Reference Standard (Source of Truth)

**File:** `src/pages/Index.tsx`, line 2025 — Story Builder "Import" button:

```
bg-[#303035] hover:bg-[#343439] active:bg-[#343439]
border-0
text-[#eaedf1] text-xs font-bold leading-none
rounded-xl
shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]
transition-all active:scale-95
disabled:opacity-50 disabled:pointer-events-none
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
```

All changes below are in **one file**: `src/pages/Index.tsx`. Every button listed uses the OLD style (`bg-[hsl(var(--ui-surface-2))]`, `border border-[hsl(var(--ui-border))]`, `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`, `uppercase tracking-wider`). Each gets replaced with the reference standard above. Text converted from ALL CAPS to title case. AI Fill button (line 2230) is **excluded**.

---

### Buttons to Update

| Line | Tab | Button | Text Change |
|------|-----|--------|-------------|
| 2118 | Chat History | Delete All | Remove `uppercase tracking-wider` |
| 2129 | My Stories | Settings cog | Icon-only, no text change |
| 2148 | Admin Guide | Theme toggle | Icon-only, no text change |
| 2156 | Admin Guide | Save | Remove `uppercase tracking-wider` |
| 2163 | Admin Guide | Sync All | Remove `uppercase tracking-wider` |
| 2174 | Admin Style Guide | Edits | Remove `uppercase tracking-wider` |
| 2187 | Admin Style Guide | Download | Remove `uppercase tracking-wider` |
| 2200 | Image Library | + Upload Images | Remove `uppercase tracking-wider` |
| 2209 | Image Library | Settings cog | Icon-only, no text change |
| 2286-2292 | Character Builder | Save | Remove `uppercase tracking-wider` |
| 2302-2308 | Character Builder | Cancel | Remove `uppercase tracking-wider` |
| 2320-2326 | Character Builder | +Character Library / Update | Remove `uppercase tracking-wider` |
| 2342 | Character Roster | Cancel | Remove `uppercase tracking-wider` |
| 2349 | Character Roster | Import from Library | Remove `uppercase tracking-wider` |
| 2356 | Character Roster | + New Character | Remove `uppercase tracking-wider` |

### Per-button className replacement

For every button above, the full className becomes (with minor variations for `gap-2`, `px-5` vs `px-6`, `w-10` for icon-only):

**Text buttons:**
```
inline-flex items-center [gap-2] justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
```

**Icon-only buttons (cog/theme toggle):**
```
inline-flex items-center justify-center h-10 w-10 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
```

### Exclusions
- **AI Fill button** (line 2230–2273) — iridescent style, untouched
- **Story Builder header buttons** (lines 2025, 2034, 2068, 2099) — already updated, untouched

