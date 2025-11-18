# FROGGLE UX Audit - Quick Reference Guide

## Files Included in This Audit

1. **UX_AUDIT_COMPREHENSIVE.md** - Full technical audit with all code locations
2. **UX_AUDIT_KEY_FINDINGS.md** - Executive summary with friction points and recommendations
3. **UX_AUDIT_QUICK_REFERENCE.md** - This file (navigation guide)

---

## Main File Structure

**Single HTML File:** `/home/user/FROGGLE/index.html` (293 KB)

### Key Sections (Line Numbers)

| Section | Lines | Purpose |
|---------|-------|---------|
| CSS Styling | 1-900 | All visual design (colors, layouts, animations) |
| Constants & Data | 900-1100 | Sigil data, enemy types, game mechanics |
| Tutorial System | 1250-1410 | Ribbleton combat tutorial flow |
| Tooltip System | 1427-1520 | Hover tooltips for sigils |
| Game State | 1533-1700 | S object definition (all game variables) |
| Tutorial Pop-ups | 1852-1910 | showTutorialPop function |
| Neutral HTML Builder | 2293-2330 | buildNeutralHTML (encounters display) |
| Title Screen | 2332-2390 | Main menu and save slot selection |
| Hero Selection | 2975-3165 | Character select screen |
| Combat Engine | 3360-4700 | All combat mechanics and rendering |
| Main Render | 4691-4900 | render() function (combat display) |
| Level-Up System | 4906-5150 | Upgrade screens and menus |
| Neutral Encounters | 5140-6100 | Merchant, Oracle, Pedestal logic |
| Death Screen | 6692-7000 | Death dialogue and upgrade shop |
| Victory Screen | 7174-7350 | Win conditions and celebration |
| Settings Menu | 7479-7614 | ⚙️ settings UI and toggles |
| FAQ System | 7615-7770 | Frequently Asked Questions |

---

## Key Code Locations by Feature

### Tutorial System
- **Master function:** `showTutorialPop()` at line 1852
- **Tutorial flags:** `S.tutorialFlags` object defined at line 1590
- **Tooltips intro:** Line 3364 (first combat suggestion)
- **FAQ intro:** Line 4922 (after Floor 2)
- **Death intro:** Line 6692
- **Reset tutorials:** Line 7552

### User Feedback
- **Toast messages:** `toast()` function at line 1783
- **Toast log:** Lines 400 & 600 (CSS styling)
- **Log display toggle:** `toggleToastLogVisibility()` at line 7478

### Menus & Navigation
- **Settings menu:** `showSettingsMenu()` at line 7479
- **FAQ display:** `showFAQ()` at line 7615
- **Title screen:** `mainTitlePage()` at line 2333
- **Hero selection:** `title()` at line 2982

### Combat UI
- **Combat rendering:** `render()` at line 4691
- **Status header:** `renderCombatStatusHeader()` at line 1190
- **Hero cards:** `renderHeroCard()` at line 1653
- **Combat lanes:** HTML at line 159 (CSS) & 1149 (HTML generation)

### Sigil System
- **Descriptions:** `descriptions` object at line 1444
- **Tooltips:** `showTooltip()` at line 1460
- **Description getter:** `getLevelDescription()` at line 1430

### Game Mechanics
- **Last Stand:** Explained at line 1270 (toast) and line 6633 (tutorial)
- **Shields persistence:** FAQ item at line 7657
- **Recruits:** Tutorial at line 3611
- **Asterisk multiplier:** Tooltip at line 1452
- **Star XP bonus:** Tooltip at line 1453
- **Alpha grant actions:** Tooltip at line 1454

---

## Error Messages (With Locations)

| Error | Location | User Impact | Recommendation |
|-------|----------|-------------|-----------------|
| "Maximum 2 heroes!" | 3155 | Clear | Keep as-is |
| "Wait for enemy turn!" | 3410, 3767, 3840 | Clear | Keep as-is |
| "{hero} already acted!" | 3413 | Clear | Keep as-is |
| "{hero} is stunned!" | 3414 | Clear | Keep as-is |
| "{hero} in Last Stand - D20 only!" | 3416 | Clear | Keep as-is |
| "Follow the tutorial instructions!" | 3427 | Clear | Keep as-is |
| "Ghost not unlocked!" | 3477 | **Needs improvement** | "Ghost sigil not purchased. Visit Level-Up screen to add it." |
| "Grapple not unlocked!" | 3486 | **Needs improvement** | Same as above |
| "Alpha not unlocked!" | 3494 | **Needs improvement** | Same as above |
| "Grapple would be lethal!" | 3828 | Good | Could add: "Choose fewer/weaker targets or cancel." |
| "Already targeted!" | 3771, 3811 | Clear | Keep as-is |
| "Not enough XP!" | 4972 | Clear | Keep as-is |
| "Too Expensive" | 6828 | Clear | Could show: "Earn more Gold at the Death screen." |

---

## Tutorial Flow Chart

```
Game Start
├─ Title Screen (mainTitlePage)
├─ Hero Selection (title)
└─ New Game vs Existing Run
   ├─ NEW GAME
   │  ├─ Tapo's Birthday (Floor 0 tutorial)
   │  │  └─ "Click Mage's Attack sigil"
   │  ├─ Ribbleton Combat (Floor 1) [12+ popups]
   │  │  ├─ "Welcome to combat!"
   │  │  ├─ "Targeting explained"
   │  │  ├─ "D20 gambits"
   │  │  └─ ...8 more
   │  ├─ Level-Up Tutorial (Floor 1 complete)
   │  │  ├─ "Upgrade Hero Stats"
   │  │  ├─ "Upgrade Sigil Level"
   │  │  ├─ "Add New Sigil"
   │  │  └─ "Passive Sigils"
   │  ├─ Neutral Floor (Floor 2)
   │  │  ├─ "Neutral floors explained"
   │  │  └─ "FAQ intro" after completion
   │  └─ [Repeat cycles until Floor 20]
   └─ EXISTING SAVE
      ├─ Skip tutorial popups (all shown)
      └─ Continue from last floor

Death Flow:
├─ First Death → showDeathIntroDialogue()
├─ Subsequent Deaths → showDeathScreen() [Upgrade shop]
└─ Back to Title

Victory Flow:
├─ First Standard Victory → showFirstVictoryCutscene()
├─ First Effed Victory → showFUVictoryCredits()
└─ Other Victories → showSimpleVictoryScreen()
```

---

## Toast Notification Categories

### Success (Green)
- "Victory!"
- "Level Up!"
- "Game Saved!"
- Success messages with bold and color

### Action Confirmation (Yellow)
- "Slot loaded!"
- "Save exported!"
- Recruitment confirmations
- Sigil draws

### Warning/Error (Red)
- "Not enough XP!"
- "Already targeted!"
- "Wait for enemy turn!"
- Error messages

### Duration: 1200-2500ms (1.2-2.5 seconds)

---

## Key Performance Indicators (UX Metrics)

### What to Monitor
1. **Tutorial abandon rate** - How many players disable help before Floor 2?
2. **Level-Up screen dwell time** - How long do players spend deciding?
3. **FAQ click rate** - What % of players find it?
4. **Error frequency** - Which errors appear most? (Sign of UX confusion)
5. **Death screen engagement** - Do players upgrade sigils or restart?
6. **Neutral floor choices** - Which encounters do players pick?

### Questions to Ask Players
1. "Did you understand what Last Stand meant when it happened?"
2. "Was the tutorial helpful or overwhelming?"
3. "Did you know shields carry over between battles?"
4. "Could you explain what 'Expand' does?"
5. "What would improve the UX most for you?"

---

## Mobile-Specific UX Notes

### Touch Interactions
- **Tooltips:** 500ms long-press to display (not hover)
- **Buttons:** Min 44x44px tap target
- **Modals:** Tap outside to close
- **Scrolling:** Portrait orientation for most screens
- **Landscape:** Combat board expands for wider view

### Responsive Breakpoints
- Phone (< 600px): Vertical layout, stacked cards
- Tablet (600-1024px): Two-column layout possible
- Desktop (> 1024px): Full horizontal board

### PWA Features
- Installable on home screen
- Works offline (localStorage saves)
- No network required after initial load
- Manifest at `/home/user/FROGGLE/manifest.json`

---

## Tutorial Complexity Rating

| Tutorial | Complexity | Player Type | Frequency |
|----------|-----------|------------|-----------|
| "Click Attack" | 🟢 Low | All | 1x per new game |
| "Targeting" | 🟡 Medium | All | 1x per new game |
| "D20 Gambits" | 🟡 Medium | All | 1x per new game |
| "Expand Passive" | 🟡 Medium | All | 1x per new game |
| "Enemy Turn" | 🟡 Medium | All | 1x per new game |
| "Level-Up Stats" | 🟢 Low | All | 1x per new game |
| "Sigil Upgrades" | 🟠 High | New | 1x per new game |
| "Passive Sigils" | 🟠 High | New | 1x per new game |
| "Last Stand" | 🔴 Very High | All | When triggered |
| "Recruits" | 🟠 High | All | When first usable |
| "Shield Farming" | 🔴 Very High | Advanced | Hidden in FAQ |
| "Pedestal" | 🟠 High | New | 1x after first win |

**Total New Player Burden:** 15+ tutorials in first 2 hours

---

## FAQ Content Summary

| # | Topic | Complexity | Importance |
|---|-------|-----------|-----------|
| 1 | Level display (L1 confusion) | Medium | High (common question) |
| 2 | Wasted targets | Medium | Medium (advanced topic) |
| 3 | Last Stand mechanics | High | High (confusing when happens) |
| 4 | Recruit limits | Low | Medium (niche mechanic) |
| 5 | Shield persistence | High | **Critical** (strategy enabler) |
| 6 | XP vs Gold upgrades | Medium | High (core progression) |
| 7 | Class balance | High | **Critical** (game design decision) |
| 8 | Passive sigils | High | High (core mechanic) |
| 9 | Enemy scaling | Low | Low (informational) |
| 10 | Dragon strategy | High | Medium (late game) |

**FAQ Coverage:** 66% of common questions (missing: Death Boys, Pedestal value, neutral floor choices)

---

## Recommendations Priority Roadmap

### Phase 1: Quick Wins (This Week)
- [ ] Improve "Not unlocked" error messages (30 min)
- [ ] Extend Last Stand toast to 3 seconds (5 min)
- [ ] Add FAQ link to title screen (15 min)
- [ ] Add 3 missing FAQ entries (30 min)

### Phase 2: Medium Effort (Next 2 Weeks)
- [ ] Batch Ribbleton tutorials (2 hours)
- [ ] Pre-warn about Last Stand (1 hour)
- [ ] Create in-game glossary (1.5 hours)
- [ ] Improve neutral floor UI (2 hours)

### Phase 3: Strategic (Month)
- [ ] Implement "skip tutorial" option (2 hours)
- [ ] Redesign error system with guidance (2 hours)
- [ ] Add contextual help tooltips (4 hours)
- [ ] Player testing & iteration (ongoing)

---

## Contact Points for UX Friction

### When Players Get Stuck
1. **First Combat** → 12 tutorial popups (friction: overload)
2. **After First Death** → Confusing Death intro (friction: complexity)
3. **Level-Up Menu** → 3 choices, unclear recommendations (friction: decision paralysis)
4. **Last Stand Event** → Sudden mechanic, brief toast (friction: surprise)
5. **Neutral Floors** → 3 encounters, no risk guidance (friction: uncertainty)
6. **Death Screen** → Overwhelming upgrade grid (friction: complexity)
7. **Pedestal** → "What figurines? Where from?" (friction: confusion)
8. **Dragon Floors** → Sudden difficulty spike (friction: unfairness)

**Most Critical:** #1, #4, #5, #6

