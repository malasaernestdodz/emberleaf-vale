# grass-system Specification

## ADDED Requirements

### Requirement: One-draw-call instanced grass

The meadow SHALL render at least 40,000 grass blades as a single draw call using
an instanced buffer geometry with per-instance offset, yaw, scale, phase, and
color-mix attributes.

#### Scenario: Grass budget holds

- **WHEN** the scene is loaded
- **THEN** the probe reports grass blade count ≥ 40,000 and total frame draw
  calls ≤ 120

### Requirement: GPU wind animation

Grass sway SHALL be computed in the vertex shader from time and per-instance
phase: two superimposed sines modulated by a slow spatial gust field, weighted by
tip position (`uv.y^1.5`), with no CPU per-blade work.

#### Scenario: Wind moves blades

- **WHEN** time advances
- **THEN** blade tip positions change while CPU cost stays constant (no
  per-frame instance updates)

### Requirement: Player-bend interaction

Grass blades within ~1 m of the player SHALL bend radially away from the player
position, with falloff to zero at the outer radius.

#### Scenario: Meadow reacts to the character

- **WHEN** the player walks through dense grass
- **THEN** nearby blades displace outward (player uniform feeds the vertex
  shader each frame)

### Requirement: Stylized grass shading

Grass SHALL use a root-to-tip color gradient with autumn hue variation and fake
ambient occlusion toward the root, and SHALL fade into the scene fog at distance.

#### Scenario: No fog pop at meadow edge

- **WHEN** grass is sampled near the scatter radius limit
- **THEN** blade color blends toward the fog color
