// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { install } from './package.js?v=0.9.0';
import { initAvatars } from '../js/workflow.js?v=0.9.0';
export * from '../js/workflow.js?v=0.9.0';
import { initOverlays } from '../js/overlays.js?v=0.9.0';
export * from '../js/overlays.js?v=0.9.0';
await install(["people", "overlays", "buttons"], [initAvatars, initOverlays]);
