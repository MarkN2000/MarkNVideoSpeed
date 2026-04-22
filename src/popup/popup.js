(() => {
  'use strict';

  const { storage, actions, domainFilter } = window.__MNVS__;

  function t(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
  }

  function applyI18n() {
    const lang = chrome.i18n.getUILanguage();
    if (lang) document.documentElement.lang = lang.split('-')[0];
    document.title = t('extName') || document.title;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const msg = t(node.getAttribute('data-i18n'));
      if (msg) node.textContent = msg;
    });
    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      const msg = t(node.getAttribute('data-i18n-title'));
      if (msg) node.setAttribute('title', msg);
    });
  }

  const el = {
    speedDisplay: document.getElementById('speed-display'),
    btnDown: document.getElementById('btn-down'),
    btnToggle: document.getElementById('btn-toggle'),
    btnUp: document.getElementById('btn-up'),
    stepInput: document.getElementById('step-input'),
    targetInput: document.getElementById('target-input'),
    keyButtons: {
      down: document.getElementById('key-down'),
      up: document.getElementById('key-up'),
      toggle: document.getElementById('key-toggle'),
    },
    resetKeys: document.getElementById('reset-keys'),
    currentDomain: document.getElementById('current-domain'),
    toggleExclude: document.getElementById('toggle-exclude'),
    domainHint: document.getElementById('domain-hint'),
    toast: document.getElementById('toast'),
  };

  let settings = null;
  let currentHostname = null;
  let hostSupported = false;
  let keyRebindAction = null;
  let rebindButton = null;
  let rebindBlurHandler = null;
  let toastHideTimer = null;

  function codeToLabel(code) {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    return code;
  }

  function isAllowedKeyCode(code) {
    return /^Key[A-Z]$/.test(code) || /^Digit[0-9]$/.test(code);
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.remove('hidden');
    el.toast.style.animation = 'none';
    void el.toast.offsetWidth;
    el.toast.style.animation = '';
    if (toastHideTimer !== null) clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(() => {
      el.toast.classList.add('hidden');
      toastHideTimer = null;
    }, 2000);
  }

  function formatSpeed(s) {
    return `${actions.normalize(s).toFixed(2)}x`;
  }

  function formatToggleTarget(current, target) {
    const next = actions.normalize(current) === actions.NORMAL_SPEED
      ? actions.normalize(target)
      : actions.NORMAL_SPEED;
    return `→ ${next.toFixed(2)}x`;
  }

  function render() {
    el.speedDisplay.textContent = formatSpeed(settings.lastSpeed);
    el.btnToggle.textContent = formatToggleTarget(settings.lastSpeed, settings.toggleTargetSpeed);

    if (document.activeElement !== el.stepInput) {
      el.stepInput.value = settings.step;
    }
    if (document.activeElement !== el.targetInput) {
      el.targetInput.value = settings.toggleTargetSpeed;
    }

    for (const action of ['down', 'up', 'toggle']) {
      const btn = el.keyButtons[action];
      if (keyRebindAction === action) continue;
      btn.textContent = codeToLabel(settings.keyBindings[action]);
      btn.classList.remove('waiting');
    }

    renderDomainSection();
  }

  function renderDomainSection() {
    if (!hostSupported) {
      el.toggleExclude.disabled = true;
      el.toggleExclude.textContent = '—';
      return;
    }
    el.toggleExclude.disabled = false;
    const excluded = domainFilter.isExcluded(currentHostname, settings.excludedDomains);
    el.toggleExclude.textContent = excluded ? t('btnExcludeRemove') : t('btnExcludeAdd');
  }

  async function handleAction(action) {
    const patch = actions.applyAction(settings, action);
    if (Object.keys(patch).length === 0) return;

    Object.assign(settings, patch);
    render();
    await storage.set(patch);
  }

  function validateNumberInput(inputEl, min, max) {
    const raw = inputEl.value.trim();
    if (raw === '') return null;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return Math.round(n * 100) / 100;
  }

  function validateTargetInput(inputEl) {
    const v = validateNumberInput(inputEl, 0.1, 16.0);
    if (v === null) return null;
    if (actions.isTargetForbidden(v)) return null;
    return v;
  }

  async function commitStep() {
    const v = validateNumberInput(el.stepInput, 0.01, 2.0);
    if (v === null) {
      el.stepInput.classList.add('invalid');
      el.stepInput.value = settings.step;
      setTimeout(() => el.stepInput.classList.remove('invalid'), 1000);
      return;
    }
    el.stepInput.classList.remove('invalid');
    if (v !== settings.step) {
      settings.step = v;
      await storage.set({ step: v });
    }
  }

  async function commitTarget() {
    const v = validateTargetInput(el.targetInput);
    if (v === null) {
      el.targetInput.classList.add('invalid');
      el.targetInput.value = settings.toggleTargetSpeed;
      setTimeout(() => el.targetInput.classList.remove('invalid'), 1000);
      return;
    }
    el.targetInput.classList.remove('invalid');
    if (v !== settings.toggleTargetSpeed) {
      settings.toggleTargetSpeed = v;
      await storage.set({ toggleTargetSpeed: v });
    }
  }

  function clearRebindState() {
    document.removeEventListener('keydown', onRebindKeydown, true);
    if (rebindButton && rebindBlurHandler) {
      rebindButton.removeEventListener('blur', rebindBlurHandler);
    }
    rebindButton = null;
    rebindBlurHandler = null;
    keyRebindAction = null;
  }

  function startRebind(action) {
    cancelRebind();
    keyRebindAction = action;
    const btn = el.keyButtons[action];
    btn.textContent = t('keyRebindPrompt');
    btn.classList.add('waiting');
    document.addEventListener('keydown', onRebindKeydown, true);
    rebindButton = btn;
    rebindBlurHandler = () => cancelRebind();
    btn.addEventListener('blur', rebindBlurHandler);
  }

  function cancelRebind() {
    if (!keyRebindAction) {
      clearRebindState();
      return;
    }
    const action = keyRebindAction;
    const btn = el.keyButtons[action];
    clearRebindState();
    btn.textContent = codeToLabel(settings.keyBindings[action]);
    btn.classList.remove('waiting');
  }

  async function onRebindKeydown(event) {
    if (!keyRebindAction) return;
    event.preventDefault();
    event.stopPropagation();

    if (event.code === 'Escape') {
      cancelRebind();
      return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      showToast(t('errModifierKey'));
      return;
    }

    if (!isAllowedKeyCode(event.code)) {
      showToast(t('errAlphanumOnly'));
      return;
    }

    const action = keyRebindAction;
    const otherActions = ['down', 'up', 'toggle'].filter((a) => a !== action);
    for (const other of otherActions) {
      if (settings.keyBindings[other] === event.code) {
        showToast(t('errKeyInUse', [codeToLabel(event.code), otherLabel(other)]));
        return;
      }
    }

    const newBindings = { ...settings.keyBindings, [action]: event.code };
    settings.keyBindings = newBindings;
    clearRebindState();
    render();
    await storage.set({ keyBindings: newBindings });
  }

  function otherLabel(action) {
    if (action === 'down') return t('actionDown');
    if (action === 'up') return t('actionUp');
    return t('actionToggle');
  }

  async function resetKeyBindings() {
    const defaults = storage.DEFAULTS.keyBindings;
    settings.keyBindings = { ...defaults };
    render();
    await storage.set({ keyBindings: { ...defaults } });
    showToast(t('toastResetDone'));
  }

  async function toggleExclude() {
    if (!hostSupported || !currentHostname) return;
    const current = settings.excludedDomains.slice();
    const idx = current.indexOf(currentHostname);
    if (idx === -1) {
      current.push(currentHostname);
    } else {
      current.splice(idx, 1);
    }
    settings.excludedDomains = current;
    render();
    el.domainHint.classList.remove('hidden');
    await storage.set({ excludedDomains: current });
  }

  async function resolveCurrentHost() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;
      const url = new URL(tab.url);
      const scheme = url.protocol.replace(':', '');
      if (scheme === 'file') {
        currentHostname = null;
        hostSupported = false;
        el.currentDomain.textContent = t('hostLocalFile');
        return;
      }
      if (scheme !== 'http' && scheme !== 'https') {
        currentHostname = null;
        hostSupported = false;
        el.currentDomain.textContent = t('hostUnsupported');
        return;
      }
      currentHostname = url.hostname;
      hostSupported = true;
      el.currentDomain.textContent = currentHostname;
    } catch (err) {
      console.warn('[MNVS popup] tab resolve failed', err);
      currentHostname = null;
      hostSupported = false;
      el.currentDomain.textContent = t('hostFetchFailed');
    }
  }

  function bindEvents() {
    el.btnDown.addEventListener('click', () => handleAction('down'));
    el.btnUp.addEventListener('click', () => handleAction('up'));
    el.btnToggle.addEventListener('click', () => handleAction('toggle'));

    el.stepInput.addEventListener('change', commitStep);
    el.stepInput.addEventListener('blur', commitStep);
    el.targetInput.addEventListener('change', commitTarget);
    el.targetInput.addEventListener('blur', commitTarget);

    for (const action of ['down', 'up', 'toggle']) {
      el.keyButtons[action].addEventListener('click', () => startRebind(action));
    }
    el.resetKeys.addEventListener('click', resetKeyBindings);

    el.toggleExclude.addEventListener('click', toggleExclude);
  }

  async function init() {
    applyI18n();
    settings = await storage.getAll();
    if (actions.isTargetForbidden(settings.toggleTargetSpeed)) {
      console.warn(
        '[MNVS popup] toggleTargetSpeed is in the forbidden zone [0.9, 1.1]. ' +
          'Please update it to a value outside this range.',
        settings.toggleTargetSpeed
      );
    }
    await resolveCurrentHost();
    render();
    bindEvents();

    storage.onChanged((changes) => {
      for (const [key, { newValue }] of Object.entries(changes)) {
        settings[key] = newValue;
      }
      render();
    });
  }

  init().catch((err) => {
    console.error('[MNVS popup] init failed', err);
  });
})();
