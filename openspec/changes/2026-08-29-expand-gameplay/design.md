# Design — Expand gameplay

## Height-aware collision (the core fix)

`Collider` gains optional `y0` (bottom) and `top`. `resolveCollisions(px, pz, r, feetY)`
skips a collider when either holds:

- `feetY > top − 0.3` → player is at/above the top: they are landing on it or standing
  on it (standability is gated by jump apex: vy²/2g = 5.2²/32 = 0.845 m, so any top
  ≤ 0.82 is jump-reachable — the "math depending on the object").
- `feetY + 1.55 < y0 + 0.05` → the player body passes entirely underneath.

ast-grep rule `resolve-collisions-needs-feet` fails any 3-argument call site.

## Spiral stairwell math (no invisible seams)

A single-valued height field cannot represent a full-turn spiral, because φ wraps:
the seam (φ = 0/2π) would be a 3.6 m invisible wall. Resolution:

- Sector band: `φ = atan2(−lx, lz)` normalized to [0, 2π); annulus r ∈ (1.5, 2.55).
- Door wedge `φ < 0.35` → ground floor (seam lives here, visually open above the door).
- Ramp `φ ∈ (0.35, 2π−0.35)` → `base + 0.02 + ((φ−0.35)/(2π−0.7))·3.58` (monotonic).
- Top wedge `φ ≥ 2π−0.35` → balcony at `base + 3.6`.
- Every crossing is continuous within a step (≤ 0.06 jump between sectors); the only
  vertical drop is the physical stairwell opening above the door. Verified by
  `math.spec.ts` (monotonic sweep + seam assertions) and the poll-steered E2E climb.

## Fishing/chop as first-class animations

`game.tool ∈ {'', 'axe', 'rod'}` drives visible right-hand assets parented to the arm:
axe (handle + steel head) with a 4-pi-swing during chop progress; rod + line + bobber
(bobber dips on bite, visible fish cone on the line). Chop grants wood at swing apex;
fishing runs a cast → bite window (1.5 s) → reel timing loop.

## Indoor camera consistency

One indoor factor `indoor = max(interior_house, interior_mansion, interior_mill)`;
per-building exit distance via ray-vs-OBB (slab method) or ray-vs-circle (quadratic
root); distance, pitch bias (+0.2) and ceiling clamps all derive from the same factor —
zooming behaves identically in every building.

## Regression guardrails

- `e2e/math.spec.ts` — pure groundHeight/spiral/floor assertions in Node (no browser).
- ast-grep scan in `npm run lint:sg`.
- Full Playwright suite: 17 tests incl. walk-under-balcony, spiral climb, chop/fish.
