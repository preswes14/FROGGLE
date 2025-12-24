/**
 * FROGGLE Game Initialization Tests
 *
 * These tests verify that the game initializes correctly,
 * preventing bugs like:
 * - Leftover gold from previous runs
 * - Phantom level-ups persisting
 * - Corrupted save states
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Fresh Game Initialization', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('should start with 0 gold', () => {
    expect(S.gold).toBe(0);
  });

  it('should start with 0 XP', () => {
    expect(S.xp).toBe(0);
  });

  it('should start with 0 level-up count', () => {
    expect(S.levelUpCount).toBe(0);
  });

  it('should start with no heroes selected', () => {
    expect(S.heroes).toHaveLength(0);
  });

  it('should start with all sigil levels at 0', () => {
    const expectedSigils = {
      Attack: 0, Shield: 0, Heal: 0, D20: 0, Expand: 0,
      Grapple: 0, Ghost: 0, Asterisk: 0, Star: 0, Alpha: 0
    };
    expect(S.sig).toEqual(expectedSigils);
  });

  it('should start with no temporary sigil upgrades', () => {
    const expectedTempUpgrades = {
      Attack: 0, Shield: 0, Heal: 0, D20: 0, Expand: 0,
      Grapple: 0, Ghost: 0, Asterisk: 0, Star: 0, Alpha: 0
    };
    expect(S.tempSigUpgrades).toEqual(expectedTempUpgrades);
  });

  it('should start on floor 1', () => {
    expect(S.floor).toBe(1);
  });

  it('should start in Standard game mode', () => {
    expect(S.gameMode).toBe('Standard');
  });

  it('should have no enemies', () => {
    expect(S.enemies).toHaveLength(0);
  });

  it('should have no recruits', () => {
    expect(S.recruits).toHaveLength(0);
  });

  it('should not be in Ribbleton at start', () => {
    expect(S.inRibbleton).toBe(false);
  });
});

describe('Hero Definitions', () => {
  it('should have correct Warrior stats', () => {
    expect(H.warrior).toEqual({
      n: 'Warrior',
      p: 2,
      h: 5,
      m: 5,
      s: ['Attack', 'D20']
    });
  });

  it('should have correct Tank stats', () => {
    expect(H.tank).toEqual({
      n: 'Tank',
      p: 1,
      h: 10,
      m: 10,
      s: ['Attack', 'Shield', 'D20']
    });
  });

  it('should have correct Healer stats', () => {
    expect(H.healer).toEqual({
      n: 'Healer',
      p: 1,
      h: 5,
      m: 5,
      s: ['Heal', 'D20', 'Expand']
    });
  });

  it('should have correct Mage stats', () => {
    expect(H.mage).toEqual({
      n: 'Mage',
      p: 1,
      h: 5,
      m: 5,
      s: ['Attack', 'D20', 'Expand']
    });
  });

  it('Healer should NOT have Attack sigil', () => {
    // This was a bug - Healer had Attack when they shouldn't
    expect(H.healer.s).not.toContain('Attack');
  });
});

describe('Enemy Definitions', () => {
  it('should have all expected enemy types defined', () => {
    expect(E.fly).toBeDefined();
    expect(E.goblin).toBeDefined();
    expect(E.wolf).toBeDefined();
    expect(E.orc).toBeDefined();
    expect(E.giant).toBeDefined();
    expect(E.caveTroll).toBeDefined();
    expect(E.dragon).toBeDefined();
    expect(E.flydra).toBeDefined();
  });

  it('Fly should award 0 gold and 0 XP', () => {
    expect(E.fly.goldDrop).toBe(0);
    expect(E.fly.x).toBe(0);
  });

  it('Flydra should award 0 gold directly (gold given at combat end)', () => {
    expect(E.flydra.goldDrop).toBe(0);
  });
});

describe('Quest Progress Initialization', () => {
  it('should have all quest progress fields initialized', () => {
    expect(S.questProgress).toBeDefined();
    expect(S.questProgress.enemiesKilled).toBe(0);
    expect(S.questProgress.totalDamageDealt).toBe(0);
    expect(S.questProgress.d20Used).toBe(false);
    expect(S.questProgress.highestFloor).toBe(0);
  });

  it('should have all hero tracking initialized', () => {
    expect(S.questProgress.heroesPlayed).toEqual({
      Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0
    });
  });

  it('should have all neutral encounters tracking initialized', () => {
    expect(S.questProgress.neutralsCompleted).toEqual({
      shopkeeper: false, wishingwell: false, treasurechest: false,
      wizard: false, oracle: false, encampment: false,
      gambling: false, ghost: false, royal: false
    });
  });

  it('should have all enemy types tracking initialized', () => {
    expect(S.questProgress.enemyTypesDefeated).toEqual({
      Goblin: false, Wolf: false, Orc: false, Giant: false,
      'Cave Troll': false, Dragon: false, Flydra: false
    });
  });
});
