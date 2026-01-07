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
}
}, true);

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
console.error('[FROGGLE] UNHANDLED PROMISE REJECTION:', e.reason);
});

