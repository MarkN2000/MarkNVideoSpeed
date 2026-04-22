(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  const MEDIA_SELECTOR = 'video, audio';

  function isMediaElement(node) {
    if (!node || node.nodeType !== 1) return false;
    return node.tagName === 'VIDEO' || node.tagName === 'AUDIO';
  }

  function collectMedia(root, out) {
    if (isMediaElement(root)) {
      out.push(root);
    } else if (root && typeof root.querySelectorAll === 'function') {
      root.querySelectorAll(MEDIA_SELECTOR).forEach((m) => out.push(m));
    }
  }

  function createRegistry(getCurrentSpeed) {
    const mediaSet = new Set();
    let observer = null;

    function reapplyToOne(media) {
      const speed = getCurrentSpeed();
      if (typeof speed !== 'number' || !Number.isFinite(speed)) return;
      if (media.playbackRate !== speed) {
        try {
          media.playbackRate = speed;
        } catch (err) {
          console.warn('[MNVS] reapply failed', err);
        }
      }
    }

    function onPlayOrSeeked(event) {
      reapplyToOne(event.target);
    }

    function register(media) {
      if (mediaSet.has(media)) return;
      mediaSet.add(media);
      media.addEventListener('play', onPlayOrSeeked);
      media.addEventListener('seeked', onPlayOrSeeked);
      reapplyToOne(media);
    }

    function unregister(media) {
      if (!mediaSet.has(media)) return;
      media.removeEventListener('play', onPlayOrSeeked);
      media.removeEventListener('seeked', onPlayOrSeeked);
      mediaSet.delete(media);
    }

    function scan(root = document) {
      const found = [];
      collectMedia(root, found);
      found.forEach(register);
    }

    function start() {
      scan();
      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            const found = [];
            collectMedia(node, found);
            found.forEach(register);
          });
          m.removedNodes.forEach((node) => {
            const found = [];
            collectMedia(node, found);
            found.forEach(unregister);
          });
        }
      });
      observer.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
      });
    }

    function stop() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      for (const media of Array.from(mediaSet)) unregister(media);
    }

    function getAll() {
      return Array.from(mediaSet);
    }

    return { start, stop, getAll, scan };
  }

  ns.mediaRegistry = { createRegistry };
})();
