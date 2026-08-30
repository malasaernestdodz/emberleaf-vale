# wield-visuals Specification

## ADDED Requirements

### Requirement: The hero wields the right tool

The hero's right hand SHALL show exactly one tool: the sword by default, the
axe only while chopping or beside a choppable tree, and the rod only while
fishing. No tool mesh may remain visible outside its tool state — the fishing
rod must never dangle in the hero's hand while the sword is drawn.

#### Scenario: The sword is drawn, not the rod

- **WHEN** the hero walks the vale idle, attacking, or exploring
- **THEN** the wield mirror reports `sword: true`, `rod: false`, `axe: false`,
  and the rod mesh is hidden until the hero actually casts a line
