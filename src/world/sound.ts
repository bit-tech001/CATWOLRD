export class CatSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private lastStepTime = 0;

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public playMeow(variant: 'hello' | 'happy' | 'chirp' = 'hello'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc2.type = 'sine';

    if (variant === 'chirp') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.16);
      osc2.frequency.setValueAtTime(1040, now);
      osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1250, now);
      filter.Q.value = 2.0;

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.2);
      osc2.stop(now + 0.2);
      return;
    }

    const basePitch = variant === 'happy' ? 480 : 410;
    const peakPitch = variant === 'happy' ? 740 : 650;
    const endPitch = variant === 'happy' ? 500 : 370;
    const duration = variant === 'happy' ? 0.36 : 0.44;

    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(peakPitch, now + duration * 0.35);
    osc.frequency.exponentialRampToValueAtTime(endPitch, now + duration);

    osc2.frequency.setValueAtTime(basePitch * 2, now);
    osc2.frequency.exponentialRampToValueAtTime(peakPitch * 1.9, now + duration * 0.35);
    osc2.frequency.exponentialRampToValueAtTime(endPitch * 1.8, now + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(1450, now + duration * 0.35);
    filter.frequency.linearRampToValueAtTime(750, now + duration);
    filter.Q.value = 1.6;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.11, now + duration * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.02);
    osc2.stop(now + duration + 0.02);
  }

  public playPurrBurst(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const master = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(28, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, now);
    lfoGain.gain.setValueAtTime(0.03, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(190, now);

    master.gain.setValueAtTime(0.001, now);
    master.gain.linearRampToValueAtTime(0.06, now + 0.12);
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    osc.connect(filter);
    filter.connect(master);
    master.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.68);
    lfo.stop(now + 0.68);
  }

  public playStep(running: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const minGap = running ? 0.12 : 0.22;
    if (now - this.lastStepTime < minGap) return;
    this.lastStepTime = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(running ? 145 : 115, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.04);

    gain.gain.setValueAtTime(running ? 0.035 : 0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playJump(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.11);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playTrashClatter(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Metallic clang partials
    const freqs = [220, 387, 562, 845];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.78, now + 0.35);

      gain.gain.setValueAtTime(0.05 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.36);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    });
  }

  public playCardboardThud(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.11);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
