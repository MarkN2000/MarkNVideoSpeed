(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  const MIN_SPEED = 0.1;
  const MAX_SPEED = 16.0;
  const NORMAL_SPEED = 1.0;

  function clamp(v) {
    if (v < MIN_SPEED) return MIN_SPEED;
    if (v > MAX_SPEED) return MAX_SPEED;
    return v;
  }

  function round2(v) {
    return Math.round(v * 100) / 100;
  }

  function normalize(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return NORMAL_SPEED;
    return round2(clamp(v));
  }

  function down(current, step) {
    return normalize(normalize(current) - normalize(step));
  }

  function up(current, step) {
    return normalize(normalize(current) + normalize(step));
  }

  function toggle(current, preset) {
    return normalize(current) === NORMAL_SPEED
      ? normalize(preset)
      : NORMAL_SPEED;
  }

  ns.actions = {
    MIN_SPEED,
    MAX_SPEED,
    NORMAL_SPEED,
    normalize,
    down,
    up,
    toggle,
  };
})();
