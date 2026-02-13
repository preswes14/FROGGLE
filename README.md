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
- Mysterious encounters, each with a hidden unlockable second stage (can you unlock them all?!)
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

- **Mobile:** iOS & Android via installable PWA (touch-optimized with double-tap targeting)
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

### Existing Issues to Address

1. **Service worker cache is incomplete** — `sw.js` only pre-caches 9 core assets (index, manifest, a few images). The game uses 60+ assets (characters, enemies, sigils, neutrals, reactions, font) that are NOT in `ASSETS_TO_CACHE`. The SW does dynamically cache assets on first fetch, but a cold offline install will be missing most art. All `assets/` subdirectory files should be added to the pre-cache list.
2. **manifest.json missing icon sizes** — Only the 512×512 icon is listed (referencing `tapo.png`). The 192×192 (`tapo-icon-192.png`) and 180×180 (`tapo-icon-180.png`) files already exist in `assets/` and should be added as separate entries for better PWA install support across devices.
3. **Flydra boss sprites** — Three individual head sprites exist (`flydra_blightfang.png`, `flydra_dreadmaw.png`, `flydra_venomwing.png`) plus group art (`Flydra Boss.png`, `Flydra trio.png`) in `assets/`. These are separate from the standard `assets/enemies/` directory and should be verified for correct referencing in the codebase.
4. **Font not in SW cache** — `assets/fonts/fredoka-one.otf` (Fredoka One, the game's display font) is not in the service worker pre-cache list. Offline users may see fallback fonts until it gets dynamically cached.

### When New Assets Arrive

Once the professional art drops in, here's what to update:

1. **Swap image references** — Replace placeholder paths in `HERO_IMAGES` (constants.js) and neutral `bgImage` paths (neutrals.js) with the new filenames
2. **Update service worker cache** — Add all new asset paths to `ASSETS_TO_CACHE` in `sw.js` so the PWA works offline with the new art (and address the existing cache gap above)
3. **Update manifest.json icons** — Add the existing `tapo-icon-192.png` and `tapo-icon-180.png` to the manifest `icons` array alongside the 512 entry (note: the 512 entry currently references `tapo.png`, not `tapo-icon-512.png`)
4. **Add Open Graph meta tags** — Once there's a polished hero image to use as a preview, add `og:image`, `og:title`, `og:description`, and `twitter:card` meta tags to the HTML head for social sharing
5. **Verify aspect ratios** — Current CSS assumes certain image dimensions; new art may need `object-fit` or container adjustments in the neutral encounter layout and hero select screens
6. **Rebuild** — Run `./build.sh` after any changes to regenerate `index.html`

---

Made by Preston and Claude, please don't steal it please!
