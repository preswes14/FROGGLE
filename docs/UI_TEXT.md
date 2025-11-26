# FROGGLE - UI Text

*Functional text that's less about voice but you might still want to tweak.*

---

## BUTTON LABELS

### Main Menu
- PLAY
- New Game
- Continue
- Back

### Combat Actions
- Attack
- Shield
- Heal
- Grapple
- D20
- Alpha
- Ghost
- Expand
- Star
- Asterisk

### Common Buttons
-Delve (for entering dungeon)
- Continue
- Do Not Engage
- Walk away
- Leave
- Back to Title
- Return to Ribbleton

---

## COMBAT HEADERS

- Enemy Turn...
- Choose Hero to Act
- [X] heroes remaining
- [Hero]'s Turn
- [Hero] Last Stand (Turn X) - D20 only!
- Select target
- targets: X/Y

---

## TOAST MESSAGES

### Combat
- [Hero] dealt X damage to [Enemy]!
- [Hero] restored X HP!
- [Hero] gained X shield!
- [Hero]'s Ghost charge cancelled the lethal hit!
- [Hero] entered Last Stand!
- [Hero] stunned [Enemy] for X turns!
- [Enemy] defeated!
- Next combat will be AMBUSHED!

### Resources
- Gained X Gold!
- Lost X Gold!
- Not enough Gold!

### Sigils
- [Sigil] upgraded to LX!
- [Sigil] temporarily upgraded to LX for [Hero]!

### General
- Tutorial skipped!
- Returning to Ribbleton...
- Save exported!
- Save imported successfully!
- No saved game found!
- Error: Invalid save file!

---

## HERO STATS DISPLAY

- [X] POW
- [X]/[Y] HP
- [X] Shield
- [X] Ghost
- Last Stand (TX)

---

## SIGIL DESCRIPTIONS

**Attack:** Deal POW damage to target. L2: Attack twice. L3: Attack 3 times. L4: Attack 4 times. Stacks with Asterisk.

**Shield:** Grant target 2xPOW shield. L2: 4xPOW. L3: 6xPOW. L4: 8xPOW. Shield persists between battles (capped at hero max HP).

**Heal:** Restore 2xPOW HP to target. L2: 4xPOW. L3: 6xPOW. L4: 8xPOW. Cannot exceed max HP.

**D20:** Roll 1d20 per level, take highest. Need 10+ to succeed. L1: 55%, L2: 80%, L3: 91%, L4: 96%. Effects: Confuse (deal enemy POW to all), Startle (stun), Mend (heal self), Steal (gold), Recruit (join team).

**Expand:** PASSIVE: Permanently add +1 target per level to Attack/Shield/Heal. Works automatically. Mage/Healer get +1 Expand built-in.

**Grapple:** Stun target for (Level) turns. You take damage equal to target's POW.

**Ghost:** Cancel the next lethal hit. Each charge prevents one death. Charges shown on card (max 9 charges). Ghost charges PERSIST between combats.

**Asterisk:** PASSIVE: Next action triggers +(Level+1) times! Resets after each battle. Works with any action type.

**Star:** PASSIVE: Multiply combat XP by (1 + Level x 0.5). Works automatically. Stacks across heroes. L4 = 3x XP!

**Alpha:** Grant target hero an extra action this turn. Higher levels grant more actions.

---

## HERO DESCRIPTIONS (Selection Screen)

**Warrior:** A strong fighter with heavy attacks
- Passive bonus: +1 POW
- Starts with Attack and D20

**Tank:** A sturdy defender with high HP
- Passive bonus: +5 HP
- Starts with Shield and D20

**Mage:** A versatile caster who can hit multiple targets
- Passive bonus: Gets +1 Expand innately (+1 target)
- Starts with Attack, D20, and Expand

**Healer:** A support hero who can heal multiple allies
- Passive bonus: Gets +1 Expand innately (+1 target)
- Starts with Heal, D20, and Expand

**Tapo:** The ultimate glass cannon - all sigils, minimal health!
- Starts with ALL 10 sigils
- Only 1 HP - high risk, high reward!

---

## DEATH SCREEN LABELS

- Gold: [X]
- Going Rate: [X]G
- Upgrade Sigilarium
- Core Sigils
- Advanced Sigils
- Passive Sigils
- Cost: [X]G
- Purchase
- Too Expensive
- Already at maximum level!
- Return to Ribbleton

---

## SAVE SLOT SCREEN

- Select Save Slot
- Slot 1 / Slot 2
- Empty Slot
- Runs Attempted: [X]
- Going Rate: [X]G
- Active Run In Progress
- Continue
- New Run
- New Game
- Delete Save Slot X? This cannot be undone!

---

## CHAMPIONS / PEDESTAL

- The Flydra's Conquerors
- Current Mode: Standard / FROGGED UP
- Click the pedestal to manage figurines (X/8)
- Click a portal to switch game modes
- You are already in this realm!
- Pedestal of Champions
- [Mode] Mode - Place figurines for permanent stat buffs
- Slot already filled!
- All 8 slots filled! Remove a figurine first.
- [Hero] already has 2 figurines in [Mode] mode!
- [Hero] [Stat] figurine placed!
- [Hero] [Stat] figurine removed!

---

## LEVEL UP SCREEN

- LEVEL UP!
- Choose an upgrade for [Hero]
- Current XP: [X]
- XP Cost: [X]

---

## D20 GAMBIT OPTIONS

- Confuse (DC 10) - Deal enemy POW to all enemies
- Startle (DC 12) - Stun target for 1 turn
- Mend (DC 15) - Heal self for 2xPOW
- Steal (DC 18) - Steal gold from target
- Recruit (DC 20) - Target joins your team!

---

## ANIMATION SPEED LABELS

- Normal
- 2x
- 4x
- Instant

---

## SETTINGS MENU LABELS

- Settings
- Sound Effects
- Music (not implemented)
- Animation Speed
- Help Tips
- Debug Mode
- Reset All Progress

---

## ERROR MESSAGES

- Not enough Gold!
- No saved game found!
- Failed to load slot
- Failed to delete slot
- Error: Invalid save file!

---

## MISC UI

- Floor [X]
- Round [X]
- XP: [X]
- Gold: [X]G
- HP: [X]/[Y]
- POW: [X]
- SELECTED
- TARGETED
- STUNNED
- AMBUSH!
