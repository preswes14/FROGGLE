# FROGGLE Project Memory

## About This Project
FROGGLE is a tactical turn-based dungeon crawler roguelike game built as a PWA. It's a pure frontend game with no backend or AI integration - all game logic runs in the browser using vanilla JavaScript.

## Model Selection Policy

**Default Model: Sonnet 4.5** - Use for all coding tasks (implementation, debugging, refactoring, code reviews)

**Switch to Opus (`/model opus`) when:**

1. **Complex Game Balance Analysis** - Analyzing interconnected systems (progression, sigils, enemy scaling) requiring deep reasoning about game theory and player psychology

2. **Major Feature Architecture** - Designing complex new systems that require comprehensive architectural analysis (e.g., multiplayer, new game modes, major system overhauls)

3. **Critical Multi-System Bug Investigation** - Debugging elusive issues involving complex interactions between multiple game systems that require exhaustive reasoning

4. **Strategic Product Decisions** - High-level roadmap planning, feature prioritization, or analyzing tradeoffs between major development paths

**Automatic Switching Protocol:**
- When you detect tasks matching the criteria above, proactively suggest: "This task would benefit from Opus's deeper reasoning. Should I switch to Opus for this?"
- If the user agrees or if the task clearly requires strategic/architectural thinking (not coding), use `/model opus`
- After completing the strategic work, switch back to Sonnet for implementation

## Development Notes
- Game uses localStorage for saves (browser-only, no cloud sync)
- Single HTML file architecture with embedded JS/CSS
- Mobile-first design with PWA capabilities
- All changes should be developed on feature branches starting with `claude/` and pushed when complete

## Planned Refactor: Code Modularization

**Status:** Ready to implement (discussed with Preston, Nov 2025)

### Current State
- `index.html` is ~11,500 lines with ALL JS/CSS embedded
- Works great for deployment (single file PWA) but hard to navigate
- Code is well-organized with section comments but still a monolith

### Recommended Approach: Light ES Module Split
Split into 5-8 focused modules, then optionally concatenate for production.

**Suggested module structure:**
```
src/
├── constants.js      # HEROES, ENEMIES, SIGILS, DEATH_QUOTES, ANIMATION_TIMINGS
├── sounds.js         # SoundFX object and all sound definitions
├── state.js          # Game state `S`, save/load functions (savePermanent, loadPermanent, saveGame, loadGame)
├── combat.js         # Combat engine (combat(), render(), executeAction, enemyTurn, checkCombatEnd)
├── neutrals.js       # All 9 neutral encounters (buildNeutralHTML, shopkeeper, wizard, etc.)
├── ui.js             # Animations, toasts, tooltips, modals, screen transitions
├── screens.js        # Major screens (title, showRibbleton, showPond, showDeathScreen, levelUp, win)
├── controller.js     # GamepadController for Steam Deck support
└── main.js           # Entry point, initialization, event listeners
```

### Critical Shared Dependencies
- **`S` (Game State)** - The global state object is used EVERYWHERE. Must be importable/exportable cleanly.
- **`ANIMATION_TIMINGS`** and **`T()`** - Animation timing constants and speed multiplier helper
- **`SoundFX`** - Sound system used throughout
- **`toast()`** - Notification system called from many places
- **Helper functions** - `getLevel()`, `rollDice()`, `render()`, `saveGame()` are called cross-module

### Key Considerations
1. **Deployment simplicity** - Preston values single-file deployment. Consider a simple build step (esbuild/rollup) to concatenate back to single file for production.
2. **No framework** - Keep it vanilla JS. Don't introduce React/Vue/etc.
3. **PWA must still work** - manifest.json, service worker, offline capability
4. **Test thoroughly** - Many interconnected systems. Test combat, neutrals, save/load, controller support.

### Code Section Reference (approximate line numbers as of Nov 2025)
- CSS styles: lines 1-1650
- Constants (HEROES, ENEMIES, etc.): 1650-2400
- ANIMATION_TIMINGS: ~2400-2460
- SoundFX: ~2575-2870
- Game State S: ~2875-3020
- Save/Load: ~3250-3550
- Combat Engine: ~4750-6460
- Level Up: ~6745-6900
- Neutrals: ~7400-9100
- The Pond: ~9130-9380
- Death Screen: ~9385-9550
- Win/Victory: ~9857-10050
- Ribbleton Hub: ~10066-10140
- Settings/Debug: ~10140-10400
- Controller: ~10700-11200

### Preston's Preferences
- Likes clean, simple solutions over over-engineering
- Values the "just works" single-file deployment
- Game is near completion - this is polish/maintainability work
- Balatro/Inscryption energy, not mobile game retention loops
