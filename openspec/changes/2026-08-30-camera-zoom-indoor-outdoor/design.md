# Design — Indoor↔outdoor camera zoom

## Context

`CameraRig` computes a follow distance `allowed` every frame and damps the
camera to `player + dir * allowed`. Buildings need two opposite clamps:

- **Indoors**: the camera must stay inside the volume → clamp to the *exit*
  distance of the ray through the (shrunk) volume.
- **Outdoors**: the camera must not end up behind the volume → clamp to the
  *entry* distance of the ray into the volume.

The old code only had the indoor half (`obbExit`, `circleExit`) and those
helpers produced negative exit distances for outside points, floored to 0.5 by
`Math.max(t, 0.5)` — the reported snap-then-overzoom on exit.

## Decision

### One wall-distance primitive per shape

`lib/camera.ts` exposes pure, allocation-free helpers used both by the rig and
imported directly by e2e:

- `obbWall(px, pz, dx, dz, cx, cz, hw, hd, yaw, margin)` — slab test against
  the yaw-rotated box. Starts inside (with `margin` shrink) → returns `tFar`
  (exit). Starts outside → returns `tNear` when the ray hits (`≥ 0`), else
  `Infinity`.
- `circleWall(px, pz, dx, dz, cx, cz, R)` — quadratic vs circle; inside →
  exit root, outside → first hit, miss/behind → `Infinity`.

Returning `Infinity` for "no constraint" lets every clamp site skip cleanly
instead of flooring a bogus negative to 0.5 (the old bug).

### Occlusion gate: height at the wall, not camera height

Clamping whenever the 2D ray crosses a footprint would wrongly dolly the
camera in when it flies over a roof. The view from the camera to the player is
the same line reversed, so the crossing point of the *player→camera* ray with
the footprint is exactly where the view enters the building. The clamp applies
only when that crossing point is below the wall top:

```
t = obbWall(..., margin 0)            // real footprint, entry or exit
if (t < ∞ && playerY + 1.4 + dirY * t <= wallTop)
  allowed = min(allowed, max(t - 0.5, 0.8))
```

- `dirY * t` is monotonic along the ray, so `y(t) ≤ top` is the exact
  "segment enters the building volume" test for any camera height.
- Wall tops: `HOUSE.h + 0.2`, `MANSION.floor2 + 3.1`, `MILL.base + MILL.top +
  0.2` (the +0.2 tolerates roof slopes).
- Mill occluder radius is the outer wall face `rWall + 0.18`; the windmill
  interior volume keeps `rIn - 0.25`.
- Floor of 0.8 m keeps the camera out of the player's near plane, matching the
  indoor clamp floor semantics.

### Guarded interior position clamps

The box/ring position clamps stay (they guarantee a wall-free indoor camera)
but are gated on the same membership the interior factor targets:
`game.interior > 0.5 && game.inside`, `... && game.insideMansion`, and the
mill radius test. On exit the clamp releases immediately and the outdoor
occlusion dolly takes over, so the camera is never dragged back inside.

### Deterministic and testable

The helpers are pure node-importable math, so `e2e/camera.spec.ts` pins their
geometry exactly (exit/entry/miss values) without a browser, and the browser
journey asserts the *segment* invariant (16 samples between player and camera
must never enter the house footprint below the wall top) — the tripwire that
fails if the occlusion clamp drifts again.

## Alternatives

- **three.js `Raycaster` against building meshes** — rejected: per-frame mesh
  raycasts on SwiftShader CI are slow, order-dependent on scene graph, and not
  unit-testable in node; the analytic clamp matches the existing kinematic
  collision style.
- **Spring the camera over the roof on occlusion** — rejected: vertical
  camera swings disorient at walking pace; dolly-in is what the indoor clamp
  already established.
- **Snap `interior` to 0/1 on transitions** — rejected: the eased factor is
  what makes zoom in/out continuous; ast-grep `camera-interior-no-snap` now
  forbids it.
