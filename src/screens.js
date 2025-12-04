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
const floorProgress = Math.min(run.floorReached, 20) / 20;
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
<div style="font-size:1.3rem;font-weight:bold;color:#f1f5f9">${history.length}</div>
<div style="color:#94a3b8;font-size:0.75rem">Journeys</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.3rem;font-weight:bold;color:#fbbf24">${history.filter(r => r.outcome === 'victory').length}</div>
<div style="color:#94a3b8;font-size:0.75rem">Victories</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.3rem;font-weight:bold;color:#60a5fa">${Math.max(...history.map(r => r.floorReached), 0)}</div>
<div style="color:#94a3b8;font-size:0.75rem">Best Floor</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.3rem;font-weight:bold;color:#f59e0b">${getMostUsedHero(history)}</div>
<div style="color:#94a3b8;font-size:0.75rem">Favorite</div>
</div>
</div>
`}

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

// Check if this is the first time meeting Death
if(!S.tutorialFlags.death_intro) {
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
<div style="background:#f5f4ed;padding:2rem;border-radius:8px;max-width:900px;margin:0 auto;color:#2c2416;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
<img src="assets/neutrals/shopkeeper2.png" style="max-width:100%;height:auto;max-width:400px;margin:0 auto 1rem auto;display:block;border-radius:8px;border:3px solid #dc2626;box-shadow:0 0 20px rgba(220,38,38,0.5)">
<h1 style="text-align:center;margin-bottom:1rem;font-size:2.5rem;color:#dc2626">☠️ DEATH ☠️</h1>
${deathQuote ? `<p style="text-align:center;margin-bottom:1rem;font-size:1rem;color:#666;font-style:italic">"${deathQuote}"</p>` : ''}
<div class="going-rate-marquee">
<p style="text-align:center;font-size:1.3rem;margin:0">Gold: <strong style="color:#d97706">${S.gold}</strong></p>
<p style="text-align:center;font-size:1.5rem;margin:0.5rem 0 0 0;font-weight:bold;color:#dc2626">⚡ Going Rate: ${S.goingRate}G ⚡</p>
</div>`;

if(S.gold === 0) {
html += `<p style="text-align:center;margin:2rem 0;font-size:1.2rem;color:#dc2626;font-style:italic">"Nothing? Really? Come back when you have something to offer."</p>`;
} else {
html += `<h3 style="margin-bottom:1rem;text-align:center;font-size:1.3rem;color:#2c2416">Upgrade Sigilarium:</h3>`;

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
if(currentLevel >= 5) return; // Max level (5 for display)

const upgradeCount = S.sigUpgradeCounts[sig] || 0;
const baseCost = S.goingRate;
const escalation = upgradeCount > 0 ? (upgradeCount * 50) : 0;
const cost = baseCost + escalation;

const canAfford = S.gold >= cost;
const colors = ['#666', '#000', '#0d9488', '#9333ea', '#d97706', '#ff00ff'];
const colorClass = colors[currentLevel] || '#666';
const nextColorClass = colors[nextLevel] || '#ff00ff';

cards += `
<div style="background:#ffffff;padding:1rem;border-radius:8px;border:2px solid #2c2416;box-shadow:0 2px 4px rgba(0,0,0,0.1)">
<div style="font-weight:bold;margin-bottom:0.75rem;font-size:1.1rem">${sigilIconWithTooltip(sig, currentLevel, 750)}</div>
<div style="font-size:1rem;margin-bottom:0.75rem;font-weight:bold">
<span style="color:${colorClass}">L${currentLevel}</span> → <span style="color:${nextColorClass}">L${nextLevel}</span>
</div>
<div style="font-size:0.9rem;margin-bottom:0.75rem;color:#666;font-weight:600">Cost: ${cost}G</div>
<button class="btn" ${!canAfford ? 'disabled style="opacity:0.4"' : ''} onclick="purchaseSigilUpgrade('${sig}', ${cost})" style="padding:0.5rem 1rem;font-size:0.9rem;width:100%">
${canAfford ? 'Purchase' : 'Too Expensive'}
</button>
</div>`;
});
return cards;
};

// Core Sigils
html += `<h4 style="color:#2c63c7;margin:1rem 0 0.5rem 0;text-align:center;font-size:1.1rem">⚔️ Core Sigils</h4>`;
html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto">`;
html += renderSigilCards(coreSigils);
html += `</div>`;

// Advanced Sigils
html += `<h4 style="color:#f97316;margin:1rem 0 0.5rem 0;text-align:center;font-size:1.1rem">🔥 Advanced Sigils</h4>`;
html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto">`;
html += renderSigilCards(advancedSigils);
html += `</div>`;

// Passive Sigils
html += `<h4 style="color:#9333ea;margin:1rem 0 0.5rem 0;text-align:center;font-size:1.1rem">✨ Passive Sigils</h4>`;
html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;max-width:850px;margin-left:auto;margin-right:auto">`;
html += renderSigilCards(passiveSigils);
html += `</div>`;
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
<p style="font-size:0.85rem;margin-bottom:1rem;opacity:0.9">Remove one upgrade level from any sigil and get Gold equal to the current Going Rate (no +5G increase)</p>
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
<button class="btn" ${!canSellBack ? 'disabled style="opacity:0.4"' : ''} onclick="deathBoySellBack('${sig}')" style="padding:0.3rem 0.6rem;font-size:0.75rem">
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
<button class="btn" ${!canSacrifice ? 'disabled style="opacity:0.4"' : ''} onclick="deathBoySacrifice('${sig}')" style="padding:0.3rem 0.6rem;font-size:0.75rem">
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

// Check max level: actives max at perm L4 (displays as L5), passives max at perm L5
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const isActive = actives.includes(sig);
const permLevel = S.sig[sig] || 0;
const maxLevel = isActive ? 4 : 5;

if(permLevel >= maxLevel) {
toast('Already at maximum level!', 1800);
return;
}

S.gold -= cost;
S.sig[sig] = (S.sig[sig] || 0) + 1;
S.sigUpgradeCounts[sig] = (S.sigUpgradeCounts[sig] || 0) + 1;
S.goingRate += 5;
toast(`${sig} upgraded to L${S.sig[sig]}!`, 1200);
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
savePermanent();
// Clear run-specific save (slot-specific)
if(S.currentSlot) {
localStorage.removeItem(`froggle8_slot${S.currentSlot}`);
}
// Also clear old save format for backwards compatibility
localStorage.removeItem('froggle8');
// Return to Ribbleton hub
toast('Returning to Ribbleton...', 1200);
setTimeout(() => transitionScreen(showRibbleton), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}

// ===== CHAMPIONS MENU =====
function showChampionsMenu() {
const v = document.getElementById('gameView');
const pedestalCount = S.pedestal.filter(p => p.mode === S.gameMode).length;
const maxSlots = 8;

let html = `
<div style="position:relative;max-width:800px;margin:0 auto">
<h1 style="text-align:center;margin:1rem 0;font-size:2rem;background:linear-gradient(135deg,#3b82f6,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
🏆 The Flydra's Conquerors 🏆
</h1>

<div style="position:relative;width:100%;margin:0 auto">
<img src="assets/victory-room.png" style="width:100%;display:block;border-radius:8px;border:3px solid #000">

<!-- Clickable pedestal hotspot (center) -->
<div onclick="showPedestal()" style="position:absolute;left:35%;top:30%;width:30%;height:50%;cursor:pointer" title="View Pedestal"></div>

<!-- Clickable left portal (blue portal - leads to Standard mode) -->
<div onclick="enterPortal('Standard')" style="position:absolute;left:5%;top:20%;width:20%;height:60%;cursor:pointer" title="${S.gameMode === 'Standard' ? 'Current Mode' : 'Enter Standard Realm'}"></div>

<!-- Clickable right portal (green portal - leads to FU mode) -->
<div onclick="enterPortal('fu')" style="position:absolute;right:5%;top:20%;width:20%;height:60%;cursor:pointer;transition:transform 0.2s"
     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
     title="${S.gameMode === 'fu' ? 'Current Mode' : 'Enter Frogged Up Realm 🔥'}">
  <div style="width:100%;height:100%;background:radial-gradient(circle, rgba(34, 197, 94, 0.7) 0%, rgba(16, 185, 129, 0.4) 50%, transparent 100%);border:3px solid #22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 25px rgba(34, 197, 94, 0.8);animation:portalPulse 2s ease-in-out infinite">
    <div style="font-size:3rem;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8))">🟢</div>
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
toast(`Entered ${targetMode === 'Standard' ? 'Standard' : 'Frogged Up 🔥'} Realm!`);
showChampionsMenu();
}

function toggleModeFromChampions() {
S.gameMode = S.gameMode === 'Standard' ? 'fu' : 'Standard';
showChampionsMenu();
}

// ===== PEDESTAL UI =====
function showPedestal() {
const v = document.getElementById('gameView');
const heroes = ['Warrior', 'Tank', 'Mage', 'Healer'];
const heroIcons = {'Warrior': '⚔', 'Tank': '🛡', 'Mage': '📖', 'Healer': '✚'};
const stats = ['POW', 'HP'];

// Build slot grid overlay on the pedestal image
let slotsHTML = '';
stats.forEach((stat, rowIdx) => {
heroes.forEach((hero, colIdx) => {
const slotted = S.pedestal.find(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode);
const isSlotted = !!slotted;

// Position slots in a 2x4 grid over the pedestal image
// Adjust these percentages to match the actual slot positions on the pedestal art
const left = 20 + (colIdx * 20); // Distribute 4 columns across width
const top = 40 + (rowIdx * 25); // Distribute 2 rows across height

slotsHTML += `
<div style="position:absolute;left:${left}%;top:${top}%;width:15%;height:20%;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="${isSlotted ? `removeFigurine('${hero}','${stat}')` : `slotFigurine('${hero}','${stat}')`}">
<div style="width:100%;height:100%;background:${isSlotted ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'};border:2px solid ${isSlotted ? '#3b82f6' : 'rgba(255,255,255,0.3)'};border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(2px)">`;

if(isSlotted) {
const displayIcon = slotted.source === 'statuette' ? '🗿' : heroIcons[hero];
slotsHTML += `<div style="font-size:2rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${displayIcon}</div>
<div style="font-size:0.7rem;background:#000;color:#fff;padding:2px 4px;border-radius:3px;margin-top:2px">${stat === 'POW' ? '+1' : '+5'}</div>`;
} else {
slotsHTML += `<div style="font-size:1.5rem;color:rgba(255,255,255,0.4);text-shadow:0 2px 4px rgba(0,0,0,0.5)">+</div>`;
}

slotsHTML += `</div></div>`;
});
});

// Add legend showing hero names at top
let legendHTML = '<div style="position:absolute;top:10%;left:0;right:0;display:flex;justify-content:space-around;padding:0 15%">';
heroes.forEach(hero => {
legendHTML += `<div style="text-align:center;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.8)">
<div style="font-size:1.5rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8))">${heroIcons[hero]}</div>
<div style="font-size:0.75rem;font-weight:bold">${hero}</div>
</div>`;
});
legendHTML += '</div>';

// Add stat labels on left
let statLabelsHTML = '<div style="position:absolute;left:5%;top:40%;display:flex;flex-direction:column;gap:25%">';
stats.forEach(stat => {
statLabelsHTML += `<div style="color:#fff;font-weight:bold;text-shadow:0 2px 4px rgba(0,0,0,0.8);font-size:1.2rem">${stat}</div>`;
});
statLabelsHTML += '</div>';

let html = `
<div class="neutral-container">
<div class="neutral-left" style="position:relative;min-height:600px">
<div class="neutral-header">
<div class="neutral-stats">💰 ${S.gold}G | 🎯 Floor ${S.floor}</div>
<div class="neutral-narrative">
<h2 style="margin:0">⚱️ Pedestal of Champions</h2>
<p style="margin:0.5rem 0;font-size:0.9rem">${S.gameMode} Mode - Place figurines for permanent stat buffs</p>
</div>
</div>

${legendHTML}
${statLabelsHTML}
${slotsHTML}

${S.hasAncientStatuette ? `<div style="position:absolute;bottom:15%;left:10%;right:10%;padding:1rem;background:rgba(251,191,36,0.9);border-radius:6px;text-align:center;border:2px solid #000">
<p style="font-weight:bold;margin-bottom:0.5rem">🗿 Ancient Statuette Available!</p>
<p style="font-size:0.9rem;margin:0">Click any empty slot to place it</p>
</div>` : ''}

<div style="position:absolute;bottom:5%;left:50%;transform:translateX(-50%)">
<button class="btn secondary" onclick="showChampionsMenu()">Back to Victory Room</button>
</div>
</div>
<div class="neutral-right" style="background-image:url('assets/neutrals/statue2.png')"></div>
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

// Use Ancient Statuette if available (can go in any slot)
if(S.hasAncientStatuette) {
S.pedestal.push({hero, stat, mode: S.gameMode, source: 'statuette'});
S.hasAncientStatuette = false;
savePermanent();
toast(`Ancient Statuette placed on ${hero} ${stat}!`, 1800);
showPedestal();
return;
}

// Otherwise, check if this hero can have a figurine (max 2 per hero per mode)
const existingCount = S.pedestal.filter(p => p.hero === hero && p.mode === S.gameMode).length;
if(existingCount >= 2) {
toast(`${hero} already has 2 figurines in ${S.gameMode} mode!`, 1800);
return;
}

// Place the hero figurine
S.pedestal.push({hero, stat, mode: S.gameMode, source: 'hero'});
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
// Record victory to The Pond!
recordPondHistory('victory');

// Gold is lost on victory (reset to 0)
S.gold = 0;
savePermanent();

// Award figurines for heroes who survived (HP > 0, not Last Stand)
const survivedHeroes = S.heroes.filter(h => h.h > 0 && !h.ls);
const earnedFigurines = [];
survivedHeroes.forEach(h => {
// Check if this hero already has 2 figurines for this mode
const existingCount = S.pedestal.filter(slot => slot.hero === h.n && slot.mode === S.gameMode).length;
if(existingCount < 2) {
earnedFigurines.push(h.n);
}
});

// Unlock Frogged Up mode if Standard victory
const firstStandardVictory = S.gameMode === 'Standard' && !S.tutorialFlags.first_victory_sequence;
if(S.gameMode === 'Standard') {
S.fuUnlocked = true;
if(firstStandardVictory) {
S.tutorialFlags.first_victory_sequence = true;
}
}

const firstFU = S.gameMode === 'fu' && !S.tutorialFlags.first_fu_victory;
if(firstFU) {
S.tutorialFlags.first_fu_victory = true;
// Note: Tapo is now unlocked at Floor 20 via Old Tapo encounter
}

savePermanent();

// Store earned figurines for later display
window.earnedFigurines = earnedFigurines;

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
const tapoInParty = S.heroes.some(h => h.n === 'Tapo' && h.h > 0 && !h.ls);
if(tapoInParty && !S.tutorialFlags.tapo_victory_message) {
S.tutorialFlags.tapo_victory_message = true;
savePermanent();
showTapoVictoryMessage();
return;
}

// SUBSEQUENT VICTORIES: Go directly to Pedestal if figurines earned
if(earnedFigurines.length > 0 || S.hasAncientStatuette) {
showStatueRoom();
return;
}

// No figurines earned: show simple victory screen
showSimpleVictoryScreen();
}

function showFirstVictoryCutscene() {
const slides = [
{text: "19 grueling floors later, your heroes finally find him - Tapo the Tadpole, happily playing with a collection of strange glowing figurines!"},
{text: "The little tadpole squeaks excitedly as the heroes approach. Around him lay scattered statues - each one depicting a heroic frog warrior."},
{text: "The heroes carefully gather the mysterious figurines. The statues pulse with magical energy, and match the carvings on the nearby ancient pedestal.", action: 'statue_slotting'},
{text: "As the heroes slot the statues, they feel immense power surge through them! Each figurine permanently boosts a hero's POW (+1) or HP (+5). With Tapo safely in the hero's arms, the heroes step back through the portal..."},
{text: "The portal deposits them back in Ribbleton's square. The townspeople erupt in cheers as the heroes emerge victorious, and Tapo is carried away on an epic froggy crowd surf!"},
{text: "Exhausted but triumphant, the heroes finally get a moment to rest and celebrate their victory. The red portal behind them shimmers ominously. Had Tapo gone back through?"},
{text: "A quick trip back to the statue room later, and there's Tapo! But he's staring at a new portal that has emerged in the room, crackling with black and green arcane energy."},
{text: "Before anyone can stop him, the little bugger squirms his way into this green-black portal - uh oh! <span style='font-size:1.5em;font-weight:bold'>Here we go again!</span>"}
];

// Custom slide handler for statue slotting
window.firstVictorySlideAction = (action, slideIndex, callback) => {
if(action === 'statue_slotting') {
// Show pedestal after this slide, then continue cutscene
showFirstVictoryPedestal(() => {
callback();
});
return true; // Handled
}
return false; // Not handled
};

slides.onComplete = () => {
window.firstVictorySlideAction = null;
showChampionsMenu();
};

showNarrativeSlide(slides, 0);
}

function showFirstVictoryPedestal(onComplete) {
// Show a simplified pedestal UI during the first victory cutscene
const v = document.getElementById('gameView');
const heroes = ['Warrior', 'Tank', 'Mage', 'Healer'];
const heroIcons = {'Warrior': '⚔', 'Tank': '🛡', 'Mage': '📖', 'Healer': '✚'};
const stats = ['POW', 'HP'];

// Build slot grid
let slotsHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin:1rem 0">';
stats.forEach((stat, rowIdx) => {
heroes.forEach((hero, colIdx) => {
const slotted = S.pedestal.find(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode);
const isSlotted = !!slotted;

slotsHTML += `
<div style="background:${isSlotted ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'};border:2px solid ${isSlotted ? '#fbbf24' : 'rgba(255,255,255,0.3)'};border-radius:8px;padding:1rem;text-align:center;cursor:pointer" onclick="${isSlotted ? `removeFirstVicFigurine('${hero}','${stat}')` : `slotFirstVicFigurine('${hero}','${stat}')`}">
<div style="font-size:1.5rem">${heroIcons[hero]}</div>
<div style="font-size:0.8rem;font-weight:bold">${hero}</div>
<div style="font-size:0.7rem;color:#94a3b8">${stat === 'POW' ? '+1 POW' : '+5 HP'}</div>
${isSlotted ? '<div style="color:#fbbf24;font-size:0.8rem;margin-top:0.5rem">✓ Slotted</div>' : '<div style="color:#64748b;font-size:0.8rem;margin-top:0.5rem">Click to slot</div>'}
</div>`;
});
});
slotsHTML += '</div>';

const slotsUsed = S.pedestal.filter(p => p.mode === S.gameMode).length;

v.innerHTML = `
<div style="max-width:800px;margin:0 auto;padding:2rem;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);border-radius:12px;border:3px solid #fbbf24;color:#fff">
<h2 style="text-align:center;margin-bottom:1rem;color:#fbbf24">⚱️ Slot Your Figurines!</h2>
<p style="text-align:center;margin-bottom:1rem;font-size:0.95rem">Place figurines on the pedestal to permanently boost your heroes. Each hero can have up to 2 figurines per mode.</p>
<p style="text-align:center;margin-bottom:1rem;font-size:0.85rem;color:#94a3b8">Slots used: ${slotsUsed}/8</p>
${slotsHTML}
<div style="text-align:center;margin-top:1.5rem">
<button class="btn" onclick="window.firstVicPedestalComplete()" style="padding:1rem 2rem;font-size:1.1rem">Continue Story</button>
</div>
</div>`;

window.firstVicPedestalComplete = onComplete;
}

function slotFirstVicFigurine(hero, stat) {
if(S.pedestal.find(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode)) {
toast('Slot already filled!');
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
const tapoInParty = S.heroes.some(h => h.n === 'Tapo');

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
<img src="assets/tapo.png" style="max-width:200px;height:auto;display:block;margin:1rem auto;border-radius:8px">
<p style="text-align:center;margin-top:1rem">Tapo the Tadpole is now available as a playable hero!</p>
<p style="text-align:center;font-size:0.9rem;opacity:0.8;margin-top:0.5rem">Stats: 1 POW, 1 HP • Has access to ALL sigils in the Sigilarium</p>
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
<div style="max-width:700px;margin:2rem auto;padding:3rem;background:linear-gradient(135deg,#22c55e 0%,#10b981 50%,#059669 100%);border-radius:16px;border:4px solid #3b82f6;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
<h1 style="text-align:center;margin-bottom:2rem;font-size:3rem;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">🏆 VICTORY! 🏆</h1>

<div style="text-align:center;margin:2rem 0">
<img src="assets/tapo-nobg.png" style="max-width:250px;height:auto;display:block;margin:0 auto 2rem auto;animation:bounce 2s ease-in-out infinite">
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
const v = document.getElementById('gameView');
let html = `
<h1 style="text-align:center;margin:2rem 0;font-size:2.5rem">🏆 VICTORY! 🏆</h1>`;

if(S.gameMode === 'fu') {
html += `<p style="text-align:center;margin-bottom:2rem;font-size:1.2rem">You conquered the Frogged Up realm once again!<br>Impressive.</p>`;
} else {
html += `<img src="assets/tapo.png" style="max-width:100%;height:auto;max-width:400px;margin:1rem auto;display:block;border-radius:8px;border:3px solid #000">`;
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

html += `<div style="text-align:center;margin-top:2rem">
<button class="btn" onclick="showStatueRoom()" style="padding:1rem 2rem;font-size:1.1rem;margin-right:1rem">Place Figurines</button>
<button class="btn secondary" onclick="showRibbleton()" style="padding:1rem 2rem;font-size:1.1rem">Return to Ribbleton</button>
</div>`;

v.innerHTML = html;
}

// ===== RIBBLETON HUB =====
function showRibbleton() {
// Show game header in Ribbleton with location label
S.inRibbleton = true;
const header = document.getElementById('gameHeader');
if(header) header.style.display = 'flex';
upd(); // Update header to show "Ribbleton"

const v = document.getElementById('gameView');
const bluePortalUnlocked = S.hasReachedFloor20;

// Show tutorial for first-time visitors to Ribbleton hub
const isFirstVisit = !S.tutorialFlags.ribbleton_hub_intro;
if(isFirstVisit && !S.helpTipsDisabled) {
  setTimeout(() => {
    showTutorialPop('ribbleton_hub_intro', "Welcome home to Ribbleton! This is your safe haven between adventures. Click the glowing portal whenever you're ready to begin your next rescue mission!", () => {
      // Tutorial dismissed, player can now explore
    });
  }, 500);
}

let html = `
<div style="position:relative;max-width:1000px;margin:0 auto;padding:1rem">
<h1 style="text-align:center;margin-bottom:1rem;font-size:2rem;color:#22c55e;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">
🐸 Welcome Home to Ribbleton! 🐸
</h1>

<div style="position:relative;width:100%;margin:0 auto">
<img src="assets/ribbleton.png" style="width:100%;display:block;border-radius:8px;border:3px solid #000">

<!-- Red Portal (Always Available) - Left side of town square -->
<div onclick="enterRedPortal()" style="position:absolute;left:15%;top:40%;width:15%;height:25%;cursor:pointer;border-radius:50%"
     title="Enter the Red Portal - Begin a new adventure!">
  <div style="width:100%;height:100%;background:radial-gradient(circle, rgba(220, 38, 38, 0.7) 0%, rgba(220, 38, 38, 0.3) 50%, transparent 100%);border:3px solid #dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center;animation:portalPulse 2s ease-in-out infinite">
    <div style="font-size:3rem;animation:portalGlow 2s ease-in-out infinite">🔴</div>
  </div>
</div>

${bluePortalUnlocked ? `
<!-- Blue Portal (Unlocked after Floor 20) - Right side of town square -->
<div onclick="enterBluePortal()" style="position:absolute;right:15%;top:40%;width:15%;height:25%;cursor:pointer;border-radius:50%;transition:transform 0.2s"
     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
     title="Enter the Blue Portal - Return to Floor 20!">
  <div style="width:100%;height:100%;background:radial-gradient(circle, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%);border:3px solid #3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(59, 130, 246, 0.8)">
    <div style="font-size:3rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8))">🔵</div>
  </div>
</div>
` : ''}
</div>

<div style="text-align:center;margin-top:1.5rem;padding:1rem;background:rgba(255,255,255,0.9);border:3px solid #22c55e;border-radius:8px;max-width:600px;margin-left:auto;margin-right:auto">
  <p style="font-size:1.1rem;margin-bottom:0.5rem"><strong>🔴 Adventure Portal:</strong> Save Tapo!</p>
  ${bluePortalUnlocked ?
    `<p style="font-size:1.1rem;margin:0"><strong>🔵 Path to Statue Room:</strong> Visit the Champions Hall</p>` :
    ``
  }
</div>

${S.pondHistory && S.pondHistory.length > 0 ? `
<div style="text-align:center;margin-top:0.75rem">
<button class="btn" onclick="showPond()" style="background:linear-gradient(135deg,rgba(30,58,138,0.8),rgba(59,130,246,0.6));border:2px solid #60a5fa;padding:0.5rem 1rem;font-size:0.9rem">
🪷 The Pond
</button>
</div>
` : ''}
</div>`;

v.innerHTML = html;
}

function enterRedPortal() {
S.inRibbleton = false;
SoundFX.play('portal');
toast('Preparing to enter the dungeon...', 1200);
setTimeout(() => transitionScreen(title), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}

function enterBluePortal() {
if(!S.hasReachedFloor20) {
toast('The Blue Portal is locked!');
SoundFX.play('error');
return;
}
S.inRibbleton = false;
SoundFX.play('portal');
toast('Entering the Blue Portal...', 1200);
setTimeout(() => transitionScreen(showChampionsMenu), T(ANIMATION_TIMINGS.ACTION_COMPLETE));
}

