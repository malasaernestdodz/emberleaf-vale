# Design: Enclose the windmill shell

## Coordinate conventions (unchanged, load-bearing)

- Walkable phi: a point sits at mill-local `(-sin(phi) * r, cos(phi) * r)`.
- Cylinder theta: a vertex sits at `(sin(theta) * r, cos(theta) * r)`, so
  `theta = 2π − phi`; an arc `[phiA, phiB]` maps to theta range
  `[2π − phiB, 2π − phiA]` (reversed, same interval).
- Collider boxes on the wall ring use `yaw = a` with position
  `(sin(a), cos(a)) * rWall`, so collider angle `a` maps back to walkable phi
  `2π − a`.

## Key constants

- `MILL.doorHalf = 0.24` — door slit half-angle; slit is
  `phi ∈ [2π − doorHalf, doorHalf]` (through zero).
- `MILL_BALCONY.phi0 = 2π − doorPhi − topPhi/2 − 0.25 ≈ 5.408`,
  `phi1 = 2π − doorHalf ≈ 6.043` — balcony arc; open above the deck only.
- Lintel top = 3.87 (lintel box center 3.75, height 0.24). Wall spans
  `y ∈ [0.6, 0.6 + WALL_H]`, tapering 5.5 → `WALL_TOP_R` (4.5) linearly; each
  band interpolates its own bottom/top radius so the silhouette is unchanged.

## Band layout

| Band  | y range        | theta range                          | openings                    |
| ----- | -------------- | ------------------------------------ | --------------------------- |
| lower | 0.6 – 3.87     | start `doorHalf`, len `2π − 2·doorHalf` | door slit only           |
| mid   | 3.87 – 6.4     | start 0, len `2π`                    | none                        |
| upper | 6.4 – 15.1     | start `2π − phi0`, len `phi0 + doorHalf` | balcony arc only        |

The upper band wraps past `2π` by `doorHalf` (length `phi0 − (2π − phi1)` in
phi terms) so the door slit is closed above the deck and only the balcony arc
stays open. Bands share exact boundary heights with the lintel (3.87) and the
deck (`MILL.top`), so no slivers of sky appear at the seams; the deck ring
(`r0 = 4.35 → r1 = 7.3`) covers the wall radius (~5.1 at that height) at the
mid/upper seam.

## Collider caps

Old behavior: segments with `a < 2π − phi0 + halfA` were skipped, leaving the
whole balcony arc passable at every height. New behavior: that arc is emitted
with `top = MILL.base + MILL.top` (deck). Vertical gating in `collide.ts`
(`feetY > top − 0.05 → skip`) means:

- porch-level player (feet ≈ `base + floorH`) is stopped — the shell is solid
  below the deck;
- deck-level player (feet ≈ `base + MILL.top + 0.02`) walks through the doorway
  untouched — the capped boxes are 0.02 u below their feet;
- a jump (`jumpApex ≈ 0.85`) from the porch cannot clear the 5.2 u cap, and a
  jump on the deck only opens the boxes further.

Segments outside the arc keep `top = base + 0.6 + WALL_TOWER.h` exactly as
before, so the `collider.spec.ts` ring checks at `millWorld(MILL.rWall, 0)`
(phi = 3π/2, far from the arc) are unaffected.

## Alternatives rejected

- Two separate cylinders with alpha-masked cutouts: new texture work, breaks
  the "zero downloaded assets / plain geometry" convention.
- Skipping colliders only below deck and keeping the full-height mesh gap:
  fixes gameplay but leaves the visible hole the playtest flagged.
- One full-height cylinder per opening (6 segments): more draw calls for no
  visual gain over 3 stacked bands.
