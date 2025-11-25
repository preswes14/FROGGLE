// ===== SOUND EFFECTS SYSTEM (Web Audio API) =====
const SoundFX = {
  ctx: null,
  enabled: true,
  volume: 0.3,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
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
        // Water splash for D20 rolls - noise-like falling tone
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.type = 'sawtooth';
        osc.start(now);
        osc.stop(now + 0.35);
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
    }
  }
};

// Initialize sound on first user interaction
document.addEventListener('click', () => SoundFX.init(), { once: true });
document.addEventListener('touchstart', () => SoundFX.init(), { once: true });

