// ===== GAME STATE =====
let S = {
// ===== HERO STATE =====
heroes: [],
sig: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
tempSigUpgrades: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
sigUpgradeCounts: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},

// ===== GAME PROGRESSION =====
floor: 1,
gameMode: 'Standard', // 'Standard' or 'fu'
runNumber: 1,
currentSlot: null,
gold: 0,
xp: 0,
levelUpCount: 0,
goingRate: 1,
runsAttempted: 0,
startingXP: 0,

// ===== COMBAT STATE (resets each combat) =====
activeIdx: -1,      // Currently acting hero index (-1 = none)
acted: [],          // Array of hero indices that have acted this turn
locked: false,      // UI locked during enemy turn
pending: null,      // Currently selected action (e.g., 'Attack', 'Shield')
targets: [],        // Selected target IDs for action
currentInstanceTargets: [], // Targets for current multi-instance iteration
instancesRemaining: 0,      // How many instances left to target
totalInstances: 0,          // Total instances for this action
lastActions: {},            // Last action taken by each hero (for Asterisk)
enemies: [],        // Current enemy array
recruits: [],       // Recruited enemies (fight for player)
round: 1,           // Current combat round
turn: 'player',     // 'player' or 'enemy'
combatXP: 0,        // XP earned this combat
combatGold: 0,      // Gold earned this combat
selectingEncampmentTargets: false, // Special state for Encampment encounter
encampmentEarlyKills: 0,           // Number of enemies to kill early
d20HeroIdx: -1,     // Hero index for D20 action targeting
grappleRepeats: 0,  // Number of grapple repeats for recoil calculation
grappleLevel: 0,    // Grapple level for recoil calculation
turnDamage: 0,      // Damage dealt during current hero's turn (for damage counter)

// ===== NEUTRAL ENCOUNTER STATE (resets each encounter) =====
neutralDeck: [],    // Deck of neutral encounter IDs
lastNeutral: null,  // Last neutral encountered (for non-repeat)
ambushed: false,    // Whether current combat is an ambush

// ===== TEMPORARY NEUTRAL STATE (resets on death) =====
silverKeyHeld: false,     // Silver key from Ghost Boys
oracleHero: null,         // Hero chosen at Oracle
oracleRoll: null,         // Roll result at Oracle
oracleStat: null,         // Stat chosen at Oracle
wizardSigil: null,        // Sigil being tested at Wizard

// ===== PERSISTENT STATE (survives death, saved in permanent storage) =====
ancientStatueDeactivated: false, // Ancient Statue one-time choice made
ghostBoysConverted: false,       // Ghost Boys converted (no longer hostile)
royalTitle: 'Prince',          // Title preference for royal quest line (Prince/Princess)
pedestal: [],                    // Champion hero figurines [{hero, mode, stats}]
hasAncientStatuette: false,
hasReachedFloor20: false,        // Unlocks blue portal in Ribbleton
fuUnlocked: false,
tapoUnlocked: false,             // Unlocked after first FU victory
pondHistory: [],                 // Run history for "The Pond" - [{runNumber, heroes, floorReached, gameMode, outcome, killedBy, timestamp}]

// ===== UI STATE =====
toastHistory: [],               // Array of recent toast messages
toastLogExpanded: false,        // Whether toast log is expanded
toastLogVisible: true,          // Whether toast log is shown
tooltipsDisabled: false,        // Whether sigil tooltips are disabled
helpTipsDisabled: false,        // Whether tutorial help tips are disabled
animationSpeed: 1,              // Animation speed: 1 (normal), 2 (fast), 4 (faster), 0 (instant)
controllerDisabled: false,      // Whether gamepad/controller support is disabled
inRibbleton: false,             // Whether player is in Ribbleton hub

// ===== DEBUG STATE =====
debugMode: false,       // Debug mode toggle
oopsAll20s: false,      // Debug cheat: all d20 rolls = 20

// ===== TUTORIAL STATE (permanent flags) =====
tutorialFlags: {
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
last_stand_warning: false,
shield_persistence: false,
recruit_intro: false,
run2_hero_lock: false,
first_victory_sequence: false,
first_fu_victory: false,
pedestal_first_placement: false,
tapo_victory_message: false
},
usedDeathQuotes: [], // Track which death quotes have been shown

// ===== SUSPEND/AUTOSAVE STATE =====
suspended: false,         // Whether game is currently suspended
lastAutosave: 0,          // Timestamp of last autosave
inCombat: false,          // Whether player is in active combat (for autosave)
combatEnding: false       // Guard flag to prevent multiple checkCombatEnd calls
};

let sel = [];

// ===== RIBBLETON TUTORIAL STATE =====
let tutorialState = null;
// Tutorial state tracks scripted Ribbleton tutorial progress
// {
//   stage: 'warrior_attack' | 'targeting_wolf' | 'healer_d20' | 'd20_menu' | 'enemy_turn_explained' |
//          'healer_heal' | 'expand_targets' | 'finish_wolf' | 'shield_sigil' | 'handoff' | 'free',
//   wolfDamaged: boolean,
//   wolfKilled: boolean,
//   goblinKilled: boolean,
//   round: number
// }

// ===== HELPERS =====
function getFloorBackground(floor) {
// Progressive darkening from floor 1 (light brown) to floor 19 (black)
const colors = [
'#d9cab1', // Floor 1 - light brown (default)
'#cfc0a9', '#c5b6a1', '#bbac99', '#b1a291', '#a79889', // Floors 2-6
'#9d8e81', '#938479', '#897a71', '#7f7069', '#756661', // Floors 7-11
'#6b5c59', '#615251', '#574849', '#4d3e41', '#433439', // Floors 12-16
'#392a31', '#2f2029', '#251621', '#1b0c19' // Floors 17-20
];
return colors[Math.min(floor - 1, colors.length - 1)] || colors[0];
}

function renderHeroCard(hero, idx, onclickHandler, extraInfo = '') {
const hp = hero.ls ? `Last Stand (T${hero.lst+1})` : `${hero.h}/${hero.m}❤`;
const extra = [];
if(hero.sh > 0) extra.push(`${hero.sh}🛡`);
if(hero.g > 0) extra.push(`${hero.g}${sigilIconOnly('Ghost')}`);
return `<div class="card hero hero-selectable" onclick="${onclickHandler}" style="cursor:pointer;margin-bottom:0.75rem">
<div style="font-weight:bold;text-align:center;margin-bottom:0.25rem">${hero.n}</div>
<div class="card-stats">${hero.p}⚡ | ${hp}${extra.length>0?' | '+extra.join(' '):''}${extraInfo}</div>
</div>`;
}

function upd() {
const floorEl = document.getElementById('floor');
const roundEl = document.getElementById('round');
const roundInfoEl = document.getElementById('roundInfo');
const locationLabelEl = document.getElementById('locationLabel');

// Update location display based on game state
if(S.floor === 0 && tutorialState) {
// Tutorial mode
floorEl.textContent = '';
locationLabelEl.textContent = 'Tutorial';
roundInfoEl.style.display = S.round > 0 ? '' : 'none';
roundEl.textContent = S.round || '';
} else if(S.inRibbleton) {
// In Ribbleton hub (before entering dungeon)
floorEl.textContent = '';
locationLabelEl.textContent = 'Ribbleton';
roundInfoEl.style.display = 'none';
} else if(!S.heroes || S.heroes.length === 0) {
// Hero selection screen (no heroes chosen yet)
floorEl.textContent = '';
locationLabelEl.textContent = 'Hero Select';
roundInfoEl.style.display = 'none';
} else if(S.enemies && S.enemies.length > 0) {
// In combat
floorEl.textContent = S.floor;
locationLabelEl.textContent = 'Floor';
roundInfoEl.style.display = '';
roundEl.textContent = S.round || '1';
} else {
// Between combats (neutral floors, level up, etc.)
floorEl.textContent = S.floor;
locationLabelEl.textContent = 'Floor';
roundInfoEl.style.display = 'none';
}

document.getElementById('gold').textContent = S.gold;
// Show combat XP during combat, cumulative XP otherwise
if(S.combatXP !== undefined && S.combatXP > 0) {
document.getElementById('xp').textContent = `${S.xp} (+${S.combatXP})`;
} else {
document.getElementById('xp').textContent = S.xp;
}
// Show/hide debug button
const debugBtn = document.getElementById('debugBtn');
if(debugBtn) debugBtn.style.display = S.debugMode ? 'block' : 'none';
// Update background color based on floor
const gameArea = document.getElementById('gameView');
if(gameArea) gameArea.style.background = getFloorBackground(S.floor);
}

function triggerHitAnimation(targetId) {
const card = document.getElementById(targetId);
if(card) {
card.classList.add('hit-flash');
setTimeout(() => {
const el = document.getElementById(targetId);
if(el) el.classList.remove('hit-flash');
}, ANIMATION_TIMINGS.DAMAGE_FLASH);
}
}

function triggerAttackAnimation(attackerId) {
const card = document.getElementById(attackerId);
if(card) {
card.classList.add('attack-slide');
setTimeout(() => {
const el = document.getElementById(attackerId);
if(el) el.classList.remove('attack-slide');
}, ANIMATION_TIMINGS.ATTACK_SLIDE);
}
}

function triggerEnemyAttackAnimation(attackerId) {
const card = document.getElementById(attackerId);
if(card) {
card.classList.add('enemy-attack-slide');
setTimeout(() => {
const el = document.getElementById(attackerId);
if(el) el.classList.remove('enemy-attack-slide');
}, ANIMATION_TIMINGS.ATTACK_SLIDE);
}
}

function triggerHealAnimation(targetId, healAmount = 0) {
const card = document.getElementById(targetId);
if(card) {
card.classList.add('heal-flash');
// JUICE: Sound effects - froggy gulp + heal chime
SoundFX.play('gulp');
setTimeout(() => SoundFX.play('heal'), 100);
// JUICE: Floating heal number
if (healAmount > 0) {
  showFloatingNumber(targetId, `+${healAmount}`, 'heal');
}
// Add healing cross overlay
const cross = document.createElement('div');
cross.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:3rem;color:#22c55e;text-shadow:0 0 10px #22c55e;pointer-events:none;z-index:1000;animation:heal-cross-fade 0.48s ease';
cross.textContent = '✚';
card.appendChild(cross);
setTimeout(() => {
const el = document.getElementById(targetId);
if(el) el.classList.remove('heal-flash');
if(cross.parentNode) cross.remove();
}, ANIMATION_TIMINGS.HEAL_FLASH);
}
}

function triggerShieldAnimation(targetId, shieldAmount = 0) {
const card = document.getElementById(targetId);
if(card) {
card.classList.add('shield-flash');
// JUICE: Sound effects - froggy bubble + shield chime
SoundFX.play('bubble');
setTimeout(() => SoundFX.play('shield'), 80);
// JUICE: Floating shield number
if (shieldAmount > 0) {
  showFloatingNumber(targetId, `+${shieldAmount}🛡`, 'shield');
}
setTimeout(() => {
const el = document.getElementById(targetId);
if(el) el.classList.remove('shield-flash');
}, ANIMATION_TIMINGS.SHIELD_FLASH);
}
}

function addBonusTurnStack(cardId, count) {
const card = document.getElementById(cardId);
if(!card || count <= 0) return;
// Remove existing stack if any
removeBonusTurnStack(cardId);
// Create stack container
const stackContainer = document.createElement('div');
stackContainer.className = 'bonus-turn-stack';
stackContainer.id = `stack-${cardId}`;
// Add stacked cards (show just the corners)
for(let i = 0; i < Math.min(count, 5); i++) {
const stackCard = document.createElement('div');
stackCard.className = 'bonus-turn-card';
stackCard.style.transform = `translate(${-3 - i*3}px, ${-3 - i*3}px)`;
stackCard.style.zIndex = -1 - i;
stackContainer.appendChild(stackCard);
}
card.appendChild(stackContainer);
}

function removeBonusTurnStack(cardId, animated = false) {
const stack = document.getElementById(`stack-${cardId}`);
if(!stack) return;
if(animated && stack.children.length > 0) {
// Animate the top card sliding out
const topCard = stack.children[0];
topCard.classList.add('sliding-out');
setTimeout(() => {
topCard.remove();
// If no more cards, remove the whole stack
if(stack.children.length === 0) {
stack.remove();
}
}, 300);
} else {
stack.remove();
}
}

function updateBonusTurnStack(cardId, count) {
if(count <= 0) {
removeBonusTurnStack(cardId, true);
} else {
const stack = document.getElementById(`stack-${cardId}`);
if(!stack) {
addBonusTurnStack(cardId, count);
} else {
// Adjust stack size
const currentCount = stack.children.length;
if(currentCount > count) {
// Remove excess cards with animation
removeBonusTurnStack(cardId, true);
setTimeout(() => addBonusTurnStack(cardId, count), ANIMATION_TIMINGS.BONUS_TURN_STACK);
} else if(currentCount < count) {
// Add more cards
addBonusTurnStack(cardId, count);
}
}
}
}

// Track active toasts for stacking
let activeToasts = [];

function toast(msg, dur=1200) {
// Add to history (strip HTML for text log)
const textMsg = msg.replace(/<[^>]*>/g, '');
S.toastHistory.unshift(textMsg);
if(S.toastHistory.length > 20) S.toastHistory = S.toastHistory.slice(0, 20); // Keep last 20
updateToastLog();
// Show toast popup (supports HTML)
const t = document.createElement('div');
t.className = 'toast';
t.innerHTML = msg;
// Calculate offset based on existing toasts
const toastHeight = 50; // Approximate height + gap
const offset = activeToasts.length * toastHeight;
t.style.bottom = `${20 + offset}px`;
document.body.appendChild(t);
activeToasts.push(t);
setTimeout(() => t.classList.add('show'), 10);
setTimeout(() => {
t.classList.remove('show');
setTimeout(() => {
t.remove();
activeToasts = activeToasts.filter(toast => toast !== t);
// Reposition remaining toasts
activeToasts.forEach((toast, idx) => {
toast.style.bottom = `${20 + idx * toastHeight}px`;
});
}, ANIMATION_TIMINGS.TOAST_FADE);
}, dur);
}

// Controller-friendly confirm modal to replace browser confirm()
let confirmModalCallback = null;
function showConfirmModal(message, onConfirm, onCancel) {
  // Remove existing modal if any
  const existingOverlay = document.querySelector('.confirm-modal-overlay');
  const existingModal = document.querySelector('.confirm-modal');
  if (existingOverlay) existingOverlay.remove();
  if (existingModal) existingModal.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'confirm-modal-overlay';

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  modal.innerHTML = `
    <h3>Confirm</h3>
    <p>${message}</p>
    <div class="confirm-modal-buttons">
      <button class="btn confirm-btn-yes" style="background:linear-gradient(135deg,#22c55e,#16a34a);min-width:100px">Yes</button>
      <button class="btn confirm-btn-no" style="background:linear-gradient(135deg,#ef4444,#dc2626);min-width:100px">No</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const yesBtn = modal.querySelector('.confirm-btn-yes');
  const noBtn = modal.querySelector('.confirm-btn-no');

  function cleanup() {
    overlay.remove();
    modal.remove();
    confirmModalCallback = null;
    // Restore controller focus
    if (typeof GamepadController !== 'undefined' && GamepadController.active) {
      GamepadController.updateFocusableElements();
    }
  }

  yesBtn.onclick = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };

  noBtn.onclick = () => {
    cleanup();
    if (onCancel) onCancel();
  };

  // Store callback for controller B button to cancel
  confirmModalCallback = () => {
    cleanup();
    if (onCancel) onCancel();
  };

  // Keyboard support for desktop users
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      document.removeEventListener('keydown', handleKeydown);
      if (onCancel) onCancel();
    }
    // Trap focus within modal (Tab cycles between Yes and No)
    if (e.key === 'Tab') {
      const focusedEl = document.activeElement;
      if (e.shiftKey && focusedEl === yesBtn) {
        e.preventDefault();
        noBtn.focus();
      } else if (!e.shiftKey && focusedEl === noBtn) {
        e.preventDefault();
        yesBtn.focus();
      }
    }
  }
  document.addEventListener('keydown', handleKeydown);

  // Update cleanup to remove keyboard listener
  const originalCleanup = cleanup;
  cleanup = function() {
    document.removeEventListener('keydown', handleKeydown);
    originalCleanup();
  };

  // Focus the Yes button for controller navigation
  if (typeof GamepadController !== 'undefined' && GamepadController.active) {
    GamepadController.updateFocusableElements();
    GamepadController.setFocus(yesBtn);
  } else {
    yesBtn.focus();
  }
}

function initToastLog() {
const existing = document.getElementById('toastLog');
if(existing) return;
const log = document.createElement('div');
log.id = 'toastLog';
log.className = 'toast-log';
document.body.appendChild(log);
updateToastLog();
}

function toggleToastLog() {
const log = document.getElementById('toastLog');
if(!log) return;
log.classList.toggle('show');
}

function toggleToastLogVisibility(visible) {
const log = document.getElementById('toastLog');
if(log) {
if(visible) {
log.classList.add('show');
} else {
log.classList.remove('show');
}
}
}

function updateToastLog() {
const log = document.getElementById('toastLog');
if(!log) return;
let html = `<div class="toast-log-header">
<span style="font-size:1rem">🪵 Combat Log</span>
<button onclick="toggleToastLog()" style="background:#ef4444;border:2px solid #000;border-radius:4px;padding:0.25rem 0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem">Close</button>
</div>`;
html += '<div class="toast-log-entries">';
S.toastHistory.forEach((msg, idx) => {
html += `<div class="toast-log-entry ${idx === 0 ? 'recent' : ''}">${msg}</div>`;
});
if(S.toastHistory.length === 0) {
html += '<div class="toast-log-entry">No messages yet</div>';
}
html += '</div>';
log.innerHTML = html;
}

function showTutorialPop(flagName, message, onDismiss) {
debugLog('[TUTORIAL] showTutorialPop called:', flagName, 'Already shown:', S.tutorialFlags[flagName]);
if(S.helpTipsDisabled || S.tutorialFlags[flagName]) {
debugLog('[TUTORIAL] Skipping pop (disabled or already shown), calling callback directly');
if(onDismiss) onDismiss();
return;
}
// Add tutorial message to toast log for reference
S.toastHistory.unshift(`📖 ${message}`);
if(S.toastHistory.length > 20) S.toastHistory = S.toastHistory.slice(0, 20);
updateToastLog();
// Create blocking modal
const backdrop = document.createElement('div');
backdrop.className = 'tutorial-modal-backdrop';
backdrop.innerHTML = `
<div class="tutorial-modal">
<h2>Tip!</h2>
<p>${message}</p>
<button onclick="dismissTutorialPop('${flagName}')">Got it!</button>
<div class="controller-hint" style="margin-top:0.5rem;font-size:0.8rem;opacity:0.7">Ⓐ to continue</div>
</div>`;
document.body.appendChild(backdrop);
debugLog('[TUTORIAL] Backdrop created and appended, total backdrops now:', document.querySelectorAll('.tutorial-modal-backdrop').length);
// Store callback for later
window.tutorialCallback = onDismiss;
}

function dismissTutorialPop(flagName) {
debugLog('[TUTORIAL] dismissTutorialPop called:', flagName);
debugLog('[TUTORIAL] Backdrops BEFORE removal:', document.querySelectorAll('.tutorial-modal-backdrop').length);
S.tutorialFlags[flagName] = true;
savePermanent();

// Remove ALL backdrops aggressively with error handling
try {
const allBackdrops = document.querySelectorAll('.tutorial-modal-backdrop');
debugLog('[TUTORIAL] Removing', allBackdrops.length, 'backdrops');
allBackdrops.forEach((b, i) => {
debugLog('[TUTORIAL] Removing backdrop', i);
b.remove();
});
} catch (error) {
console.error('[TUTORIAL] Error removing backdrops:', error);
}

// Verify it's gone
setTimeout(() => {
try {
const remaining = document.querySelectorAll('.tutorial-modal-backdrop');
debugLog('[TUTORIAL] Backdrops remaining after pop dismiss:', remaining.length);
if(remaining.length > 0) {
console.error('[TUTORIAL] ERROR: Backdrops still blocking!', remaining);
remaining.forEach(r => {
console.error('[TUTORIAL] Zombie backdrop:', r);
r.remove();
});
}

debugLog('[TUTORIAL] About to call onDismiss callback');
if(window.tutorialCallback) {
debugLog('[TUTORIAL] Calling onDismiss callback NOW');
window.tutorialCallback();
window.tutorialCallback = null;
} else {
console.warn('[TUTORIAL] No callback found!');
}
} catch (error) {
console.error('[TUTORIAL] Error in callback execution:', error);
// Still try to clear callback even if there's an error
if(window.tutorialCallback) window.tutorialCallback = null;
}
}, 50);
}

function showRecruitReplaceConfirm(oldName, newName, onKeep, onReplace) {
const backdrop = document.createElement('div');
backdrop.className = 'tutorial-modal-backdrop';
backdrop.innerHTML = `
<div class="tutorial-modal">
<h2>Replace Recruit?</h2>
<p>You already have <strong>${oldName}</strong>. Replace with <strong>${newName}</strong>?</p>
<div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem">
<button onclick="confirmRecruitReplace(false)" style="background:#666;padding:0.5rem 1rem">Keep ${oldName}</button>
<button onclick="confirmRecruitReplace(true)" style="background:#4a4;padding:0.5rem 1rem">Replace with ${newName}</button>
</div>
</div>`;
document.body.appendChild(backdrop);
window.recruitReplaceCallback = { onKeep, onReplace };
}

function confirmRecruitReplace(replace) {
const callbacks = window.recruitReplaceCallback;
document.querySelectorAll('.tutorial-modal-backdrop').forEach(b => b.remove());
window.recruitReplaceCallback = null;
if(replace && callbacks && callbacks.onReplace) callbacks.onReplace();
else if(!replace && callbacks && callbacks.onKeep) callbacks.onKeep();
}

function savePermanent() {
try {
localStorage.setItem('froggle8_permanent', JSON.stringify({
gold: S.gold,
goingRate: S.goingRate,
startingXP: S.startingXP,
sig: S.sig,
sigUpgradeCounts: S.sigUpgradeCounts,
ancientStatueDeactivated: S.ancientStatueDeactivated,
ghostBoysConverted: S.ghostBoysConverted,
pedestal: S.pedestal,
hasReachedFloor20: S.hasReachedFloor20,
fuUnlocked: S.fuUnlocked,
tapoUnlocked: S.tapoUnlocked,
runNumber: S.runNumber,
runsAttempted: S.runsAttempted,
tutorialFlags: S.tutorialFlags,
helpTipsDisabled: S.helpTipsDisabled,
tooltipsDisabled: S.tooltipsDisabled,
usedDeathQuotes: S.usedDeathQuotes,
controllerDisabled: S.controllerDisabled,
animationSpeed: S.animationSpeed,
pondHistory: S.pondHistory
}));
} catch(e) {
console.warn('[SAVE] Failed to save permanent data:', e);
if(e.name === 'QuotaExceededError' || (e.code && e.code === 22)) {
toast('Storage full! Try clearing old save slots.', 3000);
} else {
toast('Warning: Progress could not be saved', 2000);
}
}
}

function loadPermanent() {
try {
const d = localStorage.getItem('froggle8_permanent');
if(!d) return;
const j = JSON.parse(d);
S.gold = j.gold || 0;
S.goingRate = j.goingRate || 1;
S.startingXP = j.startingXP || 0;
S.sig = j.sig || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.sigUpgradeCounts = j.sigUpgradeCounts || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// One-time fix: Detect and repair old saves with starter actives at L1 (should be L0)
const starterActives = ['Attack', 'Shield', 'Heal', 'D20'];
let needsFix = false;
starterActives.forEach(sig => {
if(S.sig[sig] === 1 && S.sigUpgradeCounts[sig] === 0) {
// Starter active at L1 with no upgrades = old save format, fix it
S.sig[sig] = 0;
needsFix = true;
}
});
if(needsFix) {
debugLog('[SAVE] Fixed old save format: starter actives L1→L0');
savePermanent(); // Save the fix
}
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
S.animationSpeed = j.animationSpeed !== undefined ? j.animationSpeed : 1;
S.pondHistory = j.pondHistory || [];
if(j.tutorialFlags) {
Object.assign(S.tutorialFlags, j.tutorialFlags);
}
} catch(e) {
console.warn('[SAVE] Failed to load permanent data:', e);
// Continue with defaults if load fails
}
}

function saveGame() {
try {
localStorage.setItem('froggle8', JSON.stringify({
f:S.floor, x:S.xp, luc:S.levelUpCount,
h:S.heroes,
neutralDeck:S.neutralDeck, lastNeutral:S.lastNeutral,
hasAncientStatuette: S.hasAncientStatuette,
tempSigUpgrades: S.tempSigUpgrades,
gameMode: S.gameMode
}));
savePermanent();
} catch(e) {
console.warn('[SAVE] Failed to save game:', e);
if(e.name === 'QuotaExceededError' || (e.code && e.code === 22)) {
toast('Storage full! Try clearing old save slots.', 3000);
} else {
toast('Warning: Game could not be saved', 2000);
}
}
}

function loadGame() {
loadPermanent(); // Load persistent data first
try {
const d = localStorage.getItem('froggle8');
if(!d) return;
const j = JSON.parse(d);
S.floor=j.f; S.xp=j.x; S.levelUpCount=j.luc || 0;
S.heroes=j.h;
S.neutralDeck=j.neutralDeck || [];
S.lastNeutral=j.lastNeutral || null;
S.hasAncientStatuette = j.hasAncientStatuette || false;
S.tempSigUpgrades = j.tempSigUpgrades || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.gameMode = j.gameMode || 'Standard';
S.recruits = []; // Recruits don't persist across saves
S.heroes.forEach(h => { if(!h.ts) h.ts = []; });
upd();
startFloor(S.floor);
toast('Loaded!');
} catch(e) {
console.warn('[SAVE] Failed to load game:', e);
toast('Error loading saved game. Starting new game...', ANIMATION_TIMINGS.TOAST_LONG);
setTimeout(() => transitionScreen(title), ANIMATION_TIMINGS.TOAST_LONG);
}
}

// ===== SAVE SLOT SYSTEM =====
// Get metadata for a save slot (without loading it)
function getSlotMetadata(slot) {
try {
// Try new slot system first
let d = localStorage.getItem(`froggle8_permanent_slot${slot}`);
if(d) {
const j = JSON.parse(d);
return {
exists: true,
runsAttempted: j.runsAttempted || j.runNumber || 1,
goingRate: j.goingRate || 1,
hasActiveRun: !!localStorage.getItem(`froggle8_slot${slot}`)
};
}
// Check old system for migration
if(slot === 1) {
d = localStorage.getItem('froggle8_permanent');
if(d) {
const j = JSON.parse(d);
return {
exists: true,
runsAttempted: j.runNumber || 1,
goingRate: j.goingRate || 1,
hasActiveRun: !!localStorage.getItem('froggle8'),
needsMigration: true
};
}
}
return { exists: false };
} catch(e) {
console.warn(`[SAVE] Error reading slot ${slot}:`, e);
return { exists: false };
}
}

// Migrate old save to slot 1
function migrateOldSave() {
try {
const oldPerm = localStorage.getItem('froggle8_permanent');
const oldRun = localStorage.getItem('froggle8');
if(oldPerm) {
// Parse and fix old save data before migrating
const j = JSON.parse(oldPerm);
// Fix starter actives that were incorrectly at L1 (should be L0 for storage)
const starterActives = ['Attack', 'Shield', 'Heal', 'D20'];
if(j.sig) {
starterActives.forEach(sig => {
if(j.sig[sig] === 1) {
j.sig[sig] = 0;
// Also adjust sigUpgradeCounts if it exists
if(j.sigUpgradeCounts && j.sigUpgradeCounts[sig] > 0) {
j.sigUpgradeCounts[sig] = Math.max(0, j.sigUpgradeCounts[sig] - 1);
}
}
});
}
localStorage.setItem('froggle8_permanent_slot1', JSON.stringify(j));
localStorage.removeItem('froggle8_permanent');
debugLog('[SAVE] Migrated and fixed old save to slot 1');
}
if(oldRun) {
localStorage.setItem('froggle8_slot1', oldRun);
localStorage.removeItem('froggle8');
}
} catch(e) {
console.warn('[SAVE] Migration failed:', e);
}
}

// Load a specific slot
function loadSlot(slot) {
S.currentSlot = slot;
localStorage.setItem('froggle8_current_slot', slot.toString());
// Load permanent data
try {
const d = localStorage.getItem(`froggle8_permanent_slot${slot}`);
if(d) {
const j = JSON.parse(d);
S.gold = j.gold || 0;
S.goingRate = j.goingRate || 1;
S.runsAttempted = j.runsAttempted || j.runNumber || 1;
S.startingXP = j.startingXP || 0;
S.sig = j.sig || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.sigUpgradeCounts = j.sigUpgradeCounts || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// One-time fix: Detect and repair old saves with starter actives at L1 (should be L0)
const starterActives = ['Attack', 'Shield', 'Heal', 'D20'];
let needsFix = false;
starterActives.forEach(sig => {
if(S.sig[sig] === 1 && S.sigUpgradeCounts[sig] === 0) {
// Starter active at L1 with no upgrades = old save format, fix it
S.sig[sig] = 0;
needsFix = true;
}
});
if(needsFix) {
debugLog('[SAVE] Fixed old save format: starter actives L1→L0');
savePermanent(); // Save the fix
}
S.ancientStatueDeactivated = j.ancientStatueDeactivated || false;
S.ghostBoysConverted = j.ghostBoysConverted || false;
S.pedestal = j.pedestal || [];
S.hasReachedFloor20 = j.hasReachedFloor20 || false;
S.fuUnlocked = j.fuUnlocked || j.effedUnlocked || false; // Support old save format
S.tapoUnlocked = j.tapoUnlocked || false;
S.runNumber = j.runNumber || 1;
S.helpTipsDisabled = j.helpTipsDisabled || false;
S.tooltipsDisabled = j.tooltipsDisabled || false;
S.usedDeathQuotes = j.usedDeathQuotes || [];
if(j.tutorialFlags) Object.assign(S.tutorialFlags, j.tutorialFlags);
}
// Try to load active run
const runData = localStorage.getItem(`froggle8_slot${slot}`);
if(runData) {
const r = JSON.parse(runData);
S.floor = r.f;
S.xp = r.x;
S.levelUpCount = r.luc || 0;
S.heroes = r.h;
S.neutralDeck = r.neutralDeck || [];
S.lastNeutral = r.lastNeutral || null;
S.hasAncientStatuette = r.hasAncientStatuette || false;
S.tempSigUpgrades = r.tempSigUpgrades || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.gameMode = r.gameMode || 'Standard';
S.recruits = []; // Recruits don't persist across saves
S.heroes.forEach(h => { if(!h.ts) h.ts = []; });
upd();
startFloor(S.floor);
toast('Slot loaded!');
return true;
}
} catch(e) {
console.warn('[SAVE] Failed to load slot:', e);
}
return false;
}

// Update save functions to use current slot
const originalSavePermanent = savePermanent;
savePermanent = function() {
if(!S.currentSlot) {
console.warn('[SAVE] No currentSlot set, defaulting to slot 1');
S.currentSlot = 1;
localStorage.setItem('froggle8_current_slot', '1');
}
try {
localStorage.setItem(`froggle8_permanent_slot${S.currentSlot}`, JSON.stringify({
gold: S.gold,
goingRate: S.goingRate,
runsAttempted: S.runsAttempted,
startingXP: S.startingXP,
sig: S.sig,
sigUpgradeCounts: S.sigUpgradeCounts,
ancientStatueDeactivated: S.ancientStatueDeactivated,
ghostBoysConverted: S.ghostBoysConverted,
pedestal: S.pedestal,
hasReachedFloor20: S.hasReachedFloor20,
fuUnlocked: S.fuUnlocked,
tapoUnlocked: S.tapoUnlocked,
runNumber: S.runNumber,
tutorialFlags: S.tutorialFlags,
helpTipsDisabled: S.helpTipsDisabled,
tooltipsDisabled: S.tooltipsDisabled,
usedDeathQuotes: S.usedDeathQuotes,
controllerDisabled: S.controllerDisabled
}));
} catch(e) {
console.warn('[SAVE] Failed to save permanent data:', e);
if(e.name === 'QuotaExceededError' || (e.code && e.code === 22)) {
toast('Storage full! Try clearing old save slots.', 3000);
} else {
toast('Warning: Progress could not be saved', 2000);
}
}
};

const originalSaveGame = saveGame;
saveGame = function() {
if(!S.currentSlot) {
console.warn('[SAVE] No currentSlot set, defaulting to slot 1');
S.currentSlot = 1;
localStorage.setItem('froggle8_current_slot', '1');
}
try {
localStorage.setItem(`froggle8_slot${S.currentSlot}`, JSON.stringify({
f:S.floor, x:S.xp, luc:S.levelUpCount,
h:S.heroes,
neutralDeck:S.neutralDeck, lastNeutral:S.lastNeutral,
hasAncientStatuette: S.hasAncientStatuette,
tempSigUpgrades: S.tempSigUpgrades,
gameMode: S.gameMode
}));
savePermanent();
} catch(e) {
console.warn('[SAVE] Failed to save game:', e);
if(e.name === 'QuotaExceededError' || (e.code && e.code === 22)) {
toast('Storage full! Try clearing old save slots.', 3000);
} else {
toast('Warning: Game could not be saved', 2000);
}
}
};

// ===== AUTOSAVE SYSTEM =====
const AUTOSAVE_THROTTLE = 5000; // Minimum 5 seconds between autosaves

function autosave() {
// Only autosave if we have an active slot and are in combat
if(!S.currentSlot || !S.inCombat) return;

// Throttle autosaves
const now = Date.now();
if(now - S.lastAutosave < AUTOSAVE_THROTTLE) return;

S.lastAutosave = now;
saveGame();
debugLog('[AUTOSAVE] Game autosaved');
}

// ===== SUSPEND/RESUME SYSTEM =====
function suspendGame() {
if(S.suspended) return;
S.suspended = true;

// Immediately save if we have an active run
if(S.currentSlot && S.heroes.length > 0) {
saveGame();
debugLog('[SUSPEND] Game saved on suspend');
}

// Show suspend overlay
showSuspendOverlay();
}

function resumeGame() {
if(!S.suspended) return;
S.suspended = false;

// Hide suspend overlay
hideSuspendOverlay();

// Resume audio context if needed
if(typeof SoundFX !== 'undefined' && SoundFX.ctx && SoundFX.ctx.state === 'suspended') {
SoundFX.ctx.resume();
}

debugLog('[RESUME] Game resumed');
}

// Global reference for suspend keyboard handler cleanup
let suspendKeyHandler = null;

function showSuspendOverlay() {
// Remove any existing overlay
hideSuspendOverlay();

const overlay = document.createElement('div');
overlay.id = 'suspend-overlay';
overlay.style.cssText = `
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.9);
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
z-index: 10000;
color: white;
font-family: inherit;
`;
overlay.innerHTML = `
<div style="text-align:center">
<div style="font-size:3rem;margin-bottom:1rem">🐸</div>
<h2 style="font-size:1.5rem;margin:0 0 0.5rem 0;color:#22c55e">FROGGLE SUSPENDED</h2>
<p style="font-size:1rem;opacity:0.8;margin:0 0 1.5rem 0">Game saved. Tap or press any button to resume.</p>
<div style="font-size:0.9rem;opacity:0.6">Progress has been saved automatically.</div>
</div>
`;

// Resume on any interaction
overlay.addEventListener('click', resumeGame);
overlay.addEventListener('touchstart', resumeGame);

// Also handle keyboard for Steam Deck
suspendKeyHandler = (e) => {
resumeGame();
};
document.addEventListener('keydown', suspendKeyHandler);

// Store handler reference for cleanup (backup)
overlay._keyHandler = suspendKeyHandler;

document.body.appendChild(overlay);
}

function hideSuspendOverlay() {
// Clean up keyboard handler using global reference (most reliable)
if(suspendKeyHandler) {
document.removeEventListener('keydown', suspendKeyHandler);
suspendKeyHandler = null;
}
const overlay = document.getElementById('suspend-overlay');
if(overlay) {
// Backup cleanup via overlay reference
if(overlay._keyHandler) {
document.removeEventListener('keydown', overlay._keyHandler);
}
overlay.remove();
}
}

// Initialize visibility change listener
function initSuspendSystem() {
// Handle page visibility changes (tab switch, minimize, Steam Deck suspend)
document.addEventListener('visibilitychange', () => {
if(document.hidden) {
suspendGame();
} else {
resumeGame();
}
});

// Handle page unload (close tab, navigate away)
window.addEventListener('pagehide', () => {
if(S.currentSlot && S.heroes.length > 0) {
saveGame();
debugLog('[PAGEHIDE] Game saved before unload');
}
});

// Also handle beforeunload for older browsers
window.addEventListener('beforeunload', () => {
if(S.currentSlot && S.heroes.length > 0) {
saveGame();
}
});

debugLog('[SUSPEND] Suspend system initialized');
}

