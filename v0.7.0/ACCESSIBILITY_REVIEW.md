# Accessibility review · v0.7.0

This is a reproducible test plan and evidence record, not a conformance statement.
Use the [frozen v0.7.0 demo](https://timvw.github.io/timvw-design-system/v0.7.0/)
so that results continue to identify the same implementation after later releases.

## Status on 2026-09-13

| Check | Status | Evidence / blocker |
| --- | --- | --- |
| Forced-color control states | Automated regression added; rendered samples reviewed | Chromium emulation, light/dark system palettes, full and selective CSS |
| Modal and grouped option semantics | Automated regression added | Browser accessibility names, description, selected option, background exclusion, keyboard focus return |
| Touch interactions | Automated regression added | Synthetic touch events and viewport resizing; no physical device or onscreen keyboard |
| VoiceOver + Safari on macOS | **Parked, not tested** | Native desktop service could not start; System Events returned -10810 on macOS 26.6.2 |
| NVDA + Firefox on Windows | **Parked, not tested** | No Windows test environment connected |
| Windows contrast themes | **Parked, not tested** | No Windows test environment connected |
| Physical iPhone + Safari / Android + Chrome | **Parked, not tested** | No physical mobile test device connected |

Browser checks cannot establish the spoken output, virtual cursor behavior,
operating-system contrast palette, soft-keyboard geometry, or physical touch usability.
Leave parked rows open until the sessions below have actual observations.

The review found and fixed an invisible switch thumb in the off state and an
indistinguishable pressed theme button in forced colors. The common button border
rule had overridden the theme's selected border through CSS layer precedence.
Current pagination now also has an outline that survives background replacement.
The fixes are included in both full and generated selective CSS.

Manual platform sessions were explicitly deferred by the maintainer on 2026-09-13.
The cases below remain available for a later review.

## Record each session

Copy this record for every device / browser / reader combination. Record **pass**,
**fail**, **blocked** or **not tested** for each case. A pass needs an observed result;
an expected result alone is not evidence. For a failure, include the case ID,
reproduction steps, observed speech or screenshot, and the commit containing any fix.
Retest a fix in the environment that exposed it before closing the finding.

```text
Date and tester:
Demo URL and version / source commit (see release.json):
Device model, OS version:
Browser and version:
Screen reader and version (or none):
Language, zoom, contrast theme, relevant custom settings:
Case ID | Result | Observed behavior / spoken output | Evidence / issue
```

## Desktop screen readers

Run SR1–SR8 with **VoiceOver + Safari on macOS** and separately with
**NVDA + Firefox on Windows**. Use synthetic example data. Start each case from
its page URL, let the page finish loading, and use keyboard / screen-reader
navigation rather than mouse clicks. Check both ordinary Tab navigation and the
reader's document navigation; correct DOM focus alone does not prove a pass.

On macOS, use the VoiceOver web rotor for headings, landmarks, and controls, and
its interaction commands for compound widgets. Apple documents the current
[VoiceOver web commands](https://support.apple.com/en-ca/guide/voiceover/vo27972/mac).
For NVDA, use browse mode for page navigation and focus mode for editing controls;
`NVDA+Space` toggles modes. See the official
[NVDA User Guide](https://download.nvaccess.org/documentation/en/userGuide.html#BrowseMode).
Record custom key bindings and verbosity settings if used.

| ID | Page and action | Expected observable result |
| --- | --- | --- |
| SR1 | [Components](https://timvw.github.io/timvw-design-system/v0.7.0/components.html): activate Skip to content, navigate headings and landmarks | Main content is reached; headings and navigation names provide an understandable reading order; decorative icons are silent |
| SR2 | Components → Switches, Segmented choices, Theme picker: toggle enabled controls and visit disabled ones in reading mode | Name, role, on/off or selected/pressed state are communicated; disabled controls cannot be activated; state changes are understandable |
| SR3 | [Templates](https://timvw.github.io/timvw-design-system/v0.7.0/examples/templates.html): open Project 2, read and tab through it, close; add and open Project 3 | Correct dialog name and description; background controls are excluded from modal navigation; Close is reachable; close returns to the matching opener |
| SR4 | [Workflows](https://timvw.github.io/timvw-design-system/v0.7.0/examples/workflows.html): submit an empty workspace name; follow the error link; enter `taken`, then `offline`, then a unique name and valid dates | Error summary is found and understandable; error link focuses the named invalid field; field help remains available; service failure preserves the draft; success/unsaved status is discoverable |
| SR5 | Workflows → Find a teammate: search `alex`, explore the Design group, choose Alex Rivera; search `fail`, then `alex` | Name, expanded state, group and active option are communicated; committed selection is clear; loading, failure and recovery are discoverable without moving focus unexpectedly |
| SR6 | Components → Actions menu: open, navigate enabled items, show notification, read it and dismiss it; repeat with tooltip and Escape | Disabled item cannot activate; menu navigation and focus return work; status message is announced without stealing focus; tooltip description is available and dismissible |
| SR7 | Workflows → inline edit: enter `offline`, save, correct and save; [Guide](https://timvw.github.io/timvw-design-system/v0.7.0/guide.html) → Go to…: search Playground and activate it | Failed edit preserves and identifies the draft; saved value and activity update are discoverable; command dialog results are named, reachable links |
| SR8 | [Dutch example](https://timvw.github.io/timvw-design-system/v0.7.0/examples/localized.html?lang=nl): read controls, submit empty form, change page; [Create project](https://timvw.github.io/timvw-design-system/v0.7.0/examples/create.html): complete the steps with Back/Continue | Dutch labels/errors and number/date formatting are understandable; pagination announces the result change; current wizard step is clear and values survive Back/Continue |

## Windows contrast themes

Run HC1–HC3 in **Edge and Firefox on Windows**, first with a light contrast theme,
then with a dark contrast theme. Use the operating-system setting, not only browser
developer-tools emulation. Enable it under Settings → Accessibility → Contrast
themes; see Microsoft's [contrast instructions](https://support.microsoft.com/en-us/accessibility/windows/change-color-contrast-in-windows).
Record the exact theme and any customized colors. Restore the original preference
when finished.

| ID | Action | Expected observable result |
| --- | --- | --- |
| HC1 | Components → toggle switch on/off; inspect the disabled switch, theme picker, segmented choices and pagination | Switch thumb is visible in each state; disabled state remains identifiable; selected theme/segment/page differs from other choices without relying only on background fill |
| HC2 | Tab through buttons, invalid inputs, tabs and menus; open a dialog and combobox | Focus remains visible; input boundaries, selected tab/option and modal boundaries are distinguishable; icons retain meaningful shapes |
| HC3 | Patterns → inspect chart and equivalent table, loading/empty/error states; zoom to 200% and repeat HC1 | Information remains available when colors are replaced; table is readable; no clipped labels or unreachable actions |

## Physical mobile devices

Run T1–T4 on a **physical iPhone with Safari** and a **physical Android device with
Chrome**. Record device, OS and browser versions. Test portrait and landscape;
retain pinch zoom and use the actual onscreen keyboard. Do not substitute a narrow
desktop viewport for these checks.

| ID | Action | Expected observable result |
| --- | --- | --- |
| T1 | Components → tap switch label, open Actions and choose notification, reveal tooltip, tap outside and reopen it | Reliable activation without hover; touch targets are usable; closing and reopening does not leave an inaccessible overlay |
| T2 | Workflows → open Find a teammate, type `alex` with the onscreen keyboard, scroll options, select Alex; repeat in landscape | Input and selectable results remain reachable above/around the keyboard; scrolling does not accidentally select; committed value survives keyboard dismissal |
| T3 | Templates → open Project 2, rotate, pinch zoom, scroll and close; create and open another instance | Close remains reachable and named; no background interaction while modal; zoom and rotation preserve content and the correct instance |
| T4 | Workflows → choose a small text file through the native picker, simulate upload, cancel and retry; use the form's native date inputs | Picker can be opened and cancelled; chosen file appears; cancellation/retry status is understandable; dates and form actions remain usable |

With VoiceOver on iOS and TalkBack on Android, also repeat T1–T3 using the reader's
explore, next/previous and activation gestures. Record these separately from ordinary
touch. Official references: [Apple VoiceOver gestures](https://support.apple.com/guide/iphone/use-voiceover-gestures-iph3e2e2281/ios)
and [Google TalkBack gestures](https://support.google.com/accessibility/android/answer/6151827?hl=en).

## Automated reproduction

Run `tests/usability.spec.cjs` with the maintainer Playwright configuration described
in [CONTRIBUTING.md](CONTRIBUTING.md). It exercises full/selective forced-color CSS,
native modal semantics, grouped option selection, touch-event activation and
viewport changes. Forced-color runs attach rendered switch, theme and pagination
samples to the HTML test report. CI also runs the existing axe, keyboard/workflow,
bundle and visual regression suites. Inspect the workflow's report artifact for
the exact run and results; skipped platform-specific tests are not passes.
