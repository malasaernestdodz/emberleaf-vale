# Proposal — Correct indoor↔outdoor camera zoom with strict drift guards

## Why

Playtest feedback (Aug 2026): entering the house dollies the camera in
correctly, but leaving it breaks — the camera pulls out behind the building
walls and the view shows the house instead of the player. Root causes in
`CameraRig`:

1. The indoor exit ray was computed with `obbExit`/`circleExit`, which return
   garbage (negative → floored to 0.5) once the player is outside the volume,
   so the exit transition snapped and then over-zoomed.
2. There was no outdoor occlusion handling at all: when the player→camera ray
   crosses a building footprint, the camera zoomed out behind the wall and the
   house occluded the player.
3. The interior position clamps ran on `interior > 0.5` alone, forcing the
   camera back inside the house box for a moment after the player had left.

## What changes

1. **Unified wall-distance helpers** — new pure `lib/camera.ts` with
   `obbWall` (ray-vs-OBB) and `circleWall` (ray-vs-circle) that return the
   wall-crossing distance in both directions: exit when the point starts
   inside, entry when outside, `Infinity` on a miss. `CameraRig` uses them for
   the indoor exit clamp, the windmill, and the new outdoor occlusion clamp.
2. **Outdoor occlusion clamp** — when the player→camera ray crosses a building
   footprint and the crossing point sits below the wall top, the follow
   distance is dolly-clamped to 0.5 m in front of that wall; the zoom releases
   smoothly back to the full scroll distance once the ray clears the building.
3. **Guarded clamps** — the per-building interior position clamps now also
   require the inside membership (`game.inside` / `game.insideMansion` / mill
   radius) so the camera is never locked inside a volume the player has left.
4. **Probe exposure** — `game.interior` joins the `__Ghibli` snapshot so e2e
   can assert on the transition factor.
5. **Regression net** — `e2e/camera.spec.ts` (pure-math wall-distance
   invariants + a full walk-in / zoom / walk-out browser journey with an
   unoccluded-line-of-sight invariant), eight ast-grep structural rules that
   fail the build if any clamp is removed or bypassed, and a dedicated camera
   regression step in CI alongside the existing strict OpenSpec validation.

## Capabilities

### New

- none (behavior lands under the existing `camera-system` capability)

### Modified

- `camera-system` — unified wall-distance clamps, unoccluded outdoor zoom,
  guarded interior clamps, damped-only interior factor.
- `e2e-verification` — camera zoom regression suite + structural drift guards
  wired into CI.

## Impact

- `src/lib/camera.ts` (new), `src/scene/CameraRig.tsx`, `src/scene/Probe.tsx`,
  `e2e/camera.spec.ts` (new), `rules/camera-*.yml` (new, 8 rules),
  `.github/workflows/ci.yml`, `package.json`, `README.md`,
  `openspec/changes/2026-08-30-camera-zoom-indoor-outdoor/`.
- No new dependencies; the helpers are allocation-free pure math.
- Indoor behavior is preserved (the same ray-clamp geometry with a slightly
  tighter 0.5 m clearance); boot draw-call and perf budgets are untouched.
