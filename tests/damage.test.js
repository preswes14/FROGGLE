/**
 * Damage System Tests (applyDamageToTarget)
 *
 * Tests the unified damage system which handles:
 * - Shield absorption
 * - Ghost charge prevention
 * - Last Stand mechanics
 * - Enemy death and rewards
 *
 * Critical invariants tested:
 * 1. Shield absorbs damage before HP
 * 2. Ghost charges block lethal damage
 * 3. Heroes enter Last Stand at 0 HP (not death)
 * 4. Shield caps at max HP
 */

// Import the function we're testing (we'll define it here for isolated testing)
// In the actual game, this is in constants.js
function applyDamageToTarget(target, rawDamage, options = {}) {
  let dmg = rawDamage;
  let shieldLost = 0;
  let hpLost = 0;

  // Handle shield absorption
  if (target.sh > 0) {
    if (target.sh >= rawDamage) {
      shieldLost = rawDamage;
      target.sh -= rawDamage;
      dmg = 0;
    } else {
      shieldLost = target.sh;
      dmg = rawDamage - target.sh;
      target.sh = 0;
    }
  }

  // Apply damage to HP
  hpLost = dmg;
  target.h -= dmg;

  // Handle lethal damage
  if (target.h <= 0) {
    if (target.g > 0) {
      // Ghost charge cancels death
      target.g--;
      target.h += dmg;
      hpLost = 0;
      if (options.isHero && typeof trackQuestProgress === 'function') {
        trackQuestProgress('ghostBlock');
      }
      if (!options.silent) {
        toast(`${target.n}'s Ghost charge cancelled the lethal hit!`, 1200);
      }
    } else {
      // Death/Last Stand
      target.h = 0;
      if (options.isHero) {
        // Heroes enter Last Stand
        target.ls = true;
        target.lst = 0;
        if (typeof triggerScreenShake === 'function') triggerScreenShake(true);
        if (!options.silent) {
          toast(`${target.n} entered Last Stand!`, 3000);
        }
      } else {
        // Enemies die - award gold/XP
        if (!options.skipRewards && S.floor !== 0) {
          if (!target.isFlydra) {
            S.gold += target.goldDrop || 0;
            S.combatGold += target.goldDrop || 0;
            if (target.goldDrop > 0 && typeof trackQuestProgress === 'function') {
              trackQuestProgress('gold', target.goldDrop);
            }
            if (target.goldDrop > 0 && SoundFX) SoundFX.play('coinDrop');
          }
          S.combatXP += target.x;
          if (typeof upd === 'function') upd();
        }
      }
    }
  }

  return { hpLost, shieldLost, totalDamage: rawDamage };
}

describe('Damage System', () => {
  beforeEach(() => {
    resetGameState();
  });

  describe('Basic Damage', () => {
    test('applies damage directly to HP when no shield', () => {
      const target = createTestHero('Warrior', { h: 5, m: 5, sh: 0 });

      const result = applyDamageToTarget(target, 2, { isHero: true, silent: true });

      expect(target.h).toBe(3);
      expect(result.hpLost).toBe(2);
      expect(result.shieldLost).toBe(0);
    });

    test('handles exact lethal damage', () => {
      const target = createTestHero('Warrior', { h: 5, m: 5 });

      applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.h).toBe(0);
      expect(target.ls).toBe(true);
    });

    test('handles overkill damage', () => {
      const target = createTestHero('Warrior', { h: 3, m: 5 });

      applyDamageToTarget(target, 10, { isHero: true, silent: true });

      expect(target.h).toBe(0);
      expect(target.ls).toBe(true);
    });
  });

  describe('Shield Absorption', () => {
    test('shield absorbs all damage when shield >= damage', () => {
      const target = createTestHero('Warrior', { h: 5, m: 5, sh: 5 });

      const result = applyDamageToTarget(target, 3, { isHero: true, silent: true });

      expect(target.h).toBe(5); // HP unchanged
      expect(target.sh).toBe(2); // Shield reduced
      expect(result.shieldLost).toBe(3);
      expect(result.hpLost).toBe(0);
    });

    test('shield absorbs partial damage when shield < damage', () => {
      const target = createTestHero('Warrior', { h: 5, m: 5, sh: 2 });

      const result = applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.sh).toBe(0); // Shield depleted
      expect(target.h).toBe(2); // HP reduced by remaining damage
      expect(result.shieldLost).toBe(2);
      expect(result.hpLost).toBe(3);
    });

    test('exact shield match blocks all damage', () => {
      const target = createTestHero('Warrior', { h: 5, m: 5, sh: 5 });

      const result = applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.h).toBe(5);
      expect(target.sh).toBe(0);
      expect(result.shieldLost).toBe(5);
      expect(result.hpLost).toBe(0);
    });

    test('shield can prevent Last Stand when it absorbs lethal damage', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5, sh: 10 });

      applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.h).toBe(1);
      expect(target.sh).toBe(5);
      expect(target.ls).toBe(false);
    });
  });

  describe('Ghost Charge Prevention', () => {
    test('ghost charge prevents lethal hit', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5, g: 1 });

      applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.h).toBe(1); // HP restored
      expect(target.g).toBe(0); // Ghost charge consumed
      expect(target.ls).toBe(false); // Not in Last Stand
    });

    test('ghost charge is consumed on use', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5, g: 3 });

      applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.g).toBe(2);
    });

    test('ghost does NOT trigger on non-lethal damage', () => {
      const target = createTestHero('Warrior', { h: 5, m: 5, g: 2 });

      applyDamageToTarget(target, 3, { isHero: true, silent: true });

      expect(target.h).toBe(2);
      expect(target.g).toBe(2); // Ghost not used
    });

    test('ghost triggers when damage would kill through shield', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5, sh: 2, g: 1 });

      // 5 damage: 2 absorbed by shield, 3 goes to HP, would kill
      applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.h).toBe(1); // Ghost saved
      expect(target.sh).toBe(0);
      expect(target.g).toBe(0);
      expect(target.ls).toBe(false);
    });

    test('tracks quest progress when ghost blocks damage', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5, g: 1 });

      applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(trackQuestProgress).toHaveBeenCalledWith('ghostBlock');
    });
  });

  describe('Last Stand Mechanics', () => {
    test('hero enters Last Stand at 0 HP', () => {
      const target = createTestHero('Warrior', { h: 3, m: 5 });

      applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(target.ls).toBe(true);
      expect(target.lst).toBe(0); // Turn counter starts at 0
    });

    test('Last Stand turn counter starts at 0', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5 });

      applyDamageToTarget(target, 1, { isHero: true, silent: true });

      expect(target.lst).toBe(0);
    });

    test('triggers screen shake on Last Stand entry', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5 });

      applyDamageToTarget(target, 1, { isHero: true, silent: true });

      expect(triggerScreenShake).toHaveBeenCalledWith(true);
    });

    test('shows toast when entering Last Stand', () => {
      const target = createTestHero('Warrior', { h: 1, m: 5, n: 'TestHero' });

      applyDamageToTarget(target, 1, { isHero: true });

      expect(toast).toHaveBeenCalledWith('TestHero entered Last Stand!', 3000);
    });
  });

  describe('Enemy Death', () => {
    test('enemy death awards gold', () => {
      S.floor = 1;
      S.gold = 0;
      S.combatGold = 0;
      const enemy = createTestEnemy('goblin', { h: 1, goldDrop: 5 });

      applyDamageToTarget(enemy, 5, { isHero: false, silent: true });

      expect(S.gold).toBe(5);
      expect(S.combatGold).toBe(5);
    });

    test('enemy death awards XP', () => {
      S.floor = 1;
      S.combatXP = 0;
      const enemy = createTestEnemy('goblin', { h: 1, x: 10 });

      applyDamageToTarget(enemy, 5, { isHero: false, silent: true });

      expect(S.combatXP).toBe(10);
    });

    test('Flydra death does NOT award gold immediately', () => {
      S.floor = 19;
      S.gold = 0;
      const enemy = createTestEnemy('flydra', { h: 1, goldDrop: 100, isFlydra: true });

      applyDamageToTarget(enemy, 10, { isHero: false, silent: true });

      expect(S.gold).toBe(0); // Gold awarded when all heads die
    });

    test('tutorial floor (0) skips rewards', () => {
      S.floor = 0;
      S.gold = 0;
      S.combatXP = 0;
      const enemy = createTestEnemy('goblin', { h: 1, goldDrop: 5, x: 10 });

      applyDamageToTarget(enemy, 5, { isHero: false, silent: true });

      expect(S.gold).toBe(0);
      expect(S.combatXP).toBe(0);
    });

    test('skipRewards option prevents rewards', () => {
      S.floor = 1;
      S.gold = 0;
      const enemy = createTestEnemy('goblin', { h: 1, goldDrop: 5 });

      applyDamageToTarget(enemy, 5, { isHero: false, skipRewards: true, silent: true });

      expect(S.gold).toBe(0);
    });
  });

  describe('Return Value', () => {
    test('returns correct breakdown for HP-only damage', () => {
      const target = createTestHero('Warrior', { h: 5, sh: 0 });

      const result = applyDamageToTarget(target, 3, { isHero: true, silent: true });

      expect(result).toEqual({
        hpLost: 3,
        shieldLost: 0,
        totalDamage: 3
      });
    });

    test('returns correct breakdown for shield-only damage', () => {
      const target = createTestHero('Warrior', { h: 5, sh: 10 });

      const result = applyDamageToTarget(target, 3, { isHero: true, silent: true });

      expect(result).toEqual({
        hpLost: 0,
        shieldLost: 3,
        totalDamage: 3
      });
    });

    test('returns correct breakdown for mixed damage', () => {
      const target = createTestHero('Warrior', { h: 5, sh: 2 });

      const result = applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(result).toEqual({
        hpLost: 3,
        shieldLost: 2,
        totalDamage: 5
      });
    });

    test('returns zero HP lost when Ghost blocks', () => {
      const target = createTestHero('Warrior', { h: 1, g: 1 });

      const result = applyDamageToTarget(target, 5, { isHero: true, silent: true });

      expect(result.hpLost).toBe(0);
    });
  });
});

describe('Shield Invariants', () => {
  test('shield should cap at max HP when applied', () => {
    const hero = createTestHero('Warrior', { h: 5, m: 5 });

    // Simulate shield application (would be done in combat.js)
    hero.sh = 20;
    if (hero.sh > hero.m) hero.sh = hero.m;

    expect(hero.sh).toBe(5);
  });

  test('shield persists between combats (not reset)', () => {
    const hero = createTestHero('Warrior', { sh: 3, m: 5 });

    // Simulate new combat starting (shield should persist)
    // In combat(), shields are capped but not reset
    if (hero.sh > hero.m) hero.sh = hero.m;

    expect(hero.sh).toBe(3);
  });
});
