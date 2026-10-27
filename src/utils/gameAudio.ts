// Web Audio API Sound Synthesizer for MASTER PLAY Mini-Games
// Generates responsive, high-performance sound effects without external audio files

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Play simple sound effect
  public play(type: 'laser' | 'hit' | 'win' | 'lose' | 'coin' | 'jump' | 'pop' | 'move' | 'shoot' | 'eat' | 'alert') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      switch (type) {
        case 'laser': {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
        case 'hit': {
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        case 'win': {
          // Arpeggio
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            const noteOsc = this.ctx!.createOscillator();
            const noteGain = this.ctx!.createGain();
            noteOsc.type = 'triangle';
            noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
            noteGain.gain.setValueAtTime(0.2, now + idx * 0.08);
            noteGain.gain.linearRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
            noteOsc.connect(noteGain);
            noteGain.connect(this.ctx!.destination);
            noteOsc.start(now + idx * 0.08);
            noteOsc.stop(now + idx * 0.08 + 0.2);
          });
          break;
        }
        case 'lose': {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(90, now + 0.35);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
        case 'coin': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'jump': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
        case 'pop': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
        case 'move': {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.linearRampToValueAtTime(340, now + 0.05);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }
        case 'shoot': {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
        case 'eat': {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.linearRampToValueAtTime(700, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
        case 'alert': {
          osc.type = 'square';
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
      }
    } catch {
      // Ignore audio context errors gracefully
    }
  }
}

export const gameAudio = new SoundManager();
