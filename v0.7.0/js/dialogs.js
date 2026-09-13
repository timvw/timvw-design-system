/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const initializedTriggers = new WeakSet(), initializedDialogs = new WeakSet(), openers = new WeakMap();
export function initDialogs(root = document) {
  root.querySelectorAll('[data-tvw-open]').forEach((button) => {
    if (initializedTriggers.has(button)) return;
    const dialog = button.ownerDocument.getElementById(button.dataset.tvwOpen);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    initializedTriggers.add(button);
    button.hidden = false;
    button.addEventListener('click', () => {
      if (dialog.open) return;
      const parentPopover = button.closest('[popover]');
      const returnTarget = parentPopover && [...button.ownerDocument.querySelectorAll('[popovertarget]')]
        .find(trigger => trigger.getAttribute('popovertarget') === parentPopover.id && trigger.getAttribute('popovertargetaction') !== 'hide');
      openers.set(dialog, returnTarget || button);
      dialog.showModal();
    });
    if (!initializedDialogs.has(dialog)) {
      initializedDialogs.add(dialog);
      dialog.addEventListener('close', () => {
        const opener = openers.get(dialog);
        if (opener?.isConnected) opener.focus();
        openers.delete(dialog);
      });
    }
  });
}
