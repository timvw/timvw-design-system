# Upgrading

## v0.7.0 → v0.8.0

Existing CSS, initializers and `registerTemplate()` remain supported. Packaged
`<tvw-dialog>` and `<tvw-card>` are optional new entries with native Shadow DOM
slots. Copy `components/` together and import only the component you need; no
separate CSS or initialization is required. See [WEB_COMPONENTS.md](WEB_COMPONENTS.md).

The light DOM helper keeps its existing behavior. Global CSS reaches authored
slotted content; customize packaged internals with public tokens and `::part()`.
Do not load different versions of the same custom tag into one document.

## v0.6.0 → v0.7.0

Existing markup and JavaScript APIs remain supported. `registerTemplate` is an optional new export from `templates.js` and the full entry point; see [reusable HTML tags](MODULES.md#reusable-html-tags) for registration and lifecycle details. No global registration happens automatically when importing the library.

Replace both full stylesheets, or update `foundation.css` and the CSS parts you use together. Forced-color button/badge/tab rules now live with their components, so do not mix old and new generated files. See [ACCESSIBILITY_REVIEW.md](ACCESSIBILITY_REVIEW.md) for the audit scope and parked manual checks.

## Upgrading to v0.6.0

## Existing v0.5.0 applications

Replace the full `css/` and runtime `js/` directories together. The existing full CSS entry points, `init()`, classes and controller APIs remain supported. Do not mix versioned JavaScript modules: imports include release query suffixes so one release uses one set of shared controllers.

The easiest upgrade is the downloadable runtime bundle. Preserve any application-owned styles and handlers separately; do not overwrite custom files with the bundle. Existing demo archives remain frozen, and their Latest navigation reads the shared release catalogue.

## Optional selective loading

Instead of the full CSS pair, load `css/foundation.css` followed by the required `css/parts/*.css`. Import an initializer directly from its module to avoid loading the full JavaScript graph. See [MODULES.md](MODULES.md) for the dependency table. This is opt-in: existing full imports continue to work.

## Forms

Existing `data-tvw-validate` markup and the cancelable `tvw:valid-submit` event still work. `getForm(form)` now exposes `configure({validate})`, `validate()`, `setErrors()` and `clearErrors()`.

Asynchronous validators return an object whose keys are field names/IDs and values are error strings. `_form` (or an unknown field key) becomes a general summary error. Return `{}` for success. Validators receive `{ signal }`; handle aborts in requests and avoid side effects. Input changes cancel validation and clear generated external errors; native constraints are then checked again. A rejected request displays a retryable general error and preserves values. Persistence still belongs in the valid-submit handler.

`setErrors(errors)` shows server errors after a submission; it does not call `setCustomValidity` or replace native constraint messages. `watchChanges` is opt-in and must be marked saved only after persistence succeeds.

## Files

Upload adapters still accept `(file, reportProgress)`. A third argument, `{ signal }`, enables cancellation. `getFilePicker(wrapper).cancel()` aborts that signal and prevents subsequent files from starting. Update adapters to pass the signal to `fetch` or abort XHR. The UI remains busy until the adapter settles; an adapter that ignores cancellation cannot be forcibly stopped. Already completed remote uploads are not undone. Reset aborts and clears the selection. Retry sends unfinished files only.

## Comboboxes

Native optgroups are now represented as labeled groups. Existing local options need no migration. `configure({loadOptions, debounce, minimumLength})` enables optional asynchronous results. The adapter returns `{ value, label, group?, disabled? }[]` and receives `{signal}`. Selected values survive result replacement; duplicate/empty values are ignored. Reset restores the original native options. Large virtualized lists, free-text tags and nested option trees remain outside the component's scope.

## Locale

Call `setLocale('nl-BE')` before `init()` to use Dutch generated strings; English is the fallback. `addMessages(locale, messages)` provides application translations. `formatDate` and `formatNumber` wrap Intl with the configured locale. Page copy, server error messages and browser-owned validation/pickers need their own localization. Existing initialized labels are not all rewritten when the locale changes; use a page reload when switching the whole application language, as the localized example does.

## Tables

Existing exact filters and chips are unchanged. Add `data-filter-mode="min"` / `"max"` to ISO date inputs and the matching row `data-*` value. Add a unique `data-tvw-url="namespace"` on the table container to persist filter values in the URL. Give each control a unique `name`, especially range endpoints. Only opt-in filter values enter the URL; do not use it for confidential queries. Other parameters and fragment links are preserved. Pagination/selection/column preferences are not persisted by this option.

## Templates

`instantiateTemplate()` is optional. Native `template.content.cloneNode(true)` continues to work, but callers must then manage ID uniqueness and references themselves. Do not copy event listeners or rely on executable template expressions. Bind text safely and initialize the appended container. See the minimal template example and MODULES.md.
