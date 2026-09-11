# Third-party notices

## QuantumBlack Design System color tokens

Copyright 2026 McKinsey & Company.

Selected color tokens in `css/timvw.css` are adapted from the QuantumBlack Design System under the Apache License, Version 2.0. The full Apache license is included in [LICENSE](LICENSE); the upstream copyright, license statement, and trademark reservation are preserved in [third-party/quantumblack-LICENSE.txt](third-party/quantumblack-LICENSE.txt).

Source: [src/styles/globals.css](https://github.com/mckinsey/quantumblack-design-system/blob/f480249818885ec667f7089b890f1c8fe6563464/src/styles/globals.css), commit `f480249818885ec667f7089b890f1c8fe6563464`.

Adaptations by Tim Van Wassenhove:

- Selected mist, slate, cyan, sky, green, amber, and red values mapped to the smaller `--tvw-*` semantic token set.
- Mist-100 / white light surfaces and slate-900 / slate-800 dark surfaces; slate-950 / white primary actions.
- Separate link and decorative highlight tokens, with darker sky links and focus outlines in light mode for contrast.
- Adjusted muted-text and control-border opacity for this component set's surfaces; green-800 success text in light mode keeps badges readable on the subtle surface.
- Standalone native CSS declarations; no Tailwind directives, framework aliases, upstream component implementations, fonts, or logos imported.

No upstream `NOTICE` file was present in the source tree at the pinned revision. This document records the attribution and modifications for the selected palette material. It does not alter the Apache license or grant rights to McKinsey names, logos, or trademarks. This project is not affiliated with or endorsed by McKinsey & Company.

## GitHub mark (Octicons)

The `github` symbol in `icons.svg` uses Octicons’ `mark-github-16` SVG, Copyright (c) 2026 GitHub Inc., under the MIT License. The full license is preserved in [third-party/octicons-LICENSE.txt](third-party/octicons-LICENSE.txt).

Source: [mark-github-16.svg](https://github.com/primer/octicons/blob/d5d6d581a1f8ff88971979321e4953a23e08bbca/icons/mark-github-16.svg), commit `d5d6d581a1f8ff88971979321e4953a23e08bbca`. The path is unchanged; it is wrapped in an SVG symbol with inherited fill and no stroke. The mark identifies links to this project’s GitHub repository.
