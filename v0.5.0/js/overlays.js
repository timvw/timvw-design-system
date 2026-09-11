/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const enhanced = new WeakSet();
const tooltips = new Set();
let escapeListening = false;

function place(panel, trigger) {
  const rect = trigger.getBoundingClientRect();
  panel.style.margin = '0';
  panel.style.maxWidth = 'calc(100vw - 2rem)';
  const box = panel.getBoundingClientRect();
  const x = Math.max(16, Math.min(rect.left, innerWidth - box.width - 16));
  const below = rect.bottom + 8;
  const y = below + box.height <= innerHeight - 16 ? below : Math.max(16, rect.top - box.height - 8);
  panel.style.left = `${x}px`; panel.style.top = `${y}px`;
}

function follow(panel, trigger) {
  const controller = new AbortController();
  const reposition = () => place(panel, trigger);
  reposition();
  addEventListener('resize', reposition, { signal: controller.signal });
  document.addEventListener('scroll', reposition, { capture: true, signal: controller.signal });
  return () => controller.abort();
}

function initTooltip(wrapper) {
  const trigger = wrapper.querySelector('[aria-describedby]');
  const tip = wrapper.querySelector('[role="tooltip"]');
  if (!trigger || !tip || typeof tip.showPopover !== 'function') return;
  let hovering = false, focused = false, dismissed = false, timer, stop;
  const close = () => {
    clearTimeout(timer);
    if (tip.matches(':popover-open')) tip.hidePopover();
    stop?.(); stop = null; tooltips.delete(dismiss);
  };
  const dismiss = () => { dismissed = true; close(); };
  const show = () => {
    clearTimeout(timer);
    if (dismissed || tip.matches(':popover-open')) return;
    tip.showPopover(); stop = follow(tip, trigger); tooltips.add(dismiss);
  };
  const leave = () => {
    hovering = false;
    timer = setTimeout(() => { if (!focused && !hovering) { dismissed = false; close(); } }, 150);
  };
  wrapper.addEventListener('pointerenter', () => { hovering = true; show(); });
  wrapper.addEventListener('pointerleave', leave);
  tip.addEventListener('pointerenter', () => { hovering = true; show(); });
  tip.addEventListener('pointerleave', leave);
  trigger.addEventListener('focus', () => { focused = true; show(); });
  trigger.addEventListener('blur', () => { focused = false; if (!hovering) { dismissed = false; close(); } });
  // Tapping reveals the description; a subsequent tap outside dismisses it.
  trigger.addEventListener('click', show);
  document.addEventListener('pointerdown', event => {
    if (tip.matches(':popover-open') && !wrapper.contains(event.target)) dismiss();
  });
}

export function initOverlays(root) {
  if (!escapeListening) {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') tooltips.forEach(dismiss => dismiss());
    });
    escapeListening = true;
  }
  root.querySelectorAll('[data-tvw-popover], [data-tvw-menu]').forEach(panel => {
    if (enhanced.has(panel) || typeof panel.showPopover !== 'function') return;
    const trigger = [...document.querySelectorAll('[popovertarget]')].find(button => button.getAttribute('popovertarget') === panel.id && button.getAttribute('popovertargetaction') !== 'hide');
    if (!trigger) return;
    enhanced.add(panel);
    let stop, last = false, prefix = '', prefixTimer;
    const menu = panel.hasAttribute('data-tvw-menu');
    const items = () => [...panel.querySelectorAll('[role="menuitem"]')].filter(item => !item.disabled && item.getAttribute('aria-disabled') !== 'true' && !item.hidden);
    const close = (restore = false) => {
      if (panel.matches(':popover-open')) panel.hidePopover();
      if (restore) trigger.focus();
    };
    if (menu) {
      trigger.setAttribute('aria-haspopup', 'menu');
      items().forEach(item => { item.tabIndex = -1; });
      trigger.addEventListener('keydown', event => {
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault(); last = event.key === 'ArrowUp';
          if (!panel.matches(':popover-open')) panel.showPopover();
          else items()[last ? items().length - 1 : 0]?.focus();
        }
      });
      panel.addEventListener('keydown', event => {
        const options = items();
        const current = options.indexOf(document.activeElement);
        let next;
        if (event.key === 'ArrowDown') next = (current + 1) % options.length;
        if (event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = options.length - 1;
        if (next !== undefined) { event.preventDefault(); options[next]?.focus(); }
        else if (event.key === 'Escape') { event.preventDefault(); close(true); }
        else if (event.key === 'Tab') { close(true); /* Native Tab then leaves the trigger. */ }
        else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
          prefix += event.key.toLocaleLowerCase(); clearTimeout(prefixTimer);
          prefixTimer = setTimeout(() => { prefix = ''; }, 600);
          const rotated = [...options.slice(current + 1), ...options.slice(0, current + 1)];
          rotated.find(item => item.textContent.trim().toLocaleLowerCase().startsWith(prefix))?.focus();
        }
      });
      panel.addEventListener('click', event => {
        const item = event.target.closest('[role="menuitem"]');
        if (item && !item.disabled && item.getAttribute('aria-disabled') !== 'true') close(true);
      });
    }
    panel.addEventListener('toggle', event => {
      const open = event.newState === 'open';
      trigger.setAttribute('aria-expanded', String(open));
      stop?.(); stop = null;
      if (open) {
        stop = follow(panel, trigger);
        if (menu) { const options = items(); options[last ? options.length - 1 : 0]?.focus(); last = false; }
      } else { clearTimeout(prefixTimer); prefix = ''; }
    });
    trigger.setAttribute('aria-expanded', 'false');
  });
  root.querySelectorAll('[data-tvw-tooltip]').forEach(wrapper => {
    if (enhanced.has(wrapper)) return;
    enhanced.add(wrapper); initTooltip(wrapper);
  });
}

/** A dismissible polite notification. Optional timeout pauses on hover, focus, or a hidden tab. */
export function notify(message, { tone = 'info', duration = 0 } = {}) {
  let region = document.querySelector('[data-tvw-notifications]');
  if (!region) {
    region = document.createElement('section'); region.className = 'tvw-toast-region';
    region.dataset.tvwNotifications = ''; region.setAttribute('aria-label', 'Notifications');
    document.body.append(region);
  }
  const toast = document.createElement('div');
  toast.className = `tvw-toast tvw-notice tvw-notice--${['success', 'danger', 'warning', 'info'].includes(tone) ? tone : 'info'}`;
  const content = document.createElement('p'); content.setAttribute('role', 'status');
  const dismissButton = document.createElement('button');
  dismissButton.type = 'button'; dismissButton.className = 'tvw-button tvw-button--quiet tvw-button--icon';
  dismissButton.textContent = '×'; dismissButton.setAttribute('aria-label', 'Dismiss notification');
  toast.append(content, dismissButton); region.append(toast);
  requestAnimationFrame(() => { content.textContent = String(message); });
  const opener = document.activeElement;
  let remaining = Math.max(0, Number(duration) || 0), started = 0, timer, hovering = false, focused = false;
  const controller = new AbortController();
  function dismiss() {
    clearTimeout(timer); controller.abort();
    const restore = toast.contains(document.activeElement);
    toast.remove();
    if (restore && opener?.isConnected) opener.focus();
  }
  function pause() {
    if (timer) { clearTimeout(timer); timer = null; remaining = Math.max(0, remaining - (performance.now() - started)); }
  }
  function resume() {
    if (duration > 0 && !hovering && !focused && !document.hidden && toast.isConnected) {
      pause(); started = performance.now(); timer = setTimeout(dismiss, remaining);
    }
  }
  dismissButton.addEventListener('click', dismiss);
  toast.addEventListener('pointerenter', () => { hovering = true; pause(); });
  toast.addEventListener('pointerleave', () => { hovering = false; resume(); });
  toast.addEventListener('focusin', () => { focused = true; pause(); });
  toast.addEventListener('focusout', event => { focused = toast.contains(event.relatedTarget); if (!focused) resume(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else resume(); }, { signal: controller.signal });
  resume(); return dismiss;
}
