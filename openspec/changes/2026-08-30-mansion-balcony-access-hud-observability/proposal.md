# Change: Mansion balcony access (closed stairwell back), HUD readability, runtime metrics

- **Date:** 2026-08-30
- **Type:** Bug fix (traversal + collision fidelity), HUD readability, observability pass

## Why

User feedback from playtesting the current build:

1. **The mansion balcony is unreachable.** A balcony deck exists on the back of floor 2
   (`lx 2.8 → 6.4`), complete with railings, but the back wall above floor 2 is solid
   across the whole balcony span, so there is no way out onto it. Meanwhile the back wall
   has a random open band (`lx −0.95 → 0.95`, `F2 → F2 + 2.3`) sitting directly over the
   stairwell opening — it looks like a door at the top of the stairs but leads nowhere
   (a fall trap onto terrain). Access is in the wrong place end to end.
2. **Vitality hearts are hard to read.** The heart row sits straight on the 3D scene:
   dark red fill over bright sand reads as a smear, and the label uses the dim text
   color. Health must be legible at a glance on any background.
3. **The slime blends into the grass.** The light-green slime (#7ed957) sits on
   yellow-green terrain and grass; the enemy and its HP bar disappear at mid distance.
4. **No numeric observability.** Finding performance or gameplay problems relies on
   eyeballing. The game needs an always-available metrics registry (counters + gauges
   with per-second rates) so every defect class (collision pushes, step blocks, falls,
   damage, governor drops) shows up as a number that tests and the perf panel can pin.

## What Changes

- **Balcony doorway (collision shape first):** the upper back wall is split around a
  real doorway centered on the balcony (`lx 3.85 → 5.35`, `F2 → F2 + 2.4`, lintel
  collider above); the random stairwell back opening is closed with a solid wall segment
  and matching collider from `F2` up. Timber jambs, lintel, threshold board and an
  ajar open door leaf dress the opening (merged buckets + one reused `buildDoorLeaf`
  mesh, no new draw-call buckets).
- **Balcony walkable:** `groundHeight` gains a `MANSION_BALCONY` branch gated on `curY`
  so the deck at `F2` is standable from the doorway out to the railing (terrain still
  applies under the deck). Existing balcony rail/post colliders already seal the edges.
- **Window fix:** the back-wall window that would have floated inside the new doorway
  moves from `lx 4.5` to `lx 6.45`.
- **HUD hearts readability:** the vitality row gets a dark translucent plate (border,
  radius, shadow), a brighter ember label, bigger hearts with high-contrast fill
  (`#ff4d43` on cream stroke) and clearly visible empty hearts.
- **Slime visibility:** slime body and full-HP bar color move to high-contrast teal-blue
  (`#45c0e8`), highlight tint adjusted — distinct from grass, terrain and the green gel
  drops.
- **Runtime metrics registry:** `lib/trace.ts` gains `inc()/setGauge()/metricsTick()/
  metricsList()` — allocation-free counters with per-second rates and gauges, mirrored
  on `window.__emberTrace.metrics()`. Instrumented: collision pushes, step blocks,
  jumps, landings, falls, damage/heal/regen/faint, slime hits/pops, governor tier moves,
  plus fps/draws/tris/tier gauges. The perf panel [P] shows a live METRICS section.
- **Acceptance suite:** `e2e/collision.spec.ts` gains a balcony walk-through (slab →
  doorway → deck → rail stop, mesh raycast matches, fails on the old sealed wall) and a
  closed-back-wall walk test; new `e2e/observability.spec.ts` pins the metrics contract
  (gauges numeric, `collide.push` increments while walking into a wall, `hp.damage`
  trails slime contact) and the perf panel METRICS rows.

## Impact

- Spec deltas: `mansion-balcony` (new), `hud-readability` (new), `observability` (new).
- Code: `lib/world.ts`, `lib/trace.ts`, `lib/collide.ts`, `lib/health.ts`, `lib/slime.ts`,
  `scene/Mansion.tsx`, `scene/Slime.tsx`, `scene/Player.tsx`, `scene/Perf.tsx`,
  `App.tsx` (perf panel), `index.css` (hearts).
- Tests: `e2e/collision.spec.ts` (+2), new `e2e/observability.spec.ts` (+3).
- Rules: `no-console-log` (observability flows through the probe) and
  `metrics-need-literal-names` (metric names are a stable contract) in `ast-grep scan`,
  already wired into CI alongside `openspec validate --all --strict`.
- Validation: `npm.cmd run build` (tsc strict), `npm.cmd run lint:sg`,
  `openspec validate --all --strict`, full Playwright suite green with existing budgets
  (draw-call cap unchanged: the door leaf reuses the existing bucket strategy).
