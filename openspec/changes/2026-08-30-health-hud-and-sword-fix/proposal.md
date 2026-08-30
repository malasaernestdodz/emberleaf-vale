# Change: Health system, creature vitality HUD, and hero weapon fix

- **Date:** 2026-08-30
- **Type:** Feature + bugfix

## Why

The hero's hand renders the fishing-rod stick at all times, so the player walks
around armed with a wooden log even when the sword should be drawn. Combat also
has no stakes: the slime pop gives no feedback about how close it is to popping,
and neither the slime nor the hero can be hurt. The vale needs readable health:
a vitality bar over the slime that visibly drains with every swing, and a
hearts row for the hero that reacts when the slime lands a hit.

## What Changes

- **Weapon fix:** the rod mesh is only visible while fishing; the sword is the
  default arm, the axe only while chopping.
- **Slime vitality:** the slime gets 3 HP. A gold-framed, camera-facing bar
  floats above its head and drains green → ember → red with each sword hit,
  with a red damage-trail that shrinks slower than the fill.
- **Hero health:** the hero has 5 ember hearts. The slime hurts the hero on
  touch and when its hop lands nearby (1 damage, knockback, red vignette,
  hurt sfx). 1.2 s of i-frames prevent chain damage.
- **Recovery:** hearts slowly regrow after 10 s without damage (+1 every 4 s),
  food mends +2 hearts, sleep restores all hearts.
- **Fainting:** at 0 hearts the hero faints behind a deep-red veil and wakes at
  the spawn shrine with full hearts.
- **HUD:** hearts row with count in the DOM HUD, hurt vignette, faint veil; the
  slime bar state is mirrored into the e2e snapshot (`slimeHud`, `hp`).

## Impact

- Spec deltas: `combat-health` (new), `health-hud` (new), `wield-visuals` (new).
- Code: `src/lib/health.ts` (new), `src/lib/slime.ts`, `src/scene/Slime.tsx`,
  `src/scene/Player.tsx`, `src/scene/Probe.tsx`, `src/App.tsx`,
  `src/index.css`, `src/lib/audio.ts` (hurt sfx), `e2e/health.spec.ts` (new).
- Validation: `openspec validate --all --strict`, `npm run build`,
  `npm run lint:sg`, and the new health e2e alongside the full suite.
