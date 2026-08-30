# Change: Grass density, depth and placement pass (DEFERRED — next sprint)

- **Date:** 2026-08-30
- **Type:** Deferred polish pass (do not implement this sprint)
- **Status:** Backlog — created from playtest notes on 2026-08-30; owner picked it
  up as a later-sprint item. No code changes belong to this change yet.

## Why

Playtesting the current vale with the collider overlays on confirmed the grass
system needs a focused pass. Nothing here blocks gameplay; the items below are the
known rough edges the user explicitly deferred ("I know there's a lot to fix in
grass, I'll put it in a later sprint"):

1. **Density clumps and bare patches.** Instanced blades follow noise but pile up
   on paths' edges and starve some meadow patches; the distribution ignores the
   new mound/porch terrain features when seeding.
2. **Depth fighting with walkable surfaces.** Blades poke through the cottage
   floor skirt, the windmill porch ring and the mansion slab edges; the grass
   placement height samples raw terrain instead of `groundHeight`, so surfaces
   added recently (porch, stairwell landing, roof walk) are not respected.
3. **Wind sway looks uniform.** Every blade sways on the same phase within a
   chunk, producing visible wave bands instead of gusts.
4. **Auto-tune drops grass too aggressively.** The perf governor halves density
   on the first sub-50 fps spike and restores it slowly, so short hitches cause
   long bald spells.

## What Changes (planned)

- Seed blade placement from `groundHeight` (cheap precomputed grid, not per-frame)
  and add exclusion radii around building footprints, porch and slab edges.
- Rebalance density falloff: keep path shoulders trim, raise meadow minimums,
  cap clumping with a blue-noise rejection pass in the seeder.
- Per-blade phase jitter from the existing seeded PRNG for gust-style sway.
- Soften the governor: hysteresis + slow ramp on density changes (fast drop only
  on sustained sub-40 fps).
- Keep budgets: instancing only, zero per-frame allocations, boot
  `drawCalls <= 190`, grass blade count floor (10k in LITE) untouched.

## Impact

- Spec deltas: `grass-system` (modified requirements — placement, sway,
  governor hysteresis), `e2e-verification` (grass screenshot + density probes).
- Code: `scene/Grass.tsx`, `lib/perf.ts`; tests: `e2e/world.spec.ts` budget
  assertions stay, new grass-specific assertions land with the implementation.

## Explicitly out of scope until this change is activated

Any `scene/Grass.tsx` edits. The `2026-08-30-collider-shape-bounds-and-solid-view`
change and the windmill/mansion collision work must land first so grass placement
can sample the final surfaces.
