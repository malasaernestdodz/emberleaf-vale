# Tasks: Grass density, depth and placement pass (deferred)

> Deferred to the next sprint by the owner on 2026-08-30. Nothing in this change
> is implemented yet; tasks are intentionally unchecked. Activate this change
> before touching `scene/Grass.tsx`.

## 1. Placement

- [ ] 1.1 Seed blades from a precomputed `groundHeight` grid so porch, slab and
      roof-adjacent surfaces stop spearing through grass
- [ ] 1.2 Exclusion radii around cottage, mansion, windmill porch and plaza rings
- [ ] 1.3 Blue-noise rejection to break clumps; raise meadow minimums; trim path
      shoulders

## 2. Sway

- [ ] 2.1 Per-blade phase jitter from the seeded PRNG (gust look, no wave bands)

## 3. Perf governor

- [ ] 3.1 Hysteresis + slow restore for grass density; sustained-load fast drop

## 4. Verification

- [ ] 4.1 Grass screenshot probes at the plaza, porch edge and mansion slab
- [ ] 4.2 Budgets hold: boot `drawCalls <= 190`, LITE blade floor, zero per-frame
      allocations in the grass update
