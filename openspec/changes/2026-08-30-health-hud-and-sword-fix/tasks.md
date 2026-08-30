# Tasks — Health, vitality HUD, and the hero's blade

## 1. Weapon fix

- [x] 1.1 Rod mesh visibility-gated to `game.tool === 'rod'` (fishing only); sword/axe unchanged
- [x] 1.2 `wield` mirror exposed for e2e regression

## 2. Creature and hero health

- [x] 2.1 `lib/health.ts`: 5 ember hearts, damage with knockback + i-frames, regen, food/sleep healing, faint/respawn
- [x] 2.2 Slime 3 HP; touch and hop-landing splash damage route through `damagePlayer`
- [x] 2.3 `hurt` sfx in the audio bank

## 3. HUD

- [x] 3.1 Slime overhead vitality bar: gold frame, green→ember→red fill, damage ghost, billboarded, depth-safe
- [x] 3.2 Hero hearts row + count, hurt vignette, faint veil in the DOM HUD

## 4. Validation

- [x] 4.1 Snapshot hooks: `hp`, `maxHp`, `hurt`, `fainted`, `slime.hp`, `slimeHud`, `wield`
- [x] 4.2 `e2e/health.spec.ts`: wield, bar drain per swing, slime hurts hero, food mend, regen, faint respawn
- [x] 4.3 `openspec validate --all --strict`, `npm run build`, `npm run lint:sg`, full e2e green
