# Proposal — Quests, procedural sound + settings menu, and real item visuals

## Why

The vale is explorable but has no sense of purpose, no sound, and its item art
reads as placeholder primitives. Playtest feedback (Aug 2026):

- The slime NPC change (2026-08-29-add-slime-npc) is spec'd but not implemented,
  so the sword has nothing to hit and nothing gives combat a payoff.
- There is no quest tracking; nothing tells the player what to do next.
- The hotbar shows bare text and the pickups are single primitives — they do not
  read as a rock, a flower, a log, a fish, or food.
- There is no audio at all and no in-game menu where sound can be adjusted.

## What changes

1. **Quests** — a small deterministic quest log (6 quests) driven by gameplay
   events, rendered as a HUD panel pinned top-right with progress counters,
   completion pulse animation, and a jingle.
2. **Sound** — a zero-asset procedural WebAudio layer: swing/hit/pop, pickups,
   chop, fishing, eat, sleep, quest jingle, UI clicks, slime hops, plus a soft
   looping ambience bed. No downloaded files, consistent with the project's
   everything-procedural rule.
3. **Settings menu** — an Esc / gear-button pause menu with a Sound section
   (master volume slider, SFX toggle, ambience toggle, Test-sound button),
   persisted to localStorage, frozen gameplay while open, and DOM hooks for e2e.
4. **Item visuals** — every pickup type becomes a distinct merged multi-part
   toon mesh (faceted rock, stemmed flower, log, fish with tail and eye, bread
   roll, gel blob) and every hotbar slot gets an inline SVG icon instead of a
   text-only label.
5. **Slime NPC implementation** — lands the pending 2026-08-29-add-slime-npc
   change (hop AI, sword hits, gel drops, respawn) together with the new gel
   hotbar slot so combat has an inventory payoff.

## Capabilities

### New

- `quests` — quest log state, event hooks, top-right HUD.
- `sound-system` — procedural SFX + ambience + persisted settings.
- `item-visuals` — per-type merged meshes + SVG hotbar icons.

### Modified

- `e2e-verification` — adds menu/settings/quest/slime coverage to the suite.
- `slime-npc` (via 2026-08-29-add-slime-npc) — implemented in the same pass so
  the full loop (see it → swing → pop → collect gel) is verified end to end.

## Impact

- `src/lib/{quests,audio,slime,items,world}.ts`, `src/scene/{Slime,Pickups,Player,World,Probe}.tsx/.ts`,
  `src/App.tsx`, `src/index.css`, `e2e/ui.spec.ts`, `README.md`, `AGENTS.md`.
- No new dependencies; WebAudio is browser-native.
- Boot draw-call budget unchanged (merged geometries stay instanced); the slime
  adds ~4 draw calls, so the ≤190 budget still holds with headroom.
