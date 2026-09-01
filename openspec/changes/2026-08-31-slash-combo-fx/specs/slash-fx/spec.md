# slash-fx Specification

## ADDED Requirements

### Requirement: Procedural slash-arc effects ride the swing

Each slash SHALL sweep a horizontal crescent arc of additive cyan light
around the player — a procedurally built annulus-sector fan (no
downloaded textures, no sprite sheets) with feathered vertex-alpha edges
(bright cyan leading edge fading to a transparent tail), mirrored by the
combo direction, paired with a thinner counter-rotated wisp fan, and
caught by the existing bloom pass so it reads as energy. A hit SHALL flash
a small pooled impact ring at the slime. Effects SHALL pool (bounded mesh
count), allocate nothing per frame, fade out after the swing, and park
invisible when idle; their meshes SHALL be addressable by stable names
(`slash-arc-0/1`, `slash-wisp-0/1`, `slash-hit-ring`) and the combo state
SHALL mirror in the snapshot as `slash`.

#### Scenario: The arc shows during a swing and parks after

- **WHEN** the player attacks and the snapshot reports `slash.active`
- **THEN** the matching stage's arc mesh is visible via `objectVisible`,
  and after the fade both arcs and the ring park invisible

#### Scenario: The arc reads as cyan energy on screen

- **WHEN** the canvas is sampled mid-slash in the ring region around the
  player
- **THEN** blue-dominant pixels appear (the additive arc), and mid-slash
  screenshots are saved under `test-results/slash-fx/` for review

#### Scenario: Direction mirrors the combo

- **WHEN** chained slashes alternate `slash.dir`
- **THEN** the visible arc fan flips with it (stage 0's arc parks while
  stage 1's shows, and vice versa)

#### Scenario: The effect stays inside the perf budget

- **WHEN** the player bursts ~10 attacks and draw calls are compared to a
  measured idle baseline
- **THEN** draw calls rise by at most 8 at any polled instant, the fps
  gauge stays above 2, and no test asserts on wall-clock durations
