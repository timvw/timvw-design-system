// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { install } from './package.js?v=0.9.0';
import { initTabs } from '../js/tabs.js?v=0.9.0';
export * from '../js/tabs.js?v=0.9.0';
await install(["tabs"], [initTabs]);
