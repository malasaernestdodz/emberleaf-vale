# Change: Enclose the windmill shell (door and balcony are the only openings)

- **Date:** 2026-08-30
- **Type:** Bug fix (visual enclosure + matching collision)

## Why

Playtest screenshot (2026-08-30) shows the tower interior from outside. The
tower wall is one cylinder segment whose theta range was chosen to dodge *both*
the door slit and the vista-balcony arc at once, so both openings run the full
14.5 u wall height:

1. **Door slit above the lintel** — the framed doorway ends at the lintel
   (3.87 u), but the wall stays open from there to the top. The interior
   spiral is visible from the porch through a 2.5 u wide full-height slot.
2. **Balcony gap below the deck** — the balcony opening is only meant to exist
   above the deck (`MILL.top`), but the wall is open from the plinth up. A
   3.3 u wide full-height slot lets players (and the camera) see straight into
   the tower, and the collider ring skips that arc entirely, so the player can
   walk through the "wall" at porch level.

The house and mansion are already enclosed (walls with a door-sized gap, door
lintel filled above `openH`); only the windmill shell leaks.

## What Changes

- **Wall bands (`scene/Windmill.tsx`):** rebuild the wall as three stacked
  open-ended cylinder bands of the same taper, same material, no new material
  or texture work:
  - ground band `[0.6, lintel top]`: full circle minus the door slit;
  - mid band `[lintel top, MILL.top]`: full circle (closes the door slit above
    the lintel and the balcony gap below the deck);
  - upper band `[MILL.top, wall top]`: full circle minus the balcony arc only
    (the doorway above the landing).
- **Colliders (`lib/world.ts`):** the wall ring no longer skips the balcony
  arc. Segments inside the balcony arc (collider-angle space) get
  `top = MILL.base + MILL.top` (deck height) so they block porch-level
  walk-through but sit below the feet of a player crossing the doorway on the
  deck. All other segments keep the full-height top.
- **Spiral under-surface (`scene/Windmill.tsx`):** the 34 step boxes get a
  continuous under-surface (helical ribbon/skirt beneath the treads) so the
  climb shows no gaps — reported playtest defect "no floor when I go up the
  staircase".
- **See-through faces (`scene/Windmill.tsx`):** the roof cone and the
  ground-floor disc render single-sided the wrong way (sky from inside the
  tower; floor invisible from below) — both become visible from either side.
- **Ground door frame (`scene/Windmill.tsx`):** posts, jambs, and leaf derive
  from `MILL.doorStepW`/`MILL.doorHalf` so the frame fills the wall slit and
  the leaf hinges at one post — reported defect "no proper door".
- No changes to `groundHeight` or the walk/collision semantics beyond what
  the enclosure requires: the existing walk-in, climb, and vista paths must
  stay green.

## Impact

- Spec deltas: `windmill-shell` (new), `e2e-verification` (delta).
- Code: `src/scene/Windmill.tsx`, `src/lib/world.ts`.
- Tests: `e2e/collision.spec.ts` gains a porch-level wall-stop run plus a
  collider-top invariant for the balcony arc; `e2e/gallery.spec.ts` gains a
  windmill shell pose reviewing the enclosed wall.
- Validation: `npm run build`, `npm run lint:sg`, `npm run spec:validate`,
  full Playwright suite green.
