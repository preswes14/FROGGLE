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
goldEarned: S.gold,
upgradeHistory: S.runUpgradeHistory || []
};
// Add to history (limit to last 50 runs to save localStorage space)
S.pondHistory.unshift(entry);
if(S.pondHistory.length > 50) {
S.pondHistory = S.pondHistory.slice(0, 50);
}
savePermanent();
}

// Pond mode filter state
let pondFilter = 'all';
function filterPond(mode) {
  pondFilter = mode;
  showPond();
}

// Show The Pond - a reflective place for remembering past adventures
function showPond() {
GameMusic.playScene('lilypad_pond');
const v = document.getElementById('gameView');
const allHistory = S.pondHistory || [];
// Apply mode filter
let history = allHistory;
if(pondFilter === 'Standard') history = allHistory.filter(r => r.gameMode !== 'fu');
else if(pondFilter === 'fu') history = allHistory.filter(r => r.gameMode === 'fu');

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
} else if (floorProgress >= 0.75) {
  // Deep run lily pad (floor 15+) - green-to-teal gradient with subtle glow
  const intensity = 0.7 + (floorProgress * 0.25);
  background = `linear-gradient(135deg, rgba(16,185,129,${intensity}) 0%, rgba(6,182,212,${intensity}) 100%)`;
  border = '2px solid rgba(6,182,212,0.8)';
  glow = `0 0 8px rgba(6,182,212,0.4), 0 2px 8px rgba(0,0,0,0.3)`;
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
   title="Run #${run.runNumber} - Floor ${run.floorReached}">
  <span style="font-size:${Math.max(11, size/4)}px;font-weight:bold;color:${isVictory ? '#000' : '#fff'};text-shadow:${isVictory ? 'none' : '1px 1px 2px rgba(0,0,0,0.6)'}">${run.floorReached}</span>
  ${isVictory ? `<span style="font-size:${Math.max(10, size/5)}px;font-weight:bold;color:#fbbf24">W</span>` : ''}
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
The Pond
</h1>
<p style="text-align:center;color:#94a3b8;margin-bottom:1rem;font-size:0.95rem">
A quiet place to reflect on adventures past...
</p>

<!-- Legend -->
<div style="display:flex;justify-content:center;gap:1.5rem;margin-bottom:1rem;flex-wrap:wrap;font-size:0.85rem">
<span style="color:#22c55e">Good Try</span>
<span style="color:#fbbf24">Good Job</span>
${S.fuUnlocked ? `<span style="background:linear-gradient(90deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:bold">${(S.pondHistory || []).some(r => r.gameMode === 'fu') ? 'Frogged Up Win' : 'What the Frog?'}</span>` : ''}
<span style="color:#64748b;font-size:0.8rem">(bigger = higher floor)</span>
</div>

${S.fuUnlocked ? `
<div style="display:flex;justify-content:center;gap:0.5rem;margin-bottom:1rem">
<button class="btn ${pondFilter === 'all' ? '' : 'secondary'}" onclick="filterPond('all')" style="padding:0.3rem 0.8rem;font-size:0.85rem">All</button>
<button class="btn ${pondFilter === 'Standard' ? '' : 'secondary'}" onclick="filterPond('Standard')" style="padding:0.3rem 0.8rem;font-size:0.85rem">Standard</button>
<button class="btn ${pondFilter === 'fu' ? '' : 'secondary'}" onclick="filterPond('fu')" style="padding:0.3rem 0.8rem;font-size:0.85rem">Frogged Up</button>
</div>
` : ''}
`;

// Compute stats
const pondTotalRuns = history.length;
const pondWins = history.filter(r => r.outcome === 'victory').length;
const pondWinRate = pondTotalRuns > 0 ? Math.round((pondWins / pondTotalRuns) * 100) : 0;
const pondEnemiesKilled = (S.questProgress && S.questProgress.enemiesKilled) || 0;

// Trend line (last 5 vs previous 5) - uses XP earned as progress indicator
const pondLast5 = history.slice(0, 5);
const pondPrev5 = history.slice(5, 10);
const pondLast5Avg = pondLast5.length > 0 ? (pondLast5.reduce((s, r) => s + (r.xpEarned || 0), 0) / pondLast5.length).toFixed(0) : null;
const pondPrev5Avg = pondPrev5.length >= 3 ? (pondPrev5.reduce((s, r) => s + (r.xpEarned || 0), 0) / pondPrev5.length).toFixed(0) : null;
const pondTrendUp = pondPrev5Avg && pondLast5Avg ? parseFloat(pondLast5Avg) >= parseFloat(pondPrev5Avg) : true;

html += `
${history.length === 0 ? `
<div class="pond-water" style="text-align:center;padding:4rem 2rem;border-radius:24px;max-width:500px;margin:0 auto;border:3px solid rgba(59,130,246,0.3)">
<p style="font-size:2rem;margin-bottom:1rem"></p>
<p style="color:#94a3b8;font-size:1.1rem">The water is still...</p>
<p style="color:#64748b;margin-top:0.5rem">Lily pads will appear here after your first adventure and grow the further you progress.</p>
</div>
` : `
<div class="pond-water" style="border-radius:20px;border:3px solid rgba(59,130,246,0.3)">
<div class="lily-pad-container">
${history.map((run, idx) => renderLilyPad(run, idx)).reverse().join('')}
</div>
</div>

<!-- Stats summary -->
<div style="margin-top:1.5rem;display:grid;grid-template-columns:repeat(auto-fit, minmax(90px, 1fr));gap:0.75rem;text-align:center">
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#f1f5f9">${history.length}</div>
<div style="color:#94a3b8;font-size:0.85rem">Journeys</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#fbbf24">${pondWins}</div>
<div style="color:#94a3b8;font-size:0.85rem">Victories</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#60a5fa">${Math.max(...history.map(r => r.floorReached), 0)}</div>
<div style="color:#94a3b8;font-size:0.85rem">Best Floor</div>
</div>
${pondTotalRuns >= 3 ? `
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#22c55e">${pondWinRate}%</div>
<div style="color:#94a3b8;font-size:0.85rem">Win Rate</div>
</div>
` : ''}
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#ef4444">${pondEnemiesKilled}</div>
<div style="color:#94a3b8;font-size:0.85rem">Enemies Slain</div>
</div>
<div style="background:rgba(30,41,59,0.8);padding:0.75rem;border-radius:8px;border:2px solid #334155">
<div style="font-size:1.4rem;font-weight:bold;color:#f59e0b">${getMostUsedHero(history)}</div>
<div style="color:#94a3b8;font-size:0.85rem">Favorite</div>
</div>
</div>

<!-- Hero Stats button -->
<div style="text-align:center;margin-top:0.75rem">
<button class="btn" onclick="showHeroStatsModal()" style="padding:0.5rem 1.5rem;font-size:1rem">Hero Stats</button>
</div>

<!-- Trend line -->
${pondLast5Avg && pondPrev5Avg ? `
<p style="text-align:center;margin-top:0.75rem;color:#94a3b8;font-size:0.9rem;font-style:italic">
Last 5 runs: ${pondLast5Avg} XP avg
<span style="color:${pondTrendUp ? '#22c55e' : '#ef4444'}">${pondTrendUp ? '&#9650;' : '&#9660;'} ${pondTrendUp ? 'up' : 'down'} from ${pondPrev5Avg}</span>
</p>
` : ''}
`}

${S.hasReachedFloor20 ? `
<div style="text-align:center;margin-top:1.5rem;padding:1rem;background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(251,191,36,0.1));border:2px solid #3b82f6;border-radius:12px">
<h3 style="margin:0 0 0.75rem 0;color:#60a5fa;text-shadow:1px 1px 2px rgba(0,0,0,0.5)">The Flydra's Conquerors</h3>
<p style="color:#94a3b8;font-size:0.9rem;margin-bottom:0.75rem">You've proven yourself worthy. Visit the Champions Hall to manage figurines and explore other realms.</p>
<button class="btn" onclick="showChampionsMenu()" style="background:linear-gradient(135deg,#3b82f6,#1e40af);border:2px solid #60a5fa;padding:0.75rem 1.5rem;font-size:1rem">
Enter Champions Hall
</button>
</div>
` : ''}

<div style="text-align:center;margin-top:1.5rem">
<button class="btn" onclick="showRibbleton()" style="padding:1rem 2rem;font-size:1.1rem">Return to Ribbleton</button>
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
<h2 style="margin:0;color:${headerColor};font-size:1.3rem">${isVictory ? 'Victory!' : 'Journey'} #${run.runNumber}</h2>
</div>
<div style="padding:1rem">
<div style="display:grid;gap:0.5rem;font-size:0.95rem">
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Date:</span>
<span style="color:#f1f5f9">${dateStr}</span>
</div>
<div style="display:flex;justify-content:space-between">
<span style="color:#94a3b8">Mode:</span>
<span style="color:#f1f5f9">${modeText}</span>
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
<span style="color:#22c55e;font-weight:bold">Tapo Rescued!</span>
</div>
` : ''}
${run.upgradeHistory && run.upgradeHistory.length > 0 ? `
<div style="margin-top:0.75rem;border-top:1px solid #334155;padding-top:0.75rem">
<div style="color:#a78bfa;font-size:0.85rem;font-weight:bold;margin-bottom:0.4rem">Upgrades (${run.upgradeHistory.length})</div>
<div style="display:flex;flex-wrap:wrap;gap:0.3rem">
${run.upgradeHistory.map(u => {
  const pill = 'background:rgba(148,163,184,0.15);border:1px solid rgba(148,163,184,0.3);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.75rem;color:#cbd5e1';
  if(u.type === 'addSigil') return '<span style="' + pill + '">+' + u.sigil + ' &#8594; ' + u.hero + '</span>';
  if(u.type === 'upgradeSigil' || u.type === 'upgradePassive') return '<span style="' + pill + '">' + u.sigil + ' &#8593;</span>';
  if(u.type === 'stat') return '<span style="' + pill + '">' + u.hero + ' ' + u.stat + '&#8593;</span>';
  return '';
}).join('')}
</div>
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

// ===== HERO STATS MODAL =====
function showHeroStatsModal() {
const history = S.pondHistory || [];
const heroes = ['Warrior', 'Tank', 'Mage', 'Healer', 'Tapo'];
const qp = S.questProgress || {};
const hp = qp.heroesPlayed || {};
const hw = qp.heroWins || {};

// Compute per-hero stats from pond history
function heroStats(heroName) {
  const runs = history.filter(r => (r.heroes || []).includes(heroName));
  const wins = runs.filter(r => r.outcome === 'victory').length;
  const plays = hp[heroName] || runs.length;
  const winCount = hw[heroName] || wins;
  const bestFloor = runs.length > 0 ? Math.max(...runs.map(r => r.floorReached)) : 0;
  const avgFloor = runs.length > 0 ? (runs.reduce((s, r) => s + r.floorReached, 0) / runs.length).toFixed(1) : '-';
  const figs = (S.pedestal || []).filter(f => f.hero === heroName).length;

  // Most common upgrades from upgradeHistory across all runs with this hero
  const upgCounts = {};
  runs.forEach(r => {
    if(!r.upgradeHistory) return;
    r.upgradeHistory.forEach(u => {
      if(u.type === 'addSigil' && u.hero === heroName) {
        upgCounts[u.sigil] = (upgCounts[u.sigil] || 0) + 1;
      } else if(u.type === 'stat' && u.hero === heroName) {
        upgCounts[u.stat] = (upgCounts[u.stat] || 0) + 1;
      }
    });
    // Global sigil upgrades count for all heroes in that run
    r.upgradeHistory.forEach(u => {
      if(u.type === 'upgradeSigil' || u.type === 'upgradePassive') {
        upgCounts[u.sigil] = (upgCounts[u.sigil] || 0) + 1;
      }
    });
  });
  const topUpgrades = Object.entries(upgCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return { plays, winCount, bestFloor, avgFloor, figs, topUpgrades };
}

const v = document.getElementById('gameView');
let html = `
<div class="modal-container" style="max-width:500px;max-height:85vh;overflow-y:auto">
<div style="background:linear-gradient(135deg,#1e3a5f,#1e293b);padding:1rem;border-radius:8px 8px 0 0;text-align:center">
<h2 style="margin:0;color:#60a5fa;font-size:1.3rem">Hero Stats</h2>
</div>
<div style="padding:1rem;display:flex;flex-direction:column;gap:0.75rem">`;

heroes.forEach(heroName => {
  const h = heroStats(heroName);
  if(h.plays === 0) return; // Skip heroes never played
  const winRate = h.plays > 0 ? Math.round((h.winCount / h.plays) * 100) : 0;
  const imgPath = HERO_IMAGES[heroName.toLowerCase()] || '';

  html += `
  <div style="background:rgba(30,41,59,0.8);border:2px solid #334155;border-radius:8px;padding:0.75rem;display:flex;gap:0.75rem;align-items:center">
    <img src="${imgPath}" alt="${heroName}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:2px solid #475569;flex-shrink:0">
    <div style="flex:1;min-width:0">
      <div style="font-weight:bold;font-size:1rem;color:#f1f5f9;margin-bottom:0.3rem">${heroName}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.2rem 0.75rem;font-size:0.8rem">
        <span style="color:#94a3b8">Plays: <strong style="color:#f1f5f9">${h.plays}</strong></span>
        <span style="color:#94a3b8">Wins: <strong style="color:#fbbf24">${h.winCount}</strong> (${winRate}%)</span>
        <span style="color:#94a3b8">Best: <strong style="color:#60a5fa">F${h.bestFloor}</strong></span>
        <span style="color:#94a3b8">Avg: <strong style="color:#a78bfa">F${h.avgFloor}</strong></span>
        ${h.figs > 0 ? `<span style="color:#94a3b8">Figurines: <strong style="color:#f59e0b">${h.figs}</strong></span>` : ''}
      </div>
      ${h.topUpgrades.length > 0 ? `
      <div style="margin-top:0.3rem;font-size:0.75rem;color:#64748b">
        Top upgrades: ${h.topUpgrades.map(([name, count]) => name + ' (' + count + ')').join(', ')}
      </div>
      ` : ''}
    </div>
  </div>`;
});

html += `
<button class="btn" onclick="this.closest('.modal-container').remove();document.querySelector('.modal-overlay')?.remove()" style="margin-top:0.5rem;width:100%">Close</button>
</div>
</div>
<div class="modal-overlay" onclick="document.querySelector('.modal-container')?.remove();this.remove()"></div>`;

v.insertAdjacentHTML('beforeend', html);
SoundFX.play('menuOpen');
}

// ===== DEATH SCREEN =====
function showDeathScreen() {
// Music: play death screen theme
GameMusic.playScene('death_screen');
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

// Phase 1: Show quote on blank dark screen
if(deathQuote) {
const v2 = document.getElementById('gameView');
v2.innerHTML = `
<style>
@keyframes death-quote-shrink {
  0% { font-size: 1.6rem; opacity: 1; transform: translateY(0); }
  100% { font-size: 0.85rem; opacity: 0.85; transform: translateY(0); }
}
</style>
<div id="deathQuoteIntro" style="position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#0a0e27 0%,#1a1033 40%,#0d1117 100%);display:flex;align-items:center;justify-content:center;z-index:999;padding:2rem">
<p style="text-align:center;font-size:1.6rem;color:#a89cc8;font-style:italic;max-width:600px;line-height:1.6;opacity:0;transition:opacity 0.5s ease-in" id="deathQuoteText">"${deathQuote}"</p>
</div>`;
// Fade in the quote
setTimeout(() => {
  const qt = document.getElementById('deathQuoteText');
  if(qt) qt.style.opacity = '1';
}, 50);
// After 2s, render the shop behind, then animate the transition
setTimeout(() => {
  renderDeathShop(deathQuote, nextRateIncrease, coreSigils, advancedSigils, passiveSigils, allSigils);
  const intro = document.getElementById('deathQuoteIntro');
  if(intro) {
    intro.style.transition = 'opacity 1.5s ease-out';
    intro.style.opacity = '0';
    setTimeout(() => intro.remove(), 1500);
  }
  // Animate the inline quote: start large, shrink to normal
  const inlineQuote = document.getElementById('deathQuoteInline');
  if(inlineQuote) {
    inlineQuote.style.animation = 'death-quote-shrink 1.5s ease-out forwards';
  }
}, T(2000));
return;
}
renderDeathShop(deathQuote, nextRateIncrease, coreSigils, advancedSigils, passiveSigils, allSigils);
}

function renderDeathShop(deathQuote, nextRateIncrease, coreSigils, advancedSigils, passiveSigils, allSigils) {
const v = document.getElementById('gameView');

// Sanity check: if goingRate is very low but sigUpgradeCounts is high, something is wrong
const allSigs = ['Attack', 'Shield', 'Heal', 'D20', 'Expand', 'Grapple', 'Ghost', 'Asterisk', 'Star', 'Alpha'];
const totalUpgradeCounts = allSigs.reduce((sum, sig) => sum + (S.sigUpgradeCounts[sig] || 0), 0);
const calculateExpectedGoingRate = (n) => {
  if(n <= 0) return 1;
  const fullTiers = Math.floor(n / 5);
  const partial = n % 5;
  const fullTierSum = 25 * fullTiers * (fullTiers + 1) / 2;
  const partialSum = partial * 5 * (fullTiers + 1);
  return 1 + fullTierSum + partialSum;
};
const expectedMinGoingRate = calculateExpectedGoingRate(totalUpgradeCounts);
if (S.goingRate < expectedMinGoingRate && totalUpgradeCounts > 0) {
  console.warn('[DEATH SCREEN] sigUpgradeCounts out of sync with goingRate. Resetting sigUpgradeCounts.');
  allSigs.forEach(sig => S.sigUpgradeCounts[sig] = 0);
  savePermanent();
  toast('Fixed corrupted upgrade data', 1500);
}

// Helper function to render sigil upgrade cards (compact for 3-col layout)
const renderSigilCards = (sigils) => {
let cards = '';
sigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const isActive = actives.includes(sig);
const currentLevel = isActive ? permLevel + 1 : permLevel;
const nextLevel = currentLevel + 1;
const maxLevel = 4;

if(permLevel >= maxLevel) {
const colors = ['#94a3b8', '#c0c0c0', '#06b6d4', '#9333ea', '#d97706', '#ff0080'];
const maxColor = colors[Math.min(currentLevel, colors.length - 1)];
cards += `
<div class="ds-card" style="border-color:${maxColor};box-shadow:0 0 10px rgba(255,0,128,0.3);background:#1a1a2e">
<div style="font-size:1.1rem;margin-bottom:0.3rem">${sigilIconWithTooltip(sig, currentLevel, 750)}</div>
<div style="font-size:0.95rem;font-weight:bold;margin-bottom:0.3rem"><span style="color:${maxColor}">L${currentLevel}</span></div>
<div style="font-size:0.75rem;color:${maxColor};font-weight:bold;text-transform:uppercase;letter-spacing:1px">SOLD OUT</div>
</div>`;
return;
}

const upgradeCount = S.sigUpgradeCounts[sig] || 0;
const escalationTable = [0, 25, 50, 100, 150];
const cappedCount = Math.min(upgradeCount, escalationTable.length - 1);
const cost = S.goingRate + escalationTable[cappedCount];
const canAfford = S.gold >= cost;
// Calculate post-purchase Going Rate for cost preview
const totalUpgradesNow = allSigs.reduce((sum, s) => sum + (S.sigUpgradeCounts[s] || 0), 0);
const purchaseTier = Math.floor(totalUpgradesNow / 5);
const purchaseRateIncrease = 5 * (purchaseTier + 1);
const newGoingRate = S.goingRate + purchaseRateIncrease;
const colors = ['#94a3b8', '#c0c0c0', '#06b6d4', '#9333ea', '#d97706', '#ff0080'];
const colorClass = colors[currentLevel] || '#94a3b8';
const nextColorClass = colors[nextLevel] || '#ff0080';

cards += `
<div class="ds-card" style="border-color:${nextColorClass}" title="Cost: ${cost}G &#10;Going Rate rises to ${newGoingRate}G (+${purchaseRateIncrease}G)">
<div style="font-size:1.1rem;margin-bottom:0.3rem">${sigilIconWithTooltip(sig, currentLevel, 750)}</div>
<div style="font-size:0.95rem;font-weight:bold;margin-bottom:0.3rem">
<span style="color:${colorClass}">L${currentLevel}</span> → <span style="color:${nextColorClass}">L${nextLevel}</span>
</div>
<button class="btn" ${!canAfford ? 'disabled' : ''} onclick="purchaseSigilUpgrade('${sig}', ${cost})" style="padding:0.35rem 0.5rem;font-size:0.8rem;width:100%;${canAfford ? `border-color:${nextColorClass}` : ''}">
${canAfford ? 'Purchase' : 'Too Expensive'}
</button>
</div>`;
});
return cards;
};

// Locked category render helper
const renderLockedCategory = (name, sigilNames, color, cost, categoryKey) => {
const canAfford = S.gold >= cost;
return `
<div class="ds-locked" style="border-color:${color};box-shadow:0 0 15px ${color}30">
<div style="font-size:2rem;margin-bottom:0.5rem;opacity:0.4">⛓</div>
<p style="color:${color};font-weight:bold;font-size:0.9rem;margin-bottom:0.3rem">${sigilNames}</p>
<p style="color:#888;font-size:0.75rem;margin-bottom:0.75rem;font-style:italic">${name}</p>
<button class="btn" ${!canAfford ? 'disabled' : ''} onclick="unlockSigilCategory('${categoryKey}')" style="padding:0.5rem 1rem;font-size:0.85rem;${canAfford ? `background:linear-gradient(135deg,${color},${color}cc);border-color:${color};color:#fff` : ''}">
${canAfford ? `UNLOCK - ${cost}G` : `Need ${cost}G`}
</button>
</div>`;
};

// Death Boys top-left cell content
let deathBoysCell = '';
if(S.ghostBoysConverted) {
deathBoysCell = `
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:0.5rem">
<h3 style="color:#a855f7;font-size:0.95rem;margin:0">The Death Boys</h3>
<p style="font-size:0.7rem;font-style:italic;opacity:0.7;margin:0;text-align:center">"We work for Death now!"</p>
<div style="display:flex;gap:0.5rem;margin-top:0.25rem">
<button class="btn" onclick="showDeathBoyModal('sell')" style="padding:0.4rem 0.75rem;font-size:0.8rem;background:rgba(34,197,94,0.15);border:2px solid rgba(34,197,94,0.5);color:#22c55e">Sell Back</button>
<button class="btn" onclick="showDeathBoyModal('sacrifice')" style="padding:0.4rem 0.75rem;font-size:0.8rem;background:rgba(168,85,247,0.15);border:2px solid rgba(168,85,247,0.5);color:#a855f7">Sacrifice</button>
</div>
</div>`;
}

// Going Rates top-right cell content
const goingRatesCell = `
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
<p style="font-size:1.1rem;margin:0 0 0.25rem 0">Gold: <strong style="color:#fbbf24">${S.gold}</strong></p>
<p style="font-size:0.95rem;margin:0 0 0.4rem 0;font-weight:bold;color:#dc2626">Going Rates</p>
<div style="display:flex;flex-direction:column;gap:0.15rem;align-items:center">
${[
  { label: '→L2', color: '#c0c0c0', esc: 0 },
  { label: '→L3', color: '#06b6d4', esc: 25 },
  { label: '→L4', color: '#9333ea', esc: 50 },
  { label: '→L5', color: '#d97706', esc: 100 }
].map(t => `<span style="color:${t.color};font-weight:bold;font-size:0.85rem;text-shadow:0 0 6px ${t.color}40"><span style="font-size:0.75rem">${t.label}</span> ${S.goingRate + t.esc}G</span>`).join('')}
</div>
<p style="font-size:0.65rem;margin:0.3rem 0 0 0;color:#a89cc8;font-style:italic">Each upgrade raises Going Rate by ${nextRateIncrease}G</p>
</div>`;

let html = `
<style>
@keyframes death-star-twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
.death-stars {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; overflow: hidden; border-radius: 12px;
}
.death-star {
  position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%;
  animation: death-star-twinkle var(--twinkle-duration, 3s) ease-in-out infinite;
  animation-delay: var(--twinkle-delay, 0s);
}
@keyframes reaper-glow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(220,38,38,0.4)) drop-shadow(0 0 40px rgba(220,38,38,0.2)); }
  50% { filter: drop-shadow(0 0 30px rgba(220,38,38,0.6)) drop-shadow(0 0 60px rgba(220,38,38,0.3)) drop-shadow(0 0 90px rgba(168,85,247,0.15)); }
}
@keyframes death-quote-shrink {
  0% { font-size: 1.6rem; opacity: 1; }
  100% { font-size: 0.85rem; opacity: 0.85; }
}
.ds-reaper-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  max-width: 80%;
  height: auto;
  opacity: 0.18;
  pointer-events: none;
  z-index: 0;
  animation: reaper-glow 3s ease-in-out infinite;
  mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 90%, transparent 100%);
}
.ds-card {
  background: rgba(15,15,35,0.85);
  padding: 0.6rem;
  border-radius: 8px;
  border: 2px solid;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  text-align: center;
  backdrop-filter: blur(4px);
}
.ds-locked {
  background: rgba(26,26,46,0.9);
  padding: 1.5rem 1rem;
  border-radius: 12px;
  border: 3px solid;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  backdrop-filter: blur(4px);
}
.ds-top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.ds-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  align-items: start;
}
.ds-sigil-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
@media (max-width: 700px) {
  .ds-top-row {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .ds-main-grid {
    grid-template-columns: 1fr;
  }
  .ds-reaper-bg {
    width: 300px;
    opacity: 0.12;
  }
}
</style>
<div class="death-screen-container" style="position:relative;background:linear-gradient(180deg,#0a0e27 0%,#1a1033 40%,#0d1117 100%);padding:1.25rem;border-radius:12px;max-width:960px;margin:0 auto;color:#e8e0f0;box-shadow:0 4px 24px rgba(0,0,0,0.6);border:1px solid rgba(220,38,38,0.3);overflow:hidden">
<div class="death-stars" id="deathStars"></div>
<img src="assets/reaper.png" alt="" class="ds-reaper-bg">
<div style="position:relative;z-index:1">

<!-- HEADER: Title + Quote -->
<h1 style="text-align:center;margin:0 0 0.25rem 0;font-size:1.8rem;color:#dc2626;text-shadow:0 0 20px rgba(220,38,38,0.5)">DEATH'S SHOP</h1>
${deathQuote ? `<div style="text-align:center;margin-bottom:0.75rem;padding:0.3rem 1rem;background:rgba(0,0,0,0.4);border-radius:8px;display:inline-block;width:100%"><p id="deathQuoteInline" style="margin:0;font-size:0.85rem;color:#a89cc8;font-style:italic">"${deathQuote}"</p></div>` : ''}

<!-- TOP ROW: Death Boys | Going Rates -->
<div class="ds-top-row">
<div>${deathBoysCell}</div>
<div>${goingRatesCell}</div>
</div>`;

if(S.gold === 0) {
html += `<p style="text-align:center;margin:2rem 0;font-size:1.1rem;color:#f87171;font-style:italic">"Nothing? Really? Come back when you have something to offer."</p>`;
} else {

// MAIN 3-COLUMN GRID: Core | Advanced | Passive
html += `<div class="ds-main-grid">`;

// Column 1: Core Sigils (2x2)
html += `<div>
<h4 style="color:#2c63c7;margin:0 0 0.5rem 0;text-align:center;font-size:1rem">Core Sigils</h4>
<div class="ds-sigil-grid">`;
html += renderSigilCards(coreSigils);
html += `</div></div>`;

// Column 2: Advanced Sigils
html += `<div>
<h4 style="color:#f97316;margin:0 0 0.5rem 0;text-align:center;font-size:1rem">Advanced Sigils</h4>`;
if(S.advancedSigilsUnlocked) {
html += `<div class="ds-sigil-grid">`;
html += renderSigilCards(advancedSigils);
html += `</div>`;
} else {
html += renderLockedCategory('Unlock advanced combat techniques', 'Ghost • Alpha • Grapple', '#f97316', 20, 'advanced');
}
html += `</div>`;

// Column 3: Passive Sigils + Continue button
html += `<div>
<h4 style="color:#9333ea;margin:0 0 0.5rem 0;text-align:center;font-size:1rem">Passive Sigils</h4>`;
if(S.passiveSigilsUnlocked) {
html += `<div class="ds-sigil-grid">`;
html += renderSigilCards(passiveSigils);
html += `</div>`;
} else {
html += renderLockedCategory('Unlock passive enhancements', 'Expand • Asterisk • Star', '#9333ea', 50, 'passive');
}
// Continue button tucked into bottom of rightmost column
html += `
<div style="margin-top:1rem;text-align:center">
<button class="btn danger" onclick="restartAfterDeath()" style="font-size:1rem;padding:0.6rem 1.5rem;width:100%">Return to Ribbleton</button>
</div>`;
html += `</div>`;

html += `</div>`; // close ds-main-grid
}

// No gold fallback still gets Continue button
if(S.gold === 0) {
html += `
<div style="text-align:center;margin-top:1.5rem">
<button class="btn danger" onclick="restartAfterDeath()" style="font-size:1rem;padding:0.6rem 1.5rem">Return to Ribbleton</button>
</div>`;
}

html += `
</div>
</div>`;

v.innerHTML = html;

// Generate stars for the death screen background
const starsContainer = document.getElementById('deathStars');
if(starsContainer) {
  for(let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.className = 'death-star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--twinkle-duration', (2 + Math.random() * 4) + 's');
    star.style.setProperty('--twinkle-delay', (Math.random() * 3) + 's');
    if(Math.random() > 0.7) { star.style.width = '3px'; star.style.height = '3px'; }
    starsContainer.appendChild(star);
  }
}
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
// JUICE: Power up sound + screen flash for sigil upgrade
SoundFX.play('powerUp');
const flash = document.createElement('div');
flash.className = 'upgrade-flash';
document.body.appendChild(flash);
setTimeout(() => flash.remove(), 600);
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
const unlockFlash = document.createElement('div');
unlockFlash.className = 'upgrade-flash';
document.body.appendChild(unlockFlash);
setTimeout(() => unlockFlash.remove(), 600);
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
SoundFX.play('coinDrop');
toast(`Sold ${sig} L${oldLevel}→L${newLevel} for ${S.goingRate}G!`, 1800);
savePermanent();
showDeathScreen(); // Refresh
setTimeout(() => showDeathBoyModal('sell'), 50);
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
SoundFX.play('stun');
toast(`Sacrificed ${sig} L${oldLevel}→L${newLevel} for +${xpGained}XP permanently!`, 1800);
savePermanent();
showDeathScreen(); // Refresh
setTimeout(() => showDeathBoyModal('sacrifice'), 50);
}

function showDeathBoyModal(type) {
const allSigils = ['Attack', 'Shield', 'Heal', 'D20', 'Ghost', 'Alpha', 'Grapple', 'Expand', 'Asterisk', 'Star'];
const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
const isSell = type === 'sell';
const accentColor = isSell ? '#22c55e' : '#a855f7';
const bgTint = isSell ? 'rgba(34,197,94,0.1)' : 'rgba(168,85,247,0.1)';
const borderTint = isSell ? 'rgba(34,197,94,0.4)' : 'rgba(168,85,247,0.4)';

let title, desc, infoLines;
if(isSell) {
title = 'Death Boy 1: "Sell Back"';
desc = 'Remove one upgrade level from any sigil and get Gold equal to the base Going Rate (no rate increase)';
infoLines = `<div style="font-size:0.9rem;margin-bottom:1rem;opacity:0.8">Sell value: <strong style="color:#fbbf24">${S.goingRate}G</strong></div>`;
} else {
title = 'Death Boy 2: "Sacrifice"';
desc = `Sacrifice one upgrade level to gain <strong style="color:#fbbf24">${S.goingRate} Starting XP</strong> permanently. Going Rate decreases by 5G.`;
infoLines = `<div style="font-size:0.9rem;margin-bottom:0.5rem;opacity:0.8">Current Starting XP: <strong style="color:#fbbf24">${S.startingXP}</strong></div>
<div style="font-size:0.9rem;margin-bottom:1rem;opacity:0.8">Going Rate: ${S.goingRate}G → <strong>${Math.max(1, S.goingRate - 5)}G</strong></div>`;
}

let sigilRows = '';
allSigils.forEach(sig => {
const permLevel = S.sig[sig] || 0;
const isActive = actives.includes(sig);
const currentLevel = isActive ? permLevel + 1 : permLevel;
const canAct = isSell ? permLevel > 0 : (permLevel > 0 && S.goingRate > 1);
const btnText = isSell
  ? (canAct ? `Sell for ${S.goingRate}G` : 'Cannot Sell')
  : (canAct ? `+${S.goingRate}XP` : 'Cannot');
const action = isSell ? `deathBoySellBack('${sig}')` : `deathBoySacrifice('${sig}')`;
sigilRows += `
<div style="background:rgba(0,0,0,0.3);padding:0.6rem 0.75rem;margin-bottom:0.5rem;border-radius:6px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:1rem">${sigilIconWithTooltip(sig, currentLevel, 750)} <strong>L${currentLevel}</strong></span>
<button class="btn" ${!canAct ? 'disabled' : ''} onclick="${action}" style="padding:0.4rem 0.8rem;font-size:0.85rem">
${btnText}
</button>
</div>`;
});

// Create modal overlay
const overlay = document.createElement('div');
overlay.id = 'deathBoyModal';
overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem';
overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

overlay.innerHTML = `
<div style="background:linear-gradient(180deg,#0a0e27,#1a1033);border:2px solid ${borderTint};border-radius:12px;padding:1.5rem;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;color:#e8e0f0;box-shadow:0 8px 32px rgba(0,0,0,0.6)">
<h3 style="color:${accentColor};margin-bottom:0.5rem;text-align:center;font-size:1.3rem">${title}</h3>
<p style="font-size:0.85rem;margin-bottom:1rem;opacity:0.9;text-align:center">${desc}</p>
${infoLines}
${sigilRows}
<div style="text-align:center;margin-top:1rem">
<button class="btn" onclick="document.getElementById('deathBoyModal').remove()" style="padding:0.5rem 1.5rem;font-size:0.9rem">Close</button>
</div>
</div>`;

document.body.appendChild(overlay);
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
<h2 style="margin-bottom:1.5rem;font-size:1.8rem;color:#22c55e">Welcome to the Endgame!</h2>

<p style="margin-bottom:1.5rem;font-size:1.1rem;line-height:1.6">
You've defeated the Flydra and brought Tapo home once... but his craving for Flydra flesh led him right back in!
</p>

<div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin:2rem 0">
<div style="flex:1;min-width:200px;background:rgba(59,130,246,0.2);border:2px solid #3b82f6;border-radius:8px;padding:1rem">
<h3 style="color:#3b82f6;margin-bottom:0.5rem">Standard Runs</h3>
<p style="font-size:0.9rem;color:#94a3b8">Earn <strong style="color:#fbbf24">Figurines</strong> for surviving heroes. Permanently boost your stats!</p>
</div>

<div style="flex:1;min-width:200px;background:rgba(34,197,94,0.2);border:2px solid #22c55e;border-radius:8px;padding:1rem">
<h3 style="color:#22c55e;margin-bottom:0.5rem">Frogged Up Runs</h3>
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
The Flydra's Conquerors
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
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:3rem"></div>
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
<p style="margin:0.5rem 0;font-size:1rem"><strong>Current Mode:</strong> <span style="color:${S.gameMode === 'fu' ? '#22c55e' : '#3b82f6'}">${S.gameMode === 'Standard' ? 'Standard' : 'FROGGED UP'}</span></p>
<p style="margin:0.5rem 0;font-size:0.9rem;opacity:0.8">Click the <strong>pedestal</strong> to manage figurines (${pedestalCount}/${maxSlots})</p>
<p style="margin:0.5rem 0;font-size:0.9rem"><strong>Blue Portal:</strong> Standard Mode | <strong>Green Portal:</strong> Frogged Up Mode</p>
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
toast(`Entered ${targetMode === 'Standard' ? 'Standard' : 'Frogged Up'} Realm!`);
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
savePermanent();
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
slotsHTML += `<div style="font-size:2.5rem;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));animation:frogBounce 1.5s ease-in-out infinite"></div>`;
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
<h2 style="margin:0;color:#fbbf24;text-shadow:0 2px 8px rgba(0,0,0,0.9);font-size:1.3rem">Pedestal of Champions</h2>
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
showConfirmModal('Remove this figurine from the pedestal?', () => {
const idx = S.pedestal.findIndex(p => p.hero === hero && p.stat === stat && p.mode === S.gameMode);
if(idx >= 0) {
S.pedestal.splice(idx, 1);
savePermanent();
toast(`${hero} ${stat} figurine removed!`);
showPedestal();
}
});
}

// ===== WIN =====
function win() {
// JUICE: Victory ceremony sound + game over (victory) music!
GameMusic.playScene('game_over');
SoundFX.play('gameOverCeremony');

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
{bg: 'assets/victory-room.png', text: "19 grueling floors later, the heroes finally find him — Tapo the Tadpole, lying still on the cold stone floor."},
{bg: 'assets/victory-room.png', text: "TAPO_FOOD_COMA",
html: `
<style>
@keyframes tapoSleep {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.02); }
}
@keyframes flydraFade {
  0% { opacity: 0.6; }
  50% { opacity: 0.4; }
  100% { opacity: 0.6; }
}
</style>
<div style="text-align:center;position:relative;margin:1rem 0">
<div style="position:relative;display:inline-block">
<img src="assets/Hydra.png" alt="The defeated Flydra" style="width:280px;height:auto;opacity:0.5;filter:grayscale(0.5) brightness(0.7);animation:flydraFade 3s ease-in-out infinite">
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);animation:tapoSleep 2s ease-in-out infinite">
<img src="assets/tapo_normal.png" alt="Tapo in food coma" style="width:90px;height:auto;filter:drop-shadow(0 0 10px rgba(34,197,94,0.6))">
</div>
</div>
</div>
<div class="narrative-text" style="font-size:1.25rem;line-height:1.7;text-align:center;color:#fff;text-shadow:1px 1px 4px rgba(0,0,0,0.9);margin-top:1rem">But as they rush forward, one tiny eye cracks open. The little tadpole lets out a mighty <strong style="color:#fbbf24">belch</strong>, filling the room with the unmistakable scent of Flydra flesh. His belly is impossibly round. He's fine — just in a food coma.</div>
`},
{bg: 'assets/victory-room.png', text: "Scattered around Tapo are small carvings — figurines of the heroes who came to save him! Clutched in his budding appendages, he offers them proudly."},
{bg: 'assets/victory-room.png', text: "The heroes notice that the statues are juuust the right size to slot into the nearby pedestal!", action: 'statue_slotting'},
{bg: 'assets/victory-room.png', text: () => `As the statues click into place, a warm ripple of power surges through the heroes. <strong style='color:#fbbf24'>${getSlottedStatsText()}</strong>`, dynamic: true},
{bg: 'assets/victory-room.png', text: "The heroes hoist their well-fed tadpole onto their shoulders and begin the journey back to Ribbleton. Wait... What's this portal?"},
{bg: 'assets/ribbleton.png', text: "WHOOSH! One portal trip later, and the crew is back safe and sound in Ribbleton. Off to the Lilypad Pond for a well-earned night of sleep!"},
{bg: 'assets/ribbleton.png', text: "INTERSTITIAL_HERO_CARDS", action: 'hero_cards_interstitial'},
{bgColor: '#0a0a1a',
html: `
<style>
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
@keyframes moonGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(251,191,36,0.3); }
  50% { box-shadow: 0 0 50px rgba(251,191,36,0.5); }
}
@keyframes tummyRumble {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}
@keyframes tapoSneak {
  0% { transform: translateX(0) scaleX(-1); opacity: 1; }
  100% { transform: translateX(120px) scaleX(-1); opacity: 0; }
}
</style>
<div style="position:relative;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden">
<!-- Stars -->
<div style="position:absolute;top:10%;left:15%;width:3px;height:3px;background:#fff;border-radius:50%;animation:twinkle 2s ease-in-out infinite"></div>
<div style="position:absolute;top:8%;left:45%;width:2px;height:2px;background:#fff;border-radius:50%;animation:twinkle 3s ease-in-out 0.5s infinite"></div>
<div style="position:absolute;top:15%;left:75%;width:3px;height:3px;background:#fff;border-radius:50%;animation:twinkle 2.5s ease-in-out 1s infinite"></div>
<div style="position:absolute;top:5%;left:60%;width:2px;height:2px;background:#fff;border-radius:50%;animation:twinkle 1.8s ease-in-out 0.3s infinite"></div>
<div style="position:absolute;top:20%;left:30%;width:2px;height:2px;background:#fff;border-radius:50%;animation:twinkle 2.2s ease-in-out 1.5s infinite"></div>
<div style="position:absolute;top:12%;left:85%;width:3px;height:3px;background:#fff;border-radius:50%;animation:twinkle 2.8s ease-in-out 0.8s infinite"></div>
<!-- Moon -->
<div style="position:absolute;top:5%;right:10%;width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #fbbf24, #f59e0b);animation:moonGlow 4s ease-in-out infinite"></div>
<!-- Sleeping Tapo -->
<div style="animation:tummyRumble 1.5s ease-in-out 2s 3">
<img src="assets/tapo_normal.png" alt="Tapo sleeping" style="width:120px;height:auto;filter:brightness(0.7)">
</div>
<div style="margin-top:1.5rem;max-width:500px">
<p style="font-size:1.2rem;line-height:1.8;text-align:center;color:#c4b5fd;text-shadow:1px 1px 4px rgba(0,0,0,0.9)">
That night, Tapo's tummy <strong style="color:#f97316">rumbles</strong>. He tosses and turns. He's tasted <strong style="color:#e94560">Flydra flesh</strong>, and now nothing else will satisfy the craving...
</p>
</div>
</div>
`, text: "That night, Tapo's tummy rumbles..."},
{bgColor: '#0a0a1a',
html: `
<style>
@keyframes portalCrackle {
  0%, 100% { box-shadow: 0 0 30px #22c55e, 0 0 60px rgba(34,197,94,0.3); transform: scale(1); }
  50% { box-shadow: 0 0 50px #22c55e, 0 0 90px rgba(34,197,94,0.5); transform: scale(1.05); }
}
</style>
<div style="text-align:center">
<div style="position:relative;display:inline-block;margin:1.5rem 0">
<div style="width:160px;height:160px;margin:0 auto;border-radius:50%;background:radial-gradient(circle, #22c55e, #064e3b 70%, #000);animation:portalCrackle 1.5s ease-in-out infinite"></div>
</div>
<div style="margin:1rem 0">
<img src="assets/tapo_normal.png" alt="Tapo sneaking" style="width:80px;height:auto;transform:scaleX(-1);filter:drop-shadow(0 0 8px rgba(34,197,94,0.5))">
</div>
<p style="font-size:1.2rem;line-height:1.8;color:#c4b5fd;text-shadow:1px 1px 4px rgba(0,0,0,0.9);max-width:500px;margin:0 auto">
Tapo sneaks out and finds a newly appeared portal, crackling with <strong style="color:#22c55e">dark green energy</strong>. He knows just where to find more Flydra. Before anyone can stop him, the little bugger squirms his way in. <span style="font-size:1.2em;font-weight:bold;color:#22c55e">Here we go again!</span>
</p>
</div>
`, text: "Tapo sneaks out toward a new portal..."}
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
toast('Tapo has gone hunting for Flydra in the Frogged Up realm! You must follow!', 2500);
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
${pedestalBonus ? `<div style="font-size:0.8rem;color:#fbbf24;margin-bottom:0.5rem">${pedestalBonus}</div>` : ''}
<div style="font-size:0.7rem">${sigilsHTML}</div>
</div>`;
});
heroCardsHTML += '</div>';

v.innerHTML = `
<div style="max-width:700px;margin:0 auto;padding:2rem;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);border-radius:12px;border:3px solid #22c55e;color:#fff;text-align:center">
<h2 style="margin-bottom:0.5rem;color:#22c55e;font-size:1.8rem">Congratulations!</h2>
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
const heroIcons = {'Warrior': 'W', 'Tank': 'T', 'Mage': 'M', 'Healer': 'H'};
const stats = ['POW', 'HP'];

// Get earned figurines - only heroes who earned one this run
const earnedFigurines = window.earnedFigurines || [];
const totalToSlot = earnedFigurines.length;

// If no figurines earned, skip pedestal entirely
if(totalToSlot === 0) { onComplete(); return; }

// Track which heroes have slotted THIS session (to enforce 1 figurine per hero per victory)
if(!window.heroesSlottedThisVictory) window.heroesSlottedThisVictory = [];
const slotsThisSession = window.heroesSlottedThisVictory.length;

const heroesToShow = earnedFigurines;

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
<div style="font-size:1.5rem">${heroIcons[hero] || '?'}</div>
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
<h2 style="text-align:center;margin-bottom:1rem;color:#fbbf24">Slot Your Figurines!</h2>
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

function showFUVictoryCredits() {
const v = document.getElementById('gameView');

// Check if this is a Tapo victory (gated behind beating FU with Tapo)
const tapoInParty = S.heroes.some(h => (h.base || h.n) === 'Tapo');

v.innerHTML = `
<div style="max-width:600px;margin:2rem auto;padding:2rem;background:linear-gradient(135deg,#1e1b4b 0%,#7c2d12 100%);border-radius:12px;border:3px solid #22c55e;color:#fff">
<h1 style="text-align:center;margin-bottom:2rem;font-size:2.5rem">FROGGED UP MODE CONQUERED!</h1>

<div style="text-align:center;margin-bottom:2rem;font-size:1.2rem;line-height:1.8">
<p>Holy frog. You defeated the ${tapoInParty ? '(second) ' : ''}hardest challenge in FROGGLE.</p>
<p style="margin-top:1rem">Thank you for playing. No other thank yous really matter - <strong>YOU</strong>, the Player, deserve all the thanks in the world.</p>
${!tapoInParty ? `<p style="margin-top:1.5rem;font-style:italic;color:#fbbf24">Now, think you can beat the FROGGED UP Flydra with Tapo in your party?</p>` : ''}
<p style="font-size:2rem;margin:2rem 0"></p>
</div>

<div style="background:rgba(0,0,0,0.3);padding:1.5rem;border-radius:8px;margin:2rem 0">
<h3 style="text-align:center;margin-bottom:1rem;color:#22c55e">FROGGLE</h3>
<div style="text-align:center;font-size:0.9rem;line-height:2;opacity:0.9">
<p><strong>A DubsPubs game by Preston Wesley Evans</strong></p>
<p>Game Design, Code & Music: Preston Wesley Evans</p>
<p style="font-size:0.8rem;font-style:italic;opacity:0.8">AI coding assistance by Claude, by Anthropic</p>
<p>Character Art: Harimoon • Environmental Art: Zabiier</p>
<p>Official Playtesters: Ari, Michael Griffin</p>
<p>Additional Playtesters: Noel McKillip, Ryan Evertz</p>
<p>The Frogs: Charlie Schmidt, Matt Sutz, Ray Willess</p>
<p>Support: Lisa Evans</p>
<p style="font-size:0.75rem;opacity:0.7">Special Thanks: Jason Tsui, Sam Kern, Erin Keif, Adal Rifai, JPC</p>
</div>
</div>

<div style="background:rgba(251,191,36,0.2);padding:1.5rem;border-radius:8px;margin:2rem 0;border:2px solid #22c55e">
<h3 style="text-align:center;margin-bottom:1rem">TAPO UNLOCKED!</h3>
<img src="assets/tapo_normal.png" alt="Tapo the Tadpole" style="max-width:200px;height:auto;display:block;margin:1rem auto;border-radius:8px">
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
<h1 style="text-align:center;margin-bottom:2rem;font-size:3rem;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">VICTORY!</h1>

<div style="text-align:center;margin:2rem 0">
<div style="display:inline-block;animation:tapoSignatureVictory 4.8s ease-in-out infinite">
<img src="assets/tapo_normal.png" alt="Tapo celebrating" style="max-width:250px;height:auto;display:block;margin:0 auto 2rem auto">
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
// Music stopped on victory - no procedural music
const v = document.getElementById('gameView');
let html = `
<h1 style="text-align:center;margin:2rem 0;font-size:2.5rem">VICTORY!</h1>`;

if(S.gameMode === 'fu') {
html += `<p style="text-align:center;margin-bottom:2rem;font-size:1.2rem">You conquered the Frogged Up realm once again!<br>Impressive.</p>`;
} else {
html += `<img src="assets/tapo_normal.png" alt="Tapo saved!" style="max-width:100%;height:auto;max-width:400px;margin:1rem auto;display:block;border-radius:8px;border:3px solid #000">`;
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
<h3 style="text-align:center;margin-bottom:0.5rem">Hero Figurines Earned!</h3>
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
  learning: { name: 'Getting Started', icon: '', order: 1 },
  heroes: { name: 'Hero Exploration', icon: '', order: 2 },
  neutrals: { name: 'Neutral Encounters', icon: '', order: 3 },
  milestones: { name: 'Milestones', icon: '', order: 4 },
  combat: { name: 'Combat Mastery', icon: '', order: 5 },
  repeatable: { name: 'Ongoing Challenges', icon: '', order: 6 },
  fu: { name: 'Frogged Up', icon: '', order: 7 },
  secret: { name: 'Secrets', icon: '', order: 8 }
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
  trackQuestProgress('gold', quest.reward);
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
  SoundFX.play('questComplete');
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
  <h1 style="margin:0;font-size:1.8rem;color:#fbbf24">Quest Board</h1>
  <div style="font-size:1rem;color:#22c55e">${S.gold}G${pendingGold > 0 ? ` <span style="opacity:0.8">(+${pendingGold}G)</span>` : ''}</div>
</div>

<p style="text-align:center;margin-bottom:1rem;font-size:0.9rem;opacity:0.8">Complete quests to earn gold rewards!</p>
`;

  for(const category of sortedCategories) {
    const quests = questsByCategory[category];
    const catInfo = QUEST_CATEGORIES[category] || { name: category, icon: '' };

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
// Music: play town theme in Ribbleton
GameMusic.playScene('town_base');
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
@keyframes quest-board-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(251,191,36,0.2); }
  50% { box-shadow: 0 0 25px rgba(251,191,36,0.5); }
}
</style>
<div class="full-screen-content" style="position:relative;width:100%;overflow:hidden">
<!-- Full-page background image -->
<img src="assets/ribbleton.png" alt="" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0">

<!-- Title overlay at top -->
<div style="position:absolute;top:0;left:0;right:0;z-index:10;padding:1rem;background:linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)">
<h1 style="text-align:center;margin:0;font-size:2rem;color:#22c55e;text-shadow:2px 2px 6px rgba(0,0,0,0.9), 0 0 20px rgba(34,197,94,0.5)">
Welcome Home to Ribbleton!
</h1>
</div>


<!-- Lilypad Pond (bottom-left) - Blue circle portal, same size as red portal -->
${S.pondHistory && S.pondHistory.length > 0 ? `
<div style="position:absolute;bottom:1rem;left:1rem;z-index:10">
<div onclick="showPond()" role="button" aria-label="The Pond - Reflect on your adventures" tabindex="0" style="cursor:pointer;transition:transform 0.2s;text-align:center"
     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
     onkeydown="if(event.key==='Enter')showPond()"
     title="Reflect on your adventures at the Lilypad Pond">
  <div style="width:120px;height:120px;position:relative;border-radius:50%;background:radial-gradient(circle, #3b82f6, #1e3a8a);animation:ribbleton-portal-pulse 1.2s ease-in-out infinite;box-shadow:0 0 40px #3b82f6">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:4rem"></div>
  </div>
  <p style="margin-top:0.5rem;font-size:1rem;font-weight:bold;color:#fff;text-shadow:2px 2px 4px rgba(0,0,0,0.9);background:rgba(59,130,246,0.8);padding:0.25rem 0.75rem;border-radius:6px;border:2px solid #3b82f6">The Pond</p>
</div>
</div>
` : ''}

<!-- Red Portal (bottom-right) - Always Available -->
<div style="position:absolute;bottom:1rem;right:1rem;z-index:10">
<div onclick="enterRedPortal()" role="button" aria-label="Save Tapo - Begin your adventure" tabindex="0" style="cursor:pointer;transition:transform 0.2s;text-align:center"
     onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
     onkeydown="if(event.key==='Enter')enterRedPortal()"
     title="Click to begin your adventure and save Tapo!">
  <div style="width:120px;height:120px;position:relative;border-radius:50%;background:radial-gradient(circle, #dc2626, #7c2d12);animation:ribbleton-portal-pulse 1s ease-in-out infinite;box-shadow:0 0 40px #dc2626">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:4rem"></div>
  </div>
  <p style="margin-top:0.5rem;font-size:1rem;font-weight:bold;color:#fff;text-shadow:2px 2px 4px rgba(0,0,0,0.9);background:rgba(220,38,38,0.8);padding:0.25rem 0.75rem;border-radius:6px;border:2px solid #dc2626">Save Tapo!</p>
</div>
</div>

<!-- Quest Board Hotspot (positioned over art's wooden board on right side) -->
<div style="position:absolute;top:28%;right:18%;z-index:10;width:11%;height:28%">
  <div onclick="showQuestBoard()" role="button" aria-label="Quest Board - View quests and claim rewards" tabindex="0"
       style="cursor:pointer;width:100%;height:100%;border-radius:6px;transition:all 0.3s;position:relative;${getClaimableQuestCount() > 0 ? 'animation:quest-board-glow 2s ease-in-out infinite;' : ''}"
       onmouseover="this.style.boxShadow='0 0 20px rgba(251,191,36,0.6)';this.style.background='rgba(251,191,36,0.12)'"
       onmouseout="this.style.boxShadow='${getClaimableQuestCount() > 0 ? '' : 'none'}';this.style.background='transparent'"
       onkeydown="if(event.key==='Enter')showQuestBoard()"
       title="Quest Board">
    ${getClaimableQuestCount() > 0 ? `<span style="position:absolute;top:-8px;right:-8px;background:#22c55e;color:#000;font-weight:bold;font-size:0.9rem;padding:0.15rem 0.5rem;border-radius:10px;border:2px solid #000;animation:pulse-glow 1.5s ease-in-out infinite;z-index:11">${getClaimableQuestCount()}</span>` : ''}
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

