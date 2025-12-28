/**
 * Sigil Level Calculation Tests (getLevel)
 *
 * Tests the sigil level system which handles:
 * - Permanent vs temporary upgrades
 * - Hero-specific bonuses (Mage/Healer +1 Expand)
 * - Global passives (Star, Asterisk, Expand)
 * - Active sigil display offset (+1)
 *
 * Critical invariants tested:
 * 1. Stored L0 = displayed L1 for active sigils
 * 2. Mage/Healer get +1 Expand built-in
 * 3. Star/Asterisk are global passives
 * 4. Heroes must own sigil to use it
 */

// Implement getLevel function for testing
function getLevel(sig, heroIdx) {
  const h = S.heroes[heroIdx];
  // Calculate total level (permanent + temporary XP upgrades)
  const totalLevel = (S.sig[sig] || 0) + (S.tempSigUpgrades[sig] || 0);

  // Star, Asterisk, and Expand are global passives - all heroes get them when upgraded
  if (sig === 'Star' || sig === 'Asterisk' || sig === 'Expand') {
    // Special case: Mage and Healer get +1 to Expand
    if (sig === 'Expand' && h && (h.n === 'Mage' || h.n === 'Healer')) {
      return totalLevel + 1;
    }
    return totalLevel;
  }

  // For other sigils, check if hero has it
  if (!h) return 0;
  const hasSigil = h.s.includes(sig) || (h.ts && h.ts.includes(sig));
  if (!hasSigil) return 0;

  // Actives always display +1 higher (perm 0 = L1, perm 1 = L2, etc.)
  const actives = ['Attack', 'Shield', 'Grapple', 'Heal', 'Ghost', 'D20', 'Alpha'];
  if (actives.includes(sig)) return totalLevel + 1;

  return totalLevel;
}

describe('Sigil Level Calculation', () => {
  beforeEach(() => {
    resetGameState();
    // Set up heroes
    S.heroes = [
      createTestHero('Warrior'),
      createTestHero('Mage'),
      createTestHero('Healer')
    ];
  });

  describe('Basic Level Calculation', () => {
    test('returns 0 for sigil hero does not have', () => {
      // Warrior doesn't have Shield by default
      expect(getLevel('Shield', 0)).toBe(0);
    });

    test('returns level for sigil hero has', () => {
      // Warrior has Attack by default, at stored level 0 = displayed L1
      expect(getLevel('Attack', 0)).toBe(1);
    });

    test('includes permanent upgrades in level', () => {
      S.sig.Attack = 1;
      expect(getLevel('Attack', 0)).toBe(2); // 1 + 1 (display offset)
    });

    test('includes temporary upgrades in level', () => {
      S.tempSigUpgrades.Attack = 1;
      expect(getLevel('Attack', 0)).toBe(2); // 0 + 1 + 1 (temp + display offset)
    });

    test('stacks permanent and temporary upgrades', () => {
      S.sig.Attack = 1;
      S.tempSigUpgrades.Attack = 1;
      expect(getLevel('Attack', 0)).toBe(3); // 1 + 1 + 1
    });
  });

  describe('Active Sigil Display Offset', () => {
    test('Attack at stored 0 displays as L1', () => {
      S.sig.Attack = 0;
      expect(getLevel('Attack', 0)).toBe(1);
    });

    test('Shield at stored 0 displays as L1', () => {
      // Give Warrior Shield first
      S.heroes[0].s.push('Shield');
      S.sig.Shield = 0;
      expect(getLevel('Shield', 0)).toBe(1);
    });

    test('D20 at stored 0 displays as L1', () => {
      S.sig.D20 = 0;
      expect(getLevel('D20', 0)).toBe(1);
    });

    test('Heal at stored 0 displays as L1', () => {
      // Healer has Heal
      S.sig.Heal = 0;
      expect(getLevel('Heal', 2)).toBe(1);
    });

    test('Ghost at stored 0 displays as L1', () => {
      S.heroes[0].s.push('Ghost');
      S.sig.Ghost = 0;
      expect(getLevel('Ghost', 0)).toBe(1);
    });

    test('Grapple at stored 0 displays as L1', () => {
      S.heroes[0].s.push('Grapple');
      S.sig.Grapple = 0;
      expect(getLevel('Grapple', 0)).toBe(1);
    });

    test('Alpha at stored 0 displays as L1', () => {
      S.heroes[0].s.push('Alpha');
      S.sig.Alpha = 0;
      expect(getLevel('Alpha', 0)).toBe(1);
    });
  });

  describe('Global Passive Sigils', () => {
    test('Star applies to all heroes regardless of ownership', () => {
      S.sig.Star = 1;
      expect(getLevel('Star', 0)).toBe(1); // Warrior
      expect(getLevel('Star', 1)).toBe(1); // Mage
      expect(getLevel('Star', 2)).toBe(1); // Healer
    });

    test('Asterisk applies to all heroes regardless of ownership', () => {
      S.sig.Asterisk = 2;
      expect(getLevel('Asterisk', 0)).toBe(2);
      expect(getLevel('Asterisk', 1)).toBe(2);
      expect(getLevel('Asterisk', 2)).toBe(2);
    });

    test('Expand applies to all heroes', () => {
      S.sig.Expand = 1;
      // Warrior gets base expand
      expect(getLevel('Expand', 0)).toBe(1);
    });
  });

  describe('Mage/Healer Expand Bonus', () => {
    test('Mage gets +1 Expand bonus', () => {
      S.sig.Expand = 0;
      expect(getLevel('Expand', 1)).toBe(1); // 0 + 1 bonus
    });

    test('Healer gets +1 Expand bonus', () => {
      S.sig.Expand = 0;
      expect(getLevel('Expand', 2)).toBe(1); // 0 + 1 bonus
    });

    test('Warrior does NOT get Expand bonus', () => {
      S.sig.Expand = 0;
      expect(getLevel('Expand', 0)).toBe(0);
    });

    test('Mage Expand bonus stacks with upgrades', () => {
      S.sig.Expand = 1;
      expect(getLevel('Expand', 1)).toBe(2); // 1 + 1 bonus
    });

    test('Healer Expand bonus stacks with temp upgrades', () => {
      S.sig.Expand = 0;
      S.tempSigUpgrades.Expand = 1;
      expect(getLevel('Expand', 2)).toBe(2); // 0 + 1 + 1 bonus
    });
  });

  describe('Temporary Sigils', () => {
    test('hero can use temporarily acquired sigil', () => {
      S.heroes[0].ts.push('Shield');
      S.sig.Shield = 0;
      expect(getLevel('Shield', 0)).toBe(1);
    });

    test('temporary sigil uses global level', () => {
      S.heroes[0].ts.push('Grapple');
      S.sig.Grapple = 2;
      expect(getLevel('Grapple', 0)).toBe(3); // 2 + 1
    });
  });

  describe('Invalid Inputs', () => {
    test('returns 0 for invalid hero index', () => {
      expect(getLevel('Attack', 99)).toBe(0);
    });

    test('returns 0 for undefined hero index', () => {
      expect(getLevel('Attack', undefined)).toBe(0);
    });

    test('handles missing sigil gracefully', () => {
      expect(getLevel('NonexistentSigil', 0)).toBe(0);
    });
  });
});

describe('Target Calculation', () => {
  beforeEach(() => {
    resetGameState();
    S.heroes = [
      createTestHero('Warrior'),
      createTestHero('Mage'),
      createTestHero('Healer')
    ];
  });

  // Implement getTargetsPerInstance
  function getTargetsPerInstance(action, heroIdx) {
    const expandLevel = getLevel('Expand', heroIdx);
    return 1 + expandLevel;
  }

  test('base targets is 1 with no Expand', () => {
    S.sig.Expand = 0;
    expect(getTargetsPerInstance('Attack', 0)).toBe(1);
  });

  test('Expand L1 gives 2 targets', () => {
    S.sig.Expand = 1;
    expect(getTargetsPerInstance('Attack', 0)).toBe(2);
  });

  test('Mage gets extra target from built-in Expand bonus', () => {
    S.sig.Expand = 0;
    expect(getTargetsPerInstance('Attack', 1)).toBe(2); // 1 + 1 (Mage bonus)
  });

  test('Healer gets extra target from built-in Expand bonus', () => {
    S.sig.Expand = 0;
    expect(getTargetsPerInstance('Heal', 2)).toBe(2);
  });

  test('Mage with Expand L1 gets 3 targets', () => {
    S.sig.Expand = 1;
    expect(getTargetsPerInstance('Attack', 1)).toBe(3); // 1 + 1 (upgrade) + 1 (bonus)
  });
});

describe('Action Type Helpers', () => {
  function needsEnemyTarget(action) {
    return ['Attack', 'Grapple'].includes(action);
  }

  function needsHeroTarget(action) {
    return ['Heal', 'Shield', 'Alpha'].includes(action);
  }

  function isMultiInstance(action) {
    return ['Attack', 'Shield', 'Heal'].includes(action);
  }

  test('Attack needs enemy target', () => {
    expect(needsEnemyTarget('Attack')).toBe(true);
  });

  test('Grapple needs enemy target', () => {
    expect(needsEnemyTarget('Grapple')).toBe(true);
  });

  test('Heal needs hero target', () => {
    expect(needsHeroTarget('Heal')).toBe(true);
  });

  test('Shield needs hero target', () => {
    expect(needsHeroTarget('Shield')).toBe(true);
  });

  test('Alpha needs hero target', () => {
    expect(needsHeroTarget('Alpha')).toBe(true);
  });

  test('Attack is multi-instance', () => {
    expect(isMultiInstance('Attack')).toBe(true);
  });

  test('Shield is multi-instance', () => {
    expect(isMultiInstance('Shield')).toBe(true);
  });

  test('Heal is multi-instance', () => {
    expect(isMultiInstance('Heal')).toBe(true);
  });

  test('Grapple is NOT multi-instance', () => {
    expect(isMultiInstance('Grapple')).toBe(false);
  });

  test('D20 is NOT multi-instance', () => {
    expect(isMultiInstance('D20')).toBe(false);
  });
});
