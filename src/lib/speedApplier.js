(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  function applyTo(medias, speed) {
    if (!Array.isArray(medias)) return;
    if (typeof speed !== 'number' || !Number.isFinite(speed)) return;
    for (const media of medias) {
      if (!media) continue;
      if (media.playbackRate === speed) continue;
      try {
        media.playbackRate = speed;
      } catch (err) {
        console.warn('[MNVS] failed to set playbackRate', err);
      }
    }
  }

  ns.speedApplier = { applyTo };
})();
