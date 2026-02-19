// ===== FLOOR MANAGEMENT =====
function getFloorName(f) {
const floorNames = {
1: 'Goblin Stragglers',
3: 'Wolf Pack',
5: 'Orc Wall',
7: 'Fe Fi Fo Fum',
9: 'Just Trolling',
11: 'Goblin Legion',
13: 'Too Many Wolves',
15: 'Territorial Dragon',
17: 'Chaos Legion',
19: 'Lair of the Flydra'
};
return floorNames[f] || null;
}

function showFloorInterstitial(f, callback) {
const floorName = getFloorName(f);
if(!floorName) {
callback();
return;
}
// JUICE: Floor enter sound
SoundFX.play('floorEnter');
const v = document.getElementById('gameView');

// Special boss intro for Floor 19 (Flydra)
if(f === 19) {
v.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100vh;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:30000">
<div style="text-align:center;color:#fff;animation:fadeIn 0.8s ease">
<div style="font-size:2rem;font-weight:bold;margin-bottom:0.5rem;color:#e94560">Floor ${f}</div>
<div style="font-size:1.5rem;font-style:italic;margin-bottom:1rem;color:#fbbf24">${floorName}</div>
<img src="assets/Flydra Boss.png" alt="The Flydra" style="max-width:90vw;max-height:60vh;object-fit:contain;border-radius:8px;box-shadow:0 0 40px rgba(233,69,96,0.6);animation:flydraReveal 1.2s ease">
</div>
</div>
<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes flydraReveal {
  0% { opacity: 0; transform: scale(0.8); filter: brightness(0); }
  50% { opacity: 1; filter: brightness(1.3); }
  100% { opacity: 1; transform: scale(1); filter: brightness(1); }
}
</style>`;
// Longer display time for boss intro
setTimeout(callback, T(ANIMATION_TIMINGS.FLOOR_INTERSTITIAL * 2));
return;
}

// Floor 11 ambush warning
const isAmbush = f === 11;
const ambushWarning = isAmbush ? `
<div style="margin-top:1.5rem;padding:0.75rem 1.5rem;background:rgba(239,68,68,0.3);border:2px solid #ef4444;border-radius:8px;animation:pulseWarning 1s ease infinite">
<div style="font-size:1.2rem;font-weight:bold;color:#fca5a5">⚠️ AMBUSH! ⚠️</div>
<div style="font-size:0.95rem;color:#fca5a5;margin-top:0.25rem">All heroes stunned Turn 1!</div>
</div>
` : '';

v.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;z-index:30000">
<div style="text-align:center;color:#fff;animation:fadeIn 0.5s ease">
<div style="font-size:2.5rem;font-weight:bold;margin-bottom:1rem">Floor ${f}</div>
<div style="font-size:1.8rem;font-style:italic">${floorName}</div>
${ambushWarning}
</div>
</div>
<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseWarning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>`;
// Extend duration for ambush floors so players can read the warning
const interstitialDuration = isAmbush ? ANIMATION_TIMINGS.FLOOR_INTERSTITIAL * 1.5 : ANIMATION_TIMINGS.FLOOR_INTERSTITIAL;
setTimeout(callback, T(interstitialDuration));
}

function startFloor(f) {
debugLog(`[FLOOR] startFloor(${f}) called, isOdd=${f % 2 === 1}`);
S.floor=f;
// QUEST TRACKING: Floor reached
trackQuestProgress('floor', f);
upd();
// Special: Floor 20 in Frogged Up mode shows Old Tapo encounter
if(f === 20 && S.gameMode === 'fu') {
showOldTapo();
return;
}
if(f >= 20) { win(); return; }
// Floor 11 is always ambushed (Goblin Army)
if(f === 11) {
S.ambushed = true;
}
// Show interstitial for combat floors
if(f % 2 === 1) {
showFloorInterstitial(f, () => combat(f));
} else {
neutral(f);
}
}

function getEnemyComp(f) {
const heroCount = S.heroes.length;
if(f===0) {
// Tutorial floor - check phase
if(tutorialState && tutorialState.phase === 1) {
return ['fly', 'fly', 'fly']; // Phase 1: Tapo's Birthday (3 flies)
} else {
return ['goblin', 'wolf']; // Phase 2: Portal Invasion
}
}
if(f===1) return Array(heroCount).fill('goblin');
if(f===3) return Array(heroCount).fill('wolf');
if(f===5) return Array(heroCount * 2).fill('orc');
if(f===7) {
const comp = [];
for(let i = 0; i < heroCount; i++) comp.push('giant', 'wolf', 'goblin');
return comp;
}
if(f===9) return Array(heroCount).fill('caveTroll');
if(f===11) return Array(heroCount * 5).fill('goblin');
if(f===13) return Array(heroCount * 5).fill('wolf');
if(f===15) return Array(heroCount).fill('dragon');
if(f===17) {
const comp = [];
for(let i = 0; i < heroCount; i++) comp.push('caveTroll', 'giant', 'orc', 'wolf', 'goblin');
return comp;
}
if(f===19) return Array(heroCount).fill('flydra'); // 1 Flydra head per hero
return ['goblin'];
}

// ===== COMBAT (v7.2 PERFECT COMBAT - UNCHANGED) =====
/**
 * Initializes combat encounter for given floor.
 *
 * Combat Initialization:
 * - Resets turn state (round=1, turn='player', no actions)
 * - Shields persist from previous combat (capped at max HP)
 * - Ghost charges persist between combats
 * - Stun counters reset to 0
 * - Creates enemies based on floor composition
 * - Handles Ribbleton tutorial special cases
 * - Applies Frogged Up mode multipliers (3x stats and rewards)
 *
 * @param {number} f - Floor number (1-19, or 0 for tutorial)
 */
function combat(f) {
// Show header during combat
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';
S.inCombat = true; // Mark that we're in active combat for autosave
// JUICE: Start combat music
if(typeof ProceduralMusic !== 'undefined') ProceduralMusic.startCombat();
S.combatEnding = false; // Reset combat ending guard flag
S.round=1; S.turn='player'; S.activeIdx=-1; S.acted=[]; S.locked=false;
S.lastActions={};
S.combatXP=0; S.combatGold=0; // Track combat rewards separately
S.pending=null; S.targets=[]; S.currentInstanceTargets=[]; S.instancesRemaining=0; S.totalInstances=0; S.turnDamage=0;
// Clear Alpha state from any previous combat
S.alphaGrantedActions = []; S.alphaCurrentAction = 0; S.alphaLevel = 0;
// Don't clear recruits here - they may have been added before combat (e.g., Encampment straggler)
if(!S.recruits) S.recruits = [];
S.heroes.forEach(h => {
// Shields now persist between battles, but cap at max HP
if(h.sh > h.m) h.sh = h.m;
h.st=0;
if(!h.ts) h.ts=[];
// Passive Asterisk: Reset first action flag each combat
h.firstActionUsed = false;
// If ambushed, stun all heroes turn 1
if(S.ambushed) h.st = 1;
});

// Save combat start snapshot for restart functionality
S.combatStartSnapshot = {
heroes: S.heroes.map(h => ({
id: h.id, n: h.n, c: h.c, p: h.p, h: h.h, m: h.m, sh: h.sh, g: h.g,
st: h.st, ls: h.ls, lst: h.lst, s: [...h.s], ts: [...(h.ts || [])],
firstActionUsed: h.firstActionUsed, base: h.base
})),
recruits: S.recruits ? S.recruits.map(r => ({...r, s: [...r.s]})) : [],
floor: f,
ambushed: S.ambushed,
gold: S.gold,
xp: S.xp,
combatXP: S.combatXP || 0,
combatGold: S.combatGold || 0
};

let comp = getEnemyComp(f);

S.enemies = comp.map((t,i) => {
const base = E[t];
const fuMultiplier = S.gameMode === 'fu' ? 3 : 1;
const enemy = {
id:`e-${crypto.randomUUID()}`, n:base.n,
p:base.p * fuMultiplier,
h:base.h * fuMultiplier,
m:base.m * fuMultiplier,
goldDrop:(base.goldDrop || 0) * fuMultiplier, x:(base.x || 0) * fuMultiplier, s: [], pool: base.pool,
maxLevel: base.maxLevel || 1, sigilLevels: base.sigilLevels || {},
gainRate: base.gainRate || 3, turnsSinceGain: 0,
drawsPerTurn: base.drawsPerTurn || 1,
st:0, li: i % S.heroes.length, sh:0, g:0, alphaActed: false
};
// FLYDRA: Set up state and use dynamic sigil level based on hero count
if(base.isFlydra) {
enemy.isFlydra = true;
enemy.flydraState = 'alive'; // 'alive', 'dying', 'reviving'
enemy.flydraReviveTimer = 0;
enemy.flydraLevel = S.heroes.length; // L2 normal, L3 in Frogged Up
// Assign head position based on hero count:
// 2 heroes (Standard): left, right
// 3 heroes (FU): left, center, right
const headOrder = S.heroes.length === 2 ? ['left', 'right'] : ['left', 'center', 'right'];
const headPosition = headOrder[i % headOrder.length];
const headData = FLYDRA_HEADS[headPosition];
enemy.flydraHead = headPosition;
enemy.flydraHeadImage = headData.image;
enemy.n = headData.name; // Override name with head-specific name
}
// Add permanent sigils (Flydra uses hero count for level)
if(base.permSigils) {
base.permSigils.forEach(ps => {
const level = base.isFlydra ? S.heroes.length : ps.l;
enemy.s.push({sig:ps.s, level:level, perm:true});
});
}
if(base.startSigils) {
if(Array.isArray(base.startSigils)) {
// Array format: [{s:'Shield', l:1}]
base.startSigils.forEach(ss => enemy.s.push({sig:ss.s, level:ss.l, perm:false}));
} else {
// Numeric format: draw N random sigils
for(let j = 0; j < base.startSigils; j++) {
drawEnemyStartSigil(enemy, base);
}
}
}
// Handle startRandom: draw additional random L1 sigils (used by Troll)
if(base.startRandom) {
for(let j = 0; j < base.startRandom; j++) {
drawEnemyStartSigil(enemy, base, true); // true = force level 1
}
}
// ORC ALTERNATING: Start with either Attack L2 or random pool sigil
if(base.alternating && base.altSigil) {
enemy.alternating = true;
enemy.altSigil = base.altSigil;
// Randomly choose which to start with (true = altSigil/Attack, false = pool)
enemy.altState = Math.random() < 0.5;
if(enemy.altState) {
enemy.s.push({sig: base.altSigil.s, level: base.altSigil.l, perm: false});
} else {
drawEnemyStartSigil(enemy, base, false);
}
}
// CAVE TROLL RAGE: Rolling Attack L1→L2→L3→L1 pattern
if(base.rage && base.ragePattern) {
enemy.rage = true;
enemy.ragePattern = base.ragePattern;
enemy.rageIndex = 0; // Start at first level (L1)
// Start with Attack at first level of pattern
enemy.s.push({sig: 'Attack', level: base.ragePattern[0], perm: true});
}
return enemy;
});
// Shuffle enemies for variety within lanes (Fisher-Yates)
for(let i = S.enemies.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[S.enemies[i], S.enemies[j]] = [S.enemies[j], S.enemies[i]];
}
if(S.ambushed) {
toast('AMBUSHED! All heroes stunned Turn 1!', 2400, 'critical');
S.ambushed = false; // Clear flag after use
}
// Check if we need to show Encampment enemy selection
if(S.encampmentEarlyKills && S.encampmentEarlyKills > 0) {
S.selectingEncampmentTargets = true;
S.encampmentSelectedTargets = [];
}
upd(); // Ensure background color is set before first render
render();
// Auto-target tutorial: show on second+ run, floor 1
if(S.runNumber >= 2 && f === 1 && !S.tutorialFlags.auto_target_intro) {
const isTouchDevice = 'ontouchstart' in window;
const inputHint = isTouchDevice ? "Press Ⓧ on controller" : "Right-click any sigil (or Ⓧ on controller)";
showTutorialPop('auto_target_intro', `Right-click any sigil (or press Ⓧ on controller) to auto-target the best enemy! This quickly attacks the lowest-HP target without manual selection.<br><br><em style="font-size:0.85em;opacity:0.9">(Pro tip: Use this to speed through easy fights!)</em>`);
}
}

// Restart combat from the beginning of the current floor
function restartCombat() {
if(!S.combatStartSnapshot) {
toast('No restart point saved!');
return;
}

// Confirm restart
showConfirmModal(
'Restart this battle from the beginning?',
() => {
// Restore hero state from snapshot
S.heroes = S.combatStartSnapshot.heroes.map(h => ({
  ...h,
  s: [...h.s],
  ts: [...(h.ts || [])]
}));

// Restore recruits from snapshot
S.recruits = S.combatStartSnapshot.recruits.map(r => ({...r, s: [...r.s]}));

// Restore ambush state
S.ambushed = S.combatStartSnapshot.ambushed;

// Restore gold/XP to prevent farming exploit
S.gold = S.combatStartSnapshot.gold;
S.xp = S.combatStartSnapshot.xp;

// Clear any pending actions
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.alphaGrantedActions = [];
S.alphaCurrentAction = 0;

toast('Restarting battle...', 800);
setTimeout(() => {
  combat(S.combatStartSnapshot.floor);
}, 400);
},
() => {} // Cancel - do nothing
);
}

function getLevel(sig, heroIdx) {
const h = S.heroes[heroIdx];
// Calculate total level (permanent + temporary XP upgrades)
const totalLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
// Star, Asterisk, and Expand are global passives - all heroes get them when upgraded
if(sig === 'Star' || sig === 'Asterisk' || sig === 'Expand') {
// Special case: Mage and Healer get +1 to Expand
if(sig === 'Expand' && h && (h.n === 'Mage' || h.n === 'Healer')) {
return totalLevel + 1;
}
return totalLevel;
}
// For other sigils, check if hero has it
if(!h) return 0;
const hasSigil = h.s.includes(sig) || (h.ts && h.ts.includes(sig));
if(!hasSigil) return 0;
// Actives always display +1 higher (perm 0 = L1, perm 1 = L2, etc.)
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
if(actives.includes(sig)) return totalLevel + 1;
return totalLevel;
}

function getTargetsPerInstance(action, heroIdx) {
// Safeguard: if heroIdx is invalid, check if we're in tutorial with single Mage
if(heroIdx < 0 || heroIdx >= S.heroes.length) {
  // Tutorial Phase 1: Mage should always have 2 targets
  if(tutorialState && tutorialState.phase === 1 && S.heroes.length === 1 && S.heroes[0].n === 'Mage') {
    return 2;
  }
  return 1; // Default fallback
}
const expandLevel = getLevel('Expand', heroIdx);
return 1 + expandLevel;
}

function needsEnemyTarget(action) { return ['Attack', 'Grapple'].includes(action); }
function needsHeroTarget(action) { return ['Heal', 'Shield', 'Alpha'].includes(action); }
function isMultiInstance(action) { return ['Attack', 'Shield', 'Heal'].includes(action); }

function getD20DC(baseDC, heroIdx, gambitName) {
const h = S.heroes[heroIdx];
if(!h || !h.ls) return baseDC;
// Last Stand: No penalty on first turn, then +2 each turn after
// h.lst is incremented at end of player turn, so first action has lst=0
const lastStandBonus = h.lst * 2;
// Confuse caps at DC 20, all other gambits continue increasing
if(gambitName === 'CONFUSE') {
return Math.min(baseDC + lastStandBonus, 20);
}
return baseDC + lastStandBonus;
}

function selectHero(idx) {
if(S.locked) { toast('Wait for enemy turn!'); return; }
if(S.pending) return;
const h = S.heroes[idx];
if(!h) return;
if(S.acted.includes(idx)) { toast(`${h.n} already acted!`); return; }
if(h.st > 0) { toast(`${h.n} is stunned!`); return; }
S.activeIdx = idx;
SoundFX.play('click');
// Show happy reaction when hero is selected for their turn
if(!h.ls) setHeroReaction(h.id, 'happy', 1200);
if(h.ls) toast(`${h.n} in Last Stand - D20 only!`);
render();
}

function act(sig, heroIdx) {
// Hide any pending tooltips when action is selected
hideTooltip();

// RIBBLETON TUTORIAL: Check for scripted actions using TutorialManager
const h = S.heroes[heroIdx];
if(!h) return;
if(!TutorialManager.canPerformAction(h, sig)) {
toast(TutorialManager.getInstructionMessage());
return;
}

if(S.locked) { toast('Wait for enemy turn!'); return; }
// Allow switching actions only if no instances have been completed yet
if(S.pending) {
// Check if any instances have been completed
if(S.instancesRemaining > 0 && S.totalInstances && S.instancesRemaining < S.totalInstances) {
toast('Must complete remaining instances!');
return;
}
// Allow switching if no instances completed yet
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
}
if(S.acted.includes(heroIdx)) { toast(`${h.n} already acted!`); return; }
if(h.st > 0) { toast(`${h.n} is stunned!`); return; }
if(h.ls && sig !== 'D20') { toast('Last Stand - D20 only!'); return; }
S.activeIdx = heroIdx;
SoundFX.play('select');

// PASSIVE ASTERISK: Auto-apply on first action per combat
const asteriskLevel = getLevel('Asterisk', heroIdx);
const hasAsterisk = asteriskLevel > 0;
const firstAction = !h.firstActionUsed;
let repeats = 1;

if(hasAsterisk && firstAction) {
repeats = asteriskLevel + 1;
// NOTE: firstActionUsed is set in finishAction(), not here
// This allows players to cancel and still keep their Asterisk benefit
toast(`Asterisk activated! ${sig} ×${repeats}!`, 1500);
}

if(sig === 'Ghost') {
const level = getLevel('Ghost', heroIdx);
if(level === 0) { toast(`${h.n} doesn't have Ghost! Add it in Level-Up menu (costs XP).`); return; }
// Ghost tutorial: show first time player clicks Ghost
showTutorialPop('ghost_intro', "Ghost prevents the next lethal hit! Each charge blocks one otherwise-fatal blow, and charges persist between battles. Max 9 charges per hero.");
const totalCharges = level * repeats;
h.g = Math.min((h.g || 0) + totalCharges, 9);
toast(`${h.n} gained ${totalCharges} Ghost charge${totalCharges>1?'s':''}!`);
finishAction(heroIdx);
} else if(sig === 'D20') {
S.pending = 'D20';
S.asteriskD20Repeats = repeats;
S.asteriskD20Count = 0;
d20Menu(heroIdx);
} else if(isMultiInstance(sig)) {
const level = getLevel(sig, heroIdx);
if(level === 0) { toast(`${h.n} doesn't have ${sig}! Add it in Level-Up menu (costs XP).`); return; }
S.pending = sig;
S.instancesRemaining = level * repeats;
S.totalInstances = level * repeats; // Track for color roll-down
S.targets = [];
S.currentInstanceTargets = [];
// Shield persistence tutorial: show first time player clicks Shield
if(sig === 'Shield') {
showTutorialPop('shield_persistence', "Shields cap at max HP, but persist between battles! Hint - shield up before finishing a fight, and you'll enter the next fight with protection!");
}
render();
// Auto-focus target for controller users
if(sig === 'Attack') {
autoFocusTargetForController(heroIdx, 'enemy');
} else {
autoFocusTargetForController(heroIdx, 'hero');
}
} else if(sig === 'Grapple') {
const level = getLevel('Grapple', heroIdx);
if(level === 0) { toast(`${h.n} doesn't have Grapple! Add it in Level-Up menu (costs XP).`); return; }
// Grapple tutorial: show first time player clicks Grapple
showTutorialPop('grapple_intro', "Grapple stuns an enemy for 1 or more turns, but your hero takes recoil damage equal to the target's POW. Stun doesn't stack - a new stun only matters if it's longer than the remaining one.");
S.pending = 'Grapple';
S.grappleRepeats = repeats;
S.grappleLevel = level;
S.targets = [];
render();
autoFocusTargetForController(heroIdx, 'enemy');
} else if(sig === 'Alpha') {
const level = getLevel('Alpha', heroIdx);
if(level === 0) { toast(`${h.n} doesn't have Alpha! Add it in Level-Up menu (costs XP).`); return; }
// Alpha tutorial: show first time player clicks Alpha
showTutorialPop('alpha_intro', "Alpha lets a hero give their turn to an ally. At higher Alpha levels, one use can grant another hero multiple turns! Great ROI.");
const expandLevel = getLevel('Expand', heroIdx);
const targetsNeeded = 1 + expandLevel;
S.pending = 'Alpha';
// Apply Asterisk multiplier: total actions = level × repeats
S.alphaLevel = level * repeats;
S.alphaTargetsNeeded = targetsNeeded;
S.targets = [];
const totalActions = level * repeats;
toast(`Alpha: Grant ${totalActions} action${totalActions>1?'s':''} to ${targetsNeeded} hero${targetsNeeded>1?'es':''}!`);
render();
autoFocusTargetForController(heroIdx, 'hero');
}
}

// Right-click on sigil: select action AND auto-target
function actAndAutoTarget(sig, heroIdx) {
// First, select the action normally
act(sig, heroIdx);

// Then auto-target after a brief delay to let state update
setTimeout(() => {
if (!S.pending) return; // Action didn't set pending (e.g., Ghost completes instantly)

const hero = S.heroes[heroIdx];
if (!hero) return;

// Calculate targets needed (getLevel already includes Mage/Healer +1 bonus)
const expandLevel = getLevel('Expand', heroIdx);
const totalTargets = 1 + expandLevel;
const targetsNeeded = Math.max(1, totalTargets - (S.currentInstanceTargets ? S.currentInstanceTargets.length : 0));

if (['Attack', 'Grapple'].includes(S.pending)) {
  // Target enemies - prioritize lowest HP
  const aliveEnemies = S.enemies.filter(e => e.h > 0);
  if (aliveEnemies.length === 0) return;

  aliveEnemies.sort((a, b) => {
    if (a.h !== b.h) return a.h - b.h;
    const aLaneDist = Math.abs((a.li !== undefined ? a.li : 0) - heroIdx);
    const bLaneDist = Math.abs((b.li !== undefined ? b.li : 0) - heroIdx);
    return aLaneDist - bLaneDist;
  });

  const toTarget = aliveEnemies.slice(0, targetsNeeded);
  S.autoSelectInProgress = true;
  for (const enemy of toTarget) {
    const card = document.getElementById(enemy.id);
    if (card) card.click();
  }
  S.autoSelectInProgress = false;
  if (toTarget.length > 0) {
    toast(`Auto-targeted ${toTarget.length} enem${toTarget.length === 1 ? 'y' : 'ies'}!`, 1200);
    confirmTargets();
  }

} else if (['Heal', 'Shield', 'Alpha'].includes(S.pending)) {
  let aliveHeroes = S.heroes.filter(h => h.h > 0 || h.ls);
  // Filter out Last Stand heroes for Shield and Alpha (they can't receive these)
  if (S.pending === 'Shield' || S.pending === 'Alpha') {
    aliveHeroes = aliveHeroes.filter(h => !h.ls);
  }
  if (aliveHeroes.length === 0) return;

  if (S.pending === 'Heal') {
    aliveHeroes.sort((a, b) => {
      if (a.ls && !b.ls) return -1;
      if (!a.ls && b.ls) return 1;
      return (a.h / a.m) - (b.h / b.m);
    });
  } else if (S.pending === 'Shield') {
    aliveHeroes.sort((a, b) => {
      const aShield = a.sh || 0;
      const bShield = b.sh || 0;
      if (aShield !== bShield) return aShield - bShield;
      return a.h - b.h;
    });
  } else if (S.pending === 'Alpha') {
    aliveHeroes.sort((a, b) => b.p - a.p);
  }

  const toTarget = aliveHeroes.slice(0, targetsNeeded);
  S.autoSelectInProgress = true;
  for (const h of toTarget) {
    const card = document.getElementById(h.id);
    if (card) card.click();
  }
  S.autoSelectInProgress = false;
  if (toTarget.length > 0) {
    toast(`Auto-targeted ${toTarget.length} hero${toTarget.length === 1 ? '' : 'es'}!`, 1200);
    confirmTargets();
  }
}
}, 50);
}

function d20Menu(heroIdx) {
if(S.locked) return;

// RIBBLETON TUTORIAL: PROMPT 2 - Explain D20 gambit
if(tutorialState && S.floor === 0 && tutorialState.stage === 'healer_d20') {
tutorialState.stage = 'd20_menu';
showTutorialPop('ribbleton_d20_menu', "Choose a gambit! Each has a DC (Difficulty Check) - you need to roll that number or higher to succeed. Pick CONFUSE to damage the Wolf!", () => {
// After prompt, show the d20 menu
renderD20MenuAfterTutorial(heroIdx);
});
return;
}

renderD20MenuAfterTutorial(heroIdx);
}

function renderD20MenuAfterTutorial(heroIdx) {
const v = document.getElementById('gameView');
const h = S.heroes[heroIdx];

// RIBBLETON TUTORIAL: Special D20 menu that doesn't block view
const isTutorial = tutorialState && S.floor === 0 && tutorialState.stage === 'd20_menu';

let html = '';
if(isTutorial) {
// Tutorial version: overlay on left side only, keep enemies visible
html = '<div style="position:fixed;top:50%;left:10px;transform:translateY(-50%);z-index:15000;max-width:380px;background:white;border:4px solid #3b82f6;border-radius:12px;padding:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.5)">';
html += '<h3 style="margin-bottom:1rem;color:#6b4423">D20: Attempt A Gambit</h3>';
html += `<div class="choice" onclick="selectD20Action(${heroIdx}, 10, 'CONFUSE')" style="margin-bottom:0.5rem;background:#3b82f6;border:3px solid #f97316;font-size:1.1rem;cursor:pointer">
<strong style="font-size:1.2rem">✅ DC 10: CONFUSE</strong><br>
<span style="font-size:0.95rem">Target deals its own POW to itself</span>
</div>`;
// Show other options greyed out
const lockedOptions = [
{dc:12, name:'MEND', desc:'Heal self for POW'},
{dc:15, name:'STARTLE', desc:'Stun for 1 turn (doesn\'t stack)'},
{dc:18, name:'STEAL', desc:'Gain Gold = enemy POW'},
{dc:20, name:'RECRUIT', desc:'Enemy joins team'}
];
lockedOptions.forEach(opt => {
html += `<div style="margin-bottom:0.5rem;background:#e0e0e0;border:2px solid #999;border-radius:8px;padding:0.75rem;opacity:0.5;cursor:not-allowed">
<strong style="font-size:0.95rem">🔒 DC ${opt.dc}: ${opt.name}</strong><br>
<span style="font-size:0.85rem">${opt.desc}</span>
</div>`;
});
html += '</div>';
// Tutorial: Append as overlay, don't replace combat view
render(); // First render combat view
v.insertAdjacentHTML('beforeend', html);
return;
} else {
// Normal D20 menu (centered, blocks view)
html = '<div style="text-align:center;padding:1rem;background:white;border:3px solid #000;border-radius:8px;margin:1rem auto;max-width:400px;color:#1a1a1a">';
html += '<h3 style="margin-bottom:1rem;color:#1a1a1a">D20: Attempt A Gambit</h3>';
const expandLevel = getLevel('Expand', heroIdx);
const maxTargets = 1 + expandLevel;
if(expandLevel > 0) html += `<p style="margin-bottom:0.75rem;color:#22c55e;font-weight:bold;font-size:1.05rem;background:rgba(34,197,94,0.1);padding:0.5rem;border-radius:6px;border:2px solid #22c55e">✨ Expand L${expandLevel} Active: Target up to ${maxTargets} enemies!</p>`;
if(S.asteriskD20Repeats > 1) {
html += `<p style="margin-bottom:0.5rem;color:#f97316">Asterisk Active: Pick ${S.asteriskD20Repeats} actions!</p>`;
html += `<p style="margin-bottom:1rem;font-size:0.85rem">(${S.asteriskD20Count}/${S.asteriskD20Repeats} used)</p>`;
}
if(h.ls && h.lst > 0) {
const lsBonus = h.lst * 2;
html += `<p style="margin-bottom:0.5rem;color:#dc2626;font-weight:bold">Last Stand Turn ${h.lst + 1}: DCs +${lsBonus}</p>`;
}
const options = [
{dc:10, name:'CONFUSE', desc:'Target deals its own POW to itself'},
{dc:12, name:'MEND', desc:'Heal self for POW'},
{dc:15, name:'STARTLE', desc:'Stun for 1 turn (doesn\'t stack)'},
{dc:18, name:'STEAL', desc:'Gain Gold = enemy POW'},
{dc:20, name:'RECRUIT', desc:'Enemy joins team'}
];
options.forEach(opt => {
const adjustedDC = getD20DC(opt.dc, heroIdx, opt.name);
const dcText = adjustedDC > opt.dc ? `DC ${adjustedDC} (${opt.dc}+${adjustedDC - opt.dc})` : `DC ${opt.dc}`;
html += `<div class="choice" onclick="selectD20Action(${heroIdx}, ${adjustedDC}, '${opt.name}')" style="margin-bottom:0.5rem">
<strong>${dcText}: ${opt.name}</strong><br>
<span style="font-size:0.85rem">${opt.desc}</span>
</div>`;
});
if(S.asteriskD20Count > 0) html += `<button class="btn safe" onclick="finishD20Asterisk(${heroIdx})">Finish (${S.asteriskD20Count} used)</button>`;
else html += `<button class="btn secondary" onclick="cancelAction()">Cancel</button>`;
html += '</div>';
v.innerHTML = html;
}
}

function selectD20Action(heroIdx, dc, actionName) {
if(S.locked) return;
S.d20Action = actionName;
S.d20DC = dc;
S.d20HeroIdx = heroIdx;

// RIBBLETON TUTORIAL: Show Expand explanation after choosing CONFUSE
if(tutorialState && S.floor === 0 && tutorialState.stage === 'd20_menu' && actionName === 'CONFUSE') {
showTutorialPop('healer_expand_explain', "Healer has Expand, which adds extra targets to actions! This lets you Confuse multiple enemies at once. Try selecting 2 enemies!", () => {
// Allow free targeting after popup - stage stays 'd20_menu' for fudged roll but targeting is unrestricted
S.pending = 'D20_TARGET';
S.targets = [];
S.locked = false; // Ensure game is not locked after popup
render();
});
return;
}

// RECRUIT TUTORIAL: Show explanation when first selecting Recruit
if(actionName === 'RECRUIT') {
showTutorialPop('recruit_intro', "Recruited enemies will stand behind the hero who recruited them and fight alongside you until death! Each hero can have 1 recruit.", () => {
S.pending = 'D20_TARGET';
S.targets = [];
render();
});
return;
}

// MEND is self-targeting, execute immediately
if(actionName === 'MEND') {
const d20Level = getLevel('D20', heroIdx);
const {rolls, best} = rollDice(d20Level, 20);
const rollText = formatD20Compact(rolls, best);
const h = S.heroes[heroIdx];
if(best >= dc) {
const healAmount = h.p;
h.h = Math.min(h.h + healAmount, h.m);
toast(`${rollText} <span style="color:#22c55e;font-weight:bold">SUCCESS!</span> ${h.n} healed for ${healAmount} HP!`, 2000);
} else {
toast(`${rollText} needed ${dc} - <span style="color:#ef4444;font-weight:bold">FAILED!</span>`, 1800);
}
// Handle Asterisk repeats for MEND
if(S.asteriskD20Repeats > 1) {
S.asteriskD20Count++;
if(S.asteriskD20Count < S.asteriskD20Repeats) {
S.pending = null;
render();
setTimeout(() => d20Menu(heroIdx), T(ANIMATION_TIMINGS.TUTORIAL_DELAY));
return;
}
}
finishD20Asterisk(heroIdx);
return;
}

S.pending = 'D20_TARGET';
S.targets = [];
render();
// Auto-focus the enemy across from the active hero for controller users
autoFocusTargetForController(S.d20HeroIdx);
}

// Auto-focus an enemy/hero target for controller navigation
function autoFocusTargetForController(heroIdx, targetType = 'enemy') {
if (typeof GamepadController === 'undefined' || !GamepadController.active) return;

setTimeout(() => {
if (targetType === 'enemy') {
// Find the enemy at the same index as the hero (or first enemy)
const enemyCards = Array.from(document.querySelectorAll('.card.enemy:not(.dead)'));
if (enemyCards.length > 0) {
const targetIdx = Math.min(heroIdx || 0, enemyCards.length - 1);
GamepadController.setFocus(enemyCards[targetIdx]);
}
} else {
// For hero targeting (Heal, Shield, Alpha), focus the hero themselves or first other hero
const heroCards = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
if (heroCards.length > 0) {
// Try to focus the acting hero first (for self-targeting like Heal)
GamepadController.setFocus(heroCards[heroIdx] || heroCards[0]);
}
}
}, 100);
}

// Show animated D20 roll result overlay
function showD20RollVisual(best, dc) {
const isNat20 = best === 20;
const isNat1 = best === 1;
const success = best >= dc;
const resultClass = isNat20 ? 'nat20' : isNat1 ? 'nat1' : success ? 'success' : 'fail';

const overlay = document.createElement('div');
overlay.className = 'd20-roll-overlay';
overlay.innerHTML = `
<div class="d20-dice-spin">🎲</div>
<div class="d20-result-number ${resultClass}">${best}</div>
`;
document.body.appendChild(overlay);

// Play appropriate sound
if(isNat20) SoundFX.play('nat20');
else if(isNat1) SoundFX.play('nat1');
else SoundFX.play('d20roll');

setTimeout(() => overlay.remove(), T(1200));
}

function rollD20() {
if(S.locked) return;
const heroIdx = S.d20HeroIdx;
const h = S.heroes[heroIdx];
const dc = S.d20DC;
const actionName = S.d20Action;
const d20Level = getLevel('D20', heroIdx);
let rolls, best;

// RIBBLETON TUTORIAL: Fudge roll to always succeed (17-18)
if(tutorialState && S.floor === 0 && tutorialState.stage === 'd20_menu') {
const fudgedRoll = 17 + Math.floor(Math.random() * 2); // 17 or 18
rolls = [fudgedRoll];
best = fudgedRoll;
} else {
({rolls, best} = rollDice(d20Level, 20));
}
const rollText = formatD20Compact(rolls, best);
// QUEST TRACKING: D20 used
trackQuestProgress('d20');

// JUICE: Visual dice roll animation
showD20RollVisual(best, dc);

if(best >= dc) {
toast(`${rollText} <span style="color:#22c55e;font-weight:bold">SUCCESS!</span>`, 1800);
const targetNames = S.targets.map(id => {
const e = S.enemies.find(e => e.id === id);
return e ? e.n : null;
}).filter(n => n);
S.targets.forEach(targetId => executeD20ActionOnTarget(targetId, actionName));
if(targetNames.length > 0) {
const actionDesc = {'CONFUSE': 'confused', 'STARTLE': 'startled and stunned', 'STEAL': 'robbed', 'RECRUIT': 'recruited'};
if(actionName !== 'STEAL') toast(`${targetNames.join(', ')} ${actionDesc[actionName]}!`, 2500);
}
if(S.asteriskD20Repeats > 1) {
S.asteriskD20Count++;
if(S.asteriskD20Count < S.asteriskD20Repeats) {
S.pending = null; S.targets = [];
render();
setTimeout(() => d20Menu(heroIdx), T(ANIMATION_TIMINGS.TUTORIAL_DELAY));
return;
}
}
finishD20Asterisk(heroIdx);
} else {
toast(`${rollText} needed ${dc} - <span style="color:#ef4444;font-weight:bold">FAILED!</span>`, ANIMATION_TIMINGS.TOAST_MEDIUM);
if(S.asteriskD20Repeats > 1) {
S.asteriskD20Count++;
if(S.asteriskD20Count < S.asteriskD20Repeats) {
S.pending = null; S.targets = [];
render();
setTimeout(() => d20Menu(heroIdx), T(ANIMATION_TIMINGS.TUTORIAL_DELAY));
return;
}
}
finishD20Asterisk(heroIdx);
}
}

function executeD20ActionOnTarget(enemyId, action) {
const enemy = S.enemies.find(e => e.id === enemyId);
if(!enemy) return;
if(action === 'CONFUSE') {
// Confused enemy deals its own POW damage to itself
const dmg = enemy.p;
toast(`Confuse: ${getEnemyDisplayName(enemy)} hits itself for ${dmg}!`, 1800);
dealDamageToEnemy(enemy, dmg);
} else if(action === 'STARTLE') {
enemy.st = Math.max(enemy.st, 1);
SoundFX.play('stun');
// Show stun tutorial popup first time
showTutorialPop('stun_intro', "Nice stun! Enemies won't attack when stunned, and any other sigils they have are wasted while stunned!");
// Check royal quest completion
if(S.royalQuestActive && S.round === 1 && !S.royalQuestCompleted) {
S.royalQuestCompleted = true;
toast(`Royal Quest completed! Ring retrieved!`, 1800);
}
} else if(action === 'STEAL') {
const gold = enemy.p;
S.gold += gold;
upd();
toast(`Stole ${gold} Gold from ${getEnemyDisplayName(enemy)}!`);
} else if(action === 'RECRUIT') {
const heroIdx = S.d20HeroIdx;
const hero = S.heroes[heroIdx];
const recruitName = getEnemyDisplayName(enemy);
// Remove enemy from enemies array immediately
S.enemies = S.enemies.filter(e => e.id !== enemyId);
if(!S.recruits) S.recruits = [];
const existingRecruit = S.recruits.find(r => r.recruitedBy === heroIdx);
if(existingRecruit) {
// Show choice popup: keep current or replace
render();
showRecruitReplaceConfirm(existingRecruit.n, recruitName, () => {
// KEEP current
toast(`Kept ${existingRecruit.n}.`, 1200);
render();
checkCombatEnd();
}, () => {
// REPLACE with new
S.recruits = S.recruits.filter(r => r.recruitedBy !== heroIdx);
const recruit = {...enemy, recruitedBy: heroIdx, isRecruit: true};
S.recruits.push(recruit);
toast(`${recruitName} replaces ${existingRecruit.n}!`, 1500);
render();
checkCombatEnd();
});
} else {
// No existing recruit, just add
const MAX_RECRUITS = 10;
if(S.recruits.length < MAX_RECRUITS) {
const recruit = {...enemy, recruitedBy: heroIdx, isRecruit: true};
S.recruits.push(recruit);
toast(`${recruitName} recruited by ${hero.n}!`, 1500);
// QUEST TRACKING: Recruits held
trackQuestProgress('recruits', S.recruits.length);
} else {
toast(`Squad full! Cannot recruit ${recruitName}.`, 1500);
}
setTimeout(() => {
render();
checkCombatEnd();
}, 300);
}
}
}

function finishD20Asterisk(heroIdx) {
S.pending = null;
S.targets = [];
S.asteriskD20Repeats = 1;
S.asteriskD20Count = 0;
// Use finishAction to properly handle Alpha-granted turns
finishAction(heroIdx);
}

function cancelAction() {
if(S.locked) return;
// If we have targets selected, just clear targets (stay in pending mode)
if(S.currentInstanceTargets && S.currentInstanceTargets.length > 0) {
// Remove targets from S.targets as well
S.currentInstanceTargets.forEach(id => {
  const idx = S.targets.indexOf(id);
  if(idx > -1) S.targets.splice(idx, 1);
});
S.currentInstanceTargets = [];
render();
return;
}
// No targets - fully cancel the action
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
render();
}

// Confirm and execute the currently selected targets
function confirmTargets() {
if(S.locked) return;
if(!S.pending) return;

// D20_TARGET uses S.targets, not S.currentInstanceTargets - check before instancesRemaining guard
if(S.pending === 'D20_TARGET') {
if(!S.targets || S.targets.length === 0) {
  toast('Select at least one target first!');
  return;
}
rollD20();
return;
}

// Guard against fast tapping causing negative instances
if(S.instancesRemaining <= 0) return;

// For other actions, check S.currentInstanceTargets
if(!S.currentInstanceTargets || S.currentInstanceTargets.length === 0) {
toast('Select at least one target first!');
return;
}
const heroIdx = S.activeIdx;

if(S.pending === 'Attack') {
// SAFEGUARD: Make a copy of targets before clearing
const targetsToExecute = [...S.currentInstanceTargets];
debugLog('[CONFIRM] Attack with', targetsToExecute.length, 'targets:', targetsToExecute.join(', '));
if(targetsToExecute.length === 0) {
  toast('No targets selected!');
  return;
}
executeInstance(S.pending, heroIdx, targetsToExecute);
S.instancesRemaining = Math.max(0, S.instancesRemaining - 1);
S.currentInstanceTargets = [];
if(S.instancesRemaining <= 0) {
  setTimeout(() => finishAction(heroIdx), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
} else {
  setTimeout(() => render(), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}
} else if(S.pending === 'Grapple') {
// Safety check for grapple
const hero = S.heroes[heroIdx];
const totalRecoil = S.currentInstanceTargets.reduce((sum, tgtId) => {
  const enemy = S.enemies.find(e => e.id === tgtId);
  return sum + (enemy ? enemy.p : 0);
}, 0) * S.grappleRepeats;
const effectiveHP = (hero.h || 0) + (hero.sh || 0);
if(totalRecoil >= effectiveHP && !hero.g && !hero.ls) {
  toast('Grapple would kill you! Pick weaker targets.', 2000);
  return;
}
for(let i = 0; i < S.grappleRepeats; i++) executeGrapple(heroIdx, [...S.currentInstanceTargets], S.grappleLevel);
S.currentInstanceTargets = [];
finishAction(heroIdx);
} else if(S.pending === 'Shield' || S.pending === 'Heal') {
executeInstance(S.pending, heroIdx, [...S.currentInstanceTargets]);
S.instancesRemaining = Math.max(0, S.instancesRemaining - 1);
S.currentInstanceTargets = [];
if(S.instancesRemaining <= 0) {
  setTimeout(() => finishAction(heroIdx), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
} else {
  setTimeout(() => render(), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}
} else if(S.pending === 'Alpha') {
executeAlphaAction(heroIdx, [...S.currentInstanceTargets]);
S.currentInstanceTargets = [];
// Note: Don't call finishAction here - executeAlphaAction handles everything
// including marking the Alpha user as acted and setting up granted turns
}
}

// Debounce tracking for target clicks to prevent double-fire issues in Proton/touch
let lastTargetTime = 0;
let lastTargetId = null;

function tgtEnemy(id) {
// Debounce: prevent double-fire within 100ms on same target
const now = Date.now();
if(id === lastTargetId && now - lastTargetTime < 100) {
  debugLog('[TARGET] Debounced duplicate click on', id);
  return;
}
lastTargetTime = now;
lastTargetId = id;

if(S.locked) { toast('Wait for enemy turn!'); return; }
SoundFX.play('hop');
if(S.pending === 'D20_TARGET') {
const heroIdx = S.d20HeroIdx;
const maxTargets = 1 + getLevel('Expand', heroIdx);
// Toggle: if already targeted, remove it
if(S.targets.includes(id)) {
  S.targets = S.targets.filter(t => t !== id);
  render();
  return;
}
// Check if we can add more
if(S.targets.length >= maxTargets) {
  toast(`Max ${maxTargets} targets! Click a target to remove it.`);
  return;
}
S.targets.push(id);
// Auto-confirm when targets are full OR all available enemies selected (manual only, not auto-select)
const aliveEnemies = S.enemies.filter(e => e.h > 0 && !S.targets.includes(e.id)).length;
const shouldAutoConfirm = (S.targets.length >= maxTargets || aliveEnemies === 0) && !S.autoSelectInProgress;
if(shouldAutoConfirm) {
  rollD20();
} else {
  render();
}
return;
}
if(!S.pending || !needsEnemyTarget(S.pending)) return;
const heroIdx = S.activeIdx;
const targetsPerInstance = getTargetsPerInstance(S.pending, heroIdx);
if(S.pending === 'Attack') {
debugLog('[TARGET] Attack target clicked:', id, 'Hero:', S.heroes[heroIdx]?.n, 'targetsPerInstance:', targetsPerInstance);
// Toggle: if already targeted, remove it
if(S.currentInstanceTargets.includes(id)) {
  S.currentInstanceTargets = S.currentInstanceTargets.filter(t => t !== id);
  S.targets = S.targets.filter(t => t !== id);
  debugLog('[TARGET] Target removed. currentInstanceTargets:', S.currentInstanceTargets.length);
  render();
  return;
}
// Check if we can add more
if(S.currentInstanceTargets.length >= targetsPerInstance) {
  toast(`Max ${targetsPerInstance} targets! Click a target to remove it.`);
  return;
}
S.targets.push(id);
S.currentInstanceTargets.push(id);
debugLog('[TARGET] Target added. currentInstanceTargets now:', S.currentInstanceTargets.length, S.currentInstanceTargets);
// Count available targets (enemies not yet targeted)
const availableEnemies = S.enemies.filter(e => e.h > 0 && !S.currentInstanceTargets.includes(e.id)).length;
// Auto-confirm when targets are full OR all available enemies selected (manual only, not auto-select)
const shouldAutoConfirm = (S.currentInstanceTargets.length >= targetsPerInstance || availableEnemies === 0) && !S.autoSelectInProgress;
debugLog('[TARGET] shouldAutoConfirm:', shouldAutoConfirm, '(targets:', S.currentInstanceTargets.length, '>=', targetsPerInstance, 'or available:', availableEnemies, '=== 0)');
if(shouldAutoConfirm) {
  debugLog('[TARGET] Auto-confirming with targets:', [...S.currentInstanceTargets]);
  confirmTargets();
} else {
  render();
}
} else if(S.pending === 'Grapple') {
// Toggle: if already targeted, remove it
if(S.currentInstanceTargets.includes(id)) {
  S.currentInstanceTargets = S.currentInstanceTargets.filter(t => t !== id);
  S.targets = S.targets.filter(t => t !== id);
  render();
  return;
}
// Check if we can add more
if(S.currentInstanceTargets.length >= targetsPerInstance) {
  toast(`Max ${targetsPerInstance} targets! Click a target to remove it.`);
  return;
}
S.targets.push(id);
S.currentInstanceTargets.push(id);
// Grapple L2+ NEVER auto-confirms - player may want to stun fewer targets (less recoil damage)
const grappleLevel = getLevel('Grapple', heroIdx);
const availableEnemiesForGrapple = S.enemies.filter(e => e.h > 0 && !S.currentInstanceTargets.includes(e.id)).length;
// Only auto-confirm for Grapple L1 when all available targets selected
const shouldAutoConfirmGrapple = grappleLevel <= 1 && availableEnemiesForGrapple === 0 && !S.autoSelectInProgress;
if(shouldAutoConfirmGrapple) {
  confirmTargets();
} else {
  render();
}
}
}

function tgtHero(id) {
// Debounce: prevent double-fire within 100ms on same target (reuse enemy debounce vars)
const now = Date.now();
if(id === lastTargetId && now - lastTargetTime < 100) {
  debugLog('[TARGET] Debounced duplicate click on', id);
  return;
}
lastTargetTime = now;
lastTargetId = id;

if(S.locked) { toast('Wait for enemy turn!'); return; }
if(!S.pending || !needsHeroTarget(S.pending)) return;
SoundFX.play('hop');
const heroIdx = S.activeIdx;
const h = S.heroes[heroIdx];
const target = S.heroes.find(x => x.id === id);
if(!target) return;
const targetsPerInstance = getTargetsPerInstance(S.pending, heroIdx);
if(S.pending === 'Shield' || S.pending === 'Heal') {
// Last Stand heroes can only be targeted by Heal, not Shield
if(S.pending === 'Shield' && target.ls) { toast(`${target.n} is in Last Stand - can't gain shields!`); return; }
// Toggle: if already targeted, remove it
if(S.currentInstanceTargets.includes(id)) {
  S.currentInstanceTargets = S.currentInstanceTargets.filter(t => t !== id);
  S.targets = S.targets.filter(t => t !== id);
  render();
  return;
}
// Check if we can add more
if(S.currentInstanceTargets.length >= targetsPerInstance) {
  toast(`Max ${targetsPerInstance} targets! Click a target to remove it.`);
  return;
}
S.targets.push(id);
S.currentInstanceTargets.push(id);
// Count available heroes (alive heroes not yet targeted; Shield excludes LS heroes)
const availableHeroes = S.heroes.filter(hero => {
  if(S.currentInstanceTargets.includes(hero.id)) return false;
  if(S.pending === 'Shield') return hero.h > 0 && !hero.ls;
  return hero.h > 0 || hero.ls;
}).length;
// Auto-confirm when targets are full OR all available heroes selected (manual only, not auto-select)
const shouldAutoConfirm = (S.currentInstanceTargets.length >= targetsPerInstance || availableHeroes === 0) && !S.autoSelectInProgress;
if(shouldAutoConfirm) {
  confirmTargets();
} else {
  render();
}
} else if(S.pending === 'Alpha') {
// Alpha: can't target self, already-acted heroes, or Last Stand heroes
const alphaUser = S.heroes[S.activeIdx];
if(!alphaUser) return; // Guard against invalid activeIdx
if(id === alphaUser.id) { toast('Cannot Alpha yourself!'); return; }
if(target.ls) { toast(`${target.n} is in Last Stand - can only use D20!`); return; }
const targetIdx = S.heroes.findIndex(x => x.id === id);
if(S.acted.includes(targetIdx)) { toast('That hero already acted!'); return; }
// Toggle: if already targeted, remove it
if(S.currentInstanceTargets.includes(id)) {
  S.currentInstanceTargets = S.currentInstanceTargets.filter(t => t !== id);
  S.targets = S.targets.filter(t => t !== id);
  render();
  return;
}
// Check if we can add more
if(S.currentInstanceTargets.length >= S.alphaTargetsNeeded) {
  toast(`Max ${S.alphaTargetsNeeded} targets! Click a target to remove it.`);
  return;
}
S.targets.push(id);
S.currentInstanceTargets.push(id);
// Count available Alpha targets (alive heroes who haven't acted, not self, not already targeted)
const availableAlphaTargets = S.heroes.filter((hero, idx) => {
  if(hero.id === alphaUser.id) return false; // Can't target self
  if(S.acted.includes(idx)) return false; // Already acted
  if(hero.h <= 0 && !hero.ls) return false; // Dead
  if(S.currentInstanceTargets.includes(hero.id)) return false; // Already targeted
  return true;
}).length;
// Auto-confirm when targets are full OR all available heroes selected (manual only, not auto-select)
const shouldAutoConfirmAlpha = (S.currentInstanceTargets.length >= S.alphaTargetsNeeded || availableAlphaTargets === 0) && !S.autoSelectInProgress;
if(shouldAutoConfirmAlpha) {
  confirmTargets();
} else {
  render();
}
}
}

function executeAlphaAction(alphaUserIdx, targetIds) {
const alphaUser = S.heroes[alphaUserIdx];
const actionsToGrant = S.alphaLevel;
// Mark Alpha user as acted (forfeits ALL actions)
S.acted.push(alphaUserIdx);
// Mark first action as used (for Asterisk) - prevents Asterisk from triggering on Round 2+
if(alphaUser && !alphaUser.firstActionUsed) alphaUser.firstActionUsed = true;
S.pending = null;
S.targets = [];
toast(`${alphaUser.n} used Alpha! Granting ${actionsToGrant} action${actionsToGrant>1?'s':''} to ${targetIds.length} hero${targetIds.length>1?'es':''}!`);
// QUEST TRACKING: Alpha used
trackQuestProgress('alpha');
// Set up multi-action state for granted heroes
S.alphaGrantedActions = [];
targetIds.forEach(id => {
const targetIdx = S.heroes.findIndex(h => h.id === id);
if(targetIdx >= 0) {
for(let i = 0; i < actionsToGrant; i++) {
S.alphaGrantedActions.push(targetIdx);
}
}
});
S.alphaCurrentAction = 0;
// Start first granted action
if(S.alphaGrantedActions.length > 0) {
const nextHeroIdx = S.alphaGrantedActions[0];
const nextHero = S.heroes[nextHeroIdx];
// Auto-skip stunned heroes receiving Alpha-granted turns
if(nextHero && nextHero.st > 0) {
toast(`${nextHero.n} is stunned - Alpha-granted turn skipped!`);
S.alphaCurrentAction++;
// Skip all granted turns for this stunned hero
while(S.alphaCurrentAction < S.alphaGrantedActions.length && S.alphaGrantedActions[S.alphaCurrentAction] === nextHeroIdx) {
S.alphaCurrentAction++;
}
if(S.alphaCurrentAction >= S.alphaGrantedActions.length) {
S.alphaGrantedActions = [];
S.alphaCurrentAction = 0;
checkTurnEnd();
render();
return;
}
const actualNext = S.alphaGrantedActions[S.alphaCurrentAction];
S.activeIdx = actualNext;
toast(`${S.heroes[actualNext].n}'s turn (Alpha-granted ${S.alphaCurrentAction + 1}/${S.alphaGrantedActions.length})!`);
} else {
S.activeIdx = nextHeroIdx;
toast(`${nextHero.n}'s turn (Alpha-granted ${S.alphaCurrentAction + 1}/${S.alphaGrantedActions.length})!`);
}
}
render();
}

function selectEncampmentTarget(enemyId) {
if(!S.selectingEncampmentTargets) return;
const kills = S.encampmentEarlyKills;
const currentSelected = S.encampmentSelectedTargets;
// Toggle selection
if(currentSelected.includes(enemyId)) {
S.encampmentSelectedTargets = currentSelected.filter(id => id !== enemyId);
} else {
if(currentSelected.length >= kills) {
toast(`Already selected ${kills} enem${kills>1?'ies':'y'}!`);
return;
}
S.encampmentSelectedTargets.push(enemyId);
}
render();
}

function confirmEncampmentKills() {
if(!S.selectingEncampmentTargets) return;
const kills = S.encampmentEarlyKills;
const selected = S.encampmentSelectedTargets;
if(selected.length !== kills) {
toast(`Select ${kills} enem${kills>1?'ies':'y'} to remove!`);
return;
}
// Remove selected enemies from S.enemies
S.enemies = S.enemies.filter(e => !selected.includes(e.id));
toast(`${kills} enem${kills>1?'ies':'y'} removed!`, 1200);
// Clear flags
S.selectingEncampmentTargets = false;
S.encampmentEarlyKills = 0;
S.encampmentSelectedTargets = [];
// Start combat normally
render();
}

function executeInstance(action, heroIdx, targets) {
const h = S.heroes[heroIdx];
const pow = h.p;
// SAFEGUARD: Ensure targets is a valid array
if(!Array.isArray(targets)) {
  console.error('[ATTACK] targets is not an array:', targets);
  targets = [];
}
debugLog('[EXECUTE] executeInstance called - action:', action, 'targets:', targets.length, targets);
if(action === 'Attack') {
// Trigger attacker animation
triggerAttackAnimation(h.id);

// DEBUG: Log attack targets
debugLog('[ATTACK] Processing attack with', targets.length, 'targets:', JSON.stringify(targets));

const targetDetails = [];
const damagedEnemyIds = [];
// First pass: Apply damage to all targets
targets.forEach(tgtId => {
debugLog('[ATTACK] Processing target:', tgtId);
const e = S.enemies.find(x => x.id === tgtId);
debugLog('[ATTACK] Found enemy:', e ? e.n : 'NOT FOUND', e ? `HP: ${e.h}/${e.m}` : '');
if(!e) return;
// Guard: skip already-dead enemies (prevents double-award from race condition)
if(e.h <= 0 && (!e.g || e.g === 0)) return;
const hpBefore = e.h;
damagedEnemyIds.push(e.id);
// Apply damage (without animation yet)
applyDamageToTarget(e, pow, {isHero: false, skipRewards: false});
const hpAfter = e.h;
debugLog('[ATTACK] Damage applied to', e.n, '- HP:', hpBefore, '->', hpAfter);
targetDetails.push({name: e.n, before: hpBefore, after: hpAfter});
// Track turn damage for damage counter
S.turnDamage += pow;
// RIBBLETON TUTORIAL: Track Wolf damage/death
if(tutorialState && S.floor === 0 && e.n === 'Wolf') {
debugLog('[TUTORIAL] Wolf took damage! HP now:', e.h, 'wolfDamaged was:', tutorialState.wolfDamaged);
if(e.h > 0 && !tutorialState.wolfDamaged) {
tutorialState.wolfDamaged = true;
debugLog('[TUTORIAL] Set wolfDamaged = true');
}
}
});
// Second pass: Trigger hit animations when attacker "lands" the hit
setTimeout(() => {
damagedEnemyIds.forEach((id, idx) => {
triggerHitAnimation(id);
// JUICE: Floating damage numbers
const isBigHit = pow >= 5;
showFloatingNumber(id, `-${pow}`, isBigHit ? 'critical' : 'damage', idx * 15);
});

// JUICE: Sound (screen shake only on defeat/last stand)
if(damagedEnemyIds.length > 0) {
SoundFX.play(pow >= 5 ? 'crit' : 'hit');
// Show cumulative damage counter for this hero's turn
showDamageCounter(S.turnDamage);
// Show happy reaction when hero lands a hit
setHeroReaction(h.id, 'happy', 1000);
}
}, T(ANIMATION_TIMINGS.ATTACK_IMPACT));
// Third pass: Handle deaths and cleanup
const deadEnemies = [];
const dyingFlydras = [];
targets.forEach(tgtId => {
const e = S.enemies.find(x => x.id === tgtId);
if(!e) return;
if(e.h <= 0 && e.g === 0) {
// FLYDRA: Special death handling
if(e.isFlydra && e.flydraState === 'alive') {
handleFlydraDeath(e);
dyingFlydras.push(e);
} else if(!e.isFlydra) {
// JUICE: Knockout animation and death sound
triggerKnockout(e.id);
deadEnemies.push(e);
// RIBBLETON TUTORIAL: Track Wolf/Goblin kills
if(tutorialState && S.floor === 0) {
if(e.n === 'Wolf') tutorialState.wolfKilled = true;
if(e.n === 'Goblin') tutorialState.goblinKilled = true;
}
}
}
});
// Remove dead enemies after short delay for knockout animation
if(deadEnemies.length > 0) {
SoundFX.play('croak'); // Froggy croak for enemy defeat
triggerScreenShake(true); // Heavy shake on enemy defeat
// All heroes smile when enemy is killed (gold/xp awarded)
setAllHeroesReaction('happy', 1200);
setTimeout(() => {
deadEnemies.forEach(e => {
S.enemies = S.enemies.filter(enemy => enemy.id !== e.id);
});
render();
// Check combat end AFTER enemies are removed
checkCombatEnd();
}, T(200));
}
// FLYDRA: Check if all heads are now dying (victory condition)
if(dyingFlydras.length > 0 && isFlydraDefeated()) {
SoundFX.play('croak');
triggerScreenShake(true);
setTimeout(() => {
S.enemies = S.enemies.filter(e => !e.isFlydra);
render();
checkCombatEnd();
}, T(300));
} else if(dyingFlydras.length > 0) {
render(); // Re-render to show flipped cards
}
if(targetDetails.length > 0) {
const targetStrings = targetDetails.map(t => `${t.name} (❤${t.before}→❤${t.after})`);
toast(`${h.n} attacked ${targetStrings.join(', ')}!`);
}
// Combat end check now happens inside the setTimeout after enemies are removed
} else if(action === 'Shield') {
const targetNames = [];
const shieldedIds = [];
const shieldAmt = 2 * pow;
targets.forEach(tgtId => {
const target = S.heroes.find(x => x.id === tgtId);
if(!target) return;
target.sh += shieldAmt;
if(target.sh > target.m) target.sh = target.m;
targetNames.push(target.n);
shieldedIds.push(target.id);
});
// Trigger all shield animations simultaneously with amounts
shieldedIds.forEach(id => triggerShieldAnimation(id, shieldAmt));
if(targetNames.length > 0) {
toast(`${targetNames.join(' and ')} gained ${shieldAmt} shield!`);
// QUEST TRACKING: Shield applied
trackQuestProgress('shield');
trackQuestProgress('targets', targetNames.length);
}
} else if(action === 'Heal') {
const healed = [];
const revived = [];
const healedIds = [];
const healAmt = 2 * pow;
targets.forEach(tgtId => {
const target = S.heroes.find(x => x.id === tgtId);
if(!target) return;
healedIds.push(target.id);
if(target.ls) {
target.ls = false;
target.lst = 0;
target.h = Math.min(healAmt, target.m);
revived.push(target.n);
} else {
target.h += healAmt;
if(target.h > target.m) target.h = target.m;
healed.push(target.n);
}
});
// Trigger all heal animations simultaneously with amounts
healedIds.forEach(id => triggerHealAnimation(id, healAmt));
// Show happy reaction on the healer
setHeroReaction(h.id, 'happy', 1000);
// Healed targets also smile
healedIds.forEach(id => setHeroReaction(id, 'happy', 1200));
if(healed.length > 0) toast(`${healed.join(' and ')} restored ${healAmt} HP!`);
if(revived.length > 0) toast(`${revived.join(' and ')} revived with ${healAmt} HP!`);
// QUEST TRACKING: Heal used
trackQuestProgress('heal');
trackQuestProgress('targets', healedIds.length);
}
}

function executeGrapple(heroIdx, targets, stunDuration) {
const h = S.heroes[heroIdx];
// Trigger attacker animation (grapple uses same animation as attack)
triggerAttackAnimation(h.id);
// JUICE: Stun/grapple sound effect
SoundFX.play('stun');
let totalDmg = 0;
const targetNames = [];
targets.forEach(tgtId => {
const e = S.enemies.find(x => x.id === tgtId);
if(!e) return;
totalDmg += e.p;
// Uniform stun rule: Math.max prevents stun-lock for all sources
e.st = Math.max(e.st, stunDuration);
targetNames.push(e.n);
// Show stun tutorial popup first time
showTutorialPop('stun_intro', "Nice stun! Enemies won't attack when stunned, and any other sigils they have are wasted while stunned!");
// Check royal quest completion
if(S.royalQuestActive && S.round === 1 && !S.royalQuestCompleted) {
S.royalQuestCompleted = true;
toast(`Royal Quest completed! Ring retrieved!`, 1800);
}
});
if(targetNames.length > 0) {
toast(`${h.n} grappled ${targetNames.join(', ')} - stunned ${stunDuration} turn${stunDuration>1?'s':''}!`);
// QUEST TRACKING: Grapple used
trackQuestProgress('grapple');
trackQuestProgress('targets', targetNames.length);
}
if(totalDmg > 0) {
// Hero takes recoil damage - trigger hit animation
triggerHitAnimation(h.id);
const hpBefore = h.h;
const damage = applyDamageToTarget(h, totalDmg, {isHero: true, silent: true});
let msg = `${h.n} took Grapple recoil:`;
if(damage.shieldLost > 0 && damage.hpLost > 0) {
msg += ` -${damage.shieldLost}🛡️ -${damage.hpLost}❤️`;
} else if(damage.shieldLost > 0) {
msg += ` -${damage.shieldLost}🛡️`;
} else if(damage.hpLost > 0) {
msg += ` -${damage.hpLost}❤️`;
}
toast(msg);
// Notify if hero entered Last Stand from recoil (silent:true suppresses it above)
if(h.ls && hpBefore > 0) {
toast(`${h.n} entered Last Stand from Grapple recoil!`, 3000, 'critical');
}
}
}

function dealDamageToEnemy(enemy, dmg) {
triggerHitAnimation(enemy.id);
const hpBefore = enemy.h;

// Apply damage using unified function
applyDamageToTarget(enemy, dmg, {isHero: false, skipRewards: false});
const hpAfter = enemy.h;

// JUICE: Floating damage number
const isBigHit = dmg >= 10;
showFloatingNumber(enemy.id, `-${dmg}`, isBigHit ? 'critical' : 'damage');

// JUICE: Sound effect (screen shake only on defeat/last stand)
SoundFX.play(isBigHit ? 'crit' : 'hit');

// Show damage toast
toast(`${getEnemyDisplayName(enemy)} took ${dmg} damage (❤${hpBefore}→❤${hpAfter})!`);

// RIBBLETON TUTORIAL: Track Wolf damage/death
if(tutorialState && S.floor === 0 && enemy.n === 'Wolf') {
debugLog('[TUTORIAL] Wolf took damage! HP now:', enemy.h, 'wolfDamaged was:', tutorialState.wolfDamaged);
if(enemy.h > 0 && !tutorialState.wolfDamaged) {
tutorialState.wolfDamaged = true;
debugLog('[TUTORIAL] Set wolfDamaged = true');
}
}

// Handle enemy death
if(enemy.h <= 0 && enemy.g === 0) {
// FLYDRA: Special death handling
if(enemy.isFlydra && enemy.flydraState === 'alive') {
handleFlydraDeath(enemy);
// Check if all Flydra heads are now dying
if(isFlydraDefeated()) {
SoundFX.play('croak');
triggerScreenShake(true);
setTimeout(() => {
S.enemies = S.enemies.filter(e => !e.isFlydra);
render();
checkCombatEnd();
}, T(300));
} else {
render(); // Re-render to show flipped card
}
} else if(!enemy.isFlydra) {
// JUICE: Knockout animation and death sound
triggerKnockout(enemy.id);
SoundFX.play('death');
triggerScreenShake(true); // Heavy shake on enemy defeat

// RIBBLETON TUTORIAL: Track Wolf/Goblin/Fly kills
if(tutorialState && S.floor === 0) {
if(enemy.n === 'Wolf') tutorialState.wolfKilled = true;
if(enemy.n === 'Goblin') tutorialState.goblinKilled = true;
// Tutorial fly quest: "Munch on a Fly" (1G reward)
if(enemy.n === 'Fly' && !S.tutorialFlags.tutorial_fly_munched) {
S.tutorialFlags.tutorial_fly_munched = true;
savePermanent();
}
}

// QUEST TRACKING: Enemy killed
trackQuestProgress('enemyKill', enemy.n);

// Remove enemy after knockout animation
setTimeout(() => {
  S.enemies = S.enemies.filter(e => e.id !== enemy.id);
  render();
  checkCombatEnd();
}, T(300));
}
}
}

function finishAction(heroIdx) {
// Check if this is an Alpha-granted action
if(S.alphaGrantedActions && S.alphaGrantedActions.length > 0) {
S.alphaCurrentAction++;
// Remove one bonus turn stack from the current hero
const currentHero = S.heroes[heroIdx];
if(currentHero) {
removeBonusTurnStack(currentHero.id, true);
}
if(S.alphaCurrentAction < S.alphaGrantedActions.length) {
// More Alpha-granted actions remain
const nextHeroIdx = S.alphaGrantedActions[S.alphaCurrentAction];
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
S.activeIdx = nextHeroIdx;
// Keep turnDamage - Alpha bonus turns count as same turn for damage counter
toast(`${S.heroes[nextHeroIdx].n}'s turn (Alpha-granted ${S.alphaCurrentAction + 1}/${S.alphaGrantedActions.length})!`);
render();
return;
} else {
// All Alpha-granted actions complete - DON'T consume recipient's normal turn
S.alphaGrantedActions = [];
S.alphaCurrentAction = 0;
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
S.activeIdx = -1;
S.turnDamage = 0;
autosave();
checkTurnEnd();
render();
return;
}
}
// Normal action finish
S.acted.push(heroIdx);
// Mark first action as used (for Asterisk) only when action commits
const h = S.heroes[heroIdx];
if(h && !h.firstActionUsed) h.firstActionUsed = true;
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
S.activeIdx = -1;
S.turnDamage = 0; // Reset damage counter for next hero's turn

// RIBBLETON TUTORIAL: Check advancement after action using TutorialManager
TutorialManager.advanceStage({action: 'finish', hero: h.n, round: S.round});

// Autosave after each hero action
autosave();

checkTurnEnd();
render();
}

// Handle ambush situation where all heroes are stunned - player confirms to proceed to enemy turn
function confirmAmbushSkip() {
// Mark all stunned heroes as having "acted" (they skip their turn)
S.heroes.forEach((h, idx) => {
if(h.st > 0 && !S.acted.includes(idx)) {
S.acted.push(idx);
}
});
toast('Heroes skip their turn!', 1000);
checkTurnEnd();
render();
}

function checkTurnEnd() {
// Guard: if combat is already ending, don't interfere
if(S.combatEnding) return;
// First check if combat has ended (all enemies dead or all heroes in last stand)
// This prevents continuing turn progression after victory/defeat
if(S.enemies.length === 0 || S.heroes.every(h => h.ls)) {
checkCombatEnd(); // Trigger defeat/victory handling (e.g., all heroes LS from Grapple recoil)
return;
}

// Check if all non-stunned heroes have acted (optimized single-pass)
const allActedIncludingLS = S.heroes.every((h, idx) => {
return h.st > 0 || S.acted.includes(idx);
});
if(allActedIncludingLS) {
S.heroes.forEach(h => { if(h.ls) h.lst++; });

// RIBBLETON TUTORIAL: Handle enemy turn start using TutorialManager
// If tutorial is showing a popup, delay enemy turn until popup is dismissed
const tutorialBlocking = TutorialManager.onEnemyTurnStart(() => {
setTimeout(() => { S.locked = true; enemyTurn(); }, T(ANIMATION_TIMINGS.TURN_TRANSITION));
});
if(!tutorialBlocking) {
setTimeout(() => { S.locked = true; enemyTurn(); }, T(ANIMATION_TIMINGS.TURN_TRANSITION));
}
}
}

// ===== FLYDRA MECHANICS =====
/**
 * Handle Flydra death - grants ghost charges to other heads, enters dying state
 * Returns true if this was a Flydra (death handled specially), false otherwise
 */
function handleFlydraDeath(flydra) {
if(!flydra.isFlydra) return false;

// Grant ghost charges to all OTHER living Flydra heads
const ghostCharges = S.heroes.length;
const otherFlydras = S.enemies.filter(e => e.isFlydra && e.id !== flydra.id && e.flydraState === 'alive');

otherFlydras.forEach(other => {
other.g = Math.min((other.g || 0) + ghostCharges, 9);
});

if(otherFlydras.length > 0) {
toast(`${flydra.n} falls! Grants ${ghostCharges} Ghost to ${otherFlydras.length} other head${otherFlydras.length > 1 ? 's' : ''}!`, 2000);
}

// Enter dying state - card will flip
flydra.flydraState = 'dying';
flydra.h = 0;

return true;
}

/**
 * Check if dying Flydras should revive (called at start of enemy turn)
 */
function checkFlydraRevival() {
const dyingFlydras = S.enemies.filter(e => e.isFlydra && e.flydraState === 'dying');
const aliveFlydras = S.enemies.filter(e => e.isFlydra && e.flydraState === 'alive');

if(dyingFlydras.length === 0) return;

// If any Flydras are still alive, revive the dying ones
if(aliveFlydras.length > 0) {
dyingFlydras.forEach(flydra => {
const reviveHP = Math.ceil(flydra.m / 2); // 50% HP
flydra.h = reviveHP;
flydra.flydraState = 'alive';
toast(`${flydra.n} regenerates with ${reviveHP} HP!`, 1800);
triggerHealAnimation(flydra.id, reviveHP);
});
} else {
// All Flydras are dying - they all die for real
// Award flat 150 gold for defeating the Flydra (entire boss, not per-head)
const flydraGold = 150 * (S.gameMode === 'fu' ? 3 : 1); // Frogged Up multiplier
S.gold += flydraGold;
S.combatGold += flydraGold;
trackQuestProgress('goldEarned', flydraGold);
SoundFX.play('coinDrop');
upd();
dyingFlydras.forEach(flydra => {
flydra.flydraState = 'dead';
// QUEST TRACKING: Flydra head killed
trackQuestProgress('enemyKill', 'Flydra');
});
// Remove all dead Flydras
S.enemies = S.enemies.filter(e => !e.isFlydra || e.flydraState !== 'dead');
toast('All Flydra heads defeated!', 2000);
checkCombatEnd();
}
}

/**
 * Check if Flydra fight is won (all heads dying/dead simultaneously)
 */
function isFlydraDefeated() {
const flydras = S.enemies.filter(e => e.isFlydra);
if(flydras.length === 0) return false; // No Flydras in this fight

// Victory if all Flydras are in 'dying' state (none alive)
const aliveFlydras = flydras.filter(f => f.flydraState === 'alive');
return aliveFlydras.length === 0;
}

function enemyTurn() {
// FLYDRA: Check for revival at start of enemy turn
checkFlydraRevival();

// Safety check: don't start enemy turn if combat has ended
if(S.enemies.length === 0 || S.heroes.every(h => h.ls)) {
checkCombatEnd();
return;
}

S.turn = 'enemy';
S.acted = [];
S.activeIdx = -1;
showTurnBanner('enemy-turn', '⚔️ Enemy Turn');
render();
S.enemies.forEach(e => {
// NOTE: Stun decrement moved to endEnemyTurn() so enemies actually skip their turn
e.turnsSinceGain++;
e.alphaActed = false;
});
// Process recruits - increment turnsSinceGain (stun decrement moved to endEnemyTurn)
if(S.recruits) {
S.recruits.forEach(r => {
if(!r.turnsSinceGain) r.turnsSinceGain = 0;
r.turnsSinceGain++;
});
}
setTimeout(() => executeAlphaPhase(), T(ANIMATION_TIMINGS.ALPHA_PHASE_START));
}

function drawEnemyStartSigil(enemy, base, forceLevel1 = false) {
const pool = base.pool;
if(!pool || !Array.isArray(pool) || pool.length === 0) return;
const heldSigils = enemy.s.map(sigil => sigil.sig);
// Filter to available sigils (not already held)
const availableSigils = pool.filter(s => !heldSigils.includes(s));
if(availableSigils.length === 0) return;
// Pick random sigil
const sig = availableSigils[Math.floor(Math.random() * availableSigils.length)];
// Calculate level: use sigilLevels override if defined, otherwise maxLevel
let level;
if(forceLevel1) {
level = 1;
} else {
const maxLvl = (base.sigilLevels && base.sigilLevels[sig]) || base.maxLevel || 1;
level = maxLvl === 1 ? 1 : 1 + Math.floor(Math.random() * maxLvl);
}
enemy.s.push({sig, level, perm:false});
}

function drawEnemySigil(enemy) {
const pool = enemy.pool;
if(!pool || !Array.isArray(pool) || pool.length === 0) return;
const heldSigils = enemy.s.map(sigil => sigil.sig);
// Filter pool: exclude held sigils AND Asterisk (only allowed turn 1)
const availableSigils = pool.filter(s => !heldSigils.includes(s) && s !== 'Asterisk');
if(availableSigils.length === 0) return;
// Pick random sigil
const sig = availableSigils[Math.floor(Math.random() * availableSigils.length)];
// Calculate level based on enemy type
let level;
if(enemy.isFlydra) {
// Flydra: level = number of heroes (L2 normal, L3 in Frogged Up)
level = enemy.flydraLevel || S.heroes.length;
} else {
// Other enemies: use sigilLevels override if defined, otherwise maxLevel
const maxLvl = (enemy.sigilLevels && enemy.sigilLevels[sig]) || enemy.maxLevel || 1;
level = maxLvl === 1 ? 1 : 1 + Math.floor(Math.random() * maxLvl);
}
enemy.s.push({sig, level, perm:false, newlyDrawn:true});
SoundFX.play('enemyDraw');
toast(`${getEnemyDisplayName(enemy)} drew ${sig} L${level}!`, 1800, 'warning');
// Clear newly-drawn flag after animation completes
setTimeout(() => {
const drawnSigil = enemy.s.find(s => s.sig === sig && s.newlyDrawn);
if(drawnSigil) drawnSigil.newlyDrawn = false;
}, 1000);
}

/**
 * Executes Alpha phase of enemy turn.
 *
 * Alpha Mechanic:
 * - Enemies with Alpha sigil grant bonus actions to allies
 * - Alpha enemy does NOT act themselves (skips normal turn)
 * - Chooses strongest ally (highest POW, then most sigils)
 * - Grants Level × Attack actions to chosen ally
 * - All Alpha actions resolve before Recruit/Normal phases
 *
 * Execution Order:
 * 1. Find all non-stunned enemies with Alpha sigil
 * 2. For each Alpha enemy: Grant attacks to best ally
 * 3. Mark Alpha enemy as "acted" (skips normal phase)
 * 4. Continue to Recruit phase
 */
function executeAlphaPhase() {
const alphaEnemies = S.enemies.filter(e => e.st === 0 && e.s.some(sigil => sigil.sig === 'Alpha' && !sigil.perm));
if(alphaEnemies.length === 0) { setTimeout(executeRecruitPhase, T(ANIMATION_TIMINGS.PHASE_TRANSITION)); return; }
// Execute all Alpha enemies in reading order with minimal stagger
let delay = 0;
alphaEnemies.forEach((alphaEnemy, idx) => {
setTimeout(() => {
const allies = S.enemies.filter(e => e.id !== alphaEnemy.id && e.h > 0 && e.st === 0 && !e.s.some(s => s.sig === 'Alpha' && !s.perm));
if(allies.length === 0) { toast(`${alphaEnemy.n}'s Alpha has no valid allies!`); alphaEnemy.alphaActed = true; return; }
allies.sort((a, b) => { if(b.p !== a.p) return b.p - a.p; return b.s.length - a.s.length; });
const bestAlly = allies[0];
const alphaSigil = alphaEnemy.s.find(s => s.sig === 'Alpha');
const attacks = alphaSigil.level;
toast(`${alphaEnemy.n} grants ${bestAlly.n} ${attacks} attack${attacks>1?'s':''}!`);
for(let i = 0; i < attacks; i++) executeEnemyBaseAttack(bestAlly);
alphaEnemy.alphaActed = true;
}, delay);
delay += T(ANIMATION_TIMINGS.ENEMY_ACTION_DELAY); // Minimal stagger (was 600ms)
});
// Wait for longest animation to complete
setTimeout(() => executeRecruitPhase(), delay + T(600));
}

function executeRecruitPhase() {
if(!S.recruits || S.recruits.length === 0) { setTimeout(executeNormalEnemyPhase, T(ANIMATION_TIMINGS.PHASE_TRANSITION)); return; }
// Execute all recruits in reading order with minimal stagger
let delay = 0;
S.recruits.forEach((recruit, idx) => {
setTimeout(() => executeRecruitTurn(recruit), delay);
delay += T(ANIMATION_TIMINGS.ENEMY_ACTION_DELAY); // Minimal stagger (was 600ms)
});
// Wait for longest animation to complete
setTimeout(() => executeNormalEnemyPhase(), delay + T(600));
}

function executeRecruitTurn(recruit) {
if(recruit.st > 0) {
toast(`${recruit.n} (Recruit) is stunned!`);
// Clear drawn sigils even when stunned - they don't persist
recruit.s = recruit.s.filter(s => s.perm);
return;
}
if(recruit.h <= 0) return; // Dead recruit
// Recruit attacks enemies (not heroes)
executeRecruitBaseAttack(recruit);
const drawnSigils = recruit.s.filter(s => !s.perm && s.sig !== 'Alpha');
drawnSigils.forEach(sigil => executeRecruitSigil(recruit, sigil));
recruit.s = recruit.s.filter(s => s.perm);
render();
}

function executeRecruitBaseAttack(recruit) {
// Target lowest HP enemy
if(S.enemies.length === 0) return;
const targets = S.enemies.filter(e => e.h > 0);
if(targets.length === 0) return;
targets.sort((a, b) => a.h - b.h);
const target = targets[0];
dealDamageToEnemy(target, recruit.p);
toast(`${recruit.n} (Recruit) attacked ${target.n} for ${recruit.p}!`);
}

function executeRecruitSigil(recruit, sigil) {
const {sig, level} = sigil;
if(sig === 'Attack') {
for(let i = 0; i < level; i++) {
if(S.enemies.length === 0) return;
const targets = S.enemies.filter(e => e.h > 0);
if(targets.length === 0) return;
targets.sort((a, b) => a.h - b.h);
const target = targets[0];
dealDamageToEnemy(target, recruit.p);
toast(`${recruit.n} (Recruit) ${sig} attacked ${target.n} for ${recruit.p}!`);
}
} else if(sig === 'Shield') {
const shieldAmt = 2 * recruit.p * level;
recruit.sh = (recruit.sh || 0) + shieldAmt;
if(recruit.sh > recruit.m) recruit.sh = recruit.m;
toast(`${recruit.n} (Recruit) gained ${shieldAmt} shield!`);
} else if(sig === 'Heal') {
const healAmt = 2 * recruit.p * level;
// Heal lowest HP hero (prioritize Last Stand heroes for revive)
const targets = S.heroes.filter(h => (h.h > 0 && !h.ls) || h.ls);
if(targets.length > 0) {
targets.sort((a, b) => {
if(a.ls && !b.ls) return -1;
if(!a.ls && b.ls) return 1;
return a.h - b.h;
});
const healTarget = targets[0];
if(healTarget.ls) {
healTarget.ls = false;
healTarget.lst = 0;
healTarget.h = Math.min(healAmt, healTarget.m);
toast(`${recruit.n} (Recruit) revived ${healTarget.n}!`);
} else {
healTarget.h += healAmt;
if(healTarget.h > healTarget.m) healTarget.h = healTarget.m;
toast(`${recruit.n} (Recruit) healed ${healTarget.n} for ${healAmt}!`);
}
}
} else if(sig === 'Grapple') {
if(S.enemies.length === 0) return;
const targets = S.enemies.filter(e => e.h > 0);
if(targets.length === 0) return;
targets.sort((a, b) => a.h - b.h);
const target = targets[0];
const dmgToRecruit = target.p;
// Apply stun BEFORE recoil check (consistent with player Grapple behavior)
target.st = Math.max(target.st, level);
toast(`${recruit.n} (Recruit) grappled ${target.n}! Stunned for ${level} turn${level > 1 ? 's' : ''}!`);
// Use applyDamageToTarget so shields/ghost are respected
const recoil = applyDamageToTarget(recruit, dmgToRecruit, {isHero: false, skipRewards: true, silent: true});
if(recruit.h <= 0) {
recruit.h = 0;
toast(`${recruit.n} (Recruit) defeated by grapple recoil!`);
S.recruits = S.recruits.filter(r => r.id !== recruit.id);
}
} else if(sig === 'Ghost') {
recruit.g = (recruit.g || 0) + level;
if(recruit.g > 9) recruit.g = 9;
toast(`${recruit.n} (Recruit) gained ${level} Ghost charge!`);
}
}

function executeNormalEnemyPhase() {
// Execute all enemies in reading order (top-down, left-right) with minimal stagger
const allEnemies = [...S.enemies].sort((a, b) => a.li - b.li); // Sort by lane index

// Track enemy turn progress for UI
S.enemyTurnTotal = allEnemies.length;
S.enemyTurnCurrent = 0;

let delay = 0;
allEnemies.forEach((enemy, idx) => {
setTimeout(() => {
S.enemyTurnCurrent = idx + 1;
render(); // Update header to show progress
// Guard: skip if enemy died mid-turn (e.g., from Alpha phase or Grapple recoil)
if(enemy.h <= 0 || !S.enemies.includes(enemy)) return;
executeEnemyTurn(enemy);
}, delay);
delay += T(ANIMATION_TIMINGS.ENEMY_ACTION_DELAY); // Just enough stagger for visual clarity (was 600ms)
});

// Wait for longest animation to complete (600ms per enemy action + stagger)
setTimeout(() => endEnemyTurn(), delay + T(600));
}

function executeEnemyTurn(enemy) {
// FLYDRA: Dying Flydras don't act
if(enemy.isFlydra && enemy.flydraState === 'dying') { return; }
if(enemy.st > 0) {
toast(`${getEnemyDisplayName(enemy)} is stunned!`);
// Clear drawn sigils even when stunned - they don't persist
enemy.s = enemy.s.filter(s => s.perm);
return;
}
if(enemy.alphaActed) {
toast(`${getEnemyDisplayName(enemy)} used Alpha (skipping normal turn)`);
enemy.s = enemy.s.filter(s => s.perm);
return;
}
// Filter out Attack sigil - the base attack mechanism handles it
// Attack sigil is a marker indicating the enemy attacks, not an additional action
const drawnSigils = enemy.s.filter(s => !s.perm && s.sig !== 'Alpha' && s.sig !== 'Attack');

// Filter out suicidal grapples - enemies skip grapple if recoil would kill them
// (after shields absorb), but will spend ghost charges to survive it
const safeSigils = drawnSigils.filter(sigil => {
if(sigil.sig === 'Grapple') {
const target = S.heroes[enemy.li];
if(target && target.h > 0) {
const recoilDamage = target.p;
const shieldAbsorb = Math.min(enemy.sh || 0, recoilDamage);
const hpDamage = recoilDamage - shieldAbsorb;
// Ghost charges let the enemy survive - they'll spend one on the recoil hit
if(enemy.g > 0) {
// Allow grapple - ghost charge will absorb lethal hit via applyDamageToTarget
} else if(enemy.h <= hpDamage) {
// Would die from recoil with no ghost charges - sigil falls off
return false;
}
}
}
return true;
});
// Execute drawn sigils first (so Grapple stuns before attack)
safeSigils.forEach(sigil => executeEnemySigil(enemy, sigil));
// Check if enemy died from Grapple recoil before executing base attack
if(enemy.h <= 0 && (!enemy.g || enemy.g === 0)) return;
// Then execute base attack
executeEnemyBaseAttack(enemy);
enemy.s = enemy.s.filter(s => s.perm);
render();
}

function getEnemyExpandLevel(enemy) {
const expandSigil = enemy.s.find(s => s.sig === 'Expand');
return expandSigil ? expandSigil.level : 0;
}

function selectEnemyTargets(enemy, count) {
// Priority:
// 1. Hero directly across (lane index)
// 2. That hero's recruited ally (if present)
// 3. Heroes nearest to that first hero
// 4. Any remaining heroes
// 5. Nearest hero's recruited ally
// 6. Any remaining allies

let targets = [];
const added = new Set();

// 1. Primary target: Hero in enemy's lane
const primaryHero = S.heroes[enemy.li];
if(primaryHero && primaryHero.h > 0) {
targets.push(primaryHero);
added.add(primaryHero.id);
}
if(targets.length >= count) return targets;

// 2. That hero's recruited ally (if present) - use recruitedBy to match the hero in this lane
if(S.recruits && S.recruits.length > 0) {
const primaryRecruit = S.recruits.find(r => r.recruitedBy === enemy.li && r.h > 0);
if(primaryRecruit) {
targets.push(primaryRecruit);
added.add(primaryRecruit.id);
}
}
if(targets.length >= count) return targets;

// 3-4. Expand to nearby heroes by distance from primary lane
const aliveHeroes = S.heroes.filter(h => h.h > 0 && !added.has(h.id));
// Sort by distance from enemy lane
aliveHeroes.sort((a, b) => {
const aIdx = S.heroes.indexOf(a);
const bIdx = S.heroes.indexOf(b);
return Math.abs(aIdx - enemy.li) - Math.abs(bIdx - enemy.li);
});

for(const hero of aliveHeroes) {
if(targets.length >= count) break;
targets.push(hero);
added.add(hero.id);
}
if(targets.length >= count) return targets;

// 5-6. Recruited allies of nearby heroes, then any remaining
if(S.recruits && S.recruits.length > 0) {
const aliveRecruits = S.recruits.filter(r => r.h > 0 && !added.has(r.id));
// Sort by proximity to enemy's lane (using recruitedBy for correct hero association)
aliveRecruits.sort((a, b) => Math.abs(a.recruitedBy - enemy.li) - Math.abs(b.recruitedBy - enemy.li));

for(const recruit of aliveRecruits) {
if(targets.length >= count) break;
targets.push(recruit);
added.add(recruit.id);
}
}

return targets;
}

function executeEnemyBaseAttack(enemy) {
const expandLevel = getEnemyExpandLevel(enemy);
const targetCount = 1 + expandLevel;
// Check for Attack sigil level (permanent or drawn) to determine attack count
const attackSigil = enemy.s.find(s => s.sig === 'Attack');
const attackLevel = attackSigil ? attackSigil.level : 1;
for(let i = 0; i < attackLevel; i++) {
executeEnemyAttackOnHeroes(enemy, targetCount, attackLevel > 1 ? `Attack ${i+1}/${attackLevel}` : 'Attack');
}
}

function executeEnemySigil(enemy, sigil) {
const {sig, level} = sigil;
if(sig === 'Attack') {
const expandLevel = getEnemyExpandLevel(enemy);
const targetCount = 1 + expandLevel;

for(let i = 0; i < level; i++) {
executeEnemyAttackOnHeroes(enemy, targetCount, `Attack ${i+1}/${level}`);
}
} else if(sig === 'Shield') {
const shieldAmt = 2 * enemy.p * level;
enemy.sh = (enemy.sh || 0) + shieldAmt;
if(enemy.sh > enemy.m) enemy.sh = enemy.m;
toast(`${getEnemyDisplayName(enemy)} gained ${shieldAmt} shield!`);
} else if(sig === 'Heal') {
const healAmt = 2 * enemy.p * level;
// Include self as heal candidate - heal the most injured ally or self
const allies = S.enemies.filter(e => e.h > 0 && e.h < e.m);
if(allies.length > 0) {
allies.sort((a,b) => a.h - b.h);
const healTarget = allies[0];
healTarget.h += healAmt;
if(healTarget.h > healTarget.m) healTarget.h = healTarget.m;
toast(`${getEnemyDisplayName(enemy)} healed ${getEnemyDisplayName(healTarget)} for ${healAmt}!`);
}
} else if(sig === 'Grapple') {
const target = S.heroes[enemy.li];
if(target && (target.h > 0 || target.ls)) {
const dmgToEnemy = target.p;
// Use applyDamageToTarget so enemy shield/ghost are respected
applyDamageToTarget(enemy, dmgToEnemy, {isHero: false, skipRewards: true, silent: true});
toast(`${getEnemyDisplayName(enemy)} grappled ${target.n}!`);
if(enemy.h <= 0 && enemy.g === 0) {
toast(`${getEnemyDisplayName(enemy)} defeated by grapple recoil!`);
S.enemies = S.enemies.filter(e => e.id !== enemy.id);
} else {
// Use Math.max to avoid overwriting a higher existing stun value
target.st = Math.max(target.st, level);
SoundFX.play('stun');
toast(`${target.n} stunned for ${level} turns!`);
}
}
} else if(sig === 'Ghost') {
enemy.g = (enemy.g || 0) + level;
if(enemy.g > 9) enemy.g = 9;
toast(`${getEnemyDisplayName(enemy)} gained ${level} Ghost charge!`);
} else if(sig === 'Expand') {
toast(`${getEnemyDisplayName(enemy)} used Expand (affects their attacks)`);
} else if(sig === 'Asterisk') {
// Asterisk for enemies: Multiply attacks by (level + 1)
const expandLevel = getEnemyExpandLevel(enemy);
const targetCount = 1 + expandLevel;
const multiplier = level + 1;
toast(`${getEnemyDisplayName(enemy)} used Asterisk: ×${multiplier} attacks!`);
for(let i = 0; i < multiplier; i++) {
executeEnemyAttackOnHeroes(enemy, targetCount, `Asterisk Attack ${i+1}/${multiplier}`);
}
}
}

function dealDamageToHero(hero, dmg, source) {
triggerHitAnimation(hero.id);
const hpBefore = hero.h;
const damage = applyDamageToTarget(hero, dmg, {isHero: true});
const hpAfter = hero.h;
// Show pained reaction when hero takes damage (flash briefly, permanent if last stand)
if(damage.hpLost > 0 || damage.shieldLost > 0) {
setHeroReaction(hero.id, 'pained', hero.ls ? 0 : 600);
}
// Build detailed damage message with HP change
let msg = `${source} hit ${hero.n} (❤${hpBefore}→❤${hpAfter}):`;
if(damage.shieldLost > 0 && damage.hpLost > 0) {
msg += ` -${damage.shieldLost}🛡️ -${damage.hpLost}❤️`;
} else if(damage.shieldLost > 0) {
msg += ` -${damage.shieldLost}🛡️`;
} else if(damage.hpLost > 0) {
msg += ` -${damage.hpLost}❤️`;
}
toast(msg);
}

function endEnemyTurn() {
// Decrement hero stun at end of enemy turn (heroes skip player turn, then decrement)
S.heroes.forEach(h => {
if(h.st > 0) {
h.st--;
if(h.st === 0) toast(`${h.n} is no longer stunned!`);
}
});
// Decrement enemy stun at end of enemy turn (enemies skip their turn, then decrement)
S.enemies.forEach(e => {
if(e.st > 0) {
e.st--;
if(e.st === 0) toast(`${getEnemyDisplayName(e)} is no longer stunned!`);
}
});
// Decrement recruit stun at end of enemy turn (recruits act during enemy turn)
if(S.recruits) {
S.recruits.forEach(r => {
if(r.st > 0) {
r.st--;
if(r.st === 0) toast(`${r.n} (Recruit) is no longer stunned!`);
}
});
}
if(checkCombatEnd()) return;
S.round++;

// Enemies draw sigils at start of player turn (so player can strategize)
S.enemies.forEach(e => {
// RIBBLETON TUTORIAL: Enemies don't gain sigils (except Goblin on Round 3)
const isTutorial = tutorialState && S.floor === 0;
const isGoblinRound3 = isTutorial && e.n === 'Goblin' && S.round === 3;

// CAVE TROLL RAGE: Rolling Attack L1→L2→L3→L1 pattern (every turn)
if(e.rage && !isTutorial) {
const oldIndex = e.rageIndex;
e.rageIndex = (e.rageIndex + 1) % e.ragePattern.length;
const isReset = oldIndex === e.ragePattern.length - 1; // Was at L3, now at L1

// Update Attack level to match current rage index
const attackSigil = e.s.find(sig => sig.sig === 'Attack');
if(attackSigil) {
attackSigil.level = e.ragePattern[e.rageIndex];
}

// Draw additional sigil every turn EXCEPT on reset turns
if(!isReset) {
drawEnemySigil(e);
}
render();
}
// ORC ALTERNATING: Toggle between Attack L2 and random pool sigil
else if(e.alternating && e.turnsSinceGain >= e.gainRate && (!isTutorial || isGoblinRound3)) {
e.turnsSinceGain = 0;
e.altState = !e.altState; // Toggle
// Clear non-permanent sigils and set the new one
e.s = e.s.filter(sig => sig.perm);
if(e.altState) {
e.s.push({sig: e.altSigil.s, level: e.altSigil.l, perm: false});
} else {
drawEnemySigil(e);
}
render();
}
// Normal sigil drawing for other enemies
else if(e.turnsSinceGain >= e.gainRate && (!isTutorial || isGoblinRound3)) {
e.turnsSinceGain = 0;
// Draw multiple sigils per turn if specified
const draws = e.drawsPerTurn || 1;
for(let i = 0; i < draws; i++) {
drawEnemySigil(e);
}
// Immediately render to show new sigils
render();
}
});
// Process recruit sigil drawing
if(S.recruits) {
S.recruits.forEach(r => {
if(r.turnsSinceGain >= r.gainRate) {
r.turnsSinceGain = 0;
const draws = r.drawsPerTurn || 1;
for(let i = 0; i < draws; i++) {
drawEnemySigil(r);
}
// Immediately render to show new sigils
render();
}
});
}

// RIBBLETON TUTORIAL: Handle round transitions using TutorialManager
if(tutorialState && S.floor === 0) {
tutorialState.round = S.round;
TutorialManager.onRoundStart(S.round);
// If onRoundStart handled the transition (showed a popup), return early
if(S.turn === 'player') {
return;
}
}

S.turn = 'player';
S.activeIdx = -1;
S.acted = [];
S.locked = false;
S.enemyTurnCurrent = 0; // Clear enemy turn progress tracking
S.enemyTurnTotal = 0;
upd();

// Show round + turn banner
const aliveHeroes = S.heroes.filter(h => h.h > 0 || h.ls);
if(aliveHeroes.length > 0) {
showTurnBanner('player-turn', `Round ${S.round} — Your Turn`);
}

// Auto-skip stunned heroes
S.heroes.forEach((h, idx) => {
if(h.st > 0 && !S.acted.includes(idx)) {
S.acted.push(idx);
toast(`${h.n} is stunned and skips their turn!`);
}
});

// Autosave at start of each new round (after enemy turn completes)
autosave();

checkTurnEnd();
render();
}

/**
 * Checks for combat victory or defeat conditions.
 *
 * Victory Conditions:
 * - All enemies defeated (S.enemies.length === 0)
 * - Tutorial Floor 0: Special handling with no rewards
 * - Normal combat: Awards XP with Star bonus multipliers
 *
 * Defeat Conditions:
 * - All heroes in Last Stand mode (allDead check)
 * - Clears temporary XP upgrades immediately for clean Death screen
 *
 * @returns {boolean} - True if combat ended (victory or defeat), false if ongoing
 */
function checkCombatEnd() {
// Guard against multiple simultaneous calls (race condition from async death handling)
if(S.combatEnding) return false;

// Clean up any lingering tooltips when combat ends
if(typeof hideTooltip === 'function') hideTooltip();
if(S.enemies.length === 0) {
S.combatEnding = true; // Prevent duplicate victory handling
S.inCombat = false; // Combat ended - disable autosave
// Tutorial Floor 0: Special ending (no XP/Gold rewards)
if(S.floor === 0) {
S.combatXP = 0;
S.combatGold = 0;
setTimeout(() => {
toast('Victory!', 2400, 'success');
if(tutorialState && tutorialState.phase === 1) {
// Phase 1 complete: Transition to Phase 2
setTimeout(finishTaposBirthdayPhase, T(ANIMATION_TIMINGS.VICTORY_DELAY));
} else {
// Phase 2 complete: Show handoff popup, then finish tutorial
setTimeout(() => {
showTutorialPop('ribbleton_handoff', "Hover / long-press any sigil to see what it does, and check out the FAQ and Sigilarium for tips. You're on your own after this - don't croak... Heh", () => {
finishRibbletonTutorial();
});
}, T(ANIMATION_TIMINGS.VICTORY_DELAY));
}
}, 500);
return true;
}

// Normal combat victory
// JUICE: Victory celebration!
spawnConfetti(60);
if(typeof ProceduralMusic !== 'undefined') ProceduralMusic.playVictory(); // Victory fanfare!
SoundFX.play('victoryFanfare'); // Triumphant ascending fanfare!
setTimeout(() => SoundFX.play('ribbit'), 300); // Celebratory frog croak after fanfare
// Show happy reactions on all surviving heroes for 3 seconds
S.heroes.forEach(h => {
if(h.h > 0 && !h.ls) setHeroReaction(h.id, 'happy', 3000);
});

setTimeout(() => {
const combatXP = S.combatXP || 0;
let starBonus = 0;
S.heroes.forEach(h => {
const starLevel = getLevel('Star', S.heroes.indexOf(h));
starBonus += starLevel * 0.5;
});
const bonusXP = Math.floor(combatXP * (1 + starBonus));
S.xp += bonusXP;
S.combatXP = 0; // Reset combat XP
// Recruits persist until killed - don't clear here
if(starBonus > 0) toast(`Star Bonus! ${combatXP} × ${(1 + starBonus).toFixed(1)} = ${bonusXP} XP`, 3000, 'success');
// JUICE: Counter pop for XP gain
animateCounterPop('xp');
upd();
toast('Victory!', 2400, 'success');
// Reset the level up warning flag for this new level up session
S.levelUpWarningShown = false;
setTimeout(levelUp, T(ANIMATION_TIMINGS.VICTORY_DELAY));
}, 500);
return true;
}
const allDead = S.heroes.every(h => h.ls);
if(allDead) {
S.combatEnding = true; // Prevent duplicate defeat handling
S.inCombat = false; // Combat ended - disable autosave
// Clear temporary XP upgrades immediately so Death screen shows clean permanent levels
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// CRITICAL: Clear run save immediately to prevent loading into invalid state
// This ensures player can't reload into a battle where all heroes are in Last Stand
if(S.currentSlot != null) {
localStorage.removeItem(`froggle8_slot${S.currentSlot}`);
}
localStorage.removeItem('froggle8'); // Also clear old format for backwards compatibility
// Record to The Pond - determine what killed the heroes
const killedBy = S.enemies.length > 0 ? S.enemies[0].n : 'Unknown';
recordPondHistory('defeat', killedBy);
// JUICE: Defeat sound and music
if(typeof ProceduralMusic !== 'undefined') ProceduralMusic.playDefeat();
SoundFX.play('death');
setTimeout(() => {
toast('Defeated!', 2400, 'critical');
setTimeout(() => transitionScreen(showDeathScreen), T(ANIMATION_TIMINGS.DEFEAT_DELAY));
}, ANIMATION_TIMINGS.ACTION_COMPLETE);
return true;
}
return false;
}

/**
 * Smoothly transitions between major game screens with fade effect.
 *
 * Animation Flow:
 * 1. Fade out current screen (200ms)
 * 2. Execute callback to update content
 * 3. Fade in new screen (200ms)
 *
 * Total transition time: 400ms
 *
 * Used for: error→title, tutorial skip→title, defeat→death, etc.
 *
 * @param {Function} callback - Function to call during fade (updates screen content)
 */
function transitionScreen(callback) {
// Clean up tooltips and stale modals before screen transition
if(typeof hideTooltip === 'function') hideTooltip();
// Remove any body-appended modals that might linger across transitions
document.querySelectorAll('.steam-deck-help-overlay, .steam-deck-help-modal').forEach(el => el.remove());
const v = document.getElementById('gameView');
v.classList.add('fade-out');
setTimeout(() => {
v.classList.remove('fade-out');
callback();
v.classList.add('fade-in');
setTimeout(() => v.classList.remove('fade-in'), ANIMATION_TIMINGS.FADE_TRANSITION);
}, ANIMATION_TIMINGS.FADE_TRANSITION);
}

function render() {
// Save controller focus state before DOM update
if (typeof GamepadController !== 'undefined' && GamepadController.active) {
GamepadController.saveFocusState();
}

const v = document.getElementById('gameView');
// Combat screens are scrollable (no-scroll is for narrative/cutscene screens)
v.classList.remove('no-scroll');
// Toggle FU mode class for compact 3-hero layout and sinister background
v.classList.toggle('fu-mode', S.gameMode === 'fu');
document.body.classList.toggle('fu-mode', S.gameMode === 'fu');
// Special state: Encampment enemy selection
if(S.selectingEncampmentTargets) {
v.innerHTML = renderEncampmentSelection();
// Restore controller focus after DOM update
if (typeof GamepadController !== 'undefined' && GamepadController.active) {
GamepadController.restoreFocusState();
}
return;
}

// RIBBLETON TUTORIAL: Show targeting prompts
if(tutorialState && S.floor === 0 && S.pending) {
// Auto-advance stage when Attack is pending (targeting info now in earlier popup)
if(tutorialState.stage === 'warrior_attack' && S.pending === 'Attack' && S.targets.length === 0) {
tutorialState.stage = 'targeting_wolf';
}
// PROMPT 4: Heal + Expand (BATCHED)
else if(tutorialState.stage === 'healer_heal' && S.pending === 'Heal' && S.currentInstanceTargets.length === 0 && S.targets.length === 0) {
tutorialState.stage = 'expand_targets';
showTutorialPop('ribbleton_expand', "Remember how Healer was able to target 2 earlier? She can do that with her Heal, too! Try it out!", () => {
render();
});
return;
}
}

let html = renderCombatStatusHeader();
// New layout: Each hero and their enemies in a horizontal lane
const enemyLanes = {};
S.enemies.forEach(e => { if(!enemyLanes[e.li]) enemyLanes[e.li] = []; enemyLanes[e.li].push(e); });

S.heroes.forEach((h,i) => {
// Add class for crowded lanes (many enemies)
const laneEnemyCount = (enemyLanes[i] || []).length;
const crowdedClass = laneEnemyCount >= 5 ? 'crowded-5' : laneEnemyCount >= 3 ? 'crowded-3' : '';
html += `<div class="combat-lane ${crowdedClass}" role="region" aria-label="Lane ${i+1}: ${h.n}">`;
html += '<div class="lane-content" style="display:flex;gap:0.75rem;justify-content:flex-start;align-items:stretch">';

// Hero section (right side of their zone, 38% width) - row-reverse so recruits (rendered after) appear to the LEFT of hero
html += '<div style="flex:0 0 38%;display:flex;flex-direction:row-reverse;gap:0.3rem;align-items:flex-start;justify-content:flex-start">';

// LAST STAND: Flipped card visual (similar to dying Flydra)
if(h.ls) {
// Last Stand heroes can only be targeted by Heal (not Shield or Alpha)
const isTargetable = S.pending === 'Heal';
const hasActed = S.acted.includes(i);
const isActive = S.activeIdx === i;
let lsClasses = 'card hero last-stand-flipped';
if(S.chosenHeroIdx === i) lsClasses += ' chosen-one';
if(isActive) lsClasses += ' active';
if(isTargetable) lsClasses += ' targetable';
if(hasActed) lsClasses += ' acted';
const isTargeted = S.targets.includes(h.id);
if(isTargeted) lsClasses += ' targeted';
let onclick = '';
if(isTargetable) onclick = `onclick="tgtHero('${h.id}')"`;
else if(!hasActed && h.st === 0 && !S.pending) onclick = `onclick="selectHero(${i})"`;
const heroImage = getHeroImage(h);
html += `<div id="${h.id}" class="${lsClasses}" aria-label="${h.n} - Last Stand turn ${h.lst+1}${h.sh > 0 ? ', '+h.sh+' shield' : ''}${h.g > 0 ? ', '+h.g+' ghost charges' : ''}" style="background:linear-gradient(135deg,#450a0a,#7f1d1d);border:3px solid #dc2626" ${onclick}>`;
html += `<div style="text-align:center;font-size:0.7rem;font-weight:bold;color:#fca5a5;margin-bottom:0.25rem;animation:pulse-text 1s infinite">⚠️ LAST STAND ⚠️</div>`;
html += `<div style="text-align:center;font-size:0.8rem;font-weight:bold;color:#f1f5f9;margin-bottom:0.25rem">${h.n}</div>`;
if(heroImage) html += `<div style="text-align:center"><img src="${heroImage}" alt="${h.n}" style="width:48px;height:48px;border-radius:4px;object-fit:contain;background:#d4c4a8;filter:sepia(30%) brightness(0.8);border:2px solid #dc2626"></div>`;
html += `<div style="text-align:center;font-size:1.5rem;margin:0.3rem 0">💀</div>`;
html += `<div style="text-align:center;font-size:0.75rem;color:#fca5a5;line-height:1.3;padding:0.25rem">`;
html += `<div style="font-weight:bold;color:#fbbf24">Turn ${h.lst + 1}</div>`;
html += `<div style="font-size:0.65rem;opacity:0.8;margin-top:0.2rem">Heal to revive</div>`;
html += `</div>`;
// Render clickable D20 sigil for Last Stand hero
const d20Level = getLevel('D20', i);
const d20Cl = d20Level===0?'l0':d20Level===1?'l1':d20Level===2?'l2':d20Level===3?'l3':d20Level===4?'l4':'l5';
const canUseD20 = !hasActed && h.st === 0 && !S.pending;
const isD20Active = ((S.pending === 'D20' || S.pending === 'D20_TARGET') && S.activeIdx === i) || (S.pending === 'D20_TARGET' && S.d20HeroIdx === i);
html += `<div class="sigil-row" style="justify-content:center;margin:0.3rem 0">`;
html += `<span class="sigil ${d20Cl} ${isD20Active?'active-action':''} ${canUseD20?'clickable':''}" ${canUseD20?`onclick="act('D20', ${i})"`:''}
style="font-size:1.5rem" onmouseenter="showTooltip('D20', this, ${d20Level})" onmouseleave="hideTooltip()"
ontouchstart="tooltipTimeout = setTimeout(() => showTooltip('D20', this, ${d20Level}), ANIMATION_TIMINGS.TOOLTIP_DELAY)" ontouchend="hideTooltip()">${sigilIconOnly('D20', d20Level)}</span>`;
html += `</div>`;
// Shield bar (if shielded) in Last Stand
if(h.sh > 0) {
const shieldPct = Math.min(100, (h.sh / h.m) * 100);
const fullShield = h.sh >= h.m;
html += `<div class="shield-bar-container" style="margin-top:4px"><div class="shield-bar${fullShield?' full':''}" style="width:${shieldPct}%"></div></div>`;
html += `<div style="text-align:center;font-size:0.65rem;color:#60a5fa;margin-top:1px">${h.sh}🛡</div>`;
}
// Show ghost/acted if any
const lsExtra = [];
if(h.g > 0) lsExtra.push(`${h.g}${sigilIconOnly('Ghost')}`);
if(hasActed) lsExtra.push('✓');
if(lsExtra.length > 0) html += `<div style="text-align:center;font-size:0.7rem;color:#f1f5f9">${lsExtra.join(' ')}</div>`;
html += `</div>`;
} else {
// Normal hero card
const hp = `${h.h}/${h.m}❤`;
const isActive = S.activeIdx === i;
const isTargetable = S.pending && needsHeroTarget(S.pending);
const hasActed = S.acted.includes(i);
const isStunned = h.st > 0;
let cardClasses = 'card hero';
if(S.chosenHeroIdx === i) cardClasses += ' chosen-one';
if(isActive) cardClasses += ' active';
if(isTargetable) cardClasses += ' targetable';
if(hasActed) cardClasses += ' acted';
if(isStunned) cardClasses += ' stunned';
if(h.sh > 0) cardClasses += ' has-shield';
const isTargeted = S.targets.includes(h.id);
if(isTargeted) cardClasses += ' targeted';
const extra = [];
if(h.g > 0) extra.push(`${h.g}${sigilIconOnly('Ghost')}`);
if(h.st > 0) extra.push(`💥${h.st}T`);
// Show alpha-granted bonus turns remaining for this hero
if(S.alphaGrantedActions && S.alphaGrantedActions.length > 0) {
const alphaRemaining = S.alphaGrantedActions.slice(S.alphaCurrentAction || 0).filter(idx => idx === i).length;
if(alphaRemaining > 0) extra.push(`⚡${alphaRemaining}`);
}
if(hasActed) extra.push('✓');
let onclick = '';
if(isTargetable) onclick = `onclick="tgtHero('${h.id}')"`;
else if(!hasActed && h.st === 0 && !S.pending) onclick = `onclick="selectHero(${i})"`;
const heroImage = getHeroImage(h);
const heroAriaLabel = `${h.n} - ${h.h}/${h.m} HP, ${h.p} Power${h.sh > 0 ? ', '+h.sh+' shield' : ''}${h.g > 0 ? ', '+h.g+' ghost' : ''}${isStunned ? ', stunned '+h.st+' turns' : ''}${hasActed ? ', done' : ''}`;
html += `<div id="${h.id}" class="${cardClasses}" aria-label="${heroAriaLabel}" ${onclick}>`;
// Status banner for stunned/acted heroes
if(isStunned && !isTargetable) {
html += `<div style="text-align:center;font-size:0.65rem;font-weight:bold;color:#fff;background:#ef4444;padding:2px 6px;border-radius:4px;margin-bottom:4px">STUNNED ${h.st}T</div>`;
} else if(hasActed && !isTargetable) {
html += `<div style="text-align:center;font-size:0.65rem;font-weight:bold;color:#fff;background:#6b7280;padding:2px 6px;border-radius:4px;margin-bottom:4px">DONE</div>`;
}
// Name at top
html += `<div style="text-align:center;font-size:0.75rem;font-weight:bold;margin-bottom:0.25rem;opacity:0.8">${h.n}</div>`;
// POW - portrait - HP (horizontal)
html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;gap:0.25rem">`;
html += `<div style="font-size:1.3rem;font-weight:bold;min-width:35px;text-align:center">${h.p}💥</div>`;
if(heroImage) html += `<img src="${heroImage}" alt="${h.n}" style="width:48px;height:48px;border-radius:4px;object-fit:contain;background:#d4c4a8">`;
html += `<div style="min-width:50px;text-align:center"><div style="font-size:0.85rem">${h.h}/${h.m}</div><div style="font-size:0.9rem">❤</div></div>`;
html += `</div>`;
// HP bar - visual health indicator
const hpPct = Math.min(100, (h.h / h.m) * 100);
const hpClass = hpPct > 50 ? 'hp-high' : hpPct > 25 ? 'hp-mid' : 'hp-low';
html += `<div class="hp-bar-container"><div class="hp-bar ${hpClass}" style="width:${hpPct}%"></div></div>`;
// Shield bar (if shielded) - placed below HP, above sigils
if(h.sh > 0) {
const shieldPct = Math.min(100, (h.sh / h.m) * 100);
const fullShield = h.sh >= h.m;
html += `<div class="shield-bar-container"><div class="shield-bar${fullShield?' full':''}" style="width:${shieldPct}%"></div></div>`;
html += `<div style="text-align:center;font-size:0.65rem;color:#60a5fa;margin-top:1px">${h.sh}🛡</div>`;
}
// Extra info (ghost, stun, alpha, acted)
if(extra.length>0) html += `<div style="text-align:center;font-size:0.7rem;margin-bottom:0.25rem">${extra.join(' ')}</div>`;
html += '<div class="sigil-divider"></div>';
// Sigils with proper 2-row formation
const activeSigils = sortSigils([...h.s, ...(h.ts || [])]);
const sigilCount = activeSigils.length;

// Calculate row distribution for 2-row max
let row1Count, row2Count;
if (sigilCount <= 3) {
row1Count = sigilCount;
row2Count = 0;
} else if (sigilCount === 4) {
row1Count = 2;
row2Count = 2;
} else {
row1Count = Math.ceil(sigilCount / 2);
row2Count = sigilCount - row1Count;
}

const row1Sigils = activeSigils.slice(0, row1Count);
const row2Sigils = activeSigils.slice(row1Count);
const needsCompact = sigilCount >= 7;
const rowClass = needsCompact ? 'sigil-row compact' : 'sigil-row';

const renderCombatSigil = (s) => {
const lvl = getLevel(s, i);
// Calculate visual level for roll-down effect
let visualLvl = lvl;
let isInEffect = false;

// Check if this hero is the active one with a pending action
const isActiveHero = S.activeIdx === i || (S.pending === 'D20_TARGET' && S.d20HeroIdx === i);
const pendingAction = S.pending;
const hasActiveAction = isActiveHero && pendingAction;

// === ACTIVE SIGILS ===

// Attack/Shield/Heal (multi-instance): Roll down based on instances used within current repeat cycle
if(S.activeIdx === i && S.pending === s && isMultiInstance(s) && S.totalInstances) {
const baseLevel = lvl; // Level of the action (e.g., Attack L3 = 3)
const totalRepeats = S.totalInstances / baseLevel; // How many repeat cycles (from Asterisk)
const usedInstances = S.totalInstances - S.instancesRemaining;
// Calculate position within current repeat cycle
const instancesInCurrentCycle = usedInstances % baseLevel;
visualLvl = Math.max(0, baseLevel - instancesInCurrentCycle);
isInEffect = true;
}

// Grapple: Level = stun turns, doesn't roll down. Expand applies to targeting.
if(s === 'Grapple' && S.activeIdx === i && S.pending === 'Grapple') {
isInEffect = true;
// Grapple level stays constant (stun duration), no roll-down
}

// Alpha: Level = actions granted, doesn't roll down. Expand applies to targeting.
if(s === 'Alpha' && S.activeIdx === i && S.pending === 'Alpha') {
isInEffect = true;
// Alpha level stays constant, no roll-down
}

// D20: Pulse when D20 menu is active or targeting
if(s === 'D20' && isActiveHero && (pendingAction === 'D20' || pendingAction === 'D20_TARGET')) {
isInEffect = true;
// D20 level determines dice rolled, no roll-down
}

// Ghost: Instant action, no roll-down (charges granted immediately)
if(s === 'Ghost' && S.activeIdx === i && S.pending === 'Ghost') {
isInEffect = true;
}

// === PASSIVE SIGILS ===

// Expand: Roll down based on targets selected for current instance/action
// Applies to: Attack, Shield, Heal, Grapple, Alpha, D20_TARGET
if(s === 'Expand' && hasActiveAction && lvl > 0) {
const expandActions = ['Attack', 'Shield', 'Heal', 'Grapple', 'Alpha', 'D20_TARGET'];
if(expandActions.includes(pendingAction)) {
// For D20_TARGET, targets are in S.targets; for others, S.currentInstanceTargets
const currentTargets = pendingAction === 'D20_TARGET'
  ? (S.targets || []).length
  : (S.currentInstanceTargets || []).length;
// Visual = Expand level - targets already selected (shows remaining expand capacity)
visualLvl = Math.max(0, lvl - currentTargets);
isInEffect = true;
}
}

// Asterisk: Roll down based on repeats completed
// Only active during first action of combat (before h.firstActionUsed is set)
if(s === 'Asterisk' && lvl > 0) {
// Check if this is the first action and we're currently using it
const isFirstActionActive = hasActiveAction && !h.firstActionUsed;
// OR if we're mid-action and Asterisk was activated (repeats > 1)
const isMidAsteriskAction = hasActiveAction && (
  (isMultiInstance(pendingAction) && S.totalInstances > getLevel(pendingAction, i)) ||
  (pendingAction === 'D20_TARGET' && S.asteriskD20Repeats > 1) ||
  (pendingAction === 'D20' && S.asteriskD20Repeats > 1)
);

if(isFirstActionActive || isMidAsteriskAction) {
  isInEffect = true;

  if(isMultiInstance(pendingAction) && S.totalInstances) {
    // Calculate completed repeat cycles
    const baseLevel = getLevel(pendingAction, i);
    const usedInstances = S.totalInstances - S.instancesRemaining;
    const completedRepeats = Math.floor(usedInstances / baseLevel);
    visualLvl = Math.max(0, lvl - completedRepeats);
  } else if(pendingAction === 'D20' || pendingAction === 'D20_TARGET') {
    // D20 uses separate asterisk tracking
    visualLvl = Math.max(0, lvl - (S.asteriskD20Count || 0));
  }
  // For other actions (Grapple, Alpha, Ghost), all repeats execute at once
  // so visual stays at full level until action completes
}
}

// Star: XP multiplier, no roll-down needed
// (Star doesn't pulse during combat, it's always passive)

const cl = visualLvl===0?'l0':visualLvl===1?'l1':visualLvl===2?'l2':visualLvl===3?'l3':visualLvl===4?'l4':'l5';
// Allow clicking sigils if: hero hasn't acted, not stunned, and either (no pending action OR pending but no instances committed yet)
const canSwitchAction = !S.pending || (S.instancesRemaining === S.totalInstances);
const canClick = !S.acted.includes(i) && h.st === 0 && canSwitchAction && ['Attack','Shield','Grapple','Heal','Ghost','D20','Alpha'].includes(s);
const isActiveAction = (S.pending === s && S.activeIdx === i);
const isPassive = ['Expand', 'Star', 'Asterisk'].includes(s);
// Asterisk expended indicator: red X overlay when first action used
const asteriskExpended = (s === 'Asterisk' && h.firstActionUsed);
const asteriskOverlay = asteriskExpended ? '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.2rem;color:#dc2626;text-shadow:0 0 3px #000;pointer-events:none">❌</span>' : '';
const sigilStyle = asteriskExpended ? 'position:relative;opacity:0.5' : '';
return `<span class="sigil ${cl} ${isPassive?'passive':''} ${isActiveAction?'active-action':''} ${isInEffect?'in-effect':''} ${canClick?'clickable':''}" ${canClick?`onclick="act('${s}', ${i})" oncontextmenu="actAndAutoTarget('${s}', ${i}); return false;"`:''}
${sigilStyle ? `style="${sigilStyle}"` : ''}
onmouseenter="showTooltip('${s}', this, ${visualLvl})" onmouseleave="hideTooltip()"
ontouchstart="tooltipTimeout = setTimeout(() => showTooltip('${s}', this, ${visualLvl}), ANIMATION_TIMINGS.TOOLTIP_DELAY)" ontouchend="hideTooltip()">${sigilIconOnly(s, visualLvl)}${asteriskOverlay}</span>`;
};

html += `<div class="${rowClass}">`;
row1Sigils.forEach(s => html += renderCombatSigil(s));
html += '</div>';
if (row2Sigils.length > 0) {
html += `<div class="${rowClass}">`;
row2Sigils.forEach(s => html += renderCombatSigil(s));
html += '</div>';
}
html += '</div>';
} // End of else (normal hero card)

// Show recruit BEHIND (after) hero if exists
if(S.recruits) {
const heroRecruits = S.recruits.filter(r => r.recruitedBy === i);
if(heroRecruits.length > 0) {
// Sort by POW descending, then by current HP descending
heroRecruits.sort((a, b) => {
if(b.p !== a.p) return b.p - a.p;
return b.h - a.h;
});
const recruit = heroRecruits[0];
const recruitExtra = [];
if(recruit.g > 0) recruitExtra.push(`${recruit.g}${sigilIconOnly('Ghost')}`);
if(recruit.st > 0) recruitExtra.push(`💥${recruit.st}T`);
const recruitShieldClass = recruit.sh > 0 ? ' has-shield' : '';
html += `<div id="${recruit.id}" class="card hero recruit${recruitShieldClass}">`;
// Power at top
html += `<div style="text-align:center;font-size:1rem;font-weight:bold;margin-bottom:0.25rem">${recruit.p}</div>`;
// Enemy image or emoji (retain original enemy type)
const recruitEmoji = ENEMY_EMOJI[recruit.n] || '👾';
const recruitImageSrc = ENEMY_IMAGES[recruit.n];
if(recruitImageSrc) {
html += `<div style="width:50px;height:50px;margin:0 auto 0.25rem;display:flex;align-items:center;justify-content:center"><img src="${recruitImageSrc}" alt="${recruit.n}" class="enemy-art" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px"></div>`;
} else {
html += `<div style="text-align:center;font-size:1.5rem;margin-bottom:0.25rem">${recruitEmoji}</div>`;
}
// HP
html += `<div style="text-align:center;font-size:0.85rem;margin-bottom:0.25rem">${recruit.h}/${recruit.m}</div>`;
// HP bar for recruit
const rHpPct = Math.min(100, (recruit.h / recruit.m) * 100);
const rHpClass = rHpPct > 50 ? 'hp-high' : rHpPct > 25 ? 'hp-mid' : 'hp-low';
html += `<div class="hp-bar-container"><div class="hp-bar ${rHpClass}" style="width:${rHpPct}%"></div></div>`;
// Shield bar (if shielded)
if(recruit.sh > 0) {
const shieldPct = Math.min(100, (recruit.sh / recruit.m) * 100);
const fullShield = recruit.sh >= recruit.m;
html += `<div class="shield-bar-container"><div class="shield-bar${fullShield?' full':''}" style="width:${shieldPct}%"></div></div>`;
html += `<div style="text-align:center;font-size:0.65rem;color:#60a5fa;margin-top:1px">${recruit.sh}🛡</div>`;
}
// Extra info (ghost, stun)
if(recruitExtra.length>0) html += `<div style="text-align:center;font-size:0.7rem;margin-bottom:0.25rem">${recruitExtra.join(' ')}</div>`;
html += '<div class="sigil-divider"></div>';
// Sigils
const recruitTotalSigils = recruit.s.length + 1;
const compactClass = recruitTotalSigils >= 4 ? 'compact' : '';
html += `<div class="sigil-row ${compactClass}">
<span class="sigil l1">${sigilIconOnly('Attack')}</span>`;
recruit.s.forEach(sigil => {
const cl = sigil.level===0?'l0':sigil.level===1?'l1':sigil.level===2?'l2':sigil.level===3?'l3':sigil.level===4?'l4':'l5';
html += `<span class="sigil ${cl}" onmouseenter="showTooltip('${sigil.sig}', this)" onmouseleave="hideTooltip()" ontouchstart="tooltipTimeout = setTimeout(() => showTooltip('${sigil.sig}', this), ANIMATION_TIMINGS.TOOLTIP_DELAY)" ontouchend="hideTooltip()">${sigilIconOnly(sigil.sig, sigil.level)}</span>`;
});
html += '</div></div>';
}
}

html += '</div>'; // Close hero section

// Divider between heroes and enemies
html += '<div style="width:2px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,0.25) 15%,rgba(0,0,0,0.25) 85%,transparent);flex-shrink:0"></div>';

// Enemy section (right side of lane, 60% width)
html += '<div style="flex:1 1 60%;display:flex;flex-wrap:wrap;gap:0.25rem;justify-content:flex-start;align-items:flex-start;align-content:flex-start;min-height:60px">';
const laneEnemies = enemyLanes[i] || [];
if(laneEnemies.length === 0) {
html += `<div style="flex:1;text-align:center;font-size:1rem;padding:0.8rem;background:rgba(0,0,0,0.08);border:2px dashed rgba(0,0,0,0.25);border-radius:6px;color:rgba(0,0,0,0.35);font-style:italic;display:flex;align-items:center;justify-content:center">Clear</div>`;
} else {
laneEnemies.forEach(e => {
// FLYDRA: Check if this is a dying Flydra - render flipped card
if(e.isFlydra && e.flydraState === 'dying') {
html += `<div id="${e.id}" class="card enemy flydra-dying" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:3px solid #e94560;opacity:0.9">`;
html += `<div style="text-align:center;font-size:0.8rem;font-weight:bold;color:#e94560;margin-bottom:0.5rem">⚠️ ${e.n} ⚠️</div>`;
// Show greyed-out head image if available
if(e.flydraHeadImage) {
html += `<div style="text-align:center;margin:0.5rem 0"><img src="${e.flydraHeadImage}" alt="${e.n}" style="width:50px;height:50px;object-fit:contain;filter:grayscale(80%) brightness(0.5);border-radius:4px"></div>`;
} else {
html += `<div style="text-align:center;font-size:2.5rem;margin:0.5rem 0;filter:grayscale(50%)">💀</div>`;
}
html += `<div style="text-align:center;font-size:0.75rem;color:#f1f5f9;line-height:1.4;padding:0.5rem">`;
html += `<div style="font-weight:bold;color:#fbbf24;margin-bottom:0.3rem">REGENERATING...</div>`;
html += `<div>Revives at ${Math.ceil(e.m/2)} HP next turn unless ALL heads are defeated!</div>`;
html += `</div></div>`;
return;
}
const isTargetable = (S.pending && needsEnemyTarget(S.pending)) || S.pending === 'D20_TARGET';
const isAttackTargetable = S.pending === 'Attack' && isTargetable;
const selectCount = S.targets.filter(t => t === e.id).length;
let cardClasses = 'card enemy';
if(e.isFlydra) cardClasses += ' flydra';
if(isTargetable) cardClasses += ' targetable';
if(selectCount > 0) cardClasses += ' targeted';
if(e.sh > 0) cardClasses += ' has-shield';
const extra = [];
// Show ghost charges if enemy has them
if(e.g > 0) extra.push(`${e.g}${sigilIconOnly('Ghost')}`);
if(e.st > 0) extra.push(`💥${e.st}T`);
if(selectCount > 0) extra.push(`×${selectCount}`);
const enemyEmoji = ENEMY_EMOJI[e.n] || '👾';
const enemyAriaLabel = `${getEnemyDisplayName(e)} - ${e.h}/${e.m} HP, ${e.p} Power${e.sh > 0 ? ', '+e.sh+' shield' : ''}${e.g > 0 ? ', '+e.g+' ghost' : ''}${e.st > 0 ? ', stunned '+e.st+' turns' : ''}`;
html += `<div id="${e.id}" class="${cardClasses}" aria-label="${enemyAriaLabel}" ${isTargetable?`onclick="tgtEnemy('${e.id}')"`:''} >`;
// Name at top
html += `<div style="text-align:center;font-size:0.75rem;font-weight:bold;margin-bottom:0.25rem;opacity:0.8">${getEnemyDisplayName(e)}</div>`;
// POW - image/emoji - HP row (horizontal)
html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;gap:0.25rem">`;
html += `<div style="font-size:1rem;font-weight:bold;min-width:30px;text-align:center">${e.p}</div>`;
// Show enemy image: Flydra head > artwork image > emoji fallback
const enemyImageSrc = ENEMY_IMAGES[e.n];
if(e.isFlydra && e.flydraHeadImage) {
html += `<div style="width:50px;height:50px;display:flex;align-items:center;justify-content:center"><img src="${e.flydraHeadImage}" alt="${e.n}" class="flydra-head-img" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px"></div>`;
} else if(enemyImageSrc) {
html += `<div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center"><img src="${enemyImageSrc}" alt="${e.n}" class="enemy-art" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px"></div>`;
} else {
html += `<div style="font-size:2rem">${enemyEmoji}</div>`;
}
html += `<div style="min-width:65px;text-align:center"><div style="font-size:0.8rem">${e.h}/${e.m}</div><div style="font-size:0.9rem">❤</div></div>`;
html += `</div>`;
// HP bar - visual health indicator for enemies
const eHpPct = Math.min(100, (e.h / e.m) * 100);
const eHpClass = eHpPct > 50 ? 'hp-high' : eHpPct > 25 ? 'hp-mid' : 'hp-low';
html += `<div class="hp-bar-container"><div class="hp-bar ${eHpClass}" style="width:${eHpPct}%"></div></div>`;
// Shield bar (if shielded)
if(e.sh > 0) {
const shieldPct = Math.min(100, (e.sh / e.m) * 100);
const fullShield = e.sh >= e.m;
html += `<div class="shield-bar-container"><div class="shield-bar${fullShield?' full':''}" style="width:${shieldPct}%"></div></div>`;
html += `<div style="text-align:center;font-size:0.65rem;color:#60a5fa;margin-top:1px">${e.sh}🛡</div>`;
}
// Extra info (ghost, stun, target count)
if(extra.length>0) html += `<div style="text-align:center;font-size:0.7rem;margin-bottom:0.25rem">${extra.join(' ')}</div>`;
html += '<div class="sigil-divider"></div>';
// Sigils with smart wrapping
const hasAttackSigil = e.s.some(s => s.sig === 'Attack');
const totalSigils = e.s.length + (hasAttackSigil ? 0 : 1);
const compactClass = totalSigils >= 4 ? 'compact' : '';
html += `<div class="sigil-row ${compactClass}">`;
if(!hasAttackSigil) {
html += `<span class="sigil l1">${sigilIconOnly('Attack')}</span>`;
}
e.s.forEach(sigil => {
const cl = sigil.level===0?'l0':sigil.level===1?'l1':sigil.level===2?'l2':sigil.level===3?'l3':sigil.level===4?'l4':'l5';
const newClass = sigil.newlyDrawn ? ' newly-drawn' : '';
html += `<span class="sigil ${cl}${newClass}" onmouseenter="showTooltip('${sigil.sig}', this)" onmouseleave="hideTooltip()" ontouchstart="if(tooltipTimeout)clearTimeout(tooltipTimeout);tooltipTimeout=setTimeout(()=>showTooltip('${sigil.sig}',this),ANIMATION_TIMINGS.TOOLTIP_DELAY)" ontouchend="hideTooltip();if(tooltipTimeout)clearTimeout(tooltipTimeout)">${sigilIconOnly(sigil.sig, sigil.level)}</span>`;
});
html += '</div></div>';
});
}
html += '</div>'; // Close enemy section
html += '</div>'; // Close flex container
html += '</div>'; // Close combat-lane
});

// D20_TARGET: Add targeting overlay with Roll/Cancel buttons
if(S.pending === 'D20_TARGET') {
const heroIdx = S.d20HeroIdx;
const h = S.heroes[heroIdx];
const expandLevel = getLevel('Expand', heroIdx);
const maxTargets = 1 + expandLevel;
const currentTargets = S.targets ? S.targets.length : 0;
const canRoll = currentTargets >= 1;
const actionName = S.d20Action || 'D20';
const adjustedDC = S.d20DC || 10;

html += `<div style="position:fixed;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(30,30,30,0.98),rgba(30,30,30,0.9));border-top:3px solid #3b82f6;padding:1rem;z-index:1000;text-align:center">`;
html += `<div style="margin-bottom:0.5rem;color:#fff;font-weight:bold;font-size:1.1rem">${h.n}: ${actionName} (DC ${adjustedDC})</div>`;
if(expandLevel > 0) {
html += `<div style="margin-bottom:0.5rem;color:#22c55e;font-size:0.9rem">✨ Expand: Select up to ${maxTargets} targets</div>`;
}
html += `<div style="margin-bottom:0.75rem;color:#fbbf24;font-size:1rem">${currentTargets}/${maxTargets} target${currentTargets !== 1 ? 's' : ''} selected</div>`;
html += `<div style="display:flex;gap:1rem;justify-content:center">`;
html += `<button class="btn secondary" onclick="cancelAction()" style="min-width:100px">Cancel</button>`;
html += `<button class="btn ${canRoll ? 'safe' : ''}" onclick="${canRoll ? 'confirmTargets()' : ''}" style="min-width:140px;${canRoll ? '' : 'opacity:0.5;cursor:not-allowed'}">🎲 Roll D20!</button>`;
html += `</div></div>`;
}

v.innerHTML = html;

// Apply bonus turn stacks after DOM is updated
setTimeout(() => {
// Show Alpha-granted action stacks
if(S.alphaGrantedActions && S.alphaGrantedActions.length > 0) {
// Count remaining actions for each hero
const actionCounts = {};
for(let i = S.alphaCurrentAction || 0; i < S.alphaGrantedActions.length; i++) {
const heroIdx = S.alphaGrantedActions[i];
actionCounts[heroIdx] = (actionCounts[heroIdx] || 0) + 1;
}
// Apply stacks to heroes
Object.keys(actionCounts).forEach(heroIdx => {
const hero = S.heroes[heroIdx];
if(hero) {
addBonusTurnStack(hero.id, actionCounts[heroIdx]);
}
});
}

// Restore controller focus after DOM update
if (typeof GamepadController !== 'undefined' && GamepadController.active) {
GamepadController.restoreFocusState();
}
}, 0);
}

// ===== LEVEL UP =====
function levelUp() {
// JUICE: Level up sound
SoundFX.play('levelup');

// Unlock blue portal after completing Floor 19 (combat before floor 20)
if(S.floor === 19) {
S.hasReachedFloor20 = true;
savePermanent();
toast('The blue portal in Ribbleton has awakened!', 2500);
// Skip level up menu on floor 19 - no point spending XP before victory
setTimeout(() => nextFloor(), T(2000));
return;
}

const v = document.getElementById('gameView');
const nextCost = getXPCost(S.levelUpCount);
const canAfford = S.xp >= nextCost;
const spendStyle = canAfford
  ? 'background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:1.3rem;font-weight:bold;border:2px solid #fcd34d;box-shadow:0 0 15px rgba(251,191,36,0.5);text-align:center'
  : 'opacity:0.5;text-align:center';
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem">Level Up!</h2>
<p style="text-align:center;margin-bottom:0.5rem">Floor ${S.floor} Complete</p>
<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem">Current XP: ${S.xp} | Next Level: ${nextCost}XP</p>
<div class="choice" onclick="levelUpMenu()" style="${spendStyle}">Spend XP${canAfford ? ' ✨' : ''}</div>
<button class="btn secondary" onclick="viewHeroCards()">View Heroes</button>
<button class="btn safe" onclick="tryAdvanceFromLevelUp()">Next Floor</button>`;
}

// Check if player should be warned about unspent XP before advancing
function tryAdvanceFromLevelUp() {
const nextCost = getXPCost(S.levelUpCount);
const canAfford = S.xp >= nextCost;

// If player can afford an upgrade and hasn't been warned this floor, show confirmation
if (canAfford && !S.levelUpWarningShown) {
  S.levelUpWarningShown = true;
  showConfirmModal(
    `You have enough XP (${S.xp}) to spend on an upgrade (costs ${nextCost}). Continue anyway?`,
    () => nextFloor(),
    () => levelUp() // Go back to level up screen
  );
  return;
}

// Otherwise proceed normally
nextFloor();
}

// View hero cards from level up screen
function viewHeroCards() {
const v = document.getElementById('gameView');
let html = '<div style="display:flex;flex-direction:column;align-items:center;padding:1rem;gap:1rem">';
html += '<h2 style="text-align:center;margin:0">Your Heroes</h2>';
html += '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:1rem">';

S.heroes.forEach((h, idx) => {
const heroImage = getHeroImage(h);
const extra = [];
if(h.sh > 0) extra.push(`${h.sh}🛡`);
if(h.g > 0) extra.push(`${h.g}${sigilIconOnly('Ghost')}`);
if(h.st > 0) extra.push(`💥${h.st}T`);

let cardStyle = 'background:linear-gradient(135deg,#1e3a5f,#2563eb);border:3px solid #60a5fa';
if(h.ls) cardStyle = 'background:linear-gradient(135deg,#450a0a,#7f1d1d);border:3px solid #dc2626';

html += `<div class="card hero" style="${cardStyle}">`;
// Power at top
html += `<div style="text-align:center;font-size:1.4rem;font-weight:bold;margin-bottom:0.25rem">${h.p}💥</div>`;
// Hero image
if(heroImage) html += `<div style="text-align:center"><img src="${heroImage}" alt="${h.n}" style="width:56px;height:56px;border-radius:8px;object-fit:contain;background:#d4c4a8;border:2px solid #60a5fa"></div>`;
// Name
html += `<div style="text-align:center;font-weight:bold;font-size:0.9rem;margin:0.25rem 0">${h.n}</div>`;
// HP
if(h.ls) {
  html += `<div style="text-align:center;font-size:0.85rem;color:#fca5a5">Last Stand (T${h.lst+1})</div>`;
} else {
  html += `<div style="text-align:center;font-size:0.85rem">${h.h}/${h.m}❤</div>`;
}
// Extra info (shield, ghost, stun)
if(extra.length > 0) html += `<div style="text-align:center;font-size:0.75rem;margin-top:0.25rem">${extra.join(' ')}</div>`;
html += '<div class="sigil-divider"></div>';
// Sigils - combine base sigils + temp sigils
const allSigils = [...(h.s || []), ...(h.ts || [])];
const uniqueSigils = [...new Set(allSigils)];
const totalSigils = uniqueSigils.length;
const compactClass = totalSigils >= 5 ? 'compact' : '';
html += `<div class="sigil-row ${compactClass}">`;
uniqueSigils.forEach(sig => {
  const level = getLevel(sig, idx);
  const cl = level===0?'l0':level===1?'l1':level===2?'l2':level===3?'l3':level===4?'l4':'l5';
  html += `<span class="sigil ${cl}" onmouseenter="showTooltip('${sig}', this, ${level})" onmouseleave="hideTooltip()">${sigilIconOnly(sig, level)}</span>`;
});
html += '</div>';
html += '</div>';
});

html += '</div>'; // end flex container
html += '<button class="btn secondary" onclick="levelUp()" style="margin-top:1rem">Return</button>';
html += '</div>';
v.innerHTML = html;
}

function nextFloor() {
// QUEST TRACKING: Neutral encounter completed (even floors are neutrals)
if(S.floor % 2 === 0 && S.lastNeutral) {
  // Extract base neutral type from encounter name (e.g., 'shopkeeper1' -> 'shopkeeper')
  const neutralBase = S.lastNeutral.replace(/[12]$/, '');
  trackQuestProgress('neutral', neutralBase);
}
// Tapo's Chosen bonus: +1G per floor cleared
if(S.chosenHeroIdx >= 0 && S.heroes[S.chosenHeroIdx]) {
S.gold += 1;
toast(`${S.heroes[S.chosenHeroIdx].n} earned +1G (Tapo's Chosen)`, 1200);
}
// Clear any pending recruit replacement choice
S.pendingNewRecruit = null;
S.pendingOldRecruitId = null;
saveGame();
// Show header buttons tutorial after first neutral encounter (Floor 2 complete)
if(S.floor === 2 && !S.tutorialFlags.faq_intro) {
S.tutorialFlags.faq_intro = true;
showTutorialPop('faq_intro', "You're (mostly) on your own from here - good luck! Need help? Check the header buttons at the top:<br><br>🌀 <strong>Sigilarium</strong> - View all sigils and their effects<br>🪵 <strong>Log</strong> - See combat message history<br>❓ <strong>FAQ</strong> - Frequently asked questions about game mechanics<br>⚙️ <strong>Settings</strong> - Adjust game options and preferences", () => {
startFloor(S.floor + 1);
});
return;
}
startFloor(S.floor + 1);
}

function showStartingXPScreen() {
const v = document.getElementById('gameView');
const nextCost = getXPCost(S.levelUpCount);
const canAfford = S.xp >= nextCost;
const spendStyle = canAfford
  ? 'background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:1.3rem;font-weight:bold;border:2px solid #fcd34d;box-shadow:0 0 15px rgba(251,191,36,0.5);text-align:center'
  : 'opacity:0.5;text-align:center';
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem;color:#a855f7">Starting XP Bonus!</h2>
<p style="text-align:center;margin-bottom:0.5rem;font-size:1.1rem">You start this run with <strong>${S.startingXP} XP</strong> from Death Boy sacrifices!</p>
<p style="text-align:center;margin-bottom:1.5rem;font-size:0.9rem;opacity:0.8">Spend it now or bank it for later. Remaining XP: <strong>${S.xp}</strong> | Next Level Cost: <strong>${nextCost}XP</strong></p>
<div class="choice" onclick="startingXPMenu()" style="${spendStyle}">Spend XP${canAfford ? ' ✨' : ''}</div>
<button class="btn safe" onclick="startFloor(1)">Start Run (Bank XP)</button>`;
}

function startingXPMenu() {
const v = document.getElementById('gameView');
const cost = getXPCost(S.levelUpCount);
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem">Spend Starting XP</h2>
<p style="text-align:center;margin-bottom:1rem">Current: ${S.xp} XP | Cost: ${cost} XP</p>
<div class="choice" onclick="startingHeroStats()">Upgrade Hero Stats</div>
<div class="choice" onclick="showStartingSigilUpgradeMenu()">Upgrade/Add Sigil</div>
<button class="btn secondary" onclick="showStartingXPScreen()">Back</button>`;
}

function showStartingSigilUpgradeMenu() {
const v = document.getElementById('gameView');
const cost = getXPCost(S.levelUpCount);
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem">Upgrade/Add Sigil</h2>
<p style="text-align:center;margin-bottom:1rem">Current: ${S.xp} XP | Cost: ${cost} XP</p>

<div style="background:rgba(44,99,199,0.1);border:2px solid #2c63c7;border-radius:8px;padding:1rem;margin-bottom:1rem">
<h3 style="color:#2c63c7;margin:0 0 0.5rem 0;font-size:1rem">⚔️ Core Sigils</h3>
<p style="font-size:0.85rem;margin:0;line-height:1.4">Basic actions that heroes start with: Attack, Shield, Heal, D20. Every hero can learn these.</p>
</div>

<div style="background:rgba(249,115,22,0.1);border:2px solid #f97316;border-radius:8px;padding:1rem;margin-bottom:1rem">
<h3 style="color:#f97316;margin:0 0 0.5rem 0;font-size:1rem">🔥 Advanced Sigils</h3>
<p style="font-size:0.85rem;margin:0;line-height:1.4">Alternative specialist actions for your turn: Ghost, Alpha, Grapple. Heroes don't start with these, but any hero can learn them!</p>
</div>

<div style="background:rgba(147,51,234,0.1);border:2px solid #9333ea;border-radius:8px;padding:1rem;margin-bottom:1rem">
<h3 style="color:#9333ea;margin:0 0 0.5rem 0;font-size:1rem">✨ Passive Sigils</h3>
<p style="font-size:0.85rem;margin:0;line-height:1.4">Global enhancements that automatically improve all heroes: Expand, Asterisk, Star. <strong>All heroes benefit immediately from passive upgrades!</strong></p>
</div>

<div style="background:rgba(34,197,94,0.1);border:2px solid #22c55e;border-radius:8px;padding:1rem;margin-bottom:1.5rem">
<p style="font-size:0.9rem;margin:0;line-height:1.5"><strong>💡 Upgrading a sigil makes it stronger everywhere:</strong> in the Sigilarium, on every hero who has it, and for any hero who learns it later!</p>
</div>

<div class="choice" onclick="startingUpgradeSigil()">Upgrade Existing Sigil</div>
<div class="choice" onclick="startingAddSigilToHero()">Add New Sigil to Hero</div>
<button class="btn secondary" onclick="startingXPMenu()">Back</button>`;
}

function startingHeroStats() {
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Upgrade Hero Stats</h2>
<p style="text-align:center;margin-bottom:1rem">Cost: ${cost} XP</p>`;
if(S.xp < cost) {
html += `<p style="text-align:center;margin-bottom:1rem;color:#b64141">Not enough XP!</p>`;
} else {
S.heroes.forEach((h, idx) => {
html += `<div class="choice" onclick="startingUpPow(${idx})"><strong>${h.n} POW</strong> (${h.p} → ${h.p+1})</div>`;
html += `<div class="choice" onclick="startingUpHP(${idx})"><strong>${h.n} HP</strong> (${h.m} → ${h.m+5})</div>`;
});
}
html += `<button class="btn secondary" onclick="startingXPMenu()">Back</button>`;
v.innerHTML = html;
}

function startingUpPow(idx) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
S.xp -= cost;
S.levelUpCount++;
S.heroes[idx].p++;
toast(`${S.heroes[idx].n} POW +1!`);
upd();
startingXPMenu();
}

function startingUpHP(idx) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
S.xp -= cost;
S.levelUpCount++;
S.heroes[idx].m += 5;
S.heroes[idx].h += 5;
toast(`${S.heroes[idx].n} HP +5!`);
upd();
startingXPMenu();
}

function startingUpgradeSigil() {
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Upgrade Sigil</h2>
<p style="text-align:center;margin-bottom:1rem">Cost: ${cost} XP</p>`;
if(S.xp < cost) {
html += `<p style="text-align:center;margin-bottom:1rem;color:#b64141">Not enough XP!</p>`;
} else {
const coreSigils = ['Attack', 'Shield', 'Heal', 'D20'];
const advancedSigils = ['Ghost', 'Alpha', 'Grapple'];
const passiveSigils = ['Expand', 'Asterisk', 'Star'];
const allSigils = [...coreSigils, ...advancedSigils, ...passiveSigils];

const available = allSigils.filter(s => {
const totalLevel = (S.sig[s] || 0) + (S.tempSigUpgrades[s] || 0);
return totalLevel < 4;
});

if(available.length === 0) {
html += `<p style="text-align:center;margin-bottom:1rem">All sigils maxed!</p>`;
} else {
const actives = [...coreSigils, ...advancedSigils];

const renderSigilChoices = (sigils, categoryName, categoryColor) => {
const availableInCategory = sigils.filter(s => available.includes(s));
if(availableInCategory.length === 0) return '';
let categoryHtml = `<h3 style="color:${categoryColor};margin:1rem 0 0.5rem 0;font-size:1rem">${categoryName}</h3>`;
availableInCategory.forEach(sig => {
const level = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const isActive = actives.includes(sig);
const displayLevel = (isActive && level === 0) ? 1 : level;
const nextDisplayLevel = displayLevel + 1;
const anyHeroHasSigil = S.heroes.some(hero => hero.s.includes(sig) || (hero.ts && hero.ts.includes(sig)));
const newSigilNote = !anyHeroHasSigil ? `<br><span style="color:#dc2626;font-size:0.85rem">*No hero has this yet!</span>` : '';
categoryHtml += `<div class="choice" onclick="startingUpSigil('${sig}')"><strong>${sigilIconWithTooltip(sig, nextDisplayLevel)} L${displayLevel} → L${nextDisplayLevel}</strong>${newSigilNote}</div>`;
});
return categoryHtml;
};

html += renderSigilChoices(coreSigils, '⚔️ Core Sigils', '#2c63c7');
html += renderSigilChoices(advancedSigils, '🔥 Advanced Sigils', '#f97316');
html += renderSigilChoices(passiveSigils, '✨ Passive Sigils', '#9333ea');
}
}
html += `<button class="btn secondary" onclick="showStartingSigilUpgradeMenu()">Back</button>`;
v.innerHTML = html;
}

function startingUpSigil(sig) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
S.xp -= cost;
S.levelUpCount++;
S.tempSigUpgrades[sig] = (S.tempSigUpgrades[sig] || 0) + 1;
toast(`${sig} upgraded!`);
upd();
startingUpgradeSigil();
}

function startingAddSigilToHero() {
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Add Sigil to Hero</h2>
<p style="text-align:center;margin-bottom:1rem">Cost: ${cost} XP</p>`;
if(S.xp < cost) {
html += `<p style="text-align:center;margin-bottom:1rem;color:#b64141">Not enough XP!</p>`;
} else {
html += `<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem">Choose a hero:</p><div style="max-width:400px;margin:0 auto">`;
S.heroes.forEach((h, idx) => {
const sigilInfo = `<br><span style="font-size:0.75rem;opacity:0.8">Current: ${h.s.join(', ')}</span>`;
html += renderHeroCard(h, idx, `startingSelectHeroForSigil(${idx})`, sigilInfo);
});
html += '</div>';
}
html += `<button class="btn secondary" onclick="showStartingSigilUpgradeMenu()">Back</button>`;
v.innerHTML = html;
}

function startingSelectHeroForSigil(heroIdx) {
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
const h = S.heroes[heroIdx];
const coreSigils = ['Attack', 'Shield', 'Heal', 'D20'];
const advancedSigils = ['Ghost', 'Alpha', 'Grapple'];
const passiveSigils = ['Expand', 'Asterisk', 'Star'];
const allSigils = [...coreSigils, ...advancedSigils, ...passiveSigils];
const available = allSigils.filter(sig => !h.s.includes(sig) && !(h.ts && h.ts.includes(sig)));
let html = `<h2 style="text-align:center;margin-bottom:1rem">Add Sigil to ${h.n}</h2>
<p style="text-align:center;margin-bottom:1rem">Cost: ${cost} XP</p>`;
if(available.length === 0) {
html += `<p style="text-align:center;margin-bottom:1rem">${h.n} already has all sigils!</p>`;
} else {
html += `<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem">Choose a sigil to add:</p>`;

const actives = [...coreSigils, ...advancedSigils];

const renderCategorySigils = (sigils, categoryName, categoryColor) => {
const availableInCategory = sigils.filter(s => available.includes(s));
if(availableInCategory.length === 0) return '';
let categoryHtml = `<h3 style="color:${categoryColor};margin:1rem 0 0.5rem 0;font-size:1rem">${categoryName}</h3>`;
availableInCategory.forEach(sig => {
const level = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const isActive = actives.includes(sig);
const displayLevel = (isActive && level === 0) ? 1 : level;
const levelText = (level === 0 && !isActive) ? `L${displayLevel} (Passive only)` : `L${displayLevel}`;
const anyHeroHasSigil = S.heroes.some(hero => hero.s.includes(sig) || (hero.ts && hero.ts.includes(sig)));
const newSigilNote = !anyHeroHasSigil ? `<span style="color:#dc2626;font-size:0.85rem"> *No hero has this yet!</span>` : '';
categoryHtml += `<div class="choice" onclick="startingAddSigilConfirm(${heroIdx}, '${sig}')">
<strong>${sigilIconWithTooltip(sig, displayLevel)}</strong> <span style="opacity:0.7">(${levelText})</span>${newSigilNote}
</div>`;
});
return categoryHtml;
};

html += renderCategorySigils(coreSigils, '⚔️ Core Sigils', '#2c63c7');
html += renderCategorySigils(advancedSigils, '🔥 Advanced Sigils', '#f97316');
html += renderCategorySigils(passiveSigils, '✨ Passive Sigils', '#9333ea');
}
html += `<button class="btn secondary" onclick="startingAddSigilToHero()">Back</button>`;
v.innerHTML = html;
}

function startingAddSigilConfirm(heroIdx, sig) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
S.xp -= cost;
S.levelUpCount++;
const h = S.heroes[heroIdx];
if(!h.ts) h.ts = [];
h.ts.push(sig);
toast(`${h.n} learned ${sig}!`);
upd();
startingAddSigilToHero();
}

function levelUpMenu() {
// First-time tutorial: multi-modal popup explaining all options
if(!S.tutorialFlags.levelup_intro) {
S.tutorialFlags.levelup_intro = true;
showLevelUpIntroTutorial();
return;
}
const v = document.getElementById('gameView');
const cost = getXPCost(S.levelUpCount);
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem">Spend XP</h2>
<p style="text-align:center;margin-bottom:1rem">Current: ${S.xp} XP | Cost: ${cost} XP</p>
<div class="choice" onclick="addActiveToHero()">Add Active Sigil to Hero</div>
<div class="choice" onclick="upgradeActiveSigil()">Upgrade Active Sigil (All Heroes)</div>
<div class="choice" onclick="upgradePassiveSigil()">Add/Upgrade Passive Sigil (All Heroes)</div>
<div class="choice" onclick="heroStats()">Upgrade Hero Stats</div>
<button class="btn secondary" onclick="levelUp()">Back</button>`;
}

// Multi-modal tutorial for first-time level-up
function showLevelUpIntroTutorial() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div class="tutorial-modal-backdrop" onclick="event.stopPropagation()">
<div class="tutorial-modal" style="max-width:550px;text-align:left">
<h2 style="text-align:center;color:#22c55e;margin-bottom:1rem">Level Up!</h2>
<p style="text-align:center;margin-bottom:1.5rem;font-size:1rem">Nice! You earned enough XP for your first upgrade! Here are your options:</p>

<div style="background:rgba(59,130,246,0.1);border:2px solid #3b82f6;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem">
<h4 style="color:#3b82f6;margin:0 0 0.25rem 0;font-size:0.95rem">1. Add Active Sigil to Hero</h4>
<p style="font-size:0.85rem;margin:0;line-height:1.3">Teach a hero a NEW ability they don't have yet.<br><em>Example: Give your Tank the Grapple sigil to stun enemies!</em></p>
</div>

<div style="background:rgba(34,197,94,0.1);border:2px solid #22c55e;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem">
<h4 style="color:#22c55e;margin:0 0 0.25rem 0;font-size:0.95rem">2. Upgrade Active Sigil (All Heroes)</h4>
<p style="font-size:0.85rem;margin:0;line-height:1.3">Make an active sigil stronger for EVERYONE who has it.<br><em>Example: Attack L2 = 2 hits, Shield L2 = 4×POW shields!</em></p>
</div>

<div style="background:rgba(147,51,234,0.1);border:2px solid #9333ea;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem">
<h4 style="color:#9333ea;margin:0 0 0.25rem 0;font-size:0.95rem">3. Add/Upgrade Passive Sigil (All Heroes)</h4>
<p style="font-size:0.85rem;margin:0;line-height:1.3">Passives (Expand, Asterisk, Star) work automatically for ALL heroes!<br><em>Example: Expand +1 = all heroes can target one extra enemy/ally!</em></p>
</div>

<div style="background:rgba(249,115,22,0.1);border:2px solid #f97316;border-radius:8px;padding:0.75rem;margin-bottom:1rem">
<h4 style="color:#f97316;margin:0 0 0.25rem 0;font-size:0.95rem">4. Upgrade Hero Stats</h4>
<p style="font-size:0.85rem;margin:0;line-height:1.3">Add +1 POW or +5 HP to a hero of your choice.<br><em>Great for boosting your key damage dealer or keeping tanks alive!</em></p>
</div>

<button class="btn" onclick="showLevelUpMenuAfterTutorial()" style="width:100%;margin-top:0.5rem">Got it! Show me the options</button>
</div>
</div>`;
}

function showLevelUpMenuAfterTutorial() {
const v = document.getElementById('gameView');
const cost = getXPCost(S.levelUpCount);
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem">Spend XP</h2>
<p style="text-align:center;margin-bottom:1rem">Current: ${S.xp} XP | Cost: ${cost} XP</p>
<div class="choice" onclick="addActiveToHero()">Add Active Sigil to Hero</div>
<div class="choice" onclick="upgradeActiveSigil()">Upgrade Active Sigil (All Heroes)</div>
<div class="choice" onclick="upgradePassiveSigil()">Add/Upgrade Passive Sigil (All Heroes)</div>
<div class="choice" onclick="heroStats()">Upgrade Hero Stats</div>
<button class="btn secondary" onclick="levelUp()">Back</button>`;
}

// NEW: Add Active Sigil to Hero (only active sigils)
function addActiveToHero() {
showTutorialPop('levelup_add_active', "Teach a hero a NEW active ability! Heroes only get 1 action per turn, but more choices = more tactics. Pick a hero, then pick the sigil they'll learn!");
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Add Active Sigil to Hero</h2>
<p style="text-align:center;margin-bottom:1rem">Cost: ${cost} XP</p>`;
if(S.xp < cost) {
html += `<p style="text-align:center;margin-bottom:1rem;color:#b64141">Not enough XP!</p>`;
} else {
html += `<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem">Choose a hero to teach a new ability:</p><div style="max-width:400px;margin:0 auto">`;
S.heroes.forEach((h, idx) => {
const sigilInfo = `<br><span style="font-size:0.75rem;opacity:0.8">Current: ${h.s.join(', ')}</span>`;
html += renderHeroCard(h, idx, `selectHeroForActiveSigil(${idx})`, sigilInfo);
});
html += '</div>';
}
html += `<button class="btn secondary" onclick="levelUpMenu()">Back</button>`;
v.innerHTML = html;
}

function selectHeroForActiveSigil(heroIdx) {
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
const h = S.heroes[heroIdx];
const activeSigils = ['Attack', 'Shield', 'Heal', 'D20', 'Ghost', 'Alpha', 'Grapple'];
const available = activeSigils.filter(sig => !h.s.includes(sig) && !(h.ts && h.ts.includes(sig)));
let html = `<h2 style="text-align:center;margin-bottom:1rem">Add Active Sigil to ${h.n}</h2>
<p style="text-align:center;margin-bottom:1rem">Cost: ${cost} XP</p>`;
if(available.length === 0) {
html += `<p style="text-align:center;margin-bottom:1rem">${h.n} already has all active sigils!</p>`;
} else {
html += `<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem">Choose an active sigil to learn:</p>`;
const coreSigils = ['Attack', 'Shield', 'Heal', 'D20'];
const advancedSigils = ['Ghost', 'Alpha', 'Grapple'];

const renderActiveSigils = (sigils, categoryName, categoryColor) => {
const availableInCategory = sigils.filter(s => available.includes(s));
if(availableInCategory.length === 0) return '';
let categoryHtml = `<h3 style="color:${categoryColor};margin:1rem 0 0.5rem 0;font-size:1rem">${categoryName}</h3>`;
availableInCategory.forEach(sig => {
const level = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const displayLevel = level + 1;  // Internal 0 = display L1, etc.
categoryHtml += `<div class="choice" onclick="confirmAddActiveSigil(${heroIdx}, '${sig}')">
<strong>${sigilIconWithTooltip(sig, displayLevel)}</strong> <span style="opacity:0.7">(L${displayLevel})</span>
</div>`;
});
return categoryHtml;
};

html += renderActiveSigils(coreSigils, '⚔️ Core Sigils', '#2c63c7');
// Advanced Sigils - locked if not unlocked
if(S.advancedSigilsUnlocked) {
html += renderActiveSigils(advancedSigils, '🔥 Advanced Sigils', '#f97316');
} else {
html += `
<h3 style="color:#f97316;margin:1rem 0 0.5rem 0;font-size:1rem">🔥 Advanced Sigils</h3>
<div style="background:#1a1a2e;padding:1.5rem;border-radius:8px;border:2px solid #f97316;text-align:center;opacity:0.8">
<div style="font-size:1.5rem;margin-bottom:0.5rem">🔒</div>
<p style="color:#f97316;font-weight:bold;margin:0 0 0.25rem 0">Ghost • Alpha • Grapple</p>
<p style="color:#888;font-size:0.85rem;margin:0;font-style:italic">Continue your Adventure to Unlock</p>
</div>`;
}
}
html += `<button class="btn secondary" onclick="addActiveToHero()">Back</button>`;
v.innerHTML = html;
}

function confirmAddActiveSigil(heroIdx, sig) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
const h = S.heroes[heroIdx];
if(h.s.includes(sig) || (h.ts && h.ts.includes(sig))) { toast(`${h.n} already has ${sig}!`); return; }
S.xp -= cost;
S.levelUpCount++;
if(!h.ts) h.ts = [];
h.ts.push(sig);
h.ts = sortSigils(h.ts);
const totalLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const displayLevel = totalLevel + 1;  // Internal 0 = display L1, etc.
toast(`${h.n} learned ${sig} (L${displayLevel})!`);
upd();
saveGame();
levelUpMenu();
}

// NEW: Upgrade Active Sigil (All Heroes)
function upgradeActiveSigil() {
showTutorialPop('levelup_upgrade_active', "Upgrading an active sigil makes it MORE POWERFUL <em>for every hero who has or gains that sigil!</em> For example, Attack L2 = hit twice, Shield L2 = 4×POW shields!");
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Upgrade Active Sigil</h2>
<p style="text-align:center;margin-bottom:0.5rem">Cost: ${cost} XP</p>
<p style="text-align:center;margin-bottom:1rem;font-size:0.85rem;opacity:0.8">Upgrades apply to ALL heroes who have this sigil!</p>`;
if(S.xp < cost) {
html += `<p style="text-align:center;margin-bottom:1rem;color:#b64141">Not enough XP!</p>`;
} else {
const activeSigils = ['Attack', 'Shield', 'Heal', 'D20', 'Ghost', 'Alpha', 'Grapple'];
const available = activeSigils.filter(s => {
const totalLevel = (S.sig[s] || 0) + (S.tempSigUpgrades[s] || 0);
return totalLevel < 4;
});

if(available.length === 0) {
html += `<p style="text-align:center;margin-bottom:1rem">All active sigils maxed!</p>`;
} else {
const coreSigils = ['Attack', 'Shield', 'Heal', 'D20'];
const advancedSigils = ['Ghost', 'Alpha', 'Grapple'];

const renderUpgradeSigils = (sigils, categoryName, categoryColor) => {
const availableInCategory = sigils.filter(s => available.includes(s));
if(availableInCategory.length === 0) return '';
let categoryHtml = `<h3 style="color:${categoryColor};margin:1rem 0 0.5rem 0;font-size:1rem">${categoryName}</h3>`;
availableInCategory.forEach(sig => {
const level = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const displayLevel = level + 1;  // Internal 0 = display L1, internal 1 = display L2, etc.
const nextDisplayLevel = displayLevel + 1;
const anyHeroHasSigil = S.heroes.some(hero => hero.s.includes(sig) || (hero.ts && hero.ts.includes(sig)));
const heroNote = !anyHeroHasSigil ? `<br><span style="color:#dc2626;font-size:0.85rem">*No hero has this yet!</span>` : '';
categoryHtml += `<div class="choice" onclick="confirmUpgradeActive('${sig}')"><strong>${sigilIconWithTooltip(sig, displayLevel)} ${sig} | L${displayLevel} → L${nextDisplayLevel}</strong>${heroNote}</div>`;
});
return categoryHtml;
};

html += renderUpgradeSigils(coreSigils, '⚔️ Core Sigils', '#2c63c7');
// Advanced Sigils - locked if not unlocked
if(S.advancedSigilsUnlocked) {
html += renderUpgradeSigils(advancedSigils, '🔥 Advanced Sigils', '#f97316');
} else {
html += `
<h3 style="color:#f97316;margin:1rem 0 0.5rem 0;font-size:1rem">🔥 Advanced Sigils</h3>
<div style="background:#1a1a2e;padding:1.5rem;border-radius:8px;border:2px solid #f97316;text-align:center;opacity:0.8">
<div style="font-size:1.5rem;margin-bottom:0.5rem">🔒</div>
<p style="color:#f97316;font-weight:bold;margin:0 0 0.25rem 0">Ghost • Alpha • Grapple</p>
<p style="color:#888;font-size:0.85rem;margin:0;font-style:italic">Continue your Adventure to Unlock</p>
</div>`;
}
}
}
html += `<button class="btn secondary" onclick="levelUpMenu()">Back</button>`;
v.innerHTML = html;
}

function confirmUpgradeActive(sig) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
const totalLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
if(totalLevel >= 4) { toast(`${sig} is already maxed!`); return; }
S.xp -= cost;
S.levelUpCount++;
S.tempSigUpgrades[sig] = (S.tempSigUpgrades[sig] || 0) + 1;
const newLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const displayLevel = newLevel + 1;  // Internal 0 = display L1, etc.
toast(`${sig} upgraded to L${displayLevel}!`);
upd();
saveGame();
levelUpMenu();
}

// NEW: Add/Upgrade Passive Sigil (All Heroes)
function upgradePassiveSigil() {
showTutorialPop('levelup_upgrade_passive', "Once upgraded, Passive sigils (Expand, Asterisk, Star) work AUTOMATICALLY for ALL heroes! They enhance your abilities without needing to click them.");
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Add/Upgrade Passive Sigil</h2>
<p style="text-align:center;margin-bottom:0.5rem">Cost: ${cost} XP</p>
<p style="text-align:center;margin-bottom:1rem;font-size:0.85rem;opacity:0.8">Passive sigils automatically benefit ALL heroes!</p>`;
// Passive Sigils - locked if not unlocked
if(!S.passiveSigilsUnlocked) {
html += `
<div style="background:#1a1a2e;padding:2rem;border-radius:8px;border:2px solid #9333ea;text-align:center;opacity:0.8">
<div style="font-size:1.5rem;margin-bottom:0.5rem">🔒</div>
<p style="color:#9333ea;font-weight:bold;margin:0 0 0.25rem 0">Expand • Asterisk • Star</p>
<p style="color:#888;font-size:0.85rem;margin:0;font-style:italic">Continue your Adventure to Unlock</p>
</div>`;
} else if(S.xp < cost) {
html += `<p style="text-align:center;margin-bottom:1rem;color:#b64141">Not enough XP!</p>`;
} else {
const passiveSigils = ['Expand', 'Asterisk', 'Star'];
const available = passiveSigils.filter(s => {
const totalLevel = (S.sig[s] || 0) + (S.tempSigUpgrades[s] || 0);
return totalLevel < 4;
});

if(available.length === 0) {
html += `<p style="text-align:center;margin-bottom:1rem">All passive sigils maxed!</p>`;
} else {
html += `<div style="background:rgba(147,51,234,0.1);border:2px solid #9333ea;border-radius:8px;padding:1rem;margin-bottom:1rem">
<h3 style="color:#9333ea;margin:0 0 0.5rem 0;font-size:1rem">✨ Passive Sigils</h3>
<p style="font-size:0.85rem;margin:0;line-height:1.4"><strong>Expand:</strong> +1 target for Attack/Shield/Heal<br><strong>Asterisk:</strong> Next action triggers multiple times<br><strong>Star:</strong> Multiply XP earned in combat</p>
</div>`;

available.forEach(sig => {
const level = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const isNew = level === 0;
const displayText = isNew ? `Add ${sig}` : `${sig} | L${level} → L${level + 1}`;
const tooltipLevel = isNew ? 1 : level;  // Show L1 tooltip when adding, current level otherwise
html += `<div class="choice" onclick="confirmUpgradePassive('${sig}')"><strong>${sigilIconWithTooltip(sig, tooltipLevel)} ${displayText}</strong></div>`;
});
}
}
html += `<button class="btn secondary" onclick="levelUpMenu()">Back</button>`;
v.innerHTML = html;
}

function confirmUpgradePassive(sig) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
const totalLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
if(totalLevel >= 4) { toast(`${sig} is already maxed!`); return; }
S.xp -= cost;
S.levelUpCount++;
S.tempSigUpgrades[sig] = (S.tempSigUpgrades[sig] || 0) + 1;
const newLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
// When passive is first acquired (level becomes 1), add it to all heroes' sigil lists
if(newLevel === 1) {
S.heroes.forEach(hero => {
if(!hero.s.includes(sig) && !(hero.ts && hero.ts.includes(sig))) {
hero.s.push(sig);
hero.s = sortSigils(hero.s);
}
});
}
toast(`${sig} ${newLevel === 1 ? 'added' : 'upgraded to L' + newLevel}! All heroes benefit!`);
upd();
saveGame();
levelUpMenu();
}

function heroStats() {
showTutorialPop('levelup_stat_upgrade', "This one is pretty straightforward - add +1 POW or +5 HP to a hero of your choice.");
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Upgrade Hero Stats</h2>
<p style="text-align:center;margin-bottom:1rem">Cost: ${cost} XP</p>`;
if(S.xp < cost) {
html += `<p style="text-align:center;margin-bottom:1rem;color:#b64141">Not enough XP!</p>`;
} else {
S.heroes.forEach((h, idx) => {
html += `<div class="choice" onclick="upPow(${idx})"><strong>${h.n} POW</strong> (${h.p} → ${h.p+1})</div>`;
html += `<div class="choice" onclick="upHP(${idx})"><strong>${h.n} HP</strong> (${h.m} → ${h.m+5})</div>`;
});
}
html += `<button class="btn secondary" onclick="levelUpMenu()">Back</button>`;
v.innerHTML = html;
}

function upPow(idx) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
S.xp -= cost;
S.levelUpCount++;
S.heroes[idx].p++;
toast(`${S.heroes[idx].n} POW +1!`);
upd();
saveGame();
levelUpMenu();
}

function upHP(idx) {
const cost = getXPCost(S.levelUpCount);
if(S.xp < cost) return;
S.xp -= cost;
S.levelUpCount++;
S.heroes[idx].m += 5;
S.heroes[idx].h += 5;
if(S.heroes[idx].ls) {
S.heroes[idx].ls = false;
S.heroes[idx].lst = 0;
S.heroes[idx].h = 5;
toast(`${S.heroes[idx].n} revived with 5 HP!`);
} else toast(`${S.heroes[idx].n} HP +5!`);
upd();
saveGame();
levelUpMenu();
}

