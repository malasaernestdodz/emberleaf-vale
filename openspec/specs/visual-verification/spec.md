# Visual Verification Specification

## Purpose

Math invariants catch geometry drift, but only rendered screenshots catch what
players actually see. Every landmark ships with (1) deterministic math checks
that run in Node and (2) a storybook gallery camera pose recorded to
`test-results/gallery/`. Both run in CI on every push.

## Requirements

### Requirement: Every prop ships with math invariants

A new or changed prop SHALL add deterministic assertions to
`e2e/props.spec.ts` (or `e2e/math.spec.ts`) that import the same world
constants the scene renders, covering fit, clearance, and walkability.

#### Scenario: Door regression is caught without a browser

- **WHEN** a door leaf, frame, or opening constant drifts out of spec
- **THEN** `e2e/props.spec.ts` fails naming the violated invariant

### Requirement: Storybook gallery records every landmark

`e2e/gallery.spec.ts` SHALL teleport the player through a table of camera poses
(one per landmark: house door, mansion door, interiors, well, fountain, pond,
windmill door) and save a screenshot per pose to `test-results/gallery/`. A new
landmark SHALL add its pose to the `SHOTS` table.

#### Scenario: Gallery is reproducible

- **WHEN** the gallery spec runs on the SwiftShader CI browser
- **THEN** every pose produces a screenshot without human input

### Requirement: Doorways assert pixel-level readability

The doorway shots SHALL read back canvas pixels and assert the doorway area is
warm (wood/interior, red channel above blue) while the sky reference pixel is
cool (blue above red), so a missing door or a hole to the sky fails the run.

#### Scenario: Hole-to-sky regression

- **WHEN** a door leaf or doorway fill disappears from the render
- **THEN** the doorway pixel check fails in `e2e/gallery.spec.ts`

### Requirement: WebGL readback works in test mode

The app SHALL enable `preserveDrawingBuffer` in LITE mode (the mode all specs
run under) so canvas pixel readback is deterministic.

#### Scenario: Lite mode enables readback

- **WHEN** the app boots with `?lite`
- **THEN** the WebGL canvas can be drawn into a 2D canvas for sampling
