// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { install } from './package.js?v=0.9.0';
import './card.js?v=0.9.0';
import './dialog.js?v=0.9.0';
export * from '../js/timvw.js?v=0.9.0';
import { init } from '../js/timvw.js?v=0.9.0';
await install(["accordion", "buttons", "cards", "charts", "chips", "commands", "details", "dialogs", "feedback", "files", "forms", "layout", "navigation", "overlays", "people", "select", "tables", "tabs", "theme", "workflows"], [init]);
