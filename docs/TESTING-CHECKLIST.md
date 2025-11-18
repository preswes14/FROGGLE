# FROGGLE Testing Checklist

**Version:** 9.98
**Date:** 2025-11-12
**Test URL:** http://localhost:8080 or https://preswes14.github.io/FROGGLE/

---

## 🎯 PRIORITY TESTS (Recent Changes)

### ✅ Hero Selection (CRITICAL - Just Changed)
- [ ] All 4 hero classes are selectable without restrictions
- [ ] Hero select banner image displays correctly
- [ ] Can click each hero and see their stats/abilities
- [ ] "Start Adventure" button works after selecting heroes
- [ ] Hero portraits display correctly in battle

### ✅ Tutorial Launch (CRITICAL - Just Fixed)
- [ ] Clear browser localStorage to simulate first-time player
- [ ] Click "New Game"
- [ ] Tutorial story slides should appear (Ribbleton Floor 0)
- [ ] Can click through tutorial slides
- [ ] "Skip Tutorial" button works if present
- [ ] Tutorial combat with Wolf enemy works correctly
- [ ] Tutorial progresses through all stages properly

### ✅ Title Screen & Main UI
- [ ] Title screen image displays correctly
- [ ] "Play FROGGLE" button is visible and clickable
- [ ] Layout looks good on desktop
- [ ] Layout looks good on mobile (responsive)
- [ ] No overlapping text or broken images

---

## 🎮 CORE GAMEPLAY TESTS

### Combat System
- [ ] Lane-based combat works (each hero fights in their lane)
- [ ] Heroes can attack enemies successfully
- [ ] Enemy attacks register damage correctly
- [ ] Turn order (player → enemy) works properly
- [ ] Combat animations/feedback are smooth
- [ ] Health bars update correctly
- [ ] Death animations work for both heroes and enemies

### Sigil System (Test at least 3-4 different sigils)
- [ ] **Attack** - Deals damage correctly
- [ ] **Shield** - Blocks damage as expected
- [ ] **Heal** - Restores HP to wounded heroes
- [ ] **D20 Gambit** - Shows DC results (16-20: Confuse, Startle, Steal, Scare, Recruit)
- [ ] **Expand** - Targets multiple enemies
- [ ] **Grapple** - Stun effect works
- [ ] **Ghost** - Phase/dodge mechanic works
- [ ] **Alpha** - Leadership buff applies
- [ ] Sigil tooltips display on hover/long-press
- [ ] Sigil upgrade levels display correctly

### D20 Gambit Outcomes (Try multiple times)
- [ ] DC 16+ CONFUSE - Enemy confused
- [ ] DC 17+ STARTLE - Enemy startled
- [ ] DC 18+ STEAL - Gold stolen
- [ ] DC 19+ SCARE - Enemy scared
- [ ] DC 20 RECRUIT - Enemy recruited to your side
- [ ] Expand sigil allows multi-target D20

### Enemy Types
- [ ] Goblin (POW:1, HP:5) spawns and fights
- [ ] Wolf (POW:2, HP:5) spawns and fights
- [ ] Orc (POW:2, HP:7) spawns and fights
- [ ] Giant (POW:3, HP:15) spawns and fights
- [ ] Dragon (POW:10, HP:25) appears as boss-tier
- [ ] Enemy sigils activate correctly
- [ ] Enemy difficulty scales with floor number

### Last Stand Mechanic
- [ ] Hero enters Last Stand when HP reaches 0
- [ ] Tutorial popup explains Last Stand
- [ ] Hero has limited actions in Last Stand
- [ ] Hero can be healed out of Last Stand
- [ ] Hero dies if not healed in time

### Recruited Enemies
- [ ] Successfully recruited enemies join your party
- [ ] Recruits display in correct position
- [ ] Recruits fight alongside heroes
- [ ] Recruit stats are accurate

---

## 🏆 NEUTRAL ENCOUNTERS (Test 3-4 Different Types)

**Test on even floors: 2, 4, 6, 8...**

### Shopkeeper
- [ ] Background image displays (2 variants)
- [ ] Can purchase upgrades with gold
- [ ] Gold deducts correctly
- [ ] Items apply their effects
- [ ] Shopkeeper death face shows if you kill them

### Wishing Well
- [ ] Background image displays (2 variants)
- [ ] Risk/reward mechanics work
- [ ] Gold gambles function correctly
- [ ] Win/loss outcomes are fair

### Treasure Chest
- [ ] Background image displays (2 variants)
- [ ] Free rewards are granted
- [ ] Rewards are random/varied

### Wizard
- [ ] Background image displays (2 variants)
- [ ] Wizard face displays
- [ ] Sigil-related encounters work
- [ ] Choices have proper outcomes

### Oracle
- [ ] Background image displays (2 variants)
- [ ] Stat buff options appear
- [ ] Risks apply correctly
- [ ] Permanent effects persist

### Encampment
- [ ] Background image displays (2 variants)
- [ ] Pre-combat enemy elimination works
- [ ] Enemy count reduces for next floor

### Ancient Statue
- [ ] Background image displays (2 variants)
- [ ] Ancient Statuette relic is awarded
- [ ] Relic effect activates in combat

### Ghost Boys
- [ ] Background image displays (2 variants)
- [ ] Ghost Boys faces display
- [ ] Conversion quest works
- [ ] Quest rewards are granted

### Prince/Princess
- [ ] Background image displays (2 variants)
- [ ] Prince face displays (happy/worried)
- [ ] Multi-floor quest tracks correctly
- [ ] Quest completion rewards properly

---

## 💾 SAVE/LOAD SYSTEM

### Manual Save (via Settings Menu)
- [ ] Settings menu (⚙️) opens correctly
- [ ] "💾 Save Game" button is visible during gameplay
- [ ] Clicking Save shows "Game Saved!" toast
- [ ] Save persists after refreshing page
- [ ] Can load saved game from title screen

### Permanent Data (Auto-saved)
- [ ] Gold persists between runs
- [ ] Sigil levels persist between runs
- [ ] Tutorial flags persist (tutorial doesn't repeat)
- [ ] Unlocked heroes persist (Tapo unlocks after Effed Up victory)
- [ ] Pedestal figurines persist

### Export/Import
- [ ] Export Save button downloads JSON file
- [ ] JSON file contains save data
- [ ] Import Save button accepts JSON file
- [ ] Imported save restores game state correctly

---

## 🎨 VISUAL & UI TESTS

### Title Screen
- [ ] Title screen image loads and displays properly
- [ ] Title text is readable
- [ ] Buttons are properly styled
- [ ] Layout is centered and clean

### Hero Select
- [ ] Hero selection banner displays
- [ ] Hero cards are clear and readable
- [ ] Selected heroes are highlighted
- [ ] Stats display correctly for each hero

### Battle Screen
- [ ] Heroes display in lanes correctly
- [ ] Enemies display in lanes correctly
- [ ] Recruits display in proper position
- [ ] Sigil buttons are clickable and visible
- [ ] HP/POW stats are readable
- [ ] Turn indicator is clear

### Neutral Encounter Screens
- [ ] Background images display without cropping
- [ ] NPC faces display correctly
- [ ] Text is readable over backgrounds
- [ ] Buttons are accessible
- [ ] Choice cards are well-formatted

### Sigilarium (Encyclopedia)
- [ ] Opens from settings/menu
- [ ] All 10 sigils are listed
- [ ] Sigil images display
- [ ] Descriptions are accurate
- [ ] Upgrade levels show correctly

### Settings Menu
- [ ] Menu opens with ⚙️ button
- [ ] All options are visible
- [ ] Buttons are clickable
- [ ] Menu closes properly
- [ ] No visual glitches

### Toast Notifications
- [ ] Combat feedback toasts appear
- [ ] Toasts are readable
- [ ] Toasts disappear after timeout
- [ ] Multiple toasts don't overlap badly

---

## 📱 MOBILE TESTING

### iOS Safari
- [ ] Game loads on iPhone/iPad
- [ ] Touch controls work (tap, long-press)
- [ ] Sigil tooltips work on long-press
- [ ] Layout is responsive
- [ ] No horizontal scrolling
- [ ] "Add to Home Screen" works
- [ ] PWA icon displays correctly
- [ ] Full-screen mode works

### Android Chrome
- [ ] Game loads on Android device
- [ ] Touch controls work
- [ ] Tooltips work
- [ ] Responsive layout
- [ ] "Add to Home screen" works

### Desktop
- [ ] Mouse hover shows tooltips
- [ ] Click actions work
- [ ] Keyboard navigation (if any)
- [ ] Window resizing doesn't break layout

---

## 🏁 PROGRESSION & END-GAME

### Standard Mode
- [ ] Can progress through 20 floors
- [ ] Floor 20 victory screen appears
- [ ] Tapo displays on victory screen
- [ ] Champion figurine is awarded
- [ ] Figurine can be placed on Pedestal

### Effed Up Mode
- [ ] Unlocks after first Standard victory
- [ ] Enemy stats are 5x harder
- [ ] Can complete 20 floors
- [ ] Separate figurine for Effed Up victory
- [ ] Tapo hero unlocks after Effed Up victory

### Pedestal of Champions
- [ ] Pedestal screen displays
- [ ] Can place figurines after victories
- [ ] Figurines grant permanent stat buffs
- [ ] Buffs persist between runs
- [ ] Visual display of placed figurines

---

## 🐛 DEBUG TOOLS (Settings Menu)

- [ ] Add 100 Gold - works and updates gold counter
- [ ] Add 100 XP - works and allows leveling
- [ ] Jump to Floor [1-19] - correctly jumps to specified floor
- [ ] Deal 50 Damage to Enemy - damages active enemy
- [ ] Set Sigil Levels - manually adjust sigil levels

---

## ⚠️ KNOWN ISSUES TO WATCH FOR

### Recent Fix Areas (check these carefully)
1. **Hero selection** - Ensure no restrictions remain
2. **Tutorial flag** - Verify runNumber resets to 1 on new game
3. **helpTipsDisabled** - Check consistency of this flag
4. **Neutral encounter layouts** - Verify no UI breaking with backgrounds

### Common Issues to Test
- [ ] No JavaScript errors in browser console (F12)
- [ ] Images load without 404 errors
- [ ] localStorage works (not blocked by browser)
- [ ] No infinite loops or freezing
- [ ] Game doesn't break on browser refresh mid-combat

---

## 📊 TESTING SUMMARY

**Test Environment:**
- Browser: _______________
- OS: _______________
- Device: _______________
- Screen Size: _______________

**Critical Issues Found:**
-

**Minor Issues Found:**
-

**Visual/Polish Issues:**
-

**Overall Assessment:**
- [ ] Ready to play
- [ ] Needs minor fixes
- [ ] Needs major fixes

**Notes:**


---

## 🚀 QUICK START TEST PATH

If you have limited time, follow this path to hit the major systems:

1. **Clear localStorage** (simulate first-time player)
2. **Start New Game** → verify tutorial launches
3. **Complete tutorial** → verify combat works
4. **Select 2 heroes** → verify hero select works
5. **Fight Floor 1** → test combat and sigils
6. **Visit Floor 2 neutral** → test one neutral encounter
7. **Open Settings** → test manual save
8. **Refresh browser** → test load game
9. **Check Sigilarium** → verify encyclopedia
10. **Check visual quality** on desktop and mobile

**Time estimate:** 15-20 minutes for quick path, 1-2 hours for comprehensive testing.

---

**Happy Testing! 🐸**
