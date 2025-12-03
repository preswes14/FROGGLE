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
// Remove debug menu elements
const menus = document.querySelectorAll('.modal-container, .modal-overlay, [style*="z-index:30000"], [style*="z-index:29999"]');
menus.forEach(m => m.remove());
}

// ===== SETTINGS MENU =====
function showSettingsMenu() {
const v = document.getElementById('gameView');
const inGame = S.heroes && S.heroes.length > 0;

let html = `
<div class="modal-container dark">
<h2 class="modal-title blue" style="margin-bottom:1.5rem">⚙️ SETTINGS ⚙️</h2>

${inGame ? `
<h3 class="modal-section-title green">Game</h3>
<button class="btn" onclick="manualSave()" style="margin-bottom:0.5rem;background:#22c55e">💾 Save Game</button>
<button class="btn" onclick="restartLevel()" style="margin-bottom:0.5rem;background:#dc2626">🔄 Restart Level</button>
<button class="btn" onclick="resetTutorialFlags()" style="margin-bottom:0.5rem;background:#f97316">🔄 Reset Tutorial</button>
` : ''}

<h3 class="modal-section-title green">Audio</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${SoundFX.enabled ? 'checked' : ''} onchange="toggleSoundFX(this.checked)">
<span>🔊 Sound Effects</span>
</label>

<h3 class="modal-section-title green">Animation Speed</h3>
<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem">
<button class="btn ${S.animationSpeed === 1 ? 'selected' : ''}" onclick="setAnimationSpeed(1)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 1 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">🐸 Normal</button>
<button class="btn ${S.animationSpeed === 2 ? 'selected' : ''}" onclick="setAnimationSpeed(2)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 2 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">🐸💨 2x</button>
<button class="btn ${S.animationSpeed === 4 ? 'selected' : ''}" onclick="setAnimationSpeed(4)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 4 ? 'background:#22c55e;border-color:#16a34a' : 'background:#374151'}">🐸💨💨 4x</button>
<button class="btn ${S.animationSpeed === 0 ? 'selected' : ''}" onclick="setAnimationSpeed(0)" style="flex:1;min-width:60px;padding:0.5rem;font-size:0.9rem;${S.animationSpeed === 0 ? 'background:#f97316;border-color:#ea580c' : 'background:#374151'}">⚡ Instant</button>
</div>
<p style="font-size:0.8rem;opacity:0.7;margin:0 0 0.5rem 0;padding-left:0.5rem">Speed up animations for faster gameplay</p>

<h3 class="modal-section-title green">Display</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${S.toastLogVisible ? 'checked' : ''} onchange="toggleToastLogVisibility(this.checked)">
<span>Show Toast Log</span>
</label>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.helpTipsDisabled ? 'checked' : ''} onchange="toggleHelpTips(this.checked)">
<span>💡 Show Help/Tips</span>
</label>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.tooltipsDisabled ? 'checked' : ''} onchange="toggleTooltips(this.checked)">
<span>🔍 Show Sigil Tooltips</span>
</label>

<h3 class="modal-section-title green">Controller / Steam Deck</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${!S.controllerDisabled ? 'checked' : ''} onchange="toggleControllerSupport(this.checked)">
<span>🎮 Controller Support</span>
</label>
<p style="font-size:0.8rem;opacity:0.7;margin:-0.25rem 0 0.5rem 0;padding-left:0.5rem">Enable gamepad/controller navigation (auto-detects Steam Deck)</p>

<h3 class="modal-section-title blue">Debug</h3>
<label class="modal-checkbox-label">
<input type="checkbox" ${S.debugMode ? 'checked' : ''} onchange="toggleDebugMode(this.checked)">
<span>🛠️ Enable Debug Mode</span>
</label>
${S.debugMode ? `<button class="btn" onclick="closeSettingsMenu();showDebugMenu()" style="margin-bottom:0.5rem;background:#3b82f6">🛠️ Open Debug Tools</button>` : ''}

${inGame ? `
<h3 class="modal-section-title" style="color:#dc2626">Quit</h3>
<button class="btn danger" onclick="confirmQuitToRibbleton()" style="margin-bottom:0.5rem;background:#dc2626">🚪 Quit to Ribbleton</button>
<p style="font-size:0.75rem;opacity:0.7;margin:-0.25rem 0 0.5rem 0;padding-left:0.5rem">Progress is saved at the start of each floor. Current floor progress will be lost.</p>
` : ''}

<button class="btn" onclick="closeSettingsMenu()" style="margin-top:1rem;background:#888">Close</button>
</div>
<div class="modal-overlay" onclick="closeSettingsMenu()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
}

function closeSettingsMenu() {
const menus = document.querySelectorAll('.modal-container, .modal-overlay, [style*="z-index:30000"], [style*="z-index:29999"]');
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

function resetTutorialFlags() {
showConfirmModal('Reset tutorial? This will show all tutorial pop-ups again.', () => {
S.tutorialFlags = {
ribbleton_intro: false,
ribbleton_warrior_attack: false,
ribbleton_targeting: false,
ribbleton_healer_d20: false,
ribbleton_d20_menu: false,
healer_expand_explain: false,
ribbleton_enemy_turn: false,
ribbleton_healer_heal: false,
ribbleton_expand: false,
ribbleton_finish_wolf: false,
enemies_get_sigils: false,
ribbleton_shield_sigil: false,
ribbleton_handoff: false,
ribbleton_tooltip_intro: false,
ribbleton_hub_intro: false,
levelup_intro: false,
levelup_stat_upgrade: false,
levelup_add_active: false,
levelup_upgrade_active: false,
levelup_upgrade_passive: false,
death_intro: false,
death_exit_warning: false,
neutral_intro: false,
neutral_d20_level: false,
faq_intro: false,
last_stand_intro: false,
recruit_intro: false,
run2_hero_lock: false,
first_victory_sequence: false,
first_fu_victory: false,
pedestal_first_placement: false,
tapo_victory_message: false
};
savePermanent();
toast('Tutorial reset! Will show again next run.', 2000);
closeSettingsMenu();
});
}

function toggleHelpTips(enabled) {
S.helpTipsDisabled = !enabled;
// If turning ON, reset all tutorial flags so they show again
if(enabled) {
S.tutorialFlags = {};
toast('Help/Tips enabled! All tips reset and will show again.', 2000);
// Re-trigger current screen to show relevant popups immediately
if(typeof render === 'function') {
try { render(); } catch(e) { /* render() not applicable in current state */ }
}
// If in Ribbleton hub, re-show to trigger ribbleton_hub_intro popup
if(document.querySelector('h1')?.textContent?.includes('Welcome Home to Ribbleton')) {
setTimeout(() => showRibbleton(), 100);
}
} else {
toast('Help/Tips disabled. No more popups!', 1200);
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

function setAnimationSpeed(speed) {
S.animationSpeed = speed;
const labels = {0: '⚡ Instant', 1: '🐸 Normal', 2: '🐸💨 2x', 4: '🐸💨💨 4x'};
toast(`Animation speed: ${labels[speed]}`, 1200);
SoundFX.play('hop');
savePermanent();
// Refresh settings menu to update button states
closeSettingsMenu();
showSettingsMenu();
}

function toggleControllerSupport(enabled) {
S.controllerDisabled = !enabled;
if(enabled) {
toast('🎮 Controller support enabled! Connect a gamepad to use.', 2000);
// Re-initialize controller if a gamepad is connected
if(navigator.getGamepads) {
const gamepads = navigator.getGamepads();
for(const gp of gamepads) {
if(gp) {
GamepadController.gamepadIndex = gp.index;
GamepadController.activateControllerMode();
break;
}
}
}
} else {
toast('Controller support disabled.', 1200);
GamepadController.deactivateControllerMode();
GamepadController.gamepadIndex = null;
if(GamepadController.pollInterval) {
clearInterval(GamepadController.pollInterval);
GamepadController.pollInterval = null;
}
}
savePermanent();
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
• <strong>D20</strong> - Roll the dice for risky gambit actions<br><br>
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
• Each turn in Last Stand increases D20 difficulty by +1 DC (caps at +4)<br>
• If healed, they revive with the healed HP amount<br>
• After ~5 turns, DC penalties make success nearly impossible<br><br>
<strong>Last Stand Turn counter:</strong><br>
Turn 1: DC +0 (CONFUSE is DC 16)<br>
Turn 2: DC +1 (CONFUSE is DC 17)<br>
Turn 5: DC +4 (CONFUSE is DC 20 - nat 20 required!)<br><br>
You have a few turns to heal your Last Stand heroes before they become useless!`
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
<strong>Strategy tip:</strong> Before finishing a floor, use any remaining actions to shield up your team. The shields will carry over!`
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
<p style="text-align:center;font-size:0.95rem;line-height:1.5;margin-bottom:1rem">Gain and upgrade powerful sigils to advance through the dungeon and save Tapo the tadpole! On death, you'll have a chance to spend gold you've earned to make your team permanently stronger!</p>

<div style="background:white;border-radius:8px;padding:1rem;margin-top:1rem">
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
<div id="faq-answer-${index}" style="display:none;padding:1rem;font-size:0.9rem;line-height:1.6;border-top:2px solid #ddd;background:rgba(0,0,0,0.02)">
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
const overlays = document.querySelectorAll('.modal-container, .modal-overlay, [style*="z-index:30000"], [style*="z-index:29999"]');
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
const menus = document.querySelectorAll('.modal-container, .modal-overlay, [style*="z-index:30000"], [style*="z-index:29999"]');
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
saveGame();
upd();
toast(`Updated ${hero.n}: POW=${newPOW}, HP=${newMaxHP}!`, 1200);
closeDebugMenu();
render();
}

