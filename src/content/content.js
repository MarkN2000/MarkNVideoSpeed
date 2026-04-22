(() => {
  'use strict';

  const ns = window.__MNVS__;
  if (!ns || !ns.storage) {
    console.error('[MNVS] storage module missing');
    return;
  }

  ns.storage.getAll().then((settings) => {
    console.log('[MNVS] content script loaded', {
      host: location.hostname,
      settings,
    });
  }).catch((err) => {
    console.error('[MNVS] failed to load settings', err);
  });
})();
