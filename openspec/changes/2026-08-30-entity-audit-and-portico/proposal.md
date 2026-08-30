# Change: Entity audit registry + portico centered on the mansion door

- **Date:** 2026-08-30
- **Type:** Bug fix (portico alignment, fake balcony), new validation capability (entity audit)

## Why

User playtest feedback on the mansion facade:

1. **The front portico is not centered on the front door.** The door opening spans
   local `lx −1.8 → 0` (center `−0.9`), but the columned portico is built around
   `px0 = −1.8`, so its center is `−1.8` — the doorway hugs the right column and the
   composition looks wrong (screenshot).
2. **The portico roof balustrade reads as a balcony but is a fake.** There is no door
   onto the portico roof from floor 2, so the balustrade promises access that does not
   exist. Real balconies in this repo (mansion back balcony, windmill vista) all have a
   walkable doorway; a decorative balustrade at roof height must not imitate one.
3. **No end-to-end entity contract.** Each landmark (house, mansion, windmill, well,
   fountain, pond) is inspected only through scattered per-feature tests. Nothing
   answers, for every entity: does it register a cull entry, does every visible door
   opening have a matching leaf, does the doorway center match the walkable threshold,
   is the entry described uniquely? The user wants a "grill me" audit that runs end to
   end and a strict vocabulary of per-entity feature descriptions.

## What Changes

- **Portico constants:** `lib/world.ts` gains `MANSION_PORTICO` (`cx` derived from the
  doorway center, width, depth, roofY, balustrade flag) replacing the hard-coded
  `px0 = −1.8` block in `scene/Mansion.tsx`; the portico is rebuilt from those
  constants so columns, roof and steps are symmetric about the door center `−0.9`.
- **No fake balcony:** the balustrade ring on the portico roof is removed (it is a
  porch roof, not a balcony; the real accessible balcony with its open door leaf stays
  on the back facade).
- **Entity registry:** new `src/lib/entities.ts` — a static, seeded, per-landmark
  registry with a unique id, a unique human description ("smart vocabulary": kind,
  access model, features list) and the feature keys each entity must exhibit
  (`door`, `interior`, `balcony`, `porch`, `water`, `colliders`...). Doorway geometry
  constants (`MANSION_DOOR`, `HOUSE_DOOR`) already live in `world.ts`; the registry
  derives its invariants from them rather than duplicating numbers.
- **Runtime audit hook:** `Probe.tsx` exposes `__Ghibli.entityAudit()` returning, per
  entity, `{ id, described, cullRegistered, cullVisible, meshPresent }` by checking the
  live three.js scene and the cull map — so tests grill the built world, not the
  source.
- **Acceptance suite:** new `e2e/entity-audit.spec.ts` pins: unique ids and unique
  descriptions, every registry entity has a cull entry + visible meshes in the live
  scene, every door-opening entity's doorway center matches its portico/porch center,
  and a screenshot-based check that the portico columns flank the door symmetrically.
- **ast-grep rules:** `cull-id-must-be-literal` (cullId values are string literals so
  the registry can reference them) and `no-hardcoded-portico-offset` (the literal
  `−1.8` portico origin cannot return in `Mansion.tsx`).

## Impact

- Specs: `entity-audit` (new capability), `mansion-detail` delta (portico centering +
  no fake roof balustrade).
- Code: `src/lib/world.ts` (`MANSION_PORTICO`), `src/scene/Mansion.tsx`,
  new `src/lib/entities.ts`, `src/scene/Probe.tsx`.
- Tests: new `e2e/entity-audit.spec.ts`; `e2e/props.spec.ts` gains the portico/doorway
  centering invariant.
- Rules: new `rules/cull-id-must-be-literal.yml`, `rules/no-hardcoded-portico-offset.yml`.
- Validation: build + lint:sg + openspec validate + full Playwright suite green; no
  draw-call budget change (geometry count on the portico is unchanged — same meshes,
  re-centered).
