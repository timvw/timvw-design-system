# Contributing

Keep the system plain: semantic HTML, CSS, and small JavaScript modules. Do not introduce a package manager, framework, bundler, transpiler, external fonts, or runtime dependencies.

For a component change:

1. Update the source in `css/` or `js/` and its live example in `index.html`.
2. Keep the copyable source synchronized with the example, including labels and IDs.
3. Prefer native browser behavior; add JavaScript only for behavior the platform does not provide directly.
4. Use semantic tokens and check both themes.
5. Update usage documentation when the public markup or API changes.

## Verification

Serve the repository using any static HTTP server. Open `/tests/` and run the browser-native regression checks. No test libraries or installation are needed. Run the tests in the browsers you intend to support.

Also check the showcase manually:

- Navigate using Tab and Shift+Tab; focus must remain visible.
- Use Arrow keys, Home, and End in tabs; check the selected panel and focus.
- Open a dialog, cycle focus, close with Escape, and confirm focus returns to its opener.
- Use every native form control and accordion with the keyboard.
- Check the light and dark themes, a narrow viewport, 200% zoom, and forced colors where supported.
- Disable JavaScript: content and native controls should remain usable, with every tab panel readable.
- Test accessible names, reading order, announcements, and complete flows with a screen reader.
- Inspect color contrast after changing tokens. Do not claim conformance based only on automated checks.
- Confirm source examples can be copied into `starter.html` and work after updating duplicate IDs.

The initial release has no build step or CI framework. The regression page tests behavior in the browser directly. Keep additions original, or explicitly document and comply with any third-party license before introducing third-party material.
