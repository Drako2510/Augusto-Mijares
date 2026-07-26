/**
 * Reproduce un sonido de notificación usando Web Audio API.
 * No requiere archivos externos.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
    }
    // Resume si está suspendido (política de autoplay)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Sonido corto de notificación: dos tonos ascendentes.
 * Suena como "din-don" agradable.
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primer tono
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 660; // E5
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Segundo tono (más alto)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 880; // A5
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  } catch {
    // Fallback silencioso
  }
}
