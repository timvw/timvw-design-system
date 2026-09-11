# Loading only what you use

The library has two supported entry styles. Both run directly in current browsers without a build step.

## Full entry points

Load `css/timvw.css` and `css/components.css`, then import `init` from `js/timvw.js`. This downloads the complete JavaScript graph, even when importing only one export from `timvw.js`: native browsers do not tree-shake modules.

## Selective CSS

Load `css/foundation.css` first. It supplies the tokens, base typography, focus/hidden/reduced-motion rules and basic stack/cluster utilities. Then load only the files below from `css/parts/`. Use `class="tvw"` on the body. Each file is already generated and ready to serve; do not load it together with the full stylesheets.

| Feature | CSS parts (in addition to foundation) | JavaScript import |
| --- | --- | --- |
| Buttons and icons | buttons | None; controls.js for `setBusy` |
| Native inputs, switches, radios | forms | None; controls.js for password visibility |
| Validated forms | forms, feedback, buttons | forms.js: `initForms`, `getForm` |
| Cards | cards | None |
| Badges, notices, progress, skeleton | feedback | workflow.js only for region switching |
| Dialog and drawer | dialogs, buttons | dialogs.js: `initDialogs` |
| Tabs | tabs | tabs.js: `initTabs` |
| Accordion | accordion | None |
| Menu, popover, tooltip | overlays, buttons | overlays.js: `initOverlays` |
| Notifications | overlays, feedback, buttons | overlays.js: `notify` |
| Combobox | select, forms, chips, buttons | select.js: `initSelects`, `getCombobox` |
| Tables and filters | tables, forms, chips, buttons | table.js: `initTables`, `getTable` |
| Wizard | workflows, forms, buttons | workflow.js: `initWorkflows`, `getWizard` |
| Files | files, forms, buttons, feedback | files.js: `initFiles`, `getFilePicker` |
| Avatars | people | workflow.js: `initAvatars` for image fallback |
| Navigation and app layout | navigation, layout, buttons | controls.js: `initControls` for mobile toggle |
| Theme picker | theme, buttons | controls.js: `initControls`, `setTheme` |
| SVG charts | charts, tables | None |
| Details and timeline | details | None |
| Inline editing | forms, buttons | interactions.js: `initInteractions`, `getEditor` |
| Command palette | commands, dialogs, forms, buttons | interactions.js: `initInteractions`, `getCommands` |
| Native templates | Parts used by their contents | templates.js: `instantiateTemplate` |

`dialogs.js`, `tabs.js` and `templates.js` have no dependencies. The other direct component modules import only `locale.js`. Keep it beside them; relative module paths include a release query suffix. You may copy the whole `js/` directory: copying a file does not cause a browser to load it. Demo scripts (`docs.js`, `demo-versions.js`, `patterns.js`, `explore.js`, `playground.js`) are not required by consuming applications.

```html
<link rel="stylesheet" href="./css/foundation.css">
<link rel="stylesheet" href="./css/parts/buttons.css">
<link rel="stylesheet" href="./css/parts/dialogs.css">
<script type="module">
  import { initDialogs } from './js/dialogs.js';
  initDialogs(document);
</script>
```

The [minimal template example](examples/templates.html) demonstrates this network footprint. The automated suite checks that no unrelated module or full stylesheet is requested.

## Load a module on first use

Direct imports may also be deferred until the application creates a component:

```js
const { initDialogs } = await import('./js/dialogs.js');
container.append(instance.fragment);
initDialogs(container);
```

Keep its required CSS loaded before revealing the component. Native browsers cache module imports, so later instances reuse the module. No global component registration or automatic scanning service is required.

## Native templates

Use `<template id="project-dialog">` as a document-local registry. Template content is inert until cloned. `instantiateTemplate(template, { values })` returns `{ fragment, ids, getId }`. Append the fragment, then initialize its parent with the component modules used inside it.

The helper remaps IDs, label/form/list references, ARIA ID references, dialog/popover targets and local fragment links. `data-tvw-text="name"` slots receive `String(values.name)` through `textContent`; HTML in a value is not parsed. Unmatched references remain unchanged so a template may refer to a shared external description.

Template markup must be trusted. The helper is not an HTML sanitizer. It does not rewrite CSS selectors or scripts, bind arbitrary attributes, or instantiate nested template contents; avoid styles/scripts inside a reusable fragment. Event listeners must be added after cloning. If instances share a parent form, choose field names intentionally: ID remapping does not rename submitted fields.

## Initialization and lifetime

Initializers enhance descendants, so pass `document` or a containing element, not the component element itself. Repeated initialization is safe. Append cloned HTML before initializing so ID references resolve. Use the documented controller APIs instead of replacing an enhanced component's internal DOM.

`watchChanges(form)` installs a beforeunload listener only while dirty. Call `markSaved()` after successful persistence and `destroy()` when removing the form. Browsers control the wording/availability of unload warnings; SPA navigation should consult `isDirty()` and show its own confirmation. File adapters must respect their AbortSignal. Cancel pending work before removing interactive content.

There is no general destroy/reinitialize API for all components. Long-lived pages with frequent mount/unmount cycles should retain component instances or scope disposal in the consuming application; this library primarily enhances ordinary documents.

## Maintaining modular CSS

The two original stylesheets remain canonical. Run `python3 scripts/build-css.py` after editing them. CI runs `--check` to reject stale generated parts. This is maintainer tooling only; the shipped CSS requires no generation or Sass.
