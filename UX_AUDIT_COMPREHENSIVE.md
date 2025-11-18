# FROGGLE Game UX Audit - Comprehensive Report

## Executive Summary
FROGGLE is a single-file HTML5 PWA game with a robust tutorial system, extensive in-game help, and well-designed UI flows. The game has multiple layers of user guidance, from modal pop-ups to tooltips to an FAQ system. This audit identifies both strengths and potential friction points.

---

## 1. MAIN GAME FILE STRUCTURE

**Primary File:**
- `/home/user/FROGGLE/index.html` (~293KB, single-file architecture)
  - Contains all HTML, CSS, and JavaScript
  - Vanilla JavaScript (no frameworks)
  - localStorage for browser-only saves
  - PWA-enabled with manifest.json

**Key Layout Sections:**
- `#gameHeader` - Top bar with floor, round, gold, XP displays
- `#gameView` - Main content area (renders different screens)
- `.toast-log` - Bottom-right notification queue
- `.tutorial-modal-backdrop` - Modal overlays for tutorials
- `.tooltip` - Hover tooltips for sigils (green highlight)

---

## 2. TUTORIAL & ONBOARDING SYSTEM

### Tutorial Flow Stages:

**Phase 1: "Tapo's Birthday" (Floor 0 - Tutorial Combat)**
- Narrative overlay explaining the setup
- Guided combat with Mage vs flies
- Tutorial popup: "Click Mage's Attack sigil to catch a fly!"

**Phase 2: Ribbleton Combat Tutorial (Floor 1)**
Shows up as a series of tutorial pops as the player progresses:
1. **"warrior_attack"** - "Welcome to combat! Attack an enemy - click the Warrior's Attack sigil."
2. **"targeting"** - "You can choose which enemy to target! Click on the Wolf to select it..."
3. **"healer_d20"** - "Nice hit! Doesn't look like the Healer has any damage to heal right now..."
4. **"d20_menu"** - "Heroes start with different Active abilities, but they all can try to turn the tides..."
5. **"expand_explain"** - "Healer starts with the Expand passive sigil..."
6. **"healer_heal"** - "Oh gosh - looks like both of you took some damage..."
7. **"enemy_turn"** - "Uh oh! Enemies attack every turn, and they attack straight across from them!"
8. **"enemies_get_sigils"** - "Enemies can draw sigils too! Each enemy type has their own unique sigil pool..."
9. **"shield_sigil"** - "The Goblin has drawn a Shield sigil! Enemies activate their sigils AFTER they attack..."
10. **"expand"** - "Helpful - Healer starts with the Expand passive! That means they can target 1 extra ally..."
11. **"tooltip_intro"** - "Hover over (or long-press on mobile) any sigil icon to see detailed information..."
12. **"handoff"** - "You're on your own now - good luck!"

**Phase 3: Level-Up Tutorials (After Floor 1)**
- **"levelup_intro"** - Explains you got enough XP for your first level-up
- **"levelup_stat_upgrade"** - "+1 POW or +5 HP"
- **"levelup_upgrade_active"** - Explains how sigil levels work (e.g., Attack L2 = attack twice)
- **"levelup_add_active"** - Explains learning new sigils
- **"levelup_upgrade_passive"** - Explains Expand/Asterisk/Star are passive

**Phase 4: Neutral Floor Tutorial (Floor 2)**
- **"neutral_intro"** - "Neutral floors offer choices and opportunities..."
- **"neutral_d20_level"** - "These D20 checks use the same Level as your D20 sigil..."
- **"faq_intro"** - Shown after Floor 2 complete: "You're (mostly) on your own from here - good luck! If you have questions about game mechanics, check out the FAQ in the settings menu (⚙️ button)!"

**Phase 5: Death Screen (First Death)**
- **"death_intro"** - Narrative dialogue with Death character
- **"death_exit_warning"** - "Are you sure? This is some great value..."

**Phase 6: Victory Screens**
- **"first_victory_sequence"** - Plays cutscene on first Standard mode win
- **"first_fu_victory"** - Plays credits on first Effed mode win
- **"tapo_victory_message"** - Special message if Tapo is alive at victory

**Other Tutorials:**
- **"last_stand_intro"** - "When a hero drops to 0 HP, they enter Last Stand!..."
- **"recruit_intro"** - "Recruited enemies will stand behind the hero..."
- **"ribbon_handoff"** - End of combat tutorial
- **"pedestal_first_placement"** - "Welcome to the Pedestal! Place figurines here..."

### Tutorial System Features:
- **Modal System:** `.tutorial-modal-backdrop` with centered `.tutorial-modal`
- **Visual Design:** Gold border (#fbbf24), cream background, green button (#22c55e)
- **Flags:** `S.tutorialFlags` object tracks which tutorials have been shown
- **Toggleable:** Settings menu has "Reset Tutorial" and "💡 Show Help/Tips" toggle
- **Smart Display:** Checks `S.helpTipsDisabled` and `S.tutorialFlags[flagName]` before showing
- **Progress Tracking:** Some tutorials trigger stage changes in `tutorialState` object

---

## 3. USER-FACING TEXT & MESSAGES

### Toast Notifications (Bottom-right queue)
**Success Messages:**
```
"Victory!"
"Level Up!"
"Slot loaded!"
"Save exported!"
"Game Saved!"
"Loaded!"
"{Hero} gained X Ghost charge(s)!"
"Alpha: Grant X action(s) to Y hero(es)!"
"{attackName} SUCCESS! {hero} healed for X HP!"
```

**Action Confirmations:**
```
"{X} target(s) wasted!"
"Already targeted!"
"Already acted!"
"{hero} is stunned!"
"{hero} in Last Stand - D20 only!"
"Follow the tutorial instructions!"
"Cannot Alpha yourself!"
"Already targeted in this instance!"
```

**Error/Warning Messages:**
```
"Maximum 2 heroes!"
"Wait for enemy turn!"
"Not enough XP!"
"Ghost not unlocked!"
"Grapple not unlocked!"
"Alpha not unlocked!"
"{sigil} not unlocked!"
"Cannot exceed max HP"
"Too Expensive"
"Not enough XP!"
"Warning: Progress could not be saved"
"Warning: Game could not be saved"
"Error loading saved game..."
"Invalid save file!"
"Failed to load slot"
"Failed to delete slot"
"No saved game found!"
"No save data to export!"
"Already selected X enem(ies)!"
```

**Game State Messages:**
```
"Grapple would be lethal! Choose fewer/weaker targets or cancel."
"Must complete remaining instances!"
"AMBUSHED! All heroes stunned Turn 1!"
"{enemy}'s {attack} hit {targets} for X damage each!"
"{target}'s Ghost charge cancelled the lethal hit!"
"{target} entered Last Stand!"
"Goblin drew Shield L1!"
"Follow the tutorial instructions!"
```

**Notification Duration:** Typically 1200-2500ms visible

---

## 4. MENU SYSTEMS

### Main Title Screen
- Green mat container with FROGGLE branding
- "🐸 PLAY 🐸" button
- Save slot selection

### Hero Selection Screen (Title)
- Character portraits (Warrior, Tank, Mage, Healer, Tapo, Old Tapo)
- "Selected Heroes:" display showing current selection
- **Maximum 2 heroes** enforced with toast notification
- Color-coded hero cards with hover effects

### Settings Menu (⚙️ Button)
**Location:** Top-right of game header

**In-Game Options:**
- 💾 Save Game
- 🔄 Restart Level
- 🔄 Reset Tutorial

**Help Section:**
- ❓ Frequently Asked Questions

**Display Options:**
- Show Toast Log (checkbox)
- 💡 Show Help/Tips (toggle)
- 🔍 Show Sigil Tooltips (toggle)

**Debug Section (if enabled):**
- 🛠️ Enable Debug Mode (checkbox)
- 🛠️ Open Debug Tools (button)

**Visual Design:** Fixed modal at z-index 30000, dark background with blue border

---

## 5. SIGIL TOOLTIPS & DESCRIPTIONS

### Tooltip System
- **Trigger:** Hover (desktop) or long-press 500ms (mobile)
- **Display:** Fixed green box (`.tooltip.tooltip-green`)
- **Location:** Positioned to stay on-screen, below element when possible
- **Content:** Title + description with level-specific scaling

### Sigil Descriptions (Dynamic by Level):

**Attack**
- L1: "Deal POW damage to target"
- L2+: "Attack X times for POW damage each"
- Note: "Stacks with Asterisk"

**Shield**
- L1: "Grant target 2×POW shield (persists between battles, capped at max HP)"
- L2+: "Shield X times for 2×POW each"

**Heal**
- L1: "Restore 2×POW HP to target (cannot exceed max HP)"
- L2+: "Heal X times for 2×POW each (cannot exceed max HP)"

**D20**
- "Roll Xd20, use best result. Choose gambit: Confuse (damage), Startle (stun), Mend (heal self), Steal (gold), Recruit (join team)"

**Expand**
- L0: "PASSIVE: Add +1 target to Attack/Shield/Heal. Works automatically. Mage/Healer get +1 built-in"
- L1+: "PASSIVE: Permanently add X extra target(s) to Attack/Shield/Heal. Works automatically."

**Grapple**
- "Stun target for X turn(s). You take damage equal to target's POW"

**Ghost**
- "Gain X charge(s). Each charge prevents one death this combat (max 9)"

**Asterisk**
- "PASSIVE: Your first action each combat automatically triggers X+1 times. Works with any action type"

**Star**
- "PASSIVE: Gain X×0.5 extra XP per battle (stacks with other heroes)"

**Alpha**
- "Grant target hero X extra action(s) this turn"

### Tooltip Availability
- Togglable in settings: "🔍 Show Sigil Tooltips"
- Mobile-friendly: Long-press instead of hover
- Death screen: Longer hover delay (750ms for readability)

---

## 6. GAME MECHANICS EXPLANATIONS

### Combat Tutorial Explanations
Woven into the Ribbleton tutorial:
- How targeting works
- Multi-target actions with Expand
- D20 gambits and their effects
- How enemies attack and gain sigils
- Last Stand mechanics
- Recruit mechanics

### Level-Up Menu Explanations
Each upgrade type has an intro popup:
- **Stat upgrades:** "+1 POW or +5 HP to a hero of your choice"
- **Active sigil upgrades:** Shows how level progression works (L2 = attack twice, etc.)
- **Adding new sigils:** "Learning new active sigils gives you more choices"
- **Passive sigils:** "Expand, Asterisk, and Star are PASSIVE sigils - they're always active"

### Neutral Floor Mechanics
Tutorial intro popup explains:
- "Neutral floors offer choices and opportunities! You can walk straight through, or take a risk for potential rewards."

### Encounters
**Merchant/Shopkeeper:**
- Offers potions and upgrades with gold cost
- Two stages (Small potion → Large potion → Shopkeeper 2)

**Oracle:**
- "A figure looks into your future with a crystal ball"
- Offers +1 POW or +5 HP with D20 roll (DC 14)
- Shows success/failure outcomes

**Pedestal/Statue Room:**
- Displays hero figurines that permanently boost stats
- Intro: "Welcome to the Pedestal! Place figurines here to permanently boost your heroes' stats..."
- Max 2 figurines per hero per game mode

**Death Screen:**
- Intro dialogue with Death character
- Offers permanent sigil upgrades with escalating gold cost
- "Going Rate" displays prominently with flashing animation
- Death Boys (if Ghost Boys converted) offer:
  - **Sell Back:** Remove 1 upgrade level, get Going Rate gold
  - **Sacrifice:** "Give me 1 XP per Going Rate to get bonus XP for next run"

---

## 7. VISUAL FEEDBACK & USER INTERACTION

### Combat Board Layout
- **Lanes:** Horizontal combat lanes (one per hero)
- **Each lane contains:**
  - Hero card (HP/POW display)
  - Sigil action buttons
  - Enemy cards in same lane
  - Recruited allies (stand behind hero)
  - Visual indicators for stun/Last Stand status

### Hero Card Display
- **Hero name and portrait**
- **HP bar** (current/max)
- **POW stat** displayed
- **Sigil array** with icons and levels
- **Last Stand indicator** (if applicable)
- **Stun indicator** (if stunned)

### Enemy Card Display
- **Enemy name**
- **HP bar**
- **POW value**
- **Current sigils** with animations
- **Animation feedback** for attacks and abilities

### Action Selection UI
- **Sigil buttons:** Hover to show tooltip
- **Target selection:** Click on enemies/heroes
- **Targeting feedback:**
  - "Select X target(s)" message
  - Visual highlighting of selected targets
  - Wasted slot warnings

### Round/Turn Information
- **Round counter:** Top-left (e.g., "Round 3")
- **Turn phase:** Displayed (Player/Enemy)
- **Gold counter:** Top-center (💰 value)
- **XP counter:** Shows current XP + (combat bonus) in parentheses

### Status Effects Visual
- **Stun:** Hero/enemy marked with stun indicator
- **Last Stand:** Hero marked as "in Last Stand"
- **Shield persistence:** Shields show across floors
- **Ghost charges:** Shown in hero info
- **Shield count:** Displayed next to hero HP

### Toast Log
- **Location:** Bottom-right corner
- **Toggleable:** Settings → "Show Toast Log"
- **Content:** Chronological list of all game events
- **Visual:** `.toast-log` with `.minimized` state for compact view
- **Examples of logged events:**
  - Attack results
  - Damage taken
  - Sigil draws
  - Level-ups
  - Recruitment

---

## 8. FAQ SYSTEM

### Access
- **Location:** Settings menu → "❓ Frequently Asked Questions"
- **Trigger:** After first neutral encounter (Floor 2), tutorial suggests checking it
- **Visual:** Modal overlay with expandable Q&A items

### FAQ Topics Covered
1. "Why does Attack show as L1 when I haven't upgraded it?" - Explains display vs storage levels
2. "What happens if I run out of enemies before using all my Expand targets?" - Explains wasted targets
3. "How does Last Stand work?" - Explains mechanics and DC penalties
4. "How many recruits can I have?" - Explains recruit limits and persistence
5. "Do shields carry over between battles?" - Confirms shields persist, suggests shield farming
6. "What's the difference between XP upgrades and Gold upgrades?" - Explains temporary vs permanent
7. "Why is Mage/Healer better than Warrior/Tank?" - Explains built-in Expand advantage
8. "What are Star and Asterisk sigils?" - Explains passive XP multiplier and first-action repetition
9. "How does enemy difficulty scale?" - Lists enemy progression by floor
10. "What's the best strategy for surviving Dragon floors?" - Provides combat tips

### UI Design
- **Accordion:** Questions are expandable/collapsible with arrow animation
- **Color scheme:** Light blue background, purple header, black borders
- **Typography:** Clear hierarchy with bold question titles
- **Code examples:** Formatted as HTML with `<strong>` tags for emphasis

---

## 9. GAME STATE & PERSISTENCE

### Settings Saves
- **Help Tips Toggle:** `S.helpTipsDisabled`
- **Tooltips Toggle:** `S.tooltipsDisabled`
- **Tutorial Flags:** `S.tutorialFlags` (object with 20+ flag keys)
- **Debug Mode:** `S.debugMode`
- **Toast Log Visibility:** `S.toastLogVisible`

### Persistent Data (Permanent Storage)
- **Gold:** Carries over between runs (except after victory)
- **Sigil Upgrades:** Permanent progression system
- **Going Rate:** Escalates with each purchase
- **Pedestal Figurines:** Permanent hero stat boosts
- **Game Mode:** Standard vs Effed (unlocked after first victory)
- **Tapo Unlock:** After Floor 20 victory (Old Tapo encounter)
- **Death Boy Conversions:** Ghost Boys converted to Death Boys

### Run-Specific Data
- **Temporary Sigil Upgrades:** Reset after death
- **Current Party:** Reset after death
- **Combat XP:** Carried between battles within a run
- **Recruits:** Persist until killed
- **Shields:** Persist between battles (but not after death)

---

## 10. MOBILE CONSIDERATIONS

### Touch Support
- **Tooltips:** Long-press 500ms instead of hover
- **Mobile first:** CSS includes mobile breakpoints
- **Touch feedback:** Toast notifications for action confirmation
- **Responsive layout:** Scales to different screen sizes

### Mobile-Specific UX
- **Tap targets:** All buttons sized for touch
- **No hover states required:** Tooltips work with long-press
- **Landscape mode:** Combat board optimized for wider screens
- **Full-screen capable:** PWA can be installed

---

## SUMMARY: STRENGTHS & FRICTION POINTS

### Strengths
✓ **Comprehensive tutorial system** - Multiple layers of guidance for different mechanics
✓ **In-context help** - Tooltips appear right where needed
✓ **Extensive FAQ** - Covers 10 major questions about game mechanics
✓ **Toggleable help** - Players can disable tutorials/tips if desired
✓ **Clear visual hierarchy** - Important info stands out (color, size, animation)
✓ **Notification feedback** - Toast system keeps players informed
✓ **Mobile-friendly** - Touch support and responsive design
✓ **Persistent settings** - Player preferences are saved

### Potential Friction Points
1. **Tutorial density** - Ribbleton combat has 12+ popups; may feel overwhelming
2. **Text length** - Some tutorial messages are 2-3 sentences; could be more concise
3. **FAQ access** - Buried in settings; players may miss it early
4. **Tooltip delay** - 500ms delay on mobile might feel slow
5. **Error messages** - Some are cryptic (e.g., "Not unlocked!")
6. **Level display confusion** - Active sigils show L1 when storage is L0; can confuse new players
7. **No glossary** - Key terms (Sigil, Passive, Expand, etc.) not defined upfront
8. **No loading states** - Unclear if game is saving/loading on slow connections
9. **Toast log visibility** - Hidden by default; new players may not discover it
10. **Death intro mandatory** - Can't skip Death dialogue on first death

