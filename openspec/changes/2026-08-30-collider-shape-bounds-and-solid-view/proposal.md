# Change: Collider shape bounds everywhere + solid shape debug view

- **Date:** 2026-08-30
- **Type:** Bug fix (collision-shape fidelity) + feature (debug view)

## Why

Playtesting with the collider debug overlay ([C]) on showed the overlay lying about
the world:

1. **House and mansion walls rendered as 14-unit towers.** Every wall collider was
   created without a `top`, so `colliderBlocks` treated it as infinite and the debug
   drawer scaled it to the 14 u cap — orange boxes towered far above the 2.9 u
   cottage and loomed over the mansion roofline.
2. **Tree trunks had infinite colliders.** Each tree blocked up to infinity and drew
   a 14 u cyan cylinder into the sky; the visible canopy tops out around 4.6 u even
   for the largest specimen.
3. **Windmill wall ring and center pole started at the world floor.** The tower sits
   on a mound (`MILL.base` ≈ 5 u), but its colliders spanned from y 0, drawing a
   cage that floated around the plinth instead of hugging the visible wall.
4. **Small props (fountain statue, well posts, bookshelf) drew to the cap** even
   though the meshes are 2–2.6 u tall.
5. **The wireframe-only overlay is hard to read end to end.** Lines show edges but
   not volume; there was no way to see the shapes as solid geometry from any angle.

Grass issues spotted during the same playthrough are deliberately **out of scope**
here — they are tracked in the deferred `2026-08-30-grass-density-and-depth-pass`
change for the next sprint.

## What Changes

- **Every collider gets explicit finite bounds** (`y0`/`top`) matched to its visible
  mesh: cottage walls cap at `HOUSE.h`, bookshelf at 1.9, mansion full-height walls
  at `MANSION.hWall` (new constant), fountain column at 2.6, well posts
  y0 0.4 → 2.0, windmill wall ring `MILL.base + floorH → base + 0.6 + MILL_TOWER.h`,
  windmill center pole `base + floorH → base + 14.2`, chimney unchanged.
- **Tree colliders slim down and cap:** radius 0.5 s → 0.45 s, `top = 3.4 s`
  (trunk + lower canopy); the chop/regrow cycle in `lib/trees.ts` keeps both values.
- **Solid shape debug view:** new `game.colliderSolid` state toggled with [V] or the
  new "[V] solid shapes" HUD button renders every collider as a translucent solid
  mesh (same active/inactive/raised color coding as the wires), stackable with the
  [C] wireframe overlay; the player capsule gets a solid twin; the COLLIDER DEBUG
  panel opens for either mode and the legend documents both.
- **End-to-end verification:** new `e2e/collider.spec.ts` — finite bounds for every
  collider, tree-cap parity against `TREES`, [C]/[V] toggle flow with draw-call and
  fps budgets, screenshots of the solid view at the house / windmill / trees, and
  mesh-vs-collider raycast parity at the fountain column, windmill wall and a tree.

## Impact

- Spec deltas: `collider-shape-bounds` (new), `collider-debug-view` (new).
- Code: `lib/world.ts`, `lib/trees.ts`, `scene/Colliders.tsx`, `scene/Probe.tsx`,
  `App.tsx`. No new colliders, no physics engine, no per-frame allocations; solid
  shells reuse the wireframe geometry (one shared buffer per collider) and are only
  visible while the debug view is on, so the boot draw-call budget is untouched.
- Tests: new `e2e/collider.spec.ts`; existing specs keep passing (no collider moved,
  only bounded — `resolveCollisions` behavior at gameplay heights is unchanged).
