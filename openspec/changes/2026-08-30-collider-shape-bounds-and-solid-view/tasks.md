# Tasks: Collider shape bounds + solid shape debug view

## 1. Finite collider bounds

- [x] 1.1 `lib/world.ts` — cottage wall boxes cap at `HOUSE.h`; bookshelf at 1.9;
      mansion full-height walls at `MANSION.hWall` (new constant on `MANSION`);
      fountain column top 2.6; well posts y0 0.4 → 2.0
- [x] 1.2 `lib/world.ts` — windmill wall ring y0 `base + floorH`, top
      `base + 0.6 + MILL_TOWER.h`; center pole y0 `base + floorH`, top `base + 14.2`
- [x] 1.3 `lib/world.ts` + `lib/trees.ts` — tree colliders `r 0.45 s`, `top 3.4 s`;
      regrow restores both

## 2. Solid shape debug view

- [x] 2.1 `lib/world.ts` — `game.colliderSolid` state
- [x] 2.2 `scene/Colliders.tsx` — translucent solid shell per collider reusing the
      wireframe geometry, [V] edge toggle, active/inactive/raised color parity with
      wires, solid player capsule, sprites visible in either mode
- [x] 2.3 `App.tsx` — "[V] solid shapes" HUD button, panel opens for either mode,
      hide button clears both, legend + intro hint document [V]
- [x] 2.4 `scene/Probe.tsx` — snapshot `colSolid`

## 3. End-to-end verification

- [x] 3.1 `e2e/collider.spec.ts` — finite bounds for all colliders; tree cap
      between trunk and canopy; [C]/[V] toggle flow with draw-call (< 420) and fps
      budgets; screenshots: wire house, solid house, solid windmill, solid tree
- [x] 3.2 Raycast parity: fountain column mesh ≈ collider top (±0.2), windmill
      wall mesh ≈ ring top (±0.35), tree collider top below visible canopy hit

## 4. Validation

- [x] 4.1 `openspec validate --all --strict`
- [x] 4.2 `npm.cmd run lint:sg` (ast-grep rules green)
- [x] 4.3 `npm.cmd run build` (tsc strict + vite) and full `npm.cmd run test:e2e`
- [x] 4.4 Screenshots reviewed: overlays hug house, windmill and trees
