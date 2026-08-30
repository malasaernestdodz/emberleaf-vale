# Change: Real-world scale, collision fixes, sword combat, collider debug view

- **Date:** 2026-08-29 (supersedes windmill/mansion sizing from 2026-08-29-expand-gameplay)
- **Type:** Feature + collision-model upgrade

## Why

Playtesting against the player reference (1.55 m tall, 0.32 m radius, 0.845 m jump
apex) showed the buildings undersized and a structural height-field conflict in the
windmill: the spiral's top wedge occupied the same angular sector as the door
wedge, so the doorway floor jumped to balcony height on one side (walk-through /
fall-through feel). The mansion staircase started at the entrance beside the well
sight-line with a cramped 3.8 m run. Combat input (attack on left click) and a
debug view of collision shapes were requested to validate the world end to end.

## What Changes

- **Windmill rescale to grand-mill proportions:** tower wall r 5.2 (Ø 10.4 m) /
  h 14.5 m on a 5.4 m mound, spiral rise 6.4 m over one turn (grade 0.29–0.49 by
  radius), hub at 12.2 m, sail radius 6.2 m (top ~18 m — 11.6x player height),
  2.08 m clear door (3.3x player diameter). Wall ring colliders are
  overlap-tiled tangent boxes (chord >= arc, count distributed so the far edge
  exactly meets the door).
- **Windmill sector fix:** the spiral spans φ ∈ [0.45, 2π−0.8]; the top landing is
  its own sector [2π−0.8, 2π−0.45) at base+top with a 0.44 m step up from the
  ramp (<= 0.55 step limit — the scaling initially produced 0.58 and was caught
  by the new scale spec); the door wedge |φ| < 0.45 is floor-level across the
  whole annulus. No sector serves two heights.
- **Solid spiral annulus:** the ramp fills r ∈ [0.7, 4.55] (plinth to wall),
  eliminating the inner-edge fall-through the player reported as "going through
  the floor".
- **Mansion stair placement + scale:** footprint 15 x 12 m at (−21.5, −16),
  floor-to-floor 3.05 m, wall height 9.3 m. The grand staircase is now a
  2 m-wide enclosed run along the BACK wall (band lz ∈ [−6, −4.1]), rising
  7.0 m eastward (23°, 16 visual steps of 0.19 m rise / 0.44 m run), entering
  from its west end ~7 m from the front door and > 18 m from the well — no
  longer on the entrance/well axis. Upstairs slab (lz < −1.9) keeps a curY gate;
  balustrade spans the full hall edge; the cantilevered balcony moved to the
  east back corner (lx 2.9–6.3) with y0-scoped rails and two ground posts.
- **Sword combat:** the sword is the default held tool; left click (movement <
  6 px) swings it — a 0.9 s arm-swing driven by `game.attack` (0.45 s vanished
  inside a single slow SwiftShader frame; 0.9 s is always visible).
- **Input buffering + frame-rate independence:** key/click edges survive 500 ms;
  jump/gravity is sub-stepped at 16 ms so the 0.845 m apex holds at any frame
  duration.
- **Collider debug view:** `C` toggles wireframe shapes for every collider
  (y0→top spans) via `src/scene/Colliders.tsx`; state exposed as
  `snapshot().colliders`.
- **Scale assurance suite (`e2e/scale.spec.ts`):** distance testing (stair-to-well
  > 18 m, stair-to-entrance > 4 m, landmark spacing), proportion testing (tower
  >= 8x player height, door clearances, stair slope/rise in real ranges), wall
  tiling seal math, landing-step limit, plus screenshot records
  (scale-windmill-door.png, scale-mansion-stair.png).
- **Tests:** full e2e realignment — teleports derived from world constants,
  new tests (sword, collider toggle, stair/slab consistency, scale assurance,
  camera spec), workers=1 with CI retries.

## Impact

- Spec deltas: `windmill-interior`, `mansion`, `character-control`,
  `interactions`, `scale-assurance` (new), `e2e-verification`.
- Validation: `npm run build` + `npm run lint:sg` + `npm run test:e2e` green;
  `openspec validate --all --strict` clean; GitHub Actions CI gate updated
  (openspec strict validation, Playwright browser cache, report artifacts,
  retries on CI).
