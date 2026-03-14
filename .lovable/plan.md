

## Admin Panel Tile Cards — Match Visual Style to Other Pages

### Differences Found

| Feature | StoryHub (correct) | Admin (current) |
|---|---|---|
| **Hover lift** | On outer wrapper: `group-hover:-translate-y-3` | On inner card div: `group-hover:-translate-y-3` — moves the whole card up instead of just lifting |
| **Image zoom** | `transition-transform duration-700 group-hover:scale-110` on `<img>` | No zoom on image |
| **Bottom gradient** | Always-visible `bg-gradient-to-b from-transparent via-transparent to-black/70 z-[1]` | Missing entirely |
| **Bottom info z-index** | `z-[2]` on info container | No z-index |
| **Text color** | `text-white` for all subtext | `text-slate-300` for description |
| **Text shadow** | Triple-layer `textShadow` on info container | None |
| **Hover buttons** | `scale-90 group-hover:scale-100` pop-in effect, `z-10` | No scale animation, just opacity fade, `bg-black/30` full overlay |
| **Title hover color** | `group-hover:text-blue-300` | None |

### Changes to `src/pages/Admin.tsx`

1. **Outer wrapper** (line 139-142): Add `transition-all duration-300 group-hover:-translate-y-3` to the outer div, remove `-translate-y-3` from the inner card div.

2. **Inner card div** (line 144): Remove `group-hover:-translate-y-3`, keep `transition-shadow` only. Change `transition-all` to `transition-shadow`.

3. **Image** (line 149): Add `transition-transform duration-700 group-hover:scale-110` to `<img>`.

4. **Add gradient** after image/placeholder: `<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-[1]" />`

5. **Bottom info** (line 159): Add `z-[2]`, `pointer-events-none`, and `textShadow` style matching StoryHub.

6. **Description text** (line 161): Change `text-slate-300` to `text-white`.

7. **Title** (line 160): Add `group-hover:text-blue-300 transition-colors`.

8. **Hover buttons overlay** (line 166): Add `scale-90 group-hover:scale-100 duration-300 z-10`, keep `bg-black/30`.

