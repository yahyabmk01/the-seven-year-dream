import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Eagerly fetch and cache heavy media assets the moment the page loads,
// so they're ready by the time the user reaches the intro video.
(function preloadAssets() {
  const assets = ['/INTRO_2K_upscaled.webm', '/ambient.mp3'];
  assets.forEach((src) => {
    const el = src.endsWith('.mp3')
      ? new Audio()
      : document.createElement('video');
    el.preload = 'auto';
    (el as HTMLMediaElement).src = src;
  });
})();

createRoot(document.getElementById('root')!).render(<App />);
