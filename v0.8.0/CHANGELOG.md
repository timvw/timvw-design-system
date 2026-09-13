# Changelog

## 0.8.0

- Add one-import `<tvw-dialog>` and `<tvw-card>` entries: native slots, encapsulated
  styles, automatic registration and shared canonical color-token defaults.
- Support slotted dialog forms with native validation, cancellation and return
  values; preserve original nodes/listeners, input state and focus on close.
- Add standalone demos, own-component authoring guidance, selective network and
  independent ZIP checks, keyboard/theme/accessibility and visual regressions.
- Preserve the light DOM template API and all earlier frozen demos.

## 0.7.0

- Add `registerTemplate`: register native HTML templates as reusable custom tags, with isolated IDs, safe reactive text attributes, automatic initialization and connection cleanup.
- Add a live custom-tag demo for independent project dialogs and cards, including dynamic insertion, attribute updates and retained input state.
- Keep combobox input focus while selecting an option through touch-generated mouse events.
- Fix forced-color rendering: off/disabled switch thumbs remain visible, the pressed theme button retains its selected border, and the current pagination button has an outline.
- Apply the fixes to full and selective CSS without breaking existing markup or JavaScript APIs.
- Add full/selective forced-color regressions, native modal accessibility/focus checks, grouped option semantics and touch-event workflows.
- Publish a reproducible accessibility review with screen-reader, Windows contrast-theme and physical-device cases. The maintainer has parked those manual sessions; automated results are not presented as manual passes.

## 0.6.0

- Add optional modular CSS families and direct JavaScript entry points for dialogs and tabs. Keep the full entry points compatible.
- Add native HTML template instantiation with unique IDs, rewritten references and safe text slots; include a minimal-import dialog demo.
- Add English/Dutch generated component messages, locale-aware formatting and a translated workspace example.
- Add asynchronous form validation, server/cross-field error mapping and optional unsaved-change tracking.
- Add native optgroup support and cancellable asynchronous option adapters.
- Add cooperative upload cancellation while preserving retryable selections.
- Extend table filters with ISO date ranges and opt-in URL persistence.
- Add inline editing, details/activity patterns, a keyboard command palette, a component guide, an interactive playground and an article/documentation layout.
- Add a deterministic downloadable runtime bundle and migration guidance.
- Expand browser and automated accessibility checks. Manual screen-reader and real-device audits remain separately documented.

## 0.5.0

Add searchable selection, multi-step forms, file selection/upload states, region states, avatars, grouped navigation, expanded table rows, column visibility, SVG chart examples, a searchable catalogue and a website template. Add cross-browser workflow and visual regression checks.

## 0.4.0

Add application components and complete dashboard, project and settings examples. Add GitHub navigation and shared Latest catalogue resolution for archived demos.

## 0.3.0

Add versioned demos and icon-based light/dark/system theme controls.

## 0.2.0

Adopt QuantumBlack-derived color tokens with attribution and component-specific adjustments.

## 0.1.0

Initial vanilla HTML/CSS/JavaScript foundations and blue palette.
