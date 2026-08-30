# Design: Collider shape bounds + solid shape debug view

## Context

The kinematic controller treats a collider without `top` as infinitely tall
(`colliderBlocks`) and the debug drawer clamps drawing at `y0 + MAX_H` (14 u).
Colliders were only given `top` where gameplay needed a step-over surface, so every
structural wall silently became an infinite pillar in both physics and debug.

## Goals / Non-Goals

- Goals: debug overlay must be a truthful picture of the collision world; walls
  bound at their mesh height; trees read as trees; volume-visible debug mode.
- Non-Goals: no physics engine, no new collider shapes (still cylinders + boxes),
  no changes to `resolveCollisions` math, no grass work (deferred change).

## Decisions

### Explicit bounds at the mesh silhouette (chosen)

Every collider creation site states `y0`/`top` derived from the same constants the
visual meshes use (`HOUSE.h`, `MANSION.hWall`, `MILL.base/floorH/MILL_TOWER.h`).
Alternative considered — deriving bounds automatically from merged mesh bounding
boxes at startup — rejected: it couples the collision world to scene-graph build
order and hides shape intent behind a scan.

Wall tops stay non-walkable: `groundHeight` already owns every standable surface
(roof profile, porch, steps), and a wall `top` only stops *blocking* above the cap,
which nothing can reach (jump apex 0.845 u).

### Tree cap at trunk + lower canopy

`top = 3.4 s` sits between trunk top (1.6–2.4 s) and canopy top (≈4.6 s): the
debug cylinder hugs the visible tree instead of piercing the sky, while the player
(1.55 u, jump 0.845 u) still cannot cross it mid-air. Radius 0.45 s trims the
generous 0.5 s canopy ring. `lib/trees.ts` regrow restores both values, so the
existing chop → fall → regrow contract is unchanged.

### Solid view as a second independent toggle

`game.colliderSolid` mirrors `game.showColliders`; [C] and [V] compose (wires over
solid is the most readable combination for shape debugging). Solid shells reuse the
exact `BufferGeometry` the wireframe `EdgesGeometry` was built from — no extra
geometry memory, no per-frame allocation; materials are swapped in the existing
`useFrame` pass. `depthTest: false` + ordered `renderOrder` keeps overlays readable
through walls, matching the wireframe behavior. Boot draw-call budget is safe: all
debug objects are invisible until toggled, and `world.spec.ts` budgets are measured
at boot with both views off.

### One debug panel, two modes

The DOM panel opens for either mode; its `nearest` probe and legend now describe
both toggles. `Probe` exposes `colSolid` and `raycastDown` parity checks pin mesh
height to collider height at the fountain, windmill wall and trees.

## Risks / Trade-offs

- Bounding the windmill ring at the porch line means a player standing on terrain
  next to the plinth skirt no longer collides with an invisible full-height cage —
  intended (that cage was the bug); the plinth skirt itself is walkable terrain.
- `MANSION.hWall` (9.3) duplicates the local `H` in `Mansion.tsx` for now; a later
  refactor can share it like `HOUSE_ROOF_PROFILE`.
