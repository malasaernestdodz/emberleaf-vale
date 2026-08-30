# Tasks — Quests, sound, settings menu, item visuals (+ slime implementation)

Status note (2026-08-30): implemented jointly with the parallel
`2026-08-30-sound-hud-and-mansion-polish` change (shared `lib/audio.ts`, merged menu/HUD
shell in `App.tsx`). Verified 2026-08-30: build + `lint:sg` + `openspec validate --all
--strict` green; Playwright UI suite green for menu freeze/resume, gear menu, volume
slider + toggle persistence, quest HUD advancing on a real flower pickup, and hotbar
icons. The slime-pop e2e case was mid-flight while the parallel
`2026-08-30-health-hud-and-sword-fix` session refactored sword/slime combat live and
rebuilt `dist` under the running suite (server resets, not game defects — pickup and
input paths were re-verified directly against both the dev and preview servers after
raising the key-edge buffer in `lib/input.ts` so presses survive SwiftShader frame
stalls).

## 1. Quests

- [x] 1.1 `lib/quests.ts`: 6-quest table, `questEvent` hook, completion toast + `game.questVer`
- [x] 1.2 Top-right HUD panel with progress counters, active-first ordering, done section
- [x] 1.3 Event hooks: plaza arrival, flower pickups, chop, fish, slime pop, sleep
- [x] 1.4 CSS completion pulse animation + quest jingle on complete

## 2. Sound

- [x] 2.1 `lib/audio.ts`: lazy WebAudio context, master gain, procedural one-shots (swing, hit, pop, pickup, throw, chop, splash, bite, reel, eat, sleep, quest, click, hop)
- [x] 2.2 Ambience bed: looped filtered-noise breeze + seeded bird chirps, independent toggle
- [x] 2.3 Settings state (`master`, `sfx`, `ambience`) persisted to localStorage
- [x] 2.4 Wire SFX calls into Player/Slime/quests/UI paths

## 3. Settings menu

- [x] 3.1 `game.menu` state; Esc + gear-button toggle; pointer lock exit; gameplay freeze via `uiOpen`
- [x] 3.2 Menu card: master volume slider, SFX + ambience checkboxes, Test-sound button, resume button
- [x] 3.3 `.clickable-ui` guard in `lib/input.ts` so UI clicks never reach the canvas
- [x] 3.4 CSS: blurred backdrop, slide-in card, hover states

## 4. Item visuals

- [x] 4.1 Merged multi-part geometry per pickup type with vertex colors (rock, flower, wood, fish, food, gel)
- [x] 4.2 Per-instance color variance for rocks; idle bob/spin for light items
- [x] 4.3 Inline SVG hotbar icons per slot type (`.slot-icon`), gel included
- [x] 4.4 Gel as slot 6: `SLOT_TYPES`, digit loops, held-item child, eat-check by type

## 5. Slime NPC (lands 2026-08-29-add-slime-npc)

- [x] 5.1 `lib/slime.ts` state machine + seeded wander sampling with keep-out zones
- [x] 5.2 `scene/Slime.tsx` squishy toon mesh + breathing/hop/squish animation
- [x] 5.3 Live circle collider (r 0.45) with player-push yield
- [x] 5.4 Frontal-arc sword hit: squish + 4.5 m/s knockback + hit counter; third hit pops 1–2 gel pickups, hides 20 s, respawns at spawn point (e2e coverage finished by the parallel `2026-08-30-health-hud-and-sword-fix` combat rework)

## 6. Verification

- [x] 6.1 Snapshot: `slime {x,y,z,state,hits,visible}`, `menu`, `quests`, `audio` + hooks (`skipSlimeRespawn`)
- [x] 6.2 `e2e/ui.spec.ts`: menu open/close, slider + toggles persist, Test-sound, quest HUD updates after a flower pickup, 3-swing slime pop → gel pickup → respawn, hotbar icons render (slime case owned by the parallel health/sword change)
- [x] 6.3 `npm run build` + `npm run lint:sg` green
- [ ] 6.4 Full `npm run test:e2e` green (blocked only by the concurrent session rebuilding `dist` mid-run; rerun once that change lands)
- [x] 6.5 `openspec validate --all --strict` clean; screenshots reviewed
