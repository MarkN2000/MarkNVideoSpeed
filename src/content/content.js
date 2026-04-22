(() => {
  'use strict';

  const ns = window.__MNVS__;
  const required = ['storage', 'actions', 'domainFilter', 'speedApplier', 'mediaRegistry', 'keyHandler'];
  const missing = required.filter((k) => !ns || !ns[k]);
  if (missing.length > 0) {
    console.error('[MNVS] required modules missing:', missing);
    return;
  }

  let settings = null;

  async function init() {
    settings = await ns.storage.getAll();

    if (ns.domainFilter.isExcluded(location.hostname, settings.excludedDomains)) {
      console.log('[MNVS] disabled on excluded domain:', location.hostname);
      return;
    }

    const registry = ns.mediaRegistry.createRegistry(() => settings.lastSpeed);
    registry.start();

    ns.speedApplier.applyTo(registry.getAll(), settings.lastSpeed);

    function executeAction(action) {
      const { lastSpeed, step, togglePresetSpeed } = settings;
      const newSpeed =
        action === 'down' ? ns.actions.down(lastSpeed, step)
        : action === 'up' ? ns.actions.up(lastSpeed, step)
        : action === 'toggle' ? ns.actions.toggle(lastSpeed, togglePresetSpeed)
        : lastSpeed;

      if (newSpeed === lastSpeed) return;

      settings.lastSpeed = newSpeed;
      ns.speedApplier.applyTo(registry.getAll(), newSpeed);
      ns.storage.set({ lastSpeed: newSpeed }).catch((err) => {
        console.warn('[MNVS] persist failed', err);
      });
    }

    const handler = ns.keyHandler.createHandler({
      getBindings: () => settings.keyBindings,
      hasMedia: () => registry.getAll().length > 0,
      onAction: executeAction,
    });
    handler.start();

    ns.storage.onChanged((changes) => {
      for (const [key, { newValue }] of Object.entries(changes)) {
        settings[key] = newValue;
      }
      if (changes.lastSpeed) {
        ns.speedApplier.applyTo(registry.getAll(), changes.lastSpeed.newValue);
      }
    });

    console.log('[MNVS] initialized', {
      host: location.hostname,
      mediaCount: registry.getAll().length,
      lastSpeed: settings.lastSpeed,
    });
  }

  init().catch((err) => {
    console.error('[MNVS] init failed', err);
  });
})();
