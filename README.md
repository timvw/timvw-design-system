# timvw design system

A design system for timvw projects, written in plain HTML, CSS, and JavaScript. No frameworks, runtime dependencies, package installation, or build step.

The theme adapts QuantumBlack’s mist and slate palettes, monochrome actions, and cyan highlights to independent vanilla components. It uses system fonts, semantic color tokens, light and dark modes, and native browser controls.

[Explore the live component showcase](https://timvw.github.io/timvw-design-system/).

## Start using it

[Download v0.8.0](https://timvw.github.io/timvw-design-system/downloads/timvw-0.8.0.zip) · [Component guide](https://timvw.github.io/timvw-design-system/guide.html) · [Selective imports and native templates](MODULES.md) · [Reusable HTML tags](https://timvw.github.io/timvw-design-system/examples/custom-elements.html) · [Upgrade guide](MIGRATING.md)


For packaged tags, import once and write ordinary HTML:

```html
<script type="module" src="./components/dialog.js"></script>
<tvw-dialog open-label="Open project">
  <h2 slot="heading">Project Atlas</h2>
  <p>Your project details.</p>
</tvw-dialog>
```

The import supplies HTML, CSS, behavior and registration. Copy the `components/`
directory from the ZIP; no separate stylesheet or initialization is required.
[Try the live demo](https://timvw.github.io/timvw-design-system/examples/packaged-components.html)
or read [slots, forms and component modules](WEB_COMPONENTS.md).

For the existing class-based components, copy `css/timvw.css`, plus `css/components.css` for the extended components and `icons.svg` for icons. For interactive components, copy the runtime `js/` directory, keeping their relative paths. Keep [LICENSE](LICENSE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and the referenced upstream license with redistributed copies. Start from [starter.html](starter.html) or use this markup:

```html
<link rel="stylesheet" href="./css/timvw.css">
<link rel="stylesheet" href="./css/components.css">
<body class="tvw">
  <main>
    <h1>Hello, timvw.</h1>
    <button class="tvw-button" type="button">Continue</button>
  </main>
  <script type="module">
    import { init } from './js/timvw.js';
    init();
  </script>
</body>
```

Serve the directory with any static HTTP server to use JavaScript modules. For example, if Python is already installed:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080` for the component showcase. HTML and CSS also work from disk; browsers restrict JavaScript module loading on `file://` URLs. Python is just an optional local server, not a project dependency.

The showcase provides live examples and copyable source. `docs.css`, `demo-controls.css`, `js/docs.js`, and `js/demo-versions.js` belong only to the showcase; consumers don't need them. The sun, moon, and computer buttons select light, dark, or system appearance. Your choice is remembered across demo versions; system mode follows OS changes.

## Demo hosting

The showcase is published on [GitHub Pages](https://timvw.github.io/timvw-design-system/) from the root of the `main` branch. Pushing changes to `main` automatically updates the demo. `.nojekyll` keeps the files served as plain static assets; no project build command or dependencies are needed.

The header's version switcher links to the latest demo and frozen releases:

| Demo | Contents |
| --- | --- |
| [Latest](https://timvw.github.io/timvw-design-system/) | The current demo, updated from `main` |
| [v0.8.0](https://timvw.github.io/timvw-design-system/v0.8.0/) | One-import dialog/card components with native slots and encapsulated styles |
| [v0.7.0](https://timvw.github.io/timvw-design-system/v0.7.0/) | Reusable HTML tags, template registration and forced-color fixes |
| [v0.6.0](https://timvw.github.io/timvw-design-system/v0.6.0/) | Modular imports, native templates, localization and connected workflows |
| [v0.5.0](https://timvw.github.io/timvw-design-system/v0.5.0/) | Guided forms, searchable documentation, file states, chart and website patterns |
| [v0.4.0](https://timvw.github.io/timvw-design-system/v0.4.0/) | Application components and complete settings, projects, and dashboard examples |
| [v0.3.0](https://timvw.github.io/timvw-design-system/v0.3.0/) | QuantumBlack palette, version navigation, and theme icons |
| [v0.2.0](https://timvw.github.io/timvw-design-system/v0.2.0/) | QuantumBlack palette components |
| [v0.1.0](https://timvw.github.io/timvw-design-system/v0.1.0/) | Original blue palette components |

Each release folder contains its own component CSS, JavaScript, examples, and licenses. The archived demos received version navigation and theme icons when first archived; their component files match the recorded source revision. Component assets and examples are frozen after publication; the release-navigation markup is maintained separately. All version pickers load the shared root `releases.json` through `js/demo-versions.js`, so archived pages display the current latest release and available versions. Without JavaScript or when the catalog cannot load, the static “Latest” link still leads to the current demo without displaying an outdated version number. `release.json` records the source commit and current file checksums; navigation-only corrections retain the initial publication checksums in `initial_published_sha256`.

Maintainers can create future snapshots with the optional Python standard-library utility documented in [CONTRIBUTING.md](CONTRIBUTING.md). It is not needed to use or serve the design system.

## Components

Start with the [searchable component explorer](explore.html), including an icon browser and theme-token reference. [Workflow components](patterns.html) add searchable selects/multi-selects, skeletons and recovery states, multi-step forms, file selection/upload states, avatars, grouped navigation, column visibility, expandable table rows, and SVG charts. Try the [guided project creation](examples/create.html) and [website template](examples/website.html).

[Extended component reference](components.html) provides copyable examples for icons, button sizes and loading states, switches, segmented controls, theme pickers, breadcrumbs, pagination, empty states, warning/info feedback, richer inputs, validation, menus, popovers, tooltips, drawers, notifications, interactive tables, and responsive application layouts. See [COMPONENTS.md](COMPONENTS.md) for their markup contracts, APIs, and keyboard behavior.

Complete examples combine these patterns: [Settings](examples/settings.html), [Projects](examples/projects.html), and [Dashboard](examples/dashboard.html). They use local sample data and optional browser storage. The project example supports creation, status/progress editing, search, filters, numeric/date sorting, pagination, selection, deletion, and JSON download. No backend is needed; these are examples of browser interactions, not an authentication or production data service.

The original foundation remains available:

| Component | Markup / class | Behavior |
| --- | --- | --- |
| Buttons and links | `.tvw-button`, `--secondary`, `--quiet` modifiers | Native; application supplies actions |
| Form controls | `.tvw-field`, `.tvw-input`, `.tvw-help`, `.tvw-error` | Native inputs, selects, textareas |
| Checkboxes and radios | `.tvw-choice`, `.tvw-fieldset` | Native selection and grouping |
| Cards | `.tvw-card` | HTML and CSS |
| Badges and notices | `.tvw-badge`, `.tvw-notice` | Success and danger modifiers |
| Tables | `.tvw-table-wrap`, `.tvw-table` | Scrollable wrapper |
| Navigation | `.tvw-nav` | Links, with `aria-current="page"` for the current page |
| Accordions | `details.tvw-accordion` with `summary` | Native disclosure |
| Tabs | `.tvw-tabs[data-tvw-tabs]` | Optional module: selection, ARIA, keyboard |
| Dialogs | `dialog.tvw-dialog` | Native modal; optional module opens and restores focus |
| Progress | `progress.tvw-progress` | Native progress element |

Use complete examples from [index.html](index.html), including their labels and relationships. When using an example more than once, change all IDs and matching `for`, `aria-controls`, `aria-labelledby`, and `aria-describedby` references.

## Theme and layout

The stylesheet exposes `--tvw-*` custom properties on `:root`. Add overrides in your stylesheet after the library:

```css
:root {
  --tvw-radius: .25rem;
  --tvw-font: system-ui, sans-serif;
}
```

Set `data-tvw-theme="dark"` on `<html>` for dark mode; omit it or set `light` for light mode. The library defaults to light. Initializing a `[data-tvw-theme-picker]` or calling `setTheme()` enables remembered light/dark/system selection; all pickers stay synchronized and system mode follows OS changes. See [COMPONENTS.md](COMPONENTS.md) for the reusable picker.

Color tokens include `bg`, `surface`, `subtle`, `text`, `muted`, `border`, `control-border`, `accent`, `accent-hover`, `on-accent`, `link`, `highlight`, `on-highlight`, `focus`, `success`, `danger`, `warning`, and `info`, each prefixed with `--tvw-`. `--tvw-accent` controls monochrome action fills; `--tvw-link` supplies readable blue/cyan text; `--tvw-highlight` is the decorative cyan. Muted text and input borders use adjusted opacity for contrast on our surfaces. Spacing tokens are `--tvw-space-1`, `2`, `3`, `4`, `6`, `8`, and `12`, based on quarter-rem increments. Typography, radius, and shadow also have tokens.

`.tvw-stack` creates a vertical grid; `.tvw-cluster` creates a wrapping horizontal group. Both use spacing tokens. `.tvw-muted`, `.tvw-sr-only`, and `.tvw-skip` cover secondary text, visually hidden labels, and skip links.

Base element styles are scoped to `.tvw`. Component classes use the `tvw-` prefix. For these class-based components, tokens and `color-scheme` are document-level. The optional packaged tags use Shadow DOM and inherit public tokens. CSS layers are ordered `timvw.tokens`, `timvw.base`, `timvw.components`, and `timvw.utilities`. Unlayered application styles can override them.

## JavaScript API

```js
import { init } from './js/timvw.js';
init(); // Enhance descendants of document.
init(document.getElementById('new-content')); // Enhance descendants of a container.
```

Call `init()` after markup is available. Repeated calls on existing components are safe. The root itself is not selected; pass the parent container when adding a component. For table row updates, call `getTable(container).refresh()`. Otherwise, replacing a component's internal markup after initialization is not supported; replace the whole component and initialize its parent instead.

Tabs require a `data-tvw-tabs` container, a `data-tvw-tablist` with a label, and buttons with unique IDs and `aria-controls` pointing to panels inside the container. Keep the tablist `hidden` and all panels visible in the source. Initialization adds the tab roles, reveals the controls, and selects the first panel. Arrow keys use automatic activation; Home and End select the first and last tabs. Right-to-left direction and vertical tablists (`aria-orientation="vertical"`) are supported. Nested tabsets and disabled tabs are outside the initial component contract.

Dialog triggers use `data-tvw-open="dialog-id"` and start `hidden`. Give the native `<dialog>` an accessible name through `aria-labelledby`. Use a `form method="dialog"` close button. The browser handles modal focus containment and Escape; the module restores focus to the opener. Critical information or actions should also be available outside a dialog when JavaScript is unavailable.

## Accessibility and browser expectations

The foundation includes visible focus, reduced-motion and forced-color accommodations, native semantics, and keyboard support for enhanced controls. This is not an accessibility certification. Verify your content, contrast after customization, screen-reader behavior, and complete workflows.

Target browsers must support CSS cascade layers, custom properties, OKLCH colors, ES modules, and native `dialog.showModal()`. Extended components also use CSS `:has()` and the native Popover API. There are no polyfills. Accordions, form controls, and all tab content remain available without JavaScript; dialog triggers stay hidden. The showcase's copy button requires the Clipboard API and a secure context (HTTPS or localhost); source can always be selected manually.

See [QUALITY.md](QUALITY.md) for automated coverage, visual baselines, and pending manual audits, and [CONTRIBUTING.md](CONTRIBUTING.md) for a manual review checklist and the browser-native regression page in [tests/index.html](tests/index.html).

## License and inspiration

Copyright 2026 Tim Van Wassenhove. Licensed under [Apache-2.0](LICENSE).

The components are independently implemented. Color tokens are adapted from the [QuantumBlack Design System](https://github.com/mckinsey/quantumblack-design-system), Copyright 2026 McKinsey & Company, under Apache-2.0. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the pinned source and adaptations. No upstream component implementation or framework dependencies are included. [Plain Vanilla](https://plainvanillaweb.com/) informed the platform-first approach. This project is not affiliated with or endorsed by McKinsey & Company.
