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

// ===== STEAM DECK / CONTROLLER SUPPORT SYSTEM =====
const GamepadController = {
  // State
  active: false,
  gamepadIndex: null,
  focusedElement: null,
  focusableElements: [],
  lastInputTime: 0,
  inputCooldown: 150, // ms between inputs to prevent rapid-fire
  axisDeadzone: 0.5,
  pollInterval: null,
  buttonStates: {},
  contextStack: [], // Stack for nested menus/modals
  tooltipVisible: false, // Track if tooltip is showing via controller
  tooltipElement: null, // Element with active tooltip
  currentUnitIndex: 0, // Current unit (hero/enemy) index for LB/RB cycling
  currentSigilIndex: 0, // Current sigil index for LT/RT cycling
  lastFocusedId: null, // For focus restoration after render
  lastMouseX: null, // For tracking mouse movement delta
  lastMouseY: null, // For tracking mouse movement delta
  mouseMovementThreshold: 25, // Minimum pixels to move before switching to mouse mode

  // Button indices (standard gamepad mapping)
  BUTTONS: {
    A: 0,        // Bottom button (confirm/select)
    B: 1,        // Right button (back/cancel)
    X: 2,        // Left button
    Y: 3,        // Top button (tooltip toggle)
    LB: 4,       // Left bumper (prev unit)
    RB: 5,       // Right bumper (next unit)
    LT: 6,       // Left trigger (prev sigil)
    RT: 7,       // Right trigger (next sigil)
    SELECT: 8,   // Back/Select
    START: 9,    // Start/Menu
    L3: 10,      // Left stick click
    R3: 11,      // Right stick click
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15
  },

  // Initialize controller system
  init() {
    debugLog('[GAMEPAD] Initializing controller support');

    // Check if controller support is disabled
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[GAMEPAD] Controller support disabled by user setting');
      return;
    }

    // Listen for gamepad connections
    window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
    window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));

    // Check for already-connected gamepads
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (gp) {
        this.onGamepadConnected({ gamepad: gp });
        break;
      }
    }

    // Switch to mouse mode on significant mouse movement or click
    document.addEventListener('mousemove', (e) => {
      // Only deactivate on significant mouse movement (not just hover)
      if (this.lastMouseX === null) {
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        return;
      }
      const dx = Math.abs(e.clientX - this.lastMouseX);
      const dy = Math.abs(e.clientY - this.lastMouseY);
      if (dx > this.mouseMovementThreshold || dy > this.mouseMovementThreshold) {
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.deactivateControllerMode();
      }
    });
    document.addEventListener('click', () => this.deactivateControllerMode());
  },

  onGamepadConnected(e) {
    debugLog('[GAMEPAD] Connected:', e.gamepad.id, 'Index:', e.gamepad.index);

    // Check if controller support is disabled
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[GAMEPAD] Controller connected but support is disabled');
      return;
    }

    this.gamepadIndex = e.gamepad.index;
    this.activateControllerMode();

    // Start polling loop
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this.poll(), 16); // ~60fps
    }

    toast('🎮 Controller connected! Use D-pad to navigate.', 2000);
  },

  onGamepadDisconnected(e) {
    debugLog('[GAMEPAD] Disconnected:', e.gamepad.id);
    if (e.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = null;
      this.deactivateControllerMode();

      // Check for other connected gamepads
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (gp) {
          this.gamepadIndex = gp.index;
          this.activateControllerMode();
          return;
        }
      }

      // No gamepads left
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }
  },

  activateControllerMode() {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('controller-active');
    this.updateFocusableElements();
    if (this.focusableElements.length > 0 && !this.focusedElement) {
      this.setFocus(this.focusableElements[0]);
    }
    this.updatePrompts();
    debugLog('[GAMEPAD] Controller mode activated');
  },

  deactivateControllerMode() {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('controller-active');
    this.clearFocus();
    debugLog('[GAMEPAD] Controller mode deactivated (mouse input detected)');
  },

  // Main polling loop
  poll() {
    if (this.gamepadIndex === null) return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;

    const now = Date.now();
    if (now - this.lastInputTime < this.inputCooldown) return;

    // Check buttons
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed;
      const wasPressed = this.buttonStates[i] || false;

      if (pressed && !wasPressed) {
        this.onButtonPress(i);
        this.lastInputTime = now;
      }

      this.buttonStates[i] = pressed;
    }

    // Check analog sticks (left stick for navigation)
    const leftX = gp.axes[0] || 0;
    const leftY = gp.axes[1] || 0;

    if (Math.abs(leftX) > this.axisDeadzone || Math.abs(leftY) > this.axisDeadzone) {
      // Determine primary direction
      if (Math.abs(leftX) > Math.abs(leftY)) {
        this.onDirection(leftX > 0 ? 'right' : 'left');
      } else {
        this.onDirection(leftY > 0 ? 'down' : 'up');
      }
      this.lastInputTime = now;
    }
  },

  onButtonPress(buttonIndex) {
    // Activate controller mode on any button press
    if (!this.active) {
      this.activateControllerMode();
    }

    switch (buttonIndex) {
      case this.BUTTONS.A:
        this.confirmSelection();
        break;
      case this.BUTTONS.B:
        this.goBack();
        break;
      case this.BUTTONS.Y:
        this.toggleTooltip(); // Y = toggle tooltip on focused element
        break;
      case this.BUTTONS.START:
        this.openMenu(); // Start = open settings menu
        break;
      case this.BUTTONS.DPAD_UP:
        this.onDirection('up');
        break;
      case this.BUTTONS.DPAD_DOWN:
        this.onDirection('down');
        break;
      case this.BUTTONS.DPAD_LEFT:
        this.onDirection('left');
        break;
      case this.BUTTONS.DPAD_RIGHT:
        this.onDirection('right');
        break;
      case this.BUTTONS.LB:
        this.cycleUnit('prev'); // LB = previous unit (hero/enemy)
        break;
      case this.BUTTONS.RB:
        this.cycleUnit('next'); // RB = next unit (hero/enemy)
        break;
      case this.BUTTONS.LT:
        this.cycleSigil('prev'); // LT = previous sigil on focused unit
        break;
      case this.BUTTONS.RT:
        this.cycleSigil('next'); // RT = next sigil on focused unit
        break;
    }
  },

  onDirection(dir) {
    if (!this.active) {
      this.activateControllerMode();
      return;
    }

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) return;

    // Play navigation sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    if (!this.focusedElement || !document.body.contains(this.focusedElement)) {
      // No focus or element removed - focus first element
      this.setFocus(this.focusableElements[0]);
      return;
    }

    // Find next element in direction using spatial navigation
    const next = this.findNextElement(dir);
    if (next) {
      this.setFocus(next);
    }
  },

  findNextElement(dir) {
    if (!this.focusedElement) return this.focusableElements[0];

    const current = this.focusedElement.getBoundingClientRect();
    const currentCenter = {
      x: current.left + current.width / 2,
      y: current.top + current.height / 2
    };

    let bestCandidate = null;
    let bestScore = Infinity;

    for (const el of this.focusableElements) {
      if (el === this.focusedElement) continue;

      const rect = el.getBoundingClientRect();
      const elCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      // Calculate direction vector
      const dx = elCenter.x - currentCenter.x;
      const dy = elCenter.y - currentCenter.y;

      // Check if element is in the right direction
      let inDirection = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      switch (dir) {
        case 'up':
          inDirection = dy < -10;
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
          break;
        case 'down':
          inDirection = dy > 10;
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
          break;
        case 'left':
          inDirection = dx < -10;
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
          break;
        case 'right':
          inDirection = dx > 10;
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
          break;
      }

      if (!inDirection) continue;

      // Score: prefer closer elements, with penalty for off-axis distance
      const score = primaryDist + secondaryDist * 2;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = el;
      }
    }

    // If no element in direction, wrap around
    if (!bestCandidate) {
      const idx = this.focusableElements.indexOf(this.focusedElement);
      if (dir === 'down' || dir === 'right') {
        bestCandidate = this.focusableElements[(idx + 1) % this.focusableElements.length];
      } else {
        bestCandidate = this.focusableElements[(idx - 1 + this.focusableElements.length) % this.focusableElements.length];
      }
    }

    return bestCandidate;
  },

  setFocus(el) {
    this.clearFocus();
    if (!el) return;

    this.focusedElement = el;
    el.classList.add('controller-focus');

    // Scroll into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  },

  clearFocus() {
    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
    }
    this.focusedElement = null;
  },

  confirmSelection() {
    if (!this.focusedElement) {
      this.updateFocusableElements();
      if (this.focusableElements.length > 0) {
        this.setFocus(this.focusableElements[0]);
      }
      return;
    }

    // Play confirm sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Trigger click on focused element
    this.focusedElement.click();

    // Update focus after action (DOM might have changed)
    setTimeout(() => {
      this.updateFocusableElements();
      if (this.focusableElements.length > 0 && !document.body.contains(this.focusedElement)) {
        this.setFocus(this.focusableElements[0]);
      }
      this.updatePrompts();
    }, 100);
  },

  goBack() {
    // Play back sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Check for confirm modal (B button cancels)
    if (typeof confirmModalCallback === 'function') {
      confirmModalCallback();
      return;
    }

    // Check for modal/menu close buttons
    const closeBtn = document.querySelector('.modal-container .btn[onclick*="close"]') ||
                     document.querySelector('.modal-container .btn[onclick*="Close"]') ||
                     document.querySelector('[onclick*="closeSettingsMenu"]') ||
                     document.querySelector('[onclick*="closeDebugMenu"]');

    if (closeBtn) {
      closeBtn.click();
      setTimeout(() => this.updateFocusableElements(), 100);
      return;
    }

    // Check for cancel button
    const cancelBtn = document.querySelector('.btn[onclick*="cancel"]') ||
                      document.querySelector('.btn[onclick*="Cancel"]') ||
                      document.querySelector('.btn.secondary[onclick*="Back"]');

    if (cancelBtn) {
      cancelBtn.click();
      setTimeout(() => this.updateFocusableElements(), 100);
      return;
    }

    // If in combat with pending action, call cancelAction
    if (typeof S !== 'undefined' && S.pending && typeof cancelAction === 'function') {
      cancelAction();
      setTimeout(() => this.updateFocusableElements(), 100);
    }
  },

  openMenu() {
    // Play menu sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Open settings menu
    if (typeof showSettingsMenu === 'function') {
      showSettingsMenu();
      setTimeout(() => {
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
          this.setFocus(this.focusableElements[0]);
        }
      }, 100);
    }
  },

  // Toggle tooltip on focused element (Y button)
  toggleTooltip() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // If tooltip is already visible, hide it
    if (this.tooltipVisible) {
      if (typeof hideTooltip === 'function') {
        hideTooltip();
      }
      if (this.tooltipElement) {
        this.tooltipElement.classList.remove('controller-tooltip-active');
      }
      this.tooltipVisible = false;
      this.tooltipElement = null;
      return;
    }

    // Try to show tooltip for focused element
    if (!this.focusedElement) return;

    // Check if focused element is a sigil or has tooltip data
    const sigilEl = this.focusedElement.classList.contains('sigil') ? this.focusedElement :
                    this.focusedElement.querySelector('.sigil');

    if (sigilEl) {
      // Extract sigil name from the element's onmouseenter or data
      const mouseEnter = sigilEl.getAttribute('onmouseenter');
      if (mouseEnter) {
        const match = mouseEnter.match(/showTooltip\('([^']+)'/);
        if (match && typeof showTooltip === 'function') {
          const sigilName = match[1];
          // Extract level if present
          const levelMatch = mouseEnter.match(/,\s*(\d+)\)/);
          const level = levelMatch ? parseInt(levelMatch[1]) : undefined;
          showTooltip(sigilName, sigilEl, level);
          this.tooltipVisible = true;
          this.tooltipElement = sigilEl;
          sigilEl.classList.add('controller-tooltip-active');
          return;
        }
      }
    }

    // Check for card with sigils (show first sigil's tooltip)
    const cardSigil = this.focusedElement.querySelector('.sigil');
    if (cardSigil) {
      const mouseEnter = cardSigil.getAttribute('onmouseenter');
      if (mouseEnter) {
        const match = mouseEnter.match(/showTooltip\('([^']+)'/);
        if (match && typeof showTooltip === 'function') {
          showTooltip(match[1], cardSigil);
          this.tooltipVisible = true;
          this.tooltipElement = cardSigil;
          cardSigil.classList.add('controller-tooltip-active');
        }
      }
    }
  },

  // Cycle between units: heroes and enemies (LB/RB)
  cycleUnit(direction) {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Hide any active tooltip when switching units
    if (this.tooltipVisible) {
      if (typeof hideTooltip === 'function') hideTooltip();
      if (this.tooltipElement) this.tooltipElement.classList.remove('controller-tooltip-active');
      this.tooltipVisible = false;
      this.tooltipElement = null;
    }

    // Collect all unit cards (heroes first, then enemies)
    const heroCards = Array.from(document.querySelectorAll('.card.hero'));
    const enemyCards = Array.from(document.querySelectorAll('.card.enemy'));
    const allUnits = [...heroCards, ...enemyCards];

    if (allUnits.length === 0) return;

    // Find current focused unit
    let currentIdx = allUnits.findIndex(el =>
      el === this.focusedElement || el.contains(this.focusedElement)
    );

    if (currentIdx === -1) {
      // Not on a unit, start with first
      currentIdx = 0;
    } else {
      // Move to next/prev
      if (direction === 'next') {
        currentIdx = (currentIdx + 1) % allUnits.length;
      } else {
        currentIdx = (currentIdx - 1 + allUnits.length) % allUnits.length;
      }
    }

    this.currentUnitIndex = currentIdx;
    this.currentSigilIndex = 0; // Reset sigil index when changing units
    this.setFocus(allUnits[currentIdx]);
  },

  // Cycle through sigils on the currently focused unit (LT/RT)
  cycleSigil(direction) {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Find the card containing the focused element or focus a card first
    let card = this.focusedElement;
    if (!card) return;

    // If focused element is not a card, find parent card
    if (!card.classList.contains('card')) {
      card = card.closest('.card');
    }
    if (!card) return;

    // Get all sigils in this card
    const sigils = Array.from(card.querySelectorAll('.sigil'));
    if (sigils.length === 0) return;

    // Find current sigil index
    let currentIdx = sigils.findIndex(el =>
      el === this.focusedElement || el.classList.contains('controller-tooltip-active')
    );

    if (currentIdx === -1) {
      currentIdx = 0;
    } else {
      if (direction === 'next') {
        currentIdx = (currentIdx + 1) % sigils.length;
      } else {
        currentIdx = (currentIdx - 1 + sigils.length) % sigils.length;
      }
    }

    this.currentSigilIndex = currentIdx;
    const targetSigil = sigils[currentIdx];

    // Hide previous tooltip
    if (this.tooltipVisible && this.tooltipElement) {
      if (typeof hideTooltip === 'function') hideTooltip();
      this.tooltipElement.classList.remove('controller-tooltip-active');
    }

    // Show tooltip for new sigil
    const mouseEnter = targetSigil.getAttribute('onmouseenter');
    if (mouseEnter) {
      const match = mouseEnter.match(/showTooltip\('([^']+)'/);
      if (match && typeof showTooltip === 'function') {
        const sigilName = match[1];
        const levelMatch = mouseEnter.match(/,\s*(\d+)\)/);
        const level = levelMatch ? parseInt(levelMatch[1]) : undefined;
        showTooltip(sigilName, targetSigil, level);
        this.tooltipVisible = true;
        this.tooltipElement = targetSigil;
        targetSigil.classList.add('controller-tooltip-active');
      }
    }

    // If the sigil is clickable, focus it
    if (targetSigil.classList.contains('clickable') || targetSigil.hasAttribute('onclick')) {
      this.setFocus(targetSigil);
    }
  },

  // Save focus state before DOM updates
  saveFocusState() {
    if (this.focusedElement) {
      this.lastFocusedId = this.focusedElement.id || null;
      // Also try to save a descriptor for non-id elements
      if (!this.lastFocusedId && this.focusedElement.classList.contains('card')) {
        const heroId = this.focusedElement.id;
        if (heroId) this.lastFocusedId = heroId;
      }
    }
  },

  // Restore focus after DOM updates
  restoreFocusState() {
    if (!this.active) return;

    setTimeout(() => {
      this.updateFocusableElements();

      // Try to restore by ID
      if (this.lastFocusedId) {
        const el = document.getElementById(this.lastFocusedId);
        if (el && this.focusableElements.includes(el)) {
          this.setFocus(el);
          return;
        }
      }

      // Fallback to first focusable
      if (this.focusableElements.length > 0) {
        this.setFocus(this.focusableElements[0]);
      }

      this.updatePrompts();
    }, 50);
  },

  updateFocusableElements() {
    // Find all focusable elements in order of appearance
    const selectors = [
      // Buttons
      '.btn:not(.disabled)',
      // Choice options
      '.choice',
      // Clickable cards (heroes, enemies)
      '.card[onclick]',
      '.card.hero:not(.acted)',
      '.card.enemy.targetable',
      '.card.hero.targetable',
      // Clickable sigils
      '.sigil.clickable',
      '.sigil[onclick]',
      // Modal checkboxes
      '.modal-checkbox-label',
      // Header buttons
      '.header button',
      // Generic clickable elements
      '[onclick]:not(script)',
      // Links
      'a[href]'
    ];

    const elements = new Set();

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach(el => {
        // Check if element is visible and not in rotate prompt or modal overlay
        if (el.offsetParent !== null &&
            !el.closest('#rotatePrompt') &&
            !el.classList.contains('disabled') &&
            !el.classList.contains('modal-overlay') &&
            !el.classList.contains('confirm-modal-overlay') &&
            el.style.display !== 'none' &&
            el.style.visibility !== 'hidden') {
          elements.add(el);
        }
      });
    }

    // Sort by visual position (top-to-bottom, left-to-right)
    this.focusableElements = Array.from(elements).sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();

      // Group by approximate rows (within 30px vertical)
      const rowDiff = Math.abs(rectA.top - rectB.top);
      if (rowDiff > 30) {
        return rectA.top - rectB.top;
      }
      return rectA.left - rectB.left;
    });
  },

  updatePrompts() {
    const promptsEl = document.getElementById('controllerPrompts');
    if (!promptsEl) return;

    // Determine context and update prompts
    const hasModal = document.querySelector('.modal-container');
    const inCombat = typeof S !== 'undefined' && S.heroes && S.enemies && S.enemies.length > 0;
    const hasPending = typeof S !== 'undefined' && S.pending;
    const hasCards = document.querySelectorAll('.card').length > 0;

    let prompts = [
      { btn: 'dpad', label: 'Move' },
      { btn: 'a', label: 'Select' }
    ];

    if (hasModal) {
      prompts.push({ btn: 'b', label: 'Close' });
    } else if (hasPending) {
      prompts.push({ btn: 'b', label: 'Cancel' });
    } else {
      prompts.push({ btn: 'b', label: 'Back' });
    }

    // Y = tooltip (only show when cards/sigils visible)
    if (hasCards || inCombat) {
      prompts.push({ btn: 'y', label: 'Tooltip' });
    }

    // Start = menu
    prompts.push({ btn: 'start', label: 'Menu' });

    // Combat-specific controls
    if (inCombat && !hasModal) {
      prompts.push({ btn: 'lb', label: '←Unit' });
      prompts.push({ btn: 'rb', label: 'Unit→' });
      prompts.push({ btn: 'lt', label: '←Sigil' });
      prompts.push({ btn: 'rt', label: 'Sigil→' });
    }

    // Build HTML
    promptsEl.innerHTML = prompts.map(p => {
      const btnClass = p.btn;
      const displayLabel = {
        'dpad': 'D-Pad',
        'lb': 'LB',
        'rb': 'RB',
        'lt': 'LT',
        'rt': 'RT',
        'start': '☰'
      }[p.btn] || p.btn.toUpperCase();

      return `<div class="controller-prompt"><span class="controller-btn ${btnClass}">${displayLabel}</span> ${p.label}</div>`;
    }).join('');
  }
};

// ===== INIT =====
window.onload = () => {
debugLog('[FROGGLE] window.onload fired');
// Check for last used slot
const lastSlot = localStorage.getItem('froggle8_current_slot');
if(lastSlot) {
const slot = parseInt(lastSlot);
debugLog('[FROGGLE] Found last used slot:', slot);
// Try to load slot-specific permanent data
const permData = localStorage.getItem(`froggle8_permanent_slot${slot}`);
if(permData) {
try {
const j = JSON.parse(permData);
S.gold = j.gold || 0;
S.goingRate = j.goingRate || 1;
S.startingXP = j.startingXP || 0;
S.sig = j.sig || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.sigUpgradeCounts = j.sigUpgradeCounts || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.ancientStatueDeactivated = j.ancientStatueDeactivated || false;
S.ghostBoysConverted = j.ghostBoysConverted || false;
S.pedestal = j.pedestal || [];
S.hasReachedFloor20 = j.hasReachedFloor20 || false;
S.fuUnlocked = j.fuUnlocked || j.effedUnlocked || false; // Support old save format
S.tapoUnlocked = j.tapoUnlocked || false;
S.runNumber = j.runNumber || 1;
S.runsAttempted = j.runsAttempted || 0;
S.helpTipsDisabled = j.helpTipsDisabled || false;
S.tooltipsDisabled = j.tooltipsDisabled || false;
S.usedDeathQuotes = j.usedDeathQuotes || [];
S.controllerDisabled = j.controllerDisabled || false;
if(j.tutorialFlags) Object.assign(S.tutorialFlags, j.tutorialFlags);
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
debugLog('[FROGGLE] loadPermanent complete, S.runNumber:', S.runNumber, 'S.helpTipsDisabled:', S.helpTipsDisabled);
initToastLog(); // Initialize toast log UI
GamepadController.init(); // Initialize Steam Deck / controller support
mainTitlePage();
debugLog('[FROGGLE] mainTitlePage called');
};

// Global error handler for image loading failures
window.addEventListener('error', (e) => {
if(e.target && e.target.tagName === 'IMG') {
console.error('[FROGGLE] IMAGE LOAD FAILED:', e.target.src);
console.error('[FROGGLE] Current location:', window.location.href);
console.error('[FROGGLE] Image path:', e.target.getAttribute('src'));
} else if(e.message) {
console.error('[FROGGLE] JAVASCRIPT ERROR:', e.message);
console.error('[FROGGLE] File:', e.filename, 'Line:', e.lineno, 'Col:', e.colno);
console.error('[FROGGLE] Stack:', e.error ? e.error.stack : 'No stack trace');
}
}, true);

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
console.error('[FROGGLE] UNHANDLED PROMISE REJECTION:', e.reason);
