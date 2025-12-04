# FROGGLE - Complete Narrative Script

*All story/dialogue content for easy mobile editing. Edit freely, then paste back for implementation!*

---

## DEATH QUOTES (Rotating)

These appear randomly when you die, cycling without repeats:

1. Some days you're the sticky tongue, some days you're the fly.
2. You must really like pain. Or do you like death? Weirdo.
3. Next time bring me a smoothie or something
4. Hey, have you met those ghost boys in the dungeon? I can't get them to make.. you know.. the transition. Help them out, would you?
5. Death death lemonade, 'round the coroner I parade
6. Ribbit? Ribbbbbit? Rib bit?
7. Oh man, a classic green. You just know he's a jumper.
8. Hello my baby, hello my honey.
9. If you refuse me, honey you'll lose me
10. You guys should check out the Discovery Channel to see what normal frogs do
11. Toadally froggin died, huh?

---

## ACT 1: INTRO (New Player Tutorial)

### [SLIDE 1: Welcome to Ribbleton]
In the beautiful, tranquil town of **Ribbleton**, today is a very special day!!

Why?

### [SLIDE 2: Tapo's First Birthday]
The village's youngest tadpole, **Tapo**, turns one today!

### [SLIDE 3: A Special Gift]
**Mage** promised to teach Tapo how to catch flies as a birthday gift! Together they head to the village square to find some.

### [FLY CATCHING OVERLAY]
Two **flies** are buzzing around!

Help Mage catch them for Tapo's birthday!

### [AFTER CATCHING FLIES]
Mage and Tapo catch all the flies! Tapo squeals with delight as they share the tasty treats together.

---

## ACT 2: PORTAL INVASION

### [SLIDE: DANGER!]
Suddenly, **a dark portal** tears open in the square! Tank, Warrior, and Healer rush to defend Tapo and Mage!

### [COMBAT OVERLAY]
A Goblin and a Wolf appear from the portal!

Tank and Mage stand guard around Tapo while Warrior and Healer charge toward the portal!

---

## ACT 3: TAPO MISSING

### [SLIDE 1]
The few enemies remaining around Ribbleton scamper back into the portal. Relieved, the frog heroes sheathe their weapons and look for Tapo - but he's missing!!

### [SLIDE 2]
As the Ribbletonians search high and low, the heroes realize there's only one possibility - the poor tadpole has squiggled his way through the portal!

### [SLIDE 3]
The townspeople gather around the heroes. "You must bring him home!" they plead. The heroes nod solemnly - Ribbleton will be their sanctuary, and they'll return here between each rescue attempt.

### [TITLE CARD]
**FROGGLE**

*A Froggy Roguelike*

---

## FLOOR NAMES (Combat Interstitials)

| Floor | Name |
|-------|------|
| 1 | Goblin Horde |
| 3 | Wolf Pack |
| 5 | Orc Wall |
| 7 | Giant's Descent |
| 9 | Troll Lair |
| 11 | Goblin Army |
| 13 | Wolf Swarm |
| 15 | Dragon's Nest |
| 17 | Chaos Legion |
| 19 | Lair of the Flydra |

---

## RIBBLETON HUB

### [First Visit]
Welcome home to Ribbleton! This is your safe haven between adventures. Click the glowing red portal whenever you're ready to begin your next rescue mission!

### [Portal Descriptions]
- **Red Portal:** Venture forth on a rescue mission!
- **Blue Portal:** Visit the Champions Hall (Floor 20)
- **Blue Portal Locked:** A mysterious blue portal appears to be locked... Perhaps reaching Floor 20 will unlock it?

---

## THE POND

### [Header]
The Pond

A quiet place to reflect on adventures past...

### [Empty State]
The water is still... Your lily pads will appear here after your first adventure.

### [Legend]
- Green = Journey
- Gold = Victory
- Rainbow = Frogged Up Win
- (bigger = higher floor)

---

## NEUTRAL ENCOUNTERS

### POTIONS SHOPKEEPER (Stage 1)

**Title:** Potions for Sale

**Description:** A hooded figure stands behind a small cart laden with vials and bottles. Their voice is raspy and businesslike: "Potions. Gold. Fair prices."

### DEATH'S BARGAIN (Shopkeeper Stage 2)

**Title:** Death's Bargain

**Description:** The shopkeeper pulls back their hood, revealing a skull grinning beneath. "I am Death's... associate. You've impressed me. Choose wisely."

**On all maxed:** All your sigils are already at maximum power. Death nods approvingly and fades away.

**On no gold:** "Nothing? Really? Come back when you have something to offer."

**On purchase:** "Good choice. See you soon." The shadows recede. The chamber returns to normal.

**On decline:** "Shame. You don't get a chance like this every day. Oh well, it's your funeral." The shadows recede.

---

### WISHING WELL (Stage 1)

**Title:** The Old Wishing Well

**Description:** An ancient stone well sits in the center of the chamber. You hear the faint sound of trickling water far below. A glint of gold catches your eye at the bottom.

**Climb Outcomes:**
- **Nat 1:** You slip on the wet stones and plummet! The landing is brutal.
- **2-10:** You climb carefully but scrape yourself on the rough stones. You manage to grab a single coin.
- **11-19:** Your climbing skills are impressive! You retrieve a small pouch of coins.
- **Nat 20:** Your descent is flawless! At the bottom, you discover a hidden cache of coins AND the well begins to overflow with crystal-clear water!

**Wish Outcome:** You toss gold coins into the well and make a silent wish. The water begins to glow softly, then surges upward, overflowing the well's edge!

### WISHING WELL (Stage 2)

**Title:** Overflowing Crystal Waters

**Description:** The well now overflows with sparkling, crystal-clear water that pools around its base. The water seems to pulse with restorative energy.

**Drink Outcome:** The water tastes impossibly pure and refreshing. Warmth spreads through your body as all wounds close and exhaustion fades. You feel completely restored. The well's glow fades as the water recedes to its normal level. Its magic has been spent.

---

### TREASURE CHEST (Stage 1)

**Title:** A Mysterious Chest

**Description:** An ornate wooden chest sits against the far wall, its brass fittings gleaming in the torchlight. No lock is visible, but you sense this may not be as simple as it appears.

**Trap Outcomes:**
- **Nat 1:** A poison dart flies out and strikes you!
- **2-9:** A small dart grazes your arm.
- **10-18:** You carefully open the chest without triggering any traps.
- **19-20:** Your keen eyes spot a hidden compartment in the chest's lid!

**Content Outcomes:**
- **1-9:** The chest is empty. Someone got here first.
- **10-19:** The chest contains [X] gold coins!
- **Nat 20:** The chest is filled with [X] gold coins!

**Secret Found:** Inside the secret compartment, you find a small silver key!

### TREASURE CHEST (Stage 2)

**Title:** Small Silver Chest

**Description:** A small silver chest sits on a stone pedestal, perfectly sized for the key you found earlier. You insert the key and it opens with a satisfying click.

**Outcome:** Inside you find [X] gold coins, perfectly arranged!

---

### WIZARD - THE HIEROGLYPHIC READER (Stage 1)

**Title:** Hieroglyphs on the Wall

**Description:** An elderly wizard stands with arms outstretched toward a wall covered in glowing hieroglyphs. He mutters continuously: "Do you see it? Do you see it? Look closely..."

**Failure (1-10):** [Hero] stares at the glowing symbols but can't make sense of them. The wizard sighs heavily: "You don't see it. How unfortunate. Please leave."

**Success but no sigil:** The hieroglyph reveals itself as the symbol for [SIGIL]! The wizard beams with pride. But [Hero] doesn't possess this sigil. The wizard's face falls: "You don't have it? Useless! Get out!"

**Success:** The hieroglyph reveals itself as the symbol for [SIGIL]! [Hero] feels power surge through them. [SIGIL] temporarily upgraded! "Yes! YES! You understand!" The wizard's eyes gleam. "But... there is more I can offer you, if you dare..."

### WIZARD - TRIALS OF POWER (Stage 2)

**Title:** Trials of Power

**Description:** The wizard's eyes gleam with arcane power: "You have potential... but can you prove it? I offer you a series of trials. Each success earns you greater strength. But you must attempt them all - there is no turning back!"

**On Failure:** "[Hero] could not meet the challenge!" [Hero] earned [X] temporary upgrades before failing! "You have reached your limit. Take what you have earned and go."

**On Complete:** "[Hero] has completed all trials!" "Impressive! You have proven yourself worthy. Now go forth with your newfound power!"

**On Decline:** The wizard's glow fades. "Coward! You lack the will to seize greatness!" He returns to mumbling at the wall.

---

### ORACLE - FORTUNE READER (Stage 1)

**Title:** Consult the Oracle

**Description:** A figure shrouded in mist sits cross-legged before a crystal sphere. Their voice echoes: "Step forward. I will read your fortune. Power or Life?"

**Fortune Outcomes:**
- **Nat 1:** "Terrible misfortune awaits you."
- **2-9:** "What you hope for shall not come to pass."
- **10-15:** "Great things in your future, but not what you want."
- **16-19:** "Your desired future shall come to pass."
- **Nat 20:** "It happens before my eyes!"

### ORACLE (Stage 2)

**Title:** Return to the Oracle

**Description:** [Hero] returns to the Oracle. The crystal sphere flares brightly!

**Curse (Nat 1):** [Hero] feels weaker. [stat] reduced!

**Opposite (10-15):** [Hero] gains unexpected [opposite stat]!

**Desired (16-19):** [Hero] feels strengthened! [stat] increased!

**Immediate Double (Nat 20):** [Hero] surges with [stat]!

---

### ENEMY ENCAMPMENT (Stage 1)

**Title:** Enemies Assembling Ahead

**Description:** Through a crack in the wall ahead, you spy the enemies from your next encounter preparing for battle. They haven't noticed you yet.

**Sneak Outcomes:**
- **1-10:** [Hero]'s foot catches on loose stone! The enemies hear you and prepare an ambush!
- **11-19:** [Hero] slips past quietly. The enemies remain unaware.
- **Nat 20:** [Hero] sneaks past perfectly AND discovers a rejected [Enemy] who joins [Hero]'s ranks!

**Engage Outcomes:**
- **1-15:** A scout spots [Hero] before they can strike! The enemies prepare an ambush!
- **16-19:** [Hero] succeeds at picking off 1 enemy! They're scrambling to form ranks...
- **Nat 20:** [Hero] succeeds at picking off 2 enemies!

### ENCAMPMENT (Stage 2)

**Title:** Abandoned Encampment

**Description:** The enemy got cocky and left their base undefended. You enter and rest safely.

---

### BETWEEN THE 20s - GAMBLING (Stage 1)

**Title:** Between the 20s

**Description:** A mysterious gambling den with glowing dice floating in the air.

**Not enough gold:** You don't have enough gold to play.

**Back Out:** You decide to play it safe and back out.

**Win:** SUCCESS! [dice] landed in range!

**Loss:** MISS! No dice landed in range.

### BETWEEN THE 20s EXTREME (Stage 2)

**Title:** Between the 20s Extreme

**Description:** The EXTREME version! Only 2 dice for bounds, NO backing out, but [X]G payout! High risk, high reward.

**Warning:** WARNING: No safety net here. You're all in once you start.

---

### GHOST BOYS (Stage 1)

**Title:** Two Ghostly Boys Want to Play

**Description:** Two translucent boys appear before you, giggling. "Play with us! Play with us!" They reach out with spectral hands.

**Escape Success:** You break free from their grip! The boys pout but let you go. "Come back and play sometime..."

**Last Stand Escape:** [Hero] took 1 damage and entered Last Stand! The shock breaks the ghost boys' hold! "Oops!" they say in unison, then fade away giggling.

**Max Attempts:** After many attempts, the ghost boys grow bored and fade away.

### GHOST BOYS - CONVERSION (Stage 2)

**Title:** The Boys Realize the Truth

**Description:** The ghost boys stare at each other, then at their translucent hands. "We're... we're dead. We're ghosts."

**Outcome:** Tears form in their spectral eyes. "We want to go home. We want to see Mommy and Daddy." They hold hands and walk toward a light that appears. "Thank you for showing us." They vanish peacefully.

**Future visits:** This room is now an Empty Playroom - you can pass safely in future runs.

### EMPTY PLAYROOM

**Title:** Empty Playroom

**Description:** An empty chamber, dust motes drifting in pale light. It might have been a playroom once, but whatever haunted it is long gone. The air feels peaceful.

**Outcome:** Nothing stops you here. You pass through quietly.

---

### FLUMMOXED ROYAL (Stage 1)

**Title:** Flummoxed Royal

**Description:** A flummoxed [Title] paces anxiously: "Please, you must help! A creature in the next room ate my engagement ring! If you can stun it on the first turn of battle, I can retrieve it!"

**Accept:** The [Title] looks hopeful: "Thank you! I'll follow you and grab it when you stun the creature!"

### ROYAL WEDDING (Stage 2)

**Title:** Royal Wedding

**Description:** The [Title] proposes to their beloved. A beautiful wedding ceremony unfolds before you!

**Reward:** Each wears a garment displaying a sigil of power. As thanks for your help, you may choose one:

**After Choice:** The royal couple thanks you profusely. The [sigil] sigil glows and merges with your power!

**Quest Failed:** The [Title] returns, dejected: "The creature fled before I could retrieve the ring. I'll have to find another way..." The [Title] departs sadly. No reward.

---

## OLD TAPO ENCOUNTER (Floor 20, FU Mode)

**Title:** The Master of Space and Time

**Description:** "Tapo, you say? Yes.... I was called Tapo once, before I mastered the mysteries of space and time. Save me? Why, I need no saving... In fact...."

**Unlock:** Baby Tapo has been added to your hero roster! Stats: 1 HP / 1 POW. Starts with ALL active sigils!

---

## DEATH (First Time Meeting)

### [Opening]
"Oh hey, it's you! I'm the one who's been giving you tips along the way."

"I'm supposed to take you to the next life... but you're not from this realm, are you?"

### [Response: "Yes, I'm from Ribbleton!"]
"Ribbleton! I thought so. Not many travelers make it here from other realms."

### [Response: "No, I sure am from this realm!"]
"Is that so? Well, regardless of where you're from..."

### [Continues]
"Well, it might be more profitable for *both* of us if I don't, you know... kill you. I have another arrangement in mind."

---

## DEATH SCREEN

### [Exit Warning]
"Are you sure? This is some great value, and you'll end up giving it to me sooner or later..."

### [Death Boys (after Ghost conversion)]
**Title:** The Death Boys

**Description:** "We work for Death now! He's WAY cooler than being ghosts!"

**Death Boy 1 - Sell Back:** Remove one upgrade level from any sigil and get Gold equal to the current Going Rate (no +5G increase)

**Death Boy 2 - Sacrifice:** Sacrifice one upgrade level to gain [Going Rate] Starting XP permanently. Going Rate decreases by 5G.

---

## FIRST STANDARD VICTORY (8 slides)

### [SLIDE 1]
After 20 grueling floors, your heroes finally found him - Tapo the Tadpole, happily playing with a collection of strange glowing figurines!

### [SLIDE 2]
The little tadpole squeaked excitedly as the heroes approached. Around him lay scattered statues - each one depicting a heroic frog warrior.

### [SLIDE 3]
The heroes carefully gathered the mysterious figurines. As they held them, the statues pulsed with magical energy...

### [SLIDE 4]
They found an ancient pedestal nearby, covered in glowing runes. Instinctively, they placed the figurines upon it - and felt power surge through them!

### [SLIDE 5]
With Tapo safely in the Warrior's arms and their new treasures secured, the heroes stepped back through the portal...

### [SLIDE 6]
The portal deposited them back in Ribbleton's square. The townspeople erupted in cheers as the heroes emerged victorious!

### [SLIDE 7]
Exhausted but triumphant, the heroes decided to rest and celebrate their victory. They set Tapo down for just a moment...

### [SLIDE 8]
But when they turned around... Tapo was gone! The portal behind them shimmered ominously. That mischievous little tadpole must have hopped back through!

---

## SUBSEQUENT STANDARD VICTORIES

VICTORY!

You saved Tapo the Tadpole!

---

## FIRST FU VICTORY

FROGGED UP MODE CONQUERED!

You defeated the hardest challenge in FROGGLE.

I genuinely did not think anyone would beat this.

Thank you for playing.

### [Credits]
**FROGGLE**

A DubsPubs game by Preston Wesley Evans

Design, Art, & Code: Preston + Claude

Playtesting: Michael Griffin, Charlie Schmidt, Carolyn Powell, Matt Sutz, Ryan Evertz, Noel McKillip, Ray Willess

Inspiration: Inscryption, Slay the Spire, Balatro, and too much coffee

Sanity: Erin Keif, Adal Rfai, JPC, Odell Brewing

Support: Lisa Evans

### [Tapo Unlock]
TAPO UNLOCKED!

Tapo the Tadpole is now available as a playable hero!

Stats: 1 POW, 1 HP - Has access to ALL sigils in the Sigilarium

(Glass cannon mode activated)

---

## SUBSEQUENT FU VICTORIES

VICTORY!

You conquered the Frogged Up realm once again! Impressive.

---

## TAPO IN PARTY VICTORY (First time with Tapo alive)

VICTORY!

Holy frog. I can't believe you put this much time into my silly little game.

From the bottom of my heart, thank you for playing.

I hope you had fun!

-Preston

---

## PEDESTAL

**Title:** Pedestal of Champions

**First Placement Tutorial:** Welcome to the Pedestal! Figurines are rewards for heroes who survive to victory. Place them here to permanently boost that hero's stats. Each hero can earn up to 2 figurines per difficulty mode.

---

## SKIP TUTORIAL CONFIRMATION

**Title:** Alright champ!

You're on your own - get going and save Tapo!

Need help? Check out the **FAQ** and **Sigilarium** buttons at the top of the screen anytime!

(Help/tips can be disabled in the Settings menu)

---

## TUTORIAL POPUPS (In Order)

1. **tapo_first_attack:** Click Mage's Attack sigil to catch a fly!

2. **tapo_expand_tutorial:** Mage also has the Expand sigil! Hover / long-press it to learn more. Then click Attack and try selecting both flies!

3. **ribbleton_warrior_attack:** Welcome to combat! Click the Warrior's Attack sigil.

4. **ribbleton_healer_d20:** Nice hit! Before we heal, let's learn about gambits - click the Healer's D20 to see risky actions!

5. **ribbleton_enemy_turn:** Uh oh! Enemies attack every turn, and they attack straight across from them!

6. **ribbleton_healer_heal:** (Combined with Expand explanation in Heal popup)

7. **enemies_get_sigils:** Enemies draw sigils too! The Goblin drew Shield - he'll activate it AFTER attacking this turn, then it's gone. Defeat him before he can shield!

8. **ribbleton_handoff:** Hover / long-press any sigil to see what it does. You're on your own now - good luck!

---

## OTHER TUTORIAL TIPS

**neutral_intro:** Neutral floors offer choices and opportunities! You can walk straight through, or take a risk for potential rewards.

**neutral_d20_level:** These D20 checks use the same Level as your D20 sigil from combat - leveling it up improves your odds everywhere!

**last_stand_warning:** [Hero] is in danger! If they reach 0 HP, they'll enter Last Stand mode - they can only use D20 gambits, and each turn makes survival harder. Use Ghost charges or heal up to avoid it!

**last_stand_intro:** When a hero drops to 0 HP, they enter Last Stand! They can only use D20 gambits, and each turn makes success harder. Heal them to bring them back!

**shield_persistence:** Shields persist between battles! They're capped at max HP, so you can shield up before finishing a floor to enter the next floor with protection. Use this to survive tough encounters!

**ribbleton_hub_intro:** Welcome home to Ribbleton! This is your safe haven between adventures. Click the glowing red portal whenever you're ready to begin your next rescue mission!

---

## NOTES FOR EDITING

- Edit any text above, then paste this file back
- I'll match the sections and update the code
- Keep the structure (headers, bold markers) so I can parse it
- Feel free to add/remove Death quotes
- Encounter descriptions can be freely rewritten
