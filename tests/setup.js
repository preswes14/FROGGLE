/**
 * Jest Setup File for FROGGLE
 *
 * This file sets up the test environment with browser mocks and game globals
 * that are required for the vanilla JS game code to function in tests.
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn(i => Object.keys(store)[i] || null)
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
if (!window.crypto) {
  window.crypto = {};
}
window.crypto.randomUUID = jest.fn(() => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
});

// Mock SoundFX
global.SoundFX = {
  play: jest.fn(),
  ctx: { state: 'running', resume: jest.fn() }
};

// Mock ProceduralMusic
global.ProceduralMusic = {
  startCombat: jest.fn(),
  startNeutral: jest.fn(),
  stop: jest.fn()
};

// Mock render function (UI update)
global.render = jest.fn();

// Mock toast function (notifications)
global.toast = jest.fn();

// Mock upd function (state update)
global.upd = jest.fn();

// Mock document methods
document.getElementById = jest.fn((id) => {
  // Return a mock element for common game elements
  return {
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn(() => false)
    },
    innerHTML: '',
    textContent: '',
    appendChild: jest.fn(),
    remove: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({ top: 0, left: 0, width: 100, height: 100 }))
  };
});

// Store original document methods for mock restoration
const originalCreateElement = document.createElement.bind(document);
document.createElement = jest.fn((tag) => {
  // Use real createElement so jsdom works correctly
  return originalCreateElement(tag);
});

// document.body is provided by jsdom - just add spy methods if needed
jest.spyOn(document.body, 'appendChild');

// Keep original querySelectorAll/querySelector - they work with jsdom
// Just spy on them for test verification
jest.spyOn(document, 'querySelectorAll');
jest.spyOn(document, 'querySelector');

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));

// Mock setTimeout return value
jest.useFakeTimers();

// Mock animation timings (from constants.js)
global.ANIMATION_TIMINGS = {
  DAMAGE_FLASH: 400,
  ATTACK_SLIDE: 480,
  ATTACK_IMPACT: 190,
  HEAL_FLASH: 480,
  SHIELD_FLASH: 480,
  FADE_TRANSITION: 200,
  FLOOR_INTERSTITIAL: 2000,
  TURN_TRANSITION: 400,
  PHASE_TRANSITION: 300,
  ALPHA_PHASE_START: 500,
  ENEMY_ACTION_DELAY: 400,
  ENEMY_TURN_END: 400,
  ACTION_COMPLETE: 600,
  TOAST_SHORT: 1800,
  TOAST_MEDIUM: 2400,
  TOAST_LONG: 3000,
  TOAST_FADE: 400,
  TOOLTIP_DELAY: 500,
  TOOLTIP_FADE: 200,
  BONUS_TURN_STACK: 300,
  VICTORY_DELAY: 1000,
  DEFEAT_DELAY: 1000,
  TUTORIAL_DELAY: 800,
  FLOATING_NUMBER: 800,
  SCREEN_SHAKE: 300,
  SCREEN_SHAKE_HEAVY: 400,
  CONFETTI_DURATION: 3000,
  COMBO_DISPLAY: 500,
  COUNTER_POP: 300,
  KNOCKOUT: 600
};

// Mock T function (animation speed adjustment)
global.T = jest.fn(baseTime => baseTime);

// Mock tutorial state
global.tutorialState = null;

// Mock savePermanent and trackQuestProgress
global.savePermanent = jest.fn();
global.trackQuestProgress = jest.fn();

// Mock triggerScreenShake
global.triggerScreenShake = jest.fn();

// Mock showTutorialPop
global.showTutorialPop = jest.fn();

// Mock setHeroReaction
global.setHeroReaction = jest.fn();

// Mock triggerHitAnimation and related functions
global.triggerHitAnimation = jest.fn();
global.triggerAttackAnimation = jest.fn();
global.triggerHealAnimation = jest.fn();
global.triggerShieldAnimation = jest.fn();
global.showFloatingNumber = jest.fn();
global.triggerKnockout = jest.fn();
global.triggerEnemyAttackAnimation = jest.fn();

// Mock sigilIconOnly
global.sigilIconOnly = jest.fn(name => `[${name}]`);

// Mock getEnemyDisplayName
global.getEnemyDisplayName = jest.fn(enemy => enemy?.n || '');

// Hero definitions (from constants.js)
global.H = {
  warrior: {n:'Warrior', p:2, h:5, m:5, s:['Attack','D20']},
  tank: {n:'Tank', p:1, h:10, m:10, s:['Attack','Shield','D20']},
  mage: {n:'Mage', p:1, h:5, m:5, s:['Attack','D20','Expand']},
  healer: {n:'Healer', p:1, h:5, m:5, s:['Heal','D20','Expand']},
  tapo: {n:'Tapo', p:1, h:1, m:1, s:['D20']}
};

// Enemy definitions (from constants.js)
global.E = {
  fly: { n:'Fly', p:1, h:2, m:2, goldDrop:0, x:0, pool:[], gainRate:999, startSigils:[{s:'Attack',l:1}] },
  goblin: { n:'Goblin', p:1, h:5, m:5, goldDrop:1, x:2, pool:['Asterisk','Expand','Shield'], maxLevel:1, gainRate:3 },
  wolf: { n:'Wolf', p:2, h:5, m:5, goldDrop:2, x:4, pool:['Asterisk','Expand','Shield','Grapple','Alpha'], maxLevel:1, gainRate:2 },
  orc: { n:'Orc', p:2, h:10, m:10, goldDrop:3, x:6, pool:['Asterisk','Expand','Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:1, gainRate:2, alternating: true, altSigil: {s:'Attack',l:2} },
  giant: { n:'Giant', p:3, h:12, m:12, goldDrop:6, x:12, pool:['Asterisk','Expand','Shield','Grapple','Alpha','Heal','Ghost','Attack'], maxLevel:1, sigilLevels:{Attack:2,Shield:2,Heal:2}, gainRate:1, startSigils:[{s:'Shield',l:1}] },
  caveTroll: { n:'Cave Troll', p:4, h:15, m:15, goldDrop:10, x:15, pool:['Expand','Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:2, gainRate:1, rage: true, ragePattern: [1,2,3] },
  dragon: { n:'Dragon', p:5, h:20, m:20, goldDrop:20, x:25, pool:['Expand','Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:2, gainRate:1, drawsPerTurn:1, permSigils:[{s:'Attack',l:2},{s:'Expand',l:1}] },
  flydra: { n:'Flydra', p:5, h:25, m:25, goldDrop:0, x:50, pool:['Shield','Grapple','Alpha','Heal','Ghost'], maxLevel:2, gainRate:1, isFlydra:true, permSigils:[{s:'Attack',l:2},{s:'Expand',l:2}] }
};

// Initialize default game state (from state.js)
global.S = {
  heroes: [],
  sig: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
  tempSigUpgrades: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
  sigUpgradeCounts: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
  floor: 1,
  gameMode: 'Standard',
  runNumber: 1,
  currentSlot: 1,
  gold: 0,
  xp: 0,
  levelUpCount: 0,
  goingRate: 1,
  runsAttempted: 0,
  startingXP: 0,
  chosenHeroIdx: -1,
  activeIdx: -1,
  acted: [],
  locked: false,
  pending: null,
  targets: [],
  currentInstanceTargets: [],
  instancesRemaining: 0,
  totalInstances: 0,
  lastActions: {},
  enemies: [],
  recruits: [],
  round: 1,
  turn: 'player',
  combatXP: 0,
  combatGold: 0,
  selectingEncampmentTargets: false,
  encampmentEarlyKills: 0,
  d20HeroIdx: -1,
  grappleRepeats: 0,
  grappleLevel: 0,
  turnDamage: 0,
  neutralDeck: [],
  lastNeutral: null,
  ambushed: false,
  silverKeyHeld: false,
  oracleHero: null,
  oracleRoll: null,
  oracleStat: null,
  wizardSigil: null,
  ancientStatueDeactivated: false,
  ghostBoysConverted: false,
  pedestal: [],
  hasAncientStatuette: false,
  hasReachedFloor20: false,
  fuUnlocked: false,
  forcedFUEntry: false,
  tapoUnlocked: false,
  pondHistory: [],
  questsCompleted: {},
  questsClaimed: {},
  questProgress: {
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
    neutralsCompleted: {},
    enemyTypesDefeated: {},
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
  },
  toastHistory: [],
  toastLogLocked: false,
  toastLogVisible: true,
  tooltipsDisabled: false,
  helpTipsDisabled: false,
  animationSpeed: 1,
  controllerDisabled: false,
  inRibbleton: false,
  debugMode: false,
  oopsAll20s: false,
  tutorialFlags: {},
  usedDeathQuotes: [],
  suspended: false,
  lastAutosave: 0,
  inCombat: false,
  combatEnding: false
};

// Helper to reset state between tests
global.resetGameState = () => {
  Object.assign(S, {
    heroes: [],
    sig: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
    tempSigUpgrades: {Attack:0, Shield:0, Heal:0, D20:0, Expand:0, Grapple:0, Ghost:0, Asterisk:0, Star:0, Alpha:0},
    floor: 1,
    gameMode: 'Standard',
    gold: 0,
    xp: 0,
    activeIdx: -1,
    acted: [],
    locked: false,
    pending: null,
    targets: [],
    currentInstanceTargets: [],
    instancesRemaining: 0,
    totalInstances: 0,
    enemies: [],
    recruits: [],
    round: 1,
    turn: 'player',
    combatXP: 0,
    combatGold: 0,
    turnDamage: 0,
    inCombat: false
  });
  localStorage.clear();
  jest.clearAllMocks();
};

// Helper to create a test hero
global.createTestHero = (name = 'Warrior', overrides = {}) => {
  const base = H[name.toLowerCase()];
  return {
    id: `hero-${crypto.randomUUID()}`,
    n: base.n,
    p: base.p,
    h: base.h,
    m: base.m,
    sh: 0,
    g: 0,
    st: 0,
    ls: false,
    lst: 0,
    s: [...base.s],
    ts: [],
    c: name.toLowerCase(),
    firstActionUsed: false,
    ...overrides
  };
};

// Helper to create a test enemy
global.createTestEnemy = (type = 'goblin', overrides = {}) => {
  const base = E[type];
  return {
    id: `e-${crypto.randomUUID()}`,
    n: base.n,
    p: base.p,
    h: base.h,
    m: base.m,
    goldDrop: base.goldDrop || 0,
    x: base.x || 0,
    s: [],
    pool: base.pool,
    maxLevel: base.maxLevel || 1,
    sigilLevels: base.sigilLevels || {},
    gainRate: base.gainRate || 3,
    turnsSinceGain: 0,
    st: 0,
    li: 0,
    sh: 0,
    g: 0,
    ...overrides
  };
};

// Clean up after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});
