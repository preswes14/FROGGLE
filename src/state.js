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
chosenHeroIdx: -1, // Index of "chosen one" hero (-1 = none, only set on run 2+)

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
pedestal: [],                    // Champion hero figurines [{hero, mode, stats}]
hasAncientStatuette: false,
hasReachedFloor20: false,        // Unlocks blue portal in Ribbleton
fuUnlocked: false,
forcedFUEntry: false,            // True after first Standard win, forces FU run
tapoUnlocked: false,             // Unlocked after first FU victory
pondHistory: [],                 // Run history for "The Pond" - [{runNumber, heroes, floorReached, gameMode, outcome, killedBy, timestamp}]

// ===== QUEST BOARD STATE (persistent) =====
questsCompleted: {},             // Quest IDs that have been turned in: {quest_id: true}
questsClaimed: {},               // Quest IDs that have been claimed (rewards collected): {quest_id: true}
questProgress: {
  // Combat stats
  enemiesKilled: 0,
  totalDamageDealt: 0,
  maxDamageOneAction: 0,
  maxTargetsOneAction: 0,
  lastStandSurvived: false,

  // Action usage (ever)
  d20Used: false,
  shieldApplied: false,
  healUsed: false,
  grappleUsed: false,
  alphaUsed: false,
  ghostBlocked: false,

  // Per-hero tracking
  heroesPlayed: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },
  heroWins: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },

  // Neutral encounters completed (by base name, any stage)
  neutralsCompleted: {
    shopkeeper: false, wishingwell: false, treasurechest: false,
    wizard: false, oracle: false, encampment: false,
    gambling: false, ghost: false, royal: false
  },

  // Enemy types defeated
  enemyTypesDefeated: {
    Goblin: false, Wolf: false, Orc: false, Giant: false,
    'Cave Troll': false, Dragon: false, Flydra: false
  },

  // Milestone tracking
  highestFloor: 0,
  totalGoldEarned: 0,
  totalRunsCompleted: 0,
  standardWins: 0,
  fuWins: 0,
  maxRecruitsHeld: 0,
  purchasedUpgrade: false,

  // Repeatable quest tiers completed
  slayerTier: 0,
  goldDiggerTier: 0,
  veteranTier: 0
},

// ===== UI STATE =====
toastHistory: [],               // Array of recent toast messages
toastLogLocked: false,          // Whether toast log is locked open (persistent)
toastLogVisible: true,          // Whether toast log button is shown in header
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
ghost_intro: false,
grapple_intro: false,
alpha_intro: false,
recruit_intro: false,
chosen_hero_intro: false,
run2_hero_lock: false,
first_victory_sequence: false,
first_fu_victory: false,
pedestal_first_placement: false,
tapo_victory_message: false,
tapo_first_attack: false,
auto_target_intro: false,
steam_controller_setup: false
},
usedDeathQuotes: [], // Track which death quotes have been shown

// ===== SUSPEND/AUTOSAVE STATE =====
suspended: false,         // Whether game is currently suspended
lastAutosave: 0,          // Timestamp of last autosave
inCombat: false,          // Whether player is in active combat (for autosave)
combatEnding: false       // Guard flag to prevent multiple checkCombatEnd calls
};

let sel = [];

// ===== QUEST PROGRESS TRACKING =====
// Helper function to track quest progress
function trackQuestProgress(type, value) {
  if(!S.questProgress) return; // Guard against undefined

  switch(type) {
    case 'enemyKill':
      S.questProgress.enemiesKilled++;
      // Track enemy type
      if(value && S.questProgress.enemyTypesDefeated.hasOwnProperty(value)) {
        S.questProgress.enemyTypesDefeated[value] = true;
      }
      break;
    case 'd20':
      S.questProgress.d20Used = true;
      break;
    case 'shield':
      S.questProgress.shieldApplied = true;
      break;
    case 'heal':
      S.questProgress.healUsed = true;
      break;
    case 'grapple':
      S.questProgress.grappleUsed = true;
      break;
    case 'alpha':
      S.questProgress.alphaUsed = true;
      break;
    case 'ghostBlock':
      S.questProgress.ghostBlocked = true;
      break;
    case 'lastStandSurvive':
      S.questProgress.lastStandSurvived = true;
      break;
    case 'damage':
      S.questProgress.totalDamageDealt += value;
      if(value > S.questProgress.maxDamageOneAction) {
        S.questProgress.maxDamageOneAction = value;
      }
      break;
    case 'targets':
      if(value > S.questProgress.maxTargetsOneAction) {
        S.questProgress.maxTargetsOneAction = value;
      }
      break;
    case 'floor':
      if(value > S.questProgress.highestFloor) {
        S.questProgress.highestFloor = value;
      }
      break;
    case 'gold':
      S.questProgress.totalGoldEarned += value;
      break;
    case 'upgrade':
      S.questProgress.purchasedUpgrade = true;
      break;
    case 'recruits':
      if(value > S.questProgress.maxRecruitsHeld) {
        S.questProgress.maxRecruitsHeld = value;
      }
      break;
    case 'runComplete':
      S.questProgress.totalRunsCompleted++;
      break;
    case 'standardWin':
      S.questProgress.standardWins++;
      break;
    case 'fuWin':
      S.questProgress.fuWins++;
      break;
    case 'heroPlayed':
      if(value && S.questProgress.heroesPlayed.hasOwnProperty(value)) {
        S.questProgress.heroesPlayed[value]++;
      }
      break;
    case 'heroWin':
      if(value && S.questProgress.heroWins.hasOwnProperty(value)) {
        S.questProgress.heroWins[value]++;
      }
      break;
    case 'neutral':
      if(value && S.questProgress.neutralsCompleted.hasOwnProperty(value)) {
        S.questProgress.neutralsCompleted[value] = true;
      }
      break;
  }
  savePermanent();
}

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

// Ensure floor is a valid number (fix for "Session 0 undefined floor" bug)
if(S.floor === undefined || S.floor === null) {
S.floor = 1;
}

// Update location display based on game state
if(S.floor === 0 && tutorialState) {
// Tutorial mode
floorEl.textContent = '';
locationLabelEl.textContent = 'Tutorial';
roundInfoEl.style.display = S.round > 0 ? '' : 'none';
roundEl.textContent = S.round || '';
} else if(S.floor === 0) {
// Floor 0 without tutorial - show as Ribbleton (pre-game state)
floorEl.textContent = '';
locationLabelEl.textContent = 'Ribbleton';
roundInfoEl.style.display = 'none';
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
floorEl.textContent = S.floor || 1;
locationLabelEl.textContent = 'Floor';
roundInfoEl.style.display = '';
roundEl.textContent = S.round || 1;
} else {
// Between combats (neutral floors, level up, etc.)
floorEl.textContent = S.floor || 1;
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
// Toggle sinister FU mode background on body
document.body.classList.toggle('fu-mode', S.gameMode === 'fu');
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

// Reposition all toasts based on their actual heights
function repositionToasts() {
const baseBottom = document.body.classList.contains('controller-active') ? 70 : 20;
const gap = 8;
let currentBottom = baseBottom;
activeToasts.forEach(t => {
t.style.bottom = `${currentBottom}px`;
currentBottom += t.offsetHeight + gap;
});
}

function toast(msg, dur=1800) {
// Add to history (strip HTML for text log)
const textMsg = msg.replace(/<[^>]*>/g, '');
S.toastHistory.unshift(textMsg);
if(S.toastHistory.length > 20) S.toastHistory = S.toastHistory.slice(0, 20); // Keep last 20
updateToastLog();
// Show toast popup (supports HTML)
const t = document.createElement('div');
t.className = 'toast';
t.innerHTML = msg;
t.style.bottom = '-100px'; // Start off-screen
document.body.appendChild(t);
activeToasts.push(t);
// Wait for render then position based on actual heights
requestAnimationFrame(() => {
repositionToasts();
setTimeout(() => t.classList.add('show'), 10);
});
setTimeout(() => {
t.classList.remove('show');
setTimeout(() => {
t.remove();
activeToasts = activeToasts.filter(toast => toast !== t);
repositionToasts();
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
// Toggle the locked state
S.toastLogLocked = !S.toastLogLocked;
const log = document.getElementById('toastLog');
if(!log) return;
if(S.toastLogLocked) {
log.classList.add('show', 'locked');
} else {
log.classList.remove('show', 'locked');
}
updateToastLog();
}

function minimizeToastLog() {
// Minimize without changing locked state preference
S.toastLogLocked = false;
const log = document.getElementById('toastLog');
if(log) {
log.classList.remove('show', 'locked');
}
}

function updateToastLog() {
const log = document.getElementById('toastLog');
if(!log) return;
let html = `<div class="toast-log-header">
<span style="font-size:1rem">🪵 Combat Log</span>
<button onclick="minimizeToastLog()" style="background:#ef4444;border:2px solid #000;border-radius:4px;padding:0.25rem 0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem">✕</button>
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
// Prevent creating new backdrop while one exists (avoid stacking)
const existingBackdrop = document.querySelector('.tutorial-modal-backdrop');
if(existingBackdrop) {
debugLog('[TUTORIAL] Backdrop already exists, queuing callback');
// Queue this popup for after current one is dismissed
const existingCallback = window.tutorialCallback;
window.tutorialCallback = () => {
if(existingCallback) existingCallback();
// Delay slightly to prevent rapid-fire popups
setTimeout(() => showTutorialPop(flagName, message, onDismiss), 100);
};
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
debugLog('[TUTORIAL] Backdrop created and appended');
// Auto-focus the button for keyboard accessibility
const btn = backdrop.querySelector('button');
if(btn) setTimeout(() => btn.focus(), 50);
// Store callback for later
window.tutorialCallback = onDismiss;
}

function dismissTutorialPop(flagName) {
debugLog('[TUTORIAL] dismissTutorialPop called:', flagName);
S.tutorialFlags[flagName] = true;
savePermanent();

// Set cooldown to prevent click-through to game elements behind popup
// This prevents controller A button from selecting sigils after dismissing popup
window.tutorialDismissTime = Date.now();

// Capture callback before removal (prevent race conditions)
const callback = window.tutorialCallback;
window.tutorialCallback = null;

// Remove ALL backdrops synchronously and aggressively
const allBackdrops = document.querySelectorAll('.tutorial-modal-backdrop');
allBackdrops.forEach(b => b.remove());

// Use requestAnimationFrame to ensure DOM is updated before callback
requestAnimationFrame(() => {
// Double-check for any zombie backdrops
const remaining = document.querySelectorAll('.tutorial-modal-backdrop');
remaining.forEach(r => r.remove());

// Execute callback if exists
if(callback) {
try {
callback();
} catch (error) {
console.error('[TUTORIAL] Callback error:', error);
}
}
});
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
forcedFUEntry: S.forcedFUEntry,
tapoUnlocked: S.tapoUnlocked,
runNumber: S.runNumber,
runsAttempted: S.runsAttempted,
tutorialFlags: S.tutorialFlags,
helpTipsDisabled: S.helpTipsDisabled,
tooltipsDisabled: S.tooltipsDisabled,
usedDeathQuotes: S.usedDeathQuotes,
controllerDisabled: S.controllerDisabled,
animationSpeed: S.animationSpeed,
pondHistory: S.pondHistory,
questsCompleted: S.questsCompleted,
questsClaimed: S.questsClaimed,
questProgress: S.questProgress
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
S.fuUnlocked = j.fuUnlocked || false;
S.forcedFUEntry = j.forcedFUEntry || false;
S.tapoUnlocked = j.tapoUnlocked || false;
S.runNumber = j.runNumber || 1;
S.runsAttempted = j.runsAttempted || 0;
S.helpTipsDisabled = j.helpTipsDisabled || false;
S.tooltipsDisabled = j.tooltipsDisabled || false;
S.usedDeathQuotes = j.usedDeathQuotes || [];
S.controllerDisabled = j.controllerDisabled || false;
S.animationSpeed = j.animationSpeed !== undefined ? j.animationSpeed : 1;
S.pondHistory = j.pondHistory || [];
// Load quest data with defaults
S.questsCompleted = j.questsCompleted || {};
S.questsClaimed = j.questsClaimed || {};
if(j.questProgress) {
  // Merge loaded progress with defaults to handle new fields
  Object.assign(S.questProgress, j.questProgress);
  // Ensure nested objects exist
  if(!S.questProgress.heroesPlayed) S.questProgress.heroesPlayed = { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 };
  if(!S.questProgress.heroWins) S.questProgress.heroWins = { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 };
  if(!S.questProgress.neutralsCompleted) S.questProgress.neutralsCompleted = { shopkeeper: false, wishingwell: false, treasurechest: false, wizard: false, oracle: false, encampment: false, gambling: false, ghost: false, royal: false };
  if(!S.questProgress.enemyTypesDefeated) S.questProgress.enemyTypesDefeated = { Goblin: false, Wolf: false, Orc: false, Giant: false, 'Cave Troll': false, Dragon: false, Flydra: false };
}
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
gameMode: S.gameMode,
chosenHeroIdx: S.chosenHeroIdx
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
S.chosenHeroIdx = j.chosenHeroIdx !== undefined ? j.chosenHeroIdx : -1;
S.recruits = []; // Recruits don't persist across saves
S.heroes.forEach(h => {
if(!h.ts) h.ts = [];
// Migration fix: Remove Attack from Healer (was removed from starting sigils)
if(h.n === 'Healer' && h.s.includes('Attack')) {
h.s = h.s.filter(sig => sig !== 'Attack');
debugLog('[SAVE] Migrated Healer: removed Attack from saved sigils');
}
});
// CRITICAL: Check for invalid save state (all heroes in Last Stand)
// This can happen if game was closed during/after defeat before reaching death screen
const allHeroesInLastStand = S.heroes.length > 0 && S.heroes.every(h => h.ls);
if(allHeroesInLastStand) {
debugLog('[SAVE] Detected invalid save: all heroes in Last Stand, going to death screen');
// Clear the corrupted run save
localStorage.removeItem('froggle8');
// Clear temp upgrades
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
upd();
toast('Continuing from last defeat...', 1800);
setTimeout(() => transitionScreen(showDeathScreen), 500);
return;
}
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
const runData = localStorage.getItem(`froggle8_slot${slot}`);
let activeFloor = null;
if(runData) {
try {
const r = JSON.parse(runData);
activeFloor = r.f || null;
} catch(e) {}
}
return {
exists: true,
runsAttempted: j.runsAttempted || j.runNumber || 1,
goingRate: j.goingRate || 1,
hasActiveRun: !!runData,
activeFloor: activeFloor
};
}
// Check old system for migration
if(slot === 1) {
d = localStorage.getItem('froggle8_permanent');
if(d) {
const j = JSON.parse(d);
const oldRunData = localStorage.getItem('froggle8');
let activeFloor = null;
if(oldRunData) {
try {
const r = JSON.parse(oldRunData);
activeFloor = r.f || null;
} catch(e) {}
}
return {
exists: true,
runsAttempted: j.runNumber || 1,
goingRate: j.goingRate || 1,
hasActiveRun: !!oldRunData,
activeFloor: activeFloor,
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
S.fuUnlocked = j.fuUnlocked || false;
S.forcedFUEntry = j.forcedFUEntry || false;
S.tapoUnlocked = j.tapoUnlocked || false;
S.runNumber = j.runNumber || 1;
S.helpTipsDisabled = j.helpTipsDisabled || false;
S.tooltipsDisabled = j.tooltipsDisabled || false;
S.usedDeathQuotes = j.usedDeathQuotes || [];
if(j.tutorialFlags) Object.assign(S.tutorialFlags, j.tutorialFlags);
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
S.chosenHeroIdx = r.chosenHeroIdx !== undefined ? r.chosenHeroIdx : -1;
S.recruits = []; // Recruits don't persist across saves
S.heroes.forEach(h => {
if(!h.ts) h.ts = [];
// Migration fix: Remove Attack from Healer (was removed from starting sigils)
if(h.n === 'Healer' && h.s.includes('Attack')) {
h.s = h.s.filter(sig => sig !== 'Attack');
debugLog('[SAVE] Migrated Healer: removed Attack from saved sigils');
}
});
// CRITICAL: Check for invalid save state (all heroes in Last Stand)
// This can happen if game was closed during/after defeat before reaching death screen
const allHeroesInLastStand = S.heroes.length > 0 && S.heroes.every(h => h.ls);
if(allHeroesInLastStand) {
debugLog('[SAVE] Detected invalid save: all heroes in Last Stand, going to death screen');
// Clear the corrupted run save
localStorage.removeItem(`froggle8_slot${slot}`);
// Clear temp upgrades
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
upd();
toast('Continuing from last defeat...', 1800);
setTimeout(() => transitionScreen(showDeathScreen), 500);
return true;
}
// CRITICAL: Check for invalid tutorial floor save (floor 0)
// Tutorial shouldn't be saved mid-combat - advance to floor 1
if(S.floor === 0) {
debugLog('[SAVE] Detected invalid tutorial save: floor 0, advancing to floor 1');
S.floor = 1;
// Clear the corrupted save and re-save with correct floor
localStorage.removeItem(`froggle8_slot${slot}`);
}
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
forcedFUEntry: S.forcedFUEntry,
tapoUnlocked: S.tapoUnlocked,
runNumber: S.runNumber,
tutorialFlags: S.tutorialFlags,
helpTipsDisabled: S.helpTipsDisabled,
tooltipsDisabled: S.tooltipsDisabled,
usedDeathQuotes: S.usedDeathQuotes,
controllerDisabled: S.controllerDisabled,
animationSpeed: S.animationSpeed,
pondHistory: S.pondHistory,
questsCompleted: S.questsCompleted,
questsClaimed: S.questsClaimed,
questProgress: S.questProgress
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
gameMode: S.gameMode,
chosenHeroIdx: S.chosenHeroIdx
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
// Only autosave if we have an active slot and are in combat (not during tutorial)
if(!S.currentSlot || !S.inCombat || S.floor === 0) return;

// Throttle autosaves
const now = Date.now();
if(now - S.lastAutosave < AUTOSAVE_THROTTLE) return;

S.lastAutosave = now;
saveGame();
showAutosaveIndicator();
debugLog('[AUTOSAVE] Game autosaved');
}

function showAutosaveIndicator() {
// Show a subtle "✓ Saved" indicator in the corner
let indicator = document.getElementById('autosave-indicator');
if(!indicator) {
indicator = document.createElement('div');
indicator.id = 'autosave-indicator';
indicator.style.cssText = 'position:fixed;top:8px;right:8px;background:rgba(34,197,94,0.9);color:white;padding:4px 10px;border-radius:4px;font-size:0.75rem;font-weight:bold;opacity:0;transition:opacity 0.3s;z-index:9999;pointer-events:none';
document.body.appendChild(indicator);
}
indicator.textContent = '✓ Saved';
indicator.style.opacity = '1';
setTimeout(() => { indicator.style.opacity = '0'; }, 1500);
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

