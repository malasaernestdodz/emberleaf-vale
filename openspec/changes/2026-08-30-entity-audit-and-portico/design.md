# Design: Entity audit registry + portico centered on the mansion door

## Context

The mansion facade is built from merged geometry buckets in `scene/Mansion.tsx`. The
front portico (columns + roof + steps) is laid out around a hard-coded `px0 = −1.8`
while the doorway (`MANSION_DOOR`) spans `hingeLX −1.8 → 0`. Two consequences: the
portico reads off-center, and its roof balustrade imitates the accessible balconies
(mansion back, windmill vista) that all have real door leaves.

The repo already has a validation philosophy: constants in `lib/world.ts`, invariants
in `e2e/props.spec.ts`, visual poses in `e2e/gallery.spec.ts`, runtime introspection
through `window.__Ghibli`. The entity audit extends that philosophy instead of
inventing a parallel one.

## Goals / Non-Goals

- Goals:
  - Portico symmetric about the doorway center, expressed as constants.
  - Remove the fake roof balustrade (keep the porch roof itself).
  - A single registry that describes every landmark entity: unique id, unique
    description, declared features.
  - A runtime audit (`__Ghibli.entityAudit()`) that grills the live scene: cull
    registration, mesh presence, visibility.
  - ast-grep guardrails so new scene code keeps ids literal and the old offset stays
    out.
- Non-Goals:
  - Not adding new furniture or interiors behind doors (existing interiors already
    covered by `house-and-interior`, `mansion` specs).
  - Not switching the portico to instanced meshes; draw-call budget unchanged.
  - Not auditing grass/trees/rocks instanced props (covered by perf/cull specs).

## Decisions

### D1: Portico centering comes from `MANSION_DOOR`, not a new magic number

`MANSION_PORTICO.cx = (MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2)` → `−0.9`.
Columns sit at `cx ± halfW`, steps span the full width, the pediment roof is centered
at `cx`. The e2e invariant asserts symmetry: column distances to the doorway center
are equal, and both columns clear the door swing corridor.

### D2: Porch roof keeps its cornice, loses the balustrade

The balustrade ring (`F2 + 0.66` cream posts + top rail) is deleted. The roof slab and
cornice remain. Rationale: every balustraded deck in this repo is walkable and has a
door; a decorative one violates the "visual promise = traversable reality" rule the
user cares about. This becomes a spec requirement so it is testable.

### D3: Registry shape — static, seeded, feature-keyed

`src/lib/entities.ts` exports `ENTITIES: EntityDef[]` with:

```ts
type EntityDef = {
  id: string            // matches userData.cullId
  kind: string          // 'building' | 'structure' | 'water'
  description: string   // unique, human-readable, mentions kind + access + features
  features: string[]    // subset of FEATURE_VOCAB
}
```

`FEATURE_VOCAB` is a closed list: `door`, `interior`, `balcony`, `porch`, `roof`,
`water`, `colliders`, `interactable`. Each entity's `features` must be non-empty and
subset-checked; ids and descriptions must be globally unique (the "smart vocabulary"
requirement). Door/opening geometry stays in `world.ts`; the registry references it.

### D4: Runtime audit walks the live scene

`Probe.tsx` gains `entityAudit()`:

- For each `EntityDef`, look up `scene.getObjectByName`-style traversal by
  `userData.cullId` (same mechanism `Culler.tsx` already uses).
- Return `{ id, meshPresent, cullRegistered: boolean, cullVisible: boolean | null,
  described, features }`.
- Entities missing from the scene or from `CULL_DEFS` fail in tests — this is the
  end-to-end "grill" the user asked for: what you see (mesh) is registered (cull) and
  documented (registry).

### D5: Guardrails

- `rules/cull-id-must-be-literal.yml` — `userData={{ cullId: $X }}` requires a string
  literal, so registry ↔ scene linkage cannot silently break.
- `rules/no-hardcoded-portico-offset.yml` — forbids the standalone `−1.8` literal in
  `Mansion.tsx` (the regression that caused the off-center portico).

## Risks / Trade-offs

- The audit adds a one-time traversal cost behind a test-only hook — zero runtime
  impact in normal play.
- A closed feature vocabulary needs occasional extension; subset validation makes
  forgetting the extension loud in e2e instead of silent.
- Removing the balustrade slightly changes the facade silhouette; acceptable — the
  screenshot shows it reads as a broken promise, not decoration.

## Migration Plan

1. Add `MANSION_PORTICO` + registry + audit hook (additive).
2. Re-center portico geometry, drop balustrade (visual fix).
3. Add tests + rules; run all gates.
4. Rollback = revert the single change folder; no persisted state involved.
