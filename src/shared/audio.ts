import { isMuted } from "./settings";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = getCtx();
  if (audio?.state === "suspended") {
    void audio.resume();
  }
}

function beep(
  freq: number,
  duration = 0.08,
  type: OscillatorType = "square",
  gain = 0.04,
): void {
  if (isMuted()) return;
  const audio = getCtx();
  if (!audio) return;

  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.value = gain;
  vol.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(vol);
  vol.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

export const sfx = {
  tap: () => beep(420, 0.05, "triangle", 0.03),
  place: () => beep(520, 0.07, "square", 0.035),
  flip: () => beep(640, 0.06, "sine", 0.03),
  match: () => {
    beep(660, 0.08, "sine", 0.04);
    window.setTimeout(() => beep(880, 0.1, "sine", 0.035), 70);
  },
  win: () => {
    beep(523, 0.1, "triangle", 0.045);
    window.setTimeout(() => beep(659, 0.1, "triangle", 0.045), 90);
    window.setTimeout(() => beep(784, 0.16, "triangle", 0.05), 180);
  },
  lose: () => beep(180, 0.22, "sawtooth", 0.03),
  draw: () => beep(300, 0.14, "triangle", 0.035),
  eat: () => beep(700, 0.06, "square", 0.04),
  die: () => beep(120, 0.28, "sawtooth", 0.035),
};
