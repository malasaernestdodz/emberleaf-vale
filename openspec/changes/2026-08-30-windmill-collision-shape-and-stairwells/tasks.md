# Tasks: Windmill collision shape, stairwells, mesh-matched surfaces

## 1. Windmill walkable model (collision shape first)

- [ ] 1.1 `lib/world.ts` — `MILL` gains `floorH/porchR/skirtR/rampR0`; rewrite the
      `groundHeight` mill branch: flush threshold + flat center floor, annulus phi ramp
      `floorH → top` gated on `d > rampR0` and `curY > ramp − 0.9`, porch ring, skirt
      slope, two door-column steps (0.4 rise); delete the buried podium walkable
- [ ] 1.2 `scene/Windmill.tsx` — floor disc to porch level, steps 0.42 thick rising from
      the floor, delete podium stack meshes, add two stone entry-step boxes matching the
      plinth color; keep merged buckets (no new draw calls)

## 2. Mansion stairwell

- [ ] 2.1 `lib/world.ts` — `MANSION_STAIRWELL` opening constants; extend the walkable
      stair branch to the hole edge with clamped `t`; guard-rail collider on the west
      edge (`y0 = F2`, top `F2 + 1.0`)
- [ ] 2.2 `scene/Mansion.tsx` — slab as three boards around the opening; re-span sloped
      rail and rail wall to the hole; newel posts both ends; west guard rail visuals

## 3. Mesh-matched surfaces

- [ ] 3.1 `lib/world.ts` — `HOUSE_ROOF_PROFILE` (single source for mesh + collision),
      allocation-free `houseRoofY` lookup in `groundHeight` gated on `curY`; chimney
      collider
- [ ] 3.2 `scene/House.tsx` — build the roof lathe from `HOUSE_ROOF_PROFILE`
- [ ] 3.3 `scene/Probe.tsx` — `__Ghibli.raycastDown(x, z, fromY)` (visible meshes only)
      and `teleport(x, z, high)` resolving ground with `curY = Infinity`

## 4. Acceptance tests (agent must run all green)

- [ ] 4.1 New `e2e/collision.spec.ts`:
      - windmill door walk-in stands at threshold height `base + floorH` (±0.2) — fails
        on the old buried build; steps climbed with held keys only
      - spiral climb with held keys + coarse yaw nudges reaches the landing; at sampled
        phis the first visual raycast hit matches the walkable height (±0.3)
      - mansion floor 2: raycast down the stairwell hits stairs (< `F2 − 0.2`, fails on
        the old slab), walking west off the edge lands on the mid-stairs grounded
      - cottage roof: teleport-stand tracks the visible profile (±0.35) at 3 radii,
        raycast matches (±0.3), walking off the eave lands grounded; chimney blocks
      - interior tour keeps `drawCalls ≤ 200` and fps sane afterwards
- [ ] 4.2 Update pinned heights in `e2e/math.spec.ts`, `e2e/scale.spec.ts`,
      `e2e/world.spec.ts` (door wedge / center floor / podium asserts, slab sample
      points moved off the hole, base-floor lift budget 0.8 → 1.45)

## 5. Validation

- [ ] 5.1 `npm.cmd run build` — tsc strict + vite build clean
- [ ] 5.2 Full `npm.cmd run test:e2e` green, including existing contracts (boot budgets
      `drawCalls ≤ 190`, chop, pickups = 23, mansion stairs, camera clamps)
- [ ] 5.3 Screenshots reviewed: windmill entry (not buried), solid spiral, mansion
      stairwell hole from floor 2, roof walk
