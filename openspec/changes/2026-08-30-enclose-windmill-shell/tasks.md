# Tasks: Enclose the windmill shell

## 0. Grilling

- [x] 0.1 `grilling.md` — 8 questions asked and answered against the root
      context (scope fidelity, conventions, cheat paths, seams, perf,
      determinism, existing paths, e2e contract)
- [x] 0.2 Answers folded into proposal/spec deltas — nothing silently cut

## 1. Wall bands

- [x] 1.1 `scene/Windmill.tsx` — split the single wall cylinder into three
      tapered bands (lower: full circle minus door slit, `[0.6, 3.87]`; mid:
      full circle, `[3.87, MILL.top]`; upper: full circle minus balcony arc,
      `[MILL.top, 0.6 + WALL_H]`), same material, per-band interpolated radii
- [x] 1.2 `scene/Windmill.tsx` — continuous spiral under-surface (helical
      ribbon/skirt beneath the 34 step boxes, spanning `rampR0..rIn`) so the
      climb shows no gaps (defect: "no floor on the staircase")
- [x] 1.3 `scene/Windmill.tsx` — roof cone and ground-floor disc visible from
      both sides (no sky from inside the tower; floor visible from below)
- [x] 1.4 `scene/Windmill.tsx` — ground door frame (posts, jambs, leaf)
      derived from `MILL.doorStepW`/`MILL.doorHalf`, frame fills the wall
      slit, leaf hinges at one post (defect: "no proper door")

## 2. Colliders

- [x] 2.1 `lib/world.ts` — wall ring emits the balcony arc with
      `top = MILL.base + MILL.top` instead of skipping it; other segments keep
      the full-height top

## 3. Acceptance tests (agent must run all green)

- [x] 3.1 `e2e/collision.spec.ts` — collider-top invariant for the capped arc
      and full-height outside it; porch-level walk-in at the arc midpoint is
      stopped outside `MILL.rWall`
- [x] 3.2 `e2e/gallery.spec.ts` — windmill shell pose (porch view of the
      enclosed wall with the balcony above) recorded in test-results/gallery
- [x] 3.3 `e2e/gallery.spec.ts` — tower-interior pose (spiral under-surface
      and roof visible, no sky) and doorway front pose (frame fills the slit)
      recorded and reviewed

## 4. Validation

- [x] 4.1 `npm run spec:validate` clean
- [x] 4.2 `npm run build` (tsc strict + vite) clean
- [x] 4.3 `npm run lint:sg` clean
- [x] 4.4 Full Playwright suite green; shell screenshot reviewed
