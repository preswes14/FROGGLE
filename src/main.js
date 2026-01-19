// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('./sw.js')
.then(reg => {
debugLog('[SW] Service worker registered:', reg.scope);

// Check for updates immediately and periodically
reg.update().catch(() => {});

// Check for updates every 60 seconds while app is open
setInterval(() => {
reg.update().catch(() => {});
}, 60000);

// Handle waiting service worker (update available)
if (reg.waiting) {
debugLog('[SW] Update waiting, activating...');
reg.waiting.postMessage({ type: 'SKIP_WAITING' });
}

// Listen for new service worker installing
reg.addEventListener('updatefound', () => {
const newWorker = reg.installing;
debugLog('[SW] Update found, installing...');

newWorker.addEventListener('statechange', () => {
if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
debugLog('[SW] New version installed, activating...');
newWorker.postMessage({ type: 'SKIP_WAITING' });
}
});
});
})
.catch(err => console.warn('[SW] Registration failed:', err));

// Reload page when new service worker takes control
navigator.serviceWorker.addEventListener('controllerchange', () => {
debugLog('[SW] Controller changed, reloading for update...');
window.location.reload();
});
}

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
S.fuUnlocked = j.fuUnlocked || false;
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
applyVolumeSettings(); // Apply audio volume settings
initToastLog(); // Initialize toast log UI
initSuspendSystem(); // Initialize autosave and suspend/resume system
GamepadController.init(); // Initialize Steam Deck / controller support
mainTitlePage();
debugLog('[FROGGLE] mainTitlePage called');
};

// VISIBLE error overlay for debugging (especially Steam Deck where console isn't accessible)
function showErrorOverlay(title, details) {
  let overlay = document.getElementById('errorOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'errorOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);color:#ff6b6b;padding:2rem;z-index:999999;overflow:auto;font-family:monospace;font-size:14px;';
    document.body.appendChild(overlay);
  }
  const errorHtml = `
    <div style="max-width:800px;margin:0 auto;">
      <h1 style="color:#ff6b6b;margin-bottom:1rem;">⚠️ ${title}</h1>
      <pre style="background:#1a1a1a;padding:1rem;border-radius:8px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">${details}</pre>
      <p style="margin-top:1rem;color:#888;">Build: ${typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 'unknown'}</p>
      <button onclick="this.parentElement.parentElement.remove()" style="margin-top:1rem;padding:0.5rem 1rem;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">Dismiss</button>
    </div>
  `;
  overlay.innerHTML = errorHtml;
}

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
// Show visible error overlay
showErrorOverlay('JavaScript Error', `${e.message}\n\nFile: ${e.filename}\nLine: ${e.lineno}, Col: ${e.colno}\n\nStack:\n${e.error ? e.error.stack : 'No stack trace'}`);
}
}, true);

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
console.error('[FROGGLE] UNHANDLED PROMISE REJECTION:', e.reason);
showErrorOverlay('Unhandled Promise Rejection', String(e.reason));
});

// ===== MOBILE DOUBLE-TAP FOR AUTO-TARGET =====
// Only on touch devices: double-tap a sigil = select + auto-target
(function() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;

  let lastTapTime = 0;
  let lastTapTarget = null;

  document.addEventListener('touchend', (e) => {
    // Find if we tapped on a clickable sigil
    const sigil = e.target.closest('.sigil.clickable');
    if (!sigil) {
      lastTapTarget = null;
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    // Check for double-tap (same sigil, within 300ms)
    if (lastTapTarget === sigil && timeSinceLastTap < 300) {
      // Double-tap detected! Prevent default and call actAndAutoTarget
      e.preventDefault();
      e.stopPropagation();

      // Extract sigil name and hero index from onclick attribute
      const onclick = sigil.getAttribute('onclick');
      if (onclick && onclick.startsWith("act('")) {
        // Parse: act('Attack', 0) -> sig='Attack', heroIdx=0
        const match = onclick.match(/act\('(\w+)',\s*(\d+)\)/);
        if (match && typeof actAndAutoTarget === 'function') {
          const sig = match[1];
          const heroIdx = parseInt(match[2]);
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

