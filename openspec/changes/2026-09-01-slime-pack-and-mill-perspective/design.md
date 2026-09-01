# Design — Pack, boss, bars, and the mill you can actually enter

## Windmill door + heights (Q1/Q2)

One source of truth: the door slit spans walkable phi `[-MILL.doorHalf,
+MILL.doorHalf]` (through zero); the balcony doorway is the SAME arc at deck
level; everything else is wall.

- Band 1 (plinth→lintel): `thetaStart = doorHalf`, `len = 2π − 2·doorHalf`
  (unchanged — correct today).
- Band 2 (lintel→deck top): full cylinder (solid wall), unchanged.
- Band 3 (deck→deck+lintelH): the doorway arc ONLY:
  `thetaStart = 2π − MILL_BALCONY.phi0`, `len = MILL_BALCONY.phi0 +
  MILL_BALCONY.phi1` (symmetric wrapped arc through zero) — the committed
  code used `phi0 + doorHalf` which under-covers and leaves crown holes.
- Crown band: full cylinder.
- `groundHeight`: wedge floor `MILL.base + MILL.floorH` for `d < MILL.rIn`
  (no deck bleed at outer radii — the deck branch requires
  `curY > MILL.base + MILL.top − 0.9` AND the wrapped-arc test, both kept);
  spiral ramp gated to the arc `phi ∈ [doorPhi, 2π − doorPhi]`; landing
  covers `[2π − doorHalf − topPhi, doorHalf]` wrapped; deck covers the
  wrapped `[-doorHalf, +doorHalf]` arc for `d ∈ [rIn − 0.2, 7.3]`.
- e2e invariants: deck height at `rIn+0.3`, `5.9`, `r1−0.3` equals
  `base+top` (±0.02); landing equals `base+top`; wedge equals
  `base+floorH`; wall colliders' arc gap (in collider yaws) contains no
  box within `2·(MILL_DOOR_CLEAR+halfA)` of the door mid; walk-in stays
  green.

## Mill interior perspective (Q3/Q4/Q5)

- `game.insideMill = dist(player, mill) < MILL.rIn − 0.1` (new, mirrors
  `inside`/`insideMansion`).
- CameraRig: `circleWall` clamp applies when `interior3 > 0.02` (was 0.5);
  when `insideMill`, hard-clamp camera XZ to `MILL.rIn − 0.25` around the
  mill center and floor `allowed ≥ 2.6`; interior distance share for
  interior3 is `lerp(1, 0.8, interior3)` (normal-ish zoom; house/mansion
  keep 0.55); camera height capped at `MILL.base + MILL.top + 5.5` inside.
- Spawn seed: `camYaw = MILL.yaw + π + 0.55` so the first frame looks at the
  mill door approach.

## Pack + boss (Q6–Q8, Q12)

- `slimes: Slime[]` — 3 entries, spawns near `SLIME_SPAWN` (offsets
  [(0,0), (1.8, -1.2), (-1.6, 1.5)], seeded rng picks which one the e2e
  "pack" helper targets). Each carries the old state machine verbatim with
  per-entity `respawnT` and wander.
- `boss` object: same machine, `r 0.99 (2.2×)`, `maxHp 12`, windup 0.5 s,
  hop height 2.6, contact splash 2.2 m at impulse 6.0, pop → 6 gel,
  respawn 90 s. Parked at the pond north bank; hops in place (no wander →
  no keep-out coupling).
- `applySlimeHit` iterates `[...slimes, boss]` in order and returns on the
  first in-arc victim (`'hit' | 'pop' | null`). Player contact/landings
  iterate all active entities.
- `slimeCollider` becomes one collider per entity (regulars + boss),
  x/z/r synced per frame; boss collider r 0.99.
- `slimeHud` mirrors the boss (`shown`, `frac`). Quest `slime` fires on any
  pop (regular or boss).

## Bars (Q9/Q10)

- Boss: existing `.slime-health` HUD block relabeled `BOSS SLIME`, bound to
  `slimeHud` (boss), always visible, red fill, `0/12` hidden. Testids:
  `slime-health`/`slime-health-fill`/`slime-hp` keep their names (tests
  unchanged in shape) but semantically are the boss bar.
- Regulars: `SlimeBars.tsx` — one pooled `<div class="slime-bar">` per
  regular slime (3), updated per frame with
  `transform: translate3d(x, y, 0)` from `slime.position.project(camera)`,
  width fixed 46 px, fill = `hp/maxHp`, hidden when behind camera
  (projected z > 1), beyond 18 m, or off-viewport. No rotation, no 3D —
  a flat screen-space rectangle, `pointer-events: none`. Zero per-frame
  allocations (scratch Vector3 + string template).
- Snapshot: `pack: [{ x, z, state, hp, maxHp, visible }]`; `slime` =
  boss.

## Perf (Q13)

+3 bodies, +3 DOM overlays, +1 collider. Slash-burst budget re-measured;
draw-call delta budget unchanged (≤ 8 over idle).

## Alternatives

- Billboard 3D bars above regulars — rejected: the user explicitly wants
  flat 2D that does not rotate ("2d, not move when they move"); projection
  overlay gives the exact look.
- Boss as a separate scene file with bespoke logic — rejected: one state
  machine parameterized by constants keeps e2e and tests honest.
- Fixing the mill by deleting the upper bands — rejected: the vista balcony
  quest contract requires the climb; bands are re-derived, not removed.
