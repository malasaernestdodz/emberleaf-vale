# Change: Expand gameplay (controls, windmill interior, mansion, items, interactions)

- **Date:** 2026-08-29 (supersedes details of 2026-08-29-create-emberleaf-vale where extended)
- **Type:** Feature expansion + collision-model upgrade

## Why

User feedback after first playable build: pass-through glitches (fountain rim, under-floor
invisible walls), too-plain character feedback (no jump/sprint/tools), the windmill was
not enterable, and interactions (chop/fish/pickup) were requested with **visible real
assets and animations**, not just inventory numbers. All features must live in OpenSpec
and be validated E2E + by pure-math tests.

## What Changes

- **Controls:** pointer-lock mouse look (hidden cursor, Esc frees), Minecraft-style;
  Ctrl/Shift/double-W sprint with FOV kick; Space jump with landing squash + air pose.
- **Collision model upgrade:** every collider gains a vertical span (`y0`→`top`).
  A collider only applies when the player body [feet, feet+1.55] overlaps that span.
  Guarantees: solid below-top (no walk-through), standable on top (jump-gated by
  apex = vy²/2g = 0.845 m), and **walk-under** for raised floors/furniture — no
  invisible walls under the mansion balcony. Enforced by ast-grep rule
  (`resolve-collisions-feet`) + E2E.
- **Standable props:** fountain rim (0.56) + wadeable basin (0.48), well rim (0.78,
  enterable, escapable), small/big rock tops (math-gated), millstone, beds/tables.
- **Windmill:** enlarged tower (r 2.9 wall, h 8.5) on a bigger mound with an interior
  **spiral staircase** (one full turn, rise 3.6). Height-field math: annulus
  r∈(1.5, 2.55), φ = atan2(−lx, lz) normalized, seam placed inside the door wedge as
  a physical drop — zero invisible seams; top balcony over the door; walkable base
  floor with millstone and center pole.
- **Mansion:** two floors (0.22 / 2.95), internal staircase matching the walkable ramp
  exactly (9 flat steps on the linear ramp), open sides (no pinch colliders), organized
  furniture per floor, upper-floor furniture colliders scoped to floor 2 (walk under),
  grass excluded from footprint.
- **Items & interactions:** pickup entities (rock/flower/log) with E pickup and G throw
  (ballistic arc, lands as pickupable again); 4-slot inventory hotbar (1-4 select);
  **chop** — axe asset appears in hand, swing animation, +1 wood; **fishing** — rod +
  line + bobber dip on bite, visible fish on the line, reel-in timing minigame, +1 fish;
  sleep → veil fades fully dark and back; book → readable ledger panel.
- **Camera:** occlusion-clamped indoor follow for all three interiors — ray-vs-OBB for
  house/mansion, ray-vs-circle for the mill — one consistent indoor factor (distance
  easing + pitch bias + ceiling clamp per building).

## Impact

- Spec deltas: `character-control`, `camera-system`, `windmill-interior` (new),
  `mansion` (new), `interactions` (new).
- Validation: E2E regression suite (17 tests) + `e2e/math.spec.ts` (pure-function math
  assertions on groundHeight/spiral/heights) + ast-grep structural scan.
