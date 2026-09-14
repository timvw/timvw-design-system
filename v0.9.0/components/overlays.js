// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { install } from './package.js?v=0.9.0';
import { initOverlays } from '../js/overlays.js?v=0.9.0';
export * from '../js/overlays.js?v=0.9.0';
export const ready = install(["overlays", "buttons", "feedback"], [initOverlays]);
await ready;
