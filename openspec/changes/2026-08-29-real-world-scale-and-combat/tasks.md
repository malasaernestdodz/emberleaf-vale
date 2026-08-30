# Tasks — Real-world scale, collision fixes, sword combat

## 1. Windmill

- [x] 1.1 Rescale tower/mound/sails to 1.4x real proportions (rWall 4.1, h 12.2, top 5.2)
- [x] 1.2 Partition sectors: door wedge / spiral / separate landing (no door-top overlap)
- [x] 1.3 Solid spiral annulus r 0.55→3.6; plinth height-field; pole circle r 0.3
- [x] 1.4 Contiguous tangent-box wall tiling with exact 1.6 m clear door + frame/leaf visuals

## 2. Mansion

- [x] 2.1 Rescale to 15 x 12 m, floor2 3.3, H 9.3; move to (−21.5, −16) away from the well
- [x] 2.2 Enclosed 2 m staircase (run 7.1, rise 3.05) starting 5.2 m inside the entrance
- [x] 2.3 Upstairs slab + balustrade with stair-head opening; y0-scoped furniture
- [x] 2.4 Back balcony with walkable-under porch (y0 colliders, corner posts only)

## 3. Combat & input

- [x] 3.1 Sword asset + default tool; left-click swing with `game.attack` progress
- [x] 3.2 500 ms input buffer for key/click edges
- [x] 3.3 Sub-stepped jump/gravity (16 ms) — frame-rate independent apex

## 4. Debug & camera

- [x] 4.1 `C`-toggled collider wireframe view with y0→top spans
- [x] 4.2 Camera clamps derive from MANSION/MILL constants (no hardcoded boxes)

## 5. Validation

- [x] 5.1 `npm run build` green (tsc strict + vite)
- [x] 5.2 `npm run lint:sg` green
- [x] 5.3 `npm run test:e2e` green (workers 1, CI retry, teleports derived from constants)
- [x] 5.4 `openspec validate --all --strict` clean
- [x] 5.5 `e2e/scale.spec.ts`: distance floors, player-relative proportions, tiling seal math, visual records
- [x] 5.6 CI workflow: openspec strict gate, Playwright browser cache, HTML report artifacts, retries
