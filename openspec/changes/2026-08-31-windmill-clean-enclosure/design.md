# Design: Windmill clean enclosure

## Coordinate conventions (unchanged, load-bearing)

- Walkable phi: a point sits at mill-local `(-sin(phi) * r, cos(phi) * r)`.
- Cylinder theta: `theta = 2π − phi`; the balcony arc `[phi0, phi1]` opens the
  doorway band at cylinder thetas `[2π − phi0, 2π + doorHalf]` (wraps past 2π
  so the door slit stays closed above the deck).
- Wall spans `y ∈ [0.6, 0.6 + WALL_H]`, tapering 5.5 → `WALL_TOP_R` (4.5)
  linearly via `BAND_R(y)`; every band interpolates its own bottom/top radius
  on that same line so the silhouette never changes.

## Band layout (after this change)

| Band  | y range                        | theta range                              | openings        |
| ----- | ------------------------------ | ---------------------------------------- | --------------- |
| lower | 0.6 – 3.87                     | start `doorHalf`, len `2π − 2·doorHalf`  | door slit       |
| mid   | 3.87 – 6.4                     | full circle                              | none            |
| doorway | 6.4 – 6.4 + `lintelH` (9.9)  | start `2π − phi0`, len `phi0 + doorHalf` | balcony doorway |
| crown | 6.4 + `lintelH` – 15.1         | full circle                              | none            |

- `MILL_BALCONY.lintelH = 3.5` (world.ts). The doorway band reproduces the
  old upper band exactly up to the lintel; the crown band restores the wall
  the old band left open from deck + 3.43 to 15.1.
- Seam at 9.9 is shared-exact (both bands use `BAND_R(9.9)` as their meeting
  radius); the lintel box (0.26 tall, centered deck + `lintelH` + 0.13, at
  `rWall + 0.12`, chord width as before) covers the joint from outside.
- Jamb posts grow from 3.3 to `lintelH` (deck → lintel bottom, flush) so the
  raw cylinder cut edges are framed over the full doorway height.
- The three window discs at y 11.5 sit on the crown band — still solid wall.

## Why no collider changes

The wall ring already caps the balcony arc at deck height
(`top = MILL.base + MILL.top`) and keeps full-height tops elsewhere
(`src/lib/world.ts` wall ring; asserted in `e2e/collision.spec.ts`). The
player body (1.55 u, jump apex 0.845 u) cannot reach the newly solid crown
band from the deck, so the solid wall above the lintel needs no collider and
none is added. Vertical gating in `collide.ts` (`feetY > top − 0.05 → skip`)
keeps the deck crossing unblocked exactly as before.

## Alternatives rejected

- Move the balcony to the tower top (under the roof): the spiral grade
  contract (0.15–0.55, `e2e/scale.spec.ts`) makes a climb to 15.1 impossible
  on the current arc, the hub at 12.2 puts sails through the deck, and the
  archived collision spec requires the climb-to-vista path to stay green.
- Alpha-masked cutouts on one tall cylinder: new texture work, breaks the
  zero-asset convention (also rejected in the previous change).
- Raise the lintel and keep the single band: any doorway height above ~1 m of
  headroom still leaves a notch; only a full crown band closes it.

## Perf / determinism

One extra draw call; no per-frame allocations; no rng — all geometry from
fixed `MILL` constants, so layout and e2e stay deterministic.
