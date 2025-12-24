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
        // Water splash for D20 rolls - lower pitch, softer volume
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
        gain.gain.setValueAtTime(this.volume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.4);
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
    }
  }
};

// Initialize sound on first user interaction
document.addEventListener('click', () => SoundFX.init(), { once: true });
document.addEventListener('touchstart', () => SoundFX.init(), { once: true });

// ===== PROCEDURAL MUSIC SYSTEM =====
const ProceduralMusic = {
  ctx: null,
  enabled: true,
  volume: 0.15,
  currentMode: null,
  oscillators: [],
  gainNodes: [],
  intervalIds: [],

  init() {
    if (!SoundFX.ctx) SoundFX.init();
    this.ctx = SoundFX.ctx;
  },

  stopAll() {
    // Stop all oscillators
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.oscillators = [];

    // Disconnect gain nodes
    this.gainNodes.forEach(g => {
      try { g.disconnect(); } catch(e) {}
    });
    this.gainNodes = [];

    // Clear intervals
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];

    this.currentMode = null;
  },

  // Ambient swamp drone - mysterious, atmospheric
  startAmbient() {
    if (!this.enabled || this.currentMode === 'ambient') return;
    this.stopAll();
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    this.currentMode = 'ambient';
    const now = this.ctx.currentTime;

    // Create master gain for ambient
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(this.volume, now + 2); // Fade in
    masterGain.connect(this.ctx.destination);
    this.gainNodes.push(masterGain);

    // Deep drone - fundamental (D2, ~73Hz)
    const drone1 = this.ctx.createOscillator();
    const drone1Gain = this.ctx.createGain();
    drone1.frequency.setValueAtTime(73, now);
    drone1.type = 'sine';
    drone1Gain.gain.setValueAtTime(0.4, now);
    drone1.connect(drone1Gain);
    drone1Gain.connect(masterGain);
    drone1.start(now);
    this.oscillators.push(drone1);
    this.gainNodes.push(drone1Gain);

    // Fifth harmonic (A2, ~110Hz) - adds richness
    const drone2 = this.ctx.createOscillator();
    const drone2Gain = this.ctx.createGain();
    drone2.frequency.setValueAtTime(110, now);
    drone2.type = 'sine';
    drone2Gain.gain.setValueAtTime(0.2, now);
    drone2.connect(drone2Gain);
    drone2Gain.connect(masterGain);
    drone2.start(now);
    this.oscillators.push(drone2);
    this.gainNodes.push(drone2Gain);

    // Subtle LFO modulation for "breathing" effect on volume
    const breatheInterval = setInterval(() => {
      if (this.currentMode !== 'ambient' || !this.ctx) return;
      const t = this.ctx.currentTime;
      // Slow breathing (8 second cycle)
      const breath = 0.7 + 0.3 * Math.sin(t * 0.4);
      drone1Gain.gain.setTargetAtTime(0.4 * breath, t, 0.5);
      drone2Gain.gain.setTargetAtTime(0.2 * breath, t, 0.5);
    }, 500);
    this.intervalIds.push(breatheInterval);

    // Occasional water drip sounds
    const dripInterval = setInterval(() => {
      if (this.currentMode !== 'ambient' || !this.ctx) return;
      if (Math.random() < 0.3) { // 30% chance every 2 seconds
        SoundFX.play('waterDrip');
      }
    }, 2000);
    this.intervalIds.push(dripInterval);

    // Occasional cricket chirps (less frequent)
    const cricketInterval = setInterval(() => {
      if (this.currentMode !== 'ambient' || !this.ctx) return;
      if (Math.random() < 0.15) {
        SoundFX.play('crickets');
      }
    }, 4000);
    this.intervalIds.push(cricketInterval);
  },

  // Froggy beat - same drums as combat but with splash and ribbit sounds
  // Used for title screen and Ribbleton (froggy areas)
  startFroggyBeat() {
    if (!this.enabled || this.currentMode === 'froggy') return;
    this.stopAll();
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    this.currentMode = 'froggy';
    const now = this.ctx.currentTime;
    const bpm = 100;
    const beatDuration = 60 / bpm;

    // Create master gain for froggy beat
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(this.volume * 1.0, now + 0.5);
    masterGain.connect(this.ctx.destination);
    this.gainNodes.push(masterGain);

    // Helper: create noise buffer for percussive sounds
    const createNoise = (duration) => {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    };

    // 16-step patterns (two measures of 8)
    // Kick pattern: same as combat but extended to 16 steps
    const kickPattern = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0];
    // Snare on beats 3, 7, 11, 15 (backbeat) - 0-indexed: 2, 6, 10, 14
    const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
    // Hi-hat on every step for steady pulse
    const hatPattern = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    // Splash on beats 3, 7, 11 (0-indexed: 2, 6, 10)
    const splashPattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0];
    // Ribbit on beat 16 (0-indexed: 15)
    const ribbitPattern = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
    let step = 0;

    const beatInterval = setInterval(() => {
      if (this.currentMode !== 'froggy' || !this.ctx) return;

      const t = this.ctx.currentTime;

      // Kick drum - low thump (slightly quieter than combat)
      if (kickPattern[step]) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.frequency.setValueAtTime(150, t);
        kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        kickGain.gain.setValueAtTime(0.5, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        kickOsc.type = 'sine';
        kickOsc.start(t);
        kickOsc.stop(t + 0.12);
      }

      // Snare drum - mid punch (slightly quieter)
      if (snarePattern[step]) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.connect(snareGain);
        snareGain.connect(masterGain);
        snareOsc.frequency.setValueAtTime(180, t);
        snareOsc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
        snareGain.gain.setValueAtTime(0.25, t);
        snareGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        snareOsc.type = 'triangle';
        snareOsc.start(t);
        snareOsc.stop(t + 0.1);

        // Noise rattle
        const snareNoise = this.ctx.createBufferSource();
        snareNoise.buffer = createNoise(0.15);
        const snareNoiseGain = this.ctx.createGain();
        const snareNoiseFilter = this.ctx.createBiquadFilter();
        snareNoiseFilter.type = 'highpass';
        snareNoiseFilter.frequency.value = 2000;
        snareNoise.connect(snareNoiseFilter);
        snareNoiseFilter.connect(snareNoiseGain);
        snareNoiseGain.connect(masterGain);
        snareNoiseGain.gain.setValueAtTime(0.18, t);
        snareNoiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        snareNoise.start(t);
      }

      // Hi-hat - quiet tick (quieter than combat for more chill vibe)
      if (hatPattern[step]) {
        const hatNoise = this.ctx.createBufferSource();
        hatNoise.buffer = createNoise(0.04);
        const hatGain = this.ctx.createGain();
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.value = 7000;
        hatNoise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(masterGain);
        const accent = (step === 0 || step === 8) ? 0.08 : 0.04;
        hatGain.gain.setValueAtTime(accent, t);
        hatGain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
        hatNoise.start(t);
      }

      // Splash sound on beats 3, 7, 11
      if (splashPattern[step]) {
        SoundFX.play('splash');
      }

      // Ribbit on beat 16
      if (ribbitPattern[step]) {
        SoundFX.play('ribbit');
      }

      step = (step + 1) % 16;
    }, beatDuration * 1000);
    this.intervalIds.push(beatInterval);
  },

  // Combat beat - percussive, drum-focused
  startCombat() {
    if (!this.enabled || this.currentMode === 'combat') return;
    this.stopAll();
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    this.currentMode = 'combat';
    const now = this.ctx.currentTime;
    const bpm = 100;
    const beatDuration = 60 / bpm;

    // Create master gain for combat
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(this.volume * 1.2, now + 0.5);
    masterGain.connect(this.ctx.destination);
    this.gainNodes.push(masterGain);

    // Helper: create noise buffer for percussive sounds
    const createNoise = (duration) => {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    };

    // Kick pattern: 1-0-0-1-0-1-0-0 (8 steps) - punchy drum hits
    const kickPattern = [1, 0, 0, 1, 0, 1, 0, 0];
    // Snare on beats 3 and 7 (backbeat)
    const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0];
    // Hi-hat on every step for steady pulse
    const hatPattern = [1, 1, 1, 1, 1, 1, 1, 1];
    let step = 0;

    const beatInterval = setInterval(() => {
      if (this.currentMode !== 'combat' || !this.ctx) return;

      const t = this.ctx.currentTime;

      // Kick drum - low thump with noise click
      if (kickPattern[step]) {
        // Low frequency body
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.frequency.setValueAtTime(150, t);
        kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        kickGain.gain.setValueAtTime(0.7, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        kickOsc.type = 'sine';
        kickOsc.start(t);
        kickOsc.stop(t + 0.12);

        // Noise click for attack
        const kickNoise = this.ctx.createBufferSource();
        kickNoise.buffer = createNoise(0.03);
        const kickNoiseGain = this.ctx.createGain();
        const kickNoiseFilter = this.ctx.createBiquadFilter();
        kickNoiseFilter.type = 'lowpass';
        kickNoiseFilter.frequency.value = 200;
        kickNoise.connect(kickNoiseFilter);
        kickNoiseFilter.connect(kickNoiseGain);
        kickNoiseGain.connect(masterGain);
        kickNoiseGain.gain.setValueAtTime(0.3, t);
        kickNoiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
        kickNoise.start(t);
      }

      // Snare drum - mid punch with noise burst
      if (snarePattern[step]) {
        // Body tone
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.connect(snareGain);
        snareGain.connect(masterGain);
        snareOsc.frequency.setValueAtTime(180, t);
        snareOsc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
        snareGain.gain.setValueAtTime(0.35, t);
        snareGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        snareOsc.type = 'triangle';
        snareOsc.start(t);
        snareOsc.stop(t + 0.1);

        // Noise rattle
        const snareNoise = this.ctx.createBufferSource();
        snareNoise.buffer = createNoise(0.15);
        const snareNoiseGain = this.ctx.createGain();
        const snareNoiseFilter = this.ctx.createBiquadFilter();
        snareNoiseFilter.type = 'highpass';
        snareNoiseFilter.frequency.value = 2000;
        snareNoise.connect(snareNoiseFilter);
        snareNoiseFilter.connect(snareNoiseGain);
        snareNoiseGain.connect(masterGain);
        snareNoiseGain.gain.setValueAtTime(0.25, t);
        snareNoiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        snareNoise.start(t);
      }

      // Hi-hat - quiet tick for steady metronome pulse
      if (hatPattern[step]) {
        const hatNoise = this.ctx.createBufferSource();
        hatNoise.buffer = createNoise(0.04);
        const hatGain = this.ctx.createGain();
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.value = 7000;
        hatNoise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(masterGain);
        // Accent on downbeats
        const accent = (step === 0 || step === 4) ? 0.12 : 0.06;
        hatGain.gain.setValueAtTime(accent, t);
        hatGain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
        hatNoise.start(t);
      }

      step = (step + 1) % 8;
    }, beatDuration * 1000);
    this.intervalIds.push(beatInterval);
  },

  // Victory fanfare - celebratory, ascending
  playVictory() {
    if (!this.enabled) return;
    this.stopAll();
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Triumphant chord progression: C -> G -> Am -> F -> C (simplified fanfare)
    const fanfare = [
      { notes: [262, 330, 392], time: 0, duration: 0.3 },      // C major
      { notes: [294, 370, 440], time: 0.35, duration: 0.3 },   // D major
      { notes: [330, 415, 494], time: 0.7, duration: 0.3 },    // E major
      { notes: [392, 494, 587], time: 1.05, duration: 0.5 },   // G major (resolve)
      { notes: [523, 659, 784], time: 1.6, duration: 0.8 },    // C major (octave up, finale)
    ];

    fanfare.forEach(chord => {
      chord.notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(freq, now + chord.time);
        gain.gain.setValueAtTime(this.volume * 0.6, now + chord.time);
        gain.gain.exponentialRampToValueAtTime(0.01, now + chord.time + chord.duration);
        osc.type = i === 0 ? 'sine' : 'triangle'; // Root is fuller
        osc.start(now + chord.time);
        osc.stop(now + chord.time + chord.duration + 0.1);
      });
    });

    // Add a final sparkle
    setTimeout(() => SoundFX.play('frogChorus'), 1800);
  },

  // Death/defeat sound - somber, descending
  playDefeat() {
    if (!this.enabled) return;
    this.stopAll();
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Descending minor progression
    const lament = [
      { freq: 220, time: 0 },
      { freq: 196, time: 0.4 },
      { freq: 175, time: 0.8 },
      { freq: 147, time: 1.2 },
    ];

    lament.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      gain.gain.setValueAtTime(this.volume * 0.5, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.5);
      osc.type = 'sawtooth';
      osc.start(now + note.time);
      osc.stop(now + note.time + 0.6);
    });
  },

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
};

