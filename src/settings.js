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
toast(enabled ? '🎲 Oops All 20s: ON (All D20 rolls = 20!)' : '🎲 Oops All 20s: OFF', 1500);
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
<div class="modal-container dark">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">🛠️ DEBUG MENU 🛠️</h2>

<h3 class="modal-section-title green">Resources</h3>
<button class="btn" onclick="debugAddGold()" style="margin-bottom:0.5rem;background:#22c55e">+100 Gold</button>
<button class="btn" onclick="debugAddXP()" style="margin-bottom:0.5rem;background:#22c55e">+100 XP</button>

<h3 class="modal-section-title green">Navigation</h3>
<div style="margin:0.5rem 0">
<label style="color:white;font-size:0.9rem">Jump to Floor:</label>
<input type="number" id="debugFloorInput" min="1" max="19" value="${S.floor}" style="width:60px;padding:0.25rem;margin:0 0.5rem;font-size:1rem">
<button class="btn" onclick="debugJumpFloor()" style="display:inline-block;width:auto;padding:0.5rem 1rem;margin:0;font-size:0.9rem;min-height:auto">Go</button>
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
${S.heroes.some(h => h.ls) ? `<button class="btn" onclick="debugReviveFromLastStand()" style="background:#dc2626;margin-bottom:0.5rem">💀 Revive from Last Stand</button>` : ''}
</div>
` : ''}

${inCombat ? `
<h3 class="modal-section-title green">Combat</h3>
<button class="btn danger" onclick="debugDealDamage()">Deal 50 DMG to Enemy</button>
` : ''}

<h3 class="modal-section-title blue">Cheats</h3>
<label class="modal-checkbox-label" style="background:rgba(251,191,36,0.2)">
<input type="checkbox" ${S.oopsAll20s ? 'checked' : ''} onchange="toggleOopsAll20s(this.checked)">
<span>🎲 Oops All 20s (Auto-succeed D20 rolls)</span>
</label>

<button class="btn" onclick="closeDebugMenu()" style="margin-top:1rem;background:#888">Close</button>
</div>
<div class="modal-overlay" onclick="closeDebugMenu()"></div>
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
<div class="modal-container dark">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">⚙️ SETTINGS ⚙️</h2>

${inGame ? `
<button class="btn" onclick="manualSave()" style="margin-bottom:0.5rem;background:#22c55e">💾 Save Game</button>
<button class="btn" onclick="restartLevel()" style="margin-bottom:0.5rem;background:#f97316">🔄 Restart Level</button>
` : ''}

<div style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.5rem">
<button class="btn" onclick="showAudioSettings()" style="background:#22c55e">🔊 Audio</button>
<button class="btn" onclick="showGameplaySettings()" style="background:#6366f1">🎮 Gameplay</button>
<button class="btn" onclick="showDisplaySettings()" style="background:#8b5cf6">🖥️ Display</button>
<button class="btn" onclick="showControllerSettings()" style="background:#0ea5e9">🕹️ Controller</button>
</div>

${inGame ? `
<button class="btn danger" onclick="confirmQuitToRibbleton()" style="margin-top:1rem;background:#dc2626">🚪 Quit to Ribbleton</button>
` : inTutorial ? `
<button class="btn danger" onclick="confirmQuitTutorial()" style="margin-top:1rem;background:#dc2626">🚪 Exit Tutorial</button>
` : inRibbleton ? `
<button class="btn" onclick="confirmExitGame()" style="margin-top:1rem;background:#dc2626">🚪 Quit Game</button>
` : ''}

<button class="settings-back-btn" onclick="closeSettingsMenu()">Return</button>
<div style="margin-top:0.5rem;font-size:0.8rem;opacity:0.5;text-align:center">Press Ⓑ to close menu</div>
</div>
<div class="modal-overlay" onclick="closeSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

// ===== AUDIO SETTINGS SUBMENU =====
function showAudioSettings() {
closeSettingsMenu();
const v = document.getElementById('gameView');

// Convert 0-1 to percentage for display
const masterPct = Math.round((S.masterVolume || 1) * 100);
const sfxPct = Math.round((S.sfxVolume || 1) * 100);
const musicPct = Math.round((S.musicVolume || 1) * 100);

let html = `
<div class="modal-container dark">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">🔊 AUDIO</h2>

<div style="display:flex;flex-direction:column;gap:1.25rem">

<div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<label style="font-weight:bold;color:#fbbf24">🔈 Master Volume</label>
<span id="master-vol-display" style="font-size:0.9rem;color:#fbbf24">${masterPct}%</span>
</div>
<input type="range" min="0" max="100" value="${masterPct}"
  oninput="updateVolumeDisplay('master', this.value); setMasterVolume(this.value / 100)"
  style="width:100%;height:8px;cursor:pointer;accent-color:#fbbf24">
</div>

<div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<label style="font-weight:bold;color:#22c55e">💥 Sound Effects</label>
<span id="sfx-vol-display" style="font-size:0.9rem;color:#22c55e">${sfxPct}%</span>
</div>
<input type="range" min="0" max="100" value="${sfxPct}"
  oninput="updateVolumeDisplay('sfx', this.value); setSfxVolume(this.value / 100)"
  style="width:100%;height:8px;cursor:pointer;accent-color:#22c55e">
</div>

<div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
<label style="font-weight:bold;color:#8b5cf6">🎵 Music</label>
<span id="music-vol-display" style="font-size:0.9rem;color:#8b5cf6">${musicPct}%</span>
</div>
<input type="range" min="0" max="100" value="${musicPct}"
  oninput="updateVolumeDisplay('music', this.value); setMusicVolume(this.value / 100)"
  style="width:100%;height:8px;cursor:pointer;accent-color:#8b5cf6">
</div>

</div>

<button class="btn" onclick="testAudioLevels()" style="margin-top:1rem;background:#374151">🔊 Test Sound</button>

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" onclick="closeSettingsMenu();showSettingsMenu()"></div>
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
<div class="modal-container dark">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">🎮 GAMEPLAY</h2>

<h3 class="modal-section-title green">Animation Speed</h3>
<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem">
<button class="btn ${S.animationSpeed === 1 ? 'selected' : ''}" onclick="setAnimationSpeed(1, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 1 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">🐸 Normal</button>
<button class="btn ${S.animationSpeed === 2 ? 'selected' : ''}" onclick="setAnimationSpeed(2, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 2 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">🐸💨 2x</button>
<button class="btn ${S.animationSpeed === 4 ? 'selected' : ''}" onclick="setAnimationSpeed(4, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 4 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">🐸💨💨 4x</button>
<button class="btn ${S.animationSpeed === 0 ? 'selected' : ''}" onclick="setAnimationSpeed(0, true)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 0 ? 'background:#f97316;border-color:#ea580c' : 'background:#374151'}">⚡ Instant</button>
</div>

<h3 class="modal-section-title blue">Debug</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${S.debugMode ? 'checked' : ''} onchange="toggleDebugMode(this.checked)">
<span>🛠️ Enable Debug Mode</span>
</label>
${S.debugMode ? `<button class="btn" onclick="closeSettingsMenu();showDebugMenu()" style="margin-bottom:0.5rem;background:#3b82f6">🛠️ Open Debug Tools</button>` : ''}

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" onclick="closeSettingsMenu();showSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

// ===== DISPLAY SETTINGS SUBMENU =====
function showDisplaySettings() {
closeSettingsMenu();
const v = document.getElementById('gameView');

let html = `
<div class="modal-container dark">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">🖥️ DISPLAY</h2>

<label class="modal-checkbox-label">
<input type="checkbox" ${S.toastLogVisible ? 'checked' : ''} onchange="toggleToastLogVisibility(this.checked)">
<span>📜 Show Toast Log</span>
</label>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.helpTipsDisabled ? 'checked' : ''} onchange="toggleHelpTips(this.checked)">
<span>💡 Help Tips</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.25rem 0.5rem;padding-left:0.5rem">Mechanic explanation popups</p>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.tutorialDisabled ? 'checked' : ''} onchange="toggleTutorialWalkthrough(this.checked)">
<span>📖 Tutorial Walkthrough</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.25rem 0.5rem;padding-left:0.5rem">Guided tutorial popups</p>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.cutsceneDisabled ? 'checked' : ''} onchange="toggleCutscenes(this.checked)">
<span>🎬 Story Cutscenes</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.5rem 0.5rem;padding-left:0.5rem">One-time narrative events</p>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.tooltipsDisabled ? 'checked' : ''} onchange="toggleTooltips(this.checked)">
<span>🔍 Show Sigil Tooltips</span>
</label>

<h3 class="modal-section-title green" style="margin-top:1rem">Accessibility</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${S.highContrastMode ? 'checked' : ''} onchange="toggleHighContrastMode(this.checked)">
<span>👁️ High Contrast Mode</span>
</label>
<p style="font-size:0.75rem;opacity:0.6;margin:-0.25rem 0 0.5rem 0.5rem;padding-left:0.5rem">Enhanced visibility for low vision users</p>

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" onclick="closeSettingsMenu();showSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

// Toggle toast log visibility in header
function toggleToastLogVisibility(enabled) {
S.toastLogVisible = enabled;
savePermanent();
render();
toast(enabled ? '📜 Toast Log: Visible' : '📜 Toast Log: Hidden', 1500);
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
toast(enabled ? '👁️ High Contrast Mode: ON' : '👁️ High Contrast Mode: OFF', 1500);
}

// ===== CONTROLLER SETTINGS SUBMENU =====
function showControllerSettings() {
closeSettingsMenu();
const v = document.getElementById('gameView');

let html = `
<div class="modal-container dark">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">🕹️ CONTROLLER</h2>

<label class="modal-checkbox-label">
<input type="checkbox" ${!S.controllerDisabled ? 'checked' : ''} onchange="toggleControllerSupport(this.checked)">
<span>🎮 Controller Support</span>
</label>
<button class="btn" onclick="showControlsGuide()" style="margin-bottom:0.5rem;background:#6366f1">🎮 Controls Guide</button>
<button class="btn" onclick="forceReinitController()" style="margin-bottom:0.5rem;background:#22c55e;font-size:0.9rem">🔄 Re-Init Controller</button>
<button class="btn" onclick="toggleControllerDebug()" style="margin-bottom:0.5rem;background:#f59e0b;font-size:0.9rem">🔍 Input Overlay</button>

<button class="settings-back-btn" onclick="closeSettingsMenu();showSettingsMenu()">Back <span style="opacity:0.6;font-size:0.85em">(B)</span></button>
</div>
<div class="modal-overlay" onclick="closeSettingsMenu();showSettingsMenu()"></div>
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
combat(S.floor);
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

function toggleSoundFX(enabled) {
SoundFX.enabled = enabled;
if(enabled) {
SoundFX.init();
SoundFX.play('select');
toast('Sound effects enabled!', 1200);
} else {
toast('Sound effects disabled!', 1200);
}
}

function setAnimationSpeed(speed, fromSubmenu = false) {
S.animationSpeed = speed;
const labels = {0: '⚡ Instant', 1: '🐸 Normal', 2: '🐸💨 2x', 4: '🐸💨💨 4x'};
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
<div style="font-weight:bold;margin-bottom:5px;color:#fff">🎮 CONTROLLER DEBUG</div>
<div id="debug-gamepad-status">Checking...</div>
<div id="debug-buttons" style="margin-top:5px"></div>
<div id="debug-axes" style="margin-top:5px"></div>
<div id="debug-keyboard" style="margin-top:5px;color:#ff0">Last key: none</div>
<div id="debug-key-count" style="font-size:10px;color:#888">Keys pressed: 0</div>
<div style="margin-top:8px">
<button id="debug-detect-btn" style="background:#22c55e;color:#000;border:none;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer">🔍 Force Detect</button>
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
{ section: '🕹️ Sticks (Combat)', items: [
  { btn: 'Right Stick', desc: 'Cycle between characters (heroes ↔ enemies)', highlight: true },
  { btn: 'Left Stick', desc: 'Cycle sigils on current character', highlight: true }
]},
{ section: '🎮 Bumpers & Triggers (Combat)', items: [
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
{ section: '⚙️ Menu Buttons', items: [
  { btn: 'START (☰)', desc: 'Open Settings menu (works anywhere)' },
  { btn: 'SELECT (⊡)', desc: 'Auto-target: smart targeting for current action' },
  { btn: 'L3 (left click)', desc: 'Show Controls Guide' },
  { btn: 'R3 (right click)', desc: 'Toggle Controller Debug overlay' }
]},
{ section: '⌨️ Keyboard Fallback', items: [
  { btn: 'Arrow Keys / WASD', desc: 'Navigate (D-pad equivalent)' },
  { btn: 'Q / E', desc: 'Previous / Next character (LB / RB)' },
  { btn: 'Z / C', desc: 'Previous / Next sigil (LT / RT)' },
  { btn: 'Enter / Space', desc: 'Confirm (A button)' },
  { btn: 'Escape', desc: 'Back / Cancel (B button)' },
  { btn: 'X / T', desc: 'Switch sides / Toggle tooltip' },
  { btn: 'R', desc: 'Auto-target (SELECT)' }
]}
];

let html = `
<div class="modal-container dark" style="max-height:85vh;overflow-y:auto">
<h2 class="modal-title blue" style="margin-bottom:1rem">🎮 CONTROLS GUIDE 🎮</h2>

<div style="margin-bottom:1rem;padding:0.75rem;background:rgba(34,197,94,0.15);border:2px solid #22c55e;border-radius:8px">
<p style="margin:0;color:#86efac;font-size:0.9rem;text-align:center">
<strong>Quick Reference:</strong> Right Stick = Characters • Left Stick = Sigils • Bumpers & Triggers work the same way!
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
<h4 style="color:#a5b4fc;margin:0 0 0.5rem 0;font-size:0.95rem">💡 Pro Tips</h4>
<ul style="margin:0;padding-left:1.25rem;color:#c7d2fe;font-size:0.85rem;line-height:1.5">
<li><strong>Auto-Target (SELECT)</strong> picks smart targets: lowest HP enemies for attacks, most damaged heroes for heals</li>
<li><strong>Switch Sides (X)</strong> quickly jumps between your hero and the enemy across from them</li>
<li><strong>Sigil cycling (LT/RT/Left Stick)</strong> automatically shows tooltips as you browse</li>
<li><strong>Bumpers (LB/RB)</strong> also scroll through long lists in menus</li>
</ul>
</div>

<button class="btn" onclick="showSteamInputGuide()" style="margin-top:1rem;background:#1b2838">
<span style="margin-right:0.5rem">🎮</span> Steam Input Setup Guide
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
<span style="background:linear-gradient(135deg,#1b2838,#2a475e);padding:0.3rem 0.6rem;border-radius:4px">🎮 Steam Input Setup</span>
</h2>

<div style="margin-bottom:1rem;padding:0.75rem;background:rgba(27,40,56,0.3);border:2px solid #2a475e;border-radius:8px">
<p style="margin:0;color:#c7d5e0;font-size:0.9rem;text-align:center">
FROGGLE uses <strong>Gamepad with Joystick Trackpad</strong> template as a base. Here's how to set it up in Steam.
</p>
</div>

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">📋 Quick Setup (Recommended)</h3>
<div style="padding:0.75rem;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:1rem">
<ol style="margin:0;padding-left:1.25rem;color:#e5e7eb;font-size:0.85rem;line-height:1.8">
<li>Open Steam and navigate to your game in the Library</li>
<li>Click the <strong>controller icon</strong> or go to <strong>Properties → Controller</strong></li>
<li>Select <strong>"Gamepad with Joystick Trackpad"</strong> as the template</li>
<li>The default mappings should work perfectly!</li>
</ol>
</div>

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">🔧 Custom Configuration</h3>
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

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">🎮 Steam Deck Gaming Mode</h3>
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

<h3 class="modal-section-title" style="margin-top:1rem;color:#66c0f4">🖥️ Electron / Desktop App</h3>
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
The game also supports keyboard fallback. If controller input isn't detected, you can use Arrow Keys, WASD, Q/E/Z/C, and Enter/Escape to play!<br><br><em style="font-size:0.85em;opacity:0.9">(💡 Tip: This works great for Steam Deck users who prefer touch controls!)</em>
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
a: `Active sigils (Attack, Shield, Heal, Grapple, Ghost, D20, Alpha) always display with a minimum level of 1 when equipped, even if their permanent storage level is 0. This is because they work at "Level 1" effectiveness when you first get them.<br><br>
<strong>Example:</strong> Attack storage level 0 = displays as L1 (1 attack per action)<br>
Attack storage level 1 = displays as L2 (2 attacks per action)<br><br>
The upgrade cost is based on <em>storage level</em>, not display level. So upgrading from display L1 to L2 costs the price for storage level 0→1.`
},
{
q: "What happens if I run out of enemies before using all my Expand targets?",
a: `If you have Expand and select targets for multi-instance actions (Attack, Shield, Heal), you might run out of valid targets mid-instance. When this happens, you'll see a "wasted targets" message.<br><br>
<strong>Example:</strong> You have Attack L2 with Expand L1 (3 total targets). There are only 2 enemies left. You can attack both enemies, but the 3rd target slot is wasted - you still get both attacks, but you can't use the extra Expand slot.<br><br>
This is intentional! Plan your actions carefully.`
},
{
q: "How does Last Stand work and how long does it last?",
a: `When a hero reaches 0 HP (and has no Ghost charges), they enter <strong>Last Stand</strong> instead of dying immediately. In Last Stand:<br><br>
• They can ONLY use D20 gambits (no other actions)<br>
• Each turn in Last Stand increases D20 difficulty by +2 DC<br>
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
q: "How does Grapple and stun work?",
a: `<strong>Grapple</strong> stuns a target for a number of turns equal to the Grapple level (L1 = 1 turn, L2 = 2 turns, etc.). The user takes recoil damage equal to the target's POW.<br><br>
<strong>Stun rules (same for everyone):</strong><br>
• Stun never stacks. If a target is already stunned for 2 turns and gets stunned for 1, nothing changes<br>
• A new stun only takes effect if its duration exceeds the remaining stun<br>
• Stunned units skip their action but still progress (enemies draw sigils, rage cycles, etc.)<br>
• All stun counters decrement at the end of each enemy turn<br><br>
<strong>Sources of stun:</strong><br>
• Player Grapple: stun for Grapple level turns<br>
• D20 STARTLE: stun for 1 turn<br>
• Enemy Grapple: stun for sigil level turns<br>
• Floor 11 Ambush: all heroes stunned for 1 turn`
},
{
q: "How many recruits can I have? What happens to them?",
a: `Recruits are enemies you've converted to your side via D20 RECRUIT (DC 20):<br><br>
• Each hero can have <strong>1 recruit</strong> (recruiting another replaces the first)<br>
• Recruits persist between battles until killed<br>
• Recruits fight in their hero's lane and attack enemies<br>
• Recruits can gain sigils and act during enemy turns<br><br>
<strong>How they work:</strong> Recruits stand behind their hero and attack enemies during the "Recruit Phase" of the enemy turn. They're powerful allies but can die permanently!`
},
{
q: "Do shields carry over between battles?",
a: `<strong>Yes!</strong> Shields persist between battles and cap at max HP.<br><br>
This means you can "shield farm" by using Shield sigils on the last enemy of a floor to enter the next floor with full shields. Combined with Asterisk or Alpha, this can make you nearly invincible!<br><br>
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
a: `<strong>Star:</strong> Passive XP multiplier. Each hero with Star adds +0.5× XP bonus per Star level.<br>
• 2 heroes with Star L1 = +1.0× bonus = 2× total XP<br>
• Star is extremely powerful for long-term scaling!<br><br>
<strong>Asterisk:</strong> PASSIVE - Next action triggers +X times! Resets after each battle.<br>
• Asterisk L1: First action triggers ×2<br>
• Asterisk L4: First action triggers ×5<br>
• Works with ANY action: Attack, Shield, Heal, D20 gambits, etc.<br>
• No activation needed - happens automatically on your first action<br>
• Can be combined with Alpha for devastating combos!`
}
];

let html = `
<div class="modal-container faq">
<h2 class="modal-title orange">❓ Frequently Asked Questions ❓</h2>

<div style="background:rgba(147,51,234,0.1);border:2px solid #9333ea;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
<h3 style="text-align:center;font-size:1.2rem;margin:0 0 0.5rem 0;color:#9333ea">🐸 FROGGLE</h3>
<p style="text-align:center;font-size:0.95rem;line-height:1.5;margin-bottom:1rem">Use XP to gain and upgrade powerful sigils. Advance through the dungeon and save Tapo the tadpole! On death, you'll have a chance to spend the gold you've earned to make your heroes permanently stronger!</p>

<div style="background:white;border-radius:8px;padding:1rem;margin-top:1rem;color:#1a1a1a">
<h4 style="color:#2c63c7;margin:0 0 0.75rem 0;font-size:1rem">⚔️ HOW LEVEL-UPS WORK</h4>
<p style="font-size:0.9rem;margin:0 0 0.5rem 0">After combat, you can spend XP in 3 ways:</p>

<div style="margin-left:1rem;font-size:0.9rem;line-height:1.6">
<p style="margin:0.5rem 0"><strong>1️⃣ UPGRADE A SIGIL</strong> (makes it stronger everywhere!)</p>
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

<p style="margin:0.5rem 0"><strong>2️⃣ ADD A SIGIL TO A HERO</strong></p>
<ul style="margin:0.25rem 0 0.75rem 1.5rem;padding-left:1.5rem">
<li>All heroes can learn any sigil by spending XP!</li>
<li>Active sigils use your hero's 1 action per turn</li>
<li>Choose abilities that complement your strategy</li>
</ul>

<p style="margin:0.5rem 0"><strong>3️⃣ UPGRADE HERO STATS</strong></p>
<ul style="margin:0.25rem 0;padding-left:1.5rem">
<li>Spend XP for +1 POW (increases damage/healing/shields)</li>
<li>Spend XP for +5 Max HP (and heal if in Last Stand)</li>
</ul>
</div>
</div>

<div style="background:rgba(34,197,94,0.1);border:2px solid #22c55e;border-radius:8px;padding:1rem;margin-top:1rem">
<h4 style="color:#15803d;margin:0 0 0.5rem 0;font-size:0.95rem">💡 PRO TIPS</h4>
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
if(level === 0) return '#666';
if(level === 1) return '#000';
if(level === 2) return '#0d9488';
if(level === 3) return '#9333ea';
if(level === 4) return '#d97706';
return '#ff0080'; // L5 gradient
};

let html = `
<div class="modal-container light">
<h2 class="modal-title purple">📖 SIGILARIUM 📖</h2>
<p style="text-align:center;font-size:0.9rem;opacity:0.8;margin-bottom:1.5rem">All Sigils and Their Permanent Upgrade Levels</p>

<!-- Core Sigils -->
<h3 style="color:#2c63c7;margin-bottom:0.75rem;font-size:1rem;border-bottom:2px solid #2c63c7;padding-bottom:0.25rem">⚔️ Core Sigils</h3>
<div style="display:grid;gap:0.75rem;margin-bottom:1.5rem">
`;

coreSigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const displayLevel = permLevel + 1; // Actives display +1 higher (perm 0 = L1)
const cl = permLevel===0?'l1':permLevel===1?'l2':permLevel===2?'l3':permLevel===3?'l4':permLevel===4?'l5':'l5';
const desc = SIGIL_DESCRIPTIONS[sig] || 'No description available';
const levelColor = getLevelColor(displayLevel);

html += `
<div style="background:rgba(0,0,0,0.05);border:2px solid #000;border-radius:8px;padding:1rem">
<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
<span class="sigil ${cl}" style="font-size:1.2rem;padding:8px 12px">${sigilIconOnly(sig)}</span>
<div>
<div style="font-weight:bold;font-size:1.1rem">${sig}</div>
<div style="font-size:0.85rem;opacity:0.8">Level: <span style="color:${levelColor};font-weight:bold">L${displayLevel}</span></div>
</div>
</div>
<div style="font-size:0.9rem;line-height:1.4;color:#4b5563">${desc}</div>
</div>
`;
});

html += `
</div>

<!-- Advanced Sigils -->
<h3 style="color:#f97316;margin-bottom:0.75rem;font-size:1rem;border-bottom:2px solid #f97316;padding-bottom:0.25rem">🔥 Advanced Sigils</h3>
<div style="display:grid;gap:0.75rem;margin-bottom:1.5rem">
`;

advancedSigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const displayLevel = permLevel + 1; // Actives display +1 higher (perm 0 = L1)
const cl = permLevel===0?'l1':permLevel===1?'l2':permLevel===2?'l3':permLevel===3?'l4':permLevel===4?'l5':'l5';
const desc = SIGIL_DESCRIPTIONS[sig] || 'No description available';
const levelColor = getLevelColor(displayLevel);

html += `
<div style="background:rgba(0,0,0,0.05);border:2px solid #000;border-radius:8px;padding:1rem">
<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
<span class="sigil ${cl}" style="font-size:1.2rem;padding:8px 12px">${sigilIconOnly(sig)}</span>
<div>
<div style="font-weight:bold;font-size:1.1rem">${sig}</div>
<div style="font-size:0.85rem;opacity:0.8">Level: <span style="color:${levelColor};font-weight:bold">L${displayLevel}</span></div>
</div>
</div>
<div style="font-size:0.9rem;line-height:1.4;color:#4b5563">${desc}</div>
</div>
`;
});

html += `
</div>

<!-- Passive Sigils -->
<h3 style="color:#9333ea;margin-bottom:0.75rem;font-size:1rem;border-bottom:2px solid #9333ea;padding-bottom:0.25rem">✨ Passive Sigils</h3>
<div style="display:grid;gap:0.75rem">
`;

passiveSigils.forEach(sig => {
const level = S.sig[sig] || 0;
const cl = level===0?'l0':level===1?'l1':level===2?'l2':level===3?'l3':level===4?'l4':'l5';
const desc = SIGIL_DESCRIPTIONS[sig] || 'No description available';
const levelColor = getLevelColor(level);

html += `
<div style="background:rgba(0,0,0,0.05);border:2px solid #000;border-radius:8px;padding:1rem">
<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
<span class="sigil ${cl} passive" style="font-size:1.2rem;padding:8px 12px">${sigilIconOnly(sig)}</span>
<div>
<div style="font-weight:bold;font-size:1.1rem">${sig}</div>
<div style="font-size:0.85rem;opacity:0.8">Permanent Level: <span style="color:${levelColor};font-weight:bold">L${level}</span></div>
</div>
</div>
<div style="font-size:0.9rem;line-height:1.4;color:#4b5563">${desc}</div>
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


