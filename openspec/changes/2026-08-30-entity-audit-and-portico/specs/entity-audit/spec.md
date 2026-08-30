# entity-audit Specification

## ADDED Requirements

### Requirement: Landmark entity registry with unique identity and vocabulary

The codebase SHALL maintain a static registry (`src/lib/entities.ts`) listing every
landmark entity (house, mansion, windmill, well, fountain, pond) with a unique `id`
matching its `userData.cullId`, a unique human-readable `description`, a `kind`, and a
non-empty `features` list drawn from the closed `FEATURE_VOCAB` vocabulary.

#### Scenario: Registry uniqueness

- **WHEN** the registry is loaded
- **THEN** all ids are unique, all descriptions are unique, and every entity declares
  at least one feature from the closed vocabulary

#### Scenario: Registry covers every cullable landmark

- **WHEN** the set of `cullId` string literals in `src/scene/**` is compared with the
  registry ids
- **THEN** the two sets are equal (no unregistered landmark, no ghost entry)

### Requirement: Runtime entity audit grills the live scene

The probe SHALL expose `__Ghibli.entityAudit()` returning, per registry entity, whether
a mesh with that `cullId` exists in the live scene, whether it registered with the
culling system, and whether it is currently visible — so tests verify the built world
end to end rather than the source text.

#### Scenario: Audit passes on the shipped world

- **WHEN** `entityAudit()` runs after boot
- **THEN** every entity reports `meshPresent = true`, `cullRegistered = true`, and a
  boolean `cullVisible`

#### Scenario: Audit answers description and features per entity

- **WHEN** `entityAudit()` runs
- **THEN** each row carries the entity's unique description and declared features, so
  an inspector can answer "what is this and what should it have" from runtime data

### Requirement: Portico is centered on the mansion doorway

The mansion front portico SHALL be built from `MANSION_PORTICO` constants derived from
`MANSION_DOOR` so its columns, roof and steps are symmetric about the doorway center
`hingeLX + openW / 2`; both columns SHALL stand equidistant from that center and clear
of the open door-leaf swing corridor.

#### Scenario: Column symmetry about the doorway

- **WHEN** the portico column local positions are compared with the doorway center
- **THEN** the left and right columns are equidistant from it (tolerance `0.05`), and
  neither column overlaps the doorway opening

#### Scenario: Portico reads centered in a screenshot

- **WHEN** the gallery façade pose is captured from the doorway approach
- **THEN** the doorway horizontal center lands between the two columns in image space
  (both columns visible, neither cropped)

### Requirement: No fake balconies on decorative roofs

Any balustrade at roof height SHALL imply a real traversable deck with a door leaf onto
it; decorative porch roofs SHALL NOT carry a balustrade. The mansion portico roof
SHALL keep its slab and cornice without a balustrade ring.

#### Scenario: Portico roof carries no balustrade

- **WHEN** the portico roof is inspected in geometry or in the façade screenshot
- **THEN** no railing posts or rails exist on the roof, and the accessible mansion
  balcony (back facade, with its open door leaf) is unchanged
