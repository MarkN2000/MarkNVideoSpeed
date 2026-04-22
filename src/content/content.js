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

  async function init() {
    settings = await ns.storage.getAll();

    if (ns.actions.isTargetForbidden(settings.toggleTargetSpeed)) {
      console.warn(
        '[MNVS] toggleTargetSpeed is in the forbidden zone [0.9, 1.1]. ' +
          'Update it in the popup to avoid toggle no-op.',
        settings.toggleTargetSpeed
      );
    }

    if (ns.domainFilter.isExcluded(location.hostname, settings.excludedDomains)) {
      console.log('[MNVS] disabled on excluded domain:', location.hostname);
      return;
    }

    const registry = ns.mediaRegistry.createRegistry(() => settings.lastSpeed);
    registry.start();

    const hud = ns.hud.createHUD();

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
