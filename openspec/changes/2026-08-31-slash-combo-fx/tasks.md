# Tasks: One fast combo slash + procedural slash-arc VFX

## 0. Grilling

- [x] 0.1 `grilling.md` — 14 questions asked and answered (drift removal,
      Zelda combo semantics, industry VFX analysis, hit/whiff feedback,
      perf/fps budgets, pixel-level validation, supersession of the
      two-button split, windmill baseline)
- [x] 0.2 Defect rows reconciled into proposal/design/spec deltas

## 1. Combo state

- [ ] 1.1 `lib/slash.ts` (new) — `slash` state machine: `start/tick/reset`,
      `SLASH_TIME 0.25`, `FADE_TIME 0.12`, `COMBO_WINDOW 1.1`, stage/dir
      alternation
- [ ] 1.2 `lib/world.ts` + `scene/Probe.tsx` — `slash` mirror in snapshot;
      `attackDur` reports the shared fast duration on both buttons

## 2. Attack path

- [ ] 2.1 `scene/Player.tsx` — both click buttons (0 and 2) run the same
      instant slash: hit check per press, `slash.start()`, no heavy path;
      blocked states and sit/faint returns call `slash.reset()` and keep
      discarding click edges
- [ ] 2.2 `scene/Player.tsx` — horizontal sweep animation: armR y-sweep by
      dir with z-lift, body counter-twist, grounded or airborne

## 3. Slash VFX

- [ ] 3.1 `scene/SlashFx.tsx` (new) — pooled arc fans + wisp fans per stage
      (annulus sector, feathered vertex alpha, additive, named meshes),
      player-follow + dir mirror, fade-out park
- [ ] 3.2 `scene/SlashFx.tsx` — pooled hit ring at the slime on 'hit'
- [ ] 3.3 `scene/World.tsx` — mount `<SlashFx />`

## 4. Tests

- [ ] 4.1 `e2e/combat.spec.ts` — both buttons share the fast slash
      (`attackDur 0.25` on left-click too); heavy-only assertions removed
- [ ] 4.2 `e2e/combat.spec.ts` — combo alternation (`slash.dir` flips) and
      late-press reset (`slash.stage` back to 0)
- [ ] 4.3 `e2e/combat.spec.ts` — VFX state: named arcs visible during
      `slash.active`, parked after; dir mirroring
- [ ] 4.4 `e2e/combat.spec.ts` — pixel check: blue-dominant pixels mid-slash
      (retried across swings); screenshots saved to
      `test-results/slash-fx/`
- [ ] 4.5 `e2e/combat.spec.ts` — perf: burst of ~10 attacks, draw calls
      ≤ baseline + 8, fps gauge > 2, no wall-clock assertions
- [ ] 4.6 Existing UI-guard/whiff/instant-hit/rapid-pop tests stay green
      under the new semantics

## 5. Validation

- [ ] 5.1 `npm run spec:validate` clean
- [ ] 5.2 `openspec validate --all --strict` clean
- [ ] 5.3 `npm run build` clean
- [ ] 5.4 `npm run lint:sg` clean
- [ ] 5.5 Playwright suite: zero NEW failures (exactly the 6 recorded
      windmill rows may stay red as the known baseline)
- [ ] 5.6 Close the two 2026-08-31-slash-combo-fx defect rows once e2e
      proves the fixes
