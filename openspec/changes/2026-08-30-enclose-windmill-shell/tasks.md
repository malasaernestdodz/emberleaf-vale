# Tasks: Enclose the windmill shell

## 1. Wall bands

- [ ] 1.1 `scene/Windmill.tsx` — split the single wall cylinder into three
      tapered bands (lower: full circle minus door slit, `[0.6, 3.87]`; mid:
      full circle, `[3.87, MILL.top]`; upper: full circle minus balcony arc,
      `[MILL.top, 0.6 + WALL_H]`), same material, per-band interpolated radii

## 2. Colliders

- [ ] 2.1 `lib/world.ts` — wall ring emits the balcony arc with
      `top = MILL.base + MILL.top` instead of skipping it; other segments keep
      the full-height top

## 3. Acceptance tests (agent must run all green)

- [ ] 3.1 `e2e/collision.spec.ts` — collider-top invariant for the capped arc
      and full-height outside it; porch-level walk-in at the arc midpoint is
      stopped outside `MILL.rWall`
- [ ] 3.2 `e2e/gallery.spec.ts` — windmill shell pose (porch view of the
      enclosed wall with the balcony above) recorded in test-results/gallery

## 4. Validation

- [ ] 4.1 `npm run spec:validate` clean
- [ ] 4.2 `npm run build` (tsc strict + vite) clean
- [ ] 4.3 `npm run lint:sg` clean
- [ ] 4.4 Full Playwright suite green; shell screenshot reviewed
