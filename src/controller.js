// ===== FROGGLE CONTROLLER - Standard Gamepad API =====
// Uses the Web Gamepad API - works in browsers, Electron, and Steam Deck
// No native dependencies, no Steam Input complexity

const GamepadController = {
  // State
  active: false,
  focusedElement: null,
  focusableElements: [],
  lastFocusedId: null,

  // Gamepad state
  pollInterval: null,
  lastButtons: {},
  lastAxes: { x: 0, y: 0 },
  connected: false,

  // Initialize controller system
  init() {
    debugLog('[CONTROLLER] Initializing...');

    // Check if disabled in settings
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[CONTROLLER] Controller support disabled in settings');
      return;
    }

    // Set up keyboard (always works as fallback)
    this.initKeyboard();
    this.initTouchDetection();

    // Set up gamepad
    this.initGamepad();

    debugLog('[CONTROLLER] Initialization complete');
  },

  // Initialize Web Gamepad API
  initGamepad() {
    // Listen for gamepad connect/disconnect
    window.addEventListener('gamepadconnected', (e) => {
      debugLog('[CONTROLLER] Gamepad connected:', e.gamepad.id);
      this.connected = true;
      this.activate();
      toast('🎮 Controller connected!', 2000);
      this.startPolling();
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      debugLog('[CONTROLLER] Gamepad disconnected:', e.gamepad.id);
      this.connected = false;
      // Check if any gamepads still connected
      const gamepads = navigator.getGamepads();
      const anyConnected = Array.from(gamepads).some(gp => gp !== null);
      if (!anyConnected) {
        this.stopPolling();
      }
    });

    // Check if gamepad already connected (page refresh with controller plugged in)
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp) {
        debugLog('[CONTROLLER] Gamepad already connected:', gp.id);
        this.connected = true;
        this.startPolling();
        break;
      }
    }
  },

  // Start polling gamepad state
  startPolling() {
    if (this.pollInterval) return;
    debugLog('[CONTROLLER] Starting gamepad polling');
    this.pollInterval = setInterval(() => this.poll(), 16); // ~60fps
  },

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      debugLog('[CONTROLLER] Stopped gamepad polling');
    }
  },

  // Poll gamepad state
  poll() {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (!gp) return;

    // Standard gamepad mapping (works for Xbox, PlayStation, Switch Pro, Steam Deck):
    // buttons[0] = A/Cross/B(Nintendo)
    // buttons[1] = B/Circle/A(Nintendo)
    // buttons[2] = X/Square/Y(Nintendo)
    // buttons[3] = Y/Triangle/X(Nintendo)
    // buttons[4] = LB/L1
    // buttons[5] = RB/R1
    // buttons[6] = LT/L2
    // buttons[7] = RT/R2
    // buttons[8] = Select/Share/Minus
    // buttons[9] = Start/Options/Plus
    // buttons[10] = L3 (left stick click)
    // buttons[11] = R3 (right stick click)
    // buttons[12] = D-pad Up
    // buttons[13] = D-pad Down
    // buttons[14] = D-pad Left
    // buttons[15] = D-pad Right
    // axes[0] = Left stick X (-1 to 1)
    // axes[1] = Left stick Y (-1 to 1)

    const prev = this.lastButtons;

    // Face buttons
    if (this.pressed(gp, 0) && !prev[0]) this.handleA();
    if (this.pressed(gp, 1) && !prev[1]) this.handleB();
    if (this.pressed(gp, 2) && !prev[2]) this.handleX();
    if (this.pressed(gp, 3) && !prev[3]) this.handleY();

    // Shoulders
    if (this.pressed(gp, 4) && !prev[4]) this.handleLB();
    if (this.pressed(gp, 5) && !prev[5]) this.handleRB();

    // Triggers (as buttons)
    if (this.pressed(gp, 6) && !prev[6]) this.handleLT();
    if (this.pressed(gp, 7) && !prev[7]) this.handleRT();

    // Select/Start
    if (this.pressed(gp, 8) && !prev[8]) this.handleSelect();
    if (this.pressed(gp, 9) && !prev[9]) this.handleStart();

    // D-pad
    if (this.pressed(gp, 12) && !prev[12]) this.handleDirection('up');
    if (this.pressed(gp, 13) && !prev[13]) this.handleDirection('down');
    if (this.pressed(gp, 14) && !prev[14]) this.handleDirection('left');
    if (this.pressed(gp, 15) && !prev[15]) this.handleDirection('right');

    // Left stick (with deadzone)
    const deadzone = 0.5;
    const ax = gp.axes[0] || 0;
    const ay = gp.axes[1] || 0;
    const prevAx = this.lastAxes.x;
    const prevAy = this.lastAxes.y;

    if (ax < -deadzone && prevAx >= -deadzone) this.handleDirection('left');
    if (ax > deadzone && prevAx <= deadzone) this.handleDirection('right');
    if (ay < -deadzone && prevAy >= -deadzone) this.handleDirection('up');
    if (ay > deadzone && prevAy <= deadzone) this.handleDirection('down');

    // Save state for next frame
    this.lastButtons = {};
    for (let i = 0; i < gp.buttons.length; i++) {
      this.lastButtons[i] = this.pressed(gp, i);
    }
    this.lastAxes = { x: ax, y: ay };
  },

  // Helper to check if button is pressed
  pressed(gp, index) {
    const btn = gp.buttons[index];
    if (!btn) return false;
    return typeof btn === 'object' ? btn.pressed : btn > 0.5;
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

  // Keyboard fallback
  initKeyboard() {
    document.addEventListener('keydown', e => {
      if (typeof S !== 'undefined' && S.controllerDisabled) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
