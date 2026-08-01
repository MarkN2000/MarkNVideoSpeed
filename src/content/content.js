(() => {
  'use strict';

  const ns = window.__MNVS__;
  const required = ['storage', 'actions', 'domainFilter', 'speedApplier', 'mediaRegistry', 'keyHandler', 'hud'];
  const missing = required.filter((k) => !ns || !ns[k]);
  if (missing.length > 0) {
    console.error('[MNVS] required modules missing:', missing);
    return;
  }

  let settings = null;
  let registry = null;
  let hud = null;
  let handler = null;

  function isExcluded() {
    return ns.domainFilter.isExcluded(location.hostname, settings.excludedDomains);
  }

  function start() {
    if (registry) return;

    registry = ns.mediaRegistry.createRegistry(() => settings.lastSpeed);
    registry.start();

    hud = ns.hud.createHUD();
    handler = ns.keyHandler.createHandler({
      getBindings: () => settings.keyBindings,
      hasMedia: () => registry.getAll().length > 0,
      onAction: executeAction,
    });
    handler.start();
  }

  function stop({ resetSpeed = false } = {}) {
    if (!registry) return;
    if (resetSpeed) {
      ns.speedApplier.applyTo(registry.getAll(), 1.0);
    }
    handler.stop();
    registry.stop();
    hud.destroy();
    handler = null;
    registry = null;
    hud = null;
  }

  function syncExcludedState() {
    if (isExcluded()) {
      stop({ resetSpeed: true });
    } else {
      start();
    }
  }

  function executeAction(action) {
    const patch = ns.actions.applyAction(settings, action);
    if (Object.keys(patch).length === 0) return;

    Object.assign(settings, patch);
    if ('lastSpeed' in patch) {
      ns.speedApplier.applyTo(registry.getAll(), patch.lastSpeed);
      hud.show(patch.lastSpeed);
    }
    ns.storage.set(patch).catch((err) => {
      console.warn('[MNVS] persist failed', err);
    });
  }

  async function init() {
    settings = await ns.storage.getAll();

    ns.storage.onChanged((changes) => {
      for (const [key, { newValue }] of Object.entries(changes)) {
        settings[key] = newValue;
      }
      if (changes.excludedDomains) {
        syncExcludedState();
      }
      if (changes.lastSpeed && registry) {
        ns.speedApplier.applyTo(registry.getAll(), changes.lastSpeed.newValue);
      }
    });

    syncExcludedState();
  }

  init().catch((err) => {
    console.error('[MNVS] init failed', err);
  });
})();
