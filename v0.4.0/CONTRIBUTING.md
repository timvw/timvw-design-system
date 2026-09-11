# Contributing

Keep the system plain: semantic HTML, CSS, and small JavaScript modules. Do not introduce a package manager, framework, bundler, transpiler, external fonts, or runtime dependencies.

For a component change:

1. Update the source in `css/` or `js/` and its live example in `index.html` or `components.html`. Update complete examples in `examples/` when affected.
2. Keep the copyable source synchronized with the example, including labels and IDs.
3. Prefer native browser behavior; add JavaScript only for behavior the platform does not provide directly.
4. Use semantic tokens and check both themes.
5. Update usage documentation when the public markup or API changes.

## Verification

Serve the repository using any static HTTP server. Open `/tests/` and run the browser-native regression checks. No test libraries or installation are needed. Run the tests in the browsers you intend to support.

The regression page includes 20 checks covering tabs, dialogs, loading, themes, validation, tables, menus, tooltips, and notifications.

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

The project has no build step or CI framework. The regression page tests behavior in the browser directly. Keep additions original, or explicitly document and comply with any third-party license before introducing third-party material.

## Publishing a demo version

Edit the current files at the repository root. Do not edit files inside existing `vMAJOR.MINOR.PATCH/` folders; they are frozen demos. Their `release.json` files identify the source revision and checksums. Versioned component CSS and JavaScript must match their recorded source revision.

To publish a new version:

1. Add an entry to `releases.json` and set its `latest` field to the new version.
2. Run `python3 scripts/demo-release.py --latest` to refresh the current demo's version navigation and label. The header template is `scripts/demo-header.html`.
3. Verify the current demo, then commit its source and updated catalog locally.
4. Run `python3 scripts/demo-release.py --version VERSION --ref HEAD`, replacing `VERSION` with the version number without a `v` prefix. This copies an explicit set of public files from the commit and adds the archive toolbar. It refuses to overwrite an existing release.
5. Verify the new snapshot and its local links, then commit the new release folder and push both commits together. GitHub Pages publishes the latest demo and all archives.

The helper uses only Python's standard library and Git. It is an optional release-maintenance utility; no tooling or build step is required by the published HTML, CSS, or JavaScript. Existing archives retain their navigation snapshot; the Latest link always leads to the current release list.
