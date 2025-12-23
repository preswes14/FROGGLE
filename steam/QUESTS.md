# Quest Board System

The Quest Board is a passive progression system that rewards players for completing game milestones. Quests are **not accepted** - they're always active and can be **turned in** once completed, even if the player hasn't viewed the quest board.

## Design Principles

1. **Non-overwhelming**: Quests unlock gradually as players progress
2. **Learning-focused**: Early quests teach core mechanics
3. **Gold rewards only**: All rewards are gold, scaling with difficulty
4. **No acceptance required**: Progress counts even before viewing quests
5. **Mix of one-time and repeatable**: Some quests reset with scaling requirements

---

## Quest Categories

### Learning Quests (Always Available)
These appear immediately and teach basic mechanics.

| Quest | Condition | Reward | Purpose |
|-------|-----------|--------|---------|
| First Blood | Kill 1 enemy | 5G | Basic combat |
| Tactical Roller | Use D20 once | 5G | Core mechanic |
| Shield Bearer | Apply shield to any hero | 5G | Defensive play |
| Healer's Touch | Heal any hero | 5G | Support play |
| Survivor | Reach Floor 3 | 10G | Progression basics |
| Battle Hardened | Reach Floor 5 | 15G | Early milestone |

### Hero Exploration (Unlock: After 1 run)
Encourages trying different heroes.

| Quest | Condition | Reward |
|-------|-----------|--------|
| Warrior's Path | Play a run with Warrior | 10G |
| Tank's Path | Play a run with Tank | 10G |
| Mage's Path | Play a run with Mage | 10G |
| Healer's Path | Play a run with Healer | 10G |
| Diverse Squad | Play runs with all 4 base heroes | 25G |
| Champion: Warrior | Win a run with Warrior | 25G |
| Champion: Tank | Win a run with Tank | 25G |
| Champion: Mage | Win a run with Mage | 25G |
| Champion: Healer | Win a run with Healer | 25G |
| Army of Frogs | Win runs with all 4 base heroes | 50G |

### Neutral Exploration (Unlock: After Floor 2)
Encourages exploring neutral encounters.

| Quest | Condition | Reward |
|-------|-----------|--------|
| The Shop | Complete Shopkeeper encounter | 10G |
| Make a Wish | Complete Wishing Well encounter | 10G |
| Treasure Hunter | Complete Treasure Chest encounter | 10G |
| Wizard's Test | Complete Wizard encounter | 10G |
| Oracle's Wisdom | Complete Oracle encounter | 10G |
| Camp Visitor | Complete Encampment encounter | 10G |
| High Roller | Complete Gambling Den encounter | 10G |
| Ghost Whisperer | Complete Ghost Boys encounter | 10G |
| Royal Audience | Complete Royal Court encounter | 10G |
| Neutral Explorer | Complete all Stage 1 neutrals | 40G |

### Progression Milestones (Unlock: Gradually)

| Quest | Condition | Reward | Unlock |
|-------|-----------|--------|--------|
| Dragon Slayer | Defeat a Dragon | 20G | Floor 10+ |
| Flydra Hunter | Defeat a Flydra head | 25G | Floor 15+ |
| Flydra Conqueror | Defeat all Flydra heads in one battle | 50G | Floor 15+ |
| First Victory | Complete Floor 20 (Standard) | 100G | Always |
| Eternal Power | Purchase first permanent upgrade | 15G | After death |
| Spreading the Wealth | Upgrade all sigils to L1 | 50G | After 5 upgrades |
| Sigil Master | Max out any sigil permanently | 75G | After 10 upgrades |

### Combat Mastery (Unlock: After Floor 10)

| Quest | Condition | Reward |
|-------|-----------|--------|
| Combo Striker | Deal 10+ damage in one action | 15G |
| Multi-Target | Hit 3+ targets with one action | 15G |
| Ghost Walk | Block damage with Ghost charges | 15G |
| Perfect Shield | Block 10+ damage with shields | 15G |
| Grappler | Successfully stun an enemy | 15G |
| Alpha Strike | Grant bonus actions with Alpha | 15G |
| Last Stand Hero | Survive a round in Last Stand | 20G |

### Repeatable/Scaling Quests (Unlock: After Floor 10)
These reset after completion with higher requirements.

| Quest Tier | Enemies Killed | Reward |
|------------|----------------|--------|
| Slayer I | 25 | 25G |
| Slayer II | 100 | 50G |
| Slayer III | 250 | 75G |
| Slayer IV | 500 | 100G |
| Slayer V | 1000 | 150G |

| Quest Tier | Gold Earned | Reward |
|------------|-------------|--------|
| Gold Digger I | 250 | 25G |
| Gold Digger II | 1000 | 50G |
| Gold Digger III | 2500 | 75G |
| Gold Digger IV | 5000 | 100G |

| Quest Tier | Runs Completed | Reward |
|------------|----------------|--------|
| Veteran I | 5 | 25G |
| Veteran II | 15 | 50G |
| Veteran III | 30 | 75G |
| Veteran IV | 50 | 100G |

### FU Mode Quests (Unlock: After FU unlock)

| Quest | Condition | Reward |
|-------|-----------|--------|
| This is Frogged Up | Complete Floor 1 in FU mode | 25G |
| Recruiter | Recruit an enemy | 25G |
| Squad Goals | Have 3 recruits at once | 50G |
| FU Champion | Complete FU mode | 150G |

### Secret/Hidden Quests

| Quest | Condition | Reward |
|-------|-----------|--------|
| Tapo's Hero | Unlock Tapo | 100G |
| Bruce & Willis | Help Ghost Boys realize something | 25G |
| True Champion | Win FU mode with Tapo | 200G |

---

## Implementation Notes

### Tracked Stats (in S.questProgress)
```javascript
questProgress: {
  // Combat stats
  enemiesKilled: 0,
  totalDamageDealt: 0,

  // Action usage
  d20Used: false,
  shieldApplied: false,
  healUsed: false,
  grappleUsed: false,
  alphaUsed: false,
  ghostBlocked: false,

  // Per-hero tracking
  heroesPlayed: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },
  heroWins: { Warrior: 0, Tank: 0, Mage: 0, Healer: 0, Tapo: 0 },

  // Neutral encounters completed (by base name)
  neutralsCompleted: {
    shopkeeper: false, wishingwell: false, treasurechest: false,
    wizard: false, oracle: false, encampment: false,
    gambling: false, ghost: false, royal: false
  },

  // Enemy types defeated
  enemyTypesDefeated: {
    Goblin: false, Wolf: false, Orc: false, Giant: false,
    'Cave Troll': false, Dragon: false, Flydra: false
  },

  // Milestones
  highestFloor: 0,
  totalGoldEarned: 0,
  totalRunsCompleted: 0,
  standardWins: 0,
  fuWins: 0,
  recruitsHeld: 0,

  // Repeatable quest progress
  slayerTier: 0,
  goldDiggerTier: 0,
  veteranTier: 0
}
```

### Completed Quests (in S.questsCompleted)
```javascript
questsCompleted: {
  'first_blood': true,
  'tactical_roller': true,
  // ... quest IDs
}
```

### Quest Visibility
Quests should be grouped in the UI by category, with locked categories showing a preview of what's to come.

---

## UI Location

The Quest Board appears as a **bulletin board icon** in the bottom-center of Ribbleton hub. It's visible from the start (before first run) so players can see goals before choosing heroes.

Notification badge shows count of claimable rewards.
