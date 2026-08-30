# Design — Real-world scale, collision fixes, sword combat

## Player reference metrics (drive every proportion)

| Metric        | Value  | Derived from                          |
| ------------- | ------ | ------------------------------------- |
| Height        | 1.55 m | capsule 0.62 center + head            |
| Radius        | 0.32 m | capsule footprint                     |
| Step limit    | 0.55 m | ~ knee height (1.55 / 2.8), rounded   |
| Jump apex     | 0.845 m| vy 5.2, g 16: vy² / 2g                |
| Eye/cam pivot | 1.4 m  | 0.9 x height                          |

Doors must be >= 2.5x player diameter (1.6 m); floors >= 2x player height
(3.1 m); a windmill reads real at ~8x player height (12.4 m to the cap).

## Per-object collision shape research

| Object                | Shape                        | Math / rationale                                                                                                     |
| --------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Terrain, mound, paths | height-field `groundHeight`  | single-valued h(x,z); walking = h, blocked only by `h > y + 0.55`; no tunneling, zero allocs                          |
| Windmill wall         | N tangent OBBs on a ring     | tile arcs with box half-angle `atan(hw/rWall)`; chord 1.0 m >= arc 0.998 m -> sealed; clear door gap = 2·(0.195 rad)·r = 1.6 m |
| Windmill spiral       | height-field ramp            | solid annulus r ∈ [rCenter, rIn]; h = base + (φ−φ0)/ARC · top; grade = top/(ARC·r) = 0.29 < 1.0 walkable               |
| Windmill plinth/pole  | height-field disc + circle   | plinth r 0.78 h base+0.5 (0.48 step, climbable, no collider so it does not repel); pole circle r 0.3 blocks            |
| Mansion walls         | yaw OBBs with y0/top spans   | door header y0 2.6 (door 1.8 x 2.6 = 1.16x / 1.68x player); upstairs spans y0 = floor2 so the ground floor is free     |
| Mansion stair         | height-field ramp band       | run 7.1, rise 3.05 -> 23°; visual steps 0.19/0.44 match real riser/tread; enclosed by a rail OBB (y0 f1, top F2+1)      |
| Balcony               | y0-scoped OBBs + 2 posts     | rails y0 = floor2 (feet 0.25 + 1.55 = 1.8 < 3.3 -> walk under freely); posts r 0.12 at ±2.4 keep a 4.5 m clear lane    |
| Furniture             | circles / OBBs with tops     | table top 0.8 <= jump apex 0.845 (jump-on-able); beds/desks y0 = floor2 (walk under upstairs)                          |
| Trees, rocks, stools  | circles                      | rotation-invariant, cheapest; rock tops standable via walkables                                                        |
| Fountain/well rim     | ring of OBBs + walkable ring | jump-gated: top 0.56 <= apex 0.845; wade basin 0.48 walkable                                                           |
| Player                | circle (r 0.32) + body span  | colliders apply only when [feet, feet+1.55] overlaps [y0, top] (`resolveCollisions(…, feetY)`, ast-grep enforced)      |
| Slime NPC (planned)   | circle r 0.45 + sphere body  | same height-field ground; see add-slime-npc change                                                                     |

### Windmill sector layout (the structural fix)

The old layout let the spiral's top wedge (φ >= 2π−0.35, h = base+top) share the
door sector (|φ| < 0.35, h = base) — one (x,z) column, two required heights, so
half the doorway stood at balcony height. New partition, each sector single-valued:

- door wedge |φ| < 0.45 -> base + 0.02 (floor to wall, walk under the spiral start)
- spiral φ ∈ [0.45, 2π−0.9] -> base + 0.02 + (φ−0.45)/ARC · (top−0.02), ARC = 2π−1.35
- landing φ ∈ [2π−0.9, 2π−0.45) -> base + top (0.39 m step up from the ramp's last
  stretch, below the 0.55 step limit)

### Why the "fall through the floor" happened

Two compounding causes: (1) the sector conflict above, (2) the spiral height-field
spanned r ∈ [1.5, 2.55] while the center disc was floor level — stepping inward
past r = 1.5 dropped the player 3.6 m through the visible steps. The solid annulus
(rCenter 0.55, plinth at the pole) removes every interior edge; the only vertical
drops left are the intended landing sector boundary (≤ 0.39 m).

## Combat

Left click (mouseup with < 6 px travel, buffered 500 ms) starts a 0.45 s swing;
`game.attack` is the 0→1 progress; the right arm pivots `-0.5 − sin(π·p)·1.9` and
the sword group shows whenever `tool == 'sword'` (the default when not fishing or
chopping). No damage dealer exists yet — the slime NPC change (separate) will
define the hit probe against this swing.

## Frame-rate independence

- Jump/gravity: sub-stepped at dt <= 16 ms so a 0.42 s SwiftShader frame still
  produces the full 0.845 m arc instead of collapsing it into one landing.
- Input: edges live 500 ms in a `recent` map, so a late frame still observes a
  quick press (keeps `resolve-collisions-feet`-style determinism guarantees).

## Debug view

`Colliders.tsx` renders every collider as a wireframe (teal cylinders for
circles, orange yaw boxes for OBBs) spanning y0→top (capped at 12 m); `C` toggles
`game.showColliders`; the group is invisible when off so the draw-call budget is
untouched.
