// ===== ERROR HANDLERS (must be first to catch any errors during init) =====

// VISIBLE error overlay for debugging (especially Steam Deck where console isn't accessible)
function showErrorOverlay(title, details) {
  var overlay = document.getElementById('errorOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'errorOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);color:#ff6b6b;padding:2rem;z-index:999999;overflow:auto;font-family:monospace;font-size:14px;';
    document.body.appendChild(overlay);
  }
  var version = typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 'unknown';
  overlay.innerHTML =
    '<div style="max-width:800px;margin:0 auto;">' +
    '<h1 style="color:#ff6b6b;margin-bottom:1rem;">FROGGLE: ' + title + '</h1>' +
    '<pre style="background:#1a1a1a;padding:1rem;border-radius:8px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">' + details + '</pre>' +
    '<p style="margin-top:1rem;color:#888;">Build: ' + version + '</p>' +
    '<button onclick="this.parentElement.parentElement.remove()" style="margin-top:1rem;padding:0.5rem 1rem;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">Dismiss</button>' +
    '</div>';
}

// Global error handler for runtime errors and image loading failures
window.addEventListener('error', function(e) {
if(e.target && e.target.tagName === 'IMG') {
console.error('[FROGGLE] IMAGE LOAD FAILED:', e.target.src);
} else if(e.message) {
console.error('[FROGGLE] JAVASCRIPT ERROR:', e.message);
console.error('[FROGGLE] File:', e.filename, 'Line:', e.lineno, 'Col:', e.colno);
console.error('[FROGGLE] Stack:', e.error ? e.error.stack : 'No stack trace');
showErrorOverlay('JavaScript Error', e.message + '\n\nFile: ' + e.filename + '\nLine: ' + e.lineno + ', Col: ' + e.colno + '\n\nStack:\n' + (e.error ? e.error.stack : 'No stack trace'));
}
}, true);

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
console.error('[FROGGLE] UNHANDLED PROMISE REJECTION:', e.reason);
showErrorOverlay('Unhandled Promise Rejection', String(e.reason));
});

// ===== SERVICE WORKER REGISTRATION =====
// Skip service workers in Electron (file:// protocol doesn't support them)
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
navigator.serviceWorker.register('./sw.js')
.then(function(reg) {
debugLog('[SW] Service worker registered:', reg.scope);

// Check for updates immediately and periodically
reg.update().catch(function() {});

// Check for updates every 60 seconds while app is open
setInterval(function() {
reg.update().catch(function() {});
}, 60000);

// Handle waiting service worker (update available)
if (reg.waiting) {
debugLog('[SW] Update waiting, activating...');
reg.waiting.postMessage({ type: 'SKIP_WAITING' });
}

// Listen for new service worker installing
reg.addEventListener('updatefound', function() {
var newWorker = reg.installing;
debugLog('[SW] Update found, installing...');

newWorker.addEventListener('statechange', function() {
if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
debugLog('[SW] New version installed, activating...');
newWorker.postMessage({ type: 'SKIP_WAITING' });
}
});
});
})
.catch(function(err) { console.warn('[SW] Registration failed:', err); });

// Reload page when new service worker takes control
navigator.serviceWorker.addEventListener('controllerchange', function() {
debugLog('[SW] Controller changed, reloading for update...');
window.location.reload();
});
}

// ===== INIT =====
window.onload = function() {
try {
// Verify critical cross-module functions loaded correctly
['render', 'getLevel', 'toast', 'saveGame', 'savePermanent', 'startFloor'].forEach(function(fn) {
  if (typeof window[fn] !== 'function') console.error('[FROGGLE] Missing critical function: ' + fn);
});
debugLog('[FROGGLE] window.onload fired');
// Check for last used slot
var lastSlot = localStorage.getItem('froggle8_current_slot');
if(lastSlot) {
var slot = parseInt(lastSlot);
debugLog('[FROGGLE] Found last used slot:', slot);
// Try to load slot-specific permanent data
var permData = localStorage.getItem('froggle8_permanent_slot' + slot);
if(permData) {
try {
var j = JSON.parse(permData);
S.gold = j.gold || 0;
S.goingRate = j.goingRate || 1;
S.startingXP = j.startingXP || 0;
S.sig = j.sig || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
S.sigUpgradeCounts = j.sigUpgradeCounts || {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0};
// One-time fix: Detect and repair old saves with starter actives at L1 (should be L0)
var starterActives = ['Attack', 'Shield', 'Heal', 'D20'];
var needsFix = false;
starterActives.forEach(function(sig) {
if(S.sig[sig] === 1 && S.sigUpgradeCounts[sig] === 0) {
S.sig[sig] = 0;
needsFix = true;
}
});
if(needsFix) {
debugLog('[SAVE] Fixed old save format: starter actives L1→L0');
}
S.ancientStatueDeactivated = j.ancientStatueDeactivated || false;
S.ghostBoysConverted = j.ghostBoysConverted || false;
S.pedestal = j.pedestal || [];
S.hasReachedFloor20 = j.hasReachedFloor20 || false;
S.fuUnlocked = j.fuUnlocked || false;
S.forcedFUEntry = j.forcedFUEntry || false;
S.tapoUnlocked = j.tapoUnlocked || false;
S.advancedSigilsUnlocked = j.advancedSigilsUnlocked || false;
S.passiveSigilsUnlocked = j.passiveSigilsUnlocked || false;
S.runNumber = j.runNumber || 1;
S.runsAttempted = j.runsAttempted || 0;
S.helpTipsDisabled = j.helpTipsDisabled || false;
S.tooltipsDisabled = j.tooltipsDisabled || false;
S.highContrastMode = j.highContrastMode || false;
S.usedDeathQuotes = j.usedDeathQuotes || [];
S.controllerDisabled = j.controllerDisabled || false;
S.animationSpeed = j.animationSpeed !== undefined ? j.animationSpeed : 1;
S.masterVolume = j.masterVolume !== undefined ? j.masterVolume : 1.0;
S.sfxVolume = j.sfxVolume !== undefined ? j.sfxVolume : 1.0;
S.musicVolume = j.musicVolume !== undefined ? j.musicVolume : 1.0;
S.pondHistory = j.pondHistory || [];
// Apply high contrast mode if enabled
if(S.highContrastMode) document.body.classList.add('high-contrast');
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

try { applyVolumeSettings(); } catch(e) { console.warn('[FROGGLE] applyVolumeSettings failed:', e); }
try { initToastLog(); } catch(e) { console.warn('[FROGGLE] initToastLog failed:', e); }
try { initSuspendSystem(); } catch(e) { console.warn('[FROGGLE] initSuspendSystem failed:', e); }
try { Steam.init(); } catch(e) { console.warn('[FROGGLE] Steam.init failed:', e); }
try { GamepadController.init(); } catch(e) { console.warn('[FROGGLE] GamepadController.init failed:', e); }
mainTitlePage();
debugLog('[FROGGLE] mainTitlePage called');
} catch(e) {
console.error('[FROGGLE] FATAL: window.onload crashed:', e);
showErrorOverlay('Startup Crash', 'window.onload failed:\n\n' + (e.stack || e.message || String(e)));
}
};

// ===== MOBILE DOUBLE-TAP FOR AUTO-TARGET =====
// Only on touch devices: double-tap a sigil = select + auto-target
(function() {
  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;

  var lastTapTime = 0;
  var lastTapTarget = null;

  document.addEventListener('touchend', function(e) {
    // Find if we tapped on a clickable sigil
    var sigil = e.target.closest('.sigil.clickable');
    if (!sigil) {
      lastTapTarget = null;
      return;
    }

    var now = Date.now();
    var timeSinceLastTap = now - lastTapTime;

    // Check for double-tap (same sigil, within 300ms)
    if (lastTapTarget === sigil && timeSinceLastTap < 300) {
      // Double-tap detected! Prevent default and call actAndAutoTarget
      e.preventDefault();
      e.stopPropagation();

      // Extract sigil name and hero index from onclick attribute
      var onclick = sigil.getAttribute('onclick');
      if (onclick && onclick.startsWith("act('")) {
        // Parse: act('Attack', 0) -> sig='Attack', heroIdx=0
        var match = onclick.match(/act\('(\w+)',\s*(\d+)\)/);
        if (match && typeof actAndAutoTarget === 'function') {
          var sig = match[1];
          var heroIdx = parseInt(match[2]);
          debugLog('[TOUCH] Double-tap detected on sigil:', sig, 'hero:', heroIdx);
          actAndAutoTarget(sig, heroIdx);
        }
      }

      // Reset to prevent triple-tap continuing
      lastTapTarget = null;
      lastTapTime = 0;
    } else {
      // First tap or new target
      lastTapTarget = sigil;
      lastTapTime = now;
    }
  }, { passive: false });
})();
