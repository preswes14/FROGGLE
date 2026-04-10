# FROGGLE Beta Testing Quick Reference

## Quick Fix Commands
```bash
./build.sh            # Rebuild index.html after editing src/ files
./extract.sh          # Re-extract modules from index.html (if needed)
```

## Source File Locations

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/constants.js` | Game data, heroes, enemies, sigils | `H`, `E`, `SIGIL_DESCRIPTIONS`, `applyDamageToTarget()` |
| `src/state.js` | State object `S`, save/load | `S`, `upd()`, `saveGame()`, `toast()`, `T()` |
| `src/combat.js` | Combat engine, targeting, turns | `render()`, `act()`, `executeInstance()`, `enemyTurn()`, `getLevel()` |
| `src/neutrals.js` | Neutral encounters, tutorial | `neutral()`, `showShopkeeper1/2()`, `showOracle1/2()`, etc. |
| `src/screens.js` | UI screens, Ribbleton, win/death | `showRibbleton()`, `showDeathScreen()`, `win()`, `title()` |
| `src/settings.js` | Debug menu, settings | `showDebugMenu()`, `debugAddGold()`, `debugJumpFloor()` |
| `src/controller.js` | Steam Deck gamepad support | `GamepadController` |
| `src/sounds.js` | Web Audio API sound effects | `SoundFX.play()`, `ProceduralMusic` |
| `src/main.js` | Init, window.onload | Entry point |

## Critical State Properties (`S` object)

### Hero State
```javascript
S.heroes[i] = {
  n: 'Warrior',      // Name
  p: 2,              // POW (damage/heal scaling)
  h: 5,              // Current HP
  m: 5,              // Max HP
  sh: 0,             // Shield (persists, caps at max HP)
  g: 0,              // Ghost charges (0-9)
  st: 0,             // Stun turns (>0 = stunned)
  ls: false,         // Last Stand mode
  lst: 0,            // Last Stand turn counter
  s: ['Attack'],     // Sigils
  ts: [],            // Temp sigils this run
}
```

### Combat State
```javascript
S.activeIdx          // Currently acting hero index (-1 = none)
S.acted              // Array of hero indices that acted
S.pending            // Current action: 'Attack', 'Shield', 'D20_TARGET', etc.
S.targets            // All confirmed target IDs
S.currentInstanceTargets  // Targets for current instance
S.instancesRemaining // Instances left
S.enemies            // Enemy array
S.recruits           // Recruited enemy array
S.round              // Current combat round
S.turn               // 'player' or 'enemy'
```

### Progression State
```javascript
S.floor              // Current floor (0-20)
S.gold               // Permanent gold
S.xp                 // Permanent XP
S.sig                // Permanent sigil levels {Attack: 0, ...}
S.tempSigUpgrades    // Run-only sigil upgrades
S.gameMode           // 'Standard' or 'fu' (Frogged Up)
```

## Debug Menu (Enable in Settings > Gameplay > Debug)

Access via **Settings > Gameplay > Enable Debug Mode**, then **Open Debug Tools**

- **+100 Gold** / **+100 XP** - Add resources
- **Jump to Floor** - Skip to any floor 1-19
- **Set Sigil Level** - Set any sigil to 0-5
- **Update Hero Stats** - Change POW/Max HP
- **Revive from Last Stand** - Restore heroes to 50% HP
- **Deal 50 DMG to Enemy** - Quick kill
- **Oops All 20s** - All D20 rolls auto-succeed

## Common Bug Areas to Watch

1. **Shield Cap**: `if(hero.sh > hero.m) hero.sh = hero.m`
2. **Stun Check**: `if(hero.st > 0)` = stunned, skip turn
3. **Last Stand**: `hero.ls === true` = can ONLY use D20
4. **Ghost before Last Stand**: Ghost charges block lethal first
5. **Always call `render()`** after state changes
6. **Multi-instance**: Check `S.instancesRemaining` and `S.currentInstanceTargets`

## Floor Composition

| Floor | Encounter |
|-------|-----------|
| 1 | N× Goblin |
| 3 | N× Wolf |
| 5 | 2N× Orc |
| 7 | N× (Giant + Wolf + Goblin) |
| 9 | N× Cave Troll |
| 11 | 5N× Goblin (AMBUSH - heroes stunned) |
| 13 | 5N× Wolf |
| 15 | N× Dragon |
| 17 | N× (Cave Troll + Giant + Orc + Wolf + Goblin) |
| 19 | N× Flydra (boss) |

(N = number of heroes, 2 or 3)

## Neutral Encounters

Deck cycles through: `shopkeeper`, `wishingwell`, `treasurechest`, `wizard`, `oracle`, `encampment`, `gambling`, `ghost`, `royal`

Each has Stage 1 and Stage 2 versions.

## Key Animation Timings

From `ANIMATION_TIMINGS` in constants.js:
- `ATTACK_IMPACT`: 200ms
- `ACTION_COMPLETE`: 400ms
- `TURN_TRANSITION`: 500ms
- `FLOOR_INTERSTITIAL`: 1500ms
- `TOAST_SHORT`: 1000ms

Use `T(ms)` to adjust for animation speed setting.

## Sigil Reference

### Active Sigils (use hero's action)
| Sigil | Effect |
|-------|--------|
| Attack | Deal POW × level hits |
| Shield | Grant 2×POW shield |
| Heal | Restore 2×POW HP |
| D20 | Roll dice, pick gambit |
| Grapple | Stun L turns (recoil damage) |
| Alpha | Grant L extra actions to ally |
| Ghost | Gain L ghost charges |

### Passive Sigils (always active)
| Sigil | Effect |
|-------|--------|
| Expand | Total targets = 1 + Expand level |
| Asterisk | First action triggers +L times |
| Star | Multiply XP (1.5×, 2×, 2.5×, 3×) |

## D20 Gambits

| Gambit | DC | Effect |
|--------|----|----|
| CONFUSE | 16 | Enemy hits allies |
| STARTLE | 15 | Enemy loses sigil |
| MEND | 14 | Heal 3 HP |
| STEAL | 12 | Steal Gold |
| RECRUIT | 20 | Convert enemy |

## Sound Effects

Key sounds: `hit`, `crit`, `heal`, `shield`, `d20roll`, `nat20`, `nat1`, `victory`, `death`, `ribbit`, `croak`, `hop`, `portal`, `coinDrop`, `powerUp`

Play with: `SoundFX.play('hit')`

## Quick Edits

### Add toast message
```javascript
toast('Your message here!', 1500);  // 1500ms duration
```

### Check sigil level
```javascript
getLevel('Attack', heroIdx)  // Returns total perm + temp level
```

### Apply damage
```javascript
applyDamageToTarget(target, amount, {isHero: false, skipRewards: false})
```

### Save game
```javascript
saveGame();     // Full save
autosave();     // Quick autosave
savePermanent(); // Permanent progress only
```
