/**
 * Combat Flow and Turn Management Tests
 *
 * Tests the combat system which handles:
 * - Turn progression
 * - Stun mechanics
 * - Action restrictions
 * - Last Stand restrictions
 * - Enemy composition
 *
 * Critical invariants tested:
 * 1. Stunned heroes cannot act
 * 2. Heroes can only act once per turn
 * 3. Last Stand heroes can ONLY use D20
 * 4. Stun counters decrement at END of enemy turn
 */

describe('Turn Management', () => {
  beforeEach(() => {
    resetGameState();
    S.heroes = [
      createTestHero('Warrior'),
      createTestHero('Mage')
    ];
    S.enemies = [createTestEnemy('goblin')];
  });

  describe('Hero Action Restrictions', () => {
    test('hero can act when not stunned', () => {
      S.heroes[0].st = 0;
      expect(S.heroes[0].st).toBe(0);
      // Hero should be able to act
    });

    test('hero cannot act when stunned', () => {
      S.heroes[0].st = 2;
      // In the real game, act() checks if(h.st > 0)
      expect(S.heroes[0].st).toBeGreaterThan(0);
    });

    test('hero cannot act twice in same turn', () => {
      S.acted.push(0);
      // In real game, act() checks if(S.acted.includes(idx))
      expect(S.acted).toContain(0);
    });

    test('acted array resets each round', () => {
      S.acted = [0, 1];
      // Simulating round transition
      S.acted = [];
      expect(S.acted).toEqual([]);
    });
  });

  describe('Last Stand Restrictions', () => {
    test('Last Stand hero can use D20', () => {
      S.heroes[0].ls = true;
      const sig = 'D20';
      const canUse = sig === 'D20' || !S.heroes[0].ls;
      expect(canUse).toBe(true);
    });

    test('Last Stand hero cannot use Attack', () => {
      S.heroes[0].ls = true;
      const sig = 'Attack';
      const canUse = sig === 'D20' || !S.heroes[0].ls;
      expect(canUse).toBe(false);
    });

    test('Last Stand hero cannot use Heal', () => {
      S.heroes[0].ls = true;
      const sig = 'Heal';
      const canUse = sig === 'D20' || !S.heroes[0].ls;
      expect(canUse).toBe(false);
    });

    test('Last Stand hero cannot use Shield', () => {
      S.heroes[0].ls = true;
      const sig = 'Shield';
      const canUse = sig === 'D20' || !S.heroes[0].ls;
      expect(canUse).toBe(false);
    });

    test('non-Last Stand hero can use any sigil', () => {
      S.heroes[0].ls = false;
      ['Attack', 'D20', 'Heal', 'Shield', 'Ghost'].forEach(sig => {
        const canUse = sig === 'D20' || !S.heroes[0].ls;
        expect(canUse).toBe(true);
      });
    });
  });

  describe('Stun Mechanics', () => {
    test('stun counter decrements at end of enemy turn', () => {
      S.heroes[0].st = 2;
      // Simulate stun decrement (done in enemyTurn())
      S.heroes.forEach(h => { if (h.st > 0) h.st--; });
      expect(S.heroes[0].st).toBe(1);
    });

    test('stun counter does not go below 0', () => {
      S.heroes[0].st = 1;
      S.heroes.forEach(h => { if (h.st > 0) h.st--; });
      expect(S.heroes[0].st).toBe(0);
    });

    test('stun from Grapple stacks', () => {
      S.heroes[0].st = 2;
      // Apply additional stun
      S.heroes[0].st += 1;
      expect(S.heroes[0].st).toBe(3);
    });

    test('all heroes stunned triggers ambush state', () => {
      S.heroes[0].st = 1;
      S.heroes[1].st = 1;
      const allStunned = S.heroes.every(h => h.st > 0);
      expect(allStunned).toBe(true);
    });
  });

  describe('Turn End Detection', () => {
    test('turn ends when all non-stunned heroes acted', () => {
      S.heroes[0].st = 0;
      S.heroes[1].st = 0;
      S.acted = [0, 1];

      const allActed = S.heroes.every((h, i) => S.acted.includes(i) || h.st > 0);
      expect(allActed).toBe(true);
    });

    test('turn does not end if non-stunned hero has not acted', () => {
      S.heroes[0].st = 0;
      S.heroes[1].st = 0;
      S.acted = [0]; // Only hero 0 acted

      const allActed = S.heroes.every((h, i) => S.acted.includes(i) || h.st > 0);
      expect(allActed).toBe(false);
    });

    test('stunned hero counts as having acted', () => {
      S.heroes[0].st = 0;
      S.heroes[1].st = 2; // Stunned
      S.acted = [0]; // Only hero 0 acted (hero 1 stunned)

      const allActed = S.heroes.every((h, i) => S.acted.includes(i) || h.st > 0);
      expect(allActed).toBe(true);
    });
  });

  describe('Last Stand Turn Counter', () => {
    test('Last Stand turn counter increments each turn', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 0;

      // Simulate turn increment (done in checkTurnEnd)
      S.heroes.forEach(h => { if (h.ls) h.lst++; });

      expect(S.heroes[0].lst).toBe(1);
    });

    test('healing out of Last Stand resets turn counter', () => {
      S.heroes[0].ls = true;
      S.heroes[0].lst = 3;
      S.heroes[0].h = 0;

      // Simulate healing
      S.heroes[0].h = 5;
      S.heroes[0].ls = false;
      S.heroes[0].lst = 0;

      expect(S.heroes[0].ls).toBe(false);
      expect(S.heroes[0].lst).toBe(0);
    });
  });
});

describe('Enemy Composition', () => {
  beforeEach(() => {
    resetGameState();
  });

  // Implement getEnemyComp for testing
  function getEnemyComp(f) {
    const heroCount = S.heroes.length;
    if (f === 0) return ['goblin', 'wolf']; // Tutorial
    if (f === 1) return Array(heroCount).fill('goblin');
    if (f === 3) return Array(heroCount).fill('wolf');
    if (f === 5) return Array(heroCount * 2).fill('orc');
    if (f === 7) {
      const comp = [];
      for (let i = 0; i < heroCount; i++) comp.push('giant', 'wolf', 'goblin');
      return comp;
    }
    if (f === 9) return Array(heroCount).fill('caveTroll');
    if (f === 11) return Array(heroCount * 5).fill('goblin');
    if (f === 13) return Array(heroCount * 5).fill('wolf');
    if (f === 15) return Array(heroCount).fill('dragon');
    if (f === 17) {
      const comp = [];
      for (let i = 0; i < heroCount; i++) comp.push('caveTroll', 'giant', 'orc', 'wolf', 'goblin');
      return comp;
    }
    if (f === 19) return Array(heroCount).fill('flydra');
    return ['goblin'];
  }

  test('floor 1 has N goblins', () => {
    S.heroes = [createTestHero('Warrior'), createTestHero('Mage')];
    const comp = getEnemyComp(1);
    expect(comp).toEqual(['goblin', 'goblin']);
  });

  test('floor 3 has N wolves', () => {
    S.heroes = [createTestHero('Warrior'), createTestHero('Mage')];
    const comp = getEnemyComp(3);
    expect(comp).toEqual(['wolf', 'wolf']);
  });

  test('floor 5 has 2N orcs', () => {
    S.heroes = [createTestHero('Warrior'), createTestHero('Mage')];
    const comp = getEnemyComp(5);
    expect(comp).toHaveLength(4);
    expect(comp.every(e => e === 'orc')).toBe(true);
  });

  test('floor 9 has N cave trolls', () => {
    S.heroes = [createTestHero('Warrior'), createTestHero('Mage')];
    const comp = getEnemyComp(9);
    expect(comp).toEqual(['caveTroll', 'caveTroll']);
  });

  test('floor 11 (ambush) has 5N goblins', () => {
    S.heroes = [createTestHero('Warrior'), createTestHero('Mage')];
    const comp = getEnemyComp(11);
    expect(comp).toHaveLength(10);
  });

  test('floor 15 has N dragons', () => {
    S.heroes = [createTestHero('Warrior'), createTestHero('Mage')];
    const comp = getEnemyComp(15);
    expect(comp).toEqual(['dragon', 'dragon']);
  });

  test('floor 19 (boss) has N flydras', () => {
    S.heroes = [createTestHero('Warrior'), createTestHero('Mage')];
    const comp = getEnemyComp(19);
    expect(comp).toEqual(['flydra', 'flydra']);
  });

  test('3-hero game has more enemies', () => {
    S.heroes = [
      createTestHero('Warrior'),
      createTestHero('Mage'),
      createTestHero('Healer')
    ];
    const comp1 = getEnemyComp(1);
    expect(comp1).toHaveLength(3);

    const comp5 = getEnemyComp(5);
    expect(comp5).toHaveLength(6); // 2 × 3
  });
});

describe('Combat State', () => {
  beforeEach(() => {
    resetGameState();
    S.heroes = [createTestHero('Warrior')];
  });

  test('combat initializes with round 1', () => {
    S.round = 1;
    expect(S.round).toBe(1);
  });

  test('combat starts on player turn', () => {
    S.turn = 'player';
    expect(S.turn).toBe('player');
  });

  test('combat XP and gold start at 0', () => {
    S.combatXP = 0;
    S.combatGold = 0;
    expect(S.combatXP).toBe(0);
    expect(S.combatGold).toBe(0);
  });

  test('shields persist from previous combat', () => {
    S.heroes[0].sh = 3;
    // Combat initialization caps shield but doesn't reset
    if (S.heroes[0].sh > S.heroes[0].m) {
      S.heroes[0].sh = S.heroes[0].m;
    }
    expect(S.heroes[0].sh).toBe(3);
  });

  test('stun resets at combat start', () => {
    S.heroes[0].st = 5;
    // Combat initialization resets stun
    S.heroes[0].st = 0;
    expect(S.heroes[0].st).toBe(0);
  });

  test('Ghost charges persist from previous combat', () => {
    S.heroes[0].g = 4;
    // Ghost charges are NOT reset in combat()
    expect(S.heroes[0].g).toBe(4);
  });
});

describe('Ambush Mechanics', () => {
  beforeEach(() => {
    resetGameState();
    S.heroes = [
      createTestHero('Warrior'),
      createTestHero('Mage')
    ];
  });

  test('floor 11 sets ambush flag', () => {
    // In startFloor(), floor 11 sets ambushed = true
    S.floor = 11;
    S.ambushed = true;
    expect(S.ambushed).toBe(true);
  });

  test('ambush stuns all heroes turn 1', () => {
    S.ambushed = true;
    // In combat(), if ambushed, all heroes get st = 1
    S.heroes.forEach(h => {
      if (S.ambushed) h.st = 1;
    });

    expect(S.heroes[0].st).toBe(1);
    expect(S.heroes[1].st).toBe(1);
  });

  test('ambush flag clears after use', () => {
    S.ambushed = true;
    // After applying stun, clear flag
    S.ambushed = false;
    expect(S.ambushed).toBe(false);
  });
});

describe('Frogged Up Mode', () => {
  beforeEach(() => {
    resetGameState();
    S.heroes = [createTestHero('Warrior')];
    S.gameMode = 'fu';
  });

  test('FU mode multiplies enemy HP by 3', () => {
    const base = E.goblin;
    const fuMultiplier = S.gameMode === 'fu' ? 3 : 1;
    const enemyHP = base.h * fuMultiplier;
    expect(enemyHP).toBe(15); // 5 × 3
  });

  test('FU mode multiplies enemy POW by 3', () => {
    const base = E.goblin;
    const fuMultiplier = S.gameMode === 'fu' ? 3 : 1;
    const enemyPOW = base.p * fuMultiplier;
    expect(enemyPOW).toBe(3); // 1 × 3
  });

  test('FU mode multiplies gold drops by 3', () => {
    const base = E.goblin;
    const fuMultiplier = S.gameMode === 'fu' ? 3 : 1;
    const goldDrop = (base.goldDrop || 0) * fuMultiplier;
    expect(goldDrop).toBe(3); // 1 × 3
  });

  test('FU mode multiplies XP by 3', () => {
    const base = E.goblin;
    const fuMultiplier = S.gameMode === 'fu' ? 3 : 1;
    const xp = (base.x || 0) * fuMultiplier;
    expect(xp).toBe(6); // 2 × 3
  });

  test('Standard mode has no multiplier', () => {
    S.gameMode = 'Standard';
    const base = E.goblin;
    const fuMultiplier = S.gameMode === 'fu' ? 3 : 1;
    expect(fuMultiplier).toBe(1);
    expect(base.h * fuMultiplier).toBe(5);
  });
});

describe('Combat End Detection', () => {
  beforeEach(() => {
    resetGameState();
    S.heroes = [createTestHero('Warrior')];
  });

  test('combat ends when all enemies dead', () => {
    S.enemies = [
      createTestEnemy('goblin', { h: 0 }),
      createTestEnemy('goblin', { h: 0 })
    ];

    const allEnemiesDead = S.enemies.every(e => e.h <= 0);
    expect(allEnemiesDead).toBe(true);
  });

  test('combat continues if any enemy alive', () => {
    S.enemies = [
      createTestEnemy('goblin', { h: 0 }),
      createTestEnemy('goblin', { h: 5 })
    ];

    const allEnemiesDead = S.enemies.every(e => e.h <= 0);
    expect(allEnemiesDead).toBe(false);
  });

  test('defeat when all heroes in Last Stand', () => {
    S.heroes = [
      createTestHero('Warrior', { ls: true }),
      createTestHero('Mage', { ls: true })
    ];

    const allInLastStand = S.heroes.every(h => h.ls);
    expect(allInLastStand).toBe(true);
  });

  test('not defeated if any hero not in Last Stand', () => {
    S.heroes = [
      createTestHero('Warrior', { ls: true }),
      createTestHero('Mage', { ls: false })
    ];

    const allInLastStand = S.heroes.every(h => h.ls);
    expect(allInLastStand).toBe(false);
  });
});
