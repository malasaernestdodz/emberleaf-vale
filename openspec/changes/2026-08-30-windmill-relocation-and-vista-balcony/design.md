# Design: Windmill relocation + vista balcony

## Terrain ordering

Old model had three passes with the mill pad re-applied *last* via
`FEATURES.find(f => f.target === WINDMILL_Y)`. Any landmark whose flatten zone
overlapped the mill's 18 u reach lost to the mound; the house sat 15.6 u away.

Two coupled fixes, both required:

1. Move the mill to (34, -26): house distance 27.2 u > mill reach 18 u + house
   footprint margin. Pads no longer touch.
2. Single ordered pass: `[mill, well, plaza, house, mansion]` — pads lift
   terrain, flatten-to-zero landmarks re-flatten theirs. Documented in-code as
   load-bearing; guarded by a math invariant that the house footprint stays at
   exactly 0 even if someone later moves the mill closer again (the house pad
   applies after the mill pad, so overlap degrades to a slope, not a slice).

The path flatten and pond basin stay last (they never reach the mill).

## Balcony geometry (collision shape first)

- `MILL_BALCONY`: phi-arc `[phi0, phi1] = [2π − doorPhi − topPhi/2 − 0.25, 2π −
  doorHalf]`, radii `[rIn − 0.2, 7.3]`, at `MILL.base + MILL.top`.
- Walkable: `groundHeight` raises `h` to deck height inside the arc, gated on
  `curY > deck − 0.9` (same gate pattern as the spiral ramp and the mansion
  balcony), so the porch/skirt below stays walkable.
- Wall: cylinder theta = −walkable phi (mirrored). The doorway arc opens at
  cylinder thetas `[2π − phi1, 2π − phi0]`; one wall segment covers
  `[2π − phi0, 2π − doorHalf]` (flush with the door slit). Wall colliders skip
  `a < 2π − phi0 + halfA`.
- Guard rail: 6 tangential boxes (hw = 0.62 × chord, overlap-proof at
  PLAYER.r = 0.32) + 2 radial end panels, y0 = deck, top = deck + 1.05.
- Visuals merge into the spiral mesh's parts array (same wood material):
  deck ring, posts, two-bar rails, end panels, jambs, lintel, brackets →
  zero additional draw calls; deck uses DoubleSide via the shared material.
- Spiral mesh's landing was translated in *world* Y inside group space
  (`MILL.base + MILL.top`), floating it one `MILL.base` above the walkable —
  fixed to `MILL.top` (group space) matching the last spiral step.

## Purpose loop

Player walks the deck onto the telescope interactable (`MILL_LOOKOUT`, r 2.2),
presses E → `questEvent('lookout')` completes the new 7th quest with a flavor
toast + page sfx. `game.vista` latches so it fires once. `questEvent` gains a
per-quest completion flavor/sfx override for the lookout.
