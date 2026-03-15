

## Plan: Match Header Buttons to Upload Image Button Style

Update the four Story Builder header buttons (Import, Export, Finalize and Close, Save Draft) to use the same raised shadow-surface styling as the Upload Image button on the Story Card.

### Target Style (from Upload Image button)
```
bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]
text-[#eaedf1] border-0
hover:bg-[#44464f] active:bg-[#44464f]
focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
```

### Changes (all in `src/pages/Index.tsx`)

Replace the className on all four buttons (lines 2025, 2034, 2068, 2099) from:
```
border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150
```

To:
```
border-0 bg-[#3c3e47] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#44464f] active:bg-[#44464f]
```

Keep `rounded-xl`, `h-10`, `px-5`/`px-6`, `text-xs font-bold`, `transition-all active:scale-95`, and `disabled:opacity-50 disabled:pointer-events-none` unchanged.

