// ===== SOUND EFFECTS SYSTEM (Web Audio API) =====
const SoundFX = {
  ctx: null,
  enabled: true,
  volume: 0.3,
  musicVolume: 0.2,
  audioBuffers: {},  // Cache for loaded audio files
  currentMusic: null, // Currently playing music source
  musicGain: null,    // Gain node for music volume control

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Create music gain node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);
    } catch(e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  },

  // Load an audio file from URL or base64 data
  async loadAudio(name, source) {
    if (!this.ctx) this.init();
    if (!this.ctx) return false;

    try {
      let arrayBuffer;

      if (source.startsWith('data:')) {
        // Base64 encoded audio
        const base64 = source.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // URL-based audio file
        const response = await fetch(source);
        arrayBuffer = await response.arrayBuffer();
      }

      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.audioBuffers[name] = audioBuffer;
      return true;
    } catch (e) {
      console.warn(`Failed to load audio "${name}":`, e);
      return false;
    }
  },

  // Play a loaded audio file
  playAudio(name, options = {}) {
    if (!this.enabled || !this.ctx) return null;
    if (!this.audioBuffers[name]) {
      console.warn(`Audio "${name}" not loaded`);
      return null;
    }

    // Resume audio context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const source = this.ctx.createBufferSource();
    const gainNode = this.ctx.createGain();

    source.buffer = this.audioBuffers[name];
    source.loop = options.loop || false;

    const vol = (options.volume !== undefined ? options.volume : 1) * this.volume;
    gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    source.start(0);

    return { source, gainNode };
  },

  // Play music (with loop by default, separate volume control)
  playMusic(name, options = {}) {
    if (!this.enabled || !this.ctx) return null;

    // Stop current music if playing
    this.stopMusic();

    // Cancel any pending gain automation from a previous fade-out
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }

    if (!this.audioBuffers[name]) {
      console.warn(`Music "${name}" not loaded`);
      return null;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.audioBuffers[name];
    source.loop = options.loop !== false; // Loop by default

    source.connect(this.musicGain);
    source.start(0);

    this.currentMusic = source;
    return source;
  },

  // Stop currently playing music
  stopMusic(fadeOut = 0) {
    if (!this.currentMusic) return;

    if (fadeOut > 0 && this.musicGain) {
      // Fade out
      const now = this.ctx.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicVolume, now);
      this.musicGain.gain.exponentialRampToValueAtTime(0.01, now + fadeOut);
      const music = this.currentMusic;
      setTimeout(() => {
        try { music.stop(); } catch(e) {}
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      }, fadeOut * 1000);
    } else {
      try { this.currentMusic.stop(); } catch(e) {}
    }

    this.currentMusic = null;
  },

  // Set music volume (0-1)
  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  },

  // Preload multiple audio files
  async preloadAudio(audioMap) {
    const results = await Promise.all(
      Object.entries(audioMap).map(([name, source]) =>
        this.loadAudio(name, source).then(success => ({ name, success }))
      )
    );
    return results;
  },

  // Play a synthesized sound effect
  play(type) {
    if (!this.enabled || !this.ctx) return;

    // Resume audio context if suspended (required for mobile)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(this.volume, now);

    switch(type) {
      case 'hit':
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.type = 'square';
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'crit':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(this.volume * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'enemyHit':
        // Sinister low rumble for enemy attacks on heroes
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(this.volume * 1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'enemyCrit':
        // Heavy sinister impact for enemy crits
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(this.volume * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'heal':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'shield':
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(400, now + 0.05);
        osc.frequency.setValueAtTime(350, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.type = 'triangle';
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'click':
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'victory':
        // Ascending arpeggio
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(this.volume * 0.7, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          o.type = 'sine';
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.3);
        });
        break;

      case 'levelup':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'death':
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.6);
        break;

      case 'gold':
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'select':
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(600, now + 0.03);
        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'error':
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.type = 'square';
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      // ===== FROGGY SOUNDS =====
      case 'ribbit':
        // Classic frog croak - two-tone chirp
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
        osc.frequency.setValueAtTime(260, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(this.volume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'splash':
        // Water splash for D20 rolls - very soft, stretched out
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
        gain.gain.setValueAtTime(this.volume * 0.125, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.6);
        break;

      case 'hop':
        // Light hop - quick ascending blip
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'croak':
        // Deep croak for enemy defeats - low rumble
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        osc.frequency.setValueAtTime(100, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(this.volume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.type = 'triangle';
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      case 'bubble':
        // Bubble pop for shields - playful bloop
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.18);
        break;

      case 'gulp':
        // Gulp/slurp for healing - descending then up
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'd20roll':
        // Dice tumbling - rapid frequency wobble
        osc.frequency.setValueAtTime(400, now);
        for(let i = 0; i < 8; i++) {
          osc.frequency.setValueAtTime(350 + Math.random() * 200, now + i * 0.04);
        }
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);
        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.type = 'square';
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'portal':
        // Portal whoosh - sweeping mystical sound
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.5);
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.55);
        break;

      case 'nat20':
        // Natural 20! - triumphant ascending fanfare
        [400, 500, 600, 800].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(this.volume * 0.8, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
          o.type = 'sine';
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.25);
        });
        break;

      case 'nat1':
        // Natural 1 - sad descending trombone
        [300, 280, 250, 150].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now + i * 0.12);
          g.gain.setValueAtTime(this.volume * 0.6, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.15);
          o.type = 'sawtooth';
          o.start(now + i * 0.12);
          o.stop(now + i * 0.12 + 0.15);
        });
        break;

      // ===== MORE FROGGY SOUNDS =====
      case 'tongueSnap':
        // Frog tongue lash attack - quick snap with wet ending
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        osc.frequency.setValueAtTime(150, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(this.volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'lilyPad':
        // Bouncing on lily pad - springy boing
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.2);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'flyCatch':
        // Catching a fly - quick zip and crunch
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        osc.frequency.setValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(this.volume * 0.3, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.type = 'square';
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'mudSquelch':
        // Stepping in mud - wet squelchy sound
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.type = 'triangle';
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'waterDrip':
        // Single water droplet
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'crickets':
        // Cricket chirps - rapid high frequency bursts
        [0, 0.15, 0.18, 0.35, 0.38].forEach((t) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(4000 + Math.random() * 500, now + t);
          g.gain.setValueAtTime(this.volume * 0.15, now + t);
          g.gain.exponentialRampToValueAtTime(0.01, now + t + 0.03);
          o.type = 'sine';
          o.start(now + t);
          o.stop(now + t + 0.03);
        });
        break;

      case 'frogChorus':
        // Multiple frogs croaking in celebration
        [
          { freq: 180, delay: 0, type: 'sine' },
          { freq: 220, delay: 0.1, type: 'triangle' },
          { freq: 160, delay: 0.15, type: 'sine' },
          { freq: 200, delay: 0.25, type: 'triangle' },
          { freq: 240, delay: 0.3, type: 'sine' }
        ].forEach(({ freq, delay, type }) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now + delay);
          o.frequency.exponentialRampToValueAtTime(freq * 0.7, now + delay + 0.15);
          g.gain.setValueAtTime(this.volume * 0.4, now + delay);
          g.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);
          o.type = type;
          o.start(now + delay);
          o.stop(now + delay + 0.2);
        });
        break;

      case 'splashBig':
        // Big splash - dramatic water entry
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(this.volume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(this.volume * 0.3, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'rain':
        // Rain ambiance - multiple water drops
        for (let i = 0; i < 12; i++) {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          const t = Math.random() * 0.8;
          o.frequency.setValueAtTime(800 + Math.random() * 1200, now + t);
          o.frequency.exponentialRampToValueAtTime(400 + Math.random() * 400, now + t + 0.06);
          g.gain.setValueAtTime(this.volume * (0.1 + Math.random() * 0.15), now + t);
          g.gain.exponentialRampToValueAtTime(0.01, now + t + 0.1);
          o.type = 'sine';
          o.start(now + t);
          o.stop(now + t + 0.1);
        }
        break;

      case 'treasure':
        // Finding treasure - magical shimmer
        [800, 1000, 1200, 1000, 1400].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now + i * 0.07);
          g.gain.setValueAtTime(this.volume * 0.5, now + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.15);
          o.type = 'sine';
          o.start(now + i * 0.07);
          o.stop(now + i * 0.07 + 0.15);
        });
        break;

      case 'stun':
        // Stun/grapple effect - dizzy warble
        [0, 0.08, 0.15, 0.2].forEach((t, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(300 - i * 30, now + t);
          o.frequency.exponentialRampToValueAtTime(200, now + t + 0.08);
          g.gain.setValueAtTime(this.volume * 0.4, now + t);
          g.gain.exponentialRampToValueAtTime(0.01, now + t + 0.1);
          o.type = 'triangle';
          o.start(now + t);
          o.stop(now + t + 0.1);
        });
        break;

      case 'menuOpen':
        // Menu/UI panel opening - soft whoosh up
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'menuClose':
        // Menu/UI panel closing - soft whoosh down
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'coinDrop':
        // Gold/coin pickup - bright metallic ding
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.15);
        // Add harmonic
        const coinHarm = this.ctx.createOscillator();
        const coinGain = this.ctx.createGain();
        coinHarm.connect(coinGain);
        coinGain.connect(this.ctx.destination);
        coinHarm.frequency.setValueAtTime(2400, now);
        coinHarm.frequency.exponentialRampToValueAtTime(1600, now + 0.06);
        coinGain.gain.setValueAtTime(this.volume * 0.25, now);
        coinGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        coinHarm.type = 'sine';
        coinHarm.start(now);
        coinHarm.stop(now + 0.1);
        break;

      case 'floorEnter':
        // Entering new floor - dramatic swoosh
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(this.volume * 0.3, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.type = 'triangle';
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      case 'enemySpawn':
        // Enemy appearing - ominous rising tone
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(this.volume * 0.6, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'powerUp':
        // Power up acquired - ascending sparkle
        [400, 600, 800, 1000, 1200].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now + i * 0.05);
          g.gain.setValueAtTime(this.volume * 0.4, now + i * 0.05);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
          o.type = 'sine';
          o.start(now + i * 0.05);
          o.stop(now + i * 0.05 + 0.1);
        });
        break;

      case 'lastStand':
        // Hero entering Last Stand - dramatic descending alarm
        [500, 400, 300, 200].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now + i * 0.12);
          o.frequency.exponentialRampToValueAtTime(freq * 0.6, now + i * 0.12 + 0.1);
          g.gain.setValueAtTime(this.volume * 0.8, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.12);
          o.type = 'square';
          o.start(now + i * 0.12);
          o.stop(now + i * 0.12 + 0.12);
        });
        break;

      case 'shieldBreak':
        // Shield absorbing damage - crystalline crack
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.type = 'triangle';
        osc.start(now);
        osc.stop(now + 0.18);
        // High shimmer overtone
        const shieldHarm = this.ctx.createOscillator();
        const shieldGain = this.ctx.createGain();
        shieldHarm.connect(shieldGain);
        shieldGain.connect(this.ctx.destination);
        shieldHarm.frequency.setValueAtTime(2000, now);
        shieldHarm.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        shieldGain.gain.setValueAtTime(this.volume * 0.2, now);
        shieldGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        shieldHarm.type = 'sine';
        shieldHarm.start(now);
        shieldHarm.stop(now + 0.1);
        break;

      case 'enemyDraw':
        // Enemy drawing a new sigil - ominous short tone
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.type = 'triangle';
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'ghostBlock':
        // Ghost charge saves from lethal - ethereal chime
        [800, 1200, 1600].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now + i * 0.08);
          g.gain.setValueAtTime(this.volume * 0.4, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
          o.type = 'sine';
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.25);
        });
        break;

      case 'victoryFanfare':
        // Triumphant ascending fanfare for floor clear
        [400, 500, 600, 700, 800, 1000].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(this.volume * 0.5, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          o.type = i < 4 ? 'triangle' : 'sine';
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.2);
        });
        break;
    }
  }
};

// Initialize sound on first user interaction
document.addEventListener('click', () => SoundFX.init(), { once: true });
document.addEventListener('touchstart', () => SoundFX.init(), { once: true });

// ===== FILE-BASED MUSIC SYSTEM =====
// Plays real audio files (MP3) for game music with intro+loop support.
// Add tracks to GameMusic.tracks, then call GameMusic.preload() at startup.
const GameMusic = {
  // Track registry: { name: 'assets/music/filename.mp3' }
  // Naming convention: 'combat1_intro', 'combat1_loop', etc.
  tracks: {
    'char_select': 'assets/music/Froggle_Char_Select.mp3',
    'combat1_intro': 'assets/music/Froggle_Combat_1_intro.mp3',
    'combat1_loop': 'assets/music/Froggle_Combat_1_loop.mp3',
    'combat_boss': 'assets/music/Froggle_Combat_Boss.mp3',
    'combat_hard': 'assets/music/Froggle_Combat_Hard.mp3',
    'game_over': 'assets/music/Froggle_Game_Over.mp3',
    'neutral_base': 'assets/music/Froggle_Neutral_Base.mp3',
    'neutral_happy': 'assets/music/Froggle_Neutral_Happy_Final.mp3',
    'neutral_medium': 'assets/music/Froggle_Neutral_Medium.mp3',
    'neutral_intense': 'assets/music/Froggle_Neutral_ScaryIntenseFunky.mp3',
    'neutral_weird': 'assets/music/Froggle_Neutral_Weird.mp3',
    'town_base': 'assets/music/Froggle_Town_Base.mp3',
  },
  currentTrack: null,
  loaded: false,

  async preload() {
    const entries = Object.entries(this.tracks);
    if (entries.length === 0) { this.loaded = true; return; }
    if (!SoundFX.ctx) SoundFX.init();
    await SoundFX.preloadAudio(Object.fromEntries(entries));
    this.loaded = true;
  },

  // Play a track with optional intro that transitions to loop
  play(introName, loopName) {
    if (!this.loaded) return;

    // Stop any current music
    SoundFX.stopMusic();

    if (introName && SoundFX.audioBuffers[introName]) {
      // Play intro first, then auto-transition to loop
      const introSource = SoundFX.playMusic(introName, { loop: false });
      this.currentTrack = introName;
      if (introSource && loopName) {
        introSource.onended = () => {
          // Only transition if we haven't been stopped/changed
          if (this.currentTrack === introName) {
            SoundFX.playMusic(loopName, { loop: true });
            this.currentTrack = loopName;
          }
        };
      }
    } else if (loopName && SoundFX.audioBuffers[loopName]) {
      // No intro available, just loop
      SoundFX.playMusic(loopName, { loop: true });
      this.currentTrack = loopName;
    }
  },

  // Play combat music based on floor number
  playCombat(floor) {
    if (floor === 19) {
      this.play(null, 'combat_boss');
    } else if (floor >= 11) {
      this.play(null, 'combat_hard');
    } else {
      this.play('combat1_intro', 'combat1_loop');
    }
  },

  // Play a named scene track (looping, no intro)
  playScene(trackName) {
    this.play(null, trackName);
  },

  // Play music for a neutral encounter based on encounter name
  playNeutral(enc) {
    const map = {
      'shopkeeper1': 'neutral_medium',
      'shopkeeper2': 'game_over',
      'wishingwell1': 'neutral_medium',
      'wishingwell2': 'neutral_happy',
      'treasurechest1': 'neutral_medium',
      'treasurechest2': 'neutral_happy',
      'wizard1': 'neutral_medium',
      'wizard2': 'neutral_happy',
      'oracle1': 'neutral_medium',
      'oracle2': 'neutral_happy',
      'encampment1': 'neutral_intense',
      'encampment2': 'neutral_base',
      'ghost1': 'neutral_weird',
      'ghost2': 'neutral_base',
      'gambling1': 'neutral_medium',
      'gambling2': 'neutral_intense',
      'royal1': 'neutral_medium',
      'royal2': 'neutral_happy',
    };
    const track = map[enc] || 'neutral_base';
    this.play(null, track);
  },

  stop(fadeOut = 0.5) {
    this.currentTrack = null;
    SoundFX.stopMusic(fadeOut);
  }
};

// ===== VOLUME SETTINGS =====
// Apply volume settings from S state to audio systems
function applyVolumeSettings() {
  // Calculate effective volumes (master * individual)
  const effectiveSfx = (S.masterVolume || 1) * (S.sfxVolume || 1);
  const effectiveMusic = (S.masterVolume || 1) * (S.musicVolume || 1);

  // Apply to SoundFX (SFX)
  SoundFX.volume = 0.3 * effectiveSfx; // Base SFX volume is 0.3

  // Apply to SoundFX music (loaded audio files)
  SoundFX.musicVolume = 0.2 * effectiveMusic; // Base music volume is 0.2
  if (SoundFX.musicGain && SoundFX.ctx) {
    SoundFX.musicGain.gain.setValueAtTime(SoundFX.musicVolume, SoundFX.ctx.currentTime);
  }

  // Note: GameMusic uses SoundFX.musicGain for volume, which is already updated above
}

// Set master volume and apply
function setMasterVolume(vol) {
  S.masterVolume = Math.max(0, Math.min(1, vol));
  applyVolumeSettings();
  savePermanent();
}

// Set SFX volume and apply
function setSfxVolume(vol) {
  S.sfxVolume = Math.max(0, Math.min(1, vol));
  applyVolumeSettings();
  savePermanent();
}

// Set music volume and apply
function setMusicVolume(vol) {
  S.musicVolume = Math.max(0, Math.min(1, vol));
  applyVolumeSettings();
  savePermanent();
}

