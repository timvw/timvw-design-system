# Application components

The component source is ordinary HTML, CSS, and JavaScript. There is no framework, package installation, transpilation, bundling, or runtime service.

## Files and initialization

Copy `css/timvw.css` and `css/components.css`, the **whole `js/` directory**, and `icons.svg` into your project. The small modules imported by `js/timvw.js` must remain beside it. `js/docs.js` is showcase-only and can be omitted. Keep the license and attribution files described in README.md.

```html
<link rel="stylesheet" href="./css/timvw.css">
<link rel="stylesheet" href="./css/components.css">
<script type="module">
  import { init } from './js/timvw.js';
  init();
</script>
```

Use `class="tvw"` on the body. Call `init(parent)` after inserting new components. It enhances descendants and is safe to repeat. Do not replace an initialized component's internal structure except through the documented table refresh API. Replace the component as a whole if its structure changes.

The current browser requirements include ES modules, native dialogs, the Popover API, CSS layers, `:has()`, and OKLCH colors. No polyfills are supplied. The earlier basic components still work with their existing markup.

Live markup examples are in [components.html](components.html). Attributes beginning with `data-demo-` and handlers in `js/docs.js` belong to the demonstrations; bind your own application actions using the APIs below. Styled buttons alone do not save, delete, or download anything.

## Essentials

| Component | Markup and variants | Behavior and accessibility |
| --- | --- | --- |
| Icons | `.tvw-icon`, optional `--lg`; `<use href="./icons.svg#search">` | Decorative SVGs use `aria-hidden="true"`. Name the surrounding action. The sprite provides sun, moon, computer, search, close, check, plus, menu, more, arrow-right, chevron-down, info, warning, folder, download, copy, delete, settings, dashboard, and eye. |
| Buttons | `.tvw-button` with `--sm`, `--lg`, `--icon`, `--secondary`, `--quiet`, or `--danger` | Native button keyboard behavior. Icon buttons need accessible names. Use `disabled` for unavailable buttons; use links for navigation. Small buttons are intended for compact layouts; prefer default 44px controls for touch. |
| Loading | `setBusy(button, true, 'Saving…')`, then `setBusy(button, false)` | Preserves original child nodes, listeners, disabled state, and `aria-busy`. Announce completion separately. Use `finally` so a failed operation also restores the button. |
| Switches | Native checkbox with `role="switch"` inside `.tvw-switch`, followed by `.tvw-switch-track` | Space toggles; the label supplies the name. Supports checked, unchecked, focused, and disabled states. |
| Segmented choice | Labeled `fieldset` and `.tvw-segmented` labels containing radios with the same name | Native single selection and arrow-key behavior; supports disabled options. Use for choices, not navigation or tabs. |
| Breadcrumbs | Labeled `nav.tvw-breadcrumbs` containing an ordered list | Use real links for ancestors and `aria-current="page"` on the current item. |
| Pagination | Labeled `nav.tvw-pagination` with links, or generated table buttons | Give numbered controls meaningful names and mark the current page. Do not leave placeholder `href="#"` links. |
| Empty states | `.tvw-empty` with heading, explanation, and optional action | Explain whether the collection is empty or filters found no matches; provide a relevant next action. |
| Notices and badges | Existing success/danger variants plus `--warning` and `--info` | Color is supplemented by text and optional decorative icons. Static notices do not need `role="alert"`. |

```js
import { setBusy, notify } from './js/timvw.js';
button.addEventListener('click', async () => {
  setBusy(button, true, 'Saving…');
  try {
    await saveYourData();
    notify('Saved.', { tone: 'success', duration: 6000 });
  } catch {
    notify('Could not save. Try again.', { tone: 'danger' });
  } finally {
    setBusy(button, false);
  }
});
```

## Theme picker

Use `.tvw-theme-picker[data-tvw-theme-picker]` with `role="group"` and an accessible group label. Its three buttons have `data-theme="light"`, `"dark"`, and `"system"`, accessible names, and `aria-pressed`. Start the group `hidden`; `init()` reveals it. Multiple pickers stay synchronized.

`setTheme('light' | 'dark' | 'system')` applies and remembers the preference; `getTheme()` returns the preference, including `system`. In system mode, OS changes are followed automatically. `tvw:themechange` is dispatched on `document` with `{ mode, resolved }`. A blocked localStorage does not prevent selection. Themes are document-wide, not scoped per component. Without a picker or an explicit `setTheme()` call, the library does not automatically change the page theme.

## Layout

```html
<div class="tvw-app" data-tvw-app>
  <header class="tvw-app-header">
    <button class="tvw-button tvw-button--secondary" type="button"
      data-tvw-nav-toggle aria-controls="workspace-nav"
      aria-expanded="false" hidden>Navigation</button>
    <a class="tvw-app-brand" href="./">Workspace</a>
  </header>
  <aside class="tvw-app-sidebar" id="workspace-nav">
    <nav class="tvw-nav" aria-label="Workspace">
      <a href="./" aria-current="page">Overview</a>
      <a href="./settings.html">Settings</a>
    </nav>
  </aside>
  <main class="tvw-app-main tvw-container">
    <div class="tvw-page-heading"><h1>Overview</h1></div>
    <div class="tvw-grid"><article class="tvw-card">Content</article></div>
  </main>
</div>
```

The sidebar is always visible at desktop sizes and can be expanded inline below 52rem. This is a nonmodal disclosure: it does not trap focus. Escape closes an expanded mobile sidebar and returns focus to its toggle. Without JavaScript, navigation remains visible. Use the native-dialog drawer for modal detail panels.

`--tvw-sidebar-width`, `--tvw-content-width`, and `--tvw-grid-min` customize layout dimensions. `.tvw-grid` uses responsive CSS Grid columns; `.tvw-container` constrains content width. Add a skip link and keep one main landmark per page.

## Menus, popovers, tooltips, and drawers

| Component | Contract | Keyboard / focus |
| --- | --- | --- |
| Action menu | Native `popover` with `.tvw-menu[data-tvw-menu]`, `role="menu"`, and named native button/link `role="menuitem"` children. Trigger uses `popovertarget` and `aria-haspopup="menu"`. | Enter/Space/Down opens at the first enabled item; Up opens at the last. Arrows wrap, Home/End jump, and typing matches item labels. Disabled items are skipped. Escape returns focus; Tab closes and proceeds from the trigger. Actions close the menu. No nested menus or checkbox/radio menu items in this release. |
| Popover | `.tvw-popover[data-tvw-popover][popover]` and a `popovertarget` trigger | Native outside-click and Escape dismissal. Nonmodal: Tab reaches its controls. The module positions it near its first trigger and repositions on scrolling/resizing. Use one opening trigger per popover. Without JS, native popovers use centered positioning. |
| Tooltip | `[data-tvw-tooltip]` wrapper containing a focusable trigger with `aria-describedby` and a `.tvw-tooltip[role="tooltip"][popover="manual"]` | Opens on hover/focus/tap, remains hoverable, and dismisses on Escape or a tap outside. Text only, no interactive children. Do not put essential instructions only in a tooltip. |
| Drawer | `dialog.tvw-dialog.tvw-drawer` with `aria-labelledby`; trigger uses the existing `data-tvw-open` contract | Native modal focus behavior, Escape dismissal, and opener focus restoration. Use a visible close button with `form method="dialog"`. Keep essential information available elsewhere when JavaScript is unavailable. |

Browser-native Popover and dialog behavior supply the underlying opening/dismissal semantics. The menu and tooltip enhancements require `init()`. Native popovers themselves work without modules in supported browsers. Reusable tooltips are separate from browser `title` hints used on some theme icon controls.

## Notifications

`notify(message, { tone: 'info', duration: 0 })` returns a dismissal function. Tones are `info`, `success`, `warning`, and `danger`. Text is inserted with `textContent`, never interpreted as HTML. Every notification includes a close button and a polite status announcement.

The default is no automatic dismissal. A positive duration in milliseconds pauses while the toast has hover/focus or the document is hidden. Avoid short timeouts for important messages. The notification region is attached to the document body; close a modal before announcing its completed action, or keep errors within the dialog. This is not a push-notification or network-delivery service.

## Forms

`.tvw-input-group` groups a native input with a prefix/suffix or action. Keep units in an accessible description, not only a decorative prefix. `.tvw-range` styles native range inputs. Date, time, number, and file inputs use browser pickers. File selection does not upload anything.

Password toggles use `button[data-tvw-password][aria-controls="input-id"]` next to a native password input. The button begins hidden, is revealed by `init()`, and changes its label and pressed state without altering the value.

To enhance validation, add `data-tvw-validate` to a form and include a summary:

```html
<div class="tvw-notice tvw-notice--danger" data-tvw-errors
  tabindex="-1" role="region" aria-label="Form errors" hidden></div>
```

The enhancer uses native constraint validation (`required`, input types, `min`, `max`, `pattern`, etc.). Invalid submission focuses a summary of links and connects inline error text with `aria-describedby`. Correcting a field updates its error; reset clears generated feedback. Existing help-text references are retained. Use unique input IDs and visible labels. It does not implement server validation, cross-field rules, or asynchronous validation for you.

On valid submission, the form dispatches `tvw:valid-submit`, with `detail.formData`. Cancel that event to take over the submission:

```js
form.addEventListener('tvw:valid-submit', event => {
  event.preventDefault();
  const values = event.detail.formData;
  // Save locally or submit to your own application.
});
```

If the event is not canceled, normal form submission proceeds. Without JavaScript, normal native validation remains available. The example pages hide local-save controls without JavaScript because they have no server endpoint.

## Tables

Use a container with `data-tvw-table` and optional `data-page-size="6"`. It contains a semantic table with one header row and one tbody. The optional controls are:

| Attribute | Purpose |
| --- | --- |
| `data-tvw-search` | Search input; uses `tr[data-search]` if supplied, otherwise row text |
| `data-tvw-filter="status"` | Select matched against `tr[data-status]`; an empty value means all |
| `data-tvw-filter-chips` | Container for removable search/filter chips |
| `data-tvw-sort="text\|number\|date"` | Header button; numeric/date values may use `td[data-sort-value]` |
| `data-tvw-row-select` | Checkbox with a unique record ID as its value |
| `data-tvw-select-all` | Checkbox selecting only enabled rows on the current page |
| `data-tvw-selection-count` | Selected count across pages and filters |
| `data-tvw-result-count` | Current displayed range and filtered total |
| `data-tvw-pagination` | Labeled navigation for generated page controls; omit to show all filtered rows |
| `data-tvw-empty` | Empty/no-match state, initially hidden |
| `data-tvw-clear-filters` | Button clearing search and all selects |
| `data-tvw-table-controls` | Initially hidden search/filter controls, revealed at initialization |

Sorting uses numeric comparison for numbers, parsed dates for dates, and locale-aware text comparison. Supply ISO dates and raw numbers in `data-sort-value`. It updates `aria-sort` and keeps equal values stable. There is no remote sorting, data fetching, virtualization, cell editing, or multi-column sorting.

`getTable(container)` returns `refresh()`, `getSelected()`, and `clearSelection()`. Refresh re-reads current tbody rows after an application inserts or removes them. Hidden selections remain selected until cleared or their rows are removed. Events bubble from the container: `tvw:selectionchange` provides `{ values }`; `tvw:tablechange` provides `{ total, filtered, page, pages }`.

Pagination/filtering are enhancements over existing HTML rows. Without JavaScript, all source rows remain readable. Keep sorting and select-all buttons disabled in the initial markup; initialization enables them. A scrollable table wrapper needs an accessible name and keyboard focusability.

## Complete examples and verification

- [Settings](examples/settings.html): native form controls, synchronized theme pickers, validation, local saving, and restoring defaults.
- [Projects](examples/projects.html): search/filter, sorting, pagination, cross-page selection, create/edit/delete, detail drawers, and JSON download.
- [Dashboard](examples/dashboard.html): totals, status distribution, and upcoming work derived from the same local sample projects.

The examples use localStorage for optional persistence and report storage failures. They do not authenticate, contact a server, upload files, or schedule notifications. They are working examples to adapt, not a backend.

Run [tests/index.html](tests/index.html) on a static server for browser-native regression checks. Test your completed application with keyboard, touch, zoom, both themes, forced colors, and target screen readers. Automated behavior and contrast checks are not an accessibility certification.
