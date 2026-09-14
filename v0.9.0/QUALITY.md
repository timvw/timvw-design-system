# Quality and accessibility

The design system uses native HTML semantics, visible focus, named controls, keyboard interactions, reduced-motion rules, and light/dark tokens. These are implementation choices, not an accessibility certification.

## Automated checks

GitHub Actions runs the following on pushes and pull requests:

- Local links, unique IDs, label/ARIA targets, relative module imports, component-catalogue links, and archived file checksums.
- Release-generation regression tests, including the unversioned Latest fallback and preservation of archived content.
- 28 browser-native component checks in Chromium, Firefox, and WebKit.
- Complete project creation, review, local persistence, expandable rows, column visibility, simulated upload failures/retries, documentation search, and archive-navigation workflows.
- Narrow-screen overflow and no-JavaScript fallback checks.
- Asynchronous validation and stale results, editing recovery, cancelled uploads, grouped remote options, URL filters, Dutch formatting, command navigation, safe template cloning and selective network imports.
- Automated axe-core 4.10.3 checks against WCAG A/AA rules on 17 current pages in both themes, plus error, grouped-option and open modal states. This covers rendered states exercised by the tests; it does not establish complete conformance.
- Chromium screenshot comparisons in both themes, including desktop and mobile compositions.
- Default packages: ready controllers after import, deduplicated selective CSS, automatic enhancement of added HTML, standalone ZIP starter and packaged playground output.
- Documentation navigation: independent wheel/keyboard scrolling, wrapped-header sizing, reachable lower links and mobile flow.
- Packaged Web Components: isolated one-import loading, native slot names/content, retained listeners and form values, validation/cancel/submitter semantics, reconnection, theme overrides, modal focus and narrow-screen actions.
- Reusable custom tags: existing and inserted instances, isolated IDs and form values, reactive text, native registry validation and connection cleanup.
- Forced-color state regressions with full/selective CSS, native modal accessibility semantics, and touch-event workflows. These are browser emulation checks, not physical-device or screen-reader sessions.

Browser tooling is installed in a temporary CI directory. It is not shipped with the site and is not needed to copy or use components. The site still has no runtime dependencies or build step.

## Visual baselines

Baselines use the official `mcr.microsoft.com/playwright:v1.57.0-noble` Linux container, Chromium, a fixed locale/timezone, and reduced motion. Screenshots compare against committed images in `tests/snapshots/`; the tolerance allows minor rendering differences, not arbitrary layout changes. Failed comparisons produce expected/actual/difference images and traces in the workflow artifact.

To propose intentional visual changes, dispatch **Design system checks** with `update_snapshots` enabled. Download the artifact, inspect the new screenshots, then commit the reviewed images. Updating baselines does not happen automatically in the repository. The first run bootstraps images for review when no baseline directory exists.

## Manual verification status

| Area | Current evidence | Remaining work |
| --- | --- | --- |
| Keyboard | Automated control and workflow coverage across three engines | Review keyboard use in each consuming application |
| Light/dark, narrow layouts and RTL | Browser checks, 200% text scaling and reviewed screenshots | Recheck customized palettes and application content |
| Reduced motion | CSS accommodation and deterministic visual checks | Review any animation added by a consumer |
| Forced colors | Reviewed Chromium emulation samples and regression checks for switches, theme selection and pagination | Manual Windows light/dark contrast-theme review parked: no Windows environment connected |
| Screen readers | Semantic markup, accessible-name relationships and modal/option browser semantics | VoiceOver/Safari parked by unavailable native desktop control; NVDA/Firefox parked by missing Windows environment |
| Touch | Synthetic touch activation and viewport-change checks | Real-device touch, screen-reader gestures and onscreen keyboard checks parked: no physical device connected |

Screen-reader results must record the operating system, browser, reader version, tested task, and observed result. Do not mark a component verified based solely on an automated check. The current release has no completed manual screen-reader audit.

The [2026-09-13 review and test plan](ACCESSIBILITY_REVIEW.md) records the findings, environment blockers and individual cases needed to finish these checks. These manual checks were deferred by the maintainer on 2026-09-13. No parked manual row has been marked passed.

## Component scope

- Comboboxes use local native-select options. Optgroups and asynchronous adapters are supported; virtualized large datasets are not.
- File validation checks client metadata. Actual upload, server validation and authorization belong to the consuming application. Cancellation signals must be respected by its upload adapter.
- Wizards apply native constraints and emit submission events. The separate form enhancer supports asynchronous/cross-field rules and server errors supplied by the consuming application.
- Tables work with modest HTML datasets; they are not spreadsheet grids or virtualized remote tables.
- Chart examples pair SVG with equivalent data tables; consumers must preserve that relationship when changing data.

See [COMPONENTS.md](COMPONENTS.md) for contracts and [CONTRIBUTING.md](CONTRIBUTING.md) for local verification and publishing.
