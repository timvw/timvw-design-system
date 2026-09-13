# Loading only what you use

The library has three supported entry styles. All run directly in current browsers without a build step.

## One import for packaged tags

Import `components/dialog.js` for `<tvw-dialog>` or `components/card.js` for
`<tvw-card>`. Each entry supplies HTML, scoped CSS, behavior and automatic
registration. Both support native slots, with no separate stylesheet or `init()`.
See [Web Components](WEB_COMPONENTS.md) and the [working demo](examples/packaged-components.html).
These entries are opt-in and are not imported by `js/timvw.js`.

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
| Reusable HTML tags | Parts used by their template | templates.js: `registerTemplate` |

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

## Reusable HTML tags

`registerTemplate(name, template, { setup })` turns a trusted `<template>` into an
autonomous native custom element. After registration, both existing and newly
inserted tags enhance automatically. No extra `init(document)` call is needed.

```html
<template id="project-template">
  <button type="button" class="tvw-button" data-tvw-open="details"
    data-tvw-text="action" hidden>Open project</button>
  <dialog id="details" class="tvw-dialog" aria-labelledby="heading">
    <h2 id="heading" data-tvw-text="heading">Project details</h2>
    <form method="dialog"><button class="tvw-button" autofocus>Close</button></form>
  </dialog>
</template>

<project-dialog heading="Atlas" action="Open Atlas"></project-dialog>
<project-dialog heading="Beacon" action="Open Beacon"></project-dialog>

<script type="module">
  import { registerTemplate } from './js/templates.js';
  import { initDialogs } from './js/dialogs.js';
  registerTemplate('project-dialog', document.getElementById('project-template'), {
    setup: initDialogs
  });
</script>
```

Load foundation plus button/dialog CSS for this example. The [working tag demo](examples/custom-elements.html)
also registers a card, changes attributes and inserts/removes instances. It uses
only direct module imports. The wrapper is ordinary light DOM: global CSS, native
form fields and the real `<dialog>` continue to work. Set the host's layout with
your CSS or a utility class if needed; there is no automatic CSS encapsulation.

- A name needs a hyphen, for example `project-dialog`. The native registry rejects
  invalid or already registered names; choose an application prefix to avoid
  collisions. Register once, or guard registration with `customElements.get(name)`.
  The returned value is the registered element constructor.
- Each `data-tvw-text="heading"` binding observes the corresponding `heading`
  attribute. Use lowercase attribute names and text-only binding elements.
  Values are text, never parsed HTML. Removing an attribute restores that binding's
  original text. Undeclared attributes keep their ordinary HTML behavior.
- `element.setAttribute('heading', 'Updated')` changes the existing text nodes.
  It preserves input values, dialog state, focus and remapped IDs. A definition is
  copied at registration; later edits to the source template do not alter it.
- Authored host children are preserved before the generated content. This helper
  does not project `<slot>` content, clone host children, bind HTML expressions or
  provide arbitrary property/attribute forwarding. Put trusted rich markup in the
  template or use ordinary DOM APIs in `setup`.
- All IDs and supported references in the template are remapped per instance,
  exactly as with `instantiateTemplate`. Submitted form field names remain yours
  to choose. The host itself is not a form-associated replacement for native inputs.

`setup(element, { signal, getId })` runs after the content is inserted and on later
reconnections. It may return a synchronous cleanup function. On disconnection,
the signal is aborted and cleanup runs in a microtask. Use the signal for listeners
on `window`/`document` and abortable work. An immediate move within the same document
retains the connection and input state. For native dialogs, close them before moving
their host; a removal cleanup should also close any open dialog before reconnection.

```js
registerTemplate('project-dialog', template, {
  setup(element, { signal, getId }) {
    initDialogs(element);
    const dialog = document.getElementById(getId('details'));
    window.addEventListener('project:updated', refresh, { signal });
    return () => { if (dialog.open) dialog.close(); };
  }
});
```

Import dependencies before registration; `setup` must not return a Promise.
The helper does not add a general destroy API to enhanced components. Use their
controller APIs and cleanup contracts for pending work. Moving instances between
documents/iframes is outside this helper's supported lifecycle.

JavaScript must load for registration and template instantiation. Use ordinary
authored HTML for essential no-JavaScript content. A module script runs after
parsing, so the definition and host children are available before upgrade.
This uses the platform's [custom element lifecycle](https://html.spec.whatwg.org/multipage/custom-elements.html),
with no framework, transpiler, polyfill or consumer build step.

## Initialization and lifetime

Initializers enhance descendants, so pass `document` or a containing element, not the component element itself. Repeated initialization is safe. Append cloned HTML before initializing so ID references resolve. Use the documented controller APIs instead of replacing an enhanced component's internal DOM.

`watchChanges(form)` installs a beforeunload listener only while dirty. Call `markSaved()` after successful persistence and `destroy()` when removing the form. Browsers control the wording/availability of unload warnings; SPA navigation should consult `isDirty()` and show its own confirmation. File adapters must respect their AbortSignal. Cancel pending work before removing interactive content.

There is no general destroy/reinitialize API for all components. Long-lived pages with frequent mount/unmount cycles should retain component instances or scope disposal in the consuming application; this library primarily enhances ordinary documents.

## Maintaining modular CSS

The two original stylesheets remain canonical. Run `python3 scripts/build-css.py` after editing them. CI runs `--check` to reject stale generated parts. This is maintainer tooling only; the shipped CSS requires no generation or Sass.
