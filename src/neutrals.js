// ===== NEUTRAL DECK SYSTEM =====
function initNeutralDeck() {
S.neutralDeck = [
'shopkeeper1', 'wishingwell1', 'treasurechest1',
'wizard1', 'oracle1', 'encampment1',
'gambling1', 'ghost1', 'royal1'
];
S.lastNeutral = null;
}

function getNeutralEncounter() {
// FIRST RUN ONLY: Floor 2 gets Oracle Stage 1 as a safe intro to neutrals
if(S.floor === 2 && S.runsAttempted === 1) {
return 'oracle1';
}

// Level 18: Prioritize Stage 2s
if(S.floor === 18) {
const stage2s = S.neutralDeck.filter(n => n.includes('2'));
if(stage2s.length > 0) {
const pick = stage2s[Math.floor(Math.random() * stage2s.length)];
return pick;
}
}

// Filter out last neutral for back-to-back prevention
let available = S.neutralDeck;
if(S.lastNeutral) {
const base = S.lastNeutral.replace(/[12]$/, '');
available = available.filter(n => !n.startsWith(base));
}

// Floor 10: NEVER allow Enemy Encampment (Floor 11 is always ambush)
if(S.floor === 10) {
available = available.filter(n => !n.startsWith('encampment'));
}

if(available.length === 0) {
available = S.neutralDeck;
}

const pick = available[Math.floor(Math.random() * available.length)];
S.lastNeutral = pick;
return pick;
}

function removeNeutralFromDeck(base) {
S.neutralDeck = S.neutralDeck.filter(n => !n.startsWith(base));
}

function replaceStage1WithStage2(base) {
S.neutralDeck = S.neutralDeck.filter(n => n !== `${base}1`);
S.neutralDeck.push(`${base}2`);
}

// ===== D20 ROLLS FOR NEUTRALS =====
function rollD20Neutral() {
// Include both permanent AND temporary upgrades for neutral D20 rolls
// Active sigils are stored 0-indexed (L1 = 0), so add 1 for actual level
const d20Level = ((S.sig.D20 || 0) + (S.tempSigUpgrades.D20 || 0)) + 1;
// TUTORIAL: Explain D20 level affects neutral rolls
showTutorialPop('neutral_d20_level', "D20 checks out-of-combat use your D20 Sigil Level, too! Leveling it up grants bonus dice every time you roll, and you keep the highest result!");
return rollDice(d20Level, 20);
}

function showD20Result(rolls, best) {
// Visual dice display with highlighted best roll - improved contrast
const diceHTML = rolls.map(r => {
const isBest = r === best;
return `<span style="display:inline-block;width:2.5rem;height:2.5rem;line-height:2.5rem;text-align:center;background:${isBest ? '#166534' : '#1e293b'};border:2px solid ${isBest ? '#15803d' : '#475569'};border-radius:0.5rem;margin:0.2rem;font-weight:bold;color:${isBest ? '#bbf7d0' : '#f1f5f9'};font-size:1.2rem;${isBest ? 'box-shadow:0 0 12px rgba(22,163,74,0.6);' : ''}">${r}</span>`;
}).join(' ');
return `<div style="margin:0.5rem 0"><div style="font-size:0.9rem;margin-bottom:0.5rem;color:#4a4540">Rolling ${rolls.length}d20:</div>${diceHTML}</div>`;
}

function formatD20Compact(rolls, best) {
// Compact dice display for toasts/combat - improved contrast
const diceHTML = rolls.map(r => {
const isBest = r === best;
return `<span style="display:inline-block;width:1.8rem;height:1.8rem;line-height:1.8rem;text-align:center;background:${isBest ? '#166534' : '#1e293b'};border:2px solid ${isBest ? '#15803d' : '#475569'};border-radius:0.4rem;margin:0 0.15rem;font-weight:bold;color:${isBest ? '#bbf7d0' : '#f1f5f9'};font-size:1rem;vertical-align:middle;${isBest ? 'box-shadow:0 0 8px rgba(22,163,74,0.6);' : ''}">${r}</span>`;
}).join('');
return diceHTML;
}

function buildNeutralHTML(options) {
const {
bgImage,
title,
description,
outcomes = [],
diceRoll = '',
buttons = '',
showStats = true
} = options;

let html = `<div class="neutral-container">`;

// Left side - Content
html += '<div class="neutral-left">';

// Header with stats and narrative
html += '<div class="neutral-header">';
if(showStats) {
html += `<div class="neutral-stats">💰 ${S.gold}G | 🎯 Floor ${S.floor}</div>`;
}
html += '<div class="neutral-narrative">';
if(title) html += `<div class="neutral-title">${title}</div>`;
if(description) html += `<div class="neutral-desc">${description}</div>`;
if(diceRoll) html += `<div class="dice-roll">${diceRoll}</div>`;
outcomes.forEach(outcome => {
if(outcome) html += `<div class="neutral-outcome">${outcome}</div>`;
});
html += '</div></div>'; // close narrative and header

// Footer with buttons
if(buttons) {
html += `<div class="neutral-footer">${buttons}</div>`;
}

html += '</div>'; // close neutral-left

// Right side - Art
html += `<div class="neutral-right" style="background-image: url('${bgImage}')"></div>`;

html += '</div>'; // close container
return html;
}

// ===== MAIN TITLE PAGE =====
function mainTitlePage() {
debugLog('[FROGGLE] mainTitlePage START');
// JUICE: Funky frog beat for title screen
ProceduralMusic.startTitleBeat();
// Hide game header on title screen
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'none';

const v = document.getElementById('gameView');
debugLog('[FROGGLE] gameView element:', v);
// Check for old saves and migrate
migrateOldSave();
// If migration created slot 1 but currentSlot not set, set it
if(!S.currentSlot && localStorage.getItem('froggle8_permanent_slot1')) {
S.currentSlot = 1;
localStorage.setItem('froggle8_current_slot', '1');
debugLog('[SAVE] Set currentSlot to 1 after migration');
}
v.innerHTML = `
<div class="title-screen">
<div class="title-container">
<!-- Background image - landscape for wide screens, portrait for narrow -->
<picture>
<source media="(min-aspect-ratio: 1/1)" srcset="assets/froggle_title_wide.jpeg">
<img src="assets/froggle_title.png" alt="FROGGLE" class="title-bg-image">
</picture>
<!-- Version badge -->
<div class="title-version">v${GAME_VERSION}</div>
<!-- Left side buttons stacked -->
<div class="title-button-container">
<button class="btn title-secondary-btn" onclick="showCredits()">Credits</button>
<button class="btn title-secondary-btn" onclick="showSettingsMenu()">Settings</button>
<button class="btn title-secondary-btn" onclick="quitGame()" style="background:#dc2626;border-color:#b91c1c">Quit</button>
</div>
<!-- Play button on the right -->
<button class="btn title-play-btn" onclick="showSaveSlotSelection()">PLAY</button>
</div>
</div>`;

// Fit title image to fill viewport while maintaining aspect ratio
const titleImg = v.querySelector('.title-bg-image');
function fitTitleImage() {
  if (!titleImg || !titleImg.naturalWidth) return;

  const imgRatio = titleImg.naturalWidth / titleImg.naturalHeight;
  const viewRatio = window.innerWidth / window.innerHeight;

  if (viewRatio > imgRatio) {
    // Viewport is wider than image - fit to height, mat shows on sides
    titleImg.style.height = '100vh';
    titleImg.style.width = 'auto';
  } else {
    // Viewport is taller/equal - fit to width, mat shows on top/bottom
    titleImg.style.width = '100vw';
    titleImg.style.height = 'auto';
  }
}

// Run on load and resize
if (titleImg.complete && titleImg.naturalWidth) {
  fitTitleImage();
} else {
  titleImg.addEventListener('load', fitTitleImage);
}
window.addEventListener('resize', fitTitleImage);

// Auto-select Play button - always show focus highlight on load
setTimeout(() => {
const playBtn = document.querySelector('.title-play-btn');
if (playBtn) {
  // Always add controller-focus class to show the green highlight
  playBtn.classList.add('controller-focus');
  // Also set up GamepadController if available
  if (typeof GamepadController !== 'undefined') {
    GamepadController.updateFocusableElements();
    GamepadController.focusedElement = playBtn;
  }
}
}, 50);
}

// Quit game - works in Electron/PWA standalone, shows message in browser
function quitGame() {
showConfirmModal('Are you sure you want to quit FROGGLE?', () => {
  // Try to close the window (works in Electron, PWA standalone, or script-opened windows)
  window.close();

  // If window.close() didn't work (browser security), show a message
  setTimeout(() => {
    // Still here? Show instructions
    const v = document.getElementById('gameView');
    v.innerHTML = `
    <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a1a;padding:2rem">
    <div style="background:#22c55e;border:4px solid #000;border-radius:16px;padding:2rem;max-width:400px;text-align:center">
    <h2 style="margin:0 0 1rem 0">🐸 Thanks for playing!</h2>
    <p style="margin:0 0 1.5rem 0;opacity:0.9">Close this tab or window to exit completely.</p>
    <button class="btn" onclick="mainTitlePage()" style="background:#6366f1">Return to Title</button>
    </div>
    </div>`;
  }, 100);
});
}

// Show credits screen
function showCredits() {
// JUICE: Funky frog beat for credits
ProceduralMusic.startTitleBeat();
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);padding:1rem;overflow-y:auto">
<div style="background:rgba(255,255,255,0.95);border:4px solid #000;border-radius:16px;padding:2rem;max-width:500px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
<h2 style="text-align:center;margin:0 0 1rem 0;font-size:1.8rem;color:#4f46e5">🐸 FROGGLE 🐸</h2>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.95rem;margin:0 0 0.25rem 0;color:#1e1b4b">A DubsPubs game by</p>
<p style="font-size:1.3rem;font-weight:bold;margin:0;color:#22c55e">Preston Wesley Evans</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.9rem;margin:0;color:#1e1b4b"><strong>Design, Art, & Code:</strong> Preston + Claude</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Playtesting</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563;line-height:1.5">Michael Griffin, Charlie Schmidt, Carolyn Powell, Matt Sutz, Ryan Evertz, Noel McKillip, Ray Willess</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Inspiration</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563">Inscryption, Slay the Spire, Balatro, and too much coffee</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Sanity</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563">Erin Keif, Adal Rfai, JPC, Odell Brewing</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Support</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563">Lisa Evans</p>
</div>

<div style="text-align:center;margin-bottom:1rem;padding:0.5rem;background:#fef3c7;border-radius:8px">
<p style="font-size:0.8rem;margin:0;color:#92400e">Version ${GAME_VERSION}</p>
</div>

<button class="btn" onclick="mainTitlePage()" style="width:100%;background:#6366f1;border:3px solid #4f46e5;font-weight:bold">Back to Title</button>
</div>
</div>`;
}

// Format timestamp as readable date
function formatSaveDate(timestamp) {
if(!timestamp) return '';
const d = new Date(timestamp);
const month = d.toLocaleDateString('en-US', { month: 'short' });
const day = d.getDate();
const hour = d.getHours();
const min = d.getMinutes().toString().padStart(2, '0');
const ampm = hour >= 12 ? 'PM' : 'AM';
const hour12 = hour % 12 || 12;
return `${month} ${day}, ${hour12}:${min} ${ampm}`;
}

// Show save slot selection screen
function showSaveSlotSelection() {
const v = document.getElementById('gameView');
const slot1 = getSlotMetadata(1);
const slot2 = getSlotMetadata(2);
const slot3 = getSlotMetadata(3);

v.innerHTML = `
<div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a1a;padding:1rem;overflow:hidden;box-sizing:border-box">
<div style="background:#22c55e;border:4px solid #000;border-radius:12px;padding:1rem;max-width:500px;width:100%;box-shadow:0 8px 16px rgba(0,0,0,0.5);max-height:95vh;overflow-y:auto">
<h2 style="text-align:center;margin-bottom:1rem;font-size:1.3rem;color:#000">Select Save Slot</h2>

<!-- Slot 1 -->
<div style="background:white;border:3px solid #000;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem;color:#1a1a1a">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
<h3 style="font-size:1.1rem;margin:0;color:#1a1a1a">Slot 1</h3>
${slot1.lastSaved ? `<span style="font-size:0.75rem;color:#6b7280">📅 ${formatSaveDate(slot1.lastSaved)}</span>` : ''}
</div>
${slot1.exists ? `
<div style="font-size:0.85rem;color:#374151;margin-bottom:0.5rem">
<div>📊 Runs: <strong>${slot1.runsAttempted}</strong> | 💰 Rate: <strong>${slot1.goingRate}G</strong></div>
${slot1.hasActiveRun ? `<div style="color:#16a34a;font-weight:bold">🎮 Active Run${slot1.activeFloor ? ` - Floor ${slot1.activeFloor}` : ''}</div>` : ''}
</div>
<div style="display:flex;gap:0.5rem">
<button class="btn" onclick="continueSlot(1)" style="flex:1;background:#22c55e;border:3px solid #16a34a;font-weight:bold;padding:0.5rem">${slot1.hasActiveRun ? '▶️ Continue' : '🆕 New Run'}</button>
<button class="btn secondary icon" onclick="confirmDeleteSlot(1)" style="padding:0.5rem">🗑️</button>
</div>
` : `
<p style="color:#6b7280;margin-bottom:0.5rem;font-size:0.9rem">Empty Slot</p>
<button class="btn" onclick="createNewSlot(1)" style="width:100%;background:#3b82f6;border:3px solid #f97316;font-weight:bold;padding:0.5rem">🆕 New Game</button>
`}
</div>

<!-- Slot 2 -->
<div style="background:white;border:3px solid #000;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem;color:#1a1a1a">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
<h3 style="font-size:1.1rem;margin:0;color:#1a1a1a">Slot 2</h3>
${slot2.lastSaved ? `<span style="font-size:0.75rem;color:#6b7280">📅 ${formatSaveDate(slot2.lastSaved)}</span>` : ''}
</div>
${slot2.exists ? `
<div style="font-size:0.85rem;color:#374151;margin-bottom:0.5rem">
<div>📊 Runs: <strong>${slot2.runsAttempted}</strong> | 💰 Rate: <strong>${slot2.goingRate}G</strong></div>
${slot2.hasActiveRun ? `<div style="color:#16a34a;font-weight:bold">🎮 Active Run${slot2.activeFloor ? ` - Floor ${slot2.activeFloor}` : ''}</div>` : ''}
</div>
<div style="display:flex;gap:0.5rem">
<button class="btn" onclick="continueSlot(2)" style="flex:1;background:#22c55e;border:3px solid #16a34a;font-weight:bold;padding:0.5rem">${slot2.hasActiveRun ? '▶️ Continue' : '🆕 New Run'}</button>
<button class="btn secondary icon" onclick="confirmDeleteSlot(2)" style="padding:0.5rem">🗑️</button>
</div>
` : `
<p style="color:#6b7280;margin-bottom:0.5rem;font-size:0.9rem">Empty Slot</p>
<button class="btn" onclick="createNewSlot(2)" style="width:100%;background:#3b82f6;border:3px solid #f97316;font-weight:bold;padding:0.5rem">🆕 New Game</button>
`}
</div>

<!-- Slot 3 -->
<div style="background:white;border:3px solid #000;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem;color:#1a1a1a">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
<h3 style="font-size:1.1rem;margin:0;color:#1a1a1a">Slot 3</h3>
${slot3.lastSaved ? `<span style="font-size:0.75rem;color:#6b7280">📅 ${formatSaveDate(slot3.lastSaved)}</span>` : ''}
</div>
${slot3.exists ? `
<div style="font-size:0.85rem;color:#374151;margin-bottom:0.5rem">
<div>📊 Runs: <strong>${slot3.runsAttempted}</strong> | 💰 Rate: <strong>${slot3.goingRate}G</strong></div>
${slot3.hasActiveRun ? `<div style="color:#16a34a;font-weight:bold">🎮 Active Run${slot3.activeFloor ? ` - Floor ${slot3.activeFloor}` : ''}</div>` : ''}
</div>
<div style="display:flex;gap:0.5rem">
<button class="btn" onclick="continueSlot(3)" style="flex:1;background:#22c55e;border:3px solid #16a34a;font-weight:bold;padding:0.5rem">${slot3.hasActiveRun ? '▶️ Continue' : '🆕 New Run'}</button>
<button class="btn secondary icon" onclick="confirmDeleteSlot(3)" style="padding:0.5rem">🗑️</button>
</div>
` : `
<p style="color:#6b7280;margin-bottom:0.5rem;font-size:0.9rem">Empty Slot</p>
<button class="btn" onclick="createNewSlot(3)" style="width:100%;background:#3b82f6;border:3px solid #f97316;font-weight:bold;padding:0.5rem">🆕 New Game</button>
`}
</div>

<button class="btn secondary" onclick="mainTitlePage()" style="width:100%;padding:0.5rem">← Back</button>
</div>
</div>`;
}

// Continue/start a slot
function continueSlot(slot) {
const meta = getSlotMetadata(slot);
if(meta.hasActiveRun) {
// Load existing run
if(loadSlot(slot)) {
// Success - game already started
} else {
toast('Save data corrupted. Try starting a new game in this slot.');
}
} else {
// Start new run in existing slot
S.runsAttempted = (meta.runsAttempted || 0) + 1;
newGameInSlot(slot);
}
}

// Create new game in empty slot
function createNewSlot(slot) {
S.currentSlot = slot;
localStorage.setItem('froggle8_current_slot', slot.toString());
// Reset ALL permanent state for a fresh slot
S.gold = 0;
S.goingRate = 1;
S.startingXP = 0;
S.sig = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.sigUpgradeCounts = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.pedestal = [];
S.hasReachedFloor20 = false;
S.fuUnlocked = false;
S.forcedFUEntry = false;
S.tapoUnlocked = false;
S.pondHistory = [];
S.questsCompleted = {};
S.questsClaimed = {};
S.questProgress = {
  // Combat stats
  enemiesKilled: 0,
  totalDamageDealt: 0,
  maxDamageOneAction: 0,
  maxTargetsOneAction: 0,
  lastStandSurvived: false,
  // Action usage
  d20Used: false,
  shieldApplied: false,
  healUsed: false,
  grappleUsed: false,
  alphaUsed: false,
  ghostBlocked: false,
  // Per-hero tracking
  heroesPlayed: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },
  heroWins: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },
  // Neutral encounters
  neutralsCompleted: { shopkeeper: false, wishingwell: false, treasurechest: false, wizard: false, oracle: false, encampment: false, gambling: false, ghost: false, royal: false },
  // Enemy types
  enemyTypesDefeated: { Goblin: false, Wolf: false, Orc: false, Giant: false, 'Cave Troll': false, Dragon: false, Flydra: false },
  // Milestones
  highestFloor: 0,
  totalGoldEarned: 0,
  totalRunsCompleted: 0,
  standardWins: 0,
  fuWins: 0,
  maxRecruitsHeld: 0,
  purchasedUpgrade: false,
  // Repeatable quest tiers
  slayerTier: 0,
  goldDiggerTier: 0,
  veteranTier: 0
};
S.ghostBoysConverted = false;
S.advancedSigilsUnlocked = false;
S.passiveSigilsUnlocked = false;
S.ancientStatueDeactivated = false;
S.tutorialFlags = {};
S.usedDeathQuotes = [];
S.runsAttempted = 1;
S.runNumber = 1;
newGame();
}

// Start new game in existing slot
function newGameInSlot(slot) {
S.currentSlot = slot;
localStorage.setItem('froggle8_current_slot', slot.toString());
S.runNumber = (S.runsAttempted || 1);
if(S.runNumber === 1 && !S.tutorialDisabled) {
showTutorialStory();
} else {
// Go to Ribbleton hub first, player clicks red portal to start run
showRibbleton();
}
}

// Delete slot with confirmation
function confirmDeleteSlot(slot) {
showConfirmModal(`Delete Save Slot ${slot}? This cannot be undone!`, () => {
try {
localStorage.removeItem(`froggle8_slot${slot}`);
localStorage.removeItem(`froggle8_permanent_slot${slot}`);
toast(`Slot ${slot} deleted`);
showSaveSlotSelection(); // Refresh
} catch(e) {
toast('Delete failed. Browser storage may be locked.');
}
});
}

function newGame() {
// Reset runNumber to 1 for new game (allows tutorial to show)
S.runNumber = 1;
debugLog('[FROGGLE] newGame called - runNumber:', S.runNumber, 'tutorialDisabled:', S.tutorialDisabled);
if(S.runNumber === 1 && !S.tutorialDisabled) {
debugLog('[FROGGLE] Showing tutorial story');
showTutorialStory();
} else {
debugLog('[FROGGLE] Skipping tutorial, going to Ribbleton');
// Go to Ribbleton hub first, player clicks red portal to start run
showRibbleton();
}
}

function loadGameFromTitle() {
const s = localStorage.getItem('froggle8');
if(s) {
loadGame();
} else {
toast('No saved game found!');
}
}

function exitGame() {
showConfirmModal('Thanks for playing FROGGLE! Close the window to exit.', () => {
window.close();
});
}

function exportSave() {
const saveData = localStorage.getItem('froggle8');
const permanentData = localStorage.getItem('froggle8_permanent');
if(!saveData && !permanentData) {
toast('No save data to export!');
return;
}
const exportData = {
save: saveData ? JSON.parse(saveData) : null,
permanent: permanentData ? JSON.parse(permanentData) : null,
exportDate: new Date().toISOString(),
version: GAME_VERSION
};
const dataStr = JSON.stringify(exportData, null, 2);
const blob = new Blob([dataStr], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `froggle-save-${new Date().toISOString().split('T')[0]}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
toast('Save exported!');
}

function importSave() {
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = (e) => {
const file = e.target.files[0];
if(!file) return;
const reader = new FileReader();
reader.onload = (event) => {
try {
const importData = JSON.parse(event.target.result);
if(importData.save) {
localStorage.setItem('froggle8', JSON.stringify(importData.save));
}
if(importData.permanent) {
localStorage.setItem('froggle8_permanent', JSON.stringify(importData.permanent));
}
toast('Save imported successfully!');
setTimeout(() => {
mainTitlePage();
}, 1000);
} catch(err) {
toast('Invalid file format. Make sure to select a FROGGLE save file (.json)');
console.error('Import error:', err);
}
};
reader.readAsText(file);
};
input.click();
}

// ===== NARRATIVE SLIDE SYSTEM =====
// Slides can have: text, html, bg (background image), buttonText
// If slide has 'bg' property, renders in full-art mode
function showNarrativeSlide(slides, currentIndex = 0) {
debugLog('[FROGGLE] showNarrativeSlide called - currentIndex:', currentIndex, 'total slides:', slides.length);
if(currentIndex >= slides.length) {
// All slides shown, call completion callback
debugLog('[FROGGLE] All slides complete, calling onComplete');
// Remove no-scroll class when narrative is done
const gameArea = document.getElementById('gameView');
if(gameArea) gameArea.classList.remove('no-scroll');
if(slides.onComplete) slides.onComplete();
return;
}

const slide = slides[currentIndex];
debugLog('[FROGGLE] Rendering slide', currentIndex);

// Check if this slide has an action that should trigger immediately (no text to show)
// Actions with real text (like statue_slotting) are triggered in continueNarrative after user reads
const isPlaceholderText = slide.text && typeof slide.text === 'string' && slide.text.startsWith('INTERSTITIAL_');
if(slide.action && isPlaceholderText && window.firstVictorySlideAction) {
const handled = window.firstVictorySlideAction(slide.action, currentIndex, () => {
// Action complete, continue to next slide
showNarrativeSlide(slides, currentIndex + 1);
});
if(handled) return; // Action handler will call callback when done
}

const v = document.getElementById('gameView');
debugLog('[FROGGLE] gameView element:', v);
// Add no-scroll class to prevent scrolling on full-screen slides
v.classList.add('no-scroll');
const skipButton = slides.skippable ? `<button class="btn" onclick="skipTutorialFromSlide()" style="padding:0.75rem 1.5rem;background:rgba(100,100,100,0.8);border:2px solid #666;font-size:1rem">Skip</button>` : '';
// Resolve text - may be a function for dynamic content
const slideText = typeof slide.text === 'function' ? slide.text() : slide.text;
debugLog('[FROGGLE] Setting innerHTML for slide', currentIndex);

// Full-art mode: background image takes up screen, text in bottom bar
if(slide.bg) {
const bgStyle = slide.bgStyle || '';
v.innerHTML = `
<div class="full-screen-content" style="position:relative;width:100%;overflow:hidden;background:#1a5c3a">
<!-- Full-page background image -->
<img src="${slide.bg}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;${bgStyle}">

<!-- Compact text bar at bottom -->
<div style="position:absolute;bottom:0;left:0;right:0;z-index:10;background:rgba(0,0,0,0.75);padding:0.6rem 1rem 0.5rem 1rem;border-top:2px solid rgba(34,197,94,0.5)">
<div style="max-width:700px;margin:0 auto">
${slide.html || `<div class="narrative-text" style="font-size:1.05rem;line-height:1.5;text-align:center;color:#fff;text-shadow:1px 1px 3px rgba(0,0,0,0.9)">${slideText}</div>`}
<div style="display:flex;gap:0.75rem;justify-content:center;margin-top:0.6rem;flex-wrap:wrap;align-items:center">
<button class="btn" onclick="continueNarrative()" style="padding:0.4rem 1.25rem;font-size:0.95rem;background:#22c55e;border:2px solid #15803d">${slide.buttonText || 'Continue'}</button>
${skipButton}
<span style="font-size:0.75rem;color:rgba(255,255,255,0.5)">Ⓐ${slides.skippable ? '/Ⓑ skip' : ''}</span>
</div>
</div>
</div>
</div>`;
} else {
// Standard mode: fullscreen centered content with backdrop for readability
v.innerHTML = `
<div class="full-screen-content" style="width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:1rem;background:rgba(0,0,0,0.3)">
<div style="max-width:700px;text-align:center;background:rgba(0,0,0,0.8);padding:2rem;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
${slide.html || `<div class="narrative-text" style="font-size:1.3rem;line-height:1.75;margin-bottom:1.5rem;color:#f5f5f5">${slideText}</div>`}
<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:1.25rem">
<button class="btn" onclick="continueNarrative()" style="padding:0.85rem 2.5rem;font-size:1.15rem">${slide.buttonText || 'Continue'}</button>
${skipButton}
</div>
<div style="margin-top:1rem;font-size:0.9rem;opacity:0.6;color:#ccc">Ⓐ to continue${slides.skippable ? ' • Ⓑ to skip' : ''}</div>
</div>
</div>`;
}

window.currentNarrativeSlides = slides;
window.currentNarrativeIndex = currentIndex;
window.narrativeSlideShownAt = Date.now(); // Track when slide was shown for minimum display time
debugLog('[FROGGLE] Slide', currentIndex, 'rendered successfully');
}

function continueNarrative() {
// Enforce minimum 500ms display time to prevent accidental skips
if(window.narrativeSlideShownAt && Date.now() - window.narrativeSlideShownAt < 500) {
return; // Too soon, ignore the click
}

const slides = window.currentNarrativeSlides;
const currentSlide = slides[window.currentNarrativeIndex];
const nextIndex = window.currentNarrativeIndex + 1;

// Check if current slide has an action that needs to be handled
if(currentSlide && currentSlide.action && window.firstVictorySlideAction) {
const handled = window.firstVictorySlideAction(currentSlide.action, window.currentNarrativeIndex, () => {
// Action complete, continue to next slide
showNarrativeSlide(slides, nextIndex);
});
if(handled) return; // Action handler will call callback when done
}

showNarrativeSlide(slides, nextIndex);
}

function showSkipTutorialConfirmation(proceedCallback) {
// Show friendly skip confirmation with visual indicators for FAQ/Sigilarium
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:500px">
<h2 style="font-size:1.5rem;margin-bottom:1rem;text-align:center">Alright champ! 💪</h2>
<p style="font-size:1.1rem;line-height:1.6;text-align:center;margin-bottom:1.5rem">
You're on your own - get going and save Tapo!
</p>
<div style="background:rgba(59,130,246,0.1);border:2px solid #3b82f6;border-radius:12px;padding:1rem;margin-bottom:1.5rem">
<p style="font-size:0.95rem;line-height:1.5;text-align:center;margin-bottom:0.75rem">
Need help? Look for these buttons:
</p>
<div style="display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap">
<div style="text-align:center">
<div style="font-size:1.5rem;margin-bottom:0.25rem">👇</div>
<div style="background:#f97316;color:white;padding:0.5rem 1rem;border-radius:8px;font-weight:bold;border:2px solid #000">❓ Help/FAQ</div>
</div>
<div style="text-align:center">
<div style="font-size:1.5rem;margin-bottom:0.25rem">👇</div>
<div style="background:#9333ea;color:white;padding:0.5rem 1rem;border-radius:8px;font-weight:bold;border:2px solid #000">📖 Sigilarium</div>
</div>
</div>
</div>
<p style="font-size:0.8rem;line-height:1.4;text-align:center;margin-bottom:1.5rem;opacity:0.7">
(Help/tips can be disabled in ⚙️ Settings)
</p>
<button onclick="confirmSkipTutorial()" style="padding:0.75rem 2rem;font-size:1.1rem;font-weight:bold;background:#22c55e;color:#fff;border:2px solid #15803d;border-radius:8px;cursor:pointer;display:block;margin:0 auto">Let's go!</button>
</div>`;
document.body.appendChild(overlay);
window.skipTutorialProceedCallback = proceedCallback;
}

function confirmSkipTutorial() {
const overlay = document.querySelector('.tutorial-modal-backdrop');
if(overlay) overlay.remove();
if(window.skipTutorialProceedCallback) {
window.skipTutorialProceedCallback();
window.skipTutorialProceedCallback = null;
}
}

function skipTutorialFromSlide() {
// Show confirmation popup before skipping
showSkipTutorialConfirmation(() => {
// Remove no-scroll class when leaving narrative
const gameArea = document.getElementById('gameView');
if(gameArea) gameArea.classList.remove('no-scroll');
toast('Tutorial skipped!', ANIMATION_TIMINGS.TOAST_SHORT);
setTimeout(() => transitionScreen(showTitleCard), ANIMATION_TIMINGS.ACTION_COMPLETE);
});
}

// ===== RIBBLETON TUTORIAL INTRO =====
function showTutorialStory() {
debugLog('[FROGGLE] showTutorialStory START');
const slides = [
{
// Full-art: Ribbleton background with text overlay
bg: 'assets/ribbleton.png',
text: `Welcome to the beautiful, tranquil town of <strong style="color:#22c55e">Ribbleton</strong>.<br><br>Today is a very special day!! Why, you ask?`
},
{
// Tapo with birthday vibes - signature double jump + flip animation
html: `
<h2 style="font-size:1.8rem;margin-bottom:1rem;color:#f5f5f5">Today is <strong style="color:#22c55e">Tapo's First Birthday!</strong> 🎂</h2>
<div style="animation:tapoSignature 3.6s ease-in-out infinite;display:inline-block;margin:1.5rem 0">
<img src="assets/tapo-nobg.png" alt="Tapo the tadpole" style="width:170px;height:auto">
</div>
<p style="font-size:1.15rem;line-height:1.7;margin-top:1rem;color:#f5f5f5">The whole town is celebrating the little tadpole's special day!</p>
<style>
@keyframes tapoSignature {
  /* Quick hop 1 */
  0% { transform: translateY(0) scaleX(1); }
  7% { transform: translateY(-20px) scaleX(1); }
  14% { transform: translateY(0) scaleX(1); }
  /* Quick hop 2 */
  21% { transform: translateY(-28px) scaleX(1); }
  28% { transform: translateY(0) scaleX(1); }
  /* Flip to face LEFT - halved stationary gap */
  29.5% { transform: translateY(-8px) scaleX(0); }
  33.5% { transform: translateY(0) scaleX(-1); }
  /* Pause facing left */
  47% { transform: translateY(0) scaleX(-1); }
  /* Quick hop 1 LEFT */
  50% { transform: translateY(0) scaleX(-1); }
  57% { transform: translateY(-20px) scaleX(-1); }
  64% { transform: translateY(0) scaleX(-1); }
  /* Quick hop 2 LEFT */
  71% { transform: translateY(-28px) scaleX(-1); }
  78% { transform: translateY(0) scaleX(-1); }
  /* Flip back to RIGHT - halved stationary gap */
  79.5% { transform: translateY(-8px) scaleX(0); }
  83.5% { transform: translateY(0) scaleX(1); }
  /* Pause facing right */
  100% { transform: translateY(0) scaleX(1); }
}
</style>
`
},
{
html: `
<h2 style="font-size:1.7rem;margin-bottom:1rem;color:#2c63c7">A Special Gift</h2>
<div style="display:flex;justify-content:center;align-items:center;gap:2rem;margin:1.5rem 0">
<div>
<img src="assets/reactions/mage-happy.jpeg" alt="Mage smiling" style="width:130px;height:auto;border-radius:8px;border:2px solid #22c55e;box-shadow:0 4px 8px rgba(0,0,0,0.2)">
<div style="margin-top:0.5rem;font-weight:bold;font-size:1rem;color:#f5f5f5">Mage</div>
</div>
<div style="font-size:2.5rem;display:flex;flex-direction:column;align-items:center;gap:0.25rem">
<span>🪰</span>
<span>🎁</span>
</div>
<div style="animation:tapoSignature 3.6s ease-in-out infinite">
<img src="assets/tapo-nobg.png" alt="Tapo" style="width:110px;height:auto">
<div style="margin-top:0.5rem;font-weight:bold;font-size:1rem;color:#f5f5f5">Tapo</div>
</div>
</div>
<p style="font-size:1.15rem;line-height:1.7;margin-top:1rem;color:#f5f5f5">
As a birthday gift, <strong>Mage</strong> promised to teach Tapo how to catch flies.
</p>
`
}
];
slides.skippable = true;
slides.onComplete = () => {
// Start Phase 1: Tapo's Birthday tutorial
startTaposBirthdayTutorial();

setTimeout(() => {
showTaposBirthdayOverlay();
}, 100);
};
debugLog('[FROGGLE] About to call showNarrativeSlide with', slides.length, 'slides');
showNarrativeSlide(slides, 0);
debugLog('[FROGGLE] showNarrativeSlide called');
}

function showTaposBirthdayOverlay() {
// Show Phase 1 narrative overlay - positioned at bottom to not obscure combat
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.style.cssText = 'background:rgba(0,0,0,0.4);align-items:flex-end;padding-bottom:2rem;';
overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:400px;padding:1rem 1.5rem;background:rgba(31,41,55,0.95);border-width:3px;">
<p style="font-size:1.1rem;line-height:1.5;margin:0.5rem 0;padding:0.5rem 0.75rem;">
🪰 Here come three <strong>flies</strong> now - you're up! 🪰
</p>
<button onclick="dismissTaposBirthdayOverlay()" style="margin-top:0.75rem;padding:0.6rem 1.5rem;font-size:1rem;">Let's catch flies!</button>
</div>`;
document.body.appendChild(overlay);
}

function dismissTaposBirthdayOverlay() {
try {
const allBackdrops = document.querySelectorAll('.tutorial-modal-backdrop');
allBackdrops.forEach(backdrop => backdrop.remove());
} catch (error) {
console.error('[TUTORIAL] Error removing Tapo birthday backdrops:', error);
}
// Show first tutorial popup - explain Expand from the start
showTutorialPop('tapo_first_attack', "Mage has <strong>Attack</strong> (an active sigil that costs your turn) and <strong>Expand</strong> (a passive sigil with automatic effects). Use Attack to hit 2 flies at once!", () => {
tutorialState.stage = 'catching_flies';
// Mage is happy to teach Tapo to catch flies!
const mage = S.heroes.find(h => h.n === 'Mage');
if(mage) setHeroReaction(mage.id, 'happy', 2000);
render();
});
}

function startTaposBirthdayTutorial() {
// Phase 1: Mage vs 3 Flies - Mage has Attack + Expand (no D20 - explained later)
S.floor = 0;
S.xp = 0;
S.levelUpCount = 0;
// Initialize sigils to base levels for clean tutorial state
S.sig = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// Reset tutorial-specific flags to ensure popups show for fresh tutorial
S.tutorialFlags.tapo_first_attack = false;
// Force tips and tutorial enabled for tutorial (critical popups must show)
S.helpTipsDisabled = false;
S.tutorialDisabled = false;
S.heroes = [
{id:'h_tutorial_mage', n:'Mage', p:1, h:5, m:5, s:['Attack', 'Expand'], sh:0, g:0, ls:false, lst:0, ts:[], st:0}
];

// Initialize Phase 1 tutorial state
tutorialState = {
stage: 'waiting_for_start',
phase: 1, // Track which phase we're in
fliesKilled: 0,
round: 1
};

// Start combat with 3 Flies
combat(0);
}

// Tapo rescue sequence - called when Mage would die in Phase 1 tutorial
// Shows a narrative interstitial, then animates flies dying one by one
function showTapoRescueSequence() {
// Save reference to remaining flies for the death sequence
const remainingFlies = [...S.enemies];
const flyCount = remainingFlies.length;
const flyText = flyCount === 1 ? 'fly' : 'flies';

// Create narrative overlay explaining what happened
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:600px">
<div style="text-align:center">
<div style="animation:tapoSignatureRescue 3s ease-in-out infinite;display:inline-block;margin-bottom:1rem">
<img src="assets/tapo-nobg.png" alt="Tapo" style="width:120px;height:auto">
</div>
<h2 style="color:#22c55e;margin-bottom:1rem">Tapo to the Rescue!</h2>
<p style="font-size:1.1rem;line-height:1.7;margin-bottom:1.5rem">
Just as the ${flyText} ${flyCount === 1 ? 'is' : 'are'} about to finish off Mage, <strong style="color:#22c55e">Tapo</strong> leaps into action!
<br><br>
His sticky tongue lashes out and <strong>swallows the ${flyText} whole!</strong>
<br><br>
<span style="font-size:0.9rem;opacity:0.8">(In normal combat, your hero would enter "Last Stand" mode - but Tapo's got your back for now!)</span>
</p>
<button onclick="continueTapoRescue()" style="padding:1rem 2.5rem;font-size:1.3rem;font-weight:bold;background:#22c55e;color:#fff;border:2px solid #15803d;border-radius:8px;cursor:pointer">
*ribbit* 🪰
</button>
</div>
</div>
<style>
@keyframes tapoSignatureRescue {
  /* Quick hop 1 */
  0% { transform: translateY(0) scaleX(1); }
  8% { transform: translateY(-20px) scaleX(1); }
  16% { transform: translateY(0) scaleX(1); }
  /* Quick hop 2 */
  24% { transform: translateY(-28px) scaleX(1); }
  32% { transform: translateY(0) scaleX(1); }
  /* Flip to face LEFT */
  36% { transform: translateY(-8px) scaleX(0); }
  40% { transform: translateY(0) scaleX(-1); }
  /* Quick hop 1 LEFT */
  48% { transform: translateY(-20px) scaleX(-1); }
  56% { transform: translateY(0) scaleX(-1); }
  /* Quick hop 2 LEFT */
  64% { transform: translateY(-28px) scaleX(-1); }
  72% { transform: translateY(0) scaleX(-1); }
  /* Flip back to RIGHT */
  76% { transform: translateY(-8px) scaleX(0); }
  80% { transform: translateY(0) scaleX(1); }
  /* Pause facing right */
  100% { transform: translateY(0) scaleX(1); }
}
</style>`;
document.body.appendChild(overlay);

// Store flies for death animation
window.tapoRescueFlies = remainingFlies;
}

// Continue after Tapo rescue narrative - animate flies dying
function continueTapoRescue() {
// Remove narrative overlay
const backdrops = document.querySelectorAll('.tutorial-modal-backdrop');
backdrops.forEach(b => b.remove());

// Play ribbit sound
SoundFX.play('ribbit');

// Get the saved flies
const flies = window.tapoRescueFlies || [];
window.tapoRescueFlies = null;

// Re-render combat view to show the battlefield
render();

// Kill flies one by one with staggered timing
flies.forEach((fly, index) => {
setTimeout(() => {
// Set fly HP to 0
fly.h = 0;
// Trigger knockout animation
if(typeof triggerKnockout === 'function') {
triggerKnockout(fly.id);
}
// Remove fly after animation
setTimeout(() => {
S.enemies = S.enemies.filter(e => e.id !== fly.id);
render();

// After last fly is removed, wait then proceed
if(index === flies.length - 1) {
setTimeout(() => {
// Show brief "battlefield clear" moment, then proceed
finishTaposBirthdayPhase();
}, 800); // Pause on empty battlefield
}
}, 300); // Death animation duration
}, index * 500); // Stagger each fly death by 500ms
});

// If no flies for some reason, just proceed
if(flies.length === 0) {
setTimeout(() => {
finishTaposBirthdayPhase();
}, 500);
}
}

function finishTaposBirthdayPhase() {
// Phase 1 victory celebration
const v = document.getElementById('gameView');
v.classList.add('no-scroll');
v.innerHTML = `
<style>
@keyframes danceTapo {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(-5deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-10px) rotate(5deg); }
}
</style>
<div class="full-screen-content" style="width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:1rem">
<div style="max-width:600px;text-align:center">
<h2 style="font-size:2.5rem;margin-bottom:0.5rem;color:#22c55e">Success!!</h2>
<div style="animation:danceTapo 0.5s ease-in-out infinite;margin:1rem 0">
<img src="assets/tapo-nobg.png" alt="Tapo" style="width:100px;height:auto">
</div>
<p style="font-size:1.2rem;line-height:1.7;margin:1rem 0;color:#fff;background:rgba(0,0,0,0.7);padding:1rem;border-radius:8px">
Tapo squeals with delight as you knock the flies out of the air!<br>
Belly overflowing with delicious fresh flies, Mage and Tapo return to Ribbleton. 🎉
</p>
<button onclick="transitionToPortalInvasion()" style="padding:1rem 2rem;font-size:1.2rem;font-weight:bold;background:#22c55e;color:#fff;border:2px solid #15803d;border-radius:8px;cursor:pointer;margin-top:1.5rem">Continue</button>
</div>
</div>`;
}

function transitionToPortalInvasion() {
// Show portal opening narrative
const slides = [
{
html: `
<h2 style="font-size:1.8rem;margin-bottom:1rem;color:#dc2626;animation:shake 0.5s ease-in-out infinite">DANGER!</h2>
<div style="margin:1.5rem 0;position:relative">
<div style="width:160px;height:160px;margin:0 auto;position:relative;border-radius:50%;background:radial-gradient(circle, #dc2626, #7c2d12);animation:narrativePortalPulse 1s ease-in-out infinite;box-shadow:0 0 40px #dc2626"></div>
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:3.5rem;animation:spin 2s linear infinite">🌀</div>
</div>
<p style="font-size:1.1rem;line-height:1.7;margin:1rem 0;color:#f5f5f5">
As Mage and Tapo enter Ribbleton, something seems off..<br>
Whoa! <strong>A dark portal</strong> is open in the center of square!
</p>
<div style="display:flex;justify-content:center;gap:2rem;margin:1rem 0;font-size:2.5rem">
<div style="animation:enemyAppear 1s ease-out">👺</div>
<div style="animation:enemyAppear 1.3s ease-out">🐺</div>
</div>
<style>
@keyframes shake {
0%, 100% { transform: translateX(0); }
25% { transform: translateX(-5px); }
75% { transform: translateX(5px); }
}
@keyframes narrativePortalPulse {
0%, 100% { transform: scale(1); opacity: 0.8; }
50% { transform: scale(1.1); opacity: 1; }
}
@keyframes spin {
from { transform: translate(-50%, -50%) rotate(0deg); }
to { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes enemyAppear {
from { transform: scale(0) rotate(-180deg); opacity: 0; }
to { transform: scale(1) rotate(0deg); opacity: 1; }
}
</style>
`
}
];
slides.onComplete = () => {
// Start Phase 2: Portal Invasion
startRibbletonTutorial();

setTimeout(() => {
showTutorialStoryOverlay();
}, 100);
};
showNarrativeSlide(slides, 0);
}

function showTutorialStoryOverlay() {
// Show narrative on TOP of combat screen with Ribbleton background
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.style.cssText = 'background:none;';
overlay.innerHTML = `
<div style="position:relative;width:100%;height:100%;overflow:hidden">
<!-- Full-page Ribbleton background -->
<img src="assets/ribbleton.png" alt="" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;filter:brightness(0.7)">

<!-- Content overlay -->
<div style="position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100%;padding:1rem">
<div style="background:rgba(0,0,0,0.85);border-radius:16px;padding:1.5rem;max-width:550px;border:3px solid #dc2626;box-shadow:0 0 30px rgba(220,38,38,0.5)">
<p style="font-size:1.1rem;line-height:1.6;margin-bottom:1.5rem;color:#fff;text-align:center">
Strange, hostile creatures spill out of the <strong style="color:#dc2626">portal</strong>. Take control of Warrior and Healer to fend them off!
</p>
<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:1.5rem;align-items:center;margin:1.5rem 0">
<div style="display:flex;gap:0.5rem;align-items:center;justify-content:center">
<div style="animation:defensiveStance 1.5s ease-in-out infinite">
<img src="assets/characters/tankfull.png" alt="Tank" style="width:70px;height:auto;border-radius:6px;border:2px solid #22c55e;transform:scaleX(-1)">
<div style="text-align:center;font-size:0.65rem;font-weight:bold;margin-top:0.25rem;color:#22c55e">🛡 On Guard!</div>
</div>
<div style="text-align:center">
<div style="animation:tapoSignatureSmall 3s ease-in-out infinite;display:inline-block">
<img src="assets/tapo-nobg.png" alt="Tapo" style="width:60px;height:auto">
</div>
<div style="font-size:0.65rem;color:#22c55e;margin-top:0.25rem">Protected!</div>
</div>
<div style="animation:defensiveStance 1.3s ease-in-out infinite">
<img src="assets/characters/magefull.png" alt="Mage" style="width:70px;height:auto;border-radius:6px;border:2px solid #22c55e">
<div style="text-align:center;font-size:0.65rem;font-weight:bold;margin-top:0.25rem;color:#22c55e">📖 On Guard!</div>
</div>
</div>
<div style="display:flex;flex-direction:column;gap:0.5rem;align-items:center">
<div style="animation:chargeForward 0.8s ease-out infinite alternate">
<img src="assets/characters/warriorfull.png" alt="Warrior" style="width:80px;height:auto;border-radius:6px;border:2px solid #3b82f6;transform:scaleX(-1)">
<div style="text-align:center;font-size:0.7rem;font-weight:bold;margin-top:0.25rem;color:#3b82f6">⚔️ Attacking!</div>
</div>
<div style="animation:chargeForward 1s ease-out infinite alternate">
<img src="assets/characters/healerfull.png" alt="Healer" style="width:80px;height:auto;border-radius:6px;border:2px solid #3b82f6;transform:scaleX(-1)">
<div style="text-align:center;font-size:0.7rem;font-weight:bold;margin-top:0.25rem;color:#3b82f6">✚ Attacking!</div>
</div>
</div>
<div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;font-size:2.5rem">
<div style="animation:enemyThreat 1s ease-in-out infinite">👺</div>
<div style="animation:enemyThreat 1.2s ease-in-out infinite">🐺</div>
</div>
</div>
<div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
<button onclick="dismissStoryOverlay()" style="padding:0.75rem 2rem;font-size:1.1rem;font-weight:bold;background:#22c55e;color:#fff;border:2px solid #15803d;border-radius:8px;cursor:pointer">Let's fight!</button>
<button onclick="skipTutorialFromOverlay()" style="padding:0.75rem 2rem;font-size:1.1rem;font-weight:bold;background:#666;color:#fff;border:2px solid #444;border-radius:8px;cursor:pointer">Skip Tutorial</button>
</div>
</div>
</div>
</div>
<style>
@keyframes chargeForward {
0% { transform: translateX(0) scale(1); }
100% { transform: translateX(15px) scale(1.05); }
}
@keyframes defensiveStance {
0%, 100% { transform: translateY(0); }
50% { transform: translateY(-5px); }
}
@keyframes enemyThreat {
0%, 100% { transform: scale(1) rotate(0deg); }
50% { transform: scale(1.2) rotate(10deg); }
}
@keyframes tapoSignatureSmall {
  /* Quick hop 1 */
  0% { transform: translateY(0) scaleX(1); }
  8% { transform: translateY(-12px) scaleX(1); }
  16% { transform: translateY(0) scaleX(1); }
  /* Quick hop 2 */
  24% { transform: translateY(-18px) scaleX(1); }
  32% { transform: translateY(0) scaleX(1); }
  /* Flip to face LEFT */
  36% { transform: translateY(-5px) scaleX(0); }
  40% { transform: translateY(0) scaleX(-1); }
  /* Quick hop 1 LEFT */
  48% { transform: translateY(-12px) scaleX(-1); }
  56% { transform: translateY(0) scaleX(-1); }
  /* Quick hop 2 LEFT */
  64% { transform: translateY(-18px) scaleX(-1); }
  72% { transform: translateY(0) scaleX(-1); }
  /* Flip back to RIGHT */
  76% { transform: translateY(-5px) scaleX(0); }
  80% { transform: translateY(0) scaleX(1); }
  /* Pause facing right */
  100% { transform: translateY(0) scaleX(1); }
}
</style>`;
document.body.appendChild(overlay);
}

function dismissStoryOverlay() {
debugLog('[TUTORIAL] Dismissing story overlay');
// Remove ALL backdrops before showing the tutorial pop
try {
const allBackdrops = document.querySelectorAll('.tutorial-modal-backdrop');
debugLog('[TUTORIAL] Found', allBackdrops.length, 'backdrops to remove');
allBackdrops.forEach((backdrop, idx) => {
debugLog('[TUTORIAL] Removing backdrop', idx);
backdrop.remove();
});
} catch (error) {
console.error('[TUTORIAL] Error removing story overlay backdrops:', error);
}

// Double-check they're gone
setTimeout(() => {
try {
const remaining = document.querySelectorAll('.tutorial-modal-backdrop');
debugLog('[TUTORIAL] Remaining overlays after dismiss:', remaining.length);
if(remaining.length > 0) {
console.error('[TUTORIAL] ERROR: Still have backdrops!', remaining);
remaining.forEach(r => r.remove());
}

// Wait for DOM to fully update before showing popup
requestAnimationFrame(() => {
// PROMPT 1: Warrior Attack + Targeting (BATCHED)
showTutorialPop('ribbleton_warrior_attack', "In FROGGLE, you'll usually control 2 heroes. Warrior doesn't start with Expand, but he does have 2 POW! Take out that Wolf before it chomps on your Healer!<br><br>(Enemies will usually attack whoever is closest to them, but you can be more strategic) Click the Warrior's Attack sigil.", () => {
debugLog('[TUTORIAL] Prompt 1 dismissed - transitioning to warrior_attack stage');
tutorialState.stage = 'warrior_attack';
S.activeIdx = 0;
debugLog('[TUTORIAL] S.activeIdx is now:', S.activeIdx);
render();
});
});
} catch (error) {
console.error('[TUTORIAL] Error in story overlay cleanup:', error);
}
}, 50);
}

function skipTutorialFromOverlay() {
const overlay = document.querySelector('.tutorial-modal-backdrop');
if(overlay) overlay.remove();
// Show confirmation popup before skipping
showSkipTutorialConfirmation(() => {
toast('Tutorial skipped!', ANIMATION_TIMINGS.TOAST_SHORT);
setTimeout(() => transitionScreen(showTitleCard), ANIMATION_TIMINGS.ACTION_COMPLETE);
});
}

function skipTutorial() {
// This function is for legacy "skip tutorial" - just go to title
toast('Going to hero selection...');
title();
}

// ===== RIBBLETON TUTORIAL (PHASE 2) =====
function startRibbletonTutorial() {
// Phase 2: Portal Invasion - Wolf and Goblin fight with Warrior and Healer
S.floor = 0;
S.xp = 0;
S.levelUpCount = 0;
// Reset Phase 2 tutorial flags to ensure popups show for fresh tutorial
S.tutorialFlags.ribbleton_warrior_attack = false;
S.tutorialFlags.ribbleton_targeting = false;
S.tutorialFlags.ribbleton_healer_d20 = false;
S.tutorialFlags.ribbleton_d20_menu = false;
S.tutorialFlags.ribbleton_enemy_turn = false;
S.tutorialFlags.ribbleton_healer_heal = false;
S.tutorialFlags.enemies_get_sigils = false;
S.heroes = [
{id:'h_tutorial_warrior', n:'Warrior', p:2, h:5, m:5, s:['Attack','D20'], sh:0, g:0, ls:false, lst:0, ts:[], st:0},
{id:'h_tutorial_healer', n:'Healer', p:1, h:5, m:5, s:['Heal','D20','Expand'], sh:0, g:0, ls:false, lst:0, ts:[], st:0}
];

// Add permanently upgraded passives (Expand, Asterisk, Star) to tutorial heroes
const passiveSigils = ['Expand', 'Asterisk', 'Star'];
S.heroes.forEach(hero => {
passiveSigils.forEach(passive => {
const permLevel = S.sig[passive] || 0;
if(permLevel > 0 && !hero.s.includes(passive)) {
hero.s.push(passive);
}
});
});

// Initialize Phase 2 tutorial state
tutorialState = {
stage: 'waiting_for_start',
phase: 2, // Phase 2: Portal Invasion
wolfDamaged: false,
wolfKilled: false,
goblinKilled: false,
round: 1
};

// Start combat using real combat system!
combat(0);
}


function finishRibbletonTutorial() {
// Post-combat narrative with full-art backgrounds
const slides = [
{bg: 'assets/ribbleton.png', text: "Scattered, the remaining enemies scamper back into the portal. The frog heroes unite, wipe their brows, and sheathe their weapons. <strong style='color:#22c55e'>Close call!</strong> At least Tapo is safe..."},
{bg: 'assets/ribbleton-tadpole.png', bgStyle: 'animation: spinTapo 1s linear infinite;', text: "A familiar squeal of delight pierces the air as Tapo crawls toward the portal. <strong style='color:#dc2626'>No, Tapo, don't go in there!!</strong>",
html: `<style>@keyframes spinTapo { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style><div class="narrative-text" style="font-size:1.25rem;line-height:1.7;text-align:center;color:#fff;text-shadow:1px 1px 4px rgba(0,0,0,0.9)">A familiar squeal of delight pierces the air as Tapo crawls toward the portal. <strong style='color:#dc2626'>No, Tapo, don't go in there!!</strong></div>`},
{text: "But it is too late - the portal flares with <strong style='color:#9333ea'>dark energy</strong>. The heroes have no choice but to dive in after, to save their adorable little Tapo!",
html: `<div class="narrative-text" style="font-size:1.8rem;line-height:1.9;text-align:center;color:#fff;text-shadow:2px 2px 8px rgba(0,0,0,0.9);max-width:600px">But it is too late - the portal flares with <strong style='color:#9333ea'>dark energy</strong>. The heroes have no choice but to dive in after, to save their adorable little Tapo!</div>`}
];
slides.onComplete = showTitleCard;
showNarrativeSlide(slides, 0);
}

function showTitleCard() {
const v = document.getElementById('gameView');
if(!v) {
showRibbleton();
return;
}
v.classList.add('no-scroll');
v.innerHTML = `
<div id="titleCardScreen" class="full-screen-content" style="width:100%;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer">
<div style="text-align:center;color:#fff;pointer-events:none">
<div style="font-size:3.5rem;font-weight:bold;margin-bottom:1rem">FROGGLE</div>
<div style="font-size:1.5rem;font-style:italic">A Froggy Roguelike</div>
<div style="font-size:0.9rem;margin-top:2rem;opacity:0.6">Tap to continue</div>
</div>
</div>`;

let proceeded = false;
const proceed = () => {
if(proceeded) return;
proceeded = true;
tutorialState = null;
v.classList.remove('no-scroll');
showRibbleton();
};

// Multiple ways to trigger - belt and suspenders
const screen = document.getElementById('titleCardScreen');
if(screen) {
screen.onclick = proceed;
screen.ontouchend = (e) => { e.preventDefault(); proceed(); };
}

// Auto-advance
setTimeout(proceed, 2500);
}

// ===== TITLE & HERO SELECT =====
let selectedHeroView = null; // Track which hero card is currently displayed

function title() {
debugLog('[FROGGLE] title() called - Hero selection screen');
// Show header on hero selection
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';
// JUICE: Funky frog beat for title/hero select
ProceduralMusic.startTitleBeat();
upd();
// Reset selection first
sel = [];

const v = document.getElementById('gameView');
// Hero selection is a normal scrollable screen
v.classList.remove('no-scroll');
const pedestalCount = S.pedestal.filter(p => p.mode === S.gameMode).length;
const maxSlots = 8;
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;

v.innerHTML = `
<h1 style="text-align:center;margin:0.75rem 0;font-size:1.8rem;color:${S.gameMode === 'fu' ? '#dc2626' : '#22c55e'}">${S.gameMode === 'fu' ? 'FROGGED UP 🔥' : 'FROGGLE 🐸'}</h1>

<div style="max-width:600px;margin:0 auto;padding:0 0.5rem">
<h2 style="text-align:center;margin-bottom:0.5rem;font-size:1.1rem">Choose ${requiredHeroes} Heroes</h2>
<div id="hero-select-container" style="position:relative;max-width:100%;margin:0 auto;cursor:pointer" onclick="handleHeroImageClick(event, this)">
<img src="assets/hero-select.png" alt="Hero selection" style="width:100%;height:auto;display:block;border-radius:8px;border:3px solid #000;pointer-events:none">
<!-- Controller-friendly hero selection buttons -->
<button type="button" class="hero-select-btn" data-hero="warrior" onclick="event.stopPropagation();toggleHeroSelection('warrior')" aria-label="Select Warrior"></button>
<button type="button" class="hero-select-btn" data-hero="tank" onclick="event.stopPropagation();toggleHeroSelection('tank')" aria-label="Select Tank"></button>
<button type="button" class="hero-select-btn" data-hero="mage" onclick="event.stopPropagation();toggleHeroSelection('mage')" aria-label="Select Mage"></button>
<button type="button" class="hero-select-btn" data-hero="healer" onclick="event.stopPropagation();toggleHeroSelection('healer')" aria-label="Select Healer"></button>
<!-- Hero card overlays -->
<div id="warrior-card" style="position:absolute;bottom:10%;left:1%;width:23%;display:none;z-index:10;pointer-events:none;"></div>
<div id="tank-card" style="position:absolute;bottom:10%;left:26%;width:23%;display:none;z-index:10;pointer-events:none;"></div>
<div id="mage-card" style="position:absolute;bottom:10%;left:51%;width:23%;display:none;z-index:10;pointer-events:none;"></div>
<div id="healer-card" style="position:absolute;bottom:10%;left:76%;width:23%;display:none;z-index:10;pointer-events:none;"></div>
</div>

${S.tapoUnlocked ? `
<div style="margin-top:1rem;text-align:center">
<button class="btn" onclick="toggleHeroSelection('tapo')" style="background:linear-gradient(135deg,#3b82f6 0%,#22c55e 100%);padding:0.75rem 1.5rem;font-size:1rem;font-weight:bold;border:3px solid #000">
🎉 View Tapo (UNLOCKED!) 🎉
</button>
</div>` : ''}

<!-- Selection display with X/Y counter -->
<div style="text-align:center;margin:0.5rem 0;padding:0.5rem;background:rgba(0,0,0,0.05);border-radius:6px">
<strong>Selected:</strong> <span id="selection-display" style="font-size:1rem;color:#2563eb"></span>
<span id="selection-counter" style="font-size:1.1rem;font-weight:bold;margin-left:0.5rem"></span>
</div>

<button class="btn" id="start" onclick="start()" style="width:100%;padding:0.75rem;font-size:1rem">Delve into Floor 1</button>
</div>`;

debugLog('[FROGGLE] title() innerHTML set successfully');

// Update selection display
updateSelectionDisplay();
}

function handleHeroImageClick(event, container) {
// Validate inputs
if (!event || !container) {
console.warn('Invalid event or container, ignoring click');
return;
}

// Calculate which hero was clicked based on X position
const rect = container.getBoundingClientRect();
if (!rect) {
console.warn('Could not get container bounds, ignoring click');
return;
}

const x = event.clientX - rect.left;
const percent = (x / rect.width) * 100;

// Validate coordinates - if invalid, ignore the click
if (Number.isNaN(percent) || percent < 0 || percent > 100) {
console.warn('Invalid click coordinates, ignoring');
return;
}

// Determine hero based on position (4 equal 25% sections)
let heroType;
if (percent < 25) heroType = 'warrior';
else if (percent < 50) heroType = 'tank';
else if (percent < 75) heroType = 'mage';
else heroType = 'healer';

toggleHeroSelection(heroType);
}

function updateHeroCards() {
// Hero data matches H constant in constants.js
const heroData = {
warrior: {name: 'Warrior', pow: 2, hp: 5, maxhp: 5, sigils: ['Attack', 'D20'], bonus: '+1 POW'},
tank: {name: 'Tank', pow: 1, hp: 10, maxhp: 10, sigils: ['Attack', 'Shield', 'D20'], bonus: '+5 HP'},
mage: {name: 'Mage', pow: 1, hp: 5, maxhp: 5, sigils: ['Attack', 'D20', 'Expand'], bonus: '+1 Expand'},
healer: {name: 'Healer', pow: 1, hp: 5, maxhp: 5, sigils: ['Heal', 'D20', 'Expand'], bonus: '+1 Expand'},
tapo: {name: 'Tapo', pow: 1, hp: 1, maxhp: 1, sigils: ['D20'], bonus: 'D20 + upgraded passives'}
};

// Update all card displays
['warrior', 'tank', 'mage', 'healer'].forEach(h => {
const cardEl = document.getElementById(`${h}-card`);
if(!cardEl) return;

if(sel.includes(h)) {
const hData = heroData[h];
const hPixelImage = HERO_IMAGES[h] || '';
const sigilsHTML = hData.sigils.map(s => {
const passiveClass = ['Expand', 'Asterisk', 'Star'].includes(s) ? 'passive' : '';
return `<span class="sigil l1 ${passiveClass}" style="font-size:0.7rem;padding:3px 5px;margin:1px;display:inline-block" onmouseenter="showTooltip('${s}', this, 1)" onmouseleave="hideTooltip()">${sigilIconOnly(s)}</span>`;
}).join('');
cardEl.innerHTML = `
<div style="background:white;border:3px solid #22c55e;border-radius:8px;padding:0.5rem;box-shadow:0 4px 6px rgba(0,0,0,0.3);pointer-events:auto;cursor:pointer;color:#1a1a1a"
onclick="event.stopPropagation();toggleHeroSelection('${h}')">
<div style="text-align:center">
<div style="font-size:0.8rem;font-weight:bold;margin-bottom:0.25rem;color:#1a1a1a">${hData.name}</div>
${hPixelImage ? `<img src="${hPixelImage}" alt="${hData.name}" style="width:100%;height:auto;border-radius:4px;margin-bottom:0.25rem">` : ''}
<div style="font-size:0.7rem;color:#374151">${hData.pow}💥 | ${hData.hp}❤</div>
<div style="font-size:0.7rem;margin-top:0.25rem">${sigilsHTML}</div>
<div style="font-size:0.65rem;color:#16a34a;font-weight:bold;margin-top:0.25rem">${hData.bonus}</div>
<div style="font-size:0.55rem;color:#6b7280;margin-top:0.15rem">✓ SELECTED</div>
</div>
</div>`;
cardEl.style.display = 'block';
} else {
cardEl.style.display = 'none';
}
});
}

function toggleHeroSelection(heroType) {
// Toggle selection
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;
const isSelected = sel.includes(heroType);
if(isSelected) {
sel = sel.filter(h => h !== heroType);
SoundFX.play('click');
} else {
if(sel.length < requiredHeroes) {
sel.push(heroType);
SoundFX.play('hop'); // Froggy hop for hero selection
}
}

// Update card displays and selection display
updateHeroCards();
updateSelectionDisplay();
}


function updateSelectionDisplay() {
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;
const display = document.getElementById('selection-display');
const counter = document.getElementById('selection-counter');
if(!display) return;

if(sel.length === 0) {
display.textContent = 'None';
display.style.color = '#6b7280';
} else {
const heroNames = sel.map(h => H[h].n);
display.textContent = heroNames.join(' + ');
display.style.color = '#2563eb';
}

// Update X/Y counter
if(counter) {
const isComplete = sel.length === requiredHeroes;
counter.textContent = `(${sel.length}/${requiredHeroes})`;
counter.style.color = isComplete ? '#22c55e' : '#f59e0b';
}

const btn = document.getElementById('start');
if(btn) {
const isDisabled = sel.length !== requiredHeroes;
btn.disabled = isDisabled;
if(isDisabled) {
btn.classList.add('disabled');
} else {
btn.classList.remove('disabled');
}
btn.style.opacity = sel.length === requiredHeroes ? '1' : '0.4';
}
}

function toggleMode() {
S.gameMode = S.gameMode === 'Standard' ? 'fu' : 'Standard';
document.body.classList.toggle('fu-mode', S.gameMode === 'fu');
savePermanent();
title();
}

function pick(t) {
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;
const i = sel.indexOf(t);
if(i>=0) {
sel.splice(i,1);
} else if(sel.length<requiredHeroes) {
sel.push(t);
} else {
toast(`Maximum ${requiredHeroes} heroes!`);
return;
}

// Update selection display
updateSelectionDisplay();
}

function start() {
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;
if(sel.length!==requiredHeroes) return;
// Show game header when entering gameplay
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';

S.floor=1; S.xp=0; S.levelUpCount=0;
// Reset temporary XP sigil upgrades (these don't persist between runs)
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// Reset recruits from any previous run
S.recruits = [];
// NOTE: Gold persists between runs! Only reset on victory or spent at Death Screen
S.heroes = sel.map((t,i) => ({
id:`h-${crypto.randomUUID()}`,
n:H[t].n, p:H[t].p, h:H[t].h, m:H[t].m,
s:[...H[t].s], sh:0, g:0, ls:false, lst:0, ts:[], st:0
}));

// Add permanently upgraded passives (Expand, Asterisk, Star) to all heroes
const passiveSigils = ['Expand', 'Asterisk', 'Star'];
S.heroes.forEach(hero => {
passiveSigils.forEach(passive => {
const permLevel = S.sig[passive] || 0;
// If this passive has been upgraded with gold (L1+) and hero doesn't have it, add it
if(permLevel > 0 && !hero.s.includes(passive)) {
hero.s.push(passive);
}
});
// Tapo also gets any active sigils that have been permanently upgraded with gold
if(hero.n === 'Tapo') {
const activeSigils = ['Attack', 'Shield', 'Heal', 'Grapple', 'Ghost', 'Alpha'];
activeSigils.forEach(sigil => {
const permLevel = S.sig[sigil] || 0;
if(permLevel > 0 && !hero.s.includes(sigil)) {
hero.s.push(sigil);
}
});
}
});

// Apply pedestal buffs
// Standard mode statues apply to BOTH modes, FU statues only apply to FU mode
S.pedestal.forEach(slot => {
// Standard mode statues apply universally, FU statues only in FU mode
if(slot.mode === 'fu' && S.gameMode !== 'fu') return;
const hero = S.heroes.find(h => h.n === slot.hero);
if(!hero) return;
if(slot.stat === 'POW') {
hero.p += 1;
} else if(slot.stat === 'HP') {
hero.m += 5;
hero.h += 5;
}
});

// Chosen Hero: On run 2+, pick randomly from least-used heroes among selected
S.chosenHeroIdx = -1; // Reset (no chosen hero by default)
if(S.runNumber >= 2 && S.pondHistory && S.pondHistory.length > 0) {
// Count usage of each hero from pond history
const usageCounts = {};
S.pondHistory.forEach(run => {
(run.heroes || []).forEach(heroName => {
usageCounts[heroName] = (usageCounts[heroName] || 0) + 1;
});
});
// Find usage counts for heroes in current party
const heroUsages = S.heroes.map((h, idx) => ({
idx,
name: h.n,
usage: usageCounts[h.n] || 0
}));
// Find the minimum usage count
const minUsage = Math.min(...heroUsages.map(h => h.usage));
// Get all heroes with minimum usage
const leastUsed = heroUsages.filter(h => h.usage === minUsage);
// Randomly pick one from least-used
const chosen = leastUsed[Math.floor(Math.random() * leastUsed.length)];
S.chosenHeroIdx = chosen.idx;
}

initNeutralDeck();
upd();

// QUEST TRACKING: Track heroes played this run
S.heroes.forEach(hero => {
  trackQuestProgress('heroPlayed', hero.n);
});

// Show chosen hero tutorial on first occurrence (run 2)
if(S.chosenHeroIdx >= 0 && !S.tutorialFlags.chosen_hero_intro) {
const chosenHero = S.heroes[S.chosenHeroIdx];
showTutorialPop('chosen_hero_intro', `Somehow, somewhere, Tapo smiles upon <strong>${chosenHero.n}</strong>. They'll gain an extra 1G for each floor cleared this run!`, () => {
if(S.startingXP > 0) {
S.xp = S.startingXP;
showStartingXPScreen();
} else {
startFloor(1);
}
});
return;
}

// Check if player has starting XP from Death Boy sacrifices
if(S.startingXP > 0) {
S.xp = S.startingXP;
showStartingXPScreen();
} else {
startFloor(1);
}
}


// ===== NEUTRAL ENCOUNTERS =====
// Neutral encounter display names for floor interstitials
const NEUTRAL_NAMES = {
shopkeeper1: 'Potions for Sale',
shopkeeper2: "Death's Bargain",
wishingwell1: 'The Old Wishing Well',
wishingwell2: 'Crystal Waters',
treasurechest1: 'A Mysterious Chest',
treasurechest2: 'The Silver Key',
wizard1: 'Trials of Arcane Power',
wizard2: 'The Hieroglyphs',
oracle1: 'Consult the Oracle',
oracle2: "The Oracle's Promise",
encampment1: 'Enemy Encampment',
encampment2: 'Abandoned Encampment',
gambling1: 'Between the 20s',
gambling2: 'Between the 20s Extreme',
ghost1: 'The Haunted Playroom',
ghost2: 'Passing On',
royal1: 'The Flummoxed Royal',
royal2: 'Royal Wedding'
};

function showNeutralInterstitial(f, encName, callback) {
const displayName = NEUTRAL_NAMES[encName] || encName;
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;z-index:30000">
<div style="text-align:center;color:#fff;animation:fadeIn 0.5s ease">
<div style="font-size:2.5rem;font-weight:bold;margin-bottom:1rem;font-family:'Fredoka One',cursive">Floor ${f}</div>
<div style="font-size:1.8rem;font-style:italic;font-family:'Fredoka One',cursive">${displayName}</div>
</div>
</div>
<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>`;
setTimeout(callback, T(ANIMATION_TIMINGS.FLOOR_INTERSTITIAL));
}

function neutral(f) {
// Show header during neutral encounters
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';
// JUICE: Ambient music for neutral/exploration
ProceduralMusic.startAmbient();
upd();
// TUTORIAL: Show neutral intro on Floor 2
if(f === 2) {
showTutorialPop('neutral_intro', "Neutral floors offer choices and opportunities! You can walk straight through, or take a risk for potential rewards.");
}

const enc = getNeutralEncounter();

if(S.ghostBoysConverted && enc.startsWith('ghost')) {
showEmptyPlayroom();
return;
}

// Show interstitial then launch encounter
const launchEncounter = () => {
if(enc === 'shopkeeper1') showShopkeeper1();
else if(enc === 'shopkeeper2') showShopkeeper2();
else if(enc === 'wishingwell1') showWishingWell1();
else if(enc === 'wishingwell2') showWishingWell2();
else if(enc === 'treasurechest1') showTreasureChest1();
else if(enc === 'treasurechest2') showTreasureChest2();
else if(enc === 'wizard1') showWizard1();
else if(enc === 'wizard2') showWizard2();
else if(enc === 'oracle1') showOracle1();
else if(enc === 'oracle2') showOracle2();
else if(enc === 'encampment1') showEncampment1();
else if(enc === 'encampment2') showEncampment2();
else if(enc === 'gambling1') showGambling1();
else if(enc === 'gambling2') showGambling2();
else if(enc === 'ghost1') showGhost1();
else if(enc === 'ghost2') showGhost2();
else if(enc === 'royal1') showRoyal1();
else if(enc === 'royal2') showRoyal2();
else {
const v = document.getElementById('gameView');
v.innerHTML = `
<h2 style="text-align:center;margin:2rem 0">Floor ${f}</h2>
<p style="text-align:center;margin-bottom:2rem">${enc}</p>
<button class="btn" onclick="nextFloor()">Continue</button>`;
}
};

showNeutralInterstitial(f, enc, launchEncounter);
}

// ===== 1. SHOPKEEPER =====
let shopSmallBought = false;
let shopLargeBought = false;

function showShopkeeper1() {
// Reset shopkeeper state at start of each encounter
shopSmallBought = false;
shopLargeBought = false;
renderShopkeeper();
}

function renderShopkeeper() {
// Build buttons based on what's already been bought (limit 1 of each per visit)
let buttons = '';
if(!shopSmallBought) {
buttons += `<button class="neutral-btn safe" onclick="buySmallPotion()">Small Potion (3G) - Restore 3 HP</button>`;
} else {
buttons += `<button class="neutral-btn" disabled>Small Potion - SOLD</button>`;
}
if(!shopLargeBought) {
buttons += `<button class="neutral-btn safe" onclick="buyLargePotion()">Large Potion (5G) - Restore 8 HP</button>`;
} else {
buttons += `<button class="neutral-btn" disabled>Large Potion - SOLD</button>`;
}
buttons += `<button class="neutral-btn secondary" onclick="declineShopkeeper()">Leave Shop</button>`;

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/shopkeeper1.png',
title: 'Potions for Sale',
description: 'A cheerful gnome stands behind a small cart laden with vials and bottles. Their voice is excited and earnest: "Healing Potions for sale!"',
buttons: buttons
});
}

function buySmallPotion() {
if(S.gold < 3) { toast('Not enough Gold!'); return; }
const v = document.getElementById('gameView');
let heroButtons = '';
S.heroes.forEach((h, idx) => {
heroButtons += `<button class="neutral-btn" onclick="applySmallPotion(${idx})">${h.n} (${h.h}/${h.m}❤)</button>`;
});
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/shopkeeper1.png',
title: 'Choose Hero',
description: 'Select a hero to restore 3 HP.',
buttons: heroButtons + `<button class="neutral-btn secondary" onclick="renderShopkeeper()">Back</button>`
});
}

function applySmallPotion(idx) {
S.gold -= 3;
const h = S.heroes[idx];
h.h = Math.min(h.h + 3, h.m);
upd();
toast(`${h.n} restored 3 HP!`);
shopSmallBought = true;
if(shopSmallBought && shopLargeBought) {
replaceStage1WithStage2('shopkeeper');
toast('Death will remember this...', 1800);
}
renderShopkeeper();
}

function buyLargePotion() {
if(S.gold < 5) { toast('Not enough Gold!'); return; }
const v = document.getElementById('gameView');
let heroButtons = '';
S.heroes.forEach((h, idx) => {
heroButtons += `<button class="neutral-btn" onclick="applyLargePotion(${idx})">${h.n} (${h.h}/${h.m}❤)</button>`;
});
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/shopkeeper1.png',
title: 'Choose Hero',
description: 'Select a hero to restore 8 HP.',
buttons: heroButtons + `<button class="neutral-btn secondary" onclick="renderShopkeeper()">Back</button>`
});
}

function applyLargePotion(idx) {
S.gold -= 5;
const h = S.heroes[idx];
h.h = Math.min(h.h + 8, h.m);
upd();
toast(`${h.n} restored 8 HP!`);
shopLargeBought = true;
if(shopSmallBought && shopLargeBought) {
replaceStage1WithStage2('shopkeeper');
toast('Death will remember this...', 1800);
}
renderShopkeeper();
}

function declineShopkeeper() {
shopSmallBought = false;
shopLargeBought = false;
nextFloor();
}

function showShopkeeper2() {
const v = document.getElementById('gameView');
const allSigils = ['Attack', 'Shield', 'Heal', 'Grapple', 'Ghost', 'D20', 'Expand', 'Asterisk', 'Star', 'Alpha'];
const available = allSigils.filter(s => (S.sig[s] || 0) < 4);
const cost = S.goingRate;
let description = `The cheerful gnome shopkeeper has been replaced by an ominous figure: your old friend, Death. "I sent the kid home. Thanks for supporting my side hustle. I can keep this one off the books."<br><br><p style="text-align:center;font-weight:bold;margin:1rem 0">Cost: ${cost} Gold</p>`;
let buttons = '';
let outcomes = [];

if(available.length === 0) {
outcomes.push('All your sigils are already at maximum power. Death nods approvingly and fades away.');
buttons = `<button class="btn" onclick="finishDeathsBargain()">Continue</button>`;
} else if(S.gold < cost) {
outcomes.push('<span style="color:#dc2626">"Darn. Not enough gold. Maybe next time, I guess?"</span>');
buttons = `<button class="btn" onclick="finishDeathsBargain()">Continue</button>`;
} else {
description += `<div style="font-size:0.9rem;margin-bottom:1rem">Choose one sigil to upgrade permanently (costs ${cost}G, Going Rate does NOT increase):</div>`;
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
available.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const isActive = actives.includes(sig);
// Actives display +1 (storage L0 = display L1)
const displayLevel = isActive ? permLevel + 1 : permLevel;
const nextDisplayLevel = displayLevel + 1;
buttons += `<div class="choice" onclick="acceptDeathsBargain('${sig}', ${cost})">
<strong>${sigilIcon(sig)}</strong> <span style="opacity:0.7">L${displayLevel} → L${nextDisplayLevel}</span>
</div>`;
});
buttons += `<button class="btn risky" onclick="finishDeathsBargain()">Decline</button>`;
}

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/shopkeeper2.png',
title: 'Death\'s Bargain',
description,
outcomes,
buttons
});
}

function acceptDeathsBargain(sig, cost) {
if(S.gold < cost) { toast('Not enough Gold!'); return; }
S.gold -= cost;
S.sig[sig] = (S.sig[sig] || 0) + 1;
// NOTE: Going Rate does NOT increase for Death's Bargain!
upd();
savePermanent();
const bargainActives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const bargainDisplayLvl = bargainActives.includes(sig) ? S.sig[sig] + 1 : S.sig[sig];
toast(`${sig} permanently upgraded to L${bargainDisplayLvl}! (GR unchanged)`, 3000);
removeNeutralFromDeck('shopkeeper');
setTimeout(() => {
const v = document.getElementById('gameView');
v.innerHTML = `
<div class="neutral-container">
<div class="neutral-outcome">"Good choice. See you soon."</div>
<div class="neutral-outcome">The shadows recede. The chamber returns to normal as you proceed to Floor ${S.floor + 1}.</div>
<button class="btn" onclick="nextFloor()">Continue</button>
</div>`;
}, 1000);
}

function finishDeathsBargain() {
removeNeutralFromDeck('shopkeeper');
const v = document.getElementById('gameView');
v.innerHTML = `
<div class="neutral-container">
<div class="neutral-outcome">"Shame. You don't get a chance like this every day. Oh well, it's your funeral."</div>
<div class="neutral-outcome">The shadows recede. The chamber returns to normal as you proceed to Floor ${S.floor + 1}.</div>
<button class="btn" onclick="nextFloor()">Continue</button>
</div>`;
}

// ===== 2. WISHING WELL =====
function showWishingWell1() {
const v = document.getElementById('gameView');
const buttons = `
<button class="btn risky" onclick="climbWell()">Climb down and get coins</button>
<button class="btn" onclick="tossWish()">Toss in a coin and make a wish</button>
<button class="btn safe" onclick="nextFloor()">Do Not Engage</button>
`;
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wishingwell1.png',
title: 'The Old Wishing Well',
description: 'An ancient stone well sits in the center of the chamber. You hear the faint sound of trickling water far below. A glint of gold catches your eye at the bottom.',
buttons
});
}

function climbWell() {
const {rolls, best} = rollD20Neutral();
const rollText = showD20Result(rolls, best);

let outcome = '';
let goldGain = 0;
let hpLoss = 0;

if(best === 1) {
outcome = 'You lose your grip on the slick stone and plummet, smacking your head HARD! The landing is brutal, and by the time you scramble out, you realize that some coins must have gotten knocked out of your pouch.';
hpLoss = 3;
goldGain = -5;
} else if(best >= 2 && best <= 10) {
outcome = 'You climb carefully and manage to grab a single coin, but get a booboo climbing out of the well.';
hpLoss = 1;
goldGain = 1;
} else if(best >= 11 && best <= 19) {
outcome = 'Your climbing skills are impressive! You retrieve a small cache of coins from the bottom. (+3 Gold)';
goldGain = 3;
} else if(best === 20) {
outcome = 'Hardcore Parkour! You effortlessly dip into the well, snatch the cache of coins, and leap out. As you leave the room, the well somehow seems to begin to fill... (+10 Gold)';
goldGain = 10;
replaceStage1WithStage2('wishingwell');
}

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wishingwell1.png',
title: 'Climbing the Well',
diceRoll: rollText,
outcomes: [outcome],
buttons: `<button class="btn" onclick="applyWellClimb(${hpLoss}, ${goldGain})">Continue</button>`
});
}

function applyWellClimb(hpLoss, goldGain) {
if(hpLoss > 0) {
// Show hero selection screen
const v = document.getElementById('gameView');
let heroButtons = '';
S.heroes.forEach((h, idx) => {
heroButtons += `<button class="neutral-btn danger" onclick="applyWellDamage(${idx}, ${hpLoss}, ${goldGain})">${h.n} (${h.h}/${h.m}❤)</button>`;
});
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wishingwell1.png',
title: 'Choose Who Takes Damage',
description: `Choose which hero takes ${hpLoss} damage from climbing the well:`,
buttons: heroButtons
});
} else {
// No damage, just apply gold
S.gold += goldGain;
if(S.gold < 0) S.gold = 0;
upd();
if(goldGain > 0) toast(`Gained ${goldGain} Gold!`);
else if(goldGain < 0) toast(`Lost ${Math.abs(goldGain)} Gold!`);
nextFloor();
}
}

function applyWellDamage(heroIdx, hpLoss, goldGain) {
const hero = S.heroes[heroIdx];
hero.h -= hpLoss;
if(hero.h <= 0 && !hero.ls) {
if(hero.g > 0) {
hero.g--;
hero.h += hpLoss;
toast(`${hero.n}'s Ghost charge cancelled the lethal hit!`);
} else {
hero.h = 0;
hero.ls = true;
hero.lst = 0;
toast(`${hero.n} entered Last Stand!`, 3000);
}
}
toast(`${hero.n} took ${hpLoss} damage!`);

S.gold += goldGain;
if(S.gold < 0) S.gold = 0;
upd();
if(goldGain > 0) toast(`Gained ${goldGain} Gold!`);
else if(goldGain < 0) toast(`Lost ${Math.abs(goldGain)} Gold!`);
nextFloor();
}

function tossWish() {
const cost = S.heroes.length;
if(S.gold < cost) {
toast(`Need ${cost} Gold to make a wish!`);
return;
}
S.gold -= cost;
upd();
replaceStage1WithStage2('wishingwell');
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wishingwell1.png',
title: 'A Wish Made',
outcomes: [`You toss ${cost} gold coin${cost>1?'s':''} into the well and make a silent wish. The water begins to glow softly, then surges upward, overflowing the well's edge!`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

function showWishingWell2() {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wishingwell2.png',
title: 'Overflowing Crystal Waters',
description: 'The well now overflows with sparkling, crystal-clear water that pools around its base. The water pulses with pure, restorative energy.',
buttons: `<button class="btn safe" onclick="drinkCrystalWater()">Drink from the well</button>`
});
}

function drinkCrystalWater() {
S.heroes.forEach(h => {
if(h.ls) {
h.ls = false;
h.lst = 0;
h.h = h.m;
toast(`${h.n} revived to full HP!`);
} else {
h.h = h.m;
}
});
toast('All heroes fully healed!', 1800);
removeNeutralFromDeck('wishingwell');
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wishingwell2.png',
title: 'Fully Restored',
outcomes: [
'The crisp water tastes impossibly pure and refreshing. A pleasant coolness spreads through your body as your wounds close and your exhaustion fades. You feel completely restored.',
'The well\'s glow fades as the water recedes to its normal level. Its magic has been spent, for now.'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 3. TREASURE CHEST =====
function showTreasureChest1() {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/treasurechest1.png',
title: 'A Mysterious Chest',
description: 'An unadorned wooden chest sits against the far wall, worn brass fittings gleaming in the torchlight. No lock is visible, but there are drops of blood around the chest.',
buttons: `
<button class="btn risky" onclick="openChest()">Open the chest</button>
<button class="btn safe" onclick="nextFloor()">Do Not Engage</button>
`
});
}

function openChest() {
const {rolls: trapRolls, best: trapBest} = rollD20Neutral();
const trapText = showD20Result(trapRolls, trapBest);

let trapOutcome = '';
let trapDmg = 0;
let secretFound = false;

if(trapBest === 1) {
trapOutcome = 'It\'s a trap! Thick, noxious smoke fills the chamber.';
trapDmg = 3;
} else if(trapBest >= 2 && trapBest <= 9) {
trapOutcome = 'It\'s a trap! A hidden dart flies from the wall and strikes you in the neck! Ouch.';
trapDmg = 1;
} else if(trapBest >= 10 && trapBest <= 18) {
trapOutcome = 'You carefully open the chest without triggering any traps.';
} else {
trapOutcome = 'You open the chest without issue. Your keen eyes spot a hidden compartment in the chest\'s lid!';
secretFound = true;
}

// Show trap result with Continue button
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/treasurechest1.png',
title: 'Opening the Chest',
diceRoll: trapText,
outcomes: [trapOutcome],
buttons: `<button class="btn" onclick="openChestPart2(${trapDmg}, ${secretFound})">Continue</button>`
});
}

function openChestPart2(trapDmg, secretFound) {
setTimeout(() => {
const {rolls: contentRolls, best: contentBest} = rollD20Neutral();
const contentText = showD20Result(contentRolls, contentBest);

let contentOutcome = '';
let goldGain = 0;

if(contentBest >= 1 && contentBest <= 9) {
contentOutcome = 'The chest is empty. Someone got here first.';
} else if(contentBest >= 10 && contentBest <= 19) {
goldGain = Math.ceil(Math.random() * 10);
contentOutcome = `The chest contains a small stack of ${goldGain} gold coins!`;
} else {
goldGain = Math.ceil(Math.random() * 10) * S.heroes.length;
contentOutcome = `The chest is filled to the brim with ${goldGain} gold coins!`;
}

if(secretFound && contentBest >= 10) {
S.silverKeyHeld = true;
replaceStage1WithStage2('treasurechest');
contentOutcome += ' Inside the secret compartment, you find a small silver key!';
}

const v = document.getElementById('gameView');
if(trapDmg > 0) {
// Show hero selection for trap damage
let heroButtons = '';
S.heroes.forEach((h, idx) => {
heroButtons += `<button class="neutral-btn danger" onclick="finishChestOpen(${idx}, ${trapDmg}, ${goldGain})">${h.n} (${h.h}/${h.m}❤)</button>`;
});
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/treasurechest1.png',
title: 'Chest Contents',
description: `Choose which hero takes ${trapDmg} damage:`,
diceRoll: contentText,
outcomes: [contentOutcome],
buttons: heroButtons
});
} else {
// No trap damage, just show results and continue
S.gold += goldGain;
upd();
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/treasurechest1.png',
title: 'Chest Contents',
diceRoll: contentText,
outcomes: [contentOutcome],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}
}, 0);
}

function finishChestOpen(heroIdx, trapDmg, goldGain) {
const hero = S.heroes[heroIdx];
hero.h -= trapDmg;
if(hero.h <= 0 && !hero.ls) {
if(hero.g > 0) {
hero.g--;
hero.h += trapDmg;
toast(`${hero.n}'s Ghost charge cancelled the lethal hit!`);
} else {
hero.h = 0;
hero.ls = true;
hero.lst = 0;
toast(`${hero.n} entered Last Stand!`, 3000);
}
}
toast(`${hero.n} took ${trapDmg} damage!`);

S.gold += goldGain;
upd();
nextFloor();
}

function showTreasureChest2() {
if(!S.silverKeyHeld) {
nextFloor();
return;
}
const goldGain = 10 * S.heroes.length;
S.gold += goldGain;
S.silverKeyHeld = false;
upd();
removeNeutralFromDeck('treasurechest');
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/treasurechest2.png',
title: 'Small Silver Chest',
description: 'A small, beautifully-adorned silver chest sits on a stone pedestal. The silver keyhole is perfectly sized for the key you found earlier.',
outcomes: [`What a windfall! Gold coins overflow from the open chest. You gather and pocket ${goldGain} before moving on.`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 4. MUMBLING WIZARD =====
function showWizard1() {
const v = document.getElementById('gameView');
let description = 'An elderly wizard stands with arms outstretched toward a wall covered in glowing hieroglyphs. He mutters to himself, but stops when you walk in. "Do you see it? CAN you see it? Look closely!" He pulls you toward the wall.<br><br>Choose which hero will approach the wizard:';
let buttons = '';
S.heroes.forEach((h, idx) => {
const heroSigils = [...h.s];
if(h.ts) heroSigils.push(...h.ts);
const sigilList = heroSigils.map(s => sigilIconOnly(s)).join(' ');
buttons += `<button class="neutral-btn safe" onclick="heroApproachesWizard(${idx})">${h.n} <span style="font-size:0.8rem;opacity:0.8">${sigilList}</span></button>`;
});
buttons += `<button class="btn secondary" onclick="nextFloor()">Do Not Engage</button>`;

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'Hieroglyphs on the Wall',
description,
buttons
});
}

function heroApproachesWizard(heroIdx) {
const h = S.heroes[heroIdx];
const {rolls, best} = rollD20Neutral();
const rollText = showD20Result(rolls, best);

const v = document.getElementById('gameView');

if(best >= 1 && best <= 10) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'The Hieroglyphs',
diceRoll: rollText,
outcomes: [`${h.n} stares at the glowing symbols but can't make sense of them. The wizard sighs heavily: "You... you don't see it? Hmmm." The wizard turns back to the wall and continues mumbling to himself. He seems to have forgotten about you.`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Non-starter sigil pool
const nonStarterPool = ['Alpha', 'Asterisk', 'Star', 'Grapple', 'Ghost'];

// Get sigils hero has from non-starter pool
const heroNonStarters = nonStarterPool.filter(sig => h.s.includes(sig) || (h.ts && h.ts.includes(sig)));

let chosenSigil;
if(heroNonStarters.length > 0) {
// Prioritize passives (Star, Asterisk) if hero has any
const heroPassives = heroNonStarters.filter(sig => ['Star', 'Asterisk'].includes(sig));
if(heroPassives.length > 0) {
// On natural 20, prioritize lower level sigils
if(best === 20) {
heroPassives.sort((a, b) => getLevel(a, heroIdx) - getLevel(b, heroIdx));
chosenSigil = heroPassives[0];
} else {
chosenSigil = heroPassives[Math.floor(Math.random() * heroPassives.length)];
}
} else {
// No passives, pick from actives hero has
if(best === 20) {
heroNonStarters.sort((a, b) => getLevel(a, heroIdx) - getLevel(b, heroIdx));
chosenSigil = heroNonStarters[0];
} else {
chosenSigil = heroNonStarters[Math.floor(Math.random() * heroNonStarters.length)];
}
}
} else {
// Hero has no non-starters, pick random from pool
chosenSigil = nonStarterPool[Math.floor(Math.random() * nonStarterPool.length)];
}

const currentLevel = getLevel(chosenSigil, heroIdx);
const bonusLevels = best === 20 ? 2 : 1;

// Check if hero has the sigil
const heroHasSigil = h.s.includes(chosenSigil) || (h.ts && h.ts.includes(chosenSigil));

if(!heroHasSigil) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'The Hieroglyphs',
diceRoll: rollText,
outcomes: [
`The hieroglyphs shift around, finally revealing the symbol for ${chosenSigil}! The wizard beams with pride.`,
`But ${h.n} doesn't possess this sigil. The wizard's face falls: "Ah, shame. Not the outcome I expected. Return when you have become more powerful."`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Hero has it! Grant temp upgrade
if(!h.ts) h.ts = [];
if(!h.ts.includes(chosenSigil)) h.ts.push(chosenSigil);

// Use tempSigUpgrades for temporary upgrades (not S.sig which is permanent!)
const oldTotalLevel = (S.sig[chosenSigil] || 0) + (S.tempSigUpgrades[chosenSigil] || 0);
S.tempSigUpgrades[chosenSigil] = (S.tempSigUpgrades[chosenSigil] || 0) + bonusLevels;
const newTotalLevel = oldTotalLevel + bonusLevels;

S.wizardHero = heroIdx;
S.wizardSigil = chosenSigil;

const critText = best === 20 ? ` <span style="color:#3b82f6;font-weight:bold">(CRITICAL!)</span>` : '';
toast(`${chosenSigil} temporarily upgraded to L${newTotalLevel} for ${h.n}!`, 1800);

replaceStage1WithStage2('wizard');
setTimeout(() => {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'The Hieroglyphs',
diceRoll: rollText + critText,
outcomes: [
`The hieroglyph reveals itself as the symbol for ${chosenSigil}! "Yes! YES! You see! You understand!" The wizard touches the sigil, then reaches towards ${h.n}.`,
`${h.n} feels power surge through them. ${chosenSigil} temporarily upgraded from L${currentLevel} to L${currentLevel + bonusLevels}!`,
'"Your journey has just begun... Seek me again this night." He disappears.'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}, 500);
}

function showWizard2() {
if(S.wizardHero === undefined || !S.wizardSigil) {
nextFloor();
return;
}

// Initialize wizard challenge state
if(!S.wizardChallenges) {
S.wizardChallenges = [5, 10, 15, 20];
S.wizardChallengeIndex = 0;
S.wizardUpgradedSigils = [];
}

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: 'Trials of Arcane Power',
description: 'The wizard\'s eyes gleam with arcane power: "You have returned! Just as I knew you would. You are ready now to face my trials. Each success earns you greater strength!"<br><br><div style="font-size:0.85rem;margin-top:1rem;color:#4a4540">Four trials: DC 5, DC 10, DC 15, DC 20<br>Each success: Choose a sigil to upgrade temporarily<br>On failure: Keep all upgrades earned so far</div>',
buttons: `<button class="btn risky" onclick="startWizardChallenges()">Accept the Trials</button>
<button class="btn secondary" onclick="declineWizardChallenges()">Decline</button>`
});
}

function startWizardChallenges() {
attemptWizardChallenge();
}

function attemptWizardChallenge() {
const heroIdx = S.wizardHero;
const h = S.heroes[heroIdx];
const challengeIndex = S.wizardChallengeIndex;
const dc = S.wizardChallenges[challengeIndex];

const {rolls, best} = rollD20Neutral();
const rollText = showD20Result(rolls, best);

const v = document.getElementById('gameView');

if(best < dc) {
// Failed! Keep what you got
const upgradeCount = S.wizardUpgradedSigils.length;
let outcomeText = upgradeCount > 0
? `${h.n} earned ${upgradeCount} temporary upgrade${upgradeCount > 1 ? 's' : ''} before failing!`
: `${h.n} failed the first trial. No upgrades earned.`;

removeNeutralFromDeck('wizard');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: `Trial ${challengeIndex + 1} - DC ${dc}`,
diceRoll: rollText + ` - <span style="color:#dc2626">FAILED</span>`,
outcomes: [
`${h.n} could not quite meet the challenge.`,
outcomeText,
'"A good effort, but you have reached your limit. Take what you have earned and go."'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Success! Choose a sigil to upgrade
const heroSigils = [...h.s];
if(h.ts) heroSigils.push(...h.ts);
const availableSigils = heroSigils.filter(sig => !S.wizardUpgradedSigils.includes(sig));

if(availableSigils.length === 0) {
// No more sigils to upgrade
removeNeutralFromDeck('wizard');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: `Trial ${challengeIndex + 1} - DC ${dc}`,
diceRoll: rollText + ` - <span style="color:#22c55e">SUCCESS</span>`,
outcomes: [
`${h.n} passed the trial!`,
`But ${h.n} has no more sigils available to upgrade!`,
`Total upgrades earned: ${S.wizardUpgradedSigils.length}`,
'"You have taken all I can offer. Go now."'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Show sigil selection
let description = `${h.n} passed the trial! Choose a sigil to upgrade temporarily (cannot pick the same sigil twice):`;
let buttons = '';
availableSigils.forEach(sig => {
const currentLevel = getLevel(sig, heroIdx);
const nextLevel = currentLevel + 1;
buttons += `<button class="neutral-btn safe" onclick="selectWizardUpgrade('${sig}')">${sigilIconWithTooltip(sig, nextLevel)} ${sig} - L${currentLevel} → L${nextLevel}</button>`;
});

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: `Trial ${challengeIndex + 1} - DC ${dc}`,
diceRoll: rollText + ` - <span style="color:#22c55e">SUCCESS</span>`,
description,
buttons
});
}

function selectWizardUpgrade(sig) {
const heroIdx = S.wizardHero;
const h = S.heroes[heroIdx];

// Apply temp upgrade (use tempSigUpgrades, not S.sig which is permanent!)
if(!h.ts) h.ts = [];
if(!h.ts.includes(sig)) h.ts.push(sig);

const oldTotalLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
S.tempSigUpgrades[sig] = (S.tempSigUpgrades[sig] || 0) + 1;
const newTotalLevel = oldTotalLevel + 1;

S.wizardUpgradedSigils.push(sig);
toast(`${sig} temporarily upgraded to L${newTotalLevel} for ${h.n}!`, 1800);

S.wizardChallengeIndex++;

// Check if more challenges remain
if(S.wizardChallengeIndex >= S.wizardChallenges.length) {
// All trials complete!
removeNeutralFromDeck('wizard');
setTimeout(() => {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
outcomes: [
`${h.n} has completed all trials!`,
`Total upgrades: ${S.wizardUpgradedSigils.length}`,
'"Merlin\'s Toad! You have proven yourself worthy. Now go forth with your newfound power, my disciple!"'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}, ANIMATION_TIMINGS.ACTION_COMPLETE);
} else {
// Continue to next challenge
setTimeout(() => attemptWizardChallenge(), ANIMATION_TIMINGS.TUTORIAL_DELAY);
}
}

function declineWizardChallenges() {
removeNeutralFromDeck('wizard');
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
outcomes: ['The wizard\'s glow fades. "You would refuse my arcane boons? Very well." He grabs his books and disappears.'],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 5. ORACLE =====
function showOracle1() {
// Mark tutorial as seen so future runs have random neutrals
S.tutorialFlags.neutral_intro = true;
const v = document.getElementById('gameView');
let description = 'A figure shrouded in mist sits cross-legged before a glowing crystal sphere. Their voice echoes: "Step forward, adventurer, and I shall ponder your future within this here orb. Crave you Power or Life?" Choose a hero and their desired fortune:';
let buttons = '';
S.heroes.forEach((h, idx) => {
buttons += `<button class="neutral-btn risky" onclick="oracleChoose(${idx}, 'POW')">${h.n} - Power (${h.p}💥 → ${h.p+1}💥)</button>`;
buttons += `<button class="neutral-btn safe" onclick="oracleChoose(${idx}, 'HP')">${h.n} - Life (${h.m}❤ max → ${h.m+5}❤ max)</button>`;
});
buttons += `<button class="neutral-btn secondary" onclick="nextFloor()">Do Not Engage</button>`;
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/oracle1.png',
title: 'Consult the Oracle',
description,
buttons
});
}

function oracleChoose(heroIdx, stat) {
S.oracleHero = heroIdx;
S.oracleStat = stat;

const {rolls, best} = rollD20Neutral();
const rollText = showD20Result(rolls, best);
S.oracleRoll = best;

const h = S.heroes[heroIdx];
let fortune = '';
let stage2Effect = '';

if(best === 1) {
fortune = '"No...This cannot be! You are cursed! CURSED! Begone from me at once, and cross not my path again!"';
stage2Effect = 'CURSE';
replaceStage1WithStage2('oracle');
} else if(best >= 2 && best <= 9) {
fortune = '"Alas... The orb is cruel. Your desires shall not come to pass this night."';
stage2Effect = 'NO UNLOCK';
} else if(best >= 10 && best <= 15) {
fortune = 'The Oracle gives a knowing smile. "Great things in your future, but perhaps not what you want."';
stage2Effect = 'OPPOSITE';
replaceStage1WithStage2('oracle');
} else if(best >= 16 && best <= 19) {
fortune = 'The Oracle gives a kind wink. "Your desired future just may come to pass, if you are patient."';
stage2Effect = 'DESIRED';
replaceStage1WithStage2('oracle');
} else {
// Nat 20 - IMMEDIATE effect! Grant reward now, no stage 2 needed
if(stat === 'HP') {
h.m += 10;
h.h += 10;
} else {
h.p += 2;
}
fortune = `"Incredible.. Could it be... Now? Before my very eyes?!" A strange light emanates from the orb, infusing the room. ${h.n} feels ${stat === 'POW' ? 'stronger' : 'healthier'} already! ${stat === 'POW' ? 'POW +2!' : 'Maximum HP +10!'}`;
stage2Effect = 'IMMEDIATE DOUBLE';
removeNeutralFromDeck('oracle'); // Remove oracle entirely - effect already granted
}

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/oracle1.png',
title: 'The Oracle\'s Fortune',
diceRoll: rollText,
outcomes: [
`${h.n} steps forward seeking ${stat === 'POW' ? 'Power' : 'Life'}.`,
`The Oracle gazes into the crystal sphere, then speaks: ${fortune}`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

function showOracle2() {
if(S.oracleHero == null || S.oracleRoll == null) {
nextFloor();
return;
}

const heroIdx = S.oracleHero;
const stat = S.oracleStat;
const roll = S.oracleRoll;
const h = S.heroes[heroIdx];

let outcome = '';

if(roll === 1) {
// CURSE
if(stat === 'HP') {
h.m = Math.max(1, h.m - 5);
if(h.h > h.m) h.h = h.m;
outcome = `"Cursed! Cursed!" Dark light surges from the orb, and ${h.n} feels weaker. Maximum HP reduced by 5!`;
} else {
h.p = Math.max(0, h.p - 1);
outcome = `"Cursed! Cursed!" Dark light surges from the orb, and ${h.n} feels their strength fade. POW reduced by 1!`;
}
} else if(roll >= 10 && roll <= 15) {
// OPPOSITE
if(stat === 'HP') {
h.p++;
outcome = `"Alas, we cannot always choose our destiny", the Oracle intones. The light coalesces around ${h.n}. ${h.n} gains unexpected Power! POW +1!`;
} else {
h.m += 5;
h.h += 5;
outcome = `"Alas, we cannot always choose our destiny", the Oracle intones. The light coalesces around ${h.n}. ${h.n} gains unexpected Life! Maximum HP +5!`;
}
} else if(roll >= 16 && roll <= 19) {
// DESIRED
if(stat === 'HP') {
h.m += 5;
h.h += 5;
outcome = `"I knew you were destined to grow healthier." The light coalesces around ${h.n}. ${h.n}'s Maximum HP +5! "Alas, the orb grows cloudy. What does the future hold for you, I wonder..."`;
} else {
h.p++;
outcome = `"I knew you were destined to grow stronger." The light coalesces around ${h.n}. ${h.n}'s POW +1! "Alas, the orb grows cloudy. What does the future hold for you, I wonder..."`;
}
} else if(roll === 20) {
// IMMEDIATE DOUBLE
if(stat === 'HP') {
h.m += 10;
h.h += 10;
outcome = `Your blessings overflow! The Oracle's orb sends glittering light dancing around the room as ${h.n} surges with life force! Maximum HP +10!`;
} else {
h.p += 2;
outcome = `Your blessings overflow! The Oracle's orb sends glittering light dancing around the room as ${h.n} surges with power! POW +2!`;
}
} else {
// Rolls 2-9 shouldn't reach Stage 2, but handle defensively
outcome = 'The Oracle\'s fortune was unclear. The crystal sphere dims.';
}

removeNeutralFromDeck('oracle');

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/oracle2.png',
title: 'The Oracle\'s Promise',
outcomes: [
`The Oracle has been expecting ${h.n}. Strange chanting fills the room. As you enter her chamber, the crystal sphere flares brightly!`,
outcome
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 6. ENEMY ENCAMPMENT =====
function showEncampment1() {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Enemy Encampment',
description: 'From the last chamber\'s exit, you spy some enemies in their encampment, preparing for their next battle. They haven\'t noticed you yet. You might be able to sneak by, or this could be a good chance to get the jump on them.',
buttons: `
<button class="btn risky" onclick="chooseEncampmentAction('sneak')">Sneak by?</button>
<button class="btn risky" onclick="chooseEncampmentAction('engage')">Engage early</button>
`
});
}

function chooseEncampmentAction(action) {
const v = document.getElementById('gameView');
let buttons = '';
S.heroes.forEach((h, i) => {
const hp = h.ls ? `Last Stand (T${h.lst+1})` : `${h.h}/${h.m}❤`;
buttons += `<button class="neutral-btn ${action === 'sneak' ? '' : 'risky'}" onclick="${action === 'sneak' ? 'sneakByEncampment' : 'engageEarlyEncampment'}(${i})">${h.n} - ${h.p}💥 | ${hp}</button>`;
});
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: action === 'sneak' ? 'Choose Scout' : 'Choose Leader',
description: `Which hero will ${action === 'sneak' ? 'sneak past the encampment' : 'lead the charge'}?`,
buttons
});
}

function sneakByEncampment(heroIdx) {
const hero = S.heroes[heroIdx];
const {rolls, best} = rollD20Neutral();
const rollText = showD20Result(rolls, best);

let outcome = '';
if(best >= 1 && best <= 10) {
outcome = `Well, that's why the enemies set up a trip wire. It worked. It's an ambush!`;
replaceStage1WithStage2('encampment');
S.ambushed = true;
toast('Next combat will be AMBUSHED!', 1800);

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past',
diceRoll: rollText,
outcomes: [outcome],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else if(best >= 11 && best <= 19) {
outcome = `You slip past quietly. The enemies remain unaware.`;

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past',
diceRoll: rollText,
outcomes: [outcome],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else {
// Roll 20 - recruit a straggler! Ask which hero should recruit them
const comp = getEnemyComp(S.floor + 1);
const stragglerType = comp[Math.floor(Math.random() * comp.length)];
const base = E[stragglerType];

// Store straggler data for selection
window.pendingStragglerData = { base, stragglerType };

outcome = `As you sneak by, you spy an enemy straggler who appears to be hiding from the group... It looks like they want to join your party!`;

// Show hero selection for who should recruit
const v = document.getElementById('gameView');
let heroButtons = '';
S.heroes.forEach((h, i) => {
const hp = h.ls ? `Last Stand (T${h.lst+1})` : `${h.h}/${h.m}❤`;
heroButtons += `<button class="neutral-btn safe" onclick="assignRecruitToHero(${i})">${h.n} - ${h.p}💥 | ${hp}</button>`;
});

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past - NAT 20!',
diceRoll: rollText,
description: `${outcome}<br><br><strong>Who should recruit the ${base.n}?</strong>`,
buttons: heroButtons
});
}
}

function assignRecruitToHero(heroIdx) {
const { base, stragglerType } = window.pendingStragglerData;
const hero = S.heroes[heroIdx];
const fuMultiplier = S.gameMode === 'fu' ? 3 : 1;
const straggler = {
id: `recruit-${crypto.randomUUID()}`,
n: base.n,
p: base.p * fuMultiplier,
h: base.h * fuMultiplier,
m: base.m * fuMultiplier,
g: base.g,
x: base.x,
s: [],
pool: base.pool,
maxLevel: base.maxLevel || 1,
sigilLevels: base.sigilLevels || {},
gainRate: base.gainRate || 3,
turnsSinceGain: 0,
drawsPerTurn: base.drawsPerTurn || 1,
st: 0,
li: heroIdx,
sh: 0,
alphaActed: false,
recruitedBy: heroIdx,
isRecruit: true
};
// Add permanent sigils
if(base.permSigils) base.permSigils.forEach(ps => straggler.s.push({sig:ps.s, level:ps.l, perm:true}));
// Add start sigils
if(base.startSigils) {
if(Array.isArray(base.startSigils)) {
base.startSigils.forEach(ss => straggler.s.push({sig:ss.s, level:ss.l, perm:false}));
} else {
for(let j = 0; j < base.startSigils; j++) {
drawEnemyStartSigil(straggler, base);
}
}
}
// Handle startRandom: draw additional random L1 sigils
if(base.startRandom) {
for(let j = 0; j < base.startRandom; j++) {
drawEnemyStartSigil(straggler, base, true);
}
}
if(!S.recruits) S.recruits = [];

// Check if hero already has a recruit
const existingRecruit = S.recruits.find(r => r.recruitedBy === heroIdx);
if(existingRecruit) {
// Store both for replacement choice
S.pendingNewRecruit = straggler;
S.pendingOldRecruitId = existingRecruit.id;
const v = document.getElementById('gameView');
const oldName = existingRecruit.n;
const newName = straggler.n;
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Replace Recruit?',
outcomes: [`${hero.n} already has ${oldName}... Replace them with the new ${newName}?`],
buttons: `<button class="btn" onclick="keepCurrentRecruit()">Keep ${oldName}</button><button class="btn safe" style="margin-left:0.5rem" onclick="replaceWithNewRecruit()">Replace with ${newName}</button>`
});
} else {
S.recruits.push(straggler);
const outcome = `The Recruited ${base.n} looks glad to join ${hero.n}'s side and will fight loyally!`;
toast(`${base.n} recruited! Will fight in ${hero.n}'s lane!`, 1800);
window.pendingStragglerData = null;

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Recruit Joined!',
outcomes: [outcome],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}
}

function keepCurrentRecruit() {
S.pendingNewRecruit = null;
S.pendingOldRecruitId = null;
window.pendingStragglerData = null;
toast('Kept current recruit.', 1200);
nextFloor();
}

function replaceWithNewRecruit() {
if(!S.pendingNewRecruit || !S.pendingOldRecruitId) { nextFloor(); return; }
const oldRecruit = S.recruits.find(r => r.id === S.pendingOldRecruitId);
S.recruits = S.recruits.filter(r => r.id !== S.pendingOldRecruitId);
S.recruits.push(S.pendingNewRecruit);
toast(`${S.pendingNewRecruit.n} replaces ${oldRecruit?.n || 'old recruit'}!`, 1500);
S.pendingNewRecruit = null;
S.pendingOldRecruitId = null;
window.pendingStragglerData = null;
nextFloor();
}

function engageEarlyEncampment(heroIdx) {
const hero = S.heroes[heroIdx];
const {rolls, best} = rollD20Neutral();
const rollText = showD20Result(rolls, best);

const v = document.getElementById('gameView');

if(best >= 1 && best <= 15) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
diceRoll: rollText,
outcomes: [`As the heroes sneak up to the camp, a scout's horn sounds. You've been spotted, and you're surrounded! It's an ambush!`],
buttons: `<button class="btn" onclick="finishEncampmentFail()">Continue</button>`
});
} else if(best >= 16 && best <= 19) {
S.encampmentEarlyKills = 1;
replaceStage1WithStage2('encampment');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
diceRoll: rollText,
outcomes: [`Your frogs work together to lure one enemy away and take him out! He screams as he dies, though, and by the time you turn, the rest are scrambling to form ranks.`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else {
S.encampmentEarlyKills = 2;
replaceStage1WithStage2('encampment');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
diceRoll: rollText,
outcomes: [`With an excellent ploy, you succeed at picking off 2 enemies! The next combat should be a walk in the pond!`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}
}

function finishEncampmentFail() {
replaceStage1WithStage2('encampment');
S.ambushed = true;
toast('Next combat will be AMBUSHED!', 1800);
nextFloor();
}

// ===== 6b. ENCAMPMENT STAGE 2 =====
function showEncampment2() {
const healAmt = Math.floor(S.heroes[0].m * 0.5);
const goldGain = 2 * S.heroes.length;

S.heroes.forEach(h => {
if(!h.ls) {
h.h = Math.min(h.h + healAmt, h.m);
}
});

S.gold += goldGain;
upd();
toast(`All heroes healed ${healAmt} HP!`, 1200);
toast(`Gained ${goldGain} Gold!`, 1200);

removeNeutralFromDeck('encampment');

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment2.png',
title: 'Abandoned Encampment',
description: 'You spy another enemy encampment from a distance, but this one appears abandoned. The bedrolls stink and the tack is stale, but you are able to enter and rest safely.',
outcomes: [
`All heroes restored ${healAmt} HP!`,
`Found ${goldGain} Gold in supplies!`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 7. BETWEEN THE 20s =====
function showGambling1() {
const v = document.getElementById('gameView');
// Entry requirement: minimum 2 gold
if(S.gold < 2) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling1.png',
title: 'Between the 20s',
description: 'A mysterious gambling den with glowing dice floating in the air. A sign reads: "Minimum 2 Gold to play."',
outcomes: ['<span style="color:#ef4444">You don\'t have enough gold to play.</span>'],
buttons: `<button class="btn safe" onclick="nextFloor()">Leave</button>`
});
return;
}

// Calculate wager: max 10, or highest even number player has
const maxWager = 10;
let wager = Math.min(maxWager, Math.floor(S.gold / 2) * 2);
if(wager < 2) wager = 2;

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling1.png',
title: 'Between the 20s',
description: `A mysterious gambling den beckons. Roll dice to set your range, then try to land between them. Wager: ${wager}G for a ${wager * 2}G payout.`,
outcomes: [],
buttons: `
<button class="btn safe" onclick="nextFloor()">Walk away</button>
<button class="btn risky" onclick="playBetween20s(1, ${wager})">Play (${wager}G)</button>
`
});
}

function playBetween20s(stage, wager) {
const v = document.getElementById('gameView');
// Include both permanent AND temporary upgrades (active sigils stored 0-indexed)
const d20Level = ((S.sig.D20 || 0) + (S.tempSigUpgrades.D20 || 0)) + 1;

// PHASE 1: Establish Range
const boundsCount = stage === 1 ? (d20Level + 1) : 2; // Stage 1: level+1, Stage 2: always 2
const boundsRolls = [];
for(let i = 0; i < boundsCount; i++) {
boundsRolls.push(Math.floor(Math.random() * 20) + 1);
}
const minBound = Math.min(...boundsRolls);
const maxBound = Math.max(...boundsRolls);

// Format dice display
const diceDisplay = formatDiceRolls(boundsRolls);

// Check instant loss (bounds are equal)
if(minBound === maxBound) {
S.gold -= wager;
upd();
v.innerHTML = buildNeutralHTML({
bgImage: stage === 1 ? 'assets/neutrals/gambling1.png' : 'assets/neutrals/gambling2.jpeg',
title: stage === 1 ? 'Between the 20s' : 'Between the 20s Extreme',
description: `Rolling ${boundsCount} dice to set bounds...`,
outcomes: [
`${diceDisplay}`,
`<span style="color:#ef4444">INSTANT LOSS! Both bounds are ${minBound}!</span>`,
`Lost ${wager}G.`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Store game state for phase 2/3
window.between20sState = { stage, wager, minBound, maxBound, boundsRolls };

// PHASE 2: Decision Point (Stage 1 only)
if(stage === 1) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling1.png',
title: 'Between the 20s',
description: `Rolling ${boundsCount} dice to set bounds...`,
outcomes: [
`${diceDisplay}`,
`Range set: <span style="color:#22c55e">${minBound}</span> to <span style="color:#22c55e">${maxBound}</span>`,
'You can back out for half your wager, or continue for a chance at double.'
],
buttons: `
<button class="btn risky" onclick="backOutBetween20s()">Back out (get ${Math.floor(wager / 2)}G back)</button>
<button class="btn danger" onclick="targetRollBetween20s()">Continue to target roll</button>
`
});
} else {
// Stage 2: No backing out, go straight to target roll
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling2.jpeg',
title: 'Between the 20s Extreme',
description: `Rolling ${boundsCount} dice to set bounds...`,
outcomes: [
`${diceDisplay}`,
`Range set: <span style="color:#22c55e">${minBound}</span> to <span style="color:#22c55e">${maxBound}</span>`,
'<span style="color:#3b82f6">NO BACKING OUT! Rolling for target...</span>'
],
buttons: `<button class="btn danger" onclick="targetRollBetween20s()">Roll target dice</button>`
});
}
}

function formatDiceRolls(rolls) {
return rolls.map(r => `<span style="display:inline-block;width:2.5rem;height:2.5rem;line-height:2.5rem;text-align:center;background:#1e293b;border:2px solid #475569;border-radius:0.5rem;margin:0.2rem;font-weight:bold;color:#f1f5f9;font-size:1.2rem;">${r}</span>`).join(' ');
}

function backOutBetween20s() {
const state = window.between20sState;
const refund = Math.floor(state.wager / 2);
S.gold -= state.wager;
S.gold += refund;
upd();

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling1.png',
title: 'Between the 20s',
outcomes: [
'You decide to play it safe and back out.',
`Net loss: ${state.wager - refund}G`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

function targetRollBetween20s() {
const state = window.between20sState;
const v = document.getElementById('gameView');
// Include both permanent AND temporary upgrades (active sigils stored 0-indexed)
const d20Level = ((S.sig.D20 || 0) + (S.tempSigUpgrades.D20 || 0)) + 1;

// PHASE 3: Target Roll
const targetRolls = [];
for(let i = 0; i < d20Level; i++) {
targetRolls.push(Math.floor(Math.random() * 20) + 1);
}

// Check if ANY die lands between bounds (inclusive)
const winners = targetRolls.filter(r => r >= state.minBound && r <= state.maxBound);
const won = winners.length > 0;

const targetDisplay = formatDiceRolls(targetRolls);

if(won) {
// Calculate payout
let payout = state.wager * (state.stage === 1 ? 2 : 4);
if(state.stage === 2) {
payout = Math.min(payout, 40); // Cap at 40G for Stage 2
}
const netGain = payout - state.wager;
S.gold -= state.wager; // Deduct wager before adding payout
S.gold += payout;
upd();

// Unlock Stage 2 after Stage 1 win
if(state.stage === 1) {
replaceStage1WithStage2('gambling');
toast('Between the 20s Extreme unlocked!', 1800);
}

v.innerHTML = buildNeutralHTML({
bgImage: state.stage === 1 ? 'assets/neutrals/gambling1.png' : 'assets/neutrals/gambling2.jpeg',
title: state.stage === 1 ? 'Between the 20s - WIN!' : 'Between the 20s Extreme - WIN!',
description: `Rolling ${d20Level} target ${d20Level === 1 ? 'die' : 'dice'}...`,
outcomes: [
`${targetDisplay}`,
`<span style="color:#22c55e">SUCCESS! ${winners.map(w => `[${w}]`).join(' ')} landed in range [${state.minBound}-${state.maxBound}]!</span>`,
`Won ${payout}G! (Net: +${netGain}G)`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else {
S.gold -= state.wager;
upd();

v.innerHTML = buildNeutralHTML({
bgImage: state.stage === 1 ? 'assets/neutrals/gambling1.png' : 'assets/neutrals/gambling2.jpeg',
title: state.stage === 1 ? 'Between the 20s - Loss' : 'Between the 20s Extreme - Loss',
description: `Rolling ${d20Level} target ${d20Level === 1 ? 'die' : 'dice'}...`,
outcomes: [
`${targetDisplay}`,
`<span style="color:#ef4444">MISS! No dice landed in range [${state.minBound}-${state.maxBound}].</span>`,
`Lost ${state.wager}G.`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}
}

function showGambling2() {
const v = document.getElementById('gameView');
// Entry requirement: minimum 2 gold
if(S.gold < 2) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling2.jpeg',
title: 'Between the 20s Extreme',
description: 'The high-stakes gambling den glows with intense energy. A sign reads: "Minimum 2 Gold to play - 4x payout, capped at 40G."',
outcomes: ['<span style="color:#ef4444">You don\'t have enough gold to play.</span>'],
buttons: `<button class="btn safe" onclick="nextFloor()">Leave</button>`
});
return;
}

// Calculate wager: max 10, or highest even number player has
const maxWager = 10;
let wager = Math.min(maxWager, Math.floor(S.gold / 2) * 2);
if(wager < 2) wager = 2;

// Calculate potential payout (capped at 40)
const potentialPayout = Math.min(wager * 4, 40);

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling2.jpeg',
title: 'Between the 20s Extreme',
description: `The EXTREME version! Only 2 dice for bounds, NO backing out, but ${potentialPayout}G payout! High risk, high reward.`,
outcomes: ['<span style="color:#3b82f6">WARNING: No safety net here. You\'re all in once you start.</span>'],
buttons: `
<button class="btn safe" onclick="nextFloor()">Walk away</button>
<button class="btn danger" onclick="playBetween20s(2, ${wager})">Play EXTREME (${wager}G for ${potentialPayout}G)</button>
`
});
}

// ===== 8. GHOST =====
function showGhost1() {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'The Haunted Playroom',
description: 'Various toys and games litter a dusty playroom. Two translucent boys appear before you, giggling. "Play with us! Play with us!" They reach out with spectral hands.',
buttons: `
<button class="btn danger" onclick="playWithGhostBoys()">Play with the ghost boys</button>
<button class="btn risky" onclick="nextFloor()">Avoid?</button>
`
});
}

let ghostEscapeDC = 18;
let ghostEscapeAttempts = 0;

function playWithGhostBoys() {
ghostEscapeDC = 18;
ghostEscapeAttempts = 0;
attemptGhostEscape();
}

function attemptGhostEscape() {
const {rolls, best} = rollD20Neutral();
const rollText = showD20Result(rolls, best);

const v = document.getElementById('gameView');

if(best >= ghostEscapeDC) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Escaping the Ghost Boys',
diceRoll: rollText,
outcomes: ['You clear your head and break free from the strange trance. The boys look sad to stop playing, but let you go. "Come back and play sometime... We\'re so lonely..."'],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Failed - show hero selection
let heroButtons = '';
S.heroes.forEach((h, idx) => {
heroButtons += `<button class="neutral-btn danger" onclick="applyGhostDamage(${idx})">${h.n} (${h.h}/${h.m}❤)</button>`;
});
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Trapped with the Ghost Boys',
diceRoll: rollText,
description: 'Choose which hero takes 1 damage:',
outcomes: ['You don\'t notice time passing, but pangs of hunger and fatigue make it clear you\'ve been here longer than it feels like. The boys are having a great time playing.'],
buttons: heroButtons
});
}

function applyGhostDamage(heroIdx) {
const hero = S.heroes[heroIdx];
const hadGhostCharge = hero.g > 0;

hero.h -= 1;
if(hero.h <= 0) {
hero.h = 0;
if(hero.g > 0) {
hero.g--;
hero.h = hero.m;
// EASTER EGG: Ghost charge consumed during Ghost encounter triggers conversion
if(hadGhostCharge) {
replaceStage1WithStage2('ghost');
toast(`${hero.n}'s Ghost keeps them from entering Last Stand! The boys stare in awe...`, 1800);
upd();
// Trigger the full Ghost Boys conversion (showGhost2)
showGhost2();
return;
}
} else {
hero.ls = true;
hero.lst = 0;
upd();
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Escaping the Ghost Boys',
outcomes: [
`Unable to withstand the hunger, ${hero.n} takes 1 damage and enters Last Stand! The shock breaks the ghost boys' hold!`,
'"Oops! We didn\'t realize..." they say in unison, staring at each other in horror. They begin to sob, and quickly disappear.'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}
}

toast(`${hero.n} took 1 damage!`);
ghostEscapeAttempts++;
ghostEscapeDC -= 2;
upd();

const v = document.getElementById('gameView');

if(ghostEscapeAttempts >= 9) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Finally Free',
outcomes: ['After many attempts, the ghost boys grow bored and fade away.'],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Try Again',
description: `<div style="font-size:0.9rem;margin:1rem 0">Attempts: ${ghostEscapeAttempts}/9 | Next DC: ${ghostEscapeDC}</div>`,
outcomes: [`${hero.n} took 1 damage!`],
buttons: `<button class="btn danger" onclick="attemptGhostEscape()">Try to Escape (DC ${ghostEscapeDC})</button>`
});
}

function showGhost2() {
S.ghostBoysConverted = true;
savePermanent();
toast('Ghost Boys permanently converted to Empty Playroom!', 1800);
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost2.png',
title: 'Passing On',
description: 'The ghost boys stare at each other, then at their translucent hands. "We\'re... we\'re dead. We\'re ghosts."',
outcomes: [
'Tears form in their spectral eyes. "We didn\'t know. We want to go home."',
'They hold hands and embrace you in a ghostly hug. "We would never have figured it out without you. Thank you." They vanish peacefully.',
'<span style="color:#22c55e">This room is now an Empty Playroom - you can pass safely in future runs.</span>'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

function showEmptyPlayroom() {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost2.png',
title: 'Empty Playroom',
description: 'An empty chamber, dust motes drifting in pale light. It might have been a playroom once, but whatever haunted it is long gone. The air feels peaceful.',
outcomes: ['Nothing stops you here. You pass through quietly.'],
buttons: `<button class="btn" onclick="nextFloor()">Continue to Floor ${S.floor + 1}</button>`
});
}

// ===== 9. FLUMMOXED ROYAL =====
// Helper to get random royal title
function getRandomRoyalTitle() {
return Math.random() < 0.5 ? 'Prince' : 'Princess';
}

function showRoyal1() {
// Generate random titles for each royal (the one asking for help and their beloved)
const askerTitle = getRandomRoyalTitle();
const belovedTitle = getRandomRoyalTitle();
// Store for use in acceptRoyalQuest callback
S.royalAskerTitle = askerTitle;
S.royalBelovedTitle = belovedTitle;

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal1.png',
title: 'The Flummoxed Royal',
description: `A flummoxed ${askerTitle} paces anxiously: "Please, you must help! A creature in the next chamber ate my beloved's engagement ring! But I have cooked up a stratagem to retrieve it! If you can but stun a foe on the first turn of battle, I can search for the ring!"`,
buttons: `
<button class="btn" onclick="acceptRoyalQuest()">Accept the quest</button>
<button class="btn safe" onclick="nextFloor()">Do Not Engage</button>
`
});
}

function acceptRoyalQuest() {
toast('Stun any enemy Turn 1 of next combat!', 1800);
S.royalQuestActive = true;
S.royalQuestCompleted = false;
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal1.png',
outcomes: [`The ${S.royalAskerTitle} looks hopeful: "Thank you! I'll follow you and grab it when you stun the creature!"`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

function showRoyal2() {
const v = document.getElementById('gameView');
// Use stored titles from showRoyal1, or generate new ones if not present
const askerTitle = S.royalAskerTitle || getRandomRoyalTitle();
const belovedTitle = S.royalBelovedTitle || getRandomRoyalTitle();

// Check if quest was completed
if(!S.royalQuestCompleted) {
// Quest failed
S.royalQuestActive = false;
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal1.png',
title: 'Quest Failed',
description: `The ${askerTitle} returns, dejected: "The creature fled before I could retrieve the ring. I'll have to find another way..."`,
outcomes: [`The ${askerTitle} departs sadly. No reward.`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Quest succeeded - show wedding
const allSigils = ['Attack', 'Shield', 'Heal', 'Grapple', 'Ghost', 'D20', 'Expand', 'Asterisk', 'Star', 'Alpha'];
const eligible = allSigils.filter(s => (S.sig[s] || 0) < 4);

eligible.sort((a, b) => {
const costA = S.sig[a] || 0;
const costB = S.sig[b] || 0;
return costA - costB;
});

const sigil1 = eligible[0] || 'Attack';
const sigil2 = eligible[1] || 'Shield';

removeNeutralFromDeck('royal');
S.royalQuestActive = false;

const royalActives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const royalDisplayLevel = (sig) => royalActives.includes(sig) ? (S.sig[sig] || 0) + 1 : (S.sig[sig] || 0);
let buttons = '';
buttons += `<div class="choice" onclick="chooseRoyalSigil('${sigil1}')">
<strong>${sigilIcon(sigil1)}</strong> <span style="opacity:0.7">L${royalDisplayLevel(sigil1)} → L${royalDisplayLevel(sigil1) + 1}</span>
</div>`;
buttons += `<div class="choice" onclick="chooseRoyalSigil('${sigil2}')">
<strong>${sigilIcon(sigil2)}</strong> <span style="opacity:0.7">L${royalDisplayLevel(sigil2)} → L${royalDisplayLevel(sigil2) + 1}</span>
</div>`;

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal2.png',
title: 'Royal Wedding',
description: `The ${askerTitle} welcomes you with a grand sweep of their open arms. "Ah, here are the very heroes who saved our wedding day, my love! Shall we give them the blessing we discussed?" The ${belovedTitle} beside them nods warmly.`,
outcomes: ['Each wears a garment displaying a sigil of power. As thanks for your help, you may choose one:'],
buttons
});
}

function chooseRoyalSigil(sig) {
S.sig[sig] = (S.sig[sig] || 0) + 1;
toast(`${sig} permanently upgraded to L${S.sig[sig]}!`, 1800);
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal2.png',
outcomes: [`The royal couple thanks you profusely. The ${sig} sigil glows and merges with your power!`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== OLD TAPO ENCOUNTER (FLOOR 20) =====
function showOldTapo() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div class="neutral-container">
<img src="assets/old-tapo.png" alt="Old Tapo, Master of Space and Time" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #8b5cf6;box-shadow:0 0 20px rgba(139,92,246,0.5)">
<div class="neutral-title" style="color:#8b5cf6;font-size:1.8rem">The Master of Space and Time</div>
<div class="neutral-desc" style="font-size:1.1rem;line-height:1.8;padding:1rem;background:rgba(139,92,246,0.1);border-radius:8px;margin:1rem 0">
"Tapo, you say? Yes... I was called Tapo once, wasn't I? That was 'Before'... Before I mastered the speculae of space, the tesseracts of time... before I became one with the universe. You would save me? Why, I need no saving... In a universe of infinite and terrifying possibility, there need be no fear, no hate, no pain."
</div>
<button class="btn" onclick="oldTapoSlide2()" style="background:linear-gradient(135deg, #8b5cf6, #6366f1);font-size:1.2rem;padding:1rem 2rem;margin-top:1rem">Continue</button>
</div>`;
}

function oldTapoSlide2() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div class="neutral-container">
<img src="assets/old-tapo.png" alt="Old Tapo" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #8b5cf6;box-shadow:0 0 20px rgba(139,92,246,0.5)">
<div class="neutral-title" style="color:#8b5cf6;font-size:1.8rem">The Master of Space and Time</div>
<div class="neutral-desc" style="font-size:1.1rem;line-height:1.8;padding:1rem;background:rgba(139,92,246,0.1);border-radius:8px;margin:1rem 0">
"Noble frogs of my youth, do you understand? Of course not... For you are the true tadpoles, on this fleeting cosmic scale. But you cannot understand, not as I have understood... There is only love, and joy, and progress... And flies. I have transcended the need for food, but that Flydra sure looked yummy..."
</div>
<button class="btn" onclick="oldTapoTransform()" style="background:linear-gradient(135deg, #8b5cf6, #6366f1);font-size:1.2rem;padding:1rem 2rem;margin-top:1rem">Continue</button>
</div>`;
}

function oldTapoTransform() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div class="neutral-container">
<div class="neutral-desc" style="font-size:1.1rem;line-height:1.8;padding:1rem;background:rgba(139,92,246,0.1);border-radius:8px;margin:1rem 0;text-align:center">
"Ah! I know!" <em>*Poof*</em>
</div>
<div style="text-align:center;margin:2rem 0">
<img src="assets/tapo-nobg.png" alt="Baby Tapo" style="max-width:100%;height:auto;max-width:300px;margin:0 auto 1rem auto;display:block;animation:bounce 1s ease-in-out 3">
<div class="neutral-desc" style="font-size:1.1rem;line-height:1.8;padding:1rem;margin:1rem 0">
<em>Squeals.</em> The heroes know this sound well - Baby Tapo is hungry for flies!
</div>
<div style="font-size:2.5rem;font-weight:bold;color:#3b82f6;text-shadow:0 0 10px rgba(251,191,36,0.5);margin:2rem 0;animation:glow 1s ease-in-out infinite">
✨ Tapo Unlocked! ✨
</div>
<div class="neutral-outcome" style="font-size:1.1rem;margin:1.5rem 0">
Baby Tapo has been added to your hero roster!<br>
<span style="color:#22c55e">Stats: 1 HP / 1 POW</span><br>
<span style="color:#8b5cf6">Starts with D20 + any upgraded passives!</span>
</div>
</div>
<button class="btn" onclick="completeTapoUnlock()" style="background:linear-gradient(135deg, #3b82f6, #f97316);font-size:1.2rem;padding:1rem 2rem;margin-top:1rem">Victory!</button>
</div>
<style>
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
@keyframes glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>`;
}

function completeTapoUnlock() {
S.tapoUnlocked = true;
savePermanent();
win();
}

// ===== DEATH DIALOGUE SEQUENCE =====
function showDeathIntroDialogue() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="background:#2c2416;padding:2rem;border-radius:8px;max-width:800px;margin:2rem auto;color:#e8dcc4">
<img src="assets/neutrals/shopkeeper2.png" alt="The mysterious shopkeeper" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
<h1 style="text-align:center;margin-bottom:2rem;font-size:2.5rem;color:#dc2626">☠️ DEATH ☠️</h1>
<p style="font-size:1.2rem;line-height:1.6;margin-bottom:2rem;text-align:center">
"Oh hey, it's you! I'm the one who's been giving you tips along the way."
</p>
<p style="font-size:1.2rem;line-height:1.6;margin-bottom:2rem;text-align:center">
"I'm supposed to take you to the next life… but you're not from this realm, are you?"
</p>
<div class="choice" onclick="showDeathResponseDialogue(true)" style="cursor:pointer">
<strong>Yes, I'm from a place called Ribbleton!</strong>
</div>
<div class="choice" onclick="showDeathResponseDialogue(false)" style="cursor:pointer">
<strong>No, I sure am from this realm!</strong>
</div>
</div>`;
}

function showDeathResponseDialogue(fromRibbleton) {
const v = document.getElementById('gameView');
const responseText = fromRibbleton
? "Ribbleton! I thought so. Not many travelers make it here from other realms."
: "Is that so? Well, regardless of where you're from...";

v.innerHTML = `
<div style="background:#2c2416;padding:2rem;border-radius:8px;max-width:800px;margin:2rem auto;color:#e8dcc4">
<img src="assets/neutrals/shopkeeper2.png" alt="The mysterious shopkeeper" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
<h1 style="text-align:center;margin-bottom:2rem;font-size:2.5rem;color:#dc2626">☠️ DEATH ☠️</h1>
<p style="font-size:1.2rem;line-height:1.6;margin-bottom:1.5rem;text-align:center">
"${responseText}"
</p>
<p style="font-size:1.2rem;line-height:1.6;margin-bottom:2rem;text-align:center">
"Well, it might be more profitable for <em>both</em> of us if I don't, you know… kill you. I have another arrangement in mind."
</p>
<button class="btn danger" onclick="completeDeathIntro()" style="font-size:1.2rem;padding:1rem 2rem;margin:0 auto;display:block">Continue...</button>
</div>`;
}

function completeDeathIntro() {
// Mark the intro as seen
S.tutorialFlags.death_intro = true;
savePermanent();
// Show the actual death screen with upgrades
showDeathScreen();
}


