# FROGGLE v9.991 Implementation Tasks

## Context & Previous Work

Version 9.99 implemented the "Big 3" quality improvements:
- ✅ Added hover/focus states to all buttons
- ✅ Added level numbers to sigils (L2+ only, with superscript)
- ✅ Optimized combat timing (reduced delays by ~50%)
- ✅ Added fade transitions between major screens

This document contains the remaining quality improvements for v9.991.

---

## PRIORITY 1: GAMEPLAY CLARITY (Quick Wins, 30-45 minutes)

### Task 1.1: Document Ghost Persistence (5 minutes)
**Location:** `index.html:1119`

**Current Issue:**
Ghost charges persist between combats but this is undocumented. Players don't know if this is intentional or a bug.

**Current Tooltip:**
```javascript
'Ghost': 'Cancel the next lethal hit. Each charge prevents one death. Charges shown on card (max 9 charges).',
```

**Required Change:**
```javascript
'Ghost': 'Cancel the next lethal hit. Each charge prevents one death. Charges shown on card (max 9 charges). Ghost charges PERSIST between combats.',
```

**DO NOT change the mechanics** - Ghost should continue to persist. Just document it clearly.

---

### Task 1.2: Add D20 Success Rates to Combat Gambits (15 minutes)
**Location:** `index.html:1116`

**Current Issue:**
Players don't know D20 success probability. Tooltip says "roll more dice, take best" but no numbers.

**Math Reference:**
- DC requirement: 10+
- L1: Roll 1d20 = 11/20 = 55%
- L2: Roll 2d20, take best = 79.75% (1 - 0.45²)
- L3: Roll 3d20, take best = 90.875% (1 - 0.45³)
- L4: Roll 4d20, take best = 95.9% (1 - 0.45⁴)

**Current Tooltip:**
```javascript
'D20': 'Roll for crazy gambits: Confuse (damage), Startle (stun), Mend (heal self), Steal (gold), Recruit (join team). Higher levels roll more dice, take best result.',
```

**Required Change:**
```javascript
'D20': 'Roll 1d20 per level, take highest. Need 10+ to succeed. L1: 55%, L2: 80%, L3: 91%, L4: 96%. Effects: Confuse (damage), Startle (stun), Mend (heal self), Steal (gold), Recruit (join team).',
```

**IMPORTANT:** DO NOT add success rates to neutral encounter D20 options (lines 2348-2373). Only add to combat gambit tooltip.

---

### Task 1.3: Verify/Fix Frogged Up Mode Rewards (15 minutes)
**Location:** `index.html:3431-3437` (enemy scaling), `index.html:3466-3480` (XP/gold rewards)

**Current Issue:**
Need to verify that gold and XP are TRIPLED in Frogged Up mode as intended. Enemy stats are tripled, but rewards must also be tripled.

**Terminology:**
- ✅ "Frogged Up mode" or "FU mode"
- ❌ NEVER "Effed mode" or "Effed Up"

**Expected Behavior:**
```javascript
// Enemy scaling (should already be correct):
if(S.gameMode === 'fu') {  // or 'frogged' - check what the actual value is
  e.m = e.m * 3;  // Max HP tripled
  e.h = e.h * 3;  // Current HP tripled
  e.p = e.p * 3;  // POW tripled
}

// Reward calculation (verify this is tripled):
// After killing enemy, around line 3466-3480:
const baseGold = e.gold;
const baseXP = e.xp;

if(S.gameMode === 'fu') {  // or whatever the actual check is
  S.combatGold += baseGold * 3;
  S.combatXP += baseXP * 3;
} else {
  S.combatGold += baseGold;
  S.combatXP += baseXP;
}
```

**Action Required:**
1. Find where combat rewards are calculated after enemy death
2. Verify gold and XP are multiplied by 3× in Frogged Up mode
3. If not, add the multiplier
4. Check all references to game mode and ensure consistent naming

---

## PRIORITY 2: COMBAT FEEL IMPROVEMENTS (Medium Tasks, 2-3 hours)

### Task 2.1: Fix Enemy Turn Execution Order (1 hour)
**Location:** `index.html:4498-4510` (executeNormalEnemyPhase function)

**Current Issue:**
Enemies act sequentially with 600ms delays, creating a slow waterfall effect. Should execute simultaneously in reading order (top-down, left-to-right) with minimal delay.

**Current Code:**
```javascript
function executeNormalEnemyPhase() {
  // Group enemies by lane
  const lanes = {};
  S.enemies.forEach(e => { if(!lanes[e.li]) lanes[e.li] = []; lanes[e.li].push(e); });
  let delay = 0;
  Object.keys(lanes).forEach(laneIdx => {
    lanes[laneIdx].forEach(enemy => {
      setTimeout(() => executeEnemyTurn(enemy), delay);
      delay += 600;  // PROBLEM: Sequential with long delays
    });
  });
  setTimeout(() => endEnemyTurn(), delay + 300);
}
```

**Required Change:**
```javascript
function executeNormalEnemyPhase() {
  // Execute all enemies in reading order (top-down, left-right) with minimal stagger
  const allEnemies = [...S.enemies].sort((a, b) => a.li - b.li); // Sort by lane index

  let delay = 0;
  allEnemies.forEach((enemy, idx) => {
    setTimeout(() => executeEnemyTurn(enemy), delay);
    delay += 80; // Just enough stagger for visual clarity (was 600ms)
  });

  // Wait for longest animation to complete (600ms per enemy action + stagger)
  setTimeout(() => endEnemyTurn(), delay + 600);
}
```

**Similar changes needed for:**
- `executeAlphaPhase()` (line 4394-4413)
- `executeRecruitPhase()` (line 4415-4423)

**Goal:** All enemies appear to act simultaneously with subtle stagger for visual clarity, not a slow sequential waterfall.

---

### Task 2.2: Add Processing Indicators (Rare Use Only) (30 minutes)
**Location:** Add utility functions, apply only where genuinely needed

**Requirement:**
Processing indicators should be RARE. Only add if there are actual loading/processing delays that could make the game appear frozen.

**Add Helper Functions:**
```javascript
// Add after line 4806 (near transitionScreen helper)
function showProcessing(message = 'Processing...') {
  const existing = document.getElementById('processingOverlay');
  if (existing) return; // Don't stack overlays

  const overlay = document.createElement('div');
  overlay.id = 'processingOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.85);
    color: #fbbf24;
    padding: 1rem 2rem;
    border-radius: 12px;
    border: 2px solid #fbbf24;
    font-weight: bold;
    font-size: 1.2rem;
    z-index: 25001;
    pointer-events: none;
    animation: fadeIn 0.2s ease;
  `;
  overlay.textContent = message;
  document.body.appendChild(overlay);
}

function hideProcessing() {
  const overlay = document.getElementById('processingOverlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.15s ease';
    setTimeout(() => overlay.remove(), 150);
  }
}
```

**Apply ONLY to genuinely slow operations:**
- Save/load operations IF they take >500ms
- Large combat initializations (10+ enemies) IF render() takes >300ms
- Floor transitions IF there's actual processing delay

**DO NOT add to:**
- Normal combat turn transitions (already fast with new timings)
- Enemy phase transitions (should feel instant)
- Button clicks (should be immediate)

**Example Usage (only if needed):**
```javascript
// In save operation if it's slow:
function save() {
  showProcessing('Saving...');
  try {
    // ... save logic
    toast('Game saved!');
  } finally {
    hideProcessing();
  }
}
```

---

## PRIORITY 3: CODE QUALITY & MAINTAINABILITY (2-3 hours)

### Task 3.1: Consolidate Button Styling (1 hour)
**Location:** Throughout HTML generation functions (multiple locations)

**Problem:**
Mix of inline `style=""` attributes and CSS classes. Makes maintenance hard and creates inconsistency.

**Step 1: Enhance CSS Classes**
Add to CSS section around line 91-94:
```css
/* Existing .btn classes - keep these */
.btn { /* ... existing base styles ... */ }
.btn:hover { /* ... existing ... */ }
.btn:focus-visible { /* ... existing ... */ }
.btn:active { /* ... existing ... */ }

/* Ensure all color variants exist: */
.btn.primary { background: #2c63c7; } /* Default blue */
.btn.safe { background: #22c55e; } /* Already exists */
.btn.risky { background: #f59e0b; } /* Already exists */
.btn.danger { background: #dc2626; } /* Already exists */
.btn.secondary { background: #6b7280; } /* Already exists */
.btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* Size variants */
.btn.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  min-height: 40px;
}

.btn.large {
  padding: 1.5rem;
  font-size: 1.3rem;
  min-height: 70px;
}
```

**Step 2: Find and Replace Inline Styles**
Search for patterns like:
```javascript
// Bad (inline styles):
`<button class="btn" style="background:#dc2626;padding:0.5rem" onclick="...">`
`<button class="btn" style="background:#22c55e" onclick="...">`
`<button class="btn secondary" style="padding:0.5rem 0.75rem" onclick="...">`

// Good (CSS classes):
`<button class="btn danger" onclick="...">`
`<button class="btn safe" onclick="...">`
`<button class="btn secondary small" onclick="...">`
```

**Common Inline Style Patterns to Replace:**
- `style="background:#dc2626"` → `class="btn danger"`
- `style="background:#22c55e"` → `class="btn safe"`
- `style="background:#f59e0b"` → `class="btn risky"`
- `style="background:#6b7280"` → `class="btn secondary"`
- `style="opacity:0.4"` on disabled buttons → `class="btn disabled"`
- `style="padding:0.5rem..."` → `class="btn small"`

**Step 3: Update Disabled Button Handling**
Replace patterns like:
```javascript
// Before:
const disabled = !canStart;
html += `<button class="btn safe" ${disabled ? 'disabled' : ''}
         style="${disabled ? 'opacity:0.4;cursor:not-allowed' : ''}"
         onclick="startGame()">Start</button>`;

// After:
const disabled = !canStart;
html += `<button class="btn safe ${disabled ? 'disabled' : ''}"
         ${disabled ? 'disabled' : ''}
         onclick="startGame()">Start</button>`;
```

**Locations to Check:**
- Hero selection screen
- Neutral encounter choices
- Death screen buttons (Restart, Champions, etc.)
- Level up screen buttons
- Settings menu buttons
- Save slot management buttons

---

### Task 3.2: Add Animation Timing Constants (30 minutes)
**Location:** Top of JavaScript section (around line 1500, near other constants)

**Add Constants Section:**
```javascript
// ===== ANIMATION TIMING CONSTANTS =====
// Centralized timing values for easy tuning and consistency
const ANIMATION_TIMINGS = {
  // CSS animation durations (must match CSS @keyframes)
  DAMAGE_FLASH: 400,      // .hit-flash animation duration
  ATTACK_SLIDE: 480,      // .attack-slide animation duration
  HEAL_FLASH: 480,        // .heal-flash animation duration
  SHIELD_FLASH: 480,      // .shield-flash animation duration

  // Screen transition timings
  FADE_TRANSITION: 200,   // Screen fade in/out duration
  FLOOR_INTERSTITIAL: 2000, // Floor name display duration

  // Combat turn timings
  TURN_TRANSITION: 250,   // Hero turn → Enemy turn delay
  PHASE_TRANSITION: 200,  // Between enemy phases (Alpha/Recruit/Normal)
  ALPHA_PHASE_START: 400, // Enemy turn start → Alpha phase
  ENEMY_ACTION_DELAY: 80, // Stagger between enemy actions (reading order)
  ENEMY_TURN_END: 300,    // After last enemy action
  ACTION_COMPLETE: 500,   // After hero action completes

  // Toast message timings
  TOAST_SHORT: 1200,      // Short notification
  TOAST_MEDIUM: 1800,     // Medium notification
  TOAST_LONG: 2000,       // Long notification
  TOAST_FADE: 300,        // Toast fade out duration

  // Tooltip timings
  TOOLTIP_DELAY: 500,     // Long-press delay for mobile tooltips
  TOOLTIP_FADE: 200,      // Tooltip fade in/out

  // Special animations
  BONUS_TURN_STACK: 300,  // Bonus turn card animation
  VICTORY_DELAY: 1000,    // Delay before level up screen
  DEFEAT_DELAY: 1000,     // Delay before death screen
  TUTORIAL_DELAY: 800,    // Tutorial popup delays
};
```

**Replace All Hardcoded Timings:**

Search for these patterns and replace with constants:
```javascript
// Animation class removal:
setTimeout(() => card.classList.remove('hit-flash'), 400);
// Replace with:
setTimeout(() => card.classList.remove('hit-flash'), ANIMATION_TIMINGS.DAMAGE_FLASH);

// Combat transitions:
setTimeout(() => { S.locked = true; enemyTurn(); }, 250);
// Replace with:
setTimeout(() => { S.locked = true; enemyTurn(); }, ANIMATION_TIMINGS.TURN_TRANSITION);

// Phase delays:
setTimeout(() => executeAlphaPhase(), 400);
// Replace with:
setTimeout(() => executeAlphaPhase(), ANIMATION_TIMINGS.ALPHA_PHASE_START);

// Toast messages:
toast('Saved!', 1200);
// Replace with:
toast('Saved!', ANIMATION_TIMINGS.TOAST_SHORT);

// Tooltip delays:
setTimeout(() => showTooltip(...), 500)
// Replace with:
setTimeout(() => showTooltip(...), ANIMATION_TIMINGS.TOOLTIP_DELAY)
```

**Search Pattern:** `setTimeout.*\d{3,4}` to find all hardcoded millisecond values.

**Locations to Update:**
- index.html:1766-1877 (animation class removals)
- index.html:2098-2099 (error → title delay)
- index.html:2686, 3004 (tutorial skip delays)
- index.html:3354 (floor interstitial)
- index.html:3778, 3790 (D20 menu delays)
- index.html:3904-3965 (action completion delays)
- index.html:4292, 4314, 4396, 4416, 4509 (combat turn timings)
- index.html:4774-4784 (victory/defeat delays)
- All toast() calls throughout
- All tooltip setTimeout calls

---

### Task 3.3: Add Code Documentation Comments (1 hour)
**Location:** Complex functions throughout codebase

**Add JSDoc-style Comments to These Functions:**

#### drawEnemyStartSigil (line ~3317)
```javascript
/**
 * Assigns starting sigils to enemies based on floor progression and enemy type.
 *
 * Sigil Pool Logic:
 * - Early game (Floor 1-5): Attack only, low levels
 * - Mid game (Floor 7-13): Attack + Shield/Grapple mix
 * - Late game (Floor 15+): Attack + Shield/Grapple + rare Alpha
 *
 * Special Cases:
 * - Dragons always get Shield L1 baseline
 * - Cave Trolls prefer Grapple (thematic - they grapple)
 * - Flies never get sigils (too weak, would be OP)
 *
 * @param {Object} enemy - Enemy object to assign sigil to
 * @param {Object} base - ENEMY_BASES entry with pool configuration
 */
function drawEnemyStartSigil(enemy, base) {
  // ... existing code
}
```

#### checkAsteriskPrimed (line ~3846)
```javascript
/**
 * Checks and applies Asterisk "first action multiplier" mechanic.
 *
 * Asterisk Interaction Rules:
 * - Only triggers on FIRST action of hero's turn
 * - Adds +Level bonus instances to multi-instance actions
 * - Works with: Attack, Shield, Heal, Grapple
 * - Does NOT work with: D20, Ghost, Alpha
 * - Stacks with base action level (Attack L2 + Asterisk L1 = 3 attacks)
 * - Alpha-granted actions do NOT retrigger Asterisk
 *
 * Example: Warrior with Attack L3, Asterisk L2
 * - First Attack: 3 + 2 = 5 instances
 * - Second Attack (if Alpha gives bonus): 3 instances (Asterisk already used)
 *
 * @param {Object} hero - Hero object
 * @param {string} action - Action name ('Attack', 'Shield', etc.)
 * @param {number} heroIdx - Hero index in S.heroes array
 * @returns {boolean} - True if Asterisk was applied
 */
function checkAsteriskPrimed(hero, action, heroIdx) {
  // ... existing code
}
```

#### executeAlphaPhase (line ~4394)
```javascript
/**
 * Executes Alpha phase of enemy turn.
 *
 * Alpha Mechanic:
 * - Enemies with Alpha sigil grant bonus actions to allies
 * - Alpha enemy does NOT act themselves (skips normal turn)
 * - Chooses strongest ally (highest POW, then most sigils)
 * - Grants Level × Attack actions to chosen ally
 * - All Alpha actions resolve before Recruit/Normal phases
 *
 * Execution Order:
 * 1. Find all non-stunned enemies with Alpha sigil
 * 2. For each Alpha enemy: Grant attacks to best ally
 * 3. Mark Alpha enemy as "acted" (skips normal phase)
 * 4. Continue to Recruit phase
 */
function executeAlphaPhase() {
  // ... existing code
}
```

#### combat (line ~3425)
```javascript
/**
 * Initializes combat encounter for given floor.
 *
 * Combat Initialization:
 * - Resets turn state (round=1, turn='player', no actions)
 * - Shields persist from previous combat (capped at max HP)
 * - Ghost charges persist between combats
 * - Stun counters reset to 0
 * - Creates enemies based on floor composition
 * - Handles Ribbleton tutorial special cases
 *
 * @param {number} f - Floor number (1-19, or 0 for tutorial)
 */
function combat(f) {
  // ... existing code
}
```

#### transitionScreen (line ~4807)
```javascript
/**
 * Smoothly transitions between major game screens with fade effect.
 *
 * Animation Flow:
 * 1. Fade out current screen (200ms)
 * 2. Execute callback to update content
 * 3. Fade in new screen (200ms)
 *
 * Total transition time: 400ms
 *
 * Used for: error→title, tutorial skip→title, defeat→death, etc.
 *
 * @param {Function} callback - Function to call during fade (updates screen content)
 */
function transitionScreen(callback) {
  // ... existing code
}
```

**Other Functions to Document:**
- `getLevel()` - Explain temporary vs permanent sigil level calculation
- `isMultiInstance()` - Which sigils support multiple instances
- `needsEnemyTarget()` / `needsHeroTarget()` - Targeting rules
- `executeMultiInstanceAction()` - How instance tracking works
- `checkCombatEnd()` - Victory/defeat conditions and Last Stand
- `TutorialManager` methods - Tutorial state machine flow

---

### Task 3.4: Organize State Management (30 minutes)
**Location:** `index.html:1644-1704` (State object definition)

**Add Namespace Comments:**
```javascript
const S = {
// ===== HERO STATE =====
heroes: [],
sig: {Attack:1, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
tempSigUpgrades: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},

// ===== GAME PROGRESSION =====
floor: 1,
gameMode: 'normal', // 'normal' or 'fu' (Frogged Up)
runNumber: 1,
currentSlot: null,
gold: 0,
goingRate: 20,

// ===== COMBAT STATE (resets each combat) =====
activeIdx: -1,      // Currently acting hero index (-1 = none)
acted: [],          // Array of hero indices that have acted this turn
locked: false,      // UI locked during enemy turn
pending: null,      // Currently selected action (e.g., 'Attack', 'Shield')
targets: [],        // Selected target IDs for action
currentInstanceTargets: [], // Targets for current multi-instance iteration
instancesRemaining: 0,      // How many instances left to target
totalInstances: 0,          // Total instances for this action
lastActions: {},            // Last action taken by each hero (for Asterisk)
enemies: [],        // Current enemy array
recruits: [],       // Recruited enemies (fight for player)
round: 1,           // Current combat round
turn: 'player',     // 'player' or 'enemy'
combatXP: 0,        // XP earned this combat
combatGold: 0,      // Gold earned this combat
selectingEncampmentTargets: false, // Special state for Encampment encounter
encampmentEarlyKills: 0,           // Number of enemies to kill early

// ===== NEUTRAL ENCOUNTER STATE (resets each encounter) =====
neutralDeck: [],    // Deck of neutral encounter IDs
lastNeutral: null,  // Last neutral encountered (for non-repeat)
ambushed: false,    // Whether current combat is an ambush

// ===== TEMPORARY NEUTRAL STATE (resets on death) =====
silverKeyHeld: false,     // Silver key from Ghost Boys
oracleHero: null,         // Hero chosen at Oracle
oracleRoll: null,         // Roll result at Oracle
oracleStat: null,         // Stat chosen at Oracle
wizardSigil: null,        // Sigil being tested at Wizard

// ===== PERSISTENT STATE (survives death, saved in permanent storage) =====
ancientStatueDeactivated: false, // Ancient Statue one-time choice made
ghostBoysConverted: false,       // Ghost Boys converted (no longer hostile)
princeGender: 'Prince',          // Gender preference for quest line
pedestal: [],                    // Champion hero figurines [{hero, mode, stats}]

// ===== UI STATE =====
toastLog: [],               // Array of recent toast messages
toastLogExpanded: false,    // Whether toast log is expanded
toastLogVisible: true,      // Whether toast log is shown
tooltipsDisabled: false,    // Whether sigil tooltips are disabled
helpTipsDisabled: false,    // Whether tutorial help tips are disabled

// ===== TUTORIAL STATE (permanent flags) =====
tutorialFlags: {
  ribbleton_intro: false,
  ribbleton_warrior_attack: false,
  ribbleton_targeting: false,
  ribbleton_healer_d20: false,
  ribbleton_d20_menu: false,
  healer_expand_explain: false,
  ribbleton_enemy_turn: false,
  ribbleton_healer_heal: false,
  ribbleton_expand: false,
  ribbleton_finish_wolf: false,
  enemies_get_sigils: false,
  ribbleton_shield_sigil: false,
  ribbleton_handoff: false,
  ribbleton_tooltip_intro: false,
  levelup_intro: false,
  levelup_stat_upgrade: false,
  levelup_add_active: false,
  levelup_upgrade_active: false,
  levelup_upgrade_passive: false,
  death_intro: false,
  death_exit_warning: false,
  neutral_intro: false,
  neutral_d20_level: false,
  last_stand_intro: false,
  recruit_intro: false,
  run2_hero_lock: false,
  first_victory_sequence: false,
  first_fu_victory: false,
  pedestal_first_placement: false,
  tapo_victory_message: false
},
usedDeathQuotes: []  // Track which death quotes have been shown
};
```

**No logic changes** - just add organizing comments to make the state structure clear.

---

## TESTING CHECKLIST

After implementing all changes, verify:

### Gameplay
- [ ] Ghost tooltip mentions persistence between combats
- [ ] D20 combat tooltip shows success rates (55%, 80%, 91%, 96%)
- [ ] D20 neutral tooltips do NOT show success rates
- [ ] Gold is tripled in Frogged Up mode
- [ ] XP is tripled in Frogged Up mode
- [ ] Enemy turns execute in reading order (top-down, left-right) with minimal delay
- [ ] All enemies appear to act nearly simultaneously (not slow sequential)

### Visual Polish
- [ ] All buttons use CSS classes instead of inline styles
- [ ] Disabled buttons use `.disabled` class (no inline opacity)
- [ ] Processing indicators only appear where genuinely needed (rare)
- [ ] No "frozen" feeling during normal gameplay

### Code Quality
- [ ] All setTimeout calls use ANIMATION_TIMINGS constants
- [ ] Complex functions have documentation comments
- [ ] State object has namespace organization comments
- [ ] No hardcoded millisecond values remain (search for `\d{3,4}ms`)

### Terminology
- [ ] All references to difficult mode say "Frogged Up" or "FU mode"
- [ ] No references to "Effed" or "Effed mode" remain

---

## IMPLEMENTATION ORDER

Recommended implementation sequence:

1. **Task 1.1** - Document Ghost persistence (5 min)
2. **Task 3.2** - Add animation constants FIRST (30 min) - makes subsequent work easier
3. **Task 1.2** - Add D20 success rates (15 min)
4. **Task 1.3** - Verify/fix Frogged Up rewards (15 min)
5. **Task 2.1** - Fix enemy turn order (1 hour)
6. **Task 3.1** - Consolidate button styles (1 hour)
7. **Task 3.4** - Organize state comments (30 min)
8. **Task 3.3** - Add function documentation (1 hour)
9. **Task 2.2** - Add processing indicators (only if needed, 30 min)

**Total Time: ~5 hours**

---

## DEFERRED FOR FUTURE VERSIONS

These items are NOT part of v9.991:

### Gameplay Changes (Awaiting Design Decisions)
- Floor 11/13 enemy composition changes (owner will reflect on balance)
- Shield/Ghost persistence mechanics changes (keep as-is, just documented)
- Difficulty curve smoothing (needs more analysis)

### Future Features (v10.0+)
- Keyboard navigation foundation
- ARIA accessibility attributes
- Controller support
- Haptic feedback (needs testing on multiple devices)
- Multi-target animation staggering (nice-to-have)

---

## VERSION NUMBER

Update version in `index.html:13`:
```html
<title>FROGGLE v9.991</title>
```

And in any version display strings throughout the codebase.

---

**Good luck with v9.991 implementation! These changes will significantly improve code maintainability and gameplay clarity.** 🐸
