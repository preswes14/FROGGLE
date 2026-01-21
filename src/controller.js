// ===== FROGGLE CONTROLLER - Steam Input API =====
// Uses Steam Input for native controller support on Steam Deck
// Falls back to keyboard for browser/non-Steam environments

const GamepadController = {
  // State
  active: false,
  focusedElement: null,
  focusableElements: [],
  lastFocusedId: null,

  // Steam Input state
  steamInputAvailable: false,
  lastInputState: null,
  pollInterval: null,

  // Initialize controller system
  init() {
    debugLog('[CONTROLLER] Initializing...');

    // Check if disabled
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[CONTROLLER] Controller support disabled in settings');
      return;
    }

    // Always set up keyboard (works everywhere)
    this.initKeyboard();
    this.initTouchDetection();

    // Check for Steam Input (only in Electron with Steam)
    if (window.steamBridge && typeof window.steamBridge.inputAvailable === 'function') {
      // Give Steam a moment to initialize controllers
      setTimeout(() => this.initSteamInput(), 500);
    } else {
      debugLog('[CONTROLLER] Steam Input not available (browser mode)');
    }

    debugLog('[CONTROLLER] Initialization complete');
  },

  // Initialize Steam Input polling
  initSteamInput() {
    try {
      const available = window.steamBridge.inputAvailable();
      const controllerCount = window.steamBridge.inputControllerCount();

      debugLog(`[CONTROLLER] Steam Input check: available=${available}, controllers=${controllerCount}`);

      if (available && controllerCount > 0) {
        this.steamInputAvailable = true;
        this.activate();
        toast('🎮 Controller connected!', 2000);

        // Start polling Steam Input
        this.startPolling();

        // Log controller type
        const type = window.steamBridge.inputControllerType();
        debugLog('[CONTROLLER] Controller type:', type);
      } else {
        debugLog('[CONTROLLER] No Steam controllers detected, retrying...');
        // Retry a few times
        this.retrySteamInput(5);
      }
    } catch (e) {
      debugLog('[CONTROLLER] Steam Input init error:', e.message);
    }
  },

  // Retry Steam Input detection
  retrySteamInput(retriesLeft) {
    if (retriesLeft <= 0) {
      debugLog('[CONTROLLER] Steam Input not available after retries');
      return;
    }

    setTimeout(() => {
      try {
        const available = window.steamBridge.inputAvailable();
        if (available) {
          this.steamInputAvailable = true;
          this.activate();
          toast('🎮 Controller connected!', 2000);
          this.startPolling();
        } else {
          this.retrySteamInput(retriesLeft - 1);
        }
      } catch (e) {
        debugLog('[CONTROLLER] Retry error:', e.message);
      }
    }, 500);
  },

  // Start polling Steam Input
  startPolling() {
    if (this.pollInterval) return;

    debugLog('[CONTROLLER] Starting Steam Input polling');

    this.pollInterval = setInterval(() => {
      this.pollSteamInput();
    }, 16); // ~60fps polling
  },

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  // Poll Steam Input and handle button presses
  pollSteamInput() {
    if (!this.steamInputAvailable || !window.steamBridge) return;

    try {
      const state = window.steamBridge.inputGetState();
      if (!state || !state.connected) {
        // Controller disconnected
        if (this.lastInputState?.connected) {
          debugLog('[CONTROLLER] Controller disconnected');
          this.steamInputAvailable = false;
          this.stopPolling();
        }
        this.lastInputState = state;
        return;
      }

      const prev = this.lastInputState || {};

      // Check for button presses (transition from not pressed to pressed)
      if (state.confirm && !prev.confirm) this.handleA();
      if (state.cancel && !prev.cancel) this.handleB();
      if (state.auto_target && !prev.auto_target) this.handleX();
      if (state.tooltip && !prev.tooltip) this.handleY();
      if (state.prev_unit && !prev.prev_unit) this.handleLB();
      if (state.next_unit && !prev.next_unit) this.handleRB();
      if (state.prev_sigil && !prev.prev_sigil) this.handleLT();
      if (state.next_sigil && !prev.next_sigil) this.handleRT();
      if (state.switch_sides && !prev.switch_sides) this.handleSelect();
      if (state.menu && !prev.menu) this.handleStart();

      // D-pad
      if (state.dpad_up && !prev.dpad_up) this.handleDirection('up');
      if (state.dpad_down && !prev.dpad_down) this.handleDirection('down');
      if (state.dpad_left && !prev.dpad_left) this.handleDirection('left');
      if (state.dpad_right && !prev.dpad_right) this.handleDirection('right');

      // Analog stick (with deadzone)
      if (state.move) {
        const threshold = 0.5;
        const prevMove = prev.move || { x: 0, y: 0 };

        // Left
        if (state.move.x < -threshold && prevMove.x >= -threshold) {
          this.handleDirection('left');
        }
        // Right
        if (state.move.x > threshold && prevMove.x <= threshold) {
          this.handleDirection('right');
        }
        // Up (note: y axis may be inverted)
        if (state.move.y < -threshold && prevMove.y >= -threshold) {
          this.handleDirection('up');
        }
        // Down
        if (state.move.y > threshold && prevMove.y <= threshold) {
          this.handleDirection('down');
        }
      }

      this.lastInputState = state;
    } catch (e) {
      // Silently ignore polling errors
    }
  },

  // Touch listener - deactivate controller mode when user touches screen
  initTouchDetection() {
    document.addEventListener('touchstart', () => {
      if (this.active) {
        debugLog('[CONTROLLER] Touch detected, deactivating controller mode');
        this.deactivate();
      }
    }, { passive: true });
  },

  // Keyboard fallback (for browser/desktop)
  initKeyboard() {
    document.addEventListener('keydown', e => {
      if (typeof S !== 'undefined' && S.controllerDisabled) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // In browser mode (no Steam Input), keyboard always works
      // In Steam mode, keyboard is backup
      const allowKeyboard = !this.steamInputAvailable || this.active;
      if (!allowKeyboard) return;

      let handled = false;

      switch (e.key) {
        case 'ArrowUp':
          this.handleDirection('up');
          handled = true;
          break;
        case 'ArrowDown':
          this.handleDirection('down');
          handled = true;
          break;
        case 'ArrowLeft':
          this.handleDirection('left');
          handled = true;
          break;
        case 'ArrowRight':
          this.handleDirection('right');
          handled = true;
          break;
        case 'Enter':
        case ' ':
          this.handleA();
          handled = true;
          break;
        case 'Escape':
          this.handleB();
          handled = true;
          break;
        case 'Tab':
          this.handleDirection(e.shiftKey ? 'left' : 'right');
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        if (!this.active) this.activate();
      }
    });
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
    this.updatePrompts();
    debugLog('[CONTROLLER] Activated');
  },

  // Deactivate controller mode
  deactivate() {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('controller-active');
    this.clearFocus();
    this.updatePrompts();
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

    if (this.focusedElement) {
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
    }
  },

  handleB() {
    if (!this.active) return;
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
  },

  handleX() {
    if (!this.active) this.activate();
    this.playClick();

    const ctx = this.getContext();
    if (ctx !== 'combat' && ctx !== 'targeting') return;

    if (this.focusedElement) {
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
  },

  handleY() {
    if (!this.active) this.activate();

    if (this.focusedElement) {
      const sigil = this.focusedElement.classList?.contains('sigil')
        ? this.focusedElement
        : this.focusedElement.querySelector('.sigil');

      if (sigil && typeof showTooltip === 'function') {
        const name = sigil.dataset?.sigil || sigil.textContent?.trim();
        const level = parseInt(sigil.dataset?.level) || 0;
        showTooltip(name, sigil, level);
      }
    }
  },

  handleLB() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleUnit('prev');
    } else {
      this.scrollPage('up');
    }
  },

  handleRB() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleUnit('next');
    } else {
      this.scrollPage('down');
    }
  },

  handleLT() {
    if (!this.active) this.activate();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.playClick();
      this.cycleSigil('prev');
    }
  },

  handleRT() {
    if (!this.active) this.activate();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.playClick();
      this.cycleSigil('next');
    }
  },

  handleSelect() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'targeting') {
      const enemies = document.querySelectorAll('.card.enemy:not(.dead)');
      const heroes = document.querySelectorAll('.card.hero:not(.dead)');

      if (this.focusedElement?.classList.contains('enemy') && heroes.length) {
        this.setFocus(heroes[0]);
      } else if (enemies.length) {
        this.setFocus(enemies[0]);
      }
    }
  },

  handleStart() {
    if (!this.active) this.activate();
    this.playClick();
    if (typeof showSettingsMenu === 'function') {
      showSettingsMenu();
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
    if (ctx === 'combat' || ctx === 'targeting') {
      const activeHero = document.querySelector('.card.hero.active');
      if (activeHero) return activeHero;

      const targetable = document.querySelector('.card.targetable');
      if (targetable) return targetable;
    }

    return this.focusableElements[0];
  },

  saveFocusState() {
    if (this.focusedElement?.id) {
      this.lastFocusedId = this.focusedElement.id;
    }
  },

  restoreFocusState() {
    this.updateFocusableElements();
    const best = this.findBestDefaultFocus();
    if (best) this.setFocus(best);
  },

  // ===== COMBAT HELPERS =====

  cycleUnit(dir) {
    const ctx = this.getContext();
    let cards;

    if (ctx === 'targeting') {
      if (typeof S !== 'undefined') {
        if (['Attack', 'Grapple', 'D20_TARGET'].includes(S.pending)) {
          cards = Array.from(document.querySelectorAll('.card.enemy:not(.dead)'));
        } else {
          cards = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
        }
      }
    } else {
      cards = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
    }

    if (!cards || cards.length === 0) return;

    let idx = cards.findIndex(c => c === this.focusedElement || c.contains(this.focusedElement));
    if (idx === -1) idx = 0;
    else idx = dir === 'next' ? (idx + 1) % cards.length : (idx - 1 + cards.length) % cards.length;

    this.setFocus(cards[idx]);
  },

  cycleSigil(dir) {
    let hero = this.focusedElement?.closest('.card.hero');
    if (!hero) {
      hero = document.querySelector('.card.hero.active');
    }
    if (!hero) return;

    const sigils = Array.from(hero.querySelectorAll('.sigil.clickable'));
    if (sigils.length === 0) return;

    let idx = sigils.findIndex(s => s === this.focusedElement);
    if (idx === -1) idx = 0;
    else idx = dir === 'next' ? (idx + 1) % sigils.length : (idx - 1 + sigils.length) % sigils.length;

    this.setFocus(sigils[idx]);
  },

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

  updatePrompts() {
    const prompts = document.getElementById('controllerPrompts');
    if (prompts) {
      prompts.style.display = this.active ? 'flex' : 'none';
    }
  },

  playClick() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }
  },

  // ===== CLEANUP =====

  destroy() {
    this.stopPolling();
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

function showControlsGuide() {
  const v = document.getElementById('gameView');
  const html = `
<div class="modal-container dark">
  <h2 class="modal-title blue" style="margin-bottom:1rem">🎮 CONTROLS</h2>
  <div style="text-align:left;font-size:0.9rem;line-height:1.6">
    <p><strong>A</strong> - Select / Confirm</p>
    <p><strong>B</strong> - Back / Cancel</p>
    <p><strong>X</strong> - Auto-target (combat)</p>
    <p><strong>Y</strong> - Show tooltip</p>
    <p><strong>D-Pad / Left Stick</strong> - Navigate</p>
    <p><strong>LB/RB</strong> - Cycle heroes/targets</p>
    <p><strong>LT/RT</strong> - Cycle sigils</p>
    <p><strong>Start</strong> - Menu</p>
  </div>
  <button class="btn" onclick="closeSettingsMenu()" style="margin-top:1rem">Close</button>
</div>
<div class="modal-overlay" onclick="closeSettingsMenu()"></div>`;
  v.insertAdjacentHTML('beforeend', html);
}
