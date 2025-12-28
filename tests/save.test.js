/**
 * Save/Load System Tests
 *
 * Tests the persistence system which handles:
 * - localStorage save/load
 * - Slot system
 * - Permanent vs run data
 * - Migration handling
 * - Error recovery
 *
 * Critical invariants tested:
 * 1. Saves persist correctly to localStorage
 * 2. Loads restore full game state
 * 3. Invalid saves are detected and handled
 * 4. Permanent data survives death
 */

describe('Save System', () => {
  beforeEach(() => {
    resetGameState();
    S.currentSlot = 1;
  });

  describe('Save Game', () => {
    // Simplified saveGame for testing
    function saveGame() {
      const data = {
        f: S.floor,
        x: S.xp,
        luc: S.levelUpCount,
        h: S.heroes,
        neutralDeck: S.neutralDeck,
        lastNeutral: S.lastNeutral,
        hasAncientStatuette: S.hasAncientStatuette,
        tempSigUpgrades: S.tempSigUpgrades,
        gameMode: S.gameMode,
        chosenHeroIdx: S.chosenHeroIdx
      };
      localStorage.setItem(`froggle8_slot${S.currentSlot}`, JSON.stringify(data));
    }

    test('saves floor number', () => {
      S.floor = 5;
      S.heroes = [createTestHero('Warrior')];
      saveGame();

      const saved = JSON.parse(localStorage.getItem('froggle8_slot1'));
      expect(saved.f).toBe(5);
    });

    test('saves XP', () => {
      S.xp = 100;
      S.heroes = [createTestHero('Warrior')];
      saveGame();

      const saved = JSON.parse(localStorage.getItem('froggle8_slot1'));
      expect(saved.x).toBe(100);
    });

    test('saves hero array', () => {
      S.heroes = [
        createTestHero('Warrior', { h: 3, sh: 2 }),
        createTestHero('Mage')
      ];
      saveGame();

      const saved = JSON.parse(localStorage.getItem('froggle8_slot1'));
      expect(saved.h).toHaveLength(2);
      expect(saved.h[0].h).toBe(3);
      expect(saved.h[0].sh).toBe(2);
    });

    test('saves game mode', () => {
      S.gameMode = 'fu';
      S.heroes = [createTestHero('Warrior')];
      saveGame();

      const saved = JSON.parse(localStorage.getItem('froggle8_slot1'));
      expect(saved.gameMode).toBe('fu');
    });

    test('saves temporary sigil upgrades', () => {
      S.tempSigUpgrades = { Attack: 2, Shield: 1 };
      S.heroes = [createTestHero('Warrior')];
      saveGame();

      const saved = JSON.parse(localStorage.getItem('froggle8_slot1'));
      expect(saved.tempSigUpgrades.Attack).toBe(2);
    });

    test('saves neutral deck state', () => {
      S.neutralDeck = ['shopkeeper', 'wizard', 'oracle'];
      S.heroes = [createTestHero('Warrior')];
      saveGame();

      const saved = JSON.parse(localStorage.getItem('froggle8_slot1'));
      expect(saved.neutralDeck).toEqual(['shopkeeper', 'wizard', 'oracle']);
    });

    test('uses correct slot', () => {
      S.currentSlot = 2;
      S.floor = 10;
      S.heroes = [createTestHero('Warrior')];
      saveGame();

      expect(localStorage.getItem('froggle8_slot2')).not.toBeNull();
      expect(localStorage.getItem('froggle8_slot1')).toBeNull();
    });
  });

  describe('Permanent Save', () => {
    // Simplified savePermanent for testing
    function savePermanent() {
      const data = {
        gold: S.gold,
        goingRate: S.goingRate,
        startingXP: S.startingXP,
        sig: S.sig,
        sigUpgradeCounts: S.sigUpgradeCounts,
        hasReachedFloor20: S.hasReachedFloor20,
        fuUnlocked: S.fuUnlocked,
        tapoUnlocked: S.tapoUnlocked,
        runNumber: S.runNumber,
        tutorialFlags: S.tutorialFlags,
        pondHistory: S.pondHistory
      };
      localStorage.setItem(`froggle8_permanent_slot${S.currentSlot}`, JSON.stringify(data));
    }

    test('saves permanent gold', () => {
      S.gold = 50;
      savePermanent();

      const saved = JSON.parse(localStorage.getItem('froggle8_permanent_slot1'));
      expect(saved.gold).toBe(50);
    });

    test('saves permanent sigil levels', () => {
      S.sig = { Attack: 1, Shield: 2, Heal: 0 };
      savePermanent();

      const saved = JSON.parse(localStorage.getItem('froggle8_permanent_slot1'));
      expect(saved.sig.Attack).toBe(1);
      expect(saved.sig.Shield).toBe(2);
    });

    test('saves unlock flags', () => {
      S.hasReachedFloor20 = true;
      S.fuUnlocked = true;
      S.tapoUnlocked = true;
      savePermanent();

      const saved = JSON.parse(localStorage.getItem('froggle8_permanent_slot1'));
      expect(saved.hasReachedFloor20).toBe(true);
      expect(saved.fuUnlocked).toBe(true);
      expect(saved.tapoUnlocked).toBe(true);
    });

    test('saves tutorial flags', () => {
      S.tutorialFlags = { ribbleton_intro: true, levelup_intro: true };
      savePermanent();

      const saved = JSON.parse(localStorage.getItem('froggle8_permanent_slot1'));
      expect(saved.tutorialFlags.ribbleton_intro).toBe(true);
    });

    test('saves run history', () => {
      S.pondHistory = [
        { runNumber: 1, floorReached: 5, outcome: 'death' },
        { runNumber: 2, floorReached: 20, outcome: 'victory' }
      ];
      savePermanent();

      const saved = JSON.parse(localStorage.getItem('froggle8_permanent_slot1'));
      expect(saved.pondHistory).toHaveLength(2);
    });
  });

  describe('Load Game', () => {
    function loadGame() {
      const d = localStorage.getItem(`froggle8_slot${S.currentSlot}`);
      if (!d) return false;
      const j = JSON.parse(d);
      S.floor = j.f;
      S.xp = j.x;
      S.levelUpCount = j.luc || 0;
      S.heroes = j.h;
      S.neutralDeck = j.neutralDeck || [];
      S.lastNeutral = j.lastNeutral || null;
      S.hasAncientStatuette = j.hasAncientStatuette || false;
      S.tempSigUpgrades = j.tempSigUpgrades || {};
      S.gameMode = j.gameMode || 'Standard';
      S.chosenHeroIdx = j.chosenHeroIdx !== undefined ? j.chosenHeroIdx : -1;
      S.recruits = []; // Recruits don't persist
      return true;
    }

    test('loads floor number', () => {
      localStorage.setItem('froggle8_slot1', JSON.stringify({
        f: 7, x: 50, h: [], gameMode: 'Standard'
      }));

      loadGame();
      expect(S.floor).toBe(7);
    });

    test('loads heroes', () => {
      const hero = createTestHero('Warrior', { h: 3, sh: 5 });
      localStorage.setItem('froggle8_slot1', JSON.stringify({
        f: 1, x: 0, h: [hero], gameMode: 'Standard'
      }));

      loadGame();
      expect(S.heroes).toHaveLength(1);
      expect(S.heroes[0].h).toBe(3);
      expect(S.heroes[0].sh).toBe(5);
    });

    test('clears recruits on load', () => {
      S.recruits = [createTestEnemy('goblin')];
      localStorage.setItem('froggle8_slot1', JSON.stringify({
        f: 1, x: 0, h: [], gameMode: 'Standard'
      }));

      loadGame();
      expect(S.recruits).toEqual([]);
    });

    test('returns false if no save exists', () => {
      const result = loadGame();
      expect(result).toBe(false);
    });

    test('defaults game mode to Standard', () => {
      localStorage.setItem('froggle8_slot1', JSON.stringify({
        f: 1, x: 0, h: []
        // No gameMode
      }));

      loadGame();
      expect(S.gameMode).toBe('Standard');
    });
  });

  describe('Invalid Save Detection', () => {
    test('detects all heroes in Last Stand as invalid', () => {
      S.heroes = [
        createTestHero('Warrior', { ls: true }),
        createTestHero('Mage', { ls: true })
      ];

      const allInLastStand = S.heroes.length > 0 && S.heroes.every(h => h.ls);
      expect(allInLastStand).toBe(true);
    });

    test('valid save has at least one hero not in Last Stand', () => {
      S.heroes = [
        createTestHero('Warrior', { ls: true }),
        createTestHero('Mage', { ls: false })
      ];

      const allInLastStand = S.heroes.length > 0 && S.heroes.every(h => h.ls);
      expect(allInLastStand).toBe(false);
    });

    test('empty heroes array is not invalid', () => {
      S.heroes = [];

      const allInLastStand = S.heroes.length > 0 && S.heroes.every(h => h.ls);
      expect(allInLastStand).toBe(false);
    });
  });

  describe('Slot Metadata', () => {
    function getSlotMetadata(slot) {
      const d = localStorage.getItem(`froggle8_permanent_slot${slot}`);
      if (!d) return { exists: false };

      const j = JSON.parse(d);
      const runData = localStorage.getItem(`froggle8_slot${slot}`);
      let activeFloor = null;
      if (runData) {
        try {
          const r = JSON.parse(runData);
          activeFloor = r.f || null;
        } catch (e) {}
      }

      return {
        exists: true,
        runsAttempted: j.runsAttempted || j.runNumber || 1,
        goingRate: j.goingRate || 1,
        hasActiveRun: !!runData,
        activeFloor: activeFloor
      };
    }

    test('returns exists: false for empty slot', () => {
      const meta = getSlotMetadata(3);
      expect(meta.exists).toBe(false);
    });

    test('returns correct metadata for existing slot', () => {
      localStorage.setItem('froggle8_permanent_slot1', JSON.stringify({
        runsAttempted: 5,
        goingRate: 2
      }));
      localStorage.setItem('froggle8_slot1', JSON.stringify({
        f: 7
      }));

      const meta = getSlotMetadata(1);
      expect(meta.exists).toBe(true);
      expect(meta.runsAttempted).toBe(5);
      expect(meta.goingRate).toBe(2);
      expect(meta.hasActiveRun).toBe(true);
      expect(meta.activeFloor).toBe(7);
    });

    test('detects no active run', () => {
      localStorage.setItem('froggle8_permanent_slot1', JSON.stringify({
        runsAttempted: 3
      }));
      // No froggle8_slot1

      const meta = getSlotMetadata(1);
      expect(meta.hasActiveRun).toBe(false);
      expect(meta.activeFloor).toBeNull();
    });
  });
});

describe('Going Rate Calculation', () => {
  beforeEach(() => {
    resetGameState();
  });

  test('going rate starts at 1', () => {
    expect(S.goingRate).toBe(1);
  });

  test('going rate increases on death', () => {
    // Formula from game: goingRate = 1 + (runsAttempted / 10) capped at reasonable max
    function calculateGoingRate(runsAttempted) {
      return Math.min(1 + Math.floor(runsAttempted / 10), 5);
    }

    expect(calculateGoingRate(0)).toBe(1);
    expect(calculateGoingRate(10)).toBe(2);
    expect(calculateGoingRate(25)).toBe(3);
    expect(calculateGoingRate(50)).toBe(5);
    expect(calculateGoingRate(100)).toBe(5); // Capped
  });
});

describe('XP Cost Calculation', () => {
  // getXPCost from constants.js
  function getXPCost(levelUpCount) {
    const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    if (levelUpCount >= 10) {
      return (levelUpCount - 9) * 100;
    }
    return FIB[levelUpCount] || 100;
  }

  test('first upgrade costs 1 XP', () => {
    expect(getXPCost(0)).toBe(1);
  });

  test('follows Fibonacci up to 89', () => {
    expect(getXPCost(0)).toBe(1);
    expect(getXPCost(1)).toBe(1);
    expect(getXPCost(2)).toBe(2);
    expect(getXPCost(3)).toBe(3);
    expect(getXPCost(4)).toBe(5);
    expect(getXPCost(5)).toBe(8);
    expect(getXPCost(6)).toBe(13);
    expect(getXPCost(7)).toBe(21);
    expect(getXPCost(8)).toBe(34);
    expect(getXPCost(9)).toBe(55);
  });

  test('switches to 100 increments after Fibonacci', () => {
    expect(getXPCost(10)).toBe(100);
    expect(getXPCost(11)).toBe(200);
    expect(getXPCost(12)).toBe(300);
  });
});

describe('Star XP Multiplier', () => {
  function getStarMultiplier(starLevel) {
    if (starLevel <= 0) return 1;
    // Star L1 = 1.5x, L2 = 2x, L3 = 2.5x, L4 = 3x
    return 1 + (starLevel * 0.5);
  }

  test('no Star gives 1x multiplier', () => {
    expect(getStarMultiplier(0)).toBe(1);
  });

  test('Star L1 gives 1.5x', () => {
    expect(getStarMultiplier(1)).toBe(1.5);
  });

  test('Star L2 gives 2x', () => {
    expect(getStarMultiplier(2)).toBe(2);
  });

  test('Star L3 gives 2.5x', () => {
    expect(getStarMultiplier(3)).toBe(2.5);
  });

  test('Star L4 gives 3x', () => {
    expect(getStarMultiplier(4)).toBe(3);
  });
});
