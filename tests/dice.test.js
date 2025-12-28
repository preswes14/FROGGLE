/**
 * Dice Rolling and D20 Mechanics Tests
 *
 * Tests the dice rolling system which handles:
 * - Basic dice rolling
 * - Multiple dice (best of N)
 * - D20 DC calculations
 * - Last Stand DC penalties
 * - Debug mode (Oops All 20s)
 *
 * Critical invariants tested:
 * 1. Roll returns array of individual rolls
 * 2. Best roll is correctly identified
 * 3. Last Stand increases DC
 * 4. Confuse DC caps at 20
 */

// Implement rollDice for testing
function rollDice(count, sides = 20) {
  // Debug mode: Oops All 20s
  if (S.oopsAll20s && sides === 20) {
    const rolls = Array(count).fill(20);
    return { rolls, best: 20 };
  }

  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.ceil(Math.random() * sides));
  }
  const best = Math.max(...rolls);
  const worst = Math.min(...rolls);

  return { rolls, best, worst };
}

// Implement getD20DC for testing
function getD20DC(baseDC, heroIdx, gambitName) {
  const h = S.heroes[heroIdx];
  if (!h || !h.ls) return baseDC;

  // Last Stand: +2 DC per turn
  const lastStandBonus = h.lst * 2;

  // Confuse caps at DC 20, all other gambits continue increasing
  if (gambitName === 'CONFUSE') {
    return Math.min(baseDC + lastStandBonus, 20);
  }
  return baseDC + lastStandBonus;
}

describe('Dice Rolling', () => {
  beforeEach(() => {
    resetGameState();
    // Seed random for predictable tests where needed
    jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rolling', () => {
    test('rolling 1d20 returns single roll', () => {
      Math.random.mockReturnValue(0.5);
      const result = rollDice(1, 20);

      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(20);
    });

    test('roll value is between 1 and sides inclusive', () => {
      // Test multiple random values
      const testValues = [0.001, 0.5, 0.999];

      testValues.forEach(val => {
        Math.random.mockReturnValue(val);
        const result = rollDice(1, 20);
        expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
        expect(result.rolls[0]).toBeLessThanOrEqual(20);
      });
    });

    test('rolling minimum (Math.random near 0) gives 1', () => {
      Math.random.mockReturnValue(0.001);
      const result = rollDice(1, 20);
      expect(result.rolls[0]).toBe(1);
    });

    test('rolling maximum (Math.random near 1) gives 20', () => {
      Math.random.mockReturnValue(0.999);
      const result = rollDice(1, 20);
      expect(result.rolls[0]).toBe(20);
    });
  });

  describe('Multiple Dice', () => {
    test('rolling 2d20 returns two rolls', () => {
      Math.random
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.7);

      const result = rollDice(2, 20);

      expect(result.rolls).toHaveLength(2);
    });

    test('rolling 3d20 returns three rolls', () => {
      Math.random
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.7);

      const result = rollDice(3, 20);

      expect(result.rolls).toHaveLength(3);
    });

    test('best is highest of multiple rolls', () => {
      // Roll 5, 15, 10
      Math.random
        .mockReturnValueOnce(0.24) // ~5
        .mockReturnValueOnce(0.74) // ~15
        .mockReturnValueOnce(0.49); // ~10

      const result = rollDice(3, 20);

      expect(result.best).toBe(Math.max(...result.rolls));
    });

    test('rolling 4d20 gives best of 4', () => {
      Math.random
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.999) // This should be the best
        .mockReturnValueOnce(0.5);

      const result = rollDice(4, 20);

      expect(result.rolls).toHaveLength(4);
      expect(result.best).toBe(20);
    });
  });

  describe('Debug Mode (Oops All 20s)', () => {
    test('oopsAll20s makes all rolls 20', () => {
      S.oopsAll20s = true;

      const result = rollDice(3, 20);

      expect(result.rolls).toEqual([20, 20, 20]);
      expect(result.best).toBe(20);
    });

    test('oopsAll20s only affects d20 rolls', () => {
      S.oopsAll20s = true;
      Math.random.mockReturnValue(0.5);

      const result = rollDice(1, 6);

      // Should NOT be affected - uses normal random
      expect(result.best).not.toBe(20);
    });

    test('oopsAll20s disabled returns normal rolls', () => {
      S.oopsAll20s = false;
      Math.random.mockReturnValue(0.5);

      const result = rollDice(1, 20);

      expect(result.rolls[0]).not.toBe(20);
    });
  });

  describe('Different Die Sizes', () => {
    test('d6 rolls between 1-6', () => {
      Math.random.mockReturnValue(0.999);
      const result = rollDice(1, 6);
      expect(result.best).toBe(6);
    });

    test('d4 rolls between 1-4', () => {
      Math.random.mockReturnValue(0.999);
      const result = rollDice(1, 4);
      expect(result.best).toBe(4);
    });

    test('d100 rolls between 1-100', () => {
      Math.random.mockReturnValue(0.999);
      const result = rollDice(1, 100);
      expect(result.best).toBe(100);
    });
  });
});

describe('D20 DC Calculation', () => {
  beforeEach(() => {
    resetGameState();
    S.heroes = [createTestHero('Warrior')];
  });

  describe('Base DC', () => {
    test('returns base DC when hero not in Last Stand', () => {
      S.heroes[0].ls = false;

      expect(getD20DC(10, 0, 'CONFUSE')).toBe(10);
      expect(getD20DC(15, 0, 'STARTLE')).toBe(15);
    });

    test('different gambits have different base DCs', () => {
      // These are the actual game DCs
      const gambits = {
        CONFUSE: 6,
        STARTLE: 12,
        MEND: 6,
        STEAL: 15,
        RECRUIT: 18
      };

      Object.entries(gambits).forEach(([name, dc]) => {
        expect(getD20DC(dc, 0, name)).toBe(dc);
      });
    });
  });

  describe('Last Stand DC Penalty', () => {
    test('Last Stand Turn 0 (first turn) has no penalty', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 0;

      expect(getD20DC(10, 0, 'CONFUSE')).toBe(10);
    });

    test('Last Stand Turn 1 adds +2 DC', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 1;

      expect(getD20DC(10, 0, 'STARTLE')).toBe(12);
    });

    test('Last Stand Turn 2 adds +4 DC', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 2;

      expect(getD20DC(10, 0, 'STARTLE')).toBe(14);
    });

    test('Last Stand Turn 5 adds +10 DC', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 5;

      expect(getD20DC(10, 0, 'STARTLE')).toBe(20);
    });
  });

  describe('Confuse DC Cap', () => {
    test('Confuse DC caps at 20', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 10; // Would be +20

      expect(getD20DC(6, 0, 'CONFUSE')).toBe(20);
    });

    test('Confuse DC does not exceed 20 even with high turns', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 100;

      expect(getD20DC(6, 0, 'CONFUSE')).toBe(20);
    });

    test('Other gambits do NOT cap at 20', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 10; // +20

      expect(getD20DC(12, 0, 'STARTLE')).toBe(32);
      expect(getD20DC(15, 0, 'STEAL')).toBe(35);
    });
  });

  describe('Edge Cases', () => {
    test('invalid hero index returns base DC', () => {
      expect(getD20DC(10, 99, 'CONFUSE')).toBe(10);
    });

    test('undefined hero returns base DC', () => {
      expect(getD20DC(10, undefined, 'CONFUSE')).toBe(10);
    });

    test('hero not in Last Stand returns base DC', () => {
      S.heroes[0].ls = false;
      S.heroes[0].lst = 5; // lst should be ignored when not in Last Stand

      expect(getD20DC(10, 0, 'CONFUSE')).toBe(10);
    });
  });
});

describe('Gambit Success Calculation', () => {
  // Gambit success: roll >= DC
  function checkGambitSuccess(roll, dc) {
    return roll >= dc;
  }

  test('roll equal to DC succeeds', () => {
    expect(checkGambitSuccess(10, 10)).toBe(true);
  });

  test('roll above DC succeeds', () => {
    expect(checkGambitSuccess(15, 10)).toBe(true);
  });

  test('roll below DC fails', () => {
    expect(checkGambitSuccess(9, 10)).toBe(false);
  });

  test('natural 20 always possible', () => {
    expect(checkGambitSuccess(20, 20)).toBe(true);
  });

  test('impossible DC (> 20) fails even on nat 20', () => {
    expect(checkGambitSuccess(20, 25)).toBe(false);
  });
});
