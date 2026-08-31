# Tasks: Windmill clean enclosure

## 0. Grilling

- [x] 0.1 `grilling.md` — 12 questions asked and answered against the root
      context (defect reconciliation, floor-on-top read, openings, balcony
      position, collision, constants, seams, perf, determinism, e2e, sweep,
      scope fidelity)
- [x] 0.2 Answers folded into proposal/design/spec delta — nothing silently
      cut; 2026-08-31 defect row reconciled

## 1. Wall bands

- [x] 1.1 `lib/world.ts` — add `MILL_BALCONY.lintelH = 3.5` (doorway height
      above the deck)
- [x] 1.2 `scene/Windmill.tsx` — split the upper band at the doorway lintel:
      doorway band `[MILL.top, MILL.top + lintelH]` full circle minus the
      balcony arc; crown band `[MILL.top + lintelH, wall top]` full circle;
      same `BAND_R` taper and material
- [x] 1.3 `scene/Windmill.tsx` — jambs extend to `lintelH` (flush with the
      lintel bottom) and the lintel box sits at deck + `lintelH` + 0.13,
      covering the band seam; all derived from `lintelH`

## 2. Tests

- [x] 2.1 `e2e/entity-audit.spec.ts` — windmill invariants:
      `lintelH ≥ PLAYER.h + 0.5` and `lintelH > PLAYER.jumpApex + 1`
- [x] 2.2 `e2e/gallery.spec.ts` — `windmill-upper` exterior pose recording the
      solid crown wall above the doorway lintel

## 3. Validation

- [x] 3.1 `npm run spec:validate` clean
- [x] 3.2 `npm run build` (tsc strict + vite) clean
- [x] 3.3 `npm run lint:sg` clean
- [x] 3.4 Full Playwright suite green; `gallery/windmill-landing.png` and
      `gallery/windmill-upper.png` reviewed (no sky above the doorway lintel)
