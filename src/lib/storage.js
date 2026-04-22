(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  const DEFAULTS = Object.freeze({
    lastSpeed: 1.0,
    step: 0.1,
    togglePresetSpeed: 2.0,
    keyBindings: Object.freeze({ down: 'KeyS', up: 'KeyD', toggle: 'KeyG' }),
    excludedDomains: Object.freeze(['meet.google.com', 'hangouts.google.com']),
  });

  const KNOWN_KEYS = Object.keys(DEFAULTS);

  function cloneDefault(key) {
    const v = DEFAULTS[key];
    if (Array.isArray(v)) return [...v];
    if (v !== null && typeof v === 'object') return { ...v };
    return v;
  }

  function assertKnownKey(key) {
    if (!KNOWN_KEYS.includes(key)) {
      throw new Error(`[MNVS] unknown storage key: ${key}`);
    }
  }

  async function getAll() {
    const stored = await chrome.storage.local.get(KNOWN_KEYS);
    const result = {};
    for (const key of KNOWN_KEYS) {
      result[key] = stored[key] !== undefined ? stored[key] : cloneDefault(key);
    }
    return result;
  }

  async function get(key) {
    assertKnownKey(key);
    const stored = await chrome.storage.local.get(key);
    return stored[key] !== undefined ? stored[key] : cloneDefault(key);
  }

  async function set(patch) {
    for (const key of Object.keys(patch)) assertKnownKey(key);
    await chrome.storage.local.set(patch);
  }

  function onChanged(callback) {
    const listener = (changes, areaName) => {
      if (areaName !== 'local') return;
      const filtered = {};
      for (const [key, change] of Object.entries(changes)) {
        if (!KNOWN_KEYS.includes(key)) continue;
        filtered[key] = {
          oldValue: change.oldValue !== undefined ? change.oldValue : cloneDefault(key),
          newValue: change.newValue !== undefined ? change.newValue : cloneDefault(key),
        };
      }
      if (Object.keys(filtered).length > 0) callback(filtered);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  ns.storage = { DEFAULTS, KNOWN_KEYS, getAll, get, set, onChanged };
})();
