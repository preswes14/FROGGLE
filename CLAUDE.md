# FROGGLE Project Memory

## About
FROGGLE is a tactical turn-based roguelike built as a PWA. Pure frontend - all game logic runs in the browser with vanilla JavaScript. Think Balatro/Inscryption vibes, not mobile retention loops.

## Tech Stack
- Single HTML file (~12,200 lines) with embedded JS/CSS
- localStorage for saves (no backend/cloud sync)
- Mobile-first, PWA installable
- Steam Deck controller support

## Development
- Feature branches: `claude/` prefix, push when complete
- Default to Sonnet for coding; use Opus for architecture/balance analysis
- Keep it simple - no frameworks, no over-engineering

## Code Modularization

**Status:** Implemented ✓

### Structure
The monolith is now split into modular source files that concatenate back to `index.html` for production.

```
src/
├── constants.js      # Version, HERO_IMAGES, H, E, SIGIL_*, ANIMATION_TIMINGS (953 lines)
├── sounds.js         # SoundFX Web Audio API system (286 lines)
├── state.js          # Game state `S`, upd(), animations, toast, save/load (866 lines)
├── combat.js         # Floor management, combat engine, render(), level up, XP/gold (2838 lines)
├── neutrals.js       # Neutral deck, title/hero select, tutorials, neutral encounters (2899 lines)
├── screens.js        # The Pond, Death screen, Champions, Pedestal, Win, Ribbleton hub (1121 lines)
├── settings.js       # Debug, Settings, FAQ (720 lines)
├── controller.js     # GamepadController for Steam Deck (761 lines)
└── main.js           # Init and window.onload (67 lines)

build/
├── template_head.html  # HTML/CSS before <script>
├── template_foot.html  # HTML after </script>
└── combined.js         # Concatenated JS output

build.sh              # Concatenate modules → index.html
extract.sh            # Extract modules from index.html
```

### Build Commands
```bash
./build.sh            # Rebuild index.html from src/ modules
./extract.sh          # Re-extract modules from index.html (if needed)
```

### Key Globals (used across modules)
- **`S`** - Central game state object
- **`SoundFX`** - Audio system
- **`toast()`**, **`T()`** - UI helpers
- **`getLevel()`, `rollDice()`, `render()`, `saveGame()`** - Shared helpers

### Module Dependency Order
1. constants.js (no deps)
2. sounds.js (no deps)
3. state.js (needs constants, sounds)
4. combat.js (needs all above)
5. neutrals.js (needs all above)
6. screens.js (needs all above)
7. settings.js (needs all above)
8. controller.js (needs state)
9. main.js (init, must be last)

### Editing Workflow
1. Edit files in `src/`
2. Run `./build.sh` to rebuild `index.html`
3. Test in browser
4. Commit both `src/` and `index.html`

---

## Game Architecture

### Game Flow
```
Title → Hero Select (2-3 heroes) → Ribbleton Hub → Floor Loop → Victory/Death
                                                        ↓
                                              Combat (odd floors 1,3,5...)
                                              Neutral Encounter (even floors 2,4,6...)
```
- **Floor 0**: Tutorial (two phases: Tapo's Birthday → Portal Invasion)
- **Floors 1-19**: Alternating combat/neutral
- **Floor 20**: Victory

### Combat Flow (Per Round)
```
Player Turn:
  For each hero (not stunned):
    1. Select sigil (action)
    2. Select target(s) - may have multiple instances
    3. Execute action
    4. Mark hero as acted
  → When all non-stunned heroes acted → Enemy Turn

Enemy Turn:
  1. Alpha Phase (enemies with Alpha grant bonus actions to allies)
  2. Recruit Phase (recruited enemies attack)
  3. Normal Phase (all other enemies attack)
  4. End of Turn: Decrement ALL stun counters (heroes, enemies, recruits)
  → Round++, enemies draw new sigils, back to Player Turn
```

**Stun Timing**: Stun counters decrement at END of enemy turn, AFTER that unit's team has acted. This ensures "stun for 1 turn" actually skips 1 turn.

**Enemy Sigil Draw**: Enemies draw sigils at the START of player turn (after Round++), so players can see and strategize against new enemy abilities.

### Heroes
| Hero | POW | HP | Starting Sigils | Special |
|------|-----|-----|-----------------|---------|
| Warrior | 2 | 5 | Attack, D20 | High damage |
| Tank | 1 | 10 | Attack, Shield, D20 | Defensive, high HP |
| Mage | 1 | 5 | Attack, D20, Expand | Multi-target (Expand always +1 level higher) |
| Healer | 1 | 5 | Heal, D20, Expand | Support (Expand always +1 level higher) |
| Tapo | 1 | 1 | ALL sigils | Unlockable, versatile |

### Sigils (10 Types)

**Active Sigils** (use hero's action):
| Sigil | Effect | Notes |
|-------|--------|-------|
| Attack | Deal POW damage × level hits | Multi-instance |
| Shield | Grant 2×POW shield | Persists between battles, caps at max HP |
| Heal | Restore 2×POW HP | Cannot exceed max HP |
| D20 | Roll dice, pick gambit | CONFUSE/STARTLE/MEND/STEAL/RECRUIT |
| Grapple | Stun target L turns | User takes recoil = target's POW |
| Alpha | Grant L extra actions to ally | Alpha user spends their turn to grant actions |
| Ghost | Gain L ghost charges | Each charge blocks one lethal hit |

**Passive Sigils** (always active, no action cost):
| Sigil | Effect |
|-------|--------|
| Expand | Total targets = 1 + Expand level. Mage/Healer always have +1 Expand level vs base. |
| Asterisk | First action per combat triggers additional times (L1: +1 extra, L2: +2 extra, etc.) |
| Star | Multiply combat XP (1.5×, 2×, 2.5×, 3× by level) |

### Enemies
Defined in `E` object (constants.js).

| Enemy | POW | HP | Gold | XP | Draw Rate | Sigil Pool | Starting Sigils |
|-------|-----|-----|------|-----|-----------|------------|-----------------|
| Fly | 1 | 2 | 0 | 1 | never | *(none)* | Attack L1 |
| Goblin | 1 | 5 | 1 | 2 | 3 turns | Asterisk, Expand, Shield | — |
| Wolf | 2 | 5 | 2 | 4 | 2 turns | Asterisk, Expand, Shield, Grapple, Alpha | — |
| Orc | 3 | 10 | 3 | 6 | 2 turns | Asterisk, Expand, Shield, Grapple, Alpha, Heal, Ghost, Attack† | 1 random |
| Giant | 4 | 12 | 6 | 12 | 1 turn | Asterisk, Expand, Shield, Grapple, Alpha, Heal, Ghost, Attack† | Shield L1 |
| Cave Troll | 5 | 15 | 5 | 15 | 1 turn | Expand, Shield, Grapple, Alpha, Heal, Ghost, Attack | Asterisk L1 + 1 random |
| Dragon | 5 | 20 | 10 | 25 | 1 turn | Expand, Shield, Grapple, Alpha, Heal, Ghost | **PERM:** Attack L2, Expand L1 |
| Flydra | 5 | 25 | 15 | 50 | 1 turn | Shield, Grapple, Alpha, Heal, Ghost | **PERM:** Attack L2, Expand L2 |

†Orc/Giant can draw Attack/Shield/Heal at L2 (others capped at L1). Cave Troll/Dragon/Flydra draw at up to L2.

**Special Mechanics:**
- **Fly**: Tutorial only, never draws sigils
- **Cave Troll**: Starts with Asterisk (first attack hits twice)
- **Dragon**: Permanent Attack L2 + Expand L1 (always hits 2 targets twice)
- **Flydra** (Floor 19 boss): Multi-headed, revives at 50% HP if other heads alive, grants Ghost charges to surviving heads on death

**Floor Appearances** (N = hero count, 2 or 3):
| Floor | Encounter |
|-------|-----------|
| 1 | N× Goblin |
| 3 | N× Wolf |
| 5 | 2N× Orc |
| 7 | N× (Giant + Wolf + Goblin) |
| 9 | N× Cave Troll |
| 11 | 5N× Goblin (AMBUSH - heroes stunned turn 1) |
| 13 | 5N× Wolf |
| 15 | N× Dragon |
| 17 | N× (Cave Troll + Giant + Orc + Wolf + Goblin) |
| 19 | N× Flydra |

---

## Critical Invariants

**NEVER violate these - they will cause bugs:**

1. **Call `render()` after state changes** - UI won't update otherwise
2. **Shield caps at max HP**: `if(hero.sh > hero.m) hero.sh = hero.m`
3. **Check stun before acting**: `if(hero.st > 0)` means hero is stunned, skip their turn
4. **Sigil level display vs storage**:
   - Stored: 0-4 in `S.sig[name]` and `S.tempSigUpgrades[name]`
   - Displayed: stored + 1 for active sigils (L0 stored = "L1" shown)
   - `getLevel(sigil)` returns the TOTAL (permanent + temp)
5. **Ghost before Last Stand**: Ghost charges prevent lethal damage BEFORE checking Last Stand
6. **Last Stand restrictions**: Heroes in Last Stand (`hero.ls === true`) can ONLY use D20
7. **Damage goes through shield first**: Shield absorbs before HP reduces
8. **Multi-instance state**: `S.instancesRemaining` tracks remaining instances, `S.currentInstanceTargets` for current selection

---

## Common Pitfalls

**Mistakes that have caused bugs before:**

| Mistake | Correct Approach |
|---------|------------------|
| Forgetting `render()` | Always call after modifying `S` |
| Not rebuilding after src/ edits | Run `./build.sh` before testing |
| Checking `hero.h <= 0` for death | Check `hero.ls` (Last Stand) instead - heroes at 0 HP aren't dead |
| Modifying `S.targets` mid-action | Use `S.currentInstanceTargets` for current instance |
| Assuming sigil level = stored value | Use `getLevel(sigil)` which adds permanent + temp |
| Hardcoding hero count | Use `S.heroes.length` (can be 2 or 3) |
| Ignoring Asterisk multiplier | First action triggers `1 + getLevel('Asterisk')` total times (L1 = 2 total) |
| Not handling recruits | `S.recruits` array contains recruited enemies |
| Forgetting animation timing | Use `T(ANIMATION_TIMINGS.X)` for speed-adjusted delays |

---

## State Reference (`S` Object)

### Hero State
```javascript
S.heroes[i] = {
  n: 'Warrior',      // Name
  p: 2,              // POW (damage/heal scaling)
  h: 5,              // Current HP (Warrior starts at 5)
  m: 5,              // Max HP
  sh: 0,             // Shield (persists, caps at m)
  g: 0,              // Ghost charges (0-9)
  st: 0,             // Stun turns remaining (>0 = stunned)
  ls: false,         // Last Stand mode
  lst: 0,            // Last Stand turn counter (for DC increase)
  s: ['Attack', 'D20'],  // Starting sigils (from H object)
  ts: [],            // Temporary sigils gained this run
  c: 'warrior'       // Class (lowercase)
}
```

### Combat State
```javascript
S.activeIdx        // Currently acting hero index (-1 = none)
S.acted            // Array of hero indices that acted this turn
S.pending          // Current action string ('Attack', 'Shield', 'D20_TARGET', etc.)
S.targets          // All confirmed target IDs across instances
S.currentInstanceTargets  // Target IDs for current instance
S.instancesRemaining      // Instances left to execute
S.enemies          // Array of enemy objects
S.recruits         // Array of recruited enemies
S.round            // Current combat round
S.turn             // 'player' or 'enemy'
```

### Progression State
```javascript
S.floor            // Current floor (0-20)
S.gold             // Permanent gold
S.xp               // Permanent XP (for upgrades)
S.sig              // Permanent sigil levels {Attack: 0, Shield: 1, ...}
S.tempSigUpgrades  // Run-only upgrades {Attack: 1, ...}
S.gameMode         // 'Standard' or 'fu' (Frogged Up)
```

### Persistent State (survives death)
```javascript
S.pedestal         // Champion figurines
S.pondHistory      // Run history
S.tutorialFlags    // Tutorial completion tracking
S.hasReachedFloor20, S.fuUnlocked, S.tapoUnlocked  // Unlock flags
```

---

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `render()` | combat.js | Rebuild entire UI from state |
| `act(sigil, heroIdx)` | combat.js | Start an action |
| `executeInstance()` | combat.js | Execute one instance of multi-target action |
| `finishAction()` | combat.js | Complete action, check if turn ends |
| `enemyTurn()` | combat.js | Run all enemy phases |
| `applyDamageToTarget()` | constants.js | Unified damage with shield/ghost handling |
| `getLevel(sigil, heroIdx)` | combat.js | Get total sigil level (perm + temp) |
| `saveGame()` | state.js | Persist to localStorage |
| `startFloor(f)` | combat.js | Initialize floor (combat or neutral) |
| `neutral(f)` | neutrals.js | Handle neutral encounters |
| `T(ms)` | state.js | Adjust timing for animation speed |

---

## Adding New Content

### New Sigil Checklist
1. Add to `SIGIL_DESCRIPTIONS` in constants.js
2. Add image path to `SIGIL_IMAGES`
3. Add to `SIGIL_ORDER` array
4. Initialize in `S.sig` and `S.tempSigUpgrades` (state.js)
5. Add logic in `act()` for active, or appropriate phase for passive
6. Update enemy pools if enemies can use it

### New Enemy Checklist
1. Define in `E` object (constants.js): `{n, p, h, m, goldDrop, x, pool, maxLevel, gainRate}`
2. Add emoji to `ENEMY_EMOJI`
3. Add to floor composition in `getEnemyComp()`
4. Handle any special mechanics (like Flydra revival)

### New Neutral Encounter Checklist
1. Create `showEncounterName1()` and `showEncounterName2()` functions in neutrals.js
2. Add to neutral deck in `initNeutralDeck()`: include 'encountername1' in the array
3. Add routing in `neutral()` function's if/else chain (e.g., `else if(enc === 'encountername1') showEncounterName1();`)
4. Use `nextFloor()` to proceed after player makes choice
5. Use `replaceStage1WithStage2('encountername')` to upgrade encounter for later floors
