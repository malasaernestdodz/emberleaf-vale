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
| 2026-09-01 | "Enclosed or why is there no door open in this windmill" — committed peer geometry left the ground door slit visually sealed (theta range covers the door arc) and deck/landing heights drifted from MILL constants (math/scale/collision/world rows failing) | open    | 2026-09-01-slime-pack-and-mill-perspective |
| 2026-09-01 | "When I'm inside the windmill the zoom-in is just too much, and wherever I look it's initially at the windmill; there should be collision so if I'm inside I see the inside only — focus on perspective" — mill interior zoom scale (0.55 factor share) still allows far camera; interior view must be inside-only with wall occlusion | open    | 2026-09-01-slime-pack-and-mill-perspective |
| 2026-09-01 | "Add more slimes and a big boss slime" — only one slime exists | open    | 2026-09-01-slime-pack-and-mill-perspective |
| 2026-09-01 | "The slime health bar above my HUD is not good — it's only for the boss supposedly; make the other slimes have [a bar] on top, flat, always on their top, 2D, not moving when they move" — HUD chrome bar must be boss-only; regular slimes get world-anchored screen-projected bars that track them but never billboard-rotate | open    | 2026-09-01-slime-pack-and-mill-perspective |
