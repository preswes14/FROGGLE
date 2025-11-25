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

## Planned: Code Modularization

**Status:** Ready to implement

### The Plan
Split monolith into ES modules, concatenate back to single file for production (best of both worlds).

```
src/
├── constants.js      # HEROES, ENEMIES, SIGILS, DEATH_QUOTES, ANIMATION_TIMINGS
├── sounds.js         # SoundFX object and all sound definitions
├── state.js          # Game state `S`, save/load functions
├── combat.js         # Combat engine, render(), enemy turns
├── neutrals.js       # All 9 neutral encounters
├── ui.js             # Animations, toasts, tooltips, modals
├── screens.js        # title, Ribbleton, Pond, death, levelUp, win
├── controller.js     # GamepadController (Steam Deck)
└── main.js           # Entry point, init, event listeners
```

### Watch Out For
- **`S`** - Global state object used everywhere
- **`SoundFX`**, **`toast()`**, **`T()`** - Called cross-module
- **`getLevel()`, `rollDice()`, `render()`, `saveGame()`** - Shared helpers

### Code Sections (approx line numbers, Nov 2025)
| Section | Lines |
|---------|-------|
| CSS | 1-1650 |
| Constants | 1650-2400 |
| SoundFX | 2575-2870 |
| Game State S | 2875-3020 |
| Save/Load | 3250-3550 |
| Combat | 4750-6460 |
| Level Up | 6745-6900 |
| Neutrals | 7400-9100 |
| The Pond | 9130-9380 |
| Death Screen | 9385-9550 |
| Win/Victory | 9857-10050 |
| Ribbleton | 10066-10140 |
| Settings | 10140-10400 |
| Controller | 10700-11200 |
