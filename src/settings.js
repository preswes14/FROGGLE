// ===== DEBUG MODE =====
function toggleDebugMode(enabled) {
S.debugMode = enabled;
toast(enabled ? 'Debug Mode ON' : 'Debug Mode OFF', 1200);
// Update debug button visibility in header
const debugBtn = document.getElementById('debugBtn');
if(debugBtn) debugBtn.style.display = enabled ? 'block' : 'none';
// Refresh settings menu if open to show/hide debug tools button
const settingsMenu = document.querySelector('[style*="z-index:30000"]');
if(settingsMenu) {
closeSettingsMenu();
showSettingsMenu();
}
}

function toggleOopsAll20s(enabled) {
S.oopsAll20s = enabled;
toast(enabled ? 'Oops All 20s: ON (All D20 rolls = 20!)' : 'Oops All 20s: OFF', 1500);
// Refresh debug menu to update checkbox
const debugMenu = document.querySelector('[style*="z-index:30000"]');
if(debugMenu && debugMenu.textContent.includes('DEBUG MENU')) {
closeDebugMenu();
showDebugMenu();
}
}

function showDebugMenu() {
const inCombat = S.enemies && S.enemies.length > 0;
const v = document.getElementById('gameView');
const allSigils = ['Attack', 'Shield', 'Heal', 'D20', 'Expand', 'Grapple', 'Ghost', 'Asterisk', 'Star', 'Alpha'];
const heroNames = S.heroes.map((h, i) => ({name: h.n, idx: i}));

let html = `
<div class="modal-container dark" role="dialog" aria-modal="true" aria-label="Debug menu">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">DEBUG MENU</h2>

<h3 class="modal-section-title green">Resources</h3>
<button class="btn" onclick="debugAddGold()" style="margin-bottom:0.5rem;background:#22c55e">+100 Gold</button>
<button class="btn" onclick="debugAddXP()" style="margin-bottom:0.5rem;background:#22c55e">+100 XP</button>

<h3 class="modal-section-title green">Navigation</h3>
<div style="margin:0.5rem 0">
<label style="color:white;font-size:0.9rem">Jump to Floor:</label>
<input type="number" id="debugFloorInput" min="1" max="19" value="${S.floor}" style="width:60px;padding:0.25rem;margin:0 0.5rem;font-size:1rem">
<button class="btn" onclick="debugJumpFloor()" style="display:inline-block;width:auto;padding:0.5rem 1rem;margin:0;font-size:0.9rem;min-height:auto">Go</button>
</div>
<div style="margin:0.5rem 0">
<label style="color:white;font-size:0.9rem">Preview Neutral Encounter:</label>
<select id="debugNeutralSelect" style="padding:0.25rem;margin:0.25rem 0;font-size:0.9rem;width:100%">
<option value="shopkeeper1">Shopkeeper (Stage 1)</option>
<option value="shopkeeper2">Shopkeeper (Stage 2)</option>
<option value="wishingwell1">Wishing Well (Stage 1)</option>
<option value="wishingwell2">Wishing Well (Stage 2)</option>
<option value="treasurechest1">Treasure Chest (Stage 1)</option>
<option value="treasurechest2">Treasure Chest (Stage 2)</option>
<option value="wizard1">Wizard (Stage 1)</option>
<option value="wizard2">Wizard (Stage 2)</option>
<option value="oracle1">Oracle (Stage 1)</option>
<option value="oracle2">Oracle (Stage 2)</option>
<option value="encampment1">Encampment (Stage 1)</option>
<option value="encampment2">Encampment (Stage 2)</option>
<option value="gambling1">Gambling (Stage 1)</option>
<option value="gambling2">Gambling (Stage 2)</option>
<option value="ghost1">Ghost Boys (Stage 1)</option>
<option value="ghost2">Ghost Boys (Stage 2)</option>
<option value="royal1">Royal (Stage 1)</option>
<option value="royal2">Royal (Stage 2)</option>
</select>
<button class="btn" onclick="debugPreviewNeutral()" style="margin-top:0.25rem;background:#8b5cf6">Preview</button>
</div>

<h3 class="modal-section-title green">Sigil Levels</h3>
<div style="margin:0.5rem 0">
<select id="debugSigilSelect" style="padding:0.25rem;margin-right:0.5rem;font-size:0.9rem">
${allSigils.map(sig => `<option value="${sig}">${sig} (L${S.sig[sig] || 0})</option>`).join('')}
</select>
<input type="number" id="debugSigilLevel" min="0" max="5" value="1" style="width:50px;padding:0.25rem;margin:0 0.5rem;font-size:1rem">
<button class="btn" onclick="debugSetSigilLevel()" style="display:inline-block;width:auto;padding:0.5rem 1rem;margin:0;font-size:0.9rem;min-height:auto">Set</button>
</div>

${heroNames.length > 0 ? `
<h3 class="modal-section-title green">Hero Stats</h3>
<div style="margin:0.5rem 0">
<select id="debugHeroSelect" style="padding:0.25rem;margin-bottom:0.5rem;font-size:0.9rem;width:100%">
${heroNames.map(h => `<option value="${h.idx}">${h.name} (POW:${S.heroes[h.idx].p}, HP:${S.heroes[h.idx].h}/${S.heroes[h.idx].m})</option>`).join('')}
</select>
<div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
<div style="flex:1">
<label style="color:white;font-size:0.85rem;display:block">POW:</label>
<input type="number" id="debugHeroPOW" min="1" max="20" value="1" style="width:100%;padding:0.25rem;font-size:1rem">
</div>
<div style="flex:1">
<label style="color:white;font-size:0.85rem;display:block">Max HP:</label>
<input type="number" id="debugHeroMaxHP" min="1" max="50" value="5" style="width:100%;padding:0.25rem;font-size:1rem">
</div>
</div>
<button class="btn" onclick="debugSetHeroStats()" style="background:#3b82f6;margin-bottom:0.5rem">Update Hero Stats</button>
${S.heroes.some(h => h.ls) ? `<button class="btn" onclick="debugReviveFromLastStand()" style="background:#dc2626;margin-bottom:0.5rem">Revive from Last Stand</button>` : ''}
</div>
` : ''}

${inCombat ? `
<h3 class="modal-section-title green">Combat</h3>
<button class="btn danger" onclick="debugDealDamage()">Deal 50 DMG to Enemy</button>
` : ''}

<h3 class="modal-section-title blue">Cheats</h3>
<label class="modal-checkbox-label" style="background:rgba(251,191,36,0.2)">
<input type="checkbox" ${S.oopsAll20s ? 'checked' : ''} onchange="toggleOopsAll20s(this.checked)">
<span>Oops All 20s (Auto-succeed D20 rolls)</span>
</label>

<button class="btn" onclick="closeDebugMenu()" style="margin-top:1rem;background:#888">Close</button>
</div>
<div class="modal-overlay" role="presentation" onclick="closeDebugMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

function closeDebugMenu() {
// Remove debug menu elements - only target settings/debug modals
const menus = document.querySelectorAll('.settings-modal-container, .settings-modal-overlay, .modal-container.dark, .modal-overlay');
menus.forEach(m => m.remove());
}

// ===== SETTINGS MENU =====
function showSettingsMenu() {
const v = document.getElementById('gameView');
const inGame = S.heroes && S.heroes.length > 0 && S.floor > 0;
const inTutorial = S.heroes && S.heroes.length > 0 && S.floor === 0;
const inRibbleton = S.inRibbleton;

let html = `
<div class="modal-container dark" role="dialog" aria-modal="true" aria-label="Settings">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">SETTINGS</h2>

${inGame ? `
<button class="btn" onclick="manualSave()" style="margin-bottom:0.5rem;background:#22c55e">Save Game</button>
<button class="btn" onclick="restartLevel()" style="margin-bottom:0.5rem;background:#f97316">Restart Level</button>
` : ''}

<div style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.5rem">
<button class="btn" onclick="showAudioSettings()" style="background:#22c55e">♫ Audio</button>
<button class="btn" onclick="showGameplaySettings()" style="background:#6366f1">⚙ Gameplay</button>
<button class="btn" onclick="showDisplaySettings()" style="background:#8b5cf6">◈ Display</button>
<button class="btn" onclick="showControllerSettings()" style="background:#0ea5e9">◉ Controller</button>
</div>

${inGame ? `
<button class="btn danger" onclick="confirmQuitToRibbleton()" style="margin-top:1rem;background:#dc2626">Quit to Ribbleton</button>
` : inTutorial ? `
<button class="btn danger" onclick="confirmQuitTutorial()" style="margin-top:1rem;background:#dc2626">Exit Tutorial</button>
` : inRibbleton ? `
<button class="btn" onclick="confirmExitGame()" style="margin-top:1rem;background:#dc2626">Quit Game</button>
` : ''}

<button class="settings-back-btn" onclick="closeSettingsMenu()">Return</button>
<div style="margin-top:0.5rem;font-size:0.8rem;opacity:0.5;text-align:center" aria-hidden="true">Press Ⓑ to close menu</div>
</div>
<div class="modal-overlay" role="presentation" onclick="closeSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

// ===== AUDIO SETTINGS SUBMENU =====
function showAudioSettings() {
closeSettingsMenu();
const v = document.getElementById('gameView');

// Convert 0-1 to percentage for display
const masterPct = Math.round((S.masterVolume ?? 1) * 100);
const sfxPct = Math.round((S.sfxVolume ?? 1) * 100);
const musicPct = Math.round((S.musicVolume ?? 1) * 100);

let html = `
<div class="modal-container dark" role="dialog" aria-modal="true" aria-label="Audio settings">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">AUDIOh2>

<div style="display:flex;flex-direction:column;gap:1.25rem">

<div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<label style="font-weight:bold;color:#fbbf24">♪ Master Volume</label>
<span id="master-vol-display" style="font-size:0.9rem;color:#fbbf24">${masterPct}%</span>
</div>
<input type="range" min="0" max="100" value="${masterPct}" aria-label="Master volume"
  oninput="updateVolumeDisplay('master', this.value); setMasterVolume(this.value / 100)"
  style="width:100%;height:8px;cursor:pointer;accent-color:#fbbf24">
</div>

<div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<label style="font-weight:bold;color:#22c55e">♪ Sound Effects</label>
<span id="sfx-vol-display" style="font-size:0.9rem;color:#22c55e">${sfxPct}%</span>
</div>
<input type="range" min="0" max="100" value="${sfxPct}" aria-label="Sound effects volume"
  oninput="updateVolumeDisplay('sfx', this.value); setSfxVolume(this.value / 100)"
  style="width:100%;height:8px;cursor:pointer;accent-color:#22c55e">
</div>

<div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<label style="font-weight:bold;color:#8b5cf6">♫ Music</label>
<span id="music-vol-display" style="font-size:0.9rem;color:#8b5cf6">${musicPct}%</span>
</div>
<input type="range" min="0" max="100" value="${musicPct}" aria-label="Music volume"
  oninput="updateVolumeDisplay('music', this.value); setMusicVolume(this.value / 100)"
  style="width:100%;height:8px;cursor:pointer;accent-color:#8b5cf6">
</div>

</div>

<button class="btn" onclick="testAudioLevels()" style="margin-top:1rem;background:#374151">Test Sound</button>

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" role="presentation" onclick="closeSettingsMenu();showSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

// Update volume display as slider moves
function updateVolumeDisplay(type, value) {
const display = document.getElementById(`${type}-vol-display`);
if (display) display.textContent = `${value}%`;
}

// Test audio levels with a sample sound
function testAudioLevels() {
SoundFX.play('ribbit');
}

// ===== GAMEPLAY SETTINGS SUBMENU =====
function showGameplaySettings() {
closeSettingsMenu();
const v = document.getElementById('gameView');

let html = `
<div class="modal-container dark" role="dialog" aria-modal="true" aria-label="Gameplay settings">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">GAMEPLAYh2>

<h3 class="modal-section-title green">Animation Speed</h3>
<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem">
<button class="btn ${S.animationSpeed === 1 ? 'selected' : ''}" onclick="setAnimationSpeed(1, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 1 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">Normal</button>
<button class="btn ${S.animationSpeed === 2 ? 'selected' : ''}" onclick="setAnimationSpeed(2, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 2 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">2x</button>
<button class="btn ${S.animationSpeed === 4 ? 'selected' : ''}" onclick="setAnimationSpeed(4, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 4 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">4x</button>
<button class="btn ${S.animationSpeed === 0 ? 'selected' : ''}" onclick="setAnimationSpeed(0, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 0 ? 'background:#f97316;border-color:#ea580c' : 'background:#374151'}">Instant</button>
</div>

<h3 class="modal-section-title blue">Debug</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${S.debugMode ? 'checked' : ''} onchange="toggleDebugMode(this.checked)">
<span>Enable Debug Mode</span>
</label>
${S.debugMode ? `<button class="btn" onclick="closeSettingsMenu();showDebugMenu()" style="margin-bottom:0.5rem;background:#3b82f6">Open Debug Tools</button>` : ''}

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" role="presentation" onclick="closeSettingsMenu();showSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

// ===== DISPLAY SETTINGS SUBMENU =====
function showDisplaySettings() {
closeSettingsMenu();
const v = document.getElementById('gameView');

let html = `
<div class="modal-container dark" role="dialog" aria-modal="true" aria-label="Display settings">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">DISPLAY</h2>

<label class="modal-checkbox-label">
<input type="checkbox" ${S.toastLogVisible ? 'checked' : ''} onchange="toggleToastLogVisibility(this.checked)">
<span>▸ Show Toast Log</span>
</label>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.helpTipsDisabled ? 'checked' : ''} onchange="toggleHelpTips(this.checked)">
<span>▸ Help Tips</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.25rem 0.5rem;padding-left:0.5rem">Mechanic explanation popups</p>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.tutorialDisabled ? 'checked' : ''} onchange="toggleTutorialWalkthrough(this.checked)">
<span>Tutorial Walkthrough</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.25rem 0.5rem;padding-left:0.5rem">Guided tutorial popups</p>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.cutsceneDisabled ? 'checked' : ''} onchange="toggleCutscenes(this.checked)">
<span>▸ Story Cutscenes</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.5rem 0.5rem;padding-left:0.5rem">One-time narrative events</p>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.tooltipsDisabled ? 'checked' : ''} onchange="toggleTooltips(this.checked)">
<span>▸ Show Sigil Tooltips</span>
</label>

<h3 class="modal-section-title green" style="margin-top:1rem">Accessibility</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${S.highContrastMode ? 'checked' : ''} onchange="toggleHighContrastMode(this.checked)">
<span>High Contrast Mode</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.5rem 0.5rem;padding-left:0.5rem">Enhanced visibility for low vision users</p>

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" role="presentation" onclick="closeSettingsMenu();showSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

// Toggle toast log visibility in header
function toggleToastLogVisibility(enabled) {
S.toastLogVisible = enabled;
savePermanent();
render();
toast(enabled ? 'Toast Log: Visible' : 'Toast Log: Hidden', 1500);
}

// Toggle high contrast mode
function toggleHighContrastMode(enabled) {
S.highContrastMode = enabled;
if (enabled) {
document.body.classList.add('high-contrast');
} else {
document.body.classList.remove('high-contrast');
}
savePermanent();
toast(enabled ? 'High Contrast Mode: ON' : 'High Contrast Mode: OFF', 1500);
}

// ===== CONTROLLER SETTINGS SUBMENU =====
function showControllerSettings() {
closeSettingsMenu();
const v = document.getElementById('gameView');

let html = `
<div class="modal-container dark" role="dialog" aria-modal="true" aria-label="Controller settings">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">CONTROLLER</h2>

<label class="modal-checkbox-label">
<input type="checkbox" ${!S.controllerDisabled ? 'checked' : ''} onchange="toggleControllerSupport(this.checked)">
<span>Controller Support</span>
</label>
<button class="btn" onclick="showControlsGuide()" style="margin-bottom:0.5rem;background:#6366f1">Controls Guide</button>
<button class="btn" onclick="forceReinitController()" style="margin-bottom:0.5rem;background:#22c55e;font-size:0.9rem">Re-Init Controller</button>
<button class="btn" onclick="toggleControllerDebug()" style="margin-bottom:0.5rem;background:#f59e0b;font-size:0.9rem">Input Overlay</button>

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" role="presentation" onclick="closeSettingsMenu();showSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

function closeSettingsMenu() {
// Only remove settings-specific modals to avoid interfering with game screens
const menus = document.querySelectorAll('.settings-modal-container, .settings-modal-overlay, .modal-container.dark, .modal-overlay');
menus.forEach(m => m.remove());
}

function manualSave() {
saveGame();
toast('Game Saved!', 1200);
closeSettingsMenu();
}

function restartLevel() {
showConfirmModal('Restart this floor? All progress on this floor will be lost.', () => {
closeSettingsMenu();
toast('Restarting floor...', 1200);
setTimeout(() => {
if(S.floor % 2 === 1) {
// Odd floor = combat
startFloor(S.floor);
} else {
// Even floor = neutral
startFloor(S.floor);
}
}, 500);
});
}

function confirmQuitToRibbleton() {
showConfirmModal('Quit to Ribbleton? Your progress is saved at the start of each floor. Any progress on the current floor will be lost.', () => {
closeSettingsMenu();
toast('Returning to Ribbleton...', 1200);
// Reset game state but preserve permanent progression
S.heroes = [];
S.floor = 0;
S.round = 0;
S.enemies = [];
S.recruits = [];
S.combatXP = 0;
S.combatGold = 0;
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
S.activeIdx = -1;
S.acted = [];
S.turn = 'player';
S.locked = false;
S.inCombat = false;
S.combatEnding = false;
S.alphaGrantedActions = [];
S.alphaCurrentAction = 0;
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.inRibbleton = true;
setTimeout(() => {
showRibbleton();
}, 500);
});
}

function confirmQuitTutorial() {
showConfirmModal('Exit tutorial? You can restart it anytime from Ribbleton.', () => {
closeSettingsMenu();
toast('Exiting tutorial...', 1200);
// Clear tutorial state
if(typeof tutorialState !== 'undefined') tutorialState = null;
// Reset game state
S.heroes = [];
S.floor = 0;
S.round = 0;
S.enemies = [];
S.recruits = [];
S.combatXP = 0;
S.combatGold = 0;
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
S.activeIdx = -1;
S.acted = [];
S.turn = 'player';
S.locked = false;
S.inCombat = false;
S.combatEnding = false;
S.alphaGrantedActions = [];
S.alphaCurrentAction = 0;
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.inRibbleton = true;
S.inTutorial = false;
setTimeout(() => {
showRibbleton();
}, 500);
});
}

function confirmExitGame() {
showConfirmModal('Exit to title screen? Your permanent progress (gold, sigil upgrades, etc.) is always saved.', () => {
closeSettingsMenu();
toast('Returning to title...', 1200);
// Reset ALL game state
S.heroes = [];
S.floor = 0;
S.round = 0;
S.enemies = [];
S.recruits = [];
S.combatXP = 0;
S.combatGold = 0;
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
S.activeIdx = -1;
S.acted = [];
S.turn = 'player';
S.locked = false;
S.inCombat = false;
S.combatEnding = false;
S.alphaGrantedActions = [];
S.alphaCurrentAction = 0;
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.inRibbleton = false;
S.inTutorial = false;
// Save permanent progress
savePermanent();
setTimeout(() => {
mainTitlePage();
}, 500);
});
}


function toggleHelpTips(enabled) {
S.helpTipsDisabled = !enabled;
if(enabled) {
// Reset only help tip flags (not tutorial or narrative)
const tipsToReset = Object.keys(S.tutorialFlags).filter(flag =>
  !TUTORIAL_FLAG_CATEGORIES.narrative.includes(flag) &&
  !TUTORIAL_FLAG_CATEGORIES.tutorial.includes(flag)
);
tipsToReset.forEach(flag => { delete S.tutorialFlags[flag]; });
toast('Help tips re-enabled! Tips will show again.', 2000);
if(typeof render === 'function') {
try { render(); } catch(e) { /* render() not applicable in current state */ }
}
if(document.querySelector('h1')?.textContent?.includes('Welcome Home to Ribbleton')) {
setTimeout(() => showRibbleton(), 100);
}
} else {
toast('Help tips disabled.', 1200);
}
savePermanent();
}

function toggleTutorialWalkthrough(enabled) {
S.tutorialDisabled = !enabled;
if(enabled) {
// Reset only tutorial walkthrough flags
TUTORIAL_FLAG_CATEGORIES.tutorial.forEach(flag => { delete S.tutorialFlags[flag]; });
toast('Tutorial popups re-enabled! They will show again next playthrough.', 2000);
} else {
toast('Tutorial popups disabled.', 1200);
}
savePermanent();
}

function toggleCutscenes(enabled) {
S.cutsceneDisabled = !enabled;
if(enabled) {
// Reset only narrative/cutscene flags (except tutorial_fly_munched which is quest-linked)
TUTORIAL_FLAG_CATEGORIES.narrative.forEach(flag => {
  if(flag !== 'tutorial_fly_munched') delete S.tutorialFlags[flag];
});
toast('Cutscenes re-enabled! Story events will replay.', 2000);
} else {
toast('Cutscenes disabled.', 1200);
}
savePermanent();
}

function toggleTooltips(enabled) {
S.tooltipsDisabled = !enabled;
if(enabled) {
toast('Sigil tooltips enabled!', 1200);
} else {
toast('Sigil tooltips disabled!', 1200);
}
savePermanent();
}

function setAnimationSpeed(speed, fromSubmenu = false) {
S.animationSpeed = speed;
const labels = {0: 'Instant', 1: 'Normal', 2: '2x', 4: '4x'};
toast(`Animation speed: ${labels[speed]}`, 1200);
SoundFX.play('hop');
savePermanent();
// Refresh gameplay settings submenu to update button states
closeSettingsMenu();
if (fromSubmenu) {
showGameplaySettings();
} else {
showSettingsMenu();
}
}

// toggleControllerSupport and forceReinitController are defined in controller.js

// Live controller debug overlay - shows input in real-time on screen
function toggleControllerDebug() {
const existing = document.getElementById('controller-debug-overlay');
if (existing) {
existing.remove();
toast('Controller debug disabled', 1200);
closeSettingsMenu();
return;
}

const overlay = document.createElement('div');
overlay.id = 'controller-debug-overlay';
overlay.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.9);color:#0f0;font-family:monospace;font-size:12px;padding:10px;border-radius:8px;z-index:99999;max-width:300px;border:2px solid #0f0';
overlay.innerHTML = `
<div style="font-weight:bold;margin-bottom:5px;color:#fff">CONTROLLER DEBUG</div>
<div id="debug-gamepad-status">Checking...</div>
<div id="debug-buttons" style="margin-top:5px"></div>
<div id="debug-axes" style="margin-top:5px"></div>
<div id="debug-keyboard" style="margin-top:5px;color:#ff0">Last key: none</div>
<div id="debug-key-count" style="font-size:10px;color:#888">Keys pressed: 0</div>
<div style="margin-top:8px">
<button id="debug-detect-btn" style="background:#22c55e;color:#000;border:none;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer">Force Detect</button>
</div>
<div style="margin-top:5px;font-size:10px;color:#888">Tap overlay to close</div>
`;
overlay.onclick = (e) => {
  if (e.target === overlay) overlay.remove();
};
document.body.appendChild(overlay);

// Force detect button
document.getElementById('debug-detect-btn').onclick = (e) => {
  e.stopPropagation();
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  let msg = 'Gamepad API result:\\n';
  for (let i = 0; i < 4; i++) {
    msg += `[${i}]: ${gamepads[i] ? gamepads[i].id : 'null'}\\n`;
  }
  msg += '\\nIf all null, Steam Input may be intercepting.\\n';
  msg += 'Try: Steam > FROGGLE > Properties > Controller\\n';
  msg += '> Use "Gamepad with Joystick Trackpad"';
  alert(msg);
  // Also try to reinit controller
  if (typeof GamepadController !== 'undefined') {
    GamepadController.initGamepad();
    toast('Retrying gamepad detection...', 1500);
  }
};

// Track keyboard input - use capture to catch ALL key events
let keyCount = 0;
const keyHandler = (e) => {
keyCount++;
const keyEl = document.getElementById('debug-keyboard');
const countEl = document.getElementById('debug-key-count');
if (keyEl) keyEl.innerHTML = `Last key: <span style="color:#0f0;font-weight:bold">${e.key}</span> (${e.code})`;
if (countEl) countEl.innerHTML = `Keys pressed: <span style="color:#0f0">${keyCount}</span>`;
};
document.addEventListener('keydown', keyHandler, true); // capture phase

// Update loop
const updateDebug = () => {
if (!document.getElementById('controller-debug-overlay')) {
document.removeEventListener('keydown', keyHandler, true);
return;
}

const statusEl = document.getElementById('debug-gamepad-status');
const buttonsEl = document.getElementById('debug-buttons');
const axesEl = document.getElementById('debug-axes');

const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
let found = false;

for (let i = 0; i < gamepads.length; i++) {
const gp = gamepads[i];
if (gp) {
found = true;
statusEl.innerHTML = `<span style="color:#0f0">✓ FOUND:</span> ${gp.id.substring(0,30)}...`;

// Button names for standard gamepad layout
const btnNames = ['A','B','X','Y','LB','RB','LT','RT','Select','Start','L3','R3','Up','Down','Left','Right'];

// Show pressed buttons with names
const pressed = [];
for (let b = 0; b < gp.buttons.length; b++) {
if (gp.buttons[b].pressed || gp.buttons[b].value > 0.5) {
const name = btnNames[b] || `#${b}`;
pressed.push(`<span style="color:#0f0">${name}</span><span style="color:#888">(${b})</span>`);
}
}
buttonsEl.innerHTML = pressed.length > 0
? `Buttons: ${pressed.join(' ')}`
: 'Buttons: <span style="color:#888">none</span>';

// Show axes with friendly names
const axisNames = ['LX', 'LY', 'RX', 'RY', 'LT', 'RT'];
const axes = gp.axes.map((a, i) => {
  if (Math.abs(a) > 0.15) {
    const name = axisNames[i] || `#${i}`;
    return `<span style="color:#0f0">${name}</span>:${a.toFixed(1)}`;
  }
  return null;
}).filter(Boolean);
axesEl.innerHTML = axes.length > 0
? `Axes: ${axes.join(' ')}`
: 'Axes: <span style="color:#888">centered</span>';
break;
}
}

if (!found) {
// Show more diagnostic info
const gpArray = navigator.getGamepads ? navigator.getGamepads() : null;
const gpLen = gpArray ? gpArray.length : 'N/A';
const hasAPI = typeof navigator.getGamepads === 'function' ? 'Yes' : 'No';
const gcLib = typeof gameControl !== 'undefined' ? 'Loaded' : 'Missing';
const gcGps = typeof gameControl !== 'undefined' ? Object.keys(gameControl.getGamepads()).length : 0;
statusEl.innerHTML = `<span style="color:#f00">✗ NO GAMEPAD</span><br>
<span style="font-size:10px;color:#888">
API: ${hasAPI} | Array len: ${gpLen}<br>
gameControl: ${gcLib} (${gcGps} gps)<br>
GamepadController: ${typeof GamepadController !== 'undefined' ? (GamepadController.connected ? 'Connected' : 'No GP') : 'Missing'}
</span>`;
buttonsEl.innerHTML = '<span style="color:#ff0">Press controller buttons...</span>';
axesEl.innerHTML = '<span style="font-size:10px;color:#888">If using Steam Deck, check Steam Input config</span>';
}

requestAnimationFrame(updateDebug);
};
updateDebug();

toast('Controller debug enabled - overlay shown', 1500);
closeSettingsMenu();
}

// Alias for controller.js R3 handler
const showControllerDebug = toggleControllerDebug;

function showControlsGuide() {
closeSettingsMenu();
const v = document.getElementById('gameView');

const controls = [
{ section: 'Sticks', items: [
  { btn: 'Left Stick', desc: 'Navigate (D-pad equivalent)', highlight: true },
  { btn: 'Right Stick', desc: 'Scroll vertically in menus', highlight: true }
]},
{ section: 'Bumpers & Triggers (Combat)', items: [
  { btn: 'LB / RB', desc: 'Previous / Next character (same as right stick)' },
  { btn: 'LT / RT', desc: 'Previous / Next sigil with tooltip (same as left stick)' }
]},
{ section: '✚ D-Pad', items: [
  { btn: 'In Menus', desc: 'Navigate between buttons and options' },
  { btn: 'Up / Down', desc: 'In combat: cycle characters' },
  { btn: 'Left / Right', desc: 'In combat: cycle sigils' }
]},
{ section: '🔘 Face Buttons', items: [
  { btn: 'A', desc: 'Confirm / Select / Click focused element' },
  { btn: 'B', desc: 'Back / Cancel action' },
  { btn: 'X', desc: 'Switch sides (jump to enemy across from you)' },
  { btn: 'Y', desc: 'Toggle sigil tooltip' }
]},
{ section: 'Menu Buttons', items: [
  { btn: 'START (☰)', desc: 'Open Settings menu (works anywhere)' },
  { btn: 'SELECT (⊡)', desc: 'Auto-target: smart targeting for current action' },
  { btn: 'L3 (left click)', desc: 'Show Controls Guide' },
  { btn: 'R3 (right click)', desc: 'Toggle Controller Debug overlay' }
]},
{ section: 'Keyboard Fallback', items: [
  { btn: 'Arrow Keys', desc: 'Navigate (D-pad equivalent)' },
  { btn: 'Enter / Space', desc: 'Confirm (A button)' },
  { btn: 'Escape', desc: 'Back / Cancel (B button)' },
  { btn: 'Tab', desc: 'Cycle focus forward' },
  { btn: 'X', desc: 'Switch sides (X button)' },
  { btn: 'Y', desc: 'Toggle tooltip (Y button)' }
]}
];

let html = `
<div class="modal-container dark" style="max-height:85vh;overflow-y:auto">
<h2 class="modal-title blue" style="margin-bottom:1rem">CONTROLS GUIDE</h2>

<div style="margin-bottom:1rem;padding:0.75rem;background:rgba(34,197,94,0.15);border:2px solid #22c55e;border-radius:8px">
<p style="margin:0;color:#86efac;font-size:0.9rem;text-align:center">
<strong>Quick Reference:</strong> D-pad/Left Stick = Navigate • Bumpers = Characters • Triggers = Sigils
</p>
</div>
`;

controls.forEach(section => {
html += `<h3 class="modal-section-title green" style="margin-top:1rem;font-size:0.95rem">${section.section}</h3>`;
html += `<div style="display:flex;flex-direction:column;gap:0.3rem">`;
section.items.forEach(item => {
const bgColor = item.highlight ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)';
const borderStyle = item.highlight ? 'border:1px solid rgba(34,197,94,0.3);' : '';
html += `
<div style="display:flex;align-items:center;gap:0.75rem;padding:0.4rem 0.5rem;background:${bgColor};${borderStyle}border-radius:6px">
<span style="min-width:120px;font-weight:bold;color:#60a5fa;font-size:0.85rem">${item.btn}</span>
<span style="color:#e5e7eb;font-size:0.8rem">${item.desc}</span>
</div>`;
});
html += `</div>`;
});

html += `
<div style="margin-top:1.5rem;padding:1rem;background:rgba(99,102,241,0.15);border:2px solid #6366f1;border-radius:8px">
<h4 style="color:#a5b4fc;margin:0 0 0.5rem 0;font-size:0.95rem">▸ Pro Tips</h4>
<ul style="margin:0;padding-left:1.25rem;color:#c7d2fe;font-size:0.85rem;line-height:1.5">
<li><strong>Auto-Target (SELECT)</strong> picks smart targets: lowest HP enemies for attacks, most damaged heroes for heals</li>
<li><strong>Switch Sides (X)</strong> quickly jumps between your hero and the enemy across from them</li>
<li><strong>Sigil cycling (LT/RT/Left Stick)</strong> automatically shows tooltips as you browse</li>
<li><strong>Bumpers (LB/RB)</strong> also scroll through long lists in menus</li>
</ul>
</div>

<button class="btn" onclick="showSteamInputGuide()" style="margin-top:1rem;background:#1b2838">
Steam Input Setup Guide
</button>
<button class="btn" onclick="closeControlsGuide()" style="margin-top:0.5rem;background:#888">Close</button>
</div>
<div class="modal-overlay" onclick="closeControlsGuide()"></div>
`;

v.insertAdjacentHTML('beforeend', html);
}

function closeControlsGuide() {
const menus = document.querySelectorAll('.modal-container.dark, .modal-overlay');
menus.forEach(m => m.remove());
}

function showSteamInputGuide() {
// Remove existing modal first
const menus = document.querySelectorAll('.modal-container.dark, .modal-overlay');
menus.forEach(m => m.remove());

const v = document.getElementById('gameView');

let html = `
<div class="modal-container dark" style="max-height:85vh;overflow-y:auto">
<h2 class="modal-title" style="margin-bottom:1rem;color:#1b2838">
<span style="background:linear-gradient(135deg,#1b2838,#2a475e);padding:0.3rem 0.6rem;border-radius:4px">Steam Input Setup</span>
</h2>

<div style="margin-bottom:1rem;padding:0.75rem;background:rgba(27,40,56,0.3);border:2px solid #2a475e;border-radius:8px">
<p style="margin:0;color:#c7d5e0;font-size:0.9rem;text-align:center">
FROGGLE uses <strong>Gamepad with Joystick Trackpad</strong> template as a base. Here's how to set it up in Steam.
</p>
</div>

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">▸ Quick Setup (Recommended)</h3>
<div style="padding:0.75rem;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:1rem">
<ol style="margin:0;padding-left:1.25rem;color:#e5e7eb;font-size:0.85rem;line-height:1.8">
<li>Open Steam and navigate to your game in the Library</li>
<li>Click the <strong>controller icon</strong> or go to <strong>Properties → Controller</strong></li>
<li>Select <strong>"Gamepad with Joystick Trackpad"</strong> as the template</li>
<li>The default mappings should work perfectly!</li>
</ol>
</div>

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">▸ Custom Configuration</h3>
<div style="padding:0.75rem;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:1rem">
<p style="margin:0 0 0.75rem 0;color:#c7d5e0;font-size:0.85rem">
If you want to customize, here's the expected mapping:
</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.8rem">
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">Left Stick</strong><br/>
<span style="color:#e5e7eb">Joystick Move (axes 0,1)</span>
</div>
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">Right Stick</strong><br/>
<span style="color:#e5e7eb">Joystick Move (axes 2,3)</span>
</div>
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">D-Pad</strong><br/>
<span style="color:#e5e7eb">D-Pad buttons (12-15)</span>
</div>
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">Face Buttons</strong><br/>
<span style="color:#e5e7eb">A(0) B(1) X(2) Y(3)</span>
</div>
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">Bumpers</strong><br/>
<span style="color:#e5e7eb">LB(4) RB(5)</span>
</div>
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">Triggers</strong><br/>
<span style="color:#e5e7eb">LT(6) RT(7)</span>
</div>
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">Select/Back</strong><br/>
<span style="color:#e5e7eb">Button 8</span>
</div>
<div style="padding:0.4rem;background:rgba(102,192,244,0.1);border-radius:4px">
<strong style="color:#66c0f4">Start/Menu</strong><br/>
<span style="color:#e5e7eb">Button 9</span>
</div>
</div>
</div>

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">Steam Deck Gaming Mode</h3>
<div style="padding:0.75rem;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:1rem">
<p style="margin:0;color:#e5e7eb;font-size:0.85rem;line-height:1.6">
On Steam Deck, the built-in controls should work automatically. If not:
</p>
<ol style="margin:0.5rem 0 0 0;padding-left:1.25rem;color:#c7d5e0;font-size:0.85rem;line-height:1.8">
<li>Press the <strong>Steam button</strong> while in-game</li>
<li>Select <strong>Controller Settings</strong></li>
<li>Choose <strong>Gamepad with Joystick Trackpad</strong></li>
<li>Optionally map L4/R4 paddles to X for quick auto-targeting!</li>
</ol>
</div>

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">Electron / Desktop App</h3>
<div style="padding:0.75rem;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:1rem">
<p style="margin:0;color:#e5e7eb;font-size:0.85rem;line-height:1.6">
When packaging with Electron for Steam:
</p>
<ol style="margin:0.5rem 0 0 0;padding-left:1.25rem;color:#c7d5e0;font-size:0.85rem;line-height:1.8">
<li>Add the game to Steam as a <strong>Non-Steam Game</strong></li>
<li>Enable <strong>Steam Input</strong> in the controller settings</li>
<li>Select <strong>Gamepad with Joystick Trackpad</strong> template</li>
<li>For Steamworks integration, use the <a href="https://partner.steamgames.com/doc/features/steam_controller" style="color:#66c0f4" target="_blank">Steam Input API</a></li>
</ol>
</div>

<div style="margin-top:1rem;padding:0.75rem;background:rgba(245,158,11,0.15);border:2px solid #f59e0b;border-radius:8px">
<p style="margin:0;color:#fcd34d;font-size:0.85rem">
The game also supports keyboard fallback. If controller input isn't detected, you can use Arrow Keys, WASD, Q/E/Z/C, and Enter/Escape to play!<br><br><em style="font-size:0.85em;opacity:0.9">(Tip: This works great for Steam Deck users who prefer touch controls!)</em>
</p>
</div>

<button class="btn" onclick="showControlsGuide()" style="margin-top:1rem;background:#6366f1">← Back to Controls</button>
<button class="btn" onclick="closeControlsGuide()" style="margin-top:0.5rem;background:#888">Close</button>
</div>
<div class="modal-overlay" onclick="closeControlsGuide()"></div>
`;

v.insertAdjacentHTML('beforeend', html);
}

function showFAQ() {
const v = document.getElementById('gameView');

const faqItems = [
{
q: "What are sigils?",
a: `Sigils are your heroes' special abilities! Each hero has sigils they can use in combat to attack enemies, defend the team, or perform special actions.<br><br>
<strong>Basic Sigils:</strong><br>
• <strong>Attack</strong> - Deal damage to enemies<br>
• <strong>Shield</strong> - Protect heroes from damage<br>
• <strong>Heal</strong> - Restore HP to heroes<br>
• <strong>D20</strong> - Roll the dice for powerful gambit actions (not guaranteed to succeed)<br><br>
You can see your sigils at the bottom of your hero card during combat. Hover / long-press any sigil icon to see what it does!`
},
{
q: "How do I level up sigils?",
a: `There are two ways to upgrade sigils:<br><br>
<strong>1. Level-Up Menu (Odd Floors - 1, 3, 5...)</strong><br>
• Spend XP earned from battles<br>
• Choose to upgrade a sigil, boost stats, or add new sigils<br>
• These upgrades reset when you die<br><br>
<strong>2. Shop (Even Floors - 2, 4, 6...)</strong><br>
• Spend Gold<br>
• Permanently upgrade sigils that persist across all runs<br>
• This is your long-term progression!<br><br>
Your total sigil level = Permanent (Gold) + Temporary (XP) upgrades.`
},
{
q: "Why does Attack show as L1 when I haven't upgraded it?",
a: `Active sigils (${sigilText('Attack')}, ${sigilText('Shield')}, ${sigilText('Heal')}, ${sigilText('Grapple')}, ${sigilText('Ghost')}, ${sigilText('D20')}, ${sigilText('Alpha')}) always display with a minimum level of 1 when equipped, even if their permanent storage level is 0. This is because they work at "Level 1" effectiveness when you first get them.<br><br>
<strong>Example:</strong> ${sigilText('Attack')} storage level 0 = displays as L1 (1 attack per action)<br>
${sigilText('Attack')} storage level 1 = displays as L2 (2 attacks per action)<br><br>
The upgrade cost is based on <em>storage level</em>, not display level. So upgrading from display L1 to L2 costs the price for storage level 0→1.`
},
{
q: "What happens if I run out of enemies before using all my Expand targets?",
a: `If you have ${sigilText('Expand')} and select targets for multi-instance actions (${sigilText('Attack')}, ${sigilText('Shield')}, ${sigilText('Heal')}), you might run out of valid targets mid-instance. When this happens, you'll see a "wasted targets" message.<br><br>
<strong>Example:</strong> You have ${sigilText('Attack')} L2 with ${sigilText('Expand')} L1 (3 total targets). There are only 2 enemies left. You can attack both enemies, but the 3rd target slot is wasted - you still get both attacks, but you can't use the extra ${sigilText('Expand')} slot.<br><br>
This is intentional! Plan your actions carefully.`
},
{
q: "How does Last Stand work and how long does it last?",
a: `When a hero reaches 0 HP (and has no ${sigilText('Ghost')} charges), they enter <strong>Last Stand</strong> instead of dying immediately. In Last Stand:<br><br>
• They can ONLY use ${sigilText('D20')} gambits (no other actions)<br>
• Each turn in Last Stand increases ${sigilText('D20')} difficulty by +2 DC<br>
• CONFUSE caps at DC 20; other gambits keep climbing<br>
• If healed, they revive with the healed HP amount<br><br>
<strong>Last Stand Turn counter (CONFUSE example):</strong><br>
Turn 1: DC +0 (CONFUSE is DC 10)<br>
Turn 2: DC +2 (CONFUSE is DC 12)<br>
Turn 3: DC +4 (CONFUSE is DC 14)<br>
Turn 4: DC +6 (CONFUSE is DC 16)<br>
Turn 5: DC +8 (CONFUSE is DC 18)<br>
Turn 6: DC +10 (CONFUSE is DC 20 - nat 20 required!)<br><br>
You have a few turns to heal your Last Stand heroes before DCs become impossible!`
},
{
q: "How do Grapple and stun work?",
a: `${sigilText('Grapple')} stuns a target for a number of turns equal to the ${sigilText('Grapple')} level (L1 = 1 turn, L2 = 2 turns, etc.). The user takes recoil damage equal to the target's POW.<br><br>
<strong>Stun rules (same for everyone):</strong><br>
• Stun never stacks. If a target is already stunned for 2 turns and gets stunned for 1, nothing changes<br>
• A new stun only takes effect if its duration exceeds the remaining stun<br>
• Stunned units skip their action but still progress (enemies draw sigils, rage cycles, etc.)<br>
• All stun counters decrement at the end of each enemy turn<br><br>
<strong>Sources of stun:</strong><br>
• Player ${sigilText('Grapple')}: stun for ${sigilText('Grapple')} level turns<br>
• ${sigilText('D20')} STARTLE: stun for 1 turn<br>
• Enemy ${sigilText('Grapple')}: stun for sigil level turns<br>
• Floor 11 Ambush: all heroes stunned for 1 turn`
},
{
q: "How many recruits can I have? What happens to them?",
a: `Recruits are enemies you've converted to your side via ${sigilText('D20')} RECRUIT (DC 20):<br><br>
• Each hero can have <strong>1 recruit</strong> (recruiting another replaces the first)<br>
• Recruits persist between battles until killed<br>
• Recruits fight in their hero's lane and attack enemies<br>
• Recruits can gain sigils and act during enemy turns<br><br>
<strong>How they work:</strong> Recruits stand behind their hero and attack enemies during the "Recruit Phase" of the enemy turn. They're powerful allies but can die permanently!`
},
{
q: "Do shields carry over between battles?",
a: `<strong>Yes!</strong> Shields persist between battles and cap at max HP.<br><br>
This means you can "shield farm" by using ${sigilText('Shield')} sigils on the last enemy of a floor to enter the next floor with full shields. Combined with ${sigilText('Asterisk')} or ${sigilText('Alpha')}, this can make you nearly invincible!<br><br>
<br><em style="font-size:0.9em;opacity:0.9">(Strategy tip: Before finishing a floor, use any remaining actions to shield up your team!)</em>`
},
{
q: "What's the difference between XP upgrades and Gold upgrades?",
a: `There are TWO types of sigil upgrades:<br><br>
<strong>1. Permanent (Gold) Upgrades</strong><br>
• Purchased at the Death Screen after dying<br>
• Persist through death and across all runs<br>
• These are your long-term progression!<br><br>
<strong>2. Temporary (XP) Upgrades</strong><br>
• Purchased during Level Ups (after combat)<br>
• Reset when you die or start a new run<br>
• These boost you during a single run only<br><br>
<strong>Your displayed sigil level = Permanent + Temporary upgrades combined</strong>`
},
{
q: "What are Star and Asterisk sigils?",
a: `<strong>${sigilText('Star')}:</strong> Passive XP multiplier. Each hero with ${sigilText('Star')} adds +0.5× XP bonus per ${sigilText('Star')} level.<br>
• 2 heroes with ${sigilText('Star')} L1 = +1.0× bonus = 2× total XP<br>
• ${sigilText('Star')} is extremely powerful for long-term scaling!<br><br>
<strong>${sigilText('Asterisk')}:</strong> PASSIVE - Next action triggers +X times! Resets after each battle.<br>
• ${sigilText('Asterisk')} L1: First action triggers ×2<br>
• ${sigilText('Asterisk')} L4: First action triggers ×5<br>
• Works with ANY action: ${sigilText('Attack')}, ${sigilText('Shield')}, ${sigilText('Heal')}, ${sigilText('D20')} gambits, etc.<br>
• No activation needed - happens automatically on your first action<br>
• Can be combined with ${sigilText('Alpha')} for devastating combos!`
}
];

let html = `
<div class="modal-container faq">
<h2 class="modal-title orange">? Frequently Asked Questions</h2>

<div style="background:rgba(147,51,234,0.1);border:2px solid #9333ea;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
<h3 style="text-align:center;font-size:1.2rem;margin:0 0 0.5rem 0;color:#9333ea">FROGGLE</h3>
<p style="text-align:center;font-size:0.95rem;line-height:1.5;margin-bottom:1rem">Use XP to gain and upgrade powerful sigils. Chase Tapo through a portal torn open by the Flydra! On death, you'll have a chance to spend the gold you've earned to make your heroes permanently stronger!</p>

<div style="background:white;border-radius:8px;padding:1rem;margin-top:1rem;color:#1a1a1a">
<h4 style="color:#2c63c7;margin:0 0 0.75rem 0;font-size:1rem">HOW LEVEL-UPS WORK</h4>
<p style="font-size:0.9rem;margin:0 0 0.5rem 0">After combat, you can spend XP in 3 ways:</p>

<div style="margin-left:1rem;font-size:0.9rem;line-height:1.6">
<p style="margin:0.5rem 0"><strong>1. UPGRADE A SIGIL</strong> (makes it stronger everywhere!)</p>
<div style="margin-left:1rem;margin-bottom:0.75rem">
<p style="margin:0.25rem 0"><strong style="color:#9333ea">Passive Sigils</strong> (Expand, Asterisk, Star):</p>
<ul style="margin:0.25rem 0;padding-left:1.5rem">
<li>Start at Level 0 (inactive)</li>
<li>Spend XP to upgrade to Level 1 to activate for ALL heroes automatically</li>
<li>Work automatically in battle - no action needed</li>
</ul>
<p style="margin:0.5rem 0 0.25rem 0"><strong style="color:#2c63c7">Active Sigils</strong> (Attack, Shield, Heal, D20, etc.):</p>
<ul style="margin:0.25rem 0;padding-left:1.5rem">
<li>Start at Level 1 effectiveness</li>
<li>Upgrading makes them stronger on every hero who has them</li>
<li>Example: Attack L1→L2 means attack twice instead of once!</li>
</ul>
</div>

<p style="margin:0.5rem 0"><strong>2. ADD A SIGIL TO A HERO</strong></p>
<ul style="margin:0.25rem 0 0.75rem 1.5rem;padding-left:1.5rem">
<li>All heroes can learn any sigil by spending XP!</li>
<li>Active sigils use your hero's 1 action per turn</li>
<li>Choose abilities that complement your strategy</li>
</ul>

<p style="margin:0.5rem 0"><strong>3. UPGRADE HERO STATS</strong></p>
<ul style="margin:0.25rem 0;padding-left:1.5rem">
<li>Spend XP for +1 POW (increases damage/healing/shields)</li>
<li>Spend XP for +5 Max HP (and heal if in Last Stand)</li>
</ul>
</div>
</div>

<div style="background:rgba(34,197,94,0.1);border:2px solid #22c55e;border-radius:8px;padding:1rem;margin-top:1rem">
<h4 style="color:#15803d;margin:0 0 0.5rem 0;font-size:0.95rem">▸ PRO TIPS</h4>
<ul style="margin:0;padding-left:1.5rem;font-size:0.85rem;line-height:1.5">
<li><strong>Mage & Healer Start Stronger:</strong> They get +1 Expand built-in, so their actions hit 1 extra target from the start!</li>
<li><strong>Shields Persist:</strong> Before winning a battle, use remaining actions to shield your team - they carry over to the next fight!</li>
<li><strong>D20 Gambits:</strong> Higher D20 sigil levels = better success rates. Hover over D20 in battle to see all 5 effects and their difficulty.</li>
</ul>
</div>
</div>

<p style="text-align:center;font-size:0.85rem;opacity:0.7;margin-bottom:1.5rem">Tap a question below to expand/collapse the answer</p>
<div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem">
`;

faqItems.forEach((item, index) => {
html += `
<div style="background:white;border:3px solid #000;border-radius:12px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.15)">
<div onclick="toggleFAQItem(${index})" style="padding:1rem;cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg, #f0f9ff, #e0f2fe);transition:background 0.2s">
<strong style="font-size:0.95rem;color:#1e40af">${item.q}</strong>
<span id="faq-arrow-${index}" style="font-size:1.2rem;transition:transform 0.3s;color:#1e40af">▼</span>
</div>
<div id="faq-answer-${index}" style="display:none;padding:1rem;font-size:0.9rem;line-height:1.6;border-top:2px solid #ddd;background:rgba(0,0,0,0.02);color:#1a1a1a">
${item.a}
</div>
</div>
`;
});

html += `
</div>
<button class="btn secondary" onclick="closeFAQ()" style="margin-top:0.5rem">Close</button>
</div>
<div class="modal-overlay" onclick="closeFAQ()"></div>
`;

v.insertAdjacentHTML('beforeend', html);
}

function toggleFAQItem(index) {
const answer = document.getElementById(`faq-answer-${index}`);
const arrow = document.getElementById(`faq-arrow-${index}`);

if (answer.style.display === 'none') {
answer.style.display = 'block';
arrow.style.transform = 'rotate(180deg)';
arrow.textContent = '▲';
} else {
answer.style.display = 'none';
arrow.style.transform = 'rotate(0deg)';
arrow.textContent = '▼';
}
}

function closeFAQ() {
const overlays = document.querySelectorAll('.modal-container.faq, .modal-overlay');
overlays.forEach(el => el.remove());
}

function showSigilarium() {
closeSettingsMenu();
const v = document.getElementById('gameView');
const coreSigils = ['Attack', 'Shield', 'Heal', 'D20'];
const advancedSigils = ['Ghost', 'Alpha', 'Grapple'];
const passiveSigils = ['Expand', 'Asterisk', 'Star'];

const getLevelColor = (level) => {
if(level === 0) return '#94a3b8';
if(level === 1) return '#c0c0c0';
if(level === 2) return '#06b6d4';
if(level === 3) return '#9333ea';
if(level === 4) return '#d97706';
return '#ff0080'; // L5 gradient
};

let html = `
<div class="modal-container light">
<h2 class="modal-title purple">✦ SIGILARIUM ✦</h2>
<p style="text-align:center;font-size:0.9rem;opacity:0.8;margin-bottom:1.5rem">All Sigils and Their Permanent Upgrade Levels</p>

<!-- Core Sigils -->
<h3 style="color:#2c63c7;margin-bottom:0.75rem;font-size:1rem;border-bottom:2px solid #2c63c7;padding-bottom:0.25rem">※ Core Sigils</h3>
<div style="display:grid;gap:0.75rem;margin-bottom:1.5rem">
`;

coreSigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const displayLevel = permLevel + 1; // Actives display +1 higher (perm 0 = L1)
const cl = permLevel===0?'l1':permLevel===1?'l2':permLevel===2?'l3':permLevel===3?'l4':permLevel===4?'l5':'l5';
const desc = SIGIL_DESCRIPTIONS[sig] || 'No description available';
const levelColor = getLevelColor(displayLevel);

html += `
<div style="background:#d4c9a8;border:2px solid #8b7355;border-radius:8px;padding:1rem">
<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
<span class="sigil ${cl}" style="font-size:1.2rem;padding:8px 12px">${sigilIconOnly(sig)}</span>
<div>
<div style="font-weight:bold;font-size:1.1rem;color:#2a1f0e">${sig}</div>
<div style="font-size:0.85rem">Level: <span style="color:${levelColor};font-weight:bold">L${displayLevel}</span></div>
</div>
</div>
<div style="font-size:0.9rem;line-height:1.4;color:#4a3728">${desc}</div>
</div>
`;
});

html += `
</div>

<!-- Advanced Sigils -->
<h3 style="color:#f97316;margin-bottom:0.75rem;font-size:1rem;border-bottom:2px solid #f97316;padding-bottom:0.25rem">† Advanced Sigils</h3>
<div style="display:grid;gap:0.75rem;margin-bottom:1.5rem">
`;

advancedSigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const displayLevel = permLevel + 1; // Actives display +1 higher (perm 0 = L1)
const cl = permLevel===0?'l1':permLevel===1?'l2':permLevel===2?'l3':permLevel===3?'l4':permLevel===4?'l5':'l5';
const desc = SIGIL_DESCRIPTIONS[sig] || 'No description available';
const levelColor = getLevelColor(displayLevel);

html += `
<div style="background:#d4c9a8;border:2px solid #8b7355;border-radius:8px;padding:1rem">
<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
<span class="sigil ${cl}" style="font-size:1.2rem;padding:8px 12px">${sigilIconOnly(sig)}</span>
<div>
<div style="font-weight:bold;font-size:1.1rem;color:#2a1f0e">${sig}</div>
<div style="font-size:0.85rem">Level: <span style="color:${levelColor};font-weight:bold">L${displayLevel}</span></div>
</div>
</div>
<div style="font-size:0.9rem;line-height:1.4;color:#4a3728">${desc}</div>
</div>
`;
});

html += `
</div>

<!-- Passive Sigils -->
<h3 style="color:#9333ea;margin-bottom:0.75rem;font-size:1rem;border-bottom:2px solid #9333ea;padding-bottom:0.25rem">◇ Passive Sigils</h3>
<div style="display:grid;gap:0.75rem">
`;

passiveSigils.forEach(sig => {
const level = S.sig[sig] || 0;
const cl = level===0?'l0':level===1?'l1':level===2?'l2':level===3?'l3':level===4?'l4':'l5';
const desc = SIGIL_DESCRIPTIONS[sig] || 'No description available';
const levelColor = getLevelColor(level);

html += `
<div style="background:#d4c9a8;border:2px solid #8b7355;border-radius:8px;padding:1rem">
<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
<span class="sigil ${cl} passive" style="font-size:1.2rem;padding:8px 12px">${sigilIconOnly(sig)}</span>
<div>
<div style="font-weight:bold;font-size:1.1rem;color:#2a1f0e">${sig}</div>
<div style="font-size:0.85rem">Permanent Level: <span style="color:${levelColor};font-weight:bold">L${level}</span></div>
</div>
</div>
<div style="font-size:0.9rem;line-height:1.4;color:#4a3728">${desc}</div>
</div>
`;
});

html += `
</div>
<button class="btn" onclick="closeSigilarium()" style="margin-top:1.5rem;background:#9333ea;width:100%">Close</button>
</div>
<div class="modal-overlay" onclick="closeSigilarium()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

function closeSigilarium() {
// Fix: Sigilarium uses .light class, not .dark - remove both to be safe
const menus = document.querySelectorAll('.modal-container.dark, .modal-container.light, .modal-overlay');
menus.forEach(m => m.remove());
}

function debugAddGold() {
S.gold += 100;
upd();
toast('Added 100 Gold!', 1200);
closeDebugMenu();
}

function debugAddXP() {
S.xp += 100;
upd();
toast('Added 100 XP!', 1200);
closeDebugMenu();
}

function debugPreviewNeutral() {
const select = document.getElementById('debugNeutralSelect');
const enc = select.value;
closeDebugMenu();
// Set up minimal state needed for neutral encounters
if(!S.heroes || S.heroes.length === 0) {
toast('Need active heroes to preview neutrals!', 1500);
return;
}
// Dispatch to encounter function directly
const dispatch = {
shopkeeper1: showShopkeeper1, shopkeeper2: showShopkeeper2,
wishingwell1: showWishingWell1, wishingwell2: showWishingWell2,
treasurechest1: showTreasureChest1, treasurechest2: showTreasureChest2,
wizard1: showWizard1, wizard2: showWizard2,
oracle1: showOracle1, oracle2: showOracle2,
encampment1: showEncampment1, encampment2: showEncampment2,
gambling1: showGambling1, gambling2: showGambling2,
ghost1: showGhost1, ghost2: showGhost2,
royal1: showRoyal1, royal2: showRoyal2
};
if(dispatch[enc]) {
toast(`Previewing: ${enc}`, 1200);
dispatch[enc]();
} else {
toast('Unknown encounter!', 1200);
}
}

function debugJumpFloor() {
const input = document.getElementById('debugFloorInput');
const targetFloor = parseInt(input.value);
if(targetFloor < 1 || targetFloor > 19 || isNaN(targetFloor)) {
toast('Invalid floor! Must be 1-19', 1200);
return;
}
closeDebugMenu();
S.floor = targetFloor;
upd();
startFloor(targetFloor);
toast(`Jumped to Floor ${targetFloor}!`, 1200);
}

function debugDealDamage() {
if(!S.enemies || S.enemies.length === 0) {
toast('No enemies in combat!', 1200);
return;
}
// Deal 50 damage to first enemy
const enemy = S.enemies[0];
enemy.h -= 50;
if(enemy.h < 0) enemy.h = 0;
upd();
toast(`Dealt 50 damage to ${getEnemyDisplayName(enemy)}!`, 1200);
closeDebugMenu();
// Check if combat is over
setTimeout(() => checkCombatEnd(), 100);
}

function debugSetSigilLevel() {
const sigilSelect = document.getElementById('debugSigilSelect');
const levelInput = document.getElementById('debugSigilLevel');
const sigil = sigilSelect.value;
const newLevel = parseInt(levelInput.value);

if(isNaN(newLevel) || newLevel < 0 || newLevel > 5) {
toast('Invalid level! Must be 0-5', 1200);
return;
}

S.sig[sigil] = newLevel;
savePermanent();
upd();
toast(`Set ${sigil} to Level ${newLevel}!`, 1200);
closeDebugMenu();
}

function debugSetHeroStats() {
const heroSelect = document.getElementById('debugHeroSelect');
const powInput = document.getElementById('debugHeroPOW');
const maxHPInput = document.getElementById('debugHeroMaxHP');
const heroIdx = parseInt(heroSelect.value);
const newPOW = parseInt(powInput.value);
const newMaxHP = parseInt(maxHPInput.value);

if(isNaN(newPOW) || newPOW < 1 || newPOW > 20) {
toast('Invalid POW! Must be 1-20', 1200);
return;
}
if(isNaN(newMaxHP) || newMaxHP < 1 || newMaxHP > 50) {
toast('Invalid Max HP! Must be 1-50', 1200);
return;
}

const hero = S.heroes[heroIdx];
hero.p = newPOW;
hero.m = newMaxHP;
// Also set current HP to max HP for convenience
hero.h = newMaxHP;
// Clear Last Stand if setting HP > 0
if(hero.ls && hero.h > 0) { hero.ls = false; hero.lst = 0; }
saveGame();
upd();
toast(`Updated ${hero.n}: POW=${newPOW}, HP=${newMaxHP}!`, 1200);
closeDebugMenu();
render();
}

function debugReviveFromLastStand() {
// Find heroes in Last Stand and revive them
const lastStandHeroes = S.heroes.filter(h => h.ls);
if(lastStandHeroes.length === 0) {
toast('No heroes in Last Stand!', 1200);
closeDebugMenu();
return;
}
lastStandHeroes.forEach(h => {
h.ls = false;
h.lst = 0;
h.h = Math.max(1, Math.floor(h.m / 2)); // Restore to 50% HP
});
saveGame();
upd();
toast(`Revived ${lastStandHeroes.length} hero(es) from Last Stand!`, 1500);
closeDebugMenu();
render();
}



// ===== FROGGLE CONTROLLER =====
// Supports both Gamepad API (desktop/native) and keyboard events (Steam Deck browser)
// Steam Deck in browser mode converts controller to keyboard - we handle both

const GamepadController = {
  // State
  active: false,
  focusedElement: null,
  focusableElements: [],
  lastFocusedId: null,

  // Gamepad state
  pollInterval: null,
  lastButtons: {},
  lastAxes: { lx: 0, ly: 0 },
  connected: false,

  // Steam Deck input interception detection
  connectTime: 0,
  firstInputTime: 0,
  inputDetectionShown: false,

  // Debounce tracking - prevents double-fire from keyboard events
  lastActionTime: {},
  DEBOUNCE_MS: 150,

  // Initialize controller system
  init() {
    debugLog('[CONTROLLER] Initializing...');

    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[CONTROLLER] Controller support disabled in settings');
      return;
    }

    // Keyboard always works (primary for Steam Deck browser mode)
    this.initKeyboard();
    this.initTouchDetection();

    // Gamepad API (works on desktop, native apps, some Steam configs)
    this.initGamepad();

    debugLog('[CONTROLLER] Initialization complete');
  },

  // Check debounce - returns true if action should be allowed
  shouldAllowAction(action) {
    const now = Date.now();
    const lastTime = this.lastActionTime[action] || 0;
    if (now - lastTime < this.DEBOUNCE_MS) {
      return false;
    }
    this.lastActionTime[action] = now;
    return true;
  },

  // Initialize Web Gamepad API
  initGamepad() {
    // Guard: Gamepad API may not be available in all Electron/browser configs
    if (!navigator.getGamepads) {
      debugLog('[CONTROLLER] Gamepad API not available');
      return;
    }

    // Store bound handlers for cleanup in destroy()
    this._onGamepadConnected = (e) => {
      try {
        debugLog('[CONTROLLER] Gamepad connected:', e.gamepad.id);
        this.connected = true;
        this.connectTime = Date.now();
        this.firstInputTime = 0;
        this.inputDetectionShown = false;
        this.activate();
        toast('Controller connected!', 2000);
        this.startPolling();
        this.startInputDetection();
      } catch(err) {
        console.warn('[CONTROLLER] Error in gamepad connect handler:', err);
      }
    };

    this._onGamepadDisconnected = (e) => {
      try {
        debugLog('[CONTROLLER] Gamepad disconnected:', e.gamepad.id);
        this.connected = false;
        var gamepads = navigator.getGamepads();
        var anyConnected = gamepads && Array.from(gamepads).some(function(gp) { return gp !== null; });
        if (!anyConnected) {
          this.stopPolling();
          this.deactivate();
        }
      } catch(err) {
        console.warn('[CONTROLLER] Error in gamepad disconnect handler:', err);
      }
    };

    window.addEventListener('gamepadconnected', this._onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected);

    // Check if gamepad already connected
    try {
      var gamepads = navigator.getGamepads();
      if (gamepads) {
        for (var i = 0; i < gamepads.length; i++) {
          if (gamepads[i]) {
            debugLog('[CONTROLLER] Gamepad already connected:', gamepads[i].id);
            this.connected = true;
            this.startPolling();
            break;
          }
        }
      }
    } catch(err) {
      console.warn('[CONTROLLER] Error checking existing gamepads:', err);
    }
  },

  startPolling() {
    if (this.pollInterval) return;
    debugLog('[CONTROLLER] Starting gamepad polling');
    this.pollInterval = setInterval(() => this.poll(), 16);
  },

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      debugLog('[CONTROLLER] Stopped gamepad polling');
    }
  },

  poll() {
    try {
    var gamepads = navigator.getGamepads();
    if (!gamepads) return;
    var gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (!gp) return;

    const prev = this.lastButtons;

    // Face buttons (debounced to match keyboard behavior)
    if (this.pressed(gp, 0) && !prev[0]) { this.markInputReceived(); if (this.shouldAllowAction('A')) this.handleA(); }
    if (this.pressed(gp, 1) && !prev[1]) { this.markInputReceived(); if (this.shouldAllowAction('B')) this.handleB(); }
    if (this.pressed(gp, 2) && !prev[2]) { this.markInputReceived(); if (this.shouldAllowAction('X')) this.handleX(); }
    if (this.pressed(gp, 3) && !prev[3]) { this.markInputReceived(); if (this.shouldAllowAction('Y')) this.handleY(); }

    // Shoulders
    if (this.pressed(gp, 4) && !prev[4]) { this.markInputReceived(); this.handleLB(); }
    if (this.pressed(gp, 5) && !prev[5]) { this.markInputReceived(); this.handleRB(); }

    // Triggers
    if (this.pressed(gp, 6) && !prev[6]) { this.markInputReceived(); this.handleLT(); }
    if (this.pressed(gp, 7) && !prev[7]) { this.markInputReceived(); this.handleRT(); }

    // Select/Start (debounced - these open menus)
    if (this.pressed(gp, 8) && !prev[8]) { this.markInputReceived(); if (this.shouldAllowAction('Select')) this.handleSelect(); }
    if (this.pressed(gp, 9) && !prev[9]) { this.markInputReceived(); if (this.shouldAllowAction('Start')) this.handleStart(); }

    // Stick clicks
    if (this.pressed(gp, 10) && !prev[10]) { this.markInputReceived(); this.handleL3(); }
    if (this.pressed(gp, 11) && !prev[11]) { this.markInputReceived(); this.handleR3(); }

    // D-pad
    if (this.pressed(gp, 12) && !prev[12]) { this.markInputReceived(); this.handleDirection('up'); }
    if (this.pressed(gp, 13) && !prev[13]) { this.markInputReceived(); this.handleDirection('down'); }
    if (this.pressed(gp, 14) && !prev[14]) { this.markInputReceived(); this.handleDirection('left'); }
    if (this.pressed(gp, 15) && !prev[15]) { this.markInputReceived(); this.handleDirection('right'); }

    // Analog sticks
    const deadzone = 0.3;
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const prevLx = this.lastAxes.lx;
    const prevLy = this.lastAxes.ly;

    if (lx < -deadzone && prevLx >= -deadzone) { this.markInputReceived(); this.handleDirection('left'); }
    if (lx > deadzone && prevLx <= deadzone) { this.markInputReceived(); this.handleDirection('right'); }
    if (ly < -deadzone && prevLy >= -deadzone) { this.markInputReceived(); this.handleDirection('up'); }
    if (ly > deadzone && prevLy <= deadzone) { this.markInputReceived(); this.handleDirection('down'); }

    // Right stick: smooth scrolling (more useful than duplicating left stick nav)
    const rx = gp.axes[2] || 0;
    const ry = gp.axes[3] || 0;

    if (Math.abs(ry) > deadzone) {
      this.markInputReceived();
      this.scrollSmooth(ry);
    }

    // Save state
    this.lastButtons = {};
    for (var i = 0; i < gp.buttons.length; i++) {
      this.lastButtons[i] = this.pressed(gp, i);
    }
    this.lastAxes = { lx: lx, ly: ly };
    } catch(err) {
      // Silently handle poll errors to prevent error spam at 60fps
      if (!this._pollErrorLogged) {
        console.warn('[CONTROLLER] Poll error:', err);
        this._pollErrorLogged = true;
      }
    }
  },

  pressed(gp, index) {
    const btn = gp.buttons[index];
    if (!btn) return false;
    return typeof btn === 'object' ? btn.pressed : btn > 0.5;
  },

  markInputReceived() {
    if (!this.firstInputTime && this.connectTime) {
      this.firstInputTime = Date.now();
      debugLog('[CONTROLLER] First input received after', this.firstInputTime - this.connectTime, 'ms');
    }
  },

  startInputDetection() {
    this._inputDetectionTimeout = setTimeout(() => {
      this._inputDetectionTimeout = null;
      if (this.connected && !this.firstInputTime && !this.inputDetectionShown) {
        this.inputDetectionShown = true;
        this.showSteamDeckWarning();
      }
    }, 5000);
  },

  showSteamDeckWarning() {
    debugLog('[CONTROLLER] No input detected - possible Steam interception');
    const isSteamDeck = navigator.userAgent.includes('Linux') ||
                        (typeof window.electronInfo !== 'undefined');

    if (isSteamDeck) {
      toast('Controller not responding? Try keyboard mode or check Steam settings', 4000);
      this._steamDeckHelpTimeout = setTimeout(() => {
        this._steamDeckHelpTimeout = null;
        if (!this.firstInputTime && typeof showSteamDeckHelp === 'function') {
          showSteamDeckHelp();
        }
      }, 2000);
    }
  },

  initTouchDetection() {
    this._onTouchStart = () => {
      if (this.active) {
        debugLog('[CONTROLLER] Touch detected, deactivating controller mode');
        this.deactivate();
      }
    };
    document.addEventListener('touchstart', this._onTouchStart, { passive: true });

    // Mouse movement deactivates controller mode (restores cursor)
    this._onMouseMove = () => {
      if (this.active) {
        debugLog('[CONTROLLER] Mouse detected, deactivating controller mode');
        this.deactivate();
      }
    };
    document.addEventListener('mousemove', this._onMouseMove, { passive: true });
  },

  // Keyboard handler - primary input for Steam Deck browser mode
  initKeyboard() {
    this._onKeyDown = e => {
      if (typeof S !== 'undefined' && S.controllerDisabled) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ignore key repeat (holding button down causes spam)
      if (e.repeat) return;

      let handled = false;

      switch (e.key) {
        // D-pad / Arrow keys
        case 'ArrowUp':
          this.handleDirection('up');
          handled = true;
          break;
        case 'ArrowDown':
          this.handleDirection('down');
          handled = true;
          break;
        case 'ArrowLeft':
          this.handleDirection('left');
          handled = true;
          break;
        case 'ArrowRight':
          this.handleDirection('right');
          handled = true;
          break;

        // A button - Enter (with debounce to prevent double-fire)
        case 'Enter':
          if (this.shouldAllowAction('A')) {
            this.handleA();
          }
          handled = true;
          break;

        // Space also triggers A (debounced together with Enter)
        case ' ':
          if (this.shouldAllowAction('A')) {
            this.handleA();
          }
          handled = true;
          break;

        // B button - Escape OR Backspace (Steam browser template uses Backspace)
        // Note: Escape/Backspace should NOT activate controller mode (common desktop keys)
        case 'Escape':
        case 'Backspace':
          if (this.shouldAllowAction('B')) {
            this.handleB();
          }
          e.preventDefault();
          break;

        // Tab for navigation
        case 'Tab':
          this.handleDirection(e.shiftKey ? 'left' : 'right');
          handled = true;
          break;

        // Bumpers often map to PageUp/PageDown in browser templates
        case 'PageUp':
          this.handleLB();
          handled = true;
          break;
        case 'PageDown':
          this.handleRB();
          handled = true;
          break;

        // Some Steam configs send letter keys for face buttons
        case 'x':
        case 'X':
          if (this.shouldAllowAction('X')) {
            this.handleX();
          }
          handled = true;
          break;
        case 'y':
        case 'Y':
          if (this.shouldAllowAction('Y')) {
            this.handleY();
          }
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        if (!this.active) this.activate();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
  },

  // Activate controller mode (show focus ring)
  activate() {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('controller-active');
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      const best = this.findBestDefaultFocus();
      this.setFocus(best || this.focusableElements[0]);
    }
    debugLog('[CONTROLLER] Activated');
  },

  deactivate() {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('controller-active');
    this.clearFocus();
    debugLog('[CONTROLLER] Deactivated');
  },

  // ===== CONTEXT DETECTION =====

  getContext() {
    const tutorialModal = document.querySelector('.tutorial-modal-backdrop');
    if (tutorialModal && getComputedStyle(tutorialModal).display !== 'none') return 'tutorial';

    const confirmModal = document.querySelector('.confirm-modal');
    if (confirmModal && getComputedStyle(confirmModal).display !== 'none') return 'confirm';

    if (typeof S !== 'undefined' && S.suspended) return 'suspend';

    const modal = document.querySelector('.modal-container');
    if (modal && getComputedStyle(modal).display !== 'none') return 'modal';

    if (typeof S !== 'undefined' && S.heroes?.length > 0 && S.enemies?.length > 0 && S.turn === 'player') {
      return S.pending ? 'targeting' : 'combat';
    }

    return 'menu';
  },

  // ===== BUTTON HANDLERS =====

  handleA() {
    if (!this.active) this.activate();
    this.playClick();

    const ctx = this.getContext();

    if (ctx === 'tutorial') {
      const btn = document.querySelector('.tutorial-modal button, .tutorial-modal .btn');
      if (btn) btn.click();
      return;
    }

    if (ctx === 'confirm') {
      // Click focused button if one exists, otherwise default to Yes
      if (this.focusedElement && document.body.contains(this.focusedElement) && this.focusedElement.closest('.confirm-modal')) {
        this.focusedElement.click();
      } else {
        const btn = document.querySelector('.confirm-btn-yes');
        if (btn) btn.click();
      }
      return;
    }

    if (ctx === 'suspend') {
      if (typeof resumeGame === 'function') resumeGame();
      return;
    }

    // Cooldown after tutorial dismiss to prevent click-through
    if (window.tutorialDismissTime && Date.now() - window.tutorialDismissTime < 300) return;

    // Try focused element first
    if (this.focusedElement && document.body.contains(this.focusedElement)) {
      if (this.focusedElement.hasAttribute('onclick')) {
        this.focusedElement.click();
        return;
      }
      const clickable = this.focusedElement.querySelector('[onclick], button, .btn');
      if (clickable) {
        clickable.click();
        return;
      }
      this.focusedElement.click();
      return;
    }

    // No focused element - find the most prominent clickable thing
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      const best = this.findBestDefaultFocus();
      if (best) {
        this.setFocus(best);
        best.click();
        return;
      }
    }

    // Last resort
    const anyBtn = document.querySelector('.btn:not([disabled]), button:not([disabled])');
    if (anyBtn) {
      anyBtn.click();
    }
  },

  handleB() {
    if (!this.active) this.activate();
    this.playClick();

    const ctx = this.getContext();

    if (ctx === 'confirm') {
      const btn = document.querySelector('.confirm-btn-no');
      if (btn) btn.click();
      return;
    }

    if (ctx === 'modal') {
      const backBtn = document.querySelector('.settings-back-btn, .modal-close, [onclick*="close"]');
      if (backBtn) {
        backBtn.click();
        return;
      }
      if (typeof closeSettingsMenu === 'function') {
        closeSettingsMenu();
        return;
      }
    }

    if (ctx === 'targeting' && typeof S !== 'undefined') {
      if (typeof cancelAction === 'function') {
        cancelAction();
      } else {
        S.pending = null;
        S.targets = [];
        S.currentInstanceTargets = [];
        S.instancesRemaining = 0;
        S.totalInstances = 0;
        if (typeof render === 'function') render();
      }
      return;
    }

    // Try to find a back/cancel button
    const backBtn = document.querySelector(
      '.back-btn, [onclick*="back"], [onclick*="Back"], ' +
      '[onclick*="close"], [onclick*="Close"], ' +
      '[onclick*="cancel"], [onclick*="Cancel"], ' +
      '.modal-close, .settings-back-btn'
    );
    if (backBtn) {
      backBtn.click();
      return;
    }

    // Close any overlay
    const overlay = document.querySelector('.modal-overlay, .tutorial-modal-backdrop');
    if (overlay) {
      overlay.click();
    }
  },

  handleX() {
    if (!this.active) this.activate();
    this.playClick();

    const ctx = this.getContext();

    // In combat: use sigil and auto-target
    if (ctx === 'combat' || ctx === 'targeting') {
      if (this.focusedElement && document.body.contains(this.focusedElement)) {
        const sigil = this.focusedElement.classList?.contains('sigil')
          ? this.focusedElement
          : this.focusedElement.querySelector('.sigil.clickable');

        if (sigil && sigil.hasAttribute('onclick')) {
          sigil.click();
          setTimeout(() => this.autoTarget(), 50);
          return;
        }
      }
      this.autoTarget();
      return;
    }

    // Outside combat: X acts like A
    this.handleA();
  },

  handleY() {
    if (!this.active) this.activate();
    this.playClick();

    // Show sigil tooltip if focused
    if (this.focusedElement && document.body.contains(this.focusedElement)) {
      const sigil = this.focusedElement.classList?.contains('sigil')
        ? this.focusedElement
        : this.focusedElement.querySelector('.sigil');

      if (sigil && typeof showTooltip === 'function') {
        const name = sigil.dataset?.sigil || sigil.textContent?.trim();
        const level = parseInt(sigil.dataset?.level) || 0;
        showTooltip(name, sigil, level);
        return;
      }
    }

    // No sigil: show controls guide
    if (typeof showControlsGuide === 'function') {
      showControlsGuide();
    }
  },

  handleLB() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleUnit('prev');
    } else {
      this.scrollPage('up');
    }
  },

  handleRB() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleUnit('next');
    } else {
      this.scrollPage('down');
    }
  },

  handleLT() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleSigil('prev');
    } else {
      this.scrollPage('up');
    }
  },

  handleRT() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleSigil('next');
    } else {
      this.scrollPage('down');
    }
  },

  handleSelect() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();

    if (ctx === 'targeting') {
      const enemies = document.querySelectorAll('.card.enemy:not(.dead)');
      const heroes = document.querySelectorAll('.card.hero:not(.dead)');

      if (this.focusedElement?.classList.contains('enemy') && heroes.length) {
        this.setFocus(heroes[0]);
      } else if (enemies.length) {
        this.setFocus(enemies[0]);
      }
    } else if (ctx === 'combat') {
      const activeHero = document.querySelector('.card.hero.active');
      if (activeHero) {
        const sigil = activeHero.querySelector('.sigil.clickable');
        if (sigil) {
          this.setFocus(sigil);
        }
      }
    } else {
      const primary = document.querySelector('.title-play-btn, .btn-primary, .btn:first-of-type');
      if (primary) {
        this.setFocus(primary);
      }
    }
  },

  handleStart() {
    if (!this.active) this.activate();
    this.playClick();
    // Don't stack multiple settings menus
    const existingMenu = document.querySelector('.modal-container.dark');
    if (existingMenu) {
      if (typeof closeSettingsMenu === 'function') closeSettingsMenu();
      return;
    }
    if (typeof showSettingsMenu === 'function') {
      showSettingsMenu();
    }
  },

  handleL3() {
    if (!this.active) this.activate();
    this.playClick();
    if (typeof showControlsGuide === 'function') {
      showControlsGuide();
    }
  },

  handleR3() {
    if (!this.active) this.activate();
    this.playClick();
    if (typeof showControllerDebug === 'function') {
      const existing = document.getElementById('controller-debug-overlay');
      if (existing) {
        existing.remove();
      } else {
        showControllerDebug();
      }
    }
  },

  handleDirection(dir) {
    if (!this.active) {
      this.activate();
    }

    const ctx = this.getContext();

    if (ctx === 'tutorial' || ctx === 'suspend') return;

    if (ctx === 'confirm') {
      const yes = document.querySelector('.confirm-btn-yes');
      const no = document.querySelector('.confirm-btn-no');
      if (this.focusedElement === yes) {
        this.setFocus(no);
      } else {
        this.setFocus(yes);
      }
      this.playClick();
      return;
    }

    this.playClick();
    this.navigate(dir);
  },

  // ===== NAVIGATION =====

  navigate(dir) {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    if (!this.focusedElement || !document.body.contains(this.focusedElement)) {
      this.setFocus(this.focusableElements[0]);
      return;
    }

    const current = this.focusedElement.getBoundingClientRect();
    const cx = current.left + current.width / 2;
    const cy = current.top + current.height / 2;

    let best = null;
    let bestScore = Infinity;

    for (const el of this.focusableElements) {
      if (el === this.focusedElement) continue;

      const rect = el.getBoundingClientRect();
      const ex = rect.left + rect.width / 2;
      const ey = rect.top + rect.height / 2;

      const dx = ex - cx;
      const dy = ey - cy;

      let inDirection = false;
      switch (dir) {
        case 'up': inDirection = dy < -10; break;
        case 'down': inDirection = dy > 10; break;
        case 'left': inDirection = dx < -10; break;
        case 'right': inDirection = dx > 10; break;
      }

      if (!inDirection) continue;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const perpDist = (dir === 'up' || dir === 'down') ? Math.abs(dx) : Math.abs(dy);
      const score = dist + perpDist * 2;

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }

    if (best) {
      this.setFocus(best);
    } else {
      // Wrap around: if no element found in direction, pick the furthest element
      // in the opposite direction (wraps focus to the other side of the screen)
      let wrapBest = null;
      let wrapScore = -Infinity;
      for (const el of this.focusableElements) {
        if (el === this.focusedElement) continue;
        const rect = el.getBoundingClientRect();
        const ex = rect.left + rect.width / 2;
        const ey = rect.top + rect.height / 2;
        let score;
        switch (dir) {
          case 'up': score = ey; break;     // Furthest down
          case 'down': score = -ey; break;  // Furthest up
          case 'left': score = ex; break;   // Furthest right
          case 'right': score = -ex; break; // Furthest left
        }
        if (score > wrapScore) {
          wrapScore = score;
          wrapBest = el;
        }
      }
      if (wrapBest) this.setFocus(wrapBest);
    }
  },

  // ===== FOCUS MANAGEMENT =====

  // Save focus state before DOM updates (called from render())
  saveFocusState() {
    this._savedFocusId = this.focusedElement?.id || null;
    this._savedFocusClasses = this.focusedElement ?
      Array.from(this.focusedElement.classList).filter(c => c !== 'controller-focus').join('.') : null;
    this._savedFocusTag = this.focusedElement?.tagName || null;
    this._savedFocusText = this.focusedElement?.textContent?.trim()?.substring(0, 30) || null;
  },

  // Restore focus state after DOM updates (called from render())
  restoreFocusState() {
    if (!this.active) return;

    // Try to find element by ID first (most reliable)
    if (this._savedFocusId) {
      const el = document.getElementById(this._savedFocusId);
      if (el) {
        this.updateFocusableElements();
        this.setFocus(el);
        return;
      }
    }

    // Try to find by class combination (for cards, sigils, etc.)
    if (this._savedFocusClasses && this._savedFocusTag) {
      const selector = this._savedFocusTag.toLowerCase() + '.' + this._savedFocusClasses.split('.').join('.');
      try {
        const candidates = document.querySelectorAll(selector);
        if (candidates.length === 1) {
          this.updateFocusableElements();
          this.setFocus(candidates[0]);
          return;
        }
        // Multiple matches - try to match by text content
        if (candidates.length > 1 && this._savedFocusText) {
          for (const c of candidates) {
            if (c.textContent?.trim()?.substring(0, 30) === this._savedFocusText) {
              this.updateFocusableElements();
              this.setFocus(c);
              return;
            }
          }
        }
      } catch(e) { /* invalid selector, fall through */ }
    }

    // Fallback: focus best default element
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      const best = this.findBestDefaultFocus();
      this.setFocus(best || this.focusableElements[0]);
    }
  },

  updateFocusableElements() {
    const selectors = [
      '.btn:not([disabled])',
      '.card.targetable',
      '.card.hero:not(.dead)',
      '.card.enemy:not(.dead)',
      '.sigil.clickable',
      'button:not([disabled])',
      '[onclick]',
      '.hero-select-card',
      '.encounter-choice',
      '.shop-item',
      '.upgrade-option'
    ];

    // Scope to active modal if one exists, preventing focus from jumping behind it
    let root = document;
    const ctx = this.getContext();
    if (ctx === 'tutorial') {
      root = document.querySelector('.tutorial-modal-backdrop') || document;
    } else if (ctx === 'confirm') {
      root = document.querySelector('.confirm-modal') || document;
    } else if (ctx === 'modal') {
      root = document.querySelector('.modal-container') || document;
    }

    this.focusableElements = Array.from(
      root.querySelectorAll(selectors.join(','))
    ).filter(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      if (rect.bottom < 0 || rect.top > window.innerHeight + 100) return false;
      return true;
    });
  },

  setFocus(el) {
    if (!el) return;

    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
    }

    this.focusedElement = el;
    el.classList.add('controller-focus');

    if (el.id) {
      this.lastFocusedId = el.id;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  clearFocus() {
    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
      this.focusedElement = null;
    }
  },

  findBestDefaultFocus() {
    if (this.lastFocusedId) {
      const el = document.getElementById(this.lastFocusedId);
      if (el && this.focusableElements.includes(el)) {
        return el;
      }
    }

    const ctx = this.getContext();

    // Title screen: prioritize Play button
    const playBtn = document.querySelector('.title-play-btn');
    if (playBtn && this.focusableElements.includes(playBtn)) {
      return playBtn;
    }

    // Combat: prioritize active hero or targetable
    if (ctx === 'combat' || ctx === 'targeting') {
      const activeHero = document.querySelector('.card.hero.active');
      if (activeHero) return activeHero;

      const targetable = document.querySelector('.card.targetable');
      if (targetable) return targetable;
    }

    // Default: prioritize primary buttons
    const primaryBtn = document.querySelector('.btn-primary, .btn:not(.title-secondary-btn)');
    if (primaryBtn && this.focusableElements.includes(primaryBtn)) {
      return primaryBtn;
    }

    return this.focusableElements[0];
  },

  // ===== COMBAT HELPERS =====

  cycleUnit(dir) {
    const ctx = this.getContext();
    let cards;

    if (ctx === 'targeting') {
      if (typeof S !== 'undefined') {
        if (['Attack', 'Grapple', 'D20_TARGET'].includes(S.pending)) {
          cards = Array.from(document.querySelectorAll('.card.enemy:not(.dead)'));
        } else {
          cards = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
        }
      }
    } else {
      cards = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
    }

    if (!cards || cards.length === 0) return;

    let idx = cards.findIndex(c => c === this.focusedElement || c.contains(this.focusedElement));
    if (idx === -1) idx = 0;
    else idx = dir === 'next' ? (idx + 1) % cards.length : (idx - 1 + cards.length) % cards.length;

    this.setFocus(cards[idx]);
  },

  cycleSigil(dir) {
    let hero = this.focusedElement?.closest('.card.hero');
    if (!hero) {
      hero = document.querySelector('.card.hero.active');
    }
    if (!hero) return;

    const sigils = Array.from(hero.querySelectorAll('.sigil.clickable'));
    if (sigils.length === 0) return;

    let idx = sigils.findIndex(s => s === this.focusedElement);
    if (idx === -1) idx = 0;
    else idx = dir === 'next' ? (idx + 1) % sigils.length : (idx - 1 + sigils.length) % sigils.length;

    this.setFocus(sigils[idx]);
  },

  autoTarget() {
    const ctx = this.getContext();
    if (ctx !== 'targeting' || typeof S === 'undefined' || !S.pending) return;

    let targets;
    if (['Attack', 'Grapple', 'D20_TARGET'].includes(S.pending)) {
      targets = Array.from(document.querySelectorAll('.card.enemy:not(.dead)'));
    } else {
      targets = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
    }

    if (targets.length === 0) return;

    const target = targets[0];
    if (target.hasAttribute('onclick')) {
      target.click();
    }
  },

  scrollPage(dir) {
    const gameView = document.getElementById('gameView');
    if (gameView) {
      const amount = window.innerHeight * 0.5;
      gameView.scrollBy({ top: dir === 'up' ? -amount : amount, behavior: 'smooth' });
    }
  },

  // Smooth per-frame scrolling for right stick (called each poll at 60fps)
  scrollSmooth(axisValue) {
    var gameView = document.getElementById('gameView');
    if (gameView) {
      // Scale by axis deflection for proportional speed
      var amount = axisValue * 12;
      gameView.scrollBy({ top: amount, behavior: 'auto' });
    }
  },

  // ===== UI =====

  playClick() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }
  },

  // ===== CLEANUP =====

  destroy() {
    this.stopPolling();
    this.deactivate();
    // Clear pending timeouts to prevent stale callbacks
    if (this._inputDetectionTimeout) { clearTimeout(this._inputDetectionTimeout); this._inputDetectionTimeout = null; }
    if (this._steamDeckHelpTimeout) { clearTimeout(this._steamDeckHelpTimeout); this._steamDeckHelpTimeout = null; }
    // Remove event listeners to prevent accumulation on reinit
    if (this._onGamepadConnected) {
      window.removeEventListener('gamepadconnected', this._onGamepadConnected);
    }
    if (this._onGamepadDisconnected) {
      window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected);
    }
    if (this._onTouchStart) {
      document.removeEventListener('touchstart', this._onTouchStart);
    }
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
    }
  }
};

// Global helpers
function toggleControllerSupport(enabled) {
  if (typeof S === 'undefined') return;
  S.controllerDisabled = !enabled;
  if (enabled) {
    toast('Controller support enabled!', 2000);
    GamepadController.init();
  } else {
    toast('Controller support disabled.', 1200);
    GamepadController.destroy();
  }
  if (typeof savePermanent === 'function') savePermanent();
}

function forceReinitController() {
  if (typeof S !== 'undefined') S.controllerDisabled = false;
  GamepadController.destroy();
  GamepadController.init();
  toast('Controller re-initialized!', 2500);
  if (typeof savePermanent === 'function') savePermanent();
  if (typeof closeSettingsMenu === 'function') closeSettingsMenu();
}

function showSteamDeckHelp() {
  // Remove existing if already open
  closeSteamDeckHelp();
  // Append to body (not gameView) so it survives screen transitions
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay steam-deck-help-overlay';
  overlay.onclick = closeSteamDeckHelp;
  const modal = document.createElement('div');
  modal.className = 'modal-container dark steam-deck-help-modal';
  modal.style.maxWidth = '400px';
  modal.innerHTML = `
  <h2 class="modal-title" style="margin-bottom:1rem">Steam Deck Controls</h2>
  <div style="text-align:left;font-size:0.85rem;line-height:1.5">
    <p style="margin-bottom:0.8rem">In browser mode, Steam converts controller to keyboard. The game handles both.</p>
    <p style="margin-bottom:0.5rem"><strong>Working controls:</strong></p>
    <ul style="margin-left:1.2rem;margin-bottom:1rem">
      <li><strong>D-pad</strong> - Navigate (arrow keys)</li>
      <li><strong>A</strong> - Select (Enter)</li>
      <li><strong>B</strong> - Back (Backspace)</li>
      <li><strong>Bumpers</strong> - Scroll (PageUp/Down)</li>
    </ul>
    <p style="font-size:0.8rem;opacity:0.8">If Gamepad mode works better for you, try Steam → Controller Settings → "Gamepad" template.</p>
  </div>
  <button class="btn" onclick="closeSteamDeckHelp()" style="margin-top:1rem">Got it</button>`;
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
}

function closeSteamDeckHelp() {
  const overlay = document.querySelector('.steam-deck-help-overlay');
  if (overlay) overlay.remove();
  const modal = document.querySelector('.steam-deck-help-modal');
  if (modal) modal.remove();
}

// ===== ERROR HANDLERS (must be first to catch any errors during init) =====

// VISIBLE error overlay for debugging (especially Steam Deck where console isn't accessible)
function showErrorOverlay(title, details) {
  let overlay = document.getElementById('errorOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'errorOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);color:#ff6b6b;padding:2rem;z-index:999999;overflow:auto;font-family:monospace;font-size:14px;';
    document.body.appendChild(overlay);
  }
  const version = typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 'unknown';
  overlay.innerHTML =
    '<div style="max-width:800px;margin:0 auto;">' +
    '<h1 style="color:#ff6b6b;margin-bottom:1rem;">FROGGLE: ' + title + '</h1>' +
    '<pre style="background:#1a1a1a;padding:1rem;border-radius:8px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">' + details + '</pre>' +
    '<p style="margin-top:1rem;color:#888;">Build: ' + version + '</p>' +
    '<button onclick="this.parentElement.parentElement.remove()" style="margin-top:1rem;padding:0.5rem 1rem;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">Dismiss</button>' +
    '</div>';
}

// Global error handler for runtime errors and image loading failures
window.addEventListener('error', function(e) {
if(e.target && e.target.tagName === 'IMG') {
console.error('[FROGGLE] IMAGE LOAD FAILED:', e.target.src);
} else if(e.message) {
console.error('[FROGGLE] JAVASCRIPT ERROR:', e.message);
console.error('[FROGGLE] File:', e.filename, 'Line:', e.lineno, 'Col:', e.colno);
console.error('[FROGGLE] Stack:', e.error ? e.error.stack : 'No stack trace');
showErrorOverlay('JavaScript Error', e.message + '\n\nFile: ' + e.filename + '\nLine: ' + e.lineno + ', Col: ' + e.colno + '\n\nStack:\n' + (e.error ? e.error.stack : 'No stack trace'));
}
}, true);

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
console.error('[FROGGLE] UNHANDLED PROMISE REJECTION:', e.reason);
showErrorOverlay('Unhandled Promise Rejection', String(e.reason));
});

// ===== SERVICE WORKER REGISTRATION =====
// Skip service workers in Electron (file:// protocol doesn't support them)
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
navigator.serviceWorker.register('./sw.js')
.then(function(reg) {
debugLog('[SW] Service worker registered:', reg.scope);

// Check for updates immediately and periodically
reg.update().catch(function() {});

// Check for updates every 60 seconds while app is open
setInterval(function() {
reg.update().catch(function() {});
}, 60000);

// Handle waiting service worker (update available) - notify user instead of force-reloading
if (reg.waiting) {
debugLog('[SW] Update waiting, will apply on next visit');
}

// Listen for new service worker installing
reg.addEventListener('updatefound', function() {
const newWorker = reg.installing;
debugLog('[SW] Update found, installing...');

newWorker.addEventListener('statechange', function() {
if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
debugLog('[SW] New version installed, will apply on next visit');
// Show a non-intrusive toast instead of force-reloading
if (typeof toast === 'function') {
  toast('Update available! Restart the app to apply.', 3000);
}
}
});
});
})
.catch(function(err) { console.warn('[SW] Registration failed:', err); });

// No longer force-reload on controllerchange - let the update apply naturally on next visit
navigator.serviceWorker.addEventListener('controllerchange', function() {
debugLog('[SW] Controller changed, update applied');
});
}

// ===== INIT =====
window.onload = function() {
try {
// Verify critical cross-module functions loaded correctly
['render', 'getLevel', 'toast', 'saveGame', 'savePermanent', 'startFloor'].forEach(function(fn) {
  if (typeof window[fn] !== 'function') console.error('[FROGGLE] Missing critical function: ' + fn);
});
debugLog('[FROGGLE] window.onload fired');
// Check for last used slot
const lastSlot = localStorage.getItem('froggle8_current_slot');
if(lastSlot) {
const slot = parseInt(lastSlot);
debugLog('[FROGGLE] Found last used slot:', slot);
// Try to load slot-specific permanent data
const permData = localStorage.getItem('froggle8_permanent_slot' + slot);
if(permData) {
try {
const j = JSON.parse(permData);
S.gold = j.gold || 0;
S.goingRate = j.goingRate || 1;
S.startingXP = j.startingXP || 0;
S.sig = j.sig || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.sigUpgradeCounts = j.sigUpgradeCounts || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// One-time fix: Detect and repair old saves with starter actives at L1 (should be L0)
const starterActives = ['Attack', 'Shield', 'Heal', 'D20'];
let needsFix = false;
starterActives.forEach(function(sig) {
if(S.sig[sig] === 1 && S.sigUpgradeCounts[sig] === 0) {
S.sig[sig] = 0;
needsFix = true;
}
});
if(needsFix) {
debugLog('[SAVE] Fixed old save format: starter actives L1→L0');
}
S.ghostBoysConverted = j.ghostBoysConverted || false;
S.pedestal = j.pedestal || [];
S.hasReachedFloor20 = j.hasReachedFloor20 || false;
S.fuUnlocked = j.fuUnlocked || false;
S.forcedFUEntry = j.forcedFUEntry || false;
S.tapoUnlocked = j.tapoUnlocked || false;
S.advancedSigilsUnlocked = j.advancedSigilsUnlocked || false;
S.passiveSigilsUnlocked = j.passiveSigilsUnlocked || false;
S.runNumber = j.runNumber || 1;
S.runsAttempted = j.runsAttempted || 0;
S.helpTipsDisabled = j.helpTipsDisabled || false;
S.tutorialDisabled = j.tutorialDisabled || false;
S.cutsceneDisabled = j.cutsceneDisabled || false;
S.tooltipsDisabled = j.tooltipsDisabled || false;
S.toastLogVisible = j.toastLogVisible !== undefined ? j.toastLogVisible : true;
S.toastLogLocked = j.toastLogLocked || false;
S.highContrastMode = j.highContrastMode || false;
S.usedDeathQuotes = j.usedDeathQuotes || [];
S.controllerDisabled = j.controllerDisabled || false;
S.animationSpeed = j.animationSpeed !== undefined ? j.animationSpeed : 1;
S.masterVolume = j.masterVolume !== undefined ? j.masterVolume : 1.0;
S.sfxVolume = j.sfxVolume !== undefined ? j.sfxVolume : 1.0;
S.musicVolume = j.musicVolume !== undefined ? j.musicVolume : 1.0;
S.pondHistory = j.pondHistory || [];
// Apply high contrast mode if enabled
if(S.highContrastMode) document.body.classList.add('high-contrast');
// Load quest data with defaults
S.questsCompleted = j.questsCompleted || {};
S.questsClaimed = j.questsClaimed || {};
if(j.questProgress) {
  Object.assign(S.questProgress, j.questProgress);
  if(!S.questProgress.heroesPlayed) S.questProgress.heroesPlayed = { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 };
  if(!S.questProgress.heroWins) S.questProgress.heroWins = { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 };
  if(!S.questProgress.neutralsCompleted) S.questProgress.neutralsCompleted = { shopkeeper: false, wishingwell: false, treasurechest: false, wizard: false, oracle: false, encampment: false, gambling: false, ghost: false, royal: false };
  if(!S.questProgress.enemyTypesDefeated) S.questProgress.enemyTypesDefeated = { Goblin: false, Wolf: false, Orc: false, Giant: false, 'Cave Troll': false, Dragon: false, Flydra: false };
}
if(j.tutorialFlags) Object.assign(S.tutorialFlags, j.tutorialFlags);
S.tutorialCheckpoint = j.tutorialCheckpoint || 0;
S.currentSlot = slot;
debugLog('[FROGGLE] Loaded slot-specific permanent data');
} catch(e) {
console.warn('[FROGGLE] Failed to parse slot permanent data:', e);
loadPermanent(); // Fallback to old format
}
} else {
loadPermanent(); // No slot data, use old format
}
} else {
loadPermanent(); // No last slot, use old format
}
debugLog('[FROGGLE] loadPermanent complete, S.runNumber:', S.runNumber, 'helpTips:', S.helpTipsDisabled, 'tutorial:', S.tutorialDisabled, 'cutscene:', S.cutsceneDisabled);

try { applyVolumeSettings(); } catch(e) { console.warn('[FROGGLE] applyVolumeSettings failed:', e); }
try { GameMusic.preload(); } catch(e) { console.warn('[FROGGLE] GameMusic.preload failed:', e); }
try { initToastLog(); } catch(e) { console.warn('[FROGGLE] initToastLog failed:', e); }
try { initSuspendSystem(); } catch(e) { console.warn('[FROGGLE] initSuspendSystem failed:', e); }
try { Steam.init(); } catch(e) { console.warn('[FROGGLE] Steam.init failed:', e); }
try { GamepadController.init(); } catch(e) { console.warn('[FROGGLE] GamepadController.init failed:', e); }
mainTitlePage();
debugLog('[FROGGLE] mainTitlePage called');
} catch(e) {
console.error('[FROGGLE] FATAL: window.onload crashed:', e);
showErrorOverlay('Startup Crash', 'window.onload failed:\n\n' + (e.stack || e.message || String(e)));
}
};

// ===== MOBILE DOUBLE-TAP FOR AUTO-TARGET =====
// Only on touch devices: double-tap a sigil = select + auto-target
(function() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;

  let lastTapTime = 0;
  let lastTapTarget = null;

  document.addEventListener('touchend', function(e) {
    // Find if we tapped on a clickable sigil
    const sigil = e.target.closest('.sigil.clickable');
    if (!sigil) {
      lastTapTarget = null;
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    // Check for double-tap (same sigil, within 300ms)
    if (lastTapTarget === sigil && timeSinceLastTap < 300) {
      // Double-tap detected! Prevent default and call actAndAutoTarget
      e.preventDefault();
      e.stopPropagation();

      // Extract sigil name and hero index from onclick attribute
      const onclick = sigil.getAttribute('onclick');
      if (onclick && onclick.startsWith("act('")) {
        // Parse: act('Attack', 0) -> sig='Attack', heroIdx=0
        const match = onclick.match(/act\('(\w+)',\s*(\d+)\)/);
        if (match && typeof actAndAutoTarget === 'function') {
          const sig = match[1];
          const heroIdx = parseInt(match[2]);
          debugLog('[TOUCH] Double-tap detected on sigil:', sig, 'hero:', heroIdx);
          actAndAutoTarget(sig, heroIdx);
        }
      }

      // Reset to prevent triple-tap continuing
      lastTapTarget = null;
      lastTapTime = 0;
    } else {
      // First tap or new target
      lastTapTarget = sigil;
      lastTapTime = now;
    }
  }, { passive: false });
})();
