// ===== THE POND - RUN HISTORY =====
// Records a run's outcome to the permanent history
function recordPondHistory(outcome, killedBy = null) {
const heroNames = S.heroes.map(h => h.n);
const entry = {
runNumber: S.runNumber,
heroes: heroNames,
floorReached: S.floor,
gameMode: S.gameMode,
outcome: outcome, // 'defeat' or 'victory'
killedBy: killedBy,
timestamp: Date.now(),
xpEarned: S.xp - S.startingXP,
goldEarned: S.gold
};
// Add to history (limit to last 50 runs to save localStorage space)
S.pondHistory.unshift(entry);
if(S.pondHistory.length > 50) {
S.pondHistory = S.pondHistory.slice(0, 50);
}
savePermanent();
}

// Show The Pond - a reflective place for remembering past adventures
function showPond() {
const v = document.getElementById('gameView');
const history = S.pondHistory || [];

// Generate lily pad for each run
function renderLilyPad(run, idx) {
const isVictory = run.outcome === 'victory';
const isFUVictory = isVictory && run.gameMode === 'fu';
const isStandardVictory = isVictory && run.gameMode !== 'fu';

// Size based on floor reached (40px base + up to 60px more for floor 20)
const baseSize = 45;
const maxBonus = 55;
const floorReached = Math.max(1, run.floorReached || 1); // Guard against undefined/NaN
const floorProgress = Math.min(floorReached, 20) / 20;
const size = Math.round(baseSize + (maxBonus * floorProgress));

// Colors: green (defeat), gold (standard win), prismatic (FU win)
let background, border, glow, animation;
if (isFUVictory) {
  // Prismatic rainbow gradient
  background = 'linear-gradient(135deg, #ff6b6b 0%, #feca57 17%, #48dbfb 34%, #ff9ff3 51%, #54a0ff 68%, #5f27cd 85%, #ff6b6b 100%)';
  border = '3px solid #fff';
  glow = '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(138,43,226,0.5)';
  animation = 'animation: prismatic-shimmer 3s linear infinite;';
} else if (isStandardVictory) {
  // Golden
  background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)';
  border = '3px solid #fcd34d';
  glow = '0 0 12px rgba(251,191,36,0.6)';
  animation = '';
} else {
  // Green lily pad (defeat) - brighter green for higher floors
  const greenIntensity = 0.5 + (floorProgress * 0.4);
  background = `linear-gradient(135deg, rgba(34,197,94,${greenIntensity}) 0%, rgba(22,163,74,${greenIntensity + 0.15}) 100%)`;
  border = '2px solid rgba(34,197,94,0.7)';
  glow = '0 2px 8px rgba(0,0,0,0.3)';
  animation = '';
}

return `
<div class="lily-pad" onclick="showLilyPadDetail(${idx})" style="
  width:${size}px;
  height:${size}px;
  border-radius:50% 50% 50% 20%;
  background:${background};
  border:${border};
  box-shadow:${glow};
  cursor:pointer;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  transition:transform 0.2s, box-shadow 0.2s;
  position:relative;
  ${animation}
" onmouseover="this.style.transform='scale(1.15)'"
   onmouseout="this.style.transform='scale(1)'"
   title="Run #${run.runNumber} - Floor ${run.floorReached}${isVictory ? ' 🏆' : ''}">
  <span style="font-size:${Math.max(11, size/4)}px;font-weight:bold;color:${isVictory ? '#000' : '#fff'};text-shadow:${isVictory ? 'none' : '1px 1px 2px rgba(0,0,0,0.6)'}">${run.floorReached}</span>
  ${isVictory ? `<span style="font-size:${Math.max(10, size/5)}px">🏆</span>` : ''}
</div>`;
}

let html = `
<style>
@keyframes prismatic-shimmer {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
@keyframes pond-ripple {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.pond-water {
  background: linear-gradient(135deg,
    rgba(30,58,138,0.4) 0%,
    rgba(59,130,246,0.25) 25%,
    rgba(30,64,175,0.35) 50%,
    rgba(59,130,246,0.25) 75%,
    rgba(30,58,138,0.4) 100%);
  background-size: 200% 200%;
  animation: pond-ripple 8s ease-in-out infinite;
}
.lily-pad-container {
  display:flex;
  flex-wrap:wrap;
  gap:15px;
  justify-content:center;
  align-items:center;
  padding:2rem 1.5rem;
  min-height:180px;
}
</style>
<div style="max-width:900px;margin:0 auto;padding:1rem">
<h1 style="text-align:center;margin-bottom:0.5rem;font-size:2rem;color:#60a5fa;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">
🌿 The Pond 🌿
</h1>
<p style="text-align:center;color:#94a3b8;margin-bottom:1rem;font-size:0.95rem">
A quiet place to reflect on adventures past...
</p>

<!-- Legend -->
<div style="display:flex;justify-content:center;gap:1.5rem;margin-bottom:1rem;flex-wrap:wrap;font-size:0.85rem">
<span style="color:#22c55e">🟢 Good Try</span>
<span style="color:#fbbf24">🟡 Good Job</span>
${S.fuUnlocked ? `<span style="background:linear-gradient(90deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:bold">🌈 ${(S.pondHistory || []).some(r => r.gameMode === 'fu') ? 'Frogged Up Win' : 'What the Frog?'}</span>` : ''}
<span style="color:#64748b;font-size:0.8rem">(bigger = higher floor)</span>
</div>

${history.length === 0 ? `
<div class="pond-water" style="text-align:center;padding:4rem 2rem;border-radius:24px;max-width:500px;margin:0 auto;border:3px solid rgba(59,130,246,0.3)">
<p style="font-size:2rem;margin-bottom:1rem">🪷</p>
<p style="color:#94a3b8;font-size:1.1rem">The water is still...</p>
<p style="color:#64748b;margin-top:0.5rem">Lily pads will appear here after your first adventure and grow the further you progress.</p>
</div>
` : `
<div class="pond-water" style="border-radius:20px;border:3px solid rgba(59,130,246,0.3)">
<div class="lily-pad-container">
${history.map((run, idx) => renderLilyPad(run, idx)).join('')}
</div>
</div>

<!-- Stats summary -->
<div style="margin-top:1.5rem;display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:0.75rem;text-align:center">
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#f1f5f9">${history.length}</div>
<div style="color:#94a3b8;font-size:0.85rem">Journeys</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#fbbf24">${history.filter(r => r.outcome === 'victory').length}</div>
<div style="color:#94a3b8;font-size:0.85rem">Victories</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#60a5fa">${Math.max(...history.map(r => r.floorReached), 0)}</div>
<div style="color:#94a3b8;font-size:0.85rem">Best Floor</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#f59e0b">${getMostUsedHero(history)}</div>
<div style="color:#94a3b8;font-size:0.85rem">Favorite</div>
</div>
</div>
`}

${S.hasReachedFloor20 ? `
<div style="text-align:center;margin-top:1.5rem;padding:1rem;background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(251,191,36,0.1));border:2px solid #3b82f6;border-radius:12px">
<h3 style="margin:0 0 0.75rem 0;color:#60a5fa;text-shadow:1px 1px 2px rgba(0,0,0,0.5)">🏆 The Flydra's Conquerors 🏆</h3>
<p style="color:#94a3b8;font-size:0.9rem;margin-bottom:0.75rem">You've proven yourself worthy. Visit the Champions Hall to manage figurines and explore other realms.</p>
<button class="btn" onclick="showChampionsMenu()" style="background:linear-gradient(135deg,#3b82f6,#1e40af);border:2px solid #60a5fa;padding:0.75rem 1.5rem;font-size:1rem">
🐸 Enter Champions Hall
</button>
</div>
` : ''}

<div style="text-align:center;margin-top:1.5rem">
<button class="btn" onclick="showRibbleton()" style="padding:1rem 2rem;font-size:1.1rem">🐸 Return to Ribbleton</button>
</div>
</div>`;

v.innerHTML = html;
}

// Show detail popup when clicking a lily pad
function showLilyPadDetail(idx) {
const run = S.pondHistory[idx];
if (!run) return;

const date = new Date(run.timestamp);
const dateStr = date.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
const isVictory = run.outcome === 'victory';
const isFUVictory = isVictory && run.gameMode === 'fu';
const modeText = run.gameMode === 'fu' ? 'Frogged Up' : 'Standard';

let headerBg, headerColor;
if (isFUVictory) {
headerBg = 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)';
headerColor = '#000';
} else if (isVictory) {
headerBg = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
headerColor = '#000';
} else {
headerBg = 'linear-gradient(135deg, #22c55e, #16a34a)';
headerColor = '#fff';
}

const v = document.getElementById('gameView');
const html = `
<div class="modal-container" style="max-width:350px">
<div style="background:${headerBg};padding:1rem;border-radius:8px 8px 0 0;text-align:center">
<h2 style="margin:0;color:${headerColor};font-size:1.3rem">${isVictory ? '🏆 Victory!' : '🪷 Journey'} #${run.runNumber}</h2>
</div>
<div style="padding:1rem">
<div style="display:grid;gap:0.5rem;font-size:0.95rem">
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Date:</span>
<span style="color:#f1f5f9">${dateStr}</span>
</div>
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Mode:</span>
<span style="color:#f1f5f9">${run.gameMode === 'fu' ? '🔥 ' : '⚔️ '}${modeText}</span>
</div>
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Floor Reached:</span>
<span style="color:#f1f5f9;font-weight:bold">${run.floorReached}</span>
</div>
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Heroes:</span>
<span style="color:#f1f5f9">${run.heroes.join(' + ')}</span>
</div>
${run.xpEarned !== undefined ? `
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">XP Earned:</span>
<span style="color:#a78bfa;font-weight:bold">${run.xpEarned}</span>
</div>
` : ''}
${run.goldEarned !== undefined ? `
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Gold Balance:</span>
<span style="color:#fbbf24;font-weight:bold">${run.goldEarned}G</span>
</div>
` : ''}
${!isVictory && run.killedBy ? `
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Fell to:</span>
<span style="color:#f87171">${run.killedBy}</span>
</div>
` : ''}
${isVictory ? `
<div style="text-align:center;margin-top:0.5rem;padding:0.5rem;background:rgba(34,197,94,0.2);border-radius:4px">
<span style="color:#22c55e;font-weight:bold">🎉 Tapo Rescued!</span>
</div>
` : ''}
</div>
<button class="btn" onclick="this.closest('.modal-container').remove();document.querySelector('.modal-overlay')?.remove()" style="margin-top:1rem;width:100%">Close</button>
</div>
</div>
<div class="modal-overlay" onclick="document.querySelector('.modal-container')?.remove();this.remove()"></div>
`;
v.insertAdjacentHTML('beforeend', html);
SoundFX.play('hop');
}

function getMostUsedHero(history) {
if(history.length === 0) return '-';
const counts = {};
history.forEach(run => {
run.heroes.forEach(hero => {
  counts[hero] = (counts[hero] || 0) + 1;
});
});
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
return sorted.length > 0 ? sorted[0][0] : '-';
}

// ===== DEATH SCREEN =====
function showDeathScreen() {
savePermanent(); // Save gold, goingRate, sig upgrades
// Recruits persist until killed - don't clear here

// QUEST TRACKING: Run completed (death)
trackQuestProgress('runComplete');

// Check if this is the first time meeting Death
if(!S.tutorialFlags.death_intro && !S.cutsceneDisabled) {
showDeathIntroDialogue();
return;
}

const v = document.getElementById('gameView');
const coreSigils = ['Attack', 'Shield', 'Heal', 'D20'];
const advancedSigils = ['Ghost', 'Alpha', 'Grapple'];
const passiveSigils = ['Expand', 'Asterisk', 'Star'];
const allSigils = [...coreSigils, ...advancedSigils, ...passiveSigils];

// Select a random Death quote that hasn't been used yet
let deathQuote = "";
if(S.usedDeathQuotes.length >= DEATH_QUOTES.length) {
// All quotes used - reset the pool
S.usedDeathQuotes = [];
}
const availableQuotes = DEATH_QUOTES.filter((_, idx) => !S.usedDeathQuotes.includes(idx));
if(availableQuotes.length > 0) {
const randomIdx = Math.floor(Math.random() * availableQuotes.length);
deathQuote = availableQuotes[randomIdx];
// Mark this quote as used
const quoteIndex = DEATH_QUOTES.indexOf(deathQuote);
S.usedDeathQuotes.push(quoteIndex);
savePermanent(); // Save the updated usedDeathQuotes
}

// Calculate next upgrade's rate increase (tiered: first 5 +5, next 5 +10, etc.)
const currentTotalUpgrades = ['Attack', 'Shield', 'Heal', 'D20', 'Expand', 'Grapple', 'Ghost', 'Asterisk', 'Star', 'Alpha']
  .reduce((sum, sig) => sum + (S.sigUpgradeCounts[sig] || 0), 0);
const nextTier = Math.floor(currentTotalUpgrades / 5);
const nextRateIncrease = 5 * (nextTier + 1);

let html = `
<style>
@keyframes marquee-flash {
  0%, 100% { border-color: #dc2626; box-shadow: 0 0 10px rgba(220,38,38,0.8), 0 0 20px rgba(220,38,38,0.5); }
  50% { border-color: #3b82f6; box-shadow: 0 0 15px rgba(251,191,36,0.9), 0 0 30px rgba(251,191,36,0.6); }
}
.going-rate-marquee {
  animation: marquee-flash 1.5s ease-in-out infinite;
  border: 4px solid #dc2626;
  padding: 1.5rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(220,38,38,0.1), rgba(251,191,36,0.1));
  margin: 1.5rem 0;
}
</style>
<div class="death-screen-container" style="background:#f5f4ed;padding:2rem;border-radius:8px;max-width:900px;margin:0 auto;color:#2c2416;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
<img src="assets/neutrals/shopkeeper2.png" alt="The mysterious shopkeeper" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
<h1 style="text-align:center;margin-bottom:1rem;font-size:2.5rem;color:#dc2626">☠️ DEATH ☠️</h1>
${deathQuote ? `<p style="text-align:center;margin-bottom:1rem;font-size:1rem;color:#4a4540;font-style:italic">"${deathQuote}"</p>` : ''}
<div class="going-rate-marquee">
<p style="text-align:center;font-size:1.3rem;margin:0">Gold: <strong style="color:#b45309">${S.gold}</strong></p>
<p style="text-align:center;font-size:1.5rem;margin:0.5rem 0 0 0;font-weight:bold;color:#dc2626">⚡ Going Rate: ${S.goingRate}G ⚡</p>
<p style="text-align:center;font-size:0.85rem;margin:0.25rem 0 0 0;color:#5a5550;font-style:italic">(+${nextRateIncrease}G per upgrade)</p>
</div>`;

if(S.gold === 0) {
html += `<p style="text-align:center;margin:2rem 0;font-size:1.2rem;color:#dc2626;font-style:italic">"Nothing? Really? Come back when you have something to offer."</p>`;
} else {
html += `<h3 style="margin-bottom:1rem;text-align:center;font-size:1.3rem;color:#2c2416">Upgrade Sigilarium:</h3>`;

// Sanity check: if goingRate is very low but sigUpgradeCounts is high, something is wrong
// This can happen if save data gets corrupted or from old migration issues
const allSigils = ['Attack', 'Shield', 'Heal', 'D20', 'Expand', 'Grapple', 'Ghost', 'Asterisk', 'Star', 'Alpha'];
const totalUpgradeCounts = allSigils.reduce((sum, sig) => sum + (S.sigUpgradeCounts[sig] || 0), 0);
// Calculate expected going rate with tiered formula: first 5 upgrades +5 each, next 5 +10 each, etc.
const calculateExpectedGoingRate = (n) => {
  if(n <= 0) return 1;
  const fullTiers = Math.floor(n / 5);
  const partial = n % 5;
  // Sum of full tiers: each tier i (0-indexed) adds 5*(i+1)*5 = 25*(i+1)
  // Sum = 25 * (1+2+...+fullTiers) = 25 * fullTiers * (fullTiers+1) / 2
  const fullTierSum = 25 * fullTiers * (fullTiers + 1) / 2;
  // Partial tier adds: partial * 5 * (fullTiers+1)
  const partialSum = partial * 5 * (fullTiers + 1);
  return 1 + fullTierSum + partialSum;
};
const expectedMinGoingRate = calculateExpectedGoingRate(totalUpgradeCounts);
if (S.goingRate < expectedMinGoingRate && totalUpgradeCounts > 0) {
  console.warn('[DEATH SCREEN] sigUpgradeCounts out of sync with goingRate. Resetting sigUpgradeCounts.');
  console.warn('  goingRate:', S.goingRate, 'totalUpgradeCounts:', totalUpgradeCounts, 'expectedMin:', expectedMinGoingRate);
  // Reset sigUpgradeCounts to match what goingRate implies
  allSigils.forEach(sig => S.sigUpgradeCounts[sig] = 0);
  savePermanent();
  toast('Fixed corrupted upgrade data', 1500);
}

// Helper function to render sigil upgrade cards
const renderSigilCards = (sigils) => {
let cards = '';
sigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
// Actives show their effective level (perm + 1 for display)
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const isActive = actives.includes(sig);
const currentLevel = isActive ? permLevel + 1 : permLevel;
const nextLevel = currentLevel + 1;
const maxLevel = 4; // All sigils max at perm 4 (Expand can reach effective L5 for Mage/Healer via built-in +1)

// Show SOLD OUT card for maxed sigils instead of hiding
if(permLevel >= maxLevel) {
const colors = ['#666', '#000', '#0d9488', '#9333ea', '#d97706', '#ff00ff'];
const maxColor = colors[Math.min(currentLevel, colors.length - 1)];
cards += `
<div class="death-screen-sigil-card" style="background:#1a1a2e;padding:1rem;border-radius:8px;border:2px solid ${maxColor};box-shadow:0 0 12px rgba(255,0,255,0.3)">
<div style="font-weight:bold;margin-bottom:0.75rem;font-size:1.1rem">${sigilIconWithTooltip(sig, currentLevel, 750)}</div>
<div style="font-size:1.2rem;margin-bottom:0.75rem;font-weight:bold">
<span style="color:${maxColor}">L${currentLevel}</span>
</div>
<div style="font-size:1rem;color:${maxColor};font-weight:bold;text-transform:uppercase;letter-spacing:1px">SOLD OUT</div>
</div>`;
return;
}

const upgradeCount = S.sigUpgradeCounts[sig] || 0;
const baseCost = S.goingRate;
const escalationTable = [0, 25, 50, 100, 150];
// Cap upgradeCount to valid table index to prevent undefined escalation
const cappedCount = Math.min(upgradeCount, escalationTable.length - 1);
const escalation = escalationTable[cappedCount];
const cost = baseCost + escalation;

const canAfford = S.gold >= cost;
const colors = ['#666', '#000', '#0d9488', '#9333ea', '#d97706', '#ff00ff'];
const colorClass = colors[currentLevel] || '#666';
const nextColorClass = colors[nextLevel] || '#ff00ff';
// Show cost breakdown if there's escalation
const costDisplay = escalation > 0
  ? `<span title="Base: ${baseCost}G + Escalation: ${escalation}G">${cost}G</span>`
  : `${cost}G`;

// Use color-coded borders based on next level
const borderColor = nextColorClass;
cards += `
<div class="death-screen-sigil-card" style="background:#ffffff;padding:1rem;border-radius:8px;border:2px solid ${borderColor};box-shadow:0 2px 4px rgba(0,0,0,0.1)">
<div style="font-weight:bold;margin-bottom:0.75rem;font-size:1.1rem">${sigilIconWithTooltip(sig, currentLevel, 750)}</div>
<div style="font-size:1rem;margin-bottom:0.75rem;font-weight:bold">
<span style="color:${colorClass}">L${currentLevel}</span> → <span style="color:${nextColorClass}">L${nextLevel}</span>
</div>
<div style="font-size:0.9rem;margin-bottom:0.75rem;color:#4a4540;font-weight:600">Cost: ${cost}G</div>
<button class="btn" ${!canAfford ? 'disabled' : ''} onclick="purchaseSigilUpgrade('${sig}', ${cost})" style="padding:0.5rem 1rem;font-size:0.9rem;width:100%;${canAfford ? `border-color:${nextColorClass}` : ''}">
${canAfford ? 'Purchase' : 'Too Expensive'}
</button>
</div>`;
});
return cards;
};

// Core Sigils
html += `<h4 style="color:#2c63c7;margin:1rem 0 0.5rem 0;text-align:center;font-size:1.1rem">⚔️ Core Sigils</h4>`;
html += `<div class="death-screen-sigil-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto">`;
html += renderSigilCards(coreSigils);
html += `</div>`;

// Advanced Sigils
html += `<h4 style="color:#f97316;margin:1rem 0 0.5rem 0;text-align:center;font-size:1.1rem">🔥 Advanced Sigils</h4>`;
if(S.advancedSigilsUnlocked) {
html += `<div class="death-screen-sigil-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto">`;
html += renderSigilCards(advancedSigils);
html += `</div>`;
} else {
const canAffordAdvanced = S.gold >= 20;
html += `
<div style="background:#1a1a2e;padding:2rem;border-radius:12px;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto;border:3px solid #f97316;box-shadow:0 0 20px rgba(249,115,22,0.3);text-align:center">
<div style="font-size:2rem;margin-bottom:1rem">🔒</div>
<p style="color:#f97316;font-weight:bold;font-size:1.1rem;margin-bottom:0.5rem">Ghost • Alpha • Grapple</p>
<p style="color:#888;font-size:0.9rem;margin-bottom:1rem;font-style:italic">Unlock advanced combat techniques</p>
<button class="btn" ${!canAffordAdvanced ? 'disabled' : ''} onclick="unlockSigilCategory('advanced')" style="padding:0.75rem 1.5rem;font-size:1rem;${canAffordAdvanced ? 'background:linear-gradient(135deg,#f97316,#ea580c);border-color:#f97316;color:#fff' : ''}">
${canAffordAdvanced ? 'UNLOCK - 20G' : 'Need 20G to Unlock'}
</button>
</div>`;
}

// Passive Sigils
html += `<h4 style="color:#9333ea;margin:1rem 0 0.5rem 0;text-align:center;font-size:1.1rem">✨ Passive Sigils</h4>`;
if(S.passiveSigilsUnlocked) {
html += `<div class="death-screen-sigil-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto">`;
html += renderSigilCards(passiveSigils);
html += `</div>`;
} else {
const canAffordPassive = S.gold >= 50;
html += `
<div style="background:#1a1a2e;padding:2rem;border-radius:12px;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto;border:3px solid #9333ea;box-shadow:0 0 20px rgba(147,51,234,0.3);text-align:center">
<div style="font-size:2rem;margin-bottom:1rem">🔒</div>
<p style="color:#9333ea;font-weight:bold;font-size:1.1rem;margin-bottom:0.5rem">Expand • Asterisk • Star</p>
<p style="color:#888;font-size:0.9rem;margin-bottom:1rem;font-style:italic">Unlock passive enhancements</p>
<button class="btn" ${!canAffordPassive ? 'disabled' : ''} onclick="unlockSigilCategory('passive')" style="padding:0.75rem 1.5rem;font-size:1rem;${canAffordPassive ? 'background:linear-gradient(135deg,#9333ea,#7c3aed);border-color:#9333ea;color:#fff' : ''}">
${canAffordPassive ? 'UNLOCK - 50G' : 'Need 50G to Unlock'}
</button>
</div>`;
}
}

// Death Boys (only if Ghost Boys converted)
if(S.ghostBoysConverted) {
html += `
<div style="border-top:2px solid rgba(255,255,255,0.2);padding-top:2rem;margin-top:2rem">
<h2 style="text-align:center;margin-bottom:0.5rem;font-size:1.5rem;color:#a855f7">The Death Boys</h2>
<p style="text-align:center;margin-bottom:1.5rem;font-size:0.9rem;font-style:italic;opacity:0.8">"We work for Death now! It's WAY cooler than being ghosts!"</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
<!-- Boy 1: Sell Back -->
<div style="background:rgba(34,197,94,0.1);padding:1.5rem;border-radius:8px;border:2px solid rgba(34,197,94,0.3)">
<h3 style="color:#22c55e;margin-bottom:0.5rem">Death Boy 1: "Sell Back"</h3>
<p style="font-size:0.85rem;margin-bottom:1rem;opacity:0.9">Remove one upgrade level from any sigil and get Gold equal to the current Going Rate (no rate increase)</p>
<div style="font-size:0.8rem;margin-bottom:1rem;opacity:0.7">Going Rate: ${S.goingRate}G</div>`;

// List all sigils that can be sold back
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
allSigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const isActive = actives.includes(sig);
const currentLevel = isActive ? permLevel + 1 : permLevel;
const canSellBack = permLevel > 0;
html += `
<div style="background:rgba(0,0,0,0.3);padding:0.5rem;margin-bottom:0.5rem;border-radius:4px;display:flex;justify-content:space-between;align-items:center">
<span>${sigilIconWithTooltip(sig, currentLevel, 750)} L${currentLevel}</span>
<button class="btn" ${!canSellBack ? 'disabled' : ''} onclick="deathBoySellBack('${sig}')" style="padding:0.3rem 0.6rem;font-size:0.75rem">
${canSellBack ? `Sell for ${S.goingRate}G` : 'Cannot Sell'}
</button>
</div>`;
});

html += `</div>

<!-- Boy 2: Sacrifice for XP -->
<div style="background:rgba(168,85,247,0.1);padding:1.5rem;border-radius:8px;border:2px solid rgba(168,85,247,0.3)">
<h3 style="color:#a855f7;margin-bottom:0.5rem">Death Boy 2: "Sacrifice"</h3>
<p style="font-size:0.85rem;margin-bottom:1rem;opacity:0.9">Sacrifice one upgrade level to gain ${S.goingRate} Starting XP permanently. Going Rate decreases by 5G.</p>
<div style="font-size:0.8rem;margin-bottom:0.5rem;opacity:0.7">Current Starting XP: ${S.startingXP}</div>
<div style="font-size:0.8rem;margin-bottom:1rem;opacity:0.7">Going Rate: ${S.goingRate}G → ${Math.max(1, S.goingRate - 5)}G</div>`;

// List all sigils that can be sacrificed
const actives2 = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
allSigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const isActive = actives2.includes(sig);
const currentLevel = isActive ? permLevel + 1 : permLevel;
const canSacrifice = permLevel > 0 && S.goingRate > 1;
html += `
<div style="background:rgba(0,0,0,0.3);padding:0.5rem;margin-bottom:0.5rem;border-radius:4px;display:flex;justify-content:space-between;align-items:center">
<span>${sigilIconWithTooltip(sig, currentLevel, 750)} L${currentLevel}</span>
<button class="btn" ${!canSacrifice ? 'disabled' : ''} onclick="deathBoySacrifice('${sig}')" style="padding:0.3rem 0.6rem;font-size:0.75rem">
${canSacrifice ? `+${S.goingRate}XP` : 'Cannot'}
</button>
</div>`;
});

html += `</div>
</div>
</div>`;
}

html += `
<div style="text-align:center;margin-top:2rem">
<button class="btn danger" onclick="restartAfterDeath()" style="font-size:1.2rem;padding:1rem 2rem">Return to Ribbleton</button>
</div>
</div>`;

v.innerHTML = html;
}

function purchaseSigilUpgrade(sig, cost) {
if(S.gold < cost) { toast('Not enough Gold!'); return; }

// Check max level: all sigils max at perm L4 (Expand reaches effective L5 for Mage/Healer via built-in +1)
const permLevel = S.sig[sig] || 0;
const maxLevel = 4;

if(permLevel >= maxLevel) {
toast('Already at maximum level!', 1800);
return;
}

S.gold -= cost;
S.sig[sig] = (S.sig[sig] || 0) + 1;
S.sigUpgradeCounts[sig] = (S.sigUpgradeCounts[sig] || 0) + 1;
// Going Rate increase formula: first 5 upgrades +5 each, next 5 +10 each, next 5 +15 each, etc.
const totalUpgradesBefore = Object.values(S.sigUpgradeCounts).reduce((a, b) => a + b, 0) - 1; // -1 because we just incremented
const tier = Math.floor(totalUpgradesBefore / 5);
const rateIncrease = 5 * (tier + 1);
S.goingRate += rateIncrease;
// QUEST TRACKING: Upgrade purchased
trackQuestProgress('upgrade');
// JUICE: Power up sound for sigil upgrade
SoundFX.play('powerUp');
const activesList = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const displayLevel = activesList.includes(sig) ? S.sig[sig] + 1 : S.sig[sig];
toast(`${sig} upgraded to L${displayLevel}!`, 1200);
savePermanent();
showDeathScreen(); // Refresh
}

function unlockSigilCategory(category) {
const costs = { advanced: 20, passive: 50 };
const cost = costs[category];
if(!cost) { toast('Invalid category!'); return; }
if(S.gold < cost) { toast('Not enough Gold!'); return; }

S.gold -= cost;
if(category === 'advanced') {
S.advancedSigilsUnlocked = true;
SoundFX.play('powerUp');
toast('Advanced Sigils Unlocked!', 1500);
} else if(category === 'passive') {
S.passiveSigilsUnlocked = true;
SoundFX.play('powerUp');
toast('Passive Sigils Unlocked!', 1500);
}
// Category unlocks do NOT increase Going Rate
savePermanent();
showDeathScreen(); // Refresh
}

function deathBoySellBack(sig) {
const permLevel = S.sig[sig] || 0;
if(permLevel <= 0) {
toast("Whoa, something's weird. I can't do that", 1800);
return;
}
// Sell back: get gold, lower sigil level, no going rate change
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const isActive = actives.includes(sig);
const oldLevel = isActive ? permLevel + 1 : permLevel;
S.gold += S.goingRate;
S.sig[sig]--;
S.sigUpgradeCounts[sig] = Math.max(0, (S.sigUpgradeCounts[sig] || 0) - 1);
const newPermLevel = S.sig[sig];
const newLevel = isActive ? newPermLevel + 1 : newPermLevel;
toast(`Sold ${sig} L${oldLevel}→L${newLevel} for ${S.goingRate}G!`, 1800);
savePermanent();
showDeathScreen(); // Refresh
}

function deathBoySacrifice(sig) {
const permLevel = S.sig[sig] || 0;
if(permLevel <= 0) {
toast("Whoa, something's weird. I can't do that", 1800);
return;
}
if(S.goingRate <= 1) {
toast("Whoa, something's weird. I can't do that", 1800);
return;
}
// Sacrifice: get starting XP, lower sigil level, decrease going rate
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const isActive = actives.includes(sig);
const oldLevel = isActive ? permLevel + 1 : permLevel;
const xpGained = S.goingRate;
S.startingXP += xpGained;
S.sig[sig]--;
S.sigUpgradeCounts[sig] = Math.max(0, (S.sigUpgradeCounts[sig] || 0) - 1);
S.goingRate = Math.max(1, S.goingRate - 5);
const newPermLevel = S.sig[sig];
const newLevel = isActive ? newPermLevel + 1 : newPermLevel;
toast(`Sacrificed ${sig} L${oldLevel}→L${newLevel} for +${xpGained}XP permanently!`, 1800);
savePermanent();
showDeathScreen(); // Refresh
}

function restartAfterDeath() {
// Check if player has unspent gold
if(S.gold >= S.goingRate && !S.tutorialFlags.death_exit_warning) {
showTutorialPop('death_exit_warning', "Are you sure? This is some <span style='font-size:0.7em'>great value</span> and you'll end up giving it to me sooner or later...", () => {
// After tutorial, ask for confirmation
showConfirmModal('Leave Death Screen with unspent gold?', () => {
actuallyRestartAfterDeath();
}, () => {
showDeathScreen();
});
});
return;
}
actuallyRestartAfterDeath();
}

function actuallyRestartAfterDeath() {
// Increment run number
S.runNumber++;

// Check if this was the forced FU entry (after first Standard win)
if(S.forcedFUEntry) {
S.forcedFUEntry = false;
S.gameMode = 'Standard'; // Reset to Standard mode
savePermanent();
showFUIntroPopup();
return;
}

savePermanent();
// Clear run-specific save (slot-specific)
if(S.currentSlot != null) {
localStorage.removeItem(`froggle8_slot${S.currentSlot}`);
}
// Also clear old save format for backwards compatibility
localStorage.removeItem('froggle8');
// Return to Ribbleton hub
toast('Returning to Ribbleton...', 1200);
setTimeout(() => transitionScreen(showRibbleton), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}

// Popup explaining Standard vs FU paths after first FU taste
function showFUIntroPopup() {
const v = document.getElementById('gameView');
v.innerHTML = `
<div style="max-width:600px;margin:2rem auto;padding:2rem;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);border-radius:12px;border:3px solid #22c55e;color:#fff;text-align:center">
<h2 style="margin-bottom:1.5rem;font-size:1.8rem;color:#22c55e">🐸 Welcome to the Endgame! 🐸</h2>

<p style="margin-bottom:1.5rem;font-size:1.1rem;line-height:1.6">
You've conquered the Flydra and saved Tapo once... but there's always more to do!
</p>

<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin:2rem 0">
<div style="flex:1;min-width:200px;background:rgba(59,130,246,0.2);border:2px solid #3b82f6;border-radius:8px;padding:1rem">
<h3 style="color:#3b82f6;margin-bottom:0.5rem">🔵 Standard Runs</h3>
<p style="font-size:0.9rem;color:#94a3b8">Earn <strong style="color:#fbbf24">Figurines</strong> for surviving heroes. Permanently boost your stats!</p>
</div>

<div style="flex:1;min-width:200px;background:rgba(34,197,94,0.2);border:2px solid #22c55e;border-radius:8px;padding:1rem">
<h3 style="color:#22c55e;margin-bottom:0.5rem">🟢 Frogged Up Runs</h3>
<p style="font-size:0.9rem;color:#94a3b8">Earn <strong style="color:#d97706">bonus Gold</strong> for upgrades. Higher risk, higher rewards!</p>
</div>
</div>

<p style="margin-bottom:1.5rem;font-size:0.95rem;color:#94a3b8">
Visit the <strong style="color:#3b82f6">Statue Room</strong> via the blue portal in Ribbleton to switch between modes!
</p>

<button class="btn" onclick="continueFUIntro()" style="padding:1rem 2rem;font-size:1.1rem">Got it! Back to Ribbleton</button>
</div>`;
}

function continueFUIntro() {
// Clear run-specific save
if(S.currentSlot != null) {
localStorage.removeItem(`froggle8_slot${S.currentSlot}`);
}
localStorage.removeItem('froggle8');
toast('Returning to Ribbleton...', 1200);
setTimeout(() => transitionScreen(showRibbleton), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}

// ===== CHAMPIONS MENU =====
function showChampionsMenu() {
const v = document.getElementById('gameView');
const pedestalCount = S.pedestal.filter(p => p.mode === S.gameMode).length;
const maxSlots = 8;

let html = `
<style>
@keyframes champions-portal-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.08); opacity: 1; }
}
@keyframes champions-portal-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>
<div style="position:relative;max-width:800px;margin:0 auto">
<h1 style="text-align:center;margin:1rem 0;font-size:2rem;background:linear-gradient(135deg,#3b82f6,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
🏆 The Flydra's Conquerors 🏆
</h1>

<div style="position:relative;width:100%;margin:0 auto">
<img src="assets/champions-hall.png" alt="The Champions Hall" style="width:100%;display:block;border-radius:8px;border:3px solid #000">

<!-- Clickable pedestal hotspot (center) -->
<div onclick="showPedestal()" style="position:absolute;left:35%;top:30%;width:30%;height:50%;cursor:pointer" title="View Pedestal"></div>

<!-- Clickable left portal (blue portal - leads to Ribbleton/Standard mode) -->
<div onclick="goToRibbleton()" style="position:absolute;left:5%;top:20%;width:20%;height:60%;cursor:pointer;display:flex;align-items:center;justify-content:center"
     onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"
     title="Return to Ribbleton">
  <div style="width:90px;height:90px;position:relative;border-radius:50%;background:radial-gradient(circle, #3b82f6, #1e3a8a);animation:champions-portal-pulse 1.2s ease-in-out infinite;box-shadow:0 0 30px #3b82f6">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:3rem">🐸</div>
  </div>
</div>

<!-- Clickable right portal (green-black portal - leads to FU mode) - no emoji, just ominous -->
<div onclick="enterPortal('fu')" style="position:absolute;right:5%;top:20%;width:20%;height:60%;cursor:pointer;transition:transform 0.2s;display:flex;align-items:center;justify-content:center"
     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
     title="${S.gameMode === 'fu' ? 'Current Mode' : 'Enter Frogged Up Realm'}">
  <div style="width:100px;height:100px;position:relative;border-radius:50%;background:radial-gradient(circle, #22c55e 0%, #0a0a0a 60%, #000 100%);animation:champions-portal-pulse 1s ease-in-out infinite;box-shadow:0 0 40px rgba(34,197,94,0.5), inset 0 0 30px rgba(0,0,0,0.8)">
  </div>
</div>
</div>

<div style="text-align:center;margin-top:1.5rem;padding:1rem;background:rgba(251,191,36,0.1);border:2px solid #3b82f6;border-radius:8px">
<p style="margin:0.5rem 0;font-size:1rem"><strong>Current Mode:</strong> <span style="color:${S.gameMode === 'fu' ? '#22c55e' : '#3b82f6'}">${S.gameMode === 'Standard' ? 'Standard' : 'FROGGED UP 🔥'}</span></p>
<p style="margin:0.5rem 0;font-size:0.9rem;opacity:0.8">Click the <strong>pedestal</strong> to manage figurines (${pedestalCount}/${maxSlots})</p>
<p style="margin:0.5rem 0;font-size:0.9rem"><strong>🔵 Blue Portal:</strong> Standard Mode | <strong>🟢 Green Portal:</strong> Frogged Up Mode</p>
</div>

<div style="text-align:center;margin-top:1rem">
<button class="btn secondary" onclick="title()">Back to Title</button>
</div>
</div>`;

v.innerHTML = html;
}

function enterPortal(targetMode) {
if(S.gameMode === targetMode) {
toast('You are already in this realm!');
return;
}
S.gameMode = targetMode;
savePermanent();
toast(`Entered ${targetMode === 'Standard' ? 'Standard' : 'Frogged Up 🔥'} Realm!`);
// Go to hero select for the new mode
title();
}

function goToRibbleton() {
S.gameMode = 'Standard';
savePermanent();
SoundFX.play('portal');
toast('Returning to Ribbleton...', 1200);
setTimeout(() => transitionScreen(showRibbleton), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}

// NOTE: Waiting on Champions Hall toggle button image asset from Preston
// This function will be used for a visual toggle button in the Champions menu
function toggleModeFromChampions() {
S.gameMode = S.gameMode === 'Standard' ? 'fu' : 'Standard';
document.body.classList.toggle('fu-mode', S.gameMode === 'fu');
showChampionsMenu();
}

// ===== PEDESTAL UI =====
function showPedestal() {
const v = document.getElementById('gameView');
const heroes = ['Warrior', 'Tank', 'Mage', 'Healer'];
const stats = ['POW', 'HP'];

// Build 8 slots in 4x2 grid over the pedestal image
// Slots are positioned to overlay the cubbies in the pedestal art
let slotsHTML = '';
heroes.forEach((hero, colIdx) => {
stats.forEach((stat, rowIdx) => {
const slotted = S.pedestal.find(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode);
const isSlotted = !!slotted;

// Position 4 columns x 2 rows of slots centered on the pedestal cubbies
// Top row: POW slots, Bottom row: HP slots
const left = 12 + (colIdx * 19.5); // 4 columns across the pedestal width
const top = 32 + (rowIdx * 22); // 2 rows on the pedestal

slotsHTML += `
<div style="position:absolute;left:${left}%;top:${top}%;width:17%;height:18%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.15s"
     onclick="${isSlotted ? `removeFigurine('${hero}','${stat}')` : `slotFigurine('${hero}','${stat}')`}"
     onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform='scale(1)'">`;

if(isSlotted) {
// Show frog emoji when slot is filled
slotsHTML += `<div style="font-size:2.5rem;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));animation:frogBounce 1.5s ease-in-out infinite">🐸</div>`;
} else {
// Empty slot - subtle indicator
slotsHTML += `<div style="width:80%;height:80%;background:rgba(0,0,0,0.2);border:2px dashed rgba(255,255,255,0.3);border-radius:6px;display:flex;align-items:center;justify-content:center">
<span style="font-size:1.2rem;color:rgba(255,255,255,0.4)">+</span>
</div>`;
}

slotsHTML += `</div>`;
});
});

// Labels for heroes across the top
let heroLabelsHTML = '<div style="position:absolute;top:18%;left:10%;right:10%;display:flex;justify-content:space-around">';
heroes.forEach(hero => {
heroLabelsHTML += `<div style="text-align:center;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.9);font-size:0.8rem;font-weight:bold">${hero}</div>`;
});
heroLabelsHTML += '</div>';

// Stat labels on the left side
let statLabelsHTML = `
<div style="position:absolute;left:3%;top:38%;color:#fbbf24;font-weight:bold;text-shadow:0 2px 4px rgba(0,0,0,0.9);font-size:0.9rem">POW</div>
<div style="position:absolute;left:3%;top:60%;color:#ef4444;font-weight:bold;text-shadow:0 2px 4px rgba(0,0,0,0.9);font-size:0.9rem">HP</div>`;

// Count placed figurines
const placedCount = S.pedestal.filter(p => p.mode === S.gameMode).length;

let html = `
<div style="width:100%;height:100vh;position:relative;background:#1a1a1a;overflow:hidden">
<!-- Pedestal image as background, centered -->
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:95%;height:90%;background-image:url('assets/neutrals/statue2.png');background-size:contain;background-position:center;background-repeat:no-repeat">
${heroLabelsHTML}
${statLabelsHTML}
${slotsHTML}
</div>

<!-- Header overlay -->
<div style="position:absolute;top:1rem;left:50%;transform:translateX(-50%);text-align:center;z-index:10">
<h2 style="margin:0;color:#fbbf24;text-shadow:0 2px 8px rgba(0,0,0,0.9);font-size:1.3rem">⚱️ Pedestal of Champions</h2>
<p style="margin:0.25rem 0;font-size:0.85rem;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.8)">${S.gameMode} Mode - ${placedCount}/8 figurines placed</p>
</div>

<!-- Back button -->
<div style="position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);z-index:10">
<button class="btn secondary" onclick="showChampionsMenu()" style="padding:0.75rem 2rem">Back to Victory Room</button>
</div>
<style>
@keyframes frogBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>
</div>`;

v.innerHTML = html;
}

function slotFigurine(hero, stat) {
// Check if slot is available
if(S.pedestal.find(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode)) {
toast('Slot already filled!');
return;
}

// Check if we have 8 slots filled
const slotsUsed = S.pedestal.filter(p => p.mode === S.gameMode).length;
if(slotsUsed >= 8) {
toast('All 8 slots filled! Remove a figurine first.');
return;
}

// Check if this hero can have a figurine (max 2 per hero per mode)
const existingCount = S.pedestal.filter(p => p.hero === hero && p.mode === S.gameMode).length;
if(existingCount >= 2) {
toast(`${hero} already has 2 figurines in ${S.gameMode} mode!`, 1800);
return;
}

// Check if hero already slotted their figurine THIS victory session (1 per hero per victory)
if(window.heroesSlottedThisVictory && window.heroesSlottedThisVictory.includes(hero)) {
toast(`${hero} already placed their figurine this victory!`, 1800);
return;
}

// Check if hero earned a figurine this victory (only survivors who aren't maxed)
if(window.earnedFigurines && !window.earnedFigurines.includes(hero)) {
toast(`${hero} didn't earn a figurine this victory!`, 1800);
return;
}

// Place the hero figurine
S.pedestal.push({hero, stat, mode: S.gameMode, source: 'hero'});
// Track that this hero slotted their figurine this victory
if(!window.heroesSlottedThisVictory) window.heroesSlottedThisVictory = [];
window.heroesSlottedThisVictory.push(hero);
savePermanent();
toast(`${hero} ${stat} figurine placed!`, 1800);
showPedestal();
}

function removeFigurine(hero, stat) {
const idx = S.pedestal.findIndex(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode);
if(idx >= 0) {
S.pedestal.splice(idx, 1);
savePermanent();
toast(`${hero} ${stat} figurine removed!`);
showPedestal();
}
}

// ===== WIN =====
function win() {
// JUICE: Victory music and treasure sound!
ProceduralMusic.playVictory();
SoundFX.play('treasure');

// Record victory to The Pond!
recordPondHistory('victory');

// QUEST TRACKING: Run completed, victory, hero wins
trackQuestProgress('runComplete');
if(S.gameMode === 'fu') {
  trackQuestProgress('fuWin');
} else {
  trackQuestProgress('standardWin');
}
const hasTapo = S.heroes.some(h => (h.base || h.n) === 'Tapo');
const allTapo = S.heroes.every(h => (h.base || h.n) === 'Tapo');
S.heroes.forEach(hero => {
  trackQuestProgress('heroWin', hero.base || hero.n);
});
// Track Tapo-specific achievements
if(hasTapo) {
  if(S.gameMode === 'fu') trackQuestProgress('tapoFUWin');
  if(allTapo) trackQuestProgress('allTapoWin');
}

// Reset run state on victory (gold persists between runs)
S.xp = 0; // Clear XP earned this run
S.levelUpCount = 0; // Reset level up count
S.tempSigUpgrades = {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0}; // Clear temp upgrades
S.recruits = []; // Clear recruits
savePermanent();

// Award figurines for heroes who survived (HP > 0, not Last Stand)
// Tapo has no pedestal slots, so give 25G compensation instead
const survivedHeroes = S.heroes.filter(h => h.h > 0 && !h.ls);
const earnedFigurines = [];
const maxedHeroes = [];
survivedHeroes.forEach(h => {
// Tapo can't place figurines - always treat as maxed for compensation
if((h.base || h.n) === 'Tapo') { maxedHeroes.push(h.n); return; }
// Check if this hero already has 2 figurines for this mode
const existingCount = S.pedestal.filter(slot => slot.hero === h.n && slot.mode === S.gameMode).length;
if(existingCount < 2) {
earnedFigurines.push(h.n);
} else {
maxedHeroes.push(h.n);
}
});

// Award 25 gold per maxed hero
if(maxedHeroes.length > 0) {
const goldReward = maxedHeroes.length * 25;
S.gold += goldReward;
window.maxedHeroesGold = { heroes: maxedHeroes, gold: goldReward };
} else {
window.maxedHeroesGold = null;
}

// Unlock Frogged Up mode if Standard victory
const firstStandardVictory = S.gameMode === 'Standard' && !S.tutorialFlags.first_victory_sequence && !S.cutsceneDisabled;
if(S.gameMode === 'Standard') {
S.fuUnlocked = true;
if(firstStandardVictory) {
S.tutorialFlags.first_victory_sequence = true;
}
}

const firstFU = S.gameMode === 'fu' && !S.tutorialFlags.first_fu_victory && !S.cutsceneDisabled;
if(firstFU) {
S.tutorialFlags.first_fu_victory = true;
// Note: Tapo is now unlocked at Floor 20 via Old Tapo encounter
}

savePermanent();

// Store earned figurines for later display
window.earnedFigurines = earnedFigurines;
// Reset per-victory slotting tracker (each hero can only slot 1 figurine per victory)
window.heroesSlottedThisVictory = [];

// FIRST STANDARD VICTORY: Show cutscene
if(firstStandardVictory) {
showFirstVictoryCutscene();
return;
}

// FIRST FU VICTORY: Show credits
if(firstFU) {
showFUVictoryCredits();
return;
}

// TAPO IN PARTY: Show heartfelt thank you (only if Tapo is alive)
const tapoInParty = S.heroes.some(h => (h.base || h.n) === 'Tapo' && h.h > 0 && !h.ls);
if(tapoInParty && !S.tutorialFlags.tapo_victory_message && !S.cutsceneDisabled) {
S.tutorialFlags.tapo_victory_message = true;
savePermanent();
showTapoVictoryMessage();
return;
}

// SUBSEQUENT VICTORIES: Go directly to Pedestal if figurines earned
if(earnedFigurines.length > 0) {
showStatueRoom();
return;
}

// No figurines earned: show simple victory screen
showSimpleVictoryScreen();
}

function showFirstVictoryCutscene() {
// Build dynamic stats text based on what was slotted
const getSlottedStatsText = () => {
const slotted = S.pedestal.filter(p => p.mode === S.gameMode);
if(slotted.length === 0) return "The statues remain unslotted... for now.";
const statTexts = slotted.map(p => `${p.hero} ${p.stat === 'POW' ? '+1 POW' : '+5 HP'}`);
return statTexts.join('! ') + '!';
};

const slides = [
{bg: 'assets/victory-room.png', text: "After traversing 19 precarious floors, you finally come upon the still form of <strong style='color:#22c55e'>Tapo the Tadpole</strong>..."},
{bg: 'assets/victory-room.png', text: "Perhaps he succumbed to the FLYDRA's terrible bite? The heroes gather around Tapo..."},
{bg: 'assets/victory-room.png', text: "With a start, the little tadpole suddenly awakens from his well-earned nap! Clutched in his budding appendages, he holds carvings of the heroes who saved him!"},
{bg: 'assets/victory-room.png', text: "The heroes notice that the statues are juuust the right size to slot into the nearby pedestal!", action: 'statue_slotting'},
{bg: 'assets/victory-room.png', text: () => `As the statues click into place, a warm ripple of power surges through the heroes. <strong style='color:#fbbf24'>${getSlottedStatsText()}</strong>`, dynamic: true},
{bg: 'assets/victory-room.png', text: "Exhausted but tingling with power, the heroes hoist Tapo onto their shoulders and begin the long journey back to Ribbleton. Wait... What's this portal?"},
{bg: 'assets/ribbleton.png', text: "WHOOSH! One portal trip later, and the crew is back safe and sound in Ribbleton. Off to the Lilypad Pond for a well-earned night of sleep!"},
{bg: 'assets/ribbleton.png', text: "INTERSTITIAL_HERO_CARDS", action: 'hero_cards_interstitial'},
{bg: 'assets/ribbleton.png', text: "As the sun rises, the town of Ribbleton awakens, delighted to see their heroes home safe. There is only one problem... Where is Tapo? Our heroes gear up and take the portal back to the statue room where they found him last time."},
{bg: 'assets/victory-room.png', bgStyle: 'transform:scaleX(-1)', text: "...and there he is! Staring at YET ANOTHER portal, this one crackling with black and green energy. But before anyone can stop him, the little bugger squirms his way in. <span style='font-size:1.2em;font-weight:bold;color:#22c55e'>Here we go again!</span>"}
];

// Custom slide handler for statue slotting and hero cards
window.firstVictorySlideAction = (action, slideIndex, callback) => {
if(action === 'statue_slotting') {
showFirstVictoryPedestal(() => {
callback();
});
return true;
}
if(action === 'hero_cards_interstitial') {
showVictoryHeroCardsInterstitial(() => {
callback();
});
return true;
}
return false;
};

slides.onComplete = () => {
window.firstVictorySlideAction = null;
// Force player into FU mode for their first taste!
S.gameMode = 'fu';
S.forcedFUEntry = true; // Track that this is the forced entry
savePermanent();
toast('Tapo has entered the Frogged Up realm! You must follow!', 2500);
setTimeout(() => title(), T(1500));
};

showNarrativeSlide(slides, 0);
}

// Hero cards interstitial showing final stats
function showVictoryHeroCardsInterstitial(onComplete) {
const v = document.getElementById('gameView');

// Get pedestal bonuses for display
// Standard mode statues apply in both modes, FU statues only in FU mode
const getPedestalBonus = (heroName) => {
const bonuses = S.pedestal.filter(p => {
if(p.hero !== heroName) return false;
// Standard mode bonuses always apply, FU bonuses only in FU mode
if(p.mode === 'fu' && S.gameMode !== 'fu') return false;
return true;
});
if(bonuses.length === 0) return '';
return bonuses.map(b => b.stat === 'POW' ? '+1💥' : '+5❤').join(' ');
};

// Build hero cards
let heroCardsHTML = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:1rem;margin:1.5rem 0">';
S.heroes.forEach(hero => {
const pedestalBonus = getPedestalBonus(hero.n);
const sigilsHTML = hero.s.map(sig => {
const level = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);
const displayLevel = ['Expand', 'Asterisk', 'Star'].includes(sig) ? level : level + 1;
return `<span style="background:#1e293b;padding:2px 6px;border-radius:4px;font-size:0.75rem;margin:2px">${sigilIconOnly(sig)}L${displayLevel}</span>`;
}).join(' ');
heroCardsHTML += `
<div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);border:3px solid #22c55e;border-radius:12px;padding:1rem;min-width:140px;text-align:center">
<div style="font-size:1.2rem;font-weight:bold;color:#22c55e;margin-bottom:0.5rem">${hero.n}</div>
<div style="font-size:0.9rem;margin-bottom:0.5rem">${hero.p}💥 | ${hero.m}❤</div>
${pedestalBonus ? `<div style="font-size:0.8rem;color:#fbbf24;margin-bottom:0.5rem">🗿 ${pedestalBonus}</div>` : ''}
<div style="font-size:0.7rem">${sigilsHTML}</div>
</div>`;
});
heroCardsHTML += '</div>';

v.innerHTML = `
<div style="max-width:700px;margin:0 auto;padding:2rem;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);border-radius:12px;border:3px solid #22c55e;color:#fff;text-align:center">
<h2 style="margin-bottom:0.5rem;color:#22c55e;font-size:1.8rem">🏆 Congratulations! 🏆</h2>
<p style="margin-bottom:1.5rem;font-size:1.1rem">You've cleared Standard Mode!</p>
${heroCardsHTML}
<p style="margin-top:1.5rem;font-size:0.9rem;color:#94a3b8">Your heroes rest peacefully in Ribbleton...</p>
<div style="margin-top:2rem">
<button class="btn" onclick="window.heroCardsInterstitialComplete()" style="padding:1rem 2rem;font-size:1.1rem">Continue</button>
</div>
</div>`;

window.heroCardsInterstitialComplete = onComplete;
}

function showFirstVictoryPedestal(onComplete) {
// Show a simplified pedestal UI during the first victory cutscene
const v = document.getElementById('gameView');
const heroIcons = {'Warrior': '⚔', 'Tank': '🛡', 'Mage': '📖', 'Healer': '✚'};
const stats = ['POW', 'HP'];

// Get earned figurines - only heroes who earned one this run
const earnedFigurines = window.earnedFigurines || [];
const totalToSlot = earnedFigurines.length;

// Track which heroes have slotted THIS session (to enforce 1 figurine per hero per victory)
if(!window.heroesSlottedThisVictory) window.heroesSlottedThisVictory = [];
const slotsThisSession = window.heroesSlottedThisVictory.length;

// Only show heroes who earned figurines
const heroesToShow = earnedFigurines.length > 0 ? earnedFigurines : ['Warrior', 'Tank', 'Mage', 'Healer'];

// Build slot grid - only for heroes who earned figurines
let slotsHTML = `<div style="display:grid;grid-template-columns:repeat(${Math.min(heroesToShow.length, 4)},1fr);gap:1rem;margin:1rem 0">`;
stats.forEach((stat) => {
heroesToShow.forEach((hero) => {
const slotted = S.pedestal.find(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode);
const isSlotted = !!slotted;
// Can only slot if: hero earned a figurine AND this slot not filled AND hero hasn't slotted THIS victory session
const heroAlreadySlottedThisVictory = window.heroesSlottedThisVictory.includes(hero);
const canSlot = earnedFigurines.includes(hero) && !isSlotted && !heroAlreadySlottedThisVictory;

slotsHTML += `
<div style="background:${isSlotted ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'};border:2px solid ${isSlotted ? '#fbbf24' : 'rgba(255,255,255,0.3)'};border-radius:8px;padding:1rem;text-align:center;${canSlot ? 'cursor:pointer' : 'opacity:0.5'}" onclick="${canSlot ? `slotFirstVicFigurine('${hero}','${stat}')` : ''}">
<div style="font-size:1.5rem">${heroIcons[hero] || '🐸'}</div>
<div style="font-size:0.8rem;font-weight:bold">${hero}</div>
<div style="font-size:0.7rem;color:#94a3b8">${stat === 'POW' ? '+1 POW' : '+5 HP'}</div>
${isSlotted ? '<div style="color:#fbbf24;font-size:0.8rem;margin-top:0.5rem">✓ Slotted</div>' : (canSlot ? '<div style="color:#64748b;font-size:0.8rem;margin-top:0.5rem">Click to slot</div>' : '')}
</div>`;
});
});
slotsHTML += '</div>';

// Check if all earned figurines have been slotted
const allSlotted = slotsThisSession >= totalToSlot;
const buttonDisabled = !allSlotted && totalToSlot > 0;

v.innerHTML = `
<div style="max-width:800px;margin:0 auto;padding:2rem;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);border-radius:12px;border:3px solid #fbbf24;color:#fff">
<h2 style="text-align:center;margin-bottom:1rem;color:#fbbf24">⚱️ Slot Your Figurines!</h2>
<p style="text-align:center;margin-bottom:1rem;font-size:0.95rem">Each surviving hero earns a figurine! Place them to permanently boost that hero's stats.</p>
<p style="text-align:center;margin-bottom:1rem;font-size:1.1rem;color:${allSlotted ? '#22c55e' : '#fbbf24'}">
<strong>Figurines placed: ${slotsThisSession}/${totalToSlot}</strong>
</p>
${slotsHTML}
<div style="text-align:center;margin-top:1.5rem">
<button class="btn" onclick="window.firstVicPedestalComplete()" style="padding:1rem 2rem;font-size:1.1rem" ${buttonDisabled ? 'disabled' : ''}>
${buttonDisabled ? `Slot all ${totalToSlot} figurines to continue` : 'Continue Story'}
</button>
</div>
</div>`;

window.firstVicPedestalComplete = onComplete;
}

function slotFirstVicFigurine(hero, stat) {
if(S.pedestal.find(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode)) {
toast('Slot already filled!');
return;
}
// Check if this hero already slotted their figurine THIS victory session
if(window.heroesSlottedThisVictory && window.heroesSlottedThisVictory.includes(hero)) {
toast(`${hero} already placed their figurine!`);
return;
}
const slotsUsed = S.pedestal.filter(p => p.mode === S.gameMode).length;
if(slotsUsed >= 8) {
toast('All 8 slots filled! Remove a figurine first.');
return;
}
const existingCount = S.pedestal.filter(p => p.hero === hero && p.mode === S.gameMode).length;
if(existingCount >= 2) {
toast(`${hero} already has 2 figurines in ${S.gameMode} mode!`, 1800);
return;
}
S.pedestal.push({hero, stat, mode: S.gameMode, source: 'hero'});
// Track that this hero has slotted their figurine this victory session
if(!window.heroesSlottedThisVictory) window.heroesSlottedThisVictory = [];
window.heroesSlottedThisVictory.push(hero);
savePermanent();
toast(`${hero} ${stat} figurine placed!`, 1200);
showFirstVictoryPedestal(window.firstVicPedestalComplete);
}

function removeFirstVicFigurine(hero, stat) {
const idx = S.pedestal.findIndex(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode);
if(idx >= 0) {
S.pedestal.splice(idx, 1);
savePermanent();
toast(`${hero} ${stat} figurine removed!`);
showFirstVictoryPedestal(window.firstVicPedestalComplete);
}
}

function showFUVictoryCredits() {
const v = document.getElementById('gameView');

// Check if this is a Tapo victory (gated behind beating FU with Tapo)
const tapoInParty = S.heroes.some(h => (h.base || h.n) === 'Tapo');

v.innerHTML = `
<div style="max-width:600px;margin:2rem auto;padding:2rem;background:linear-gradient(135deg,#1e1b4b 0%,#7c2d12 100%);border-radius:12px;border:3px solid #22c55e;color:#fff">
<h1 style="text-align:center;margin-bottom:2rem;font-size:2.5rem">🔥 FROGGED UP MODE CONQUERED! 🔥</h1>

<div style="text-align:center;margin-bottom:2rem;font-size:1.2rem;line-height:1.8">
<p>Holy frog. You defeated the ${tapoInParty ? '(second) ' : ''}hardest challenge in FROGGLE.</p>
<p style="margin-top:1rem">Thank you for playing. No other thank yous really matter - <strong>YOU</strong>, the Player, deserve all the thanks in the world.</p>
${!tapoInParty ? `<p style="margin-top:1.5rem;font-style:italic;color:#fbbf24">Now, think you can beat the FROGGED UP Flydra with Tapo in your party?</p>` : ''}
<p style="font-size:2rem;margin:2rem 0">❤️</p>
</div>

<div style="background:rgba(0,0,0,0.3);padding:1.5rem;border-radius:8px;margin:2rem 0">
<h3 style="text-align:center;margin-bottom:1rem;color:#22c55e">FROGGLE</h3>
<div style="text-align:center;font-size:0.9rem;line-height:2;opacity:0.9">
<p><strong>A DubsPubs game by Preston Wesley Evans</strong></p>
<p>Design, Art, & Code: Preston + Claude</p>
<p>Playtesting: Michael Griffin, Charlie Schmidt, Carolyn Powell, Matt Sutz, Ryan Evertz</p>
<p>Inspiration: Inscryption, Slay the Spire, Balatro, and too much coffee</p>
<p>Sanity: Erin Keif, Adal Rfai, JPC, Odell Brewing</p>
<p>Support: Lisa Evans</p>
</div>
</div>

<div style="background:rgba(251,191,36,0.2);padding:1.5rem;border-radius:8px;margin:2rem 0;border:2px solid #22c55e">
<h3 style="text-align:center;margin-bottom:1rem">🎉 TAPO UNLOCKED! 🎉</h3>
<img src="assets/tapo.png" alt="Tapo the Tadpole" style="max-width:200px;height:auto;display:block;margin:1rem auto;border-radius:8px">
<p style="text-align:center;margin-top:1rem">Tapo the Tadpole is now available as a playable hero!</p>
<p style="text-align:center;font-size:0.9rem;opacity:0.8;margin-top:0.5rem">Stats: 1 POW, 1 HP • Starts with D20 + any upgraded passives</p>
<p style="text-align:center;font-size:0.85rem;opacity:0.6;margin-top:0.5rem;font-style:italic">(Glass cannon mode activated)</p>
</div>

<div style="text-align:center">
<button class="btn safe" onclick="showStatueRoom()" style="padding:1rem 2rem;font-size:1.1rem;margin-bottom:1rem">Place Figurines</button>
<button class="btn" onclick="title()" style="padding:1rem 2rem;font-size:1.1rem">Play Again</button>
</div>
</div>`;
}

function showTapoVictoryMessage() {
const v = document.getElementById('gameView');
v.innerHTML = `
<style>
@keyframes tapoSignatureVictory {
  /* Double jump RIGHT */
  0% { transform: translateY(0) scaleX(1); }
  10% { transform: translateY(-30px) scaleX(1); }
  20% { transform: translateY(0) scaleX(1); }
  30% { transform: translateY(-40px) scaleX(1); }
  40% { transform: translateY(0) scaleX(1); }
  /* Flip to LEFT */
  45% { transform: translateY(-15px) scaleX(0); }
  50% { transform: translateY(0) scaleX(-1); }
  /* Double jump LEFT */
  60% { transform: translateY(-30px) scaleX(-1); }
  70% { transform: translateY(0) scaleX(-1); }
  80% { transform: translateY(-40px) scaleX(-1); }
  90% { transform: translateY(0) scaleX(-1); }
  /* Flip back to RIGHT */
  95% { transform: translateY(-15px) scaleX(0); }
  100% { transform: translateY(0) scaleX(1); }
}
</style>
<div style="max-width:700px;margin:2rem auto;padding:3rem;background:linear-gradient(135deg,#22c55e 0%,#10b981 50%,#059669 100%);border-radius:16px;border:4px solid #3b82f6;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
<h1 style="text-align:center;margin-bottom:2rem;font-size:3rem;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">🏆 VICTORY! 🏆</h1>

<div style="text-align:center;margin:2rem 0">
<div style="display:inline-block;animation:tapoSignatureVictory 4.8s ease-in-out infinite">
<img src="assets/tapo-nobg.png" alt="Tapo celebrating" style="max-width:250px;height:auto;display:block;margin:0 auto 2rem auto">
</div>
</div>

<div style="background:rgba(0,0,0,0.2);padding:2rem;border-radius:12px;margin:2rem 0;border:2px solid rgba(251,191,36,0.5)">
<p style="text-align:center;font-size:1.3rem;line-height:2;margin-bottom:1.5rem;font-weight:500">
Holy frog. I can't believe you put this much time into my silly little game.
</p>
<p style="text-align:center;font-size:1.3rem;line-height:2;margin-bottom:1.5rem;font-weight:500">
From the bottom of my heart, thank you for playing.
</p>
<p style="text-align:center;font-size:1.3rem;line-height:2;font-weight:500">
I hope you had fun!
</p>
<p style="text-align:center;font-size:1.1rem;margin-top:2rem;font-style:italic;opacity:0.9">
-Preston
</p>
</div>

<div style="text-align:center;font-size:2.5rem;margin:2rem 0">
❤️🐸❤️
</div>

<div style="text-align:center;margin-top:2rem">
${window.earnedFigurines && window.earnedFigurines.length > 0 ?
  '<button class="btn" onclick="showStatueRoom()" style="background:#3b82f6;color:#000;padding:1rem 2rem;font-size:1.1rem;margin-bottom:1rem;font-weight:bold">Place Figurines</button><br>' :
  ''}
<button class="btn" onclick="title()" style="background:#fff;color:#22c55e;padding:1rem 2rem;font-size:1.1rem;font-weight:bold">Play Again</button>
</div>
</div>`;
}

function showStatueRoom() {
// This redirects to the existing Pedestal UI
showTutorialPop('pedestal_first_placement', "Welcome to the Pedestal! Figurines are rewards for heroes who survive to victory. Place them here to permanently boost that hero's stats. Each hero can earn up to 2 figurines per difficulty mode.", () => {
showPedestal();
});
}

function showSimpleVictoryScreen() {
// JUICE: Funky frog beat for victory celebration (after fanfare)
setTimeout(() => ProceduralMusic.startTitleBeat(), 2000);
const v = document.getElementById('gameView');
let html = `
<h1 style="text-align:center;margin:2rem 0;font-size:2.5rem">🏆 VICTORY! 🏆</h1>`;

if(S.gameMode === 'fu') {
html += `<p style="text-align:center;margin-bottom:2rem;font-size:1.2rem">You conquered the Frogged Up realm once again!<br>Impressive.</p>`;
} else {
html += `<img src="assets/tapo.png" alt="Tapo saved!" style="max-width:100%;height:auto;max-width:400px;margin:1rem auto;display:block;border-radius:8px;border:3px solid #000">`;
html += `<p style="text-align:center;margin-bottom:1rem;font-size:1.2rem;font-weight:bold">You saved Tapo the Tadpole!</p>`;

// Check if they've explored FU mode and show conditional text
const hasExploredFU = (S.pondHistory || []).some(r => r.gameMode === 'fu');
if(hasExploredFU) {
html += `<p style="text-align:center;margin-bottom:2rem;font-size:1rem;color:#22c55e">Ready to try FROGGED UP mode again?</p>`;
} else {
html += `<p style="text-align:center;margin-bottom:2rem;font-size:1rem;color:#64748b">Have you explored the green portal in the statue room yet?</p>`;
}
}

if(window.earnedFigurines && window.earnedFigurines.length > 0) {
html += `<div style="background:rgba(251,191,36,0.1);padding:1rem;border-radius:8px;margin:1rem auto;max-width:500px">
<h3 style="text-align:center;margin-bottom:0.5rem">🏆 Hero Figurines Earned! 🏆</h3>
<p style="text-align:center">The following heroes can place figurines (Max 2 per frog):</p>
<ul style="list-style:none;padding:0;text-align:center">`;
window.earnedFigurines.forEach(name => {
html += `<li style="margin:0.5rem 0;font-weight:bold">${name}</li>`;
});
html += `</ul></div>`;
}

// Show gold reward for maxed heroes
if(window.maxedHeroesGold && window.maxedHeroesGold.heroes.length > 0) {
html += `<div style="background:rgba(234,179,8,0.15);padding:1rem;border-radius:8px;margin:1rem auto;max-width:500px;border:2px solid #fbbf24">
<p style="text-align:center;margin:0;color:#fbbf24;font-weight:bold">Each hero can earn only 2 statues - take <span style="color:#22c55e">${window.maxedHeroesGold.gold} gold</span> instead for ${window.maxedHeroesGold.heroes.length === 1 ? window.maxedHeroesGold.heroes[0] + ' who is' : window.maxedHeroesGold.heroes.join(' & ') + ' who are'} already maxed!</p>
</div>`;
}

html += `<div style="text-align:center;margin-top:2rem">
<button class="btn" onclick="showStatueRoom()" style="padding:1rem 2rem;font-size:1.1rem;margin-right:1rem">Place Figurines</button>
<button class="btn secondary" onclick="showRibbleton()" style="padding:1rem 2rem;font-size:1.1rem">Return to Ribbleton</button>
</div>`;

v.innerHTML = html;
}

// ===== QUEST BOARD SYSTEM =====
// Quest definitions - all quests are passive (no acceptance required)
const QUESTS = {
  // === TUTORIAL QUEST (Only visible if player did the tutorial) ===
  fly_muncher: {
    name: 'Fly Muncher',
    desc: 'Munch on a fly during the tutorial',
    reward: 1,
    category: 'learning',
    unlock: () => S.tutorialFlags.tutorial_fly_munched,  // Only shows if they did the tutorial and killed a fly
    check: () => S.tutorialFlags.tutorial_fly_munched
  },

  // === LEARNING QUESTS (Always visible) ===
  first_blood: {
    name: 'First Blood',
    desc: 'Defeat your first enemy',
    reward: 5,
    category: 'learning',
    check: () => S.questProgress.enemiesKilled >= 1
  },
  tactical_roller: {
    name: 'Tactical Roller',
    desc: 'Use the D20 sigil',
    reward: 5,
    category: 'learning',
    check: () => S.questProgress.d20Used
  },
  shield_bearer: {
    name: 'Shield Bearer',
    desc: 'Apply a shield to any hero',
    reward: 5,
    category: 'learning',
    check: () => S.questProgress.shieldApplied
  },
  healers_touch: {
    name: "Healer's Touch",
    desc: 'Heal any hero',
    reward: 5,
    category: 'learning',
    check: () => S.questProgress.healUsed
  },
  survivor: {
    name: 'Survivor',
    desc: 'Reach Floor 3',
    reward: 5,
    category: 'learning',
    check: () => S.questProgress.highestFloor >= 3
  },
  battle_hardened: {
    name: 'Battle Hardened',
    desc: 'Reach Floor 5',
    reward: 10,
    category: 'learning',
    check: () => S.questProgress.highestFloor >= 5
  },

  // === HERO EXPLORATION (Unlock after 1 run) ===
  warrior_path: {
    name: "Warrior's Path",
    desc: 'Play a run with Warrior',
    reward: 5,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1 || S.runsAttempted >= 2,
    check: () => S.questProgress.heroesPlayed.Warrior >= 1
  },
  tank_path: {
    name: "Tank's Path",
    desc: 'Play a run with Tank',
    reward: 5,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1 || S.runsAttempted >= 2,
    check: () => S.questProgress.heroesPlayed.Tank >= 1
  },
  mage_path: {
    name: "Mage's Path",
    desc: 'Play a run with Mage',
    reward: 5,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1 || S.runsAttempted >= 2,
    check: () => S.questProgress.heroesPlayed.Mage >= 1
  },
  healer_path: {
    name: "Healer's Path",
    desc: 'Play a run with Healer',
    reward: 5,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1 || S.runsAttempted >= 2,
    check: () => S.questProgress.heroesPlayed.Healer >= 1
  },
  diverse_squad: {
    name: 'Diverse Squad',
    desc: 'Play with all 4 base heroes',
    reward: 10,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1 || S.runsAttempted >= 2,
    check: () => S.questProgress.heroesPlayed.Warrior >= 1 && S.questProgress.heroesPlayed.Tank >= 1 && S.questProgress.heroesPlayed.Mage >= 1 && S.questProgress.heroesPlayed.Healer >= 1
  },
  champion_warrior: {
    name: 'Champion: Warrior',
    desc: 'Win a run with Warrior',
    reward: 20,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1,
    check: () => S.questProgress.heroWins.Warrior >= 1
  },
  champion_tank: {
    name: 'Champion: Tank',
    desc: 'Win a run with Tank',
    reward: 20,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1,
    check: () => S.questProgress.heroWins.Tank >= 1
  },
  champion_mage: {
    name: 'Champion: Mage',
    desc: 'Win a run with Mage',
    reward: 20,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1,
    check: () => S.questProgress.heroWins.Mage >= 1
  },
  champion_healer: {
    name: 'Champion: Healer',
    desc: 'Win a run with Healer',
    reward: 20,
    category: 'heroes',
    unlock: () => S.questProgress.totalRunsCompleted >= 1,
    check: () => S.questProgress.heroWins.Healer >= 1
  },
  army_of_frogs: {
    name: 'Army of Frogs',
    desc: 'Win with all 4 base heroes',
    reward: 20,
    category: 'heroes',
    unlock: () => S.questProgress.standardWins >= 1,
    check: () => S.questProgress.heroWins.Warrior >= 1 && S.questProgress.heroWins.Tank >= 1 && S.questProgress.heroWins.Mage >= 1 && S.questProgress.heroWins.Healer >= 1
  },

  // === NEUTRAL EXPLORATION (Unlock after Floor 2) ===
  neutral_shop: {
    name: 'The Shop',
    desc: 'Complete Shopkeeper encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.shopkeeper
  },
  neutral_well: {
    name: 'Make a Wish',
    desc: 'Complete Wishing Well encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.wishingwell
  },
  neutral_chest: {
    name: 'Treasure Hunter',
    desc: 'Complete Treasure Chest encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.treasurechest
  },
  neutral_wizard: {
    name: "Wizard's Test",
    desc: 'Complete Wizard encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.wizard
  },
  neutral_oracle: {
    name: "Oracle's Wisdom",
    desc: 'Complete Oracle encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.oracle
  },
  neutral_camp: {
    name: 'Camp Visitor',
    desc: 'Complete Encampment encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.encampment
  },
  neutral_gambling: {
    name: 'High Roller',
    desc: 'Complete Gambling Den encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.gambling
  },
  neutral_ghost: {
    name: 'Ghost Whisperer',
    desc: 'Complete Ghost Boys encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.ghost
  },
  neutral_royal: {
    name: 'Royal Audience',
    desc: 'Complete Royal Court encounter',
    reward: 5,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 2,
    check: () => S.questProgress.neutralsCompleted.royal
  },
  neutral_explorer: {
    name: 'Neutral Explorer',
    desc: 'Complete all Stage 1 neutrals',
    reward: 20,
    category: 'neutrals',
    unlock: () => S.questProgress.highestFloor >= 4,
    check: () => Object.values(S.questProgress.neutralsCompleted).every(v => v)
  },

  // === PROGRESSION MILESTONES ===
  dragon_slayer: {
    name: 'Dragon Slayer',
    desc: 'Defeat a Dragon',
    reward: 10,
    category: 'milestones',
    unlock: () => S.questProgress.highestFloor >= 10,
    check: () => S.questProgress.enemyTypesDefeated.Dragon
  },
  flydra_hunter: {
    name: 'Flydra Hunter',
    desc: 'Defeat a Flydra head',
    reward: 10,
    category: 'milestones',
    unlock: () => S.questProgress.highestFloor >= 15,
    check: () => S.questProgress.enemyTypesDefeated.Flydra
  },
  first_victory: {
    name: 'First Victory',
    desc: 'Complete Floor 20 (Standard)',
    reward: 20,
    category: 'milestones',
    check: () => S.questProgress.standardWins >= 1
  },
  eternal_power: {
    name: 'Eternal Power',
    desc: 'Purchase a permanent upgrade',
    reward: 10,
    category: 'milestones',
    unlock: () => S.runsAttempted >= 2,
    check: () => S.questProgress.purchasedUpgrade
  },
  spreading_wealth: {
    name: 'Spreading the Wealth',
    desc: 'Upgrade all sigils to L1',
    reward: 20,
    category: 'milestones',
    unlock: () => S.questProgress.purchasedUpgrade,
    check: () => Object.values(S.sig).every(v => v >= 1)
  },

  // === COMBAT MASTERY (Unlock after Floor 10) ===
  combo_striker: {
    name: 'Combo Striker',
    desc: 'Deal 10+ damage in one action',
    reward: 10,
    category: 'combat',
    unlock: () => S.questProgress.highestFloor >= 10,
    check: () => S.questProgress.maxDamageOneAction >= 10
  },
  multi_target: {
    name: 'Multi-Target',
    desc: 'Hit 3+ targets with one action',
    reward: 10,
    category: 'combat',
    unlock: () => S.questProgress.highestFloor >= 10,
    check: () => S.questProgress.maxTargetsOneAction >= 3
  },
  ghost_walk: {
    name: 'Ghost Walk',
    desc: 'Block damage with Ghost charges',
    reward: 10,
    category: 'combat',
    unlock: () => S.questProgress.highestFloor >= 10,
    check: () => S.questProgress.ghostBlocked
  },
  grappler: {
    name: 'Grappler',
    desc: 'Stun an enemy with Grapple',
    reward: 10,
    category: 'combat',
    unlock: () => S.questProgress.highestFloor >= 10,
    check: () => S.questProgress.grappleUsed
  },
  alpha_strike: {
    name: 'Alpha Strike',
    desc: 'Grant bonus actions with Alpha',
    reward: 10,
    category: 'combat',
    unlock: () => S.questProgress.highestFloor >= 10,
    check: () => S.questProgress.alphaUsed
  },
  last_stand_hero: {
    name: 'Last Stand Hero',
    desc: 'Survive a round in Last Stand',
    reward: 10,
    category: 'combat',
    unlock: () => S.questProgress.highestFloor >= 10,
    check: () => S.questProgress.lastStandSurvived
  },

  // === REPEATABLE/SCALING QUESTS ===
  slayer_1: {
    name: 'Slayer I',
    desc: 'Defeat 25 enemies',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.highestFloor >= 5,
    check: () => S.questProgress.enemiesKilled >= 25 && S.questProgress.slayerTier === 0
  },
  slayer_2: {
    name: 'Slayer II',
    desc: 'Defeat 100 enemies',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.slayerTier >= 1,
    check: () => S.questProgress.enemiesKilled >= 100 && S.questProgress.slayerTier === 1
  },
  slayer_3: {
    name: 'Slayer III',
    desc: 'Defeat 250 enemies',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.slayerTier >= 2,
    check: () => S.questProgress.enemiesKilled >= 250 && S.questProgress.slayerTier === 2
  },
  slayer_4: {
    name: 'Slayer IV',
    desc: 'Defeat 500 enemies',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.slayerTier >= 3,
    check: () => S.questProgress.enemiesKilled >= 500 && S.questProgress.slayerTier === 3
  },
  slayer_5: {
    name: 'Slayer V',
    desc: 'Defeat 1000 enemies',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.slayerTier >= 4,
    check: () => S.questProgress.enemiesKilled >= 1000 && S.questProgress.slayerTier === 4
  },
  gold_digger_1: {
    name: 'Gold Digger I',
    desc: 'Earn 250G total',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.highestFloor >= 5,
    check: () => S.questProgress.totalGoldEarned >= 250 && S.questProgress.goldDiggerTier === 0
  },
  gold_digger_2: {
    name: 'Gold Digger II',
    desc: 'Earn 1000G total',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.goldDiggerTier >= 1,
    check: () => S.questProgress.totalGoldEarned >= 1000 && S.questProgress.goldDiggerTier === 1
  },
  gold_digger_3: {
    name: 'Gold Digger III',
    desc: 'Earn 2500G total',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.goldDiggerTier >= 2,
    check: () => S.questProgress.totalGoldEarned >= 2500 && S.questProgress.goldDiggerTier === 2
  },
  veteran_1: {
    name: 'Veteran I',
    desc: 'Complete 5 runs',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.totalRunsCompleted >= 1,
    check: () => S.questProgress.totalRunsCompleted >= 5 && S.questProgress.veteranTier === 0
  },
  veteran_2: {
    name: 'Veteran II',
    desc: 'Complete 15 runs',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.veteranTier >= 1,
    check: () => S.questProgress.totalRunsCompleted >= 15 && S.questProgress.veteranTier === 1
  },
  veteran_3: {
    name: 'Veteran III',
    desc: 'Complete 30 runs',
    reward: 20,
    category: 'repeatable',
    unlock: () => S.questProgress.veteranTier >= 2,
    check: () => S.questProgress.totalRunsCompleted >= 30 && S.questProgress.veteranTier === 2
  },

  // === FU MODE QUESTS (Unlock after FU unlock) ===
  fu_taste: {
    name: 'This is Frogged Up',
    desc: 'Complete Floor 1 in FU mode',
    reward: 20,
    category: 'fu',
    unlock: () => S.fuUnlocked,
    check: () => (S.questProgress.highestFUFloor || 0) >= 1
  },
  recruiter: {
    name: 'Recruiter',
    desc: 'Recruit an enemy',
    reward: 10,
    category: 'fu',
    unlock: () => S.fuUnlocked,
    check: () => S.questProgress.maxRecruitsHeld >= 1
  },
  squad_goals: {
    name: 'Squad Goals',
    desc: 'Have 3 recruits at once',
    reward: 20,
    category: 'fu',
    unlock: () => S.questProgress.maxRecruitsHeld >= 1,
    check: () => S.questProgress.maxRecruitsHeld >= 3
  },
  fu_champion: {
    name: 'FU Champion',
    desc: 'Complete FU mode',
    reward: 20,
    category: 'fu',
    unlock: () => S.fuUnlocked,
    check: () => S.questProgress.fuWins >= 1
  },

  // === SECRET/HIDDEN QUESTS ===
  tapos_hero: {
    name: "Tapo's Hero",
    desc: 'Unlock Tapo',
    reward: 20,
    category: 'secret',
    unlock: () => S.fuUnlocked,
    check: () => S.tapoUnlocked
  },
  bruce_willis: {
    name: 'Bruce & Willis',
    desc: 'Help the Ghost Boys realize something',
    reward: 10,
    category: 'secret',
    unlock: () => S.questProgress.neutralsCompleted.ghost,
    check: () => S.ghostBoysConverted
  },
  true_champion: {
    name: 'True Champion',
    desc: 'Win FU mode with Tapo',
    reward: 20,
    category: 'secret',
    unlock: () => S.tapoUnlocked,
    check: () => S.questProgress.tapoFUWins >= 1
  },
  all_tapo: {
    name: "Tapo's Triumph",
    desc: 'Win with all 3 heroes as Tapo',
    reward: 20,
    category: 'secret',
    unlock: () => S.questProgress.heroWins.Tapo >= 1,
    check: () => S.questProgress.allTapoWins >= 1
  }
};

// Category display names and order
const QUEST_CATEGORIES = {
  learning: { name: 'Getting Started', icon: '📚', order: 1 },
  heroes: { name: 'Hero Exploration', icon: '🦸', order: 2 },
  neutrals: { name: 'Neutral Encounters', icon: '🏕️', order: 3 },
  milestones: { name: 'Milestones', icon: '🏆', order: 4 },
  combat: { name: 'Combat Mastery', icon: '⚔️', order: 5 },
  repeatable: { name: 'Ongoing Challenges', icon: '🔄', order: 6 },
  fu: { name: 'Frogged Up', icon: '🔥', order: 7 },
  secret: { name: 'Secrets', icon: '🔮', order: 8 }
};

// Check if a quest is unlocked (visible)
function isQuestUnlocked(questId) {
  const quest = QUESTS[questId];
  if(!quest) return false;
  // Learning quests always visible
  if(quest.category === 'learning') return true;
  // Check unlock condition if exists
  if(quest.unlock && !quest.unlock()) return false;
  return true;
}

// Check if a quest is complete (can be claimed)
function isQuestComplete(questId) {
  const quest = QUESTS[questId];
  if(!quest) return false;
  if(S.questsClaimed[questId]) return false; // Already claimed
  return quest.check();
}

// Get count of claimable quests
function getClaimableQuestCount() {
  let count = 0;
  for(const questId in QUESTS) {
    if(isQuestUnlocked(questId) && isQuestComplete(questId) && !S.questsClaimed[questId]) {
      count++;
    }
  }
  return count;
}

// Claim a quest reward
function claimQuest(questId) {
  const quest = QUESTS[questId];
  if(!quest || S.questsClaimed[questId]) return;
  if(!isQuestComplete(questId)) return;

  // Award gold
  S.gold += quest.reward;
  S.questsClaimed[questId] = true;
  S.questsCompleted[questId] = true;

  // Handle tier progression for repeatable quests
  if(questId.startsWith('slayer_')) {
    S.questProgress.slayerTier = parseInt(questId.split('_')[1]);
  } else if(questId.startsWith('gold_digger_')) {
    S.questProgress.goldDiggerTier = parseInt(questId.split('_')[1]);
  } else if(questId.startsWith('veteran_')) {
    S.questProgress.veteranTier = parseInt(questId.split('_')[1]);
  }

  savePermanent();
  SoundFX.play('coin');
  toast(`+${quest.reward}G from "${quest.name}"!`);

  // Refresh quest board
  showQuestBoard();
}

// Show Quest Board UI
function showQuestBoard() {
  const v = document.getElementById('gameView');

  // Group quests by category
  const questsByCategory = {};
  for(const questId in QUESTS) {
    const quest = QUESTS[questId];
    if(!questsByCategory[quest.category]) {
      questsByCategory[quest.category] = [];
    }
    questsByCategory[quest.category].push({ id: questId, ...quest });
  }

  // Sort categories by order
  const sortedCategories = Object.keys(questsByCategory).sort((a, b) =>
    (QUEST_CATEGORIES[a]?.order || 99) - (QUEST_CATEGORIES[b]?.order || 99)
  );

  // Calculate pending gold from unclaimed completed quests
  let pendingGold = 0;
  for(const questId in QUESTS) {
    if(isQuestComplete(questId) && !S.questsClaimed[questId]) {
      pendingGold += QUESTS[questId].reward;
    }
  }

  let html = `
<style>
.quest-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin: 0.25rem 0;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.quest-item.complete {
  border-color: #22c55e;
  background: rgba(34,197,94,0.15);
}
.quest-item.claimed {
  opacity: 0.5;
  border-color: #666;
}
.quest-item.locked {
  opacity: 0.4;
  filter: grayscale(0.5);
}
.quest-reward {
  font-weight: bold;
  color: #fbbf24;
  min-width: 50px;
  text-align: right;
}
.quest-claim-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: 2px solid #000;
  border-radius: 4px;
  padding: 0.25rem 0.75rem;
  font-weight: bold;
  cursor: pointer;
  color: #fff;
  font-size: 0.85rem;
  animation: pulse-glow 1.5s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px #22c55e; }
  50% { box-shadow: 0 0 15px #22c55e; }
}
.quest-category {
  margin-bottom: 1rem;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  padding: 0.75rem;
}
.quest-category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  padding-bottom: 0.5rem;
}
</style>

<div style="max-width:600px;margin:0 auto;padding:1rem">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
  <h1 style="margin:0;font-size:1.8rem;color:#fbbf24">📋 Quest Board</h1>
  <div style="font-size:1rem;color:#22c55e">💰 ${S.gold}G${pendingGold > 0 ? ` <span style="opacity:0.8">(+${pendingGold}G)</span>` : ''}</div>
</div>

<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem;opacity:0.8">Complete quests to earn gold rewards!</p>
`;

  for(const category of sortedCategories) {
    const quests = questsByCategory[category];
    const catInfo = QUEST_CATEGORIES[category] || { name: category, icon: '📋' };

    // Count unlocked quests in this category
    const unlockedQuests = quests.filter(q => isQuestUnlocked(q.id));
    if(unlockedQuests.length === 0) continue; // Skip empty categories

    // Count completed/claimed
    const claimable = unlockedQuests.filter(q => isQuestComplete(q.id) && !S.questsClaimed[q.id]).length;

    html += `
<div class="quest-category">
  <div class="quest-category-header">
    <span>${catInfo.icon}</span>
    <span>${catInfo.name}</span>
    ${claimable > 0 ? `<span style="background:#22c55e;color:#000;padding:0 0.5rem;border-radius:10px;font-size:0.8rem;margin-left:auto">${claimable} ready</span>` : ''}
  </div>`;

    for(const quest of quests) {
      const unlocked = isQuestUnlocked(quest.id);
      const complete = isQuestComplete(quest.id);
      const claimed = S.questsClaimed[quest.id];

      if(!unlocked) continue; // Don't show locked quests

      let statusClass = '';
      let statusText = '';
      if(claimed) {
        statusClass = 'claimed';
        statusText = '✓ Claimed';
      } else if(complete) {
        statusClass = 'complete';
      }

      html += `
<div class="quest-item ${statusClass}">
  <div>
    <div style="font-weight:bold;font-size:0.95rem">${quest.name}</div>
    <div style="font-size:0.8rem;opacity:0.8">${quest.desc}</div>
  </div>
  <div style="display:flex;align-items:center;gap:0.5rem">
    ${claimed ? `<span style="color:#5a5550;font-size:0.85rem">${statusText}</span>` :
      complete ? `<button class="quest-claim-btn" onclick="claimQuest('${quest.id}')">Claim ${quest.reward}G</button>` :
      `<span class="quest-reward">${quest.reward}G</span>`}
  </div>
</div>`;
    }

    html += `</div>`;
  }

  html += `
<div style="text-align:center;margin-top:1.5rem">
  <button class="btn" onclick="showRibbleton()" style="padding:0.75rem 2rem">Back to Ribbleton</button>
</div>
</div>`;

  v.innerHTML = html;
}

// ===== RIBBLETON HUB =====
function showRibbleton() {
// Show game header in Ribbleton with location label
S.inRibbleton = true;
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';
// JUICE: Froggy beat for Ribbleton hub
ProceduralMusic.startFroggyBeat();
upd(); // Update header to show "Ribbleton"

const v = document.getElementById('gameView');

// Show tutorial for first-time visitors to Ribbleton hub (delayed to ensure screen is rendered first)
const isFirstVisit = !S.tutorialFlags.ribbleton_hub_intro;
if(isFirstVisit && !S.helpTipsDisabled) {
  setTimeout(() => {
    showTutorialPop('ribbleton_hub_intro', "Welcome home to Ribbleton! This is your safe haven between adventures. Click the glowing red portal on the right to begin your next rescue mission and save Tapo!");
  }, 500);
}

let html = `
<style>
@keyframes ribbleton-portal-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 30px #dc2626; }
  50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 50px #dc2626; }
}
@keyframes ribbleton-portal-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>
<div class="full-screen-content" style="position:relative;width:100%;overflow:hidden">
<!-- Full-page background image -->
<img src="assets/ribbleton.png" alt="" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0">

<!-- Title overlay at top -->
<div style="position:absolute;top:0;left:0;right:0;z-index:10;padding:1rem;background:linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)">
<h1 style="text-align:center;margin:0;font-size:2rem;color:#22c55e;text-shadow:2px 2px 6px rgba(0,0,0,0.9), 0 0 20px rgba(34,197,94,0.5)">
🐸 Welcome Home to Ribbleton! 🐸
</h1>
</div>


<!-- Lilypad Pond (bottom-left) - Blue circle portal, same size as red portal -->
${S.pondHistory && S.pondHistory.length > 0 ? `
<div style="position:absolute;bottom:1rem;left:1rem;z-index:10">
<div onclick="showPond()" style="cursor:pointer;transition:transform 0.2s;text-align:center"
     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
     title="Reflect on your adventures at the Lilypad Pond">
  <div style="width:120px;height:120px;position:relative;border-radius:50%;background:radial-gradient(circle, #3b82f6, #1e3a8a);animation:ribbleton-portal-pulse 1.2s ease-in-out infinite;box-shadow:0 0 40px #3b82f6">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:4rem">🪷</div>
  </div>
  <p style="margin-top:0.5rem;font-size:1rem;font-weight:bold;color:#fff;text-shadow:2px 2px 4px rgba(0,0,0,0.9);background:rgba(59,130,246,0.8);padding:0.25rem 0.75rem;border-radius:6px;border:2px solid #3b82f6">🌿 The Pond</p>
</div>
</div>
` : ''}

<!-- Red Portal (bottom-right) - Always Available -->
<div style="position:absolute;bottom:1rem;right:1rem;z-index:10">
<div onclick="enterRedPortal()" style="cursor:pointer;transition:transform 0.2s;text-align:center"
     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
     title="Click to begin your adventure and save Tapo!">
  <div style="width:120px;height:120px;position:relative;border-radius:50%;background:radial-gradient(circle, #dc2626, #7c2d12);animation:ribbleton-portal-pulse 1s ease-in-out infinite;box-shadow:0 0 40px #dc2626">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:4rem">👺</div>
  </div>
  <p style="margin-top:0.5rem;font-size:1rem;font-weight:bold;color:#fff;text-shadow:2px 2px 4px rgba(0,0,0,0.9);background:rgba(220,38,38,0.8);padding:0.25rem 0.75rem;border-radius:6px;border:2px solid #dc2626">🐸 Save Tapo!</p>
</div>
</div>

<!-- Quest Board in bottom-center -->
<div style="position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);z-index:10">
  <div onclick="showQuestBoard()" style="cursor:pointer;transition:transform 0.2s;text-align:center"
       onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
       title="View available quests and claim rewards">
    <div style="width:80px;height:80px;position:relative;background:linear-gradient(135deg, #92400e, #78350f);border-radius:8px;border:4px solid #451a03;box-shadow:0 4px 16px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center">
      <span style="font-size:3rem">🪧</span>
      ${getClaimableQuestCount() > 0 ? `<span style="position:absolute;top:-8px;right:-8px;background:#22c55e;color:#000;font-weight:bold;font-size:0.9rem;padding:0.15rem 0.5rem;border-radius:10px;border:2px solid #000;animation:pulse-glow 1.5s ease-in-out infinite">${getClaimableQuestCount()}</span>` : ''}
    </div>
    <p style="margin-top:0.4rem;font-size:0.9rem;font-weight:bold;color:#fff;text-shadow:2px 2px 4px rgba(0,0,0,0.9);background:rgba(146,64,14,0.9);padding:0.2rem 0.6rem;border-radius:4px;border:2px solid #78350f">📋 Quests</p>
  </div>
</div>
</div>`;

v.innerHTML = html;
}

function enterRedPortal() {
S.inRibbleton = false;
SoundFX.play('portal');
toast('Preparing to enter the dungeon...', 1200);
setTimeout(() => transitionScreen(title), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}

