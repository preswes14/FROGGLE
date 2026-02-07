// ===== FROGGLE CONTROLLER =====
// Supports both Gamepad API (desktop/native) and keyboard events (Steam Deck browser)
// Steam Deck in browser mode converts controller to keyboard - we handle both

const GamepadController = {
  // State
  active: false,
  focusedElement: null,
  focusableElements: [],
  lastFocusedId: null,

  // Gamepad state
  pollInterval: null,
  lastButtons: {},
  lastAxes: { lx: 0, ly: 0 },
  connected: false,

  // Steam Deck input interception detection
  connectTime: 0,
  firstInputTime: 0,
  inputDetectionShown: false,

  // Debounce tracking - prevents double-fire from keyboard events
  lastActionTime: {},
  DEBOUNCE_MS: 150,

  // Initialize controller system
  init() {
    debugLog('[CONTROLLER] Initializing...');

    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[CONTROLLER] Controller support disabled in settings');
      return;
    }

    // Keyboard always works (primary for Steam Deck browser mode)
    this.initKeyboard();
    this.initTouchDetection();

    // Gamepad API (works on desktop, native apps, some Steam configs)
    this.initGamepad();

    debugLog('[CONTROLLER] Initialization complete');
  },

  // Check debounce - returns true if action should be allowed
  shouldAllowAction(action) {
    const now = Date.now();
    const lastTime = this.lastActionTime[action] || 0;
    if (now - lastTime < this.DEBOUNCE_MS) {
      return false;
    }
    this.lastActionTime[action] = now;
    return true;
  },

  // Initialize Web Gamepad API
  initGamepad() {
    // Guard: Gamepad API may not be available in all Electron/browser configs
    if (!navigator.getGamepads) {
      debugLog('[CONTROLLER] Gamepad API not available');
      return;
    }

    // Store bound handlers for cleanup in destroy()
    this._onGamepadConnected = (e) => {
      try {
        debugLog('[CONTROLLER] Gamepad connected:', e.gamepad.id);
        this.connected = true;
        this.connectTime = Date.now();
        this.firstInputTime = 0;
        this.inputDetectionShown = false;
        this.activate();
        toast('🎮 Controller connected!', 2000);
        this.startPolling();
        this.startInputDetection();
      } catch(err) {
        console.warn('[CONTROLLER] Error in gamepad connect handler:', err);
      }
    };

    this._onGamepadDisconnected = (e) => {
      try {
        debugLog('[CONTROLLER] Gamepad disconnected:', e.gamepad.id);
        this.connected = false;
        var gamepads = navigator.getGamepads();
        var anyConnected = gamepads && Array.from(gamepads).some(function(gp) { return gp !== null; });
        if (!anyConnected) {
          this.stopPolling();
        }
      } catch(err) {
        console.warn('[CONTROLLER] Error in gamepad disconnect handler:', err);
      }
    };

    window.addEventListener('gamepadconnected', this._onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected);

    // Check if gamepad already connected
    try {
      var gamepads = navigator.getGamepads();
      if (gamepads) {
        for (var i = 0; i < gamepads.length; i++) {
          if (gamepads[i]) {
            debugLog('[CONTROLLER] Gamepad already connected:', gamepads[i].id);
            this.connected = true;
            this.startPolling();
            break;
          }
        }
      }
    } catch(err) {
      console.warn('[CONTROLLER] Error checking existing gamepads:', err);
    }
  },

  startPolling() {
    if (this.pollInterval) return;
    debugLog('[CONTROLLER] Starting gamepad polling');
    this.pollInterval = setInterval(() => this.poll(), 16);
  },

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      debugLog('[CONTROLLER] Stopped gamepad polling');
    }
  },

  poll() {
    try {
    var gamepads = navigator.getGamepads();
    if (!gamepads) return;
    var gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (!gp) return;

    const prev = this.lastButtons;

    // Face buttons (debounced to match keyboard behavior)
    if (this.pressed(gp, 0) && !prev[0]) { this.markInputReceived(); if (this.shouldAllowAction('A')) this.handleA(); }
    if (this.pressed(gp, 1) && !prev[1]) { this.markInputReceived(); if (this.shouldAllowAction('B')) this.handleB(); }
    if (this.pressed(gp, 2) && !prev[2]) { this.markInputReceived(); if (this.shouldAllowAction('X')) this.handleX(); }
    if (this.pressed(gp, 3) && !prev[3]) { this.markInputReceived(); if (this.shouldAllowAction('Y')) this.handleY(); }

    // Shoulders
    if (this.pressed(gp, 4) && !prev[4]) { this.markInputReceived(); this.handleLB(); }
    if (this.pressed(gp, 5) && !prev[5]) { this.markInputReceived(); this.handleRB(); }

    // Triggers
    if (this.pressed(gp, 6) && !prev[6]) { this.markInputReceived(); this.handleLT(); }
    if (this.pressed(gp, 7) && !prev[7]) { this.markInputReceived(); this.handleRT(); }

    // Select/Start (debounced - these open menus)
    if (this.pressed(gp, 8) && !prev[8]) { this.markInputReceived(); if (this.shouldAllowAction('Select')) this.handleSelect(); }
    if (this.pressed(gp, 9) && !prev[9]) { this.markInputReceived(); if (this.shouldAllowAction('Start')) this.handleStart(); }

    // Stick clicks
    if (this.pressed(gp, 10) && !prev[10]) { this.markInputReceived(); this.handleL3(); }
    if (this.pressed(gp, 11) && !prev[11]) { this.markInputReceived(); this.handleR3(); }

    // D-pad
    if (this.pressed(gp, 12) && !prev[12]) { this.markInputReceived(); this.handleDirection('up'); }
    if (this.pressed(gp, 13) && !prev[13]) { this.markInputReceived(); this.handleDirection('down'); }
    if (this.pressed(gp, 14) && !prev[14]) { this.markInputReceived(); this.handleDirection('left'); }
    if (this.pressed(gp, 15) && !prev[15]) { this.markInputReceived(); this.handleDirection('right'); }

    // Analog sticks
    const deadzone = 0.3;
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const prevLx = this.lastAxes.lx;
    const prevLy = this.lastAxes.ly;

    if (lx < -deadzone && prevLx >= -deadzone) { this.markInputReceived(); this.handleDirection('left'); }
    if (lx > deadzone && prevLx <= deadzone) { this.markInputReceived(); this.handleDirection('right'); }
    if (ly < -deadzone && prevLy >= -deadzone) { this.markInputReceived(); this.handleDirection('up'); }
    if (ly > deadzone && prevLy <= deadzone) { this.markInputReceived(); this.handleDirection('down'); }

    // Right stick: smooth scrolling (more useful than duplicating left stick nav)
    const rx = gp.axes[2] || 0;
    const ry = gp.axes[3] || 0;

    if (Math.abs(ry) > deadzone) {
      this.markInputReceived();
      this.scrollSmooth(ry);
    }

    // Save state
    this.lastButtons = {};
    for (var i = 0; i < gp.buttons.length; i++) {
      this.lastButtons[i] = this.pressed(gp, i);
    }
    this.lastAxes = { lx: lx, ly: ly };
    } catch(err) {
      // Silently handle poll errors to prevent error spam at 60fps
      if (!this._pollErrorLogged) {
        console.warn('[CONTROLLER] Poll error:', err);
        this._pollErrorLogged = true;
      }
    }
  },

  pressed(gp, index) {
    const btn = gp.buttons[index];
    if (!btn) return false;
    return typeof btn === 'object' ? btn.pressed : btn > 0.5;
  },

  markInputReceived() {
    if (!this.firstInputTime && this.connectTime) {
      this.firstInputTime = Date.now();
      debugLog('[CONTROLLER] First input received after', this.firstInputTime - this.connectTime, 'ms');
    }
  },

  startInputDetection() {
    setTimeout(() => {
      if (this.connected && !this.firstInputTime && !this.inputDetectionShown) {
        this.inputDetectionShown = true;
        this.showSteamDeckWarning();
      }
    }, 5000);
  },

  showSteamDeckWarning() {
    debugLog('[CONTROLLER] No input detected - possible Steam interception');
    const isSteamDeck = navigator.userAgent.includes('Linux') ||
                        (typeof window.electronInfo !== 'undefined');

    if (isSteamDeck) {
      toast('⚠️ Controller not responding? Try keyboard mode or check Steam settings', 4000);
      setTimeout(() => {
        if (!this.firstInputTime && typeof showSteamDeckHelp === 'function') {
          showSteamDeckHelp();
        }
      }, 2000);
    }
  },

  initTouchDetection() {
    this._onTouchStart = () => {
      if (this.active) {
        debugLog('[CONTROLLER] Touch detected, deactivating controller mode');
        this.deactivate();
      }
    };
    document.addEventListener('touchstart', this._onTouchStart, { passive: true });
  },

  // Keyboard handler - primary input for Steam Deck browser mode
  initKeyboard() {
    this._onKeyDown = e => {
      if (typeof S !== 'undefined' && S.controllerDisabled) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ignore key repeat (holding button down causes spam)
      if (e.repeat) return;

      let handled = false;

      switch (e.key) {
        // D-pad / Arrow keys
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

        // A button - Enter (with debounce to prevent double-fire)
        case 'Enter':
          if (this.shouldAllowAction('A')) {
            this.handleA();
          }
          handled = true;
          break;

        // Space also triggers A (debounced together with Enter)
        case ' ':
          if (this.shouldAllowAction('A')) {
            this.handleA();
          }
          handled = true;
          break;

        // B button - Escape OR Backspace (Steam browser template uses Backspace)
        case 'Escape':
        case 'Backspace':
          if (this.shouldAllowAction('B')) {
            this.handleB();
          }
          handled = true;
          break;

        // Tab for navigation
        case 'Tab':
          this.handleDirection(e.shiftKey ? 'left' : 'right');
          handled = true;
          break;

        // Bumpers often map to PageUp/PageDown in browser templates
        case 'PageUp':
          this.handleLB();
          handled = true;
          break;
        case 'PageDown':
          this.handleRB();
          handled = true;
          break;

        // Some Steam configs send letter keys for face buttons
        case 'x':
        case 'X':
          if (this.shouldAllowAction('X')) {
            this.handleX();
          }
          handled = true;
          break;
        case 'y':
        case 'Y':
          if (this.shouldAllowAction('Y')) {
            this.handleY();
          }
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        if (!this.active) this.activate();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
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
    if (tutorialModal && getComputedStyle(tutorialModal).display !== 'none') return 'tutorial';

    const confirmModal = document.querySelector('.confirm-modal');
    if (confirmModal && getComputedStyle(confirmModal).display !== 'none') return 'confirm';

    if (typeof S !== 'undefined' && S.suspended) return 'suspend';

    const modal = document.querySelector('.modal-container');
    if (modal && getComputedStyle(modal).display !== 'none') return 'modal';

    if (typeof S !== 'undefined' && S.heroes?.length > 0 && S.enemies?.length > 0 && S.turn === 'player') {
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

    // Cooldown after tutorial dismiss to prevent click-through
    if (window.tutorialDismissTime && Date.now() - window.tutorialDismissTime < 300) return;

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

    // Last resort
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
      S.currentInstanceTargets = [];
      S.instancesRemaining = 0;
      if (typeof render === 'function') render();
      return;
    }

    // Try to find a back/cancel button
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

    // Close any overlay
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

    // Outside combat: X acts like A
    this.handleA();
  },

  handleY() {
    if (!this.active) this.activate();
    this.playClick();

    // Show sigil tooltip if focused
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

    // No sigil: show controls guide
    if (typeof showControlsGuide === 'function') {
      showControlsGuide();
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
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleSigil('prev');
    } else {
      this.handleDirection('left');
    }
  },

  handleRT() {
    if (!this.active) this.activate();
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleSigil('next');
    } else {
      this.handleDirection('right');
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
    } else if (ctx === 'combat') {
      const activeHero = document.querySelector('.card.hero.active');
      if (activeHero) {
        const sigil = activeHero.querySelector('.sigil.clickable');
        if (sigil) {
          this.setFocus(sigil);
        }
      }
    } else {
      const primary = document.querySelector('.title-play-btn, .btn-primary, .btn:first-of-type');
      if (primary) {
        this.setFocus(primary);
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

  handleL3() {
    if (!this.active) this.activate();
    this.playClick();
    if (typeof showControlsGuide === 'function') {
      showControlsGuide();
    }
  },

  handleR3() {
    if (!this.active) this.activate();
    this.playClick();
    if (typeof showControllerDebug === 'function') {
      const existing = document.getElementById('controller-debug-overlay');
      if (existing) {
        existing.remove();
      } else {
        showControllerDebug();
      }
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
    } else {
      // Wrap around: if no element found in direction, pick the furthest element
      // in the opposite direction (wraps focus to the other side of the screen)
      let wrapBest = null;
      let wrapScore = -Infinity;
      for (const el of this.focusableElements) {
        if (el === this.focusedElement) continue;
        const rect = el.getBoundingClientRect();
        const ex = rect.left + rect.width / 2;
        const ey = rect.top + rect.height / 2;
        let score;
        switch (dir) {
          case 'up': score = ey; break;     // Furthest down
          case 'down': score = -ey; break;  // Furthest up
          case 'left': score = ex; break;   // Furthest right
          case 'right': score = -ex; break; // Furthest left
        }
        if (score > wrapScore) {
          wrapScore = score;
          wrapBest = el;
        }
      }
      if (wrapBest) this.setFocus(wrapBest);
    }
  },

  // ===== FOCUS MANAGEMENT =====

  // Save focus state before DOM updates (called from render())
  saveFocusState() {
    this._savedFocusId = this.focusedElement?.id || null;
    this._savedFocusClasses = this.focusedElement ?
      Array.from(this.focusedElement.classList).filter(c => c !== 'controller-focus').join('.') : null;
    this._savedFocusTag = this.focusedElement?.tagName || null;
    this._savedFocusText = this.focusedElement?.textContent?.trim()?.substring(0, 30) || null;
  },

  // Restore focus state after DOM updates (called from render())
  restoreFocusState() {
    if (!this.active) return;

    // Try to find element by ID first (most reliable)
    if (this._savedFocusId) {
      const el = document.getElementById(this._savedFocusId);
      if (el) {
        this.updateFocusableElements();
        this.setFocus(el);
        return;
      }
    }

    // Try to find by class combination (for cards, sigils, etc.)
    if (this._savedFocusClasses && this._savedFocusTag) {
      const selector = this._savedFocusTag.toLowerCase() + '.' + this._savedFocusClasses.split('.').join('.');
      try {
        const candidates = document.querySelectorAll(selector);
        if (candidates.length === 1) {
          this.updateFocusableElements();
          this.setFocus(candidates[0]);
          return;
        }
        // Multiple matches - try to match by text content
        if (candidates.length > 1 && this._savedFocusText) {
          for (const c of candidates) {
            if (c.textContent?.trim()?.substring(0, 30) === this._savedFocusText) {
              this.updateFocusableElements();
              this.setFocus(c);
              return;
            }
          }
        }
      } catch(e) { /* invalid selector, fall through */ }
    }

    // Fallback: focus best default element
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      const best = this.findBestDefaultFocus();
      this.setFocus(best || this.focusableElements[0]);
    }
  },

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

    // Scope to active modal if one exists, preventing focus from jumping behind it
    let root = document;
    const ctx = this.getContext();
    if (ctx === 'tutorial') {
      root = document.querySelector('.tutorial-modal-backdrop') || document;
    } else if (ctx === 'confirm') {
      root = document.querySelector('.confirm-modal') || document;
    } else if (ctx === 'modal') {
      root = document.querySelector('.modal-container') || document;
    }

    this.focusableElements = Array.from(
      root.querySelectorAll(selectors.join(','))
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

    // Default: prioritize primary buttons
    const primaryBtn = document.querySelector('.btn-primary, .btn:not(.title-secondary-btn)');
    if (primaryBtn && this.focusableElements.includes(primaryBtn)) {
      return primaryBtn;
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

  // Smooth per-frame scrolling for right stick (called each poll at 60fps)
  scrollSmooth(axisValue) {
    var gameView = document.getElementById('gameView');
    if (gameView) {
      // Scale by axis deflection for proportional speed
      var amount = axisValue * 12;
      gameView.scrollBy({ top: amount, behavior: 'auto' });
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
    // Remove event listeners to prevent accumulation on reinit
    if (this._onGamepadConnected) {
      window.removeEventListener('gamepadconnected', this._onGamepadConnected);
    }
    if (this._onGamepadDisconnected) {
      window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected);
    }
    if (this._onTouchStart) {
      document.removeEventListener('touchstart', this._onTouchStart);
    }
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
    }
  }
};

// Global helpers
function toggleControllerSupport(enabled) {
  if (typeof S === 'undefined') return;
  S.controllerDisabled = !enabled;
  if (enabled) {
    toast('🎮 Controller support enabled!', 2000);
    GamepadController.init();
  } else {
    toast('Controller support disabled.', 1200);
    GamepadController.destroy();
  }
  if (typeof savePermanent === 'function') savePermanent();
}

function forceReinitController() {
  if (typeof S !== 'undefined') S.controllerDisabled = false;
  GamepadController.destroy();
  GamepadController.init();
  toast('🎮 Controller re-initialized!', 2500);
  if (typeof savePermanent === 'function') savePermanent();
  if (typeof closeSettingsMenu === 'function') closeSettingsMenu();
}

function showSteamDeckHelp() {
  // Remove existing if already open
  closeSteamDeckHelp();
  // Append to body (not gameView) so it survives screen transitions
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay steam-deck-help-overlay';
  overlay.onclick = closeSteamDeckHelp;
  const modal = document.createElement('div');
  modal.className = 'modal-container dark steam-deck-help-modal';
  modal.style.maxWidth = '400px';
  modal.innerHTML = `
  <h2 class="modal-title" style="margin-bottom:1rem">🎮 Steam Deck Controls</h2>
  <div style="text-align:left;font-size:0.85rem;line-height:1.5">
    <p style="margin-bottom:0.8rem">In browser mode, Steam converts controller to keyboard. The game handles both.</p>
    <p style="margin-bottom:0.5rem"><strong>Working controls:</strong></p>
    <ul style="margin-left:1.2rem;margin-bottom:1rem">
      <li><strong>D-pad</strong> - Navigate (arrow keys)</li>
      <li><strong>A</strong> - Select (Enter)</li>
      <li><strong>B</strong> - Back (Backspace)</li>
      <li><strong>Bumpers</strong> - Scroll (PageUp/Down)</li>
    </ul>
    <p style="font-size:0.8rem;opacity:0.8">If Gamepad mode works better for you, try Steam → Controller Settings → "Gamepad" template.</p>
  </div>
  <button class="btn" onclick="closeSteamDeckHelp()" style="margin-top:1rem">Got it</button>`;
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
}

function closeSteamDeckHelp() {
  const overlay = document.querySelector('.steam-deck-help-overlay');
  if (overlay) overlay.remove();
  const modal = document.querySelector('.steam-deck-help-modal');
  if (modal) modal.remove();
}
