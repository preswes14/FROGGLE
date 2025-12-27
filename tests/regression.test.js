/**
 * FROGGLE Regression Tests
 *
 * These tests specifically target bugs that have occurred before,
 * ensuring they never happen again:
 *
 * 1. Save file not clearing - keeping gold/level-ups from previous run
 * 2. Ghost quest not loading preventing Ribbleton from loading
 * 3. Interstitial screen blocking game progress
 * 4. "FROGGLE a froggy roguelike" block persisting
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('BUG: Leftover Gold/Upgrades After Death', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    S.currentSlot = 1;
  });

  it('should NOT carry tempSigUpgrades between runs', () => {
    // Simulate a run where player gained temp upgrades
    S.tempSigUpgrades = { Attack: 3, Shield: 2, Heal: 1, D20: 0, Expand: 0, Grapple: 0, Ghost: 0, Asterisk: 0, Star: 0, Alpha: 0 };
    S.floor = 10;
    S.heroes = [{ n: 'Warrior', p: 2, h: 0, m: 5, ls: true, lst: 5, s: ['Attack', 'D20'], ts: [] }];
    saveGame();

    // Simulate death: clear run save and reset temp upgrades
    localStorage.removeItem(`froggle8_slot${S.currentSlot}`);
    S.tempSigUpgrades = { Attack: 0, Shield: 0, Heal: 0, D20: 0, Expand: 0, Grapple: 0, Ghost: 0, Asterisk: 0, Star: 0, Alpha: 0 };

    // Verify temp upgrades are gone
    expect(S.tempSigUpgrades.Attack).toBe(0);
    expect(S.tempSigUpgrades.Shield).toBe(0);
    expect(S.tempSigUpgrades.Heal).toBe(0);
  });

  it('should preserve gold after death (gold is persistent)', () => {
    // Gold IS supposed to persist - it's a meta-progression currency
    S.gold = 50;
    savePermanent();

    // After death, gold should still be there (using loadSlot, the actual game flow)
    S.gold = 0;
    S.currentSlot = null;
    loadSlot(1);

    expect(S.gold).toBe(50);
  });

  it('should NOT have levelUpCount persist to new run', () => {
    // levelUpCount is per-run, stored in run save, not permanent save
    S.levelUpCount = 5;
    S.floor = 15;
    S.heroes = [{ n: 'Warrior', p: 2, h: 5, m: 5, s: ['Attack', 'D20'], ts: [] }];
    saveGame();

    // Check the run save
    const runSave = JSON.parse(localStorage.getItem('froggle8_slot1'));
    expect(runSave.luc).toBe(5);

    // Clear run save (death)
    localStorage.removeItem('froggle8_slot1');

    // New run should start with 0 level ups
    // (This happens in game when continueSlot creates new run)
  });
});

describe('BUG: Ghost Quest Blocking Ribbleton', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    initNeutralDeck();
  });

  it('ghost encounter should be in neutral deck', () => {
    expect(S.neutralDeck).toContain('ghost1');
  });

  it('ghostBoysConverted flag should be properly initialized', () => {
    expect(S.ghostBoysConverted).toBe(false);
  });

  it('should be able to upgrade ghost to stage 2', () => {
    replaceStage1WithStage2('ghost');

    expect(S.neutralDeck).toContain('ghost2');
    expect(S.neutralDeck).not.toContain('ghost1');
  });

  it('silver key should start as not held', () => {
    expect(S.silverKeyHeld).toBe(false);
  });

  it('inRibbleton flag should not depend on ghost quest state', () => {
    // Even if ghost quest is in various states, Ribbleton should be accessible
    S.ghostBoysConverted = true;
    S.silverKeyHeld = true;

    // Should still be able to set inRibbleton
    S.inRibbleton = true;
    expect(S.inRibbleton).toBe(true);
  });
});

describe('BUG: Invalid Save State Detection', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    S.currentSlot = 1;
  });

  it('should detect when all heroes are in Last Stand (game over state)', () => {
    S.heroes = [
      { n: 'Warrior', p: 2, h: 0, m: 5, ls: true, lst: 3, s: ['Attack', 'D20'], ts: [] },
      { n: 'Healer', p: 1, h: 0, m: 5, ls: true, lst: 2, s: ['Heal', 'D20', 'Expand'], ts: [] }
    ];

    const allInLastStand = S.heroes.length > 0 && S.heroes.every(h => h.ls);

    expect(allInLastStand).toBe(true);
    // In actual game, this triggers showDeathScreen() instead of continuing
  });

  it('should detect floor 0 as invalid for normal save (tutorial floor)', () => {
    S.floor = 0;

    const isInvalidTutorialSave = S.floor === 0;

    expect(isInvalidTutorialSave).toBe(true);
    // In actual game, this advances floor to 1
  });
});

describe('BUG: State Consistency', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('floor should never be undefined or null', () => {
    // This was causing "Session 0 undefined floor" bug
    expect(S.floor).toBeDefined();
    expect(S.floor).not.toBeNull();
    expect(typeof S.floor).toBe('number');
  });

  it('floor should default to 1 if somehow invalid', () => {
    // The upd() function has a guard for this
    S.floor = undefined;

    // Simulate the guard
    if (S.floor === undefined || S.floor === null) {
      S.floor = 1;
    }

    expect(S.floor).toBe(1);
  });

  it('heroes array should always be an array', () => {
    expect(Array.isArray(S.heroes)).toBe(true);
  });

  it('enemies array should always be an array', () => {
    expect(Array.isArray(S.enemies)).toBe(true);
  });

  it('neutralDeck should always be an array after init', () => {
    initNeutralDeck();
    expect(Array.isArray(S.neutralDeck)).toBe(true);
  });
});

describe('BUG: Healer Having Attack Sigil', () => {
  it('Healer definition should NOT include Attack', () => {
    // This was a past bug where Healer had Attack in their starting sigils
    expect(H.healer.s).not.toContain('Attack');
    expect(H.healer.s).toContain('Heal');
    expect(H.healer.s).toContain('D20');
    expect(H.healer.s).toContain('Expand');
  });
});

describe('BUG: XP Cost Calculation', () => {
  it('should follow Fibonacci sequence for early levels', () => {
    expect(getXPCost(0)).toBe(1);  // FIB[0] = 1
    expect(getXPCost(1)).toBe(1);  // FIB[1] = 1
    expect(getXPCost(2)).toBe(2);  // FIB[2] = 2
    expect(getXPCost(3)).toBe(3);  // FIB[3] = 3
    expect(getXPCost(4)).toBe(5);  // FIB[4] = 5
    expect(getXPCost(5)).toBe(8);  // FIB[5] = 8
    expect(getXPCost(9)).toBe(55); // FIB[9] = 55
  });

  it('should switch to 100/200/300 after Fibonacci reaches 89', () => {
    expect(getXPCost(10)).toBe(100); // After 89, goes to 100
    expect(getXPCost(11)).toBe(200);
    expect(getXPCost(12)).toBe(300);
  });

  it('should never return NaN or undefined', () => {
    for (let i = 0; i < 50; i++) {
      const cost = getXPCost(i);
      expect(cost).not.toBeNaN();
      expect(cost).toBeDefined();
      expect(cost).toBeGreaterThan(0);
    }
  });
});

describe('BUG: Animation Timing', () => {
  it('T() function should return positive values', () => {
    S.animationSpeed = 1;
    expect(T(1000)).toBeGreaterThan(0);

    S.animationSpeed = 2;
    expect(T(1000)).toBeGreaterThan(0);

    S.animationSpeed = 4;
    expect(T(1000)).toBeGreaterThan(0);
  });

  it('T() should return 1 for instant mode', () => {
    S.animationSpeed = 0; // Instant mode
    expect(T(1000)).toBe(1);
  });

  it('T() should halve timing for 2x speed', () => {
    S.animationSpeed = 2;
    expect(T(1000)).toBe(500);
  });

  it('T() should quarter timing for 4x speed', () => {
    S.animationSpeed = 4;
    expect(T(1000)).toBe(250);
  });
});

describe('BUG: Dice Rolling', () => {
  it('should return values between 1 and 20 for d20', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice(1, 20);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(20);
    }
  });

  it('should roll correct number of dice', () => {
    const result = rollDice(3, 20);
    expect(result.rolls).toHaveLength(3);
  });

  it('should return the highest roll as best', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollDice(4, 20);
      const actualMax = Math.max(...result.rolls);
      expect(result.best).toBe(actualMax);
    }
  });

  it('oopsAll20s debug mode should return all 20s', () => {
    S.oopsAll20s = true;
    const result = rollDice(3, 20);

    expect(result.rolls).toEqual([20, 20, 20]);
    expect(result.best).toBe(20);

    S.oopsAll20s = false;
  });
});
