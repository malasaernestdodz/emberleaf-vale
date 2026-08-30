# mansion-detail Specification

## MODIFIED Requirements

### Requirement: Front portico composition

The mansion front portico SHALL be laid out from `MANSION_PORTICO` constants in
`src/lib/world.ts` (never hard-coded in the scene), centered on the `MANSION_DOOR`
doorway center, with columns flanking the opening, a roof slab + cornice at
`MANSION_PORTICO.roofY`, and entry steps spanning the doorway width. The portico roof
SHALL NOT carry a balustrade (it is a porch roof, not a balcony); the only balustraded,
door-accessed deck on the mansion remains the floor-2 back balcony.

#### Scenario: Portico geometry matches constants

- **WHEN** the portico meshes are built
- **THEN** column centers, roof center and step span all derive from `MANSION_PORTICO`
  and are symmetric about the doorway center within `0.05`

#### Scenario: Balustrade regression guard

- **WHEN** `Mansion.tsx` is scanned by ast-grep
- **THEN** the removed roof-balustrade loop literals cannot be reintroduced via
  `no-hardcoded-portico-offset` (the old `px0 = −1.8` origin stays out of the scene)
