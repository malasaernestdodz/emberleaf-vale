# Tasks: Mansion balcony access, HUD readability, runtime metrics

## 1. Balcony traversal (collision shape first)

- [x] 1.1 `lib/world.ts` — `MANSION_BALCONY` constants (`lx0/lx1/lz0/lz1/doorLX/doorHalfW/
      doorH`); `groundHeight` balcony branch at `F2` gated on `curY > F2 − 0.6`
- [x] 1.2 `lib/world.ts` — split the upper back-wall colliders around the doorway
      (`0.95 → 3.85`, `5.35 → 7.5`, lintel `F2 + doorH`), close the stairwell back
      opening with a solid `F2 → hWall` collider at `lx −0.95 → 0.95`
- [x] 1.3 `scene/Mansion.tsx` — back-wall plaster split to match colliders (closed band +
      doorway + lintel), window moved `4.5 → 6.45`, timber jambs/lintel/threshold, ajar
      `buildDoorLeaf` mesh at the balcony door

## 2. HUD readability

- [x] 2.1 `index.css` — hearts plate (dark translucent backing, border, radius, shadow),
      ember label, `#ff4d43` fill + cream stroke hearts, visible empty hearts
- [x] 2.2 `scene/Slime.tsx` — body + full-HP bar to `#45c0e8`, highlight tint to
      `#e6f7ff`

## 3. Runtime metrics

- [x] 3.1 `lib/trace.ts` — `inc/setGauge/metricsTick/metricsList`, ring-friendly
      counters with per-second rates, `window.__emberTrace.metrics()` probe
- [x] 3.2 Instrument: `collide.push`, `player.stepblock/jump/land/land.hard/fall`,
      `hp.damage/heal/regen/faint`, `slime.hit/pop`, `governor.up/down`; gauges
      `fps/draws/tris/tier`
- [x] 3.3 `App.tsx` perf panel — METRICS section (per-second rate + total, testids
      `metric-<name>`)

## 4. Acceptance tests

- [x] 4.1 `e2e/collision.spec.ts` — balcony walk-through: slab → doorway → deck
      (grounded at `F2 ± 0.25`), mesh raycast matches the deck, railing stops the walk;
      closed back wall: pushing into the old opening position stops at the wall
- [x] 4.2 `e2e/observability.spec.ts` — numeric gauges exist after boot, perf panel
      shows METRICS rows, `collide.push ≥ 5` while walking into the mansion wall,
      `hp.damage > 0` after slime contact

## 5. Validation

- [ ] 5.1 `npm.cmd run lint:sg` — new rules (`no-console-log`,
      `metrics-need-literal-names`) and the whole scan green
- [ ] 5.2 `npm.cmd run build` — tsc strict + vite build clean
- [ ] 5.3 `openspec validate --all --strict` green
- [ ] 5.4 Full `npm.cmd run test:e2e` green including existing contracts (boot budgets,
      chop, pickups, stairwell, camera clamps)
- [ ] 5.5 Screenshots reviewed: balcony stand, doorway approach, hearts plate
