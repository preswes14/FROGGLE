# Death Screen Refactor Plan

## Target Layout (landscape-optimized, Steam Deck friendly)

```
┌──────────────┬──────────────┬──────────────┐
│  Death Boys  │  Death Image │  Going Rate  │
│  (left)      │  (center)    │  (right)     │
├──────────────┴──────────────┴──────────────┤
│        Death's quote — subtitle bar        │
├──────────────┬──────────────┬──────────────┤
│  Core Sigils │  Advanced    │  Passive     │
│  (2x2 grid)  │  Sigils      │  Sigils      │
│              │  (chained if │  (chained if │
│  Attack  Shd │  locked, or  │  locked, or  │
│  Heal    D20 │  mini grid)  │  mini grid)  │
│              │  Ghost Alpha │  Expand  Ast │
│              │  Grapple     │  Star        │
│              │          [Continue]         │
└──────────────┴──────────────┴──────────────┘
```

Continue button is tucked into the bottom-right area of the 3-column section (not a separate footer).

## Changes to `renderDeathShop()` in `src/screens.js`

### 1. Restructure the HTML layout
- **Top row**: CSS Grid `grid-template-columns: 1fr 1fr 1fr`
  - Left cell: Death Boys (if unlocked; empty if not)
  - Center cell: Death image (smaller than current 280px, maybe 160-180px)
  - Right cell: Going Rate display (compact, no flashing marquee — or keep subtle animation)

- **Subtitle bar**: Death quote in a simple centered bar below the top row

- **Main content**: CSS Grid `grid-template-columns: 1fr 1fr 1fr`
  - Each column contains a category header + mini 2-col grid of sigil cards inside
  - Locked categories show chain/X visual overlay with unlock button
  - Continue button tucked into bottom of the 3rd column (or spanning bottom-right)

### 2. Resize/compact the sigil cards
- Current cards have generous padding (1rem) and large text
- Make them more compact for the mini-grid layout
- Keep: icon, level display (L1 → L2), cost, purchase button
- Reduce font sizes and padding

### 3. Restyle locked categories
- Replace current plain "LOCKED" box with chain/X pattern visual
- Still show the unlock button and cost
- Show the sigil names that would be unlocked

### 4. Compact the Death Boys section
- Currently: two side-by-side panels each listing ALL 10 sigils
- New: needs to fit in the top-left cell
- Options: tabs between Sell Back / Sacrifice, or a more compact list showing only sigils that have upgrades to sell/sacrifice

### 5. Move Continue button
- Remove the dedicated `<div style="text-align:center;margin-top:2rem">` footer
- Place Continue button at the bottom of the rightmost column or spanning the bottom of the main grid

### 6. Keep all existing functionality
- `purchaseSigilUpgrade()`, `unlockSigilCategory()`, `deathBoySellBack()`, `deathBoySacrifice()` — no logic changes
- `restartAfterDeath()` / `actuallyRestartAfterDeath()` — unchanged
- Star background animation — keep
- Going Rate sanity check — keep
- Death quote intro animation — keep or adapt

## Files to modify
- `src/screens.js` — main refactor (renderDeathShop function, lines 369-641)
- Run `./build.sh` to rebuild `index.html`
- Commit both `src/screens.js` and `index.html`

## What NOT to change
- No logic changes to purchasing, selling, sacrificing
- No changes to state management
- No changes to showDeathScreen() flow (quote selection, intro check, etc.)
- No changes to other files
