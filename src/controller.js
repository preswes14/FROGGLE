// ===== STEAM DECK / CONTROLLER SUPPORT SYSTEM =====
const GamepadController = {
  // State
  active: false,
  gamepadIndex: null,
  focusedElement: null,
  focusableElements: [],
  lastInputTime: 0,
  inputCooldown: 80, // ms between inputs - lower = more responsive
  axisDeadzone: 0.5,
  pollInterval: null,
  buttonStates: {},
  contextStack: [], // Stack for nested menus/modals
  tooltipVisible: false, // Track if tooltip is showing via controller
  tooltipElement: null, // Element with active tooltip
  currentUnitIndex: 0, // Current unit (hero/enemy) index for LB/RB cycling
  currentSigilIndex: 0, // Current sigil index for LT/RT cycling
  lastFocusedId: null, // For focus restoration after render
  lastMouseX: null, // For tracking mouse movement delta
  lastMouseY: null, // For tracking mouse movement delta
  pollCount: 0, // Debug: count poll cycles
  lastPollLog: 0, // Debug: timestamp of last poll log
  mouseMovementThreshold: 150, // Minimum pixels to move before switching to mouse mode (high to prevent Steam Deck touchpad issues)

  // Button indices (standard gamepad mapping)
  BUTTONS: {
    A: 0,        // Bottom button (confirm/select)
    B: 1,        // Right button (back/cancel)
    X: 2,        // Left button
    Y: 3,        // Top button (tooltip toggle)
    LB: 4,       // Left bumper (prev unit)
    RB: 5,       // Right bumper (next unit)
    LT: 6,       // Left trigger (prev sigil)
    RT: 7,       // Right trigger (next sigil)
    SELECT: 8,   // Back/Select
    START: 9,    // Start/Menu
    L3: 10,      // Left stick click
    R3: 11,      // Right stick click
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15
  },

  // Initialize controller system
  init() {
    console.log('[GAMEPAD] ========================================');
    console.log('[GAMEPAD] Initializing controller support...');
    console.log('[GAMEPAD] S defined:', typeof S !== 'undefined');
    console.log('[GAMEPAD] S.controllerDisabled:', typeof S !== 'undefined' ? S.controllerDisabled : 'N/A');

    // Check if controller support is disabled
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      console.log('[GAMEPAD] Controller support disabled by user setting');
      return;
    }

    // ALWAYS set up keyboard fallback (works even if gamepad API unavailable)
    this.initKeyboardFallback();
    console.log('[GAMEPAD] Keyboard fallback initialized');

    // Check if gamepad API is available
    if (!navigator.getGamepads) {
      console.log('[GAMEPAD] Gamepad API not available in this browser');
      console.log('[GAMEPAD] Keyboard fallback is active (Arrow keys, Enter, Escape)');
      return;
    }
    console.log('[GAMEPAD] Gamepad API available');

    // Listen for gamepad connections
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[GAMEPAD] *** gamepadconnected event fired! ***');
      console.log('[GAMEPAD] Event gamepad:', e.gamepad);
      this.onGamepadConnected(e);
    });
    window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
    console.log('[GAMEPAD] Event listeners registered');

    // Check for already-connected gamepads (Steam Deck may have controller pre-connected)
    const gamepads = navigator.getGamepads();
    console.log('[GAMEPAD] Initial gamepad check - slots:', gamepads.length);
    let foundGamepad = false;
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      console.log('[GAMEPAD] Slot', i, ':', gp ? `${gp.id} (${gp.buttons.length} buttons, ${gp.axes.length} axes)` : 'empty');
      if (gp && !foundGamepad) {
        console.log('[GAMEPAD] *** Found pre-connected gamepad! ***');
        this.onGamepadConnected({ gamepad: gp });
        foundGamepad = true;
      }
    }

    // CRITICAL: Steam Deck fix - Start continuous polling regardless of event
    // Steam Deck's gamepad may not fire 'gamepadconnected' event but still be available
    // Poll every 500ms to check for newly available gamepads
    this.gamepadCheckInterval = setInterval(() => this.checkForGamepads(), 500);
    console.log('[GAMEPAD] Started continuous gamepad check interval (500ms)');

    // Also start the main polling loop immediately - it will no-op if no gamepad
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this.poll(), 16);
      console.log('[GAMEPAD] Started main polling loop (16ms/60fps)');
    }

    // Delayed status check - report state after 3 seconds
    // Also show helpful setup prompt if no gamepad detected (likely Steam Deck Gaming Mode)
    setTimeout(() => {
      console.log('[GAMEPAD] ========== STATUS CHECK (3s) ==========');
      console.log('[GAMEPAD] active:', this.active);
      console.log('[GAMEPAD] gamepadIndex:', this.gamepadIndex);
      console.log('[GAMEPAD] pollInterval running:', !!this.pollInterval);
      console.log('[GAMEPAD] focusableElements:', this.focusableElements.length);
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      let foundGamepad = false;
      for (let i = 0; i < gps.length; i++) {
        if (gps[i]) {
          console.log('[GAMEPAD] Active gamepad at', i, ':', gps[i].id);
          foundGamepad = true;
        }
      }
      console.log('[GAMEPAD] =========================================');

      // If no gamepad detected and user hasn't dismissed this before, show setup help
      // This helps Steam Deck users in Gaming Mode
      if (!foundGamepad && !this.active && typeof S !== 'undefined' && !S.tutorialFlags.steam_controller_setup) {
        this.showSteamControllerSetupHelp();
      }
    }, 3000);

    // Watch for DOM changes to update focusable elements (screen transitions)
    this.domObserver = new MutationObserver((mutations) => {
      // Only update if controller mode is active and we have significant DOM changes
      if (this.active) {
        let significantChange = false;
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
            // Check if added/removed nodes contain buttons or interactive elements
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1 && (node.classList?.contains('btn') || node.querySelector?.('.btn'))) {
                significantChange = true;
                break;
              }
            }
            if (significantChange) break;
          }
        }
        if (significantChange) {
          setTimeout(() => {
            this.updateFocusableElements();
            // Re-establish focus if lost - use smart default
            if (this.focusableElements.length > 0 && !document.body.contains(this.focusedElement)) {
              const bestFocus = this.findBestDefaultFocus();
              this.setFocus(bestFocus || this.focusableElements[0]);
            }
          }, 100);
        }
      }
    });
    this.domObserver.observe(document.getElementById('gameView') || document.body, {
      childList: true,
      subtree: true
    });
    console.log('[GAMEPAD] DOM observer initialized for focus management');

    // Switch to mouse mode on significant sustained mouse movement
    // NOTE: Don't deactivate on click - Steam Deck touchscreen generates clicks
    // and we want controller mode to persist even when occasionally tapping screen
    // STEAM DECK FIX: Track consecutive large movements to avoid touchpad false positives
    this.mouseMoveCount = 0;
    document.addEventListener('mousemove', (e) => {
      // Only deactivate on significant mouse movement (not just hover or small jitter)
      if (this.lastMouseX === null) {
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.mouseMoveCount = 0;
        return;
      }
      const dx = Math.abs(e.clientX - this.lastMouseX);
      const dy = Math.abs(e.clientY - this.lastMouseY);

      // Require MULTIPLE consecutive large movements (150px+) before switching to mouse mode
      // This prevents Steam Deck touchpad from accidentally deactivating controller mode
      if (dx > this.mouseMovementThreshold || dy > this.mouseMovementThreshold) {
        this.mouseMoveCount++;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        // Need 3 consecutive large movements to switch to mouse mode
        if (this.mouseMoveCount >= 3) {
          this.deactivateControllerMode();
          this.mouseMoveCount = 0;
        }
      } else {
        // Reset counter on small movement
        this.mouseMoveCount = 0;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });
    // Don't deactivate on click - let controller mode persist
  },

  // Keyboard fallback for when gamepad isn't detected (Steam mapping to keyboard, etc.)
  initKeyboardFallback() {
    console.log('[GAMEPAD] Initializing keyboard fallback...');

    // Use capture phase to catch events before they're stopped
    document.addEventListener('keydown', (e) => {
      // Skip if controller support is disabled
      if (typeof S !== 'undefined' && S.controllerDisabled) {
        console.log('[KEYBOARD] Skipped - controller disabled');
        return;
      }

      // Skip if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        console.log('[KEYBOARD] Skipped - input field focused');
        return;
      }

      // Check for blocking overlays - handle specially
      const blocking = this.isBlockingOverlayVisible();
      if (blocking === 'tutorial') {
        // Only Enter/Space dismisses tutorial
        if (e.key === 'Enter' || e.key === ' ') {
          const tutorialBtn = document.querySelector('.tutorial-modal button, .tutorial-modal .btn');
          if (tutorialBtn) {
            if (typeof SoundFX !== 'undefined' && SoundFX.play) SoundFX.play('click');
            tutorialBtn.click();
            e.preventDefault();
            e.stopPropagation();
          }
        }
        return;
      }
      if (blocking === 'suspend') {
        // Any key resumes
        if (typeof resumeGame === 'function') resumeGame();
        e.preventDefault();
        return;
      }

      // Check for navigation keys
      let handled = false;
      let action = '';

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          action = 'up';
          this.activateControllerMode();
          this.onDirection('up');
          handled = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          action = 'down';
          this.activateControllerMode();
          this.onDirection('down');
          handled = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          action = 'left';
          this.activateControllerMode();
          this.onDirection('left');
          handled = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          action = 'right';
          this.activateControllerMode();
          this.onDirection('right');
          handled = true;
          break;
        case 'Enter':
        case ' ': // Space
          action = 'confirm (A)';
          this.activateControllerMode();
          this.confirmSelection();
          handled = true;
          break;
        case 'Escape':
        case 'Backspace':
          action = 'back (B/START)';
          this.activateControllerMode();
          this.goBack();
          handled = true;
          break;
        // X button - auto-target
        case 'x':
        case 'X':
          action = 'auto-target (X)';
          this.activateControllerMode();
          this.autoTarget();
          handled = true;
          break;
        // Y button - toggle tooltip
        case 't':
        case 'T':
          action = 'toggle tooltip (Y)';
          this.activateControllerMode();
          this.toggleSigilTooltip();
          handled = true;
          break;
        // LB - previous character
        case 'q':
        case 'Q':
          action = 'prev char (LB)';
          this.activateControllerMode();
          this.onButtonPress(this.BUTTONS.LB);
          handled = true;
          break;
        // RB - next character
        case 'e':
        case 'E':
          action = 'next char (RB)';
          this.activateControllerMode();
          this.onButtonPress(this.BUTTONS.RB);
          handled = true;
          break;
        // LT - previous sigil
        case 'z':
        case 'Z':
          action = 'prev sigil (LT)';
          this.activateControllerMode();
          this.onButtonPress(this.BUTTONS.LT);
          handled = true;
          break;
        // RT - next sigil
        case 'c':
        case 'C':
          action = 'next sigil (RT)';
          this.activateControllerMode();
          this.onButtonPress(this.BUTTONS.RT);
          handled = true;
          break;
        // SELECT - switch sides
        case 'r':
        case 'R':
        case '`':
          action = 'switch sides (SELECT)';
          this.activateControllerMode();
          this.switchSides();
          handled = true;
          break;
        // START - open menu
        case 'm':
        case 'M':
          action = 'open menu (START)';
          this.activateControllerMode();
          this.openMenu();
          handled = true;
          break;
        case 'Tab':
          action = 'tab';
          // Tab cycles through focusable elements
          this.activateControllerMode();
          this.updateFocusableElements();
          if (this.focusableElements.length > 0) {
            const currentIdx = this.focusableElements.indexOf(this.focusedElement);
            const nextIdx = e.shiftKey
              ? (currentIdx - 1 + this.focusableElements.length) % this.focusableElements.length
              : (currentIdx + 1) % this.focusableElements.length;
            this.setFocus(this.focusableElements[nextIdx]);
          }
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true); // Use capture phase

    console.log('[GAMEPAD] Keyboard fallback initialized:');
    console.log('[GAMEPAD]   Navigation: Arrow keys / WASD');
    console.log('[GAMEPAD]   A (confirm): Enter / Space');
    console.log('[GAMEPAD]   B (back): Escape / Backspace');
    console.log('[GAMEPAD]   X (auto-target): X key');
    console.log('[GAMEPAD]   Y (tooltip): T key');
    console.log('[GAMEPAD]   LB/RB (prev/next char): Q / E');
    console.log('[GAMEPAD]   LT/RT (prev/next sigil): Z / C');
    console.log('[GAMEPAD]   SELECT (switch sides): R key');
    console.log('[GAMEPAD]   START (menu): M key');
  },

  // Continuously check for gamepads (Steam Deck fix)
  checkForGamepads() {
    if (this.gamepadIndex !== null) return; // Already have a gamepad

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      // STEAM DECK FIX: Accept gamepad even if gp.connected is undefined
      // Some browsers/devices don't properly set the connected property
      if (gp && (gp.connected || gp.connected === undefined)) {
        console.log('[GAMEPAD] Found gamepad via polling at index', i, ':', gp.id);
        console.log('[GAMEPAD] Buttons:', gp.buttons.length, 'Axes:', gp.axes.length);
        console.log('[GAMEPAD] Connected property:', gp.connected);

        // Detect Steam Deck specifically
        const isSteamDeck = this.detectSteamDeck(gp);
        if (isSteamDeck) {
          console.log('[GAMEPAD] *** STEAM DECK DETECTED! ***');
          this.isSteamDeck = true;
        }

        this.gamepadIndex = i;
        this.activateControllerMode();

        const deviceName = isSteamDeck ? 'Steam Deck' : 'Controller';
        toast(`🎮 ${deviceName} detected! Use D-pad to navigate.`, 2500);
        return;
      }
    }
  },

  // Detect if we're running on Steam Deck
  detectSteamDeck(gp) {
    if (!gp) return false;
    const id = (gp.id || '').toLowerCase();
    // Steam Deck controller IDs
    return id.includes('steam') ||
           id.includes('valve') ||
           id.includes('deck') ||
           // Generic XInput that might be Steam Deck
           (id.includes('xinput') && navigator.userAgent.toLowerCase().includes('linux'));
  },

  onGamepadConnected(e) {
    console.log('[GAMEPAD] Controller connected!');
    console.log('[GAMEPAD] ID:', e.gamepad.id);
    console.log('[GAMEPAD] Index:', e.gamepad.index);
    console.log('[GAMEPAD] Buttons:', e.gamepad.buttons.length);
    console.log('[GAMEPAD] Axes:', e.gamepad.axes.length);

    // Check if controller support is disabled
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      console.log('[GAMEPAD] Controller connected but support is disabled by user');
      return;
    }

    this.gamepadIndex = e.gamepad.index;
    this.activateControllerMode();

    // Start polling loop
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this.poll(), 16); // ~60fps
      console.log('[GAMEPAD] Started polling loop');
    }

    toast('🎮 Controller connected! Use D-pad to navigate, START for menu.', 2500);
  },

  onGamepadDisconnected(e) {
    debugLog('[GAMEPAD] Disconnected:', e.gamepad.id);
    if (e.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = null;
      this.deactivateControllerMode();

      // Check for other connected gamepads
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (gp) {
          this.gamepadIndex = gp.index;
          this.activateControllerMode();
          return;
        }
      }

      // No gamepads left
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }
  },

  activateControllerMode() {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('controller-active');
    this.updateFocusableElements();
    if (this.focusableElements.length > 0 && !this.focusedElement) {
      // Use smart default focus instead of just the first element
      const bestFocus = this.findBestDefaultFocus();
      this.setFocus(bestFocus || this.focusableElements[0]);
    }
    this.updatePrompts();
    debugLog('[GAMEPAD] Controller mode activated');
  },

  deactivateControllerMode() {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('controller-active');
    this.clearFocus();
    debugLog('[GAMEPAD] Controller mode deactivated (mouse input detected)');
  },

  // Check if a blocking modal/overlay is visible that should capture all input
  isBlockingOverlayVisible() {
    // Tutorial modals block everything except dismissal
    const tutorialBackdrop = document.querySelector('.tutorial-modal-backdrop');
    if (tutorialBackdrop) return 'tutorial';

    // Confirm modals block everything except Yes/No
    const confirmModal = document.querySelector('.confirm-modal');
    if (confirmModal) return 'confirm';

    // Suspend overlay blocks everything
    const suspendOverlay = document.getElementById('suspend-overlay');
    if (suspendOverlay) return 'suspend';

    return null;
  },

  // Determine current navigation context - simplified to reduce edge cases
  getNavigationContext() {
    // Blocking overlays take priority
    const blocking = this.isBlockingOverlayVisible();
    if (blocking) return blocking;

    // Check game state for combat context
    if (typeof S !== 'undefined' && S.heroes?.length > 0 && S.enemies?.length > 0) {
      return S.pending ? 'targeting' : 'combat';
    }

    // Everything else is menu navigation
    return 'menu';
  },

  // Main polling loop
  poll() {
    this.pollCount++;
    let now = Date.now();
    // Log every 10 seconds (reduced frequency)
    if (now - this.lastPollLog > 10000) {
      console.log('[GAMEPAD] Poll status - count:', this.pollCount, 'active:', this.active, 'gamepadIndex:', this.gamepadIndex, 'focusedEl:', this.focusedElement?.tagName);
      this.lastPollLog = now;
    }

    // Ensure focus is valid if controller is active (prevents stale focus issues)
    if (this.active && (!this.focusedElement || !document.body.contains(this.focusedElement))) {
      this.updateFocusableElements();
      if (this.focusableElements.length > 0) {
        const best = this.findBestDefaultFocus();
        this.setFocus(best || this.focusableElements[0]);
      }
    }

    // Skip if game is suspended (but still allow button to resume)
    if (typeof S !== 'undefined' && S.suspended) {
      // Check for any button press to resume
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp) {
          for (let b = 0; b < gp.buttons.length; b++) {
            if (gp.buttons[b].pressed && !this.buttonStates[b]) {
              if (typeof resumeGame === 'function') resumeGame();
              this.buttonStates[b] = true;
              return;
            }
            this.buttonStates[b] = gp.buttons[b].pressed;
          }
        }
      }
      return;
    }

    // STEAM DECK FIX: Always try to get gamepads fresh each poll
    // Some devices need repeated polling to properly initialize
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    // Try to find a gamepad if we don't have one
    if (this.gamepadIndex === null) {
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        // Accept gamepad even if connected is undefined (Steam Deck fix)
        if (gp && (gp.connected || gp.connected === undefined) && gp.buttons && gp.buttons.length > 0) {
          this.gamepadIndex = i;
          console.log('[GAMEPAD] Poll found gamepad at index', i, ':', gp.id);
          this.activateControllerMode();
          break;
        }
      }
      if (this.gamepadIndex === null) return;
    }

    const gp = gamepads[this.gamepadIndex];
    if (!gp || !gp.buttons) {
      // Gamepad temporarily unavailable - don't immediately disconnect
      // STEAM DECK FIX: Wait for a few poll cycles before declaring disconnected
      this.gamepadMissingCount = (this.gamepadMissingCount || 0) + 1;
      if (this.gamepadMissingCount > 30) { // About 0.5 seconds at 60fps
        console.log('[GAMEPAD] Gamepad lost after multiple missing polls');
        this.gamepadIndex = null;
        this.gamepadMissingCount = 0;
      }
      return;
    }
    this.gamepadMissingCount = 0;

    // Refresh timestamp for input timing
    now = Date.now();

    // Check buttons ALWAYS (don't skip due to cooldown - we need to track state)
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed || gp.buttons[i].value > 0.5;
      const wasPressed = this.buttonStates[i] || false;

      if (pressed && !wasPressed) {
        // Only process if cooldown elapsed
        if (now - this.lastInputTime >= this.inputCooldown) {
          this.onButtonPress(i);
          this.lastInputTime = now;
        }
      }

      this.buttonStates[i] = pressed;
    }

    // Check analog sticks
    const leftX = gp.axes[0] || 0;
    const leftY = gp.axes[1] || 0;
    const rightX = gp.axes[2] || 0;
    const rightY = gp.axes[3] || 0;

    // Check for blocking overlays before processing stick input
    const blocking = this.isBlockingOverlayVisible();
    if (blocking === 'tutorial' || blocking === 'suspend') {
      return; // Don't process stick input during blocking overlays
    }

    // Left stick: Navigate (context-aware)
    if (Math.abs(leftX) > this.axisDeadzone || Math.abs(leftY) > this.axisDeadzone) {
      if (now - this.lastInputTime >= this.inputCooldown) {
        if (Math.abs(leftX) > Math.abs(leftY)) {
          this.onLeftStick(leftX > 0 ? 'right' : 'left');
        } else {
          this.onLeftStick(leftY > 0 ? 'down' : 'up');
        }
        this.lastInputTime = now;
      }
    }

    // Right stick: Context-aware navigation
    // - In combat: up/down cycles units, left/right cycles sigils on current unit
    // - In menus: same as d-pad navigation
    if (Math.abs(rightX) > this.axisDeadzone || Math.abs(rightY) > this.axisDeadzone) {
      if (now - this.lastInputTime >= this.inputCooldown) {
        this.onRightStick(rightX, rightY);
        this.lastInputTime = now;
      }
    }
  },

  // Right stick: cycle characters in combat, spatial nav in menus
  onRightStick(x, y) {
    const context = this.getNavigationContext();
    if (context === 'tutorial' || context === 'suspend') return;

    const forward = (Math.abs(x) > Math.abs(y)) ? (x > 0) : (y > 0);

    if (context === 'combat' || context === 'targeting') {
      this.cycleUnit(forward ? 'next' : 'prev');
    } else {
      // Menus: spatial navigation
      if (Math.abs(x) > Math.abs(y)) {
        this.onDirection(x > 0 ? 'right' : 'left');
      } else {
        this.onDirection(y > 0 ? 'down' : 'up');
      }
    }
  },

  // Left stick: cycle sigils in combat, spatial nav in menus
  onLeftStick(dir) {
    const context = this.getNavigationContext();
    if (context === 'tutorial' || context === 'suspend') return;

    if (context === 'combat' || context === 'targeting') {
      this.cycleSigil((dir === 'right' || dir === 'down') ? 'next' : 'prev');
    } else {
      this.onDirection(dir);
    }
  },

  onButtonPress(buttonIndex) {
    // Activate controller mode on any button press
    if (!this.active) {
      this.activateControllerMode();
    }

    const context = this.getNavigationContext();

    // Handle blocking overlays - only allow specific actions
    // START button should ALWAYS open menu (except during suspend)
    if (buttonIndex === this.BUTTONS.START && context !== 'suspend') {
      this.openMenu();
      return;
    }

    if (context === 'tutorial') {
      // Tutorial modal: only A button works to dismiss
      if (buttonIndex === this.BUTTONS.A) {
        const tutorialBtn = document.querySelector('.tutorial-modal button, .tutorial-modal .btn');
        if (tutorialBtn) {
          if (typeof SoundFX !== 'undefined' && SoundFX.play) SoundFX.play('click');
          tutorialBtn.click();
        }
      }
      return; // Block all other input
    }

    if (context === 'confirm') {
      // Confirm modal: A for Yes, B for No, D-pad to navigate
      if (buttonIndex === this.BUTTONS.A) {
        const yesBtn = document.querySelector('.confirm-btn-yes');
        if (yesBtn) {
          if (typeof SoundFX !== 'undefined' && SoundFX.play) SoundFX.play('click');
          yesBtn.click();
        }
        return;
      }
      if (buttonIndex === this.BUTTONS.B) {
        const noBtn = document.querySelector('.confirm-btn-no');
        if (noBtn) {
          if (typeof SoundFX !== 'undefined' && SoundFX.play) SoundFX.play('click');
          noBtn.click();
        }
        return;
      }
      // Allow D-pad to navigate between Yes/No
      if (buttonIndex >= this.BUTTONS.DPAD_UP && buttonIndex <= this.BUTTONS.DPAD_RIGHT) {
        const yesBtn = document.querySelector('.confirm-btn-yes');
        const noBtn = document.querySelector('.confirm-btn-no');
        if (this.focusedElement === yesBtn) {
          this.setFocus(noBtn);
        } else {
          this.setFocus(yesBtn);
        }
        if (typeof SoundFX !== 'undefined' && SoundFX.play) SoundFX.play('click');
      }
      return; // Block all other input
    }

    if (context === 'suspend') {
      // Any button resumes from suspend
      if (typeof resumeGame === 'function') resumeGame();
      return;
    }

    switch (buttonIndex) {
      case this.BUTTONS.A:
        // STEAM DECK FIX: Try direct screen-aware actions first
        if (!this.tryDirectAction()) {
          this.confirmSelection();
        }
        break;
      case this.BUTTONS.START:
        // START always opens settings menu
        this.openMenu();
        break;
      case this.BUTTONS.B:
        this.goBack();
        break;
      case this.BUTTONS.Y:
        this.toggleTooltip();
        break;
      case this.BUTTONS.DPAD_UP:
      case this.BUTTONS.DPAD_DOWN:
      case this.BUTTONS.DPAD_LEFT:
      case this.BUTTONS.DPAD_RIGHT:
        // D-pad: spatial navigation everywhere (simple and predictable)
        const dir = buttonIndex === this.BUTTONS.DPAD_UP ? 'up' :
                    buttonIndex === this.BUTTONS.DPAD_DOWN ? 'down' :
                    buttonIndex === this.BUTTONS.DPAD_LEFT ? 'left' : 'right';
        this.onDirection(dir);
        break;
      case this.BUTTONS.LB:
        // LB: cycle characters in combat, page up in menus
        if (context === 'combat' || context === 'targeting') {
          this.cycleUnit('prev');
        } else {
          this.pageScroll('up');
        }
        break;
      case this.BUTTONS.RB:
        // RB: cycle characters in combat, page down in menus
        if (context === 'combat' || context === 'targeting') {
          this.cycleUnit('next');
        } else {
          this.pageScroll('down');
        }
        break;
      case this.BUTTONS.LT:
        // LT: cycle sigils in combat only
        if (context === 'combat' || context === 'targeting') {
          this.cycleSigil('prev');
        }
        break;
      case this.BUTTONS.RT:
        // RT: cycle sigils in combat only
        if (context === 'combat' || context === 'targeting') {
          this.cycleSigil('next');
        }
        break;
      case this.BUTTONS.X:
        this.autoTarget();
        break;
      case this.BUTTONS.SELECT:
        this.switchSides();
        break;
      case this.BUTTONS.L3:
        // Left stick click: Toggle tooltip on current unit/element
        this.toggleTooltip();
        break;
      case this.BUTTONS.R3:
        // Right stick click: Quick switch sides in combat
        this.switchSides();
        break;
    }
  },

  // Cycle through valid targets (enemies or heroes depending on action)
  cycleTargets(direction) {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Hide tooltip when cycling
    this.hideActiveTooltip();

    // Determine what we're targeting
    let targetCards = [];
    if (typeof S !== 'undefined' && S.pending) {
      if (['Attack', 'Grapple', 'D20_TARGET'].includes(S.pending)) {
        // Targeting enemies
        targetCards = Array.from(document.querySelectorAll('.card.enemy.targetable, .card.enemy:not(.dead)'));
      } else if (['Heal', 'Shield', 'Alpha'].includes(S.pending)) {
        // Targeting heroes
        targetCards = Array.from(document.querySelectorAll('.card.hero.targetable, .card.hero:not(.dead)'));
      }
    }

    if (targetCards.length === 0) {
      // Fallback to all cards
      targetCards = Array.from(document.querySelectorAll('.card.targetable, .card:not(.dead)'));
    }

    if (targetCards.length === 0) return;

    // Find current target
    let currentIdx = targetCards.findIndex(el =>
      el === this.focusedElement || el.contains(this.focusedElement)
    );

    if (currentIdx === -1) {
      currentIdx = 0;
    } else {
      if (direction === 'next') {
        currentIdx = (currentIdx + 1) % targetCards.length;
      } else {
        currentIdx = (currentIdx - 1 + targetCards.length) % targetCards.length;
      }
    }

    this.setFocus(targetCards[currentIdx]);
  },

  onDirection(dir) {
    if (!this.active) {
      this.activateControllerMode();
      return;
    }

    // Block navigation during blocking overlays (except confirm modal navigation handled elsewhere)
    const blocking = this.isBlockingOverlayVisible();
    if (blocking === 'tutorial' || blocking === 'suspend') {
      return; // Don't navigate behind blocking modals
    }

    this.updateFocusableElements();

    // If no focusable elements, try scrolling instead
    if (this.focusableElements.length === 0) {
      if (dir === 'up' || dir === 'down') {
        this.scrollContainer(dir);
      }
      return;
    }

    // Play navigation sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    if (!this.focusedElement || !document.body.contains(this.focusedElement)) {
      // No focus or element removed - focus first element if available
      if (this.focusableElements.length > 0) {
        this.setFocus(this.focusableElements[0]);
      }
      return;
    }

    // Find next element in direction using spatial navigation
    const next = this.findNextElement(dir);
    if (next) {
      this.setFocus(next);
    } else if (dir === 'up' || dir === 'down') {
      // No element found in direction - try scrolling
      this.scrollContainer(dir);
    }
  },

  findNextElement(dir) {
    if (!this.focusedElement) return this.focusableElements.length > 0 ? this.focusableElements[0] : null;

    const current = this.focusedElement.getBoundingClientRect();
    const currentCenter = {
      x: current.left + current.width / 2,
      y: current.top + current.height / 2
    };

    let bestCandidate = null;
    let bestScore = Infinity;

    for (const el of this.focusableElements) {
      if (el === this.focusedElement) continue;

      const rect = el.getBoundingClientRect();
      const elCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      // Calculate direction vector
      const dx = elCenter.x - currentCenter.x;
      const dy = elCenter.y - currentCenter.y;

      // Check if element is in the right direction
      let inDirection = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      switch (dir) {
        case 'up':
          inDirection = dy < -10;
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
          break;
        case 'down':
          inDirection = dy > 10;
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
          break;
        case 'left':
          inDirection = dx < -10;
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
          break;
        case 'right':
          inDirection = dx > 10;
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
          break;
      }

      if (!inDirection) continue;

      // Score: prefer closer elements, with penalty for off-axis distance
      const score = primaryDist + secondaryDist * 2;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = el;
      }
    }

    // If no element in direction, wrap around
    if (!bestCandidate) {
      const idx = this.focusableElements.indexOf(this.focusedElement);
      if (dir === 'down' || dir === 'right') {
        bestCandidate = this.focusableElements[(idx + 1) % this.focusableElements.length];
      } else {
        bestCandidate = this.focusableElements[(idx - 1 + this.focusableElements.length) % this.focusableElements.length];
      }
    }

    return bestCandidate;
  },

  setFocus(el) {
    this.clearFocus();
    if (!el) return;

    this.focusedElement = el;
    el.classList.add('controller-focus');

    // Scroll into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  },

  clearFocus() {
    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
    }
    this.focusedElement = null;
  },

  confirmSelection() {
    // Cooldown after tutorial popup dismissal to prevent click-through
    if (window.tutorialDismissTime && Date.now() - window.tutorialDismissTime < 200) {
      return;
    }

    // Play confirm sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // If we have targets selected, try to confirm them
    if (typeof S !== 'undefined' && S.pending) {
      const hasTargets = (S.pending === 'D20_TARGET' && S.targets?.length > 0) ||
                         (S.currentInstanceTargets?.length > 0);
      if (hasTargets && typeof confirmTargets === 'function') {
        confirmTargets();
        return;
      }
    }

    // STEAM DECK FIX: Try direct action invocation based on focused element's onclick
    // This is more reliable than click() for dynamically generated elements
    if (this.focusedElement) {
      const onclick = this.focusedElement.getAttribute('onclick');
      if (onclick) {
        try {
          // Execute the onclick handler directly
          const fn = new Function(onclick);
          fn.call(this.focusedElement);
          this.refreshFocusAfterAction();
          return;
        } catch (e) {
          console.log('[GAMEPAD] Direct onclick execution failed, falling back to click():', e);
        }
      }
    }

    // Ensure we have a valid focus target
    if (!this.focusedElement || !document.body.contains(this.focusedElement)) {
      this.updateFocusableElements();
      const best = this.findBestDefaultFocus() || this.findPrimaryAction() || this.focusableElements[0];
      if (best) {
        this.setFocus(best);
        this.executeElementAction(best);
      }
      return;
    }

    // Try to execute the action on the focused element
    this.executeElementAction(this.focusedElement);
  },

  // Execute action on an element - tries onclick first, then click()
  executeElementAction(el) {
    if (!el) return;

    const onclick = el.getAttribute('onclick');
    if (onclick) {
      try {
        const fn = new Function(onclick);
        fn.call(el);
        this.refreshFocusAfterAction();
        return;
      } catch (e) {
        console.log('[GAMEPAD] onclick execution failed:', e);
      }
    }

    // Fallback to native click
    el.click();
    this.refreshFocusAfterAction();
  },

  // Refresh focus after an action completes
  refreshFocusAfterAction() {
    setTimeout(() => {
      this.updateFocusableElements();
      if (!this.focusedElement || !document.body.contains(this.focusedElement)) {
        const best = this.findBestDefaultFocus();
        this.setFocus(best || this.focusableElements[0]);
      }
      this.updatePrompts();
    }, 100);
  },

  // STEAM DECK FIX: Direct action invocation for common screens
  // This bypasses focus entirely and directly calls game functions
  // Returns true if a direct action was taken
  tryDirectAction() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Check for focused element first - if we have one with onclick, use it
    if (this.focusedElement && document.body.contains(this.focusedElement)) {
      return false; // Let normal confirmSelection handle it
    }

    // Title screen - click PLAY button
    const playBtn = document.querySelector('.title-play-btn');
    if (playBtn && playBtn.offsetParent !== null) {
      console.log('[GAMEPAD] Direct action: Title screen PLAY');
      this.executeElementAction(playBtn);
      return true;
    }

    // Save slots - click visible slot or new game button
    const continueBtn = document.querySelector('[onclick*="continueSlot"]');
    if (continueBtn && continueBtn.offsetParent !== null) {
      console.log('[GAMEPAD] Direct action: Continue from slot');
      this.executeElementAction(continueBtn);
      return true;
    }

    // Hero selection - click Start button
    const startBtn = document.getElementById('start');
    if (startBtn && startBtn.offsetParent !== null && !startBtn.classList.contains('disabled')) {
      console.log('[GAMEPAD] Direct action: Start game from hero select');
      this.executeElementAction(startBtn);
      return true;
    }

    // Narrative continue buttons
    const narrativeBtn = document.querySelector('[onclick*="continueNarrative"]');
    if (narrativeBtn && narrativeBtn.offsetParent !== null) {
      console.log('[GAMEPAD] Direct action: Continue narrative');
      this.executeElementAction(narrativeBtn);
      return true;
    }

    // Level up / next floor buttons
    const nextFloorBtn = document.querySelector('[onclick*="nextFloor"]');
    if (nextFloorBtn && nextFloorBtn.offsetParent !== null) {
      console.log('[GAMEPAD] Direct action: Next floor');
      this.executeElementAction(nextFloorBtn);
      return true;
    }

    // Ribbleton portal
    const portalBtn = document.querySelector('[onclick*="startFloor"]');
    if (portalBtn && portalBtn.offsetParent !== null) {
      console.log('[GAMEPAD] Direct action: Enter portal');
      this.executeElementAction(portalBtn);
      return true;
    }

    // Death screen - back to hub
    const returnBtn = document.querySelector('[onclick*="showRibbleton"]');
    if (returnBtn && returnBtn.offsetParent !== null) {
      console.log('[GAMEPAD] Direct action: Return to hub');
      this.executeElementAction(returnBtn);
      return true;
    }

    // Combat: If targeting mode and we have focused element, try to target it
    if (typeof S !== 'undefined' && S.pending && this.focusedElement) {
      const card = this.focusedElement.closest('.card');
      if (card && card.onclick) {
        console.log('[GAMEPAD] Direct action: Target card');
        card.onclick();
        return true;
      }
    }

    // No direct action available
    return false;
  },

  goBack() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Cancel pending combat action first
    if (typeof S !== 'undefined' && S.pending && typeof cancelAction === 'function') {
      cancelAction();
      return;
    }

    // Try to find and click a close/back button (in priority order)
    const closeSelectors = [
      '.modal-container [onclick*="close"]',
      '.modal-container [onclick*="Close"]',
      '[onclick*="closeSettingsMenu"]',
      '[onclick*="closeFAQ"]',
      '[onclick*="closeSigilarium"]',
      '.btn[onclick*="Back"]',
      '.btn[onclick*="back"]',
      '[onclick*="showRibbleton"]'
    ];

    for (const selector of closeSelectors) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        setTimeout(() => this.updateFocusableElements(), 100);
        return;
      }
    }
  },

  openMenu() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    if (typeof showSettingsMenu === 'function') {
      showSettingsMenu();
      setTimeout(() => {
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
          this.setFocus(this.focusableElements[0]);
        }
      }, 100);
    }
  },

  // Helper to hide any active tooltip
  hideActiveTooltip() {
    if (this.tooltipVisible) {
      if (typeof hideTooltip === 'function') hideTooltip();
      if (this.tooltipElement) {
        this.tooltipElement.classList.remove('controller-tooltip-active');
      }
      this.tooltipVisible = false;
      this.tooltipElement = null;
    }
  },

  // Show tooltip for a sigil element
  showSigilTooltip(sigilEl) {
    if (!sigilEl) return;

    const mouseEnter = sigilEl.getAttribute('onmouseenter');
    if (mouseEnter) {
      const match = mouseEnter.match(/showTooltip\('([^']+)'/);
      if (match && typeof showTooltip === 'function') {
        const sigilName = match[1];
        const levelMatch = mouseEnter.match(/,\s*(\d+)\)/);
        const level = levelMatch ? parseInt(levelMatch[1]) : undefined;
        showTooltip(sigilName, sigilEl, level);
        this.tooltipVisible = true;
        this.tooltipElement = sigilEl;
        sigilEl.classList.add('controller-tooltip-active');
      }
    }
  },

  // Toggle tooltip on focused element (Y button)
  toggleTooltip() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // If tooltip is already visible, hide it
    if (this.tooltipVisible) {
      this.hideActiveTooltip();
      return;
    }

    // Try to show tooltip for focused element
    if (!this.focusedElement) return;

    // Check if focused element is a sigil
    let sigilEl = null;
    if (this.focusedElement.classList.contains('sigil')) {
      sigilEl = this.focusedElement;
    } else {
      // Check if focused element is or contains a card with sigils
      const card = this.focusedElement.classList.contains('card') ? this.focusedElement :
                   this.focusedElement.closest('.card');
      if (card) {
        // Get all sigils in this card
        const sigils = Array.from(card.querySelectorAll('.sigil'));
        if (sigils.length > 0) {
          // Use currentSigilIndex if valid, otherwise first sigil
          const idx = (this.currentSigilIndex >= 0 && this.currentSigilIndex < sigils.length)
                      ? this.currentSigilIndex : 0;
          sigilEl = sigils[idx];
        }
      } else {
        // Try direct querySelector as fallback
        sigilEl = this.focusedElement.querySelector('.sigil');
      }
    }

    if (sigilEl) {
      this.showSigilTooltip(sigilEl);
    }
  },

  // Cycle between units: heroes and enemies (LB/RB/D-pad left/right)
  cycleUnit(direction) {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Hide any active tooltip when switching units
    this.hideActiveTooltip();

    // Collect all unit cards (heroes first, then enemies)
    const heroCards = Array.from(document.querySelectorAll('.card.hero'));
    const enemyCards = Array.from(document.querySelectorAll('.card.enemy'));
    const allUnits = [...heroCards, ...enemyCards];

    if (allUnits.length === 0) return;

    // Find current focused unit
    let currentIdx = allUnits.findIndex(el =>
      el === this.focusedElement || el.contains(this.focusedElement)
    );

    if (currentIdx === -1) {
      // Not on a unit, start with first
      currentIdx = 0;
    } else {
      // Move to next/prev
      if (direction === 'next') {
        currentIdx = (currentIdx + 1) % allUnits.length;
      } else {
        currentIdx = (currentIdx - 1 + allUnits.length) % allUnits.length;
      }
    }

    this.currentUnitIndex = currentIdx;
    this.currentSigilIndex = 0; // Reset sigil index when changing units
    this.setFocus(allUnits[currentIdx]);
  },

  // Cycle through sigils on the currently focused unit (LT/RT)
  cycleSigil(direction) {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Find the card containing the focused element or focus a card first
    let card = this.focusedElement;
    if (!card) return;

    // If focused element is not a card, find parent card
    if (!card.classList.contains('card')) {
      card = card.closest('.card');
    }
    if (!card) return;

    // Get all sigils in this card
    const sigils = Array.from(card.querySelectorAll('.sigil'));
    if (sigils.length === 0) return;

    // Find current sigil index
    let currentIdx = sigils.findIndex(el =>
      el === this.focusedElement || el.classList.contains('controller-tooltip-active')
    );

    if (currentIdx === -1) {
      currentIdx = 0;
    } else {
      if (direction === 'next') {
        currentIdx = (currentIdx + 1) % sigils.length;
      } else {
        currentIdx = (currentIdx - 1 + sigils.length) % sigils.length;
      }
    }

    this.currentSigilIndex = currentIdx;
    const targetSigil = sigils[currentIdx];

    // Hide previous tooltip
    if (this.tooltipVisible && this.tooltipElement) {
      if (typeof hideTooltip === 'function') hideTooltip();
      this.tooltipElement.classList.remove('controller-tooltip-active');
    }

    // Show tooltip for new sigil
    const mouseEnter = targetSigil.getAttribute('onmouseenter');
    if (mouseEnter) {
      const match = mouseEnter.match(/showTooltip\('([^']+)'/);
      if (match && typeof showTooltip === 'function') {
        const sigilName = match[1];
        const levelMatch = mouseEnter.match(/,\s*(\d+)\)/);
        const level = levelMatch ? parseInt(levelMatch[1]) : undefined;
        showTooltip(sigilName, targetSigil, level);
        this.tooltipVisible = true;
        this.tooltipElement = targetSigil;
        targetSigil.classList.add('controller-tooltip-active');
      }
    }

    // If the sigil is clickable, focus it
    if (targetSigil.classList.contains('clickable') || targetSigil.hasAttribute('onclick')) {
      this.setFocus(targetSigil);
    }
  },

  // Switch sides: jump to the unit across from current selection (X button)
  switchSides() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Hide tooltip when switching
    this.hideActiveTooltip();

    const context = this.getNavigationContext();
    if (context !== 'combat' && context !== 'targeting') return;

    // Find current focused card
    let currentCard = this.focusedElement;
    if (!currentCard) return;
    if (!currentCard.classList.contains('card')) {
      currentCard = currentCard.closest('.card');
    }
    if (!currentCard) return;

    const isHero = currentCard.classList.contains('hero');
    const isEnemy = currentCard.classList.contains('enemy');

    if (!isHero && !isEnemy) return;

    // Get all cards on both sides
    const heroCards = Array.from(document.querySelectorAll('.card.hero'));
    const enemyCards = Array.from(document.querySelectorAll('.card.enemy'));

    if (isHero) {
      // Currently on hero, switch to enemy across or nearest
      const heroIdx = heroCards.indexOf(currentCard);
      if (enemyCards.length === 0) return;
      // Try to find enemy at same lane index, or nearest
      const targetIdx = Math.min(heroIdx, enemyCards.length - 1);
      this.setFocus(enemyCards[targetIdx]);
    } else {
      // Currently on enemy, switch to hero across or nearest
      const enemyIdx = enemyCards.indexOf(currentCard);
      if (heroCards.length === 0) return;
      // Try to find hero at same lane index, or nearest
      const targetIdx = Math.min(enemyIdx, heroCards.length - 1);
      this.setFocus(heroCards[targetIdx]);
    }
  },

  // Auto target: automatically select targets using AI logic (X button)
  // Press once to auto-select, press again to confirm
  autoTarget() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Only works when we have a pending action that needs targets
    if (typeof S === 'undefined' || !S.pending) {
      toast('No action selected - choose a sigil first!', 1500);
      return;
    }

    // If targets are already selected, confirm them on second press
    if (S.currentInstanceTargets && S.currentInstanceTargets.length > 0) {
      if (typeof confirmTargets === 'function') {
        confirmTargets();
      }
      return;
    }

    // Show first-time tutorial
    if (typeof showTutorialPop === 'function' && typeof S !== 'undefined' && !S.tutorialFlags.auto_target_intro) {
      S.tutorialFlags.auto_target_intro = true;
      if (typeof savePermanent === 'function') savePermanent();
      toast('Press Ⓧ again to confirm, or Ⓑ to cancel', 2500);
    }

    const pending = S.pending;
    const heroIdx = S.activeIdx;
    const hero = S.heroes[heroIdx];
    if (!hero) return;

    // Determine how many targets we need
    let targetsNeeded = 1;
    if (S.instancesRemaining > 0) {
      // Multi-instance action, need targets for current instance
      targetsNeeded = 1; // Usually 1 per instance for expand
    }

    // Calculate total targets based on expand
    // Use getTargetsPerInstance if available (respects Mage/Healer bonus properly)
    let totalTargets = 1;
    if (typeof getTargetsPerInstance === 'function') {
      totalTargets = getTargetsPerInstance(pending, heroIdx);
    } else {
      // Fallback: manually calculate (shouldn't normally be needed)
      const expandLevel = typeof getLevel === 'function' ? getLevel('Expand', heroIdx) : 0;
      totalTargets = 1 + expandLevel;
    }
    targetsNeeded = Math.max(1, totalTargets - (S.currentInstanceTargets ? S.currentInstanceTargets.length : 0));

    // Different targeting logic based on action type
    if (['Attack', 'Grapple', 'D20_TARGET'].includes(pending)) {
      // Target enemies - prioritize lowest HP, then by lane proximity
      const aliveEnemies = S.enemies.filter(e => e.h > 0);
      if (aliveEnemies.length === 0) {
        toast('No valid enemy targets!', 1500);
        return;
      }

      // Sort by HP (lowest first), then by lane proximity to acting hero
      aliveEnemies.sort((a, b) => {
        if (a.h !== b.h) return a.h - b.h; // Lowest HP first
        // If same HP, prefer enemies in same lane
        const aLaneDist = Math.abs((a.li !== undefined ? a.li : 0) - heroIdx);
        const bLaneDist = Math.abs((b.li !== undefined ? b.li : 0) - heroIdx);
        return aLaneDist - bLaneDist;
      });

      // Click targets up to targetsNeeded
      const toTarget = aliveEnemies.slice(0, targetsNeeded);
      S.autoSelectInProgress = true; // Prevent auto-confirm during auto-select
      for (const enemy of toTarget) {
        const card = document.getElementById(enemy.id);
        if (card) {
          card.click();
        }
      }
      S.autoSelectInProgress = false;

      if (toTarget.length > 0) {
        toast(`Auto-targeted ${toTarget.length} enem${toTarget.length === 1 ? 'y' : 'ies'}!`, 1200);
      }

    } else if (['Heal', 'Shield', 'Alpha'].includes(pending)) {
      // Target heroes - prioritize based on action
      let aliveHeroes = S.heroes.filter(h => h.h > 0 || h.ls); // Include Last Stand heroes for heal

      if (aliveHeroes.length === 0) {
        toast('No valid hero targets!', 1500);
        return;
      }

      if (pending === 'Heal') {
        // For heal: prioritize Last Stand heroes, then lowest HP ratio
        aliveHeroes.sort((a, b) => {
          // Last Stand heroes first
          if (a.ls && !b.ls) return -1;
          if (!a.ls && b.ls) return 1;
          // Then by HP ratio (most damaged first)
          const aRatio = a.h / a.m;
          const bRatio = b.h / b.m;
          return aRatio - bRatio;
        });
      } else if (pending === 'Shield') {
        // For shield: prioritize lowest current shield, then lowest HP
        aliveHeroes.sort((a, b) => {
          const aShield = a.sh || 0;
          const bShield = b.sh || 0;
          if (aShield !== bShield) return aShield - bShield; // Lowest shield first
          return a.h - b.h; // Then lowest HP
        });
      } else if (pending === 'Alpha') {
        // For Alpha: prioritize highest POW heroes (for multiplying damage)
        aliveHeroes.sort((a, b) => b.p - a.p);
      }

      // Click targets up to targetsNeeded
      const toTarget = aliveHeroes.slice(0, targetsNeeded);
      S.autoSelectInProgress = true; // Prevent auto-confirm during auto-select
      for (const hero of toTarget) {
        const card = document.getElementById(hero.id);
        if (card) {
          card.click();
        }
      }
      S.autoSelectInProgress = false;

      if (toTarget.length > 0) {
        toast(`Auto-targeted ${toTarget.length} hero${toTarget.length === 1 ? '' : 'es'}!`, 1200);
      }

    } else {
      toast('Auto-target not available for this action', 1500);
    }
  },

  // Save focus state before DOM updates
  saveFocusState() {
    if (this.focusedElement) {
      this.lastFocusedId = this.focusedElement.id || null;
      // Also try to save a descriptor for non-id elements
      if (!this.lastFocusedId && this.focusedElement.classList.contains('card')) {
        const heroId = this.focusedElement.id;
        if (heroId) this.lastFocusedId = heroId;
      }
    }
  },

  // Restore focus after DOM updates
  restoreFocusState() {
    if (!this.active) return;

    // Always hide tooltips on DOM changes to prevent persistence issues
    this.hideActiveTooltip();

    setTimeout(() => {
      this.updateFocusableElements();

      // Try to restore by ID
      if (this.lastFocusedId) {
        const el = document.getElementById(this.lastFocusedId);
        if (el && this.focusableElements.includes(el)) {
          this.setFocus(el);
          this.updatePrompts();
          return;
        }
      }

      // Use smart default focus instead of just the first element
      if (this.focusableElements.length > 0) {
        const bestFocus = this.findBestDefaultFocus();
        this.setFocus(bestFocus || this.focusableElements[0]);
      }

      this.updatePrompts();
    }, 50);
  },

  updateFocusableElements() {
    // Find all focusable elements in order of appearance
    const selectors = [
      // Buttons - most common interactive elements
      '.btn:not(.disabled)',
      'button:not(.disabled):not([disabled])',
      // Choice options
      '.choice',
      // Clickable cards (heroes, enemies)
      '.card[onclick]',
      '.card.hero:not(.acted)',
      '.card.enemy.targetable',
      '.card.hero.targetable',
      // Clickable sigils
      '.sigil.clickable',
      '.sigil[onclick]',
      // Modal checkboxes
      '.modal-checkbox-label',
      // Header buttons
      '.header button',
      // Title screen elements
      '.title-play-btn',
      '.title-credits-btn',
      '.save-slot',
      // Hero selection
      '.hero-select-btn',
      '#start',
      // Generic clickable elements
      '[onclick]:not(script):not(.disabled)',
      // Links
      'a[href]'
    ];

    const elements = new Set();

    for (const selector of selectors) {
      try {
        document.querySelectorAll(selector).forEach(el => {
          // Check if element is visible and not in rotate prompt or modal overlay
          if (el.offsetParent !== null &&
              !el.closest('#rotatePrompt') &&
              !el.classList.contains('disabled') &&
              !el.classList.contains('modal-overlay') &&
              !el.classList.contains('confirm-modal-overlay') &&
              el.style.display !== 'none' &&
              el.style.visibility !== 'hidden') {
            elements.add(el);
          }
        });
      } catch (e) {
        // Invalid selector - skip
      }
    }

    // STEAM DECK FIX: If we found nothing, try a more aggressive search
    if (elements.size === 0) {
      document.querySelectorAll('[onclick]').forEach(el => {
        if (el.offsetParent !== null && !el.closest('#rotatePrompt')) {
          elements.add(el);
        }
      });
    }

    // Sort by visual position (top-to-bottom, left-to-right)
    this.focusableElements = Array.from(elements).sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();

      // Group by approximate rows (within 30px vertical)
      const rowDiff = Math.abs(rectA.top - rectB.top);
      if (rowDiff > 30) {
        return rectA.top - rectB.top;
      }
      return rectA.left - rectB.left;
    });

    // Debug: Log when we have issues finding focusable elements
    if (this.focusableElements.length === 0 && this.active) {
      console.log('[GAMEPAD] Warning: No focusable elements found on screen');
    }
  },

  // Find the best element to focus by default based on context
  // This prevents focusing emoji buttons and other decorative elements
  findBestDefaultFocus() {
    const context = this.getNavigationContext();

    // For blocking overlays, focus the appropriate button
    if (context === 'tutorial') {
      // Focus the "Got it!" button in tutorial modal
      const tutorialBtn = document.querySelector('.tutorial-modal button, .tutorial-modal .btn');
      if (tutorialBtn) return tutorialBtn;
    }

    if (context === 'confirm') {
      // Focus the Yes button in confirm modal
      const yesBtn = document.querySelector('.confirm-btn-yes');
      if (yesBtn) return yesBtn;
    }

    // For combat, focus the first hero's first clickable sigil or the hero card itself
    if (context === 'combat' || context === 'targeting') {
      // First, try to find the first hero card
      const heroCards = document.querySelectorAll('.card.hero:not(.acted)');
      if (heroCards.length > 0) {
        // Try to find a clickable sigil on the first hero
        const firstHero = heroCards[0];
        const clickableSigil = firstHero.querySelector('.sigil.clickable, .sigil[onclick]');
        if (clickableSigil) return clickableSigil;
        // Otherwise focus the hero card itself
        return firstHero;
      }
      // Fallback to any hero card
      const anyHero = document.querySelector('.card.hero');
      if (anyHero) return anyHero;
    }

    // For modals (sigilarium, FAQ, etc), skip emoji buttons and header icons
    if (context === 'modal') {
      const modal = document.querySelector('.modal-container');
      if (modal) {
        // Look for primary action buttons first (not emoji, not header)
        const primaryBtns = modal.querySelectorAll('.btn:not(.emoji-btn):not([style*="position:absolute"])');
        for (const btn of primaryBtns) {
          const text = btn.textContent || '';
          // Skip buttons that are just emojis or single characters
          if (text.length > 2 && !/^[\u{1F300}-\u{1F9FF}]$/u.test(text.trim())) {
            return btn;
          }
        }
        // Try to find any non-emoji button
        const anyBtn = modal.querySelector('.btn:not(.emoji-btn)');
        if (anyBtn) return anyBtn;
      }
    }

    // For menu screens, look for primary action
    const primaryAction = this.findPrimaryAction();
    if (primaryAction) return primaryAction;

    // Filter out emoji-only buttons and header icons from default focus
    for (const el of this.focusableElements) {
      const text = (el.textContent || '').trim();
      // Skip elements that are:
      // - Just emojis (1-2 characters that are emoji)
      // - In the header
      // - Position absolute (usually close buttons)
      const isEmojiOnly = text.length <= 2 && /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(text);
      const isHeader = el.closest('.header, .modal-header, [style*="position:absolute"]');
      const isCloseBtn = el.classList.contains('close-btn') || text === '✕' || text === '×';

      if (!isEmojiOnly && !isHeader && !isCloseBtn) {
        return el;
      }
    }

    // Last resort: return first focusable
    return this.focusableElements[0];
  },

  // Find an obvious primary action button (Continue, Next, OK, PLAY, etc.)
  findPrimaryAction() {
    // Priority order of selectors to find primary action
    const primarySelectors = [
      // Title screen PLAY button
      '.title-play-btn',
      // Save slot continue/new game buttons
      '[onclick*="continueSlot"]',
      '[onclick*="createNewSlot"]',
      // Hero selection start button
      '#start',
      '[onclick*="start()"]',
      // Narrative continue buttons
      '[onclick*="continueNarrative"]',
      '[onclick*="transitionToPortalInvasion"]',
      // Next floor / level up
      '[onclick*="nextFloor"]',
      '[onclick*="levelUp"]',
      // Ribbleton portal
      '[onclick*="showRibbleton"]',
      // Common advancement buttons by text content
      'button.btn:not(.secondary)',
      '.btn:not(.secondary):not(.title-credits-btn)',
    ];

    // Common action text patterns
    const actionPatterns = [
      /continue/i,
      /next\s*floor/i,
      /^play$/i,
      /start/i,
      /delve/i,
      /begin/i,
      /^ok$/i,
      /^\s*▶/,  // Play icon
      /place\s*figurine/i,
      /return/i,
    ];

    // First try specific selectors
    for (const selector of primarySelectors) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null && !btn.classList.contains('disabled')) {
        // For generic .btn selector, check text content matches action patterns
        if (selector.includes(':not')) {
          const text = btn.textContent || '';
          for (const pattern of actionPatterns) {
            if (pattern.test(text)) {
              return btn;
            }
          }
        } else {
          return btn;
        }
      }
    }

    // Try finding any visible button with action text
    const allBtns = document.querySelectorAll('.btn:not(.disabled):not(.secondary), button:not(.disabled)');
    for (const btn of allBtns) {
      if (btn.offsetParent === null) continue; // Not visible
      const text = btn.textContent || '';
      for (const pattern of actionPatterns) {
        if (pattern.test(text)) {
          return btn;
        }
      }
    }

    return null;
  },

  // Find the nearest scrollable container
  findScrollableContainer() {
    // Check for modal containers first (FAQ, Sigilarium, etc.)
    const modal = document.querySelector('.modal-container');
    if (modal && modal.scrollHeight > modal.clientHeight) {
      return modal;
    }

    // Check neutral-left panel
    const neutralLeft = document.querySelector('.neutral-left');
    if (neutralLeft && neutralLeft.scrollHeight > neutralLeft.clientHeight) {
      return neutralLeft;
    }

    // Check game area
    const gameArea = document.querySelector('.game-area');
    if (gameArea && gameArea.scrollHeight > gameArea.clientHeight) {
      return gameArea;
    }

    return null;
  },

  // Scroll a container
  scrollContainer(direction, amount = 100) {
    const container = this.findScrollableContainer();
    if (!container) return false;

    const scrollAmount = direction === 'up' ? -amount : amount;
    const beforeScroll = container.scrollTop;
    container.scrollBy({ top: scrollAmount, behavior: 'smooth' });

    // Return true if we actually scrolled
    return true;
  },

  // Page scroll (larger amount for LB/RB)
  pageScroll(direction) {
    const container = this.findScrollableContainer();
    if (!container) return false;

    const pageAmount = container.clientHeight * 0.8; // 80% of visible height
    return this.scrollContainer(direction, pageAmount);
  },

  updatePrompts() {
    const promptsEl = document.getElementById('controllerPrompts');
    if (!promptsEl) return;

    // Determine screen context
    const hasModal = document.querySelector('.modal-container');
    const inCombat = typeof S !== 'undefined' && S.heroes && S.heroes.length > 0 && S.enemies && S.enemies.length > 0;
    const hasPending = typeof S !== 'undefined' && S.pending;
    const hasCards = document.querySelectorAll('.card').length > 0;
    const isTitleScreen = !!document.querySelector('.title-screen');
    const isHeroSelect = !!document.getElementById('hero-select-container');
    const isDeathScreen = !!document.querySelector('[onclick*="purchaseSigilUpgrade"]');
    const isNeutralScreen = !!document.querySelector('.neutral-content');
    const isLevelUp = !!document.querySelector('[onclick*="levelUpMenu"]') || !!document.querySelector('[onclick*="nextFloor"]');

    let prompts = [];

    // Title screen - simple prompts
    if (isTitleScreen) {
      prompts = [
        { btn: 'a', label: 'Play' },
        { btn: 'dpad', label: 'Navigate' }
      ];
    }
    // Hero selection
    else if (isHeroSelect) {
      prompts = [
        { btn: 'dpad', label: 'Select Hero' },
        { btn: 'a', label: 'Toggle' },
        { btn: 'b', label: 'Back' },
        { btn: 'start', label: 'Start Game' }
      ];
    }
    // Combat
    else if (inCombat && !hasModal) {
      if (hasPending) {
        prompts = [
          { btn: 'dpad', label: 'Target' },
          { btn: 'a', label: 'Confirm' },
          { btn: 'b', label: 'Cancel' },
          { btn: 'x', label: 'Auto' }
        ];
      } else {
        prompts = [
          { btn: 'rs', label: 'Char' },
          { btn: 'ls', label: 'Sigil' },
          { btn: 'a', label: 'Select' },
          { btn: 'select', label: 'Switch' },
          { btn: 'y', label: 'Info' },
          { btn: 'start', label: 'Menu' }
        ];
      }
    }
    // Death screen
    else if (isDeathScreen) {
      prompts = [
        { btn: 'dpad', label: 'Browse' },
        { btn: 'a', label: 'Purchase' },
        { btn: 'b', label: 'Leave' },
        { btn: 'y', label: 'Info' }
      ];
    }
    // Neutral encounters
    else if (isNeutralScreen) {
      prompts = [
        { btn: 'dpad', label: 'Choose' },
        { btn: 'a', label: 'Select' },
        { btn: 'b', label: 'Skip' }
      ];
    }
    // Level up
    else if (isLevelUp) {
      prompts = [
        { btn: 'dpad', label: 'Choose' },
        { btn: 'a', label: 'Select' },
        { btn: 'b', label: 'Skip' }
      ];
    }
    // Modal/popup (FAQ, Sigilarium, etc.)
    else if (hasModal) {
      const isScrollable = hasModal.scrollHeight > hasModal.clientHeight;
      prompts = [
        { btn: 'dpad', label: 'Navigate' },
        { btn: 'a', label: 'Confirm' },
        { btn: 'b', label: 'Close' }
      ];
      if (isScrollable) {
        prompts.push({ btn: 'lb', label: '↑Scroll' });
        prompts.push({ btn: 'rb', label: 'Scroll↓' });
      }
    }
    // Default
    else {
      prompts = [
        { btn: 'dpad', label: 'Navigate' },
        { btn: 'a', label: 'Select' },
        { btn: 'b', label: 'Back' },
        { btn: 'start', label: 'Menu' }
      ];
    }

    // Build HTML
    promptsEl.innerHTML = prompts.map(p => {
      const displayLabel = {
        'dpad': '✚',
        'ls': '🕹L',
        'rs': '🕹R',
        'lb': 'LB',
        'rb': 'RB',
        'lt': 'LT',
        'rt': 'RT',
        'start': '☰',
        'x': 'X',
        'y': 'Y',
        'select': '⊡',
        'a': 'Ⓐ',
        'b': 'Ⓑ'
      }[p.btn] || p.btn.toUpperCase();

      return `<div class="controller-prompt"><span class="controller-btn ${p.btn}">${displayLabel}</span> ${p.label}</div>`;
    }).join('');
  },

  // Show helpful setup guide for Steam Deck users when no gamepad is detected
  showSteamControllerSetupHelp() {
    // Check if this looks like it might be Steam Deck or similar (touch events available)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLinux = navigator.userAgent.toLowerCase().includes('linux');
    const isSteamDeckLikely = isTouchDevice && isLinux;

    if (!isTouchDevice && !isSteamDeckLikely) {
      console.log('[GAMEPAD] Not showing setup help - not a touch device or Steam Deck');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'tutorial-modal-backdrop';
    overlay.innerHTML = `
<div class="tutorial-modal" style="max-width:480px">
<h2 style="font-size:1.4rem;margin-bottom:1rem;text-align:center;color:#f59e0b">🎮 Controller Ready!</h2>
<p style="font-size:0.95rem;line-height:1.5;margin-bottom:0.75rem;text-align:center">
Controller support is enabled! Quick reference:
</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1rem;font-size:0.85rem">
<div style="padding:0.5rem;background:rgba(34,197,94,0.15);border-radius:6px;text-align:center">
<strong style="color:#86efac">D-Pad / Sticks</strong><br/>
<span style="color:#e5e7eb">Navigate</span>
</div>
<div style="padding:0.5rem;background:rgba(34,197,94,0.15);border-radius:6px;text-align:center">
<strong style="color:#86efac">A Button</strong><br/>
<span style="color:#e5e7eb">Confirm / Select</span>
</div>
<div style="padding:0.5rem;background:rgba(96,165,250,0.15);border-radius:6px;text-align:center">
<strong style="color:#93c5fd">B Button</strong><br/>
<span style="color:#e5e7eb">Back / Cancel</span>
</div>
<div style="padding:0.5rem;background:rgba(96,165,250,0.15);border-radius:6px;text-align:center">
<strong style="color:#93c5fd">START (☰)</strong><br/>
<span style="color:#e5e7eb">Menu</span>
</div>
</div>
${isSteamDeckLikely ? `
<div style="background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.3);border-radius:6px;padding:0.75rem;margin-bottom:1rem">
<p style="font-size:0.85rem;color:#93c5fd;margin-bottom:0.5rem"><strong>🎮 Steam Deck Tip:</strong></p>
<p style="font-size:0.8rem;color:#e5e7eb;line-height:1.4">
If buttons aren't responding, try pressing any button a few times - Steam Deck's browser sometimes needs a moment to detect the controller. You can also use the <strong>touchscreen</strong> or <strong>keyboard fallback</strong> (Arrow keys + Enter).
</p>
</div>
` : ''}
<p style="font-size:0.8rem;text-align:center;opacity:0.7;margin-bottom:1rem">
Press <strong>START (☰)</strong> anytime for settings and controls guide
</p>
<div style="display:flex;gap:0.75rem;justify-content:center">
<button class="btn" onclick="dismissSteamSetupHelp()" style="background:#22c55e;padding:0.6rem 1.2rem">Got it!</button>
<button class="btn" onclick="forceActivateController()" style="background:#3b82f6;padding:0.6rem 1.2rem">Force Enable</button>
</div>
</div>`;
    document.body.appendChild(overlay);
  }
};

// Global function to force activate controller mode (for Steam Deck troubleshooting)
function forceActivateController() {
  const overlay = document.querySelector('.tutorial-modal-backdrop');
  if (overlay) overlay.remove();

  // Force activate controller mode even without detected gamepad
  GamepadController.active = true;
  document.body.classList.add('controller-active');
  GamepadController.updateFocusableElements();
  if (GamepadController.focusableElements.length > 0) {
    const bestFocus = GamepadController.findBestDefaultFocus();
    GamepadController.setFocus(bestFocus || GamepadController.focusableElements[0]);
  }
  GamepadController.updatePrompts();

  toast('🎮 Controller mode force-enabled! Use D-pad/sticks to navigate.', 2500);

  // Mark as shown
  if (typeof S !== 'undefined') {
    S.tutorialFlags.steam_controller_setup = true;
    if (typeof savePermanent === 'function') savePermanent();
  }
}

// Global function to dismiss the Steam setup help
function dismissSteamSetupHelp() {
  const overlay = document.querySelector('.tutorial-modal-backdrop');
  if (overlay) overlay.remove();

  // Mark as shown so it doesn't appear again
  if (typeof S !== 'undefined') {
    S.tutorialFlags.steam_controller_setup = true;
    if (typeof savePermanent === 'function') savePermanent();
  }
}

