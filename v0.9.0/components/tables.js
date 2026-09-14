// Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0
import { install } from './package.js?v=0.9.0';
import { initTables } from '../js/table.js?v=0.9.0';
export * from '../js/table.js?v=0.9.0';
export const ready = install(["tables", "forms", "buttons", "chips"], [initTables]);
await ready;
