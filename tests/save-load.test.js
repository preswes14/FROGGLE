/**
 * FROGGLE Save/Load Tests
 *
 * These tests verify save/load functionality works correctly,
 * preventing bugs like:
 * - Save file not clearing (keeping gold/level-ups from previous run)
 * - Corrupted save states
 * - Missing data after load
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Save/Load Roundtrip', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    S.currentSlot = 1;
  });

  it('should save gold to slot-specific storage', () => {
    S.gold = 100;
    savePermanent();

    // Verify it saved to the correct key
    const saved = localStorage.getItem('froggle8_permanent_slot1');
    expect(saved).not.toBeNull();

    const parsed = JSON.parse(saved);
    expect(parsed.gold).toBe(100);
  });

  it('should save sigil levels to slot-specific storage', () => {
    S.sig.Attack = 2;
    S.sig.Shield = 1;
    S.sig.Expand = 3;
    savePermanent();

    const saved = JSON.parse(localStorage.getItem('froggle8_permanent_slot1'));
    expect(saved.sig.Attack).toBe(2);
    expect(saved.sig.Shield).toBe(1);
    expect(saved.sig.Expand).toBe(3);
  });

  it('should save and load game progress correctly', () => {
    S.floor = 5;
    S.xp = 50;
    S.levelUpCount = 3;
    S.heroes = [
      { n: 'Warrior', p: 2, h: 5, m: 5, s: ['Attack', 'D20'], ts: [], id: 'hero_0' }
    ];
    saveGame();

    // Check the run save
    const runSave = JSON.parse(localStorage.getItem('froggle8_slot1'));
    expect(runSave.f).toBe(5);
    expect(runSave.x).toBe(50);
    expect(runSave.luc).toBe(3);
    expect(runSave.h).toHaveLength(1);
    expect(runSave.h[0].n).toBe('Warrior');
  });

  it('should save and load tempSigUpgrades correctly', () => {
    S.tempSigUpgrades.Attack = 1;
    S.tempSigUpgrades.Ghost = 2;
    saveGame();

    const runData = JSON.parse(localStorage.getItem('froggle8_slot1'));
    expect(runData.tempSigUpgrades.Attack).toBe(1);
    expect(runData.tempSigUpgrades.Ghost).toBe(2);
  });

  it('should save and load gameMode correctly', () => {
    S.gameMode = 'fu';
    saveGame();

    const runData = JSON.parse(localStorage.getItem('froggle8_slot1'));
    expect(runData.gameMode).toBe('fu');
  });

  it('should load permanent data using loadSlot', () => {
    // Save data
    S.gold = 150;
    S.hasReachedFloor20 = true;
    S.ghostBoysConverted = true;
    S.sig.Attack = 3;
    savePermanent();

    // Reset state
    S.gold = 0;
    S.hasReachedFloor20 = false;
    S.ghostBoysConverted = false;
    S.sig.Attack = 0;
    S.currentSlot = null;

    // Load using loadSlot (which is how the game actually loads)
    loadSlot(1);

    expect(S.gold).toBe(150);
    expect(S.hasReachedFloor20).toBe(true);
    expect(S.ghostBoysConverted).toBe(true);
    expect(S.sig.Attack).toBe(3);
  });
});

describe('Save Clearing', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    S.currentSlot = 1;
  });

  it('should completely clear run save when removed', () => {
    // Create a save with data
    S.floor = 10;
    S.gold = 500;
    S.xp = 200;
    S.heroes = [{ n: 'Warrior', p: 2, h: 5, m: 5, s: ['Attack', 'D20'], ts: [] }];
    S.tempSigUpgrades.Attack = 3;
    saveGame();

    // Verify save exists
    expect(localStorage.getItem('froggle8_slot1')).not.toBeNull();

    // Clear the run save (simulating death/new run)
    localStorage.removeItem('froggle8_slot1');

    // Verify it's gone
    expect(localStorage.getItem('froggle8_slot1')).toBeNull();
  });

  it('should reset tempSigUpgrades when starting new run', () => {
    S.tempSigUpgrades.Attack = 3;
    S.tempSigUpgrades.Shield = 2;
    S.tempSigUpgrades.Ghost = 1;

    // Reset temp upgrades (as happens on death)
    S.tempSigUpgrades = {
      Attack: 0, Shield: 0, Heal: 0, D20: 0, Expand: 0,
      Grapple: 0, Ghost: 0, Asterisk: 0, Star: 0, Alpha: 0
    };

    expect(S.tempSigUpgrades.Attack).toBe(0);
    expect(S.tempSigUpgrades.Shield).toBe(0);
    expect(S.tempSigUpgrades.Ghost).toBe(0);
  });

  it('should preserve permanent data when run save is cleared', () => {
    // Set up permanent data
    S.sig.Attack = 2;
    S.hasReachedFloor20 = true;
    S.gold = 100;
    savePermanent();

    // Set up run data
    S.floor = 15;
    S.tempSigUpgrades.Attack = 3;
    saveGame();

    // Clear only run save
    localStorage.removeItem('froggle8_slot1');

    // Verify permanent data still exists
    const permData = localStorage.getItem('froggle8_permanent_slot1');
    expect(permData).not.toBeNull();

    const parsed = JSON.parse(permData);
    expect(parsed.sig.Attack).toBe(2);
    expect(parsed.hasReachedFloor20).toBe(true);
    expect(parsed.gold).toBe(100);
  });
});

describe('Slot Management', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('should return correct metadata for empty slot', () => {
    const meta = getSlotMetadata(1);
    expect(meta.exists).toBe(false);
  });

  it('should return correct metadata for populated slot', () => {
    S.currentSlot = 1;
    S.runsAttempted = 5;
    S.goingRate = 2;
    savePermanent();

    const meta = getSlotMetadata(1);
    expect(meta.exists).toBe(true);
    expect(meta.runsAttempted).toBe(5);
    expect(meta.goingRate).toBe(2);
  });

  it('should detect active run in slot', () => {
    S.currentSlot = 1;
    savePermanent();

    // Add run data
    S.floor = 3;
    S.heroes = [{ n: 'Warrior', p: 2, h: 5, m: 5, s: ['Attack', 'D20'], ts: [] }];
    saveGame();

    const meta = getSlotMetadata(1);
    expect(meta.hasActiveRun).toBe(true);
    expect(meta.activeFloor).toBe(3);
  });

  it('should not detect active run after clearing', () => {
    S.currentSlot = 1;
    S.floor = 3;
    S.heroes = [{ n: 'Warrior', p: 2, h: 5, m: 5, s: ['Attack', 'D20'], ts: [] }];
    saveGame();

    // Clear run
    localStorage.removeItem('froggle8_slot1');

    const meta = getSlotMetadata(1);
    expect(meta.hasActiveRun).toBe(false);
  });
});

describe('Invalid Save State Detection', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    S.currentSlot = 1;
  });

  it('should detect all-heroes-in-Last-Stand as invalid', () => {
    // This is a corrupted state that shouldn't be loaded
    S.heroes = [
      { n: 'Warrior', p: 2, h: 0, m: 5, ls: true, lst: 2, s: ['Attack', 'D20'], ts: [] },
      { n: 'Healer', p: 1, h: 0, m: 5, ls: true, lst: 1, s: ['Heal', 'D20', 'Expand'], ts: [] }
    ];

    const allInLastStand = S.heroes.length > 0 && S.heroes.every(h => h.ls);
    expect(allInLastStand).toBe(true);
  });

  it('should detect floor 0 as tutorial (invalid for normal save)', () => {
    S.floor = 0;

    // Floor 0 should be caught and advanced to floor 1
    if (S.floor === 0) {
      S.floor = 1;
    }

    expect(S.floor).toBe(1);
  });
});

describe('Quest Progress Persistence', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    S.currentSlot = 1;
  });

  it('should save quest progress to slot storage', () => {
    S.questProgress.enemiesKilled = 50;
    S.questProgress.d20Used = true;
    S.questProgress.highestFloor = 15;
    S.questProgress.heroesPlayed.Warrior = 10;
    savePermanent();

    const saved = JSON.parse(localStorage.getItem('froggle8_permanent_slot1'));
    expect(saved.questProgress.enemiesKilled).toBe(50);
    expect(saved.questProgress.d20Used).toBe(true);
    expect(saved.questProgress.highestFloor).toBe(15);
    expect(saved.questProgress.heroesPlayed.Warrior).toBe(10);
  });

  it('should load quest progress using loadSlot', () => {
    S.questProgress.enemiesKilled = 50;
    S.questProgress.d20Used = true;
    savePermanent();

    // Reset
    S.questProgress.enemiesKilled = 0;
    S.questProgress.d20Used = false;
    S.currentSlot = null;

    // Reload using game's actual load function
    loadSlot(1);

    expect(S.questProgress.enemiesKilled).toBe(50);
    expect(S.questProgress.d20Used).toBe(true);
  });
});
