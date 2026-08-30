# Design — Health, Vitality HUD, and the Hero's Blade

Fantasy framing for Emberleaf Vale: the world is gentle, but the vale still
bites. Health reads as **ember hearts** (the valley's emblem — warmth = life),
and creature health reads as a **vitality bar** in the style of an adventurer's
bestiary: slim, gold-framed, parchment-dark backing, leaf-green fill that
warms to ember and then wound-red as the creature weakens.

## Visual language

| Element         | Choice                                                        |
| --------------- | ------------------------------------------------------------- |
| Hero hearts     | 5 ember-red hearts, gold outline, empty = hollow husk         |
| Heart count     | `4/5` in the HUD's parchment style (`--ember-soft`)           |
| Slime bar       | 0.74 × 0.1 m bar, `#d8b56a` gold frame on `#241a10` bark      |
| Bar fill        | `#7ed957` leaf → `#f4a63a` ember → `#e05d4f` wound            |
| Damage trail    | red ghost bar shrinks slower than the fill (hit feedback)     |
| Hurt flash      | radial red vignette, ~0.55 s decay                            |
| Faint veil      | deep red-black, "You fainted…", wake at the spawn shrine      |

## Mechanics

- **Slime:** 3 HP. Each sword hit in the existing 1.45 m frontal arc costs 1 HP
  and still squishes/knockbacks; 0 HP pops into gel (unchanged pop/respawn).
- **Hero:** 5 HP. Slime contact (touch or hop-landing splash within 1.35 m)
  costs 1 heart, knocks the hero back, and grants 1.2 s i-frames so a single
  bump can never drain more than one heart.
- **Regen:** after 10 s without damage, +1 heart every 4 s (the vale mends).
- **Food/sleep:** eating mends 2 hearts and keeps the energy buff; sleeping
  restores all hearts.
- **Faint:** at 0 hearts the hero faints (inputs frozen, veil in), and after
  3.2 s wakes at the spawn shrine with full hearts and brief i-frames.

## Render decisions

- The slime bar is a world-space billboard (quaternion copied from the camera,
  no allocations), drawn `depthTest: false` with a high render order so grass
  and the slime body never clip through it. Fill/ghost are left-anchored planes
  scaled by HP fraction; the fill eases fast (k≈14) and the ghost slow (k≈3.5).
- The rod is now visibility-gated like the axe/sword (`game.tool === 'rod'`
  only while fishing). A `wield` mirror (`rod/sword/axe`) is exported for the
  e2e snapshot so the always-visible-stick regression can never silently
  return.
- Health state lives in `src/lib/health.ts` (plain module object, like
  `slime`), updated from the player frame loop so pause/UI freezes hold still.

## Alternatives

- DOM overlay bar projected onto the slime — rejected: a second projection
  layer would fight the 3D depth and the existing world-space idiom.
- Hearts floating above the slime — rejected: fractional drain reads better on
  a bar; hearts are reserved for the hero.
- Death/respawn screen with buttons — rejected for tone; a soft faint-and-wake
  keeps the Ghibli gentleness and needs no UI mode switch.
