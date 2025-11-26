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
// TUTORIAL: Floor 2 always gets Oracle Stage 1
if(S.floor === 2 && !S.tutorialFlags.neutral_intro) {
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
const d20Level = S.sig.D20 || 1;
// TUTORIAL: Explain D20 level affects neutral rolls
showTutorialPop('neutral_d20_level', "These D20 checks use the same Level as your D20 sigil from combat - leveling it up improves your odds everywhere!");
return rollDice(d20Level, 20);
}

function showD20Result(rolls, best) {
// Visual dice display with highlighted best roll - improved contrast
const diceHTML = rolls.map(r => {
const isBest = r === best;
return `<span style="display:inline-block;width:2.5rem;height:2.5rem;line-height:2.5rem;text-align:center;background:${isBest ? '#166534' : '#1e293b'};border:2px solid ${isBest ? '#15803d' : '#475569'};border-radius:0.5rem;margin:0.2rem;font-weight:bold;color:${isBest ? '#bbf7d0' : '#f1f5f9'};font-size:1.2rem;${isBest ? 'box-shadow:0 0 12px rgba(22,163,74,0.6);' : ''}">${r}</span>`;
}).join(' ');
return `<div style="margin:0.5rem 0"><div style="font-size:0.9rem;margin-bottom:0.5rem;color:#666">Rolling ${rolls.length}d20:</div>${diceHTML}</div>`;
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
<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a1a;padding:1rem;overflow-y:auto">
<!-- Green mat container -->
<div style="background:#22c55e;border:4px solid #000;border-radius:12px;padding:1.5rem;max-width:600px;width:90%;box-shadow:0 8px 16px rgba(0,0,0,0.5)">
<!-- Title image with version label -->
<div style="position:relative;margin-bottom:1.5rem">
<img src="assets/title-screen.png" style="width:100%;height:auto;border-radius:8px;border:3px solid #000;display:block;box-shadow:0 4px 8px rgba(0,0,0,0.3)">
<div style="position:absolute;top:0.3rem;right:0.3rem;background:rgba(0,0,0,0.85);padding:0.25rem 0.5rem;border-radius:6px;border:2px solid rgba(251,191,36,0.7)">
<p style="font-size:0.7rem;color:#3b82f6;font-weight:bold;text-align:right;margin:0">v${GAME_VERSION}</p>
</div>
</div>

<!-- Single Play button -->
<button class="btn" onclick="showSaveSlotSelection()" style="width:100%;font-size:1.2rem;padding:1rem;background:#3b82f6;border:3px solid #f97316;font-weight:bold">🐸 PLAY 🐸</button>
</div>
</div>`;
}

// Show save slot selection screen
function showSaveSlotSelection() {
const v = document.getElementById('gameView');
const slot1 = getSlotMetadata(1);
const slot2 = getSlotMetadata(2);

v.innerHTML = `
<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a1a;padding:1rem;overflow-y:auto">
<div style="background:#22c55e;border:4px solid #000;border-radius:12px;padding:1.5rem;max-width:600px;width:100%;box-shadow:0 8px 16px rgba(0,0,0,0.5)">
<h2 style="text-align:center;margin-bottom:1.5rem;font-size:1.5rem">Select Save Slot</h2>

<!-- Slot 1 -->
<div style="background:white;border:3px solid #000;border-radius:8px;padding:1rem;margin-bottom:1rem">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<h3 style="font-size:1.2rem;margin:0">Slot 1</h3>
</div>
${slot1.exists ? `
<div style="font-size:0.9rem;opacity:0.8;margin-bottom:0.5rem">
<div>📊 Runs Attempted: <strong>${slot1.runsAttempted}</strong></div>
<div>💰 Going Rate: <strong>${slot1.goingRate}G</strong></div>
${slot1.hasActiveRun ? '<div style="color:#22c55e;font-weight:bold">🎮 Active Run In Progress</div>' : ''}
</div>
<div style="display:flex;gap:0.5rem">
<button class="btn" onclick="continueSlot(1)" style="flex:1;background:#22c55e;border:3px solid #16a34a;font-weight:bold">${slot1.hasActiveRun ? '▶️ Continue' : '🆕 New Run'}</button>
<button class="btn secondary icon" onclick="confirmDeleteSlot(1)">🗑️</button>
</div>
` : `
<p style="opacity:0.6;margin-bottom:0.5rem">Empty Slot</p>
<button class="btn" onclick="createNewSlot(1)" style="width:100%;background:#3b82f6;border:3px solid #f97316;font-weight:bold">🆕 New Game</button>
`}
</div>

<!-- Slot 2 -->
<div style="background:white;border:3px solid #000;border-radius:8px;padding:1rem;margin-bottom:1rem">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<h3 style="font-size:1.2rem;margin:0">Slot 2</h3>
</div>
${slot2.exists ? `
<div style="font-size:0.9rem;opacity:0.8;margin-bottom:0.5rem">
<div>📊 Runs Attempted: <strong>${slot2.runsAttempted}</strong></div>
<div>💰 Going Rate: <strong>${slot2.goingRate}G</strong></div>
${slot2.hasActiveRun ? '<div style="color:#22c55e;font-weight:bold">🎮 Active Run In Progress</div>' : ''}
</div>
<div style="display:flex;gap:0.5rem">
<button class="btn" onclick="continueSlot(2)" style="flex:1;background:#22c55e;border:3px solid #16a34a;font-weight:bold">${slot2.hasActiveRun ? '▶️ Continue' : '🆕 New Run'}</button>
<button class="btn secondary icon" onclick="confirmDeleteSlot(2)">🗑️</button>
</div>
` : `
<p style="opacity:0.6;margin-bottom:0.5rem">Empty Slot</p>
<button class="btn" onclick="createNewSlot(2)" style="width:100%;background:#3b82f6;border:3px solid #f97316;font-weight:bold">🆕 New Game</button>
`}
</div>

<button class="btn secondary" onclick="mainTitlePage()" style="width:100%">← Back</button>
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
toast('Failed to load slot');
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
S.runsAttempted = 1;
S.runNumber = 1;
newGame();
}

// Start new game in existing slot
function newGameInSlot(slot) {
S.currentSlot = slot;
localStorage.setItem('froggle8_current_slot', slot.toString());
S.runNumber = (S.runsAttempted || 1);
if(S.runNumber === 1 && !S.helpTipsDisabled) {
showTutorialStory();
} else {
title();
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
toast('Failed to delete slot');
}
});
}

function newGame() {
// Reset runNumber to 1 for new game (allows tutorial to show)
S.runNumber = 1;
debugLog('[FROGGLE] newGame called - runNumber:', S.runNumber, 'helpTipsDisabled:', S.helpTipsDisabled);
if(S.runNumber === 1 && !S.helpTipsDisabled) {
debugLog('[FROGGLE] Showing tutorial story');
showTutorialStory();
} else {
debugLog('[FROGGLE] Skipping tutorial, going to title()');
title();
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
toast('Error: Invalid save file!');
console.error('Import error:', err);
}
};
reader.readAsText(file);
};
input.click();
}

// ===== NARRATIVE SLIDE SYSTEM =====
function showNarrativeSlide(slides, currentIndex = 0) {
debugLog('[FROGGLE] showNarrativeSlide called - currentIndex:', currentIndex, 'total slides:', slides.length);
if(currentIndex >= slides.length) {
// All slides shown, call completion callback
debugLog('[FROGGLE] All slides complete, calling onComplete');
if(slides.onComplete) slides.onComplete();
return;
}

const slide = slides[currentIndex];
debugLog('[FROGGLE] Rendering slide', currentIndex);
const v = document.getElementById('gameView');
debugLog('[FROGGLE] gameView element:', v);
const skipButton = slides.skippable ? `<button class="btn" onclick="skipTutorialFromSlide()" style="padding:0.75rem 2rem;background:#888;margin-left:1rem">Skip Tutorial</button>` : '';
debugLog('[FROGGLE] Setting innerHTML for slide', currentIndex);
v.innerHTML = `
<div style="max-width:600px;margin:2rem auto;padding:1rem">
${slide.html || `<div style="font-size:1.1rem;line-height:1.8;margin-bottom:2rem;text-align:center">${slide.text}</div>`}
<div style="text-align:center;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
<button class="btn" onclick="continueNarrative()" style="padding:0.75rem 2rem">${slide.buttonText || 'Continue'}</button>
${skipButton}
</div>
</div>`;

window.currentNarrativeSlides = slides;
window.currentNarrativeIndex = currentIndex;
debugLog('[FROGGLE] Slide', currentIndex, 'rendered successfully');
}

function continueNarrative() {
const slides = window.currentNarrativeSlides;
const nextIndex = window.currentNarrativeIndex + 1;
showNarrativeSlide(slides, nextIndex);
}

function showSkipTutorialConfirmation(proceedCallback) {
// Show friendly skip confirmation
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:500px">
<h2 style="font-size:1.5rem;margin-bottom:1rem;text-align:center">Alright champ! 💪</h2>
<p style="font-size:1.1rem;line-height:1.6;text-align:center;margin-bottom:1.5rem">
You're on your own - get going and save Tapo!
</p>
<p style="font-size:0.95rem;line-height:1.5;text-align:center;margin-bottom:0.5rem;opacity:0.9">
Need help? Check out the <strong>FAQ</strong> and <strong>Sigilarium</strong> buttons at the top of the screen anytime!
</p>
<p style="font-size:0.8rem;line-height:1.4;text-align:center;margin-bottom:1.5rem;opacity:0.7">
(Help/tips can be disabled in the Settings menu)
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
toast('Tutorial skipped!', ANIMATION_TIMINGS.TOAST_SHORT);
setTimeout(() => transitionScreen(showTitleCard), ANIMATION_TIMINGS.ACTION_COMPLETE);
});
}

// ===== RIBBLETON TUTORIAL INTRO =====
function showTutorialStory() {
debugLog('[FROGGLE] showTutorialStory START');
const slides = [
{
html: `
<div style="text-align:center">
<h2 style="font-size:1.8rem;margin-bottom:1rem;color:#22c55e">Tapo's First Birthday!</h2>
<div style="margin:1.5rem 0">
<img src="assets/tapo-nobg.png" style="max-width:250px;height:auto;animation:tapoBounce 3s ease-in-out infinite">
</div>
<p style="font-size:1.1rem;line-height:1.8;margin:1rem 0">
Today is <strong>Tapo the Tadpole's first birthday!</strong> 🎉
</p>
</div>
<style>
@keyframes tapoBounce {
0% { transform: translateY(0) scaleX(1); }
10% { transform: translateY(-20px) scaleX(1); }
15% { transform: translateY(-10px) scaleX(1); }
20% { transform: translateY(-25px) scaleX(1); }
30% { transform: translateY(0) scaleX(1); }
50% { transform: translateY(0) scaleX(-1); }
60% { transform: translateY(-20px) scaleX(-1); }
65% { transform: translateY(-10px) scaleX(-1); }
70% { transform: translateY(-25px) scaleX(-1); }
80% { transform: translateY(0) scaleX(-1); }
100% { transform: translateY(0) scaleX(1); }
}
</style>
`
},
{
html: `
<div style="text-align:center">
<h2 style="font-size:1.8rem;margin-bottom:1rem;color:#2c63c7">A Special Gift</h2>
<div style="display:flex;justify-content:center;align-items:center;gap:2rem;margin:2rem 0">
<div>
<img src="assets/characters/magefull.png" style="width:150px;height:auto;border-radius:8px;border:2px solid #22c55e;box-shadow:0 4px 8px rgba(0,0,0,0.2)">
<div style="text-align:center;margin-top:0.5rem;font-weight:bold">Mage</div>
</div>
<div style="font-size:3rem">🎁</div>
<div style="animation:tapoBounceSmall 2s ease-in-out infinite">
<img src="assets/tapo-nobg.png" style="width:120px;height:auto">
<div style="text-align:center;margin-top:0.5rem;font-weight:bold">Tapo</div>
</div>
</div>
<p style="font-size:1.1rem;line-height:1.8;margin:1rem 0">
Mage promised to teach Tapo how to catch flies as a birthday present!<br>
Together they set off to find some flies.
</p>
</div>
<style>
@keyframes tapoBounceSmall {
0%, 100% { transform: translateY(0); }
50% { transform: translateY(-15px); }
}
</style>
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
// Show Phase 1 narrative overlay
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:550px">
<p style="font-size:1.2rem;line-height:1.6;margin-bottom:1.5rem;text-align:center">
🪰 <strong>Two flies</strong> are buzzing around! 🪰
</p>
<p style="font-size:1rem;line-height:1.6;text-align:center;margin-bottom:1.5rem">
Help Mage catch them for Tapo's birthday!
</p>
<button onclick="dismissTaposBirthdayOverlay()" style="padding:0.75rem 2rem;font-size:1.1rem;font-weight:bold;background:#22c55e;color:#fff;border:2px solid #15803d;border-radius:8px;cursor:pointer;display:block;margin:0 auto">Let's catch flies!</button>
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
// Show first tutorial popup
showTutorialPop('tapo_first_attack', "Click Mage's Attack sigil to catch a fly!", () => {
tutorialState.stage = 'catching_flies';
render();
});
}

function startTaposBirthdayTutorial() {
// Phase 1: Mage vs 2 Flies - Mage gets Expand on Turn 2
S.floor = 0;
S.xp = 0;
S.levelUpCount = 0;
S.heroes = [
{id:'h_tutorial_mage', n:'Mage', p:1, h:5, m:5, s:['Attack'], sh:0, g:0, ls:false, lst:0, ts:[], st:0}
];

// Add permanent passives (Asterisk, Star)
const passiveSigils = ['Asterisk', 'Star'];
S.heroes.forEach(hero => {
passiveSigils.forEach(passive => {
const permLevel = S.sig[passive] || 0;
if(permLevel > 0 && !hero.s.includes(passive)) {
hero.s.push(passive);
}
});
});

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

function finishTaposBirthdayPhase() {
// Phase 1 victory celebration
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="text-align:center;padding:2rem">
<h2 style="font-size:1.8rem;margin-bottom:1rem;color:#22c55e">Success!</h2>
<p style="font-size:1.1rem;line-height:1.8;margin:1rem 0">
Mage and Tapo catch all the flies!<br>
Tapo squeals with delight as they share the tasty treats together. 🎉
</p>
<button onclick="transitionToPortalInvasion()" style="padding:0.75rem 2rem;font-size:1.1rem;font-weight:bold;background:#22c55e;color:#fff;border:2px solid #15803d;border-radius:8px;cursor:pointer;margin-top:1rem">Continue</button>
</div>`;
}

function transitionToPortalInvasion() {
// Show portal opening narrative
const slides = [
{
html: `
<div style="text-align:center">
<h2 style="font-size:1.8rem;margin-bottom:1rem;color:#dc2626;animation:shake 0.5s ease-in-out infinite">DANGER!</h2>
<div style="margin:1.5rem 0;position:relative">
<div style="width:200px;height:200px;margin:0 auto;position:relative;border-radius:50%;background:radial-gradient(circle, #dc2626, #7c2d12);animation:narrativePortalPulse 1s ease-in-out infinite;box-shadow:0 0 40px #dc2626"></div>
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:4rem;animation:spin 2s linear infinite">🌀</div>
</div>
<p style="font-size:1.1rem;line-height:1.8;margin:1rem 0">
Suddenly, <strong>a dark portal</strong> tears open in the square!<br>
Tank, Warrior, and Healer rush to defend Tapo and Mage!
</p>
<div style="display:flex;justify-content:center;gap:2rem;margin:1.5rem 0;font-size:3rem">
<div style="animation:enemyAppear 1s ease-out">👺</div>
<div style="animation:enemyAppear 1.3s ease-out">🐺</div>
</div>
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
// Show narrative on TOP of combat screen
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:550px">
<p style="font-size:1.1rem;line-height:1.6;margin-bottom:1.5rem">
A Goblin and a Wolf appear from the portal!
</p>
<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:1.5rem;align-items:center;margin:1.5rem 0">
<div style="display:flex;gap:0.5rem;align-items:center;justify-content:center">
<div style="animation:defensiveStance 1.5s ease-in-out infinite">
<img src="assets/characters/tankfull.png" style="width:70px;height:auto;border-radius:6px;border:2px solid #22c55e;transform:scaleX(-1)">
<div style="text-align:center;font-size:0.65rem;font-weight:bold;margin-top:0.25rem">🛡 On Guard!</div>
</div>
<div style="text-align:center">
<img src="assets/tapo.png" style="width:60px;height:auto;border-radius:6px;border:2px solid #000">
<div style="font-size:0.65rem;opacity:0.7;margin-top:0.25rem">Protected!</div>
</div>
<div style="animation:defensiveStance 1.3s ease-in-out infinite">
<img src="assets/characters/magefull.png" style="width:70px;height:auto;border-radius:6px;border:2px solid #22c55e">
<div style="text-align:center;font-size:0.65rem;font-weight:bold;margin-top:0.25rem">📖 On Guard!</div>
</div>
</div>
<div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;font-size:2.5rem">
<div style="animation:enemyThreat 1s ease-in-out infinite">👺</div>
<div style="animation:enemyThreat 1.2s ease-in-out infinite">🐺</div>
</div>
<div style="display:flex;flex-direction:column;gap:0.5rem;align-items:center">
<div style="animation:chargeForward 0.8s ease-out infinite alternate">
<img src="assets/characters/warriorfull.png" style="width:80px;height:auto;border-radius:6px;border:2px solid #3b82f6;transform:scaleX(-1)">
<div style="text-align:center;font-size:0.7rem;font-weight:bold;margin-top:0.25rem">⚔️ Attacking!</div>
</div>
<div style="animation:chargeForward 1s ease-out infinite alternate">
<img src="assets/characters/healerfull.png" style="width:80px;height:auto;border-radius:6px;border:2px solid #3b82f6;transform:scaleX(-1)">
<div style="text-align:center;font-size:0.7rem;font-weight:bold;margin-top:0.25rem">✚ Attacking!</div>
</div>
</div>
</div>
<p style="font-size:1rem;line-height:1.6;text-align:center;font-style:italic;opacity:0.9">
Tank and Mage stand guard around Tapo while Warrior and Healer charge toward the portal!
</p>
<div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
<button onclick="dismissStoryOverlay()" style="padding:0.75rem 2rem;font-size:1.1rem;font-weight:bold;background:#22c55e;color:#fff;border:2px solid #15803d;border-radius:8px;cursor:pointer">Let's fight!</button>
<button onclick="skipTutorialFromOverlay()" style="padding:0.75rem 2rem;font-size:1.1rem;font-weight:bold;background:#888;color:#fff;border:2px solid #666;border-radius:8px;cursor:pointer">Skip Tutorial</button>
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

// PROMPT 1: Warrior Attack + Targeting (BATCHED)
showTutorialPop('ribbleton_warrior_attack', "Welcome to combat! Click the Warrior's Attack sigil.", () => {
debugLog('[TUTORIAL] Prompt 1 dismissed - transitioning to warrior_attack stage');
tutorialState.stage = 'warrior_attack';
S.activeIdx = 0;
debugLog('[TUTORIAL] S.activeIdx is now:', S.activeIdx);
render();
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
// Post-combat narrative
const slides = [
{text: "The few enemies remaining around Ribbleton scamper back into the portal. Relieved, the frog heroes sheathe their weapons and look for Tapo - but he's missing!!"},
{text: "As the Ribbletonians search high and low, the heroes realize there's only one possibility - the poor tadpole has squiggled his way through the portal!"},
{text: "The townspeople gather around the heroes. \"You must bring him home!\" they plead. The heroes nod solemnly - Ribbleton will be their sanctuary, and they'll return here between each rescue attempt."}
];
slides.onComplete = showTitleCard;
showNarrativeSlide(slides, 0);
}

function showTitleCard() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;z-index:30000">
<div style="text-align:center;color:#fff">
<div style="font-size:3rem;font-weight:bold;margin-bottom:1rem">FROGGLE</div>
<div style="font-size:1.5rem;font-style:italic">A Froggy Roguelike</div>
</div>
</div>`;

setTimeout(() => {
tutorialState = null;
showRibbleton(); // Go to Ribbleton hub
}, 3000); // Reduced from 5500ms to 3000ms for faster flow
}

// ===== TITLE & HERO SELECT =====
let selectedHeroView = null; // Track which hero card is currently displayed

function title() {
debugLog('[FROGGLE] title() called - Hero selection screen');
// Reset selection first
sel = [];

const v = document.getElementById('gameView');
const pedestalCount = S.pedestal.filter(p => p.mode === S.gameMode).length;
const maxSlots = 8;
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;

v.innerHTML = `
<h1 style="text-align:center;margin:2rem 0;font-size:2rem">FROGGLE 🐸</h1>
<p style="text-align:center;margin-bottom:0.5rem;font-size:0.9rem">v${GAME_VERSION}</p>
<p style="text-align:center;margin-bottom:1rem;font-size:1.1rem;font-weight:bold">Mode: <span style="color:${S.gameMode === 'fu' ? '#dc2626' : '#22c55e'}">${S.gameMode === 'Standard' ? 'Standard' : 'FROGGED UP 🔥'}</span></p>

<div style="text-align:center;margin-bottom:1rem">
<button class="btn secondary" onclick="showFAQ()" style="padding:0.75rem 1.5rem;font-size:1rem;font-weight:bold">
❓ Help/FAQ
</button>
</div>

${S.fuUnlocked ? `<div style="text-align:center;margin-bottom:1rem">
<button class="btn" onclick="showChampionsMenu()" style="padding:0.75rem 1.5rem;background:linear-gradient(135deg,#3b82f6,#f97316);font-weight:bold">
🏆 Champions of Floor 20 🏆
</button></div>` : ''}

<div style="max-width:600px;margin:0 auto">
<h2 style="text-align:center;margin-bottom:1rem;font-size:1.3rem">Choose ${requiredHeroes} Heroes</h2>
<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem;opacity:0.7">Tap a hero to select!</p>
<div id="hero-select-container" style="position:relative;max-width:100%;margin:0 auto;cursor:pointer" onclick="handleHeroImageClick(event, this)">
<img src="assets/hero-select.png" style="width:100%;height:auto;display:block;border-radius:8px;border:3px solid #000;pointer-events:none">
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

<!-- Selection display -->
<div style="text-align:center;margin:1.5rem 0;padding:1rem;background:rgba(0,0,0,0.05);border-radius:8px">
<strong>Selected Heroes:</strong>
<div id="selection-display" style="margin-top:0.5rem;font-size:1.1rem;color:#2563eb"></div>
</div>

<button class="btn" id="start" onclick="start()" style="width:100%;padding:1rem;font-size:1.1rem">Delve into Floor 1</button>
</div>`;

debugLog('[FROGGLE] title() innerHTML set successfully');

// Shield persistence tutorial (after first run with shield usage or death)
if(!S.helpTipsDisabled && !S.tutorialFlags.shield_persistence && S.highestFloor >= 1) {
// Check if they used shield or died
const usedShield = S.sig.Shield > 0 || (S.tempSigUpgrades && S.tempSigUpgrades.Shield > 0);
if(usedShield || S.highestFloor > 0) { // highestFloor > 0 means they died at least once
setTimeout(() => {
showTutorialPop('shield_persistence', "Shields persist between battles! They're capped at max HP, so you can shield up before finishing a floor to enter the next floor with protection. Use this to survive tough encounters!");
}, 100);
}
}

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
const heroData = {
warrior: {name: 'Warrior', pow: 2, hp: 5, maxhp: 5, sigils: ['Attack', 'D20'], desc: 'A balanced fighter with strong attacks', callouts: ['Starts with 2 POW', 'Starts with Attack and D20']},
tank: {name: 'Tank', pow: 1, hp: 10, maxhp: 10, sigils: ['Shield', 'D20'], desc: 'A sturdy defender with high HP', callouts: ['Starts with 10 HP', 'Starts with Shield and D20']},
mage: {name: 'Mage', pow: 1, hp: 5, maxhp: 5, sigils: ['Attack', 'D20', 'Expand'], desc: 'A versatile caster who can hit multiple targets', callouts: ['Gets +1 Expand innately (+1 target)', 'Starts with Attack, D20, and Expand']},
healer: {name: 'Healer', pow: 1, hp: 5, maxhp: 5, sigils: ['Heal', 'D20', 'Expand'], desc: 'A support hero who can heal multiple allies', callouts: ['Gets +1 Expand innately (+1 target)', 'Starts with Heal, D20, and Expand']},
tapo: {name: 'Tapo', pow: 1, hp: 1, maxhp: 1, sigils: ['Attack', 'Shield', 'Heal', 'D20', 'Expand', 'Grapple', 'Ghost', 'Asterisk', 'Star', 'Alpha'], desc: 'The ultimate glass cannon - all sigils, minimal health!', callouts: ['Starts with ALL 10 sigils', 'Only 1 HP - high risk, high reward!']}
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
return `<span class="sigil l1 ${passiveClass}" style="font-size:0.5rem;padding:2px 4px;margin:1px;display:inline-block">${sigilIconOnly(s)}</span>`;
}).join('');
const calloutsHTML = hData.callouts ? hData.callouts.map(c => `<div style="font-size:0.45rem;text-align:left;opacity:0.9;margin:1px 0">• ${c}</div>`).join('') : '';
cardEl.innerHTML = `
<div style="background:white;border:3px solid #22c55e;border-radius:8px;padding:0.5rem;box-shadow:0 4px 6px rgba(0,0,0,0.3);pointer-events:auto;cursor:pointer"
onclick="event.stopPropagation();toggleHeroSelection('${h}')">
<div style="text-align:center">
<div style="font-size:0.7rem;font-weight:bold;margin-bottom:0.25rem">${hData.name}</div>
${hPixelImage ? `<img src="${hPixelImage}" style="width:100%;height:auto;border-radius:4px;margin-bottom:0.25rem">` : ''}
<div style="font-size:0.6rem;opacity:0.8">${hData.pow}⚡ | ${hData.hp}❤</div>
<div style="font-size:0.6rem;margin-top:0.25rem">${sigilsHTML}</div>
${calloutsHTML ? `<div style="margin-top:0.25rem;padding:0.25rem;background:rgba(251,191,36,0.1);border-radius:4px">${calloutsHTML}</div>` : ''}
<div style="font-size:0.5rem;opacity:0.7;margin-top:0.25rem">✓ SELECTED</div>
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
if(!display) return;

if(sel.length === 0) {
display.textContent = 'None';
display.style.color = '#6b7280';
} else {
const heroNames = sel.map(h => H[h].n);
display.textContent = heroNames.join(' + ');
display.style.color = '#2563eb';
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
});

// Apply pedestal buffs
S.pedestal.forEach(slot => {
if(slot.mode !== S.gameMode) return; // Only apply buffs for current mode
const hero = S.heroes.find(h => h.n === slot.hero);
if(!hero) return;
if(slot.stat === 'POW') {
hero.p += 1;
} else if(slot.stat === 'HP') {
hero.m += 5;
hero.h += 5;
}
});
initNeutralDeck();
upd();
// Check if player has starting XP from Death Boy sacrifices
if(S.startingXP > 0) {
S.xp = S.startingXP;
showStartingXPScreen();
} else {
startFloor(1);
}
}


// ===== NEUTRAL ENCOUNTERS =====
function neutral(f) {
// TUTORIAL: Show neutral intro on Floor 2
if(f === 2) {
showTutorialPop('neutral_intro', "Neutral floors offer choices and opportunities! You can walk straight through, or take a risk for potential rewards.");
}

const enc = getNeutralEncounter();

if(S.ghostBoysConverted && enc.startsWith('ghost')) {
showEmptyPlayroom();
return;
}

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
}

// ===== 1. SHOPKEEPER =====
function showShopkeeper1() {
// Reset shopkeeper state at start of each encounter (fixes bug where state persisted between runs)
shopSmallBought = false;
shopLargeBought = false;
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/shopkeeper1.png',
title: 'Potions for Sale',
description: 'A hooded figure stands behind a small cart laden with vials and bottles. Their voice is raspy and businesslike: "Potions. Gold. Fair prices."',
buttons: `
<button class="neutral-btn safe" onclick="buySmallPotion()">Small Potion (3G) - Restore 3 HP</button>
<button class="neutral-btn safe" onclick="buyLargePotion()">Large Potion (5G) - Restore 8 HP</button>
<button class="neutral-btn secondary" onclick="declineShopkeeper()">Do Not Engage</button>
`
});
}

let shopSmallBought = false;
let shopLargeBought = false;

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
buttons: heroButtons + `<button class="neutral-btn secondary" onclick="showShopkeeper1()">Back</button>`
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
showShopkeeper1();
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
buttons: heroButtons + `<button class="neutral-btn secondary" onclick="showShopkeeper1()">Back</button>`
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
showShopkeeper1();
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
let description = `The shopkeeper pulls back their hood, revealing a skull grinning beneath. "I am Death's... associate. You've impressed me. Choose wisely."<br><br><p style="text-align:center;font-weight:bold;margin:1rem 0">Cost: ${cost} Gold</p>`;
let buttons = '';
let outcomes = [];

if(available.length === 0) {
outcomes.push('All your sigils are already at maximum power. Death nods approvingly and fades away.');
buttons = `<button class="btn" onclick="finishDeathsBargain()">Continue</button>`;
} else if(S.gold < cost) {
outcomes.push('<span style="color:#dc2626">You don\'t have enough Gold! Death shakes their head and fades away.</span>');
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
toast(`${sig} permanently upgraded to L${S.sig[sig]}! (GR unchanged)`, 3000);
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
outcome = 'You slip on the wet stones and plummet! The landing is brutal.';
hpLoss = 3;
goldGain = -5;
} else if(best >= 2 && best <= 10) {
outcome = 'You climb carefully but scrape yourself on the rough stones. You manage to grab a single coin.';
hpLoss = 1;
goldGain = 1;
} else if(best >= 11 && best <= 19) {
outcome = 'Your climbing skills are impressive! You retrieve a small pouch of coins.';
goldGain = 3;
} else if(best === 20) {
outcome = 'Your descent is flawless! At the bottom, you discover a hidden cache of coins AND the well begins to overflow with crystal-clear water!';
goldGain = 2 * S.heroes.length;
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
description: 'The well now overflows with sparkling, crystal-clear water that pools around its base. The water seems to pulse with restorative energy.',
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
'The water tastes impossibly pure and refreshing. Warmth spreads through your body as all wounds close and exhaustion fades. You feel completely restored.',
'The well\'s glow fades as the water recedes to its normal level. Its magic has been spent.'
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
description: 'An ornate wooden chest sits against the far wall, its brass fittings gleaming in the torchlight. No lock is visible, but you sense this may not be as simple as it appears.',
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
trapOutcome = 'A poison dart flies out and strikes you!';
trapDmg = 3;
} else if(trapBest >= 2 && trapBest <= 9) {
trapOutcome = 'A small dart grazes your arm.';
trapDmg = 1;
} else if(trapBest >= 10 && trapBest <= 18) {
trapOutcome = 'You carefully open the chest without triggering any traps.';
} else {
trapOutcome = 'Your keen eyes spot a hidden compartment in the chest\'s lid!';
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
contentOutcome = `The chest contains ${goldGain} gold coins!`;
} else {
goldGain = Math.ceil(Math.random() * 10) * S.heroes.length;
contentOutcome = `The chest is filled with ${goldGain} gold coins!`;
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
description: 'A small silver chest sits on a stone pedestal, perfectly sized for the key you found earlier. You insert the key and it opens with a satisfying click.',
outcomes: [`Inside you find ${goldGain} gold coins, perfectly arranged!`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 4. MUMBLING WIZARD =====
function showWizard1() {
const v = document.getElementById('gameView');
let description = 'An elderly wizard stands with arms outstretched toward a wall covered in glowing hieroglyphs. He mutters continuously: "Do you see it? Do you see it? Look closely..."<br><br>Choose which hero will approach the wizard:';
let buttons = '';
S.heroes.forEach((h, idx) => {
buttons += `<button class="neutral-btn safe" onclick="heroApproachesWizard(${idx})">${h.n}</button>`;
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
outcomes: [`${h.n} stares at the glowing symbols but can't make sense of them. The wizard sighs heavily: "You don't see it. How unfortunate. Please leave."`],
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
// Prioritize passives (Star, Asterisk, Ghost) if hero has any
const heroPassives = heroNonStarters.filter(sig => ['Star', 'Asterisk', 'Ghost'].includes(sig));
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
`The hieroglyph reveals itself as the symbol for ${chosenSigil}! The wizard beams with pride.`,
`But ${h.n} doesn't possess this sigil. The wizard's face falls: "You don't have it? Useless! Get out!"`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

// Hero has it! Grant temp upgrade
if(!h.ts) h.ts = [];
if(!h.ts.includes(chosenSigil)) h.ts.push(chosenSigil);

const oldLevel = S.sig[chosenSigil] || 0;
S.sig[chosenSigil] = oldLevel + bonusLevels;

S.wizardHero = heroIdx;
S.wizardSigil = chosenSigil;

const critText = best === 20 ? ` <span style="color:#3b82f6;font-weight:bold">(CRITICAL!)</span>` : '';
toast(`${chosenSigil} temporarily upgraded to L${S.sig[chosenSigil]} for ${h.n}!`, 1800);

replaceStage1WithStage2('wizard');
setTimeout(() => {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'The Hieroglyphs',
diceRoll: rollText + critText,
outcomes: [
`The hieroglyph reveals itself as the symbol for ${chosenSigil}! ${h.n} feels power surge through them.`,
`${chosenSigil} temporarily upgraded from L${currentLevel} to L${currentLevel + bonusLevels}!`,
'"Yes! YES! You understand!" The wizard\'s eyes gleam. "But... there is more I can offer you, if you dare..."'
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
title: 'Trials of Power',
description: 'The wizard\'s eyes gleam with arcane power: "You have potential... but can you prove it? I offer you a series of trials. Each success earns you greater strength. But you must attempt them all - there is no turning back!"<br><br><div style="font-size:0.85rem;margin-top:1rem;color:#666">Four trials: DC 5, DC 10, DC 15, DC 20<br>Each success: Choose a sigil to upgrade temporarily<br>On failure: Keep all upgrades earned so far</div>',
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
`${h.n} could not meet the challenge!`,
outcomeText,
'"You have reached your limit. Take what you have earned and go."'
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
buttons += `<button class="neutral-btn safe" onclick="selectWizardUpgrade('${sig}')">${sigilIcon(sig)} ${sig} - L${currentLevel} → L${currentLevel + 1}</button>`;
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

// Apply temp upgrade
if(!h.ts) h.ts = [];
if(!h.ts.includes(sig)) h.ts.push(sig);

const oldLevel = S.sig[sig] || 0;
S.sig[sig] = oldLevel + 1;

S.wizardUpgradedSigils.push(sig);
toast(`${sig} temporarily upgraded to L${S.sig[sig]} for ${h.n}!`, 1800);

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
'"Impressive! You have proven yourself worthy. Now go forth with your newfound power!"'
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
outcomes: ['The wizard\'s glow fades. "Coward! You lack the will to seize greatness!" He returns to mumbling at the wall.'],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 5. ORACLE =====
function showOracle1() {
// Mark tutorial as seen so future runs have random neutrals
S.tutorialFlags.neutral_intro = true;
const v = document.getElementById('gameView');
let description = 'A figure shrouded in mist sits cross-legged before a crystal sphere. Their voice echoes: "Step forward. I will read your fortune. Power or Life?" Choose a hero and their desired fortune:';
let buttons = '';
S.heroes.forEach((h, idx) => {
buttons += `<button class="neutral-btn risky" onclick="oracleChoose(${idx}, 'POW')">${h.n} - Power (+1⚡)</button>`;
buttons += `<button class="neutral-btn safe" onclick="oracleChoose(${idx}, 'HP')">${h.n} - Life (+5❤ max)</button>`;
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
fortune = '"Terrible misfortune awaits you."';
stage2Effect = 'CURSE';
replaceStage1WithStage2('oracle');
} else if(best >= 2 && best <= 9) {
fortune = '"What you hope for shall not come to pass."';
stage2Effect = 'NO UNLOCK';
} else if(best >= 10 && best <= 15) {
fortune = '"Great things in your future, but not what you want."';
stage2Effect = 'OPPOSITE';
replaceStage1WithStage2('oracle');
} else if(best >= 16 && best <= 19) {
fortune = '"Your desired future shall come to pass."';
stage2Effect = 'DESIRED';
replaceStage1WithStage2('oracle');
} else {
fortune = '"It happens before my eyes!"';
stage2Effect = 'IMMEDIATE DOUBLE';
replaceStage1WithStage2('oracle');
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
if(S.oracleHero === null || S.oracleRoll === null) {
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
outcome = `${h.n} feels weaker. Maximum HP reduced by 5!`;
} else {
h.p = Math.max(0, h.p - 1);
outcome = `${h.n} feels their strength fade. POW reduced by 1!`;
}
} else if(roll >= 10 && roll <= 15) {
// OPPOSITE
if(stat === 'HP') {
h.p++;
outcome = `${h.n} gains unexpected Power! POW +1!`;
} else {
h.m += 5;
h.h += 5;
outcome = `${h.n} feels vitality surge! Maximum HP +5!`;
}
} else if(roll >= 16 && roll <= 19) {
// DESIRED
if(stat === 'HP') {
h.m += 5;
h.h += 5;
outcome = `${h.n} feels strengthened! Maximum HP +5!`;
} else {
h.p++;
outcome = `${h.n} feels power awaken! POW +1!`;
}
} else if(roll === 20) {
// IMMEDIATE DOUBLE
if(stat === 'HP') {
h.m += 10;
h.h += 10;
outcome = `${h.n} surges with life force! Maximum HP +10!`;
} else {
h.p += 2;
outcome = `${h.n} blazes with power! POW +2!`;
}
} else {
// Rolls 2-9 shouldn't reach Stage 2, but handle defensively
outcome = 'The Oracle\'s fortune was unclear. The crystal sphere dims.';
}

removeNeutralFromDeck('oracle');

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/oracle2.png',
title: 'Return to the Oracle',
outcomes: [
`${h.n} returns to the Oracle. The crystal sphere flares brightly!`,
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
title: 'Enemies Assembling Ahead',
description: 'Through a crack in the wall ahead, you spy the enemies from your next encounter preparing for battle. They haven\'t noticed you yet.',
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
buttons += `<button class="neutral-btn ${action === 'sneak' ? '' : 'risky'}" onclick="${action === 'sneak' ? 'sneakByEncampment' : 'engageEarlyEncampment'}(${i})">${h.n} - ${h.p}⚡ | ${hp}</button>`;
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
outcome = `${hero.n}'s foot catches on loose stone! The enemies hear you and prepare an ambush!`;
replaceStage1WithStage2('encampment');
S.ambushed = true;
toast('Next combat will be AMBUSHED!', 1800);
} else if(best >= 11 && best <= 19) {
outcome = `${hero.n} slips past quietly. The enemies remain unaware.`;
} else {
// Roll 20 - recruit a straggler
const comp = getEnemyComp(S.floor + 1);
const stragglerType = comp[Math.floor(Math.random() * comp.length)];
const base = E[stragglerType];
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
S.recruits.push(straggler);
outcome = `${hero.n} sneaks past perfectly AND discovers a rejected ${base.n} who joins ${hero.n}'s ranks!`;
toast(`${base.n} recruited! Will fight in ${hero.n}'s lane!`, 1800);
}

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past',
diceRoll: rollText,
outcomes: [outcome],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
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
outcomes: [`A scout spots ${hero.n} before they can strike! The enemies prepare an ambush!`],
buttons: `<button class="btn" onclick="finishEncampmentFail()">Continue</button>`
});
} else {
const kills = best === 20 ? 2 : 1;
S.encampmentEarlyKills = kills;
replaceStage1WithStage2('encampment');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
diceRoll: rollText,
outcomes: [`${hero.n} succeeds at picking off ${kills} enem${kills>1?'ies':'y'}! They're scrambling to form ranks - you'll see the battlefield and pick your targets...`],
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
description: 'The enemy got cocky and left their base undefended. You enter and rest safely.',
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
const d20Level = S.sig.D20 || 1;

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
const d20Level = S.sig.D20 || 1;

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
title: 'Two Ghostly Boys Want to Play',
description: 'Two translucent boys appear before you, giggling. "Play with us! Play with us!" They reach out with spectral hands.',
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
outcomes: ['You break free from their grip! The boys pout but let you go. "Come back and play sometime..."'],
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
outcomes: ['You remain trapped! Time slips away...'],
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
toast(`${hero.n} used Ghost charge! The boys realize the truth!`, 1800);
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
`${hero.n} took 1 damage and entered Last Stand! The shock breaks the ghost boys' hold!`,
'"Oops!" they say in unison, then fade away giggling.'
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
toast('Ghost Boys permanently converted to Empty Playroom!', 1800);
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost2.png',
title: 'The Boys Realize the Truth',
description: 'The ghost boys stare at each other, then at their translucent hands. "We\'re... we\'re dead. We\'re ghosts."',
outcomes: [
'Tears form in their spectral eyes. "We want to go home. We want to see Mommy and Daddy."',
'They hold hands and walk toward a light that appears. "Thank you for showing us." They vanish peacefully.',
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
function showRoyal1() {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal1.png',
title: 'Flummoxed Royal',
description: `A flummoxed ${S.royalTitle} paces anxiously: "Please, you must help! A creature in the next room ate my engagement ring! If you can stun it on the first turn of battle, I can retrieve it!"`,
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
outcomes: [`The ${S.royalTitle} looks hopeful: "Thank you! I'll follow you and grab it when you stun the creature!"`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

function showRoyal2() {
const v = document.getElementById('gameView');
// Check if quest was completed
if(!S.royalQuestCompleted) {
// Quest failed
S.royalQuestActive = false;
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal1.png',
title: 'Quest Failed',
description: `The ${S.royalTitle} returns, dejected: "The creature fled before I could retrieve the ring. I'll have to find another way..."`,
outcomes: [`The ${S.royalTitle} departs sadly. No reward.`],
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

let buttons = '';
buttons += `<div class="choice" onclick="chooseRoyalSigil('${sigil1}')">
<strong>${sigilIcon(sigil1)}</strong> <span style="opacity:0.7">L${S.sig[sigil1] || 0} → L${(S.sig[sigil1] || 0) + 1}</span>
</div>`;
buttons += `<div class="choice" onclick="chooseRoyalSigil('${sigil2}')">
<strong>${sigilIcon(sigil2)}</strong> <span style="opacity:0.7">L${S.sig[sigil2] || 0} → L${(S.sig[sigil2] || 0) + 1}</span>
</div>`;

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/royal2.png',
title: 'Royal Wedding',
description: `The ${S.royalTitle} proposes to their beloved. A beautiful wedding ceremony unfolds before you!`,
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
<img src="assets/old-tapo.png" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #8b5cf6;box-shadow:0 0 20px rgba(139,92,246,0.5)">
<div class="neutral-title" style="color:#8b5cf6;font-size:1.8rem">The Master of Space and Time</div>
<div class="neutral-desc" style="font-size:1.1rem;line-height:1.8;padding:1rem;background:rgba(139,92,246,0.1);border-radius:8px;margin:1rem 0">
"Tapo, you say? Yes…. I was called Tapo once, before I mastered the mysteries of space and time. Save me? Why, I need no saving… In fact…."
</div>
<button class="btn" onclick="oldTapoTransform()" style="background:linear-gradient(135deg, #8b5cf6, #6366f1);font-size:1.2rem;padding:1rem 2rem;margin-top:1rem">Continue</button>
</div>`;
}

function oldTapoTransform() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div class="neutral-container">
<div style="text-align:center;margin:2rem 0">
<div style="font-size:3rem;animation:clap 0.5s ease-in-out 3;margin-bottom:2rem">👏</div>
<img src="assets/tapo-nobg.png" style="max-width:100%;height:auto;max-width:300px;margin:0 auto 1rem auto;display:block;animation:bounce 1s ease-in-out 3">
<div style="font-size:2.5rem;font-weight:bold;color:#3b82f6;text-shadow:0 0 10px rgba(251,191,36,0.5);margin:2rem 0;animation:glow 1s ease-in-out infinite">
✨ Tapo Unlocked! ✨
</div>
<div class="neutral-outcome" style="font-size:1.1rem;margin:1.5rem 0">
Baby Tapo has been added to your hero roster!<br>
<span style="color:#22c55e">Stats: 1 HP / 1 POW</span><br>
<span style="color:#8b5cf6">Starts with ALL active sigils!</span>
</div>
</div>
<button class="btn" onclick="completeTapoUnlock()" style="background:linear-gradient(135deg, #3b82f6, #f97316);font-size:1.2rem;padding:1rem 2rem;margin-top:1rem">Victory!</button>
</div>
<style>
@keyframes clap {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.5); }
}
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
<img src="assets/neutrals/shopkeeper2.png" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
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
<img src="assets/neutrals/shopkeeper2.png" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
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

