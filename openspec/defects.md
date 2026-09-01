# Defects Ledger

User-reported and playtest-observed defects. Every open row MUST be
reconciled by `/grill-me` into the change that fixes it (as a grilled
question + spec requirement) and closed only when that change's e2e proves
the fix. New reports go here first, then get grilled — never fixed spec-less.

| Date       | Report                                                   | Status | Change                                   |
| ---------- | -------------------------------------------------------- | ------ | ---------------------------------------- |
| 2026-08-30 | "No floor when I go up the staircase" (windmill spiral under-surface + see-through roof/floor faces) | folded | 2026-08-30-enclose-windmill-shell (Q9, spec "spiral climb", tasks 1.2/1.3) |
| 2026-08-30 | "No proper enclosed and door" (ground door frame narrower than walkable slit, leaf misaligned)      | folded | 2026-08-30-enclose-windmill-shell (Q10, spec "doorway framed", tasks 1.4) |
| 2026-08-31 | "Windmill mesh still not good / want it clean properly enclosed with just the door open, floor on top, working end to end to the balcony" — the upper wall band cuts the balcony arc over its full height, so above the balcony doorway lintel the tower shows an open notch (sky/interior) instead of solid wall (gallery/windmill-landing.png; `Windmill.tsx` band 3 theta range) | fixed  | 2026-08-31-windmill-clean-enclosure |
| 2026-08-31 | "Slime health must always be seen in front of my screen and not move when the slime moves — 2D flat, red" — the vitality bar is a world-space billboard that travels with the slime, so it drifts around the screen and can sit anywhere in the frame instead of being pinned HUD chrome | closed  | 2026-08-31-slime-hud-and-right-click-slash (e2e/combat.spec.ts: pinned-bar + always-visible tests green) |
| 2026-08-31 | "Right-click should attack instantly with a quick slash-slash-slash animation instead of waiting for the heavy swing" — the only attack binding is left-click with a 0.9 s locked swing; no right-click attack exists | closed  | 2026-08-31-slime-hud-and-right-click-slash (e2e/combat.spec.ts: instant-hit + rapid-slash tests green) |
| 2026-08-31 | "Remove the drift: why do I need right-click to see the attack speed?" — two divergent attacks shipped (0.9 s left heavy vs 0.22 s right slash); the fast attack is hidden behind one button instead of being the attack | open    | 2026-08-31-slash-combo-fx |
| 2026-08-31 | "Attack animation should go horizontal, combo-based like Zelda, with a real slash effect (AAA/indie style: mesh slash arc + post-processing), not a bare arm swing" | open    | 2026-08-31-slash-combo-fx |
| 2026-08-31 | Pre-existing regressions from the committed windmill geometry refinements (peer change): groundHeight no longer matches MILL constants at the deck/landing/wedge — math.spec.ts:59/:174, scale.spec.ts:45, collision.spec.ts:436/:526, world.spec.ts:802 fail (the last verified failing on the clean committed tree). Not touched by 2026-08-31-slash-combo-fx; its full-suite gate tracks these 6 rows as pre-existing | open    | 2026-08-31-windmill-clean-enclosure |
