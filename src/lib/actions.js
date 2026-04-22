(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  const MIN_SPEED = 0.1;
  const MAX_SPEED = 16.0;
  const NORMAL_SPEED = 1.0;
  const FORBIDDEN_MIN = 0.9;
  const FORBIDDEN_MAX = 1.1;

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

  function isTargetForbidden(v) {
    const n = normalize(v);
    return n >= FORBIDDEN_MIN && n <= FORBIDDEN_MAX;
  }

  function down(current, target, step) {
    const normalizedTarget = normalize(target);
    const newCurrent = normalize(normalize(current) - normalize(step));
    const newTarget = isTargetForbidden(newCurrent) ? normalizedTarget : newCurrent;
    return { current: newCurrent, target: newTarget };
  }

  function up(current, target, step) {
    const normalizedTarget = normalize(target);
    const newCurrent = normalize(normalize(current) + normalize(step));
    const newTarget = isTargetForbidden(newCurrent) ? normalizedTarget : newCurrent;
    return { current: newCurrent, target: newTarget };
  }

  function toggle(current, target) {
    return normalize(current) === NORMAL_SPEED
      ? normalize(target)
      : NORMAL_SPEED;
  }

  function applyAction(settings, action) {
    const { lastSpeed, toggleTargetSpeed, step } = settings;
    const patch = {};

    if (action === 'toggle') {
      const newCurrent = toggle(lastSpeed, toggleTargetSpeed);
      if (newCurrent !== normalize(lastSpeed)) patch.lastSpeed = newCurrent;
      return patch;
    }

    if (action === 'down' || action === 'up') {
      const fn = action === 'down' ? down : up;
      const { current: newCurrent, target: newTarget } = fn(
        lastSpeed,
        toggleTargetSpeed,
        step
      );
      if (newCurrent !== normalize(lastSpeed)) patch.lastSpeed = newCurrent;
      if (newTarget !== normalize(toggleTargetSpeed)) {
        patch.toggleTargetSpeed = newTarget;
      }
      return patch;
    }

    return patch;
  }

  ns.actions = {
    MIN_SPEED,
    MAX_SPEED,
    NORMAL_SPEED,
    FORBIDDEN_MIN,
    FORBIDDEN_MAX,
    normalize,
    isTargetForbidden,
    down,
    up,
    toggle,
    applyAction,
  };
})();
