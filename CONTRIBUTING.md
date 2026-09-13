# Contributing

Keep the system plain: semantic HTML, CSS, and small JavaScript modules. Do not introduce a package manager, framework, bundler, transpiler, external fonts, or runtime dependencies into the published system. Maintainer checks may install pinned test tools in an isolated temporary directory.

For a component change:

1. Update the source in `css/` or `js/` and its live example in `index.html` or `components.html`. Update complete examples in `examples/` when affected.
2. Keep the copyable source synchronized with the example, including labels and IDs.
3. Prefer native browser behavior; add JavaScript only for behavior the platform does not provide directly.
4. Use semantic tokens and check both themes.
5. Update usage documentation when the public markup or API changes.

## Verification

Serve the repository using any static HTTP server. Open `/tests/` and run the browser-native regression checks. No test libraries or installation are needed. Run the tests in the browsers you intend to support.

Release-navigation regressions can also be checked with `python3 -m unittest discover -s scripts -p 'test_*.py'` (standard library only).

The regression page includes 28 checks covering tabs, dialogs, loading, themes, validation, tables, menus, tooltips, and notifications.

Also check the showcase and complete example pages manually:

- Navigate using Tab and Shift+Tab; focus must remain visible.
- Use Arrow keys, Home, and End in tabs; check the selected panel and focus.
- Open a dialog, cycle focus, close with Escape, and confirm focus returns to its opener.
- In menus, check arrows, Home/End, typeahead, Tab, and Escape; close a dialog opened from a menu and check focus returns to its visible trigger.
- Create, edit, filter, sort, select, paginate, delete, download, and restore projects. Check that dashboard data follows saved changes.
- Save/reset settings; repeat with browser storage unavailable.
- Use every native form control and accordion with the keyboard.
- Check the light and dark themes, a narrow viewport, 200% zoom, and forced colors where supported.
- Disable JavaScript: content and native controls should remain usable, with every tab panel readable.
- Test accessible names, reading order, announcements, and complete flows with a screen reader.
- Inspect color contrast after changing tokens. Do not claim conformance based only on automated checks.
- Confirm source examples can be copied into `starter.html` and work after updating duplicate IDs.

The project has no application build step. GitHub Actions installs pinned browser-test tooling in a temporary directory and runs static integrity checks, browser workflows, and visual comparisons. See [QUALITY.md](QUALITY.md) for baseline review and manual audit status. The regression page also tests behavior directly without installed test tools. Keep additions original, or explicitly document and comply with any third-party license before introducing third-party material.

## Browser automation

`tests/browser.config.cjs` runs the browser-native suite and complete workflows with Playwright 1.57.0. CI provisions its tools outside the repository. For local automation, provide `@playwright/test` from an isolated tooling directory through `NODE_PATH` (or set `PLAYWRIGHT_TEST_MODULE` to its entry point), then run the Playwright CLI with `test --config tests/browser.config.cjs`. The configuration starts a local Python HTTP server if needed. Visual checks are enabled with `VISUAL_TESTS=true` and require the pinned Linux baseline environment; other operating systems can run the behavior checks.

Run `python3 scripts/check-site.py` for local links and archived checksums. Keep `catalog.json` and the static cards in `explore.html` synchronized when adding components. The static catalogue remains readable without JavaScript.

## Publishing a demo version

Edit the current files at the repository root. Do not edit component code or examples inside existing `vMAJOR.MINOR.PATCH/` folders; they are frozen demos. Release-navigation markup is the exception: use `python3 scripts/demo-release.py --refresh-navigation` for navigation-only corrections. This updates only the version picker and shared navigation script reference, preserving the initial publication hashes and updating affected current checksums. Their `release.json` files identify the source revision and checksums. Versioned component CSS and JavaScript must match their recorded source revision.

To publish a new version:

1. Add an entry to `releases.json` and set its `latest` field to the new version.
2. Run `python3 scripts/demo-release.py --latest` to refresh the current demo's version navigation and label. The header template is `scripts/demo-header.html`.
3. Verify the current demo, then commit its source and updated catalog locally.
4. Run `python3 scripts/demo-release.py --version VERSION --ref HEAD`, replacing `VERSION` with the version number without a `v` prefix. This copies an explicit set of public files from the commit and adds the archive toolbar. It refuses to overwrite an existing release.
5. Verify the new snapshot and its local links, then commit the new release folder and push both commits together. GitHub Pages publishes the latest demo and all archives.

The helper uses only Python's standard library and Git. It is an optional release-maintenance utility; no tooling or build step is required by the published HTML, CSS, or JavaScript. All demos use the shared `js/demo-versions.js` to read the root `releases.json` with cache revalidation. New releases become available in archived menus without rebuilding their components. Static archived Latest links must not embed a version number. Verify the picker with a simulated future catalog and a failed request; both must retain the correct Latest destination. The shared navigation module must remain independent of any versioned component API.

## Maintaining v0.6.0

- Edit the canonical CSS, then run `python3 scripts/build-css.py`; `--check` verifies generated selective styles.
- Update the catalogue and component-guide JSON with their static HTML pages; run `python3 scripts/build-docs.py` to synchronize the generated sections.
- Update CHANGELOG.md and MIGRATING.md when a public contract changes.
- Run `python3 scripts/package-release.py` after runtime/documentation changes. `--check` verifies the downloadable payload. The bundle is deterministic and contains no browser tooling.
- Automated accessibility uses isolated `axe-core@4.10.3`. Set `AXE_TESTS=true` and optionally `AXE_CORE_PATH` to its `axe.min.js`; otherwise the runner resolves the installed package.
- Manual screen-reader/Windows/touch checks need the actual corresponding environment. Follow [ACCESSIBILITY_REVIEW.md](ACCESSIBILITY_REVIEW.md), record observed results there and update QUALITY.md; do not infer a pass from axe or browser emulation.
