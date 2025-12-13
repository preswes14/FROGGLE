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
v.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;z-index:30000">
<div style="text-align:center;color:#fff;animation:fadeIn 0.5s ease">
<div style="font-size:2.5rem;font-weight:bold;margin-bottom:1rem">Floor ${f}</div>
<div style="font-size:1.8rem;font-style:italic">${floorName}</div>
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

function startFloor(f) {
console.log(`[FLOOR] startFloor(${f}) called, type=${typeof f}, isOdd=${f % 2 === 1}`);
S.floor=f;
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
console.log(`[FLOOR] Floor ${f} is odd, starting combat`);
showFloorInterstitial(f, () => combat(f));
} else {
console.log(`[FLOOR] Floor ${f} is even, starting neutral`);
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
console.log(`[FLOOR] combat(${f}) called, enemies will be created for floor ${f}`);
// Show header during combat
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';
S.inCombat = true; // Mark that we're in active combat for autosave
// JUICE: Start combat music
ProceduralMusic.startCombat();
S.combatEnding = false; // Reset combat ending guard flag
S.round=1; S.turn='player'; S.activeIdx=-1; S.acted=[]; S.locked=false;
S.lastActions={};
S.combatXP=0; S.combatGold=0; // Track combat rewards separately
S.pending=null; S.targets=[]; S.currentInstanceTargets=[]; S.instancesRemaining=0; S.totalInstances=0; S.turnDamage=0;
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
return enemy;
});
if(S.ambushed) {
toast('AMBUSHED! All heroes stunned Turn 1!', 1800);
S.ambushed = false; // Clear flag after use
}
// Check if we need to show Encampment enemy selection
if(S.encampmentEarlyKills && S.encampmentEarlyKills > 0) {
S.selectingEncampmentTargets = true;
S.encampmentSelectedTargets = [];
}
render();
// Auto-target tutorial: show on second+ run, floor 1
if(S.run >= 2 && f === 1 && !S.tutorialFlags.auto_target_intro) {
const isTouchDevice = 'ontouchstart' in window;
const inputHint = isTouchDevice ? "Press SELECT on controller" : "Right-click any sigil (or SELECT on controller)";
showTutorialPop('auto_target_intro', `Pro tip: ${inputHint} to auto-target the best enemy! This quickly attacks the lowest-HP target without manual selection.`);
}
}

function getLevel(sig, heroIdx) {
const h = S.heroes[heroIdx];
// Calculate total level (permanent + temporary XP upgrades)
const totalLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
// Star, Asterisk, and Expand are global passives - all heroes get them when upgraded
if(sig === 'Star' || sig === 'Asterisk' || sig === 'Expand') {
// Special case: Mage and Healer get +1 to Expand
if(sig === 'Expand' && (h.n === 'Mage' || h.n === 'Healer')) {
console.log('[EXPAND] Mage/Healer bonus: totalLevel:', totalLevel, '+1 =', totalLevel + 1);
return totalLevel + 1;
}
if(sig === 'Expand') console.log('[EXPAND] No bonus: hero.n:', h?.n, 'totalLevel:', totalLevel);
return totalLevel;
}
// For other sigils, check if hero has it
const hasSigil = h.s.includes(sig) || (h.ts && h.ts.includes(sig));
if(!hasSigil) return 0;
// Actives always display +1 higher (perm 0 = L1, perm 1 = L2, etc.)
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
if(actives.includes(sig)) return totalLevel + 1;
return totalLevel;
}

function getTargetsPerInstance(action, heroIdx) {
const expandLevel = getLevel('Expand', heroIdx);
const hero = S.heroes[heroIdx];
console.log('[TARGETING] getTargetsPerInstance:', action, 'heroIdx:', heroIdx, 'hero.n:', hero?.n, 'expandLevel:', expandLevel, 'totalTargets:', 1 + expandLevel);
return 1 + expandLevel;
}

function needsEnemyTarget(action) { return ['Attack', 'Grapple'].includes(action); }
function needsHeroTarget(action) { return ['Heal', 'Shield', 'Alpha'].includes(action); }
function isMultiInstance(action) { return ['Attack', 'Shield', 'Heal'].includes(action); }

function getD20DC(baseDC, heroIdx, gambitName) {
const h = S.heroes[heroIdx];
if(!h || !h.ls) return baseDC;
// Last Stand: +2 immediately, then +2 each turn (h.lst counts turns in Last Stand)
const lastStandBonus = (h.lst + 1) * 2;
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
if(!h) { console.error('Invalid hero index:', idx); return; }
if(S.acted.includes(idx)) { toast(`${h.n} already acted!`); return; }
if(h.st > 0) { toast(`${h.n} is stunned!`); return; }
S.activeIdx = idx;
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
if(!h) { console.error('Invalid hero index in act():', heroIdx); return; }
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

// PASSIVE ASTERISK: Auto-apply on first action per combat
const asteriskLevel = getLevel('Asterisk', heroIdx);
const hasAsterisk = asteriskLevel > 0;
const firstAction = !h.firstActionUsed;
let repeats = 1;

if(hasAsterisk && firstAction) {
repeats = asteriskLevel + 1;
h.firstActionUsed = true;
toast(`Asterisk activated! ${sig} ×${repeats}!`, 1500);
}

if(sig === 'Ghost') {
const level = getLevel('Ghost', heroIdx);
if(level === 0) { toast(`${h.n} doesn't have Ghost! Add it in Level-Up menu (costs XP).`); return; }
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
S.pending = 'Grapple';
S.grappleRepeats = repeats;
S.grappleLevel = level;
S.targets = [];
render();
autoFocusTargetForController(heroIdx, 'enemy');
} else if(sig === 'Alpha') {
const level = getLevel('Alpha', heroIdx);
if(level === 0) { toast(`${h.n} doesn't have Alpha! Add it in Level-Up menu (costs XP).`); return; }
const expandLevel = getLevel('Expand', heroIdx);
const targetsNeeded = 1 + expandLevel;
S.pending = 'Alpha';
S.alphaLevel = level;
S.alphaTargetsNeeded = targetsNeeded;
S.targets = [];
toast(`Alpha: Grant ${level} action${level>1?'s':''} to ${targetsNeeded} hero${targetsNeeded>1?'es':''}!`);
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

// Calculate targets needed
const expandLevel = getLevel('Expand', heroIdx);
const hasBuiltInExpand = (hero.c === 'Mage' || hero.c === 'Healer');
const totalTargets = 1 + expandLevel + (hasBuiltInExpand ? 1 : 0);
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
  for (const enemy of toTarget) {
    const card = document.getElementById(enemy.id);
    if (card) card.click();
  }
  if (toTarget.length > 0) {
    toast(`Auto-targeted ${toTarget.length} enem${toTarget.length === 1 ? 'y' : 'ies'}!`, 1200);
  }

} else if (['Heal', 'Shield', 'Alpha'].includes(S.pending)) {
  let aliveHeroes = S.heroes.filter(h => h.h > 0 || h.ls);
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
  for (const h of toTarget) {
    const card = document.getElementById(h.id);
    if (card) card.click();
  }
  if (toTarget.length > 0) {
    toast(`Auto-targeted ${toTarget.length} hero${toTarget.length === 1 ? '' : 'es'}!`, 1200);
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
html += '<h3 style="margin-bottom:1rem;color:#6b4423">D20: Do Something Crazy</h3>';
html += `<div class="choice" onclick="selectD20Action(${heroIdx}, 10, 'CONFUSE')" style="margin-bottom:0.5rem;background:#3b82f6;border:3px solid #f97316;font-size:1.1rem;cursor:pointer">
<strong style="font-size:1.2rem">✅ DC 10: CONFUSE</strong><br>
<span style="font-size:0.95rem">Deal this enemy's POW to all enemies</span>
</div>`;
// Show other options greyed out
const lockedOptions = [
{dc:12, name:'STARTLE', desc:'Stun for 1 turn'},
{dc:15, name:'MEND', desc:'Heal self for POW'},
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
html = '<div style="text-align:center;padding:1rem;background:white;border:3px solid #000;border-radius:8px;margin:1rem auto;max-width:400px">';
html += '<h3 style="margin-bottom:1rem">D20: Do Something Crazy</h3>';
const expandLevel = getLevel('Expand', heroIdx);
const maxTargets = 1 + expandLevel;
if(expandLevel > 0) html += `<p style="margin-bottom:0.75rem;color:#22c55e;font-weight:bold;font-size:1.05rem;background:rgba(34,197,94,0.1);padding:0.5rem;border-radius:6px;border:2px solid #22c55e">✨ Expand L${expandLevel} Active: Target up to ${maxTargets} enemies!</p>`;
if(S.asteriskD20Repeats > 1) {
html += `<p style="margin-bottom:0.5rem;color:#f97316">Asterisk Active: Pick ${S.asteriskD20Repeats} actions!</p>`;
html += `<p style="margin-bottom:1rem;font-size:0.85rem">(${S.asteriskD20Count}/${S.asteriskD20Repeats} used)</p>`;
}
if(h.ls && h.lst >= 0) {
const lsBonus = (h.lst + 1) * 2;
html += `<p style="margin-bottom:0.5rem;color:#dc2626;font-weight:bold">Last Stand Turn ${h.lst + 1}: DCs +${lsBonus}</p>`;
}
const options = [
{dc:10, name:'CONFUSE', desc:'Deal this enemy\'s POW to all enemies'},
{dc:12, name:'STARTLE', desc:'Stun for 1 turn'},
{dc:15, name:'MEND', desc:'Heal self for POW'},
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
S.pending = 'D20_TARGET';
S.targets = [];
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
setTimeout(() => d20Menu(heroIdx), ANIMATION_TIMINGS.TUTORIAL_DELAY);
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
setTimeout(() => d20Menu(heroIdx), ANIMATION_TIMINGS.TUTORIAL_DELAY);
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
setTimeout(() => d20Menu(heroIdx), ANIMATION_TIMINGS.TUTORIAL_DELAY);
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
const dmg = enemy.p;
// Deal this enemy's POW to all enemies
S.enemies.forEach(e => {
dealDamageToEnemy(e, dmg);
});
} else if(action === 'STARTLE') {
enemy.st = 1;
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
S.acted.push(heroIdx);
S.pending = null;
S.targets = [];
S.asteriskD20Repeats = 1;
S.asteriskD20Count = 0;
checkTurnEnd();
render();
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

// D20_TARGET uses S.targets, not S.currentInstanceTargets - check first
if(S.pending === 'D20_TARGET') {
if(!S.targets || S.targets.length === 0) {
  toast('Select at least one target first!');
  return;
}
rollD20();
return;
}

// For other actions, check S.currentInstanceTargets
if(!S.currentInstanceTargets || S.currentInstanceTargets.length === 0) {
toast('Select at least one target first!');
return;
}
const heroIdx = S.activeIdx;

if(S.pending === 'Attack') {
executeInstance(S.pending, heroIdx, [...S.currentInstanceTargets]);
S.instancesRemaining--;
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
S.instancesRemaining--;
S.currentInstanceTargets = [];
if(S.instancesRemaining <= 0) {
  setTimeout(() => finishAction(heroIdx), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
} else {
  setTimeout(() => render(), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}
} else if(S.pending === 'Alpha') {
executeAlpha(heroIdx, [...S.currentInstanceTargets]);
S.currentInstanceTargets = [];
finishAction(heroIdx);
}
}

function tgtEnemy(id) {
if(S.locked) { toast('Wait for enemy turn!'); return; }
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
  executeD20Action();
} else {
  render();
}
return;
}
if(!S.pending || !needsEnemyTarget(S.pending)) return;
const heroIdx = S.activeIdx;
const targetsPerInstance = getTargetsPerInstance(S.pending, heroIdx);
if(S.pending === 'Attack') {
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
// Count available targets (enemies not yet targeted)
const availableEnemies = S.enemies.filter(e => e.h > 0 && !S.currentInstanceTargets.includes(e.id)).length;
// Auto-confirm when targets are full OR all available enemies selected (manual only, not auto-select)
const shouldAutoConfirm = (S.currentInstanceTargets.length >= targetsPerInstance || availableEnemies === 0) && !S.autoSelectInProgress;
if(shouldAutoConfirm) {
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
if(S.locked) { toast('Wait for enemy turn!'); return; }
if(!S.pending || !needsHeroTarget(S.pending)) return;
const heroIdx = S.activeIdx;
const h = S.heroes[heroIdx];
const target = S.heroes.find(x => x.id === id);
if(!target) return;
const targetsPerInstance = getTargetsPerInstance(S.pending, heroIdx);
if(S.pending === 'Shield' || S.pending === 'Heal') {
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
// Count available heroes (alive heroes not yet targeted)
const availableHeroes = S.heroes.filter(hero => (hero.h > 0 || hero.ls) && !S.currentInstanceTargets.includes(hero.id)).length;
// Auto-confirm when targets are full OR all available heroes selected (manual only, not auto-select)
const shouldAutoConfirm = (S.currentInstanceTargets.length >= targetsPerInstance || availableHeroes === 0) && !S.autoSelectInProgress;
if(shouldAutoConfirm) {
  confirmTargets();
} else {
  render();
}
} else if(S.pending === 'Alpha') {
// Alpha: can't target self or already-acted heroes
const alphaUser = S.heroes[S.activeIdx];
if(!alphaUser) return; // Guard against invalid activeIdx
if(id === alphaUser.id) { toast('Cannot Alpha yourself!'); return; }
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
S.pending = null;
S.targets = [];
toast(`${alphaUser.n} used Alpha! Granting ${actionsToGrant} action${actionsToGrant>1?'s':''} to ${targetIds.length} hero${targetIds.length>1?'es':''}!`);
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
S.activeIdx = nextHeroIdx;
toast(`${S.heroes[nextHeroIdx].n}'s turn (Alpha-granted ${S.alphaCurrentAction + 1}/${S.alphaGrantedActions.length})!`);
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
if(action === 'Attack') {
// Trigger attacker animation
triggerAttackAnimation(h.id);

const targetDetails = [];
const damagedEnemyIds = [];
// First pass: Apply damage to all targets
targets.forEach(tgtId => {
const e = S.enemies.find(x => x.id === tgtId);
if(!e) return;
const hpBefore = e.h;
damagedEnemyIds.push(e.id);
// Apply damage (without animation yet)
applyDamageToTarget(e, pow, {isHero: false, skipRewards: false});
const hpAfter = e.h;
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
}, ANIMATION_TIMINGS.ATTACK_IMPACT);
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
}, 200);
}
// FLYDRA: Check if all heads are now dying (victory condition)
if(dyingFlydras.length > 0 && isFlydraDefeated()) {
SoundFX.play('croak');
triggerScreenShake(true);
setTimeout(() => {
S.enemies = S.enemies.filter(e => !e.isFlydra);
render();
checkCombatEnd();
}, 300);
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
target.h = healAmt;
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
e.st += stunDuration;
targetNames.push(e.n);
// Check royal quest completion
if(S.royalQuestActive && S.round === 1 && !S.royalQuestCompleted) {
S.royalQuestCompleted = true;
toast(`Royal Quest completed! Ring retrieved!`, 1800);
}
});
if(targetNames.length > 0) toast(`${h.n} grappled ${targetNames.join(', ')} - stunned ${stunDuration} turn${stunDuration>1?'s':''}!`);
if(totalDmg > 0) {
// Hero takes recoil damage - trigger hit animation
triggerHitAnimation(h.id);
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
}, 300);
} else {
render(); // Re-render to show flipped card
}
} else if(!enemy.isFlydra) {
// JUICE: Knockout animation and death sound
triggerKnockout(enemy.id);
SoundFX.play('death');
triggerScreenShake(true); // Heavy shake on enemy defeat

// RIBBLETON TUTORIAL: Track Wolf/Goblin kills
if(tutorialState && S.floor === 0) {
if(enemy.n === 'Wolf') tutorialState.wolfKilled = true;
if(enemy.n === 'Goblin') tutorialState.goblinKilled = true;
}

// Remove enemy after knockout animation
setTimeout(() => {
  S.enemies = S.enemies.filter(e => e.id !== enemy.id);
  render();
  checkCombatEnd();
}, 300);
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
// All Alpha-granted actions complete
S.alphaGrantedActions = [];
S.alphaCurrentAction = 0;
}
}
// Normal action finish
S.acted.push(heroIdx);
S.pending = null;
S.targets = [];
S.currentInstanceTargets = [];
S.instancesRemaining = 0;
S.totalInstances = 0;
S.activeIdx = -1;
S.turnDamage = 0; // Reset damage counter for next hero's turn

// RIBBLETON TUTORIAL: Check advancement after action using TutorialManager
const h = S.heroes[heroIdx];
TutorialManager.advanceStage({action: 'finish', hero: h.n, round: S.round});

// Autosave after each hero action
autosave();

checkTurnEnd();
render();
}

function checkTurnEnd() {
// First check if combat has ended (all enemies dead or all heroes in last stand)
// This prevents continuing turn progression after victory/defeat
if(S.enemies.length === 0 || S.heroes.every(h => h.ls)) {
return; // Combat ended, don't process turn logic
}

// Check if all non-stunned heroes have acted (optimized single-pass)
const allActedIncludingLS = S.heroes.every((h, idx) => {
return h.st > 0 || S.acted.includes(idx);
});
if(allActedIncludingLS) {
S.heroes.forEach(h => { if(h.ls) h.lst++; });

// RIBBLETON TUTORIAL: Handle enemy turn start using TutorialManager
TutorialManager.onEnemyTurnStart();
setTimeout(() => { S.locked = true; enemyTurn(); }, T(ANIMATION_TIMINGS.TURN_TRANSITION));
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
dyingFlydras.forEach(flydra => {
flydra.flydraState = 'dead';
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
render();
S.enemies.forEach(e => {
if(e.st > 0) e.st--;
e.turnsSinceGain++;
e.alphaActed = false;
});
// Process recruits - stun decrement
if(S.recruits) {
S.recruits.forEach(r => {
if(r.st > 0) r.st--;
if(!r.turnsSinceGain) r.turnsSinceGain = 0;
r.turnsSinceGain++;
});
}
setTimeout(() => executeAlphaPhase(), ANIMATION_TIMINGS.ALPHA_PHASE_START);
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
enemy.s.push({sig, level, perm:false});
toast(`${getEnemyDisplayName(enemy)} drew ${sig} L${level}!`);
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
const allies = S.enemies.filter(e => e.id !== alphaEnemy.id && e.h > 0 && !e.s.some(s => s.sig === 'Alpha' && !s.perm));
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
if(recruit.st > 0) { toast(`${recruit.n} (Recruit) is stunned!`); return; }
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
// Heal lowest HP hero
const targets = S.heroes.filter(h => h.h > 0 && !h.ls);
if(targets.length > 0) {
targets.sort((a, b) => a.h - b.h);
const healTarget = targets[0];
healTarget.h += healAmt;
if(healTarget.h > healTarget.m) healTarget.h = healTarget.m;
toast(`${recruit.n} (Recruit) healed ${healTarget.n} for ${healAmt}!`);
}
} else if(sig === 'Grapple') {
if(S.enemies.length === 0) return;
const targets = S.enemies.filter(e => e.h > 0);
if(targets.length === 0) return;
targets.sort((a, b) => a.h - b.h);
const target = targets[0];
const dmgToRecruit = target.p;
recruit.h -= dmgToRecruit;
toast(`${recruit.n} (Recruit) grappled ${target.n}!`);
if(recruit.h <= 0) {
recruit.h = 0;
toast(`${recruit.n} (Recruit) defeated by grapple recoil!`);
S.recruits = S.recruits.filter(r => r.id !== recruit.id);
} else {
target.st = level;
toast(`${target.n} stunned for ${level} turns!`);
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
if(enemy.st > 0) { toast(`${getEnemyDisplayName(enemy)} is stunned!`); return; }
if(enemy.alphaActed) {
toast(`${getEnemyDisplayName(enemy)} used Alpha (skipping normal turn)`);
enemy.s = enemy.s.filter(s => s.perm);
return;
}
// PHASE 1 TUTORIAL: Flies attack back to teach players that enemies fight back!
executeEnemyBaseAttack(enemy);
const drawnSigils = enemy.s.filter(s => !s.perm && s.sig !== 'Alpha');

// Filter out suicidal grapples - enemies should never kill themselves
const safeSigils = drawnSigils.filter(sigil => {
if(sigil.sig === 'Grapple') {
const target = S.heroes[enemy.li];
if(target && target.h > 0) {
const recoilDamage = target.p;
// Skip grapple if it would kill the enemy
if(enemy.h <= recoilDamage) {
toast(`${getEnemyDisplayName(enemy)} considered Grapple but chose to survive instead!`);
return false;
}
}
}
return true;
});

safeSigils.forEach(sigil => executeEnemySigil(enemy, sigil));
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

// 2. That hero's recruited ally (if present)
if(S.recruits && S.recruits.length > 0) {
const primaryRecruit = S.recruits.find(r => r.li === enemy.li && r.h > 0);
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
// Sort by lane distance from enemy
aliveRecruits.sort((a, b) => Math.abs(a.li - enemy.li) - Math.abs(b.li - enemy.li));

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
executeEnemyAttackOnHeroes(enemy, targetCount, 'Base Attack');
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
const allies = S.enemies.filter(e => e.id !== enemy.id && e.h > 0);
if(allies.length > 0) {
allies.sort((a,b) => a.h - b.h);
const healTarget = allies[0];
healTarget.h += healAmt;
if(healTarget.h > healTarget.m) healTarget.h = healTarget.m;
toast(`${getEnemyDisplayName(enemy)} healed ${getEnemyDisplayName(healTarget)} for ${healAmt}!`);
}
} else if(sig === 'Grapple') {
const target = S.heroes[enemy.li];
if(target && target.h > 0) {
const dmgToEnemy = target.p;
enemy.h -= dmgToEnemy;
toast(`${getEnemyDisplayName(enemy)} grappled ${target.n}!`);
if(enemy.h <= 0) {
enemy.h = 0;
toast(`${getEnemyDisplayName(enemy)} defeated by grapple recoil!`);
S.enemies = S.enemies.filter(e => e.id !== enemy.id);
} else {
target.st = level;
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
S.heroes.forEach(h => {
if(h.st > 0) {
h.st--;
if(h.st === 0) toast(`${h.n} is no longer stunned!`);
}
});
if(checkCombatEnd()) return;
S.round++;

// Enemies draw sigils at start of player turn (so player can strategize)
S.enemies.forEach(e => {
// RIBBLETON TUTORIAL: Enemies don't gain sigils (except Goblin on Round 3)
const isTutorial = tutorialState && S.floor === 0;
const isGoblinRound3 = isTutorial && e.n === 'Goblin' && S.round === 3;
if(e.turnsSinceGain >= e.gainRate && (!isTutorial || isGoblinRound3)) {
e.turnsSinceGain = 0;
// Draw multiple sigils per turn if specified (Dragons draw 2)
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

// Show "Your turn!" toast to indicate player can act again
const aliveHeroes = S.heroes.filter(h => h.h > 0);
if(aliveHeroes.length > 0) {
toast('Your turn!', ANIMATION_TIMINGS.TOAST_SHORT);
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
toast('Victory!');
if(tutorialState && tutorialState.phase === 1) {
// Phase 1 complete: Transition to Phase 2
setTimeout(finishTaposBirthdayPhase, T(ANIMATION_TIMINGS.VICTORY_DELAY));
} else {
// Phase 2 complete: Show handoff popup, then finish tutorial
setTimeout(() => {
showTutorialPop('ribbleton_handoff', "Hover / long-press any sigil to see what it does, and check out the FAQ and Sigilarium for tips. You're on your own now - good luck!", () => {
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
ProceduralMusic.playVictory(); // Victory fanfare!
SoundFX.play('ribbit'); // Celebratory frog croak!

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
if(starBonus > 0) toast(`Star Bonus! ${combatXP} × ${(1 + starBonus).toFixed(1)} = ${bonusXP} XP`, 3000);
// JUICE: Counter pop for XP gain
animateCounterPop('xp');
upd();
toast('Victory!');
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
if(S.currentSlot) {
localStorage.removeItem(`froggle8_slot${S.currentSlot}`);
}
localStorage.removeItem('froggle8'); // Also clear old format for backwards compatibility
// Record to The Pond - determine what killed the heroes
const killedBy = S.enemies.length > 0 ? S.enemies[0].n : 'Unknown';
recordPondHistory('defeat', killedBy);
// JUICE: Defeat sound and music
ProceduralMusic.playDefeat();
SoundFX.play('death');
setTimeout(() => {
toast('Defeated!');
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
// Clean up tooltips before screen transition
if(typeof hideTooltip === 'function') hideTooltip();
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
// Toggle FU mode class for compact 3-hero layout
v.classList.toggle('fu-mode', S.gameMode === 'fu');
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
// REMOVED: Targeting popup is now batched with Attack popup
// Auto-advance stage when Attack is pending
if(tutorialState.stage === 'warrior_attack' && S.pending === 'Attack' && S.targets.length === 0) {
tutorialState.stage = 'targeting_wolf';
// No popup - already explained in popup 1
}
// PROMPT 4: Heal + Expand (BATCHED)
else if(tutorialState.stage === 'healer_heal' && S.pending === 'Heal' && S.currentInstanceTargets.length === 0 && S.targets.length === 0) {
tutorialState.stage = 'expand_targets';
showTutorialPop('ribbleton_expand', "Use Healer's Expand to heal both wounded heroes!", () => {
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
html += `<div class="combat-lane">`;
html += '<div class="lane-content" style="display:flex;gap:2rem;justify-content:center;align-items:stretch">';

// Hero section (left side of lane)
html += '<div style="flex:0 0 auto;display:flex;flex-direction:column;gap:0.3rem">';

// Show recruit BEHIND (before) hero if exists
if(S.recruits) {
const heroRecruits = S.recruits.filter(r => r.recruitedBy === i);
if(heroRecruits.length > 0) {
// Sort by POW descending, then by current HP descending
heroRecruits.sort((a, b) => {
if(b.p !== a.p) return b.p - a.p;
return b.h - a.h;
});
const recruit = heroRecruits[0];
const extra = [];
if(recruit.sh > 0) extra.push(`${recruit.sh}🛡`);
if(recruit.g > 0) extra.push(`${recruit.g}${sigilIconOnly('Ghost')}`);
if(recruit.st > 0) extra.push(`💥${recruit.st}T`);
html += `<div id="${recruit.id}" class="card hero" style="opacity:0.85;border:2px dashed #22c55e">`;
// Power at top
html += `<div style="text-align:center;font-size:1rem;font-weight:bold;margin-bottom:0.25rem">${recruit.p}</div>`;
// Recruited label with emoji
html += `<div style="text-align:center;font-size:1.5rem;margin-bottom:0.25rem">🤝</div>`;
// HP
html += `<div style="text-align:center;font-size:0.85rem;margin-bottom:0.25rem">${recruit.h}/${recruit.m}</div>`;
// Extra info
if(extra.length>0) html += `<div style="text-align:center;font-size:0.7rem;margin-bottom:0.25rem">${extra.join(' ')}</div>`;
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

// LAST STAND: Flipped card visual (similar to dying Flydra)
if(h.ls) {
const isTargetable = S.pending && needsHeroTarget(S.pending);
const hasActed = S.acted.includes(i);
const isActive = S.activeIdx === i;
let lsClasses = 'card hero last-stand-flipped';
if(i === 0) lsClasses += ' chosen-one';
if(isActive) lsClasses += ' active';
if(isTargetable) lsClasses += ' targetable';
if(hasActed) lsClasses += ' acted';
const isTargeted = S.targets.includes(h.id);
if(isTargeted) lsClasses += ' targeted';
let onclick = '';
if(isTargetable) onclick = `onclick="tgtHero('${h.id}')"`;
else if(!hasActed && h.st === 0 && !S.pending) onclick = `onclick="selectHero(${i})"`;
const heroImage = getHeroImage(h);
html += `<div id="${h.id}" class="${lsClasses}" style="background:linear-gradient(135deg,#450a0a,#7f1d1d);border:3px solid #dc2626" ${onclick}>`;
html += `<div style="text-align:center;font-size:0.7rem;font-weight:bold;color:#fca5a5;margin-bottom:0.25rem;animation:pulse-text 1s infinite">⚠️ LAST STAND ⚠️</div>`;
html += `<div style="text-align:center;font-size:0.8rem;font-weight:bold;color:#f1f5f9;margin-bottom:0.25rem">${h.n}</div>`;
if(heroImage) html += `<div style="text-align:center"><img src="${heroImage}" style="width:48px;height:48px;border-radius:4px;object-fit:contain;background:#d4c4a8;filter:sepia(30%) brightness(0.8);border:2px solid #dc2626"></div>`;
html += `<div style="text-align:center;font-size:1.5rem;margin:0.3rem 0">💀</div>`;
html += `<div style="text-align:center;font-size:0.75rem;color:#fca5a5;line-height:1.3;padding:0.25rem">`;
html += `<div style="font-weight:bold;color:#fbbf24">Turn ${h.lst + 1}</div>`;
html += `<div>D20 only!</div>`;
html += `<div style="font-size:0.65rem;opacity:0.8;margin-top:0.2rem">Heal to revive</div>`;
html += `</div>`;
// Show shield/ghost if any
const lsExtra = [];
if(h.sh > 0) lsExtra.push(`${h.sh}🛡`);
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
if(i === 0) cardClasses += ' chosen-one';
if(isActive) cardClasses += ' active';
if(isTargetable) cardClasses += ' targetable';
if(hasActed) cardClasses += ' acted';
if(isStunned) cardClasses += ' stunned';
const isTargeted = S.targets.includes(h.id);
if(isTargeted) cardClasses += ' targeted';
const extra = [];
if(h.sh > 0) extra.push(`${h.sh}🛡`);
if(h.g > 0) extra.push(`${h.g}${sigilIconOnly('Ghost')}`);
if(h.st > 0) extra.push(`💥${h.st}T`);
if(hasActed) extra.push('✓');
let onclick = '';
if(isTargetable) onclick = `onclick="tgtHero('${h.id}')"`;
else if(!hasActed && h.st === 0 && !S.pending) onclick = `onclick="selectHero(${i})"`;
const heroImage = getHeroImage(h);
html += `<div id="${h.id}" class="${cardClasses}" ${onclick}>`;
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
html += `<div style="font-size:1rem;font-weight:bold;min-width:30px;text-align:center">${h.p}</div>`;
if(heroImage) html += `<img src="${heroImage}" style="width:48px;height:48px;border-radius:4px;object-fit:contain;background:#d4c4a8">`;
html += `<div style="font-size:0.85rem;min-width:50px;text-align:center">${hp}</div>`;
html += `</div>`;
// Extra info
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
if(S.activeIdx === i && S.pending === s && isMultiInstance(s) && S.totalInstances) {
const usedInstances = S.totalInstances - S.instancesRemaining;
visualLvl = Math.max(0, lvl - usedInstances);
}
const cl = visualLvl===0?'l0':visualLvl===1?'l1':visualLvl===2?'l2':visualLvl===3?'l3':visualLvl===4?'l4':'l5';
// Allow clicking sigils if: hero hasn't acted, not stunned, and either (no pending action OR pending but no instances committed yet)
const canSwitchAction = !S.pending || (S.instancesRemaining === S.totalInstances);
const canClick = !S.acted.includes(i) && h.st === 0 && canSwitchAction && ['Attack','Shield','Grapple','Heal','Ghost','D20','Alpha'].includes(s);
const isActiveAction = (S.pending === s && S.activeIdx === i);
const isPassive = ['Expand', 'Star', 'Asterisk'].includes(s);
return `<span class="sigil ${cl} ${isPassive?'passive':''} ${isActiveAction?'active-action':''} ${canClick?'clickable':''}" ${canClick?`onclick="act('${s}', ${i})" oncontextmenu="actAndAutoTarget('${s}', ${i}); return false;"`:''}
onmouseenter="showTooltip('${s}', this, ${visualLvl})" onmouseleave="hideTooltip()"
ontouchstart="tooltipTimeout = setTimeout(() => showTooltip('${s}', this, ${visualLvl}), ANIMATION_TIMINGS.TOOLTIP_DELAY)" ontouchend="hideTooltip()">${sigilIconOnly(s, visualLvl)}</span>`;
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
html += '</div>'; // Close hero section

// Divider between heroes and enemies
html += '<div style="width:3px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,0.3) 20%,rgba(0,0,0,0.3) 80%,transparent);flex-shrink:0"></div>';

// Enemy section (right side of lane)
html += '<div style="flex:0 0 auto;display:flex;flex-wrap:wrap;gap:0.3rem;justify-content:flex-start;align-items:flex-start;align-content:flex-start;min-height:80px">';
const laneEnemies = enemyLanes[i] || [];
if(laneEnemies.length === 0) {
html += `<div style="flex:1;text-align:center;font-size:1.2rem;padding:1.5rem;background:rgba(0,0,0,0.1);border:3px dashed rgba(0,0,0,0.3);border-radius:8px;color:rgba(0,0,0,0.4);font-style:italic;display:flex;align-items:center;justify-content:center">No Enemies</div>`;
} else {
laneEnemies.forEach(e => {
// FLYDRA: Check if this is a dying Flydra - render flipped card
if(e.isFlydra && e.flydraState === 'dying') {
html += `<div id="${e.id}" class="card enemy flydra-dying" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:3px solid #e94560;opacity:0.9">`;
html += `<div style="text-align:center;font-size:0.8rem;font-weight:bold;color:#e94560;margin-bottom:0.5rem">⚠️ ${e.n} ⚠️</div>`;
html += `<div style="text-align:center;font-size:2.5rem;margin:0.5rem 0;filter:grayscale(50%)">💀</div>`;
html += `<div style="text-align:center;font-size:0.75rem;color:#f1f5f9;line-height:1.4;padding:0.5rem">`;
html += `<div style="font-weight:bold;color:#fbbf24;margin-bottom:0.3rem">REGENERATING...</div>`;
html += `<div>Revives at ${Math.ceil(e.m/2)} HP next turn unless ALL heads are defeated!</div>`;
html += `</div></div>`;
return;
}
const isTargetable = (S.pending && needsEnemyTarget(S.pending)) || S.pending === 'D20_TARGET';
const selectCount = S.targets.filter(t => t === e.id).length;
let cardClasses = 'card enemy';
if(e.isFlydra) cardClasses += ' flydra';
if(isTargetable) cardClasses += ' targetable';
if(selectCount > 0) cardClasses += ' targeted';
const extra = [];
if(e.sh > 0) extra.push(`${e.sh}🛡`);
// Show ghost charges if enemy has them
if(e.g > 0) extra.push(`${e.g}${sigilIconOnly('Ghost')}`);
if(e.st > 0) extra.push(`💥${e.st}T`);
if(selectCount > 0) extra.push(`×${selectCount}`);
const enemyEmoji = ENEMY_EMOJI[e.n] || '👾';
html += `<div id="${e.id}" class="${cardClasses}" ${isTargetable?`onclick="tgtEnemy('${e.id}')"`:''}">`;
// Name at top
html += `<div style="text-align:center;font-size:0.75rem;font-weight:bold;margin-bottom:0.25rem;opacity:0.8">${getEnemyDisplayName(e)}</div>`;
// POW - emoji - HP row (horizontal)
html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;gap:0.25rem">`;
html += `<div style="font-size:1rem;font-weight:bold;min-width:30px;text-align:center">${e.p}</div>`;
html += `<div style="font-size:2rem">${enemyEmoji}</div>`;
html += `<div style="font-size:0.85rem;min-width:50px;text-align:center">${e.h}/${e.m}</div>`;
html += `</div>`;
// Extra info
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
html += `<span class="sigil ${cl}" onmouseenter="showTooltip('${sigil.sig}', this)" onmouseleave="hideTooltip()" ontouchstart="if(tooltipTimeout)clearTimeout(tooltipTimeout);tooltipTimeout=setTimeout(()=>showTooltip('${sigil.sig}',this),ANIMATION_TIMINGS.TOOLTIP_DELAY)" ontouchend="hideTooltip();if(tooltipTimeout)clearTimeout(tooltipTimeout)">${sigilIconOnly(sigil.sig, sigil.level)}</span>`;
});
html += '</div></div>';
});
}
html += '</div>'; // Close enemy section
html += '</div>'; // Close flex container
html += '</div>'; // Close combat-lane
});
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

// Unlock blue portal and award statuette after completing Floor 19 (combat before floor 20)
if(S.floor === 19) {
S.hasReachedFloor20 = true;
S.hasAncientStatuette = true;
savePermanent();
toast('🗿 Ancient Statuette acquired! The blue portal in Ribbleton has awakened!', 2500);
}

const v = document.getElementById('gameView');
const nextCost = getXPCost(S.levelUpCount);
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem">Level Up!</h2>
<p style="text-align:center;margin-bottom:0.5rem">Floor ${S.floor} Complete</p>
<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem">Current XP: ${S.xp} | Next Level: ${nextCost}XP</p>
<div class="choice" onclick="levelUpMenu()">Spend XP</div>
<button class="btn safe" onclick="nextFloor()">Next Floor</button>`;
}

function nextFloor() {
console.log(`[FLOOR] nextFloor() called, S.floor=${S.floor}`);
// Clear any pending recruit replacement choice
S.pendingNewRecruit = null;
S.pendingOldRecruitId = null;
saveGame();
// Show header buttons tutorial after first neutral encounter (Floor 2 complete)
if(S.floor === 2 && !S.tutorialFlags.faq_intro) {
console.log(`[FLOOR] Floor 2 complete, showing faq_intro tutorial`);
S.tutorialFlags.faq_intro = true;
showTutorialPop('faq_intro', "You're (mostly) on your own from here - good luck! Need help? Check the header buttons at the top:<br><br>🌀 <strong>Sigilarium</strong> - View all sigils and their effects<br>🪵 <strong>Log</strong> - See combat message history<br>❓ <strong>FAQ</strong> - Frequently asked questions about game mechanics<br>⚙️ <strong>Settings</strong> - Adjust game options and preferences", () => {
console.log(`[FLOOR] faq_intro callback, calling startFloor(${S.floor + 1})`);
startFloor(S.floor + 1);
});
return;
}
console.log(`[FLOOR] Calling startFloor(${S.floor + 1})`);
startFloor(S.floor + 1);
}

function showStartingXPScreen() {
const v = document.getElementById('gameView');
const nextCost = getXPCost(S.levelUpCount);
v.innerHTML = `
<h2 style="text-align:center;margin-bottom:1rem;color:#a855f7">Starting XP Bonus!</h2>
<p style="text-align:center;margin-bottom:0.5rem;font-size:1.1rem">You start this run with <strong>${S.startingXP} XP</strong> from Death Boy sacrifices!</p>
<p style="text-align:center;margin-bottom:1.5rem;font-size:0.9rem;opacity:0.8">Spend it now or bank it for later. Remaining XP: <strong>${S.xp}</strong> | Next Level Cost: <strong>${nextCost}XP</strong></p>
<div class="choice" onclick="startingXPMenu()">Spend XP</div>
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
categoryHtml += `<div class="choice" onclick="startingUpSigil('${sig}')"><strong>${sigilIcon(sig)} L${displayLevel} → L${nextDisplayLevel}</strong>${newSigilNote}</div>`;
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
<strong>${sigilIcon(sig)}</strong> <span style="opacity:0.7">(${levelText})</span>${newSigilNote}
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
const displayLevel = level === 0 ? 1 : level;
categoryHtml += `<div class="choice" onclick="confirmAddActiveSigil(${heroIdx}, '${sig}')">
<strong>${sigilIcon(sig)}</strong> <span style="opacity:0.7">(L${displayLevel})</span>
</div>`;
});
return categoryHtml;
};

html += renderActiveSigils(coreSigils, '⚔️ Core Sigils', '#2c63c7');
html += renderActiveSigils(advancedSigils, '🔥 Advanced Sigils', '#f97316');
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
const displayLevel = totalLevel === 0 ? 1 : totalLevel;
toast(`${h.n} learned ${sig} (L${displayLevel})!`);
upd();
saveGame();
levelUpMenu();
}

// NEW: Upgrade Active Sigil (All Heroes)
function upgradeActiveSigil() {
showTutorialPop('levelup_upgrade_active', "Upgrading an active sigil makes it MORE POWERFUL for every hero who has it! For example, Attack L2 = hit twice, Shield L2 = 4×POW shields!");
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
const displayLevel = level === 0 ? 1 : level;
const nextDisplayLevel = displayLevel + 1;
const anyHeroHasSigil = S.heroes.some(hero => hero.s.includes(sig) || (hero.ts && hero.ts.includes(sig)));
const heroNote = !anyHeroHasSigil ? `<br><span style="color:#dc2626;font-size:0.85rem">*No hero has this yet!</span>` : '';
categoryHtml += `<div class="choice" onclick="confirmUpgradeActive('${sig}')"><strong>${sigilIcon(sig)} L${displayLevel} → L${nextDisplayLevel}</strong>${heroNote}</div>`;
});
return categoryHtml;
};

html += renderUpgradeSigils(coreSigils, '⚔️ Core Sigils', '#2c63c7');
html += renderUpgradeSigils(advancedSigils, '🔥 Advanced Sigils', '#f97316');
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
const displayLevel = newLevel === 0 ? 1 : newLevel;
toast(`${sig} upgraded to L${displayLevel}!`);
upd();
saveGame();
levelUpMenu();
}

// NEW: Add/Upgrade Passive Sigil (All Heroes)
function upgradePassiveSigil() {
showTutorialPop('levelup_upgrade_passive', "Passive sigils (Expand, Asterisk, Star) work AUTOMATICALLY for ALL heroes! They enhance your existing actions without needing to click them.");
const cost = getXPCost(S.levelUpCount);
const v = document.getElementById('gameView');
let html = `<h2 style="text-align:center;margin-bottom:1rem">Add/Upgrade Passive Sigil</h2>
<p style="text-align:center;margin-bottom:0.5rem">Cost: ${cost} XP</p>
<p style="text-align:center;margin-bottom:1rem;font-size:0.85rem;opacity:0.8">Passive sigils automatically benefit ALL heroes!</p>`;
if(S.xp < cost) {
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
const displayText = isNew ? `Add ${sig}` : `${sig} L${level} → L${level + 1}`;
html += `<div class="choice" onclick="confirmUpgradePassive('${sig}')"><strong>${sigilIcon(sig)} ${displayText}</strong></div>`;
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

