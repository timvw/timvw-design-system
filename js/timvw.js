/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
import { initSelects } from './select.js?v=0.8.0';
import { initWorkflows, initAvatars } from './workflow.js?v=0.8.0';
import { initFiles } from './files.js?v=0.8.0';
export { getCombobox } from './select.js?v=0.8.0';
export { getWizard, setRegionState } from './workflow.js?v=0.8.0';
export { getFilePicker } from './files.js?v=0.8.0';
import { initControls } from './controls.js?v=0.8.0';
import { initOverlays } from './overlays.js?v=0.8.0';
import { initTables } from './table.js?v=0.8.0';
export { setTheme, getTheme, setBusy } from './controls.js?v=0.8.0';
export { notify } from './overlays.js?v=0.8.0';
export { getTable } from './table.js?v=0.8.0';
import { initForms } from './forms.js?v=0.8.0';
export { getForm, watchChanges } from './forms.js?v=0.8.0';
export { setLocale, getLocale, addMessages, translate, formatNumber, formatDate } from './locale.js?v=0.8.0';
import { initInteractions } from './interactions.js?v=0.8.0';
export { getEditor, getCommands } from './interactions.js?v=0.8.0';
import { initTabs } from './tabs.js?v=0.8.0';
import { initDialogs } from './dialogs.js?v=0.8.0';
export { initTabs } from './tabs.js?v=0.8.0';
export { initDialogs } from './dialogs.js?v=0.8.0';
export { instantiateTemplate, registerTemplate } from './templates.js?v=0.8.0';

/** Enhance descendants; pass a containing element or document after inserting HTML. */
export function init(root = document) {
  initSelects(root); initFiles(root); initWorkflows(root); initAvatars(root);
  initControls(root); initForms(root); initInteractions(root); initOverlays(root); initTables(root);
  initTabs(root); initDialogs(root);
}
