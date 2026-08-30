# Change: Windmill collision shape, working entry stairs, mansion stairwell, mesh-matched surfaces

- **Date:** 2026-08-30
- **Type:** Bug fix + collision-shape fidelity pass (windmill first)

## Why

User feedback from playtesting the current build:

1. **The windmill entrance is broken.** The stone plinth (1.2 u tall, radius 5.7–6.1)
   has no collider and no walkable surface, while the walkable door threshold and the
   whole interior floor sit at `MILL.base + 0.02`. The player wades *through* the solid
   stone base — only the head pokes above the threshold — and the spiral staircase looks
   like it floats in mid-air, disconnected from the floor the player stands on, so the
   tower reads as unclimbable.
2. **The mansion second floor covers the stairs.** The floor-2 slab is a single box
   spanning the entire stair run, so the top steps, the stringer, and the rail wall all
   poke through the slab. There is no visible stairwell opening, and on floor 2 the
   stairs just disappear under the boards.
3. **Collision shapes must fit the visible meshes** everywhere the player can stand —
   the cottage's big flared roof hut is currently pure visual with no matching walkable
   surface — but the fix must stay cheap: merged geometry, no physics engine, no
   per-frame allocations, existing draw-call budget untouched.

## What Changes

- **Windmill ground model rebuilt to match the mesh (collision shape first):**
  - Plinth top becomes a walkable porch at `MILL.base + 1.2` (`MILL.floorH`), ring
    `rIn → 5.7`; the plinth skirt (5.7 → 6.1) becomes a walkable slope down to terrain,
    so nothing clips the stone base anymore.
  - Two stone entry steps (0.4 rise each, ≤ `PLAYER.step`) at the door give ground
    access; the door wedge and the whole interior floor now sit at porch height, so the
    threshold is flush with the plinth top.
  - The spiral walkable ramps from `floorH` up to the landing at `MILL.top`, restricted
    to an outer annulus (`d > 1.8`) and gated on current height (`curY > ramp − 0.9`) so
    the player can walk on the flat center floor *under* the spiral and can never be
    teleported up through the steps; the buried center podium (visual + walkable) is
    removed.
  - Visuals follow the walkable model: interior floor disc raised to porch level, step
    boxes thickened to 0.42 so the spiral reads as one solid staircase rising out of the
    floor, entry steps rendered in the plinth stone color. All of it stays inside the
    existing merged-geometry buckets (zero new draw calls; two meshes removed).
- **Mansion stairwell opening:** the floor-2 slab is rebuilt as three boards around a
  real opening (`lx −2.2 → 2.1`, `lz −6 → −4.0`) sized so a standing player clears the
  slab before reaching it; the stair rail and rail wall are re-spanned to the opening,
  a guard rail + collider closes the open west edge, and newel posts finish both ends.
  The walkable model extends the stair ramp to the opening edge so no invisible ledge
  or fall trap exists.
- **Mesh-matched surfaces:** the cottage roof lathe profile moves to a shared
  `HOUSE_ROOF_PROFILE` in `lib/world.ts` — the mesh and `groundHeight` are generated
  from the same 11 points, so the roof is standable and exactly matches the silhouette;
  the roof chimney gets a small elevated collider. E2E verifies mesh vs collision with
  a new `__Ghibli.raycastDown` probe.
- **Acceptance suite (what the agent must run):** new `e2e/collision.spec.ts` —
  walk-in at the windmill door asserts standing height at the threshold (fails on the
  old buried build), spiral climb with plain held keys reaches the landing, mansion
  floor 2 raycasts down into an open stairwell and falls onto the stairs, roof walk
  tracks the visible profile within tolerance, and the draw-call budget holds after
  touring every interior.

## Impact

- Spec deltas: `windmill-collision` (new), `mansion-stairwell` (new),
  `surface-fidelity` (new), `e2e-verification` (new delta — collision acceptance).
- Code: `lib/world.ts`, `scene/Windmill.tsx`, `scene/Mansion.tsx`, `scene/House.tsx`,
  `scene/Probe.tsx`; tests: new `e2e/collision.spec.ts`, updates to
  `e2e/{world,math,scale}.spec.ts` where heights were pinned to the old model.
- Validation: `npm.cmd run build` (tsc strict) and the full Playwright suite green with
  the existing budgets (`drawCalls <= 190` at boot, chop/pickup/mansion contracts
  unchanged). No new colliders beyond two guard-rail boxes + one chimney box; all new
  visual geometry merged into existing buckets; `groundHeight` stays pure branchy math
  with a precomputed roof lookup (zero allocations).
