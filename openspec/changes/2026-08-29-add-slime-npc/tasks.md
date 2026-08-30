# Tasks — Slime companion NPC

## 1. Entity

- [ ] 1.1 Seeded spawn near the plaza path + merged squishy sphere mesh with toon material
- [ ] 1.2 Circle collider r 0.45 + player-push yield in the collision pass
- [ ] 1.3 Idle/hop state machine with ballistic height-field hops and keep-out sampling

## 2. Combat interaction

- [ ] 2.1 Frontal-arc hit probe wired to the left-click sword swing (`game.attack`)
- [ ] 2.2 Squish punch + knockback impulse on hit; pop into gel drops on third hit
- [ ] 2.3 Gel item type + pickup integration; 20 s respawn at the spawn point

## 3. Validation

- [ ] 3.1 Snapshot exposure (`slime: {x, y, z, state, hits}`) + e2e for hop, hit, pop, respawn
- [ ] 3.2 `npm run build` + `npm run lint:sg` + full e2e green
- [ ] 3.3 `openspec validate --all --strict` clean
