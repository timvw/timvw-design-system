# Quality and accessibility

The design system uses native HTML semantics, visible focus, named controls, keyboard interactions, reduced-motion rules, and light/dark tokens. These are implementation choices, not an accessibility certification.

## Automated checks

GitHub Actions runs the following on pushes and pull requests:

- Local links, unique IDs, label/ARIA targets, relative module imports, component-catalogue links, and archived file checksums.
- Release-generation regression tests, including the unversioned Latest fallback and preservation of archived content.
- 28 browser-native component checks in Chromium, Firefox, and WebKit.
- Complete project creation, review, local persistence, expandable rows, column visibility, simulated upload failures/retries, documentation search, and archive-navigation workflows.
- Narrow-screen overflow and no-JavaScript fallback checks.
- Chromium screenshot comparisons in both themes, including desktop and mobile compositions.

Browser tooling is installed in a temporary CI directory. It is not shipped with the site and is not needed to copy or use components. The site still has no runtime dependencies or build step.

## Visual baselines

Baselines use Ubuntu 24.04, Playwright 1.57.0, Chromium, a fixed locale/timezone, and reduced motion. Screenshots compare against committed images in `tests/snapshots/`; the tolerance allows minor rendering differences, not arbitrary layout changes. Failed comparisons produce expected/actual/difference images and traces in the workflow artifact.

To propose intentional visual changes, dispatch **Design system checks** with `update_snapshots` enabled. Download the artifact, inspect the new screenshots, then commit the reviewed images. Updating baselines does not happen automatically in the repository. The first run bootstraps images for review when no baseline directory exists.

## Manual verification status

| Area | Current evidence | Remaining work |
| --- | --- | --- |
| Keyboard | Automated control and workflow coverage across three engines | Review keyboard use in each consuming application |
| Light/dark and narrow layouts | Browser checks and reviewed screenshots | Recheck customized palettes and application content |
| Reduced motion | CSS accommodation and deterministic visual checks | Review any animation added by a consumer |
| Forced colors | Component CSS accommodations | Manual Windows high-contrast review pending |
| Screen readers | Semantic markup and accessible-name relationships | VoiceOver/Safari and NVDA/Firefox manual sessions pending |
| Touch | Native inputs and pointer controls; responsive layouts | Real-device touch testing pending |

Screen-reader results must record the operating system, browser, reader version, tested task, and observed result. Do not mark a component verified based solely on an automated check. The current release has no completed manual screen-reader audit.

## Component scope

- Comboboxes use local native-select options. Large remote datasets and grouped option headings are not supported.
- File validation checks client metadata. Actual upload, server validation, cancellation, and authorization belong to the consuming application.
- Wizards apply native constraints and emit submission events. Server and cross-field validation belong to the application.
- Tables work with modest HTML datasets; they are not spreadsheet grids or virtualized remote tables.
- Chart examples pair SVG with equivalent data tables; consumers must preserve that relationship when changing data.

See [COMPONENTS.md](COMPONENTS.md) for contracts and [CONTRIBUTING.md](CONTRIBUTING.md) for local verification and publishing.
