// Procedural retro-futuristic sound synthesis via Web Audio API. 
// Fully offline, zero asset files needed.
let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;
let masterVolume = 0.5;

// Keep track of active alarm loops to allow silencing
let activeAlarms: { oscs: OscillatorNode[]; gains: GainNode[] }[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMutedGlobal = muted;
  if (muted) {
    silenceAllAlarms();
  }
}

export function getMuted(): boolean {
  return isMutedGlobal;
}

export function setVolume(vol: number) {
  masterVolume = Math.max(0, Math.min(1, vol));
}

export function getVolume(): number {
  return masterVolume;
}

export function silenceAllAlarms() {
  activeAlarms.forEach((alarm) => {
    try {
      alarm.oscs.forEach(o => o.stop());
    } catch (_) {}
  });
  activeAlarms = [];
}

export const playSyntheticSound = (
  type: 
    | 'tick' 
    | 'order' 
    | 'profit' 
    | 'warning' 
    | 'liquidation' 
    | 'click' 
    | 'alert' 
    | 'success'
    | 'go'
    | 'anomaly'
    | 'splice_success'
    | 'splice_fail'
    | 'trade'
    | 'alarm'
    | 'open'
) => {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Create master gain for relative volume control
    const globalGain = ctx.createGain();
    globalGain.gain.setValueAtTime(masterVolume, now);
    globalGain.connect(ctx.destination);

    // Normalize types to avoid broken keys
    let nType = type;
    if (type === 'click') nType = 'tick';
    else if (type === 'alert') nType = 'warning';
    else if (type === 'success') nType = 'profit';

    switch (nType) {
      case 'tick': {
        // Crisp mechanical keyboard click (8ms transient of sine + highpass-filtered noise)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.008);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
        
        osc.connect(gain);
        gain.connect(globalGain);
        osc.start(now);
        osc.stop(now + 0.015);
        break;
      }

      case 'go': {
        // Deeper confirmation Bloomberg "bloop" tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        
        osc.connect(gain);
        gain.connect(globalGain);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'order':
      case 'trade': {
        // Clean double mechanical trade execution click sequence
        [0, 0.06].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now + delay);
          osc.frequency.exponentialRampToValueAtTime(1200, now + delay + 0.03);
          
          gain.gain.setValueAtTime(0.04, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.04);
          
          osc.connect(gain);
          gain.connect(globalGain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.05);
        });
        break;
      }

      case 'profit': {
        // Elegant ascending futuristic high-tech sequence
        const freqs = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscNode.type = 'sine';
          oscNode.frequency.setValueAtTime(freq, now + idx * 0.07);
          gainNode.gain.setValueAtTime(0.025, now + idx * 0.07);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.25);
          
          oscNode.connect(gainNode);
          gainNode.connect(globalGain);
          oscNode.start(now + idx * 0.07);
          oscNode.stop(now + idx * 0.07 + 0.28);
        });
        break;
      }

      case 'warning': {
        // High-low dual alarm cyber siren
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(220, now + 0.12);
        osc.frequency.setValueAtTime(440, now + 0.24);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        
        osc.connect(gain);
        gain.connect(globalGain);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'liquidation': {
        // Distorted sub-frequency containment rupture
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.85);
        
        const biquad = ctx.createBiquadFilter();
        biquad.type = 'lowpass';
        biquad.frequency.setValueAtTime(140, now);
        biquad.frequency.exponentialRampToValueAtTime(35, now + 0.85);
        
        osc.connect(biquad);
        biquad.connect(gain);
        gain.connect(globalGain);
        
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
        
        osc.start(now);
        osc.stop(now + 0.95);
        break;
      }

      case 'anomaly': {
        // Impact thud and simulated white noise burst
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(15, now + 0.4);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        
        osc.connect(gain);
        gain.connect(globalGain);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case 'splice_success': {
        // Genome splice completion sound
        const notes = [523.25, 783.99, 1174.66]; // C5, G5, D6 (fifths chime)
        notes.forEach((f, i) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscNode.type = 'sine';
          oscNode.frequency.setValueAtTime(f, now + i * 0.08);
          gainNode.gain.setValueAtTime(0.02, now + i * 0.08);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.2);
          
          oscNode.connect(gainNode);
          gainNode.connect(globalGain);
          oscNode.start(now + i * 0.08);
          oscNode.stop(now + i * 0.08 + 0.22);
        });
        break;
      }

      case 'splice_fail': {
        // Harsh retro mutation failure descender
        const notes = [311.13, 277.18, 220.00]; // Eb4, Db4, A3
        notes.forEach((f, i) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscNode.type = 'sawtooth';
          oscNode.frequency.setValueAtTime(f, now + i * 0.08);
          gainNode.gain.setValueAtTime(0.03, now + i * 0.08);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.2);
          
          oscNode.connect(gainNode);
          gainNode.connect(globalGain);
          oscNode.start(now + i * 0.08);
          oscNode.stop(now + i * 0.08 + 0.22);
        });
        break;
      }

      case 'alarm': {
        // Pulsing security klaxon alarm
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(290, now);
        osc1.frequency.linearRampToValueAtTime(340, now + 0.25);
        osc1.frequency.linearRampToValueAtTime(290, now + 0.5);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(4, now); // LFO generator
        
        gain1.gain.setValueAtTime(0.02, now);
        gain2.gain.setValueAtTime(0.01, now);

        osc1.connect(gain1);
        gain1.connect(globalGain);
        
        osc1.start(now);
        osc1.stop(now + 0.5);
        
        activeAlarms.push({ oscs: [osc1], gains: [gain1] });
        break;
      }

      case 'open': {
        // Full nostalgic workstation startup chime sequence
        const chords = [130.81, 164.81, 196.00, 261.63, 329.63, 392.00, 523.25]; // C3 to C5 major chord
        chords.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.03);
          g.gain.setValueAtTime(0.015, now + idx * 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 1.2);
          
          o.connect(g);
          g.connect(globalGain);
          o.start(now + idx * 0.03);
          o.stop(now + idx * 0.03 + 1.5);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Procedural Audio blocked/suspended:', err);
  }
};
