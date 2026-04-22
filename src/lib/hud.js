(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  const DISPLAY_MS = 300;
  const FADE_OUT_MS = 150;
  const FADE_IN_MS = 80;

  const CSS = `
    .hud {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font: 600 64px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
      color: #fff;
      background: rgba(0, 0, 0, 0.55);
      padding: 12px 28px;
      border-radius: 12px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      opacity: 0;
      transition: opacity ${FADE_OUT_MS}ms ease-out;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
    }
    .hud.visible {
      opacity: 1;
      transition: opacity ${FADE_IN_MS}ms ease-out;
    }
  `;

  function createHost() {
    const host = document.createElement('div');
    host.style.cssText =
      'all: initial; position: fixed; left: 0; top: 0; width: 0; height: 0; ' +
      'pointer-events: none; z-index: 2147483647;';
    return host;
  }

  function createHUD() {
    const host = createHost();
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CSS;
    const hud = document.createElement('div');
    hud.className = 'hud';
    shadow.appendChild(style);
    shadow.appendChild(hud);

    let hideTimer = 0;

    function currentParent() {
      return document.fullscreenElement || document.body;
    }

    function mount() {
      const target = currentParent();
      if (!target) return;
      if (host.parentNode !== target) {
        target.appendChild(host);
      }
    }

    function onFullscreenChange() {
      mount();
    }

    function show(speed) {
      mount();
      hud.textContent = `${speed.toFixed(2)}×`;
      hud.classList.add('visible');
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        hud.classList.remove('visible');
        hideTimer = 0;
      }, DISPLAY_MS);
    }

    function destroy() {
      if (hideTimer) clearTimeout(hideTimer);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      host.remove();
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    mount();

    return { show, destroy };
  }

  ns.hud = { createHUD };
})();
