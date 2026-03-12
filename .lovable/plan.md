

# Make Inner Border Match Outer Border

The borders use the same hex (`#4a5f7f`), but the inner container's semi-transparent background (`bg-[#3a3a3f]/30`) makes the border appear dimmer due to contrast. Fix: make the inner background solid so the border renders identically.

## Change: `src/components/chronicle/WorldTab.tsx`

**Line 518** — Change `bg-[#3a3a3f]/30` to a solid equivalent `bg-[#2e2e33]` so the `#4a5f7f` border looks the same as the outer one.

