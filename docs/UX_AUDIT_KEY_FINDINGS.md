# FROGGLE UX Audit - Key Findings & Recommendations

## Critical UX Insights

### What's Working Well

**1. Multi-Layer Help System** 
- Tutorial popups guide players through mechanics progressively
- Tooltips provide on-demand details (hover/long-press)
- FAQ covers complex mechanics (damage calculations, class balance, etc.)
- Settings allow disabling help if desired
- **Result:** New players get supported, experienced players don't get annoyed

**2. Clear Visual Feedback**
- Toast notifications tell players what happened (damage, heals, errors)
- Combat board clearly shows hero/enemy HP, sigils, status effects
- Gold/XP counters prominently displayed
- Color coding for different sigil levels/rarity
- **Result:** Players always know game state

**3. Smart Tutorial Progression**
- Tutorials only show once (tracked via flags)
- Can be reset in settings
- Context-aware (appears when mechanic is first used)
- Not forced to replay on subsequent runs
- **Result:** Smooth for repeat players, thorough for newcomers

**4. Mobile-First Design**
- Tooltips work on touch (long-press 500ms)
- Responsive layout scales to device size
- All tap targets are button-sized
- PWA-capable for installable play
- **Result:** Accessible across all devices

---

## Critical Pain Points & Frustrations

### High Priority Issues

**1. TUTORIAL OVERLOAD IN COMBAT (Ribbleton)**
- **Problem:** Players get 12+ popup notifications in their first combat
- **When:** Each step of the tutorial combat (targeting, healing, enemy turn, etc.)
- **User Impact:** Can feel patronizing or overwhelming for experienced gamers
- **Code Location:** Lines 1333-1405 (showTutorialPop calls)
- **Recommendation:**
  - Option A: Batch tutorials into fewer, longer popups ("Let me explain targeting AND healing together")
  - Option B: Make popups dismissable with "Got it" button instead of blocking
  - Option C: Add "Skip this tutorial?" option for players who want to self-discover

**Example Current Flow:**
```
Pop 1: "Click Warrior's Attack sigil"
Pop 2: "Click Wolf to target"
Pop 3: "Click Healer's D20"
Pop 4: "Here's how D20 works..."
... 8 more popups follow
```

**2. LEVEL DISPLAY CONFUSION**
- **Problem:** Active sigils show as "L1" when storage level is 0
- **When:** Player sees "Attack L1" but hasn't purchased any upgrades
- **User Impact:** "Why does it say Level 1 if I haven't bought anything?"
- **Code Location:** Line 7806 (display level calculation)
- **Root Cause:** Active sigils display as `(storage_level + 1)` to simplify UI
- **Recommendation:**
  - Add FAQ entry explaining this (DONE - see FAQ item 1)
  - Consider showing "L1 (Base)" instead of just "L1"
  - Or show two numbers: "Storage L0 → Display L1"

**3. ERROR MESSAGES ARE TOO TERSE**
- **Problem:** Players don't understand what "Not unlocked!" means
- **When:** Trying to use a sigil they haven't purchased
- **User Impact:** No guidance on how to unlock it
- **Examples:**
  - "Ghost not unlocked!" → should be "You haven't purchased the Ghost sigil yet. Earn XP and visit the Level-Up screen."
  - "Grapple would be lethal!" → is actually helpful, but could suggest: "Choose weaker targets or cancel this action"
- **Code Locations:** Lines 3477, 3486, 3494
- **Recommendation:**
  - Add "How to unlock" hint to error messages
  - Point to FAQ or Level-Up screen
  - Use two-sentence format: "[Problem]. [Solution]."

**4. FAQ IS BURIED & PLAYERS DON'T KNOW IT EXISTS**
- **Problem:** FAQ is hidden in Settings menu (⚙️ button)
- **When:** New players don't discover it until Floor 2 tutorial mentions it
- **User Impact:** Players struggle with mechanics because they don't know to look there
- **Code Location:** Line 4922 (only mentioned after Floor 2)
- **Recommendation:**
  - Add visible link on title screen: "Need help? Check the FAQ!"
  - Or show a "Quick Tips" section in hero selection
  - Or add a "?" icon next to game title that opens FAQ
  - Make it discoverable without playing 2 floors first

**5. LAST STAND IS UNDEREXPLAINED**
- **Problem:** Mechanic appears suddenly ("Hero entered Last Stand!")
- **When:** Hero reaches 0 HP with no Ghost charges
- **User Impact:** Player doesn't understand what just happened or what they can do
- **Code Location:** Lines 1270, 6633 (Last Stand intro tutorial)
- **Current Help:** Tutorial popup if first time, but only after it happens
- **Recommendation:**
  - Show a more prominent visual indicator (highlight, flashing border, large text)
  - Make the toast notification 3+ seconds visible (currently 1200ms)
  - Add a temporary UI card explaining: "Hero in Last Stand: Can only use D20. Each turn makes it harder."
  - Consider tutorial popup BEFORE it happens (e.g., when hero gets low HP)

**6. SHIELD PERSISTENCE ISN'T OBVIOUS**
- **Problem:** Shields carry over between battles, but this is hidden
- **When:** Player notices shields are still there after a new floor
- **User Impact:** Advanced players figure this out, but new players miss a key strategy
- **Code Location:** Line 7657 (FAQ covers this)
- **Recommendation:**
  - Add visual indicator showing shield carryover (e.g., "Shield carries over!")
  - Tutorial mention: "Shield up before the next floor - your shields will persist!"
  - Or auto-show FAQ item about shields if player uses Shield sigil

---

## Medium Priority Issues

**7. GLASS-JAR PROBLEM: SHIELDS CAPPING AT MAX HP**
- **Problem:** Shields are "capped at max HP" but this is buried in tooltip text
- **When:** Player builds 50 shield on a 40 HP hero
- **User Impact:** Confusion: "Where did my shield go?"
- **Current Text:** "...persists between battles, capped at max HP" (small print in tooltip)
- **Recommendation:**
  - Add visual warning: When shield would exceed max HP, show: "Excess shield wasted (Hero at max)"
  - Tutorial: "Shields can't exceed your max HP - plan accordingly!"

**8. DEATH BOY MECHANICS UNEXPLAINED**
- **Problem:** Death Boys appear suddenly when you win with converted Ghost Boys
- **When:** First victory with Ghost sigil in party
- **User Impact:** "Wait, what are these Death Boys? How do I use them?"
- **Current Text:** Only explained in Death screen UI itself
- **Recommendation:**
  - Add to FAQ: "What are the Death Boys?"
  - Tutorial: Show explanation popup BEFORE they appear
  - Add visual guide on Death screen

**9. PEDESTAL MECHANICS UNCLEAR**
- **Problem:** "Place figurines to permanently boost stats" is vague
- **When:** Players first see the Pedestal room
- **User Impact:** "What figurines? Where do I get them? What counts as 'permanent'?"
- **Current Help:** Tutorial popup on first placement
- **Recommendation:**
  - Explain: "Figurines are rewards for heroes who survive to victory. Each hero can have up to 2 per game mode."
  - Show where figurines come from (victory rewards)
  - Add visual: Hero icons with available figurine slots

**10. NEUTRAL FLOOR CHOICES LACK GUIDANCE**
- **Problem:** Neutral encounters (Shopkeeper, Oracle, Treasure Chest) have no difficulty indicators
- **When:** Player sees 3 neutral options and must choose
- **User Impact:** "Is the Oracle risky? What's the payoff? Should I avoid the Merchant?"
- **Recommendation:**
  - Add risk labels: "Safe", "Moderate Risk", "High Risk"
  - Show reward hints: "Small XP", "Large HP Restore", "????"
  - Tutorial: "Neutral floors let you take risks for big rewards - choose wisely!"

---

## UX Friction Map (By Player Type)

### Brand New Players (First 30 minutes)
**Frustrations:**
1. Overloaded by 12+ tutorial popups in first combat
2. Don't understand what "L1" means for sigils
3. Don't know FAQ exists
4. Confused by "Expand" and "Passive" terminology
5. Last Stand appears with no warning

**Solutions Needed:**
- Batch tutorials or make them optional
- Add glossary for key terms
- Promote FAQ visibility
- Explain Last Stand before it happens

### New Players (First Run)
**Frustrations:**
1. Level-Up menu has 3 options; not clear what to pick
2. "Not unlocked" error doesn't say how to unlock
3. Death screen is overwhelming on first visit
4. Recruits mechanic introduced late
5. Unclear why Mage/Healer are stronger

**Solutions Needed:**
- Add "Recommended for beginners" callouts
- Better error messages with guidance
- Death intro is good, but could have buttons labeled with tooltips
- Recruit intro popup is good
- Suggest FAQ article #7 on class balance

### Experienced Players (Second+ Run)
**Frustrations:**
1. Can't skip tutorials quickly
2. Help tips can't be disabled per-run
3. Have to reset tutorial if they want it again
4. Settings buried in pause menu
5. No "skip animations" option for quicker play

**Solutions Needed:**
- Add "Skip tutorial?" button option
- Remember preference per run
- Provide animation speed settings
- Expose settings on title screen too

---

## Specific Code Issues Found

### 1. Tutorial Text Can Be Simplified

**Current (Lines 1366, 1379):**
```
"Oh gosh - looks like both of you took some damage. Healer can help with that - click the Healer's Heal sigil! You can pick which order your heroes take their actions."
```

**Better:**
```
"Your team is damaged! Use Healer's Heal sigil. Remember: you pick the order of actions!"
```

### 2. Error Messages Lack Guidance

**Current (Line 3477):**
```javascript
toast('Ghost not unlocked!');
```

**Better:**
```javascript
toast('Ghost sigil not purchased. Visit Level-Up screen to add it.');
```

### 3. Ambiguous UI Text

**Current (Line 5138):**
```
"Neutral floors offer choices and opportunities! You can walk straight through, or take a risk for potential rewards."
```

**Better:**
```
"Neutral floors have 3 choices. Safe encounters give small rewards. Risky encounters give big rewards or nothing. Choose wisely!"
```

---

## Recommended Improvements (By Impact)

### Quick Wins (Easy, High Impact)
1. Add "How to unlock sigils" hint to error messages (30 min)
2. Make FAQ link visible on title screen (15 min)
3. Extend Last Stand toast duration to 3 seconds (5 min)
4. Add visual indicator for shield carryover (20 min)

### Medium Effort (Medium Impact)
5. Batch Ribbleton tutorial into 6 instead of 12 popups (2 hours)
6. Add tutorial intro explaining Last Stand before it happens (1 hour)
7. Create in-game glossary for key terms (1.5 hours)
8. Improve error messages with actionable guidance (1 hour)

### Strategic Improvements (Higher Effort, Game-Changing)
9. Allow "skip tutorial" toggle per run (2 hours)
10. Redesign neutral floor UI with risk/reward indicators (3 hours)
11. Add animated intro video explaining core mechanics (4 hours)
12. Create contextual help system (hover on any UI element) (5+ hours)

---

## Conclusion

FROGGLE has excellent foundational UX with its tutorial system, tooltips, and FAQ. The main opportunities are:

1. **Streamline tutorials** - 12 popups in one combat is excessive
2. **Clarify error messages** - Every error should tell you how to fix it
3. **Improve discoverability** - FAQ and key mechanics shouldn't require playing 2 floors
4. **Support all player types** - Add skip options for experienced players, clearer guidance for new ones

The game successfully teaches mechanics through context and repetition. With these adjustments, it could reduce frustration while maintaining that teaching effectiveness.

