// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { install } from './package.js?v=0.9.0';
import { initControls } from '../js/controls.js?v=0.9.0';
export * from '../js/controls.js?v=0.9.0';
export const ready = install(["layout", "navigation", "buttons"], [initControls]);
await ready;
