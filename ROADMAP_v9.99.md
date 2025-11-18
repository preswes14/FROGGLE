# FROGGLE Version 9.99 Implementation Roadmap

## Overview
Version 9.99 is a major update with 6 core system changes. This roadmap outlines the implementation order, dependencies, and tasks requiring strategic review.

---

## Current State Analysis

### Existing Systems (index.html)
- **Ancient Statue**: Lines 5967-6159 (statue encounters) + statuette mechanics
- **Enemies**: Line 982-988 (E object definitions)
  - Goblin: 1 POW, 5 HP
  - Wolf: 2 POW, 5 HP
  - Orc: 2 POW, 7 HP
  - Giant: 3 POW, 15 HP
  - Dragon: 10 POW, 25 HP
- **Gambits**: Lines 3299-3479 (DC 16/17/18/19/20, Last Stand +1/turn capped at +4)
- **Wizard**: Lines 5512-5663 (permanent upgrade system)
- **Asterisk**: Lines 4438-4444, 7449-7451 (active prime-then-multiply)
- **Tutorial**: Scattered throughout (Goblin + Wolf, Ribbleton-themed)

---

## Implementation Plan

### PHASE 1: Foundation Updates (Independent - Can Run in Parallel)

These changes are self-contained and have no dependencies on each other.

#### Task 1A: Enemy Stats Update
**Complexity:** Low
**Model:** Sonnet
**Location:** Line 982-988 (E object)
**Estimated Time:** 30 minutes

**Changes Required:**
1. Add new enemy: `Fly: { n:'Fly', p:1, h:2, m:2, goldDrop:1, x:1, pool:[], gainRate:999 }`
2. Add new enemy: `caveTroll: { n:'Cave Troll', p:5, h:15, m:15, goldDrop:5, x:15, pool:'ANY', gainRate:1, startSigils:1 }`
3. Update Orc: `p:2 → p:3`, `h:7 → h:10`, `m:7 → m:10`
4. Update Giant: `p:3 → p:4`, `h:15 → h:12`, `m:15 → m:12`
5. Verify Dragon attack level cap logic (should be 3, not 4)
6. Add Fly and Cave Troll to ENEMY_EMOJI object

**Testing Checklist:**
- [ ] Fly appears correctly in combat
- [ ] Cave Troll spawns and fights correctly
- [ ] Orc and Giant have updated stats
- [ ] Dragon cannot exceed Attack L3

---

#### Task 1B: Gambit System Overhaul
**Complexity:** Medium
**Model:** Sonnet
**Location:** Lines 3299-3479 (gambit selection/execution)
**Estimated Time:** 2 hours

**Changes Required:**
1. **New Base DCs:**
   - Confuse: 16 → 12
   - Startle: 17 → 14
   - Add NEW: Mend: 16 (Heal self for POW)
   - Remove: Scare (19)
   - Steal: 18 (unchanged)
   - Recruit: 20 (unchanged)

2. **Last Stand Mechanic Overhaul:**
   - On activation: Immediate +2 to ALL DCs
   - Each turn: Additional +2 to ALL DCs
   - Special cap: Confuse stops increasing at DC 20
   - All other gambits continue increasing beyond 20

3. **Implementation Details:**
   - Update `showD20Menu()` function to show new DCs
   - Update `getGambitDC()` function for new base values
   - Add cap logic: `if (gambitName === 'CONFUSE') return Math.min(calculatedDC, 20);`
   - Create new `executeMend()` function
   - Remove all Scare references
   - Update Last Stand to add +2 immediately, then +2 per turn (not +1)

**Testing Checklist:**
- [ ] Mend gambit heals hero for their POW
- [ ] Scare is completely removed from game
- [ ] Last Stand adds +2 immediately on activation
- [ ] Last Stand adds +2 each subsequent turn
- [ ] Confuse caps at DC 20 during Last Stand
- [ ] Other gambits exceed DC 20 during extended Last Stand

---

#### Task 1C: Asterisk Redesign
**Complexity:** Medium
**Model:** Sonnet
**Location:** Multiple locations (sigil activation logic)
**Estimated Time:** 2 hours

**Changes Required:**
1. **Remove Active System:**
   - Remove "prime Asterisk" button/option
   - Remove priming state tracking
   - Remove FAQ text about priming (line 7449-7451)

2. **Add Passive System:**
   - Track first action per combat per hero
   - Auto-apply multiplier: `(Asterisk Level + 1)`
   - Applies to ANY action type (Attack, Shield, Heal, Gambit, etc.)
   - Reset flag on combat start

3. **Implementation Details:**
   - Add hero property: `firstActionUsed: false` (reset each combat)
   - In action execution, check: `if (hasAsterisk && !hero.firstActionUsed)`
   - Apply multiplier, then set `hero.firstActionUsed = true`
   - Update FAQ to explain passive behavior
   - Remove all Alpha-Asterisk combo references

**Testing Checklist:**
- [ ] Asterisk activates automatically on first action
- [ ] Multiplier = (level + 1): L1=2x, L2=3x, L3=4x
- [ ] Works with all action types (Attack, Shield, Heal, Gambits)
- [ ] Resets properly between combats
- [ ] No priming option exists anywhere in UI

---

### PHASE 2: Complex Systems (Sequential - Order Matters)

#### Task 2A: Between the 20's Implementation
**Complexity:** High
**Model:** Sonnet (implementation) + Opus (balance review)
**Location:** Replace Ancient Statue (lines 5967-6159)
**Estimated Time:** 4-6 hours

**⚠️ OPUS REVIEW REQUIRED:** Game balance analysis for gambling mechanics, payout rates, and player psychology.

**Changes Required:**

1. **Replace Ancient Statue:**
   - Remove all Ancient Statue encounter code
   - Keep statuette system (pedestal placement) - this is separate
   - Add new neutral encounters: `between20s1` and `between20s2`

2. **Stage 1 Implementation:**
   - Entry check: Minimum 2 Gold
   - Wager calculation: `Math.min(10, Math.floor(playerGold / 2) * 2)` (even numbers only)
   - Phase 1: Roll `(d20SigilLevel + 1)` dice, select min and max as bounds
   - Instant loss check: If min === max
   - Phase 2: Player choice (back out for half, or continue)
   - Phase 3: Roll `d20SigilLevel` dice, check if ANY lands in [min, max] inclusive
   - Payout: 2x wager

3. **Stage 2 Implementation:**
   - Same entry check and wager system
   - Phase 1: Roll exactly 2 dice (no sigil upgrades), sort to bounds
   - Instant loss check: If both dice same
   - NO Phase 2 (no backing out)
   - Phase 3: Same as Stage 1 Phase 3
   - Payout: 4x wager, capped at 40G maximum

4. **UI Considerations:**
   - Show dice roll animations
   - Display bounds clearly
   - Show all target roll results (not just winning one)
   - Explain instant loss clearly
   - Show payout calculation

**Testing Checklist:**
- [ ] Cannot play with < 2 Gold
- [ ] Wager scales correctly (even numbers, max 10)
- [ ] Stage 1 bounds use (sigil level + 1) dice
- [ ] Stage 2 bounds always use 2 dice
- [ ] Target rolls use sigil level dice
- [ ] Instant loss triggers on identical bounds
- [ ] Stage 1 allows backing out for half refund
- [ ] Stage 2 has no backing out option
- [ ] Stage 2 payout caps at 40G
- [ ] Inclusive range works (bounds count as wins)

**Opus Tasks:**
- Analyze gambling odds at different D20 sigil levels
- Review payout balance (2x vs 4x with cap)
- Evaluate player experience and engagement
- Suggest any balance adjustments

---

#### Task 2B: Wizard Redesign
**Complexity:** High
**Model:** Sonnet (implementation) + Opus (architecture review)
**Location:** Lines 5512-5663
**Estimated Time:** 4-6 hours

**⚠️ OPUS REVIEW REQUIRED:** System architecture analysis for temporary vs permanent upgrades, sigil distribution logic.

**Changes Required:**

1. **Identify Sigil Categories:**
   - Starter Sigils (5): Attack, Shield, Heal, Expand, D20
   - Non-Starter Sigils (5): Alpha, Asterisk, Star, Grapple, Ghost

2. **Stage 1 Redesign:**
   - Display only NON-STARTER sigils on wizard wall
   - Player chooses which hero examines wall
   - Check if chosen hero HAS the displayed sigil
   - If YES: Hero gets +1 level (temporary, this run only) → Stage 2 unlocks
   - If NO: No effect, Stage 2 locked

3. **Stage 2 Redesign (replaces permanent sacrifice system):**
   - **Primary Logic:**
     - Find all sigils that NO hero currently possesses
     - Randomly select one from this pool
     - Grant to ALL heroes at L1 (temporary, this run only)
   - **Fallback Logic (all sigils owned):**
     - Find all sigils at lowest level across all heroes
     - Randomly select one from lowest pool
     - Prioritize passive sigils if tied
     - Upgrade by +1 for ALL heroes (temporary, this run only)

4. **Remove Permanent System:**
   - Remove sacrifice mechanic
   - Remove permanent Sigilarium upgrades from wizard
   - All bonuses are temporary (current run only)
   - Update wizard dialogue/narrative

**Implementation Details:**
- Track temporary upgrades separately from permanent sigils
- Ensure temp upgrades clear on run end/death
- Update wizard encounter text for new mechanics
- Remove `acceptWizardSacrifice()` and related functions

**Testing Checklist:**
- [ ] Stage 1 only shows non-starter sigils
- [ ] Stage 1 requires hero to have the sigil to proceed
- [ ] Stage 2 only unlocks if Stage 1 succeeds
- [ ] Stage 2 grants unowned sigils to ALL heroes
- [ ] Fallback logic works when all sigils owned
- [ ] Passive sigils prioritized in fallback
- [ ] All bonuses are temporary (lost on death/win)
- [ ] No permanent upgrades from wizard

**Opus Tasks:**
- Analyze temporary vs permanent upgrade philosophy
- Review sigil distribution fairness
- Evaluate impact on game progression
- Suggest improvements to selection logic

---

### PHASE 3: Integration (After All Mechanics Finalized)

#### Task 3A: Tutorial Redesign
**Complexity:** Very High
**Model:** Sonnet (implementation) + Opus (content audit)
**Estimated Time:** 6-8 hours

**⚠️ OPUS REVIEW REQUIRED:** Explicitly mentioned in spec for "pop-up audit and relocation"

**Changes Required:**

1. **Phase 1: Tapo's Birthday (NEW)**
   - **Narrative:** Tapo's birthday, Mage teaching fly catching
   - **Combatant:** Mage ONLY (no other heroes)
   - **Enemies:** 3 Flies (1 POW, 2 HP each, no sigils)
   - **Special:** Mage does NOT have D20 for this battle
   - **Teaching:** Sigils (basic concept), Attack, Expand, combat flow
   - **Outcome:** Victory = eat flies together (happy moment)
   - **UI:** Minimal pop-ups, light and fun tone

2. **Phase 2: Portal Invasion (MODIFIED)**
   - **Narrative:** Portal opens, heroes spring to defend Tapo
   - **Combatants:** Multiple heroes (Tank, Warrior, Healer, Mage)
   - **Mage Change:** NOW has D20 (reintroduced here)
   - **Enemy:** Wolf (existing stats)
   - **Scripted Events:**
     - Turn 2: Wolf gains Shield sigil
     - Turn 2: Confuse roll fudged (guaranteed success)
     - Turn 2: Wolf dies from fudged Confuse
   - **Teaching:** D20 mechanics (primary focus), enemy sigils, multi-hero coordination

3. **Content Redistribution:**
   - Move basic combat tutorials to Phase 1
   - Move D20 tutorials to Phase 2
   - Remove redundant explanations
   - Smooth narrative flow between phases

**Implementation Challenges:**
- Current tutorial is heavily integrated (Ribbleton-themed popups throughout)
- Need to split into two distinct phases
- Must preserve tutorial state tracking
- Need to create new Tapo birthday narrative
- Must audit ALL existing tutorial popups

**Opus Tasks (CRITICAL):**
- **Audit all tutorial popups** (search for `showTutorialPop`, `ribbleton_`, `tutorialState`)
- **Categorize popups:** Phase 1 (basics), Phase 2 (D20/advanced), Remove (redundant)
- **Relocate popups** to appropriate phase
- **Identify content gaps** after split
- **Recommend new popups** for Phase 1 if needed
- **Ensure narrative coherence** between phases
- **Optimize information flow** based on two-phase structure

**Testing Checklist:**
- [ ] Phase 1 uses only Mage vs 3 Flies
- [ ] Mage lacks D20 in Phase 1
- [ ] Phase 1 teaches Attack, Expand, basic sigils
- [ ] Phase 1 has celebratory, light tone
- [ ] Phase 2 introduces all 4 heroes
- [ ] Mage has D20 in Phase 2
- [ ] Phase 2 focuses on D20 mechanics
- [ ] Wolf Shield gain and Confuse fudge work correctly
- [ ] No redundant information between phases
- [ ] Narrative flows smoothly from birthday to invasion

---

## Dependency Graph

```
PHASE 1 (Parallel)
├─ 1A: Enemy Stats ────────┐
├─ 1B: Gambit System ──────┼─────→ PHASE 3
├─ 1C: Asterisk ───────────┘       (Tutorial needs all
                                    mechanics finalized)
PHASE 2 (Sequential)                      ↓
├─ 2A: Between 20's ───→ 2B: Wizard ─────→ 3A: Tutorial
```

**Why This Order:**
1. **Phase 1 first:** Foundation changes that other systems depend on
2. **Phase 2 sequential:** Between 20's and Wizard are independent but complex
3. **Phase 3 last:** Tutorial must reflect ALL final mechanics, so wait until everything else is done

---

## Opus Review Summary

### When to Switch to Opus:
This task involves strategic planning and complex architectural decisions. **Switch to Opus for:**

1. **Task 2A (Between 20's):** Game balance analysis
   - Gambling odds calculation
   - Payout fairness evaluation
   - Player psychology analysis

2. **Task 2B (Wizard):** System architecture review
   - Temporary vs permanent upgrade philosophy
   - Sigil distribution logic
   - Long-term impact on progression

3. **Task 3A (Tutorial - CRITICAL):** Content audit and redistribution
   - Popup categorization and relocation
   - Narrative coherence analysis
   - Information flow optimization

### After Opus Review:
Switch back to Sonnet for implementation of approved designs.

---

## Risk Assessment

### High Risk Items:
1. **Tutorial Redesign:** Most complex due to existing integration depth
2. **Wizard Redesign:** Complete paradigm shift from permanent to temporary
3. **Last Stand Changes:** Subtle math changes could break balance

### Medium Risk Items:
1. **Between 20's:** New system, but isolated (doesn't affect other systems)
2. **Asterisk Redesign:** Changes behavior but simpler than current system

### Low Risk Items:
1. **Enemy Stats:** Simple data changes
2. **Gambit DCs:** Straightforward number updates

---

## Testing Strategy

### Unit Testing (Per Task):
- Test each feature in isolation using checklist above
- Verify edge cases (0 gold, max level sigils, etc.)
- Check UI rendering

### Integration Testing (After Each Phase):
- Test interactions between changed systems
- Verify no regressions in unchanged systems
- Full playthrough from tutorial to late game

### Final Acceptance Testing:
- Complete tutorial walkthrough
- Test all neutral encounters
- Test all gambit types including Mend
- Test Asterisk in various combat scenarios
- Test wizard encounter flow
- Test Between 20's at different gold/sigil levels
- Verify enemy stats match spec

---

## Implementation Timeline Estimate

| Phase | Tasks | Time | Model |
|-------|-------|------|-------|
| Phase 1A | Enemy Stats | 0.5 hrs | Sonnet |
| Phase 1B | Gambit System | 2 hrs | Sonnet |
| Phase 1C | Asterisk | 2 hrs | Sonnet |
| **Phase 1 Total** | | **4.5 hrs** | |
| Phase 2A | Between 20's | 4-6 hrs | Sonnet + Opus |
| Phase 2B | Wizard | 4-6 hrs | Sonnet + Opus |
| **Phase 2 Total** | | **8-12 hrs** | |
| Phase 3A | Tutorial | 6-8 hrs | Sonnet + Opus |
| **Phase 3 Total** | | **6-8 hrs** | |
| **Testing** | All phases | 4-6 hrs | Sonnet |
| **GRAND TOTAL** | | **22.5-30.5 hrs** | |

---

## Success Criteria

Version 9.99 is complete when:
- [ ] All 6 system changes implemented per spec
- [ ] All testing checklists passed
- [ ] Opus has reviewed and approved complex systems
- [ ] No regressions in existing functionality
- [ ] Full game playthrough successful
- [ ] Code committed and pushed to feature branch

---

## Next Steps

1. **Review this roadmap** with user for approval
2. **Decide on Opus involvement:** When to switch models?
3. **Begin Phase 1:** Start with parallel implementation of Tasks 1A, 1B, 1C
4. **Document progress:** Update this roadmap as tasks complete

---

*Roadmap created by Claude Sonnet 4.5 on 2025-11-17*
