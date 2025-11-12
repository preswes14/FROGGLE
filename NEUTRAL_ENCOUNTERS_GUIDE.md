# FROGGLE - NEUTRAL ENCOUNTERS
From Master Rules Reference v5.0

## VI. GENERAL STRUCTURE

Neutral Encounters appear on even levels: 2, 4, 6, 8, 10, 12, 14, 16, 18
- 9 neutral encounters maximum per run
- Cannot empty neutral deck (max ~4-5 complete neutral arcs per run)

### Dynamic Neutral Deck:
- Starts with all 9 Stage 1 encounters
- When Stage 2 unlocks: Stage 1 removed from deck, Stage 2 added
- Once Stage 2 completes: Both stages removed from deck for this run
- Resets between runs: All neutrals reset to Stage 1 for new run (except permanent effects like Ancient Statue deactivation, Ghost Boys → Empty Playroom)

### Back-to-Back Prevention:
- Same neutral cannot appear on consecutive even levels
- Example: Cannot get Shopkeeper on Level 2 and Level 4
- Exception: Level 16 → Level 18 CAN be same neutral if Stage 1 unlocked Stage 2 on Level 16

### Level 18 Priority:
- Prioritize any available Stage 2s in deck
- Pick randomly from Stage 2s if multiple available
- Falls back to full deck if no Stage 2s unlocked

### UI Signals:
- "Do Not Engage" = Safe decline, no penalty possible
- "Avoid?" = Risk involved, potential negative outcome if declining

### Presentation:
- Full title and description shown before choice
- Players can freely read before engaging/declining

---

## D20 IN NEUTRAL ENCOUNTERS

### Shared Roll:
- All heroes share D20 level (upgrades together)
- One D20 roll per check (not per hero)
- If D20 L3: Roll 3d20, display all results, take highest
- Display shows "Rolling 3d20: [12] [18] [7] → Result: 18"

### Multi-Roll Neutrals:
- Treasure Chest has 2 sequential rolls (trap check, then contents)
- Each roll uses full D20 level independently
- Example: D20 L3 on Treasure Chest = 3d20 for trap check, then 3d20 for contents check

### Hero Selection for Neutral Rolls:
- Some neutrals specify "choose one hero" for narrative purposes (Oracle, Ancient Statue scaling)
- Choice matters for who takes damage/receives buffs
- D20 level still shared (doesn't matter who's chosen for roll purposes)

### Tiebreakers (when "highest/lowest HP hero" has ties):
Highest POW → Most sigils → Random

---

## THE 9 NEUTRAL ENCOUNTERS

### 1. SHOPKEEPER

**Stage 1: "Potions for Sale"**

**Engage:**
- Shop interface (not D20 roll)
- Small Potion (3G): Restore 3 HP to one hero of player's choice (limit 1)
- Large Potion (5G): Restore 8 HP to one hero of player's choice (limit 1)
- Healing caps at max HP (cannot overheal)
- Can buy both, one, or neither
- Unlock Stage 2: Buy BOTH potions in same visit
- If Stage 2 not unlocked:
  * Shopkeeper restocks on next appearance
  * Can appear again later in run (respects back-to-back rule)

**Decline:** "Do Not Engage" (Safe)

**Stage 2: "Death's Bargain"** (unlocked by buying both potions Stage 1)
- Death appears in room instead of Shopkeeper
- Offers: Choose one sigil upgrade at current Going Rate
- Special Exception: Going Rate does NOT increase after this purchase (no +5)
- Upgrade applies permanently to Sigilarium
- Must accept or decline on the spot (cannot browse and return later)
- After declining/accepting: Both Shopkeeper encounters removed from pool this run

---

### 2. WISHING WELL

**Stage 1: "The Old Wishing Well"**

**Option A: "Climb down and get coins"**
- Choose one hero to climb (player's choice)
- D20 roll (uses hero's shared D20 level):
  * 1: Highest HP hero takes 3 damage, party loses 5 Gold
  * 2-10: Highest HP hero takes 1 damage, party gains 1 Gold
  * 11-19: Party gains 3 Gold
  * 20: Party gains 2 Gold per hero + unlock Stage 2
- Tiebreaker for "highest HP hero":
  * Highest POW → Most sigils → Random
  * Must have HP > 0 (Last Stand heroes at 0 HP don't count)

**Option B: "Toss in a coin and make a wish"** (No roll)
- Cost: 1 Gold per hero
- If insufficient Gold, option disabled
- Unlocks Stage 2 automatically

**Decline:** "Do Not Engage" (Safe)

**Stage 2: "Overflowing Crystal Waters"** (unlocked by wish or nat 20 climb)
- Well overflows with crystal clear water
- Effect: Fully heal all heroes to max HP + exit Last Stand for any heroes at 0 HP (revive to max HP)
- After completing: Both Wishing Well encounters removed from pool

---

### 3. TREASURE CHEST

**Stage 1: "A Mysterious Chest"**

**Engage:** Automatic 2-roll sequence (cannot avoid once engaged)

**Roll 1 - Trap Check:**
- 1: Highest HP hero takes 3 damage (poison trap)
- 2-9: Highest HP hero takes 1 damage (dart trap)
- 10-18: Open safely
- **19-20: Find secret compartment + open safely**

**Roll 2 - Contents:**
- 1-9: Empty
- 10-19: Gain 1d10 Gold (roll internally, display result)
- 20: Gain 1d10 Gold per hero (one roll, multiply by hero count)

**If secret compartment found (19-20 on Roll 1):**
- Roll 2 = 10-20: Also gain Small Silver Key (unlocks Stage 2)
- Roll 2 = 1-9: Compartment empty (no key)

**Decline:** "Do Not Engage" (Safe, walk past chest)

**Key Persistence:** Key does NOT persist between runs (resets on death)

**Stage 2: "Small Silver Chest"** (unlocked by finding key Stage 1)
- Pedestal with small silver chest
- Use Small Silver Key (automatic)
- Gain 10 Gold per hero
- Both Treasure Chest encounters removed from pool

---

### 4. MUMBLING WIZARD

**Stage 1: "Hieroglyphs on the Wall"**

**Engage:** "Approach the wizard" (D20 roll)
- Wizard stands with arms outstretched toward wall, beckoning heroes to look.

**1-10:** "You don't see it"
- Wizard disappointed, asks you to leave
- No reward, no Stage 2 unlock

**11-20:** "You see the hieroglyph!"
- Random sigil revealed from pool: Grapple, Heal, Ghost, Alpha, Star, Asterisk
- Excludes starter sigils: Attack, Shield, D20, Expand
- Sigil displayed visually on wizard's card/wall
- Fresh random roll each Stage 1 appearance (not locked to same sigil for the run)
- If any hero has that sigil: ONE hero with it gets +1 level upgrade (temporary, this run only)
  * If multiple heroes have it, player chooses which hero gets upgrade
- If no hero has it: Wizard frustrated, returns to mumbling (no reward)
- Unlock Stage 2: If upgrade was granted

**Decline:** "Do Not Engage" (Safe)

**Stage 2: "Sacrifice for Power"** (unlocked by Stage 1 upgrade)
- Wizard channels arcane energy, offers permanent upgrade
- Same sigil as Stage 1 (the one that unlocked Stage 2)
- Cost: All heroes who have that sigil lose it for remainder of THIS RUN
- Benefit: Permanent +1 upgrade to that sigil in Sigilarium (doesn't increase Going Rate)
- Optional: Can decline and keep current run going
- After accepting/declining: Both Wizard encounters removed from pool
- Risk/Reward: Sacrifice current power for permanent growth across all future runs

---

### 5. ORACLE

**Stage 1: "Consult the Oracle"**

**Engage:**
- Oracle asks: "Power or Life?" (player chooses: POW or HP boost)
- Choose one hero to step forward (locks them for Stage 2 outcome)
- That hero's fortune is read (D20 roll):

| Roll  | Fortune Text                                    | Stage 2 Effect |
|-------|------------------------------------------------|----------------|
| 1     | "Terrible misfortune awaits you"               | CURSE: Remove chosen stat (-5 HP or -1 POW, min 1 HP for HP, 0 allowed for POW) |
| 2-9   | "What you hope for shall not come to pass"    | No Stage 2 unlock (Oracle Stage 1 stays in deck, can retry with different hero) |
| 10-15 | "Great things in your future, but not what you want" | Grant opposite stat (+5 HP if chose POW, +1 POW if chose HP) |
| 16-19 | "Your desired future shall come to pass"      | Grant chosen stat (+5 HP if chose HP, +1 POW if chose POW) |
| 20    | "It happens before my eyes!"                   | Immediate: Chosen stat NOW + same reward again in Stage 2 (double buff!) |

**Decline:** "Do Not Engage" (Safe)

**Retries:**
- If roll 2-9 (no Stage 2 unlock), Oracle Stage 1 remains in deck
- Same hero can try again on future Oracle Stage 1 appearance
- Different hero can be chosen on retry

**Stage 2: "Return to the Oracle"**
- Same hero who had fortune read returns
- Receives buff/curse based on Stage 1 roll (temporary, this run only)
- All stat changes temporary (reset on death)
- Both Oracle encounters removed from pool after completion
- Only ONE Oracle Stage 2 can resolve per run (once completed, Oracle fully removed)

---

### 6. ENEMY ENCAMPMENT

**Stage 1: "Enemies Assembling Ahead"**

**Narrative:** Heroes spy enemies from next combat encounter preparing in advance.

**Option A: "Sneak by?"** (D20 roll - note "?" for risk)
- 1-10: FAIL - Next combat Ambushed (enemies go first) + unlock Stage 2
- 11-19: Success, next combat proceeds normally
- 20: Success + find rejected straggler who joins party for next combat only
  * Straggler: Lowest enemy type from next encounter, never higher than Orc
    - Next encounter has Goblins → Goblin straggler
    - Next encounter has Wolves → Wolf straggler
    - Next encounter has Orcs or higher → Orc straggler
    - Never Giant, never Dragon
  * Functions like RECRUIT (acts on player side, can be healed/shielded, draws sigils from pool)
  * Disappears after next combat ends (does not persist beyond one combat)

**Option B: "Engage early"** (D20 roll)
- 1-15: FAIL - Scout spots you, next combat Ambushed + unlock Stage 2
- 16-19: Kill 1 enemy
  * Narrative: "You succeed at picking off an enemy. The rest aren't far behind..."
  * Battle screen loads with next encounter
  * Pop-up appears: "Kill 1 enemy" with enemy cards to choose from
  * Select enemy to remove
  * That enemy removed, XP/Gold awarded immediately (visual "+2G +4XP")
  * Combat begins with remaining enemies
- 20: Kill 2 enemies (same process, select 2 enemies to remove, award XP/Gold for both)

**No "Do Not Engage" option** (must choose sneak or engage)

**Stage 2: "Abandoned Encampment"** (unlocked by ANY failure in Stage 1)
- Enemy got cocky and left their base undefended
- Heroes enter and rest safely
- Effects:
  * Heal all heroes for 50% max HP (rounded down)
  * Gain 2 Gold per hero
- Both Encampment encounters removed from pool

---

### 7. ANCIENT STATUE (Multi-Stage Gauntlet)

**Permanent Modification:**
- If deactivation switch toggled (nat 20 on Stage 5), statue becomes gentle/smooth permanently
- Stages 1-4 still appear but deal 0 damage (players can wait safely to Stage 5)
- Persists across all runs for this save file
- Does NOT affect other save files

**Stage 1: "The statue seems to grow..."**
- Statue appears to expand as heroes stare at it.
- Option A: "Leave now" (no roll, no penalty, exit encounter safely)
- Option B: "Remain transfixed" → Proceed to Stage 2

**Stage 2: "It IS getting bigger!"**
- Statue actively growing, room shrinking.
- Option A: "Make a break for exit" (D20 roll)
  * 1-5: Escape, each hero takes 1 damage (0 if deactivated)
  * 6-19: Escape safely
  * 20: Escape + "You can't shake the feeling you missed something..." (hint at reward)
- Option B: "Remain transfixed" → Proceed to Stage 3

**Stage 3: "Statue consumes the room"**
- Statue fills most of the room. Tight squeeze to exit remains.
- Option A: "Squeeze out to exit" (D20 roll)
  * 1-9: Escape, each hero takes 2 damage (0 if deactivated)
  * 10-19: Escape safely
  * 20: Escape + notice small black arch in statue
- Option B: "Remain transfixed" → Proceed to Stage 4

**Stage 4: "Smooth metal pressing - LAST CHANCE"**
- Statue's smooth metal pressing against walls and heroes. Final chance to escape.
- Option A: "Escape" (D20 roll)
  * 1-15: Escape, each hero takes 3 damage (0 if deactivated)
  * 16-19: Escape + notice archway
  * 20: Archway swallows you → Skip directly to Stage 5 success (no roll needed)
- Option B: "Remain transfixed" → Proceed to Stage 5

**Stage 5: "Statue unfurls - replica at center"**
- Statue stops growing, unfurls like smooth metal flower. Small replica statuette sits at center. Smooth metal can be scaled.
- Choose one hero to scale (player's choice)
- D20 roll:

| Roll     | Result |
|----------|--------|
| 1        | TRAP! Hero reduced to 1 HP, no statuette |
| 2-15     | Hero takes 4 damage (0 if deactivated), gain Ancient Statuette |
| 16-19    | No damage, gain Ancient Statuette |
| 20       | No damage, gain Ancient Statuette + toggle deactivation switch |

**Deactivation Switch (nat 20 only):**
- Removes ALL damage from Ancient Statue permanently (this save file)
- Future Stage 1-4 still appear but statue moves gently/smoothly
- Players can always safely wait to Stage 5 and grab statuette risk-free
- Persists across runs for this save file

**Gaining Statuette:**
- Unlocks Pedestal encounter (separate neutral, appears later as neutral option)
- Statuette does NOT persist between runs (must slot same run it's earned)
- If die before slotting, must complete gauntlet again

**Pedestal Encounter** (unlocked by obtaining statuette in Stage 5)
- Room with pedestal displaying grid (see Permanent Stat Upgrades section)
- Insert Ancient Statuette into one empty slot
- Choose hero and stat (POW or HP)
- Permanent buff: +1 POW or +5 HP to that hero (persists after death, applies immediately)
- Statuette remains visible in slot, cannot be reused
- Can collect multiple statuettes across runs to fill grid (max 8 Standard, 8 Effed Up)
- Both Ancient Statue encounters removed from pool after slotting

---

### 8. GHOST

**Stage 1: "Two Ghostly Boys Want to Play"**
- Two ghostly boys appear, beckoning heroes to play.

**Engage: "Play with the ghost boys"**
- Trapped! Time slips away as ghost boys play. Heroes must escape through escalating DC checks.
- Escape sequence:
  * Each failed check: Lowest HP hero takes 1 damage
  * Tiebreaker: Any hero with Ghost sigil charges → Fewest sigils → Random
  * Must have HP > 0 to be targeted (Last Stand heroes at 0 HP don't take damage, stay at 0)
  * DCs: 18, 16, 14, 12, 10, 8, 6, 4, 2 (progressively easier)
  * Continue until hero succeeds OR hero enters Last Stand
  * Auto-escape after 9 failed checks

**Stage 2 Unlock (Easter Egg):**
- IF a hero enters Last Stand during Ghost 1 (reaches 0 HP from ghost damage)
- AND that hero had Ghost sigil charges active (at least 1 charge)
- THEN:
  * Ghost charge is consumed
  * Hero survives at 0 HP (Last Stand)
  * Ghost boys say "Oops!" and encounter ends immediately
  * Stage 2 unlocks

**"Avoid?"** (Safe escape - correct choice, note "?" for risk signal)

**Stage 2: "The Boys Realize the Truth"**
- Ghost boys shocked to see hero alive (consumed Ghost charge).
- Boys realize they themselves are ghosts
- Accept their death and depart to afterlife peacefully
- No immediate reward

**Ghost Boys → Empty Playroom:**
- Encounter permanently becomes free pass-through neutral (no choices, just proceed to next level)
- Persists for this save file across all future runs

**Death Boys unlocked at Death Screen permanently**
- Appears at every Death Screen from now on (this save file)
- See Economy section for Death Boys mechanics

---

### 9. FLUMMOXED PRINCE(SS)

**Stage 1: "Help Recover the Ring"**
- Flummoxed royal (Prince or Princess, alternates on failures) paces anxiously.

**Engage: "Listen to the plea"**
- Royal explains: Creature in next room ate engagement ring
- Quest: Stun any enemy on Turn 1 of next combat
- Valid Methods:
  * Grapple action
  * D20 Startle (DC 17)
  * Any other stun effect that works Turn 1

**Success** (stunned enemy Turn 1):
- Royal rushes in during combat, retrieves ring from stunned enemy's stomach
- Thanks party profusely, runs ahead
- Unlocks Stage 2

**Failure** (no stun Turn 1):
- Royal tries to get ring themselves
- Gets eaten by enemy (narrative only, no mechanical effect on enemy)
- Next Stage 1 appearance: Gender-swapped royal appears with same quest
  * Prince fails → Princess appears next time
  * Princess fails → Prince appears next time
  * Cycles indefinitely until success

**"Do Not Engage"** (Ignore the plea)

**Stage 2: "The Wedding"**
- Royal proposes to beloved. Wedding ceremony in progress.
- Gender of proposer randomly chosen (Prince or Princess)
- Gender of beloved is opposite
- If original royal died and was replaced, gender alternates based on who succeeded
- Each royal wears wedding garment displaying a sigil
- Sigils shown: The two sigils that would cost the LEAST to upgrade at Death Screen
  * Prioritizes Black (L0) passives first
  * Then White (L1) actives
  * If tied, random selection from tied options
  * Prices NOT displayed to player (internal calculation only)

**Reward:**
- Choose one of the two displayed sigils
- That sigil upgrades +1 level:
  * Temporary this run (immediate effect)
  * Permanent in Sigilarium (survives death)
- Both Flummoxed Prince(ss) encounters removed from pool

---

**END OF NEUTRAL ENCOUNTERS GUIDE**
