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
