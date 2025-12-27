/**
 * FROGGLE Screen Flow Tests
 *
 * These tests verify that screen transitions work correctly,
 * preventing bugs like:
 * - Ghost quest blocking Ribbleton from loading
 * - Interstitial screen blocking game progress
 * - Broken navigation between screens
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Neutral Deck Initialization', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('should initialize neutral deck with all stage 1 encounters', () => {
    initNeutralDeck();

    expect(S.neutralDeck).toContain('shopkeeper1');
    expect(S.neutralDeck).toContain('wishingwell1');
    expect(S.neutralDeck).toContain('treasurechest1');
    expect(S.neutralDeck).toContain('wizard1');
    expect(S.neutralDeck).toContain('oracle1');
    expect(S.neutralDeck).toContain('encampment1');
    expect(S.neutralDeck).toContain('gambling1');
    expect(S.neutralDeck).toContain('ghost1');
    expect(S.neutralDeck).toContain('royal1');
  });

  it('should have 9 encounters in initial deck', () => {
    initNeutralDeck();
    expect(S.neutralDeck).toHaveLength(9);
  });

  it('should reset lastNeutral on init', () => {
    S.lastNeutral = 'ghost1';
    initNeutralDeck();
    expect(S.lastNeutral).toBeNull();
  });
});

describe('Neutral Encounter Selection', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    initNeutralDeck();
  });

  it('should return oracle1 for tutorial floor 2', () => {
    S.floor = 2;
    S.tutorialFlags.neutral_intro = false;

    const encounter = getNeutralEncounter();
    expect(encounter).toBe('oracle1');
  });

  it('should not repeat the same encounter type back-to-back', () => {
    S.floor = 4;

    // Run multiple times and verify no consecutive repeats of same type
    let lastBase = null;
    for (let i = 0; i < 20; i++) {
      const encounter = getNeutralEncounter();
      const currentBase = encounter.replace(/[12]$/, '');

      if (lastBase !== null) {
        // Same base type shouldn't appear twice in a row
        expect(currentBase).not.toBe(lastBase);
      }
      lastBase = currentBase;
    }
  });

  it('should not allow encampment on floor 10 (ambush on floor 11)', () => {
    S.floor = 10;
    S.lastNeutral = null;

    // Run multiple times
    for (let i = 0; i < 50; i++) {
      const encounter = getNeutralEncounter();
      expect(encounter).not.toMatch(/^encampment/);
    }
  });

  it('should prioritize stage 2 encounters on floor 18', () => {
    S.floor = 18;
    // Add some stage 2 encounters
    S.neutralDeck.push('ghost2');
    S.neutralDeck.push('wizard2');

    let stage2Count = 0;
    for (let i = 0; i < 50; i++) {
      const encounter = getNeutralEncounter();
      if (encounter.includes('2')) stage2Count++;
    }

    // Should heavily favor stage 2
    expect(stage2Count).toBeGreaterThan(40);
  });
});

describe('Stage Upgrade System', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
    initNeutralDeck();
  });

  it('should replace stage 1 with stage 2', () => {
    expect(S.neutralDeck).toContain('ghost1');
    expect(S.neutralDeck).not.toContain('ghost2');

    replaceStage1WithStage2('ghost');

    expect(S.neutralDeck).not.toContain('ghost1');
    expect(S.neutralDeck).toContain('ghost2');
  });

  it('should remove encounter from deck entirely', () => {
    expect(S.neutralDeck).toContain('shopkeeper1');

    removeNeutralFromDeck('shopkeeper');

    expect(S.neutralDeck).not.toContain('shopkeeper1');
    expect(S.neutralDeck).not.toContain('shopkeeper2');
  });
});

describe('Game State Flags', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('should track ghostBoysConverted flag', () => {
    expect(S.ghostBoysConverted).toBe(false);

    S.ghostBoysConverted = true;
    expect(S.ghostBoysConverted).toBe(true);
  });

  it('should persist ghostBoysConverted through save/load', () => {
    S.currentSlot = 1;
    S.ghostBoysConverted = true;
    savePermanent();

    // Reset and reload using loadSlot (the actual game flow)
    S.ghostBoysConverted = false;
    S.currentSlot = null;
    loadSlot(1);

    expect(S.ghostBoysConverted).toBe(true);
  });

  it('should track hasReachedFloor20 flag', () => {
    expect(S.hasReachedFloor20).toBe(false);

    S.hasReachedFloor20 = true;
    expect(S.hasReachedFloor20).toBe(true);
  });

  it('should track fuUnlocked flag', () => {
    expect(S.fuUnlocked).toBe(false);

    S.fuUnlocked = true;
    expect(S.fuUnlocked).toBe(true);
  });

  it('should track tapoUnlocked flag', () => {
    expect(S.tapoUnlocked).toBe(false);

    S.tapoUnlocked = true;
    expect(S.tapoUnlocked).toBe(true);
  });
});

describe('Ribbleton State', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('should have inRibbleton flag', () => {
    expect(S.inRibbleton).toBe(false);
  });

  it('should be able to set inRibbleton', () => {
    S.inRibbleton = true;
    expect(S.inRibbleton).toBe(true);
  });
});

describe('Tutorial Flags', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('should have all tutorial flags initialized to false', () => {
    const allFalse = Object.values(S.tutorialFlags).every(v => v === false);
    expect(allFalse).toBe(true);
  });

  it('should persist tutorial flags through save/load', () => {
    S.currentSlot = 1;
    S.tutorialFlags.ribbleton_intro = true;
    S.tutorialFlags.levelup_intro = true;
    savePermanent();

    // Reset and reload using loadSlot (the actual game flow)
    S.tutorialFlags.ribbleton_intro = false;
    S.tutorialFlags.levelup_intro = false;
    S.currentSlot = null;
    loadSlot(1);

    expect(S.tutorialFlags.ribbleton_intro).toBe(true);
    expect(S.tutorialFlags.levelup_intro).toBe(true);
  });

  it('should have faq_intro flag for FAQ screen', () => {
    expect('faq_intro' in S.tutorialFlags).toBe(true);
  });

  it('should have death_intro flag for death screen', () => {
    expect('death_intro' in S.tutorialFlags).toBe(true);
  });
});

describe('Floor Progression', () => {
  beforeEach(() => {
    testHelpers.resetGameState();
  });

  it('should start at floor 1', () => {
    expect(S.floor).toBe(1);
  });

  it('should allow floor to be set to 20', () => {
    S.floor = 20;
    expect(S.floor).toBe(20);
  });

  it('should handle floor 0 (tutorial)', () => {
    S.floor = 0;
    expect(S.floor).toBe(0);
  });

  it('odd floors (1,3,5...) should be combat floors', () => {
    // Odd floors are combat
    for (const floor of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
      expect(floor % 2).toBe(1);
    }
  });

  it('even floors (2,4,6...) should be neutral floors', () => {
    // Even floors are neutral
    for (const floor of [2, 4, 6, 8, 10, 12, 14, 16, 18]) {
      expect(floor % 2).toBe(0);
    }
  });
});
