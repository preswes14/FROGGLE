// ===== VERSION CHECK =====
const GAME_VERSION = 'S_1.18';
console.log(`%c🐸 FROGGLE v${GAME_VERSION} LOADED`, 'color: #22c55e; font-size: 20px; font-weight: bold;');

// Debug logging - only outputs when S.debugMode is true
function debugLog(...args) {
if(typeof S !== 'undefined' && S.debugMode) console.log(...args);
}

// ===== GAME DATA =====
// Hero images
const HERO_IMAGES = {
        warrior: 'assets/characters/warriorfull.png',
        tank: 'assets/characters/tankfull.png',
        mage: 'assets/characters/magefull.png',
        healer: 'assets/characters/healerfull.png',
        tapo: 'assets/characters/tapofull.png'
    };

// Hero reaction images (happy/pained expressions)
const HERO_REACTIONS = {
    warrior: {
        happy: 'assets/reactions/warrior-happy.jpeg',
        pained: 'assets/reactions/warrior-pained.jpeg'
    },
    tank: {
        happy: 'assets/reactions/tank-happy.jpeg',
        pained: 'assets/reactions/tank-pained.jpeg'
    },
    mage: {
        happy: 'assets/reactions/mage-happy.jpeg',
        pained: 'assets/reactions/mage-pained.jpeg'
    },
    healer: {
        happy: 'assets/reactions/healer-happy.jpeg',
        pained: 'assets/reactions/healer-pained.jpeg'
    }
    // Tapo doesn't have reaction images yet
};

// Get hero image based on current reaction state
function getHeroImage(hero) {
    const heroKey = hero.n.toLowerCase();
    const reactions = HERO_REACTIONS[heroKey];

    // Last stand always shows pained
    if (hero.ls && reactions?.pained) {
        return reactions.pained;
    }

    // Check for temporary reaction
    if (hero.reaction && reactions?.[hero.reaction]) {
        return reactions[hero.reaction];
    }

    // Default image
    return HERO_IMAGES[heroKey] || '';
}

// Set a temporary reaction on a hero (clears after duration)
function setHeroReaction(heroId, reaction, duration = 800) {
    const hero = S.heroes.find(h => h.id === heroId);
    if (!hero) return;

    const heroKey = hero.n.toLowerCase();
    if (!HERO_REACTIONS[heroKey]?.[reaction]) return; // No reaction image available

    hero.reaction = reaction;
    render();

    // Clear reaction after duration (unless it's permanent like last stand pained)
    if (duration > 0) {
        setTimeout(() => {
            if (hero.reaction === reaction) {
                hero.reaction = null;
                render();
            }
        }, duration);
    }
}

// Set reaction on all heroes
function setAllHeroesReaction(reaction, duration = 800) {
    S.heroes.forEach(h => {
        if (!h.ls) { // Don't override last stand
            setHeroReaction(h.id, reaction, duration);
        }
    });
}

// Death's dialogue lines (cycles through without repeating until all used)
const DEATH_QUOTES = [
    "Some days you're the sticky tongue, some days you're the fly.",
    "You must really like pain or something. Weirdo.",
    "Next time bring me a smoothie or something",
    "Hey, have you met those ghost boys in the dungeon? I can't get them to make.. you know.. the transition. Help them out, would you?",
    "Death death lemonade, 'round the coroner I parade. Hehe!",
    "Ribbit? Ribbbbbit? Rib bit?",
    "Oh man, a classic green. You just know he's a jumper.",
    "Hello my baby, hello my honey.",
    "If you refuse me, honey you'll lose me, and you'll be left alooooooone",
    "You guys should check out the Discovery Channel to see what normal frogs do",
    "Toadally froggin died, huh?",
    "Send me a kiss by wire, honey my heart's on fire",
    "Maybe try making a beer commercial or something?",
    "At least you don't have to cross a busy highway!",
    "Stay out of pots full of lukewarm water!",
    "Mark Twain keeps my mornings busy *rimshot*",
    "\"Analyzing humor is like dissecting a frog\". Know why? Look it up.",
    "Where does \"frog in your throat\" come from? Do you guys know?",
    "Is this tadpole really worth it?",
    "Ohh, it's pronounced Ta-po like Tad-pole, not Tah-po. Duh."
];

const H = {
warrior: {n:'Warrior', p:2, h:5, m:5, s:['Attack','D20']},
tank: {n:'Tank', p:1, h:10, m:10, s:['Attack','Shield','D20']},
mage: {n:'Mage', p:1, h:5, m:5, s:['Attack','D20','Expand']},
healer: {n:'Healer', p:1, h:5, m:5, s:['Heal','D20','Expand']},
tapo: {n:'Tapo', p:1, h:1, m:1, s:['D20']}
};

// Enemy sigil pools and level restrictions:
// - pool: array of sigils enemy can draw (Asterisk only eligible turn 1)
// - maxLevel: default max level for all sigils (default: 1)
// - sigilLevels: override max level for specific sigils {Attack:2, Shield:2, etc}
// - Star and D20 are NEVER available to enemies
const E = {
fly: { n:'Fly', p:1, h:2, m:2, goldDrop:0, x:0, pool:[], gainRate:999, startSigils:[{s:'Attack',l:1}] },
goblin: { n:'Goblin', p:1, h:5, m:5, goldDrop:1, x:2, pool:['Asterisk','Expand','Shield'], maxLevel:1, gainRate:3 },
wolf: { n:'Wolf', p:2, h:5, m:5, goldDrop:2, x:4, pool:['Asterisk','Expand','Shield','Grapple','Alpha'], maxLevel:1, gainRate:2 },
orc: { n:'Orc', p:2, h:10, m:10, goldDrop:3, x:6, pool:['Asterisk','Expand','Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:1, gainRate:2, alternating: true, altSigil: {s:'Attack',l:2} },
giant: { n:'Giant', p:3, h:12, m:12, goldDrop:6, x:12, pool:['Asterisk','Expand','Shield','Grapple','Alpha','Heal','Ghost','Attack'], maxLevel:1, sigilLevels:{Attack:2,Shield:2,Heal:2}, gainRate:1, startSigils:[{s:'Shield',l:1}] },
caveTroll: { n:'Cave Troll', p:4, h:15, m:15, goldDrop:10, x:15, pool:['Expand','Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:2, gainRate:1, rage: true, ragePattern: [1,2,3] },
dragon: { n:'Dragon', p:5, h:20, m:20, goldDrop:20, x:25, pool:['Expand','Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:2, gainRate:1, drawsPerTurn:1, permSigils:[{s:'Attack',l:2},{s:'Expand',l:1}] },
flydra: { n:'Flydra', p:5, h:25, m:25, goldDrop:0, x:50, pool:['Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:2, gainRate:1, isFlydra:true, permSigils:[{s:'Attack',l:2},{s:'Expand',l:2}] }
};

// Enemy emoji icons
const ENEMY_EMOJI = {
'Fly': '🪰',
'Goblin': '👺',
'Wolf': '🐺',
'Orc': '👹',
'Giant': '🗿',
'Cave Troll': '👹',
'Dragon': '🐉',
'Flydra': '🐲'
};

// Enemy artwork images (replaces emojis for main enemies)
// Fly keeps emoji (tutorial only), Flydra uses FLYDRA_HEADS
const ENEMY_IMAGES = {
'Goblin': 'assets/enemies/goblin.jpeg',
'Wolf': 'assets/enemies/wolf.jpeg',
'Giant': 'assets/enemies/giant.jpeg',
'Orc': 'assets/enemies/orc.png',
'Cave Troll': 'assets/enemies/cave_troll.png',
'Dragon': 'assets/enemies/dragon.jpeg'
};

// Flydra head images and names (for multi-headed boss)
// Standard mode (2 heroes): uses 'left' and 'right' heads (A, B)
// FU mode (3 heroes): uses all three heads (A, B, C)
const FLYDRA_HEADS = {
left: { name: 'Flydra A', image: 'assets/flydra_venomwing.png' },
center: { name: 'Flydra B', image: 'assets/flydra_dreadmaw.png' },
right: { name: 'Flydra C', image: 'assets/flydra_blightfang.png' }
};

// Sigil icons - now using extracted PNG images with transparent backgrounds
const SIGIL_IMAGES = {
'Attack': 'assets/sigils/attack.png',
'Shield': 'assets/sigils/shield.png',
'Heal': 'assets/sigils/heal.png',
'D20': 'assets/sigils/d20.png',
'Asterisk': 'assets/sigils/asterisk.png',
'Alpha': 'assets/sigils/alpha.png',
'Expand': 'assets/sigils/expand.png',
'Grapple': 'assets/sigils/grapple.png',
'Star': 'assets/sigils/star.png',
'Ghost': 'assets/sigils/ghost.png'
};

// Helper function to display sigil with icon
function sigilIcon(name) {
const imgPath = SIGIL_IMAGES[name];
if (!imgPath) return `<span>${name}</span>`;
return `<img src="${imgPath}" style="height:1em;vertical-align:middle;display:inline-block;margin-right:0.25em;filter:brightness(0);" alt="${name}">${name}`;
}

// Helper function to display just the icon
function sigilIconOnly(name, level = null) {
const imgPath = SIGIL_IMAGES[name];
if (!imgPath) return `<span>${name}</span>`;
// CSS handles coloring via .sigil.l0 img, .sigil.l1 img, etc.
const icon = `<img src="${imgPath}" style="height:1.4em;vertical-align:middle;display:inline-block;" alt="${name}">`;
// Add level number as superscript for all levels >= 1
if (level !== null && level >= 1) {
return `${icon}<sup>${level}</sup>`;
}
return icon;
}

// Sigil descriptions for tooltips
// Format: scaling values use <b class="sig-scale">ONE</b> to indicate level-dependent values
const SIGIL_DESCRIPTIONS = {
'Attack': 'Deal POW damage to target <b class="sig-scale">ONE</b> time. L2: twice. L3: 3×. L4: 4×.',
'Shield': 'Grant target <b class="sig-scale">+2×POW</b> shield. L2: +4×. L3: +6×. L4: +8×. Shields persist between battles (capped at max HP).',
'Heal': 'Restore <b class="sig-scale">2×POW</b> HP to target. L2: 4×. L3: 6×. L4: 8×. Cannot exceed max HP.',
'D20': 'Attempt a gambit! Roll <b class="sig-scale">ONE</b> d20. L2: 2 dice (take best). L3: 3 dice. L4: 4 dice.',
'Expand': 'PASSIVE (works automatically): Add <b class="sig-scale">+1</b> target per level to multi-target actions (Attack, Shield, Heal, Alpha, Grapple). Mage/Healer get +1 built-in.',
'Grapple': 'Stun target for <b class="sig-scale">ONE</b> turn. L2: 2 turns. L3: 3 turns. User takes recoil damage equal to target\'s POW. Stun stacks with existing stun!',
'Ghost': 'Gain <b class="sig-scale">ONE</b> Ghost charge. L2: 2 charges. L3: 3. L4: 4. Each charge prevents one lethal hit. Charges persist between combats (max 9).',
'Asterisk': 'PASSIVE (works automatically): Your first action each combat triggers <b class="sig-scale">ONE</b> extra time. L2: 2 extra. L3: 3 extra. L4: 4 extra.',
'Star': 'PASSIVE (works automatically): Multiply combat XP by <b class="sig-scale">1.5×</b>. L2: 2×. L3: 2.5×. L4: 3×. Stacks across all heroes!',
'Alpha': 'Grant target hero <b class="sig-scale">ONE</b> extra action this turn. L2: 2 actions. L3: 3 actions. L4: 4 actions.'
};

// ===== SIGIL ORDERING =====
// Define consistent sigil order for hero cards and displays
// Top row (actives): Attack, Shield, Heal, Grapple, D20 (D20 always top right)
// Bottom row: Alpha (bottom left), Ghost, Expand, Star, Asterisk (bottom right, passive)
const SIGIL_ORDER = ['Attack', 'Shield', 'Heal', 'Grapple', 'D20', 'Alpha', 'Ghost', 'Expand', 'Star', 'Asterisk'];

function sortSigils(sigils) {
if (!Array.isArray(sigils)) return sigils;
return [...sigils].sort((a, b) => {
const aName = typeof a === 'string' ? a : a.sig;
const bName = typeof b === 'string' ? b : b.sig;
const aIndex = SIGIL_ORDER.indexOf(aName);
const bIndex = SIGIL_ORDER.indexOf(bName);
// If not in order array, put at end
if (aIndex === -1 && bIndex === -1) return 0;
if (aIndex === -1) return 1;
if (bIndex === -1) return -1;
return aIndex - bIndex;
});
}

// Render sigils in proper 2-row formation
// Formation: 1-3 = 1 row, 4 = 2x2, 5 = 3+2, 6 = 3+3, 7 = 4+3, 8 = 4+4, 9 = 5+4, 10 = 5+5
function renderSigilRows(sigils, heroIdx, options = {}) {
const { compact = false, clickable = false, onClick = null } = options;
const sorted = sortSigils(sigils);
const count = sorted.length;

// Calculate row distribution
let row1Count, row2Count;
if (count <= 3) {
row1Count = count;
row2Count = 0;
} else if (count === 4) {
row1Count = 2;
row2Count = 2;
} else {
row1Count = Math.ceil(count / 2);
row2Count = count - row1Count;
}

const row1Sigils = sorted.slice(0, row1Count);
const row2Sigils = sorted.slice(row1Count);

// Determine if we need compact sizing for many sigils
const needsCompact = compact || count >= 7;
const sigilClass = needsCompact ? 'sigil-row compact' : 'sigil-row';

const renderSigil = (s) => {
const sigName = typeof s === 'string' ? s : s.sig;
const lvl = typeof heroIdx === 'number' ? getLevel(sigName, heroIdx) : (typeof s === 'object' && s.level !== undefined ? s.level : 1);
const cl = lvl===0?'l0':lvl===1?'l1':lvl===2?'l2':lvl===3?'l3':lvl===4?'l4':'l5';
const passiveClass = ['Expand', 'Asterisk', 'Star'].includes(sigName) ? 'passive' : '';
const clickableClass = clickable ? 'clickable' : '';
const clickHandler = onClick ? `onclick="${onClick}('${sigName}')"` : '';
const ariaRole = clickable || onClick ? 'role="button" tabindex="0"' : '';
const ariaLabel = `aria-label="${sigName} level ${lvl}"`;
return `<span class="sigil ${cl} ${passiveClass} ${clickableClass}" ${ariaRole} ${ariaLabel} ${clickHandler} onmouseenter="showTooltip('${sigName}', this, ${lvl})" onmouseleave="hideTooltip()" ontouchstart="tooltipTimeout = setTimeout(() => showTooltip('${sigName}', this, ${lvl}), ANIMATION_TIMINGS.TOOLTIP_DELAY)" ontouchend="hideTooltip()">${sigilIconOnly(sigName, lvl)}</span>`;
};

let html = `<div class="${sigilClass}">`;
row1Sigils.forEach(s => html += renderSigil(s));
html += '</div>';

if (row2Sigils.length > 0) {
html += `<div class="${sigilClass}">`;
row2Sigils.forEach(s => html += renderSigil(s));
html += '</div>';
}

return html;
}

// ===== UTILITY FUNCTIONS =====
// Unified dice rolling utility
function rollDice(count, sides = 20) {
// Play dice roll sound for D20s
if(sides === 20) SoundFX.play('d20roll');

// Debug mode: Oops All 20s
if(S.oopsAll20s && sides === 20) {
const rolls = Array(count).fill(20);
SoundFX.play('nat20');
return {rolls, best: 20};
}
const rolls = [];
for(let i = 0; i < count; i++) {
rolls.push(Math.ceil(Math.random() * sides));
}
const best = Math.max(...rolls);
const worst = Math.min(...rolls);

// Play special sounds for nat 20 and nat 1
if(sides === 20) {
if(best === 20) {
  setTimeout(() => SoundFX.play('nat20'), 350); // After dice roll sound
} else if(worst === 1 && best < 10) {
  setTimeout(() => SoundFX.play('nat1'), 350); // Sad trombone for bad rolls with a 1
}
}
return {rolls, best};
}

// Get display name for enemy with A, B, C suffix if there are duplicates
// Adds "FU " prefix in Frogged Up mode
function getEnemyDisplayName(enemy) {
if (!enemy || !S.enemies) return enemy?.n || '';
const prefix = S.gameMode === 'fu' ? 'FU ' : '';
// Count enemies with same base name
const sameName = S.enemies.filter(e => e.n === enemy.n);
if (sameName.length <= 1) return prefix + enemy.n;
// Find position of this enemy among same-named enemies
const index = sameName.findIndex(e => e.id === enemy.id);
if (index === -1) return prefix + enemy.n;
// Add suffix: A, B, C, etc.
const suffix = String.fromCharCode(65 + index); // 65 = 'A'
return `${prefix}${enemy.n} ${suffix}`;
}

// Helper for enemy attacks - handles targeting, damage, animations, and toast
function executeEnemyAttackOnHeroes(enemy, targetCount, attackName = 'Base Attack') {
// JUICE: Enemy attack slide animation (charges toward heroes)
triggerEnemyAttackAnimation(enemy.id);

const targets = selectEnemyTargets(enemy, targetCount);
if(targets.length === 0) return 0;

const damagedIds = [];
const targetDetails = [];
const dmg = enemy.p;
targets.forEach(target => {
if(target.h > 0) {
const hpBefore = target.h;
const shBefore = target.sh || 0;
damagedIds.push(target.id);
// Apply damage silently (we'll show one toast for all targets)
const result = applyDamageToTarget(target, dmg, {isHero: true, silent: true});
const hpAfter = target.h;
const shAfter = target.sh || 0;
targetDetails.push({name: target.n, hpBefore, hpAfter, shBefore, shAfter, shieldLost: result.shieldLost, hpLost: result.hpLost, dmg: dmg});
}
});

// Trigger hit animations when enemy "lands" the hit
setTimeout(() => {
damagedIds.forEach((id, idx) => {
triggerHitAnimation(id);
// JUICE: Floating damage numbers for hero damage
showFloatingNumber(id, `-${dmg}`, dmg >= 5 ? 'critical' : 'damage', idx * 15);
// Show pained reaction when hero takes damage
const hero = S.heroes.find(h => h.id === id);
if(hero) setHeroReaction(id, 'pained', hero.ls ? 0 : 600);
});

// JUICE: Sinister sound for enemy attacks on heroes + screen shake
if(damagedIds.length > 0) {
SoundFX.play(dmg >= 5 ? 'enemyCrit' : 'enemyHit');
triggerScreenShake(dmg >= 5); // Heavy shake for big hits
}
}, ANIMATION_TIMINGS.ATTACK_IMPACT);

if(targetDetails.length > 0) {
const targetStrings = targetDetails.map(t => {
let str = `${t.name} (`;
if(t.shieldLost > 0) str += `🛡${t.shBefore}→🛡${t.shAfter} `;
str += `❤${t.hpBefore}→❤${t.hpAfter})`;
return str;
});
toast(`${getEnemyDisplayName(enemy)}'s ${attackName} hit ${targetStrings.join(', ')}!`);
}

return targets.length;
}

// ===== RENDER HELPERS =====
// Render encampment enemy selection screen
function renderEncampmentSelection() {
const kills = S.encampmentEarlyKills;
const selected = S.encampmentSelectedTargets.length;
let html = '<div class="combat-header">';
html += `<div class="combat-header-title">Encampment Early Kill</div>`;
html += `<div class="combat-header-subtitle">Click ${kills} enem${kills>1?'ies':'y'} to remove before combat (${selected}/${kills} selected)</div>`;
html += '</div>';
html += '<div class="combat-grid">';
html += '<div class="column heroes">';
html += '<div class="section-label">HEROES</div>';
S.heroes.forEach((h,i) => {
const hp = h.ls ? `Last Stand (T${h.lst+1})` : `${h.h}/${h.m}❤`;
const extra = [];
if(h.sh > 0) extra.push(`${h.sh}🛡`);
if(h.g > 0) extra.push(`${h.g}${sigilIconOnly('Ghost')}`);
const heroImage = getHeroImage(h);
html += `<div class="card hero">
<div style="font-weight:bold;text-align:center;margin-bottom:0.25rem">${h.n}</div>
${heroImage ? `<img src="${heroImage}" alt="${h.n}" class="card-image">` : ''}
<div class="sigil-divider"></div>`;
const activeSigils = [...h.s, ...(h.ts || [])];
html += renderSigilRows(activeSigils, i);
html += `<div class="card-stats">${h.p}💥 | ${hp}${extra.length>0?' | '+extra.join(' '):''}</div>`;
html += '</div>';
});
html += '</div>';
html += '<div class="column enemies">';
html += '<div class="section-label">ENEMIES</div>';
const enemyLanes = {};
S.enemies.forEach(e => { if(!enemyLanes[e.li]) enemyLanes[e.li] = []; enemyLanes[e.li].push(e); });
S.heroes.forEach((hero, laneIdx) => {
const laneEnemies = enemyLanes[laneIdx] || [];
html += `<div class="combat-lane" data-lane="${laneIdx+1}">`;
if(laneEnemies.length === 0) {
html += `<div class="empty-slot">Empty</div>`;
} else {
laneEnemies.forEach(e => {
const isSelected = S.encampmentSelectedTargets.includes(e.id);
let cardClasses = 'card enemy targetable';
if(isSelected) cardClasses += ' targeted';
const extra = [];
if(e.sh > 0) extra.push(`${e.sh}🛡`);
if(e.g > 0) extra.push(`${e.g}${sigilIconOnly('Ghost')}`);
if(isSelected) extra.push('❌');
const enemyEmoji = ENEMY_EMOJI[e.n] || '👾';
const enemyImageSrc = ENEMY_IMAGES[e.n];
html += `<div class="${cardClasses}" onclick="selectEncampmentTarget('${e.id}')">`;
if(enemyImageSrc) {
html += `<div class="card-emoji"><img src="${enemyImageSrc}" alt="${e.n}" style="width:40px;height:40px;object-fit:contain;border-radius:4px"></div>`;
} else {
html += `<div class="card-emoji">${enemyEmoji}</div>`;
}
html += `<div style="font-weight:bold;text-align:center;margin-bottom:0.25rem">${getEnemyDisplayName(e)}</div>
<div class="card-stats">${e.p}💥 | ${e.h}/${e.m}❤${extra.length>0?' | '+extra.join(' '):''}</div>
<div class="sigil-divider"></div>
<div class="sigil-row">`;
const hasAttackSigil = e.s.some(s => s.sig === 'Attack');
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
html += '</div>';
});
html += '</div></div>';
if(selected >= kills) {
html += '<button class="btn danger" style="margin-top:1rem" onclick="confirmEncampmentKills()">Confirm Removals</button>';
}
return html;
}

// Render combat status header
function renderCombatStatusHeader() {
let html = '<div class="combat-header">';
if(S.turn!=='player') {
if(S.enemyTurnTotal && S.enemyTurnCurrent) {
html += `<div class="combat-header-title">Enemy Turn</div>`;
html += `<div class="combat-header-subtitle">Enemy ${S.enemyTurnCurrent}/${S.enemyTurnTotal} acting…</div>`;
} else {
html += 'Enemy Turn…';
}
} else if(S.pending === 'D20_TARGET') {
const heroIdx = S.d20HeroIdx;
const maxTargets = 1 + getLevel('Expand', heroIdx);
const selected = S.targets.length;
html += `<div class="combat-header-title">${S.d20Action} (DC ${S.d20DC})</div>`;
const targetText = maxTargets >= 2 ? `targets: ${selected}/${maxTargets}` : 'Select target';
html += `<div class="combat-header-subtitle">${targetText}</div>`;
} else if(S.pending) {
const targetsPerInstance = getTargetsPerInstance(S.pending, S.activeIdx);
const targetType = needsEnemyTarget(S.pending) ? 'enemy' : 'hero';
if(isMultiInstance(S.pending)) {
const targetsInInstance = S.currentInstanceTargets.length;
html += `<div class="combat-header-title">${S.pending}</div>`;
const targetText = targetsPerInstance >= 2 ? `targets: ${targetsInInstance}/${targetsPerInstance}` : `Select ${targetType}`;
html += `<div class="combat-header-subtitle">${targetText}</div>`;
html += `<div class="combat-header-info">${S.instancesRemaining} instance${S.instancesRemaining>1?'s':''} remaining</div>`;
} else {
const selected = S.targets.length;
const max = targetsPerInstance;
html += `<div class="combat-header-title">${S.pending}</div>`;
const targetText = max >= 2 ? `targets: ${selected}/${max}` : `Select ${targetType}`;
html += `<div class="combat-header-subtitle">${targetText}</div>`;
}
} else if(S.activeIdx === -1) {
const remaining = S.heroes.filter((h,i) => !S.acted.includes(i) && h.st === 0).length;
const allStunned = remaining === 0 && S.heroes.every(h => h.st > 0);
if(allStunned) {
html += `<div class="combat-header-title" style="color:#f97316">⚠️ AMBUSH! ⚠️</div>`;
html += `<div class="combat-header-subtitle" style="opacity:0.9">All heroes are stunned!</div>`;
html += `<button class="btn" onclick="confirmAmbushSkip()" style="margin-top:0.5rem;padding:0.5rem 1.5rem">Continue to Enemy Turn</button>`;
} else {
html += `<div class="combat-header-title pulse-prompt">Tap a hero's sigil</div>`;
html += `<div class="combat-header-subtitle" style="opacity:0.8">${remaining} hero${remaining>1?'es':''} remaining</div>`;
}
} else {
const h = S.heroes[S.activeIdx];
if(h) {
if(h.ls) html += `${h.n} Last Stand (Turn ${h.lst + 1}) - D20 only!`;
else html += `${h.n}'s Turn`;
}
}
html += '</div>';

// Add action bar when we have targets selected - simplified for controller flow
// D20_TARGET uses S.targets, other actions use S.currentInstanceTargets
const hasTargetsForActionBar = S.pending === 'D20_TARGET'
? (S.targets && S.targets.length > 0)
: (S.currentInstanceTargets && S.currentInstanceTargets.length > 0);
if(S.turn === 'player' && S.pending && hasTargetsForActionBar) {
const targetArray = S.pending === 'D20_TARGET' ? S.targets : S.currentInstanceTargets;
const targetCount = targetArray.length;
const targetNames = targetArray.map(t => {
const unit = [...(S.heroes || []), ...(S.enemies || [])].find(u => u.id === t);
return unit ? unit.n : 'target';
}).join(', ');
html += '<div class="target-action-bar" style="display:flex;flex-direction:column;gap:0.25rem;align-items:center;margin-top:0.5rem">';
html += `<div style="font-size:0.85rem;opacity:0.9">Target${targetCount > 1 ? 's' : ''}: <strong>${targetNames}</strong></div>`;
html += '<div style="display:flex;gap:0.5rem">';
html += `<button class="btn safe" onclick="confirmTargets()" style="padding:0.4rem 1rem;font-size:0.9rem">✓ Confirm (Ⓐ/⊡)</button>`;
html += `<button class="btn secondary" onclick="cancelAction()" style="padding:0.4rem 1rem;font-size:0.9rem">✗ Cancel (Ⓑ)</button>`;
html += '</div>';
html += '</div>';
}

return html;
}

// Unified damage application with shield/ghost/laststand handling
function applyDamageToTarget(target, rawDamage, options = {}) {
let dmg = rawDamage;
let shieldLost = 0;
let hpLost = 0;

// Handle shield absorption
if(target.sh > 0) {
if(target.sh >= rawDamage) {
shieldLost = rawDamage;
target.sh -= rawDamage;
dmg = 0;
} else {
shieldLost = target.sh;
dmg = rawDamage - target.sh;
target.sh = 0;
}
}

// Apply damage to HP
hpLost = dmg;
target.h -= dmg;

// LAYER 1: Warning when hero drops below 30% HP (preventive Last Stand warning)
// Skip during tutorial - Tapo intervention handles this without explaining Last Stand
if(options.isHero && !target.ls && target.h > 0 && target.h < target.m * 0.3) {
// Check if this is the first time we're warning about low HP (and not in tutorial)
if(!S.tutorialFlags.last_stand_warning && !(tutorialState && S.floor === 0)) {
showTutorialPop('last_stand_warning', `${target.n} is in danger! If they reach 0 HP, they'll enter Last Stand mode - they can only use D20 gambits, and each turn makes survival harder. Use Ghost charges or heal up to avoid it!`);
}
}

// Handle lethal damage
if(target.h <= 0) {
if(target.g > 0) {
// Ghost charge cancels death
target.g--;
target.h += dmg;
hpLost = 0; // Ghost prevented the HP loss
// QUEST TRACKING: Ghost blocked damage
if(options.isHero && typeof trackQuestProgress === 'function') trackQuestProgress('ghostBlock');
if(!options.silent) {
toast(`${target.n}'s Ghost charge cancelled the lethal hit!`, 1200);
}
} else {
// Death/Last Stand
target.h = 0;
if(options.isHero) {
// TUTORIAL PHASE 1: Override Last Stand with Tapo rescue
// IMPORTANT: Only trigger during ENEMY turn, not player turn (e.g., Grapple recoil)
if(tutorialState && S.floor === 0 && tutorialState.phase === 1 && S.turn === 'enemy') {
// Tapo saves the day! Prevent actual death
target.h = 1;
// Show the full Tapo rescue sequence with narrative and animated fly deaths
if(typeof showTapoRescueSequence === 'function') {
showTapoRescueSequence();
}
return {hpLost: 0, shieldLost, totalDamage: rawDamage};
}
// Heroes enter Last Stand
target.ls = true;
target.lst = 0;
triggerScreenShake(true); // Heavy shake on entering last stand
if(!options.silent) {
// LAYER 2: Extended toast duration (3000ms instead of default)
toast(`${target.n} entered Last Stand!`, 3000);
// Skip Last Stand explanation during tutorial - Tapo intervention prevents it
if(!(tutorialState && S.floor === 0)) {
showTutorialPop('last_stand_intro', "When a hero drops to 0 HP, they enter Last Stand! They can only use D20 gambits, and each turn makes success harder. Heal them to bring them back!");
}
}
} else {
// Enemies die - award gold/XP and schedule removal
// Skip rewards for Floor 0 tutorial
if(!options.skipRewards && S.floor !== 0) {
// FLYDRA: Skip gold on head "death" - heads can revive! Gold awarded at combat completion
if(!target.isFlydra) {
S.gold += target.goldDrop || 0;
S.combatGold += target.goldDrop || 0;
// QUEST TRACKING: Gold earned
if(target.goldDrop > 0 && typeof trackQuestProgress === 'function') trackQuestProgress('gold', target.goldDrop);
// JUICE: Coin sound for gold drops
if(target.goldDrop > 0) SoundFX.play('coinDrop');
}
// XP is fine to award per head (player can't spend it after victory anyway)
S.combatXP += target.x;
upd();
}
}
}
}

return {hpLost, shieldLost, totalDamage: rawDamage}; // Return detailed breakdown
}

// ===== TUTORIAL SYSTEM =====
// Centralized Tutorial Manager for Ribbleton combat tutorial
const TutorialManager = {
// Tutorial stage definitions
stages: {
// Phase 1 stages
'waiting_for_start': {allowedActions: []},
'catching_flies': {allowedActions: 'ALL'}, // Phase 1: Free-form fly catching
// Phase 2 stages
'warrior_attack': {allowedActions: [{hero: 'Warrior', sig: 'Attack'}]},
'targeting_wolf': {allowedActions: [{hero: 'Warrior', sig: 'Attack'}]},
'healer_d20': {allowedActions: [{hero: 'Healer', sig: 'D20'}]},
'd20_menu': {allowedActions: [{hero: 'Healer', sig: 'D20'}]},
'enemy_turn_wait': {allowedActions: []},
'enemy_turn_explained': {allowedActions: []},
'healer_heal': {allowedActions: [{hero: 'Healer', sig: 'Heal'}]},
'expand_targets': {allowedActions: [{hero: 'Healer', sig: 'Heal'}]},
'finish_wolf': {allowedActions: [{hero: 'Warrior', sig: 'Attack'}]},
'shield_sigil': {allowedActions: []},
'free': {allowedActions: 'ALL'} // Tutorial complete, allow all actions
},

// Check if an action is allowed in current tutorial stage
canPerformAction(hero, sig) {
if(!tutorialState || S.floor !== 0) return true; // Not in tutorial
const stage = this.stages[tutorialState.stage];
if(!stage) return true; // Unknown stage, allow
if(stage.allowedActions === 'ALL') return true; // Free-form stage

const allowed = stage.allowedActions;
if(allowed.length === 0) return false; // No actions allowed in this stage

return allowed.some(a => a.hero === hero.n && a.sig === sig);
},

// Get descriptive message for current tutorial stage
getInstructionMessage() {
if(!tutorialState || S.floor !== 0) return "Follow the tutorial instructions!";
const stage = tutorialState.stage;

// Stage-specific messages
const messages = {
'waiting_for_start': "Wait for the tutorial to begin!",
'warrior_attack': "Click the Warrior's Attack sigil, then target the Wolf!",
'targeting_wolf': "Click the Wolf to target it with your Attack!",
'healer_d20': "Click the Healer's D20 for powerful gambit actions!",
'd20_menu': "Select a D20 gambit option!",
'enemy_turn_wait': "Wait for the enemy turn to complete!",
'enemy_turn_explained': "Wait for the next round to begin!",
'healer_heal': "Click the Healer's Heal sigil!",
'expand_targets': "Select targets for your Heal with Expand!",
'finish_wolf': "Use your abilities to defeat the remaining enemies!",
'shield_sigil': "Wait and watch what happens!"
};

return messages[stage] || "Follow the tutorial instructions!";
},

// Advance to next stage based on action completion
advanceStage(context) {
if(!tutorialState || S.floor !== 0) return;

const {action, hero, round} = context;

// Stage transitions based on completed actions
if((tutorialState.stage === 'warrior_attack' || tutorialState.stage === 'targeting_wolf') && tutorialState.wolfDamaged && hero === 'Warrior' && round === 1) {
tutorialState.stage = 'healer_d20';
showTutorialPop('ribbleton_healer_d20', "Healer doesn't start with the Attack Sigil, but they can still do some damage with a Gambit - a powerful action that depends on a die roll! Click the Healer's D20!", () => {
S.activeIdx = 1;
render();
});
}
else if(tutorialState.stage === 'd20_menu' && hero === 'Healer') {
tutorialState.stage = 'enemy_turn_wait';
}
else if(tutorialState.stage === 'expand_targets' && hero === 'Healer') {
tutorialState.stage = 'finish_wolf';
// REMOVED: "Finish Wolf" popup - trust player to continue combat after heal
}
},

// Handle round transitions during tutorial
onRoundStart(round) {
if(!tutorialState || S.floor !== 0) return;

debugLog('[TUTORIAL] Round transition - Round:', round, 'Stage:', tutorialState.stage);

// PHASE 1 (Fly Catching): Round 2 - Mage already has Expand, just continue
if(tutorialState.phase === 1 && round === 2) {
debugLog('[TUTORIAL] Phase 1 Round 2 - Continuing combat (Mage already has Expand)');
S.turn = 'player';
S.activeIdx = -1;
S.acted = [];
S.locked = false;
upd();
render();
return;
}

// PHASE 2 (Ribbleton): Round 2: Healer Heal prompt (NOW BATCHED WITH EXPAND)
if(round === 2 && (tutorialState.stage === 'enemy_turn_explained' || tutorialState.stage === 'finish_wolf') && !S.tutorialFlags.ribbleton_healer_heal) {
debugLog('[TUTORIAL] Triggering PROMPT 4 - Healer Heal (stage:', tutorialState.stage, ')');
S.turn = 'player';
S.activeIdx = -1;
S.acted = [];
S.locked = false;
tutorialState.stage = 'healer_heal';
upd();
// Show healing prompt popup
showTutorialPop('ribbleton_healer_heal', "Yikes! Both of you took some damage - but Healer knows what she's doing! Tap her Heal sigil!", () => {
S.activeIdx = 1;
render();
});
} else if(round === 2 && !S.tutorialFlags.ribbleton_healer_heal) {
debugLog('[TUTORIAL] Round 2 but stage is:', tutorialState.stage, '(expected: enemy_turn_explained or finish_wolf) - forcing healer_heal anyway');
S.turn = 'player';
S.activeIdx = -1;
S.acted = [];
S.locked = false;
tutorialState.stage = 'healer_heal';
upd();
// Show healing prompt popup
showTutorialPop('ribbleton_healer_heal', "Yikes! Both of you took some damage - but Healer knows what she's doing! Tap her Heal sigil!", () => {
S.activeIdx = 1;
render();
});
}
// Round 3: Force Goblin to draw Shield, then PROMPT 5 (Enemy Sigils batched) + PROMPT 6 (Tooltip + Handoff batched)
else if(round === 3 && tutorialState.stage === 'finish_wolf') {
// Force Goblin to draw Shield
const goblin = S.enemies.find(e => e.n === 'Goblin');
if(goblin && !goblin.s.some(s => s.sig === 'Shield')) {
goblin.s.push({sig:'Shield', level:1, perm:false});
toast('Goblin drew Shield L1!');
}
S.turn = 'player';
S.activeIdx = -1;
S.acted = [];
S.locked = false;
tutorialState.stage = 'shield_sigil';
upd();
render();
// PROMPT 5: Enemy Sigils + Shield
showTutorialPop('enemies_get_sigils', "Enemies draw sigils too! The Goblin drew Shield - he'll activate it AFTER attacking this turn, then it's gone. Try to defeat him before he can shield!", () => {
// Player can now act freely - handoff popup will show after they take an action
tutorialState.stage = 'free';
render();
});
}
},

// Handle enemy turn during tutorial - returns true if we're blocking for a popup
onEnemyTurnStart(onContinue) {
if(!tutorialState || S.floor !== 0) return false;
if(tutorialState.stage === 'enemy_turn_wait') {
S.locked = true;
tutorialState.stage = 'enemy_turn_explained';
showTutorialPop('ribbleton_enemy_turn', "Nice gambit! Both enemies hurt themselves! But the enemies are about to attack back...", () => {
S.locked = false;
if(onContinue) onContinue(); // Continue to enemy turn after popup
});
return true; // Blocking - don't start enemy turn yet
}
return false;
}
};

// Tutorial system
let tooltipTimeout = null;
let currentTooltip = null;

// Get level-specific description with colored/bolded numbers
function getLevelDescription(sigilName, level) {
const levelColors = {
0: '#666',
1: '#000',
2: '#06b6d4',
3: '#9333ea',
4: '#d97706',
5: '#ff0080'
};
const color = levelColors[level] || '#000';
const boldNum = (num) => `<strong style="color:${color}">${num}</strong>`;

// Level-specific descriptions
const descriptions = {
'Attack': level === 0 ? 'Not unlocked' : level === 1 ? 'Deal POW damage to target' : `Attack ${boldNum(level)} times for POW damage each`,
'Shield': level === 0 ? 'Not unlocked' : level === 1 ? 'Grant target 2×POW shield (persists between battles, capped at max HP)' : `Shield ${boldNum(level)} times for 2×POW each (persists between battles, capped at max HP)`,
'Heal': level === 0 ? 'Not unlocked' : level === 1 ? 'Restore 2×POW HP to target (cannot exceed max HP)' : `Heal ${boldNum(level)} times for 2×POW each (cannot exceed max HP)`,
'D20': `Roll ${boldNum(level)}d20, use best result. Choose gambit: Confuse (enemy hurts itself), Startle (stun), Mend (heal self), Steal (gold), Recruit (join team)`,
'Expand': level === 0 ? 'PASSIVE: Add +1 target to multi-target actions (Attack, Shield, Heal, Alpha, Grapple). Mage/Healer get +1 built-in' : `PASSIVE: Permanently add ${boldNum(level)} extra target${level > 1 ? 's' : ''} to multi-target actions (Attack, Shield, Heal, Alpha, Grapple). Mage/Healer get +1 built-in`,
'Grapple': level === 0 ? 'Not unlocked' : `Stun target for ${boldNum(level)} turn${level > 1 ? 's' : ''}. You take damage equal to target's POW`,
'Ghost': level === 0 ? 'Not unlocked' : `Gain ${boldNum(level)} charge${level > 1 ? 's' : ''}. Each charge prevents one death (persists between combats, max 9)`,
'Asterisk': level === 0 ? 'Not unlocked' : `PASSIVE: Next action triggers ${boldNum(level + 1)} times! Resets after each battle`,
'Star': level === 0 ? 'PASSIVE: Not unlocked' : `PASSIVE: Gain ${boldNum(level * 0.5)}× extra XP per battle (stacks with other heroes)`,
'Alpha': level === 0 ? 'Not unlocked' : `Grant target hero ${boldNum(level)} extra action${level > 1 ? 's' : ''} this turn`
};

return descriptions[sigilName] || 'No description available';
}

function showTooltip(sigilName, element, level = 1) {
// Check if tooltips are disabled
if(S.tooltipsDisabled) return;

// Tooltip display (tutorial explanation happens in Ribbleton combat)

const desc = getLevelDescription(sigilName, level);
if(!desc) return;

hideTooltip();

const tooltip = document.createElement('div');
tooltip.className = 'tooltip tooltip-green';
tooltip.innerHTML = `
<div class="tooltip-title">${sigilIcon(sigilName)}</div>
<div class="tooltip-desc">${desc}</div>`;

document.body.appendChild(tooltip);
currentTooltip = tooltip;

// Position tooltip near the element
const rect = element.getBoundingClientRect();
const tooltipRect = tooltip.getBoundingClientRect();
let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
let top = rect.top - tooltipRect.height - 10;

// Keep tooltip on screen horizontally
if(left < 10) left = 10;
if(left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;

// Keep tooltip on screen vertically - prefer above, fallback to below
if(top < 10) {
top = rect.bottom + 10;
}
// If tooltip would go off bottom of screen, try above again or clamp
if(top + tooltipRect.height > window.innerHeight - 10) {
// Try putting it above
const aboveTop = rect.top - tooltipRect.height - 10;
if(aboveTop >= 10) {
top = aboveTop;
} else {
// Clamp to bottom of screen
top = window.innerHeight - tooltipRect.height - 10;
}
}

tooltip.style.left = left + 'px';
tooltip.style.top = top + 'px';

setTimeout(() => tooltip.classList.add('show'), 10);
}

function hideTooltip() {
// Clear any pending tooltip timers
if(tooltipTimeout) {
clearTimeout(tooltipTimeout);
tooltipTimeout = null;
}
// Immediately remove current tooltip
if(currentTooltip) {
currentTooltip.remove();
currentTooltip = null;
}
}

// Damage preview calculation - shows expected damage breakdown on hover
function calcDamagePreview(heroIdx, targetId) {
const h = S.heroes[heroIdx];
const target = S.enemies.find(e => e.id === targetId);
if(!h || !target) return null;

const attackLevel = getLevel('Attack', heroIdx);
const damagePerHit = h.p; // POW damage per hit
const hitsRemaining = S.instancesRemaining || attackLevel; // Instances left
const totalDamage = damagePerHit; // Single instance damage

// Calculate shield absorption
let shieldDmg = 0;
let hpDmg = 0;
if(target.sh > 0) {
if(target.sh >= totalDamage) {
shieldDmg = totalDamage;
hpDmg = 0;
} else {
shieldDmg = target.sh;
hpDmg = totalDamage - target.sh;
}
} else {
hpDmg = totalDamage;
}

return { totalDamage, shieldDmg, hpDmg, hitsRemaining, targetHp: target.h, targetSh: target.sh };
}

// Show damage preview tooltip on enemy hover during targeting
// DISABLED: Players can do the math themselves
let currentDmgPreview = null;
function showDamagePreview(targetId, element) {
return; // Disabled per user request
if(!S.pending || S.pending !== 'Attack' || S.activeIdx < 0) return;
hideDamagePreview();

const preview = calcDamagePreview(S.activeIdx, targetId);
if(!preview) return;

const tooltip = document.createElement('div');
tooltip.className = 'damage-preview';

let content = `<div class="dmg-total">-${preview.totalDamage}</div>`;
if(preview.shieldDmg > 0) {
content += `<div class="dmg-shield">-${preview.shieldDmg} shield</div>`;
}
if(preview.hpDmg > 0) {
content += `<div class="dmg-hp">-${preview.hpDmg} HP</div>`;
} else if(preview.shieldDmg > 0) {
content += `<div class="dmg-blocked">Blocked!</div>`;
}

tooltip.innerHTML = content;
document.body.appendChild(tooltip);
currentDmgPreview = tooltip;

// Position near element
const rect = element.getBoundingClientRect();
const tooltipRect = tooltip.getBoundingClientRect();
let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
let top = rect.top - tooltipRect.height - 8;

// Keep on screen
if(left < 5) left = 5;
if(left + tooltipRect.width > window.innerWidth - 5) left = window.innerWidth - tooltipRect.width - 5;
if(top < 5) top = rect.bottom + 8;

tooltip.style.left = left + 'px';
tooltip.style.top = top + 'px';
setTimeout(() => tooltip.classList.add('show'), 10);
}

function hideDamagePreview() {
if(currentDmgPreview) {
currentDmgPreview.remove();
currentDmgPreview = null;
}
}

// Heal preview calculation - shows expected heal breakdown on hover
function calcHealPreview(heroIdx, targetId) {
const h = S.heroes[heroIdx];
const target = S.heroes.find(hero => hero.id === targetId);
if(!h || !target) return null;

const healPerInstance = h.p * 2; // Heal is 2×POW
const currentHp = target.h;
const maxHp = target.m;
const actualHeal = Math.min(healPerInstance, maxHp - currentHp);
const overHeal = healPerInstance - actualHeal;

return { totalHeal: healPerInstance, actualHeal, overHeal, targetHp: currentHp, targetMaxHp: maxHp };
}

// Show heal preview tooltip on hero hover during targeting
// DISABLED: Players can do the math themselves
let currentHealPreview = null;
function showHealPreview(targetId, element) {
return; // Disabled per user request
if(!S.pending || S.pending !== 'Heal' || S.activeIdx < 0) return;
hideHealPreview();

const preview = calcHealPreview(S.activeIdx, targetId);
if(!preview) return;

const tooltip = document.createElement('div');
tooltip.className = 'heal-preview';

let content = `<div class="heal-total">+${preview.actualHeal}</div>`;
if(preview.targetHp === preview.targetMaxHp) {
content += `<div class="heal-full">Already full!</div>`;
}

tooltip.innerHTML = content;
document.body.appendChild(tooltip);
currentHealPreview = tooltip;

// Position near element
const rect = element.getBoundingClientRect();
const tooltipRect = tooltip.getBoundingClientRect();
let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
let top = rect.top - tooltipRect.height - 8;

// Keep on screen
if(left < 5) left = 5;
if(left + tooltipRect.width > window.innerWidth - 5) left = window.innerWidth - tooltipRect.width - 5;
if(top < 5) top = rect.bottom + 8;

tooltip.style.left = left + 'px';
tooltip.style.top = top + 'px';
setTimeout(() => tooltip.classList.add('show'), 10);
}

function hideHealPreview() {
if(currentHealPreview) {
currentHealPreview.remove();
currentHealPreview = null;
}
}

// Shield preview calculation - shows expected shield breakdown on hover
function calcShieldPreview(heroIdx, targetId) {
const h = S.heroes[heroIdx];
const target = S.heroes.find(hero => hero.id === targetId);
if(!h || !target) return null;

const shieldPerInstance = h.p * 2; // Shield is 2×POW
const currentShield = target.sh || 0;
const maxHp = target.m;
const maxShieldSpace = Math.max(0, maxHp - currentShield);
const actualShield = Math.min(shieldPerInstance, maxShieldSpace);
const overShield = shieldPerInstance - actualShield;

return { totalShield: shieldPerInstance, actualShield, overShield, currentShield, targetMaxHp: maxHp };
}

// Show shield preview tooltip on hero hover during targeting
// DISABLED: Players can do the math themselves
let currentShieldPreview = null;
function showShieldPreview(targetId, element) {
return; // Disabled per user request
if(!S.pending || S.pending !== 'Shield' || S.activeIdx < 0) return;
hideShieldPreview();

const preview = calcShieldPreview(S.activeIdx, targetId);
if(!preview) return;

const tooltip = document.createElement('div');
tooltip.className = 'shield-preview';

let content = `<div class="shield-total">+${preview.actualShield}🛡</div>`;
if(preview.overShield > 0) {
content += `<div class="shield-capped">+${preview.overShield} capped</div>`;
} else if(preview.currentShield >= preview.targetMaxHp) {
content += `<div class="shield-full">Shield maxed!</div>`;
}

tooltip.innerHTML = content;
document.body.appendChild(tooltip);
currentShieldPreview = tooltip;

// Position near element
const rect = element.getBoundingClientRect();
const tooltipRect = tooltip.getBoundingClientRect();
let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
let top = rect.top - tooltipRect.height - 8;

// Keep on screen
if(left < 5) left = 5;
if(left + tooltipRect.width > window.innerWidth - 5) left = window.innerWidth - tooltipRect.width - 5;
if(top < 5) top = rect.bottom + 8;

tooltip.style.left = left + 'px';
tooltip.style.top = top + 'px';
setTimeout(() => tooltip.classList.add('show'), 10);
}

function hideShieldPreview() {
if(currentShieldPreview) {
currentShieldPreview.remove();
currentShieldPreview = null;
}
}

// Helper to create sigil with tooltip (for death screen with longer hover time)
function sigilIconWithTooltip(sig, level = 1, hoverDelay = 500) {
return `<span onmouseenter="showTooltip('${sig}', this, ${level})" onmouseleave="hideTooltip()" ontouchstart="tooltipTimeout = setTimeout(() => showTooltip('${sig}', this, ${level}), ${hoverDelay})" ontouchend="hideTooltip()">${sigilIcon(sig)}</span>`;
}

function generateFibonacci(n) {
const fib = [1, 1];
for(let i = 2; i < n; i++) fib.push(fib[i-1] + fib[i-2]);
return fib;
}
const FIB = generateFibonacci(50);

// Get XP cost for level up - Fibonacci up to 89, then 100, 200, 300, etc.
function getXPCost(levelUpCount) {
// Find the index where Fibonacci reaches 89 (FIB[10] = 89)
if (levelUpCount >= 10) {
// After Fibonacci 89, increment by 100 each time
// levelUpCount 10 = 100, levelUpCount 11 = 200, levelUpCount 12 = 300, etc.
return (levelUpCount - 9) * 100;
}
return FIB[levelUpCount] || 100;
}

// ===== ANIMATION TIMING CONSTANTS =====
// Centralized timing values for easy tuning and consistency
const ANIMATION_TIMINGS = {
  // CSS animation durations (must match CSS @keyframes)
  DAMAGE_FLASH: 400,      // .hit-flash animation duration
  ATTACK_SLIDE: 480,      // .attack-slide animation duration
  ATTACK_IMPACT: 190,     // When attacker "lands" hit (40% of attack slide)
  HEAL_FLASH: 480,        // .heal-flash animation duration
  SHIELD_FLASH: 480,      // .shield-flash animation duration

  // Screen transition timings
  FADE_TRANSITION: 200,   // Screen fade in/out duration
  FLOOR_INTERSTITIAL: 2000, // Floor name display duration

  // Combat turn timings
  TURN_TRANSITION: 400,   // Hero turn → Enemy turn delay
  PHASE_TRANSITION: 300,  // Between enemy phases (Alpha/Recruit/Normal)
  ALPHA_PHASE_START: 500, // Enemy turn start → Alpha phase
  ENEMY_ACTION_DELAY: 400, // Stagger between enemy actions (slower for readability)
  ENEMY_TURN_END: 400,    // After last enemy action
  ACTION_COMPLETE: 600,   // After hero action completes

  // Toast message timings
  TOAST_SHORT: 1800,      // Short notification
  TOAST_MEDIUM: 2400,     // Medium notification
  TOAST_LONG: 3000,       // Long notification
  TOAST_FADE: 400,        // Toast fade out duration

  // Tooltip timings
  TOOLTIP_DELAY: 500,     // Long-press delay for mobile tooltips
  TOOLTIP_FADE: 200,      // Tooltip fade in/out

  // Special animations
  BONUS_TURN_STACK: 300,  // Bonus turn card animation
  VICTORY_DELAY: 1000,    // Delay before level up screen
  DEFEAT_DELAY: 1000,     // Delay before death screen
  TUTORIAL_DELAY: 800,    // Tutorial popup delays

  // Juice animations
  FLOATING_NUMBER: 800,   // Floating damage number duration
  SCREEN_SHAKE: 300,      // Screen shake duration
  SCREEN_SHAKE_HEAVY: 400, // Heavy screen shake duration
  CONFETTI_DURATION: 3000, // Confetti fall duration
  COMBO_DISPLAY: 500,     // Combo counter display time
  COUNTER_POP: 300,       // Counter pop animation
  KNOCKOUT: 600,          // Death animation

  // Hero reaction durations
  HERO_REACTION_BRIEF: 600,  // Brief reaction (quick acknowledgement)
  HERO_REACTION_NORMAL: 800, // Normal reaction duration
  HERO_REACTION_LONG: 1200,  // Long reaction (important events)
  HERO_REACTION_PAINED: 1000, // Pain reaction duration
};

// ===== ANIMATION SPEED SYSTEM =====
// Helper function to apply animation speed multiplier
// Speed: 1 = normal, 2 = 2x faster, 4 = 4x faster, 0 = instant
function T(baseTime) {
  const speed = (typeof S !== 'undefined' && S.animationSpeed) || 1;
  if (speed === 0) return 1; // Instant mode: 1ms minimum
  return Math.max(1, Math.round(baseTime / speed));
}

// Get current animation speed label
function getSpeedLabel() {
  const speed = (typeof S !== 'undefined' && S.animationSpeed) || 1;
  switch(speed) {
    case 0: return 'Instant';
    case 2: return '2x';
    case 4: return '4x';
    default: return 'Normal';
  }
}

// ===== JUICE & POLISH SYSTEM =====
// Floating damage/heal numbers
function showFloatingNumber(targetId, text, type = 'damage', offsetX = 0) {
  const card = document.getElementById(targetId);
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const num = document.createElement('div');
  num.className = `floating-number ${type}`;
  num.textContent = text;

  // Random horizontal offset for variety
  const randomX = (Math.random() - 0.5) * 40 + offsetX;
  num.style.left = (rect.left + rect.width / 2 + randomX) + 'px';
  num.style.top = (rect.top + rect.height / 3) + 'px';

  document.body.appendChild(num);
  setTimeout(() => num.remove(), ANIMATION_TIMINGS.FLOATING_NUMBER);
}

// Screen shake effect
function triggerScreenShake(heavy = false) {
  const gameArea = document.getElementById('gameView');
  if (!gameArea) return;

  const className = heavy ? 'screen-shake-heavy' : 'screen-shake';
  gameArea.classList.add(className);
  setTimeout(() => gameArea.classList.remove(className),
    heavy ? ANIMATION_TIMINGS.SCREEN_SHAKE_HEAVY : ANIMATION_TIMINGS.SCREEN_SHAKE);
}

// Confetti celebration - with frog theme!
function spawnConfetti(count = 50) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  // Frog-friendly colors (greens, golds, lily pad colors)
  const colors = ['#22c55e', '#16a34a', '#4ade80', '#fbbf24', '#84cc16', '#10b981', '#34d399', '#a3e635'];
  const frogEmojis = ['🐸', '🐸', '🐸', '🪷', '💚', '✨'];

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

    const rand = Math.random();
    if (rand < 0.2) {
      // 20% chance: Frog emoji
      confetti.style.backgroundColor = 'transparent';
      confetti.style.width = 'auto';
      confetti.style.height = 'auto';
      confetti.style.fontSize = (16 + Math.random() * 16) + 'px';
      confetti.textContent = frogEmojis[Math.floor(Math.random() * frogEmojis.length)];
    } else if (rand < 0.35) {
      // 15% chance: Tiny Tapo image
      confetti.style.backgroundColor = 'transparent';
      confetti.style.width = (20 + Math.random() * 15) + 'px';
      confetti.style.height = 'auto';
      const img = document.createElement('img');
      img.src = 'assets/tapo-icon.png';
      img.style.width = '100%';
      img.style.height = 'auto';
      confetti.appendChild(img);
    } else {
      // 65% chance: Colored shapes
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      if (Math.random() > 0.5) {
        confetti.style.borderRadius = '50%';
      } else if (Math.random() > 0.5) {
        confetti.style.width = '8px';
        confetti.style.height = '14px';
      }
    }

    container.appendChild(confetti);
  }

  setTimeout(() => container.remove(), ANIMATION_TIMINGS.CONFETTI_DURATION + 500);
}

// Damage counter display - shows cumulative damage during a hero's turn
function showDamageCounter(totalDamage) {
  if (totalDamage < 5) return;

  // Remove existing counter if any
  const existing = document.querySelector('.combo-counter');
  if (existing) existing.remove();

  const counter = document.createElement('div');
  counter.className = 'combo-counter';
  counter.textContent = `${totalDamage} DMG!`;

  // Scale up for bigger damage
  if (totalDamage >= 20) {
    counter.style.fontSize = '6rem';
    counter.style.color = '#ff6b6b';
    counter.style.textShadow = '0 4px 8px rgba(0,0,0,0.8), 0 0 40px #ff6b6b';
  } else if (totalDamage >= 15) {
    counter.style.fontSize = '5.5rem';
    counter.style.color = '#ff9f43';
  } else if (totalDamage >= 10) {
    counter.style.fontSize = '5rem';
    counter.style.color = '#feca57';
  }

  document.body.appendChild(counter);
  setTimeout(() => counter.remove(), ANIMATION_TIMINGS.COMBO_DISPLAY);
}

// Animate counter pop (for XP/gold changes)
function animateCounterPop(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.classList.add('counter-pop');
  setTimeout(() => el.classList.remove('counter-pop'), ANIMATION_TIMINGS.COUNTER_POP);
}

// Knockout animation for defeated enemies
function triggerKnockout(targetId) {
  const card = document.getElementById(targetId);
  if (!card) return;

  card.classList.add('knockout');
  // Don't remove - the card will be removed from DOM anyway
}

