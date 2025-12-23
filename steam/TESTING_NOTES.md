# FROGGLE Testing Notes

## Session: 2024-12-23

### Bugs Fixed This Session
- **D20 not showing in Last Stand** - Critical/game-breaking. Heroes in Last Stand had no clickable D20 sigil.
- **Level up display wrong** - Showed "L1→L2" when upgrading to L3. Fixed display level calculation.
- **Shopkeeper unlimited potions** - Could buy infinite potions. Now limited to 1 of each per visit.
- **Figurine slotting exploit** - Could slot 2 figurines on same hero per victory. Now 1 per hero who earned it.
- **Gold reset on victory** - Gold was zeroed after winning. Now persists between runs.
- **Post-F19 level up pointless** - Now auto-skips to victory instead of showing XP spend menu.
- **Tooltips missing in level up menu** - Added tooltips to all sigil options.
- **Asterisk no visual feedback** - Added red X overlay when expended in combat.
- **Victory slide backgrounds** - "Ribbleton awakens" now uses Ribbleton bg; Tapo flipped to face portal.

### Outstanding Items
- **Flydra art missing** - Need to add enemy art for Flydra boss
- **Systematic QA needed** - Bugs found suggest more edge cases exist, especially in:
  - Last Stand scenarios
  - FU mode (higher stakes = bugs hurt more)
  - Multi-hero interactions
  - Asterisk + various sigil combos

### Gamma Readiness Assessment
**Almost ready, but not quite.** Recommended before gamma:
1. Focused playtest of full loop: Standard → Victory → FU
2. Explicit testing of Last Stand, Asterisk, Expand edge cases
3. Quest Board verification (new feature, untested in production)
4. Victory cutscene flow check (new session tracking code)

---

## Playtesting Best Practices

### What to Watch For (Not Ask)
1. **Unprompted replay** - Do they start another run without being asked? Real signal.
2. **Audible reactions** - Groans, laughs, "oh shit" moments. Not performative.
3. **Decision paralysis vs flow** - Agonizing over choices (good) vs clicking through (bad).
4. **Where they stop** - Floor 7 quit vs post-death quit = different data.
5. **Questions they ask** - "Can I recruit the dragon?" = engagement. "What does this do?" = UI failure.

### The One Good Question
> "Tell me about a moment where you felt clever or powerful."

If they can't name one, that's the problem to solve.

### Don't Guide Testers
Coaching removes discovery. The fun of roguelikes is learning through failure. Sit on hands. Let them lose. Watch where.

---

## Ideas for Future Consideration
- (None logged this session - focus was bug fixes)
