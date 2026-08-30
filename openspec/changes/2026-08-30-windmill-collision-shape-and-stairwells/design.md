# Design — Windmill collision shape, stairwells, mesh-matched surfaces

## Context

The kinematic controller has exactly two ground-truth sources: `groundHeight(x, z, curY)`
(walkable surfaces) and `COLLIDERS` (horizontal push-out). A mesh that appears in neither
is a hologram: the player clips through it. Three landmarks shipped that way:

1. **Windmill plinth** — a 1.2 u solid cylinder at the tower base with no entry in
   either system, while the walkable door wedge sat at `base + 0.02`. Walking in, the
   player's body is inside the stone; the spiral (whose boxes *do* match the ramp
   formula) starts at that sunken level, so from the door it looks like a staircase
   floating a floor above you with no way onto it.
2. **Mansion floor-2 slab** — one `14.8 × 4.1` box across the whole north half,
   overlapping the stair run; the top ~3 steps, the sloped rail, and the rail wall
   intersect the boards, and there is no stairwell hole to walk out of.
3. **Cottage roof** — a `LatheGeometry` from 11 profile points, purely visual.

## Decision

### Windmill: one walkable model that *is* the collision shape

`MILL` gains `floorH = 1.2` (plinth-top height), `porchR = 5.7`, `skirtR = 6.1`,
`rampR0 = 1.8`. `groundHeight` replaces the old interior branch with:

- `d < rIn` → floor at `base + floorH` (door wedge included — the threshold is flush
  with the plinth top, so entry is a 0 u step instead of wading through stone).
- Same wedge → landing → spiral phi sectors as before, but the ramp spans
  `floorH → MILL.top` and applies only when `d > rampR0` **and** `curY > ramp − 0.9`.
  The annulus keeps the center floor flat (you can stand under the spiral; headroom is
  ≥ 2.3 u one turn up), and the height gate makes the ramp one-sided: you can never be
  snapped up through the steps from below (the mansion slab branch already uses this
  pattern). Walking *on* the ramp keeps `curY == ramp`, so the gate is transparent
  while climbing; falling from above lands in the last 0.9 u like the mansion does.
- `rIn ≤ d < porchR` → porch at `base + floorH`; `porchR ≤ d < skirtR` → linear skirt
  slope down to terrain, so nothing intersects the plinth cone from any side.
- Door column (`|lx| < 1.35`, `d < 7.0`) → two steps at `base + 0.8` / `base + 0.4`.
  Every rise is 0.4 ≤ `PLAYER.step` (0.55), so plain held-key walking gets you from the
  path up the steps, across the porch, through the door, and up the spiral.

Jump escape-hatch check: jump apex is 0.845 < 1.2, so the porch can only be entered via
the steps — the steps are the front door, not an optional hint.

Visuals (`Windmill.tsx`) are generated from the same constants: floor disc moves to
`floorH + 0.03`, step boxes thicken 0.1 → 0.42 (each step overlaps the one below by
~0.27, so the spiral reads as one solid staircase instead of floating planks), the
buried podium stack and its walkable are deleted, and two stone entry-step boxes are
added. Net effect: fewer meshes, same merged buckets, zero added draw calls. Wall
colliders, door gap, landing, sails, and camera clamps (`MILL.top` unchanged) stay.

### Mansion: a real stairwell hole, sized by headroom

Opening `lx ∈ [−2.2, 2.1]`, `lz ∈ [−6, −4.0]`, chosen by the constraint that a standing
player (1.55 u) clears the slab underside (`F2 − 0.15`) before the hole starts:
stair height ≥ 1.6 happens at `lx ≥ −2.1`, so the hole leads slightly. The single slab
box becomes three boards (south strip full-width, east and west strips beside the
hole). The walkable stair branch extends from `st.lx1 = 1.8` to the hole edge 2.1 with
`t` clamped, so walking off the top landing onto the east board has no gap; the west
edge gets a guard rail (visual in the existing slab-rail style + one collider box, top
`F2 + 1.0`, which does not block climbers below since their head clears `y0 = F2`).
Rail and rail wall are re-spanned to the opening with newel posts at both ends — this
also fixes the pre-existing rail wall poking through the slab on floor 2.

### Mesh == collision by construction

`HOUSE_ROOF_PROFILE` (the 11 lathe points) moves to `lib/world.ts`; `House.tsx` builds
its `LatheGeometry` from it and `groundHeight` interpolates the same array (module-scope
lookup, allocation-free) gated by `curY > roof − 0.9`. The roof is therefore standable
and cannot drift from the mesh. The roof chimney gets one small elevated collider
(`y0 4.2 → top 5.95`) so walking the roof doesn't phase through stone. Standing on the
roof is a teleport/dev surface today (no in-game climb route) — it exists so the shape
is correct and future features (or a tumble from a hill) behave; the well and windmill
cone roofs stay out of scope: tiny, above reachable space, and never touched.

### Acceptance hooks

`__Ghibli` gains `raycastDown(x, z, fromY)` (scene raycast, test-only, filters to
visible meshes) and `teleport(x, z, high)` where `high` resolves ground with `curY =
Infinity` (lands you on roofs/landings). This lets e2e assert *visual* truth
(first raycast hit ≈ walkable height) instead of only walking on the model's own math —
the tripwire that fails if mesh and collision drift apart again.

## Alternatives

- **True mesh-conformal collision (triangulate the lathe/cone, SAT tests)** — rejected:
  violates the no-physics-engine, allocation-free, fixed-timestep design for surfaces a
  capsule never notices; analytic primitives within tolerance are the house style.
- **Lower the door threshold instead of raising the floor** (cut a notch in the plinth
  mesh, keep floor at 0.02) — rejected: keeps the player 1.2 u below the window sills
  and the spiral start, preserves the floating look, and carves an awkward trench
  through the stone base.
- **Stairs as real colliders (34 step boxes)** — rejected: 34 extra boxes on a slope the
  ramp already models exactly; the step-up limiter plus phi ramp is smoother and free.
- **Ramp without the `curY` gate** — rejected: `groundHeight` is phi-only, so stepping
  radially outward mid-tower would teleport the player 3+ u up onto the spiral; the
  gate is two comparisons.

## Risks

- Camera indoor clamp for the mill keys on `rIn`; the porch ring outside it uses the
  outdoor path — the camera may hug the parapet there (cosmetic, wide space).
- `teleport(x, z)` default stays `curY = prev`, so every existing call site (sleep spot,
  stair bottoms, pickup probes) keeps its floor choice; only roof/landing tests pass
  `high`.
- SwiftShader e2e timing: climb loops keep the existing generous polling pattern.
