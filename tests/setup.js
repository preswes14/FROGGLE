/**
 * FROGGLE Test Setup
 *
 * This file sets up the testing environment for FROGGLE.
 * It mocks browser APIs and provides helpers for testing game logic.
 */

import { beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// ===== MOCK LOCALSTORAGE =====
// A localStorage mock that we can inspect and reset between tests
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] || null;
  }

  // Test helper: get all stored data
  getAllData() {
    return { ...this.store };
  }

  // Test helper: check if a key exists
  hasKey(key) {
    return key in this.store;
  }
}

// Create global localStorage mock
globalThis.mockLocalStorage = new MockLocalStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: globalThis.mockLocalStorage,
  writable: true,
  configurable: true
});

// ===== MOCK AUDIO CONTEXT =====
// SoundFX uses Web Audio API which isn't available in jsdom
globalThis.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    type: 'sine'
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  })),
  createBiquadFilter: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { setValueAtTime: vi.fn() },
    Q: { setValueAtTime: vi.fn() },
    type: 'lowpass'
  })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn()
}));
globalThis.webkitAudioContext = globalThis.AudioContext;

// ===== SETUP DOM =====
// Create minimal DOM structure the game expects
function setupDOM() {
  document.body.innerHTML = `
    <div id="gameView"></div>
    <div id="gameHeader" style="display:none">
      <span id="floor">1</span>
      <span id="round">1</span>
      <span id="roundInfo"></span>
      <span id="locationLabel">Floor</span>
      <span id="gold">0</span>
      <span id="xp">0</span>
      <span id="debugBtn" style="display:none"></span>
    </div>
  `;
}

// ===== LOAD GAME CODE =====
// Load all source files in dependency order
function loadGameCode() {
  const sourceFiles = [
    'src/constants.js',
    'src/sounds.js',
    'src/state.js',
    'src/combat.js',
    'src/neutrals.js',
    'src/screens.js',
    'src/settings.js',
    'src/controller.js',
    // Note: main.js has window.onload which we don't want to auto-execute
  ];

  // Concatenate all source files
  let combinedCode = '';
  for (const file of sourceFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      combinedCode += fs.readFileSync(filePath, 'utf8') + '\n';
    }
  }

  // Convert `let` and `const` declarations at the top level to `var` so they
  // become properties of globalThis when we use eval in global context.
  // This is a simplified approach - we only convert top-level declarations.
  combinedCode = combinedCode
    // Convert let/const to var for top-level declarations
    .replace(/^let\s+/gm, 'var ')
    .replace(/^const\s+/gm, 'var ');

  // Execute in global context using indirect eval
  try {
    const indirectEval = eval;
    indirectEval(combinedCode);
  } catch (e) {
    console.error('Error loading game code:', e.message);
    console.error('Stack:', e.stack);
    throw e;
  }
}

// ===== FRESH STATE =====
// Returns a clean copy of the initial state for comparison
function getFreshState() {
  return {
    heroes: [],
    sig: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
    tempSigUpgrades: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
    sigUpgradeCounts: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
    floor: 1,
    gameMode: 'Standard',
    runNumber: 1,
    currentSlot: null,
    gold: 0,
    xp: 0,
    levelUpCount: 0,
    goingRate: 1,
    runsAttempted: 0,
    startingXP: 0,
    chosenHeroIdx: -1,
  };
}

// ===== RESET STATE =====
// Reset game state to fresh values (call between tests)
function resetGameState() {
  if (typeof globalThis.S !== 'undefined') {
    const fresh = getFreshState();
    Object.assign(globalThis.S, fresh);

    // Also reset transient state
    globalThis.S.activeIdx = -1;
    globalThis.S.acted = [];
    globalThis.S.enemies = [];
    globalThis.S.recruits = [];
    globalThis.S.targets = [];
    globalThis.S.pending = null;
    globalThis.S.round = 1;
    globalThis.S.turn = 'player';
    globalThis.S.combatXP = 0;
    globalThis.S.combatGold = 0;
    globalThis.S.neutralDeck = [];
    globalThis.S.inRibbleton = false;
    globalThis.S.debugMode = false;
    globalThis.S.oopsAll20s = false;
    globalThis.S.animationSpeed = 1;
    globalThis.S.silverKeyHeld = false;

    // Reset persistent flags to defaults for testing
    globalThis.S.hasReachedFloor20 = false;
    globalThis.S.fuUnlocked = false;
    globalThis.S.tapoUnlocked = false;
    globalThis.S.ghostBoysConverted = false;
    globalThis.S.ancientStatueDeactivated = false;
    globalThis.S.pedestal = [];
    globalThis.S.pondHistory = [];
    globalThis.S.questsCompleted = {};
    globalThis.S.questsClaimed = {};
    globalThis.S.questProgress = {
      enemiesKilled: 0,
      totalDamageDealt: 0,
      maxDamageOneAction: 0,
      maxTargetsOneAction: 0,
      lastStandSurvived: false,
      d20Used: false,
      shieldApplied: false,
      healUsed: false,
      grappleUsed: false,
      alphaUsed: false,
      ghostBlocked: false,
      heroesPlayed: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },
      heroWins: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },
      neutralsCompleted: {
        shopkeeper: false, wishingwell: false, treasurechest: false,
        wizard: false, oracle: false, encampment: false,
        gambling: false, ghost: false, royal: false
      },
      enemyTypesDefeated: {
        Goblin: false, Wolf: false, Orc: false, Giant: false,
        'Cave Troll': false, Dragon: false, Flydra: false
      },
      highestFloor: 0,
      totalGoldEarned: 0,
      totalRunsCompleted: 0,
      standardWins: 0,
      fuWins: 0,
      maxRecruitsHeld: 0,
      purchasedUpgrade: false,
      slayerTier: 0,
      goldDiggerTier: 0,
      veteranTier: 0
    };

    // Reset tutorial flags
    for (const key in globalThis.S.tutorialFlags) {
      globalThis.S.tutorialFlags[key] = false;
    }
  }

  // Clear localStorage
  globalThis.mockLocalStorage.clear();
}

// ===== EXPOSE HELPERS =====
globalThis.testHelpers = {
  getFreshState,
  resetGameState,
  getMockStorage: () => globalThis.mockLocalStorage,
};

// ===== INITIAL SETUP =====
// Load game code once before all tests
setupDOM();
loadGameCode();

// ===== SETUP & TEARDOWN =====
// Reset state before each test
beforeEach(() => {
  setupDOM();
  resetGameState();
});

// Cleanup after each test
afterEach(() => {
  // Clear any timers
  vi.clearAllTimers();
});
