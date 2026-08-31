# Change: Windmill clean enclosure (door-height openings only)

- **Date:** 2026-08-31
- **Type:** Bug fix (visual enclosure, follow-up to 2026-08-30-enclose-windmill-shell)

## Why

User report (2026-08-31, `openspec/defects.md`): the windmill mesh is still
not a clean enclosure — it should read as a properly enclosed building with
just the door open, a floor on top, and a working end-to-end goal (climb to
the balcony). The 2026-08-30 change closed the door slit above its lintel and
the wall below the balcony deck, but deliberately left "the vista-balcony arc
(from the deck to the wall top)" open: the upper wall band is a single
cylinder with the arc cut over its full ~8.7 u height, so above the balcony
doorway lintel the tower shows an open notch — sky and interior are visible
from outside and from the deck (`test-results/gallery/windmill-landing.png`).

## What Changes

- **Wall bands (`scene/Windmill.tsx`):** split the upper band at the doorway
  lintel into two bands of the same taper and material:
  - doorway band `[MILL.top, MILL.top + MILL_BALCONY.lintelH]`: full circle
    minus the balcony arc (the doorway opening, deck → lintel);
  - crown band `[MILL.top + lintelH, wall top]`: full circle (solid wall above
    the doorway, closing the notch to the roof line).
- **Doorway frame (`scene/Windmill.tsx`):** jamb posts extend to
  `MILL_BALCONY.lintelH` and the lintel box sits at deck + `lintelH` + 0.13 so
  the frame covers the full doorway and the band seam, derived from the one
  new constant.
- **Constants (`lib/world.ts`):** add `MILL_BALCONY.lintelH = 3.5`; no other
  layout, collider, or `groundHeight` changes — the capped-arc collision
  contract from 2026-08-30 is unchanged.
- **Tests:** `e2e/entity-audit.spec.ts` adds headroom/jump invariants on
  `lintelH`; `e2e/gallery.spec.ts` adds a `windmill-upper` exterior pose
  reviewing the solid wall above the doorway lintel.

## Impact

- Spec deltas: `windmill-shell` (MODIFIED requirement "The tower shell is
  enclosed except for the door and the balcony doorway" — the balcony opening
  is now bounded deck → lintel).
- Code: `src/scene/Windmill.tsx`, `src/lib/world.ts`.
- Tests: `e2e/entity-audit.spec.ts`, `e2e/gallery.spec.ts`.
- Validation: `npm run spec:validate`, `npm run build`, `npm run lint:sg`,
  full Playwright suite green, gallery screenshots reviewed.
