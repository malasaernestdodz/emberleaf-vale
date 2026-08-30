# Tasks — Quests, sound, settings menu, item visuals (+ slime implementation)

## 1. Quests

- [ ] 1.1 `lib/quests.ts`: 6-quest table, `questEvent` hook, completion toast + `game.questVer`
- [ ] 1.2 Top-right HUD panel with progress counters, active-first ordering, done section
- [ ] 1.3 Event hooks: plaza arrival, flower pickups, chop, fish, slime pop, sleep
- [ ] 1.4 CSS completion pulse animation + quest jingle on complete

## 2. Sound

- [ ] 2.1 `lib/audio.ts`: lazy WebAudio context, master gain, procedural one-shots (swing, hit, pop, pickup, throw, chop, splash, bite, reel, eat, sleep, quest, click, hop)
- [ ] 2.2 Ambience bed: looped filtered-noise breeze + seeded bird chirps, independent toggle
- [ ] 2.3 Settings state (`master`, `sfx`, `ambience`) persisted to localStorage
- [ ] 2.4 Wire SFX calls into Player/Slime/quests/UI paths

## 3. Settings menu

- [ ] 3.1 `game.menu` state; Esc + gear-button toggle; pointer lock exit; gameplay freeze via `uiOpen`
- [ ] 3.2 Menu card: master volume slider, SFX + ambience checkboxes, Test-sound button, resume button
- [ ] 3.3 `.clickable-ui` guard in `lib/input.ts` so UI clicks never reach the canvas
- [ ] 3.4 CSS: blurred backdrop, slide-in card, hover states

## 4. Item visuals

- [ ] 4.1 Merged multi-part geometry per pickup type with vertex colors (rock, flower, wood, fish, food, gel)
- [ ] 4.2 Per-instance color variance for rocks; idle bob/spin for light items
- [ ] 4.3 Inline SVG hotbar icons per slot type (`.slot-icon`), gel included
- [ ] 4.4 Gel as slot 6: `SLOT_TYPES`, digit loops, held-item child, eat-check by type

## 5. Slime NPC (lands 2026-08-29-add-slime-npc)

- [ ] 5.1 `lib/slime.ts` state machine + seeded wander sampling with keep-out zones
- [ ] 5.2 `scene/Slime.tsx` squishy toon mesh + breathing/hop/squish animation
- [ ] 5.3 Live circle collider (r 0.45) with player-push yield
- [ ] 5.4 Frontal-arc sword hit: squish + 4.5 m/s knockback + hit counter; third hit pops 1–2 gel pickups, hides 20 s, respawns at spawn point

## 6. Verification

- [ ] 6.1 Snapshot: `slime {x,y,z,state,hits,visible}`, `menu`, `quests`, `audio` + hooks (`skipSlimeRespawn`)
- [ ] 6.2 `e2e/ui.spec.ts`: menu open/close, slider + toggles persist, Test-sound, quest HUD updates after a flower pickup, 3-swing slime pop → gel pickup → respawn, hotbar icons render
- [ ] 6.3 `npm run build` + `npm run lint:sg` green
- [ ] 6.4 Full `npm run test:e2e` green (existing 32 + new UI suite)
- [ ] 6.5 `openspec validate --all --strict` clean; screenshots reviewed
