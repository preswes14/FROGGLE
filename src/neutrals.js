// ===== NEUTRAL DECK SYSTEM =====
function initNeutralDeck() {
if(DEMO_MODE) {
S.demoStage2Pending = null;
S.neutralDeck = [];
S.lastNeutral = null;
return;
}
S.neutralDeck = [
'shopkeeper1', 'wishingwell1', 'treasurechest1',
'wizard1', 'oracle1', 'encampment1',
'gambling1', 'ghost1', 'royal1'
];
S.lastNeutral = null;
}

function getNeutralEncounter() {
// DEMO MODE: Deterministic cycling through all 9 neutrals
if(DEMO_MODE) {
const order = DEMO_NEUTRAL_ORDER;
if(S.floor === 2) {
  // Floor 2: next unseen stage 1
  const base = order[S.demoNeutralIndex % order.length];
  const enc = base + '1';
  S.lastNeutral = enc;
  // Advance index (this neutral is now "seen")
  S.demoNeutralIndex = (S.demoNeutralIndex + 1) % order.length;
  savePermanent();
  return enc;
}
if(S.floor === 4) {
  // If stage 2 was earned on floor 2, guarantee it
  if(S.demoStage2Pending) {
    const enc = S.demoStage2Pending + '2';
    S.lastNeutral = enc;
    S.demoStage2Pending = null;
    return enc;
  }
  // Special case: Royal uses quest flags, not replaceStage1WithStage2
  if(S.royalQuestActive && S.royalQuestCompleted) {
    S.lastNeutral = 'royal2';
    return 'royal2';
  }
  // No stage 2 earned: show next unseen stage 1
  const base = order[S.demoNeutralIndex % order.length];
  const enc = base + '1';
  S.lastNeutral = enc;
  S.demoNeutralIndex = (S.demoNeutralIndex + 1) % order.length;
  savePermanent();
  return enc;
}
// Fallback (shouldn't happen — only floors 2 and 4 are neutral before orc wall)
return 'oracle1';
}

// FIRST RUN ONLY: Floor 2 gets Oracle Stage 1 as a safe intro to neutrals
if(S.floor === 2 && S.runsAttempted === 1) {
S.lastNeutral = 'oracle1';
return 'oracle1';
}

// Level 18: Prioritize Stage 2s
if(S.floor === 18) {
const stage2s = S.neutralDeck.filter(n => n.includes('2'));
if(stage2s.length > 0) {
const pick = stage2s[Math.floor(Math.random() * stage2s.length)];
S.lastNeutral = pick;
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
if(DEMO_MODE) {
S.demoStage2Pending = base;
}
}

// ===== D20 ROLLS FOR NEUTRALS =====
function getD20NeutralLevel() {
// Include both permanent AND temporary upgrades for neutral D20 rolls
// Active sigils are stored 0-indexed (L1 = 0), so add 1 for actual level
return ((S.sig.D20 || 0) + (S.tempSigUpgrades.D20 || 0)) + 1;
}

function rollD20Neutral() {
const d20Level = getD20NeutralLevel();
// TUTORIAL: Explain D20 level affects neutral rolls
showTutorialPop('neutral_d20_level', `${sigilText('D20')} checks out-of-combat use your ${sigilText('D20')} Sigil Level, too! Leveling it up grants bonus dice every time you roll, and you keep the highest result!`);
return rollDice(d20Level, 20);
}

// Tier colors for each die (index 0 = first die = L1 silver, etc.)
const DICE_TIER_COLORS = ['#c0c0c0', '#06b6d4', '#9333ea', '#d97706', '#ff0080'];

function renderDiceTray(options = {}) {
const { dc = null, rollCallback = null, rolled = false, rolls = null, best = null } = options;
const d20Level = getD20NeutralLevel();
const hasDC = dc != null;
const success = hasDC && best != null && best >= dc;
const fail = hasDC && best != null && best < dc;

let html = '<div class="dice-tray">';
html += '<div class="dice-tray-inner">';

for(let i = 0; i < d20Level; i++) {
const tierColor = DICE_TIER_COLORS[i] || DICE_TIER_COLORS[DICE_TIER_COLORS.length - 1];
const value = rolled && rolls ? rolls[i] : 20;
let dieClass = 'dice-tray-die';
if(rolled && rolls) {
const isBest = rolls[i] === best;
if(isBest && best === 20 && !fail) dieClass += ' best-nat20';
else if(isBest && success) dieClass += ' best-success';
else if(isBest && fail) dieClass += ' best-fail';
// No DC: best die gets a neutral highlight (tier-colored glow)
else if(isBest && !hasDC) dieClass += ' best-success';
}
const borderStyle = rolled ? '' : `border-color: ${tierColor}; box-shadow: 0 0 8px ${tierColor}40;`;
const colorStyle = rolled ? '' : `color: ${tierColor};`;
html += `<div class="${dieClass}" data-die-index="${i}" style="${borderStyle}${colorStyle}">${value}</div>`;
}

html += '</div>'; // close dice-tray-inner

if(!rolled && rollCallback) {
html += `<button class="dice-tray-roll-btn" onclick="${rollCallback}">Roll</button>`;
}

html += '</div>'; // close dice-tray

if(hasDC && rolled) {
html += `<div class="dice-tray-dc">${success ? '✓' : '✗'} Need ${dc}+</div>`;
}

return html;
}

function animateDiceRoll(callback, dc) {
const d20Level = getD20NeutralLevel();
const dice = document.querySelectorAll('.dice-tray-die');
const rollBtn = document.querySelector('.dice-tray-roll-btn');
if(rollBtn) rollBtn.disabled = true;

// Play sound
SoundFX.play('d20roll');

// Animate each die with tumble
dice.forEach((die, i) => {
die.classList.add('rolling');
// Rapid number cycling during animation
let cycles = 0;
const maxCycles = 10 + i * 3; // Later dice spin longer
const cycleInterval = setInterval(() => {
die.textContent = Math.floor(Math.random() * 20) + 1;
cycles++;
if(cycles >= maxCycles) clearInterval(cycleInterval);
}, 50);
});

// After animation, show actual results
setTimeout(() => {
const result = rollDice(d20Level, 20);
const { rolls, best } = result;
const hasDC = dc != null;
const success = hasDC && best >= dc;
const fail = hasDC && best < dc;

dice.forEach((die, i) => {
die.classList.remove('rolling');
die.textContent = rolls[i];
const isBest = rolls[i] === best;
// Reset inline styles
die.style.borderColor = '';
die.style.boxShadow = '';
die.style.color = '';
if(isBest && best === 20 && !fail) die.classList.add('best-nat20');
else if(isBest && success) die.classList.add('best-success');
else if(isBest && fail) die.classList.add('best-fail');
else if(isBest && !hasDC) die.classList.add('best-success');
});

// Add DC indicator
const tray = document.querySelector('.dice-tray');
if(tray && hasDC) {
let dcEl = document.querySelector('.dice-tray-dc');
if(!dcEl) {
dcEl = document.createElement('div');
dcEl.className = 'dice-tray-dc';
tray.parentNode.insertBefore(dcEl, tray.nextSibling);
}
dcEl.innerHTML = `${success ? '✓' : '✗'} Need ${dc}+`;
}

// Remove roll button
if(rollBtn) rollBtn.remove();

if(callback) callback(rolls, best);
}, T(700));
}

function showD20Result(rolls, best, dc) {
// Visual dice display with highlighted best roll - color reflects success/fail if DC provided
const success = dc == null || best >= dc;
const diceHTML = rolls.map(r => {
const isBest = r === best;
const bg = isBest ? (success ? '#166534' : '#7f1d1d') : '#1e293b';
const border = isBest ? (success ? '#15803d' : '#dc2626') : '#475569';
const color = isBest ? (success ? '#bbf7d0' : '#fecaca') : '#f1f5f9';
const glow = isBest ? (success ? 'box-shadow:0 0 12px rgba(22,163,74,0.6);' : 'box-shadow:0 0 12px rgba(220,38,38,0.6);') : '';
return `<span style="display:inline-block;width:2.5rem;height:2.5rem;line-height:2.5rem;text-align:center;background:${bg};border:2px solid ${border};border-radius:0.5rem;margin:0.2rem;font-weight:bold;color:${color};font-size:1.2rem;${glow}">${r}</span>`;
}).join(' ');
const dcText = dc != null ? ` (need ${dc}+)` : '';
return `<div style="margin:0.5rem 0"><div style="font-size:0.9rem;margin-bottom:0.5rem;color:#4a4540">Rolling ${rolls.length}d20${dcText}:</div>${diceHTML}</div>`;
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
showStats = true,
diceTray = null,
overlays = []
} = options;

let html = `<div class="neutral-container">`;

// Left side - Content
html += '<div class="neutral-left">';

// Header with stats and narrative
html += '<div class="neutral-header">';
if(showStats) {
html += `<div class="neutral-stats">${S.gold}G | Floor ${S.floor}</div>`;
}
html += '<div class="neutral-narrative">';
if(title) html += `<div class="neutral-title">${title}</div>`;
if(description) html += `<div class="neutral-desc">${description}</div>`;
if(diceRoll) html += `<div class="dice-roll">${diceRoll}</div>`;
outcomes.forEach(outcome => {
if(outcome) html += `<div class="neutral-outcome">${outcome}</div>`;
});
html += '</div></div>'; // close narrative and header

// Dice tray - always shown on neutral encounters
// Pass custom diceTray HTML (e.g. with rolled results) or auto-render idle tray
html += diceTray != null ? diceTray : renderDiceTray({});

// Footer with buttons
if(buttons) {
html += `<div class="neutral-footer">${buttons}</div>`;
}

html += '</div>'; // close neutral-left

// Right side - Art (with optional sigil overlays)
html += `<div class="neutral-right" style="position:relative;background-image: url('${bgImage}')">`;
overlays.forEach(ov => {
const rotate = ov.rotation ? `transform:rotate(${ov.rotation}deg);` : '';
html += `<img src="${ov.src}" alt="${ov.alt || ''}" style="position:absolute;top:${ov.top};left:${ov.left};width:${ov.width};${rotate}pointer-events:none;filter:drop-shadow(0 0 8px rgba(255,215,0,0.6));">`;
});
html += `</div>`;

html += '</div>'; // close container
return html;
}

// ===== MAIN TITLE PAGE =====
function mainTitlePage() {
debugLog('[FROGGLE] mainTitlePage START');
// Music: play town theme on title screen
GameMusic.playScene('town_base');
// Hide game header on title screen
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'none';

const v = document.getElementById('gameView');
debugLog('[FROGGLE] gameView element:', v);
// Check for old saves and migrate
migrateOldSave();
// If migration created slot 1 but currentSlot not set, set it
if(S.currentSlot == null && localStorage.getItem('froggle8_permanent_slot1')) {
S.currentSlot = 1;
localStorage.setItem('froggle8_current_slot', '1');
debugLog('[SAVE] Set currentSlot to 1 after migration');
}
v.innerHTML = `
<div class="title-screen">
<div class="title-container">
<!-- Background image - landscape for wide screens, portrait for narrow -->
<picture>
<source media="(min-aspect-ratio: 1/1)" srcset="assets/main_capsule.png">
<img src="assets/main_capsule.png" alt="FROGGLE" class="title-bg-image">
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
    <h2 style="margin:0 0 1rem 0">Thanks for playing!</h2>
    <p style="margin:0 0 1.5rem 0;opacity:0.9">Close this tab or window to exit completely.</p>
    <button class="btn" onclick="mainTitlePage()" style="background:#6366f1">Return to Title</button>
    </div>
    </div>`;
  }, 100);
});
}

// Show credits screen
function showCredits() {
// Music: play char select theme on credits
GameMusic.playScene('char_select');
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);padding:1rem;overflow-y:auto">
<div style="background:rgba(255,255,255,0.95);border:4px solid #000;border-radius:16px;padding:2rem;max-width:500px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
<h2 style="text-align:center;margin:0 0 1rem 0;font-size:1.8rem;color:#4f46e5">FROGGLE</h2>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.95rem;margin:0 0 0.25rem 0;color:#1e1b4b">A DubsPubs game by</p>
<p style="font-size:1.3rem;font-weight:bold;margin:0;color:#22c55e">Preston Wesley Evans</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.9rem;margin:0;color:#1e1b4b"><strong>Game Design, Code & Music:</strong> Preston Wesley Evans</p>
<p style="font-size:0.8rem;margin:0.25rem 0 0 0;color:#4b5563;font-style:italic">AI coding assistance by Claude, by Anthropic</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Art</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563;line-height:1.5">Character Art: Harimoon<br>Environmental Art: Zabiier</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Official Playtesters</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563;line-height:1.5">Ari, Michael Griffin</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Additional Playtesters</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563;line-height:1.5">Noel McKillip, Ryan Evertz</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">The Frogs</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563;line-height:1.5">Charlie Schmidt, Matt Sutz, Ray Willess</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.85rem;margin:0 0 0.25rem 0;color:#6366f1;font-weight:bold">Support</p>
<p style="font-size:0.85rem;margin:0;color:#4b5563">Lisa Evans</p>
</div>

<div style="text-align:center;margin-bottom:1rem">
<p style="font-size:0.7rem;margin:0 0 0.25rem 0;color:#9ca3af;font-weight:bold">Special Thanks</p>
<p style="font-size:0.7rem;margin:0;color:#9ca3af;line-height:1.5">Jason Tsui, Sam Kern, Erin Keif, Adal Rifai, JPC</p>
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
function renderSlotCard(num, meta) {
return `<div style="background:white;border:3px solid #000;border-radius:8px;padding:0.75rem;flex:1;color:#1a1a1a;display:flex;flex-direction:column">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
<h3 style="font-size:1.1rem;margin:0;color:#1a1a1a">Slot ${num}</h3>
${meta.lastSaved ? `<span style="font-size:0.75rem;color:#6b7280">${formatSaveDate(meta.lastSaved)}</span>` : ''}
</div>
${meta.exists ? `
<div style="font-size:0.85rem;color:#374151;margin-bottom:0.5rem;flex:1">
<div>Runs: <strong>${meta.runsAttempted}</strong> | Rate: <strong>${meta.goingRate}G</strong></div>
${meta.hasActiveRun ? `<div style="color:#16a34a;font-weight:bold">Active Run${meta.activeFloor ? ` - Floor ${meta.activeFloor}` : ''}</div>` : ''}
</div>
<div style="display:flex;gap:0.5rem">
<button class="btn" onclick="continueSlot(${num})" style="flex:1;background:#22c55e;border:3px solid #16a34a;font-weight:bold;padding:0.5rem;white-space:nowrap">${meta.hasActiveRun ? 'Continue' : 'New Run'}</button>
<button class="btn secondary icon" onclick="confirmDeleteSlot(${num})" style="padding:0.5rem;white-space:nowrap">Del</button>
</div>
` : `
<p style="color:#6b7280;margin-bottom:0.5rem;font-size:0.9rem;flex:1">Empty Slot</p>
<button class="btn" onclick="createNewSlot(${num})" style="width:100%;background:#3b82f6;border:3px solid #f97316;font-weight:bold;padding:0.5rem;white-space:nowrap">New Game</button>
`}
</div>`;
}

function showSaveSlotSelection() {
const v = document.getElementById('gameView');
const slot1 = getSlotMetadata(1);
const slot2 = getSlotMetadata(2);
const slot3 = getSlotMetadata(3);

v.innerHTML = `
<div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a1a;padding:1rem;overflow:hidden;box-sizing:border-box">
<div style="background:#22c55e;border:4px solid #000;border-radius:12px;padding:1rem;max-width:900px;width:100%;box-shadow:0 8px 16px rgba(0,0,0,0.5);max-height:95vh;overflow-y:auto">
<h2 style="text-align:center;margin-bottom:1rem;font-size:1.3rem;color:#000">Select Save Slot</h2>

<div style="display:flex;gap:0.75rem;align-items:stretch">
${renderSlotCard(1, slot1)}
${renderSlotCard(2, slot2)}
${renderSlotCard(3, slot3)}
</div>

<button class="btn secondary" onclick="mainTitlePage()" style="width:100%;padding:0.5rem;margin-top:0.75rem">← Back</button>
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
  highestFUFloor: 0,
  totalGoldEarned: 0,
  totalRunsCompleted: 0,
  standardWins: 0,
  fuWins: 0,
  tapoFUWins: 0,
  allTapoWins: 0,
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
if(DEMO_MODE) {
S.demoNeutralIndex = 0;
}
S.gameMode = 'Standard';
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

function exitGame() {
showConfirmModal('Thanks for playing FROGGLE! Close the window to exit.', () => {
window.close();
});
}

function exportSave() {
const slot = S.currentSlot != null ? S.currentSlot : 1;
const saveData = localStorage.getItem(`froggle8_slot${slot}`) || localStorage.getItem('froggle8');
const permanentData = localStorage.getItem(`froggle8_permanent_slot${slot}`) || localStorage.getItem('froggle8_permanent');
if(!saveData && !permanentData) {
toast('No save data to export!');
return;
}
const exportData = {
save: saveData ? JSON.parse(saveData) : null,
permanent: permanentData ? JSON.parse(permanentData) : null,
slot: slot,
exportDate: new Date().toISOString(),
version: GAME_VERSION
};
const dataStr = JSON.stringify(exportData, null, 2);
const blob = new Blob([dataStr], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `froggle-save-slot${slot}-${new Date().toISOString().split('T')[0]}.json`;
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
const slot = S.currentSlot != null ? S.currentSlot : 1;
if(importData.save) {
localStorage.setItem(`froggle8_slot${slot}`, JSON.stringify(importData.save));
// Also write to legacy key for backwards compatibility
localStorage.setItem('froggle8', JSON.stringify(importData.save));
}
if(importData.permanent) {
localStorage.setItem(`froggle8_permanent_slot${slot}`, JSON.stringify(importData.permanent));
// Also write to legacy key for backwards compatibility
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
const skipButton = slides.skippable ? `<button class="btn" onclick="skipTutorialFromSlide()" style="padding:0.2rem 0.4rem;font-size:0.6rem;max-width:3.5rem;background:rgba(100,100,100,0.8);border:2px solid #666">Skip</button>` : '';
const skipButtonFullArt = slides.skippable ? `<button class="btn" onclick="skipTutorialFromSlide()" style="position:absolute;bottom:1.5rem;left:1.5rem;z-index:10;padding:0.2rem 0.4rem;font-size:0.6rem;max-width:3.5rem;background:rgba(100,100,100,0.8);border:2px solid #666">Skip</button>` : '';
// Resolve text - may be a function for dynamic content
const slideText = typeof slide.text === 'function' ? slide.text() : slide.text;
debugLog('[FROGGLE] Setting innerHTML for slide', currentIndex);

// Full-art mode: background image takes up screen, text bar at top, buttons at bottom corners
if(slide.bg) {
const bgStyle = slide.bgStyle || '';
v.innerHTML = `
<div class="full-screen-content" style="position:relative;width:100%;overflow:hidden;background:#1a5c3a">
<!-- Full-page background image -->
<img src="${slide.bg}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;${bgStyle}">

<!-- Text bar at top -->
<div style="position:absolute;top:0;left:0;right:0;z-index:10;background:rgba(0,0,0,0.65);padding:0.8rem 1rem;border-bottom:2px solid rgba(34,197,94,0.5)">
<div style="max-width:700px;margin:0 auto">
${slide.html || `<div class="narrative-text" style="font-size:1.05rem;line-height:1.5;text-align:center;color:#fff;text-shadow:1px 1px 3px rgba(0,0,0,0.9)">${slideText}</div>`}
</div>
</div>

<!-- Continue button - bottom right -->
<button class="btn" onclick="continueNarrative()" style="position:absolute;bottom:1.5rem;right:1.5rem;z-index:10;padding:1rem 2.1rem;font-size:1.2rem;background:#22c55e;border:2px solid #15803d">${slide.buttonText || 'Continue'}</button>
<!-- Skip button - bottom left -->
${skipButtonFullArt}
<span style="position:absolute;bottom:0.5rem;right:1.5rem;z-index:10;font-size:0.75rem;color:rgba(255,255,255,0.5)">Ⓐ${slides.skippable ? '/Ⓑ skip' : ''}</span>
</div>`;
} else {
// Standard mode: fullscreen centered content with backdrop for readability
const bgColorStyle = slide.bgColor ? `background:${slide.bgColor}` : 'background:rgba(0,0,0,0.3)';
v.innerHTML = `
<div class="full-screen-content" style="width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:1rem;${bgColorStyle}">
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

// Trigger onShow callback if present
if(slide.onShow) slide.onShow();

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
<h2 style="font-size:1.5rem;margin-bottom:1rem;text-align:center">Alright champ!</h2>
<p style="font-size:1.1rem;line-height:1.6;text-align:center;margin-bottom:1.5rem">
No time to waste, eh? Well then get going! Save Tapo!
</p>
<div style="background:rgba(59,130,246,0.1);border:2px solid #3b82f6;border-radius:12px;padding:1rem;margin-bottom:1.5rem">
<p style="font-size:0.95rem;line-height:1.5;text-align:center;margin-bottom:0.75rem">
If you need help, look for the:
</p>
<div style="display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap">
<div style="text-align:center">
<div style="background:#f97316;color:white;padding:0.5rem 1rem;border-radius:8px;font-weight:bold;border:2px solid #000">Help/FAQ</div>
</div>
<div style="text-align:center">
<div style="background:#9333ea;color:white;padding:0.5rem 1rem;border-radius:8px;font-weight:bold;border:2px solid #000">Sigilarium</div>
</div>
</div>
</div>
<p style="font-size:0.8rem;line-height:1.4;text-align:center;margin-bottom:1.5rem;opacity:0.7">
(Help/tips can be disabled in Settings)
</p>
<button onclick="confirmSkipTutorial()" class="tutorial-btn" style="padding:0.75rem 2rem;font-size:1.1rem;display:block;margin:0 auto">Let's go!</button>
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
// Reset tutorial checkpoint for fresh tutorial
S.tutorialCheckpoint = 0;
savePermanent();
const slides = [
{
// Full-art: Ribbleton background with text overlay
bg: 'assets/ribbleton.png',
html: `<h2 style="font-size:1.8rem;margin-bottom:0.25rem;color:#fff;text-align:center">Welcome to <strong class="text-tapo">Ribbleton!</strong></h2>
<p style="font-size:1.1rem;color:#f5f5f5;margin:0;text-align:center">Today is a very special day in this beautiful, tranquil town. Why, you ask?</p>`
},
{
// Tapo's birthday celebration - all heroes on Ribbleton background
bg: 'assets/ribbleton.png',
html: `<h2 style="font-size:1.8rem;margin-bottom:0.25rem;color:#fff;text-align:center">It's <strong class="text-tapo">Tapo's First Birthday!</strong></h2>
<p style="font-size:1.1rem;color:#f5f5f5;margin:0;text-align:center">The whole town has gathered to celebrate the little tadpole's&nbsp;special&nbsp;day!</p>`,
onShow: () => {
const container = document.querySelector('.full-screen-content');
if (!container) return;
// Keyframes (tapoSignature, tankIdle, warriorIdle, mageIdle, healerIdle) defined in template_head.html
// Place heroes scattered around the town
const heroes = [
  { src: 'assets/tank_normal.png', alt: 'Tank', left: '20%', bottom: '30%', width: '155px', anim: 'tankIdle 5s ease-in-out infinite' },
  { src: 'assets/warrior_normal.png', alt: 'Warrior', left: '33%', bottom: '30%', width: '150px', anim: 'warriorIdle 4s ease-in-out infinite' },
  { src: 'assets/tapo_normal.png', alt: 'Tapo', left: '48%', bottom: '15%', width: '120px', anim: 'tapoSignature 3.6s ease-in-out infinite' },
  { src: 'assets/mage_normal.png', alt: 'Mage', left: '68%', bottom: '20%', width: '145px', anim: 'mageIdle 3.8s ease-in-out infinite' },
  { src: 'assets/heal_normal.png', alt: 'Healer', left: '88%', bottom: '23%', width: '145px', anim: 'healerIdle 4.2s ease-in-out infinite' },
];
heroes.forEach(h => {
  const img = document.createElement('img');
  img.src = h.src;
  img.alt = h.alt;
  img.className = 'tutorial-sprite';
  img.style.cssText = `left:${h.left};bottom:${h.bottom};width:${h.width};z-index:5`;
  if (h.anim) img.style.animation = h.anim;
  container.appendChild(img);
});
}
},
{
// Mage teaching Tapo - mage walks to Tapo then both walk off screen
bg: 'assets/ribbleton.png',
html: `<h2 style="font-size:1.7rem;margin-bottom:0.25rem;color:#22c55e;text-align:center">A Special Gift</h2>
<p style="font-size:1.1rem;color:#f5f5f5;margin:0;text-align:center">As a birthday gift, <strong>Mage</strong> has promised to teach Tapo how to catch flies.</p>`,
onShow: () => {
const container = document.querySelector('.full-screen-content');
if (!container) return;
// Keyframes defined in template_head.html
// Place background heroes (Tank, Warrior, Healer) - they stay on screen throughout
const bgHeroes = [
  { src: 'assets/tank_normal.png', alt: 'Tank', left: '20%', bottom: '30%', width: '155px', anim: 'tankIdle 5s ease-in-out infinite' },
  { src: 'assets/warrior_normal.png', alt: 'Warrior', left: '33%', bottom: '30%', width: '150px', anim: 'warriorIdle 4s ease-in-out infinite' },
  { src: 'assets/heal_normal.png', alt: 'Healer', left: '88%', bottom: '23%', width: '145px', anim: 'healerIdle 4.2s ease-in-out infinite' },
];
bgHeroes.forEach(h => {
  const img = document.createElement('img');
  img.src = h.src;
  img.alt = h.alt;
  img.className = 'tutorial-sprite';
  img.style.cssText = `left:${h.left};bottom:${h.bottom};width:${h.width};z-index:4;animation:${h.anim}`;
  container.appendChild(img);
});
// Place Tapo (behind quest board area, will vault over to Mage)
const tapo = document.createElement('img');
tapo.src = 'assets/tapo_normal.png';
tapo.alt = 'Tapo';
tapo.id = 'mage-teach-tapo';
tapo.className = 'tutorial-sprite';
tapo.style.cssText = 'left:48%;bottom:15%;width:120px;z-index:5;animation:tapoVaultToMage 1.6s linear forwards';
container.appendChild(tapo);
// Place Mage (stays in position with idle animation)
const mage = document.createElement('img');
mage.src = 'assets/mage_happy.png';
mage.alt = 'Mage';
mage.id = 'mage-teach-mage';
mage.className = 'tutorial-sprite';
mage.style.cssText = 'left:65%;bottom:20%;width:145px;z-index:5;animation:mageIdle 3.8s ease-in-out infinite';
container.appendChild(mage);
// Vault ends at 1.6s — Mage turns to face Tapo (flipped), both double jump
setTimeout(() => {
  const mageEl = document.getElementById('mage-teach-mage');
  const tapoEl = document.getElementById('mage-teach-tapo');
  if (tapoEl) {
    tapoEl.style.left = '76%';
    tapoEl.style.bottom = '20%';
    tapoEl.style.transform = 'none';
    tapoEl.style.animation = 'doubleJump 0.8s ease-in-out';
  }
  if (mageEl) {
    mageEl.style.animation = 'doubleJumpFlipped 0.8s ease-in-out forwards';
  }
}, 1600);
// Jump ends at 2.4s — Tapo flips to face right, both walk off together
setTimeout(() => {
  const mageEl = document.getElementById('mage-teach-mage');
  const tapoEl = document.getElementById('mage-teach-tapo');
  if (mageEl) mageEl.style.animation = 'walkOffRightFlipped 1.6s ease-in forwards';
  if (tapoEl) tapoEl.style.animation = 'walkOffRightFlipped 1.6s ease-in forwards';
}, 2400);
}
}
];
slides.skippable = true;
slides.onComplete = () => {
// Show interstitial before fly fight
showTutorialInterstitial('Tutorial', "Catchin' Flies", () => {
startTaposBirthdayTutorial();
setTimeout(() => {
showTaposBirthdayOverlay();
}, 100);
});
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
Here come three <strong>flies</strong> now - you're up!
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
showTutorialPop('tapo_first_attack', `FROGGLE is about using powerful abilities, represented by <b>sigils</b>! Mage has ${sigilText('Attack')} (an active sigil that costs your turn) and ${sigilText('Expand')} (a passive sigil with automatic effects). Use ${sigilText('Attack')} to hit 2 flies at once!`, () => {
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
S.runUpgradeHistory = [];
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
<img src="assets/tapo_normal.png" alt="Tapo" style="width:120px;height:auto;transform:scaleX(-1)">
</div>
<h2 style="color:#22c55e;margin-bottom:1rem">Tapo to the Rescue!</h2>
<p style="font-size:1.1rem;line-height:1.7;margin-bottom:1.5rem">
Just as the ${flyText} ${flyCount === 1 ? 'is' : 'are'} about to finish off Mage, <strong class="text-tapo">Tapo</strong> leaps into action!
<br><br>
His sticky tongue lashes out and <strong>swallows the ${flyText} whole!</strong>
<br><br>
<span style="font-size:0.9rem;opacity:0.8">(In normal combat, your hero would enter "Last Stand" mode - but Tapo's got your back for now!)</span>
</p>
<button onclick="continueTapoRescue()" class="tutorial-btn" style="padding:1rem 2.5rem;font-size:1.3rem">
*ribbit*
</button>
</div>
</div>
<!-- tapoSignatureRescue keyframes defined in template_head.html -->`;
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
// Tutorial checkpoint 1: Fly battle complete
S.tutorialCheckpoint = 1;
savePermanent();
debugLog('[TUTORIAL] Checkpoint 1 saved: Fly battle complete');
// Phase 1 victory celebration
const v = document.getElementById('gameView');
v.classList.add('no-scroll');
v.innerHTML = `
<div class="full-screen-content" style="width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:1rem">
<div style="max-width:600px;text-align:center">
<h2 style="font-size:2.5rem;margin-bottom:0.5rem;color:#22c55e">Success!!</h2>
<div style="animation:danceTapo 0.5s ease-in-out infinite;margin:1rem 0">
<img src="assets/tapo_normal.png" alt="Tapo" style="width:100px;height:auto;transform:scaleX(-1)">
</div>
<p style="font-size:1.2rem;line-height:1.7;margin:1rem 0;color:#fff;background:rgba(0,0,0,0.7);padding:1rem;border-radius:8px">
Tapo squeals with delight, and munches down another delicious fresh fly!<br>
Bellies overflowing, the pair gleefully makes their way back to Ribbleton.
</p>
<button onclick="showFlydraAppearance()" class="tutorial-btn" style="padding:1rem 2rem;font-size:1.2rem;margin-top:1.5rem">Continue</button>
</div>
</div>`;
}

function showFlydraAppearance() {
// Flydra appears, furious that its children have been eaten!
const slides = [
{
html: `
<h2 style="font-size:1.8rem;margin-bottom:1rem;color:#dc2626;animation:flydraShake 0.3s ease-in-out infinite">SHRIIIEEEEK!!</h2>
<div style="margin:1.5rem 0;position:relative">
<img src="assets/Hydra.png" alt="The Flydra" style="max-width:80vw;max-height:40vh;object-fit:contain;display:block;margin:0 auto;filter:brightness(1.2) saturate(1.3);animation:flydraDescend 1.5s ease-out">
</div>
<p style="font-size:1.1rem;line-height:1.7;margin:1rem 0;color:#f5f5f5">
A deafening buzz fills the air as an enormous shadow descends over Ribbleton. Hairy legs, glittering eyes, translucent wings — the <strong class="text-flydra">Flydra</strong>, mother of all flies. She must have caught you chowing on her children!!
</p>
<!-- flydraShake, flydraDescend keyframes defined in template_head.html -->
`
},
{
html: `
<div style="margin:1.5rem 0;position:relative">
<!-- Swirling portal with Flydra overlaid -->
<div style="position:relative;width:220px;height:220px;margin:0 auto">
<div style="width:100%;height:100%;border-radius:50%;background:radial-gradient(circle, #dc2626, #7c2d12 60%, #000);animation:narrativePortalPulse 1s ease-in-out infinite;box-shadow:0 0 60px #dc2626,0 0 120px rgba(220,38,38,0.3)"></div>
<img src="assets/Hydra.png" alt="Flydra" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-55%);width:180px;height:auto;filter:drop-shadow(0 0 15px rgba(220,38,38,0.8));animation:flydraPortalHover 2s ease-in-out infinite">
</div>
<!-- Enemies surrounding the portal -->
<div style="position:absolute;top:-15px;left:-25px;animation:enemyAppear 0.8s ease-out 0.3s both">
<img src="assets/goblin.png" alt="Goblin" style="width:68px;height:auto" onerror="this.outerHTML='👹'">
</div>
<div style="position:absolute;top:-15px;right:-25px;animation:enemyAppear 0.9s ease-out 0.5s both">
<img src="assets/wolf.png" alt="Wolf" style="width:68px;height:auto" onerror="this.outerHTML='🐺'">
</div>
<div style="position:absolute;bottom:-15px;left:-20px;animation:enemyAppear 1s ease-out 0.7s both">
<img src="assets/goblin.png" alt="Goblin" style="width:68px;height:auto" onerror="this.outerHTML='👹'">
</div>
<div style="position:absolute;bottom:-15px;right:-20px;animation:enemyAppear 1.1s ease-out 0.9s both">
<img src="assets/wolf.png" alt="Wolf" style="width:68px;height:auto" onerror="this.outerHTML='🐺'">
</div>
<div style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);animation:enemyAppear 1.2s ease-out 1.1s both">
<img src="assets/goblin.png" alt="Goblin" style="width:68px;height:auto" onerror="this.outerHTML='👹'">
</div>
</div>
<p style="font-size:1.1rem;line-height:1.7;margin:1rem 0;color:#f5f5f5">
In her rage, the Flydra <strong class="text-danger">tears open a dark portal</strong>! Creatures start pouring out into Ribbleton!
</p>
<!-- narrativePortalPulse, flydraPortalHover, enemyAppear keyframes defined in template_head.html -->
`
}
];
slides.onComplete = () => {
transitionToPortalInvasion();
};
showNarrativeSlide(slides, 0);
}

function transitionToPortalInvasion() {
// Show interstitial before portal invasion
showTutorialInterstitial('Tutorial', 'Protect the Tadpole!', () => {
startRibbletonTutorial();
setTimeout(() => {
showTutorialStoryOverlay();
}, 100);
});
}

function showTutorialStoryOverlay() {
// Show narrative as a modal overlay on the combat screen (no Ribbleton background jump)
const overlay = document.createElement('div');
overlay.className = 'tutorial-modal-backdrop';
overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:500px">
<h2>Reinforcements!</h2>
<p>Two more of Tapo's friends, <strong style="color:#3b82f6">Warrior</strong> and <strong style="color:#3b82f6">Healer</strong>, rush in to help fight off these vile creatures!</p>
<div style="display:flex;gap:1rem;justify-content:center;margin-top:1rem">
<button onclick="skipTutorialFromOverlay()" class="tutorial-btn-secondary" style="padding:0.5rem 1rem;font-size:0.8rem">Skip Tutorial</button>
<button onclick="dismissStoryOverlay()" class="tutorial-btn" style="padding:0.8rem 2rem;font-size:1.1rem">Let's fight!</button>
</div>
</div>`;
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
showTutorialPop('ribbleton_warrior_attack', `In FROGGLE, you'll usually control 2 heroes. Warrior doesn't start with ${sigilText('Expand')} like Mage, but he packs a wallop — he gets +1 to POW! Take out that Wolf before it chomps on your Healer! Click the Warrior's ${sigilText('Attack')} sigil.<br><br>(Enemies will usually attack whoever is closest to them, but you can be more strategic)`, () => {
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
S.runUpgradeHistory = [];
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
{bg: 'assets/ribbleton.png', text: "The battle is won! But as the last enemy falls, the <strong class='text-flydra'>Flydra</strong> lets out a final screech and flees through the portal, her remaining children buzzing after her.",
onShow: () => {
const container = document.querySelector('.full-screen-content');
if (!container) return;
// Keyframes (portalPulseEnd, flydraFlip, flyBuzz) defined in template_head.html
// Portal on right side of Ribbleton
const portal = document.createElement('div');
portal.style.cssText = 'position:absolute;right:8%;bottom:15%;width:280px;height:280px;z-index:5';
// Portal glow
const portalBg = document.createElement('div');
portalBg.style.cssText = 'width:100%;height:100%;border-radius:50%;background:radial-gradient(circle, #dc2626, #7c2d12 60%, #000);animation:portalPulseEnd 1.2s ease-in-out infinite;box-shadow:0 0 80px #dc2626,0 0 160px rgba(220,38,38,0.3)';
portal.appendChild(portalBg);
// Flydra in center, flipping rapidly
const flydra = document.createElement('img');
flydra.src = 'assets/Hydra.png';
flydra.alt = 'Flydra';
flydra.style.cssText = 'position:absolute;top:50%;left:50%;width:200px;height:auto;filter:drop-shadow(0 0 15px rgba(220,38,38,0.8));animation:flydraFlip 1.2s linear infinite;z-index:6';
portal.appendChild(flydra);
// 4 flies hovering near the Flydra
const flyPositions = [
  {top:'15%',left:'10%'}, {top:'10%',right:'5%'},
  {bottom:'15%',left:'5%'}, {bottom:'10%',right:'10%'}
];
flyPositions.forEach((pos, i) => {
  const fly = document.createElement('img');
  fly.src = 'assets/fly.png';
  fly.alt = 'Fly';
  fly.style.cssText = `position:absolute;width:35px;height:auto;z-index:7;animation:flyBuzz ${0.8 + i*0.15}s ease-in-out infinite;filter:drop-shadow(0 0 4px rgba(0,0,0,0.5))`;
  Object.entries(pos).forEach(([k,v]) => fly.style[k] = v);
  portal.appendChild(fly);
});
container.appendChild(portal);
}},
{bg: 'assets/ribbleton.png', text: "The heroes catch their breath. <strong class='text-tapo'>Close call!</strong> At least Tapo is safe.."},
{text: "WAIT... WHERE IS TAPO??!",
html: `<div style="font-size:3rem;font-weight:bold;text-align:center;color:#fff">WAIT...<br>WHERE IS TAPO??!</div>`,
bgColor: '#000',
onShow: () => { GameMusic.stop(); }},
{bg: 'assets/tapo_pain.png', bgStyle: 'object-fit: contain; max-width:75%; max-height:75%; margin:auto; animation: spinTapo 4s linear infinite; z-index:2;', text: "Tapo's eyes lock onto the biggest, juiciest fly he's ever seen — disappearing through the portal. He can't help himself!",
html: `<div class="narrative-text" style="font-size:1.25rem;line-height:1.7;text-align:center;color:#fff;text-shadow:1px 1px 4px rgba(0,0,0,0.9)">Tapo's eyes lock onto the biggest, juiciest fly he's ever seen — disappearing through the portal. <strong class="text-danger">He can't help himself!</strong></div>`,
onShow: () => {
GameMusic.play(null, 'combat_19');
const container = document.querySelector('.full-screen-content');
if (!container) return;
const portal = document.createElement('div');
portal.style.cssText = 'position:absolute;top:50%;left:50%;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, #dc2626, #7c2d12 60%, #000);box-shadow:0 0 80px #dc2626,0 0 160px rgba(220,38,38,0.3);animation:spinPortalReverse 3s linear infinite;z-index:1;transform:translate(-50%,-50%)';
container.appendChild(portal);
}},
{text: "TAPO, NO!! But it is too late. The heroes have no choice but to dive in after, to save their adorable little Tapo!",
html: `<div class="narrative-text" style="font-size:1.8rem;line-height:1.9;text-align:center;color:#fff;text-shadow:2px 2px 8px rgba(0,0,0,0.9);max-width:600px"><strong class="text-danger">TAPO, NO!!</strong><br><br>But it is too late. The heroes have no choice but to dive in after, to save their adorable little Tapo!</div>`}
];
slides.onComplete = showTitleCard;
showNarrativeSlide(slides, 0);
}

function showTitleCard() {
// Tutorial checkpoint 2: Tutorial fully complete, normal saves take over
S.tutorialCheckpoint = 2;
savePermanent();
debugLog('[TUTORIAL] Checkpoint 2 saved: Tutorial complete');
GameMusic.stop();
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

function title() {
debugLog('[FROGGLE] title() called - Hero selection screen');
// Show header on hero selection
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';
// Music: play char select theme on hero select
GameMusic.playScene('char_select');
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
<h1 style="text-align:center;margin:0.75rem 0;font-size:1.8rem;color:${S.gameMode === 'fu' ? '#dc2626' : '#22c55e'}">${S.gameMode === 'fu' ? 'FROGGED UP' : 'FROGGLE'}</h1>

<div style="max-width:600px;margin:0 auto;padding:0 0.5rem">
<h2 style="text-align:center;margin-bottom:0.5rem;font-size:1.1rem">Choose ${requiredHeroes} Heroes</h2>
<div id="hero-select-container" style="position:relative;max-width:100%;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;background:#1a1a2e;border-radius:8px;border:3px solid #000;padding:0.5rem;cursor:pointer">
${['warrior','tank','mage','healer'].map(hero => `
<div class="hero-select-cell" data-hero="${hero}" style="position:relative;text-align:center" onclick="event.stopPropagation();toggleHeroSelection('${hero}')">
<img src="${HERO_IMAGES[hero]}" alt="${hero}" style="width:100%;height:120px;object-fit:contain;display:block;border-radius:6px;pointer-events:none;transition:filter 0.2s,transform 0.2s;${heroFlipStyle(HERO_IMAGES[hero])}${S.selectedHeroes && S.selectedHeroes.includes(hero) ? 'filter:brightness(1.2);' : 'filter:brightness(0.7);'}">
<div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:0.8rem;font-weight:bold;color:#fff;text-shadow:0 1px 3px #000;text-transform:capitalize;pointer-events:none">${hero}</div>
<button type="button" class="hero-select-btn" data-hero="${hero}" onclick="event.stopPropagation();toggleHeroSelection('${hero}')" aria-label="Select ${hero}" style="position:absolute;top:0;left:0;width:100%;height:100%;background:transparent;border:none;cursor:pointer;z-index:20"></button>
<div id="${hero}-card" style="position:absolute;bottom:10%;left:5%;width:90%;display:none;z-index:10;pointer-events:none;"></div>
</div>`).join('')}
</div>

${S.tapoUnlocked ? `
<div style="margin-top:1rem;text-align:center">
<button class="btn" onclick="toggleHeroSelection('tapo')" style="background:linear-gradient(135deg,#3b82f6 0%,#22c55e 100%);padding:0.75rem 1.5rem;font-size:1rem;font-weight:bold;border:3px solid #000">
${S.questProgress && S.questProgress.heroWins && S.questProgress.heroWins.Tapo >= 1 ? 'Add Tapo (click multiple times!)' : 'View Tapo (UNLOCKED!)'}
</button>
${S.questProgress && S.questProgress.heroWins && S.questProgress.heroWins.Tapo >= 1 && S.gameMode === 'fu' ? `
<button class="btn" onclick="selectAllTapos()" style="background:linear-gradient(135deg,#f59e0b 0%,#22c55e 100%);padding:0.5rem 1rem;font-size:0.9rem;font-weight:bold;border:3px solid #000;margin-top:0.5rem">
ALL TAPOS
</button>` : ''}
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

// Update hero image brightness based on selection
['warrior', 'tank', 'mage', 'healer'].forEach(h => {
const cellImg = document.querySelector(`.hero-select-cell[data-hero="${h}"] img`);
if(cellImg) {
cellImg.style.filter = sel.includes(h) ? 'brightness(1.2)' : 'brightness(0.7)';
cellImg.style.transform = sel.includes(h) ? 'scale(1.05)' : 'scale(1)';
}
});
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
${hPixelImage ? `<img src="${hPixelImage}" alt="${hData.name}" style="width:100%;height:auto;border-radius:4px;margin-bottom:0.25rem;${heroFlipStyle(hPixelImage)}">` : ''}
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

// Multi-Tapo: after winning FU with Tapo alive, can fill all slots with Tapo
const multiTapoUnlocked = heroType === 'tapo' && S.questProgress && S.questProgress.heroWins && S.questProgress.heroWins.Tapo >= 1;

if(multiTapoUnlocked) {
// Tapo doesn't toggle off — add more, or remove one if at max
if(sel.length < requiredHeroes) {
sel.push('tapo');
SoundFX.play('hop');
} else if(isSelected) {
// At max — remove last tapo to make room
const lastIdx = sel.lastIndexOf('tapo');
if(lastIdx !== -1) sel.splice(lastIdx, 1);
SoundFX.play('click');
}
} else if(isSelected) {
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

function selectAllTapos() {
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;
sel = [];
for(let i = 0; i < requiredHeroes; i++) sel.push('tapo');
SoundFX.play('hop');
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
// Name multiple Tapos A, B, C in the display
const letters = ['A', 'B', 'C'];
let tapoIdx = 0;
const heroNames = sel.map(h => {
const name = H[h].n;
if(h === 'tapo' && sel.filter(s => s === 'tapo').length > 1) {
return `${name} ${letters[tapoIdx++]}`;
}
return name;
});
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

function start() {
const requiredHeroes = S.gameMode === 'fu' ? 3 : 2;
if(sel.length!==requiredHeroes) return;
// Show game header when entering gameplay
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';

S.floor=1; S.xp=0; S.levelUpCount=0; S.runUpgradeHistory=[];
// Reset temporary XP sigil upgrades (these don't persist between runs)
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// Reset recruits from any previous run
S.recruits = [];
// NOTE: Gold persists between runs! Only reset on victory or spent at Death Screen
S.heroes = sel.map((t,i) => ({
id:`h-${crypto.randomUUID()}`,
n:H[t].n, base:H[t].n, p:H[t].p, h:H[t].h, m:H[t].m,
s:[...H[t].s], sh:0, g:0, ls:false, lst:0, ts:[], st:0
}));
// Name multiple Tapos: A, B, C
const tapoCount = S.heroes.filter(h => h.base === 'Tapo').length;
if(tapoCount > 1) {
const letters = ['A', 'B', 'C'];
let idx = 0;
S.heroes.forEach(h => {
if(h.base === 'Tapo') h.n = `Tapo ${letters[idx++]}`;
});
}

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
if((hero.base || hero.n) === 'Tapo') {
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
const hero = S.heroes.find(h => (h.base || h.n) === slot.hero);
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
  trackQuestProgress('heroPlayed', hero.base || hero.n);
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

function showTutorialInterstitial(title, subtitle, callback) {
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;z-index:30000">
<div style="text-align:center;color:#fff;animation:fadeIn 0.5s ease">
<div style="font-size:2.5rem;font-weight:bold;margin-bottom:1rem;font-family:'Fredoka One',cursive">${title}</div>
<div style="font-size:1.8rem;font-style:italic;font-family:'Fredoka One',cursive">${subtitle}</div>
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
// Neutral screens fill the viewport - no scroll/padding needed
const gameArea = document.getElementById('gameView');
if(gameArea) gameArea.classList.add('no-scroll');
upd();
// TUTORIAL: Show neutral intro on Floor 2
if(f === 2) {
showTutorialPop('neutral_intro', "Neutral floors offer choices and opportunities! You can walk straight through, or take a risk for potential rewards.");
}

const enc = getNeutralEncounter();

if(S.ghostBoysConverted && enc.startsWith('ghost')) {
// Music: play ghost boys theme for empty playroom
GameMusic.playScene('neutral_ghost1');
showEmptyPlayroom();
return;
}

// Music: play encounter-specific neutral music
GameMusic.playNeutral(enc);

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
if(h.ls) { h.ls = false; h.lst = 0; }
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
if(h.ls) { h.ls = false; h.lst = 0; }
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
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/shopkeeper2.png',
outcomes: ['"Good choice. See you soon."', `The shadows recede. The chamber returns to normal as you proceed to Floor ${S.floor + 1}.`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}, 1000);
}

function finishDeathsBargain() {
removeNeutralFromDeck('shopkeeper');
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/shopkeeper2.png',
outcomes: ['"Shame. You don\'t get a chance like this every day. Oh well, it\'s your funeral."', `The shadows recede. The chamber returns to normal as you proceed to Floor ${S.floor + 1}.`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}

// ===== 2. WISHING WELL =====
function showWishingWell1() {
const v = document.getElementById('gameView');
const buttons = `
<button class="btn risky" onclick="climbWell()">Climb down and get coins</button>
<button class="btn" onclick="tossWish()">Each hero tosses in a coin and makes a wish</button>
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
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wishingwell1.png',
title: 'Climbing the Well',
description: 'You begin your descent into the dark well...',
diceTray: renderDiceTray({ rollCallback: 'climbWellRoll()' })
});
}

function climbWellRoll() {
animateDiceRoll(function(rolls, best) {
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

// Update narrative and add continue button
const narrative = document.querySelector('.neutral-narrative');
if(narrative) {
narrative.innerHTML = `<div class="neutral-title">Climbing the Well</div>`;
narrative.innerHTML += `<div class="neutral-outcome">${outcome}</div>`;
}
const footer = document.querySelector('.neutral-footer');
const leftPanel = document.querySelector('.neutral-left');
if(!footer && leftPanel) {
const f = document.createElement('div');
f.className = 'neutral-footer';
f.innerHTML = `<button class="btn" onclick="applyWellClimb(${hpLoss}, ${goldGain})">Continue</button>`;
leftPanel.appendChild(f);
} else if(footer) {
footer.innerHTML = `<button class="btn" onclick="applyWellClimb(${hpLoss}, ${goldGain})">Continue</button>`;
}
});
}

function applyWellClimb(hpLoss, goldGain) {
if(hpLoss > 0) {
// Show hero selection screen (exclude Last Stand heroes - they can't take damage)
const v = document.getElementById('gameView');
let heroButtons = '';
const eligible = S.heroes.filter(h => !h.ls);
if(eligible.length === 0) {
// All heroes in Last Stand - skip damage
S.gold += goldGain;
if(S.gold < 0) S.gold = 0;
upd();
if(goldGain > 0) toast(`Gained ${goldGain} Gold!`);
nextFloor();
return;
}
eligible.forEach(h => {
const idx = S.heroes.indexOf(h);
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
// Apply damage through shields first (consistent with combat)
let remaining = hpLoss;
let ghostBlocked = false;
if(hero.sh > 0) {
const absorbed = Math.min(hero.sh, remaining);
hero.sh -= absorbed;
remaining -= absorbed;
}
hero.h -= remaining;
if(hero.h <= 0 && !hero.ls) {
if(hero.g > 0) {
hero.g--;
hero.h += remaining;
hero.sh += (hpLoss - remaining); // Restore shield too
if(hero.sh > hero.m) hero.sh = hero.m; // Cap shield at max HP
toast(`${hero.n}'s Ghost charge cancelled the lethal hit!`, 1800, 'warning');
ghostBlocked = true;
} else {
hero.h = 0;
hero.ls = true;
hero.lst = 0;
toast(`${hero.n} entered Last Stand!`, 3000, 'critical');
}
}
if(!ghostBlocked) toast(`${hero.n} took ${hpLoss} damage!`);

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
description: 'An unadorned wooden chest sits against the far wall, worn brass fittings gleaming in the torchlight. No lock is visible, but you spy strange holes in the wall and drops of blood spattered on the ground nearby.',
buttons: `
<button class="btn risky" onclick="openChest()">Open the chest</button>
<button class="btn safe" onclick="nextFloor()">Do Not Engage</button>
`
});
}

function openChest() {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/treasurechest1.png',
title: 'Opening the Chest',
description: 'You reach for the chest lid, watching for traps...',
diceTray: renderDiceTray({ rollCallback: 'openChestRoll()' })
});
}

function openChestRoll() {
animateDiceRoll(function(trapRolls, trapBest) {
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

const narrative = document.querySelector('.neutral-narrative');
if(narrative) {
narrative.innerHTML = `<div class="neutral-title">Opening the Chest</div><div class="neutral-outcome">${trapOutcome}</div>`;
}
const leftPanel = document.querySelector('.neutral-left');
let footer = document.querySelector('.neutral-footer');
if(!footer && leftPanel) {
footer = document.createElement('div');
footer.className = 'neutral-footer';
leftPanel.appendChild(footer);
}
if(footer) {
footer.innerHTML = `<button class="btn" onclick="openChestPart2(${trapDmg}, ${secretFound})">Continue</button>`;
}
});
}

function openChestPart2(trapDmg, secretFound) {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/treasurechest1.png',
title: 'Chest Contents',
description: 'You peer inside the chest...',
diceTray: renderDiceTray({ rollCallback: `openChestPart2Roll(${trapDmg}, ${secretFound})` })
});
}

function openChestPart2Roll(trapDmg, secretFound) {
animateDiceRoll(function(contentRolls, contentBest) {
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

const narrative = document.querySelector('.neutral-narrative');
if(narrative) {
narrative.innerHTML = `<div class="neutral-title">Chest Contents</div><div class="neutral-outcome">${contentOutcome}</div>`;
}

const v = document.getElementById('gameView');
const leftPanel = document.querySelector('.neutral-left');
let footer = document.querySelector('.neutral-footer');
if(!footer && leftPanel) {
footer = document.createElement('div');
footer.className = 'neutral-footer';
leftPanel.appendChild(footer);
}

if(trapDmg > 0) {
let heroButtons = '';
const eligible = S.heroes.filter(h => !h.ls);
if(eligible.length === 0) {
S.gold += goldGain;
upd();
if(goldGain > 0) toast(`Found ${goldGain} Gold!`);
nextFloor();
return;
}
eligible.forEach(h => {
const idx = S.heroes.indexOf(h);
heroButtons += `<button class="neutral-btn danger" onclick="finishChestOpen(${idx}, ${trapDmg}, ${goldGain})">${h.n} (${h.h}/${h.m}❤)</button>`;
});
if(footer) footer.innerHTML = heroButtons;
} else {
S.gold += goldGain;
upd();
if(footer) footer.innerHTML = `<button class="btn" onclick="nextFloor()">Continue</button>`;
}
});
}

function finishChestOpen(heroIdx, trapDmg, goldGain) {
const hero = S.heroes[heroIdx];
// Apply damage through shields first (consistent with combat)
let remaining = trapDmg;
let ghostBlocked = false;
if(hero.sh > 0) {
const absorbed = Math.min(hero.sh, remaining);
hero.sh -= absorbed;
remaining -= absorbed;
}
hero.h -= remaining;
if(hero.h <= 0 && !hero.ls) {
if(hero.g > 0) {
hero.g--;
hero.h += remaining;
hero.sh += (trapDmg - remaining); // Restore shield too
if(hero.sh > hero.m) hero.sh = hero.m; // Cap shield at max HP
toast(`${hero.n}'s Ghost charge cancelled the lethal hit!`, 1800, 'warning');
ghostBlocked = true;
} else {
hero.h = 0;
hero.ls = true;
hero.lst = 0;
toast(`${hero.n} entered Last Stand!`, 3000, 'critical');
}
}
if(!ghostBlocked) toast(`${hero.n} took ${trapDmg} damage!`);

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
S.wizardPendingHero = heroIdx;
const v = document.getElementById('gameView');
const h = S.heroes[heroIdx];
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'The Hieroglyphs',
description: `${h.n} approaches the glowing wall and squints at the strange symbols...`,
diceTray: renderDiceTray({ rollCallback: `heroApproachesWizardRoll(${heroIdx})` })
});
}

function heroApproachesWizardRoll(heroIdx) {
animateDiceRoll(function(rolls, best) {
const h = S.heroes[heroIdx];
const v = document.getElementById('gameView');

if(best >= 1 && best <= 10) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'The Hieroglyphs',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
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
diceTray: renderDiceTray({ rolled: true, rolls, best }),
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
toast(`${chosenSigil} temporarily upgraded to L${newTotalLevel} for all heroes!`, 1800);

replaceStage1WithStage2('wizard');
setTimeout(() => {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard1.png',
title: 'The Hieroglyphs',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
outcomes: [
critText,
`The hieroglyph reveals itself as the symbol for ${chosenSigil}! "Yes! YES! You see! You understand!" The wizard touches the sigil, then reaches towards ${h.n}.`,
`${h.n} feels power surge through the party. ${chosenSigil} temporarily upgraded from L${currentLevel} to L${currentLevel + bonusLevels} for all heroes!`,
'"Your journey has just begun... Seek me again this night." He disappears.'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`,
overlays: [{
src: SIGIL_IMAGES[chosenSigil],
alt: chosenSigil,
top: '28%', left: '38%', width: '24%', rotation: -8
}]
});
}, 500);
}); // end animateDiceRoll
}

// Wizard wall sigil overlay - reused across all wizard2 screens
function wizardWallOverlay() {
if(!S.wizardSigil || !SIGIL_IMAGES[S.wizardSigil]) return [];
return [{ src: SIGIL_IMAGES[S.wizardSigil], alt: S.wizardSigil, top: '28%', left: '38%', width: '24%', rotation: -8 }];
}

function showWizard2() {
if(S.wizardHero === undefined || S.wizardHero === null || !S.wizardSigil || S.wizardHero >= S.heroes.length) {
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
<button class="btn secondary" onclick="declineWizardChallenges()">Decline</button>`,
overlays: wizardWallOverlay()
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

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: `Trial ${challengeIndex + 1} - DC ${dc}`,
description: `${h.n} focuses on the arcane challenge...`,
diceTray: renderDiceTray({ dc, rollCallback: 'attemptWizardChallengeRoll()' }),
overlays: wizardWallOverlay()
});
}

function attemptWizardChallengeRoll() {
const heroIdx = S.wizardHero;
const h = S.heroes[heroIdx];
const challengeIndex = S.wizardChallengeIndex;
const dc = S.wizardChallenges[challengeIndex];

animateDiceRoll(function(rolls, best) {
const v = document.getElementById('gameView');

if(best < dc) {
const upgradeCount = S.wizardUpgradedSigils.length;
let outcomeText = upgradeCount > 0
? `${h.n} earned ${upgradeCount} temporary upgrade${upgradeCount > 1 ? 's' : ''} before failing!`
: `${h.n} failed the first trial. No upgrades earned.`;

removeNeutralFromDeck('wizard');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: `Trial ${challengeIndex + 1} - DC ${dc}`,
diceTray: renderDiceTray({ dc, rolled: true, rolls, best }),
outcomes: [
`<span style="color:#dc2626">FAILED</span>`,
`${h.n} could not quite meet the challenge.`,
outcomeText,
'"A good effort, but you have reached your limit. Take what you have earned and go."'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`,
overlays: wizardWallOverlay()
});
return;
}

// Success!
const heroSigils = [...h.s];
if(h.ts) heroSigils.push(...h.ts);
const availableSigils = heroSigils.filter(sig => !S.wizardUpgradedSigils.includes(sig));

if(availableSigils.length === 0) {
removeNeutralFromDeck('wizard');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: `Trial ${challengeIndex + 1} - DC ${dc}`,
diceTray: renderDiceTray({ dc, rolled: true, rolls, best }),
outcomes: [
`<span style="color:#22c55e">SUCCESS</span>`,
`${h.n} passed the trial!`,
`But ${h.n} has no more sigils available to upgrade!`,
`Total upgrades earned: ${S.wizardUpgradedSigils.length}`,
'"You have taken all I can offer. Go now."'
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`,
overlays: wizardWallOverlay()
});
return;
}

let description = `${h.n} passed the trial! Choose a sigil to upgrade temporarily (cannot pick the same sigil twice):`;
let buttons = '';
availableSigils.forEach(sig => {
const currentLevel = getLevel(sig, heroIdx);
const nextLevel = currentLevel + 1;
buttons += `<button class="neutral-btn safe" onclick="selectWizardUpgrade('${sig}')">${sigilIconOnly(sig)} ${sig} L${currentLevel} → <span style="color:#14b8a6">${sig} L${nextLevel}</span></button>`;
});

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/wizard2.png',
title: `Trial ${challengeIndex + 1} - DC ${dc}`,
diceTray: renderDiceTray({ dc, rolled: true, rolls, best }),
outcomes: [`<span style="color:#22c55e">SUCCESS</span>`],
description,
buttons,
overlays: wizardWallOverlay()
});
}, dc);
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
toast(`${sig} temporarily upgraded to L${newTotalLevel} for all heroes!`, 1800);

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
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`,
overlays: wizardWallOverlay()
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
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`,
overlays: wizardWallOverlay()
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

const v = document.getElementById('gameView');
const h = S.heroes[heroIdx];
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/oracle1.png',
title: 'The Oracle\'s Fortune',
description: `The Oracle peers deep into the crystal sphere, channeling ${h.n}'s destiny...`,
diceTray: renderDiceTray({ rollCallback: `oracleChooseRoll(${heroIdx}, '${stat}')` })
});
}

function oracleChooseRoll(heroIdx, stat) {
animateDiceRoll(function(rolls, best) {
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
// Awards 1 stack now (same as Oracle 2 would give), skipping Oracle 2
if(stat === 'HP') {
h.m += 5;
h.h += 5;
} else {
h.p += 1;
}
fortune = `"Incredible.. Could it be... Now? Before my very eyes?!" A strange light emanates from the orb, infusing the room. ${h.n} feels ${stat === 'POW' ? 'stronger' : 'healthier'} already! ${stat === 'POW' ? 'POW +1!' : 'Maximum HP +5!'}`;
stage2Effect = 'IMMEDIATE';
removeNeutralFromDeck('oracle'); // Remove oracle entirely - effect already granted
}

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/oracle1.png',
title: 'The Oracle\'s Fortune',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
outcomes: [
`${h.n} steps forward seeking ${stat === 'POW' ? 'Power' : 'Life'}.`,
`The Oracle gazes into the crystal sphere, then speaks: ${fortune}`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}); // end animateDiceRoll
}

function showOracle2() {
if(S.oracleHero == null || S.oracleRoll == null || S.oracleStat == null) {
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
h.p = Math.max(1, h.p - 1);
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
S.encampmentHero = heroIdx;
const hero = S.heroes[heroIdx];
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past',
description: `${hero.n} carefully tiptoes through the shadows...`,
diceTray: renderDiceTray({ rollCallback: `sneakByEncampmentRoll(${heroIdx})` })
});
}

function sneakByEncampmentRoll(heroIdx) {
animateDiceRoll(function(rolls, best) {
const v = document.getElementById('gameView');
let outcome = '';
if(best >= 1 && best <= 10) {
outcome = `Well, that's why the enemies set up a trip wire. It worked. It's an ambush!`;
replaceStage1WithStage2('encampment');
S.ambushed = true;
toast('Next combat will be AMBUSHED!', 2400, 'critical');

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
outcomes: [outcome],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else if(best >= 11 && best <= 19) {
outcome = `You slip past quietly. The enemies remain unaware.`;

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
outcomes: [outcome],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else {
const comp = getEnemyComp(S.floor + 1);
const stragglerType = comp[Math.floor(Math.random() * comp.length)];
const base = E[stragglerType];

window.pendingStragglerData = { base, stragglerType };

outcome = `As you sneak by, you spy an enemy straggler who appears to be hiding from the group... It looks like they want to join your party!`;

let heroButtons = '';
S.heroes.forEach((h, i) => {
const hp = h.ls ? `Last Stand (T${h.lst+1})` : `${h.h}/${h.m}❤`;
heroButtons += `<button class="neutral-btn safe" onclick="assignRecruitToHero(${i})">${h.n} - ${h.p}💥 | ${hp}</button>`;
});

v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Sneaking Past - NAT 20!',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
description: `${outcome}<br><br><strong>Who should recruit the ${base.n}?</strong>`,
buttons: heroButtons
});
}
});
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
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
description: `${hero.n} leads the charge toward the encampment...`,
diceTray: renderDiceTray({ rollCallback: `engageEarlyEncampmentRoll(${heroIdx})` })
});
}

function engageEarlyEncampmentRoll(heroIdx) {
animateDiceRoll(function(rolls, best) {
const v = document.getElementById('gameView');

if(best >= 1 && best <= 15) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
outcomes: [`As the heroes sneak up to the camp, a scout's horn sounds. You've been spotted, and you're surrounded! It's an ambush!`],
buttons: `<button class="btn" onclick="finishEncampmentFail()">Continue</button>`
});
} else if(best >= 16 && best <= 19) {
S.encampmentEarlyKills = 1;
replaceStage1WithStage2('encampment');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
outcomes: [`Your frogs work together to lure one enemy away and take him out! He screams as he dies, though, and by the time you turn, the rest are scrambling to form ranks.`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else {
S.encampmentEarlyKills = 2;
replaceStage1WithStage2('encampment');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment1.png',
title: 'Engaging Early',
diceTray: renderDiceTray({ rolled: true, rolls, best }),
outcomes: [`With an excellent ploy, you succeed at picking off 2 enemies! The next combat should be a walk in the pond!`],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}
});
}

function finishEncampmentFail() {
replaceStage1WithStage2('encampment');
S.ambushed = true;
toast('Next combat will be AMBUSHED!', 2400, 'critical');
nextFloor();
}

// ===== 6b. ENCAMPMENT STAGE 2 =====
function showEncampment2() {
const goldGain = 2 * S.heroes.length;

// Heal each hero 50% of their own max HP
const healResults = [];
S.heroes.forEach(h => {
if(!h.ls) {
const healAmt = Math.floor(h.m * 0.5);
h.h = Math.min(h.h + healAmt, h.m);
healResults.push(`${h.n} restored ${healAmt} HP`);
}
});

S.gold += goldGain;
upd();
toast(`All heroes healed 50% HP!`, 1200);
toast(`Gained ${goldGain} Gold!`, 1200);

removeNeutralFromDeck('encampment');

const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/encampment2.png',
title: 'Abandoned Encampment',
description: 'You spy another enemy encampment from a distance, but this one appears abandoned. The bedrolls stink and the tack is stale, but you are able to enter and rest safely.',
outcomes: [
healResults.join(', ') + '!',
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
bgImage: stage === 1 ? 'assets/neutrals/gambling1.png' : 'assets/neutrals/gambling2.png',
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
bgImage: 'assets/neutrals/gambling2.png',
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

v.innerHTML = buildNeutralHTML({
bgImage: state.stage === 1 ? 'assets/neutrals/gambling1.png' : 'assets/neutrals/gambling2.png',
title: state.stage === 1 ? 'Between the 20s' : 'Between the 20s Extreme',
description: `Range: <span style="color:#22c55e">${state.minBound}</span> to <span style="color:#22c55e">${state.maxBound}</span>. Rolling target dice...`,
diceTray: renderDiceTray({ rollCallback: 'targetRollBetween20sRoll()' })
});
}

function targetRollBetween20sRoll() {
const state = window.between20sState;
animateDiceRoll(function(targetRolls, best) {
const v = document.getElementById('gameView');

// Check if ANY die lands between bounds (inclusive)
const winners = targetRolls.filter(r => r >= state.minBound && r <= state.maxBound);
const won = winners.length > 0;

if(won) {
let payout = state.wager * (state.stage === 1 ? 2 : 4);
if(state.stage === 2) {
payout = Math.min(payout, 40);
}
const netGain = payout - state.wager;
S.gold -= state.wager;
S.gold += payout;
upd();

if(state.stage === 1) {
replaceStage1WithStage2('gambling');
toast('Between the 20s Extreme unlocked!', 1800);
}

v.innerHTML = buildNeutralHTML({
bgImage: state.stage === 1 ? 'assets/neutrals/gambling1.png' : 'assets/neutrals/gambling2.png',
title: state.stage === 1 ? 'Between the 20s - WIN!' : 'Between the 20s Extreme - WIN!',
diceTray: renderDiceTray({ rolled: true, rolls: targetRolls, best }),
outcomes: [
`<span style="color:#22c55e">SUCCESS! ${winners.map(w => `[${w}]`).join(' ')} landed in range [${state.minBound}-${state.maxBound}]!</span>`,
`Won ${payout}G! (Net: +${netGain}G)`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else {
S.gold -= state.wager;
upd();

v.innerHTML = buildNeutralHTML({
bgImage: state.stage === 1 ? 'assets/neutrals/gambling1.png' : 'assets/neutrals/gambling2.png',
title: state.stage === 1 ? 'Between the 20s - Loss' : 'Between the 20s Extreme - Loss',
diceTray: renderDiceTray({ rolled: true, rolls: targetRolls, best }),
outcomes: [
`<span style="color:#ef4444">MISS! No dice landed in range [${state.minBound}-${state.maxBound}].</span>`,
`Lost ${state.wager}G.`
],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
}
});
}

function showGambling2() {
const v = document.getElementById('gameView');
// Entry requirement: minimum 2 gold
if(S.gold < 2) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/gambling2.png',
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
bgImage: 'assets/neutrals/gambling2.png',
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
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Escaping the Ghost Boys',
description: `You try to break free from the trance... (DC ${ghostEscapeDC})`,
diceTray: renderDiceTray({ dc: ghostEscapeDC, rollCallback: 'attemptGhostEscapeRoll()' })
});
}

function attemptGhostEscapeRoll() {
animateDiceRoll(function(rolls, best) {
const v = document.getElementById('gameView');

if(best >= ghostEscapeDC) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Escaping the Ghost Boys',
diceTray: renderDiceTray({ dc: ghostEscapeDC, rolled: true, rolls, best }),
outcomes: ['You clear your head and break free from the strange trance. The boys look sad to stop playing, but let you go. "Come back and play sometime... We\'re so lonely..."'],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}

let heroButtons = '';
S.heroes.forEach((h, idx) => {
if(h.ls) return;
heroButtons += `<button class="neutral-btn danger" onclick="applyGhostDamage(${idx})">${h.n} (${h.h}/${h.m}❤)</button>`;
});
if(!heroButtons) {
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'The Ghost Boys Let You Go',
outcomes: ['The boys notice your whole party is on the brink of collapse. "We... we didn\'t mean to hurt you this badly. You should go." They fade into the mist, looking genuinely sorry.'],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
return;
}
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Trapped with the Ghost Boys',
diceTray: renderDiceTray({ dc: ghostEscapeDC, rolled: true, rolls, best }),
description: 'Choose which hero takes 1 damage:',
outcomes: ['You don\'t notice time passing, but pangs of hunger and fatigue make it clear you\'ve been here longer than it feels like. The boys are having a great time playing.'],
buttons: heroButtons
});
}, ghostEscapeDC);
}

function applyGhostDamage(heroIdx) {
const hero = S.heroes[heroIdx];
const hadGhostCharge = hero.g > 0;

// Apply damage through shields first (consistent with combat)
if(hero.sh > 0) {
hero.sh -= 1;
toast(`${hero.n}'s shield absorbed the damage!`);
ghostEscapeAttempts++;
ghostEscapeDC -= 2;
upd();
if(ghostEscapeAttempts >= 9) {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Finally Free',
outcomes: ['After many attempts, the ghost boys grow bored and fade away.'],
buttons: `<button class="btn" onclick="nextFloor()">Continue</button>`
});
} else {
const v = document.getElementById('gameView');
v.innerHTML = buildNeutralHTML({
bgImage: 'assets/neutrals/ghost1.png',
title: 'Try Again',
description: `<div style="font-size:0.9rem;margin:1rem 0">Attempts: ${ghostEscapeAttempts}/9 | Next DC: ${ghostEscapeDC}</div>`,
outcomes: [`${hero.n}'s shield absorbed the damage!`],
buttons: `<button class="btn danger" onclick="attemptGhostEscape()">Try to Escape (DC ${ghostEscapeDC})</button>`
});
}
return;
}
const preHitHP = hero.h;
hero.h -= 1;
if(hero.h <= 0) {
hero.h = 0;
if(hero.g > 0) {
hero.g--;
hero.h = preHitHP; // Restore to pre-hit value (ghost fully negates the hit)
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
buttons,
overlays: [
{ src: SIGIL_IMAGES[sigil1], alt: sigil1, top: '35%', left: '18%', width: '16%', rotation: 0 },
{ src: SIGIL_IMAGES[sigil2], alt: sigil2, top: '35%', left: '66%', width: '16%', rotation: 0 }
]
});
}

function chooseRoyalSigil(sig) {
S.sig[sig] = (S.sig[sig] || 0) + 1;
const activesSigils = ['Attack', 'Shield', 'Heal', 'D20', 'Grapple', 'Ghost', 'Alpha'];
const displayLvl = activesSigils.includes(sig) ? S.sig[sig] + 1 : S.sig[sig];
upd();
savePermanent();
toast(`${sig} permanently upgraded to L${displayLvl}!`, 1800);
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
<img src="assets/tapo_old.png" alt="Old Tapo, Master of Space and Time" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #8b5cf6;box-shadow:0 0 20px rgba(139,92,246,0.5)">
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
<img src="assets/tapo_old.png" alt="Old Tapo" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #8b5cf6;box-shadow:0 0 20px rgba(139,92,246,0.5)">
<div class="neutral-title" style="color:#8b5cf6;font-size:1.8rem">The Master of Space and Time</div>
<div class="neutral-desc" style="font-size:1.1rem;line-height:1.8;padding:1rem;background:rgba(139,92,246,0.1);border-radius:8px;margin:1rem 0">
"Noble frogs of my youth, do you understand? Of course not... For you are the true tadpoles, on this fleeting cosmic scale. But you cannot understand, not as I have understood... There is only love, and joy, and progress... And flies. I have transcended the need for food, Oh, how I gorged myself on succulent Flydra flesh back in my youth... I've outgrown such things now. And yet, I find myself nostalgic for that flavor once more..."
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
<div style="transform:scaleX(-1);display:inline-block"><img src="assets/tapo_normal.png" alt="Baby Tapo" style="max-width:100%;height:auto;max-width:300px;margin:0 auto 1rem auto;display:block;animation:bounce 1s ease-in-out 3"></div>
<div class="neutral-desc" style="font-size:1.1rem;line-height:1.8;padding:1rem;margin:1rem 0">
<em>Squeals.</em> The heroes know this sound well - Baby Tapo is hungry for flies!
</div>
<div style="font-size:2.5rem;font-weight:bold;color:#3b82f6;text-shadow:0 0 10px rgba(251,191,36,0.5);margin:2rem 0;animation:glow 1s ease-in-out infinite">
Tapo Unlocked!
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
<img src="assets/reaper.png" alt="The Reaper" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
<h1 style="text-align:center;margin-bottom:2rem;font-size:2.5rem;color:#dc2626">DEATH</h1>
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
<img src="assets/reaper.png" alt="The Reaper" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
<h1 style="text-align:center;margin-bottom:2rem;font-size:2.5rem;color:#dc2626">DEATH</h1>
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



