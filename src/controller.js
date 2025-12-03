// ===== STEAM DECK / CONTROLLER SUPPORT SYSTEM =====
const GamepadController = {
  // State
  active: false,
  gamepadIndex: null,
  focusedElement: null,
  focusableElements: [],
  lastInputTime: 0,
  inputCooldown: 150, // ms between inputs to prevent rapid-fire
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
  mouseMovementThreshold: 15, // Minimum pixels to move before switching to mouse mode

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
    console.log('[GAMEPAD] Initializing controller support...');

    // Check if controller support is disabled
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      console.log('[GAMEPAD] Controller support disabled by user setting');
      return;
    }

    // Check if gamepad API is available
    if (!navigator.getGamepads) {
      console.log('[GAMEPAD] Gamepad API not available in this browser');
      return;
    }

    // Listen for gamepad connections
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[GAMEPAD] gamepadconnected event fired!');
      this.onGamepadConnected(e);
    });
    window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));

    // Check for already-connected gamepads (Steam Deck may have controller pre-connected)
    const gamepads = navigator.getGamepads();
    console.log('[GAMEPAD] Checking for pre-connected gamepads:', gamepads.length, 'slots');
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        console.log('[GAMEPAD] Found pre-connected gamepad at index', i, ':', gp.id);
        this.onGamepadConnected({ gamepad: gp });
        break;
      }
    }

    // CRITICAL: Steam Deck fix - Start continuous polling regardless of event
    // Steam Deck's gamepad may not fire 'gamepadconnected' event but still be available
    // Poll every 500ms to check for newly available gamepads
    this.gamepadCheckInterval = setInterval(() => this.checkForGamepads(), 500);
    console.log('[GAMEPAD] Started continuous gamepad check interval');

    // Also start the main polling loop immediately - it will no-op if no gamepad
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this.poll(), 16);
      console.log('[GAMEPAD] Started main polling loop (will activate when gamepad found)');
    }

    // Switch to mouse mode on significant sustained mouse movement
    // NOTE: Don't deactivate on click - Steam Deck touchscreen generates clicks
    // and we want controller mode to persist even when occasionally tapping screen
    document.addEventListener('mousemove', (e) => {
      // Only deactivate on significant mouse movement (not just hover or small jitter)
      if (this.lastMouseX === null) {
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        return;
      }
      const dx = Math.abs(e.clientX - this.lastMouseX);
      const dy = Math.abs(e.clientY - this.lastMouseY);
      // Require more significant movement (50px) before switching to mouse mode
      if (dx > 50 || dy > 50) {
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.deactivateControllerMode();
      }
    });
    // Don't deactivate on click - let controller mode persist
  },

  // Continuously check for gamepads (Steam Deck fix)
  checkForGamepads() {
    if (this.gamepadIndex !== null) return; // Already have a gamepad

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        console.log('[GAMEPAD] Found gamepad via polling at index', i, ':', gp.id);
        console.log('[GAMEPAD] Buttons:', gp.buttons.length, 'Axes:', gp.axes.length);
        this.gamepadIndex = i;
        this.activateControllerMode();
        toast('🎮 Controller detected! Use D-pad to navigate.', 2500);
        return;
      }
    }
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
      this.setFocus(this.focusableElements[0]);
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

  // Main polling loop
  poll() {
    // Try to find a gamepad if we don't have one
    if (this.gamepadIndex === null) {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          this.gamepadIndex = i;
          console.log('[GAMEPAD] Poll found gamepad at index', i);
          this.activateControllerMode();
          break;
        }
      }
      if (this.gamepadIndex === null) return;
    }

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) {
      // Gamepad disconnected
      this.gamepadIndex = null;
      return;
    }

    const now = Date.now();

    // Check buttons ALWAYS (don't skip due to cooldown - we need to track state)
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed || gp.buttons[i].value > 0.5;
      const wasPressed = this.buttonStates[i] || false;

      if (pressed && !wasPressed) {
        // Only process if cooldown elapsed
        if (now - this.lastInputTime >= this.inputCooldown) {
          console.log('[GAMEPAD] Button', i, 'pressed!');
          this.onButtonPress(i);
          this.lastInputTime = now;
        }
      }

      this.buttonStates[i] = pressed;
    }

    // Check analog sticks (left stick for navigation)
    const leftX = gp.axes[0] || 0;
    const leftY = gp.axes[1] || 0;

    if (Math.abs(leftX) > this.axisDeadzone || Math.abs(leftY) > this.axisDeadzone) {
      if (now - this.lastInputTime >= this.inputCooldown) {
        // Determine primary direction
        if (Math.abs(leftX) > Math.abs(leftY)) {
          this.onDirection(leftX > 0 ? 'right' : 'left');
        } else {
          this.onDirection(leftY > 0 ? 'down' : 'up');
        }
        this.lastInputTime = now;
      }
    }
  },

  onButtonPress(buttonIndex) {
    console.log('[GAMEPAD] onButtonPress called with button:', buttonIndex);

    // Activate controller mode on any button press
    if (!this.active) {
      this.activateControllerMode();
    }

    switch (buttonIndex) {
      case this.BUTTONS.A:
        this.confirmSelection();
        break;
      case this.BUTTONS.B:
        this.goBack();
        break;
      case this.BUTTONS.Y:
        this.toggleTooltip(); // Y = toggle tooltip on focused element
        break;
      case this.BUTTONS.START:
        this.openMenu(); // Start = open settings menu
        break;
      case this.BUTTONS.DPAD_UP:
        this.onDirection('up');
        break;
      case this.BUTTONS.DPAD_DOWN:
        this.onDirection('down');
        break;
      case this.BUTTONS.DPAD_LEFT:
        this.onDirection('left');
        break;
      case this.BUTTONS.DPAD_RIGHT:
        this.onDirection('right');
        break;
      case this.BUTTONS.LB:
        this.cycleUnit('prev'); // LB = previous unit (hero/enemy)
        break;
      case this.BUTTONS.RB:
        this.cycleUnit('next'); // RB = next unit (hero/enemy)
        break;
      case this.BUTTONS.LT:
        this.cycleSigil('prev'); // LT = previous sigil on focused unit
        break;
      case this.BUTTONS.RT:
        this.cycleSigil('next'); // RT = next sigil on focused unit
        break;
    }
  },

  onDirection(dir) {
    if (!this.active) {
      this.activateControllerMode();
      return;
    }

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) return;

    // Play navigation sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    if (!this.focusedElement || !document.body.contains(this.focusedElement)) {
      // No focus or element removed - focus first element
      this.setFocus(this.focusableElements[0]);
      return;
    }

    // Find next element in direction using spatial navigation
    const next = this.findNextElement(dir);
    if (next) {
      this.setFocus(next);
    }
  },

  findNextElement(dir) {
    if (!this.focusedElement) return this.focusableElements[0];

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
    if (!this.focusedElement) {
      this.updateFocusableElements();
      if (this.focusableElements.length > 0) {
        this.setFocus(this.focusableElements[0]);
      }
      return;
    }

    // Play confirm sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Trigger click on focused element
    this.focusedElement.click();

    // Update focus after action (DOM might have changed)
    setTimeout(() => {
      this.updateFocusableElements();
      if (this.focusableElements.length > 0 && !document.body.contains(this.focusedElement)) {
        this.setFocus(this.focusableElements[0]);
      }
      this.updatePrompts();
    }, 100);
  },

  goBack() {
    // Play back sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Check for confirm modal (B button cancels)
    if (typeof confirmModalCallback === 'function') {
      confirmModalCallback();
      return;
    }

    // Check for modal/menu close buttons
    const closeBtn = document.querySelector('.modal-container .btn[onclick*="close"]') ||
                     document.querySelector('.modal-container .btn[onclick*="Close"]') ||
                     document.querySelector('[onclick*="closeSettingsMenu"]') ||
                     document.querySelector('[onclick*="closeDebugMenu"]');

    if (closeBtn) {
      closeBtn.click();
      setTimeout(() => this.updateFocusableElements(), 100);
      return;
    }

    // Check for cancel button
    const cancelBtn = document.querySelector('.btn[onclick*="cancel"]') ||
                      document.querySelector('.btn[onclick*="Cancel"]') ||
                      document.querySelector('.btn.secondary[onclick*="Back"]');

    if (cancelBtn) {
      cancelBtn.click();
      setTimeout(() => this.updateFocusableElements(), 100);
      return;
    }

    // If in combat with pending action, call cancelAction
    if (typeof S !== 'undefined' && S.pending && typeof cancelAction === 'function') {
      cancelAction();
      setTimeout(() => this.updateFocusableElements(), 100);
    }
  },

  openMenu() {
    // Play menu sound
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Open settings menu
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

  // Toggle tooltip on focused element (Y button)
  toggleTooltip() {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // If tooltip is already visible, hide it
    if (this.tooltipVisible) {
      if (typeof hideTooltip === 'function') {
        hideTooltip();
      }
      if (this.tooltipElement) {
        this.tooltipElement.classList.remove('controller-tooltip-active');
      }
      this.tooltipVisible = false;
      this.tooltipElement = null;
      return;
    }

    // Try to show tooltip for focused element
    if (!this.focusedElement) return;

    // Check if focused element is a sigil or has tooltip data
    const sigilEl = this.focusedElement.classList.contains('sigil') ? this.focusedElement :
                    this.focusedElement.querySelector('.sigil');

    if (sigilEl) {
      // Extract sigil name from the element's onmouseenter or data
      const mouseEnter = sigilEl.getAttribute('onmouseenter');
      if (mouseEnter) {
        const match = mouseEnter.match(/showTooltip\('([^']+)'/);
        if (match && typeof showTooltip === 'function') {
          const sigilName = match[1];
          // Extract level if present
          const levelMatch = mouseEnter.match(/,\s*(\d+)\)/);
          const level = levelMatch ? parseInt(levelMatch[1]) : undefined;
          showTooltip(sigilName, sigilEl, level);
          this.tooltipVisible = true;
          this.tooltipElement = sigilEl;
          sigilEl.classList.add('controller-tooltip-active');
          return;
        }
      }
    }

    // Check for card with sigils (show first sigil's tooltip)
    const cardSigil = this.focusedElement.querySelector('.sigil');
    if (cardSigil) {
      const mouseEnter = cardSigil.getAttribute('onmouseenter');
      if (mouseEnter) {
        const match = mouseEnter.match(/showTooltip\('([^']+)'/);
        if (match && typeof showTooltip === 'function') {
          showTooltip(match[1], cardSigil);
          this.tooltipVisible = true;
          this.tooltipElement = cardSigil;
          cardSigil.classList.add('controller-tooltip-active');
        }
      }
    }
  },

  // Cycle between units: heroes and enemies (LB/RB)
  cycleUnit(direction) {
    if (typeof SoundFX !== 'undefined' && SoundFX.play) {
      SoundFX.play('click');
    }

    // Hide any active tooltip when switching units
    if (this.tooltipVisible) {
      if (typeof hideTooltip === 'function') hideTooltip();
      if (this.tooltipElement) this.tooltipElement.classList.remove('controller-tooltip-active');
      this.tooltipVisible = false;
      this.tooltipElement = null;
    }

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

    setTimeout(() => {
      this.updateFocusableElements();

      // Try to restore by ID
      if (this.lastFocusedId) {
        const el = document.getElementById(this.lastFocusedId);
        if (el && this.focusableElements.includes(el)) {
          this.setFocus(el);
          return;
        }
      }

      // Fallback to first focusable
      if (this.focusableElements.length > 0) {
        this.setFocus(this.focusableElements[0]);
      }

      this.updatePrompts();
    }, 50);
  },

  updateFocusableElements() {
    // Find all focusable elements in order of appearance
    const selectors = [
      // Buttons
      '.btn:not(.disabled)',
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
      // Generic clickable elements
      '[onclick]:not(script)',
      // Links
      'a[href]'
    ];

    const elements = new Set();

    for (const selector of selectors) {
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
  },

  updatePrompts() {
    const promptsEl = document.getElementById('controllerPrompts');
    if (!promptsEl) return;

    // Determine context and update prompts
    const hasModal = document.querySelector('.modal-container');
    const inCombat = typeof S !== 'undefined' && S.heroes && S.enemies && S.enemies.length > 0;
    const hasPending = typeof S !== 'undefined' && S.pending;
    const hasCards = document.querySelectorAll('.card').length > 0;

    let prompts = [
      { btn: 'dpad', label: 'Move' },
      { btn: 'a', label: 'Select' }
    ];

    if (hasModal) {
      prompts.push({ btn: 'b', label: 'Close' });
    } else if (hasPending) {
      prompts.push({ btn: 'b', label: 'Cancel' });
    } else {
      prompts.push({ btn: 'b', label: 'Back' });
    }

    // Y = tooltip (only show when cards/sigils visible)
    if (hasCards || inCombat) {
      prompts.push({ btn: 'y', label: 'Tooltip' });
    }

    // Start = menu
    prompts.push({ btn: 'start', label: 'Menu' });

    // Combat-specific controls
    if (inCombat && !hasModal) {
      prompts.push({ btn: 'lb', label: '←Unit' });
      prompts.push({ btn: 'rb', label: 'Unit→' });
      prompts.push({ btn: 'lt', label: '←Sigil' });
      prompts.push({ btn: 'rt', label: 'Sigil→' });
    }

    // Build HTML
    promptsEl.innerHTML = prompts.map(p => {
      const btnClass = p.btn;
      const displayLabel = {
        'dpad': 'D-Pad',
        'lb': 'LB',
        'rb': 'RB',
        'lt': 'LT',
        'rt': 'RT',
        'start': '☰'
      }[p.btn] || p.btn.toUpperCase();

      return `<div class="controller-prompt"><span class="controller-btn ${btnClass}">${displayLabel}</span> ${p.label}</div>`;
    }).join('');
  }
};

