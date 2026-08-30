# collider-debug-view Specification

## ADDED Requirements

### Requirement: Solid shape view toggles independently of the wireframe

A persistent `colliderSolid` state SHALL render every collider as a translucent
solid mesh using the same geometry and position as its wireframe, togglable with
the [V] key and a dedicated "[V] solid shapes" HUD button, and composable with the
[C] wireframe overlay (both on shows wires over solid volumes).

#### Scenario: V toggles solid shapes end to end

- **WHEN** the game is running and [V] is pressed
- **THEN** the snapshot reports `colSolid: true`, translucent collider volumes are
  rendered, and pressing [V] again removes them without touching the [C] state

### Requirement: Solid view keeps the wireframe color language

Solid shapes SHALL use the same active/inactive/raised color coding as the
wireframe (orange boxes, teal cylinders, pink raised, dim pass-through, white
player capsule) so both modes read identically at a glance, and labels SHALL show
within 6 m in either mode.

#### Scenario: Reading a blocking shape

- **WHEN** the player stands next to an active wall with the solid view on
- **THEN** that wall's volume is bright while pass-through shapes stay dim

### Requirement: Debug view is free at boot and cheap while on

All debug objects (wires, solid shells, labels, player capsule) SHALL be invisible
until toggled, share one geometry per collider between wire and solid
representations, and allocate nothing per frame. Boot draw-call budgets
(`drawCalls <= 190`) SHALL hold with both views off, and the combined view SHALL
stay under 420 draw calls in the browser suite.

#### Scenario: Budgets hold

- **WHEN** the e2e suite boots the world and then enables both views
- **THEN** boot draws stay within the existing budget and combined-view draws stay
  below 420 with fps above 2 in SwiftShader

### Requirement: Collider panel describes both modes

The COLLIDER DEBUG panel SHALL open when either mode is active, its hide control
SHALL clear both modes, and its legend SHALL mention the solid toggle. The intro
card SHALL list [V].

#### Scenario: Panel matches state

- **WHEN** only [V] is on
- **THEN** the panel is visible, reports solid overlays on, and its hide button
  turns both modes off
