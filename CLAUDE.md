# FROGGLE Project Memory

## About
FROGGLE is a tactical turn-based roguelike built as a PWA. Pure frontend - all game logic runs in the browser with vanilla JavaScript. Think Balatro/Inscryption vibes, not mobile retention loops.

## Tech Stack
- Single HTML file (~11,500 lines) with embedded JS/CSS
- localStorage for saves (no backend/cloud sync)
- Mobile-first, PWA installable
- Steam Deck controller support

## Development
- Feature branches: `claude/` prefix, push when complete
- Default to Sonnet for coding; use Opus for architecture/balance analysis
- Keep it simple - no frameworks, no over-engineering

## Code Modularization

**Status:** Implemented ✓

### Structure
The monolith is now split into modular source files that concatenate back to `index.html` for production.

```
src/
├── constants.js      # Version, HERO_IMAGES, H, E, SIGIL_*, ANIMATION_TIMINGS (934 lines)
├── sounds.js         # SoundFX Web Audio API system (286 lines)
├── state.js          # Game state `S`, upd(), animations, toast, save/load (842 lines)
├── neutrals.js       # Neutral deck, encounters, combat, title/hero select, level up (5394 lines)
├── screens.js        # The Pond, Death screen, Champions, Pedestal, Win, Ribbleton hub (1020 lines)
├── settings.js       # Debug, Settings, FAQ (1579 lines)
├── controller.js     # GamepadController for Steam Deck (761 lines)
└── main.js           # Init and window.onload (67 lines)

build/
├── template_head.html  # HTML/CSS before <script>
├── template_foot.html  # HTML after </script>
└── combined.js         # Concatenated JS output

build.sh              # Concatenate modules → index.html
extract.sh            # Extract modules from index.html
```

### Build Commands
```bash
./build.sh            # Rebuild index.html from src/ modules
./extract.sh          # Re-extract modules from index.html (if needed)
```

### Key Globals (used across modules)
- **`S`** - Central game state object
- **`SoundFX`** - Audio system
- **`toast()`**, **`T()`** - UI helpers
- **`getLevel()`, `rollDice()`, `render()`, `saveGame()`** - Shared helpers

### Module Dependency Order
1. constants.js (no deps)
2. sounds.js (no deps)
3. state.js (needs constants, sounds)
4. neutrals.js (needs all above)
5. screens.js (needs all above)
6. settings.js (needs all above)
7. controller.js (needs state)
8. main.js (init, must be last)

### Editing Workflow
1. Edit files in `src/`
2. Run `./build.sh` to rebuild `index.html`
3. Test in browser
4. Commit both `src/` and `index.html`

### Note on neutrals.js
The `neutrals.js` file is large (5394 lines) because it contains the combat engine, all 9 neutral encounters, title/hero selection, level up system, and floor progression. Future refactoring could split this further if needed.
