# Design: Render distance culling and world settings

## Rendering principles applied

1. **Projection (frustum) culling** — three.js already rejects meshes outside
   the camera projection frustum per mesh. This change keeps that on and does
   not duplicate it per object.
2. **Distance culling** — the missing half for an open world: an object whose
   distance from the camera exceeds the render distance is not submitted to the
   GPU at all. Decision is `withinRenderDistance(dist, maxDist, margin)` with
   `margin = object bounding radius`, so large landmarks stay visible edge-on
   until the camera passes `renderDistance + radius`.
3. **Fog as the boundary's cover** — fog far tracks the render distance
   (`near = far * 0.35`), so objects disappear inside fog rather than popping
   against the sky. Disabling fog lifts fog far to 500 m; distance culling still
   applies so the setting stays meaningful.
4. **Grass keeps its GPU cutoff** — blades already clipped per-vertex at 74 m.
   The literal becomes a `uCull` uniform fed by the same render distance so one
   slider governs trees, landmarks, grass, and fog coherently.

## Alternatives considered

- **Splitting the merged rock mesh** for per-rock culling: rejected — one draw
  call today; splitting trades real draw calls for culling that frustum culling
  already approximates.
- **Culling grass from JS**: rejected — the vertex shader cutoff is free and
  exact per blade; JS can only toggle whole meshes (kept as the `showGrass`
  toggle).
- **Culling slime/pickups/air particles**: rejected — their `visible` flags are
  gameplay state (hidden/alive), and culling must not fight gameplay writers.
  Registered cullables are trees + landmarks only.
- **Per-frame frustum rebuild for stats**: rejected — draw-call stats already
  reflect what the renderer submitted; `culled` counts come from the registry.

## Single-writer boundaries (enforced by ast-grep)

- `camera.fov` writes: only `CameraRig` (`camera-fov-only-in-rig`).
- `fog.near` / `fog.far` writes: only `Culler` (`fog-range-only-in-culler`).
- `.visible` writes in `src/lib`: only `lib/cull.ts`
  (`cull-visibility-single-writer`).
- No hardcoded grass cutoff literal in `Grass.tsx`
  (`no-hardcoded-grass-cutoff`).

## Settings contract

`renderDistance` clamps to 40–220 (default 170, 70 in lite), `fov` 40–90
(default 55), `sensitivity` 0.3–2 (default 1), booleans default on except
`invertY` (off). All persist through the existing
`emberleaf.settings.v1` localStorage contract with per-field validation, so old
saved settings upgrade cleanly with defaults for new fields.

## Risks

- Chop/interact tests teleport next to trees before touching them, so hidden
  far trees cannot break raycast probes (they run against visible objects).
- The pond group hides water + lilies at distance; the carved terrain stays, so
  the shoreline never pops, only the water sheen.
- Camera eases after teleports; e2e waits for the camera to settle before
  asserting culling states.
