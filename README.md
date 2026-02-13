# FROGGLE

A Froggy Roguelike

**Live. Die. Ribbit.**

## Play Now

**[Play FROGGLE](https://preswes14.github.io/FROGGLE/)**

## About

FROGGLE is a *weirdly empowering*, **delightfully breakable** (**f**)roguelike dungeon crawler featuring:
- An adorable little Tadpole named Tapo who YOU must save, or you will ruin his first birthday!
- 4 Brave Frogventurers (Warrior, Tank, Mage, and Healer) - _can you unlock the secret 5th hero??_
- Rich, tactical turn-based combat ranging from punk goblins to the fearsome final boss!  Basic initially; progressively awesomer.
- The chance to swing ANY battle at ANY time with a lucky roll!
- Msterious encounters, each with a hidden unlockable second stage (can you unlock them all?!)
- Spend XP mid-run to upgrade stats or add/enhance abilities
- Buy PERMANENT upgrades for your entire party from Death himself!
- 4 Basic starter sigils with intuitive actions (attack, shield, heal, and the lucky D20)
- 3 advanced upgradable active abilities with powerful effects (like preventing death or granting turns to an ally)
- 3 game-changing passive abilities that the heroes gain/upgrade as a team!
- A wildly challenging game mode - FROGGED UP mode - (clear Standard to unlock)
- Funky froggy procedurally-generated beats
- Lots of fun tidbits and easter eggs!

*Inspired by Slay the Spire, Balatro, and Inscryption - if you like any of these, you'll probably like FROGGLE!*

## Platforms

- **Desktop:** Windows, Mac, Linux
- **Steam Deck:** Optimized with full controller support


## For Beta Testers

Currently looking for feedback on:
- **Balance:** Are any abilities or encounters too strong/weak?
- **Bugs:** Anything broken or behaving unexpectedly?
- **Best part:** What's the most fun aspect of the game?
- **Worst part:** What's frustrating or confusing?

---

## Notes for Claude

### Art Assets In Progress

Professional freelance artists have been hired from Fiverr to create replacement art. Current placeholder art will be swapped out. Incoming assets include:

- **Neutral encounter art** — scene illustrations for all 9 encounter types (both stages)
- **Character art** — hero portraits, full-body, and pixel variants for all 5 heroes

### When New Assets Arrive

Once the professional art drops in, here's what to update:

1. **Swap image references** — Replace placeholder paths in `HERO_IMAGES` (constants.js) and neutral `bgImage` paths (neutrals.js) with the new filenames
2. **Update service worker cache** — Add all new asset paths to `ASSETS_TO_CACHE` in `sw.js` so the PWA works offline with the new art
3. **Update manifest.json icons** — Reference the existing `tapo-icon-192.png` and `tapo-icon-180.png` in the manifest `icons` array (currently only the 512 is listed)
4. **Add Open Graph meta tags** — Once there's a polished hero image to use as a preview, add `og:image`, `og:title`, `og:description`, and `twitter:card` meta tags to the HTML head for social sharing
5. **Verify aspect ratios** — Current CSS assumes certain image dimensions; new art may need `object-fit` or container adjustments in the neutral encounter layout and hero select screens
6. **Rebuild** — Run `./build.sh` after any changes to regenerate `index.html`

---

Made by Preston and Claude, please don't steal it please!
