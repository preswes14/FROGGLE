// ===== GAMECONTROLLER.JS LIBRARY (MIT License) =====
// https://github.com/alvaromontoro/gamecontroller.js - v1.5.0
(()=>{"use strict";const t=(t,e="log")=>{"error"===e?console&&"function"==typeof console.error&&console.error(t):console&&"function"==typeof console.info&&console.info(t)},e=e=>t(e,"error"),n=()=>navigator.getGamepads&&"function"==typeof navigator.getGamepads||navigator.getGamepads&&"function"==typeof navigator.webkitGetGamepads||!1,o="Invalid property.",i="Invalid value. It must be a number between 0.00 and 1.00.",s="Button does not exist.",a="Unknown event name.",c=function(t){let n={id:t.index,buttons:t.buttons.length,axes:Math.floor(t.axes.length/2),axeValues:[],axeThreshold:[1],hapticActuator:null,vibrationMode:-1,vibration:!1,mapping:t.mapping,buttonActions:{},axesActions:{},pressed:{},set:function(t,n){if(["axeThreshold"].indexOf(t)>=0){if("axeThreshold"===t&&(!parseFloat(n)||n<0||n>1))return void e(i);this[t]=n}else e(o)},vibrate:function(t=.75,e=500){if(this.hapticActuator)switch(this.vibrationMode){case 0:return this.hapticActuator.pulse(t,e);case 1:return this.hapticActuator.playEffect("dual-rumble",{duration:e,strongMagnitude:t,weakMagnitude:t})}},triggerDirectionalAction:function(t,e,n,o,i){n&&o%2===i?(this.pressed[`${t}${e}`]||(this.pressed[`${t}${e}`]=!0,this.axesActions[e][t].before()),this.axesActions[e][t].action()):this.pressed[`${t}${e}`]&&o%2===i&&(delete this.pressed[`${t}${e}`],this.axesActions[e][t].after())},checkStatus:function(){let t={};const e=navigator.getGamepads?navigator.getGamepads():navigator.webkitGetGamepads?navigator.webkitGetGamepads():[];if(e.length){if(t=e[this.id],t.buttons)for(let e=0;e<this.buttons;e++)!0===t.buttons[e].pressed?(this.pressed[`button${e}`]||(this.pressed[`button${e}`]=!0,this.buttonActions[e].before()),this.buttonActions[e].action()):this.pressed[`button${e}`]&&(delete this.pressed[`button${e}`],this.buttonActions[e].after());if(t.axes){const e=t.axes.length%2;for(let n=0;n<2*this.axes;n++){const o=t.axes[n+e].toFixed(4),i=Math.floor(n/2);this.axeValues[i][n%2]=o,this.triggerDirectionalAction("right",i,o>=this.axeThreshold[0],n,0),this.triggerDirectionalAction("left",i,o<=-this.axeThreshold[0],n,0),this.triggerDirectionalAction("down",i,o>=this.axeThreshold[0],n,1),this.triggerDirectionalAction("up",i,o<=-this.axeThreshold[0],n,1)}}}},associateEvent:function(t,n,o){if(t.match(/^button\d+$/)){const i=parseInt(t.match(/^button(\d+)$/)[1]);i>=0&&i<this.buttons?this.buttonActions[i][o]=n:e(s)}else if("start"===t)this.buttonActions[9][o]=n;else if("select"===t)this.buttonActions[8][o]=n;else if("r1"===t)this.buttonActions[5][o]=n;else if("r2"===t)this.buttonActions[7][o]=n;else if("l1"===t)this.buttonActions[4][o]=n;else if("l2"===t)this.buttonActions[6][o]=n;else if("power"===t)this.buttons>=17?this.buttonActions[16][o]=n:e(s);else if(t.match(/^(up|down|left|right)(\d+)$/)){const i=t.match(/^(up|down|left|right)(\d+)$/),a=i[1],c=parseInt(i[2]);c>=0&&c<this.axes?this.axesActions[c][a][o]=n:e(s)}else if(t.match(/^(up|down|left|right)$/)){const e=t.match(/^(up|down|left|right)$/)[1];this.axesActions[0][e][o]=n}return this},on:function(t,e){return this.associateEvent(t,e,"action")},off:function(t){return this.associateEvent(t,(function(){}),"action")},after:function(t,e){return this.associateEvent(t,e,"after")},before:function(t,e){return this.associateEvent(t,e,"before")}};for(let t=0;t<n.buttons;t++)n.buttonActions[t]={action:()=>{},after:()=>{},before:()=>{}};for(let t=0;t<n.axes;t++)n.axesActions[t]={down:{action:()=>{},after:()=>{},before:()=>{}},left:{action:()=>{},after:()=>{},before:()=>{}},right:{action:()=>{},after:()=>{},before:()=>{}},up:{action:()=>{},after:()=>{},before:()=>{}}},n.axeValues[t]=[0,0];return t.hapticActuators?"function"==typeof t.hapticActuators.pulse?(n.hapticActuator=t.hapticActuators,n.vibrationMode=0,n.vibration=!0):t.hapticActuators[0]&&"function"==typeof t.hapticActuators[0].pulse&&(n.hapticActuator=t.hapticActuators[0],n.vibrationMode=0,n.vibration=!0):t.vibrationActuator&&"function"==typeof t.vibrationActuator.playEffect&&(n.hapticActuator=t.vibrationActuator,n.vibrationMode=1,n.vibration=!0),n},r={gamepads:{},axeThreshold:[1],isReady:n(),onConnect:function(){},onDisconnect:function(){},onBeforeCycle:function(){},onAfterCycle:function(){},getGamepads:function(){return this.gamepads},getGamepad:function(t){return this.gamepads[t]?this.gamepads[t]:null},set:function(t,n){if(["axeThreshold"].indexOf(t)>=0){if("axeThreshold"===t&&(!parseFloat(n)||n<0||n>1))return void e(i);if(this[t]=n,"axeThreshold"===t){const t=this.getGamepads(),e=Object.keys(t);for(let n=0;n<e.length;n++)t[e[n]].set("axeThreshold",this.axeThreshold)}}else e(o)},checkStatus:function(){const t=window.requestAnimationFrame||window.webkitRequestAnimationFrame,e=Object.keys(r.gamepads);r.onBeforeCycle();for(let t=0;t<e.length;t++)r.gamepads[e[t]].checkStatus();r.onAfterCycle(),e.length>0&&t(r.checkStatus)},init:function(){window.addEventListener("gamepadconnected",(e=>{const n=e.gamepad||e.detail.gamepad;if(t("Gamepad detected."),window.gamepads||(window.gamepads={}),n){if(!window.gamepads[n.index]){window.gamepads[n.index]=n;const t=c(n);t.set("axeThreshold",this.axeThreshold),this.gamepads[t.id]=t,this.onConnect(this.gamepads[t.id])}1===Object.keys(this.gamepads).length&&this.checkStatus()}})),window.addEventListener("gamepaddisconnected",(e=>{const n=e.gamepad||e.detail.gamepad;t("Gamepad disconnected."),n&&(delete window.gamepads[n.index],delete this.gamepads[n.index],this.onDisconnect(n.index))}))},on:function(t,n){switch(t){case"connect":this.onConnect=n;break;case"disconnect":this.onDisconnect=n;break;case"beforeCycle":case"beforecycle":this.onBeforeCycle=n;break;case"afterCycle":case"aftercycle":this.onAfterCycle=n;break;default:e(a)}return this},off:function(t){switch(t){case"connect":this.onConnect=function(){};break;case"disconnect":this.onDisconnect=function(){};break;case"beforeCycle":case"beforecycle":this.onBeforeCycle=function(){};break;case"afterCycle":case"aftercycle":this.onAfterCycle=function(){};break;default:e(a)}return this}};r.init();const h=r;n()?window.gameControl=h:e("Your web browser does not support the Gamepad API.")})();

// ===== FROGGLE CONTROLLER WRAPPER =====
// Clean wrapper around gamecontroller.js for game-specific logic

const GamepadController = {
  // State
  active: false,
  focusedElement: null,
  focusableElements: [],
  lastFocusedId: null,
  currentGamepad: null,

  // Initialize controller system
  init() {
    debugLog('[GAMEPAD] Initializing controller support...');

    // Check if disabled
    if (typeof S !== 'undefined' && S.controllerDisabled) {
      debugLog('[GAMEPAD] Controller support disabled');
      return;
    }

    // Always set up keyboard (works as fallback, Steam can map controller to keyboard)
    this.initKeyboard();

    // Check if gameControl library loaded
    if (typeof gameControl === 'undefined') {
      debugLog('[GAMEPAD] gameControl not available, keyboard only');
      return;
    }

    // Configure stick sensitivity
    gameControl.set('axeThreshold', 0.4);

    // Handle controller connection
    gameControl.on('connect', gp => {
      debugLog('[GAMEPAD] Connected:', gp.id);
      this.currentGamepad = gp;
      this.setupGamepad(gp);
      this.activate();
      toast('🎮 Controller connected!', 2000);
    });

    gameControl.on('disconnect', () => {
      debugLog('[GAMEPAD] Disconnected');
      this.currentGamepad = null;
      // Don't deactivate - keep focus visible for keyboard
    });

    debugLog('[GAMEPAD] Initialization complete');
  },

  // Set up button bindings for a gamepad
  setupGamepad(gp) {
    // A button (0) - Confirm/Select
    gp.before('button0', () => this.handleA());

    // B button (1) - Back/Cancel
    gp.before('button1', () => this.handleB());

    // X button (2) - Auto-target
    gp.before('button2', () => this.handleX());

    // Y button (3) - Toggle tooltip
    gp.before('button3', () => this.handleY());

    // LB (4) - Cycle units prev / page up
    gp.before('l1', () => this.handleLB());

    // RB (5) - Cycle units next / page down
    gp.before('r1', () => this.handleRB());

    // LT (6) - Cycle sigils prev
    gp.before('l2', () => this.handleLT());

    // RT (7) - Cycle sigils next
    gp.before('r2', () => this.handleRT());

    // Select (8) - Switch sides
    gp.before('select', () => this.handleSelect());

    // Start (9) - Menu
    gp.before('start', () => this.handleStart());

    // D-pad (12-15)
    gp.before('button12', () => this.handleDirection('up'));
    gp.before('button13', () => this.handleDirection('down'));
    gp.before('button14', () => this.handleDirection('left'));
    gp.before('button15', () => this.handleDirection('right'));

    // Left stick
    gp.before('up', () => this.handleDirection('up'));
    gp.before('down', () => this.handleDirection('down'));
    gp.before('left', () => this.handleDirection('left'));
    gp.before('right', () => this.handleDirection('right'));
  },

  // Keyboard fallback
  initKeyboard() {
    document.addEventListener('keydown', e => {
      if (typeof S !== 'undefined' && S.controllerDisabled) return;

      // Ignore if typing in an input
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
          if (e.shiftKey) {
            this.handleDirection('left');
          } else {
            this.handleDirection('right');
          }
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        if (!this.active) this.activate();
      }
    }, true);
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
    debugLog('[GAMEPAD] Activated');
  },

  // Deactivate controller mode
  deactivate() {
    if (!this.active) return;
    this.active = false;
    document.body.classList.remove('controller-active');
    this.clearFocus();
    debugLog('[GAMEPAD] Deactivated');
  },

  // ===== CONTEXT DETECTION =====

  getContext() {
    // Check for blocking overlays
    const tutorialModal = document.querySelector('.tutorial-modal-backdrop');
    if (tutorialModal) return 'tutorial';

    const confirmModal = document.querySelector('.confirm-modal-container');
    if (confirmModal) return 'confirm';

    if (typeof S !== 'undefined' && S.suspended) return 'suspend';

    // Check for modals
    const modal = document.querySelector('.modal-container');
    if (modal && getComputedStyle(modal).display !== 'none') return 'modal';

    // Check game state
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

    // Try clicking focused element
    if (this.focusedElement) {
      // Check for onclick attribute
      if (this.focusedElement.hasAttribute('onclick')) {
        this.focusedElement.click();
        return;
      }
      // Check for clickable child
      const clickable = this.focusedElement.querySelector('[onclick], button, .btn');
      if (clickable) {
        clickable.click();
        return;
      }
      // Try native click
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
      // Close modal
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
      // Cancel targeting
      S.pending = null;
      S.targets = [];
      if (typeof render === 'function') render();
      return;
    }
  },

  handleX() {
    if (!this.active) return;
    this.playClick();

    const ctx = this.getContext();
    if (ctx !== 'combat' && ctx !== 'targeting') return;

    // If focused on a sigil, activate it then auto-target
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

    // Just auto-target
    this.autoTarget();
  },

  handleY() {
    if (!this.active) return;

    // Toggle tooltip on focused element
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
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleUnit('prev');
    } else {
      this.scrollPage('up');
    }
  },

  handleRB() {
    this.playClick();
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.cycleUnit('next');
    } else {
      this.scrollPage('down');
    }
  },

  handleLT() {
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.playClick();
      this.cycleSigil('prev');
    }
  },

  handleRT() {
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      this.playClick();
      this.cycleSigil('next');
    }
  },

  handleSelect() {
    this.playClick();
    // Switch between heroes and enemies in targeting
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
    this.playClick();
    if (typeof showSettingsMenu === 'function') {
      showSettingsMenu();
    }
  },

  handleDirection(dir) {
    if (!this.active) {
      this.activate();
      return;
    }

    const ctx = this.getContext();

    // Block during tutorial/suspend
    if (ctx === 'tutorial' || ctx === 'suspend') return;

    // Confirm modal - switch between Yes/No
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

    // Find spatially nearest element in direction
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

      // Check if element is in the right direction
      let inDirection = false;
      switch (dir) {
        case 'up': inDirection = dy < -10; break;
        case 'down': inDirection = dy > 10; break;
        case 'left': inDirection = dx < -10; break;
        case 'right': inDirection = dx > 10; break;
      }

      if (!inDirection) continue;

      // Score: prefer elements more aligned with direction
      const dist = Math.sqrt(dx * dx + dy * dy);
      let perpDist;
      if (dir === 'up' || dir === 'down') {
        perpDist = Math.abs(dx);
      } else {
        perpDist = Math.abs(dy);
      }

      // Weight perpendicular distance heavily to prefer aligned elements
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
      // Must be visible
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;

      // Must have size
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      // Must be in viewport (roughly)
      if (rect.bottom < 0 || rect.top > window.innerHeight + 100) return false;

      return true;
    });
  },

  setFocus(el) {
    if (!el) return;

    // Clear old focus
    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
    }

    // Set new focus
    this.focusedElement = el;
    el.classList.add('controller-focus');

    // Store ID for restoration
    if (el.id) {
      this.lastFocusedId = el.id;
    }

    // Scroll into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  clearFocus() {
    if (this.focusedElement) {
      this.focusedElement.classList.remove('controller-focus');
      this.focusedElement = null;
    }
  },

  findBestDefaultFocus() {
    // Try to restore last focused element
    if (this.lastFocusedId) {
      const el = document.getElementById(this.lastFocusedId);
      if (el && this.focusableElements.includes(el)) {
        return el;
      }
    }

    // In combat, focus active hero or first targetable
    const ctx = this.getContext();
    if (ctx === 'combat' || ctx === 'targeting') {
      const activeHero = document.querySelector('.card.hero.active');
      if (activeHero) return activeHero;

      const targetable = document.querySelector('.card.targetable');
      if (targetable) return targetable;
    }

    // Default to first focusable
    return this.focusableElements[0];
  },

  // Save/restore focus across render()
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
      // Cycle through valid targets
      if (typeof S !== 'undefined') {
        if (['Attack', 'Grapple', 'D20_TARGET'].includes(S.pending)) {
          cards = Array.from(document.querySelectorAll('.card.enemy:not(.dead)'));
        } else {
          cards = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
        }
      }
    } else {
      // Cycle through heroes
      cards = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
    }

    if (!cards || cards.length === 0) return;

    let idx = cards.findIndex(c => c === this.focusedElement || c.contains(this.focusedElement));
    if (idx === -1) idx = 0;
    else idx = dir === 'next' ? (idx + 1) % cards.length : (idx - 1 + cards.length) % cards.length;

    this.setFocus(cards[idx]);
  },

  cycleSigil(dir) {
    // Find sigils on current hero
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

    // Find valid targets
    let targets;
    if (['Attack', 'Grapple', 'D20_TARGET'].includes(S.pending)) {
      targets = Array.from(document.querySelectorAll('.card.enemy:not(.dead)'));
    } else {
      targets = Array.from(document.querySelectorAll('.card.hero:not(.dead)'));
    }

    if (targets.length === 0) return;

    // Click the first valid target
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
    this.deactivate();
    // gamecontroller.js handles its own cleanup
  }
};

// Global helpers for settings
function toggleControllerSupport(enabled) {
  S.controllerDisabled = !enabled;
  if (enabled) {
    toast('🎮 Controller support enabled!', 2000);
    // Re-initialize if needed
    if (typeof gameControl !== 'undefined' && !GamepadController.active) {
      const gps = gameControl.getGamepads();
      const keys = Object.keys(gps);
      if (keys.length > 0) {
        GamepadController.setupGamepad(gps[keys[0]]);
        GamepadController.activate();
      }
    }
  } else {
    toast('Controller support disabled.', 1200);
    GamepadController.deactivate();
  }
  savePermanent();
}

function forceReinitController() {
  S.controllerDisabled = false;
  GamepadController.deactivate();
  GamepadController.init();
  toast('🎮 Controller re-initialized. Press any button.', 2500);
  savePermanent();
  closeSettingsMenu();
}

function toggleControllerDebug() {
  // Simple debug: show gamepad state
  const gps = typeof gameControl !== 'undefined' ? gameControl.getGamepads() : {};
  const keys = Object.keys(gps);
  if (keys.length === 0) {
    toast('No gamepads detected', 2000);
  } else {
    toast(`Gamepads: ${keys.length}, Active: ${GamepadController.active}`, 3000);
  }
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
