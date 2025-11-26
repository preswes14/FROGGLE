# FROGGLE - Complete Narrative Script

*All story/dialogue content (excluding tips/popups). Edit freely!*

---

## ACT 1: INTRO (New Player)

### [SLIDE 1: Welcome to Ribbleton]
> In the beautiful, tranquil town of **Ribbleton**, today is a very special day!!
>
> Why?

### [SLIDE 2: Tapo's First Birthday]
> The village's youngest tadpole, **Tapo**, turns one today!

### [SLIDE 3: A Special Gift]
> **Mage** promised to teach Tapo how to catch flies as a birthday gift! Together they head to the village square to find some.

### [OVERLAY: Combat Tutorial]
> 🪰 **Two flies** are buzzing around! 🪰
>
> Help Mage catch them for Tapo's birthday!

---

## ACT 2: PORTAL INVASION

### [After catching flies]
> Mage and Tapo catch all the flies! Tapo squeals with delight as they share the tasty treats together. 🎉

### [SLIDE: DANGER!]
> Suddenly, **a dark portal** tears open in the square! Tank, Warrior, and Healer rush to defend Tapo and Mage!

### [COMBAT OVERLAY]
> A Goblin and a Wolf appear from the portal!
>
> Tank and Mage stand guard around Tapo while Warrior and Healer charge toward the portal!

---

## ACT 3: TAPO MISSING

### [SLIDE 1]
> The few enemies remaining around Ribbleton scamper back into the portal. Relieved, the frog heroes sheathe their weapons and look for Tapo - but he's missing!!

### [SLIDE 2]
> As the Ribbletonians search high and low, the heroes realize there's only one possibility - the poor tadpole has squiggled his way through the portal!

### [SLIDE 3]
> The townspeople gather around the heroes. "You must bring him home!" they plead. The heroes nod solemnly - Ribbleton will be their sanctuary, and they'll return here between each rescue attempt.

### [TITLE CARD]
> **FROGGLE**
>
> *A Froggy Roguelike*

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

## DEATH (First Time)

### [Death Boy appears]
> "Oh hey, it's you! I'm the one who's been giving you tips along the way."
>
> "I'm supposed to take you to the next life… but you're not from this realm, are you?"

### [Player chooses: "Yes, I'm from Ribbleton!"]
> "Ribbleton! I thought so. Not many travelers make it here from other realms."

### [Player chooses: "No, I sure am from this realm!"]
> "Is that so? Well, regardless of where you're from..."

### [Continues]
> "Well, it might be more profitable for *both* of us if I don't, you know… kill you. I have another arrangement in mind."

*(Then shows Death Boy's upgrade shop)*

---

## FIRST STANDARD VICTORY (8 slides)

### [SLIDE 1]
> After 20 grueling floors, your heroes finally found him - Tapo the Tadpole, happily playing with a collection of strange glowing figurines!

### [SLIDE 2]
> The little tadpole squeaked excitedly as the heroes approached. Around him lay scattered statues - each one depicting a heroic frog warrior.

### [SLIDE 3]
> The heroes carefully gathered the mysterious figurines. As they held them, the statues pulsed with magical energy...

### [SLIDE 4]
> They found an ancient pedestal nearby, covered in glowing runes. Instinctively, they placed the figurines upon it - and felt power surge through them!

### [SLIDE 5]
> With Tapo safely in the Warrior's arms and their new treasures secured, the heroes stepped back through the portal...

### [SLIDE 6]
> The portal deposited them back in Ribbleton's square. The townspeople erupted in cheers as the heroes emerged victorious!

### [SLIDE 7]
> Exhausted but triumphant, the heroes decided to rest and celebrate their victory. They set Tapo down for just a moment...

### [SLIDE 8]
> But when they turned around... Tapo was gone! The portal behind them shimmered ominously. That mischievous little tadpole must have hopped back through!

---

## SUBSEQUENT STANDARD VICTORIES

> 🏆 VICTORY! 🏆
>
> You saved Tapo the Tadpole!

---

## OLD TAPO ENCOUNTER (Floor 20, FU Mode)

### [Old Tapo appears]
> "Tapo, you say? Yes…. I was called Tapo once, before I mastered the mysteries of space and time. Save me? Why, I need no saving… In fact…."

### [Transforms]
> ✨ Tapo Unlocked! ✨
>
> Baby Tapo has been added to your hero roster!
> Stats: 1 HP / 1 POW
> Starts with ALL active sigils!

---

## FIRST FU VICTORY

> 🔥 FROGGED UP MODE CONQUERED! 🔥
>
> You defeated the hardest challenge in FROGGLE.
> I genuinely did not think anyone would beat this.
>
> Thank you for playing. ❤️

### [Credits]
> **FROGGLE**
>
> A game by Preston Wesner
> Design, Art, & Code: Preston
> Playtesting: [Your Name Here]
> Inspiration: Slay the Spire, Balatro, and too much coffee
> Made with love in 2024

### [Tapo Unlock]
> 🎉 TAPO UNLOCKED! 🎉
>
> Tapo the Tadpole is now available as a playable hero!
> Stats: 1 POW, 1 HP • Has access to ALL sigils in the Sigilarium
> (Glass cannon mode activated)

---

## SUBSEQUENT FU VICTORIES

> 🏆 VICTORY! 🏆
>
> You conquered the Frogged Up realm once again!
> Impressive.

---

## TAPO IN PARTY VICTORY (First time with Tapo alive)

> 🏆 VICTORY! 🏆
>
> Holy frog. I can't believe you put this much time into my silly little game.
>
> From the bottom of my heart, thank you for playing.
>
> I hope you had fun!
>
> -Preston
>
> ❤️🐸❤️

---

## THE POND (Flavor)

> 🌿 The Pond 🌿
>
> A quiet place to reflect on adventures past...

### [If empty]
> The water is still... Your lily pads will appear here after your first adventure.

---

## GAPS / TODO

1. **No FU mode unlock explanation** - After first Standard win, FU just appears in Champions menu. No narrative explaining what it is or why it's harder.

2. **No intro to Champions/Pedestal** - These systems appear without story context.

3. **Death Boy's "arrangement"** - He says he has a deal, but we never explain what it is (the XP-for-progress trade).

4. **Ribbleton hub** - No flavor text when returning between runs.

5. **Skip tutorial confirmation** - Currently just says "You're on your own - get going and save Tapo!"

---

## NOTES

- All text above is extracted from `src/neutrals.js` and `src/screens.js`
- Edit this doc, then update the corresponding functions in code
- Floor names are in `src/combat.js` → `getFloorName()`
