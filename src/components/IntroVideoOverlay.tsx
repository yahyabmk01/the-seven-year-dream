import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { fadeInAfterVideo, fadeOutForVideo } from '../lib/ambientMusic';

interface IntroVideoOverlayProps {
  introRemainingMs: number;
}

export function IntroVideoOverlay({ introRemainingMs }: IntroVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReduced = useReducedMotion();
  const [hasStarted, setHasStarted] = useState(false);

  // Fade out ambient music as soon as intro video mounts, fade back in when it finishes
  useEffect(() => {
    fadeOutForVideo(600);
    return () => {
      fadeInAfterVideo(1500);
    };
  }, []);

  // The video plays from 25000ms down to 5000ms (20s duration)
  // Fade in from black during the first 1.2s (introRemainingMs: 25000 -> 23800)
  // Fade out to black during the final 1.2s before title card (introRemainingMs: 6200 -> 5000)
  const isFadingIn = introRemainingMs > 23800;
  const isFadingOut = introRemainingMs <= 6200;

  // Sync video playback time with server countdown for reconnecting / late players
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const targetTimeSec = Math.max(0, (25000 - introRemainingMs) / 1000);

    // Initial sync
    if (!hasStarted) {
      if (Number.isFinite(targetTimeSec) && targetTimeSec < 20) {
        video.currentTime = targetTimeSec;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setHasStarted(true))
          .catch((err) => {
            console.warn('[IntroVideo] Autoplay with sound blocked, falling back to muted:', err);
            video.muted = true;
            video.play().catch((e) => console.error('[IntroVideo] Video play failed:', e));
            setHasStarted(true);
          });
      }
    } else {
      // Keep in sync within 0.75s drift
      if (Math.abs(video.currentTime - targetTimeSec) > 0.75 && targetTimeSec < 20) {
        video.currentTime = targetTimeSec;
      }
    }
  }, [introRemainingMs, hasStarted]);

  return (
    <motion.div
      key="intro-video-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReduced ? 0.2 : 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none pointer-events-auto"
      role="region"
      aria-label="Prologue: The Seven-Year Dream"
    >
      {/* WebM Video Asset */}
      <video
        ref={videoRef}
        src="/INTRO_2K_upscaled.webm"
        playsInline
        preload="auto"
        className="h-full w-full object-cover sm:object-contain bg-black transition-opacity duration-1000"
        style={{
          opacity: isFadingIn ? 0.05 : isFadingOut ? 0.05 : 1,
        }}
      />

      {/* Atmospheric Black Fade-In & Fade-Out Scrim */}
      <div
        className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-1000"
        style={{
          opacity: isFadingIn ? 0.95 : isFadingOut ? 0.95 : 0,
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
