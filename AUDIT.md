# FROGGLE Code Audit Report

Comprehensive audit of all source modules, cross-referencing documented behavior (CLAUDE.md) against actual implementation.

---

## Critical Bugs (Gameplay-Affecting)

### BUG 1: Gambling "Between the 20s" — Gold Not Deducted on Win
**File:** `src/neutrals.js:3001`
**Severity:** Critical (gold exploit)

When a player wins the target roll in "Between the 20s," the payout is added to gold but the wager is never deducted. The wager IS deducted on loss (line 3022) and on back-out (line 2960), but on a win, the player receives the full payout without paying their wager.

**Example:** 5G wager, win → payout = 10G. Player gains 10G instead of the intended 5G net. Display text says "Net: +5G" but actual gold change is +10G.

**Fix:** Add `S.gold -= state.wager;` before line 3001, or change to `S.gold += payout - state.wager;`

---

### BUG 2: Last Stand Turn Counter Resets on Repeated Lethal Damage
**File:** `src/constants.js:609-610`
**Severity:** Critical (exploitable difficulty reduction)

When `applyDamageToTarget` handles lethal damage on a hero already in Last Stand, it unconditionally resets `target.lst = 0`, wiping the accumulated D20 DC penalty. This means enemies hitting a Last Stand hero actually _helps_ the player by resetting their D20 difficulty.

The toast `"entered Last Stand!"` also fires again, confusing the player.

**Fix:** Guard with `if(!target.ls)` before setting `target.ls = true` and `target.lst = 0`:
```javascript
if(!target.ls) {
    target.ls = true;
    target.lst = 0;
    triggerScreenShake(true);
    // ... toast and tutorial popup
}
```

---

### BUG 3: Tapo Starts With Only D20, Not "ALL Sigils"
**File:** `src/constants.js:120`
**Severity:** High (hero doesn't match description)

`H.tapo` defines `s:['D20']` but the hero selection screen, CLAUDE.md, and in-game text all say Tapo has "ALL sigils." The `start()` function in `neutrals.js:1523` creates heroes with `s:[...H[t].s]`, giving Tapo only D20.

Additionally, the hero selection display card (`neutrals.js:1398`) shows Tapo with `hp:5, maxhp:5` but `H.tapo` has `h:1, m:1`. The game behavior matches the code (1 HP), not the display.

**Fix:** Either update `H.tapo.s` to include all 10 sigils:
```javascript
tapo: {n:'Tapo', p:1, h:1, m:1, s:['Attack','Shield','Heal','D20','Expand','Grapple','Ghost','Asterisk','Star','Alpha']}
```
Or update the display/docs if the intent is D20-only.

---

### BUG 4: Slot-Specific Save Loading Misses Many Permanent Fields
**File:** `src/main.js:44-75`
**Severity:** High (data loss)

When loading from a slot-specific save (`froggle8_permanent_slot${slot}`), the code manually assigns fields but misses many that `loadPermanent()` in `state.js` handles:

Missing fields include:
- `S.advancedSigilsUnlocked`, `S.passiveSigilsUnlocked` (sigil unlocks lost)
- `S.highContrastMode` (accessibility lost)
- `S.animationSpeed`, `S.masterVolume`, `S.sfxVolume`, `S.musicVolume` (preferences lost)
- `S.pondHistory` (all run history lost!)
- `S.questsCompleted`, `S.questsClaimed`, `S.questProgress` (quest progress lost!)
- `S.forcedFUEntry`

It also skips the one-time fix for old saves and doesn't call `applyVolumeSettings()`.

**Fix:** Refactor to delegate to `loadPermanent()` after loading slot data, or ensure all fields are synchronized.

---

## Medium Bugs

### BUG 5: `closeFAQ` Selector Doesn't Match FAQ Modal
**File:** `src/settings.js:999-1002`
**Severity:** Medium (UI stuck)

`closeFAQ()` removes `.modal-container.dark` but the FAQ modal is created with class `modal-container faq`. The FAQ container remains in the DOM when the Close button is clicked. Only the `.modal-overlay` is correctly removed.

**Fix:** Change selector to `.modal-container.faq` or `.modal-container`:
```javascript
const overlays = document.querySelectorAll('.modal-container.faq, .modal-overlay');
```

---

### BUG 6: STARTLE Overwrites Higher Existing Stun
**File:** `src/combat.js:820`
**Severity:** Medium (debuff regression)

STARTLE sets `enemy.st = 1` unconditionally. If an enemy is already stunned for 3 turns (from Grapple), STARTLE _reduces_ the stun to 1 turn.

**Fix:**
```javascript
enemy.st = Math.max(enemy.st, 1);
```

---

### BUG 7: `purchaseSigilUpgrade` Toast Shows Wrong Level for Active Sigils
**File:** `src/screens.js:578`
**Severity:** Medium (misleading display)

The toast shows `L${S.sig[sig]}` (storage level) but active sigils display at storage+1. A player upgrading Attack from stored 0→1 sees "Attack upgraded to L1!" when the display shows it as L2.

**Fix:** Apply the same +1 offset for active sigils in the toast message.

---

### BUG 8: `closeSettingsMenu`/`closeDebugMenu`/`closeControlsGuide` Use Overly Greedy Selectors
**File:** `src/settings.js:96-99, 313-317, 691-694`
**Severity:** Medium (modal conflicts)

These functions remove `.modal-container.dark, .modal-overlay` or even all `.modal-container` elements, destroying any other open modal (lily pad popups, Steam Deck help, etc).

**Fix:** Use unique class names for each modal type and target only the specific modal.

---

### BUG 9: Recruit Grapple Bypasses Shield
**File:** `src/combat.js:1867`
**Severity:** Medium (inconsistent mechanics)

When a recruit grapples an enemy, the recoil damage is applied as `recruit.h -= dmgToRecruit`, bypassing the recruit's shield. Hero grapple recoil correctly uses `applyDamageToTarget` (line 1429) which respects shields and ghost charges.

**Fix:** Use `applyDamageToTarget(recruit, dmgToRecruit, {isHero: false, skipRewards: true})` instead.

---

### BUG 10: Controller Right Stick Not Mapped to Character Cycling
**File:** `src/controller.js:160-163`
**Severity:** Medium (controller documentation mismatch)

The controls guide says right stick should "Cycle between characters (heroes/enemies)" but both sticks are mapped to `handleDirection()` for generic spatial navigation. The documented character cycling and sigil cycling behavior is not implemented.

---

### BUG 11: Quest `fu_taste` Checks Current Game Mode at Claim Time
**File:** `src/screens.js:1843`
**Severity:** Medium (quest logic flaw)

```javascript
check: () => S.questProgress.highestFloor >= 1 && S.gameMode === 'fu'
```

Checks `S.gameMode === 'fu'` at claim time, not when the floor was reached. If the player completes Floor 1 in FU mode but switches to Standard before checking quests, the quest won't register.

---

## Low/Minor Bugs

### BUG 12: `toggleHelpTips` Resets ALL Tutorial Flags
**File:** `src/settings.js:409`

`S.tutorialFlags = {}` wipes non-tip flags like `death_intro`, `first_victory_sequence`, `first_fu_victory`, etc., causing story cutscenes and one-time narratives to replay.

---

### BUG 13: Ghost Charges Wasted on Last Stand Heroes
**File:** `src/constants.js:582-592`

A hero in Last Stand (h=0) taking damage triggers ghost charge consumption, but the hero can't die anyway (combat ends when ALL heroes are in Last Stand). The ghost charge is consumed without benefit.

---

### BUG 14: `debugSetHeroStats` Doesn't Clear Last Stand
**File:** `src/settings.js:1206`

Setting `hero.h = newMaxHP` when hero is in Last Stand leaves a broken state where `h > 0` but `ls === true`.

---

### BUG 15: Volume Sliders Call `savePermanent()` on Every Input Event
**File:** `src/sounds.js` (volume setters)

Sliders use `oninput`, triggering `savePermanent()` dozens of times per second during a drag. Should debounce or use `onchange`.

---

### BUG 16: Pond History `goldEarned` Records Total Gold, Not Run Gold
**File:** `src/screens.js:14`

`goldEarned: S.gold` records cumulative gold balance, not gold earned in the run. Compare with `xpEarned: S.xp - S.startingXP` which correctly computes the delta.

---

### BUG 17: Service Worker `controllerchange` Reloads Page Mid-Combat
**File:** `src/main.js:37-40`

Unconditional `window.location.reload()` on `controllerchange` event can interrupt active combat with no warning or save.

---

## Documentation Discrepancies

### DOC 1: Flydra Gold — 150, Not 100
**CLAUDE.md** says Flydra gold is "100†" but `combat.js:1653` awards 150G (450G in FU mode).

### DOC 2: Dragon drawsPerTurn Comment
**combat.js:2172** comment says "Dragons draw 2" but `E.dragon.drawsPerTurn` is 1 (or defaults to 1).

### DOC 3: Star XP Multiplier Stacking
**CLAUDE.md** says "1.5x, 2x, 2.5x, 3x by level" which is per-hero. With 2+ heroes at Star L1, the multiplier exceeds 1.5x (e.g., 2x with 2 heroes). The "Stacks across all heroes" note is present but could be clearer about additive stacking.

---

## Architectural Observations (Not Bugs)

1. **Flydra XP can be farmed**: Killing a Flydra head awards XP, and the head revives at 50% if other heads live. Repeatedly killing the same head grants XP each time with no cap. Practically hard to exploit due to ghost charge grants to other heads, but theoretically infinite.

2. **Race condition guards**: `S.combatEnding` flag prevents double victory/defeat processing from concurrent `checkCombatEnd` calls with different setTimeout delays (200ms for regular enemies, 300ms for Flydra). The guard works but is fragile.

3. **Dead code**: `toggleModeFromChampions()` in `screens.js:814-818` is defined but never called (waiting on art asset per comment).
