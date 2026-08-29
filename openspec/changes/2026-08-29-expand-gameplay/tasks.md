# Tasks — Expand gameplay

## 1. Controls & collision

- [x] 1.1 Pointer-lock look (hidden cursor, drag fallback, Esc frees), mouse-captured crosshair
- [x] 1.2 Sprint (Ctrl/Shift/double-W) + FOV kick; Space jump + air pose + landing squash
- [x] 1.3 Event-driven edge buffer (`consumeEdge`) so quick presses always register
- [x] 1.4 Vertical-span colliders (`y0`/`top`) + feetY arg + ast-grep enforcement
- [x] 1.5 Standable props: fountain rim/water, well rim (enterable), rock tops, millstone, furniture

## 2. Windmill interior

- [x] 2.1 Bigger tower + mound; ring colliders with door gap; center pole
- [x] 2.2 Spiral groundHeight (door wedge / ramp / top wedge; no seams above step height)
- [x] 2.3 Spiral visuals (18 sectors + landing), base floor, millstone, upper windows, pole
- [x] 2.4 Remove external stairs + ladder (replaced by spiral)

## 3. Mansion

- [x] 3.1 Two floors + internal 9-step staircase matching the ramp exactly (open sides)
- [x] 3.2 Upper-floor furniture colliders scoped to floor 2 (walk under balcony)
- [x] 3.3 Grass exclusion from footprint; plant moved out of stair entrance

## 4. Items & interactions

- [x] 4.1 Pickup entities + hotbar (1-4) + E pickup + G throw with ballistic landing
- [x] 4.2 Chop: axe asset + swing animation + wood reward
- [x] 4.3 Fishing: rod + line + bobber + visible fish on bite + reel timing + reward
- [x] 4.4 Sleep (full dark veil) and book (ledger panel)

## 5. Camera

- [x] 5.1 Occlusion-clamped indoor follow (OBB + circle exit) unified across all buildings

## 6. Validation

- [ ] 6.1 `npm run lint:sg` (ast-grep) passes
- [ ] 6.2 `e2e/math.spec.ts` green (spiral monotonic, seams, floors, standables)
- [ ] 6.3 Full E2E regression (17 tests) green
- [ ] 6.4 Screenshots reviewed (exterior + interior)
