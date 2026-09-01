# Tasks: Slime pack + boss, per-slime bars, windmill door & interior perspective

## 0. Grilling

- [x] 0.1 `grilling.md` — 16 questions (regression root-cause, door
      contract, zoom numbers, drum clamp, pack layout, one-victim combat,
      boss constants, bar semantics/projection, quest regressions, perf,
      windmill ownership, e2e contracts, scope fidelity)
- [x] 0.2 Defect rows reconciled; stale 2026-08-31 windmill rows superseded
      by this change

## 1. Windmill door + heights

- [ ] 1.1 `scene/Windmill.tsx` — band 3 covers the wrapped symmetric
      balcony arc only; crown full; door leaf open; door slit clear
- [ ] 1.2 `lib/world.ts` — deck/landing/groundHeight branches re-derived;
      single-valued wedge/spiral/landing/deck
- [ ] 1.3 e2e invariants — deck height at 3 radii, landing, wedge, collider
      arc gap (flip math/scale/collision/world windmill rows green)

## 2. Mill interior perspective

- [ ] 2.1 `lib/world.ts` — `game.insideMill`; `Player.tsx` damp for
      `interior3` using the same gate
- [ ] 2.2 `scene/CameraRig.tsx` — clamp from `interior3 > 0.02`, hard clamp
      when inside, distance share 0.8 / floor 2.6, height cap
- [ ] 2.3 Spawn camera seed facing the mill door
- [ ] 2.4 e2e — max-zoom camYaw sweep keeps camera in the drum; distance
      bounds [1.5, 5.5]

## 3. Slime pack + boss

- [ ] 3.1 `lib/slime.ts` — `slimes` array (3) + `boss` object; per-entity
      spawn/respawn/wander; contact + landing splash per entity; boss
      constants (r 0.99, hp 12, windup 0.5, splash 2.2 m impulse 6.0,
      6 gel, respawn 90 s)
- [ ] 3.2 `scene/Slime.tsx` — render all pack entities (pooled groups) with
      scale by entity kind
- [ ] 3.3 `scene/Player.tsx` + `SlashFx.tsx` — hit iteration over
      `[...slimes, boss]` (one victim); hit ring at the victim
- [ ] 3.4 Colliders per entity; `skipSlimeRespawn` covers all

## 4. Bars

- [ ] 4.1 `App.tsx` — HUD block relabeled `BOSS SLIME`, bound to boss
      (`slimeHud`); keep testids
- [ ] 4.2 `scene/SlimeBars.tsx` (new) + `World.tsx` — projected flat bars
      per regular slime; pooled divs; direct style writes; hide rules
      (hidden/18 m/off-screen)
- [ ] 4.3 `index.css` — `.slime-bar` styling (flat, fixed size)
- [ ] 4.4 `scene/Probe.tsx` — `slime` = boss; new `pack` array; boss
      constants surfaced

## 5. Tests

- [ ] 5.1 `e2e/combat.spec.ts` — boss bar semantics (label/fill/count,
      always visible, drains 12→0, 0/12 while hidden); projected bars
      track pack slimes, flat styling, hidden rules; one-slash-one-victim;
      boss pop → 6 gel
- [ ] 5.2 `e2e/health.spec.ts` — stays green against the boss-mirrored
      `slime` contract
- [ ] 5.3 Camera sweep test (mill drum) + walk-in green
- [ ] 5.4 Perf burst re-baseline

## 6. Validation

- [ ] 6.1 `npm run spec:validate` clean
- [ ] 6.2 `openspec validate --all --strict` clean
- [ ] 6.3 `npm run build` clean
- [ ] 6.4 `npm run lint:sg` clean
- [ ] 6.5 Full Playwright suite green — including the 6 former windmill
      baseline rows flipping green
- [ ] 6.6 Close the four 2026-09-01 defect rows
