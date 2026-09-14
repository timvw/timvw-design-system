// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { install } from './package.js?v=0.9.0';
import { initSelects } from '../js/select.js?v=0.9.0';
export * from '../js/select.js?v=0.9.0';
export const ready = install(["select", "forms", "buttons", "chips"], [initSelects]);
await ready;
