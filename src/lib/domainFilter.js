(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  function isExcluded(hostname, excludedDomains) {
    if (typeof hostname !== 'string' || hostname === '') return false;
    if (!Array.isArray(excludedDomains)) return false;
    return excludedDomains.includes(hostname);
  }

  ns.domainFilter = { isExcluded };
})();
