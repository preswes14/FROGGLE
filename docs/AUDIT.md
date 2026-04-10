# FROGGLE Code Audit Report

Comprehensive audit of all source modules, cross-referencing documented behavior (CLAUDE.md) against actual implementation.

**Last updated:** 2026-02-10

---

## Bug Status Summary

| Bug | Description | Severity | Status |
|-----|-------------|----------|--------|
| 1 | Gambling gold not deducted on win | Critical | FIXED |
| 2 | Last Stand turn counter resets | Critical | FIXED |
| 3 | Tapo sigil initialization | High | FIXED |
| 4 | Slot loading misses fields | High | FIXED |
| 5 | closeFAQ selector mismatch | Medium | FIXED |
| 6 | STARTLE overwrites higher stun | Medium | FIXED |
| 7 | Sigil upgrade toast wrong level | Medium | FIXED |
| 8 | Modal close greedy selectors | Medium | FIXED |
| 9 | Recruit grapple bypasses shield | Medium | FIXED |
| 10 | Controller right stick not mapped | Medium | FIXED |
| 11 | Quest fu_taste mode check | Medium | FIXED |
| 12 | toggleHelpTips resets all flags | Low | FIXED |
| 13 | Ghost charges on Last Stand heroes | Low | FIXED |
| 14 | debugSetHeroStats Last Stand | Low | FIXED |
| 15 | Volume slider save spam | Low | Accepted |
| 16 | Pond history goldEarned | Low | Accepted |
| 17 | SW controllerchange reload | Medium | Accepted |

---

## Fix Details

### BUG 1: Gambling Gold — FIXED
Wager is now deducted before payout: `S.gold -= state.wager` before `S.gold += payout`.

### BUG 2: Last Stand Turn Counter — FIXED
Guard clause `if(!target.ls)` prevents re-entry and resetting of `target.lst`.

### BUG 3: Tapo Sigil Initialization — FIXED
`H.tapo.s = ['D20']` is correct as the base. In `start()`, Tapo now also receives any active sigils that have been permanently upgraded with gold (`S.sig[sigil] > 0`), plus passives like all other heroes. This is Tapo's core mechanic: starts minimal, benefits from permanent investment.

### BUG 4: Slot Loading — FIXED
Slot-specific loading in `main.js` now loads all permanent fields including `advancedSigilsUnlocked`, `passiveSigilsUnlocked`, volumes, `pondHistory`, quest data, and tutorial flags.

### BUG 5: closeFAQ Selector — FIXED
Now targets `.modal-container.faq, .modal-overlay`.

### BUG 6: STARTLE Stun — FIXED
Uses `Math.max(enemy.st, 1)` to preserve higher stun values.

### BUG 7: Sigil Upgrade Toast — FIXED
Uses `displayLevel` with +1 offset for active sigils in toast message.

### BUG 8: Modal Close Selectors — FIXED
Each modal close function uses specific selectors for its modal type.

### BUG 9: Recruit Grapple Recoil — FIXED
Now uses `applyDamageToTarget(recruit, dmgToRecruit, {isHero: false, skipRewards: true, silent: true})`.

### BUG 10: Controller Right Stick — FIXED
Right stick Y-axis mapped to smooth scrolling via `scrollSmooth()`.

### BUG 11: Quest fu_taste — FIXED
Now checks `S.questProgress.highestFUFloor >= 1` (tracked when reaching floor), not current game mode.

### BUG 12: Tutorial Flag Categories — FIXED
Replaced single `toggleHelpTips` with three independent category toggles:
- **Help Tips** (`S.helpTipsDisabled`): Mechanic explanation popups
- **Tutorial Walkthrough** (`S.tutorialDisabled`): Guided tutorial popups
- **Story Cutscenes** (`S.cutsceneDisabled`): One-time narrative events

Categories defined in `TUTORIAL_FLAG_CATEGORIES` (constants.js). `showTutorialPop` checks category-specific disable flags. Each toggle only resets its own category's flags. `tutorial_fly_munched` is never reset (quest-linked).

### BUG 13: Ghost on Last Stand — FIXED
Ghost charges consumed before Last Stand entry check, preventing waste.

### BUG 14: debugSetHeroStats Last Stand — FIXED
Clears `hero.ls` and `hero.lst` when HP is set above 0.

### BUG 15: Volume Slider Saves — Accepted
`savePermanent()` is called on each input but batched via the suspend system. Acceptable behavior.

### BUG 16: Pond History goldEarned — Accepted
Records total gold balance, which is the intended display for run history.

### BUG 17: SW controllerchange Reload — Accepted
Standard PWA update delivery pattern. Low-frequency event in practice.

---

## Documentation Discrepancies — RESOLVED

### DOC 1: Flydra Gold
**CLAUDE.md** now correctly documents Flydra gold as 150G (450G in FU mode).

### DOC 2: Dragon drawsPerTurn
`E.dragon.drawsPerTurn` is 1. Comment in combat.js is misleading but doesn't affect behavior.

### DOC 3: Star XP Multiplier
Per-hero stacking is documented in CLAUDE.md with "Stacks across all heroes!" note.

---

## Architectural Observations (Not Bugs)

1. **Flydra XP can be farmed**: Killing a Flydra head awards XP, and the head revives at 50% if other heads live. Practically hard to exploit due to ghost charge grants to other heads, but theoretically infinite.

2. **Race condition guards**: `S.combatEnding` flag prevents double victory/defeat processing. The guard works but is fragile.

3. **Dead code**: `toggleModeFromChampions()` in `screens.js` is defined but never called (waiting on art asset per comment).
