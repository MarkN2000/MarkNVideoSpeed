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

  function isPresetForbidden(v) {
    const n = normalize(v);
    return n >= FORBIDDEN_MIN && n <= FORBIDDEN_MAX;
  }

  function down(current, preset, step) {
    const normalizedPreset = normalize(preset);
    const newCurrent = normalize(normalize(current) - normalize(step));
    const newPreset = isPresetForbidden(newCurrent) ? normalizedPreset : newCurrent;
    return { current: newCurrent, preset: newPreset };
  }

  function up(current, preset, step) {
    const normalizedPreset = normalize(preset);
    const newCurrent = normalize(normalize(current) + normalize(step));
    const newPreset = isPresetForbidden(newCurrent) ? normalizedPreset : newCurrent;
    return { current: newCurrent, preset: newPreset };
  }

  function toggle(current, preset) {
    return normalize(current) === NORMAL_SPEED
      ? normalize(preset)
      : NORMAL_SPEED;
  }

  function applyAction(settings, action) {
    const { lastSpeed, togglePresetSpeed, step } = settings;
    const patch = {};

    if (action === 'toggle') {
      const newCurrent = toggle(lastSpeed, togglePresetSpeed);
      if (newCurrent !== normalize(lastSpeed)) patch.lastSpeed = newCurrent;
      return patch;
    }

    if (action === 'down' || action === 'up') {
      const fn = action === 'down' ? down : up;
      const { current: newCurrent, preset: newPreset } = fn(
        lastSpeed,
        togglePresetSpeed,
        step
      );
      if (newCurrent !== normalize(lastSpeed)) patch.lastSpeed = newCurrent;
      if (newPreset !== normalize(togglePresetSpeed)) {
        patch.togglePresetSpeed = newPreset;
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
    isPresetForbidden,
    down,
    up,
    toggle,
    applyAction,
  };
})();
