(() => {
  'use strict';

  const ns = (window.__MNVS__ = window.__MNVS__ || {});

  function isTyping(target) {
    if (!target) return false;
    const tag = target.nodeName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (target.isContentEditable === true) return true;
    return false;
  }

  function hasModifier(event) {
    return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
  }

  function matchAction(code, bindings) {
    if (!bindings) return null;
    if (code === bindings.down) return 'down';
    if (code === bindings.up) return 'up';
    if (code === bindings.toggle) return 'toggle';
    return null;
  }

  function createHandler({ getBindings, hasMedia, onAction }) {
    function handleKeydown(event) {
      if (hasModifier(event)) return;
      if (isTyping(event.target)) return;
      if (!hasMedia()) return;
      const action = matchAction(event.code, getBindings());
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();
      onAction(action);
    }

    function start() {
      document.addEventListener('keydown', handleKeydown, true);
    }

    function stop() {
      document.removeEventListener('keydown', handleKeydown, true);
    }

    return { start, stop };
  }

  ns.keyHandler = { createHandler };
})();
