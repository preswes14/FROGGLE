// ===== FROGGLE CONTROLLER - Keyboard-First Approach =====
// Steam Deck in browser mode converts controller to keyboard events
// This code handles those keyboard events directly

const GamepadController = {
  // State
  active: false,
  focusedElement: null,
  focusableElements: [],
  lastFocusedId: null,

  // Debounce tracking - prevents double-fire from rapid events
  lastActionTime: {},
  DEBOUNCE_MS: 150, // Ignore same action within 150ms

  // Initialize controller system
  init() {
    debugLog('[CONTROLLER] Initializing keyboard-first controller...');

    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[CONTROLLER] Controller support disabled in settings');
      return;
    }

    this.initKeyboard();
    this.initTouchDetection();

    debugLog('[CONTROLLER] Initialization complete');
  },

  // Check debounce - returns true if action should be allowed
  shouldAllowAction(action) {
    const now = Date.now();
    const lastTime = this.lastActionTime[action] || 0;
    if (now - lastTime < this.DEBOUNCE_MS) {
      debugLog('[CONTROLLER] Debounced:', action);
      return false;
    }
    this.lastActionTime[action] = now;
    return true;
  },

  // Main keyboard handler - this is where Steam Deck input arrives
  initKeyboard() {
    document.addEventListener('keydown', e => {
      if (typeof S !== 'undefined' && S.controllerDisabled) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ignore key repeat (holding button down)
      if (e.repeat) return;

      let handled = false;
      let action = null;

      switch (e.key) {
        // D-pad / Arrow keys
        case 'ArrowUp':
          action = 'up';
          this.handleDirection('up');
          handled = true;
          break;
        case 'ArrowDown':
          action = 'down';
          this.handleDirection('down');
          handled = true;
          break;
        case 'ArrowLeft':
          action = 'left';
          this.handleDirection('left');
          handled = true;
          break;
        case 'ArrowRight':
          action = 'right';
          this.handleDirection('right');
          handled = true;
          break;

        // A button - Enter only (not Space to avoid double-fire)
        case 'Enter':
          action = 'A';
          if (this.shouldAllowAction('A')) {
            this.handleA();
          }
          handled = true;
          break;

        // Space - treat as separate from Enter to avoid double-fire
        case ' ':
          action = 'Space';
          if (this.shouldAllowAction('A')) { // Still debounce against A
            this.handleA();
          }
          handled = true;
          break;

        // B button - Escape OR Backspace (Steam uses Backspace for B)
        case 'Escape':
        case 'Backspace':
          action = 'B';
          if (this.shouldAllowAction('B')) {
            this.handleB();
          }
          handled = true;
          break;

        // Tab for navigation
        case 'Tab':
          action = 'Tab';
          this.handleDirection(e.shiftKey ? 'left' : 'right');
          handled = true;
          break;

        // X button - some Steam configs send 'x' key
        case 'x':
        case 'X':
          action = 'X';
          if (this.shouldAllowAction('X')) {
            this.handleX();
          }
          handled = true;
          break;

        // Y button - some Steam configs send 'y' key
        case 'y':
        case 'Y':
          action = 'Y';
          if (this.shouldAllowAction('Y')) {
            this.handleY();
          }
          handled = true;
          break;

        // Start/Menu button - often mapped to Escape in some configs
        // (handled above with B)

        // Page navigation (bumpers often map to these)
        case 'PageUp':
          action = 'PageUp';
          this.scrollPage('up');
          handled = true;
          break;
        case 'PageDown':
          action = 'PageDown';
          this.scrollPage('down');
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        if (!this.active) this.activate();
      }
    });

    // Also handle mouse clicks (Steam might map A to left-click)
    document.addEventListener('mousedown', e => {
      if (typeof S !== 'undefined' && S.controllerDisabled) return;

      // If we get a mouse event while controller is active,
      // it might be from Steam mapping a button to click
      // Don't interfere - let the click happen naturally
    });
  },

  // Touch detection - deactivate controller mode on touch
  initTouchDetection() {
    document.addEventListener('touchstart', () => {
      if (this.active) {
        debugLog('[CONTROLLER] Touch detected, deactivating controller mode');
        this.deactivate();
      }
    }, { passive: true });
  },

  // Activate controller mode (show focus ring)
  activate() {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('controller-active');
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      const best = this.findBestDefaultFocus();
      this.setFocus(best || this.focusableElements[0]);
    }
    debugLog('[CONTROLLER] Activated');
  },

  // Deactivate controller mode
  deactivate() {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('controller-active');
    this.clearFocus();
    debugLog('[CONTROLLER] Deactivated');
  },

  // ===== CONTEXT DETECTION =====

  getContext() {
    const tutorialModal = document.querySelector('.tutorial-modal-backdrop');
    if (tutorialModal) return 'tutorial';

    const confirmModal = document.querySelector('.confirm-modal');
    if (confirmModal) return 'confirm';

    if (typeof S !== 'undefined' && S.suspended) return 'suspend';

    const modal = document.querySelector('.modal-container');
    if (modal && getComputedStyle(modal).display !== 'none') return 'modal';

    if (typeof S !== 'undefined' && S.heroes?.length > 0 && S.enemies?.length > 0) {
      return S.pending ? 'targeting' : 'combat';
    }

    return 'menu';
  },

  // ===== BUTTON HANDLERS =====

  handleA() {
    if (!this.active) this.activate();
    this.playClick();

    const ctx = this.getContext();

    if (ctx === 'tutorial') {
      const btn = document.querySelector('.tutorial-modal button, .tutorial-modal .btn');
      if (btn) btn.click();
      return;
    }

    if (ctx === 'confirm') {
      const btn = document.querySelector('.confirm-btn-yes');
      if (btn) btn.click();
      return;
    }

    if (ctx === 'suspend') {
      if (typeof resumeGame === 'function') resumeGame();
      return;
    }

    // Try focused element first
    if (this.focusedElement && document.body.contains(this.focusedElement)) {
      if (this.focusedElement.hasAttribute('onclick')) {
        this.focusedElement.click();
        return;
      }
      const clickable = this.focusedElement.querySelector('[onclick], button, .btn');
      if (clickable) {
        clickable.click();
        return;
      }
      this.focusedElement.click();
      return;
    }

    // No focused element - find the most prominent clickable thing
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      const best = this.findBestDefaultFocus();
      if (best) {
        this.setFocus(best);
        best.click();
        return;
      }
    }

    // Last resort: find any visible button
    const anyBtn = document.querySelector('.btn:not([disabled]), button:not([disabled])');
    if (anyBtn) {
      anyBtn.click();
    }
  },

  handleB() {
    if (!this.active) this.activate();
    this.playClick();

    const ctx = this.getContext();

    if (ctx === 'confirm') {
      const btn = document.querySelector('.confirm-btn-no');
      if (btn) btn.click();
      return;
    }

    if (ctx === 'modal') {
      const backBtn = document.querySelector('.settings-back-btn, .modal-close, [onclick*="close"]');
      if (backBtn) {
        backBtn.click();
        return;
      }
      if (typeof closeSettingsMenu === 'function') {
        closeSettingsMenu();
        return;
      }
    }

    if (ctx === 'targeting' && typeof S !== 'undefined') {
      S.pending = null;
      S.targets = [];
      if (typeof render === 'function') render();
      return;
    }

    // In menus/combat: try to find a back/cancel button
    const backBtn = document.querySelector(
      '.back-btn, [onclick*="back"], [onclick*="Back"], ' +
      '[onclick*="close"], [onclick*="Close"], ' +
      '[onclick*="cancel"], [onclick*="Cancel"], ' +
      '.modal-close, .settings-back-btn'
    );
    if (backBtn) {
      backBtn.click();
      return;
    }

    // Try to close any overlay/modal
    const overlay = document.querySelector('.modal-overlay, .tutorial-modal-backdrop');
    if (overlay) {
      overlay.click();
    }
  },

  handleX() {
    if (!this.active) this.activate();
    this.playClick();

    const ctx = this.getContext();

    // In combat: use sigil and auto-target
    if (ctx === 'combat' || ctx === 'targeting') {
      if (this.focusedElement && document.body.contains(this.focusedElement)) {
        const sigil = this.focusedElement.classList?.contains('sigil')
          ? this.focusedElement
          : this.focusedElement.querySelector('.sigil.clickable');

        if (sigil && sigil.hasAttribute('onclick')) {
          sigil.click();
          setTimeout(() => this.autoTarget(), 50);
          return;
        }
      }
      this.autoTarget();
      return;
    }

    // Outside combat: X acts like A (secondary confirm)
    this.handleA();
  },

  handleY() {
    if (!this.active) this.activate();
    this.playClick();

    // Try to show sigil tooltip if one is focused
    if (this.focusedElement && document.body.contains(this.focusedElement)) {
      const sigil = this.focusedElement.classList?.contains('sigil')
        ? this.focusedElement
        : this.focusedElement.querySelector('.sigil');

      if (sigil && typeof showTooltip === 'function') {
        const name = sigil.dataset?.sigil || sigil.textContent?.trim();
        const level = parseInt(sigil.dataset?.level) || 0;
        showTooltip(name, sigil, level);
        return;
      }
    }

    // No sigil focused: show controls guide
    if (typeof showControlsGuide === 'function') {
      showControlsGuide();
    }
  },

  handleDirection(dir) {
    if (!this.active) {
      this.activate();
    }

    const ctx = this.getContext();

    if (ctx === 'tutorial' || ctx === 'suspend') return;

    if (ctx === 'confirm') {
      const yes = document.querySelector('.confirm-btn-yes');
      const no = document.querySelector('.confirm-btn-no');
      if (this.focusedElement === yes) {
        this.setFocus(no);
      } else {
        this.setFocus(yes);
      }
      this.playClick();
      return;
    }

    this.playClick();
    this.navigate(dir);
  },

  // ===== NAVIGATION =====

  navigate(dir) {
    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    if (!this.focusedElement || !document.body.contains(this.focusedElement)) {
      this.setFocus(this.focusableElements[0]);
      return;
    }

    const current = this.focusedElement.getBoundingClientRect();
    const cx = current.left + current.width / 2;
    const cy = current.top + current.height / 2;

    let best = null;
    let bestScore = Infinity;

    for (const el of this.focusableElements) {
      if (el === this.focusedElement) continue;

      const rect = el.getBoundingClientRect();
      const ex = rect.left + rect.width / 2;
      const ey = rect.top + rect.height / 2;

      const dx = ex - cx;
      const dy = ey - cy;

      let inDirection = false;
      switch (dir) {
        case 'up': inDirection = dy < -10; break;
        case 'down': inDirection = dy > 10; break;
        case 'left': inDirection = dx < -10; break;
        case 'right': inDirection = dx > 10; break;
      }

      if (!inDirection) continue;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const perpDist = (dir === 'up' || dir === 'down') ? Math.abs(dx) : Math.abs(dy);
      const score = dist + perpDist * 2;

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }

    if (best) {
      this.setFocus(best);
    }
  },

  // ===== FOCUS MANAGEMENT =====

  updateFocusableElements() {
    const selectors = [
      '.btn:not([disabled])',
      '.card.targetable',
      '.card.hero:not(.dead)',
      '.card.enemy:not(.dead)',
      '.sigil.clickable',
      'button:not([disabled])',
      '[onclick]',
      '.hero-select-card',
      '.encounter-choice',
      '.shop-item',
      '.upgrade-option'
    ];

    this.focusableElements = Array.from(
      document.querySelectorAll(selectors.join(','))
    ).filter(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      if (rect.bottom < 0 || rect.top > window.innerHeight + 100) return false;
      return true;
    });
  },

  setFocus(el) {
    if (!el) return;

    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
    }

    this.focusedElement = el;
    el.classList.add('controller-focus');

    if (el.id) {
      this.lastFocusedId = el.id;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  clearFocus() {
    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
      this.focusedElement = null;
    }
  },

  findBestDefaultFocus() {
    if (this.lastFocusedId) {
      const el = document.getElementById(this.lastFocusedId);
      if (el && this.focusableElements.includes(el)) {
        return el;
      }
    }

    const ctx = this.getContext();

    // Title screen: prioritize Play button
    const playBtn = document.querySelector('.title-play-btn');
    if (playBtn && this.focusableElements.includes(playBtn)) {
      return playBtn;
    }

    // Combat: prioritize active hero or targetable
    if (ctx === 'combat' || ctx === 'targeting') {
      const activeHero = document.querySelector('.card.hero.active');
      if (activeHero) return activeHero;

      const targetable = document.querySelector('.card.targetable');
      if (targetable) return targetable;
    }

    // Default: prioritize primary buttons over secondary
    const primaryBtn = document.querySelector('.btn-primary, .btn:not(.title-secondary-btn)');
    if (primaryBtn && this.focusableElements.includes(primaryBtn)) {
      return primaryBtn;
    }

    return this.focusableElements[0];
  },

  // ===== COMBAT HELPERS =====

  autoTarget() {
    const ctx = this.getContext();
    if (ctx !== 'targeting' || typeof S === 'undefined' || !S.pending) return;

    let targets;
    if (['Attack', 'Grapple', 'D20_TARGET'].includes(S.pending)) {
      targets = Array.from(document.querySelectorAll('.card.enemy:not(.dead)'));
    } else {
      targets = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
    }

    if (targets.length === 0) return;

    const target = targets[0];
    if (target.hasAttribute('onclick')) {
      target.click();
    }
  },

  scrollPage(dir) {
    const gameView = document.getElementById('gameView');
    if (gameView) {
      const amount = window.innerHeight * 0.5;
      gameView.scrollBy({ top: dir === 'up' ? -amount : amount, behavior: 'smooth' });
    }
  },

  // ===== UI =====

  playClick() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }
  },

  // ===== CLEANUP =====

  destroy() {
    this.deactivate();
  }
};

// Global helpers for settings
function toggleControllerSupport(enabled) {
  S.controllerDisabled = !enabled;
  if (enabled) {
    toast('🎮 Controller support enabled!', 2000);
    GamepadController.init();
  } else {
    toast('Controller support disabled.', 1200);
    GamepadController.destroy();
  }
  savePermanent();
}

function forceReinitController() {
  S.controllerDisabled = false;
  GamepadController.destroy();
  GamepadController.init();
  toast('🎮 Controller re-initialized!', 2500);
  savePermanent();
  closeSettingsMenu();
}

// showControlsGuide() is defined in settings.js with more detail

function showSteamDeckHelp() {
  const v = document.getElementById('gameView');
  const html = `
<div class="modal-container dark" style="max-width:400px">
  <h2 class="modal-title" style="margin-bottom:1rem">🎮 Steam Deck Setup</h2>
  <div style="text-align:left;font-size:0.85rem;line-height:1.5">
    <p style="margin-bottom:0.8rem">For best results, use Steam's <strong>Web Browser</strong> controller template.</p>
    <p style="margin-bottom:0.5rem"><strong>Controls:</strong></p>
    <ul style="margin-left:1.2rem;margin-bottom:1rem">
      <li><strong>D-pad</strong> - Navigate</li>
      <li><strong>A</strong> - Select/Confirm</li>
      <li><strong>B</strong> - Back/Cancel</li>
      <li><strong>Arrows</strong> - D-pad alternatives</li>
    </ul>
    <p style="font-size:0.8rem;opacity:0.8">If buttons don't work, check Steam → Controller Settings and try "Web Browser" or "Keyboard" template.</p>
  </div>
  <button class="btn" onclick="closeSteamDeckHelp()" style="margin-top:1rem">Got it</button>
</div>
<div class="modal-overlay steam-deck-help-overlay" onclick="closeSteamDeckHelp()"></div>`;
  v.insertAdjacentHTML('beforeend', html);
}

function closeSteamDeckHelp() {
  const overlay = document.querySelector('.steam-deck-help-overlay');
  if (overlay) {
    const modal = overlay.previousElementSibling;
    if (modal?.classList.contains('modal-container')) {
      modal.remove();
    }
    overlay.remove();
  }
}
