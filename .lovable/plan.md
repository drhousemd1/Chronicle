

## Move Sexual Orientation Into the Right Column

**File:** `src/components/chronicle/CharactersTab.tsx`

### Change 1 — Insert Sexual Orientation field after Age/Sex row, before toggles (lines 1411-1412)

After the closing `</div>` of the Age/Sex grid (line 1411), insert the Sexual Orientation field block (full width, same styling as Name/Nicknames):

```tsx
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sexual Orientation</label>
                            <AutoResizeTextarea value={selected.sexualOrientation || ''} onChange={(v) => onUpdate(selected.id, { sexualOrientation: v })} placeholder="Heterosexual, Bisexual, etc." className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border-t border-black/35 border-x-0 border-b-0 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-1">
```

### Change 2 — Remove the old Sexual Orientation from "Below grid" section (lines 1453-1456)

Delete the Sexual Orientation `<div>` block from the "Below grid" section so it's not duplicated.

Order in the right column will be: Name → Nicknames → Age/Sex → **Sexual Orientation** → Controlled By / Character Role toggles.

