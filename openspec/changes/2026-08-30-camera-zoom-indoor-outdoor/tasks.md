# Tasks — Indoor↔outdoor camera zoom + drift guards

## 1. Wall-distance helpers

- [ ] 1.1 `lib/camera.ts`: `obbWall` (ray-vs-OBB, exit/entry/Infinity) and
      `circleWall` (ray-vs-circle, exit/entry/Infinity), pure and
      allocation-free

## 2. CameraRig

- [ ] 2.1 Replace `obbExit`/`circleExit` with the shared helpers for the
      indoor clamps (skip when `Infinity`)
- [ ] 2.2 Outdoor occlusion dolly: house/mansion/windmill entry clamp with the
      wall-top height gate and 0.5 m clearance
- [ ] 2.3 Guard interior position clamps with inside membership (house box,
      mansion box, mill radius)

## 3. Probe

- [ ] 3.1 Expose `game.interior` in the `__Ghibli` snapshot

## 4. E2E regression

- [ ] 4.1 Pure-math invariants: inside exit, outside entry, miss = Infinity,
      indoor clamp finite in every direction, outdoor clamp leaves the camera
      outside the real footprint, margin monotonicity
- [ ] 4.2 Browser journey: walk in → indoor bounds → wheel zoom in/out and
      orbit indoors → walk out → unoccluded segment invariant while exiting →
      full zoom distance restored with the camera outside the footprint

## 5. Structural drift guards (ast-grep)

- [ ] 5.1 Presence rules: indoor `obbWall` clamp, windmill `circleWall` clamp,
      outdoor occlusion dolly, `damp(game.interior, ...)` easing
- [ ] 5.2 Forbidden-shape rules: unguarded `interior > 0.5` position clamps,
      direct `camera.position.set`, unclamped wheel zoom, snapped
      `game.interior`
- [ ] 5.3 `Tsx` language + file scoping verified by mutation testing (each
      rule fires on its drift, silent on the fixed code)

## 6. CI + docs

- [ ] 6.1 `test:camera` npm script; dedicated camera regression step in
      `ci.yml` before the full Playwright suite
- [ ] 6.2 README validation section updated

## 7. Verification

- [ ] 7.1 `npm run build` + `npm run lint:sg` green (and red on injected
      drift)
- [ ] 7.2 `npx playwright test e2e/camera.spec.ts e2e/math.spec.ts` green
- [ ] 7.3 `openspec validate --all --strict` clean
