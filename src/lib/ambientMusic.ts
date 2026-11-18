/**
 * Background ambient music manager for "The Seven-Year Dream".
 * Plays looping ancient Egyptian music at a subtle background level,
 * with smooth fade-out when cinematic videos play and smooth fade-in after.
 */

const AMBIENT_SRC = '/ambient.mp3';
const DEFAULT_BG_VOLUME = 0.02; // Barely-there background atmosphere (~2%)

let audioElement: HTMLAudioElement | null = null;
let fadeInterval: number | null = null;
let userMuted = false;
let isSuspendedForVideo = false;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audioElement) {
    audioElement = new Audio(AMBIENT_SRC);
    audioElement.loop = true;
    audioElement.volume = 0;
    audioElement.preload = 'auto';
  }
  return audioElement;
}

function clearFade() {
  if (fadeInterval !== null) {
    window.clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

/**
 * Smoothly ramps audio volume to target level over durationMs
 */
function rampVolume(targetVolume: number, durationMs: number, onComplete?: () => void) {
  clearFade();
  const audio = getAudio();
  if (!audio) return;

  const startVolume = audio.volume;
  const startTime = Date.now();
  const stepMs = 25;

  fadeInterval = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const current = startVolume + (targetVolume - startVolume) * progress;

    audio.volume = Math.max(0, Math.min(1, current));

    if (progress >= 1) {
      clearFade();
      if (onComplete) onComplete();
    }
  }, stepMs);
}

/**
 * Starts or ensures ambient music is playing at low background volume.
 * Resolves browser autoplay restrictions gracefully on user gesture.
 */
export function startAmbientMusic(fadeDurationMs = 1200) {
  if (userMuted || isSuspendedForVideo) return;
  const audio = getAudio();
  if (!audio) return;

  if (audio.paused) {
    audio.play().then(() => {
      rampVolume(DEFAULT_BG_VOLUME, fadeDurationMs);
    }).catch(() => {
      // Browser blocked autoplay; will resume on first click
      const resumeOnClick = () => {
        if (!userMuted && !isSuspendedForVideo) {
          audio.play().then(() => rampVolume(DEFAULT_BG_VOLUME, fadeDurationMs)).catch(() => {});
        }
        window.removeEventListener('pointerdown', resumeOnClick);
      };
      window.addEventListener('pointerdown', resumeOnClick, { once: true });
    });
  } else {
    rampVolume(DEFAULT_BG_VOLUME, fadeDurationMs);
  }
}

/**
 * Fades out ambient music to absolute silence (used when video starts)
 */
export function fadeOutForVideo(durationMs = 800) {
  isSuspendedForVideo = true;
  const audio = getAudio();
  if (!audio) return;

  rampVolume(0, durationMs, () => {
    audio.pause();
  });
}

/**
 * Fades ambient music back in after video finishes
 */
export function fadeInAfterVideo(durationMs = 1500) {
  isSuspendedForVideo = false;
  if (userMuted) return;
  const audio = getAudio();
  if (!audio) return;

  audio.play().then(() => {
    rampVolume(DEFAULT_BG_VOLUME, durationMs);
  }).catch(() => {});
}

/**
 * Toggle user mute
 */
export function toggleAmbientMute(): boolean {
  userMuted = !userMuted;
  const audio = getAudio();
  if (!audio) return userMuted;

  if (userMuted) {
    rampVolume(0, 400, () => {
      audio.pause();
    });
  } else if (!isSuspendedForVideo) {
    audio.play().then(() => {
      rampVolume(DEFAULT_BG_VOLUME, 600);
    }).catch(() => {});
  }
  return userMuted;
}

export function isAmbientMuted(): boolean {
  return userMuted;
}
