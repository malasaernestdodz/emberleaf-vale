# Change: Windmill relocation (terrain-through-house fix) + working vista balcony

- **Date:** 2026-08-30
- **Type:** Bug fix (recurring terrain-order regression) + gameplay purpose pass

## Why

Playtest feedback (screenshots, 2026-08-30):

1. **Terrain mesh slices through the cottage.** The windmill mound plateau was
   force-applied *last* in `terrainHeight` (a `.find` special-case added when the
   FEATURES array was reordered in a concurrent session), so the mound's
   flatten-to-`WINDMILL_Y` lerp overrode the house's flatten-to-0 pad. The house
   center sits ~15.6 u from the mill center and the mill pad reaches 18 u, so
   terrain at the house footprint was lifted ~0.3–1.7 u above the floor — the
   grass cliff in the screenshots. This is the third time feature ordering has
   regressed; the root cause is implicit ordering, not a bad constant.
2. **The windmill stairs have no purpose.** The spiral ends at the top landing
   (`MILL.base + MILL.top`) against a solid wall band — climb up, turn around,
   climb down. The landing ring visual was also translated with an extra
   `MILL.base` offset, floating it ~5 u above the walkable surface.

## What Changes

- **Relocation:** `WINDMILL` moves from (24, -20) to (34, -26). Distance to the
  house grows 15.6 u → 27.2 u, past the mill pad's 18 u reach, so the pad and
  the house pad no longer overlap at all. Everything mill-related (MILL.base =
  `WINDMILL_Y`, colliders, culling, slime/tree exclusion, gallery poses) derives
  from the constant.
- **Ordering made principled:** `terrainHeight` applies FEATURES in one explicit,
  documented order — mill pad first, then every flatten-to-zero landmark
  (well → plaza → house → mansion) — so a landmark pad always wins inside its
  zone even if radii overlap again. The `.find`/special-case hack is deleted.
- **Vista balcony (end-to-end purpose):** a wooden deck ring outside the tower
  wall at landing height, on the landing's arc:
  - walkable model in `groundHeight`: deck at `MILL.base + MILL.top` gated on
    `curY > deck − 0.9` so the porch below stays walkable;
  - the wall band above the landing arc opens into a doorway (wall cylinder
    rebuilt as a single segment; wall colliders skip the doorway);
  - guard rail (6 tangential boxes + 2 radial end panels) with matching merged
    visual geometry, doorway jambs + lintel, 3 support brackets — all merged
    into the existing spiral mesh (zero new draw calls);
  - an interactable telescope ("Take in the view") at the deck center;
  - new quest `lookout` — "The Keeper's Watch: Climb the windmill and take in
    the view" — completes on interacting, with a flavor toast;
  - the landing ring visual's double-base offset is fixed (surface fidelity).

## Impact

- Spec deltas: `terrain-clearance` (new), `windmill-vista` (new),
  `e2e-verification` (delta).
- Code: `lib/world.ts`, `lib/quests.ts`, `scene/Windmill.tsx`, `scene/Player.tsx`.
- Tests: `e2e/math.spec.ts` gains house-pad and balcony invariants;
  `e2e/collision.spec.ts` gains the climb → balcony → quest end-to-end run.
- Validation: `npm run build`, `npm run spec:validate`, Playwright
  math/collision/gallery suites green, gallery screenshot review.
