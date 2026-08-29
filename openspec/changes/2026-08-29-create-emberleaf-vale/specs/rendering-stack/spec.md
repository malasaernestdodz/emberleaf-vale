# rendering-stack Specification

## ADDED Requirements

### Requirement: The app boots into a rendered 3D scene

The app SHALL mount a react-three-fiber `Canvas` (WebGL2, ACES tone mapping,
clamped DPR, shadows enabled) that renders sky, terrain, and landmarks, and SHALL
expose a readiness signal before the first completed frame.

#### Scenario: Boot completes

- **WHEN** the page is loaded in a WebGL2-capable browser
- **THEN** `window.__Ghibli.snapshot().ready` becomes `true` within 30 seconds

### Requirement: Ghibli-style shading pipeline

The scene SHALL use toon materials with a quantized gradient ramp for lit
surfaces, a custom gradient sky with procedural clouds, scene fog matched to the
sky horizon color, and post-processing bloom + vignette.

#### Scenario: Post-processing active

- **WHEN** the scene renders
- **THEN** the render pipeline includes bloom and vignette passes with
  multisampled buffers

### Requirement: Soft shadows from one sun

Exactly one directional light SHALL cast shadows using a tight orthographic
frustum (±30 units) centered on the playable area; terrain SHALL receive shadows
and characters/trees/house SHALL cast them.

#### Scenario: Shadow pass configured

- **WHEN** the scene renders
- **THEN** shadow map size is ≥ 1024 and only one light casts shadows
