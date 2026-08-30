# Design — Quests, sound, settings menu, item visuals

## Context

The game loop already covers movement, buildings, items, fishing, sleeping and
sword swings, all validated through a `window.__Ghibli` snapshot contract. The
missing pieces are purpose (quests), feedback (audio), presentation (item art),
and a place to adjust audio (menu). Constraints from `openspec/project.md`
apply: strict TypeScript, no comments, seeded randomness, zero per-frame
allocation, no downloaded assets.

## Goals / Non-goals

- Goals: quest log with top-right HUD; procedural SFX + ambience with a
  persisted settings menu; distinctive merged item meshes + SVG hotbar icons;
  land the slime NPC with a gel item slot.
- Non-goals: no music composition (ambience bed only), no quest scripting
  runtime (fixed quest table), no sprite/texture downloads, no state library
  (the existing `game` singleton + 150 ms React polling stays).

## Decisions

### D1. Quests live in `lib/quests.ts` as a fixed table

Six quests with `{id, title, desc, target}`; mutable `progress`/`done` fields.
Gameplay code calls `questEvent(id, n)`; completion fires a toast + jingle and
bumps `game.questVer` so the HUD polls cheaply. No persistence across reloads —
a session-scoped log matches the game's sleep-to-save feel and keeps e2e
deterministic.

### D2. Audio is a lazily-created WebAudio graph in `lib/audio.ts`

One `AudioContext` created on first user gesture; a master `GainNode` feeds
every one-shot SFX (oscillator + envelope, or filtered noise burst). Ambience
is a looped noise buffer through a lowpass whose gain/filter are LFO-wobbled.
All randomness (chirp/breeze timing) uses `mulberry32(777)` so the
no-Math-random ast-grep rule holds. Settings (`master`, `sfx`, `ambience`)
persist to `localStorage['ev-audio-v1']`. Audio state is never part of world
determinism — it only needs to be readable by the snapshot.

### D3. The menu is DOM, state lives on `game.menu`

Esc (window keydown in `App`) or a gear button toggles `game.menu`; gameplay
code already funnels through `uiOpen`, which now includes `game.menu`. Opening
the menu exits pointer lock so the cursor can reach the slider. All controls
carry stable classes (`.menu-slider`, `.menu-check`, `.menu-btn`) that e2e
drives directly. HUD mousedown/mouseup events targeting `.clickable-ui`
elements are ignored by `lib/input.ts` so clicking the menu never swings the
sword.

### D4. Item meshes are merged per type, rendered as 6 instanced meshes

Each pickup type gets one merged `BufferGeometry` (three-stdlib-style
`mergeGeometries`, same approach as the trees) with per-part vertex colors and
a single `meshToonMaterial vertexColors`. Types stay instanced (one draw call
each), so the draw-call budget is untouched. Gel reuses the same pipeline.
Hotbar icons are inline SVGs (`.slot-icon`) — resolution-independent, no
downloads, and stylable with the same CSS animations.

### D5. Slime logic lives in `lib/slime.ts`, rendering in `scene/Slime.tsx`

The state machine (idle → wind-up → ballistic hop → land, plus `hidden`
after popping) updates a plain exported object so both the renderer and the
snapshot read the same data. Keep-out sampling rejects points on paths,
buildings, pond, rims and world edge with a seeded rng. The slime's circle
collider is a live entry in `COLLIDERS` whose x/z/r are mutated each frame
(r=0 while hidden), preserving the "yields to push" behavior: on player
overlap the slime is displaced, not the player. Sword hit detection stays in
`Player.tsx` where the swing already fires: frontal arc
`dot(forward, toSlime) > 0.5`, dist < 1.4, knockback 4.5 m/s, third hit pops
1–2 gel pickups and hides the slime for 20 s (test hook `skipSlimeRespawn()`
shortens the wait for e2e).

### D6. Gel becomes hotbar slot 6

`SLOT_TYPES` grows to `['rock','flower','wood','fish','food','gel']`; digit
loops, the held-item group, and the eat-food slot check switch from index
arithmetic to type lookups. Boot pickup count stays 23 (gel only spawns from
slime pops), so existing e2e assertions hold.

## Risks / Trade-offs

- Ambience scheduling uses setTimeout chains — acceptable because audio is
  non-deterministic decoration, not world state.
- Merged vertex-colored geometries slightly increase triangle count; budget
  assertions only floor tris, so headroom is fine.
- Menu + HUD clicks interacting with the canvas input path is guarded by the
  `.clickable-ui` filter; the intro card stays pointer-events-none.

## Migration plan

Single change: add the new libs/scene files, rewire `App`, `Player`, `Probe`,
`items`, `world`, extend the e2e suite with `e2e/ui.spec.ts`, and check off the
pending `add-slime-npc` tasks once the full loop is green.

## Open questions

None.
