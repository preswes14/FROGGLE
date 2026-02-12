# FROGGLE Project Memory

## About
FROGGLE is a tactical turn-based roguelike built as a PWA. Pure frontend - all game logic runs in the browser with vanilla JavaScript. Think Balatro/Inscryption vibes, not mobile retention loops.

## Tech Stack
- Single HTML file (~18,800 lines) with embedded JS/CSS
- localStorage for saves (no backend/cloud sync)
- Mobile-first, PWA installable
- Steam Deck controller support
- Font: Fredoka One bundled locally (`assets/fonts/fredoka-one.otf`)
- Art assets: Professional replacements paid for and incoming — current placeholder art will be swapped

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
├── constants.js      # Version, HERO_IMAGES, H, E, SIGIL_*, ANIMATION_TIMINGS (1355 lines)
├── steam.js          # Steam integration: achievements, stats, cloud save (315 lines)
├── sounds.js         # SoundFX Web Audio API system (1325 lines)
├── state.js          # Game state `S`, upd(), animations, toast, save/load (1577 lines)
├── combat.js         # Floor management, combat engine, render(), level up, XP/gold (3618 lines)
├── neutrals.js       # Neutral deck, title/hero select, tutorials, neutral encounters (3460 lines)
├── screens.js        # The Pond, Death screen, Champions, Pedestal, Win, Ribbleton hub (2207 lines)
├── settings.js       # Debug, Settings, FAQ (1285 lines)
├── controller.js     # GamepadController for Steam Deck (1087 lines)
└── main.js           # Init and window.onload (229 lines)

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
2. steam.js (no deps)
3. sounds.js (no deps)
4. state.js (needs constants, sounds)
5. combat.js (needs all above)
6. neutrals.js (needs all above)
7. screens.js (needs all above)
8. settings.js (needs all above)
9. controller.js (needs state)
10. main.js (init, must be last)

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

**Stun Application (uniform `Math.max` for all sources)**:
| Source | Behavior | Code |
|--------|----------|------|
| Player Grapple on enemy | `Math.max(st, duration)` | Same rule for all |
| D20 STARTLE on enemy | `Math.max(st, 1)` | Always 1 turn |
| Enemy Grapple on hero | `Math.max(st, level)` | Same rule for all |
| Recruit Grapple on enemy | `Math.max(st, level)` | Same rule for all |

Stun never stacks from any source. A new stun only takes effect if its duration exceeds the remaining stun. This prevents stun-lock cheese for both players and enemies.

**Stunned enemies still progress**: Stun skips the action but does NOT pause sigil cycling (Cave Troll rage advances, Orc alternating continues, `turnsSinceGain` increments).

**Enemy Sigil Draw**: Enemies draw sigils at the START of player turn (after Round++), so players can see and strategize against new enemy abilities.

### Heroes
| Hero | POW | HP | Starting Sigils | Special |
|------|-----|-----|-----------------|---------|
| Warrior | 2 | 5 | Attack, D20 | High damage |
| Tank | 1 | 10 | Attack, Shield, D20 | Defensive, high HP |
| Mage | 1 | 5 | Attack, D20, Expand | Multi-target (Expand always +1 level higher) |
| Healer | 1 | 5 | Heal, D20, Expand | Support (Expand always +1 level higher) |
| Tapo | 1 | 1 | D20 (+ any gold-upgraded sigils) | Unlockable, versatile |

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
| Star | Each hero adds 0.5× per Star level to XP multiplier (stacks across all heroes) |

### Enemies
Defined in `E` object (constants.js).

| Enemy | POW | HP | Gold | XP | Draw Rate | Sigil Pool | Starting Sigils |
|-------|-----|-----|------|-----|-----------|------------|-----------------|
| Fly | 1 | 2 | 0 | 0 | never | *(none)* | Attack L1 |
| Goblin | 1 | 5 | 1 | 2 | 3 turns | Asterisk, Expand, Shield | — |
| Wolf | 2 | 5 | 2 | 4 | 2 turns | Asterisk, Expand, Shield, Grapple, Alpha | — |
| Orc | 2 | 10 | 3 | 6 | 2 turns | Asterisk, Expand, Shield, Grapple, Alpha, Heal, Ghost | **ALT:** Attack L2 ↔ random |
| Giant | 3 | 12 | 6 | 12 | 1 turn | Asterisk, Expand, Shield, Grapple, Alpha, Heal, Ghost, Attack† | Shield L1 |
| Cave Troll | 4 | 15 | 10 | 15 | special | Expand, Shield, Grapple, Alpha, Heal, Ghost | **RAGE:** Attack L1→L2→L3→L1 |
| Dragon | 5 | 20 | 20 | 25 | 1 turn | Expand, Shield, Grapple, Alpha, Heal, Ghost | **PERM:** Attack L2, Expand L1 |
| Flydra | 5 | 25 | 0† | 50/head | 1 turn | Shield, Grapple, Alpha, Heal, Ghost | **PERM:** Attack L2, Expand L2 |

†Giant can draw Attack/Shield/Heal at L2 (others capped at L1). Cave Troll/Dragon/Flydra draw at up to L2. Flydra `goldDrop` is 0 per-head; 150G total is awarded at combat completion when ALL heads are defeated.

**Special Mechanics:**
- **Fly**: Tutorial only, never draws sigils, awards no rewards
- **Orc**: Alternates between Attack L2 and a random pool sigil every 2 turns (clears old sigil when switching)
- **Cave Troll**: Rolling rage mechanic - Attack level cycles L1→L2→L3→L1. Draws a sigil each turn EXCEPT on reset turns (when L3→L1)
- **Giant**: Starts with Shield L1, can draw Attack/Shield/Heal at L2
- **Dragon**: Permanent Attack L2 + Expand L1 (always hits 2 targets twice)
- **Flydra** (Floor 19 boss): Multi-headed, revives at 50% HP if other heads alive, grants Ghost charges to surviving heads on death. †Gold (150) awarded only when ALL heads defeated; XP awarded per-head kill

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
5. **Ghost fully negates the hit**: Ghost charges prevent lethal damage BEFORE checking Last Stand. When ghost triggers, both HP and shield are fully restored to pre-hit values.
6. **Last Stand restrictions**: Heroes in Last Stand (`hero.ls === true`) can ONLY use D20. They can only be targeted by Heal (to revive, including by recruits) or Stun — they cannot take damage or gain shields
7. **Last Stand DC penalty**: D20 DCs increase by `+2 per turn` in Last Stand (`hero.lst * 2`). CONFUSE caps at DC 20 (requires nat 20); other gambits keep climbing past 20.
8. **Damage goes through shield first**: Shield absorbs before HP reduces
9. **Multi-instance state**: `S.instancesRemaining` tracks remaining instances, `S.currentInstanceTargets` for current selection

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
| Displaying raw sigil level for actives | Active sigils display stored + 1 (e.g. `S.sig['Attack'] = 0` shows "L1") |
| Using `if(S.currentSlot)` for slot check | Use `if(S.currentSlot != null)` — slot could be 0 (falsy) |
| Not resetting unlock flags in `createNewSlot()` | Reset `ghostBoysConverted`, `advancedSigilsUnlocked`, `passiveSigilsUnlocked` |
| Assuming stun stacks | ALL stun uses `Math.max(st, duration)` — never stacks from any source |

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
S.ghostBoysConverted, S.advancedSigilsUnlocked, S.passiveSigilsUnlocked  // Feature unlocks
```

### Settings State
```javascript
S.helpTipsDisabled    // Mechanic explanation popups (e.g. stun_intro, shield_persistence)
S.tutorialDisabled    // Guided walkthrough popups (e.g. ribbleton_warrior_attack)
S.cutsceneDisabled    // One-time narrative events (e.g. death_intro, first_victory_sequence)
S.tooltipsDisabled    // Hover/longpress sigil tooltips
S.animationSpeed      // 0 = instant, 0.5 = fast, 1 = normal, 2 = slow
S.highContrastMode    // Accessibility high contrast
S.controllerDisabled  // Disable gamepad input
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
| `T(ms)` | constants.js | Adjust timing for animation speed |

---

## Death Screen Economy

### Going Rate
- Starts at **1G**
- Increases each time a sigil upgrade is purchased
- Rate increase = `5 * (tier + 1)` where `tier = floor(totalUpgradesBefore / 5)`
  - Upgrades 1-5: +5G per purchase
  - Upgrades 6-10: +10G per purchase
  - Upgrades 11-15: +15G per purchase
  - Upgrades 16-20: +20G per purchase

### Sigil Upgrade Pricing
Each sigil has per-sigil escalation on top of the Going Rate:

| Times Upgraded | Escalation | Total Cost |
|----------------|------------|------------|
| 0 (first) | +0G | goingRate |
| 1 | +25G | goingRate + 25 |
| 2 | +50G | goingRate + 50 |
| 3 | +100G | goingRate + 100 |
| 4 | +150G | goingRate + 150 |

Max permanent level: 4 for all sigils (displays as L5 for actives, L4 for passives). Mage/Healer Expand reaches effective L5 via built-in +1.

### Category Unlocks (do NOT increase Going Rate)
- **Advanced Sigils** (Ghost, Alpha, Grapple): **20G**
- **Passive Sigils** (Expand, Asterisk, Star): **50G**

### Death Boys (unlocked when `S.ghostBoysConverted` is true)
- **Sell Back**: Remove one permanent sigil level, receive gold = Going Rate. Going Rate unchanged.
- **Sacrifice**: Remove one permanent sigil level, gain Starting XP = Going Rate permanently. Going Rate decreases by 5G (min 1G).

`S.startingXP` accumulates permanently. At run start, if > 0, a spending screen is shown before Floor 1.

---

## Quest Board

Accessible from the Ribbleton hub. 8 categories of quests that award gold on completion.

### Quest Categories
| Category | Name | Example Quests |
|----------|------|----------------|
| learning | Getting Started | First Blood (5G), Shield Bearer (5G), Survivor (5G) |
| heroes | Hero Exploration | Play each hero (5G), win with each (20G), Army of Frogs (20G) |
| neutrals | Neutral Encounters | Complete each neutral type (5G), Neutral Explorer (20G) |
| milestones | Milestones | Dragon Slayer (10G), First Victory (20G), All sigils L1 (20G) |
| combat | Combat Mastery | 10+ dmg one action (10G), Ghost Walk (10G), Last Stand Hero (10G) |
| repeatable | Ongoing Challenges | Slayer I-V (20G each), Gold Digger I-III (20G), Veteran I-III (20G) |
| fu | Frogged Up | FU Floor 1 (20G), Recruiter (10G), FU Champion (20G) |
| secret | Secrets | Tapo's Hero (20G), Bruce & Willis (10G), True Champion (20G) |

### Quest Progress Tracking
Progress is tracked via `S.questProgress` object (kills, damage, floors reached, gold earned, etc.). NOT tracked during tutorial (Floor 0). Each `trackQuestProgress()` call persists immediately via `savePermanent()`.

### Repeatable Quest Tiers
Three chains with sequential tiers (claim one to unlock the next):
- **Slayer**: 25 / 100 / 250 / 500 / 1000 enemies killed (5 tiers, 20G each)
- **Gold Digger**: 250G / 1000G / 2500G total earned (3 tiers, 20G each)
- **Veteran**: 5 / 15 / 30 runs completed (3 tiers, 20G each)

---

## Pedestal / Champions System

### Figurine Earning
On victory, each surviving hero (HP > 0, not in Last Stand) earns a figurine IF they have fewer than 2 figurines for the current game mode. Maxed heroes (already 2 figurines) award **25G compensation** instead.

### Figurine Placement
- **8 total slots per mode** (4 heroes x 2 stats: POW and HP)
- **Max 2 figurines per hero per mode**
- **1 figurine per hero per victory** (can't double-slot same hero)

### Figurine Effects (applied at run start)
- **POW figurine**: +1 POW
- **HP figurine**: +5 max HP and +5 current HP

### Cross-Mode Rules
- **Standard figurines** apply in BOTH Standard and Frogged Up modes
- **Frogged Up figurines** apply ONLY in Frogged Up mode
- In FU mode, a hero can benefit from up to 4 figurines (2 Standard + 2 FU)

### Victory Flow Branching
1. **First Standard Victory**: Cutscene + pedestal + forced FU mode entry
2. **First Frogged Up Victory**: Credits + Tapo unlock
3. **First Tapo-Alive Victory**: Developer thank-you message
4. **Subsequent with figurines earned**: Straight to pedestal
5. **Subsequent with no figurines**: Simple victory screen (shows 25G compensation if applicable)

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
