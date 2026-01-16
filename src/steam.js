// Steam Integration Module
// Provides achievement unlocking and Steam API features
// Works via IPC when running in Electron, gracefully degrades in browser

const Steam = {
  initialized: false,
  achievements: new Set(), // Track unlocked achievements locally

  // Achievement API names (must match Steam dashboard config)
  ACHIEVEMENTS: {
    // Tier 1: First Steps
    FIRST_LAUNCH: 'FIRST_LAUNCH',
    TUTORIAL_COMPLETE: 'TUTORIAL_COMPLETE',
    FLOOR_1_COMPLETE: 'FLOOR_1_COMPLETE',
    FIRST_DRAGON: 'FIRST_DRAGON',
    FIRST_DEATH: 'FIRST_DEATH',
    FIRST_UPGRADE: 'FIRST_UPGRADE',
    GOLD_100: 'GOLD_100',
    GOLD_1000: 'GOLD_1000',
    NEUTRAL_STAGE2_UNLOCK: 'NEUTRAL_STAGE2_UNLOCK',
    SIGILS_5_ON_HERO: 'SIGILS_5_ON_HERO',
    SIGIL_MAXED_RUN: 'SIGIL_MAXED_RUN',
    XP_100_FLOOR: 'XP_100_FLOOR',
    ALL_PASSIVES: 'ALL_PASSIVES',
    FIRST_STATUETTE: 'FIRST_STATUETTE',
    ALL_STATUETTES: 'ALL_STATUETTES',

    // Tier 2: Core Progression
    STAGE2_CLEAR: 'STAGE2_CLEAR',
    ALL_STAGE2_UNLOCK: 'ALL_STAGE2_UNLOCK',
    ALL_STAGE2_CLEAR: 'ALL_STAGE2_CLEAR',
    ALL_SIGILS_L1: 'ALL_SIGILS_L1',
    SIGIL_MAXED_PERM: 'SIGIL_MAXED_PERM',
    ALL_SIGILS_MAXED: 'ALL_SIGILS_MAXED',
    MEET_GHOST_BOYS: 'MEET_GHOST_BOYS',
    WIN_ALL_HEROES: 'WIN_ALL_HEROES',

    // Tier 3: Challenge & Mastery
    RAPID_FIRE_20: 'RAPID_FIRE_20',
    GHOST_MAXED: 'GHOST_MAXED',
    AMBUSH_UNTOUCHABLE: 'AMBUSH_UNTOUCHABLE',
    BESTIARY_COMPLETE: 'BESTIARY_COMPLETE',

    // Tier 4: Prestige
    FIRST_STAND: 'FIRST_STAND',

    // Hidden/Secret
    GHOST_BOYS_REALIZE: 'GHOST_BOYS_REALIZE',

    // FU Mode
    FU_FLOOR_CLEAR: 'FU_FLOOR_CLEAR',
    RECRUITS_3: 'RECRUITS_3',
    FU_COMPLETE: 'FU_COMPLETE',
    FU_TAPO: 'FU_TAPO',
    FU_TRIPLE_TAPO: 'FU_TRIPLE_TAPO'
  },

  // Initialize Steam - call from electron-main via preload
  init() {
    // Check if we're in Electron with Steam bridge
    if (window.steamBridge) {
      this.initialized = window.steamBridge.initialized;
      if (this.initialized) {
        console.log('[Steam] Connected to Steam API');
        // Load already-unlocked achievements from Steam
        this.syncAchievements();
      }
    } else {
      console.log('[Steam] Running in browser mode - achievements disabled');
    }
    return this.initialized;
  },

  // Sync achievements from Steam (so we don't re-unlock)
  syncAchievements() {
    if (!this.initialized || !window.steamBridge) return;
    try {
      const unlocked = window.steamBridge.getUnlockedAchievements();
      if (unlocked && Array.isArray(unlocked)) {
        unlocked.forEach(a => this.achievements.add(a));
        console.log(`[Steam] Synced ${unlocked.length} achievements`);
      }
    } catch (e) {
      console.warn('[Steam] Failed to sync achievements:', e);
    }
  },

  // Unlock an achievement
  unlock(achievementId) {
    // Already unlocked locally? Skip
    if (this.achievements.has(achievementId)) {
      return false;
    }

    // Mark as unlocked locally (prevents duplicate calls)
    this.achievements.add(achievementId);

    // If Steam is connected, unlock via API
    if (this.initialized && window.steamBridge) {
      try {
        const result = window.steamBridge.unlockAchievement(achievementId);
        if (result) {
          console.log(`[Steam] Achievement unlocked: ${achievementId}`);
        }
        return result;
      } catch (e) {
        console.warn(`[Steam] Failed to unlock ${achievementId}:`, e);
        return false;
      }
    }

    // Not in Steam - just log it
    console.log(`[Steam] Achievement (offline): ${achievementId}`);
    return false;
  },

  // Check if achievement is unlocked
  isUnlocked(achievementId) {
    return this.achievements.has(achievementId);
  },

  // Get Steam user info (display name, Steam ID)
  getUserInfo() {
    if (!this.initialized || !window.steamBridge) {
      return null;
    }
    try {
      return window.steamBridge.getUserInfo();
    } catch (e) {
      return null;
    }
  },

  // Clear an achievement (for testing only)
  clearAchievement(achievementId) {
    if (!this.initialized || !window.steamBridge) return false;
    try {
      this.achievements.delete(achievementId);
      return window.steamBridge.clearAchievement(achievementId);
    } catch (e) {
      return false;
    }
  },

  // Clear ALL achievements (for testing only)
  clearAllAchievements() {
    if (!this.initialized || !window.steamBridge) return false;
    try {
      this.achievements.clear();
      return window.steamBridge.clearAllAchievements();
    } catch (e) {
      return false;
    }
  },

  // ============================================
  // STATS API
  // ============================================

  // Stat names (must match Steam dashboard config)
  STATS: {
    TOTAL_RUNS: 'total_runs',
    TOTAL_WINS: 'total_wins',
    TOTAL_DEATHS: 'total_deaths',
    TOTAL_GOLD_EARNED: 'total_gold_earned',
    TOTAL_XP_EARNED: 'total_xp_earned',
    TOTAL_ENEMIES_KILLED: 'total_enemies_killed',
    TOTAL_DRAGONS_KILLED: 'total_dragons_killed',
    TOTAL_FLYDRAS_KILLED: 'total_flydras_killed',
    HIGHEST_FLOOR: 'highest_floor',
    FASTEST_WIN_SECONDS: 'fastest_win_seconds',
    TOTAL_DAMAGE_DEALT: 'total_damage_dealt',
    TOTAL_HEALING_DONE: 'total_healing_done',
    TOTAL_SHIELD_GRANTED: 'total_shield_granted',
    TOTAL_D20_ROLLS: 'total_d20_rolls',
    TOTAL_RECRUITS: 'total_recruits',
    FU_WINS: 'fu_wins'
  },

  // Set a stat value
  setStat(statName, value) {
    if (!this.initialized || !window.steamBridge) {
      console.log(`[Steam] Stat (offline): ${statName} = ${value}`);
      return false;
    }
    try {
      return window.steamBridge.setStat(statName, value);
    } catch (e) {
      console.warn(`[Steam] Failed to set stat ${statName}:`, e);
      return false;
    }
  },

  // Get a stat value
  getStat(statName) {
    if (!this.initialized || !window.steamBridge) return 0;
    try {
      return window.steamBridge.getStat(statName);
    } catch (e) {
      return 0;
    }
  },

  // Increment a stat by amount (convenience method)
  incrementStat(statName, amount = 1) {
    const current = this.getStat(statName);
    return this.setStat(statName, current + amount);
  },

  // Set stat only if new value is higher (for high scores)
  setStatIfHigher(statName, value) {
    const current = this.getStat(statName);
    if (value > current) {
      return this.setStat(statName, value);
    }
    return false;
  },

  // Set stat only if new value is lower (for speed records)
  setStatIfLower(statName, value) {
    const current = this.getStat(statName);
    if (current === 0 || value < current) {
      return this.setStat(statName, value);
    }
    return false;
  },

  // Store stats to Steam (call after batch updates)
  storeStats() {
    if (!this.initialized || !window.steamBridge) return false;
    try {
      return window.steamBridge.storeStats();
    } catch (e) {
      return false;
    }
  },

  // ============================================
  // CLOUD SAVE API
  // ============================================

  // Cloud save file name
  CLOUD_SAVE_FILE: 'froggle_save.json',

  // Save game data to Steam Cloud
  cloudSave(data) {
    if (!this.initialized || !window.steamBridge) {
      console.log('[Steam] Cloud save (offline) - using localStorage only');
      return false;
    }
    try {
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
      const result = window.steamBridge.cloudSave(this.CLOUD_SAVE_FILE, jsonStr);
      if (result) {
        console.log('[Steam] Cloud save successful');
      }
      return result;
    } catch (e) {
      console.warn('[Steam] Cloud save failed:', e);
      return false;
    }
  },

  // Load game data from Steam Cloud
  cloudLoad() {
    if (!this.initialized || !window.steamBridge) {
      console.log('[Steam] Cloud load (offline) - using localStorage only');
      return null;
    }
    try {
      const data = window.steamBridge.cloudLoad(this.CLOUD_SAVE_FILE);
      if (data) {
        console.log('[Steam] Cloud load successful');
        return JSON.parse(data);
      }
      return null;
    } catch (e) {
      console.warn('[Steam] Cloud load failed:', e);
      return null;
    }
  },

  // Check if cloud save exists
  cloudExists() {
    if (!this.initialized || !window.steamBridge) return false;
    try {
      return window.steamBridge.cloudExists(this.CLOUD_SAVE_FILE);
    } catch (e) {
      return false;
    }
  },

  // Delete cloud save (for testing/reset)
  cloudDelete() {
    if (!this.initialized || !window.steamBridge) return false;
    try {
      return window.steamBridge.cloudDelete(this.CLOUD_SAVE_FILE);
    } catch (e) {
      return false;
    }
  },

  // Get cloud storage quota info
  cloudQuota() {
    if (!this.initialized || !window.steamBridge) return null;
    try {
      return window.steamBridge.cloudQuota();
    } catch (e) {
      return null;
    }
  }
};

// Make available globally
window.Steam = Steam;
