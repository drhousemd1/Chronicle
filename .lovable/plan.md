

## Fix: Button Previews Invisible on White Background

**Root cause**: The ButtonCardV2 preview strip has a **white background** (`#fff`), but these Story Detail buttons use `bg-white/5` and `text-white` — making them completely invisible against white.

The Edit button looks blank because it's a white-text, nearly-transparent button on a white preview strip. The Like card only shows "Liked" because the default "Like" state is also white-on-white. The Save card shows a ghost element for the same reason.

### Fix (lines 1170-1244)

Add a **dark preview background** to each of these 5 button previews by wrapping them in a container with a dark background (e.g., `background: '#1a1a2e'`, `borderRadius: 12`, `padding: '16px 20px'`, `width: '100%'`, `display: 'flex'`, `justifyContent: 'center'`). This matches how these buttons actually appear in the app (dark modal).

**Specific changes per button:**

1. **Story Detail — Edit** (line 1181): Wrap the button in a dark container so `bg-white/5` and `text-white` are visible
2. **Story Detail — Play** (line 1195): Wrap in dark container for consistency (blue button is visible either way but looks more accurate on dark)
3. **Story Detail — Like** (lines 1209-1212): Wrap the flex div in a dark container so both default (`text-white`) and active states show
4. **Story Detail — Save** (lines 1226-1229): Same dark container wrapper
5. **Story Detail — Remove from Gallery** (line 1243): Wrap in dark container so `text-white/60` is visible

Each preview becomes:
```tsx
preview={
  <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 20px', width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}>
    <button className="...">...</button>
  </div>
}
```

This is the same pattern — just adding an inner dark container since these are dark-modal buttons that cannot render on white.

